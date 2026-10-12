//! Passages, their paragraphs, and texts side by side: how each kind of
//! document sets them (ADR 0040).
//!
//! A passage is a run of paragraphs of one family, and the family says what
//! is made of it:
//!
//! - **Verse**: each line kept as a line. In Typst the lines are blocks with
//!   labels, which the opening of the document (`formats/typst.rs`) sets,
//!   with the number each shows beside it, as counted here
//!   (`document/numbers.rs`), and the speakers and stage directions as their
//!   kinds look. In LaTeX each line is a paragraph of its own, with the
//!   number hanging in the margin. Elsewhere a line block, which every
//!   writer of Pandoc keeps as lines, with the number at the head of its line
//!   or at its end, small, and the speakers and directions in character
//!   styles of their own.
//! - **Quotation**: a block quote of the quoted paragraphs; an epigraph or
//!   an attribution a paragraph of its kind.
//! - **List**: a bullet or numbered list, nested by indent.
//! - **Code**: a code block, its paragraphs the lines.
//! - Everything else, paragraph by paragraph, as its kind looks: in Typst by
//!   the opening of the document, in LaTeX by what is written around it, in
//!   Word and Writer by a paragraph style named after the kind, and
//!   elsewhere as plainly as the look can be shown.
//! - A numbered passage of any family but verse is written paragraph by
//!   paragraph with its number beside it, in the look of its kind.
//!
//! **Parallel**: an original and its translation side by side. A grid in
//! Typst, two minipages in LaTeX, and a table without lines in Word and
//! Writer.

use serde_json::{Value, json};

use super::numbers::{Shown, numbers};
use super::pandoc::{Converter, Flavour, attr, label, looked, tokens, upper};
use super::{Block, Inline, Numbering, Side};
use crate::formats::Case;
use crate::formats::typst::string;

fn raw(format: &str, text: impl Into<String>) -> Value {
    json!({"t": "RawBlock", "c": [format, text.into()]})
}

fn raw_inline(format: &str, text: impl Into<String>) -> Value {
    json!({"t": "RawInline", "c": [format, text.into()]})
}

/// Text as Pandoc's tokens.
fn words(text: &str) -> Vec<Value> {
    let mut inner = Vec::new();
    tokens(text, &mut inner);
    inner
}

/// A paragraph of a passage, as the writers need it.
struct Para<'a> {
    name: &'a str,
    indent: u32,
    counted: bool,
    hidden: bool,
    number: Option<&'a str>,
    margin: Option<&'a str>,
    content: &'a [Inline],
}

impl<'a> Para<'a> {
    fn of(block: &'a Block) -> Option<Self> {
        let Block::Paragraph { name, indent, number, counted, hidden, margin, content } = block else { return None };
        let given = |s: &'a Option<String>| s.as_deref().map(str::trim).filter(|s| !s.is_empty());
        Some(Para {
            name,
            indent: *indent,
            counted: *counted,
            hidden: *hidden,
            number: given(number),
            margin: given(margin),
            content,
        })
    }
}

/// What stands beside a paragraph: its number on one side, and words in the
/// margin on the other.
pub(super) struct Beside<'a> {
    pub number: Option<&'a Shown>,
    pub side: Side,
    pub margin: Option<&'a str>,
}

impl Beside<'_> {
    fn is_empty(&self) -> bool {
        self.number.is_none() && self.margin.is_none()
    }
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

/// Whether a paragraph holds nothing to read: no words, or only spaces and
/// breaks. An empty line of verse is the break between two stanzas; nothing
/// empty is counted.
fn blank(content: &[Inline]) -> bool {
    content.iter().all(|i| match i {
        Inline::Text { text, .. } => text.trim().is_empty(),
        Inline::Break => true,
        _ => false,
    })
}

/// The number a list begins at, from the number given its first item.
fn list_start(number: Option<&str>) -> u32 {
    let digits: String = number.unwrap_or("").chars().filter(char::is_ascii_digit).collect();
    digits.parse().ok().filter(|n| *n > 0).unwrap_or(1)
}

impl Converter<'_> {
    /// The kind of the catalogue a kind rests on: itself, or what a kind of
    /// the writer's own is based on; text for one that is not known.
    fn base_of(&self, name: &str) -> &'static str {
        self.extras.kinds.get(name).map_or("text", |info| info.base)
    }

    /// Whether a numbering counts a paragraph: its kind is counted, the
    /// paragraph does not say otherwise, and it is not empty.
    fn counts(&self, p: &Para) -> bool {
        p.counted && !blank(p.content) && self.extras.kinds.get(p.name).is_some_and(|info| info.counted)
    }

    /// A passage, as its family and its numbering ask.
    pub(super) fn passage_block(
        &self,
        family: &str,
        numbering: Numbering,
        every: Option<u32>,
        side: Option<Side>,
        content: &[Block],
        out: &mut Vec<Value>,
    ) {
        let paras: Vec<Para> = content.iter().filter_map(Para::of).collect();
        if paras.is_empty() {
            return;
        }
        let every = every.filter(|e| *e > 0).unwrap_or(self.extras.verse.every);
        let side = side.unwrap_or(self.extras.verse.side);
        let counted: Vec<(bool, Option<&str>)> = paras.iter().map(|p| (self.counts(p), p.number)).collect();
        // A paragraph whose number is hidden is counted as any other, and shows nothing.
        let shown: Vec<Option<Shown>> = numbers(numbering, every, &counted)
            .into_iter()
            .zip(&paras)
            .map(|(shown, p)| shown.filter(|_| !p.hidden))
            .collect();
        match family {
            "verse" => self.verse(&paras, &shown, side, out),
            _ if numbering != Numbering::None => self.numbered(&paras, &shown, side, out),
            "quotation" => self.quotation(&paras, out),
            "list" => self.list(&paras, out),
            "code" => self.code(&paras, out),
            _ => {
                for p in &paras {
                    self.kind_paragraph(p.name, p.content, None, out);
                }
            }
        }
        // What is no paragraph has no place in a passage; it stands after it.
        let rest: Vec<Block> = content.iter().filter(|b| !matches!(b, Block::Paragraph { .. })).cloned().collect();
        if !rest.is_empty() {
            self.blocks(&rest, out);
        }
    }

    /// A paragraph of a kind that stands outside any passage, as the
    /// interface does not send them but a document may hold them.
    pub(super) fn stray_paragraph(&self, name: &str, content: &[Inline], out: &mut Vec<Value>) {
        if name == "quote" {
            let mut inner = Vec::new();
            self.kind_paragraph(name, content, None, &mut inner);
            if !inner.is_empty() {
                out.push(json!({"t": "BlockQuote", "c": inner}));
            }
        } else {
            self.kind_paragraph(name, content, None, out);
        }
    }

    /// Lines of verse: a line block, or the blocks of Typst and the
    /// paragraphs of LaTeX that stand for one. A paragraph among them whose
    /// kind is not of the verse, an attribution under a quoted poem, is a
    /// paragraph of its kind, and the lines go on after it.
    fn verse(&self, paras: &[Para], shown: &[Option<Shown>], side: Side, out: &mut Vec<Value>) {
        let mut at = 0;
        while at < paras.len() {
            let from = at;
            while at < paras.len() && matches!(self.base_of(paras[at].name), "line" | "speaker" | "direction") {
                at += 1;
            }
            if at > from {
                self.lines(&paras[from..at], &shown[from..at], side, out);
            } else {
                self.kind_paragraph(paras[at].name, paras[at].content, None, out);
                at += 1;
            }
        }
    }

    fn lines(&self, lines: &[Para], shown: &[Option<Shown>], side: Side, out: &mut Vec<Value>) {
        let x = &self.extras;
        let line_look = x.kinds.get("line").map(|info| &info.look);
        match x.flavour {
            Flavour::Typst => {
                // The numbers are counted here, and each line is given what it shows.
                out.push(raw("typst", "#gk-verse["));
                for (line, shown) in lines.iter().zip(shown) {
                    // An empty line is the room between two stanzas.
                    if blank(line.content) && line.margin.is_none() && shown.is_none() {
                        out.push(raw("typst", "#v(1em)"));
                        continue;
                    }
                    let n = shown.as_ref().map_or("none".to_owned(), |s| string(&s.label));
                    let margin = line.margin.map_or("none".to_owned(), string);
                    out.push(raw(
                        "typst",
                        format!(
                            "#gk-line(\"{}\", {}, n: {n}, margin: {margin}, side: \"{}\")[",
                            self.base_of(line.name),
                            line.indent,
                            side.name()
                        ),
                    ));
                    out.push(json!({"t": "Plain", "c": self.inlines(line.content)}));
                    out.push(raw("typst", "]"));
                }
                out.push(raw("typst", "]"));
            }
            Flavour::Latex => {
                // Each line a paragraph of its own, in a group that moves the
                // lines in as far as the look of a line says; the number hangs
                // in the margin on its side, and words in the margin on the other.
                let indent = line_look.map_or("2.4em".to_owned(), |l| l.indent_left.to_string());
                out.push(raw("latex", format!("{{\\par\\leftskip={indent}\\relax\\parindent=0pt\\parskip=0pt")));
                for (line, shown) in lines.iter().zip(shown) {
                    // An empty line is the room between two stanzas.
                    if blank(line.content) && line.margin.is_none() && shown.is_none() {
                        out.push(raw("latex", "\\vspace{\\baselineskip}"));
                        continue;
                    }
                    let mut inner = self.inlines(line.content);
                    let mut lead = vec![raw_inline("latex", "\\noindent")];
                    match self.base_of(line.name) {
                        "speaker" => {
                            lead = vec![raw_inline("latex", "\\medskip\\noindent")];
                            inner = self.line_words(inner, line.name);
                        }
                        "direction" => inner = self.line_words(inner, line.name),
                        _ => {
                            if line.indent > 0 {
                                lead.push(raw_inline("latex", format!("\\hspace*{{{}em}}", line.indent as f32 * 1.5)));
                            }
                        }
                    }
                    inner.splice(0..0, lead);
                    self.beside(&mut inner, &Beside { number: shown.as_ref(), side, margin: line.margin });
                    inner.push(raw_inline("latex", "\\par"));
                    out.push(json!({"t": "Plain", "c": inner}));
                }
                out.push(raw("latex", "\\par}\\medskip"));
            }
            _ => {
                // A line block: lines, each as its kind has it. Indentation is
                // spaces that do not break, which Pandoc keeps at the head of a
                // line; a number stands at the head of its line or at its end,
                // small, and words in the margin at the other end: Word and
                // Writer have no margin to set them in.
                let mut block = Vec::new();
                for (line, shown) in lines.iter().zip(shown) {
                    let mut inner = self.inlines(line.content);
                    inner = match self.base_of(line.name) {
                        "speaker" | "direction" => self.line_words(inner, line.name),
                        _ => inner,
                    };
                    if line.indent > 0 {
                        let spaces = "\u{a0}".repeat((line.indent as usize) * 4);
                        inner.insert(0, json!({"t": "Str", "c": spaces}));
                    }
                    self.beside(&mut inner, &Beside { number: shown.as_ref(), side, margin: line.margin });
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

    /// Puts what stands beside a paragraph into its line: the number on its
    /// side, the words in the margin on the other. In Typst and LaTeX they
    /// are placed in the margin; in Word, Writer and the formats made from
    /// a line block they stand at the head of the line or at its end.
    pub(super) fn beside(&self, inner: &mut Vec<Value>, beside: &Beside) {
        if beside.is_empty() {
            return;
        }
        let number = beside.number.map(|s| s.label.as_str());
        let (at_left, at_right) = match beside.side {
            Side::Left => ((number, false), (beside.margin, true)),
            Side::Right => ((beside.margin, true), (number, false)),
        };
        match self.extras.flavour {
            Flavour::Typst => {
                // Placed from where the paragraph begins, taking no room in the line.
                let call = |side: &str, text: &str, margin: bool| {
                    let body = if margin {
                        format!("gk-margin({})", string(text))
                    } else {
                        format!("gk-number({})", string(text))
                    };
                    raw_inline("typst", format!("#gk-beside(\"{side}\", {body});"))
                };
                if let (Some(text), margin) = at_right {
                    inner.insert(0, call("right", text, margin));
                }
                if let (Some(text), margin) = at_left {
                    inner.insert(0, call("left", text, margin));
                }
            }
            Flavour::Latex => {
                let shape = |margin: bool| if margin { "\\footnotesize\\itshape " } else { "\\footnotesize " };
                if let (Some(text), margin) = at_right {
                    inner
                        .push(raw_inline("latex", format!("\\nobreak\\hfill\\rlap{{\\hspace{{1em}}{}", shape(margin))));
                    inner.extend(words(text));
                    inner.push(raw_inline("latex", "}"));
                }
                if let (Some(text), margin) = at_left {
                    // After what begins the line, before its words.
                    let at = inner.iter().take_while(|v| v["t"] == "RawInline").count();
                    let mut lap = vec![raw_inline("latex", format!("\\llap{{{{{}", shape(margin)))];
                    lap.extend(words(text));
                    lap.push(raw_inline("latex", "}\\hspace{0.9em}}"));
                    inner.splice(at..at, lap);
                }
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
                if let (Some(text), margin) = at_right {
                    inner.extend(span(text, margin, true));
                }
                if let (Some(text), margin) = at_left {
                    inner.splice(0..0, span(text, margin, false));
                }
            }
        }
    }

    /// A numbered passage of any family but verse: paragraph by paragraph,
    /// each with its number beside it, in the look of its kind. Quoted
    /// paragraphs that follow each other stand in one block quote.
    fn numbered(&self, paras: &[Para], shown: &[Option<Shown>], side: Side, out: &mut Vec<Value>) {
        let mut at = 0;
        while at < paras.len() {
            if paras[at].name == "quote" {
                let mut inner = Vec::new();
                while at < paras.len() && paras[at].name == "quote" {
                    let p = &paras[at];
                    let beside = Beside { number: shown[at].as_ref(), side, margin: p.margin };
                    self.kind_paragraph(p.name, p.content, Some(&beside), &mut inner);
                    at += 1;
                }
                if !inner.is_empty() {
                    out.push(json!({"t": "BlockQuote", "c": inner}));
                }
            } else {
                let p = &paras[at];
                let beside = Beside { number: shown[at].as_ref(), side, margin: p.margin };
                self.kind_paragraph(p.name, p.content, Some(&beside), out);
                at += 1;
            }
        }
    }

    /// A quotation: the quoted paragraphs in a block quote, and an epigraph
    /// or an attribution among them a paragraph of its kind.
    fn quotation(&self, paras: &[Para], out: &mut Vec<Value>) {
        let mut at = 0;
        while at < paras.len() {
            let from = at;
            let mut inner = Vec::new();
            while at < paras.len() && paras[at].name == "quote" {
                self.kind_paragraph("quote", paras[at].content, None, &mut inner);
                at += 1;
            }
            if at > from {
                if !inner.is_empty() {
                    out.push(json!({"t": "BlockQuote", "c": inner}));
                }
            } else {
                self.kind_paragraph(paras[at].name, paras[at].content, None, out);
                at += 1;
            }
        }
    }

    /// A list: the items as a bullet or a numbered list, those indented
    /// further a list within the item before them. A run of items of the
    /// other kind at the same depth is a list of its own.
    fn list(&self, paras: &[Para], out: &mut Vec<Value>) {
        let mut at = 0;
        while at < paras.len() {
            if matches!(self.base_of(paras[at].name), "item" | "numbered") {
                let (list, next) = self.list_from(paras, at, paras[at].indent);
                out.push(list);
                at = next;
            } else {
                self.kind_paragraph(paras[at].name, paras[at].content, None, out);
                at += 1;
            }
        }
    }

    /// The list that begins at `at`, of the items at `level` of the kind of
    /// the first, each with the items indented further as a list within it;
    /// it ends before an item that stands shallower, one of the other kind
    /// at this depth, or a paragraph that is no item. Returns the list and
    /// where to go on from.
    fn list_from(&self, paras: &[Para], at: usize, level: u32) -> (Value, usize) {
        let is_item = |p: &Para| matches!(self.base_of(p.name), "item" | "numbered");
        let kind = self.base_of(paras[at].name);
        let start = list_start(paras[at].number);
        let mut items = Vec::new();
        let mut i = at;
        while i < paras.len() {
            let p = &paras[i];
            if !is_item(p) || p.indent < level || self.base_of(p.name) != kind {
                break;
            }
            let mut inner = vec![json!({"t": "Plain", "c": self.inlines(p.content)})];
            i += 1;
            while i < paras.len() && is_item(&paras[i]) && paras[i].indent > level {
                let (sub, next) = self.list_from(paras, i, paras[i].indent);
                inner.push(sub);
                i = next;
            }
            items.push(Value::Array(inner));
        }
        let list = if kind == "numbered" {
            json!({"t": "OrderedList", "c": [[start, {"t": "Decimal"}, {"t": "Period"}], items]})
        } else {
            json!({"t": "BulletList", "c": items})
        };
        (list, i)
    }

    /// A passage of code: one block, its paragraphs the lines.
    fn code(&self, paras: &[Para], out: &mut Vec<Value>) {
        let text: Vec<String> = paras.iter().map(|p| code_text(p.content)).collect();
        let text = text.join("\n");
        if !text.trim().is_empty() {
            out.push(json!({"t": "CodeBlock", "c": [attr(), text.trim_end()]}));
        }
    }

    /// A paragraph of a kind, set as the kind's look says: in Typst by the
    /// opening of the document, in LaTeX by what is written around it, in
    /// Word and Writer by a paragraph style named after the kind, and
    /// elsewhere as plainly as the look can be shown. A paragraph of text or
    /// of a quotation is a plain paragraph, which what calls this puts where
    /// it belongs; one of code a code block; a break the sign of its look.
    /// What stands beside the paragraph, where it is numbered, goes in.
    pub(super) fn kind_paragraph(&self, name: &str, content: &[Inline], beside: Option<&Beside>, out: &mut Vec<Value>) {
        let x = &self.extras;
        // A note to oneself goes into no document.
        if name == "draft" {
            return;
        }
        let with_beside = |mut inner: Vec<Value>| {
            if let Some(b) = beside {
                self.beside(&mut inner, b);
            }
            inner
        };
        let Some(info) = x.kinds.get(name) else {
            let inner = with_beside(self.inlines(content));
            if !inner.is_empty() {
                out.push(json!({"t": "Para", "c": inner}));
            }
            return;
        };
        let look = &info.look;
        if matches!(name, "text" | "quote" | "item" | "numbered") {
            let inner = with_beside(self.inlines(content));
            if !inner.is_empty() {
                out.push(json!({"t": "Para", "c": inner}));
            }
            return;
        }
        if name == "code" {
            let text = code_text(content);
            if !text.trim().is_empty() {
                out.push(json!({"t": "CodeBlock", "c": [attr(), text.trim_end()]}));
            }
            return;
        }
        let mut inner = self.inlines(content);
        if info.base == "break" {
            // A break holds no text of its own: the layout says what stands in it.
            inner.clear();
            let sign = look.text.trim();
            tokens(if sign.is_empty() { "\u{a0}" } else { sign }, &mut inner);
        }
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
                let inner = with_beside(inner);
                out.push(json!({"t": "Div", "c": [[class, [], []], [{"t": "Plain", "c": inner}]]}));
            }
            Flavour::Latex => {
                if look.case == Case::Upper {
                    upper(&mut inner);
                }
                let (open, close) = crate::export::latex::around(look, x.kinds.get("text").map(|t| &t.look));
                inner.insert(0, raw_inline("latex", open));
                let mut inner = with_beside(inner);
                inner.push(raw_inline("latex", close));
                out.push(json!({"t": "Plain", "c": inner}));
            }
            Flavour::Docx | Flavour::Odt => {
                let inner = with_beside(inner);
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
                let inner = with_beside(looked(inner, look));
                out.push(json!({"t": "Div", "c": [["", [class], []], [{"t": "Para", "c": inner}]]}));
            }
        }
    }

    pub(super) fn parallel(&self, left: &[Block], right: &[Block], out: &mut Vec<Value>) {
        let mut l = Vec::new();
        self.blocks(left, &mut l);
        let mut r = Vec::new();
        self.blocks(right, &mut r);
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

    use super::super::fixtures::{kind, passage, text};
    use super::super::pandoc::Extras;
    use super::*;
    use crate::formats::DocumentFormat;

    fn converter(keys: &HashMap<String, String>, flavour: Flavour) -> Converter<'_> {
        let mut extras = Extras::default();
        extras.flavour = flavour;
        extras.kinds = crate::formats::kinds::table(&DocumentFormat::default(), &[]);
        Converter {
            keys,
            language: Some("en-GB"),
            run_in: vec![],
            new_page: vec![],
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

    fn line(name: &str, indent: u32, number: Option<&str>, words_: &str) -> Block {
        Block::Paragraph {
            name: name.into(),
            indent,
            number: number.map(Into::into),
            counted: true,
            hidden: false,
            margin: None,
            content: vec![text(words_)],
        }
    }

    fn numbered(family: &str, side: Option<Side>, content: Vec<Block>) -> Block {
        Block::Passage { family: family.into(), numbering: Numbering::Counted, every: Some(2), side, content }
    }

    #[test]
    fn a_verse_is_a_line_block_with_its_numbers_at_the_head_or_the_end() {
        let keys = HashMap::new();
        let c = converter(&keys, Flavour::Docx);
        let verse = numbered(
            "verse",
            None,
            vec![
                line("speaker", 0, None, "Nurse"),
                line("line", 0, Some("1"), "If only"),
                line("line", 1, None, "the Argo"),
                line("line", 0, None, "had never flown").with_margin("ia."),
            ],
        );
        let out = written(&c, std::slice::from_ref(&verse));
        assert_eq!(out.len(), 1);
        // In the style of a line, as a line block.
        assert_eq!(out[0]["c"][0][2], json!([["custom-style", "Line"]]));
        let lines = out[0]["c"][1][0]["c"].as_array().unwrap();
        assert_eq!(lines.len(), 4);
        // The speaker in the character style the line block needs.
        assert_eq!(lines[0][0]["c"][0][2], json!([["custom-style", "Speaker Char"]]));
        assert_eq!(lines[1][0]["c"][0][2], json!([["custom-style", "Verse Number"]]));
        assert_eq!(lines[1][0]["c"][1][0]["c"], "1\u{a0}\u{a0}");
        // The second line counted shows its number, every second being shown; it is indented by spaces that do not break.
        assert_eq!(lines[2][0]["c"][1][0]["c"], "2\u{a0}\u{a0}");
        assert_eq!(lines[2][1]["c"], "\u{a0}\u{a0}\u{a0}\u{a0}");
        // The third is not shown; its margin words stand at the end.
        let last = lines[3].as_array().unwrap();
        assert_eq!(last[0]["c"], "had");
        assert_eq!(last[last.len() - 1]["c"][0][2], json!([["custom-style", "Verse Margin"]]));
        // On the right side the number stands at the end and the margin words at the head.
        let Block::Passage { content, .. } = verse else { panic!() };
        let right = Block::Passage {
            family: "verse".into(),
            numbering: Numbering::Counted,
            every: Some(2),
            side: Some(Side::Right),
            content,
        };
        let out = written(&c, &[right]);
        let lines = out[0]["c"][1][0]["c"].as_array().unwrap();
        let second = lines[1].as_array().unwrap();
        assert_eq!(second[0]["c"], "If");
        assert_eq!(second[second.len() - 1]["c"][0][2], json!([["custom-style", "Verse Number"]]));
        let last = lines[3].as_array().unwrap();
        assert_eq!(last[0]["c"][0][2], json!([["custom-style", "Verse Margin"]]));
    }

    #[test]
    fn a_verse_in_typst_and_latex() {
        let keys = HashMap::new();
        let verse = numbered(
            "verse",
            None,
            vec![
                line("speaker", 0, None, "Nurse"),
                line("line", 0, Some("1"), "If only"),
                line("line", 1, None, "the Argo"),
            ],
        );
        let c = converter(&keys, Flavour::Typst);
        let out = written(&c, std::slice::from_ref(&verse));
        assert_eq!(out[0]["c"][1], "#gk-verse[");
        assert_eq!(out[1]["c"][1], "#gk-line(\"speaker\", 0, n: none, margin: none, side: \"left\")[");
        assert_eq!(out[4]["c"][1], "#gk-line(\"line\", 0, n: \"1\", margin: none, side: \"left\")[");
        assert_eq!(out[7]["c"][1], "#gk-line(\"line\", 1, n: \"2\", margin: none, side: \"left\")[");
        let c = converter(&keys, Flavour::Latex);
        let out = written(&c, &[verse]);
        assert_eq!(
            out[0]["c"][1], "{\\par\\leftskip=1cm\\relax\\parindent=0pt\\parskip=0pt",
            "as far in as a line looks"
        );
        let first = out[1]["c"].as_array().unwrap();
        assert_eq!(first[0]["c"][1], "\\medskip\\noindent");
        assert_eq!(first[1]["t"], "SmallCaps");
        let second = out[2]["c"].as_array().unwrap();
        assert_eq!(second[1]["c"][1], "\\llap{{\\footnotesize ");
        assert_eq!(second[2]["c"], "1");
    }

    #[test]
    fn an_empty_line_parts_two_stanzas_and_is_not_counted() {
        let keys = HashMap::new();
        let verse = numbered(
            "verse",
            None,
            vec![
                line("line", 0, Some("1"), "One a"),
                line("line", 0, None, "One b"),
                line("line", 0, None, ""),
                line("line", 0, None, "Two a"),
            ],
        );
        let c = converter(&keys, Flavour::Typst);
        let out = written(&c, std::slice::from_ref(&verse));
        let typst: Vec<&str> = out.iter().filter_map(|v| v["c"][1].as_str()).collect();
        assert!(typst.contains(&"#v(1em)"), "{typst:?}");
        // Counted every two: the empty line is passed over, and the line after it is the third.
        assert!(typst.contains(&"#gk-line(\"line\", 0, n: \"2\", margin: none, side: \"left\")["), "{typst:?}");
        assert!(!typst.iter().any(|l| l.contains("n: \"3\"")), "{typst:?}");
        let c = converter(&keys, Flavour::Latex);
        let out = written(&c, &[verse]);
        assert!(out.iter().any(|v| v["c"][1] == "\\vspace{\\baselineskip}"));
    }

    #[test]
    fn a_number_held_back_is_counted_and_not_shown() {
        let keys = HashMap::new();
        let c = converter(&keys, Flavour::Typst);
        let mut hidden = line("line", 0, None, "two");
        if let Block::Paragraph { hidden: h, .. } = &mut hidden {
            *h = true;
        }
        let verse = numbered(
            "verse",
            None,
            vec![
                line("line", 0, Some("1"), "one"),
                hidden,
                line("line", 0, None, "three"),
                line("line", 0, None, "four"),
            ],
        );
        let out = written(&c, &[verse]);
        let typst: Vec<&str> = out.iter().filter_map(|v| v["c"][1].as_str()).collect();
        // Every two: the second holds its 2 back, and the fourth shows 4.
        assert!(!typst.iter().any(|l| l.contains("n: \"2\"")), "{typst:?}");
        assert!(typst.iter().any(|l| l.contains("n: \"4\"")), "{typst:?}");
    }

    #[test]
    fn paragraphs_of_text_are_counted_in_a_numbered_passage_of_text() {
        let keys = HashMap::new();
        let c = converter(&keys, Flavour::Docx);
        let prose = Block::Passage {
            family: "text".into(),
            numbering: Numbering::Counted,
            every: Some(1),
            side: None,
            content: vec![line("text", 0, Some("1"), "First."), line("text", 0, None, "Second.")],
        };
        let out = written(&c, &[prose]);
        let said = serde_json::to_string(&out).unwrap();
        // Each paragraph has its number at its head, the second counted on from the first.
        assert!(said.contains("\"Verse Number\"") && said.contains("\"2\u{a0}\u{a0}\""), "{said}");
    }

    #[test]
    fn a_quotation_is_a_block_quote_with_its_attribution_after_it() {
        let keys = HashMap::new();
        let c = converter(&keys, Flavour::Docx);
        let quotation = passage(
            "quotation",
            vec![
                kind("quote", vec![text("Sing, goddess.")]),
                kind("quote", vec![text("The wrath.")]),
                kind("attribution", vec![text("Homer")]),
                kind("epigraph", vec![text("At the head.")]),
            ],
        );
        let out = written(&c, &[quotation]);
        assert_eq!(out.len(), 3);
        assert_eq!(out[0]["t"], "BlockQuote");
        assert_eq!(out[0]["c"].as_array().unwrap().len(), 2);
        assert_eq!(out[1]["c"][0][2], json!([["custom-style", "Attribution"]]));
        assert_eq!(out[2]["c"][0][2], json!([["custom-style", "Epigraph"]]));
        // Numbered, the quoted paragraphs carry their numbers.
        let numbered = numbered(
            "quotation",
            None,
            vec![
                kind("quote", vec![text("First.")]),
                line("quote", 0, Some("327a"), "Second."),
                kind("quote", vec![text("Third.")]),
            ],
        );
        let out = written(&c, &[numbered]);
        assert_eq!(out.len(), 1);
        let paras = out[0]["c"].as_array().unwrap();
        assert_eq!(paras[0]["c"][0]["c"], "First.", "nothing before the first number given");
        assert_eq!(paras[1]["c"][0]["c"][1][0]["c"], "327a\u{a0}\u{a0}");
        assert_eq!(paras[2]["c"][0]["c"][1][0]["c"], "328\u{a0}\u{a0}", "the count goes on from the digits");
    }

    #[test]
    fn a_list_is_nested_by_indent() {
        let keys = HashMap::new();
        let c = converter(&keys, Flavour::Plain);
        let list = passage(
            "list",
            vec![
                line("item", 0, None, "one"),
                line("item", 0, None, "two"),
                line("numbered", 1, Some("3"), "nested"),
                line("numbered", 1, None, "more"),
                line("item", 2, None, "deeper"),
                line("item", 0, None, "three"),
                line("numbered", 0, None, "apart"),
            ],
        );
        let out = written(&c, &[list]);
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
    fn code_and_a_family_of_the_writers_own() {
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
            passage(
                "code",
                vec![kind("code", vec![text("let x = 1;")]), kind("code", vec![]), kind("code", vec![text("let y;")])],
            ),
            passage("k1", vec![kind("k1", vec![text("Dear friend,")]), kind("k1", vec![text("I write.")])]),
            passage("draft", vec![kind("draft", vec![text("Look this up.")])]),
            passage("break", vec![kind("break", vec![])]),
        ];
        let out = written(&c, &blocks);
        assert_eq!(out.len(), 4);
        assert_eq!(out[0]["t"], "CodeBlock");
        assert_eq!(out[0]["c"][1], "let x = 1;\n\nlet y;");
        assert_eq!(out[1]["c"][0][2], json!([["custom-style", "Letter"]]));
        assert_eq!(out[2]["c"][0][2], json!([["custom-style", "Letter"]]));
        assert_eq!(out[3]["c"][0][2], json!([["custom-style", "Section Break"]]));
        assert_eq!(out[3]["c"][1][0]["c"][0]["c"], "*");
    }
}
