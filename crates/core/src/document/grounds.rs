//! The ground of words (ADR 0116): the colour behind them, a highlight.
//! A mark of words as bold and italic are, with the colour it holds, and
//! set in every kind of document wherever it stands: in a text, on a sheet
//! of rich text, in a note at the foot, in what is said of a figure, in a
//! cell of a table. The writers set it with what is set by hand of words
//! (`pandoc.rs`, `HandWords`).

use super::{Document, Inline};

/// The mark of the ground of words, as the interface keeps it: `{ "value": "#ffe066" }`.
pub const GROUND: &str = "ground";

fn in_line(line: &[Inline]) -> bool {
    line.iter().any(|inline| match inline {
        Inline::Text { marks, .. } => marks.contains_key(GROUND),
        Inline::Footnote { content, .. } => in_line(content),
        _ => false,
    })
}

/// Whether any words of a document have a ground: for what a target must be told before it can set one.
pub fn has_grounds(doc: &Document) -> bool {
    let mut found = false;
    doc.walk(&mut |_| {}, &mut |line| found = found || in_line(line));
    found
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::super::{Block, Section};
    use super::*;

    fn words(ground: bool) -> Vec<Inline> {
        let mut marks = std::collections::BTreeMap::new();
        if ground {
            marks.insert(GROUND.to_owned(), json!({ "value": "#ffe066" }));
        }
        vec![Inline::Text { text: "marked".into(), marks }]
    }

    fn document(content: Vec<Inline>) -> Document {
        Document {
            sections: vec![Section { blocks: vec![Block::paragraph(content)], ..Default::default() }],
            ..Default::default()
        }
    }

    #[test]
    fn a_document_is_asked_whether_any_of_its_words_have_a_ground() {
        assert!(has_grounds(&document(words(true))));
        assert!(!has_grounds(&document(words(false))));
        // In a note at the foot too.
        let note = vec![Inline::Footnote { content: words(true), place: None }];
        assert!(has_grounds(&document(note)));
    }
}
