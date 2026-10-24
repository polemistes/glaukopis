//! A format as the opening of a Typst document.
//!
//! Pandoc writes the text; what is written here says how it is to look. The
//! parts of the title block reach Typst as blocks with labels (`<gk-title>`
//! and so on), which are given their form by the rules made here.

use std::fmt::Write;

use super::kinds::{self, Family, OwnKind, Resolved};
use super::{
    Align, Case, DocumentFormat, HeadingLevel, Item, MATH_FONTS, Margin, NoteKind, NumberStyle, RefMarks, Rules, Sides,
    TitlePlacement, fallbacks,
};

/// What the header, the footer and the properties of the file are made from.
#[derive(Debug, Clone, Default)]
pub struct Particulars {
    pub title: String,
    pub authors: Vec<String>,
    /// The date the document carries, as words.
    pub date: Option<String>,
    pub language: Option<String>,
    /// The notes at the foot of the page are those that were set against the
    /// format, which has its notes at the end: they are lettered, to be told
    /// from the numbered ones.
    pub lettered_footnotes: bool,
    /// Text flows around something in the document.
    pub flows: bool,
    /// The document has tables.
    pub tables: bool,
    /// The kinds of paragraph and of words that are the writer's own, which the document carries.
    pub own_kinds: Vec<OwnKind>,
}

impl Particulars {
    /// The words an item of the header or the footer stands for, where it
    /// stands for words the document has: the title, the authors, the date,
    /// words of one's own; trimmed, without their case. None for the page
    /// number and the chapter, which each target sets itself, and where the
    /// words would be empty. An anonymous manuscript names no author.
    /// Typst, LaTeX, Word and Writer all take their words from here.
    pub fn words(&self, item: &Item, format: &DocumentFormat) -> Option<String> {
        let words = match item {
            Item::Title => self.title.clone(),
            Item::Author if format.title.anonymous => String::new(),
            Item::Author => self.authors.join(", "),
            Item::Date => self.date.clone().unwrap_or_default(),
            Item::Text { text } => text.clone(),
            Item::PageNumber | Item::Chapter => return None,
        };
        let words = words.trim();
        (!words.is_empty()).then(|| words.to_owned())
    }

    /// The words of an item with capitals already in them where the margin
    /// asks for capitals, for a target that sets them as plain text. Small
    /// capitals are left to a target that can set them.
    pub fn words_cased(&self, item: &Item, format: &DocumentFormat, case: Case) -> Option<String> {
        let words = self.words(item, format)?;
        Some(if case == Case::Upper { words.to_uppercase() } else { words })
    }
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

/// Content set as a look of words says: `smallcaps(body)`, `emph(body)`.
fn worded(look: &Resolved, body: &str) -> String {
    let mut out = body.to_owned();
    if look.size > 0.0 {
        out = format!("text(size: {}, {out})", pt(look.size));
    }
    if look.monospace {
        out = format!("text(font: \"DejaVu Sans Mono\", {out})");
    }
    if look.bold {
        out = format!("strong({out})");
    }
    if look.italic {
        out = format!("emph({out})");
    }
    if look.underline {
        out = format!("underline({out})");
    }
    cased(look.case, &out)
}

/// The rule that sets a kind of paragraph as its look says.
fn kind_rule(out: &mut String, id: &str, look: &Resolved, body_leading: &str) {
    let _ = writeln!(
        out,
        "#show <gk-kind-{id}>: it => {{
  set text(size: {size}, weight: {weight}, style: {style}{font})
  set par(first-line-indent: {first}, leading: {leading}, spacing: {leading}, justify: {justify})
  set align({align})
  block(width: 100%, above: {body_leading} + {above}, below: {body_leading} + {below}, inset: (left: {left}, right: {right}), breakable: {breakable}, sticky: {sticky}, {body})
}}",
        size = pt(look.size),
        weight = if look.bold { "\"bold\"" } else { "\"regular\"" },
        style = if look.italic { "\"italic\"" } else { "\"normal\"" },
        font = if look.monospace { ", font: \"DejaVu Sans Mono\"" } else { "" },
        first = look.first_line,
        leading = leading(look.line_spacing.max(0.8)),
        justify = look.align == Align::Justified,
        align = align(look.align),
        above = look.space_before,
        below = look.space_after,
        left = look.indent_left,
        right = look.indent_right,
        breakable = !look.keep_with_next,
        sticky = look.keep_with_next,
        body = cased(look.case, "it.body"),
    );
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
    // A level not numbered under a numbering function is given no number, nor the room after one.
    let number = if format.headings.numbered {
        "if it.numbering != none { let n = counter(heading).display(it.numbering); if n != none { n; h(0.6em) } }; "
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

/// How Typst numbers the headings (ADR 0058): "1.1" where every level is
/// numbered in arabic, as before; a function where the levels differ, which
/// numbers a heading by the numbered levels above it and its own, and gives
/// none where its own level is not numbered; nothing where nothing is.
fn heading_numbering(f: &DocumentFormat) -> String {
    let numbering = f.headings.resolved_numbering();
    if f.headings.plain_numbering() {
        return "#set heading(numbering: \"1.1\")".into();
    }
    if numbering.iter().all(Option::is_none) {
        return String::new();
    }
    let styles: Vec<String> =
        numbering.iter().map(|s| s.map(|s| string(number_pattern(s))).unwrap_or_else(|| "none".into())).collect();
    format!(
        "#set heading(numbering: (..nums) => {{
  let styles = ({},)
  let style(i) = styles.at(calc.min(i, styles.len() - 1))
  let n = nums.pos()
  if style(n.len() - 1) == none {{ return none }}
  n.enumerate().filter(((i, x)) => style(i) != none).map(((i, x)) => numbering(style(i), x)).join(\".\")
}})",
        styles.join(", ")
    )
}

/// The pattern of Typst's `numbering` for a style of numbers.
pub fn number_pattern(style: NumberStyle) -> &'static str {
    match style {
        NumberStyle::Arabic => "1",
        NumberStyle::Roman => "I",
        NumberStyle::RomanLower => "i",
        NumberStyle::Letters => "A",
        NumberStyle::LettersLower => "a",
    }
}

/// An item of a margin as Typst content, or None where it stands for nothing.
fn margin_item(item: &Item, m: &Margin, format: &DocumentFormat, p: &Particulars) -> Option<String> {
    Some(match item {
        Item::PageNumber => format!("counter(page).display({})", string(number_pattern(format.page.numbering))),
        // The heading of the first level the page is in: one that begins on
        // the page, else the last before it.
        Item::Chapter => format!(
            "{{ let here = here(); let on = query(heading.where(level: 1).after(here)).filter(h => h.location().page() == here.page()); \
             let before = query(heading.where(level: 1).before(here)); \
             if on.len() > 0 {{ {} }} else if before.len() > 0 {{ {} }} }}",
            cased(m.case, "on.first().body"),
            cased(m.case, "before.last().body"),
        ),
        _ => cased(m.case, &format!("text({})", string(&p.words(item, format)?))),
    })
}

/// The three places of a margin as a row of Typst: None where all are empty.
fn margin_grid(sides: &Sides, m: &Margin, format: &DocumentFormat, p: &Particulars) -> Option<String> {
    let place = |items: &[Item]| -> Vec<String> { items.iter().filter_map(|i| margin_item(i, m, format, p)).collect() };
    let places = [place(&sides.left), place(&sides.center), place(&sides.right)];
    if places.iter().all(Vec::is_empty) {
        return None;
    }
    let cell = |items: &Vec<String>, a: &str| match items.len() {
        0 => "[]".to_owned(),
        1 => format!("align({a}, {})", items[0]),
        // Items that stand for nothing (a chapter before the first) leave no separator behind.
        _ => format!(
            "align({a}, {{ let items = ({},).filter(i => i != none); items.join(text({})) }})",
            items.join(", "),
            string(&m.separator)
        ),
    };
    // With nothing in the middle, the sides may take all the width they need.
    Some(if places[1].is_empty() {
        format!(
            "grid(columns: (1fr, auto), column-gutter: 2em, {}, {})",
            cell(&places[0], "left"),
            cell(&places[2], "right")
        )
    } else {
        format!(
            "grid(columns: (1fr, auto, 1fr), column-gutter: 1em, {}, {}, {})",
            cell(&places[0], "left"),
            cell(&places[1], "center"),
            cell(&places[2], "right")
        )
    })
}

/// The header or the footer as Typst (ADR 0057): None where it is not shown
/// or nothing stands in it. Nothing stands in it on the first page where it
/// is not to, on the openers where it is not to, and on the blank pages put
/// in before a right-hand page; left pages take their own places where it
/// alternates.
fn margin(m: &Margin, format: &DocumentFormat, p: &Particulars) -> Option<String> {
    if !m.is_visible() {
        return None;
    }
    let odd = margin_grid(&m.places, m, format, p);
    let even = if m.alternate { margin_grid(m.even_places(), m, format, p) } else { odd.clone() };
    if odd.is_none() && even.is_none() {
        return None;
    }
    let body = if odd == even {
        odd.unwrap_or_else(|| "none".into())
    } else {
        format!(
            "if calc.even(at) {{ {} }} else {{ {} }}",
            even.as_deref().unwrap_or("none"),
            odd.as_deref().unwrap_or("none")
        )
    };
    let mut skip = vec!["gk-blank(at)".to_owned()];
    if !m.first_page {
        skip.push("at == 1".into());
    }
    if !m.openers {
        skip.push("gk-on(<gk-opener>, at)".into());
    }
    let size = if m.size > 0.0 { m.size } else { format.font.size };
    Some(format!(
        "context {{
    let at = here().page()
    if {skip} {{ none }} else {{
      set text(size: {size}{italic})
      set par(first-line-indent: 0pt, leading: {leading}, justify: false)
      {body}
    }}
  }}",
        skip = skip.join(" or "),
        size = pt(size),
        italic = if m.italic { ", style: \"italic\"" } else { "" },
        leading = leading(1.0),
    ))
}

/// What marks the pages where something begins (ADR 0057): the opener after
/// the break of a page, and the mark before a break to a right-hand page,
/// from which a blank left page is known. The header and the footer ask
/// these of every page.
pub const OPENER: &str = "#metadata(\"opener\") <gk-opener>";
/// Before the break to a right-hand page.
pub const BEFORE_RIGHT: &str = "#metadata(\"right\") <gk-before-right>";

/// How a reference mark is set (ADR 0039): raised in the line, or in the
/// margin at the right of its line, found from where the mark stands on the
/// page, and taking no room in the line; the empty box before it makes
/// Typst lay out a line break just before the mark first, as `gk-beside`.
fn refmark_rule(f: &DocumentFormat) -> String {
    match f.text.refmarks {
        RefMarks::Raised => "#let gk-refmark(label) = super(typographic: false, label)".to_owned(),
        RefMarks::Margin => format!(
            "#let gk-refmark(label) = {{ box[]; context {{
  let x = here().position().x
  box(width: 0pt, place(left + bottom, dx: page.width - {right} - x + 0.8em,
    text(size: 0.75em, fill: luma(30%), bottom-edge: \"baseline\", hyphenate: false, label)))
}} }}",
            right = f.page.margin_right,
        ),
    }
}

/// The opening of the document: everything up to where Pandoc's text begins.
pub fn preamble(format: &DocumentFormat, p: &Particulars) -> String {
    let mut out = opening(format, p);
    out.push_str(&page(format, p));
    out.push_str(&rules(format, p));
    out
}

/// What the document says once, whatever its elements set: what it is,
/// and what the header and the footer ask of the pages.
pub fn opening(format: &DocumentFormat, p: &Particulars) -> String {
    let mut out = String::new();
    let f = format;
    let _ = writeln!(out, "// Made by Glaukopis from the format “{}”.", f.name.replace('\n', " "));
    let authors: Vec<String> =
        if f.title.anonymous { Vec::new() } else { p.authors.iter().map(|a| string(a)).collect() };
    let _ = writeln!(
        out,
        "#set document(title: {}, author: ({}))",
        string(&p.title),
        authors.iter().map(|a| format!("{a},")).collect::<String>()
    );
    // Where something begins, and the blank pages before a right-hand page:
    // the header and the footer ask of each page.
    let _ = writeln!(
        out,
        "#let gk-on(label, p) = query(label).any(o => o.location().page() == p)
#let gk-blank(p) = gk-on(<gk-before-right>, p - 1) and gk-on(<gk-opener>, p + 1) and not gk-on(<gk-opener>, p)"
    );
    out
}

/// The page: its size, its margins, its header and footer, its columns. A
/// `#set page` begins a new page where it stands in the text.
pub fn page(format: &DocumentFormat, p: &Particulars) -> String {
    let mut out = String::new();
    let f = format;
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
    let header = margin(&f.header, f, p);
    let footer = margin(&f.footer, f, p);
    let _ = writeln!(
        out,
        "#set page(
  {paper},
  margin: (top: {top}, bottom: {bottom}, left: {left}, right: {right}),
  numbering: none,
  header: {header},
  footer: {footer},{columns}
)",
        columns = if f.page.columns > 1 { format!("\n  columns: {},", f.page.columns) } else { String::new() },
        top = f.page.margin_top,
        bottom = f.page.margin_bottom,
        left = f.page.margin_left,
        right = f.page.margin_right,
        header = header.as_deref().unwrap_or("none"),
        footer = footer.as_deref().unwrap_or("none"),
    );
    // The room between the columns, where the text is set in more than one.
    if f.page.columns > 1 {
        let _ = writeln!(out, "#set columns(gutter: {})", f.page.column_gap);
    }
    out
}

/// Whether two layouts set the pages otherwise: their size, margins and
/// columns, their header and footer. Where they do, the stretch of one
/// begins on a new page (ADR 0059).
pub fn pages_differ(a: &DocumentFormat, b: &DocumentFormat) -> bool {
    let of = |f: &DocumentFormat| {
        let mut page = serde_json::to_value(&f.page).unwrap_or_default();
        // Whether the count begins anew is said where a stretch begins, not of the page.
        if let Some(o) = page.as_object_mut() {
            o.remove("restart");
        }
        (page, serde_json::to_value(&f.header).ok(), serde_json::to_value(&f.footer).ok())
    };
    of(a) != of(b)
}

/// Where the stretch of an element with a look of its own begins or ends
/// (ADR 0059): the rules of the layout it comes to, and where the pages
/// differ, or the count begins anew, a new page set as that layout has it.
/// `entering` says it is the stretch's beginning, where the count of the
/// pages may begin anew; at its end the enclosing look's count goes on.
pub fn switch(from: &DocumentFormat, to: &DocumentFormat, p: &Particulars, entering: bool) -> String {
    let mut out = String::new();
    let restart = entering && to.page.restart;
    if pages_differ(from, to) || restart {
        out.push_str("#pagebreak(weak: true)\n");
        if pages_differ(from, to) {
            out.push_str(&page(to, p));
        }
        if restart {
            out.push_str("#counter(page).update(1)\n");
        }
    }
    out.push_str(&rules(to, p));
    out
}

/// How the text is set: the type, the paragraphs, the headings, the kinds,
/// the notes, the figures, the parts and the title; all the rest of the
/// opening, which the stretch of an element with a look of its own sets
/// again (ADR 0059).
pub fn rules(format: &DocumentFormat, p: &Particulars) -> String {
    let mut out = String::new();
    let f = format;
    let (lang, region) = language(p.language.as_deref());
    let body_leading = leading(f.text.line_spacing);
    let justify = f.text.align == Align::Justified;

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
    // The indent of the first line and the space between paragraphs, both as said, either nought.
    let indent = format!("(amount: {}, all: {})", f.text.indent, f.text.indent_first);
    let spacing = format!("{body_leading} + {}", f.text.space_between);
    let _ = writeln!(
        out,
        "#set par(leading: {body_leading}, spacing: {spacing}, first-line-indent: {indent}, justify: {justify})"
    );
    if f.line_numbers {
        let _ = writeln!(out, "#set par.line(numbering: \"1\")");
    }
    let _ = writeln!(out, "#set list(indent: 1em)\n#set enum(indent: 1em)\n#set terms(hanging-indent: 1.5em)");

    // Headings.
    let _ = writeln!(out, "{}", heading_numbering(f));
    for level in 1..=6 {
        heading_rule(&mut out, level, &f.heading(level), f);
    }

    // Quotations set off from the text: as the part of quotations has them,
    // with what the format says of the kind Quotation over it.
    let quote = kinds::resolve(f, "quote", &[]);
    let said = f.kinds.get("quote");
    let spacing = said.and_then(|l| l.line_spacing).unwrap_or(f.quote.line_spacing);
    let quote_leading = if spacing > 0.0 { leading(spacing) } else { body_leading.clone() };
    let size = said.and_then(|l| l.size).unwrap_or(f.quote.size);
    let _ = writeln!(
        out,
        "#show quote.where(block: true): it => {{
  set text({size}style: {style}{weight})
  set par(leading: {quote_leading}, spacing: {quote_leading}, first-line-indent: 0pt)
  block(width: 100%, inset: (left: {left}, right: {right}), above: {gap}, below: {gap}, it.body)
}}",
        size = if size > 0.0 { format!("size: {}, ", pt(size)) } else { String::new() },
        style = if quote.italic { "\"italic\"" } else { "\"normal\"" },
        weight = if quote.bold { ", weight: \"bold\"" } else { "" },
        left = quote.indent_left,
        right = quote.indent_right,
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

    // What stands beside a paragraph (ADR 0040): its number, small and
    // faint, and words given in the margin, in italics besides. `gk-beside`
    // places them from where a paragraph begins, in the margin of the page
    // on the side asked for, taking no room in the line. The empty box
    // before the placement makes Typst lay out a line break that comes
    // just before it first: asked before that, the position is the end of
    // the line above, and a number on a later line of a paragraph falls
    // off the page. The lines of a verse place theirs from the edge of the
    // verse (`gk-at`), so that the numbers of texts side by side stand
    // beside their own columns.
    let _ = writeln!(
        out,
        "#let gk-number(n) = text(size: 0.8em, fill: luma(45%), hyphenate: false, n)
#let gk-margin(words) = text(size: 0.8em, fill: luma(45%), style: \"italic\", hyphenate: false, words)
#let gk-at(side, inset, body) = if side == \"left\" {{
  place(left + horizon, dx: -inset - 4.6em, box(width: 4em, align(right, body)))
}} else {{
  place(left + horizon, dx: 100% + 0.8em, box(width: {right} - 1.6em, body))
}}
#let gk-beside(side, body) = {{ box[]; context {{
  let x = here().position().x
  if side == \"left\" {{
    box(width: 0pt, place(left + horizon, dx: {left} - x - 4.6em, box(width: 4em, align(right, body))))
  }} else {{
    box(width: 0pt, place(left + horizon, dx: page.width - {right} - x + 0.8em, box(width: {right} - 1.6em, body)))
  }}
}} }}",
        left = f.page.margin_left,
        right = f.page.margin_right,
    );

    // Lines of verse: each a line, standing in as far as the look of a line
    // says, with the number it shows beside it, as the converter has counted
    // them (`document/numbers.rs`), and words given in the margin on the
    // other side; speakers and stage directions as their kinds look. And
    // texts side by side.
    let line = kinds::resolve(f, "line", &p.own_kinds);
    let mut speaker_look = kinds::resolve(f, "speaker", &p.own_kinds);
    let mut direction_look = kinds::resolve(f, "direction", &p.own_kinds);
    // Within a verse the speaker and the direction are set as words of the
    // line: a size that is the text's is not said.
    for look in [&mut speaker_look, &mut direction_look] {
        if (look.size - f.font.size).abs() < 0.01 {
            look.size = 0.0;
        }
    }
    let speaker = worded(&speaker_look, "body");
    let direction = worded(&direction_look, "body");
    let _ = writeln!(
        out,
        "#let gk-verse(body) = block(width: 100%, above: {body_leading} + 0.6em, below: {body_leading} + 0.6em, inset: (left: {inset}), body)
#let gk-line(kind, indent, n: none, margin: none, side: \"left\", body) = {{
  let other = if side == \"left\" {{ \"right\" }} else {{ \"left\" }}
  if kind == \"speaker\" {{
    block(width: 100%, above: {speaker_above}, below: {speaker_below}, breakable: false, {{
      if n != none {{ gk-at(side, {inset}, gk-number(n)) }}
      if margin != none {{ gk-at(other, {inset}, gk-margin(margin)) }}
      {speaker}
    }})
  }} else if kind == \"direction\" {{
    block(width: 100%, above: {direction_above}, below: {direction_below}, breakable: false, {{
      if n != none {{ gk-at(side, {inset}, gk-number(n)) }}
      if margin != none {{ gk-at(other, {inset}, gk-margin(margin)) }}
      {direction}
    }})
  }} else {{
    block(width: 100%, above: 0pt, below: 0pt, breakable: false, inset: (left: indent * 1.5em), {{
      if n != none {{ gk-at(side, {inset} + indent * 1.5em, gk-number(n)) }}
      if margin != none {{ gk-at(other, {inset} + indent * 1.5em, gk-margin(margin)) }}
      body
    }})
  }}
}}
{refmark}",
        inset = line.indent_left,
        speaker_above = speaker_look.space_before,
        speaker_below = speaker_look.space_after,
        direction_above = direction_look.space_before,
        direction_below = direction_look.space_after,
        refmark = refmark_rule(f),
    );
    let _ = writeln!(
        out,
        "#let gk-parallel(left, right) = block(width: 100%, above: {body_leading} + 0.6em, below: {body_leading} + 0.6em,
  grid(columns: (1fr, 1fr), column-gutter: 2em, left, right))"
    );

    // The kinds of paragraph, each as its look says: those that come with
    // the application, among them the parts of a script, and the writer's
    // own. Code is a raw block, which Pandoc writes. See `kinds.rs`.
    for (id, info) in kinds::styled(f, &p.own_kinds) {
        if info.family != Family::Paragraph || id == "code" {
            continue;
        }
        kind_rule(&mut out, &crate::document::pandoc::label(&id), &info.look, &body_leading);
    }
    let code = kinds::resolve(f, "code", &p.own_kinds);
    let _ = writeln!(
        out,
        "#show raw.where(block: true): it => {{
  set text(size: {size})
  set par(first-line-indent: 0pt, leading: {leading}, justify: false)
  block(width: 100%, above: {body_leading} + {above}, below: {body_leading} + {below}, inset: (left: {left}, right: {right}), it)
}}",
        size = pt(if code.size > 0.0 { code.size } else { f.font.size }),
        leading = leading(code.line_spacing.max(0.8)),
        above = code.space_before,
        below = code.space_after,
        left = code.indent_left,
        right = code.indent_right,
    );

    // Equations on a line of their own, with room about them.
    let _ = writeln!(
        out,
        "#show math.equation.where(block: true): set block(above: {body_leading} + 0.8em, below: {body_leading} + 0.8em)"
    );
    // Mathematics in a font made for it: the first that is installed.
    let math: Vec<String> = MATH_FONTS.iter().map(|f| string(f)).collect();
    let _ = writeln!(out, "#show math.equation: set text(font: ({},))", math.join(", "));

    // The parts of a document (ADR 0038), each a show rule on its label
    // (`<gk-part-ID>`), as its look under the format says. A page of its own
    // begins a quarter of the way down; the breaks of the page stand around
    // the block, written by the converter.
    for (id, info) in crate::templates::kinds::styled(f) {
        let look = &info.look;
        let _ = writeln!(
            out,
            "#show <gk-part-{id}>: it => {{
  set text(size: {size}, style: {style})
  set par(first-line-indent: 0pt, justify: {justify})
  set align({align})
  {down}block(width: 100%, it.body)
}}",
            id = crate::document::pandoc::label(&id),
            size = pt(if look.size > 0.0 { look.size } else { f.font.size }),
            style = if look.italic { "\"italic\"" } else { "\"normal\"" },
            justify = look.align == Align::Justified,
            align = align(look.align),
            down = if look.own_page { "[#metadata(\"opener\") <gk-opener>]\n  v(25%)\n  " } else { "" },
        );
    }
    // The half-title: the title alone on the first leaf.
    let _ = writeln!(
        out,
        "#show <gk-half-title>: it => {{
  set text(size: {size}, weight: \"regular\", style: \"normal\", hyphenate: false)
  set par(first-line-indent: 0pt, justify: false)
  set align(center)
  [#metadata(\"opener\") <gk-opener>]
  v(30%)
  block(width: 100%, it.body)
  pagebreak(weak: true)
}}",
        size = pt(f.title.size),
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
                "#show <gk-front>: it => {{ [#metadata(\"opener\") <gk-opener>]; v(18%); block(width: 100%, it.body); pagebreak(weak: true) }}"
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
    fn a_quotation_is_set_as_the_format_says_of_the_kind_over_its_part_of_quotations() {
        let mut f = DocumentFormat { name: "Test".into(), ..Default::default() };
        f.quote.italic = false;
        let plain = preamble(&f, &Particulars::default());
        assert!(plain.contains("set text(style: \"normal\")"), "{plain}");
        f.kinds.insert(
            "quote".into(),
            kinds::Look { italic: Some(true), bold: Some(true), size: Some(10.0), ..Default::default() },
        );
        let said = preamble(&f, &Particulars::default());
        assert!(said.contains("set text(size: 10pt, style: \"italic\", weight: \"bold\")"), "{said}");
    }

    #[test]
    fn the_preamble_says_what_the_format_says() {
        let mut f = DocumentFormat { name: "Test".into(), ..Default::default() };
        f.page.size = "letter".into();
        f.footer.shown = false;
        f.header = Margin {
            shown: true,
            first_page: false,
            case: Case::Upper,
            places: Sides { left: vec![Item::Title], right: vec![Item::PageNumber], ..Default::default() },
            ..Default::default()
        };
        f.headings.numbered = true;
        f.line_numbers = true;
        f.title.placement = TitlePlacement::OwnPage;
        f.kinds.insert("epigraph".into(), super::kinds::Look { italic: Some(true), ..Default::default() });
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
        assert!(out.contains("if gk-blank(at) or at == 1 { none }"), "{out}");
        assert!(out.contains("#set heading(numbering: \"1.1\")"));
        assert!(out.contains("#set par.line(numbering: \"1\")"));
        assert!(out.contains("pagebreak(weak: true)"));
        assert!(out.contains("region: \"gb\""));
        assert!(out.contains("footer: none"));
        assert!(
            out.contains("#show math.equation: set text(font: (\"New Computer Modern Math\", \"Libertinus Math\", "),
            "mathematics has fonts of its own to turn to: {out}"
        );
        assert!(
            out.contains("#show <gk-kind-scene>: it => {\n  set text(size: 12pt, weight: \"bold\", style: \"normal\")"),
            "{out}"
        );
        assert!(
            out.contains(
                "#show <gk-kind-epigraph>: it => {\n  set text(size: 12pt, weight: \"regular\", style: \"italic\")"
            ),
            "{out}"
        );
        assert!(out.contains("inset: (left: 4cm, right: 0pt)"), "{out}");
        assert!(
            out.contains("if margin != none { gk-at(other, 1cm, gk-margin(margin)) }\n      smallcaps(body)\n"),
            "{out}"
        );
        assert!(out.contains("inset: (left: 1cm), body)"), "the verse stands in as far as a line looks: {out}");
        assert!(out.contains("#show <gk-kind-line>"), "{out}");
        assert!(!out.contains("<gk-kind-draft>"), "a note to oneself has no look");

        f.title.anonymous = true;
        f.header.places.left = vec![Item::Author, Item::Title];
        let out = preamble(&f, &p);
        assert!(!out.contains("A. Scholar"), "an anonymous manuscript does not name its author anywhere");
    }

    #[test]
    fn what_stands_in_the_margin_is_placed_after_the_line_break_before_it() {
        let mut f = DocumentFormat { name: "Test".into(), ..Default::default() };
        let out = preamble(&f, &Particulars::default());
        assert!(out.contains("#let gk-beside(side, body) = { box[]; context {"), "{out}");
        f.text.refmarks = RefMarks::Margin;
        let out = preamble(&f, &Particulars::default());
        assert!(out.contains("#let gk-refmark(label) = { box[]; context {"), "{out}");
    }

    #[test]
    fn the_words_of_the_items_are_worked_out_once() {
        let f = DocumentFormat::default();
        let p = Particulars {
            title: "Wrath".into(),
            authors: vec!["A. Scholar".into(), "B. Other".into()],
            date: Some("1 May".into()),
            ..Default::default()
        };
        assert_eq!(p.words(&Item::Title, &f).as_deref(), Some("Wrath"));
        assert_eq!(p.words(&Item::Author, &f).as_deref(), Some("A. Scholar, B. Other"));
        assert_eq!(p.words(&Item::Date, &f).as_deref(), Some("1 May"));
        assert_eq!(p.words(&Item::PageNumber, &f), None, "each target sets the number itself");
        assert_eq!(p.words_cased(&Item::Title, &f, Case::Upper).as_deref(), Some("WRATH"));
        assert_eq!(p.words_cased(&Item::Title, &f, Case::Smallcaps).as_deref(), Some("Wrath"));
        assert_eq!(p.words(&Item::Text { text: "  R&D ".into() }, &f).as_deref(), Some("R&D"));
        assert_eq!(p.words(&Item::Text { text: "   ".into() }, &f), None);
        // An anonymous manuscript names no author.
        let anonymous =
            DocumentFormat { title: super::super::TitleBlock { anonymous: true, ..Default::default() }, ..f };
        assert_eq!(p.words(&Item::Author, &anonymous), None);
    }

    #[test]
    fn the_header_and_the_footer_are_set_from_their_places() {
        let p = Particulars { title: "Wrath".into(), authors: vec!["A. Scholar".into()], ..Default::default() };
        // As layouts have them where they say nothing: the number in the middle of the footer, nothing at the head.
        let f = DocumentFormat::default();
        let out = preamble(&f, &p);
        assert!(out.contains("header: none,"), "{out}");
        assert!(out.contains("grid(columns: (1fr, auto, 1fr), column-gutter: 1em, [], align(center, counter(page).display(\"1\")), [])"), "{out}");
        assert!(out.contains("if gk-blank(at) { none }"), "the blank page before a right-hand one is bare: {out}");

        // The title and the author at the left, the number at the right; on
        // left pages the number at the left; nothing on the openers.
        let mut f = DocumentFormat::default();
        f.footer.shown = false;
        f.header = Margin {
            shown: true,
            openers: false,
            alternate: true,
            size: 9.0,
            italic: true,
            places: Sides {
                left: vec![Item::Author, Item::Title],
                right: vec![Item::PageNumber],
                ..Default::default()
            },
            even: Some(Sides { left: vec![Item::PageNumber], right: vec![Item::Chapter], ..Default::default() }),
            ..Default::default()
        };
        f.page.numbering = crate::formats::NumberStyle::RomanLower;
        let out = preamble(&f, &p);
        assert!(out.contains("footer: none,"), "{out}");
        assert!(out.contains("if gk-blank(at) or gk-on(<gk-opener>, at) { none }"), "{out}");
        assert!(out.contains("set text(size: 9pt, style: \"italic\")"), "{out}");
        assert!(
            out.contains(
                "let items = (text(\"A. Scholar\"), text(\"Wrath\"),).filter(i => i != none); items.join(text(\" · \"))"
            ),
            "the items of a place joined by the separator: {out}"
        );
        assert!(out.contains("if calc.even(at) { grid(columns: (1fr, auto), column-gutter: 2em, align(left, counter(page).display(\"i\")), align(right, { let here = here();"), "{out}");
        assert!(out.contains("} else { grid(columns: (1fr, auto), column-gutter: 2em, align(left, "), "{out}");
        assert!(out.contains("#let gk-blank(p)"), "{out}");

        // An anonymous layout names no author, in the head or anywhere.
        f.title.anonymous = true;
        let out = preamble(&f, &p);
        assert!(!out.contains("A. Scholar"), "{out}");
        // A header shown with nothing in it is none.
        f.header.places = Sides::default();
        f.header.even = None;
        assert!(preamble(&f, &p).contains("header: none,"));
    }
}
