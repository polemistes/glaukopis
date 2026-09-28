//! A format as settings for LaTeX: variables for Pandoc's template, and what
//! goes into the preamble.

use std::fmt::Write;

use crate::formats::typst::Particulars;
use crate::formats::{Align, Case, DocumentFormat, HeadContent, NoteKind, Paragraphs, Position};

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

fn font_command(size: f32, bold: bool, italic: bool, case: Case, align: Align) -> String {
    let mut s = format!("\\normalfont\\fontsize{{{size}}}{{{}}}\\selectfont", (size * 1.2 * 10.0).round() / 10.0);
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

pub fn settings(f: &DocumentFormat, p: &Particulars) -> Settings {
    let mut v: Vec<(String, String)> = Vec::new();
    let mut h = String::new();

    v.push(("documentclass".into(), "article".into()));
    match f.page.size.to_ascii_lowercase().as_str() {
        "a4" | "a5" | "b5" | "letter" | "legal" => v.push(("papersize".into(), f.page.size.to_ascii_lowercase())),
        _ => {
            let (w, ht) = f.page.dimensions();
            v.push(("geometry".into(), format!("paperwidth={w}pt")));
            v.push(("geometry".into(), format!("paperheight={ht}pt")));
        }
    }
    for (side, m) in [
        ("top", f.page.margin_top),
        ("bottom", f.page.margin_bottom),
        ("left", f.page.margin_left),
        ("right", f.page.margin_right),
    ] {
        v.push(("geometry".into(), format!("{side}={m}")));
    }

    // The classes know three sizes; any other is set by hand.
    let class_size = [10.0_f32, 11.0, 12.0]
        .into_iter()
        .min_by(|a, b| (a - f.font.size).abs().total_cmp(&(b - f.font.size).abs()))
        .unwrap_or(12.0);
    v.push(("fontsize".into(), format!("{class_size}pt")));
    if (class_size - f.font.size).abs() > 0.01 {
        let _ = writeln!(
            h,
            "\\AtBeginDocument{{\\fontsize{{{}}}{{{}}}\\selectfont}}",
            f.font.size,
            (f.font.size * 1.2 * 10.0).round() / 10.0
        );
    }
    v.push(("mainfont".into(), f.font.family.clone()));
    v.push(("linestretch".into(), format!("{}", f.text.line_spacing)));

    match f.text.paragraphs {
        Paragraphs::Indent => {
            v.push(("indent".into(), "true".into()));
            let _ = writeln!(h, "\\setlength{{\\parindent}}{{{}}}", f.text.indent);
            let _ = writeln!(h, "\\setlength{{\\parskip}}{{0pt}}");
            if f.text.indent_first {
                let _ = writeln!(h, "\\usepackage{{indentfirst}}");
            }
        }
        Paragraphs::Spaced => {
            let _ = writeln!(h, "\\setlength{{\\parindent}}{{0pt}}");
            let _ = writeln!(h, "\\setlength{{\\parskip}}{{{}}}", f.text.space_between);
        }
    }
    if f.text.align != Align::Justified {
        let _ = writeln!(h, "\\usepackage[document]{{ragged2e}}");
        if f.text.paragraphs == Paragraphs::Indent {
            let _ = writeln!(h, "\\setlength{{\\RaggedRightParindent}}{{{}}}", f.text.indent);
        }
    }
    if !f.text.hyphenate {
        let _ = writeln!(h, "\\hyphenpenalty=10000\n\\exhyphenpenalty=10000");
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
        let label = if f.headings.numbered { format!("\\the{command}") } else { String::new() };
        let sep = if f.headings.numbered { "0.6em" } else { "0pt" };
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
        let _ = write!(
            quote,
            "\\fontsize{{{}}}{{{}}}\\selectfont",
            f.quote.size,
            (f.quote.size * 1.2 * 10.0).round() / 10.0
        );
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
    if f.running_head.content != HeadContent::None {
        let authors = if f.title.anonymous { String::new() } else { p.authors.join(", ") };
        let mut words = match f.running_head.content {
            HeadContent::Title => p.title.clone(),
            HeadContent::Author => authors,
            HeadContent::AuthorTitle if authors.is_empty() => p.title.clone(),
            HeadContent::AuthorTitle => format!("{authors}: {}", p.title),
            HeadContent::Text => f.running_head.text.clone(),
            HeadContent::None => String::new(),
        };
        if f.running_head.case == Case::Upper {
            words = words.to_uppercase();
        }
        if !words.trim().is_empty() {
            let slot = match f.running_head.align {
                Align::Left | Align::Justified => "L",
                Align::Center => "C",
                Align::Right => "R",
            };
            let _ = writeln!(h, "\\fancyhead[{slot}]{{{}}}", escape(words.trim()));
        }
    }
    if f.page_numbers.show {
        let (place, slot) = match f.page_numbers.position {
            Position::TopLeft => ("head", "L"),
            Position::TopCenter => ("head", "C"),
            Position::TopRight => ("head", "R"),
            Position::BottomLeft => ("foot", "L"),
            Position::BottomCenter => ("foot", "C"),
            Position::BottomRight => ("foot", "R"),
        };
        let _ = writeln!(h, "\\fancy{place}[{slot}]{{\\thepage}}");
        if f.page_numbers.first_page {
            let _ = writeln!(h, "\\fancypagestyle{{plain}}{{\\fancyhf{{}}\\fancy{place}[{slot}]{{\\thepage}}}}");
        } else {
            let _ = writeln!(
                h,
                "\\fancypagestyle{{plain}}{{\\fancyhf{{}}}}\n\\AtBeginDocument{{\\thispagestyle{{plain}}}}"
            );
        }
    }
    if f.line_numbers {
        let _ = writeln!(h, "\\usepackage{{lineno}}\n\\linenumbers");
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

    Settings { variables: v, header: h, number_sections: f.headings.numbered }
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
        f.running_head.content = HeadContent::Text;
        f.running_head.text = "R&D".into();
        f.page_numbers.first_page = false;
        let s = settings(&f, &Particulars::default());
        let get =
            |name: &str| s.variables.iter().filter(|(n, _)| n == name).map(|(_, v)| v.as_str()).collect::<Vec<_>>();
        assert_eq!(get("papersize"), vec!["a4"]);
        assert_eq!(get("geometry"), vec!["top=2.5cm", "bottom=2.5cm", "left=2.5cm", "right=2.5cm"]);
        assert_eq!(get("fontsize"), vec!["11pt"]);
        assert_eq!(get("linestretch"), vec!["2"]);
        assert!(s.header.contains("\\fontsize{11.5}{13.8}"));
        assert!(s.header.contains("\\titleformat{\\section}"));
        assert!(s.header.contains("\\thesection"));
        assert!(s.header.contains("\\fancyhead[L]{R\\&D}"));
        assert!(s.header.contains("\\thispagestyle{plain}"));
        assert!(s.number_sections);
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
