//! The typesetting pane's document, set and kept by a child (record 0087):
//! Typst sets `document.typ` of the pane's work folder in a process of its
//! own, bounded in memory, and keeps what it set to draw the pages asked of
//! it, the pages for printing, and the places and spots of the chips, each
//! written as a file for the core to take. The core keeps no typeset
//! document, and what Typst held is given back whole when the child ends:
//! a long-lived process does not always give back what it frees.
//!
//! The child and the parent are both here, as `ocr/server.rs` and the
//! serving of `ocr/child.rs` are for a file shown in a view. A child serves
//! one work folder, found by it; it is asked one thing at a time, so that
//! each ask has its own time. It is ended when its pane closes
//! ([`end`]), when nothing has been asked of it for [`IDLE`], and when more
//! than [`MOST_OPEN`] are served, the one asked of longest ago first; a
//! pane whose child ended has its document set again, from the file, when
//! it next asks. Where no child can be started, the caller sets in its own
//! process (`export::set_for_preview`).

use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::sync::{Arc, Mutex, MutexGuard, Once, PoisonError};
use std::time::{Duration, Instant};

use serde::{Deserialize, Serialize};

use super::typeset::{self, PagedDocument, Place, Spot, TextRun};
use super::{Page, PrintPage};
use crate::error::{Error, IoContext, Result};
use crate::isolated::{self, Ended, Serving};
use crate::tr;

/// The most documents served at once: a pane in each of three windows.
pub const MOST_OPEN: usize = 3;

/// How long a document is kept with nothing asked of it: a writer reads a
/// page, writes, and comes back to the pane (record 0087).
pub const IDLE: Duration = Duration::from_secs(600);

/// How often the documents served are looked at, to let go of those idle.
const LOOKED_AT: Duration = Duration::from_secs(5);

/// How long a setting may take: Typst set a book of 432,000 words in some
/// fifteen seconds.
const SETTING_TIME: Duration = Duration::from_secs(120);

/// How long the pages asked at once may take to be drawn.
const DRAWING_TIME: Duration = Duration::from_secs(30);

/// The name of the task of the child, as `isolated::task` knows it.
pub const TASK: &str = "typeset-serve";

// ---------------------------------------------------------------------------
// What crosses between the two
// ---------------------------------------------------------------------------

/// What the child is given as it starts.
#[derive(Debug, Serialize, Deserialize)]
struct Job {
    /// The work folder of the pane, where `document.typ` stands.
    dir: PathBuf,
    /// Where it writes what it gives.
    place: PathBuf,
    /// The language it speaks in, as the application does.
    language: String,
}

/// Where the text stands on every page, as the parent has it from the
/// format: what the spots are found within (`typeset::Margins`).
#[derive(Debug, Clone, Copy, Default, PartialEq, Serialize, Deserialize)]
pub struct Margins {
    pub top: f32,
    pub bottom: f32,
    /// Whether the header is shown, and the footer.
    pub head: bool,
    pub foot: bool,
}

impl Margins {
    pub(super) fn typeset(self) -> typeset::Margins {
        typeset::Margins {
            top: self.top,
            bottom: self.bottom,
            head: self.head.then_some("header"),
            foot: self.foot.then_some("footer"),
        }
    }
}

/// What the child is asked, a line each.
#[derive(Debug, Serialize, Deserialize)]
enum Ask {
    /// To set `document.typ` anew, in place of what it set before; with
    /// the margins, to tell the places and spots of what it set as well.
    Set { margins: Option<Margins> },
    /// These pages, the first being 1, each drawn and with its text; all
    /// of them where none is named.
    Pages(Vec<u32>),
    /// The pages `from` to `to`, drawn for printing.
    Print { from: u32, to: u32 },
}

/// What the child tells of an ask, a line each.
#[derive(Debug, Serialize, Deserialize)]
enum Answer {
    /// The document is set: how many pages it has, what Typst said of it,
    /// and the file of its places and spots where they were asked.
    Set { count: usize, warnings: Vec<String>, file: Option<PathBuf> },
    /// A page drawn, as SVG, and the runs of its text as JSON.
    Page { number: u32, svg: PathBuf, texts: PathBuf },
    /// A page drawn for printing.
    Printed { number: u32, svg: PathBuf },
    /// Every page asked for that the document has has been told of.
    Done { count: usize },
    /// It could not do what was asked.
    Failed(Failure),
}

/// The places and spots of what was set, as the child writes them.
#[derive(Debug, Default, Serialize, Deserialize)]
struct Where {
    places: Vec<Place>,
    spots: Vec<Spot>,
}

/// Why the child could not do what was asked, as it crosses.
#[derive(Debug, Serialize, Deserialize)]
enum Failure {
    /// Typst could not set the document: what it said.
    Typst(String),
    /// It has set nothing to draw from.
    NotSet,
    Other(String),
}

impl Failure {
    fn of(e: Error) -> Failure {
        match e {
            Error::Program { message, .. } => Failure::Typst(message),
            other => Failure::Other(other.to_string()),
        }
    }

    fn error(self) -> Error {
        match self {
            Failure::Typst(message) => Error::Program { program: "Typst".into(), message },
            Failure::NotSet => Error::NotFound(tr!("core-export-preview-document")),
            Failure::Other(message) => Error::invalid(message),
        }
    }
}

// ---------------------------------------------------------------------------
// The child
// ---------------------------------------------------------------------------

/// The task of the child: the job at `input`, and each ask answered as it
/// comes, until it is asked no more, or is killed. What it set is kept in
/// place of what it set before.
pub(crate) fn serve_task(input: &Path) -> std::result::Result<Vec<u8>, String> {
    let job: Job =
        serde_json::from_slice(&std::fs::read(input).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;
    crate::i18n::set_language(&job.language);
    // The fonts are found while the parent readies the document, before it
    // is first asked to set it.
    typeset::families();
    let mut document: Option<PagedDocument> = None;
    for (number, line) in isolated::asked() {
        let answer = match serde_json::from_str::<Ask>(&line) {
            Ok(ask) => {
                let work = std::panic::AssertUnwindSafe(|| answer(&job, &mut document, ask, number));
                std::panic::catch_unwind(work).unwrap_or_else(|_| {
                    document = None;
                    Answer::Failed(Failure::Other("the typesetting ended in a panic".into()))
                })
            }
            Err(e) => Answer::Failed(Failure::Other(e.to_string())),
        };
        tell(number, &answer);
    }
    Ok(Vec::new())
}

fn tell(number: u64, answer: &Answer) {
    if let Ok(line) = serde_json::to_string(answer) {
        isolated::tell_to(number, &line);
    }
}

/// Does what was asked, telling each page as it is drawn; what is told last.
fn answer(job: &Job, document: &mut Option<PagedDocument>, ask: Ask, number: u64) -> Answer {
    let written = |name: String, bytes: &[u8]| -> std::result::Result<PathBuf, Failure> {
        let path = job.place.join(name);
        std::fs::write(&path, bytes).map_err(|e| Failure::Other(format!("{}: {e}", path.display())))?;
        Ok(path)
    };
    match ask {
        Ask::Set { margins } => {
            // What was set before is let go first, so that two are never held.
            *document = None;
            let set = match typeset::set(&job.dir, "document.typ") {
                Ok(set) => set,
                Err(e) => return Answer::Failed(Failure::of(e)),
            };
            let count = set.document.pages().len();
            let file = match margins {
                Some(margins) => {
                    let found = Where {
                        places: typeset::places(&set.document),
                        spots: typeset::spots(&set.document, &margins.typeset()),
                    };
                    let bytes = serde_json::to_vec(&found).unwrap_or_default();
                    match written("where.json".into(), &bytes) {
                        Ok(path) => Some(path),
                        Err(failure) => return Answer::Failed(failure),
                    }
                }
                None => None,
            };
            *document = Some(set.document);
            Answer::Set { count, warnings: set.warnings, file }
        }
        Ask::Pages(wanted) => {
            let Some(document) = document.as_ref() else { return Answer::Failed(Failure::NotSet) };
            // Drawn as the core draws them where it sets the document itself.
            let (count, pages) = super::pages_from(document, &wanted);
            for page in pages {
                let n = page.number;
                let texts = serde_json::to_vec(&page.texts).unwrap_or_default();
                let told = written(format!("page-{n}.svg"), page.svg.as_bytes())
                    .and_then(|svg| Ok((svg, written(format!("page-{n}.json"), &texts)?)));
                match told {
                    Ok((svg, texts)) => tell(number, &Answer::Page { number: n, svg, texts }),
                    Err(failure) => return Answer::Failed(failure),
                }
            }
            Answer::Done { count }
        }
        Ask::Print { from, to } => {
            let Some(document) = document.as_ref() else { return Answer::Failed(Failure::NotSet) };
            let count = document.pages().len();
            for page in from.max(1)..=to.min(count as u32) {
                let Some(svg) = typeset::svg(document, page as usize) else { continue };
                match written(format!("print-{page}.svg"), svg.as_bytes()) {
                    Ok(svg) => tell(number, &Answer::Printed { number: page, svg }),
                    Err(failure) => return Answer::Failed(failure),
                }
            }
            Answer::Done { count }
        }
    }
}

// ---------------------------------------------------------------------------
// The parent
// ---------------------------------------------------------------------------

/// A document served: the child, and the folder it writes in.
struct Served {
    /// The work folder of the pane.
    dir: PathBuf,
    serving: Serving,
    /// Gone with the child, after it: declared after it, so dropped after it.
    place: tempfile::TempDir,
    last_asked: Mutex<Instant>,
    /// How many ask of it now: one asked of is not let go as idle.
    asking: AtomicUsize,
    /// One ask at a time, so that the time of each is its own: a page
    /// asked while the document is set waits for the setting, and is
    /// drawn from what was set.
    turn: Mutex<()>,
    /// Whether the child holds a document it set: one just started, or
    /// whose last setting failed, sets before it draws.
    holds: AtomicBool,
}

static SERVED: Mutex<Vec<Arc<Served>>> = Mutex::new(Vec::new());

fn lock<T>(mutex: &Mutex<T>) -> MutexGuard<'_, T> {
    mutex.lock().unwrap_or_else(PoisonError::into_inner)
}

/// What the child set: how many pages, what Typst said, and the places and
/// spots where the margins were given.
pub struct Setting {
    pub count: usize,
    pub warnings: Vec<String>,
    pub places: Vec<Place>,
    pub spots: Vec<Spot>,
}

/// Starts the child of the pane in `dir`, where none serves it, so that it
/// finds its fonts while the document is readied. Nothing is asked of it.
pub fn begin(dir: &Path) {
    if let Some(Ok(served)) = served(dir) {
        done_asking(&served);
    }
}

/// Sets the document of the pane in `dir` in the child that serves it,
/// started where none does. Nothing where no child can be started: the
/// caller sets it itself.
pub fn set(dir: &Path, margins: Option<Margins>) -> Option<Result<Setting>> {
    let served = match served(dir)? {
        Ok(served) => served,
        Err(e) => return Some(Err(e)),
    };
    let set = {
        let _turn = lock(&served.turn);
        set_in(&served, margins)
    };
    done_asking(&served);
    Some(set)
}

/// Pages of the document of the pane in `dir`, those it has, drawn by the
/// child, which sets the document first where it holds none. How many
/// pages there are, and the pages. Nothing where no child can be started.
pub fn pages(dir: &Path, wanted: &[u32]) -> Option<Result<(usize, Vec<Page>)>> {
    let served = match served(dir)? {
        Ok(served) => served,
        Err(e) => return Some(Err(e)),
    };
    let drawn = {
        let _turn = lock(&served.turn);
        held_or_set(&served).and_then(|()| {
            let mut pages = Vec::with_capacity(wanted.len());
            let mut taken = Ok(());
            let count = ask(&served, &Ask::Pages(wanted.to_vec()), DRAWING_TIME, &mut |answer| {
                if let Answer::Page { number, svg, texts } = answer {
                    match taken_page(number, &svg, &texts) {
                        Ok(page) => pages.push(page),
                        Err(e) => taken = Err(e),
                    }
                }
            })?;
            taken.map(|()| (count, pages))
        })
    };
    done_asking(&served);
    Some(drawn)
}

/// The pages `from` to `to` of the document of the pane in `dir`, for
/// printing, drawn by the child. Nothing where no child can be started.
pub fn print(dir: &Path, from: u32, to: u32) -> Option<Result<Vec<PrintPage>>> {
    let served = match served(dir)? {
        Ok(served) => served,
        Err(e) => return Some(Err(e)),
    };
    let drawn = {
        let _turn = lock(&served.turn);
        held_or_set(&served).and_then(|()| {
            let mut pages = Vec::new();
            let mut taken = Ok(());
            let pages_asked = to.saturating_sub(from).saturating_add(1).min(10_000);
            // The time of the drawing of so many: a page is drawn in milliseconds.
            let time = DRAWING_TIME + Duration::from_millis(250).saturating_mul(pages_asked);
            ask(&served, &Ask::Print { from, to }, time, &mut |answer| {
                if let Answer::Printed { number, svg } = answer {
                    match taken_text(&svg) {
                        Ok(svg) => pages.push(PrintPage { number, svg }),
                        Err(e) => taken = Err(e),
                    }
                }
            })?;
            taken.map(|()| pages)
        })
    };
    done_asking(&served);
    Some(drawn)
}

/// Ends the child of the pane in `dir`, where one serves it: the pane closed.
pub fn end(dir: &Path) {
    let gone: Vec<Arc<Served>> = {
        let mut all = lock(&SERVED);
        let (gone, kept) = std::mem::take(&mut *all).into_iter().partition(|served| served.dir == dir);
        *all = kept;
        gone
    };
    for served in &gone {
        served.serving.end();
    }
}

/// Ends every document served: for the application's close. A child left
/// would end with the application in any case (`isolated::end_with_parent`),
/// but not at once on every system.
pub fn end_all() {
    let gone = std::mem::take(&mut *lock(&SERVED));
    for served in &gone {
        served.serving.end();
    }
}

/// Sets the document in the child, the turn held.
fn set_in(served: &Served, margins: Option<Margins>) -> Result<Setting> {
    served.holds.store(false, Ordering::Relaxed);
    let mut setting = None;
    ask(served, &Ask::Set { margins }, SETTING_TIME, &mut |answer| {
        if let Answer::Set { count, warnings, file } = answer {
            setting = Some((count, warnings, file));
        }
    })?;
    let Some((count, warnings, file)) = setting else {
        return Err(Error::invalid(tr!("core-export-typeset-ended", message = "no answer")));
    };
    served.holds.store(true, Ordering::Relaxed);
    let found = match file {
        Some(file) => {
            let bytes = std::fs::read(&file).context(|| tr!("io-reading", path = &file));
            let _ = std::fs::remove_file(&file);
            serde_json::from_slice::<Where>(&bytes?)?
        }
        None => Where::default(),
    };
    Ok(Setting { count, warnings, places: found.places, spots: found.spots })
}

/// Sets the document where the child holds none, the turn held.
fn held_or_set(served: &Served) -> Result<()> {
    if served.holds.load(Ordering::Relaxed) {
        return Ok(());
    }
    if !served.dir.join("document.typ").is_file() {
        return Err(Error::NotFound(tr!("core-export-preview-document")));
    }
    set_in(served, None).map(|_| ())
}

/// Asks the child, handing each answer to `told` but the last, which says
/// how many pages the document has. A child that ends without its answer
/// is let go, and why is the error.
fn ask(served: &Served, asked: &Ask, time: Duration, told: &mut dyn FnMut(Answer)) -> Result<usize> {
    let line = serde_json::to_string(asked).map_err(|e| Error::invalid(e.to_string()))?;
    let mut last: Option<std::result::Result<usize, Failure>> = None;
    let mut each = |line: &str| match serde_json::from_str::<Answer>(line) {
        Ok(Answer::Done { count }) => {
            last = Some(Ok(count));
            true
        }
        Ok(Answer::Failed(failure)) => {
            last = Some(Err(failure));
            true
        }
        Ok(answer @ Answer::Set { .. }) => {
            let count = if let Answer::Set { count, .. } = &answer { *count } else { 0 };
            told(answer);
            last = Some(Ok(count));
            true
        }
        Ok(answer) => {
            told(answer);
            false
        }
        Err(e) => {
            tracing::debug!(line, %e, "the typesetting process told this");
            false
        }
    };
    // Typst cannot be stopped while it sets: the one who asked looks before
    // and after, and the child is kept for what is asked next.
    let asked = served.serving.ask(&line, time, &mut each, &AtomicBool::new(false));
    if let Err(ended) = asked {
        tracing::warn!(%ended, dir = %served.dir.display(), "the typesetting process was given up");
        served.holds.store(false, Ordering::Relaxed);
        lock(&SERVED).retain(|other| !std::ptr::eq(other.as_ref(), served));
        return Err(ended_error(&ended));
    }
    match last {
        Some(Ok(count)) => Ok(count),
        Some(Err(failure)) => Err(failure.error()),
        None => Err(Error::invalid(tr!("core-export-typeset-ended", message = "no answer"))),
    }
}

/// What the one who asked is told of a child that ended without its answer.
fn ended_error(ended: &Ended) -> Error {
    match ended {
        Ended::Stopped => {
            Error::Refused { kind: super::tools::STOPPED, message: tr!("program-stopped", program = "Typst") }
        }
        Ended::Time => Error::invalid(tr!("core-export-typeset-time")),
        Ended::Memory => Error::invalid(tr!("core-export-typeset-memory")),
        Ended::Failed(why) | Ended::NotStarted(why) => {
            Error::invalid(tr!("core-export-typeset-ended", message = why.as_str()))
        }
    }
}

/// A page the child wrote, read and its files removed.
fn taken_page(number: u32, svg: &Path, texts: &Path) -> Result<Page> {
    let svg = taken_text(svg)?;
    let bytes = std::fs::read(texts).context(|| tr!("io-reading", path = texts));
    let _ = std::fs::remove_file(texts);
    let texts: Vec<TextRun> = serde_json::from_slice(&bytes?)?;
    Ok(Page { number, svg, texts })
}

/// A file the child wrote, read as text and removed.
fn taken_text(path: &Path) -> Result<String> {
    let text = std::fs::read_to_string(path).context(|| tr!("io-reading", path = path));
    let _ = std::fs::remove_file(path);
    text
}

/// Counts an ask as done, and the document as asked of now: asked of
/// before it is no longer counted as asked of, lest it be let go as idle
/// between.
fn done_asking(served: &Served) {
    *lock(&served.last_asked) = Instant::now();
    served.asking.fetch_sub(1, Ordering::Relaxed);
}

/// The document served for `dir`, counted as asked of; or a child started
/// for it, in the place of the one asked of longest ago where more would
/// be served than [`MOST_OPEN`]. Nothing where no child can be started:
/// no program is set for children, or it would not start, which is said
/// once.
fn served(dir: &Path) -> Option<Result<Arc<Served>>> {
    let mut let_go = Vec::new();
    let found = {
        let mut all = lock(&SERVED);
        if let Some(at) = all.iter().position(|served| served.dir == dir) {
            // Where its place was taken from under it, it can write nothing.
            if all[at].serving.alive() && all[at].place.path().is_dir() {
                all[at].asking.fetch_add(1, Ordering::Relaxed);
                return Some(Ok(all[at].clone()));
            }
            let_go.push(all.remove(at));
        }
        let started = match start(dir)? {
            Ok(served) => served,
            Err(e) => return Some(Err(e)),
        };
        while all.len() >= MOST_OPEN {
            let oldest = (0..all.len()).min_by_key(|&at| *lock(&all[at].last_asked)).unwrap_or(0);
            // Its child ends once no one asks of it any longer.
            let_go.push(all.remove(oldest));
        }
        all.push(started.clone());
        started
    };
    // Ended outside the lock, so that others are not kept waiting for it.
    for served in &let_go {
        served.serving.end();
    }
    drop(let_go);
    looked_at_while_served();
    Some(Ok(found))
}

/// A child started to serve the document in `dir`, counted as asked of.
/// Nothing where none can be started.
fn start(dir: &Path) -> Option<Result<Arc<Served>>> {
    if !isolated::program_is_set() {
        return None;
    }
    left_before(dir);
    let place = match tempfile::Builder::new()
        .prefix("typeset-")
        .tempdir_in(dir)
        .context(|| tr!("io-creating-directory-in", path = dir))
    {
        Ok(place) => place,
        Err(e) => return Some(Err(e)),
    };
    let job = Job { dir: dir.to_owned(), place: place.path().to_owned(), language: crate::i18n::language().to_owned() };
    let input = place.path().join("job.json");
    let written = serde_json::to_vec(&job)
        .map_err(|e| Error::invalid(e.to_string()))
        .and_then(|bytes| std::fs::write(&input, bytes).context(|| tr!("io-writing", path = &input)));
    if let Err(e) = written {
        return Some(Err(e));
    }
    // Half of what the machine has free, and half a gigabyte at the least,
    // as a file read in a child is given.
    let memory = isolated::available_memory().map_or(4 << 30, |free| free / 2).max(512 << 20);
    match isolated::start_serving(TASK, &input, memory)? {
        Ok(serving) => Some(Ok(Arc::new(Served {
            dir: dir.to_owned(),
            serving,
            place,
            last_asked: Mutex::new(Instant::now()),
            asking: AtomicUsize::new(1),
            turn: Mutex::new(()),
            holds: AtomicBool::new(false),
        }))),
        Err(ended) => {
            static SAID: Once = Once::new();
            SAID.call_once(|| {
                tracing::warn!(%ended, "the typesetting process could not be started: the document is set here");
            });
            None
        }
    }
}

/// Lets go, once in the life of the application for each work folder, of
/// the places that children of a run that was killed left there.
fn left_before(dir: &Path) {
    static CLEARED: Mutex<Vec<PathBuf>> = Mutex::new(Vec::new());
    let mut cleared = lock(&CLEARED);
    if cleared.iter().any(|done| done == dir) {
        return;
    }
    cleared.push(dir.to_owned());
    for entry in std::fs::read_dir(dir).into_iter().flatten().flatten() {
        if entry.file_name().to_string_lossy().starts_with("typeset-") && entry.path().is_dir() {
            let _ = std::fs::remove_dir_all(entry.path());
        }
    }
}

/// Starts, once, what lets go of the documents served that are idle.
fn looked_at_while_served() {
    static STARTED: Once = Once::new();
    STARTED.call_once(|| {
        let looking = std::thread::Builder::new().name("typeset-served".into()).spawn(|| {
            loop {
                std::thread::sleep(LOOKED_AT);
                let_go_idle(IDLE);
            }
        });
        if let Err(e) = looking {
            tracing::warn!(%e, "the documents typeset cannot be let go when idle: they end with their panes");
        }
    });
}

/// Lets go of the documents served that nothing has been asked of for
/// `idle`, and of those whose child has ended. Done every few seconds; for
/// the tests, at once.
#[doc(hidden)]
pub fn let_go_idle(idle: Duration) {
    let gone: Vec<Arc<Served>> = {
        let mut all = lock(&SERVED);
        let (gone, kept) = std::mem::take(&mut *all).into_iter().partition(|served: &Arc<Served>| {
            served.asking.load(Ordering::Relaxed) == 0
                && (lock(&served.last_asked).elapsed() >= idle || !served.serving.alive())
        });
        *all = kept;
        gone
    };
    for served in &gone {
        served.serving.end();
    }
}

/// The number of the process that serves the document in `dir`, where one
/// does: for the tests.
#[doc(hidden)]
pub fn serving(dir: &Path) -> Option<u32> {
    lock(&SERVED).iter().find(|served| served.dir == dir && served.serving.alive()).map(|served| served.serving.pid())
}

/// The numbers of the processes that serve documents now: for the tests.
#[doc(hidden)]
pub fn all_serving() -> Vec<u32> {
    lock(&SERVED).iter().filter(|served| served.serving.alive()).map(|served| served.serving.pid()).collect()
}
