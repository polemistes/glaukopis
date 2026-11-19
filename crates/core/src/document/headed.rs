//! The headings of rich text (ADR 0115). In a box of rich text a paragraph
//! of text can be a heading: it looks like one and is none. It is no
//! element, so it has no number, stands in no table of contents and cannot
//! be pointed to; it is a paragraph whose look was set by hand, in one
//! word.
//!
//! *Heading* is set as the layout sets the headings one level under the
//! element the text is of, *Subheading* as those two under it. This pass
//! writes that out before the document is set: the size, the weight and
//! the case onto the words, and the alignment, the line spacing, the space
//! before and after and the first line into what is said of the paragraph
//! by hand, each only where nothing was said by hand already. So every
//! writer sets it as it sets any paragraph that stands by hand. What is
//! left of the heading for the writers is that the paragraph is kept with
//! what follows it and, in Typst, that the space before and after it is
//! all the room there is, as about a heading (`passages.rs`, `hand_typst`).

use std::collections::HashMap;

use serde_json::json;

use super::{Block, Document, Inline};
use crate::formats::{Align, Case, DocumentFormat, Length};

/// Writes out the headings of rich text in a document, by the layout each
/// stands under: the document's, or that of an element with a look of its
/// own (ADR 0059). `typst` says that the document is set by Typst, where a
/// heading is given the room that wide line spacing asks for under it; a
/// word processor leaves that room by itself.
pub fn set_headings(doc: &mut Document, base: &DocumentFormat, typst: bool) {
    let looks = std::mem::take(&mut doc.looks);
    {
        let by_element: HashMap<&str, &DocumentFormat> =
            looks.iter().map(|l| (l.element.as_str(), &l.format)).collect();
        // The stretches of the elements with a look of their own: a stack, as a chapter in a part may have one within the part's.
        let mut stack: Vec<(u8, &DocumentFormat)> = Vec::new();
        for section in &mut doc.sections {
            while stack.last().is_some_and(|(level, _)| *level >= section.level) {
                stack.pop();
            }
            if let Some(f) = section.element.as_deref().and_then(|e| by_element.get(e).copied()) {
                stack.push((section.level, f));
            }
            let f = stack.last().map(|(_, f)| *f).unwrap_or(base);
            set_in_blocks(&mut section.blocks, section.level, f, typst);
        }
        for section in doc.parts.iter_mut().flat_map(|p| p.sections.iter_mut()) {
            set_in_blocks(&mut section.blocks, section.level, base, typst);
        }
    }
    doc.looks = looks;
}

fn set_in_blocks(blocks: &mut [Block], level: u8, f: &DocumentFormat, typst: bool) {
    for block in blocks {
        let Block::Paragraph { name, rich, hand, content, .. } = block else { continue };
        let Some(said) = hand.as_deref_mut() else { continue };
        let Some(under) = said.heading() else {
            said.heading = None;
            continue;
        };
        // A heading is a paragraph of text in a box: anywhere else it is none.
        if rich.is_none() || name != "text" {
            said.heading = None;
            continue;
        }
        let h = f.heading(usize::from(level) + usize::from(under));
        if said.align().is_none() {
            said.align = Some(
                match h.align {
                    Align::Center => "center",
                    Align::Right => "right",
                    Align::Left | Align::Justified => "left",
                }
                .to_owned(),
            );
        }
        if said.line_spacing().is_none() {
            said.line_spacing = Some(1.0);
        }
        if said.space_before().is_none() {
            said.space_before = Some(h.space_before.to_string());
        }
        if said.space_after().is_none() {
            let wide = if typst { ((f.text.line_spacing - 1.0) * 1.2 * f.font.size).max(0.0) } else { 0.0 };
            let after = if wide > 0.0 { Length::pt(h.space_after.points() + wide) } else { h.space_after };
            said.space_after = Some(after.to_string());
        }
        if said.first_line().is_none() {
            said.first_line = Some(Length::pt(0.0).to_string());
        }
        if said.indent_left().is_none() && h.indent && f.text.indent.points() > 0.0 {
            said.indent_left = Some(f.text.indent.to_string());
        }
        for inline in content.iter_mut() {
            let Inline::Text { text, marks } = inline else { continue };
            if h.bold {
                marks.insert("strong".into(), json!(true));
            }
            if h.italic {
                marks.insert("em".into(), json!(true));
            }
            if h.size > 0.0 && !marks.contains_key("size") {
                marks.insert("size".into(), json!({ "pt": h.size }));
            }
            match h.case {
                Case::Upper => *text = text.to_uppercase(),
                Case::Smallcaps => {
                    marks.insert("smallcaps".into(), json!(true));
                }
                Case::None => {}
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::super::{ElementLook, Hand, Section};
    use super::*;
    use crate::formats::HeadingLevel;

    fn text(words: &str) -> Vec<Inline> {
        vec![Inline::Text { text: words.into(), marks: Default::default() }]
    }

    fn heading(words: &str, under: u8, more: Hand) -> Block {
        let mut block = Block::paragraph(text(words));
        if let Block::Paragraph { rich, hand, .. } = &mut block {
            *rich = Some("first".into());
            *hand = Some(Box::new(Hand { heading: Some(under), ..more }));
        }
        block
    }

    fn format() -> DocumentFormat {
        let mut f = DocumentFormat::default();
        f.font.size = 12.0;
        f.text.line_spacing = 2.0;
        f.text.indent = Length::parse("1cm").unwrap();
        let level = |size: f32, align: Align, case: Case, italic: bool| HeadingLevel {
            size,
            bold: !italic,
            italic,
            align,
            case,
            indent: false,
            space_before: Length::pt(size),
            space_after: Length::pt(size / 2.0),
            ..Default::default()
        };
        f.headings.levels = vec![
            level(20.0, Align::Center, Case::None, false),
            level(16.0, Align::Left, Case::Upper, false),
            level(13.0, Align::Left, Case::Smallcaps, true),
        ];
        f
    }

    fn document(level: u8, blocks: Vec<Block>) -> Document {
        Document {
            sections: vec![Section { level, element: Some("one".into()), blocks, ..Default::default() }],
            ..Default::default()
        }
    }

    fn first(doc: &Document) -> (&Hand, &Vec<Inline>) {
        match &doc.sections[0].blocks[0] {
            Block::Paragraph { hand, content, .. } => (hand.as_deref().unwrap(), content),
            _ => unreachable!(),
        }
    }

    fn marks(content: &[Inline]) -> (&str, Vec<&str>) {
        match &content[0] {
            Inline::Text { text, marks } => (text.as_str(), marks.keys().map(String::as_str).collect()),
            _ => unreachable!(),
        }
    }

    #[test]
    fn a_heading_is_set_as_the_level_under_its_element_and_a_subheading_as_the_one_under_that() {
        // In the text of the document itself: the first level, and the second.
        let mut doc = document(0, vec![heading("One", 1, Hand::default()), heading("Two", 2, Hand::default())]);
        set_headings(&mut doc, &format(), false);
        let (hand, content) = first(&doc);
        assert_eq!(hand.align.as_deref(), Some("center"));
        assert_eq!(hand.line_spacing, Some(1.0));
        assert_eq!(hand.space_before.as_deref(), Some("20pt"));
        assert_eq!(hand.space_after.as_deref(), Some("10pt"));
        assert_eq!(hand.first_line.as_deref(), Some("0pt"));
        assert_eq!(hand.heading(), Some(1), "what is left for the writers: kept with what follows");
        assert_eq!(marks(content), ("One", vec!["size", "strong"]));
        let Block::Paragraph { hand, content, .. } = &doc.sections[0].blocks[1] else { unreachable!() };
        assert_eq!(hand.as_deref().unwrap().align.as_deref(), Some("left"));
        assert_eq!(marks(content), ("TWO", vec!["size", "strong"]), "the second level is in capitals");

        // Under an element of the first level: the second, and the third.
        let mut doc = document(1, vec![heading("One", 1, Hand::default()), heading("Two", 2, Hand::default())]);
        set_headings(&mut doc, &format(), false);
        assert_eq!(marks(first(&doc).1), ("ONE", vec!["size", "strong"]));
        let Block::Paragraph { content, .. } = &doc.sections[0].blocks[1] else { unreachable!() };
        assert_eq!(marks(content), ("Two", vec!["em", "size", "smallcaps"]));

        // Deeper than the layout has levels: as its last.
        let mut doc = document(5, vec![heading("One", 2, Hand::default())]);
        set_headings(&mut doc, &format(), false);
        assert_eq!(marks(first(&doc).1), ("One", vec!["em", "size", "smallcaps"]));
    }

    #[test]
    fn what_was_said_by_hand_stays_and_typst_is_given_the_room_wide_lines_ask_for() {
        let said = Hand { align: Some("right".into()), space_after: Some("3pt".into()), ..Default::default() };
        let mut content = text("One");
        if let Inline::Text { marks, .. } = &mut content[0] {
            marks.insert("size".into(), json!({ "pt": 30 }));
        }
        let mut block = heading("", 1, said);
        if let Block::Paragraph { content: c, .. } = &mut block {
            *c = content;
        }
        let mut doc = document(0, vec![block, heading("Two", 1, Hand::default())]);
        set_headings(&mut doc, &format(), true);
        let (hand, content) = first(&doc);
        assert_eq!(hand.align.as_deref(), Some("right"));
        assert_eq!(hand.space_after.as_deref(), Some("3pt"));
        let Inline::Text { marks, .. } = &content[0] else { unreachable!() };
        assert_eq!(marks["size"], json!({ "pt": 30 }));
        // Double spacing at twelve points: 14.4 points under the heading's own ten.
        let Block::Paragraph { hand, .. } = &doc.sections[0].blocks[1] else { unreachable!() };
        assert_eq!(hand.as_deref().unwrap().space_after.as_deref(), Some("24.4pt"));
    }

    #[test]
    fn a_heading_is_one_only_as_a_paragraph_of_text_in_a_box() {
        let mut outside = heading("One", 1, Hand::default());
        if let Block::Paragraph { rich, .. } = &mut outside {
            *rich = None;
        }
        let mut point = heading("Two", 1, Hand::default());
        if let Block::Paragraph { name, .. } = &mut point {
            *name = "item".into();
        }
        let mut doc = document(0, vec![outside, point]);
        set_headings(&mut doc, &format(), false);
        for block in &doc.sections[0].blocks {
            let Block::Paragraph { hand, content, .. } = block else { unreachable!() };
            assert_eq!(hand.as_deref().unwrap().heading(), None);
            assert!(hand.as_deref().unwrap().is_empty());
            assert!(marks(content).1.is_empty());
        }
    }

    #[test]
    fn under_an_element_with_a_look_of_its_own_it_is_set_as_that_look_sets_headings() {
        let mut own = format();
        own.headings.levels[1].size = 40.0;
        let top = Section { level: 0, blocks: vec![heading("Top", 2, Hand::default())], ..Default::default() };
        let mut doc = document(1, vec![heading("One", 1, Hand::default())]);
        doc.sections.insert(0, top);
        doc.looks = vec![ElementLook { element: "one".into(), format: own }];
        set_headings(&mut doc, &format(), false);
        // Both are of the second level: the one in the text of the document as the document sets it, the other as the element's look does.
        let size = |section: &Section| {
            let Block::Paragraph { content, .. } = &section.blocks[0] else { unreachable!() };
            let Inline::Text { marks, .. } = &content[0] else { unreachable!() };
            marks["size"].clone()
        };
        assert_eq!(size(&doc.sections[0]), json!({ "pt": 16.0 }));
        assert_eq!(size(&doc.sections[1]), json!({ "pt": 40.0 }));
        assert_eq!(doc.looks.len(), 1, "the looks are the document's still");
    }
}
