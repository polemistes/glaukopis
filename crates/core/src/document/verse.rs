//! Lines of verse, and texts side by side: how each kind of document sets
//! them.
//!
//! - **Verse**: each line kept as a line. In Typst the lines are blocks with
//!   labels, which the opening of the document (`formats/typst.rs`) sets:
//!   numbered in the margin from the line the writer said, every so many
//!   lines, with speakers in small capitals and stage directions in
//!   italics. In LaTeX each line is a paragraph of its own, with the number
//!   hanging in the margin. Elsewhere a line block, which every writer of
//!   Pandoc keeps as lines, with the speakers and the directions marked the
//!   same and the number at the head of its line, small.
//! - **Parallel**: an original and its translation side by side. A grid in
//!   Typst, two minipages in LaTeX, and a table without lines in Word and
//!   Writer.

use serde_json::{Value, json};

use super::pandoc::{Converter, Flavour, attr};
use super::{Block, VerseLine, VerseLineKind};

fn raw(format: &str, text: impl Into<String>) -> Value {
    json!({"t": "RawBlock", "c": [format, text.into()]})
}

/// The name of a kind of line, as Typst and the classes of a line block have it.
fn kind_name(kind: VerseLineKind) -> &'static str {
    match kind {
        VerseLineKind::Line => "line",
        VerseLineKind::Speaker => "speaker",
        VerseLineKind::Direction => "direction",
    }
}

impl Converter<'_> {
    pub(super) fn verse(&self, start: Option<i64>, by: u32, lines: &[VerseLine], out: &mut Vec<Value>) {
        if lines.is_empty() {
            return;
        }
        match self.extras.flavour {
            Flavour::Typst => {
                let start = start.map_or("none".to_owned(), |n| n.to_string());
                out.push(raw("typst", format!("#gk-verse(start: {start}, by: {})[", by.max(1))));
                for line in lines {
                    out.push(raw("typst", format!("#gk-line(\"{}\", {})[", kind_name(line.kind), line.indent)));
                    out.push(json!({"t": "Plain", "c": self.inlines(&line.content)}));
                    out.push(raw("typst", "]"));
                }
                out.push(raw("typst", "]"));
            }
            Flavour::Latex => {
                // Each line a paragraph of its own, in a group that moves the
                // lines in; the number hangs in the margin at the left of it.
                out.push(raw("latex", "{\\par\\leftskip=2.4em\\relax\\parindent=0pt\\parskip=0pt"));
                let mut n = start;
                for line in lines {
                    let mut inner = self.inlines(&line.content);
                    let mut lead = String::from("\\noindent");
                    match line.kind {
                        VerseLineKind::Line => {
                            if let Some(number) = n.as_mut() {
                                if *number == start.unwrap_or(0) || number.rem_euclid(i64::from(by.max(1))) == 0 {
                                    lead.push_str(&format!("\\llap{{{{\\footnotesize {number}}}\\hspace{{0.9em}}}}"));
                                }
                                *number += 1;
                            }
                            if line.indent > 0 {
                                lead.push_str(&format!("\\hspace*{{{}em}}", line.indent as f32 * 1.5));
                            }
                        }
                        VerseLineKind::Speaker => {
                            lead = "\\medskip\\noindent".into();
                            inner = vec![json!({"t": "SmallCaps", "c": inner})];
                        }
                        VerseLineKind::Direction => {
                            inner = vec![json!({"t": "Emph", "c": inner})];
                        }
                    }
                    inner.insert(0, json!({"t": "RawInline", "c": ["latex", lead]}));
                    inner.push(json!({"t": "RawInline", "c": ["latex", "\\par"]}));
                    out.push(json!({"t": "Plain", "c": inner}));
                }
                out.push(raw("latex", "\\par}\\medskip"));
            }
            _ => {
                // A line block: lines, each as its kind has it. Indentation is
                // spaces that do not break, which Pandoc keeps at the head of a
                // line; a number stands at the head of its line, small.
                let mut block = Vec::new();
                let mut n = start;
                for line in lines {
                    let mut inner = self.inlines(&line.content);
                    inner = match line.kind {
                        VerseLineKind::Line => inner,
                        VerseLineKind::Speaker => vec![json!({"t": "SmallCaps", "c": inner})],
                        VerseLineKind::Direction => vec![json!({"t": "Emph", "c": inner})],
                    };
                    if line.indent > 0 {
                        let spaces = "\u{a0}".repeat((line.indent as usize) * 4);
                        inner.insert(0, json!({"t": "Str", "c": spaces}));
                    }
                    if line.kind == VerseLineKind::Line
                        && let Some(number) = n.as_mut()
                    {
                        if *number == start.unwrap_or(0) || number.rem_euclid(i64::from(by.max(1))) == 0 {
                            inner.insert(
                                0,
                                json!({"t": "Span", "c": [["", ["verse-number"], [["custom-style", "Verse Number"]]],
                                    [{"t": "Str", "c": format!("{number}\u{a0}\u{a0}")}]]}),
                            );
                        }
                        *number += 1;
                    }
                    block.push(Value::Array(inner));
                }
                out.push(json!({"t": "LineBlock", "c": block}));
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

/// The text of inlines in capitals: scene headings, characters and transitions are set so.
fn upper(inlines: &mut [Value]) {
    for v in inlines.iter_mut() {
        if v["t"] == "Str" {
            if let Some(s) = v["c"].as_str() {
                v["c"] = Value::String(s.to_uppercase());
            }
        } else {
            // Emph, Strong and their like hold their inlines; a citation holds nothing to be set so.
            let holds = v["t"] != "Cite" && v["t"] != "Note";
            if holds && let Some(inner) = v["c"].as_array_mut() {
                upper(inner);
            }
        }
    }
}

impl Converter<'_> {
    /// A paragraph of a screenplay, set as scripts are: in Typst by the
    /// opening of the document, in LaTeX by what is written here, and in
    /// Word and Writer by a paragraph style named after the part.
    pub(super) fn script(&self, part: super::ScriptPart, content: &[super::Inline], out: &mut Vec<Value>) {
        use super::ScriptPart as P;
        let mut inner = self.inlines(content);
        if inner.is_empty() {
            return;
        }
        if matches!(part, P::Scene | P::Character | P::Transition) {
            upper(&mut inner);
        }
        match self.extras.flavour {
            Flavour::Typst => out.push(json!({"t": "Div", "c": [[format!("gk-script-{}", part.name()), [], []],
                [{"t": "Plain", "c": inner}]]})),
            Flavour::Latex => {
                let (open, close) = match part {
                    P::Scene => ("{\\par\\medskip\\noindent\\bfseries ", "\\par\\nobreak}"),
                    P::Action => ("{\\par\\noindent ", "\\par}"),
                    P::Character => ("{\\par\\medskip\\leftskip=5.6cm\\noindent ", "\\par\\nobreak}"),
                    P::Dialogue => ("{\\par\\leftskip=2.5cm\\rightskip=3.8cm\\noindent ", "\\par}"),
                    P::Parenthetical => ("{\\par\\leftskip=4cm\\rightskip=4cm\\noindent(", ")\\par\\nobreak}"),
                    P::Transition => ("{\\par\\medskip\\raggedleft ", "\\par}"),
                };
                inner.insert(0, json!({"t": "RawInline", "c": ["latex", open]}));
                inner.push(json!({"t": "RawInline", "c": ["latex", close]}));
                out.push(json!({"t": "Plain", "c": inner}));
            }
            Flavour::Docx | Flavour::Odt | Flavour::Plain => {
                let style = match part {
                    P::Scene => "Scene Heading",
                    P::Action => "Action",
                    P::Character => "Character",
                    P::Dialogue => "Dialogue",
                    P::Parenthetical => "Parenthetical",
                    P::Transition => "Transition",
                };
                if part == P::Parenthetical {
                    inner.insert(0, json!({"t": "Str", "c": "("}));
                    inner.push(json!({"t": "Str", "c": ")"}));
                }
                out.push(
                    json!({"t": "Div", "c": [["", [format!("script-{}", part.name())], [["custom-style", style]]],
                    [{"t": "Para", "c": inner}]]}),
                );
            }
        }
    }
}
