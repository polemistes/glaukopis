//! Zotero's field "Extra".
//!
//! Extra is where everything goes that Zotero has no field for, one thing to
//! a line: `DOI: 10.1000/xyz`, `original-date: 1929`. Better BibTeX keeps the
//! citation key there (`Citation Key: nagy1979`) and fields of BibLaTeX
//! (`tex.shorthand: LSJ`). What is recognised is taken out; the rest is the
//! user's own note.

use crate::bib::is_verbatim_field;
use crate::bib::latex::decode;
use crate::library::keys::sanitise_key;

use super::dates::{self, Date};
use super::{markup, text};

/// A number in an archive of preprints or the like.
#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) struct Eprint {
    /// As BibLaTeX names the archive: `arxiv`, `jstor`, `pubmed`.
    pub kind: String,
    pub id: String,
    /// The subject class of arXiv: `hep-th`.
    pub class: Option<String>,
}

#[derive(Debug, Default)]
pub(super) struct Extra {
    /// The citation key, when one is pinned.
    pub key: Option<String>,
    /// The type of entry, when the lines name one.
    pub entry_type: Option<String>,
    pub subtype: Option<String>,
    pub eprint: Option<Eprint>,
    /// Fields that stand in where Zotero's own field is empty.
    pub found: Vec<(String, String)>,
    /// Fields written as `tex.name: value`, which the user means to be
    /// used whatever else there is. Their values are as in a `.bib` file.
    pub forced: Vec<(String, String)>,
    /// The lines that were none of these.
    pub rest: Vec<String>,
}

/// The name of an archive as BibLaTeX writes it, for those it knows.
pub(super) fn archive_kind(name: &str) -> Option<&'static str> {
    let name: String = name.chars().filter(|c| c.is_alphanumeric()).collect::<String>().to_lowercase();
    Some(match name.as_str() {
        "arxiv" | "arxivorg" => "arxiv",
        "jstor" => "jstor",
        "pubmed" | "pmid" => "pubmed",
        "hdl" | "handle" => "hdl",
        "googlebooks" | "googlebooksid" => "googlebooks",
        _ => return None,
    })
}

/// A number of arXiv as it is written: `arXiv:2301.12345v2 [hep-th]`.
pub(super) fn arxiv(value: &str) -> Option<Eprint> {
    let value = value.trim();
    let value = match value.get(..6) {
        Some(prefix) if prefix.eq_ignore_ascii_case("arxiv:") => value[6..].trim_start(),
        _ => value,
    };
    let mut words = value.split_whitespace();
    let id = words.next()?.to_owned();
    let class = words
        .next()
        .and_then(|word| word.strip_prefix('[')?.strip_suffix(']'))
        .filter(|class| !class.is_empty())
        .map(str::to_owned);
    Some(Eprint { kind: "arxiv".into(), id, class })
}

/// The type of BibLaTeX for a type of CSL, which is what `type: …` in Extra
/// names. Only those are here that leave no doubt.
fn csl_type(name: &str) -> Option<(&'static str, Option<&'static str>)> {
    Some(match name {
        "article-journal" => ("article", None),
        "article-magazine" => ("article", Some("magazine")),
        "article-newspaper" => ("article", Some("newspaper")),
        "bill" | "legislation" | "regulation" | "treaty" => ("legislation", None),
        "book" => ("book", None),
        "chapter" => ("incollection", None),
        "dataset" => ("dataset", None),
        "entry" | "entry-dictionary" | "entry-encyclopedia" => ("inreference", None),
        "figure" | "graphic" => ("image", None),
        "legal_case" => ("jurisdiction", None),
        "manuscript" => ("unpublished", None),
        "motion_picture" => ("movie", None),
        "musical_score" | "song" => ("music", None),
        "pamphlet" => ("booklet", None),
        "paper-conference" => ("inproceedings", None),
        "patent" => ("patent", None),
        "performance" => ("performance", None),
        "periodical" => ("periodical", None),
        "personal_communication" => ("letter", None),
        "post" | "post-weblog" | "webpage" => ("online", None),
        "report" => ("report", None),
        "review" | "review-book" => ("review", None),
        "software" => ("software", None),
        "standard" => ("standard", None),
        "thesis" => ("thesis", None),
        _ => return None,
    })
}

/// The label and the value of a line that has both.
fn labelled(line: &str) -> Option<(&str, &str)> {
    // The variables of CSL were once written `{:original-date: 1929}`.
    let line = line.strip_prefix("{:").and_then(|l| l.strip_suffix('}')).unwrap_or(line);
    let at = line.find([':', '='])?;
    let (label, value) = (line[..at].trim(), line[at + 1..].trim());
    let is_tex = label.get(..4).is_some_and(|start| start.eq_ignore_ascii_case("tex."));
    // Only Better BibTeX writes with an equals sign.
    if line[at..].starts_with('=') && !is_tex {
        return None;
    }
    let sound = !label.is_empty()
        && label.len() <= 40
        && label.chars().all(|c| c.is_ascii_alphanumeric() || matches!(c, ' ' | '-' | '_' | '.'));
    (sound && !value.is_empty()).then_some((label, value))
}

impl Extra {
    pub(super) fn read(extra: &str) -> Self {
        let mut out = Extra::default();
        for line in extra.lines().map(str::trim).filter(|l| !l.is_empty()) {
            let taken = match labelled(line) {
                Some((label, value)) => out.take(label, value),
                None => false,
            };
            if !taken {
                out.rest.push(line.to_owned());
            }
        }
        out
    }

    /// Takes up a line if it is one of those known. Says whether it was.
    fn take(&mut self, label: &str, value: &str) -> bool {
        let lower = label.to_ascii_lowercase();
        if let Some(name) = lower.strip_prefix("tex.") {
            let name = name.trim();
            if name.is_empty() || !name.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_') {
                return false;
            }
            if matches!(name, "entrytype" | "referencetype") {
                return self.name_type(value, None);
            }
            let value = if is_verbatim_field(name) { value.to_owned() } else { decode(value) };
            self.forced.push((name.to_owned(), value));
            return true;
        }

        let mut found = |name: &str, value: String| {
            if value.is_empty() || self.found.iter().any(|(n, _)| n == name) {
                return false;
            }
            self.found.push((name.to_owned(), value));
            true
        };
        let name: String = lower.chars().filter(|c| c.is_ascii_alphanumeric()).collect();
        match name.as_str() {
            "citationkey" => match sanitise_key(value) {
                Some(key) if self.key.is_none() => {
                    self.key = Some(key);
                    true
                }
                _ => false,
            },
            "doi" => found("doi", text::doi(value)),
            "isbn" => found("isbn", value.to_owned()),
            "issn" => found("issn", value.to_owned()),
            "originaldate" => match dates::read(value) {
                Some(Date::Understood(date)) => found("origdate", date),
                _ => false,
            },
            "originaltitle" => found("origtitle", text::line(&markup::rich_text(value))),
            "originalpublisher" => found("origpublisher", text::list(value)),
            "originalpublisherplace" => found("origlocation", text::list(value)),
            "arxiv" | "pmid" | "jstor" | "hdl" | "googlebooksid" => {
                if self.eprint.is_some() {
                    return false;
                }
                self.eprint = match (name.as_str(), archive_kind(&name)) {
                    ("arxiv", _) => arxiv(value),
                    (_, Some(kind)) => Some(Eprint { kind: kind.into(), id: value.to_owned(), class: None }),
                    _ => None,
                };
                self.eprint.is_some()
            }
            "type" => match csl_type(&value.to_ascii_lowercase()) {
                Some((entry_type, subtype)) => self.name_type(entry_type, subtype),
                None => false,
            },
            _ => false,
        }
    }

    fn name_type(&mut self, entry_type: &str, subtype: Option<&str>) -> bool {
        let entry_type = entry_type.trim().to_ascii_lowercase();
        if entry_type.is_empty() || !entry_type.chars().all(|c| c.is_ascii_alphanumeric()) || self.entry_type.is_some()
        {
            return false;
        }
        self.entry_type = Some(entry_type);
        self.subtype = subtype.map(str::to_owned);
        true
    }

    /// What is left, as one note. The lines follow one another as sentences do.
    pub(super) fn note(&self) -> String {
        let mut out = String::new();
        for line in &self.rest {
            if !out.is_empty() {
                out.push_str(if out.ends_with(['.', ';', ':', '!', '?', ',']) { " " } else { "; " });
            }
            out.push_str(line);
        }
        text::line(&out)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn what_is_known_is_taken_out() {
        let extra = Extra::read(
            "Citation Key: nagy1979best\nDOI: https://doi.org/10.1000/XYZ\noriginal-date: 1929\n\
             Original Title: Der <i>Zorn</i>\nPMID: 12345\nA remark of my own.\nOCLC: 4711\n\n  And another ",
        );
        assert_eq!(extra.key.as_deref(), Some("nagy1979best"));
        assert_eq!(
            extra.found,
            vec![
                ("doi".to_owned(), "10.1000/XYZ".to_owned()),
                ("origdate".to_owned(), "1929".to_owned()),
                ("origtitle".to_owned(), "Der \\emph{Zorn}".to_owned()),
            ]
        );
        assert_eq!(extra.eprint, Some(Eprint { kind: "pubmed".into(), id: "12345".into(), class: None }));
        assert_eq!(extra.note(), "A remark of my own. OCLC: 4711; And another");
    }

    #[test]
    fn fields_for_biblatex() {
        let extra = Extra::read(
            "tex.shorthand: LSJ\nTeX.origlanguage= german\ntex.ids: a_b, c\n\
             tex.publisher: M{\\\"u}ller \\& Co\ntex.entrytype: mvbook\ntex.: nothing\ntex.bad name: x",
        );
        assert_eq!(
            extra.forced,
            vec![
                ("shorthand".to_owned(), "LSJ".to_owned()),
                ("origlanguage".to_owned(), "german".to_owned()),
                ("ids".to_owned(), "a_b, c".to_owned()),
                ("publisher".to_owned(), "Müller & Co".to_owned()),
            ]
        );
        assert_eq!(extra.entry_type.as_deref(), Some("mvbook"));
        assert_eq!(extra.rest, vec!["tex.: nothing", "tex.bad name: x"]);
    }

    #[test]
    fn preprints() {
        let extra = Extra::read("arXiv: 2301.12345v2 [hep-th]\nPMID: 1");
        assert_eq!(
            extra.eprint,
            Some(Eprint { kind: "arxiv".into(), id: "2301.12345v2".into(), class: Some("hep-th".into()) })
        );
        assert_eq!(extra.rest, vec!["PMID: 1"]);
        assert_eq!(arxiv("arXiv:hep-th/9901001").map(|e| e.id).as_deref(), Some("hep-th/9901001"));
        assert_eq!(arxiv(" "), None);
        assert_eq!(archive_kind("arXiv.org"), Some("arxiv"));
        assert_eq!(archive_kind("Bodleian Library"), None);
    }

    #[test]
    fn types_of_csl() {
        let extra = Extra::read("type: article-magazine");
        assert_eq!((extra.entry_type.as_deref(), extra.subtype.as_deref()), (Some("article"), Some("magazine")));
        let extra = Extra::read("{:type: review-book}");
        assert_eq!(extra.entry_type.as_deref(), Some("review"));
        // Not a type of CSL: the user's own words.
        let extra = Extra::read("Type: a poster, in fact");
        assert_eq!(extra.entry_type, None);
        assert_eq!(extra.note(), "Type: a poster, in fact");
    }

    #[test]
    fn what_is_not_a_label() {
        let extra = Extra::read(
            "See also: the second edition\nhttps://example.org/a\nx = y\noriginal-date: long ago\nCitation Key: ***",
        );
        assert!(extra.found.is_empty() && extra.key.is_none());
        assert_eq!(extra.rest.len(), 5);
        assert_eq!(Extra::read("").note(), "");
    }
}
