//! A note written in a window of its own (record 0109): the application in
//! another role, started with `--note`, opens one small window to write
//! in, and what is sent from it is written into the notebook's inbox
//! (`inbox`) as a thing of the kind `note`, which the application takes
//! in as it takes what the plugin for Firefox hands over. It works whether
//! the application runs or not, beside it and never through it: it claims
//! nothing, moves nothing, and writes nothing of the settings.
//!
//! What is written and not yet sent is kept, a moment after each change,
//! in a file of the notebook's folder, so that a window closed with words
//! in it loses nothing; it goes when they are sent or the field is emptied:
//!
//! ```text
//! notebook/unsent-note.txt   the words, as they were last kept
//! notebook/inbox/            where they go when they are sent
//! ```

use std::ffi::OsString;
use std::fs;
use std::path::{Path, PathBuf};

use serde_json::{Map, Value};

use super::inbox::{Collected, Inbox, Kind, MAX_TEXT, cut_bytes};
use crate::error::{Error, IoContext, Result};
use crate::fsutil::write_atomic;
use crate::paths::{self, DataDir};
use crate::tr;

/// The argument by which the application is the window of a note.
pub const FLAG: &str = "--note";

/// The file of the words not yet sent, in the notebook's folder.
const UNSENT: &str = "unsent-note.txt";

/// Whether the application is asked to be the window of a note: `--note`
/// among its arguments, wherever it stands (macOS's `open --args` may put
/// something of its own before it).
pub fn asked(args: &[OsString]) -> bool {
    args.iter().skip(1).any(|a| a == FLAG)
}

/// The data folder as the application finds it at its start
/// (`GLAUKOPIS_DATA_DIR`, else the folder the writer chose, else the usual
/// one), with nothing moved and nothing made. While a move is under way,
/// which the application finishes at its next start, the folder moved
/// from, while it is there: what is written there is moved with the rest.
/// A folder the writer chose that is not there, its disk unplugged, is an
/// error: an empty folder made in its place would be taken for the data.
pub fn data_root(place: &Path) -> Result<PathBuf> {
    root_in(place, paths::data_dir_from_environment().then(paths::default_root), paths::default_root)
}

/// The data folder: that of the environment where it names one, else as
/// the file of the location in `place` says, else the `usual` one, which
/// may not be there yet: it is made as the application would make it,
/// when something is first written into it.
fn root_in(place: &Path, environment: Option<PathBuf>, usual: impl FnOnce() -> PathBuf) -> Result<PathBuf> {
    if let Some(root) = environment {
        return Ok(root);
    }
    let Some(location) = paths::location(place)? else { return Ok(usual()) };
    let root = match location.moving_from {
        Some(from) if from.is_dir() => from,
        _ => location.folder,
    };
    if root.is_dir() { Ok(root) } else { Err(Error::not_found(root.display().to_string())) }
}

/// The window of a note, in the data folder it writes into.
#[derive(Debug)]
pub struct NoteWindow {
    data: DataDir,
    inbox: Inbox,
}

impl NoteWindow {
    /// The window of a note for the data folder `data`, which is neither
    /// opened nor claimed (`DataDir::at`).
    pub fn new(data: DataDir) -> Self {
        let inbox = Inbox::new(&data);
        NoteWindow { data, inbox }
    }

    pub fn data(&self) -> &DataDir {
        &self.data
    }

    pub fn inbox(&self) -> &Inbox {
        &self.inbox
    }

    /// The settings, read and never written: a file that cannot be read
    /// gives the defaults, and is left as it is for the application to
    /// set aside at its start.
    pub fn settings(&self) -> Map<String, Value> {
        let path = self.data.settings_file();
        crate::settings::load(&path).unwrap_or_else(|error| {
            tracing::warn!(%error, "the settings could not be read: the window of a note has the defaults");
            Map::new()
        })
    }

    fn unsent_file(&self) -> PathBuf {
        self.data.notebook().join(UNSENT)
    }

    /// The words written and not sent, as they were last kept; nothing
    /// where none are kept or they cannot be read.
    pub fn unsent(&self) -> String {
        let path = self.unsent_file();
        match fs::read(&path) {
            Ok(bytes) => {
                let mut words = String::from_utf8_lossy(&bytes).into_owned();
                cut_bytes(&mut words, MAX_TEXT);
                words
            }
            Err(e) => {
                if e.kind() != std::io::ErrorKind::NotFound {
                    tracing::warn!(error = %e, path = %path.display(), "the words not sent could not be read");
                }
                String::new()
            }
        }
    }

    /// Keeps the words written and not sent, in place of those kept
    /// before, whole or not at all; words of nothing but spaces are no
    /// words, and what was kept goes.
    pub fn keep(&self, words: &str) -> Result<()> {
        if words.trim().is_empty() {
            return self.forget();
        }
        let mut words = words.to_owned();
        cut_bytes(&mut words, MAX_TEXT);
        write_atomic(&self.unsent_file(), words.as_bytes())
    }

    /// Forgets the words kept. None kept are forgotten already.
    fn forget(&self) -> Result<()> {
        let path = self.unsent_file();
        match fs::remove_file(&path) {
            Err(e) if e.kind() != std::io::ErrorKind::NotFound => Err(e).context(|| tr!("io-removing", path = &path)),
            _ => Ok(()),
        }
    }

    /// Writes the words into the notebook's inbox as a note, with when,
    /// whole or not at all, and forgets what was kept of them. Words of
    /// nothing but spaces are refused, and nothing is written. Gives the
    /// id of the thing in the inbox.
    pub fn send(&self, words: &str) -> Result<String> {
        if words.trim().is_empty() {
            return Err(Error::invalid(tr!("core-notebook-note-empty")));
        }
        let note = Collected {
            kind: Kind::Note,
            url: String::new(),
            title: String::new(),
            when: crate::library::now(),
            text: words.to_owned(),
            html: String::new(),
            alt: String::new(),
            name: String::new(),
        };
        let id = self.inbox.put(&note, None)?;
        // Kept, it would be there to be sent again when the window is next opened.
        if let Err(error) = self.forget() {
            tracing::warn!(%error, "a note was sent, and the words kept of it could not be forgotten");
        }
        Ok(id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn window() -> (tempfile::TempDir, NoteWindow) {
        let tmp = tempfile::tempdir().unwrap();
        let data = DataDir::open(tmp.path().join("data")).unwrap();
        (tmp, NoteWindow::new(data))
    }

    #[test]
    fn the_role_is_taken_for_the_flag_wherever_it_stands() {
        let args = |list: &[&str]| list.iter().map(OsString::from).collect::<Vec<_>>();
        assert!(asked(&args(&["glaukopis", "--note"])));
        assert!(asked(&args(&["glaukopis", "-psn_0_12345", "--note"])));
        assert!(!asked(&args(&["glaukopis"])));
        assert!(!asked(&args(&["--note"])), "the program's own name is no argument");
        assert!(!asked(&args(&["glaukopis", "--notes"])));
        assert!(!asked(&args(&["glaukopis", "/tmp/org.glaukopis.notebook.json", "notebook@glaukopis"])));
    }

    #[test]
    fn the_data_folder_is_found_as_the_application_finds_it_and_nothing_is_made() {
        let tmp = tempfile::tempdir().unwrap();
        let place = tmp.path().join("settings");
        let usual = tmp.path().join("usual");
        let chosen = tmp.path().join("chosen");
        let usual_now = || usual.clone();
        // Never started: the usual folder, not made by looking.
        assert_eq!(root_in(&place, None, usual_now).unwrap(), usual);
        assert!(!usual.exists());
        assert!(!place.exists());
        // A folder chosen, not there (its disk unplugged): an error, and nothing made.
        let location = paths::Location { folder: chosen.clone(), moving_from: None };
        paths::set_location(&place, &location).unwrap();
        assert!(root_in(&place, None, usual_now).is_err());
        assert!(!chosen.exists());
        DataDir::open(&chosen).unwrap();
        assert_eq!(root_in(&place, None, usual_now).unwrap(), chosen);
        // A move under way: the folder moved from, while it is there.
        let new = tmp.path().join("new");
        let location = paths::Location { folder: new.clone(), moving_from: Some(chosen.clone()) };
        paths::set_location(&place, &location).unwrap();
        assert_eq!(root_in(&place, None, usual_now).unwrap(), chosen);
        // Moved, the old one gone: the new one.
        DataDir::open(&new).unwrap();
        let location = paths::Location { folder: new.clone(), moving_from: Some(tmp.path().join("gone")) };
        paths::set_location(&place, &location).unwrap();
        assert_eq!(root_in(&place, None, usual_now).unwrap(), new);
        // The environment wins.
        let environment = tmp.path().join("of the environment");
        assert_eq!(root_in(&place, Some(environment.clone()), usual_now).unwrap(), environment);
    }

    #[test]
    fn a_note_sent_lies_in_the_inbox_as_a_note_of_its_words() {
        let (_tmp, window) = window();
        let id = window.send("A thought.\n\nAnd another, on a line of its own.").unwrap();
        assert_eq!(window.inbox().ids(), vec![id.clone()]);
        let (note, picture) = window.inbox().read(&id).unwrap();
        assert_eq!(note.kind, Kind::Note);
        assert_eq!(note.text, "A thought.\n\nAnd another, on a line of its own.");
        assert!(note.url.is_empty() && note.title.is_empty() && note.html.is_empty());
        assert!(note.when.starts_with("20") && note.when.contains('T'), "{}", note.when);
        assert_eq!(picture, None);
    }

    #[test]
    fn spaces_alone_are_not_sent() {
        let (_tmp, window) = window();
        assert!(window.send("").is_err());
        assert!(window.send(" \n\t ").is_err());
        assert!(window.inbox().ids().is_empty());
    }

    #[test]
    fn words_too_long_are_cut_and_sent() {
        let (_tmp, window) = window();
        let id = window.send(&format!("{}é", "w".repeat(MAX_TEXT - 1))).unwrap();
        let (note, _) = window.inbox().read(&id).unwrap();
        assert_eq!(note.text.len(), MAX_TEXT - 1, "cut where a sign begins");
    }

    #[test]
    fn the_words_not_sent_are_kept_read_replaced_and_removed() {
        let (_tmp, window) = window();
        assert_eq!(window.unsent(), "");
        window.keep("First words").unwrap();
        assert_eq!(window.unsent(), "First words");
        window.keep("First words, and more\non two lines").unwrap();
        assert_eq!(window.unsent(), "First words, and more\non two lines");
        let file = window.data().notebook().join(UNSENT);
        assert!(file.is_file());
        // Emptied, or nothing but spaces: no words to keep.
        window.keep("  \n").unwrap();
        assert_eq!(window.unsent(), "");
        assert!(!file.exists());
        window.keep("").unwrap();
        assert!(!file.exists());
        // Nothing is left beside it of the writing.
        window.keep("Again").unwrap();
        let names: Vec<_> = fs::read_dir(window.data().notebook())
            .unwrap()
            .map(|e| e.unwrap().file_name().into_string().unwrap())
            .collect();
        assert_eq!(names, vec![UNSENT.to_owned()]);
    }

    #[test]
    fn what_is_sent_is_no_longer_kept() {
        let (_tmp, window) = window();
        window.keep("To be sent").unwrap();
        window.send("To be sent").unwrap();
        assert_eq!(window.unsent(), "");
        assert!(!window.data().notebook().join(UNSENT).exists());
    }

    #[test]
    fn what_cannot_be_sent_is_still_kept() {
        let (_tmp, window) = window();
        window.keep("Not lost").unwrap();
        // The inbox cannot be made: a file stands where it would be.
        fs::write(window.inbox().dir(), "in the way").unwrap();
        assert!(window.send("Not lost").is_err());
        assert_eq!(window.unsent(), "Not lost");
    }

    #[test]
    fn a_data_folder_not_yet_there_is_made_when_words_are_first_kept() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().join("never started");
        let window = NoteWindow::new(DataDir::at(&root));
        assert!(!root.exists(), "nothing is made by opening the window");
        assert_eq!(window.unsent(), "");
        assert!(window.settings().is_empty());
        assert!(!root.exists(), "nor by reading");
        window.keep("Words").unwrap();
        window.send("Words").unwrap();
        assert_eq!(Inbox::in_data_folder(&root).ids().len(), 1);
    }

    #[test]
    fn the_settings_are_read_and_never_written() {
        let (_tmp, window) = window();
        let path = window.data().settings_file();
        assert!(window.settings().is_empty());
        assert!(!path.exists(), "a missing file is not made");
        fs::write(&path, r#"{"language":"nb","theme":"dark"}"#).unwrap();
        let settings = window.settings();
        assert_eq!(settings["language"], "nb");
        assert_eq!(settings["theme"], "dark");
        // A damaged file is left as it is, for the application to set aside.
        fs::write(&path, "{ not whole").unwrap();
        assert!(window.settings().is_empty());
        assert_eq!(fs::read_to_string(&path).unwrap(), "{ not whole");
        let names: Vec<_> = fs::read_dir(window.data().root())
            .unwrap()
            .map(|e| e.unwrap().file_name().into_string().unwrap())
            .filter(|n| n.starts_with("settings"))
            .collect();
        assert_eq!(names, vec!["settings.json".to_owned()]);
    }
}
