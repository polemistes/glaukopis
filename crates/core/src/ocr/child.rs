//! What is done with a PDF in a process of its own (`isolated.rs`): the
//! program itself never takes the file apart.
//!
//! lopdf, hayro and pdf-text can be led by a file into work without end, or
//! into memory taken without limit; in the application such work cannot be
//! stopped. So each step that opens the file is a task of the child, killed
//! when its time is up, when it takes more memory than it is given, or when
//! the one who asked stops it:
//!
//! - the look at a file ([`look`]): the text it has, how many pages it has
//!   and whether they can be drawn, and the title it gives itself, in one
//!   run of the child;
//! - the work on its pages ([`work`]): each page drawn, read by Tesseract,
//!   and, to make the file searchable, what was read laid over it and the
//!   new file written where the application asks. How far it has come is
//!   told page by page, on the child's output.
//!
//! What comes back is data (JSON): the lines of text, Tesseract's TSV, a
//! number of pages. Where no program is set for the child, as in the tests
//! of this crate, the same work is done here.

use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

use serde::{Deserialize, Serialize};

use super::drawing::{self, Pages, Quality};
use super::layer::{self, Layer};
use super::searchable;
use super::tesseract;
use super::{Progress, Reader, several, workers};
use crate::error::{Error, IoContext, Result};
use crate::export::tools::{self, Tool};
use crate::isolated::{self, Ended, Limits};
use crate::tr;

// ---------------------------------------------------------------------------
// The look
// ---------------------------------------------------------------------------

/// What the look at a file is asked: the file, and Poppler, which counts the
/// pages that hayro cannot open.
#[derive(Debug, Clone, Serialize, Deserialize)]
struct LookAsked {
    pdf: PathBuf,
    pdftoppm: Option<PathBuf>,
}

/// Whether hayro, which draws the pages, could open the file.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Opened {
    /// It could, and it has these pages.
    Pages(usize),
    /// It could, and the file has no pages.
    NoPages,
    /// It is locked with a password.
    Locked,
    /// It could not, for another reason.
    Unreadable,
}

/// What a look at a PDF found.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Seen {
    /// The text it has.
    pub layer: Layer,
    pub opened: Opened,
    /// The pages Poppler counts, where hayro could not open it and Poppler was there.
    pub poppler: Option<usize>,
    /// The title the file gives itself, where it looks like one.
    pub title: Option<String>,
}

impl Seen {
    /// How many pages can be drawn, or why none can.
    pub fn drawable(&self, file: &str) -> Result<usize> {
        match (self.opened, self.poppler) {
            (Opened::Pages(n), _) => Ok(n),
            (Opened::NoPages, _) => Err(Error::invalid(tr!("ocr-no-pages", file = file))),
            (_, Some(n)) if n > 0 => Ok(n),
            (Opened::Locked, _) => Err(Error::invalid(tr!("ocr-locked", file = file))),
            (Opened::Unreadable, _) => Err(Error::invalid(tr!("ocr-unreadable", file = file))),
        }
    }
}

/// How long a look at a file of `bytes` may take: the reading of its text,
/// and as long again for opening it to be drawn, and the time for its title.
fn look_time(bytes: u64) -> Duration {
    let reading = layer::patience(usize::try_from(bytes).unwrap_or(usize::MAX));
    reading * 2 + Duration::from_secs(20)
}

/// Looks at the PDF at `path`, of `bytes`, in the child. `pdftoppm` is
/// Poppler, where it is there.
pub fn look(path: &Path, bytes: u64, pdftoppm: Option<&Tool>) -> Result<Seen> {
    let asked = LookAsked { pdf: path.to_owned(), pdftoppm: pdftoppm.map(|t| t.path.clone()) };
    let place = tempfile::Builder::new()
        .prefix("glaukopis-look-")
        .tempdir()
        .context(|| tr!("io-creating-directory-in", path = &std::env::temp_dir()))?;
    let input = place.path().join("look.json");
    write_json(&input, &asked)?;
    let limits = Limits::for_file(bytes, look_time(bytes));
    match isolated::run::<Seen>("pdf-look", &input, limits) {
        None => Ok(look_here(&asked)),
        Some(Ok(seen)) => Ok(seen),
        Some(Err(ended)) => {
            tracing::warn!(%ended, path = %path.display(), "the look at the PDF was given up");
            Err(ended_error(&ended, path))
        }
    }
}

/// The task of the child: what [`look`] asks, from the JSON at `input`.
pub(crate) fn look_task(input: &Path) -> std::result::Result<Vec<u8>, String> {
    let asked: LookAsked = read_json(input)?;
    serde_json::to_vec(&look_here(&asked)).map_err(|e| e.to_string())
}

fn look_here(asked: &LookAsked) -> Seen {
    let bytes = match std::fs::read(&asked.pdf) {
        Ok(bytes) => Arc::new(bytes),
        Err(e) => {
            tracing::warn!(%e, "the PDF could not be read");
            Arc::new(Vec::new())
        }
    };
    // The text first, on a thread with its patience: a file in which the
    // reader loses itself still gives what was read, and is still looked at.
    let layer = layer::read(bytes.clone(), layer::patience(bytes.len()));
    let opened = match std::panic::catch_unwind(|| hayro::hayro_syntax::Pdf::new(bytes)) {
        Ok(Ok(pdf)) if pdf.pages().is_empty() => Opened::NoPages,
        Ok(Ok(pdf)) => Opened::Pages(pdf.pages().len()),
        Ok(Err(hayro::hayro_syntax::LoadPdfError::Decryption(_))) => Opened::Locked,
        Ok(Err(_)) | Err(_) => Opened::Unreadable,
    };
    let poppler = match opened {
        Opened::Locked | Opened::Unreadable => {
            asked.pdftoppm.as_deref().and_then(|p| drawing::poppler_sizes(p, &asked.pdf)).map(|sizes| sizes.len())
        }
        _ => None,
    };
    let title = crate::import::pdf::identify(&asked.pdf).ok().and_then(|facts| facts.title);
    Seen { layer, opened, poppler, title }
}

// ---------------------------------------------------------------------------
// The work on the pages
// ---------------------------------------------------------------------------

/// Tesseract, as the child is given it.
#[derive(Debug, Clone, Serialize, Deserialize)]
struct Given {
    path: PathBuf,
    data: Option<PathBuf>,
}

impl Given {
    fn tool(&self) -> Tool {
        Tool { path: self.path.clone(), version: String::new(), least: None, data: self.data.clone() }
    }
}

/// What is done with the pages.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Task {
    /// These pages, counted from nought, drawn and read: their TSV.
    Read { pages: Vec<usize> },
    /// The first pages, as many as there are up to `count`, drawn and read.
    First { count: usize },
    /// The file made searchable: the fonts of `maps` given their letters,
    /// these pages drawn and read and what was read laid over them, the text
    /// they had taken away first where `strip`, and the file written to `output`.
    Searchable { pages: Vec<usize>, strip: bool, maps: Vec<searchable::FontMap>, output: PathBuf },
    /// One page, counted from nought, drawn and read, to be tried: its TSV,
    /// and the picture Tesseract read, made smaller to be shown.
    Try { page: usize },
    /// Small pictures of `count` pages from `from`, counted from nought, as
    /// many as the file has, each `width` dots wide: to be shown, not read.
    Pictures { from: usize, count: usize, width: u32 },
}

/// What the child is asked to do with the pages of a PDF.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Job {
    pdf: PathBuf,
    /// The language the child speaks in, as the application does.
    language: String,
    tesseract: Option<Given>,
    with: tesseract::With,
    /// The stretches of pages read otherwise: the page each begins at,
    /// counted from nought, and what it is read with.
    #[serde(default)]
    stretches: Vec<(usize, tesseract::With)>,
    quality: Quality,
    pdftoppm: Option<PathBuf>,
    /// Where the pictures of the pages are made, a folder of the application's.
    work: PathBuf,
    /// The memory the child may hold: it draws no more pages at once than fit in it.
    memory: u64,
    task: Task,
}

impl Job {
    /// A job on the PDF at `pdf`, read by `reader` (nothing where no page is
    /// read), with Poppler where it is there, its pictures made in `work`.
    pub(super) fn new(
        pdf: &Path,
        reader: Option<&Reader<'_>>,
        pdftoppm: Option<&Tool>,
        work: &Path,
        task: Task,
    ) -> Job {
        Job {
            pdf: pdf.to_owned(),
            language: crate::i18n::language().to_owned(),
            tesseract: reader.map(|r| Given { path: r.tesseract.path.clone(), data: r.tesseract.data.clone() }),
            with: reader.map(|r| r.with.clone()).unwrap_or_default(),
            stretches: reader.map(|r| r.stretches.clone()).unwrap_or_default(),
            quality: reader.map(|r| r.quality).unwrap_or_default(),
            pdftoppm: pdftoppm.map(|t| t.path.clone()),
            work: work.to_owned(),
            memory: 0,
            task,
        }
    }

    /// How many pages are drawn, at the most.
    fn pages(&self) -> usize {
        match &self.task {
            Task::Read { pages } | Task::Searchable { pages, .. } => pages.len(),
            Task::First { count } | Task::Pictures { count, .. } => *count,
            Task::Try { .. } => 1,
        }
    }
}

/// How a job failed, in words that can cross between the processes.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Failure {
    kind: String,
    message: String,
}

impl Failure {
    fn of(e: &Error) -> Failure {
        Failure { kind: e.kind().to_owned(), message: e.to_string() }
    }

    fn error(self) -> Error {
        match self.kind.as_str() {
            "locked" => Error::Refused { kind: "locked", message: self.message },
            tools::STOPPED => Error::Refused { kind: tools::STOPPED, message: self.message },
            _ => Error::invalid(self.message),
        }
    }
}

/// What Tesseract read of a page: its TSV and the dots to the inch it was
/// drawn at; or why it could not be read.
pub type PageRead = (usize, std::result::Result<(String, u32), String>);

/// What making a file searchable came to.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct Made {
    /// The pages that were read.
    pub read: usize,
    /// The pages that could not be read, counted from one, with why.
    pub failed: Vec<(usize, String)>,
    /// How many fonts were given their letters.
    pub remapped: usize,
    /// Whether a file was written: none where nothing was changed.
    pub written: bool,
    /// The pages Tesseract read poorly, counted from one.
    #[serde(default)]
    pub poorly: Vec<usize>,
}

/// The longest side of the picture of a page tried, as it is shown.
const SHOWN: u32 = 1600;

/// A page tried: what Tesseract read of it, and the picture it read, made
/// smaller to be shown.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Tried {
    pub tsv: String,
    /// The dots to the inch it was drawn at: what the places of the TSV are counted in.
    pub dpi: u32,
    /// The picture, as PNG in base64.
    pub png: String,
    pub width: u32,
    pub height: u32,
    /// What the places of the TSV are multiplied by to be places on the picture.
    pub scale: f32,
}

/// A small picture of a page: a PNG in grey, carried as base64; or why the
/// page could not be drawn.
pub type PagePicture = (usize, std::result::Result<String, String>);

/// What a job came to.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum Done {
    Pages(Vec<PageRead>),
    Made(Made),
    Tried(Tried),
    Pictures(Vec<PagePicture>),
}

/// How long the work on a file of `bytes` may take, with `pages` to draw and
/// read: the time to open it, and two minutes a page, which is many times
/// what Tesseract takes on a page at the most dots to the inch.
fn work_time(bytes: u64, pages: usize) -> Duration {
    let opening = layer::patience(usize::try_from(bytes).unwrap_or(usize::MAX));
    opening + Duration::from_secs(120).saturating_mul(u32::try_from(pages).unwrap_or(u32::MAX))
}

/// Does a job on the PDF of `bytes`, in the child, and tells how far it has
/// come as each page is done. The job's JSON is written in `place`, a
/// folder of the application's that is gone afterwards.
pub fn work(mut job: Job, bytes: u64, place: &Path, told: &mut dyn FnMut(Progress), stop: &AtomicBool) -> Result<Done> {
    let limits = Limits::for_file(bytes, work_time(bytes, job.pages()));
    job.memory = limits.memory;
    let input = place.join("job.json");
    write_json(&input, &job)?;
    let mut lines = |line: &str| match serde_json::from_str::<Progress>(line) {
        Ok(progress) => told(progress),
        Err(_) => tracing::debug!(line, "the process said this on its output"),
    };
    let answer = match isolated::run_watched::<std::result::Result<Done, Failure>>(
        "pdf-job", &input, limits, &mut lines, stop,
    ) {
        None => return work_here(&job, told, stop).map_err(Failure::error),
        Some(answer) => answer,
    };
    match answer {
        Ok(done) => done.map_err(Failure::error),
        Err(Ended::Stopped) => Err(super::stopped()),
        Err(ended) => {
            tracing::warn!(%ended, path = %job.pdf.display(), "the work on the PDF was given up");
            Err(ended_error(&ended, &job.pdf))
        }
    }
}

/// The task of the child: the job at `input`, told page by page on its output.
pub(crate) fn work_task(input: &Path) -> std::result::Result<Vec<u8>, String> {
    let job: Job = read_json(input)?;
    crate::i18n::set_language(&job.language);
    let mut tell = |progress: Progress| {
        if let Ok(line) = serde_json::to_string(&progress) {
            isolated::tell(&line);
        }
    };
    // It is stopped by being killed.
    let done = work_here(&job, &mut tell, &AtomicBool::new(false));
    serde_json::to_vec(&done).map_err(|e| e.to_string())
}

fn work_here(job: &Job, told: &mut dyn FnMut(Progress), stop: &AtomicBool) -> std::result::Result<Done, Failure> {
    let failure = |e: Error| Failure::of(&e);
    let bytes = std::fs::read(&job.pdf).context(|| tr!("io-reading", path = &job.pdf)).map_err(failure)?;
    let tesseract = job.tesseract.as_ref().map(Given::tool);
    let pdftoppm =
        job.pdftoppm.as_ref().map(|p| Tool { path: p.clone(), version: String::new(), least: None, data: None });
    let reader = tesseract.as_ref().map(|t| Reader {
        tesseract: t,
        with: job.with.clone(),
        quality: job.quality,
        stretches: job.stretches.clone(),
    });
    let size = bytes.len() as u64;
    match &job.task {
        Task::Read { pages } => {
            let reader = reader.ok_or_else(|| failure(Error::invalid("no Tesseract was given")))?;
            let drawing = Pages::open(&job.pdf, Arc::new(bytes), pdftoppm.as_ref()).map_err(failure)?;
            Ok(Done::Pages(read_pages(job, &reader, &drawing, pages, size, told, stop)))
        }
        Task::First { count } => {
            let reader = reader.ok_or_else(|| failure(Error::invalid("no Tesseract was given")))?;
            let drawing = Pages::open(&job.pdf, Arc::new(bytes), pdftoppm.as_ref()).map_err(failure)?;
            let pages: Vec<usize> = (0..(*count).min(drawing.count())).collect();
            Ok(Done::Pages(read_pages(job, &reader, &drawing, &pages, size, told, stop)))
        }
        Task::Searchable { pages, strip, maps, output } => {
            let made = searchable_here(
                job,
                reader.as_ref(),
                pdftoppm.as_ref(),
                bytes,
                pages,
                *strip,
                maps,
                output,
                told,
                stop,
            )
            .map_err(failure)?;
            Ok(Done::Made(made))
        }
        Task::Try { page } => {
            let reader = reader.ok_or_else(|| failure(Error::invalid("no Tesseract was given")))?;
            let drawing = Pages::open(&job.pdf, Arc::new(bytes), pdftoppm.as_ref()).map_err(failure)?;
            try_here(&reader, &drawing, *page, &job.work, stop).map(Done::Tried).map_err(failure)
        }
        Task::Pictures { from, count, width } => {
            let drawing = Pages::open(&job.pdf, Arc::new(bytes), pdftoppm.as_ref()).map_err(failure)?;
            let pages: Vec<usize> = (*from..from.saturating_add(*count).min(drawing.count())).collect();
            Ok(Done::Pictures(pictures(job, &drawing, &pages, *width, size, told, stop)))
        }
    }
}

/// Draws a page and has Tesseract read it, keeping the picture to be shown.
fn try_here(reader: &Reader<'_>, drawing: &Pages, page: usize, work: &Path, stop: &AtomicBool) -> Result<Tried> {
    use base64::Engine as _;
    let (picture, dpi) = drawing.draw(page, work, reader.quality, stop)?;
    let read = reader.read(reader.with_at(page), &picture, dpi, (true, false), stop);
    let shown = read.as_ref().ok().map(|_| drawing::Drawn::read_back(&picture, dpi).and_then(|d| d.shown(SHOWN)));
    for made in [picture.clone(), picture.with_extension("tsv")] {
        let _ = std::fs::remove_file(made);
    }
    let read = read?;
    let shown = shown.expect("a page that was read was drawn")?;
    Ok(Tried {
        tsv: read.tsv.unwrap_or_default(),
        dpi,
        png: base64::engine::general_purpose::STANDARD.encode(&shown.png),
        width: shown.width,
        height: shown.height,
        scale: shown.scale,
    })
}

/// How many pages are drawn at once: as many as there are cores and as fit
/// in the memory free (`workers`), and as fit in what the child may hold,
/// with the file and what is made of it: a picture of a page takes about six
/// bytes a dot as it is drawn.
fn at_once(drawing: &Pages, pages: &[usize], quality: Quality, memory: u64, bytes: u64) -> usize {
    let dots = drawing.largest_dots(pages, quality);
    workers(dots).min(fitting(memory, bytes, dots))
}

/// How many pictures of `dots` fit in `memory`, beside a file of `bytes`
/// taken apart; one at the least. Any number where no memory is said.
fn fitting(memory: u64, bytes: u64, dots: u64) -> usize {
    if memory == 0 {
        return usize::MAX;
    }
    let left = memory.saturating_sub(bytes.saturating_mul(4).saturating_add(256 << 20));
    usize::try_from(left / dots.saturating_mul(6).max(1)).unwrap_or(usize::MAX).max(1)
}

fn read_pages(
    job: &Job,
    reader: &Reader<'_>,
    drawing: &Pages,
    pages: &[usize],
    bytes: u64,
    told: &mut dyn FnMut(Progress),
    stop: &AtomicBool,
) -> Vec<PageRead> {
    let one = |index: usize| {
        let read = reader.draw_and_read(drawing, index, &job.work, (true, false), stop)?;
        Ok((read.tsv.unwrap_or_default(), read.dpi))
    };
    let at_once = at_once(drawing, pages, reader.quality, job.memory, bytes);
    tracing::info!(pages = pages.len(), at_once, "pages read by Tesseract");
    several(pages, at_once, &one, told, stop)
        .into_iter()
        .map(|(index, result)| (index, result.map_err(|e: Error| e.to_string())))
        .collect()
}

/// Small pictures of pages, several at a time, as [`Task::Pictures`] says.
/// However small the picture, the page is taken apart whole, and a scan's
/// picture is unpacked whole: so as many are drawn at once as could be
/// drawn for Tesseract.
fn pictures(
    job: &Job,
    drawing: &Pages,
    pages: &[usize],
    width: u32,
    bytes: u64,
    told: &mut dyn FnMut(Progress),
    stop: &AtomicBool,
) -> Vec<PagePicture> {
    use base64::Engine as _;
    let one = |index: usize| {
        let png = drawing.small(index, width, &job.work, stop)?;
        Ok(base64::engine::general_purpose::STANDARD.encode(png))
    };
    let at_once = at_once(drawing, pages, Quality::default(), job.memory, bytes);
    tracing::debug!(pages = pages.len(), at_once, width, "small pictures of pages drawn");
    several(pages, at_once, &one, told, stop)
        .into_iter()
        .map(|(index, result)| (index, result.map_err(|e: Error| e.to_string())))
        .collect()
}

/// Makes a file searchable, as [`Task::Searchable`] says.
#[allow(clippy::too_many_arguments)]
fn searchable_here(
    job: &Job,
    reader: Option<&Reader<'_>>,
    pdftoppm: Option<&Tool>,
    bytes: Vec<u8>,
    wanted: &[usize],
    strip: bool,
    maps: &[searchable::FontMap],
    output: &Path,
    told: &mut dyn FnMut(Progress),
    stop: &AtomicBool,
) -> Result<Made> {
    let doc = searchable::open(&bytes)?;
    let count = doc.get_pages().len();
    // The fonts whose glyphs were translated are given their letters first.
    let mut remapped = 0;
    let (bytes, doc) = if maps.is_empty() {
        (bytes, doc)
    } else {
        let (out, given) = searchable::remap(bytes, doc, maps)?;
        remapped = given;
        let doc = searchable::open(&out)?;
        (out, doc)
    };
    let write = |pdf: &[u8]| std::fs::write(output, pdf).context(|| tr!("io-writing", path = output));
    if wanted.is_empty() {
        if remapped > 0 {
            write(&bytes)?;
        }
        return Ok(Made { read: 0, failed: Vec::new(), remapped, written: remapped > 0, poorly: Vec::new() });
    }
    let reader = reader.ok_or_else(|| Error::invalid("no Tesseract was given"))?;
    let size = bytes.len() as u64;
    let bytes = Arc::new(bytes);
    let pages = Pages::open(&job.pdf, bytes.clone(), pdftoppm)?;
    let drawn_by_hayro = matches!(pages, Pages::Hayro(_));
    // The words are asked for beside the page of text, in the same run of
    // Tesseract, to tell how sure it was of the page.
    let one = |index: usize| {
        let read = reader.draw_and_read(&pages, index, &job.work, (true, true), stop)?;
        let confidence = read.tsv.as_deref().and_then(super::text::page_confidence);
        Ok((searchable::Layer { page: index, pdf: read.layer.unwrap_or_default() }, confidence))
    };
    let mut layers = Vec::new();
    let mut failed = Vec::new();
    let mut poorly = Vec::new();
    let at_once = at_once(&pages, wanted, reader.quality, job.memory, size);
    tracing::info!(pages = wanted.len(), at_once, "pages made searchable by Tesseract");
    for (index, result) in several(wanted, at_once, &one, told, stop) {
        match result {
            Ok((layer, confidence)) => {
                if super::read_poorly(confidence) {
                    poorly.push(index + 1);
                }
                layers.push(layer);
            }
            Err(e) => failed.push((index + 1, e.to_string())),
        }
    }
    if stop.load(Ordering::Relaxed) {
        return Err(super::stopped());
    }
    if layers.is_empty() {
        let (_, why) = failed.first().cloned().unwrap_or_default();
        return Err(Error::invalid(why));
    }
    drop(pages);
    let bytes = Arc::try_unwrap(bytes).unwrap_or_else(|shared| shared.as_ref().clone());
    let pdf = searchable::lay_over(bytes, doc, &layers, strip)?;
    // Read again as it is drawn, where it was drawn so before.
    if drawn_by_hayro {
        let pages = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            hayro::hayro_syntax::Pdf::new(pdf.clone()).map(|read| read.pages().len()).unwrap_or(0)
        }))
        .unwrap_or(0);
        if pages != count {
            return Err(Error::invalid(tr!("ocr-searchable-unreadable", message = tr!("ocr-not-whole"))));
        }
    }
    write(&pdf)?;
    Ok(Made { read: layers.len(), failed, remapped, written: true, poorly })
}

// ---------------------------------------------------------------------------
// Between the processes
// ---------------------------------------------------------------------------

fn write_json<T: Serialize>(path: &Path, value: &T) -> Result<()> {
    let bytes = serde_json::to_vec(value).map_err(|e| Error::invalid(e.to_string()))?;
    std::fs::write(path, bytes).context(|| tr!("io-writing", path = path))
}

fn read_json<T: serde::de::DeserializeOwned>(path: &Path) -> std::result::Result<T, String> {
    let bytes = std::fs::read(path).map_err(|e| e.to_string())?;
    serde_json::from_slice(&bytes).map_err(|e| e.to_string())
}

/// What the one who asked is told of a child that ended without its answer.
fn ended_error(ended: &Ended, path: &Path) -> Error {
    let file = super::file_name(path);
    match ended {
        Ended::Stopped => super::stopped(),
        Ended::Time => Error::invalid(tr!("ocr-child-time", file = &file)),
        Ended::Memory => Error::invalid(tr!("ocr-child-memory", file = &file)),
        Ended::Failed(why) => Error::invalid(tr!("ocr-child-failed", file = &file, message = why.as_str())),
        Ended::NotStarted(why) => Error::invalid(tr!("ocr-child-not-started", file = &file, message = why.as_str())),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn as_many_pictures_at_once_as_the_child_may_hold() {
        // An A4 page at 300 dots is 8.7 million dots, some 52 MB as it is drawn.
        let a4 = 2480 * 3508;
        assert_eq!(fitting(1 << 30, 1 << 20, a4), 15);
        // A plan of ten thousand dots a side fits once; and once at the least.
        assert_eq!(fitting(1 << 30, 1 << 20, 100_000_000), 1);
        assert_eq!(fitting(512 << 20, 400 << 20, a4), 1);
        assert_eq!(fitting(0, 1 << 20, a4), usize::MAX);
    }

    #[test]
    fn the_work_is_given_time_by_its_pages() {
        assert_eq!(work_time(0, 0), Duration::from_secs(30));
        assert_eq!(work_time(10 << 20, 3), Duration::from_secs(35 + 360));
        assert!(look_time(0) >= Duration::from_secs(80));
    }

    #[test]
    fn a_failure_crosses_with_its_kind() {
        let locked = Failure::of(&Error::Refused { kind: "locked", message: "locked".into() }).error();
        assert_eq!(locked.kind(), "locked");
        let stopped = Failure::of(&super::super::stopped()).error();
        assert_eq!(stopped.kind(), tools::STOPPED);
        let other = Failure::of(&Error::invalid("no")).error();
        assert_eq!((other.kind(), other.to_string().as_str()), ("invalid", "no"));
    }
}
