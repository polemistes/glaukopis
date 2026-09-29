//! Citation data from external databases.
//!
//! What the user typed or pasted is first told apart by [`classify`]: a DOI,
//! an ISBN, an arXiv identifier, a PubMed number, or words to search for.
//! [`lookup`] then asks the services that answer that kind of question and
//! returns what they have as drafts for the user to choose from.
//!
//! Which services are asked, and in which order, follows
//! `docs/research/bibliographic-apis.md`, where each of them was tried out.
//! The services deliver what publishers and libraries have typed in, and much
//! of the work done here is mending it: markup in titles, titles in capitals,
//! cataloguing punctuation, decomposed letters, chapters without their book.
//! Whatever is changed in a way the user should check is told in the hit's
//! remarks.

mod arxiv;
mod crossref;
// What a program that keeps references writes into a document is of this
// form too, and is read where citations that were found are looked up.
pub(crate) mod csl;
mod doi;
mod marc;
mod pubmed;
#[cfg(test)]
mod samples;
mod sru;
mod text;

use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{Duration, Instant};

use serde::{Deserialize, Serialize};

use crate::bib::latex::fold;
use crate::duplicates::{normalise_doi, normalise_isbns};
use crate::error::{Error, Result};
use crate::library::entry::Draft;
use crate::net::Client;
use crate::tr;

/// What is to be looked up.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", content = "value", rename_all = "lowercase")]
pub enum Query {
    /// In lower case, without prefix: `10.1086/599247`.
    Doi(String),
    /// Without hyphens, as an ISBN-13 when it is a valid ISBN. A number that
    /// was plainly meant as an ISBN but has a digit wrong is kept as typed,
    /// so that `lookup` can say what is wrong with it.
    Isbn(String),
    /// Without prefix, with the version if one was given: `1706.03762v7`, `hep-th/9901001`.
    Arxiv(String),
    Pmid(String),
    /// Words to search for.
    Text(String),
}

/// One record found, as a draft of an entry.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Hit {
    pub draft: Draft,
    /// The service it came from, as the user is told: "Crossref", "K10plus",
    /// "Norwegian academic libraries (Sikt)".
    pub source: String,
    /// A page about the item at the service, if there is one.
    pub url: Option<String>,
    /// What the user should know: "an e-book record", "another edition (1996)",
    /// "the title was in capitals and has been put in lower case".
    pub remarks: Vec<String>,
}

/// What kind of publication a search in words is for.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Scope {
    #[default]
    Any,
    Articles,
    Books,
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Outcome {
    pub hits: Vec<Hit>,
    /// Services that failed, and how, in words for the user: the others'
    /// results are still returned.
    pub failures: Vec<String>,
}

/// Tells what the user typed or pasted: a DOI (bare, with `doi:` or as a
/// URL), an ISBN (10 or 13, with hyphens or spaces), an arXiv id (old and new
/// forms, or a URL), `PMID: 123`, or words to search for.
///
/// Numbers are taken as identifiers only when their form leaves little doubt:
/// a bare number of eight digits may be a PubMed number or anything else, and
/// is searched for as words.
pub fn classify(input: &str) -> Query {
    let text = tidy(input);
    if let Some(id) = pmid(&text) {
        return Query::Pmid(id);
    }
    if let Some(id) = arxiv(&text) {
        return Query::Arxiv(id);
    }
    if let Some(doi) = doi(&text) {
        return Query::Doi(doi);
    }
    if let Some(isbn) = isbn(&text) {
        return Query::Isbn(isbn);
    }
    Query::Text(text)
}

/// What the services ask to have said of them where their records are used:
/// the name of the service, as hits have it in `source`, and the words, in
/// the language of the interface.
pub fn acknowledgements() -> Vec<(String, String)> {
    vec![
        (arxiv::SOURCE.to_owned(), tr!("core-lookup-thanks-arxiv")),
        ((sru::NORWAY.name)(), tr!("core-lookup-thanks-sikt")),
    ]
}

/// How many records a search in words asks each service for.
const ROWS: usize = 10;

/// Looks up what `classify` has told apart.
///
/// - A DOI is asked for at doi.org, which serves Crossref, DataCite and the
///   other agencies; for a part of a book Crossref is asked a second time,
///   for the book.
/// - An ISBN is asked for in library catalogues, one after the other until
///   one has it: K10plus first, the Norwegian libraries first for Norwegian
///   books, the Deutsche Nationalbibliothek for German ones, the Library of
///   Congress last.
/// - Words are searched for at Crossref for articles, and in K10plus and
///   the catalogue of the Norwegian libraries for books.
///
/// That nothing was found is not an error: the outcome is empty. A service
/// that fails is named in `failures`, and what the others found is returned.
/// When none of those asked could answer, that is the error.
pub fn lookup(client: &Client, query: &Query, scope: Scope) -> Result<Outcome> {
    match query {
        Query::Doi(doi) => {
            let doi = normalise_doi(doi).ok_or_else(|| Error::invalid(tr!("core-lookup-not-a-doi", doi = doi)))?;
            doi::lookup(client, &doi)
        }
        Query::Isbn(isbn) => by_isbn(client, isbn),
        Query::Arxiv(id) => {
            let id = arxiv_id(id.trim()).ok_or_else(|| Error::invalid(tr!("core-lookup-not-arxiv", id = id)))?;
            alone(arxiv::SOURCE, arxiv::lookup(client, &id))
        }
        Query::Pmid(id) => {
            let id = pmid(&format!("pmid:{}", id.trim()))
                .ok_or_else(|| Error::invalid(tr!("core-lookup-not-pubmed", id = id)))?;
            alone(pubmed::SOURCE, pubmed::lookup(client, &id))
        }
        Query::Text(text) => by_words(client, text, scope),
    }
}

/// The outcome where one service alone is asked.
fn alone(service: &str, answer: Result<Vec<Hit>>) -> Result<Outcome> {
    match answer {
        Ok(hits) => Ok(Outcome { hits, failures: Vec::new() }),
        Err(Error::NotFound(_)) => Ok(Outcome::default()),
        Err(e) => Err(Error::Network(failure(service, &e))),
    }
}

/// The ISBN as thirteen digits, or what is wrong with it.
fn checked_isbn(isbn: &str) -> Result<String> {
    let digits: String =
        isbn.chars().filter(|c| c.is_ascii_digit() || matches!(c, 'X' | 'x')).map(|c| c.to_ascii_uppercase()).collect();
    if !matches!(digits.len(), 10 | 13) {
        return Err(Error::invalid(tr!("core-lookup-isbn-length", isbn = isbn, count = digits.len())));
    }
    if !isbn_is_valid(&digits) {
        return Err(Error::invalid(tr!("core-lookup-isbn-check", isbn = isbn)));
    }
    normalise_isbns(&digits).into_iter().next().ok_or_else(|| Error::invalid(tr!("core-lookup-not-isbn", isbn = isbn)))
}

fn by_isbn(client: &Client, isbn: &str) -> Result<Outcome> {
    let isbn = checked_isbn(isbn)?;
    let catalogues = sru::for_isbn(&isbn);
    let mut failures = Vec::new();
    for catalogue in &catalogues {
        match catalogue.by_isbn(client, &isbn) {
            Ok(hits) if !hits.is_empty() => return Ok(Outcome { hits, failures }),
            Ok(_) => {}
            Err(e) => failures.push(failure(&(catalogue.name)(), &e)),
        }
    }
    if failures.len() == catalogues.len() {
        return Err(Error::Network(failures.join(" ")));
    }
    Ok(Outcome { hits: Vec::new(), failures })
}

fn by_words(client: &Client, text: &str, scope: Scope) -> Result<Outcome> {
    let text = tidy(text);
    if is_address(&text) {
        return Err(Error::invalid(tr!("core-lookup-address")));
    }
    let words = text::search_words(&text);
    if words.is_empty() {
        return Err(Error::invalid(tr!("core-lookup-nothing")));
    }
    // A year narrows nothing in a catalogue, where it is neither title nor
    // name. It counts when the hits are put in order.
    let mut asked_for: Vec<String> = words.iter().filter(|w| !text::is_year(w)).cloned().collect();
    if asked_for.is_empty() {
        asked_for = words.clone();
    }

    let mut hits: Vec<Hit> = Vec::new();
    let mut failures = Vec::new();
    let mut asked = 0;
    if scope != Scope::Articles {
        for catalogue in sru::for_words() {
            asked += 1;
            match catalogue.by_words(client, &asked_for, ROWS) {
                Ok(found) => hits.extend(found),
                Err(e) => failures.push(failure(&(catalogue.name)(), &e)),
            }
        }
    }
    if scope != Scope::Books {
        asked += 1;
        match crossref::search(client, &text, ROWS) {
            // Crossref answers with ten records whatever is asked.
            Ok(found) => hits.extend(found.into_iter().filter(|h| agreement(h, &words) >= 0.5)),
            Err(e) => failures.push(failure(crossref::SOURCE, &e)),
        }
    }
    if hits.is_empty() && failures.len() == asked {
        return Err(Error::Network(failures.join(" ")));
    }
    Ok(Outcome { hits: in_order(hits, &words), failures })
}

/// How much of what was asked for a hit has: the part of the words that are
/// in its titles, its names or its year.
fn agreement(hit: &Hit, words: &[String]) -> f64 {
    let mut has = String::new();
    for field in ["title", "subtitle", "maintitle", "booktitle", "journaltitle", "series"] {
        has.push_str(hit.draft.get(field).unwrap_or(""));
        has.push(' ');
    }
    for person in hit.draft.names.values().flatten() {
        has.push_str(&person.display());
        has.push(' ');
    }
    has.push_str(&hit.draft.get("date").map(|d| d.chars().take(4).collect::<String>()).unwrap_or_default());
    let has = fold(&has);
    let has: Vec<&str> = has.split(' ').collect();
    let found = words
        .iter()
        .filter(|w| {
            let w = fold(w);
            // The beginning of a word is enough: "Achaean" finds "Achaeans".
            has.iter().any(|h| *h == w || (w.chars().count() >= 4 && h.starts_with(&w)))
        })
        .count();
    if words.is_empty() { 0.0 } else { found as f64 / words.len() as f64 }
}

/// The hits of all services in one order: those that have most of what was
/// asked for first, and among equals the order in which they came, which is
/// books before articles. A book that two catalogues have is given once.
fn in_order(hits: Vec<Hit>, words: &[String]) -> Vec<Hit> {
    let mut kept: Vec<(i64, Hit)> = Vec::new();
    for hit in hits {
        let isbns = hit.draft.get("isbn").map(normalise_isbns).unwrap_or_default();
        let twice = !isbns.is_empty()
            && kept.iter().any(|(_, k)| {
                k.source != hit.source
                    && k.draft.get("date") == hit.draft.get("date")
                    && k.draft.get("isbn").map(normalise_isbns).unwrap_or_default().iter().any(|i| isbns.contains(i))
            });
        if !twice {
            kept.push(((agreement(&hit, words) * 100.0).round() as i64, hit));
        }
    }
    kept.sort_by_key(|(agreement, _)| -agreement);
    kept.into_iter().map(|(_, hit)| hit).collect()
}

/// Without the spaces, line breaks and quotation marks that come along when
/// something is copied from a page.
fn tidy(input: &str) -> String {
    let joined = input.split_whitespace().collect::<Vec<_>>().join(" ");
    let mut text = joined.as_str();
    for (open, close) in [('"', '"'), ('“', '”'), ('«', '»'), ('<', '>'), ('\'', '\'')] {
        if let Some(inner) = text.strip_prefix(open).and_then(|t| t.strip_suffix(close)) {
            text = inner.trim();
        }
    }
    text.to_owned()
}

/// `text` without `prefix` at its beginning, compared without regard to case.
fn after<'a>(text: &'a str, prefix: &str) -> Option<&'a str> {
    let head = text.get(..prefix.len())?;
    head.eq_ignore_ascii_case(prefix).then(|| &text[prefix.len()..])
}

/// The rest of an address after its scheme, `www.` and one of the hosts.
fn address_at<'a>(text: &'a str, hosts: &[&str]) -> Option<&'a str> {
    let rest = after(text, "https://").or_else(|| after(text, "http://")).unwrap_or(text);
    let rest = after(rest, "www.").unwrap_or(rest);
    hosts.iter().find_map(|host| after(rest, host)).and_then(|r| r.strip_prefix('/'))
}

pub(crate) fn is_address(text: &str) -> bool {
    (after(text, "https://").is_some() || after(text, "http://").is_some() || after(text, "www.").is_some())
        && !text.contains(' ')
}

/// `%2F` and the like, as addresses write what they cannot hold.
fn percent_decode(text: &str) -> String {
    let bytes = text.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        let hex = |b: u8| (b as char).to_digit(16).map(|d| d as u8);
        match (bytes[i], bytes.get(i + 1).copied().and_then(hex), bytes.get(i + 2).copied().and_then(hex)) {
            (b'%', Some(high), Some(low)) => {
                out.push(high * 16 + low);
                i += 3;
            }
            (b, _, _) => {
                out.push(b);
                i += 1;
            }
        }
    }
    String::from_utf8_lossy(&out).into_owned()
}

fn pmid(text: &str) -> Option<String> {
    let number = |s: &str| -> Option<String> {
        let s = s.trim().trim_end_matches(['.', ',', ';']);
        let ok = (1..=9).contains(&s.len()) && s.chars().all(|c| c.is_ascii_digit()) && !s.starts_with('0');
        ok.then(|| s.to_owned())
    };
    if let Some(rest) = after(text, "pmid") {
        return number(rest.trim_start().strip_prefix(':').unwrap_or(rest));
    }
    if let Some(path) = address_at(text, &["pubmed.ncbi.nlm.nih.gov", "ncbi.nlm.nih.gov/pubmed"]) {
        return number(path.split(['/', '?', '#']).next().unwrap_or(""));
    }
    None
}

/// The archives of arXiv from before 2007, when identifiers named them.
const ARXIV_ARCHIVES: &[&str] = &[
    "acc-phys", "adap-org", "alg-geom", "ao-sci", "astro-ph", "atom-ph", "bayes-an", "chao-dyn", "chem-ph", "cmp-lg",
    "comp-gas", "cond-mat", "cs", "dg-ga", "funct-an", "gr-qc", "hep-ex", "hep-lat", "hep-ph", "hep-th", "math",
    "math-ph", "mtrl-th", "nlin", "nucl-ex", "nucl-th", "patt-sol", "physics", "plasm-ph", "q-alg", "q-bio", "q-fin",
    "quant-ph", "solv-int", "stat", "supr-con",
];

fn arxiv(text: &str) -> Option<String> {
    if let Some(rest) = after(text, "arxiv:").or_else(|| after(text, "arxiv ")) {
        return arxiv_id(rest.trim());
    }
    if let Some(path) = address_at(text, &["arxiv.org", "export.arxiv.org"]) {
        let path = path.split(['?', '#']).next().unwrap_or("");
        let id = ["abs/", "pdf/", "html/", "format/", "ps/"].iter().find_map(|kind| path.strip_prefix(kind))?;
        let id = id.trim_end_matches('/');
        return arxiv_id(after_suffix(id, ".pdf").unwrap_or(id));
    }
    arxiv_id(text)
}

fn after_suffix<'a>(text: &'a str, suffix: &str) -> Option<&'a str> {
    let at = text.len().checked_sub(suffix.len())?;
    let tail = text.get(at..)?;
    tail.eq_ignore_ascii_case(suffix).then(|| &text[..at])
}

/// An identifier of arXiv in its form since 2007 (`1706.03762`, with four
/// digits after the point until 2014) or in the older one (`hep-th/9901001`,
/// `math.GT/0309136`), with or without a version.
fn arxiv_id(text: &str) -> Option<String> {
    let (body, version) = match text.rfind('v') {
        Some(at) if at > 0 && text.len() > at + 1 && text[at + 1..].chars().all(|c| c.is_ascii_digit()) => {
            (&text[..at], &text[at..])
        }
        _ => (text, ""),
    };
    let digits =
        |s: &str, n: std::ops::RangeInclusive<usize>| n.contains(&s.len()) && s.chars().all(|c| c.is_ascii_digit());
    let month = |s: &str| s.get(2..4).and_then(|m| m.parse::<u8>().ok()).is_some_and(|m| (1..=12).contains(&m));

    if let Some((left, right)) = body.split_once('.')
        && digits(left, 4..=4)
        && digits(right, 4..=5)
        && month(left)
    {
        return Some(format!("{body}{version}"));
    }
    if let Some((archive, number)) = body.split_once('/') {
        let (name, class) = match archive.split_once('.') {
            Some((name, class)) => (name, Some(class)),
            None => (archive, None),
        };
        let class_ok = class.is_none_or(|c| c.len() == 2 && c.chars().all(|c| c.is_ascii_uppercase()));
        if ARXIV_ARCHIVES.contains(&name.to_ascii_lowercase().as_str())
            && class_ok
            && digits(number, 7..=7)
            && month(number)
        {
            let class = class.map(|c| format!(".{c}")).unwrap_or_default();
            return Some(format!("{}{class}/{number}{version}", name.to_ascii_lowercase()));
        }
    }
    None
}

fn doi(text: &str) -> Option<String> {
    // Named as one, wherever it stands: "doi:10.…", "https://doi.org/10.…".
    let lower = text.to_ascii_lowercase();
    for marker in ["doi.org/", "doi:", "doi "] {
        for (at, _) in lower.match_indices(marker) {
            let word_begins = at == 0 || !lower[..at].ends_with(|c: char| c.is_alphanumeric());
            if !word_begins && marker != "doi.org/" {
                continue;
            }
            let token = text[at + marker.len()..].split_whitespace().next().unwrap_or("");
            let token = if marker == "doi.org/" { percent_decode(token) } else { token.to_owned() };
            if let Some(doi) = doi_proper(&token) {
                return Some(doi);
            }
        }
    }
    if text.contains(' ') {
        return None;
    }
    if text.trim_start_matches(['(', '<', '[']).starts_with("10.") {
        return doi_proper(text);
    }
    // In the address of the publisher's page about the article.
    if is_address(text) {
        let path = text.split(['?', '#']).next().unwrap_or(text);
        let at = path.find("/10.")?;
        let mut candidate = percent_decode(&path[at + 1..]);
        for page in ["/html", "/pdf", "/epdf", "/full", "/abstract", "/summary", "/meta"] {
            if let Some(shorter) = after_suffix(&candidate, page) {
                candidate = shorter.to_owned();
            }
        }
        return doi_proper(candidate.trim_end_matches('/'));
    }
    None
}

/// A DOI has a prefix of `10.`, four to nine digits and perhaps further
/// numbers after points, then a slash and a suffix of the registrant's choosing.
fn doi_proper(token: &str) -> Option<String> {
    let mut token = token.trim_start_matches(['(', '<', '[', '"', '“']);
    loop {
        let before = token;
        token = token.trim_end_matches(['.', ',', ';', ':', '"', '”', '>', ']', '\'']);
        // A bracket that was opened before the DOI began is not part of it.
        if token.ends_with(')') && token.matches(')').count() > token.matches('(').count() {
            token = &token[..token.len() - 1];
        }
        if token == before {
            break;
        }
    }
    let (prefix, suffix) = token.split_once('/')?;
    let mut numbers = prefix.strip_prefix("10.")?.split('.');
    let registrant = numbers.next()?;
    let ok = (4..=9).contains(&registrant.len())
        && registrant.chars().all(|c| c.is_ascii_digit())
        && numbers.all(|n| !n.is_empty() && n.chars().all(|c| c.is_ascii_digit()))
        && !suffix.is_empty();
    if !ok {
        return None;
    }
    normalise_doi(token)
}

/// Whether the last digit of an ISBN agrees with the others.
pub(crate) fn isbn_is_valid(digits: &str) -> bool {
    let values: Vec<u32> = digits
        .chars()
        .enumerate()
        .filter_map(|(i, c)| match c {
            'X' | 'x' if i == 9 && digits.len() == 10 => Some(10),
            c => c.to_digit(10),
        })
        .collect();
    if values.len() != digits.chars().count() {
        return false;
    }
    match values.len() {
        10 => values.iter().enumerate().map(|(i, v)| v * (10 - i as u32)).sum::<u32>() % 11 == 0,
        13 => {
            (digits.starts_with("978") || digits.starts_with("979"))
                && values.iter().enumerate().map(|(i, v)| v * if i % 2 == 0 { 1 } else { 3 }).sum::<u32>() % 10 == 0
        }
        _ => false,
    }
}

fn isbn(text: &str) -> Option<String> {
    let named = after(text, "isbn");
    let rest = match named {
        Some(rest) => {
            let rest = rest.trim_start_matches(['-', ' ']);
            let rest = rest
                .strip_prefix("13")
                .or_else(|| rest.strip_prefix("10"))
                .filter(|r| r.starts_with([':', ' ']))
                .unwrap_or(rest);
            rest.trim_start_matches([':', ' '])
        }
        None => text,
    };

    // The number, and what follows it: "(pbk.)" and the like.
    let mut digits = String::new();
    let mut end = rest.len();
    for (i, c) in rest.char_indices() {
        match c {
            '0'..='9' => digits.push(c),
            'X' | 'x' if digits.len() == 9 => digits.push('X'),
            '-' | ' ' | '\u{2010}' | '\u{2011}' | '–' if !digits.is_empty() => {}
            _ => {
                end = i;
                break;
            }
        }
    }
    let tail = rest[end..].trim();
    if digits.is_empty() {
        return None;
    }

    if isbn_is_valid(&digits) && (tail.is_empty() || named.is_some() || tail.starts_with('(')) {
        return crate::duplicates::normalise_isbns(&digits).into_iter().next();
    }
    // A digit wrong or missing. That it was meant as an ISBN is beyond doubt
    // when it is called one, or has thirteen digits beginning as ISBNs do.
    let meant = named.is_some()
        || (digits.len() == 13 && (digits.starts_with("978") || digits.starts_with("979")) && tail.is_empty());
    meant.then_some(digits)
}

/// What went wrong at a service, in words for the user.
pub(crate) fn failure(service: &str, error: &Error) -> String {
    let what = match error {
        Error::Network(m) | Error::NotFound(m) | Error::Invalid(m) => m.clone(),
        other => other.to_string(),
    };
    format!("{service}: {what}.")
}

/// Waits until `gap` has passed since the service was last asked.
///
/// The services say how often they may be asked: arXiv once in three
/// seconds, Crossref's search once a second. One lookup asks a service once
/// or twice, so this matters when lookups follow each other closely, and it
/// holds for all of them together, from whichever thread they come.
pub(crate) fn pace(service: &str, gap: Duration) {
    static LAST: Mutex<Option<HashMap<String, Instant>>> = Mutex::new(None);
    let wait = {
        let mut last = LAST.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
        let times = last.get_or_insert_with(HashMap::new);
        let now = Instant::now();
        let turn = times.get(service).map(|t| *t + gap).filter(|t| *t > now).unwrap_or(now);
        times.insert(service.to_owned(), turn);
        turn - now
    };
    if !wait.is_zero() {
        std::thread::sleep(wait);
    }
}

/// How XML from the network is read. PubMed's records name a DTD, which is
/// not fetched; the number of nodes is bounded, so that no answer can take
/// all the memory there is.
pub(crate) fn xml_options<'input>() -> roxmltree::ParsingOptions<'input> {
    roxmltree::ParsingOptions { allow_dtd: true, nodes_limit: 4_000_000, ..Default::default() }
}

/// All the text within an element: titles may hold `<i>` and the like.
pub(crate) fn xml_text(node: roxmltree::Node) -> String {
    let mut out = String::new();
    for n in node.descendants().filter(|n| n.is_text()) {
        out.push_str(n.text().unwrap_or(""));
    }
    text::clean(&out)
}

pub(crate) fn xml_child<'a, 'i>(node: roxmltree::Node<'a, 'i>, name: &str) -> Option<roxmltree::Node<'a, 'i>> {
    node.children().find(|c| c.is_element() && c.tag_name().name() == name)
}

pub(crate) fn xml_child_text(node: roxmltree::Node, name: &str) -> Option<String> {
    xml_child(node, name).map(xml_text).filter(|t| !t.is_empty())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn doi_of(input: &str) -> Option<String> {
        match classify(input) {
            Query::Doi(d) => Some(d),
            _ => None,
        }
    }

    #[test]
    fn dois() {
        for input in [
            "10.1086/599247",
            "  10.1086/599247\n",
            "doi:10.1086/599247",
            "DOI: 10.1086/599247",
            "doi 10.1086/599247",
            "https://doi.org/10.1086/599247",
            "http://dx.doi.org/10.1086/599247",
            "doi.org/10.1086/599247",
            "https://doi.org/10.1086%2F599247",
            "10.1086/599247.",
            "(doi:10.1086/599247)",
            "<https://doi.org/10.1086/599247>",
            "Kossinets and Watts 2009, https://doi.org/10.1086/599247.",
            "American Journal of Sociology 115 (2009), DOI: 10.1086/599247",
            "https://www.journals.uchicago.edu/doi/10.1086/599247",
            "https://www.journals.uchicago.edu/doi/abs/10.1086/599247?journalCode=ajs",
        ] {
            assert_eq!(doi_of(input).as_deref(), Some("10.1086/599247"), "{input}");
        }
        // Lower case, whatever was typed; the suffix may hold almost anything.
        assert_eq!(doi_of("10.1017/CBO9780511803161.003").as_deref(), Some("10.1017/cbo9780511803161.003"));
        assert_eq!(doi_of("10.5281/ZENODO.3233986").as_deref(), Some("10.5281/zenodo.3233986"));
        assert_eq!(doi_of("https://doi.org/10.1515/9783110272017.27").as_deref(), Some("10.1515/9783110272017.27"));
        assert_eq!(
            doi_of("https://www.degruyter.com/document/doi/10.1515/9783110272017.27/html").as_deref(),
            Some("10.1515/9783110272017.27")
        );
        assert_eq!(
            doi_of("10.1002/(SICI)1097-4679(199910)55:10<1243::AID-JCLP6>3.0.CO;2-N").as_deref(),
            Some("10.1002/(sici)1097-4679(199910)55:10<1243::aid-jclp6>3.0.co;2-n")
        );
        assert_eq!(doi_of("(10.1016/S0140-6736(05)67172-5)").as_deref(), Some("10.1016/s0140-6736(05)67172-5"));
        // The DOI that arXiv gives a preprint is a DOI.
        assert_eq!(doi_of("10.48550/arXiv.1706.03762").as_deref(), Some("10.48550/arxiv.1706.03762"));
        assert_eq!(doi_of("10.1000.10/182").as_deref(), Some("10.1000.10/182"));
    }

    #[test]
    fn what_only_looks_like_a_doi() {
        for input in [
            "10.1086",
            "10.1086/",
            "10.12/345",
            "10.5 per cent / year",
            "doi:",
            "doi: pending",
            "10,1086/599247",
            "110.1086/599247",
            "Placido Domingo 10.1086/599247",
            "https://example.org/articles/599247",
            "chapter 10. The origins/ends of homophily",
        ] {
            assert!(matches!(classify(input), Query::Text(_)), "{input}: {:?}", classify(input));
        }
    }

    #[test]
    fn isbns() {
        for input in [
            "9780674033818",
            "978-0-674-03381-8",
            "978 0 674 03381 8",
            "ISBN 978-0-674-03381-8",
            "ISBN: 9780674033818",
            "isbn:9780674033818",
            "ISBN-13: 978-0-674-03381-8",
            "ISBN 13 978-0-674-03381-8",
            "0674033817",
            "0-674-03381-7",
            "ISBN-10: 0-674-03381-7",
            "978-0-674-03381-8 (pbk.)",
            "ISBN 0674033817 (pbk. : alk. paper)",
            "978‐0‐674‐03381‐8",
        ] {
            assert_eq!(classify(input), Query::Isbn("9780674033818".into()), "{input}");
        }
        assert_eq!(classify("0-8044-2957-X"), Query::Isbn("9780804429573".into()));
        assert_eq!(classify("080442957x"), Query::Isbn("9780804429573".into()));
        assert_eq!(classify("978-82-02-41373-6"), Query::Isbn("9788202413736".into()));
        assert_eq!(classify("979-10-90636-07-1"), Query::Isbn("9791090636071".into()));
    }

    #[test]
    fn an_isbn_with_a_digit_wrong_is_still_meant_as_one() {
        assert!(isbn_is_valid("9780674033818") && isbn_is_valid("080442957X") && isbn_is_valid("0674033809"));
        assert!(!isbn_is_valid("9780674033819") && !isbn_is_valid("0674033818") && !isbn_is_valid("9770674033811"));
        assert!(!isbn_is_valid("X674033817") && !isbn_is_valid("97806740338") && !isbn_is_valid(""));

        assert_eq!(classify("978-0-674-03381-9"), Query::Isbn("9780674033819".into()));
        assert_eq!(classify("ISBN 0674033818"), Query::Isbn("0674033818".into()));
        assert_eq!(classify("ISBN 978-0-674-0338"), Query::Isbn("97806740338".into()));
    }

    #[test]
    fn what_only_looks_like_an_isbn() {
        for input in [
            "1234567890",
            "0674033818",
            "1914-1918",
            "22 85 50 50",
            "19008416",
            "4006381333931",
            "97806740338181",
            "978-0-674-03381-8 and more",
            "1984",
            "2001: A Space Odyssey",
            "ISBN",
            "isbnot 9780674033818",
        ] {
            assert!(matches!(classify(input), Query::Text(_)), "{input}: {:?}", classify(input));
        }
    }

    #[test]
    fn arxiv_identifiers() {
        for input in [
            "1706.03762",
            "arXiv:1706.03762",
            "arxiv: 1706.03762",
            "arXiv 1706.03762",
            "https://arxiv.org/abs/1706.03762",
            "http://arxiv.org/abs/1706.03762",
            "arxiv.org/abs/1706.03762",
            "https://www.arxiv.org/abs/1706.03762/",
            "https://arxiv.org/pdf/1706.03762",
            "https://arxiv.org/pdf/1706.03762.pdf",
            "https://export.arxiv.org/abs/1706.03762",
        ] {
            assert_eq!(classify(input), Query::Arxiv("1706.03762".into()), "{input}");
        }
        assert_eq!(classify("1706.03762v7"), Query::Arxiv("1706.03762v7".into()));
        assert_eq!(classify("https://arxiv.org/pdf/1706.03762v7.pdf"), Query::Arxiv("1706.03762v7".into()));
        assert_eq!(classify("https://arxiv.org/html/2401.12345v1"), Query::Arxiv("2401.12345v1".into()));
        assert_eq!(classify("0704.0001"), Query::Arxiv("0704.0001".into()));
        assert_eq!(classify("hep-th/9901001"), Query::Arxiv("hep-th/9901001".into()));
        assert_eq!(classify("arXiv:hep-th/9901001v2"), Query::Arxiv("hep-th/9901001v2".into()));
        assert_eq!(classify("math.GT/0309136"), Query::Arxiv("math.GT/0309136".into()));
        assert_eq!(classify("https://arxiv.org/abs/cond-mat/0207270v1"), Query::Arxiv("cond-mat/0207270v1".into()));
    }

    #[test]
    fn what_only_looks_like_an_arxiv_identifier() {
        for input in [
            "1706.037",
            "1713.03762",
            "1700.03762",
            "17060.3762",
            "1706.03762v",
            "1706.03762 v7",
            "3.14159",
            "homer/9901001",
            "hep-th/990100",
            "hep-th/9913001",
            "arXiv:",
            "arXiv: attention is all you need",
            "https://arxiv.org/list/cs.CL/recent",
            "vol. 1706.03762",
        ] {
            assert!(matches!(classify(input), Query::Text(_)), "{input}: {:?}", classify(input));
        }
    }

    #[test]
    fn pubmed_numbers() {
        for input in [
            "PMID: 19008416",
            "PMID:19008416",
            "pmid 19008416",
            "PMID19008416",
            "PMID: 19008416.",
            "https://pubmed.ncbi.nlm.nih.gov/19008416/",
            "https://pubmed.ncbi.nlm.nih.gov/19008416",
            "pubmed.ncbi.nlm.nih.gov/19008416/?from=x",
            "https://www.ncbi.nlm.nih.gov/pubmed/19008416",
        ] {
            assert_eq!(classify(input), Query::Pmid("19008416".into()), "{input}");
        }
        assert_eq!(classify("PMID: 1"), Query::Pmid("1".into()));
        for input in [
            "19008416",
            "PMID",
            "PMID: none",
            "PMID: 0123",
            "PMID: 1900841600",
            "PMC2684823",
            "PMID: 19008416 and 19008417",
        ] {
            assert!(matches!(classify(input), Query::Text(_)), "{input}: {:?}", classify(input));
        }
    }

    #[test]
    fn words() {
        assert_eq!(classify("  Nagy,  Best of the\n Achaeans "), Query::Text("Nagy, Best of the Achaeans".into()));
        assert_eq!(classify("“Origins of Homophily”"), Query::Text("Origins of Homophily".into()));
        assert_eq!(classify("μῆνιν ἄειδε θεά"), Query::Text("μῆνιν ἄειδε θεά".into()));
        assert_eq!(classify("Ødegård 2014"), Query::Text("Ødegård 2014".into()));
        assert_eq!(classify(""), Query::Text(String::new()));
        assert_eq!(classify("%"), Query::Text("%".into()));
        assert_eq!(classify("%2"), Query::Text("%2".into()));
        assert_eq!(classify("æ"), Query::Text("æ".into()));
    }

    #[test]
    fn a_query_travels_to_the_interface_and_back() {
        let q = classify("doi:10.1086/599247");
        let json = serde_json::to_string(&q).unwrap();
        assert_eq!(json, r#"{"kind":"doi","value":"10.1086/599247"}"#);
        assert_eq!(serde_json::from_str::<Query>(&json).unwrap(), q);
        assert_eq!(serde_json::from_str::<Scope>(r#""books""#).unwrap(), Scope::Books);
    }

    fn client() -> Client {
        // No address to be reached at is given.
        Client::new(None)
    }

    #[test]
    fn what_cannot_be_looked_up_is_said_before_anyone_is_asked() {
        let invalid = |query: Query| match lookup(&client(), &query, Scope::Any) {
            Err(Error::Invalid(message)) => message,
            other => panic!("{query:?} gave {other:?}"),
        };
        assert!(invalid(Query::Isbn("9780674033819".into())).contains("Is a digit mistyped?"));
        assert!(invalid(Query::Isbn("97806740338".into())).contains("this has 11"));
        assert!(invalid(Query::Isbn("".into())).contains("this has 0"));
        assert!(invalid(Query::Doi("not a doi".into())).contains("is not a DOI"));
        assert!(invalid(Query::Arxiv("1706.037".into())).contains("arXiv"));
        assert!(invalid(Query::Arxiv("../etc".into())).contains("arXiv"));
        assert!(invalid(Query::Pmid("12 or 13".into())).contains("PubMed"));
        assert!(invalid(Query::Text("  ".into())).contains("nothing to look for"));
        assert!(invalid(Query::Text("?!".into())).contains("nothing to look for"));
        assert!(invalid(Query::Text("https://example.org/articles/599247".into())).contains("search for the title"));
        assert_eq!(checked_isbn("0-674-03381-7").unwrap(), "9780674033818");
        assert_eq!(checked_isbn("080442957x").unwrap(), "9780804429573");
    }

    #[test]
    fn hits_of_several_services_in_one_order() {
        let words = text::search_words("Nagy Best of the Achaeans 1999");
        assert_eq!(words, vec!["Nagy", "Best", "Achaeans", "1999"]);
        let books = sru::K10PLUS.hits_for_words(samples::K10_NAGY).unwrap();
        let articles = crossref::hits(samples::CROSSREF_SEARCH).unwrap();
        assert!((agreement(&books[0], &words) - 1.0).abs() < 1e-9, "the edition of 1999");
        assert!((agreement(&books[1], &words) - 0.75).abs() < 1e-9);
        // A review by Hainsworth has the name of the author reviewed in its title.
        assert!((agreement(&articles[2], &words) - 0.75).abs() < 1e-9);
        assert!(agreement(&articles[0], &["Homophily".to_owned()]) < 0.1);

        // The same book from a second catalogue, and another edition of it from there.
        let mut again = books[0].clone();
        again.source = "Norwegian academic libraries (Sikt)".into();
        let mut other = books[1].clone();
        other.source = again.source.clone();
        other.draft.fields.insert("date".into(), "1992".into());
        let mut all = books.clone();
        all.push(other);
        all.push(again);
        all.extend(articles.clone());

        let ordered = in_order(all, &words);
        assert_eq!(ordered.len(), 11);
        assert_eq!(ordered[0].draft.get("date"), Some("1999"));
        assert_eq!(ordered[0].source, "K10plus");
        assert!(ordered[1..5].iter().all(|h| h.source == "K10plus"));
        assert_eq!(
            (ordered[5].source.as_str(), ordered[5].draft.get("date")),
            ("Norwegian academic libraries (Sikt)", Some("1992"))
        );
        assert!(ordered[6..].iter().all(|h| h.source == "Crossref"));
        // Last the review whose title has the name misspelt: "Achaens".
        assert_eq!(ordered[10].draft.get("doi"), Some("10.1086/366680"));
    }

    #[test]
    fn failures_in_words() {
        assert_eq!(
            failure("K10plus", &Error::Network("sru.k10plus.de did not answer in time".into())),
            "K10plus: sru.k10plus.de did not answer in time."
        );
        let none: Result<Vec<Hit>> = Err(Error::not_found("nothing"));
        assert!(alone("arXiv", none).unwrap().hits.is_empty());
        let failed: Result<Vec<Hit>> = Err(Error::Network("export.arxiv.org could not be reached".into()));
        assert_eq!(
            alone("arXiv", failed).unwrap_err().to_string(),
            "network: arXiv: export.arxiv.org could not be reached."
        );
    }

    #[test]
    fn services_are_not_asked_too_often() {
        let start = Instant::now();
        pace("a service of the tests", Duration::from_millis(60));
        assert!(start.elapsed() < Duration::from_millis(50), "the first question need not wait");
        pace("a service of the tests", Duration::from_millis(60));
        pace("another service of the tests", Duration::from_millis(60));
        assert!(start.elapsed() >= Duration::from_millis(60));
        pace("a service of the tests", Duration::from_millis(60));
        assert!(start.elapsed() >= Duration::from_millis(120));
    }

    #[test]
    fn what_travels_to_the_interface() {
        let hits = sru::K10PLUS.hits_for_isbn(samples::K10_ASSMANN, "9783406568442").unwrap();
        let outcome =
            Outcome { hits, failures: vec!["Library of Congress: lx2.loc.gov:210 did not answer in time.".into()] };
        let json = serde_json::to_value(&outcome).unwrap();
        assert_eq!(json["hits"][0]["source"], "K10plus");
        assert_eq!(json["hits"][0]["draft"]["type"], "book");
        assert_eq!(json["hits"][0]["draft"]["key"], "");
        assert_eq!(json["hits"][0]["draft"]["fields"]["title"], "Das kulturelle Gedächtnis");
        assert_eq!(json["hits"][0]["draft"]["names"]["author"][0]["family"], "Assmann");
        assert_eq!(json["hits"][1]["remarks"][0], "Another edition with the same ISBN (edition 6, 2007).");
        assert_eq!(json["failures"][0], "Library of Congress: lx2.loc.gov:210 did not answer in time.");
        // What is proposed can be added to a library as it is.
        for hit in &outcome.hits {
            let entry = hit.draft.to_entry();
            assert_eq!(entry.year(), hit.draft.get("date").and_then(|d| d[..4].parse().ok()));
            assert!(crate::bib::parse(&entry.to_bib(false, false)).warnings.is_empty());
        }
        assert!(acknowledgements().iter().any(|(service, _)| *service == arxiv::SOURCE));
        assert!(acknowledgements().iter().any(|(service, _)| *service == (sru::NORWAY.name)()));
    }

    // The tests below ask the services themselves, once each. They are run with
    //     cargo test -p glaukopis-core lookup -- --ignored --test-threads=1 --nocapture

    fn told(what: &str, outcome: &Outcome) {
        let first = outcome.hits.first().map(|h| {
            let e = h.draft.to_entry();
            let s = e.summary();
            format!("{}: @{} {} ({}) {} [{}]", h.source, s.entry_type, s.authors, s.year, s.title, s.container)
        });
        println!(
            "NETWORK {what}: {} hits; first: {}; failures: {:?}",
            outcome.hits.len(),
            first.unwrap_or_else(|| "none".into()),
            outcome.failures
        );
    }

    #[test]
    #[ignore = "asks doi.org"]
    fn network_doi_of_a_journal_article() {
        let outcome = lookup(&client(), &classify("https://doi.org/10.1086/599247"), Scope::Any).unwrap();
        told("DOI of a journal article", &outcome);
        assert_eq!(outcome.hits.len(), 1);
        let draft = &outcome.hits[0].draft;
        assert_eq!(draft.entry_type, "article");
        assert_eq!(draft.get("title"), Some("Origins of Homophily in an Evolving Social Network"));
        assert_eq!(draft.get("pages"), Some("405–450"));
        assert_eq!(draft.names["author"].len(), 2);
    }

    #[test]
    #[ignore = "asks doi.org twice"]
    fn network_doi_of_a_chapter() {
        let outcome = lookup(&client(), &classify("10.1515/9783110272017.27"), Scope::Any).unwrap();
        told("DOI of a book chapter", &outcome);
        assert_eq!(outcome.hits.len(), 1);
        let draft = &outcome.hits[0].draft;
        assert_eq!(draft.entry_type, "incollection");
        assert_eq!(draft.get("booktitle"), Some("Homeric Contexts"));
        assert_eq!(draft.get("isbn"), Some("978-3-11-027195-9"));
        assert_eq!(draft.names["editor"].len(), 3);
        assert!(outcome.failures.is_empty());
    }

    #[test]
    #[ignore = "asks K10plus"]
    fn network_isbn_of_a_monograph() {
        let outcome = lookup(&client(), &classify("978-0-674-03381-8"), Scope::Any).unwrap();
        told("ISBN of a monograph", &outcome);
        assert!(outcome.hits.len() >= 2);
        let first = &outcome.hits[0];
        assert_eq!(first.source, "K10plus");
        assert_eq!(first.draft.get("title"), Some("Ancient literacy"));
        assert_eq!(first.draft.get("date"), Some("1991"));
        assert_eq!(first.draft.names["author"][0].family, "Harris");
    }

    #[test]
    #[ignore = "asks the catalogue of the Norwegian libraries"]
    fn network_norwegian_isbn() {
        let outcome = lookup(&client(), &classify("ISBN 978-82-02-41373-6"), Scope::Any).unwrap();
        told("Norwegian ISBN", &outcome);
        let first = &outcome.hits[0];
        assert_eq!(first.source, "Norwegian academic libraries (Sikt)");
        assert_eq!(first.draft.get("title"), Some("Knut Hamsun"));
        assert_eq!(first.draft.get("subtitle"), Some("reisen til Hitler"));
        assert_eq!(first.draft.get("location"), Some("Oslo"));
    }

    #[test]
    #[ignore = "asks Crossref"]
    fn network_words_for_an_article() {
        let outcome = lookup(
            &client(),
            &classify("Kossinets Watts Origins of Homophily in an Evolving Social Network"),
            Scope::Articles,
        )
        .unwrap();
        told("words for an article", &outcome);
        assert!(outcome.hits.iter().all(|h| h.source == "Crossref"));
        assert!(outcome.hits.iter().any(|h| h.draft.get("doi") == Some("10.1086/599247")));
    }

    #[test]
    #[ignore = "asks K10plus and the catalogue of the Norwegian libraries"]
    fn network_words_for_a_book() {
        let outcome = lookup(&client(), &classify("Nagy, The Best of the Achaeans"), Scope::Books).unwrap();
        told("words for a book", &outcome);
        assert!(outcome.hits.iter().all(|h| h.source != "Crossref"));
        let first = &outcome.hits[0];
        assert_eq!(first.draft.get("title").map(str::to_lowercase).as_deref(), Some("the best of the achaeans"));
        assert_eq!(first.draft.names["author"][0].family, "Nagy");
    }

    #[test]
    #[ignore = "asks arXiv"]
    fn network_arxiv() {
        let outcome = lookup(&client(), &classify("arXiv:1706.03762"), Scope::Any).unwrap();
        told("arXiv identifier", &outcome);
        assert_eq!(outcome.hits.len(), 1);
        let draft = &outcome.hits[0].draft;
        assert_eq!(draft.get("title"), Some("Attention Is All You Need"));
        assert_eq!(draft.get("eprint"), Some("1706.03762"));
        assert_eq!(draft.get("date"), Some("2017-06-12"));
    }

    #[test]
    #[ignore = "asks PubMed"]
    fn network_pubmed() {
        let outcome = lookup(&client(), &classify("PMID: 19008416"), Scope::Any).unwrap();
        told("PubMed number", &outcome);
        assert_eq!(outcome.hits.len(), 1);
        assert_eq!(outcome.hits[0].draft.get("journaltitle"), Some("Science"));
        assert_eq!(outcome.hits[0].draft.get("pages"), Some("1695–1699"));
    }
}
