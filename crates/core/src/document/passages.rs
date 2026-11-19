//! Paragraphs, how each kind of document groups them, and texts side by
//! side (ADR 0041).
//!
//! A text is paragraphs, each of a kind, and a paragraph is lines. Nothing
//! groups them in the text itself: the document does, here. The paragraphs
//! that stand together are cut into stretches, runs of paragraphs with the
//! same numbering settings, and within a stretch, and outside any, into
//! runs by how their kind is grouped (`formats/kinds.rs`), a paragraph that
//! says it is new beginning a run of its own:
//!
//! - **Lines**: the lines of verse as one block. A paragraph of verse is a
//!   stanza, and its lines are the lines of the block; between two stanzas
//!   stands an empty line. Speakers and directions among the lines stand in
//!   the block as lines of their kind. In Typst the lines are blocks with
//!   labels, which the opening of the document (`formats/typst.rs`) sets,
//!   with the number each shows beside it; in LaTeX each line is a
//!   paragraph of its own, with the number hanging in the margin. Elsewhere
//!   a line block, which every writer of Pandoc keeps as lines, with the
//!   number at the head of its line or at its end, small, and the speakers
//!   and directions in character styles of their own.
//! - **Quote**: a block quote of the quoted paragraphs.
//! - **List**: a bullet or numbered list, nested by indent.
//! - **Code**: a code block, the lines of its paragraphs its lines.
//! - **Glossary**: a description list, each headword a term and the glosses
//!   after it its definitions.
//! - Everything else, paragraph by paragraph, as its kind looks: in Typst by
//!   the opening of the document, in LaTeX by what is written around it, in
//!   Word and Writer by a paragraph style named after the kind, and
//!   elsewhere as plainly as the look can be shown.
//!
//! The numbers of a numbered stretch are counted over the whole stretch
//! (`document/numbers.rs`), across stanzas, speakers and runs, and each
//! line shows its own beside it. A paragraph of prose is one line unless it
//! has line breaks.
//!
//! **Breaks** of the page and of the column, as each kind of document has
//! them. **Parallel**: an original and its translation side by side. A grid
//! in Typst, two minipages in LaTeX, and a table without lines in Word and
//! Writer.

use std::fmt::Write as _;

use serde_json::{Value, json};

use super::numbers::{Shown, lines_of, stretch_numbers, stretches};
use super::pandoc::{Converter, Flavour, attr, hand_style_name, label, looked, tokens, upper};
use super::{Block, BreakKind, Hand, Inline, Numbering, Side};
use crate::formats::typst::{leading, string};
use crate::formats::{Align, Case, Length};

fn raw(format: &str, text: impl Into<String>) -> Value {
    json!({"t": "RawBlock", "c": [format, text.into()]})
}

fn raw_inline(format: &str, text: impl Into<String>) -> Value {
    json!({"t": "RawInline", "c": [format, text.into()]})
}

/// How a paragraph stands by hand, as Typst is told: what opens it and what
/// closes it. How it stands across the line, its line spacing and its first
/// line are said for the paragraph alone, with nothing set about it, so
/// that it stands among the paragraphs beside it as before. The space
/// before and after it is room added there. Set in from the left or the
/// right, it stands in a block of its own, where its first line begins as
/// the writer said, or with the rest.
fn hand_typst(hand: &Hand) -> (String, String) {
    let mut said = Vec::new();
    match hand.align() {
        Some(Align::Justified) => said.push("#set align(left); #set par(justify: true)".to_owned()),
        Some(to) => said.push(format!(
            "#set align({}); #set par(justify: false)",
            match to {
                Align::Center => "center",
                Align::Right => "right",
                _ => "left",
            }
        )),
        None => {}
    }
    if let Some(spacing) = hand.line_spacing() {
        said.push(format!("#set par(leading: {})", leading(spacing)));
    }
    let (left, right) = (hand.indent_left(), hand.indent_right());
    let set_in = left.is_some() || right.is_some();
    // Within a block of its own a paragraph is the first, and would begin with the rest whatever the layout says.
    if let Some(first) = hand.first_line().or(set_in.then(|| Length::pt(0.0))) {
        said.push(format!("#set par(first-line-indent: (amount: {first}, all: true))"));
    }
    let mut open = format!("#[{}", said.join("; "));
    if let Some(before) = hand.space_before() {
        let _ = write!(open, "\n#v({before})");
    }
    if set_in {
        let zero = Length::pt(0.0);
        let _ = write!(open, "\n#pad(left: {}, right: {})[", left.unwrap_or(zero), right.unwrap_or(zero));
    }
    let mut close = String::new();
    if set_in {
        close.push_str("]\n");
    }
    if let Some(after) = hand.space_after() {
        let _ = writeln!(close, "#v({after})");
    }
    close.push(']');
    (open, close)
}

/// How a paragraph stands by hand, as LaTeX is told: a group about the
/// paragraph, as about a paragraph of a kind (`export/latex.rs`, `around`),
/// with only what was said. Centred or set to a side, its first line begins
/// with the rest unless one was said; set in, the room at its sides is that
/// much and whatever its alignment adds.
fn hand_latex(hand: &Hand) -> (String, String) {
    let mut open = String::from("{\\par");
    if let Some(before) = hand.space_before() {
        let _ = write!(open, "\\vspace{{{before}}}");
    }
    let align = hand.align();
    match align {
        Some(Align::Center) => open.push_str("\\centering"),
        Some(Align::Right) => open.push_str("\\raggedleft"),
        Some(Align::Left) => open.push_str("\\ifdefined\\RaggedRight\\RaggedRight\\else\\raggedright\\fi"),
        // Where the text is set ragged, the package that sets it so can set it justified.
        Some(Align::Justified) => open.push_str("\\ifdefined\\justifying\\justifying\\fi"),
        None => {}
    }
    let (left, right) = (hand.indent_left(), hand.indent_right());
    if left.is_some() || right.is_some() {
        let zero = Length::pt(0.0);
        let (l, r) = (left.unwrap_or(zero), right.unwrap_or(zero));
        let (stretch_left, stretch_right) = match align {
            Some(Align::Center) => (" plus 1fil", " plus 1fil"),
            Some(Align::Right) => (" plus 1fil", ""),
            Some(Align::Left) => ("", " plus 1fil"),
            _ => ("", ""),
        };
        let _ = write!(open, "\\leftskip={l}{stretch_left}\\rightskip={r}{stretch_right}");
    }
    if let Some(first) = hand.first_line() {
        let _ = write!(open, "\\parindent={first}");
    }
    if let Some(spacing) = hand.line_spacing() {
        let _ = write!(open, "\\setstretch{{{spacing}}}");
    }
    open.push(' ');
    let mut close = String::from("\\par");
    if let Some(after) = hand.space_after() {
        let _ = write!(close, "\\vspace{{{after}}}");
    }
    close.push('}');
    (open, close)
}

/// How a paragraph stands by hand, on a page of the web and in a book for
/// e-readers: the classes and the style of a division about it. The style
/// sheet has every paragraph begin as the layout says (`export/mod.rs`);
/// where a first line is said by hand, or the paragraph is centred or set
/// to the right, the class `gk-hand-first` has it begin as the division
/// says. The space before and after is room within the division, added to
/// what stands between paragraphs.
fn hand_css(hand: &Hand) -> (Vec<&'static str>, String) {
    let mut said = Vec::new();
    let align = hand.align();
    if let Some(to) = align {
        said.push(format!(
            "text-align: {}",
            match to {
                Align::Left => "left",
                Align::Center => "center",
                Align::Right => "right",
                Align::Justified => "justify",
            }
        ));
    }
    if let Some(spacing) = hand.line_spacing() {
        said.push(format!("line-height: {}", (spacing * 120.0).round() / 100.0));
    }
    if let Some(before) = hand.space_before() {
        said.push(format!("padding-top: {before}"));
    }
    if let Some(after) = hand.space_after() {
        said.push(format!("padding-bottom: {after}"));
    }
    if let Some(left) = hand.indent_left() {
        said.push(format!("margin-left: {left}"));
    }
    if let Some(right) = hand.indent_right() {
        said.push(format!("margin-right: {right}"));
    }
    let mut classes = vec!["gk-hand"];
    let first = hand.first_line().or(matches!(align, Some(Align::Center | Align::Right)).then(|| Length::pt(0.0)));
    if let Some(first) = first {
        said.push(format!("text-indent: {first}"));
        classes.push("gk-hand-first");
    }
    (classes, said.join("; "))
}

/// The style of a paragraph of text in Word, by its name; Writer calls it otherwise (`export/reference.rs`).
const BODY_TEXT: &str = "Body Text";

/// A line with nothing on it: a paragraph that holds a space that is not
/// broken at, which every kind of document sets as an empty line.
fn blank_line() -> Value {
    json!({"t": "Para", "c": [{"t": "Str", "c": "\u{a0}"}]})
}

/// Text as Pandoc's tokens.
fn words(text: &str) -> Vec<Value> {
    let mut inner = Vec::new();
    tokens(text, &mut inner);
    inner
}

/// A paragraph as the writers need it: its kind, its indent, whether it
/// begins a run, its content, and what each of its lines shows in the
/// margin, where it stands in a numbered stretch (nothing where it does not).
struct Para<'a> {
    name: &'a str,
    indent: u32,
    new: bool,
    /// A point to tick that is ticked.
    done: bool,
    /// Whether it stands in a box of rich text.
    boxed: bool,
    /// How it stands by hand, in a box of rich text.
    hand: Option<&'a Hand>,
    content: &'a [Inline],
    shown: &'a [Option<Shown>],
}

/// What stands beside the lines of a paragraph: what each line shows, and
/// the side the numbers stand on. The words in the margin are the lines' own.
#[derive(Clone, Copy)]
pub(super) struct Numbers<'a> {
    pub shown: &'a [Option<Shown>],
    pub side: Side,
}

/// What stands beside a line: its number on its side, and the words in the
/// margin, the annotation, on the side the layout says, across from the
/// numbers unless it says otherwise. And what sets the line in, after what
/// hangs in its margin and before its words: its steps, and the room of
/// the line before where it begins where that ended.
pub(super) struct Beside<'a> {
    pub number: Option<&'a Shown>,
    pub side: Side,
    pub margin: Option<&'a str>,
    pub inset: Vec<Value>,
}

impl Beside<'_> {
    fn is_empty(&self) -> bool {
        self.number.is_none() && self.margin.is_none()
    }
}

/// The line before a line that begins where it ended (ADR 0067), as much
/// as is needed to know where it ended: how many steps its own start
/// stands in from the edge of the text, what set its words further in where
/// it too began where the line before it ended, measured from `base` steps
/// in, and its words.
#[derive(Debug, Clone, Default)]
pub(super) struct Before {
    steps: u32,
    base: u32,
    after: Option<Box<Before>>,
    words: Vec<Inline>,
}

/// The words of a line, as they are measured: its text, with its kinds of
/// words and marks, and its formulas; notes, citations, pointers and the
/// marks of lines and places left out, so that nothing is set twice.
fn words_of(content: &[Inline]) -> Vec<Inline> {
    content.iter().filter(|i| matches!(i, Inline::Text { .. } | Inline::Math { .. })).cloned().collect()
}

/// How many characters the words of a line have, for the spaces of Word and Writer.
fn chars_of(words: &[Inline]) -> usize {
    words
        .iter()
        .map(|i| match i {
            Inline::Text { text, .. } => text.chars().count(),
            Inline::Math { tex } => tex.chars().count(),
            _ => 0,
        })
        .sum()
}

/// Spaces that do not break, as Word and Writer set a line in: they
/// measure nothing, and their typesetters want spaces.
fn hard_spaces(n: usize) -> Value {
    json!({"t": "Str", "c": "\u{a0}".repeat(n)})
}

/// The text of a paragraph of code, line by line, as it was written.
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

/// The number a list begins at, from the number given its first item.
fn list_start(number: Option<&str>) -> u32 {
    let digits: String = number.unwrap_or("").chars().filter(char::is_ascii_digit).collect();
    digits.parse().ok().filter(|n| *n > 0).unwrap_or(1)
}

/// A line of a block of lines, as the writers of each kind of document need it.
enum VerseItem<'a> {
    /// The room between two stanzas.
    Gap,
    Line {
        /// The kind of the catalogue the line's kind rests on: line, speaker, direction.
        base: &'static str,
        name: &'a str,
        content: &'a [Inline],
        indent: u32,
        margin: Option<&'a str>,
        shown: Option<&'a Shown>,
        /// The line before, where the line begins where it ended.
        before: Option<Before>,
    },
}

impl Converter<'_> {
    /// The kind of the catalogue a kind rests on: itself, or what a kind of
    /// the writer's own is based on; text for one that is not known.
    fn base_of(&self, name: &str) -> &'static str {
        self.extras.kinds.get(name).map_or("text", |info| info.base)
    }

    /// How the document groups paragraphs of a kind: `lines`, `quote`,
    /// `list`, `code`, `glossary`, or `none`.
    fn grouping(&self, name: &str) -> &'static str {
        match self.extras.kinds.get(name).map(|info| info.group) {
            Some(g @ ("lines" | "quote" | "list" | "code" | "glossary")) => g,
            _ => "none",
        }
    }

    /// Whether a kind of paragraph may also stand on words, as a speaker
    /// and a direction may: such paragraphs stand among lines of verse.
    fn on_words(&self, name: &str) -> bool {
        self.extras.kinds.get(name).is_some_and(|info| info.words)
    }

    /// Paragraphs that stand together, as the document groups them: cut
    /// into stretches by their numbering, and into runs by their kinds.
    /// `after` says that they follow a figure or an equation, after which
    /// the first paragraph of text begins as the first under a heading does.
    pub(super) fn paragraphs(&self, list: &[Block], after: bool, out: &mut Vec<Value>) {
        // The stretches, and the room between them, in order.
        let mut segments: Vec<(usize, usize, Option<super::numbers::Stretch>)> = Vec::new();
        let mut at = 0;
        for s in stretches(list) {
            if s.from > at {
                segments.push((at, s.from, None));
            }
            segments.push((s.from, s.to, Some(s)));
            at = s.to;
        }
        if at < list.len() {
            segments.push((at, list.len(), None));
        }
        let counted = |name: &str| self.extras.kinds.get(name).is_none_or(|info| info.counted);
        let mut first = after;
        for (from, to, stretch) in segments {
            let blocks = &list[from..to];
            let both: Vec<(&str, &[Inline])> = blocks
                .iter()
                .filter_map(|b| match b {
                    Block::Paragraph { name, content, .. } => Some((name.as_str(), content.as_slice())),
                    _ => None,
                })
                .collect();
            let (shown, side) = match stretch {
                Some(s) if s.numbering != Numbering::None => {
                    let every = s.every.filter(|e| *e > 0).unwrap_or(self.extras.verse.every);
                    (
                        stretch_numbers(&both, s.numbering, every, s.only, s.begins, &counted),
                        s.side.unwrap_or(self.extras.verse.side),
                    )
                }
                _ => (vec![Vec::new(); both.len()], self.extras.verse.side),
            };
            let paras: Vec<Para> = blocks
                .iter()
                .zip(&shown)
                .filter_map(|(b, shown)| match b {
                    Block::Paragraph { name, indent, new, done, rich, hand, content, .. } => Some(Para {
                        name,
                        indent: *indent,
                        new: *new,
                        done: *done,
                        boxed: rich.is_some(),
                        hand: hand.as_deref().filter(|h| rich.is_some() && !h.is_empty()),
                        content,
                        shown,
                    }),
                    _ => None,
                })
                .collect();
            for (group, from, to) in self.runs(&paras) {
                let run = &paras[from..to];
                if std::mem::take(&mut first)
                    && group == "none"
                    && run[0].name == "text"
                    && run[0].indent == 0
                    && run[0].shown.iter().all(Option::is_none)
                {
                    let inner = self.lined(run[0].content, Numbers { shown: run[0].shown, side });
                    if !inner.is_empty() {
                        self.handed(run[0].hand, vec![self.paragraph_after(inner)], BODY_TEXT, out);
                    } else if run[0].boxed {
                        out.push(blank_line());
                    }
                    continue;
                }
                self.run(group, run, side, out);
            }
        }
    }

    /// The runs of paragraphs of a stretch, or of paragraphs outside any:
    /// as `(grouping, from, to)`. Paragraphs whose kinds are grouped alike
    /// and stand together are one run, unless one says it begins a new one;
    /// a paragraph whose kind is grouped as nothing is a run of its own.
    /// Speakers and directions stand in the run of lines they are in, or
    /// in the one that begins after them.
    fn runs(&self, paras: &[Para]) -> Vec<(&'static str, usize, usize)> {
        let n = paras.len();
        // Where the speakers and directions that begin at `i` end.
        let words_end = |i: usize| {
            let mut k = i;
            while k < n && self.on_words(paras[k].name) && self.grouping(paras[k].name) != "lines" {
                k += 1;
            }
            k
        };
        let mut out = Vec::new();
        let mut i = 0;
        while i < n {
            let group = self.grouping(paras[i].name);
            let opens_lines = group == "lines" || {
                let k = words_end(i);
                k > i && k < n && self.grouping(paras[k].name) == "lines"
            };
            if opens_lines {
                let from = i;
                // The speakers and directions before the first stanza, and the stanza.
                i = words_end(i) + 1;
                while i < n && !paras[i].new {
                    if self.grouping(paras[i].name) == "lines" {
                        i += 1;
                        continue;
                    }
                    let k = words_end(i);
                    if k == i {
                        break;
                    }
                    // Speakers before a stanza that begins a run of its own go with it.
                    if k < n && self.grouping(paras[k].name) == "lines" && paras[k].new {
                        break;
                    }
                    i = k;
                }
                out.push(("lines", from, i));
                continue;
            }
            let from = i;
            i += 1;
            if group != "none" {
                while i < n && !paras[i].new && self.grouping(paras[i].name) == group {
                    i += 1;
                }
            }
            out.push((group, from, i));
        }
        out
    }

    /// A run of paragraphs, as its grouping asks.
    fn run(&self, group: &str, run: &[Para], side: Side, out: &mut Vec<Value>) {
        match group {
            "lines" => self.lines(run, side, out),
            "quote" => {
                let mut inner = Vec::new();
                for p in run {
                    let mut own = Vec::new();
                    self.kind_paragraph(p.name, p.content, Numbers { shown: p.shown, side }, p.indent, &mut own);
                    self.handed(p.hand, own, "Block Text", &mut inner);
                }
                if !inner.is_empty() {
                    out.push(json!({"t": "BlockQuote", "c": inner}));
                }
            }
            "list" => self.list(run, side, out),
            "code" => {
                let text: Vec<String> = run.iter().map(|p| code_text(p.content)).collect();
                let text = text.join("\n");
                if !text.trim().is_empty() {
                    out.push(json!({"t": "CodeBlock", "c": [attr(), text.trim_end()]}));
                }
            }
            "glossary" => self.glossary(run, side, out),
            _ => {
                for p in run {
                    let mut own = Vec::new();
                    self.kind_paragraph(p.name, p.content, Numbers { shown: p.shown, side }, p.indent, &mut own);
                    // In a box of rich text an empty paragraph is a blank line, as those it is for make room.
                    if own.is_empty() && p.boxed && p.name == "text" {
                        own.push(blank_line());
                    }
                    self.handed(p.hand, own, BODY_TEXT, out);
                }
            }
        }
    }

    /// What a paragraph was written as, standing as its writer set it by
    /// hand (ADR 0113), where anything is: laid over what the layout gives
    /// its kind, each measure only where it is said. In Typst, in LaTeX,
    /// and on a page of the web and in a book for e-readers; Markdown has
    /// nothing to say it with, and Word and Writer are given it in named
    /// styles (`styled`).
    ///
    /// `base` is the style of Word and Writer that a paragraph of what was
    /// written is in where it names none itself: that of text, or that of a
    /// quotation.
    fn handed(&self, hand: Option<&Hand>, own: Vec<Value>, base: &str, out: &mut Vec<Value>) {
        let Some(hand) = hand.filter(|_| !own.is_empty()) else {
            out.extend(own);
            return;
        };
        let x = &self.extras;
        match x.flavour {
            Flavour::Typst => {
                let (open, close) = hand_typst(hand);
                out.push(raw("typst", open));
                out.extend(own);
                out.push(raw("typst", close));
            }
            Flavour::Latex => {
                let (open, close) = hand_latex(hand);
                out.push(raw("latex", open));
                out.extend(own);
                out.push(raw("latex", close));
            }
            Flavour::Plain if x.classes => {
                let (classes, style) = hand_css(hand);
                out.push(json!({"t": "Div", "c": [["", classes, [["style", style]]], own]}));
            }
            Flavour::Docx | Flavour::Odt => out.extend(own.into_iter().map(|block| self.styled(hand, block, base))),
            Flavour::Plain => out.extend(own),
        }
    }

    /// A block as Word and Writer are given it where its paragraph stands
    /// by hand: in a style made for it, based on the style it would have
    /// had, with what was said (`export/reference.rs`). A paragraph in a
    /// style of its kind, or the first after a heading, is in a division
    /// that names that style: the name is changed for the made one. A
    /// paragraph of text is put in one, based on the style of text.
    fn styled(&self, hand: &Hand, block: Value, base: &str) -> Value {
        let record = |base: &str| {
            let name = hand_style_name(base, hand);
            let mut styles = self.extras.hand_styles.borrow_mut();
            styles.paragraphs.entry(name.clone()).or_insert_with(|| (base.to_owned(), hand.clone()));
            name
        };
        match block["t"].as_str() {
            Some("Para" | "Plain") => {
                let name = record(base);
                json!({"t": "Div", "c": [["", [], [["custom-style", name]]], [block]]})
            }
            Some("Div") => {
                let mut block = block;
                let base = block["c"][0][2].as_array().and_then(|attrs| {
                    attrs.iter().find(|a| a[0] == "custom-style").and_then(|a| a[1].as_str()).map(str::to_owned)
                });
                if let Some(base) = base {
                    let name = record(&base);
                    if let Some(attrs) = block["c"][0][2].as_array_mut() {
                        for a in attrs.iter_mut().filter(|a| a[0] == "custom-style") {
                            a[1] = json!(name);
                        }
                    }
                }
                block
            }
            _ => block,
        }
    }

    /// The inlines of a paragraph, line by line, each with what stands
    /// beside it: its number, and the words in its margin.
    pub(super) fn lined(&self, content: &[Inline], numbers: Numbers) -> Vec<Value> {
        self.lined_in(content, numbers, 0, true)
    }

    /// The inlines of a paragraph set in `steps` steps, line by line, as
    /// `lined`: a line that begins where the line before ended set in by
    /// that line's room. In Word and Writer the steps are spaces at the head
    /// of every line; elsewhere what holds the paragraph sets it in. Where
    /// `record` holds, the lines are kept as the line before for those that
    /// follow, as a speaker's or a direction's are not.
    fn lined_in(&self, content: &[Inline], numbers: Numbers, steps: u32, record: bool) -> Vec<Value> {
        let spaced = matches!(self.extras.flavour, Flavour::Docx | Flavour::Odt);
        let mut out = Vec::new();
        for (j, line) in lines_of(content).iter().enumerate() {
            if j > 0 {
                out.push(json!({"t": "LineBreak"}));
            }
            let before = self.before_if(line.mark.is_some_and(|m| m.continues));
            let mut inset = Vec::new();
            if spaced && steps > 0 {
                inset.push(hard_spaces(steps as usize * 4));
            }
            if let Some(before) = &before {
                inset.extend(self.after(before, steps));
            }
            let mut inner = self.inlines(line.content);
            let beside = Beside {
                number: numbers.shown.get(j).and_then(Option::as_ref),
                side: numbers.side,
                margin: line.mark.and_then(|m| m.margin),
                inset,
            };
            self.beside(&mut inner, &beside);
            out.extend(inner);
            if record && !line.blank {
                self.extras.line_before.replace(Some(Before {
                    steps,
                    base: steps,
                    after: before.map(Box::new),
                    words: words_of(line.content),
                }));
            }
        }
        out
    }

    /// The line before, where a line begins where it ended; nothing where it does not, or none stands before it.
    fn before_if(&self, continues: bool) -> Option<Before> {
        if continues { self.extras.line_before.borrow().clone() } else { None }
    }

    /// The step of an indent so many times, as a length every kind of document reads: `1.2cm`.
    fn steps(&self, n: i64) -> String {
        let step = self.extras.step;
        crate::formats::Length { value: step.value * n as f32, ..step }.to_string()
    }

    /// The room of the line before, for a line that begins where it ended
    /// and stands `base` steps in from the edge of the text: the line
    /// before's own steps, what set it in, its words, and an em. In Typst
    /// and LaTeX the words are measured and not set; in a page of the web
    /// they are set and not seen; in Word and Writer, which measure nothing,
    /// they are two spaces that do not break for each of their characters,
    /// as their typesetters want it.
    fn after(&self, before: &Before, base: u32) -> Vec<Value> {
        match self.extras.flavour {
            Flavour::Typst => {
                let mut out = vec![raw_inline("typst", "#gk-after[")];
                out.extend(self.measured(before, base));
                out.push(raw_inline("typst", "];"));
                out
            }
            Flavour::Latex => {
                let mut out = vec![raw_inline("latex", "\\settowidth{\\gkafter}{")];
                out.extend(self.measured(before, base));
                out.push(raw_inline("latex", "}\\hspace*{\\dimexpr\\gkafter+1em\\relax}"));
                out
            }
            Flavour::Plain if self.extras.classes => {
                vec![json!({"t": "Span", "c": [["", ["gk-after"], []], self.measured(before, base)]})]
            }
            _ => vec![hard_spaces(self.spaces_of(before, base) + 2)],
        }
    }

    /// The line before as what is measured: its own steps from `base`, what set it in, and its words.
    fn measured(&self, before: &Before, base: u32) -> Vec<Value> {
        let mut out = Vec::new();
        let from = i64::from(before.steps) - i64::from(base);
        if from != 0 {
            match self.extras.flavour {
                Flavour::Typst => out.push(raw_inline("typst", format!("#h({});", self.steps(from)))),
                Flavour::Latex => out.push(raw_inline("latex", format!("\\hspace*{{{}}}", self.steps(from)))),
                _ => out.push(json!({"t": "Span", "c": [["", [], [["style", format!("margin-left: {}", self.steps(from))]]], []]})),
            }
        }
        if let Some(after) = &before.after {
            out.extend(self.after(after, before.base));
        }
        out.extend(self.inlines(&before.words));
        out
    }

    /// How many spaces stand for the line before in Word and Writer: four for a step, and two for a character.
    fn spaces_of(&self, before: &Before, base: u32) -> usize {
        let steps = before.steps.saturating_sub(base) as usize * 4;
        let after = before.after.as_ref().map_or(0, |a| self.spaces_of(a, before.base) + 2);
        steps + after + 2 * chars_of(&before.words)
    }

    /// A break of the page or of the column, as each kind of document has
    /// it. Where a kind of document has no columns, a break of the column
    /// is one of the page, as Typst and Word make it; a page of the web and
    /// an e-book are told by their style, and Markdown has a break of the
    /// page as TeX writes it, and none of the column.
    pub(super) fn break_block(&self, what: BreakKind, out: &mut Vec<Value>) {
        let column = what == BreakKind::Column;
        let x = &self.extras;
        match x.flavour {
            // Typst allows no break within a block; there it is left out.
            Flavour::Typst if x.contained.get() => {}
            Flavour::Typst => out.push(raw("typst", if column { "#colbreak()" } else { "#pagebreak()" })),
            Flavour::Latex if column && x.columns > 1 => out.push(raw("latex", "\\columnbreak")),
            // Within `multicols` a new page is begun outside it, where the body is not within a group.
            Flavour::Latex if x.columns > 1 && !x.contained.get() => out
                .push(raw("latex", format!("\\end{{multicols}}\\newpage\\begin{{multicols}}{{{}}}", x.columns.min(4)))),
            Flavour::Latex => out.push(raw("latex", "\\newpage")),
            Flavour::Docx => out.push(raw(
                "openxml",
                format!("<w:p><w:r><w:br w:type=\"{}\"/></w:r></w:p>", if column { "column" } else { "page" }),
            )),
            Flavour::Odt => out.push(raw(
                "opendocument",
                format!("<text:p text:style-name=\"{}\"/>", if column { "Column_20_Break" } else { "Page_20_Break" }),
            )),
            Flavour::Plain if x.classes => out.push(raw(
                "html",
                format!("<div style=\"break-before: {}\"></div>", if column { "column" } else { "page" }),
            )),
            Flavour::Plain if !column => out.push(raw("latex", "\\newpage")),
            Flavour::Plain => {}
        }
    }

    /// Lines of verse: a line block, or the blocks of Typst and the
    /// paragraphs of LaTeX that stand for one. Each paragraph of verse is a
    /// stanza, with room between it and the next; a speaker or a direction
    /// among them a line of its kind.
    fn lines(&self, run: &[Para], side: Side, out: &mut Vec<Value>) {
        let mut items: Vec<VerseItem> = Vec::new();
        let mut stanza_before = false;
        for p in run {
            let base = match self.base_of(p.name) {
                b @ ("speaker" | "direction") => b,
                _ if self.on_words(p.name) => "speaker",
                _ => "line",
            };
            let stanza = base == "line";
            if stanza && stanza_before && !matches!(items.last(), None | Some(VerseItem::Gap)) {
                items.push(VerseItem::Gap);
            }
            stanza_before = stanza;
            for (j, line) in lines_of(p.content).into_iter().enumerate() {
                let shown = p.shown.get(j).and_then(Option::as_ref);
                let margin = line.mark.and_then(|m| m.margin);
                // An empty line is the room between two stanzas.
                if line.blank && margin.is_none() && shown.is_none() {
                    if !matches!(items.last(), None | Some(VerseItem::Gap)) {
                        items.push(VerseItem::Gap);
                    }
                    continue;
                }
                let indent = line.mark.map_or(0, |m| m.indent);
                // A line of verse may begin where the line before ended; it is then the line before of the next.
                let before = if base == "line" { self.before_if(line.mark.is_some_and(|m| m.continues)) } else { None };
                if base == "line" && !line.blank {
                    self.extras.line_before.replace(Some(Before {
                        steps: indent,
                        base: 0,
                        after: before.clone().map(Box::new),
                        words: words_of(line.content),
                    }));
                }
                items.push(VerseItem::Line {
                    base,
                    name: p.name,
                    content: line.content,
                    indent,
                    margin,
                    shown,
                    before,
                });
            }
        }
        while matches!(items.last(), Some(VerseItem::Gap)) {
            items.pop();
        }
        if items.is_empty() {
            return;
        }
        let x = &self.extras;
        let line_look = x.kinds.get("line").map(|info| &info.look);
        match x.flavour {
            Flavour::Typst => {
                // The numbers are counted here, and each line is given what it shows,
                // and a label of its kind, by which the preview names the line.
                out.push(raw("typst", "#gk-verse["));
                for item in &items {
                    let VerseItem::Line { base, name, content, indent, margin, shown, before } = item else {
                        out.push(raw("typst", "#v(1em)"));
                        continue;
                    };
                    let n = shown.map_or("none".to_owned(), |s| string(&s.label));
                    let margin = margin.map_or("none".to_owned(), string);
                    let rest = format!(", n: {n}, margin: {margin}, side: \"{}\")[", side.name());
                    match before {
                        None => out.push(raw("typst", format!("#gk-line(\"{base}\", {indent}{rest}"))),
                        // The line before, measured as it stands from the edge of the verse.
                        Some(before) => {
                            let mut head =
                                vec![raw_inline("typst", format!("#gk-line(\"{base}\", {indent}, after: ["))];
                            head.extend(self.measured(before, 0));
                            head.push(raw_inline("typst", format!("]{rest}")));
                            out.push(json!({"t": "Plain", "c": head}));
                        }
                    }
                    out.push(json!({"t": "Plain", "c": self.inlines(content)}));
                    out.push(raw("typst", format!("] <gk-line-{}>", label(name))));
                }
                out.push(raw("typst", "]"));
            }
            Flavour::Latex => {
                // Each line a paragraph of its own, in a group that moves the
                // lines in as far as the look of a line says; the number hangs
                // in the margin on its side, and words in the margin on the other.
                // A line is set in by its steps after what hangs in its margin,
                // so that the numbers stand in one column.
                let indent = line_look.map_or("2.4em".to_owned(), |l| l.indent_left.to_string());
                out.push(raw("latex", format!("{{\\par\\leftskip={indent}\\relax\\parindent=0pt\\parskip=0pt")));
                for item in &items {
                    let VerseItem::Line { base, name, content, indent, margin, shown, before } = item else {
                        out.push(raw("latex", "\\vspace{\\baselineskip}"));
                        continue;
                    };
                    let mut inner = self.inlines(content);
                    // The space keeps the command apart from a first word that follows it.
                    let mut lead = vec![raw_inline("latex", "\\noindent ")];
                    let mut inset = Vec::new();
                    match *base {
                        "speaker" => {
                            lead = vec![raw_inline("latex", "\\medskip\\noindent ")];
                            inner = self.line_words(inner, name);
                        }
                        "direction" => inner = self.line_words(inner, name),
                        _ => {
                            if *indent > 0 {
                                inset.push(raw_inline(
                                    "latex",
                                    format!("\\hspace*{{{}}}", self.steps(i64::from(*indent))),
                                ));
                            }
                        }
                    }
                    if let Some(before) = before {
                        inset.extend(self.after(before, 0));
                    }
                    inner.splice(0..0, lead);
                    self.beside(&mut inner, &Beside { number: *shown, side, margin: *margin, inset });
                    inner.push(raw_inline("latex", "\\par"));
                    out.push(json!({"t": "Plain", "c": inner}));
                }
                out.push(raw("latex", "\\par}\\medskip"));
            }
            _ => {
                // A line block: lines, each as its kind has it, and an empty
                // line between two stanzas. Indentation is spaces that do not
                // break, which Pandoc keeps at the head of a line; a number
                // stands at the head of its line or at its end, small, and
                // words in the margin at the other end: Word and Writer have
                // no margin to set them in.
                let mut block = Vec::new();
                for item in &items {
                    let VerseItem::Line { base, name, content, indent, margin, shown, before } = item else {
                        block.push(json!([]));
                        continue;
                    };
                    let mut inner = self.inlines(content);
                    if *base != "line" {
                        inner = self.line_words(inner, name);
                    }
                    let mut inset = Vec::new();
                    if *indent > 0 {
                        inset.push(hard_spaces(*indent as usize * 4));
                    }
                    if let Some(before) = before {
                        inset.extend(self.after(before, 0));
                    }
                    self.beside(&mut inner, &Beside { number: *shown, side, margin: *margin, inset });
                    block.push(Value::Array(inner));
                }
                let lines = json!({"t": "LineBlock", "c": block});
                // In Word and Writer the block is a paragraph in the style of a line.
                match (x.flavour, x.kinds.get("line")) {
                    (Flavour::Docx | Flavour::Odt, Some(info)) if !info.style.is_empty() => out.push(json!({
                        "t": "Div",
                        "c": [["", ["gk-kind-line"], [["custom-style", info.style]]], [lines]],
                    })),
                    _ => out.push(lines),
                }
            }
        }
    }

    /// A speaker's name or a stage direction within a line block, as its
    /// kind is set: by a character style in Word and Writer, which the
    /// reference document defines beside the paragraph style of the kind,
    /// and by its look elsewhere.
    fn line_words(&self, inner: Vec<Value>, kind: &str) -> Vec<Value> {
        let Some(info) = self.extras.kinds.get(kind) else { return inner };
        match self.extras.flavour {
            Flavour::Docx | Flavour::Odt if !info.style.is_empty() => {
                let style = format!("{} Char", info.style);
                vec![
                    json!({"t": "Span", "c": [["", [format!("gk-kind-{}", label(kind))], [["custom-style", style]]], inner]}),
                ]
            }
            _ => {
                let mut inner = inner;
                if info.look.case == Case::Upper {
                    upper(&mut inner);
                }
                looked(inner, &info.look)
            }
        }
    }

    /// Puts what stands beside a line into it: the number on its side, the
    /// words in the margin on the side the layout says, across from the
    /// numbers unless it says otherwise. In Typst and LaTeX they are placed
    /// in the margin, each at the layout's length from the text, the
    /// annotations outside the numbers where both stand on one side, by the
    /// length the layout gives them there (ADR 0076); in Word, Writer and the formats made from a
    /// line block they stand at the head of the line or at its end. What
    /// sets the line in stands after what hangs at its left, before its
    /// words: in LaTeX after the command that begins the line too.
    pub(super) fn beside(&self, inner: &mut Vec<Value>, beside: &Beside) {
        // After what begins the line, before its words: found before anything is put at its end.
        let begun = if self.extras.flavour == Flavour::Latex {
            inner.iter().take_while(|v| v["t"] == "RawInline").count()
        } else {
            0
        };
        if beside.is_empty() {
            inner.splice(begun..begun, beside.inset.iter().cloned());
            return;
        }
        // What stands at each side, from the text outwards: its words, and whether they are the margin's.
        let notes = self.extras.verse.annotations_beside(beside.side);
        let mut left: Vec<(&str, bool)> = Vec::new();
        let mut right: Vec<(&str, bool)> = Vec::new();
        if let Some(number) = beside.number {
            if beside.side == Side::Left { &mut left } else { &mut right }.push((number.label.as_str(), false));
        }
        if let Some(margin) = beside.margin {
            if notes == Side::Left { &mut left } else { &mut right }.push((margin, true));
        }
        // How far each stands from the text, the layout's lengths (ADR 0076): the same on every
        // line, so that an annotation stands where it does whether or not the line shows its number.
        let numbers_gap = self.extras.verse.numbers_gap();
        let annotations_gap = self.extras.verse.annotations_gap(beside.side);
        let gap = |margin: bool| if margin { annotations_gap } else { numbers_gap };
        match self.extras.flavour {
            Flavour::Typst => {
                // Placed from where the paragraph begins, taking no room in the line.
                let call = |side: &str, text: &str, margin: bool| {
                    let body = if margin {
                        format!("gk-margin({})", string(text))
                    } else {
                        format!("gk-number({})", string(text))
                    };
                    raw_inline("typst", format!("#gk-beside(\"{side}\", {}, {body});", gap(margin)))
                };
                let calls: Vec<Value> = (left.iter().map(|(t, m)| call("left", t, *m)))
                    .chain(right.iter().map(|(t, m)| call("right", t, *m)))
                    .chain(beside.inset.iter().cloned())
                    .collect();
                inner.splice(0..0, calls);
            }
            Flavour::Latex => {
                let shape = |margin: bool| if margin { "\\footnotesize\\itshape " } else { "\\footnotesize " };
                if !right.is_empty() {
                    inner.push(raw_inline("latex", "\\nobreak\\hfill"));
                    for (text, margin) in &right {
                        let gap = gap(*margin);
                        inner.push(raw_inline("latex", format!("\\rlap{{\\hspace{{{gap}}}{}", shape(*margin))));
                        inner.extend(words(text));
                        inner.push(raw_inline("latex", "}"));
                    }
                }
                let mut laps = Vec::new();
                for (text, margin) in &left {
                    let gap = gap(*margin);
                    laps.push(raw_inline("latex", format!("\\llap{{{{{}", shape(*margin))));
                    laps.extend(words(text));
                    laps.push(raw_inline("latex", format!("}}\\hspace{{{gap}}}}}")));
                }
                laps.extend(beside.inset.iter().cloned());
                inner.splice(begun..begun, laps);
            }
            _ => {
                let span = |text: &str, margin: bool, gap_before: bool| {
                    let (class, style) =
                        if margin { ("verse-margin", "Verse Margin") } else { ("verse-number", "Verse Number") };
                    // The gap between it and the words of the line stands within the span.
                    let gap = "\u{a0}\u{a0}";
                    let inner = match (margin, gap_before) {
                        (true, true) => vec![json!({"t": "Str", "c": gap}), json!({"t": "Emph", "c": words(text)})],
                        (true, false) => vec![json!({"t": "Emph", "c": words(text)}), json!({"t": "Str", "c": gap})],
                        (false, true) => vec![json!({"t": "Str", "c": format!("{gap}{text}")})],
                        (false, false) => vec![json!({"t": "Str", "c": format!("{text}{gap}")})],
                    };
                    vec![json!({"t": "Span", "c": [["", [class], [["custom-style", style]]], inner]})]
                };
                // At the end, from the text outwards; at the head, the outermost first.
                for (text, margin) in &right {
                    inner.extend(span(text, *margin, true));
                }
                let head: Vec<Value> = left
                    .iter()
                    .rev()
                    .flat_map(|(text, margin)| span(text, *margin, false))
                    .chain(beside.inset.iter().cloned())
                    .collect();
                inner.splice(0..0, head);
            }
        }
    }

    /// A list: the items as a bullet or a numbered list, those indented
    /// further a list within the item before them. A run of items of the
    /// other kind at the same depth is a list of its own.
    fn list(&self, paras: &[Para], side: Side, out: &mut Vec<Value>) {
        let mut at = 0;
        while at < paras.len() {
            let (list, next) = self.list_from(paras, at, paras[at].indent, side);
            out.push(list);
            at = next.max(at + 1);
        }
    }

    /// The list that begins at `at`, of the items at `level` of the kind of
    /// the first, each with the items indented further as a list within it;
    /// it ends before an item that stands shallower, or one of the other
    /// kind at this depth. Returns the list and where to go on from. A
    /// numbered list begins at the number given its first item, where its
    /// lines are not numbered.
    fn list_from(&self, paras: &[Para], at: usize, level: u32, side: Side) -> (Value, usize) {
        let numbered = |p: &Para| self.base_of(p.name) == "numbered";
        let kind = numbered(&paras[at]);
        let start = if paras[at].shown.is_empty() {
            list_start(lines_of(paras[at].content).first().and_then(|l| l.mark).and_then(|m| m.number))
        } else {
            1
        };
        let mut items = Vec::new();
        let mut i = at;
        while i < paras.len() {
            let p = &paras[i];
            if p.indent < level || (i > at && p.indent == level && numbered(p) != kind) {
                break;
            }
            let mut words = self.lined(p.content, Numbers { shown: p.shown, side });
            // A point to tick begins with its box, as Pandoc writes a list to tick, which every
            // kind of document then shows as a box.
            if self.base_of(p.name) == "todo" {
                let sign = if p.done { "\u{2612}" } else { "\u{2610}" };
                words.splice(0..0, [json!({"t": "Str", "c": sign}), json!({"t": "Space"})]);
            }
            let mut inner = vec![json!({"t": "Plain", "c": words})];
            i += 1;
            while i < paras.len() && paras[i].indent > level {
                let (sub, next) = self.list_from(paras, i, paras[i].indent, side);
                inner.push(sub);
                i = next;
            }
            items.push(Value::Array(inner));
        }
        let list = if kind {
            json!({"t": "OrderedList", "c": [[start, {"t": "Decimal"}, {"t": "Period"}], items]})
        } else {
            json!({"t": "BulletList", "c": items})
        };
        (list, i)
    }

    /// A glossary: a description list, each headword a term and the glosses
    /// after it its definitions, each a paragraph.
    fn glossary(&self, paras: &[Para], side: Side, out: &mut Vec<Value>) {
        let mut items: Vec<(Vec<Value>, Vec<Value>)> = Vec::new();
        for p in paras {
            let inner = self.lined(p.content, Numbers { shown: p.shown, side });
            if self.base_of(p.name) == "headword" {
                items.push((inner, Vec::new()));
                continue;
            }
            if items.is_empty() {
                items.push((Vec::new(), Vec::new()));
            }
            if !inner.is_empty()
                && let Some((_, definitions)) = items.last_mut()
            {
                definitions.push(json!([{"t": "Para", "c": inner}]));
            }
        }
        let items: Vec<Value> = items.into_iter().map(|(term, definitions)| json!([term, definitions])).collect();
        if !items.is_empty() {
            out.push(json!({"t": "DefinitionList", "c": items}));
        }
    }

    /// A paragraph of a kind, set as the kind's look says: in Typst by the
    /// opening of the document, in LaTeX by what is written around it, in
    /// Word and Writer by a paragraph style named after the kind, and
    /// elsewhere as plainly as the look can be shown. A paragraph of text or
    /// of a quotation is a plain paragraph, which what calls this puts where
    /// it belongs; one of code a code block; a break the sign of its look.
    /// What stands beside its lines, where they are numbered, goes in. A
    /// paragraph set in with Tab is set in by so many steps (ADR 0067): in
    /// Typst within a block, in LaTeX by its left skip, on a page of the web
    /// within a division, and in Word and Writer by spaces at the head of
    /// each line; Markdown has nothing to set it in by.
    pub(super) fn kind_paragraph(
        &self,
        name: &str,
        content: &[Inline],
        numbers: Numbers,
        steps: u32,
        out: &mut Vec<Value>,
    ) {
        let mut own = Vec::new();
        self.kind_paragraph_in(name, content, numbers, steps, &mut own);
        if steps == 0 || own.is_empty() {
            out.extend(own);
            return;
        }
        let x = &self.extras;
        match x.flavour {
            Flavour::Typst => {
                out.push(raw("typst", format!("#block(inset: (left: {}))[", self.steps(i64::from(steps)))));
                out.extend(own);
                out.push(raw("typst", "]"));
            }
            Flavour::Plain if x.classes => out.push(json!({"t": "Div", "c": [
                ["", [], [["style", format!("padding-left: {}", self.steps(i64::from(steps)))]]],
                own,
            ]})),
            _ => out.extend(own),
        }
    }

    /// A paragraph of a kind, as `kind_paragraph` has it, set in by `steps`
    /// in LaTeX and in Word and Writer: the others are set in around it.
    fn kind_paragraph_in(&self, name: &str, content: &[Inline], numbers: Numbers, steps: u32, out: &mut Vec<Value>) {
        let x = &self.extras;
        // A note to oneself goes into no document.
        if name == "draft" {
            return;
        }
        // The lines of a speaker or a direction are no line before for a line that begins where one ended.
        let record = !self.on_words(name);
        let lined = |content: &[Inline]| self.lined_in(content, numbers, steps, record);
        // In LaTeX a paragraph set in stands in a group of its own, its left skip moved by the steps.
        let latex_steps = (x.flavour == Flavour::Latex && steps > 0).then(|| self.steps(i64::from(steps)));
        let grouped = |block: Value, out: &mut Vec<Value>| match &latex_steps {
            Some(by) => {
                out.push(raw("latex", format!("{{\\par\\advance\\leftskip by {by}\\relax")));
                out.push(block);
                out.push(raw("latex", "\\par}"));
            }
            None => out.push(block),
        };
        let Some(info) = x.kinds.get(name) else {
            let inner = lined(content);
            if !inner.is_empty() {
                grouped(json!({"t": "Para", "c": inner}), out);
            }
            return;
        };
        let look = &info.look;
        if matches!(name, "text" | "quote" | "item" | "numbered" | "todo") {
            let inner = lined(content);
            if !inner.is_empty() {
                grouped(json!({"t": "Para", "c": inner}), out);
            }
            return;
        }
        if info.base == "draft" {
            return;
        }
        if info.base == "code" {
            let text = code_text(content);
            if !text.trim().is_empty() {
                grouped(json!({"t": "CodeBlock", "c": [attr(), text.trim_end()]}), out);
            }
            return;
        }
        let mut inner = if info.base == "break" {
            // A break holds no text of its own: the layout says what stands in it.
            let sign = look.text.trim();
            words(if sign.is_empty() { "\u{a0}" } else { sign })
        } else {
            lined(content)
        };
        if inner.is_empty() {
            return;
        }
        if info.base == "parenthetical" {
            inner.insert(0, json!({"t": "Str", "c": "("}));
            inner.push(json!({"t": "Str", "c": ")"}));
        }
        if look.new_page
            && let Some(b) = &self.page_break
        {
            out.push(b.clone());
        }
        let class = format!("gk-kind-{}", label(name));
        match x.flavour {
            Flavour::Typst => {
                out.push(json!({"t": "Div", "c": [[class, [], []], [{"t": "Plain", "c": inner}]]}));
            }
            Flavour::Latex => {
                if look.case == Case::Upper {
                    upper(&mut inner);
                }
                let (mut open, close) = crate::export::latex::around(look, x.kinds.get("text").map(|t| &t.look));
                if let Some(by) = &latex_steps {
                    let _ = write!(open, "\\advance\\leftskip by {by}\\relax ");
                }
                inner.insert(0, raw_inline("latex", open));
                inner.push(raw_inline("latex", close));
                out.push(json!({"t": "Plain", "c": inner}));
            }
            Flavour::Docx | Flavour::Odt => {
                if info.style.is_empty() {
                    out.push(json!({"t": "Para", "c": inner}));
                } else {
                    out.push(json!({"t": "Div", "c": [["", [class], [["custom-style", info.style]]],
                        [{"t": "Para", "c": inner}]]}));
                }
            }
            Flavour::Plain => {
                if look.case == Case::Upper {
                    upper(&mut inner);
                }
                let inner = looked(inner, look);
                out.push(json!({"t": "Div", "c": [["", [class], []], [{"t": "Para", "c": inner}]]}));
            }
        }
    }

    pub(super) fn parallel(&self, left: &[Block], right: &[Block], out: &mut Vec<Value>) {
        // A break has no place within one side of two.
        let unbroken = |side: &[Block]| -> Vec<Block> {
            side.iter().filter(|b| !matches!(b, Block::Break { .. })).cloned().collect()
        };
        let contained = self.extras.contained.replace(true);
        // Each side begins where it begins: no line stands before its first.
        self.extras.line_before.borrow_mut().take();
        let mut l = Vec::new();
        self.blocks(&unbroken(left), &mut l);
        self.extras.line_before.borrow_mut().take();
        let mut r = Vec::new();
        self.blocks(&unbroken(right), &mut r);
        self.extras.contained.set(contained);
        match self.extras.flavour {
            Flavour::Typst => {
                out.push(raw("typst", "#gk-parallel(["));
                out.extend(l);
                out.push(raw("typst", "], ["));
                out.extend(r);
                out.push(raw("typst", "])"));
            }
            Flavour::Latex => {
                out.push(raw("latex", "\\noindent\\begin{minipage}[t]{0.48\\textwidth}"));
                out.extend(l);
                out.push(raw("latex", "\\end{minipage}\\hfill\\begin{minipage}[t]{0.48\\textwidth}"));
                out.extend(r);
                out.push(raw("latex", "\\end{minipage}\\par\\medskip"));
            }
            Flavour::Docx | Flavour::Odt | Flavour::Plain => {
                let cell = |blocks: Vec<Value>| {
                    let inner = if blocks.is_empty() { vec![json!({"t": "Plain", "c": []})] } else { blocks };
                    json!([attr(), {"t": "AlignLeft"}, 1, 1, inner])
                };
                out.push(json!({"t": "Table", "c": [
                    ["", ["gk-parallel"], []],
                    [null, []],
                    [[{"t": "AlignLeft"}, {"t": "ColWidth", "c": 0.5}], [{"t": "AlignLeft"}, {"t": "ColWidth", "c": 0.5}]],
                    [attr(), []],
                    [[attr(), 0, [], [[attr(), [cell(l), cell(r)]]]]],
                    [attr(), []],
                ]}));
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use super::super::fixtures::{kind, lines, mark, text};
    use super::super::pandoc::Extras;
    use super::*;
    use crate::formats::{DocumentFormat, Length};

    fn converter(keys: &HashMap<String, String>, flavour: Flavour) -> Converter<'_> {
        let mut extras = Extras::default();
        extras.flavour = flavour;
        extras.kinds = crate::formats::kinds::table(&DocumentFormat::default(), &[]);
        extras.step = DocumentFormat::default().text.indent_step;
        Converter {
            keys,
            language: Some("en-GB"),
            run_in: vec![],
            begins: Default::default(),
            page_break: None,
            deepest: 6,
            extras,
        }
    }

    fn written(c: &Converter, blocks: &[Block]) -> Vec<Value> {
        let mut out = Vec::new();
        c.blocks(blocks, &mut out);
        out
    }

    /// The raw lines of Typst or LaTeX among what is written.
    fn raws(out: &[Value]) -> Vec<&str> {
        out.iter().filter_map(|v| v["c"][1].as_str()).collect()
    }

    /// Paragraphs numbered together, every so many, on the side given.
    fn numbered(every: u32, side: Option<Side>, blocks: Vec<Block>) -> Vec<Block> {
        blocks.into_iter().map(|b| b.numbered(Numbering::Counted, Some(every), side)).collect()
    }

    /// A speaker, and a stanza of three lines, counted from 1: the
    /// second indented, the third with words in the margin.
    fn nurse(side: Option<Side>) -> Vec<Block> {
        numbered(
            2,
            side,
            vec![
                kind("speaker", vec![text("Nurse")]),
                lines(
                    "line",
                    vec![
                        (None, "If only"),
                        (Some(mark().indent(1).done()), "the Argo"),
                        (Some(mark().margin("ia.").done()), "had never flown"),
                    ],
                ),
            ],
        )
        .into_iter()
        .map(|b| b.counting_from("1"))
        .collect()
    }

    /// A text as the interface hands it over: a paragraph before a box of
    /// rich text, and in the box words set by hand, an empty paragraph, and
    /// paragraphs that stand by hand.
    fn by_hand() -> Vec<Block> {
        serde_json::from_value(json!([
            { "kind": "paragraph", "name": "text", "content": [{ "kind": "text", "text": "Before.", "marks": {} }] },
            { "kind": "paragraph", "name": "text", "rich": "first", "content": [
                { "kind": "text", "text": "Dear ", "marks": {} },
                { "kind": "text", "text": "all", "marks": {
                    "strong": true,
                    "font": { "family": "EB Garamond" }, "size": { "pt": 20 }, "colour": { "value": "#A02020" }
                } },
                { "kind": "text", "text": ", welcome.", "marks": { "size": { "pt": 10.5 } } }
            ] },
            { "kind": "paragraph", "name": "text", "rich": "in", "content": [] },
            { "kind": "paragraph", "name": "text", "rich": "in",
              "hand": { "align": "center", "lineSpacing": 1.5, "spaceBefore": "6pt", "spaceAfter": "12pt" },
              "content": [{ "kind": "text", "text": "Centred.", "marks": {} }] },
            { "kind": "paragraph", "name": "quote", "rich": "in",
              "hand": { "align": "justified", "indentLeft": "1cm", "firstLine": "0.5cm" },
              "content": [{ "kind": "text", "text": "Set in.", "marks": {} }] },
            { "kind": "paragraph", "name": "text", "rich": "in",
              "hand": { "align": "sideways", "lineSpacing": 90, "indentRight": "wide" },
              "content": [{ "kind": "text", "text": "Nothing said well.", "marks": {} }] },
            { "kind": "paragraph", "name": "text", "content": [] },
            { "kind": "paragraph", "name": "text", "hand": { "align": "right" },
              "content": [{ "kind": "text", "text": "Outside a box.", "marks": { "colour": { "value": "#a02020" } } }] }
        ]))
        .unwrap()
    }

    #[test]
    fn what_is_set_by_hand_of_words_is_set_in_typst() {
        let keys = HashMap::new();
        let c = converter(&keys, Flavour::Typst);
        let typst = flat(&Value::Array(written(&c, &by_hand())));
        // The font, the size and the colour about the words, and bold within them.
        assert!(
            typst.contains(
                "Dear #text(font: (\"EB Garamond\",), size: 20pt, fill: rgb(\"#a02020\"))[all];#text(size: 10.5pt)[, welcome.];"
            ),
            "{typst}"
        );
        // Markdown has the words alone.
        let plain = flat(&Value::Array(written(&converter(&keys, Flavour::Plain), &by_hand())));
        assert!(plain.contains("Dear all, welcome."), "{plain}");
        assert!(!plain.contains("#text"), "{plain}");
    }

    #[test]
    fn what_is_no_font_no_size_and_no_colour_is_not_set() {
        use super::super::pandoc::HandWords;
        let marks = |v: Value| serde_json::from_value::<std::collections::BTreeMap<String, Value>>(v).unwrap();
        let hand_text = |m: &std::collections::BTreeMap<String, Value>| HandWords::of(m).map(|said| said.typst());
        assert_eq!(hand_text(&marks(json!({ "strong": true }))), None);
        assert_eq!(
            hand_text(&marks(json!({
                "font": { "family": "Bad\"]; #panic()" }, "size": { "pt": 9000 }, "colour": { "value": "red" }
            }))),
            None
        );
        assert_eq!(hand_text(&marks(json!({ "size": { "pt": 12.26 } }))).as_deref(), Some("size: 12.5pt"));
        assert_eq!(
            hand_text(&marks(json!({ "font": { "family": " Noto Serif " } }))).as_deref(),
            Some("font: (\"Noto Serif\",)")
        );
    }

    #[test]
    fn a_paragraph_stands_as_it_was_set_by_hand_in_typst() {
        let keys = HashMap::new();
        let c = converter(&keys, Flavour::Typst);
        let out = written(&c, &by_hand());
        let said = raws(&out);
        // Across the line, its line spacing, and room before and after it, with nothing set about it.
        assert!(
            said.contains(&"#[#set align(center); #set par(justify: false); #set par(leading: 0.8em)\n#v(6pt)"),
            "{said:?}"
        );
        assert!(said.contains(&"#v(12pt)\n]"), "{said:?}");
        // Set in, within a quotation, it stands in a block of its own, its first line as far in as was said.
        let typst = flat(&Value::Array(out));
        assert!(
            typst.contains(
                "#[#set align(left); #set par(justify: true); #set par(first-line-indent: (amount: 0.5cm, all: true))\n#pad(left: 1cm, right: 0pt)[\nSet in.\n]\n]\n"
            ),
            "{typst}"
        );
        // What is said and is no measure is as if it were not said: nothing is set about that paragraph.
        assert_eq!(typst.matches("#[").count(), 2, "{typst}");
        assert!(typst.contains("\nNothing said well.\n"), "{typst}");
        // Outside a box nothing stands by hand, whatever the paragraph says.
        assert!(!typst.contains("align(right)"), "{typst}");
        // Markdown has nothing to say it with.
        let plain = written(&converter(&keys, Flavour::Plain), &by_hand());
        assert!(raws(&plain).iter().all(|r| !r.starts_with("#[")), "{plain:?}");
    }

    #[test]
    fn what_is_set_by_hand_is_set_in_latex() {
        let keys = HashMap::new();
        let latex = flat(&Value::Array(written(&converter(&keys, Flavour::Latex), &by_hand())));
        // The font where LaTeX takes the fonts of the computer and has this one; the size with its line; the colour.
        assert!(
            latex.contains(
                "Dear {\\ifdefined\\IfFontExistsTF\\IfFontExistsTF{EB Garamond}{\\fontspec{EB Garamond}}{}\\fi \\fontsize{20pt}{24pt}\\selectfont \\color[HTML]{A02020}all}{\\fontsize{10.5pt}{12.6pt}\\selectfont , welcome.}"
            ),
            "{latex}"
        );
        // A paragraph in a group of its own, with what was said and nothing else.
        assert!(
            latex.contains("{\\par\\vspace{6pt}\\centering\\setstretch{1.5} \nCentred.\n\\par\\vspace{12pt}}\n"),
            "{latex}"
        );
        assert!(
            latex.contains("{\\par\\ifdefined\\justifying\\justifying\\fi\\leftskip=1cm\\rightskip=0pt\\parindent=0.5cm \nSet in.\n\\par}\n"),
            "{latex}"
        );
        assert_eq!(latex.matches("{\\par").count(), 2, "{latex}");
        assert!(!latex.contains("raggedleft"), "outside a box nothing stands by hand: {latex}");
    }

    #[test]
    fn a_name_of_a_font_that_latex_would_read_as_its_own_signs_is_not_given_to_it() {
        use super::super::pandoc::HandWords;
        let marks = |v: Value| serde_json::from_value::<std::collections::BTreeMap<String, Value>>(v).unwrap();
        let said = HandWords::of(&marks(json!({ "font": { "family": "R&D 100%" }, "colour": { "value": "#00ff00" } })))
            .unwrap();
        assert_eq!(said.latex(), "{\\color[HTML]{00FF00}");
        assert_eq!(said.css(), "font-family: 'R&D 100%'; color: #00ff00");
    }

    #[test]
    fn what_is_set_by_hand_is_set_on_a_page_of_the_web_and_not_in_markdown() {
        let keys = HashMap::new();
        let mut c = converter(&keys, Flavour::Plain);
        c.extras.classes = true;
        let out = written(&c, &by_hand());
        let json = serde_json::to_string(&out).unwrap();
        // The words in a span with its style.
        assert!(
            json.contains(r##"["style","font-family: 'EB Garamond'; font-size: 20pt; color: #a02020"]"##),
            "{json}"
        );
        assert!(json.contains(r#"["style","font-size: 10.5pt"]"#), "{json}");
        // A paragraph in a division with its style; centred, its first line begins with the rest.
        assert!(
            json.contains(
                r#"["",["gk-hand","gk-hand-first"],[["style","text-align: center; line-height: 1.8; padding-top: 6pt; padding-bottom: 12pt; text-indent: 0pt"]]]"#
            ),
            "{json}"
        );
        assert!(
            json.contains(r#"["",["gk-hand","gk-hand-first"],[["style","text-align: justify; margin-left: 1cm; text-indent: 0.5cm"]]]"#),
            "{json}"
        );
        assert_eq!(json.matches("gk-hand\"").count(), 2, "{json}");
        // Markdown has the words, and nothing set by hand.
        let markdown = serde_json::to_string(&written(&converter(&keys, Flavour::Plain), &by_hand())).unwrap();
        assert!(!markdown.contains("style") && !markdown.contains("gk-hand"), "{markdown}");
        // Word and Writer are given what is set by hand in named styles, and nothing raw.
        let word = serde_json::to_string(&written(&converter(&keys, Flavour::Docx), &by_hand())).unwrap();
        assert!(!word.contains("RawInline") && !word.contains("gk-hand"), "{word}");
    }

    #[test]
    fn an_empty_paragraph_is_a_blank_line_in_a_box_of_rich_text_and_nothing_outside_one() {
        let keys = HashMap::new();
        for flavour in [Flavour::Typst, Flavour::Latex, Flavour::Docx, Flavour::Plain] {
            let out = written(&converter(&keys, flavour), &by_hand());
            let blank =
                out.iter().filter(|v| v["t"] == "Para" && v["c"] == json!([{ "t": "Str", "c": "\u{a0}" }])).count();
            assert_eq!(blank, 1, "{flavour:?}: {out:?}");
        }
    }

    #[test]
    fn a_verse_is_a_line_block_with_its_numbers_at_the_head_or_the_end() {
        let keys = HashMap::new();
        let c = converter(&keys, Flavour::Docx);
        let out = written(&c, &nurse(None));
        assert_eq!(out.len(), 1);
        // In the style of a line, as a line block.
        assert_eq!(out[0]["c"][0][2], json!([["custom-style", "Line"]]));
        let lines = out[0]["c"][1][0]["c"].as_array().unwrap();
        assert_eq!(lines.len(), 4);
        // The speaker in the character style the line block needs.
        assert_eq!(lines[0][0]["c"][0][2], json!([["custom-style", "Speaker Char"]]));
        // The count begins from 1, which is not shown, every second being shown.
        assert_eq!(lines[1][0]["c"], "If");
        // The second line counted shows its number; it is indented by spaces that do not break.
        assert_eq!(lines[2][0]["c"][0][2], json!([["custom-style", "Verse Number"]]));
        assert_eq!(lines[2][0]["c"][1][0]["c"], "2\u{a0}\u{a0}");
        assert_eq!(lines[2][1]["c"], "\u{a0}\u{a0}\u{a0}\u{a0}");
        // The third is not shown; its margin words stand at the end.
        let last = lines[3].as_array().unwrap();
        assert_eq!(last[0]["c"], "had");
        assert_eq!(last[last.len() - 1]["c"][0][2], json!([["custom-style", "Verse Margin"]]));
        // On the right side the number stands at the end and the margin words at the head.
        let out = written(&c, &nurse(Some(Side::Right)));
        let lines = out[0]["c"][1][0]["c"].as_array().unwrap();
        let second = lines[2].as_array().unwrap();
        assert_eq!(second[0]["c"], "\u{a0}\u{a0}\u{a0}\u{a0}");
        assert_eq!(second[second.len() - 1]["c"][0][2], json!([["custom-style", "Verse Number"]]));
        let last = lines[3].as_array().unwrap();
        assert_eq!(last[0]["c"][0][2], json!([["custom-style", "Verse Margin"]]));
    }

    #[test]
    fn a_verse_in_typst_and_latex() {
        let keys = HashMap::new();
        let verse = nurse(None);
        let c = converter(&keys, Flavour::Typst);
        let out = written(&c, &verse);
        assert_eq!(out[0]["c"][1], "#gk-verse[");
        assert_eq!(out[1]["c"][1], "#gk-line(\"speaker\", 0, n: none, margin: none, side: \"left\")[");
        assert_eq!(out[4]["c"][1], "#gk-line(\"line\", 0, n: none, margin: none, side: \"left\")[");
        assert_eq!(out[7]["c"][1], "#gk-line(\"line\", 1, n: \"2\", margin: none, side: \"left\")[");
        assert_eq!(out[10]["c"][1], "#gk-line(\"line\", 0, n: none, margin: \"ia.\", side: \"left\")[");
        // Each line labelled by its kind, by which the preview names it.
        assert_eq!(out[3]["c"][1], "] <gk-line-speaker>");
        assert_eq!(out[6]["c"][1], "] <gk-line-line>");
        let c = converter(&keys, Flavour::Latex);
        let out = written(&c, &verse);
        assert_eq!(
            out[0]["c"][1], "{\\par\\leftskip=1cm\\relax\\parindent=0pt\\parskip=0pt",
            "as far in as a line looks"
        );
        let first = out[1]["c"].as_array().unwrap();
        assert_eq!(first[0]["c"][1], "\\medskip\\noindent ");
        assert_eq!(first[1]["t"], "SmallCaps");
        // The number hangs in the margin first, and the line is set in by its step after it,
        // so that the numbers of lines set in stand in the column of the others.
        let third = out[3]["c"].as_array().unwrap();
        assert_eq!(third[1]["c"][1], "\\llap{{\\footnotesize ");
        assert_eq!(third[2]["c"], "2");
        assert_eq!(third[4]["c"][1], "\\hspace*{0.6cm}");
    }

    /// A speaker's first half of a line, a second speaker, and the second half.
    fn shared() -> Vec<Block> {
        vec![
            lines("line", vec![(None, "Is it you,")]),
            kind("speaker", vec![text("Ismene")]),
            lines("line", vec![(Some(mark().continues().done()), "my sister?")]),
        ]
    }

    /// What is written, as plain text: raw lines and words as they stand, a span of a class as `[class:words]`.
    fn flat(v: &Value) -> String {
        match v {
            Value::Array(items) => items.iter().map(flat).collect(),
            Value::Object(o) => match o.get("t").and_then(Value::as_str) {
                Some("RawInline") => o["c"][1].as_str().unwrap_or("").to_owned(),
                Some("RawBlock") => format!("{}\n", o["c"][1].as_str().unwrap_or("")),
                Some("Str") => o["c"].as_str().unwrap_or("").to_owned(),
                Some("Space") => " ".to_owned(),
                Some("Span") => {
                    let classes: Vec<&str> = o["c"][0][1]
                        .as_array()
                        .map(|c| c.iter().filter_map(Value::as_str).collect())
                        .unwrap_or_default();
                    let inner = flat(&o["c"][1]);
                    if classes.is_empty() { inner } else { format!("[{}:{inner}]", classes.join(" ")) }
                }
                Some("Plain" | "Para") => format!("{}\n", flat(&o["c"])),
                Some("LineBlock") => o["c"]
                    .as_array()
                    .map(|ls| ls.iter().map(|l| format!("{}\n", flat(l))).collect())
                    .unwrap_or_default(),
                Some("Div") => flat(&o["c"][1]),
                Some(_) => o.get("c").map(flat).unwrap_or_default(),
                None => String::new(),
            },
            _ => String::new(),
        }
    }

    #[test]
    fn a_line_that_begins_where_the_line_before_ended_is_set_in_by_its_room_in_every_kind_of_document() {
        let keys = HashMap::new();
        let said = |flavour: Flavour, classes: bool, blocks: &[Block]| {
            let mut c = converter(&keys, flavour);
            c.extras.classes = classes;
            flat(&Value::Array(written(&c, blocks)))
        };
        // Typst: the line before measured, the speaker passed over.
        let typst = said(Flavour::Typst, false, &shared());
        assert!(
            typst.contains(r#"#gk-line("line", 0, after: [Is it you,], n: none, margin: none, side: "left")["#),
            "{typst}"
        );
        // LaTeX: measured into a length, and set in by it and an em.
        let latex = said(Flavour::Latex, false, &shared());
        assert!(
            latex
                .contains(r"\noindent \settowidth{\gkafter}{Is it you,}\hspace*{\dimexpr\gkafter+1em\relax}my sister?"),
            "{latex}"
        );
        // Word: two spaces that do not break for each of the ten characters, and two more.
        let c = converter(&keys, Flavour::Docx);
        let out = written(&c, &shared());
        let block = out[0]["c"][1][0]["c"].as_array().unwrap();
        assert_eq!(block[2][0]["c"], "\u{a0}".repeat(22));
        // A page of the web: the words of the line before, set and not seen.
        let html = said(Flavour::Plain, true, &shared());
        assert!(html.contains("[gk-after:Is it you,]my sister?"), "{html}");
        // Prose: the line before is the last of the paragraph before.
        let prose = vec![
            Block::paragraph(vec![text("Speak, then.")]),
            Block::paragraph(vec![mark().continues().done(), text("I will.")]),
        ];
        let typst = said(Flavour::Typst, false, &prose);
        assert!(typst.contains("#gk-after[Speak, then.];I will."), "{typst}");
        // A third part of the line: the second measured with what set it in.
        let three = vec![lines(
            "line",
            vec![
                (None, "One"),
                (Some(mark().continues().done()), "two"),
                (Some(mark().indent(1).continues().done()), "three"),
            ],
        )];
        let typst = said(Flavour::Typst, false, &three);
        assert!(typst.contains(r#"#gk-line("line", 1, after: [#gk-after[One];two], n: none"#), "{typst}");
        // The first line of a section has none before it.
        let alone = vec![lines("line", vec![(Some(mark().continues().done()), "Alone")])];
        assert!(!said(Flavour::Typst, false, &alone).contains("after:"));
    }

    #[test]
    fn a_paragraph_set_in_with_tab_is_set_in_on_the_page_by_the_step() {
        let keys = HashMap::new();
        let blocks = vec![
            Block::paragraph(vec![text("Set in.")]).indented(2),
            kind("epigraph", vec![text("Aside.")]).indented(1),
        ];
        let said = |flavour: Flavour, classes: bool| {
            let mut c = converter(&keys, flavour);
            c.extras.classes = classes;
            written(&c, &blocks)
        };
        let typst = flat(&Value::Array(said(Flavour::Typst, false)));
        assert!(typst.contains("#block(inset: (left: 1.2cm))[\nSet in.\n]\n"), "{typst}");
        assert!(typst.contains("#block(inset: (left: 0.6cm))["), "{typst}");
        let latex = flat(&Value::Array(said(Flavour::Latex, false)));
        assert!(latex.contains("{\\par\\advance\\leftskip by 1.2cm\\relax\nSet in.\n\\par}"), "{latex}");
        assert!(
            latex.contains("\\noindent \\advance\\leftskip by 0.6cm\\relax Aside."),
            "the kind's own left skip moved: {latex}"
        );
        let html = said(Flavour::Plain, true);
        assert_eq!(html[0]["c"][0][2], json!([["style", "padding-left: 1.2cm"]]));
        // Word: four spaces that do not break for each step, at the head of the line.
        let out = said(Flavour::Docx, false);
        assert_eq!(out[0]["c"][0]["c"], "\u{a0}".repeat(8));
    }

    #[test]
    fn two_stanzas_have_room_between_them_and_are_counted_on() {
        let keys = HashMap::new();
        let verse = numbered(
            2,
            None,
            vec![
                lines("line", vec![(Some(mark().number("1").done()), "One a"), (None, "One b")]),
                lines("line", vec![(None, "Two a"), (None, "Two b")]),
            ],
        );
        let c = converter(&keys, Flavour::Typst);
        let out = written(&c, &verse);
        let typst = raws(&out);
        assert_eq!(typst.iter().filter(|l| **l == "#gk-verse[").count(), 1, "one block of lines: {typst:?}");
        assert_eq!(typst.iter().filter(|l| **l == "#v(1em)").count(), 1, "{typst:?}");
        // Counted every two, across the stanzas: the second line of each shows its number.
        assert!(typst.contains(&"#gk-line(\"line\", 0, n: \"2\", margin: none, side: \"left\")["), "{typst:?}");
        assert!(typst.contains(&"#gk-line(\"line\", 0, n: \"4\", margin: none, side: \"left\")["), "{typst:?}");
        assert!(!typst.iter().any(|l| l.contains("n: \"3\"")), "{typst:?}");
        let c = converter(&keys, Flavour::Latex);
        let out = written(&c, &verse);
        assert_eq!(raws(&out).iter().filter(|l| **l == "\\vspace{\\baselineskip}").count(), 1);
        // Elsewhere an empty line in the line block.
        let c = converter(&keys, Flavour::Plain);
        let out = written(&c, &verse);
        assert_eq!(out.len(), 1);
        let block = out[0]["c"].as_array().unwrap();
        assert_eq!(block.len(), 5);
        assert_eq!(block[2], json!([]));
        // Two lines parted by an empty one within a stanza are parted as two stanzas are.
        let one = vec![lines("line", vec![(None, "a"), (None, ""), (None, "b")])];
        let out = written(&c, &one);
        assert_eq!(out[0]["c"].as_array().unwrap().len(), 3);
    }

    #[test]
    fn a_line_marked_hidden_is_counted_and_shows_nothing() {
        let keys = HashMap::new();
        let c = converter(&keys, Flavour::Typst);
        let verse = numbered(
            2,
            None,
            vec![lines(
                "line",
                vec![
                    (Some(mark().number("1").done()), "one"),
                    (Some(mark().hidden().done()), "two"),
                    (None, "three"),
                    (None, "four"),
                ],
            )],
        );
        let out = written(&c, &verse);
        let typst = raws(&out);
        // Every two: the second holds its 2 back, and the fourth shows 4.
        assert!(!typst.iter().any(|l| l.contains("n: \"2\"")), "{typst:?}");
        assert!(typst.iter().any(|l| l.contains("n: \"4\"")), "{typst:?}");
    }

    #[test]
    fn the_count_runs_on_through_a_speaker_and_a_direction() {
        let keys = HashMap::new();
        let c = converter(&keys, Flavour::Typst);
        let verse = numbered(
            1,
            None,
            vec![
                lines("line", vec![(Some(mark().number("1").done()), "a"), (None, "b")]),
                kind("speaker", vec![text("Chorus")]),
                kind("direction", vec![text("They dance.")]),
                lines("line", vec![(None, "c"), (None, "d")]),
            ],
        );
        let out = written(&c, &verse);
        let typst = raws(&out);
        assert_eq!(typst.iter().filter(|l| **l == "#gk-verse[").count(), 1, "{typst:?}");
        assert!(typst.contains(&"#gk-line(\"speaker\", 0, n: none, margin: none, side: \"left\")["), "{typst:?}");
        assert!(typst.contains(&"#gk-line(\"direction\", 0, n: none, margin: none, side: \"left\")["), "{typst:?}");
        assert!(typst.contains(&"#gk-line(\"line\", 0, n: \"3\", margin: none, side: \"left\")["), "{typst:?}");
        assert!(typst.contains(&"#gk-line(\"line\", 0, n: \"4\", margin: none, side: \"left\")["), "{typst:?}");
        // A speaker parts the stanzas: no room is added between them.
        assert!(!typst.contains(&"#v(1em)"), "{typst:?}");
    }

    #[test]
    fn prose_numbered_is_a_line_a_paragraph_and_a_line_at_each_break() {
        let keys = HashMap::new();
        let c = converter(&keys, Flavour::Docx);
        let prose = numbered(
            1,
            None,
            vec![
                Block::paragraph(vec![mark().number("1").done(), text("First."), Inline::Break, text("And on.")]),
                Block::paragraph(vec![text("Second.")]),
            ],
        );
        let out = written(&c, &prose);
        assert_eq!(out.len(), 2);
        let first = out[0]["c"].as_array().unwrap();
        assert_eq!(first[0]["c"][1][0]["c"], "1\u{a0}\u{a0}");
        assert_eq!(first[1]["c"], "First.");
        assert_eq!(first[2]["t"], "LineBreak");
        assert_eq!(first[3]["c"][1][0]["c"], "2\u{a0}\u{a0}", "a number at each line where it breaks");
        assert_eq!(out[1]["c"][0]["c"][1][0]["c"], "3\u{a0}\u{a0}");
        // In Typst beside each line, in the margin.
        let c = converter(&keys, Flavour::Typst);
        let said = serde_json::to_string(&written(&c, &prose)).unwrap();
        for n in ["1", "2", "3"] {
            assert!(said.contains(&format!("#gk-beside(\\\"left\\\", 0.25cm, gk-number(\\\"{n}\\\"));")), "{said}");
        }
    }

    #[test]
    fn an_annotation_stands_as_far_out_on_a_line_that_shows_no_number_as_on_one_that_does() {
        let keys = HashMap::new();
        // Every second line shown: the first shows no number, the second its 2.
        let prose = numbered(
            2,
            None,
            vec![
                Block::paragraph(vec![mark().margin("ia.").done(), text("Sing.")]),
                Block::paragraph(vec![mark().margin("ib.").done(), text("Goddess.")]),
            ],
        );
        let mut c = converter(&keys, Flavour::Typst);
        c.extras.verse.annotations = Some(Side::Left);
        let said = serde_json::to_string(&written(&c, &prose)).unwrap();
        for words in ["ia.", "ib."] {
            let call = format!(r#"#gk-beside(\"left\", 1.5cm, gk-margin(\"{words}\"));"#);
            assert!(said.contains(&call), "{call} in {said}");
        }
        let mut c = converter(&keys, Flavour::Latex);
        c.extras.verse.annotations = Some(Side::Left);
        let said = serde_json::to_string(&written(&c, &prose)).unwrap();
        assert_eq!(said.matches(r#"}\\hspace{1.5cm}}"#).count(), 2, "{said}");
    }

    #[test]
    fn annotations_stand_where_the_layout_says_and_outside_the_numbers_on_their_side() {
        let keys = HashMap::new();
        let marked = || mark().number("1").margin("ia.").done();
        let prose = numbered(1, None, vec![Block::paragraph(vec![marked(), text("Sing.")])]);
        let verse = numbered(1, None, vec![lines("line", vec![(Some(marked()), "Sing")])]);
        let typst = |c: &Converter| serde_json::to_string(&written(c, &prose)).unwrap();
        // Across from the numbers, as the layouts that ship have it, as far from the text as they.
        let c = converter(&keys, Flavour::Typst);
        let said = typst(&c);
        assert!(said.contains(r#"#gk-beside(\"left\", 0.25cm, gk-number(\"1\"));"#), "{said}");
        assert!(said.contains(r#"#gk-beside(\"right\", 0.25cm, gk-margin(\"ia.\"));"#), "{said}");
        // On the numbers' side, outside them.
        let mut c = converter(&keys, Flavour::Typst);
        c.extras.verse.annotations = Some(Side::Left);
        let said = typst(&c);
        assert!(said.contains(r#"#gk-beside(\"left\", 0.25cm, gk-number(\"1\"));"#), "{said}");
        assert!(said.contains(r#"#gk-beside(\"left\", 1.5cm, gk-margin(\"ia.\"));"#), "{said}");
        // At the lengths the layout gives.
        c.extras.verse.numbers_gap = Some(Length::mm(5.0));
        c.extras.verse.annotations_gap = Some(Length::cm(2.0));
        let said = typst(&c);
        assert!(said.contains(r#"#gk-beside(\"left\", 5mm, gk-number(\"1\"));"#), "{said}");
        assert!(said.contains(r#"#gk-beside(\"left\", 2cm, gk-margin(\"ia.\"));"#), "{said}");
        // LaTeX: both hang in the left margin, the annotation further out.
        let mut c = converter(&keys, Flavour::Latex);
        c.extras.verse.annotations = Some(Side::Left);
        let said = serde_json::to_string(&written(&c, &prose)).unwrap();
        assert!(said.contains(r#"}\\hspace{0.25cm}}"#) && said.contains(r#"}\\hspace{1.5cm}}"#), "{said}");
        assert!(!said.contains("rlap"), "{said}");
        // Word: at the head of the line, the annotation first, then the number.
        let mut c = converter(&keys, Flavour::Docx);
        c.extras.verse.annotations = Some(Side::Left);
        let out = written(&c, &verse);
        let line = out[0]["c"][1][0]["c"][0].as_array().unwrap();
        assert_eq!(line[0]["c"][0][2], json!([["custom-style", "Verse Margin"]]));
        assert_eq!(line[1]["c"][0][2], json!([["custom-style", "Verse Number"]]));
        assert_eq!(line[2]["c"], "Sing");
        // Numbers and annotations at the right: at the end, the number first.
        let verse_right = numbered(1, Some(Side::Right), vec![lines("line", vec![(Some(marked()), "Sing")])]);
        c.extras.verse.annotations = Some(Side::Right);
        let out = written(&c, &verse_right);
        let line = out[0]["c"][1][0]["c"][0].as_array().unwrap();
        assert_eq!(line[0]["c"], "Sing");
        assert_eq!(line[1]["c"][0][2], json!([["custom-style", "Verse Number"]]));
        assert_eq!(line[2]["c"][0][2], json!([["custom-style", "Verse Margin"]]));
    }

    #[test]
    fn a_quotation_is_a_block_quote_with_its_attribution_after_it() {
        let keys = HashMap::new();
        let c = converter(&keys, Flavour::Docx);
        let quotation = vec![
            kind("quote", vec![text("Sing, goddess.")]),
            kind("quote", vec![text("The wrath.")]),
            kind("attribution", vec![text("Homer")]),
            kind("epigraph", vec![text("At the head.")]),
        ];
        let out = written(&c, &quotation);
        assert_eq!(out.len(), 3);
        assert_eq!(out[0]["t"], "BlockQuote");
        assert_eq!(out[0]["c"].as_array().unwrap().len(), 2);
        assert_eq!(out[1]["c"][0][2], json!([["custom-style", "Attribution"]]));
        assert_eq!(out[2]["c"][0][2], json!([["custom-style", "Epigraph"]]));
        // Numbered, the quoted paragraphs carry their numbers.
        let quoted = numbered(
            1,
            None,
            vec![
                kind("quote", vec![text("First.")]),
                lines("quote", vec![(Some(mark().number("327a").done()), "Second.")]),
                kind("quote", vec![text("Third.")]),
            ],
        );
        let out = written(&c, &quoted);
        assert_eq!(out.len(), 1);
        let paras = out[0]["c"].as_array().unwrap();
        assert_eq!(paras[0]["c"][0]["c"], "First.", "nothing before the first number given");
        assert_eq!(paras[1]["c"][0]["c"][1][0]["c"], "327a\u{a0}\u{a0}");
        assert_eq!(paras[2]["c"][0]["c"][1][0]["c"], "328\u{a0}\u{a0}", "the count goes on from the digits");
    }

    #[test]
    fn a_new_run_begins_where_a_paragraph_says_so() {
        let keys = HashMap::new();
        let c = converter(&keys, Flavour::Plain);
        let blocks = vec![
            kind("quote", vec![text("One.")]),
            kind("quote", vec![text("Two.")]).begins_run(),
            kind("line", vec![text("a")]),
            kind("speaker", vec![text("Nurse")]),
            kind("line", vec![text("b")]).begins_run(),
        ];
        let out = written(&c, &blocks);
        let tags: Vec<&str> = out.iter().map(|v| v["t"].as_str().unwrap()).collect();
        assert_eq!(tags, ["BlockQuote", "BlockQuote", "LineBlock", "LineBlock"]);
        // The speaker before a stanza that begins a run goes with it.
        assert_eq!(out[2]["c"].as_array().unwrap().len(), 1);
        assert_eq!(out[3]["c"].as_array().unwrap().len(), 2);
        // A run in a numbered stretch is counted on from the run before.
        let blocks = numbered(
            1,
            None,
            vec![
                lines("line", vec![(Some(mark().number("7").done()), "a")]),
                kind("line", vec![text("b")]).begins_run(),
            ],
        );
        let out = written(&c, &blocks);
        assert_eq!(out.len(), 2);
        assert_eq!(out[1]["c"][0][0]["c"][1][0]["c"], "8\u{a0}\u{a0}");
    }

    #[test]
    fn a_list_is_nested_by_indent() {
        let keys = HashMap::new();
        let c = converter(&keys, Flavour::Plain);
        let item = |name: &str, indent: u32, words: &str| kind(name, vec![text(words)]).indented(indent);
        let list = vec![
            item("item", 0, "one"),
            item("item", 0, "two"),
            lines("numbered", vec![(Some(mark().number("3").done()), "nested")]).indented(1),
            item("numbered", 1, "more"),
            item("item", 2, "deeper"),
            item("item", 0, "three"),
            item("numbered", 0, "apart"),
        ];
        let out = written(&c, &list);
        assert_eq!(out.len(), 2);
        assert_eq!(out[0]["t"], "BulletList");
        let items = out[0]["c"].as_array().unwrap();
        assert_eq!(items.len(), 3);
        assert_eq!(items[1][1]["t"], "OrderedList");
        assert_eq!(items[1][1]["c"][0][0], 3);
        let nested = items[1][1]["c"][1].as_array().unwrap();
        assert_eq!(nested.len(), 2);
        assert_eq!(nested[1][1]["t"], "BulletList");
        assert_eq!(out[1]["t"], "OrderedList");
        assert_eq!(out[1]["c"][0][0], 1);
    }

    #[test]
    fn a_list_to_tick_is_a_bullet_list_whose_points_begin_with_a_box() {
        let keys = HashMap::new();
        for flavour in [Flavour::Plain, Flavour::Typst, Flavour::Latex, Flavour::Docx] {
            let c = converter(&keys, flavour);
            let list = vec![
                kind("todo", vec![text("Buy bread")]),
                kind("todo", vec![text("Read the proofs")]).ticked(true),
                kind("todo", vec![text("Within")]).indented(1),
                kind("item", vec![text("A point")]),
            ];
            let out = written(&c, &list);
            assert_eq!(out.len(), 1, "one list, the points and the point to tick together");
            assert_eq!(out[0]["t"], "BulletList");
            let items = out[0]["c"].as_array().unwrap();
            assert_eq!(items.len(), 3);
            let words = |item: &Value| item[0]["c"].as_array().unwrap().clone();
            let first = words(&items[0]);
            assert_eq!(first[0], json!({"t": "Str", "c": "\u{2610}"}));
            assert_eq!(first[1], json!({"t": "Space"}));
            assert_eq!(words(&items[1])[0]["c"], "\u{2612}", "ticked");
            // The point within stands in a list of its own under the one before.
            assert_eq!(items[1][1]["t"], "BulletList");
            assert_eq!(words(&items[1][1]["c"][0])[0]["c"], "\u{2610}");
            // A plain point has no box.
            assert_ne!(words(&items[2])[0]["c"], "\u{2610}");
        }
        // Ticked is not written where it is not.
        let json = serde_json::to_value(kind("todo", vec![text("a")])).unwrap();
        assert!(json.get("done").is_none());
        let json = serde_json::to_value(kind("todo", vec![text("a")]).ticked(true)).unwrap();
        assert_eq!(json["done"], true);
    }

    #[test]
    fn a_glossary_is_a_description_list() {
        let keys = HashMap::new();
        let c = converter(&keys, Flavour::Docx);
        let glossary = vec![
            kind("headword", vec![text("Argo")]),
            kind("gloss", vec![text("A ship.")]),
            kind("gloss", vec![text("The first.")]),
            kind("headword", vec![text("Colchis")]),
            kind("gloss", vec![text("A land.")]),
        ];
        let out = written(&c, &glossary);
        assert_eq!(out.len(), 1);
        assert_eq!(out[0]["t"], "DefinitionList");
        let items = out[0]["c"].as_array().unwrap();
        assert_eq!(items.len(), 2);
        assert_eq!(items[0][0][0]["c"], "Argo");
        assert_eq!(items[0][1].as_array().unwrap().len(), 2, "each gloss a definition");
        assert_eq!(items[0][1][1][0]["t"], "Para");
        assert_eq!(items[1][1].as_array().unwrap().len(), 1);
    }

    #[test]
    fn code_and_a_kind_of_the_writers_own() {
        let keys = HashMap::new();
        let mut c = converter(&keys, Flavour::Docx);
        let own = vec![crate::formats::kinds::OwnKind {
            id: "k1".into(),
            name: "Letter".into(),
            family: crate::formats::kinds::Family::Paragraph,
            based_on: "text".into(),
            look: Default::default(),
        }];
        c.extras.kinds = crate::formats::kinds::table(&DocumentFormat::default(), &own);
        let blocks = vec![
            kind("code", vec![text("let x = 1;")]),
            kind("code", vec![]),
            kind("code", vec![text("let y;"), Inline::Break, text("let z;")]),
            kind("k1", vec![text("Dear friend,")]),
            kind("k1", vec![text("I write.")]),
            kind("draft", vec![text("Look this up.")]),
            kind("break", vec![]),
        ];
        let out = written(&c, &blocks);
        assert_eq!(out.len(), 4);
        assert_eq!(out[0]["t"], "CodeBlock");
        assert_eq!(out[0]["c"][1], "let x = 1;\n\nlet y;\nlet z;");
        assert_eq!(out[1]["c"][0][2], json!([["custom-style", "Letter"]]));
        assert_eq!(out[2]["c"][0][2], json!([["custom-style", "Letter"]]));
        assert_eq!(out[3]["c"][0][2], json!([["custom-style", "Section Break"]]));
        assert_eq!(out[3]["c"][1][0]["c"][0]["c"], "*");
    }

    #[test]
    fn breaks_of_the_page_and_the_column_in_every_kind_of_document() {
        let keys = HashMap::new();
        let breaks = [Block::Break { what: BreakKind::Page }, Block::Break { what: BreakKind::Column }];
        let said = |flavour: Flavour, classes: bool, columns: u8| -> Vec<(String, String)> {
            let mut c = converter(&keys, flavour);
            c.extras.classes = classes;
            c.extras.columns = columns;
            written(&c, &breaks)
                .iter()
                .map(|v| (v["c"][0].as_str().unwrap().to_owned(), v["c"][1].as_str().unwrap().to_owned()))
                .collect()
        };
        let pair = |format: &str, page: &str, column: &str| {
            vec![(format.to_owned(), page.to_owned()), (format.to_owned(), column.to_owned())]
        };
        assert_eq!(said(Flavour::Typst, false, 1), pair("typst", "#pagebreak()", "#colbreak()"));
        assert_eq!(
            said(Flavour::Latex, false, 2),
            pair("latex", "\\end{multicols}\\newpage\\begin{multicols}{2}", "\\columnbreak")
        );
        // Without columns a break of the column begins a new page, as in Typst and Word.
        assert_eq!(said(Flavour::Latex, false, 1), pair("latex", "\\newpage", "\\newpage"));
        assert_eq!(
            said(Flavour::Docx, false, 1),
            pair(
                "openxml",
                "<w:p><w:r><w:br w:type=\"page\"/></w:r></w:p>",
                "<w:p><w:r><w:br w:type=\"column\"/></w:r></w:p>"
            )
        );
        assert_eq!(
            said(Flavour::Odt, false, 1),
            pair(
                "opendocument",
                "<text:p text:style-name=\"Page_20_Break\"/>",
                "<text:p text:style-name=\"Column_20_Break\"/>"
            )
        );
        assert_eq!(
            said(Flavour::Plain, true, 1),
            pair("html", "<div style=\"break-before: page\"></div>", "<div style=\"break-before: column\"></div>")
        );
        // Markdown has a break of the page as TeX writes it, and none of the column.
        assert_eq!(said(Flavour::Plain, false, 1), vec![("latex".to_owned(), "\\newpage".to_owned())]);
        // Within texts side by side no break is written.
        let c = converter(&keys, Flavour::Typst);
        let out = written(&c, &[Block::Parallel { left: breaks.to_vec(), right: vec![] }]);
        assert!(!raws(&out).iter().any(|l| l.contains("break")), "{out:?}");
    }
}
