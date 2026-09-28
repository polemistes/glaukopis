//! A document as Pandoc's own JSON, which Pandoc reads without any guessing.
//!
//! Markdown would have to be escaped; this cannot be misread. Pandoc makes
//! every output from it.

use std::cell::{Cell, RefCell};
use std::collections::{HashMap, HashSet};
use std::sync::OnceLock;

use serde_json::{Value, json};

use super::{Block, CiteItem, CiteMode, Document, Inline, NotePlace, RefForm, Section};
use crate::formats::{Equations, Figures, Tables};

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
pub(super) fn tokens(text: &str, out: &mut Vec<Value>) {
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

pub(super) fn attr() -> Value {
    json!(["", [], []])
}

/// A level of heading that runs into the text that follows it, and its form.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RunIn {
    pub level: u8,
    pub bold: bool,
    pub italic: bool,
}

/// What is written, as far as figures and equations must know: each kind
/// of document has its own way of setting a picture with its caption, and
/// of numbering an equation.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum Flavour {
    Typst,
    Latex,
    /// For Word. What is set is named by styles, here and in the next.
    Docx,
    /// For Writer.
    Odt,
    #[default]
    Plain,
}

/// Figures and equations: how they are set, and what was met on the way.
#[derive(Debug, Default)]
pub struct Extras {
    pub flavour: Flavour,
    pub figures: Figures,
    pub tables: Tables,
    pub equations: Equations,
    /// The directory the files of the figures are in, as the document names it.
    pub files: String,
    /// The names of the files that are there, as `<hash>.<extension>`.
    pub present: HashSet<String>,
    /// Whether the format has the first paragraph after a heading begin
    /// further in, as those that follow it do.
    pub first_indented: bool,
    /// What can be pointed to, by its id.
    pub targets: HashMap<String, Pointed>,
    /// How wide the text is on the page, in points.
    pub text_width: f64,
    /// What has been given a place that can be gone to.
    anchored: RefCell<HashSet<String>>,
    /// How many pointers point to nothing that is in the document.
    astray: Cell<u32>,
    pub(super) figure: Cell<u32>,
    pub(super) table: Cell<u32>,
    pub(super) equation: Cell<u32>,
    /// How many frames and tables have been made to hold what stands together.
    pub(super) frames: Cell<u32>,
    /// Figures that stand at the end of the document, in their order.
    pub(super) held: RefCell<Vec<Value>>,
    /// Tables that stand at the end of the document.
    pub(super) held_tables: RefCell<Vec<Value>>,
    /// The names of figures whose files are not there.
    pub(super) absent: RefCell<Vec<String>>,
}

impl Extras {
    pub fn new(
        flavour: Flavour,
        figures: Figures,
        tables: Tables,
        equations: Equations,
        files: String,
        present: HashSet<String>,
    ) -> Self {
        Extras { flavour, figures, tables, equations, files, present, ..Default::default() }
    }

    /// The figures that were kept for the end of the document.
    pub fn held(&self) -> Vec<Value> {
        self.held.borrow().clone()
    }

    /// The tables that were kept for the end of the document.
    pub fn held_tables(&self) -> Vec<Value> {
        self.held_tables.borrow().clone()
    }

    pub fn absent(&self) -> Vec<String> {
        self.absent.borrow().clone()
    }

    /// How many pointers point to nothing that is in the document.
    pub fn astray(&self) -> u32 {
        self.astray.get()
    }

    /// The place of something that is pointed to, the first time it is
    /// asked for: what stands twice in a document can be gone to once.
    pub(super) fn anchor(&self, id: &str) -> Option<Value> {
        let pointed = self.targets.get(id).filter(|p| p.pointed_to)?;
        if !self.anchored.borrow_mut().insert(id.to_owned()) {
            return None;
        }
        Some(json!({"t": "Span", "c": [[pointed.anchor, [], []], []]}))
    }
}

/// The kinds of what can be pointed to.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PointedKind {
    Figure,
    Table,
    Equation,
    Part,
}

/// Something that stands in the document and can be pointed to.
#[derive(Debug, Clone, PartialEq)]
pub struct Pointed {
    pub kind: PointedKind,
    /// Its number in the document, if it has one.
    pub number: Option<String>,
    /// Of a part: its heading.
    pub name: Vec<Inline>,
    /// The name of its place, for going there.
    pub anchor: String,
    /// Whether anything points to it.
    pub pointed_to: bool,
}

/// The name of the place of something, from its id.
fn anchor_of(id: &str) -> String {
    let safe: String = id.chars().map(|c| if c.is_ascii_alphanumeric() { c } else { '-' }).take(80).collect();
    format!("gk-to-{safe}")
}

/// Text as Typst takes it within square brackets.
pub(super) fn typst_text(text: &str) -> String {
    let mut out = String::with_capacity(text.len() + 4);
    for c in text.chars() {
        if matches!(c, '\\' | '#' | '[' | ']' | '$' | '*' | '_' | '`' | '<' | '>' | '@') {
            out.push('\\');
        }
        out.push(c);
    }
    out
}

pub struct Converter<'a> {
    /// From the id of a reference to its key in the bibliography.
    pub keys: &'a HashMap<String, String>,
    pub language: Option<&'a str>,
    /// Levels of heading that run into the text that follows them.
    pub run_in: Vec<RunIn>,
    /// Headings deeper than this are printed at this level.
    pub deepest: u8,
    pub extras: Extras,
}

impl Converter<'_> {
    /// What can be pointed to in a document, with the numbers it has there.
    /// The order is that in which the document is written, and the numbers
    /// those that are given as it is written.
    pub fn targets(&self, doc: &Document, numbered_headings: bool) -> HashMap<String, Pointed> {
        fn inlines(list: &[Inline], to: &mut HashSet<String>) {
            for inline in list {
                match inline {
                    Inline::CrossRef { target, .. } => {
                        to.insert(target.clone());
                    }
                    Inline::Footnote { content, .. } => inlines(content, to),
                    _ => {}
                }
            }
        }
        struct Counted<'a> {
            figure: u32,
            table: u32,
            equation: u32,
            found: HashMap<String, Pointed>,
            to: &'a mut HashSet<String>,
        }
        fn blocks(list: &[Block], c: &mut Counted) {
            for block in list {
                match block {
                    Block::Paragraph { content } => inlines(content, c.to),
                    Block::Blockquote { content } => blocks(content, c),
                    Block::BulletList { items } | Block::OrderedList { items, .. } => {
                        for item in items {
                            blocks(item, c);
                        }
                    }
                    Block::Row { items } => blocks(items, c),
                    Block::Table(table) => {
                        inlines(&table.caption, c.to);
                        let number = table.numbered.then(|| {
                            c.table += 1;
                            c.table.to_string()
                        });
                        if !table.id.is_empty() {
                            c.found.entry(table.id.clone()).or_insert(Pointed {
                                kind: PointedKind::Table,
                                number,
                                name: Vec::new(),
                                anchor: anchor_of(&table.id),
                                pointed_to: false,
                            });
                        }
                        for row in &table.rows {
                            for cell in row {
                                blocks(&cell.content, c);
                            }
                        }
                    }
                    Block::Equation { id, tex, numbered, .. } => {
                        if tex.trim().is_empty() {
                            continue;
                        }
                        let number = numbered.then(|| {
                            c.equation += 1;
                            c.equation.to_string()
                        });
                        if !id.is_empty() {
                            c.found.entry(id.clone()).or_insert(Pointed {
                                kind: PointedKind::Equation,
                                number,
                                name: Vec::new(),
                                anchor: anchor_of(id),
                                pointed_to: false,
                            });
                        }
                    }
                    Block::Figure { id, caption, numbered, .. } => {
                        inlines(caption, c.to);
                        let number = numbered.then(|| {
                            c.figure += 1;
                            c.figure.to_string()
                        });
                        if !id.is_empty() {
                            c.found.entry(id.clone()).or_insert(Pointed {
                                kind: PointedKind::Figure,
                                number,
                                name: Vec::new(),
                                anchor: anchor_of(id),
                                pointed_to: false,
                            });
                        }
                    }
                }
            }
        }

        let mut to = HashSet::new();
        let mut counted = Counted { figure: 0, table: 0, equation: 0, found: HashMap::new(), to: &mut to };
        // The numbers of the parts, as those who set the pages count them:
        // a heading counts on at its level, and begins the levels under it anew.
        let mut levels = [0u32; 6];
        for section in &doc.sections {
            if let Some(heading) = section.heading.as_deref().filter(|h| !h.is_empty() && section.level > 0) {
                inlines(heading, counted.to);
                let level = section.level.clamp(1, self.deepest.max(1)) as usize;
                let set_as_heading = !self.run_in.iter().any(|r| r.level as usize == level);
                let number = (numbered_headings && set_as_heading).then(|| {
                    levels[level - 1] += 1;
                    levels[level..].fill(0);
                    levels[..level].iter().map(u32::to_string).collect::<Vec<_>>().join(".")
                });
                if let Some(id) = section.element.as_deref().filter(|id| !id.is_empty()) {
                    counted.found.entry(id.to_owned()).or_insert(Pointed {
                        kind: PointedKind::Part,
                        number,
                        name: heading.to_vec(),
                        anchor: anchor_of(id),
                        pointed_to: false,
                    });
                }
            }
            blocks(&section.blocks, &mut counted);
        }
        let mut found = counted.found;
        for (id, pointed) in found.iter_mut() {
            pointed.pointed_to = to.contains(id);
        }
        found
    }

    /// The words that point to something, as the document calls it.
    fn pointer(&self, target: &str, form: RefForm) -> Vec<Value> {
        let x = &self.extras;
        let mut words = Vec::new();
        let Some(pointed) = x.targets.get(target) else {
            x.astray.set(x.astray.get() + 1);
            tokens("[?]", &mut words);
            return vec![json!({"t": "Strong", "c": words})];
        };
        match pointed.kind {
            PointedKind::Figure | PointedKind::Table => {
                let (label, reference) = match pointed.kind {
                    PointedKind::Figure => (&x.figures.label, &x.figures.reference),
                    _ => (&x.tables.label, &x.tables.reference),
                };
                let called = if reference.trim().is_empty() { label } else { reference };
                let text = match (&pointed.number, form) {
                    (Some(n), RefForm::Number) => n.clone(),
                    (Some(n), _) if called.trim().is_empty() => n.clone(),
                    (Some(n), _) => format!("{}\u{a0}{n}", called.trim()),
                    // One that has no number is pointed to by what figures are called.
                    (None, _) => called.trim().to_owned(),
                };
                tokens(&text, &mut words);
            }
            PointedKind::Equation => {
                let text = match (&pointed.number, form) {
                    (Some(n), RefForm::Number) => n.clone(),
                    (Some(n), _) => format!("{}{n}{}", x.equations.before_number, x.equations.after_number),
                    (None, _) => String::new(),
                };
                tokens(&text, &mut words);
            }
            PointedKind::Part => match (&pointed.number, form) {
                (Some(n), RefForm::Full | RefForm::Number) => tokens(n, &mut words),
                // The words of the heading, without what points from it.
                _ => {
                    let plain: Vec<Inline> = pointed
                        .name
                        .iter()
                        .filter(|i| matches!(i, Inline::Text { .. } | Inline::Math { .. }))
                        .cloned()
                        .collect();
                    words = self.inlines(&plain);
                }
            },
        }
        if words.is_empty() {
            x.astray.set(x.astray.get() + 1);
            tokens("[?]", &mut words);
            return vec![json!({"t": "Strong", "c": words})];
        }
        match x.flavour {
            // In a document for a word processor a link is set in colour,
            // which a manuscript is not to have.
            Flavour::Docx | Flavour::Odt => words,
            _ => vec![json!({"t": "Link", "c": [attr(), words, [format!("#{}", pointed.anchor), ""]]})],
        }
    }

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
                Inline::Math { tex } => {
                    if !tex.trim().is_empty() {
                        out.push(json!({"t": "Math", "c": [{"t": "InlineMath"}, tex.trim()]}));
                    }
                }
                Inline::CrossRef { target, form } => out.extend(self.pointer(target, *form)),
                Inline::Footnote { content, place } => {
                    let inner = self.inlines(content);
                    if !inner.is_empty() {
                        let note = json!({"t": "Note", "c": [{"t": "Para", "c": inner}]});
                        // A note that has been set to a place is held by what says
                        // which: read by the filter that places the notes.
                        out.push(match place {
                            None => note,
                            Some(NotePlace::Foot) => json!({"t": "Span", "c": [["", ["gk-note-foot"], []], [note]]}),
                            Some(NotePlace::End) => json!({"t": "Span", "c": [["", ["gk-note-end"], []], [note]]}),
                        });
                    }
                }
                Inline::Break => out.push(json!({"t": "LineBreak"})),
            }
        }
        out
    }

    /// A paragraph that follows a figure or an equation: it begins as the
    /// first paragraph under a heading does, in every kind of document.
    fn paragraph_after(&self, mut inner: Vec<Value>) -> Value {
        match self.extras.flavour {
            Flavour::Latex if !self.extras.first_indented => {
                inner.insert(0, json!({"t": "RawInline", "c": ["latex", "\\noindent "]}));
                json!({"t": "Para", "c": inner})
            }
            Flavour::Docx | Flavour::Odt => json!({
                "t": "Div",
                "c": [["", [], [["custom-style", "First Paragraph"]]], [{"t": "Para", "c": inner}]],
            }),
            _ => json!({"t": "Para", "c": inner}),
        }
    }

    pub fn blocks(&self, list: &[Block], out: &mut Vec<Value>) {
        let mut set_off = false;
        let mut at = 0;
        while at < list.len() {
            let block = &list[at];
            at += 1;
            let after = std::mem::replace(
                &mut set_off,
                matches!(block, Block::Equation { .. } | Block::Figure { .. } | Block::Table(_) | Block::Row { .. }),
            );
            match block {
                Block::Paragraph { content } => {
                    let inner = self.inlines(content);
                    if !inner.is_empty() {
                        out.push(if after { self.paragraph_after(inner) } else { json!({"t": "Para", "c": inner}) });
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
                Block::Equation { .. } | Block::Figure { .. } | Block::Table(_) | Block::Row { .. } => {
                    // Where the text that flows around something must be
                    // given to it, it is the paragraphs that follow.
                    let mut around = Vec::new();
                    if self.takes_text(block) {
                        while let Some(Block::Paragraph { content }) = list.get(at) {
                            let inner = self.inlines(content);
                            if !inner.is_empty() {
                                around.push(json!({"t": "Para", "c": inner}));
                            }
                            at += 1;
                            set_off = false;
                        }
                    }
                    self.set_off(block, around, out);
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
                if let Some(place) = section.element.as_deref().and_then(|id| self.extras.anchor(id)) {
                    h.insert(0, place);
                }
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
                let place = section.element.as_deref().and_then(|id| self.extras.anchor(id));
                let named = match place.as_ref().and_then(|p| p["c"][0][0].as_str()) {
                    Some(name) => json!([name, [], []]),
                    None => attr(),
                };
                out.push(json!({"t": "Header", "c": [level, named, h]}));
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
        Converter { keys, language: Some("en-GB"), run_in: vec![], deepest: 6, extras: Extras::default() }
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
