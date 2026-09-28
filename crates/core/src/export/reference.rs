//! Reference documents for DOCX and ODT.
//!
//! Pandoc takes the look of a word-processor document from a document given
//! to it as a pattern. Here that pattern is made from a format: Pandoc's own
//! pattern is taken, its styles replaced, its page set up.

use std::fmt::Write as _;
use std::io::{Cursor, Read, Write};

use crate::error::{Error, Result};
use crate::formats::typst::Particulars;
use crate::formats::{
    Align, CaptionPosition, Case, DocumentFormat, HeadContent, HeadingLevel, Length, NoteKind, Paragraphs, Rules,
    fallbacks,
};

fn xml(text: &str) -> String {
    text.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;").replace('"', "&quot;")
}

fn zip_error(e: zip::result::ZipError) -> Error {
    Error::invalid(format!("the pattern document could not be read: {e}"))
}

/// Reads a zip, lets `change` alter, add or drop files, and writes it again.
pub(crate) fn rewrite(
    source: &[u8],
    mut change: impl FnMut(&mut Vec<(String, Vec<u8>)>) -> Result<()>,
) -> Result<Vec<u8>> {
    let mut archive = zip::ZipArchive::new(Cursor::new(source)).map_err(zip_error)?;
    let mut files: Vec<(String, Vec<u8>)> = Vec::with_capacity(archive.len());
    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(zip_error)?;
        if file.is_dir() {
            continue;
        }
        let mut bytes = Vec::with_capacity(file.size() as usize);
        file.read_to_end(&mut bytes).map_err(|e| Error::io("reading the pattern document", e))?;
        files.push((file.name().to_owned(), bytes));
    }
    change(&mut files)?;

    let mut out = zip::ZipWriter::new(Cursor::new(Vec::new()));
    // `mimetype` must come first in an ODT, and must not be compressed.
    files.sort_by_key(|(name, _)| name != "mimetype");
    for (name, bytes) in &files {
        let method = if name == "mimetype" { zip::CompressionMethod::Stored } else { zip::CompressionMethod::Deflated };
        let options = zip::write::SimpleFileOptions::default().compression_method(method);
        out.start_file(name.as_str(), options).map_err(zip_error)?;
        out.write_all(bytes).map_err(|e| Error::io("writing the pattern document", e))?;
    }
    Ok(out.finish().map_err(zip_error)?.into_inner())
}

pub(crate) fn put(files: &mut Vec<(String, Vec<u8>)>, name: &str, content: String) {
    match files.iter_mut().find(|(n, _)| n == name) {
        Some(f) => f.1 = content.into_bytes(),
        None => files.push((name.to_owned(), content.into_bytes())),
    }
}

pub(crate) fn text_of(files: &[(String, Vec<u8>)], name: &str) -> Result<String> {
    files
        .iter()
        .find(|(n, _)| n == name)
        .map(|(_, b)| String::from_utf8_lossy(b).into_owned())
        .ok_or_else(|| Error::invalid(format!("the pattern document has no {name}")))
}

/// The font to name in a document: the one asked for. Word processors find
/// their own substitutes; where the document is opened, the font may be there.
fn family(format: &DocumentFormat) -> String {
    format.font.family.trim().to_owned()
}

// =========================================================================
// DOCX
// =========================================================================

fn half_points(size: f32) -> i32 {
    (size * 2.0).round() as i32
}

/// Line spacing as Word counts: 240 to the line.
fn line(spacing: f32) -> i32 {
    (spacing * 240.0).round() as i32
}

fn jc(a: Align) -> &'static str {
    match a {
        Align::Left => "left",
        Align::Center => "center",
        Align::Right => "right",
        Align::Justified => "both",
    }
}

struct Run {
    size: Option<f32>,
    bold: Option<bool>,
    italic: Option<bool>,
    case: Case,
}

impl Run {
    fn xml(&self) -> String {
        let mut s = String::new();
        if let Some(b) = self.bold {
            let v = if b { "" } else { " w:val=\"0\"" };
            let _ = write!(s, "<w:b{v}/><w:bCs{v}/>");
        }
        if let Some(i) = self.italic {
            let v = if i { "" } else { " w:val=\"0\"" };
            let _ = write!(s, "<w:i{v}/><w:iCs{v}/>");
        }
        match self.case {
            Case::Upper => s.push_str("<w:caps/>"),
            Case::Smallcaps => s.push_str("<w:smallCaps/>"),
            Case::None => {}
        }
        if let Some(size) = self.size {
            let _ = write!(s, "<w:sz w:val=\"{0}\"/><w:szCs w:val=\"{0}\"/>", half_points(size));
        }
        if s.is_empty() { s } else { format!("<w:rPr>{s}</w:rPr>") }
    }
}

#[derive(Default)]
struct Para {
    before: i32,
    after: i32,
    line: Option<i32>,
    align: Option<Align>,
    left: i32,
    right: i32,
    first: i32,
    hanging: i32,
    keep_next: bool,
    outline: Option<usize>,
    page_break_before: bool,
}

impl Para {
    fn xml(&self) -> String {
        let mut s = String::new();
        if self.keep_next {
            s.push_str("<w:keepNext/><w:keepLines/>");
        }
        if self.page_break_before {
            s.push_str("<w:pageBreakBefore/>");
        }
        let _ = write!(s, "<w:spacing w:before=\"{}\" w:after=\"{}\"", self.before, self.after);
        if let Some(l) = self.line {
            let _ = write!(s, " w:line=\"{l}\" w:lineRule=\"auto\"");
        }
        s.push_str("/>");
        let _ = write!(s, "<w:ind w:left=\"{}\" w:right=\"{}\"", self.left, self.right);
        if self.hanging > 0 {
            let _ = write!(s, " w:hanging=\"{}\"", self.hanging);
        } else {
            let _ = write!(s, " w:firstLine=\"{}\"", self.first);
        }
        s.push_str("/>");
        if let Some(a) = self.align {
            let _ = write!(s, "<w:jc w:val=\"{}\"/>", jc(a));
        }
        if let Some(o) = self.outline {
            let _ = write!(s, "<w:outlineLvl w:val=\"{o}\"/>");
        }
        format!("<w:pPr>{s}</w:pPr>")
    }
}

fn paragraph_style(
    id: &str,
    name: &str,
    based_on: Option<&str>,
    next: Option<&str>,
    link: Option<&str>,
    p: &Para,
    r: &Run,
) -> String {
    let custom = !matches!(
        id,
        "Normal"
            | "BodyText"
            | "Title"
            | "Subtitle"
            | "Date"
            | "Bibliography"
            | "BlockText"
            | "FootnoteText"
            | "Caption"
    ) && !id.starts_with("Heading");
    let mut s = format!(
        "<w:style w:type=\"paragraph\"{}{} w:styleId=\"{id}\"><w:name w:val=\"{name}\"/>",
        if id == "Normal" { " w:default=\"1\"" } else { "" },
        if custom { " w:customStyle=\"1\"" } else { "" },
    );
    if let Some(b) = based_on {
        let _ = write!(s, "<w:basedOn w:val=\"{b}\"/>");
    }
    if let Some(n) = next {
        let _ = write!(s, "<w:next w:val=\"{n}\"/>");
    }
    if let Some(l) = link {
        let _ = write!(s, "<w:link w:val=\"{l}\"/>");
    }
    s.push_str("<w:qFormat/>");
    s.push_str(&p.xml());
    s.push_str(&r.xml());
    s.push_str("</w:style>");
    s
}

fn character_style(id: &str, name: &str, link: Option<&str>, inner: &str) -> String {
    let default = if id == "DefaultParagraphFont" { " w:default=\"1\"" } else { "" };
    let custom = if matches!(id, "DefaultParagraphFont" | "Hyperlink" | "FootnoteReference") {
        ""
    } else {
        " w:customStyle=\"1\""
    };
    let link = link.map(|l| format!("<w:link w:val=\"{l}\"/>")).unwrap_or_default();
    let based = if id == "DefaultParagraphFont" { "" } else { "<w:basedOn w:val=\"DefaultParagraphFont\"/>" };
    let props = if inner.is_empty() { String::new() } else { format!("<w:rPr>{inner}</w:rPr>") };
    format!(
        "<w:style w:type=\"character\"{default}{custom} w:styleId=\"{id}\"><w:name w:val=\"{name}\"/>{based}{link}{props}</w:style>"
    )
}

fn word_language(tag: Option<&str>) -> String {
    let tag = tag.unwrap_or("en-US").trim();
    match tag.to_ascii_lowercase().as_str() {
        "en" => "en-US".into(),
        "nb" | "no" => "nb-NO".into(),
        "nn" => "nn-NO".into(),
        "de" => "de-DE".into(),
        "fr" => "fr-FR".into(),
        "es" => "es-ES".into(),
        "it" => "it-IT".into(),
        "el" => "el-GR".into(),
        "sv" => "sv-SE".into(),
        "da" => "da-DK".into(),
        "nl" => "nl-NL".into(),
        _ => tag.to_owned(),
    }
}

fn heading_styles(f: &DocumentFormat, body_line: i32) -> String {
    let mut out = String::new();
    for level in 1..=9usize {
        let h: HeadingLevel = f.heading(level);
        let p = Para {
            before: h.space_before.twips(),
            after: h.space_after.twips(),
            line: Some(line(1.0).max(body_line.min(line(1.15)))),
            align: Some(if h.align == Align::Justified { Align::Left } else { h.align }),
            left: if h.indent { f.text.indent.twips() } else { 0 },
            keep_next: true,
            outline: Some(level - 1),
            ..Default::default()
        };
        let r = Run { size: Some(h.size), bold: Some(h.bold), italic: Some(h.italic), case: h.case };
        out.push_str(&paragraph_style(
            &format!("Heading{level}"),
            &format!("heading {level}"),
            Some("Normal"),
            Some("FirstParagraph"),
            Some(&format!("Heading{level}Char")),
            &p,
            &r,
        ));
        out.push_str(&character_style(
            &format!("Heading{level}Char"),
            &format!("Heading {level} Char"),
            Some(&format!("Heading{level}")),
            r.xml().trim_start_matches("<w:rPr>").trim_end_matches("</w:rPr>"),
        ));
    }
    out
}

pub fn docx_styles(f: &DocumentFormat, language: Option<&str>) -> String {
    let font = xml(&family(f));
    let body_line = line(f.text.line_spacing);
    let indent = f.text.indent.twips();
    let (first_line, between) = match f.text.paragraphs {
        Paragraphs::Indent => (indent, 0),
        Paragraphs::Spaced => (0, f.text.space_between.twips()),
    };
    let quote_line = if f.quote.line_spacing > 0.0 { line(f.quote.line_spacing) } else { body_line };
    let bib_line = if f.bibliography.line_spacing > 0.0 { line(f.bibliography.line_spacing) } else { body_line };
    let none = || Run { size: None, bold: None, italic: None, case: Case::None };
    let t = &f.title;
    let title_align = Some(if t.align == Align::Justified { Align::Left } else { t.align });

    let mut s = String::new();
    s.push_str("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
    s.push_str("<w:styles xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\">");
    let _ = write!(
        s,
        "<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii=\"{font}\" w:hAnsi=\"{font}\" w:eastAsia=\"{font}\" w:cs=\"{font}\"/>\
         <w:sz w:val=\"{size}\"/><w:szCs w:val=\"{size}\"/><w:lang w:val=\"{lang}\" w:eastAsia=\"zh-CN\" w:bidi=\"ar-SA\"/></w:rPr></w:rPrDefault>\
         <w:pPrDefault><w:pPr><w:spacing w:before=\"0\" w:after=\"0\" w:line=\"{body_line}\" w:lineRule=\"auto\"/></w:pPr></w:pPrDefault></w:docDefaults>",
        size = half_points(f.font.size),
        lang = xml(&word_language(language)),
    );
    s.push_str("<w:latentStyles w:defLockedState=\"0\" w:defUIPriority=\"0\" w:defSemiHidden=\"0\" w:defUnhideWhenUsed=\"0\" w:defQFormat=\"0\" w:count=\"276\"/>");

    let body = Para { line: Some(body_line), align: Some(f.text.align), ..Default::default() };
    s.push_str(&paragraph_style("Normal", "Normal", None, None, None, &body, &none()));
    s.push_str(&paragraph_style(
        "BodyText",
        "Body Text",
        Some("Normal"),
        None,
        Some("BodyTextChar"),
        &Para {
            first: first_line,
            after: between,
            ..Para { line: Some(body_line), align: Some(f.text.align), ..Default::default() }
        },
        &none(),
    ));
    s.push_str(&paragraph_style(
        "FirstParagraph",
        "First Paragraph",
        Some("BodyText"),
        Some("BodyText"),
        None,
        &Para {
            first: if f.text.indent_first { first_line } else { 0 },
            after: between,
            line: Some(body_line),
            align: Some(f.text.align),
            ..Default::default()
        },
        &none(),
    ));
    s.push_str(&paragraph_style(
        "Compact",
        "Compact",
        Some("BodyText"),
        None,
        None,
        &Para { line: Some(body_line), align: Some(f.text.align), ..Default::default() },
        &none(),
    ));

    // The title block.
    let title_page = t.placement == crate::formats::TitlePlacement::OwnPage;
    s.push_str(&paragraph_style(
        "Title",
        "Title",
        Some("Normal"),
        Some("BodyText"),
        Some("TitleChar"),
        &Para {
            before: if title_page { 2400 } else { 0 },
            after: 240,
            line: Some(line(1.1)),
            align: title_align,
            keep_next: true,
            ..Default::default()
        },
        &Run { size: Some(t.size), bold: Some(t.bold), italic: Some(t.italic), case: t.case },
    ));
    s.push_str(&character_style(
        "TitleChar",
        "Title Char",
        Some("Title"),
        Run { size: Some(t.size), bold: Some(t.bold), italic: Some(t.italic), case: t.case }
            .xml()
            .trim_start_matches("<w:rPr>")
            .trim_end_matches("</w:rPr>"),
    ));
    s.push_str(&paragraph_style(
        "Subtitle",
        "Subtitle",
        Some("Title"),
        Some("BodyText"),
        Some("SubtitleChar"),
        &Para { after: 240, line: Some(line(1.1)), align: title_align, keep_next: true, ..Default::default() },
        &Run { size: Some((t.size * 0.8).max(f.font.size)), bold: Some(false), italic: Some(false), case: Case::None },
    ));
    s.push_str(&character_style("SubtitleChar", "Subtitle Char", Some("Subtitle"), ""));
    for (id, name) in [("Author", "Author"), ("Date", "Date")] {
        s.push_str(&paragraph_style(
            id,
            name,
            Some("Normal"),
            Some("BodyText"),
            None,
            &Para {
                before: 120,
                after: 120,
                line: Some(line(f.text.line_spacing.min(1.5))),
                align: title_align,
                keep_next: true,
                ..Default::default()
            },
            &none(),
        ));
    }
    s.push_str(&paragraph_style(
        "AbstractTitle",
        "Abstract Title",
        Some("Normal"),
        Some("Abstract"),
        None,
        &Para {
            before: 480,
            after: 120,
            line: Some(body_line),
            align: title_align,
            keep_next: true,
            ..Default::default()
        },
        &Run { size: None, bold: Some(true), italic: None, case: Case::None },
    ));
    s.push_str(&paragraph_style(
        "Abstract",
        "Abstract",
        Some("Normal"),
        Some("BodyText"),
        None,
        &Para { after: 240, line: Some(body_line), align: Some(f.text.align), ..Default::default() },
        &none(),
    ));

    // Figures and tables: the picture, where it stands; what is said of
    // them, as the format says, and at the side of what stands at a side.
    let picture_above = f.figures.caption_position == CaptionPosition::Above;
    for (id, name, to) in [
        ("Figure", "Figure", Align::Center),
        ("FigureLeft", "Figure Left", Align::Left),
        ("FigureRight", "Figure Right", Align::Right),
    ] {
        s.push_str(&paragraph_style(
            id,
            name,
            Some("Normal"),
            Some("BodyText"),
            None,
            &Para {
                before: if picture_above { 60 } else { 240 + between },
                after: if picture_above { 240 + between } else { 60 },
                line: Some(line(1.0)),
                align: Some(to),
                keep_next: !picture_above,
                ..Default::default()
            },
            &none(),
        ));
    }
    for (kind, c) in [("Figure", f.figures.captioned()), ("Table", f.tables.captioned())] {
        let caption_line = if c.caption_line_spacing > 0.0 { line(c.caption_line_spacing) } else { body_line };
        let above = c.caption_position == CaptionPosition::Above;
        for (side, to) in [("", c.caption_align), (" Left", Align::Left), (" Right", Align::Right)] {
            let name = format!("{kind} Caption{side}");
            s.push_str(&paragraph_style(
                &name.replace(' ', ""),
                &name,
                Some("Normal"),
                Some("BodyText"),
                None,
                &Para {
                    before: if above { 240 + between } else { 60 },
                    after: if above { 60 } else { 240 + between },
                    line: Some(caption_line),
                    align: Some(to),
                    keep_next: above,
                    ..Default::default()
                },
                &Run {
                    size: (c.caption_size > 0.0).then_some(c.caption_size),
                    bold: None,
                    italic: None,
                    case: Case::None,
                },
            ));
        }
    }
    // What stands in a table.
    let tables = &f.tables;
    s.push_str(&paragraph_style(
        "TableText",
        "Table Text",
        Some("Normal"),
        None,
        None,
        &Para {
            before: 20,
            after: 20,
            line: Some(if tables.line_spacing > 0.0 { line(tables.line_spacing) } else { body_line }),
            align: Some(Align::Left),
            ..Default::default()
        },
        &Run { size: (tables.size > 0.0).then_some(tables.size), bold: None, italic: None, case: Case::None },
    ));

    s.push_str(&paragraph_style(
        "Bibliography",
        "Bibliography",
        Some("Normal"),
        None,
        None,
        &Para {
            left: f.bibliography.hanging_indent.twips(),
            hanging: f.bibliography.hanging_indent.twips(),
            after: f.bibliography.entry_spacing.twips(),
            line: Some(bib_line),
            align: Some(Align::Left),
            ..Default::default()
        },
        &Run {
            size: (f.bibliography.size > 0.0).then_some(f.bibliography.size),
            bold: None,
            italic: None,
            case: Case::None,
        },
    ));

    s.push_str(&heading_styles(f, body_line));

    s.push_str(&paragraph_style(
        "BlockText",
        "Block Text",
        Some("Normal"),
        Some("BodyText"),
        None,
        &Para {
            before: 120 + between,
            after: 120 + between,
            left: f.quote.indent_left.twips(),
            right: f.quote.indent_right.twips(),
            line: Some(quote_line),
            align: Some(f.text.align),
            ..Default::default()
        },
        &Run {
            size: (f.quote.size > 0.0).then_some(f.quote.size),
            bold: None,
            italic: f.quote.italic.then_some(true),
            case: Case::None,
        },
    ));
    let note = Para { line: Some(line(f.notes.line_spacing)), align: Some(f.text.align), ..Default::default() };
    let note_run = || Run { size: Some(f.notes.size), bold: None, italic: None, case: Case::None };
    s.push_str(&paragraph_style("FootnoteText", "footnote text", Some("Normal"), None, None, &note, &note_run()));
    s.push_str(&paragraph_style(
        "FootnoteBlockText",
        "Footnote Block Text",
        Some("FootnoteText"),
        Some("FootnoteText"),
        None,
        &Para { left: f.quote.indent_left.twips(), line: Some(line(f.notes.line_spacing)), ..Default::default() },
        &note_run(),
    ));
    // Notes gathered at the end (see resources/pandoc/notes.lua).
    s.push_str(&paragraph_style(
        "Endnotes",
        "Endnotes",
        Some("Normal"),
        None,
        None,
        &Para {
            left: 360,
            hanging: 360,
            after: 60,
            line: Some(line(f.notes.line_spacing)),
            align: Some(Align::Left),
            ..Default::default()
        },
        &note_run(),
    ));

    for (id, name) in [
        ("DefinitionTerm", "Definition Term"),
        ("Definition", "Definition"),
        ("Caption", "caption"),
        ("ImageCaption", "Image Caption"),
        ("CaptionedFigure", "Captioned Figure"),
        ("TOCHeading", "TOC Heading"),
    ] {
        let run = match id {
            "DefinitionTerm" | "TOCHeading" => Run { size: None, bold: Some(true), italic: None, case: Case::None },
            "Caption" | "ImageCaption" => Run { size: None, bold: None, italic: Some(true), case: Case::None },
            _ => none(),
        };
        s.push_str(&paragraph_style(
            id,
            name,
            Some("Normal"),
            None,
            None,
            &Para {
                before: 60,
                after: 60,
                line: Some(line(f.text.line_spacing.min(1.5))),
                keep_next: id == "TOCHeading",
                ..Default::default()
            },
            &run,
        ));
    }

    s.push_str(&character_style("DefaultParagraphFont", "Default Paragraph Font", None, ""));
    s.push_str(&character_style("BodyTextChar", "Body Text Char", Some("BodyText"), ""));
    s.push_str(&character_style(
        "VerbatimChar",
        "Verbatim Char",
        None,
        "<w:rFonts w:ascii=\"Courier New\" w:hAnsi=\"Courier New\" w:cs=\"Courier New\"/>",
    ));
    s.push_str(&character_style("SectionNumber", "Section Number", None, ""));
    s.push_str(&character_style(
        "FootnoteReference",
        "footnote reference",
        None,
        "<w:vertAlign w:val=\"superscript\"/>",
    ));
    s.push_str(&character_style("Hyperlink", "Hyperlink", None, "<w:color w:val=\"1F4E79\"/>"));
    // The lines of a table: over it, under it and under its headings, as
    // books have them; around every cell; or none.
    let rule =
        |side: &str, size: u8| format!("<w:{side} w:val=\"single\" w:sz=\"{size}\" w:space=\"0\" w:color=\"auto\"/>");
    let (borders, under_headings) = match f.tables.rules {
        Rules::Horizontal => (format!("{}{}", rule("top", 8), rule("bottom", 8)), rule("bottom", 4)),
        Rules::Grid => (
            ["top", "left", "bottom", "right", "insideH", "insideV"].iter().map(|side| rule(side, 4)).collect(),
            rule("bottom", 4),
        ),
        Rules::None => (String::new(), String::new()),
    };
    let _ = write!(
        s,
        "<w:style w:type=\"table\" w:default=\"1\" w:styleId=\"Table\"><w:name w:val=\"Table\"/><w:semiHidden/><w:unhideWhenUsed/><w:qFormat/>\
         <w:tblPr><w:tblInd w:w=\"0\" w:type=\"dxa\"/><w:tblBorders>{borders}</w:tblBorders>\
         <w:tblCellMar><w:top w:w=\"30\" w:type=\"dxa\"/><w:left w:w=\"108\" w:type=\"dxa\"/><w:bottom w:w=\"30\" w:type=\"dxa\"/><w:right w:w=\"108\" w:type=\"dxa\"/></w:tblCellMar></w:tblPr>\
         <w:tblStylePr w:type=\"firstRow\"><w:tcPr><w:tcBorders>{under_headings}</w:tcBorders></w:tcPr></w:tblStylePr></w:style>"
    );
    // A table without lines, which holds what stands together: things
    // beside each other, and what the text flows around.
    s.push_str(
        "<w:style w:type=\"table\" w:customStyle=\"1\" w:styleId=\"Layout\"><w:name w:val=\"Layout\"/><w:qFormat/>\
         <w:tblPr><w:tblInd w:w=\"0\" w:type=\"dxa\"/><w:tblCellMar><w:top w:w=\"0\" w:type=\"dxa\"/><w:left w:w=\"57\" w:type=\"dxa\"/><w:bottom w:w=\"0\" w:type=\"dxa\"/><w:right w:w=\"57\" w:type=\"dxa\"/></w:tblCellMar></w:tblPr></w:style>",
    );
    s.push_str("</w:styles>");
    s
}

/// What stands in the margin at the top or the foot of the page.
struct Margin {
    left: Vec<Piece>,
    center: Vec<Piece>,
    right: Vec<Piece>,
}

enum Piece {
    Words(String),
    Number,
}

fn margins(f: &DocumentFormat, p: &Particulars) -> (Margin, Margin) {
    let mut top = Margin { left: vec![], center: vec![], right: vec![] };
    let mut foot = Margin { left: vec![], center: vec![], right: vec![] };
    let slot = |m: &mut Margin, a: Align, piece: Piece| match a {
        Align::Left | Align::Justified => m.left.push(piece),
        Align::Center => m.center.push(piece),
        Align::Right => m.right.push(piece),
    };
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
            slot(&mut top, f.running_head.align, Piece::Words(words.trim().to_owned()));
        }
    }
    if f.page_numbers.show {
        let pos = f.page_numbers.position;
        slot(if pos.is_top() { &mut top } else { &mut foot }, pos.align(), Piece::Number);
    }
    (top, foot)
}

impl Margin {
    fn is_empty(&self) -> bool {
        self.left.is_empty() && self.center.is_empty() && self.right.is_empty()
    }
}

fn docx_margin(kind: &str, m: &Margin, f: &DocumentFormat, with_number: bool) -> String {
    let (w, _) = f.page.dimensions();
    let text_width = ((w - f.page.margin_left.points() - f.page.margin_right.points()) * 20.0).round() as i32;
    let size = half_points(f.font.size);
    let run = |piece: &Piece| match piece {
        Piece::Words(t) => {
            format!("<w:r><w:rPr><w:sz w:val=\"{size}\"/></w:rPr><w:t xml:space=\"preserve\">{}</w:t></w:r>", xml(t))
        }
        Piece::Number if with_number => format!(
            "<w:r><w:rPr><w:sz w:val=\"{size}\"/></w:rPr><w:fldChar w:fldCharType=\"begin\"/></w:r>\
             <w:r><w:rPr><w:sz w:val=\"{size}\"/></w:rPr><w:instrText xml:space=\"preserve\"> PAGE </w:instrText></w:r>\
             <w:r><w:rPr><w:sz w:val=\"{size}\"/></w:rPr><w:fldChar w:fldCharType=\"separate\"/></w:r>\
             <w:r><w:rPr><w:sz w:val=\"{size}\"/></w:rPr><w:t>1</w:t></w:r>\
             <w:r><w:rPr><w:sz w:val=\"{size}\"/></w:rPr><w:fldChar w:fldCharType=\"end\"/></w:r>"
        ),
        Piece::Number => String::new(),
    };
    let group = |pieces: &Vec<Piece>| {
        pieces.iter().map(run).collect::<Vec<_>>().join("<w:r><w:t xml:space=\"preserve\">  </w:t></w:r>")
    };
    let tab = "<w:r><w:tab/></w:r>";
    format!(
        "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n\
         <w:{kind} xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">\
         <w:p><w:pPr><w:tabs><w:tab w:val=\"center\" w:pos=\"{c}\"/><w:tab w:val=\"right\" w:pos=\"{r}\"/></w:tabs>\
         <w:spacing w:before=\"0\" w:after=\"0\" w:line=\"240\" w:lineRule=\"auto\"/><w:ind w:left=\"0\" w:right=\"0\" w:firstLine=\"0\"/><w:jc w:val=\"left\"/></w:pPr>\
         {left}{tab}{center}{tab}{right}</w:p></w:{kind}>",
        c = text_width / 2,
        r = text_width,
        left = group(&m.left),
        center = group(&m.center),
        right = group(&m.right),
    )
}

/// The pattern for DOCX: Pandoc's own, with the styles and the page of the format.
pub fn docx(default: &[u8], f: &DocumentFormat, p: &Particulars) -> Result<Vec<u8>> {
    let (top, foot) = margins(f, p);
    let first_differs = f.page_numbers.show && !f.page_numbers.first_page;
    rewrite(default, |files| {
        put(files, "word/styles.xml", docx_styles(f, p.language.as_deref()));

        // Headers and footers, and their place in the list of parts.
        let mut relations = text_of(files, "word/_rels/document.xml.rels")?;
        let mut types = text_of(files, "[Content_Types].xml")?;
        let mut references = String::new();
        let mut add = |name: &str, kind: &str, which: &str, content: String, files: &mut Vec<(String, Vec<u8>)>| {
            let id = format!("rIdGk{}", name.replace('.', ""));
            put(files, &format!("word/{name}"), content);
            let relation = format!(
                "<Relationship Id=\"{id}\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/{kind}\" Target=\"{name}\"/>"
            );
            relations = relations.replace("</Relationships>", &format!("{relation}</Relationships>"));
            let part = format!(
                "<Override PartName=\"/word/{name}\" ContentType=\"application/vnd.openxmlformats-officedocument.wordprocessingml.{kind}+xml\"/>"
            );
            types = types.replace("</Types>", &format!("{part}</Types>"));
            let _ = write!(references, "<w:{kind}Reference w:type=\"{which}\" r:id=\"{id}\"/>");
        };
        if !top.is_empty() {
            add("header1.xml", "header", "default", docx_margin("hdr", &top, f, true), files);
            if first_differs {
                add("header2.xml", "header", "first", docx_margin("hdr", &top, f, false), files);
            }
        }
        if !foot.is_empty() {
            add("footer1.xml", "footer", "default", docx_margin("ftr", &foot, f, true), files);
            if first_differs {
                add("footer2.xml", "footer", "first", docx_margin("ftr", &foot, f, false), files);
            }
        }
        put(files, "word/_rels/document.xml.rels", relations);
        put(files, "[Content_Types].xml", types);

        // The page.
        let (w, h) = f.page.dimensions();
        let mut section = String::from("<w:sectPr>");
        section.push_str(&references);
        section.push_str(if p.lettered_footnotes {
            "<w:footnotePr><w:numFmt w:val=\"lowerLetter\"/><w:numRestart w:val=\"continuous\"/></w:footnotePr>"
        } else {
            "<w:footnotePr><w:numRestart w:val=\"continuous\"/></w:footnotePr>"
        });
        let _ = write!(
            section,
            "<w:pgSz w:w=\"{}\" w:h=\"{}\"/><w:pgMar w:top=\"{}\" w:right=\"{}\" w:bottom=\"{}\" w:left=\"{}\" w:header=\"{}\" w:footer=\"{}\" w:gutter=\"0\"/>",
            (w * 20.0).round() as i32,
            (h * 20.0).round() as i32,
            f.page.margin_top.twips(),
            f.page.margin_right.twips(),
            f.page.margin_bottom.twips(),
            f.page.margin_left.twips(),
            (f.page.margin_top.twips() / 2).max(360),
            (f.page.margin_bottom.twips() / 2).max(360),
        );
        if f.line_numbers {
            section.push_str("<w:lnNumType w:countBy=\"1\" w:restart=\"continuous\"/>");
        }
        if first_differs {
            section.push_str("<w:titlePg/>");
        }
        section.push_str("</w:sectPr>");

        let document = text_of(files, "word/document.xml")?;
        let start = document.rfind("<w:sectPr");
        let end = document.rfind("</w:sectPr>");
        let mut document = match (start, end) {
            (Some(a), Some(b)) if a < b => {
                format!("{}{}{}", &document[..a], section, &document[b + "</w:sectPr>".len()..])
            }
            _ => document.replace("</w:body>", &format!("{section}</w:body>")),
        };
        if !document.contains("xmlns:r=") {
            document = document.replacen(
                "<w:document ",
                "<w:document xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" ",
                1,
            );
        }
        put(files, "word/document.xml", document);
        Ok(())
    })
}

// =========================================================================
// ODT
// =========================================================================

fn inches(l: Length) -> String {
    format!("{:.4}in", l.points() / 72.0)
}

fn inches_pt(points: f32) -> String {
    format!("{:.4}in", points / 72.0)
}

fn percent(spacing: f32) -> String {
    // Writer counts single spacing as 100%.
    format!("{}%", (spacing * 100.0).round() as i32)
}

fn fo_align(a: Align) -> &'static str {
    match a {
        Align::Left => "start",
        Align::Center => "center",
        Align::Right => "end",
        Align::Justified => "justify",
    }
}

struct OdtStyle<'a> {
    name: &'a str,
    display: Option<&'a str>,
    parent: Option<&'a str>,
    next: Option<&'a str>,
    outline: Option<usize>,
    paragraph: String,
    text: String,
}

impl OdtStyle<'_> {
    fn xml(&self) -> String {
        let mut s = format!("<style:style style:name=\"{}\" style:family=\"paragraph\"", self.name);
        if let Some(d) = self.display {
            let _ = write!(s, " style:display-name=\"{d}\"");
        }
        if let Some(p) = self.parent {
            let _ = write!(s, " style:parent-style-name=\"{p}\"");
        }
        if let Some(n) = self.next {
            let _ = write!(s, " style:next-style-name=\"{n}\"");
        }
        if let Some(o) = self.outline {
            let _ = write!(s, " style:default-outline-level=\"{o}\"");
        }
        s.push_str(" style:class=\"text\">");
        if !self.paragraph.is_empty() {
            let _ = write!(s, "<style:paragraph-properties {}/>", self.paragraph);
        }
        if !self.text.is_empty() {
            let _ = write!(s, "<style:text-properties {}/>", self.text);
        }
        s.push_str("</style:style>");
        s
    }
}

fn odt_text(size: Option<f32>, bold: Option<bool>, italic: Option<bool>, case: Case) -> String {
    let mut s = String::new();
    if let Some(z) = size {
        let _ = write!(s, "fo:font-size=\"{z}pt\" style:font-size-asian=\"{z}pt\" style:font-size-complex=\"{z}pt\" ");
    }
    if let Some(b) = bold {
        let w = if b { "bold" } else { "normal" };
        let _ = write!(s, "fo:font-weight=\"{w}\" style:font-weight-asian=\"{w}\" style:font-weight-complex=\"{w}\" ");
    }
    if let Some(i) = italic {
        let w = if i { "italic" } else { "normal" };
        let _ = write!(s, "fo:font-style=\"{w}\" style:font-style-asian=\"{w}\" style:font-style-complex=\"{w}\" ");
    }
    match case {
        Case::Upper => s.push_str("fo:text-transform=\"uppercase\" "),
        Case::Smallcaps => s.push_str("fo:font-variant=\"small-caps\" "),
        Case::None => {}
    }
    s
}

#[allow(clippy::too_many_arguments)]
fn odt_paragraph(
    before: f32,
    after: f32,
    line: f32,
    align: Align,
    left: f32,
    right: f32,
    first: f32,
    keep: bool,
) -> String {
    let mut s = format!(
        "fo:margin-top=\"{}\" fo:margin-bottom=\"{}\" style:contextual-spacing=\"false\" fo:line-height=\"{}\" \
         fo:text-align=\"{}\" style:justify-single-word=\"false\" fo:margin-left=\"{}\" fo:margin-right=\"{}\" \
         fo:text-indent=\"{}\" style:auto-text-indent=\"false\" ",
        inches_pt(before),
        inches_pt(after),
        percent(line),
        fo_align(align),
        inches_pt(left),
        inches_pt(right),
        inches_pt(first),
    );
    if keep {
        s.push_str("fo:keep-with-next=\"always\" ");
    }
    s
}

/// Replaces the style of a name in the styles of the pattern, or adds it.
fn replace_style(styles: &mut String, name: &str, new: &str) {
    let open = format!("<style:style style:name=\"{name}\"");
    if let Some(start) = styles.find(&open) {
        // The end of the element: either it closes itself, or it has an end tag.
        let rest = &styles[start..];
        let head_end = rest.find('>').unwrap_or(rest.len() - 1);
        let end = if rest[..=head_end].ends_with("/>") {
            start + head_end + 1
        } else {
            match rest.find("</style:style>") {
                Some(e) => start + e + "</style:style>".len(),
                None => start + head_end + 1,
            }
        };
        styles.replace_range(start..end, new);
    } else if let Some(at) = styles.find("</office:styles>") {
        styles.insert_str(at, new);
    }
}

fn odt_margin(m: &Margin, with_number: bool) -> String {
    let piece = |p: &Piece| match p {
        Piece::Words(t) => xml(t),
        Piece::Number if with_number => {
            "<text:page-number text:select-page=\"current\">1</text:page-number>".to_owned()
        }
        Piece::Number => String::new(),
    };
    let group = |v: &Vec<Piece>| v.iter().map(piece).collect::<Vec<_>>().join("  ");
    format!(
        "<text:p text:style-name=\"GkMargin\">{}<text:tab/>{}<text:tab/>{}</text:p>",
        group(&m.left),
        group(&m.center),
        group(&m.right)
    )
}

pub fn odt_styles(default: &str, f: &DocumentFormat, p: &Particulars) -> String {
    let mut s = default.to_owned();
    let font = xml(&family(f));
    let size = f.font.size;
    let body = f.text.line_spacing;
    let indent = f.text.indent.points();
    let (first_line, between) = match f.text.paragraphs {
        Paragraphs::Indent => (indent, 0.0),
        Paragraphs::Spaced => (0.0, f.text.space_between.points()),
    };
    let lang = word_language(p.language.as_deref());
    let (language, country) = lang.split_once('-').unwrap_or((lang.as_str(), ""));

    // The font must be declared before it is named.
    let face = format!(
        "<style:font-face style:name=\"{font}\" svg:font-family=\"&apos;{font}&apos;\" style:font-family-generic=\"roman\" style:font-pitch=\"variable\"/>"
    );
    if let Some(at) = s.find("</office:font-face-decls>") {
        if !s.contains(&format!("style:font-face style:name=\"{font}\"")) {
            s.insert_str(at, &face);
        }
    } else if let Some(at) = s.find("<office:styles>") {
        s.insert_str(at, &format!("<office:font-face-decls>{face}</office:font-face-decls>"));
    }

    // What every paragraph begins from.
    let default_style = format!(
        "<style:default-style style:family=\"paragraph\"><style:paragraph-properties fo:hyphenation-ladder-count=\"no-limit\" \
         style:text-autospace=\"ideograph-alpha\" style:punctuation-wrap=\"hanging\" style:line-break=\"strict\" \
         style:tab-stop-distance=\"0.4925in\" style:writing-mode=\"page\" fo:line-height=\"{line}\"/>\
         <style:text-properties style:use-window-font-color=\"true\" style:font-name=\"{font}\" fo:font-size=\"{size}pt\" \
         fo:language=\"{language}\" fo:country=\"{country}\" style:letter-kerning=\"true\" style:font-name-asian=\"{font}\" \
         style:font-size-asian=\"{size}pt\" style:language-asian=\"zxx\" style:country-asian=\"none\" style:font-name-complex=\"{font}\" \
         style:font-size-complex=\"{size}pt\" style:language-complex=\"zxx\" style:country-complex=\"none\" fo:hyphenate=\"{hyphenate}\" \
         fo:hyphenation-remain-char-count=\"2\" fo:hyphenation-push-char-count=\"2\"/></style:default-style>",
        line = percent(body),
        hyphenate = f.text.hyphenate,
    );
    let open = "<style:default-style style:family=\"paragraph\"";
    if let Some(start) = s.find(open)
        && let Some(end) = s[start..].find("</style:default-style>")
    {
        s.replace_range(start..start + end + "</style:default-style>".len(), &default_style);
    }

    let mut put = |style: OdtStyle| {
        let name = style.name.to_owned();
        replace_style(&mut s, &name, &style.xml());
    };

    put(OdtStyle {
        name: "Text_20_body",
        display: Some("Text body"),
        parent: Some("Standard"),
        next: None,
        outline: None,
        paragraph: odt_paragraph(0.0, between, body, f.text.align, 0.0, 0.0, first_line, false),
        text: String::new(),
    });
    put(OdtStyle {
        name: "First_20_paragraph",
        display: Some("First paragraph"),
        parent: Some("Text_20_body"),
        next: Some("Text_20_body"),
        outline: None,
        paragraph: odt_paragraph(
            0.0,
            between,
            body,
            f.text.align,
            0.0,
            0.0,
            if f.text.indent_first { first_line } else { 0.0 },
            false,
        ),
        text: String::new(),
    });
    put(OdtStyle {
        name: "Heading",
        display: None,
        parent: Some("Standard"),
        next: Some("Text_20_body"),
        outline: None,
        paragraph: "fo:keep-with-next=\"always\" ".to_owned(),
        text: format!(
            "style:font-name=\"{font}\" style:font-name-asian=\"{font}\" style:font-name-complex=\"{font}\" "
        ),
    });
    for level in 1..=6usize {
        let h = f.heading(level);
        let name = format!("Heading_20_{level}");
        let display = format!("Heading {level}");
        put(OdtStyle {
            name: &name,
            display: Some(&display),
            parent: Some("Heading"),
            next: Some("First_20_paragraph"),
            outline: Some(level),
            paragraph: odt_paragraph(
                h.space_before.points(),
                h.space_after.points(),
                1.0,
                if h.align == Align::Justified { Align::Left } else { h.align },
                if h.indent { indent } else { 0.0 },
                0.0,
                0.0,
                true,
            ),
            text: odt_text(Some(h.size), Some(h.bold), Some(h.italic), h.case),
        });
    }
    let quote_line = if f.quote.line_spacing > 0.0 { f.quote.line_spacing } else { body };
    put(OdtStyle {
        name: "Quotations",
        display: None,
        parent: Some("Standard"),
        next: None,
        outline: None,
        paragraph: odt_paragraph(
            6.0 + between,
            6.0 + between,
            quote_line,
            f.text.align,
            f.quote.indent_left.points(),
            f.quote.indent_right.points(),
            0.0,
            false,
        ),
        text: odt_text((f.quote.size > 0.0).then_some(f.quote.size), None, f.quote.italic.then_some(true), Case::None),
    });
    put(OdtStyle {
        name: "Footnote",
        display: None,
        parent: Some("Standard"),
        next: None,
        outline: None,
        paragraph: format!(
            "{}text:number-lines=\"false\" text:line-number=\"0\" ",
            odt_paragraph(0.0, 0.0, f.notes.line_spacing, f.text.align, 14.0, 0.0, -14.0, false)
        ),
        text: odt_text(Some(f.notes.size), None, None, Case::None),
    });
    put(OdtStyle {
        name: "Endnotes",
        display: None,
        parent: Some("Standard"),
        next: None,
        outline: None,
        paragraph: odt_paragraph(0.0, 3.0, f.notes.line_spacing, Align::Left, 18.0, 0.0, -18.0, false),
        text: odt_text(Some(f.notes.size), None, None, Case::None),
    });
    let bib_line = if f.bibliography.line_spacing > 0.0 { f.bibliography.line_spacing } else { body };
    let hang = f.bibliography.hanging_indent.points();
    put(OdtStyle {
        name: "Bibliography",
        display: None,
        parent: Some("Standard"),
        next: None,
        outline: None,
        paragraph: odt_paragraph(
            0.0,
            f.bibliography.entry_spacing.points(),
            bib_line,
            Align::Left,
            hang,
            0.0,
            -hang,
            false,
        ),
        text: odt_text((f.bibliography.size > 0.0).then_some(f.bibliography.size), None, None, Case::None),
    });

    let t = &f.title;
    let title_align = if t.align == Align::Justified { Align::Left } else { t.align };
    let own_page = t.placement == crate::formats::TitlePlacement::OwnPage;
    put(OdtStyle {
        name: "Title",
        display: None,
        parent: Some("Heading"),
        next: Some("Subtitle"),
        outline: None,
        paragraph: odt_paragraph(if own_page { 120.0 } else { 0.0 }, 12.0, 1.1, title_align, 0.0, 0.0, 0.0, true),
        text: odt_text(Some(t.size), Some(t.bold), Some(t.italic), t.case),
    });
    put(OdtStyle {
        name: "Subtitle",
        display: None,
        parent: Some("Heading"),
        next: Some("Text_20_body"),
        outline: None,
        paragraph: odt_paragraph(0.0, 12.0, 1.1, title_align, 0.0, 0.0, 0.0, true),
        text: odt_text(Some((t.size * 0.8).max(size)), Some(false), Some(false), Case::None),
    });
    for name in ["Author", "Date"] {
        put(OdtStyle {
            name,
            display: None,
            parent: Some("Standard"),
            next: None,
            outline: None,
            paragraph: odt_paragraph(6.0, 6.0, body.min(1.5), title_align, 0.0, 0.0, 0.0, false),
            text: String::new(),
        });
    }
    put(OdtStyle {
        name: "AbstractTitle",
        display: None,
        parent: Some("Standard"),
        next: Some("Abstract"),
        outline: None,
        paragraph: odt_paragraph(24.0, 6.0, body, title_align, 0.0, 0.0, 0.0, true),
        text: odt_text(None, Some(true), None, Case::None),
    });
    put(OdtStyle {
        name: "Abstract",
        display: None,
        parent: Some("Standard"),
        next: None,
        outline: None,
        paragraph: odt_paragraph(12.0, 12.0, body, f.text.align, 0.0, 0.0, 0.0, false),
        text: String::new(),
    });

    // Figures and tables: as in the pattern for Word.
    let picture_above = f.figures.caption_position == CaptionPosition::Above;
    let (near, far) = (3.0, 12.0 + between);
    for (name, display, to) in [
        ("Figure", None, Align::Center),
        ("Figure_20_Left", Some("Figure Left"), Align::Left),
        ("Figure_20_Right", Some("Figure Right"), Align::Right),
    ] {
        put(OdtStyle {
            name,
            display,
            parent: Some("Standard"),
            next: None,
            outline: None,
            paragraph: odt_paragraph(
                if picture_above { near } else { far },
                if picture_above { far } else { near },
                1.0,
                to,
                0.0,
                0.0,
                0.0,
                !picture_above,
            ),
            text: String::new(),
        });
    }
    for (kind, c) in [("Figure", f.figures.captioned()), ("Table", f.tables.captioned())] {
        let caption_line = if c.caption_line_spacing > 0.0 { c.caption_line_spacing } else { body };
        let above = c.caption_position == CaptionPosition::Above;
        for (side, to) in [("", c.caption_align), (" Left", Align::Left), (" Right", Align::Right)] {
            let display = format!("{kind} Caption{side}");
            let name = display.replace(' ', "_20_");
            put(OdtStyle {
                name: &name,
                display: Some(&display),
                parent: Some("Standard"),
                next: None,
                outline: None,
                paragraph: odt_paragraph(
                    if above { far } else { near },
                    if above { near } else { far },
                    caption_line,
                    to,
                    0.0,
                    0.0,
                    0.0,
                    above,
                ),
                text: odt_text((c.caption_size > 0.0).then_some(c.caption_size), None, None, Case::None),
            });
        }
    }
    // What stands in a table, and its headings.
    let tables = &f.tables;
    let table_line = if tables.line_spacing > 0.0 { tables.line_spacing } else { body };
    let table_size = (tables.size > 0.0).then_some(tables.size);
    put(OdtStyle {
        name: "Table_20_Contents",
        display: Some("Table Contents"),
        parent: Some("Standard"),
        next: None,
        outline: None,
        paragraph: odt_paragraph(1.0, 1.0, table_line, Align::Left, 0.0, 0.0, 0.0, false),
        text: odt_text(table_size, None, None, Case::None),
    });
    put(OdtStyle {
        name: "Table_20_Heading",
        display: Some("Table Heading"),
        parent: Some("Table_20_Contents"),
        next: None,
        outline: None,
        paragraph: odt_paragraph(1.0, 1.0, table_line, Align::Left, 0.0, 0.0, 0.0, false),
        text: odt_text(table_size, Some(false), None, Case::None),
    });
    // A paragraph that takes no room, for what is fastened to it.
    put(OdtStyle {
        name: "GkAnchor",
        display: None,
        parent: Some("Standard"),
        next: None,
        outline: None,
        paragraph: "fo:margin-top=\"0in\" fo:margin-bottom=\"0in\" fo:line-height=\"0.02in\" fo:text-indent=\"0in\" "
            .to_owned(),
        text: "fo:font-size=\"2pt\" style:font-size-asian=\"2pt\" style:font-size-complex=\"2pt\" ".to_owned(),
    });
    // The room after a table.
    put(OdtStyle {
        name: "GkAfterTable",
        display: None,
        parent: Some("Standard"),
        next: None,
        outline: None,
        paragraph: "fo:margin-top=\"0in\" fo:margin-bottom=\"0in\" fo:line-height=\"0.14in\" fo:text-indent=\"0in\" "
            .to_owned(),
        text: "fo:font-size=\"2pt\" style:font-size-asian=\"2pt\" style:font-size-complex=\"2pt\" ".to_owned(),
    });
    // What the text flows around: a frame at the side of the text.
    for (name, side, clear) in [("GkAroundLeft", "left", "right"), ("GkAroundRight", "right", "left")] {
        replace_style(
            &mut s,
            name,
            &format!(
                "<style:style style:name=\"{name}\" style:family=\"graphic\"><style:graphic-properties \
                 style:wrap=\"parallel\" style:number-wrapped-paragraphs=\"no-limit\" style:wrap-contour=\"false\" \
                 style:vertical-pos=\"top\" style:vertical-rel=\"paragraph\" style:horizontal-pos=\"{side}\" \
                 style:horizontal-rel=\"paragraph\" fo:margin-{clear}=\"0.17in\" fo:margin-{side}=\"0in\" \
                 fo:margin-top=\"0.04in\" fo:margin-bottom=\"0.08in\" fo:padding=\"0in\" fo:border=\"none\" \
                 draw:fill=\"none\" style:shadow=\"none\"/></style:style>"
            ),
        );
    }

    // The page, and what stands in its margins.
    let (w, h) = f.page.dimensions();
    let (top, foot) = margins(f, p);
    let text_width = w - f.page.margin_left.points() - f.page.margin_right.points();
    let margin_style = format!(
        "<style:style style:name=\"GkMargin\" style:family=\"paragraph\" style:parent-style-name=\"Standard\">\
         <style:paragraph-properties fo:text-align=\"start\" fo:text-indent=\"0in\" fo:line-height=\"100%\">\
         <style:tab-stops><style:tab-stop style:position=\"{}\" style:type=\"center\"/><style:tab-stop style:position=\"{}\" style:type=\"right\"/></style:tab-stops>\
         </style:paragraph-properties><style:text-properties fo:font-size=\"{size}pt\"/></style:style>",
        inches_pt(text_width / 2.0),
        inches_pt(text_width),
    );
    let head_style = |present: bool, which: &str| {
        if present {
            format!(
                "<style:{which}-style><style:header-footer-properties fo:min-height=\"0.3in\" fo:margin-left=\"0in\" fo:margin-right=\"0in\" \
                 fo:margin-{side}=\"0.15in\" style:dynamic-spacing=\"false\"/></style:{which}-style>",
                side = if which == "header" { "bottom" } else { "top" }
            )
        } else {
            format!("<style:{which}-style/>")
        }
    };
    let layout = |name: &str, header: bool, footer: bool| {
        // The margins of the page hold the header and footer; their room is taken from them.
        let top_margin = (f.page.margin_top.points() - if header { 32.0 } else { 0.0 }).max(18.0);
        let bottom_margin = (f.page.margin_bottom.points() - if footer { 32.0 } else { 0.0 }).max(18.0);
        format!(
            "<style:page-layout style:name=\"{name}\"><style:page-layout-properties fo:page-width=\"{}\" fo:page-height=\"{}\" \
             style:num-format=\"1\" style:print-orientation=\"portrait\" fo:margin-top=\"{}\" fo:margin-bottom=\"{}\" \
             fo:margin-left=\"{}\" fo:margin-right=\"{}\" style:writing-mode=\"lr-tb\" style:footnote-max-height=\"0in\">\
             <style:footnote-sep style:width=\"0.0071in\" style:distance-before-sep=\"0.0398in\" style:distance-after-sep=\"0.0398in\" \
             style:line-style=\"solid\" style:adjustment=\"left\" style:rel-width=\"25%\" style:color=\"#000000\"/>\
             </style:page-layout-properties>{}{}</style:page-layout>",
            inches_pt(w),
            inches_pt(h),
            inches_pt(top_margin),
            inches_pt(bottom_margin),
            inches(f.page.margin_left),
            inches(f.page.margin_right),
            head_style(header, "header"),
            head_style(footer, "footer"),
        )
    };
    let first_differs = f.page_numbers.show && !f.page_numbers.first_page;
    let automatic = format!(
        "<office:automatic-styles>{margin_style}{}{}</office:automatic-styles>",
        layout("Mpm1", !top.is_empty(), !foot.is_empty()),
        if first_differs { layout("Mpm2", !top.is_empty(), !foot.is_empty()) } else { String::new() },
    );
    let page = |name: &str, layout: &str, next: Option<&str>, with_number: bool| {
        let mut m = format!("<style:master-page style:name=\"{name}\" style:page-layout-name=\"{layout}\"");
        if let Some(n) = next {
            let _ = write!(m, " style:next-style-name=\"{n}\"");
        }
        m.push('>');
        if !top.is_empty() {
            let _ = write!(m, "<style:header>{}</style:header>", odt_margin(&top, with_number));
        }
        if !foot.is_empty() {
            let _ = write!(m, "<style:footer>{}</style:footer>", odt_margin(&foot, with_number));
        }
        m.push_str("</style:master-page>");
        m
    };
    let master = if first_differs {
        // The first page is of its own kind, and is followed by the usual one.
        format!(
            "<office:master-styles>{}{}</office:master-styles>",
            page("Standard", "Mpm2", Some("Following"), false),
            page("Following", "Mpm1", None, true)
        )
    } else {
        format!("<office:master-styles>{}</office:master-styles>", page("Standard", "Mpm1", None, true))
    };
    for (open, close, new) in [
        ("<office:automatic-styles>", "</office:automatic-styles>", automatic),
        ("<office:master-styles>", "</office:master-styles>", master),
    ] {
        if let (Some(a), Some(b)) = (s.find(open), s.find(close))
            && a < b
        {
            s.replace_range(a..b + close.len(), &new);
        }
    }
    if f.line_numbers {
        let numbering = "<text:linenumbering-configuration text:number-lines=\"true\" text:offset=\"0.1965in\" style:num-format=\"1\" text:number-position=\"left\" text:increment=\"1\"/>";
        if let Some(a) = s.find("<text:linenumbering-configuration") {
            if let Some(b) = s[a..].find("/>") {
                s.replace_range(a..a + b + 2, numbering);
            }
        } else if let Some(at) = s.find("</office:styles>") {
            s.insert_str(at, numbering);
        }
    }
    s
}

/// The pattern for ODT.
/// Has the notes at the foot of the page lettered: see `Particulars`.
fn odt_lettered_footnotes(styles: &str) -> String {
    // The settings for the notes at the foot, wherever among its attributes it says that it is that.
    let mut from = 0;
    while let Some(found) = styles[from..].find("<text:notes-configuration") {
        let at = from + found;
        let Some(len) = styles[at..].find('>') else { break };
        let tag = &styles[at..at + len + 1];
        if tag.contains("text:note-class=\"footnote\"") {
            let lettered = match tag.find("style:num-format=\"") {
                Some(n) => {
                    let value = n + "style:num-format=\"".len();
                    let end = tag[value..].find('"').map(|e| value + e).unwrap_or(value);
                    format!("{}a{}", &tag[..value], &tag[end..])
                }
                None => {
                    tag.replacen("<text:notes-configuration", "<text:notes-configuration style:num-format=\"a\"", 1)
                }
            };
            return format!("{}{}{}", &styles[..at], lettered, &styles[at + len + 1..]);
        }
        from = at + len + 1;
    }
    const LETTERED: &str = "<text:notes-configuration text:note-class=\"footnote\" style:num-format=\"a\" text:start-numbering-at=\"document\" text:footnotes-position=\"page\"/>";
    match styles.find("</office:styles>") {
        Some(at) => format!("{}{}{}", &styles[..at], LETTERED, &styles[at..]),
        None => styles.to_owned(),
    }
}

pub fn odt(default: &[u8], f: &DocumentFormat, p: &Particulars) -> Result<Vec<u8>> {
    rewrite(default, |files| {
        let styles = text_of(files, "styles.xml")?;
        let styles = odt_styles(&styles, f, p);
        let styles = if p.lettered_footnotes { odt_lettered_footnotes(&styles) } else { styles };
        put(files, "styles.xml", styles);
        Ok(())
    })
}

/// Whether the format has notes at the end.
pub fn endnotes(f: &DocumentFormat) -> bool {
    f.notes.kind == NoteKind::Endnotes
}

/// Fonts that may be used when the one the format names is missing, for
/// telling the user which was used.
pub fn substitute(f: &DocumentFormat, installed: &[String]) -> Option<String> {
    let has = |name: &str| installed.iter().any(|i| i.eq_ignore_ascii_case(name));
    if installed.is_empty() || has(&f.font.family) {
        return None;
    }
    fallbacks(&f.font.family).into_iter().find(|c| has(c)).map(str::to_owned)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn format() -> DocumentFormat {
        let mut f = DocumentFormat { name: "Test".into(), ..Default::default() };
        f.page.size = "letter".into();
        f.page.margin_left = Length::inch(1.0);
        f.page.margin_right = Length::inch(1.0);
        f.page_numbers.position = crate::formats::Position::TopRight;
        f.page_numbers.first_page = false;
        f.running_head.content = HeadContent::Title;
        f.running_head.align = Align::Left;
        f.running_head.case = Case::Upper;
        f
    }

    fn particulars() -> Particulars {
        Particulars {
            title: "Wrath & the hero".into(),
            authors: vec!["A. Scholar".into()],
            language: Some("en-GB".into()),
            ..Default::default()
        }
    }

    #[test]
    fn the_styles_of_word_are_well_formed_and_say_what_the_format_says() {
        let f = format();
        let styles = docx_styles(&f, Some("nb"));
        roxmltree::Document::parse(&styles).unwrap();
        assert!(styles.contains("w:ascii=\"Times New Roman\""));
        assert!(styles.contains("<w:lang w:val=\"nb-NO\""));
        assert!(styles.contains("w:line=\"480\""), "double spacing");
        // The first line of a paragraph is indented by half an inch: 720 twentieths of a point.
        assert!(styles.contains("w:styleId=\"BodyText\""));
        assert!(styles.contains("w:firstLine=\"720\""));
        for id in [
            "Normal",
            "FirstParagraph",
            "Title",
            "Author",
            "Abstract",
            "Bibliography",
            "Heading1",
            "Heading6",
            "BlockText",
            "FootnoteText",
            "Hyperlink",
        ] {
            assert!(styles.contains(&format!("w:styleId=\"{id}\"")), "{id}");
        }
    }

    #[test]
    fn the_margins_of_the_page() {
        let f = format();
        let (top, foot) = margins(&f, &particulars());
        assert!(foot.is_empty());
        let header = docx_margin("hdr", &top, &f, true);
        roxmltree::Document::parse(&header).unwrap();
        assert!(header.contains("WRATH &amp; THE HERO"));
        assert!(header.contains(" PAGE "));
        assert!(header.contains("w:pos=\"9360\""), "the text is six and a half inches wide");
        assert!(!docx_margin("hdr", &top, &f, false).contains(" PAGE "));

        let mut anonymous = format();
        anonymous.title.anonymous = true;
        anonymous.running_head.content = HeadContent::AuthorTitle;
        let (top, _) = margins(&anonymous, &particulars());
        assert!(!docx_margin("hdr", &top, &anonymous, true).contains("Scholar"));
    }

    #[test]
    fn replacing_styles_in_the_pattern_of_writer() {
        let mut s = String::from(
            "<office:styles><style:style style:name=\"Standard\" style:family=\"paragraph\" style:class=\"text\" />\
             <style:style style:name=\"Quotations\" style:family=\"paragraph\"><style:paragraph-properties fo:margin-left=\"1in\"/></style:style>\
             </office:styles>",
        );
        replace_style(&mut s, "Quotations", "<style:style style:name=\"Quotations\" new=\"1\"/>");
        replace_style(&mut s, "Standard", "<style:style style:name=\"Standard\" new=\"2\"/>");
        replace_style(&mut s, "Bibliography", "<style:style style:name=\"Bibliography\" new=\"3\"/>");
        assert_eq!(
            s,
            "<office:styles><style:style style:name=\"Standard\" new=\"2\"/>\
             <style:style style:name=\"Quotations\" new=\"1\"/>\
             <style:style style:name=\"Bibliography\" new=\"3\"/></office:styles>"
        );
    }

    #[test]
    fn a_font_that_is_missing() {
        let f = format();
        let installed = vec!["Liberation Serif".to_owned(), "DejaVu Sans".to_owned()];
        assert_eq!(substitute(&f, &installed).as_deref(), Some("Liberation Serif"));
        assert_eq!(substitute(&f, &["times new roman".to_owned()]), None);
        assert_eq!(substitute(&f, &[]), None);
    }
}
