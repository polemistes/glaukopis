pub mod clipboard;
pub mod documents;
pub mod files;
pub mod found;
pub mod history;
pub mod import;
pub mod languages;
pub mod library;
pub mod notices;
pub mod ocr;
pub mod pictures;
pub mod projectfile;
pub mod projects;
pub mod readable;
pub mod reading;
pub mod sharing;
pub mod sources;
pub mod spelling;
pub mod system;
pub mod tables;
pub mod templates;
pub mod viewer;
pub mod words;
pub mod work;

use std::sync::atomic::{AtomicBool, Ordering};

use glaukopis_core::tr;

use crate::error::{CommandError, CommandResult};

/// The work of one of a command's worker threads, run so that a panic in it
/// is caught there: the other workers are told to stop, as by the user, since
/// what they would find is not to be given, and what the panic said is given
/// back for [`all_answered`]. Before, the panic was raised again in the
/// command, whose answer is sent only when it returns: the page waited for
/// ever, its bar standing at the same count. The panic hook of the log still
/// writes where it happened.
pub fn guarded(stop: &AtomicBool, work: impl FnOnce()) -> Result<(), String> {
    std::panic::catch_unwind(std::panic::AssertUnwindSafe(work)).map_err(|payload| {
        stop.store(true, Ordering::Relaxed);
        panic_message(payload.as_ref())
    })
}

/// What a panic said: the text it was given, where it was given one.
pub fn panic_message(payload: &(dyn std::any::Any + Send)) -> String {
    payload
        .downcast_ref::<&str>()
        .map(|said| (*said).to_owned())
        .or_else(|| payload.downcast_ref::<String>().cloned())
        .unwrap_or_else(|| "a panic that said nothing".to_owned())
}

/// The command's answer once its workers have ended: an error, logged with
/// what the first panic said, when any of them panicked.
pub fn all_answered(ended: impl IntoIterator<Item = std::thread::Result<Result<(), String>>>) -> CommandResult<()> {
    let mut first = None;
    for worker in ended {
        if let Err(said) = worker.unwrap_or_else(|payload| Err(panic_message(payload.as_ref()))) {
            first.get_or_insert(said);
        }
    }
    match first {
        None => Ok(()),
        Some(said) => {
            tracing::error!(panic = said, "a worker of a command panicked; the command fails");
            Err(CommandError { kind: "panic", message: tr!("core-worker-panicked", message = said) })
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_worker_that_panics_fails_the_command_and_stops_the_others() {
        let stop = AtomicBool::new(false);
        let ended = std::thread::scope(|s| {
            let calm = s.spawn(|| guarded(&stop, || {}));
            let wild = s.spawn(|| guarded(&stop, || panic!("the reader lost itself in page {}", 7)));
            let blunt = s.spawn(|| guarded(&stop, || std::panic::panic_any(42_u8)));
            [calm.join(), wild.join(), blunt.join()]
        });
        assert!(stop.load(Ordering::Relaxed));
        let error = all_answered(ended).unwrap_err();
        assert_eq!(error.kind, "panic");
        assert!(error.message.contains("the reader lost itself in page 7"), "{}", error.message);
    }

    #[test]
    fn workers_that_end_well_answer_well() {
        let stop = AtomicBool::new(false);
        let ended = std::thread::scope(|s| {
            let workers: Vec<_> = (0..3).map(|_| s.spawn(|| guarded(&stop, || {}))).collect();
            workers.into_iter().map(|w| w.join()).collect::<Vec<_>>()
        });
        assert!(!stop.load(Ordering::Relaxed));
        assert!(all_answered(ended).is_ok());
    }
}
