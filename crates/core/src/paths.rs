//! Where Glaukopis keeps its data.
//!
//! Everything lives under one data directory. `GLAUKOPIS_DATA_DIR` overrides
//! the location, which the tests and a portable installation use.

use std::fs;
use std::path::{Path, PathBuf};

use crate::error::{IoContext, Result};

#[derive(Debug, Clone)]
pub struct DataDir {
    root: PathBuf,
}

impl DataDir {
    /// The data directory for this user, created if it does not exist.
    pub fn open_default() -> Result<Self> {
        Self::open(default_root())
    }

    pub fn open(root: impl Into<PathBuf>) -> Result<Self> {
        let dir = DataDir { root: root.into() };
        for sub in [dir.library(), dir.attachments(), dir.pictures(), dir.styles(), dir.formats(), dir.projects()] {
            fs::create_dir_all(&sub).context(|| format!("creating {}", sub.display()))?;
        }
        Ok(dir)
    }

    pub fn root(&self) -> &Path {
        &self.root
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
}
