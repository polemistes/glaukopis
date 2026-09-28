//! Looking up a DOI.
//!
//! The resolver at doi.org is asked for the record as CSL-JSON, and passes
//! the question on to the agency that registered the DOI: Crossref, DataCite
//! or another. So the agency need not be known beforehand.
//!
//! For a chapter this form of the record has the title of the book and
//! nothing else of it. Crossref has the editors, the subtitle and the ISBN of
//! the book in another form of the same record (UNIXREF), which is asked for
//! as well when the record is a part of a book.
//!
//! The BibTeX that the resolver also offers is not used: it loses the
//! editors, makes keys that are not keys and puts the book of a chapter in
//! `journal`.

use std::time::Duration;

use serde_json::Value;

use crate::bib::names::Person;
use crate::duplicates::normalise_isbns;
use crate::error::{Error, Result};
use crate::net::{Client, encode, host};
use crate::tr;

use super::csl::{self, Converted};
use super::{
    Hit, Outcome, failure, pace, text, xml_child as child, xml_child_text as child_text, xml_text as text_within,
};

const CSL_JSON: &str = "application/vnd.citationstyles.csl+json";
const UNIXREF: &str = "application/vnd.crossref.unixref+xml";

/// What is said of a part that came without the names of those who wrote it.
fn no_creator() -> String {
    tr!("core-lookup-no-creators")
}

enum Answer {
    Record(String),
    /// The service is there and has nothing under this DOI.
    Nothing,
}

/// The DOI as part of an address. The slashes stay, all else that an address
/// cannot hold is encoded: DOIs may contain `<`, `#` and `;`.
fn path(doi: &str) -> String {
    doi.split('/').map(encode).collect::<Vec<_>>().join("/")
}

fn ask(client: &Client, url: &str, accept: &str) -> Result<Answer> {
    let response = client.get(url, Some(accept))?;
    let host = host(url);
    match response.status {
        200..=299 => Ok(Answer::Record(response.body)),
        404 | 410 => Ok(Answer::Nothing),
        406 => Err(Error::Network(tr!("core-lookup-wrong-form", host = &host))),
        429 => Err(Error::Network(tr!("network-wait", host = &host))),
        status => Err(Error::Network(tr!("network-status", host = &host, status = status))),
    }
}

/// The addresses at which a form of the record may be had: the resolver, and
/// the two large agencies themselves, for when the resolver cannot be reached.
fn addresses(doi: &str) -> [(&'static str, String); 3] {
    let path = path(doi);
    [
        ("doi.org", format!("https://doi.org/{path}")),
        ("Crossref", format!("https://api.crossref.org/works/{path}/transform")),
        ("DataCite", format!("https://data.crosscite.org/{path}")),
    ]
}

pub(crate) fn lookup(client: &Client, doi: &str) -> Result<Outcome> {
    let mut failures = Vec::new();
    let mut found = None;
    let mut denied = 0;
    let addresses = addresses(doi);
    for (service, url) in &addresses {
        pace(service, Duration::from_millis(250));
        match ask(client, url, CSL_JSON) {
            Ok(Answer::Record(body)) => {
                found = Some((*service, url.as_str(), body));
                break;
            }
            // What the resolver does not know, nobody knows. An agency that
            // does not know it leaves the other agency to ask.
            Ok(Answer::Nothing) if *service == "doi.org" => return Ok(Outcome::default()),
            Ok(Answer::Nothing) => denied += 1,
            Err(e) => failures.push(failure(service, &e)),
        }
    }
    let Some((service, url, body)) = found else {
        if denied > 0 {
            return Ok(Outcome { hits: Vec::new(), failures });
        }
        return Err(Error::Network(failures.join(" ")));
    };

    let record: Value = match serde_json::from_str(&body) {
        Ok(v) => v,
        Err(_) => {
            failures.push(tr!("core-lookup-not-a-record", service = service));
            return Err(Error::Network(failures.join(" ")));
        }
    };
    let Some(mut converted) = csl::convert(&record) else {
        return Ok(Outcome { hits: Vec::new(), failures });
    };

    if converted.in_book && converted.agency == Some("Crossref") {
        pace(service, Duration::from_millis(250));
        match ask(client, url, UNIXREF) {
            Ok(Answer::Record(xml)) => {
                if !with_book(&mut converted, &xml, doi) {
                    converted.remarks.push(tr!("core-lookup-book-unreadable"));
                }
            }
            Ok(Answer::Nothing) => {}
            Err(e) => {
                failures.push(failure(&tr!("core-lookup-crossref-for-book"), &e));
                converted.remarks.push(tr!("core-lookup-book-not-fetched"));
            }
        }
    }
    Ok(Outcome { hits: vec![hit(converted, service)], failures })
}

pub(crate) fn hit(converted: Converted, service: &str) -> Hit {
    Hit {
        source: converted.agency.unwrap_or(service).to_owned(),
        url: converted.doi.as_ref().map(|d| format!("https://doi.org/{}", path(d))),
        draft: converted.draft,
        remarks: converted.remarks,
    }
}

/// Those named with a role among the contributors of a book or a part of it.
fn contributors(node: roxmltree::Node, role: &str, remarks: &mut Vec<String>) -> Vec<Person> {
    let Some(list) = child(node, "contributors") else { return Vec::new() };
    list.children()
        .filter(|c| c.is_element() && c.attribute("contributor_role") == Some(role))
        .filter_map(|c| match c.tag_name().name() {
            "person_name" => {
                let family = child_text(c, "surname")?;
                let mut person = text::person(&family, &child_text(c, "given_name").unwrap_or_default(), remarks);
                if let Some(suffix) = child_text(c, "suffix") {
                    person.suffix = suffix;
                }
                Some(person)
            }
            "organization" => Some(Person::literal(text_within(c))).filter(|p| !p.is_empty()),
            _ => None,
        })
        .collect()
}

/// Completes the draft of a part of a book with what UNIXREF has about the
/// book. False when the record could not be read as one.
pub(crate) fn with_book(converted: &mut Converted, xml: &str, doi: &str) -> bool {
    let Ok(document) = roxmltree::Document::parse_with_options(xml, super::xml_options()) else { return false };
    let Some(book) = document.descendants().find(|n| n.is_element() && n.tag_name().name() == "book") else {
        return false;
    };
    // `book_metadata`, or `book_series_metadata` and `book_set_metadata` for a book in a series or a set.
    let Some(about) = book.children().find(|c| c.is_element() && c.tag_name().name().ends_with("_metadata")) else {
        return false;
    };
    let is_this = |item: &roxmltree::Node| {
        item.descendants()
            .filter(|n| n.is_element() && n.tag_name().name() == "doi")
            .any(|n| n.text().is_some_and(|t| t.trim().eq_ignore_ascii_case(doi)))
    };
    let parts: Vec<roxmltree::Node> =
        book.children().filter(|c| c.is_element() && c.tag_name().name() == "content_item").collect();
    let part = parts.iter().find(|p| is_this(p)).or(parts.first()).copied();

    let Converted { draft, remarks, .. } = converted;
    let langid = draft.get("langid").map(str::to_owned);
    let langid = langid.as_deref();
    let mut put = |name: &str, value: String| {
        if !value.trim().is_empty() {
            draft.fields.insert(name.to_owned(), value);
        }
    };

    if let Some(titles) = child(about, "titles") {
        if let Some(title) = child_text(titles, "title") {
            put("booktitle", text::title(&title, langid, remarks));
        }
        if let Some(subtitle) = child_text(titles, "subtitle") {
            put("booksubtitle", text::title(&subtitle, langid, remarks));
        }
    }
    if let Some(series) =
        about.children().find(|c| c.is_element() && matches!(c.tag_name().name(), "series_metadata" | "set_metadata"))
        && let Some(title) = child(series, "titles").and_then(|t| child_text(t, "title"))
    {
        put("series", text::title(&title, langid, remarks));
        if let Some(number) = child_text(about, "volume") {
            put("number", number);
        }
    }
    if let Some(edition) = child_text(about, "edition_number").and_then(|e| csl::edition(&e)) {
        put("edition", edition);
    }
    let isbns: Vec<roxmltree::Node> =
        about.children().filter(|c| c.is_element() && c.tag_name().name() == "isbn").collect();
    let isbn = isbns
        .iter()
        .find(|i| i.attribute("media_type") == Some("print"))
        .or(isbns.first())
        .map(|i| text_within(*i))
        .filter(|i| !normalise_isbns(i).is_empty());
    if let Some(isbn) = isbn {
        put("isbn", isbn);
    }
    if let Some(publisher) = child(about, "publisher")
        && let Some(place) = child_text(publisher, "publisher_place")
    {
        put("location", place);
    }
    if let Some(pages) = part.and_then(|p| child(p, "pages"))
        && let Some(first) = child_text(pages, "first_page")
    {
        let range = match child_text(pages, "last_page") {
            Some(last) if last != first => format!("{first}–{last}"),
            _ => first,
        };
        draft.fields.entry("pages".to_owned()).or_insert(range);
    }

    let editors = contributors(about, "editor", remarks);
    let authors = contributors(about, "author", remarks);
    let translators = contributors(about, "translator", remarks);
    if !translators.is_empty() && !draft.names.contains_key("translator") {
        draft.names.insert("translator".to_owned(), translators);
    }
    if !editors.is_empty() {
        draft.names.insert("editor".to_owned(), editors);
    } else if !authors.is_empty() {
        // A book by one author, of which this is a chapter.
        if draft.entry_type == "incollection" {
            draft.entry_type = "inbook".to_owned();
        }
        if !draft.names.contains_key("author") {
            let of_part = part.map(|p| contributors(p, "author", remarks)).unwrap_or_default();
            if of_part.is_empty() {
                remarks.push(tr!("core-lookup-chapter-author"));
                draft.names.insert("author".to_owned(), authors.clone());
            } else {
                draft.names.insert("author".to_owned(), of_part);
            }
        }
        draft.names.insert("bookauthor".to_owned(), authors);
    }
    if draft.names.contains_key("author") || draft.names.contains_key("editor") {
        let no_creator = no_creator();
        remarks.retain(|r| *r != no_creator);
    }
    true
}

#[cfg(test)]
mod tests {
    use super::super::samples;
    use super::*;

    fn chapter(json: &str, xml: &str, doi: &str) -> Hit {
        let mut converted = csl::convert(&serde_json::from_str(json).unwrap()).unwrap();
        assert!(with_book(&mut converted, xml, doi));
        hit(converted, "doi.org")
    }

    fn fields(hit: &Hit) -> Vec<(&str, &str)> {
        hit.draft.fields.iter().map(|(k, v)| (k.as_str(), v.as_str())).collect()
    }

    #[test]
    fn a_chapter_with_the_editors_of_its_book() {
        let hit = chapter(samples::DOI_CHAPTER, samples::UNIXREF_CHAPTER, "10.1515/9783110272017.27");
        assert_eq!(hit.draft.entry_type, "incollection");
        assert_eq!(hit.draft.key, "");
        assert_eq!(
            fields(&hit),
            vec![
                ("booksubtitle", "Neoanalysis and the Interpretation of Oral Poetry"),
                ("booktitle", "Homeric Contexts"),
                ("date", "2012-04-12"),
                ("doi", "10.1515/9783110272017.27"),
                ("isbn", "978-3-11-027195-9"),
                ("pages", "27–72"),
                ("publisher", "De Gruyter"),
                ("title", "Signs of Hero Cult in Homeric Poetry"),
            ]
        );
        assert_eq!(hit.draft.names["author"], vec![Person::new("Nagy", "Gregory")]);
        assert_eq!(
            hit.draft.names["editor"],
            vec![
                Person::new("Montanari", "Franco"),
                Person::new("Rengakos", "Antonios"),
                Person::new("Tsagalis", "Christos C.")
            ]
        );
        assert_eq!(hit.draft.names.len(), 2);
        assert_eq!(hit.source, "Crossref");
        assert_eq!(hit.url.as_deref(), Some("https://doi.org/10.1515/9783110272017.27"));
        assert_eq!(
            hit.remarks,
            vec!["The publisher was in capitals, “DE GRUYTER”, and has been written “De Gruyter”."]
        );
    }

    #[test]
    fn a_chapter_without_author_in_a_book_by_one_author() {
        let hit = chapter(samples::DOI_PEARL, samples::UNIXREF_PEARL, "10.1017/cbo9780511803161.003");
        assert_eq!(hit.draft.entry_type, "inbook");
        assert_eq!(
            fields(&hit),
            vec![
                ("booksubtitle", "Models, Reasoning, and Inference"),
                ("booktitle", "Causality"),
                ("date", "2009-09-14"),
                ("doi", "10.1017/cbo9780511803161.003"),
                ("edition", "2"),
                ("isbn", "9780521895606"),
                ("pages", "1–40"),
                ("publisher", "Cambridge University Press"),
                ("title", "Introduction to Probabilities, Graphs, and Causal Models"),
            ]
        );
        assert_eq!(hit.draft.names["author"], vec![Person::new("Pearl", "Judea")]);
        assert_eq!(hit.draft.names["bookauthor"], vec![Person::new("Pearl", "Judea")]);
        assert!(!hit.draft.names.contains_key("editor"));
        assert_eq!(
            hit.remarks,
            vec!["Crossref names no author for the chapter. The author of the book has been entered as its author."]
        );
    }

    #[test]
    fn a_chapter_of_a_book_in_a_series() {
        let hit = chapter(samples::DOI_SERIES, samples::UNIXREF_SERIES, "10.1007/978-3-319-10590-1_53");
        assert_eq!(hit.draft.entry_type, "incollection");
        assert_eq!(hit.draft.get("title"), Some("Visualizing and Understanding Convolutional Networks"));
        // The series had been given as the book.
        assert_eq!(hit.draft.get("booktitle"), Some("Computer Vision – ECCV 2014"));
        assert_eq!(
            hit.draft.get("booksubtitle"),
            Some("13th European Conference, Zurich, Switzerland, September 6-12, 2014, Proceedings, Part I")
        );
        assert_eq!(hit.draft.get("series"), Some("Lecture Notes in Computer Science"));
        assert_eq!(hit.draft.get("number"), Some("8689"));
        assert_eq!(hit.draft.get("isbn"), Some("978-3-319-10589-5"));
        assert_eq!(hit.draft.get("location"), Some("Cham"));
        assert_eq!(hit.draft.get("publisher"), Some("Springer International Publishing"));
        assert_eq!(hit.draft.get("pages"), Some("818–833"));
        assert_eq!(hit.draft.get("langid"), Some("english"));
        assert_eq!(hit.draft.names["author"], vec![Person::new("Zeiler", "Matthew D."), Person::new("Fergus", "Rob")]);
        assert_eq!(hit.draft.names["editor"].len(), 4);
        assert_eq!(hit.draft.names["editor"][3], Person::new("Tuytelaars", "Tinne"));
        assert!(hit.remarks.is_empty(), "{:?}", hit.remarks);
    }

    #[test]
    fn what_is_not_a_record_of_a_book() {
        let mut converted = csl::convert(&serde_json::from_str(samples::DOI_CHAPTER).unwrap()).unwrap();
        let before = converted.draft.clone();
        for xml in [
            "",
            "not xml",
            "<doi_records/>",
            "<book/>",
            "<book><content_item/></book>",
            "<html><body>Error</body></html>",
        ] {
            assert!(!with_book(&mut converted, xml, "10.1/x"), "{xml}");
        }
        assert_eq!(converted.draft, before);
        // A book of which nothing is said changes nothing either.
        assert!(with_book(
            &mut converted,
            "<book><book_metadata><titles/><contributors><person_name/></contributors></book_metadata></book>",
            "10.1/x"
        ));
        assert_eq!(converted.draft, before);
    }

    #[test]
    fn addresses_of_dois() {
        assert_eq!(path("10.1086/599247"), "10.1086/599247");
        assert_eq!(
            path("10.1002/(sici)1097-4679(199910)55:10<1243::aid-jclp6>3.0.co;2-n"),
            "10.1002/%28sici%291097-4679%28199910%2955%3A10%3C1243%3A%3Aaid-jclp6%3E3.0.co%3B2-n"
        );
        let all = addresses("10.1086/599247");
        assert_eq!(all[0].1, "https://doi.org/10.1086/599247");
        assert_eq!(all[1].1, "https://api.crossref.org/works/10.1086/599247/transform");
        assert_eq!(all[2].1, "https://data.crosscite.org/10.1086/599247");
    }
}
