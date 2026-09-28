//! What stands in the text by itself, and where: figures, tables and
//! equations, to the left, in the middle or to the right, with the text
//! flowing around them or not, alone or beside each other.
//!
//! They are put together here, and not left to what each kind of document
//! has for figures and tables: so the number, the words and the order are
//! the same in all of them, and are what the format says. Each kind of
//! document has its own means of placing, which is what most of this is.
//!
//! - **Typst**: blocks with names, which the opening of the document
//!   (`formats/typst.rs`) says how to set; `gk-around` and `gk-row` from there.
//! - **LaTeX**: `wrapfigure` and `minipage`; tables are written by Pandoc and
//!   made what they must be by `resources/pandoc/tables.lua`.
//! - **Word**: tables without lines that hold what stands together, floating
//!   where the text flows around them; what Pandoc writes is marked, and set
//!   right after (`export/after.rs`).
//! - **Writer**: frames and tables, likewise.

use serde_json::{Value, json};

use super::pandoc::{Converter, Flavour, attr, tokens, typst_text};
use super::{Block, Inline, Table};
use crate::formats::{Align, CaptionPosition, Captioned, FigurePlacement, Rules, Stand};

/// What has a caption.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) enum Kind {
    Figure,
    Table,
}

impl Kind {
    fn name(self) -> &'static str {
        match self {
            Kind::Figure => "figure",
            Kind::Table => "table",
        }
    }

    /// The style of what is said of it, in a document for a word processor.
    fn caption_style(self) -> &'static str {
        match self {
            Kind::Figure => "Figure Caption",
            Kind::Table => "Table Caption",
        }
    }
}

/// Where something stands in the document that is made.
#[derive(Debug, Clone, Copy, PartialEq)]
pub(super) struct Place {
    pub stand: Stand,
    /// The text flows around it.
    pub around: bool,
    /// It stands beside others.
    pub beside: bool,
    /// The share of the width of the text that it has, where it has one:
    /// with the text flowing around it, and beside others.
    pub share: f64,
}

/// The parts of something that stands by itself: what is said of it over
/// it, the thing, and what is said of it under it.
#[derive(Debug, Default)]
pub(super) struct Parts {
    pub above: Vec<Value>,
    pub body: Vec<Value>,
    pub below: Vec<Value>,
}

impl Parts {
    fn all(self) -> Vec<Value> {
        let mut out = self.above;
        out.extend(self.body);
        out.extend(self.below);
        out
    }
}

fn word(stand: Stand) -> &'static str {
    match stand {
        Stand::Left => "left",
        Stand::Center => "center",
        Stand::Right => "right",
    }
}

fn raw(format: &str, text: impl Into<String>) -> Value {
    json!({"t": "RawBlock", "c": [format, text.into()]})
}

fn styled(style: &str, blocks: Vec<Value>) -> Value {
    json!({"t": "Div", "c": [["", [], [["custom-style", style]]], blocks]})
}

fn named(id: &str, blocks: Vec<Value>) -> Value {
    json!({"t": "Div", "c": [[id, [], []], blocks]})
}

fn classed(classes: &[&str], blocks: Vec<Value>) -> Value {
    json!({"t": "Div", "c": [["", classes, []], blocks]})
}

/// A measure in the twentieths of a point that Word counts in.
fn twips(points: f64) -> i64 {
    (points * 20.0).round() as i64
}

/// A measure in inches, as Writer has them.
fn inches(points: f64) -> String {
    format!("{:.4}in", points / 72.0)
}

/// The gap between things that stand beside each other, as a share of the width of the text.
const GAP: f64 = 0.04;

impl Converter<'_> {
    fn captioned(&self, kind: Kind) -> Captioned {
        match kind {
            Kind::Figure => self.extras.figures.captioned(),
            Kind::Table => self.extras.tables.captioned(),
        }
    }

    /// Where something stands: as is said of it, and as the format has it
    /// where nothing is said. The text flows around what stands at a side.
    pub(super) fn place(&self, kind: Option<Kind>, stand: Option<Stand>, wrap: Option<bool>, share: f64) -> Place {
        let (usual, around) = match kind {
            Some(kind) => {
                let c = self.captioned(kind);
                (c.align, c.wrap)
            }
            None => (self.extras.equations.align, false),
        };
        let stand = stand.unwrap_or(usual);
        let around = kind.is_some() && wrap.unwrap_or(around) && stand != Stand::Center;
        Place { stand, around, beside: false, share: share.clamp(0.1, 1.0) }
    }

    /// For LaTeX: what ends the flowing of text around something that
    /// stands before, where something stands apart. Without it, what
    /// follows a figure at a side too closely is made as narrow as the text
    /// beside the figure.
    fn apart(&self) -> &'static str {
        if self.extras.flows { "\\WFclear\n" } else { "" }
    }

    /// A label and its number, as "Figure 1": the words as tokens, in the
    /// weight the format gives them.
    fn label(&self, kind: Kind, number: Option<u32>) -> Vec<Value> {
        let c = self.captioned(kind);
        let words = match number {
            Some(n) if !c.label.trim().is_empty() => format!("{}\u{a0}{n}", c.label.trim()),
            Some(n) => n.to_string(),
            None => String::new(),
        };
        if words.is_empty() {
            return Vec::new();
        }
        let mut label = Vec::new();
        tokens(&words, &mut label);
        if c.label_italic {
            label = vec![json!({"t": "Emph", "c": label})];
        }
        if c.label_bold {
            label = vec![json!({"t": "Strong", "c": label})];
        }
        label
    }

    /// What is said of a figure or a table, set as the format has it:
    /// the label, what parts it from the words, and the words.
    ///
    /// What stands at a side by itself has what is said of it at that
    /// side; in the middle, within a frame and in a row, it is set as the
    /// format says.
    fn caption(&self, kind: Kind, label: &[Value], said: &[Inline], anchor: Option<Value>, place: Place) -> Vec<Value> {
        let c = self.captioned(kind);
        let x = &self.extras;
        let side = match place.stand {
            Stand::Left if !place.around && !place.beside => Some((Align::Left, "left", " Left")),
            Stand::Right if !place.around && !place.beside => Some((Align::Right, "right", " Right")),
            _ => None,
        };
        let mut words: Vec<Value> = anchor.into_iter().collect();
        words.extend(label.iter().cloned());
        let said = self.inlines(said);
        if !label.is_empty() && !said.is_empty() {
            for (i, part) in c.separator.split('\n').enumerate() {
                if i > 0 {
                    words.push(json!({"t": "LineBreak"}));
                }
                tokens(part, &mut words);
                // A space at the end of the separator is a space, not nothing.
                if part.ends_with(' ') && !matches!(words.last(), Some(v) if v["t"] == "Space") {
                    words.push(json!({"t": "Space"}));
                }
            }
        }
        let mut said = said;
        if c.caption_italic && !said.is_empty() {
            said = vec![json!({"t": "Emph", "c": said})];
        }
        words.extend(said);
        if label.is_empty() && words.iter().all(|w| w["t"] == "Span") {
            // Nothing is said, and there is no number: a place alone is no caption.
            return Vec::new();
        }
        let line = json!({"t": "Para", "c": words});
        let at = side.map(|s| format!("-{}", s.1)).unwrap_or_default();
        match x.flavour {
            Flavour::Typst => vec![named(&format!("gk-{}-caption{at}", kind.name()), vec![line])],
            Flavour::Latex => {
                let size = if c.caption_size > 0.0 {
                    format!(
                        "\\fontsize{{{}}}{{{}}}\\selectfont",
                        c.caption_size,
                        (c.caption_size * 12.0).round() / 10.0
                    )
                } else {
                    String::new()
                };
                let align = match side.map(|s| s.0).unwrap_or(c.caption_align) {
                    Align::Center => "\\centering",
                    Align::Right => "\\raggedleft",
                    Align::Left => "\\raggedright",
                    // As the text is, which LaTeX sets so by itself.
                    Align::Justified => "",
                };
                // What stands over something is kept on the page with it.
                let keep = if c.caption_position == CaptionPosition::Above { "\\par}\\nopagebreak" } else { "\\par}" };
                vec![
                    raw("latex", format!("{{{align}{size}\\setlength{{\\parindent}}{{0pt}}")),
                    line,
                    raw("latex", keep),
                ]
            }
            Flavour::Docx | Flavour::Odt => {
                let style = format!("{}{}", kind.caption_style(), side.map(|s| s.2).unwrap_or_default());
                vec![styled(&style, vec![line])]
            }
            Flavour::Plain => vec![classed(&[&format!("gk-{}-caption", kind.name())], vec![line])],
        }
    }

    /// The parts in their order, with what is said over or under the thing.
    fn parts(&self, kind: Kind, body: Vec<Value>, caption: Vec<Value>) -> Parts {
        match self.captioned(kind).caption_position {
            CaptionPosition::Above => Parts { above: caption, body, below: Vec::new() },
            CaptionPosition::Below => Parts { above: Vec::new(), body, below: caption },
        }
    }

    /// The share of the width that a picture is given in what is written:
    /// of what it stands in, where the kind of document counts so; of the
    /// text, where it counts so, as Word does.
    fn width_shown(&self, width: f64, place: Place) -> f64 {
        let within = place.around || place.beside;
        match self.extras.flavour {
            Flavour::Docx if within => (width * place.share).clamp(0.02, 1.0),
            _ => width.clamp(0.02, 1.0),
        }
    }

    /// A picture with what is said of it.
    #[allow(clippy::too_many_arguments)]
    pub(super) fn figure(
        &self,
        id: &str,
        file: &str,
        extension: &str,
        name: &str,
        caption: &[Inline],
        alt: &str,
        numbered: bool,
        place: Place,
        width: f64,
    ) -> (Parts, Vec<Value>, String) {
        let x = &self.extras;
        let number = numbered.then(|| {
            x.figure.set(x.figure.get() + 1);
            x.figure.get()
        });
        let label = self.label(Kind::Figure, number);

        let stored = format!("{file}.{}", extension.trim_start_matches('.').to_ascii_lowercase());
        let safe = file.len() == 64 && file.chars().all(|c| c.is_ascii_hexdigit());
        let mut shown: Vec<Value> = x.anchor(id).into_iter().collect();
        if safe && x.present.contains(&stored) {
            let mut described = Vec::new();
            tokens(alt.trim(), &mut described);
            // With the text flowing around it, the picture is as wide as the room it is given.
            let of = if place.around { 1.0 } else { width };
            let width = format!("{:.0}%", self.width_shown(of, place) * 100.0);
            let source = if x.files.is_empty() { stored } else { format!("{}/{stored}", x.files) };
            shown.push(json!({"t": "Image", "c": [["", [], [["width", width]]], described, [source, ""]]}));
        } else {
            let said = if name.trim().is_empty() { "the file" } else { name.trim() };
            x.absent.borrow_mut().push(said.to_owned());
            tokens(&format!("[The picture is not here: {said}]"), &mut shown);
        };
        let picture = json!({"t": "Para", "c": shown});
        let body = match x.flavour {
            Flavour::Docx | Flavour::Odt => {
                let style = match (place.stand, place.around || place.beside) {
                    (_, true) | (Stand::Center, _) => "Figure",
                    (Stand::Left, _) => "Figure Left",
                    (Stand::Right, _) => "Figure Right",
                };
                vec![styled(style, vec![picture])]
            }
            _ => vec![picture],
        };
        let said = self.caption(Kind::Figure, &label, caption, None, place);
        let which = if label.is_empty() { name.trim().to_owned() } else { String::new() };
        (self.parts(Kind::Figure, body, said), label, which)
    }

    /// A table with what is said of it.
    pub(super) fn table(&self, table: &Table, place: Place) -> (Parts, Vec<Value>, String) {
        let x = &self.extras;
        let number = table.numbered.then(|| {
            x.table.set(x.table.get() + 1);
            x.table.get()
        });
        let label = self.label(Kind::Table, number);
        let within = place.around || place.beside;
        // The table is as wide as it was said to be, or as it needs to be;
        // and no wider than the room it has.
        let room = if within { place.share } else { 1.0 };
        let inner = self.pandoc_table(table, room);
        let t = &x.tables;
        let rules = match t.rules {
            Rules::Horizontal => "horizontal",
            Rules::Grid => "grid",
            Rules::None => "none",
        };
        let mut body = Vec::new();
        match x.flavour {
            Flavour::Latex => body.push(json!({"t": "Div", "c": [
                ["", ["gk-tabular"], [
                    ["stand", word(place.stand)],
                    ["rules", rules],
                    ["kind", if within { "fixed" } else { "long" }],
                    ["size", format!("{}", t.size)],
                    ["spacing", format!("{}", t.line_spacing)],
                    ["bold", if t.header_bold { "yes" } else { "no" }],
                ]],
                [inner],
            ]})),
            Flavour::Docx => {
                body.push(raw("openxml", format!("<!--gk:table stand={} within={}-->", word(place.stand), within)));
                body.push(inner);
                // A table of a word processor has no room after it of its own.
                if self.captioned(Kind::Table).caption_position == CaptionPosition::Above || table.caption.is_empty() {
                    body.push(raw("openxml", AFTER_TABLE_WORD));
                }
            }
            Flavour::Odt => {
                body.push(raw(
                    "opendocument",
                    format!("<!--gk:table stand={} within={} rules={rules}-->", word(place.stand), within),
                ));
                body.push(inner);
                if self.captioned(Kind::Table).caption_position == CaptionPosition::Above || table.caption.is_empty() {
                    body.push(raw("opendocument", "<text:p text:style-name=\"GkAfterTable\"/>"));
                }
            }
            Flavour::Typst | Flavour::Plain => body.push(inner),
        }
        // Its place, for what points to it, is in what is said of it; where
        // nothing is said, in a line before it.
        let anchor = x.anchor(&table.id);
        let said = self.caption(Kind::Table, &label, &table.caption, anchor.clone(), place);
        if said.is_empty()
            && let Some(anchor) = anchor
        {
            body.insert(0, json!({"t": "Plain", "c": [anchor]}));
        }
        (self.parts(Kind::Table, body, said), label, String::new())
    }

    /// A table as Pandoc has tables: its rows and cells, without what is
    /// said of it. `room` is the share of the width of the text it may take.
    fn pandoc_table(&self, table: &Table, room: f64) -> Value {
        let columns = table.columns().max(1);
        let bold = self.extras.tables.header_bold;
        let cell = |c: &super::Cell| -> Value {
            let mut inner = Vec::new();
            self.blocks(&c.content, &mut inner);
            // One paragraph alone is a line, and takes no room around it.
            if inner.len() == 1 && inner[0]["t"] == "Para" {
                inner[0]["t"] = json!("Plain");
            }
            if c.header && bold {
                for block in inner.iter_mut() {
                    if block["t"] == "Plain" || block["t"] == "Para" {
                        block["c"] = json!([{"t": "Strong", "c": block["c"].take()}]);
                    }
                }
            }
            let align = match c.align {
                Some(Stand::Left) | None => "AlignLeft",
                Some(Stand::Center) => "AlignCenter",
                Some(Stand::Right) => "AlignRight",
            };
            json!([attr(), {"t": align}, c.rowspan.max(1), c.colspan.max(1), inner])
        };
        let row = |cells: &Vec<super::Cell>| -> Value { json!([attr(), cells.iter().map(cell).collect::<Vec<_>>()]) };
        let head = table.heading_rows();
        let body = &table.rows[head..];
        // The columns at the left that are headings of their rows.
        let mut stub = 0usize;
        while stub < columns
            && !body.is_empty()
            && body.iter().all(|r| {
                let mut at = 0usize;
                r.iter().any(|c| {
                    let here = at == stub && c.header;
                    at += c.colspan.max(1) as usize;
                    here
                })
            })
        {
            stub += 1;
        }
        // A word processor makes a table as wide as the page unless it is
        // told how wide the columns are.
        let told = matches!(self.extras.flavour, Flavour::Docx | Flavour::Odt);
        let mut widths = table.widths(room, told);
        // Where a width is a share of what the table stands in, and not of
        // the text, it is that share which is said.
        if room < 1.0 {
            for w in widths.iter_mut() {
                *w = ((*w / room) * 1000.0).round() / 1000.0;
            }
        }
        // Where the columns stand is said of each: what is left to the
        // document would follow where the table stands.
        let specs: Vec<Value> = (0..columns)
            .map(|i| match widths.get(i) {
                Some(w) => json!([{"t": "AlignLeft"}, {"t": "ColWidth", "c": w}]),
                None => json!([{"t": "AlignLeft"}, {"t": "ColWidthDefault"}]),
            })
            .collect();
        json!({"t": "Table", "c": [
            attr(),
            [null, []],
            specs,
            [attr(), table.rows[..head].iter().map(row).collect::<Vec<_>>()],
            [[attr(), stub.min(columns.saturating_sub(1)), [], body.iter().map(row).collect::<Vec<_>>()]],
            [attr(), []],
        ]})
    }

    /// Mathematics on a line of its own.
    pub(super) fn equation(&self, id: &str, tex: &str, numbered: bool, place: Place) -> Vec<Value> {
        let mut out = Vec::new();
        let tex = tex.trim();
        if tex.is_empty() {
            return out;
        }
        let x = &self.extras;
        // Its place, for what points to it. In Typst the equation itself is
        // given the name, after it; elsewhere the place is in the paragraph
        // the equation stands in, since a paragraph of its own would be a
        // line of its own.
        let anchor = x.anchor(id);
        let name = anchor.as_ref().and_then(|p| p["c"][0][0].as_str()).map(str::to_owned);
        let number = numbered.then(|| {
            x.equation.set(x.equation.get() + 1);
            format!("{}{}{}", x.equations.before_number, x.equation.get(), x.equations.after_number)
        });
        // Beside others, an equation stands in the middle of its room.
        let stand = if place.beside { Stand::Center } else { place.stand };
        let math = |tex: &str, with: Option<Value>| {
            let mut inner: Vec<Value> = with.into_iter().collect();
            inner.push(json!({"t": "Math", "c": [{"t": "DisplayMath"}, tex]}));
            json!({"t": "Para", "c": inner})
        };
        // Where an equation cannot be given a number, the number is part of it.
        let with_number = |tex: &str| match &number {
            Some(n) => format!("{tex} \\qquad \\text{{{}}}", n.replace('\\', "").replace(['{', '}'], "")),
            None => tex.to_owned(),
        };
        match x.flavour {
            Flavour::Typst => {
                // The number and the place are given to this equation alone:
                // what is set between the brackets holds for what is between them.
                let mut open = String::from("#[");
                if let Some(n) = &number {
                    open.push_str(&format!("#set math.equation(numbering: (..n) => [{}])\n", typst_text(n)));
                }
                if stand != Stand::Center {
                    open.push_str(&format!("#show math.equation: set align({})\n", word(stand)));
                    if stand == Stand::Left {
                        open.push_str("#show math.equation: it => pad(left: 2em, it)\n");
                    }
                }
                let plain = open == "#[";
                if !plain {
                    out.push(raw("typst", open.trim_end()));
                }
                out.push(math(tex, None));
                if let Some(n) = &name {
                    out.push(raw("typst", format!("<{n}>")));
                }
                if !plain {
                    out.push(raw("typst", "]"));
                }
            }
            Flavour::Latex => {
                let label =
                    name.as_ref().map(|n| format!("\\protect\\phantomsection\\label{{{n}}}%\n")).unwrap_or_default();
                let tag = number
                    .as_ref()
                    .map(|n| format!("\n\\tag*{{{}}}", crate::export::latex::escape(n)))
                    .unwrap_or_default();
                let set = match stand {
                    Stand::Center if number.is_none() => {
                        out.push(math(tex, anchor));
                        return out;
                    }
                    Stand::Center => format!("{label}\\begin{{equation*}}\n{tex}{tag}\n\\end{{equation*}}"),
                    // Set from the margin, a little in; or to the other margin.
                    Stand::Left => {
                        format!("{label}\\begin{{flalign*}}\n\\hspace{{2em}} & {{{tex}}} &&{tag}\n\\end{{flalign*}}")
                    }
                    Stand::Right => format!("{label}\\begin{{flalign*}}\n&& {{{tex}}} &{tag}\n\\end{{flalign*}}"),
                };
                out.push(raw("latex", set));
            }
            Flavour::Docx | Flavour::Odt => {
                let format = if x.flavour == Flavour::Docx { "openxml" } else { "opendocument" };
                if stand != Stand::Center {
                    // Pandoc sets equations in the middle: what it writes is marked, and set right after.
                    out.push(raw(format, format!("<!--gk:equation stand={}-->", word(stand))));
                }
                out.push(math(&with_number(tex), anchor));
            }
            Flavour::Plain => {
                let line = math(&with_number(tex), anchor);
                out.push(match stand {
                    Stand::Center => line,
                    side => classed(&["gk-equation", &format!("gk-{}", word(side))], vec![line]),
                });
            }
        }
        out
    }

    /// What stands by itself, where it stands. `after` is the text that
    /// flows around it, where the kind of document must be given it.
    pub(super) fn stand(&self, kind: Kind, parts: Parts, place: Place, after: Vec<Value>) -> Vec<Value> {
        let x = &self.extras;
        let name = kind.name();
        if place.beside {
            // Beside others: the row places it.
            return parts.all();
        }
        let share = place.share;
        match x.flavour {
            Flavour::Typst if place.around => {
                // What is given to it is given within its brackets, where
                // it does not matter that Pandoc parts the blocks by empty lines.
                let mut out = vec![raw("typst", format!("#gk-around({}, {:.1}%, [", word(place.stand), share * 100.0))];
                out.push(named(&format!("gk-{name}-within"), parts.all()));
                out.push(raw("typst", "], ["));
                out.extend(after);
                out.push(raw("typst", "])"));
                out
            }
            Flavour::Typst => vec![named(&format!("gk-{name}-{}", word(place.stand)), parts.all())],
            Flavour::Latex if place.around => {
                let side = if place.stand == Stand::Left { "l" } else { "r" };
                // What the text flows around does not move to where there is room,
                // as other figures do: near the foot of a page it is begun on the next.
                let mut out = vec![raw(
                    "latex",
                    format!(
                        "\\needspace{{9\\baselineskip}}\n\\begin{{wrapfigure}}{{{side}}}{{{share:.3}\\linewidth}}\n\\centering\\vspace{{-0.6\\baselineskip}}"
                    ),
                )];
                out.extend(parts.all());
                out.push(raw("latex", "\\end{wrapfigure}"));
                out.extend(after);
                out
            }
            Flavour::Latex => {
                let side = match place.stand {
                    Stand::Left => "\\raggedright",
                    Stand::Center => "\\centering",
                    Stand::Right => "\\raggedleft",
                };
                match kind {
                    Kind::Figure => {
                        let mut out = vec![raw("latex", format!("{}\\begin{{figure}}[H]\n{side}", self.apart()))];
                        out.extend(parts.all());
                        out.push(raw("latex", "\\end{figure}"));
                        out
                    }
                    // A table may go over several pages, and stands in nothing.
                    Kind::Table => {
                        let mut out =
                            vec![raw("latex", format!("{}\\par\\addvspace{{\\bigskipamount}}", self.apart()))];
                        out.extend(parts.all());
                        out.push(raw("latex", "\\par\\addvspace{\\bigskipamount}"));
                        out
                    }
                }
            }
            Flavour::Docx if place.around => {
                let width = twips(x.text_width * share);
                let mut out = vec![raw(
                    "openxml",
                    format!(
                        "<w:tbl><w:tblPr><w:tblStyle w:val=\"Layout\"/>\
                         <w:tblpPr w:leftFromText=\"{gap}\" w:rightFromText=\"{gap}\" w:topFromText=\"0\" w:bottomFromText=\"113\" \
                         w:vertAnchor=\"text\" w:horzAnchor=\"margin\" w:tblpXSpec=\"{side}\" w:tblpY=\"57\"/>\
                         <w:tblOverlap w:val=\"never\"/><w:tblW w:w=\"{width}\" w:type=\"dxa\"/><w:tblLayout w:type=\"fixed\"/>\
                         <w:tblLook w:firstRow=\"0\" w:lastRow=\"0\" w:firstColumn=\"0\" w:lastColumn=\"0\" w:noHBand=\"1\" w:noVBand=\"1\" w:val=\"0600\"/>\
                         </w:tblPr><w:tblGrid><w:gridCol w:w=\"{width}\"/></w:tblGrid>\
                         <w:tr><w:tc><w:tcPr><w:tcW w:w=\"{width}\" w:type=\"dxa\"/></w:tcPr>",
                        gap = 227,
                        side = word(place.stand),
                    ),
                )];
                out.extend(parts.all());
                // A cell ends with a paragraph, which is given no room.
                out.push(raw("openxml", format!("{END_OF_CELL}</w:tc></w:tr></w:tbl>")));
                out.extend(after);
                out
            }
            Flavour::Odt if place.around => {
                x.frames.set(x.frames.get() + 1);
                let mut out = vec![raw(
                    "opendocument",
                    format!(
                        "<text:p text:style-name=\"GkAnchor\"><draw:frame draw:style-name=\"GkAround{side}\" draw:name=\"gk-frame-{n}\" \
                         text:anchor-type=\"paragraph\" svg:width=\"{width}\" draw:z-index=\"0\"><draw:text-box fo:min-height=\"0.2in\">",
                        side = if place.stand == Stand::Left { "Left" } else { "Right" },
                        n = x.frames.get(),
                        width = inches(x.text_width * share),
                    ),
                )];
                out.extend(parts.all());
                out.push(raw("opendocument", "</draw:text-box></draw:frame></text:p>"));
                out.extend(after);
                out
            }
            Flavour::Docx | Flavour::Odt => parts.all(),
            Flavour::Plain => {
                let side = format!("gk-{}", word(place.stand));
                let mut classes = vec![format!("gk-{name}"), side];
                if place.around {
                    classes.push("gk-around".into());
                }
                let classes: Vec<&str> = classes.iter().map(String::as_str).collect();
                let mut all = vec![json!({"t": "Div", "c": [
                    ["", classes, [["style", format!("--gk-share: {:.0}%", share * 100.0)]]],
                    parts.all(),
                ]})];
                all.extend(after);
                all
            }
        }
    }

    /// Things that stand beside each other. What is said of them stands in
    /// a line over them or under them, and the things themselves with
    /// their feet on one line.
    pub(super) fn row(&self, items: Vec<Parts>) -> Vec<Value> {
        let x = &self.extras;
        let n = items.len();
        if n == 0 {
            return Vec::new();
        }
        let share = share_beside(n);
        let lines: [Vec<&Vec<Value>>; 3] = [
            items.iter().map(|p| &p.above).collect(),
            items.iter().map(|p| &p.body).collect(),
            items.iter().map(|p| &p.below).collect(),
        ];
        // What stands over is set on its foot, what stands under on its head.
        let kinds = ["above", "body", "below"];
        let used: Vec<usize> = (0..3).filter(|&i| lines[i].iter().any(|c| !c.is_empty())).collect();
        let mut out = Vec::new();
        match x.flavour {
            Flavour::Typst => {
                let aligns: Vec<&str> = used.iter().map(|&i| if i == 2 { "top" } else { "bottom" }).collect();
                out.push(raw("typst", format!("#gk-row({n}, ({},), [", aligns.join(", "))));
                let mut first = true;
                for &i in &used {
                    for cell in &lines[i] {
                        if !std::mem::take(&mut first) {
                            out.push(raw("typst", "], ["));
                        }
                        out.push(named("gk-within", (*cell).clone()));
                    }
                }
                out.push(raw("typst", "])"));
            }
            Flavour::Latex => {
                // Pandoc parts the blocks it writes by empty lines, and an
                // empty line between two of these would end the line they
                // stand on: where one ends, the next begins in the same breath.
                let mut open = format!(
                    "{}\\par\\addvspace{{\\bigskipamount}}{{\\setlength{{\\parindent}}{{0pt}}%\n",
                    self.apart()
                );
                for (at, &i) in used.iter().enumerate() {
                    let foot = if i == 2 { "t" } else { "b" };
                    if at > 0 {
                        // The lines of a row stay on one page.
                        open.push_str("\\par\\nopagebreak\\nointerlineskip\\vspace{0.5em}%\n");
                    }
                    for (j, cell) in lines[i].iter().enumerate() {
                        open.push_str(&format!(
                            "{}\\begin{{minipage}}[{foot}]{{{share:.4}\\linewidth}}\\centering",
                            if j == 0 { "\\noindent" } else { "\\hfill" }
                        ));
                        out.push(raw("latex", std::mem::take(&mut open)));
                        out.extend((*cell).clone());
                        if cell.is_empty() {
                            out.push(raw("latex", "\\mbox{}"));
                        }
                        open.push_str("\\end{minipage}%\n");
                    }
                }
                open.push_str("\\par}\\addvspace{\\bigskipamount}");
                out.push(raw("latex", open));
            }
            Flavour::Docx => {
                let whole = twips(x.text_width);
                let each = whole / n as i64;
                let columns: String = (0..n).map(|_| format!("<w:gridCol w:w=\"{each}\"/>")).collect();
                out.push(raw(
                    "openxml",
                    format!(
                        "<w:tbl><w:tblPr><w:tblStyle w:val=\"Layout\"/><w:tblW w:w=\"{whole}\" w:type=\"dxa\"/><w:jc w:val=\"center\"/>\
                         <w:tblLayout w:type=\"fixed\"/><w:tblLook w:firstRow=\"0\" w:lastRow=\"0\" w:firstColumn=\"0\" w:lastColumn=\"0\" \
                         w:noHBand=\"1\" w:noVBand=\"1\" w:val=\"0600\"/></w:tblPr><w:tblGrid>{columns}</w:tblGrid>"
                    ),
                ));
                for &i in &used {
                    let foot = if i == 2 { "top" } else { "bottom" };
                    out.push(raw("openxml", "<w:tr><w:trPr><w:cantSplit/></w:trPr>"));
                    for cell in &lines[i] {
                        out.push(raw(
                            "openxml",
                            format!(
                                "<w:tc><w:tcPr><w:tcW w:w=\"{each}\" w:type=\"dxa\"/><w:vAlign w:val=\"{foot}\"/></w:tcPr>"
                            ),
                        ));
                        out.extend((*cell).clone());
                        out.push(raw("openxml", format!("{END_OF_CELL}</w:tc>")));
                    }
                    out.push(raw("openxml", "</w:tr>"));
                }
                out.push(raw("openxml", "</w:tbl>"));
            }
            Flavour::Odt => {
                x.frames.set(x.frames.get() + 1);
                out.push(raw(
                    "opendocument",
                    format!(
                        "<table:table table:name=\"GkRow{}\" table:style-name=\"GkRow\">\
                         <table:table-column table:style-name=\"GkRowColumn\" table:number-columns-repeated=\"{n}\"/>",
                        x.frames.get()
                    ),
                ));
                for &i in &used {
                    let style = if i == 2 { "GkRowCellTop" } else { "GkRowCellBottom" };
                    out.push(raw("opendocument", "<table:table-row table:style-name=\"GkRowRow\">"));
                    for cell in &lines[i] {
                        out.push(raw(
                            "opendocument",
                            format!("<table:table-cell table:style-name=\"{style}\" office:value-type=\"string\">"),
                        ));
                        out.extend((*cell).clone());
                        if cell.is_empty() {
                            out.push(raw("opendocument", "<text:p text:style-name=\"GkAnchor\"/>"));
                        }
                        out.push(raw("opendocument", "</table:table-cell>"));
                    }
                    out.push(raw("opendocument", "</table:table-row>"));
                }
                out.push(raw("opendocument", "</table:table>"));
            }
            Flavour::Plain => {
                let mut cells = Vec::new();
                for &i in &used {
                    for cell in &lines[i] {
                        cells.push(classed(&["gk-cell", &format!("gk-{}", kinds[i])], (*cell).clone()));
                    }
                }
                out.push(json!({"t": "Div", "c": [
                    ["", ["gk-row"], [["style", format!("--gk-columns: {n}")]]],
                    cells,
                ]}));
            }
        }
        out
    }

    /// A line in the text that says where something belongs that stands at
    /// the end of the document.
    fn belongs_here(&self, kind: Kind, label: Vec<Value>, which: &str) -> Vec<Value> {
        let c = self.captioned(kind);
        let mut line = Vec::new();
        let (before, after) = c.placeholder.split_once("{}").unwrap_or(("[", " about here]"));
        tokens(before, &mut line);
        if label.is_empty() {
            let of_its_kind = if kind == Kind::Figure { "The figure" } else { "The table" };
            tokens(if which.is_empty() { of_its_kind } else { which }, &mut line);
        } else {
            line.extend(label);
        }
        tokens(after, &mut line);
        let line = json!({"t": "Para", "c": line});
        match self.extras.flavour {
            Flavour::Typst => vec![named(&format!("gk-{}-caption", kind.name()), vec![line])],
            Flavour::Latex => vec![raw("latex", "\\begin{center}"), line, raw("latex", "\\end{center}")],
            Flavour::Docx | Flavour::Odt => vec![styled(kind.caption_style(), vec![line])],
            Flavour::Plain => vec![classed(&[&format!("gk-{}-caption", kind.name())], vec![line])],
        }
    }

    /// What one block is made of, when it is a figure, a table or an
    /// equation: its parts, and what is needed to place it.
    fn item(&self, block: &Block, beside: Option<f64>) -> Option<Item> {
        let within = |mut place: Place| {
            if let Some(share) = beside {
                place.beside = true;
                place.around = false;
                place.share = share;
            }
            place
        };
        match block {
            Block::Figure { id, file, extension, name, caption, alt, width, numbered, align, wrap } => {
                let width = f64::from((*width).clamp(5, 100)) / 100.0;
                // With the text flowing around it, a figure is no wider than leaves room for the text.
                let place = within(self.place(Some(Kind::Figure), *align, *wrap, width.min(0.6)));
                let (parts, label, which) =
                    self.figure(id, file, extension, name, caption, alt, *numbered, place, width);
                Some((Some(Kind::Figure), parts, place, label, which))
            }
            Block::Table(table) => {
                let share = if table.width > 0 { f64::from(table.width.min(100)) / 100.0 } else { 0.45 };
                let place = within(self.place(Some(Kind::Table), table.align, table.wrap, share.min(0.7)));
                let (parts, label, which) = self.table(table, place);
                Some((Some(Kind::Table), parts, place, label, which))
            }
            Block::Equation { id, tex, numbered, align } => {
                let place = within(self.place(None, *align, None, 1.0));
                let body = self.equation(id, tex, *numbered, place);
                if body.is_empty() {
                    return None;
                }
                Some((None, Parts { body, ..Default::default() }, place, Vec::new(), String::new()))
            }
            _ => None,
        }
    }

    /// Whether what is of this kind stands at the end of the document.
    fn at_end(&self, kind: Option<Kind>) -> bool {
        kind.is_some_and(|k| self.captioned(k).placement == FigurePlacement::AtEnd)
    }

    /// Whether the text that follows must be given to what it flows around.
    pub(super) fn takes_text(&self, block: &Block) -> bool {
        if self.extras.flavour != Flavour::Typst {
            return false;
        }
        match block {
            Block::Figure { align, wrap, .. } if !self.at_end(Some(Kind::Figure)) => {
                self.place(Some(Kind::Figure), *align, *wrap, 1.0).around
            }
            Block::Table(t) if !self.at_end(Some(Kind::Table)) => {
                self.place(Some(Kind::Table), t.align, t.wrap, 1.0).around
            }
            _ => false,
        }
    }

    /// A figure, a table or an equation in the text, or a row of them.
    /// `after` is the text that flows around it, where that is given.
    pub(super) fn set_off(&self, block: &Block, after: Vec<Value>, out: &mut Vec<Value>) {
        let x = &self.extras;
        if let Block::Row { items } = block {
            let of_row: Vec<&Block> = items
                .iter()
                .filter(|b| matches!(b, Block::Figure { .. } | Block::Table(_) | Block::Equation { .. }))
                .collect();
            let apart = of_row.iter().any(|b| match b {
                Block::Figure { .. } => self.at_end(Some(Kind::Figure)),
                Block::Table(_) => self.at_end(Some(Kind::Table)),
                _ => false,
            });
            // Where some of them stand at the end of the document, each is by itself.
            if apart || of_row.len() < 2 {
                for b in of_row {
                    self.set_off(b, Vec::new(), out);
                }
                out.extend(after);
                return;
            }
            let share = share_beside(of_row.len());
            let parts: Vec<Parts> =
                of_row.iter().filter_map(|b| self.item(b, Some(share))).map(|(_, parts, ..)| parts).collect();
            out.extend(self.row(parts));
            out.extend(after);
            return;
        }
        let Some((kind, parts, place, label, which)) = self.item(block, None) else {
            out.extend(after);
            return;
        };
        match kind {
            Some(kind) if self.at_end(Some(kind)) => {
                out.extend(self.belongs_here(kind, label, &which));
                out.extend(after);
                // At the end they stand one under the other, where the format has them.
                let alone = Place { around: false, ..place };
                let whole = self.stand(kind, parts, alone, Vec::new());
                match kind {
                    Kind::Figure => x.held.borrow_mut().extend(whole),
                    Kind::Table => x.held_tables.borrow_mut().extend(whole),
                }
            }
            Some(kind) => out.extend(self.stand(kind, parts, place, after)),
            None => {
                out.extend(parts.all());
                out.extend(after);
            }
        }
    }
}

/// What a figure, a table or an equation is made of: its kind, where that
/// is one with a caption; its parts; where it stands; and, for the line
/// that says where it belongs when it stands at the end, its label, or
/// what else it is called.
type Item = (Option<Kind>, Parts, Place, Vec<Value>, String);

/// The share of the width that each of several has that stand beside each other.
fn share_beside(n: usize) -> f64 {
    let n = n.max(1) as f64;
    (1.0 - GAP * (n - 1.0)) / n
}

/// The room after a table, in Word.
const AFTER_TABLE_WORD: &str = "<w:p><w:pPr><w:spacing w:before=\"0\" w:after=\"0\" w:line=\"200\" w:lineRule=\"exact\"/>\
                                <w:rPr><w:sz w:val=\"2\"/></w:rPr></w:pPr></w:p>";

/// The paragraph a cell of Word must end with, given no room.
const END_OF_CELL: &str = "<w:p><w:pPr><w:spacing w:before=\"0\" w:after=\"0\" w:line=\"20\" w:lineRule=\"exact\"/>\
                           <w:rPr><w:sz w:val=\"2\"/></w:rPr></w:pPr></w:p>";
