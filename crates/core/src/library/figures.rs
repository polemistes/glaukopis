//! Files of the library as figures: what an image holds, how large it is,
//! and the file a figure shows (ADR 0070).
//!
//! A figure names its file by the hash of what it holds. Every kind of
//! document that is made can hold PNG, JPEG and SVG, so a file of those kinds
//! is shown as it is. An image of another kind, GIF, WebP, TIFF or BMP, is
//! made into PNG, and a photograph that says it is to be turned before it is
//! shown is turned; what is made is a file of its own beside the one it was
//! made from, which stays as it was.

use std::io::Cursor;
use std::path::Path;

use image::{DynamicImage, ImageDecoder, ImageFormat, ImageReader};

use crate::error::{Error, Result};
use crate::tr;

/// The most one image may hold: what a server takes, unless it says otherwise.
pub const MAX_BYTES: u64 = 50 * 1024 * 1024;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum Kind {
    Png,
    Jpeg,
    Svg,
    /// A kind that is read, and shown as PNG.
    Other(ImageFormat),
}

/// Whether what a file holds is a drawing (SVG).
pub fn is_svg(bytes: &[u8]) -> bool {
    let head = &bytes[..bytes.len().min(8192)];
    let Ok(text) = std::str::from_utf8(head).or_else(|e| std::str::from_utf8(&head[..e.valid_up_to()])) else {
        return false;
    };
    let text = text.trim_start_matches('\u{feff}').trim_start();
    if !text.starts_with('<') {
        return false;
    }
    // What stands before the picture itself: the declaration, remarks, the kind of document.
    let mut rest = text;
    loop {
        rest = rest.trim_start();
        if rest.starts_with("<?") {
            let Some(end) = rest.find("?>") else { return false };
            rest = &rest[end + 2..];
        } else if rest.starts_with("<!--") {
            let Some(end) = rest.find("-->") else { return false };
            rest = &rest[end + 3..];
        } else if rest.starts_with("<!") {
            let Some(end) = rest.find('>') else { return false };
            rest = &rest[end + 1..];
        } else {
            break;
        }
    }
    let Some(tag) = rest.strip_prefix('<') else { return false };
    let name: String = tag.chars().take_while(|c| !c.is_whitespace() && *c != '>' && *c != '/').collect();
    name == "svg" || name.ends_with(":svg")
}

/// What kind of image the bytes are, by what they hold and not by a name.
pub(crate) fn kind_of(bytes: &[u8]) -> Option<Kind> {
    match image::guess_format(bytes) {
        Ok(ImageFormat::Png) => Some(Kind::Png),
        Ok(ImageFormat::Jpeg) => Some(Kind::Jpeg),
        Ok(f @ (ImageFormat::Gif | ImageFormat::WebP | ImageFormat::Tiff | ImageFormat::Bmp)) => Some(Kind::Other(f)),
        _ => is_svg(bytes).then_some(Kind::Svg),
    }
}

pub(crate) fn not_a_picture() -> Error {
    Error::invalid(tr!("core-pictures-not-a-picture"))
}

pub(crate) fn too_large() -> Error {
    Error::invalid(tr!("core-pictures-too-large", most = MAX_BYTES >> 20))
}

fn unreadable(e: image::ImageError) -> Error {
    Error::invalid(tr!("core-pictures-unreadable", error = e.to_string()))
}

pub(crate) fn decode(bytes: &[u8], format: ImageFormat) -> Result<(DynamicImage, bool)> {
    let mut decoder = ImageReader::with_format(Cursor::new(bytes), format).into_decoder().map_err(unreadable)?;
    let orientation = decoder.orientation().unwrap_or(image::metadata::Orientation::NoTransforms);
    let mut picture = DynamicImage::from_decoder(decoder).map_err(unreadable)?;
    let turned = orientation != image::metadata::Orientation::NoTransforms;
    if turned {
        picture.apply_orientation(orientation);
    }
    Ok((picture, turned))
}

pub(crate) fn encode(picture: &DynamicImage, format: ImageFormat) -> Result<Vec<u8>> {
    let mut out = Cursor::new(Vec::new());
    match format {
        ImageFormat::Jpeg => {
            // JPEG has neither transparency nor more than eight bits.
            let encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut out, 93);
            DynamicImage::ImageRgb8(picture.to_rgb8()).write_with_encoder(encoder).map_err(unreadable)?;
        }
        _ => picture.write_to(&mut out, ImageFormat::Png).map_err(unreadable)?,
    }
    Ok(out.into_inner())
}

pub(crate) fn dimensions(bytes: &[u8], format: ImageFormat) -> Option<(u32, u32)> {
    ImageReader::with_format(Cursor::new(bytes), format).into_dimensions().ok()
}

/// How large the image in a file is, in its pixels, read from its head
/// alone: nothing for a drawing, or for what cannot be read.
pub fn measure(path: &Path) -> Option<(u32, u32)> {
    ImageReader::open(path).ok()?.with_guessed_format().ok()?.into_dimensions().ok()
}

/// How large a drawing says it is: the width and height of its root, in
/// pixels where they are given so or without a unit, else those of its view
/// box. Nothing where neither can be read.
pub fn svg_size(bytes: &[u8]) -> Option<(f32, f32)> {
    let head = &bytes[..bytes.len().min(8192)];
    let text = String::from_utf8_lossy(head);
    let at = text.find("<svg").or_else(|| text.find(":svg"))?;
    let tag = &text[at..];
    let tag = &tag[..tag.find('>')?];
    let attribute = |name: &str| -> Option<&str> {
        let mut rest = tag;
        loop {
            let at = rest.find(name)?;
            let before = rest[..at].chars().last();
            rest = &rest[at + name.len()..];
            if !before.is_some_and(char::is_whitespace) {
                continue;
            }
            let value = rest.trim_start().strip_prefix('=')?.trim_start();
            let quote = value.chars().next()?;
            if quote != '"' && quote != '\'' {
                return None;
            }
            let value = &value[1..];
            return Some(&value[..value.find(quote)?]);
        }
    };
    let length = |value: &str| -> Option<f32> {
        let value = value.trim();
        let number = value.strip_suffix("px").unwrap_or(value);
        number.parse::<f32>().ok().filter(|n| n.is_finite() && *n > 0.0)
    };
    if let (Some(w), Some(h)) = (attribute("width").and_then(length), attribute("height").and_then(length)) {
        return Some((w, h));
    }
    let view: Vec<f32> = attribute("viewBox")?
        .split(|c: char| c.is_whitespace() || c == ',')
        .filter(|s| !s.is_empty())
        .filter_map(|s| s.parse().ok())
        .collect();
    match view[..] {
        [_, _, w, h] if w > 0.0 && h > 0.0 => Some((w, h)),
        _ => None,
    }
}

/// What a figure shows of a file: its content as it is to be stored, the
/// ending that says what kind that is, and how large the picture is.
pub type Prepared = (Vec<u8>, &'static str, Option<(u32, u32)>);

/// The content a figure shows of these bytes: the same bytes where they are
/// PNG, SVG, or a JPEG that stands upright; else PNG, or a JPEG turned
/// upright. An error where they are no image that can be read.
pub fn prepared(bytes: &[u8]) -> Result<Prepared> {
    match kind_of(bytes).ok_or_else(not_a_picture)? {
        Kind::Png => Ok((bytes.to_vec(), "png", dimensions(bytes, ImageFormat::Png))),
        Kind::Svg => Ok((bytes.to_vec(), "svg", None)),
        Kind::Jpeg => {
            // A photograph may say that it is to be turned before it is
            // shown. Not everything that sets a page heeds that: the picture
            // is turned here, once and for all.
            let upright = ImageReader::with_format(Cursor::new(bytes), ImageFormat::Jpeg)
                .into_decoder()
                .ok()
                .and_then(|mut d| d.orientation().ok())
                .is_none_or(|o| o == image::metadata::Orientation::NoTransforms);
            if upright {
                return Ok((bytes.to_vec(), "jpg", dimensions(bytes, ImageFormat::Jpeg)));
            }
            let (picture, _) = decode(bytes, ImageFormat::Jpeg)?;
            let size = (picture.width(), picture.height());
            Ok((encode(&picture, ImageFormat::Jpeg)?, "jpg", Some(size)))
        }
        Kind::Other(format) => {
            let (picture, _) = decode(bytes, format)?;
            let size = (picture.width(), picture.height());
            Ok((encode(&picture, ImageFormat::Png)?, "png", Some(size)))
        }
    }
}

/// A picture made smaller, for where it is only looked at: no wider than
/// `widest` points. Nothing, when it is small already, is a drawing, or
/// cannot be read.
pub fn lighter(bytes: &[u8], extension: &str, widest: u32) -> Option<Vec<u8>> {
    let format = match extension {
        "png" => ImageFormat::Png,
        "jpg" | "jpeg" => ImageFormat::Jpeg,
        _ => return None,
    };
    let (width, _) = dimensions(bytes, format)?;
    if width <= widest {
        return None;
    }
    let (picture, _) = decode(bytes, format).ok()?;
    let height = (u64::from(picture.height()) * u64::from(widest) / u64::from(picture.width())).max(1) as u32;
    let small = picture.resize_exact(widest, height, image::imageops::FilterType::Triangle);
    encode(&small, format).ok()
}

/// The name as it is shown: without what leads to the file, and with the
/// ending of what is kept.
pub fn shown_name(name: &str, extension: &str) -> String {
    let name = name.rsplit(['/', '\\']).next().unwrap_or(name).trim();
    let stem = match name.rsplit_once('.') {
        Some((stem, end)) if !stem.is_empty() && end.len() <= 5 => stem,
        _ => name,
    };
    let stem: String = stem.chars().filter(|c| !c.is_control()).take(120).collect();
    if stem.is_empty() {
        format!("{}.{extension}", tr!("core-pictures-unnamed"))
    } else {
        format!("{stem}.{extension}")
    }
}

#[cfg(test)]
pub(crate) mod fixtures {
    /// A picture of four points by three, in one colour.
    pub const PNG: [u8; 73] = [
        137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 4, 0, 0, 0, 3, 8, 2, 0, 0, 0, 59, 150,
        57, 145, 0, 0, 0, 16, 73, 68, 65, 84, 120, 218, 99, 56, 17, 160, 1, 71, 12, 56, 57, 0, 44, 54, 15, 1, 74, 169,
        232, 210, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
    ];

    pub const SVG: &str = "<?xml version=\"1.0\"?>\n<!-- a circle -->\n<svg xmlns=\"http://www.w3.org/2000/svg\" \
                           width=\"120\" height=\"80\" viewBox=\"0 0 120 80\"><circle cx=\"60\" cy=\"40\" r=\"30\" \
                           fill=\"#a33\"/></svg>";
}

#[cfg(test)]
mod tests {
    use super::fixtures::{PNG, SVG};
    use super::*;

    #[test]
    fn what_is_a_drawing() {
        assert!(is_svg(SVG.as_bytes()));
        assert!(is_svg(b"\xef\xbb\xbf<svg xmlns=\"http://www.w3.org/2000/svg\"/>"));
        assert!(is_svg(b"<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"x\"><svg:svg/>"));
        assert!(!is_svg(b"<svgx/>"));
        assert!(!is_svg(b"svg"));
        assert!(!is_svg(b"<?xml version=\"1.0\"?><html/>"));
    }

    #[test]
    fn what_a_figure_shows_of_an_image() {
        assert_eq!(prepared(&PNG).unwrap(), (PNG.to_vec(), "png", Some((4, 3))));
        assert_eq!(prepared(SVG.as_bytes()).unwrap(), (SVG.as_bytes().to_vec(), "svg", None));
        let picture = DynamicImage::ImageRgb8(image::RgbImage::from_pixel(6, 5, image::Rgb([10, 120, 200])));
        for format in [ImageFormat::Gif, ImageFormat::Bmp, ImageFormat::Tiff, ImageFormat::WebP] {
            let mut bytes = Cursor::new(Vec::new());
            picture.write_to(&mut bytes, format).unwrap();
            let (made, ending, size) = prepared(bytes.get_ref()).unwrap();
            assert_eq!((ending, size), ("png", Some((6, 5))), "{format:?}");
            let read = image::load_from_memory(&made).unwrap();
            assert_eq!(read.to_rgb8().get_pixel(3, 3).0, [10, 120, 200], "{format:?}");
        }
        // A photograph stays what it is.
        let mut bytes = Cursor::new(Vec::new());
        picture.write_to(&mut bytes, ImageFormat::Jpeg).unwrap();
        assert_eq!(prepared(bytes.get_ref()).unwrap().0, *bytes.get_ref());
        assert!(prepared(b"not a picture at all").is_err());
        assert!(prepared(b"<html><body><svg/></body></html>").is_err());
        assert!(prepared(b"").is_err());
    }

    #[test]
    fn a_large_picture_is_made_lighter_for_looking_at() {
        let picture = DynamicImage::ImageRgb8(image::RgbImage::from_fn(900, 600, |x, y| {
            image::Rgb([(x % 256) as u8, (y % 256) as u8, ((x + y) % 256) as u8])
        }));
        for (format, extension) in [(ImageFormat::Png, "png"), (ImageFormat::Jpeg, "jpg")] {
            let mut bytes = Cursor::new(Vec::new());
            picture.write_to(&mut bytes, format).unwrap();
            let small = lighter(bytes.get_ref(), extension, 300).unwrap();
            assert_eq!(dimensions(&small, format), Some((300, 200)), "{extension}");
            assert!(small.len() < bytes.get_ref().len());
            assert_eq!(lighter(bytes.get_ref(), extension, 900), None, "it is small enough as it is");
        }
        assert_eq!(lighter(SVG.as_bytes(), "svg", 10), None);
        assert_eq!(lighter(b"nothing", "png", 10), None);
    }

    #[test]
    fn the_size_of_an_image_is_read_from_its_head() {
        let tmp = tempfile::tempdir().unwrap();
        let png = tmp.path().join("a.png");
        std::fs::write(&png, PNG).unwrap();
        assert_eq!(measure(&png), Some((4, 3)));
        // A name that lies about the kind is not believed.
        let named = tmp.path().join("b.jpg");
        std::fs::write(&named, PNG).unwrap();
        assert_eq!(measure(&named), Some((4, 3)));
        let svg = tmp.path().join("c.svg");
        std::fs::write(&svg, SVG).unwrap();
        assert_eq!(measure(&svg), None);
        assert_eq!(measure(&tmp.path().join("none.png")), None);
    }

    #[test]
    fn a_drawing_says_how_large_it_is() {
        assert_eq!(svg_size(SVG.as_bytes()), Some((120.0, 80.0)));
        assert_eq!(svg_size(b"<svg viewBox='0 0 300 150' xmlns='http://www.w3.org/2000/svg'/>"), Some((300.0, 150.0)));
        assert_eq!(svg_size(b"<svg width=\"100%\" viewBox=\"0,0,40,20\"/>"), Some((40.0, 20.0)));
        assert_eq!(svg_size(b"<svg stroke-width=\"2\" width=\"64px\" height=\"32\"/>"), Some((64.0, 32.0)));
        assert_eq!(svg_size(b"<svg/>"), None);
        assert_eq!(svg_size(b"not a drawing"), None);
    }

    #[test]
    fn a_name_is_shown_with_the_ending_of_what_is_kept() {
        assert_eq!(shown_name("/home/someone/A vase.PNG", "png"), "A vase.png");
        assert_eq!(shown_name("C:\\pictures\\photo.jpeg", "jpg"), "photo.jpg");
        assert_eq!(shown_name("  ", "svg"), "image.svg");
    }
}
