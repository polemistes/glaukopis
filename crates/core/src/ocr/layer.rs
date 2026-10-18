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
use super::shape::OutlineEntry;
use super::text::{Gap, Line, Run, Style};
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

/// Nor is a page read whose content, unpacked, is larger than this: a page
/// of text, even one whose every glyph is placed on its own, as old readings
/// of scans place them, comes to a fraction of it, and a stream that packs
/// small and unpacks without end is how a file makes a reader lose itself.
pub(crate) const LARGEST_UNPACKED: u64 = 32 << 20;

/// Whether a page's content, as stored or unpacked, is too large to be read
/// for its text. A stream packed with Flate is unpacked as far as the limit
/// and no further; one packed otherwise is counted as stored.
pub(crate) fn too_large(doc: &Document, number: u32, stored_limit: usize) -> bool {
    use std::io::Read;
    let streams: Vec<&pdf_text::Stream> = doc
        .get_pages()
        .get(&number)
        .map(|page| doc.get_page_contents(*page))
        .unwrap_or_default()
        .into_iter()
        .filter_map(|id| doc.get_object(id).and_then(Object::as_stream).ok())
        .collect();
    let stored: usize = streams.iter().map(|s| s.content.len()).sum();
    if stored > stored_limit {
        return true;
    }
    let mut unpacked: u64 = 0;
    for stream in streams {
        let filters: Vec<&[u8]> = match stream.dict.get(b"Filter") {
            Ok(Object::Name(name)) => vec![name.as_slice()],
            Ok(Object::Array(list)) => list.iter().filter_map(|f| f.as_name().ok()).collect(),
            _ => Vec::new(),
        };
        let left = LARGEST_UNPACKED.saturating_sub(unpacked);
        unpacked += match filters.as_slice() {
            [] => stream.content.len() as u64,
            [flate] if *flate == b"FlateDecode" => {
                let mut counted = flate2::read::ZlibDecoder::new(stream.content.as_slice()).take(left + 1);
                std::io::copy(&mut counted, &mut std::io::sink()).unwrap_or(0)
            }
            _ => stream.content.len() as u64,
        };
        if unpacked > LARGEST_UNPACKED {
            return true;
        }
    }
    false
}

/// The content of a stream unpacked, where it comes to no more than `left`
/// bytes; nothing where it would come to more, or is packed in a way not
/// unpacked here. It is for what is unpacked in the application's own
/// process, where no limit of the process stands guard: Flate is unpacked
/// as far as the limit and no further, kept as far as it went where the
/// stream is broken, as the PDF library keeps it; ASCII85 comes to at most
/// four bytes for each it has and is unpacked by the library. LZW, which
/// can unpack to thousands of times its size and cannot be stopped midway
/// in the library, and filters with a predictor, which no content of a
/// page has in practice, are not unpacked.
pub(crate) fn unpacked_within(stream: &pdf_text::Stream, left: u64) -> Option<Vec<u8>> {
    use std::io::Read;
    let filters: Vec<&[u8]> = match stream.dict.get(b"Filter") {
        Err(_) => Vec::new(),
        Ok(Object::Name(name)) => vec![name.as_slice()],
        Ok(Object::Array(list)) => list.iter().map(|f| f.as_name().ok()).collect::<Option<_>>()?,
        Ok(_) => return None,
    };
    if stream.dict.has(b"DecodeParms") && !filters.is_empty() {
        return None;
    }
    let mut data = stream.content.clone();
    for filter in filters {
        data = match filter {
            b"FlateDecode" => {
                let mut out = Vec::new();
                let inflated = flate2::read::ZlibDecoder::new(data.as_slice()).take(left + 1).read_to_end(&mut out);
                if inflated.is_err() && out.is_empty() && data.len() > 2 {
                    // A broken checksum, as in some encrypted files: as raw deflate after the header.
                    let _ = flate2::read::DeflateDecoder::new(&data[2..]).take(left + 1).read_to_end(&mut out);
                }
                out
            }
            b"ASCII85Decode" => {
                let alone = pdf_text::Stream::new(lopdf::dictionary! { "Filter" => "ASCII85Decode" }, data);
                alone.decompressed_content().ok()?
            }
            _ => return None,
        };
        if data.len() as u64 > left {
            return None;
        }
    }
    (data.len() as u64 <= left).then_some(data)
}

/// What was read of the text of a PDF. It is carried as JSON from the
/// process that reads it (`isolated.rs`).
#[derive(Debug, Clone, Default, PartialEq, serde::Serialize, serde::Deserialize)]
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
    #[serde(with = "pairs")]
    pub maps: HashMap<ObjectId, BTreeMap<u32, String>>,
    /// The fonts of the text, by their names without the prefix of a
    /// subset, with how many glyphs of each were read.
    pub fonts: BTreeMap<String, usize>,
    /// The width and height of each page, in points: what its lines' places are counted in.
    pub sizes: Vec<(f32, f32)>,
    /// The outline the file carries of its own headings, its bookmarks, in
    /// their order (ADR 0047); empty where it has none.
    pub outline: Vec<OutlineEntry>,
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
    /// The top of the page, from which lines are measured down, and its width.
    top: f64,
    width: f64,
    /// Where the last character ended.
    end: (f64, f64),
    /// The height of the last character.
    size: f64,
    /// Whether a run of characters begins: only there are spaces and lines told.
    begins: bool,
}

/// A part of a line: where it begins and ends, and its text in runs of one
/// font. A space parts a line too, so that each word is a part and where
/// the spaces between them stand is known.
#[derive(Default)]
struct Part {
    left: f64,
    right: f64,
    runs: Vec<PartRun>,
}

/// A run of a part in one font: its text as the PDF has it and as translated.
#[derive(Default, Clone)]
struct PartRun {
    /// The font's name, without the prefix of a subset.
    font: String,
    /// Whether its glyphs are small capitals by name.
    smallcaps: bool,
    text: String,
    translated: String,
    /// On the first run of a part after another, the space before it on the page.
    gap: Option<(f32, f32)>,
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

/// A spacing accent drawn as a glyph of its own over the letter before it,
/// as the combining accent it is there: ´ over a is á, not a´. In any script;
/// Greek breathings are left to `schemes::mend_greek`, as the sign of a
/// breathing is also that of a word cut short.
fn over_letter(mark: &str, before: &str) -> String {
    let letter = before.chars().last().filter(|c| c.is_alphabetic());
    let mut chars = mark.chars();
    let (Some(c), None, Some(letter)) = (chars.next(), chars.next(), letter) else { return mark.to_owned() };
    let greek = matches!(letter, '\u{0370}'..='\u{03ff}' | '\u{1f00}'..='\u{1fff}');
    match c {
        '\u{b4}' => "\u{301}",
        '`' => "\u{300}",
        '\u{a8}' => "\u{308}",
        '\u{2dc}' if greek => "\u{342}",
        '\u{2dc}' => "\u{303}",
        _ => mark,
    }
    .to_owned()
}

/// The farthest from the origin a place on a page is carried, in points:
/// some hundred times the largest page there is.
const FARTHEST: f64 = 1e6;

/// A place or a size on a page as the layer carries it: within
/// [`FARTHEST`], and nought for one that is no number. The layer crosses
/// from the process that reads it as JSON, which has no number for an
/// infinity, and a matrix of a broken file can scale a letter beyond what
/// an f32 holds; one such letter would lose the text of the whole file.
fn on_page(v: f64) -> f32 {
    if v.is_nan() { 0.0 } else { v.clamp(-FARTHEST, FARTHEST) as f32 }
}

impl Gatherer {
    fn line_for(&mut self, x: f64, baseline: f64, size: f64) {
        let top = on_page(self.top - baseline - size);
        let bottom = on_page(self.top - baseline);
        self.lines.push(Line {
            text: String::new(),
            left: on_page(x),
            right: on_page(x),
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
    #[allow(clippy::too_many_arguments)]
    fn put(
        &mut self,
        trm: &Transform,
        width: f64,
        font_size: f64,
        char: &str,
        shown: &str,
        mark: bool,
        look: (&str, bool),
    ) {
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
        let reach = x + direction.0 * advance;
        let (right, bottom) = (on_page(reach), on_page(self.top - y));
        if new_line {
            self.line_for(x, y, size);
        } else if back && let Some(parts) = self.parts.last_mut() {
            parts.push(Part { left: x, ..Part::default() });
        }
        if space
            && let Some(parts) = self.parts.last_mut()
            && parts.last().is_some_and(|p| p.runs.iter().any(|r| !r.text.trim().is_empty()))
        {
            parts.push(Part { left: x, ..Part::default() });
        }
        let part = self.parts.last_mut().and_then(|p| p.last_mut()).expect("there is a part");
        part.right = part.right.max(reach);
        // A mark goes with the letter it stands over, whatever its font.
        let same = part.runs.last().is_some_and(|r| mark || (r.font == look.0 && r.smallcaps == look.1));
        if !same {
            part.runs.push(PartRun { font: look.0.to_owned(), smallcaps: look.1, ..PartRun::default() });
        }
        let run = part.runs.last_mut().expect("a run was begun");
        if mark {
            run.text.push_str(&over_letter(char, &run.text));
            run.translated.push_str(&over_letter(shown, &run.translated));
        } else {
            run.text.push_str(char);
            run.translated.push_str(shown);
        }
        let line = self.lines.last_mut().expect("there is a line");
        line.left = line.left.min(on_page(x));
        line.right = line.right.max(right);
        line.top = line.top.min(bottom - on_page(size));
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
        self.width = (media_box.urx - media_box.llx).abs();
        Ok(())
    }

    fn end_page(&mut self) -> Told {
        Ok(())
    }

    fn output_character(&mut self, trm: &Transform, width: f64, _spacing: f64, font_size: f64, char: &str) -> Told {
        self.put(trm, width, font_size, char, char, false, ("", false));
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
        let smallcaps = glyph.name.is_some_and(|n| {
            n.ends_with("small") && schemes::by_name(n).is_some_and(|(scheme, _)| scheme == Scheme::ExpertNames)
        });
        self.put(trm, width, font_size, char, &shown, mark, (glyph.font_name, smallcaps));
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

/// The runs of a line, its parts in their order on the page: each part's
/// runs trimmed at its ends, a space between the parts, runs that are empty
/// left out. The first run of each part after another tells the space
/// between them, where there is room between them on the page.
fn runs_of(mut parts: Vec<Part>) -> Vec<PartRun> {
    parts.sort_by(|a, b| a.left.total_cmp(&b.left));
    let mut out: Vec<PartRun> = Vec::new();
    let mut reach: Option<f64> = None;
    for part in parts {
        let mut runs = part.runs;
        if let Some(first) = runs.first_mut() {
            first.text = first.text.trim_start().to_owned();
            first.translated = first.translated.trim_start().to_owned();
        }
        if let Some(last) = runs.last_mut() {
            last.text = last.text.trim_end().to_owned();
            last.translated = last.translated.trim_end().to_owned();
        }
        runs.retain(|r| !r.text.is_empty() || !r.translated.is_empty());
        if runs.is_empty() {
            continue;
        }
        if let Some(before) = out.last_mut() {
            before.text.push(' ');
            before.translated.push(' ');
        }
        if let Some(end) = reach
            && part.left > end
        {
            runs[0].gap = Some((on_page(end), on_page(part.left)));
        }
        reach = Some(reach.map_or(part.right, |r| r.max(part.right)));
        out.extend(runs);
    }
    out
}

/// The look of a run: italic and bold as its font's name says, small capitals by its glyphs' names.
fn flags(run: &PartRun) -> (bool, bool, bool) {
    let style = Style::from_font(&run.font, 0.0);
    (style.italic, style.bold, run.smallcaps)
}

/// A line's text of its runs, where its marks change (nothing where one
/// look holds throughout), and the spaces between its words.
fn joined(runs: &[PartRun], pick: fn(&PartRun) -> &String) -> (String, Vec<Run>, Vec<Gap>) {
    let mut text = String::new();
    let mut out: Vec<Run> = Vec::new();
    let mut gaps: Vec<Gap> = Vec::new();
    for run in runs {
        if let Some((from, to)) = run.gap {
            gaps.push(Gap { at: text.len(), from, to });
        }
        let (italic, bold, smallcaps) = flags(run);
        let changes = out.last().is_none_or(|r| (r.italic, r.bold, r.smallcaps) != (italic, bold, smallcaps));
        if changes && !pick(run).is_empty() {
            out.push(Run { from: text.len(), italic, bold, smallcaps });
        }
        text.push_str(pick(run));
    }
    if out.len() == 1 && !(out[0].italic || out[0].bold || out[0].smallcaps) {
        out.clear();
    }
    (text, out, gaps)
}

/// The style of a line: that of the font with most of its characters, at the line's height.
fn style_of(runs: &[PartRun], pick: fn(&PartRun) -> &String, size: f32) -> Style {
    let mut counts: Vec<(&str, usize)> = Vec::new();
    for run in runs {
        let n = pick(run).chars().filter(|c| !c.is_whitespace()).count();
        match counts.iter_mut().find(|(f, _)| *f == run.font) {
            Some((_, c)) => *c += n,
            None => counts.push((&run.font, n)),
        }
    }
    let font = counts.iter().max_by_key(|(_, n)| *n).map(|(f, _)| *f).unwrap_or_default();
    if font.is_empty() { Style { size, ..Style::default() } } else { Style::from_font(font, size) }
}

/// What was read of one page.
#[derive(Default)]
struct PageRead {
    lines: Vec<Line>,
    translated: Option<Vec<Line>>,
    schemes: Vec<(Scheme, String)>,
    maps: HashMap<ObjectId, BTreeMap<u32, String>>,
    fonts: BTreeMap<String, usize>,
    size: (f32, f32),
}

/// The lines of a page, as far as they can be read, as the PDF has them and
/// as translated. The library panics on fonts and encodings it does not
/// know; what it had read by then is kept.
fn page_lines(doc: &Document, number: u32) -> Option<PageRead> {
    if too_large(doc, number, LARGEST_PAGE) {
        return None;
    }
    let mut gatherer = Gatherer::default();
    match catch_unwind(AssertUnwindSafe(|| pdf_text::output_doc_page(doc, &mut gatherer, number))) {
        Ok(Ok(())) => {}
        Ok(Err(e)) => tracing::debug!(%e, number, "a page of the PDF could not be read to its end"),
        Err(_) => tracing::debug!(number, "a page of the PDF could not be read to its end"),
    }
    let size = (on_page(gatherer.width), on_page(gatherer.top));
    let Gatherer { lines, parts, named, fonts, mut schemes, maps, translated_fonts, font_counts, .. } = gatherer;
    let mut out_lines = Vec::new();
    let mut out_translated = Vec::new();
    let mut any = !schemes.is_empty();
    for (((line, parts), named), font) in lines.into_iter().zip(parts).zip(named).zip(fonts) {
        let mut runs = runs_of(parts);
        // Beta Code is read as a whole line: where its words stand is not kept.
        let mut measured = true;
        if named {
            for run in &mut runs {
                run.translated = schemes::mend_greek(&run.translated);
            }
        } else {
            let whole: String = runs.iter().map(|r| r.translated.as_str()).collect();
            if let Some(greek) = schemes::beta_code(&whole) {
                runs = vec![PartRun {
                    translated: greek,
                    text: runs.iter().map(|r| r.text.as_str()).collect(),
                    ..runs[0].clone()
                }];
                any = true;
                measured = false;
                if !schemes.contains(&(Scheme::BetaCode, font.clone())) {
                    schemes.push((Scheme::BetaCode, font));
                }
            }
        }
        let (text, text_runs, text_gaps) = joined(&runs, |r| &r.text);
        let (shown, shown_runs, shown_gaps) = joined(&runs, |r| &r.translated);
        if text.is_empty() && shown.is_empty() {
            continue;
        }
        let height = line.height();
        out_lines.push(Line {
            text,
            style: style_of(&runs, |r| &r.text, height),
            runs: text_runs,
            gaps: measured.then_some(text_gaps),
            ..line.clone()
        });
        out_translated.push(Line {
            text: shown,
            style: style_of(&runs, |r| &r.translated, height),
            runs: shown_runs,
            gaps: measured.then_some(shown_gaps),
            ..line
        });
    }
    out_lines.retain(|l| !l.text.is_empty());
    let maps = maps.into_iter().filter(|(id, _)| translated_fonts.contains(id)).collect();
    Some(PageRead {
        lines: out_lines,
        translated: any.then_some(out_translated),
        schemes,
        maps,
        fonts: font_counts,
        size,
    })
}

// ---------------------------------------------------------------------------
// The numbers of the pages in print
// ---------------------------------------------------------------------------

/// The most letters a number of a page is written in: past them, it is
/// written in figures, as a Roman numeral past 3999 is. No book gets near;
/// a file that asks for a billionth page in letters would have a string of
/// millions of letters for each of its pages.
const MOST_LETTERS: usize = 8;

/// A number in letters, as PDF numbers pages so: a to z, then aa to zz.
fn letters(n: usize) -> String {
    let n = n.max(1);
    let count = (n - 1) / 26 + 1;
    if count > MOST_LETTERS {
        return n.to_string();
    }
    let letter = char::from(b'a' + ((n - 1) % 26) as u8);
    std::iter::repeat_n(letter, count).collect()
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
        let n = self.start.saturating_add(index - self.from);
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
/// of its kids. A tree that is broken gives what could be read of it; a
/// node named again, by a kid that names its parent or by two kids that
/// name the same, is gone through once (`seen`), or a tree of a few objects
/// would be walked billions of times.
fn numberings(doc: &Document, node: &Object, into: &mut Vec<Numbering>, depth: usize, seen: &mut HashSet<ObjectId>) {
    if let Object::Reference(id) = node
        && !seen.insert(*id)
    {
        return;
    }
    let Some(node) = doc.dereference(node).ok().and_then(|(_, o)| o.as_dict().ok()) else { return };
    if depth > 16 {
        return;
    }
    if let Ok(kids) = node.get(b"Kids").and_then(Object::as_array) {
        for kid in kids {
            numberings(doc, kid, into, depth + 1, seen);
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

// ---------------------------------------------------------------------------
// The outline of the file
// ---------------------------------------------------------------------------

/// The most entries of an outline read, and how deep it is followed.
const OUTLINE_MOST: usize = 10_000;
const OUTLINE_DEEPEST: usize = 16;

/// The outline the file carries of its own headings, as a program writes it
/// for them: each entry's words, the page it points to and how deep it
/// stands. An outline that is broken gives what could be read of it.
fn outline_of(doc: &Document) -> Vec<OutlineEntry> {
    let Some(root) = doc
        .catalog()
        .ok()
        .and_then(|c| c.get(b"Outlines").ok())
        .and_then(|o| doc.dereference(o).ok())
        .and_then(|(_, o)| o.as_dict().ok())
    else {
        return Vec::new();
    };
    let pages: HashMap<ObjectId, usize> = doc.get_pages().into_iter().map(|(n, id)| (id, n as usize)).collect();
    let named = named_destinations(doc);
    let mut out = Vec::new();
    let mut seen = HashSet::new();
    let mut walk = Walk { doc, pages: &pages, named: &named, seen: &mut seen, out: &mut out };
    walk.items(root.get(b"First").ok(), 1);
    out
}

/// Going through the items of an outline, each once.
struct Walk<'a> {
    doc: &'a Document,
    pages: &'a HashMap<ObjectId, usize>,
    named: &'a HashMap<Vec<u8>, Object>,
    seen: &'a mut HashSet<ObjectId>,
    out: &'a mut Vec<OutlineEntry>,
}

impl Walk<'_> {
    /// An item and those after it, each with the items under it.
    fn items(&mut self, first: Option<&Object>, depth: usize) {
        let mut at = first.and_then(|o| o.as_reference().ok());
        while let Some(id) = at {
            if !self.seen.insert(id) || self.out.len() >= OUTLINE_MOST {
                return;
            }
            let Ok(item) = self.doc.get_dictionary(id) else { return };
            let title = item
                .get(b"Title")
                .ok()
                .and_then(|t| self.doc.dereference(t).ok())
                .and_then(|(_, t)| pdf_text::decode_text_string(t).ok())
                .map(|t| t.trim_start_matches('\u{feff}').split_whitespace().collect::<Vec<_>>().join(" "))
                .unwrap_or_default();
            let page = self.page_of_item(item);
            self.out.push(OutlineEntry { title, page, depth: depth.min(u8::MAX as usize) as u8 });
            if depth < OUTLINE_DEEPEST {
                self.items(item.get(b"First").ok(), depth + 1);
            }
            at = item.get(b"Next").ok().and_then(|o| o.as_reference().ok());
        }
    }

    /// The page an item points to: by its destination, or by an action that goes to one.
    fn page_of_item(&self, item: &pdf_text::Dictionary) -> Option<usize> {
        if let Ok(dest) = item.get(b"Dest") {
            return self.page_of(dest, 0);
        }
        let (_, action) = self.doc.dereference(item.get(b"A").ok()?).ok()?;
        let action = action.as_dict().ok()?;
        (action.get(b"S").and_then(Object::as_name).ok()? == b"GoTo").then_some(())?;
        self.page_of(action.get(b"D").ok()?, 0)
    }

    /// The page of a destination: an array whose first element is the page,
    /// a dictionary that holds one, or the name of one.
    fn page_of(&self, dest: &Object, depth: usize) -> Option<usize> {
        if depth > 4 {
            return None;
        }
        let (_, dest) = self.doc.dereference(dest).ok()?;
        match dest {
            Object::Array(a) => a.first()?.as_reference().ok().and_then(|id| self.pages.get(&id).copied()),
            Object::Dictionary(d) => self.page_of(d.get(b"D").ok()?, depth + 1),
            Object::Name(n) | Object::String(n, _) => self.page_of(self.named.get(n)?, depth + 1),
            _ => None,
        }
    }
}

/// The named destinations of a file: those of the catalogue's `/Dests`, and
/// those of the name tree `/Names` › `/Dests`.
fn named_destinations(doc: &Document) -> HashMap<Vec<u8>, Object> {
    let mut out = HashMap::new();
    let Ok(catalog) = doc.catalog() else { return out };
    fn dict<'a>(doc: &'a Document, o: &'a Object) -> Option<&'a pdf_text::Dictionary> {
        doc.dereference(o).ok().and_then(|(_, o)| o.as_dict().ok())
    }
    let dict = |o| dict(doc, o);
    if let Some(dests) = catalog.get(b"Dests").ok().and_then(dict) {
        for (name, dest) in dests.iter() {
            out.insert(name.clone(), dest.clone());
        }
    }
    if let Some(tree) = catalog.get(b"Names").ok().and_then(dict).and_then(|n| n.get(b"Dests").ok()) {
        name_tree(doc, tree, &mut out, 0, &mut HashSet::new());
    }
    out
}

/// The pairs of a name tree: its `/Names`, and those of its kids. A node
/// named again is gone through once, as in [`numberings`].
fn name_tree(
    doc: &Document,
    node: &Object,
    into: &mut HashMap<Vec<u8>, Object>,
    depth: usize,
    seen: &mut HashSet<ObjectId>,
) {
    if depth > OUTLINE_DEEPEST || into.len() >= OUTLINE_MOST {
        return;
    }
    if let Object::Reference(id) = node
        && !seen.insert(*id)
    {
        return;
    }
    let Some(node) = doc.dereference(node).ok().and_then(|(_, o)| o.as_dict().ok()) else { return };
    if let Ok(names) = node.get(b"Names").and_then(Object::as_array) {
        for pair in names.chunks(2) {
            if let [Object::String(name, _), dest] = pair {
                into.insert(name.clone(), dest.clone());
            }
        }
    }
    if let Ok(kids) = node.get(b"Kids").and_then(Object::as_array) {
        for kid in kids {
            name_tree(doc, kid, into, depth + 1, seen);
        }
    }
}

/// The labels of the pages, as the catalogue of the document gives them;
/// the number of each page, counted from one, where it gives none.
fn labels(doc: &Document, pages: usize) -> Vec<String> {
    let mut ranges = Vec::new();
    if let Ok(tree) = doc.catalog().and_then(|c| c.get(b"PageLabels")) {
        numberings(doc, tree, &mut ranges, 0, &mut HashSet::new());
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
    let outline = outline_of(&doc);
    let laid = pages
        .values()
        .map(|id| doc.get_dictionary(*id).is_ok_and(|page| super::searchable::has_laid(&doc, page)))
        .collect();
    keep(layer, |l| {
        l.labels = labels;
        l.outline = outline;
        l.pages = vec![None; count];
        l.laid = laid;
        l.locked = locked;
    });
    keep(layer, |l| {
        l.translated = vec![None; count];
        l.schemes = vec![Vec::new(); count];
        l.sizes = vec![(0.0, 0.0); count];
    });
    for number in 1..=count {
        let read = page_lines(&doc, number as u32);
        keep(layer, |l| match read {
            Some(page) => {
                l.pages[number - 1] = Some(page.lines);
                l.translated[number - 1] = page.translated;
                l.schemes[number - 1] = page.schemes;
                l.sizes[number - 1] = page.size;
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

/// Reads the text of the PDF at `path`, whose `bytes` are given: in a
/// process of its own where the application has one to give (`isolated.rs`),
/// which is killed when its time is up or it takes more memory than it may;
/// else on a thread ([`read`]). A file whose reading was given up has no text
/// as far as is known, and is said to be so in the log.
pub fn read_path(path: &Path, bytes: Arc<Vec<u8>>) -> Layer {
    let wait = patience(bytes.len());
    let limits = crate::isolated::Limits::for_file(bytes.len() as u64, wait);
    match crate::isolated::run::<Layer>("pdf-layer", path, limits) {
        None => read(bytes, wait),
        Some(Ok(layer)) => layer,
        Some(Err(crate::isolated::Ended::NotStarted(why))) => {
            tracing::warn!(%why, "no process could be started for reading the PDF; it is read here");
            read(bytes, wait)
        }
        Some(Err(ended)) => {
            tracing::warn!(%ended, path = %path.display(), "reading the text of the PDF was given up");
            Layer::default()
        }
    }
}

/// Reads the text of the PDF at `path` here and now, to its end: what the
/// process that reads it for the application does.
pub(crate) fn read_here(path: &Path) -> Result<Layer, String> {
    let bytes = std::fs::read(path).map_err(|e| e.to_string())?;
    let layer = Mutex::new(Layer::default());
    if catch_unwind(AssertUnwindSafe(|| read_into(&bytes, &layer))).is_err() {
        tracing::warn!("the text of the PDF could not be read to its end");
    }
    Ok(layer.into_inner().unwrap_or_else(PoisonError::into_inner))
}

/// The fonts' maps, keyed by object, as a list of pairs: JSON keys only by strings.
mod pairs {
    use std::collections::{BTreeMap, HashMap};

    use serde::{Deserialize, Deserializer, Serialize, Serializer};

    use super::ObjectId;

    type Maps = HashMap<ObjectId, BTreeMap<u32, String>>;

    pub fn serialize<S: Serializer>(maps: &Maps, s: S) -> Result<S::Ok, S::Error> {
        let mut list: Vec<(&ObjectId, &BTreeMap<u32, String>)> = maps.iter().collect();
        list.sort_by_key(|(id, _)| **id);
        list.serialize(s)
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<Maps, D::Error> {
        Ok(Vec::<(ObjectId, BTreeMap<u32, String>)>::deserialize(d)?.into_iter().collect())
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
    Ok(read_path(path, Arc::new(bytes)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_page_that_unpacks_too_large_is_not_read() {
        let small = Document::load_mem(&crate::ocr::fixture::inflating_pdf(1 << 20)).unwrap();
        assert!(!too_large(&small, 1, LARGEST_PAGE));
        let large = crate::ocr::fixture::inflating_pdf(LARGEST_UNPACKED as usize + (8 << 20));
        assert!(large.len() < LARGEST_PAGE, "it packs small: {}", large.len());
        let doc = Document::load_mem(&large).unwrap();
        assert!(too_large(&doc, 1, LARGEST_PAGE));
        // Read, it is left as a page with no text, at once.
        let started = std::time::Instant::now();
        let layer = read(Arc::new(large), Duration::from_secs(60));
        assert_eq!(layer.pages, vec![None]);
        assert!(started.elapsed() < Duration::from_secs(10), "{:?}", started.elapsed());
    }

    #[test]
    fn the_layer_is_carried_as_json_whole() {
        let pdf = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../e2e/fixtures/porson.pdf");
        let layer = read_here(&pdf).unwrap();
        assert!(!layer.maps.is_empty(), "the fixture has a font's map to carry");
        let json = serde_json::to_vec(&layer).unwrap();
        let back: Layer = serde_json::from_slice(&json).unwrap();
        assert_eq!(back, layer);
    }

    /// Text drawn at a place too far for the numbers the layer carries (a
    /// scale of 10^40 here) is carried with the rest, not given up whole
    /// because JSON has no number for infinity.
    #[test]
    fn text_drawn_beyond_all_measure_crosses_as_json() {
        use lopdf::{Stream, dictionary};
        let content = b"BT /F1 12 Tf 72 700 Td (Near) Tj ET\n\
            q 100000000000000000000.0 0 0 100000000000000000000.0 0 0 cm \
            100000000000000000000.0 0 0 100000000000000000000.0 0 0 cm \
            BT /F1 12 Tf 10 10 Td (Far) Tj ET Q\n";
        let mut doc = Document::with_version("1.5");
        let pages = doc.new_object_id();
        let font = doc.add_object(dictionary! { "Type" => "Font", "Subtype" => "Type1", "BaseFont" => "Helvetica" });
        let stream = doc.add_object(Stream::new(lopdf::Dictionary::new(), content.to_vec()));
        let page = doc.add_object(dictionary! {
            "Type" => "Page",
            "Parent" => pages,
            "MediaBox" => vec![0.into(), 0.into(), 612.into(), 792.into()],
            "Resources" => dictionary! { "Font" => dictionary! { "F1" => font } },
            "Contents" => stream,
        });
        doc.objects.insert(
            pages,
            Object::Dictionary(dictionary! { "Type" => "Pages", "Kids" => vec![page.into()], "Count" => 1 }),
        );
        let catalog = doc.add_object(dictionary! { "Type" => "Catalog", "Pages" => pages });
        doc.trailer.set("Root", catalog);
        let mut bytes = Vec::new();
        doc.save_to(&mut bytes).unwrap();

        let layer = read(Arc::new(bytes), Duration::from_secs(30));
        let lines = layer.pages[0].as_ref().expect("the page is read");
        assert!(lines.iter().any(|l| l.text == "Near"), "{lines:?}");
        let json = serde_json::to_vec(&layer).unwrap();
        let back: Layer = serde_json::from_slice(&json).expect("it crosses");
        assert_eq!(back.pages[0].as_ref().unwrap().len(), lines.len());
    }

    #[test]
    fn the_outline_a_file_carries_of_its_headings() {
        let pdf = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../e2e/fixtures/structure.pdf");
        let layer = read_file(&pdf).unwrap();
        let got: Vec<(String, Option<usize>, u8)> =
            layer.outline.iter().map(|e| (e.title.clone(), e.page, e.depth)).collect();
        assert_eq!(got.len(), 4, "{got:?}");
        let words: Vec<&str> = got.iter().map(|g| g.0.as_str()).collect();
        assert!(words[0].ends_with("Beginnings") && words[3].ends_with("Endings"), "{words:?}");
        assert_eq!(got.iter().map(|g| g.2).collect::<Vec<_>>(), [1, 2, 2, 1], "{got:?}");
        assert_eq!(got.iter().map(|g| g.1).collect::<Vec<_>>(), [Some(1), Some(2), Some(2), Some(2)], "{got:?}");
        // A file without one has none.
        let shape = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../e2e/fixtures/shape.pdf");
        assert!(read_file(&shape).unwrap().outline.is_empty());
    }

    #[test]
    fn an_accent_drawn_over_the_letter_before_is_its_combining_accent() {
        assert_eq!(over_letter("\u{b4}", "παραβα"), "\u{301}");
        assert_eq!(over_letter("`", "tre"), "\u{300}");
        assert_eq!(over_letter("\u{2dc}", "περισπ\u{3c9}"), "\u{342}");
        assert_eq!(over_letter("\u{2dc}", "ma\u{f1}an"), "\u{303}");
        // Over nothing, or a breathing, which is also the sign of a word cut short: as it is.
        assert_eq!(over_letter("\u{b4}", "a "), "\u{b4}");
        assert_eq!(over_letter("\u{1fbd}", "δι"), "\u{1fbd}");
    }

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

    /// Letters far on, as a broken or hostile file may ask for, are given in
    /// figures, as Roman numerals past 3999 are, not as a string of millions
    /// of letters; and a start at the end of the numbers does not overflow.
    #[test]
    fn a_page_label_of_letters_far_on_is_given_in_figures() {
        assert_eq!(letters(26 * 8), "zzzzzzzz");
        assert_eq!(letters(26 * 8 + 1), "209");
        let far = Numbering { from: 0, style: Some(b'a'), prefix: String::new(), start: 1_000_000_000 };
        assert_eq!(far.label(0), "1000000000");
        let farthest = Numbering { from: 2, style: Some(b'A'), prefix: "P-".into(), start: usize::MAX };
        assert_eq!(farthest.label(5), format!("P-{}", usize::MAX));
    }

    /// A tree of the numbers of pages, or of names, whose kids name the same
    /// node again and again, or itself, is gone through once a node, not
    /// once a path through it.
    #[test]
    fn a_tree_whose_kids_name_themselves_is_gone_through_once() {
        use lopdf::dictionary;
        let mut doc = Document::with_version("1.7");
        let pages = doc.new_object_id();
        let page = doc.add_object(dictionary! { "Type" => "Page", "Parent" => pages });
        doc.objects.insert(
            pages,
            Object::Dictionary(dictionary! { "Type" => "Pages", "Kids" => vec![page.into()], "Count" => 1 }),
        );
        let numbers = doc.new_object_id();
        doc.objects.insert(
            numbers,
            Object::Dictionary(dictionary! {
                "Kids" => vec![Object::Reference(numbers); 2],
                "Nums" => vec![0.into(), Object::Dictionary(dictionary! { "S" => "D", "St" => 3 })],
            }),
        );
        let names = doc.new_object_id();
        doc.objects.insert(
            names,
            Object::Dictionary(dictionary! {
                "Kids" => vec![Object::Reference(names); 8],
                "Names" => vec![Object::string_literal("here"), Object::Array(vec![page.into()])],
            }),
        );
        let catalog = doc.add_object(dictionary! {
            "Type" => "Catalog",
            "Pages" => pages,
            "PageLabels" => numbers,
            "Names" => dictionary! { "Dests" => names },
        });
        doc.trailer.set("Root", catalog);
        let mut ranges = Vec::new();
        numberings(&doc, &Object::Reference(numbers), &mut ranges, 0, &mut HashSet::new());
        assert_eq!(ranges.len(), 1);
        assert_eq!(labels(&doc, 1), vec!["3"]);
        // Eight kids to a node, sixteen deep, would be gone through for ever.
        let (tx, rx) = mpsc::channel();
        let doc = Arc::new(doc);
        let reading = Arc::clone(&doc);
        std::thread::spawn(move || tx.send(named_destinations(&reading).len()));
        assert_eq!(rx.recv_timeout(Duration::from_secs(20)), Ok(1));
    }

    #[test]
    fn what_is_not_a_pdf_has_no_text() {
        let layer = read(Arc::new(b"no pdf".to_vec()), Duration::from_secs(5));
        assert!(layer.pages.is_empty() && !layer.locked);
        assert!(!layer.has_text(0));
        assert_eq!(layer.label(4), "5");
    }
}
