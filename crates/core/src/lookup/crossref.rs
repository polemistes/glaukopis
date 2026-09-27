//! Searching Crossref for articles.
//!
//! Crossref is where articles and chapters with a DOI are registered. It is
//! not a catalogue of books: a search for a book returns the reviews of it,
//! which is why books are searched for in library catalogues instead.
//!
//! It always answers with as many records as were asked for, however little
//! they have to do with the question. Those that share too few words with it
//! are left out here.

use std::time::Duration;

use serde_json::Value;

use crate::error::{Error, Result};
use crate::net::{Client, encode};

use super::{Hit, csl, doi, pace};

/// The fields asked for. `language` and `isbn-type` cannot be asked for in a
/// search, although full records have them: Crossref answers 400.
const SELECT: &str = "DOI,type,title,subtitle,author,editor,translator,container-title,short-container-title,\
                      publisher,publisher-location,issued,page,volume,issue,ISBN,ISSN,issn-type";

pub(crate) const SOURCE: &str = "Crossref";

pub(crate) fn address(words: &str, rows: usize) -> String {
    format!(
        "https://api.crossref.org/works?query.bibliographic={}&rows={}&select={SELECT}",
        encode(words),
        rows.clamp(1, 20)
    )
}

pub(crate) fn search(client: &Client, words: &str, rows: usize) -> Result<Vec<Hit>> {
    // One search a second is what Crossref allows those who give no address
    // to be reached at; with an address it is three.
    pace("api.crossref.org/works", Duration::from_millis(1000));
    let body = client.get_ok(&address(words, rows), Some("application/json"))?;
    hits(&body)
}

/// The records of an answer to a search.
pub(crate) fn hits(body: &str) -> Result<Vec<Hit>> {
    let unreadable = || Error::Network("api.crossref.org answered with something that could not be read".to_owned());
    let answer: Value = serde_json::from_str(body).map_err(|_| unreadable())?;
    let items = answer.get("message").and_then(|m| m.get("items")).and_then(Value::as_array).ok_or_else(unreadable)?;
    Ok(items
        .iter()
        .filter_map(csl::convert)
        .map(|mut converted| {
            converted.agency = Some(SOURCE);
            if converted.in_book {
                converted.remarks.push(
                    "A search does not give the editors and the ISBN of the book. Looking up the DOI does.".to_owned(),
                );
            }
            doi::hit(converted, SOURCE)
        })
        .collect())
}

#[cfg(test)]
mod tests {
    use super::super::samples;
    use super::*;

    #[test]
    fn the_address_of_a_search() {
        let a = address("Nagy, Best of the Achaeans", 10);
        assert!(a.starts_with("https://api.crossref.org/works?query.bibliographic=Nagy%2C%20Best%20of%20the%20Achaeans&rows=10&select=DOI,type,"));
        assert!(!a.contains("language") && !a.contains(' ') && !a.contains("mailto"));
        assert!(address("x", 500).contains("&rows=20&"));
    }

    #[test]
    fn what_a_search_finds() {
        let found = hits(samples::CROSSREF_SEARCH).unwrap();
        assert_eq!(found.len(), 5);
        assert!(
            found.iter().all(|h| h.source == "Crossref" && h.draft.entry_type == "article" && h.draft.key.is_empty())
        );
        assert_eq!(found[0].url.as_deref(), Some("https://doi.org/10.2307/1087661"));
        assert_eq!(found[4].draft.get("doi"), Some("10.1086/366680"));
        assert!(!found[4].draft.get("title").unwrap().contains('<'));
        assert!(found.iter().all(|h| h.remarks.is_empty()));

        let chapters = hits(samples::CROSSREF_CHAPTERS).unwrap();
        assert_eq!(chapters.len(), 5);
        assert_eq!(chapters[1].draft.get("title"), Some("Signs of Hero Cult in Homeric Poetry"));
        assert_eq!(chapters[1].draft.get("booktitle"), Some("Homeric Contexts"));
        assert!(chapters[1].remarks.iter().any(|r| r.contains("Looking up the DOI")));
    }

    #[test]
    fn answers_that_are_none() {
        for body in ["", "<html>Bad gateway</html>", "{}", r#"{"message": {}}"#, r#"{"message": {"items": 5}}"#, "[1]"]
        {
            assert!(hits(body).is_err(), "{body}");
        }
        assert!(hits(r#"{"message": {"items": []}}"#).unwrap().is_empty());
        assert!(hits(r#"{"message": {"items": [null, 5, {}, {"title": []}]}}"#).unwrap().is_empty());
    }
}
