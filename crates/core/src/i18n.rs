//! The words of the application, in the languages it has (ADR 0020).
//!
//! What the core says to the one who uses it is said in the language of the
//! interface, which the application sets ([`set_language`]), with [`tr!`].
//! What a document prints is said in the language of the document
//! ([`term`], [`in_language`]), whatever the interface is in.
//!
//! The words are kept in Fluent files under `locales/`, a directory for each
//! language, which are taken into the program when it is built (see
//! `build.rs`): those whose names begin with `core` for what the core says,
//! and `document.ftl` for what documents print. English is the source: what
//! a translation lacks is said in English, and what English lacks is said by
//! its name, so that it is seen and mended.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{OnceLock, PoisonError, RwLock};

use fluent_bundle::FluentResource;
use fluent_bundle::concurrent::FluentBundle;
pub use fluent_bundle::{FluentArgs, FluentValue};
use unic_langid::LanguageIdentifier;

pub use crate::tr;

mod files {
    include!(concat!(env!("OUT_DIR"), "/locales.rs"));
}

/// The language the words are written in first, and said in where a
/// translation lacks them.
pub const ENGLISH: &str = "en";

/// The languages the application may be in, each with its name in itself:
/// every language that has, or is to have, a folder under `locales/`, in the
/// order they are offered, by alphabet within each script. A language is
/// offered only when its words are there (see [`interface`]).
const NAMES: &[(&str, &str)] = &[
    ("sq", "Shqip"),
    ("bs", "Bosanski"),
    ("cs", "Čeština"),
    ("da", "Dansk"),
    ("de", "Deutsch"),
    ("en", "English"),
    ("es", "Español"),
    ("fr", "Français"),
    ("hr", "Hrvatski"),
    ("is", "Íslenska"),
    ("it", "Italiano"),
    ("nl", "Nederlands"),
    ("nb", "Norsk bokmål"),
    ("nn", "Norsk nynorsk"),
    ("pl", "Polski"),
    ("pt-BR", "Português (Brasil)"),
    ("pt-PT", "Português (Portugal)"),
    ("ro", "Română"),
    ("sk", "Slovenčina"),
    ("sl", "Slovenščina"),
    ("sr-Latn", "Srpski (latinica)"),
    ("fi", "Suomi"),
    ("sv", "Svenska"),
    ("tr", "Türkçe"),
    ("el", "Ελληνικά"),
    ("be", "Беларуская"),
    ("ru", "Русский"),
    ("sr-Cyrl", "Српски (ћирилица)"),
    ("uk", "Українська"),
    ("hi", "हिन्दी"),
    ("mr", "मराठी"),
    ("bn", "বাংলা"),
    ("gu", "ગુજરાતી"),
    ("ta", "தமிழ்"),
    ("te", "తెలుగు"),
    ("zh-Hans", "中文（简体）"),
    ("zh-Hant", "中文（繁體）"),
    ("ja", "日本語"),
];

/// The languages the interface is in: the tag, and the name of the language
/// in itself. Those of [`NAMES`] whose words are there, which is told by
/// the core's own file, `core.ftl`, being among the files compiled in.
pub fn interface() -> &'static [(&'static str, &'static str)] {
    static INTERFACE: OnceLock<Vec<(&'static str, &'static str)>> = OnceLock::new();
    INTERFACE.get_or_init(|| {
        NAMES
            .iter()
            .copied()
            .filter(|(tag, _)| files::FILES.iter().any(|&(t, name, _)| t == *tag && name == "core.ftl"))
            .collect()
    })
}

/// The language of the interface, which is the language the core speaks in.
static LANGUAGE: RwLock<&'static str> = RwLock::new(ENGLISH);

type Bundle = FluentBundle<FluentResource>;

struct Words {
    /// What the core says, by language.
    messages: HashMap<&'static str, Bundle>,
    /// What documents print, by language.
    terms: HashMap<&'static str, Bundle>,
    /// The words of the formats in English, with the names of their terms:
    /// "Notes" is `document-notes`.
    english: HashMap<String, String>,
}

fn bundle(tag: &str) -> Bundle {
    let id: LanguageIdentifier = tag.parse().unwrap_or_default();
    let mut bundle = FluentBundle::new_concurrent(vec![id]);
    // Marks that keep right-to-left text apart are not wanted in these languages,
    // and would stand in what is copied and compared.
    bundle.set_use_isolating(false);
    bundle
}

fn words() -> &'static Words {
    static WORDS: OnceLock<Words> = OnceLock::new();
    WORDS.get_or_init(|| {
        let mut words = Words { messages: HashMap::new(), terms: HashMap::new(), english: HashMap::new() };
        for &(tag, name, text) in files::FILES {
            let resource = FluentResource::try_new(text.to_owned()).unwrap_or_else(|(resource, errors)| {
                tracing::warn!(language = tag, file = name, ?errors, "a file of words has faults");
                resource
            });
            let into = if name == "document.ftl" { &mut words.terms } else { &mut words.messages };
            let bundle = into.entry(tag).or_insert_with(|| bundle(tag));
            // A name given twice is kept as it was first given.
            if let Err(errors) = bundle.add_resource(resource) {
                tracing::warn!(language = tag, file = name, ?errors, "a file of words gives names twice");
            }
        }
        if let Some(english) = words.terms.get(ENGLISH) {
            for &(tag, name, text) in files::FILES {
                if tag != ENGLISH || name != "document.ftl" {
                    continue;
                }
                for id in names(text) {
                    if let Some(word) = format(english, &id, None) {
                        words.english.insert(word.to_lowercase(), id);
                    }
                }
            }
        }
        words
    })
}

/// The names of the messages in a Fluent file, in their order.
pub fn names(text: &str) -> Vec<String> {
    text.lines()
        .filter(|line| line.starts_with(|c: char| c.is_ascii_alphabetic()))
        .filter_map(|line| line.split_once('=').map(|(name, _)| name.trim().to_owned()))
        .collect()
}

fn format(bundle: &Bundle, id: &str, args: Option<&FluentArgs>) -> Option<String> {
    let pattern = bundle.get_message(id)?.value()?;
    let mut errors = Vec::new();
    let said = bundle.format_pattern(pattern, args, &mut errors);
    if !errors.is_empty() {
        tracing::warn!(id, ?errors, "a message could not be said as it is written");
    }
    Some(said.into_owned())
}

/// The first part of a tag of a language, in small letters: `nb` of
/// `nb_NO.UTF-8`, `en` of `en-GB`.
fn primary(tag: &str) -> String {
    tag.trim().split(['-', '_', '.', '@']).next().unwrap_or_default().to_ascii_lowercase()
}

/// The second part of a tag, where it names a country: `GB` of `en-GB`.
fn region(tag: &str) -> Option<String> {
    let rest = tag.trim().split(['.', '@']).next().unwrap_or_default();
    rest.split(['-', '_'])
        .skip(1)
        .find(|p| p.len() == 2 && p.chars().all(|c| c.is_ascii_alphabetic()))
        .map(|p| p.to_ascii_uppercase())
}

/// A tag taken apart: the language in small letters, the script as `Latn`,
/// the region as `BR`. `nb_NO.UTF-8`, `zh-Hant-TW`, `sr_RS@latin` and
/// `pt-BR` are all read. Norwegian without more is Bokmål.
struct Pieces {
    language: String,
    script: Option<String>,
    region: Option<String>,
}

fn pieces(tag: &str) -> Pieces {
    let tag = tag.trim();
    let (head, modifier) = tag.split_once('@').unwrap_or((tag, ""));
    let head = head.split('.').next().unwrap_or_default();
    let mut subtags = head.split(['-', '_']).filter(|s| !s.is_empty());
    let language = subtags.next().unwrap_or_default().to_ascii_lowercase();
    let language = if language == "no" { "nb".to_owned() } else { language };
    let mut script = None;
    let mut region = None;
    for s in subtags {
        if script.is_none() && s.len() == 4 && s.chars().all(|c| c.is_ascii_alphabetic()) {
            let (first, rest) = s.split_at(1);
            script = Some(format!("{}{}", first.to_ascii_uppercase(), rest.to_ascii_lowercase()));
        } else if region.is_none()
            && ((s.len() == 2 && s.chars().all(|c| c.is_ascii_alphabetic()))
                || (s.len() == 3 && s.chars().all(|c| c.is_ascii_digit())))
        {
            region = Some(s.to_ascii_uppercase());
        }
    }
    match modifier.to_ascii_lowercase().as_str() {
        "latin" => script = Some("Latn".to_owned()),
        "cyrillic" => script = Some("Cyrl".to_owned()),
        _ => {}
    }
    Pieces { language, script, region }
}

/// The tag among those available that is nearest to a tag: the same with
/// its script and region, then with its script, then with its region, then
/// the language alone; then what the language means without more
/// (Portuguese is Portugal's, Chinese is simplified, Serbian is Cyrillic,
/// unless the region or the script says otherwise); then any of the
/// language. Nothing, where the language is not among them.
pub fn nearest<'a>(tag: &str, available: &[&'a str]) -> Option<&'a str> {
    let p = pieces(tag);
    if p.language.is_empty() {
        return None;
    }
    let has = |t: &str| available.iter().copied().find(|a| a.eq_ignore_ascii_case(t));
    let mut tries = Vec::new();
    if let (Some(s), Some(r)) = (&p.script, &p.region) {
        tries.push(format!("{}-{s}-{r}", p.language));
    }
    if let Some(s) = &p.script {
        tries.push(format!("{}-{s}", p.language));
    }
    if let Some(r) = &p.region {
        tries.push(format!("{}-{r}", p.language));
    }
    tries.push(p.language.clone());
    if let Some(found) = tries.iter().find_map(|t| has(t)) {
        return Some(found);
    }
    let usual = match p.language.as_str() {
        "pt" => Some(if p.region.as_deref() == Some("BR") { "pt-BR" } else { "pt-PT" }),
        "zh" => {
            Some(if p.script.as_deref() == Some("Hant") || matches!(p.region.as_deref(), Some("TW" | "HK" | "MO")) {
                "zh-Hant"
            } else {
                "zh-Hans"
            })
        }
        "sr" => Some(if p.script.as_deref() == Some("Latn") { "sr-Latn" } else { "sr-Cyrl" }),
        _ => None,
    };
    if let Some(found) = usual.and_then(has) {
        return Some(found);
    }
    available.iter().copied().find(|a| primary(a) == p.language)
}

/// The language of the interface that is nearest to what a system or a
/// person says (see [`nearest`]); English, where the interface is not in
/// the language.
pub fn interface_language(tag: &str) -> &'static str {
    let tags: Vec<&'static str> = interface().iter().map(|(t, _)| *t).collect();
    nearest(tag, &tags).unwrap_or(ENGLISH)
}

/// Sets the language the core speaks in: that of the interface.
pub fn set_language(tag: &str) {
    *LANGUAGE.write().unwrap_or_else(PoisonError::into_inner) = interface_language(tag);
}

/// The language the core speaks in.
pub fn language() -> &'static str {
    *LANGUAGE.read().unwrap_or_else(PoisonError::into_inner)
}

/// What the system says its language is, as a tag (`nb-NO`); or what
/// `GLAUKOPIS_LANGUAGE` says, where it is set, which the tests of the running
/// application use. English where nothing is said.
pub fn system_tag() -> String {
    let said =
        std::env::var("GLAUKOPIS_LANGUAGE").ok().filter(|v| !v.trim().is_empty()).or_else(sys_locale::get_locale);
    said.map(|tag| normalise(&tag)).filter(|tag| !tag.is_empty()).unwrap_or_else(|| ENGLISH.to_owned())
}

/// A tag as the system gives it, as a tag of BCP 47: `nb_NO.UTF-8` is
/// `nb-NO`, `sr_RS@latin` is `sr-Latn-RS`; the language of no language,
/// `C` and `POSIX`, is English.
fn normalise(tag: &str) -> String {
    let p = pieces(tag);
    if p.language.is_empty() || p.language == "c" || p.language == "posix" {
        return ENGLISH.to_owned();
    }
    let mut out = p.language;
    if let Some(script) = p.script {
        out.push('-');
        out.push_str(&script);
    }
    if let Some(region) = p.region {
        out.push('-');
        out.push_str(&region);
    }
    out
}

/// The languages that documents have words of their own in.
pub fn text_languages() -> Vec<&'static str> {
    let mut tags: Vec<&'static str> = words().terms.keys().copied().collect();
    tags.sort_unstable();
    tags
}

/// The language new texts are given, from what the system says: that
/// language where documents have words in it, and English otherwise. English
/// is British where the country writes so, and American elsewhere.
pub fn text_language(system: &str) -> String {
    if let Some(found) = nearest(system, &text_languages()).filter(|t| primary(t) != ENGLISH) {
        return found.to_owned();
    }
    match region(system).as_deref() {
        Some("GB" | "IE" | "AU" | "NZ" | "ZA" | "IN") if primary(system) == ENGLISH => "en-GB".to_owned(),
        _ => "en-US".to_owned(),
    }
}

/// What the core says by the name of the message, in the language of the
/// interface. Use [`tr!`].
pub fn message(id: &str, args: Option<&FluentArgs>) -> String {
    message_in(language(), id, args)
}

/// What the core says by the name of the message, in a language of the
/// interface, or in English where that lacks it.
pub fn message_in(tag: &str, id: &str, args: Option<&FluentArgs>) -> String {
    let words = words();
    [interface_language(tag), ENGLISH]
        .iter()
        .find_map(|tag| words.messages.get(tag).and_then(|bundle| format(bundle, id, args)))
        .unwrap_or_else(|| {
            tracing::warn!(id, "a message has no words");
            id.to_owned()
        })
}

/// The language of documents nearest to a tag, if documents have words in
/// it: `nb` of `nb-NO`, and of `no`.
fn text_bundle(language: Option<&str>) -> Option<&'static Bundle> {
    let language = language.map(str::trim).filter(|l| !l.is_empty()).unwrap_or(ENGLISH);
    let found = nearest(language, &text_languages())?;
    words().terms.get(found)
}

/// A word a document prints, in the language of the document. Nothing where
/// documents have no words in that language.
pub fn term(language: Option<&str>, id: &str) -> Option<String> {
    text_bundle(language).and_then(|bundle| format(bundle, id, None))
}

/// A word of a format in the language of the document. The formats have
/// their words in English; one that is among the words of documents
/// ("Notes", "Bibliography", "[{} about here]") is given in the language of
/// the document, with its capitals as they were; one of the format's own is
/// kept as it is.
pub fn in_language(language: Option<&str>, word: &str) -> String {
    let trimmed = word.trim();
    let Some(id) = words().english.get(&trimmed.to_lowercase()) else { return word.to_owned() };
    let Some(said) = term(language, id) else { return word.to_owned() };
    let letters = || trimmed.chars().filter(|c| c.is_alphabetic());
    if letters().count() > 1 && !letters().any(char::is_lowercase) {
        // NOTES
        said.to_uppercase()
    } else if letters().next().is_some_and(char::is_lowercase) {
        // fig., where the text points to a figure
        let mut chars = said.chars();
        chars.next().map(|first| first.to_lowercase().chain(chars).collect()).unwrap_or(said)
    } else {
        said
    }
}

/// What can be given to a message: words, numbers and paths.
pub trait Arg {
    fn value(self) -> FluentValue<'static>;
}

impl Arg for &str {
    fn value(self) -> FluentValue<'static> {
        FluentValue::from(self.to_owned())
    }
}

impl Arg for String {
    fn value(self) -> FluentValue<'static> {
        FluentValue::from(self)
    }
}

impl Arg for &String {
    fn value(self) -> FluentValue<'static> {
        FluentValue::from(self.clone())
    }
}

impl Arg for &Path {
    fn value(self) -> FluentValue<'static> {
        FluentValue::from(self.display().to_string())
    }
}

impl Arg for &PathBuf {
    fn value(self) -> FluentValue<'static> {
        FluentValue::from(self.display().to_string())
    }
}

macro_rules! numbers {
    ($($t:ty),*) => {$(
        impl Arg for $t {
            fn value(self) -> FluentValue<'static> {
                FluentValue::from(self)
            }
        }
    )*};
}
numbers!(u8, u16, u32, u64, usize, i8, i16, i32, i64, isize, f32, f64);

/// What the core says, in the language of the interface, by the name of the
/// message in `locales/<language>/core*.ftl`, with what is to be put into it:
///
/// ```ignore
/// tr!("ocr-no-tesseract")
/// tr!("ocr-page-of", page = 3, pages = 12)
/// ```
#[macro_export]
macro_rules! tr {
    ($id:literal $(,)?) => {
        $crate::i18n::message($id, None)
    };
    ($id:literal, $($name:ident = $value:expr),+ $(,)?) => {{
        let mut args = $crate::i18n::FluentArgs::new();
        $( args.set(stringify!($name), $crate::i18n::Arg::value($value)); )+
        $crate::i18n::message($id, Some(&args))
    }};
}

#[cfg(test)]
mod tests {
    use std::collections::{BTreeMap, BTreeSet};

    use super::*;

    /// The names of the messages of the files of a language whose names
    /// begin as given, with the variables each uses.
    fn catalogue(tag: &str, file: impl Fn(&str) -> bool) -> BTreeMap<String, BTreeSet<String>> {
        let mut out = BTreeMap::new();
        for &(t, name, text) in files::FILES {
            if t != tag || !file(name) {
                continue;
            }
            let mut current: Option<String> = None;
            for line in text.lines() {
                if line.starts_with(|c: char| c.is_ascii_alphabetic()) {
                    current = line.split_once('=').map(|(n, _)| n.trim().to_owned());
                    if let Some(id) = &current {
                        assert!(out.insert(id.clone(), BTreeSet::new()).is_none(), "{id} is given twice in {tag}");
                    }
                }
                // What a comment says of a variable is not a variable.
                if let Some(id) = current.as_ref().filter(|_| !line.starts_with('#')) {
                    let vars = out.get_mut(id).unwrap();
                    let mut rest = line;
                    while let Some(at) = rest.find('$') {
                        rest = &rest[at + 1..];
                        let name: String =
                            rest.chars().take_while(|c| c.is_ascii_alphanumeric() || *c == '_' || *c == '-').collect();
                        if !name.is_empty() {
                            vars.insert(name);
                        }
                    }
                }
            }
        }
        out
    }

    fn core(name: &str) -> bool {
        name.starts_with("core")
    }

    #[test]
    fn every_file_of_words_reads_without_fault() {
        for &(tag, name, text) in files::FILES {
            if let Err((_, errors)) = FluentResource::try_new(text.to_owned()) {
                panic!("{tag}/{name}: {errors:?}");
            }
        }
    }

    /// The languages that must have every message: the Norwegian of the
    /// application's author. The others may lack messages, which are then
    /// said in English, but may have nothing wrong.
    const COMPLETE: &[&str] = &["nb"];
    /// The languages whose words of documents must all be there.
    const COMPLETE_DOCUMENTS: &[&str] = &["nb", "nn"];

    #[test]
    fn the_translations_are_complete_where_they_must_be_and_nowhere_wrong() {
        let english = catalogue(ENGLISH, core);
        assert!(!english.is_empty());
        let tags: BTreeSet<&str> = files::FILES.iter().map(|&(tag, _, _)| tag).filter(|t| *t != ENGLISH).collect();
        for tag in &tags {
            let other = catalogue(tag, core);
            if COMPLETE.contains(tag) {
                let lacking: Vec<_> = english.keys().filter(|k| !other.contains_key(*k)).collect();
                assert!(lacking.is_empty(), "{tag} lacks {lacking:?}");
            }
            let extra: Vec<_> = other.keys().filter(|k| !english.contains_key(*k)).collect();
            assert!(extra.is_empty(), "{tag} has what English has not: {extra:?}");
            for (id, vars) in &other {
                assert_eq!(vars, &english[id], "{tag}: {id} has other variables");
            }
        }
        let english = catalogue(ENGLISH, |n| n == "document.ftl");
        for tag in text_languages().into_iter().filter(|t| *t != ENGLISH) {
            let other = catalogue(tag, |n| n == "document.ftl");
            if COMPLETE_DOCUMENTS.contains(&tag) {
                assert_eq!(other.keys().collect::<Vec<_>>(), english.keys().collect::<Vec<_>>(), "{tag}");
            } else {
                let extra: Vec<_> = other.keys().filter(|k| !english.contains_key(*k)).collect();
                assert!(extra.is_empty(), "{tag} has words of documents English has not: {extra:?}");
            }
        }
    }

    #[test]
    fn every_language_that_has_words_is_named() {
        let tags: BTreeSet<&str> = files::FILES.iter().map(|&(tag, _, _)| tag).collect();
        for tag in tags {
            assert!(NAMES.iter().any(|(t, _)| *t == tag), "{tag} has a folder under locales/ and no name in NAMES");
        }
    }

    /// Every name the code says something by is there in English.
    #[test]
    fn every_message_the_code_names_is_there() {
        let english = catalogue(ENGLISH, core);
        let terms = catalogue(ENGLISH, |n| n == "document.ftl");
        let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
        let mut missing = Vec::new();
        let mut seen = 0;
        for dir in ["crates/core/src", "crates/server/src", "src-tauri/src"] {
            let mut stack = vec![root.join(dir)];
            while let Some(path) = stack.pop() {
                if path.is_dir() {
                    stack.extend(std::fs::read_dir(&path).unwrap().flatten().map(|e| e.path()));
                    continue;
                }
                if path.extension().is_none_or(|e| e != "rs") || path.ends_with("i18n.rs") {
                    continue;
                }
                let text = std::fs::read_to_string(&path).unwrap();
                for (mark, catalogue) in [("tr!(\"", &english), ("term(", &terms)] {
                    for (at, _) in text.match_indices(mark) {
                        // `locator_term(` is not `term(`.
                        if text[..at].ends_with(|c: char| c.is_alphanumeric() || c == '_') {
                            continue;
                        }
                        let rest = &text[at + mark.len()..];
                        let rest = if mark == "term(" {
                            // term(language, "document-notes")
                            match rest.split_once('"') {
                                Some((before, after)) if !before.contains(')') => after,
                                _ => continue,
                            }
                        } else {
                            rest
                        };
                        let Some((id, _)) = rest.split_once('"') else { continue };
                        seen += 1;
                        if !catalogue.contains_key(id) {
                            missing.push(format!("{}: {id}", path.display()));
                        }
                    }
                }
            }
        }
        assert!(missing.is_empty(), "named in the code and not there in English: {missing:#?}");
        assert!(seen > 0);
    }

    #[test]
    fn the_language_of_the_interface_is_the_nearest_it_has() {
        assert_eq!(interface_language("nb-NO"), "nb");
        assert_eq!(interface_language("nb_NO.UTF-8"), "nb");
        assert_eq!(interface_language("no"), "nb");
        assert_eq!(interface_language("en-GB"), "en");
        assert_eq!(interface_language("xx-XX"), "en");
        assert_eq!(interface_language(""), "en");
        assert_eq!(normalise("nb_NO.UTF-8"), "nb-NO");
        assert_eq!(normalise("C.UTF-8"), "en");
        assert_eq!(normalise("sr_RS@latin"), "sr-Latn-RS");
        assert_eq!(normalise("zh_TW.UTF-8"), "zh-TW");
        assert_eq!(normalise("zh-Hant-HK"), "zh-Hant-HK");
    }

    #[test]
    fn the_nearest_language_is_found() {
        let portuguese = ["pt-PT", "pt-BR"];
        assert_eq!(nearest("pt-BR", &portuguese), Some("pt-BR"));
        assert_eq!(nearest("pt_PT.UTF-8", &portuguese), Some("pt-PT"));
        assert_eq!(nearest("pt", &portuguese), Some("pt-PT"));
        assert_eq!(nearest("pt-AO", &portuguese), Some("pt-PT"));
        let chinese = ["zh-Hans", "zh-Hant"];
        assert_eq!(nearest("zh-TW", &chinese), Some("zh-Hant"));
        assert_eq!(nearest("zh_CN.UTF-8", &chinese), Some("zh-Hans"));
        assert_eq!(nearest("zh-Hant-HK", &chinese), Some("zh-Hant"));
        assert_eq!(nearest("zh", &chinese), Some("zh-Hans"));
        let serbian = ["sr-Cyrl", "sr-Latn"];
        assert_eq!(nearest("sr_RS@latin", &serbian), Some("sr-Latn"));
        assert_eq!(nearest("sr-Latn-RS", &serbian), Some("sr-Latn"));
        assert_eq!(nearest("sr", &serbian), Some("sr-Cyrl"));
        let some = ["en", "nb", "nn", "de"];
        assert_eq!(nearest("no", &some), Some("nb"));
        assert_eq!(nearest("nn-NO", &some), Some("nn"));
        assert_eq!(nearest("nb_NO.UTF-8", &some), Some("nb"));
        assert_eq!(nearest("de-AT", &some), Some("de"));
        assert_eq!(nearest("en-GB", &some), Some("en"));
        assert_eq!(nearest("fr", &some), None);
        assert_eq!(nearest("", &some), None);
    }

    #[test]
    fn new_texts_are_in_the_language_of_the_system_where_documents_have_it() {
        assert_eq!(text_language("nb-NO"), "nb");
        assert_eq!(text_language("no"), "nb");
        assert_eq!(text_language("nn-NO"), "nn");
        assert_eq!(text_language("en-GB"), "en-GB");
        assert_eq!(text_language("en-US"), "en-US");
        assert_eq!(text_language("en"), "en-US");
        assert_eq!(text_language("xx-XX"), "en-US");
    }

    // The language of the interface is not set here: it is one for the whole
    // program, and the tests run side by side.
    #[test]
    fn a_message_is_said_in_the_language_asked_for_and_in_english_where_it_lacks() {
        let mut args = FluentArgs::new();
        args.set("program", Arg::value("Tesseract"));
        let norwegian = message_in("nb-NO", "program-missing", Some(&args));
        let english = message_in("en", "program-missing", Some(&args));
        assert_eq!(english, "Tesseract is not installed or could not be found");
        assert!(norwegian.starts_with("Tesseract er ikke installert"), "{norwegian}");
        assert_eq!(message_in("xx", "program-missing", Some(&args)), english);
        assert_eq!(message("no-such-message", None), "no-such-message");
        assert_eq!(crate::tr!("program-missing", program = "Typst"), "Typst is not installed or could not be found");
    }

    #[test]
    fn the_words_of_a_format_are_given_in_the_language_of_the_document() {
        assert_eq!(in_language(Some("nb"), "Notes"), "Noter");
        assert_eq!(in_language(Some("nb-NO"), "NOTES"), "NOTER");
        assert_eq!(in_language(Some("nb"), "Bibliography"), "Litteratur");
        assert_eq!(in_language(Some("nn"), "Abstract"), "Samandrag");
        assert_eq!(in_language(Some("nb"), "[{} about here]"), "[{} omtrent her]");
        assert_eq!(in_language(Some("nb"), "fig."), "fig.");
        assert_eq!(in_language(Some("nb"), "Tables"), "Tabeller");
        assert_eq!(in_language(Some("nb"), "table"), "tabell");
        // A word of the format's own, and a language documents have no words in.
        assert_eq!(in_language(Some("nb"), "Endnoter i boka"), "Endnoter i boka");
        assert_eq!(in_language(Some("de"), "Notes"), "Notes");
        assert_eq!(in_language(None, "Notes"), "Notes");
        assert_eq!(term(Some("en-GB"), "document-figure").as_deref(), Some("Figure"));
    }
}
