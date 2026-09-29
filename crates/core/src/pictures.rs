//! The store of pictures.
//!
//! Pictures are kept in one place for the whole application, as references
//! are in the library. A figure in a text names its picture by the SHA-256
//! of what the file holds, and every project and map that uses a picture
//! uses the one that is here:
//!
//! ```text
//! pictures/pictures.json            what is known of each picture
//! pictures/files/<hash>.<extension> the pictures themselves
//! pictures/small/<hash>.<extension> lighter copies, for lists; made when asked for
//! ```
//!
//! So the same picture is kept once however often it is used, a picture that
//! was changed is another picture, and what came from someone else can be
//! told to be what it is said to be.
//!
//! Three kinds are kept: PNG, JPEG and SVG, which every kind of document
//! that is made can hold. Pictures of other kinds are made into PNG when
//! they are taken in.
//!
//! Besides the file, the store keeps what the user has said of a picture:
//! what it is called, what is said of it where it becomes a figure, what it
//! shows, and notes, which are part of no document.

use std::fs;
use std::io::Cursor;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, MutexGuard};

use image::{DynamicImage, ImageDecoder, ImageFormat, ImageReader};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::error::{Error, IoContext, Result};
use crate::fsutil::write_atomic;
use crate::library::attachments::hash_bytes;
use crate::library::now;
use crate::tr;

const INDEX: &str = "pictures.json";
const FILES: &str = "files";
const SMALL: &str = "small";

/// How wide the lighter copies are, in points of the picture.
const SMALL_WIDTH: u32 = 480;

/// The most one picture may hold: what a server takes, unless it says otherwise.
pub const MAX_BYTES: u64 = 50 * 1024 * 1024;

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Picture {
    pub hash: String,
    pub extension: String,
    /// What the picture is called: at first, what the file was called.
    pub name: String,
    pub size: u64,
    /// In points of the picture itself, where that can be told.
    pub width: Option<u32>,
    pub height: Option<u32>,
    /// When it was taken in.
    pub added: String,
    /// What is said of the picture where it becomes a figure, until
    /// something else is said there: text as the interface keeps it, which
    /// is not read here.
    #[serde(skip_serializing_if = "Value::is_null")]
    pub caption: Value,
    /// What the picture shows, in words, for those who do not see it.
    pub alt: String,
    /// What the user makes of it. Part of no document.
    pub note: String,
}

/// What is said anew of a picture. What is not given stays as it is.
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Change {
    pub name: Option<String>,
    pub caption: Option<Value>,
    pub alt: Option<String>,
    pub note: Option<String>,
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
    Error::invalid(tr!("core-pictures-not-a-picture"))
}

fn unreadable(e: image::ImageError) -> Error {
    Error::invalid(tr!("core-pictures-unreadable", error = e.to_string()))
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

/// A picture made smaller, for where it is only looked at: no wider than
/// `widest` points. Nothing, when it is small already, is a drawing, or
/// cannot be read.
pub fn lighter(bytes: &[u8], extension: &str, widest: u32) -> Option<Vec<u8>> {
    let format = match extension {
        "png" => ImageFormat::Png,
        "jpg" => ImageFormat::Jpeg,
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

pub fn is_hash(text: &str) -> bool {
    text.len() == 64 && text.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}

fn is_extension(text: &str) -> bool {
    matches!(text, "png" | "jpg" | "svg")
}

/// The store. What is known of the pictures is held in memory and written
/// whenever it changes; the files are read and written as they are asked
/// for, without anything being held meanwhile.
#[derive(Debug)]
pub struct Pictures {
    dir: PathBuf,
    known: Mutex<Vec<Picture>>,
}

/// The file of a picture in a store at `dir`, if it is named as pictures are.
pub fn file_in(dir: &Path, hash: &str, extension: &str) -> Result<PathBuf> {
    if !is_hash(hash) || !is_extension(extension) {
        return Err(Error::invalid(tr!("core-pictures-not-a-name")));
    }
    Ok(dir.join(FILES).join(format!("{hash}.{extension}")))
}

fn trimmed(text: &str, most: usize) -> String {
    text.trim().chars().filter(|c| !c.is_control() || *c == '\n').take(most).collect()
}

impl Pictures {
    /// Opens the store at `dir`, which is made if it is not there. Files
    /// that are there and not known are made known; what is known and has
    /// no file is forgotten.
    pub fn open(dir: impl Into<PathBuf>) -> Result<Self> {
        let dir = dir.into();
        let files = dir.join(FILES);
        fs::create_dir_all(&files).context(|| tr!("io-creating", path = &files))?;
        let index = dir.join(INDEX);
        let mut known: Vec<Picture> = match fs::read_to_string(&index) {
            Ok(text) => {
                serde_json::from_str(&text).map_err(|e| Error::Parse { path: index, message: e.to_string() })?
            }
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Vec::new(),
            Err(e) => return Err(Error::io(tr!("io-reading", path = &index), e)),
        };
        let before = known.len();
        known.retain(|p| file_in(&dir, &p.hash, &p.extension).is_ok_and(|f| f.is_file()));
        let mut changed = known.len() != before;
        if let Ok(entries) = fs::read_dir(&files) {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().into_owned();
                let Some((hash, extension)) = name.split_once('.') else { continue };
                if !is_hash(hash) || !is_extension(extension) || known.iter().any(|p| p.hash == hash) {
                    continue;
                }
                let size = entry.metadata().map(|m| m.len()).unwrap_or(0);
                let measured = match extension {
                    "png" => fs::read(entry.path()).ok().and_then(|b| dimensions(&b, ImageFormat::Png)),
                    "jpg" => fs::read(entry.path()).ok().and_then(|b| dimensions(&b, ImageFormat::Jpeg)),
                    _ => None,
                };
                known.push(Picture {
                    hash: hash.to_owned(),
                    extension: extension.to_owned(),
                    name: String::new(),
                    size,
                    width: measured.map(|m| m.0),
                    height: measured.map(|m| m.1),
                    added: now(),
                    ..Default::default()
                });
                changed = true;
            }
        }
        let store = Pictures { dir, known: Mutex::new(known) };
        if changed {
            store.write(&store.known())?;
        }
        Ok(store)
    }

    pub fn dir(&self) -> &Path {
        &self.dir
    }

    fn known(&self) -> MutexGuard<'_, Vec<Picture>> {
        self.known.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
    }

    fn write(&self, known: &[Picture]) -> Result<()> {
        write_atomic(&self.dir.join(INDEX), serde_json::to_string_pretty(known)?.as_bytes())
    }

    pub fn path(&self, hash: &str, extension: &str) -> Result<PathBuf> {
        file_in(&self.dir, hash, extension)
    }

    pub fn has(&self, hash: &str, extension: &str) -> bool {
        self.path(hash, extension).is_ok_and(|p| p.is_file())
    }

    /// The pictures, the one taken in last first.
    pub fn list(&self) -> Vec<Picture> {
        let mut all = self.known().clone();
        all.reverse();
        all
    }

    pub fn get(&self, hash: &str) -> Result<Picture> {
        self.known()
            .iter()
            .find(|p| p.hash == hash)
            .cloned()
            .ok_or_else(|| Error::not_found(tr!("core-pictures-the-picture")))
    }

    pub fn read(&self, hash: &str, extension: &str) -> Result<Vec<u8>> {
        let path = self.path(hash, extension)?;
        match fs::read(&path) {
            Ok(bytes) => Ok(bytes),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
                Err(Error::not_found(tr!("core-pictures-the-picture")))
            }
            Err(e) => Err(Error::io(tr!("io-reading", path = &path), e)),
        }
    }

    /// The picture as it is shown in a list: no larger than it need be. It
    /// is made once and kept, and can be made again.
    pub fn small(&self, hash: &str, extension: &str) -> Result<Vec<u8>> {
        let whole = self.path(hash, extension)?;
        let small = self.dir.join(SMALL).join(format!("{hash}.{extension}"));
        if let Ok(bytes) = fs::read(&small) {
            return Ok(bytes);
        }
        let bytes = self.read(hash, extension)?;
        match lighter(&bytes, extension, SMALL_WIDTH) {
            Some(made) => {
                if fs::create_dir_all(self.dir.join(SMALL)).is_ok() {
                    // If it cannot be kept it is made again the next time.
                    let _ = write_atomic(&small, &made);
                }
                Ok(made)
            }
            None => {
                let _ = whole;
                Ok(bytes)
            }
        }
    }

    /// Makes a picture known, or gives what is known of it already. What is
    /// in the store stays as it is when the same picture is taken in again.
    fn note_down(&self, new: Picture) -> Result<Picture> {
        let mut known = self.known();
        if let Some(there) = known.iter_mut().find(|p| p.hash == new.hash) {
            // One that came without a name is given the name it is met by.
            if there.name.is_empty() && !new.name.is_empty() {
                there.name = new.name;
                let there = there.clone();
                self.write(&known)?;
                return Ok(there);
            }
            return Ok(there.clone());
        }
        known.push(new.clone());
        self.write(&known)?;
        Ok(new)
    }

    fn store(&self, hash: &str, extension: &str, content: &[u8]) -> Result<()> {
        let path = self.path(hash, extension)?;
        if !path.is_file() {
            fs::create_dir_all(self.dir.join(FILES)).context(|| tr!("io-creating", path = &self.dir))?;
            write_atomic(&path, content)?;
        }
        Ok(())
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
        self.store(&hash, extension, &content)?;
        self.note_down(Picture {
            hash,
            extension: extension.to_owned(),
            name: shown_name(name, extension),
            size: content.len() as u64,
            width: size.map(|s| s.0),
            height: size.map(|s| s.1),
            added: now(),
            ..Default::default()
        })
    }

    pub fn add_from(&self, file: &Path) -> Result<Picture> {
        let size = fs::metadata(file).context(|| tr!("io-reading", path = file))?.len();
        if size > MAX_BYTES {
            return Err(too_large());
        }
        let bytes = fs::read(file).context(|| tr!("io-reading", path = file))?;
        let name = file.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
        self.add(&name, &bytes)
    }

    /// Keeps what came from elsewhere under the name it was asked for by, if
    /// it is that: a picture of a kind that is kept, holding what the name
    /// says. `name` is what it is called where it came from.
    pub fn keep(&self, hash: &str, bytes: &[u8], name: &str) -> Result<Picture> {
        if !is_hash(hash) || hash_bytes(bytes) != hash {
            return Err(Error::invalid(tr!("core-pictures-not-as-asked")));
        }
        let (extension, size) = match kind_of(bytes) {
            Some(Kind::Png) => ("png", dimensions(bytes, ImageFormat::Png)),
            Some(Kind::Jpeg) => ("jpg", dimensions(bytes, ImageFormat::Jpeg)),
            Some(Kind::Svg) => ("svg", None),
            _ => return Err(not_a_picture()),
        };
        self.store(hash, extension, bytes)?;
        self.note_down(Picture {
            hash: hash.to_owned(),
            extension: extension.to_owned(),
            name: if name.trim().is_empty() { String::new() } else { shown_name(name, extension) },
            size: bytes.len() as u64,
            width: size.map(|s| s.0),
            height: size.map(|s| s.1),
            added: now(),
            ..Default::default()
        })
    }

    /// Says something anew of a picture.
    pub fn update(&self, hash: &str, change: Change) -> Result<Picture> {
        let mut known = self.known();
        let picture = known
            .iter_mut()
            .find(|p| p.hash == hash)
            .ok_or_else(|| Error::not_found(tr!("core-pictures-the-picture")))?;
        if let Some(name) = change.name {
            let name = trimmed(&name.replace('\n', " "), 200);
            if name.is_empty() {
                return Err(Error::invalid(tr!("core-pictures-needs-name")));
            }
            picture.name = name;
        }
        if let Some(caption) = change.caption {
            // Nothing, or a line of text in parts: no more is known of it here.
            picture.caption = match caption {
                Value::Array(parts) if !parts.is_empty() => Value::Array(parts),
                _ => Value::Null,
            };
        }
        if let Some(alt) = change.alt {
            picture.alt = trimmed(&alt.replace('\n', " "), 2000);
        }
        if let Some(note) = change.note {
            picture.note = trimmed(&note, 100_000);
        }
        let picture = picture.clone();
        self.write(&known)?;
        Ok(picture)
    }

    /// Takes a picture out of the store, with what is known of it. A figure
    /// that names it is left without its picture.
    pub fn remove(&self, hash: &str) -> Result<()> {
        let mut known = self.known();
        let at = known
            .iter()
            .position(|p| p.hash == hash)
            .ok_or_else(|| Error::not_found(tr!("core-pictures-the-picture")))?;
        let picture = known.remove(at);
        self.write(&known)?;
        let file = self.path(&picture.hash, &picture.extension)?;
        match fs::remove_file(&file) {
            Ok(()) => {}
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
            Err(e) => return Err(Error::io(tr!("io-removing", path = &file), e)),
        }
        let _ = fs::remove_file(self.dir.join(SMALL).join(format!("{}.{}", picture.hash, picture.extension)));
        Ok(())
    }

    /// Takes in the pictures that a project kept by itself, as projects
    /// first did, and removes them from there. Returns how many there were.
    pub fn adopt(&self, files_of_project: &Path) -> usize {
        let Ok(entries) = fs::read_dir(files_of_project) else { return 0 };
        let mut taken = 0;
        for entry in entries.flatten() {
            let path = entry.path();
            let name = entry.file_name().to_string_lossy().into_owned();
            let Some((hash, _)) = name.split_once('.') else { continue };
            if !is_hash(hash) {
                continue;
            }
            let kept = fs::read(&path).ok().and_then(|bytes| self.keep(hash, &bytes, "").ok());
            if kept.is_some() {
                taken += 1;
                let _ = fs::remove_file(&path);
            }
        }
        // Goes only if nothing else was in it.
        let _ = fs::remove_dir(files_of_project);
        taken
    }
}

fn too_large() -> Error {
    Error::invalid(tr!("core-pictures-too-large", most = MAX_BYTES >> 20))
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
    use serde_json::json;

    use super::fixtures::{PNG, SVG};
    use super::*;

    fn pictures() -> (tempfile::TempDir, Pictures) {
        let tmp = tempfile::tempdir().unwrap();
        let p = Pictures::open(tmp.path().join("pictures")).unwrap();
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
        assert!(!a.added.is_empty());
        assert!(p.has(&a.hash, "png"));
        assert_eq!(p.read(&a.hash, "png").unwrap(), PNG);
        assert!(p.dir().join("files").join(format!("{}.png", a.hash)).is_file());

        // The same again is the same, and is called what it was called.
        let b = p.add("other.png", &PNG).unwrap();
        assert_eq!(b, a);
        assert_eq!(p.list().len(), 1);

        let s = p.add("circle.svg", SVG.as_bytes()).unwrap();
        assert_eq!(s.extension, "svg");
        assert_eq!(s.width, None);
        assert_eq!(p.list().iter().map(|x| x.name.as_str()).collect::<Vec<_>>(), ["circle.svg", "A vase.png"]);
        assert_eq!(p.get(&s.hash).unwrap(), s);
        assert_eq!(p.get(&"0".repeat(64)).unwrap_err().kind(), "not-found");
    }

    #[test]
    fn what_is_said_of_a_picture_is_kept() {
        let (tmp, p) = pictures();
        let a = p.add("vase.png", &PNG).unwrap();
        let caption = json!([{"kind": "text", "text": "A vase, ", "marks": {}}, {"kind": "text", "text": "krater", "marks": {"em": true}}]);
        let changed = p
            .update(
                &a.hash,
                Change {
                    name: Some("  The François vase \n".into()),
                    caption: Some(caption.clone()),
                    alt: Some("A large vase with figures in bands".into()),
                    note: Some("Florence, 4209.\nAsk for the photograph.".into()),
                },
            )
            .unwrap();
        assert_eq!(changed.name, "The François vase");
        assert_eq!(changed.caption, caption);
        assert_eq!(changed.note, "Florence, 4209.\nAsk for the photograph.");
        assert_eq!((changed.hash.as_str(), changed.size), (a.hash.as_str(), a.size));

        // What is not given stays; a caption of nothing is none.
        let again = p.update(&a.hash, Change { caption: Some(json!([])), ..Default::default() }).unwrap();
        assert_eq!(again.caption, Value::Null);
        assert_eq!(again.name, "The François vase");
        assert_eq!(again.alt, "A large vase with figures in bands");
        assert!(p.update(&a.hash, Change { name: Some("  ".into()), ..Default::default() }).is_err());
        assert!(p.update(&"0".repeat(64), Change::default()).is_err());

        // It is there when the store is opened again.
        let q = Pictures::open(tmp.path().join("pictures")).unwrap();
        assert_eq!(q.list(), p.list());
        assert_eq!(q.get(&a.hash).unwrap().note, "Florence, 4209.\nAsk for the photograph.");

        q.remove(&a.hash).unwrap();
        assert!(q.list().is_empty());
        assert!(!q.has(&a.hash, "png"));
        assert!(q.remove(&a.hash).is_err());
    }

    #[test]
    fn the_store_knows_what_it_holds() {
        let (tmp, p) = pictures();
        let a = p.add("vase.png", &PNG).unwrap();
        let b = p.add("circle.svg", SVG.as_bytes()).unwrap();
        // A file that is gone is forgotten; one that is there and not known is made known.
        fs::remove_file(p.path(&a.hash, "png").unwrap()).unwrap();
        let other = SVG.replace("30", "20");
        let hash = hash_bytes(other.as_bytes());
        fs::write(p.dir().join("files").join(format!("{hash}.svg")), &other).unwrap();
        fs::write(p.dir().join("files").join("notes.txt"), "not a picture").unwrap();
        let q = Pictures::open(tmp.path().join("pictures")).unwrap();
        let mut hashes: Vec<String> = q.list().into_iter().map(|x| x.hash).collect();
        hashes.sort();
        let mut expected = vec![b.hash.clone(), hash];
        expected.sort();
        assert_eq!(hashes, expected);
        assert_eq!(q.get(&b.hash).unwrap().name, "circle.svg");
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
            let kept = p.add(&format!("picture of {format:?}.xyz"), bytes.get_ref()).unwrap();
            assert_eq!(kept.extension, "png", "{format:?}");
            assert_eq!((kept.width, kept.height), (Some(6), Some(5)));
            assert!(kept.name.ends_with(".png"), "{}", kept.name);
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
        assert_eq!(lighter(fixtures::SVG.as_bytes(), "svg", 10), None);
        assert_eq!(lighter(b"nothing", "png", 10), None);

        // In a list a picture is shown lighter, and the lighter one is kept.
        let (_tmp, p) = pictures();
        let mut bytes = Cursor::new(Vec::new());
        picture.write_to(&mut bytes, ImageFormat::Png).unwrap();
        let kept = p.add("large.png", bytes.get_ref()).unwrap();
        let small = p.small(&kept.hash, "png").unwrap();
        assert_eq!(dimensions(&small, ImageFormat::Png), Some((SMALL_WIDTH, SMALL_WIDTH * 2 / 3)));
        assert_eq!(fs::read(p.dir().join("small").join(format!("{}.png", kept.hash))).unwrap(), small);
        assert_eq!(p.small(&kept.hash, "png").unwrap(), small);
        let little = p.add("vase.png", &PNG).unwrap();
        assert_eq!(p.small(&little.hash, "png").unwrap(), PNG);
        p.remove(&kept.hash).unwrap();
        assert!(!p.dir().join("small").join(format!("{}.png", kept.hash)).exists());
    }

    #[test]
    fn what_comes_from_elsewhere_is_checked() {
        let (_tmp, p) = pictures();
        let hash = hash_bytes(&PNG);
        assert!(p.keep(&hash, b"something else", "").is_err());
        assert!(p.keep(&hash_bytes(b"something else"), b"something else", "").is_err(), "not a picture");
        let kept = p.keep(&hash, &PNG, "").unwrap();
        assert_eq!((kept.extension.as_str(), kept.name.as_str()), ("png", ""));
        assert!(p.has(&hash, "png"));
        // Met again with a name, it is called that; and what it is called stays.
        assert_eq!(p.keep(&hash, &PNG, "The shield.png").unwrap().name, "The shield.png");
        assert_eq!(p.keep(&hash, &PNG, "another.png").unwrap().name, "The shield.png");
        assert_eq!(p.add("a third.png", &PNG).unwrap().name, "The shield.png");
    }

    #[test]
    fn the_pictures_a_project_kept_by_itself_are_taken_in() {
        let (tmp, p) = pictures();
        let old = tmp.path().join("projects").join("p1").join("files");
        fs::create_dir_all(&old).unwrap();
        fs::write(old.join(format!("{}.png", hash_bytes(&PNG))), PNG).unwrap();
        fs::write(old.join(format!("{}.svg", hash_bytes(SVG.as_bytes()))), SVG).unwrap();
        // What is not what its name says stays where it is.
        fs::write(old.join(format!("{}.png", "0".repeat(64))), PNG).unwrap();
        assert_eq!(p.adopt(&old), 2);
        assert_eq!(p.list().len(), 2);
        assert!(p.has(&hash_bytes(&PNG), "png"));
        assert_eq!(fs::read_dir(&old).unwrap().count(), 1);
        assert_eq!(p.adopt(&tmp.path().join("nowhere")), 0);

        let empty = tmp.path().join("projects").join("p2").join("files");
        fs::create_dir_all(&empty).unwrap();
        assert_eq!(p.adopt(&empty), 0);
        assert!(!empty.exists());
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
