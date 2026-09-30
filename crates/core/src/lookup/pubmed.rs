//! Articles in PubMed, by their number.
//!
//! PubMed is of use for medicine and what borders on it. The full records
//! are asked for (`efetch`): the summaries have names as `Varambally S` and
//! page ranges as `1695-9`.
//!
//! No address of the user is sent along. PubMed's rules for this could not
//! be read when the services were tried out; what was found says that the
//! address to give is that of the developers.

use std::time::Duration;

use crate::bib::names::Person;
use crate::error::{Error, Result};
use crate::library::entry::Draft;
use crate::net::{Client, encode};
use crate::tr;
use crate::written::{identifiers::doi, languages};

use super::{Hit, csl::is_issn, pace, text, xml_child, xml_child_text, xml_text};

pub(crate) const SOURCE: &str = "PubMed";

pub(crate) fn address(pmid: &str) -> String {
    format!(
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id={}&retmode=xml&tool=glaukopis",
        encode(pmid)
    )
}

pub(crate) fn lookup(client: &Client, pmid: &str) -> Result<Vec<Hit>> {
    // Three questions a second are allowed without a key.
    pace("eutils.ncbi.nlm.nih.gov", Duration::from_millis(400));
    let xml = client.get_ok(&address(pmid), None)?;
    hits(&xml)
}

fn descendant<'a, 'i>(node: roxmltree::Node<'a, 'i>, name: &str) -> Option<roxmltree::Node<'a, 'i>> {
    node.descendants().find(|n| n.is_element() && n.tag_name().name() == name)
}

/// The date of the issue. The month is a number or an English abbreviation;
/// where the date is given in words ("2008 Nov-Dec") the year is taken.
fn date(issue: roxmltree::Node) -> Option<String> {
    let date = xml_child(issue, "PubDate")?;
    if let Some(year) = xml_child_text(date, "Year").and_then(|y| y.parse::<i64>().ok()) {
        let month =
            xml_child_text(date, "Month").and_then(|m| m.parse::<i64>().ok().or_else(|| text::month_number(&m)));
        let day = xml_child_text(date, "Day").and_then(|d| d.parse::<i64>().ok());
        return text::date_from_parts(year, month, day);
    }
    let words = xml_child_text(date, "MedlineDate")?;
    let year: String = words.chars().take(4).collect();
    text::is_year(&year).then_some(year)
}

fn article(entry: roxmltree::Node) -> Option<Hit> {
    let citation = xml_child(entry, "MedlineCitation")?;
    let article = xml_child(citation, "Article")?;
    let mut remarks = Vec::new();
    let mut draft = Draft { entry_type: "article".to_owned(), ..Default::default() };
    let mut put = |name: &str, value: String| {
        if !value.trim().is_empty() {
            draft.fields.insert(name.to_owned(), value);
        }
    };

    let langid = xml_child_text(article, "Language").and_then(|code| languages::babel(&code));
    if let Some(l) = langid {
        put("langid", l.to_owned());
    }

    // A title in square brackets is PubMed's translation of it into English.
    let given = xml_child_text(article, "ArticleTitle").unwrap_or_default();
    let own = xml_child_text(article, "VernacularTitle");
    let translated = given.strip_prefix('[').map(|t| t.trim_end_matches('.').trim_end_matches(']').to_owned());
    match (translated, own) {
        (Some(english), Some(own)) => {
            put("title", text::title(&own, langid, &mut remarks));
            remarks.push(tr!("core-lookup-pubmed-translated", title = text::without_final_stop(&english)));
        }
        (Some(english), None) => {
            put("title", text::title(&english, Some("english"), &mut remarks));
            remarks.push(tr!("core-lookup-pubmed-translation"));
        }
        (None, _) => put("title", text::title(&given, langid, &mut remarks)),
    }

    if let Some(journal) = xml_child(article, "Journal") {
        if let Some(title) = xml_child_text(journal, "Title") {
            // "Science (New York, N.Y.)": what is in brackets tells journals of one name apart in the catalogue.
            let title = match title.rfind(" (") {
                Some(at) if title.ends_with(')') && at > 0 => title[..at].to_owned(),
                _ => title,
            };
            if let Some(short) = xml_child_text(journal, "ISOAbbreviation").filter(|s| *s != title) {
                put("shortjournal", short);
            }
            put("journaltitle", title);
        }
        if let Some(issue) = xml_child(journal, "JournalIssue") {
            if let Some(volume) = xml_child_text(issue, "Volume") {
                put("volume", volume);
            }
            if let Some(number) = xml_child_text(issue, "Issue") {
                put("number", number);
            }
            if let Some(date) = date(issue) {
                put("date", date);
            }
        }
        // The number that holds for the journal in all its forms, which as a rule is that of the printed one.
        let linking = xml_child(citation, "MedlineJournalInfo").and_then(|i| xml_child_text(i, "ISSNLinking"));
        if let Some(issn) = linking.or_else(|| xml_child_text(journal, "ISSN")).filter(|i| is_issn(i)) {
            put("issn", issn);
        }
    }

    if let Some(pagination) = xml_child(article, "Pagination") {
        let pages = match (xml_child_text(pagination, "StartPage"), xml_child_text(pagination, "EndPage")) {
            (Some(first), Some(last)) if first != last => Some(format!("{first}–{last}")),
            (Some(first), _) => Some(first),
            _ => xml_child_text(pagination, "MedlinePgn").map(|p| text::pages(&p)),
        };
        if let Some(pages) = pages {
            put("pages", pages);
        }
    }

    let doi = entry
        .descendants()
        .filter(|n| n.is_element())
        .filter(|n| {
            (n.tag_name().name() == "ELocationID" && n.attribute("EIdType") == Some("doi"))
                || (n.tag_name().name() == "ArticleId"
                    && n.attribute("IdType") == Some("doi")
                    && n.ancestors().all(|a| a.tag_name().name() != "ReferenceList"))
        })
        .find_map(|n| doi::normalise(&xml_text(n)));
    if let Some(doi) = doi {
        put("doi", doi);
    }
    let pmid = xml_child_text(citation, "PMID").filter(|p| p.chars().all(|c| c.is_ascii_digit()));
    if let Some(pmid) = &pmid {
        put("eprint", pmid.clone());
        put("eprinttype", "pubmed".to_owned());
    }

    if let Some(summary) = xml_child(article, "Abstract") {
        let parts: Vec<String> = summary
            .children()
            .filter(|n| n.is_element() && n.tag_name().name() == "AbstractText")
            .map(|n| match n.attribute("Label").map(text::clean).filter(|l| !l.is_empty()) {
                Some(label) => format!("{label}: {}", xml_text(n)),
                None => xml_text(n),
            })
            .filter(|p| !p.is_empty())
            .collect();
        put("abstract", parts.join(" "));
    }

    let authors: Vec<Person> = descendant(article, "AuthorList")
        .into_iter()
        .flat_map(|list| list.children().filter(|n| n.is_element() && n.tag_name().name() == "Author"))
        .filter_map(|a| {
            if let Some(group) = xml_child_text(a, "CollectiveName") {
                return Some(Person::literal(group));
            }
            let family = xml_child_text(a, "LastName")?;
            let given = xml_child_text(a, "ForeName").or_else(|| xml_child_text(a, "Initials")).unwrap_or_default();
            let mut person = text::person(&family, &given, &mut remarks);
            if let Some(suffix) = xml_child_text(a, "Suffix") {
                person.suffix = suffix;
            }
            Some(person)
        })
        .collect();
    if !authors.is_empty() {
        draft.names.insert("author".to_owned(), authors);
    }

    if draft.get("title").is_none() && draft.names.is_empty() {
        return None;
    }
    let url = pmid.map(|p| format!("https://pubmed.ncbi.nlm.nih.gov/{p}/"));
    Some(Hit { draft, source: SOURCE.to_owned(), url, remarks })
}

pub(crate) fn hits(xml: &str) -> Result<Vec<Hit>> {
    let document = roxmltree::Document::parse_with_options(xml, super::xml_options())
        .map_err(|_| Error::Network(tr!("core-lookup-unreadable", service = "PubMed")))?;
    let root = document.root_element();
    if root.tag_name().name() != "PubmedArticleSet" {
        let said = descendant(root, "ERROR").map(xml_text).filter(|e| !e.is_empty());
        return Err(Error::Network(match said {
            Some(said) => tr!("core-lookup-could-not-answer", service = "PubMed", said = said),
            None => tr!("core-lookup-not-articles", service = "PubMed"),
        }));
    }
    let named = |name: &'static str| root.children().filter(move |n| n.is_element() && n.tag_name().name() == name);
    let hits: Vec<Hit> = named("PubmedArticle").filter_map(article).collect();
    if hits.is_empty() && named("PubmedBookArticle").next().is_some() {
        return Err(Error::Network(tr!("core-lookup-pubmed-book", service = SOURCE)));
    }
    Ok(hits)
}

#[cfg(test)]
mod tests {
    use super::super::samples;
    use super::*;

    #[test]
    fn an_article() {
        let hits = hits(samples::PUBMED).unwrap();
        assert_eq!(hits.len(), 1);
        let h = &hits[0];
        assert_eq!(h.draft.entry_type, "article");
        assert_eq!(h.draft.key, "");
        let fields: Vec<(&str, &str)> =
            h.draft.fields.iter().filter(|(k, _)| *k != "abstract").map(|(k, v)| (k.as_str(), v.as_str())).collect();
        assert_eq!(
            fields,
            vec![
                ("date", "2008-12-12"),
                ("doi", "10.1126/science.1165395"),
                ("eprint", "19008416"),
                ("eprinttype", "pubmed"),
                ("issn", "0036-8075"),
                ("journaltitle", "Science"),
                ("langid", "english"),
                ("number", "5908"),
                ("pages", "1695–1699"),
                (
                    "title",
                    "Genomic loss of microRNA-101 leads to overexpression of histone methyltransferase EZH2 in cancer"
                ),
                ("volume", "322"),
            ]
        );
        assert!(h.draft.get("abstract").unwrap().starts_with("Enhancer of zeste homolog 2 (EZH2)"));
        let authors = &h.draft.names["author"];
        assert_eq!(authors.len(), 20);
        assert_eq!(authors[0], Person::new("Varambally", "Sooryanarayana"));
        assert_eq!(authors[2], Person::new("Mani", "Ram-Shankar"));
        // Initials are given without their points.
        assert_eq!(authors[10], Person::new("Brenner", "J. Chad"));
        assert_eq!(authors[16], Person::new("Lonigro", "Robert J."));
        assert_eq!(authors[19], Person::new("Chinnaiyan", "Arul M."));
        assert_eq!(h.source, "PubMed");
        assert_eq!(h.url.as_deref(), Some("https://pubmed.ncbi.nlm.nih.gov/19008416/"));
        assert!(h.remarks.is_empty());
    }

    #[test]
    fn titles_in_translation_and_dates_in_words() {
        let xml = r#"<?xml version="1.0" ?>
<!DOCTYPE PubmedArticleSet PUBLIC "-//NLM//DTD PubMedArticle, 1st January 2025//EN" "https://dtd.nlm.nih.gov/ncbi/pubmed/out/pubmed_250101.dtd">
<PubmedArticleSet><PubmedArticle><MedlineCitation><PMID Version="1">123</PMID><Article>
<Journal><ISSN IssnType="Print">0029-2001</ISSN><JournalIssue><Volume>118</Volume><Issue>30</Issue><PubDate><MedlineDate>1998 Dec-1999 Jan</MedlineDate></PubDate></JournalIssue>
<Title>Tidsskrift for den Norske laegeforening : tidsskrift for praktisk medicin, ny raekke</Title><ISOAbbreviation>Tidsskr Nor Laegeforen</ISOAbbreviation></Journal>
<ArticleTitle>[The history of <i>medicine</i> in Norway].</ArticleTitle><Pagination><MedlinePgn>4652-5</MedlinePgn></Pagination>
<Abstract><AbstractText Label="BACKGROUND">One.</AbstractText><AbstractText Label="RESULTS">Two.</AbstractText></Abstract>
<AuthorList><Author><LastName>Larsen</LastName><Initials>O</Initials></Author><Author><CollectiveName>Norwegian Study Group</CollectiveName></Author><Author/></AuthorList>
<Language>nor</Language></Article></MedlineCitation></PubmedArticle></PubmedArticleSet>"#;
        let hits = hits(xml).unwrap();
        let h = &hits[0];
        assert_eq!(h.draft.get("title"), Some("The history of medicine in Norway"));
        assert_eq!(h.draft.get("date"), Some("1998"));
        assert_eq!(h.draft.get("pages"), Some("4652–4655"));
        assert_eq!(h.draft.get("issn"), Some("0029-2001"));
        assert_eq!(h.draft.get("langid"), Some("norsk"));
        assert_eq!(h.draft.get("shortjournal"), Some("Tidsskr Nor Laegeforen"));
        assert_eq!(h.draft.get("abstract"), Some("BACKGROUND: One. RESULTS: Two."));
        assert_eq!(
            h.draft.names["author"],
            vec![Person::new("Larsen", "O."), Person::literal("Norwegian Study Group")]
        );
        assert_eq!(h.remarks.len(), 1);
        assert!(h.remarks[0].starts_with("The title is PubMed's translation"));
    }

    #[test]
    fn nothing_and_failures() {
        assert!(hits("<PubmedArticleSet></PubmedArticleSet>").unwrap().is_empty());
        assert!(
            hits(
                "<PubmedArticleSet><PubmedArticle/><PubmedArticle><MedlineCitation/></PubmedArticle></PubmedArticleSet>"
            )
            .unwrap()
            .is_empty()
        );
        assert!(hits("<PubmedArticleSet><PubmedBookArticle/></PubmedArticleSet>").is_err());
        assert_eq!(
            hits("<eFetchResult><ERROR>Empty id list</ERROR></eFetchResult>").unwrap_err().to_string(),
            "network: PubMed could not answer the question: Empty id list"
        );
        for answer in ["", "{\"error\":\"API rate limit exceeded\"}", "<html/>"] {
            assert!(hits(answer).is_err(), "{answer}");
        }
        assert!(address("19008416").ends_with("db=pubmed&id=19008416&retmode=xml&tool=glaukopis"));
        assert!(!address("1").contains("email"));
    }
}
