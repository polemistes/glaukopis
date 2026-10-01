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
//!
//! The speaker and the stage direction are kinds of words (`formats/kinds.rs`):
//! in Word and Writer they have character styles of their own, which the
//! format fills; elsewhere they are set as their looks say.

use serde_json::{Value, json};

use super::pandoc::{Converter, Flavour, attr, looked};
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
                            inner = self.line_words(inner, "speaker");
                        }
                        VerseLineKind::Direction => {
                            inner = self.line_words(inner, "direction");
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
                        VerseLineKind::Speaker => self.line_words(inner, "speaker"),
                        VerseLineKind::Direction => self.line_words(inner, "direction"),
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

    /// A speaker's name or a stage direction, as its kind of words is set:
    /// by a character style in Word and Writer, and by its look elsewhere.
    fn line_words(&self, inner: Vec<Value>, kind: &str) -> Vec<Value> {
        let Some(info) = self.extras.kinds.get(kind) else { return inner };
        match self.extras.flavour {
            Flavour::Docx | Flavour::Odt if !info.style.is_empty() => {
                vec![
                    json!({"t": "Span", "c": [["", [format!("gk-kind-{kind}")], [["custom-style", info.style]]], inner]}),
                ]
            }
            _ => {
                let mut inner = inner;
                if info.look.case == crate::formats::Case::Upper {
                    super::pandoc::upper(&mut inner);
                }
                looked(inner, &info.look)
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
