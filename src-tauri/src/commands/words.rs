//! Commands for the words of a language written out from a project of words
//! (ADR 0034): the Fluent files of a folder read, and written. Only files
//! named as the application's are (`common.ftl`, `core-bib.ftl`), directly in
//! the folder chosen.
//!
//! And the own words (ADR 0035): Fluent files in `words/<language>/` of the
//! data directory, laid over the words built in, by the interface and by the
//! core. The interface reads and writes them without knowing where they are.

use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tauri::State;

use glaukopis_core::error::{Error, IoContext};
use glaukopis_core::i18n::{self, LeftOut};
use glaukopis_core::{fsutil, tr};

use crate::error::CommandResult;
use crate::state::AppState;

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
    Ok(write(&folder(&dir)?, files)?)
}

fn write(dir: &Path, files: Vec<WordsFile>) -> Result<(), Error> {
    for file in &files {
        if !good_name(&file.name) {
            return Err(Error::invalid(file.name.clone()));
        }
    }
    for file in files {
        fsutil::write_atomic(&dir.join(&file.name), file.text.as_bytes())?;
    }
    Ok(())
}

/// The own words of a language: its tag, and its Fluent files.
#[derive(Serialize)]
pub struct OwnWords {
    pub tag: String,
    pub files: Vec<WordsFile>,
}

/// Whether a tag may name a folder of own words: `nb`, `sr-Cyrl`, `pt-BR`.
fn good_tag(tag: &str) -> bool {
    (2..=16).contains(&tag.len())
        && tag.starts_with(|c: char| c.is_ascii_lowercase())
        && tag.chars().all(|c| c.is_ascii_alphanumeric() || c == '-')
}

fn own_folder(words: &Path, tag: &str) -> Result<PathBuf, Error> {
    if !good_tag(tag) {
        return Err(Error::invalid(tag.to_owned()));
    }
    Ok(words.join(tag))
}

/// The own words of every language that has some. The folder of words also
/// holds the lists of spelling, as files, which are not these.
fn own_all(words: &Path) -> Result<Vec<OwnWords>, Error> {
    let mut out = Vec::new();
    let Ok(entries) = std::fs::read_dir(words) else { return Ok(out) };
    for entry in entries.flatten() {
        let Ok(tag) = entry.file_name().into_string() else { continue };
        if !good_tag(&tag) || !entry.path().is_dir() {
            continue;
        }
        let files = read(&entry.path())?;
        if !files.is_empty() {
            out.push(OwnWords { tag, files });
        }
    }
    out.sort_by(|a, b| a.tag.cmp(&b.tag));
    Ok(out)
}

/// Writes Fluent files into the own words of a language.
fn own_write(words: &Path, tag: &str, files: Vec<WordsFile>) -> Result<(), Error> {
    let dir = own_folder(words, tag)?;
    std::fs::create_dir_all(&dir).context(|| tr!("io-creating", path = &dir))?;
    write(&dir, files)
}

/// Takes away the own words of a language, or of all: their folders, not the lists of spelling.
fn own_remove(words: &Path, tag: Option<&str>) -> Result<(), Error> {
    let tags: Vec<String> = match tag {
        Some(tag) => vec![tag.to_owned()],
        None => {
            let Ok(entries) = std::fs::read_dir(words) else { return Ok(()) };
            entries
                .flatten()
                .filter(|e| e.path().is_dir())
                .filter_map(|e| e.file_name().into_string().ok())
                .filter(|t| good_tag(t))
                .collect()
        }
    };
    for tag in tags {
        let dir = own_folder(words, &tag)?;
        if dir.is_dir() {
            std::fs::remove_dir_all(&dir).context(|| tr!("io-removing", path = &dir))?;
        }
    }
    Ok(())
}

/// The own words of every language that has some, to be laid over the words
/// of the interface.
#[tauri::command(async)]
pub fn words_own(state: State<'_, AppState>) -> CommandResult<Vec<OwnWords>> {
    Ok(own_all(&state.data.words())?)
}

/// Writes Fluent files into the own words of a language. They are used when
/// the words are read again (`words_own_use`).
#[tauri::command(async)]
pub fn words_own_write(state: State<'_, AppState>, tag: String, files: Vec<WordsFile>) -> CommandResult<()> {
    Ok(own_write(&state.data.words(), &tag, files)?)
}

/// Takes away the own words of a language, or of all where none is named,
/// and has the core read its words again.
#[tauri::command(async)]
pub fn words_own_remove(state: State<'_, AppState>, tag: Option<String>) -> CommandResult<Vec<LeftOut>> {
    own_remove(&state.data.words(), tag.as_deref())?;
    Ok(i18n::use_own_words(&state.data.words()))
}

/// Has the core read its own words again, and lay them over those built in:
/// at the start, and when they were changed. What was left out.
#[tauri::command(async)]
pub fn words_own_use(state: State<'_, AppState>) -> Vec<LeftOut> {
    i18n::use_own_words(&state.data.words())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn own_words_are_written_read_and_taken_away_without_the_lists_of_spelling() {
        assert!(good_tag("nb") && good_tag("sr-Cyrl") && good_tag("pt-BR"));
        assert!(!good_tag("..") && !good_tag("nb/x") && !good_tag("") && !good_tag("NB"));
        let tmp = tempfile::tempdir().unwrap();
        let words = tmp.path().join("words");
        assert!(own_all(&words).unwrap().is_empty());
        std::fs::create_dir_all(&words).unwrap();
        std::fs::write(words.join("nb.txt"), "Glaukopis\n").unwrap();
        own_write(&words, "nb", vec![WordsFile { name: "common.ftl".into(), text: "a = Á\n".into() }]).unwrap();
        own_write(&words, "en", vec![WordsFile { name: "core.ftl".into(), text: "b = B\n".into() }]).unwrap();
        assert!(own_write(&words, "../x", vec![]).is_err());
        assert!(own_write(&words, "nb", vec![WordsFile { name: "x.md".into(), text: String::new() }]).is_err());
        let all = own_all(&words).unwrap();
        assert_eq!(all.iter().map(|o| o.tag.as_str()).collect::<Vec<_>>(), ["en", "nb"]);
        assert_eq!(all[1].files[0].text, "a = Á\n");
        own_remove(&words, Some("en")).unwrap();
        assert_eq!(own_all(&words).unwrap().len(), 1);
        own_remove(&words, None).unwrap();
        assert!(own_all(&words).unwrap().is_empty());
        assert!(words.join("nb.txt").is_file(), "the list of spelling stays");
    }

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
