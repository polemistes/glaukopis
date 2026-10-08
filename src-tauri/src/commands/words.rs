//! Commands for the words of a language written out from a project of words
//! (ADR 0034): the Fluent files of a folder read, and written. Only files
//! named as the application's are (`common.ftl`, `core-bib.ftl`), directly in
//! the folder chosen.

use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use glaukopis_core::error::{Error, IoContext};
use glaukopis_core::{fsutil, tr};

use crate::error::CommandResult;

/// A Fluent file: its name, and its text.
#[derive(Serialize, Deserialize)]
pub struct WordsFile {
    pub name: String,
    pub text: String,
}

/// Whether a name is that of a Fluent file of the application, in a folder of its own.
fn good_name(name: &str) -> bool {
    name.strip_suffix(".ftl").is_some_and(|stem| {
        !stem.is_empty() && stem.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
    })
}

fn folder(dir: &str) -> Result<PathBuf, Error> {
    let path = PathBuf::from(dir);
    if !path.is_dir() {
        return Err(Error::not_found(dir.to_owned()));
    }
    Ok(path)
}

fn read(dir: &Path) -> Result<Vec<WordsFile>, Error> {
    let mut files = Vec::new();
    for entry in std::fs::read_dir(dir).context(|| tr!("io-reading", path = dir))?.flatten() {
        let Ok(name) = entry.file_name().into_string() else { continue };
        if !good_name(&name) || !entry.path().is_file() {
            continue;
        }
        let path = entry.path();
        let text = std::fs::read_to_string(&path).context(|| tr!("io-reading", path = &path))?;
        files.push(WordsFile { name, text });
    }
    files.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(files)
}

/// The Fluent files of a folder.
#[tauri::command(async)]
pub fn words_read(dir: String) -> CommandResult<Vec<WordsFile>> {
    Ok(read(&folder(&dir)?)?)
}

/// Writes Fluent files into a folder, each whole before it takes the place of the one before.
#[tauri::command(async)]
pub fn words_write(dir: String, files: Vec<WordsFile>) -> CommandResult<()> {
    let dir = folder(&dir)?;
    for file in &files {
        if !good_name(&file.name) {
            return Err(Error::invalid(file.name.clone()).into());
        }
    }
    for file in files {
        fsutil::write_atomic(&dir.join(&file.name), file.text.as_bytes())?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_the_files_of_the_application_are_read_and_written() {
        assert!(good_name("common.ftl"));
        assert!(good_name("core-bib.ftl"));
        assert!(!good_name("../common.ftl"));
        assert!(!good_name("GLOSSARY.md"));
        assert!(!good_name(".ftl"));
        let tmp = tempfile::tempdir().unwrap();
        std::fs::write(tmp.path().join("common.ftl"), "a = A\n").unwrap();
        std::fs::write(tmp.path().join("GLOSSARY.md"), "#").unwrap();
        let dir = tmp.path().to_string_lossy().into_owned();
        let files = words_read(dir.clone()).ok().unwrap();
        assert_eq!(files.iter().map(|f| f.name.as_str()).collect::<Vec<_>>(), ["common.ftl"]);
        words_write(dir.clone(), vec![WordsFile { name: "common.ftl".into(), text: "a = Á\n".into() }]).ok().unwrap();
        assert_eq!(std::fs::read_to_string(tmp.path().join("common.ftl")).unwrap(), "a = Á\n");
        assert!(words_write(dir, vec![WordsFile { name: "../x.ftl".into(), text: String::new() }]).is_err());
    }
}
