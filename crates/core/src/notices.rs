//! What the core has to tell the one who uses the application without
//! having been asked: that a file of its own could not be read and was set
//! aside, say (ADR 0052). Such a thing happens while a store opens, often
//! before the page is there to hear it, so it is kept here until the page
//! takes it, and the application is told that there is something to take.
//!
//! What is told is put into words when it is taken, in the language the
//! interface has then: at the start the core does not yet know it.

use std::sync::{Mutex, OnceLock, PoisonError};

type Words = Box<dyn Fn() -> String + Send>;

/// The most that are kept for a page that never takes them, as the tools
/// of the command line do not; those told after are counted in the log.
const MOST: usize = 100;

static WAITING: Mutex<Vec<Words>> = Mutex::new(Vec::new());
static TOLD: OnceLock<Box<dyn Fn() + Send + Sync>> = OnceLock::new();

/// Tells something: `words` give it in the language of the interface. It
/// should be said in the log as well, where it is told, with its cause.
pub fn tell(words: impl Fn() -> String + Send + 'static) {
    {
        let mut waiting = WAITING.lock().unwrap_or_else(PoisonError::into_inner);
        if waiting.len() >= MOST {
            tracing::warn!("a notice is not kept for the page: too many are waiting");
            return;
        }
        waiting.push(Box::new(words));
    }
    if let Some(told) = TOLD.get() {
        told();
    }
}

/// What has been told and not yet taken, in words, the oldest first.
pub fn take() -> Vec<String> {
    let waiting = std::mem::take(&mut *WAITING.lock().unwrap_or_else(PoisonError::into_inner));
    waiting.iter().map(|words| words()).collect()
}

/// What the application does when something is told: lets the page know
/// that there is something to take. Set once; a second is not taken.
pub fn on_told(told: impl Fn() + Send + Sync + 'static) {
    if TOLD.set(Box::new(told)).is_err() {
        tracing::warn!("what is done when something is told was set already");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn what_is_told_waits_until_it_is_taken() {
        tell(|| "one notice of the test".to_owned());
        tell(|| "another notice of the test".to_owned());
        // Other tests of the crate tell things too, at the same time.
        let taken = take();
        let first = taken.iter().position(|t| t == "one notice of the test").unwrap();
        let second = taken.iter().position(|t| t == "another notice of the test").unwrap();
        assert!(first < second);
        assert!(!take().iter().any(|t| t.ends_with("notice of the test")));
    }
}
