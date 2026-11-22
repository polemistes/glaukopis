//! Whether the writer wrote in a project since it was last exchanged
//! (record 0119): a mark beside the project, made when a change of the
//! writer's own is written to its log.
//!
//! The application writes into a project by itself as well: who is who in
//! its history, when a window opens it. Bytes do not say which is which, so
//! the window says it with each change it writes (`project_append`), and
//! the engine tells the server whether what it brings holds any writing.
//! Two computers wrote apart where the writer wrote on both.

use std::fs;
use std::path::Path;

const WROTE: &str = "sync.wrote";

/// Marks that the writer wrote in the project kept in `dir`.
pub fn mark(dir: &Path) {
    let path = dir.join(WROTE);
    if !path.exists()
        && let Err(error) = fs::write(&path, b"")
    {
        tracing::warn!(%error, "that the writer wrote in a project could not be marked");
    }
}

/// Takes the mark away, and says whether it was there. Taken before the
/// project is read for an exchange, so that what is written while the
/// exchange is under way marks it anew; put back with `mark` where the
/// exchange fails.
pub fn take(dir: &Path) -> bool {
    fs::remove_file(dir.join(WROTE)).is_ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_mark_is_made_once_and_taken_once() {
        let tmp = tempfile::tempdir().unwrap();
        assert!(!take(tmp.path()));
        mark(tmp.path());
        mark(tmp.path());
        assert!(take(tmp.path()));
        assert!(!take(tmp.path()));
    }
}
