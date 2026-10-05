//! A document as Pandoc's own JSON, which Pandoc reads without any guessing.
//!
//! Markdown would have to be escaped; this cannot be misread. Pandoc makes
//! every output from it.

use std::cell::{Cell, RefCell};
use std::collections::{HashMap, HashSet};

use serde_json::{Value, json};

use super::{Block, CiteItem, CiteMode, Document, Inline, NotePlace, RefForm, Section};
use crate::formats::kinds::{self, KindInfo, Resolved};
use crate::formats::{Case, Equations, Figures, Tables};
use crate::written::locators::{locale_for, terms};

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
        let w = forms.get("long").or_else(|| forms.get("short"))?.first()?;
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
    /// Text flows around something in the document.
    pub flows: bool,
    /// What is known of every kind of paragraph and of words: see `formats/kinds.rs`.
    pub kinds: HashMap<String, KindInfo>,
    /// Whether the format sets italics as underline.
    pub italics_underlined: bool,
    /// Whether the document can carry the classes of kinds, as a page of the web can.
    pub classes: bool,
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
    /// Levels of heading that begin a new page, where the document has pages: `page_break` before them.
    pub new_page: Vec<u8>,
    pub page_break: Option<Value>,
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
                    Block::Paragraph { content } | Block::Script { content, .. } | Block::Passage { content, .. } => {
                        inlines(content, c.to)
                    }
                    Block::Blockquote { content } => blocks(content, c),
                    Block::Verse { lines, .. } => {
                        for l in lines {
                            inlines(&l.content, c.to);
                        }
                    }
                    Block::Parallel { left, right } => {
                        blocks(left, c);
                        blocks(right, c);
                    }
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
            // Words that begin with a sign of their own (", who argues
            // otherwise", "; but see below") stand close to what is before them.
            let close = after.is_some_and(|s| s.starts_with([',', ';', ':', '.', '!', '?', ')']));
            if locator.is_some() || (after.is_some() && !close) {
                suffix.push(json!({"t": "Str", "c": ","}));
                suffix.push(json!({"t": "Space"}));
            }
            if let Some(l) = locator {
                suffix.push(json!({"t": "Str", "c": l}));
                if after.is_some() && !close {
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
                    let wrapped = if inner.is_empty() { Vec::new() } else { self.wrap(inner, marks) };
                    out.extend(wrapped);
                    if !marks.is_empty() && trail {
                        out.push(json!({"t": "Space"}));
                    }
                }
                Inline::Citation { items, mode } => match self.citation(items, *mode) {
                    Some(c) => out.push(c),
                    None => out.push(json!({"t": "Strong", "c": [{"t": "Str", "c": super::term(self.language, "document-reference-not-found")}]})),
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
                Block::Verse { start, by, lines } => self.verse(*start, *by, lines, out),
                Block::Parallel { left, right } => self.parallel(left, right, out),
                Block::Script { part, content } => self.passage(part.name(), content, out),
                Block::Passage { name, content } => self.passage(name, content, out),
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

    /// The mark of the element a section was made from, in the Typst that
    /// sets the preview: metadata, of which nothing is set, with a label by
    /// which the place of the section on the pages is asked for afterwards
    /// (`export::typeset::places`). Nothing for the other formats, and
    /// nothing for a section that was made from no element.
    fn mark(&self, section: &Section) -> Option<Value> {
        if self.extras.flavour != Flavour::Typst {
            return None;
        }
        let id = label(section.element.as_deref()?);
        if id.is_empty() {
            return None;
        }
        Some(json!({"t": "RawBlock", "c": ["typst", format!("#metadata(\"{id}\") <{ELEMENT_LABEL}{id}>")]}))
    }

    fn section(&self, section: &Section, out: &mut Vec<Value>) {
        let heading = section.heading.as_ref().map(|h| self.inlines(h)).filter(|h| !h.is_empty());
        let level = section.level.clamp(1, self.deepest.max(1));
        let mut body = Vec::new();
        self.blocks(&section.blocks, &mut body);

        // The mark stands before the heading, and after the break of the
        // page before it, so that it is found on the page the section begins.
        let mut mark = self.mark(section);
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
                if self.new_page.contains(&level)
                    && let Some(b) = &self.page_break
                {
                    out.push(b.clone());
                }
                out.extend(mark.take());
                let place = section.element.as_deref().and_then(|id| self.extras.anchor(id));
                let named = match place.as_ref().and_then(|p| p["c"][0][0].as_str()) {
                    Some(name) => json!([name, [], []]),
                    None => attr(),
                };
                out.push(json!({"t": "Header", "c": [level, named, h]}));
            }
            _ => {}
        }
        out.extend(mark);
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

/// Whether a link may go into a document: to the web, to an address, or
/// within the document. Not `javascript:` and its like, which would run
/// where a web page made of the document is read.
fn safe_href(href: &str) -> bool {
    // As a browser reads it: without the spaces and the signs that are not written.
    let bare: String = href.chars().filter(|c| !c.is_ascii_control() && *c != ' ').collect();
    let Some((scheme, _)) = bare.split_once(':') else { return true };
    let is_scheme = scheme.chars().next().is_some_and(|c| c.is_ascii_alphabetic())
        && scheme.chars().all(|c| c.is_ascii_alphanumeric() || matches!(c, '+' | '.' | '-'));
    !is_scheme || matches!(scheme.to_ascii_lowercase().as_str(), "http" | "https" | "mailto" | "ftp" | "doi")
}

/// What the label of the mark of an element begins with, in the Typst of
/// the preview: `#metadata("ID") <gk-el-ID>` stands before each section that
/// was made from an element, and is found again by `export::typeset::places`.
pub const ELEMENT_LABEL: &str = "gk-el-";

/// The name of a kind, or the id of an element, as a label of Typst or a
/// class takes it: letters, digits, `-` and `_`, and nothing else.
pub fn label(kind: &str) -> String {
    kind.chars().filter(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_')).take(80).collect()
}

/// The text of inlines in capitals, for what a look sets so where no style
/// can: scene headings, characters and transitions.
pub(super) fn upper(inlines: &mut [Value]) {
    for v in inlines.iter_mut() {
        if v["t"] == "Str" {
            if let Some(s) = v["c"].as_str() {
                v["c"] = Value::String(s.to_uppercase());
            }
        } else {
            // Emph, Strong and their like hold their inlines; a citation holds nothing to be set so.
            let holds = v["t"] != "Cite" && v["t"] != "Note" && v["t"] != "Code";
            if holds && let Some(inner) = v["c"].as_array_mut() {
                upper(inner);
            }
        }
    }
}

/// Inlines set as a look says, by what every kind of document knows:
/// italics, bold, small capitals, underlining. For where no style can carry
/// the look.
pub(super) fn looked(mut current: Vec<Value>, look: &Resolved) -> Vec<Value> {
    if look.case == Case::Smallcaps {
        current = vec![json!({"t": "SmallCaps", "c": current})];
    }
    if look.underline {
        current = vec![json!({"t": "Underline", "c": current})];
    }
    if look.bold {
        current = vec![json!({"t": "Strong", "c": current})];
    }
    if look.italic {
        current = vec![json!({"t": "Emph", "c": current})];
    }
    current
}

/// The words of inlines as one string: for code, which holds its text as it stands.
fn plain_of(inlines: &[Value]) -> String {
    let mut out = String::new();
    for v in inlines {
        match v["t"].as_str() {
            Some("Str") => out.push_str(v["c"].as_str().unwrap_or("")),
            Some("Space") => out.push(' '),
            Some("LineBreak") | Some("SoftBreak") => out.push('\n'),
            Some("Code") => out.push_str(v["c"][1].as_str().unwrap_or("")),
            _ => {
                if let Some(inner) = v["c"].as_array() {
                    out.push_str(&plain_of(inner));
                }
            }
        }
    }
    out
}

/// The text of a passage of code, line by line, as it was written.
fn code_text(content: &[Inline]) -> String {
    let mut out = String::new();
    for i in content {
        match i {
            Inline::Text { text, .. } => out.push_str(text),
            Inline::Break => out.push('\n'),
            Inline::Math { tex } => out.push_str(tex),
            _ => {}
        }
    }
    out
}

impl Converter<'_> {
    /// A paragraph of a kind, set as the kind's look says: in Typst by the
    /// opening of the document, in LaTeX by what is written around it, in
    /// Word and Writer by a paragraph style named after the kind, and
    /// elsewhere as plainly as the look can be shown. A part of a script is
    /// such a paragraph, by the name of the part.
    pub(super) fn passage(&self, name: &str, content: &[Inline], out: &mut Vec<Value>) {
        let x = &self.extras;
        // A note to oneself goes into no document.
        if name == "draft" {
            return;
        }
        let Some(info) = x.kinds.get(name) else {
            let inner = self.inlines(content);
            if !inner.is_empty() {
                out.push(json!({"t": "Para", "c": inner}));
            }
            return;
        };
        let look = &info.look;
        if name == "code" {
            let text = code_text(content);
            if !text.trim().is_empty() {
                out.push(json!({"t": "CodeBlock", "c": [attr(), text.trim_end()]}));
            }
            return;
        }
        let mut inner = self.inlines(content);
        if name == "break" {
            // A break holds no text of its own: the format says what stands in it.
            inner.clear();
            let sign = look.text.trim();
            tokens(if sign.is_empty() { "\u{a0}" } else { sign }, &mut inner);
        }
        if inner.is_empty() {
            return;
        }
        if name == "parenthetical" {
            inner.insert(0, json!({"t": "Str", "c": "("}));
            inner.push(json!({"t": "Str", "c": ")"}));
        }
        if look.new_page
            && let Some(b) = &self.page_break
        {
            out.push(b.clone());
        }
        match x.flavour {
            Flavour::Typst => out.push(json!({"t": "Div", "c": [[format!("gk-kind-{}", label(name)), [], []],
                [{"t": "Plain", "c": inner}]]})),
            Flavour::Latex => {
                if look.case == Case::Upper {
                    upper(&mut inner);
                }
                let (open, close) = crate::export::latex::around(look, x.kinds.get("text").map(|t| &t.look));
                inner.insert(0, json!({"t": "RawInline", "c": ["latex", open]}));
                inner.push(json!({"t": "RawInline", "c": ["latex", close]}));
                out.push(json!({"t": "Plain", "c": inner}));
            }
            Flavour::Docx | Flavour::Odt => {
                if info.style.is_empty() {
                    out.push(json!({"t": "Para", "c": inner}));
                } else {
                    out.push(json!({"t": "Div", "c": [["", [format!("gk-kind-{}", label(name))], [["custom-style", info.style]]],
                        [{"t": "Para", "c": inner}]]}));
                }
            }
            Flavour::Plain => {
                if look.case == Case::Upper {
                    upper(&mut inner);
                }
                let inner = looked(inner, look);
                out.push(json!({"t": "Div", "c": [["", [format!("gk-kind-{}", label(name))], []],
                    [{"t": "Para", "c": inner}]]}));
            }
        }
    }

    /// Inlines within their marks: italics and bold, and the kinds of words.
    fn wrap(&self, inner: Vec<Value>, marks: &std::collections::BTreeMap<String, Value>) -> Vec<Value> {
        let x = &self.extras;
        let mut current = inner;
        // From the innermost outwards. The order is fixed, so that the same marks
        // always nest the same way.
        for name in ["sub", "sup", "smallcaps", "strike", "underline", "code", "kind", "strong", "em", "link"] {
            let Some(value) = marks.get(name) else { continue };
            if value.is_null() || value == &Value::Bool(false) {
                continue;
            }
            let node = match name {
                "em" if x.italics_underlined => json!({"t": "Underline", "c": current}),
                "em" => json!({"t": "Emph", "c": current}),
                "strong" => json!({"t": "Strong", "c": current}),
                "strike" => json!({"t": "Strikeout", "c": current}),
                "sup" => json!({"t": "Superscript", "c": current}),
                "sub" => json!({"t": "Subscript", "c": current}),
                "smallcaps" => json!({"t": "SmallCaps", "c": current}),
                "underline" => json!({"t": "Underline", "c": current}),
                // Code holds its letters as they stand, without marks within.
                "code" => json!({"t": "Code", "c": [attr(), plain_of(&current)]}),
                "kind" => {
                    let kind = value.get("name").and_then(Value::as_str).unwrap_or("").trim();
                    let lang = value.get("lang").and_then(Value::as_str).map(str::trim).filter(|l| !l.is_empty());
                    // What is marked for the eye alone is not in the document.
                    if kind == "highlight" || kind.is_empty() {
                        continue;
                    }
                    let info = x.kinds.get(kind);
                    let mut attrs: Vec<Value> = Vec::new();
                    if let Some(l) = lang {
                        attrs.push(json!(["lang", l]));
                    }
                    match x.flavour {
                        Flavour::Docx | Flavour::Odt => {
                            if let Some(i) = info
                                && !i.style.is_empty()
                            {
                                attrs.push(json!(["custom-style", i.style]));
                            }
                        }
                        _ => {
                            if let Some(i) = info {
                                if i.look.case == Case::Upper {
                                    upper(&mut current);
                                }
                                current = looked(current, &i.look);
                            }
                        }
                    }
                    // A word that is mentioned stands in the quotation marks of the language.
                    if kind == "mention" {
                        let (open, close) = kinds::quotes(self.language);
                        current.insert(0, json!({"t": "Str", "c": open}));
                        current.push(json!({"t": "Str", "c": close}));
                    }
                    if attrs.is_empty() && !x.classes {
                        continue;
                    }
                    json!({"t": "Span", "c": [["", [format!("gk-kind-{}", label(kind))], attrs], current]})
                }
                "link" => {
                    let href = value.get("href").and_then(Value::as_str).unwrap_or("");
                    if href.is_empty() || !safe_href(href) {
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
        Converter {
            keys,
            language: Some("en-GB"),
            run_in: vec![],
            new_page: vec![],
            page_break: None,
            deepest: 6,
            extras: Extras::default(),
        }
    }

    #[test]
    fn links_that_would_run_are_left_out() {
        for href in ["https://example.org", "mailto:a@b.no", "doi:10.1/x", "#part", "notes.html", "a/b:c"] {
            assert!(safe_href(href), "{href}");
        }
        for href in
            ["javascript:alert(1)", " JavaScript:alert(1)", "java\tscript:x", "data:text/html,x", "file:///etc/passwd"]
        {
            assert!(!safe_href(href), "{href}");
        }
        let marks = |href: &str| std::collections::BTreeMap::from([("link".to_owned(), json!({ "href": href }))]);
        let text = || vec![json!({"t": "Str", "c": "here"})];
        let keys = HashMap::new();
        let c = converter(&keys);
        assert_eq!(c.wrap(text(), &marks("https://example.org"))[0]["t"], "Link");
        assert_eq!(c.wrap(text(), &marks("javascript:alert(1)"))[0]["t"], "Span");
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
    fn what_the_document_prints_of_a_work_it_does_not_have_is_in_its_language() {
        let keys = HashMap::new();
        let cited = [Inline::Citation {
            items: vec![CiteItem { id: "gone".into(), ..Default::default() }],
            mode: CiteMode::Normal,
        }];
        let said = |language: Option<&str>| {
            let c = Converter { language, ..converter(&keys) };
            Value::Array(c.inlines(&cited))
        };
        assert_eq!(said(Some("en-GB")), json!([{"t": "Strong", "c": [{"t": "Str", "c": "[reference not found]"}]}]));
        assert_eq!(said(Some("nb")), json!([{"t": "Strong", "c": [{"t": "Str", "c": "[fant ikke referansen]"}]}]));
        assert_eq!(said(Some("nn-NO")), json!([{"t": "Strong", "c": [{"t": "Str", "c": "[fann ikkje referansen]"}]}]));
        // A language documents have no words in: English.
        assert_eq!(said(Some("de")), said(None));
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

    #[test]
    fn a_section_made_from_an_element_is_marked_for_typst_alone() {
        let keys = HashMap::new();
        let doc = Document {
            sections: vec![
                Section {
                    level: 1,
                    heading: Some(vec![text("One")]),
                    blocks: vec![para(vec![text("Text.")])],
                    element: Some("e1".into()),
                },
                Section {
                    level: 2,
                    heading: Some(vec![text("Run")]),
                    blocks: vec![para(vec![text("In.")])],
                    element: Some("e2 <x>".into()),
                },
                Section {
                    level: 0,
                    heading: None,
                    blocks: vec![para(vec![text("Bare.")])],
                    element: Some("e3".into()),
                },
                Section { level: 1, heading: Some(vec![text("None")]), blocks: vec![], element: None },
            ],
            ..Default::default()
        };
        let mark = |id: &str| json!({"t": "RawBlock", "c": ["typst", format!("#metadata(\"{id}\") <gk-el-{id}>")]});
        let page_break = json!({"t": "RawBlock", "c": ["typst", "#pagebreak(weak: true)"]});

        let mut c = converter(&keys);
        c.extras.flavour = Flavour::Typst;
        c.run_in = vec![RunIn { level: 2, bold: true, italic: false }];
        c.new_page = vec![1];
        c.page_break = Some(page_break.clone());
        let out = c.document(&doc, &[1, 23, 1], serde_json::Map::new());
        let blocks = out["blocks"].as_array().unwrap();
        // After the break of the page, before the heading.
        assert_eq!(blocks[0], page_break);
        assert_eq!(blocks[1], mark("e1"));
        assert_eq!(blocks[2]["t"], "Header");
        assert_eq!(blocks[3]["t"], "Para");
        // Before the paragraph a run-in heading begins; the id made safe.
        assert_eq!(blocks[4], mark("e2x"));
        assert_eq!(blocks[5]["c"][0]["t"], "Span");
        // Before the first block of a section without a heading.
        assert_eq!(blocks[6], mark("e3"));
        assert_eq!(blocks[7]["c"][0], json!({"t":"Str","c":"Bare."}));
        // None for a section made from no element.
        assert_eq!(blocks[8], page_break);
        assert_eq!(blocks[9]["t"], "Header");
        assert_eq!(blocks.len(), 10);

        for flavour in [Flavour::Latex, Flavour::Docx, Flavour::Odt, Flavour::Plain] {
            let mut c = converter(&keys);
            c.extras.flavour = flavour;
            let out = c.document(&doc, &[1, 23, 1], serde_json::Map::new());
            assert!(!out["blocks"].as_array().unwrap().iter().any(|b| b["t"] == "RawBlock"), "{flavour:?}");
        }
    }
}
