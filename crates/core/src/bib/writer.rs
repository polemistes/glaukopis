//! Writing entries as BibLaTeX.

use super::latex::encode;
use super::{is_verbatim_field, parser::RawEntry};

/// The order in which fields are written. Fields not named here follow in
/// alphabetical order; the application's own fields come last.
const ORDER: &[&str] = &[
    "author",
    "shortauthor",
    "bookauthor",
    "editor",
    "editortype",
    "editora",
    "editoratype",
    "editorb",
    "editorbtype",
    "editorc",
    "editorctype",
    "translator",
    "annotator",
    "commentator",
    "introduction",
    "foreword",
    "afterword",
    "holder",
    "title",
    "subtitle",
    "titleaddon",
    "shorttitle",
    "maintitle",
    "mainsubtitle",
    "maintitleaddon",
    "booktitle",
    "booksubtitle",
    "booktitleaddon",
    "journaltitle",
    "journalsubtitle",
    "shortjournal",
    "journal",
    "issuetitle",
    "issuesubtitle",
    "eventtitle",
    "eventdate",
    "venue",
    "origtitle",
    "origlanguage",
    "origdate",
    "origlocation",
    "origpublisher",
    "edition",
    "volume",
    "volumes",
    "part",
    "series",
    "number",
    "issue",
    "chapter",
    "type",
    "version",
    "entrysubtype",
    "location",
    "address",
    "publisher",
    "institution",
    "organization",
    "school",
    "howpublished",
    "date",
    "year",
    "month",
    "pubstate",
    "pages",
    "pagetotal",
    "bookpagination",
    "pagination",
    "language",
    "langid",
    "isbn",
    "issn",
    "isrn",
    "doi",
    "eprint",
    "eprinttype",
    "eprintclass",
    "url",
    "urldate",
    "note",
    "addendum",
    "annotation",
    "abstract",
    "keywords",
    "library",
    "shorthand",
    "crossref",
    "xref",
    "xdata",
    "related",
    "relatedtype",
    "relatedstring",
    "ids",
    "sortkey",
    "sortname",
    "sorttitle",
    "sortyear",
    "options",
    "file",
];

fn rank(name: &str) -> (usize, &str) {
    if name.starts_with("glaukopis-") {
        return (usize::MAX, name);
    }
    match ORDER.iter().position(|f| *f == name) {
        Some(i) => (i, name),
        None => (ORDER.len(), name),
    }
}

/// Fields that hold page or number ranges, where a dash is written `--`.
fn is_range_field(name: &str) -> bool {
    matches!(name, "pages" | "bookpages")
}

/// One entry. `fields` hold values in text form; they are encoded here.
pub fn write_entry<'a>(
    out: &mut String,
    entry_type: &str,
    key: &str,
    fields: impl IntoIterator<Item = (&'a str, &'a str)>,
) {
    let mut fields: Vec<(&str, &str)> = fields.into_iter().filter(|(_, v)| !v.trim().is_empty()).collect();
    fields.sort_by(|a, b| rank(a.0).cmp(&rank(b.0)));

    out.push('@');
    out.push_str(entry_type);
    out.push('{');
    out.push_str(key);
    out.push_str(",\n");
    let width = fields.iter().map(|(n, _)| n.len()).max().unwrap_or(0).min(14);
    for (name, value) in fields {
        let raw = if is_verbatim_field(name) {
            super::latex::balance(value.trim())
        } else {
            encode(value.trim(), is_range_field(name))
        };
        out.push_str("  ");
        out.push_str(name);
        for _ in name.len()..width {
            out.push(' ');
        }
        out.push_str(" = {");
        out.push_str(&raw);
        out.push_str("},\n");
    }
    out.push_str("}\n");
}

/// A raw entry written back as it was read, for showing the source of
/// something that is being imported.
pub fn write_raw(entry: &RawEntry) -> String {
    let mut out = String::new();
    out.push('@');
    out.push_str(&entry.entry_type);
    out.push('{');
    out.push_str(&entry.key);
    out.push_str(",\n");
    for (name, value) in &entry.fields {
        out.push_str("  ");
        out.push_str(name);
        out.push_str(" = {");
        out.push_str(&super::latex::balance(value));
        out.push_str("},\n");
    }
    out.push_str("}\n");
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bib::parse;

    #[test]
    fn order_alignment_and_escaping() {
        let mut out = String::new();
        write_entry(
            &mut out,
            "book",
            "nagy1979",
            [
                ("glaukopis-id", "abc"),
                ("publisher", "Johns Hopkins & Co"),
                ("title", "The Best of the {Achaeans}"),
                ("zzz", "last of the unknown"),
                ("author", "Nagy, Gregory"),
                ("url", "https://example.org/a_b%20c"),
                ("note", "  "),
                ("pages", "1–20"),
                ("date", "1979"),
            ],
        );
        assert_eq!(
            out,
            "@book{nagy1979,\n\
             \x20 author       = {Nagy, Gregory},\n\
             \x20 title        = {The Best of the {Achaeans}},\n\
             \x20 publisher    = {Johns Hopkins \\& Co},\n\
             \x20 date         = {1979},\n\
             \x20 pages        = {1--20},\n\
             \x20 url          = {https://example.org/a_b%20c},\n\
             \x20 zzz          = {last of the unknown},\n\
             \x20 glaukopis-id = {abc},\n\
             }\n"
        );
    }

    #[test]
    fn what_is_written_can_be_read() {
        let mut out = String::new();
        write_entry(&mut out, "article", "k", [("title", "Unbalanced } brace {"), ("note", "50% & more")]);
        let parsed = parse(&out);
        assert!(parsed.warnings.is_empty(), "{:?}", parsed.warnings);
        let e = parsed.entries().next().unwrap();
        assert_eq!(crate::bib::latex::decode(e.get("note").unwrap()), "50% & more");
        assert_eq!(e.get("title"), Some("Unbalanced brace {}"));
    }
}
