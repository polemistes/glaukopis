//! Text without marks: read whatever it was written in, and set in
//! paragraphs.

use super::convert::count;
use super::*;

/// Text without marks, every line break kept: paragraphs are set apart by
/// empty lines, each further empty line is an empty paragraph, and the lines
/// of a paragraph stay lines, each ending in a break, so that verse and
/// addresses are read as they were written; where there is no empty line at
/// all, every line is a paragraph.
pub(super) fn plain(text: &str, stem: &str) -> Imported {
    let text = text.replace("\r\n", "\n").replace('\r', "\n");
    let apart = text.trim().contains("\n\n");
    let paragraphs: Vec<Vec<&str>> = if apart {
        let mut out = Vec::new();
        let mut current: Vec<&str> = Vec::new();
        let mut empty = 0usize;
        for line in text.lines() {
            if line.trim().is_empty() {
                empty += 1;
                continue;
            }
            if empty > 0 && !current.is_empty() {
                out.push(std::mem::take(&mut current));
                // One empty line parts the paragraphs; each further one is an empty paragraph.
                out.extend(std::iter::repeat_n(Vec::new(), empty - 1));
            }
            empty = 0;
            current.push(line.trim());
        }
        if !current.is_empty() {
            out.push(current);
        }
        out
    } else {
        text.lines().map(str::trim).filter(|l| !l.is_empty()).map(|l| vec![l]).collect()
    };
    let blocks: Vec<Block> = paragraphs
        .into_iter()
        .map(|lines| {
            let mut content = Vec::with_capacity(lines.len() * 2);
            for (i, line) in lines.into_iter().enumerate() {
                if i > 0 {
                    content.push(Inline::Break);
                }
                content.push(Inline::Text { text: clean(line), marks: BTreeMap::new() });
            }
            Block::paragraph(content)
        })
        .collect();
    let sections = if blocks.is_empty() { Vec::new() } else { vec![Section { level: 0, heading: Vec::new(), blocks }] };
    let counts = count(&sections, 0, 0);
    Imported { title: vec![text_of(stem)], sections, counts, ..Default::default() }
}

/// Without the signs that are not text.
pub(super) fn clean(text: &str) -> String {
    text.chars().filter(|c| !c.is_control() || *c == '\t').map(|c| if c == '\t' { ' ' } else { c }).collect()
}

pub(super) fn text_of(text: &str) -> Inline {
    Inline::Text { text: text.to_owned(), marks: BTreeMap::new() }
}
