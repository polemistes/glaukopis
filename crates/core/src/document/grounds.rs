//! The ground of words (ADR 0116): the colour behind them, a highlight.
//! In a text it is for the eye on the screen, and goes into no document:
//! ordinary text has no look of its own in a document, and the highlight
//! there was before this one, a kind of words, went into none either. On a
//! sheet of rich text it is the look of the words, set by hand as their
//! colour is, and every kind of document sets it.
//!
//! So the writers set a ground only where it is said to be set, and this
//! pass says it, before the document is written: of the words of the
//! paragraphs that stand in a box of rich text, and of no others. Not of a
//! note at the foot written in a box, nor of what is said of a figure
//! there: their look is the layout's.

use serde_json::{Value, json};

use super::{Block, Document, Inline};

/// The mark of the ground of words, as the interface keeps it: `{ "value": "#ffe066" }`.
pub const GROUND: &str = "ground";
/// What this pass adds to the mark where the ground is set in the document.
pub const SET: &str = "set";

fn boxed_words(blocks: &mut [Block], each: &mut impl FnMut(&mut Value)) {
    for block in blocks {
        let Block::Paragraph { rich: Some(_), content, .. } = block else { continue };
        for inline in content.iter_mut() {
            let Inline::Text { marks, .. } = inline else { continue };
            if let Some(ground) = marks.get_mut(GROUND) {
                each(ground);
            }
        }
    }
}

/// Says of every ground on a sheet of rich text that it is set in the document.
pub fn set_grounds(doc: &mut Document) {
    let mut say = |ground: &mut Value| {
        if let Some(held) = ground.as_object_mut() {
            held.insert(SET.into(), json!(true));
        }
    };
    let parts = doc.parts.iter_mut().flat_map(|p| p.sections.iter_mut());
    for section in parts.chain(doc.sections.iter_mut()) {
        boxed_words(&mut section.blocks, &mut say);
    }
}

/// Whether any ground of a document is set in it: for what a target must be told before it can set one.
pub fn has_grounds(doc: &Document) -> bool {
    let parts = doc.parts.iter().flat_map(|p| p.sections.iter());
    parts.chain(doc.sections.iter()).any(|section| {
        section.blocks.iter().any(|block| match block {
            Block::Paragraph { rich: Some(_), content, .. } => {
                content.iter().any(|inline| matches!(inline, Inline::Text { marks, .. } if marks.contains_key(GROUND)))
            }
            _ => false,
        })
    })
}

#[cfg(test)]
mod tests {
    use super::super::Section;
    use super::*;

    fn words(ground: bool) -> Vec<Inline> {
        let mut marks = std::collections::BTreeMap::new();
        if ground {
            marks.insert(GROUND.to_owned(), json!({ "value": "#ffe066" }));
        }
        vec![Inline::Text { text: "marked".into(), marks }]
    }

    fn paragraph(boxed: bool, ground: bool) -> Block {
        let mut block = Block::paragraph(words(ground));
        if let Block::Paragraph { rich, .. } = &mut block {
            *rich = boxed.then(|| "first".to_owned());
        }
        block
    }

    fn set(block: &Block) -> Option<bool> {
        let Block::Paragraph { content, .. } = block else { return None };
        let Inline::Text { marks, .. } = &content[0] else { return None };
        marks.get(GROUND).map(|ground| ground.get(SET) == Some(&json!(true)))
    }

    #[test]
    fn a_ground_is_set_in_the_document_on_a_sheet_of_rich_text_and_nowhere_else() {
        let mut doc = Document {
            sections: vec![Section {
                blocks: vec![paragraph(true, true), paragraph(false, true), paragraph(true, false)],
                ..Default::default()
            }],
            ..Default::default()
        };
        assert!(has_grounds(&doc));
        set_grounds(&mut doc);
        let blocks = &doc.sections[0].blocks;
        assert_eq!(set(&blocks[0]), Some(true));
        assert_eq!(set(&blocks[1]), Some(false), "in a text it is for the eye on the screen");
        assert_eq!(set(&blocks[2]), None);

        let plain = Document {
            sections: vec![Section { blocks: vec![paragraph(false, true)], ..Default::default() }],
            ..Default::default()
        };
        assert!(!has_grounds(&plain));
    }
}
