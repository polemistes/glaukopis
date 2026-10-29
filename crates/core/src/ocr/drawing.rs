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
use std::sync::Arc;
use std::sync::atomic::AtomicBool;

use hayro::hayro_interpret::InterpreterSettings;
use hayro::hayro_syntax::Pdf;
use hayro::vello_cpu::color::palette::css::WHITE;
use hayro::{RenderCache, RenderSettings};

use crate::error::{Error, IoContext, Result};
use crate::export::tools::{self, Tool};
use crate::tr;

/// Tesseract reads best what is drawn at 300 dots to the inch.
pub const DPI: f32 = 300.0;

/// The fewest and the most dots to the inch a page may be asked to be drawn
/// at: fewer and the letters are too small to be read, more and the picture
/// is large for nothing.
pub const LEAST_DPI: u32 = 150;
pub const MOST_DPI: u32 = 600;

/// How the pages are drawn for Tesseract: at what resolution, and whether
/// in black and white.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub struct Quality {
    /// The dots to the inch asked for; nought where none were, which is 300.
    pub dpi: u32,
    /// Whether the picture is made black and white, by Otsu's threshold on
    /// the grey: for faint or uneven print, which Tesseract reads better so.
    pub contrast: bool,
}

impl Quality {
    /// The dots to the inch a page is drawn at, before it is seen to be very
    /// large: 300 where none are asked for, else as asked within what is
    /// allowed.
    pub fn dots(&self) -> f32 {
        dots_asked(self.dpi)
    }
}

/// The dots to the inch that `asked` comes to: 300 where it is nought, else
/// `asked` held within 150 and 600.
pub fn dots_asked(asked: u32) -> f32 {
    if asked == 0 { DPI } else { asked.clamp(LEAST_DPI, MOST_DPI) as f32 }
}

/// No side of a picture of a page is longer than this, in dots: a plan a
/// metre wide is drawn at less than 300 dots to the inch, so that its
/// picture is not hundreds of megabytes.
pub(crate) const LONGEST: f32 = 10_000.0;

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
        let file = std::fs::File::create(path).context(|| tr!("io-writing", path = path))?;
        let mut out = std::io::BufWriter::new(file);
        write!(out, "P5\n{} {}\n255\n", self.width, self.height)
            .and_then(|()| out.write_all(&self.grey))
            .and_then(|()| out.flush())
            .context(|| tr!("io-writing", path = path))
    }

    /// A picture of the store or of a file, made grey on white: what is
    /// transparent is taken to stand on white paper, and a photograph is
    /// turned upright where it says it is to be turned.
    pub fn of_picture(bytes: &[u8]) -> Result<Drawn> {
        use image::ImageDecoder;
        let unreadable = |e: image::ImageError| Error::invalid(tr!("ocr-picture-unreadable", message = e.to_string()));
        let reader = image::ImageReader::new(std::io::Cursor::new(bytes))
            .with_guessed_format()
            .map_err(|e| Error::invalid(tr!("ocr-picture-unreadable", message = e.to_string())))?;
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

    /// Makes the picture black and white: each dot darker than Otsu's
    /// threshold black, the rest white.
    pub fn black_and_white(&mut self) {
        black_and_white(&mut self.grey);
    }

    /// Made as `quality` asks: black and white, where that is asked.
    pub fn as_asked(mut self, quality: Quality) -> Drawn {
        if quality.contrast {
            self.black_and_white();
        }
        self
    }
}

/// The shade that parts a grey picture into its dark and its light dots
/// best, by Otsu's method: the one that puts the most of the picture's
/// variance between the two. Dots at or below it are dark.
pub fn otsu(grey: &[u8]) -> u8 {
    let mut histogram = [0u64; 256];
    for shade in grey {
        histogram[usize::from(*shade)] += 1;
    }
    let total = grey.len() as f64;
    let sum: f64 = histogram.iter().enumerate().map(|(shade, n)| shade as f64 * *n as f64).sum();
    let (mut dark, mut dark_sum) = (0.0, 0.0);
    let (mut best, mut at) = (-1.0, 0u8);
    for (shade, n) in histogram.iter().enumerate().take(255) {
        dark += *n as f64;
        dark_sum += shade as f64 * *n as f64;
        let light = total - dark;
        if dark == 0.0 || light == 0.0 {
            continue;
        }
        let between = dark * light * (dark_sum / dark - (sum - dark_sum) / light).powi(2);
        if between > best {
            best = between;
            at = shade as u8;
        }
    }
    at
}

/// Makes grey black and white, at Otsu's threshold.
pub fn black_and_white(grey: &mut [u8]) {
    let threshold = otsu(grey);
    for shade in grey {
        *shade = if *shade <= threshold { 0 } else { 255 };
    }
}

/// How light a colour is, as the eye sees it (ITU-R BT.601).
fn luma(r: u8, g: u8, b: u8) -> u8 {
    ((u32::from(r) * 299 + u32::from(g) * 587 + u32::from(b) * 114 + 500) / 1000) as u8
}

/// The dots to the inch a page is drawn at: `dots`, which is 300 unless
/// another is asked for, and fewer for a page so large that its picture
/// would be too large. The sizes are in points.
pub fn resolution(width: f32, height: f32, dots: f32) -> f32 {
    let longest = width.max(height) / 72.0 * dots;
    if longest > LONGEST { dots * LONGEST / longest } else { dots }
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
    /// and Poppler is there. `bytes` are what the file at `path` holds.
    pub fn open(path: &Path, bytes: Arc<Vec<u8>>, pdftoppm: Option<&Tool>) -> Result<Pages> {
        let file = path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
        let opened = catch_unwind(AssertUnwindSafe(|| Pdf::new(bytes)));
        let locked = match opened {
            Ok(Ok(pdf)) if !pdf.pages().is_empty() => return Ok(Pages::Hayro(Box::new(pdf))),
            Ok(Ok(_)) => return Err(Error::invalid(tr!("ocr-no-pages", file = &file))),
            Ok(Err(hayro::hayro_syntax::LoadPdfError::Decryption(_))) => true,
            Ok(Err(_)) | Err(_) => false,
        };
        if let Some(pdftoppm) = pdftoppm
            && let Some(sizes) = poppler_sizes(&pdftoppm.path, path)
            && !sizes.is_empty()
        {
            return Ok(Pages::Poppler { pdftoppm: pdftoppm.path.clone(), file: path.to_owned(), sizes });
        }
        Err(Error::invalid(if locked { tr!("ocr-locked", file = &file) } else { tr!("ocr-unreadable", file = &file) }))
    }

    pub fn count(&self) -> usize {
        match self {
            Pages::Hayro(pdf) => pdf.pages().len(),
            Pages::Poppler { sizes, .. } => sizes.len(),
        }
    }

    /// The size of a page as it is shown, in points.
    fn size(&self, index: usize) -> Option<(f32, f32)> {
        match self {
            Pages::Hayro(pdf) => pdf.pages().get(index).map(|page| page.render_dimensions()),
            Pages::Poppler { sizes, .. } => sizes.get(index).copied(),
        }
    }

    /// How many dots the largest of these pages comes to, drawn at `quality`:
    /// what decides how much memory reading one of them takes.
    pub fn largest_dots(&self, indices: &[usize], quality: Quality) -> u64 {
        indices
            .iter()
            .filter_map(|&i| self.size(i))
            .map(|(width, height)| {
                let dpi = resolution(width, height, quality.dots()).floor();
                ((width / 72.0 * dpi) as u64).saturating_mul((height / 72.0 * dpi) as u64)
            })
            .max()
            .unwrap_or(0)
    }

    /// Draws a page, counted from nought, into a file in `dir`, as `quality`
    /// asks, and gives the file and the dots to the inch it was drawn at.
    pub fn draw(&self, index: usize, dir: &Path, quality: Quality, stop: &AtomicBool) -> Result<(PathBuf, u32)> {
        match self {
            Pages::Hayro(pdf) => {
                let drawn = draw_with_hayro(pdf, index, quality)?;
                let path = dir.join(format!("page-{}.pgm", index + 1));
                drawn.write(&path)?;
                Ok((path, drawn.dpi))
            }
            Pages::Poppler { pdftoppm, file, sizes } => {
                let not_drawn = || Error::invalid(tr!("ocr-page-not-drawn", page = index + 1));
                let (width, height) = sizes.get(index).copied().ok_or_else(not_drawn)?;
                let dpi = resolution(width, height, quality.dots()).floor();
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
                let png = base.with_extension("png");
                if !quality.contrast {
                    return Ok((png, dpi as u32));
                }
                // Made black and white here, and written as PGM as hayro's pages are.
                let drawn = Drawn::of_png(&png, dpi as u32).map_err(|_| not_drawn())?;
                let _ = std::fs::remove_file(&png);
                let pgm = base.with_extension("pgm");
                drawn.as_asked(quality).write(&pgm)?;
                Ok((pgm, dpi as u32))
            }
        }
    }
}

impl Drawn {
    /// A page as `pdftoppm` drew it, grey, read back from its PNG.
    fn of_png(path: &Path, dpi: u32) -> Result<Drawn> {
        let picture = image::open(path)
            .map_err(|e| Error::invalid(tr!("ocr-picture-unreadable", message = e.to_string())))?
            .into_luma8();
        Ok(Drawn { width: picture.width(), height: picture.height(), dpi, grey: picture.into_raw() })
    }

    /// A page as it was drawn for Tesseract, read back from its file: PGM as
    /// [`Drawn::write`] writes it, or PNG as Poppler draws it.
    pub fn read_back(path: &Path, dpi: u32) -> Result<Drawn> {
        if path.extension().is_some_and(|e| e == "png") {
            return Drawn::of_png(path, dpi);
        }
        let unreadable = || Error::invalid(tr!("ocr-picture-unreadable", message = path.display().to_string()));
        let bytes = std::fs::read(path).context(|| tr!("io-reading", path = path))?;
        // `P5`, the width, the height and 255, each followed by one white space.
        let mut fields = Vec::new();
        let mut at = 0;
        while fields.len() < 4 {
            let start = at;
            while at < bytes.len() && !bytes[at].is_ascii_whitespace() {
                at += 1;
            }
            fields.push(std::str::from_utf8(&bytes[start..at]).map_err(|_| unreadable())?.to_owned());
            at += 1;
        }
        let number = |i: usize| fields[i].parse::<u32>().map_err(|_| unreadable());
        let (width, height) = (number(1)?, number(2)?);
        let grey = bytes.get(at..).ok_or_else(unreadable)?.to_vec();
        if fields[0] != "P5" || number(3)? != 255 || grey.len() != width as usize * height as usize {
            return Err(unreadable());
        }
        Ok(Drawn { width, height, dpi, grey })
    }

    /// The picture made smaller, where its longer side is longer than
    /// `longest` dots, to be shown: as PNG, with its width and height, and
    /// the scale it was made smaller by (1 where it was not).
    pub fn shown(&self, longest: u32) -> Result<Shown> {
        let failed = |e: image::ImageError| Error::invalid(tr!("ocr-picture-unreadable", message = e.to_string()));
        let picture = image::GrayImage::from_raw(self.width, self.height, self.grey.clone())
            .ok_or_else(|| Error::invalid(tr!("ocr-picture-unreadable", message = "the picture is not whole")))?;
        let side = self.width.max(self.height).max(1);
        let scale = if side > longest { longest as f32 / side as f32 } else { 1.0 };
        let picture = if scale < 1.0 {
            let width = ((self.width as f32 * scale).round() as u32).max(1);
            let height = ((self.height as f32 * scale).round() as u32).max(1);
            image::imageops::resize(&picture, width, height, image::imageops::FilterType::Triangle)
        } else {
            picture
        };
        let mut png = std::io::Cursor::new(Vec::new());
        picture.write_to(&mut png, image::ImageFormat::Png).map_err(failed)?;
        Ok(Shown { png: png.into_inner(), width: picture.width(), height: picture.height(), scale })
    }
}

/// A picture of a page made to be shown (`Drawn::shown`).
#[derive(Debug, Clone, PartialEq)]
pub struct Shown {
    pub png: Vec<u8>,
    pub width: u32,
    pub height: u32,
    /// What the places on the picture as it was drawn are multiplied by to
    /// be places on this one.
    pub scale: f32,
}

/// Draws a page with hayro, as `quality` asks. A page it loses itself in is
/// an error of that page, and not of the others.
pub fn draw_with_hayro(pdf: &Pdf, index: usize, quality: Quality) -> Result<Drawn> {
    let not_drawn = || Error::invalid(tr!("ocr-page-not-drawn", page = index + 1));
    let page = pdf.pages().get(index).ok_or_else(not_drawn)?;
    let (width, height) = page.render_dimensions();
    let dpi = resolution(width, height, quality.dots()).floor();
    let scale = dpi / 72.0;
    let settings = RenderSettings { x_scale: scale, y_scale: scale, bg_color: WHITE, ..Default::default() };
    let drawn = catch_unwind(AssertUnwindSafe(|| {
        let cache = RenderCache::new();
        hayro::render(page, &cache, &InterpreterSettings::default(), &settings)
    }))
    .map_err(|_| not_drawn())?;
    let grey = drawn.data_as_u8_slice().as_chunks::<4>().0.iter().map(|p| luma(p[0], p[1], p[2])).collect();
    Ok(Drawn { width: u32::from(drawn.width()), height: u32::from(drawn.height()), dpi: dpi as u32, grey }
        .as_asked(quality))
}

/// The pages of a PDF and their sizes as they are shown, as Poppler's
/// `pdfinfo` tells them. Nothing, where it is not beside `pdftoppm` or
/// cannot read the file either.
pub(crate) fn poppler_sizes(pdftoppm: &Path, file: &Path) -> Option<Vec<(f32, f32)>> {
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

// ---------------------------------------------------------------------------
// Small pictures of the pages, to be shown
// ---------------------------------------------------------------------------

/// How large a small picture of a page of `width` by `height` points is,
/// drawn `wide` dots wide: as wide as asked, and as high as the page's shape
/// makes it; smaller, where its longer side would be longer than any picture
/// of a page may be. Nothing, where the page has no size.
pub fn small_size(width: f32, height: f32, wide: u32) -> Option<(u32, u32)> {
    if !(width > 0.0 && height > 0.0) {
        return None;
    }
    let mut scale = (wide.max(1) as f32).min(LONGEST) / width;
    if height * scale > LONGEST {
        scale = LONGEST / height;
    }
    Some((((width * scale).round() as u32).max(1), ((height * scale).round() as u32).max(1)))
}

/// Draws a page with hayro `wide` dots wide, in grey: at the dots to the
/// inch that make it so, however few. Not as a page is drawn for Tesseract,
/// at 150 to 600 dots: a picture 120 dots wide of a page of A4 is drawn at
/// about 15. A page it loses itself in is an error of that page alone.
pub fn draw_small_with_hayro(pdf: &Pdf, index: usize, wide: u32) -> Result<Drawn> {
    let not_drawn = || Error::invalid(tr!("ocr-page-not-drawn", page = index + 1));
    let page = pdf.pages().get(index).ok_or_else(not_drawn)?;
    let (width, height) = page.render_dimensions();
    let (across, down) = small_size(width, height, wide).ok_or_else(not_drawn)?;
    let settings = RenderSettings {
        x_scale: across as f32 / width,
        y_scale: down as f32 / height,
        width: u16::try_from(across).ok(),
        height: u16::try_from(down).ok(),
        bg_color: WHITE,
    };
    let drawn = catch_unwind(AssertUnwindSafe(|| {
        let cache = RenderCache::new();
        hayro::render(page, &cache, &InterpreterSettings::default(), &settings)
    }))
    .map_err(|_| not_drawn())?;
    let grey = drawn.data_as_u8_slice().as_chunks::<4>().0.iter().map(|p| luma(p[0], p[1], p[2])).collect();
    let dpi = (across as f32 * 72.0 / width).round() as u32;
    Ok(Drawn { width: u32::from(drawn.width()), height: u32::from(drawn.height()), dpi, grey })
}

impl Drawn {
    /// The picture as a PNG, in grey.
    pub fn png(&self) -> Result<Vec<u8>> {
        use image::ImageEncoder;
        let mut out = Vec::new();
        image::codecs::png::PngEncoder::new(&mut out)
            .write_image(&self.grey, self.width, self.height, image::ExtendedColorType::L8)
            .map_err(|e| Error::invalid(e.to_string()))?;
        Ok(out)
    }
}

impl Pages {
    /// A small picture of a page, counted from nought, `wide` dots wide, in
    /// grey, as a PNG: to be shown, not read. Poppler draws it, in `dir`,
    /// where hayro cannot open the file.
    pub fn small(&self, index: usize, wide: u32, dir: &Path, stop: &AtomicBool) -> Result<Vec<u8>> {
        match self {
            Pages::Hayro(pdf) => draw_small_with_hayro(pdf, index, wide)?.png(),
            Pages::Poppler { pdftoppm, file, sizes } => {
                let not_drawn = || Error::invalid(tr!("ocr-page-not-drawn", page = index + 1));
                let (width, height) = sizes.get(index).copied().ok_or_else(not_drawn)?;
                let (across, down) = small_size(width, height, wide).ok_or_else(not_drawn)?;
                // At the dots to the inch that make it as wide as asked: Poppler
                // would scale to a width the page before it is turned.
                let dpi = across as f32 * 72.0 / width;
                let base = dir.join(format!("small-{}", index + 1));
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
                // Read back and written again, of the size asked for: Poppler's
                // grey may come as colour, and its size a dot more or less.
                let png = base.with_extension("png");
                let drawn = Drawn::of_png(&png, dpi.round() as u32).map_err(|_| not_drawn());
                let _ = std::fs::remove_file(&png);
                let mut drawn = drawn?;
                if (drawn.width, drawn.height) != (across, down) {
                    let picture =
                        image::GrayImage::from_raw(drawn.width, drawn.height, drawn.grey).ok_or_else(not_drawn)?;
                    let sized = image::imageops::resize(&picture, across, down, image::imageops::FilterType::Triangle);
                    drawn = Drawn { width: across, height: down, dpi: drawn.dpi, grey: sized.into_raw() };
                }
                drawn.png()
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Pages at a width, in colour, to be shown in a view
// ---------------------------------------------------------------------------

/// Draws a page with hayro `wide` dots wide, in colour on white: a page of a
/// file shown in a view, at the size it is shown. As high as the page's
/// shape makes it, and smaller where its longer side would be longer than
/// any picture of a page may be (`small_size`). A page it loses itself in is
/// an error of that page alone.
pub fn draw_wide_with_hayro(pdf: &Pdf, index: usize, wide: u32) -> Result<image::RgbImage> {
    let not_drawn = || Error::invalid(tr!("ocr-page-not-drawn", page = index + 1));
    let page = pdf.pages().get(index).ok_or_else(not_drawn)?;
    let (width, height) = page.render_dimensions();
    let (across, down) = small_size(width, height, wide).ok_or_else(not_drawn)?;
    let settings = RenderSettings {
        x_scale: across as f32 / width,
        y_scale: down as f32 / height,
        width: u16::try_from(across).ok(),
        height: u16::try_from(down).ok(),
        bg_color: WHITE,
    };
    let drawn = catch_unwind(AssertUnwindSafe(|| {
        let cache = RenderCache::new();
        hayro::render(page, &cache, &InterpreterSettings::default(), &settings)
    }))
    .map_err(|_| not_drawn())?;
    // On white, every dot is whole: what hayro gives premultiplied is the colour itself.
    let rgb: Vec<u8> = drawn.data_as_u8_slice().as_chunks::<4>().0.iter().flat_map(|p| [p[0], p[1], p[2]]).collect();
    image::RgbImage::from_raw(u32::from(drawn.width()), u32::from(drawn.height()), rgb).ok_or_else(not_drawn)
}

/// A picture in colour as a PNG, written quickly rather than small: it is
/// made to be shown, and kept a while (`pages_cache.rs`). Each row is told
/// by the row above it, which costs a page of text some 15 % more bytes
/// than the filter chosen row by row and saves some 40 % of the time; a
/// scan, 6 % more and 20 % less (`tests/pages_encoded.rs`). Said, rather
/// than left to the crate's default, which is the same packing today but
/// need not stay so.
pub fn colour_png(picture: &image::RgbImage) -> Result<Vec<u8>> {
    use image::ImageEncoder;
    use image::codecs::png::{CompressionType, FilterType, PngEncoder};
    let mut out = Vec::new();
    PngEncoder::new_with_quality(&mut out, CompressionType::Fast, FilterType::Up)
        .write_image(picture.as_raw(), picture.width(), picture.height(), image::ExtendedColorType::Rgb8)
        .map_err(|e| Error::invalid(e.to_string()))?;
    Ok(out)
}

impl Pages {
    /// A page, counted from nought, drawn `wide` dots wide in colour, as a
    /// PNG: to be shown in a view. Poppler draws it, in `dir`, where hayro
    /// cannot open the file.
    pub fn at_width(&self, index: usize, wide: u32, dir: &Path, stop: &AtomicBool) -> Result<Vec<u8>> {
        match self {
            Pages::Hayro(pdf) => colour_png(&draw_wide_with_hayro(pdf, index, wide)?),
            Pages::Poppler { pdftoppm, file, sizes } => {
                let not_drawn = || Error::invalid(tr!("ocr-page-not-drawn", page = index + 1));
                let (width, height) = sizes.get(index).copied().ok_or_else(not_drawn)?;
                let (across, down) = small_size(width, height, wide).ok_or_else(not_drawn)?;
                // At the dots to the inch that make it as wide as asked, as `small` does.
                let dpi = across as f32 * 72.0 / width;
                let base = dir.join(format!("wide-{}", index + 1));
                let number = (index + 1).to_string();
                let args: Vec<std::ffi::OsString> = vec![
                    "-png".into(),
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
                // Read back and written again, of the size asked for: Poppler's
                // size may be a dot more or less.
                let png = base.with_extension("png");
                let drawn = image::open(&png).map(|p| p.into_rgb8()).map_err(|_| not_drawn());
                let _ = std::fs::remove_file(&png);
                let mut drawn = drawn?;
                if drawn.dimensions() != (across, down) {
                    drawn = image::imageops::resize(&drawn, across, down, image::imageops::FilterType::Triangle);
                }
                colour_png(&drawn)
            }
        }
    }

    /// How many dots the largest of these pages comes to, drawn `wide` dots wide.
    pub fn largest_dots_at_width(&self, indices: &[usize], wide: u32) -> u64 {
        indices
            .iter()
            .filter_map(|&i| self.size(i))
            .filter_map(|(width, height)| small_size(width, height, wide))
            .map(|(across, down)| u64::from(across) * u64::from(down))
            .max()
            .unwrap_or(0)
    }

    /// Where each page stands as it is drawn, in points: its size, and how
    /// the places of the text it has are put on it (`Frame`).
    pub fn frames(&self) -> Vec<Frame> {
        match self {
            Pages::Hayro(pdf) => pdf.pages().iter().map(Frame::of_hayro).collect(),
            Pages::Poppler { sizes, .. } => sizes.iter().map(|&size| Frame::plain(size)).collect(),
        }
    }
}

/// A page as it is drawn: its size in points, what of it is shown (the crop
/// box, within the media box) and how it is turned. The text a PDF has is
/// placed from the top left of the media box, unturned (`layer.rs`); a page
/// is drawn as it is shown, its crop box turned as it says. A frame puts the
/// one on the other.
#[derive(Debug, Clone, Copy, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct Frame {
    /// The width and height of the page as it is drawn, in points.
    pub size: (f32, f32),
    /// The top of the media box, from which the places of the text are counted down.
    pub media_top: f32,
    /// What is shown of the page, unturned: left, bottom, right, top, in the page's own points.
    pub crop: [f32; 4],
    /// The quarters it is turned clockwise as it is shown: 0 to 3.
    pub turned: u8,
}

impl Frame {
    /// A page whose crop box is its media box, at nought, and not turned:
    /// all that is known of a page Poppler measured.
    pub fn plain((width, height): (f32, f32)) -> Frame {
        Frame { size: (width, height), media_top: height, crop: [0.0, 0.0, width, height], turned: 0 }
    }

    fn of_hayro(page: &hayro::hayro_syntax::page::Page<'_>) -> Frame {
        use hayro::hayro_syntax::page::Rotation;
        let media = page.media_box();
        let crop = page.intersected_crop_box();
        let turned = match page.rotation() {
            Rotation::None => 0,
            Rotation::Horizontal => 1,
            Rotation::Flipped => 2,
            Rotation::FlippedHorizontal => 3,
        };
        let size = page.render_dimensions();
        let crop = [crop.x0 as f32, crop.y0 as f32, crop.x1 as f32, crop.y1 as f32];
        let frame = Frame { size, media_top: media.y0.max(media.y1) as f32, crop, turned };
        // A page of no size is drawn as A4 (`base_dimensions`): its text is laid as it stands.
        if crop[2] - crop[0] <= 0.0 || crop[3] - crop[1] <= 0.0 { Frame::plain(size) } else { frame }
    }

    /// A box of the text the PDF has, placed as `layer.rs` places it (left,
    /// top, right, bottom, from the top left of the media box), placed on
    /// the page as it is drawn, from its top left, in points.
    pub fn place(&self, (left, top, right, bottom): (f32, f32, f32, f32)) -> (f32, f32, f32, f32) {
        let [x0, _, x1, y1] = self.crop;
        let (wide, high) = (x1 - x0, y1 - self.crop[1]);
        // On the crop box unturned, from its top left.
        let unturned = |x: f32, y: f32| (x - x0, y + y1 - self.media_top);
        let turn = |(u, v): (f32, f32)| match self.turned % 4 {
            0 => (u, v),
            1 => (high - v, u),
            2 => (wide - u, high - v),
            _ => (v, wide - u),
        };
        let (a, b) = (turn(unturned(left, top)), turn(unturned(right, bottom)));
        (a.0.min(b.0), a.1.min(b.1), a.0.max(b.0), a.1.max(b.1))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_page_is_drawn_at_300_dots_unless_it_is_very_large() {
        assert_eq!(resolution(595.0, 842.0, DPI), 300.0);
        // A0 is 2384 by 3370 points: its longer side would be 14,041 dots.
        let a0 = resolution(2384.0, 3370.0, DPI);
        assert!((a0 * 3370.0 / 72.0 - LONGEST).abs() < 1.0, "{a0}");
        // Asked for more, a large page is still held within the longest side.
        assert_eq!(resolution(595.0, 842.0, 600.0), 600.0);
        let a0 = resolution(2384.0, 3370.0, 600.0);
        assert!((a0 * 3370.0 / 72.0 - LONGEST).abs() < 1.0, "{a0}");
    }

    #[test]
    fn the_dots_asked_for_are_held_within_what_is_allowed() {
        assert_eq!(dots_asked(0), 300.0);
        assert_eq!(dots_asked(72), 150.0);
        assert_eq!(dots_asked(150), 150.0);
        assert_eq!(dots_asked(400), 400.0);
        assert_eq!(dots_asked(1200), 600.0);
        assert_eq!(Quality { dpi: 200, contrast: false }.dots(), 200.0);
        assert_eq!(Quality::default().dots(), 300.0);
    }

    #[test]
    fn a_picture_of_two_tones_is_made_black_and_white() {
        // Dark grey on light grey, with a lighter speck in the dark.
        let mut grey = vec![60u8, 62, 58, 70, 190, 195, 185, 200, 60, 190];
        let threshold = otsu(&grey);
        assert!((70..190).contains(&threshold), "{threshold}");
        black_and_white(&mut grey);
        assert_eq!(grey, vec![0, 0, 0, 0, 255, 255, 255, 255, 0, 255]);
        // Pure black and white stay as they are.
        let mut pure = vec![0u8, 255, 255, 0];
        black_and_white(&mut pure);
        assert_eq!(pure, vec![0, 255, 255, 0]);
        // A blank page, one shade all over, is white.
        let mut blank = vec![128u8; 16];
        black_and_white(&mut blank);
        assert!(blank.iter().all(|s| *s == 255), "{blank:?}");
        black_and_white(&mut []);

        let mut drawn = Drawn { width: 2, height: 1, dpi: 300, grey: vec![40, 220] };
        drawn.black_and_white();
        assert_eq!(drawn.grey, vec![0, 255]);
        let drawn =
            Drawn { width: 2, height: 1, dpi: 300, grey: vec![40, 220] }.as_asked(Quality { dpi: 0, contrast: false });
        assert_eq!(drawn.grey, vec![40, 220]);
    }

    /// A page drawn for Tesseract is read back as it was written, and made
    /// smaller to be shown, its longer side no longer than asked.
    #[test]
    fn a_page_is_read_back_and_shown_smaller() {
        let tmp = tempfile::tempdir().unwrap();
        let path = tmp.path().join("page.pgm");
        let grey: Vec<u8> = (0..400u32 * 300).map(|i| (i % 256) as u8).collect();
        let drawn = Drawn { width: 400, height: 300, dpi: 300, grey };
        drawn.write(&path).unwrap();
        assert_eq!(Drawn::read_back(&path, 300).unwrap(), drawn);

        let shown = drawn.shown(100).unwrap();
        assert_eq!((shown.width, shown.height, shown.scale), (100, 75, 0.25));
        assert!(shown.png.starts_with(b"\x89PNG"));
        let back = image::load_from_memory(&shown.png).unwrap();
        assert_eq!((back.width(), back.height()), (100, 75));
        // Small enough already, it is shown as it is.
        let whole = drawn.shown(1600).unwrap();
        assert_eq!((whole.width, whole.height, whole.scale), (400, 300, 1.0));

        std::fs::write(&path, b"P5\n4 4\n255\nshort").unwrap();
        assert!(Drawn::read_back(&path, 300).is_err());
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

    /// Poppler draws a page as hayro draws it: what is shown of it, turned as
    /// it is shown, at 300 dots to the inch. Passed over where Typst or
    /// Poppler is not installed.
    #[test]
    fn poppler_draws_a_page_as_hayro_does() {
        let tools = tools::discover(&tools::Configured::default());
        let Some(pdftoppm) = tools.pdftoppm else {
            crate::testing::passed_over("Poppler is not installed");
            return;
        };
        let tmp = tempfile::tempdir().unwrap();
        let source = tmp.path().join("page.typ");
        let pdf = tmp.path().join("page.pdf");
        std::fs::write(
            &source,
            "#set page(width: 100mm, height: 150mm, margin: 10mm)\n#rect(width: 100%, height: 30%, fill: black)\n",
        )
        .unwrap();
        let (made, _) = crate::export::typeset::pdf_of(tmp.path(), "page.typ").unwrap();
        std::fs::write(&pdf, made).unwrap();
        // Shown turned a quarter.
        let mut doc = lopdf::Document::load(&pdf).unwrap();
        let id = doc.get_pages()[&1];
        doc.get_dictionary_mut(id).unwrap().set("Rotate", 90);
        doc.save(&pdf).unwrap();

        let sizes = poppler_sizes(&pdftoppm.path, &pdf).expect("pdfinfo is beside pdftoppm");
        assert_eq!(sizes.len(), 1);
        assert!(sizes[0].0 > sizes[0].1, "turned, it is wider than high: {sizes:?}");
        let poppler = Pages::Poppler { pdftoppm: pdftoppm.path.clone(), file: pdf.clone(), sizes };
        assert_eq!(poppler.count(), 1);
        let (picture, dpi) = poppler.draw(0, tmp.path(), Quality::default(), &AtomicBool::new(false)).unwrap();
        assert_eq!(dpi, 300);
        let by_poppler = image::open(&picture).unwrap().to_luma8();

        let by_hayro =
            draw_with_hayro(&Pdf::new(std::fs::read(&pdf).unwrap()).unwrap(), 0, Quality::default()).unwrap();
        let (width, height) = (by_poppler.width(), by_poppler.height());
        assert!(width.abs_diff(by_hayro.width) <= 2 && height.abs_diff(by_hayro.height) <= 2, "{width}×{height}");
        // The black band is at the right, where the top of the page is shown turned.
        let dark = |x: u32, y: u32| by_poppler.get_pixel(x, y).0[0] < 128;
        assert!(dark(width - width / 6, height / 2) && !dark(width / 6, height / 2));
        let hayro_dark = |x: u32, y: u32| by_hayro.grey[(y * by_hayro.width + x) as usize] < 128;
        assert!(hayro_dark(by_hayro.width - by_hayro.width / 6, by_hayro.height / 2));

        // Asked for in black and white at 150 dots, Poppler's page is PGM, half as large, and of two shades.
        let quality = Quality { dpi: 150, contrast: true };
        let (picture, dpi) = poppler.draw(0, tmp.path(), quality, &AtomicBool::new(false)).unwrap();
        assert_eq!((dpi, picture.extension().and_then(|e| e.to_str())), (150, Some("pgm")));
        let pgm = std::fs::read(&picture).unwrap();
        let header = String::from_utf8_lossy(&pgm[..32]).to_string();
        let mut words = header.split_whitespace();
        assert_eq!(words.next(), Some("P5"));
        let small_width: u32 = words.next().unwrap().parse().unwrap();
        assert!(small_width.abs_diff(width / 2) <= 2, "{small_width} against {width}");
        let dots = &pgm[pgm.len() - (small_width as usize * 10)..];
        assert!(dots.iter().all(|d| *d == 0 || *d == 255));
        assert!(!tmp.path().join("page-1.png").exists());
    }

    #[test]
    fn a_small_picture_is_as_wide_as_asked() {
        // A4, 595 by 842 points, 120 dots wide: drawn at some 15 dots to the inch.
        assert_eq!(small_size(595.276, 841.89, 120), Some((120, 170)));
        assert_eq!(small_size(841.89, 595.276, 120), Some((120, 85)));
        // A strip of paper far higher than it is wide is held within the longest side.
        assert_eq!(small_size(100.0, 100_000.0, 120), Some((10, 10_000)));
        assert_eq!(small_size(595.0, 842.0, 0), Some((1, 1)));
        assert_eq!(small_size(0.0, 842.0, 120), None);
    }

    /// A page 100 by 150 mm with a black band over its top, shown turned a
    /// quarter, so that the band stands at the right: set by Typst, in `dir`.
    fn turned_page(dir: &Path) -> PathBuf {
        let pdf = dir.join("turned.pdf");
        std::fs::write(
            dir.join("turned.typ"),
            "#set page(width: 100mm, height: 150mm, margin: 10mm)\n#rect(width: 100%, height: 30%, fill: black)\n",
        )
        .unwrap();
        let (made, _) = crate::export::typeset::pdf_of(dir, "turned.typ").unwrap();
        std::fs::write(&pdf, made).unwrap();
        let mut doc = lopdf::Document::load(&pdf).unwrap();
        let id = doc.get_pages()[&1];
        doc.get_dictionary_mut(id).unwrap().set("Rotate", 90);
        doc.save(&pdf).unwrap();
        pdf
    }

    /// The grey of a PNG, its width and its height.
    fn grey_of(png: &[u8]) -> image::GrayImage {
        assert!(png.starts_with(b"\x89PNG\r\n\x1a\n"), "a PNG");
        let picture = image::load_from_memory(png).unwrap();
        assert_eq!(picture.color(), image::ColorType::L8, "in grey");
        picture.into_luma8()
    }

    /// hayro draws a small picture of a page as wide as it is asked, turned
    /// as the page is shown, at far fewer dots to the inch than Tesseract
    /// is given.
    #[test]
    fn hayro_draws_a_small_picture_of_a_page() {
        let tmp = tempfile::tempdir().unwrap();
        let pdf = turned_page(tmp.path());
        let pages = Pdf::new(std::fs::read(&pdf).unwrap()).unwrap();
        let drawn = draw_small_with_hayro(&pages, 0, 120).unwrap();
        // 150 by 100 mm as it is shown: 120 by 80 dots, at 120 / (150 / 25.4) = 20 dots to the inch.
        assert_eq!((drawn.width, drawn.height, drawn.dpi), (120, 80, 20));
        let picture = grey_of(&drawn.png().unwrap());
        assert_eq!((picture.width(), picture.height()), (120, 80));
        let dark = |x: u32, y: u32| picture.get_pixel(x, y).0[0] < 128;
        assert!(dark(100, 40) && !dark(20, 40), "the band is at the right");

        let opened = Pages::Hayro(Box::new(pages));
        let png = opened.small(0, 120, tmp.path(), &AtomicBool::new(false)).unwrap();
        assert_eq!(grey_of(&png).dimensions(), (120, 80));
        assert!(opened.small(1, 120, tmp.path(), &AtomicBool::new(false)).is_err(), "there is no second page");
    }

    /// A box of the text a PDF has is placed on its page as it is drawn: as
    /// it stands on a plain page, moved by what the crop box leaves out,
    /// turned as the page is turned.
    #[test]
    fn a_box_of_text_is_placed_on_the_page_as_it_is_drawn() {
        let line = (40.0, 100.0, 240.0, 112.0);
        assert_eq!(Frame::plain((400.0, 360.0)).place(line), line);
        // Of a media box 400 by 360, the crop box leaves 20 out at the left and 60 at the top.
        let cropped = Frame { size: (360.0, 290.0), media_top: 360.0, crop: [20.0, 10.0, 380.0, 300.0], turned: 0 };
        assert_eq!(cropped.place(line), (20.0, 40.0, 220.0, 52.0));
        let turned = |turned| Frame { turned, ..Frame::plain((400.0, 360.0)) }.place(line);
        assert_eq!(turned(1), (248.0, 40.0, 260.0, 240.0));
        assert_eq!(turned(2), (160.0, 248.0, 360.0, 260.0));
        assert_eq!(turned(3), (100.0, 160.0, 112.0, 360.0));
    }

    /// hayro tells of a page turned a quarter that it is so, and its size as shown.
    #[test]
    fn the_frame_of_a_turned_page() {
        let tmp = tempfile::tempdir().unwrap();
        let pdf = turned_page(tmp.path());
        let pages = Pages::Hayro(Box::new(Pdf::new(std::fs::read(&pdf).unwrap()).unwrap()));
        let frames = pages.frames();
        assert_eq!(frames.len(), 1);
        let Frame { size: (width, height), turned, .. } = frames[0];
        assert_eq!(turned, 1);
        // 150 by 100 mm as it is shown.
        assert!((width - 425.2).abs() < 0.5 && (height - 283.5).abs() < 0.5, "{width} × {height}");
    }

    /// A page drawn at a width is in colour, as wide as asked, turned as it is shown.
    #[test]
    fn hayro_draws_a_page_at_a_width_in_colour() {
        let tmp = tempfile::tempdir().unwrap();
        let pdf = turned_page(tmp.path());
        let pages = Pages::Hayro(Box::new(Pdf::new(std::fs::read(&pdf).unwrap()).unwrap()));
        let png = pages.at_width(0, 600, tmp.path(), &AtomicBool::new(false)).unwrap();
        let picture = image::load_from_memory(&png).unwrap();
        assert_eq!(picture.color(), image::ColorType::Rgb8);
        let picture = picture.into_rgb8();
        assert_eq!(picture.dimensions(), (600, 400));
        let dark = |x: u32, y: u32| picture.get_pixel(x, y).0[0] < 128;
        assert!(dark(500, 200) && !dark(100, 200), "the band is at the right");
        assert_eq!(pages.largest_dots_at_width(&[0, 1], 600), 240_000);
    }

    /// Poppler draws a small picture of a page as hayro does. Passed over
    /// where Poppler is not installed.
    #[test]
    fn poppler_draws_a_small_picture_as_hayro_does() {
        let tools = tools::discover(&tools::Configured::default());
        let Some(pdftoppm) = tools.pdftoppm else {
            crate::testing::passed_over("Poppler is not installed");
            return;
        };
        let tmp = tempfile::tempdir().unwrap();
        let pdf = turned_page(tmp.path());
        let sizes = poppler_sizes(&pdftoppm.path, &pdf).expect("pdfinfo is beside pdftoppm");
        let poppler = Pages::Poppler { pdftoppm: pdftoppm.path.clone(), file: pdf.clone(), sizes };
        let picture = grey_of(&poppler.small(0, 120, tmp.path(), &AtomicBool::new(false)).unwrap());
        assert_eq!(picture.width(), 120);
        assert!(picture.height().abs_diff(80) <= 1, "{}", picture.height());
        let dark = |x: u32, y: u32| picture.get_pixel(x, y).0[0] < 128;
        assert!(dark(100, 40) && !dark(20, 40), "the band is at the right");
        assert!(!tmp.path().join("small-1.png").exists(), "the file Poppler drew is gone");
    }

    /// Poppler draws a page at a width in colour as hayro does. Passed over
    /// where Poppler is not installed.
    #[test]
    fn poppler_draws_a_page_at_a_width_as_hayro_does() {
        let tools = tools::discover(&tools::Configured::default());
        let Some(pdftoppm) = tools.pdftoppm else {
            crate::testing::passed_over("Poppler is not installed");
            return;
        };
        let tmp = tempfile::tempdir().unwrap();
        let pdf = turned_page(tmp.path());
        let sizes = poppler_sizes(&pdftoppm.path, &pdf).expect("pdfinfo is beside pdftoppm");
        let poppler = Pages::Poppler { pdftoppm: pdftoppm.path.clone(), file: pdf.clone(), sizes };
        let png = poppler.at_width(0, 600, tmp.path(), &AtomicBool::new(false)).unwrap();
        let picture = image::load_from_memory(&png).unwrap();
        assert_eq!(picture.color(), image::ColorType::Rgb8);
        let picture = picture.into_rgb8();
        assert_eq!(picture.dimensions(), (600, 400));
        let dark = |x: u32, y: u32| picture.get_pixel(x, y).0[0] < 128;
        assert!(dark(500, 200) && !dark(100, 200), "the band is at the right");
        assert!(!tmp.path().join("wide-1.png").exists(), "the file Poppler drew is gone");
        // Poppler tells the size of a page as it is shown, and nothing of how it is turned.
        let frames = poppler.frames();
        let Frame { size: (width, height), turned, .. } = frames[0];
        assert_eq!((frames.len(), turned), (1, 0));
        assert!((width - 425.2).abs() < 0.5 && (height - 283.5).abs() < 0.5, "{width} × {height}");
    }
}
