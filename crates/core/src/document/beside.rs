//! Where a citation stands beside punctuation is the style's to say, not
//! the writer's: a style of notes sets its mark after the full stop,
//! `said.¹`, and a style of author and year sets the citation before it,
//! `said (Nagy 1979, 73).` The writer writes the citation where it belongs
//! in the sentence, either way, and the text need not be gone through when
//! the style is changed: this pass moves every citation that touches
//! punctuation to where the style has it, as the document is set.
//!
//! What counts is sentence punctuation (`. , ; : ! ?`) and what closes a
//! quotation or a bracket, with nothing but blanks between it and the
//! citation. A citation with words on both sides stands where it is, and so
//! does one whose author is named in the sentence, which is part of it.
//! Within a note, a citation is set in the line of the note, whatever the
//! style.

use std::collections::BTreeMap;

use super::{Block, CiteMode, Document, Inline};

/// Sentence punctuation: a note's mark stands after it, a citation in the line before it.
const STOPS: &[char] = &['.', ',', ';', ':', '!', '?'];
/// What closes a quotation: a note's mark passes it, a citation in the line stays where it was.
const QUOTES: &[char] = &['”', '’', '"', '\'', '»', '›'];
/// What closes a bracket: nothing passes it.
const BRACKETS: &[char] = &[')', ']'];
/// What opens a quotation or a bracket: no blank stands between it and a citation.
const OPENERS: &[char] = &['“', '‘', '«', '‹', '(', '['];

/// Moves the citations of a document to where the style has them beside
/// punctuation: after it where the style sets citations as notes, before it
/// otherwise.
pub fn place_citations(doc: &mut Document, notes: bool) {
    place_line(&mut doc.title, notes);
    for section in &mut doc.sections {
        if let Some(heading) = &mut section.heading {
            place_line(heading, notes);
        }
        place_blocks(&mut section.blocks, notes);
    }
}

fn place_blocks(list: &mut [Block], notes: bool) {
    for block in list {
        match block {
            Block::Paragraph { content } | Block::Script { content, .. } | Block::Passage { content, .. } => {
                place_line(content, notes)
            }
            Block::Blockquote { content } => place_blocks(content, notes),
            Block::Verse { lines, .. } => {
                for line in lines {
                    place_line(&mut line.content, notes);
                }
            }
            Block::Parallel { left, right } => {
                place_blocks(left, notes);
                place_blocks(right, notes);
            }
            Block::BulletList { items } | Block::OrderedList { items, .. } => {
                for item in items {
                    place_blocks(item, notes);
                }
            }
            Block::Figure { caption, .. } => place_line(caption, notes),
            Block::Equation { .. } => {}
            Block::Table(table) => {
                place_line(&mut table.caption, notes);
                for row in &mut table.rows {
                    for cell in row {
                        place_blocks(&mut cell.content, notes);
                    }
                }
            }
            Block::Row { items } => place_blocks(items, notes),
        }
    }
}

/// Places the citations of one line of text, and of the notes in it.
pub fn place_line(line: &mut Vec<Inline>, notes: bool) {
    for inline in line.iter_mut() {
        if let Inline::Footnote { content, .. } = inline {
            // Within a note, a citation is set in the line of the note.
            place_line(content, false);
        }
    }
    let mut i = 0;
    while i < line.len() {
        if matches!(line[i], Inline::Citation { mode: CiteMode::Normal, .. }) {
            i = place_one(line, i, notes);
        } else {
            i += 1;
        }
    }
}

/// The punctuation at one end of a text beside a citation, and the text
/// without it.
struct Edge {
    /// The signs, blanks left out, in their order.
    signs: String,
    /// The text without the signs and the blanks about them.
    rest: String,
    marks: BTreeMap<String, serde_json::Value>,
}

fn is_stop(c: char) -> bool {
    STOPS.contains(&c)
}

fn is_quote(c: char) -> bool {
    QUOTES.contains(&c)
}

/// The signs at the end of the text before a citation: stops, and what
/// closes a quotation or a bracket.
fn tail(text: &str, marks: &BTreeMap<String, serde_json::Value>) -> Edge {
    let cut = text.trim_end_matches(|c: char| c.is_whitespace() || is_stop(c) || is_quote(c) || BRACKETS.contains(&c));
    let signs: String = text[cut.len()..].chars().filter(|c| !c.is_whitespace()).collect();
    Edge { signs, rest: cut.to_owned(), marks: marks.clone() }
}

/// The signs at the beginning of the text after a citation: stops and
/// closing quotation marks, as far as the first closing bracket, which a
/// citation written within brackets stays within. The blanks after the signs
/// stay with the text, which goes on after the citation.
fn head(text: &str, marks: &BTreeMap<String, serde_json::Value>) -> Edge {
    let mut last_sign = 0;
    for (at, c) in text.char_indices() {
        if is_stop(c) || is_quote(c) {
            last_sign = at + c.len_utf8();
        } else if !c.is_whitespace() {
            break;
        }
    }
    let signs: String = text[..last_sign].chars().filter(|c| !c.is_whitespace()).collect();
    let rest = if last_sign > 0 { text[last_sign..].to_owned() } else { text.to_owned() };
    Edge { signs, rest, marks: marks.clone() }
}

/// Places the citation at `i` beside the punctuation it touches. Returns
/// where to go on from.
fn place_one(line: &mut Vec<Inline>, i: usize, notes: bool) -> usize {
    let before = match i.checked_sub(1).map(|j| &line[j]) {
        Some(Inline::Text { text, marks }) => Some(tail(text, marks)),
        _ => None,
    };
    let after = match line.get(i + 1) {
        Some(Inline::Text { text, marks }) => Some(head(text, marks)),
        _ => None,
    };
    if before.is_none() && after.is_none() {
        return i + 1;
    }
    let citation = line[i].clone();
    let has_before = before.is_some();
    let from = if has_before { i - 1 } else { i };
    let to = if after.is_some() { i + 2 } else { i + 1 };
    let (lead, signs_before, marks_before) =
        before.map_or((String::new(), String::new(), BTreeMap::new()), |e| (e.rest, e.signs, e.marks));
    let (rest_after, signs_after, marks_after) =
        after.map_or((String::new(), String::new(), marks_before.clone()), |e| (e.rest, e.signs, e.marks));
    // Where the text before and after is marked alike, or there is but one of them, what is moved joins it.
    let alike = marks_before == marks_after || !has_before;
    let marks_lead = if has_before { &marks_before } else { &marks_after };

    // The pieces, each with the marks of the text it came from; empty ones fall away.
    let mut out: Vec<Inline> = Vec::with_capacity(5);
    let push = |pieces: &mut Vec<Inline>, text: String, marks: &BTreeMap<String, serde_json::Value>| {
        if text.is_empty() {
            return;
        }
        if let Some(Inline::Text { text: last, marks: m }) = pieces.last_mut()
            && (*m == *marks || alike)
        {
            last.push_str(&text);
            return;
        }
        pieces.push(Inline::Text { text, marks: marks.clone() });
    };
    if notes {
        // The mark hugs what is before it, punctuation included, and passes
        // the stops and the closing quotation marks after it; the text goes on.
        push(&mut out, lead + &signs_before, marks_lead);
        push(&mut out, signs_after, &marks_after);
        out.push(citation);
        push(&mut out, rest_after, &marks_after);
    } else {
        // The stops before it go after it; what closes a quotation or a
        // bracket stays before it; one blank stands before it; the signs
        // after it stand as they do, the blanks between taken away.
        let stops: String = signs_before.chars().filter(|c| is_stop(*c)).collect();
        let kept: String = signs_before.chars().filter(|c| !is_stop(*c)).collect();
        let mut lead = lead + &kept;
        if lead.chars().last().is_some_and(|c| !c.is_whitespace() && !OPENERS.contains(&c)) {
            lead.push(' ');
        }
        push(&mut out, lead, marks_lead);
        out.push(citation);
        push(&mut out, stops, &marks_before);
        push(&mut out, signs_after + &rest_after, &marks_after);
    }
    let cited = out.iter().position(|x| matches!(x, Inline::Citation { .. })).unwrap_or(0);
    line.splice(from..to, out);
    // On from the text after the citation, which may hold the next one.
    from + cited + 1
}

#[cfg(test)]
mod tests {
    use super::super::fixtures::{cite, marked, text};
    use super::*;

    fn said(line: &[Inline]) -> String {
        line.iter()
            .map(|i| match i {
                Inline::Text { text, marks } if marks.is_empty() => text.clone(),
                Inline::Text { text, .. } => format!("*{text}*"),
                Inline::Citation { .. } => "[c]".into(),
                Inline::Footnote { content, .. } => format!("^({})", said(content)),
                _ => "?".into(),
            })
            .collect()
    }

    fn placed(line: Vec<Inline>, notes: bool) -> String {
        let mut line = line;
        place_line(&mut line, notes);
        said(&line)
    }

    #[test]
    fn a_note_stands_after_the_punctuation() {
        let c = || cite("nagy1979", Some("73"));
        assert_eq!(placed(vec![text("as is said "), c(), text(". Then")], true), "as is said.[c] Then");
        assert_eq!(placed(vec![text("as is said. "), c(), text(" Then")], true), "as is said.[c] Then");
        assert_eq!(placed(vec![text("as is said"), c(), text(".")], true), "as is said.[c]");
        assert_eq!(placed(vec![text("“words"), c(), text(".” Then")], true), "“words.”[c] Then");
        assert_eq!(placed(vec![text("“words.” "), c(), text(" Then")], true), "“words.”[c] Then");
        // Mid-sentence: the mark hugs the word.
        assert_eq!(placed(vec![text("as Nagy "), c(), text(" argues")], true), "as Nagy[c] argues");
        assert_eq!(placed(vec![c(), text(" Then")], true), "[c] Then");
    }

    #[test]
    fn a_citation_in_the_line_stands_before_the_punctuation() {
        let c = || cite("nagy1979", Some("73"));
        assert_eq!(placed(vec![text("as is said. "), c(), text(" Then")], false), "as is said [c]. Then");
        assert_eq!(placed(vec![text("as is said."), c(), text(" Then")], false), "as is said [c]. Then");
        assert_eq!(placed(vec![text("as is said "), c(), text(". Then")], false), "as is said [c]. Then");
        assert_eq!(placed(vec![text("as is said"), c(), text(".")], false), "as is said [c].");
        // The closing quotation mark stays before the citation, the full stop goes after it.
        assert_eq!(placed(vec![text("“words.” "), c(), text(" Then")], false), "“words” [c]. Then");
        assert_eq!(placed(vec![text("“words” "), c(), text(". Then")], false), "“words” [c]. Then");
        // Within a quotation or brackets, as written.
        assert_eq!(placed(vec![text("“words"), c(), text("”. Then")], false), "“words [c]”. Then");
        assert_eq!(placed(vec![text("(see also "), c(), text(")")], false), "(see also [c])");
        assert_eq!(placed(vec![text("(see also "), c(), text(").")], true), "(see also[c]).");
        // Mid-sentence: one blank before, the rest as it was.
        assert_eq!(placed(vec![text("as Nagy  "), c(), text(" argues")], false), "as Nagy [c] argues");
        assert_eq!(placed(vec![text("("), c(), text(")")], false), "([c])");
        assert_eq!(placed(vec![c(), text(". Then")], false), "[c]. Then");
    }

    #[test]
    fn what_is_left_alone() {
        let c = || cite("nagy1979", None);
        // The author named in the sentence is part of it.
        let named = Inline::Citation {
            items: vec![super::super::CiteItem { id: "nagy1979".into(), ..Default::default() }],
            mode: CiteMode::Intext,
        };
        assert_eq!(placed(vec![text("As "), named, text(" says.")], true), "As [c] says.");
        // Words on both sides.
        assert_eq!(placed(vec![text("as "), c(), text(" has it, so")], false), "as [c] has it, so");
        // Two citations in a row, the second before the full stop.
        assert_eq!(placed(vec![text("said "), c(), text(" and "), c(), text(".")], false), "said [c] and [c].");
        assert_eq!(placed(vec![text("said "), c(), text(" and "), c(), text(".")], true), "said[c] and.[c]");
    }

    #[test]
    fn within_a_note_the_citation_is_in_the_line_of_the_note() {
        let c = || cite("nagy1979", Some("73"));
        let note = Inline::Footnote { content: vec![text("See "), c(), text(".")], place: None };
        // The note itself is the writer's, and stands where it was written.
        assert_eq!(placed(vec![text("Not all agree"), note, text(". Then")], true), "Not all agree^(See [c].). Then");
    }

    #[test]
    fn the_marks_of_the_text_are_kept() {
        let c = || cite("nagy1979", Some("73"));
        // The full stop was in italics with its word: it stays so, after the citation.
        assert_eq!(placed(vec![marked("Iliad.", &["em"]), c(), text(" Then")], false), "*Iliad *[c]*.* Then");
        assert_eq!(placed(vec![marked("Iliad", &["em"]), c(), text(". Then")], false), "*Iliad *[c]. Then");
        assert_eq!(placed(vec![marked("Iliad", &["em"]), c(), text(". Then")], true), "*Iliad*.[c] Then");
    }

    #[test]
    fn through_the_whole_document() {
        use super::super::fixtures::para;
        let mut doc = Document {
            sections: vec![super::super::Section {
                level: 1,
                heading: None,
                blocks: vec![
                    para(vec![text("Said. "), cite("a", None)]),
                    Block::Blockquote { content: vec![para(vec![text("Quoted "), cite("b", None), text(".")])] },
                ],
                element: None,
            }],
            ..Default::default()
        };
        place_citations(&mut doc, true);
        let Block::Paragraph { content } = &doc.sections[0].blocks[0] else { panic!() };
        assert_eq!(said(content), "Said.[c]");
        let Block::Blockquote { content } = &doc.sections[0].blocks[1] else { panic!() };
        let Block::Paragraph { content } = &content[0] else { panic!() };
        assert_eq!(said(content), "Quoted.[c]");
    }
}
