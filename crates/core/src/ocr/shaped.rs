//! The pieces of a shaped page made into text (ADR 0045): paragraphs joined
//! from their lines with their marks, headings, lines kept with the numbers
//! given beside them; and the document's sections made of them.

use std::collections::BTreeMap;

use crate::document::{Block, Inline, Numbering, Side};
use crate::import::document::{Section, StyleFoundView};

use super::rules;
use super::schemes;
use super::shape::{Piece, StyleFound};
use super::text::{self, IsWord, Line};

/// A piece of a page as text.
#[derive(Debug, Clone, PartialEq)]
pub enum Shaped {
    Heading { level: u8, content: Vec<Inline> },
    Paragraph { content: Vec<Inline>, indent: bool, style: usize },
    Kept { lines: Vec<(Vec<Inline>, Option<String>)>, side: Option<Side>, style: usize },
}

impl Shaped {
    /// What it says, without its marks: for counting and for the plain paragraphs of a page.
    pub fn plain(&self) -> String {
        match self {
            Shaped::Heading { content, .. } | Shaped::Paragraph { content, .. } => plain_of(content),
            Shaped::Kept { lines, .. } => lines.iter().map(|(l, _)| plain_of(l)).collect::<Vec<_>>().join("\n"),
        }
    }

    /// The line that stands in the place of a page that could not be read.
    pub fn failure(line: String) -> Shaped {
        Shaped::Paragraph { content: vec![text_inline(line, Marks::default())], indent: false, style: 0 }
    }
}

/// The marks of a run of text.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
struct Marks {
    italic: bool,
    bold: bool,
    smallcaps: bool,
}

fn text_inline(text: String, marks: Marks) -> Inline {
    let mut map = BTreeMap::new();
    for (on, name) in [(marks.italic, "em"), (marks.bold, "strong"), (marks.smallcaps, "smallcaps")] {
        if on {
            map.insert(name.to_owned(), serde_json::Value::Bool(true));
        }
    }
    Inline::Text { text, marks: map }
}

fn plain_of(content: &[Inline]) -> String {
    content
        .iter()
        .map(|i| match i {
            Inline::Text { text, .. } => text.as_str(),
            Inline::Break => "\n",
            _ => "",
        })
        .collect()
}

/// A line's text in runs of one look, each composed, the sigmas mended
/// where Greek was read.
fn segments(line: &Line, greek: bool) -> Vec<(String, Marks)> {
    let finish = |s: &str| {
        let s = text::composed(s);
        if greek { schemes::mend_sigmas(&s) } else { s }
    };
    if line.runs.is_empty() {
        return vec![(finish(&line.text), Marks::default())];
    }
    let mut out = Vec::new();
    for (i, run) in line.runs.iter().enumerate() {
        let end = line.runs.get(i + 1).map_or(line.text.len(), |next| next.from);
        let (from, end) = (run.from.min(line.text.len()), end.min(line.text.len()));
        if from >= end || !line.text.is_char_boundary(from) || !line.text.is_char_boundary(end) {
            continue;
        }
        out.push((
            finish(&line.text[from..end]),
            Marks { italic: run.italic, bold: run.bold, smallcaps: run.smallcaps },
        ));
    }
    if line.runs.first().is_some_and(|r| r.from > 0) && line.text.is_char_boundary(line.runs[0].from) {
        out.insert(0, (finish(&line.text[..line.runs[0].from]), Marks::default()));
    }
    out
}

/// The text of segments as inlines, runs of one look merged.
fn inlines(segments: Vec<(String, Marks)>) -> Vec<Inline> {
    let mut merged: Vec<(String, Marks)> = Vec::new();
    for (text, marks) in segments {
        if text.is_empty() {
            continue;
        }
        match merged.last_mut() {
            Some((before, m)) if *m == marks => before.push_str(&text),
            _ => merged.push((text, marks)),
        }
    }
    merged.into_iter().map(|(text, marks)| text_inline(text, marks)).collect()
}

/// The longest common beginning of two texts, at a boundary of characters.
fn common(a: &str, b: &str) -> usize {
    let mut at = 0;
    for ((i, x), y) in a.char_indices().zip(b.chars()) {
        if x != y {
            return i;
        }
        at = i + x.len_utf8();
    }
    at
}

/// Cuts segments to the first `keep` bytes of their text together.
fn truncate(segments: &mut Vec<(String, Marks)>, keep: usize) {
    let mut seen = 0;
    let mut i = 0;
    while i < segments.len() {
        let len = segments[i].0.len();
        if seen + len <= keep {
            seen += len;
            i += 1;
            continue;
        }
        let cut = keep - seen;
        segments[i].0.truncate(cut);
        segments.truncate(i + 1);
        return;
    }
}

/// Lines joined into a paragraph as `text::join_lines` joins them, a word
/// broken at the end of a line made whole, with their marks kept.
fn joined(lines: &[Line], is_word: Option<&IsWord>, greek: bool) -> Vec<Inline> {
    let mut out: Vec<(String, Marks)> = Vec::new();
    let mut plain = String::new();
    for line in lines {
        let next = segments(line, greek);
        let next_plain: String = next.iter().map(|(t, _)| t.as_str()).collect();
        if next_plain.trim().is_empty() {
            continue;
        }
        if plain.is_empty() {
            plain = next_plain;
            out.extend(next);
            continue;
        }
        let before = plain.clone();
        text::join_to(&mut plain, &next_plain, is_word);
        let keep = common(&before, &plain).min(before.len());
        truncate(&mut out, keep);
        let added = plain[keep..].to_owned();
        match added.strip_suffix(next_plain.as_str()) {
            Some(between) => {
                if let Some((last, _)) = out.last_mut() {
                    last.push_str(between);
                } else {
                    out.push((between.to_owned(), Marks::default()));
                }
                out.extend(next);
            }
            // Joined otherwise than by putting something between: what was added, unmarked.
            None => out.push((added, Marks::default())),
        }
    }
    inlines(out)
}

/// The pieces of a page made into text.
pub fn of(pieces: Vec<Piece>, is_word: Option<&IsWord>, greek: bool) -> Vec<Shaped> {
    pieces
        .into_iter()
        .filter_map(|piece| {
            let shaped = match piece {
                Piece::Heading { level, lines } => {
                    let mut content = Vec::new();
                    for (i, line) in lines.iter().enumerate() {
                        if i > 0 {
                            content.push(text_inline(" ".into(), Marks::default()));
                        }
                        content.extend(inlines(segments(line, greek)));
                    }
                    Shaped::Heading { level, content: inlines_merged(content) }
                }
                Piece::Paragraph { lines, indent, style } => {
                    Shaped::Paragraph { content: joined(&lines, is_word, greek), indent, style }
                }
                Piece::KeptLines { lines, side, style } => Shaped::Kept {
                    lines: lines.into_iter().map(|(line, number)| (inlines(segments(&line, greek)), number)).collect(),
                    side,
                    style,
                },
            };
            (!shaped.plain().trim().is_empty()).then_some(shaped)
        })
        .collect()
}

/// Inlines of text with the same marks side by side made one.
fn inlines_merged(content: Vec<Inline>) -> Vec<Inline> {
    let mut out: Vec<Inline> = Vec::new();
    for inline in content {
        if let (Some(Inline::Text { text: before, marks: m1 }), Inline::Text { text, marks: m2 }) =
            (out.last_mut(), &inline)
            && m1 == m2
        {
            before.push_str(text);
            continue;
        }
        out.push(inline);
    }
    out
}

/// A word broken at the foot of one page is joined again with its end at
/// the head of the next, on the page where it begins: between the last
/// paragraph of the body on a page and the first on the next.
pub fn mend_across(pages: &mut [Vec<Shaped>], is_word: Option<&IsWord>) {
    for i in 1..pages.len() {
        let (before, after) = pages.split_at_mut(i);
        let (
            Some(Shaped::Paragraph { content: last, style: 0, .. }),
            Some(Shaped::Paragraph { content: first, style: 0, .. }),
        ) = (before[i - 1].last_mut(), after[0].first_mut())
        else {
            continue;
        };
        let (a0, b0) = (plain_of(last), plain_of(first));
        let mut texts = [vec![a0.clone()], vec![b0.clone()]];
        text::mend_across(&mut texts, is_word);
        if texts[0].first() == Some(&a0) {
            continue;
        }
        let b1 = texts[1].first().cloned().unwrap_or_default();
        // The word moved: the end of the last inline grows by it, and the first of the next loses it.
        let moved = b0.len() - b1.len();
        let word = b0[..moved].trim_end().to_owned();
        if let Some(Inline::Text { text, .. }) = last.iter_mut().rev().find(|i| matches!(i, Inline::Text { .. })) {
            let mut grown = text.clone();
            text::join_to(&mut grown, &word, is_word);
            *text = grown;
        }
        let mut left = moved;
        first.retain_mut(|inline| {
            if left == 0 {
                return true;
            }
            if let Inline::Text { text, .. } = inline {
                if text.len() <= left {
                    left -= text.len();
                    return false;
                }
                *text = text[left..].to_owned();
                left = 0;
            }
            true
        });
        if first.is_empty() {
            after[0].remove(0);
        }
    }
}

/// A page's pieces as the blocks of its section, and sections of its
/// headings: what stands before the first heading is the page's own; each
/// heading opens a section under the page, one level deeper for each level.
/// The title is a heading here as the others are.
pub fn sections(label: String, pieces: Vec<Shaped>) -> Vec<Section> {
    let mut out = vec![Section { level: 1, heading: vec![text_inline(label, Marks::default())], blocks: Vec::new() }];
    for piece in pieces {
        match piece {
            Shaped::Heading { level, content } => {
                out.push(Section { level: 1 + level.clamp(1, 3), heading: content, blocks: Vec::new() })
            }
            other => out.last_mut().expect("the page's section").blocks.push(block_of(other)),
        }
    }
    out
}

/// A paragraph or lines kept as a block of the document. A first line set
/// further in is how the layout begins a paragraph, not an indent of the
/// paragraph, which in an element moves every line of it: it is left to the
/// layout. A paragraph standing in as a whole is a style found.
fn block_of(piece: Shaped) -> Block {
    match piece {
        Shaped::Heading { content, .. } => Block::paragraph(content),
        Shaped::Paragraph { content, indent: _, style } => {
            let mut block = Block::paragraph(content);
            if let Block::Paragraph { name, .. } = &mut block {
                *name = kind_name(style);
            }
            block
        }
        Shaped::Kept { lines, side, style } => {
            let numbered = lines.iter().any(|(_, n)| n.is_some());
            let mut content = Vec::new();
            for (i, (line, number)) in lines.into_iter().enumerate() {
                if i > 0 {
                    content.push(Inline::Break);
                }
                if let Some(number) = number {
                    content.push(Inline::LineMark {
                        number: Some(number),
                        counted: true,
                        hidden: false,
                        shown: false,
                        margin: None,
                        indent: 0,
                    });
                }
                content.extend(line);
            }
            let mut block = Block::paragraph(content);
            if let Block::Paragraph { name, numbering, side: on, .. } = &mut block {
                *name = kind_name(style);
                if numbered {
                    *numbering = Numbering::Given;
                    *on = side;
                }
            }
            block
        }
    }
}

// ---------------------------------------------------------------------------
// The structure of the document (ADR 0047)
// ---------------------------------------------------------------------------

/// What stands in the row of the document's pieces: a piece, or where a page begins.
enum Item {
    Piece(Shaped),
    Page(String),
}

/// Whether a piece is of the body's text: a paragraph of the body.
fn of_body(item: &Item) -> bool {
    matches!(item, Item::Piece(Shaped::Paragraph { style: 0, .. }))
}

/// Whether a piece stands between the halves of a paragraph that goes on
/// over a page's edge: what is not the body and no heading, such as the
/// smaller text at the foot of the page.
fn aside(item: &Item) -> bool {
    match item {
        Item::Page(_) => true,
        Item::Piece(Shaped::Heading { .. }) => false,
        Item::Piece(p) => !of_body(&Item::Piece(p.clone())),
    }
}

/// Whether a paragraph goes on in the next: where the next begins with a
/// small letter, or the one before ends without the end of a sentence and
/// the next is not set further in. Where a sentence ends is as the reading
/// of a page by its lines has it (`rules::ends_sentence`).
fn goes_on(before: &[Inline], after: &[Inline], after_indent: bool) -> bool {
    if rules::begins_small(&plain_of(after)) {
        return true;
    }
    !rules::ends_sentence(&plain_of(before)) && !after_indent
}

/// The document's pieces, page after page, as its structure: what stands
/// before the first heading (a section of level 0), and a section for each
/// heading at its level, the least of them made 1. Where `marks`, a
/// reference mark with the page's label stands where each page begins. A
/// paragraph of the body that goes on over a page's edge is one paragraph,
/// what stood between its halves after it; lines kept of one style on both
/// sides of an edge are one block. The title is left out: it names the
/// document.
pub fn structure(pages: Vec<(String, Vec<Shaped>)>, marks: bool) -> Vec<Section> {
    let mut row: Vec<Item> = Vec::new();
    for (k, (label, pieces)) in pages.into_iter().enumerate() {
        let mut pieces: Vec<Shaped> =
            pieces.into_iter().filter(|p| !matches!(p, Shaped::Heading { level: 0, .. })).collect();
        let mark = marks.then(|| Inline::RefMark { label: label.clone() });
        if k > 0 {
            join_across(&mut row, &mut pieces, mark.as_ref());
        }
        // Where the page's first piece went into one before, the mark went with it.
        if marks && !row_holds_mark(&row, &label) {
            row.push(Item::Page(label));
        }
        row.extend(pieces.into_iter().map(Item::Piece));
    }
    cut(row)
}

/// Whether the row's last piece holds the mark of this page within it.
fn row_holds_mark(row: &[Item], label: &str) -> bool {
    let has = |content: &[Inline]| content.iter().any(|i| matches!(i, Inline::RefMark { label: l } if l == label));
    row.iter().rev().take(8).any(|item| match item {
        Item::Piece(Shaped::Paragraph { content, .. }) => has(content),
        Item::Piece(Shaped::Kept { lines, .. }) => lines.iter().any(|(l, _)| has(l)),
        _ => false,
    })
}

/// At a page's edge: the paragraph that goes on over it, or the lines kept
/// that go on, made one with their halves on the new page.
fn join_across(row: &mut Vec<Item>, pieces: &mut Vec<Shaped>, mark: Option<&Inline>) {
    // Lines kept: the last piece before the edge and the first after it, of one style and side.
    if let (Some(Item::Piece(Shaped::Kept { lines, side, style })), Some(Shaped::Kept { side: s2, style: t2, .. })) =
        (row.last_mut(), pieces.first())
        && side == s2
        && style == t2
    {
        let Shaped::Kept { lines: more, .. } = pieces.remove(0) else { unreachable!() };
        for (i, (mut line, number)) in more.into_iter().enumerate() {
            if i == 0
                && let Some(mark) = mark
            {
                line.insert(0, mark.clone());
            }
            lines.push((line, number));
        }
        return;
    }
    // A paragraph of the body: the last before the edge, with nothing of the body or a heading after it.
    let Some(last) = row.iter().rposition(of_body) else { return };
    if !row[last + 1..].iter().all(aside) {
        return;
    }
    let Some(first) = pieces.iter().position(|p| matches!(p, Shaped::Paragraph { style: 0, .. })) else { return };
    if !pieces[..first].iter().all(|p| !matches!(p, Shaped::Heading { .. })) {
        return;
    }
    let (Item::Piece(Shaped::Paragraph { content: before, .. }), Shaped::Paragraph { content: after, indent, .. }) =
        (&row[last], &pieces[first])
    else {
        return;
    };
    if !goes_on(before, after, *indent) {
        return;
    }
    // What stood between the halves goes after the paragraph made one.
    let mut between: Vec<Item> = row.drain(last + 1..).filter(|i| !matches!(i, Item::Page(_))).collect();
    between.extend(pieces.drain(..first).map(Item::Piece));
    let Shaped::Paragraph { content: after, .. } = pieces.remove(0) else { unreachable!() };
    if let Item::Piece(Shaped::Paragraph { content, .. }) = &mut row[last] {
        content.push(text_inline(" ".into(), Marks::default()));
        if let Some(mark) = mark {
            content.push(mark.clone());
        }
        content.extend(after);
        *content = inlines_merged(std::mem::take(content));
    }
    row.extend(between);
}

/// The row cut into sections by its headings, the marks of the pages put
/// first in the block that follows them, or last in the last block where
/// none follows.
fn cut(row: Vec<Item>) -> Vec<Section> {
    let least = row
        .iter()
        .filter_map(|i| match i {
            Item::Piece(Shaped::Heading { level, .. }) if *level > 0 => Some(*level),
            _ => None,
        })
        .min()
        .unwrap_or(1);
    let mut out = vec![Section { level: 0, heading: Vec::new(), blocks: Vec::new() }];
    let mut waiting: Vec<Inline> = Vec::new();
    for item in row {
        match item {
            Item::Page(label) => waiting.push(Inline::RefMark { label }),
            Item::Piece(Shaped::Heading { level, content }) => {
                out.push(Section { level: level + 1 - least, heading: content, blocks: Vec::new() })
            }
            Item::Piece(piece) => {
                let mut block = block_of(piece);
                if !waiting.is_empty()
                    && let Block::Paragraph { content, .. } = &mut block
                {
                    let mut first: Vec<Inline> = std::mem::take(&mut waiting);
                    first.append(content);
                    *content = first;
                }
                out.last_mut().expect("a section").blocks.push(block);
            }
        }
    }
    // Marks at the very end go last in the last block there is.
    if !waiting.is_empty()
        && let Some(Block::Paragraph { content, .. }) = out.iter_mut().rev().find_map(|s| s.blocks.last_mut())
    {
        content.append(&mut waiting);
    }
    if out[0].blocks.is_empty() {
        out.remove(0);
    }
    out
}

/// The name of the kind of a style's paragraphs until the writer names it: the body's is text.
fn kind_name(style: usize) -> String {
    if style == 0 { "text".to_owned() } else { format!("style:{style}") }
}

/// The styles found beside the body, as the one who brings the document in is shown them.
pub fn views(styles: &[StyleFound]) -> Vec<StyleFoundView> {
    let body = styles.first().map(|s| s.style.size).filter(|s| *s > 0.0).unwrap_or(1.0);
    styles
        .iter()
        .enumerate()
        .skip(1)
        .map(|(id, s)| StyleFoundView {
            id,
            family: s.style.family.clone(),
            italic: s.style.italic,
            bold: s.style.bold,
            size: ((s.style.size / body) * 100.0).round() / 100.0,
            indent: s.indent,
            kept: s.kept,
            sample: s.sample.clone(),
            count: s.count,
            pages: s.pages,
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ocr::text::{Run, Style};

    fn line(text: &str) -> Line {
        Line {
            text: text.into(),
            left: 0.0,
            right: 300.0,
            top: 0.0,
            bottom: 10.0,
            style: Style::default(),
            runs: vec![],
            gaps: None,
        }
    }

    fn words(text: &str) -> Vec<Inline> {
        vec![text_inline(text.into(), Marks::default())]
    }
    fn para(text: &str, style: usize, indent: bool) -> Shaped {
        Shaped::Paragraph { content: words(text), indent, style }
    }
    fn heading(text: &str, level: u8) -> Shaped {
        Shaped::Heading { level, content: words(text) }
    }
    #[test]
    fn a_paragraph_goes_on_over_the_edge_as_the_lines_have_it() {
        let goes = |before: &str, after: &str, indent: bool| goes_on(&words(before), &words(after), indent);
        // Where a sentence ends is as text.rs has it: a closing mark alone
        // ends none, a semicolon ends one only as the Greek question mark.
        assert!(goes("he spoke of the \"word\"", "Then", false));
        assert!(goes("his art was old;", "Then", false));
        assert!(!goes("τί ἔφη;", "Ἀλλὰ", false));
        assert!(!goes("ἔφη·", "Ἀλλὰ", false));
        assert!(!goes("he spoke.»", "Then", false));
        assert!(!goes("his art was", "Then", true), "set in, it begins anew");
        // A small letter begins the paragraph's going on, after a quotation
        // mark too; a number before it is a section that begins.
        assert!(goes("he spoke.", "«and so", true));
        assert!(!goes("ἔφη.", "3 ὁ δὲ", true));
    }

    fn kept(lines: &[&str]) -> Shaped {
        Shaped::Kept { lines: lines.iter().map(|l| (words(l), None)).collect(), side: None, style: 0 }
    }
    /// A block's text, the marks of the pages as [n].
    fn shown(content: &[Inline]) -> String {
        content
            .iter()
            .map(|i| match i {
                Inline::Text { text, .. } => text.clone(),
                Inline::RefMark { label } => format!("[{label}]"),
                Inline::Break => " / ".into(),
                _ => String::new(),
            })
            .collect()
    }
    fn outline(sections: &[Section]) -> Vec<(u8, String, Vec<String>)> {
        sections
            .iter()
            .map(|s| {
                let blocks = s
                    .blocks
                    .iter()
                    .map(|b| match b {
                        Block::Paragraph { content, .. } => shown(content),
                        _ => String::new(),
                    })
                    .collect();
                (s.level, shown(&s.heading), blocks)
            })
            .collect()
    }

    fn three_pages() -> Vec<(String, Vec<Shaped>)> {
        vec![
            (
                "1".into(),
                vec![
                    heading("A Short Treatise", 0),
                    para("Anna Lind", 0, false),
                    heading("Beginnings", 1),
                    para("It begins here, and it goes on over", 0, false),
                    para("1. A note at the foot.", 1, false),
                ],
            ),
            (
                "2".into(),
                vec![
                    para("the edge of the page.", 0, false),
                    heading("The First Part", 2),
                    para("A part of it ends here.", 0, false),
                    para("Another begins.", 0, true),
                    kept(&["Lines kept,", "one by one,"]),
                ],
            ),
            ("3".into(), vec![kept(&["and on the next page."]), heading("Endings", 1), para("The end.", 0, false)]),
        ]
    }

    #[test]
    fn the_structure_by_the_headings_across_the_pages() {
        let got = outline(&structure(three_pages(), true));
        assert_eq!(
            got,
            vec![
                // Before the first heading, with the mark of the first page; the title names the document.
                (0, String::new(), vec!["[1]Anna Lind".to_owned()]),
                (
                    1,
                    "Beginnings".to_owned(),
                    // The paragraph goes on over the edge, the mark where the page began; the note after it.
                    vec![
                        "It begins here, and it goes on over [2]the edge of the page.".to_owned(),
                        "1. A note at the foot.".to_owned()
                    ]
                ),
                (
                    2,
                    "The First Part".to_owned(),
                    vec![
                        "A part of it ends here.".to_owned(),
                        "Another begins.".to_owned(),
                        "Lines kept, / one by one, / [3]and on the next page.".to_owned(),
                    ]
                ),
                (1, "Endings".to_owned(), vec!["The end.".to_owned()]),
            ]
        );
        // Without marks there are none.
        let plain = outline(&structure(three_pages(), false));
        assert!(plain.iter().flat_map(|s| &s.2).all(|b| !b.contains('[')), "{plain:?}");
        assert_eq!(plain[1].2[0], "It begins here, and it goes on over the edge of the page.");
    }

    #[test]
    fn a_paragraph_that_ends_stays_apart_from_the_next_set_in() {
        let pages = vec![
            ("1".into(), vec![heading("One", 1), para("It ends here.", 0, false)]),
            ("2".into(), vec![para("A new one begins.", 0, true), para("And a third.", 0, false)]),
            ("3".into(), vec![para("Without its end", 0, false)]),
            ("4".into(), vec![para("A capital goes on where nothing ended", 0, false)]),
        ];
        let got = outline(&structure(pages, true));
        assert_eq!(
            got[0].2,
            vec![
                "[1]It ends here.".to_owned(),
                // Set in, a new paragraph; after a sentence's end, too.
                "[2]A new one begins.".to_owned(),
                "And a third.".to_owned(),
                "[3]Without its end [4]A capital goes on where nothing ended".to_owned(),
            ]
        );
    }

    #[test]
    fn the_least_level_is_the_first_under_the_document() {
        let pages = vec![("1".into(), vec![heading("Two", 2), para("x.", 0, false), heading("Three", 3)])];
        let got = outline(&structure(pages, false));
        assert_eq!(got.iter().map(|s| s.0).collect::<Vec<_>>(), [1, 2]);
    }

    #[test]
    fn a_paragraph_keeps_its_marks_and_mends_a_broken_word() {
        let mut first = line("The wrath of Achil-");
        first.runs = vec![Run { from: 0, ..Run::default() }, Run { from: 4, italic: true, ..Run::default() }];
        let knows = |w: &str| w.eq_ignore_ascii_case("achilles");
        let content = joined(&[first, line("les is sung.")], Some(&knows), false);
        assert_eq!(plain_of(&content), "The wrath of Achilles is sung.");
        assert!(
            matches!(&content[1], Inline::Text { text, marks } if text.starts_with("wrath") && marks.contains_key("em"))
        );
    }

    #[test]
    fn kept_lines_with_numbers_become_one_numbered_paragraph() {
        let pieces = vec![
            Shaped::Heading { level: 1, content: vec![text_inline("Act One".into(), Marks::default())] },
            Shaped::Kept {
                lines: vec![
                    (vec![text_inline("first".into(), Marks::default())], None),
                    (vec![text_inline("second".into(), Marks::default())], Some("5".into())),
                ],
                side: Some(Side::Right),
                style: 2,
            },
        ];
        let sections = sections("12".into(), pieces);
        assert_eq!(sections.len(), 2);
        assert_eq!((sections[0].level, sections[1].level), (1, 2));
        let Block::Paragraph { name, numbering, side, content, .. } = &sections[1].blocks[0] else { panic!() };
        assert_eq!((name.as_str(), *numbering, *side), ("style:2", Numbering::Given, Some(Side::Right)));
        assert!(content.iter().any(|i| matches!(i, Inline::Break)));
        assert!(content.iter().any(|i| matches!(i, Inline::LineMark { number: Some(n), .. } if n == "5")));
    }

    #[test]
    fn a_word_broken_across_pages_is_mended() {
        let p = |t: &str| Shaped::Paragraph {
            content: vec![text_inline(t.into(), Marks::default())],
            indent: false,
            style: 0,
        };
        let mut pages = vec![vec![p("the wrath of Achil-")], vec![p("les is sung."), p("Next.")]];
        let knows = |w: &str| w.eq_ignore_ascii_case("achilles");
        mend_across(&mut pages, Some(&knows));
        assert_eq!(pages[0][0].plain(), "the wrath of Achilles");
        assert_eq!(pages[1][0].plain(), "is sung.");
    }
}
