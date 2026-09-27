//! A document as Pandoc's own JSON, which Pandoc reads without any guessing.
//!
//! Markdown would have to be escaped; this cannot be misread. Pandoc makes
//! every output from it, the readable Markdown copies included.

use std::collections::HashMap;
use std::sync::OnceLock;

use serde_json::{Value, json};

use super::{Block, CiteItem, CiteMode, Document, Inline, Section};

const TERMS_JSON: &str = include_str!("../../../../resources/csl/locator-terms.json");

type Terms = HashMap<String, HashMap<String, HashMap<String, [String; 2]>>>;

fn terms() -> &'static Terms {
    static TERMS: OnceLock<Terms> = OnceLock::new();
    TERMS.get_or_init(|| serde_json::from_str(TERMS_JSON).expect("the bundled locator terms are valid"))
}

/// The locale whose words Pandoc will expect, for a language tag.
pub fn locale_for(language: Option<&str>) -> &'static str {
    let lang = language.unwrap_or("en-US").trim();
    let all = terms();
    let find = |name: &str| all.keys().find(|k| k.eq_ignore_ascii_case(name)).map(String::as_str);
    if let Some(exact) = find(lang) {
        return exact;
    }
    let primary = lang.split(['-', '_']).next().unwrap_or("en").to_ascii_lowercase();
    // The variant that stands for the language as a whole.
    let usual = match primary.as_str() {
        "en" => "en-US",
        "de" => "de-DE",
        "fr" => "fr-FR",
        "es" => "es-ES",
        "pt" => "pt-PT",
        "zh" => "zh-CN",
        "sr" => "sr-Latn-RS",
        "no" => "nb-NO",
        _ => "",
    };
    if let Some(found) = find(usual) {
        return found;
    }
    let mut candidates: Vec<&str> = all
        .keys()
        .filter(|k| k.split('-').next().is_some_and(|p| p.eq_ignore_ascii_case(&primary)))
        .map(String::as_str)
        .collect();
    candidates.sort_unstable();
    candidates.first().copied().or_else(|| find("en-US")).unwrap_or("en-US")
}

/// The locator of a citation as Pandoc wants it: in braces, which says that
/// this and nothing else is the locator, and with the word for its kind in
/// the language of the document, by which Pandoc knows the kind. Where Pandoc
/// does not know the word, it prints the locator as it stands, which still
/// reads rightly.
pub fn locator_token(item: &CiteItem, language: Option<&str>) -> Option<String> {
    let locator = item.locator.as_deref()?.trim();
    if locator.is_empty() {
        return None;
    }
    // Braces inside would end the locator early.
    let locator = locator.replace(['{', '}'], "");
    // The kind is always said, pages too: a style that prints "p." must know
    // that pages are meant.
    let label = item.label.as_deref().filter(|l| !l.is_empty()).unwrap_or("page");
    let word = |locale: &str| -> Option<String> {
        let forms = terms().get(locale)?.get(label)?;
        // The long form, in the singular: it is the same in every version of
        // the locales, and Pandoc tells by the locator itself whether one
        // place is meant or several.
        let w = &forms.get("long").or_else(|| forms.get("short"))?[0];
        (!w.is_empty()).then(|| w.clone())
    };
    match word(locale_for(language)).or_else(|| word("en-US")) {
        Some(w) => Some(format!("{{{w} {locator}}}")),
        None => Some(format!("{{{locator}}}")),
    }
}

/// Text as Pandoc's tokens: words, and the spaces between them.
fn tokens(text: &str, out: &mut Vec<Value>) {
    let mut word = String::new();
    for c in text.chars() {
        // A non-breaking space belongs to the word.
        if c == ' ' || c == '\t' || c == '\n' || c == '\r' {
            if !word.is_empty() {
                out.push(json!({"t": "Str", "c": std::mem::take(&mut word)}));
            }
            if !matches!(out.last(), Some(v) if v["t"] == "Space") {
                out.push(json!({"t": "Space"}));
            }
        } else {
            word.push(c);
        }
    }
    if !word.is_empty() {
        out.push(json!({"t": "Str", "c": word}));
    }
}

fn attr() -> Value {
    json!(["", [], []])
}

/// A level of heading that runs into the text that follows it, and its form.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RunIn {
    pub level: u8,
    pub bold: bool,
    pub italic: bool,
}

pub struct Converter<'a> {
    /// From the id of a reference to its key in the bibliography.
    pub keys: &'a HashMap<String, String>,
    pub language: Option<&'a str>,
    /// Levels of heading that run into the text that follows them.
    pub run_in: Vec<RunIn>,
    /// Headings deeper than this are printed at this level.
    pub deepest: u8,
}

impl Converter<'_> {
    fn citation(&self, items: &[CiteItem], mode: CiteMode) -> Option<Value> {
        let mut citations = Vec::new();
        for (i, item) in items.iter().enumerate() {
            let Some(key) = self.keys.get(&item.id) else { continue };
            let mut prefix = Vec::new();
            if let Some(p) = item.prefix.as_deref().filter(|p| !p.trim().is_empty()) {
                tokens(p.trim(), &mut prefix);
            }
            let mut suffix = Vec::new();
            let locator = locator_token(item, self.language);
            let after = item.suffix.as_deref().map(str::trim).filter(|s| !s.is_empty());
            if locator.is_some() || after.is_some() {
                suffix.push(json!({"t": "Str", "c": ","}));
                suffix.push(json!({"t": "Space"}));
            }
            if let Some(l) = locator {
                suffix.push(json!({"t": "Str", "c": l}));
                if after.is_some() {
                    suffix.push(json!({"t": "Space"}));
                }
            }
            if let Some(s) = after {
                tokens(s, &mut suffix);
            }
            let how = if i == 0 && mode == CiteMode::Intext {
                "AuthorInText"
            } else if item.suppress_author {
                "SuppressAuthor"
            } else {
                "NormalCitation"
            };
            citations.push(json!({
                "citationId": key,
                "citationPrefix": prefix,
                "citationSuffix": suffix,
                "citationMode": {"t": how},
                "citationNoteNum": 0,
                "citationHash": 0,
            }));
        }
        if citations.is_empty() {
            return None;
        }
        Some(json!({"t": "Cite", "c": [citations, []]}))
    }

    pub fn inlines(&self, list: &[Inline]) -> Vec<Value> {
        let mut out = Vec::new();
        for inline in list {
            match inline {
                Inline::Text { text, marks } => {
                    let mut inner = Vec::new();
                    tokens(text, &mut inner);
                    if inner.is_empty() {
                        continue;
                    }
                    // Spaces at the ends stay outside the marks, where every format wants them.
                    let lead = matches!(inner.first(), Some(v) if v["t"] == "Space");
                    let trail = inner.len() > 1 && matches!(inner.last(), Some(v) if v["t"] == "Space");
                    if !marks.is_empty() && (lead || trail) {
                        if lead {
                            inner.remove(0);
                            out.push(json!({"t": "Space"}));
                        }
                        if trail {
                            inner.pop();
                        }
                    }
                    let wrapped = if inner.is_empty() { Vec::new() } else { wrap(inner, marks) };
                    out.extend(wrapped);
                    if !marks.is_empty() && trail {
                        out.push(json!({"t": "Space"}));
                    }
                }
                Inline::Citation { items, mode } => match self.citation(items, *mode) {
                    Some(c) => out.push(c),
                    None => out.push(json!({"t": "Strong", "c": [{"t": "Str", "c": "[reference not found]"}]})),
                },
                Inline::Footnote { content } => {
                    let inner = self.inlines(content);
                    if !inner.is_empty() {
                        out.push(json!({"t": "Note", "c": [{"t": "Para", "c": inner}]}));
                    }
                }
                Inline::Break => out.push(json!({"t": "LineBreak"})),
            }
        }
        out
    }

    pub fn blocks(&self, list: &[Block], out: &mut Vec<Value>) {
        for block in list {
            match block {
                Block::Paragraph { content } => {
                    let inner = self.inlines(content);
                    if !inner.is_empty() {
                        out.push(json!({"t": "Para", "c": inner}));
                    }
                }
                Block::Blockquote { content } => {
                    let mut inner = Vec::new();
                    self.blocks(content, &mut inner);
                    if !inner.is_empty() {
                        out.push(json!({"t": "BlockQuote", "c": inner}));
                    }
                }
                Block::BulletList { items } => {
                    let list = self.items(items);
                    if !list.is_empty() {
                        out.push(json!({"t": "BulletList", "c": list}));
                    }
                }
                Block::OrderedList { start, items } => {
                    let list = self.items(items);
                    if !list.is_empty() {
                        out.push(json!({
                            "t": "OrderedList",
                            "c": [[start, {"t": "Decimal"}, {"t": "Period"}], list],
                        }));
                    }
                }
            }
        }
    }

    fn items(&self, items: &[Vec<Block>]) -> Vec<Value> {
        items
            .iter()
            .map(|item| {
                let mut inner = Vec::new();
                self.blocks(item, &mut inner);
                if inner.is_empty() {
                    inner.push(json!({"t": "Plain", "c": []}));
                }
                Value::Array(inner)
            })
            .collect()
    }

    fn section(&self, section: &Section, out: &mut Vec<Value>) {
        let heading = section.heading.as_ref().map(|h| self.inlines(h)).filter(|h| !h.is_empty());
        let level = section.level.clamp(1, self.deepest.max(1));
        let mut body = Vec::new();
        self.blocks(&section.blocks, &mut body);

        let run_in = self.run_in.iter().find(|r| r.level == level).copied();
        match (heading, run_in) {
            (Some(mut h), Some(form)) if section.level > 0 => {
                // The heading begins the first paragraph, in bold, and ends with a full stop.
                let ends = matches!(h.last(), Some(v) if v["t"] == "Str"
                    && v["c"].as_str().is_some_and(|s| s.ends_with(['.', '?', '!', ':'])));
                if !ends {
                    h.push(json!({"t": "Str", "c": "."}));
                }
                // Formats that know nothing of classes must show the heading too.
                if form.italic {
                    h = vec![json!({"t": "Emph", "c": h})];
                }
                if form.bold {
                    h = vec![json!({"t": "Strong", "c": h})];
                }
                let lead = json!({"t": "Span", "c": [["", ["run-in", format!("run-in-{level}")], []], h]});
                match body.first_mut() {
                    Some(first) if first["t"] == "Para" => {
                        let content = first["c"].as_array_mut().expect("a paragraph has content");
                        content.insert(0, json!({"t": "Space"}));
                        content.insert(0, lead);
                    }
                    _ => body.insert(0, json!({"t": "Para", "c": [lead]})),
                }
            }
            (Some(h), None) if section.level > 0 => {
                out.push(json!({"t": "Header", "c": [level, attr(), h]}));
            }
            _ => {}
        }
        out.extend(body);
    }

    pub fn document(&self, doc: &Document, api_version: &[u32], meta: serde_json::Map<String, Value>) -> Value {
        let mut blocks = Vec::new();
        for s in &doc.sections {
            self.section(s, &mut blocks);
        }
        json!({
            "pandoc-api-version": api_version,
            "meta": meta,
            "blocks": blocks,
        })
    }
}

fn wrap(inner: Vec<Value>, marks: &std::collections::BTreeMap<String, Value>) -> Vec<Value> {
    let mut current = inner;
    // From the innermost outwards. The order is fixed, so that the same marks
    // always nest the same way.
    for name in ["sub", "sup", "smallcaps", "strike", "strong", "em", "link"] {
        let Some(value) = marks.get(name) else { continue };
        if value.is_null() || value == &Value::Bool(false) {
            continue;
        }
        let node = match name {
            "em" => json!({"t": "Emph", "c": current}),
            "strong" => json!({"t": "Strong", "c": current}),
            "strike" => json!({"t": "Strikeout", "c": current}),
            "sup" => json!({"t": "Superscript", "c": current}),
            "sub" => json!({"t": "Subscript", "c": current}),
            "smallcaps" => json!({"t": "SmallCaps", "c": current}),
            "link" => {
                let href = value.get("href").and_then(Value::as_str).unwrap_or("");
                if href.is_empty() {
                    current = vec![json!({"t": "Span", "c": [attr(), current]})];
                    continue;
                }
                json!({"t": "Link", "c": [attr(), current, [href, ""]]})
            }
            _ => unreachable!(),
        };
        current = vec![node];
    }
    current
}

pub fn meta_inlines(inlines: Vec<Value>) -> Value {
    json!({"t": "MetaInlines", "c": inlines})
}

pub fn meta_text(text: &str) -> Value {
    let mut out = Vec::new();
    tokens(text, &mut out);
    meta_inlines(out)
}

pub fn meta_string(text: &str) -> Value {
    json!({"t": "MetaString", "c": text})
}

pub fn meta_bool(value: bool) -> Value {
    json!({"t": "MetaBool", "c": value})
}

pub fn meta_list(items: Vec<Value>) -> Value {
    json!({"t": "MetaList", "c": items})
}

/// Several paragraphs of plain text, as the abstract is.
pub fn meta_blocks(text: &str) -> Value {
    let paragraphs: Vec<Value> = text
        .split("\n\n")
        .flat_map(|p| p.split('\n'))
        .map(str::trim)
        .filter(|p| !p.is_empty())
        .map(|p| {
            let mut inner = Vec::new();
            tokens(p, &mut inner);
            json!({"t": "Para", "c": inner})
        })
        .collect();
    json!({"t": "MetaBlocks", "c": paragraphs})
}

#[cfg(test)]
mod tests {
    use super::super::fixtures::*;
    use super::*;

    fn converter(keys: &HashMap<String, String>) -> Converter<'_> {
        Converter { keys, language: Some("en-GB"), run_in: vec![], deepest: 6 }
    }

    #[test]
    fn locales() {
        assert_eq!(locale_for(Some("nb")), "nb-NO");
        assert_eq!(locale_for(Some("no")), "nb-NO");
        assert_eq!(locale_for(Some("en")), "en-US");
        assert_eq!(locale_for(Some("en-GB")), "en-GB");
        assert_eq!(locale_for(Some("de-AT")), "de-AT");
        assert_eq!(locale_for(Some("el")), "el-GR");
        assert_eq!(locale_for(Some("xx")), "en-US");
        assert_eq!(locale_for(None), "en-US");
    }

    #[test]
    fn locators() {
        let item = |locator: &str, label: Option<&str>| CiteItem {
            id: "r".into(),
            locator: Some(locator.into()),
            label: label.map(Into::into),
            ..Default::default()
        };
        assert_eq!(locator_token(&item("45", None), None).unwrap(), "{page 45}");
        assert_eq!(locator_token(&item("45–67", Some("page")), Some("nb")).unwrap(), "{side 45–67}");
        assert_eq!(locator_token(&item("3", Some("chapter")), Some("en-GB")).unwrap(), "{chapter 3}");
        assert_eq!(locator_token(&item("3", Some("chapter")), Some("nb")).unwrap(), "{kapittel 3}");
        assert_eq!(locator_token(&item("12–14", Some("line")), Some("de")).unwrap(), "{Zeile 12–14}");
        assert_eq!(locator_token(&item("mênis", Some("sub-verbo")), None).unwrap(), "{sub verbo mênis}");
        assert_eq!(locator_token(&item("a{b}", None), None).unwrap(), "{page ab}");
        assert_eq!(locator_token(&item("  ", None), None), None);
    }

    #[test]
    fn text_becomes_words_and_spaces() {
        let keys = HashMap::new();
        let c = converter(&keys);
        let out = c.inlines(&[text("A  wrath\u{a0}of *gods* "), marked(" and men ", &["em", "strong"]), text("!")]);
        assert_eq!(
            Value::Array(out),
            json!([
                {"t":"Str","c":"A"},{"t":"Space"},{"t":"Str","c":"wrath\u{a0}of"},{"t":"Space"},
                {"t":"Str","c":"*gods*"},{"t":"Space"},
                {"t":"Space"},
                {"t":"Emph","c":[{"t":"Strong","c":[{"t":"Str","c":"and"},{"t":"Space"},{"t":"Str","c":"men"}]}]},
                {"t":"Space"},
                {"t":"Str","c":"!"}
            ])
        );
    }

    #[test]
    fn citations() {
        let keys: HashMap<String, String> = [("r1".to_owned(), "nagy1979".to_owned())].into();
        let c = converter(&keys);
        let items = vec![
            CiteItem {
                id: "r1".into(),
                locator: Some("3".into()),
                label: Some("chapter".into()),
                prefix: Some("see".into()),
                suffix: Some("and passim".into()),
                suppress_author: false,
            },
            CiteItem { id: "unknown".into(), ..Default::default() },
        ];
        let out = c.citation(&items, CiteMode::Normal).unwrap();
        assert_eq!(out["c"][0].as_array().unwrap().len(), 1);
        let first = &out["c"][0][0];
        assert_eq!(first["citationId"], "nagy1979");
        assert_eq!(first["citationPrefix"], json!([{"t":"Str","c":"see"}]));
        assert_eq!(
            first["citationSuffix"],
            json!([{"t":"Str","c":","},{"t":"Space"},{"t":"Str","c":"{chapter 3}"},{"t":"Space"},
                   {"t":"Str","c":"and"},{"t":"Space"},{"t":"Str","c":"passim"}])
        );
        assert_eq!(first["citationMode"]["t"], "NormalCitation");

        let intext = c.citation(&[CiteItem { id: "r1".into(), ..Default::default() }], CiteMode::Intext).unwrap();
        assert_eq!(intext["c"][0][0]["citationMode"]["t"], "AuthorInText");
        assert_eq!(intext["c"][0][0]["citationSuffix"], json!([]));

        // A citation of which nothing is found says so in the text.
        let none = c.inlines(&[cite("unknown", None)]);
        assert_eq!(none[0]["t"], "Strong");
    }

    #[test]
    fn headings_that_run_in() {
        let keys = HashMap::new();
        let mut c = converter(&keys);
        c.run_in = vec![RunIn { level: 3, bold: true, italic: false }];
        c.deepest = 3;
        let doc = Document {
            sections: vec![
                Section {
                    level: 1,
                    heading: Some(vec![text("One")]),
                    blocks: vec![para(vec![text("Text.")])],
                    element: None,
                },
                Section {
                    level: 3,
                    heading: Some(vec![text("Deep")]),
                    blocks: vec![para(vec![text("More.")])],
                    element: None,
                },
                Section { level: 5, heading: Some(vec![text("Deeper?")]), blocks: vec![], element: None },
                Section { level: 2, heading: None, blocks: vec![para(vec![text("No heading.")])], element: None },
            ],
            ..Default::default()
        };
        let out = c.document(&doc, &[1, 23, 1], serde_json::Map::new());
        let blocks = out["blocks"].as_array().unwrap();
        assert_eq!(blocks[0]["t"], "Header");
        assert_eq!(blocks[0]["c"][0], 1);
        assert_eq!(blocks[2]["t"], "Para");
        assert_eq!(blocks[2]["c"][0]["t"], "Span");
        assert_eq!(blocks[2]["c"][0]["c"][1], json!([{"t":"Strong","c":[{"t":"Str","c":"Deep"},{"t":"Str","c":"."}]}]));
        assert_eq!(blocks[2]["c"][2], json!({"t":"Str","c":"More."}));
        // Deeper than the deepest: at the deepest, which here runs in, alone in its paragraph.
        assert_eq!(blocks[3]["c"][0]["c"][1], json!([{"t":"Strong","c":[{"t":"Str","c":"Deeper?"}]}]));
        assert_eq!(blocks[4], json!({"t":"Para","c":[{"t":"Str","c":"No"},{"t":"Space"},{"t":"Str","c":"heading."}]}));
        assert_eq!(blocks.len(), 5);
    }
}
