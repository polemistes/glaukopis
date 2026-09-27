//! Reading and writing BibLaTeX.
//!
//! Three forms of a field's value are distinguished throughout:
//!
//! - **raw**: as it stands in a `.bib` file, between the delimiters;
//! - **text**: what the application holds and the form shows. Unicode, with
//!   LaTeX accents decoded and `\&`, `\%`, `\#`, `\_` unescaped. Braces and
//!   commands such as `\emph{…}` are kept, since they carry meaning;
//! - **plain**: for lists and labels, with braces and commands removed.

pub mod date;
pub mod latex;
pub mod names;
pub mod parser;
pub mod writer;

pub use parser::{BibItem, ParseWarning, Parsed, RawEntry, parse};
pub use writer::write_entry;

/// Fields whose value is taken literally: no LaTeX decoding or escaping.
pub fn is_verbatim_field(name: &str) -> bool {
    matches!(
        name,
        "url"
            | "doi"
            | "eprint"
            | "file"
            | "urlraw"
            | "verba"
            | "verbb"
            | "verbc"
            | "crossref"
            | "xref"
            | "xdata"
            | "ids"
            | "entryset"
            | "related"
            | "options"
            | "isbn"
            | "issn"
            | "isrn"
            | "ismn"
            | "isan"
            | "iswc"
            | "eid"
            | "langid"
            | "keywords"
            | "entrysubtype"
            | "pubstate"
            | "date"
            | "year"
            | "month"
            | "origdate"
            | "eventdate"
            | "urldate"
    ) || name.starts_with("glaukopis-")
}

/// Fields that hold a list of names.
pub fn is_name_field(name: &str) -> bool {
    matches!(
        name,
        "author"
            | "editor"
            | "translator"
            | "editora"
            | "editorb"
            | "editorc"
            | "bookauthor"
            | "annotator"
            | "commentator"
            | "introduction"
            | "foreword"
            | "afterword"
            | "holder"
            | "shortauthor"
            | "shorteditor"
            | "namea"
            | "nameb"
            | "namec"
            | "sortname"
    )
}

/// Fields that hold a list of literals separated by ` and `.
pub fn is_list_field(name: &str) -> bool {
    matches!(
        name,
        "publisher"
            | "location"
            | "address"
            | "institution"
            | "organization"
            | "school"
            | "language"
            | "origlocation"
            | "origpublisher"
            | "lista"
            | "listb"
            | "listc"
    )
}
