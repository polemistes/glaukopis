//! What a word may be: which of the words of a text are checked, and in
//! what form they are given to the dictionary.
//!
//! Not checked (ADR 0019): words with digits in them (`1990s`, `H2O`),
//! addresses (`post@example.org`, `example.org`), and words written in
//! another script than the dictionary's, such as Greek in an English text.
//! The interface leaves out much of this before it asks; what it asks about
//! is looked at here again, so that a word that should not be is never
//! called wrong.

use std::borrow::Cow;

use icu_properties::props::Script;
use icu_properties::{CodePointMapData, PropertyNamesShort, PropertyParser};
use unicode_normalization::{IsNormalized, UnicodeNormalization, is_nfc_quick};

/// The script of a letter.
pub fn script_of(c: char) -> Script {
    CodePointMapData::<Script>::new().get(c)
}

/// The name a script has in ISO 15924, which regular expressions of the
/// interface know as well: `Latn`, `Grek`.
pub fn script_name(script: Script) -> Option<&'static str> {
    PropertyNamesShort::<Script>::new().get(script)
}

pub fn script_named(name: &str) -> Option<Script> {
    PropertyParser::<Script>::new().get_strict(name)
}

/// Scripts that letters of any script are written with: marks, and signs
/// that are not letters.
fn is_shared(script: Script) -> bool {
    script == Script::Common || script == Script::Inherited || script == Script::Unknown
}

/// The script that most of the letters are written in.
pub fn main_script(letters: impl Iterator<Item = char>) -> Option<Script> {
    let mut counts: Vec<(Script, usize)> = Vec::new();
    for c in letters.filter(|c| c.is_alphabetic()) {
        let script = script_of(c);
        if is_shared(script) {
            continue;
        }
        match counts.iter_mut().find(|(s, _)| *s == script) {
            Some((_, n)) => *n += 1,
            None => counts.push((script, 1)),
        }
    }
    counts.into_iter().max_by_key(|(_, n)| *n).map(|(s, _)| s)
}

/// Whether the word is written in another script than the dictionary's:
/// it has letters, and none of them is of the dictionary's script. A word
/// that mixes the scripts is checked, and is found wrong, which it most
/// likely is.
pub fn in_another_script(word: &str, script: Script) -> bool {
    let mut other = false;
    for c in word.chars().filter(|c| c.is_alphabetic()) {
        let of = script_of(c);
        if of == script {
            return false;
        }
        other |= !is_shared(of);
    }
    other
}

/// Whether the word looks like an address: of a web page or of a mail box,
/// or the name of a place on the web or of a file, parts that are parted by
/// points (`example.org`, `notes.txt`). An abbreviation has a part of a
/// single letter (`e.g`, `f.eks`), and is checked.
pub fn is_address(word: &str) -> bool {
    if word.contains('@') || word.contains("://") {
        return true;
    }
    let inner = word.trim_end_matches('.');
    inner.contains('.') && inner.split('.').all(|part| part.chars().count() >= 2)
}

/// Whether the word is checked at all, with a dictionary of the script.
pub fn is_checked(word: &str, script: Option<Script>) -> bool {
    word.chars().any(char::is_alphabetic)
        && !word.chars().any(char::is_numeric)
        && !is_address(word)
        && !script.is_some_and(|script| in_another_script(word, script))
}

/// The word as the dictionary is to be given it: composed as Unicode would
/// have it (as the dictionaries are), without soft hyphens, and with
/// hyphens that are not the hyphen of the keyboard made that one, which is
/// the one the dictionaries have.
pub fn prepared(word: &str) -> Cow<'_, str> {
    let plain = |c: char| !matches!(c, '\u{00AD}' | '\u{2010}' | '\u{2011}');
    let word: Cow<'_, str> = if word.chars().all(plain) {
        Cow::Borrowed(word)
    } else {
        Cow::Owned(
            word.chars()
                .filter(|c| *c != '\u{00AD}')
                .map(|c| if matches!(c, '\u{2010}' | '\u{2011}') { '-' } else { c })
                .collect(),
        )
    };
    match is_nfc_quick(word.chars()) {
        IsNormalized::Yes => word,
        _ => Cow::Owned(word.nfc().collect()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn words_with_digits_and_addresses_are_not_checked() {
        let latin = Some(Script::Latin);
        assert!(is_checked("word", latin));
        assert!(is_checked("don't", latin));
        assert!(is_checked("e-post", latin));
        assert!(!is_checked("1990s", latin));
        assert!(!is_checked("H2O", latin));
        assert!(!is_checked("COVID-19", latin));
        assert!(!is_checked("1984", latin));
        assert!(!is_checked("post@example.org", latin));
        assert!(!is_checked("example.org", latin));
        assert!(!is_checked("www.example.org", latin));
        assert!(!is_checked("notes.txt", latin));
        assert!(!is_checked("https://example.org", latin));
        assert!(!is_checked("—", latin));
    }

    #[test]
    fn abbreviations_with_points_are_checked() {
        let latin = Some(Script::Latin);
        assert!(is_checked("e.g.", latin));
        assert!(is_checked("f.eks", latin));
        assert!(is_checked("bl.a.", latin));
        assert!(is_checked("osv.", latin));
    }

    #[test]
    fn words_in_another_script_are_not_checked() {
        let latin = Some(Script::Latin);
        assert!(!is_checked("λόγος", latin));
        assert!(!is_checked("слово", latin));
        assert!(!is_checked("שלום", latin));
        assert!(is_checked("λόγος", Some(Script::Greek)));
        assert!(!is_checked("logos", Some(Script::Greek)));
        // Mixed, as when a Greek letter has come into an English word.
        assert!(is_checked("lοgos", latin));
        // A dictionary whose script is not known checks them all.
        assert!(is_checked("λόγος", None));
    }

    #[test]
    fn the_script_of_a_dictionary_is_that_of_most_of_its_letters() {
        assert_eq!(main_script("ensrtialkogdmpuvfbjhøyåæ".chars()), Some(Script::Latin));
        assert_eq!(main_script("αεινοσταρλ'-".chars()), Some(Script::Greek));
        assert_eq!(main_script("'-.".chars()), None);
        assert_eq!(script_name(Script::Latin), Some("Latn"));
        assert_eq!(script_name(Script::Greek), Some("Grek"));
        assert_eq!(script_named("Cyrl"), Some(Script::Cyrillic));
    }

    #[test]
    fn words_are_given_as_the_dictionaries_have_them() {
        assert_eq!(prepared("word"), "word");
        assert_eq!(prepared("hy\u{00AD}phen"), "hyphen");
        assert_eq!(prepared("e\u{2011}post"), "e-post");
        // An "å" made of an "a" and a ring above.
        assert_eq!(prepared("pa\u{030A}"), "på");
    }
}
