//! MARC 21 records in XML into drafts.
//!
//! This is the form in which library catalogues give their records: K10plus,
//! the Norwegian libraries, the Deutsche Nationalbibliothek and the Library
//! of Congress all send it, so one reader serves them all. They differ in
//! how they fill it in. Some end every part of the description with the
//! punctuation that separates it from the next (`Ancient literacy /`), some
//! do not; some say what a person did in a code, some in a word of their own
//! language, some not at all.

use crate::bib::latex::fold;
use crate::bib::names::Person;
use crate::library::entry::Draft;
use crate::tr;
use crate::written::{
    identifiers::{doi, isbn},
    languages,
};

use super::text::{self, without_isbd};

#[derive(Debug, Clone, Default)]
pub(crate) struct Field {
    pub tag: String,
    pub ind1: char,
    pub ind2: char,
    pub subfields: Vec<(char, String)>,
}

#[derive(Debug, Clone, Default)]
pub(crate) struct Record {
    /// Read by position, and therefore kept as it came.
    pub leader: String,
    pub control: Vec<(String, String)>,
    pub fields: Vec<Field>,
}

impl Field {
    pub fn get(&self, code: char) -> Option<&str> {
        self.all(code).next()
    }

    pub fn all(&self, code: char) -> impl Iterator<Item = &str> {
        self.subfields.iter().filter(move |(c, v)| *c == code && !v.is_empty()).map(|(_, v)| v.as_str())
    }

    fn position(&self, code: char) -> Option<usize> {
        self.subfields.iter().position(|(c, _)| *c == code)
    }
}

impl Record {
    /// Reads a `record` element. `None` when it is not a record: the
    /// envelope in which catalogues send records is made of elements of the
    /// same name.
    pub fn read(node: roxmltree::Node) -> Option<Record> {
        let named = |n: &roxmltree::Node, name: &str| n.is_element() && n.tag_name().name() == name;
        let leader = node.children().find(|c| named(c, "leader"))?.text().unwrap_or("").to_owned();
        let mut record = Record { leader, ..Default::default() };
        let indicator =
            |n: &roxmltree::Node, name: &str| n.attribute(name).and_then(|v| v.chars().next()).unwrap_or(' ');
        for child in node.children() {
            let tag = child.attribute("tag").unwrap_or("").trim().to_owned();
            if named(&child, "controlfield") {
                record.control.push((tag, child.text().unwrap_or("").to_owned()));
            } else if named(&child, "datafield") {
                let subfields = child
                    .children()
                    .filter(|s| named(s, "subfield"))
                    .map(|s| {
                        let code = s.attribute("code").and_then(|c| c.chars().next()).unwrap_or(' ');
                        (code, text::clean(s.text().unwrap_or("")))
                    })
                    .collect();
                record.fields.push(Field {
                    tag,
                    ind1: indicator(&child, "ind1"),
                    ind2: indicator(&child, "ind2"),
                    subfields,
                });
            }
        }
        Some(record)
    }

    pub fn control(&self, tag: &str) -> Option<&str> {
        self.control.iter().find(|(t, _)| t == tag).map(|(_, v)| v.as_str())
    }

    pub fn fields<'a>(&'a self, tag: &'a str) -> impl Iterator<Item = &'a Field> {
        self.fields.iter().filter(move |f| f.tag == tag)
    }

    pub fn field(&self, tag: &str) -> Option<&Field> {
        self.fields.iter().find(|f| f.tag == tag)
    }

    fn value(&self, tag: &str, code: char) -> Option<&str> {
        self.fields.iter().filter(|f| f.tag == tag).find_map(|f| f.get(code))
    }

    /// Characters of a field that is read by position.
    fn positions(&self, tag: &str, from: usize, count: usize) -> Option<String> {
        let value = if tag == "leader" { Some(self.leader.as_str()) } else { self.control(tag) }?;
        let part: String = value.chars().skip(from).take(count).collect();
        (part.chars().count() == count).then_some(part)
    }
}

/// What the record is a record of.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum Kind {
    Book,
    /// An article or a chapter.
    Part,
    Serial,
    Sound,
    Other,
}

/// What ranking and telling apart need to know of a record.
#[derive(Debug, Clone)]
pub(crate) struct Facts {
    /// The number of the record in its catalogue.
    pub id: Option<String>,
    /// The number of the Library of Congress, if the record has it.
    pub lccn: Option<String>,
    /// The ISBNs of what is described, each as thirteen digits.
    pub isbns: Vec<String>,
    /// The ISBNs of the same in other forms, print or electronic.
    pub other_isbns: Vec<String>,
    /// Whether it is read on a screen.
    pub online: bool,
    pub kind: Kind,
}

#[derive(Debug, Clone)]
pub(crate) struct Described {
    pub draft: Draft,
    pub remarks: Vec<String>,
    pub facts: Facts,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
enum Role {
    Author,
    Editor,
    Translator,
    Commentator,
    Annotator,
    Introduction,
    Foreword,
    Afterword,
    /// A role that entries have no field for: illustrator, publisher, honoree.
    Other,
}

impl Role {
    fn field(self) -> Option<&'static str> {
        Some(match self {
            Role::Author => "author",
            Role::Editor => "editor",
            Role::Translator => "translator",
            Role::Commentator => "commentator",
            Role::Annotator => "annotator",
            Role::Introduction => "introduction",
            Role::Foreword => "foreword",
            Role::Afterword => "afterword",
            Role::Other => return None,
        })
    }
}

/// The role for a code of the list of relators. `None` for "other", which says nothing.
fn role_of_code(code: &str) -> Option<Role> {
    // Some catalogues give the code as an address: http://id.loc.gov/vocabulary/relators/aut
    let code = code.trim().trim_end_matches('/').rsplit('/').next().unwrap_or("").to_ascii_lowercase();
    Some(match code.as_str() {
        "aut" | "cre" | "aud" | "ive" | "ivr" => Role::Author,
        "edt" | "edc" | "com" | "red" | "pbd" | "edd" => Role::Editor,
        "trl" => Role::Translator,
        "cmm" | "cwt" | "wac" => Role::Commentator,
        "ann" => Role::Annotator,
        "aui" | "win" => Role::Introduction,
        "wpr" | "aup" => Role::Foreword,
        "aft" | "auf" => Role::Afterword,
        "oth" | "" => return None,
        _ => Role::Other,
    })
}

/// The role for a word, as catalogues write it in their own language.
fn role_of_term(term: &str) -> Option<Role> {
    let term = fold(term);
    const TERMS: &[(Role, &[&str])] = &[
        (
            Role::Author,
            &[
                "author",
                "joint author",
                "verfasser",
                "verfasserin",
                "verfasserin",
                "verf",
                "forfatter",
                "forf",
                "auteur",
                "autor",
                "aut",
                "creator",
            ],
        ),
        (
            Role::Editor,
            &[
                "editor",
                "ed",
                "eds",
                "edt",
                "editor of compilation",
                "compiler",
                "herausgeber",
                "herausgeberin",
                "herausgeberin",
                "hrsg",
                "hg",
                "mitherausgeber",
                "redaktor",
                "redaktør",
                "redaktor",
                "red",
                "utgiver",
                "utg",
                "editeur scientifique",
                "directeur de publication",
                "curatore",
                "bearbeiter",
                "bearb",
            ],
        ),
        (
            Role::Translator,
            &[
                "translator",
                "trl",
                "tr",
                "ubersetzer",
                "ubersetzerin",
                "ubers",
                "oversetter",
                "overs",
                "oversatter",
                "oversaetter",
                "traducteur",
                "trad",
                "traduttore",
            ],
        ),
        (Role::Commentator, &["commentator", "kommentator", "kommentatorin"]),
        (
            Role::Introduction,
            &[
                "author of introduction",
                "writer of introduction",
                "verfasser einer einleitung",
                "verfasserin einer einleitung",
            ],
        ),
        (
            Role::Foreword,
            &[
                "writer of preface",
                "writer of foreword",
                "verfasser eines vorworts",
                "verfasserin eines vorworts",
                "verfasser eines geleitwortes",
                "verfasserin eines geleitwortes",
            ],
        ),
        (
            Role::Afterword,
            &["author of afterword", "writer of afterword", "verfasser eines nachworts", "verfasserin eines nachworts"],
        ),
    ];
    if term.is_empty() || term == "other" || term == "sonstige" || term == "sonstige person familie und korperschaft" {
        return None;
    }
    // "VerfasserIn" folds to "verfasserin"; "Hrsg." to "hrsg".
    for (role, words) in TERMS {
        if words.contains(&term.as_str()) {
            return Some(*role);
        }
    }
    Some(Role::Other)
}

/// What a person did, as the field says it: in codes, or else in words.
/// Empty when the field does not say.
fn roles(field: &Field) -> Vec<Role> {
    let mut found: Vec<Role> = field.all('4').filter_map(role_of_code).collect();
    if found.is_empty() {
        found = field.all('e').filter_map(role_of_term).collect();
    }
    found.sort();
    found.dedup();
    // Whoever wrote or edited it may have done other things to it as well; those are not told.
    if found.len() > 1 {
        found.retain(|r| *r != Role::Other);
    }
    found
}

/// What a person did, as the statement of responsibility on the title page
/// says it (245 $c): "Jan Assmann ; trad. de l'allemand par Diane Meur".
/// Used for persons whose field gives no role, as in older records.
fn roles_by_statement(family: &str, statement: &str) -> Vec<Role> {
    const WORDS: &[(Role, &[&str])] = &[
        (
            Role::Editor,
            &[
                "ed",
                "eds",
                "edited",
                "editor",
                "editors",
                "hrsg",
                "hg",
                "herausgegeben",
                "herausgeber",
                "red",
                "redigert",
                "redaktør",
                "redaktor",
                "redaksjon",
                "redaktion",
                "utg",
                "utgitt",
                "dir",
                "direction",
                "cura",
                "compiled",
                "coord",
                "bearb",
                "bearbeitet",
            ],
        ),
        (
            Role::Translator,
            &[
                "translated",
                "translation",
                "transl",
                "trans",
                "ubersetzt",
                "ubers",
                "ubersetzung",
                "ubertragen",
                "oversatt",
                "oversat",
                "overs",
                "oversettelse",
                "oversattning",
                "traduit",
                "traduction",
                "trad",
                "traduzione",
                "tradotto",
                "traduccion",
                "ford",
                "yaku",
                "metaphrase",
            ],
        ),
        (Role::Commentator, &["commentary", "kommentar", "kommentiert", "commentaire", "commented"]),
        (Role::Introduction, &["introduction", "introd", "einleitung", "einl", "innledning", "inledning"]),
        (Role::Foreword, &["foreword", "preface", "vorwort", "geleitwort", "forord", "pref", "prol", "prolog"]),
        (Role::Afterword, &["afterword", "nachwort", "etterord", "postface"]),
        (
            Role::Other,
            &[
                "illustrated",
                "illustrations",
                "ill",
                "illustrationen",
                "illustrert",
                "photographs",
                "fotos",
                "fotografien",
            ],
        ),
    ];
    let family = fold(family);
    if family.is_empty() {
        return Vec::new();
    }
    for (i, segment) in statement.split(" ; ").enumerate() {
        let folded = fold(segment);
        if !format!(" {folded} ").contains(&format!(" {family} ")) {
            continue;
        }
        let words: Vec<&str> = folded.split(' ').collect();
        let mut found: Vec<Role> =
            WORDS.iter().filter(|(_, signs)| words.iter().any(|w| signs.contains(w))).map(|(role, _)| *role).collect();
        if found.len() > 1 {
            found.retain(|r| *r != Role::Other);
        }
        if found.is_empty() && i == 0 {
            // Named first and without a word about it: whoever wrote it.
            found.push(Role::Author);
        }
        return found;
    }
    Vec::new()
}

/// A person from a field for a personal name (100, 700).
fn person(field: &Field, remarks: &mut Vec<String>) -> Option<Person> {
    let name = without_isbd(field.get('a')?);
    if name.is_empty() {
        return None;
    }
    let suffix = field
        .get('c')
        .map(without_isbd)
        .filter(|c| matches!(c.trim_end_matches('.'), "Jr" | "Sr" | "jr" | "sr" | "II" | "III" | "IV"));
    match name.split_once(", ") {
        Some((family, given)) if field.ind1 != '3' => {
            let mut person = text::person(family, given, remarks);
            // "King, Martin Luther, Jr."
            if let Some((given, tail)) = person.given.clone().split_once(", ") {
                person.given = given.to_owned();
                person.suffix = tail.to_owned();
            }
            if let Some(suffix) = suffix {
                person.suffix = suffix;
            }
            Some(person)
        }
        _ => {
            // Known by one name, or by a name that is not turned about: Homer, Johannes Paul II.
            let name = match field.get('b').map(without_isbd) {
                Some(number) if !number.is_empty() => format!("{name} {number}"),
                _ => name,
            };
            if name.contains(' ') || field.ind1 == '3' {
                Some(Person::literal(name))
            } else {
                Some(Person { family: name, ..Default::default() })
            }
        }
    }
}

/// An institution from a field for a corporate name (110, 710).
fn institution(field: &Field) -> Option<Person> {
    let mut parts: Vec<String> = vec![without_isbd(field.get('a')?)];
    parts.extend(field.all('b').map(without_isbd));
    parts.retain(|p| !p.is_empty());
    (!parts.is_empty()).then(|| Person::literal(parts.join(". ")))
}

/// The language as babel names it, from the code in 008 or else in 041.
fn language(record: &Record) -> Option<&'static str> {
    let fixed = record.positions("008", 35, 3);
    let listed = record.fields("041").flat_map(|f| f.all('a')).map(|c| c.chars().take(3).collect::<String>());
    fixed.into_iter().chain(listed).find_map(|code| languages::babel(&code))
}

fn original_language(record: &Record) -> Option<&'static str> {
    record
        .fields("041")
        .flat_map(|f| f.all('h'))
        .find_map(|code| languages::babel(&code.chars().take(3).collect::<String>()))
}

/// A date as catalogues write it in the imprint: `1989.`, `[2017]`, `©2017`,
/// `c1989`, `[ca. 1850]`, `[199-?]`, `1979-1985`, `18 Sep 2019`.
pub(crate) fn date(raw: &str) -> Option<String> {
    let cleaned = text::clean(raw).replace(['[', ']'], "");
    let mut t = cleaned.trim().trim_end_matches(['.', ',']).trim();
    // "1989 [i.e. 1990]": the second is the right one. Lower case for ASCII
    // alone, here and below: positions in the one must hold in the other.
    let lower = t.to_ascii_lowercase();
    if let Some(at) = lower.find("i.e.") {
        t = t[at + 4..].trim();
    }
    if t.is_ascii()
        && t.len() >= 7
        && crate::bib::date::parse(t).is_some()
        && !t.contains('/')
        && t.matches('-').count() <= 2
    {
        let parts: Vec<&str> = t.split('-').collect();
        if parts[0].len() == 4 && parts[1..].iter().all(|p| p.len() == 2) {
            return Some(t.to_owned());
        }
    }
    let words: Vec<&str> = t.split(' ').collect();
    let year_of = |w: &str| w.parse::<i64>().ok().filter(|y| w.len() == 4 && (1000..=2200).contains(y));
    match words.as_slice() {
        [day, month, year] => {
            if let (Ok(d), Some(m), Some(y)) =
                (day.trim_end_matches('.').parse::<i64>(), text::month_number(month), year_of(year))
            {
                return text::date_from_parts(y, Some(m), Some(d));
            }
        }
        [month, year] => {
            if let (Some(m), Some(y)) = (text::month_number(month), year_of(year)) {
                return text::date_from_parts(y, Some(m), None);
            }
        }
        _ => {}
    }

    let lower = t.to_lowercase();
    let approximate =
        ["ca", "circa", "um ", "omkr", "env", "approximately", "c. "].iter().any(|w| lower.starts_with(w))
            && !lower.starts_with("cop");
    let uncertain = t.contains('?');

    // The first year, which may have its last digits left open: 19--, 199-, 19uu.
    let chars: Vec<char> = t.chars().collect();
    let open = |c: char| matches!(c, '-' | 'u' | 'x' | 'X' | '?');
    let year_at = |i: usize| -> Option<String> {
        let four = chars.get(i..i + 4)?;
        if i > 0 && chars[i - 1].is_ascii_digit() {
            return None;
        }
        let digits = four.iter().take_while(|c| c.is_ascii_digit()).count();
        if digits == 4 {
            return (!chars.get(i + 4).is_some_and(|c| c.is_ascii_digit())).then(|| four.iter().collect());
        }
        let rest_open =
            digits >= 2 && four[digits..].iter().all(|c| open(*c)) && four[digits..].iter().any(|c| *c != '?');
        let ends = chars.get(i + 4).is_none_or(|c| !c.is_alphanumeric());
        (rest_open && ends).then(|| four.iter().map(|c| if c.is_ascii_digit() { *c } else { 'X' }).collect())
    };
    let (at, first) = (0..chars.len()).find_map(|i| year_at(i).map(|y| (i, y)))?;
    if !first.starts_with(|c: char| c != '0') {
        return None;
    }
    let mut out = first.clone();
    if !first.contains('X') {
        // A range: 1979-1985, or 1979- for what is still coming out.
        let mut rest = chars[at + 4..].iter().copied().skip_while(|c| *c == ' ').peekable();
        if rest.peek().is_some_and(|c| matches!(c, '-' | '–' | '/')) {
            rest.next();
            let tail: Vec<char> = rest.skip_while(|c| *c == ' ').collect();
            let end: String = tail.iter().take(4).collect();
            if tail.is_empty() {
                out.push('/');
            } else if end.len() == 4
                && end.chars().all(|c| c.is_ascii_digit())
                && !tail.get(4).is_some_and(|c| c.is_ascii_digit())
                && end > first
            {
                out = format!("{first}/{end}");
            }
        }
    }
    if !out.contains('/') {
        match (approximate, uncertain) {
            (true, true) => out.push('%'),
            (true, false) => out.push('~'),
            (false, true) => out.push('?'),
            (false, false) => {}
        }
    }
    Some(out)
}

/// The year from the field of fixed length, where `u` stands for a digit not known.
fn date_fixed(record: &Record) -> Option<String> {
    let year = record.positions("008", 7, 4)?;
    let ok = year.chars().take(2).all(|c| c.is_ascii_digit())
        && year.chars().all(|c| c.is_ascii_digit() || c == 'u')
        && !year.starts_with('0')
        && year != "9999";
    ok.then(|| year.replace('u', "X"))
}

/// An edition statement: the number where it says no more than that, the
/// statement itself where it does, nothing for a first edition.
pub(crate) fn edition(raw: &str) -> Option<String> {
    let statement = without_isbd(&text::clean(raw).replace(['[', ']'], ""));
    if statement.is_empty() {
        return None;
    }
    const EDITION: &[&str] = &[
        "auflage", "aufl", "ed", "edition", "utg", "utgave", "utgava", "uppl", "upplaga", "udg", "udgave", "opl",
        "oplag", "druk", "edizione", "edicion", "ausg", "ausgabe", "painos", "izd", "izdanie",
    ];
    const ORDINALS: &[&[&str]] = &[
        &["first", "erste", "1st", "premiere", "forste"],
        &["second", "zweite", "2nd", "deuxieme", "seconde", "andre", "annen"],
        &["third", "dritte", "3rd", "troisieme", "tredje"],
        &["fourth", "vierte", "4th", "quatrieme", "fjerde"],
        &["fifth", "funfte", "5th", "cinquieme", "femte"],
        &["sixth", "sechste", "6th", "sixieme", "sjette"],
        &["seventh", "siebte", "7th", "septieme", "sjuende"],
        &["eighth", "achte", "8th", "huitieme", "attende"],
        &["ninth", "neunte", "9th", "neuvieme", "niende"],
        &["tenth", "zehnte", "10th", "dixieme", "tiende"],
    ];
    let folded = fold(&statement);
    let words: Vec<&str> = folded.split(' ').filter(|w| !w.is_empty()).collect();
    let number_of = |word: &str| -> Option<usize> {
        let digits: String = word.chars().take_while(char::is_ascii_digit).collect();
        if !digits.is_empty() {
            let suffix = &word[digits.len()..];
            return matches!(suffix, "" | "st" | "nd" | "rd" | "th" | "e" | "eme" | "ere" | "er" | "re" | "a")
                .then(|| digits.parse().ok())
                .flatten();
        }
        ORDINALS.iter().position(|names| names.contains(&word)).map(|i| i + 1)
    };
    let plain = match words.as_slice() {
        [number, word] if EDITION.contains(word) => number_of(number),
        // "7. Auflage 2013", as the sellers of e-books write it.
        [number, word, year] if EDITION.contains(word) && text::is_year(year) => number_of(number),
        _ => None,
    };
    match plain {
        Some(1) => None,
        Some(n) => Some(n.to_string()),
        None => Some(statement),
    }
}

/// The number of pages, or of volumes, from the extent as catalogues give
/// it: `xv, 383 p.`, `344 Seiten`, `1 Online-Ressource (344 Seiten)`, `3 v.`
fn extent(raw: &str) -> (Option<String>, Option<String>) {
    let mut t = without_isbd(raw);
    // What an electronic resource holds stands in brackets after it.
    if let (Some(open), Some(close)) = (t.find('('), t.rfind(')')) {
        let outer = fold(&t[..open]);
        if open < close
            && ["online", "ressource", "resource", "ressurs", "electronic", "elektron"]
                .iter()
                .any(|w| outer.contains(w))
        {
            t = t[open + 1..close].trim().to_owned();
        }
    }
    let Some((body, unit)) = t.rsplit_once(' ') else { return (None, None) };
    let unit = fold(unit);
    let body = body.trim().trim_end_matches(',').trim();
    let statement = |s: &str| {
        !s.is_empty()
            && s.chars().any(|c| c.is_ascii_digit())
            && s.chars().all(|c| {
                c.is_ascii_digit()
                    || matches!(c, 'i' | 'v' | 'x' | 'l' | 'c' | 'I' | 'V' | 'X' | 'L' | 'C' | ',' | ' ' | '[' | ']')
            })
    };
    if matches!(unit.as_str(), "seiten" | "s" | "p" | "pages" | "pp" | "sider" | "side" | "sidor" | "seite")
        && statement(body)
    {
        return (Some(body.to_owned()), None);
    }
    if matches!(unit.as_str(), "bande" | "bde" | "bd" | "v" | "vol" | "vols" | "volumes" | "bind" | "b")
        && body.chars().all(|c| c.is_ascii_digit())
        && !body.is_empty()
    {
        return (None, Some(body.to_owned()));
    }
    (None, None)
}

/// The number of a book in its series, without the word for "volume" that
/// some records put before it and the `.0` that some put after.
fn number_in_series(raw: &str) -> String {
    let t = without_isbd(raw);
    let lower = t.to_ascii_lowercase();
    let mut rest = t.as_str();
    for word in [
        "volume", "vol.", "vol", "v.", "band", "bd.", "bd", "nr.", "nr", "no.", "no", "n°", "tome", "t.", "heft", "h.",
        "#",
    ] {
        if lower.starts_with(word) {
            let after = t[word.len()..].trim_start();
            if after.starts_with(|c: char| c.is_ascii_digit()) {
                rest = after;
                break;
            }
        }
    }
    let rest = rest.strip_suffix(".0").filter(|r| r.chars().all(|c| c.is_ascii_digit())).unwrap_or(rest);
    rest.to_owned()
}

fn series(record: &Record) -> Option<(String, Option<String>)> {
    // The form under which the catalogue keeps the series comes before the
    // form in which the book names it.
    let (name, number) = if let Some(f) = record.field("830") {
        (f.get('a'), f.get('v'))
    } else if let Some(f) = record.fields("800").find(|f| f.get('t').is_some()) {
        (f.get('t'), f.get('v'))
    } else {
        let f = record.field("490")?;
        (f.get('a'), f.get('v'))
    };
    let name = without_isbd(name?);
    (!name.is_empty()).then(|| (name, number.map(number_in_series).filter(|n| !n.is_empty())))
}

/// A name of a place or a publisher, without what catalogues add to it.
/// `None` for the ways of saying that it is not known.
fn imprint_name(raw: &str) -> Option<String> {
    let mut t = without_isbd(raw);
    for others in ["[u.a.]", "[etc.]", "[et al.]", "[usw.]", "[m.fl.]", " u.a.", " etc.", " usw."] {
        if let Some(shorter) = t.strip_suffix(others) {
            t = without_isbd(shorter);
        }
    }
    let t = without_isbd(&t.replace(['[', ']'], ""));
    const UNKNOWN: &[&str] = &[
        "s l",
        "s n",
        "o o",
        "o v",
        "u st",
        "u a",
        "s l s n",
        "sine loco",
        "sine nomine",
        "ohne ort",
        "ohne verlag",
        "place of publication not identified",
        "publisher not identified",
        "erscheinungsort nicht ermittelbar",
        "verlag nicht ermittelbar",
        "lieu de publication non identifie",
        "editeur non identifie",
        "utgivelsessted ikke identifisert",
        "forlag ikke identifisert",
        "uten sted",
        "uten forlag",
    ];
    (!t.is_empty() && !UNKNOWN.contains(&fold(&t).as_str())).then_some(t)
}

/// Names as a list. A name that holds the word that separates the names of
/// a list is kept together by braces.
fn list(names: Vec<String>) -> String {
    names
        .into_iter()
        .map(|n| if n.to_lowercase().contains(" and ") { format!("{{{n}}}") } else { n })
        .collect::<Vec<_>>()
        .join(" and ")
}

struct Imprint {
    places: Vec<String>,
    publishers: Vec<String>,
    date: Option<String>,
}

fn imprint(record: &Record) -> Imprint {
    let published = record
        .fields("264")
        .find(|f| f.ind2 == '1')
        .or_else(|| record.field("260"))
        .or_else(|| record.fields("264").find(|f| matches!(f.ind2, '0' | '2' | '3' | ' ')));
    let names = |code: char| -> Vec<String> {
        let mut out: Vec<String> = Vec::new();
        for name in published.into_iter().flat_map(|f| f.all(code)).filter_map(imprint_name) {
            if !out.contains(&name) {
                out.push(name);
            }
        }
        out
    };
    let copyright = record.fields("264").find(|f| f.ind2 == '4').and_then(|f| f.get('c'));
    let date = published
        .and_then(|f| f.get('c'))
        .and_then(date)
        .or_else(|| copyright.and_then(date))
        .or_else(|| date_fixed(record));
    Imprint { places: names('a'), publishers: names('b'), date }
}

/// The ISBNs of a record as they are to be written, each once. The form
/// with hyphens is taken where the record has it.
fn isbns(record: &Record) -> Vec<(String, String)> {
    let mut out: Vec<(String, String, usize)> = Vec::new();
    for field in record.fields("020") {
        let Some(raw) = field.get('a') else { continue };
        let Some(number) = isbn::normalise(raw).into_iter().next() else { continue };
        // Without what follows the number: "(alk. paper)", ": kart.".
        let token = raw.split([' ', '(', ':']).next().unwrap_or("").to_owned();
        let digits = token.chars().filter(|c| c.is_ascii_digit() || matches!(c, 'X' | 'x')).count();
        let hyphened = field.get('9').filter(|h| isbn::normalise(h).first() == Some(&number)).map(str::to_owned);
        let written = hyphened.unwrap_or(token);
        match out.iter_mut().find(|(n, _, _)| *n == number) {
            // The same number in its older form of ten digits.
            Some(known) if known.2 < digits => *known = (number, written, digits),
            Some(_) => {}
            None => out.push((number, written, digits)),
        }
    }
    out.into_iter().map(|(number, written, _)| (number, written)).collect()
}

/// What an article or a chapter lies in (773).
struct Host {
    title: Option<String>,
    /// Whether it is a journal, as against a book.
    serial: bool,
    volume: Option<String>,
    number: Option<String>,
    pages: Option<String>,
    year: Option<String>,
    isbn: Option<String>,
    issn: Option<String>,
    author: Option<String>,
    imprint: Option<String>,
}

/// The number that follows one of the words, in a statement such as "185 (2018), 24, Seite 18-19".
fn after_word(statement: &str, words: &[&str]) -> Option<String> {
    let lower = statement.to_ascii_lowercase();
    for word in words {
        for (at, _) in lower.match_indices(word) {
            if at > 0 && lower[..at].ends_with(|c: char| c.is_alphanumeric()) {
                continue;
            }
            let rest = statement[at + word.len()..].trim_start();
            let value: String = rest
                .chars()
                .take_while(|c| {
                    c.is_alphanumeric()
                        || matches!(c, '-' | '–' | '[' | ']' | '/')
                        || (*c == ' ' && rest.contains(" - "))
                })
                .collect();
            let value = value.replace(['[', ']'], "");
            let value = value.trim().trim_end_matches(['-', '–']).trim();
            if value.starts_with(|c: char| c.is_ascii_digit() || matches!(c, 'x' | 'v' | 'i' | 'X' | 'V' | 'I')) {
                return Some(value.to_owned());
            }
        }
    }
    None
}

fn host(record: &Record) -> Option<Host> {
    let main = record.fields("773").find(|f| f.get('t').is_some() || f.get('a').is_some())?;
    let mut host = Host {
        title: main.get('t').map(|t| {
            // "Edda (trykt utg.)": the words in brackets tell editions of the journal apart in the catalogue.
            let t = without_isbd(t);
            match t.rfind(" (") {
                Some(at) if t.ends_with(')') && at > 0 => t[..at].to_owned(),
                _ => t,
            }
        }),
        serial: false,
        volume: None,
        number: None,
        pages: None,
        year: None,
        isbn: main.get('z').and_then(|z| isbn::normalise(z).into_iter().next().map(|_| z.to_owned())),
        issn: main.get('x').map(str::to_owned).filter(|x| super::csl::is_issn(x)),
        author: main.get('a').map(without_isbd),
        imprint: main.get('d').map(without_isbd),
    };
    let kind = main.get('7').and_then(|k| k.chars().nth(3));
    host.serial = match kind {
        Some('s') => true,
        Some('m') => false,
        _ => host.issn.is_some() || (host.isbn.is_none() && record.positions("leader", 7, 1).as_deref() == Some("b")),
    };

    // K10plus gives the place in the host a second time, in parts that are named.
    for field in record.fields("773") {
        for part in field.all('g') {
            let Some((name, value)) = part.split_once(':') else { continue };
            let value = value.trim().to_owned();
            if value.is_empty() || name.contains(' ') {
                continue;
            }
            match name {
                "volume" => host.volume = Some(value),
                "number" => host.number = Some(value),
                "pages" => host.pages = Some(text::pages(&value)),
                "year" => host.year = Some(value),
                _ => {}
            }
        }
    }
    if (host.pages.is_none() || host.volume.is_none())
        && let Some(statement) = main.get('g')
    {
        if host.pages.is_none() {
            host.pages =
                after_word(statement, &["seite", "seiten", "s.", "pages", "page", "pp.", "p.", "side", "sider"])
                    .map(|p| text::pages(&p));
        }
        if host.number.is_none() {
            host.number = after_word(statement, &["nr.", "no.", "heft", "h.", "issue"]);
        }
        let bracket = statement.find('(').and_then(|open| {
            let inner: String = statement[open + 1..].chars().take_while(|c| *c != ')').collect();
            (inner.len() == 4 && inner.chars().all(|c| c.is_ascii_digit())).then_some((open, inner))
        });
        if let Some((open, year)) = bracket {
            if host.year.is_none() {
                host.year = Some(year);
            }
            // "13(2018)": the volume stands before the year.
            let before = statement[..open].trim();
            if host.volume.is_none() && !before.is_empty() && before.chars().all(|c| c.is_ascii_digit()) {
                host.volume = Some(before.to_owned());
            }
        }
    }
    Some(host)
}

/// The title in the script it is written in, from the field that holds what
/// the record gives in Latin letters in its first form (880, linked by $6).
fn in_original_script(record: &Record) -> Option<String> {
    let field = record.fields("880").find(|f| f.get('6').is_some_and(|link| link.starts_with("245")))?;
    let mut title = without_isbd(field.get('a')?);
    if let Some(sub) = field.get('b') {
        let sub = without_isbd(sub);
        let sub = sub.split(" = ").next().unwrap_or("").trim();
        if !sub.is_empty() {
            title = format!("{title}: {}", text::without_isbd_spacing(sub));
        }
    }
    (!title.is_empty()).then_some(title)
}

fn capital_first(text: &str) -> String {
    let mut chars = text.chars();
    match chars.next() {
        Some(first) if first.is_lowercase() => first.to_uppercase().chain(chars).collect(),
        _ => text.to_owned(),
    }
}

fn put(draft: &mut Draft, name: &str, value: impl Into<String>) {
    let value = value.into();
    if !value.trim().is_empty() {
        draft.fields.insert(name.to_owned(), value);
    }
}

/// The titles of 245 into the draft.
fn titles(record: &Record, langid: Option<&str>, draft: &mut Draft, remarks: &mut Vec<String>) {
    let Some(field) = record.field("245") else { return };
    let english = matches!(langid, Some("english" | "british" | "american"));
    let raw = field.get('a').unwrap_or("");
    let mut parallel: Option<String> = None;
    let mut subtitle: Option<String> = None;

    let mut main = without_isbd(raw);
    let b_is_parallel = raw.trim_end().ends_with(" =");
    // Without subfields for it, the punctuation alone separates the parts.
    if let Some((before, after)) = main.clone().split_once(" = ") {
        main = without_isbd(before);
        parallel = Some(without_isbd(after));
    }
    if let Some((before, after)) = main.clone().split_once(" : ") {
        main = without_isbd(before);
        subtitle = Some(without_isbd(after));
    }
    if let Some(b) = field.get('b').map(without_isbd).filter(|b| !b.is_empty()) {
        if b_is_parallel {
            parallel = Some(b);
        } else {
            let (own, other) = match b.split_once(" = ") {
                Some((own, other)) => (without_isbd(own), Some(without_isbd(other))),
                None => (b, None),
            };
            if !own.is_empty() {
                subtitle = Some(own);
            }
            parallel = parallel.or(other);
        }
    }

    let tidy = |t: &str, remarks: &mut Vec<String>| text::title(&text::without_isbd_spacing(t), langid, remarks);
    let main = tidy(&main, remarks);
    let subtitle = subtitle.map(|s| tidy(&s, remarks)).map(|s| if english { capital_first(&s) } else { s });

    // A volume of a work in several volumes: its number, and its own title if it has one.
    let number = field.get('n').map(without_isbd).filter(|n| !n.is_empty());
    let part = field.get('p').map(without_isbd).filter(|p| !p.is_empty());
    match part {
        Some(part) => {
            put(draft, "maintitle", main);
            put(draft, "title", tidy(&part, remarks));
            let of_part = field.position('b') > field.position('p');
            if let Some(sub) = subtitle {
                put(draft, if of_part { "subtitle" } else { "mainsubtitle" }, sub);
            }
        }
        None => {
            put(draft, "title", main);
            if let Some(sub) = subtitle {
                put(draft, "subtitle", sub);
            }
        }
    }
    if let Some(number) = number {
        let digits: String =
            number.chars().skip_while(|c| !c.is_ascii_digit()).take_while(char::is_ascii_digit).collect();
        if digits.is_empty() {
            put(draft, "part", number);
        } else {
            put(draft, "volume", digits);
        }
    }
    if let Some(parallel) = parallel.filter(|p| !p.is_empty()) {
        remarks.push(tr!("core-lookup-parallel-title", title = text::without_isbd_spacing(&parallel)));
    }
    if let Some(original) = in_original_script(record) {
        remarks.push(tr!("core-lookup-original-script", title = original));
    }
}

/// Those who made the work, each into the field of what they did.
fn names(record: &Record, draft: &mut Draft, remarks: &mut Vec<String>) {
    let statement = record.value("245", 'c').unwrap_or("").to_owned();
    let add = |draft: &mut Draft, role: Role, person: &Person| {
        if let Some(field) = role.field() {
            let list = draft.names.entry(field.to_owned()).or_default();
            if !list.contains(person) {
                list.push(person.clone());
            }
        }
    };
    let mut unplaced: Vec<String> = Vec::new();

    for field in &record.fields {
        let personal = matches!(field.tag.as_str(), "100" | "700");
        let corporate = matches!(field.tag.as_str(), "110" | "710");
        if !(personal || corporate) {
            continue;
        }
        // With a title, the field names a work that this one has to do with, not a contributor.
        if field.tag.starts_with('7') && field.get('t').is_some() {
            continue;
        }
        let Some(who) = (if personal { person(field, remarks) } else { institution(field) }) else { continue };
        let mut found = roles(field);
        if found.is_empty() {
            if field.tag.starts_with('1') {
                found.push(Role::Author);
            } else if personal {
                found = roles_by_statement(&who.family, &statement);
                if found.is_empty() {
                    unplaced.push(who.display());
                }
            }
            // An institution named in addition and without a role has published or supported it.
        }
        for role in found {
            add(draft, role, &who);
        }
    }
    for name in unplaced {
        remarks.push(tr!("core-lookup-unplaced-name", name = &name));
    }
}

/// The record as a draft. `asked` is the ISBN that was looked up, as
/// thirteen digits: when the record has it among others, it is the one entered.
pub(crate) fn describe(record: &Record, asked: Option<&str>) -> Option<Described> {
    let mut draft = Draft::default();
    let mut remarks: Vec<String> = Vec::new();

    let langid = language(record);
    if let Some(l) = langid {
        put(&mut draft, "langid", l);
    }
    if let Some(l) = original_language(record).filter(|l| Some(*l) != langid) {
        put(&mut draft, "origlanguage", l);
    }
    titles(record, langid, &mut draft, &mut remarks);
    names(record, &mut draft, &mut remarks);
    if draft.get("title").is_none() && draft.names.is_empty() {
        return None;
    }

    let material = record.positions("leader", 6, 1).and_then(|c| c.chars().next()).unwrap_or('a');
    let level = record.positions("leader", 7, 1).and_then(|c| c.chars().next()).unwrap_or('m');
    let host = if matches!(level, 'a' | 'b') || (level != 'm' && level != 's') { host(record) } else { None };
    let carrier = record.fields("338").filter_map(|f| f.get('b')).any(|b| b == "cr");
    let online = carrier || record.control.iter().any(|(tag, value)| tag == "007" && value.starts_with("cr"));

    let own_isbns = isbns(record);
    let mut other_isbns: Vec<String> = Vec::new();
    for isbn in record.fields("776").flat_map(|f| f.all('z')).flat_map(isbn::normalise) {
        if !other_isbns.contains(&isbn) && !own_isbns.iter().any(|(n, _)| *n == isbn) {
            other_isbns.push(isbn);
        }
    }
    let imprint = imprint(record);

    let kind = match (material, level, &host) {
        (_, 'a' | 'b', _) | (_, _, Some(_)) => Kind::Part,
        ('i' | 'j', _, _) => Kind::Sound,
        ('a' | 't', 's', _) => Kind::Serial,
        ('a' | 't', _, _) => Kind::Book,
        _ => Kind::Other,
    };

    // The kind of entry.
    let thesis = record.field("502");
    let authors = draft.names.contains_key("author");
    let editors = draft.names.contains_key("editor");
    draft.entry_type = match kind {
        Kind::Part => match &host {
            Some(h) if h.serial => "article",
            Some(h) => {
                // A chapter in a book by the same author, or in a book of many hands.
                let first =
                    draft.names.get("author").and_then(|a| a.first()).map(|p| fold(&p.family)).unwrap_or_default();
                let same = !first.is_empty() && h.author.as_deref().is_some_and(|a| fold(a).starts_with(&first));
                if same { "inbook" } else { "incollection" }
            }
            None => "article",
        },
        Kind::Sound if material == 'j' => "music",
        Kind::Sound => "audio",
        Kind::Serial => "periodical",
        Kind::Other => match material {
            'g' => "video",
            'c' | 'd' => "music",
            'k' => "image",
            _ => "misc",
        },
        Kind::Book if thesis.is_some() && own_isbns.is_empty() => "thesis",
        Kind::Book if record.field("111").is_some() && !authors => "proceedings",
        Kind::Book if !authors && editors => "collection",
        Kind::Book => "book",
    }
    .to_owned();

    if let Some(field) = thesis {
        let degree = field.get('b').or_else(|| field.get('a')).unwrap_or("");
        let folded = fold(degree);
        let kind = if ["diss", "phd", "ph d", "doctor", "doktor", "dr "].iter().any(|w| folded.contains(w)) {
            Some("phdthesis".to_owned())
        } else if ["master", "magister", "lizentiat", "hovedoppgave", "hovudoppg"].iter().any(|w| folded.contains(w)) {
            Some("mathesis".to_owned())
        } else {
            field.get('b').map(without_isbd)
        };
        if draft.entry_type == "thesis" {
            if let Some(kind) = kind {
                put(&mut draft, "type", kind);
            }
            if let Some(institution) = field.get('c').and_then(imprint_name) {
                put(&mut draft, "institution", institution);
            }
        } else {
            let said: Vec<String> =
                ['a', 'b', 'c', 'd'].iter().filter_map(|c| field.get(*c)).map(without_isbd).collect();
            remarks.push(tr!("core-lookup-thesis", said = said.join(", ")));
        }
    }

    // Edition, imprint, extent, series.
    if let Some(e) = record.value("250", 'a').and_then(edition) {
        put(&mut draft, "edition", e);
    }
    if let Some(d) = imprint.date.clone() {
        put(&mut draft, "date", d);
    }
    if kind != Kind::Part {
        put(&mut draft, "location", list(imprint.places));
        let publisher = list(imprint.publishers);
        if draft.entry_type == "thesis" && draft.get("institution").is_none() {
            put(&mut draft, "institution", publisher);
        } else if draft.entry_type != "thesis" {
            put(&mut draft, "publisher", publisher);
        }
        if let Some(raw) = record.value("300", 'a') {
            let (pages, volumes) = extent(raw);
            if let Some(pages) = pages {
                put(&mut draft, "pagetotal", pages);
            }
            if let Some(volumes) = volumes {
                put(&mut draft, "volumes", volumes);
            }
        }
        if let Some((name, number)) = series(record) {
            put(&mut draft, "series", text::title(&name, langid, &mut remarks));
            if let Some(number) = number {
                put(&mut draft, "number", number);
            }
        }
    }

    // What an article or chapter lies in.
    if let Some(h) = &host {
        if let Some(title) = &h.title {
            let title = text::title(title, langid, &mut remarks);
            put(&mut draft, if h.serial { "journaltitle" } else { "booktitle" }, title);
        }
        for (name, value) in [("volume", &h.volume), ("number", &h.number), ("pages", &h.pages)] {
            if let Some(v) = value {
                put(&mut draft, name, v.clone());
            }
        }
        if h.pages.is_none() {
            // The pages may stand as the extent of the part: "S. 187-190".
            let own = record.value("300", 'a').map(without_isbd).unwrap_or_default();
            let own = own
                .trim_start_matches("S.")
                .trim_start_matches("s.")
                .trim_start_matches("p.")
                .trim()
                .replace(['[', ']'], "");
            if own.starts_with(|c: char| c.is_ascii_digit())
                && own.chars().all(|c| c.is_ascii_digit() || matches!(c, '-' | '–' | ' '))
            {
                put(&mut draft, "pages", text::pages(&own));
            }
        }
        if draft.get("date").is_none_or(|d| d.len() == 4)
            && let Some(year) = h.year.as_deref().filter(|y| draft.get("date").is_none() && text::is_year(y))
        {
            put(&mut draft, "date", year);
        }
        if h.serial {
            if let Some(issn) = &h.issn {
                put(&mut draft, "issn", issn.clone());
            }
        } else {
            if let Some(isbn) = &h.isbn {
                put(&mut draft, "isbn", isbn.clone());
            }
            if draft.entry_type == "inbook"
                && let Some(authors) = draft.names.get("author").cloned()
            {
                draft.names.insert("bookauthor".to_owned(), authors);
            }
            // "München : C.H. Beck, 2018"
            if let Some(imprint) = &h.imprint
                && let Some((place, rest)) = imprint.split_once(" : ")
            {
                if let Some(place) = imprint_name(place) {
                    put(&mut draft, "location", place);
                }
                let publisher = rest.rsplit_once(", ").map_or(rest, |(p, _)| p);
                if let Some(publisher) = imprint_name(publisher) {
                    put(&mut draft, "publisher", publisher);
                }
            }
        }
    }

    // Identifiers.
    if kind != Kind::Part && !own_isbns.is_empty() {
        let chosen: Vec<String> = match asked.and_then(|a| own_isbns.iter().find(|(n, _)| n == a)) {
            Some((_, written)) => vec![written.clone()],
            None => own_isbns.iter().map(|(_, written)| written.clone()).collect(),
        };
        put(&mut draft, "isbn", chosen.join(", "));
    }
    if kind == Kind::Serial
        && let Some(issn) = record.value("022", 'a').filter(|i| super::csl::is_issn(i))
    {
        put(&mut draft, "issn", issn);
    }
    let doi = record
        .fields("024")
        .filter(|f| f.ind1 == '7' && f.get('2').is_some_and(|s| s.eq_ignore_ascii_case("doi")))
        .find_map(|f| f.get('a').and_then(doi::normalise));
    if let Some(doi) = &doi {
        put(&mut draft, "doi", doi.clone());
    }
    if online {
        // The address of the thing itself, where it is open to all. Addresses
        // that need a licence lead to the library's own door.
        let address = record
            .fields("856")
            .filter(|f| f.ind1 == '4' && matches!(f.ind2, '0' | ' '))
            .filter(|f| f.get('7') != Some("1") && !f.all('z').any(|z| fold(z).contains("lizenzpflichtig")))
            .filter_map(|f| f.get('u'))
            .find(|u| u.starts_with("http") && !u.contains([' ', '"']) && !(doi.is_some() && u.contains("doi.org/")));
        if let Some(address) = address {
            put(&mut draft, "url", address);
        }
    }

    // What the user should know of the kind of record.
    match kind {
        Kind::Book if online => remarks.push(tr!("core-lookup-ebook")),
        Kind::Sound if own_isbns.is_empty() => remarks.push(tr!("core-lookup-sound")),
        Kind::Sound => remarks.push(tr!("core-lookup-audio-book")),
        Kind::Other => remarks.push(tr!("core-lookup-not-text")),
        _ => {}
    }

    let id = record.control("001").map(|i| i.trim().to_owned()).filter(|i| !i.is_empty());
    let lccn = record.value("010", 'a').map(|l| l.trim().to_owned()).filter(|l| !l.is_empty() && !l.contains(' '));
    let facts = Facts { id, lccn, isbns: own_isbns.into_iter().map(|(n, _)| n).collect(), other_isbns, online, kind };
    Some(Described { draft, remarks, facts })
}

#[cfg(test)]
mod tests {
    use super::super::samples;
    use super::super::sru::records;
    use super::*;

    fn described(xml: &str, asked: Option<&str>) -> Vec<Described> {
        records(xml).unwrap().iter().filter_map(|r| describe(r, asked)).collect()
    }

    fn fields(d: &Described) -> Vec<(&str, &str)> {
        d.draft.fields.iter().map(|(k, v)| (k.as_str(), v.as_str())).collect()
    }

    #[test]
    fn a_record_with_the_punctuation_of_the_catalogue() {
        // Library of Congress: "Ancient literacy /", "Cambridge, Mass. :", "Harvard University Press,", "1989."
        let all = described(samples::LOC_HARRIS, Some("9780674033801"));
        assert_eq!(all.len(), 1);
        let d = &all[0];
        assert_eq!(d.draft.entry_type, "book");
        assert_eq!(d.draft.key, "");
        assert_eq!(
            fields(d),
            vec![
                ("date", "1989"),
                ("isbn", "9780674033801"),
                ("langid", "english"),
                ("location", "Cambridge, Mass."),
                ("pagetotal", "xv, 383"),
                ("publisher", "Harvard University Press"),
                ("title", "Ancient literacy"),
            ]
        );
        // The fuller form of the name, "(William Vernon)", is not part of it.
        assert_eq!(d.draft.names["author"], vec![Person::new("Harris", "William V.")]);
        assert_eq!(d.draft.names.len(), 1);
        assert!(d.remarks.is_empty(), "{:?}", d.remarks);
        assert_eq!(d.facts.lccn.as_deref(), Some("89007588"));
        assert_eq!(d.facts.isbns, vec!["9780674033801"]);
        assert!(!d.facts.online);
    }

    #[test]
    fn decomposed_letters_and_marked_articles() {
        assert!(samples::DNB_ASSMANN.contains("Geda\u{308}chtnis"), "the sample is to be as it was sent");
        assert!(samples::DNB_ASSMANN.contains("&#152;Das&#156;"));
        let all = described(samples::DNB_ASSMANN, Some("9783406568442"));
        assert_eq!(all.len(), 2);
        let d = &all[0];
        assert_eq!(
            fields(d),
            vec![
                ("date", "2013"),
                ("edition", "7"),
                ("isbn", "978-3-406-56844-2"),
                ("langid", "german"),
                ("location", "München"),
                ("number", "1307"),
                ("pagetotal", "344"),
                ("publisher", "Beck"),
                ("series", "Beck'sche Reihe"),
                ("subtitle", "Schrift, Erinnerung und politische Identität in frühen Hochkulturen"),
                ("title", "Das kulturelle Gedächtnis"),
            ]
        );
        assert_eq!(d.draft.get("title").unwrap().chars().count(), 25);
        assert_eq!(d.draft.names["author"], vec![Person::new("Assmann", "Jan")]);
        assert_eq!(d.facts.id.as_deref(), Some("1030500924"));
        // The cancelled ISBN of the second record (020 $z) is not taken.
        assert_eq!(all[1].draft.get("isbn"), Some("978-3-406-56844-2"));
        assert_eq!(all[1].facts.isbns, vec!["9783406568442"]);
        assert_eq!((all[1].draft.get("edition"), all[1].draft.get("date")), (Some("6"), Some("2007")));
    }

    #[test]
    fn title_and_subtitle_parted_by_punctuation() {
        let all = described(samples::ALMA_REM, Some("9788202413736"));
        assert_eq!(all.len(), 1);
        let d = &all[0];
        assert_eq!(d.draft.entry_type, "book");
        assert_eq!(
            fields(d),
            vec![
                ("date", "2014"),
                ("isbn", "978-82-02-41373-6"),
                ("langid", "norsk"),
                ("location", "Oslo"),
                ("pagetotal", "395"),
                ("publisher", "Cappelen Damm"),
                ("subtitle", "reisen til Hitler"),
                ("title", "Knut Hamsun"),
            ]
        );
        assert_eq!(d.draft.names["author"], vec![Person::new("Rem", "Tore")]);
        // Nine addresses in the record, of covers and blurbs, and one of a scan: none is the book.
        assert!(d.draft.get("url").is_none());
        assert!(d.remarks.is_empty(), "{:?}", d.remarks);
        assert_eq!(d.facts.lccn.as_deref(), Some("2015425036"));
    }

    #[test]
    fn editions_and_e_books_under_one_isbn() {
        let all = described(samples::K10_ASSMANN, Some("9783406568442"));
        assert_eq!(all.len(), 5);
        let online: Vec<bool> = all.iter().map(|d| d.facts.online).collect();
        assert_eq!(online, vec![true, true, true, false, false]);
        assert!(
            all[..3]
                .iter()
                .all(|d| d.facts.isbns == vec!["9783406703409"] && d.facts.other_isbns == vec!["9783406568442"])
        );
        assert!(all[3..].iter().all(|d| d.facts.isbns.contains(&"9783406568442".to_owned())));

        // The printed seventh edition.
        let d = &all[3];
        assert_eq!(
            fields(d),
            vec![
                ("date", "2013"),
                ("edition", "7"),
                ("isbn", "978-3-406-56844-2"),
                ("langid", "german"),
                ("location", "München"),
                ("number", "1307"),
                ("pagetotal", "344"),
                ("publisher", "Verlag H.C.Beck"),
                ("series", "Beck'sche Reihe"),
                ("subtitle", "Schrift, Erinnerung und politische Identität in frühen Hochkulturen"),
                ("title", "Das kulturelle Gedächtnis"),
            ]
        );
        assert!(d.remarks.is_empty());
        // The sixth: two ISBNs in the record, of which the one asked for is entered.
        assert_eq!(all[4].facts.isbns, vec!["9783406568466", "9783406568442"]);
        assert_eq!(all[4].draft.get("isbn"), Some("978-3-406-56844-2"));
        assert_eq!((all[4].draft.get("edition"), all[4].draft.get("publisher")), (Some("6"), Some("Beck")));

        // E-books: the date in brackets, the copyright date, the record of a seller.
        assert_eq!(all[0].draft.get("date"), Some("2017"));
        assert_eq!(all[0].draft.get("pagetotal"), Some("344"));
        assert_eq!(all[0].draft.get("isbn"), Some("978-3-406-70340-9"));
        assert_eq!(all[1].draft.get("doi"), Some("10.17104/9783406703409"));
        assert!(all[1].draft.get("url").is_none(), "the addresses need a licence");
        assert_eq!(all[2].draft.get("edition"), Some("7"), "7. Auflage 2013");
        assert_eq!(all[2].draft.get("number"), Some("1307"), "v.1307");
        assert!(all[..3].iter().all(|d| d.remarks.iter().any(|r| r.starts_with("An e-book record"))));
    }

    #[test]
    fn an_author_named_as_other() {
        let all = described(samples::K10_HARRIS, Some("9780674033818"));
        assert_eq!(all.len(), 4);
        for d in &all {
            assert_eq!(d.draft.names["author"], vec![Person::new("Harris", "William V.")], "{:?}", d.draft.get("date"));
            assert_eq!(d.draft.names.len(), 1);
            assert_eq!(d.draft.get("langid"), Some("english"));
        }
        let printed = &all[2];
        assert!(!printed.facts.online);
        assert_eq!(printed.draft.get("title"), Some("Ancient literacy"));
        assert_eq!(printed.draft.get("location"), Some("Cambridge, Mass."));
        assert_eq!(printed.draft.get("publisher"), Some("Harvard Univ. Press"));
        assert_eq!(printed.draft.get("pagetotal"), Some("XV, 383"));
        assert_eq!(printed.draft.get("isbn"), Some("978-0-674-03381-8"));
        assert_eq!(printed.draft.get("edition"), Some("1. Harvard Univ. Press paperback ed."));
        assert_eq!(printed.draft.get("date"), Some("1991"));
        // An e-book that names the ISBN of the printed book as its own.
        assert!(all[0].facts.online && all[0].facts.isbns == vec!["9780674033818"]);
        assert_eq!(all[0].draft.get("pagetotal"), Some("406"));
        assert_eq!(all[3].draft.get("pagetotal"), Some("xv, 383"));
    }

    #[test]
    fn books_found_by_words() {
        let all = described(samples::K10_NAGY, None);
        assert_eq!(all.len(), 5);
        let d = &all[0];
        assert_eq!(d.draft.get("title"), Some("The best of the Achaeans"));
        // In English the subtitle begins with a capital.
        assert_eq!(d.draft.get("subtitle"), Some("Concepts of the hero in Archaic Greek poetry"));
        assert_eq!(d.draft.get("edition"), Some("Rev. ed."));
        assert_eq!(d.draft.get("location"), Some("Baltimore"));
        assert_eq!(d.draft.get("publisher"), Some("Johns Hopkins University Press"));
        assert_eq!(d.draft.get("series"), Some("A Johns Hopkins University paperback"));
        assert_eq!(d.draft.get("isbn"), Some("0-8018-6015-6"));
        assert_eq!(d.draft.get("pagetotal"), Some("XVIII, 400"));
        assert_eq!(d.draft.names["author"], vec![Person::new("Nagy", "Gregory")]);

        let by_year = |y: &str| all.iter().filter(|d| d.draft.get("date") == Some(y)).collect::<Vec<_>>();
        let third = by_year("1991")[0];
        assert_eq!(third.draft.get("isbn"), Some("0-8018-2200-9, 0-8018-2388-9"));
        assert_eq!(third.draft.get("location"), Some("Baltimore, Md."));
        assert_eq!(third.draft.get("edition"), Some("3. pr."));
        let two_places = all.iter().find(|d| d.draft.get("location") == Some("Baltimore and London")).unwrap();
        assert_eq!(two_places.draft.get("edition"), Some("Paperbacks ed."));
        assert!(two_places.draft.get("langid").is_none(), "the language is given as undetermined");
        assert!(two_places.draft.get("isbn").is_none());
    }

    #[test]
    fn a_translation_an_interview_and_chapters() {
        let all = described(samples::K10_MIXED, None);
        assert_eq!(all.len(), 4);

        let japanese = &all[0];
        assert_eq!(japanese.draft.entry_type, "book");
        assert_eq!(japanese.draft.get("title"), Some("Bunkateki kioku"));
        assert_eq!(
            japanese.draft.get("subtitle"),
            Some("kodai chichūkai shobunka ni okeru shoji, sōki, seijiteki aidentiti")
        );
        assert_eq!(japanese.draft.get("langid"), Some("japanese"));
        assert_eq!(japanese.draft.get("origlanguage"), Some("german"));
        assert_eq!(japanese.draft.get("date"), Some("2024"), "2024nen 7gatsu 5ka");
        assert_eq!(japanese.draft.get("location"), Some("Tōkyōto"));
        assert_eq!(japanese.draft.names["author"], vec![Person::new("Assmann", "Jan")]);
        assert_eq!(japanese.draft.names["translator"], vec![Person::new("Yasukawa", "Haruki")]);
        assert_eq!(japanese.draft.get("edition"), Some("Shohan dai 1satsu hakkō"));
        assert!(japanese.remarks.iter().any(|r| r.contains(
            "“Das kulturelle Gedächtnis: Schrift, Erinnerung und politische Identität in frühen Hochkulturen”"
        )));

        let chapter = &all[1];
        assert_eq!(chapter.facts.kind, Kind::Part);
        assert_eq!(chapter.draft.entry_type, "incollection");
        assert_eq!(chapter.draft.get("title"), Some("Nietzsche und das kulturelle Gedächtnis"));
        assert_eq!(
            chapter.draft.get("subtitle"),
            Some("eine kritische Relektüre der \"Zweiten Unzeitgemässen Betrachtung\"")
        );
        assert_eq!(chapter.draft.get("booktitle"), Some("Nietzsche on memory and history"));
        assert_eq!(chapter.draft.get("pages"), Some("79–93"));
        assert_eq!(chapter.draft.get("date"), Some("2021"));
        assert_eq!(chapter.draft.get("isbn"), Some("9783110671070"));
        assert_eq!(
            (chapter.draft.get("location"), chapter.draft.get("publisher")),
            (Some("Berlin"), Some("De Gruyter"))
        );
        assert_eq!(chapter.draft.names["author"], vec![Person::new("Assmann", "Aleida")]);

        let interview = &all[2];
        assert_eq!(interview.draft.entry_type, "article");
        assert_eq!(interview.draft.get("journaltitle"), Some("Börsenblatt"));
        assert_eq!(
            (interview.draft.get("volume"), interview.draft.get("number"), interview.draft.get("pages")),
            (Some("185"), Some("24"), Some("18–19"))
        );
        assert_eq!(interview.draft.get("issn"), Some("1611-4280"));
        assert!(interview.draft.get("publisher").is_none());
        assert!(
            interview
                .draft
                .get("subtitle")
                .unwrap()
                .starts_with("Aleida und Jan Assmann bekommen den Friedenspreis 2018: ein Gespräch")
        );
        assert_eq!(interview.draft.names["author"].len(), 3);

        let own = &all[3];
        assert_eq!(own.draft.entry_type, "inbook");
        assert_eq!(own.draft.get("title"), Some("Einführung"));
        assert_eq!(own.draft.get("subtitle"), Some("Was ist das „kulturelle Gedächtnis\"?"));
        assert_eq!(own.draft.get("booktitle"), Some("Religion und kulturelles Gedächtnis"));
        assert_eq!(own.draft.get("pages"), Some("11–44"));
        assert_eq!(own.draft.names["bookauthor"], vec![Person::new("Assmann", "Jan")]);
        assert_eq!((own.draft.get("location"), own.draft.get("publisher")), (Some("München"), Some("C.H. Beck")));
    }

    #[test]
    fn translators_audio_books_and_works_named_in_passing() {
        let all = described(samples::ALMA_SEARCH, None);
        assert_eq!(all.len(), 7);
        let russian = &all[0];
        assert_eq!(russian.draft.get("title"), Some("Knut Gamsun"));
        assert_eq!(russian.draft.get("subtitle"), Some("vizit k Gitleru"));
        assert_eq!((russian.draft.get("langid"), russian.draft.get("origlanguage")), (Some("russian"), Some("norsk")));
        assert_eq!(
            russian.draft.names["translator"],
            vec![Person::new("Pankratova", "Ėleonora"), Person::new("Sel'nicin", "Aleksej Aleksandrovič")]
        );
        assert_eq!(all[2].draft.get("location"), Some("Stockholm"));
        assert_eq!(all[2].draft.get("isbn"), Some("978-917353-823-7"));

        let audio = all.iter().find(|d| d.facts.kind == Kind::Sound).unwrap();
        assert_eq!(audio.draft.entry_type, "audio");
        assert_eq!(audio.remarks, vec!["A record of an audio book."]);
        // Author and narrator in one; and a field that names the work, not a person who took part.
        assert_eq!(audio.draft.names["author"], vec![Person::new("Rem", "Tore")]);
        assert_eq!(audio.draft.names.len(), 1);

        // Subfields in another order than usual.
        let danish = all.iter().find(|d| d.draft.get("langid") == Some("danish")).unwrap();
        assert_eq!(
            (danish.draft.get("location"), danish.draft.get("publisher")),
            (Some("Vordingborg"), Some("Vild Maskine"))
        );
    }

    #[test]
    fn dates_of_imprints() {
        for (raw, expected) in [
            ("1989.", Some("1989")),
            ("2013", Some("2013")),
            ("[2017]", Some("2017")),
            ("©2017", Some("2017")),
            ("c1989", Some("1989")),
            ("cop. 2014", Some("2014")),
            ("2014, cop. 2013", Some("2014")),
            ("[2017?]", Some("2017?")),
            ("[ca. 1850]", Some("1850~")),
            ("ca. 1850?", Some("1850%")),
            ("1979-1985", Some("1979/1985")),
            ("1979–1985.", Some("1979/1985")),
            ("1979-", Some("1979/")),
            ("[19--]", Some("19XX")),
            ("[199-?]", Some("199X?")),
            ("19uu", Some("19XX")),
            ("1989 [i.e. 1990]", Some("1990")),
            ("MDCCLX [1760]", Some("1760")),
            ("2018-12-13", Some("2018-12-13")),
            ("18 Sep 2019", Some("2019-09-18")),
            ("27 Jun. 2018", Some("2018-06-27")),
            ("08 Mrz. 2017", Some("2017-03-08")),
            ("mars 1994", Some("1994-03")),
            ("2024nen 7gatsu 5ka", Some("2024")),
            ("[s.a.]", None),
            ("n.d.", None),
            ("", None),
            ("12-14", None),
            ("19790", None),
        ] {
            assert_eq!(date(raw).as_deref(), expected, "{raw}");
            if let Some(d) = date(raw) {
                assert!(crate::bib::date::parse(&d).is_some(), "{raw} gives {d}, which is not a date");
            }
        }
    }

    #[test]
    fn edition_statements() {
        for (raw, expected) in [
            ("7. Auflage", Some("7")),
            ("6. Aufl.", Some("6")),
            ("7. Auflage 2013", Some("7")),
            ("2nd ed.", Some("2")),
            ("[2nd ed.]", Some("2")),
            ("Second edition", Some("2")),
            ("3e éd.", Some("3")),
            ("2. utg.", Some("2")),
            ("Dritte Auflage", Some("3")),
            ("1. Auflage", None),
            ("1. utgave", None),
            ("First edition", None),
            ("1st ed.", None),
            ("Rev. ed.", Some("Rev. ed.")),
            ("2., überarb. Aufl.", Some("2., überarb. Aufl.")),
            ("1st Harvard University Press pbk. ed.", Some("1st Harvard University Press pbk. ed.")),
            ("9. Auflage in C.H. Paperback", Some("9. Auflage in C.H. Paperback")),
            ("3. pr.", Some("3. pr.")),
            ("", None),
        ] {
            assert_eq!(edition(raw).as_deref(), expected, "{raw}");
        }
    }

    #[test]
    fn extents_and_numbers_in_series() {
        assert_eq!(extent("xv, 383 p. ;"), (Some("xv, 383".into()), None));
        assert_eq!(extent("344 Seiten"), (Some("344".into()), None));
        assert_eq!(extent("344 S."), (Some("344".into()), None));
        assert_eq!(extent("395 s."), (Some("395".into()), None));
        assert_eq!(extent("XVI, 392 S"), (Some("XVI, 392".into()), None));
        assert_eq!(extent("1 Online-Ressource (344 Seiten)"), (Some("344".into()), None));
        assert_eq!(extent("Online-Ressource (406 p)"), (Some("406".into()), None));
        assert_eq!(extent("3 v."), (None, Some("3".into())));
        assert_eq!(extent("2 Bände"), (None, Some("2".into())));
        assert_eq!(extent("513 min"), (None, None));
        assert_eq!(extent("Online Ressource"), (None, None));
        assert_eq!(extent("1 online (nettilkoblet) ressurs"), (None, None));
        assert_eq!(extent(""), (None, None));

        assert_eq!(number_in_series("1307"), "1307");
        assert_eq!(number_in_series("v.1307"), "1307");
        assert_eq!(number_in_series("v.23.0"), "23");
        assert_eq!(number_in_series("Bd. 12"), "12");
        assert_eq!(number_in_series("vol. 3 ;"), "3");
        assert_eq!(number_in_series("N.F., 12"), "N.F., 12");
        assert_eq!(number_in_series("Heft 4"), "4");
        assert_eq!(number_in_series("Neue Folge"), "Neue Folge");
    }

    #[test]
    fn places_and_publishers() {
        assert_eq!(imprint_name("[Oslo]").as_deref(), Some("Oslo"));
        assert_eq!(imprint_name("Cambridge, Mass. [u.a.]").as_deref(), Some("Cambridge, Mass."));
        assert_eq!(imprint_name("Baltimore [u.a.]").as_deref(), Some("Baltimore"));
        assert_eq!(imprint_name("New York [etc.] :").as_deref(), Some("New York"));
        assert_eq!(imprint_name("Harvard University Press,").as_deref(), Some("Harvard University Press"));
        for unknown in [
            "[S.l.]",
            "s.l.",
            "[s.n.]",
            "[o.O.]",
            "[Erscheinungsort nicht ermittelbar]",
            "[publisher not identified]",
            "[S.l. : s.n.]",
            "",
        ] {
            assert_eq!(imprint_name(unknown), None, "{unknown}");
        }
        assert_eq!(list(vec!["Baltimore".into(), "London".into()]), "Baltimore and London");
        assert_eq!(list(vec!["Thames and Hudson".into()]), "{Thames and Hudson}");
    }

    fn record(xml: &str) -> Record {
        let wrapped = format!("<record><leader>00000nam a2200000 c 4500</leader>{xml}</record>");
        let document = roxmltree::Document::parse(&wrapped).unwrap();
        Record::read(document.root_element()).unwrap()
    }

    fn field(tag: &str, indicators: &str, subfields: &[(char, &str)]) -> String {
        let mut i = indicators.chars();
        let inner: String = subfields.iter().map(|(c, v)| format!("<subfield code=\"{c}\">{v}</subfield>")).collect();
        format!(
            "<datafield tag=\"{tag}\" ind1=\"{}\" ind2=\"{}\">{inner}</datafield>",
            i.next().unwrap_or(' '),
            i.next().unwrap_or(' ')
        )
    }

    #[test]
    fn what_a_person_did() {
        // Codes before words; words in the language of the catalogue.
        let xml = [
            field(
                "245",
                "00",
                &[
                    ('a', "Homeric contexts /"),
                    ('c', "edited by Franco Montanari ; translated by A. Rengakos ; with drawings by C. Tsagalis."),
                ],
            ),
            field("700", "1 ", &[('a', "Montanari, Franco,"), ('e', "editor.")]),
            field("700", "1 ", &[('a', "Rengakos, Antonios"), ('e', "ÜbersetzerIn"), ('4', "trl")]),
            field("700", "1 ", &[('a', "Tsagalis, Christos,"), ('4', "ill")]),
            field("700", "1 ", &[('a', "Nagy, Gregory"), ('e', "Hrsg.")]),
            field("700", "1 ", &[('a', "West, M. L."), ('4', "edt"), ('4', "trl")]),
            field("710", "2 ", &[('a', "De Gruyter"), ('4', "pbl")]),
        ]
        .concat();
        let d = describe(&record(&xml), None).unwrap();
        assert_eq!(d.draft.entry_type, "collection");
        assert_eq!(
            d.draft.names["editor"],
            vec![Person::new("Montanari", "Franco"), Person::new("Nagy", "Gregory"), Person::new("West", "M. L.")]
        );
        assert_eq!(
            d.draft.names["translator"],
            vec![Person::new("Rengakos", "Antonios"), Person::new("West", "M. L.")]
        );
        assert_eq!(d.draft.names.len(), 2);
        assert_eq!(d.draft.get("title"), Some("Homeric contexts"));
        assert!(d.remarks.is_empty(), "{:?}", d.remarks);
    }

    #[test]
    fn persons_without_a_role_are_placed_by_the_title_page() {
        let xml = [
            field("100", "1 ", &[('a', "Smith, John.")]),
            field(
                "245",
                "10",
                &[
                    ('a', "A history of Greece /"),
                    ('c', "John Smith and Peter Jones ; translated from the German by Ann Lee ; Mary Roe."),
                ],
            ),
            field("700", "1 ", &[('a', "Jones, Peter,"), ('d', "1950-")]),
            field("700", "1 ", &[('a', "Lee, Ann.")]),
            field("700", "1 ", &[('a', "Roe, Mary.")]),
            field("700", "1 ", &[('a', "Doe, Jane.")]),
            field("700", "12", &[('a', "Homer."), ('t', "Iliad.")]),
        ]
        .concat();
        let d = describe(&record(&xml), None).unwrap();
        assert_eq!(d.draft.entry_type, "book");
        assert_eq!(d.draft.names["author"], vec![Person::new("Smith", "John"), Person::new("Jones", "Peter")]);
        assert_eq!(d.draft.names["translator"], vec![Person::new("Lee", "Ann")]);
        assert_eq!(d.draft.names.len(), 2);
        assert_eq!(
            d.remarks,
            vec![
                "The record names Mary Roe without saying as what. The name has not been entered.",
                "The record names Jane Doe without saying as what. The name has not been entered.",
            ]
        );
    }

    #[test]
    fn names_of_all_kinds() {
        let xml = [
            field("100", "0 ", &[('a', "Homer")]),
            field("245", "10", &[('a', "ILIAS UND ODYSSEE :"), ('b', "DIE GESÄNGE DER GRIECHEN /")]),
            field("700", "0 ", &[('a', "Johannes Paul"), ('b', "II.,"), ('c', "Papst"), ('4', "aut")]),
            field("700", "1 ", &[('a', "King, Martin Luther, Jr."), ('4', "aut")]),
            field("700", "1 ", &[('a', "Beethoven, Ludwig van"), ('4', "aut")]),
            field("700", "1 ", &[('a', "HARRIS, William V."), ('4', "aut")]),
            field("710", "2 ", &[('a', "Universitetet i Oslo."), ('b', "Institutt for filosofi"), ('4', "edt")]),
            field("700", "1 ", &[('4', "aut")]),
            field("008", "", &[]),
        ]
        .concat();
        let d = describe(&record(&xml), None).unwrap();
        let written: Vec<String> = d.draft.names["author"].iter().map(Person::to_bib).collect();
        assert_eq!(
            written,
            vec![
                "Homer",
                "{Johannes Paul II}",
                "King, Jr., Martin Luther",
                "Beethoven, Ludwig van",
                "Harris, William V."
            ]
        );
        assert_eq!(d.draft.names["editor"], vec![Person::literal("Universitetet i Oslo. Institutt for filosofi")]);
        // Out of capitals, in the way of German, as the words show it to be.
        assert_eq!(d.draft.get("title"), Some("Ilias und Odyssee"));
        assert_eq!(d.draft.get("subtitle"), Some("Die Gesänge der Griechen"));
        assert_eq!(d.remarks.len(), 2);
        assert_eq!(d.remarks[0], text::capitals_remark());
        assert!(d.remarks[1].contains("“HARRIS”"));
    }

    #[test]
    fn volumes_theses_and_parallel_titles() {
        let xml = [
            field(
                "245",
                "10",
                &[
                    ('a', "Geschichte der deutschen Literatur."),
                    ('n', "Bd. 2,"),
                    ('p', "Vom Barock bis zur Aufklärung :"),
                    ('b', "ein Überblick /"),
                    ('c', "Hans Meier."),
                ],
            ),
            field("100", "1 ", &[('a', "Meier, Hans")]),
        ]
        .concat();
        let d = describe(&record(&xml), None).unwrap();
        assert_eq!(d.draft.get("maintitle"), Some("Geschichte der deutschen Literatur"));
        assert_eq!(d.draft.get("title"), Some("Vom Barock bis zur Aufklärung"));
        assert_eq!(d.draft.get("subtitle"), Some("ein Überblick"));
        assert_eq!(d.draft.get("volume"), Some("2"));

        let xml = [
            field("100", "1 ", &[('a', "Berg, Kari")]),
            field("245", "10", &[('a', "Skrift og makt ="), ('b', "Writing and power /"), ('c', "Kari Berg.")]),
            field("260", "  ", &[('a', "[S.l.] :"), ('b', "[s.n.],"), ('c', "[1998?]")]),
            field("502", "  ", &[('b', "Doktoravhandling"), ('c', "Universitetet i Bergen"), ('d', "1998")]),
        ]
        .concat();
        let d = describe(&record(&xml), None).unwrap();
        assert_eq!(d.draft.entry_type, "thesis");
        assert_eq!(d.draft.get("title"), Some("Skrift og makt"));
        assert!(d.draft.get("subtitle").is_none());
        assert_eq!(d.draft.get("type"), Some("phdthesis"));
        assert_eq!(d.draft.get("institution"), Some("Universitetet i Bergen"));
        assert_eq!(d.draft.get("date"), Some("1998?"));
        assert!(d.draft.get("location").is_none() && d.draft.get("publisher").is_none());
        assert_eq!(
            d.remarks,
            vec![
                "The record gives the title in another language as well, which has not been entered: “Writing and power”."
            ]
        );

        // Published as a book, with an ISBN: a book, and a thesis by the way.
        let xml = [
            field("020", "  ", &[('a', "9783110271959 (hbk.)")]),
            field("100", "1 ", &[('a', "Berg, Kari")]),
            field("245", "10", &[('a', "Schrift und Macht")]),
            field("502", "  ", &[('a', "Zugl.: Heidelberg, Univ., Diss., 2010")]),
        ]
        .concat();
        let d = describe(&record(&xml), None).unwrap();
        assert_eq!(d.draft.entry_type, "book");
        assert_eq!(d.draft.get("isbn"), Some("9783110271959"));
        assert_eq!(d.remarks, vec!["The book is also a thesis: Zugl.: Heidelberg, Univ., Diss., 2010."]);
    }

    #[test]
    fn letters_that_change_length_in_lower_case() {
        // U+0130 has two characters in lower case, the Kelvin sign a shorter one.
        assert_eq!(date("İİİ i.e. 1990").as_deref(), Some("1990"));
        assert_eq!(date("İ 1990 İ").as_deref(), Some("1990"));
        // (which composition turns into the letter K)
        assert_eq!(number_in_series("\u{212a}\u{212a} 5"), "KK 5");
        assert_eq!(number_in_series("İ. 5"), "İ. 5");
        assert_eq!(after_word("İİİ (1976)nr. 3, s. 12-14 İ", &["nr."]).as_deref(), Some("3"));
        assert_eq!(after_word("İİİ (1976)nr. 3, s. 12-14 İ", &["s."]).as_deref(), Some("12-14"));
        assert_eq!(extent("İ) 12 (İ p."), (None, None));
        let d = describe(&record(&field("245", "  ", &[('a', "İSTANBUL'UN TARİHİ /"), ('c', "İ")])), None).unwrap();
        assert!(d.draft.get("title").is_some());
    }

    #[test]
    fn records_that_hold_nothing() {
        assert!(describe(&record(""), None).is_none());
        assert!(describe(&record(&field("020", "  ", &[('a', "9783110271959")])), None).is_none());
        assert!(describe(&Record::default(), None).is_none());
        let d = describe(&record(&field("245", "  ", &[('a', "Only a title")])), None).unwrap();
        assert_eq!(fields(&d), vec![("title", "Only a title")]);
        assert_eq!(d.draft.entry_type, "book");
    }
}
