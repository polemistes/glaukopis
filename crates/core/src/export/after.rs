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

use super::reference::{put, rewrite, text_of};

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

/// A document of Word, set right.
pub fn docx(bytes: &[u8]) -> Result<Vec<u8>> {
    rewrite(bytes, |files| {
        let document = text_of(files, "word/document.xml")?;
        put(files, "word/document.xml", docx_document(&document));
        Ok(())
    })
}

/// A document of Writer, set right.
pub fn odt(bytes: &[u8], format: &DocumentFormat) -> Result<Vec<u8>> {
    rewrite(bytes, |files| {
        let content = text_of(files, "content.xml")?;
        put(files, "content.xml", odt_content(&content, format));
        Ok(())
    })
}

#[cfg(test)]
mod tests {
    use super::*;

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
