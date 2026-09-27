//! CSL-JSON into drafts.
//!
//! This is the form in which doi.org answers for every registration agency,
//! and, with small differences, the form of the records in Crossref's own
//! interface: there `title` and `container-title` are lists, here they are
//! strings. Both are read.
//!
//! Nothing in a record is taken for granted. A field may be missing, or be a
//! number where a string is expected, or a list where a single value is.

use serde_json::Value;

use crate::bib::names::Person;
use crate::duplicates::{normalise_doi, normalise_isbns};
use crate::library::entry::Draft;

use super::text;

/// A record as a draft, and what was learnt on the way.
#[derive(Debug, Clone)]
pub(crate) struct Converted {
    pub draft: Draft,
    pub remarks: Vec<String>,
    pub doi: Option<String>,
    /// The agency that holds the record, where the record says so.
    pub agency: Option<&'static str>,
    /// Whether it is a part of a book, whose editors and ISBN this form of
    /// record leaves out.
    pub in_book: bool,
}

/// The publication type for a type of Crossref or of CSL. `None` for types
/// that say nothing ("other") and for those not known here.
fn entry_type(kind: &str) -> Option<&'static str> {
    Some(match kind {
        "journal-article" | "article-journal" | "article-magazine" | "article-newspaper" => "article",
        "book" | "monograph" => "book",
        "edited-book" => "collection",
        "reference-book" => "reference",
        "book-chapter" | "book-section" | "book-part" | "book-track" | "chapter" => "incollection",
        "reference-entry" | "entry-encyclopedia" | "entry-dictionary" | "entry" => "inreference",
        "proceedings-article" | "paper-conference" => "inproceedings",
        "proceedings" => "proceedings",
        "dissertation" | "thesis" => "thesis",
        // Preprints. DataCite calls them, and much else, "article".
        "posted-content" | "article" | "webpage" | "post" | "post-weblog" => "online",
        "report" | "report-component" => "report",
        "dataset" | "database" => "dataset",
        "software" => "software",
        "standard" => "standard",
        "journal-issue" | "journal-volume" | "journal" | "periodical" => "periodical",
        "review" | "review-book" => "review",
        "manuscript" | "speech" => "unpublished",
        "patent" => "patent",
        "pamphlet" => "booklet",
        "motion_picture" => "movie",
        "broadcast" => "video",
        "song" => "audio",
        "musical_score" => "music",
        "graphic" | "figure" => "image",
        "legislation" | "bill" => "legislation",
        "legal_case" => "jurisdiction",
        "personal_communication" => "letter",
        _ => return None,
    })
}

/// What holds a part: a journal, or a book.
fn is_part_of_book(entry_type: &str) -> bool {
    matches!(entry_type, "incollection" | "inbook" | "inreference" | "inproceedings")
}

/// All the strings of a field that may be a string or a list of strings.
fn strings(item: &Value, key: &str) -> Vec<String> {
    let one = |v: &Value| -> Option<String> {
        let s = match v {
            Value::String(s) => text::clean(s),
            Value::Number(n) => n.to_string(),
            _ => return None,
        };
        (!s.is_empty()).then_some(s)
    };
    match item.get(key) {
        Some(Value::Array(list)) => list.iter().filter_map(one).collect(),
        Some(v) => one(v).into_iter().collect(),
        None => Vec::new(),
    }
}

fn string(item: &Value, key: &str) -> Option<String> {
    strings(item, key).into_iter().next()
}

/// The printed form of a number that is given for several forms: `ISBN`
/// with `isbn-type`, `ISSN` with `issn-type`.
fn printed(item: &Value, key: &str, types: &str) -> Option<String> {
    let typed = item.get(types).and_then(Value::as_array).and_then(|list| {
        list.iter().find_map(|t| {
            let kind = t.get("type").and_then(Value::as_str)?;
            let value = t.get("value").and_then(Value::as_str)?.trim();
            (kind == "print" && !value.is_empty()).then(|| value.to_owned())
        })
    });
    typed.or_else(|| string(item, key))
}

fn one_person(value: &Value, remarks: &mut Vec<String>) -> Option<Person> {
    let get = |key: &str| value.get(key).and_then(Value::as_str).map(text::clean).filter(|s| !s.is_empty());
    // DataCite writes "(:unkn) unknown" and the like where it has no name.
    let known = |name: &String| !name.starts_with("(:");

    if let Some(name) = get("literal").or_else(|| get("name")).filter(known) {
        return Some(Person::literal(name));
    }
    match (get("family").filter(known), get("given").filter(known)) {
        (Some(family), Some(given)) if given.starts_with("The ") => {
            // A group entered as if it were a person: "Community, The Turing Way".
            let name = format!("{given} {family}");
            remarks.push(format!(
                "“{name}” was given as the name of a person, “{family}, {given}”, and has been taken as the name of a group."
            ));
            Some(Person::literal(name))
        }
        (Some(family), given) => {
            let mut person = text::person(&family, given.as_deref().unwrap_or(""), remarks);
            let particle = [get("non-dropping-particle"), get("dropping-particle")]
                .into_iter()
                .flatten()
                .collect::<Vec<_>>()
                .join(" ");
            if !particle.is_empty() {
                person.prefix =
                    if person.prefix.is_empty() { particle } else { format!("{particle} {}", person.prefix) };
            }
            if let Some(suffix) = get("suffix") {
                person.suffix = suffix;
            }
            Some(person)
        }
        // One name only: Homer.
        (None, Some(given)) => Some(Person { family: given, ..Default::default() }),
        (None, None) => None,
    }
}

fn people(item: &Value, key: &str, remarks: &mut Vec<String>) -> Vec<Person> {
    let Some(list) = item.get(key).and_then(Value::as_array) else { return Vec::new() };
    list.iter().filter_map(|p| one_person(p, remarks)).collect()
}

/// A date from `{"date-parts": [[2009, 9]]}`, with a second list for the end of a range.
fn date_of(value: &Value) -> Option<String> {
    let point = |p: &Value| -> Option<String> {
        let list = p.as_array()?;
        let number = |i: usize| list.get(i).and_then(|v| v.as_i64().or_else(|| v.as_str()?.trim().parse().ok()));
        text::date_from_parts(number(0)?, number(1), number(2))
    };
    if let Some(parts) = value.get("date-parts").and_then(Value::as_array)
        && let Some(start) = parts.first().and_then(point)
    {
        return Some(match parts.get(1).and_then(point) {
            Some(end) if end != start => format!("{start}/{end}"),
            _ => start,
        });
    }
    // Written out, where the parts are missing.
    let raw = value.get("raw").or_else(|| value.get("literal")).and_then(Value::as_str)?.trim();
    crate::bib::date::parse(raw).map(|_| raw.split('T').next().unwrap_or(raw).to_owned())
}

fn date(item: &Value) -> Option<String> {
    ["issued", "published-print", "published", "published-online"]
        .iter()
        .find_map(|key| item.get(*key).and_then(date_of))
}

/// A title without the subtitle that is also given on its own.
fn without_subtitle(title: &str, subtitle: &str) -> String {
    let t: Vec<char> = title.chars().collect();
    let s: Vec<char> = subtitle.chars().collect();
    if s.is_empty() || t.len() <= s.len() {
        return title.to_owned();
    }
    let tail = &t[t.len() - s.len()..];
    let same = tail.iter().zip(&s).all(|(a, b)| a.to_lowercase().eq(b.to_lowercase()));
    if !same {
        return title.to_owned();
    }
    let head: String = t[..t.len() - s.len()].iter().collect();
    let head = head.trim_end().trim_end_matches([':', '.', '–', '—', '-', ';']).trim_end();
    if head.is_empty() { title.to_owned() } else { head.to_owned() }
}

/// Eight digits, the last of which may be an X, with a hyphen in the middle.
pub(crate) fn is_issn(text: &str) -> bool {
    let digits: Vec<char> = text.chars().filter(|c| *c != '-').collect();
    digits.len() == 8
        && digits[..7].iter().all(char::is_ascii_digit)
        && (digits[7].is_ascii_digit() || matches!(digits[7], 'X' | 'x'))
}

fn put(draft: &mut Draft, name: &str, value: impl Into<String>) {
    let value = value.into();
    if !value.trim().is_empty() {
        draft.fields.insert(name.to_owned(), value);
    }
}

/// The edition as a number; the first is not told, as is the custom.
pub(crate) fn edition(text: &str) -> Option<String> {
    let t = text.trim();
    (!t.is_empty() && t != "1").then(|| t.to_owned())
}

/// The kind of thesis, as BibLaTeX names the two it knows.
fn degree(item: &Value) -> Option<&'static str> {
    let degree = string(item, "degree").or_else(|| string(item, "genre"))?.to_lowercase();
    if degree.contains("phd") || degree.contains("ph.d") || degree.contains("doctor") || degree.contains("dr.") {
        Some("phdthesis")
    } else if degree.contains("master")
        || degree.starts_with("ma")
        || degree.starts_with("msc")
        || degree.starts_with("m.")
    {
        Some("mathesis")
    } else {
        None
    }
}

/// The record as a draft. `None` when it holds nothing to make an entry of.
pub(crate) fn convert(item: &Value) -> Option<Converted> {
    if !item.is_object() {
        return None;
    }
    let mut remarks = Vec::new();
    let mut draft = Draft::default();

    let agency = match item.get("source").and_then(Value::as_str) {
        Some(s) if s.eq_ignore_ascii_case("crossref") => Some("Crossref"),
        // DataCite names itself nowhere, but only its records have the DOI as an address in `id`.
        _ if item.get("id").and_then(Value::as_str).is_some_and(|id| id.contains("doi.org/")) => Some("DataCite"),
        _ => None,
    };
    let doi = string(item, "DOI").and_then(|d| normalise_doi(&d));
    let arxiv = doi.as_deref().and_then(|d| d.strip_prefix("10.48550/arxiv.")).map(str::to_owned);

    let kind = item.get("type").and_then(Value::as_str).unwrap_or("").trim().to_ascii_lowercase();
    let containers = strings(item, "container-title");
    let has_pages = string(item, "page").is_some();
    let known = entry_type(&kind);
    // A part of a book that is called "other": it lies in something, and has pages or the book's ISBN.
    let part_by_signs = known.is_none()
        && !containers.is_empty()
        && (has_pages || string(item, "ISBN").is_some())
        && string(item, "ISSN").is_none();
    draft.entry_type = match known {
        Some(t) => t.to_owned(),
        None if part_by_signs => "incollection".to_owned(),
        None => {
            let named = if kind.is_empty() { "nothing".to_owned() } else { format!("“{kind}”") };
            remarks.push(format!(
                "The record calls the kind of publication {named}. It has been entered as “misc”: choose the right type."
            ));
            "misc".to_owned()
        }
    };
    let entry_type = draft.entry_type.clone();

    let langid = string(item, "language").and_then(|code| text::langid(&code));
    if let Some(l) = langid {
        put(&mut draft, "langid", l);
    }

    // People.
    for (key, field) in
        [("author", "author"), ("editor", "editor"), ("translator", "translator"), ("container-author", "bookauthor")]
    {
        let list = people(item, key, &mut remarks);
        if !list.is_empty() {
            draft.names.insert(field.to_owned(), list);
        }
    }

    // Titles.
    let subtitle = string(item, "subtitle").map(|s| text::title(&s, langid, &mut remarks));
    if let Some(raw) = string(item, "title") {
        let mut title = text::title(&raw, langid, &mut remarks);
        if let Some(sub) = &subtitle {
            title = without_subtitle(&title, sub);
        }
        put(&mut draft, "title", title);
    }
    if let Some(sub) = subtitle {
        put(&mut draft, "subtitle", sub);
    }

    // What it lies in, or belongs to.
    let container = |i: usize, remarks: &mut Vec<String>| containers.get(i).map(|c| text::title(c, langid, remarks));
    match entry_type.as_str() {
        "article" | "review" => {
            if let Some(journal) = container(0, &mut remarks) {
                let short = string(item, "container-title-short").or_else(|| string(item, "short-container-title"));
                if let Some(short) = short.filter(|s| *s != journal) {
                    put(&mut draft, "shortjournal", short);
                }
                put(&mut draft, "journaltitle", journal);
            }
        }
        t if is_part_of_book(t) => {
            // Where two are given, the first is the series and the last the book.
            if containers.len() > 1
                && let Some(series) = container(0, &mut remarks)
            {
                put(&mut draft, "series", series);
            }
            if let Some(book) = container(containers.len().saturating_sub(1), &mut remarks) {
                put(&mut draft, "booktitle", book);
            }
        }
        "book" | "collection" | "reference" | "proceedings" | "report" | "thesis" => {
            // For a whole book, what it lies in is its series.
            if let Some(series) = container(0, &mut remarks) {
                put(&mut draft, "series", series);
            }
        }
        _ => {}
    }

    // Numbers.
    if let Some(volume) = string(item, "volume") {
        let in_series = draft.fields.contains_key("series") && !is_part_of_book(&entry_type);
        put(&mut draft, if in_series { "number" } else { "volume" }, volume);
    }
    if let Some(issue) = string(item, "issue")
        && !draft.fields.contains_key("number")
    {
        put(&mut draft, "number", issue);
    }
    if let Some(page) = string(item, "page") {
        put(&mut draft, "pages", text::pages(&page));
    }
    if let Some(number) = string(item, "article-number") {
        put(&mut draft, "eid", number);
    }
    if let Some(e) = string(item, "edition-number").or_else(|| string(item, "edition")).and_then(|e| edition(&e)) {
        put(&mut draft, "edition", e);
    }
    if let Some(d) = date(item) {
        put(&mut draft, "date", d);
    }

    // Who brought it out. For articles Crossref has the member that holds the
    // DOI here (JSTOR for an article in Phoenix), which is not the publisher
    // of the journal, and BibLaTeX does not ask for one.
    if let Some(publisher) = string(item, "publisher") {
        let publisher = if text::is_capitals(&publisher) {
            let mended = text::recase_publisher(&publisher);
            if mended != publisher {
                remarks.push(format!("The publisher was in capitals, “{publisher}”, and has been written “{mended}”."));
            }
            mended
        } else {
            publisher
        };
        let institution = item
            .get("institution")
            .and_then(Value::as_array)
            .and_then(|list| list.iter().find_map(|i| i.get("name").and_then(Value::as_str)))
            .map(text::clean)
            .filter(|s| !s.is_empty());
        match entry_type.as_str() {
            "article" | "review" | "periodical" => {}
            "thesis" | "report" => put(&mut draft, "institution", institution.unwrap_or(publisher)),
            "online" | "software" => put(&mut draft, "organization", institution.unwrap_or(publisher)),
            _ => put(&mut draft, "publisher", publisher),
        }
    }
    if !matches!(entry_type.as_str(), "article" | "review" | "periodical")
        && let Some(place) = string(item, "publisher-location")
    {
        put(&mut draft, "location", place);
    }
    if entry_type == "thesis"
        && let Some(kind) = degree(item)
    {
        put(&mut draft, "type", kind);
    }

    // Identifiers.
    if let Some(isbn) = printed(item, "ISBN", "isbn-type").filter(|i| !normalise_isbns(i).is_empty()) {
        put(&mut draft, "isbn", isbn);
    }
    if matches!(entry_type.as_str(), "article" | "review" | "periodical")
        && let Some(issn) = printed(item, "ISSN", "issn-type").filter(|i| is_issn(i))
    {
        put(&mut draft, "issn", issn);
    }
    if let Some(d) = &doi {
        put(&mut draft, "doi", d.clone());
    }
    if let Some(id) = &arxiv {
        draft.entry_type = "online".to_owned();
        put(&mut draft, "eprint", id.clone());
        put(&mut draft, "eprinttype", "arxiv");
        // "Computation and Language (cs.CL)".
        let class = strings(item, "categories").into_iter().find_map(|c| {
            let inner = c.rsplit_once('(')?.1.strip_suffix(')')?.to_owned();
            (inner.contains('.') || inner.contains('-')).then_some(inner)
        });
        if let Some(class) = class {
            put(&mut draft, "eprintclass", class);
        }
        // The date here is the year alone; arXiv itself has the day.
        if draft.get("date").is_some_and(|d| d.len() == 4) {
            remarks.push(format!(
                "Only the year is given here. Looking up arXiv:{id} gives the day the preprint was sent in."
            ));
        }
    }
    if let Some(url) = string(item, "URL") {
        // The address of the DOI says nothing that the DOI does not.
        if url.starts_with("http") && !(doi.is_some() && url.contains("doi.org/")) {
            put(&mut draft, "url", url);
        }
    }
    if let Some(version) = string(item, "version")
        && matches!(draft.entry_type.as_str(), "software" | "dataset" | "online" | "report" | "misc" | "manual")
    {
        put(&mut draft, "version", version);
    }
    if let Some(summary) = string(item, "abstract") {
        put(&mut draft, "abstract", text::abstract_text(&summary));
    }

    if draft.get("title").is_none() && draft.names.is_empty() {
        return None;
    }
    let creators = ["author", "editor"].iter().any(|f| draft.names.contains_key(*f));
    if !creators {
        remarks.push("The record names no author or editor.".to_owned());
    }
    let in_book = is_part_of_book(&draft.entry_type);
    Some(Converted { draft, remarks, doi, agency, in_book })
}

#[cfg(test)]
mod tests {
    use super::super::samples;
    use super::*;

    fn converted(json: &str) -> Converted {
        convert(&serde_json::from_str(json).unwrap()).unwrap()
    }

    fn fields(c: &Converted) -> Vec<(&str, &str)> {
        c.draft.fields.iter().map(|(k, v)| (k.as_str(), v.as_str())).collect()
    }

    #[test]
    fn a_journal_article() {
        let c = converted(samples::DOI_ARTICLE);
        assert_eq!(c.draft.key, "");
        assert_eq!(c.draft.entry_type, "article");
        assert_eq!(
            fields(&c),
            vec![
                ("date", "2009-09"),
                ("doi", "10.1086/599247"),
                ("issn", "0002-9602"),
                ("journaltitle", "American Journal of Sociology"),
                ("langid", "english"),
                ("number", "2"),
                ("pages", "405–450"),
                ("title", "Origins of Homophily in an Evolving Social Network"),
                ("volume", "115"),
            ]
        );
        assert_eq!(
            c.draft.names["author"],
            vec![Person::new("Kossinets", "Gueorgi"), Person::new("Watts", "Duncan J.")]
        );
        assert_eq!(c.draft.names.len(), 1);
        assert_eq!(c.agency, Some("Crossref"));
        assert!(c.remarks.is_empty(), "{:?}", c.remarks);
        assert!(!c.in_book);
    }

    #[test]
    fn markup_in_a_title() {
        let c = converted(samples::DOI_REVIEW);
        assert_eq!(
            c.draft.get("title"),
            Some("The Best of the Achaens: Concepts of the Hero in Archaic Greek Poetry. Gregory Nagy")
        );
        assert_eq!(c.draft.get("journaltitle"), Some("Classical Philology"));
        assert_eq!(c.draft.get("pages"), Some("65–70"));
        assert_eq!(c.draft.get("date"), Some("1982-01"));
        assert_eq!(c.draft.get("issn"), Some("0009-837X"));
        assert!(c.draft.get("publisher").is_none() && c.draft.get("url").is_none());
        assert_eq!(c.draft.names["author"], vec![Person::new("Combellack", "Frederick M.")]);
    }

    #[test]
    fn a_chapter_as_far_as_this_form_has_it() {
        let c = converted(samples::DOI_CHAPTER);
        assert_eq!(c.draft.entry_type, "incollection");
        assert!(c.in_book);
        assert_eq!(
            fields(&c),
            vec![
                ("booktitle", "Homeric Contexts"),
                ("date", "2012-04-12"),
                ("doi", "10.1515/9783110272017.27"),
                ("pages", "27–72"),
                ("publisher", "De Gruyter"),
                ("title", "Signs of Hero Cult in Homeric Poetry"),
            ]
        );
        assert_eq!(c.remarks, vec!["The publisher was in capitals, “DE GRUYTER”, and has been written “De Gruyter”."]);
        assert!(!c.draft.names.contains_key("editor"));
    }

    #[test]
    fn an_edited_book_with_its_subtitle() {
        let c = converted(samples::DOI_EDITED_BOOK);
        assert_eq!(c.draft.entry_type, "collection");
        assert_eq!(c.draft.get("title"), Some("Homeric Contexts"));
        assert_eq!(c.draft.get("subtitle"), Some("Neoanalysis and the Interpretation of Oral Poetry"));
        assert_eq!(c.draft.get("isbn"), Some("9783110271959"));
        assert_eq!(c.draft.get("publisher"), Some("De Gruyter"));
        assert_eq!(c.draft.get("date"), Some("2012-04-12"));
        assert_eq!(
            c.draft.names["editor"],
            vec![
                Person::new("Montanari", "Franco"),
                Person::new("Rengakos", "Antonios"),
                Person::new("Tsagalis", "Christos C.")
            ]
        );
        assert!(!c.draft.names.contains_key("author"));
        // An empty list for what it lies in is no series.
        assert!(c.draft.get("series").is_none());
    }

    #[test]
    fn a_chapter_that_is_called_other() {
        let c = converted(samples::DOI_PEARL);
        assert_eq!(c.draft.entry_type, "incollection");
        assert!(c.in_book);
        assert_eq!(c.draft.get("title"), Some("Introduction to Probabilities, Graphs, and Causal Models"));
        assert_eq!(c.draft.get("booktitle"), Some("Causality"));
        assert_eq!(c.draft.get("edition"), Some("2"));
        assert_eq!(c.draft.get("pages"), Some("1–40"));
        // The printed book, not the electronic one that stands first.
        assert_eq!(c.draft.get("isbn"), Some("9780521895606"));
        assert_eq!(c.draft.get("doi"), Some("10.1017/cbo9780511803161.003"));
        assert_eq!(c.remarks, vec!["The record names no author or editor."]);
    }

    #[test]
    fn a_chapter_whose_series_stands_for_its_book() {
        let c = converted(samples::DOI_SERIES);
        assert_eq!(c.draft.entry_type, "incollection");
        // This is what the record says. The book is known only to the other form of the record.
        assert_eq!(c.draft.get("booktitle"), Some("Lecture Notes in Computer Science"));
        assert_eq!(c.draft.get("location"), Some("Cham"));
        assert_eq!(c.draft.get("isbn"), Some("9783319105895"));
        assert!(c.draft.get("issn").is_none());
        assert_eq!(c.draft.get("pages"), Some("818–833"));
    }

    #[test]
    fn software_from_datacite() {
        let c = converted(samples::DOI_ZENODO);
        assert_eq!(c.agency, Some("DataCite"));
        assert_eq!(c.draft.entry_type, "software");
        assert_eq!(c.draft.get("title"), Some("The Turing Way: A Handbook for Reproducible Data Science"));
        assert_eq!(c.draft.get("doi"), Some("10.5281/zenodo.3233986"));
        assert_eq!(c.draft.get("url"), Some("https://zenodo.org/record/3233986"));
        assert_eq!(c.draft.get("version"), Some("v0.0.4"));
        assert_eq!(c.draft.get("organization"), Some("Zenodo"));
        assert_eq!(c.draft.get("date"), Some("2019-03-25"));
        assert!(c.draft.get("abstract").unwrap().starts_with("Reproducible research is necessary"));
        let authors = &c.draft.names["author"];
        assert_eq!(authors[0], Person::literal("The Turing Way Community"));
        assert_eq!(authors[1], Person::new("Arnold", "Becky"));
        assert_eq!(c.remarks.len(), 1);
        assert!(c.remarks[0].contains("has been taken as the name of a group"));
    }

    #[test]
    fn a_preprint_from_datacite() {
        let c = converted(samples::DOI_ARXIV);
        assert_eq!(c.draft.entry_type, "online");
        assert_eq!(c.draft.get("eprint"), Some("1706.03762"));
        assert_eq!(c.draft.get("eprinttype"), Some("arxiv"));
        assert_eq!(c.draft.get("eprintclass"), Some("cs.CL"));
        assert_eq!(c.draft.get("doi"), Some("10.48550/arxiv.1706.03762"));
        assert_eq!(c.draft.get("url"), Some("https://arxiv.org/abs/1706.03762"));
        assert_eq!(c.draft.get("date"), Some("2017"));
        assert_eq!(c.draft.get("organization"), Some("arXiv"));
        assert_eq!(c.draft.names["author"].len(), 8);
        assert_eq!(c.draft.names["author"][5], Person::new("Gomez", "Aidan N."));
        assert_eq!(c.remarks.len(), 1);
    }

    #[test]
    fn records_as_a_search_gives_them() {
        let found: Value = serde_json::from_str(samples::CROSSREF_SEARCH).unwrap();
        let items = found["message"]["items"].as_array().unwrap();
        let all: Vec<Converted> = items.iter().filter_map(convert).collect();
        assert_eq!(all.len(), 5);

        assert_eq!(
            all[0].draft.get("title"),
            Some("The Best of the Achaeans: Concepts of the Hero in Archaic Greek Poetry")
        );
        assert_eq!(all[0].draft.get("journaltitle"), Some("Phoenix"));
        assert_eq!(all[0].draft.get("date"), Some("1981"));
        assert_eq!(all[0].draft.get("pages"), Some("276"));
        assert!(all[0].draft.get("publisher").is_none(), "JSTOR is not the publisher of Phoenix");
        assert!(all[0].draft.get("shortjournal").is_none(), "the same as the title");

        // A full stop that ends the title goes; one that ends an abbreviation stays.
        assert!(all[2].draft.get("title").unwrap().ends_with("Johns Hopkins University Press, 1980. £9 ($18.75)"));
        assert_eq!(all[2].draft.get("shortjournal"), Some("The Class. Rev."));
        assert_eq!(all[2].draft.get("issn"), Some("0009-840X"));

        // Capitals in part are left alone, initials are set apart.
        assert!(all[3].draft.get("title").unwrap().starts_with("G. NAGY, The Best of Achaeans."));
        assert_eq!(all[3].draft.names["author"], vec![Person::new("Verdenius", "W. J.")]);
        assert_eq!(all[3].draft.get("number"), Some("1-2"));
        assert_eq!(all[3].draft.get("pages"), Some("180–181"));

        assert!(all[4].draft.get("title").unwrap().starts_with("The Best of the Achaens"));
    }

    #[test]
    fn chapters_as_a_search_gives_them() {
        let found: Value = serde_json::from_str(samples::CROSSREF_CHAPTERS).unwrap();
        let all: Vec<Converted> = found["message"]["items"].as_array().unwrap().iter().filter_map(convert).collect();
        assert_eq!(all.len(), 5);
        assert!(all.iter().all(|c| c.draft.entry_type == "incollection" && c.in_book));
        let indices = all.iter().find(|c| c.draft.get("title") == Some("Indices")).unwrap();
        assert!(indices.draft.names.is_empty());
        assert!(indices.remarks.contains(&"The record names no author or editor.".to_owned()));
        assert_eq!(indices.draft.get("pages"), Some("631–698"));
    }

    #[test]
    fn what_is_wrong_or_missing_does_no_harm() {
        for json in ["null", "[]", "\"text\"", "12", "{}", r#"{"type": 5, "title": {"a": 1}, "author": "Homer"}"#] {
            assert!(convert(&serde_json::from_str(json).unwrap()).is_none(), "{json}");
        }
        let c = converted(
            r#"{"type": "other", "title": ["", "ODYSSEY OF THE MIND"], "subtitle": [null, []],
                "author": [null, 7, {}, {"family": ""}, {"name": "Center for Hellenic Studies"}, {"family": "(:unkn) unknown"},
                           {"given": "Homer"}, {"family": "Beethoven", "given": "Ludwig", "non-dropping-particle": "van"},
                           {"family": "King", "given": "Martin Luther", "suffix": "Jr."}],
                "issued": {"date-parts": [[null]]}, "published": {"date-parts": [["1999", "13"]]},
                "volume": 12, "page": 7, "ISBN": "not a list", "isbn-type": "x", "language": "tlh",
                "container-title": null, "DOI": "none", "URL": 1}"#,
        );
        assert_eq!(c.draft.entry_type, "misc");
        assert_eq!(c.draft.get("title"), Some("Odyssey of the Mind"));
        assert_eq!(c.draft.get("date"), Some("1999"));
        assert_eq!(c.draft.get("volume"), Some("12"));
        assert_eq!(c.draft.get("pages"), Some("7"));
        assert!(c.draft.get("doi").is_none() && c.draft.get("langid").is_none() && c.draft.get("subtitle").is_none());
        assert!(c.draft.get("isbn").is_none() && c.draft.get("url").is_none());
        let names: Vec<String> = c.draft.names["author"].iter().map(Person::to_bib).collect();
        assert_eq!(
            names,
            vec!["{Center for Hellenic Studies}", "Homer", "van Beethoven, Ludwig", "King, Jr., Martin Luther"]
        );
        assert_eq!(c.remarks.len(), 2, "{:?}", c.remarks);
        assert!(c.remarks[0].contains("“other”"));
        assert!(c.remarks[1].contains("in capitals"));
    }

    #[test]
    fn types() {
        for (kind, expected) in [
            ("journal-article", "article"),
            ("book-chapter", "incollection"),
            ("monograph", "book"),
            ("book", "book"),
            ("edited-book", "collection"),
            ("proceedings-article", "inproceedings"),
            ("dissertation", "thesis"),
            ("posted-content", "online"),
            ("report", "report"),
            ("dataset", "dataset"),
            ("reference-entry", "inreference"),
            ("article-journal", "article"),
            ("chapter", "incollection"),
            ("paper-conference", "inproceedings"),
            ("peer-review", "misc"),
        ] {
            let c = converted(&format!(r#"{{"type": "{kind}", "title": "T", "author": [{{"family": "A"}}]}}"#));
            assert_eq!(c.draft.entry_type, expected, "{kind}");
            assert_eq!(c.remarks.is_empty(), expected != "misc", "{kind}");
        }
        // A book in a series: the series is what it lies in, and its number there is the volume.
        let c = converted(
            r#"{"type": "monograph", "title": "T", "container-title": ["Hypomnemata"], "volume": "120", "publisher": "V&R", "author": [{"family": "A"}]}"#,
        );
        assert_eq!(
            (c.draft.get("series"), c.draft.get("number"), c.draft.get("volume")),
            (Some("Hypomnemata"), Some("120"), None)
        );
        // A thesis is brought out by an institution.
        let c = converted(
            r#"{"type": "dissertation", "title": "T", "publisher": "University of Oslo", "degree": ["PhD"], "author": [{"family": "A"}]}"#,
        );
        assert_eq!(
            (c.draft.get("institution"), c.draft.get("type"), c.draft.get("publisher")),
            (Some("University of Oslo"), Some("phdthesis"), None)
        );
        // Two containers for a chapter: the series, then the book.
        let c = converted(
            r#"{"type": "book-chapter", "title": "T", "container-title": ["Lecture Notes", "The Book"], "author": [{"family": "A"}]}"#,
        );
        assert_eq!((c.draft.get("series"), c.draft.get("booktitle")), (Some("Lecture Notes"), Some("The Book")));
    }

    #[test]
    fn a_subtitle_given_twice() {
        assert_eq!(without_subtitle("Homeric Contexts: Neoanalysis", "Neoanalysis"), "Homeric Contexts");
        assert_eq!(without_subtitle("Homeric Contexts. NEOANALYSIS", "Neoanalysis"), "Homeric Contexts");
        assert_eq!(without_subtitle("Homeric Contexts", "Neoanalysis"), "Homeric Contexts");
        assert_eq!(without_subtitle("Neoanalysis", "Neoanalysis"), "Neoanalysis");
        let c = converted(
            r#"{"type": "book", "title": "Être: et néant", "subtitle": ["Et néant"], "author": [{"family": "S"}]}"#,
        );
        assert_eq!((c.draft.get("title"), c.draft.get("subtitle")), (Some("Être"), Some("Et néant")));
    }

    #[test]
    fn dates() {
        let d = |json: &str| date(&serde_json::from_str(json).unwrap());
        assert_eq!(d(r#"{"issued": {"date-parts": [[2009, 9]]}}"#).as_deref(), Some("2009-09"));
        assert_eq!(d(r#"{"issued": {"date-parts": [[1979], [1985, 3]]}}"#).as_deref(), Some("1979/1985-03"));
        assert_eq!(d(r#"{"issued": {"date-parts": [[2009], [2009]]}}"#).as_deref(), Some("2009"));
        assert_eq!(d(r#"{"issued": {"raw": "2019-03-25T10:00:00Z"}}"#).as_deref(), Some("2019-03-25"));
        assert_eq!(d(r#"{"issued": {"raw": "in press"}}"#), None);
        assert_eq!(d(r#"{"issued": [[1981]]}"#), None);
        assert_eq!(
            d(r#"{"issued": {"date-parts": []}, "published-print": {"date-parts": [[1981]]}}"#).as_deref(),
            Some("1981")
        );
    }
}
