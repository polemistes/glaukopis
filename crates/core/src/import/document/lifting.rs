//! What is done with an OpenDocument or a Word file before Pandoc reads it.
//!
//! The file is never changed. Where Pandoc would lose something of it, a
//! copy is made where the work is done, and Pandoc reads the copy:
//!
//! - **What stands in a frame** is lifted out, to stand as paragraphs after
//!   the paragraph the frame is set in. A picture with what is said of it is
//!   made so by LibreOffice, and by Word where the two are to be moved as
//!   one; other text in frames is text all the same.
//! - **Paragraphs that say something of a figure or a table** are known by
//!   their style, whatever it is called in the language of the writer. They
//!   are marked, by signs at their beginning that no text has, so that they
//!   are known again when Pandoc has read them. See `captions.rs`.
//! - **Headings written as paragraphs**, as LibreOffice has them in what it
//!   took from HTML, are made headings.
//! - **Citations made by a program that keeps references** are set between
//!   signs, and what the file says of them is read. See `made.rs`.
//!
//! Here is also read what the file says of itself where Pandoc does not
//! tell: who wrote it, its title, its keywords; whether changes are tracked
//! in it; and how many pictures it holds, so that it can be said when some
//! did not arrive.

use std::collections::{HashMap, HashSet};
use std::fs;
use std::io::{Read, Seek, Write};
use std::ops::Range;
use std::path::{Path, PathBuf};

use roxmltree::{Document, Node};

use super::made::{self, Made};
use super::{Format, MAX_BYTES, Properties};
use crate::tr;

/// What marks a paragraph that says something of a figure or a table: two
/// signs that are kept for the use of programs, and stand in no text.
pub(super) const MARK: &str = "\u{F0000}\u{10FFFD}";

/// The most that one part of a file may hold when it is unpacked.
const MOST: u64 = 6 * MAX_BYTES;

/// How often frames within frames are lifted out.
const DEEPEST: usize = 6;

#[derive(Debug, Default)]
pub(super) struct Prepared {
    /// A copy to be read in the place of the file. Nothing, where the file
    /// is read as it is.
    pub copy: Option<PathBuf>,
    pub properties: Properties,
    /// What the one who brings the document in should know.
    pub remarks: Vec<String>,
    /// How many pictures the file holds.
    pub held: usize,
    /// What programs that keep references made in it.
    pub made: Made,
}

/// Looks at a file before it is read, and makes a copy of it in `work`
/// where Pandoc would not read all of it as it is.
pub(super) fn prepare(path: &Path, format: Format, work: &Path) -> Prepared {
    let mut out = Prepared::default();
    if !matches!(format, Format::Odt | Format::Docx) {
        return out;
    }
    let Ok(file) = fs::File::open(path) else { return out };
    // A file that is not what its name says is left to Pandoc, which says so.
    let Ok(mut archive) = zip::ZipArchive::new(file) else { return out };
    let (pictures, text) = match format {
        Format::Odt => ("Pictures/", "content.xml"),
        _ => ("word/media/", "word/document.xml"),
    };
    out.held = archive.file_names().filter(|name| name.starts_with(pictures) && is_picture(name)).count();

    let written = part(&mut archive, text);
    // The parts that are written anew, by what they are called in the file.
    let mut anew: Vec<(String, String)> = Vec::new();
    match format {
        Format::Odt => {
            let mut kept = made::Kept::new();
            if let Some(meta) = part(&mut archive, "meta.xml") {
                out.properties = odt_properties(&meta);
                kept = made::kept(&meta);
            }
            if written.as_deref().is_some_and(|xml| xml.contains(":changed-region")) {
                out.remarks.push(tracked());
            }
            let styles = part(&mut archive, "styles.xml");
            let lifted = written.as_deref().and_then(|xml| odt_text(xml, styles.as_deref()));
            let cited = lifted.as_deref().or(written.as_deref()).and_then(|xml| made::odt(xml, &kept, &mut out.made));
            anew.extend(cited.or(lifted).map(|now| (text.to_owned(), now)));
        }
        _ => {
            if let Some(core) = part(&mut archive, "docProps/core.xml") {
                out.properties = docx_properties(&core);
            }
            if written.as_deref().is_some_and(|xml| {
                ["<w:ins ", "<w:del ", "<w:moveFrom ", "<w:moveTo "].iter().any(|mark| xml.contains(mark))
            }) {
                out.remarks.push(tracked());
            }
            if part(&mut archive, "word/comments.xml").is_some_and(|xml| xml.contains("<w:comment ")) {
                out.remarks.push(tr!("core-import-document-comments"));
            }
            let kept = part(&mut archive, "docProps/custom.xml").map(|custom| made::kept(&custom)).unwrap_or_default();
            let styles = part(&mut archive, "word/styles.xml");
            let lifted = written.as_deref().and_then(|xml| docx_text(xml, styles.as_deref()));
            let cited = lifted.as_deref().or(written.as_deref()).and_then(|xml| made::docx(xml, &kept, &mut out.made));
            anew.extend(cited.or(lifted).map(|now| (text.to_owned(), now)));
            // The notes are parts of their own.
            for notes in ["word/footnotes.xml", "word/endnotes.xml"] {
                let cited = part(&mut archive, notes).and_then(|xml| made::docx(&xml, &kept, &mut out.made));
                anew.extend(cited.map(|now| (notes.to_owned(), now)));
            }
        }
    }
    out.remarks.extend(out.made.remarks());
    if !anew.is_empty()
        && let Some(name) = path.file_name()
    {
        let copy = work.join("copy").join(name);
        if fs::create_dir_all(work.join("copy")).is_ok() && write_copy(&mut archive, &copy, &anew).is_some() {
            out.copy = Some(copy);
        } else {
            tracing::warn!(file = %path.display(), "the copy to be read could not be made; the file is read as it is");
            // What was made is known by the signs in the copy, and by nothing else.
            out.made.citations.clear();
        }
    }
    out
}

/// What is said of a document with changes that are tracked.
fn tracked() -> String {
    tr!("core-import-document-tracked")
}

fn is_picture(name: &str) -> bool {
    let ending = name.rsplit('.').next().unwrap_or("").to_ascii_lowercase();
    matches!(
        ending.as_str(),
        "png" | "jpg" | "jpeg" | "gif" | "bmp" | "tif" | "tiff" | "svg" | "webp" | "emf" | "wmf" | "svm" | "pct"
    )
}

/// A part of the file as text, if it is there, is text, and is not too large.
fn part<R: Read + Seek>(archive: &mut zip::ZipArchive<R>, name: &str) -> Option<String> {
    let part = archive.by_name(name).ok()?;
    let mut bytes = Vec::new();
    part.take(MOST + 1).read_to_end(&mut bytes).ok()?;
    if bytes.len() as u64 > MOST {
        return None;
    }
    let text = String::from_utf8(bytes).ok()?;
    Some(text.strip_prefix('\u{feff}').map(str::to_owned).unwrap_or(text))
}

/// The file again, with some parts of it written anew: each by what it is
/// called, with its text.
pub(super) fn write_copy<R: Read + Seek>(
    archive: &mut zip::ZipArchive<R>,
    to: &Path,
    anew: &[(String, String)],
) -> Option<()> {
    let mut writer = zip::ZipWriter::new(fs::File::create(to).ok()?);
    for i in 0..archive.len() {
        let file = archive.by_index_raw(i).ok()?;
        if let Some((name, text)) = anew.iter().find(|(name, _)| file.name() == name) {
            drop(file);
            let options = zip::write::SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);
            writer.start_file(name.as_str(), options).ok()?;
            writer.write_all(text.as_bytes()).ok()?;
        } else {
            writer.raw_copy_file(file).ok()?;
        }
    }
    writer.finish().ok()?;
    Some(())
}

// =========================================================================
// What a file says of itself
// =========================================================================

/// What an ODT says of itself, which Pandoc does not read. Not the
/// language: what is written there is what the program was set to, and not
/// what the text is written in.
fn odt_properties(meta: &str) -> Properties {
    let mut out = Properties::default();
    let Ok(parsed) = Document::parse(meta) else { return out };
    for node in parsed.descendants().filter(Node::is_element) {
        let Some(said) = node.text().map(str::trim).filter(|t| !t.is_empty()) else { continue };
        match node.tag_name().name() {
            "title" => out.title = Some(said.to_owned()),
            "initial-creator" => out.authors = vec![said.to_owned()],
            "keyword" => out.keywords.push(said.to_owned()),
            _ => {}
        }
    }
    out
}

/// What a DOCX says of itself. The language is not taken from there:
/// LibreOffice writes what the computer is set to, whatever the text is
/// written in.
fn docx_properties(core: &str) -> Properties {
    let mut out = Properties::default();
    let Ok(parsed) = Document::parse(core) else { return out };
    for node in parsed.descendants().filter(Node::is_element) {
        let Some(said) = node.text().map(str::trim).filter(|t| !t.is_empty()) else { continue };
        match node.tag_name().name() {
            "title" => out.title = Some(said.to_owned()),
            "creator" => {
                out.authors = said.split(';').map(|a| a.trim().to_owned()).filter(|a| !a.is_empty()).collect();
            }
            "keywords" => out.keywords = keywords(said),
            _ => {}
        }
    }
    out
}

/// Keywords written in one line: Word sets them apart by commas or
/// semicolons, LibreOffice by commas or by nothing but the room between them.
fn keywords(said: &str) -> Vec<String> {
    let apart: Vec<&str> =
        if said.contains([',', ';']) { said.split([',', ';']).collect() } else { said.split_whitespace().collect() };
    let mut out: Vec<String> = Vec::new();
    for word in apart {
        let word = word.split_whitespace().collect::<Vec<_>>().join(" ");
        if !word.is_empty() && !out.contains(&word) {
            out.push(word);
        }
    }
    out
}

// =========================================================================
// Writing a text anew
// =========================================================================

/// Something to be written in the place of a stretch of the text; where
/// the stretch is empty, something to be put in.
pub(super) struct Change {
    pub at: Range<usize>,
    pub with: String,
}

/// The text with the changes made. They must not reach into each other;
/// those at the same place are made in the order they were given in.
pub(super) fn changed(source: &str, mut changes: Vec<Change>) -> Option<String> {
    changes.sort_by_key(|c| c.at.start);
    let mut out = String::with_capacity(source.len() + changes.iter().map(|c| c.with.len()).sum::<usize>());
    let mut at = 0usize;
    for change in changes {
        if change.at.start < at || change.at.end < change.at.start || change.at.end > source.len() {
            return None;
        }
        out.push_str(source.get(at..change.at.start)?);
        out.push_str(&change.with);
        at = change.at.end;
    }
    out.push_str(source.get(at..)?);
    Some(out)
}

pub(super) fn parse(source: &str) -> Option<Document<'_>> {
    Document::parse_with_options(source, roxmltree::ParsingOptions { allow_dtd: false, ..Default::default() }).ok()
}

pub(super) fn is(node: &Node, space: &str, name: &str) -> bool {
    node.is_element()
        && node.tag_name().name() == name
        && node.tag_name().namespace().is_some_and(|ns| ns.contains(space))
}

pub(super) fn attribute<'a>(node: &Node<'a, '_>, name: &str) -> Option<&'a str> {
    node.attributes().find(|a| a.name() == name).map(|a| a.value())
}

/// What an element is called in the text, with what stands before the
/// colon: `text:p`.
pub(super) fn called<'a>(source: &'a str, node: &Node) -> &'a str {
    let from = node.range().start + 1;
    let rest = source.get(from..).unwrap_or("");
    let end = rest.find(|c: char| c.is_whitespace() || c == '>' || c == '/').unwrap_or(rest.len());
    &rest[..end]
}

/// Where the tag that begins an element ends, and whether the element ends with it.
pub(super) fn opening(source: &str, node: &Node) -> Option<(usize, bool)> {
    let bytes = source.as_bytes();
    let mut quote: Option<u8> = None;
    let mut i = node.range().start;
    while i < node.range().end {
        let b = bytes[i];
        match quote {
            Some(q) if b == q => quote = None,
            Some(_) => {}
            None if b == b'"' || b == b'\'' => quote = Some(b),
            None if b == b'>' => return Some((i + 1, i > 0 && bytes[i - 1] == b'/')),
            None => {}
        }
        i += 1;
    }
    None
}

/// The elements an element holds, as they stand in the text: from the
/// first to the last.
fn held<'a>(source: &'a str, node: &Node) -> &'a str {
    let mut elements = node.children().filter(Node::is_element);
    let Some(first) = elements.next() else { return "" };
    let last = elements.next_back().unwrap_or(first);
    source.get(first.range().start..last.range().end).unwrap_or("")
}

/// Something that holds text of its own, to be lifted out.
struct Lift {
    /// What is taken away: the frame with all that it holds.
    away: Range<usize>,
    /// Where the paragraph ends that it was set in, if it was set in one.
    after: Option<usize>,
    /// What it held.
    content: String,
}

/// Lifts out what `boxes` finds, to stand after the paragraph it was set
/// in. Again and again, since what is lifted out may hold frames of its own.
fn lifted(source: &str, boxes: &dyn Fn(&str, &Document) -> Vec<Lift>) -> Option<String> {
    let mut text: Option<String> = None;
    for _ in 0..DEEPEST {
        let now = text.as_deref().unwrap_or(source);
        let document = parse(now)?;
        let found = boxes(now, &document);
        if found.is_empty() {
            break;
        }
        let mut changes = Vec::new();
        for lift in found {
            match lift.after {
                Some(after) => {
                    changes.push(Change { at: lift.away, with: String::new() });
                    changes.push(Change { at: after..after, with: lift.content });
                }
                // Set in no paragraph: what it held stands where it stood.
                None => changes.push(Change { at: lift.away, with: lift.content }),
            }
        }
        text = Some(changed(now, changes)?);
    }
    text
}

// =========================================================================
// OpenDocument
// =========================================================================

pub(super) const TEXT: &str = "opendocument:xmlns:text:";
const DRAW: &str = "opendocument:xmlns:drawing:";
const STYLE: &str = "opendocument:xmlns:style:";
const OFFICE: &str = "opendocument:xmlns:office:";

/// A style of paragraphs: what it is made of, and how deep in the outline
/// its paragraphs are, where it says so.
#[derive(Default)]
struct Styled {
    parent: Option<String>,
    /// Said, and nothing: not in the outline, whatever the parent says.
    outline: Option<Option<u8>>,
}

fn odt_styles(parts: &[&str]) -> HashMap<String, Styled> {
    let mut out = HashMap::new();
    for source in parts {
        let Some(document) = parse(source) else { continue };
        for node in document.descendants().filter(|n| is(n, STYLE, "style")) {
            if attribute(&node, "family") != Some("paragraph") {
                continue;
            }
            let Some(name) = attribute(&node, "name") else { continue };
            out.insert(
                name.to_owned(),
                Styled {
                    parent: attribute(&node, "parent-style-name").map(str::to_owned),
                    outline: attribute(&node, "default-outline-level")
                        .map(|level| level.trim().parse::<u8>().ok().filter(|l| (1..=10).contains(l))),
                },
            );
        }
    }
    out
}

/// Whether a style is one of what is said of figures and tables, and how
/// deep in the outline its paragraphs are.
fn odt_style(styles: &HashMap<String, Styled>, name: &str) -> (bool, Option<u8>) {
    let mut caption = false;
    let mut outline: Option<Option<u8>> = None;
    let mut at = Some(name);
    for _ in 0..24 {
        let Some(name) = at else { break };
        if name == "Caption" {
            caption = true;
        }
        let Some(style) = styles.get(name) else { break };
        if outline.is_none() {
            outline = style.outline;
        }
        at = style.parent.as_deref();
    }
    (caption, outline.flatten())
}

fn odt_boxes(source: &str, document: &Document) -> Vec<Lift> {
    let mut out = Vec::new();
    for node in document.descendants().filter(|n| is(n, DRAW, "text-box")) {
        if node.ancestors().skip(1).any(|a| is(&a, DRAW, "text-box")) {
            continue;
        }
        let Some(frame) = node.parent().filter(|p| is(p, DRAW, "frame")) else { continue };
        let within = frame.ancestors().skip(1).find(|a| is(a, TEXT, "p") || is(a, TEXT, "h"));
        out.push(Lift {
            away: frame.range(),
            after: within.map(|paragraph| paragraph.range().end),
            content: held(source, &node).to_owned(),
        });
    }
    out
}

/// The text of an ODT as Pandoc is to read it. Nothing, where that is the
/// text as it is.
fn odt_text(content: &str, styles: Option<&str>) -> Option<String> {
    let lifted = lifted(content, &odt_boxes);
    let now = lifted.as_deref().unwrap_or(content);

    let mut parts = vec![now];
    parts.extend(styles);
    let styles = odt_styles(&parts);
    let document = parse(now)?;
    let mut changes = Vec::new();
    for node in document.descendants().filter(|n| is(n, TEXT, "p")) {
        if node.ancestors().any(|a| is(&a, TEXT, "tracked-changes")) {
            continue;
        }
        let Some(style) = attribute(&node, "style-name") else { continue };
        let (caption, outline) = odt_style(&styles, style);
        let Some((begun, ended)) = opening(now, &node) else { continue };
        if caption {
            if !ended {
                changes.push(Change { at: begun..begun, with: MARK.to_owned() });
            }
        } else if let Some(level) = outline
            && node.parent().is_some_and(|p| is(&p, OFFICE, "text") || is(&p, TEXT, "section"))
        {
            // A heading that was written as a paragraph.
            let name = called(now, &node);
            let before = name.rsplit_once(':').map(|(before, _)| format!("{before}:")).unwrap_or_default();
            let from = node.range().start + 1;
            changes.push(Change {
                at: from..from + name.len(),
                with: format!("{before}h {before}outline-level=\"{level}\""),
            });
            if !ended {
                let closing = format!("</{name}");
                let tail = now.get(..node.range().end)?;
                let at = tail.rfind(&closing)?;
                changes.push(Change { at: at..at + closing.len(), with: format!("</{before}h") });
            }
        }
    }
    if changes.is_empty() {
        return lifted;
    }
    changed(now, changes)
}

// =========================================================================
// Word
// =========================================================================

pub(super) const WORD: &str = "wordprocessingml";
const COMPATIBLE: &str = "markup-compatibility";

/// The styles of a DOCX that are of what is said of figures and tables, by
/// what the paragraphs call them by. Word calls the style `caption`
/// whatever the language; LibreOffice has styles of its own made of it.
fn docx_captions(styles: &str) -> HashSet<String> {
    let mut parents: HashMap<String, Option<String>> = HashMap::new();
    let mut out: HashSet<String> = HashSet::new();
    let Some(document) = parse(styles) else { return out };
    for node in document.descendants().filter(|n| is(n, WORD, "style")) {
        let Some(id) = attribute(&node, "styleId") else { continue };
        let of = |name: &str| {
            node.children().find(|c| is(c, WORD, name)).and_then(|c| attribute(&c, "val")).map(str::to_owned)
        };
        let name = of("name").unwrap_or_default();
        if name.eq_ignore_ascii_case("caption") || id.eq_ignore_ascii_case("caption") {
            out.insert(id.to_owned());
        }
        parents.insert(id.to_owned(), of("basedOn"));
    }
    for id in parents.keys() {
        let mut at = Some(id.as_str());
        for _ in 0..24 {
            let Some(name) = at else { break };
            if out.contains(name) {
                out.insert(id.clone());
                break;
            }
            at = parents.get(name).and_then(|p| p.as_deref());
        }
    }
    out
}

fn docx_boxes(source: &str, document: &Document) -> Vec<Lift> {
    // What carries the boxes, with what they hold: as Word has it now, and
    // as it writes it besides for programs that do not know that.
    let mut carriers: Vec<(Node, String, String)> = Vec::new();
    for node in document.descendants().filter(|n| is(n, WORD, "txbxContent")) {
        if node.ancestors().skip(1).any(|a| is(&a, WORD, "txbxContent")) {
            continue;
        }
        let carrier = node
            .ancestors()
            .filter(|a| is(a, COMPATIBLE, "AlternateContent"))
            .last()
            .or_else(|| {
                node.ancestors().find(|a| is(a, WORD, "pict") || is(a, WORD, "drawing") || is(a, WORD, "object"))
            })
            .unwrap_or(node);
        let besides = node.ancestors().take_while(|a| *a != carrier).any(|a| is(&a, COMPATIBLE, "Fallback"));
        let content = held(source, &node);
        match carriers.iter_mut().find(|(c, _, _)| *c == carrier) {
            Some((_, now, fallback)) => (if besides { fallback } else { now }).push_str(content),
            None if besides => carriers.push((carrier, String::new(), content.to_owned())),
            None => carriers.push((carrier, content.to_owned(), String::new())),
        }
    }
    carriers
        .into_iter()
        .map(|(carrier, now, fallback)| Lift {
            away: carrier.range(),
            after: carrier.ancestors().skip(1).find(|a| is(a, WORD, "p")).map(|paragraph| paragraph.range().end),
            content: if now.is_empty() { fallback } else { now },
        })
        .collect()
}

/// The text of a DOCX as Pandoc is to read it. Nothing, where that is the
/// text as it is.
fn docx_text(written: &str, styles: Option<&str>) -> Option<String> {
    let lifted = lifted(written, &docx_boxes);
    let now = lifted.as_deref().unwrap_or(written);

    let captions = styles.map(docx_captions).unwrap_or_default();
    if captions.is_empty() {
        return lifted;
    }
    let document = parse(now)?;
    let mut changes = Vec::new();
    for node in document.descendants().filter(|n| is(n, WORD, "p")) {
        let properties = node.children().find(|c| is(c, WORD, "pPr"));
        let style =
            properties.and_then(|p| p.children().find(|c| is(c, WORD, "pStyle"))).and_then(|s| attribute(&s, "val"));
        if !style.is_some_and(|s| captions.contains(s)) {
            continue;
        }
        let Some((begun, ended)) = opening(now, &node) else { continue };
        if ended {
            continue;
        }
        let at = properties.map_or(begun, |p| p.range().end);
        let name = called(now, &node);
        let before = name.rsplit_once(':').map(|(before, _)| format!("{before}:")).unwrap_or_default();
        changes.push(Change { at: at..at, with: format!("<{before}r><{before}t>{MARK}</{before}t></{before}r>") });
    }
    if changes.is_empty() {
        return lifted;
    }
    changed(now, changes)
}

#[cfg(test)]
mod tests {
    use super::*;

    const ODT: &str = r#"<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:xlink="http://www.w3.org/1999/xlink">"#;

    fn odt(styles: &str, body: &str) -> String {
        format!(
            "{ODT}<office:automatic-styles>{styles}</office:automatic-styles><office:body><office:text>{body}</office:text></office:body></office:document-content>"
        )
    }

    fn body(text: &str) -> &str {
        let from = text.find("<office:text>").unwrap() + "<office:text>".len();
        &text[from..text.find("</office:text>").unwrap()]
    }

    const STYLES: &str = r#"<office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"><office:styles><style:style style:name="Heading_20_2" style:family="paragraph" style:default-outline-level="2"/><style:style style:name="Caption" style:family="paragraph"/><style:style style:name="Illustration" style:family="paragraph" style:parent-style-name="Caption"/><style:style style:name="Quiet" style:family="paragraph" style:parent-style-name="Heading_20_2" style:default-outline-level=""/></office:styles></office:document-styles>"#;

    #[test]
    fn what_stands_in_a_frame_is_lifted_out() {
        let text = odt(
            "",
            r#"<text:p>Before. <draw:frame draw:name="F1"><draw:text-box><text:p text:style-name="Illustration"><draw:frame draw:name="I1"><draw:image xlink:href="Pictures/1.png"/></draw:frame>Figure 1: The "shield" &gt; all</text:p><text:p>More in the frame.</text:p></draw:text-box></draw:frame>After.</text:p><text:p>The next.</text:p>"#,
        );
        let read = odt_text(&text, Some(STYLES)).unwrap();
        assert_eq!(
            body(&read),
            format!(
                r#"<text:p>Before. After.</text:p><text:p text:style-name="Illustration">{MARK}<draw:frame draw:name="I1"><draw:image xlink:href="Pictures/1.png"/></draw:frame>Figure 1: The "shield" &gt; all</text:p><text:p>More in the frame.</text:p><text:p>The next.</text:p>"#
            )
        );
        assert!(parse(&read).is_some());
    }

    #[test]
    fn frames_within_frames_and_frames_set_in_no_paragraph() {
        let text = odt(
            "",
            r#"<draw:frame><draw:text-box><text:p>Outer. <draw:frame><draw:text-box><text:p>Inner.</text:p></draw:text-box></draw:frame></text:p></draw:text-box></draw:frame><text:p>One <draw:frame><draw:text-box><text:p>A.</text:p></draw:text-box></draw:frame>and <draw:frame><draw:text-box><text:p>B.</text:p></draw:text-box></draw:frame>two.</text:p><text:p><draw:frame><draw:text-box/></draw:frame>Empty.</text:p>"#,
        );
        let read = odt_text(&text, None).unwrap();
        assert_eq!(
            body(&read),
            "<text:p>Outer. </text:p><text:p>Inner.</text:p><text:p>One and two.</text:p><text:p>A.</text:p><text:p>B.</text:p><text:p>Empty.</text:p>"
        );
    }

    #[test]
    fn headings_written_as_paragraphs_are_headings() {
        let text = odt(
            r#"<style:style style:name="P1" style:family="paragraph" style:parent-style-name="Heading_20_2"/><style:style style:name="P2" style:family="paragraph" style:parent-style-name="Quiet"/>"#,
            r#"<text:p text:style-name="P1">A <text:span>heading</text:span></text:p><text:p text:style-name="P1"/><text:p text:style-name="P2">Not in the outline.</text:p><text:list><text:list-item><text:p text:style-name="P1">In a list.</text:p></text:list-item></text:list><text:p text:style-name="Unknown">Text.</text:p>"#,
        );
        let read = odt_text(&text, Some(STYLES)).unwrap();
        assert_eq!(
            body(&read),
            r#"<text:h text:outline-level="2" text:style-name="P1">A <text:span>heading</text:span></text:h><text:h text:outline-level="2" text:style-name="P1"/><text:p text:style-name="P2">Not in the outline.</text:p><text:list><text:list-item><text:p text:style-name="P1">In a list.</text:p></text:list-item></text:list><text:p text:style-name="Unknown">Text.</text:p>"#
        );
        assert!(parse(&read).is_some());
        // Where there is nothing to do, nothing is done.
        assert!(odt_text(&odt("", "<text:p>Text.</text:p><text:h>A heading</text:h>"), Some(STYLES)).is_none());
    }

    const DOCX: &str = r#"<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" xmlns:v="urn:schemas-microsoft-com:vml"><w:body>"#;

    fn docx(body: &str) -> String {
        format!("{DOCX}{body}</w:body></w:document>")
    }

    fn within(text: &str) -> &str {
        let from = text.find("<w:body>").unwrap() + "<w:body>".len();
        &text[from..text.find("</w:body>").unwrap()]
    }

    const WORD_STYLES: &str = r#"<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Bildetekst"><w:name w:val="caption"/><w:basedOn w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Illustration"><w:name w:val="Illustration"/><w:basedOn w:val="Bildetekst"/></w:style></w:styles>"#;

    #[test]
    fn the_boxes_of_word_are_lifted_out_and_what_is_written_besides_is_dropped() {
        let text = docx(
            r#"<w:p><w:r><w:t>Before.</w:t></w:r><w:r><mc:AlternateContent><mc:Choice Requires="wps"><w:drawing><wps:txbx><w:txbxContent><w:p><w:pPr><w:pStyle w:val="Illustration"/></w:pPr><w:r><w:t>Figure 1: The shield</w:t></w:r></w:p></w:txbxContent></wps:txbx></w:drawing></mc:Choice><mc:Fallback><w:pict><v:textbox><w:txbxContent><w:p><w:r><w:t>Besides.</w:t></w:r></w:p></w:txbxContent></v:textbox></w:pict></mc:Fallback></mc:AlternateContent></w:r></w:p><w:p><w:r><w:pict><v:textbox><w:txbxContent><w:p><w:r><w:t>As Word once wrote them.</w:t></w:r></w:p></w:txbxContent></v:textbox></w:pict></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Bildetekst"/></w:pPr><w:r><w:t>Tabell 1: Former</w:t></w:r></w:p>"#,
        );
        let read = docx_text(&text, Some(WORD_STYLES)).unwrap();
        assert_eq!(
            within(&read),
            format!(
                r#"<w:p><w:r><w:t>Before.</w:t></w:r><w:r></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Illustration"/></w:pPr><w:r><w:t>{MARK}</w:t></w:r><w:r><w:t>Figure 1: The shield</w:t></w:r></w:p><w:p><w:r></w:r></w:p><w:p><w:r><w:t>As Word once wrote them.</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Bildetekst"/></w:pPr><w:r><w:t>{MARK}</w:t></w:r><w:r><w:t>Tabell 1: Former</w:t></w:r></w:p>"#
            )
        );
        assert!(parse(&read).is_some());
        assert!(docx_text(&docx("<w:p><w:r><w:t>Text.</w:t></w:r></w:p>"), Some(WORD_STYLES)).is_none());
    }

    #[test]
    fn what_a_file_says_of_itself() {
        let read = docx_properties(
            r#"<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:creator>A. Scholar; B. Other</dc:creator><cp:keywords>Homer, the shield;  wrath</cp:keywords><dc:language>nb-NO</dc:language><dc:title>The shield</dc:title><dc:subject></dc:subject></cp:coreProperties>"#,
        );
        assert_eq!(read.title.as_deref(), Some("The shield"));
        assert_eq!(read.authors, vec!["A. Scholar", "B. Other"]);
        assert_eq!(read.keywords, vec!["Homer", "the shield", "wrath"]);
        assert_eq!(keywords("Homer wrath  Homer"), vec!["Homer", "wrath"]);

        let read = odt_properties(
            r#"<office:document-meta xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0" xmlns:dc="http://purl.org/dc/elements/1.1/"><office:meta><dc:title>The shield</dc:title><meta:initial-creator>A. Scholar</meta:initial-creator><dc:creator>The one who wrote last</dc:creator><dc:language>nb-NO</dc:language><meta:keyword>Homer</meta:keyword><meta:keyword>the shield</meta:keyword></office:meta></office:document-meta>"#,
        );
        assert_eq!(read.title.as_deref(), Some("The shield"));
        assert_eq!(read.authors, vec!["A. Scholar"]);
        assert_eq!(read.keywords, vec!["Homer", "the shield"]);
    }

    #[test]
    fn changes_that_reach_into_each_other_are_not_made() {
        let change = |at: Range<usize>, with: &str| Change { at, with: with.to_owned() };
        let made =
            changed("0123456789", vec![change(7..9, "b"), change(2..2, "a"), change(2..4, ""), change(9..9, "c")]);
        assert_eq!(made.as_deref(), Some("01a456bc9"));
        assert!(changed("0123456789", vec![change(2..6, ""), change(4..8, "")]).is_none());
        assert!(changed("0123", vec![change(2..9, "")]).is_none());
    }
}
