//! A document as the interface hands it over for preview and export.
//!
//! The interface walks the map: it follows the hierarchy, leaves out what is
//! excluded or loose, puts included maps in their place, and works out the
//! level of each heading. What arrives here is the document in order, as
//! sections of blocks. The shapes are those of `src/lib/project/model/text.ts`.

pub mod bibliography;
pub mod pandoc;

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use crate::bib::names::Person;

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
    Footnote {
        content: Vec<Inline>,
        /// Where the note stands, when it is not where the format has notes.
        #[serde(default, skip_serializing_if = "Option::is_none")]
        place: Option<NotePlace>,
    },
    Break,
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

impl Document {
    /// The places that notes have been set to, one for each note that has
    /// been set to a place, in the order of the text.
    pub fn placed_notes(&self) -> Vec<NotePlace> {
        fn inlines(list: &[Inline], out: &mut Vec<NotePlace>) {
            for i in list {
                if let Inline::Footnote { place: Some(place), content } = i
                    && !content.is_empty()
                {
                    out.push(*place);
                }
            }
        }
        fn blocks(list: &[Block], out: &mut Vec<NotePlace>) {
            for b in list {
                match b {
                    Block::Paragraph { content } => inlines(content, out),
                    Block::Blockquote { content } => blocks(content, out),
                    Block::BulletList { items } | Block::OrderedList { items, .. } => {
                        for item in items {
                            blocks(item, out);
                        }
                    }
                }
            }
        }
        let mut out = Vec::new();
        inlines(&self.title, &mut out);
        for s in &self.sections {
            if let Some(h) = &s.heading {
                inlines(h, &mut out);
            }
            blocks(&s.blocks, &mut out);
        }
        out
    }

    /// The ids of all works cited, each once, in the order of first citation.
    pub fn cited(&self) -> Vec<String> {
        let mut out: Vec<String> = Vec::new();
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
        fn blocks(list: &[Block], out: &mut Vec<String>) {
            for b in list {
                match b {
                    Block::Paragraph { content } => inlines(content, out),
                    Block::Blockquote { content } => blocks(content, out),
                    Block::BulletList { items } | Block::OrderedList { items, .. } => {
                        for item in items {
                            blocks(item, out);
                        }
                    }
                }
            }
        }
        inlines(&self.title, &mut out);
        for s in &self.sections {
            if let Some(h) = &s.heading {
                inlines(h, &mut out);
            }
            blocks(&s.blocks, &mut out);
        }
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
