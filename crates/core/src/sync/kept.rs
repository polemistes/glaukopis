//! What this computer keeps of being synchronized (record 0119).
//!
//! ```text
//! sync/sync.json          the server, the home, and who this computer is in it
//! sync/sync.key           the token that admits it, readable by the user alone
//! sync/home.bin           the home document, as one update (`home`)
//! sync/home.unsent        there while it holds what the server was not sent
//! sync/base/<name>.json   what a store and its map agreed on when they last met (`mirror`)
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
const HOME: &str = "home.bin";
const BASE: &str = "base";
const UNSENT: &str = "home.unsent";

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

    /// The home document as it was last written; nothing before the first time.
    pub fn home(&self) -> Result<Option<Vec<u8>>> {
        match fs::read(self.dir.join(HOME)) {
            Ok(bytes) => Ok(Some(bytes)),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
            Err(e) => Err(e).context(|| tr!("io-reading", path = &self.dir.join(HOME))),
        }
    }

    pub fn keep_home(&self, state: &[u8]) -> Result<()> {
        fs::create_dir_all(&self.dir).context(|| tr!("io-creating", path = &self.dir))?;
        write_atomic(&self.dir.join(HOME), state)
    }

    /// Where what is last seen of the server's home document is kept: the
    /// folder itself, as a document's is kept with the document.
    pub fn dir(&self) -> &Path {
        &self.dir
    }

    /// Notes that the home document holds something the server was not
    /// sent, or that it was sent: kept on disk, since a name taken out of a
    /// map shows in no state vector, and the application may end between
    /// the writing and the sending.
    pub fn mark_unsent(&self, unsent: bool) -> Result<()> {
        let path = self.dir.join(UNSENT);
        if unsent {
            fs::create_dir_all(&self.dir).context(|| tr!("io-creating", path = &self.dir))?;
            write_atomic(&path, b"")
        } else {
            remove(&path)
        }
    }

    pub fn unsent(&self) -> bool {
        self.dir.join(UNSENT).is_file()
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
        }
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
        kept.keep_home(b"state").unwrap();
        kept.keep_base("folders", &BTreeMap::from([("a".to_owned(), "1".to_owned())])).unwrap();
        assert_eq!(kept.base("folders").unwrap().unwrap().len(), 1);
        assert_eq!(kept.base("settings").unwrap(), None);

        // Joining another home forgets what was kept of the first.
        let other = Joined { home: "other".into(), ..joined() };
        kept.join(&other, "t").unwrap();
        assert_eq!(kept.home().unwrap(), None);
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
