//! The work that goes on and can be stopped: taking files in, finding out
//! what they are, reading PDFs and pictures, reading documents, making a
//! document into a file. The page asks for such work with a ticket of its
//! own making, by which it stops the work and knows what it is told of it.
//!
//! One registry holds all of it: a piece of work is in it from when it
//! begins until its [`Work`] is dropped, however the command ends, by an
//! answer, an error, an early return or a panic. Before, five commands kept
//! five registries, three of them by hand, where a panic left the ticket in
//! the registry for the life of the process.

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex, MutexGuard};

use serde::Serialize;
use tauri::{AppHandle, Emitter};

/// The events by which the page is told how far the work has come.
pub const FILES_PROGRESS: &str = "files-progress";
pub const PDFS_PROGRESS: &str = "pdfs-progress";
pub const OCR_PROGRESS: &str = "ocr-progress";

/// The work that goes on, by the tickets it was asked for with, each with
/// what stops it.
static GOING: Mutex<Vec<(String, Arc<AtomicBool>)>> = Mutex::new(Vec::new());

fn going() -> MutexGuard<'static, Vec<(String, Arc<AtomicBool>)>> {
    GOING.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
}

/// A piece of work that goes on: what stops it, and the ticket it is known
/// by, if it was asked for with one, until it is dropped.
pub struct Work {
    ticket: Option<String>,
    pub stop: Arc<AtomicBool>,
}

impl Work {
    pub fn begin(ticket: Option<String>) -> Work {
        let stop = Arc::new(AtomicBool::new(false));
        if let Some(ticket) = &ticket {
            going().push((ticket.clone(), stop.clone()));
        }
        Work { ticket, stop }
    }

    /// Whether it was asked to stop.
    pub fn stopped(&self) -> bool {
        self.stop.load(Ordering::Relaxed)
    }

    /// Tells the page by `event` how far the work has come, with its
    /// ticket; nothing, for work asked for without one.
    pub fn tell<T: Serialize + Clone>(&self, app: &AppHandle, event: &str, told: T) {
        if let Some(ticket) = &self.ticket {
            let _ = app.emit(event, Told { ticket: ticket.clone(), told });
        }
    }

    /// What tells the page how many things are done, of how many, and the
    /// one at hand.
    pub fn counter<'a>(&'a self, app: &'a AppHandle, event: &'a str) -> impl FnMut(usize, usize, &str) + 'a {
        move |done, total, name| self.tell(app, event, Count { done, total, name: name.to_owned() })
    }
}

impl Drop for Work {
    fn drop(&mut self) {
        if let Some(ticket) = &self.ticket {
            let mut going = going();
            // The first of this ticket only: a ticket given twice stays for the other.
            if let Some(at) = going.iter().position(|(t, stop)| t == ticket && Arc::ptr_eq(stop, &self.stop)) {
                going.remove(at);
            }
        }
    }
}

/// Stops the work with this ticket, whichever it is.
pub fn stop(ticket: &str) {
    for (_, stop) in going().iter().filter(|(t, _)| t == ticket) {
        stop.store(true, Ordering::Relaxed);
    }
}

/// What the page is told of work with a ticket: the ticket, and what is told.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Told<T> {
    pub ticket: String,
    #[serde(flatten)]
    pub told: T,
}

/// How far work on many things has come: how many are done, of how many,
/// and the one at hand.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Count {
    pub done: usize,
    pub total: usize,
    pub name: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn registered(ticket: &str) -> usize {
        going().iter().filter(|(t, _)| t == ticket).count()
    }

    #[test]
    fn work_is_stopped_by_its_ticket_and_forgotten_when_it_ends() {
        let work = Work::begin(Some("a ticket of the test".into()));
        let other = Work::begin(Some("another ticket of the test".into()));
        assert_eq!(registered("a ticket of the test"), 1);
        stop("a ticket of the test");
        assert!(work.stopped() && !other.stopped());
        drop(work);
        assert_eq!(registered("a ticket of the test"), 0);
        assert_eq!(registered("another ticket of the test"), 1);
    }

    #[test]
    fn work_that_panics_is_forgotten_all_the_same() {
        let ended = std::panic::catch_unwind(|| {
            let _work = Work::begin(Some("a ticket of the test that panics".into()));
            panic!("the work lost itself");
        });
        assert!(ended.is_err());
        assert_eq!(registered("a ticket of the test that panics"), 0);
    }

    #[test]
    fn what_is_told_carries_the_ticket_beside_it() {
        let told = Told { ticket: "t".into(), told: Count { done: 1, total: 3, name: "a.pdf".into() } };
        assert_eq!(
            serde_json::to_value(told).unwrap(),
            serde_json::json!({"ticket": "t", "done": 1, "total": 3, "name": "a.pdf"})
        );
    }
}
