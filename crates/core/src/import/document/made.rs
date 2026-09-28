//! Citations that a program that keeps references made in a Word or an
//! OpenDocument file: what the file says of them, and where they stand.
//!
//! Zotero, and Mendeley as it once was, write into the file what is cited,
//! as JSON in the form of CSL, around the text that the citation shows:
//!
//! - in a Word file as a field, whose code is ` ADDIN ZOTERO_ITEM
//!   CSL_CITATION {…} ` (Mendeley: `ADDIN CSL_CITATION {…}`), often cut into
//!   several runs, and whose result is the text;
//! - in an OpenDocument file as two reference marks, which are called
//!   `ZOTERO_ITEM CSL_CITATION {…} RND` and ten signs, with the text between;
//! - in both, where the writer has asked for it, as a bookmark that is
//!   called `ZOTERO_BREF_` and twelve signs, with what is cited in the
//!   properties of the document that are called as the bookmark and `_1`,
//!   `_2`, …, in pieces of 255 signs.
//!
//! So say `field.cpp` and `document.cpp` of Zotero's plugin for Word, and
//! `ReferenceMark.java`, `Bookmark.java` and `Properties.java` of the one
//! for LibreOffice.
//!
//! Pandoc reads the text and not what is said of it (with `+citations` it
//! reads the fields of a Word file, and leaves out the addresses of the
//! items, by which Zotero knows them). So it is read here, before Pandoc
//! reads: in the copy that Pandoc is given, the field or the marks are
//! taken away, and in their place stand signs that no text has, with the
//! number of the citation among those that were read. Pandoc reads the text
//! between them as the text it is, with its italics; and the reader of what
//! Pandoc gives puts the mark `found` on what stands between the signs.

use std::collections::{BTreeMap, HashMap};

use roxmltree::Node;
use serde_json::Value;

use super::lifting::{Change, TEXT, WORD, attribute, called, changed, is, opening, parse};
use super::several;
use crate::found::{By, FoundItem};

/// Where a citation that a program made begins: after it its number,
/// written in digits, and `NUMBERED`. Signs that are kept for the use of
/// programs, and stand in no text.
pub(super) const BEGIN: char = '\u{F0001}';
pub(super) const NUMBERED: char = '\u{F0002}';
/// Where it ends.
pub(super) const END: char = '\u{F0003}';

/// What is left out of what a program says of a work: what says nothing of
/// which work it is, and the number the work had where the text was written.
const LEFT_OUT: [&str; 6] = ["id", "abstract", "note", "annote", "keyword", "references"];

/// The longest that anything said of a work may be, but for what it is called.
const LONGEST: usize = 1000;

/// A citation that a program made.
#[derive(Debug, Clone, PartialEq)]
pub(super) struct Citation {
    pub by: By,
    pub items: Vec<FoundItem>,
}

/// What programs that keep references made in a file.
#[derive(Debug, Default)]
pub(super) struct Made {
    /// The citations, by the numbers that stand in the copy.
    pub citations: Vec<Citation>,
    /// A list of the works that are cited.
    pub list: bool,
    /// Citations that are kept in bookmarks, and of which the file does
    /// not say what they cite.
    pub dark: usize,
    /// Citations of EndNote, which says what it cites in a form of its
    /// own. They are not read here: Pandoc reads them, where it can.
    pub endnote: usize,
}

impl Made {
    /// What the one who brings the document in should know of it.
    pub fn remarks(&self) -> Vec<String> {
        let mut out = Vec::new();
        if self.dark > 0 {
            out.push(format!(
                "The document keeps {} in {}, and what {} could not be read: {} as {}. Zotero keeps them \
                 otherwise where its document preferences say so.",
                several(self.dark, "citation", "citations"),
                if self.dark == 1 { "a bookmark" } else { "bookmarks" },
                if self.dark == 1 { "it cites" } else { "they cite" },
                if self.dark == 1 { "it is text" } else { "they are text" },
                if self.dark == 1 { "it stands" } else { "they stand" }
            ));
        }
        out
    }

    /// The signs that a citation begins with in the copy.
    fn begin(&mut self, citation: Citation) -> String {
        self.citations.push(citation);
        format!("{BEGIN}{}{NUMBERED}", self.citations.len() - 1)
    }
}

/// Text without the signs that citations are set between.
pub(super) fn without_signs(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    let mut rest = text;
    while let Some(at) = rest.find([BEGIN, END]) {
        out.push_str(&rest[..at]);
        let begins = rest[at..].starts_with(BEGIN);
        rest = &rest[at + if begins { BEGIN } else { END }.len_utf8()..];
        if begins && let Some(end) = rest.find(NUMBERED) {
            rest = &rest[end + NUMBERED.len_utf8()..];
        }
    }
    out.push_str(rest);
    out
}

// =========================================================================
// What is said of what is cited
// =========================================================================

/// What the code of a field, or the name of a mark, says.
#[derive(Debug, PartialEq)]
pub(super) enum Code {
    Citation(Citation),
    /// The list of the works that are cited.
    List,
    /// A citation of EndNote.
    EndNote,
}

/// Reads the code of a field or the name of a mark. Nothing, where it is
/// not of a program that keeps references, or cannot be read.
pub(super) fn code(text: &str) -> Option<Code> {
    let text = text.trim();
    let text = text.strip_prefix("ADDIN").map_or(text, str::trim_start);
    let (by, said) = if let Some(rest) = text.strip_prefix("ZOTERO_ITEM") {
        (By::Zotero, rest)
    } else if text.starts_with("CSL_CITATION") {
        (By::Mendeley, text)
    } else if text.starts_with("ZOTERO_BIBL")
        || text.starts_with("CSL_BIBLIOGRAPHY")
        || text.starts_with("Mendeley Bibliography")
        || text.starts_with("EN.REFLIST")
    {
        return Some(Code::List);
    } else if text.starts_with("EN.CITE") && !text.starts_with("EN.CITE.DATA") {
        return Some(Code::EndNote);
    } else {
        return None;
    };
    // After it, in an OpenDocument file, stand signs that tell the marks apart.
    let said = said.get(said.find('{')?..=said.rfind('}')?)?;
    let value: Value = serde_json::from_str(said).ok()?;
    let items: Vec<FoundItem> = value.get("citationItems")?.as_array()?.iter().map(item).collect();
    (!items.is_empty()).then_some(Code::Citation(Citation { by, items }))
}

/// One work of a citation, as the program says it.
fn item(one: &Value) -> FoundItem {
    let said = |name: &str| {
        let text = match one.get(name)? {
            Value::String(text) => text.clone(),
            Value::Number(number) => number.to_string(),
            _ => return None,
        };
        Some(text.replace('\u{a0}', " ").trim().to_owned()).filter(|text| !text.is_empty())
    };
    let uris = match one.get("uris").or_else(|| one.get("uri")) {
        Some(Value::Array(all)) => all.iter().filter_map(Value::as_str).map(str::to_owned).collect(),
        Some(Value::String(one)) => vec![one.clone()],
        _ => Vec::new(),
    };
    let locator = said("locator");
    FoundItem {
        key: None,
        uris,
        data: one.get("itemData").and_then(data),
        // What is counted is said of a place, and pages are what is counted where nothing is said.
        label: locator.as_ref().and_then(|_| said("label")).filter(|label| label != "page"),
        locator,
        prefix: said("prefix"),
        suffix: said("suffix"),
        suppress_author: match one.get("suppress-author") {
            Some(Value::Bool(so)) => *so,
            Some(Value::Number(number)) => number.as_i64().is_some_and(|n| n != 0),
            Some(Value::String(text)) => text == "true" || text == "1",
            _ => false,
        },
    }
}

/// What a program says of a work, without what says nothing of which work
/// it is. Nothing, where nothing is left.
pub(super) fn data(given: &Value) -> Option<Value> {
    let kept: serde_json::Map<String, Value> = given
        .as_object()?
        .iter()
        .filter(|(name, value)| {
            let long = value.as_str().is_some_and(|text| text.chars().count() > LONGEST);
            !LEFT_OUT.contains(&name.as_str()) && (!long || name.as_str() == "title")
        })
        .map(|(name, value)| (name.clone(), value.clone()))
        .collect();
    (!kept.is_empty()).then_some(Value::Object(kept))
}

/// What is cited at the bookmarks of a document, by what the bookmarks are
/// called.
pub(super) type Kept = HashMap<String, String>;

/// Reads what is cited at the bookmarks from the properties of a document:
/// `docProps/custom.xml` of a Word file, `meta.xml` of an OpenDocument
/// file. It is kept in pieces, which are numbered.
pub(super) fn kept(properties: &str) -> Kept {
    let mut pieces: HashMap<String, BTreeMap<usize, String>> = HashMap::new();
    let Some(document) = parse(properties) else { return Kept::new() };
    for node in document.descendants().filter(Node::is_element) {
        // `property` with `name` in a Word file, `meta:user-defined` with `meta:name` in OpenDocument.
        if !matches!(node.tag_name().name(), "property" | "user-defined") {
            continue;
        }
        let Some(name) = attribute(&node, "name") else { continue };
        let Some((bookmark, number)) = name.rsplit_once('_') else { continue };
        let Ok(number) = number.parse::<usize>() else { continue };
        if !is_bookmark(bookmark) {
            continue;
        }
        let said: String = node.descendants().filter(Node::is_text).filter_map(|text| text.text()).collect();
        pieces.entry(bookmark.to_owned()).or_default().insert(number, said);
    }
    pieces.into_iter().map(|(bookmark, pieces)| (bookmark, pieces.into_values().collect())).collect()
}

/// Whether a bookmark is called as those that citations are kept in.
fn is_bookmark(name: &str) -> bool {
    name.starts_with("ZOTERO_BREF_") || name.starts_with("CSL_BREF_")
}

// =========================================================================
// Word
// =========================================================================

/// A field that has begun, and not ended.
struct Field<'a, 'input> {
    begin: Node<'a, 'input>,
    /// The runs of its code.
    codes: Vec<Node<'a, 'input>>,
    code: String,
    /// Where the code ends, and what is shown begins.
    separate: Option<Node<'a, 'input>>,
}

/// A run of the text that holds the signs. `like` is an element of the
/// text, which tells what stands before the colon in the names.
fn signs_in_a_run(source: &str, like: &Node, signs: &str, run: bool) -> String {
    let name = called(source, like);
    let before = name.rsplit_once(':').map(|(before, _)| format!("{before}:")).unwrap_or_default();
    if run {
        format!("<{before}r><{before}t>{signs}</{before}t></{before}r>")
    } else {
        format!("<{before}t>{signs}</{before}t>")
    }
}

/// A part of a Word file with its citations set between signs. Nothing,
/// where it has none that can be read.
pub(super) fn docx(source: &str, kept: &Kept, made: &mut Made) -> Option<String> {
    // Not worth the reading where nothing of it can be there.
    if !["fldChar", "fldSimple", "bookmarkStart"].iter().any(|name| source.contains(name)) {
        return None;
    }
    let document = parse(source)?;
    let mut changes: Vec<Change> = Vec::new();
    let mut open: Vec<Field> = Vec::new();
    // The bookmarks that are read, by their numbers, which their ends have as well.
    let mut bookmarks: HashMap<&str, Node> = HashMap::new();
    let gone = |node: &Node| node.ancestors().any(|a| is(&a, WORD, "del") || is(&a, WORD, "moveFrom"));
    for node in document.descendants().filter(Node::is_element) {
        if is(&node, WORD, "fldChar") {
            match attribute(&node, "fldCharType") {
                Some("begin") => {
                    open.push(Field { begin: node, codes: Vec::new(), code: String::new(), separate: None })
                }
                Some("separate") => {
                    if let Some(field) = open.last_mut() {
                        field.separate = Some(node);
                    }
                }
                Some("end") => {
                    let Some(field) = open.pop() else { continue };
                    if gone(&field.begin) {
                        continue;
                    }
                    match code(&field.code) {
                        Some(Code::Citation(citation)) => {
                            // A field that shows nothing is nothing in the text.
                            let Some(separate) = field.separate else { continue };
                            let signs = made.begin(citation);
                            changes.push(Change {
                                at: field.begin.range(),
                                with: signs_in_a_run(source, &field.begin, &signs, false),
                            });
                            changes.extend(field.codes.iter().map(|c| Change { at: c.range(), with: String::new() }));
                            changes.push(Change { at: separate.range(), with: String::new() });
                            changes.push(Change {
                                at: node.range(),
                                with: signs_in_a_run(source, &node, &END.to_string(), false),
                            });
                        }
                        Some(Code::List) => made.list = true,
                        Some(Code::EndNote) => made.endnote += 1,
                        None => {}
                    }
                }
                _ => {}
            }
        } else if is(&node, WORD, "instrText") {
            if let Some(field) = open.last_mut()
                && field.separate.is_none()
            {
                field.code.extend(node.descendants().filter(Node::is_text).filter_map(|text| text.text()));
                field.codes.push(node);
            }
        } else if is(&node, WORD, "fldSimple") {
            // A field as Word writes it where its code is short.
            if gone(&node) {
                continue;
            }
            match attribute(&node, "instr").and_then(code) {
                Some(Code::Citation(citation)) => {
                    let Some((begun, ended)) = opening(source, &node) else { continue };
                    let closing = format!("</{}", called(source, &node));
                    let end = source.get(..node.range().end).and_then(|until| until.rfind(&closing));
                    let (false, Some(end)) = (ended, end) else { continue };
                    let signs = made.begin(citation);
                    changes.push(Change {
                        at: node.range().start..begun,
                        with: signs_in_a_run(source, &node, &signs, true),
                    });
                    changes.push(Change {
                        at: end..node.range().end,
                        with: signs_in_a_run(source, &node, &END.to_string(), true),
                    });
                }
                Some(Code::List) => made.list = true,
                Some(Code::EndNote) => made.endnote += 1,
                None => {}
            }
        } else if is(&node, WORD, "bookmarkStart") {
            let Some(name) = attribute(&node, "name").filter(|name| is_bookmark(name)) else { continue };
            if gone(&node) {
                continue;
            }
            match kept.get(name).map(String::as_str).and_then(code) {
                Some(Code::Citation(_)) => {
                    if let Some(id) = attribute(&node, "id") {
                        bookmarks.insert(id, node);
                    }
                }
                Some(Code::List) => made.list = true,
                Some(Code::EndNote) => {}
                None => made.dark += 1,
            }
        } else if is(&node, WORD, "bookmarkEnd") {
            let Some(begin) = attribute(&node, "id").and_then(|id| bookmarks.remove(id)) else { continue };
            // Signs are text, and can stand where runs stand: in the same paragraph, both of them.
            let name = attribute(&begin, "name").unwrap_or("");
            let Some(Code::Citation(citation)) = kept.get(name).map(String::as_str).and_then(code) else { continue };
            let within = begin.parent().filter(|p| is(p, WORD, "p"));
            if within.is_none() || within != node.parent() {
                made.dark += 1;
                continue;
            }
            let signs = made.begin(citation);
            changes.push(Change { at: begin.range(), with: signs_in_a_run(source, &begin, &signs, true) });
            changes.push(Change { at: node.range(), with: signs_in_a_run(source, &node, &END.to_string(), true) });
        }
    }
    // Bookmarks that do not end are not read.
    made.dark += bookmarks.len();
    if changes.is_empty() {
        return None;
    }
    changed(source, changes)
}

// =========================================================================
// OpenDocument
// =========================================================================

/// The text of an OpenDocument file with its citations set between signs.
/// Nothing, where it has none that can be read.
pub(super) fn odt(source: &str, kept: &Kept, made: &mut Made) -> Option<String> {
    if !["reference-mark-start", "bookmark-start", "ZOTERO_BIBL", "CSL_BIBLIOGRAPHY"]
        .iter()
        .any(|name| source.contains(name))
    {
        return None;
    }
    let document = parse(source)?;
    let mut changes: Vec<Change> = Vec::new();
    // The marks that have begun, by what they are called.
    let mut open: Vec<&str> = Vec::new();
    for node in document.descendants().filter(Node::is_element) {
        if !node.tag_name().namespace().is_some_and(|space| space.contains(TEXT)) {
            continue;
        }
        let Some(name) = attribute(&node, "name") else { continue };
        let kind = node.tag_name().name();
        match kind {
            "reference-mark-start" | "bookmark-start" => {
                // What was taken away, and is kept for the changes to be seen, is not in the text.
                if node.ancestors().any(|a| is(&a, TEXT, "tracked-changes")) {
                    continue;
                }
                let said = if kind == "bookmark-start" {
                    if !is_bookmark(name) {
                        continue;
                    }
                    kept.get(name).map(String::as_str).and_then(code)
                } else {
                    code(name)
                };
                match said {
                    Some(Code::Citation(citation)) => {
                        changes.push(Change { at: node.range(), with: made.begin(citation) });
                        open.push(name);
                    }
                    Some(Code::List) => made.list = true,
                    Some(Code::EndNote) => {}
                    None if kind == "bookmark-start" => made.dark += 1,
                    None => {}
                }
            }
            "reference-mark-end" | "bookmark-end" => {
                if let Some(at) = open.iter().position(|has| *has == name) {
                    open.remove(at);
                    changes.push(Change { at: node.range(), with: END.to_string() });
                }
            }
            // The list of the works is a section of the text.
            "section" if code(name) == Some(Code::List) => made.list = true,
            _ => {}
        }
    }
    if changes.is_empty() {
        return None;
    }
    changed(source, changes)
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    const NAGY: &str = r#"{"citationID":"wX3kq9Lm","properties":{"formattedCitation":"(Nagy 1979, 73)","plainCitation":"(Nagy 1979, 73)","noteIndex":0},"citationItems":[{"id":12,"uris":["http://zotero.org/users/1234567/items/ABCD2345"],"itemData":{"id":12,"type":"book","abstract":"Long.","note":"Of the keeper.","title":"The Best of the Achaeans","author":[{"family":"Nagy","given":"Gregory"}],"issued":{"date-parts":[["1979"]]}},"locator":"73","label":"page"}],"schema":"https://github.com/citation-style-language/schema/raw/master/csl-citation.json"}"#;

    fn nagy(by: By) -> Citation {
        Citation {
            by,
            items: vec![FoundItem {
                uris: vec!["http://zotero.org/users/1234567/items/ABCD2345".into()],
                data: Some(json!({
                    "type": "book",
                    "title": "The Best of the Achaeans",
                    "author": [{ "family": "Nagy", "given": "Gregory" }],
                    "issued": { "date-parts": [["1979"]] }
                })),
                locator: Some("73".into()),
                ..Default::default()
            }],
        }
    }

    #[test]
    fn what_a_code_says() {
        assert_eq!(code(&format!(" ADDIN ZOTERO_ITEM CSL_CITATION {NAGY} ")), Some(Code::Citation(nagy(By::Zotero))));
        assert_eq!(
            code(&format!("ZOTERO_ITEM CSL_CITATION {NAGY} RNDaB3dE5gH7j")),
            Some(Code::Citation(nagy(By::Zotero)))
        );
        assert_eq!(code(&format!("ADDIN CSL_CITATION {NAGY}")), Some(Code::Citation(nagy(By::Mendeley))));
        assert_eq!(code(r#" ADDIN ZOTERO_BIBL {"uncited":[],"custom":[]} CSL_BIBLIOGRAPHY "#), Some(Code::List));
        assert_eq!(code(" ZOTERO_BIBL {} CSL_BIBLIOGRAPHY RNDgH7iJ9kL1m"), Some(Code::List));
        assert_eq!(code("ADDIN Mendeley Bibliography CSL_BIBLIOGRAPHY"), Some(Code::List));
        assert_eq!(code(" ADDIN EN.CITE <EndNote><Cite><Author>Nagy</Author></Cite></EndNote>"), Some(Code::EndNote));
        assert_eq!(code(" ADDIN EN.CITE.DATA "), None);
        assert_eq!(code(" PAGEREF _Toc123 \\h "), None);
        assert_eq!(code(" ADDIN ZOTERO_ITEM CSL_CITATION {\"citationItems\":[ "), None);
        assert_eq!(code(r#" ADDIN ZOTERO_ITEM CSL_CITATION {"citationItems":[]} "#), None);
    }

    #[test]
    fn the_works_of_a_citation_with_all_that_is_said_of_them() {
        let said = r#"ZOTERO_ITEM CSL_CITATION {"citationItems":[
            {"id":1,"uri":["http://zotero.org/groups/9/items/WXYZ6789"],"itemData":{"id":1,"title":"A"},"locator":"2","label":"chapter","prefix":"see ","suffix":" and elsewhere","suppress-author":true},
            {"id":2,"uris":"http://zotero.org/users/local/aB3dE/items/QRST2345","locator":12,"label":"page","prefix":"  ","suppress-author":false},
            {"id":3,"itemData":{"id":3,"abstract":"Long."},"label":"chapter"}
        ]} RNDaB3dE5gH7j"#;
        let Some(Code::Citation(citation)) = code(said) else { panic!() };
        assert_eq!(
            citation.items,
            vec![
                FoundItem {
                    uris: vec!["http://zotero.org/groups/9/items/WXYZ6789".into()],
                    data: Some(json!({ "title": "A" })),
                    locator: Some("2".into()),
                    label: Some("chapter".into()),
                    prefix: Some("see".into()),
                    suffix: Some("and elsewhere".into()),
                    suppress_author: true,
                    ..Default::default()
                },
                FoundItem {
                    uris: vec!["http://zotero.org/users/local/aB3dE/items/QRST2345".into()],
                    locator: Some("12".into()),
                    ..Default::default()
                },
                FoundItem::default(),
            ]
        );
        // What is long says nothing of which work it is, but for what it is called.
        let long = "a".repeat(LONGEST + 1);
        assert_eq!(
            data(&json!({ "title": long, "source": long, "DOI": "10.1/x" })),
            Some(json!({ "title": long, "DOI": "10.1/x" }))
        );
    }

    const DOCX: &str = r#"<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>"#;

    fn docx_of(body: &str) -> String {
        format!("{DOCX}{body}</w:body></w:document>")
    }

    fn within(text: &str) -> &str {
        let from = text.find("<w:body>").unwrap() + "<w:body>".len();
        &text[from..text.find("</w:body>").unwrap()]
    }

    fn escaped(text: &str) -> String {
        text.replace('&', "&amp;").replace('<', "&lt;").replace('"', "&quot;")
    }

    #[test]
    fn the_fields_of_word_are_set_between_signs() {
        let code = escaped(&format!(" ADDIN ZOTERO_ITEM CSL_CITATION {NAGY} "));
        // Cut in two, as Word cuts a code that is long.
        let (one, two) = code.split_at(code.find("locator").unwrap() + 3);
        let text = docx_of(&format!(
            r#"<w:p><w:r><w:t xml:space="preserve">Before </w:t></w:r><w:r><w:rPr><w:i/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve">{one}</w:instrText></w:r><w:r><w:instrText xml:space="preserve">{two}</w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>(Nagy </w:t></w:r><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1979</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r><w:r><w:t>, 73)</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r><w:r><w:t> after.</w:t></w:r></w:p><w:p><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText> ADDIN ZOTERO_BIBL {{}} CSL_BIBLIOGRAPHY </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>Nagy, G. 1979.</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p><w:p><w:fldSimple w:instr="{}"><w:r><w:t>(Nagy 1979, 73)</w:t></w:r></w:fldSimple><w:del><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:delInstrText>{code}</w:delInstrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:delText>(gone)</w:delText></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:del></w:p>"#,
            escaped(&format!("ADDIN CSL_CITATION {NAGY}")),
        ));
        let mut made = Made::default();
        let read = docx(&text, &Kept::new(), &mut made).unwrap();
        assert_eq!(
            within(&read),
            format!(
                r#"<w:p><w:r><w:t xml:space="preserve">Before </w:t></w:r><w:r><w:rPr><w:i/></w:rPr><w:t>{BEGIN}0{NUMBERED}</w:t></w:r><w:r></w:r><w:r></w:r><w:r></w:r><w:r><w:t>(Nagy </w:t></w:r><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1979</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r><w:r><w:t>, 73)</w:t></w:r><w:r><w:t>{END}</w:t></w:r><w:r><w:t> after.</w:t></w:r></w:p><w:p><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText> ADDIN ZOTERO_BIBL {{}} CSL_BIBLIOGRAPHY </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>Nagy, G. 1979.</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p><w:p><w:r><w:t>{BEGIN}1{NUMBERED}</w:t></w:r><w:r><w:t>(Nagy 1979, 73)</w:t></w:r><w:r><w:t>{END}</w:t></w:r><w:del><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:delInstrText>{code}</w:delInstrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:delText>(gone)</w:delText></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:del></w:p>"#
            )
        );
        assert!(parse(&read).is_some());
        assert_eq!(made.citations, vec![nagy(By::Zotero), nagy(By::Mendeley)]);
        assert!(made.list);
        assert!(made.remarks().is_empty());
        // Where there is nothing of it, nothing is done.
        let mut made = Made::default();
        let plain = docx_of(
            r#"<w:p><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>2</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>"#,
        );
        assert!(docx(&plain, &Kept::new(), &mut made).is_none());
        assert!(made.citations.is_empty() && !made.list);
    }

    #[test]
    fn what_is_kept_in_bookmarks_is_read_from_the_properties() {
        let said = format!("ZOTERO_ITEM CSL_CITATION {NAGY}");
        let chars: Vec<char> = said.chars().collect();
        let pieces: Vec<String> = chars.chunks(255).map(|piece| piece.iter().collect()).collect();
        assert!(pieces.len() > 2);
        // In the order of their names, as LibreOffice writes them, which is not that of their numbers.
        let mut numbered: Vec<(usize, &String)> = pieces.iter().enumerate().map(|(n, piece)| (n + 1, piece)).collect();
        numbered.sort_by_key(|(n, _)| n.to_string());
        let custom = format!(
            r#"<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><property fmtid="x" pid="2" name="ZOTERO_PREF_1"><vt:lpwstr>data</vt:lpwstr></property>{}</Properties>"#,
            numbered
                .iter()
                .map(|(n, piece)| format!(
                    r#"<property fmtid="x" pid="{}" name="ZOTERO_BREF_Qw3Er5Ty7Ui9_{n}"><vt:lpwstr>{}</vt:lpwstr></property>"#,
                    n + 2,
                    escaped(piece)
                ))
                .collect::<String>()
        );
        let kept = kept(&custom);
        assert_eq!(kept.len(), 1);
        assert_eq!(kept["ZOTERO_BREF_Qw3Er5Ty7Ui9"], said);

        let text = docx_of(
            r#"<w:p><w:r><w:t>Before </w:t></w:r><w:bookmarkStart w:id="4" w:name="ZOTERO_BREF_Qw3Er5Ty7Ui9"/><w:r><w:t>(Nagy 1979, 73)</w:t></w:r><w:bookmarkEnd w:id="4"/><w:bookmarkStart w:id="5" w:name="_GoBack"/><w:bookmarkEnd w:id="5"/><w:bookmarkStart w:id="6" w:name="ZOTERO_BREF_As2Df4Gh6Jk8"/><w:r><w:t>(West 1988)</w:t></w:r><w:bookmarkEnd w:id="6"/></w:p>"#,
        );
        let mut made = Made::default();
        let read = docx(&text, &kept, &mut made).unwrap();
        assert_eq!(
            within(&read),
            format!(
                r#"<w:p><w:r><w:t>Before </w:t></w:r><w:r><w:t>{BEGIN}0{NUMBERED}</w:t></w:r><w:r><w:t>(Nagy 1979, 73)</w:t></w:r><w:r><w:t>{END}</w:t></w:r><w:bookmarkStart w:id="5" w:name="_GoBack"/><w:bookmarkEnd w:id="5"/><w:bookmarkStart w:id="6" w:name="ZOTERO_BREF_As2Df4Gh6Jk8"/><w:r><w:t>(West 1988)</w:t></w:r><w:bookmarkEnd w:id="6"/></w:p>"#
            )
        );
        assert_eq!(made.citations, vec![nagy(By::Zotero)]);
        assert_eq!(
            made.remarks(),
            vec![
                "The document keeps 1 citation in a bookmark, and what it cites could not be read: it is text as it \
                 stands. Zotero keeps them otherwise where its document preferences say so."
            ]
        );

        let meta = format!(
            r#"<office:document-meta xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"><office:meta>{}</office:meta></office:document-meta>"#,
            numbered
                .iter()
                .map(|(n, piece)| format!(
                    r#"<meta:user-defined meta:name="ZOTERO_BREF_Qw3Er5Ty7Ui9_{n}" meta:value-type="string">{}</meta:user-defined>"#,
                    escaped(piece)
                ))
                .collect::<String>()
        );
        assert_eq!(super::kept(&meta), kept);
    }

    const ODT: &str = r#"<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"><office:body><office:text>"#;

    #[test]
    fn the_marks_of_opendocument_are_set_between_signs() {
        let name = escaped(&format!("ZOTERO_ITEM CSL_CITATION {NAGY} RNDaB3dE5gH7j"));
        let text = format!(
            r#"{ODT}<text:p>Before <text:reference-mark-start text:name="{name}"/>(Nagy, <text:span text:style-name="T1">Best</text:span>, 73)<text:reference-mark-end text:name="{name}"/> after.<text:note><text:note-body><text:p>See <text:bookmark-start text:name="ZOTERO_BREF_Qw3Er5Ty7Ui9"/>Nagy<text:bookmark-end text:name="ZOTERO_BREF_Qw3Er5Ty7Ui9"/>; and <text:bookmark-start text:name="ZOTERO_BREF_As2Df4Gh6Jk8"/>West<text:bookmark-end text:name="ZOTERO_BREF_As2Df4Gh6Jk8"/>, <text:reference-mark-start text:name="mine"/>marked<text:reference-mark-end text:name="mine"/>.</text:p></text:note-body></text:note></text:p><text:section text:name=" ZOTERO_BIBL {{&quot;uncited&quot;:[]}} CSL_BIBLIOGRAPHY RNDgH7iJ9kL1m"><text:p>Nagy, G. 1979.</text:p></text:section></office:text></office:body></office:document-content>"#
        );
        let kept = Kept::from([("ZOTERO_BREF_Qw3Er5Ty7Ui9".to_owned(), format!("ZOTERO_ITEM CSL_CITATION {NAGY}"))]);
        let mut made = Made::default();
        let read = odt(&text, &kept, &mut made).unwrap();
        let from = read.find("<office:text>").unwrap() + "<office:text>".len();
        assert_eq!(
            &read[from..read.find("<text:section").unwrap()],
            format!(
                r#"<text:p>Before {BEGIN}0{NUMBERED}(Nagy, <text:span text:style-name="T1">Best</text:span>, 73){END} after.<text:note><text:note-body><text:p>See {BEGIN}1{NUMBERED}Nagy{END}; and <text:bookmark-start text:name="ZOTERO_BREF_As2Df4Gh6Jk8"/>West<text:bookmark-end text:name="ZOTERO_BREF_As2Df4Gh6Jk8"/>, <text:reference-mark-start text:name="mine"/>marked<text:reference-mark-end text:name="mine"/>.</text:p></text:note-body></text:note></text:p>"#
            )
        );
        assert!(parse(&read).is_some());
        assert_eq!(made.citations, vec![nagy(By::Zotero), nagy(By::Zotero)]);
        assert!(made.list);
        assert_eq!(made.dark, 1);
        let mut made = Made::default();
        assert!(
            odt(
                &format!("{ODT}<text:p>Text.</text:p></office:text></office:body></office:document-content>"),
                &kept,
                &mut made
            )
            .is_none()
        );
    }

    #[test]
    fn text_without_the_signs() {
        assert_eq!(without_signs(&format!("a {BEGIN}12{NUMBERED}(Nagy){END} b")), "a (Nagy) b");
        assert_eq!(without_signs(&format!("{END}{BEGIN}")), "");
        assert_eq!(without_signs("as it is"), "as it is");
    }
}
