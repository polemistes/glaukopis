//! Preprints at arXiv, by their identifier.
//!
//! arXiv asks that it be asked no more than once in three seconds, and that
//! products which use it say: "Thank you to arXiv for use of its open access
//! interoperability." (see [`super::ACKNOWLEDGEMENTS`]).

use std::time::Duration;

use crate::duplicates::normalise_doi;
use crate::error::{Error, Result};
use crate::library::entry::Draft;
use crate::net::{Client, encode};

use super::{Hit, pace, text, xml_child, xml_child_text};

pub(crate) const SOURCE: &str = "arXiv";

pub(crate) fn address(id: &str) -> String {
    let id = id.split('/').map(encode).collect::<Vec<_>>().join("/");
    format!("https://export.arxiv.org/api/query?id_list={id}")
}

pub(crate) fn lookup(client: &Client, id: &str) -> Result<Vec<Hit>> {
    pace("export.arxiv.org", Duration::from_secs(3));
    let xml = client.get_ok(&address(id), None)?;
    hits(
        &xml,
        id.rfind('v').is_some_and(|at| at > 0 && id[at + 1..].chars().all(|c| c.is_ascii_digit()) && at + 1 < id.len()),
    )
}

/// The identifier and the version from `http://arxiv.org/abs/1706.03762v7`.
fn identifier(address: &str) -> Option<(String, Option<String>)> {
    let id = address.split_once("/abs/")?.1.trim().trim_end_matches('/');
    if id.is_empty() {
        return None;
    }
    match id.rfind('v') {
        Some(at) if at > 0 && at + 1 < id.len() && id[at + 1..].chars().all(|c| c.is_ascii_digit()) => {
            Some((id[..at].to_owned(), Some(id[at + 1..].to_owned())))
        }
        _ => Some((id.to_owned(), None)),
    }
}

/// The entries of an answer. With `versioned`, a particular version was
/// asked for, and it is that version which is described; otherwise the
/// preprint as such, with the date it was first sent in.
pub(crate) fn hits(xml: &str, versioned: bool) -> Result<Vec<Hit>> {
    let document = roxmltree::Document::parse_with_options(xml, super::xml_options())
        .map_err(|_| Error::Network("export.arxiv.org answered with something that could not be read".to_owned()))?;
    let root = document.root_element();
    if root.tag_name().name() != "feed" {
        return Err(Error::Network(
            "export.arxiv.org answered with something that is not a list of preprints".to_owned(),
        ));
    }
    let mut out = Vec::new();
    // The list has a title of its own; titles are read within entries only.
    for entry in root.children().filter(|n| n.is_element() && n.tag_name().name() == "entry") {
        let address = xml_child_text(entry, "id").unwrap_or_default();
        if address.contains("/api/errors") {
            let said = xml_child_text(entry, "summary").unwrap_or_else(|| "no reason given".to_owned());
            return Err(Error::Network(format!("arXiv could not answer the question: {said}")));
        }
        let Some((id, version)) = identifier(&address) else { continue };
        let mut remarks = Vec::new();
        let mut draft = Draft { entry_type: "online".to_owned(), ..Default::default() };
        let mut put = |name: &str, value: String| {
            if !value.trim().is_empty() {
                draft.fields.insert(name.to_owned(), value);
            }
        };

        if let Some(title) = xml_child_text(entry, "title") {
            // Titles may hold TeX, which is kept: it is what the library writes formulas in.
            put("title", text::without_final_stop(&title).to_owned());
        }
        let dated = if versioned { "updated" } else { "published" };
        if let Some(day) = xml_child_text(entry, dated).and_then(|d| d.split('T').next().map(str::to_owned))
            && crate::bib::date::parse(&day).is_some()
        {
            put("date", day);
        }
        put("eprint", id.clone());
        put("eprinttype", "arxiv".to_owned());
        if let Some(class) = xml_child(entry, "primary_category").and_then(|c| c.attribute("term")) {
            put("eprintclass", text::clean(class));
        }
        let page = match (&version, versioned) {
            (Some(v), true) => {
                put("version", v.clone());
                format!("https://arxiv.org/abs/{id}v{v}")
            }
            _ => format!("https://arxiv.org/abs/{id}"),
        };
        put("url", page.clone());
        if let Some(summary) = xml_child_text(entry, "summary") {
            put("abstract", summary);
        }
        let published = xml_child_text(entry, "doi").and_then(|d| normalise_doi(&d));
        let journal = xml_child_text(entry, "journal_ref");
        if let Some(journal) = &journal {
            put("note", journal.clone());
        }
        match (&published, &journal) {
            (Some(doi), _) => {
                put("doi", doi.clone());
                remarks.push(format!(
                    "This preprint has since been published. The DOI entered is that of the published version: look up {doi} to cite that instead."
                ));
            }
            (None, Some(journal)) => remarks.push(format!("This preprint has since been published: {journal}.")),
            (None, None) => {}
        }

        let authors: Vec<_> = entry
            .children()
            .filter(|n| n.is_element() && n.tag_name().name() == "author")
            .filter_map(|a| xml_child_text(a, "name"))
            .map(|name| text::person_from_display(&name))
            .filter(|p| !p.is_empty())
            .collect();
        if !authors.is_empty() {
            draft.names.insert("author".to_owned(), authors);
        }
        if draft.get("title").is_none() && draft.names.is_empty() {
            continue;
        }
        out.push(Hit { draft, source: SOURCE.to_owned(), url: Some(page), remarks });
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::super::samples;
    use super::*;
    use crate::bib::names::Person;

    #[test]
    fn a_preprint() {
        let hits = hits(samples::ARXIV_ONE, false).unwrap();
        assert_eq!(hits.len(), 1);
        let h = &hits[0];
        assert_eq!(h.draft.entry_type, "online");
        assert_eq!(h.draft.key, "");
        let fields: Vec<(&str, &str)> =
            h.draft.fields.iter().filter(|(k, _)| *k != "abstract").map(|(k, v)| (k.as_str(), v.as_str())).collect();
        assert_eq!(
            fields,
            vec![
                ("date", "2017-06-12"),
                ("eprint", "1706.03762"),
                ("eprintclass", "cs.CL"),
                ("eprinttype", "arxiv"),
                ("title", "Attention Is All You Need"),
                ("url", "https://arxiv.org/abs/1706.03762"),
            ]
        );
        assert!(h.draft.get("abstract").unwrap().starts_with("The dominant sequence transduction models"));
        let authors = &h.draft.names["author"];
        assert_eq!(authors.len(), 8);
        assert_eq!(authors[0], Person::new("Vaswani", "Ashish"));
        assert_eq!(authors[5], Person::new("Gomez", "Aidan N."));
        assert_eq!(h.source, "arXiv");
        assert_eq!(h.url.as_deref(), Some("https://arxiv.org/abs/1706.03762"));
        assert!(h.remarks.is_empty());
    }

    #[test]
    fn a_version_of_a_preprint() {
        let hits = hits(samples::ARXIV_ONE, true).unwrap();
        let h = &hits[0];
        assert_eq!(h.draft.get("version"), Some("7"));
        assert_eq!(h.draft.get("date"), Some("2023-08-02"));
        assert_eq!(h.draft.get("eprint"), Some("1706.03762"));
        assert_eq!(h.draft.get("url"), Some("https://arxiv.org/abs/1706.03762v7"));
    }

    #[test]
    fn a_preprint_that_was_published() {
        let hits = hits(samples::ARXIV_TWO, false).unwrap();
        assert_eq!(hits.len(), 2);
        assert_eq!(hits[0].draft.get("title"), Some("Hybrid Intelligence for Digital Humanities"));
        let boer = &hits[0].draft.names["author"][0];
        assert_eq!((boer.given.as_str(), boer.prefix.as_str(), boer.family.as_str()), ("Victor", "de", "Boer"));
        assert!(hits[0].remarks.is_empty());

        let h = &hits[1];
        assert_eq!(h.draft.get("title"), Some("Data Lakes for Digital Humanities"));
        assert_eq!(h.draft.get("doi"), Some("10.1145/3423603.3424004"));
        assert_eq!(
            h.draft.get("note"),
            Some("2nd International Digital Tools & Uses Congress (DTUC 2020), Oct 2020, Hammamet, Tunisia. pp.38-41")
        );
        assert_eq!(h.draft.get("eprintclass"), Some("cs.DB"));
        // The affiliation that follows the name is not part of it.
        assert_eq!(h.draft.names["author"][0], Person::new("Darmont", "Jérôme"));
        assert_eq!(h.draft.names["author"][3], Person::new("Noûs", "Camille"));
        assert_eq!(h.remarks.len(), 1);
        assert!(h.remarks[0].contains("look up 10.1145/3423603.3424004"));
    }

    #[test]
    fn nothing_and_failures() {
        assert!(hits(samples::ARXIV_NONE, false).unwrap().is_empty());
        for answer in ["", "Rate exceeded.", "<html/>", "<feed><entry>"] {
            assert!(hits(answer, false).is_err(), "{answer}");
        }
        assert!(
            hits("<feed><entry/><entry><id>x</id></entry><entry><id>http://arxiv.org/abs/</id></entry></feed>", false)
                .unwrap()
                .is_empty()
        );
        let error = "<feed><entry><id>http://arxiv.org/api/errors#incorrect_id_format_for_1</id><title>Error</title>\
                     <summary>incorrect id format for 1</summary></entry></feed>";
        assert_eq!(
            hits(error, false).unwrap_err().to_string(),
            "network: arXiv could not answer the question: incorrect id format for 1"
        );
    }

    #[test]
    fn addresses_and_identifiers() {
        assert_eq!(address("1706.03762v7"), "https://export.arxiv.org/api/query?id_list=1706.03762v7");
        assert_eq!(address("hep-th/9901001"), "https://export.arxiv.org/api/query?id_list=hep-th/9901001");
        assert_eq!(address("x&y=1"), "https://export.arxiv.org/api/query?id_list=x%26y%3D1");
        assert_eq!(
            identifier("http://arxiv.org/abs/hep-th/9901001v2"),
            Some(("hep-th/9901001".into(), Some("2".into())))
        );
        assert_eq!(identifier("http://arxiv.org/abs/1706.03762"), Some(("1706.03762".into(), None)));
        assert_eq!(identifier("http://arxiv.org/abs/v"), Some(("v".into(), None)));
        assert_eq!(identifier("http://example.org/"), None);
    }
}
