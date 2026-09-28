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

pub mod drawing;
pub mod layer;
pub mod searchable;
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

use drawing::{Drawn, Pages};
use layer::Layer;
use text::{IsWord, Line};

/// What a reading is asked to do.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Asked {
    /// Tesseract's names of the languages the text is in, the likeliest
    /// first: `nor`, `eng`. English, where none are given.
    pub languages: Vec<String>,
    /// Whether the pages that have text already are read as well.
    pub all: bool,
}

/// How far a reading has come.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize)]
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
    /// The title the file gives itself, where it looks like one.
    pub title: Option<String>,
    /// Whether it can be made searchable: a PDF that is not locked.
    pub searchable: bool,
}

/// A page with what was read of it.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize)]
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
}

/// What reading a PDF came to.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct ReadPdf {
    pub pages: Vec<PageText>,
    /// What the one who asked should know.
    pub remarks: Vec<String>,
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

/// Tesseract, and the languages it is to read with: those asked for, each of
/// which it must have data for; English where none are asked for, or the
/// first it has.
fn ready<'t>(tools: &'t Tools, asked: &Asked) -> Result<(&'t Tool, Vec<String>)> {
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
    Ok((tesseract, languages))
}

/// How many pages are read at once: one less than there are cores, so that
/// the application is not kept waiting, and no more than eight, since each
/// Tesseract takes a few hundred megabytes.
fn workers() -> usize {
    std::thread::available_parallelism().map_or(2, |n| n.get()).saturating_sub(1).clamp(1, 8)
}

/// Reads pages, several at a time, each by `one`, and tells how far it has
/// come as each is done. What each page gave, in the order of the pages. A
/// page that is given up (`one` panics) is an error of that page alone.
fn several<T: Send>(
    pages: &[usize],
    one: &(dyn Fn(usize) -> Result<T> + Sync),
    told: &mut dyn FnMut(Progress),
    stop: &AtomicBool,
) -> Vec<(usize, Result<T>)> {
    let next = AtomicUsize::new(0);
    let (send, receive) = mpsc::channel();
    let mut done = Vec::with_capacity(pages.len());
    std::thread::scope(|scope| {
        for _ in 0..workers().min(pages.len()) {
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

/// The text of the file that was read last, by the file, its size and when
/// it was changed: what was read when a file was looked at is not read
/// again when it is read.
type Kept = (PathBuf, u64, Option<SystemTime>, Arc<Layer>);
static KEPT: Mutex<Option<Kept>> = Mutex::new(None);

fn layer_of(path: &Path, bytes: &Arc<Vec<u8>>) -> Arc<Layer> {
    let meta = std::fs::metadata(path).ok();
    let size = meta.as_ref().map_or(0, std::fs::Metadata::len);
    let changed = meta.and_then(|m| m.modified().ok());
    let mut kept = KEPT.lock().unwrap_or_else(PoisonError::into_inner);
    if let Some((p, s, c, layer)) = kept.as_ref()
        && p == path
        && *s == size
        && *c == changed
    {
        return layer.clone();
    }
    let layer = Arc::new(layer::read(bytes.clone(), layer::patience(bytes.len())));
    *kept = Some((path.to_owned(), size, changed, layer.clone()));
    layer
}

fn read_pdf_file(path: &Path) -> Result<Arc<Vec<u8>>> {
    let file = file_name(path);
    let mut head = Vec::new();
    std::fs::File::open(path)
        .and_then(|f| f.take(1024).read_to_end(&mut head))
        .context(|| format!("reading {}", path.display()))?;
    if !head.windows(5).any(|w| w == b"%PDF-") {
        return Err(Error::invalid(tr!("ocr-not-pdf", file = &file)));
    }
    Ok(Arc::new(std::fs::read(path).context(|| format!("reading {}", path.display()))?))
}

/// Looks at a PDF or a picture before it is read: how many pages it has,
/// which have text already, and what it calls itself.
pub fn look(path: &Path, tools: &Tools) -> Result<Looked> {
    let file = file_name(path);
    if is_picture(path) {
        return Ok(Looked { file, picture: true, pages: 1, ..Default::default() });
    }
    let bytes = read_pdf_file(path)?;
    let layer = layer_of(path, &bytes);
    let pages = match layer.pages.len() {
        0 => Pages::open(path, bytes.clone(), tools.pdftoppm.as_ref())?.count(),
        n => n,
    };
    let with_text = (0..pages).filter(|i| layer.has_text(*i)).count();
    let title = crate::import::pdf::identify(path).ok().and_then(|facts| facts.title);
    let searchable = !layer.locked && !layer.pages.is_empty();
    Ok(Looked { file, picture: false, pages, with_text, title, searchable })
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

/// A directory of its own for what is made on the way, in `work`, which is
/// gone afterwards.
fn place_in(work: &Path) -> Result<tempfile::TempDir> {
    std::fs::create_dir_all(work).context(|| format!("creating {}", work.display()))?;
    tempfile::Builder::new()
        .prefix("ocr-")
        .tempdir_in(work)
        .context(|| format!("creating a directory in {}", work.display()))
}

/// Draws a page and has Tesseract read it: its TSV, its page of text, or both.
fn draw_and_read(
    pages: &Pages,
    index: usize,
    place: &Path,
    tesseract: &Tool,
    languages: &[String],
    (text, layer): (bool, bool),
    stop: &AtomicBool,
) -> Result<tesseract::Read> {
    let (picture, dpi) = pages.draw(index, place, stop)?;
    let read = tesseract::read(tesseract, &picture, dpi, languages, text, layer, stop);
    for made in [picture.clone(), picture.with_extension("tsv"), picture.with_extension("pdf")] {
        let _ = std::fs::remove_file(made);
    }
    read
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

/// Reads a PDF, page by page. Pages that have text are taken as they are,
/// unless all are asked to be read; the others are read by Tesseract.
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
    let bytes = read_pdf_file(path)?;
    let layer = layer_of(path, &bytes);
    let drawing = Pages::open(path, bytes.clone(), tools.pdftoppm.as_ref());
    let count = layer.pages.len().max(drawing.as_ref().map_or(0, Pages::count));
    if count == 0 {
        return Err(drawing.err().unwrap_or_else(|| Error::invalid(tr!("ocr-no-pages", file = &file_name(path)))));
    }
    let wanted: Vec<usize> = (0..count).filter(|i| asked.all || !layer.has_text(*i)).collect();
    let with_text = (0..count).filter(|i| layer.has_text(*i)).count();

    let mut remarks = Vec::new();
    let mut read: BTreeMap<usize, Vec<Vec<Line>>> = BTreeMap::new();
    let mut failed: Vec<(usize, String)> = Vec::new();
    if !wanted.is_empty() {
        let can = ready(tools, asked).and_then(|ready| drawing.map(|pages| (ready, pages)));
        match can {
            Ok(((tesseract, languages), pages)) => {
                let place = place_in(work)?;
                let one = |index: usize| {
                    let read = draw_and_read(&pages, index, place.path(), tesseract, &languages, (true, false), stop)?;
                    Ok(text::tsv_paragraphs(read.tsv.as_deref().unwrap_or_default()))
                };
                for (index, result) in several(&wanted, &one, told, stop) {
                    match result {
                        Ok(groups) => {
                            read.insert(index, groups);
                        }
                        Err(e) => failed.push((index + 1, e.to_string())),
                    }
                }
                if stop.load(Ordering::Relaxed) {
                    return Err(stopped());
                }
                if read.is_empty() && with_text == 0 {
                    let (_, why) = failed.first().cloned().unwrap_or_default();
                    return Err(Error::invalid(why));
                }
                if !read.is_empty() {
                    remarks.push(tr!("ocr-remark-read", count = read.len()));
                }
            }
            // Nothing can be read: that is the answer, unless some pages have text.
            Err(e) if with_text == 0 => return Err(e),
            Err(Error::MissingProgram { .. }) => {
                remarks.push(tr!("ocr-remark-no-tesseract", count = wanted.len() - with_text.min(wanted.len())))
            }
            Err(e) => remarks.push(tr!("ocr-remark-not-read", message = e.to_string())),
        }
    }
    if with_text > 0 && !asked.all && !read.is_empty() {
        remarks.push(tr!("ocr-remark-text", count = with_text));
    }
    remarks.extend(failures(&failed));

    let mut paragraphs: Vec<Vec<String>> = (0..count)
        .map(|index| match read.remove(&index) {
            Some(groups) => text::page_paragraphs(groups, is_word),
            None => {
                let lines = layer.pages.get(index).cloned().flatten().unwrap_or_default();
                text::page_paragraphs(text::by_place(lines), is_word)
            }
        })
        .collect();
    text::mend_across(&mut paragraphs, is_word);
    if paragraphs.iter().all(Vec::is_empty) {
        remarks.push(tr!("ocr-remark-empty"));
    }
    let pages = paragraphs
        .into_iter()
        .enumerate()
        .map(|(index, paragraphs)| PageText {
            number: index + 1,
            label: layer.label(index),
            read: wanted.contains(&index) && !failed.iter().any(|(page, _)| *page == index + 1),
            paragraphs,
        })
        .collect();
    Ok(ReadPdf { pages, remarks })
}

/// Reads a picture as one page: the file of a picture, or a picture of the
/// store.
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
    let (tesseract, languages) = ready(tools, asked)?;
    let drawn = Drawn::of_picture(bytes)?;
    let place = place_in(work)?;
    let picture = place.path().join("picture.pgm");
    drawn.write(&picture)?;
    let read = tesseract::read(tesseract, &picture, drawn.dpi, &languages, true, false, stop)?;
    if stop.load(Ordering::Relaxed) {
        return Err(stopped());
    }
    Ok(text::page_paragraphs(text::tsv_paragraphs(read.tsv.as_deref().unwrap_or_default()), is_word))
}

/// Makes a PDF searchable: the pages that have no text are read, and what
/// is read is laid over them, unseen. Pages that have text are left as they
/// are, unless all are asked to be read. The file itself is not touched: the
/// one that has the text is given back, and has been read again to be sure
/// it holds as many pages as the file.
pub fn make_searchable(
    path: &Path,
    tools: &Tools,
    work: &Path,
    asked: &Asked,
    told: &mut dyn FnMut(Progress),
    stop: &AtomicBool,
) -> Result<Searchable> {
    let bytes = read_pdf_file(path)?;
    let doc = searchable::open(&bytes)?;
    let count = doc.get_pages().len();
    let layer = layer_of(path, &bytes);
    let with_text = (0..count).filter(|i| layer.has_text(*i)).count();
    let wanted: Vec<usize> = (0..count).filter(|i| asked.all || !layer.has_text(*i)).collect();
    if wanted.is_empty() {
        return Ok(Searchable { pdf: None, read: 0, with_text, failed: Vec::new() });
    }
    let (tesseract, languages) = ready(tools, asked)?;
    let pages = Pages::open(path, bytes.clone(), tools.pdftoppm.as_ref())?;
    let drawn_by_hayro = matches!(pages, Pages::Hayro(_));
    let place = place_in(work)?;
    let one = |index: usize| {
        let read = draw_and_read(&pages, index, place.path(), tesseract, &languages, (false, true), stop)?;
        Ok(searchable::Layer { page: index, pdf: read.layer.unwrap_or_default() })
    };
    let mut layers = Vec::new();
    let mut failed = Vec::new();
    for (index, result) in several(&wanted, &one, told, stop) {
        match result {
            Ok(layer) => layers.push(layer),
            Err(e) => failed.push((index + 1, e.to_string())),
        }
    }
    if stop.load(Ordering::Relaxed) {
        return Err(stopped());
    }
    if layers.is_empty() {
        let (_, why) = failed.first().cloned().unwrap_or_default();
        return Err(Error::invalid(why));
    }
    drop(pages);
    let bytes = Arc::try_unwrap(bytes).unwrap_or_else(|shared| shared.as_ref().clone());
    let pdf = searchable::lay_over(bytes, doc, &layers)?;
    // Read again as it is drawn, where it was drawn so before.
    if drawn_by_hayro {
        let pages = catch_unwind(AssertUnwindSafe(|| {
            hayro::hayro_syntax::Pdf::new(pdf.clone()).map(|read| read.pages().len()).unwrap_or(0)
        }))
        .unwrap_or(0);
        if pages != count {
            return Err(Error::invalid(tr!("ocr-searchable-unreadable", message = tr!("ocr-not-whole"))));
        }
    }
    Ok(Searchable { pdf: Some(pdf), read: layers.len(), with_text, failed })
}

// ---------------------------------------------------------------------------
// What becomes a map
// ---------------------------------------------------------------------------

fn paragraph(text: String) -> Block {
    Block::Paragraph { content: vec![Inline::Text { text, marks: BTreeMap::new() }] }
}

fn counts(sections: &[Section]) -> Counts {
    let words = sections
        .iter()
        .flat_map(|s| &s.blocks)
        .map(|b| match b {
            Block::Paragraph { content } => content
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
    let sections: Vec<Section> = read
        .pages
        .into_iter()
        .map(|page| Section {
            level: 1,
            heading: vec![Inline::Text { text: page.label, marks: BTreeMap::new() }],
            blocks: page.paragraphs.into_iter().map(paragraph).collect(),
        })
        .collect();
    Imported {
        file: file.to_owned(),
        kind: tr!("ocr-kind-pdf"),
        title: vec![Inline::Text { text: title.to_owned(), marks: BTreeMap::new() }],
        counts: counts(&sections),
        sections,
        remarks: read.remarks,
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
