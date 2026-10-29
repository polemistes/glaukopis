//! The pages of a file shown in a view, drawn by a child that keeps the
//! file open (ADR 0072): the file is read and taken apart once, when its
//! first page is asked for, and not again for every few pages, which for a
//! book cost half a second before each.
//!
//! A child serves one file ([`Task::Serve`](super::child::Task::Serve)),
//! known by the file as it is (`pages_cache::key_of`), and draws the pages
//! asked of it several at a time, those asked from several threads at once
//! as well, each written as a file for the cache to take. It is bounded in
//! memory as every child is, each request in its time; it is ended when
//! nothing has been asked of it for [`IDLE`], when the one who asked stops
//! and no other waits for it, and when more than [`MOST_OPEN`] files are
//! served, the one asked of longest ago first. Whatever ends it, the pages
//! asked of it are drawn otherwise by the one who asked (`pages_at`).

use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::sync::{Arc, Mutex, MutexGuard, Once, PoisonError};
use std::time::{Duration, Instant};

use super::child::{self, Answer, Request};
use super::{layer, pages_cache, stopped};
use crate::error::{Error, IoContext, Result};
use crate::export::tools::Tool;
use crate::isolated::{self, Serving};
use crate::tr;

/// The most files served at once.
pub const MOST_OPEN: usize = 2;

/// How long a file served is kept open with nothing asked of it.
pub const IDLE: Duration = Duration::from_secs(90);

/// How often the files served are looked at, to let go of those idle.
const LOOKED_AT: Duration = Duration::from_secs(5);

/// A file served: the child, and the folder it writes its pages in.
struct Served {
    /// The file as it is (`pages_cache::key_of`): a file changed is served anew.
    key: String,
    /// The folder of the application's its place is in: one asked to draw
    /// elsewhere, as the tests do, is another.
    work: PathBuf,
    serving: Serving,
    /// Gone with the child, after it: declared after it, so dropped after it.
    place: tempfile::TempDir,
    last_asked: Mutex<Instant>,
    /// How many ask of it now: one asked of is not let go as idle.
    asking: AtomicUsize,
}

static SERVED: Mutex<Vec<Arc<Served>>> = Mutex::new(Vec::new());

fn lock<T>(mutex: &Mutex<T>) -> MutexGuard<'_, T> {
    mutex.lock().unwrap_or_else(PoisonError::into_inner)
}

/// A page drawn by a child that serves its file, counted from nought: the
/// PNG written for it, or why it could not be drawn.
pub type PageFile = (usize, std::result::Result<PathBuf, String>);

/// Pages of the PDF at `path`, of `size`, counted from nought, those it
/// has, each drawn `width` dots wide in colour by the child that serves the
/// file, which is started where none does: for each, the PNG file it was
/// written to, in a folder of `work`, which the caller takes; or why it
/// could not be drawn. Nothing where no program is set for children, or
/// the file cannot be told by its key: the caller draws them otherwise. A
/// child that ends without its answer, of itself or killed, is let go, and
/// why is the error; as it is when the file cannot be opened.
pub(super) fn draw(
    path: &Path,
    size: u64,
    pdftoppm: Option<&Tool>,
    work: &Path,
    pages: &[usize],
    width: u32,
    stop: &AtomicBool,
) -> Option<Result<Vec<PageFile>>> {
    if !isolated::program_is_set() {
        return None;
    }
    let key = pages_cache::key_of(path)?;
    if stop.load(Ordering::Relaxed) {
        return Some(Err(stopped()));
    }
    let served = match served(&key, path, size, pdftoppm, work)? {
        Ok(served) => served,
        Err(e) => return Some(Err(e)),
    };
    let answered = ask(&served, path, size, pages, width, stop);
    // Asked of now, before it is no longer counted as asked of: lest it be
    // let go as idle between.
    *lock(&served.last_asked) = Instant::now();
    served.asking.fetch_sub(1, Ordering::Relaxed);
    if answered.is_err() && !served.serving.alive() {
        lock(&SERVED).retain(|other| !Arc::ptr_eq(other, &served));
    }
    Some(answered)
}

/// The file served by `key`, counted as asked of; or one started for it,
/// in the place of the one asked of longest ago where more would be served
/// than [`MOST_OPEN`]. Nothing where no program is set.
fn served(key: &str, path: &Path, size: u64, pdftoppm: Option<&Tool>, work: &Path) -> Option<Result<Arc<Served>>> {
    let mut let_go = Vec::new();
    let found = {
        let mut all = lock(&SERVED);
        if let Some(at) = all.iter().position(|served| served.key == key && served.work == work) {
            // Where its place was taken from under it, it can write no page.
            if all[at].serving.alive() && all[at].place.path().is_dir() {
                all[at].asking.fetch_add(1, Ordering::Relaxed);
                return Some(Ok(all[at].clone()));
            }
            let_go.push(all.remove(at));
        }
        let started = start(key, path, size, pdftoppm, work);
        if let Some(Ok(served)) = &started {
            while all.len() >= MOST_OPEN {
                let oldest = (0..all.len()).min_by_key(|&at| *lock(&all[at].last_asked)).unwrap_or(0);
                // Its child ends once no one asks of it any longer.
                let_go.push(all.remove(oldest));
            }
            all.push(served.clone());
        }
        started
    };
    // Ended outside the lock, so that others are not kept waiting for it.
    drop(let_go);
    looked_at_while_served();
    found
}

/// A child started to serve the file at `path`, of `size`, writing its pages
/// in a folder of `work`, counted as asked of.
fn start(key: &str, path: &Path, size: u64, pdftoppm: Option<&Tool>, work: &Path) -> Option<Result<Arc<Served>>> {
    let place = std::fs::create_dir_all(work).context(|| tr!("io-creating", path = work)).and_then(|()| {
        tempfile::Builder::new()
            .prefix("served-")
            .tempdir_in(work)
            .context(|| tr!("io-creating-directory-in", path = work))
    });
    let place = match place {
        Ok(place) => place,
        Err(e) => return Some(Err(e)),
    };
    let serving = match child::start_serving(path, size, pdftoppm, place.path())? {
        Ok(serving) => serving,
        Err(e) => return Some(Err(e)),
    };
    Some(Ok(Arc::new(Served {
        key: key.to_owned(),
        work: work.to_owned(),
        serving,
        place,
        last_asked: Mutex::new(Instant::now()),
        asking: AtomicUsize::new(1),
    })))
}

/// Asks the child of a file served for pages, and gathers what it tells of
/// them, within the time the drawing of so many may take: the time to open
/// the file, and twenty seconds a page, many times what a page takes.
fn ask(
    served: &Served,
    path: &Path,
    size: u64,
    pages: &[usize],
    width: u32,
    stop: &AtomicBool,
) -> Result<Vec<PageFile>> {
    let line =
        serde_json::to_string(&Request { pages: pages.to_vec(), width }).map_err(|e| Error::invalid(e.to_string()))?;
    let deadline = layer::patience(usize::try_from(size).unwrap_or(usize::MAX))
        + Duration::from_secs(20).saturating_mul(u32::try_from(pages.len()).unwrap_or(u32::MAX));
    let mut drawn = Vec::with_capacity(pages.len());
    let mut unopened = None;
    let asked = {
        let mut told = |line: &str| match serde_json::from_str::<Answer>(line) {
            Ok(Answer::Drawn { page, file }) => {
                drawn.push((page, Ok(file)));
                false
            }
            Ok(Answer::Failed { page, why }) => {
                drawn.push((page, Err(why)));
                false
            }
            Ok(Answer::Done) => true,
            Ok(Answer::Unopened(failure)) => {
                unopened = Some(failure);
                true
            }
            Err(e) => {
                tracing::debug!(line, %e, "the served process told this");
                false
            }
        };
        served.serving.ask(&line, deadline, &mut told, stop)
    };
    if let Err(ended) = asked {
        if ended != isolated::Ended::Stopped {
            tracing::warn!(%ended, path = %path.display(), "the file served was given up");
        }
        return Err(child::ended_error(&ended, path));
    }
    if let Some(failure) = unopened {
        // It can draw nothing of the file.
        served.serving.end();
        return Err(failure.error());
    }
    Ok(drawn)
}

/// Starts, once, what lets go of the files served that are idle.
fn looked_at_while_served() {
    static STARTED: Once = Once::new();
    STARTED.call_once(|| {
        let looking = std::thread::Builder::new().name("served".into()).spawn(|| {
            loop {
                std::thread::sleep(LOOKED_AT);
                let_go_idle(IDLE);
            }
        });
        if let Err(e) = looking {
            tracing::warn!(%e, "the files served cannot be let go when idle: they are ended with the application");
        }
    });
}

/// Lets go of the files served that nothing has been asked of for `idle`,
/// and of those whose child has ended. Done every few seconds; for the
/// tests, at once.
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

/// Ends every file served: for the application's close. A child left
/// would end with the application in any case (`isolated::end_with_parent`),
/// but not at once on every system.
pub fn end_all() {
    let gone = std::mem::take(&mut *lock(&SERVED));
    for served in &gone {
        served.serving.end();
    }
}

/// The number of the process that serves the file at `path` as it is,
/// where one does: for the tests.
#[doc(hidden)]
pub fn serving(path: &Path) -> Option<u32> {
    let key = pages_cache::key_of(path)?;
    lock(&SERVED).iter().find(|served| served.key == key && served.serving.alive()).map(|served| served.serving.pid())
}

/// The numbers of the processes that serve files now: for the tests.
#[doc(hidden)]
pub fn all_serving() -> Vec<u32> {
    lock(&SERVED).iter().filter(|served| served.serving.alive()).map(|served| served.serving.pid()).collect()
}
