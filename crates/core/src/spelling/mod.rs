//! Spelling: the words of a text are checked against Hunspell's
//! dictionaries, which Spellbook reads (ADR 0019).
//!
//! Dictionaries are looked for where the writer may have put one (the data
//! directory), where the application has its own (English and Norwegian, in
//! its resources), and where the system has them (`/usr/share/hunspell` and
//! its like), in that order; the first of a language that is found is the
//! one used ([`found`]). A dictionary is read when a text in its language is
//! first checked, which for Norwegian takes a moment, and is kept.
//!
//! A text is checked in the language of its map (ADR 0020). English without
//! a country is checked with the American and the British dictionary both,
//! and a word is right if either has it. Norwegian without more is Bokmål.
//!
//! The writer's own words ([`own`]) are taken in by a dictionary when it is
//! read, and when one is added. What is not checked at all is said in
//! [`words`].

pub mod found;
pub mod own;
pub mod words;

use std::borrow::Cow;
use std::collections::{BTreeMap, HashMap};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, MutexGuard, OnceLock, PoisonError, RwLock};
use std::time::Instant;

use encoding_rs::Encoding;
use icu_properties::props::Script;
use serde::Serialize;
use spellbook::Dictionary;

use crate::error::{Error, IoContext, Result};
use crate::paths::DataDir;

pub use found::{Found, Place, Source};
pub use own::OwnWords;

/// How many suggestions are given for a word, at most.
const SUGGESTIONS: usize = 8;

/// The dictionaries, those that have been read, and the writer's words.
pub struct Spelling {
    places: Vec<Place>,
    own: OwnWords,
    /// The dictionaries found, looked for when first needed, and again when
    /// the languages are listed.
    found: RwLock<Option<Vec<Found>>>,
    /// The dictionaries that have been read or are being read, by their
    /// affix file. Each is read once, however many ask for it at the time.
    read: Mutex<HashMap<PathBuf, Arc<Slot>>>,
    /// Words are added and taken away one at a time.
    writing: Mutex<()>,
}

type Slot = OnceLock<std::result::Result<Arc<Read>, String>>;

/// A dictionary that has been read.
struct Read {
    /// The language it is for: `en-US`.
    tag: String,
    dictionary: RwLock<Dictionary>,
    /// The script its words are written in; the words of other scripts are
    /// not checked with it.
    script: Option<Script>,
}

/// How a text in a language is checked.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Checking {
    /// The dictionaries: one, or for English without a country, two.
    pub dictionaries: Vec<Found>,
    /// The script of their words, as ISO 15924 names it: `Latn`.
    pub script: Option<String>,
    /// The language whose list of the writer's own words holds: `en`.
    pub words: String,
}

fn lock<T>(mutex: &Mutex<T>) -> MutexGuard<'_, T> {
    mutex.lock().unwrap_or_else(PoisonError::into_inner)
}

/// The language whose list of the writer's own words holds for a text in
/// a language: that without the country, `en` for `en-GB`.
pub fn words_language(language: Option<&str>) -> String {
    let tag = found::normalise(language.filter(|l| !l.trim().is_empty()).unwrap_or("en"));
    found::primary(&tag).to_owned()
}

impl Spelling {
    pub fn new(places: Vec<Place>, words: impl Into<PathBuf>) -> Self {
        Spelling {
            places,
            own: OwnWords::new(words),
            found: RwLock::new(None),
            read: Mutex::new(HashMap::new()),
            writing: Mutex::new(()),
        }
    }

    /// The dictionaries of the data directory, of the application, and of
    /// the system.
    pub fn open(data: &DataDir, resources: &Path) -> Self {
        let mut places = vec![
            Place::new(data.dictionaries(), Source::Own),
            Place::new(resources.join("dictionaries"), Source::Application),
        ];
        places.extend(found::system_dirs().into_iter().map(|dir| Place::new(dir, Source::System)));
        Spelling::new(places, data.words())
    }

    /// The dictionaries there are, looked for anew: one may have been put in
    /// place or taken away since.
    pub fn languages(&self) -> Vec<Found> {
        let now = found::find(&self.places);
        // What was read of a dictionary no longer found is let go.
        lock(&self.read).retain(|aff, _| now.iter().any(|f| f.aff() == *aff));
        *self.found.write().unwrap_or_else(PoisonError::into_inner) = Some(now.clone());
        now
    }

    fn found(&self) -> Vec<Found> {
        if let Some(found) = self.found.read().unwrap_or_else(PoisonError::into_inner).as_ref() {
            return found.clone();
        }
        self.languages()
    }

    /// The dictionaries a text in the language is checked with, found but
    /// not read.
    pub fn chosen(&self, language: Option<&str>) -> Vec<Found> {
        let found = self.found();
        found::choose(&found, language).into_iter().cloned().collect()
    }

    /// How a text in the language is checked, with its dictionaries read
    /// now if they were not. None, where there is no dictionary for it.
    pub fn prepare(&self, language: Option<&str>) -> Result<Option<Checking>> {
        let dictionaries = self.chosen(language);
        if dictionaries.is_empty() {
            return Ok(None);
        }
        let read = dictionaries.iter().map(|f| self.read(f)).collect::<Result<Vec<_>>>()?;
        Ok(Some(Checking {
            dictionaries,
            script: read[0].script.and_then(words::script_name).map(str::to_owned),
            words: words_language(language),
        }))
    }

    /// The dictionaries of the language, read.
    fn read_for(&self, language: Option<&str>) -> Result<Vec<Arc<Read>>> {
        let dictionaries = self.chosen(language);
        if dictionaries.is_empty() {
            let language = language.filter(|l| !l.trim().is_empty()).unwrap_or("en");
            return Err(Error::not_found(format!("a dictionary for “{language}”")));
        }
        dictionaries.iter().map(|f| self.read(f)).collect()
    }

    /// A dictionary, read if it was not. While it is being read, those who
    /// ask for it wait for it.
    fn read(&self, found: &Found) -> Result<Arc<Read>> {
        let key = found.aff();
        let slot = lock(&self.read).entry(key.clone()).or_default().clone();
        match slot.get_or_init(|| self.load(found).map(Arc::new).map_err(|e| e.to_string())) {
            Ok(read) => Ok(read.clone()),
            Err(message) => {
                // Tried again when next asked for: the files may have been mended.
                let mut read = lock(&self.read);
                if read.get(&key).is_some_and(|s| Arc::ptr_eq(s, &slot)) {
                    read.remove(&key);
                }
                Err(Error::invalid(message.clone()))
            }
        }
    }

    fn load(&self, found: &Found) -> Result<Read> {
        let started = Instant::now();
        let aff_path = found.aff();
        let dic_path = found.dic();
        let aff_bytes = fs::read(&aff_path).context(|| format!("reading {}", aff_path.display()))?;
        let dic_bytes = fs::read(&dic_path).context(|| format!("reading {}", dic_path.display()))?;
        let extra_bytes = fs::read(found.extra()).ok();
        let encoding = encoding_of(&aff_bytes).ok_or_else(|| {
            Error::invalid(format!("The dictionary {} is written in an encoding that cannot be read.", found.name))
        })?;
        let (aff, _, _) = encoding.decode(&aff_bytes);
        let (mut dic, _, _) = encoding.decode(&dic_bytes);
        if let Some(extra) = &extra_bytes {
            let (extra, _, _) = encoding.decode(extra);
            dic = Cow::Owned(joined(&dic, &extra));
        }
        let mut dictionary = Dictionary::new(&aff, &dic)
            .map_err(|e| Error::invalid(format!("The dictionary {} could not be read: {e}.", found.name)))?;
        let script = dictionary_script(&aff, &dic);
        let own = self.own.list(found::primary(&found.tag));
        for word in &own {
            take_in(&mut dictionary, word);
        }
        tracing::info!(
            dictionary = %found.name,
            extra = extra_bytes.is_some(),
            own = own.len(),
            ms = started.elapsed().as_millis() as u64,
            "dictionary read"
        );
        Ok(Read { tag: found.tag.clone(), dictionary: RwLock::new(dictionary), script })
    }

    /// For each word, whether it is right in the language. Words that are
    /// not checked (see [`words`]) are right.
    pub fn check(&self, language: Option<&str>, words: &[String]) -> Result<Vec<bool>> {
        let read = self.read_for(language)?;
        let script = read[0].script;
        let dictionaries: Vec<_> =
            read.iter().map(|r| r.dictionary.read().unwrap_or_else(PoisonError::into_inner)).collect();
        Ok(words
            .iter()
            .map(|word| {
                let word = words::prepared(word);
                !words::is_checked(&word, script) || dictionaries.iter().any(|d| is_right(d, &word))
            })
            .collect())
    }

    /// What a misspelt word may be, the likeliest first. Where the language
    /// has two dictionaries, their suggestions are taken in turn.
    ///
    /// The quick ways are tried first (letters swapped, left out, doubled,
    /// the replacements a dictionary names); the slow one, which goes
    /// through all the words of the dictionary for those that look alike,
    /// only where the quick ones find nothing.
    pub fn suggest(&self, language: Option<&str>, word: &str) -> Result<Vec<String>> {
        let read = self.read_for(language)?;
        let word = words::prepared(word);
        let lists: Vec<Vec<String>> = read
            .iter()
            .map(|r| {
                let dictionary = r.dictionary.read().unwrap_or_else(PoisonError::into_inner);
                let mut out = Vec::new();
                dictionary.suggester().with_ngram_suggestions(false).suggest(&word, &mut out);
                if out.is_empty() {
                    dictionary.suggest(&word, &mut out);
                }
                out
            })
            .collect();
        let mut suggestions: Vec<String> = Vec::new();
        let longest = lists.iter().map(Vec::len).max().unwrap_or(0);
        for i in 0..longest {
            for list in &lists {
                if let Some(s) = list.get(i)
                    && !suggestions.contains(s)
                {
                    suggestions.push(s.clone());
                }
            }
        }
        suggestions.truncate(SUGGESTIONS);
        Ok(suggestions)
    }

    /// The writer's own words, by language.
    pub fn own_words(&self) -> BTreeMap<String, Vec<String>> {
        self.own.all()
    }

    /// Adds a word to the writer's own, for the language of a text; the
    /// dictionaries of the language that have been read take it in at once.
    pub fn add_word(&self, language: Option<&str>, word: &str) -> Result<()> {
        let _writing = lock(&self.writing);
        let key = words_language(language);
        let word = words::prepared(word.trim());
        self.own.add(&key, &word)?;
        for read in self.read_of(&key) {
            take_in(&mut read.dictionary.write().unwrap_or_else(PoisonError::into_inner), &word);
        }
        Ok(())
    }

    /// Takes a word away from the writer's own words of a language (`en`).
    pub fn remove_word(&self, language: &str, word: &str) -> Result<()> {
        let _writing = lock(&self.writing);
        let key = words_language(Some(language));
        if self.own.remove(&key, word)? {
            // A dictionary cannot be made to forget a word it was given,
            // without forbidding it where it had the word itself: those of
            // the language are read anew when next needed.
            lock(&self.read).retain(|_, slot| !of_language(slot, &key));
        }
        Ok(())
    }

    /// The dictionaries that have been read for a language (`en`).
    fn read_of(&self, language: &str) -> Vec<Arc<Read>> {
        lock(&self.read)
            .values()
            .filter(|slot| of_language(slot, language))
            .filter_map(|slot| slot.get()?.as_ref().ok().cloned())
            .collect()
    }
}

/// Whether a dictionary has been read, and is of the language (`en`).
fn of_language(slot: &Slot, language: &str) -> bool {
    slot.get().and_then(|r| r.as_ref().ok()).is_some_and(|read| found::primary(&read.tag) == language)
}

/// Whether the dictionary has the word. A typographic apostrophe is tried
/// as the plain one as well, which is how most dictionaries have it.
fn is_right(dictionary: &Dictionary, word: &str) -> bool {
    dictionary.check(word) || (word.contains('’') && dictionary.check(&word.replace('’', "'")))
}

/// Gives a dictionary one of the writer's words, as a word of its own
/// without endings. The apostrophe is the plain one, which a dictionary that
/// knows the typographic one turns it into.
fn take_in(dictionary: &mut Dictionary, word: &str) {
    if let Err(e) = dictionary.add(&word.replace('’', "'")) {
        tracing::warn!(word, error = %e, "a word of the writer's could not be taken in");
    }
}

/// Two lists of words as one. The first line of a list says how many words
/// it has, which is how much room is made for them: that of the two is
/// their sum.
fn joined(list: &str, more: &str) -> String {
    let (count, words) = list.split_once('\n').unwrap_or((list, ""));
    let (more_count, more_words) = more.split_once('\n').unwrap_or((more, ""));
    let number = |line: &str| line.trim().parse::<usize>().unwrap_or(0);
    let mut all = String::with_capacity(list.len() + more.len() + 1);
    all.push_str(&(number(count) + number(more_count)).to_string());
    all.push('\n');
    all.push_str(words);
    if !all.ends_with('\n') {
        all.push('\n');
    }
    all.push_str(more_words);
    all
}

/// The encoding the files of a dictionary are written in, as its affix file
/// names it (`SET UTF-8`); ISO 8859-1 where it names none, as Hunspell has
/// it. None, where it is one that cannot be read.
fn encoding_of(aff: &[u8]) -> Option<&'static Encoding> {
    let text = aff.strip_prefix(b"\xEF\xBB\xBF").unwrap_or(aff);
    let label = text
        .split(|b| *b == b'\n')
        .map(|line| line.trim_ascii())
        .find_map(|line| line.strip_prefix(b"SET").filter(|rest| rest.first().is_some_and(u8::is_ascii_whitespace)))
        .map(|rest| String::from_utf8_lossy(rest.trim_ascii()).to_ascii_lowercase());
    let Some(label) = label else { return Some(encoding_rs::WINDOWS_1252) };
    let label = match label.as_str() {
        "microsoft-cp1251" => "windows-1251",
        "tis620-2533" => "tis-620",
        other => other,
    };
    Encoding::for_label(label.as_bytes())
}

/// The script of a dictionary's words: that of the letters it tries when it
/// looks for what a word may be, or, where it names none, of its first
/// words.
fn dictionary_script(aff: &str, dic: &str) -> Option<Script> {
    let tried = aff.lines().find_map(|line| line.strip_prefix("TRY").filter(|rest| rest.starts_with([' ', '\t'])));
    tried.and_then(|letters| words::main_script(letters.chars())).or_else(|| {
        words::main_script(dic.lines().skip(1).take(2000).flat_map(|line| line.split('/').next()).flat_map(str::chars))
    })
}

#[cfg(test)]
mod tests;
