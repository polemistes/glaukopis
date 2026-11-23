//! The notebook on disk: one document outside all projects, kept as a
//! project's is (see `projects`) and owned, as that is, by the interface
//! (`src/lib/notebook/`), which hands it over as bytes:
//!
//! ```text
//! notebook/state.bin      the document as one update
//! notebook/updates.log    changes since, each in a record (see `history`)
//! notebook/history/       earlier states, thinned as they age
//! notebook/notebook.json  how many notes there are, the files they hold, when it was saved
//! ```
//!
//! It is not a project: it is in no list, nobody is told of projects when it
//! is written, and the locks and the file of what is known of projects are
//! not its own. The files its notes hold are in the library's store, each
//! with a record that says the notebook holds it (`library::files::Held`).
//!
//! What a file says of itself, read before it is copied into the store, is
//! in `facts`. What the plugin for Firefox collects comes through the helper
//! Firefox starts (`host`, the application in another role) into an inbox
//! (`inbox`), from which the application takes it; Firefox is told of the
//! helper in `firefox`. A note written in a window of its own, the
//! application in yet another role, goes into the same inbox
//! (`note_window`).

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, PoisonError};

use serde::{Deserialize, Serialize};

use crate::error::{IoContext, Result};
use crate::fsutil::write_atomic;
use crate::history::{Record, append_record};
use crate::library::now;
use crate::paths::DataDir;
use crate::projects::{LOG, STATE, keep_history, read_log};
use crate::tr;

pub mod facts;
pub mod firefox;
pub mod host;
pub mod inbox;
pub mod note_window;
pub mod readable;

pub use facts::{Facts, Place, facts};

/// What is said of the notebook when its state is saved.
const INFO: &str = "notebook.json";

/// The notebook's document where it is kept.
#[derive(Debug)]
pub struct Notebook {
    dir: PathBuf,
    /// One at a time a change is added and the state saved: a change added
    /// between the writing of a state and the emptying of the log would be
    /// lost with the log.
    writing: Mutex<()>,
}

/// The notebook as it is on disk.
#[derive(Debug, Default, PartialEq)]
pub struct Loaded {
    /// None where nothing was saved yet.
    pub state: Option<Vec<u8>>,
    /// The changes after the state, in the order they were written.
    pub updates: Vec<Vec<u8>>,
}

/// What the interface says of the notebook when it saves its whole state.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Summary {
    /// How many notes there are.
    pub notes: usize,
    /// The files the notes hold, by their hashes.
    pub files: Vec<String>,
}

/// What is written beside the state: the summary, and when.
#[derive(Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
struct Info {
    notes: usize,
    files: Vec<String>,
    modified: String,
}

impl Notebook {
    /// The notebook of this data folder.
    pub fn new(data: &DataDir) -> Self {
        Self::at(data.notebook())
    }

    /// The notebook kept in `dir`, which is made when it is first written to.
    pub fn at(dir: impl Into<PathBuf>) -> Self {
        Notebook { dir: dir.into(), writing: Mutex::new(()) }
    }

    pub fn dir(&self) -> &Path {
        &self.dir
    }

    fn hold(&self) -> std::sync::MutexGuard<'_, ()> {
        self.writing.lock().unwrap_or_else(PoisonError::into_inner)
    }

    /// The notebook as it is on disk. Nothing written yet is an empty
    /// notebook, not an error.
    pub fn load(&self) -> Result<Loaded> {
        let _writing = self.hold();
        let state = match fs::read(self.dir.join(STATE)) {
            Ok(bytes) => Some(bytes),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => None,
            Err(e) => return Err(e).context(|| tr!("core-notebook-reading")),
        };
        let updates = read_log(&self.dir.join(LOG))?;
        Ok(Loaded { state, updates })
    }

    /// Adds a change to the log, written at `time`, in milliseconds since
    /// 1970. It is on disk when this returns. An empty change is passed over.
    pub fn append(&self, update: &[u8], time: i64) -> Result<()> {
        self.append_change(update, true, time)
    }

    /// As `append`, saying whether the change was made here or came from
    /// another computer of the writer's (record 0120).
    pub fn append_change(&self, update: &[u8], here: bool, time: i64) -> Result<()> {
        if update.is_empty() {
            return Ok(());
        }
        let _writing = self.hold();
        fs::create_dir_all(&self.dir).context(|| tr!("io-creating", path = &self.dir))?;
        append_record(&self.dir.join(LOG), &Record::change(update.to_vec(), here, time))
    }

    /// Replaces the stored state by a new one that holds everything, and
    /// empties the log. The state before is kept in the history now and
    /// then, as a project's is; what is said of the notebook is written
    /// beside it.
    pub fn save_state(&self, state: &[u8], summary: &Summary) -> Result<()> {
        let _writing = self.hold();
        fs::create_dir_all(&self.dir).context(|| tr!("io-creating", path = &self.dir))?;
        keep_history(&self.dir)?;
        write_atomic(&self.dir.join(STATE), state)?;
        // Only now may the log go: the state holds what it held.
        match fs::remove_file(self.dir.join(LOG)) {
            Ok(()) => {}
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
            Err(e) => return Err(e).context(|| tr!("core-projects-emptying-log")),
        }
        let info = Info { notes: summary.notes, files: summary.files.clone(), modified: now() };
        write_atomic(&self.dir.join(INFO), serde_json::to_string_pretty(&info)?.as_bytes())
    }

    /// Says which files the notes hold now, by their hashes, where that has
    /// changed and the whole notebook is not saved: what is said of the
    /// notebook is written with these files, how many notes there are and
    /// when it was saved staying as they were. Where nothing was said of it
    /// yet, or what was said cannot be read, it is said with no notes counted.
    pub fn say_held(&self, files: &[String]) -> Result<()> {
        let _writing = self.hold();
        fs::create_dir_all(&self.dir).context(|| tr!("io-creating", path = &self.dir))?;
        let path = self.dir.join(INFO);
        let said = fs::read_to_string(&path).ok().and_then(|text| serde_json::from_str::<Info>(&text).ok());
        let info = Info { files: files.to_vec(), ..said.unwrap_or_default() };
        write_atomic(&path, serde_json::to_string_pretty(&info)?.as_bytes())
    }

    /// The files the notes held, by their hashes, when the notebook was last
    /// saved or it was last said (`say_held`); none where neither was done,
    /// or what was said cannot be read.
    pub fn held(&self) -> Vec<String> {
        let Ok(text) = fs::read_to_string(self.dir.join(INFO)) else { return Vec::new() };
        serde_json::from_str::<Info>(&text).map(|info| info.files).unwrap_or_default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::projects::HISTORY;

    fn notebook() -> (tempfile::TempDir, Notebook) {
        let tmp = tempfile::tempdir().unwrap();
        let data = DataDir::open(tmp.path().join("data")).unwrap();
        let notebook = Notebook::new(&data);
        (tmp, notebook)
    }

    fn kept(notebook: &Notebook) -> usize {
        fs::read_dir(notebook.dir().join(HISTORY)).map(|d| d.count()).unwrap_or(0)
    }

    #[test]
    fn a_notebook_never_written_is_empty_and_its_folder_is_not_made() {
        let (_tmp, notebook) = notebook();
        assert_eq!(notebook.load().unwrap(), Loaded::default());
        assert!(notebook.held().is_empty());
        notebook.append(b"", 1).unwrap();
        assert!(!notebook.dir().exists(), "nothing was written");
    }

    #[test]
    fn changes_are_read_in_the_order_they_were_written_and_go_with_a_save() {
        let (_tmp, notebook) = notebook();
        notebook.append(b"one", 1).unwrap();
        notebook.append(b"two", 2).unwrap();
        let loaded = notebook.load().unwrap();
        assert_eq!(loaded.state, None);
        assert_eq!(loaded.updates, vec![b"one".to_vec(), b"two".to_vec()]);

        notebook.save_state(b"STATE", &Summary { notes: 2, files: vec!["a".repeat(64)] }).unwrap();
        let loaded = notebook.load().unwrap();
        assert_eq!(loaded.state.as_deref(), Some(&b"STATE"[..]));
        assert!(loaded.updates.is_empty(), "the log was emptied");
        notebook.append(b"three", 3).unwrap();
        assert_eq!(notebook.load().unwrap().updates, vec![b"three".to_vec()]);
        assert_eq!(notebook.held(), vec!["a".repeat(64)]);
    }

    #[test]
    fn the_state_before_is_kept_in_the_history_now_and_then() {
        let (_tmp, notebook) = notebook();
        notebook.save_state(b"1", &Summary::default()).unwrap();
        assert_eq!(kept(&notebook), 0, "there was no state before");
        notebook.save_state(b"2", &Summary::default()).unwrap();
        assert_eq!(kept(&notebook), 1);
        let entry = fs::read_dir(notebook.dir().join(HISTORY)).unwrap().next().unwrap().unwrap();
        assert_eq!(fs::read(entry.path()).unwrap(), b"1");
        notebook.save_state(b"3", &Summary::default()).unwrap();
        assert_eq!(kept(&notebook), 1, "not twice within the interval");
    }

    #[test]
    fn what_was_said_of_the_files_is_read_back_and_a_broken_record_says_nothing() {
        let (_tmp, notebook) = notebook();
        let files = vec!["b".repeat(64), "c".repeat(64)];
        notebook.save_state(b"S", &Summary { notes: 5, files: files.clone() }).unwrap();
        assert_eq!(notebook.held(), files);
        let info: serde_json::Value =
            serde_json::from_str(&fs::read_to_string(notebook.dir().join(INFO)).unwrap()).unwrap();
        assert_eq!(info["notes"], 5);
        assert!(info["modified"].as_str().unwrap().starts_with("20"));

        fs::write(notebook.dir().join(INFO), "{ not json").unwrap();
        assert!(notebook.held().is_empty());
        fs::remove_file(notebook.dir().join(INFO)).unwrap();
        assert!(notebook.held().is_empty());
    }

    #[test]
    fn what_is_said_of_the_files_between_two_savings_is_read_back_and_the_rest_stays() {
        let (_tmp, notebook) = notebook();
        let said = |notebook: &Notebook| -> serde_json::Value {
            serde_json::from_str(&fs::read_to_string(notebook.dir().join(INFO)).unwrap()).unwrap()
        };
        // Said of a notebook that was never written: with no notes counted, and no time of a saving.
        let first = vec!["a".repeat(64)];
        notebook.say_held(&first).unwrap();
        assert_eq!(notebook.held(), first);
        assert_eq!((said(&notebook)["notes"].clone(), said(&notebook)["modified"].clone()), (0.into(), "".into()));
        assert_eq!(notebook.load().unwrap(), Loaded::default(), "nothing of the document is written by it");

        notebook.save_state(b"S", &Summary { notes: 5, files: vec!["b".repeat(64)] }).unwrap();
        let saved = said(&notebook);
        let now = vec!["b".repeat(64), "c".repeat(64)];
        notebook.say_held(&now).unwrap();
        assert_eq!(notebook.held(), now, "what is said is read again");
        assert_eq!(said(&notebook)["notes"], 5, "the count of the notes stays");
        assert_eq!(said(&notebook)["modified"], saved["modified"], "and when it was saved");
        assert_eq!(notebook.load().unwrap().state.as_deref(), Some(&b"S"[..]), "the document is as it was");
        notebook.say_held(&[]).unwrap();
        assert!(notebook.held().is_empty(), "that the notes hold nothing is said too");
        assert_eq!(said(&notebook)["notes"], 5);

        // Over what cannot be read it is said anew.
        fs::write(notebook.dir().join(INFO), "{ not json").unwrap();
        notebook.say_held(&first).unwrap();
        assert_eq!(notebook.held(), first);
    }
}
