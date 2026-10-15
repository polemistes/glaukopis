//! The pieces of a shaped page made into text (ADR 0045): paragraphs joined
//! from their lines with their marks, headings, lines kept with the numbers
//! given beside them; and the document's sections made of them.

use std::collections::BTreeMap;

use crate::document::{Block, Inline, Numbering, Side};
use crate::import::document::{Section, StyleFoundView};

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
pub fn sections(label: String, pieces: Vec<Shaped>) -> Vec<Section> {
    let mut out = vec![Section { level: 1, heading: vec![text_inline(label, Marks::default())], blocks: Vec::new() }];
    for piece in pieces {
        match piece {
            Shaped::Heading { level, content } => {
                out.push(Section { level: 1 + level.clamp(1, 3), heading: content, blocks: Vec::new() })
            }
            Shaped::Paragraph { content, indent, style } => {
                let mut block = Block::paragraph(content);
                if let Block::Paragraph { name, indent: steps, .. } = &mut block {
                    *name = kind_name(style);
                    *steps = u32::from(indent);
                }
                out.last_mut().expect("the page's section").blocks.push(block);
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
                out.last_mut().expect("the page's section").blocks.push(block);
            }
        }
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
        }
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
