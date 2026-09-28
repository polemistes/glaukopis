//! Tests of spelling, with the dictionaries that come with the application
//! and with small ones made for the test.

use std::path::{Path, PathBuf};
use std::sync::OnceLock;

use super::*;

fn resources() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../resources")
}

fn application(words: &Path) -> Spelling {
    Spelling::new(vec![Place::new(resources().join("dictionaries"), Source::Application)], words)
}

/// The dictionaries of the application, read once for all the tests that
/// only check: the Norwegian ones take a while. Nothing is added to the
/// writer's words through it, so their folder is never made.
fn shared() -> &'static Spelling {
    static SHARED: OnceLock<Spelling> = OnceLock::new();
    SHARED.get_or_init(|| application(&std::env::temp_dir().join(format!("glaukopis-words-{}", std::process::id()))))
}

fn right(spelling: &Spelling, language: Option<&str>, words: &[&str]) -> Vec<bool> {
    let words: Vec<String> = words.iter().map(|w| w.to_string()).collect();
    spelling.check(language, &words).unwrap()
}

#[test]
fn the_dictionaries_of_the_application_are_found() {
    let found = shared().languages();
    let tags: Vec<&str> = found.iter().map(|f| f.tag.as_str()).collect();
    assert_eq!(tags, ["en-GB", "en-US", "nb-NO", "nn-NO"]);
    assert!(found.iter().all(|f| f.source == Source::Application));
}

#[test]
fn english_without_a_country_takes_the_words_of_both() {
    let spelling = shared();
    assert_eq!(right(spelling, Some("en-US"), &["color", "colour"]), [true, false]);
    assert_eq!(right(spelling, Some("en-GB"), &["color", "colour"]), [false, true]);
    assert_eq!(right(spelling, Some("en"), &["color", "colour", "colr"]), [true, true, false]);
    // A map that says nothing of its language is in English.
    assert_eq!(right(spelling, None, &["organize", "organise"]), [true, true]);
    // The apostrophe of the keyboard and the typographic one.
    assert_eq!(right(spelling, Some("en"), &["don't", "don’t", "manuscript’s"]), [true, true, true]);
}

#[test]
fn norwegian_compounds_and_genitives_are_right() {
    let spelling = shared();
    // Neither list has these as they stand: they are made by putting words
    // together, and by the genitive.
    assert_eq!(
        right(
            spelling,
            Some("nb"),
            &["kaffemaskinreparatør", "sykkelverkstedeier", "språkrådsdirektør", "verdens", "kildekritikkens"]
        ),
        [true, true, true, true, true]
    );
    // Words of the revision of Bokmålsordboka, which only the newer list has.
    assert_eq!(right(spelling, Some("nb"), &["koronapandemi", "klimaflyktning"]), [true, true]);
    assert_eq!(right(spelling, Some("nb"), &["forsjell", "kaffemaskinreperatør"]), [false, false]);
    // Norwegian without more is Bokmål.
    assert_eq!(right(spelling, Some("no"), &["ikke", "ikkje"]), [true, false]);
    assert_eq!(right(spelling, Some("nn"), &["ikke", "ikkje", "kjeldekritikk"]), [false, true, true]);
}

#[test]
fn what_is_not_checked_is_right() {
    let spelling = shared();
    assert_eq!(
        right(spelling, Some("en"), &["1990s", "λόγος", "example.org", "post@example.org", "e.g.", "Xqzv"]),
        [true, true, true, true, true, false]
    );
}

#[test]
fn how_a_language_is_checked() {
    let spelling = shared();
    let english = spelling.prepare(Some("en")).unwrap().unwrap();
    let tags: Vec<&str> = english.dictionaries.iter().map(|d| d.tag.as_str()).collect();
    assert_eq!(tags, ["en-US", "en-GB"]);
    assert_eq!(english.script.as_deref(), Some("Latn"));
    assert_eq!(english.words, "en");

    let british = spelling.prepare(Some("en-GB")).unwrap().unwrap();
    assert_eq!(british.dictionaries.len(), 1);
    assert_eq!(british.words, "en");

    assert!(spelling.prepare(Some("la")).unwrap().is_none());
    let error = spelling.check(Some("la"), &["verbum".to_owned()]).unwrap_err();
    assert_eq!(error.kind(), "not-found");
}

#[test]
fn what_a_misspelt_word_may_be() {
    let spelling = shared();
    assert!(spelling.suggest(Some("en"), "recieve").unwrap().contains(&"receive".to_owned()));
    assert_eq!(spelling.suggest(Some("nb"), "forsjell").unwrap().first().map(String::as_str), Some("forskjell"));
    let many = spelling.suggest(Some("en"), "teh").unwrap();
    assert!(!many.is_empty() && many.len() <= SUGGESTIONS);
}

#[test]
fn the_writers_own_words_are_taken_in() {
    let tmp = tempfile::tempdir().unwrap();
    let words = tmp.path().join("words");
    let spelling = application(&words);
    assert_eq!(right(&spelling, Some("en-GB"), &["Glaukopis"]), [false]);

    // Added in a British text, the word holds in English of every kind: in
    // the dictionary that was read, at once, and in the one that was not,
    // when it is read.
    spelling.add_word(Some("en-GB"), "Glaukopis").unwrap();
    assert_eq!(right(&spelling, Some("en-GB"), &["Glaukopis", "GLAUKOPIS"]), [true, true]);
    assert_eq!(right(&spelling, Some("en-US"), &["Glaukopis"]), [true]);
    assert_eq!(spelling.own_words().get("en").map(Vec::as_slice), Some(["Glaukopis".to_owned()].as_slice()));

    // And after the application has been started again.
    let again = application(&words);
    assert_eq!(right(&again, Some("en"), &["Glaukopis"]), [true]);

    again.remove_word("en", "Glaukopis").unwrap();
    assert_eq!(right(&again, Some("en"), &["Glaukopis"]), [false]);
    assert!(again.own_words().is_empty());

    assert!(again.add_word(Some("en"), "two words").is_err());
}

/// A dictionary made for a test: its affix file and its words, written in
/// the encoding given.
fn small_dictionary(dir: &Path, name: &str, aff: &str, dic: &str, encoding: &'static Encoding) {
    fs::create_dir_all(dir).unwrap();
    fs::write(dir.join(format!("{name}.aff")), encoding.encode(aff).0).unwrap();
    fs::write(dir.join(format!("{name}.dic")), encoding.encode(dic).0).unwrap();
}

#[test]
fn dictionaries_in_other_encodings_are_read() {
    let tmp = tempfile::tempdir().unwrap();
    let dir = tmp.path().join("dictionaries");
    small_dictionary(&dir, "nb_NO", "SET ISO8859-1\nTRY eæøå\n", "2\nblåbær\nsmørbrød\n", encoding_rs::WINDOWS_1252);
    // Hunspell takes a dictionary that names no encoding to be in ISO 8859-1.
    small_dictionary(&dir, "da_DK", "TRY eæøå\n", "1\nrødgrød\n", encoding_rs::WINDOWS_1252);
    small_dictionary(&dir, "sv_SE", "\u{FEFF}SET UTF-8\n", "\u{FEFF}1\nsmörgås\n", encoding_rs::UTF_8);
    let spelling = Spelling::new(vec![Place::new(&dir, Source::Own)], tmp.path().join("words"));
    assert_eq!(right(&spelling, Some("nb"), &["blåbær", "blabær", "smørbrød"]), [true, false, true]);
    assert_eq!(right(&spelling, Some("da"), &["rødgrød"]), [true]);
    assert_eq!(right(&spelling, Some("sv"), &["smörgås"]), [true]);
}

#[test]
fn an_extra_list_is_read_with_its_dictionary() {
    let tmp = tempfile::tempdir().unwrap();
    let dir = tmp.path().join("dictionaries");
    small_dictionary(&dir, "nb_NO", "SET UTF-8\nSFX A Y 1\nSFX A 0 s .\n", "1\nhus\n", encoding_rs::UTF_8);
    small_dictionary(&dir.join("extra"), "nb_NO", "", "1\nbok/A\n", encoding_rs::UTF_8);
    let spelling = Spelling::new(vec![Place::new(&dir, Source::Own)], tmp.path().join("words"));
    assert_eq!(right(&spelling, Some("nb"), &["hus", "bok", "boks", "huss"]), [true, true, true, false]);
}

#[test]
fn a_dictionary_of_another_script_leaves_the_words_of_others_alone() {
    let tmp = tempfile::tempdir().unwrap();
    let dir = tmp.path().join("dictionaries");
    small_dictionary(&dir, "el_GR", "SET UTF-8\nTRY αεινοσ\n", "1\nλόγος\n", encoding_rs::UTF_8);
    let spelling = Spelling::new(vec![Place::new(&dir, Source::Own)], tmp.path().join("words"));
    assert_eq!(spelling.prepare(Some("el")).unwrap().unwrap().script.as_deref(), Some("Grek"));
    assert_eq!(right(&spelling, Some("el"), &["λόγος", "λόγοι", "logos"]), [true, false, true]);
}
