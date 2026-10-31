//! Files of the library as figures: what an image holds, how large it is,
//! and the file a figure shows (ADR 0070).
//!
//! A figure names its file by the hash of what it holds. Every kind of
//! document that is made can hold PNG, JPEG and SVG, so a file of those kinds
//! is shown as it is. An image of another kind, GIF, WebP, TIFF or BMP, is
//! made into PNG, and a photograph that says it is to be turned before it is
//! shown is turned; what is made is a file of its own beside the one it was
//! made from, which stays as it was.
//!
//! An image is edited here too (ADR 0071): turned, flipped, cropped and
//! made lighter, darker or paler by the formulas the browser previews it
//! with; what is made is likewise a file of its own.

use std::io::Cursor;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, PoisonError};

use image::metadata::Orientation;
use image::{DynamicImage, ImageDecoder, ImageFormat, ImageReader};
use serde::{Deserialize, Serialize};

use crate::error::{Error, Result};
use crate::tr;

use super::{Library, attachments};

/// An image of the library, as what shows it, sends it or carries it needs it.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct Image {
    pub hash: String,
    /// What it is called, with its ending.
    pub name: String,
    /// The ending of its name, in small letters: what a figure names it by.
    pub extension: String,
    pub width: Option<u32>,
    pub height: Option<u32>,
    /// What it shows, in words.
    pub alt: String,
}

impl From<&super::FileView> for Image {
    fn from(view: &super::FileView) -> Self {
        Image {
            hash: view.hash.clone(),
            name: view.name.clone(),
            extension: view.name.rsplit_once('.').map(|(_, e)| e.to_ascii_lowercase()).unwrap_or_default(),
            width: view.width,
            height: view.height,
            alt: view.alt.clone(),
        }
    }
}

/// The file of the library with this hash, in the library at `library_dir`,
/// where it is there: what a figure that names it shows. The library need
/// not be held for it.
pub fn file_of(library_dir: &Path, hash: &str) -> Option<PathBuf> {
    let stored = attachments::find_by_hash(library_dir, hash)?;
    attachments::absolute(library_dir, &stored).ok().filter(|p| p.is_file())
}

/// Where the images of figures are found: the library, held or behind its lock.
pub trait Images {
    /// The image with this hash and where its file is, where the library has it there.
    fn image(&self, hash: &str) -> Option<(Image, PathBuf)>;
}

/// Where images that arrive from elsewhere are kept: the library behind its
/// lock, held only while one is kept, so that what fetches them does not
/// hold it meanwhile.
pub trait KeepImages: Images {
    /// Keeps an image that came from elsewhere, as it is, if it holds what
    /// its hash says and is of a kind a figure shows. Whether it is new.
    fn keep(&self, image: &Image, bytes: &[u8]) -> Result<bool>;
}

impl Images for Library {
    fn image(&self, hash: &str) -> Option<(Image, PathBuf)> {
        let record = self.files.get(hash)?;
        let path = attachments::absolute(&self.dir, &record.path).ok().filter(|p| p.is_file())?;
        let extension = record.name.rsplit_once('.').map(|(_, e)| e.to_ascii_lowercase()).unwrap_or_default();
        let image = Image {
            hash: record.hash.clone(),
            name: record.name.clone(),
            extension,
            width: record.width,
            height: record.height,
            alt: record.alt.clone(),
        };
        Some((image, path))
    }
}

impl Images for Mutex<Library> {
    fn image(&self, hash: &str) -> Option<(Image, PathBuf)> {
        self.lock().unwrap_or_else(PoisonError::into_inner).image(hash)
    }
}

impl KeepImages for Mutex<Library> {
    fn keep(&self, image: &Image, bytes: &[u8]) -> Result<bool> {
        self.lock().unwrap_or_else(PoisonError::into_inner).keep_image(image, bytes)
    }
}

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

/// Whether the file at `path` holds an image a figure can show, of a kind
/// that is read, no larger than an image may be: an error that says why
/// where it does not. Read before the file is taken into the library, so
/// that what only says it is an image is not kept for one.
pub fn check_image_file(path: &Path) -> Result<()> {
    let size = std::fs::metadata(path).map_err(|e| Error::io(tr!("io-reading", path = path), e))?.len();
    if size > MAX_BYTES {
        return Err(too_large());
    }
    let bytes = std::fs::read(path).map_err(|e| Error::io(tr!("io-reading", path = path), e))?;
    kind_of(&bytes).map(|_| ()).ok_or_else(not_a_picture)
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

// ---- an image edited (ADR 0071) ----

/// A rectangle cut out of the frame that shows, the image after its turns
/// and flips: fractions from 0 to 1 of that frame's width and height, so
/// that it means the same on the preview and on the full image.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Crop {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

impl Default for Crop {
    /// The whole frame.
    fn default() -> Self {
        Crop { x: 0.0, y: 0.0, width: 1.0, height: 1.0 }
    }
}

impl Crop {
    /// The pixels it cuts out of a frame of `width` by `height`, which is
    /// not empty: the left, the top, the width and the height, rounded as
    /// the interface rounds them, at least one pixel, and within the frame.
    /// A value that is no number is that of the whole frame.
    fn pixels(&self, width: u32, height: u32) -> (u32, u32, u32, u32) {
        let fraction = |v: f64, or: f64| if v.is_finite() { v.clamp(0.0, 1.0) } else { or };
        let along = |v: f64, size: u32| (v * f64::from(size)).round() as u32;
        let x = along(fraction(self.x, 0.0), width).min(width - 1);
        let y = along(fraction(self.y, 0.0), height).min(height - 1);
        let w = along(fraction(self.width, 1.0), width).clamp(1, width - x);
        let h = along(fraction(self.height, 1.0), height).clamp(1, height - y);
        (x, y, w, h)
    }

    fn is_whole(&self) -> bool {
        *self == Crop::default()
    }
}

/// The settings of one editing: what is done to an image, in this order.
/// Quarter turns clockwise, read modulo four; flips sideways and upside
/// down in the turned frame; a crop in the frame that shows; brightness,
/// contrast and saturation in percent, 100 being the image as it is.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Edit {
    pub turns: u8,
    pub flip_x: bool,
    pub flip_y: bool,
    pub crop: Option<Crop>,
    pub brightness: u16,
    pub contrast: u16,
    pub saturation: u16,
}

impl Default for Edit {
    /// Nothing changed.
    fn default() -> Self {
        Edit { turns: 0, flip_x: false, flip_y: false, crop: None, brightness: 100, contrast: 100, saturation: 100 }
    }
}

impl Edit {
    /// Whether it changes nothing.
    pub fn is_nothing(&self) -> bool {
        self.turns.is_multiple_of(4)
            && !self.flip_x
            && !self.flip_y
            && self.crop.is_none_or(|c| c.is_whole())
            && !self.changes_colours()
    }

    fn changes_colours(&self) -> bool {
        (self.brightness, self.contrast, self.saturation) != (100, 100, 100)
    }
}

/// What the interface needs of an image before it is edited.
#[derive(Debug, Clone, Default, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EditFacts {
    /// How large the whole image is, upright, as it is shown.
    pub width: u32,
    pub height: u32,
    /// The ending of what an edit of it is kept as, `jpg` or `png`; `svg`
    /// for a drawing, which is not edited.
    pub ending: String,
    /// Whether it has pixels to edit: not a drawing.
    pub editable: bool,
    /// Whether it is larger than an image may be, so that it is edited only
    /// through a smaller copy.
    pub too_large: bool,
}

/// The side the preview of an edit is no larger than, in pixels.
pub const PREVIEW_LONGEST: u32 = 2400;
/// The longer side of the copy offered of an image too large to be edited.
pub const SMALLER_LONGEST: u32 = 4000;

fn not_editable() -> Error {
    Error::invalid(tr!("core-pictures-not-editable"))
}

/// What an edit of the file at `path` begins from: how large it is upright,
/// read from its head, what kind an edit of it is kept as, whether it can
/// be edited and whether it is too large to be. The pixels are not read.
pub fn edit_facts(path: &Path) -> Result<EditFacts> {
    use std::io::Read;
    let reading = |e| Error::io(tr!("io-reading", path = path), e);
    let size = std::fs::metadata(path).map_err(reading)?.len();
    let mut head = Vec::new();
    std::fs::File::open(path).map_err(reading)?.take(8192).read_to_end(&mut head).map_err(reading)?;
    let format = match kind_of(&head).ok_or_else(not_a_picture)? {
        Kind::Svg => {
            let (width, height) = svg_size(&head).unwrap_or_default();
            return Ok(EditFacts {
                width: width.round() as u32,
                height: height.round() as u32,
                ending: "svg".into(),
                editable: false,
                too_large: size > MAX_BYTES,
            });
        }
        Kind::Png => ImageFormat::Png,
        Kind::Jpeg => ImageFormat::Jpeg,
        Kind::Other(format) => format,
    };
    let file = std::io::BufReader::new(std::fs::File::open(path).map_err(reading)?);
    let mut decoder = ImageReader::with_format(file, format).into_decoder().map_err(unreadable)?;
    let (width, height) = decoder.dimensions();
    let across = matches!(
        decoder.orientation().unwrap_or(Orientation::NoTransforms),
        Orientation::Rotate90 | Orientation::Rotate270 | Orientation::Rotate90FlipH | Orientation::Rotate270FlipH
    );
    let (width, height) = if across { (height, width) } else { (width, height) };
    Ok(EditFacts { width, height, ending: kept_ending(format).into(), editable: true, too_large: size > MAX_BYTES })
}

/// The kind of image the bytes are, as they are decoded to be edited: an
/// error for a drawing, which has no pixels, and for what is no image.
fn editable_format(bytes: &[u8]) -> Result<ImageFormat> {
    match kind_of(bytes).ok_or_else(not_a_picture)? {
        Kind::Svg => Err(not_editable()),
        Kind::Png => Ok(ImageFormat::Png),
        Kind::Jpeg => Ok(ImageFormat::Jpeg),
        Kind::Other(format) => Ok(format),
    }
}

/// What an image made of one of this kind is kept as: a photograph as a
/// photograph, everything else as PNG, as a figure's copy is.
fn kept_format(format: ImageFormat) -> ImageFormat {
    if format == ImageFormat::Jpeg { ImageFormat::Jpeg } else { ImageFormat::Png }
}

fn kept_ending(format: ImageFormat) -> &'static str {
    if kept_format(format) == ImageFormat::Jpeg { "jpg" } else { "png" }
}

fn kept(picture: &DynamicImage, source: ImageFormat) -> Result<Prepared> {
    let content = encode(picture, kept_format(source))?;
    Ok((content, kept_ending(source), Some((picture.width(), picture.height()))))
}

/// The image made no larger than `longest` on its longer side, where it is larger.
fn at_most(picture: DynamicImage, longest: u32) -> DynamicImage {
    if picture.width().max(picture.height()) > longest {
        picture.resize(longest, longest, image::imageops::FilterType::Triangle)
    } else {
        picture
    }
}

/// The edit done to an upright image, in the record's order: the turns,
/// the flips in the turned frame, the crop in the frame that shows, then
/// the colours. The interface previews it with `scale(fx, fy)
/// rotate(turns × 90deg)`, which the browser applies from the right, the
/// turn first and then the flip: the two must agree.
pub fn apply(picture: DynamicImage, edit: &Edit) -> DynamicImage {
    let mut picture = match edit.turns % 4 {
        1 => picture.rotate90(),
        2 => picture.rotate180(),
        3 => picture.rotate270(),
        _ => picture,
    };
    if edit.flip_x {
        picture = picture.fliph();
    }
    if edit.flip_y {
        picture = picture.flipv();
    }
    if let Some(crop) = &edit.crop
        && picture.width() > 0
        && picture.height() > 0
    {
        let (x, y, w, h) = crop.pixels(picture.width(), picture.height());
        if (x, y, w, h) != (0, 0, picture.width(), picture.height()) {
            picture = picture.crop_imm(x, y, w, h);
        }
    }
    if edit.changes_colours() {
        // What has no transparency is given none.
        picture = if picture.color().has_alpha() {
            let mut rgba = picture.to_rgba8();
            colours(&mut rgba, edit.brightness, edit.contrast, edit.saturation);
            DynamicImage::ImageRgba8(rgba)
        } else {
            let mut rgb = picture.to_rgb8();
            colours(&mut rgb, edit.brightness, edit.contrast, edit.saturation);
            DynamicImage::ImageRgb8(rgb)
        };
    }
    picture
}

/// Brightness, contrast and saturation, in percent, by the formulas of the
/// browser's filter functions (Filter Effects Module Level 1, the shorthand
/// functions), so that what the preview shows is what is kept: on the
/// stored sRGB values as fractions, in this order, each step clamped before
/// the next, the alpha untouched.
fn colours<P>(picture: &mut image::ImageBuffer<P, Vec<u8>>, brightness: u16, contrast: u16, saturation: u16)
where
    P: image::Pixel<Subpixel = u8>,
{
    let b = f32::from(brightness) / 100.0;
    let c = f32::from(contrast) / 100.0;
    let s = f32::from(saturation) / 100.0;
    // Brightness and contrast act on each channel alone: they are worked
    // out once for each of its 256 values.
    let mut table = [0f32; 256];
    for (v, out) in table.iter_mut().enumerate() {
        let v = (v as f32 / 255.0 * b).clamp(0.0, 1.0);
        *out = ((v - 0.5) * c + 0.5).clamp(0.0, 1.0);
    }
    let matrix = [
        [0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s],
        [0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s],
        [0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s],
    ];
    let shade = |v: f32| (v * 255.0).round() as u8;
    for pixel in picture.pixels_mut() {
        let channels = pixel.channels_mut();
        let rgb = [table[usize::from(channels[0])], table[usize::from(channels[1])], table[usize::from(channels[2])]];
        let rgb = if saturation == 100 {
            rgb
        } else {
            matrix.map(|m| (m[0] * rgb[0] + m[1] * rgb[1] + m[2] * rgb[2]).clamp(0.0, 1.0))
        };
        for (channel, v) in channels.iter_mut().zip(rgb) {
            *channel = shade(v);
        }
    }
}

/// The bytes an image edited is kept as: decoded upright, as the browser
/// shows it, the edit applied, and encoded as a JPEG where it was one and
/// as PNG otherwise; an animated GIF by its first frame. An error for a
/// drawing, for what is no image, and for an edit that changes nothing.
pub fn edited(bytes: &[u8], edit: &Edit) -> Result<Prepared> {
    let format = editable_format(bytes)?;
    if edit.is_nothing() {
        return Err(Error::invalid(tr!("core-pictures-nothing-changed")));
    }
    let (picture, _) = decode(bytes, format)?;
    kept(&apply(picture, edit), format)
}

/// The image shown while it is edited: upright, no larger than `longest`
/// on its longer side, a JPEG for a JPEG and PNG for every other kind, so
/// that the browser shows what it does not read. One that is small enough
/// and upright already is as it is. The size given is the whole image's,
/// upright, not the preview's.
pub fn preview(bytes: &[u8], longest: u32) -> Result<Prepared> {
    let format = editable_format(bytes)?;
    let (picture, turned) = decode(bytes, format)?;
    let whole = (picture.width(), picture.height());
    let small = whole.0.max(whole.1) <= longest;
    if small && !turned && matches!(format, ImageFormat::Png | ImageFormat::Jpeg) {
        return Ok((bytes.to_vec(), kept_ending(format), Some(whole)));
    }
    let (content, ending, _) = kept(&at_most(picture, longest), format)?;
    Ok((content, ending, Some(whole)))
}

/// A smaller copy of an image, no larger than `longest` on its longer
/// side, kept as an edit of it would be. The size given is the copy's.
pub fn smaller(bytes: &[u8], longest: u32) -> Result<Prepared> {
    let format = editable_format(bytes)?;
    let (picture, _) = decode(bytes, format)?;
    kept(&at_most(picture, longest), format)
}

/// The name of a copy made of the file `name`: its stem with `word` after
/// it in brackets, and `ending`; counted up, `(word 2)`, `(word 3)`, while
/// `taken` says a name is. A stem that has the word already is counted on
/// from it rather than given it twice: *plate (edited).jpg* edited again
/// is *plate (edited 2).jpg*.
pub fn copy_name(name: &str, word: &str, ending: &str, taken: impl Fn(&str) -> bool) -> String {
    let shown = shown_name(name, ending);
    let stem = shown.strip_suffix(&format!(".{ending}")).unwrap_or(&shown);
    let (stem, mut count) = counted(stem, word).unwrap_or((stem, 0));
    loop {
        count += 1;
        let candidate =
            if count == 1 { format!("{stem} ({word}).{ending}") } else { format!("{stem} ({word} {count}).{ending}") };
        if !taken(&candidate) {
            return candidate;
        }
    }
}

/// The stem without the ` (word)` or ` (word n)` at its end, and the count
/// that was there, 1 for the word alone; nothing where it has none.
fn counted<'a>(stem: &'a str, word: &str) -> Option<(&'a str, u32)> {
    let (before, bracketed) = stem.strip_suffix(')')?.rsplit_once(" (")?;
    let rest = bracketed.strip_prefix(word)?;
    let count = if rest.is_empty() { 1 } else { rest.strip_prefix(' ')?.parse::<u32>().ok().filter(|n| *n >= 2)? };
    (!before.is_empty()).then_some((before, count))
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
    fn what_only_says_it_is_an_image_is_not_one() {
        let tmp = tempfile::tempdir().unwrap();
        let fake = tmp.path().join("not a picture.png");
        std::fs::write(&fake, "This only says that it is one.").unwrap();
        assert_eq!(check_image_file(&fake).unwrap_err().kind(), "invalid");
        let real = tmp.path().join("vase.png");
        std::fs::write(&real, PNG).unwrap();
        assert!(check_image_file(&real).is_ok());
        assert!(check_image_file(&tmp.path().join("none.png")).is_err());
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

    const RED: [u8; 3] = [255, 0, 0];
    const GREEN: [u8; 3] = [0, 255, 0];
    const BLUE: [u8; 3] = [0, 0, 255];
    const WHITE: [u8; 3] = [255, 255, 255];

    /// Four points by three, black, with red at the top left, green at the
    /// top right, blue at the bottom left and white at the bottom right.
    fn corners() -> DynamicImage {
        DynamicImage::ImageRgb8(image::RgbImage::from_fn(4, 3, |x, y| {
            image::Rgb(match (x, y) {
                (0, 0) => RED,
                (3, 0) => GREEN,
                (0, 2) => BLUE,
                (3, 2) => WHITE,
                _ => [0, 0, 0],
            })
        }))
    }

    /// The four corners of a picture, top left, top right, bottom right,
    /// bottom left, and its size.
    fn corners_of(picture: &DynamicImage) -> ([[u8; 3]; 4], (u32, u32)) {
        let rgb = picture.to_rgb8();
        let (w, h) = rgb.dimensions();
        let at = |x, y| rgb.get_pixel(x, y).0;
        ([at(0, 0), at(w - 1, 0), at(w - 1, h - 1), at(0, h - 1)], (w, h))
    }

    fn encoded(picture: &DynamicImage, format: ImageFormat) -> Vec<u8> {
        let mut bytes = Cursor::new(Vec::new());
        picture.write_to(&mut bytes, format).unwrap();
        bytes.into_inner()
    }

    /// A JPEG that says it is to be turned a quarter clockwise before it is
    /// shown: an Exif segment with the orientation 6 put after its start.
    fn lying_jpeg(picture: &DynamicImage) -> Vec<u8> {
        let jpeg = encoded(picture, ImageFormat::Jpeg);
        let mut exif = vec![0xff, 0xe1, 0x00, 0x22];
        exif.extend_from_slice(b"Exif\0\0MM\0\x2a\0\0\0\x08");
        exif.extend_from_slice(&[0x00, 0x01, 0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, 0x06, 0x00, 0x00]);
        exif.extend_from_slice(&[0, 0, 0, 0]);
        [&jpeg[..2], &exif[..], &jpeg[2..]].concat()
    }

    #[test]
    fn an_image_is_turned_clockwise_by_quarters() {
        let turned = |turns| corners_of(&apply(corners(), &Edit { turns, ..Edit::default() }));
        // The top left goes to the top right, and the picture stands on its side.
        assert_eq!(turned(1), ([BLUE, RED, GREEN, WHITE], (3, 4)));
        assert_eq!(turned(2), ([WHITE, BLUE, RED, GREEN], (4, 3)));
        assert_eq!(turned(3), ([GREEN, WHITE, BLUE, RED], (3, 4)));
        assert_eq!(turned(4), turned(0), "four quarters are none");
        assert_eq!(turned(0), ([RED, GREEN, WHITE, BLUE], (4, 3)));
    }

    #[test]
    fn a_flip_acts_in_the_turned_frame_and_the_crop_in_the_frame_that_shows() {
        // Turned a quarter, the corners are blue, red, green, white; flipped
        // sideways after that, what was at the right is at the left.
        let flipped = Edit { turns: 1, flip_x: true, ..Edit::default() };
        assert_eq!(corners_of(&apply(corners(), &flipped)), ([RED, BLUE, WHITE, GREEN], (3, 4)));
        // Flipped sideways first and turned after, it would be white, green,
        // red, blue: what flipping upside down after the turn gives.
        let over = Edit { turns: 1, flip_y: true, ..Edit::default() };
        assert_eq!(corners_of(&apply(corners(), &over)), ([WHITE, GREEN, RED, BLUE], (3, 4)));
        // The right half of three points is the last one: its first point
        // is at 1.5, rounded to 2.
        let right = Edit { crop: Some(Crop { x: 0.5, y: 0.0, width: 0.5, height: 1.0 }), ..flipped.clone() };
        assert_eq!(corners_of(&apply(corners(), &right)), ([BLUE, BLUE, WHITE, WHITE], (1, 4)));
        let top_right = Edit { crop: Some(Crop { x: 1.0 / 3.0, y: 0.0, width: 2.0 / 3.0, height: 0.5 }), ..flipped };
        assert_eq!(corners_of(&apply(corners(), &top_right)), ([[0, 0, 0], BLUE, [0, 0, 0], [0, 0, 0]], (2, 2)));
    }

    #[test]
    fn a_crop_cuts_whole_points_and_at_least_one() {
        let cut = |crop| apply(corners(), &Edit { crop: Some(crop), ..Edit::default() });
        let left = cut(Crop { x: 0.0, y: 0.0, width: 0.5, height: 1.0 });
        assert_eq!(corners_of(&left), ([RED, [0, 0, 0], [0, 0, 0], BLUE], (2, 3)));
        assert_eq!(cut(Crop::default()), corners(), "the whole frame is no crop");
        let speck = cut(Crop { x: 0.9, y: 0.0, width: 0.01, height: 0.01 });
        assert_eq!(corners_of(&speck), ([GREEN; 4], (1, 1)), "less than a point is one point");
        let past = cut(Crop { x: 0.75, y: 0.5, width: 2.0, height: f64::NAN });
        assert_eq!((past.width(), past.height()), (1, 1), "what goes past the edge ends at it");
        assert!(Edit { crop: Some(Crop::default()), ..Edit::default() }.is_nothing());
        assert!(!Edit { crop: Some(Crop { width: 0.5, ..Crop::default() }), ..Edit::default() }.is_nothing());
    }

    #[test]
    fn the_colours_follow_the_formulas_of_the_browser() {
        let one = |rgba: [u8; 4], edit: Edit| {
            let picture = DynamicImage::ImageRgba8(image::RgbaImage::from_pixel(1, 1, image::Rgba(rgba)));
            apply(picture, &edit).to_rgba8().get_pixel(0, 0).0
        };
        let colours = |brightness, contrast, saturation| Edit { brightness, contrast, saturation, ..Edit::default() };
        // Brightness multiplies: a quarter made twice as bright is a half.
        assert_eq!(one([64, 64, 64, 255], colours(200, 100, 100)), [128, 128, 128, 255]);
        // No contrast is the middle everywhere, 127.5 rounded up.
        assert_eq!(one([0, 90, 255, 255], colours(100, 0, 100)), [128, 128, 128, 255]);
        // No saturation of a pure red is 0.213 of white, 54.3 of 255.
        assert_eq!(one([255, 0, 0, 255], colours(100, 100, 0)), [54, 54, 54, 255]);
        // Brightness before contrast: 100 made 150, then halved about 127.5, is 138.75.
        assert_eq!(one([100, 100, 100, 255], colours(150, 50, 100)), [139, 139, 139, 255]);
        // Clamped between: 200 made 400 is 255, then halved about the middle 191.25.
        assert_eq!(one([200, 200, 200, 255], colours(200, 50, 100)), [191, 191, 191, 255]);
        // Saturation doubled, by the matrix: (0.213 + 1.574) · 0.6 − 0.715 · 0.4 − 0.072 · 0.2 of red.
        let [r, g, b, _] = one([153, 102, 51, 255], colours(100, 100, 200));
        let red = (1.787 * 0.6 - 0.715 * 0.4 - 0.072 * 0.2f32) * 255.0;
        let green = (-0.213 * 0.6 + 1.285 * 0.4 - 0.072 * 0.2f32) * 255.0;
        let blue = (-0.213 * 0.6 - 0.715 * 0.4 + 1.928 * 0.2f32) * 255.0;
        assert_eq!([r, g, b], [red.round() as u8, green.round() as u8, blue.clamp(0.0, 255.0).round() as u8]);
        // The alpha is left as it is, and 100 everywhere is nothing.
        assert_eq!(one([255, 0, 0, 77], colours(150, 120, 30))[3], 77);
        assert_eq!(one([12, 34, 56, 78], Edit::default()), [12, 34, 56, 78]);
        // What has no transparency is given none.
        assert_eq!(apply(corners(), &colours(120, 100, 100)).color(), image::ColorType::Rgb8);
    }

    #[test]
    fn an_image_edited_is_kept_as_a_photograph_or_as_png() {
        let turn = Edit { turns: 1, ..Edit::default() };
        let (jpeg, ending, size) = edited(&encoded(&corners(), ImageFormat::Jpeg), &turn).unwrap();
        assert_eq!((image::guess_format(&jpeg).unwrap(), ending, size), (ImageFormat::Jpeg, "jpg", Some((3, 4))));
        let (png, ending, size) = edited(&encoded(&corners(), ImageFormat::Bmp), &turn).unwrap();
        assert_eq!((image::guess_format(&png).unwrap(), ending, size), (ImageFormat::Png, "png", Some((3, 4))));
        assert_eq!(corners_of(&image::load_from_memory(&png).unwrap()).0, [BLUE, RED, GREEN, WHITE]);
        // A photograph that says it lies on its side is set upright first,
        // as the browser shows it, and then turned.
        let (upright, _, size) = edited(&lying_jpeg(&corners()), &turn).unwrap();
        assert_eq!(size, Some((4, 3)));
        assert_eq!(dimensions(&upright, ImageFormat::Jpeg), Some((4, 3)));

        let drawing = edited(SVG.as_bytes(), &turn).unwrap_err();
        assert_eq!(drawing.kind(), "invalid");
        assert!(drawing.to_string().contains("drawing"), "{drawing}");
        let nothing = edited(&PNG, &Edit::default()).unwrap_err();
        assert!(nothing.to_string().contains("nothing was changed"), "{nothing}");
        assert!(edited(b"no picture", &turn).is_err());
    }

    #[test]
    fn the_preview_is_upright_and_no_larger_than_asked() {
        let large = DynamicImage::ImageRgb8(image::RgbImage::from_pixel(5000, 2000, image::Rgb([90, 60, 30])));
        let (shown, ending, size) = preview(&encoded(&large, ImageFormat::Png), PREVIEW_LONGEST).unwrap();
        assert_eq!((dimensions(&shown, ImageFormat::Png), ending), (Some((2400, 960)), "png"));
        assert_eq!(size, Some((5000, 2000)), "the size is the whole image's");
        // Small enough, it is as it is.
        let small = encoded(&DynamicImage::ImageRgb8(image::RgbImage::new(100, 100)), ImageFormat::Png);
        assert_eq!(preview(&small, PREVIEW_LONGEST).unwrap(), (small.clone(), "png", Some((100, 100))));
        // Of a kind the browser may not show, PNG; of a photograph lying on its side, upright.
        let (shown, ending, _) = preview(&encoded(&corners(), ImageFormat::Tiff), PREVIEW_LONGEST).unwrap();
        assert_eq!((image::guess_format(&shown).unwrap(), ending), (ImageFormat::Png, "png"));
        let (shown, ending, size) = preview(&lying_jpeg(&corners()), PREVIEW_LONGEST).unwrap();
        assert_eq!((dimensions(&shown, ImageFormat::Jpeg), ending, size), (Some((3, 4)), "jpg", Some((3, 4))));
    }

    #[test]
    fn a_smaller_copy_is_as_large_as_asked() {
        let long = DynamicImage::ImageRgb8(image::RgbImage::from_pixel(5000, 100, image::Rgb([90, 60, 30])));
        let (copy, ending, size) = smaller(&encoded(&long, ImageFormat::Bmp), SMALLER_LONGEST).unwrap();
        assert_eq!((dimensions(&copy, ImageFormat::Png), ending, size), (Some((4000, 80)), "png", Some((4000, 80))));
        assert!(smaller(SVG.as_bytes(), SMALLER_LONGEST).is_err());
    }

    #[test]
    fn what_an_edit_begins_from_is_read_from_the_head() {
        let tmp = tempfile::tempdir().unwrap();
        let write = |name: &str, bytes: &[u8]| {
            let path = tmp.path().join(name);
            std::fs::write(&path, bytes).unwrap();
            path
        };
        let facts = edit_facts(&write("vase.png", &PNG)).unwrap();
        let expected = EditFacts { width: 4, height: 3, ending: "png".into(), editable: true, too_large: false };
        assert_eq!(facts, expected);
        let lying = edit_facts(&write("lying.jpg", &lying_jpeg(&corners()))).unwrap();
        assert_eq!((lying.width, lying.height, lying.ending.as_str()), (3, 4, "jpg"), "upright");
        let gif = edit_facts(&write("a.gif", &encoded(&corners(), ImageFormat::Gif))).unwrap();
        assert_eq!((gif.width, gif.ending.as_str()), (4, "png"));
        let drawing = edit_facts(&write("circle.svg", SVG.as_bytes())).unwrap();
        assert_eq!((drawing.editable, drawing.width, drawing.height), (false, 120, 80));
        assert!(edit_facts(&write("words.txt", b"plain words")).is_err());
        // Over the limit by its size, whatever it holds after its head.
        let large = write("large.png", &PNG);
        std::fs::File::options().write(true).open(&large).unwrap().set_len(MAX_BYTES + 1).unwrap();
        assert!(edit_facts(&large).unwrap().too_large);
    }

    #[test]
    fn a_copy_is_named_after_its_source_and_counted_up() {
        let none = |_: &str| false;
        assert_eq!(copy_name("plate.jpg", "edited", "jpg", none), "plate (edited).jpg");
        assert_eq!(copy_name("plate.jpg", "edited", "jpg", |n| n == "plate (edited).jpg"), "plate (edited 2).jpg");
        assert_eq!(copy_name("plate (edited).jpg", "edited", "jpg", none), "plate (edited 2).jpg");
        assert_eq!(copy_name("plate (edited 2).jpg", "edited", "jpg", none), "plate (edited 3).jpg");
        assert_eq!(
            copy_name("plate (edited 2).jpg", "edited", "jpg", |n| n == "plate (edited 3).jpg"),
            "plate (edited 4).jpg"
        );
        assert_eq!(copy_name("plate", "edited", "png", none), "plate (edited).png");
        assert_eq!(copy_name("Plate 3.bmp", "smaller", "png", none), "Plate 3 (smaller).png");
        assert_eq!(copy_name("plate (smaller).png", "edited", "png", none), "plate (smaller) (edited).png");
        assert_eq!(copy_name("(edited).png", "edited", "png", none), "(edited) (edited).png");
    }
}
