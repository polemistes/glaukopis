//! Text without marks: read whatever it was written in, and set in
//! paragraphs.

use super::convert::count;
use super::*;

/// Text as it is, whatever it was written in: UTF-8, UTF-16 where it says
/// so, and otherwise the letters of Western Europe.
pub(super) fn decode(bytes: &[u8]) -> String {
    if let Some(rest) = bytes.strip_prefix(&[0xef, 0xbb, 0xbf])
        && let Ok(text) = std::str::from_utf8(rest)
    {
        return text.to_owned();
    }
    for (mark, big) in [([0xff_u8, 0xfe], false), ([0xfe, 0xff], true)] {
        if let Some(rest) = bytes.strip_prefix(&mark) {
            let units: Vec<u16> = rest
                .as_chunks::<2>()
                .0
                .iter()
                .map(|c| if big { u16::from_be_bytes(*c) } else { u16::from_le_bytes(*c) })
                .collect();
            return String::from_utf16_lossy(&units);
        }
    }
    match std::str::from_utf8(bytes) {
        Ok(text) => text.to_owned(),
        Err(_) => bytes.iter().map(|b| western(*b)).collect(),
    }
}

/// A letter of Windows-1252, which is Latin-1 but for a few.
fn western(byte: u8) -> char {
    const HIGH: [char; 32] = [
        '€', '\u{81}', '‚', 'ƒ', '„', '…', '†', '‡', 'ˆ', '‰', 'Š', '‹', 'Œ', '\u{8d}', 'Ž', '\u{8f}', '\u{90}', '‘',
        '’', '“', '”', '•', '–', '—', '˜', '™', 'š', '›', 'œ', '\u{9d}', 'ž', 'Ÿ',
    ];
    match byte {
        0x80..=0x9f => HIGH[usize::from(byte - 0x80)],
        _ => char::from(byte),
    }
}

/// Text without marks: paragraphs are set apart by empty lines; where there
/// are none, every line is a paragraph.
pub(super) fn plain(text: &str, stem: &str) -> Imported {
    let text = text.replace("\r\n", "\n").replace('\r', "\n");
    let apart = text.trim().contains("\n\n");
    let paragraphs: Vec<String> = if apart {
        let mut out = Vec::new();
        let mut current: Vec<&str> = Vec::new();
        for line in text.lines() {
            if line.trim().is_empty() {
                if !current.is_empty() {
                    out.push(current.join(" "));
                    current.clear();
                }
            } else {
                current.push(line.trim());
            }
        }
        if !current.is_empty() {
            out.push(current.join(" "));
        }
        out
    } else {
        text.lines().map(|l| l.trim().to_owned()).filter(|l| !l.is_empty()).collect()
    };
    let blocks: Vec<Block> = paragraphs
        .into_iter()
        .map(|p| Block::Paragraph { content: vec![Inline::Text { text: clean(&p), marks: BTreeMap::new() }] })
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
