//! Where Glaukopis keeps its data.
//!
//! Everything lives under one data directory. `GLAUKOPIS_DATA_DIR` overrides
//! the location, which the tests and a portable installation use.

use std::fs;
use std::path::{Path, PathBuf};

use crate::error::{IoContext, Result};
use crate::tr;

#[derive(Debug, Clone)]
pub struct DataDir {
    root: PathBuf,
}

/// A claim on a data directory: while it is held, no other instance of the
/// application works in it. It is let go when it is dropped, or when the
/// process ends however it ends.
#[derive(Debug)]
pub struct Claim {
    _file: fs::File,
}

impl DataDir {
    /// The data directory for this user, created if it does not exist.
    pub fn open_default() -> Result<Self> {
        Self::open(default_root())
    }

    pub fn open(root: impl Into<PathBuf>) -> Result<Self> {
        let dir = DataDir { root: root.into() };
        for sub in [
            dir.library(),
            dir.attachments(),
            dir.pictures(),
            dir.styles(),
            dir.formats(),
            dir.projects(),
            // So that the writer finds where a dictionary of their own goes.
            dir.dictionaries(),
        ] {
            fs::create_dir_all(&sub).context(|| tr!("io-creating", path = &sub))?;
        }
        Ok(dir)
    }

    pub fn root(&self) -> &Path {
        &self.root
    }

    /// Claims the directory for this instance of the application; `None` when
    /// another holds it. Two that worked in one directory would each write
    /// the library, the pictures and the projects over what the other wrote.
    /// Where the file system cannot lock, it is worked in without a claim, as
    /// before there was one.
    pub fn claim(&self) -> Result<Option<Claim>> {
        let path = self.root.join(".in-use");
        let file = fs::OpenOptions::new()
            .create(true)
            .truncate(false)
            .write(true)
            .open(&path)
            .context(|| tr!("io-creating", path = &path))?;
        match file.try_lock() {
            Ok(()) => Ok(Some(Claim { _file: file })),
            Err(fs::TryLockError::WouldBlock) => Ok(None),
            Err(fs::TryLockError::Error(e)) => {
                tracing::warn!("the data directory cannot be claimed, and is used without: {e}");
                Ok(Some(Claim { _file: file }))
            }
        }
    }

    pub fn library(&self) -> PathBuf {
        self.root.join("library")
    }

    pub fn library_file(&self) -> PathBuf {
        self.library().join("library.bib")
    }

    pub fn collections_file(&self) -> PathBuf {
        self.library().join("collections.json")
    }

    pub fn attachments(&self) -> PathBuf {
        self.library().join("attachments")
    }

    /// The store of pictures: see `pictures`.
    pub fn pictures(&self) -> PathBuf {
        self.root.join("pictures")
    }

    pub fn styles(&self) -> PathBuf {
        self.root.join("styles")
    }

    pub fn formats(&self) -> PathBuf {
        self.root.join("formats")
    }

    pub fn projects(&self) -> PathBuf {
        self.root.join("projects")
    }

    pub fn project(&self, id: &str) -> PathBuf {
        self.projects().join(id)
    }

    /// For what can be made again: documents on their way to preview and export.
    pub fn work(&self) -> PathBuf {
        self.root.join("work")
    }

    /// Dictionaries the writer has put here, which are used before those of
    /// the application and of the system: see `spelling`.
    pub fn dictionaries(&self) -> PathBuf {
        self.root.join("dictionaries")
    }

    /// The languages of spelling and of OCR that are imported: see `languages`.
    pub fn languages(&self) -> PathBuf {
        self.root.join("languages")
    }

    /// The writer's own words, a list for each language: see `spelling`.
    pub fn words(&self) -> PathBuf {
        self.root.join("words")
    }

    pub fn settings_file(&self) -> PathBuf {
        self.root.join("settings.json")
    }
}

fn default_root() -> PathBuf {
    if let Some(dir) = std::env::var_os("GLAUKOPIS_DATA_DIR").filter(|v| !v.is_empty()) {
        return PathBuf::from(dir);
    }
    platform_data_home().join("glaukopis")
}

#[cfg(all(unix, not(target_os = "macos")))]
fn platform_data_home() -> PathBuf {
    if let Some(dir) = std::env::var_os("XDG_DATA_HOME").filter(|v| !v.is_empty()) {
        return PathBuf::from(dir);
    }
    home().join(".local").join("share")
}

#[cfg(target_os = "macos")]
fn platform_data_home() -> PathBuf {
    home().join("Library").join("Application Support")
}

#[cfg(windows)]
fn platform_data_home() -> PathBuf {
    std::env::var_os("APPDATA").map(PathBuf::from).unwrap_or_else(|| home().join("AppData").join("Roaming"))
}

fn home() -> PathBuf {
    #[cfg(unix)]
    let var = "HOME";
    #[cfg(windows)]
    let var = "USERPROFILE";
    std::env::var_os(var).map(PathBuf::from).unwrap_or_else(|| PathBuf::from("."))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn creates_the_layout() {
        let tmp = tempfile::tempdir().unwrap();
        let dir = DataDir::open(tmp.path().join("data")).unwrap();
        assert!(dir.attachments().is_dir());
        assert!(dir.projects().is_dir());
        assert_eq!(dir.library_file().file_name().unwrap(), "library.bib");
    }

    #[test]
    fn one_at_a_time_works_in_a_directory() {
        let tmp = tempfile::tempdir().unwrap();
        let dir = DataDir::open(tmp.path().join("data")).unwrap();
        let first = dir.claim().unwrap();
        assert!(first.is_some());
        assert!(dir.claim().unwrap().is_none(), "a second is refused while the first holds it");
        let other = DataDir::open(tmp.path().join("other")).unwrap();
        assert!(other.claim().unwrap().is_some(), "another directory is another matter");
        drop(first);
        assert!(dir.claim().unwrap().is_some(), "and it is free again when let go");
    }
}
