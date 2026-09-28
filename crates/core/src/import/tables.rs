//! Bringing tables in from files.
//!
//! A table of a text can be made from what a file holds: text in which the
//! values are parted by commas, semicolons or tabs, and the sheets of
//! LibreOffice and Excel. What is read is what would be seen: a number
//! without the decimals it does not need, a date as `2024-03-01`, an empty
//! cell as nothing. How the cells were set in the sheet, their colours and
//! the form their numbers were given, is not read.
//!
//! A table in a text is not a spreadsheet: one that has more rows or columns
//! than a page can reasonably hold is refused, with words that say so.

use std::fs;
use std::path::Path;

use calamine::{Data, Range, Reader, SheetType, SheetVisible, open_workbook_auto};
use serde::{Deserialize, Serialize};

use crate::error::{Error, IoContext, Result};

/// The most rows a table may have.
pub const MAX_ROWS: usize = 2000;
/// The most columns a table may have.
pub const MAX_COLUMNS: usize = 100;
/// The most a file may hold.
pub const MAX_BYTES: u64 = 64 * 1024 * 1024;

/// The endings of files that hold text with the values parted by a sign.
pub const TEXT_ENDINGS: [&str; 4] = ["csv", "tsv", "tab", "txt"];
/// The endings of files that hold sheets.
pub const SHEET_ENDINGS: [&str; 5] = ["ods", "xlsx", "xlsm", "xlsb", "xls"];

/// A sheet of a file, or the one table a file of text holds.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Sheet {
    /// What the sheet is called. Of a file of text, what the file is called, without its ending.
    pub name: String,
    /// The values, row by row, as they are shown. Every row is as long as the longest.
    pub rows: Vec<Vec<String>>,
    /// Why the sheet cannot become a table, when it cannot: it has no rows then.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub problem: Option<String>,
}

/// Reads the tables of a file. A file of text has one; a file of sheets has
/// one for each sheet that holds something.
pub fn read(path: &Path) -> Result<Vec<Sheet>> {
    let ending = path.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
    let size = fs::metadata(path).context(|| format!("reading {}", path.display()))?.len();
    if size > MAX_BYTES {
        return Err(Error::invalid(format!(
            "The file holds {} MB. A table is read from a file of {} MB at most.",
            size / (1024 * 1024),
            MAX_BYTES / (1024 * 1024)
        )));
    }
    let sheets = if SHEET_ENDINGS.contains(&ending.as_str()) {
        read_sheets(path)?
    } else if TEXT_ENDINGS.contains(&ending.as_str()) {
        let bytes = fs::read(path).context(|| format!("reading {}", path.display()))?;
        let name = path.file_stem().and_then(|s| s.to_str()).unwrap_or("").to_string();
        let sign = if ending == "tsv" || ending == "tab" { Some('\t') } else { None };
        vec![from_text(&name, &bytes, sign)]
    } else {
        return Err(Error::invalid(
            "Tables are read from CSV and other text with the values parted by commas, semicolons or tabs, \
             and from the sheets of LibreOffice (.ods) and Excel (.xlsx, .xls).",
        ));
    };

    let sheets: Vec<Sheet> = sheets.into_iter().filter(|s| !s.rows.is_empty() || s.problem.is_some()).collect();
    if sheets.is_empty() {
        return Err(Error::invalid("There is nothing in the file."));
    }
    // Where no sheet can become a table, the file is refused with what the first of them lacks.
    if sheets.iter().all(|s| s.problem.is_some()) {
        return Err(Error::invalid(sheets[0].problem.clone().unwrap_or_default()));
    }
    Ok(sheets)
}

/// Says why a table of this size cannot stand in a text, if it cannot.
fn too_large(rows: usize, columns: usize) -> Option<String> {
    if rows > MAX_ROWS {
        Some(format!(
            "The table has {} rows. A table in a text can have {MAX_ROWS} at most: it is not a spreadsheet.",
            counted(rows)
        ))
    } else if columns > MAX_COLUMNS {
        Some(format!(
            "The table has {} columns. A table in a text can have {MAX_COLUMNS} at most: it is not a spreadsheet.",
            counted(columns)
        ))
    } else {
        None
    }
}

/// More than this many, where the counting was given up.
fn counted(n: usize) -> String {
    if n > MAX_ROWS.max(MAX_COLUMNS) * 5 {
        format!("more than {}", MAX_ROWS.max(MAX_COLUMNS) * 5)
    } else {
        n.to_string()
    }
}

/// Cuts away the rows and columns at the end in which nothing stands, and
/// makes every row as long as the longest.
fn tidy(name: &str, mut rows: Vec<Vec<String>>) -> Sheet {
    for row in &mut rows {
        while row.last().is_some_and(|v| v.is_empty()) {
            row.pop();
        }
    }
    while rows.last().is_some_and(|r| r.is_empty()) {
        rows.pop();
    }
    let columns = rows.iter().map(Vec::len).max().unwrap_or(0);
    if let Some(problem) = too_large(rows.len(), columns) {
        return Sheet { name: name.to_string(), rows: Vec::new(), problem: Some(problem) };
    }
    for row in &mut rows {
        row.resize(columns, String::new());
    }
    Sheet { name: name.to_string(), rows, problem: None }
}

// ---- text ----

/// The text of a file, whatever it was written as: UTF-8, with or without
/// the mark at its beginning; UTF-16, which has the mark; and what is
/// neither is taken for the Latin of Windows, which holds Latin-1.
fn decode(bytes: &[u8]) -> String {
    if let Some((encoding, mark)) = encoding_rs::Encoding::for_bom(bytes) {
        return encoding.decode_without_bom_handling(&bytes[mark..]).0.into_owned();
    }
    match std::str::from_utf8(bytes) {
        Ok(text) => text.to_string(),
        Err(_) => encoding_rs::WINDOWS_1252.decode_without_bom_handling(bytes).0.into_owned(),
    }
}

/// The table that a text holds. With no sign given, the sign that parts the
/// values is told from the text.
pub fn from_text(name: &str, bytes: &[u8], sign: Option<char>) -> Sheet {
    let text = decode(bytes);
    let sign = sign.unwrap_or_else(|| sign_of(&text));
    match records(&text, sign, MAX_ROWS * 5) {
        Some(rows) => tidy(name, rows),
        None => Sheet { name: name.to_string(), rows: Vec::new(), problem: too_large(MAX_ROWS * 5 + 1, 0) },
    }
}

/// The sign that parts the values: the one of which every line has as many.
/// A comma that stands for the decimal point in a file parted by semicolons
/// is in some lines and not in others, or is in all of them as the
/// semicolon is: then the semicolon is the sign.
fn sign_of(text: &str) -> char {
    const SIGNS: [char; 3] = ['\t', ';', ','];
    let sample = records_counted(text, 60);
    let mut best = (',', 0usize, 0usize);
    for (i, sign) in SIGNS.into_iter().enumerate() {
        let counts: Vec<usize> = sample.iter().map(|c| c[i]).filter(|n| *n > 0).collect();
        if counts.is_empty() {
            continue;
        }
        // How many lines have the number of them that most lines have.
        let mut most = (0usize, 0usize);
        for n in &counts {
            let lines = counts.iter().filter(|m| *m == n).count();
            if lines > most.0 || (lines == most.0 && *n > most.1) {
                most = (lines, *n);
            }
        }
        if most.0 > best.1 {
            best = (sign, most.0, most.1);
        }
    }
    best.0
}

/// For each of the first lines, how many tabs, semicolons and commas stand
/// in it outside what is quoted. A line that is empty is not counted.
fn records_counted(text: &str, lines: usize) -> Vec<[usize; 3]> {
    let mut out = Vec::new();
    let mut counts = [0usize; 3];
    let mut quoted = false;
    let mut any = false;
    for c in text.chars() {
        match c {
            '"' => {
                quoted = !quoted;
                any = true;
            }
            '\n' | '\r' if !quoted => {
                if any {
                    out.push(counts);
                    if out.len() >= lines {
                        return out;
                    }
                }
                counts = [0; 3];
                any = false;
            }
            '\t' if !quoted => counts[0] += 1,
            ';' if !quoted => counts[1] += 1,
            ',' if !quoted => counts[2] += 1,
            _ => any = true,
        }
        if matches!(c, '\t' | ';' | ',') {
            any = true;
        }
    }
    if any {
        out.push(counts);
    }
    out
}

/// The rows of a text whose values are parted by a sign. A value may stand
/// within quotation marks, and may then hold the sign, line breaks, and the
/// quotation mark itself, written twice. Nothing, where there are more rows
/// than `most`.
fn records(text: &str, sign: char, most: usize) -> Option<Vec<Vec<String>>> {
    let mut rows: Vec<Vec<String>> = Vec::new();
    let mut row: Vec<String> = Vec::new();
    let mut value = String::new();
    // Whether the value is within quotation marks, and whether it was.
    let mut quoted = false;
    let mut was_quoted = false;
    let mut chars = text.chars().peekable();

    fn keep(row: &mut Vec<String>, value: &mut String, was_quoted: &mut bool) {
        let kept = if *was_quoted { value.clone() } else { value.trim().to_string() };
        row.push(kept);
        value.clear();
        *was_quoted = false;
    }

    while let Some(c) = chars.next() {
        if quoted {
            if c == '"' {
                if chars.peek() == Some(&'"') {
                    value.push('"');
                    chars.next();
                } else {
                    quoted = false;
                }
            } else if c == '\r' {
                // A line break within a value is one line break, however the file writes it.
                if chars.peek() == Some(&'\n') {
                    chars.next();
                }
                value.push('\n');
            } else {
                value.push(c);
            }
            continue;
        }
        if c == '"' && value.trim().is_empty() && !was_quoted {
            value.clear();
            quoted = true;
            was_quoted = true;
        } else if c == sign {
            keep(&mut row, &mut value, &mut was_quoted);
        } else if c == '\n' || c == '\r' {
            if c == '\r' && chars.peek() == Some(&'\n') {
                chars.next();
            }
            keep(&mut row, &mut value, &mut was_quoted);
            rows.push(std::mem::take(&mut row));
            if rows.len() > most {
                return None;
            }
        } else if was_quoted && c.is_whitespace() {
            // Room between the closing mark and the sign.
        } else {
            value.push(c);
        }
    }
    if !value.is_empty() || was_quoted || !row.is_empty() {
        keep(&mut row, &mut value, &mut was_quoted);
        rows.push(row);
    }
    Some(rows)
}

// ---- sheets ----

fn read_sheets(path: &Path) -> Result<Vec<Sheet>> {
    let unread = |message: String| Error::Parse { path: path.to_path_buf(), message };
    let mut book = open_workbook_auto(path).map_err(|e| unread(e.to_string()))?;
    let known = book.sheets_metadata().to_vec();
    // What is hidden in the file, and what is no sheet of cells, is not offered.
    let mut names: Vec<String> = known
        .iter()
        .filter(|s| s.typ == SheetType::WorkSheet && s.visible == SheetVisible::Visible)
        .map(|s| s.name.clone())
        .collect();
    if names.is_empty() {
        names = known.iter().filter(|s| s.typ == SheetType::WorkSheet).map(|s| s.name.clone()).collect();
    }
    let mut out = Vec::new();
    for name in names {
        let range = book.worksheet_range(&name).map_err(|e| unread(format!("{name}: {e}")))?;
        out.push(from_range(&name, &range));
    }
    Ok(out)
}

fn from_range(name: &str, range: &Range<Data>) -> Sheet {
    let (height, width) = range.get_size();
    if height > MAX_ROWS * 5 || width > MAX_COLUMNS * 5 {
        // So large that it is not looked through for where it ends.
        let problem = too_large(height, width);
        return Sheet { name: name.to_string(), rows: Vec::new(), problem };
    }
    tidy(name, range.rows().map(|row| row.iter().map(shown).collect()).collect())
}

/// A value as it is shown.
fn shown(value: &Data) -> String {
    match value {
        Data::Empty => String::new(),
        Data::String(s) => s.trim().replace("\r\n", "\n").replace('\r', "\n"),
        Data::Int(n) => n.to_string(),
        Data::Float(f) => number(*f),
        Data::Bool(b) => if *b { "TRUE" } else { "FALSE" }.to_string(),
        Data::DateTime(when) if when.is_duration() => duration(when.as_f64() * 86_400.0),
        Data::DateTime(when) => {
            let (year, month, day, hour, minute, second, _) = when.to_ymd_hms_milli();
            // A time of day alone is a day before the counting of days begins.
            if when.as_f64() < 1.0 {
                return time(hour, minute, second);
            }
            let date = format!("{year:04}-{month:02}-{day:02}");
            if hour == 0 && minute == 0 && second == 0 {
                date
            } else {
                format!("{date} {}", time(hour, minute, second))
            }
        }
        Data::DateTimeIso(s) => iso_date(s),
        Data::DurationIso(s) => iso_duration(s).unwrap_or_else(|| s.clone()),
        Data::Error(e) => e.to_string(),
    }
}

fn time(hour: u8, minute: u8, second: u8) -> String {
    if second == 0 { format!("{hour:02}:{minute:02}") } else { format!("{hour:02}:{minute:02}:{second:02}") }
}

/// A number without the decimals it does not need, and without what adding
/// tenths leaves at the fifteenth place.
pub fn number(value: f64) -> String {
    if !value.is_finite() {
        return String::new();
    }
    if value == value.trunc() && value.abs() < 1e15 {
        return format!("{}", value as i64);
    }
    // Twelve figures that count.
    let whole = value.abs().log10().floor() as i32 + 1;
    let decimals = (12 - whole).clamp(0, 20) as usize;
    let mut text = format!("{value:.decimals$}");
    if text.contains('.') {
        text.truncate(text.trim_end_matches('0').trim_end_matches('.').len());
    }
    if text == "-0" { "0".to_string() } else { text }
}

/// A length of time, given in seconds, as hours, minutes and seconds.
fn duration(seconds: f64) -> String {
    let total = seconds.round() as i64;
    let sign = if total < 0 { "-" } else { "" };
    let total = total.abs();
    let (h, m, s) = (total / 3600, total / 60 % 60, total % 60);
    if s == 0 { format!("{sign}{h}:{m:02}") } else { format!("{sign}{h}:{m:02}:{s:02}") }
}

/// A date as a sheet of LibreOffice keeps it, `2024-03-01T00:00:00`, as it is read.
fn iso_date(value: &str) -> String {
    let value = value.trim();
    let Some((date, clock)) = value.split_once('T') else { return value.to_string() };
    let clock = clock.trim_end_matches('Z');
    let clock = clock.split_once('.').map_or(clock, |(whole, _)| whole);
    let clock = clock.strip_suffix(":00").filter(|c| c.len() == 5).unwrap_or(clock);
    if clock == "00:00" || clock.is_empty() { date.to_string() } else { format!("{date} {clock}") }
}

/// A length of time as a sheet of LibreOffice keeps it, `PT12H30M00S`.
fn iso_duration(value: &str) -> Option<String> {
    let rest = value.trim().strip_prefix("PT")?;
    let mut seconds = 0f64;
    let mut figure = String::new();
    for c in rest.chars() {
        match c {
            '0'..='9' | '.' | ',' => figure.push(if c == ',' { '.' } else { c }),
            'H' | 'M' | 'S' => {
                let n: f64 = figure.parse().ok()?;
                seconds += n * if c == 'H' {
                    3600.0
                } else if c == 'M' {
                    60.0
                } else {
                    1.0
                };
                figure.clear();
            }
            _ => return None,
        }
    }
    if !figure.is_empty() {
        return None;
    }
    Some(duration(seconds))
}

#[cfg(test)]
mod tests {
    use std::io::Write;

    use zip::write::SimpleFileOptions;

    use super::*;

    fn rows(sheet: &Sheet) -> Vec<Vec<&str>> {
        sheet.rows.iter().map(|r| r.iter().map(String::as_str).collect()).collect()
    }

    fn text(content: &str) -> Sheet {
        from_text("table", content.as_bytes(), None)
    }

    fn file(name: &str, content: &[u8]) -> (tempfile::TempDir, std::path::PathBuf) {
        let tmp = tempfile::tempdir().unwrap();
        let path = tmp.path().join(name);
        fs::write(&path, content).unwrap();
        (tmp, path)
    }

    fn zipped(name: &str, parts: &[(&str, &str)]) -> (tempfile::TempDir, std::path::PathBuf) {
        let mut writer = zip::ZipWriter::new(std::io::Cursor::new(Vec::new()));
        for (part, content) in parts {
            let options = if *part == "mimetype" {
                SimpleFileOptions::default().compression_method(zip::CompressionMethod::Stored)
            } else {
                SimpleFileOptions::default()
            };
            writer.start_file(*part, options).unwrap();
            writer.write_all(content.as_bytes()).unwrap();
        }
        let bytes = writer.finish().unwrap().into_inner();
        file(name, &bytes)
    }

    #[test]
    fn values_parted_by_commas() {
        let sheet = text("Work,Year,Lines\nIliad,-750,15693\nOdyssey,-725,12109\n");
        assert_eq!(rows(&sheet), [["Work", "Year", "Lines"], ["Iliad", "-750", "15693"], ["Odyssey", "-725", "12109"]]);
        assert_eq!(sheet.name, "table");
        assert_eq!(sheet.problem, None);
    }

    #[test]
    fn the_sign_is_told_from_the_text() {
        assert_eq!(rows(&text("a\tb\tc\n1\t2\t3\n")), [["a", "b", "c"], ["1", "2", "3"]]);
        assert_eq!(rows(&text("a;b;c\n1;2;3\n")), [["a", "b", "c"], ["1", "2", "3"]]);
        // Tabs part the values though there are commas in them.
        assert_eq!(
            rows(&text("name\tsaid\nAchilles\tswift, godlike\n")),
            [["name", "said"], ["Achilles", "swift, godlike"]]
        );
        // One column has no sign at all.
        assert_eq!(rows(&text("one\ntwo\nthree")), [["one"], ["two"], ["three"]]);
    }

    #[test]
    fn a_decimal_comma_is_not_taken_for_the_sign() {
        let sheet = text("Name;Share;Count\nA;1,5;3\nB;2,25;4\nC;3;5\n");
        assert_eq!(rows(&sheet), [["Name", "Share", "Count"], ["A", "1,5", "3"], ["B", "2,25", "4"], ["C", "3", "5"]]);
        // Nor where every line has one of each.
        assert_eq!(rows(&text("A;1,5\nB;2,5\n")), [["A", "1,5"], ["B", "2,5"]]);
        // Nor where the lines have more commas than semicolons.
        assert_eq!(rows(&text("1,5;2,5;3,5\n4,5;5,5;6,5\n")), [["1,5", "2,5", "3,5"], ["4,5", "5,5", "6,5"]]);
    }

    #[test]
    fn values_within_quotation_marks() {
        let sheet =
            text("name,said\r\n\"Achilles, son of Peleus\",\"He said \"\"no\"\".\"\r\n\"two\r\nlines\" , last\r\n");
        assert_eq!(
            rows(&sheet),
            [["name", "said"], ["Achilles, son of Peleus", "He said \"no\"."], ["two\nlines", "last"]]
        );
        // What is quoted keeps its room; what is not, loses it.
        assert_eq!(rows(&text("\" a \",  b  \n")), [[" a ", "b"]]);
        // A quotation mark within a value is a quotation mark.
        assert_eq!(rows(&text("6\" nails,2\n")), [["6\" nails", "2"]]);
    }

    #[test]
    fn the_mark_at_the_beginning_and_other_ways_of_writing() {
        let (_a, path) = file("marked.csv", b"\xEF\xBB\xBFname,year\nZo\xC3\xAB,1\n");
        assert_eq!(rows(&read(&path).unwrap()[0]), [["name", "year"], ["Zoë", "1"]]);
        assert_eq!(read(&path).unwrap()[0].name, "marked");

        // Latin-1, and the signs that Windows has where Latin-1 has none.
        let (_b, path) = file("latin.csv", b"navn;pris\nbl\xE5b\xE6r;12,5 \x80\n\x93s\xF8t\x94;3\n");
        assert_eq!(rows(&read(&path).unwrap()[0]), [["navn", "pris"], ["blåbær", "12,5 €"], ["“søt”", "3"]]);

        // UTF-16, as Excel writes its text.
        let mut bytes = vec![0xFF, 0xFE];
        for unit in "a\tb\r\nø\t2\r\n".encode_utf16() {
            bytes.extend_from_slice(&unit.to_le_bytes());
        }
        let (_c, path) = file("wide.txt", &bytes);
        assert_eq!(rows(&read(&path).unwrap()[0]), [["a", "b"], ["ø", "2"]]);

        // A file of tabs is parted by tabs, whatever else it holds.
        let (_d, path) = file("tabs.tsv", b"a,b;c\td\n1,2;3\t4\n");
        assert_eq!(rows(&read(&path).unwrap()[0]), [["a,b;c", "d"], ["1,2;3", "4"]]);
    }

    #[test]
    fn what_is_empty_at_the_end_is_cut_away() {
        let sheet = text("a,b,,\n1,,,\n,,,\n\n,,\n");
        assert_eq!(rows(&sheet), [["a", "b"], ["1", ""]]);
        // A row that is empty between others stays.
        assert_eq!(rows(&text("a,b\n\nc,d\n")), [["a", "b"], ["", ""], ["c", "d"]]);
        // Rows are as long as the longest.
        assert_eq!(rows(&text("a\nb,c,d\ne,f\n")), [["a", "", ""], ["b", "c", "d"], ["e", "f", ""]]);
    }

    #[test]
    fn a_table_that_is_too_large_is_refused_in_plain_words() {
        let many: String = (0..MAX_ROWS + 1).map(|i| format!("{i},x\n")).collect();
        let (_a, path) = file("many.csv", many.as_bytes());
        let refused = read(&path).unwrap_err().to_string();
        assert_eq!(
            refused,
            "The table has 2001 rows. A table in a text can have 2000 at most: it is not a spreadsheet."
        );

        let wide = vec!["1"; MAX_COLUMNS + 1].join(",");
        let (_b, path) = file("wide.csv", wide.as_bytes());
        let refused = read(&path).unwrap_err().to_string();
        assert_eq!(
            refused,
            "The table has 101 columns. A table in a text can have 100 at most: it is not a spreadsheet."
        );

        // As large as it may be, it is read.
        let most: String = (0..MAX_ROWS).map(|i| format!("{i}\n")).collect();
        let (_c, path) = file("most.csv", most.as_bytes());
        assert_eq!(read(&path).unwrap()[0].rows.len(), MAX_ROWS);

        // One that is very much too large is not read to its end.
        let huge: String = (0..MAX_ROWS * 6).map(|i| format!("{i}\n")).collect();
        let (_d, path) = file("huge.csv", huge.as_bytes());
        assert!(read(&path).unwrap_err().to_string().starts_with("The table has more than 10000 rows."));
    }

    #[test]
    fn what_holds_nothing_and_what_is_no_table() {
        let (_a, path) = file("empty.csv", b"\n\n , ,\n");
        assert_eq!(read(&path).unwrap_err().to_string(), "There is nothing in the file.");
        let (_b, path) = file("letter.pdf", b"%PDF-1.4");
        assert!(read(&path).unwrap_err().to_string().starts_with("Tables are read from CSV"));
        let (_c, path) = file("broken.xlsx", b"this is no sheet");
        assert_eq!(read(&path).unwrap_err().kind(), "parse");
        assert_eq!(read(Path::new("/nowhere/at/all.csv")).unwrap_err().kind(), "io");
    }

    #[test]
    fn numbers_without_needless_decimals() {
        assert_eq!(number(3.0), "3");
        assert_eq!(number(-12.0), "-12");
        assert_eq!(number(0.1 + 0.2), "0.3");
        assert_eq!(number(2.50), "2.5");
        assert_eq!(number(1234567.891), "1234567.891");
        assert_eq!(number(0.000012345), "0.000012345");
        assert_eq!(number(1e20), "100000000000000000000");
        assert_eq!(number(-0.0), "0");
        assert_eq!(number(1.0 / 3.0), "0.333333333333");
        assert_eq!(number(f64::NAN), "");
    }

    #[test]
    fn dates_and_lengths_of_time() {
        assert_eq!(iso_date("2024-03-01"), "2024-03-01");
        assert_eq!(iso_date("2024-03-01T00:00:00"), "2024-03-01");
        assert_eq!(iso_date("2024-03-01T14:30:00"), "2024-03-01 14:30");
        assert_eq!(iso_date("2024-03-01T14:30:05.250"), "2024-03-01 14:30:05");
        assert_eq!(iso_duration("PT12H30M00S").as_deref(), Some("12:30"));
        assert_eq!(iso_duration("PT01H02M03S").as_deref(), Some("1:02:03"));
        assert_eq!(iso_duration("twelve"), None);
        let day = calamine::ExcelDateTime::new(45352.0, calamine::ExcelDateTimeType::DateTime, false);
        assert_eq!(shown(&Data::DateTime(day)), "2024-03-01");
        let hour = calamine::ExcelDateTime::new(45352.604166666664, calamine::ExcelDateTimeType::DateTime, false);
        assert_eq!(shown(&Data::DateTime(hour)), "2024-03-01 14:30");
        let clock = calamine::ExcelDateTime::new(0.25, calamine::ExcelDateTimeType::DateTime, false);
        assert_eq!(shown(&Data::DateTime(clock)), "06:00");
        let long = calamine::ExcelDateTime::new(1.5, calamine::ExcelDateTimeType::TimeDelta, false);
        assert_eq!(shown(&Data::DateTime(long)), "36:00");
        assert_eq!(shown(&Data::Bool(true)), "TRUE");
        assert_eq!(shown(&Data::Empty), "");
    }

    const XLSX_TYPES: &str = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>"#;

    const XLSX_RELS: &str = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>"#;

    const XLSX_BOOK: &str = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>
<sheet name="Poems" sheetId="1" r:id="rId1"/>
<sheet name="Kept from sight" sheetId="2" state="hidden" r:id="rId2"/>
<sheet name="Nothing yet" sheetId="3" r:id="rId3"/>
</sheets>
</workbook>"#;

    const XLSX_BOOK_RELS: &str = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>
<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
<Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>"#;

    const XLSX_STRINGS: &str = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="4" uniqueCount="4">
<si><t>Work</t></si><si><t>Lines</t></si><si><t>Iliad</t></si><si><t xml:space="preserve"> Odyssey </t></si>
</sst>"#;

    /// The second form of cell is a date.
    const XLSX_STYLES: &str = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="1"><fill><patternFill patternType="none"/></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="2">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
</cellXfs>
</styleSheet>"#;

    const XLSX_SHEET: &str = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>
<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="inlineStr"><is><t>Read</t></is></c><c r="D1" t="inlineStr"><is><t>Share</t></is></c></row>
<row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2"><v>15693</v></c><c r="C2" s="1"><v>45352</v></c><c r="D2"><v>0.30000000000000004</v></c></row>
<row r="3"><c r="A3" t="s"><v>3</v></c><c r="B3"><v>12109</v></c><c r="D3" t="b"><v>1</v></c></row>
<row r="5"><c r="F5" t="inlineStr"><is><t></t></is></c></row>
</sheetData>
</worksheet>"#;

    const XLSX_HIDDEN: &str = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData><row r="1"><c r="A1"><v>1</v></c></row></sheetData>
</worksheet>"#;

    const XLSX_EMPTY: &str = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData/></worksheet>"#;

    #[test]
    fn a_sheet_of_excel() {
        let (_tmp, path) = zipped(
            "poems.xlsx",
            &[
                ("[Content_Types].xml", XLSX_TYPES),
                ("_rels/.rels", XLSX_RELS),
                ("xl/workbook.xml", XLSX_BOOK),
                ("xl/_rels/workbook.xml.rels", XLSX_BOOK_RELS),
                ("xl/sharedStrings.xml", XLSX_STRINGS),
                ("xl/styles.xml", XLSX_STYLES),
                ("xl/worksheets/sheet1.xml", XLSX_SHEET),
                ("xl/worksheets/sheet2.xml", XLSX_HIDDEN),
                ("xl/worksheets/sheet3.xml", XLSX_EMPTY),
            ],
        );
        let sheets = read(&path).unwrap();
        // The sheet that is hidden and the one that is empty are not among them.
        assert_eq!(sheets.len(), 1);
        assert_eq!(sheets[0].name, "Poems");
        assert_eq!(
            rows(&sheets[0]),
            [
                ["Work", "Lines", "Read", "Share"],
                ["Iliad", "15693", "2024-03-01", "0.3"],
                ["Odyssey", "12109", "", "TRUE"]
            ]
        );
    }

    const ODS_MANIFEST: &str = r#"<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
<manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.spreadsheet"/>
<manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
</manifest:manifest>"#;

    const ODS_CONTENT: &str = r#"<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" office:version="1.2">
<office:body><office:spreadsheet>
<table:table table:name="Heroes">
<table:table-row>
<table:table-cell office:value-type="string"><text:p>Name</text:p></table:table-cell>
<table:table-cell office:value-type="string"><text:p>Born</text:p></table:table-cell>
<table:table-cell office:value-type="string"><text:p>Height</text:p></table:table-cell>
<table:table-cell office:value-type="string"><text:p>Watch</text:p></table:table-cell>
</table:table-row>
<table:table-row>
<table:table-cell office:value-type="string"><text:p>Aias</text:p></table:table-cell>
<table:table-cell office:value-type="date" office:date-value="1250-05-17"><text:p>17.05.1250</text:p></table:table-cell>
<table:table-cell office:value-type="float" office:value="2.1"><text:p>2,10</text:p></table:table-cell>
<table:table-cell office:value-type="time" office:time-value="PT08H30M00S"><text:p>08:30</text:p></table:table-cell>
</table:table-row>
<table:table-row>
<table:table-cell office:value-type="string"><text:p>Teukros</text:p></table:table-cell>
<table:table-cell table:number-columns-repeated="2"/>
<table:table-cell office:value-type="float" office:value="7"><text:p>7</text:p></table:table-cell>
</table:table-row>
<table:table-row table:number-rows-repeated="1000"><table:table-cell table:number-columns-repeated="4"/></table:table-row>
</table:table>
<table:table table:name="Ships">
<table:table-row>
<table:table-cell office:value-type="string"><text:p>Salamis</text:p></table:table-cell>
<table:table-cell office:value-type="float" office:value="12"><text:p>12</text:p></table:table-cell>
</table:table-row>
</table:table>
</office:spreadsheet></office:body>
</office:document-content>"#;

    /// As it is written to the file: on one line, as LibreOffice writes it.
    fn ods_content() -> String {
        ODS_CONTENT.replace('\n', "")
    }

    #[test]
    fn the_sheets_of_libreoffice() {
        let (_tmp, path) = zipped(
            "heroes.ods",
            &[
                ("mimetype", "application/vnd.oasis.opendocument.spreadsheet"),
                ("META-INF/manifest.xml", ODS_MANIFEST),
                ("content.xml", &ods_content()),
            ],
        );
        let sheets = read(&path).unwrap();
        assert_eq!(sheets.iter().map(|s| s.name.as_str()).collect::<Vec<_>>(), ["Heroes", "Ships"]);
        assert_eq!(
            rows(&sheets[0]),
            [["Name", "Born", "Height", "Watch"], ["Aias", "1250-05-17", "2.1", "8:30"], ["Teukros", "", "", "7"]]
        );
        assert_eq!(rows(&sheets[1]), [["Salamis", "12"]]);
    }

    #[test]
    fn a_sheet_that_is_too_large_among_others() {
        let many: String = (0..MAX_ROWS + 5)
            .map(|i| {
                format!(
                    "<table:table-row><table:table-cell office:value-type=\"float\" office:value=\"{i}\"><text:p>{i}</text:p></table:table-cell></table:table-row>"
                )
            })
            .collect();
        let content = ods_content().replace(
            "<table:table table:name=\"Ships\">",
            &format!("<table:table table:name=\"All of them\">{many}</table:table><table:table table:name=\"Ships\">"),
        );
        let (_tmp, path) = zipped(
            "heroes.ods",
            &[
                ("mimetype", "application/vnd.oasis.opendocument.spreadsheet"),
                ("META-INF/manifest.xml", ODS_MANIFEST),
                ("content.xml", &content),
            ],
        );
        let sheets = read(&path).unwrap();
        assert_eq!(sheets.len(), 3);
        assert!(sheets[1].rows.is_empty());
        assert_eq!(
            sheets[1].problem.as_deref(),
            Some("The table has 2005 rows. A table in a text can have 2000 at most: it is not a spreadsheet.")
        );
        assert_eq!(sheets[2].rows.len(), 1);
    }

    /// Files as LibreOffice writes them, made of the text that is beside them: see `tests/fixtures/tables`.
    #[test]
    fn files_as_they_are_written() {
        let dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/tables");
        for name in ["works.csv", "works.ods", "works.xlsx", "works.xls"] {
            let sheets = read(&dir.join(name)).unwrap_or_else(|e| panic!("{name}: {e}"));
            assert_eq!(sheets.len(), 1, "{name}");
            assert_eq!(
                rows(&sheets[0]),
                [
                    ["Work", "Lines", "Share", "Read", "Remark"],
                    ["Iliad", "15693", "0.565", "2024-03-01", "in twenty-four books"],
                    ["Odyssey", "12109", "0.435", "2024-04-15", ""],
                    ["Both", "27802", "1", "", "blåbær, “søt”"],
                ],
                "{name}"
            );
        }
    }
}
