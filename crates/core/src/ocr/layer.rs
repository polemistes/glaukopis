//! The text a PDF has already, page by page, with where its lines stand:
//! read with pdf-text (pdf-extract, in the tree), as the library reads PDFs (`import/pdf.rs`).
//!
//! Which pages have text decides which are read by Tesseract. A page that
//! has only a little, such as a scan with a stamp or a line at its foot in
//! text, as some archives add, is read all the same; but one that has the
//! text that was laid over it here (`searchable.rs`) has text, however
//! little, so that it is not read and laid over again.

use std::panic::{AssertUnwindSafe, catch_unwind};
use std::path::Path;
use std::sync::{Arc, Mutex, PoisonError, mpsc};
use std::time::Duration;

use std::collections::{BTreeMap, HashMap, HashSet};

use pdf_text::{Document, Glyph, MediaBox, Object, ObjectId, OutputDev, OutputError, Transform};

use super::schemes::{self, Scheme};
use super::text::Line;
use crate::tr;
use crate::written::roman;

/// A page has text when it has at least this many letters and digits.
pub const TEXT_PAGE: usize = 100;

/// How many lines of a page's text are shown before it is taken, and how
/// much of each.
const SAMPLE_LINES: usize = 5;
const SAMPLE_WIDTH: usize = 110;

/// What the text a page has is like.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Verdict {
    /// Too little to count as text: the page is read.
    None,
    /// Text that does not read as text: letters of a font that does not say
    /// which they are, as old fonts of Greek give, or what a poor reading
    /// laid under a scan.
    Poor,
    Sound,
}

/// What may stand before or after a word without making it another thing.
fn around(c: char) -> bool {
    matches!(
        c,
        '.' | ','
            | ';'
            | ':'
            | '!'
            | '?'
            | '\''
            | '"'
            | '’'
            | '‘'
            | '“'
            | '”'
            | '„'
            | '«'
            | '»'
            | '‹'
            | '›'
            | '('
            | ')'
            | '['
            | ']'
            | '{'
            | '}'
            | '-'
            | '–'
            | '—'
            | '…'
            | '·'
            | '*'
            | '†'
            | '‡'
            | '§'
            | '¶'
            | '/'
            | '\u{0387}'
            | '\u{037E}'
            | '¿'
            | '¡'
            | '°'
            | '%'
    ) || c.is_ascii_digit()
}

/// The script of a letter, roughly: enough to tell a word that mixes them.
fn script(c: char) -> u8 {
    match c as u32 {
        0x0041..=0x024F | 0x1E00..=0x1EFF => 1,
        0x0370..=0x03FF | 0x1F00..=0x1FFF => 2,
        0x0400..=0x052F => 3,
        _ => 0,
    }
}

/// Whether a word, without what stands around it, is shaped as a word is:
/// letters of one script, with an apostrophe, a hyphen or a point within
/// (`l'homme`, `well-known`, `i.e`); or a number. A capital after a small
/// letter is not, except in a name of two capitals (`McNeill`, `DuBois`).
fn shaped(core: &str) -> bool {
    if core.chars().all(|c| c.is_ascii_digit() || matches!(c, '.' | ',' | ':' | '-' | '–' | '/')) {
        return true;
    }
    let mut scripts = 0u8;
    let mut raised = 0;
    let mut small_before = false;
    for c in core.chars() {
        if c.is_alphabetic() {
            if c.is_uppercase() && small_before {
                raised += 1;
            }
            small_before = c.is_lowercase();
            let s = script(c);
            if s != 0 {
                scripts |= 1 << s;
            }
        } else if !matches!(
            c,
            '\'' | '’'
                | '-'
                | '‐'
                | '.'
                | '·'
                | '\u{0313}'
                | '\u{0314}'
                | '\u{0301}'
                | '\u{0300}'
                | '\u{0342}'
                | '\u{0345}'
                | '\u{0308}'
        ) {
            return false;
        }
    }
    scripts.count_ones() <= 1 && raised <= 1
}

/// Whether text reads as text. It does not where many of its words are
/// not shaped as words (`Mh=nin a)/eide`, `ÌÞíé¶`), where many characters
/// stand for nothing (the character of what could not be told, or those a
/// font keeps for itself), or where most of its letters are the accented
/// letters of Western Europe, as Greek or Cyrillic read in the wrong
/// encoding become.
pub fn sound(text: &str) -> bool {
    let chars: Vec<char> = text.chars().filter(|c| !c.is_whitespace()).collect();
    if chars.is_empty() {
        return false;
    }
    let nothing = chars
        .iter()
        .filter(|c| matches!(**c as u32, 0xFFFD | 0xE000..=0xF8FF | 0x0000..=0x001F | 0x007F..=0x009F))
        .count();
    if nothing * 50 > chars.len() {
        return false;
    }
    let letters: Vec<char> = chars.iter().copied().filter(|c| c.is_alphabetic()).collect();
    let western = letters.iter().filter(|c| matches!(**c as u32, 0x00C0..=0x00FF)).count();
    if letters.len() >= 20 && western * 10 > letters.len() * 3 {
        return false;
    }
    let mut words = 0;
    let mut good = 0;
    for token in text.split_whitespace() {
        let core = token.trim_matches(around);
        if core.is_empty() {
            continue;
        }
        words += 1;
        if shaped(core) {
            good += 1;
        }
    }
    words > 0 && good * 4 >= words * 3
}

/// A page whose content is larger than this, as it is stored, is a drawing,
/// and reading it for the sake of its text takes long.
const LARGEST_PAGE: usize = 4 << 20;

/// What was read of the text of a PDF.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct Layer {
    /// The pages, each with the lines of its text as the PDF's own map gives
    /// it; nothing where the page could not be read, or the time was up
    /// before it was.
    pub pages: Vec<Option<Vec<Line>>>,
    /// The number each page has in print, where the file tells it: `xiv`,
    /// `A-3`. The number of the page, counted from one, where it does not.
    pub labels: Vec<String>,
    /// Whether the file is locked (encrypted): what is added to it would have
    /// to be locked in the same way. One that opens without a password has
    /// its text read; one that asks for a password has not.
    pub locked: bool,
    /// The pages that have the text that was laid over them here.
    pub laid: Vec<bool>,
    /// The pages' lines as translated by the schemes (`schemes/`), where
    /// any applied on the page; nothing where none did (ADR 0044).
    pub translated: Vec<Option<Vec<Line>>>,
    /// The schemes that applied on each page, each with the font it applied in.
    pub schemes: Vec<Vec<(Scheme, String)>>,
    /// The fonts whose glyphs were translated, each with every code seen of
    /// it and the text it stands for: the right map of the font, to be
    /// written into a PDF made readable.
    pub maps: HashMap<ObjectId, BTreeMap<u32, String>>,
    /// The fonts of the text, by their names without the prefix of a
    /// subset, with how many glyphs of each were read.
    pub fonts: BTreeMap<String, usize>,
}

impl Layer {
    /// Whether a page has text enough not to be read by Tesseract: as the
    /// PDF has it, or as translated.
    pub fn has_text(&self, index: usize) -> bool {
        let letters = |lines: Option<&Vec<Line>>| -> usize {
            lines.map_or(0, |lines| lines.iter().map(|l| l.text.chars().filter(|c| c.is_alphanumeric()).count()).sum())
        };
        self.laid.get(index).copied().unwrap_or(false)
            || letters(self.pages.get(index).and_then(Option::as_ref))
                .max(letters(self.translated.get(index).and_then(Option::as_ref)))
                >= TEXT_PAGE
    }

    /// The lines of a page as translated, where the schemes applied on it;
    /// else as the PDF has them.
    pub fn best_lines(&self, index: usize) -> Option<&Vec<Line>> {
        self.translated.get(index).and_then(Option::as_ref).or_else(|| self.pages.get(index).and_then(Option::as_ref))
    }

    /// What the text of a page is like: none, enough to count, and whether
    /// it reads as text or as what a font without its letters gives. The
    /// text as translated is judged, where there is a translation.
    pub fn verdict(&self, index: usize) -> Verdict {
        if self.laid.get(index).copied().unwrap_or(false) {
            return Verdict::Sound;
        }
        if !self.has_text(index) {
            return Verdict::None;
        }
        let lines = self.best_lines(index).map(Vec::as_slice).unwrap_or_default();
        let text = lines.iter().map(|l| l.text.as_str()).collect::<Vec<_>>().join("\n");
        if sound(&text) { Verdict::Sound } else { Verdict::Poor }
    }

    /// The first lines of the first page that has text, to be shown before
    /// it is taken: the page counted from nought, the lines as the PDF has
    /// them, and as translated where the page has a translation.
    pub fn sample(&self) -> Option<(usize, Vec<String>, Option<Vec<String>>)> {
        let index = (0..self.pages.len()).find(|i| self.has_text(*i))?;
        let lines = self.pages[index].as_deref().unwrap_or_default();
        let shown = sample_of(lines);
        let translated = self.translated.get(index).and_then(Option::as_ref).map(|t| sample_of(t));
        (!shown.is_empty() || translated.is_some()).then_some((index, shown, translated))
    }

    /// The schemes that applied anywhere, each with the fonts it applied in
    /// and on how many pages, the most used first.
    pub fn schemes_found(&self) -> Vec<(Scheme, Vec<String>, usize)> {
        let mut found: Vec<(Scheme, Vec<String>, usize)> = Vec::new();
        for page in &self.schemes {
            let mut on_page: Vec<Scheme> = Vec::new();
            for (scheme, font) in page {
                let at = match found.iter().position(|(s, _, _)| s == scheme) {
                    Some(at) => at,
                    None => {
                        found.push((*scheme, Vec::new(), 0));
                        found.len() - 1
                    }
                };
                if !font.is_empty() && !found[at].1.contains(font) {
                    found[at].1.push(font.clone());
                }
                if !on_page.contains(scheme) {
                    on_page.push(*scheme);
                    found[at].2 += 1;
                }
            }
        }
        found.sort_by_key(|a| std::cmp::Reverse(a.2));
        found
    }

    /// The label of a page, counted from nought.
    pub fn label(&self, index: usize) -> String {
        self.labels.get(index).cloned().unwrap_or_else(|| (index + 1).to_string())
    }
}

/// The first lines of a page that have words, cut to be shown.
fn sample_of(lines: &[Line]) -> Vec<String> {
    lines
        .iter()
        .map(|l| l.text.trim())
        .filter(|t| t.chars().filter(|c| c.is_alphanumeric()).count() >= 3)
        .take(SAMPLE_LINES)
        .map(|t| {
            let mut cut: String = t.chars().take(SAMPLE_WIDTH).collect();
            if t.chars().count() > SAMPLE_WIDTH {
                cut.push('…');
            }
            cut
        })
        .collect()
}

/// Gathers the characters of a page into lines, with where each stands.
///
/// The library hands over the characters one by one with the place of
/// each, in the space of the page (from its bottom left, upwards). A new
/// line begins wherever the writing moves off the line by half its height;
/// a space is put wherever it moves on by more than a tenth of it, at the
/// beginning of a run of characters. As `import/pdf.rs` does it.
///
/// Each character is put twice, in step: as the PDF's own map gives it, and
/// as translated by the name of its glyph where a scheme knows the name and
/// the map is wrong (ADR 0044).
#[derive(Default)]
struct Gatherer {
    /// The lines, with where they stand; their text is made of `parts` at the end.
    lines: Vec<Line>,
    /// The parts of each line, in step with `lines`: where the writing
    /// jumps back to the left on the same line, a part begins, and the parts
    /// are put in their order on the page when the line is done. A speaker's
    /// name drawn after the verse it stands before comes first so.
    parts: Vec<Vec<Part>>,
    /// Whether a glyph's name was translated on each line, in step with `lines`.
    named: Vec<bool>,
    /// The font of the last glyph of each line, in step with `lines`.
    fonts: Vec<String>,
    /// The schemes that applied on the page, with the fonts.
    schemes: Vec<(Scheme, String)>,
    /// Every code seen of each font, with what it stands for.
    maps: HashMap<ObjectId, BTreeMap<u32, String>>,
    /// The fonts of which a glyph was translated.
    translated_fonts: HashSet<ObjectId>,
    /// How many glyphs of each font were read.
    font_counts: BTreeMap<String, usize>,
    /// The top of the page, from which lines are measured down.
    top: f64,
    /// Where the last character ended.
    end: (f64, f64),
    /// The height of the last character.
    size: f64,
    /// Whether a run of characters begins: only there are spaces and lines told.
    begins: bool,
}

/// A part of a line: where it begins, and its text as the PDF has it and as translated.
#[derive(Default)]
struct Part {
    left: f64,
    text: String,
    translated: String,
}

type Told = std::result::Result<(), OutputError>;

/// Whether a character's text is only marks, accents and breathings, which
/// stand over a letter and are not a letter of their own.
fn only_marks(text: &str) -> bool {
    !text.is_empty()
        && text.chars().all(|c| {
            matches!(c,
                '\u{0300}'..='\u{036f}'
                | '\u{0384}' | '\u{0385}'
                | '\u{1fbd}' | '\u{1fbf}'..='\u{1fc1}'
                | '\u{1fcd}'..='\u{1fcf}'
                | '\u{1fdd}'..='\u{1fdf}'
                | '\u{1fed}'..='\u{1fef}'
                | '\u{1ffd}' | '\u{1ffe}'
                | '\u{00b4}' | '`' | '\u{00a8}' | '\u{02dc}')
        })
}

impl Gatherer {
    fn line_for(&mut self, x: f64, baseline: f64, size: f64) {
        let top = (self.top - baseline - size) as f32;
        let bottom = (self.top - baseline) as f32;
        self.lines.push(Line {
            text: String::new(),
            left: x as f32,
            right: x as f32,
            top,
            bottom,
            ..Default::default()
        });
        self.parts.push(vec![Part { left: x, ..Part::default() }]);
        self.named.push(false);
        self.fonts.push(String::new());
    }

    /// Puts a character where it stands: as the PDF's map gives it, and as
    /// translated. A mark stands over the letter before it: it moves nothing
    /// on, and no space is put before it.
    fn put(&mut self, trm: &Transform, width: f64, font_size: f64, char: &str, shown: &str, mark: bool) {
        let stretch = trm.m11.hypot(trm.m12);
        let size = (font_size * trm.m21.hypot(trm.m22)).abs();
        let direction = if stretch > 0.0 { (trm.m11 / stretch, trm.m12 / stretch) } else { (1.0, 0.0) };
        let (x, y) = (trm.m31, trm.m32);
        let mut new_line = self.lines.is_empty();
        let mut space = false;
        let mut back = false;
        if (self.begins || mark) && !new_line {
            let (dx, dy) = (x - self.end.0, y - self.end.1);
            let along = dx * direction.0 + dy * direction.1;
            let across = (dy * direction.0 - dx * direction.1).abs();
            // Superscripts are smaller than the line they belong to.
            let height = size.max(self.size);
            if across > height * 0.5 {
                new_line = true;
            } else if mark {
                // Over the letter before it, wherever it is drawn.
            } else if along < -height {
                back = true;
            } else if along > size * 0.1 {
                space = true;
            }
        }
        let advance = width * font_size.abs() * stretch;
        let (right, bottom) = ((x + direction.0 * advance) as f32, (self.top - y) as f32);
        if new_line {
            self.line_for(x, y, size);
        } else if back && let Some(parts) = self.parts.last_mut() {
            parts.push(Part { left: x, ..Part::default() });
        }
        let part = self.parts.last_mut().and_then(|p| p.last_mut()).expect("there is a part");
        if space && !part.text.is_empty() && !part.text.ends_with(' ') {
            part.text.push(' ');
            part.translated.push(' ');
        }
        part.text.push_str(char);
        part.translated.push_str(shown);
        let line = self.lines.last_mut().expect("there is a line");
        line.left = line.left.min(x as f32);
        line.right = line.right.max(right);
        line.top = line.top.min(bottom - size as f32);
        line.bottom = line.bottom.max(bottom);
        if !mark {
            self.begins = false;
            self.end = (x + direction.0 * advance, y + direction.1 * advance);
            self.size = size;
        }
    }
}

impl OutputDev for Gatherer {
    fn begin_page(&mut self, _: u32, media_box: &MediaBox, _: Option<(f64, f64, f64, f64)>) -> Told {
        self.top = media_box.ury.max(media_box.lly);
        Ok(())
    }

    fn end_page(&mut self) -> Told {
        Ok(())
    }

    fn output_character(&mut self, trm: &Transform, width: f64, _spacing: f64, font_size: f64, char: &str) -> Told {
        self.put(trm, width, font_size, char, char, false);
        Ok(())
    }

    fn output_glyph(
        &mut self,
        trm: &Transform,
        width: f64,
        _spacing: f64,
        font_size: f64,
        char: &str,
        glyph: &Glyph,
    ) -> Told {
        let mut shown = char.to_owned();
        let mut named = false;
        if let Some(name) = glyph.name
            && schemes::map_is_wrong(char, name)
            && let Some((scheme, text)) = schemes::by_name(name)
        {
            shown = text;
            named = true;
            let font = glyph.font_name.to_owned();
            if !self.schemes.contains(&(scheme, font.clone())) {
                self.schemes.push((scheme, font));
            }
            if let Some(id) = glyph.font {
                self.translated_fonts.insert(id);
            }
        }
        if let Some(id) = glyph.font
            && !shown.is_empty()
        {
            // In the font's map, marks drawn as glyphs of their own are the
            // combining marks, which a reader puts onto the letter before.
            let in_map = glyph.name.filter(|_| named).and_then(schemes::combining_of).unwrap_or_else(|| shown.clone());
            self.maps.entry(id).or_default().entry(glyph.code).or_insert(in_map);
        }
        // A mark is known by what it is translated to, or by what a Greek
        // font's map gives for it: a Latin font's accents are letters' business.
        let mark = only_marks(&shown) && (named || glyph.name.is_some_and(schemes::is_mark_name));
        self.put(trm, width, font_size, char, &shown, mark);
        if named && let Some(n) = self.named.last_mut() {
            *n = true;
        }
        if let Some(f) = self.fonts.last_mut() {
            glyph.font_name.clone_into(f);
        }
        if !glyph.font_name.is_empty() && !char.trim().is_empty() {
            *self.font_counts.entry(glyph.font_name.to_owned()).or_default() += 1;
        }
        Ok(())
    }

    fn begin_word(&mut self) -> Told {
        self.begins = true;
        Ok(())
    }

    fn end_word(&mut self) -> Told {
        Ok(())
    }

    fn end_line(&mut self) -> Told {
        Ok(())
    }
}

/// What was read of one page.
#[derive(Default)]
struct PageRead {
    lines: Vec<Line>,
    translated: Option<Vec<Line>>,
    schemes: Vec<(Scheme, String)>,
    maps: HashMap<ObjectId, BTreeMap<u32, String>>,
    fonts: BTreeMap<String, usize>,
}

/// The lines of a page, as far as they can be read, as the PDF has them and
/// as translated. The library panics on fonts and encodings it does not
/// know; what it had read by then is kept.
fn page_lines(doc: &Document, number: u32) -> Option<PageRead> {
    let stored: usize = doc
        .get_pages()
        .get(&number)
        .map(|page| doc.get_page_contents(*page))
        .unwrap_or_default()
        .into_iter()
        .filter_map(|id| doc.get_object(id).and_then(Object::as_stream).ok())
        .map(|stream| stream.content.len())
        .sum();
    if stored > LARGEST_PAGE {
        return None;
    }
    let mut gatherer = Gatherer::default();
    match catch_unwind(AssertUnwindSafe(|| pdf_text::output_doc_page(doc, &mut gatherer, number))) {
        Ok(Ok(())) => {}
        Ok(Err(e)) => tracing::debug!(%e, number, "a page of the PDF could not be read to its end"),
        Err(_) => tracing::debug!(number, "a page of the PDF could not be read to its end"),
    }
    let Gatherer { lines, parts, named, fonts, mut schemes, maps, translated_fonts, font_counts, .. } = gatherer;
    let mut out_lines = Vec::new();
    let mut out_translated = Vec::new();
    let mut any = !schemes.is_empty();
    for (((line, mut parts), named), font) in lines.into_iter().zip(parts).zip(named).zip(fonts) {
        parts.sort_by(|a, b| a.left.total_cmp(&b.left));
        let join = |pick: fn(&Part) -> &str| -> String {
            parts.iter().map(|p| pick(p).trim()).filter(|t| !t.is_empty()).collect::<Vec<_>>().join(" ")
        };
        let text = join(|p| &p.text);
        let mut shown = join(|p| &p.translated);
        if named {
            shown = schemes::mend_greek(&shown);
        } else if let Some(greek) = schemes::beta_code(&shown) {
            shown = greek;
            any = true;
            if !schemes.contains(&(Scheme::BetaCode, font.clone())) {
                schemes.push((Scheme::BetaCode, font));
            }
        }
        if text.is_empty() && shown.is_empty() {
            continue;
        }
        out_lines.push(Line { text, ..line.clone() });
        out_translated.push(Line { text: shown, ..line });
    }
    out_lines.retain(|l| !l.text.is_empty());
    let maps = maps.into_iter().filter(|(id, _)| translated_fonts.contains(id)).collect();
    Some(PageRead { lines: out_lines, translated: any.then_some(out_translated), schemes, maps, fonts: font_counts })
}

// ---------------------------------------------------------------------------
// The numbers of the pages in print
// ---------------------------------------------------------------------------

/// A number in letters, as PDF numbers pages so: a to z, then aa to zz.
fn letters(n: usize) -> String {
    let letter = char::from(b'a' + ((n.max(1) - 1) % 26) as u8);
    std::iter::repeat_n(letter, (n.max(1) - 1) / 26 + 1).collect()
}

/// How a range of pages is numbered: from its first page, in a style, with
/// words before the number, beginning with a number.
#[derive(Debug, Clone, PartialEq, Eq)]
struct Numbering {
    from: usize,
    style: Option<u8>,
    prefix: String,
    start: usize,
}

impl Numbering {
    fn label(&self, index: usize) -> String {
        let n = self.start + index - self.from;
        let number = match self.style {
            Some(b'D') => n.to_string(),
            Some(b'R') => roman::of(u32::try_from(n).unwrap_or(u32::MAX)).to_uppercase(),
            Some(b'r') => roman::of(u32::try_from(n).unwrap_or(u32::MAX)),
            Some(b'A') => letters(n).to_uppercase(),
            Some(b'a') => letters(n),
            _ => String::new(),
        };
        format!("{}{number}", self.prefix)
    }
}

/// The ranges of the number tree of `/PageLabels`: its `/Nums`, and those
/// of its kids. A tree that is broken gives what could be read of it.
fn numberings(doc: &Document, node: &Object, into: &mut Vec<Numbering>, depth: usize) {
    let Some(node) = doc.dereference(node).ok().and_then(|(_, o)| o.as_dict().ok()) else { return };
    if depth > 16 {
        return;
    }
    if let Ok(kids) = node.get(b"Kids").and_then(Object::as_array) {
        for kid in kids {
            numberings(doc, kid, into, depth + 1);
        }
    }
    let Ok(nums) = node.get(b"Nums").and_then(Object::as_array) else { return };
    for pair in nums.chunks(2) {
        let [key, value] = pair else { continue };
        let Ok(from) = key.as_i64() else { continue };
        let Some(dict) = doc.dereference(value).ok().and_then(|(_, o)| o.as_dict().ok()) else { continue };
        let style = dict.get(b"S").and_then(Object::as_name).ok().and_then(|name| name.first().copied());
        let prefix = dict
            .get(b"P")
            .ok()
            .and_then(|p| pdf_text::decode_text_string(p).ok())
            .map(|p| p.trim_start_matches('\u{feff}').to_owned())
            .unwrap_or_default();
        let start = dict.get(b"St").and_then(Object::as_i64).ok().filter(|s| *s > 0).unwrap_or(1);
        into.push(Numbering { from: from.max(0) as usize, style, prefix, start: start as usize });
    }
}

/// The labels of the pages, as the catalogue of the document gives them;
/// the number of each page, counted from one, where it gives none.
fn labels(doc: &Document, pages: usize) -> Vec<String> {
    let mut ranges = Vec::new();
    if let Ok(tree) = doc.catalog().and_then(|c| c.get(b"PageLabels")) {
        numberings(doc, tree, &mut ranges, 0);
    }
    ranges.sort_by_key(|r| r.from);
    (0..pages)
        .map(|index| match ranges.iter().rev().find(|r| r.from <= index) {
            Some(range) => range.label(index),
            None => (index + 1).to_string(),
        })
        .map(|label| label.trim().to_owned())
        .enumerate()
        .map(|(index, label)| if label.is_empty() { (index + 1).to_string() } else { label })
        .collect()
}

// ---------------------------------------------------------------------------
// Reading the file
// ---------------------------------------------------------------------------

fn keep(layer: &Mutex<Layer>, change: impl FnOnce(&mut Layer)) {
    change(&mut layer.lock().unwrap_or_else(PoisonError::into_inner));
}

fn read_into(bytes: &[u8], layer: &Mutex<Layer>) {
    let mut doc = match catch_unwind(|| Document::load_mem(bytes)) {
        // It asks for a password.
        Ok(Ok(doc)) if doc.is_encrypted() => return keep(layer, |l| l.locked = true),
        Ok(Ok(doc)) => doc,
        _ => return,
    };
    // It opened without one, and is locked all the same.
    let locked = doc.was_encrypted();
    // The pictures of a scan are most of the file and of no use here.
    for object in doc.objects.values_mut() {
        if let Object::Stream(stream) = object
            && stream.dict.get(b"Subtype").and_then(Object::as_name).is_ok_and(|name| name == b"Image")
        {
            stream.content = Vec::new();
        }
    }
    let pages = doc.get_pages();
    let count = pages.len();
    let labels = labels(&doc, count);
    let laid = pages
        .values()
        .map(|id| doc.get_dictionary(*id).is_ok_and(|page| super::searchable::has_laid(&doc, page)))
        .collect();
    keep(layer, |l| {
        l.labels = labels;
        l.pages = vec![None; count];
        l.laid = laid;
        l.locked = locked;
    });
    keep(layer, |l| {
        l.translated = vec![None; count];
        l.schemes = vec![Vec::new(); count];
    });
    for number in 1..=count {
        let read = page_lines(&doc, number as u32);
        keep(layer, |l| match read {
            Some(page) => {
                l.pages[number - 1] = Some(page.lines);
                l.translated[number - 1] = page.translated;
                l.schemes[number - 1] = page.schemes;
                for (font, count) in page.fonts {
                    *l.fonts.entry(font).or_default() += count;
                }
                for (font, codes) in page.maps {
                    let all = l.maps.entry(font).or_default();
                    for (code, text) in codes {
                        all.entry(code).or_insert(text);
                    }
                }
            }
            None => l.pages[number - 1] = None,
        });
    }
}

/// Reads the text of a PDF, on a thread of its own, and waits for it no
/// longer than `patience`: a library that has lost itself in a file cannot
/// be stopped otherwise. What was read when the time was up is what is known;
/// the pages that were not read are taken to have no text.
pub fn read(bytes: Arc<Vec<u8>>, patience: Duration) -> Layer {
    let layer = Arc::new(Mutex::new(Layer::default()));
    let (done, wait) = mpsc::channel();
    let work = {
        let layer = Arc::clone(&layer);
        move || {
            if catch_unwind(AssertUnwindSafe(|| read_into(&bytes, &layer))).is_err() {
                tracing::warn!("the text of the PDF could not be read to its end");
            }
            let _ = done.send(());
        }
    };
    // Page trees and forms within forms are read by recursion.
    match std::thread::Builder::new().name("pdf-text".into()).stack_size(16 << 20).spawn(work) {
        Ok(_) => {
            if wait.recv_timeout(patience).is_err() {
                tracing::warn!("reading the text of the PDF took too long and was given up");
            }
        }
        Err(e) => tracing::warn!(%e, "no thread could be started for reading the PDF"),
    }
    let layer = layer.lock().unwrap_or_else(PoisonError::into_inner);
    layer.clone()
}

/// How long the text of a file of this size may take to read.
pub fn patience(bytes: usize) -> Duration {
    // Half a minute, and a second more for every two megabytes.
    Duration::from_secs(30 + (bytes >> 21) as u64)
}

/// Reads the text of a PDF file.
pub fn read_file(path: &Path) -> crate::Result<Layer> {
    use crate::error::IoContext;
    let bytes = std::fs::read(path).context(|| tr!("io-reading", path = path))?;
    let wait = patience(bytes.len());
    Ok(read(Arc::new(bytes), wait))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn text_that_reads_and_text_that_does_not() {
        for good in [
            "The wrath of Achilles is the subject of the Iliad, as Milman Parry (1928) showed; cf. pp. 23–45.",
            "Μῆνιν ἄειδε θεὰ Πηληϊάδεω Ἀχιλῆος οὐλομένην, ἣ μυρί᾽ Ἀχαιοῖς ἄλγε᾽ ἔθηκε,",
            "Det var en gang en konge som hadde tre døtre, og «den yngste» var vakrest av dem alle.",
            "L'homme est né libre, et partout il est dans les fers. Tel se croit le maître des autres.",
            "Война и мир — роман-эпопея Льва Николаевича Толстого, описывающий русское общество.",
            "McNeill and DuBois wrote on the well-known e.g. matters of 1.2.3, in §4 and ¶7.",
        ] {
            assert!(sound(good), "{good}");
        }
        for poor in [
            // Beta code, as an old font of Greek keeps the letters.
            "Mh=nin a)/eide qea\\ Phlhi+a/dew *)Axilh=os ou)lome/nhn, h(\\ muri/' *)Axaioi=s a)/lge' e)/qhke,",
            // Greek read in the encoding of Western Europe.
            "ÌÞíéí ¢åéäå èåÜ Ðçëçúáäåù ¢÷éëÞïò ïõëïìÝíçí, ç ìõñß¢ ¢÷áéïÿò Üëãå¢ Ýèçêå",
            // What a font that keeps its letters to itself gives.
            "\u{F041}\u{F042}\u{F043} \u{F044}\u{F045} \u{F046}\u{F047}\u{F048} \u{F049}\u{F04A} \u{F04B}",
            // A poor reading under a scan.
            "Tbe vvr@th 0f Ach1lles iS tbe sub]ect 0f tbe I1iad, as Mi1man P@rry sh0w#d; c£ pp. 2З–4S.",
        ] {
            assert!(!sound(poor), "{poor}");
        }
    }

    #[test]
    fn numbers_in_print() {
        assert_eq!(letters(1), "a");
        assert_eq!(letters(27), "aa");
        assert_eq!(letters(53), "aaa");
        let front = Numbering { from: 0, style: Some(b'r'), prefix: String::new(), start: 1 };
        let body = Numbering { from: 4, style: Some(b'D'), prefix: "A-".into(), start: 3 };
        assert_eq!(front.label(2), "iii");
        assert_eq!(body.label(4), "A-3");
        assert_eq!(body.label(6), "A-5");
        let cover = Numbering { from: 0, style: None, prefix: "Cover".into(), start: 1 };
        assert_eq!(cover.label(0), "Cover");
    }

    #[test]
    fn the_labels_a_catalogue_gives() {
        use lopdf::{Dictionary, dictionary};
        let mut doc = Document::with_version("1.7");
        let pages = doc.new_object_id();
        let kids: Vec<Object> = (0..5)
            .map(|_| {
                let page = doc.add_object(dictionary! { "Type" => "Page", "Parent" => pages });
                Object::Reference(page)
            })
            .collect();
        doc.objects.insert(pages, Object::Dictionary(dictionary! { "Type" => "Pages", "Kids" => kids, "Count" => 5 }));
        let numbering: Dictionary = dictionary! {
            "Nums" => vec![
                0.into(), Object::Dictionary(dictionary! { "S" => "r" }),
                2.into(), Object::Dictionary(dictionary! { "S" => "D", "St" => 7 }),
            ],
        };
        let catalog = doc.add_object(dictionary! { "Type" => "Catalog", "Pages" => pages, "PageLabels" => numbering });
        doc.trailer.set("Root", catalog);
        assert_eq!(labels(&doc, 5), vec!["i", "ii", "7", "8", "9"]);

        // Without a tree the pages are counted.
        doc.catalog_mut().unwrap().remove(b"PageLabels");
        assert_eq!(labels(&doc, 3), vec!["1", "2", "3"]);
    }

    #[test]
    fn what_is_not_a_pdf_has_no_text() {
        let layer = read(Arc::new(b"no pdf".to_vec()), Duration::from_secs(5));
        assert!(layer.pages.is_empty() && !layer.locked);
        assert!(!layer.has_text(0));
        assert_eq!(layer.label(4), "5");
    }
}
