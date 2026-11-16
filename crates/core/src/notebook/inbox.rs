//! The notebook's inbox: what the plugin for Firefox hands to the helper
//! (`host`), and the notes written in a window of their own (`note`),
//! kept until the application takes them in. Neither writer needs a
//! running application, and the application is reached from nowhere: it
//! looks here at its start and while it runs.
//!
//! ```text
//! notebook/inbox/<id>/item.json   what the thing is (`Collected`)
//! notebook/inbox/<id>/image       its picture, as it came, where it has one
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

use crate::error::{Error, IoContext, Result};
use crate::paths::DataDir;
use crate::tr;

/// The most a picture may be, in bytes.
pub const MAX_PICTURE: usize = 50 * 1024 * 1024;
/// The most the words, and the HTML, of a thing may be, in bytes each.
pub const MAX_TEXT: usize = 8 * 1024 * 1024;
/// The most signs of an address.
pub const MAX_URL: usize = 8_000;
/// The most signs of a title, of what an image says it shows, of a name.
pub const MAX_SHORT: usize = 2_000;

const FOLDER: &str = "inbox";
const ITEM: &str = "item.json";
const IMAGE: &str = "image";
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
        let random = uuid::Uuid::new_v4().simple().to_string();
        format!("{ms:013}-{}", &random[..8])
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

    #[test]
    fn what_the_plugin_leaves_out_is_empty() {
        let collected: Collected = serde_json::from_str(r#"{"kind":"selection","text":"x"}"#).unwrap();
        assert_eq!(collected.kind, Kind::Selection);
        assert_eq!(collected.text, "x");
        assert!(collected.url.is_empty() && collected.html.is_empty());
        assert!(serde_json::from_str::<Collected>(r#"{"text":"x"}"#).is_err(), "a kind it must have");
        assert!(serde_json::from_str::<Collected>(r#"{"kind":"video"}"#).is_err());
    }
}
