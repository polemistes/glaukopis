//! A format as settings for LaTeX: variables for Pandoc's template, and what
//! goes into the preamble.

use std::fmt::Write;

use crate::formats::kinds::Resolved;
use crate::formats::typst::Particulars;
use crate::formats::{Align, Case, DocumentFormat, Item, Margin, NoteKind, NumberStyle, Sides};

/// Text as LaTeX, with the characters that mean something to it made harmless.
pub fn escape(text: &str) -> String {
    let mut out = String::with_capacity(text.len() + 8);
    for c in text.chars() {
        match c {
            '\\' => out.push_str("\\textbackslash{}"),
            '&' | '%' | '$' | '#' | '_' | '{' | '}' => {
                out.push('\\');
                out.push(c);
            }
            '~' => out.push_str("\\textasciitilde{}"),
            '^' => out.push_str("\\textasciicircum{}"),
            c => out.push(c),
        }
    }
    out
}

/// What LaTeX said when it failed, brought down to what went wrong: the
/// lines that begin with an exclamation mark, and the line that says where.
pub fn what_went_wrong(messages: &str) -> String {
    let lines: Vec<&str> = messages.lines().collect();
    let mut out: Vec<String> = Vec::new();
    for (i, line) in lines.iter().enumerate() {
        if let Some(said) = line.strip_prefix('!') {
            let mut text = said.trim().to_owned();
            // "l.42 …" follows within a few lines, and says where in the source.
            if let Some(at) = lines.iter().skip(i + 1).take(6).find(|l| l.starts_with("l.")) {
                text.push_str(&format!(" ({})", at.trim()));
            }
            if !out.contains(&text) {
                out.push(text);
            }
        }
    }
    if out.is_empty() {
        return messages.lines().take(12).collect::<Vec<_>>().join("\n");
    }
    out.truncate(6);
    out.join("\n")
}

/// Fonts that have many letters, asked for those the font of the document
/// lacks. Only LuaLaTeX can be told of them.
pub const FALLBACK_FONTS: [&str; 8] = [
    "Noto Serif",
    "Libertinus Serif",
    "Gentium Plus",
    "GFS Didot",
    "DejaVu Serif",
    "FreeSerif",
    "Noto Sans",
    "DejaVu Sans",
];

pub struct Settings {
    /// Pairs for `-V name=value`.
    pub variables: Vec<(String, String)>,
    /// For the preamble.
    pub header: String,
    pub number_sections: bool,
}

/// A size of the type as LaTeX is told it: the leading 1.2 times the size, to a tenth of a point.
fn fontsize(size: f32) -> String {
    format!("\\fontsize{{{size}}}{{{}}}\\selectfont", leading(size))
}

/// The leading of a size of the type: 1.2 times it, to a tenth of a point.
fn leading(size: f32) -> f32 {
    (size * 1.2 * 10.0).round() / 10.0
}

fn font_command(size: f32, bold: bool, italic: bool, case: Case, align: Align) -> String {
    let mut s = format!("\\normalfont{}", fontsize(size));
    s.push_str(if bold { "\\bfseries" } else { "\\mdseries" });
    s.push_str(if italic { "\\itshape" } else { "\\upshape" });
    match case {
        Case::Smallcaps => s.push_str("\\scshape"),
        Case::Upper | Case::None => {}
    }
    match align {
        Align::Center => s.push_str("\\centering"),
        Align::Right => s.push_str("\\raggedleft"),
        Align::Left | Align::Justified => s.push_str("\\raggedright"),
    }
    s
}

/// The settings of a layout for LaTeX. `looks` are the layouts the elements
/// under the one printed use where they have their own (ADR 0059): the
/// preamble defines what their stretches are switched to (`switch`).
pub fn settings(f: &DocumentFormat, looks: &[&DocumentFormat], p: &Particulars) -> Settings {
    let mut v: Vec<(String, String)> = Vec::new();
    let mut h = String::new();

    v.push(("documentclass".into(), "article".into()));
    let twoside = alternates(f) || looks.iter().any(|l| alternates(l));
    if twoside {
        v.push(("classoption".into(), "twoside".into()));
    }
    match f.page.size.to_ascii_lowercase().as_str() {
        "a4" | "a5" | "b5" | "letter" | "legal" => v.push(("papersize".into(), f.page.size.to_ascii_lowercase())),
        _ => {
            let (w, ht) = paper(f);
            v.push(("geometry".into(), format!("paperwidth={w}bp")));
            v.push(("geometry".into(), format!("paperheight={ht}bp")));
        }
    }
    v.extend(page_margins(f).into_iter().map(|m| ("geometry".to_owned(), m)));

    // The classes know three sizes; any other is set by hand.
    let class_size = [10.0_f32, 11.0, 12.0]
        .into_iter()
        .min_by(|a, b| (a - f.font.size).abs().total_cmp(&(b - f.font.size).abs()))
        .unwrap_or(12.0);
    v.push(("fontsize".into(), format!("{class_size}pt")));
    if (class_size - f.font.size).abs() > 0.01 {
        let _ = writeln!(h, "\\AtBeginDocument{{{}}}", fontsize(f.font.size));
    }
    v.push(("mainfont".into(), f.font.family.clone()));
    v.push(("linestretch".into(), format!("{}", f.text.line_spacing)));

    let indented = !f.text.indent.is_zero();
    if indented {
        v.push(("indent".into(), "true".into()));
    }
    let _ = writeln!(h, "{}", paragraph_lengths(f));
    if indented && f.text.indent_first {
        let _ = writeln!(h, "\\usepackage{{indentfirst}}");
    }
    if f.text.align != Align::Justified {
        let _ = writeln!(h, "\\usepackage[document]{{ragged2e}}");
    } else if looks.iter().any(|l| l.text.align != Align::Justified) {
        // For the stretches that are set ragged.
        let _ = writeln!(h, "\\usepackage{{ragged2e}}");
    }
    if f.text.align != Align::Justified && indented {
        let _ = writeln!(h, "\\setlength{{\\RaggedRightParindent}}{{{}}}", f.text.indent);
    }
    if !f.text.hyphenate {
        let _ = writeln!(h, "{}", hyphenation(f));
    }

    // The title.
    let around = match f.title.align {
        Align::Center => "center",
        Align::Right => "flushright",
        Align::Left | Align::Justified => "flushleft",
    };
    let column = match f.title.align {
        Align::Center => "c",
        Align::Right => "r",
        Align::Left | Align::Justified => "l",
    };
    let title_font = font_command(f.title.size, f.title.bold, f.title.italic, f.title.case, Align::Left)
        .replace("\\raggedright", "");
    let _ = writeln!(h, "\\usepackage{{titling}}\n\\setlength{{\\droptitle}}{{-3em}}");
    let _ = writeln!(
        h,
        "\\pretitle{{\\begin{{{around}}}{title_font}}}\n\\posttitle{{\\par\\end{{{around}}}\\vskip 0.4em}}"
    );
    let _ = writeln!(
        h,
        "\\preauthor{{\\begin{{{around}}}\\normalsize\\lineskip 0.4em\\begin{{tabular}}[t]{{@{{}}{column}@{{}}}}}}\n\\postauthor{{\\end{{tabular}}\\par\\end{{{around}}}}}"
    );
    if f.title.show_date {
        let _ = writeln!(h, "\\predate{{\\begin{{{around}}}\\normalsize}}\n\\postdate{{\\par\\end{{{around}}}}}");
    } else {
        // Without a date there is no room left for one.
        let _ = writeln!(h, "\\predate{{}}\n\\postdate{{}}\n\\date{{}}");
    }

    // The bibliography, as the reference style sets it.
    let _ = writeln!(
        h,
        "\\AtBeginDocument{{\\ifdefined\\cslhangindent\\setlength{{\\cslhangindent}}{{{}}}\\fi}}",
        f.bibliography.hanging_indent
    );

    // Headings.
    let _ = writeln!(h, "\\usepackage{{titlesec}}");
    for (i, command) in ["section", "subsection", "subsubsection", "paragraph", "subparagraph"].iter().enumerate() {
        let level = f.heading(i + 1);
        let numbered = f.headings.plain_numbering();
        let label = if numbered { format!("\\the{command}") } else { String::new() };
        let sep = if numbered { "0.6em" } else { "0pt" };
        let upper = if level.case == Case::Upper { "\\MakeUppercase" } else { "" };
        let _ = writeln!(
            h,
            "\\titleformat{{\\{command}}}[block]{{{}}}{{{label}}}{{{sep}}}{{{upper}}}",
            font_command(level.size, level.bold, level.italic, level.case, level.align),
        );
        let _ = writeln!(
            h,
            "\\titlespacing*{{\\{command}}}{{{}}}{{{}}}{{{}}}",
            if level.indent { f.text.indent.to_string() } else { "0pt".into() },
            level.space_before,
            level.space_after
        );
    }

    // Quotations.
    let _ = writeln!(h, "\\usepackage{{etoolbox}}\n\\usepackage{{setspace}}");
    let mut quote = String::new();
    if f.quote.line_spacing > 0.0 {
        let _ = write!(quote, "\\setstretch{{{}}}", f.quote.line_spacing);
    }
    if f.quote.size > 0.0 {
        quote.push_str(&fontsize(f.quote.size));
    }
    if f.quote.italic {
        quote.push_str("\\itshape");
    }
    let _ = writeln!(
        h,
        "\\renewenvironment{{quote}}{{\\list{{}}{{\\leftmargin={}\\rightmargin={}}}\\item\\relax{quote}}}{{\\endlist}}",
        f.quote.indent_left, f.quote.indent_right
    );

    // Notes.
    if p.lettered_footnotes {
        let _ = writeln!(h, "\\renewcommand{{\\thefootnote}}{{\\alph{{footnote}}}}");
    }
    if f.notes.kind == NoteKind::Footnotes || p.lettered_footnotes {
        let _ = writeln!(
            h,
            "\\renewcommand{{\\footnotesize}}{{\\fontsize{{{}}}{{{}}}\\selectfont}}",
            f.notes.size,
            (f.notes.size * 1.2 * f.notes.line_spacing * 10.0).round() / 10.0
        );
    }

    // The margins of the page.
    let _ = writeln!(
        h,
        "\\usepackage{{fancyhdr}}\n\\pagestyle{{fancy}}\n\\fancyhf{{}}\n\\renewcommand{{\\headrulewidth}}{{0pt}}"
    );
    let _ = writeln!(h, "\\renewcommand{{\\sectionmark}}[1]{{\\markboth{{#1}}{{}}}}");
    if f.page.numbering != NumberStyle::Arabic {
        let _ = writeln!(h, "\\renewcommand{{\\thepage}}{{\\{}{{page}}}}", numbering(f.page.numbering));
    }
    let fancy = margin_commands(f, p, twoside, |_| true);
    let _ = writeln!(h, "{fancy}");
    // The first page of the document, which the title sets in the style
    // `plain`; the openers, in a style of their own (ADR 0057).
    let _ = writeln!(
        h,
        "\\fancypagestyle{{plain}}{{\\fancyhf{{}}{}}}\n\\fancypagestyle{{opener}}{{\\fancyhf{{}}{}}}",
        margin_commands(f, p, twoside, |m| m.first_page),
        margin_commands(f, p, twoside, |m| m.openers),
    );
    if [&f.header, &f.footer].iter().any(|m| m.is_visible() && !m.first_page) {
        let _ = writeln!(h, "\\AtBeginDocument{{\\thispagestyle{{plain}}}}");
    }
    if f.line_numbers {
        let _ = writeln!(h, "\\usepackage{{lineno}}\n\\linenumbers");
    } else if looks.iter().any(|l| l.line_numbers) {
        let _ = writeln!(h, "\\usepackage{{lineno}}");
    }
    // The columns the text is set in: the body stands in a `multicols`
    // environment (`columns_around`), and a break of the column ends one.
    if f.page.columns > 1 {
        let _ = writeln!(h, "\\usepackage{{multicol}}\n\\setlength{{\\columnsep}}{{{}}}", f.page.column_gap);
    }
    if f.page.columns > 1 || !looks.is_empty() {
        // Whether the body's columns are begun, which a new page of a look
        // ends and begins again (`switch`).
        let _ = writeln!(
            h,
            "\\newif\\ifgkcolumns\n\\newcommand{{\\gkcolumnsend}}{{\\ifgkcolumns\\end{{multicols}}\\fi}}\n\\newcommand{{\\gkcolumnsagain}}{{\\ifgkcolumns\\begin{{multicols}}{{{}}}\\fi}}",
            f.page.columns.min(4)
        );
    }
    if !looks.is_empty() {
        let _ = writeln!(h, "{}", look_styles(f, looks, p, twoside));
    }

    // Figures stand where they are written, and mathematics has what it needs.
    let _ = writeln!(h, "\\usepackage{{float}}\n\\usepackage{{amsmath}}\n\\usepackage{{graphicx}}");
    if p.flows {
        let _ = writeln!(h, "\\usepackage{{wrapfig}}\n\\usepackage{{needspace}}");
    }
    if p.tables {
        // What Pandoc asks for when it writes a table itself: here the
        // tables are written before it sees them.
        let _ = writeln!(
            h,
            "\\usepackage{{longtable,booktabs,array}}\n\\newcounter{{none}}\n\\usepackage{{calc}}\n\\usepackage{{etoolbox}}\n\\makeatletter\n\\patchcmd\\longtable{{\\par}}{{\\if@noskipsec\\mbox{{}}\\fi\\par}}{{}}{{}}\n\\makeatother\n\\IfFileExists{{footnotehyper.sty}}{{\\usepackage{{footnotehyper}}}}{{\\usepackage{{footnote}}}}\n\\makesavenoteenv{{longtable}}"
        );
    }

    // Numbered levels in styles of their own are numbered by the core, in the text of the headings (ADR 0058).
    Settings { variables: v, header: h, number_sections: f.headings.plain_numbering() }
}

/// Whether the header or the footer differs on left pages: the document is then set two-sided.
fn alternates(f: &DocumentFormat) -> bool {
    [&f.header, &f.footer].iter().any(|m| m.is_visible() && m.alternate)
}

/// The width and the height of the paper in LaTeX's big points, which are
/// the points of the layout, to a hundredth.
fn paper(f: &DocumentFormat) -> (f32, f32) {
    let (w, h) = f.page.dimensions();
    ((w * 100.0).round() / 100.0, (h * 100.0).round() / 100.0)
}

/// The margins of the page, as `geometry` is told them.
fn page_margins(f: &DocumentFormat) -> [String; 4] {
    let p = &f.page;
    [
        format!("top={}", p.margin_top),
        format!("bottom={}", p.margin_bottom),
        format!("left={}", p.margin_left),
        format!("right={}", p.margin_right),
    ]
}

/// How far a paragraph is indented and how far apart paragraphs stand, both as said.
pub(crate) fn paragraph_lengths(f: &DocumentFormat) -> String {
    let (indent, skip) = (f.text.indent, f.text.space_between);
    format!("\\setlength{{\\parindent}}{{{indent}}}\n\\setlength{{\\parskip}}{{{skip}}}")
}

/// Whether words are broken at the end of a line: LaTeX's own penalties, or
/// so high that it never does.
fn hyphenation(f: &DocumentFormat) -> &'static str {
    if f.text.hyphenate {
        "\\hyphenpenalty=50\n\\exhyphenpenalty=50"
    } else {
        "\\hyphenpenalty=10000\n\\exhyphenpenalty=10000"
    }
}

/// LaTeX's name of a style of the page numbers: `\roman{page}`, `\pagenumbering{roman}`.
fn numbering(style: NumberStyle) -> &'static str {
    match style {
        NumberStyle::Arabic => "arabic",
        NumberStyle::Roman => "Roman",
        NumberStyle::RomanLower => "roman",
        NumberStyle::Letters => "Alph",
        NumberStyle::LettersLower => "alph",
    }
}

/// The name of the style of page a look's header and footer are set in
/// (ADR 0059): the same for looks whose header, footer and size are the
/// same, so that the preamble and the switches name it alike without a
/// list between them. Its openers have the style of the name and `opener`.
fn look_style(f: &DocumentFormat) -> String {
    let said = serde_json::to_string(&(&f.header, &f.footer, f.font.size)).unwrap_or_default();
    // FNV-1a: the same name in every run.
    let hash = said.bytes().fold(0x811c_9dc5_u32, |h, b| (h ^ u32::from(b)).wrapping_mul(0x0100_0193));
    format!("gklook{hash:08x}")
}

/// What the preamble defines for the looks of the elements (ADR 0059): a
/// style of page for the header and the footer of each look and of the
/// document, and one for its openers; how the openers are given a look's
/// style; how the size of the paper is changed.
fn look_styles(f: &DocumentFormat, looks: &[&DocumentFormat], p: &Particulars, twoside: bool) -> String {
    let mut out = String::new();
    let mut named: Vec<String> = Vec::new();
    for look in std::iter::once(&f).chain(looks) {
        let name = look_style(look);
        if named.contains(&name) {
            continue;
        }
        let _ = writeln!(
            out,
            "\\fancypagestyle{{{name}}}{{\\fancyhf{{}}{}}}\n\\fancypagestyle{{{name}opener}}{{\\fancyhf{{}}{}}}",
            margin_commands(look, p, twoside, |_| true),
            margin_commands(look, p, twoside, |m| m.openers),
        );
        named.push(name);
    }
    out.push_str(
        "\\newcommand{\\gkopener}[1]{\\expandafter\\global\\expandafter\\let\\csname ps@opener\\expandafter\\endcsname\\csname ps@#1\\endcsname}\n",
    );
    out.push_str("\\makeatletter\n\\newcommand{\\gktype}[2]{\\renewcommand{\\normalsize}{\\@setfontsize\\normalsize{#1}{#2}}\\normalsize}\n\\makeatother\n");
    out.push_str("\\newcommand{\\gkpaper}[2]{\\global\\paperwidth=#1\\relax\\global\\paperheight=#2\\relax\\ifdefined\\pdfpagewidth\\global\\pdfpagewidth=#1\\relax\\global\\pdfpageheight=#2\\relax\\fi\\ifdefined\\pagewidth\\global\\pagewidth=#1\\relax\\global\\pageheight=#2\\relax\\fi}");
    out
}

/// The size of the type, the spacing of the lines and how the paragraphs
/// are set, all of them, so that a switch holds however it is grouped.
fn text_commands(f: &DocumentFormat) -> String {
    // The text's size is the normal size from here on, which a figure, or a
    // kind with a spacing of its own, comes back to.
    let mut out =
        format!("\\gktype{{{}}}{{{}}}\\setstretch{{{}}}\n", f.font.size, leading(f.font.size), f.text.line_spacing);
    // Ragged or justified first: either sets the indent, which follows.
    if f.text.align == Align::Justified {
        out.push_str("\\ifdefined\\justifying\\justifying\\fi\n");
    } else {
        if !f.text.indent.is_zero() {
            let _ = writeln!(out, "\\setlength{{\\RaggedRightParindent}}{{{}}}", f.text.indent);
        }
        out.push_str("\\RaggedRight\n");
    }
    let _ = writeln!(out, "{}\n{}", paragraph_lengths(f), hyphenation(f));
    out.push_str(if f.line_numbers { "\\linenumbers" } else { "\\ifdefined\\nolinenumbers\\nolinenumbers\\fi" });
    out
}

/// What LaTeX is told where the stretch of an element with a look of its
/// own begins or ends (ADR 0059), as Typst is (`typst::switch`): where the
/// pages differ, or the count begins anew, a new page, with the size, the
/// margins, the header and the footer and the numbering of the look it
/// comes to; then the size of its type and its paragraphs. `entering` says
/// it is the stretch's beginning, where the count may begin anew. The body's
/// columns are ended for the new page and begun again after it: they are
/// the document's throughout, since a break of the page within the body
/// ends and begins them as the document has them.
pub fn switch(from: &DocumentFormat, to: &DocumentFormat, entering: bool) -> String {
    let mut out = String::new();
    let pages = crate::formats::typst::pages_differ(from, to);
    let restart = entering && to.page.restart;
    if pages || restart {
        out.push_str("\\gkcolumnsend\n\\clearpage\n");
    }
    if pages {
        let (w, h) = paper(to);
        if paper(from) != (w, h) || page_margins(from) != page_margins(to) {
            // `geometry` keeps the paper of the preamble: the text is laid out
            // on a layout of the look's size, and the paper made that size
            // after. The header and the footer are as wide as the text.
            let _ = writeln!(
                out,
                "\\newgeometry{{layoutwidth={w}bp,layoutheight={h}bp,{}}}\\setlength{{\\headwidth}}{{\\textwidth}}",
                page_margins(to).join(",")
            );
        }
        if paper(from) != (w, h) {
            let _ = writeln!(out, "\\gkpaper{{{w}bp}}{{{h}bp}}");
        }
        let name = look_style(to);
        let _ = writeln!(out, "\\pagestyle{{{name}}}\\gkopener{{{name}opener}}");
    }
    if restart {
        let _ = writeln!(out, "\\pagenumbering{{{}}}", numbering(to.page.numbering));
    } else if from.page.numbering != to.page.numbering {
        let _ = writeln!(out, "\\gdef\\thepage{{\\{}{{page}}}}", numbering(to.page.numbering));
    }
    if pages || restart {
        out.push_str("\\gkcolumnsagain\n");
    }
    out.push_str(&text_commands(to));
    out
}

/// The commands of `fancyhdr` that set the header and the footer (ADR 0057),
/// each margin only where `wanted` says so of it: every place from its
/// items, joined by the separator; on left (`E`) and right (`O`) pages apart
/// where the document is two-sided.
fn margin_commands(f: &DocumentFormat, p: &Particulars, twoside: bool, wanted: impl Fn(&Margin) -> bool) -> String {
    let mut out = String::new();
    for (m, which) in [(&f.header, "head"), (&f.footer, "foot")] {
        if !m.is_visible() || !wanted(m) {
            continue;
        }
        let size = if m.size > 0.0 { m.size } else { f.font.size };
        let look = format!("{}{}", fontsize(size), if m.italic { "\\itshape" } else { "" });
        let item = |i: &Item| -> Option<String> {
            let words = match i {
                Item::PageNumber => return Some("\\thepage".into()),
                Item::Chapter => "\\leftmark".to_owned(),
                _ => escape(&p.words(i, f)?),
            };
            Some(match m.case {
                Case::None => words,
                Case::Upper => format!("\\MakeUppercase{{{words}}}"),
                Case::Smallcaps => format!("\\textsc{{{words}}}"),
            })
        };
        let place = |items: &[Item]| {
            let items: Vec<String> = items.iter().filter_map(item).collect();
            items.join(&escape(&m.separator))
        };
        let mut set = |sides: &Sides, pages: &str| {
            for (slot, items) in [("L", &sides.left), ("C", &sides.center), ("R", &sides.right)] {
                let words = place(items);
                if !words.is_empty() {
                    let _ = write!(out, "\\fancy{which}[{slot}{pages}]{{{{{look} {words}}}}}");
                }
            }
        };
        if twoside {
            set(&m.places, "O");
            set(m.even_places(), "E");
        } else {
            set(&m.places, "");
        }
    }
    out
}

/// What is written around the body of the document where its text is set
/// in more than one column: the beginning and the end of `multicols`.
pub fn columns_around(f: &DocumentFormat) -> Option<(String, String)> {
    (f.page.columns > 1).then(|| {
        (
            format!("\\gkcolumnstrue\\begin{{multicols}}{{{}}}", f.page.columns.min(4)),
            "\\end{multicols}\\gkcolumnsfalse".to_owned(),
        )
    })
}

/// What is written around a paragraph of a kind, from the kind's look: the
/// group that sets its margins, its type and its room, and what closes it.
/// `text` is the look of the text, against which a size and a spacing are
/// told: what is the same as the text's is left unsaid.
/// What is written around the text of a part of a document, as its look
/// says (`templates/kinds.rs`): a page of its own begins a third of the way
/// down; centred or set right, in italics, in a size of its own.
pub fn around_part(look: &crate::templates::kinds::Resolved) -> (String, String) {
    let mut open = String::from("{\\par");
    if look.own_page {
        open.push_str("\\vspace*{0.3\\textheight}");
    }
    match look.align {
        Align::Center => open.push_str("\\centering"),
        Align::Right => open.push_str("\\raggedleft"),
        Align::Left | Align::Justified => {}
    }
    if look.italic {
        open.push_str("\\itshape");
    }
    if look.size > 0.0 {
        open.push_str(&fontsize(look.size));
    }
    open.push('\n');
    (open, "\\par}".into())
}

pub fn around(look: &Resolved, text: Option<&Resolved>) -> (String, String) {
    let mut open = String::from("{\\par");
    if look.space_before.points() > 0.0 {
        let _ = write!(open, "\\vspace{{{}}}", look.space_before);
    }
    let _ =
        write!(open, "\\leftskip={}\\rightskip={}\\parindent={}", look.indent_left, look.indent_right, look.first_line);
    if look.line_spacing > 0.0 && text.is_none_or(|t| (t.line_spacing - look.line_spacing).abs() > 0.01) {
        let _ = write!(open, "\\setstretch{{{}}}", look.line_spacing);
    }
    if look.size > 0.0 && text.is_none_or(|t| (t.size - look.size).abs() > 0.01) {
        open.push_str(&fontsize(look.size));
    }
    if look.bold {
        open.push_str("\\bfseries");
    }
    if look.italic {
        open.push_str("\\itshape");
    }
    if look.case == Case::Smallcaps {
        open.push_str("\\scshape");
    }
    if look.monospace {
        open.push_str("\\ttfamily");
    }
    match look.align {
        Align::Center => open.push_str("\\centering"),
        Align::Right => open.push_str("\\raggedleft"),
        Align::Left => open.push_str("\\raggedright"),
        Align::Justified => {}
    }
    open.push_str("\\noindent ");
    let mut close = String::from("\\par");
    if look.keep_with_next {
        close.push_str("\\nobreak");
    }
    if look.space_after.points() > 0.0 {
        let _ = write!(close, "\\vspace{{{}}}", look.space_after);
    }
    close.push('}');
    (open, close)
}

/// The style of BibLaTeX that comes closest to a reference style, for those
/// who keep their citations as commands.
pub fn biblatex_style(style: &str, kind: &str) -> &'static str {
    let s = style.to_ascii_lowercase();
    if s.starts_with("apa") {
        "apa"
    } else if s.starts_with("modern-language-association") {
        "mla"
    } else if s.starts_with("chicago-author-date") || s.starts_with("turabian-author-date") {
        "chicago-authordate"
    } else if s.starts_with("chicago") || s.starts_with("turabian") {
        "chicago-notes"
    } else if s.starts_with("ieee") {
        "ieee"
    } else if s.starts_with("nature") {
        "nature"
    } else if s.starts_with("science") {
        "science"
    } else if s.starts_with("oscola") {
        "oscola"
    } else if s.starts_with("mhra") {
        "mhra"
    } else {
        match kind {
            "note" => "verbose-ibid",
            "numeric" => "numeric",
            "label" => "alphabetic",
            _ => "authoryear",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn escaping() {
        assert_eq!(
            escape("R&D: 50% of $5 #1 a_b {x} ~ ^ \\"),
            "R\\&D: 50\\% of \\$5 \\#1 a\\_b \\{x\\} \\textasciitilde{} \\textasciicircum{} \\textbackslash{}"
        );
    }

    #[test]
    fn a_format_as_settings() {
        let mut f = DocumentFormat::default();
        f.font.size = 11.5;
        f.headings.numbered = true;
        f.header.shown = true;
        f.header.places.left = vec![Item::Text { text: "R&D".into() }];
        f.footer.first_page = false;
        let s = settings(&f, &[], &Particulars::default());
        let get =
            |name: &str| s.variables.iter().filter(|(n, _)| n == name).map(|(_, v)| v.as_str()).collect::<Vec<_>>();
        assert_eq!(get("papersize"), vec!["a4"]);
        assert_eq!(get("geometry"), vec!["top=2.5cm", "bottom=2.5cm", "left=2.5cm", "right=2.5cm"]);
        assert_eq!(get("fontsize"), vec!["11pt"]);
        assert_eq!(get("linestretch"), vec!["2"]);
        assert!(s.header.contains("\\fontsize{11.5}{13.8}"));
        assert!(s.header.contains("\\titleformat{\\section}"));
        assert!(s.header.contains("\\thesection"));
        assert!(s.header.contains("\\fancyhead[L]{{\\fontsize{11.5}{13.8}\\selectfont R\\&D}}"), "{}", s.header);
        assert!(s.header.contains("\\fancyfoot[C]{{\\fontsize{11.5}{13.8}\\selectfont \\thepage}}"), "{}", s.header);
        assert!(s.header.contains("\\thispagestyle{plain}"));
        // The first page has the header but not the footer; the openers both.
        assert!(s.header.contains("\\fancypagestyle{plain}{\\fancyhf{}\\fancyhead[L]"), "{}", s.header);
        assert!(!s.header.contains("\\fancypagestyle{plain}{\\fancyhf{}\\fancyhead[L]{{\\fontsize{11.5}{13.8}\\selectfont R\\&D}}\\fancyfoot"), "{}", s.header);
        assert!(s.header.contains("\\fancypagestyle{opener}{\\fancyhf{}\\fancyhead[L]{{\\fontsize{11.5}{13.8}\\selectfont R\\&D}}\\fancyfoot[C]"), "{}", s.header);
        assert!(s.number_sections);

        // Different on left pages: two-sided, each side its own; the chapter and the number's style.
        f.footer.alternate = true;
        f.footer.places = Sides { right: vec![Item::PageNumber], ..Default::default() };
        f.footer.even = Some(Sides { left: vec![Item::PageNumber, Item::Chapter], ..Default::default() });
        f.footer.openers = false;
        f.page.numbering = NumberStyle::RomanLower;
        let s = settings(&f, &[], &Particulars::default());
        assert!(s.variables.contains(&("classoption".into(), "twoside".into())));
        assert!(s.header.contains("\\fancyfoot[RO]{{\\fontsize{11.5}{13.8}\\selectfont \\thepage}}"), "{}", s.header);
        assert!(
            s.header.contains("\\fancyfoot[LE]{{\\fontsize{11.5}{13.8}\\selectfont \\thepage · \\leftmark}}"),
            "{}",
            s.header
        );
        assert!(s.header.contains("\\renewcommand{\\thepage}{\\roman{page}}"));
        assert!(!s.header.contains("\\fancypagestyle{opener}{\\fancyhf{}\\fancyhead[LO]{{\\fontsize{11.5}{13.8}\\selectfont R\\&D}}\\fancyhead[LE]{{\\fontsize{11.5}{13.8}\\selectfont R\\&D}}\\fancyfoot"), "{}", s.header);
    }

    #[test]
    fn the_looks_of_elements_in_the_preamble_and_at_their_switches() {
        let f = DocumentFormat::default();
        // A look in smaller type only: no new page, the type and the paragraphs.
        let mut small = f.clone();
        small.font.size = 10.0;
        small.text.line_spacing = 1.0;
        let s = switch(&f, &small, true);
        assert!(!s.contains("\\clearpage") && !s.contains("\\pagestyle"), "{s}");
        assert!(s.starts_with("\\gktype{10}{12}\\setstretch{1}\n"), "{s}");
        assert!(s.contains("\\setlength{\\parindent}{") && s.contains("\\setlength{\\parskip}{0pt}"), "{s}");
        assert!(s.contains("\\setlength{\\RaggedRightParindent}{1.27cm}\n\\RaggedRight\n"), "{s}");
        let mut justified = small.clone();
        justified.text.align = Align::Justified;
        justified.text.hyphenate = true;
        let s = switch(&f, &justified, true);
        assert!(s.contains("\\ifdefined\\justifying\\justifying\\fi") && s.contains("\\hyphenpenalty=50\n"), "{s}");
        // And back.
        assert!(switch(&small, &f, false).starts_with("\\gktype{12}{14.4}\\setstretch{2}\n"));

        // A look in landscape, without its footer, numbered anew in roman: a new page set as it has them.
        let mut appendix = f.clone();
        appendix.page.size = "custom".into();
        appendix.page.width = crate::formats::Length::mm(297.0);
        appendix.page.height = crate::formats::Length::mm(210.0);
        appendix.page.margin_left = crate::formats::Length::cm(1.5);
        appendix.footer.shown = false;
        appendix.page.numbering = NumberStyle::RomanLower;
        appendix.page.restart = true;
        appendix.text.indent = crate::formats::Length::pt(0.0);
        appendix.text.space_between = crate::formats::Length::pt(12.0);
        let into = switch(&f, &appendix, true);
        let name = look_style(&appendix);
        assert!(
            into.starts_with("\\gkcolumnsend\n\\clearpage\n\\newgeometry{layoutwidth=841.89bp,layoutheight=595.28bp,"),
            "{into}"
        );
        assert!(into.contains("\\gkpaper{841.89bp}{595.28bp}") && into.contains(",left=1.5cm,right=2.5cm}"), "{into}");
        assert!(into.contains(&format!("\\pagestyle{{{name}}}\\gkopener{{{name}opener}}")), "{into}");
        assert!(into.contains("\\pagenumbering{roman}\n\\gkcolumnsagain\n"), "{into}");
        assert!(into.contains("\\setlength{\\parindent}{0pt}"), "{into}");
        // Back to the document's: its paper, its style, its numbers counted on.
        let back = switch(&appendix, &f, false);
        assert!(back.contains("\\gkpaper{595.28bp}{841.89bp}"), "{back}");
        assert!(back.contains(&format!("\\pagestyle{{{}}}", look_style(&f))), "{back}");
        assert!(back.contains("\\gdef\\thepage{\\arabic{page}}") && !back.contains("\\pagenumbering"), "{back}");
        // Counted anew without another page: a new page all the same, nothing of the page set.
        let mut anew = f.clone();
        anew.page.restart = true;
        let s = switch(&f, &anew, true);
        assert!(s.contains("\\clearpage\n\\pagenumbering{arabic}\n") && !s.contains("\\pagestyle"), "{s}");
        assert!(!switch(&anew, &f, false).contains("\\clearpage"), "nothing at its end");

        // The preamble: a style for each look and the document, the same look named once.
        assert_ne!(look_style(&f), look_style(&small), "the header of the text's size is set in it");
        assert_eq!(look_style(&appendix), look_style(&appendix.clone()));
        let s = settings(&f, &[&appendix, &appendix, &small], &Particulars::default());
        assert_eq!(
            s.header.matches(&format!("\\fancypagestyle{{{name}}}{{\\fancyhf{{}}}}")).count(),
            1,
            "{}",
            s.header
        );
        assert!(s.header.contains(&format!("\\fancypagestyle{{{}}}{{\\fancyhf{{}}\\fancyfoot[C]", look_style(&f))));
        assert!(s.header.contains("\\newcommand{\\gkopener}") && s.header.contains("\\newcommand{\\gkpaper}"));
        assert!(s.header.contains("\\newcommand{\\gkcolumnsagain}{\\ifgkcolumns\\begin{multicols}{1}\\fi}"));
        // Without looks, none of it.
        let s = settings(&f, &[], &Particulars::default());
        assert!(!s.header.contains("gklook") && !s.header.contains("\\ifgkcolumns"), "{}", s.header);
    }

    #[test]
    fn what_is_written_around_a_kind() {
        let f = DocumentFormat::default();
        let text = crate::formats::kinds::resolve(&f, "text", &[]);
        let scene = crate::formats::kinds::resolve(&f, "scene", &[]);
        let (open, close) = around(&scene, Some(&text));
        assert!(open.starts_with("{\\par\\vspace{19pt}\\leftskip=0pt\\rightskip=0pt\\parindent=0pt"), "{open}");
        assert!(open.contains("\\bfseries") && open.ends_with("\\raggedright\\noindent "), "{open}");
        assert_eq!(close, "\\par\\nobreak\\vspace{11pt}}");
        let character = crate::formats::kinds::resolve(&f, "character", &[]);
        assert!(around(&character, Some(&text)).0.contains("\\leftskip=5.6cm"));
        // Of a kind set smaller and tighter, both are said.
        let mut small = text.clone();
        small.size = 10.0;
        small.line_spacing = 1.0;
        assert!(around(&small, Some(&text)).0.contains("\\setstretch{1}\\fontsize{10}{12}\\selectfont"));
    }

    #[test]
    fn styles_of_biblatex() {
        assert_eq!(biblatex_style("chicago-notes-bibliography", "note"), "chicago-notes");
        assert_eq!(biblatex_style("chicago-author-date", "author-date"), "chicago-authordate");
        assert_eq!(biblatex_style("apa", "author-date"), "apa");
        assert_eq!(biblatex_style("the-journal-of-hellenic-studies", "author-date"), "authoryear");
        assert_eq!(biblatex_style("something", "note"), "verbose-ibid");
    }
}
