//! Finding out what a PDF is.
//!
//! A PDF that is dropped into the application seldom describes itself well,
//! but it often holds an identifier by which a full description can be looked
//! up: the DOI on the first page of an article, the ISBN on the imprint page
//! of a book, the stamp of arXiv in the margin of a preprint. These are looked
//! for in the text of the first pages, then in the metadata of the file. What
//! the metadata say of title and author is taken with suspicion, since it is
//! often the name of the file the typesetter worked on.
//!
//! Nothing is looked up here. [`identify`] reads the file, and [`candidate`]
//! makes of what was found a candidate for import, for when nothing more can
//! be found out.

use std::io::Read;
use std::panic::{AssertUnwindSafe, catch_unwind};
use std::path::Path;
use std::sync::{Arc, Mutex, PoisonError, mpsc};
use std::time::Duration;

use pdf_extract::{Document, MediaBox, Object, OutputDev, OutputError, Transform};
use serde::Serialize;
use unicode_normalization::UnicodeNormalization;

use crate::bib::names::parse_one;
use crate::bib::parser::normalise_space;
use crate::duplicates::{normalise_doi, normalise_isbns};
use crate::error::{Error, IoContext, Result};
use crate::library::entry::Draft;
use crate::tr;

use super::Candidate;

/// A DOI or the stamp of arXiv stands at the beginning of an article.
const FIRST_PAGES: usize = 3;
/// The imprint page of a book comes after the half-title and the title page,
/// and at times after a frontispiece and a dedication as well.
const IMPRINT_PAGES: usize = 6;
/// Some publishers print the ISBN at the very end of the book.
const LAST_PAGES: usize = 2;
/// A document of fewer pages than this is not taken for a book.
const BOOK_PAGES: usize = 40;
/// How much of the text is kept for showing, in characters.
const BEGINNING: usize = 400;
/// A page whose content is larger than this, as it is stored, is a drawing,
/// and reading it for the sake of its text takes long.
const LARGEST_PAGE: usize = 4 << 20;
/// A file larger than this is not read: it is held in memory as a whole, and
/// more than once while it is taken apart.
const LARGEST_FILE: u64 = 1 << 30;
/// How long a file may take to read before it is given up.
const PATIENCE: Duration = Duration::from_secs(20);

/// What was found out about a PDF from the file itself.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PdfFacts {
    /// In the form of `duplicates::normalise_doi`: lower case, without resolver.
    pub doi: Option<String>,
    /// Each as an ISBN-13 without hyphens; those of the printed book first.
    pub isbns: Vec<String>,
    /// Without the version: `2301.01234` or `hep-th/9901001`.
    pub arxiv: Option<String>,
    /// From the metadata, when it looks like a real title.
    pub title: Option<String>,
    /// From the metadata, one name each.
    pub authors: Vec<String>,
    pub year: Option<i32>,
    /// Nought when the file could not be read: it is damaged, protected by a
    /// password, or too large.
    pub pages: usize,
    /// Whether any text could be read: a scan without a text layer has none.
    pub has_text: bool,
    /// The beginning of the text, for showing to the user, with the
    /// whitespace normalised.
    pub beginning: String,
}

/// What was read out of the file, before anything is made of it.
#[derive(Debug, Clone, Default)]
struct Raw {
    pages: usize,
    /// The text of the first pages, in order. A page without text is empty.
    first: Vec<String>,
    /// The text of the last pages of a long document.
    last: Vec<String>,
    metadata: Metadata,
}

/// What the metadata say, the XMP packet before the information dictionary,
/// which is the older of the two and the more often left as the typesetting
/// program filled it in.
#[derive(Debug, Clone, Default)]
struct Metadata {
    titles: Vec<String>,
    /// Each a name or a list of names, as it was written.
    authors: Vec<String>,
    /// Values in which an identifier may stand.
    identifiers: Vec<String>,
    /// The date of publication where the metadata tell it, then the date the
    /// file was made, which for a scan is long after.
    dates: Vec<String>,
}

// ---------------------------------------------------------------------------
// The text as it is searched
// ---------------------------------------------------------------------------

/// The text in the form in which identifiers are looked for: ligatures taken
/// apart, the many hyphens and dashes of typesetting as the plain hyphen, and
/// without the invisible characters that are set where a line may be broken.
fn searchable(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    for c in text.nfkc() {
        match c {
            '\u{ad}' | '\u{200b}'..='\u{200d}' | '\u{2060}' | '\u{feff}' | '\r' => {}
            '\u{2010}'..='\u{2015}' | '\u{2212}' => out.push('-'),
            c => out.push(c),
        }
    }
    out
}

/// Where in the text an identifier stands, for finding the year beside it.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Place {
    page: usize,
    at: usize,
    len: usize,
}

// ---------------------------------------------------------------------------
// DOIs
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, PartialEq, Eq)]
struct DoiFound {
    doi: String,
    /// The other reading of a DOI at the end of a line: with the beginning of
    /// the next line where that was not taken to belong to it, without it
    /// where it was.
    other: Option<String>,
    at: usize,
    len: usize,
    /// Introduced as a DOI: `doi:`, `DOI `, `https://doi.org/`.
    labelled: bool,
}

/// A suffix may hold any printable character. In print it ends at a space, at
/// a quotation mark, or at a character that is not ASCII, which in a DOI is
/// all but unknown and after one is common (`”`, `·`).
fn is_doi_char(c: char) -> bool {
    c.is_ascii_graphic() && c != '"'
}

/// The prefix at the beginning of `s`, as in `10.1234/`, and its length as
/// it stands there, which is greater where the end of a line divides it.
fn doi_prefix(s: &str) -> Option<(String, usize)> {
    let bytes = s.as_bytes();
    let mut prefix = String::new();
    let mut at = 0;
    while prefix.len() < 24 {
        match *bytes.get(at)? {
            b'/' => break,
            b @ (b'0'..=b'9' | b'.') => {
                prefix.push(char::from(b));
                at += 1;
            }
            b' ' | b'\t' | b'\n' if at == prefix.len() => {
                let (next, end) = over_the_line(s, at)?;
                at = end - next.len();
            }
            _ => return None,
        }
    }
    // A registrant has four digits or more, and may be subdivided: `10.1000.10/…`.
    let mut parts = prefix.strip_prefix("10.")?.split('.');
    let registrant = (4..=9).contains(&parts.next()?.len()) && parts.all(|part| !part.is_empty());
    (registrant && bytes.get(at) == Some(&b'/')).then(|| (format!("{prefix}/"), at + 1))
}

/// When nothing but the end of the line follows `at`: the first word of the
/// next line, and where it ends.
fn over_the_line(text: &str, at: usize) -> Option<(&str, usize)> {
    let rest = text[at..].trim_start_matches([' ', '\t']).strip_prefix('\n')?;
    let rest = rest.trim_start_matches([' ', '\t']);
    let start = text.len() - rest.len();
    let len = rest.find(|c: char| !is_doi_char(c)).unwrap_or(rest.len());
    (len > 0).then(|| (&text[start..start + len], start + len))
}

/// Whether a DOI that has come as far as `so_far` at the end of a line goes
/// on with `next`, the first word of the next line. It does where it could
/// not end: after the slash, a hyphen or an underscore. After a full stop it
/// does when what follows is neither the beginning of a sentence nor the
/// number of a note or a section.
fn goes_on(so_far: &str, next: &str) -> bool {
    let Some(first) = next.chars().next() else { return false };
    let lower = next.to_ascii_lowercase();
    if !first.is_ascii_alphanumeric() || lower.starts_with("doi") || lower.starts_with("http") {
        return false;
    }
    match so_far.chars().next_back() {
        None | Some('/' | '-' | '_') => true,
        Some('.') if first.is_ascii_lowercase() => next.contains(|c: char| c.is_ascii_digit() || c == '.'),
        Some('.') if first.is_ascii_digit() => trim_doi(next).len() >= 5,
        _ => false,
    }
}

/// Without what follows a DOI in running text: the punctuation of the
/// sentence, and brackets that were opened before it.
fn trim_doi(doi: &str) -> &str {
    let mut d = doi;
    while let Some(last) = d.chars().next_back() {
        let open = match last {
            '.' | ',' | ';' | ':' | '\'' | '!' | '?' => None,
            ')' => Some('('),
            ']' => Some('['),
            '}' => Some('{'),
            '>' => Some('<'),
            _ => return d,
        };
        if open.is_some_and(|open| d.matches(open).count() >= d.matches(last).count()) {
            return d;
        }
        d = &d[..d.len() - last.len_utf8()];
    }
    d
}

/// The DOI in its normal form, when there is more to it than the prefix.
fn whole_doi(prefix: &str, suffix: &str) -> Option<String> {
    let suffix = trim_doi(suffix);
    if suffix.is_empty() {
        return None;
    }
    normalise_doi(&format!("{prefix}{suffix}"))
}

/// Whether what stands before a DOI introduces it as one: `doi:`, `DOI `,
/// `https://doi.org/`, `Digital Object Identifier`.
fn is_labelled(before: &str) -> bool {
    let near: Vec<char> = before.chars().rev().take(40).collect();
    let near: String = near.into_iter().rev().collect::<String>().to_lowercase();
    near.contains("object identifier") || near.split(|c: char| !c.is_alphanumeric()).any(|word| word == "doi")
}

/// The DOIs in a text, in the order in which they stand.
fn find_dois(text: &str) -> Vec<DoiFound> {
    let mut out = Vec::new();
    let mut from = 0;
    let mut last_end = 0;
    while let Some(found) = text[from..].find("10.") {
        let at = from + found;
        from = at + 3;
        // `110.1234/5` and `3.10.1234/5` are other numbers.
        if text[..at].chars().next_back().is_some_and(|c| c.is_alphanumeric() || c == '.') {
            continue;
        }
        let Some((prefix, prefix_len)) = doi_prefix(&text[at..]) else { continue };
        let prefix = prefix.as_str();
        let rest = &text[at + prefix_len..];
        let first = rest.find(|c: char| !is_doi_char(c)).unwrap_or(rest.len());
        let mut end = at + prefix_len + first;
        let mut suffix = rest[..first].to_owned();

        // A DOI is broken like a web address, without a hyphen of division.
        let alone = suffix.clone();
        let mut other = None;
        for _ in 0..3 {
            let Some((next, next_end)) = over_the_line(text, end) else { break };
            if goes_on(&suffix, next) {
                suffix.push_str(next);
                end = next_end;
            } else {
                if suffix == alone && next.starts_with(|c: char| c.is_ascii_alphanumeric()) {
                    other = whole_doi(prefix, &format!("{alone}{next}"));
                }
                break;
            }
        }
        if suffix != alone {
            other = whole_doi(prefix, &alone);
        }

        let Some(doi) = whole_doi(prefix, &suffix) else { continue };
        let labelled = is_labelled(&text[last_end..at]);
        // A number at the end of a line and another at the beginning of the
        // next make a prefix by chance, unless they are said to be a DOI.
        if prefix_len > prefix.len() && !labelled {
            continue;
        }
        out.push(DoiFound { other: other.filter(|o| *o != doi), doi, at, len: end - at, labelled });
        from = end.max(from);
        last_end = end;
    }
    out
}

/// Headings of the list of works cited, in lower case.
const REFERENCE_HEADINGS: &[&str] = &[
    "references",
    "reference list",
    "references cited",
    "list of references",
    "references and notes",
    "bibliography",
    "select bibliography",
    "selected bibliography",
    "works cited",
    "literature cited",
    "cited literature",
    "cited works",
    "literature",
    "sources",
    "literatur",
    "literaturverzeichnis",
    "bibliographie",
    "quellen",
    "quellen und literatur",
    "références",
    "références bibliographiques",
    "bibliografia",
    "bibliografía",
    "referencias",
    "referências",
    "riferimenti bibliografici",
    "opere citate",
    "referanser",
    "referenser",
    "referencer",
    "litteratur",
    "litteraturliste",
    "kilder",
    "källor",
];

/// Where the list of works cited begins, when it has a heading of its own.
/// What follows tells of other works than the one at hand.
fn references_begin(text: &str) -> Option<usize> {
    let mut at = 0;
    for line in text.split_inclusive('\n') {
        let name = line.trim();
        if name.len() <= 48 {
            // The heading may be numbered: `7. References`.
            let name = name
                .trim_start_matches(|c: char| c.is_ascii_digit() || matches!(c, '.' | ')' | ' '))
                .trim_end_matches([':', '.', ' '])
                .to_lowercase();
            if REFERENCE_HEADINGS.contains(&name.as_str()) {
                return Some(at);
            }
        }
        at += line.len();
    }
    None
}

/// The pages as far as the list of works cited.
fn before_references<'a>(pages: &[&'a str]) -> Vec<&'a str> {
    let mut out = Vec::with_capacity(pages.len());
    let mut begun = false;
    for page in pages {
        if begun {
            out.push("");
        } else if let Some(at) = references_begin(page) {
            out.push(&page[..at]);
            begun = true;
        } else {
            out.push(page);
        }
    }
    out
}

/// The DOI of the document among those found in it.
///
/// `pages` are the pages as far as the list of works cited, `named` the DOIs
/// of the metadata. An article names the DOIs of the works it cites, and
/// its own may stand in a footer, after them. So each is weighed: standing on
/// the first page, being named in the metadata as well, and being introduced
/// as a DOI count for it, and so does standing on a later page too, as a
/// running foot does. Among equals the first wins, and what is in the text
/// before what is only in the metadata.
fn choose_doi(pages: &[&str], named: &[String]) -> Option<(String, Option<Place>)> {
    let found: Vec<(usize, DoiFound)> =
        pages.iter().enumerate().flat_map(|(page, text)| find_dois(text).into_iter().map(move |f| (page, f))).collect();

    // A DOI met whole somewhere settles how one broken by the end of a line is read.
    let whole: Vec<&str> = named
        .iter()
        .map(String::as_str)
        .chain(found.iter().filter(|(_, f)| f.other.is_none()).map(|(_, f)| f.doi.as_str()))
        .collect();

    struct Weighed {
        doi: String,
        place: Option<Place>,
        first_page: bool,
        labelled: bool,
        pages: Vec<usize>,
    }
    let mut weighed: Vec<Weighed> = Vec::new();
    for (page, f) in &found {
        let doi = match &f.other {
            Some(other) if !whole.contains(&f.doi.as_str()) && whole.contains(&other.as_str()) => other,
            _ => &f.doi,
        };
        match weighed.iter_mut().find(|w| w.doi == *doi) {
            Some(w) => {
                w.labelled |= f.labelled;
                w.first_page |= *page == 0;
                if !w.pages.contains(page) {
                    w.pages.push(*page);
                }
            }
            None => weighed.push(Weighed {
                doi: doi.clone(),
                place: Some(Place { page: *page, at: f.at, len: f.len }),
                first_page: *page == 0,
                labelled: f.labelled,
                pages: vec![*page],
            }),
        }
    }
    for doi in named {
        if !weighed.iter().any(|w| w.doi == *doi) {
            let (first_page, labelled, pages) = (false, false, Vec::new());
            weighed.push(Weighed { doi: doi.clone(), place: None, first_page, labelled, pages });
        }
    }

    let weight = |w: &Weighed| {
        3 * usize::from(w.first_page)
            + 3 * usize::from(named.contains(&w.doi))
            + 2 * usize::from(w.labelled)
            + usize::from(w.pages.len() > 1)
    };
    let mut best: Option<&Weighed> = None;
    for w in &weighed {
        if best.is_none_or(|b| weight(w) > weight(b)) {
            best = Some(w);
        }
    }
    best.map(|w| (w.doi.clone(), w.place))
}

// ---------------------------------------------------------------------------
// ISBNs
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, PartialEq, Eq)]
struct IsbnFound {
    /// As ISBN-13.
    isbn: String,
    /// Said to be that of an electronic edition.
    electronic: bool,
    at: usize,
    len: usize,
}

fn valid_isbn13(digits: &str) -> bool {
    digits.len() == 13
        && (digits.starts_with("978") || digits.starts_with("979"))
        && digits.bytes().all(|b| b.is_ascii_digit())
        && digits.bytes().enumerate().map(|(i, b)| u32::from(b - b'0') * if i % 2 == 0 { 1 } else { 3 }).sum::<u32>()
            % 10
            == 0
}

fn valid_isbn10(digits: &str) -> bool {
    digits.len() == 10
        && digits[..9].bytes().all(|b| b.is_ascii_digit())
        && digits
            .bytes()
            .enumerate()
            .map(|(i, b)| match b {
                b'0'..=b'9' => Some(u32::from(b - b'0') * (10 - i as u32)),
                b'X' if i == 9 => Some(10),
                _ => None,
            })
            .sum::<Option<u32>>()
            .is_some_and(|sum| sum % 11 == 0)
}

/// The ISBN that begins at the beginning of `s`, which is a digit, and its
/// length as written. It may be divided by hyphens or by spaces.
fn isbn_at(s: &str) -> Option<(String, usize)> {
    // The digits with the place where each ends.
    let mut digits: Vec<(char, usize)> = Vec::new();
    let mut chars = s.char_indices().peekable();
    while let Some((i, c)) = chars.next() {
        match c {
            '0'..='9' | 'X' | 'x' => digits.push((c.to_ascii_uppercase(), i + 1)),
            '-' | ' ' if chars.peek().is_some_and(|(_, n)| n.is_ascii_digit() || matches!(n, 'X' | 'x')) => {}
            _ => break,
        }
        if digits.len() > 17 {
            break;
        }
    }
    for length in [13, 10] {
        if digits.len() < length {
            continue;
        }
        let number: String = digits[..length].iter().map(|(c, _)| *c).collect();
        let end = digits[length - 1].1;
        // More digits straight on make it another number, such as an EAN with its supplement.
        let ends = !s[end..].starts_with(|c: char| c.is_ascii_digit() || c == '-');
        if ends && (valid_isbn13(&number) || valid_isbn10(&number)) {
            return normalise_isbns(&number).into_iter().next().map(|isbn| (isbn, end));
        }
    }
    None
}

/// Words by which an ISBN is said to be that of an electronic edition.
const ELECTRONIC: &[&str] =
    &["ebook", "e-book", "ebk", "electronic", "online", "pdf", "epub", "e-pub", "kindle", "mobi", "digital", "web"];

/// The ISBNs in a text: only numbers that are introduced as such (`ISBN`,
/// `ISBN-13:`, `e-ISBN`, `ISBN (print)`) and have a valid check digit, since a
/// book is full of numbers of thirteen digits and none of them say what they are.
fn find_isbns(text: &str) -> Vec<IsbnFound> {
    // Lower case of ASCII only, so that places are the same in both.
    let lower = text.to_ascii_lowercase();
    let mut out: Vec<IsbnFound> = Vec::new();
    let mut from = 0;
    // The end of what belongs to the number before.
    let mut floor = 0;
    while let Some(found) = lower[from..].find("isbn") {
        let label = from + found;
        let mut at = label + 4;
        from = at;

        // What stands before the label on its line: `e-`, `Electronic `, `PDF `.
        let line = lower[floor.min(label)..label].rsplit('\n').next().unwrap_or("");
        let mut lead: String = line.chars().rev().take(12).collect::<Vec<_>>().into_iter().rev().collect();
        let mut letters = lead.trim_end_matches('-').chars().rev();
        if letters.next() == Some('e') && !letters.next().is_some_and(char::is_alphabetic) {
            lead = "electronic".into();
        }

        let mut first = true;
        loop {
            // As far as the number: `-13`, `(print)`, `:`. A second number under the
            // same label follows the first with nothing but punctuation between.
            let rest = &lower[at..];
            let mut gap = rest.find(|c: char| c.is_ascii_digit()).unwrap_or(rest.len());
            if first && matches!(&rest[gap..], r if r.starts_with("13") || r.starts_with("10")) {
                let after = &rest[gap + 2..];
                if !after.starts_with(|c: char| c.is_ascii_digit() || c == '-') {
                    gap += 2 + after.find(|c: char| c.is_ascii_digit()).unwrap_or(after.len());
                }
            }
            let between = &rest[..gap];
            let allowed = if first {
                between.chars().count() <= 40 && between.matches('\n').count() <= 1 && !between.contains("isbn")
            } else {
                between.matches('\n').count() <= 1
                    && between.chars().all(|c| c.is_whitespace() || matches!(c, ',' | ';' | '/' | '|'))
            };
            if !allowed || gap == rest.len() {
                break;
            }
            let start = at + gap;
            let Some((isbn, len)) = isbn_at(&text[start..]) else { break };

            // What is said of it after: `(hbk)`, `(ebook)`.
            let tail = &lower[start + len..];
            let tail_len = tail
                .char_indices()
                .find(|&(i, c)| c == '\n' || c.is_ascii_digit() || i >= 30 || tail[i..].starts_with("isbn"))
                .map_or(tail.len(), |(i, _)| i);
            let said = format!("{lead} {between} {}", &tail[..tail_len]);
            let electronic = ELECTRONIC.iter().any(|word| said.contains(word));

            match out.iter_mut().find(|f| f.isbn == isbn) {
                // Named twice, it is electronic only when it is never said to be anything else.
                Some(f) => f.electronic &= electronic,
                None => out.push(IsbnFound { isbn, electronic, at: label, len: start + len - label }),
            }
            at = start + len + tail_len;
            floor = at;
            from = from.max(start + len);
            lead.clear();
            first = false;
        }
    }
    out
}

// ---------------------------------------------------------------------------
// arXiv
// ---------------------------------------------------------------------------

/// The identifier at the beginning of `s`, without its version, and the
/// length of both: `2301.01234v2`, `hep-th/9901001`, `math.AG/0601001v1`.
fn arxiv_at(s: &str) -> Option<(String, usize)> {
    let bytes = s.as_bytes();
    let digits = |from: usize| bytes[from.min(bytes.len())..].iter().take_while(|b| b.is_ascii_digit()).count();
    let len = if bytes.first().is_some_and(u8::is_ascii_digit) {
        // Year and month, then a number of four digits, or of five since 2015.
        let number = digits(5);
        let month: u32 = s.get(2..4)?.parse().ok()?;
        if digits(0) != 4 || bytes.get(4) != Some(&b'.') || !(4..=5).contains(&number) || !(1..=12).contains(&month) {
            return None;
        }
        5 + number
    } else {
        let archive = s.find(|c: char| !(c.is_ascii_alphabetic() || c == '-' || c == '.'))?;
        if archive < 2 || bytes.get(archive) != Some(&b'/') || digits(archive + 1) != 7 {
            return None;
        }
        archive + 8
    };
    let version = match bytes.get(len) {
        Some(b'v') if digits(len + 1) > 0 => 1 + digits(len + 1),
        _ => 0,
    };
    if bytes.get(len + version).is_some_and(|b| b.is_ascii_alphanumeric()) {
        return None;
    }
    Some((s[..len].to_owned(), len + version))
}

/// The identifier that arXiv stamps in the margin of the first page:
/// `arXiv:2301.01234v2 [hep-th] 3 Jan 2023`. A paper may cite others in the
/// same form, so one that is followed by its subject class in brackets, as
/// only the stamp is, is taken before the first of the others.
fn find_arxiv(text: &str) -> Option<(String, usize, usize)> {
    let lower = text.to_ascii_lowercase();
    let mut first = None;
    let mut from = 0;
    while let Some(found) = lower[from..].find("arxiv:") {
        let at = from + found;
        from = at + 6;
        let rest = text[from..].trim_start_matches(' ');
        let Some((id, len)) = arxiv_at(rest) else { continue };
        let len = text.len() - rest.len() + len - at;
        if text[at + len..].trim_start_matches(' ').starts_with('[') {
            return Some((id, at, len));
        }
        first.get_or_insert((id, at, len));
    }
    first
}

// ---------------------------------------------------------------------------
// The year
// ---------------------------------------------------------------------------

/// Printing with movable type began about 1450, and a journal may date an
/// issue to the year after the one in which it comes out.
fn plausible_year(year: i32) -> bool {
    (1450..=time::OffsetDateTime::now_utc().year() + 1).contains(&year)
}

/// Numbers of four digits that may be years, with their places.
fn years_in(text: &str) -> Vec<(usize, i32)> {
    let bytes = text.as_bytes();
    let mut out = Vec::new();
    let mut i = 0;
    while i < bytes.len() {
        if !bytes[i].is_ascii_digit() {
            i += 1;
            continue;
        }
        let run = bytes[i..].iter().take_while(|b| b.is_ascii_digit()).count();
        let before = text[..i].chars().next_back();
        let mut after = text[i + run..].chars();
        let after = (after.next(), after.next());
        // Part of a word or of a number with a decimal point is no year.
        let apart = !before.is_some_and(|c| c.is_alphanumeric() || c == '.')
            && !after.0.is_some_and(char::is_alphanumeric)
            && !(after.0 == Some('.') && after.1.is_some_and(|c| c.is_ascii_digit()));
        if run == 4
            && apart
            && let Some(year) = text[i..i + 4].parse().ok().filter(|y| plausible_year(*y))
        {
            out.push((i, year));
        }
        i += run;
    }
    out
}

/// The year of a line of copyright: `© 2019 The Authors`, `Copyright 1979 by …`,
/// `© The Classical Association 2019`.
fn copyright_year(text: &str) -> Option<i32> {
    text.lines().find_map(|line| {
        let lower = line.to_lowercase();
        let mark = ["©", "(c)", "copyright"].iter().filter_map(|m| lower.find(m)).min()?;
        years_in(&lower[mark..]).into_iter().find(|(at, _)| *at <= 80).map(|(_, year)| year)
    })
}

/// The year that stands nearest to an identifier: on its line, the line
/// before or the line after. Digits of the identifier itself do not count.
fn year_near(text: &str, at: usize, len: usize) -> Option<i32> {
    let end = (at + len).min(text.len());
    let line = text[..at].rfind('\n').unwrap_or(0);
    let from = text[..line].rfind('\n').map_or(0, |i| i + 1);
    let to = text[end..].match_indices('\n').nth(1).map_or(text.len(), |(i, _)| end + i);
    years_in(&text[from..to])
        .into_iter()
        .map(|(i, year)| (from + i, year))
        .filter(|(i, _)| i + 4 <= at || *i >= end)
        .min_by_key(|(i, _)| if *i < at { at - (i + 4) } else { i - end })
        .map(|(_, year)| year)
}

/// The year of a date of the metadata: `D:20190314120000+01'00'` in the
/// information dictionary, `2019-03-14T12:00:00Z` in XMP.
fn year_of_date(date: &str) -> Option<i32> {
    let date = date.trim();
    let date = date.strip_prefix("D:").unwrap_or(date);
    let year: String = date.chars().take_while(char::is_ascii_digit).take(4).collect();
    if year.len() == 4 {
        year.parse().ok().filter(|y| plausible_year(*y))
    } else {
        years_in(date).first().map(|(_, y)| *y)
    }
}

// ---------------------------------------------------------------------------
// Titles and authors of the metadata
// ---------------------------------------------------------------------------

/// Names of files of the programs books and articles are made with.
const FILE_ENDINGS: &[&str] = &[
    ".pdf", ".doc", ".docx", ".dot", ".rtf", ".odt", ".txt", ".indd", ".qxd", ".qxp", ".fm", ".pm6", ".p65", ".tex",
    ".dvi", ".ps", ".eps", ".wpd", ".pages", ".ppt", ".pptx", ".xls", ".xlsx", ".xml", ".htm", ".html", ".tif",
    ".tiff", ".jpg", ".jpeg", ".png", ".djvu",
];

/// What programs write where no title was given.
const NO_TITLES: &[&str] = &[
    "untitled",
    "untitled document",
    "no title",
    "title",
    "document",
    "unknown",
    "none",
    "null",
    "empty",
    "full page photo",
    "full page fax print",
    "scanned document",
    "scan",
    "slide 1",
    "powerpoint presentation",
    "microsoft word",
    "article",
    "book",
    "paper",
    "manuscript",
    "layout 1",
    "print",
    "cover",
    "front matter",
];

/// Whether a title of the metadata looks like the title of a work. It is
/// often the name of the file that was printed to PDF, a number of the
/// publisher's production, or what the program wrote for want of a title.
fn is_title(title: &str, file_name: &str) -> bool {
    let title = normalise_space(title);
    let lower = title.to_lowercase();
    let letters = title.chars().filter(|c| c.is_alphabetic()).count();
    let digits = title.chars().filter(|c| c.is_numeric()).count();
    if letters < 3 || digits > letters {
        return false;
    }
    if NO_TITLES.contains(&lower.as_str())
        || lower.starts_with("microsoft word -")
        || lower.starts_with("microsoft powerpoint -")
        || lower.starts_with("untitled")
        || FILE_ENDINGS.iter().any(|ending| lower.ends_with(ending))
    {
        return false;
    }
    // A path, a DOI, or the identifier of another kind.
    let path = title.contains(['\\', '/']) && !title.contains(' ');
    if path || lower.starts_with("doi:") || lower.starts_with("arxiv:") {
        return false;
    }
    // One word with digits or underscores is a number of production: `JCP_12345_proof`.
    if !title.contains(' ') && title.contains(|c: char| c.is_numeric() || c == '_') {
        return false;
    }
    // The name of the file itself, whatever stands for the spaces.
    let plain =
        |s: &str| -> String { s.chars().filter(|c| c.is_alphanumeric()).flat_map(char::to_lowercase).collect() };
    let stem = Path::new(file_name).file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_default();
    // A file may well be named by the title of the work, in words.
    let named_in_words = stem.contains(' ') && title.contains(' ');
    named_in_words || stem.is_empty() || plain(&stem) != plain(&title)
}

/// What stands for an author where there is none.
const NO_AUTHORS: &[&str] = &[
    "unknown",
    "anonymous",
    "author",
    "user",
    "admin",
    "administrator",
    "owner",
    "none",
    "null",
    "default",
    "pc",
    "test",
    "scanner",
    "adobe",
];

/// A given name as initials: `M. L.`, `G.`
fn is_initials(words: &str) -> bool {
    words
        .split_whitespace()
        .all(|w| w.trim_end_matches('.').chars().count() <= 1 || (w.ends_with('.') && w.chars().count() <= 3))
}

/// The names in an author of the metadata, one each.
///
/// A semicolon always separates names, and so do ` and ` and `&`. A comma
/// does in `Leonard Muellner, Gregory Nagy` but not in `Nagy, Gregory` or
/// `West, M. L.`: it is taken to separate names only when what stands on
/// each side of every comma is a full name of two words or more.
fn split_authors(value: &str) -> Vec<String> {
    let value = normalise_space(value);
    let mut out = Vec::new();
    for part in value.split(';') {
        let part = part.replace('&', " and ").replace(" AND ", " and ").replace(" und ", " and ");
        for name in part.split(" and ") {
            let parts: Vec<&str> = name.split(',').map(str::trim).collect();
            let list = parts.len() > 1 && parts.iter().all(|p| p.split_whitespace().count() >= 2 && !is_initials(p));
            if list {
                out.extend(parts.iter().map(|p| (*p).to_owned()));
            } else {
                out.push(name.trim().trim_matches(',').trim().to_owned());
            }
        }
    }
    out.retain(|name| {
        let letters = name.chars().filter(|c| c.is_alphabetic()).count();
        letters >= 2
            && !name.contains(|c: char| c.is_numeric() || c == '@')
            && !NO_AUTHORS.contains(&name.to_lowercase().as_str())
    });
    out.dedup();
    out
}

// ---------------------------------------------------------------------------
// The metadata
// ---------------------------------------------------------------------------

const DC: &str = "http://purl.org/dc/elements/1.1/";
const XMP: &str = "http://ns.adobe.com/xap/1.0/";
// Of these there are several versions, which differ in what follows.
const PRISM: &str = "http://prismstandard.org/namespaces/basic/";
const PDFX: &str = "http://ns.adobe.com/pdfx/";
const CROSSMARK: &str = "http://crossref.org/crossmark/";

fn find_last(bytes: &[u8], what: &[u8]) -> Option<usize> {
    bytes.windows(what.len()).rposition(|w| w == what)
}

/// The last XMP packet in the bytes, without the wrapper that pads it. It
/// stands in a file uncompressed, so that programs that know nothing of PDF
/// can find it, and so it can be found in a file that is damaged.
fn xmp_packet(bytes: &[u8]) -> Option<String> {
    [("<x:xmpmeta", "</x:xmpmeta>"), ("<rdf:RDF", "</rdf:RDF>")].into_iter().find_map(|(open, close)| {
        let end = find_last(bytes, close.as_bytes())?;
        let start = find_last(&bytes[..end], open.as_bytes())?;
        Some(String::from_utf8_lossy(&bytes[start..end + close.len()]).into_owned())
    })
}

/// The values of a property of an XMP packet, which may be written as an
/// attribute or as an element, and the element may hold a list.
fn xmp_values(packet: &roxmltree::Document, namespace: &str, name: &str) -> Vec<String> {
    let named = |space: Option<&str>, local: &str| {
        local.eq_ignore_ascii_case(name) && space.is_some_and(|space| space.starts_with(namespace))
    };
    let text = |node: roxmltree::Node| -> String {
        node.descendants().filter(|n| n.is_text()).filter_map(|n| n.text()).collect()
    };
    let mut out = Vec::new();
    for node in packet.descendants().filter(|n| n.is_element()) {
        out.extend(node.attributes().filter(|a| named(a.namespace(), a.name())).map(|a| a.value().to_owned()));
        if named(node.tag_name().namespace(), node.tag_name().name()) {
            let items: Vec<_> = node.descendants().filter(|n| n.is_element() && n.tag_name().name() == "li").collect();
            if items.is_empty() {
                out.push(text(node));
            } else {
                out.extend(items.into_iter().map(text));
            }
        }
    }
    out.iter().map(|value| normalise_space(value)).filter(|value| !value.is_empty()).collect()
}

/// What the XMP packet and the information dictionary say, in that order.
fn metadata(xmp: Option<&str>, information: &[(String, String)]) -> Metadata {
    let mut m = Metadata::default();
    let mut made = Vec::new();
    if let Some(packet) = xmp.and_then(|xmp| roxmltree::Document::parse(xmp).ok()) {
        m.titles = xmp_values(&packet, DC, "title");
        m.authors.push(xmp_values(&packet, DC, "creator").join("; "));
        // A description is at times the citation of the article, with its DOI.
        for (namespace, name) in
            [(PRISM, "doi"), (PDFX, "doi"), (CROSSMARK, "doi"), (DC, "identifier"), (PRISM, "url"), (DC, "description")]
        {
            m.identifiers.extend(xmp_values(&packet, namespace, name));
        }
        m.identifiers.extend(xmp_values(&packet, PRISM, "isbn").iter().map(|isbn| format!("ISBN {isbn}")));
        m.identifiers.extend(xmp_values(&packet, PRISM, "eIsbn").iter().map(|isbn| format!("e-ISBN {isbn}")));
        for (namespace, name) in
            [(PRISM, "publicationDate"), (PRISM, "coverDate"), (PRISM, "coverDisplayDate"), (DC, "date")]
        {
            m.dates.extend(xmp_values(&packet, namespace, name));
        }
        made = xmp_values(&packet, XMP, "CreateDate");
    }
    for (key, value) in information {
        let lower = key.to_lowercase();
        match key.as_str() {
            "Title" => m.titles.push(value.clone()),
            "Author" => m.authors.push(value.clone()),
            "Subject" | "Keywords" => m.identifiers.push(value.clone()),
            "CreationDate" => made.push(value.clone()),
            // Publishers add keys of their own: `doi`, `WPS-ARTICLEDOI`.
            _ if lower.contains("doi") => m.identifiers.push(value.clone()),
            _ if lower.contains("isbn") => m.identifiers.push(format!("ISBN {value}")),
            _ => {}
        }
    }
    m.dates.extend(made);
    m
}

// ---------------------------------------------------------------------------
// Reading the file
// ---------------------------------------------------------------------------

/// Gathers the text of a page as lines of words.
///
/// The library hands over the characters one by one with the place of each.
/// Its own gathering of them into text lets a heading run into the line below
/// it where the widths of the letters are not known, which hides the heading
/// of the list of works cited. Here a new line begins wherever the writing
/// moves off the line by half its height, whatever the widths are. Moves are
/// measured along the direction of writing and across it, since the stamp of
/// arXiv runs up the margin.
#[derive(Default)]
struct Lines {
    text: String,
    /// Where the last character ended.
    end: (f64, f64),
    /// The height of the last character.
    size: f64,
    /// Whether a run of characters begins: only there are spaces and lines told.
    begins: bool,
}

/// What the library is answered when it has told of a character or a page.
type Told = std::result::Result<(), OutputError>;

impl OutputDev for Lines {
    fn begin_page(&mut self, _: u32, _: &MediaBox, _: Option<(f64, f64, f64, f64)>) -> Told {
        Ok(())
    }

    fn end_page(&mut self) -> Told {
        Ok(())
    }

    fn output_character(&mut self, trm: &Transform, width: f64, _spacing: f64, font_size: f64, char: &str) -> Told {
        let stretch = trm.m11.hypot(trm.m12);
        let size = (font_size * trm.m21.hypot(trm.m22)).abs();
        let direction = if stretch > 0.0 { (trm.m11 / stretch, trm.m12 / stretch) } else { (1.0, 0.0) };
        let (x, y) = (trm.m31, trm.m32);
        if self.begins && !self.text.is_empty() {
            let (dx, dy) = (x - self.end.0, y - self.end.1);
            let along = dx * direction.0 + dy * direction.1;
            let across = (dy * direction.0 - dx * direction.1).abs();
            // Superscripts are smaller than the line they belong to.
            let height = size.max(self.size);
            if across > height * 0.5 {
                self.text.push('\n');
            } else if (along > size * 0.1 || along < -height) && !self.text.ends_with([' ', '\n']) {
                self.text.push(' ');
            }
        }
        self.text.push_str(char);
        self.begins = false;
        let advance = width * font_size.abs() * stretch;
        self.end = (x + direction.0 * advance, y + direction.1 * advance);
        self.size = size;
        Ok(())
    }

    fn begin_word(&mut self) -> Told {
        self.begins = true;
        Ok(())
    }

    fn end_word(&mut self) -> Told {
        Ok(())
    }

    fn end_line(&mut self) -> Told {
        Ok(())
    }
}

/// The text of a page, as far as it can be read. The library panics on fonts
/// and encodings it does not know; what it had read by then is kept, since
/// an identifier stands more often at the head of a page than at its foot.
fn page_text(doc: &Document, number: u32) -> String {
    let stored: usize = doc
        .get_pages()
        .get(&number)
        .map(|page| doc.get_page_contents(*page))
        .unwrap_or_default()
        .into_iter()
        .filter_map(|id| doc.get_object(id).and_then(Object::as_stream).ok())
        .map(|stream| stream.content.len())
        .sum();
    if stored > LARGEST_PAGE {
        return String::new();
    }
    let mut lines = Lines::default();
    match catch_unwind(AssertUnwindSafe(|| pdf_extract::output_doc_page(doc, &mut lines, number))) {
        Ok(Ok(())) => {}
        Ok(Err(e)) => tracing::debug!(%e, number, "a page of the PDF could not be read to its end"),
        Err(_) => tracing::debug!(number, "a page of the PDF could not be read to its end"),
    }
    lines.text
}

/// A string of the information dictionary. It is in an encoding of PDF's own
/// or in UTF-16; programs that know of neither write UTF-8.
fn text_string(object: &Object) -> Option<String> {
    let bytes = object.as_str().ok()?;
    match std::str::from_utf8(bytes) {
        Ok(text) if !bytes.is_ascii() && !bytes.starts_with(b"\xEF\xBB\xBF") => Some(text.to_owned()),
        _ => {
            let text = pdf_extract::decode_text_string(object).ok()?;
            Some(text.trim_start_matches('\u{feff}').to_owned())
        }
    }
}

fn information(doc: &Document) -> Vec<(String, String)> {
    let information = doc.trailer.get(b"Info").and_then(|o| doc.dereference(o)).and_then(|(_, o)| o.as_dict());
    let Ok(information) = information else { return Vec::new() };
    information
        .iter()
        .filter_map(|(key, value)| {
            let (_, value) = doc.dereference(value).ok()?;
            Some((String::from_utf8_lossy(key).into_owned(), text_string(value)?))
        })
        .collect()
}

/// The XMP packet that the catalogue of the document names.
fn packet(doc: &Document) -> Option<String> {
    let stream = doc.catalog().ok()?.get(b"Metadata").and_then(|o| doc.dereference(o)).ok()?.1.as_stream().ok()?;
    let bytes = match stream.filters() {
        Ok(filters) if !filters.is_empty() => stream.decompressed_content().ok()?,
        _ => stream.content.clone(),
    };
    xmp_packet(&bytes)
}

fn keep(raw: &Mutex<Raw>, change: impl FnOnce(&mut Raw)) {
    change(&mut raw.lock().unwrap_or_else(PoisonError::into_inner));
}

/// Reads what is needed and no more: the metadata, the first pages, and of a
/// long document the last. Each part is kept as soon as it is read, so that
/// what was read is there when the rest fails.
fn read_into(path: &Path, raw: &Mutex<Raw>) {
    if std::fs::metadata(path).is_ok_and(|file| file.len() > LARGEST_FILE) {
        return;
    }
    let Ok(bytes) = std::fs::read(path) else { return };
    let mut doc = match catch_unwind(|| Document::load_mem(&bytes)) {
        // One that is protected by a password is loaded without its content.
        Ok(Ok(doc)) if !doc.is_encrypted() => doc,
        _ => {
            let xmp = xmp_packet(&bytes);
            return keep(raw, |raw| raw.metadata = metadata(xmp.as_deref(), &[]));
        }
    };
    drop(bytes);

    // The pictures of a scan are most of the file and of no use here, and the
    // library would read them through in search of text.
    for object in doc.objects.values_mut() {
        if let Object::Stream(stream) = object
            && stream.dict.get(b"Subtype").and_then(Object::as_name).is_ok_and(|name| name == b"Image")
        {
            stream.content = Vec::new();
        }
    }

    let pages = doc.get_pages().len();
    let found = metadata(packet(&doc).as_deref(), &information(&doc));
    keep(raw, |raw| {
        raw.pages = pages;
        raw.metadata = found;
    });
    for number in 1..=pages.min(IMPRINT_PAGES) {
        let text = page_text(&doc, number as u32);
        keep(raw, |raw| raw.first.push(text));
    }
    if pages >= BOOK_PAGES {
        for number in pages - LAST_PAGES + 1..=pages {
            let text = page_text(&doc, number as u32);
            keep(raw, |raw| raw.last.push(text));
        }
    }
}

/// Reads the file on a thread of its own, and waits for it no longer than
/// [`PATIENCE`]. There is no other way of stopping a library that has lost
/// itself in a file: the thread is left to come to its end, and what it had
/// read when the time was up is what is known.
fn read(path: &Path) -> Raw {
    let raw = Arc::new(Mutex::new(Raw::default()));
    let (done, wait) = mpsc::channel();
    let work = {
        let raw = Arc::clone(&raw);
        let path = path.to_owned();
        move || {
            if catch_unwind(AssertUnwindSafe(|| read_into(&path, &raw))).is_err() {
                tracing::warn!(path = %path.display(), "the PDF could not be read to its end");
            }
            let _ = done.send(());
        }
    };
    // Page trees and forms within forms are read by recursion.
    match std::thread::Builder::new().name("pdf".into()).stack_size(16 << 20).spawn(work) {
        Ok(_) => {
            if wait.recv_timeout(PATIENCE).is_err() {
                tracing::warn!(path = %path.display(), "reading the PDF took too long and was given up");
            }
        }
        Err(e) => tracing::warn!(%e, "no thread could be started for reading the PDF"),
    }
    let raw = raw.lock().unwrap_or_else(PoisonError::into_inner);
    raw.clone()
}

fn file_name(path: &Path) -> String {
    path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_else(|| path.display().to_string())
}

/// Finds out what can be found out from the file itself. Nothing is looked up.
///
/// A file that is not a PDF is an error. A PDF that cannot be read, because
/// it is damaged, protected by a password or too large, is none: it has no
/// pages and no text, and can still be kept with a reference that is made by
/// hand.
pub fn identify(path: &Path) -> Result<PdfFacts> {
    let name = file_name(path);
    // The header may be preceded by what a mail program or a server put there.
    let mut head = Vec::new();
    std::fs::File::open(path)
        .and_then(|file| file.take(1024).read_to_end(&mut head))
        .context(|| tr!("io-reading", path = path))?;
    if head.is_empty() {
        return Err(Error::invalid(tr!("core-import-pdf-empty", name = &name)));
    }
    if !head.windows(5).any(|w| w == b"%PDF-") {
        return Err(Error::invalid(tr!("core-import-pdf-not-a-pdf", name = &name)));
    }
    Ok(facts(&read(path), &name))
}

// ---------------------------------------------------------------------------
// From what was read to what is known
// ---------------------------------------------------------------------------

/// The beginning of a text, for showing.
fn beginning(text: &str) -> String {
    let text = normalise_space(text);
    match text.char_indices().nth(BEGINNING) {
        Some((end, _)) => format!("{}…", text[..end].trim_end()),
        None => text,
    }
}

fn facts(raw: &Raw, file_name: &str) -> PdfFacts {
    let pages: Vec<String> = raw.first.iter().map(|p| searchable(p)).collect();
    let last: Vec<String> = raw.last.iter().map(|p| searchable(p)).collect();
    let named: Vec<String> = raw.metadata.identifiers.iter().map(|v| searchable(v)).collect();
    let isbns_of: Vec<Vec<IsbnFound>> = pages.iter().chain(&last).map(|page| find_isbns(page)).collect();

    // The work's own DOI and the stamp of arXiv stand before the works cited:
    // at the beginning of an article, and a DOI on the imprint page of a
    // book as well, which is known by its ISBN.
    let searched: Vec<&str> = pages
        .iter()
        .enumerate()
        .map(|(page, text)| if page < FIRST_PAGES || !isbns_of[page].is_empty() { text.as_str() } else { "" })
        .collect();
    let body = before_references(&searched);
    let mut named_dois: Vec<String> = Vec::new();
    for doi in named.iter().flat_map(|v| find_dois(v)).map(|f| f.doi) {
        if !named_dois.contains(&doi) {
            named_dois.push(doi);
        }
    }
    let doi = choose_doi(&body, &named_dois);
    let arxiv = body.first().and_then(|page| find_arxiv(page));

    // Of the ISBNs, those of the printed book first: it is the one that is cited.
    let isbn_place = isbns_of
        .iter()
        .take(pages.len())
        .enumerate()
        .find_map(|(page, found)| found.first().map(|f| Place { page, at: f.at, len: f.len }));
    let mut found: Vec<IsbnFound> = Vec::new();
    for f in isbns_of.into_iter().flatten().chain(named.iter().flat_map(|v| find_isbns(v))) {
        if !found.iter().any(|known| known.isbn == f.isbn) {
            found.push(f);
        }
    }
    found.sort_by_key(|f| f.electronic);
    let isbns: Vec<String> = found.into_iter().map(|f| f.isbn).collect();

    // The year: of the copyright, else beside the identifier, else of the metadata.
    let beside = [
        doi.as_ref().and_then(|(_, place)| *place),
        arxiv.as_ref().map(|(_, at, len)| Place { page: 0, at: *at, len: *len }),
        isbn_place,
    ];
    let year = searched
        .iter()
        .find_map(|page| copyright_year(page))
        .or_else(|| beside.iter().flatten().find_map(|place| year_near(&pages[place.page], place.at, place.len)))
        .or_else(|| raw.metadata.dates.iter().find_map(|date| year_of_date(date)));

    let text = raw.first.iter().find(|page| page.chars().any(char::is_alphanumeric));
    PdfFacts {
        doi: doi.map(|(doi, _)| doi),
        isbns,
        arxiv: arxiv.map(|(id, _, _)| id),
        title: raw.metadata.titles.iter().find(|t| is_title(t, file_name)).map(|t| normalise_space(t)),
        authors: raw
            .metadata
            .authors
            .iter()
            .map(|a| split_authors(a))
            .find(|names| !names.is_empty())
            .unwrap_or_default(),
        year,
        pages: raw.pages,
        has_text: text.is_some() || raw.last.iter().any(|page| page.chars().any(char::is_alphanumeric)),
        beginning: text.map(|t| beginning(t)).unwrap_or_default(),
    }
}

/// A candidate made from the facts alone, for when nothing can be looked up.
///
/// The type is `article` where there is a DOI and no ISBN, `book` where there
/// is an ISBN and either no DOI or the length of a book, and else `misc`. The
/// notes say how far the details can be trusted.
pub fn candidate(path: &Path, facts: &PdfFacts) -> Candidate {
    let entry_type = match (&facts.doi, facts.isbns.is_empty()) {
        (Some(_), true) => "article",
        (None, false) => "book",
        (Some(_), false) if facts.pages >= BOOK_PAGES => "book",
        _ => "misc",
    };
    let mut draft = Draft { entry_type: entry_type.into(), ..Default::default() };

    if let Some(title) = &facts.title {
        draft.fields.insert("title".into(), title.clone());
    }
    if !facts.authors.is_empty() {
        draft.names.insert("author".into(), facts.authors.iter().map(|name| parse_one(name)).collect());
    }
    if let Some(year) = facts.year {
        draft.fields.insert("date".into(), year.to_string());
    }
    if let Some(doi) = &facts.doi {
        draft.fields.insert("doi".into(), doi.clone());
    }
    if !facts.isbns.is_empty() {
        draft.fields.insert("isbn".into(), facts.isbns.join(", "));
    }
    if let Some(arxiv) = &facts.arxiv {
        draft.fields.insert("eprint".into(), arxiv.clone());
        draft.fields.insert("eprinttype".into(), "arxiv".into());
    }

    let mut notes = Vec::new();
    if facts.pages == 0 {
        notes.push(tr!("core-import-pdf-unreadable"));
    } else if !facts.has_text {
        notes.push(tr!("core-import-pdf-scan"));
    }
    let identified = facts.doi.is_some() || !facts.isbns.is_empty() || facts.arxiv.is_some();
    let described = facts.title.is_some() || !facts.authors.is_empty();
    notes.push(match (identified, described) {
        (true, _) => tr!("core-import-pdf-from-file"),
        (false, true) => tr!("core-import-pdf-from-metadata"),
        (false, false) => tr!("core-import-pdf-unknown"),
    });

    Candidate {
        draft,
        files: vec![std::path::absolute(path).unwrap_or_else(|_| path.to_owned()).display().to_string()],
        origin: file_name(path),
        collections: Vec::new(),
        notes,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn dois(text: &str) -> Vec<String> {
        find_dois(&searchable(text)).into_iter().map(|f| f.doi).collect()
    }

    fn isbns(text: &str) -> Vec<(String, bool)> {
        find_isbns(&searchable(text)).into_iter().map(|f| (f.isbn, f.electronic)).collect()
    }

    #[test]
    fn dois_in_running_text() {
        assert_eq!(dois("doi:10.1017/S0009838819000235."), vec!["10.1017/s0009838819000235"]);
        assert_eq!(dois("(see https://doi.org/10.2307/j.ctt7s1q4), and"), vec!["10.2307/j.ctt7s1q4"]);
        assert_eq!(dois("<https://doi.org/10.1000/182>; [doi:10.1000/183]."), vec!["10.1000/182", "10.1000/183"]);
        // Brackets of the DOI itself stay, the one opened before it goes.
        assert_eq!(dois("(DOI 10.1016/S0021-9991(03)00324-5)."), vec!["10.1016/s0021-9991(03)00324-5"]);
        assert_eq!(
            dois("10.1002/(SICI)1099-050X(199823/24)37:3/4<197::AID-HRM2>3.0.CO;2-#"),
            vec!["10.1002/(sici)1099-050x(199823/24)37:3/4<197::aid-hrm2>3.0.co;2-#"]
        );
        // Hyphens as they are typeset, and a quotation mark after.
        assert_eq!(dois("“10.1007/s11229‐019‑02345–6”"), vec!["10.1007/s11229-019-02345-6"]);
        assert_eq!(dois("A subdivided registrant: 10.1000.10/abc"), vec!["10.1000.10/abc"]);
        // Other numbers.
        assert!(dois("version 10.5, 110.1234/5, 3.10.1234/5, 10.12/34, 10.1234 /5, p. 10.1017").is_empty());
        assert!(dois("https://doi.org/10.1017/ and no more").is_empty());
    }

    #[test]
    fn dois_broken_by_the_line() {
        assert_eq!(dois("https://doi.org/10.2307/\n632637\n"), vec!["10.2307/632637"]);
        assert_eq!(dois("DOI 10.1007/s11229-\n019-02345-6 Published"), vec!["10.1007/s11229-019-02345-6"]);
        assert_eq!(dois("doi:10.1016/j.\ncognition.2008.06.007"), vec!["10.1016/j.cognition.2008.06.007"]);
        assert_eq!(dois("doi:10.1080/\n  00000000.2019.\n1234567."), vec!["10.1080/00000000.2019.1234567"]);
        // The end of a sentence at the end of a line.
        assert_eq!(dois("see doi:10.1000/182.\nThe next sentence"), vec!["10.1000/182"]);
        assert_eq!(dois("see doi:10.1000/182.\n2 Method"), vec!["10.1000/182"]);
        assert_eq!(dois("doi:10.1000/abc-\ndoi:10.1000/def"), vec!["10.1000/abc-", "10.1000/def"]);
        // Within the prefix.
        assert_eq!(dois("https://doi.org/10.\n1017/S0009838819000235"), vec!["10.1017/s0009838819000235"]);
        assert_eq!(dois("https://doi.org/10.1017 \n /\nS0009838819000235"), vec!["10.1017/s0009838819000235"]);
        assert!(dois("as in version 10.\n2019/2020 was the season").is_empty());
        assert!(dois("doi:10.\n1017\n/S0009838819000235").is_empty(), "broken twice within the prefix");

        // Broken where nothing shows it: both readings are kept.
        let found = find_dois("doi:10.1017/S00098388\n19000235 and");
        assert_eq!(found[0].doi, "10.1017/s00098388");
        assert_eq!(found[0].other.as_deref(), Some("10.1017/s0009838819000235"));
        let found = find_dois("doi:10.2307/\n632637");
        assert_eq!(found[0].other, None, "the prefix alone is no DOI");
        let found = find_dois("doi:10.1007/s11229-\n019-02345-6");
        assert_eq!(found[0].other.as_deref(), Some("10.1007/s11229-"));
    }

    #[test]
    fn dois_introduced_as_such() {
        let found =
            find_dois("DOI: 10.1000/1 and 10.1000/2, https://doi.org/10.1000/3 Digital Object Identifier 10.1000/4");
        assert_eq!(found.iter().map(|f| f.labelled).collect::<Vec<_>>(), vec![true, false, true, true]);
        assert_eq!((found[0].at, found[0].len), (5, 9));
        let found = find_dois("DOI\n10.1000/1 without doing so: 10.1000/2 dx.doi.org/10.1000/3");
        assert_eq!(found.iter().map(|f| f.labelled).collect::<Vec<_>>(), vec![true, false, true]);
    }

    #[test]
    fn the_list_of_works_cited() {
        assert_eq!(references_begin("text\nReferences\nLord 1960"), Some(5));
        assert_eq!(references_begin("text\n 7. REFERENCES \nLord 1960"), Some(5));
        assert_eq!(references_begin("Literaturverzeichnis:\nLord 1960"), Some(0));
        assert_eq!(references_begin("The references are given below\nLord 1960"), None);
        assert_eq!(references_begin("References 345\n"), None, "a line of the table of contents");
        assert_eq!(before_references(&["one\nWorks Cited\ntwo", "three"]), vec!["one\n", ""]);
    }

    #[test]
    fn the_doi_of_the_document() {
        let choose = |pages: &[&str], named: &[&str]| {
            let pages: Vec<String> = pages.iter().map(|p| searchable(p)).collect();
            let pages: Vec<&str> = pages.iter().map(String::as_str).collect();
            let named: Vec<String> = named.iter().map(|n| (*n).to_owned()).collect();
            choose_doi(&before_references(&pages), &named).map(|(doi, _)| doi)
        };

        // Its own on the first page, those of others in the list of references.
        let first = "Classical Quarterly 69.1 (2019) 1–15 doi:10.1017/S0009838819000235\nThe Wrath of Achilles";
        let second = "as was shown.\nReferences\nLord 1960. https://doi.org/10.4159/9780674033047.\nWest 1988. doi:10.2307/632637";
        assert_eq!(choose(&[first, second], &[]).as_deref(), Some("10.1017/s0009838819000235"));

        // Nothing but the list of references holds a DOI.
        assert_eq!(choose(&["A Note on Wrath\nReferences\nWest 1988. doi:10.2307/632637"], &[]), None);

        // A work cited in the first note, and the article's own DOI in the footer after it.
        let first = "1 See West, https://doi.org/10.2307/632637.\n© 2019 https://doi.org/10.1017/S0009838819000235";
        assert_eq!(choose(&[first], &[]).as_deref(), Some("10.2307/632637"), "nothing tells them apart");
        assert_eq!(choose(&[first], &["10.1017/s0009838819000235"]).as_deref(), Some("10.1017/s0009838819000235"));
        let second = "running text\nhttps://doi.org/10.1017/S0009838819000235";
        assert_eq!(choose(&[first, second], &[]).as_deref(), Some("10.1017/s0009838819000235"), "the running foot");

        // Introduced as a DOI before one that is not.
        assert_eq!(choose(&["Cf. 10.1000/1.\nDOI: 10.1000/2"], &[]).as_deref(), Some("10.1000/2"));
        // The first page before the second, the text before the metadata alone.
        assert_eq!(choose(&["10.1000/1", "doi:10.1000/2"], &[]).as_deref(), Some("10.1000/1"));
        assert_eq!(choose(&["doi:10.1000/1"], &["10.1000/2"]).as_deref(), Some("10.1000/1"));
        assert_eq!(choose(&["no identifier", "doi:10.1000/1"], &["10.1000/2"]).as_deref(), Some("10.1000/2"));
        assert_eq!(choose(&["no identifier"], &["10.1000/2"]).as_deref(), Some("10.1000/2"));

        // Broken by the line where nothing shows it, and whole in the metadata or on the next page.
        let broken = "doi:10.1017/S00098388\n19000235 and";
        assert_eq!(choose(&[broken], &[]).as_deref(), Some("10.1017/s00098388"));
        assert_eq!(choose(&[broken], &["10.1017/s0009838819000235"]).as_deref(), Some("10.1017/s0009838819000235"));
        assert_eq!(
            choose(&[broken, "doi:10.1017/S0009838819000235 x"], &[]).as_deref(),
            Some("10.1017/s0009838819000235")
        );
        // Joined where the next line did not belong to it.
        let joined = "doi:10.1000/182.\n12345 Berlin";
        assert_eq!(choose(&[joined], &[]).as_deref(), Some("10.1000/182.12345"));
        assert_eq!(choose(&[joined], &["10.1000/182"]).as_deref(), Some("10.1000/182"));
    }

    #[test]
    fn isbns_introduced_as_such() {
        assert_eq!(isbns("ISBN 978-0-8018-2388-6"), vec![("9780801823886".to_owned(), false)]);
        assert_eq!(isbns("ISBN 0-8018-2388-9 (pbk.)"), vec![("9780801823886".to_owned(), false)]);
        assert_eq!(isbns("isbn: 080442957X"), vec![("9780804429573".to_owned(), false)]);
        assert_eq!(isbns("ISBN-13: 978-0-8018-2388-6"), vec![("9780801823886".to_owned(), false)]);
        assert_eq!(isbns("ISBN 13: 978 0 8018 2388 6"), vec![("9780801823886".to_owned(), false)]);
        assert_eq!(isbns("ISBN-10 0-8018-2388-9"), vec![("9780801823886".to_owned(), false)]);
        assert_eq!(isbns("ISBN‐13 978‐0‐8018‐2388‐6"), vec![("9780801823886".to_owned(), false)]);
        assert_eq!(isbns("ISBN (print): 978-0-8018-2388-6"), vec![("9780801823886".to_owned(), false)]);
        assert_eq!(isbns("ISBN\n978-0-8018-2388-6"), vec![("9780801823886".to_owned(), false)]);

        // Not introduced, a wrong check digit, another number.
        assert!(isbns("9780801823886, 978-0-8018-2388-6").is_empty());
        assert!(isbns("ISBN 978-0-8018-2388-5").is_empty());
        assert!(isbns("ISBN 0-8018-2388-8").is_empty());
        assert!(isbns("ISBN 12345").is_empty());
        assert!(isbns("ISBN 978-0-8018-2388-61").is_empty());
        assert!(isbns("The ISBN is an identifier of books. In 2019 there were 9780801823886.").is_empty());
    }

    #[test]
    fn isbns_of_print_and_of_screen() {
        let electronic = |text: &str| isbns(text).into_iter().map(|(_, e)| e).collect::<Vec<_>>();
        assert_eq!(electronic("e-ISBN 978-0-8018-2388-6"), vec![true]);
        assert_eq!(electronic("eISBN: 978-0-8018-2388-6"), vec![true]);
        assert_eq!(electronic("E-ISBN-13: 978-0-8018-2388-6"), vec![true]);
        assert_eq!(electronic("Electronic ISBN 978-0-8018-2388-6"), vec![true]);
        assert_eq!(electronic("ISBN (eBook) 978-0-8018-2388-6"), vec![true]);
        assert_eq!(electronic("ISBN 978-0-8018-2388-6 (PDF)"), vec![true]);
        assert_eq!(electronic("ISBN 978-0-8018-2388-6 (hardback)"), vec![false]);
        assert_eq!(electronic("The ISBN 978-0-8018-2388-6"), vec![false], "the e of another word");

        // What is said after one number is not said of the next.
        assert_eq!(
            isbns("ISBN 978-0-8044-2957-3 (ebook) ISBN 978-0-8018-2388-6 (print)"),
            vec![("9780804429573".to_owned(), true), ("9780801823886".to_owned(), false)]
        );
        // Several under one label.
        assert_eq!(
            isbns("ISBN 978-0-8018-2388-6 (hbk); 978-0-8044-2957-3 (ebk)\nLCCN 2019012345"),
            vec![("9780801823886".to_owned(), false), ("9780804429573".to_owned(), true)]
        );
        assert_eq!(isbns("ISBN 978-0-8018-2388-6\nISSN 1234-5678\nOrder no. 0804429570").len(), 1);
        // Named twice, once with the word.
        assert_eq!(
            isbns("ISBN 978-0-8018-2388-6 (online)\nISBN 978-0-8018-2388-6"),
            vec![("9780801823886".to_owned(), false)]
        );
    }

    #[test]
    fn the_stamp_of_arxiv() {
        let arxiv = |text: &str| find_arxiv(&searchable(text)).map(|(id, _, _)| id);
        assert_eq!(arxiv("arXiv:2301.01234v2 [hep-th] 3 Jan 2023").as_deref(), Some("2301.01234"));
        assert_eq!(arxiv("arXiv:hep-th/9901001v3  10 May 1999").as_deref(), Some("hep-th/9901001"));
        assert_eq!(arxiv("arXiv:math.AG/0601001v1 [math.AG]").as_deref(), Some("math.AG/0601001"));
        assert_eq!(arxiv("USA.arXiv:1706.03762v5  [cs.CL]  6 Dec 2017").as_deref(), Some("1706.03762"));
        assert_eq!(arxiv("arXiv: 0704.0001").as_deref(), Some("0704.0001"));
        // The stamp before a paper that is cited.
        assert_eq!(
            arxiv("See arXiv:1706.03762.\narXiv:2301.01234v2 [cs.CL] 3 Jan 2023").as_deref(),
            Some("2301.01234")
        );
        assert_eq!(arxiv("See arXiv:1706.03762.").as_deref(), Some("1706.03762"));
        for not in [
            "arXiv:2313.01234",
            "arXiv:2301.012",
            "arXiv:2301.0123456",
            "arXiv:hep-th/99010",
            "arXiv:1234",
            "the arXiv",
        ] {
            assert_eq!(arxiv(not), None, "{not}");
        }
        let (_, at, len) = find_arxiv("x arXiv:2301.01234v2 [hep-th]").unwrap();
        assert_eq!((at, len), (2, 18));
    }

    #[test]
    fn years() {
        let years = |text: &str| years_in(text).into_iter().map(|(_, y)| y).collect::<Vec<_>>();
        assert_eq!(years("(2019) 1-15, 14/03/2018; 2017-03-14. In 1979."), vec![2019, 2018, 2017, 1979]);
        assert!(years("12345, 0123, 1200, 2999, a2019, 2019b, 3.2019, 2019.5").is_empty());

        assert_eq!(copyright_year("All rights reserved\n© The Classical Association 2019. Published"), Some(2019));
        assert_eq!(copyright_year("Copyright © 1979 by The Johns Hopkins University Press"), Some(1979));
        assert_eq!(copyright_year("(c) 2003, 2005 the authors"), Some(2003));
        assert_eq!(copyright_year("First published 1979"), None);

        let text =
            "Received 1 May 2018\nClassical Quarterly 69.1 (2019) 1-15 doi:10.1017/S0009838819000235\nPublished 2020";
        let f = &find_dois(text)[0];
        assert_eq!(year_near(text, f.at, f.len), Some(2019));
        let text = "doi:10.1016/j.jml.2019.104038";
        assert_eq!(year_near(text, 4, text.len() - 4), None, "the digits of the identifier itself");
        let text = "far away 1999\n\n\narXiv:2301.01234v2 [hep-th] 3 Jan 2023";
        let (_, at, len) = find_arxiv(text).unwrap();
        assert_eq!(year_near(text, at, len), Some(2023));

        assert_eq!(year_of_date("D:20190314120000+01'00'"), Some(2019));
        assert_eq!(year_of_date("2019-03-14T12:00:00Z"), Some(2019));
        assert_eq!(year_of_date("March 2019"), Some(2019));
        assert_eq!(year_of_date("D:00000101000000Z"), None);
        assert_eq!(year_of_date(""), None);
    }

    #[test]
    fn titles_that_are_none() {
        for title in [
            "The Wrath of Achilles Reconsidered",
            "Ὁμηρικὰ μεγαθέματα",
            "Introduction",
            "1984",
            "Homer's Iliad, Book 24",
            "The Rise of the Greek Epic, 1100–700 B.C.",
        ] {
            assert_eq!(is_title(title, "download.pdf"), title != "1984", "{title}");
        }
        for title in [
            "",
            "  ",
            "untitled",
            "Untitled-1",
            "Untitled Document",
            "Microsoft Word - draft3.docx",
            "Microsoft Word - Wrath of Achilles final",
            "wrath_final.pdf",
            "Chapter 3.indd",
            "paper.tex",
            "thesis.DOC",
            "C:\\Users\\me\\paper",
            "/home/me/paper",
            "ab",
            "12345",
            "0009838819000235",
            "JCP_12345_proof",
            "s11229-019-02345-6",
            "10.1017/S0009838819000235",
            "doi:10.1017/S0009838819000235",
            "LRP-2019-0012 1..15",
            "Full page photo",
        ] {
            assert!(!is_title(title, "download.pdf"), "{title}");
        }
        // The name of the file, unless the file is named by the title in words.
        assert!(!is_title("muellner-nagy-2019", "muellner-nagy-2019.pdf"));
        assert!(!is_title("Wrath final", "wrath_final.pdf"));
        assert!(is_title("The Wrath of Achilles", "The Wrath of Achilles.pdf"));
    }

    #[test]
    fn authors_of_the_metadata() {
        assert_eq!(split_authors("Leonard Muellner, Gregory Nagy"), vec!["Leonard Muellner", "Gregory Nagy"]);
        assert_eq!(split_authors("Nagy, Gregory"), vec!["Nagy, Gregory"]);
        assert_eq!(split_authors("West, M. L."), vec!["West, M. L."]);
        assert_eq!(split_authors("de la Fontaine, Jean"), vec!["de la Fontaine, Jean"]);
        assert_eq!(split_authors("Muellner, Leonard; Nagy, Gregory;"), vec!["Muellner, Leonard", "Nagy, Gregory"]);
        assert_eq!(split_authors("Muellner, Leonard and Nagy, Gregory"), vec!["Muellner, Leonard", "Nagy, Gregory"]);
        assert_eq!(split_authors("Leonard Muellner & Gregory Nagy"), vec!["Leonard Muellner", "Gregory Nagy"]);
        assert_eq!(
            split_authors("M. L. West, Gregory Nagy and Albert B. Lord"),
            vec!["M. L. West", "Gregory Nagy", "Albert B. Lord"]
        );
        assert_eq!(split_authors("Sandy Anderson"), vec!["Sandy Anderson"]);
        assert_eq!(split_authors("Homer"), vec!["Homer"]);
        for none in ["", " ", "Unknown", "user", "Administrator", "x", "user01", "me@example.org"] {
            assert!(split_authors(none).is_empty(), "{none}");
        }
    }

    fn raw(first: &[&str]) -> Raw {
        Raw { pages: first.len(), first: first.iter().map(|p| (*p).to_owned()).collect(), ..Default::default() }
    }

    #[test]
    fn an_article_from_its_text() {
        let mut raw = raw(&[
            "Classical Quarterly 69.1 (2019) 1–15  doi:10.1017/S0009838819000235\nThe  Wrath of Achilles\n© The Classical Association 2020",
            "References\nWest 1988. doi:10.2307/632637",
        ]);
        raw.metadata.titles = vec!["CAQ1900023 1..15".into(), "Microsoft Word - wrath.docx".into()];
        raw.metadata.authors = vec!["".into(), "Leonard Muellner, Gregory Nagy".into()];
        raw.metadata.dates = vec!["D:20210102".into()];
        let f = facts(&raw, "wrath.pdf");
        assert_eq!(f.doi.as_deref(), Some("10.1017/s0009838819000235"));
        assert_eq!(f.title, None);
        assert_eq!(f.authors, vec!["Leonard Muellner", "Gregory Nagy"]);
        assert_eq!(f.year, Some(2020), "the copyright before what stands beside the DOI");
        assert!(f.has_text);
        assert!(
            f.beginning.starts_with("Classical Quarterly 69.1 (2019) 1–15 doi:10.1017/S0009838819000235 The Wrath")
        );

        let c = candidate(Path::new("/tmp/wrath.pdf"), &f);
        assert_eq!(c.draft.entry_type, "article");
        assert_eq!(c.draft.get("doi"), Some("10.1017/s0009838819000235"));
        assert_eq!(c.draft.get("date"), Some("2020"));
        assert_eq!(c.draft.get("title"), None);
        assert_eq!(c.draft.names["author"][1].family, "Nagy");
        assert_eq!(c.files, vec!["/tmp/wrath.pdf"]);
        assert_eq!(c.origin, "wrath.pdf");
        assert_eq!(c.notes.len(), 1);
    }

    #[test]
    fn a_book_from_its_imprint_and_its_metadata() {
        let mut pages = vec![""; 5];
        pages[0] = "The Best of the Achaeans";
        pages[3] = "First published 1979\nReprinted 1999\ne-ISBN 978-0-8044-2957-3\nISBN 978-0-8018-2388-6 (pbk.)";
        pages[4] = "as Lord has shown (doi:10.4159/9780674033047)";
        let mut raw = raw(&pages);
        raw.pages = 412;
        raw.last = vec!["".into(), "ISBN 0-8018-2388-9\nBaltimore".into()];
        raw.metadata.identifiers = vec!["urn:isbn:9780801823886".into(), "ISBN 978-0-306-40615-7".into()];
        raw.metadata.titles = vec!["The Best of the Achaeans".into()];
        raw.metadata.dates = vec!["2012".into()];
        let f = facts(&raw, "nagy.pdf");
        assert_eq!(f.isbns, vec!["9780801823886", "9780306406157", "9780804429573"]);
        assert_eq!(f.doi, None, "a DOI on the fifth page is that of a work cited");
        assert_eq!(f.year, Some(1999), "beside the ISBN, for want of a line of copyright");
        assert_eq!(f.beginning, "The Best of the Achaeans");

        let c = candidate(Path::new("nagy.pdf"), &f);
        assert_eq!(c.draft.entry_type, "book");
        assert_eq!(c.draft.get("isbn"), Some("9780801823886, 9780306406157, 9780804429573"));
        assert_eq!(c.draft.get("title"), Some("The Best of the Achaeans"));
        assert!(Path::new(&c.files[0]).is_absolute());

        // The DOI of a book stands on its imprint page, beside the ISBN.
        raw.first[3].push_str("\nDOI: 10.1353/book.72120");
        let f = facts(&raw, "nagy.pdf");
        assert_eq!(f.doi.as_deref(), Some("10.1353/book.72120"));
        assert_eq!(candidate(Path::new("nagy.pdf"), &f).draft.entry_type, "book");
    }

    #[test]
    fn what_the_notes_say() {
        let note = |facts: &PdfFacts| candidate(Path::new("/tmp/x.pdf"), facts).notes.join(" ");
        let mut f = PdfFacts { pages: 3, has_text: true, ..Default::default() };
        assert!(note(&f).starts_with("No DOI or ISBN was found in the file, and its metadata do not say"));
        assert_eq!(candidate(Path::new("/tmp/x.pdf"), &f).draft.entry_type, "misc");
        f.title = Some("The Wrath of Achilles".into());
        assert_eq!(
            note(&f),
            "No DOI or ISBN was found in the file; the details are from the file's own metadata and should be checked."
        );
        f.has_text = false;
        assert!(note(&f).starts_with("The file has no text layer: it is a scan. No DOI or ISBN"));
        f.arxiv = Some("2301.01234".into());
        let c = candidate(Path::new("/tmp/x.pdf"), &f);
        assert_eq!((c.draft.get("eprint"), c.draft.get("eprinttype")), (Some("2301.01234"), Some("arxiv")));
        assert_eq!(c.draft.entry_type, "misc");
        assert!(note(&PdfFacts::default()).starts_with("The file could not be read"));

        // A chapter has the DOI of its own and the ISBN of the book.
        let mut f = PdfFacts {
            pages: 22,
            doi: Some("10.1000/1".into()),
            isbns: vec!["9780801823886".into()],
            ..Default::default()
        };
        assert_eq!(candidate(Path::new("x.pdf"), &f).draft.entry_type, "misc");
        f.pages = 300;
        assert_eq!(candidate(Path::new("x.pdf"), &f).draft.entry_type, "book");
    }

    #[test]
    fn what_the_metadata_say() {
        let xmp = r#"<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:prism="http://prismstandard.org/namespaces/basic/2.1/"
      xmlns:xmp="http://ns.adobe.com/xap/1.0/"
      xmlns:pdfx="http://ns.adobe.com/pdfx/1.3/"
      prism:doi="10.1017/S0009838819000235"
      xmp:CreateDate="2021-01-02T10:00:00Z">
   <dc:title><rdf:Alt><rdf:li xml:lang="x-default">The Wrath of
      Achilles &amp; Its Aftermath</rdf:li></rdf:Alt></dc:title>
   <dc:creator><rdf:Seq><rdf:li>Muellner, Leonard</rdf:li><rdf:li>Gregory Nagy</rdf:li></rdf:Seq></dc:creator>
   <dc:identifier>urn:isbn:978-0-8018-2388-6</dc:identifier>
   <prism:coverDisplayDate>March 2019</prism:coverDisplayDate>
   <pdfx:doi>10.1017/S0009838819000235</pdfx:doi>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>"#;
        let packet = xmp_packet(format!("%PDF-1.7\nstream\n{xmp}\nendstream").as_bytes()).unwrap();
        assert!(packet.starts_with("<x:xmpmeta") && packet.ends_with("</x:xmpmeta>"));
        let information = [
            ("Title".to_owned(), "CAQ1900023 1..15".to_owned()),
            ("Author".to_owned(), "user".to_owned()),
            ("Subject".to_owned(), "Classical Quarterly 2019.69:1-15 doi:10.1017/S0009838819000235".to_owned()),
            ("CreationDate".to_owned(), "D:20181224093000Z".to_owned()),
            ("WPS-ARTICLEDOI".to_owned(), "10.1111/j.1467-9280.2009.02276.x".to_owned()),
        ];
        let m = metadata(Some(&packet), &information);
        assert_eq!(m.titles, vec!["The Wrath of Achilles & Its Aftermath", "CAQ1900023 1..15"]);
        assert_eq!(m.authors, vec!["Muellner, Leonard; Gregory Nagy", "user"]);
        assert_eq!(m.dates, vec!["March 2019", "2021-01-02T10:00:00Z", "D:20181224093000Z"]);
        assert_eq!(m.identifiers.len(), 5, "{:?}", m.identifiers);

        let f = facts(&Raw { pages: 15, first: vec!["The Wrath".into()], metadata: m, ..Default::default() }, "x.pdf");
        assert_eq!(f.doi.as_deref(), Some("10.1017/s0009838819000235"));
        assert_eq!(f.isbns, vec!["9780801823886"]);
        assert_eq!(f.title.as_deref(), Some("The Wrath of Achilles & Its Aftermath"));
        assert_eq!(f.authors, vec!["Muellner, Leonard", "Gregory Nagy"]);
        assert_eq!(f.year, Some(2019));

        // A packet that is not XML leaves the information dictionary.
        let m = metadata(Some("<x:xmpmeta><rdf:RDF></x:xmpmeta>"), &information);
        assert_eq!(m.titles, vec!["CAQ1900023 1..15"]);
        assert_eq!(metadata(None, &[]).titles.len(), 0);
    }

    #[test]
    fn what_is_not_a_pdf() {
        let tmp = tempfile::tempdir().unwrap();
        let write = |name: &str, bytes: &[u8]| {
            let path = tmp.path().join(name);
            std::fs::write(&path, bytes).unwrap();
            path
        };

        let e = identify(&write("notes.pdf", b"These are notes, not a PDF.\n")).unwrap_err();
        assert_eq!(e.kind(), "invalid");
        assert_eq!(e.to_string(), "The file “notes.pdf” is not a PDF.");
        let e = identify(&write("page.pdf", b"<!DOCTYPE html><html><body>Access denied</body></html>")).unwrap_err();
        assert_eq!(e.kind(), "invalid");
        let e = identify(&write("empty.pdf", b"")).unwrap_err();
        assert_eq!((e.kind(), e.to_string().as_str()), ("invalid", "The file “empty.pdf” is empty."));
        assert_eq!(identify(&tmp.path().join("missing.pdf")).unwrap_err().kind(), "io");
    }

    #[test]
    fn a_damaged_pdf() {
        let tmp = tempfile::tempdir().unwrap();
        let path = tmp.path().join("damaged.pdf");
        std::fs::write(&path, b"%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\nand then nothing")
            .unwrap();
        let f = identify(&path).unwrap();
        assert_eq!(f, PdfFacts::default());
        let c = candidate(&path, &f);
        assert_eq!(c.notes[0], "The file could not be read: it is damaged, protected by a password, or too large.");
        assert_eq!(c.files, vec![path.display().to_string()]);
        assert_eq!(c.draft.entry_type, "misc");

        // The packet of metadata is found even so.
        let packet = r#"<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
            <rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:prism="http://prismstandard.org/namespaces/basic/3.0/">
            <dc:title>The Wrath of Achilles</dc:title><prism:doi>10.1017/S0009838819000235</prism:doi>
            </rdf:Description></rdf:RDF></x:xmpmeta>"#;
        std::fs::write(
            &path,
            format!("%PDF-1.7\n5 0 obj\n<< /Type /Metadata >>\nstream\n{packet}\nendstream\nendobj\n"),
        )
        .unwrap();
        let f = identify(&path).unwrap();
        assert_eq!(f.doi.as_deref(), Some("10.1017/s0009838819000235"));
        assert_eq!(f.title.as_deref(), Some("The Wrath of Achilles"));
        assert_eq!((f.pages, f.has_text), (0, false));
    }

    /// Makes a PDF of Typst source. Nothing, when Typst is not installed: the
    /// tests that need it are then passed over.
    fn typeset(dir: &Path, name: &str, source: &str) -> Option<std::path::PathBuf> {
        let input = dir.join(format!("{name}.typ"));
        let output = dir.join(format!("{name}.pdf"));
        std::fs::write(&input, source).unwrap();
        match std::process::Command::new("typst").arg("compile").arg(&input).arg(&output).output() {
            Ok(run) => {
                assert!(run.status.success(), "{}", String::from_utf8_lossy(&run.stderr));
                Some(output)
            }
            Err(_) => {
                eprintln!("Typst is not installed; the test is passed over");
                None
            }
        }
    }

    const ARTICLE: &str = r#"
#set document(title: "The Wrath of Achilles Reconsidered", author: ("Leonard Muellner", "Gregory Nagy"), date: datetime(year: 2019, month: 3, day: 14))
#set page(width: 170mm, height: 240mm, margin: 20mm)
#set text(size: 10pt)
#set par(justify: true)

#text(size: 8pt)[Classical Quarterly 69.1 (2019) 1--15 #h(1fr) doi:10.1017/S0009838819000235]

#v(1cm)
#align(center, text(size: 16pt, weight: "bold")[The Wrath of Achilles Reconsidered])
#align(center)[Leonard Muellner and Gregory Nagy]

The wrath of Achilles is the subject of the Iliad.#footnote[See #link("https://doi.org/10.2307/j.ctt7s1q4").] #lorem(200)

#text(size: 8pt)[© The Classical Association 2019. Published by Cambridge University Press.]

#pagebreak()
#lorem(100)

== References

Lord, A. B. 1960. _The Singer of Tales_. Cambridge, MA. https://doi.org/10.4159/9780674033047.

Nagy, G. 1979. _The Best of the Achaeans_. Baltimore. doi:10.1353/book.72120

West, M. L. 1988. 'The Rise of the Greek Epic', _JHS_ 108: 151--72. https://doi.org/10.2307/632637
"#;

    #[test]
    fn an_article_and_the_works_it_cites() {
        let tmp = tempfile::tempdir().unwrap();
        let Some(path) = typeset(tmp.path(), "muellner", ARTICLE) else { return };
        let f = identify(&path).unwrap();
        assert_eq!(f.doi.as_deref(), Some("10.1017/s0009838819000235"));
        assert_eq!(f.title.as_deref(), Some("The Wrath of Achilles Reconsidered"));
        assert_eq!(f.authors, vec!["Leonard Muellner", "Gregory Nagy"]);
        assert_eq!(f.year, Some(2019));
        assert_eq!(f.pages, 2);
        assert!(f.has_text);
        assert!(f.isbns.is_empty() && f.arxiv.is_none());
        assert!(
            f.beginning.starts_with("Classical Quarterly 69.1 (2019) 1–15 doi:10.1017/S0009838819000235 The Wrath"),
            "{}",
            f.beginning
        );
        assert!(f.beginning.chars().count() <= BEGINNING + 1);

        let c = candidate(&path, &f);
        assert_eq!(c.draft.entry_type, "article");
        assert_eq!(c.draft.get("title"), Some("The Wrath of Achilles Reconsidered"));
        assert_eq!(c.draft.get("date"), Some("2019"));
        assert_eq!(c.draft.names["author"][0], crate::bib::names::Person::new("Muellner", "Leonard"));
        assert_eq!(c.files, vec![path.display().to_string()]);
        assert_eq!(c.origin, "muellner.pdf");

        // The same without a DOI of its own: those of the works cited are not taken for it.
        let own = "doi:10.1017/S0009838819000235";
        let cited_in_a_note = r#"#footnote[See #link("https://doi.org/10.2307/j.ctt7s1q4").]"#;
        let source = ARTICLE.replace(own, "").replace(cited_in_a_note, "");
        let Some(path) = typeset(tmp.path(), "without", &source) else { return };
        let f = identify(&path).unwrap();
        assert_eq!(f.doi, None);
        assert_eq!(f.year, Some(2019));
        let c = candidate(&path, &f);
        assert_eq!(c.draft.entry_type, "misc");
        assert_eq!(
            c.notes,
            vec![
                "No DOI or ISBN was found in the file; the details are from the file's own metadata and should be checked."
            ]
        );
    }

    #[test]
    fn a_doi_broken_by_the_line() {
        let tmp = tempfile::tempdir().unwrap();
        let source = r##"
#set page(width: 80mm, height: 120mm, margin: 10mm)
A Note on the Wrath

Published online: #"https://doi.org/10.1017/"#linebreak()#"S0009838819000235".

#lorem(30)
"##;
        let Some(path) = typeset(tmp.path(), "broken", source) else { return };
        assert_eq!(identify(&path).unwrap().doi.as_deref(), Some("10.1017/s0009838819000235"));

        // Broken by the typesetter where the column ends, which may be within a
        // word: what the metadata say settles how it is read.
        let source = r#"
#set document(keywords: ("wrath", "doi:10.1007/s11229-019-02345-6"))
#set page(width: 60mm, height: 120mm, margin: 10mm)
#set text(size: 10pt)
A Note on the Wrath, https://doi.org/10.1007/s11229-019-02345-6
"#;
        let Some(path) = typeset(tmp.path(), "narrow", source) else { return };
        let f = identify(&path).unwrap();
        assert!(!f.beginning.contains("10.1007/s11229-019-02345-6"), "the DOI is no longer broken: {}", f.beginning);
        assert_eq!(f.doi.as_deref(), Some("10.1007/s11229-019-02345-6"));
    }

    #[test]
    fn a_book_and_its_imprint() {
        let tmp = tempfile::tempdir().unwrap();
        let source = r#"
#set document(title: "Nagy_Best_FINAL.indd", author: "Administrator")
#set page(width: 140mm, height: 210mm, margin: 20mm)
#align(center)[The Best of the Achaeans]
#pagebreak()
#pagebreak()
#align(center, text(size: 20pt)[The Best of the Achaeans])
#align(center)[Concepts of the Hero in Archaic Greek Poetry]
#align(center)[Gregory Nagy]
#align(center)[The Johns Hopkins University Press \ Baltimore and London]
#pagebreak()
#set text(size: 8pt)
Copyright © 1979, 1999 The Johns Hopkins University Press \
All rights reserved. First published 1979. Revised edition 1999.

Library of Congress Control Number: 98022104

eISBN 978-0-8044-2957-3 \
ISBN 978-0-8018-6015-7 (pbk. : alk. paper) \
ISBN-13: 978-0-8018-2388-6 (hardcover) \
ISBN 978-0-8018-2388-5 (misprinted) \
#"https://doi.org/10.1353/book.72120"

A catalog record for this book is available from the British Library.
#pagebreak()
#set text(size: 10pt)
= Contents
Bibliography #h(1fr) 355
#for i in range(40) [
  #pagebreak()
  #lorem(60)
]
#pagebreak()
#align(bottom)[Printed in the United States of America \ ISBN 0-306-40615-2]
"#;
        let Some(path) = typeset(tmp.path(), "nagy", source) else { return };
        let f = identify(&path).unwrap();
        assert_eq!(f.isbns, vec!["9780801860157", "9780801823886", "9780306406157", "9780804429573"]);
        assert_eq!(f.doi.as_deref(), Some("10.1353/book.72120"));
        assert_eq!(f.year, Some(1979));
        assert_eq!(f.pages, 46);
        assert_eq!((f.title.as_deref(), f.authors.len()), (None, 0), "the metadata are those of the typesetter");
        assert_eq!(f.beginning, "The Best of the Achaeans");
        let c = candidate(&path, &f);
        assert_eq!(c.draft.entry_type, "book");
        assert_eq!(c.draft.get("isbn"), Some("9780801860157, 9780801823886, 9780306406157, 9780804429573"));
        assert_eq!(c.notes, vec!["The details are from the file itself, not from a catalogue, and should be checked."]);
    }

    #[test]
    fn a_preprint_with_the_stamp_of_arxiv() {
        let tmp = tempfile::tempdir().unwrap();
        let preprint = |stamp: &str| {
            format!(
                r#"
#set document(title: "main.dvi")
#set page(width: 210mm, height: 297mm, margin: 30mm)
#place(left + horizon, dx: -18mm, rotate(-90deg, reflow: true, text(size: 14pt, fill: gray)[{stamp}]))
#align(center, text(size: 16pt)[String Junctions and Their Duals])
#align(center)[Yosuke Imamura]

We build on earlier work (arXiv:hep-th/9812209, arXiv:1706.03762). #lorem(80)
"#
            )
        };
        let Some(path) = typeset(tmp.path(), "new", &preprint(r"arXiv:2301.01234v2 \[hep-th\] 3 Jan 2023")) else {
            return;
        };
        let f = identify(&path).unwrap();
        assert_eq!(f.arxiv.as_deref(), Some("2301.01234"));
        assert_eq!(f.year, Some(2023));
        assert_eq!(f.title, None);
        let c = candidate(&path, &f);
        assert_eq!((c.draft.get("eprint"), c.draft.get("eprinttype")), (Some("2301.01234"), Some("arxiv")));

        let Some(path) = typeset(tmp.path(), "old", &preprint(r"arXiv:hep-th/9901001v3 #h(1em) 10 May 1999")) else {
            return;
        };
        let f = identify(&path).unwrap();
        assert_eq!(f.arxiv.as_deref(), Some("hep-th/9901001"));
        assert_eq!(f.year, Some(1999));
    }

    #[test]
    fn titles_of_the_typesetter() {
        let tmp = tempfile::tempdir().unwrap();
        let titled = |name: &str, title: &str| {
            let source =
                format!("#set document(title: \"{title}\", author: \"Gregory Nagy\")\nOn the wrath of Achilles.\n");
            typeset(tmp.path(), name, &source).map(|path| identify(&path).unwrap())
        };
        for (name, title) in [
            ("a", "Microsoft Word - draft3.docx"),
            ("b", "untitled"),
            ("c", "wrath-final.tex"),
            ("d", "0009838819000235"),
            ("e", "CAQ_1900023_proof"),
            ("wrath-v2", "wrath v2"),
        ] {
            let Some(f) = titled(name, title) else { return };
            assert_eq!(f.title, None, "{title}");
            assert_eq!(f.authors, vec!["Gregory Nagy"]);
            let c = candidate(Path::new("x.pdf"), &f);
            assert_eq!(c.draft.get("title"), None);
            assert!(
                c.notes[0]
                    .starts_with("No DOI or ISBN was found in the file; the details are from the file's own metadata")
            );
        }
        let Some(f) = titled("f", "On the Wrath of Achilles") else { return };
        assert_eq!(f.title.as_deref(), Some("On the Wrath of Achilles"));
    }

    #[test]
    fn a_scan_without_text() {
        let tmp = tempfile::tempdir().unwrap();
        std::fs::write(
            tmp.path().join("page.svg"),
            r##"<svg xmlns="http://www.w3.org/2000/svg" width="100" height="140"><rect x="10" y="10" width="80" height="120" fill="#ddd"/><circle cx="50" cy="70" r="30" fill="#777"/></svg>"##,
        )
        .unwrap();
        let source = "#set document(title: \"Scan 0042\")\n#page[]\n#page(image(\"page.svg\"))\n";
        let Some(path) = typeset(tmp.path(), "scan", source) else { return };
        let f = identify(&path).unwrap();
        assert_eq!((f.pages, f.has_text, f.beginning.as_str()), (2, false, ""));
        assert_eq!((f.doi.as_deref(), f.arxiv.as_deref(), f.isbns.len()), (None, None, 0));
        let c = candidate(&path, &f);
        assert_eq!(c.notes[0], "The file has no text layer: it is a scan.");
        assert_eq!(c.notes.len(), 2);
        assert_eq!(c.draft.entry_type, "misc");
    }

    #[test]
    fn a_pdf_protected_by_a_password() {
        use pdf_extract::{EncryptionState, EncryptionVersion, Permissions};

        let tmp = tempfile::tempdir().unwrap();
        let Some(path) = typeset(tmp.path(), "open", ARTICLE) else { return };
        let protect = |name: &str, user_password: &str| {
            let mut doc = Document::load(&path).unwrap();
            let version = EncryptionVersion::V2 {
                document: &doc,
                owner_password: "owner",
                user_password,
                key_length: 128,
                permissions: Permissions::all(),
            };
            let state = EncryptionState::try_from(version).unwrap();
            doc.encrypt(&state).unwrap();
            let protected = tmp.path().join(name);
            doc.save(&protected).unwrap();
            protected
        };

        // Protected against change only: it can be read without a password.
        let f = identify(&protect("owner.pdf", "")).unwrap();
        assert_eq!(f.doi.as_deref(), Some("10.1017/s0009838819000235"));
        assert_eq!(f.title.as_deref(), Some("The Wrath of Achilles Reconsidered"));
        assert_eq!(f.pages, 2);

        // Protected against reading.
        let protected = protect("reader.pdf", "secret");
        let f = identify(&protected).unwrap();
        assert_eq!((f.pages, f.has_text, f.doi.as_deref()), (0, false, None));
        assert_eq!(
            candidate(&protected, &f).notes[0],
            "The file could not be read: it is damaged, protected by a password, or too large."
        );
    }
}
