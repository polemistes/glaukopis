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

use std::collections::{BTreeSet, HashMap};
use std::path::{Path, PathBuf};
use std::sync::{Arc, OnceLock, PoisonError, RwLock};

use fluent_bundle::FluentResource;
use fluent_bundle::concurrent::FluentBundle;
pub use fluent_bundle::{FluentArgs, FluentValue};
use fluent_syntax::{ast, parser, serializer};
use intl_pluralrules::{PluralCategory, PluralRuleType, PluralRules};
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
    /// "Notes" is `document-notes`. Those built in, whatever own words say.
    english: HashMap<String, String>,
    /// The languages that have own words laid over those built in.
    own: Vec<String>,
}

/// The folder of own words, `words/` of the data directory, once it is
/// known (ADR 0035).
static OWN: RwLock<Option<PathBuf>> = RwLock::new(None);

/// The words, made when they are first asked for, and made anew when the
/// own words are read again.
static WORDS: RwLock<Option<Arc<Words>>> = RwLock::new(None);

fn bundle(tag: &str) -> Bundle {
    let id: LanguageIdentifier = tag.parse().unwrap_or_default();
    let mut bundle = FluentBundle::new_concurrent(vec![id]);
    // Marks that keep right-to-left text apart are not wanted in these languages,
    // and would stand in what is copied and compared.
    bundle.set_use_isolating(false);
    bundle
}

fn words() -> Arc<Words> {
    if let Some(words) = WORDS.read().unwrap_or_else(PoisonError::into_inner).as_ref() {
        return Arc::clone(words);
    }
    let own = OWN.read().unwrap_or_else(PoisonError::into_inner).clone();
    let mut slot = WORDS.write().unwrap_or_else(PoisonError::into_inner);
    Arc::clone(slot.get_or_insert_with(|| Arc::new(make_words(own.as_deref()).0)))
}

/// Reads the own words in a folder, `words/` of the data directory, which
/// has a folder for each language (`words/nb/`) with Fluent files as
/// `locales/` has, and lays them over the words built in: a message there
/// takes the place of the one of the same name. Called again, it reads them
/// again. What does not fit is left out, said in the log, and returned.
pub fn use_own_words(dir: &Path) -> Vec<LeftOut> {
    *OWN.write().unwrap_or_else(PoisonError::into_inner) = Some(dir.to_owned());
    let (words, left_out) = make_words(Some(dir));
    *WORDS.write().unwrap_or_else(PoisonError::into_inner) = Some(Arc::new(words));
    left_out
}

/// The languages whose own words the core has laid over its own.
pub fn own_languages() -> Vec<String> {
    words().own.clone()
}

/// The words built in, and over them the own words of a folder, if there is
/// one; with what of those was left out.
fn make_words(own: Option<&Path>) -> (Words, Vec<LeftOut>) {
    let mut words = Words { messages: HashMap::new(), terms: HashMap::new(), english: HashMap::new(), own: Vec::new() };
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
    let mut left_out = Vec::new();
    for (tag, name, text) in own.map(own_files).unwrap_or_default() {
        let document = name == "document.ftl";
        let into = if document { &mut words.terms } else { &mut words.messages };
        let Some(bundle) = into.get_mut(tag) else { continue };
        let (laid, left) = lay_over(bundle, tag, &name, &text, document);
        if laid > 0 && !words.own.iter().any(|t| t == tag) {
            words.own.push(tag.to_owned());
        }
        left_out.extend(left);
    }
    words.own.sort();
    for left in &left_out {
        tracing::warn!(
            language = left.language,
            file = left.file,
            id = left.id,
            why = left.why,
            "an own word is left out"
        );
    }
    (words, left_out)
}

/// The Fluent files of the core in a folder of own words: those of the
/// languages that have words built in, by language, the name of the file,
/// and what it holds.
fn own_files(dir: &Path) -> Vec<(&'static str, String, String)> {
    let mut out = Vec::new();
    let Ok(entries) = std::fs::read_dir(dir) else { return out };
    let mut folders: Vec<PathBuf> = entries.flatten().map(|e| e.path()).filter(|p| p.is_dir()).collect();
    folders.sort();
    for folder in folders {
        let Some(name) = folder.file_name().and_then(|n| n.to_str()) else { continue };
        let Some(&(tag, _, _)) = files::FILES.iter().find(|(t, _, _)| *t == name) else { continue };
        let Ok(entries) = std::fs::read_dir(&folder) else { continue };
        let mut paths: Vec<PathBuf> = entries.flatten().map(|e| e.path()).filter(|p| p.is_file()).collect();
        paths.sort();
        for path in paths {
            let Some(name) = path.file_name().and_then(|n| n.to_str()).map(str::to_owned) else { continue };
            if !name.ends_with(".ftl") || !(name.starts_with("core") || name == "document.ftl") {
                continue;
            }
            match std::fs::read_to_string(&path) {
                Ok(text) => out.push((tag, name, text)),
                Err(error) => tracing::warn!(path = %path.display(), %error, "a file of own words could not be read"),
            }
        }
    }
    out
}

/// An own word left out, and why.
#[derive(Debug, Clone, serde::Serialize)]
pub struct LeftOut {
    pub language: String,
    pub file: String,
    /// The name of the message, or the beginning of what could not be read.
    pub id: String,
    pub why: String,
}

/// What a pattern uses: its variables, the messages and terms it refers to,
/// and its choices by number, each with the plural forms it names.
#[derive(Debug, Default)]
struct Uses {
    variables: BTreeSet<String>,
    references: BTreeSet<String>,
    selects: Vec<Vec<String>>,
}

/// The plural forms, by the names Fluent and Unicode give them.
const CATEGORIES: &[&str] = &["zero", "one", "two", "few", "many", "other"];

fn uses(pattern: &ast::Pattern<&str>) -> Uses {
    fn pattern_of(pattern: &ast::Pattern<&str>, out: &mut Uses) {
        for element in &pattern.elements {
            if let ast::PatternElement::Placeable { expression } = element {
                expression_of(expression, out);
            }
        }
    }
    fn expression_of(expression: &ast::Expression<&str>, out: &mut Uses) {
        match expression {
            ast::Expression::Select { selector, variants } => {
                inline_of(selector, out);
                let keys: Vec<String> = variants
                    .iter()
                    .map(|v| match &v.key {
                        ast::VariantKey::Identifier { name } => (*name).to_owned(),
                        ast::VariantKey::NumberLiteral { value } => (*value).to_owned(),
                    })
                    .collect();
                // A choice among plural forms names a form besides `other`.
                if keys.iter().any(|k| k != "other" && CATEGORIES.contains(&k.as_str())) {
                    out.selects.push(keys.into_iter().filter(|k| CATEGORIES.contains(&k.as_str())).collect());
                }
                for variant in variants {
                    pattern_of(&variant.value, out);
                }
            }
            ast::Expression::Inline(inline) => inline_of(inline, out),
        }
    }
    fn arguments_of(arguments: &ast::CallArguments<&str>, out: &mut Uses) {
        for a in &arguments.positional {
            inline_of(a, out);
        }
        for a in &arguments.named {
            inline_of(&a.value, out);
        }
    }
    fn inline_of(inline: &ast::InlineExpression<&str>, out: &mut Uses) {
        match inline {
            ast::InlineExpression::VariableReference { id } => {
                out.variables.insert(id.name.to_owned());
            }
            ast::InlineExpression::MessageReference { id, .. } => {
                out.references.insert(id.name.to_owned());
            }
            ast::InlineExpression::TermReference { id, arguments, .. } => {
                out.references.insert(format!("-{}", id.name));
                if let Some(arguments) = arguments {
                    arguments_of(arguments, out);
                }
            }
            ast::InlineExpression::FunctionReference { arguments, .. } => arguments_of(arguments, out),
            ast::InlineExpression::Placeable { expression } => expression_of(expression, out),
            ast::InlineExpression::StringLiteral { .. } | ast::InlineExpression::NumberLiteral { .. } => {}
        }
    }
    let mut out = Uses::default();
    pattern_of(pattern, &mut out);
    out
}

/// The parts of a message, its value (`name`) and its attributes
/// (`name.hint`), each with its pattern.
fn parts<'a, 's>(message: &'a ast::Message<&'s str>) -> Vec<(String, &'a ast::Pattern<&'s str>)> {
    let id = message.id.name;
    message
        .value
        .iter()
        .map(|value| (id.to_owned(), value))
        .chain(message.attributes.iter().map(|a| (format!("{id}.{}", a.id.name), &a.value)))
        .collect()
}

/// What the parts of the English messages built in use, for the core's own
/// messages (`false`) and for the words of documents (`true`).
fn english_uses() -> &'static HashMap<(bool, String), Uses> {
    static USES: OnceLock<HashMap<(bool, String), Uses>> = OnceLock::new();
    USES.get_or_init(|| {
        let mut out = HashMap::new();
        for &(tag, name, text) in files::FILES {
            if tag != ENGLISH {
                continue;
            }
            let document = name == "document.ftl";
            let resource = parser::parse(text).unwrap_or_else(|(resource, _)| resource);
            for entry in &resource.body {
                if let ast::Entry::Message(message) = entry {
                    for (key, pattern) in parts(message) {
                        out.entry((document, key)).or_insert_with(|| uses(pattern));
                    }
                }
            }
        }
        out
    })
}

/// The plural forms of a language: all of them, and those whole numbers take.
fn plurals(tag: &str) -> (BTreeSet<&'static str>, BTreeSet<&'static str>) {
    let rules = [tag.to_owned(), primary(tag), ENGLISH.to_owned()]
        .iter()
        .filter_map(|t| t.parse::<LanguageIdentifier>().ok())
        .find_map(|id| PluralRules::create(id, PluralRuleType::CARDINAL).ok());
    let Some(rules) = rules else { return (BTreeSet::from(["other"]), BTreeSet::from(["other"])) };
    let name = |category: PluralCategory| match category {
        PluralCategory::ZERO => "zero",
        PluralCategory::ONE => "one",
        PluralCategory::TWO => "two",
        PluralCategory::FEW => "few",
        PluralCategory::MANY => "many",
        PluralCategory::OTHER => "other",
    };
    let numbers = (0..=200u64).chain([1000, 1001, 1002, 1005, 1021, 1_000_000]);
    let whole: BTreeSet<&'static str> = numbers.clone().filter_map(|n| rules.select(n).ok()).map(name).collect();
    let mut all = whole.clone();
    for n in numbers {
        for fraction in ["0", "1", "5", "00", "25"] {
            if let Ok(category) = rules.select(format!("{n}.{fraction}").as_str()) {
                all.insert(name(category));
            }
        }
    }
    (all, whole)
}

/// What is wrong with a part of an own message in a language, by what the
/// English of it uses, or nothing: as the interface checks it
/// (`words/fluent.ts`, `fault`). It must use the variables of the English,
/// refer only to what the English refers to, and give every plural form of
/// the language whole numbers take, and none it has not.
fn fault(tag: &str, mine: &Uses, theirs: &Uses) -> Option<String> {
    let list = |set: &BTreeSet<String>| {
        if set.is_empty() { "—".to_owned() } else { set.iter().cloned().collect::<Vec<_>>().join(", ") }
    };
    if mine.variables != theirs.variables {
        return Some(format!("variables: {} ≠ {}", list(&mine.variables), list(&theirs.variables)));
    }
    if let Some(reference) = mine.references.iter().find(|r| !theirs.references.contains(*r)) {
        return Some(format!("a reference the English has not: {reference}"));
    }
    if mine.selects.is_empty() {
        return None;
    }
    let (all, whole) = plurals(tag);
    for keys in &mine.selects {
        let missing: Vec<&str> = whole.iter().copied().filter(|c| !keys.iter().any(|k| k == c)).collect();
        let foreign: Vec<&str> = keys.iter().map(String::as_str).filter(|k| !all.contains(k)).collect();
        if !missing.is_empty() || !foreign.is_empty() {
            return Some(format!("plural forms: lacks {missing:?}, has {foreign:?} besides"));
        }
    }
    None
}

/// Why an own message cannot be laid over the one built in, or nothing.
fn message_fault(tag: &str, message: &ast::Message<&str>, document: bool) -> Option<String> {
    let english = english_uses();
    for (key, pattern) in parts(message) {
        let Some(theirs) = english.get(&(document, key.clone())) else {
            return Some(format!("{key} is not among the English words"));
        };
        if let Some(why) = fault(tag, &uses(pattern), theirs) {
            return Some(format!("{key}: {why}"));
        }
    }
    None
}

/// Lays the messages of a file of own words over a bundle: each that fits
/// takes the place of the one of the same name; the others are left out.
/// How many were laid over, and what was left out.
fn lay_over(bundle: &mut Bundle, tag: &str, file: &str, text: &str, document: bool) -> (usize, Vec<LeftOut>) {
    let left =
        |id: &str, why: String| LeftOut { language: tag.to_owned(), file: file.to_owned(), id: id.to_owned(), why };
    let mut left_out = Vec::new();
    let mut good = Vec::new();
    let resource = parser::parse(text).unwrap_or_else(|(resource, _)| resource);
    for entry in resource.body {
        match entry {
            ast::Entry::Message(message) => match message_fault(tag, &message, document) {
                None => good.push(ast::Entry::Message(ast::Message { comment: None, ..message })),
                Some(why) => left_out.push(left(message.id.name, why)),
            },
            ast::Entry::Term(term) => {
                left_out.push(left(&format!("-{}", term.id.name), "a term, which own words may not give".to_owned()))
            }
            ast::Entry::Junk { content } => {
                let begins = content.lines().next().unwrap_or_default().split('=').next().unwrap_or_default();
                left_out.push(left(begins.trim(), "not good Fluent".to_owned()));
            }
            _ => {}
        }
    }
    let laid = good.len();
    if laid > 0 {
        let source = serializer::serialize(&ast::Resource { body: good });
        match FluentResource::try_new(source) {
            Ok(resource) => bundle.add_resource_overriding(resource),
            Err((_, errors)) => {
                left_out.push(left("*", format!("not read again as it was written: {errors:?}")));
                return (0, left_out);
            }
        }
    }
    (laid, left_out)
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
    say(&words(), tag, id, args)
}

fn say(words: &Words, tag: &str, id: &str, args: Option<&FluentArgs>) -> String {
    [interface_language(tag), ENGLISH]
        .iter()
        .find_map(|tag| words.messages.get(tag).and_then(|bundle| format(bundle, id, args)))
        .unwrap_or_else(|| {
            tracing::warn!(id, "a message has no words");
            id.to_owned()
        })
}

/// A word a document prints, in the language of the document. Nothing where
/// documents have no words in that language.
pub fn term(language: Option<&str>, id: &str) -> Option<String> {
    term_in(&words(), language, id)
}

/// A word a document prints, in the language of documents nearest to a tag,
/// if documents have words in it: `nb` of `nb-NO`, and of `no`.
fn term_in(words: &Words, language: Option<&str>, id: &str) -> Option<String> {
    let language = language.map(str::trim).filter(|l| !l.is_empty()).unwrap_or(ENGLISH);
    let mut tags: Vec<&str> = words.terms.keys().copied().collect();
    tags.sort_unstable();
    let found = nearest(language, &tags)?;
    words.terms.get(found).and_then(|bundle| format(bundle, id, None))
}

/// A word of a format in the language of the document. The formats have
/// their words in English; one that is among the words of documents
/// ("Notes", "Bibliography", "[{} about here]") is given in the language of
/// the document, with its capitals as they were; one of the format's own is
/// kept as it is.
pub fn in_language(language: Option<&str>, word: &str) -> String {
    let trimmed = word.trim();
    let words = words();
    let Some(id) = words.english.get(&trimmed.to_lowercase()) else { return word.to_owned() };
    let Some(said) = term_in(&words, language, id) else { return word.to_owned() };
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

    /// The uses of the value of the first message of a text.
    fn uses_of(text: &str) -> Uses {
        let resource = parser::parse(text).unwrap_or_else(|(resource, _)| resource);
        let Some(ast::Entry::Message(message)) = resource.body.first() else { panic!("no message in {text}") };
        uses(message.value.as_ref().unwrap())
    }

    #[test]
    fn an_own_word_must_have_the_variables_references_and_plural_forms_of_the_english() {
        let english = uses_of("a = { $count ->\n    [one] One { -brand }\n   *[other] { $count } { -brand }\n}\n");
        assert!(english.variables.contains("count"));
        let good = uses_of("a = { $count ->\n    [one] Én\n   *[other] { $count } { -brand }\n}\n");
        assert_eq!(fault("nb", &good, &english), None);
        let lost = uses_of("a = Noen\n");
        assert!(fault("nb", &lost, &english).unwrap().starts_with("variables"));
        let gained = uses_of("a = { $count } { $more }\n");
        assert!(fault("nb", &gained, &english).unwrap().starts_with("variables"));
        let referred = uses_of("a = { $count } { other-message }\n");
        assert!(fault("nb", &referred, &english).unwrap().contains("other-message"));
        // Norwegian has one and other; Polish has one, few and many as well.
        let lacking = uses_of("a = { $count ->\n    [few] få\n   *[other] { $count }\n}\n");
        assert!(fault("nb", &lacking, &english).unwrap().starts_with("plural"));
        assert!(fault("pl", &good, &english).unwrap().starts_with("plural"));
        let polish = uses_of("a = { $count ->\n    [one] a\n    [few] b\n    [many] c\n   *[other] { $count }\n}\n");
        assert_eq!(fault("pl", &polish, &english), None);
        // A choice by other names than plural forms is not one by number.
        let chosen = uses_of("a = { $count ->\n    [all] alle\n   *[none] { $count }\n}\n");
        assert_eq!(fault("nb", &chosen, &english), None);
        let (all, whole) = plurals("nb");
        assert_eq!(whole, BTreeSet::from(["one", "other"]));
        assert!(all.contains("other"));
        let (_, whole) = plurals("sr-Cyrl");
        assert_eq!(whole, BTreeSet::from(["few", "one", "other"]));
    }

    #[test]
    fn own_words_are_laid_over_those_built_in_and_what_does_not_fit_is_left_out() {
        let tmp = tempfile::tempdir().unwrap();
        let nb = tmp.path().join("nb");
        std::fs::create_dir_all(&nb).unwrap();
        std::fs::write(
            nb.join("core.ftl"),
            "# Own words.\n\
             program-missing = Finner ikke { $program }\n\
             core-in-use-title = Glaukopis er åpent i { $path }\n\
             no-such-message = Ingen\n\
             -brand = Glaukopis\n\
             core-export-astray = { $count ->\n    [few] få\n   *[other] { $count }\n}\n\
             this is not = { Fluent\n",
        )
        .unwrap();
        std::fs::write(nb.join("document.ftl"), "document-notes = Sluttnoter\n").unwrap();
        // The interface's files and other files are not the core's.
        std::fs::write(nb.join("common.ftl"), "common-cancel = Nei\n").unwrap();
        std::fs::write(nb.join("notes.txt"), "x").unwrap();
        let en = tmp.path().join("en");
        std::fs::create_dir_all(&en).unwrap();
        std::fs::write(en.join("document.ftl"), "document-notes = Endnotes\n").unwrap();
        // A language that has no words built in is not read, nor a list of spelling.
        std::fs::create_dir_all(tmp.path().join("xx")).unwrap();
        std::fs::write(tmp.path().join("xx/core.ftl"), "program-missing = X { $program }\n").unwrap();
        std::fs::write(tmp.path().join("nb.txt"), "Glaukopis\n").unwrap();

        let (words, left_out) = make_words(Some(tmp.path()));
        let mut args = FluentArgs::new();
        args.set("program", Arg::value("Tesseract"));
        assert_eq!(say(&words, "nb", "program-missing", Some(&args)), "Finner ikke Tesseract");
        // What the own words lack is said as before, and what was left out too.
        assert!(say(&words, "nb", "program-too-old", None).contains("er installert"));
        assert_eq!(say(&words, "nb", "core-in-use-title", None), "Glaukopis er allerede åpent");
        assert!(
            say(&words, "nb", "core-export-astray", None).starts_with("Kryssreferanser"),
            "the built-in one stands"
        );
        assert_eq!(
            say(&words, "en", "program-missing", Some(&args)),
            "Tesseract is not installed or could not be found"
        );
        // The words of documents, and English own words.
        assert_eq!(term_in(&words, Some("nb-NO"), "document-notes").as_deref(), Some("Sluttnoter"));
        assert_eq!(term_in(&words, Some("en-GB"), "document-notes").as_deref(), Some("Endnotes"));
        assert_eq!(term_in(&words, Some("nb"), "document-figure").as_deref(), Some("Figur"));
        // The words of the formats are known by the English built in.
        assert_eq!(words.english.get("notes").map(String::as_str), Some("document-notes"));
        assert_eq!(words.own, ["en", "nb"]);

        let mut left: Vec<&str> = left_out.iter().map(|l| l.id.as_str()).collect();
        left.sort_unstable();
        assert_eq!(left, ["-brand", "core-export-astray", "core-in-use-title", "no-such-message", "this is not"]);
        assert!(left_out.iter().all(|l| l.language == "nb" && l.file == "core.ftl"));

        // Without a folder, or with an empty one, the words are those built in.
        let (built_in, none) = make_words(None);
        assert!(none.is_empty() && built_in.own.is_empty());
        let empty = tempfile::tempdir().unwrap();
        let (words, none) = make_words(Some(empty.path()));
        assert!(none.is_empty());
        assert_eq!(
            say(&words, "nb", "program-missing", Some(&args)),
            "Tesseract er ikke installert, eller ble ikke funnet"
        );
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
        assert_eq!(in_language(Some("de"), "Notes"), "Anmerkungen");
        assert_eq!(in_language(Some("xx"), "Notes"), "Notes");
        assert_eq!(in_language(None, "Notes"), "Notes");
        assert_eq!(term(Some("en-GB"), "document-figure").as_deref(), Some("Figure"));
    }
}
