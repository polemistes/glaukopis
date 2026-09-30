//! What is said of figures and tables, where a file has it as a paragraph
//! beside them.
//!
//! A word processor writes what is said of a figure or a table as a
//! paragraph of its own, over it or under it, beginning with a word and a
//! number: "Table 1: Forms of the word". In a map it belongs to the figure
//! or the table itself, and without the word and the number, which the map
//! gives: it numbers what stands in it.
//!
//! Such a paragraph is known by its style, where the file was one that says
//! so (see `lifting.rs`, which marks them), and otherwise by its shape: a
//! word, a number, a sign that ends them, and the words. What the word is
//! is not asked: it is Figure, Figur, Abbildung, Tableau, as the writer has
//! it. It must stand directly beside what it speaks of.

use super::convert::{join, trim};
use super::lifting::MARK;
use super::plain::text_of;
use crate::document::{Block, Inline};

/// What was done, for saying so.
#[derive(Debug, Default, PartialEq)]
pub(super) struct Taken {
    /// Paragraphs that became what is said of a figure or a table.
    pub captions: usize,
    /// Those of all that is said of figures and tables that lost a word and a number.
    pub labels: usize,
    /// The first of them, as it was written: "Table 1:".
    pub first: Option<String>,
    /// Notes that stand in brackets now, since what is said of a figure has none.
    pub bracketed: usize,
}

fn is_number(number: &[char]) -> bool {
    if number.is_empty() || number.len() > 12 {
        return false;
    }
    number.split(|c| matches!(c, '.' | '-' | '–')).all(|group| {
        // Not a year, nor a page: what is numbered so is seldom more than some hundreds.
        let digits = |part: &[char]| !part.is_empty() && part.len() <= 3 && part.iter().all(char::is_ascii_digit);
        match group {
            [] => false,
            all if digits(all) => true,
            // IV, and iv
            all if all.len() <= 7 && all.iter().all(|c| "IVXLCDM".contains(*c)) => true,
            all if all.len() <= 5 && all.iter().all(|c| "ivx".contains(*c)) => true,
            // A, A1, 1a
            [letter] => letter.is_uppercase(),
            [letter, rest @ ..] if letter.is_alphabetic() && digits(rest) => true,
            [rest @ .., letter] if letter.is_alphabetic() && digits(rest) => true,
            _ => false,
        }
    })
}

/// How many signs at the beginning of a line are a word and a number
/// before what is said: the label of a caption. With `by_style`, the line
/// is known to be a caption, and the sign that ends the number may be
/// wanting; otherwise words must follow it.
pub(super) fn label(text: &str, by_style: bool) -> Option<usize> {
    let chars: Vec<char> = text.chars().collect();
    let room = |at: &mut usize| {
        let from = *at;
        while *at < chars.len() && chars[*at].is_whitespace() {
            *at += 1;
        }
        *at > from
    };
    let mut at = 0;
    room(&mut at);
    // The word.
    let from = at;
    while at < chars.len() && (chars[at].is_alphabetic() || (chars[at] == '.' && at > from)) {
        at += 1;
    }
    // Not "In 1979: …": a word of the alphabet of Rome is of three letters or more.
    let short = at - from < 3 && chars[from..at].iter().all(char::is_ascii);
    if at == from || at - from > 24 || short || !room(&mut at) {
        return None;
    }
    // The number, in which signs may stand, and after which one may stand.
    let from = at;
    while at < chars.len() && (chars[at].is_alphanumeric() || matches!(chars[at], '.' | '-' | '–')) {
        at += 1;
    }
    let mut to = at;
    while to > from && matches!(chars[to - 1], '.' | '-' | '–') {
        to -= 1;
    }
    if !is_number(&chars[from..to]) {
        return None;
    }
    let mut ended = to < at;
    if !ended {
        let mut next = at;
        room(&mut next);
        if chars.get(next).is_some_and(|c| matches!(c, ':' | '.' | '–' | '—') || (*c == '-' && next > at)) {
            ended = true;
            at = next + 1;
        }
    }
    if !ended && (!by_style || chars.get(at).is_some_and(|c| !c.is_whitespace())) {
        return None;
    }
    room(&mut at);
    if at >= chars.len() && !by_style {
        return None;
    }
    Some(at)
}

/// The text a line begins with, as far as it is text.
fn beginning(line: &[Inline]) -> String {
    let mut out = String::new();
    for i in line {
        match i {
            Inline::Text { text, .. } => out.push_str(text),
            _ => break,
        }
    }
    out
}

/// Takes signs away from the beginning of a line.
fn without(line: &mut Vec<Inline>, mut signs: usize) {
    while signs > 0 {
        let Some(Inline::Text { text, .. }) = line.first_mut() else { return };
        let has = text.chars().count();
        if has <= signs {
            signs -= has;
            line.remove(0);
        } else {
            *text = text.chars().skip(signs).collect();
            signs = 0;
        }
    }
}

/// Whether a line is marked as one that says something of a figure or a table.
fn marked(line: &[Inline]) -> bool {
    matches!(line.first(), Some(Inline::Text { text, .. }) if text.starts_with(MARK))
}

/// What is said of a figure or a table, as the map has it: without the
/// mark, without the word and the number before it, and without notes,
/// which stand in brackets.
pub(super) fn said(mut line: Vec<Inline>, taken: &mut Taken) -> Vec<Inline> {
    let by_style = marked(&line);
    if by_style {
        without(&mut line, MARK.chars().count());
    }
    let begins = beginning(&line);
    if let Some(signs) = label(&begins, by_style) {
        taken.labels += 1;
        if taken.first.is_none() {
            taken.first = Some(begins.chars().take(signs).collect::<String>().trim().to_owned());
        }
        without(&mut line, signs);
    }
    let mut out = Vec::with_capacity(line.len());
    for i in line {
        match i {
            Inline::Footnote { content, .. } => {
                taken.bracketed += 1;
                out.push(text_of(" ("));
                out.extend(content.into_iter().filter(|i| !matches!(i, Inline::Footnote { .. })));
                out.push(text_of(")"));
            }
            other => out.push(other),
        }
    }
    let mut out = join(out);
    trim(&mut out);
    out
}

/// How a paragraph is known to say something of what stands beside it.
#[derive(Clone, Copy, PartialEq)]
enum Known {
    ByStyle,
    ByShape,
}

fn known(block: Option<&Block>) -> Option<Known> {
    let Some(Block::Paragraph { content }) = block else { return None };
    if marked(content) {
        Some(Known::ByStyle)
    } else if label(&beginning(content), false).is_some() {
        Some(Known::ByShape)
    } else {
        None
    }
}

/// Gives the figures and tables of a text what is said of them, where that
/// stands as a paragraph directly beside them. Of a table it is looked for
/// over it first, of a figure under it; one that is known by its style
/// before one that is known by its shape.
pub(super) fn attach(blocks: &mut Vec<Block>, taken: &mut Taken) {
    for block in blocks.iter_mut() {
        match block {
            Block::Blockquote { content } => attach(content, taken),
            Block::BulletList { items } | Block::OrderedList { items, .. } => {
                for item in items {
                    attach(item, taken);
                }
            }
            _ => {}
        }
    }
    let mut at = 0;
    while at < blocks.len() {
        let over_first = match &blocks[at] {
            Block::Table(table) if table.caption.is_empty() => true,
            Block::Figure { caption, .. } if caption.is_empty() => false,
            _ => {
                at += 1;
                continue;
            }
        };
        let over = at.checked_sub(1);
        let under = Some(at + 1).filter(|i| *i < blocks.len());
        let places = if over_first { [over, under] } else { [under, over] };
        let found = [Known::ByStyle, Known::ByShape]
            .into_iter()
            .find_map(|how| places.into_iter().flatten().find(|place| known(blocks.get(*place)) == Some(how)));
        if let Some(place) = found {
            let Block::Paragraph { content } = blocks.remove(place) else { unreachable!("it was seen to be one") };
            if place < at {
                at -= 1;
            }
            let line = said(content, taken);
            taken.captions += 1;
            match &mut blocks[at] {
                Block::Table(table) => {
                    table.caption = line;
                    table.numbered = true;
                }
                Block::Figure { caption, numbered, .. } => {
                    *caption = line;
                    *numbered = true;
                }
                _ => {}
            }
        }
        at += 1;
    }
}

fn unmark_line(line: &mut Vec<Inline>) {
    for i in line.iter_mut() {
        match i {
            Inline::Text { text, .. } if text.contains(MARK) => *text = text.replace(MARK, ""),
            Inline::Footnote { content, .. } => unmark_line(content),
            _ => {}
        }
    }
    line.retain(|i| !matches!(i, Inline::Text { text, .. } if text.is_empty()));
}

/// Takes away the marks that are left: of paragraphs that were marked and
/// had nothing beside them to speak of.
pub(super) fn unmark(blocks: &mut Vec<Block>) {
    for block in blocks.iter_mut() {
        match block {
            Block::Paragraph { content } => unmark_line(content),
            Block::Blockquote { content } => unmark(content),
            Block::BulletList { items } | Block::OrderedList { items, .. } => items.iter_mut().for_each(unmark),
            Block::Figure { caption, .. } => unmark_line(caption),
            Block::Table(table) => {
                unmark_line(&mut table.caption);
                for cell in table.rows.iter_mut().flatten() {
                    unmark(&mut cell.content);
                    if cell.content.is_empty() {
                        cell.content.push(Block::Paragraph { content: Vec::new() });
                    }
                }
            }
            Block::Row { items } => unmark(items),
            Block::Equation { .. } => {}
        }
    }
    // A paragraph that held nothing but the mark holds nothing.
    blocks.retain(|b| !matches!(b, Block::Paragraph { content } if content.is_empty()));
}

/// Whether what a picture shows is said in the same words as what is said
/// of it, with or without a word and a number before them.
pub(super) fn said_twice(shows: &str, said: &str) -> bool {
    let shows = shows.trim();
    let bare = label(shows, false).map(|signs| shows.chars().skip(signs).collect::<String>());
    shows == said || bare.is_some_and(|bare| bare.trim() == said)
}

/// As `unmark`, of a line.
pub(super) fn unmarked(mut line: Vec<Inline>) -> Vec<Inline> {
    unmark_line(&mut line);
    line
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;

    use super::*;
    use crate::document::{Cell, Table};

    fn text(s: &str) -> Inline {
        text_of(s)
    }

    fn em(s: &str) -> Inline {
        let mut marks = BTreeMap::new();
        marks.insert("em".to_owned(), serde_json::Value::Bool(true));
        Inline::Text { text: s.into(), marks }
    }

    fn paragraph(s: &str) -> Block {
        Block::Paragraph { content: vec![text(s)] }
    }

    fn table(caption: &str) -> Block {
        Block::Table(Table {
            caption: if caption.is_empty() { Vec::new() } else { vec![text(caption)] },
            rows: vec![vec![Cell { content: vec![paragraph("In it.")], ..Default::default() }]],
            numbered: !caption.is_empty(),
            ..Default::default()
        })
    }

    fn figure(caption: &str) -> Block {
        Block::Figure {
            id: String::new(),
            file: "a".repeat(64),
            extension: "png".into(),
            name: "shield.png".into(),
            caption: if caption.is_empty() { Vec::new() } else { vec![text(caption)] },
            alt: String::new(),
            width: 50,
            numbered: !caption.is_empty(),
            align: None,
            wrap: None,
        }
    }

    fn numbered(caption: &str) -> Block {
        match figure(caption) {
            Block::Figure { id, file, extension, name, caption, alt, width, align, wrap, .. } => {
                Block::Figure { id, file, extension, name, caption, alt, width, numbered: true, align, wrap }
            }
            other => other,
        }
    }

    #[test]
    fn a_word_a_number_and_the_words() {
        let rest = |s: &str| label(s, false).map(|n| s.chars().skip(n).collect::<String>());
        for (written, words) in [
            ("Table 1: Forms of the word", "Forms of the word"),
            ("Figure 1. The shield", "The shield"),
            ("Figur 2 – Skjoldet", "Skjoldet"),
            ("Abbildung 3 — Der Schild", "Der Schild"),
            ("Abb. 3: Der Schild", "Der Schild"),
            ("Tableau 1.2 : Les formes", "Les formes"),
            ("Tabell 1-2. Former", "Former"),
            ("Figure IV: The river", "The river"),
            ("Table A1. Forms", "Forms"),
            ("Figure S12: Rings", "Rings"),
            ("Figure 2a: Rings", "Rings"),
            ("Table A: Forms", "Forms"),
            ("Πίνακας 1: Τύποι", "Τύποι"),
            ("图 1: 盾", "盾"),
            ("  Table\u{a0}1:\u{a0}Forms", "Forms"),
            ("Table 1 - Forms", "Forms"),
            ("Table 1:Forms", "Forms"),
        ] {
            assert_eq!(rest(written).as_deref(), Some(words), "{written}");
        }
        for written in [
            "Table 1 shows that the forms are many.",
            "Table 1",
            "Table 1:",
            "Forms of the word",
            "The shield: a study",
            "Figure one: the shield",
            "In 1979: a book",
            "In 19: a book",
            "Homer 1979: a book",
            "1. The first",
            "Version 2.0.1 is out",
            "Table 1.5m wide",
            "Figure mix: all of them",
            "",
        ] {
            assert_eq!(rest(written), None, "{written}");
        }
        // Known by its style to be one, it may be without the sign, and without words.
        assert_eq!(label("Table 1 Forms", true), Some(8));
        assert_eq!(label("Table 1", true), Some(7));
        assert_eq!(label("Table 1:", true), Some(8));
        assert_eq!(label("Table 1st of all", true), None);
        assert_eq!(label("The shield of Achilles", true), None);
    }

    #[test]
    fn what_is_said_loses_the_word_and_the_number() {
        let mut taken = Taken::default();
        let line = said(
            vec![
                text("Figure "),
                em("1"),
                text(": The shield, with its "),
                em("rings"),
                Inline::Footnote { content: vec![text("After Nagy.")], place: None },
            ],
            &mut taken,
        );
        assert_eq!(line, vec![text("The shield, with its "), em("rings"), text(" (After Nagy.)")]);
        assert_eq!(taken, Taken { captions: 0, labels: 1, first: Some("Figure 1:".into()), bracketed: 1 });
        // Marked, and without a label: all of it is what is said.
        let line = said(vec![text(&format!("{MARK}The shield of Achilles"))], &mut taken);
        assert_eq!(line, vec![text("The shield of Achilles")]);
        assert_eq!(taken.labels, 1);
        // Something that is not text before the number is ended: nothing is taken away.
        let line = said(vec![text("Figure "), Inline::Math { tex: "1".into() }, text(": x")], &mut taken);
        assert_eq!(line.len(), 3);
    }

    #[test]
    fn a_paragraph_beside_a_table_or_a_figure_is_what_is_said_of_it() {
        let mut taken = Taken::default();
        let mut blocks = vec![
            paragraph("Before."),
            // Under the table.
            table(""),
            paragraph("Table 1: Forms of the word"),
            paragraph("Table 1 shows that they are few."),
            // Over the table.
            paragraph("Tabell 2. Former"),
            table(""),
            // Between two: it is of the one over it, which has none.
            figure(""),
            paragraph("Figure 1: The shield"),
            figure(""),
            // One that has what is said of it keeps it.
            table("Given"),
            paragraph("Table 9: Not of that one"),
        ];
        attach(&mut blocks, &mut taken);
        assert_eq!(
            blocks,
            vec![
                paragraph("Before."),
                table("Forms of the word"),
                paragraph("Table 1 shows that they are few."),
                table("Former"),
                numbered("The shield"),
                figure(""),
                table("Given"),
                paragraph("Table 9: Not of that one"),
            ]
        );
        assert_eq!(taken.captions, 3);
        assert_eq!(taken.labels, 3);
        assert_eq!(taken.first.as_deref(), Some("Table 1:"));
    }

    #[test]
    fn known_by_its_style_before_known_by_its_shape() {
        let mut taken = Taken::default();
        let mut blocks = vec![
            paragraph("Homer 1: the first book"),
            table(""),
            paragraph(&format!("{MARK}Forms of the word")),
            Block::Blockquote { content: vec![figure(""), paragraph(&format!("{MARK}Figur 1 Skjoldet"))] },
            paragraph(&format!("{MARK}Text 1: Of nothing that stands here")),
        ];
        attach(&mut blocks, &mut taken);
        unmark(&mut blocks);
        assert_eq!(
            blocks,
            vec![
                paragraph("Homer 1: the first book"),
                table("Forms of the word"),
                Block::Blockquote { content: vec![numbered("Skjoldet")] },
                paragraph("Text 1: Of nothing that stands here"),
            ]
        );
        assert_eq!((taken.captions, taken.labels), (2, 1));
    }
}
