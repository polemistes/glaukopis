//! The small things the writer has made their own, as stores that are
//! brought to be the same as maps of the home document (`mirror`, record
//! 0119): the reference styles, the formats and the templates of their own,
//! the words they added to spelling, and the words of the interface they
//! changed.
//!
//! A style, a format or a template is one file, and one name of its map,
//! holding the file's text: changed on two computers apart, one of the two
//! stands. The words of spelling are each a name of their own, so that a
//! word added on one computer and another added on the other are both in
//! the list after.

use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

use crate::changes::{self, Area};
use crate::error::{IoContext, Result};
use crate::fsutil::write_atomic;
use crate::spelling::own::OwnWords;
use crate::tr;

use super::mirror::Store;

/// The most one file may hold to be kept in the home document: far more
/// than a style or a template holds.
const MOST: u64 = 1 << 20;

/// Whether a name is one a file in a folder of the writer's may have, so
/// that nothing written from elsewhere reaches outside it: letters, digits,
/// `-`, `_` and `.`, not beginning with a dot or a hyphen.
fn good_name(name: &str) -> bool {
    !name.is_empty()
        && name.len() <= 120
        && name.chars().all(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.'))
        && !name.starts_with(['.', '-'])
}

/// The files of text in a folder that end as said, by their names.
fn texts(dir: &Path, ending: &str) -> Result<BTreeMap<String, String>> {
    let mut out = BTreeMap::new();
    let entries = match fs::read_dir(dir) {
        Ok(entries) => entries,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(out),
        Err(e) => return Err(e).context(|| tr!("io-reading", path = dir)),
    };
    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().into_owned();
        if !good_name(&name) || !name.ends_with(ending) {
            continue;
        }
        let path = entry.path();
        let small = entry.metadata().is_ok_and(|m| m.is_file() && m.len() <= MOST);
        if !small {
            continue;
        }
        // What is no text is not the application's own writing, and is left where it is.
        if let Ok(text) = fs::read_to_string(&path) {
            out.insert(name, text);
        }
    }
    Ok(out)
}

/// Writes a file of text into a folder, or with none takes it away.
fn put(dir: &Path, name: &str, text: Option<&str>) -> Result<()> {
    let path = dir.join(name);
    match text {
        Some(text) => {
            fs::create_dir_all(dir).context(|| tr!("io-creating", path = dir))?;
            write_atomic(&path, text.as_bytes())
        }
        None => match fs::remove_file(&path) {
            Ok(()) => Ok(()),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
            Err(e) => Err(e).context(|| tr!("io-removing", path = &path)),
        },
    }
}

/// A folder of the writer's own files of one sort: the reference styles
/// (`styles/`, `.csl`), the formats (`formats/`, `.json`), the templates
/// (`templates/`, `.json`). Each file is a name of the map.
pub struct Folder {
    /// The name of its map.
    pub map: &'static str,
    pub dir: PathBuf,
    /// What the names of its files end with.
    pub ending: &'static str,
}

impl Store for Folder {
    fn name(&self) -> &'static str {
        self.map
    }

    fn read(&self) -> Result<BTreeMap<String, String>> {
        texts(&self.dir, self.ending)
    }

    fn write(&self, changes: &BTreeMap<String, Option<String>>) -> Result<()> {
        for (name, text) in changes {
            if !good_name(name) || !name.ends_with(self.ending) {
                continue;
            }
            put(&self.dir, name, text.as_deref())?;
        }
        Ok(())
    }
}

/// The words the writer added to spelling: each a name, the language and
/// the word (`en/mênis`), so that words added apart are all kept.
pub struct SpellingWords {
    pub own: OwnWords,
}

impl Store for SpellingWords {
    fn name(&self) -> &'static str {
        "words"
    }

    fn read(&self) -> Result<BTreeMap<String, String>> {
        let mut out = BTreeMap::new();
        for (language, words) in self.own.all() {
            for word in words {
                out.insert(format!("{language}/{word}"), "1".to_owned());
            }
        }
        Ok(out)
    }

    fn write(&self, changes: &BTreeMap<String, Option<String>>) -> Result<()> {
        let mut wrote = false;
        for (name, value) in changes {
            let Some((language, word)) = name.split_once('/') else { continue };
            // A language or a word that cannot be one here is passed over.
            let written = match value {
                Some(_) => self.own.add(language, word),
                None => self.own.remove(language, word),
            };
            match written {
                Ok(changed) => wrote |= changed,
                Err(error) => tracing::warn!(%error, name, "a word of spelling from elsewhere was not written"),
            }
        }
        if wrote {
            changes::changed(Area::Words);
        }
        Ok(())
    }
}

/// The words of the interface the writer changed (record 0035): Fluent
/// files in a folder for each language under `words/`, each file a name,
/// the language and the file (`nb/common.ftl`).
pub struct InterfaceWords {
    /// `words/` of the data folder.
    pub dir: PathBuf,
}

/// Whether a name is the tag of a language, which is a folder under `words/`.
fn good_tag(tag: &str) -> bool {
    !tag.is_empty()
        && tag.len() <= 20
        && tag.chars().all(|c| c.is_ascii_alphanumeric() || c == '-')
        && !tag.starts_with('-')
}

impl Store for InterfaceWords {
    fn name(&self) -> &'static str {
        "interface"
    }

    fn read(&self) -> Result<BTreeMap<String, String>> {
        let mut out = BTreeMap::new();
        let Ok(entries) = fs::read_dir(&self.dir) else { return Ok(out) };
        for entry in entries.flatten() {
            let tag = entry.file_name().to_string_lossy().into_owned();
            if !good_tag(&tag) || !entry.path().is_dir() {
                continue;
            }
            for (name, text) in texts(&entry.path(), ".ftl")? {
                out.insert(format!("{tag}/{name}"), text);
            }
        }
        Ok(out)
    }

    fn write(&self, changes: &BTreeMap<String, Option<String>>) -> Result<()> {
        let mut wrote = false;
        for (name, text) in changes {
            let Some((tag, file)) = name.split_once('/') else { continue };
            if !good_tag(tag) || !good_name(file) || !file.ends_with(".ftl") {
                continue;
            }
            let dir = self.dir.join(tag);
            put(&dir, file, text.as_deref())?;
            if text.is_none() {
                // A language with no words of its own left has no folder.
                let _ = fs::remove_dir(&dir);
            }
            wrote = true;
        }
        if wrote {
            // The windows are told, and have the core lay them over its own words again.
            changes::changed(Area::Words);
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn set(pairs: &[(&str, Option<&str>)]) -> BTreeMap<String, Option<String>> {
        pairs.iter().map(|(k, v)| ((*k).to_owned(), v.map(str::to_owned))).collect()
    }

    #[test]
    fn the_files_of_a_folder_are_read_written_and_taken_away_by_their_names() {
        let tmp = tempfile::tempdir().unwrap();
        let dir = tmp.path().join("styles");
        let styles = Folder { map: "styles", dir: dir.clone(), ending: ".csl" };
        assert!(styles.read().unwrap().is_empty(), "a folder that is not there holds nothing");
        styles.write(&set(&[("my-style.csl", Some("<style/>")), ("other.csl", Some("<style>2</style>"))])).unwrap();
        fs::write(dir.join("notes.txt"), "not a style").unwrap();
        fs::write(dir.join(".hidden.csl"), "x").unwrap();
        fs::write(dir.join("bytes.csl"), [0xff, 0xfe, 0x00]).unwrap();
        let read = styles.read().unwrap();
        assert_eq!(read.keys().cloned().collect::<Vec<_>>(), vec!["my-style.csl".to_owned(), "other.csl".to_owned()]);
        assert_eq!(read["my-style.csl"], "<style/>");
        styles.write(&set(&[("other.csl", None), ("my-style.csl", Some("<style>changed</style>"))])).unwrap();
        assert_eq!(
            styles.read().unwrap(),
            BTreeMap::from([("my-style.csl".to_owned(), "<style>changed</style>".to_owned())])
        );
        assert!(dir.join("notes.txt").is_file(), "what is no file of its sort is left");
        // A name that would reach outside the folder, or is of another sort, is not written.
        styles
            .write(&set(&[("../escaped.csl", Some("x")), ("a/b.csl", Some("x")), ("format.json", Some("{}"))]))
            .unwrap();
        assert!(!tmp.path().join("escaped.csl").exists());
        assert_eq!(styles.read().unwrap().len(), 1);
    }

    #[test]
    fn the_words_of_spelling_are_each_a_name() {
        let tmp = tempfile::tempdir().unwrap();
        let store = SpellingWords { own: OwnWords::new(tmp.path()) };
        store.own.add("en", "mênis").unwrap();
        store.own.add("nb", "skolion").unwrap();
        assert_eq!(
            store.read().unwrap().keys().cloned().collect::<Vec<_>>(),
            vec!["en/mênis".to_owned(), "nb/skolion".to_owned()]
        );
        // A word added elsewhere, one taken away, and what is no word.
        store
            .write(&set(&[
                ("en/aoidos", Some("1")),
                ("nb/skolion", None),
                ("english/word", Some("1")),
                ("en/two words", Some("1")),
            ]))
            .unwrap();
        assert_eq!(store.own.list("en").unwrap(), vec!["mênis".to_owned(), "aoidos".to_owned()]);
        assert!(store.own.list("nb").unwrap().is_empty());
    }

    #[test]
    fn the_words_of_the_interface_are_files_by_language() {
        let tmp = tempfile::tempdir().unwrap();
        let store = InterfaceWords { dir: tmp.path().join("words") };
        assert!(store.read().unwrap().is_empty());
        store.write(&set(&[("nb/common.ftl", Some("common-cancel = Nei\n")), ("../x/common.ftl", Some("x"))])).unwrap();
        // The lists of spelling lie in the same folder, and are no words of the interface.
        fs::write(tmp.path().join("words").join("en.txt"), "mênis\n").unwrap();
        assert_eq!(
            store.read().unwrap(),
            BTreeMap::from([("nb/common.ftl".to_owned(), "common-cancel = Nei\n".to_owned())])
        );
        store.write(&set(&[("nb/common.ftl", None)])).unwrap();
        assert!(store.read().unwrap().is_empty());
        assert!(!tmp.path().join("words").join("nb").exists(), "a language with no words left has no folder");
    }
}
