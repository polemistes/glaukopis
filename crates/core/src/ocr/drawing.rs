//! The pages of a PDF drawn as pictures, for Tesseract to read.
//!
//! hayro draws them: a library in Rust, with nothing outside it. A PDF that
//! it cannot open, one that is locked or damaged past mending, is drawn by
//! Poppler's `pdftoppm` where that is installed, and its pages are counted
//! and measured by `pdfinfo`, which comes with it.
//!
//! A page is drawn as it is shown: what its crop box holds, turned as it
//! says it is to be turned. What is laid over it afterwards is laid in the
//! same way (`searchable.rs`).

use std::io::Write;
use std::panic::{AssertUnwindSafe, catch_unwind};
use std::path::{Path, PathBuf};
use std::sync::atomic::AtomicBool;

use hayro::hayro_interpret::InterpreterSettings;
use hayro::hayro_syntax::Pdf;
use hayro::vello_cpu::color::palette::css::WHITE;
use hayro::{RenderCache, RenderSettings};

use crate::error::{Error, IoContext, Result};
use crate::export::tools::{self, Tool};

/// Tesseract reads best what is drawn at 300 dots to the inch.
pub const DPI: f32 = 300.0;

/// No side of a picture of a page is longer than this, in dots: a plan a
/// metre wide is drawn at less than 300 dots to the inch, so that its
/// picture is not hundreds of megabytes.
const LONGEST: f32 = 10_000.0;

/// A picture of a page in shades of grey, a byte to a dot, row after row
/// from the top.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Drawn {
    pub width: u32,
    pub height: u32,
    pub dpi: u32,
    pub grey: Vec<u8>,
}

impl Drawn {
    /// Writes the picture as PGM, the plainest kind there is, which
    /// Tesseract reads as it is and which takes no time to write.
    pub fn write(&self, path: &Path) -> Result<()> {
        let file = std::fs::File::create(path).context(|| format!("writing {}", path.display()))?;
        let mut out = std::io::BufWriter::new(file);
        write!(out, "P5\n{} {}\n255\n", self.width, self.height)
            .and_then(|()| out.write_all(&self.grey))
            .and_then(|()| out.flush())
            .context(|| format!("writing {}", path.display()))
    }

    /// A picture of the store or of a file, made grey on white: what is
    /// transparent is taken to stand on white paper, and a photograph is
    /// turned upright where it says it is to be turned.
    pub fn of_picture(bytes: &[u8]) -> Result<Drawn> {
        use image::ImageDecoder;
        let unreadable = |e: image::ImageError| Error::invalid(format!("the picture could not be read: {e}"));
        let reader = image::ImageReader::new(std::io::Cursor::new(bytes))
            .with_guessed_format()
            .context(|| "reading the picture".to_owned())?;
        let mut decoder = reader.into_decoder().map_err(unreadable)?;
        let orientation = decoder.orientation().unwrap_or(image::metadata::Orientation::NoTransforms);
        let mut picture = image::DynamicImage::from_decoder(decoder).map_err(unreadable)?;
        picture.apply_orientation(orientation);
        let rgba = picture.to_rgba8();
        let grey = rgba
            .pixels()
            .map(|p| {
                let [r, g, b, a] = p.0;
                let shade = luma(r, g, b);
                // Over white: what is not there at all is paper.
                let a = u32::from(a);
                ((u32::from(shade) * a + 255 * (255 - a)) / 255) as u8
            })
            .collect();
        // What a picture says of its resolution is lost here; Tesseract
        // judges it from the size of the letters.
        Ok(Drawn { width: rgba.width(), height: rgba.height(), dpi: 0, grey })
    }
}

/// How light a colour is, as the eye sees it (ITU-R BT.601).
fn luma(r: u8, g: u8, b: u8) -> u8 {
    ((u32::from(r) * 299 + u32::from(g) * 587 + u32::from(b) * 114 + 500) / 1000) as u8
}

/// The dots to the inch a page is drawn at: 300, and fewer for a page so
/// large that its picture would be too large. The sizes are in points.
pub fn resolution(width: f32, height: f32) -> f32 {
    let longest = width.max(height) / 72.0 * DPI;
    if longest > LONGEST { DPI * LONGEST / longest } else { DPI }
}

/// A PDF whose pages can be drawn.
pub enum Pages {
    Hayro(Box<Pdf>),
    Poppler {
        pdftoppm: PathBuf,
        file: PathBuf,
        /// The size of each page as it is shown, in points.
        sizes: Vec<(f32, f32)>,
    },
}

impl Pages {
    /// Opens a PDF for drawing: by hayro, and by Poppler where hayro cannot
    /// and Poppler is there.
    pub fn open(path: &Path, bytes: Vec<u8>, pdftoppm: Option<&Tool>) -> Result<Pages> {
        let name = path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
        let opened = catch_unwind(AssertUnwindSafe(|| Pdf::new(bytes)));
        let why = match opened {
            Ok(Ok(pdf)) if !pdf.pages().is_empty() => return Ok(Pages::Hayro(Box::new(pdf))),
            Ok(Ok(_)) => return Err(Error::invalid(format!("“{name}” has no pages."))),
            Ok(Err(hayro::hayro_syntax::LoadPdfError::Decryption(_))) => Locked::Yes,
            Ok(Err(_)) | Err(_) => Locked::No,
        };
        if let Some(pdftoppm) = pdftoppm
            && let Some(sizes) = poppler_sizes(&pdftoppm.path, path)
            && !sizes.is_empty()
        {
            return Ok(Pages::Poppler { pdftoppm: pdftoppm.path.clone(), file: path.to_owned(), sizes });
        }
        Err(Error::invalid(match why {
            Locked::Yes => format!("“{name}” is locked with a password, and its pages cannot be drawn."),
            Locked::No => format!("“{name}” could not be read as a PDF. It may be damaged."),
        }))
    }

    pub fn count(&self) -> usize {
        match self {
            Pages::Hayro(pdf) => pdf.pages().len(),
            Pages::Poppler { sizes, .. } => sizes.len(),
        }
    }

    /// Draws a page, counted from nought, into a file in `dir`, and gives
    /// the file and the dots to the inch it was drawn at.
    pub fn draw(&self, index: usize, dir: &Path, stop: &AtomicBool) -> Result<(PathBuf, u32)> {
        match self {
            Pages::Hayro(pdf) => {
                let drawn = draw_with_hayro(pdf, index)?;
                let path = dir.join(format!("page-{}.pgm", index + 1));
                drawn.write(&path)?;
                Ok((path, drawn.dpi))
            }
            Pages::Poppler { pdftoppm, file, sizes } => {
                let (width, height) = sizes.get(index).copied().ok_or_else(|| Error::not_found("the page"))?;
                let dpi = resolution(width, height).floor();
                let base = dir.join(format!("page-{}", index + 1));
                let number = (index + 1).to_string();
                let args: Vec<std::ffi::OsString> = vec![
                    "-png".into(),
                    "-gray".into(),
                    "-cropbox".into(),
                    "-r".into(),
                    dpi.to_string().into(),
                    "-f".into(),
                    number.clone().into(),
                    "-l".into(),
                    number.into(),
                    "-singlefile".into(),
                    file.into(),
                    base.clone().into(),
                ];
                tools::run_until(pdftoppm, "pdftoppm", &args, None, None, stop)?;
                Ok((base.with_extension("png"), dpi as u32))
            }
        }
    }
}

enum Locked {
    Yes,
    No,
}

/// Draws a page with hayro. A page it loses itself in is an error of that
/// page, and not of the others.
pub fn draw_with_hayro(pdf: &Pdf, index: usize) -> Result<Drawn> {
    let page = pdf.pages().get(index).ok_or_else(|| Error::not_found("the page"))?;
    let (width, height) = page.render_dimensions();
    let dpi = resolution(width, height).floor();
    let scale = dpi / 72.0;
    let settings = RenderSettings { x_scale: scale, y_scale: scale, bg_color: WHITE, ..Default::default() };
    let drawn = catch_unwind(AssertUnwindSafe(|| {
        let cache = RenderCache::new();
        hayro::render(page, &cache, &InterpreterSettings::default(), &settings)
    }))
    .map_err(|_| Error::invalid(format!("page {} could not be drawn", index + 1)))?;
    let grey = drawn.data_as_u8_slice().as_chunks::<4>().0.iter().map(|p| luma(p[0], p[1], p[2])).collect();
    Ok(Drawn { width: u32::from(drawn.width()), height: u32::from(drawn.height()), dpi: dpi as u32, grey })
}

/// The pages of a PDF and their sizes as they are shown, as Poppler's
/// `pdfinfo` tells them. Nothing, where it is not beside `pdftoppm` or
/// cannot read the file either.
fn poppler_sizes(pdftoppm: &Path, file: &Path) -> Option<Vec<(f32, f32)>> {
    let pdfinfo = pdftoppm.with_file_name(if cfg!(windows) { "pdfinfo.exe" } else { "pdfinfo" });
    let out = tools::run(
        &pdfinfo,
        "pdfinfo",
        [std::ffi::OsStr::new("-f"), "1".as_ref(), "-l".as_ref(), "100000".as_ref(), file.as_os_str()],
        None,
        None,
    )
    .ok()?;
    Some(page_sizes(&String::from_utf8_lossy(&out.stdout)))
}

/// The size of each page in what `pdfinfo -f 1 -l N` says: `Page    3 size:
/// 595.276 x 841.89 pts (A4)` and `Page    3 rot:  90`, turned as the page
/// is shown.
pub fn page_sizes(said: &str) -> Vec<(f32, f32)> {
    let mut sizes: Vec<(f32, f32)> = Vec::new();
    for line in said.lines() {
        let Some(rest) = line.strip_prefix("Page") else { continue };
        let mut words = rest.split_whitespace();
        let Some(number) = words.next().and_then(|n| n.parse::<usize>().ok()) else { continue };
        match words.next() {
            Some("size:") => {
                let width = words.next().and_then(|w| w.parse::<f32>().ok());
                let height = words.nth(1).and_then(|h| h.parse::<f32>().ok());
                if let (Some(width), Some(height)) = (width, height)
                    && number == sizes.len() + 1
                {
                    sizes.push((width, height));
                }
            }
            Some("rot:") => {
                let turned = words.next().and_then(|r| r.parse::<i32>().ok()).is_some_and(|r| r.rem_euclid(180) == 90);
                if turned && let Some(size) = sizes.get_mut(number - 1) {
                    *size = (size.1, size.0);
                }
            }
            _ => {}
        }
    }
    sizes
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_page_is_drawn_at_300_dots_unless_it_is_very_large() {
        assert_eq!(resolution(595.0, 842.0), 300.0);
        // A0 is 2384 by 3370 points: its longer side would be 14,041 dots.
        let a0 = resolution(2384.0, 3370.0);
        assert!((a0 * 3370.0 / 72.0 - LONGEST).abs() < 1.0, "{a0}");
    }

    #[test]
    fn what_pdfinfo_says_of_the_pages() {
        let said = "Title:   A scan\nPages:          3\n\
                    Page    1 size: 595.276 x 841.89 pts (A4)\nPage    1 rot:  0\n\
                    Page    2 size: 612 x 792 pts (letter)\nPage    2 rot:  90\n\
                    Page    3 size: 419.528 x 595.276 pts (A5)\nPage    3 rot:  270\n";
        assert_eq!(page_sizes(said), vec![(595.276, 841.89), (792.0, 612.0), (595.276, 419.528)]);
        assert!(page_sizes("Syntax Error: Couldn't find trailer dictionary").is_empty());
    }

    #[test]
    fn a_picture_is_made_grey_on_white() {
        // A black dot, a red one, and one that is not there at all.
        let mut picture = image::RgbaImage::new(3, 1);
        picture.put_pixel(0, 0, image::Rgba([0, 0, 0, 255]));
        picture.put_pixel(1, 0, image::Rgba([255, 0, 0, 255]));
        picture.put_pixel(2, 0, image::Rgba([0, 0, 0, 0]));
        let mut bytes = std::io::Cursor::new(Vec::new());
        picture.write_to(&mut bytes, image::ImageFormat::Png).unwrap();
        let drawn = Drawn::of_picture(bytes.get_ref()).unwrap();
        assert_eq!((drawn.width, drawn.height), (3, 1));
        assert_eq!(drawn.grey, vec![0, 76, 255]);

        let tmp = tempfile::tempdir().unwrap();
        let path = tmp.path().join("dots.pgm");
        drawn.write(&path).unwrap();
        assert_eq!(std::fs::read(&path).unwrap(), b"P5\n3 1\n255\n\x00\x4c\xff");

        assert!(Drawn::of_picture(b"no picture").is_err());
    }
}
