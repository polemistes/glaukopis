//! A forgiving parser for BibTeX and BibLaTeX files.
//!
//! It follows BibTeX's own rules: text outside entries is ignored; an entry is
//! delimited by braces or parentheses; a value is a concatenation, with `#`,
//! of braced text, quoted text, numbers and macro names; braces are counted
//! without regard to backslashes. A malformed entry is reported and skipped,
//! and parsing resumes at the next `@` that begins a line. What is not an
//! entry, and what could not be read, is kept as it stands, so that a file
//! that is written again loses none of it.

use std::collections::HashMap;

use crate::tr;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RawEntry {
    /// Lower-cased: `book`, `article`, …
    pub entry_type: String,
    pub key: String,
    /// Field names lower-cased, values raw with macros resolved and whitespace
    /// normalised. When a field is repeated, the last one stands.
    pub fields: Vec<(String, String)>,
    /// The line on which the entry begins, from 1.
    pub line: usize,
}

impl RawEntry {
    pub fn get(&self, name: &str) -> Option<&str> {
        self.fields.iter().find(|(n, _)| n == name).map(|(_, v)| v.as_str())
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum BibItem {
    Entry(RawEntry),
    Preamble(String),
    Comment(String),
}

/// What stands in a file besides its entries, as it is written there:
/// `@string`, `@preamble` and `@comment`, and what could not be read.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Verbatim {
    /// The line on which it begins, from 1.
    pub line: usize,
    pub text: String,
    /// False for what could not be read, and was skipped.
    pub readable: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParseWarning {
    pub line: usize,
    pub message: String,
}

#[derive(Debug, Default)]
pub struct Parsed {
    pub items: Vec<BibItem>,
    pub strings: HashMap<String, String>,
    pub warnings: Vec<ParseWarning>,
    /// What is not an entry, in the order of the file.
    pub verbatim: Vec<Verbatim>,
}

impl Parsed {
    pub fn entries(&self) -> impl Iterator<Item = &RawEntry> {
        self.items.iter().filter_map(|item| match item {
            BibItem::Entry(e) => Some(e),
            _ => None,
        })
    }

    pub fn into_entries(self) -> Vec<RawEntry> {
        self.items
            .into_iter()
            .filter_map(|item| match item {
                BibItem::Entry(e) => Some(e),
                _ => None,
            })
            .collect()
    }
}

pub fn parse(source: &str) -> Parsed {
    let source = source.strip_prefix('\u{feff}').unwrap_or(source);
    let mut parser = Parser { src: source.as_bytes(), text: source, pos: 0, out: Parsed::default() };
    for (name, value) in MONTHS {
        parser.out.strings.insert((*name).to_owned(), (*value).to_owned());
    }
    parser.run();
    parser.out
}

const MONTHS: &[(&str, &str)] = &[
    ("jan", "1"),
    ("feb", "2"),
    ("mar", "3"),
    ("apr", "4"),
    ("may", "5"),
    ("jun", "6"),
    ("jul", "7"),
    ("aug", "8"),
    ("sep", "9"),
    ("oct", "10"),
    ("nov", "11"),
    ("dec", "12"),
];

struct Parser<'a> {
    src: &'a [u8],
    text: &'a str,
    pos: usize,
    out: Parsed,
}

type PResult<T> = Result<T, String>;

/// What an `@` turned out to begin.
enum Found {
    /// Nothing: a stray `@`, as in an e-mail address in free text.
    Nothing,
    Entry,
    /// `@string`, `@preamble` or `@comment`.
    Other,
}

impl<'a> Parser<'a> {
    fn run(&mut self) {
        while let Some(at) = self.find_next_at() {
            self.pos = at + 1;
            let line = self.line_of(at);
            match self.item(at, line) {
                Ok(Found::Other) => {
                    let text = self.text[at..self.pos].to_owned();
                    self.out.verbatim.push(Verbatim { line, text, readable: true });
                }
                Ok(Found::Nothing | Found::Entry) => {}
                Err(message) => {
                    let failed = self.pos.min(self.src.len());
                    self.recover(at + 1);
                    // A brace that is never closed runs on past the entries that follow: the
                    // entry it was opened in is then the place to look.
                    let line = if self.pos < failed { line } else { self.line_of(failed) };
                    self.out.warnings.push(ParseWarning { line, message });
                    let text = self.text[at..self.pos].trim_end().to_owned();
                    self.out.verbatim.push(Verbatim { line, text, readable: false });
                }
            }
        }
    }

    /// The next `@` outside an entry.
    fn find_next_at(&self) -> Option<usize> {
        self.src[self.pos.min(self.src.len())..].iter().position(|&b| b == b'@').map(|i| i + self.pos)
    }

    /// After an error: continue from the first line after `from` that begins
    /// an entry, an `@` with a word and an opening delimiter after it. Entries
    /// that follow one whose brace was never closed are read all the same.
    fn recover(&mut self, from: usize) {
        let begins_item = |mut j: usize| {
            j += 1;
            let word = j;
            while j < self.src.len() && self.src[j].is_ascii_alphabetic() {
                j += 1;
            }
            while j < self.src.len() && (self.src[j] == b' ' || self.src[j] == b'\t') {
                j += 1;
            }
            j > word && matches!(self.src.get(j), Some(b'{' | b'('))
        };
        let mut i = from;
        while i < self.src.len() {
            if self.src[i] == b'\n' {
                let mut j = i + 1;
                while j < self.src.len() && (self.src[j] == b' ' || self.src[j] == b'\t') {
                    j += 1;
                }
                if j < self.src.len() && self.src[j] == b'@' && begins_item(j) {
                    self.pos = j;
                    return;
                }
            }
            i += 1;
        }
        self.pos = self.src.len();
    }

    fn line_of(&self, pos: usize) -> usize {
        self.src[..pos.min(self.src.len())].iter().filter(|&&b| b == b'\n').count() + 1
    }

    fn peek(&self) -> Option<u8> {
        self.src.get(self.pos).copied()
    }

    fn skip_ws(&mut self) {
        while let Some(b) = self.peek() {
            if b.is_ascii_whitespace() {
                self.pos += 1;
            } else if b == b'%' {
                // A comment to the end of the line, as many files have them between fields.
                while let Some(c) = self.peek() {
                    if c == b'\n' {
                        break;
                    }
                    self.pos += 1;
                }
            } else {
                break;
            }
        }
    }

    fn word(&mut self, stop: impl Fn(u8) -> bool) -> &'a str {
        let start = self.pos;
        while let Some(b) = self.peek() {
            if b.is_ascii_whitespace() || stop(b) {
                break;
            }
            self.pos += 1;
        }
        &self.text[start..self.pos]
    }

    /// Whether nothing but spaces stands before `pos` on its line.
    fn begins_line(&self, pos: usize) -> bool {
        self.src[..pos.min(self.src.len())].iter().rev().take_while(|&&b| b != b'\n').all(|&b| b == b' ' || b == b'\t')
    }

    fn item(&mut self, at: usize, line: usize) -> PResult<Found> {
        self.skip_ws();
        let kind = self.word(|b| matches!(b, b'{' | b'(' | b'@' | b',' | b'=' | b'"' | b'}' | b')'));
        if kind.is_empty() {
            // A stray `@`, as in an e-mail address in free text.
            return Ok(Found::Nothing);
        }
        let kind = kind.to_ascii_lowercase();
        self.skip_ws();
        let open = match self.peek() {
            Some(b @ (b'{' | b'(')) => b,
            // Not an entry after all: an address in free text. Where the `@`
            // begins its line, though, an entry was meant, and its brace
            // forgotten: it is kept as it stands, and said to be wrong,
            // rather than passed over and lost when the file is written.
            _ if self.begins_line(at) => return Err(tr!("core-bib-expected-brace", kind = &kind)),
            _ => return Ok(Found::Nothing),
        };
        let close = if open == b'{' { b'}' } else { b')' };
        self.pos += 1;

        match kind.as_str() {
            "comment" => {
                let text = self.balanced_body(open, close)?;
                self.out.items.push(BibItem::Comment(text));
            }
            "preamble" => {
                self.skip_ws();
                let value = self.value()?;
                self.skip_ws();
                self.expect(close)?;
                self.out.items.push(BibItem::Preamble(value));
            }
            "string" => {
                self.skip_ws();
                let name = self.word(|b| matches!(b, b'=' | b'{' | b'}' | b'"' | b',' | b'#')).to_ascii_lowercase();
                if name.is_empty() {
                    return Err(tr!("core-bib-string-without-name"));
                }
                self.skip_ws();
                self.expect(b'=')?;
                self.skip_ws();
                let value = self.value()?;
                self.skip_ws();
                if self.peek() == Some(b',') {
                    self.pos += 1;
                    self.skip_ws();
                }
                self.expect(close)?;
                self.out.strings.insert(name, value);
            }
            _ => {
                let entry = self.entry(kind, close, line)?;
                self.out.items.push(BibItem::Entry(entry));
                return Ok(Found::Entry);
            }
        }
        Ok(Found::Other)
    }

    fn expect(&mut self, byte: u8) -> PResult<()> {
        match self.peek() {
            Some(b) if b == byte => {
                self.pos += 1;
                Ok(())
            }
            Some(b) => Err(tr!(
                "core-bib-expected-found",
                expected = (byte as char).to_string(),
                found = self.char_at(self.pos).unwrap_or(b as char).to_string()
            )),
            None => Err(tr!("core-bib-expected-end", expected = (byte as char).to_string())),
        }
    }

    fn char_at(&self, pos: usize) -> Option<char> {
        // `pos` may fall inside a multi-byte character only if the input was cut there.
        self.text.get(pos..).and_then(|s| s.chars().next())
    }

    /// The text of a `@comment{…}`, with the closing delimiter consumed.
    fn balanced_body(&mut self, open: u8, close: u8) -> PResult<String> {
        let start = self.pos;
        let mut depth = 1usize;
        while let Some(b) = self.peek() {
            if b == open {
                depth += 1;
            } else if b == close {
                depth -= 1;
                if depth == 0 {
                    let text = self.text[start..self.pos].to_owned();
                    self.pos += 1;
                    return Ok(text);
                }
            }
            self.pos += 1;
        }
        Err(tr!("core-bib-comment-not-closed"))
    }

    fn entry(&mut self, entry_type: String, close: u8, line: usize) -> PResult<RawEntry> {
        self.skip_ws();
        let key_start = self.pos;
        // A key runs to the first comma. Keys with spaces in them occur in files
        // written by hand, and are read as they stand.
        while let Some(b) = self.peek() {
            if b == b',' || b == close || b == b'\n' || b == b'{' || b == b'=' {
                break;
            }
            self.pos += 1;
        }
        let mut key = self.text[key_start..self.pos].trim().to_owned();
        if self.peek() == Some(b'=') {
            // There is no key: what was read is the name of the first field.
            self.pos = key_start;
            key.clear();
        }
        self.skip_ws();

        let mut fields: Vec<(String, String)> = Vec::new();
        loop {
            self.skip_ws();
            match self.peek() {
                None => return Err(tr!("core-bib-entry-not-closed", key = &key)),
                Some(b) if b == close => {
                    self.pos += 1;
                    break;
                }
                Some(b',') => {
                    self.pos += 1;
                    continue;
                }
                Some(_) => {}
            }
            let name_start = self.pos;
            let name =
                self.word(|b| matches!(b, b'=' | b'{' | b'}' | b'"' | b',' | b'#' | b'(' | b')')).to_ascii_lowercase();
            if name.is_empty() {
                return Err(tr!(
                    "core-bib-expected-field",
                    key = &key,
                    found = self.char_at(name_start).unwrap_or(' ').to_string()
                ));
            }
            self.skip_ws();
            if self.peek() != Some(b'=') {
                return Err(tr!("core-bib-field-without-value", key = &key, field = &name));
            }
            self.pos += 1;
            self.skip_ws();
            let value =
                self.value_of(&name).map_err(|e| tr!("core-bib-in-field", key = &key, field = &name, message = e))?;
            if let Some(existing) = fields.iter_mut().find(|(n, _)| *n == name) {
                existing.1 = value;
            } else {
                fields.push((name, value));
            }
        }
        Ok(RawEntry { entry_type, key, fields, line })
    }

    /// A value: parts joined by `#`.
    fn value(&mut self) -> PResult<String> {
        self.value_of("")
    }

    /// The value of a field. In the fields that hold running text, where one
    /// paragraph ends and the next begins is part of the value.
    fn value_of(&mut self, field: &str) -> PResult<String> {
        let mut out = String::new();
        loop {
            self.skip_ws();
            match self.peek() {
                Some(b'{') => {
                    self.pos += 1;
                    let start = self.pos;
                    let mut depth = 1usize;
                    loop {
                        match self.peek() {
                            Some(b'{') => depth += 1,
                            Some(b'}') => {
                                depth -= 1;
                                if depth == 0 {
                                    break;
                                }
                            }
                            Some(_) => {}
                            None => return Err(tr!("core-bib-brace-not-closed")),
                        }
                        self.pos += 1;
                    }
                    out.push_str(&self.text[start..self.pos]);
                    self.pos += 1;
                }
                Some(b'"') => {
                    self.pos += 1;
                    let start = self.pos;
                    let mut depth = 0usize;
                    loop {
                        match self.peek() {
                            Some(b'{') => depth += 1,
                            Some(b'}') => depth = depth.saturating_sub(1),
                            Some(b'"') if depth == 0 => break,
                            Some(_) => {}
                            None => return Err(tr!("core-bib-quote-not-closed")),
                        }
                        self.pos += 1;
                    }
                    out.push_str(&self.text[start..self.pos]);
                    self.pos += 1;
                }
                Some(b) if b.is_ascii_digit() => {
                    let digits = self.word(|b| !b.is_ascii_digit());
                    out.push_str(digits);
                }
                Some(_) => {
                    let name = self.word(|b| matches!(b, b'#' | b',' | b'}' | b')' | b'{' | b'"' | b'='));
                    if name.is_empty() {
                        return Err(tr!(
                            "core-bib-expected-value",
                            found = self.char_at(self.pos).unwrap_or(' ').to_string()
                        ));
                    }
                    match self.out.strings.get(&name.to_ascii_lowercase()) {
                        Some(v) => out.push_str(v),
                        None => {
                            // An unknown macro: keep its name, as BibTeX warns and goes on.
                            let line = self.line_of(self.pos);
                            self.out
                                .warnings
                                .push(ParseWarning { line, message: tr!("core-bib-abbreviation", name = name) });
                            out.push_str(name);
                        }
                    }
                }
                None => return Err(tr!("core-bib-ended-in-value")),
            }
            self.skip_ws();
            if self.peek() == Some(b'#') {
                self.pos += 1;
            } else {
                break;
            }
        }
        Ok(if has_paragraphs(field) { normalise_paragraphs(&out) } else { normalise_space(&out) })
    }
}

/// The fields that hold running text, which may be of several paragraphs.
pub fn has_paragraphs(field: &str) -> bool {
    matches!(field, "annotation" | "annote" | "abstract")
}

/// As `normalise_space`, within each paragraph. Paragraphs, which an empty
/// line sets apart in TeX, are set apart by one empty line.
pub fn normalise_paragraphs(s: &str) -> String {
    let unified = s.replace("\r\n", "\n").replace('\r', "\n");
    let mut paragraphs: Vec<String> = Vec::new();
    let mut current = String::new();
    for line in unified.split('\n') {
        if line.trim().is_empty() {
            if !current.is_empty() {
                paragraphs.push(normalise_space(&current));
                current.clear();
            }
        } else {
            current.push_str(line);
            current.push(' ');
        }
    }
    if !current.is_empty() {
        paragraphs.push(normalise_space(&current));
    }
    paragraphs.retain(|p| !p.is_empty());
    paragraphs.join("\n\n")
}

/// Collapses runs of whitespace, including line breaks, to single spaces.
pub fn normalise_space(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let mut pending = false;
    for c in s.chars() {
        // A non-breaking space is content, not layout.
        if c.is_whitespace() && c != '\u{a0}' && c != '\u{202f}' {
            pending = !out.is_empty();
        } else {
            if pending {
                out.push(' ');
                pending = false;
            }
            out.push(c);
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn one(src: &str) -> RawEntry {
        let parsed = parse(src);
        assert!(parsed.warnings.is_empty(), "{:?}", parsed.warnings);
        let mut entries = parsed.into_entries();
        assert_eq!(entries.len(), 1);
        entries.remove(0)
    }

    #[test]
    fn what_is_not_an_entry_is_kept_as_it_stands() {
        let parsed = parse(
            "% free text\n@string{hmn = {Harvard}}\n@preamble{\"\\newcommand{\\x}{y}\"}\n\
             @book{a, publisher = hmn, title = {A}}\n\
             @book{broken, title = {No end\n\
             @comment{jabref-meta: databaseType:biblatex;}\n@book{b, title = {B}}\n",
        );
        assert_eq!(parsed.warnings.len(), 1);
        let keys: Vec<&str> = parsed.entries().map(|e| e.key.as_str()).collect();
        assert_eq!(keys, ["a", "b"]);
        assert_eq!(parsed.entries().next().unwrap().get("publisher"), Some("Harvard"));
        let kept: Vec<(usize, &str, bool)> =
            parsed.verbatim.iter().map(|v| (v.line, v.text.as_str(), v.readable)).collect();
        assert_eq!(
            kept,
            [
                (2, "@string{hmn = {Harvard}}", true),
                (3, "@preamble{\"\\newcommand{\\x}{y}\"}", true),
                (5, "@book{broken, title = {No end", false),
                (6, "@comment{jabref-meta: databaseType:biblatex;}", true),
            ]
        );
    }

    #[test]
    fn an_entry_without_its_brace_is_kept_and_said_to_be_wrong() {
        // The brace after the type forgotten in a hand-written entry: it is
        // not an entry, but what was meant as one is kept, not lost when the
        // file is written. An address in free text is nothing still.
        let parsed = parse(
            "Write to me@example.org about this.\n@book nagy1979,\n  title = {The Best of the Achaeans}\n}\n\
             @book{b, title = {B}}\n",
        );
        let keys: Vec<&str> = parsed.entries().map(|e| e.key.as_str()).collect();
        assert_eq!(keys, ["b"]);
        assert_eq!(parsed.warnings.len(), 1);
        assert_eq!(parsed.warnings[0].line, 2);
        assert!(parsed.warnings[0].message.contains("@book"), "{}", parsed.warnings[0].message);
        let kept: Vec<(usize, &str, bool)> =
            parsed.verbatim.iter().map(|v| (v.line, v.text.as_str(), v.readable)).collect();
        assert_eq!(kept, [(2, "@book nagy1979,\n  title = {The Best of the Achaeans}\n}", false)]);
    }

    #[test]
    fn a_plain_entry() {
        let e = one(r#"@Book{nagy1979,
  author    = {Nagy, Gregory},
  title     = {The Best of the {Achaeans}: Concepts of the Hero
               in Archaic Greek Poetry},
  year      = 1979,
  publisher = "Johns Hopkins University Press",
  address   = {Baltimore},
}"#);
        assert_eq!(e.entry_type, "book");
        assert_eq!(e.key, "nagy1979");
        assert_eq!(e.get("author"), Some("Nagy, Gregory"));
        assert_eq!(e.get("title"), Some("The Best of the {Achaeans}: Concepts of the Hero in Archaic Greek Poetry"));
        assert_eq!(e.get("year"), Some("1979"));
        assert_eq!(e.get("publisher"), Some("Johns Hopkins University Press"));
        assert_eq!(e.line, 1);
    }

    #[test]
    fn strings_months_and_concatenation() {
        let e = one(r#"@string{jhs = "Journal of Hellenic Studies"}
@STRING(up = {University Press})
@article{x, journal = jhs, month = mar, publisher = "Oxford " # up # {, Oxford}}"#);
        assert_eq!(e.get("journal"), Some("Journal of Hellenic Studies"));
        assert_eq!(e.get("month"), Some("3"));
        assert_eq!(e.get("publisher"), Some("Oxford University Press, Oxford"));
    }

    #[test]
    fn parentheses_quotes_and_nested_braces() {
        let e = one(r#"@misc(k, title = "A {"}quoted{"} word", note = {a {b {c}} d})"#);
        assert_eq!(e.get("title"), Some(r#"A {"}quoted{"} word"#));
        assert_eq!(e.get("note"), Some("a {b {c}} d"));
    }

    #[test]
    fn comments_and_junk_are_skipped() {
        let parsed = parse(
            "This file was made by hand. Write to me@example.org\n\
             % a comment\n\
             @comment{jabref-meta: databaseType:biblatex;}\n\
             @preamble{\"\\newcommand{\\noop}[1]{}\"}\n\
             @book{a, title={A}}\n",
        );
        assert!(parsed.warnings.is_empty(), "{:?}", parsed.warnings);
        assert_eq!(parsed.entries().count(), 1);
        assert_eq!(parsed.items.len(), 3);
    }

    #[test]
    fn recovery_after_a_broken_entry() {
        let parsed = parse(
            "@book{broken, title = {Never closed,\n author = {X}\n\n@book{good, title = {Fine}}\n@article{also, title={Good}}",
        );
        // The broken entry swallows text up to where braces balance or the file
        // ends; what matters is that a warning is given and nothing panics.
        assert!(!parsed.warnings.is_empty());

        let parsed = parse("@book{bad, title = }\n@book{good, title = {Fine}}\n");
        assert_eq!(parsed.warnings.len(), 1);
        let keys: Vec<_> = parsed.entries().map(|e| e.key.clone()).collect();
        assert_eq!(keys, vec!["good"]);
    }

    #[test]
    fn unicode_and_repeated_fields() {
        let e = one("@book{κ, title = {Ἰλιάς}, title = {Ὀδύσσεια}, author = {Ὅμηρος}}");
        assert_eq!(e.key, "κ");
        assert_eq!(e.get("title"), Some("Ὀδύσσεια"));
        assert_eq!(e.fields.len(), 2);
    }

    #[test]
    fn a_byte_order_mark_and_no_trailing_newline() {
        let e = one("\u{feff}@book{a,title={T}}");
        assert_eq!(e.key, "a");
    }

    #[test]
    fn comments_between_fields() {
        let e = one("@book{a,\n  title = {T}, % the title\n  % year = {1900},\n  year = {2000}\n}");
        assert_eq!(e.get("year"), Some("2000"));
    }

    #[test]
    fn undefined_macro_is_kept_with_a_warning() {
        let parsed = parse("@article{a, journal = cq}");
        assert_eq!(parsed.warnings.len(), 1);
        assert_eq!(parsed.entries().next().unwrap().get("journal"), Some("cq"));
    }
}

#[cfg(test)]
mod key_tests {
    use super::*;

    #[test]
    fn odd_keys() {
        let parsed = parse(
            "@book{bad key!, title={A}}\n@book{title={No key}, year=2000}\n@book{,title={Empty}}\n@book{ k ,title={Spaced}}",
        );
        assert!(parsed.warnings.is_empty(), "{:?}", parsed.warnings);
        let e: Vec<_> = parsed.entries().collect();
        assert_eq!(e[0].key, "bad key!");
        assert_eq!(e[1].key, "");
        assert_eq!(e[1].get("title"), Some("No key"));
        assert_eq!(e[1].get("year"), Some("2000"));
        assert_eq!(e[2].key, "");
        assert_eq!(e[3].key, "k");
    }
}
