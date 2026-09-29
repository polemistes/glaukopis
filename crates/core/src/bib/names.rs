//! Names as BibTeX understands them.
//!
//! A name list is separated by ` and ` outside braces. A name has one of the
//! forms `First von Last`, `von Last, First` or `von Last, Jr, First`. A name
//! wholly in braces is an institution, and is not taken apart. BibLaTeX's
//! extended form (`family=…, given=…`) is read as well.

use serde::{Deserialize, Serialize};

use super::latex::{fold, plain};
use crate::tr;

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(default)]
pub struct Person {
    pub family: String,
    #[serde(skip_serializing_if = "String::is_empty")]
    pub given: String,
    /// The "von" part: de, van der, von.
    #[serde(skip_serializing_if = "String::is_empty")]
    pub prefix: String,
    /// The "Jr" part.
    #[serde(skip_serializing_if = "String::is_empty")]
    pub suffix: String,
    /// An institution or any other name that is not to be inverted or abbreviated.
    #[serde(skip_serializing_if = "std::ops::Not::not")]
    pub literal: bool,
}

impl Person {
    pub fn literal(name: impl Into<String>) -> Self {
        Person { family: name.into(), literal: true, ..Default::default() }
    }

    pub fn new(family: impl Into<String>, given: impl Into<String>) -> Self {
        Person { family: family.into(), given: given.into(), ..Default::default() }
    }

    pub fn is_empty(&self) -> bool {
        self.family.trim().is_empty() && self.given.trim().is_empty()
    }

    /// `van Gogh`, without the given name.
    pub fn family_with_prefix(&self) -> String {
        let family = plain(&self.family);
        if self.prefix.is_empty() { family } else { format!("{} {}", plain(&self.prefix), family) }
    }

    /// `Vincent van Gogh`.
    pub fn display(&self) -> String {
        let mut parts = Vec::new();
        if !self.given.is_empty() {
            parts.push(plain(&self.given));
        }
        parts.push(self.family_with_prefix());
        let mut s = parts.join(" ");
        if !self.suffix.is_empty() {
            s.push_str(", ");
            s.push_str(&plain(&self.suffix));
        }
        s
    }

    /// `van Gogh, Vincent`.
    pub fn sorted(&self) -> String {
        let mut s = self.family_with_prefix();
        if !self.suffix.is_empty() {
            s.push_str(", ");
            s.push_str(&plain(&self.suffix));
        }
        if !self.given.is_empty() {
            s.push_str(", ");
            s.push_str(&plain(&self.given));
        }
        s
    }

    /// The family name folded for comparison, without prefix.
    pub fn family_key(&self) -> String {
        fold(&self.family)
    }

    /// As written in a `.bib` file.
    pub fn to_bib(&self) -> String {
        if self.literal {
            return format!("{{{}}}", self.family.trim());
        }
        let family = protect(self.family.trim());
        let mut s = String::new();
        if !self.prefix.trim().is_empty() {
            s.push_str(self.prefix.trim());
            s.push(' ');
        }
        s.push_str(&family);
        if !self.suffix.trim().is_empty() {
            s.push_str(", ");
            s.push_str(self.suffix.trim());
        }
        if !self.given.trim().is_empty() {
            s.push_str(", ");
            s.push_str(self.given.trim());
        } else if !self.suffix.trim().is_empty() {
            s.push(',');
        }
        s
    }
}

/// A family name containing ` and ` or a comma would be misread; braces prevent it.
fn protect(family: &str) -> String {
    let needs = split_top(family, " and ").len() > 1 || contains_top(family, ',');
    if needs && !(family.starts_with('{') && family.ends_with('}')) {
        format!("{{{family}}}")
    } else {
        family.to_owned()
    }
}

pub fn parse_list(value: &str) -> Vec<Person> {
    let mut out = Vec::new();
    for part in split_top(value.trim(), " and ") {
        let part = part.trim();
        if part.is_empty() {
            continue;
        }
        if part == "others" {
            out.push(Person::literal("others"));
            continue;
        }
        let person = parse_one(part);
        if !person.is_empty() {
            out.push(person);
        }
    }
    out
}

pub fn format_list(people: &[Person]) -> String {
    people
        .iter()
        .filter(|p| !p.is_empty())
        .map(|p| if p.literal && p.family == "others" { "others".to_owned() } else { p.to_bib() })
        .collect::<Vec<_>>()
        .join(" and ")
}

/// Splits at `sep` where brace depth is zero. `sep` is matched without regard to case.
fn split_top<'a>(s: &'a str, sep: &str) -> Vec<&'a str> {
    let bytes = s.as_bytes();
    let sep_bytes = sep.as_bytes();
    let mut out = Vec::new();
    let mut depth = 0i32;
    let mut start = 0;
    let mut i = 0;
    while i < bytes.len() {
        match bytes[i] {
            b'{' => depth += 1,
            b'}' => depth -= 1,
            _ => {}
        }
        if depth == 0
            && i + sep_bytes.len() <= bytes.len()
            && bytes[i..i + sep_bytes.len()].eq_ignore_ascii_case(sep_bytes)
        {
            out.push(&s[start..i]);
            i += sep_bytes.len();
            start = i;
            continue;
        }
        i += 1;
    }
    out.push(&s[start..]);
    out
}

fn contains_top(s: &str, ch: char) -> bool {
    let mut depth = 0;
    for c in s.chars() {
        match c {
            '{' => depth += 1,
            '}' => depth -= 1,
            c if c == ch && depth == 0 => return true,
            _ => {}
        }
    }
    false
}

/// Words at brace depth zero, separated by spaces (including non-breaking
/// ones, which bibliographies use between initials).
fn words(s: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut depth = 0;
    let mut current = String::new();
    for c in s.chars() {
        match c {
            '{' => {
                depth += 1;
                current.push(c);
            }
            '}' => {
                depth -= 1;
                current.push(c);
            }
            c if (c.is_whitespace() || c == '~') && depth == 0 => {
                if !current.is_empty() {
                    out.push(std::mem::take(&mut current));
                }
            }
            _ => current.push(c),
        }
    }
    if !current.is_empty() {
        out.push(current);
    }
    out
}

/// BibTeX takes a word to belong to the "von" part when its first letter is lower case.
fn is_lower_word(word: &str) -> bool {
    let mut depth = 0;
    let mut chars = word.chars().peekable();
    while let Some(c) = chars.next() {
        match c {
            '{' => {
                // A group at depth 0 that begins with a command is looked into; otherwise
                // a braced word counts as upper case.
                if depth == 0 && chars.peek() != Some(&'\\') {
                    return false;
                }
                depth += 1;
            }
            '}' => depth -= 1,
            '\\' => {
                while chars.peek().is_some_and(|c| c.is_ascii_alphabetic()) {
                    chars.next();
                }
            }
            c if c.is_alphabetic() => return c.is_lowercase(),
            _ => {}
        }
    }
    false
}

fn strip_outer_braces(s: &str) -> Option<&str> {
    let s = s.trim();
    if !(s.starts_with('{') && s.ends_with('}')) || s.len() < 2 {
        return None;
    }
    // The first brace must be the one that closes at the end.
    let mut depth = 0;
    for (i, c) in s.char_indices() {
        match c {
            '{' => depth += 1,
            '}' => {
                depth -= 1;
                if depth == 0 && i != s.len() - 1 {
                    return None;
                }
            }
            _ => {}
        }
    }
    Some(&s[1..s.len() - 1])
}

fn parse_extended(s: &str) -> Option<Person> {
    // family=Gogh, given=Vincent, prefix=van, suffix=Jr, useprefix=true
    let parts: Vec<&str> = split_commas(s);
    if !parts.iter().all(|p| p.contains('=')) {
        return None;
    }
    let mut person = Person::default();
    let mut any = false;
    for part in parts {
        let (k, v) = part.split_once('=')?;
        let v = v.trim();
        let v = strip_outer_braces(v).unwrap_or(v).to_owned();
        match k.trim().to_ascii_lowercase().as_str() {
            "family" => {
                person.family = v;
                any = true;
            }
            "given" => {
                person.given = v;
                any = true;
            }
            "prefix" => person.prefix = v,
            "suffix" => person.suffix = v,
            _ => {}
        }
    }
    any.then_some(person)
}

fn split_commas(s: &str) -> Vec<&str> {
    let mut out = Vec::new();
    let mut depth = 0;
    let mut start = 0;
    for (i, c) in s.char_indices() {
        match c {
            '{' => depth += 1,
            '}' => depth -= 1,
            ',' if depth == 0 => {
                out.push(s[start..i].trim());
                start = i + 1;
            }
            _ => {}
        }
    }
    out.push(s[start..].trim());
    out
}

pub fn parse_one(name: &str) -> Person {
    let name = name.trim();
    if let Some(inner) = strip_outer_braces(name) {
        return Person::literal(inner.trim());
    }
    if name.contains('=')
        && let Some(p) = parse_extended(name)
    {
        return p;
    }

    let parts = split_commas(name);
    match parts.len() {
        1 => {
            // First von Last
            let ws = words(parts[0]);
            if ws.len() == 1 {
                return Person { family: unbrace_word(&ws[0]), ..Default::default() };
            }
            // The von part runs from the first lower-case word to the last lower-case
            // word; the last word is always part of the family name.
            let first_lower = ws[..ws.len() - 1].iter().position(|w| is_lower_word(w));
            match first_lower {
                Some(start) => {
                    let end = ws[..ws.len() - 1].iter().rposition(|w| is_lower_word(w)).unwrap_or(start);
                    Person {
                        given: ws[..start].join(" "),
                        prefix: ws[start..=end].join(" "),
                        family: join_family(&ws[end + 1..]),
                        ..Default::default()
                    }
                }
                None => Person {
                    given: ws[..ws.len() - 1].join(" "),
                    family: unbrace_word(&ws[ws.len() - 1]),
                    ..Default::default()
                },
            }
        }
        n => {
            // von Last, First   or   von Last, Jr, First
            let ws = words(parts[0]);
            let (prefix, family) = if ws.len() > 1 {
                let end = ws[..ws.len() - 1].iter().rposition(|w| is_lower_word(w));
                match end {
                    Some(end) => (ws[..=end].join(" "), join_family(&ws[end + 1..])),
                    None => (String::new(), join_family(&ws)),
                }
            } else {
                (String::new(), join_family(&ws))
            };
            let (suffix, given) = if n >= 3 {
                (parts[1].to_owned(), parts[2..].join(", "))
            } else {
                (String::new(), parts[1].to_owned())
            };
            Person { family, given: words(&given).join(" "), prefix, suffix, literal: false }
        }
    }
}

fn join_family(ws: &[String]) -> String {
    if ws.len() == 1 { unbrace_word(&ws[0]) } else { ws.join(" ") }
}

/// `{Last}` as a whole word: the braces only kept it together.
fn unbrace_word(w: &str) -> String {
    match strip_outer_braces(w) {
        Some(inner) if !inner.starts_with('\\') => inner.to_owned(),
        _ => w.to_owned(),
    }
}

/// A short form for lists: `Nagy`, `Nagy and Lord`, `Nagy, Lord and Parry`, `Nagy et al.`
pub fn short_list(people: &[Person]) -> String {
    let real: Vec<&Person> = people.iter().filter(|p| !(p.literal && p.family == "others")).collect();
    let others = real.len() != people.len();
    let names: Vec<String> = real.iter().map(|p| p.family_with_prefix()).collect();
    match (names.len(), others) {
        (0, _) => String::new(),
        (1, false) => names[0].clone(),
        (2, false) => tr!("core-library-two-names", first = &names[0], second = &names[1]),
        (3, false) => tr!("core-library-three-names", first = &names[0], second = &names[1], third = &names[2]),
        _ => tr!("core-library-et-al", first = &names[0]),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn p(family: &str, given: &str, prefix: &str, suffix: &str) -> Person {
        Person {
            family: family.into(),
            given: given.into(),
            prefix: prefix.into(),
            suffix: suffix.into(),
            literal: false,
        }
    }

    #[test]
    fn the_three_forms() {
        assert_eq!(parse_one("Gregory Nagy"), p("Nagy", "Gregory", "", ""));
        assert_eq!(parse_one("Nagy, Gregory"), p("Nagy", "Gregory", "", ""));
        assert_eq!(parse_one("Ludwig van Beethoven"), p("Beethoven", "Ludwig", "van", ""));
        assert_eq!(parse_one("van Beethoven, Ludwig"), p("Beethoven", "Ludwig", "van", ""));
        assert_eq!(parse_one("King, Jr., Martin Luther"), p("King", "Martin Luther", "", "Jr."));
        assert_eq!(parse_one("de la Fontaine, Jean"), p("Fontaine", "Jean", "de la", ""));
        assert_eq!(parse_one("Jean de la Fontaine"), p("Fontaine", "Jean", "de la", ""));
        assert_eq!(
            parse_one("Wilamowitz-Moellendorff, Ulrich von"),
            p("Wilamowitz-Moellendorff", "Ulrich von", "", "")
        );
        assert_eq!(parse_one("Homer"), p("Homer", "", "", ""));
        assert_eq!(parse_one("M. L. West"), p("West", "M. L.", "", ""));
        assert_eq!(parse_one("West, M.~L."), p("West", "M. L.", "", ""));
    }

    #[test]
    fn braces() {
        assert_eq!(parse_one("{British Museum}"), Person::literal("British Museum"));
        assert_eq!(parse_one("{Barnes and Noble}"), Person::literal("Barnes and Noble"));
        assert_eq!(parse_one("Jean {de la Fontaine}"), p("de la Fontaine", "Jean", "", ""));
        assert_eq!(parse_one("{van Gogh}, Vincent"), p("van Gogh", "Vincent", "", ""));
    }

    #[test]
    fn extended_form() {
        assert_eq!(
            parse_one("family=Gogh, given=Vincent, prefix=van, useprefix=true"),
            p("Gogh", "Vincent", "van", "")
        );
    }

    #[test]
    fn lists() {
        let list = parse_list("Nagy, Gregory and Lord, Albert B. AND {Center for Hellenic Studies} and others");
        assert_eq!(list.len(), 4);
        assert_eq!(list[1], p("Lord", "Albert B.", "", ""));
        assert!(list[2].literal);
        assert_eq!(short_list(&list), "Nagy et al.");
        assert_eq!(short_list(&list[..2]), "Nagy and Lord");
        assert_eq!(
            format_list(&list),
            "Nagy, Gregory and Lord, Albert B. and {Center for Hellenic Studies} and others"
        );
        // "and" inside a word or inside braces does not separate.
        assert_eq!(parse_list("Anderson, Sandy").len(), 1);
    }

    #[test]
    fn writing() {
        assert_eq!(p("Beethoven", "Ludwig", "van", "").to_bib(), "van Beethoven, Ludwig");
        assert_eq!(p("King", "Martin Luther", "", "Jr.").to_bib(), "King, Jr., Martin Luther");
        assert_eq!(p("Homer", "", "", "").to_bib(), "Homer");
        assert_eq!(p("Ortega y Gasset", "José", "", "").to_bib(), "Ortega y Gasset, José");
        assert_eq!(p("Black and White", "A.", "", "").to_bib(), "{Black and White}, A.");
        assert_eq!(Person::literal("British Museum").to_bib(), "{British Museum}");
        for s in ["van Beethoven, Ludwig", "King, Jr., Martin Luther", "{British Museum}", "Nagy, Gregory"] {
            assert_eq!(parse_one(s).to_bib(), s);
        }
    }

    #[test]
    fn display_forms() {
        let v = p("Gogh", "Vincent", "van", "");
        assert_eq!(v.display(), "Vincent van Gogh");
        assert_eq!(v.sorted(), "van Gogh, Vincent");
        assert_eq!(v.family_key(), "gogh");
    }
}
