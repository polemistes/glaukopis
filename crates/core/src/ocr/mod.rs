//! Text read from PDFs and pictures (ADR 0018).
//!
//! Tesseract reads the text: an installed program, as Pandoc and Typst are.
//! A PDF is looked at first ([`look`]): how many pages it has, and which of
//! them have text already (`layer.rs`), which is taken as it is. The other
//! pages are drawn as pictures (`drawing.rs`) and read by Tesseract
//! (`tesseract.rs`), several at a time, each on a core of its own; what it
//! reads becomes paragraphs (`text.rs`).
//!
//! What is read becomes a map, a part for each page, named by its number
//! ([`imported_pdf`]); or is laid unseen over the pages of the PDF, so that
//! it can be searched and its text copied ([`make_searchable`],
//! `searchable.rs`). A picture is read as one page ([`read_picture`]).
//!
//! The PDF itself is taken apart only in a process of its own (`child.rs`):
//! looked at, drawn, read and written there, within limits of time and
//! memory. What comes back here is data: its text, its pages, what
//! Tesseract read.

pub(crate) mod child;
pub mod drawing;
#[doc(hidden)]
pub mod fixture;
pub mod layer;
mod rules;
pub mod schemes;
pub mod searchable;
pub mod shape;
pub mod shaped;
pub mod tesseract;
pub mod text;

#[cfg(test)]
mod tests;

use std::collections::BTreeMap;
use std::io::Read as _;
use std::panic::{AssertUnwindSafe, catch_unwind};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::sync::{Arc, Mutex, PoisonError, mpsc};
use std::time::SystemTime;

use serde::{Deserialize, Serialize};

use crate::document::{Block, Inline};
use crate::error::{Error, IoContext, Result};
use crate::export::Tools;
use crate::export::tools::{self, Tool};
use crate::import::document::{Counts, Imported, Section, count_words};
use crate::tr;

use child::Seen;
use drawing::{Drawn, Pages, Quality};
use layer::Layer;
use text::{IsWord, Line};

/// A page Tesseract was less sure of than this, from 0 to 100, was read
/// poorly. Measured on scans of many kinds on 2026-10-18: pages read with
/// the right model came to 87–91, Gothic type read with a model of Latin
/// type 65–72, a scan at 72 dots to the inch 80–84.
pub const POORLY: f32 = 80.0;

/// Whether a page whose confidence is `confidence` was read poorly. A page
/// with none, on which no word was read, was not.
pub fn read_poorly(confidence: Option<f32>) -> bool {
    confidence.is_some_and(|c| c < POORLY)
}

/// Pages, counted from one and in order, said as stretches: `3–5, 9`. Past
/// ten stretches, the rest are not named.
pub fn stretches_of(pages: &[usize]) -> String {
    const NAMED: usize = 10;
    let mut stretches: Vec<(usize, usize)> = Vec::new();
    for &page in pages {
        match stretches.last_mut() {
            Some((_, last)) if page == *last + 1 => *last = page,
            _ => stretches.push((page, page)),
        }
    }
    let mut said: Vec<String> = stretches
        .iter()
        .take(NAMED)
        .map(|&(first, last)| if first == last { first.to_string() } else { format!("{first}–{last}") })
        .collect();
    if stretches.len() > NAMED {
        said.push("…".to_owned());
    }
    said.join(", ")
}

/// The languages of books that were often set in Gothic type, by
/// Tesseract's names for them: where these were read poorly, the Fraktur
/// model may read them well.
const GOTHIC_ONCE: [&str; 15] =
    ["deu", "nor", "dan", "swe", "fin", "isl", "est", "lav", "lit", "ces", "slk", "pol", "hun", "slv", "nld"];

/// Whether the Fraktur model is worth naming to one who read with
/// `languages`: one of them was often set in Gothic type, and no model of
/// Gothic type is among them already.
fn fraktur_might_help(languages: &[String]) -> bool {
    let fraktur = |l: &str| l == "frk" || l == "deu_latf" || l == "script/Fraktur" || l.ends_with("_frak");
    !languages.iter().any(|l| fraktur(l)) && languages.iter().any(|l| GOTHIC_ONCE.contains(&l.as_str()))
}

/// What is said of the pages that were read poorly, where any were: which
/// they were, and, where half or more of those read were, and the languages
/// were of books once set in Gothic type, that such books are read with the
/// Fraktur model.
fn poorly_remarks(poorly: &[usize], judged: usize, languages: &[String]) -> Vec<String> {
    if poorly.is_empty() {
        return Vec::new();
    }
    let mut said = vec![tr!("ocr-remark-poorly", count = poorly.len(), pages = stretches_of(poorly))];
    if poorly.len() * 2 >= judged && fraktur_might_help(languages) {
        said.push(tr!("ocr-remark-fraktur"));
    }
    said
}

/// What becomes of the text a PDF has.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TextChoice {
    /// The pages that have text are taken as they are; the others are read.
    #[default]
    Keep,
    /// The pages that have text are taken as translated by the schemes; the others are read.
    Translate,
    /// Every page is read by Tesseract; no page takes the PDF's text.
    Anew,
}

/// How a PDF read with its shape kept becomes a map (ADR 0047).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Structure {
    /// By its headings: the tree of the document, each heading an element
    /// at its level, the pages marked where they begin.
    #[default]
    Headings,
    /// By its pages: an element for each page, the headings under them.
    Pages,
}

/// What a reading is asked to do.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Asked {
    /// Tesseract's names of the languages the text is in, the likeliest
    /// first: `nor`, `eng`. English, where none are given.
    pub languages: Vec<String>,
    /// What becomes of the text the PDF has (ADR 0044): kept, translated by
    /// what its fonts say of their glyphs, or not taken from any page, every
    /// page read anew by Tesseract. In a PDF made searchable, reading anew
    /// takes the unseen text the pages had away, and translating puts the
    /// PDF's own tables right.
    pub text: TextChoice,
    /// The dots to the inch the pages are drawn at for Tesseract: nought
    /// for 300, else held within 150 and 600. A picture is not drawn, and
    /// is read as large as it is.
    pub dpi: u32,
    /// How Tesseract takes a page apart: `""` as it judges, `column`,
    /// `block` or `sparse` (`tesseract::psm_of`).
    pub layout: String,
    /// Whether the page is made black and white before it is read, for
    /// faint or uneven print.
    pub contrast: bool,
    /// Whether the shape of the pages is kept (ADR 0045): headings, lines
    /// kept as lines, numbers in the margin, the styles that recur. Without
    /// it, the pages become plain paragraphs.
    pub shape: bool,
    /// With the shape kept, whether the document is made by its headings or
    /// by its pages.
    pub structure: Structure,
    /// By its headings, whether a reference mark with the page's label
    /// stands where each page begins.
    pub page_marks: bool,
}

impl Default for Asked {
    fn default() -> Self {
        Asked {
            languages: Vec::new(),
            text: TextChoice::default(),
            dpi: 0,
            layout: String::new(),
            contrast: false,
            shape: false,
            structure: Structure::Headings,
            page_marks: true,
        }
    }
}

impl Asked {
    /// How the pages are drawn, as asked.
    pub fn quality(&self) -> Quality {
        Quality { dpi: self.dpi, contrast: self.contrast }
    }
}

/// How far a reading has come.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Progress {
    /// The pages that are read, of those that are to be.
    pub done: usize,
    pub total: usize,
    /// The number of the page that was read last, counted from one.
    pub page: usize,
}

/// What a file was found to be, before it is read.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Looked {
    /// What the file is called.
    pub file: String,
    /// Whether it is a picture, and not a PDF.
    pub picture: bool,
    pub pages: usize,
    /// The pages that have text already, which are taken as they are
    /// unless all are asked to be read.
    pub with_text: usize,
    /// Those of them whose text does not read as text (`layer::sound`), as
    /// translated where it can be: where most are, the pages are best read anew.
    pub poor: usize,
    /// The fonts of the text, by their names without the prefix of a subset,
    /// those with most glyphs first.
    pub fonts: Vec<String>,
    /// The schemes that apply: how the text keeps its letters, where it can
    /// be translated (ADR 0044).
    pub schemes: Vec<SchemeFound>,
    /// The first lines of the first page that has text, as the PDF has them,
    /// to be seen before they are taken.
    pub sample: Option<Sample>,
    /// The title the file gives itself, where it looks like one.
    pub title: Option<String>,
    /// Whether it can be made searchable: a PDF that is not locked, and can
    /// be taken apart to be changed.
    pub searchable: bool,
    /// Whether it is locked (encrypted), and cannot be made searchable for that.
    pub locked: bool,
    /// The dots to the inch of its pages, where they are pictures, as
    /// scans are (`Layer::resolution`); nothing where they are not.
    pub resolution: Option<u32>,
    /// The first page without text, counted from one, which Tesseract reads
    /// first where the text is kept; nothing where every page has text.
    pub first_without_text: Option<usize>,
}

/// The first lines of the text a page has.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Sample {
    /// The number it has in print, or counted from one.
    pub page: String,
    /// As the PDF has them.
    pub lines: Vec<String>,
    /// As translated, where the page has a translation.
    pub translated: Option<Vec<String>>,
}

/// A scheme that applies in a PDF: in which fonts, on how many pages.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemeFound {
    pub scheme: schemes::Scheme,
    pub fonts: Vec<String>,
    pub pages: usize,
}

/// The text of a page, for the preview: as the PDF has it and as translated.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PageTextView {
    /// Counted from one.
    pub number: usize,
    /// The number it has in print, or counted from one.
    pub label: String,
    /// The lines as the PDF has them, in the order they stand.
    pub lines: Vec<String>,
    /// As translated, where the page has a translation.
    pub translated: Option<Vec<String>>,
    /// Whether it has text enough to be taken.
    pub has_text: bool,
}

/// A page with what was read of it.
#[derive(Debug, Clone, Default, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PageText {
    /// Counted from one.
    pub number: usize,
    /// The number it has in print, where the file tells it (`xiv`); else
    /// the number counted from one.
    pub label: String,
    pub paragraphs: Vec<String>,
    /// Whether Tesseract read it, or its text was taken as the file has it.
    pub read: bool,
    /// How sure Tesseract was of what it read, from 0 to 100, where it read
    /// the page and any word on it (`text::page_confidence`).
    pub confidence: Option<f32>,
    /// What the page was found to be made of, where its shape was kept
    /// (ADR 0045): what the document is made of then, in the place of the
    /// paragraphs.
    #[serde(skip)]
    pub pieces: Vec<shaped::Shaped>,
}

/// What reading a PDF came to.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct ReadPdf {
    pub pages: Vec<PageText>,
    /// What the one who asked should know.
    pub remarks: Vec<String>,
    /// The styles of the file, the body first, where the shape was kept.
    pub styles: Vec<shape::StyleFound>,
    /// The title found on the pages, where the shape was kept and one was.
    pub title: Option<Vec<Inline>>,
    /// The title the file gives itself, where it looks like one.
    pub named: Option<String>,
    /// How it is to become a map, and whether the pages are marked, as asked.
    pub structure: Structure,
    pub page_marks: bool,
    /// The pages read by Tesseract, those taken from the PDF, and those that could not be read.
    pub read: usize,
    pub taken: usize,
    pub failed: usize,
    /// The pages Tesseract read poorly (`POORLY`), counted from one.
    pub poorly: Vec<usize>,
}

/// What making a PDF searchable came to.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Searchable {
    /// The file that has the text, when any page was read; nothing where
    /// every page had text already.
    pub pdf: Option<Vec<u8>>,
    /// The pages that were read, and those that had text already.
    pub read: usize,
    pub with_text: usize,
    /// The pages that could not be read, counted from one, with why.
    pub failed: Vec<(usize, String)>,
    /// How many fonts were given their letters (`Translate`).
    pub remapped: usize,
    /// The pages Tesseract read poorly (`POORLY`), counted from one.
    pub poorly: Vec<usize>,
}

/// The endings of the names of the pictures whose text is read.
pub const PICTURE_ENDINGS: [&str; 8] = ["png", "jpg", "jpeg", "tif", "tiff", "webp", "gif", "bmp"];

fn ending(path: &Path) -> String {
    path.extension().map(|e| e.to_string_lossy().to_ascii_lowercase()).unwrap_or_default()
}

/// Whether a file is taken for a picture whose text is read, by its name.
pub fn is_picture(path: &Path) -> bool {
    PICTURE_ENDINGS.contains(&ending(path).as_str())
}

/// Whether a file is taken for a PDF, by its name.
pub fn is_pdf(path: &Path) -> bool {
    ending(path) == "pdf"
}

fn file_name(path: &Path) -> String {
    path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_else(|| path.display().to_string())
}

fn stopped() -> Error {
    Error::Refused { kind: tools::STOPPED, message: tr!("ocr-stopped") }
}

/// Tesseract, ready to read: with what it reads with, and how the pages are
/// drawn for it.
struct Reader<'t> {
    tesseract: &'t Tool,
    with: tesseract::With,
    quality: Quality,
}

impl Reader<'_> {
    /// Has Tesseract read a picture that is drawn already: its TSV, its page
    /// of text, or both.
    fn read(
        &self,
        picture: &Path,
        dpi: u32,
        (text, layer): (bool, bool),
        stop: &AtomicBool,
    ) -> Result<tesseract::Read> {
        tesseract::read(self.tesseract, picture, dpi, &self.with, text, layer, stop)
    }

    /// Draws a page and has Tesseract read it.
    fn draw_and_read(
        &self,
        pages: &Pages,
        index: usize,
        place: &Path,
        wanted: (bool, bool),
        stop: &AtomicBool,
    ) -> Result<tesseract::Read> {
        let (picture, dpi) = pages.draw(index, place, self.quality, stop)?;
        let read = self.read(&picture, dpi, wanted, stop).map(|mut read| {
            read.dpi = dpi;
            read
        });
        for made in [picture.clone(), picture.with_extension("tsv"), picture.with_extension("pdf")] {
            let _ = std::fs::remove_file(made);
        }
        read
    }
}

/// Tesseract, and the languages it is to read with: those asked for, each of
/// which it must have data for; English where none are asked for, or the
/// first it has.
fn ready<'t>(tools: &'t Tools, asked: &Asked) -> Result<Reader<'t>> {
    let tesseract = tools.tesseract()?;
    let has = &tools.ocr_languages;
    let mut languages: Vec<String> = Vec::new();
    for language in &asked.languages {
        let language = language.trim();
        if !tesseract::is_language(language) || (!has.is_empty() && !has.iter().any(|h| h == language)) {
            return Err(Error::invalid(tr!("ocr-no-language", language = language)));
        }
        if !languages.iter().any(|l| l == language) {
            languages.push(language.to_owned());
        }
    }
    if languages.is_empty() {
        let first = has.iter().find(|l| *l == "eng").or_else(|| has.first());
        languages.push(first.ok_or_else(|| Error::invalid(tr!("ocr-no-languages")))?.clone());
    }
    let with = tesseract::With { languages, psm: tesseract::psm_of(&asked.layout) };
    Ok(Reader { tesseract, with, quality: asked.quality() })
}

/// How many pages are read at once: one less than there are cores, so that
/// the application is not kept waiting, and no more than eight; and no more
/// than the memory the machine has free will hold (`by_memory`).
fn workers(dots: u64) -> usize {
    let cores = std::thread::available_parallelism().map_or(2, |n| n.get()).saturating_sub(1).clamp(1, 8);
    by_memory(cores, dots, crate::isolated::available_memory())
}

/// What one page being read takes, near enough: Tesseract itself, and for
/// each dot of the page's picture the picture, its file, and what Tesseract
/// makes of it. Measured with Tesseract 5 on pages of 8 to 35 million dots.
const PAGE_BASE: u64 = 300 << 20;
const PAGE_PER_DOT: u64 = 20;

/// As many pages at once as `cores` allow and as fit, each of `dots`, in
/// three fifths of the memory `free`; one at the least. All the cores where
/// what is free cannot be told.
fn by_memory(cores: usize, dots: u64, free: Option<u64>) -> usize {
    let Some(free) = free else { return cores };
    let each = PAGE_BASE.saturating_add(dots.saturating_mul(PAGE_PER_DOT));
    let fit = (free / 5 * 3) / each.max(1);
    usize::try_from(fit).unwrap_or(usize::MAX).clamp(1, cores.max(1))
}

/// Reads pages, several at a time, each by `one`, and tells how far it has
/// come as each is done. What each page gave, in the order of the pages. A
/// page that is given up (`one` panics) is an error of that page alone.
fn several<T: Send>(
    pages: &[usize],
    workers: usize,
    one: &(dyn Fn(usize) -> Result<T> + Sync),
    told: &mut dyn FnMut(Progress),
    stop: &AtomicBool,
) -> Vec<(usize, Result<T>)> {
    let next = AtomicUsize::new(0);
    let (send, receive) = mpsc::channel();
    let mut done = Vec::with_capacity(pages.len());
    std::thread::scope(|scope| {
        for _ in 0..workers.max(1).min(pages.len()) {
            let send = send.clone();
            let next = &next;
            let work = move || {
                while !stop.load(Ordering::Relaxed) {
                    let Some(&page) = pages.get(next.fetch_add(1, Ordering::Relaxed)) else { break };
                    let result = catch_unwind(AssertUnwindSafe(|| one(page)))
                        .unwrap_or_else(|_| Err(Error::invalid(tr!("ocr-page-not-drawn", page = page + 1))));
                    if send.send((page, result)).is_err() {
                        break;
                    }
                }
            };
            // Pages are drawn by recursion into what they hold.
            if let Err(e) =
                std::thread::Builder::new().name("ocr".into()).stack_size(16 << 20).spawn_scoped(scope, work)
            {
                tracing::warn!(%e, "no thread could be started for reading pages");
            }
        }
        drop(send);
        for (page, result) in receive {
            done.push((page, result));
            told(Progress { done: done.len(), total: pages.len(), page: page + 1 });
        }
    });
    done.sort_by_key(|(page, _)| *page);
    done
}

// ---------------------------------------------------------------------------
// The text a file has, as it was looked at
// ---------------------------------------------------------------------------

/// What was seen of the file that was looked at last, by the file, its size
/// and when it was changed, and the Poppler it was looked at with: what was
/// read when a file was looked at is not read again when it is read.
struct Kept {
    path: PathBuf,
    size: u64,
    changed: Option<SystemTime>,
    pdftoppm: Option<PathBuf>,
    seen: Arc<Seen>,
}
static KEPT: Mutex<Option<Kept>> = Mutex::new(None);

/// What a look at the PDF at `path`, of `size`, finds: kept from the last
/// look where it was at this file as it is, else looked at in the child.
/// The lock is not held while the child works, so that a second file is not
/// kept waiting for the first.
fn seen_of(path: &Path, size: u64, pdftoppm: Option<&Tool>) -> Result<Arc<Seen>> {
    let changed = std::fs::metadata(path).ok().and_then(|m| m.modified().ok());
    let poppler = pdftoppm.map(|t| t.path.clone());
    {
        let kept = KEPT.lock().unwrap_or_else(PoisonError::into_inner);
        if let Some(kept) = kept.as_ref()
            && kept.path == path
            && kept.size == size
            && kept.changed == changed
            // Poppler counts only what hayro cannot open: asked without it,
            // or where hayro opened the file, either look will do.
            && (poppler.is_none()
                || kept.pdftoppm == poppler
                || matches!(kept.seen.opened, child::Opened::Pages(_) | child::Opened::NoPages))
        {
            return Ok(kept.seen.clone());
        }
    }
    let seen = Arc::new(child::look(path, size, pdftoppm)?);
    *KEPT.lock().unwrap_or_else(PoisonError::into_inner) =
        Some(Kept { path: path.to_owned(), size, changed, pdftoppm: poppler, seen: seen.clone() });
    Ok(seen)
}

/// The size of a PDF, which is known to be one by what it begins with: the
/// file itself is read only in the child.
fn checked_pdf(path: &Path) -> Result<u64> {
    let file = file_name(path);
    let mut head = Vec::new();
    let opened = std::fs::File::open(path).context(|| tr!("io-reading", path = path))?;
    let size = opened.metadata().context(|| tr!("io-reading", path = path))?.len();
    opened.take(1024).read_to_end(&mut head).context(|| tr!("io-reading", path = path))?;
    if !head.windows(5).any(|w| w == b"%PDF-") {
        return Err(Error::invalid(tr!("ocr-not-pdf", file = &file)));
    }
    Ok(size)
}

/// Looks at a PDF or a picture before it is read: how many pages it has,
/// which have text already, and what it calls itself.
pub fn look(path: &Path, tools: &Tools) -> Result<Looked> {
    let file = file_name(path);
    if is_picture(path) {
        return Ok(Looked { file, picture: true, pages: 1, ..Default::default() });
    }
    let size = checked_pdf(path)?;
    let seen = seen_of(path, size, tools.pdftoppm.as_ref())?;
    let layer = &seen.layer;
    let pages = match layer.pages.len() {
        0 => seen.drawable(&file)?,
        n => n,
    };
    let with_text = (0..pages).filter(|i| layer.has_text(*i)).count();
    let poor = (0..pages).filter(|i| layer.verdict(*i) == layer::Verdict::Poor).count();
    let sample =
        layer.sample().map(|(index, lines, translated)| Sample { page: layer.label(index), lines, translated });
    let mut fonts: Vec<(&String, &usize)> = layer.fonts.iter().collect();
    fonts.sort_by(|a, b| b.1.cmp(a.1));
    let fonts = fonts.into_iter().map(|(f, _)| f.clone()).collect();
    let schemes =
        layer.schemes_found().into_iter().map(|(scheme, fonts, pages)| SchemeFound { scheme, fonts, pages }).collect();
    let title = seen.title.clone();
    let searchable = !layer.locked && !layer.pages.is_empty();
    Ok(Looked {
        file,
        picture: false,
        pages,
        with_text,
        poor,
        fonts,
        schemes,
        sample,
        title,
        searchable,
        locked: layer.locked,
        resolution: layer.resolution(),
        first_without_text: (0..pages).find(|i| !layer.has_text(*i)).map(|i| i + 1),
    })
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

/// A directory of its own for what is made on the way, in `work`, which is
/// gone afterwards.
fn place_in(work: &Path) -> Result<tempfile::TempDir> {
    std::fs::create_dir_all(work).context(|| tr!("io-creating", path = work))?;
    tempfile::Builder::new().prefix("ocr-").tempdir_in(work).context(|| tr!("io-creating-directory-in", path = work))
}

/// What was said of the pages that could not be read: of the first few,
/// each, and of the rest how many there are.
fn failures(failed: &[(usize, String)]) -> Vec<String> {
    const TOLD: usize = 4;
    let mut out: Vec<String> =
        failed.iter().take(TOLD).map(|(page, why)| tr!("ocr-remark-failed", page = *page, message = why)).collect();
    if failed.len() > TOLD {
        out.push(tr!("ocr-remark-more-failed", count = failed.len() - TOLD));
    }
    out
}

/// Reads a PDF, page by page. With `Keep` and `Translate`, the pages that
/// have text are taken as the PDF has them, or as translated, and the others
/// are read by Tesseract; with `Anew`, every page is read by Tesseract, and
/// the text the PDF has is not taken from any. A page that cannot be read
/// says so in a line of its own, and is never given the PDF's text instead.
/// `is_word` is the dictionary of the language, where there is one, by
/// which words broken at the end of a line are joined again.
pub fn read_pdf(
    path: &Path,
    tools: &Tools,
    work: &Path,
    asked: &Asked,
    is_word: Option<&IsWord>,
    told: &mut dyn FnMut(Progress),
    stop: &AtomicBool,
) -> Result<ReadPdf> {
    let size = checked_pdf(path)?;
    let seen = seen_of(path, size, tools.pdftoppm.as_ref())?;
    let layer = &seen.layer;
    let drawing = seen.drawable(&file_name(path));
    let count = layer.pages.len().max(*drawing.as_ref().unwrap_or(&0));
    if count == 0 {
        return Err(drawing.err().unwrap_or_else(|| Error::invalid(tr!("ocr-no-pages", file = &file_name(path)))));
    }
    let anew = asked.text == TextChoice::Anew;
    let wanted: Vec<usize> = (0..count).filter(|i| anew || !layer.has_text(*i)).collect();
    let to_take = count - wanted.len();

    let mut remarks = Vec::new();
    // What Tesseract read of each page, and the page's size, in points.
    let mut read: BTreeMap<usize, ReadPage> = BTreeMap::new();
    let mut failed: Vec<(usize, String)> = Vec::new();
    if !wanted.is_empty() {
        let can = ready(tools, asked).and_then(|ready| drawing.map(|_| ready));
        match can {
            Ok(reader) => {
                let place = place_in(work)?;
                let job = child::Job::new(
                    path,
                    Some(&reader),
                    tools.pdftoppm.as_ref(),
                    place.path(),
                    child::Task::Read { pages: wanted.clone() },
                );
                match child::work(job, size, place.path(), told, stop) {
                    Ok(child::Done::Pages(pages)) => {
                        for (index, result) in pages {
                            match result {
                                Ok((tsv, dpi)) => {
                                    read.insert(index, read_page(&tsv, dpi));
                                }
                                Err(why) => failed.push((index + 1, why)),
                            }
                        }
                    }
                    Ok(_) => return Err(Error::invalid("the pages were not read")),
                    Err(e) if e.kind() == tools::STOPPED || anew || to_take == 0 => return Err(e),
                    // The pages that have text are taken all the same.
                    Err(e) => failed.extend(wanted.iter().map(|i| (i + 1, e.to_string()))),
                }
                if stop.load(Ordering::Relaxed) {
                    return Err(stopped());
                }
                if read.is_empty() && to_take == 0 {
                    let (_, why) = failed.first().cloned().unwrap_or_default();
                    return Err(Error::invalid(why));
                }
            }
            // Nothing can be read by Tesseract: that is the answer where every
            // page was to be read by it, and where no page has text to take.
            Err(e) if anew || to_take == 0 => return Err(e),
            Err(e) => {
                let why = match &e {
                    Error::MissingProgram { .. } => tr!("ocr-why-no-tesseract"),
                    other => other.to_string(),
                };
                failed.extend(wanted.iter().map(|i| (i + 1, why.clone())));
            }
        }
    }

    // Tesseract reads the lunate sigma as ς within words too: with Greek among
    // the languages, each sigma is made what its place in the word says.
    let greek = asked.languages.iter().any(|l| matches!(l.as_str(), "grc" | "ell" | "script/Greek"));
    let mut taken = 0;
    // Each page: what it is, and its lines and size for the shape.
    enum Got {
        Read(Vec<Vec<Line>>),
        Failed(String),
        Taken(Vec<Line>),
    }
    let mut got: Vec<Got> = Vec::with_capacity(count);
    let mut pages_lines: Vec<shape::PageLines> = Vec::with_capacity(count);
    // How sure Tesseract was of each page it read.
    let mut confidences: Vec<Option<f32>> = vec![None; count];
    for index in 0..count {
        let (page, lines, size) = if let Some((groups, size, confidence)) = read.remove(&index) {
            confidences[index] = confidence;
            let lines = groups.iter().flatten().cloned().collect();
            (Got::Read(groups), lines, size)
        } else if let Some((_, why)) = failed.iter().find(|(page, _)| *page == index + 1) {
            (Got::Failed(why.clone()), Vec::new(), (0.0, 0.0))
        } else {
            taken += 1;
            let lines = taken_lines(layer, index, asked.text);
            (Got::Taken(lines.clone()), lines, layer.sizes.get(index).copied().unwrap_or_default())
        };
        got.push(page);
        pages_lines.push(shape::PageLines { lines, width: size.0, height: size.1 });
    }
    let (mut paragraphs, mut pieces, styles): (Vec<Vec<String>>, Vec<Vec<shaped::Shaped>>, Vec<shape::StyleFound>) =
        if asked.shape {
            let (shaped_pages, styles) = shape::shape_with(pages_lines, &layer.outline);
            let mut pieces: Vec<Vec<shaped::Shaped>> = shaped_pages
                .into_iter()
                .zip(&got)
                .map(|(page, got)| match got {
                    Got::Failed(why) => {
                        vec![shaped::Shaped::failure(tr!("ocr-page-failed-line", message = why.as_str()))]
                    }
                    Got::Read(_) => shaped::of(page, is_word, greek),
                    Got::Taken(_) => shaped::of(page, is_word, false),
                })
                .collect();
            shaped::mend_across(&mut pieces, is_word);
            let paragraphs = pieces.iter().map(|page| page.iter().map(shaped::Shaped::plain).collect()).collect();
            (paragraphs, pieces, styles)
        } else {
            let paragraphs = got
                .into_iter()
                .map(|page| match page {
                    Got::Read(groups) => {
                        let paragraphs = text::page_paragraphs(groups, is_word);
                        if greek { paragraphs.iter().map(|p| schemes::mend_sigmas(p)).collect() } else { paragraphs }
                    }
                    Got::Failed(why) => vec![tr!("ocr-page-failed-line", message = why.as_str())],
                    Got::Taken(lines) => text::page_paragraphs(text::by_place(lines), is_word),
                })
                .collect();
            (paragraphs, vec![Vec::new(); count], Vec::new())
        };
    if !asked.shape {
        text::mend_across(&mut paragraphs, is_word);
    }
    let done = wanted.len() - failed.len();
    let poorly: Vec<usize> = (0..count).filter(|i| read_poorly(confidences[*i])).map(|i| i + 1).collect();
    let judged = confidences.iter().flatten().count();
    // Said where Tesseract was asked to read: a PDF whose text is all taken needs no counting.
    if !wanted.is_empty() {
        remarks.push(tr!("ocr-remark-counts", read = done, taken = taken, failed = failed.len()));
    }
    remarks.extend(poorly_remarks(&poorly, judged, &asked.languages));
    remarks.extend(failures(&failed));
    if paragraphs.iter().all(Vec::is_empty) {
        remarks.push(tr!("ocr-remark-empty"));
    }
    tracing::info!(
        pages = count,
        read = done,
        taken,
        failed = failed.len(),
        poorly = %stretches_of(&poorly),
        text = ?asked.text,
        "a PDF was read"
    );
    let pages: Vec<PageText> = paragraphs
        .into_iter()
        .enumerate()
        .map(|(index, paragraphs)| PageText {
            number: index + 1,
            label: layer.label(index),
            read: wanted.contains(&index) && !failed.iter().any(|(page, _)| *page == index + 1),
            confidence: confidences[index],
            paragraphs,
            pieces: std::mem::take(&mut pieces[index]),
        })
        .collect();
    let title = pages.iter().flat_map(|p| &p.pieces).find_map(|piece| match piece {
        shaped::Shaped::Heading { level: 0, content } => Some(content.clone()),
        _ => None,
    });
    Ok(ReadPdf {
        pages,
        remarks,
        styles,
        title,
        named: seen.title.clone(),
        structure: asked.structure,
        page_marks: asked.page_marks,
        read: done,
        taken,
        failed: failed.len(),
        poorly,
    })
}

/// What Tesseract read of a page, in groups of lines, the page's size in
/// points, and how sure Tesseract was of it.
type ReadPage = (Vec<Vec<Line>>, (f32, f32), Option<f32>);

/// What Tesseract read of a page drawn at `dpi`, as its TSV says it: in
/// points, as the text a PDF has is, so that its pages and Tesseract's are
/// shaped together.
fn read_page(tsv: &str, dpi: u32) -> ReadPage {
    let scale = if dpi > 0 { 72.0 / dpi as f32 } else { 1.0 };
    let size = text::tsv_page_size(tsv).map_or((0.0, 0.0), |(w, h)| (w * scale, h * scale));
    let (mut groups, confidence) = text::tsv_page(tsv);
    for group in &mut groups {
        // The lines of one of Tesseract's paragraphs are one size of type,
        // whatever their letters reach above and below: their height is the
        // group's middle one, so that the shape does not part them by size.
        let mut heights: Vec<f32> = group.iter().map(Line::height).collect();
        heights.sort_by(f32::total_cmp);
        let middle = heights.get(heights.len() / 2).copied().unwrap_or_default();
        for line in group.iter_mut() {
            if middle > 0.0 {
                line.top = line.bottom - middle;
                line.style.size = middle;
            }
            for v in [&mut line.left, &mut line.right, &mut line.top, &mut line.bottom, &mut line.style.size] {
                *v *= scale;
            }
            for gap in line.gaps.iter_mut().flatten() {
                gap.from *= scale;
                gap.to *= scale;
            }
        }
    }
    (groups, size, confidence)
}

/// The lines of a page that are taken from the PDF, not read by Tesseract:
/// as the PDF has them, or as translated where that is asked and there is a
/// translation.
fn taken_lines(layer: &Layer, index: usize, text: TextChoice) -> Vec<Line> {
    let lines = match text {
        TextChoice::Translate => layer.best_lines(index),
        _ => layer.pages.get(index).and_then(Option::as_ref),
    };
    lines.cloned().unwrap_or_default()
}

/// The text a PDF has, `count` pages from `from` (counted from nought), as
/// it is and as translated, for the preview: each page's lines in the order
/// they stand. The file's text is read once and kept while it is looked at.
pub fn text_of_pages(path: &Path, from: usize, count: usize) -> Result<Vec<PageTextView>> {
    let size = checked_pdf(path)?;
    let seen = seen_of(path, size, None)?;
    let layer = &seen.layer;
    let order = |lines: &Vec<Line>| -> Vec<String> {
        text::by_place(lines.clone()).into_iter().flatten().map(|l| text::composed(&l.text)).collect()
    };
    Ok((from..layer.pages.len().min(from.saturating_add(count)))
        .map(|index| PageTextView {
            number: index + 1,
            label: layer.label(index),
            lines: layer.pages[index].as_ref().map(order).unwrap_or_default(),
            translated: layer.translated.get(index).and_then(Option::as_ref).map(order),
            has_text: layer.has_text(index),
        })
        .collect())
}

/// Reads a picture as one page: the file of a picture, or a picture of the
/// store. It is read as large as it is, in black and white where that is
/// asked.
pub fn read_picture(
    bytes: &[u8],
    tools: &Tools,
    work: &Path,
    asked: &Asked,
    is_word: Option<&IsWord>,
    stop: &AtomicBool,
) -> Result<Vec<String>> {
    if crate::pictures::is_svg(bytes) {
        return Err(Error::invalid(tr!("ocr-drawing")));
    }
    let reader = ready(tools, asked)?;
    let drawn = Drawn::of_picture(bytes)?.as_asked(reader.quality);
    let place = place_in(work)?;
    let picture = place.path().join("picture.pgm");
    drawn.write(&picture)?;
    let read = reader.read(&picture, drawn.dpi, (true, false), stop)?;
    if stop.load(Ordering::Relaxed) {
        return Err(stopped());
    }
    Ok(text::page_paragraphs(text::tsv_paragraphs(read.tsv.as_deref().unwrap_or_default()), is_word))
}

/// A page tried before a PDF is read: what Tesseract read of it with the
/// languages and settings asked, how sure it was, and the picture it read.
#[derive(Debug, Clone, Default, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Tried {
    /// Counted from one.
    pub page: usize,
    /// The number it has in print, or counted from one.
    pub label: String,
    /// What was read, as paragraphs, as a page read without its shape is.
    pub paragraphs: Vec<String>,
    /// How sure Tesseract was of the page (`text::page_confidence`); nothing
    /// where it read no word.
    pub confidence: Option<f32>,
    /// Whether it was read poorly (`POORLY`).
    pub poorly: bool,
    /// The picture Tesseract read, made smaller to be shown: PNG in base64.
    pub png: String,
    pub width: u32,
    pub height: u32,
}

/// Tries a page of a PDF, counted from one, before the whole is read: draws
/// it as `asked` says, has Tesseract read it with the languages asked, and
/// gives what was read beside the picture that was read.
pub fn try_page(
    path: &Path,
    tools: &Tools,
    work: &Path,
    asked: &Asked,
    page: usize,
    is_word: Option<&IsWord>,
    stop: &AtomicBool,
) -> Result<Tried> {
    let size = checked_pdf(path)?;
    let seen = seen_of(path, size, tools.pdftoppm.as_ref())?;
    let count = seen.layer.pages.len().max(*seen.drawable(&file_name(path)).as_ref().unwrap_or(&0));
    if page == 0 || page > count {
        return Err(Error::invalid(tr!("ocr-no-such-page", page = page, pages = count)));
    }
    let reader = ready(tools, asked)?;
    seen.drawable(&file_name(path))?;
    let place = place_in(work)?;
    let job = child::Job::new(
        path,
        Some(&reader),
        tools.pdftoppm.as_ref(),
        place.path(),
        child::Task::Try { page: page - 1 },
    );
    let tried = match child::work(job, size, place.path(), &mut |_| {}, stop)? {
        child::Done::Tried(tried) => tried,
        _ => return Err(Error::invalid("the page was not tried")),
    };
    let (groups, confidence) = text::tsv_page(&tried.tsv);
    let greek = reader.with.languages.iter().any(|l| matches!(l.as_str(), "grc" | "ell" | "script/Greek"));
    let paragraphs = text::page_paragraphs(groups, is_word);
    let paragraphs = if greek { paragraphs.iter().map(|p| schemes::mend_sigmas(p)).collect() } else { paragraphs };
    tracing::info!(page, confidence = ?confidence, languages = ?reader.with.languages, "a page was tried");
    Ok(Tried {
        page,
        label: seen.layer.label(page - 1),
        paragraphs,
        confidence,
        poorly: read_poorly(confidence),
        png: tried.png,
        width: tried.width,
        height: tried.height,
    })
}

/// The text of the first pages of a PDF, as Tesseract reads it in the first
/// language it has, line by line: to find in it what the file is, its DOI
/// or its ISBN, where it has no text (`import::pdf::identify_scan`).
/// Nothing, where Tesseract is not there or the pages cannot be drawn.
pub fn first_pages(path: &Path, tools: &Tools, work: &Path, count: usize, stop: &AtomicBool) -> Vec<String> {
    let Ok(reader) = ready(tools, &Asked::default()) else { return Vec::new() };
    let Ok(size) = checked_pdf(path) else { return Vec::new() };
    let Ok(place) = place_in(work) else { return Vec::new() };
    let job = child::Job::new(path, Some(&reader), tools.pdftoppm.as_ref(), place.path(), child::Task::First { count });
    let pages = match child::work(job, size, place.path(), &mut |_| {}, stop) {
        Ok(child::Done::Pages(pages)) => pages,
        Ok(_) => Vec::new(),
        Err(e) => {
            tracing::warn!(%e, "the first pages of the PDF could not be read");
            Vec::new()
        }
    };
    pages
        .into_iter()
        .map(|(_, read)| {
            let tsv = read.unwrap_or_default().0;
            text::tsv_paragraphs(&tsv)
                .iter()
                .map(|lines| lines.iter().map(|l| l.text.as_str()).collect::<Vec<_>>().join("\n"))
                .collect::<Vec<_>>()
                .join("\n\n")
        })
        .collect()
}

/// Makes a PDF searchable: the pages that have no text are read, and what
/// is read is laid over them, unseen. Pages that have text are left as they
/// are, unless all are asked to be read anew: then the unseen text the
/// pages had is taken away, so that only what is read stays. The file itself is not touched: the one that has the text is
/// given back, and has been read again to be sure it holds as many pages as
/// the file.
pub fn make_searchable(
    path: &Path,
    tools: &Tools,
    work: &Path,
    asked: &Asked,
    told: &mut dyn FnMut(Progress),
    stop: &AtomicBool,
) -> Result<Searchable> {
    let size = checked_pdf(path)?;
    let seen = seen_of(path, size, tools.pdftoppm.as_ref())?;
    let layer = &seen.layer;
    // What is added to a locked file would have to be locked in the same way.
    if layer.locked {
        return Err(Error::Refused { kind: "locked", message: tr!("ocr-searchable-locked") });
    }
    if layer.pages.is_empty() {
        let why = tr!("ocr-unreadable", file = &file_name(path));
        return Err(Error::invalid(tr!("ocr-searchable-unreadable", message = why)));
    }
    let count = layer.pages.len();
    let with_text = (0..count).filter(|i| layer.has_text(*i)).count();
    // Translated: the fonts whose glyphs were translated are given their
    // letters first; the pages without text are then read, as when kept.
    let maps: Vec<searchable::FontMap> = if asked.text == TextChoice::Translate {
        layer
            .maps
            .iter()
            .map(|(font, codes)| searchable::FontMap {
                font: *font,
                entries: codes.iter().map(|(code, text)| (*code, text.clone())).collect(),
            })
            .collect()
    } else {
        Vec::new()
    };
    let wanted: Vec<usize> = (0..count).filter(|i| asked.text == TextChoice::Anew || !layer.has_text(*i)).collect();
    if wanted.is_empty() && maps.is_empty() {
        return Ok(Searchable { pdf: None, read: 0, with_text, failed: Vec::new(), remapped: 0, poorly: Vec::new() });
    }
    let reader = if wanted.is_empty() { None } else { Some(ready(tools, asked)?) };
    let place = place_in(work)?;
    let output = place.path().join("searchable.pdf");
    let task =
        child::Task::Searchable { pages: wanted, strip: asked.text == TextChoice::Anew, maps, output: output.clone() };
    let job = child::Job::new(path, reader.as_ref(), tools.pdftoppm.as_ref(), place.path(), task);
    let made = match child::work(job, size, place.path(), told, stop)? {
        child::Done::Made(made) => made,
        _ => return Err(Error::invalid("the file was not made searchable")),
    };
    if made.remapped > 0 {
        tracing::info!(fonts = made.remapped, "the fonts of a PDF were given their letters");
    }
    let pdf =
        if made.written { Some(std::fs::read(&output).context(|| tr!("io-reading", path = &output))?) } else { None };
    if made.read > 0 {
        tracing::info!(
            pages = count,
            read = made.read,
            failed = made.failed.len(),
            poorly = %stretches_of(&made.poorly),
            text = ?asked.text,
            "a PDF was made searchable"
        );
    }
    Ok(Searchable {
        pdf,
        read: made.read,
        with_text,
        failed: made.failed,
        remapped: made.remapped,
        poorly: made.poorly,
    })
}

// ---------------------------------------------------------------------------
// What becomes a map
// ---------------------------------------------------------------------------

fn paragraph(text: String) -> Block {
    Block::paragraph(vec![Inline::Text { text, marks: BTreeMap::new() }])
}

fn counts(sections: &[Section]) -> Counts {
    let words = sections
        .iter()
        .flat_map(|s| &s.blocks)
        .map(|b| match b {
            Block::Paragraph { content, .. } => content
                .iter()
                .map(|i| match i {
                    Inline::Text { text, .. } => count_words(text),
                    _ => 0,
                })
                .sum(),
            _ => 0,
        })
        .sum();
    Counts { parts: sections.iter().filter(|s| s.level > 0).count(), words, ..Default::default() }
}

/// A PDF as it was read, as a document that becomes a map: its title the
/// centre, and under it a part for each page, named by its number as it is
/// printed, holding what was read of the page.
pub fn imported_pdf(file: &str, title: &str, read: ReadPdf) -> Imported {
    let shaped = read.pages.iter().any(|p| !p.pieces.is_empty());
    let headed = read
        .pages
        .iter()
        .flat_map(|p| &p.pieces)
        .any(|piece| matches!(piece, shaped::Shaped::Heading { level, .. } if *level > 0));
    let mut remarks = read.remarks;
    // Said where there are pages to be the elements: a single page has nothing to choose.
    if shaped && read.structure == Structure::Headings && !headed && read.pages.len() > 1 {
        remarks.push(tr!("ocr-no-headings"));
    }
    let named = read.title.clone();
    let by_headings = shaped && headed && read.structure == Structure::Headings;
    let sections: Vec<Section> = if by_headings {
        let marks = read.page_marks;
        shaped::structure(read.pages.into_iter().map(|p| (p.label, p.pieces)).collect(), marks)
    } else {
        read.pages
            .into_iter()
            .flat_map(|page| {
                if shaped {
                    shaped::sections(page.label, page.pieces)
                } else {
                    vec![Section {
                        level: 1,
                        heading: vec![Inline::Text { text: page.label, marks: BTreeMap::new() }],
                        blocks: page.paragraphs.into_iter().map(paragraph).collect(),
                    }]
                }
            })
            .collect()
    };
    Imported {
        file: file.to_owned(),
        kind: tr!("ocr-kind-pdf"),
        // The title found on the pages names it; else what the file says of itself, or its name.
        title: named.unwrap_or_else(|| vec![Inline::Text { text: title.to_owned(), marks: BTreeMap::new() }]),
        counts: counts(&sections),
        sections,
        styles: shaped::views(&read.styles),
        structured: by_headings,
        remarks,
        ..Default::default()
    }
}

/// A picture as it was read, as a document that becomes a map: its name
/// the centre, and what was read the text of the centre.
pub fn imported_picture(file: &str, title: &str, paragraphs: Vec<String>) -> Imported {
    let remarks = if paragraphs.is_empty() { vec![tr!("ocr-remark-empty")] } else { Vec::new() };
    let sections = if paragraphs.is_empty() {
        Vec::new()
    } else {
        vec![Section { level: 0, heading: Vec::new(), blocks: paragraphs.into_iter().map(paragraph).collect() }]
    };
    Imported {
        file: file.to_owned(),
        kind: tr!("ocr-kind-picture"),
        title: vec![Inline::Text { text: title.to_owned(), marks: BTreeMap::new() }],
        counts: counts(&sections),
        sections,
        remarks,
        ..Default::default()
    }
}
