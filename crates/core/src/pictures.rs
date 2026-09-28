//! The pictures of a project.
//!
//! A figure names its picture by the SHA-256 of what the file holds, and the
//! file lies with the project:
//!
//! ```text
//! projects/<id>/files/<hash>.<extension>
//! ```
//!
//! So the same picture is kept once however often it is used, a picture that
//! was changed is another picture, and what came from someone else can be
//! told to be what it is said to be.
//!
//! Three kinds are kept: PNG, JPEG and SVG, which every kind of document
//! that is made can hold. Pictures of other kinds are made into PNG when
//! they are taken in.

use std::fs;
use std::io::Cursor;
use std::path::{Path, PathBuf};

use image::{DynamicImage, ImageDecoder, ImageFormat, ImageReader};
use serde::Serialize;

use crate::error::{Error, IoContext, Result};
use crate::fsutil::write_atomic;
use crate::library::attachments::hash_bytes;

/// The directory name under the directory of the project.
pub const DIR: &str = "files";

/// The most one picture may hold: what a server takes, unless it says otherwise.
pub const MAX_BYTES: u64 = 50 * 1024 * 1024;

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Picture {
    pub hash: String,
    pub extension: String,
    /// What the file was called when it was taken in.
    pub name: String,
    pub size: u64,
    /// In points of the picture itself, where that can be told.
    pub width: Option<u32>,
    pub height: Option<u32>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Kind {
    Png,
    Jpeg,
    Svg,
    /// A kind that is read, and kept as PNG.
    Other(ImageFormat),
}

fn is_svg(bytes: &[u8]) -> bool {
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

fn kind_of(bytes: &[u8]) -> Option<Kind> {
    match image::guess_format(bytes) {
        Ok(ImageFormat::Png) => Some(Kind::Png),
        Ok(ImageFormat::Jpeg) => Some(Kind::Jpeg),
        Ok(f @ (ImageFormat::Gif | ImageFormat::WebP | ImageFormat::Tiff | ImageFormat::Bmp)) => Some(Kind::Other(f)),
        _ => is_svg(bytes).then_some(Kind::Svg),
    }
}

fn not_a_picture() -> Error {
    Error::invalid("the file is not a picture of a kind that can be used: PNG, JPEG, SVG, GIF, WebP, TIFF or BMP")
}

fn unreadable(e: image::ImageError) -> Error {
    Error::invalid(format!("the picture could not be read: {e}"))
}

fn decode(bytes: &[u8], format: ImageFormat) -> Result<(DynamicImage, bool)> {
    let mut decoder = ImageReader::with_format(Cursor::new(bytes), format).into_decoder().map_err(unreadable)?;
    let orientation = decoder.orientation().unwrap_or(image::metadata::Orientation::NoTransforms);
    let mut picture = DynamicImage::from_decoder(decoder).map_err(unreadable)?;
    let turned = orientation != image::metadata::Orientation::NoTransforms;
    if turned {
        picture.apply_orientation(orientation);
    }
    Ok((picture, turned))
}

fn encode(picture: &DynamicImage, format: ImageFormat) -> Result<Vec<u8>> {
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

fn dimensions(bytes: &[u8], format: ImageFormat) -> Option<(u32, u32)> {
    ImageReader::with_format(Cursor::new(bytes), format).into_dimensions().ok()
}

/// What is kept of a file: its content as it is stored, the ending that
/// says what kind that is, and how large the picture is.
type Prepared = (Vec<u8>, &'static str, Option<(u32, u32)>);

fn prepared(bytes: &[u8]) -> Result<Prepared> {
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

pub fn is_hash(text: &str) -> bool {
    text.len() == 64 && text.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}

fn is_extension(text: &str) -> bool {
    matches!(text, "png" | "jpg" | "svg")
}

/// The pictures of one project.
#[derive(Debug, Clone)]
pub struct Pictures {
    dir: PathBuf,
}

impl Pictures {
    /// `project` is the directory of the project.
    pub fn of(project: &Path) -> Self {
        Pictures { dir: project.join(DIR) }
    }

    pub fn dir(&self) -> &Path {
        &self.dir
    }

    pub fn path(&self, hash: &str, extension: &str) -> Result<PathBuf> {
        if !is_hash(hash) || !is_extension(extension) {
            return Err(Error::invalid("this does not name a picture"));
        }
        Ok(self.dir.join(format!("{hash}.{extension}")))
    }

    pub fn has(&self, hash: &str, extension: &str) -> bool {
        self.path(hash, extension).is_ok_and(|p| p.is_file())
    }

    pub fn read(&self, hash: &str, extension: &str) -> Result<Vec<u8>> {
        let path = self.path(hash, extension)?;
        match fs::read(&path) {
            Ok(bytes) => Ok(bytes),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Err(Error::not_found("the picture")),
            Err(e) => Err(Error::io(format!("reading {}", path.display()), e)),
        }
    }

    /// Takes a picture in. The name is what it was called, and is not what
    /// it is kept by.
    pub fn add(&self, name: &str, bytes: &[u8]) -> Result<Picture> {
        if bytes.len() as u64 > MAX_BYTES {
            return Err(too_large());
        }
        let (content, extension, size) = prepared(bytes)?;
        if content.len() as u64 > MAX_BYTES {
            return Err(too_large());
        }
        let hash = hash_bytes(&content);
        let path = self.path(&hash, extension)?;
        if !path.is_file() {
            fs::create_dir_all(&self.dir).context(|| format!("creating {}", self.dir.display()))?;
            write_atomic(&path, &content)?;
        }
        Ok(Picture {
            hash,
            extension: extension.to_owned(),
            name: shown_name(name, extension),
            size: content.len() as u64,
            width: size.map(|s| s.0),
            height: size.map(|s| s.1),
        })
    }

    pub fn add_from(&self, file: &Path) -> Result<Picture> {
        let size = fs::metadata(file).context(|| format!("reading {}", file.display()))?.len();
        if size > MAX_BYTES {
            return Err(too_large());
        }
        let bytes = fs::read(file).context(|| format!("reading {}", file.display()))?;
        let name = file.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
        self.add(&name, &bytes)
    }

    /// Keeps what came from elsewhere under the name it was asked for by, if
    /// it is that: a picture of a kind that is kept, holding what the name says.
    pub fn keep(&self, hash: &str, bytes: &[u8]) -> Result<Picture> {
        if !is_hash(hash) || hash_bytes(bytes) != hash {
            return Err(Error::invalid("what arrived is not the picture that was asked for"));
        }
        let (extension, size) = match kind_of(bytes) {
            Some(Kind::Png) => ("png", dimensions(bytes, ImageFormat::Png)),
            Some(Kind::Jpeg) => ("jpg", dimensions(bytes, ImageFormat::Jpeg)),
            Some(Kind::Svg) => ("svg", None),
            _ => return Err(not_a_picture()),
        };
        let path = self.path(hash, extension)?;
        if !path.is_file() {
            fs::create_dir_all(&self.dir).context(|| format!("creating {}", self.dir.display()))?;
            write_atomic(&path, bytes)?;
        }
        Ok(Picture {
            hash: hash.to_owned(),
            extension: extension.to_owned(),
            name: String::new(),
            size: bytes.len() as u64,
            width: size.map(|s| s.0),
            height: size.map(|s| s.1),
        })
    }

    /// The pictures that are here, as `(hash, extension, size)`, in order.
    pub fn list(&self) -> Vec<(String, String, u64)> {
        let Ok(entries) = fs::read_dir(&self.dir) else { return Vec::new() };
        let mut out: Vec<(String, String, u64)> = entries
            .flatten()
            .filter_map(|e| {
                let name = e.file_name().to_string_lossy().into_owned();
                let (hash, extension) = name.split_once('.')?;
                (is_hash(hash) && is_extension(extension))
                    .then(|| (hash.to_owned(), extension.to_owned(), e.metadata().map(|m| m.len()).unwrap_or(0)))
            })
            .collect();
        out.sort();
        out
    }

    /// Copies the pictures of another project here.
    pub fn copy_from(&self, other: &Pictures) -> Result<()> {
        for (hash, extension, _) in other.list() {
            let to = self.path(&hash, &extension)?;
            if !to.is_file() {
                fs::create_dir_all(&self.dir).context(|| format!("creating {}", self.dir.display()))?;
                let from = other.path(&hash, &extension)?;
                fs::copy(&from, &to).context(|| format!("copying {}", from.display()))?;
            }
        }
        Ok(())
    }
}

fn too_large() -> Error {
    Error::invalid(format!("the picture is larger than {} MB, which is the most a picture may be", MAX_BYTES >> 20))
}

/// The name as it is shown: without what leads to the file, and with the
/// ending of what is kept.
fn shown_name(name: &str, extension: &str) -> String {
    let name = name.rsplit(['/', '\\']).next().unwrap_or(name).trim();
    let stem = match name.rsplit_once('.') {
        Some((stem, end)) if !stem.is_empty() && end.len() <= 5 => stem,
        _ => name,
    };
    let stem: String = stem.chars().filter(|c| !c.is_control()).take(120).collect();
    if stem.is_empty() { format!("picture.{extension}") } else { format!("{stem}.{extension}") }
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

    fn pictures() -> (tempfile::TempDir, Pictures) {
        let tmp = tempfile::tempdir().unwrap();
        let p = Pictures::of(&tmp.path().join("project"));
        (tmp, p)
    }

    #[test]
    fn a_picture_is_kept_by_what_it_holds() {
        let (_tmp, p) = pictures();
        let a = p.add("/home/someone/A vase.PNG", &PNG).unwrap();
        assert_eq!(a.extension, "png");
        assert_eq!(a.name, "A vase.png");
        assert_eq!((a.width, a.height), (Some(4), Some(3)));
        assert_eq!(a.hash, hash_bytes(&PNG));
        assert!(p.has(&a.hash, "png"));
        assert_eq!(p.read(&a.hash, "png").unwrap(), PNG);

        // The same again is the same.
        let b = p.add("other.png", &PNG).unwrap();
        assert_eq!(b.hash, a.hash);
        assert_eq!(p.list().len(), 1);

        let s = p.add("circle.svg", SVG.as_bytes()).unwrap();
        assert_eq!(s.extension, "svg");
        assert_eq!(s.width, None);
        assert_eq!(p.list().len(), 2);
    }

    #[test]
    fn what_is_not_a_picture_is_not_taken() {
        let (_tmp, p) = pictures();
        assert!(p.add("text.png", b"not a picture at all").is_err());
        assert!(p.add("page.svg", b"<html><body><svg/></body></html>").is_err());
        assert!(p.add("empty.png", b"").is_err());
        assert!(p.list().is_empty());
        // Nor is anything read that is not named as pictures are.
        assert!(p.read("../../state", "bin").is_err());
        assert!(p.read(&"a".repeat(64), "exe").is_err());
        assert!(p.path(&"A".repeat(64), "png").is_err());
        assert_eq!(p.read(&"a".repeat(64), "png").unwrap_err().kind(), "not-found");
    }

    #[test]
    fn other_kinds_become_png() {
        let (_tmp, p) = pictures();
        let picture = DynamicImage::ImageRgb8(image::RgbImage::from_pixel(6, 5, image::Rgb([10, 120, 200])));
        for format in [ImageFormat::Gif, ImageFormat::Bmp, ImageFormat::Tiff, ImageFormat::WebP] {
            let mut bytes = Cursor::new(Vec::new());
            picture.write_to(&mut bytes, format).unwrap();
            let kept = p.add("picture.xyz", bytes.get_ref()).unwrap();
            assert_eq!(kept.extension, "png", "{format:?}");
            assert_eq!((kept.width, kept.height), (Some(6), Some(5)));
            assert_eq!(kept.name, "picture.png");
            let read = image::load_from_memory(&p.read(&kept.hash, "png").unwrap()).unwrap();
            assert_eq!(read.to_rgb8().get_pixel(3, 3).0, [10, 120, 200], "{format:?}");
        }
        // A photograph stays what it is.
        let mut bytes = Cursor::new(Vec::new());
        picture.write_to(&mut bytes, ImageFormat::Jpeg).unwrap();
        let kept = p.add("photo.jpeg", bytes.get_ref()).unwrap();
        assert_eq!(kept.extension, "jpg");
        assert_eq!(kept.name, "photo.jpg");
        assert_eq!(p.read(&kept.hash, "jpg").unwrap(), *bytes.get_ref());
    }

    #[test]
    fn what_comes_from_elsewhere_is_checked() {
        let (_tmp, p) = pictures();
        let hash = hash_bytes(&PNG);
        assert!(p.keep(&hash, b"something else").is_err());
        assert!(p.keep(&hash_bytes(b"something else"), b"something else").is_err(), "not a picture");
        let kept = p.keep(&hash, &PNG).unwrap();
        assert_eq!(kept.extension, "png");
        assert!(p.has(&hash, "png"));

        let (_other, q) = pictures();
        q.copy_from(&p).unwrap();
        assert_eq!(q.list(), p.list());
    }

    #[test]
    fn what_is_a_drawing() {
        assert!(is_svg(SVG.as_bytes()));
        assert!(is_svg(b"\xef\xbb\xbf<svg xmlns=\"http://www.w3.org/2000/svg\"/>"));
        assert!(is_svg(b"<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"x\"><svg:svg/>"));
        assert!(!is_svg(b"<svgx/>"));
        assert!(!is_svg(b"svg"));
        assert!(!is_svg(b"<?xml version=\"1.0\"?><html/>"));
    }
}
