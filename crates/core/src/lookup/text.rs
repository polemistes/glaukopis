//! Mending text as the services deliver it.
//!
//! Everything here is about the form of the text, not about what it says:
//! invisible characters, markup, capitals, the punctuation of catalogues,
//! dashes in page ranges, the names of languages.

use unicode_normalization::UnicodeNormalization;

use crate::bib::latex::fold;
use crate::bib::names::Person;
use crate::bib::parser::normalise_space;

/// Composed letters, no invisible characters, single spaces.
///
/// The Deutsche Nationalbibliothek sends letters decomposed (`a` followed by
/// U+0308) and marks a leading article with the control characters U+0098 and
/// U+009C. Neither can be seen, and both break comparison and typesetting.
pub(crate) fn clean(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    for c in text.nfc() {
        match c {
            '\u{80}'..='\u{9f}' | '\u{ad}' | '\u{200b}' | '\u{2060}' | '\u{feff}' => {}
            // A space that does not break is layout, which the entry is not to carry along.
            '\u{a0}' | '\u{202f}' | '\u{2007}' => out.push(' '),
            c if c.is_control() => out.push(' '),
            c => out.push(c),
        }
    }
    // Some library systems mark the article in this way instead.
    if out.contains("<<") {
        out = out.replace("<<", "").replace(">>", "");
    }
    normalise_space(&out)
}

/// What an entity stands for, for those that occur in titles.
fn entity(name: &str) -> Option<char> {
    if let Some(number) = name.strip_prefix('#') {
        let code = match number.strip_prefix(['x', 'X']) {
            Some(hex) => u32::from_str_radix(hex, 16).ok()?,
            None => number.parse().ok()?,
        };
        return char::from_u32(code).filter(|c| !c.is_control());
    }
    Some(match name {
        "amp" => '&',
        "lt" => '<',
        "gt" => '>',
        "quot" => '"',
        "apos" => '\'',
        "nbsp" => '\u{a0}',
        "ndash" => '–',
        "mdash" => '—',
        "hellip" => '…',
        "lsquo" => '‘',
        "rsquo" => '’',
        "ldquo" => '“',
        "rdquo" => '”',
        "laquo" => '«',
        "raquo" => '»',
        "shy" => '\u{ad}',
        _ => return None,
    })
}

fn resolve_entities(text: &str) -> String {
    if !text.contains('&') {
        return text.to_owned();
    }
    let mut out = String::with_capacity(text.len());
    let mut rest = text;
    while let Some(at) = rest.find('&') {
        out.push_str(&rest[..at]);
        let tail = &rest[at + 1..];
        let resolved = tail.find(';').filter(|&end| end <= 8).and_then(|end| entity(&tail[..end]).map(|c| (c, end)));
        match resolved {
            Some((c, end)) => {
                out.push(c);
                rest = &tail[end + 1..];
            }
            None => {
                out.push('&');
                rest = tail;
            }
        }
    }
    out.push_str(rest);
    out
}

/// Elements that stand on lines of their own: where one ends, words must not run together.
fn is_block(name: &str) -> bool {
    let name = name.rsplit(':').next().unwrap_or(name).to_ascii_lowercase();
    matches!(
        name.as_str(),
        "p" | "br" | "title" | "sec" | "div" | "li" | "list-item" | "tr" | "h1" | "h2" | "h3" | "h4"
    )
}

/// The text without its markup: `<i>`, `<sup>`, `<jats:p>`, `<mml:math>` and
/// the like are dropped and what they enclose is kept.
///
/// A `<` that does not begin a tag ("p < 0.05") is text and stays.
pub(crate) fn strip_markup(text: &str) -> String {
    let text = resolve_entities(text);
    if !text.contains('<') {
        return clean(&text);
    }
    let mut out = String::with_capacity(text.len());
    let mut rest = text.as_str();
    while let Some(at) = rest.find('<') {
        out.push_str(&rest[..at]);
        let tail = &rest[at + 1..];
        let name_start = tail.strip_prefix('/').unwrap_or(tail);
        let is_tag = name_start.starts_with(|c: char| c.is_ascii_alphabetic());
        let end = tail.find(['<', '>']).filter(|&i| tail[i..].starts_with('>'));
        match (is_tag, end) {
            (true, Some(end)) => {
                let name: String = name_start
                    .chars()
                    .take_while(|c| c.is_ascii_alphanumeric() || matches!(c, ':' | '-' | '_'))
                    .collect();
                if is_block(&name) {
                    out.push(' ');
                }
                rest = &tail[end + 1..];
            }
            _ => {
                out.push('<');
                rest = tail;
            }
        }
    }
    out.push_str(rest);
    clean(&out)
}

/// An abstract, without markup and without the heading "Abstract" that
/// publishers deposit along with it.
pub(crate) fn abstract_text(text: &str) -> String {
    let plain = strip_markup(text);
    for heading in ["Abstract", "ABSTRACT", "Summary", "Zusammenfassung", "Résumé", "Sammendrag"] {
        if let Some(rest) = plain.strip_prefix(heading)
            && rest.starts_with([' ', ':', '.'])
        {
            return rest.trim_start_matches([' ', ':', '.']).to_owned();
        }
    }
    plain
}

/// Whether the text is written in capitals throughout. Short words may be
/// abbreviations (NATO, DNA), which are in capitals by right.
pub(crate) fn is_capitals(text: &str) -> bool {
    let letters: Vec<char> = text.chars().filter(|c| c.is_alphabetic()).collect();
    let cased = letters.iter().filter(|c| c.is_uppercase() || c.is_lowercase()).count();
    // Greek capitals are written without the accents that the small letters need.
    let greek = letters.iter().any(|c| ('\u{370}'..='\u{3ff}').contains(c) || ('\u{1f00}'..='\u{1fff}').contains(c));
    if greek || cased < 6 || letters.iter().any(|c| c.is_lowercase()) {
        return false;
    }
    let long_words = text.split(|c: char| !c.is_alphabetic()).filter(|w| w.chars().count() > 3).count();
    long_words >= 1
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Case {
    /// A capital at the beginning only.
    Sentence,
    /// As titles are written in English.
    Title,
    /// Capitals for all but the small words, which is nearest to German, where nouns have them.
    German,
}

const ENGLISH_SMALL: &[&str] = &[
    "a", "an", "the", "and", "but", "or", "nor", "for", "as", "at", "by", "in", "of", "on", "to", "per", "via", "vs",
    "from", "into", "with", "onto", "upon",
];

const GERMAN_SMALL: &[&str] = &[
    "der", "die", "das", "des", "dem", "den", "ein", "eine", "einer", "eines", "einem", "einen", "und", "oder", "aber",
    "in", "im", "an", "am", "auf", "aus", "bei", "beim", "mit", "nach", "von", "vom", "zu", "zum", "zur", "für",
    "über", "unter", "vor", "durch", "um", "als", "wie", "bis", "zwischen", "gegen", "ohne", "sich", "ist", "sind",
    "nicht", "auch", "nur", "noch", "seit", "bzw", "sowie",
];

/// Words that show a title to be English or German, for records that do not name their language.
const ENGLISH_SIGNS: &[&str] = &["the", "of", "and", "with", "from", "by", "on", "to", "its", "their"];
const GERMAN_SIGNS: &[&str] = &[
    "der", "das", "und", "von", "zur", "zum", "im", "für", "über", "des", "dem", "ein", "eine", "mit", "bei", "aus",
    "auf", "als", "die",
];

fn case_for(text: &str, langid: Option<&str>) -> Case {
    match langid {
        Some("english" | "british" | "american" | "australian" | "canadian") => return Case::Title,
        Some("german" | "ngerman" | "austrian" | "naustrian" | "swissgerman" | "nswissgerman") => return Case::German,
        Some(_) => return Case::Sentence,
        None => {}
    }
    let lower = text.to_lowercase();
    let words: Vec<&str> = lower.split(|c: char| !c.is_alphabetic()).filter(|w| !w.is_empty()).collect();
    let count = |signs: &[&str]| words.iter().filter(|w| signs.contains(w)).count();
    let (english, german) = (count(ENGLISH_SIGNS), count(GERMAN_SIGNS));
    if english > german {
        Case::Title
    } else if german > english {
        Case::German
    } else {
        Case::Sentence
    }
}

fn is_roman_numeral(word: &str) -> bool {
    let n = word.chars().count();
    (2..=6).contains(&n)
        && word.chars().all(|c| matches!(c, 'I' | 'V' | 'X'))
        && !word.contains("IIII")
        && !word.contains("VV")
        && !word.contains("XXXX")
        && !word.contains("IIV")
        && !word.contains("IIX")
        && !word.contains("VX")
}

fn capitalised(word: &str) -> String {
    let mut chars = word.chars();
    match chars.next() {
        Some(first) => first.to_uppercase().chain(chars.flat_map(char::to_lowercase)).collect(),
        None => String::new(),
    }
}

/// A title that came in capitals, in the case that titles of its language
/// have. Which words are names cannot be known, so the result needs a look.
pub(crate) fn recase_title(text: &str, langid: Option<&str>) -> String {
    let case = case_for(text, langid);
    let chars: Vec<char> = text.chars().collect();
    let last_word_start = (0..chars.len())
        .rev()
        .find(|&i| chars[i].is_alphanumeric() && (i == 0 || !chars[i - 1].is_alphanumeric()))
        .unwrap_or(0);
    let mut out = String::with_capacity(text.len());
    let mut begins = true;
    let mut after_colon = false;
    let mut i = 0;
    while i < chars.len() {
        let c = chars[i];
        if !c.is_alphanumeric() {
            match c {
                '.' | '!' | '?' if chars.get(i + 1).is_none_or(|n| n.is_whitespace()) => begins = true,
                ':' | '–' | '—' => after_colon = true,
                _ => {}
            }
            out.push(c);
            i += 1;
            continue;
        }
        let start = i;
        while i < chars.len()
            && (chars[i].is_alphanumeric()
                || (matches!(chars[i], '\'' | '’') && chars.get(i + 1).is_some_and(|n| n.is_alphabetic())))
        {
            i += 1;
        }
        let word: String = chars[start..i].iter().collect();
        let lower = word.to_lowercase();
        let initial = word.chars().count() == 1 && chars.get(i) == Some(&'.') && word.chars().all(char::is_alphabetic);
        let done = if is_roman_numeral(&word) || initial {
            word.clone()
        } else {
            match case {
                Case::Sentence if begins => capitalised(&word),
                Case::Sentence => lower,
                Case::Title if begins || after_colon || start == last_word_start => capitalised(&word),
                Case::Title if ENGLISH_SMALL.contains(&lower.as_str()) => lower,
                Case::Title => capitalised(&word),
                Case::German if begins => capitalised(&word),
                Case::German if GERMAN_SMALL.contains(&lower.as_str()) => lower,
                Case::German => capitalised(&word),
            }
        };
        out.push_str(&done);
        begins = false;
        after_colon = false;
    }
    out
}

/// What the user is told when a title has been taken out of capitals.
pub(crate) const CAPITALS_REMARK: &str =
    "The title was in capitals and has been put in lower case: see that names have their capital letters.";

/// A title as it is entered: without markup, without the full stop that some
/// services end titles with, and out of capitals if it came in them.
pub(crate) fn title(raw: &str, langid: Option<&str>, remarks: &mut Vec<String>) -> String {
    let plain = strip_markup(raw);
    let plain = without_final_stop(&plain);
    if !is_capitals(plain) {
        return plain.to_owned();
    }
    if !remarks.iter().any(|r| r == CAPITALS_REMARK) {
        remarks.push(CAPITALS_REMARK.to_owned());
    }
    recase_title(plain, langid)
}

const PARTICLES: &[&str] = &[
    "van", "von", "der", "den", "de", "del", "della", "di", "du", "la", "le", "ter", "ten", "zu", "zur", "af", "av",
    "und", "and", "of", "for", "the", "et", "y", "e", "da", "dos", "das", "do",
];

/// Forms of company that are written in their own way.
const COMPANY_FORMS: &[&str] =
    &["GmbH", "KG", "AG", "AS", "ASA", "AB", "Ltd", "Inc", "Co", "LLC", "PLC", "SA", "BV", "NV"];

/// A publisher's name that came in capitals: `DE GRUYTER` is De Gruyter.
/// Words of up to three letters are left as they are, since they are as
/// likely to be abbreviations (MIT Press, IOP Publishing).
pub(crate) fn recase_publisher(name: &str) -> String {
    let words: Vec<&str> = name.split(' ').collect();
    let single = words.len() == 1;
    words
        .iter()
        .enumerate()
        .map(|(i, word)| {
            let bare = word.trim_matches(|c: char| !c.is_alphanumeric());
            let lower = bare.to_lowercase();
            if let Some(form) = COMPANY_FORMS.iter().find(|f| f.eq_ignore_ascii_case(bare)).filter(|_| i > 0) {
                word.replace(bare, form)
            } else if PARTICLES.contains(&lower.as_str()) {
                if i == 0 { word.replace(bare, &capitalised(bare)) } else { word.replace(bare, &lower) }
            } else if bare.chars().count() <= 3 || (single && bare.chars().count() <= 5) {
                (*word).to_owned()
            } else {
                word.split('-').map(capitalised).collect::<Vec<_>>().join("-")
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

fn name_is_capitals(name: &str) -> bool {
    let letters = name.chars().filter(|c| c.is_alphabetic()).count();
    letters >= 2 && !name.chars().any(char::is_lowercase) && name.chars().any(char::is_uppercase)
}

/// A family name that came in capitals: `HARRIS` is Harris, `VAN DER BERG` van der Berg.
fn recase_family(name: &str) -> String {
    let words: Vec<&str> = name.split(' ').collect();
    let last = words.len().saturating_sub(1);
    words
        .iter()
        .enumerate()
        .map(|(i, word)| {
            let lower = word.to_lowercase();
            if i < last && PARTICLES.contains(&lower.as_str()) {
                lower
            } else {
                word.split('-')
                    .map(|part| match part.split_once(['\'', '’']) {
                        // O'Brien, D'Angelo.
                        Some((before, after)) if before.chars().count() == 1 => {
                            format!("{}'{}", before.to_uppercase(), capitalised(after))
                        }
                        _ => capitalised(part),
                    })
                    .collect::<Vec<_>>()
                    .join("-")
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

/// Given names as they are written: `W.J.` is W. J., and `Robert J` is Robert J.
pub(crate) fn tidy_given(given: &str) -> String {
    let given = clean(given);
    let mut out = String::with_capacity(given.len() + 4);
    let chars: Vec<char> = given.chars().collect();
    for (i, &c) in chars.iter().enumerate() {
        out.push(c);
        let next = chars.get(i + 1).copied();
        let alone = c.is_uppercase()
            && (i == 0 || chars[i - 1] == ' ' || chars[i - 1] == '-')
            && next.is_none_or(|n| n == ' ' || n == '-');
        if alone && c.is_alphabetic() {
            // An initial without its point.
            out.push('.');
        } else if c == '.' && next.is_some_and(|n| n.is_alphabetic()) {
            out.push(' ');
        }
    }
    out
}

/// A person from the parts of a name as a service gives them, with what
/// needed mending told in `remarks`.
pub(crate) fn person(family: &str, given: &str, remarks: &mut Vec<String>) -> Person {
    let mut family = clean(family);
    let mut given = tidy_given(given);
    if name_is_capitals(&family) && family.chars().filter(|c| c.is_alphabetic()).count() > 2 {
        let mended = recase_family(&family);
        remarks.push(format!("The name “{family}” was in capitals and has been written “{mended}”."));
        family = mended;
        if name_is_capitals(&given) && given.chars().filter(|c| c.is_alphabetic()).count() > 3 {
            given = given
                .split(' ')
                .map(|w| w.split('-').map(capitalised).collect::<Vec<_>>().join("-"))
                .collect::<Vec<_>>()
                .join(" ");
        }
    }
    // "van Beethoven" as the family name: the library would read it back as
    // a prefix and a family name, so that is how it is entered.
    let words: Vec<&str> = family.split(' ').collect();
    let particles =
        words.iter().take_while(|w| w.starts_with(char::is_lowercase) && !w.contains(['\'', '’', '-'])).count();
    let mut prefix = String::new();
    if particles > 0 && particles < words.len() {
        prefix = words[..particles].join(" ");
        family = words[particles..].join(" ");
    }
    Person { family, given, prefix, ..Default::default() }
}

/// A name given as one string with the given name first, as arXiv has them.
pub(crate) fn person_from_display(name: &str) -> Person {
    let name = clean(name);
    // Braces, commas and "and" would be read as the syntax of names.
    if name.contains(['{', '}', ',']) || name.to_lowercase().contains(" and ") {
        return Person::literal(name.replace(['{', '}'], ""));
    }
    let mut p = crate::bib::names::parse_one(&name);
    p.given = tidy_given(&p.given);
    p
}

/// `405-450` with the dash that page ranges have, and `1695-9` written out.
pub(crate) fn pages(text: &str) -> String {
    let text = clean(text);
    let text = text.trim_start_matches("pp.").trim_start_matches("p.").trim_start_matches("S.").trim();
    text.split(',')
        .map(|part| {
            let part = part.trim();
            let dashes: Vec<(usize, char)> =
                part.char_indices().filter(|(_, c)| matches!(c, '-' | '–' | '—' | '‐' | '‑' | '−')).collect();
            let (Some(first), Some(last)) = (dashes.first(), dashes.last()) else { return part.to_owned() };
            // One dash, or one written as two or three hyphens.
            let together =
                part[first.0..last.0 + last.1.len_utf8()].chars().all(|c| dashes.iter().any(|(_, d)| *d == c));
            let from = part[..first.0].trim();
            let to = part[last.0 + last.1.len_utf8()..].trim();
            if !together || from.is_empty() || to.is_empty() {
                return part.to_owned();
            }
            format!("{from}–{}", written_out(from, to))
        })
        .collect::<Vec<_>>()
        .join(", ")
}

/// The end of a range that was abbreviated: in `1695-9` the 9 stands for 1699.
fn written_out(from: &str, to: &str) -> String {
    let numeric = |s: &str| !s.is_empty() && s.chars().all(|c| c.is_ascii_digit());
    if numeric(from) && numeric(to) && to.len() < from.len() {
        let full = format!("{}{to}", &from[..from.len() - to.len()]);
        if full.parse::<u64>().ok() > from.parse::<u64>().ok() {
            return full;
        }
    }
    to.to_owned()
}

/// A date of the form `YYYY`, `YYYY-MM` or `YYYY-MM-DD` from its parts. Parts
/// that cannot be are left out, and what follows them with them.
pub(crate) fn date_from_parts(year: i64, month: Option<i64>, day: Option<i64>) -> Option<String> {
    if !(1..=9999).contains(&year) {
        return None;
    }
    let mut out = format!("{year:04}");
    if let Some(m) = month.filter(|m| (1..=12).contains(m)) {
        out.push_str(&format!("-{m:02}"));
        if let Some(d) = day.filter(|d| (1..=31).contains(d)) {
            out.push_str(&format!("-{d:02}"));
        }
    }
    Some(out)
}

/// The number of a month from its name or abbreviation in English, German,
/// French or a Scandinavian language.
pub(crate) fn month_number(name: &str) -> Option<i64> {
    let name = fold(name);
    let name = name.trim();
    if name.len() < 3 {
        return None;
    }
    const MONTHS: [&[&str]; 12] = [
        &["january", "januar", "janvier", "jan"],
        &["february", "februar", "fevrier", "feb", "fev"],
        &["march", "marz", "maerz", "mars", "mar", "mrz"],
        &["april", "avril", "apr", "avr"],
        &["may", "mai", "maj"],
        &["june", "juni", "juin", "jun"],
        &["july", "juli", "juillet", "jul"],
        &["august", "aout", "aug"],
        &["september", "septembre", "sept", "sep"],
        &["october", "oktober", "octobre", "oct", "okt"],
        &["november", "novembre", "nov"],
        &["december", "dezember", "desember", "decembre", "dec", "dez", "des"],
    ];
    MONTHS.iter().position(|names| names.contains(&name)).map(|i| i as i64 + 1)
}

/// The name that babel has for a language, from its code in ISO 639-1
/// (`en`, also `en-GB`) or ISO 639-2 (`eng`, `ger` and `deu`). Languages that
/// are not in the list give none: a name that babel does not know would stop
/// the typesetting.
pub(crate) fn langid(code: &str) -> Option<&'static str> {
    let code = code.trim().to_ascii_lowercase().replace('_', "-");
    match code.as_str() {
        "en-gb" => return Some("british"),
        "en-us" => return Some("american"),
        "pt-br" => return Some("brazilian"),
        _ => {}
    }
    let code = code.split('-').next().unwrap_or("");
    Some(match code {
        "en" | "eng" => "english",
        "de" | "ger" | "deu" => "german",
        "fr" | "fre" | "fra" => "french",
        "it" | "ita" => "italian",
        "es" | "spa" => "spanish",
        "pt" | "por" => "portuguese",
        "nl" | "dut" | "nld" => "dutch",
        "da" | "dan" => "danish",
        "sv" | "swe" => "swedish",
        "no" | "nor" | "nb" | "nob" => "norsk",
        "nn" | "nno" => "nynorsk",
        "fi" | "fin" => "finnish",
        "is" | "ice" | "isl" => "icelandic",
        "la" | "lat" => "latin",
        "el" | "gre" | "ell" | "grc" => "greek",
        "ru" | "rus" => "russian",
        "pl" | "pol" => "polish",
        "cs" | "cze" | "ces" => "czech",
        "sk" | "slo" | "slk" => "slovak",
        "hu" | "hun" => "hungarian",
        "ro" | "rum" | "ron" => "romanian",
        "bg" | "bul" => "bulgarian",
        "uk" | "ukr" => "ukrainian",
        "hr" | "hrv" => "croatian",
        "sr" | "srp" => "serbian",
        "sl" | "slv" => "slovene",
        "tr" | "tur" => "turkish",
        "ca" | "cat" => "catalan",
        "gl" | "glg" => "galician",
        "eu" | "baq" | "eus" => "basque",
        "et" | "est" => "estonian",
        "lv" | "lav" => "latvian",
        "lt" | "lit" => "lithuanian",
        "he" | "heb" => "hebrew",
        "ar" | "ara" => "arabic",
        "cy" | "wel" | "cym" => "welsh",
        "ga" | "gle" => "irish",
        "af" | "afr" => "afrikaans",
        "ja" | "jpn" => "japanese",
        "zh" | "chi" | "zho" => "chinese",
        "ko" | "kor" => "korean",
        _ => return None,
    })
}

/// Whether a full stop at the end belongs to the last word: an initial, an
/// abbreviation or an ellipsis.
fn stop_belongs(text: &str) -> bool {
    let body = &text[..text.len() - 1];
    if body.ends_with('.') || body.ends_with('…') {
        return true;
    }
    // After a bracket or a quotation mark the stop closes the statement.
    if body.ends_with([')', ']', '"', '”', '»']) {
        return false;
    }
    let last = body.rsplit([' ', '\u{a0}', '(', '[']).next().unwrap_or("");
    // Initials and abbreviations of initials: "V.", "N.Y.", "u.a."
    if last.chars().count() == 1 && last.chars().all(char::is_alphabetic) {
        return true;
    }
    if last.contains('.') {
        return true;
    }
    const ABBREVIATIONS: &[&str] = &[
        "mass", "jr", "sr", "inc", "ltd", "co", "corp", "etc", "ed", "eds", "vol", "no", "nr", "bd", "aufl", "verl",
        "univ", "pr", "calif", "conn", "mich", "minn", "penn", "ill", "ind", "wash", "fla", "colo", "tenn", "wis",
        "md", "pa", "va", "vt", "okla", "ariz", "nebr", "kans", "st", "cop", "ca", "hrsg", "utg", "red", "bros",
        "dept", "rev", "enl", "repr", "pbk", "diss", "abt", "cie", "gebr", "druck", "impr", "libr", "edit",
    ];
    ABBREVIATIONS.contains(&last.to_lowercase().as_str())
}

/// Without a full stop at the end, where it closes the statement and is not
/// part of the last word.
pub(crate) fn without_final_stop(text: &str) -> &str {
    let text = text.trim_end();
    if text.ends_with('.') && !stop_belongs(text) { text[..text.len() - 1].trim_end() } else { text }
}

/// Without the punctuation with which catalogues separate the parts of a
/// description, and which stands at the end of the part before: ` /`, ` :`,
/// ` ;`, ` =`, a comma, and a full stop that is not part of the text.
pub(crate) fn without_isbd(text: &str) -> String {
    let mut text = clean(text);
    loop {
        let before = text.len();
        let trimmed = text.trim_end();
        let trimmed = match trimmed.chars().last() {
            Some('/' | ':' | ';' | '=')
                if trimmed.len() == 1 || trimmed[..trimmed.len() - 1].ends_with([' ', '\u{a0}']) =>
            {
                &trimmed[..trimmed.len() - 1]
            }
            Some(',') => &trimmed[..trimmed.len() - 1],
            _ => trimmed,
        };
        text = without_final_stop(trimmed).trim_end_matches([' ', '\u{a0}']).to_owned();
        if text.len() == before {
            break;
        }
    }
    text
}

/// The spacing of catalogues (`Title : subtitle ; part`) as it is written elsewhere.
pub(crate) fn without_isbd_spacing(text: &str) -> String {
    text.replace(" : ", ": ").replace(" ; ", "; ")
}

/// The words of a query that are worth asking for, folded: without the small
/// words, which catalogues do not index and which match everything elsewhere.
pub(crate) fn search_words(text: &str) -> Vec<String> {
    const STOP: &[&str] = &[
        "the", "a", "an", "of", "and", "in", "on", "for", "to", "by", "with", "from", "at", "as", "der", "die", "das",
        "des", "dem", "den", "ein", "eine", "und", "von", "im", "zur", "zum", "le", "la", "les", "un", "une", "et",
        "de", "du", "en", "og", "i", "av", "til", "et", "el", "los", "las", "y", "il", "lo", "gli", "e", "di", "het",
        "een", "van", "ed", "eds", "hrsg", "red",
    ];
    let mut words: Vec<String> = Vec::new();
    for raw in text.split(|c: char| !(c.is_alphanumeric() || matches!(c, '\'' | '’' | '-'))) {
        let raw = raw.trim_matches(['\'', '’', '-']);
        if raw.is_empty() {
            continue;
        }
        let folded = fold(raw);
        if folded.is_empty() {
            continue;
        }
        if !words.iter().any(|w| fold(w) == folded) {
            words.push(raw.to_owned());
        }
    }
    let kept: Vec<String> =
        words.iter().filter(|w| w.chars().count() > 1 && !STOP.contains(&fold(w).as_str())).cloned().collect();
    if kept.is_empty() { words } else { kept }
}

/// Whether a word of a query is a year of publication rather than a word of a title.
pub(crate) fn is_year(word: &str) -> bool {
    word.len() == 4 && word.parse::<u32>().is_ok_and(|y| (1450..=2100).contains(&y))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn invisible_characters() {
        // As the Deutsche Nationalbibliothek sends it: decomposed, with the article marked.
        let dnb = "\u{98}Das\u{9c} kulturelle Geda\u{308}chtnis";
        assert_eq!(clean(dnb), "Das kulturelle Gedächtnis");
        assert_eq!(clean(dnb).chars().count(), 25);
        assert_eq!(clean("  Schrift,\n\tErinnerung  "), "Schrift, Erinnerung");
        assert_eq!(clean("soft\u{ad}hyphen\u{200b} and\u{feff} more"), "softhyphen and more");
        assert_eq!(clean("<<Der>> Zauberberg"), "Der Zauberberg");
        assert_eq!(clean("Duncan\u{a0}J.\u{202f}"), "Duncan J.");
    }

    #[test]
    fn markup() {
        assert_eq!(
            strip_markup("<i>The Best of the Achaens: Concepts of the Hero in Archaic Greek Poetry</i>. Gregory Nagy"),
            "The Best of the Achaens: Concepts of the Hero in Archaic Greek Poetry. Gregory Nagy"
        );
        assert_eq!(strip_markup("Helen <i>Epigrammatopoios</i>"), "Helen Epigrammatopoios");
        assert_eq!(strip_markup("H<sub>2</sub>O and CO<sub>2</sub>"), "H2O and CO2");
        assert_eq!(
            strip_markup("<jats:title>One</jats:title><jats:p>Two.</jats:p><jats:p>Three.</jats:p>"),
            "One Two. Three."
        );
        assert_eq!(
            strip_markup("R &amp; D, &lt;i&gt;really&lt;/i&gt; &#8211; &#x2014; &quot;so&quot;"),
            "R & D, really – — \"so\""
        );
        assert_eq!(strip_markup("<span class=\"a\">Text</span><br/>more"), "Text more");
        // Not markup.
        assert_eq!(strip_markup("p < 0.05 and q > 3"), "p < 0.05 and q > 3");
        assert_eq!(strip_markup("a <b and c"), "a <b and c");
        assert_eq!(strip_markup("x < y <i>z</i>"), "x < y z");
        assert_eq!(strip_markup("Fish & Chips; &unknown; &"), "Fish & Chips; &unknown; &");
        assert_eq!(strip_markup("<"), "<");
    }

    #[test]
    fn abstracts() {
        assert_eq!(abstract_text("<jats:title>Abstract</jats:title><jats:p>We show that …</jats:p>"), "We show that …");
        assert_eq!(abstract_text("Abstracts of papers"), "Abstracts of papers");
    }

    #[test]
    fn capitals() {
        assert!(is_capitals("ORIGINS OF HOMOPHILY"));
        assert!(is_capitals("FRONTMATTER"));
        assert!(is_capitals("DE GRUYTER"));
        assert!(!is_capitals("G. NAGY, The Best of Achaeans"));
        assert!(!is_capitals("NATO"));
        assert!(!is_capitals("DNA"));
        assert!(!is_capitals("1984"));
        assert!(!is_capitals("ΙΛΙΑΣ ΚΑΙ ΟΔΥΣΣΕΙΑ"));
        assert!(!is_capitals(""));
    }

    #[test]
    fn titles_out_of_capitals() {
        assert_eq!(
            recase_title("THE BEST OF THE ACHAEANS: CONCEPTS OF THE HERO IN ARCHAIC GREEK POETRY", Some("english")),
            "The Best of the Achaeans: Concepts of the Hero in Archaic Greek Poetry"
        );
        // The language told by the words.
        assert_eq!(
            recase_title("ORIGINS OF HOMOPHILY IN AN EVOLVING SOCIAL NETWORK", None),
            "Origins of Homophily in an Evolving Social Network"
        );
        assert_eq!(recase_title("WHAT IS IT FOR", Some("english")), "What Is It For");
        assert_eq!(recase_title("STATE-OF-THE-ART METHODS", Some("english")), "State-of-the-Art Methods");
        assert_eq!(
            recase_title("DAS KULTURELLE GEDÄCHTNIS: SCHRIFT, ERINNERUNG UND POLITISCHE IDENTITÄT", None),
            "Das Kulturelle Gedächtnis: Schrift, Erinnerung und Politische Identität"
        );
        assert_eq!(
            recase_title("LA DISTINCTION: CRITIQUE SOCIALE DU JUGEMENT", Some("french")),
            "La distinction: critique sociale du jugement"
        );
        assert_eq!(recase_title("KNUT HAMSUN. REISEN TIL HITLER", Some("norsk")), "Knut hamsun. Reisen til hitler");
        assert_eq!(recase_title("FRONTMATTER", None), "Frontmatter");
        assert_eq!(recase_title("BOOK REVIEWS", None), "Book reviews");
        // Numerals and initials keep their capitals.
        assert_eq!(recase_title("HENRY VIII AND LOUIS XIV", Some("english")), "Henry VIII and Louis XIV");
        assert_eq!(
            recase_title("G. NAGY, THE BEST OF THE ACHAEANS", Some("english")),
            "G. Nagy, the Best of the Achaeans"
        );
        assert_eq!(recase_title("L'ÉTAT ET L'ÉGLISE", Some("french")), "L'état et l'église");
        assert_eq!(recase_title("THE 19TH CENTURY", Some("english")), "The 19th Century");
    }

    #[test]
    fn publishers_out_of_capitals() {
        assert_eq!(recase_publisher("DE GRUYTER"), "De Gruyter");
        assert_eq!(recase_publisher("WALTER DE GRUYTER GMBH"), "Walter de Gruyter GmbH");
        assert_eq!(recase_publisher("OXFORD UNIVERSITY PRESS"), "Oxford University Press");
        assert_eq!(recase_publisher("MIT PRESS"), "MIT Press");
        assert_eq!(recase_publisher("IOP PUBLISHING"), "IOP Publishing");
        assert_eq!(recase_publisher("JSTOR"), "JSTOR");
        assert_eq!(recase_publisher("BRILL"), "BRILL");
        assert_eq!(recase_publisher("SPRINGER-VERLAG"), "Springer-Verlag");
        assert_eq!(recase_publisher("WILEY & SONS, INC."), "Wiley & Sons, Inc.");
    }

    #[test]
    fn names() {
        let mut remarks = Vec::new();
        assert_eq!(person("Kossinets", "Gueorgi", &mut remarks), Person::new("Kossinets", "Gueorgi"));
        assert_eq!(person("Verdenius", "W.J.", &mut remarks), Person::new("Verdenius", "W. J."));
        assert_eq!(person("Lonigro", "Robert J", &mut remarks), Person::new("Lonigro", "Robert J."));
        assert_eq!(person("Brenner", "J Chad", &mut remarks), Person::new("Brenner", "J. Chad"));
        assert_eq!(person("Sartre", "J.-P.", &mut remarks), Person::new("Sartre", "J.-P."));
        assert_eq!(person("Mani", "Ram-Shankar", &mut remarks), Person::new("Mani", "Ram-Shankar"));
        assert!(remarks.is_empty());

        let beethoven = person("van Beethoven", "Ludwig", &mut remarks);
        assert_eq!((beethoven.prefix.as_str(), beethoven.family.as_str()), ("van", "Beethoven"));
        assert_eq!(beethoven.to_bib(), "van Beethoven, Ludwig");
        let fontaine = person("de la Fontaine", "Jean", &mut remarks);
        assert_eq!((fontaine.prefix.as_str(), fontaine.family.as_str()), ("de la", "Fontaine"));
        assert_eq!(person("Ortega y Gasset", "José", &mut remarks).family, "Ortega y Gasset");
        assert_eq!(person("al-Farabi", "", &mut remarks).family, "al-Farabi");
        assert_eq!(person("d'Alembert", "Jean", &mut remarks).family, "d'Alembert");
        assert!(remarks.is_empty());

        assert_eq!(person("HARRIS", "William V.", &mut remarks), Person::new("Harris", "William V."));
        assert_eq!(remarks, vec!["The name “HARRIS” was in capitals and has been written “Harris”."]);
        assert_eq!(recase_family("VAN DER BERG"), "van der Berg");
        assert_eq!(recase_family("O'BRIEN"), "O'Brien");
        assert_eq!(recase_family("KUMAR-SINHA"), "Kumar-Sinha");
        // Two letters may be the whole name.
        let mut none = Vec::new();
        assert_eq!(person("LI", "Wei", &mut none).family, "LI");
    }

    #[test]
    fn names_in_one_string() {
        assert_eq!(person_from_display("Ashish Vaswani"), Person::new("Vaswani", "Ashish"));
        assert_eq!(person_from_display("Aidan N. Gomez"), Person::new("Gomez", "Aidan N."));
        let boer = person_from_display("Victor de Boer");
        assert_eq!((boer.given.as_str(), boer.prefix.as_str(), boer.family.as_str()), ("Victor", "de", "Boer"));
        assert_eq!(person_from_display("Camille Noûs"), Person::new("Noûs", "Camille"));
        assert_eq!(
            person_from_display("The ATLAS Collaboration, CERN"),
            Person::literal("The ATLAS Collaboration, CERN")
        );
        assert_eq!(person_from_display("Homer"), Person::new("Homer", ""));
    }

    #[test]
    fn page_ranges() {
        assert_eq!(pages("405-450"), "405–450");
        assert_eq!(pages("405--450"), "405–450");
        assert_eq!(pages("405 - 450"), "405–450");
        assert_eq!(pages("405–450"), "405–450");
        assert_eq!(pages("405—450"), "405–450");
        assert_eq!(pages("276"), "276");
        assert_eq!(pages("e1234"), "e1234");
        assert_eq!(pages("i-iv"), "i–iv");
        assert_eq!(pages("S12-S20"), "S12–S20");
        assert_eq!(pages("1695-9"), "1695–1699");
        assert_eq!(pages("1695-703"), "1695–1703");
        assert_eq!(pages("95-103"), "95–103");
        assert_eq!(pages("12-8"), "12–18");
        assert_eq!(pages("1-10, 15-20"), "1–10, 15–20");
        assert_eq!(pages("pp. 38-41"), "38–41");
        assert_eq!(pages("276-"), "276-");
        assert_eq!(pages("3-10-15"), "3-10-15");
        assert_eq!(pages(""), "");
    }

    #[test]
    fn dates_and_months() {
        assert_eq!(date_from_parts(2009, Some(9), None).as_deref(), Some("2009-09"));
        assert_eq!(date_from_parts(2012, Some(4), Some(12)).as_deref(), Some("2012-04-12"));
        assert_eq!(date_from_parts(1981, None, Some(3)).as_deref(), Some("1981"));
        assert_eq!(date_from_parts(800, None, None).as_deref(), Some("0800"));
        assert_eq!(date_from_parts(2009, Some(13), Some(1)).as_deref(), Some("2009"));
        assert_eq!(date_from_parts(0, None, None), None);
        assert_eq!(month_number("Dec"), Some(12));
        assert_eq!(month_number("Mrz."), Some(3));
        assert_eq!(month_number("août"), Some(8));
        assert_eq!(month_number("Sept"), Some(9));
        assert_eq!(month_number("desember"), Some(12));
        assert_eq!(month_number("ma"), None);
        assert_eq!(month_number("Michaelmas"), None);
    }

    #[test]
    fn languages() {
        assert_eq!(langid("en"), Some("english"));
        assert_eq!(langid("en-GB"), Some("british"));
        assert_eq!(langid("en-AU"), Some("english"));
        assert_eq!(langid("eng"), Some("english"));
        assert_eq!(langid("ger"), Some("german"));
        assert_eq!(langid("deu"), Some("german"));
        assert_eq!(langid("nob"), Some("norsk"));
        assert_eq!(langid("nno"), Some("nynorsk"));
        assert_eq!(langid("grc"), Some("greek"));
        assert_eq!(langid(" FRE "), Some("french"));
        for unknown in ["und", "mul", "zxx", "|||", "", "xx", "tlh"] {
            assert_eq!(langid(unknown), None, "{unknown}");
        }
    }

    #[test]
    fn the_punctuation_of_catalogues() {
        // From the record of the Library of Congress for Harris, Ancient literacy.
        assert_eq!(without_isbd("Ancient literacy /"), "Ancient literacy");
        assert_eq!(without_isbd("Cambridge, Mass. :"), "Cambridge, Mass.");
        assert_eq!(without_isbd("Harvard University Press,"), "Harvard University Press");
        assert_eq!(without_isbd("1989."), "1989");
        assert_eq!(without_isbd("Harris, William V."), "Harris, William V.");
        assert_eq!(without_isbd("xv, 383 p. ;"), "xv, 383 p.");
        // From the Norwegian record for Rem, Knut Hamsun.
        assert_eq!(without_isbd("Knut Hamsun :"), "Knut Hamsun");
        assert_eq!(without_isbd("Edda (trykt utg.)."), "Edda (trykt utg.)");
        // What is part of the text stays.
        assert_eq!(without_isbd("Wiley & Sons, Inc."), "Wiley & Sons, Inc.");
        assert_eq!(without_isbd("Washington, D.C. :"), "Washington, D.C.");
        assert_eq!(without_isbd("Quo vadis?"), "Quo vadis?");
        assert_eq!(without_isbd("And then …"), "And then …");
        assert_eq!(without_isbd("And then..."), "And then...");
        assert_eq!(without_isbd("Either/or"), "Either/or");
        assert_eq!(without_isbd("Ratio 1:"), "Ratio 1:");
        assert_eq!(without_isbd("Title. /"), "Title");
        assert_eq!(without_isbd("/"), "");
        assert_eq!(
            without_isbd_spacing("Aleida und Jan Assmann : ein Gespräch ; Teil 1"),
            "Aleida und Jan Assmann: ein Gespräch; Teil 1"
        );
    }

    #[test]
    fn words_to_search_for() {
        assert_eq!(search_words("Nagy, The Best of the Achaeans"), vec!["Nagy", "Best", "Achaeans"]);
        assert_eq!(search_words("kulturelle Gedächtnis Assmann"), vec!["kulturelle", "Gedächtnis", "Assmann"]);
        assert_eq!(search_words("Hamsun: reisen til Hitler (Rem)"), vec!["Hamsun", "reisen", "Hitler", "Rem"]);
        assert_eq!(search_words("\"L'Être et le néant\" Sartre"), vec!["L'Être", "néant", "Sartre"]);
        assert_eq!(search_words("Nagy nagy NAGY"), vec!["Nagy"]);
        // Small words alone are all there is to ask for.
        assert_eq!(search_words("The The"), vec!["The"]);
        assert!(search_words(" , . ").is_empty());
        assert!(is_year("1979") && is_year("2026"));
        assert!(!is_year("0979") && !is_year("19790") && !is_year("197x") && !is_year("3000"));
    }
}
