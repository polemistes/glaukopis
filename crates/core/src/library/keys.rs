//! Citation keys.

use std::collections::HashSet;

use unicode_normalization::UnicodeNormalization;

use super::entry::Entry;

/// Whether a key can be used as it is, in LaTeX and in Pandoc.
pub fn is_valid_key(key: &str) -> bool {
    let mut chars = key.chars();
    match chars.next() {
        Some(c) if c.is_alphanumeric() || c == '_' => {}
        _ => return false,
    }
    key.chars().all(|c| c.is_alphanumeric() || matches!(c, '_' | '-' | ':' | '.' | '+' | '/'))
        && !key.ends_with(['.', ':', '-', '/', '+'])
}

/// Makes any text into a valid key, or returns nothing when nothing is left.
pub fn sanitise_key(key: &str) -> Option<String> {
    let mut out = String::new();
    for c in key.trim().chars() {
        if c.is_alphanumeric() || matches!(c, '_' | '-' | ':' | '.' | '+' | '/') {
            out.push(c);
        } else if c.is_whitespace() && !out.ends_with('_') {
            out.push('_');
        }
    }
    let out = out
        .trim_start_matches(|c: char| !(c.is_alphanumeric() || c == '_'))
        .trim_end_matches(['.', ':', '-', '/', '+', '_'])
        .to_owned();
    (!out.is_empty()).then_some(out)
}

/// Letters of the Latin alphabet without their diacritics; other scripts are kept.
fn simplify(text: &str) -> String {
    let mut out = String::new();
    for c in crate::bib::latex::plain(text).nfd() {
        if unicode_normalization::char::is_combining_mark(c) {
            continue;
        }
        match c {
            'ß' => out.push_str("ss"),
            'ø' => out.push('o'),
            'Ø' => out.push('O'),
            'æ' => out.push_str("ae"),
            'Æ' => out.push_str("Ae"),
            'œ' => out.push_str("oe"),
            'Œ' => out.push_str("Oe"),
            'å' => out.push('a'),
            'ł' => out.push('l'),
            'Ł' => out.push('L'),
            'đ' | 'ð' => out.push('d'),
            'þ' => out.push_str("th"),
            c if c.is_alphanumeric() => out.push(c),
            _ => {}
        }
    }
    out
}

const STOP_WORDS: &[&str] = &[
    "a", "an", "the", "on", "of", "in", "and", "to", "for", "der", "die", "das", "ein", "eine", "und", "zur", "zum",
    "von", "le", "la", "les", "un", "une", "de", "du", "des", "et", "il", "lo", "gli", "el", "los", "las", "en", "et",
    "om", "og", "det", "den",
];

/// The base of a key for an entry: family name of the first creator, in lower
/// case, and the year. Without a creator, the first significant word of the
/// title; without a year, that word as well.
pub fn base_key(entry: &Entry) -> String {
    let creators = entry.creators();
    let name = creators.first().map(|p| simplify(&p.family).to_lowercase()).filter(|s| !s.is_empty());
    let year = entry.year().map(|y| if y < 0 { format!("{}bce", -y) } else { y.to_string() });
    let title_word = crate::bib::latex::plain(entry.get("title").unwrap_or(""))
        .split(|c: char| !c.is_alphanumeric())
        .map(|w| simplify(w).to_lowercase())
        .find(|w| w.chars().count() > 1 && !STOP_WORDS.contains(&w.as_str()));

    let mut key = String::new();
    match (&name, &title_word) {
        (Some(n), _) => key.push_str(n),
        (None, Some(t)) => key.push_str(t),
        (None, None) => key.push_str("untitled"),
    }
    match year {
        Some(y) => key.push_str(&y),
        None => {
            if let (Some(_), Some(t)) = (&name, &title_word) {
                key.push('_');
                key.push_str(t);
            }
        }
    }
    sanitise_key(&key).unwrap_or_else(|| "untitled".into())
}

/// A key not yet in use: the base, or the base with `a`, `b`, … `z`, `aa`, …
pub fn unique_key(base: &str, taken: &HashSet<String>) -> String {
    let lower: HashSet<String> = taken.iter().map(|k| k.to_lowercase()).collect();
    unique_key_where(base, |candidate| lower.contains(&candidate.to_lowercase()))
}

/// As [`unique_key`], asking `is_taken` of each key it tries: for a library
/// that knows its keys already.
pub fn unique_key_where(base: &str, is_taken: impl Fn(&str) -> bool) -> String {
    if !is_taken(base) {
        return base.to_owned();
    }
    // A key ending in a digit takes a letter; one ending in a letter takes a number.
    let digit_end = base.chars().last().is_some_and(|c| c.is_ascii_digit());
    for n in 0.. {
        let candidate = if digit_end { format!("{base}{}", letters(n)) } else { format!("{base}{}", n + 2) };
        if !is_taken(&candidate) {
            return candidate;
        }
    }
    unreachable!()
}

fn letters(mut n: usize) -> String {
    let mut s = Vec::new();
    loop {
        s.push(b'a' + (n % 26) as u8);
        n /= 26;
        if n == 0 {
            break;
        }
        n -= 1;
    }
    s.reverse();
    String::from_utf8(s).unwrap()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bib::parse;
    use crate::library::entry::Draft;

    fn entry(src: &str) -> Entry {
        Draft::from_raw(parse(src).entries().next().unwrap()).to_entry()
    }

    #[test]
    fn validity() {
        for k in ["nagy1979", "Nagy:1979a", "a.b-c_d", "νάγυ1979", "10.1000/x"] {
            assert!(is_valid_key(k), "{k}");
        }
        for k in ["", "a b", "a,b", "{x}", "-a", "a#b", "a."] {
            assert!(!is_valid_key(k), "{k}");
        }
        assert_eq!(sanitise_key("  Nagy, G. (1979) ").as_deref(), Some("Nagy_G._1979"));
        assert_eq!(sanitise_key("{}"), None);
    }

    #[test]
    fn bases() {
        assert_eq!(base_key(&entry("@book{x, author={Nagy, Gregory}, date={1979}}")), "nagy1979");
        assert_eq!(
            base_key(&entry(r#"@book{x, author={von Wilamowitz-Moellendorff, U.}, year={1921}}"#)),
            "wilamowitzmoellendorff1921"
        );
        assert_eq!(base_key(&entry("@book{x, author={Søren Kierkegård}, date={1843}}")), "kierkegard1843");
        assert_eq!(base_key(&entry("@book{x, title={The Oxford Classical Dictionary}, date={2012}}")), "oxford2012");
        assert_eq!(base_key(&entry("@book{x, author={Nagy, G.}, title={On the Hero}}")), "nagy_hero");
        assert_eq!(base_key(&entry("@book{x, author={Caesar}, date={-0050}}")), "caesar50bce");
        assert_eq!(base_key(&entry("@misc{x}")), "untitled");
        assert_eq!(base_key(&entry("@book{x, author={Ὅμηρος}, date={1920}}")), "ομηρος1920");
    }

    #[test]
    fn uniqueness() {
        let mut taken: HashSet<String> = ["nagy1979".to_owned()].into();
        assert_eq!(unique_key("nagy1979", &taken), "nagy1979a");
        taken.insert("Nagy1979a".into());
        assert_eq!(unique_key("nagy1979", &taken), "nagy1979b");
        assert_eq!(unique_key("lord1960", &taken), "lord1960");
        taken.insert("nagy_hero".into());
        assert_eq!(unique_key("nagy_hero", &taken), "nagy_hero2");
        assert_eq!(letters(25), "z");
        assert_eq!(letters(26), "aa");
    }
}
