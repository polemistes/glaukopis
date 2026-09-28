//! Citations that were found in a text that was written elsewhere, and what
//! the library has for them.
//!
//! A text that is brought in has its citations as they were made where it
//! was written: by a program that keeps references, which says in the file
//! what is cited (Zotero, Mendeley); by a tag that names a reference
//! (`[@nagy1979]`, `\cite{nagy1979}`); or as words and nothing else, "(Nagy
//! 1979, 73)", or a note that names a book. None of these is a citation of
//! the application until it is tied to a reference of the library.
//!
//! What was found stands in the text as the text it was, with a mark on it,
//! `found`, which holds what is known of it ([`Found`]). The mark is kept
//! with the text, in the project, so that the citations can be gone through
//! at any time, and by anyone the project is shared with. Text that only
//! looks like a citation has no mark: it is looked for when the citations
//! are gone through ([`propose`]), and has a mark only when the writer has
//! said that it is to be left as text, so that it is not proposed again.
//!
//! Where things are done:
//! - the reader of documents (`import::document`) makes the marks;
//! - [`suggest`] finds the references of the library for what a mark holds;
//! - [`propose`] finds what looks like citations in text, and the references
//!   for them;
//! - the interface shows them, and makes citations of them.

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::document::CiteMode;
use crate::library::Library;
use crate::library::entry::Draft;

mod forms;
mod matching;

/// The name of the mark, and of the field an entry has the key of its item
/// in Zotero in.
pub const MARK: &str = "found";

/// Where an entry of the library has what it is in Zotero: the key of the
/// item, as Zotero has it in the addresses of its items
/// (`http://zotero.org/users/123/items/ABCD2345` has `ABCD2345`). Several
/// are parted by spaces, as of an entry that others were merged into.
pub const FIELD_ZOTERO: &str = "glaukopis-zotero";

/// By what a citation was found.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum By {
    /// Made by Zotero, which says in the file what is cited.
    Zotero,
    /// Made by Mendeley, or another program that writes as it does.
    Mendeley,
    /// A tag that names a reference, in a file of text.
    Key,
    /// By how it looks, and nothing else.
    Form,
}

/// One work that is cited, as the text it was found in has it.
#[derive(Debug, Clone, Default, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", default)]
pub struct FoundItem {
    /// The tag that names the reference, in a file of text.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub key: Option<String>,
    /// The addresses of the item, as Zotero gives them.
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub uris: Vec<String>,
    /// What the program that made the citation says of the work, in the form
    /// of CSL. Long fields that say nothing of which work it is (the
    /// abstract, notes) are left out.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub locator: Option<String>,
    /// What the locator counts, as CSL names it. Absent for pages.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prefix: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub suffix: Option<String>,
    #[serde(skip_serializing_if = "std::ops::Not::not")]
    pub suppress_author: bool,
}

/// What the mark `found` holds: what is known of a citation that stands in
/// the text as the text it was.
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Found {
    /// One for all the text of one citation: where other marks cut the text
    /// in pieces, the pieces with the same id are one citation. Twelve
    /// letters and digits, as the ids of figures are.
    pub id: String,
    pub by: By,
    /// The works, in the order they are cited in. None, of text that was
    /// left as text.
    #[serde(default)]
    pub items: Vec<FoundItem>,
    #[serde(default)]
    pub mode: CiteMode,
    /// The writer has said that this is to be left as text. It is not shown
    /// as something found, and not proposed again.
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub left: bool,
}

/// How sure it is that a reference is the one that is cited.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Sure {
    /// It may be: something of it is alike.
    Possible,
    /// It is likely: the author and the year, or the author and the title.
    Likely,
    /// It is: the key of the item in Zotero, the tag, the DOI or the ISBN is
    /// the same, or all that tells works apart is.
    Certain,
}

/// A reference of the library that may be what is cited.
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Suggestion {
    /// The id of the reference.
    pub reference: String,
    pub sure: Sure,
    /// Why, in a few words for the one who reads: "the same item in Zotero",
    /// "the same DOI", "Nagy, 1979".
    pub why: String,
}

/// Text in which citations are looked for: a paragraph, what is said of a
/// figure, a cell, or a note. Notes are passages of their own, and what
/// stands in a note is not part of the passage the note stands in.
#[derive(Debug, Clone, Default, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Passage {
    /// What the one who asks calls it. Given back with what was found.
    pub id: String,
    /// The text, without its marks. What is no text (a citation, a formula,
    /// a note, words that point) is one U+FFFC each, so that the places
    /// are those of the text as it stands.
    pub text: String,
    /// Whether it is a note.
    pub note: bool,
    /// The parts of the text that are not to be looked at: they are
    /// citations that were found already, or were left as text. In units of
    /// UTF-16, as all places here.
    pub taken: Vec<(usize, usize)>,
}

/// What is taken for citations.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Options {
    /// Parentheses with a year in them are citations: "(Nagy 1979, 73)",
    /// and "Nagy (1979)".
    pub years: bool,
    /// A note that names a work of the library cites it: the note is
    /// proposed as a whole where a work of the library is likely in it.
    pub named: bool,
    /// Every note cites, whether a work of the library is found in it or
    /// not.
    pub notes: bool,
}

/// One work in what looks like a citation.
#[derive(Debug, Clone, Default, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", default)]
pub struct ProposedItem {
    /// Where the words of this work stand in the passage, with what is
    /// said before and after them, in units of UTF-16.
    pub start: usize,
    pub end: usize,
    /// The words that name the work: "Nagy 1979", "Lord, Singer of Tales".
    pub words: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub locator: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
    /// What stands before the work: "see", "but cf.".
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prefix: Option<String>,
    /// What stands after it and its locator: ", who argues otherwise".
    #[serde(skip_serializing_if = "Option::is_none")]
    pub suffix: Option<String>,
    pub suppress_author: bool,
    /// The references of the library it may be, the likeliest first. None,
    /// where nothing of the library is like it.
    pub suggestions: Vec<Suggestion>,
}

/// Something in a passage that looks like a citation.
#[derive(Debug, Clone, Default, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Proposal {
    /// The passage it was found in.
    pub passage: String,
    /// Where it stands in the passage, with its parentheses, in units of
    /// UTF-16. Of a note that is a citation as a whole, the whole note.
    pub start: usize,
    pub end: usize,
    pub mode: CiteMode,
    /// The works, in the order they stand in. One without a suggestion is
    /// for the writer to find.
    pub items: Vec<ProposedItem>,
}

/// The references of the library that may be what is cited, the likeliest
/// first. At most one is certain.
pub fn suggest(library: &Library, item: &FoundItem) -> Vec<Suggestion> {
    matching::suggest(library, item)
}

/// What looks like citations in the passages, in the order of the passages
/// and of the text.
pub fn propose(library: &Library, passages: &[Passage], options: &Options) -> Vec<Proposal> {
    forms::propose(library, passages, options)
}

/// What a program that keeps references says of a work, as a reference that
/// can be added to the library. Nothing, where it says too little.
pub fn draft(data: &Value) -> Option<Draft> {
    matching::draft(data)
}

/// The key of an item in Zotero, from its address. Nothing, where the
/// address is none of an item.
pub fn zotero_key(uri: &str) -> Option<String> {
    let (_, key) = uri.trim().trim_end_matches('/').rsplit_once("/items/")?;
    let key = key.trim();
    (key.len() == 8 && key.chars().all(|c| c.is_ascii_alphanumeric())).then(|| key.to_ascii_uppercase())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_key_of_an_item_in_zotero() {
        assert_eq!(zotero_key("http://zotero.org/users/123/items/ABCD2345").as_deref(), Some("ABCD2345"));
        assert_eq!(zotero_key("http://zotero.org/groups/9/items/wxyz6789/").as_deref(), Some("WXYZ6789"));
        assert_eq!(zotero_key("http://zotero.org/users/local/aB3dE/items/QRST2345").as_deref(), Some("QRST2345"));
        assert_eq!(zotero_key("http://zotero.org/users/123"), None);
        assert_eq!(zotero_key("http://example.org/items/short"), None);
    }

    #[test]
    fn what_the_mark_holds_is_written_as_the_interface_reads_it() {
        let found = Found {
            id: "a1b2c3d4e5f6".into(),
            by: By::Zotero,
            items: vec![FoundItem {
                uris: vec!["http://zotero.org/users/123/items/ABCD2345".into()],
                locator: Some("73".into()),
                ..Default::default()
            }],
            mode: CiteMode::Normal,
            left: false,
        };
        let written = serde_json::to_value(&found).unwrap();
        assert_eq!(
            written,
            serde_json::json!({
                "id": "a1b2c3d4e5f6",
                "by": "zotero",
                "items": [{ "uris": ["http://zotero.org/users/123/items/ABCD2345"], "locator": "73" }],
                "mode": "normal"
            })
        );
        assert_eq!(serde_json::from_value::<Found>(written).unwrap(), found);
    }
}
