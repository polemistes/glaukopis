//! The catalogues of libraries, which are asked by SRU and answer in MARC 21.
//!
//! For books they are what Crossref is for articles. K10plus, the union
//! catalogue of the German academic libraries, had the best records of all
//! the sources that were tried, for books in every language tried. The
//! catalogue of the Norwegian academic libraries has what is published in
//! Norway; the Deutsche Nationalbibliothek what is published in Germany; the
//! Library of Congress is asked last, as it answers less reliably.
//!
//! One ISBN often has several records: editions that kept the ISBN, and
//! e-books that name the printed book. They are all returned, the likeliest
//! first, and the user chooses.

use std::time::Duration;

use crate::duplicates::to_isbn10;
use crate::error::{Error, Result};
use crate::net::{Client, encode};
use crate::tr;

use super::marc::{Described, Facts, Kind, Record, describe};
use super::{Hit, pace};

pub(crate) struct Catalogue {
    /// As the user is told. The Norwegian licence (NLOD) asks that the source be named.
    pub name: fn() -> String,
    /// The address up to the question, with the form of record asked for.
    address: &'static str,
    /// The index that ISBNs are looked up in.
    isbn: &'static str,
    /// The question for books that have all of the words, where the catalogue is searched by words.
    words: Option<fn(&[String]) -> String>,
    /// The page about a record.
    page: fn(&Facts) -> Option<String>,
}

pub(crate) const K10PLUS: Catalogue = Catalogue {
    name: || "K10plus".to_owned(),
    address: "https://sru.k10plus.de/opac-de-627?version=1.1&operation=searchRetrieve&recordSchema=marcxml",
    isbn: "pica.isb",
    words: Some(|words| {
        // A word may be of the title or of a name. Searching all fields at
        // once brought up books that had nothing to do with the question. The
        // last part asks for printed books alone: without it articles come
        // first, and e-books, whose records are poorer.
        let each: Vec<String> = words.iter().map(|w| format!("(pica.tit=\"{w}\" or pica.per=\"{w}\")")).collect();
        format!("{} and (pica.bbg=Aa* or pica.bbg=Af*)", each.join(" and "))
    }),
    page: |facts| facts.id.as_ref().map(|id| format!("https://opac.k10plus.de/DB=2.299/PPNSET?PPN={}", encode(id))),
};

pub(crate) const NORWAY: Catalogue = Catalogue {
    name: || tr!("core-lookup-sikt"),
    address: "https://bibsys.alma.exlibrisgroup.com/view/sru/47BIBSYS_NETWORK?version=1.2&operation=searchRetrieve&recordSchema=marcxml",
    isbn: "alma.isbn",
    // This catalogue does not take brackets in a question, so title and name
    // cannot be asked for as alternatives; all fields are searched instead.
    words: Some(|words| format!("alma.all_for_ui all \"{}\" and alma.bib_level=m", words.join(" "))),
    page: |_| None,
};

pub(crate) const DNB: Catalogue = Catalogue {
    name: || "Deutsche Nationalbibliothek".to_owned(),
    address: "https://services.dnb.de/sru/dnb?version=1.1&operation=searchRetrieve&recordSchema=MARC21-xml",
    isbn: "num",
    words: None,
    page: |facts| facts.id.as_ref().map(|id| format!("https://d-nb.info/{}", encode(id))),
};

/// Reached without encryption only. Without `startRecord` it answered that
/// there was one record and gave none.
pub(crate) const CONGRESS: Catalogue = Catalogue {
    name: || "Library of Congress".to_owned(),
    address: "http://lx2.loc.gov:210/lcdb?version=1.1&operation=searchRetrieve&recordSchema=marcxml&startRecord=1",
    isbn: "bath.isbn",
    words: None,
    page: |facts| facts.lccn.as_ref().map(|n| format!("https://lccn.loc.gov/{}", encode(n))),
};

/// The catalogues to ask for an ISBN, in their order. The beginning of an
/// ISBN tells where the book was published: 978-82 is Norway, 978-3 the
/// German-speaking countries.
pub(crate) fn for_isbn(isbn13: &str) -> Vec<&'static Catalogue> {
    if isbn13.starts_with("97882") {
        vec![&NORWAY, &K10PLUS, &CONGRESS]
    } else if isbn13.starts_with("9783") {
        vec![&K10PLUS, &DNB, &NORWAY, &CONGRESS]
    } else {
        vec![&K10PLUS, &NORWAY, &CONGRESS]
    }
}

/// The catalogues that are searched by words.
pub(crate) fn for_words() -> [&'static Catalogue; 2] {
    [&K10PLUS, &NORWAY]
}

impl Catalogue {
    fn ask(&self, client: &Client, question: &str, records: usize) -> Result<String> {
        pace(self.address, Duration::from_millis(500));
        let url = format!("{}&maximumRecords={records}&query={}", self.address, encode(question));
        client.get_ok(&url, None)
    }

    /// Older books are in some catalogues under the ISBN of ten digits that
    /// they were given, so both forms are asked for.
    pub fn question_for_isbn(&self, isbn13: &str) -> String {
        match to_isbn10(isbn13) {
            Some(isbn10) => format!("{0}={isbn13} or {0}={isbn10}", self.isbn),
            None => format!("{}={isbn13}", self.isbn),
        }
    }

    pub fn question_for_words(&self, words: &[String]) -> Option<String> {
        // What a question is written with cannot be part of a word in it.
        let words: Vec<String> = words
            .iter()
            .map(|w| w.chars().filter(|c| c.is_alphanumeric() || matches!(c, '\'' | '’' | '-')).collect::<String>())
            .filter(|w| !w.is_empty())
            .take(8)
            .collect();
        match self.words {
            Some(question) if !words.is_empty() => Some(question(&words)),
            _ => None,
        }
    }

    pub fn by_isbn(&self, client: &Client, isbn13: &str) -> Result<Vec<Hit>> {
        let xml = self.ask(client, &self.question_for_isbn(isbn13), 10)?;
        self.hits_for_isbn(&xml, isbn13)
    }

    pub fn by_words(&self, client: &Client, words: &[String], records: usize) -> Result<Vec<Hit>> {
        let Some(question) = self.question_for_words(words) else { return Ok(Vec::new()) };
        let xml = self.ask(client, &question, records.clamp(1, 20))?;
        self.hits_for_words(&xml)
    }

    fn hit(&self, described: Described) -> Hit {
        Hit {
            source: (self.name)(),
            url: (self.page)(&described.facts),
            draft: described.draft,
            remarks: described.remarks,
        }
    }

    /// The records of an answer as hits, the likeliest first: the printed
    /// book before the e-book, the record that has the ISBN as its own
    /// before the one that names it as that of another form, the newer
    /// edition before the older.
    pub fn hits_for_isbn(&self, xml: &str, isbn13: &str) -> Result<Vec<Hit>> {
        let mut found: Vec<Described> = records(xml)?.iter().filter_map(|r| describe(r, Some(isbn13))).collect();
        let own = |d: &Described| d.facts.isbns.iter().any(|i| i == isbn13);
        let year =
            |d: &Described| d.draft.get("date").map(|y| y.chars().take(4).collect::<String>()).unwrap_or_default();
        found.sort_by(|a, b| {
            let key = |d: &Described| {
                (own(d), d.facts.kind == Kind::Book && !d.facts.online, d.facts.kind == Kind::Book, year(d))
            };
            key(b).cmp(&key(a))
        });

        let first = found.first().map(|d| (own(d), d.facts.online, year(d), d.draft.get("edition").map(str::to_owned)));
        for (i, d) in found.iter_mut().enumerate() {
            if !own(d) {
                let theirs = d.draft.get("isbn").map(str::to_owned).unwrap_or_else(|| tr!("core-lookup-isbn-none"));
                d.remarks.push(if d.facts.other_isbns.iter().any(|i| i == isbn13) {
                    tr!("core-lookup-other-form", isbn = &theirs)
                } else {
                    tr!("core-lookup-other-isbn", isbn = &theirs)
                });
            } else if let (true, Some((true, false, first_year, first_edition))) = (i > 0 && !d.facts.online, &first) {
                let edition = d.draft.get("edition").map(str::to_owned);
                if year(d) != *first_year || edition != *first_edition {
                    let which = match (edition, year(d)) {
                        (Some(e), y) if !y.is_empty() && e.chars().all(|c| c.is_ascii_digit()) => {
                            tr!("core-lookup-edition-year", edition = e, year = y)
                        }
                        (_, y) if !y.is_empty() => y,
                        (Some(e), _) => e,
                        _ => tr!("core-lookup-without-year"),
                    };
                    d.remarks.push(tr!("core-lookup-another-edition", which = which));
                }
            }
        }
        Ok(found.into_iter().map(|d| self.hit(d)).collect())
    }

    pub fn hits_for_words(&self, xml: &str) -> Result<Vec<Hit>> {
        Ok(records(xml)?.iter().filter_map(|r| describe(r, None)).map(|d| self.hit(d)).collect())
    }
}

/// The records of an answer. An answer that tells of a failure is an error,
/// whatever the status it came with: the Library of Congress sends its
/// failures with 200.
pub(crate) fn records(xml: &str) -> Result<Vec<Record>> {
    let document = roxmltree::Document::parse_with_options(xml, super::xml_options())
        .map_err(|_| Error::Network(tr!("core-lookup-catalogue-unreadable")))?;
    let named = |n: &roxmltree::Node, name: &str| n.is_element() && n.tag_name().name() == name;
    let root = document.root_element();
    if !root.tag_name().name().ends_with("searchRetrieveResponse")
        && !named(&root, "record")
        && !named(&root, "collection")
    {
        return Err(Error::Network(tr!("core-lookup-not-a-catalogue")));
    }
    let records: Vec<Record> = document.descendants().filter(|n| named(n, "record")).filter_map(Record::read).collect();
    if records.is_empty() {
        let said = document.descendants().find(|n| named(n, "diagnostic")).map(|d| {
            let part = |name: &str| {
                d.children()
                    .find(|c| named(c, name))
                    .and_then(|c| c.text())
                    .map(str::trim)
                    .filter(|t| !t.is_empty())
                    .map(str::to_owned)
            };
            match (part("message"), part("details")) {
                (Some(message), Some(details)) => format!("{message} ({details})"),
                (Some(one), None) | (None, Some(one)) => one,
                (None, None) => part("uri").unwrap_or_else(|| tr!("core-lookup-no-reason")),
            }
        });
        if let Some(said) = said {
            return Err(Error::Network(tr!("core-lookup-catalogue-could-not-answer", said = said)));
        }
    }
    Ok(records)
}

#[cfg(test)]
mod tests {
    use super::super::samples;
    use super::*;

    #[test]
    fn questions() {
        assert_eq!(K10PLUS.question_for_isbn("9783406568442"), "pica.isb=9783406568442 or pica.isb=3406568440");
        assert_eq!(NORWAY.question_for_isbn("9788202413736"), "alma.isbn=9788202413736 or alma.isbn=8202413737");
        assert_eq!(CONGRESS.question_for_isbn("9780674033801"), "bath.isbn=9780674033801 or bath.isbn=0674033809");
        // There is no older form of an ISBN that begins with 979.
        assert_eq!(DNB.question_for_isbn("9791090636071"), "num=9791090636071");

        let words: Vec<String> = ["Nagy", "Best", "Achaeans"].iter().map(|w| (*w).to_owned()).collect();
        assert_eq!(
            K10PLUS.question_for_words(&words).unwrap(),
            "(pica.tit=\"Nagy\" or pica.per=\"Nagy\") and (pica.tit=\"Best\" or pica.per=\"Best\") and \
             (pica.tit=\"Achaeans\" or pica.per=\"Achaeans\") and (pica.bbg=Aa* or pica.bbg=Af*)"
        );
        assert_eq!(
            NORWAY.question_for_words(&words).unwrap(),
            "alma.all_for_ui all \"Nagy Best Achaeans\" and alma.bib_level=m"
        );
        assert!(DNB.question_for_words(&words).is_none() && CONGRESS.question_for_words(&words).is_none());
        // Nothing of what was typed can end the question early.
        let sly = vec!["\" or pica.all=\"x".to_owned(), "*".to_owned()];
        assert_eq!(NORWAY.question_for_words(&sly).unwrap(), "alma.all_for_ui all \"orpicaallx\" and alma.bib_level=m");
        assert!(K10PLUS.question_for_words(&[]).is_none());
    }

    #[test]
    fn the_order_of_catalogues() {
        let names = |isbn: &str| for_isbn(isbn).iter().map(|c| (c.name)()).collect::<Vec<_>>();
        assert_eq!(
            names("9788202413736"),
            vec!["Norwegian academic libraries (Sikt)", "K10plus", "Library of Congress"]
        );
        assert_eq!(
            names("9783406568442"),
            vec![
                "K10plus",
                "Deutsche Nationalbibliothek",
                "Norwegian academic libraries (Sikt)",
                "Library of Congress"
            ]
        );
        assert_eq!(
            names("9780674033818"),
            vec!["K10plus", "Norwegian academic libraries (Sikt)", "Library of Congress"]
        );
    }

    #[test]
    fn several_records_for_one_isbn() {
        let hits = K10PLUS.hits_for_isbn(samples::K10_ASSMANN, "9783406568442").unwrap();
        assert_eq!(hits.len(), 5);
        assert!(hits.iter().all(|h| h.source == "K10plus" && h.draft.key.is_empty()));

        // The printed book first, its newer edition before the older.
        assert_eq!((hits[0].draft.get("edition"), hits[0].draft.get("date")), (Some("7"), Some("2013")));
        assert!(hits[0].remarks.is_empty());
        assert_eq!(hits[0].url.as_deref(), Some("https://opac.k10plus.de/DB=2.299/PPNSET?PPN=160169881X"));
        assert_eq!((hits[1].draft.get("edition"), hits[1].draft.get("date")), (Some("6"), Some("2007")));
        assert_eq!(hits[1].remarks, vec!["Another edition with the same ISBN (edition 6, 2007)."]);

        // Then the e-books, which were found because they name the printed book.
        for hit in &hits[2..] {
            assert_eq!(hit.draft.get("isbn"), Some("978-3-406-70340-9"));
            assert_eq!(hit.remarks.len(), 2, "{:?}", hit.remarks);
            assert!(hit.remarks[0].starts_with("An e-book record"));
            assert_eq!(
                hit.remarks[1],
                "The ISBN asked for is that of another form of the book. The ISBN of what this record describes is 978-3-406-70340-9."
            );
        }
    }

    #[test]
    fn e_books_that_name_the_isbn_of_the_printed_book_as_their_own() {
        let hits = K10PLUS.hits_for_isbn(samples::K10_HARRIS, "9780674033818").unwrap();
        assert_eq!(hits.len(), 4);
        assert_eq!(hits[0].draft.get("date"), Some("1991"));
        assert_eq!(hits[0].draft.get("pagetotal"), Some("XV, 383"));
        assert!(hits[0].remarks.is_empty(), "{:?}", hits[0].remarks);
        assert!(hits[1..].iter().all(|h| h.remarks.iter().any(|r| r.starts_with("An e-book record"))));
        let years: Vec<&str> = hits[1..].iter().filter_map(|h| h.draft.get("date")).collect();
        assert_eq!(years, vec!["2009", "1991", "1989"]);
    }

    #[test]
    fn records_of_other_catalogues() {
        let hits = DNB.hits_for_isbn(samples::DNB_ASSMANN, "9783406568442").unwrap();
        assert_eq!(hits.len(), 2);
        assert_eq!(hits[0].url.as_deref(), Some("https://d-nb.info/1030500924"));
        assert_eq!(hits[0].draft.get("title"), Some("Das kulturelle Gedächtnis"));
        assert_eq!(hits[1].remarks, vec!["Another edition with the same ISBN (edition 6, 2007)."]);

        let hits = NORWAY.hits_for_isbn(samples::ALMA_REM, "9788202413736").unwrap();
        assert_eq!(hits.len(), 1);
        assert_eq!(hits[0].source, "Norwegian academic libraries (Sikt)");
        assert_eq!(hits[0].url, None);

        let hits = CONGRESS.hits_for_isbn(samples::LOC_HARRIS, "9780674033801").unwrap();
        assert_eq!(hits.len(), 1);
        assert_eq!(hits[0].url.as_deref(), Some("https://lccn.loc.gov/89007588"));
        assert!(hits[0].remarks.is_empty());

        let hits = NORWAY.hits_for_words(samples::ALMA_SEARCH).unwrap();
        assert_eq!(hits.len(), 7);
        let hits = K10PLUS.hits_for_words(samples::K10_NAGY).unwrap();
        assert_eq!(hits.len(), 5);
        assert!(hits.iter().all(|h| h.draft.entry_type == "book" && h.remarks.is_empty()));
    }

    #[test]
    fn nothing_found_and_failures() {
        assert!(records(samples::LOC_NOTHING).unwrap().is_empty());
        assert!(CONGRESS.hits_for_isbn(samples::LOC_NOTHING, "9780674033818").unwrap().is_empty());

        // Sent with the status 200, and with the number of records given as 1.
        let e = records(samples::LOC_DIAGNOSTIC).unwrap_err();
        assert_eq!(
            e.to_string(),
            "network: the catalogue could not answer the question: First record position out of range"
        );
        let e = records(samples::ALMA_INVALID).unwrap_err();
        assert_eq!(e.to_string(), "network: the catalogue could not answer the question: Invalid query");

        for answer in ["", "Service unavailable", "<html><body>503</body></html>", "<searchRetrieveResponse>"] {
            assert!(records(answer).is_err(), "{answer}");
        }
        assert!(
            records(
                "<searchRetrieveResponse><records><record><recordData/></record></records></searchRetrieveResponse>"
            )
            .unwrap()
            .is_empty()
        );
    }
}
