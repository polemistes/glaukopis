//! What the core says has changed on disk, by area, so that every window of
//! the application can read it again (ADR 0085): a project renamed in one
//! window is seen in the list of another. Each store says so where it writes
//! its file, once, and only when the file was written.

use std::sync::{OnceLock, PoisonError, RwLock};

use serde::Serialize;

/// What changed.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Area {
    /// The projects: their facts, their folders and favourites, the trash.
    Projects,
    /// The library: its references, collections and notes.
    Library,
    /// The files of the library.
    Files,
    /// The settings.
    Settings,
    /// The languages of spelling and of OCR.
    Languages,
    /// The writer's own words: of the interface and of spelling.
    Words,
}

type Heard = Box<dyn Fn(Area) + Send + Sync>;

static HEARD: OnceLock<RwLock<Option<Heard>>> = OnceLock::new();

fn heard() -> &'static RwLock<Option<Heard>> {
    HEARD.get_or_init(|| RwLock::new(None))
}

/// What the application does when an area changed: tells every window.
/// Set once by the application; a second takes the place of the first.
pub fn on_changed(f: impl Fn(Area) + Send + Sync + 'static) {
    *heard().write().unwrap_or_else(PoisonError::into_inner) = Some(Box::new(f));
}

/// Says that an area changed on disk.
pub fn changed(area: Area) {
    if let Some(f) = heard().read().unwrap_or_else(PoisonError::into_inner).as_ref() {
        f(area);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;

    /// What the tests heard, for the tests of the stores as well: other
    /// tests of the crate write at the same time, so each looks for its own.
    pub(crate) static TOLD: Mutex<Vec<Area>> = Mutex::new(Vec::new());

    pub(crate) fn listen() {
        on_changed(|area| TOLD.lock().unwrap().push(area));
    }

    #[test]
    fn a_write_is_told_once_and_a_failure_not_at_all() {
        listen();
        let tmp = tempfile::tempdir().unwrap();
        let count = || TOLD.lock().unwrap().iter().filter(|a| **a == Area::Settings).count();
        let before = count();
        crate::settings::save(&tmp.path().join("settings.json"), &serde_json::Map::new()).unwrap();
        // Other tests write settings at the same time: at least the one, here.
        assert!(count() > before);
        std::fs::write(tmp.path().join("a file"), "").unwrap();
        let before = count();
        let failed = crate::settings::save(&tmp.path().join("a file").join("settings.json"), &serde_json::Map::new());
        assert!(failed.is_err());
        // Nothing of this test is told; another test's write may be.
        assert!(count() <= before + 1);
    }
}
