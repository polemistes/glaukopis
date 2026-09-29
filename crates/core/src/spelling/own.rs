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
use crate::tr;

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

    /// The words of a language, in the order they were added.
    pub fn list(&self, language: &str) -> Vec<String> {
        if check_language(language).is_err() {
            return Vec::new();
        }
        let Ok(text) = fs::read_to_string(self.file(language)) else { return Vec::new() };
        let mut words: Vec<String> = Vec::new();
        for line in text.lines().map(str::trim).filter(|l| !l.is_empty()) {
            if check_word(line).is_ok() && !words.iter().any(|w| w == line) {
                words.push(line.to_owned());
            }
        }
        words
    }

    /// The words of every language that has some.
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
                let words = self.list(&language);
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
        let mut words = self.list(language);
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
        let mut words = self.list(language);
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
        assert!(own.list("en").is_empty());
        assert!(own.add("en", "Glaukopis").unwrap());
        assert!(own.add("en", "Nagy").unwrap());
        assert!(!own.add("en", "Nagy").unwrap());
        assert!(own.add("nb", "Glaukopis").unwrap());
        assert_eq!(own.list("en"), ["Glaukopis", "Nagy"]);

        let again = OwnWords::new(tmp.path().join("words"));
        let all = again.all();
        assert_eq!(all.keys().collect::<Vec<_>>(), ["en", "nb"]);

        assert!(again.remove("en", "Glaukopis").unwrap());
        assert!(!again.remove("en", "Glaukopis").unwrap());
        assert_eq!(again.list("en"), ["Nagy"]);
        assert!(again.remove("en", "Nagy").unwrap());
        assert!(!again.all().contains_key("en"));
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
