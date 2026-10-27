//! Thumbnails of the files of the library: an image, or the first page of a
//! PDF, at most so wide, for the lists and the pane of a file (ADR 0070).
//!
//! ```text
//! library/small/<hash>.png   of an image that is not a photograph, and of a PDF
//! library/small/<hash>.jpg   of a photograph
//! ```
//!
//! A thumbnail is made when it is first asked for and kept for good, so that
//! a view of many files does not draw them again each time; it goes with its
//! file. A drawing is its own thumbnail, and is not kept. Making one needs
//! no more than the file: the library need not be held while a PDF's first
//! page is drawn.

use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::AtomicBool;
use std::sync::{Arc, LazyLock, Mutex, PoisonError};

use image::ImageFormat;

use crate::error::{Error, IoContext, Result};
use crate::export::Tools;
use crate::fsutil::write_atomic;
use crate::tr;

use super::attachments;
use super::figures::{self, Kind};
use super::files::{FileKind, kind_of};

/// Where the thumbnails are, in the library's directory.
pub const DIR: &str = "small";

/// How wide a thumbnail is at most, in its pixels.
pub const WIDTH: u32 = 480;

/// The thumbnails being made, by hash: one is made once however often it is
/// asked for meanwhile, as a view of many asks for each when it comes into sight.
static MAKING: LazyLock<Mutex<HashMap<String, Arc<Mutex<()>>>>> = LazyLock::new(Default::default);

fn kept(library_dir: &Path, hash: &str) -> Option<Vec<u8>> {
    ["png", "jpg"].iter().find_map(|ending| fs::read(file_of(library_dir, hash, ending)).ok())
}

fn file_of(library_dir: &Path, hash: &str, ending: &str) -> PathBuf {
    library_dir.join(DIR).join(format!("{hash}.{ending}"))
}

/// The thumbnail of the file of the library with this hash, stored at
/// `stored` (relative to the library) and called `name`: kept where it was
/// made before, else made and kept. An error for a kind that has none, and
/// for a file that cannot be read; the interface shows the kind's icon then.
pub fn small(library_dir: &Path, hash: &str, stored: &str, name: &str, tools: &Tools, work: &Path) -> Result<Vec<u8>> {
    if !attachments::is_hash(hash) {
        return Err(Error::invalid(tr!("core-library-no-small")));
    }
    if let Some(bytes) = kept(library_dir, hash) {
        return Ok(bytes);
    }
    let path = attachments::absolute(library_dir, stored)?;
    let lock = MAKING.lock().unwrap_or_else(PoisonError::into_inner).entry(hash.to_owned()).or_default().clone();
    let made = {
        let _making = lock.lock().unwrap_or_else(PoisonError::into_inner);
        // Made meanwhile, by another who asked.
        match kept(library_dir, hash) {
            Some(bytes) => Ok(bytes),
            None => make(library_dir, hash, &path, name, tools, work),
        }
    };
    MAKING.lock().unwrap_or_else(PoisonError::into_inner).remove(hash);
    made
}

fn make(library_dir: &Path, hash: &str, path: &Path, name: &str, tools: &Tools, work: &Path) -> Result<Vec<u8>> {
    let (bytes, ending) = match kind_of(name) {
        FileKind::Picture => {
            let bytes = fs::read(path).context(|| tr!("io-reading", path = path))?;
            // A drawing is drawn small by what shows it.
            if figures::is_svg(&bytes) {
                return Ok(bytes);
            }
            of_picture(&bytes)?
        }
        FileKind::Pdf => {
            let drawn = crate::ocr::pages_at(path, tools, work, None, &[0], WIDTH, &AtomicBool::new(false))?;
            match drawn.into_iter().next() {
                Some((_, Ok(png))) => (png, "png"),
                Some((_, Err(why))) => return Err(Error::invalid(why)),
                None => return Err(Error::invalid(tr!("core-library-no-small"))),
            }
        }
        FileKind::Document | FileKind::Other => return Err(Error::invalid(tr!("core-library-no-small"))),
    };
    let file = file_of(library_dir, hash, ending);
    // What cannot be kept is made again the next time.
    if fs::create_dir_all(library_dir.join(DIR)).is_ok()
        && let Err(e) = write_atomic(&file, &bytes)
    {
        tracing::warn!(%e, hash, "a thumbnail could not be kept");
    }
    Ok(bytes)
}

/// A picture made no wider than a thumbnail, upright, over nothing: a
/// photograph as JPEG, anything else as PNG.
fn of_picture(bytes: &[u8]) -> Result<(Vec<u8>, &'static str)> {
    let kind = figures::kind_of(bytes).ok_or_else(figures::not_a_picture)?;
    let format = match kind {
        Kind::Png => ImageFormat::Png,
        Kind::Jpeg => ImageFormat::Jpeg,
        Kind::Other(format) => format,
        Kind::Svg => return Ok((bytes.to_vec(), "svg")),
    };
    let (picture, _) = figures::decode(bytes, format)?;
    let picture = if picture.width() > WIDTH {
        let height = (u64::from(picture.height()) * u64::from(WIDTH) / u64::from(picture.width())).max(1) as u32;
        picture.resize_exact(WIDTH, height, image::imageops::FilterType::Triangle)
    } else {
        picture
    };
    let (format, ending) = if kind == Kind::Jpeg { (ImageFormat::Jpeg, "jpg") } else { (ImageFormat::Png, "png") };
    Ok((figures::encode(&picture, format)?, ending))
}

/// Takes away the thumbnail of a file, as the file goes or is replaced.
pub fn forget(library_dir: &Path, hash: &str) {
    for ending in ["png", "jpg"] {
        let _ = fs::remove_file(file_of(library_dir, hash, ending));
    }
}

/// How large a thumbnail is: for the tests.
#[cfg(test)]
fn size_of(bytes: &[u8]) -> Option<(u32, u32)> {
    image::ImageReader::new(std::io::Cursor::new(bytes)).with_guessed_format().ok()?.into_dimensions().ok()
}

#[cfg(test)]
mod tests {
    use std::io::Cursor;

    use image::DynamicImage;

    use super::*;
    use crate::library::figures::fixtures::{PNG, SVG};

    fn store(dir: &Path, name: &str, bytes: &[u8]) -> (String, String) {
        let stored = attachments::store_bytes(dir, bytes, name).unwrap();
        let hash = attachments::hash_of_path(&stored).unwrap().to_owned();
        (hash, stored)
    }

    #[test]
    fn an_image_is_made_small_once_and_kept() {
        let tmp = tempfile::tempdir().unwrap();
        let dir = tmp.path();
        let work = dir.join("work");
        let tools = Tools::default();
        let large = DynamicImage::ImageRgb8(image::RgbImage::from_pixel(960, 640, image::Rgb([10, 120, 200])));
        let mut bytes = Cursor::new(Vec::new());
        large.write_to(&mut bytes, ImageFormat::Bmp).unwrap();
        let (hash, stored) = store(dir, "plate.bmp", bytes.get_ref());
        let made = small(dir, &hash, &stored, "plate.bmp", &tools, &work).unwrap();
        assert_eq!(size_of(&made), Some((WIDTH, 320)));
        assert_eq!(image::guess_format(&made).unwrap(), ImageFormat::Png);
        assert_eq!(fs::read(file_of(dir, &hash, "png")).unwrap(), made, "kept");
        // Asked again, the one kept is given, even where the file is gone.
        fs::remove_file(attachments::absolute(dir, &stored).unwrap()).unwrap();
        assert_eq!(small(dir, &hash, &stored, "plate.bmp", &tools, &work).unwrap(), made);
        forget(dir, &hash);
        assert!(small(dir, &hash, &stored, "plate.bmp", &tools, &work).is_err());

        // A photograph stays a photograph; a small picture keeps its size.
        let mut photo = Cursor::new(Vec::new());
        large.write_to(&mut photo, ImageFormat::Jpeg).unwrap();
        let (hash, stored) = store(dir, "photo.jpg", photo.get_ref());
        let made = small(dir, &hash, &stored, "photo.jpg", &tools, &work).unwrap();
        assert_eq!(image::guess_format(&made).unwrap(), ImageFormat::Jpeg);
        assert!(file_of(dir, &hash, "jpg").is_file());
        let (hash, stored) = store(dir, "vase.png", &PNG);
        assert_eq!(size_of(&small(dir, &hash, &stored, "vase.png", &tools, &work).unwrap()), Some((4, 3)));
    }

    #[test]
    fn a_drawing_is_its_own_thumbnail_and_other_kinds_have_none() {
        let tmp = tempfile::tempdir().unwrap();
        let dir = tmp.path();
        let work = dir.join("work");
        let tools = Tools::default();
        let (hash, stored) = store(dir, "circle.svg", SVG.as_bytes());
        assert_eq!(small(dir, &hash, &stored, "circle.svg", &tools, &work).unwrap(), SVG.as_bytes());
        assert!(!dir.join(DIR).join(format!("{hash}.svg")).exists(), "not kept");
        let (hash, stored) = store(dir, "notes.txt", b"plain words");
        assert!(small(dir, &hash, &stored, "notes.txt", &tools, &work).is_err());
        assert!(small(dir, "../../etc", &stored, "notes.txt", &tools, &work).is_err());
    }

    #[test]
    fn a_pdf_is_shown_small_by_its_first_page() {
        let tmp = tempfile::tempdir().unwrap();
        let dir = tmp.path();
        let work = dir.join("work");
        let tools = Tools::default();
        let pdf = fs::read(Path::new(env!("CARGO_MANIFEST_DIR")).join("../../e2e/fixtures/structure.pdf")).unwrap();
        let (hash, stored) = store(dir, "structure.pdf", &pdf);
        let made = small(dir, &hash, &stored, "structure.pdf", &tools, &work).unwrap();
        let (width, height) = size_of(&made).unwrap();
        assert_eq!(width, WIDTH);
        assert!(height > width, "a page stands upright: {width} × {height}");
        assert!(file_of(dir, &hash, "png").is_file());
    }
}
