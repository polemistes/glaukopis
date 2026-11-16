//! A note written in a window of its own (record 0109): the application in
//! another role, started with `--note`, opens one small window to write
//! in, and what is sent from it is written into the notebook's inbox
//! (`inbox`) as a thing of the kind `note`, which the application takes
//! in as it takes what the plugin for Firefox hands over. It works whether
//! the application runs or not, beside it and never through it: it claims
//! nothing, moves nothing, and writes nothing of the settings.
//!
//! The note is a text as the notes of the notebook are, with its marks,
//! its lists, its pictures and its files. What is written and not yet
//! sent is kept, so that a window closed with a note in it loses nothing:
//! the text a moment after each change, each file as it is added, in a
//! folder that the window claims while it is open, so that two windows open
//! at once never write into one. A window opened finds the oldest note not
//! sent that no other window has, and goes on with it. The text goes when
//! the note is sent or emptied; the files with it when it is sent, or when
//! a window next takes the folder and finds no note in it:
//!
//! ```text
//! notebook/unsent-notes/<id>/note.json   the text as it was last kept (`NoteText`)
//! notebook/unsent-notes/<id>/<hash>      each file added, by what it holds
//! notebook/unsent-notes/<id>.in-use      claimed by the window that has it
//! notebook/inbox/                        where the note goes when it is sent
//! ```
//!
//! An `<id>` is thirteen digits of milliseconds, a dash and eight signs at
//! random, as the inbox's are, so that the oldest sorts first.

use std::ffi::OsString;
use std::fs;
use std::io::Cursor;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, PoisonError};

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

use super::inbox::{Collected, HeldFile, Inbox, Kind, MAX_FILE, MAX_TEXT, file_too_large, is_hash};
use crate::error::{Error, IoContext, Result};
use crate::fsutil::write_atomic;
use crate::library::attachments::{hash_bytes, hash_file};
use crate::paths::{self, DataDir};
use crate::tr;

/// The argument by which the application is the window of a note.
pub const FLAG: &str = "--note";

/// The folder of the notes not yet sent, in the notebook's folder.
const UNSENT: &str = "unsent-notes";
/// What follows the id of a note not sent in the name of the file that claims it.
const CLAIM: &str = ".in-use";
/// The file of its text, in that folder.
const TEXT: &str = "note.json";

/// The endings of the pictures a note shows as pictures, of which it is
/// told how wide they are: those a figure shows as they are.
const PICTURES: &[&str] = &["png", "jpg", "jpeg"];

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

/// The text of a note as the window hands it over: as the texts of the
/// notebook are written (ProseMirror's JSON of the body schema), its plain
/// words beside it, and the files it holds.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(default)]
pub struct NoteText {
    pub doc: Value,
    pub words: String,
    pub files: Vec<HeldFile>,
}

impl NoteText {
    /// Whether it holds nothing: no words and no file.
    pub fn is_empty(&self) -> bool {
        self.words.trim().is_empty() && self.files.is_empty()
    }
}

/// A file added to a note: what it holds, what it is called, the ending of
/// its name in small letters, how large it is, and of a picture how many
/// pixels wide, where that can be read.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Added {
    pub hash: String,
    pub name: String,
    pub extension: String,
    pub size: u64,
    pub width: Option<u32>,
}

/// Claims the note not sent of this id for this window: its file of the
/// claim made and locked. None where another window has it. Where the file
/// system cannot lock, it is claimed without, as the data folder is.
fn try_claim(root: &Path, id: &str) -> Result<Option<fs::File>> {
    let path = root.join(format!("{id}{CLAIM}"));
    let file = fs::OpenOptions::new()
        .create(true)
        .truncate(false)
        .write(true)
        .open(&path)
        .context(|| tr!("io-creating", path = &path))?;
    match file.try_lock() {
        Ok(()) => Ok(Some(file)),
        Err(fs::TryLockError::WouldBlock) => Ok(None),
        Err(fs::TryLockError::Error(e)) => {
            tracing::warn!("a note not sent cannot be claimed, and is used without: {e}");
            Ok(Some(file))
        }
    }
}

/// The ending of a name, in small letters; nothing where it has none.
fn ending(name: &str) -> String {
    Path::new(name).extension().and_then(|e| e.to_str()).map(str::to_ascii_lowercase).unwrap_or_default()
}

/// The folder of a note not sent that a window has, and the file that
/// claims it, locked while the window is open: let go when it is dropped,
/// or when the process ends however it ends.
#[derive(Debug)]
struct Claimed {
    dir: PathBuf,
    _lock: fs::File,
}

/// The window of a note, in the data folder it writes into.
#[derive(Debug)]
pub struct NoteWindow {
    data: DataDir,
    inbox: Inbox,
    /// The folder of its note not sent, once it has one.
    claimed: Mutex<Option<Claimed>>,
}

impl NoteWindow {
    /// The window of a note for the data folder `data`, which is neither
    /// opened nor claimed (`DataDir::at`).
    pub fn new(data: DataDir) -> Self {
        let inbox = Inbox::new(&data);
        NoteWindow { data, inbox, claimed: Mutex::new(None) }
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

    fn unsent_root(&self) -> PathBuf {
        self.data.notebook().join(UNSENT)
    }

    /// The folder of this window's note not sent, claimed where it has none
    /// yet: the oldest that no other window has, else a new one. A folder
    /// taken that holds no note is emptied of the files left in it.
    fn unsent_dir(&self) -> Result<PathBuf> {
        let mut claimed = self.claimed.lock().unwrap_or_else(PoisonError::into_inner);
        if let Some(claimed) = claimed.as_ref() {
            return Ok(claimed.dir.clone());
        }
        let root = self.unsent_root();
        fs::create_dir_all(&root).context(|| tr!("io-creating", path = &root))?;
        let mut ids: Vec<String> = fs::read_dir(&root)
            .context(|| tr!("io-reading", path = &root))?
            .filter_map(|entry| entry.ok()?.file_name().into_string().ok())
            .filter_map(|name| name.strip_suffix(CLAIM).map(str::to_owned).or(Some(name)))
            .filter(|id| !id.starts_with('.'))
            .collect();
        ids.sort();
        ids.dedup();
        for id in ids {
            if let Some(lock) = try_claim(&root, &id)? {
                let dir = root.join(&id);
                if serde_json::from_slice::<NoteText>(&fs::read(dir.join(TEXT)).unwrap_or_default()).is_err() {
                    let _ = fs::remove_dir_all(&dir);
                }
                *claimed = Some(Claimed { dir: dir.clone(), _lock: lock });
                return Ok(dir);
            }
        }
        let id = crate::notebook::inbox::new_id();
        let lock = try_claim(&root, &id)?.ok_or_else(|| Error::invalid(tr!("io-creating", path = &root.join(&id))))?;
        let dir = root.join(&id);
        *claimed = Some(Claimed { dir: dir.clone(), _lock: lock });
        Ok(dir)
    }

    /// The note written and not sent, as it was last kept: the oldest that
    /// no other window has. Nothing where none is kept, or what is kept
    /// cannot be read; no folder is made by looking.
    pub fn unsent(&self) -> Option<NoteText> {
        if !self.unsent_root().is_dir() {
            return None;
        }
        let dir = match self.unsent_dir() {
            Ok(dir) => dir,
            Err(error) => {
                tracing::warn!(%error, "no note not sent could be had");
                return None;
            }
        };
        let path = dir.join(TEXT);
        let bytes = match fs::read(&path) {
            Ok(bytes) => bytes,
            Err(e) => {
                if e.kind() != std::io::ErrorKind::NotFound {
                    tracing::warn!(error = %e, path = %path.display(), "the note not sent could not be read");
                }
                return None;
            }
        };
        match serde_json::from_slice::<NoteText>(&bytes) {
            Ok(text) if !text.is_empty() => Some(text),
            Ok(_) => None,
            Err(error) => {
                tracing::warn!(%error, path = %path.display(), "the note not sent is not one");
                None
            }
        }
    }

    /// Keeps the note written and not sent, in place of what was kept
    /// before, whole or not at all. A note that holds nothing is no note:
    /// what was kept of its text goes, and its files are left for a window
    /// that next takes the folder to clear, so that a file being added
    /// while the note is empty is not taken from under it.
    pub fn keep(&self, text: &NoteText) -> Result<()> {
        let dir = self.unsent_dir()?;
        if text.is_empty() {
            let path = dir.join(TEXT);
            return match fs::remove_file(&path) {
                Err(e) if e.kind() != std::io::ErrorKind::NotFound => {
                    Err(e).context(|| tr!("io-removing", path = &path))
                }
                _ => Ok(()),
            };
        }
        let bytes = serde_json::to_vec(text)?;
        if bytes.len() > MAX_TEXT * 2 {
            return Err(Error::invalid(tr!("core-notebook-note-too-large", most = (MAX_TEXT / (1024 * 1024)) as u64)));
        }
        write_atomic(&dir.join(TEXT), &bytes)
    }

    /// Forgets the note kept, and the files added to it. None kept is
    /// forgotten already. The folder stays claimed, empty.
    fn forget(&self) -> Result<()> {
        let dir = self.unsent_dir()?;
        match fs::remove_dir_all(&dir) {
            Err(e) if e.kind() != std::io::ErrorKind::NotFound => Err(e).context(|| tr!("io-removing", path = &dir)),
            _ => Ok(()),
        }
    }

    /// Adds a file of this computer to the note: a copy of it is kept
    /// beside the text, by what it holds. One larger than `MAX_FILE` is
    /// refused.
    pub fn add_file(&self, path: &Path) -> Result<Added> {
        let name = path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
        let meta = fs::metadata(path).context(|| tr!("io-reading", path = path))?;
        if !meta.is_file() {
            return Err(Error::invalid(tr!("core-library-not-a-file", path = path)));
        }
        if meta.len() > MAX_FILE as u64 {
            return Err(file_too_large(&name));
        }
        let hash = hash_file(path)?;
        let dir = self.unsent_dir()?;
        let there = dir.join(&hash);
        if !there.is_file() {
            fs::create_dir_all(&dir).context(|| tr!("io-creating", path = &dir))?;
            // Copied under a name that is no hash first, so that a copy cut short is never taken for the file.
            let copying = dir.join(format!(".tmp-{hash}"));
            fs::copy(path, &copying).context(|| tr!("io-writing", path = &copying))?;
            fs::rename(&copying, &there).context(|| tr!("io-writing", path = &there))?;
        }
        let extension = ending(&name);
        let width = PICTURES
            .contains(&extension.as_str())
            .then(|| {
                // Kept by its hash, with no ending to tell its kind: known by what it holds.
                image::ImageReader::open(&there)
                    .ok()
                    .and_then(|r| r.with_guessed_format().ok())
                    .and_then(|r| r.into_dimensions().ok())
                    .map(|(w, _)| w)
            })
            .flatten();
        Ok(Added { hash, name, extension, size: meta.len(), width })
    }

    /// Adds a file the window holds to the note, by its name and its
    /// bytes: a picture pasted. One larger than `MAX_FILE` is refused.
    pub fn add_bytes(&self, name: &str, bytes: &[u8]) -> Result<Added> {
        if bytes.len() > MAX_FILE {
            return Err(file_too_large(name));
        }
        let hash = hash_bytes(bytes);
        let there = self.unsent_dir()?.join(&hash);
        if !there.is_file() {
            write_atomic(&there, bytes)?;
        }
        let extension = ending(name);
        let width = PICTURES
            .contains(&extension.as_str())
            .then(|| {
                image::ImageReader::new(Cursor::new(bytes))
                    .with_guessed_format()
                    .ok()
                    .and_then(|r| r.into_dimensions().ok())
                    .map(|(w, _)| w)
            })
            .flatten();
        Ok(Added { hash, name: name.to_owned(), extension, size: bytes.len() as u64, width })
    }

    /// Where a file added to the note lies, by what it holds.
    pub fn file_path(&self, hash: &str) -> Result<PathBuf> {
        let path = self.unsent_dir()?.join(hash);
        if is_hash(hash) && path.is_file() { Ok(path) } else { Err(Error::not_found(hash.to_owned())) }
    }

    /// Writes the note into the notebook's inbox, with when, its files
    /// moved there with it, whole or not at all; and forgets what was kept
    /// of it, and the files added and taken out of it again. A note that
    /// holds nothing is refused, and nothing is written. Gives the id of
    /// the thing in the inbox.
    pub fn send(&self, text: &NoteText) -> Result<String> {
        if text.is_empty() {
            return Err(Error::invalid(tr!("core-notebook-note-empty")));
        }
        let note = Collected {
            kind: Kind::Note,
            url: String::new(),
            title: String::new(),
            when: crate::library::now(),
            text: text.words.clone(),
            html: String::new(),
            alt: String::new(),
            name: String::new(),
            doc: text.doc.clone(),
            files: text.files.clone(),
        };
        let id = self.inbox.put_note(&note, &self.unsent_dir()?)?;
        // Kept, it would be there to be sent again when the window is next opened.
        if let Err(error) = self.forget() {
            tracing::warn!(%error, "a note was sent, and what was kept of it could not be forgotten");
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

    /// A PNG three pixels wide, made here.
    fn png() -> Vec<u8> {
        let mut bytes = Cursor::new(Vec::new());
        image::RgbImage::from_pixel(3, 2, image::Rgb([200, 30, 30]))
            .write_to(&mut bytes, image::ImageFormat::Png)
            .unwrap();
        bytes.into_inner()
    }

    /// A note of a list, a bold word, a picture and a file, as the window hands it over.
    fn text(picture: &Added, file: &Added) -> NoteText {
        let doc = serde_json::json!({"type": "doc", "content": [
            {"type": "paragraph", "attrs": {"kind": "item"}, "content": [{"type": "text", "text": "First"}]},
            {"type": "paragraph", "attrs": {"kind": "numbered"}, "content": [{"type": "text", "text": "Counted"}]},
            {"type": "paragraph", "attrs": {"kind": "todo"}, "content": [{"type": "text", "text": "To do"}]},
            {"type": "paragraph", "content": [
                {"type": "text", "text": "A "}, {"type": "text", "text": "bold", "marks": [{"type": "strong"}]}]},
            {"type": "figure", "attrs": {"file": picture.hash, "extension": "png", "name": picture.name}},
            {"type": "file", "attrs": {"hash": file.hash, "name": file.name, "extension": "pdf"}},
        ]});
        NoteText {
            doc,
            words: "First\nCounted\nTo do\nA bold".into(),
            files: vec![
                HeldFile { hash: picture.hash.clone(), name: picture.name.clone() },
                HeldFile { hash: file.hash.clone(), name: file.name.clone() },
            ],
        }
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
    fn files_are_added_by_what_they_hold_and_found_again() {
        let (tmp, window) = window();
        let source = tmp.path().join("Holiday.PNG");
        fs::write(&source, png()).unwrap();
        let added = window.add_file(&source).unwrap();
        assert_eq!(added.hash, hash_bytes(&png()));
        assert_eq!((added.name.as_str(), added.extension.as_str(), added.width), ("Holiday.PNG", "png", Some(3)));
        assert_eq!(fs::read(window.file_path(&added.hash).unwrap()).unwrap(), png());
        assert!(source.is_file(), "copied, not moved");
        // Pasted, the same picture is the same file.
        let pasted = window.add_bytes("image.png", &png()).unwrap();
        assert_eq!(pasted.hash, added.hash);
        assert_eq!(pasted.width, Some(3));
        let letter = tmp.path().join("letter.pdf");
        fs::write(&letter, b"%PDF-1.4").unwrap();
        let file = window.add_file(&letter).unwrap();
        assert_eq!((file.extension.as_str(), file.width, file.size), ("pdf", None, 8));
        assert!(window.file_path("../note.json").is_err());
        assert!(window.file_path(&"0".repeat(64)).is_err());
        assert!(window.add_file(tmp.path()).is_err(), "a folder is no file");
    }

    #[test]
    fn a_file_too_large_is_not_added() {
        let (tmp, window) = window();
        let large = tmp.path().join("large.bin");
        fs::File::create(&large).unwrap().set_len(MAX_FILE as u64 + 1).unwrap();
        let error = window.add_file(&large).unwrap_err();
        assert!(error.to_string().contains("large.bin"), "{error}");
        let kept = fs::read_dir(window.unsent_dir().unwrap()).map(|d| d.count()).unwrap_or(0);
        assert_eq!(kept, 0, "nothing of it is kept");
        assert!(window.add_bytes("large.png", &vec![0u8; MAX_FILE + 1]).is_err());
    }

    #[test]
    fn a_note_sent_lies_in_the_inbox_with_its_text_and_its_files() {
        let (tmp, window) = window();
        let source = tmp.path().join("plate.png");
        fs::write(&source, png()).unwrap();
        let picture = window.add_file(&source).unwrap();
        let letter = tmp.path().join("letter.pdf");
        fs::write(&letter, b"%PDF-1.4").unwrap();
        let file = window.add_file(&letter).unwrap();
        let text = text(&picture, &file);
        let id = window.send(&text).unwrap();
        let (note, image) = window.inbox().read(&id).unwrap();
        assert_eq!(note.kind, Kind::Note);
        assert_eq!(note.text, text.words);
        assert_eq!(note.doc, text.doc);
        assert_eq!(note.files, text.files);
        assert!(note.url.is_empty() && note.title.is_empty() && note.html.is_empty());
        assert!(note.when.starts_with("20") && note.when.contains('T'), "{}", note.when);
        assert_eq!(image, None);
        assert_eq!(fs::read(window.inbox().file_of(&id, &picture.hash).unwrap()).unwrap(), png());
        assert_eq!(fs::read(window.inbox().file_of(&id, &file.hash).unwrap()).unwrap(), b"%PDF-1.4");
        assert!(!window.unsent_dir().unwrap().exists(), "nothing is kept of what was sent");
    }

    #[test]
    fn a_note_of_nothing_is_not_sent() {
        let (_tmp, window) = window();
        assert!(window.send(&NoteText::default()).is_err());
        let spaces = NoteText { words: " \n\t ".into(), ..NoteText::default() };
        assert!(window.send(&spaces).is_err());
        assert!(window.inbox().ids().is_empty());
        // A picture alone is a note.
        let picture = window.add_bytes("image.png", &png()).unwrap();
        let alone = NoteText {
            doc: serde_json::json!({"type": "doc", "content": [{"type": "figure", "attrs": {"file": picture.hash}}]}),
            words: String::new(),
            files: vec![HeldFile { hash: picture.hash.clone(), name: picture.name.clone() }],
        };
        window.send(&alone).unwrap();
        assert_eq!(window.inbox().ids().len(), 1);
    }

    #[test]
    fn the_note_not_sent_is_kept_read_replaced_and_removed() {
        let (tmp, window) = window();
        assert_eq!(window.unsent(), None);
        let first = NoteText { doc: serde_json::json!({"type": "doc"}), words: "First".into(), files: Vec::new() };
        window.keep(&first).unwrap();
        assert_eq!(window.unsent(), Some(first));
        let source = tmp.path().join("plate.png");
        fs::write(&source, png()).unwrap();
        let picture = window.add_file(&source).unwrap();
        let letter = tmp.path().join("letter.pdf");
        fs::write(&letter, b"%PDF-1.4").unwrap();
        let file = window.add_file(&letter).unwrap();
        let second = text(&picture, &file);
        window.keep(&second).unwrap();
        assert_eq!(window.unsent(), Some(second));
        assert!(window.file_path(&picture.hash).is_ok());
        // Emptied: no note to keep; its files stay while the window is open.
        window.keep(&NoteText { words: "  \n".into(), ..NoteText::default() }).unwrap();
        assert_eq!(window.unsent(), None);
        assert!(window.file_path(&picture.hash).is_ok());
        // What cannot be read is no note.
        window.keep(&NoteText { words: "Again".into(), ..NoteText::default() }).unwrap();
        fs::write(window.unsent_dir().unwrap().join(TEXT), "{ not whole").unwrap();
        assert_eq!(window.unsent(), None);
        // A window that next takes the folder finds no note, and clears what was left in it.
        let data = window.data().clone();
        drop(window);
        let next = NoteWindow::new(data);
        assert_eq!(next.unsent(), None);
        assert!(next.file_path(&picture.hash).is_err());
    }

    #[test]
    fn two_windows_open_at_once_keep_two_notes_and_a_window_opened_later_goes_on_with_the_oldest() {
        let (_tmp, first) = window();
        let data = first.data().clone();
        first.keep(&NoteText { words: "One".into(), ..NoteText::default() }).unwrap();
        let second = NoteWindow::new(data.clone());
        assert_eq!(second.unsent(), None, "the first window has its note");
        second.keep(&NoteText { words: "Two".into(), ..NoteText::default() }).unwrap();
        assert_eq!(first.unsent().unwrap().words, "One", "neither writes into the other's");
        drop(first);
        drop(second);
        let third = NoteWindow::new(data.clone());
        assert_eq!(third.unsent().unwrap().words, "One", "the oldest first");
        let fourth = NoteWindow::new(data.clone());
        assert_eq!(fourth.unsent().unwrap().words, "Two");
        let fifth = NoteWindow::new(data);
        assert_eq!(fifth.unsent(), None, "both are had");
        third.send(&third.unsent().unwrap()).unwrap();
        assert_eq!(third.inbox().ids().len(), 1);
        assert_eq!(fourth.unsent().unwrap().words, "Two", "sending one leaves the other");
    }

    #[test]
    fn what_cannot_be_sent_is_still_kept_with_its_files() {
        let (tmp, window) = window();
        let source = tmp.path().join("plate.png");
        fs::write(&source, png()).unwrap();
        let picture = window.add_file(&source).unwrap();
        let letter = tmp.path().join("letter.pdf");
        fs::write(&letter, b"%PDF-1.4").unwrap();
        let file = window.add_file(&letter).unwrap();
        let text = text(&picture, &file);
        window.keep(&text).unwrap();
        // The inbox cannot be made: a file stands where it would be.
        fs::create_dir_all(window.data().notebook()).unwrap();
        fs::write(window.inbox().dir(), "in the way").unwrap();
        assert!(window.send(&text).is_err());
        assert_eq!(window.unsent(), Some(text));
        assert!(window.file_path(&picture.hash).is_ok() && window.file_path(&file.hash).is_ok());
    }

    #[test]
    fn a_data_folder_not_yet_there_is_made_when_a_note_is_first_kept() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().join("never started");
        let window = NoteWindow::new(DataDir::at(&root));
        assert!(!root.exists(), "nothing is made by opening the window");
        assert_eq!(window.unsent(), None);
        assert!(window.settings().is_empty());
        assert!(!root.exists(), "nor by reading");
        let words = NoteText { words: "Words".into(), ..NoteText::default() };
        window.keep(&words).unwrap();
        window.send(&words).unwrap();
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
