//! A format as the opening of a Typst document.
//!
//! Pandoc writes the text; what is written here says how it is to look. The
//! parts of the title block reach Typst as blocks with labels (`<gk-title>`
//! and so on), which are given their form by the rules made here.

use std::fmt::Write;

use super::{
    Align, Case, DocumentFormat, HeadContent, HeadingLevel, NoteKind, Paragraphs, Position, Rules, TitlePlacement,
    fallbacks,
};

/// What the running head and the properties of the file are made from.
#[derive(Debug, Clone, Default)]
pub struct Particulars {
    pub title: String,
    pub authors: Vec<String>,
    pub language: Option<String>,
    /// The notes at the foot of the page are those that were set against the
    /// format, which has its notes at the end: they are lettered, to be told
    /// from the numbered ones.
    pub lettered_footnotes: bool,
    /// Text flows around something in the document.
    pub flows: bool,
    /// The document has tables.
    pub tables: bool,
}

/// What makes text flow around what stands at its side: see the file.
const AROUND: &str = include_str!("../../../../resources/typst/wrap-it.typ");

/// A string of Typst code.
pub fn string(text: &str) -> String {
    let mut out = String::with_capacity(text.len() + 2);
    out.push('"');
    for c in text.chars() {
        match c {
            '\\' => out.push_str("\\\\"),
            '"' => out.push_str("\\\""),
            '\n' => out.push_str("\\n"),
            '\r' => {}
            '\t' => out.push_str("\\t"),
            c => out.push(c),
        }
    }
    out.push('"');
    out
}

fn pt(value: f32) -> String {
    let rounded = (value * 100.0).round() / 100.0;
    format!("{rounded}pt")
}

/// The space between lines, for a line spacing as word processors count it.
/// Lines are set one em high (see the edges of `text` below), and single
/// spacing is 1.2 em from baseline to baseline.
fn leading(spacing: f32) -> String {
    let em = (spacing * 1.2 - 1.0).max(0.0);
    format!("{}em", (em * 1000.0).round() / 1000.0)
}

fn align(a: Align) -> &'static str {
    match a {
        Align::Left | Align::Justified => "left",
        Align::Center => "center",
        Align::Right => "right",
    }
}

fn cased(case: Case, body: &str) -> String {
    match case {
        Case::None => body.to_owned(),
        Case::Upper => format!("upper({body})"),
        Case::Smallcaps => format!("smallcaps({body})"),
    }
}

fn fonts(family: &str) -> String {
    let mut list = vec![family.trim().to_owned()];
    for f in fallbacks(family) {
        if !list.iter().any(|x| x.eq_ignore_ascii_case(f)) {
            list.push(f.to_owned());
        }
    }
    let inner: Vec<String> = list.iter().map(|f| string(f)).collect();
    format!("({},)", inner.join(", "))
}

fn language(tag: Option<&str>) -> (String, Option<String>) {
    let tag = tag.unwrap_or("en").trim();
    let mut parts = tag.split(['-', '_']);
    let lang = parts.next().unwrap_or("en").to_ascii_lowercase();
    let region = parts.find(|p| p.len() == 2).map(|r| r.to_ascii_lowercase());
    let lang = if lang.len() == 2 || lang.len() == 3 { lang } else { "en".into() };
    (lang, region)
}

fn heading_rule(out: &mut String, level: usize, h: &HeadingLevel, format: &DocumentFormat) {
    let indent = if h.indent { format.text.indent.to_string() } else { "0pt".into() };
    let number = if format.headings.numbered {
        "if it.numbering != none { counter(heading).display(it.numbering); h(0.6em) }; "
    } else {
        ""
    };
    let _ = writeln!(
        out,
        "#show heading.where(level: {level}): it => {{
  set text(size: {size}, weight: {weight}, style: {style})
  set par(first-line-indent: 0pt, leading: {leading}, justify: false)
  set align({align})
  block(above: {above}, below: {below} + {extra}, sticky: true, inset: (left: {indent}), {{ {number}{body} }})
}}",
        size = pt(h.size),
        weight = if h.bold { "\"bold\"" } else { "\"regular\"" },
        style = if h.italic { "\"italic\"" } else { "\"normal\"" },
        leading = leading(1.0),
        align = align(h.align),
        above = h.space_before,
        below = h.space_after,
        // A word processor puts the room that wide line spacing asks for above
        // each line: so the text below a heading stands further from it than
        // the space after the heading alone.
        extra = pt(((format.text.line_spacing - 1.0) * 1.2 * format.font.size).max(0.0)),
        body = cased(h.case, "it.body"),
    );
}

fn margin_item(position: Position, wanted_top: bool, content: &str, slots: &mut [Vec<String>; 3]) {
    if position.is_top() != wanted_top {
        return;
    }
    let slot = match position.align() {
        Align::Left | Align::Justified => 0,
        Align::Center => 1,
        Align::Right => 2,
    };
    slots[slot].push(content.to_owned());
}

fn margin_row(format: &DocumentFormat, p: &Particulars, top: bool) -> Option<String> {
    let mut slots: [Vec<String>; 3] = [Vec::new(), Vec::new(), Vec::new()];

    // The running head, which stands at the top.
    if top && format.running_head.content != HeadContent::None {
        let authors = if format.title.anonymous { String::new() } else { p.authors.join(", ") };
        let words = match format.running_head.content {
            HeadContent::Title => p.title.clone(),
            HeadContent::Author => authors,
            HeadContent::AuthorTitle => {
                if authors.is_empty() {
                    p.title.clone()
                } else {
                    format!("{authors}: {}", p.title)
                }
            }
            HeadContent::Text => format.running_head.text.clone(),
            HeadContent::None => String::new(),
        };
        if !words.trim().is_empty() {
            let body = cased(format.running_head.case, &format!("text({})", string(words.trim())));
            let slot = match format.running_head.align {
                Align::Left | Align::Justified => 0,
                Align::Center => 1,
                Align::Right => 2,
            };
            slots[slot].push(body);
        }
    }

    if format.page_numbers.show {
        let number = if format.page_numbers.first_page {
            "counter(page).display(\"1\")".to_owned()
        } else {
            "if counter(page).get().first() > 1 { counter(page).display(\"1\") }".to_owned()
        };
        margin_item(format.page_numbers.position, top, &number, &mut slots);
    }

    if slots.iter().all(Vec::is_empty) {
        return None;
    }
    let cell = |items: &Vec<String>, a: &str| {
        if items.is_empty() {
            "[]".to_owned()
        } else {
            // The number goes outermost on its side.
            format!("align({a}, {{ {} }})", items.join("; h(1em); "))
        }
    };
    // With nothing in the middle, the sides may take all the width they need.
    let grid = if slots[1].is_empty() {
        format!(
            "grid(columns: (1fr, auto), column-gutter: 2em, {}, {})",
            cell(&slots[0], "left"),
            cell(&slots[2], "right")
        )
    } else {
        format!(
            "grid(columns: (1fr, auto, 1fr), column-gutter: 1em, {}, {}, {})",
            cell(&slots[0], "left"),
            cell(&slots[1], "center"),
            cell(&slots[2], "right")
        )
    };
    Some(format!(
        "context {{
    set text(size: {size})
    set par(first-line-indent: 0pt, leading: {leading}, justify: false)
    {grid}
  }}",
        size = pt(format.font.size),
        leading = leading(1.0),
    ))
}

/// The opening of the document: everything up to where Pandoc's text begins.
pub fn preamble(format: &DocumentFormat, p: &Particulars) -> String {
    let mut out = String::new();
    let f = format;
    let (lang, region) = language(p.language.as_deref());
    let body_leading = leading(f.text.line_spacing);
    let justify = f.text.align == Align::Justified;

    let _ = writeln!(out, "// Made by Glaukopis from the format “{}”.", f.name.replace('\n', " "));
    let authors: Vec<String> =
        if f.title.anonymous { Vec::new() } else { p.authors.iter().map(|a| string(a)).collect() };
    let _ = writeln!(
        out,
        "#set document(title: {}, author: ({}))",
        string(&p.title),
        authors.iter().map(|a| format!("{a},")).collect::<String>()
    );

    // The page.
    let paper = match f.page.size.to_ascii_lowercase().as_str() {
        "a4" => "paper: \"a4\"".to_owned(),
        "a5" => "paper: \"a5\"".to_owned(),
        "b5" => "paper: \"iso-b5\"".to_owned(),
        "letter" | "us-letter" => "paper: \"us-letter\"".to_owned(),
        "legal" | "us-legal" => "paper: \"us-legal\"".to_owned(),
        _ => {
            let (w, h) = f.page.dimensions();
            format!("width: {}, height: {}", pt(w), pt(h))
        }
    };
    let header = margin_row(f, p, true);
    let footer = margin_row(f, p, false);
    let _ = writeln!(
        out,
        "#set page(
  {paper},
  margin: (top: {top}, bottom: {bottom}, left: {left}, right: {right}),
  numbering: none,
  header: {header},
  footer: {footer},
)",
        top = f.page.margin_top,
        bottom = f.page.margin_bottom,
        left = f.page.margin_left,
        right = f.page.margin_right,
        header = header.as_deref().unwrap_or("none"),
        footer = footer.as_deref().unwrap_or("none"),
    );

    // The text.
    let _ = writeln!(
        out,
        "#set text(
  font: {fonts},
  size: {size},
  lang: {lang},{region}
  hyphenate: {hyphenate},
  top-edge: 0.8em,
  bottom-edge: -0.2em,
)
#set smartquote(enabled: false)",
        fonts = fonts(&f.font.family),
        size = pt(f.font.size),
        lang = string(&lang),
        region = region.map(|r| format!("\n  region: {},", string(&r))).unwrap_or_default(),
        hyphenate = f.text.hyphenate,
    );
    let (indent, spacing) = match f.text.paragraphs {
        Paragraphs::Indent => {
            (format!("(amount: {}, all: {})", f.text.indent, f.text.indent_first), body_leading.clone())
        }
        Paragraphs::Spaced => ("0pt".to_owned(), format!("{body_leading} + {}", f.text.space_between)),
    };
    let _ = writeln!(
        out,
        "#set par(leading: {body_leading}, spacing: {spacing}, first-line-indent: {indent}, justify: {justify})"
    );
    if f.line_numbers {
        let _ = writeln!(out, "#set par.line(numbering: \"1\")");
    }
    let _ = writeln!(out, "#set list(indent: 1em)\n#set enum(indent: 1em)\n#set terms(hanging-indent: 1.5em)");

    // Headings.
    if f.headings.numbered {
        let _ = writeln!(out, "#set heading(numbering: \"1.1\")");
    }
    for level in 1..=6 {
        heading_rule(&mut out, level, &f.heading(level), f);
    }

    // Quotations set off from the text.
    let quote_leading = if f.quote.line_spacing > 0.0 { leading(f.quote.line_spacing) } else { body_leading.clone() };
    let _ = writeln!(
        out,
        "#show quote.where(block: true): it => {{
  set text({size}style: {style})
  set par(leading: {quote_leading}, spacing: {quote_leading}, first-line-indent: 0pt)
  block(width: 100%, inset: (left: {left}, right: {right}), above: {gap}, below: {gap}, it.body)
}}",
        size = if f.quote.size > 0.0 { format!("size: {}, ", pt(f.quote.size)) } else { String::new() },
        style = if f.quote.italic { "\"italic\"" } else { "\"normal\"" },
        left = f.quote.indent_left,
        right = f.quote.indent_right,
        gap = format!("{body_leading} + 0.6em"),
    );

    // Notes at the foot of the page: those of the format, or single ones in a
    // format that has its notes at the end.
    if p.lettered_footnotes {
        let _ = writeln!(out, "#set footnote(numbering: \"a\")");
    }
    if f.notes.kind == NoteKind::Footnotes || p.lettered_footnotes {
        let _ = writeln!(
            out,
            "#set footnote.entry(gap: 0.5em, separator: line(length: 30%, stroke: 0.5pt))
#show footnote.entry: set text(size: {size})
#show footnote.entry: set par(leading: {leading}, spacing: {leading}, first-line-indent: 0pt, justify: {justify})",
            size = pt(f.notes.size),
            leading = leading(f.notes.line_spacing),
        );
    }
    // Notes at the end are made into text before Typst sees them; their form:
    let _ = writeln!(
        out,
        "#show <gk-notes>: it => {{
  set text(size: {size})
  set par(leading: {leading}, spacing: {leading} + 0.3em, first-line-indent: 0pt, hanging-indent: 1.6em)
  it
}}",
        size = pt(f.notes.size),
        leading = leading(f.notes.line_spacing),
    );

    // The bibliography.
    let bib_leading =
        if f.bibliography.line_spacing > 0.0 { leading(f.bibliography.line_spacing) } else { body_leading.clone() };
    let _ = writeln!(
        out,
        "#show <refs>: it => {{
  set text({size}hyphenate: false)
  set par(leading: {bib_leading}, spacing: {bib_leading} + {entry}, first-line-indent: 0pt, hanging-indent: {hanging}, justify: false)
  it
}}",
        size = if f.bibliography.size > 0.0 { format!("size: {}, ", pt(f.bibliography.size)) } else { String::new() },
        entry = f.bibliography.entry_spacing,
        hanging = f.bibliography.hanging_indent,
    );

    // Figures: a picture with what is said of it, put together before Typst sees it.
    // A figure stands where it is put; what is said of it is set as the format says.
    for side in ["left", "center", "right"] {
        let _ = writeln!(
            out,
            "#show <gk-figure-{side}>: it => {{
  set par(first-line-indent: 0pt, justify: false)
  set align({side})
  block(width: 100%, above: {body_leading} + 1.2em, below: {body_leading} + 1.2em, breakable: false, it.body)
}}
#show <gk-table-{side}>: it => {{
  set par(first-line-indent: 0pt, justify: false)
  show figure: set align({side})
  block(width: 100%, above: {body_leading} + 1.2em, below: {body_leading} + 1.2em, it.body)
}}"
        );
    }
    // Within a row, or with the text flowing around it, it fills the room it is given.
    let _ = writeln!(
        out,
        "#show <gk-figure-within>: it => {{
  set par(first-line-indent: 0pt, justify: false)
  set align(center)
  block(width: 100%, above: 0pt, below: 0pt, it.body)
}}
#show <gk-table-within>: it => {{
  set par(first-line-indent: 0pt, justify: false)
  show figure: set align(center)
  block(width: 100%, above: 0pt, below: 0pt, it.body)
}}
#show <gk-within>: it => {{
  set par(first-line-indent: 0pt, justify: false)
  show figure: set align(center)
  block(width: 100%, above: 0pt, below: 0pt, it.body)
}}"
    );
    for (name, c) in [("figure", f.figures.captioned()), ("table", f.tables.captioned())] {
        let leading_of_caption =
            if c.caption_line_spacing > 0.0 { leading(c.caption_line_spacing) } else { body_leading.clone() };
        // What stands at a side has what is said of it at that side.
        for (at, to) in [("", c.caption_align), ("-left", Align::Left), ("-right", Align::Right)] {
            let _ = writeln!(
                out,
                "#show <gk-{name}-caption{at}>: it => {{
  set text({size}hyphenate: false)
  set par(leading: {leading_of_caption}, spacing: {leading_of_caption}, first-line-indent: 0pt, justify: {justify})
  set align({to})
  block(width: 100%, above: 0.9em, below: 0.9em, sticky: {sticky}, it.body)
}}",
                sticky = c.caption_position == super::CaptionPosition::Above,
                size = if c.caption_size > 0.0 { format!("size: {}, ", pt(c.caption_size)) } else { String::new() },
                justify = to == Align::Justified,
                to = align(to),
            );
        }
    }

    // Tables. Pandoc writes each as a figure, set in the middle; here it
    // is the table alone, which stands where it is put.
    let t = &f.tables;
    let line = "0.7pt";
    let (stroke, frame, under) = match t.rules {
        Rules::Horizontal => ("none", format!("(top: {line}, bottom: {line})"), "0.5pt"),
        Rules::Grid => ("0.5pt", "none".to_owned(), "0.5pt"),
        Rules::None => ("none", "none".to_owned(), "none"),
    };
    let table_leading = if t.line_spacing > 0.0 { leading(t.line_spacing) } else { body_leading.clone() };
    let _ = writeln!(
        out,
        "#set table(stroke: {stroke}, inset: (x: 0.6em, y: 0.42em))
#set table.hline(stroke: {under})
#show figure.where(kind: table): it => if it.body.has(\"body\") {{ it.body.body }} else {{ it.body }}
#show table: it => {{
  set text({size}hyphenate: false)
  set par(leading: {table_leading}, spacing: {table_leading}, first-line-indent: 0pt, justify: false)
  block(stroke: {frame}, it)
}}",
        size = if t.size > 0.0 { format!("size: {}, ", pt(t.size)) } else { String::new() },
    );

    // Things that stand beside each other: each line of them on its foot or
    // its head, as it is said of the line.
    let _ = writeln!(
        out,
        "#let gk-row(n, feet, ..cells) = block(
  width: 100%, above: {body_leading} + 1.2em, below: {body_leading} + 1.2em, breakable: false,
  grid(
    columns: (1fr,) * n, column-gutter: 4%, row-gutter: 0.5em,
    ..cells.pos().enumerate().map(((i, cell)) => grid.cell(align: center + feet.at(calc.quo(i, n)), cell)),
  ),
)"
    );
    if p.flows {
        out.push_str(AROUND);
        let _ = writeln!(
            out,
            "#let gk-around(side, width, fixed, body) = layout(size => wrap-content(
  align: top + side,
  size: size,
  column-gutter: 1.2em,
  box(width: size.width * width, inset: (top: 0.35em, bottom: 0.5em), fixed),
  body,
))"
        );
    }

    // Lines of verse: each a line, numbered in the margin from the line the
    // writer said, every so many lines; speakers in small capitals, stage
    // directions in italics. And texts side by side.
    let _ = writeln!(
        out,
        "#let gk-line-counter = counter(\"gk-verse-line\")
#let gk-verse-numbering = state(\"gk-verse-numbering\", none)
#let gk-verse(start: none, by: 5, body) = {{
  if start != none {{ gk-line-counter.update(start - 1) }}
  gk-verse-numbering.update(if start == none {{ none }} else {{ (start: start, by: by) }})
  block(width: 100%, above: {body_leading} + 0.6em, below: {body_leading} + 0.6em, inset: (left: 2.4em), body)
}}
#let gk-line(kind, indent, body) = {{
  if kind == \"speaker\" {{
    block(above: 0.7em, below: 0.25em, breakable: false, smallcaps(body))
  }} else if kind == \"direction\" {{
    block(above: 0.25em, below: 0.25em, breakable: false, emph(body))
  }} else {{
    gk-line-counter.step()
    context {{
      let numbering = gk-verse-numbering.get()
      let n = gk-line-counter.get().first()
      let shown = numbering != none and (n == numbering.start or calc.rem(n, numbering.by) == 0)
      block(above: 0pt, below: 0pt, breakable: false, inset: (left: indent * 1.5em), {{
        if shown {{ place(left + horizon, dx: -2.4em - indent * 1.5em, text(size: 0.8em, fill: luma(45%), str(n))) }}
        body
      }})
    }}
  }}
}}
#let gk-parallel(left, right) = block(width: 100%, above: {body_leading} + 0.6em, below: {body_leading} + 0.6em,
  grid(columns: (1fr, 1fr), column-gutter: 2em, left, right))"
    );

    // A screenplay: each part of the script where scripts have it. The
    // measures are those of the standard script page, from the margin of the text.
    let _ = writeln!(
        out,
        "#show <gk-script-scene>: it => block(width: 100%, above: 1.6em, below: 0.9em, breakable: false, strong(it.body))
#show <gk-script-action>: it => block(width: 100%, above: 0.9em, below: 0.9em, it.body)
#show <gk-script-character>: it => block(width: 100%, above: 0.9em, below: 0pt, breakable: false, inset: (left: 5.6cm), it.body)
#show <gk-script-dialogue>: it => block(width: 100%, above: 0pt, below: 0pt, inset: (left: 2.5cm, right: 3.8cm), it.body)
#show <gk-script-parenthetical>: it => block(width: 100%, above: 0pt, below: 0pt, breakable: false, inset: (left: 4cm, right: 4cm), [(#it.body)])
#show <gk-script-transition>: it => block(width: 100%, above: 0.9em, below: 0.9em, align(right, it.body))"
    );

    // Equations on a line of their own, with room about them.
    let _ = writeln!(
        out,
        "#show math.equation.where(block: true): set block(above: {body_leading} + 0.8em, below: {body_leading} + 0.8em)"
    );

    // The title block.
    let t = &f.title;
    let block_leading = leading(f.text.line_spacing.min(1.5));
    let _ = writeln!(
        out,
        "#show <gk-title>: it => {{
  set text(size: {size}, weight: {weight}, style: {style}, hyphenate: false)
  set par(leading: {title_leading}, first-line-indent: 0pt, justify: false)
  set align({align})
  block(width: 100%, below: 0.9em, {body})
}}
#show <gk-subtitle>: it => {{
  set text(size: {sub}, style: \"normal\", hyphenate: false)
  set par(leading: {title_leading}, first-line-indent: 0pt, justify: false)
  set align({align})
  block(width: 100%, below: 0.9em, it.body)
}}
#show <gk-authors>: it => {{
  set par(leading: {block_leading}, spacing: {block_leading}, first-line-indent: 0pt, justify: false)
  set align({align})
  block(width: 100%, above: 1.2em, below: 0.6em, it.body)
}}
#show <gk-affiliations>: it => {{
  set text(size: {small})
  set par(leading: {block_leading}, spacing: {block_leading}, first-line-indent: 0pt, justify: false)
  set align({align})
  block(width: 100%, below: 0.6em, it.body)
}}
#show <gk-date>: it => {{
  set par(first-line-indent: 0pt)
  set align({align})
  block(width: 100%, above: 0.8em, it.body)
}}
#show <gk-abstract-title>: it => {{
  set text(weight: \"bold\")
  set par(first-line-indent: 0pt)
  set align({abstract_align})
  block(width: 100%, above: 2em, below: {body_leading} + 0.2em, sticky: true, it.body)
}}
#show <gk-abstract>: it => {{
  set par(first-line-indent: 0pt, justify: {justify})
  block(width: 100%, below: 1em, it.body)
}}
#show <gk-keywords>: it => {{
  set par(first-line-indent: 0pt, justify: false)
  block(width: 100%, above: 1em, below: 1em, it.body)
}}",
        size = pt(t.size),
        sub = pt((t.size * 0.8).max(f.font.size)),
        small = pt(f.font.size),
        weight = if t.bold { "\"bold\"" } else { "\"regular\"" },
        style = if t.italic { "\"italic\"" } else { "\"normal\"" },
        title_leading = leading(1.05),
        align = align(t.align),
        abstract_align = align(t.align),
        body = cased(t.case, "it.body"),
    );
    match t.placement {
        TitlePlacement::OwnPage => {
            let _ = writeln!(
                out,
                "#show <gk-front>: it => {{ v(18%); block(width: 100%, it.body); pagebreak(weak: true) }}"
            );
        }
        TitlePlacement::Top => {
            let _ = writeln!(
                out,
                "#show <gk-front>: it => {{ block(width: 100%, it.body); v({body_leading} + 1em, weak: true) }}"
            );
        }
    }
    out.push('\n');
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn strings_and_measures() {
        assert_eq!(string("a \"b\" \\ c\nd"), "\"a \\\"b\\\" \\\\ c\\nd\"");
        assert_eq!(leading(1.0), "0.2em");
        assert_eq!(leading(2.0), "1.4em");
        assert_eq!(leading(1.5), "0.8em");
        assert_eq!(pt(12.0), "12pt");
        assert_eq!(pt(11.499999), "11.5pt");
        assert_eq!(language(Some("en-GB")), ("en".into(), Some("gb".into())));
        assert_eq!(language(Some("nb")), ("nb".into(), None));
        assert_eq!(language(Some("sr-Latn-RS")), ("sr".into(), Some("rs".into())));
        assert!(fonts("Times New Roman").starts_with("(\"Times New Roman\", \"Liberation Serif\""));
    }

    #[test]
    fn the_preamble_says_what_the_format_says() {
        let mut f = DocumentFormat { name: "Test".into(), ..Default::default() };
        f.page.size = "letter".into();
        f.page_numbers.position = Position::TopRight;
        f.page_numbers.first_page = false;
        f.running_head.content = HeadContent::Title;
        f.running_head.case = Case::Upper;
        f.headings.numbered = true;
        f.line_numbers = true;
        f.title.placement = TitlePlacement::OwnPage;
        let p = Particulars {
            title: "Wrath \"and\" the hero".into(),
            authors: vec!["A. Scholar".into()],
            language: Some("en-GB".into()),
            ..Default::default()
        };
        let out = preamble(&f, &p);
        assert!(out.contains("paper: \"us-letter\""));
        assert!(out.contains("leading: 1.4em"));
        assert!(out.contains("upper(text(\"Wrath \\\"and\\\" the hero\"))"));
        assert!(out.contains("if counter(page).get().first() > 1"));
        assert!(out.contains("#set heading(numbering: \"1.1\")"));
        assert!(out.contains("#set par.line(numbering: \"1\")"));
        assert!(out.contains("pagebreak(weak: true)"));
        assert!(out.contains("region: \"gb\""));
        assert!(out.contains("footer: none"));

        f.title.anonymous = true;
        f.running_head.content = HeadContent::AuthorTitle;
        let out = preamble(&f, &p);
        assert!(!out.contains("A. Scholar"), "an anonymous manuscript does not name its author anywhere");
    }
}
