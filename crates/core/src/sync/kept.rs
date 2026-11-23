//! What this computer keeps of being synchronized (record 0120).
//!
//! ```text
//! sync/sync.json          the server, the home, who this computer is in it, and what it takes of it (`Takes`)
//! sync/sync.key           the token that admits it, readable by the user alone
//! sync/home.bin           the home document, as one update (`home`)
//! sync/home.unsent        there while it holds what the server was not sent
//! sync/home/sync.json     what was last seen of the server's home document
//! sync/library.bin        the library's document, and the same of it (`library`)
//! sync/library.unsent
//! sync/library/sync.json
//! sync/base/<name>.json   what a store and its map agreed on when they last met (`mirror`)
//! sync/<name>.json        what a round keeps from one run to the next (`note`): how the library's
//!                         files lay (`library-lies`), whether the notebook was refused (`notebook-refused`),
//!                         that the synchronization stopped for a later form, with what the version
//!                         knew then (`outdated`)
//! ```
//!
//! and, with each document that is synchronized, in its own folder:
//!
//! ```text
//! sync.json               what was last seen of the server's document
//! sync.had                the moment the document here was at then
//! apart.json              of a project: that it was written in on two computers apart
//! ```
//!
//! These two lie with the document so that a project that goes to the trash
//! and comes back says the right thing of itself.
//!
//! A device takes everything of its home (a computer) or the notes (a
//! phone): the notebook, the files its notes hold, and the references
//! without their files (`Takes`; the plan `docs/plans/an-app-for-android.md`).
//! A phone keeps the home document as it came, in `sync/home.bin`, and with
//! it what was last seen of the server's, in `sync/home/`: `sync.json`, and
//! `sync.had` beside it, as with every document. Nothing else of the home
//! document is kept on a phone: no `home.unsent`, and in `sync/base/` only
//! what the stores of the library agreed on.

use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};

use crate::error::{Error, IoContext, Result};
use crate::fsutil::write_atomic;
use crate::paths::DataDir;
use crate::tr;

use super::whole::Lies;

const JOINED: &str = "sync.json";
const TOKEN: &str = "sync.key";
const BASE: &str = "base";

/// What a device takes of its home.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Takes {
    /// Everything: a computer.
    #[default]
    Everything,
    /// The notes: a phone. The notebook, the files its notes hold, and the references without their files.
    Notes,
}

impl Takes {
    /// What two of them both allow: the one where they are the same, the
    /// notes where they differ. A device does no more than the role it runs
    /// in and what it joined its home as both allow, so that it takes two
    /// things to be wrong, the program and the file, before a phone does
    /// what only a computer may.
    pub fn narrower(self, other: Takes) -> Takes {
        if self == other { self } else { Takes::Notes }
    }
}

/// The home this computer is in, and who it is there.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Joined {
    /// The address of the server, as it is kept.
    pub server: String,
    pub home: String,
    /// This computer, as the home knows it.
    pub device: String,
    /// What this computer is called among the others.
    pub name: String,
    /// What it takes of the home, as the role that joined said it. One kept
    /// before this was said says nothing of it, and is read as everything:
    /// only computers could join then.
    pub takes: Takes,
}

/// The folder where it is kept.
#[derive(Debug, Clone)]
pub struct Kept {
    dir: PathBuf,
}

fn read_json<T: DeserializeOwned>(path: &Path) -> Result<Option<T>> {
    let text = match fs::read_to_string(path) {
        Ok(text) => text,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(e) => return Err(e).context(|| tr!("io-reading", path = path)),
    };
    serde_json::from_str(&text).map(Some).map_err(|e| Error::Parse { path: path.to_owned(), message: e.to_string() })
}

fn write_json<T: Serialize>(path: &Path, value: &T) -> Result<()> {
    if let Some(dir) = path.parent() {
        fs::create_dir_all(dir).context(|| tr!("io-creating", path = dir))?;
    }
    write_atomic(path, serde_json::to_string_pretty(value)?.as_bytes())
}

fn remove(path: &Path) -> Result<()> {
    match fs::remove_file(path) {
        Ok(()) => Ok(()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(e).context(|| tr!("io-removing", path = path)),
    }
}

impl Kept {
    pub fn new(data: &DataDir) -> Self {
        Self::at(data.sync())
    }

    pub fn at(dir: impl Into<PathBuf>) -> Self {
        Kept { dir: dir.into() }
    }

    /// The home this computer is in, with the token that admits it; nothing
    /// where it is in none. Without the token it is in none.
    pub fn joined(&self) -> Result<Option<(Joined, String)>> {
        let Some(joined) = read_json::<Joined>(&self.dir.join(JOINED))? else { return Ok(None) };
        let token = match fs::read_to_string(self.dir.join(TOKEN)) {
            Ok(text) => text.trim().to_owned(),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(None),
            Err(e) => return Err(e).context(|| tr!("io-reading", path = &self.dir.join(TOKEN))),
        };
        if token.is_empty() || joined.home.is_empty() || joined.server.is_empty() {
            return Ok(None);
        }
        Ok(Some((joined, token)))
    }

    /// Notes that this computer is in a home. Whatever was kept of another
    /// home is forgotten first.
    pub fn join(&self, joined: &Joined, token: &str) -> Result<()> {
        self.leave()?;
        fs::create_dir_all(&self.dir).context(|| tr!("io-creating", path = &self.dir))?;
        let key = self.dir.join(TOKEN);
        write_atomic(&key, token.trim().as_bytes())?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&key, fs::Permissions::from_mode(0o600))
                .context(|| tr!("core-projects-closing", path = &key))?;
        }
        write_json(&self.dir.join(JOINED), joined)
    }

    /// Changes what this computer is called.
    pub fn rename(&self, name: &str) -> Result<()> {
        let path = self.dir.join(JOINED);
        let Some(mut joined) = read_json::<Joined>(&path)? else { return Ok(()) };
        joined.name = name.to_owned();
        write_json(&path, &joined)
    }

    /// Forgets the home: this computer is in none. What it holds of projects,
    /// notes and all else stays as it is.
    pub fn leave(&self) -> Result<()> {
        match fs::remove_dir_all(&self.dir) {
            Ok(()) => Ok(()),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
            Err(e) => Err(e).context(|| tr!("io-removing", path = &self.dir)),
        }
    }

    /// A document of maps the core makes itself, by its kind (`home`,
    /// `library`), as it was last written; nothing before the first time.
    pub fn doc(&self, kind: &str) -> Result<Option<Vec<u8>>> {
        let path = self.dir.join(format!("{kind}.bin"));
        match fs::read(&path) {
            Ok(bytes) => Ok(Some(bytes)),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
            Err(e) => Err(e).context(|| tr!("io-reading", path = &path)),
        }
    }

    pub fn keep_doc(&self, kind: &str, state: &[u8]) -> Result<()> {
        fs::create_dir_all(&self.dir).context(|| tr!("io-creating", path = &self.dir))?;
        write_atomic(&self.dir.join(format!("{kind}.bin")), state)
    }

    /// Where what was last seen of the server's document of this kind is
    /// kept, as a document's is kept in its folder: a folder of its own,
    /// since what says which home this computer is in has the same name.
    pub fn of_doc(&self, kind: &str) -> Result<PathBuf> {
        let dir = self.dir.join(kind);
        fs::create_dir_all(&dir).context(|| tr!("io-creating", path = &dir))?;
        Ok(dir)
    }

    /// Notes that a document of maps holds something the server was not
    /// sent, or that it was sent: kept on disk, since a name taken out of a
    /// map shows in no state vector, and the application may end between
    /// the writing and the sending.
    pub fn mark_unsent(&self, kind: &str, unsent: bool) -> Result<()> {
        let path = self.dir.join(format!("{kind}.unsent"));
        if unsent {
            fs::create_dir_all(&self.dir).context(|| tr!("io-creating", path = &self.dir))?;
            write_atomic(&path, b"")
        } else {
            remove(&path)
        }
    }

    pub fn unsent(&self, kind: &str) -> bool {
        self.dir.join(format!("{kind}.unsent")).is_file()
    }

    /// What a round keeps from one run to the next under a name; nothing
    /// where nothing was kept, or what was kept cannot be read.
    pub fn noted<T: DeserializeOwned>(&self, name: &str) -> Option<T> {
        read_json(&self.dir.join(format!("{name}.json"))).ok().flatten()
    }

    pub fn note<T: Serialize>(&self, name: &str, value: &T) -> Result<()> {
        write_json(&self.dir.join(format!("{name}.json")), value)
    }

    /// Forgets what a round kept under a name: the next finds nothing kept of it.
    pub fn forget_note(&self, name: &str) -> Result<()> {
        remove(&self.dir.join(format!("{name}.json")))
    }

    fn base_file(&self, name: &str) -> PathBuf {
        self.dir.join(BASE).join(format!("{name}.json"))
    }

    /// What a store and its map agreed on when they last met; nothing where
    /// they have not met.
    pub fn base(&self, name: &str) -> Result<Option<BTreeMap<String, String>>> {
        read_json(&self.base_file(name))
    }

    pub fn keep_base(&self, name: &str, agreed: &BTreeMap<String, String>) -> Result<()> {
        write_json(&self.base_file(name), agreed)
    }

    /// Forgets what a store and its map agreed on: they meet the next time
    /// as for the first time, where what the map says stands and nothing is
    /// taken out of either.
    pub fn forget_base(&self, name: &str) -> Result<()> {
        remove(&self.base_file(name))
    }
}

/// What was last seen of the server's document, kept with the document here.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Cursor {
    /// The home it was seen in: one kept for another home says nothing.
    pub home: String,
    /// The document it is of, by kind and id: a project that came back from
    /// the trash under another id is not the one it was.
    pub doc: String,
    /// The digest of the server's document then.
    pub seen: Option<String>,
    /// The state vector of the server's document then, in hex.
    pub since: Option<String>,
    /// How the document lay here then.
    pub lies: Lies,
}

const CURSOR: &str = "sync.json";
const HAD: &str = "sync.had";

/// What is kept in `dir` of the server's document `doc` of `home`; nothing
/// where nothing is, or where it is of another.
pub fn cursor(dir: &Path, home: &str, doc: &str) -> Option<Cursor> {
    match read_json::<Cursor>(&dir.join(CURSOR)) {
        Ok(Some(cursor)) if cursor.home == home && cursor.doc == doc => Some(cursor),
        Ok(_) => None,
        Err(error) => {
            tracing::warn!(%error, "what was last seen of a document on the server cannot be read, and is asked anew");
            None
        }
    }
}

/// The moment the document here was at when the server's was last seen.
pub fn had(dir: &Path) -> Option<Vec<u8>> {
    fs::read(dir.join(HAD)).ok()
}

/// Keeps what was seen, and the moment the document here was at.
pub fn keep_cursor(dir: &Path, cursor: &Cursor, had: &[u8]) -> Result<()> {
    write_atomic(&dir.join(HAD), had)?;
    write_json(&dir.join(CURSOR), cursor)
}

/// Forgets what was seen: the next exchange asks for everything.
pub fn forget_cursor(dir: &Path) -> Result<()> {
    remove(&dir.join(CURSOR))?;
    remove(&dir.join(HAD))
}

/// That a project was written in on two computers while they were apart,
/// kept with the project until the writer has seen it.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Apart {
    /// When the other computer's changes came in, in milliseconds since 1970.
    pub time: i64,
    /// The moment before they did, as Yjs writes a snapshot, in base64: the
    /// review of the project shows the changes from it.
    pub moment: String,
    /// The project as it stood here then, among its earlier versions: the
    /// name of the entry of its history.
    pub kept: Option<String>,
}

const APART: &str = "apart.json";

pub fn apart(dir: &Path) -> Option<Apart> {
    read_json(&dir.join(APART)).ok().flatten()
}

/// Notes that a project was written in apart. One that is noted already and
/// not yet seen keeps the moment it has: the writer is to see everything
/// that came since they last looked.
pub fn keep_apart(dir: &Path, new: &Apart) -> Result<()> {
    if apart(dir).is_some() {
        return Ok(());
    }
    write_json(&dir.join(APART), new)
}

pub fn forget_apart(dir: &Path) -> Result<()> {
    remove(&dir.join(APART))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn joined() -> Joined {
        Joined {
            server: "https://glaukopis.example.org".into(),
            home: "h".into(),
            device: "d".into(),
            name: "The laptop".into(),
            takes: Takes::Everything,
        }
    }

    #[test]
    fn what_a_device_takes_is_kept_and_read_again() {
        let tmp = tempfile::tempdir().unwrap();
        let kept = Kept::at(tmp.path().join("sync"));
        for (takes, said) in [(Takes::Notes, "\"takes\": \"notes\""), (Takes::Everything, "\"takes\": \"everything\"")]
        {
            let device = Joined { takes, ..joined() };
            kept.join(&device, "t").unwrap();
            let written = fs::read_to_string(tmp.path().join("sync").join(JOINED)).unwrap();
            assert!(written.contains(said), "{written}");
            assert_eq!(kept.joined().unwrap().unwrap().0.takes, takes);
            // A new name leaves it as it is.
            kept.rename("Another name").unwrap();
            assert_eq!(kept.joined().unwrap().unwrap().0, Joined { name: "Another name".into(), ..device });
        }
    }

    #[test]
    fn what_was_kept_before_a_device_said_what_it_takes_is_read_as_everything() {
        let tmp = tempfile::tempdir().unwrap();
        let kept = Kept::at(tmp.path());
        // As it was written when only computers could join.
        let before = r#"{
  "server": "https://glaukopis.example.org",
  "home": "h",
  "device": "d",
  "name": "The laptop"
}"#;
        fs::write(tmp.path().join(JOINED), before).unwrap();
        fs::write(tmp.path().join(TOKEN), "t").unwrap();
        assert_eq!(kept.joined().unwrap(), Some((joined(), "t".to_owned())));
        assert_eq!(kept.joined().unwrap().unwrap().0.takes, Takes::Everything);
    }

    #[test]
    fn the_narrower_of_two_is_the_notes_wherever_they_differ() {
        use Takes::{Everything, Notes};
        assert_eq!(Everything.narrower(Everything), Everything);
        assert_eq!(Notes.narrower(Notes), Notes);
        assert_eq!(Everything.narrower(Notes), Notes);
        assert_eq!(Notes.narrower(Everything), Notes);
    }

    #[test]
    fn a_home_is_joined_and_left() {
        let tmp = tempfile::tempdir().unwrap();
        let kept = Kept::at(tmp.path().join("sync"));
        assert_eq!(kept.joined().unwrap(), None);
        kept.join(&joined(), " a-token\n").unwrap();
        assert_eq!(kept.joined().unwrap(), Some((joined(), "a-token".to_owned())));
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mode = fs::metadata(tmp.path().join("sync").join(TOKEN)).unwrap().permissions().mode();
            assert_eq!(mode & 0o777, 0o600, "the token is the user's alone to read");
        }
        kept.rename("The desk").unwrap();
        assert_eq!(kept.joined().unwrap().unwrap().0.name, "The desk");
        kept.keep_doc("home", b"state").unwrap();
        kept.keep_doc("library", b"another").unwrap();
        assert_eq!(kept.doc("home").unwrap().as_deref(), Some(&b"state"[..]));
        kept.mark_unsent("library", true).unwrap();
        assert!(kept.unsent("library") && !kept.unsent("home"), "each document says it of itself");
        kept.keep_base("folders", &BTreeMap::from([("a".to_owned(), "1".to_owned())])).unwrap();
        assert_eq!(kept.base("folders").unwrap().unwrap().len(), 1);
        assert_eq!(kept.base("settings").unwrap(), None);
        kept.note("lies", &[1, 2]).unwrap();
        assert_eq!(kept.noted::<Vec<u8>>("lies"), Some(vec![1, 2]));
        kept.keep_base("files", &BTreeMap::new()).unwrap();
        kept.forget_base("files").unwrap();
        assert_eq!(kept.base("files").unwrap(), None);

        // Joining another home forgets what was kept of the first.
        let other = Joined { home: "other".into(), ..joined() };
        kept.join(&other, "t").unwrap();
        assert_eq!(kept.doc("home").unwrap(), None);
        assert_eq!(kept.doc("library").unwrap(), None);
        assert_eq!(kept.base("folders").unwrap(), None);

        kept.leave().unwrap();
        assert_eq!(kept.joined().unwrap(), None);
        kept.leave().unwrap();
    }

    #[test]
    fn a_home_without_its_token_is_none() {
        let tmp = tempfile::tempdir().unwrap();
        let kept = Kept::at(tmp.path());
        kept.join(&joined(), "t").unwrap();
        fs::remove_file(tmp.path().join(TOKEN)).unwrap();
        assert_eq!(kept.joined().unwrap(), None);
    }

    #[test]
    fn what_was_seen_is_kept_with_the_document_and_says_nothing_of_another() {
        let tmp = tempfile::tempdir().unwrap();
        let seen = Cursor {
            home: "h".into(),
            doc: "project/p".into(),
            seen: Some("abc".into()),
            since: Some("00".into()),
            lies: Lies { state: (3, 4), log: (5, 6) },
        };
        assert_eq!(cursor(tmp.path(), "h", "project/p"), None);
        keep_cursor(tmp.path(), &seen, b"moment").unwrap();
        assert_eq!(cursor(tmp.path(), "h", "project/p"), Some(seen));
        assert_eq!(had(tmp.path()).as_deref(), Some(&b"moment"[..]));
        assert_eq!(cursor(tmp.path(), "another", "project/p"), None);
        assert_eq!(cursor(tmp.path(), "h", "project/q"), None);
        forget_cursor(tmp.path()).unwrap();
        assert_eq!(cursor(tmp.path(), "h", "project/p"), None);
        assert_eq!(had(tmp.path()), None);
        forget_cursor(tmp.path()).unwrap();
    }
}
