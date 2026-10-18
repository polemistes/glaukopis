//! The writer's own words: a list for each language, kept in the data
//! directory, which holds in all projects.
//!
//! A list is a file of text named by the language, `en.txt`, with a word to
//! a line. It is for the language as a whole: an English word the writer
//! has added is right in American and in British English alike.

use std::collections::BTreeMap;
use std::fs;
use std::path::PathBuf;

use crate::error::{Error, IoContext, Result};
use crate::fsutil::write_atomic;
use crate::{sidefile, tr};

#[derive(Debug, Clone)]
pub struct OwnWords {
    dir: PathBuf,
}

/// Whether a language may name a list: two or three small letters, which
/// is also a safe name of a file.
fn check_language(language: &str) -> Result<()> {
    if (2..=3).contains(&language.len()) && language.chars().all(|c| c.is_ascii_lowercase()) {
        Ok(())
    } else {
        Err(Error::invalid(tr!("spelling-not-a-language", language = language)))
    }
}

/// Whether a word can be one of the writer's: something, on one line, and
/// without the signs that a line of a dictionary gives its flags by.
pub fn check_word(word: &str) -> Result<()> {
    if word.is_empty() || word.chars().any(|c| c.is_whitespace() || c.is_control() || c == '/' || c == '\\') {
        Err(Error::invalid(tr!("spelling-not-a-word", word = word)))
    } else {
        Ok(())
    }
}

impl OwnWords {
    pub fn new(dir: impl Into<PathBuf>) -> Self {
        OwnWords { dir: dir.into() }
    }

    fn file(&self, language: &str) -> PathBuf {
        self.dir.join(format!("{language}.txt"))
    }

    /// The lines of a language's list, as they stand, each once: those that
    /// are no word too (a hand edit may have put a space in one), so that
    /// writing the list does not lose them. A list that is not there has
    /// none. One that cannot be read, or is not UTF-8, is never taken for
    /// empty, which the next word added would have written over: it is set
    /// aside under its name with `.broken-<time>` added (see `sidefile`),
    /// which the writer is told, and the list begins anew.
    fn lines(&self, language: &str) -> Result<Vec<String>> {
        let read = sidefile::read(&self.file(language), |bytes| {
            String::from_utf8(bytes).map_err(|e| e.utf8_error().to_string())
        })?;
        let text = read.or_default();
        let mut lines: Vec<String> = Vec::new();
        for line in text.lines().map(str::trim).filter(|l| !l.is_empty()) {
            if !lines.iter().any(|w| w == line) {
                lines.push(line.to_owned());
            }
        }
        Ok(lines)
    }

    /// The words of a language, in the order they were added. A line that
    /// is no word is left out, and said in the log.
    pub fn list(&self, language: &str) -> Result<Vec<String>> {
        check_language(language)?;
        let mut words = self.lines(language)?;
        words.retain(|line| {
            let good = check_word(line).is_ok();
            if !good {
                tracing::warn!(language, line, "a line of the own words is no word, and is not used");
            }
            good
        });
        Ok(words)
    }

    /// The words of every language that has some. A list that cannot be
    /// read is said in the log, and left out.
    pub fn all(&self) -> BTreeMap<String, Vec<String>> {
        let Ok(entries) = fs::read_dir(&self.dir) else { return BTreeMap::new() };
        entries
            .flatten()
            .filter_map(|entry| {
                let path = entry.path();
                if path.extension()? != "txt" {
                    return None;
                }
                let language = path.file_stem()?.to_str()?.to_owned();
                let words = self.list(&language).ok()?;
                (!words.is_empty()).then_some((language, words))
            })
            .collect()
    }

    fn write(&self, language: &str, words: &[String]) -> Result<()> {
        fs::create_dir_all(&self.dir).context(|| tr!("io-creating", path = &self.dir))?;
        let mut text = words.join("\n");
        text.push('\n');
        write_atomic(&self.file(language), text.as_bytes())
    }

    /// Adds a word. False when it was there already.
    pub fn add(&self, language: &str, word: &str) -> Result<bool> {
        check_language(language)?;
        check_word(word)?;
        let mut words = self.lines(language)?;
        if words.iter().any(|w| w == word) {
            return Ok(false);
        }
        words.push(word.to_owned());
        self.write(language, &words)?;
        Ok(true)
    }

    /// Takes a word away. False when it was not there.
    pub fn remove(&self, language: &str, word: &str) -> Result<bool> {
        check_language(language)?;
        let mut words = self.lines(language)?;
        let before = words.len();
        words.retain(|w| w != word);
        if words.len() == before {
            return Ok(false);
        }
        self.write(language, &words)?;
        Ok(true)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn words_are_kept_for_each_language() {
        let tmp = tempfile::tempdir().unwrap();
        let own = OwnWords::new(tmp.path().join("words"));
        assert!(own.list("en").unwrap().is_empty());
        assert!(own.add("en", "Glaukopis").unwrap());
        assert!(own.add("en", "Nagy").unwrap());
        assert!(!own.add("en", "Nagy").unwrap());
        assert!(own.add("nb", "Glaukopis").unwrap());
        assert_eq!(own.list("en").unwrap(), ["Glaukopis", "Nagy"]);

        let again = OwnWords::new(tmp.path().join("words"));
        let all = again.all();
        assert_eq!(all.keys().collect::<Vec<_>>(), ["en", "nb"]);

        assert!(again.remove("en", "Glaukopis").unwrap());
        assert!(!again.remove("en", "Glaukopis").unwrap());
        assert_eq!(again.list("en").unwrap(), ["Nagy"]);
        assert!(again.remove("en", "Nagy").unwrap());
        assert!(!again.all().contains_key("en"));
    }

    #[test]
    fn a_list_that_cannot_be_read_is_set_aside_and_not_written_over() {
        let tmp = tempfile::tempdir().unwrap();
        let dir = tmp.path().join("words");
        fs::create_dir_all(&dir).unwrap();
        // Saved by an editor in Latin-1: "Müller" with the byte 0xFC.
        let bytes = b"Glaukopis\nM\xfcller\nNagy\n".to_vec();
        fs::write(dir.join("en.txt"), &bytes).unwrap();
        let own = OwnWords::new(&dir);

        // The word is added to a list begun anew, and the writer is told where the old one is.
        assert!(own.add("en", "new").unwrap());
        let aside: Vec<_> = fs::read_dir(&dir)
            .unwrap()
            .flatten()
            .map(|e| e.file_name().to_string_lossy().into_owned())
            .filter(|n| n.starts_with("en.txt.broken-"))
            .collect();
        assert_eq!(aside.len(), 1, "{aside:?}");
        assert_eq!(fs::read(dir.join(&aside[0])).unwrap(), bytes, "what was there is kept as it was");

        // The file set aside is not taken for a language.
        assert_eq!(own.list("en").unwrap(), ["new"]);
        assert_eq!(own.all().keys().collect::<Vec<_>>(), ["en"]);
    }

    #[test]
    fn a_line_that_is_no_word_is_not_lost_when_the_list_is_written() {
        let tmp = tempfile::tempdir().unwrap();
        let dir = tmp.path().join("words");
        fs::create_dir_all(&dir).unwrap();
        fs::write(dir.join("en.txt"), "Glaukopis\nde Gaulle\nNagy\n").unwrap();
        let own = OwnWords::new(&dir);
        assert_eq!(own.list("en").unwrap(), ["Glaukopis", "Nagy"]);
        assert!(own.add("en", "Achaeans").unwrap());
        assert!(own.remove("en", "Nagy").unwrap());
        assert_eq!(fs::read_to_string(dir.join("en.txt")).unwrap(), "Glaukopis\nde Gaulle\nAchaeans\n");
    }

    #[test]
    fn what_is_not_a_word_or_a_language_is_refused() {
        let tmp = tempfile::tempdir().unwrap();
        let own = OwnWords::new(tmp.path());
        assert!(own.add("en", "two words").is_err());
        assert!(own.add("en", "and/or").is_err());
        assert!(own.add("en", "").is_err());
        assert!(own.add("../en", "word").is_err());
        assert!(own.add("EN", "word").is_err());
    }
}
