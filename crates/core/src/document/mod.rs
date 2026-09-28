//! A document as the interface hands it over for preview and export.
//!
//! The interface walks the map: it follows the hierarchy, leaves out what is
//! excluded or loose, puts included maps in their place, and works out the
//! level of each heading. What arrives here is the document in order, as
//! sections of blocks. The shapes are those of `src/lib/project/model/text.ts`.

pub mod bibliography;
pub mod pandoc;
mod placing;

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use crate::bib::names::Person;
use crate::formats::Stand;

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
    Paragraph {
        content: Vec<Inline>,
    },
    Blockquote {
        content: Vec<Block>,
    },
    BulletList {
        items: Vec<Vec<Block>>,
    },
    OrderedList {
        #[serde(default = "one")]
        start: u32,
        items: Vec<Vec<Block>>,
    },
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
    Row {
        items: Vec<Block>,
    },
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

fn one() -> u32 {
    1
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
    #[serde(rename = "abstract")]
    pub abstract_text: Option<String>,
    pub keywords: Vec<String>,
    /// BCP 47: en-GB, nb, de, el.
    pub language: Option<String>,
    pub sections: Vec<Section>,
    /// The references the project carries for what is cited. The library's own
    /// entries are preferred to these where it has them.
    pub references: Vec<CarriedReference>,
}

/// Goes through blocks and what they hold, in the order of the text: every
/// block is shown to `block`, and every line of text to `line`.
pub fn walk<'a>(list: &'a [Block], block: &mut dyn FnMut(&'a Block), line: &mut dyn FnMut(&'a [Inline])) {
    for b in list {
        block(b);
        match b {
            Block::Paragraph { content } => line(content),
            Block::Blockquote { content } => walk(content, block, line),
            Block::BulletList { items } | Block::OrderedList { items, .. } => {
                for item in items {
                    walk(item, block, line);
                }
            }
            Block::Figure { caption, .. } => line(caption),
            Block::Equation { .. } => {}
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
        for s in &self.sections {
            if let Some(h) = &s.heading {
                line(h);
            }
            walk(&s.blocks, block, line);
        }
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
        for s in &self.sections {
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
        Block::Paragraph { content: vec![Inline::Citation { items, mode }] }
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
                vec![CiteItem { prefix: Some("see".into()), locator: Some("12–14".into()), ..item(at(1)) }],
                CiteMode::Normal,
            ));
            blocks.push(cite(
                vec![CiteItem { locator: Some("3".into()), label: Some("chapter".into()), ..item(at(0)) }],
                CiteMode::Normal,
            ));
            if ids.len() > 2 {
                blocks.push(cite(vec![item(at(1)), item(at(2))], CiteMode::Normal));
            }
            blocks.push(Block::Paragraph {
                content: vec![
                    Inline::Citation { items: vec![item(at(ids.len().min(3) - 1))], mode: CiteMode::Intext },
                    text(" argues otherwise."),
                ],
            });
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
                .map(|b| Section { level: 0, heading: None, blocks: vec![b], element: None })
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
        Block::Paragraph { content }
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
                    element: None,
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
                        Block::Blockquote { content: vec![para(vec![text("Sing, goddess, the wrath.")])] },
                    ],
                    element: Some("e1".into()),
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
          "sections": [
            {"level":1,"heading":[{"kind":"text","text":"One","marks":{"em":true}}],
             "blocks":[
               {"kind":"paragraph","content":[
                 {"kind":"text","text":"See ","marks":{"link":{"href":"https://example.org"}}},
                 {"kind":"citation","items":[{"id":"r1","locator":"45","label":"chapter","suppressAuthor":true}],"mode":"intext"},
                 {"kind":"footnote","content":[{"kind":"text","text":"n","marks":{}}]},
                 {"kind":"break"}]},
               {"kind":"ordered_list","start":3,"items":[[{"kind":"paragraph","content":[]}]]},
               {"kind":"bullet_list","items":[]},
               {"kind":"blockquote","content":[]}
             ]}
          ],
          "references": [{"id":"r1","key":"k","type":"book","fields":{"title":"T"},"names":{"author":[{"family":"F","given":"G"}]}}]
        }"#;
        let doc: Document = serde_json::from_str(json).unwrap();
        assert_eq!(doc.abstract_text.as_deref(), Some("Short."));
        assert_eq!(doc.cited(), vec!["r1"]);
        match &doc.sections[0].blocks[0] {
            Block::Paragraph { content } => match &content[1] {
                Inline::Citation { items, mode } => {
                    assert_eq!(*mode, CiteMode::Intext);
                    assert!(items[0].suppress_author);
                    assert_eq!(items[0].label.as_deref(), Some("chapter"));
                }
                other => panic!("{other:?}"),
            },
            other => panic!("{other:?}"),
        }
        assert!(matches!(doc.sections[0].blocks[1], Block::OrderedList { start: 3, .. }));
    }

    #[test]
    fn works_cited_in_order_and_once() {
        assert_eq!(fixtures::sample().cited(), vec!["r1", "r2"]);
    }
}
