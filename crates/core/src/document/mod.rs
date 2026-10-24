//! A document as the interface hands it over for preview and export.
//!
//! The interface walks the map: it follows the hierarchy, leaves out what is
//! excluded or loose, puts included maps in their place, and works out the
//! level of each heading. What arrives here is the document in order, as
//! sections of blocks. The shapes are those of `src/lib/project/model/text.ts`.

pub mod beside;
pub mod bibliography;
mod numbers;
pub mod pandoc;
mod passages;
mod placing;

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use crate::bib::names::Person;
use crate::formats::Stand;
pub use crate::formats::kinds::OwnKind;
pub use numbers::{Counted, Line, Mark, Shown, Stretch, lines_of, numbers, stretch_numbers, stretches};

/// A word the document prints, in the language of the document; in English
/// where documents have no words in that language (ADR 0020).
pub(crate) fn term(language: Option<&str>, id: &str) -> String {
    crate::i18n::term(language, id).or_else(|| crate::i18n::term(None, id)).unwrap_or_else(|| id.to_owned())
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", default)]
pub struct CiteItem {
    /// The id of the reference.
    pub id: String,
    pub locator: Option<String>,
    /// What the locator counts, as CSL names it. Absent for pages.
    pub label: Option<String>,
    pub prefix: Option<String>,
    pub suffix: Option<String>,
    pub suppress_author: bool,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
pub enum Inline {
    Text {
        text: String,
        /// The names of the marks: em, strong, smallcaps, sup, sub, strike, link.
        /// A mark with attributes has them as its value; one without has `true`.
        #[serde(default)]
        marks: BTreeMap<String, serde_json::Value>,
    },
    Citation {
        items: Vec<CiteItem>,
        #[serde(default)]
        mode: CiteMode,
    },
    /// Mathematics in the line, in the notation of TeX.
    Math {
        tex: String,
    },
    /// Words that point to something that stands in the document: a figure,
    /// an equation, or a part of it. What they say is what the document
    /// calls what they point to.
    CrossRef {
        /// The id of the figure or the equation, or of the element the part
        /// was made from.
        target: String,
        #[serde(default)]
        form: RefForm,
    },
    Footnote {
        content: Vec<Inline>,
        /// Where the note stands, when it is not where the format has notes.
        #[serde(default, skip_serializing_if = "Option::is_none")]
        place: Option<NotePlace>,
    },
    Break,
    /// A reference mark: a verse of the Bible, a page of Stephanus, a
    /// number of Bekker. No part of the words; the format says how it is
    /// set (ADR 0039).
    RefMark {
        label: String,
    },
    /// What the writer said of one line by hand, where lines are numbered:
    /// it stands at the start of the line, first in its paragraph or right
    /// after a line break. A number or label given by hand, from which the
    /// count goes on; `counted: false` for a line the count passes over;
    /// `hidden` for one that is counted and never shows its number, `shown`
    /// for one that always does; words in the margin, the annotation; and
    /// the line's indent, for verse. No part of the words.
    #[serde(rename = "linemark")]
    LineMark {
        #[serde(default, skip_serializing_if = "Option::is_none")]
        number: Option<String>,
        #[serde(default = "yes", skip_serializing_if = "is_true")]
        counted: bool,
        #[serde(default, skip_serializing_if = "std::ops::Not::not")]
        hidden: bool,
        #[serde(default, skip_serializing_if = "std::ops::Not::not")]
        shown: bool,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        margin: Option<String>,
        #[serde(default, skip_serializing_if = "is_zero")]
        indent: u32,
    },
}

/// What words point by.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum RefForm {
    /// As it is called: "Figure 2", "(1)"; a part by its number, where the
    /// parts are numbered, and by its name where they are not.
    #[default]
    Full,
    /// By the number alone: "2", "1".
    Number,
    /// A part by its name.
    Name,
}

/// Where a note stands.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum NotePlace {
    /// At the foot of the page.
    Foot,
    /// At the end of the text.
    End,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum CiteMode {
    #[default]
    Normal,
    /// The author stands in the sentence: Nagy (1979).
    Intext,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum Block {
    /// A paragraph of a kind: text, a line of verse, a speaker, an item of
    /// a list, the heading of a scene, or a kind of the writer's own. `name`
    /// is the id of the kind (`formats/kinds.rs`), `text` where nothing is
    /// said. A paragraph is lines, parted by line breaks; what is said of
    /// one line by hand stands in a line mark at its start. `numbering`,
    /// `every`, `side` and `only` are the settings of the stretch it stands
    /// in: consecutive paragraphs with the same settings are numbered
    /// together, whatever their kinds. `new` begins a new run of its kind,
    /// where two runs of one kind stand together. See ADR 0041.
    Paragraph {
        #[serde(default = "text_kind")]
        name: String,
        /// Steps of indentation, of an item of a list or any paragraph indented.
        #[serde(default)]
        indent: u32,
        #[serde(default, skip_serializing_if = "Numbering::is_none")]
        numbering: Numbering,
        /// Every how many the numbers are shown; nothing for the layout's.
        #[serde(default, skip_serializing_if = "Option::is_none")]
        every: Option<u32>,
        /// The side the numbers stand on; nothing for the layout's.
        #[serde(default, skip_serializing_if = "Option::is_none")]
        side: Option<Side>,
        /// The one kind whose lines are counted, by its id; nothing for
        /// every kind that is counted.
        #[serde(default, skip_serializing_if = "Option::is_none")]
        only: Option<String>,
        /// Begins a new run of its kind.
        #[serde(default, skip_serializing_if = "std::ops::Not::not")]
        new: bool,
        content: Vec<Inline>,
    },
    /// A break of the page or of the column: what follows stands at the top
    /// of the next.
    Break { what: BreakKind },
    /// Two texts side by side: an original and its translation.
    Parallel { left: Vec<Block>, right: Vec<Block> },
    /// Mathematics on a line of its own, in the notation of TeX.
    Equation {
        /// By which words in the text point to it.
        #[serde(default)]
        id: String,
        tex: String,
        #[serde(default)]
        numbered: bool,
        /// Where it stands, when not where the format has equations.
        #[serde(default, skip_serializing_if = "Option::is_none")]
        align: Option<Stand>,
    },
    /// A table, with what is said of it.
    Table(Table),
    /// Figures, tables and equations that stand beside each other.
    Row { items: Vec<Block> },
    /// A picture, with what is said of it.
    Figure {
        /// By which words in the text point to it.
        #[serde(default)]
        id: String,
        /// The file, by the SHA-256 of what it holds.
        file: String,
        /// The kind of file: png, jpg, svg.
        #[serde(default)]
        extension: String,
        /// What the file was called, for saying which is meant.
        #[serde(default)]
        name: String,
        #[serde(default)]
        caption: Vec<Inline>,
        /// What the picture shows, in words, for those who do not see it.
        #[serde(default)]
        alt: String,
        /// In hundredths of the width of the text.
        #[serde(default = "full_width")]
        width: u8,
        #[serde(default = "yes")]
        numbered: bool,
        /// Where it stands, when not where the format has figures.
        #[serde(default, skip_serializing_if = "Option::is_none")]
        align: Option<Stand>,
        /// Whether the text flows around it, when not as the format says.
        #[serde(default, skip_serializing_if = "Option::is_none")]
        wrap: Option<bool>,
    },
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize, Serialize)]
#[serde(default)]
pub struct Table {
    /// By which words in the text point to it.
    pub id: String,
    pub caption: Vec<Inline>,
    pub rows: Vec<Vec<Cell>>,
    #[serde(default = "yes")]
    pub numbered: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub align: Option<Stand>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub wrap: Option<bool>,
    /// In hundredths of the width of the text; nought for as wide as it needs to be.
    pub width: u8,
}

/// A cell of a table.
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(default)]
pub struct Cell {
    pub content: Vec<Block>,
    pub colspan: u16,
    pub rowspan: u16,
    /// Whether it is a heading of its column or its row.
    pub header: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub align: Option<Stand>,
}

impl Default for Cell {
    fn default() -> Self {
        Cell { content: Vec::new(), colspan: 1, rowspan: 1, header: false, align: None }
    }
}

impl Table {
    /// How many columns the table has: the most cells a row of it spans.
    pub fn columns(&self) -> usize {
        self.rows.iter().map(|row| row.iter().map(|c| c.colspan.max(1) as usize).sum()).max().unwrap_or(0)
    }

    /// The share of the width of the text that each column has, where the
    /// columns are given widths: when the table has been given one, when it
    /// holds more than fits in the room it has, or when `told` says that
    /// they must be. Nothing, where each column is as wide as what it
    /// holds. `room` is the share of the width of the text the table may take.
    pub fn widths(&self, room: f64, told: bool) -> Vec<f64> {
        fn length(blocks: &[Block]) -> usize {
            let mut longest = 0usize;
            walk(blocks, &mut |_| {}, &mut |line| {
                let here: usize = line
                    .iter()
                    .map(|i| match i {
                        Inline::Text { text, .. } => text.chars().count(),
                        Inline::Math { tex } => tex.chars().count() / 2 + 1,
                        Inline::Citation { .. } => 14,
                        Inline::CrossRef { .. } => 8,
                        _ => 1,
                    })
                    .sum();
                longest = longest.max(here);
            });
            longest
        }
        let columns = self.columns();
        if columns == 0 {
            return Vec::new();
        }
        let mut longest = vec![0usize; columns];
        for row in &self.rows {
            let mut at = 0usize;
            for cell in row {
                let span = cell.colspan.max(1) as usize;
                if span == 1 && at < columns {
                    longest[at] = longest[at].max(length(&cell.content));
                }
                at += span;
            }
        }
        // About so many letters go on a line of a page.
        const LINE: f64 = 78.0;
        let room = room.clamp(0.1, 1.0);
        let needed: f64 = longest.iter().map(|l| (l + 3) as f64).sum::<f64>() / LINE;
        let whole = match self.width {
            0 if needed <= room && !told => return Vec::new(),
            // As wide as what it holds needs, and no wider than its room.
            0 => needed.clamp(0.05, room),
            w => (f64::from(w.min(100)) / 100.0).min(room),
        };
        // No column so narrow that a word does not fit, none so wide that the others have no room.
        let shares: Vec<f64> = longest.iter().map(|l| (*l).clamp(4, 60) as f64 + 3.0).collect();
        let sum: f64 = shares.iter().sum();
        shares.iter().map(|s| (s / sum * whole * 1000.0).round() / 1000.0).collect()
    }

    /// How many rows at the top are headings: those whose cells all are.
    pub fn heading_rows(&self) -> usize {
        let count = self.rows.iter().take_while(|row| !row.is_empty() && row.iter().all(|c| c.header)).count();
        // A table of nothing but headings has none.
        if count == self.rows.len() { 0 } else { count }
    }
}

fn full_width() -> u8 {
    100
}

fn yes() -> bool {
    true
}

fn is_true(b: &bool) -> bool {
    *b
}

fn is_zero(n: &u32) -> bool {
    *n == 0
}

/// What a break breaks: the page, or the column.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum BreakKind {
    #[default]
    Page,
    Column,
}

/// How a stretch numbers its lines: not at all, counted from the first
/// number given by hand, or only by the numbers given.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Numbering {
    #[default]
    None,
    Counted,
    Given,
}

impl Numbering {
    pub fn is_none(&self) -> bool {
        *self == Numbering::None
    }
}

/// The side of the text the numbers of a stretch stand on.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Side {
    #[default]
    Left,
    Right,
}

impl Side {
    /// The other side: where the words in the margin stand.
    pub fn other(self) -> Side {
        match self {
            Side::Left => Side::Right,
            Side::Right => Side::Left,
        }
    }

    pub fn name(self) -> &'static str {
        match self {
            Side::Left => "left",
            Side::Right => "right",
        }
    }
}

fn text_kind() -> String {
    "text".to_owned()
}

impl Block {
    /// A paragraph of text.
    pub fn paragraph(content: Vec<Inline>) -> Block {
        Block::of_kind("text", content)
    }

    /// A paragraph of a kind, not numbered.
    pub fn of_kind(name: &str, content: Vec<Inline>) -> Block {
        Block::Paragraph {
            name: name.to_owned(),
            indent: 0,
            numbering: Numbering::None,
            every: None,
            side: None,
            only: None,
            new: false,
            content,
        }
    }

    /// The same paragraph, numbered as said; any other block as it is.
    pub fn numbered(mut self, how: Numbering, step: Option<u32>, on: Option<Side>) -> Block {
        if let Block::Paragraph { numbering, every, side, .. } = &mut self {
            *numbering = how;
            *every = step;
            *side = on;
        }
        self
    }

    /// The same paragraph, counting the lines of one kind only.
    pub fn counting_only(mut self, kind: &str) -> Block {
        if let Block::Paragraph { only, .. } = &mut self {
            *only = Some(kind.to_owned());
        }
        self
    }

    /// The same paragraph, indented so many steps.
    pub fn indented(mut self, steps: u32) -> Block {
        if let Block::Paragraph { indent, .. } = &mut self {
            *indent = steps;
        }
        self
    }

    /// The same paragraph, beginning a new run of its kind.
    pub fn begins_run(mut self) -> Block {
        if let Block::Paragraph { new, .. } = &mut self {
            *new = true;
        }
        self
    }

    /// The text of a paragraph; nothing of any other block.
    pub fn paragraph_content(&self) -> Option<&[Inline]> {
        match self {
            Block::Paragraph { content, .. } => Some(content),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Section {
    /// 1 for the sections directly under the title. 0 for text that stands
    /// before the first section.
    pub level: u8,
    /// The heading, or nothing when the name of the element is not printed.
    pub heading: Option<Vec<Inline>>,
    pub blocks: Vec<Block>,
    /// The element the section was made from, for finding it again.
    pub element: Option<String>,
    /// The kind of element the section was made from, where it is a kind of
    /// the catalogue of parts (`templates/kinds.rs`): the first section of
    /// an element of such a kind, deeper down than the parts, is set by the
    /// kind's look at the level it stands at. See ADR 0038.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub kind: Option<String>,
}

/// An element of a matter or cover kind among the direct children of the
/// element printed, in tree order: its text at level 0, its children from
/// level 1. Placed as the template says (ADR 0038).
#[derive(Debug, Clone, Default, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Part {
    /// The id of a kind of the catalogue of parts.
    pub kind: String,
    /// The element the part was made from.
    pub element: Option<String>,
    /// The name of the element, which is the heading where the kind prints one.
    pub title: Vec<Inline>,
    pub sections: Vec<Section>,
}

impl Part {
    /// The blocks of the part, its own text and its children's, without
    /// their headings: for a part that is set as a whole, as the abstract is.
    pub fn blocks(&self) -> Vec<Block> {
        self.sections.iter().flat_map(|s| s.blocks.iter().cloned()).collect()
    }

    /// The first figure of the part, as `(hash, extension)`: the picture of a cover.
    pub fn first_figure(&self) -> Option<(String, String)> {
        let mut found = None;
        for s in &self.sections {
            walk(
                &s.blocks,
                &mut |b| {
                    if found.is_none()
                        && let Block::Figure { file, extension, .. } = b
                    {
                        found = Some((file.clone(), extension.trim_start_matches('.').to_ascii_lowercase()));
                    }
                },
                &mut |_| {},
            );
            if found.is_some() {
                break;
            }
        }
        found
    }
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Author {
    pub name: String,
    pub affiliation: Option<String>,
    pub email: Option<String>,
    pub orcid: Option<String>,
}

/// A reference as a project carries it.
#[derive(Debug, Clone, Default, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", default)]
pub struct CarriedReference {
    pub id: String,
    pub key: String,
    #[serde(rename = "type")]
    pub entry_type: String,
    pub fields: BTreeMap<String, String>,
    pub names: BTreeMap<String, Vec<Person>>,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Document {
    pub title: Vec<Inline>,
    pub subtitle: Option<String>,
    pub authors: Vec<Author>,
    pub date: Option<String>,
    pub keywords: Vec<String>,
    /// BCP 47: en-GB, nb, de, el.
    pub language: Option<String>,
    /// What the file formats carry as metadata beyond the above: isbn,
    /// edition, publisher, place, doi, and the like, by those names.
    #[serde(skip_serializing_if = "BTreeMap::is_empty")]
    pub identifiers: BTreeMap<String, String>,
    /// The elements of a matter or cover kind among the direct children of
    /// the element printed, in tree order. See ADR 0038.
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub parts: Vec<Part>,
    pub sections: Vec<Section>,
    /// The references the project carries for what is cited. The library's own
    /// entries are preferred to these where it has them.
    pub references: Vec<CarriedReference>,
    /// The kinds of paragraph and of words that are the writer's own, which
    /// the project carries, with what each is based on and how it differs.
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub kinds: Vec<OwnKind>,
    /// The layouts of the elements under the one printed that have a look
    /// of their own, each as that element uses it (ADR 0059): what holds
    /// for its stretch of the document.
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub looks: Vec<ElementLook>,
}

/// The layout an element under the one printed uses, with its changes
/// (ADR 0059): what holds for its stretch of the document.
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ElementLook {
    pub element: String,
    pub format: crate::formats::DocumentFormat,
}

impl Document {
    /// Readies the looks of the elements as the document's own layout is
    /// readied: within bounds, in the document's language.
    pub fn ready_looks(&mut self) {
        let language = self.language.clone();
        for look in &mut self.looks {
            look.format.readied(language.as_deref());
        }
    }
}

/// Goes through blocks and what they hold, in the order of the text: every
/// block is shown to `block`, and every line of text to `line`.
pub fn walk<'a>(list: &'a [Block], block: &mut dyn FnMut(&'a Block), line: &mut dyn FnMut(&'a [Inline])) {
    for b in list {
        block(b);
        match b {
            Block::Paragraph { content, .. } => line(content),
            Block::Parallel { left, right } => {
                walk(left, block, line);
                walk(right, block, line);
            }
            Block::Figure { caption, .. } => line(caption),
            Block::Equation { .. } | Block::Break { .. } => {}
            Block::Table(table) => {
                line(&table.caption);
                for row in &table.rows {
                    for cell in row {
                        walk(&cell.content, block, line);
                    }
                }
            }
            Block::Row { items } => walk(items, block, line),
        }
    }
}

impl Document {
    /// Goes through the document in the order of the text: the title, and
    /// of every section its heading and its blocks.
    pub fn walk<'a>(&'a self, block: &mut dyn FnMut(&'a Block), line: &mut dyn FnMut(&'a [Inline])) {
        line(&self.title);
        for s in self.all_sections() {
            if let Some(h) = &s.heading {
                line(h);
            }
            walk(&s.blocks, block, line);
        }
    }

    /// Every section, in the order of the text: those of the parts, then
    /// those of the body.
    pub fn all_sections(&self) -> impl Iterator<Item = &Section> {
        self.parts.iter().flat_map(|p| p.sections.iter()).chain(self.sections.iter())
    }

    /// Whether the text flows around something, where the format has
    /// figures and tables as `figures` and `tables` say; and whether there
    /// are tables.
    pub fn flows_and_tables(&self, figures: (Stand, bool), tables: (Stand, bool)) -> (bool, bool) {
        let mut flows = false;
        let mut has_tables = false;
        let around = |usual: (Stand, bool), align: Option<Stand>, wrap: Option<bool>| {
            wrap.unwrap_or(usual.1) && align.unwrap_or(usual.0) != Stand::Center
        };
        fn rows<'a>(list: &'a [Block], out: &mut Vec<&'a Block>) {
            // What stands in a row stands beside others, and nothing flows around it.
            for b in list {
                if let Block::Row { items } = b {
                    out.extend(items.iter());
                }
            }
        }
        let mut in_rows: Vec<&Block> = Vec::new();
        for s in self.all_sections() {
            rows(&s.blocks, &mut in_rows);
        }
        self.walk(
            &mut |b| match b {
                Block::Table(t) => {
                    has_tables = true;
                    if !in_rows.iter().any(|r| std::ptr::eq(*r, b)) {
                        flows |= around(tables, t.align, t.wrap);
                    }
                }
                Block::Figure { align, wrap, .. } if !in_rows.iter().any(|r| std::ptr::eq(*r, b)) => {
                    flows |= around(figures, *align, *wrap);
                }
                _ => {}
            },
            &mut |_| {},
        );
        (flows, has_tables)
    }

    /// The files of the figures, each once, as `(hash, extension)`.
    pub fn figure_files(&self) -> Vec<(String, String)> {
        let mut out: Vec<(String, String)> = Vec::new();
        self.walk(
            &mut |b| {
                if let Block::Figure { file, extension, .. } = b {
                    let one = (file.clone(), extension.trim_start_matches('.').to_ascii_lowercase());
                    if !out.contains(&one) {
                        out.push(one);
                    }
                }
            },
            &mut |_| {},
        );
        out
    }

    /// The places that notes have been set to, one for each note that has
    /// been set to a place, in the order of the text.
    pub fn placed_notes(&self) -> Vec<NotePlace> {
        let mut out = Vec::new();
        self.walk(&mut |_| {}, &mut |line| {
            for i in line {
                if let Inline::Footnote { place: Some(place), content } = i
                    && !content.is_empty()
                {
                    out.push(*place);
                }
            }
        });
        out
    }

    /// The ids of all works cited, each once, in the order of first citation.
    pub fn cited(&self) -> Vec<String> {
        fn inlines(list: &[Inline], out: &mut Vec<String>) {
            for i in list {
                match i {
                    Inline::Citation { items, .. } => {
                        for item in items {
                            if !out.contains(&item.id) {
                                out.push(item.id.clone());
                            }
                        }
                    }
                    Inline::Footnote { content, .. } => inlines(content, out),
                    _ => {}
                }
            }
        }
        let mut out: Vec<String> = Vec::new();
        self.walk(&mut |_| {}, &mut |line| inlines(line, &mut out));
        out
    }

    pub fn title_plain(&self) -> String {
        plain(&self.title)
    }
}

pub fn plain(inlines: &[Inline]) -> String {
    let mut out = String::new();
    for i in inlines {
        match i {
            Inline::Text { text, .. } => out.push_str(text),
            Inline::Break => out.push(' '),
            _ => {}
        }
    }
    out.split_whitespace().collect::<Vec<_>>().join(" ")
}

/// The little document that shows what a reference style does: one work
/// cited, the same at a page, another with words before it, two together, and
/// one with its author in the sentence.
pub(crate) mod fixtures_for_samples {
    use super::*;

    fn text(s: &str) -> Inline {
        Inline::Text { text: s.into(), marks: BTreeMap::new() }
    }

    fn cite(items: Vec<CiteItem>, mode: CiteMode) -> Block {
        Block::paragraph(vec![Inline::Citation { items, mode }])
    }

    fn item(id: &str) -> CiteItem {
        CiteItem { id: id.into(), ..Default::default() }
    }

    pub fn document(references: &[CarriedReference], language: Option<&str>) -> Document {
        let ids: Vec<&str> = references.iter().map(|r| r.id.as_str()).collect();
        let at = |i: usize| ids.get(i % ids.len().max(1)).copied().unwrap_or("");
        let mut blocks: Vec<Block> = Vec::new();
        if !ids.is_empty() {
            blocks.push(cite(vec![item(at(0))], CiteMode::Normal));
            blocks.push(cite(vec![CiteItem { locator: Some("45".into()), ..item(at(0)) }], CiteMode::Normal));
            blocks.push(cite(
                vec![CiteItem {
                    prefix: Some(term(language, "document-sample-see")),
                    locator: Some("12–14".into()),
                    ..item(at(1))
                }],
                CiteMode::Normal,
            ));
            blocks.push(cite(
                vec![CiteItem { locator: Some("3".into()), label: Some("chapter".into()), ..item(at(0)) }],
                CiteMode::Normal,
            ));
            if ids.len() > 2 {
                blocks.push(cite(vec![item(at(1)), item(at(2))], CiteMode::Normal));
            }
            blocks.push(Block::paragraph(vec![
                Inline::Citation { items: vec![item(at(ids.len().min(3) - 1))], mode: CiteMode::Intext },
                text(&format!(" {}", term(language, "document-sample-argues"))),
            ]));
            // The rest, so that the bibliography shows every kind of work given.
            for id in ids.iter().skip(3) {
                blocks.push(cite(vec![item(id)], CiteMode::Normal));
            }
        }
        Document {
            language: language.map(str::to_owned),
            // Each paragraph a section of its own, so that each can be found again.
            sections: blocks
                .into_iter()
                .map(|b| Section { level: 0, heading: None, blocks: vec![b], ..Default::default() })
                .collect(),
            references: references.to_vec(),
            ..Default::default()
        }
    }
}

#[cfg(test)]
pub(crate) mod fixtures {
    use super::*;

    pub fn text(s: &str) -> Inline {
        Inline::Text { text: s.into(), marks: BTreeMap::new() }
    }

    pub fn marked(s: &str, marks: &[&str]) -> Inline {
        Inline::Text {
            text: s.into(),
            marks: marks.iter().map(|m| ((*m).to_owned(), serde_json::Value::Bool(true))).collect(),
        }
    }

    pub fn cite(id: &str, locator: Option<&str>) -> Inline {
        Inline::Citation {
            items: vec![CiteItem { id: id.into(), locator: locator.map(Into::into), ..Default::default() }],
            mode: CiteMode::Normal,
        }
    }

    pub fn para(content: Vec<Inline>) -> Block {
        Block::paragraph(content)
    }

    /// A paragraph of a kind.
    pub fn kind(name: &str, content: Vec<Inline>) -> Block {
        Block::of_kind(name, content)
    }

    /// A line mark that says nothing; what it says is filled in after.
    pub fn mark() -> LineMarkSaid {
        LineMarkSaid::default()
    }

    /// What a line mark says, for building one in a test.
    #[derive(Default)]
    pub struct LineMarkSaid {
        pub number: Option<&'static str>,
        pub uncounted: bool,
        pub hidden: bool,
        pub shown: bool,
        pub margin: Option<&'static str>,
        pub indent: u32,
    }

    impl LineMarkSaid {
        pub fn number(self, n: &'static str) -> Self {
            LineMarkSaid { number: Some(n), ..self }
        }
        pub fn margin(self, m: &'static str) -> Self {
            LineMarkSaid { margin: Some(m), ..self }
        }
        pub fn indent(self, indent: u32) -> Self {
            LineMarkSaid { indent, ..self }
        }
        pub fn hidden(self) -> Self {
            LineMarkSaid { hidden: true, ..self }
        }
        pub fn uncounted(self) -> Self {
            LineMarkSaid { uncounted: true, ..self }
        }
        pub fn shown(self) -> Self {
            LineMarkSaid { shown: true, ..self }
        }
        pub fn done(self) -> Inline {
            Inline::LineMark {
                number: self.number.map(Into::into),
                counted: !self.uncounted,
                hidden: self.hidden,
                shown: self.shown,
                margin: self.margin.map(Into::into),
                indent: self.indent,
            }
        }
    }

    /// A paragraph of a kind whose lines are the words given, each line
    /// begun by the mark given with it, if any.
    pub fn lines(name: &str, lines: Vec<(Option<Inline>, &str)>) -> Block {
        let mut content = Vec::new();
        for (i, (mark, words)) in lines.into_iter().enumerate() {
            if i > 0 {
                content.push(Inline::Break);
            }
            content.extend(mark);
            if !words.is_empty() {
                content.push(text(words));
            }
        }
        Block::of_kind(name, content)
    }

    pub fn reference(id: &str, key: &str, src: &str) -> CarriedReference {
        let draft = crate::library::draft_from_source(src).unwrap();
        CarriedReference {
            id: id.into(),
            key: key.into(),
            entry_type: draft.entry_type,
            fields: draft.fields,
            names: draft.names,
        }
    }

    pub fn sample() -> Document {
        Document {
            title: vec![text("Wrath and the hero")],
            authors: vec![Author { name: "A. Scholar".into(), ..Default::default() }],
            language: Some("en-GB".into()),
            sections: vec![
                Section {
                    level: 0,
                    heading: None,
                    blocks: vec![para(vec![text("Before the first section.")])],
                    ..Default::default()
                },
                Section {
                    level: 1,
                    heading: Some(vec![text("The word "), marked("mênis", &["em"])]),
                    blocks: vec![
                        para(vec![
                            text("A wrath that is *more* than anger "),
                            cite("r1", Some("73")),
                            text(". It belongs to gods."),
                            Inline::Footnote {
                                content: vec![text("So the scholia; "), cite("r2", None), text(".")],
                                place: None,
                            },
                        ]),
                        kind("quote", vec![text("Sing, goddess, the wrath.")]),
                    ],
                    element: Some("e1".into()),
                    kind: None,
                },
            ],
            references: vec![
                reference(
                    "r1",
                    "nagy1979",
                    "@book{nagy1979, author={Nagy, Gregory}, title={The Best of the {Achaeans}}, publisher={Johns Hopkins University Press}, location={Baltimore}, date={1979}}",
                ),
                reference(
                    "r2",
                    "west1988",
                    "@article{west1988, author={West, M. L.}, title={The Rise of the {Greek} Epic}, journaltitle={Journal of Hellenic Studies}, volume={108}, date={1988}, pages={151--172}}",
                ),
            ],
            ..Default::default()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_what_the_interface_sends() {
        let json = r#"{
          "title": [{"kind":"text","text":"Wrath","marks":{}}],
          "authors": [{"name":"A. Scholar","affiliation":"Oslo"}],
          "abstract": "Short.",
          "language": "nb",
          "identifiers": {"isbn": "978-0-00-000000-0"},
          "parts": [{"kind":"dedication","element":"d","title":[{"kind":"text","text":"Dedication","marks":{}}],
                     "sections":[{"level":0,"heading":null,"blocks":[],"element":"d","kind":"dedication"}]}],
          "sections": [
            {"level":1,"heading":[{"kind":"text","text":"One","marks":{"em":true}}],
             "blocks":[
               {"kind":"paragraph","content":[
                 {"kind":"text","text":"See ","marks":{"link":{"href":"https://example.org"}}},
                 {"kind":"citation","items":[{"id":"r1","locator":"45","label":"chapter","suppressAuthor":true}],"mode":"intext"},
                 {"kind":"footnote","content":[{"kind":"text","text":"n","marks":{}}]},
                 {"kind":"break"}]},
               {"kind":"paragraph","name":"speaker","numbering":"counted","every":5,"side":"right","content":[{"kind":"text","text":"Nurse","marks":{}}]},
               {"kind":"paragraph","name":"line","indent":0,"numbering":"counted","every":5,"side":"right","new":true,"content":[
                 {"kind":"linemark","number":"45","counted":false,"hidden":true,"margin":"ia.","indent":1},
                 {"kind":"text","text":"If only","marks":{}},
                 {"kind":"break"},
                 {"kind":"linemark"},
                 {"kind":"text","text":"the Argo","marks":{}}]},
               {"kind":"break","what":"column"}
             ]}
          ],
          "references": [{"id":"r1","key":"k","type":"book","fields":{"title":"T"},"names":{"author":[{"family":"F","given":"G"}]}}]
        }"#;
        let doc: Document = serde_json::from_str(json).unwrap();
        // The abstract is an element now; a request of before is read without it.
        assert_eq!(doc.identifiers["isbn"], "978-0-00-000000-0");
        assert_eq!(doc.parts[0].kind, "dedication");
        assert_eq!(doc.parts[0].sections[0].kind.as_deref(), Some("dedication"));
        assert_eq!(doc.sections[0].kind, None);
        assert_eq!(doc.cited(), vec!["r1"]);
        match &doc.sections[0].blocks[0] {
            Block::Paragraph { content, .. } => match &content[1] {
                Inline::Citation { items, mode } => {
                    assert_eq!(*mode, CiteMode::Intext);
                    assert!(items[0].suppress_author);
                    assert_eq!(items[0].label.as_deref(), Some("chapter"));
                }
                other => panic!("{other:?}"),
            },
            other => panic!("{other:?}"),
        }
        let Block::Paragraph { name, indent, numbering, new, .. } = &doc.sections[0].blocks[0] else { panic!() };
        assert_eq!(
            (name.as_str(), *indent, *numbering, *new),
            ("text", 0, Numbering::None, false),
            "a paragraph is text unless it says otherwise"
        );
        let Block::Paragraph { name, numbering, every, side, .. } = &doc.sections[0].blocks[1] else { panic!() };
        assert_eq!(
            (name.as_str(), *numbering, *every, *side),
            ("speaker", Numbering::Counted, Some(5), Some(Side::Right))
        );
        let Block::Paragraph { name, new, content, .. } = &doc.sections[0].blocks[2] else { panic!() };
        assert_eq!((name.as_str(), *new), ("line", true));
        assert_eq!(
            content[0],
            Inline::LineMark {
                number: Some("45".into()),
                counted: false,
                hidden: true,
                shown: false,
                margin: Some("ia.".into()),
                indent: 1
            }
        );
        assert_eq!(
            content[3],
            Inline::LineMark { number: None, counted: true, hidden: false, shown: false, margin: None, indent: 0 },
            "a mark that says nothing is counted"
        );
        assert_eq!(doc.sections[0].blocks[3], Block::Break { what: BreakKind::Column });
        // Written again, each says what it says and nothing more, as it was sent.
        let json = serde_json::to_string(&Block::paragraph(vec![])).unwrap();
        assert_eq!(json, r#"{"kind":"paragraph","name":"text","indent":0,"content":[]}"#);
        let json = serde_json::to_string(&doc.sections[0].blocks[2]).unwrap();
        assert!(
            json.starts_with(
                r#"{"kind":"paragraph","name":"line","indent":0,"numbering":"counted","every":5,"side":"right","new":true,"content":[{"kind":"linemark","number":"45","counted":false,"hidden":true,"margin":"ia.","indent":1},"#
            ),
            "{json}"
        );
        assert!(json.contains(r#"{"kind":"break"},{"kind":"linemark"},"#), "{json}");
        assert_eq!(serde_json::to_string(&doc.sections[0].blocks[3]).unwrap(), r#"{"kind":"break","what":"column"}"#);
        // A passage, which is no more, is not read.
        assert!(serde_json::from_str::<Block>(r#"{"kind":"passage","family":"verse","content":[]}"#).is_err());
    }

    #[test]
    fn works_cited_in_order_and_once() {
        assert_eq!(fixtures::sample().cited(), vec!["r1", "r2"]);
    }
}
