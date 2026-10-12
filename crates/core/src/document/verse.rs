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
use crate::formats::typst::string;

/// The number a line shows in the margin, and whether it was given by hand.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Shown {
    pub label: String,
    pub set: bool,
}

/// A number given by hand, read for the count: what stands before its last
/// run of digits, that run, and how many digits it has where it begins with
/// a nought ("0567").
fn read_label(label: &str) -> Option<(String, i64, usize)> {
    let end = label.rfind(|c: char| c.is_ascii_digit())? + 1;
    let begin = label[..end].rfind(|c: char| !c.is_ascii_digit()).map_or(0, |i| i + 1);
    let digits = &label[begin..end];
    let n = digits.parse::<i64>().ok()?;
    let width = if digits.len() > 1 && digits.starts_with('0') { digits.len() } else { 0 };
    Some((label[..begin].to_owned(), n, width))
}

/// What each line of a verse shows in the margin: its number, or nothing.
/// The rule is that of `src/lib/project/model/lines.ts`, which the editor
/// follows (ADR 0039). Only lines are counted, from `start` where it is
/// given, or from the first line given a number by hand. A number given by
/// hand is shown, and the count goes on from its last run of digits ("567a"
/// is followed by 568, "1094a1" by "1094a2"); one without digits leaves the
/// count as it was. A line not counted shows only what was given it. Of the
/// others, a number that `by` divides is shown, and so is the first line of
/// a verse numbered from its start.
pub fn line_numbers(start: Option<i64>, by: u32, lines: &[VerseLine]) -> Vec<Option<Shown>> {
    let every = i64::from(by.max(1));
    // What comes before the digits, the number of the next line counted, and how many digits it has.
    let mut count: Option<(String, i64, usize)> = start.map(|n| (String::new(), n, 0));
    let mut first = start.is_some();
    lines
        .iter()
        .map(|line| {
            if line.kind != VerseLineKind::Line {
                return None;
            }
            let given = line.number.as_deref().map(str::trim).unwrap_or("");
            if !line.counted {
                return (!given.is_empty()).then(|| Shown { label: given.to_owned(), set: true });
            }
            if !given.is_empty() {
                if let Some((prefix, n, width)) = read_label(given) {
                    count = Some((prefix, n + 1, width));
                }
                first = false;
                return Some(Shown { label: given.to_owned(), set: true });
            }
            let (prefix, next, width) = count.as_mut()?;
            let n = *next;
            *next += 1;
            let shown = first || n.rem_euclid(every) == 0;
            first = false;
            shown.then(|| {
                let digits = format!("{:0width$}", n.unsigned_abs(), width = *width);
                Shown { label: format!("{prefix}{}{digits}", if n < 0 { "-" } else { "" }), set: false }
            })
        })
        .collect()
}

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
        let numbers = line_numbers(start, by, lines);
        let words = |text: &str| -> Vec<Value> {
            let mut inner = Vec::new();
            super::pandoc::tokens(text, &mut inner);
            inner
        };
        let margin_of =
            |line: &VerseLine| line.margin.as_deref().map(str::trim).filter(|m| !m.is_empty()).map(str::to_owned);
        match self.extras.flavour {
            Flavour::Typst => {
                // The numbers are counted here, and each line is given what it shows.
                out.push(raw("typst", "#gk-verse["));
                for (line, shown) in lines.iter().zip(&numbers) {
                    let n = shown.as_ref().map_or("none".to_owned(), |s| string(&s.label));
                    let margin = margin_of(line).map_or("none".to_owned(), |m| string(&m));
                    out.push(raw(
                        "typst",
                        format!("#gk-line(\"{}\", {}, n: {n}, margin: {margin})[", kind_name(line.kind), line.indent),
                    ));
                    out.push(json!({"t": "Plain", "c": self.inlines(&line.content)}));
                    out.push(raw("typst", "]"));
                }
                out.push(raw("typst", "]"));
            }
            Flavour::Latex => {
                // Each line a paragraph of its own, in a group that moves the
                // lines in; the number hangs in the margin at the left of it,
                // and words in the margin stand out at the right.
                let latex = |code: &str| json!({"t": "RawInline", "c": ["latex", code]});
                out.push(raw("latex", "{\\par\\leftskip=2.4em\\relax\\parindent=0pt\\parskip=0pt"));
                for (line, shown) in lines.iter().zip(&numbers) {
                    let mut inner = self.inlines(&line.content);
                    let mut lead = vec![latex("\\noindent")];
                    match line.kind {
                        VerseLineKind::Line => {
                            if let Some(shown) = shown {
                                lead.push(latex("\\llap{{\\footnotesize "));
                                lead.extend(words(&shown.label));
                                lead.push(latex("}\\hspace{0.9em}}"));
                            }
                            if line.indent > 0 {
                                lead.push(latex(&format!("\\hspace*{{{}em}}", line.indent as f32 * 1.5)));
                            }
                        }
                        VerseLineKind::Speaker => {
                            lead = vec![latex("\\medskip\\noindent")];
                            inner = self.line_words(inner, "speaker");
                        }
                        VerseLineKind::Direction => {
                            inner = self.line_words(inner, "direction");
                        }
                    }
                    inner.splice(0..0, lead);
                    if let Some(margin) = margin_of(line) {
                        inner.push(latex("\\nobreak\\hfill\\rlap{\\hspace{1em}\\footnotesize\\itshape "));
                        inner.extend(words(&margin));
                        inner.push(latex("}"));
                    }
                    inner.push(latex("\\par"));
                    out.push(json!({"t": "Plain", "c": inner}));
                }
                out.push(raw("latex", "\\par}\\medskip"));
            }
            _ => {
                // A line block: lines, each as its kind has it. Indentation is
                // spaces that do not break, which Pandoc keeps at the head of a
                // line; a number stands at the head of its line, small, and
                // words in the margin at its end: Word and Writer have no
                // margin to set them in.
                let mut block = Vec::new();
                for (line, shown) in lines.iter().zip(&numbers) {
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
                    if let Some(shown) = shown {
                        inner.insert(
                            0,
                            json!({"t": "Span", "c": [["", ["verse-number"], [["custom-style", "Verse Number"]]],
                                [{"t": "Str", "c": format!("{}\u{a0}\u{a0}", shown.label)}]]}),
                        );
                    }
                    if let Some(margin) = margin_of(line) {
                        inner.push(json!({"t": "Str", "c": "\u{a0}\u{a0}\u{a0}"}));
                        inner.push(
                            json!({"t": "Span", "c": [["", ["verse-margin"], [["custom-style", "Verse Margin"]]],
                            [{"t": "Emph", "c": words(&margin)}]]}),
                        );
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

#[cfg(test)]
mod tests {
    use super::*;

    fn line(kind: VerseLineKind, number: Option<&str>, counted: bool) -> VerseLine {
        VerseLine { kind, indent: 0, number: number.map(Into::into), counted, margin: None, content: Vec::new() }
    }

    fn shown(start: Option<i64>, by: u32, lines: &[VerseLine]) -> Vec<String> {
        line_numbers(start, by, lines)
            .into_iter()
            .map(|s| s.map_or("-".to_owned(), |s| if s.set { format!("{}!", s.label) } else { s.label }))
            .collect()
    }

    // The same cases as `src/lib/project/model/lines.test.ts`: the two must count alike.
    #[test]
    fn lines_are_counted_from_the_start_and_from_numbers_given_by_hand() {
        use VerseLineKind::*;
        let plain = |n| (0..n).map(|_| line(Line, None, true)).collect::<Vec<_>>();
        // From the start, every fifth, the speaker not counted.
        let mut lines = vec![line(Speaker, None, true)];
        lines.extend(plain(6));
        assert_eq!(shown(Some(1), 5, &lines), ["-", "1", "-", "-", "-", "5", "-"]);
        // Without a start, nothing; a number given by hand begins the count.
        let mut lines = plain(2);
        lines.push(line(Line, Some("1234"), true));
        lines.extend(plain(6));
        assert_eq!(shown(None, 5, &lines), ["-", "-", "1234!", "1235", "-", "-", "-", "-", "1240"]);
        // A label with a letter at its end: the count goes on from its number.
        let lines = vec![
            line(Line, Some("567"), true),
            line(Line, Some("567a"), true),
            line(Line, None, true),
            line(Line, None, true),
        ];
        assert_eq!(shown(None, 2, &lines), ["567!", "567a!", "568", "-"]);
        // A line not counted: the count passes over it; with a label it shows it.
        let lines = vec![
            line(Line, None, true),
            line(Line, None, false),
            line(Line, Some("4b"), false),
            line(Line, None, true),
        ];
        assert_eq!(shown(Some(4), 5, &lines), ["4", "-", "4b!", "5"]);
        // Bekker: the last run of digits is counted, what is before it kept; noughts kept.
        let mut lines = vec![line(Line, Some("1094a1"), true)];
        lines.extend(plain(5));
        lines.push(line(Line, Some("007"), true));
        lines.extend(plain(3));
        assert_eq!(shown(None, 5, &lines), ["1094a1!", "-", "-", "-", "1094a5", "-", "007!", "-", "-", "010"]);
        // A label without digits leaves the count as it was.
        let lines = vec![line(Line, None, true), line(Line, Some("*"), true), line(Line, None, true)];
        assert_eq!(shown(Some(1), 2, &lines), ["1", "*!", "2"]);
    }
}
