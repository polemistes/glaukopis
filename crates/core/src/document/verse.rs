//! Lines of verse, and texts side by side: how each kind of document sets
//! them.
//!
//! - **Verse**: each line kept as a line. In Typst the lines are blocks with
//!   labels, which the opening of the document (`formats/typst.rs`) sets:
//!   numbered in the margin from the line the writer said, every so many
//!   lines, with speakers in small capitals and stage directions in
//!   italics. Elsewhere a line block, which every writer of Pandoc keeps as
//!   lines, with the speakers and the directions marked the same; the
//!   numbers are Typst's alone, for now.
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
            _ => {
                // A line block: lines, each as its kind has it. Indentation is
                // spaces that do not break, which Pandoc keeps at the head of a line.
                let mut block = Vec::new();
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
