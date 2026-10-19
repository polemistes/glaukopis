//! What is set right in a document for a word processor after Pandoc has
//! written it.
//!
//! Pandoc sets every table and every equation in the middle, and gives a
//! table of Writer no lines. Where that is not what is wanted, what it
//! writes is marked (`document/placing.rs`) with a remark in the XML, such
//! as `<!--gk:table stand=left within=false-->`, which says of what follows
//! what is to be known; here the remark is read, what follows is set right,
//! and the remark is removed.

use crate::error::Result;
use crate::formats::{DocumentFormat, Rules};

use super::reference::{self, put, rewrite, text_of, xml};
use std::fmt::Write as _;

/// What a file of Word or Writer says of itself outside its pages: its
/// title and who made it. Pandoc is given neither for these, so that it
/// sets no title block of its own at the head of the document (the core
/// writes the title page where the template puts it, ADR 0055); they are
/// written into the file's properties here instead.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct Properties {
    pub title: String,
    pub creators: Vec<String>,
}

/// An element of the properties given a text: where Pandoc wrote it empty,
/// or wrote it as an empty element, or did not write it at all, in which
/// case it is put before `close`. One that holds a text of its own is left.
fn property(xml_text: &str, tag: &str, value: &str, close: &str) -> String {
    let value = value.trim();
    if value.is_empty() {
        return xml_text.to_owned();
    }
    let (open, end, empty) = (format!("<{tag}>"), format!("</{tag}>"), format!("<{tag}/>"));
    let text = xml(value);
    if let Some(start) = xml_text.find(&open) {
        let inner = start + open.len();
        if let Some(stop) = xml_text[inner..].find(&end).map(|e| inner + e) {
            if xml_text[inner..stop].trim().is_empty() {
                return format!("{}{text}{}", &xml_text[..inner], &xml_text[stop..]);
            }
            return xml_text.to_owned();
        }
    }
    if xml_text.contains(&empty) {
        return xml_text.replacen(&empty, &format!("{open}{text}{end}"), 1);
    }
    match xml_text.rfind(close) {
        Some(at) => format!("{}{open}{text}{end}{}", &xml_text[..at], &xml_text[at..]),
        None => xml_text.to_owned(),
    }
}

/// The lists Pandoc makes, the contents and the lists of figures and of
/// tables, moved from the head of the document, where Pandoc puts them, to
/// where the template places them, which the core marked (`<!--gk:toc-->`,
/// `<!--gk:lof-->`, `<!--gk:lot-->`). A list without its mark stays where
/// Pandoc put it; a mark without its list goes. `found` are the lists as
/// they stand, by name, with where each begins and ends.
fn placed_lists(text: &str, mut found: Vec<(&'static str, usize, usize)>) -> String {
    found.sort_by_key(|(_, start, _)| *start);
    let mut out = text.to_owned();
    let mut lists: Vec<(&str, String)> = Vec::new();
    // From the last, so that where the others stand does not move.
    for (name, start, end) in found.into_iter().rev() {
        if !out.contains(&format!("<!--gk:{name}-->")) {
            continue;
        }
        lists.push((name, out[start..end].to_owned()));
        out.replace_range(start..end, "");
    }
    for (name, list) in lists {
        out = out.replacen(&format!("<!--gk:{name}-->"), &list, 1);
    }
    for name in ["toc", "lof", "lot"] {
        out = out.replace(&format!("<!--gk:{name}-->"), "");
    }
    out
}

/// The lists of a document of Word: each a block of content of its own
/// (`w:sdt`), told apart by the field it holds.
pub fn docx_lists(xml: &str) -> String {
    let mut found = Vec::new();
    let mut at = 0;
    while let Some(start) = xml[at..].find("<w:sdt>").map(|i| at + i) {
        let Some(end) = xml[start..].find("</w:sdt>").map(|i| start + i + "</w:sdt>".len()) else { break };
        let block = &xml[start..end];
        let name = if block.contains("Image Caption") {
            Some("lof")
        } else if block.contains("Table Caption") {
            Some("lot")
        } else if block.contains("TOC \\o") {
            Some("toc")
        } else {
            None
        };
        if let Some(name) = name {
            found.push((name, start, end));
        }
        at = end;
    }
    placed_lists(xml, found)
}

/// The lists of a document of Writer: each an element of its own.
pub fn odt_lists(xml: &str) -> String {
    let mut found = Vec::new();
    for (name, tag) in
        [("toc", "text:table-of-content"), ("lof", "text:illustration-index"), ("lot", "text:table-index")]
    {
        let (open, close) = (format!("<{tag}"), format!("</{tag}>"));
        // The element itself, not one whose name begins as its does (`…-source`).
        let start = xml
            .match_indices(&open)
            .map(|(i, _)| i)
            .find(|&i| matches!(xml.as_bytes().get(i + open.len()), Some(b' ' | b'>' | b'/')));
        if let Some(start) = start
            && let Some(end) = xml[start..].find(&close).map(|i| start + i + close.len())
        {
            found.push((name, start, end));
        }
    }
    placed_lists(xml, found)
}

/// The contents of a page of the web, which Pandoc writes as a `nav` at the head of the body.
pub fn html_lists(html: &str) -> String {
    let mut found = Vec::new();
    if let Some(start) = html.find("<nav id=\"TOC\"")
        && let Some(end) = html[start..].find("</nav>").map(|i| start + i + "</nav>".len())
    {
        found.push(("toc", start, end));
    }
    placed_lists(html, found)
}

/// The properties of a document of Word (`docProps/core.xml`) with its title and its makers.
pub fn docx_properties(core: &str, p: &Properties) -> String {
    let close = "</cp:coreProperties>";
    let core = property(core, "dc:title", &p.title, close);
    property(&core, "dc:creator", &p.creators.join("; "), close)
}

/// The properties of a document of Writer (`meta.xml`) with its title and its makers.
pub fn odt_properties(meta: &str, p: &Properties) -> String {
    let close = "</office:meta>";
    let creators = p.creators.join("; ");
    let meta = property(meta, "dc:title", &p.title, close);
    let meta = property(&meta, "meta:initial-creator", &creators, close);
    property(&meta, "dc:creator", &creators, close)
}

/// A remark, and where it ends.
struct Remark<'a> {
    start: usize,
    end: usize,
    what: &'a str,
    said: &'a str,
}

fn next_remark(xml: &str, from: usize) -> Option<Remark<'_>> {
    let start = from + xml[from..].find("<!--gk:")?;
    let end = start + xml[start..].find("-->")? + 3;
    let inner = &xml[start + 7..end - 3];
    let (what, said) = inner.split_once(' ').unwrap_or((inner, ""));
    Some(Remark { start, end, what, said })
}

/// What a remark says of something, as `stand=left`.
fn said<'a>(remark: &'a str, of: &str) -> Option<&'a str> {
    remark.split_whitespace().find_map(|part| part.strip_prefix(of)?.strip_prefix('='))
}

fn side(remark: &str, within: bool) -> &'static str {
    match said(remark, "stand") {
        _ if within => "center",
        Some("left") => "left",
        Some("right") => "right",
        _ => "center",
    }
}

/// The document of Word, with its tables and equations where they stand.
pub fn docx_document(xml: &str) -> String {
    let mut out = String::with_capacity(xml.len());
    let mut at = 0;
    while let Some(remark) = next_remark(xml, at) {
        out.push_str(&xml[at..remark.start]);
        at = remark.end;
        let within = said(remark.said, "within") == Some("true");
        let to = side(remark.said, within);
        let rest = &xml[at..];
        match remark.what {
            "table" => {
                // Of the table that follows: where it stands is said after how wide it is.
                let Some(open) = rest.find("<w:tblPr>") else { continue };
                let Some(close) = rest[open..].find("</w:tblPr>").map(|c| open + c) else { continue };
                let inner = &rest[open..close];
                let put_at = match inner.find("<w:tblW ") {
                    Some(w) => open + w + inner[w..].find("/>").map(|e| e + 2).unwrap_or(0),
                    None => open + "<w:tblPr>".len(),
                };
                out.push_str(&rest[..put_at]);
                out.push_str(&format!("<w:jc w:val=\"{to}\"/>"));
                at += put_at;
            }
            "equation" => {
                let Some(found) = rest.find("<m:jc m:val=\"center\"") else { continue };
                out.push_str(&rest[..found]);
                out.push_str(&format!("<m:jc m:val=\"{to}\""));
                at += found + "<m:jc m:val=\"center\"".len();
            }
            _ => {}
        }
    }
    out.push_str(&xml[at..]);
    in_tables(&out)
}

/// What stands in a table is set as the format has tables, and not as it
/// has lists, whose style Pandoc gives it.
fn in_tables(xml: &str) -> String {
    let mut out = String::with_capacity(xml.len());
    let mut depth = 0usize;
    let mut at = 0;
    loop {
        let open = xml[at..].find("<w:tbl>").map(|i| at + i);
        let close = xml[at..].find("</w:tbl>").map(|i| at + i);
        let (next, opens) = match (open, close) {
            (Some(o), Some(c)) if o < c => (o, true),
            (_, Some(c)) => (c, false),
            (Some(o), None) => (o, true),
            (None, None) => break,
        };
        let piece = &xml[at..next];
        if depth > 0 {
            out.push_str(&piece.replace("<w:pStyle w:val=\"Compact\" />", "<w:pStyle w:val=\"TableText\" />"));
        } else {
            out.push_str(piece);
        }
        if opens {
            depth += 1;
            out.push_str("<w:tbl>");
            at = next + "<w:tbl>".len();
        } else {
            depth = depth.saturating_sub(1);
            out.push_str("</w:tbl>");
            at = next + "</w:tbl>".len();
        }
    }
    out.push_str(&xml[at..]);
    out
}

/// The styles that Writer is given with the text: of the lines of tables,
/// of what holds things beside each other, of equations at a side.
fn odt_styles(format: &DocumentFormat) -> String {
    let line = |width: &str| format!("{width} solid #000000");
    let (top, under, between, side) = match format.tables.rules {
        Rules::Horizontal => (line("0.0104in"), line("0.0069in"), "none".to_owned(), "none".to_owned()),
        Rules::Grid => (line("0.0069in"), line("0.0069in"), line("0.0069in"), line("0.0069in")),
        Rules::None => ("none".to_owned(), "none".to_owned(), "none".to_owned(), "none".to_owned()),
    };
    let cell = |name: &str, over: &str, below: &str| {
        format!(
            "<style:style style:name=\"{name}\" style:family=\"table-cell\"><style:table-cell-properties \
             fo:padding-top=\"0.03in\" fo:padding-bottom=\"0.03in\" fo:padding-left=\"0.06in\" fo:padding-right=\"0.06in\" \
             fo:border-top=\"{over}\" fo:border-bottom=\"{below}\" fo:border-left=\"{side}\" fo:border-right=\"{side}\"/>\
             </style:style>"
        )
    };
    let mut s = String::new();
    // A cell among others; the headings; the first row where there are no headings; the last; one row alone.
    s.push_str(&cell("GkCell", &between, &between));
    s.push_str(&cell("GkCellHead", &top, &under));
    s.push_str(&cell("GkCellFirst", &top, &between));
    s.push_str(&cell("GkCellLast", &between, &top));
    s.push_str(&cell("GkCellOnly", &top, &top));
    s.push_str(
        "<style:style style:name=\"GkRow\" style:family=\"table\"><style:table-properties style:rel-width=\"100%\" \
         table:align=\"center\" fo:margin-top=\"0.17in\" fo:margin-bottom=\"0.17in\" style:may-break-between-rows=\"false\"/>\
         </style:style>\
         <style:style style:name=\"GkRowColumn\" style:family=\"table-column\"><style:table-column-properties \
         style:rel-column-width=\"1*\"/></style:style>\
         <style:style style:name=\"GkRowRow\" style:family=\"table-row\"><style:table-row-properties \
         fo:keep-together=\"always\"/></style:style>",
    );
    for (name, foot) in [("GkRowCellTop", "top"), ("GkRowCellBottom", "bottom")] {
        s.push_str(&format!(
            "<style:style style:name=\"{name}\" style:family=\"table-cell\"><style:table-cell-properties \
             style:vertical-align=\"{foot}\" fo:padding=\"0.04in\" fo:border=\"none\"/></style:style>"
        ));
    }
    for (name, to) in [("GkFormulaLeft", "left"), ("GkFormulaRight", "right")] {
        s.push_str(&format!(
            "<style:style style:name=\"{name}\" style:family=\"graphic\" style:parent-style-name=\"Formula\">\
             <style:graphic-properties style:vertical-pos=\"middle\" style:vertical-rel=\"text\" \
             style:horizontal-pos=\"{to}\" style:horizontal-rel=\"paragraph-content\" style:wrap=\"none\"/></style:style>"
        ));
    }
    s
}

/// The text of a document of Writer, with its tables and equations as they
/// are to be.
pub fn odt_content(xml: &str, format: &DocumentFormat) -> String {
    let mut text = String::with_capacity(xml.len() + 4096);
    let mut at = 0;
    // The styles of the tables that stand elsewhere than in the middle, by their names.
    let mut stands: Vec<(String, &'static str)> = Vec::new();
    while let Some(remark) = next_remark(xml, at) {
        text.push_str(&xml[at..remark.start]);
        at = remark.end;
        let within = said(remark.said, "within") == Some("true");
        let to = side(remark.said, within);
        let rest = &xml[at..];
        match remark.what {
            "table" => {
                let Some(open) = rest.find("<table:table ") else { continue };
                let Some(close) = rest[open..].find("</table:table>").map(|c| open + c) else { continue };
                // A table within a cell of this one would end it too soon:
                // Pandoc writes none, since a cell of ours holds paragraphs.
                let table = &rest[open..close];
                if let Some(name) = table.split("table:style-name=\"").nth(1).and_then(|s| s.split('"').next()) {
                    stands.push((name.to_owned(), to));
                }
                text.push_str(&rest[..open]);
                text.push_str(&ruled(table));
                at += close;
            }
            "equation" => {
                let Some(found) = rest.find("draw:style-name=\"fr2\"") else { continue };
                text.push_str(&rest[..found]);
                let name = if to == "left" { "GkFormulaLeft" } else { "GkFormulaRight" };
                text.push_str(&format!("draw:style-name=\"{name}\""));
                at += found + "draw:style-name=\"fr2\"".len();
            }
            _ => {}
        }
    }
    text.push_str(&xml[at..]);

    // Where the tables stand is said in their styles.
    for (name, to) in stands {
        let open = format!("<style:style style:name=\"{name}\" style:family=\"table\">");
        if let Some(start) = text.find(&open)
            && let Some(end) = text[start..].find("</style:style>").map(|e| start + e)
        {
            let style = text[start..end].replace("table:align=\"center\"", &format!("table:align=\"{to}\""));
            text.replace_range(start..end, &style);
        }
    }
    let styles = odt_styles(format);
    if let Some(end) = text.find("</office:automatic-styles>") {
        text.insert_str(end, &styles);
    } else if let Some(empty) =
        text.find("<office:automatic-styles />").or_else(|| text.find("<office:automatic-styles/>"))
    {
        let close = text[empty..].find('>').map(|c| empty + c + 1).unwrap_or(empty);
        text.replace_range(empty..close, &format!("<office:automatic-styles>{styles}</office:automatic-styles>"));
    } else if let Some(body) = text.find("<office:body>") {
        text.insert_str(body, &format!("<office:automatic-styles>{styles}</office:automatic-styles>"));
    }
    text
}

/// A table of Writer with the cells of each row named by where the row
/// stands in the table, so that the lines are where they belong.
fn ruled(table: &str) -> String {
    let headings = table.contains("<table:table-header-rows>");
    let rows = table.matches("<table:table-row").count();
    let body_rows = rows - if headings { table_header_rows(table) } else { 0 };
    let mut out = String::with_capacity(table.len() + 256);
    let mut seen_in_body = 0usize;
    let mut rest = table;
    while let Some(start) = rest.find("<table:table-row") {
        let end = rest[start..].find("</table:table-row>").map(|e| start + e + 18).unwrap_or(rest.len());
        out.push_str(&rest[..start]);
        let row = &rest[start..end];
        if row.contains("table:style-name=\"TableHeaderRowCell\"") {
            out.push_str(&row.replace("table:style-name=\"TableHeaderRowCell\"", "table:style-name=\"GkCellHead\""));
        } else {
            seen_in_body += 1;
            let first = seen_in_body == 1 && !headings;
            let last = seen_in_body == body_rows;
            let name = match (first, last) {
                (true, true) => "GkCellOnly",
                (true, false) => "GkCellFirst",
                (false, true) => "GkCellLast",
                (false, false) => "GkCell",
            };
            out.push_str(&row.replace("table:style-name=\"TableRowCell\"", &format!("table:style-name=\"{name}\"")));
        }
        rest = &rest[end..];
    }
    out.push_str(rest);
    out
}

fn table_header_rows(table: &str) -> usize {
    match (table.find("<table:table-header-rows>"), table.find("</table:table-header-rows>")) {
        (Some(a), Some(b)) if a < b => table[a..b].matches("<table:table-row").count(),
        _ => 0,
    }
}

/// What the converter writes where a section of Word begins at an opener
/// (ADR 0057): a paragraph that ends the section before it, saying only how
/// the next begins, `nextPage` or `oddPage`.
const SECTION_MARK: &str = "<w:sectPr><w:type w:val=\"";

/// The sections of a document of Word made whole (ADR 0057). Each mark the
/// converter left ends a section; the section it ends has the properties of
/// the document's own (`reference::docx`, the last in the body), and the
/// sections after the first begin as their mark says, with a first page of
/// their own that takes the header and the footer of the openers. In Word
/// the properties of a section stand where it ends, so each section's are
/// written at the next mark, the last at the end of the body.
pub fn docx_sections(xml: &str, header: bool, footer: bool) -> String {
    let Some(base_at) = xml.rfind("<w:sectPr") else { return xml.to_owned() };
    let Some(base_end) = xml[base_at..].find("</w:sectPr>").map(|e| base_at + e + "</w:sectPr>".len()) else {
        return xml.to_owned();
    };
    let base = &xml[base_at..base_end];
    // The marks, each with how the section after it begins.
    let mut marks: Vec<(usize, usize, &str)> = Vec::new();
    let mut from = 0;
    while let Some(found) = xml[from..base_at].find(SECTION_MARK) {
        let at = from + found;
        let kind_at = at + SECTION_MARK.len();
        let Some(kind_end) = xml[kind_at..].find('"').map(|e| kind_at + e) else { break };
        let Some(end) = xml[at..].find("</w:sectPr>").map(|e| at + e + "</w:sectPr>".len()) else { break };
        marks.push((at, end, &xml[kind_at..kind_end]));
        from = end;
    }
    if marks.is_empty() {
        return xml.to_owned();
    }
    // A section that begins at an opener: the document's, beginning as it
    // says, its first page with the openers' header and footer.
    let opener = |kind: &str| {
        let mut s = base.to_owned();
        for which in ["header", "footer"] {
            let tag = format!("<w:{which}Reference w:type=\"first\"");
            while let Some(a) = s.find(&tag) {
                let Some(b) = s[a..].find("/>") else { break };
                s.replace_range(a..a + b + 2, "");
            }
        }
        s = s.replace("<w:titlePg/>", "");
        let mut references = String::new();
        if header {
            let _ = write!(
                references,
                "<w:headerReference w:type=\"first\" r:id=\"{}\"/>",
                reference::opener_relation("header")
            );
        }
        if footer {
            let _ = write!(
                references,
                "<w:footerReference w:type=\"first\" r:id=\"{}\"/>",
                reference::opener_relation("footer")
            );
        }
        if let Some(open) = s.find('>') {
            s.insert_str(open + 1, &references);
        }
        if let Some(at) = s.find("<w:pgSz") {
            s.insert_str(at, &format!("<w:type w:val=\"{kind}\"/>"));
        }
        let at = s.find("<w:docGrid").unwrap_or(s.len() - "</w:sectPr>".len());
        s.insert_str(at, "<w:titlePg/>");
        s
    };
    let mut out = String::with_capacity(xml.len() + base.len() * (marks.len() + 1));
    let mut at = 0;
    let mut before: Option<&str> = None;
    for (start, end, kind) in &marks {
        out.push_str(&xml[at..*start]);
        out.push_str(&before.map(opener).unwrap_or_else(|| base.to_owned()));
        before = Some(kind);
        at = *end;
    }
    out.push_str(&xml[at..base_at]);
    out.push_str(&before.map(opener).unwrap_or_else(|| base.to_owned()));
    out.push_str(&xml[base_end..]);
    out
}

/// A document of Word, set right, with its title and makers in its properties.
pub fn docx(bytes: &[u8], properties: &Properties) -> Result<Vec<u8>> {
    rewrite(bytes, |files| {
        let document = text_of(files, "word/document.xml")?;
        let relations = text_of(files, "word/_rels/document.xml.rels").unwrap_or_default();
        let has = |kind: &str| relations.contains(&format!("Id=\"{}\"", reference::opener_relation(kind)));
        let document = docx_sections(&document, has("header"), has("footer"));
        // The lists first: what sets the rest right takes every mark it does not know away.
        put(files, "word/document.xml", docx_document(&docx_lists(&document)));
        // Pandoc writes the properties; where it did not, nothing is made up.
        if let Ok(core) = text_of(files, "docProps/core.xml") {
            put(files, "docProps/core.xml", docx_properties(&core, properties));
        }
        Ok(())
    })
}

/// A document of Writer, set right, with its title and makers in its properties.
pub fn odt(bytes: &[u8], format: &DocumentFormat, properties: &Properties) -> Result<Vec<u8>> {
    rewrite(bytes, |files| {
        let content = text_of(files, "content.xml")?;
        put(files, "content.xml", odt_content(&odt_lists(&content), format));
        if let Ok(meta) = text_of(files, "meta.xml") {
            put(files, "meta.xml", odt_properties(&meta, properties));
        }
        Ok(())
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sections_begin_at_the_openers() {
        let base = "<w:sectPr><w:headerReference w:type=\"default\" r:id=\"h1\"/><w:headerReference w:type=\"first\" r:id=\"h3\"/><w:pgSz w:w=\"1\"/><w:titlePg/></w:sectPr>";
        let mark = |kind: &str| format!("<w:p><w:pPr><w:sectPr><w:type w:val=\"{kind}\"/></w:sectPr></w:pPr></w:p>");
        let xml = format!(
            "<w:body><w:p>A</w:p>{}<w:p>B</w:p>{}<w:p>C</w:p>{base}</w:body>",
            mark("oddPage"),
            mark("nextPage")
        );
        let out = docx_sections(&xml, true, false);
        // The first section is the document's as it was, ended where the first chapter begins.
        let first = out.find("<w:p>B</w:p>").unwrap();
        assert!(out[..first].contains(base), "{out}");
        // The second begins on an odd page, the third on the next; each with the openers' first page.
        let opener = |kind: &str| {
            format!(
                "<w:sectPr><w:headerReference w:type=\"first\" r:id=\"rIdGkheaderOpenerxml\"/><w:headerReference w:type=\"default\" r:id=\"h1\"/><w:type w:val=\"{kind}\"/><w:pgSz w:w=\"1\"/><w:titlePg/></w:sectPr>"
            )
        };
        assert_eq!(
            out,
            format!(
                "<w:body><w:p>A</w:p><w:p><w:pPr>{base}</w:pPr></w:p><w:p>B</w:p><w:p><w:pPr>{}</w:pPr></w:p><w:p>C</w:p>{}</w:body>",
                opener("oddPage"),
                opener("nextPage")
            )
        );
        // Without marks, nothing changes.
        let plain = format!("<w:body><w:p>A</w:p>{base}</w:body>");
        assert_eq!(docx_sections(&plain, true, true), plain);
    }

    #[test]
    fn the_lists_are_moved_from_the_head_to_their_marks() {
        let toc = "<w:sdt><w:sdtContent><w:instrText>TOC \\o &quot;1-3&quot;</w:instrText></w:sdtContent></w:sdt>";
        let lof = "<w:sdt><w:sdtContent><w:instrText>TOC \\h \\t &quot;Image Caption&quot;</w:instrText></w:sdtContent></w:sdt>";
        let xml = format!("<w:body>{toc}{lof}<w:p>Title</w:p><!--gk:toc--><w:p>Text</w:p></w:body>");
        let out = docx_lists(&xml);
        // The contents to their mark; the list of figures, which has none, where Pandoc put it.
        assert_eq!(out, format!("<w:body>{lof}<w:p>Title</w:p>{toc}<w:p>Text</w:p></w:body>"));
        // A mark without its list goes.
        assert_eq!(docx_lists("<w:body><!--gk:lot--><w:p/></w:body>"), "<w:body><w:p/></w:body>");

        let odt = "<office:text><text:table-of-content><text:table-of-content-source text:outline-level=\"3\">\
                   </text:table-of-content-source><text:index-body/></text:table-of-content>\
                   <text:p text:style-name=\"Title\">Wrath</text:p><!--gk:toc--><text:p>Text</text:p></office:text>";
        let out = odt_lists(odt);
        let title = out.find("Wrath").unwrap();
        let contents = out.find("<text:table-of-content>").unwrap();
        assert!(title < contents && contents < out.find(">Text<").unwrap(), "{out}");
        assert!(out.ends_with("</text:table-of-content><text:p>Text</text:p></office:text>"), "{out}");

        let html = "<body><nav id=\"TOC\" role=\"doc-toc\"><ul><li>One</li></ul></nav><div class=\"gk-front\">W</div>\
                    <!--gk:toc--><h1>One</h1></body>";
        let out = html_lists(html);
        assert_eq!(
            out,
            "<body><div class=\"gk-front\">W</div><nav id=\"TOC\" role=\"doc-toc\"><ul><li>One</li></ul></nav><h1>One</h1></body>"
        );
    }

    #[test]
    fn the_properties_are_given_the_title_and_the_makers() {
        let p =
            Properties { title: "Wrath & the hero".into(), creators: vec!["A. Scholar".into(), "B. Reader".into()] };
        let ns = "xmlns:cp=\"http://schemas.openxmlformats.org/package/2006/metadata/core-properties\" \
                  xmlns:dc=\"http://purl.org/dc/elements/1.1/\"";
        // As Pandoc writes them when it is given no title and no author: empty.
        let core = format!(
            "<cp:coreProperties {ns}><dc:title>\n</dc:title><dc:creator>\n</dc:creator>\
             <cp:keywords>wrath</cp:keywords></cp:coreProperties>"
        );
        let out = docx_properties(&core, &p);
        roxmltree::Document::parse(&out).unwrap();
        assert!(out.contains("<dc:title>Wrath &amp; the hero</dc:title>"), "{out}");
        assert!(out.contains("<dc:creator>A. Scholar; B. Reader</dc:creator>"), "{out}");
        assert!(out.contains("<cp:keywords>wrath</cp:keywords>"), "{out}");
        // Not written at all, or written empty: put in. One with a text of its own: left.
        let bare = format!("<cp:coreProperties {ns}><dc:title/></cp:coreProperties>");
        let out = docx_properties(&bare, &p);
        roxmltree::Document::parse(&out).unwrap();
        assert!(out.contains("<dc:title>Wrath &amp; the hero</dc:title>") && out.contains("<dc:creator>"), "{out}");
        let own = format!("<cp:coreProperties {ns}><dc:title>Its own</dc:title></cp:coreProperties>");
        assert!(docx_properties(&own, &p).contains("<dc:title>Its own</dc:title>"));
        // Nothing to say: nothing said.
        assert_eq!(docx_properties(&core, &Properties::default()), core);

        let meta = "<office:document-meta xmlns:office=\"urn:oasis:names:tc:opendocument:xmlns:office:1.0\" \
                    xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:meta=\"urn:oasis:names:tc:opendocument:xmlns:meta:1.0\">\
                    <office:meta><dc:title>\n</dc:title><meta:initial-creator>\n</meta:initial-creator>\
                    <dc:creator>\n</dc:creator></office:meta></office:document-meta>";
        let out = odt_properties(meta, &p);
        roxmltree::Document::parse(&out).unwrap();
        assert!(out.contains("<dc:title>Wrath &amp; the hero</dc:title>"), "{out}");
        assert!(out.contains("<meta:initial-creator>A. Scholar; B. Reader</meta:initial-creator>"), "{out}");
        assert!(out.contains("<dc:creator>A. Scholar; B. Reader</dc:creator>"), "{out}");
    }

    #[test]
    fn a_table_of_word_stands_where_it_is_said_to() {
        let xml = "<w:body><w:p/><!--gk:table stand=left within=false-->\n<w:tbl><w:tblPr><w:tblStyle w:val=\"Table\" />\
                   <w:tblW w:type=\"auto\" w:w=\"0\" /><w:tblLook/></w:tblPr><w:tr><w:tc><w:p><w:pPr>\
                   <w:pStyle w:val=\"Compact\" /></w:pPr></w:p></w:tc></w:tr></w:tbl>\
                   <w:p><w:pPr><w:pStyle w:val=\"Compact\" /></w:pPr></w:p>\
                   <!--gk:equation stand=right--><w:p><m:oMathPara><m:oMathParaPr><m:jc m:val=\"center\" /></m:oMathParaPr>\
                   </m:oMathPara></w:p><w:p><m:oMathPara><m:oMathParaPr><m:jc m:val=\"center\" /></m:oMathParaPr></m:oMathPara></w:p>\
                   <!--gk:table stand=right within=true--><w:tbl><w:tblPr><w:tblW w:type=\"pct\" w:w=\"2000\" /></w:tblPr></w:tbl></w:body>";
        let out = docx_document(xml);
        assert!(!out.contains("<!--gk"), "{out}");
        assert!(out.contains("<w:tblW w:type=\"auto\" w:w=\"0\" /><w:jc w:val=\"left\"/><w:tblLook/>"), "{out}");
        // Within something it stands in the middle of that.
        assert!(out.contains("<w:tblW w:type=\"pct\" w:w=\"2000\" /><w:jc w:val=\"center\"/>"), "{out}");
        assert_eq!(out.matches("<m:jc m:val=\"right\"").count(), 1);
        assert_eq!(out.matches("<m:jc m:val=\"center\"").count(), 1);
        // In the table, and not in the list after it.
        assert_eq!(out.matches("w:val=\"TableText\"").count(), 1);
        assert_eq!(out.matches("w:val=\"Compact\"").count(), 1);
    }

    #[test]
    fn a_table_of_writer_has_its_lines_and_its_place() {
        let cell = |style: &str| {
            format!("<table:table-cell table:style-name=\"{style}\"><text:p>x</text:p></table:table-cell>")
        };
        let row = |style: &str| format!("<table:table-row>{}</table:table-row>", cell(style));
        let xml = format!(
            "<office:automatic-styles><style:style style:name=\"fr2\" style:family=\"graphic\"/>\
             <style:style style:name=\"Table1\" style:family=\"table\"><style:table-properties table:align=\"center\" /></style:style>\
             <style:style style:name=\"Table2\" style:family=\"table\"><style:table-properties table:align=\"center\" /></style:style>\
             </office:automatic-styles><office:body><!--gk:table stand=right within=false rules=horizontal-->\
             <table:table table:name=\"Table1\" table:style-name=\"Table1\"><table:table-header-rows>{}</table:table-header-rows>{}{}{}</table:table>\
             <!--gk:table stand=left within=false rules=horizontal--><table:table table:name=\"Table2\" table:style-name=\"Table2\">{}</table:table>\
             <!--gk:equation stand=left--><draw:frame draw:style-name=\"fr2\"/><draw:frame draw:style-name=\"fr2\"/></office:body>",
            row("TableHeaderRowCell"),
            row("TableRowCell"),
            row("TableRowCell"),
            row("TableRowCell"),
            row("TableRowCell"),
        );
        let out = odt_content(&xml, &DocumentFormat::default());
        assert!(!out.contains("<!--gk"), "{out}");
        let names: Vec<&str> =
            out.split("<table:table-cell table:style-name=\"").skip(1).map(|s| s.split('"').next().unwrap()).collect();
        assert_eq!(names, ["GkCellHead", "GkCell", "GkCell", "GkCellLast", "GkCellOnly"]);
        assert!(
            out.contains("style:name=\"Table1\" style:family=\"table\"><style:table-properties table:align=\"right\"")
        );
        assert!(
            out.contains("style:name=\"Table2\" style:family=\"table\"><style:table-properties table:align=\"left\"")
        );
        assert_eq!(out.matches("draw:style-name=\"GkFormulaLeft\"").count(), 1);
        assert_eq!(out.matches("draw:style-name=\"fr2\"").count(), 1);
        assert!(out.contains("style:name=\"GkCellHead\"") && out.contains("style:name=\"GkRowCellBottom\""));
        assert!(out.find("style:name=\"GkRow\"").unwrap() < out.find("</office:automatic-styles>").unwrap());
    }
}
