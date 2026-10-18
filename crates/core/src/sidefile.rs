//! The files a store keeps of its own beside what it stores: what the
//! library knows of its collections and its files, the record of the
//! pictures, the folders of the projects, the writer's own words, what a
//! language that was imported says of itself (ADR 0052).
//!
//! One that cannot be read or understood is never taken for empty, which
//! the next change would write over, and never stops the store from
//! opening: it is set aside beside where it was, under its name with
//! `.broken-<time>` added, the store goes on as if it were not there, and
//! this is said in the log and to the page (see `notices`). Only when it
//! cannot even be set aside is it an error, since going on would write over
//! it.

use std::fs;
use std::path::{Path, PathBuf};

use serde::de::DeserializeOwned;

use crate::error::{Error, Result};
use crate::{notices, tr};

/// What became of a side file that was read.
#[derive(Debug)]
pub enum Read<T> {
    /// It is not there: the store has none yet.
    Missing,
    Read(T),
    /// It could not be read, and is set aside.
    SetAside(SetAside),
}

/// A file that was set aside, and why.
#[derive(Debug, Clone)]
pub struct SetAside {
    pub path: PathBuf,
    /// Where it is now: beside where it was.
    pub aside: PathBuf,
    /// What was wrong with it, as the reader said.
    pub cause: String,
}

impl SetAside {
    /// What is said of it, in the language of the interface.
    pub fn message(&self) -> String {
        words(self)
    }
}

fn words(set: &SetAside) -> String {
    let aside = set.aside.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
    tr!("core-set-aside", path = &set.path, aside = &aside, cause = &set.cause)
}

impl<T> Read<T> {
    /// What it held, if it could be read.
    pub fn value(self) -> Option<T> {
        match self {
            Read::Read(value) => Some(value),
            Read::Missing | Read::SetAside(_) => None,
        }
    }

    /// What it held, or the defaults when it is not there or set aside.
    pub fn or_default(self) -> T
    where
        T: Default,
    {
        self.value().unwrap_or_default()
    }

    /// The setting aside, if it was.
    pub fn set_aside(&self) -> Option<&SetAside> {
        match self {
            Read::SetAside(set) => Some(set),
            _ => None,
        }
    }
}

/// Reads a side file with `parse`, which says in words what it could not
/// understand. A file that cannot be read, or is not understood, is set
/// aside, and said to be.
pub fn read<T>(path: &Path, parse: impl FnOnce(Vec<u8>) -> std::result::Result<T, String>) -> Result<Read<T>> {
    let cause = match fs::read(path) {
        Ok(bytes) => match parse(bytes) {
            Ok(value) => return Ok(Read::Read(value)),
            Err(cause) => cause,
        },
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(Read::Missing),
        Err(e) => e.to_string(),
    };
    match set_aside(path, &cause) {
        Ok(set) => Ok(Read::SetAside(set)),
        // Set aside by another reader in the meantime: for this one it is not there.
        Err(e) if !path.exists() => {
            tracing::debug!(path = %path.display(), %e, "a side file was gone when it was to be set aside");
            Ok(Read::Missing)
        }
        Err(e) => Err(e),
    }
}

/// Reads a side file of JSON.
pub fn read_json<T: DeserializeOwned>(path: &Path) -> Result<Read<T>> {
    read(path, |bytes| serde_json::from_slice(&bytes).map_err(|e| e.to_string()))
}

/// The name a file is set aside under, beside it: `<name>.broken-<time>`,
/// with a number after when one of that name is there already.
fn aside_name(path: &Path) -> PathBuf {
    let t = time::OffsetDateTime::now_utc();
    let stamp = format!(
        "{:04}{:02}{:02}T{:02}{:02}{:02}Z",
        t.year(),
        u8::from(t.month()),
        t.day(),
        t.hour(),
        t.minute(),
        t.second()
    );
    let name = path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
    let mut aside = path.with_file_name(format!("{name}.broken-{stamp}"));
    let mut n = 2;
    while aside.exists() {
        aside = path.with_file_name(format!("{name}.broken-{stamp}-{n}"));
        n += 1;
    }
    aside
}

/// Sets a file aside that could not be read, says so in the log and to the
/// page, and gives where it is now.
pub fn set_aside(path: &Path, cause: &str) -> Result<SetAside> {
    let aside = aside_name(path);
    if let Err(e) = fs::rename(path, &aside) {
        tracing::warn!(path = %path.display(), cause, %e, "a file could not be read, nor set aside");
        return Err(Error::io(tr!("io-setting-aside", path = path), e));
    }
    tracing::warn!(path = %path.display(), aside = %aside.display(), cause, "a file could not be read, and is set aside");
    let set = SetAside { path: path.to_owned(), aside, cause: cause.to_owned() };
    let told = set.clone();
    notices::tell(move || words(&told));
    Ok(set)
}

/// Keeps a copy of a file as it is, under the name a file set aside would
/// have, when it is read in part and will be written whole: a library file
/// with bytes that are not UTF-8, say. Said in the log; what is said to the
/// page is for the caller, which knows what was lost.
pub fn copy_aside(path: &Path, cause: &str) -> Result<PathBuf> {
    let aside = aside_name(path);
    if let Err(e) = fs::copy(path, &aside) {
        tracing::warn!(path = %path.display(), cause, %e, "a file was read in part, and could not be copied aside");
        return Err(Error::io(tr!("io-setting-aside", path = path), e));
    }
    tracing::warn!(path = %path.display(), aside = %aside.display(), cause, "a file was read in part, and a copy is kept");
    Ok(aside)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn names(dir: &Path) -> Vec<String> {
        let mut out: Vec<String> =
            fs::read_dir(dir).unwrap().flatten().map(|e| e.file_name().to_string_lossy().into_owned()).collect();
        out.sort();
        out
    }

    #[test]
    fn a_file_that_is_there_is_read_and_one_that_is_not_is_missing() {
        let tmp = tempfile::tempdir().unwrap();
        let path = tmp.path().join("a.json");
        assert!(matches!(read_json::<Vec<u32>>(&path).unwrap(), Read::Missing));
        fs::write(&path, "[1, 2]").unwrap();
        assert_eq!(read_json::<Vec<u32>>(&path).unwrap().value(), Some(vec![1, 2]));
    }

    #[test]
    fn a_file_that_is_not_understood_is_set_aside_as_it_was() {
        let tmp = tempfile::tempdir().unwrap();
        let path = tmp.path().join("collections.json");
        fs::write(&path, "{ \"collections\": [ ").unwrap();
        let read = read_json::<serde_json::Value>(&path).unwrap();
        let set = read.set_aside().unwrap().clone();
        assert!(!path.exists());
        let name = set.aside.file_name().unwrap().to_string_lossy().into_owned();
        assert!(name.starts_with("collections.json.broken-"), "{name}");
        assert_eq!(fs::read_to_string(&set.aside).unwrap(), "{ \"collections\": [ ");
        assert!(set.message().contains(&name), "{}", set.message());
        assert!(read.or_default().is_null());

        // A second in the same second does not take the place of the first.
        fs::write(&path, "no").unwrap();
        read_json::<serde_json::Value>(&path).unwrap();
        assert_eq!(names(tmp.path()).iter().filter(|n| n.starts_with("collections.json.broken-")).count(), 2);
        // And what is not there is missing, not damaged.
        assert!(matches!(read_json::<serde_json::Value>(&path).unwrap(), Read::Missing));
    }

    #[test]
    fn what_the_reader_refuses_is_set_aside_too() {
        let tmp = tempfile::tempdir().unwrap();
        let path = tmp.path().join("en.txt");
        fs::write(&path, b"M\xfcller\n").unwrap();
        let read = read(&path, |bytes| String::from_utf8(bytes).map_err(|e| e.utf8_error().to_string())).unwrap();
        assert!(read.set_aside().is_some());
        assert_eq!(names(tmp.path()).len(), 1);
    }

    #[test]
    fn a_copy_is_kept_and_the_file_stays() {
        let tmp = tempfile::tempdir().unwrap();
        let path = tmp.path().join("library.bib");
        fs::write(&path, b"x").unwrap();
        let aside = copy_aside(&path, "not UTF-8").unwrap();
        assert!(path.exists());
        assert_eq!(fs::read(aside).unwrap(), b"x");
    }
}
