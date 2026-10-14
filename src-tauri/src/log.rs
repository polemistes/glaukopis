//! What the application tells of itself, kept in a file of each run as well
//! as on the terminal: in the folder `logs` of the data directory, the last
//! [`KEEP`] runs. Started from the desktop, a program has no terminal, and
//! what it said was lost; when its window went away, there was nothing to
//! tell why.
//!
//! The file has what the core and the commands say (at `info` and above, or
//! as `GLAUKOPIS_LOG` asks), a panic with where it happened, what becomes of
//! the window (asked to close, taken off the screen, destroyed), the end of
//! the page's own process with why, and the errors of the page.

use std::fs::{self, File};
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use tracing_subscriber::fmt::writer::MakeWriterExt;

/// The folder of the logs, in the data directory.
pub const DIR: &str = "logs";
/// How many runs are kept.
pub const KEEP: usize = 10;

/// Begins to log: to the terminal, and to a new file in `logs` under `root`,
/// where that can be made. The older files but the last few are deleted.
/// What happens when the program panics is logged before it goes on as it
/// would. Gives the file, where there is one.
pub fn start(root: &Path) -> Option<PathBuf> {
    let filter = || tracing_subscriber::EnvFilter::try_from_env("GLAUKOPIS_LOG").unwrap_or_else(|_| "info".into());
    // The time of this computer, as the one who reads the log lives by it.
    // Asked now, while there is one thread: later it cannot be.
    let offset = time::UtcOffset::current_local_offset().unwrap_or(time::UtcOffset::UTC);
    let timer =
        || tracing_subscriber::fmt::time::OffsetTime::new(offset, time::format_description::well_known::Rfc3339);
    let dir = root.join(DIR);
    let file = fs::create_dir_all(&dir).ok().and_then(|()| {
        let path = dir.join(name_now());
        File::create(&path).ok().map(|file| (path, file))
    });
    let path = match file {
        Some((path, file)) => {
            // A file without colours: it is read in an editor. Each event is
            // written at once, unbuffered, so that what came last before an
            // end is there.
            let both = std::io::stderr.and(Mutex::new(file));
            tracing_subscriber::fmt()
                .with_env_filter(filter())
                .with_timer(timer())
                .with_ansi(false)
                .with_writer(both)
                .init();
            Some(path)
        }
        None => {
            tracing_subscriber::fmt().with_env_filter(filter()).with_timer(timer()).with_writer(std::io::stderr).init();
            None
        }
    };
    prune(&dir, KEEP);
    let previous = std::panic::take_hook();
    std::panic::set_hook(Box::new(move |info| {
        let thread = std::thread::current();
        let backtrace = std::backtrace::Backtrace::force_capture();
        tracing::error!(thread = thread.name().unwrap_or("unnamed"), "panic: {info}\n{backtrace}");
        previous(info);
    }));
    tracing::info!(
        version = env!("CARGO_PKG_VERSION"),
        pid = std::process::id(),
        log = %path.as_deref().map(Path::display).map(|d| d.to_string()).unwrap_or_default(),
        "Glaukopis begins"
    );
    path
}

/// The name of the file of a run that begins now: by when, so that the
/// names sort as the runs came, and by the process, so that two that begin
/// in the same second do not share one.
fn name_now() -> String {
    let now = time::OffsetDateTime::now_local().unwrap_or_else(|_| time::OffsetDateTime::now_utc());
    format!(
        "glaukopis-{:04}-{:02}-{:02}-{:02}{:02}{:02}-{}.log",
        now.year(),
        u8::from(now.month()),
        now.day(),
        now.hour(),
        now.minute(),
        now.second(),
        std::process::id()
    )
}

/// Deletes the logs of all runs but the last `keep`, by their names.
fn prune(dir: &Path, keep: usize) {
    let Ok(entries) = fs::read_dir(dir) else { return };
    let mut logs: Vec<PathBuf> = entries
        .flatten()
        .map(|e| e.path())
        .filter(|p| {
            p.file_name().and_then(|n| n.to_str()).is_some_and(|n| n.starts_with("glaukopis-") && n.ends_with(".log"))
        })
        .collect();
    if logs.len() <= keep {
        return;
    }
    logs.sort();
    for old in &logs[..logs.len() - keep] {
        let _ = fs::remove_file(old);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_the_last_runs_are_kept() {
        let tmp = tempfile::tempdir().unwrap();
        for day in 1..=13 {
            fs::write(tmp.path().join(format!("glaukopis-2026-10-{day:02}-120000-7.log")), "").unwrap();
        }
        fs::write(tmp.path().join("notes.txt"), "mine").unwrap();
        prune(tmp.path(), 10);
        let mut left: Vec<String> =
            fs::read_dir(tmp.path()).unwrap().flatten().map(|e| e.file_name().to_string_lossy().into_owned()).collect();
        left.sort();
        assert_eq!(left.len(), 11, "{left:?}");
        assert_eq!(left[0], "glaukopis-2026-10-04-120000-7.log");
        assert!(left.contains(&"notes.txt".to_owned()), "what is not a log is left alone");
        assert!(name_now().starts_with("glaukopis-20") && name_now().ends_with(".log"));
    }
}
