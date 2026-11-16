//! The notebook's inbox: what the plugin for Firefox hands to the helper
//! (`host`), and the notes written in a window of their own (`note`),
//! kept until the application takes them in. Neither writer needs a
//! running application, and the application is reached from nowhere: it
//! looks here at its start and while it runs.
//!
//! ```text
//! notebook/inbox/<id>/item.json   what the thing is (`Collected`)
//! notebook/inbox/<id>/image       its picture, as it came, where it has one
//! notebook/inbox/<id>/files/<hash> of a note, each file it holds, by what it holds
//! notebook/inbox/.tmp-<id>/       a thing being written
//! notebook/inbox/.unread-<id>/    a thing that could not be read, set aside
//! ```
//!
//! An `<id>` is thirteen digits of milliseconds, a dash and eight signs at
//! random, so that the ids sort by when the things came. A thing is written
//! whole into `.tmp-<id>` and only then named `<id>`, so that the
//! application never takes half of one. A name that begins with a dot is
//! no thing.

use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::sync::PoisonError;

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::error::{Error, IoContext, Result};
use crate::paths::DataDir;
use crate::tr;

/// The most a picture may be, in bytes.
pub const MAX_PICTURE: usize = 50 * 1024 * 1024;
/// The most each file a note holds may be, in bytes: what a picture may be.
pub const MAX_FILE: usize = MAX_PICTURE;
/// The most the words, and the HTML, of a thing may be, in bytes each.
pub const MAX_TEXT: usize = 8 * 1024 * 1024;
/// The most signs of an address.
pub const MAX_URL: usize = 8_000;
/// The most signs of a title, of what an image says it shows, of a name.
pub const MAX_SHORT: usize = 2_000;

const FOLDER: &str = "inbox";
const ITEM: &str = "item.json";
const IMAGE: &str = "image";
const FILES: &str = "files";
const WRITING: &str = ".tmp-";
const UNREAD: &str = ".unread-";

/// What a thing handed over is.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Kind {
    /// A page, with its readable text.
    Page,
    /// What was selected in a page.
    Selection,
    /// An image of a page, as it is shown.
    Image,
    /// A part of a page, as a picture.
    Region,
    /// A note its writer wrote in a window of its own (`note`): plain
    /// words, from no page. Never what the plugin hands over.
    Note,
}

/// A thing the plugin collected, as it sends it, or a note written in a
/// window of its own. Nothing of what the plugin sends is to be trusted: it
/// is what a page said.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Collected {
    pub kind: Kind,
    /// The address of the page.
    #[serde(default)]
    pub url: String,
    /// The title of the page.
    #[serde(default)]
    pub title: String,
    /// When it was collected, as the browser said: an ISO date-time.
    #[serde(default)]
    pub when: String,
    /// The words: of a page its readable text, of a selection what was selected.
    #[serde(default)]
    pub text: String,
    /// The same as HTML, where the plugin gave it.
    #[serde(default)]
    pub html: String,
    /// Of an image, what it says it shows.
    #[serde(default)]
    pub alt: String,
    /// Of an image, the name of its file, where it has one.
    #[serde(default)]
    pub name: String,
    /// Of a note, its text as the texts of the notebook are written
    /// (ProseMirror's JSON of the body schema), beside its plain words in
    /// `text` for whatever cannot read it. Nothing for the other kinds.
    #[serde(default, skip_serializing_if = "Value::is_null")]
    pub doc: Value,
    /// Of a note, the files it holds, which lie beside it in the inbox
    /// (`files/<hash>`). None for the other kinds.
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub files: Vec<HeldFile>,
}

/// A file a note holds: what it holds, as the store of files names it (the
/// SHA-256 of its bytes, in small hexadecimal letters), and what it is called.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct HeldFile {
    pub hash: String,
    pub name: String,
}

/// Whether `hash` names a file as the store does: 64 small hexadecimal
/// letters, and so a name that is nothing else.
pub fn is_hash(hash: &str) -> bool {
    hash.len() == 64 && hash.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}

impl Collected {
    /// The same, cut to the limits: the address at `MAX_URL` signs, the
    /// title, the alt text and the name at `MAX_SHORT`, the words and the
    /// HTML at `MAX_TEXT` bytes. Cut, not refused: a faulty page fills no disk.
    pub fn limited(mut self) -> Self {
        cut_signs(&mut self.url, MAX_URL);
        cut_signs(&mut self.title, MAX_SHORT);
        cut_signs(&mut self.alt, MAX_SHORT);
        cut_signs(&mut self.name, MAX_SHORT);
        cut_bytes(&mut self.text, MAX_TEXT);
        cut_bytes(&mut self.html, MAX_TEXT);
        for file in &mut self.files {
            cut_signs(&mut file.name, MAX_SHORT);
        }
        self
    }
}

/// Cuts `text` to at most `most` signs (characters).
fn cut_signs(text: &mut String, most: usize) {
    if let Some((at, _)) = text.char_indices().nth(most) {
        text.truncate(at);
    }
}

/// Cuts `text` to at most `most` bytes, where a sign begins.
pub(crate) fn cut_bytes(text: &mut String, most: usize) {
    if text.len() > most {
        let mut at = most;
        while !text.is_char_boundary(at) {
            at -= 1;
        }
        text.truncate(at);
    }
}

/// What the inbox holds, for the looking: it changes when something comes
/// or goes.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Stamp(Vec<String>);

impl Stamp {
    /// Whether things lie in the inbox.
    pub fn waiting(&self) -> bool {
        !self.0.is_empty()
    }
}

/// The notebook's inbox where it is kept.
#[derive(Debug)]
pub struct Inbox {
    dir: PathBuf,
    /// The milliseconds of the last thing put: the next is put later, so
    /// that two put within one millisecond keep their order.
    last: Mutex<i64>,
}

impl Inbox {
    /// The inbox of this data folder.
    pub fn new(data: &DataDir) -> Self {
        Self::at(data.notebook().join(FOLDER))
    }

    /// The inbox of the data folder at `root`, which is neither opened nor
    /// made: the helper's, which never makes the data folder.
    pub fn in_data_folder(root: &Path) -> Self {
        Self::at(root.join("notebook").join(FOLDER))
    }

    /// The inbox kept in `dir`, which is made when something is first put.
    pub fn at(dir: impl Into<PathBuf>) -> Self {
        Inbox { dir: dir.into(), last: Mutex::new(0) }
    }

    pub fn dir(&self) -> &Path {
        &self.dir
    }

    /// A new id, later than any this inbox has given.
    fn new_id(&self) -> String {
        let mut last = self.last.lock().unwrap_or_else(PoisonError::into_inner);
        let ms = crate::history::now_ms().max(*last + 1);
        *last = ms;
        id_at(ms)
    }

    /// Puts a thing into the inbox, cut to the limits, with its picture
    /// where it has one (as it came: what it is is told by its first
    /// bytes). It is there whole, or not at all. Gives its id.
    pub fn put(&self, collected: &Collected, picture: Option<&[u8]>) -> Result<String> {
        if picture.is_some_and(|p| p.len() > MAX_PICTURE) {
            return Err(too_large());
        }
        let item = serde_json::to_vec(&collected.clone().limited())?;
        fs::create_dir_all(&self.dir).context(|| tr!("io-creating", path = &self.dir))?;
        let id = self.new_id();
        let writing = self.dir.join(format!("{WRITING}{id}"));
        let written = (|| {
            fs::create_dir(&writing).context(|| tr!("io-creating", path = &writing))?;
            write_whole(&writing.join(ITEM), &item)?;
            if let Some(picture) = picture {
                write_whole(&writing.join(IMAGE), picture)?;
            }
            let there = self.dir.join(&id);
            fs::rename(&writing, &there).context(|| tr!("io-writing", path = &there))
        })();
        if let Err(error) = written {
            let _ = fs::remove_dir_all(&writing);
            return Err(error);
        }
        Ok(id)
    }

    /// Puts a note into the inbox, cut to the limits, with the files it
    /// holds moved into it from `from`, where each lies named by its hash
    /// (the same disk: a rename). It is there whole, or not at all: where
    /// it cannot be put, the files are moved back. Its text in `doc` is
    /// refused where it is larger than `MAX_TEXT`, a file where it is
    /// larger than `MAX_FILE`. Gives its id.
    pub fn put_note(&self, note: &Collected, from: &Path) -> Result<String> {
        let note = note.clone().limited();
        if serde_json::to_vec(&note.doc)?.len() > MAX_TEXT {
            return Err(Error::invalid(tr!("core-notebook-note-too-large", most = (MAX_TEXT / (1024 * 1024)) as u64)));
        }
        let item = serde_json::to_vec(&note)?;
        let mut hashes: Vec<&str> = Vec::new();
        for file in &note.files {
            if !is_hash(&file.hash) {
                return Err(Error::invalid(tr!("io-reading", path = &from.join(&file.hash))));
            }
            let path = from.join(&file.hash);
            let meta = fs::metadata(&path).context(|| tr!("io-reading", path = &path))?;
            if meta.len() > MAX_FILE as u64 {
                return Err(file_too_large(&file.name));
            }
            if !hashes.contains(&file.hash.as_str()) {
                hashes.push(&file.hash);
            }
        }
        fs::create_dir_all(&self.dir).context(|| tr!("io-creating", path = &self.dir))?;
        let id = self.new_id();
        let writing = self.dir.join(format!("{WRITING}{id}"));
        let held = writing.join(FILES);
        let mut moved: Vec<&str> = Vec::new();
        let written = (|| {
            fs::create_dir(&writing).context(|| tr!("io-creating", path = &writing))?;
            write_whole(&writing.join(ITEM), &item)?;
            if !hashes.is_empty() {
                fs::create_dir(&held).context(|| tr!("io-creating", path = &held))?;
            }
            for hash in &hashes {
                let there = held.join(hash);
                fs::rename(from.join(hash), &there).context(|| tr!("io-writing", path = &there))?;
                moved.push(hash);
            }
            let there = self.dir.join(&id);
            fs::rename(&writing, &there).context(|| tr!("io-writing", path = &there))
        })();
        if let Err(error) = written {
            for hash in moved {
                if let Err(e) = fs::rename(held.join(hash), from.join(hash)) {
                    tracing::error!(error = %e, hash, "a file of a note that could not be sent was not moved back");
                }
            }
            let _ = fs::remove_dir_all(&writing);
            return Err(error);
        }
        Ok(id)
    }

    /// Where a file a note in the inbox holds lies; a name that is no hash,
    /// and a file larger than `MAX_FILE`, are refused.
    pub fn file_of(&self, id: &str, hash: &str) -> Result<PathBuf> {
        let dir = self.of(id)?;
        if !is_hash(hash) {
            return Err(Error::invalid(tr!("io-reading", path = &dir.join(FILES).join(hash))));
        }
        let path = dir.join(FILES).join(hash);
        let meta = fs::metadata(&path).context(|| tr!("io-reading", path = &path))?;
        if meta.len() > MAX_FILE as u64 {
            return Err(too_large());
        }
        Ok(path)
    }

    /// The things in the inbox, by their ids, in the order they came. An
    /// inbox that is not there is empty.
    pub fn ids(&self) -> Vec<String> {
        let Ok(entries) = fs::read_dir(&self.dir) else { return Vec::new() };
        let mut ids: Vec<String> = entries
            .filter_map(|entry| entry.ok())
            .filter(|entry| entry.file_type().is_ok_and(|t| t.is_dir()))
            .filter_map(|entry| entry.file_name().into_string().ok())
            .filter(|name| !name.starts_with('.'))
            .collect();
        ids.sort();
        ids
    }

    /// What changes when something comes or goes: one look at the folder.
    pub fn stamp(&self) -> Stamp {
        Stamp(self.ids())
    }

    /// The folder of a thing; an id that is no name of one is refused.
    fn of(&self, id: &str) -> Result<PathBuf> {
        let plain = !id.is_empty() && !id.starts_with('.') && id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-');
        if !plain {
            return Err(Error::invalid(tr!("io-reading", path = &self.dir.join(id))));
        }
        Ok(self.dir.join(id))
    }

    /// A thing, cut to the limits, and its picture where it has one.
    pub fn read(&self, id: &str) -> Result<(Collected, Option<Vec<u8>>)> {
        let dir = self.of(id)?;
        let path = dir.join(ITEM);
        let bytes = fs::read(&path).context(|| tr!("io-reading", path = &path))?;
        let collected: Collected = serde_json::from_slice(&bytes)
            .map_err(|e| Error::invalid(format!("{}: {e}", tr!("io-reading", path = &path))))?;
        let path = dir.join(IMAGE);
        let picture = match fs::metadata(&path) {
            Ok(meta) if meta.len() > MAX_PICTURE as u64 => return Err(too_large()),
            Ok(_) => Some(fs::read(&path).context(|| tr!("io-reading", path = &path))?),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => None,
            Err(e) => return Err(e).context(|| tr!("io-reading", path = &path)),
        };
        Ok((collected.limited(), picture))
    }

    /// Removes a thing, once it is taken in. One not there is gone already.
    pub fn remove(&self, id: &str) -> Result<()> {
        let dir = self.of(id)?;
        match fs::remove_dir_all(&dir) {
            Err(e) if e.kind() != std::io::ErrorKind::NotFound => Err(e).context(|| tr!("io-removing", path = &dir)),
            _ => Ok(()),
        }
    }

    /// Sets a thing that cannot be read or taken aside, as `.unread-<id>`:
    /// neither lost nor in the way.
    pub fn set_aside(&self, id: &str) -> Result<()> {
        let dir = self.of(id)?;
        let aside = self.dir.join(format!("{UNREAD}{id}"));
        fs::rename(&dir, &aside).context(|| tr!("io-setting-aside", path = &dir))
    }
}

fn too_large() -> Error {
    Error::invalid(tr!("core-notebook-picture-too-large", most = (MAX_PICTURE / (1024 * 1024)) as u64))
}

/// An id of a thing, or of a note not sent, made now: thirteen digits of
/// milliseconds, a dash and eight signs at random.
pub(crate) fn new_id() -> String {
    id_at(crate::history::now_ms())
}

fn id_at(ms: i64) -> String {
    let random = uuid::Uuid::new_v4().simple().to_string();
    format!("{ms:013}-{}", &random[..8])
}

/// A file too large for a note, by what it is called.
pub(crate) fn file_too_large(name: &str) -> Error {
    Error::invalid(tr!("core-notebook-file-too-large", name = name, most = (MAX_FILE / (1024 * 1024)) as u64))
}

/// Writes a file and has it on the disk.
fn write_whole(path: &Path, bytes: &[u8]) -> Result<()> {
    let mut file = fs::File::create(path).context(|| tr!("io-creating", path = path))?;
    file.write_all(bytes).context(|| tr!("io-writing", path = path))?;
    file.sync_all().context(|| tr!("io-flushing", path = path))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn page(title: &str) -> Collected {
        Collected {
            kind: Kind::Page,
            url: "https://example.org/a".into(),
            title: title.into(),
            when: "2026-11-15T12:00:00.000Z".into(),
            text: "Words.".into(),
            html: "<p>Words.</p>".into(),
            alt: String::new(),
            name: String::new(),
            doc: Value::Null,
            files: Vec::new(),
        }
    }

    fn inbox() -> (tempfile::TempDir, Inbox) {
        let tmp = tempfile::tempdir().unwrap();
        let inbox = Inbox::at(tmp.path().join("notebook").join("inbox"));
        (tmp, inbox)
    }

    #[test]
    fn an_inbox_not_there_is_empty_and_is_not_made_by_looking() {
        let (_tmp, inbox) = inbox();
        assert!(inbox.ids().is_empty());
        assert!(!inbox.stamp().waiting());
        assert!(!inbox.dir().exists());
    }

    #[test]
    fn things_are_put_read_in_the_order_they_came_and_removed() {
        let (_tmp, inbox) = inbox();
        let first = inbox.put(&page("One"), None).unwrap();
        let second = inbox.put(&page("Two"), Some(b"\x89PNG\r\n\x1a\nrest")).unwrap();
        let third = inbox.put(&page("Three"), None).unwrap();
        assert_eq!(inbox.ids(), vec![first.clone(), second.clone(), third.clone()]);
        assert_eq!(first.len(), 13 + 1 + 8);
        assert!(first[..13].chars().all(|c| c.is_ascii_digit()) && &first[13..14] == "-");

        let (collected, picture) = inbox.read(&first).unwrap();
        assert_eq!(collected, page("One"));
        assert_eq!(picture, None);
        let (collected, picture) = inbox.read(&second).unwrap();
        assert_eq!(collected.title, "Two");
        assert_eq!(picture.as_deref(), Some(&b"\x89PNG\r\n\x1a\nrest"[..]));

        let before = inbox.stamp();
        inbox.remove(&second).unwrap();
        assert_ne!(inbox.stamp(), before, "what goes changes the stamp");
        assert_eq!(inbox.ids(), vec![first.clone(), third]);
        inbox.remove(&second).unwrap();
        assert!(inbox.read(&second).is_err());
    }

    #[test]
    fn what_comes_changes_the_stamp() {
        let (_tmp, inbox) = inbox();
        let empty = inbox.stamp();
        inbox.put(&page("One"), None).unwrap();
        let one = inbox.stamp();
        assert!(one.waiting());
        assert_ne!(one, empty);
        assert_eq!(inbox.stamp(), one, "nothing came: the same");
    }

    #[test]
    fn a_thing_set_aside_is_kept_and_out_of_the_way() {
        let (_tmp, inbox) = inbox();
        let id = inbox.put(&page("One"), None).unwrap();
        fs::write(inbox.dir().join(&id).join(ITEM), "{ not json").unwrap();
        assert!(inbox.read(&id).is_err());
        inbox.set_aside(&id).unwrap();
        assert!(inbox.ids().is_empty());
        assert!(inbox.dir().join(format!(".unread-{id}")).join(ITEM).is_file());
    }

    #[test]
    fn a_thing_being_written_and_other_names_are_no_things() {
        let (_tmp, inbox) = inbox();
        fs::create_dir_all(inbox.dir().join(".tmp-1763208000000-abcdefgh")).unwrap();
        fs::write(inbox.dir().join("1763208000000-loosefil"), "a file").unwrap();
        assert!(inbox.ids().is_empty());
        assert!(inbox.read("../x").is_err());
        assert!(inbox.read(".tmp-1763208000000-abcdefgh").is_err());
        assert!(inbox.remove("../x").is_err());
    }

    #[test]
    fn what_is_too_long_is_cut_and_a_picture_too_large_refused() {
        let (_tmp, inbox) = inbox();
        let mut long = page(&"é".repeat(MAX_SHORT + 5));
        long.url = "u".repeat(MAX_URL + 1);
        long.alt = "a".repeat(MAX_SHORT * 2);
        long.name = "n".repeat(MAX_SHORT + 1);
        long.text = format!("{}é", "t".repeat(MAX_TEXT - 1));
        long.html = "h".repeat(MAX_TEXT + 10);
        let id = inbox.put(&long, None).unwrap();
        let (read, _) = inbox.read(&id).unwrap();
        assert_eq!(read.title.chars().count(), MAX_SHORT);
        assert_eq!(read.url.len(), MAX_URL);
        assert_eq!(read.alt.len(), MAX_SHORT);
        assert_eq!(read.name.len(), MAX_SHORT);
        assert_eq!(read.text.len(), MAX_TEXT - 1, "cut where a sign begins");
        assert_eq!(read.html.len(), MAX_TEXT);

        let picture = vec![0u8; MAX_PICTURE + 1];
        assert!(inbox.put(&page("Large"), Some(&picture)).is_err());
        assert_eq!(inbox.ids(), vec![id], "nothing was left of it");
        assert_eq!(fs::read_dir(inbox.dir()).unwrap().count(), 1);
    }

    /// A note with a bold word, as the window of a note sends it, with the files it holds.
    fn note(files: Vec<HeldFile>) -> Collected {
        Collected {
            kind: Kind::Note,
            when: "2026-11-16T12:00:00Z".into(),
            text: "A bold word.".into(),
            html: String::new(),
            url: String::new(),
            title: String::new(),
            doc: serde_json::json!({"type": "doc", "content": [{"type": "paragraph", "content": [
                {"type": "text", "text": "A "}, {"type": "text", "text": "bold", "marks": [{"type": "strong"}]},
                {"type": "text", "text": " word."}]}]}),
            files,
            ..page("")
        }
    }

    #[test]
    fn a_note_is_put_with_its_files_moved_into_it_and_read_back() {
        let (tmp, inbox) = inbox();
        let from = tmp.path().join("unsent");
        fs::create_dir_all(&from).unwrap();
        let hash = "a".repeat(64);
        fs::write(from.join(&hash), b"%PDF-1.4").unwrap();
        let files = vec![HeldFile { hash: hash.clone(), name: "Letter.pdf".into() }];
        let id = inbox.put_note(&note(files.clone()), &from).unwrap();
        assert!(!from.join(&hash).exists(), "moved, not copied");
        let (read, picture) = inbox.read(&id).unwrap();
        assert_eq!(read, note(files));
        assert_eq!(picture, None);
        assert_eq!(fs::read(inbox.file_of(&id, &hash).unwrap()).unwrap(), b"%PDF-1.4");
        assert!(inbox.file_of(&id, "../item.json").is_err());
        assert!(inbox.file_of(&id, &"b".repeat(64)).is_err());
    }

    #[test]
    fn a_note_that_cannot_be_put_leaves_its_files_where_they_were() {
        let (tmp, inbox) = inbox();
        let from = tmp.path().join("unsent");
        fs::create_dir_all(&from).unwrap();
        let there = "c".repeat(64);
        fs::write(from.join(&there), b"one").unwrap();
        // The second file is not there: nothing is put, and the first is not moved.
        let files = vec![
            HeldFile { hash: there.clone(), name: "one.txt".into() },
            HeldFile { hash: "d".repeat(64), name: "two.txt".into() },
        ];
        assert!(inbox.put_note(&note(files), &from).is_err());
        assert!(from.join(&there).is_file());
        assert!(inbox.ids().is_empty());
        // A name that is no hash is refused.
        let files = vec![HeldFile { hash: "../../x".into(), name: "x".into() }];
        assert!(inbox.put_note(&note(files), &from).is_err());
        // A file too large is refused, and stays.
        let large = "e".repeat(64);
        fs::File::create(from.join(&large)).unwrap().set_len(MAX_FILE as u64 + 1).unwrap();
        let files = vec![HeldFile { hash: large.clone(), name: "large.bin".into() }];
        assert!(inbox.put_note(&note(files), &from).is_err());
        assert!(from.join(&large).is_file());
        assert!(inbox.ids().is_empty());
    }

    #[test]
    fn the_text_of_a_note_too_large_is_refused() {
        let (tmp, inbox) = inbox();
        let mut long = note(Vec::new());
        long.doc = serde_json::json!({"type": "doc", "content": [{"type": "paragraph", "content": [
            {"type": "text", "text": "w".repeat(MAX_TEXT)}]}]});
        assert!(inbox.put_note(&long, tmp.path()).is_err());
        assert!(inbox.ids().is_empty());
    }

    #[test]
    fn what_the_plugin_leaves_out_is_empty() {
        let collected: Collected = serde_json::from_str(r#"{"kind":"selection","text":"x"}"#).unwrap();
        assert_eq!(collected.kind, Kind::Selection);
        assert_eq!(collected.text, "x");
        assert!(collected.url.is_empty() && collected.html.is_empty());
        assert!(collected.doc.is_null() && collected.files.is_empty());
        assert!(serde_json::from_str::<Collected>(r#"{"text":"x"}"#).is_err(), "a kind it must have");
        assert!(serde_json::from_str::<Collected>(r#"{"kind":"video"}"#).is_err());
    }
}
