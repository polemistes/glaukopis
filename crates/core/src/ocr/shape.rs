//! The shape of a page (ADR 0045): what a page is made of, read from the
//! geometry of its lines, the same for the text a PDF has and for what
//! Tesseract reads. Headings, lines kept where the page keeps them, numbers
//! in the margin beside their lines, paragraphs, and styles that recur
//! beside the body; running heads and page numbers left out.
//!
//! Nothing here gives a meaning to what it finds: a style found is named by
//! its look, and the writer says what it is. Every rule is a rule of the
//! geometry of lines, never one of a kind of text.
//!
//! The order of the rules: the edges of every page first (running heads and
//! page numbers), then the sizes of type and the body over the whole file;
//! then, page by page, the columns, the numbers in the margin, the
//! headings, the lines kept and the paragraphs; last, over the file again,
//! the levels of the headings and the styles found.

use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::ops::Range;

use crate::document::Side;

use super::text::{self, Gap, Line, Run, Style};

/// A page's lines, in reading order, as they are to be shaped, and its size
/// in the lines' units.
#[derive(Debug, Clone, Default)]
pub struct PageLines {
    pub lines: Vec<Line>,
    pub width: f32,
    pub height: f32,
}

/// What a page was found to be made of, in order.
#[derive(Debug, Clone, PartialEq)]
pub enum Piece {
    /// A heading, of level 1 (the largest) to 3; of level 0, the title of
    /// the document (`title_of`).
    Heading { level: u8, lines: Vec<Line> },
    /// Lines joined into a paragraph; `indent` where it begins further in
    /// than the lines around it. `style` is the index of its style in the
    /// file's styles, 0 the body.
    Paragraph { lines: Vec<Line>, indent: bool, style: usize },
    /// Lines kept as lines, each with the given number that stood beside it
    /// in the margin, and the side the numbers stood on.
    KeptLines { lines: Vec<(Line, Option<String>)>, side: Option<Side>, style: usize },
}

/// An entry of the outline a PDF carries of its own headings, its
/// bookmarks: the heading's words, the page it points to, counted from one,
/// where that could be read, and how deep it stands, 1 at the top.
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct OutlineEntry {
    pub title: String,
    pub page: Option<usize>,
    pub depth: u8,
}

/// A style of the file: its look, whether its paragraphs begin indented and
/// whether its lines are kept, a sample, how often it occurs and on how
/// many pages. The first of a file's styles is the body.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct StyleFound {
    pub style: Style,
    pub indent: bool,
    pub kept: bool,
    pub sample: String,
    pub count: usize,
    pub pages: usize,
}

// ---------------------------------------------------------------------------
// The measures
// ---------------------------------------------------------------------------

/// Two sizes of type a font tells are one where the larger is less than
/// this times the smaller: 10.5 and 11 points are two sizes.
const SAME_SIZE: f32 = 1.04;
/// The same for the heights of lines where no font tells the size: the
/// heights Tesseract gives the lines of one size differ by a pixel or two,
/// which at a low resolution is more than `SAME_SIZE`.
const SAME_HEIGHT: f32 = 1.1;
/// A line is a heading by its size where it is at least this times the body's.
const HEADING_SIZE: f32 = 1.15;
/// The part of the page at its head and at its foot where running heads and
/// page numbers stand.
const EDGE: f32 = 1.0 / 8.0;
/// How many pages before and after a page are looked at for the same
/// running head or the next page number.
const NEAR_PAGES: usize = 4;
/// The sizes of one running head on two pages differ by less than this
/// times: what Tesseract measures of it differs a little.
const HEAD_SIZES: f32 = 1.25;
/// Lines are kept as lines where their right ends differ by more than this
/// part of the text's width (as a standard deviation).
const RAGGED: f32 = 0.08;
/// A paragraph is indented where it begins further in than this many times
/// the body's size: by_place's measure, under the em most indents are.
const INDENT: f32 = 0.8;
/// The room around a heading beyond the room between lines of the body, in
/// the body's size.
const ROOM: f32 = 0.4;
/// The most lines a heading has.
const HEADING_LINES: usize = 3;
/// How far a number within the text's edges stands from its line, at the
/// least, in the body's size, to be the line's number.
const APART: f32 = 2.0;
/// How far a number stands from its line, at the least, in the body's size,
/// where the space between them was measured: a word space is far less.
const SPACE_APART: f32 = 1.0;
/// The most levels of headings.
const LEVELS: usize = 3;
/// How many characters a style's sample has.
const SAMPLE: usize = 120;

fn size_of(line: &Line) -> f32 {
    if line.style.size > 0.0 { line.style.size } else { line.height() }
}

/// The characters of a line that are not spaces.
fn signs(line: &Line) -> usize {
    line.text.chars().filter(|c| !c.is_whitespace()).count()
}

/// Whether a text has a letter or a digit: what is not a rule or a picture.
fn has_text(text: &str) -> bool {
    text.chars().any(char::is_alphanumeric)
}

/// Whether a text has a letter: words, not numbers alone.
fn has_letters(text: &str) -> bool {
    text.chars().any(char::is_alphabetic)
}

fn median(mut values: Vec<f32>) -> Option<f32> {
    if values.is_empty() {
        return None;
    }
    values.sort_by(f32::total_cmp);
    Some(values[values.len() / 2])
}

fn percentile(mut values: Vec<f32>, part: f32) -> Option<f32> {
    if values.is_empty() {
        return None;
    }
    values.sort_by(f32::total_cmp);
    let at = (part * (values.len() - 1) as f32).round() as usize;
    Some(values[at.min(values.len() - 1)])
}

fn deviation(values: &[f32]) -> f32 {
    if values.is_empty() {
        return 0.0;
    }
    let mean = values.iter().sum::<f32>() / values.len() as f32;
    (values.iter().map(|v| (v - mean).powi(2)).sum::<f32>() / values.len() as f32).sqrt()
}

/// Whether a text ends a sentence, whatever closes after the full stop (as `text.rs` has it).
fn ends_sentence(text: &str) -> bool {
    text.trim_end().trim_end_matches(['"', '\'', '”', '’', '»', ')', ']', '*']).ends_with(['.', '!', '?', ':', '…'])
}

/// The value of a number in Roman numerals, of one case, written as they are written.
pub(super) fn roman(text: &str) -> Option<i64> {
    if text.is_empty() || text.len() > 7 {
        return None;
    }
    let lower = text.to_ascii_lowercase();
    if text != lower && text != text.to_ascii_uppercase() {
        return None;
    }
    let value = |c: char| match c {
        'i' => Some(1),
        'v' => Some(5),
        'x' => Some(10),
        'l' => Some(50),
        'c' => Some(100),
        'd' => Some(500),
        'm' => Some(1000),
        _ => None,
    };
    let values: Vec<i64> = lower.chars().map(value).collect::<Option<_>>()?;
    let mut total = 0;
    for (i, v) in values.iter().enumerate() {
        if values.get(i + 1).is_some_and(|next| next > v) { total -= v } else { total += v }
    }
    // Written back as numerals are written, or it is a word of such letters (`mix`, `civil`).
    (total > 0 && to_roman(total) == lower).then_some(total)
}

fn to_roman(mut n: i64) -> String {
    const NUMERALS: [(i64, &str); 13] = [
        (1000, "m"),
        (900, "cm"),
        (500, "d"),
        (400, "cd"),
        (100, "c"),
        (90, "xc"),
        (50, "l"),
        (40, "xl"),
        (10, "x"),
        (9, "ix"),
        (5, "v"),
        (4, "iv"),
        (1, "i"),
    ];
    let mut out = String::new();
    for (value, numeral) in NUMERALS {
        while n >= value {
            out.push_str(numeral);
            n -= value;
        }
    }
    out
}

fn digits(text: &str) -> bool {
    (1..=4).contains(&text.len()) && text.bytes().all(|b| b.is_ascii_digit())
}

/// A line cut at the white space before its last word: what stands before
/// that space, and the word. The space may be any of Unicode's, and a
/// no-break space is two bytes, a thin space three, so the cut is made at
/// the space's own width, never a byte after where it begins.
fn last_word_apart(text: &str) -> Option<(&str, &str)> {
    text.rsplit_once(char::is_whitespace)
}

/// Whether a text is a number alone, in figures or in Roman numerals: what
/// stands in a margin beside a line.
fn number_alone(text: &str) -> bool {
    let text = text.trim();
    digits(text) || roman(text).is_some()
}

/// A page number as a line has it, `17`, `- 17 -`, `[17]`, `xiv`, `XIV` or
/// `A-3`: the form (what stands before the number, or the case of the
/// numerals) and the value, for numbers to be stepped.
fn page_number(text: &str) -> Option<(String, i64)> {
    let bare = text.trim_matches(|c: char| c.is_whitespace() || matches!(c, '-' | '–' | '—' | '[' | ']' | '(' | ')'));
    if digits(bare) {
        return Some((String::new(), bare.parse().ok()?));
    }
    if let Some(value) = roman(bare) {
        let form = if bare.starts_with(|c: char| c.is_ascii_uppercase()) { "I" } else { "i" };
        return Some((form.to_owned(), value));
    }
    let (prefix, number) = bare.split_once(['-', '–', '.'])?;
    ((1..=3).contains(&prefix.chars().count()) && prefix.chars().all(char::is_alphabetic) && digits(number))
        .then(|| Some((format!("{prefix}-"), number.parse().ok()?)))
        .flatten()
}

// ---------------------------------------------------------------------------
// Sizes and styles
// ---------------------------------------------------------------------------

/// The sizes of type of a file: the sizes of its lines gathered where each
/// is less than `SAME_SIZE` times the one below it, each with the size
/// measured, the middle size of its lines by their characters. The sizes a
/// font tells and the heights alone of lines (what Tesseract gives) are
/// gathered apart, the heights by `SAME_HEIGHT`.
#[derive(Debug, Clone, Default)]
struct Sizes {
    /// The least and the greatest size of each, its measured size, and
    /// whether the sizes are a font's, from the smallest.
    classes: Vec<(f32, f32, f32, bool)>,
}

/// Whether a line's size is its font's, not its height alone.
fn told(line: &Line) -> bool {
    !line.style.family.is_empty()
}

impl Sizes {
    fn of<'a>(lines: impl Iterator<Item = &'a Line> + Clone) -> Sizes {
        let mut classes = Vec::new();
        for (font, same) in [(true, SAME_SIZE), (false, SAME_HEIGHT)] {
            let mut sized: Vec<(f32, usize)> = lines
                .clone()
                .filter(|l| told(l) == font)
                .map(|l| (size_of(l), signs(l).max(1)))
                .filter(|(size, _)| *size > 0.0)
                .collect();
            sized.sort_by(|a, b| a.0.total_cmp(&b.0));
            let mut groups: Vec<Vec<(f32, usize)>> = Vec::new();
            for (size, weight) in sized {
                match groups.last_mut() {
                    Some(group) if size < group.last().expect("a group has a size").0 * same => {
                        group.push((size, weight))
                    }
                    _ => groups.push(vec![(size, weight)]),
                }
            }
            classes.extend(groups.into_iter().map(|group| {
                let total: usize = group.iter().map(|g| g.1).sum();
                let mut seen = 0;
                let measured = group
                    .iter()
                    .find(|(_, weight)| {
                        seen += weight;
                        seen * 2 >= total
                    })
                    .map_or(group[0].0, |g| g.0);
                (group[0].0, group.last().expect("a group has a size").0, measured, font)
            }));
        }
        Sizes { classes }
    }

    /// The size a line's size is of, by its index: the one it falls within,
    /// or the nearest, of those told as it is told where there are such.
    fn class(&self, size: f32, font: bool) -> usize {
        let distance = |(low, high, _, _): &(f32, f32, f32, bool)| {
            if size < *low {
                low / size.max(f32::MIN_POSITIVE)
            } else if size > *high {
                size / high
            } else {
                1.0
            }
        };
        let alike = self.classes.iter().any(|c| c.3 == font);
        (0..self.classes.len())
            .filter(|&c| !alike || self.classes[c].3 == font)
            .min_by(|&a, &b| distance(&self.classes[a]).total_cmp(&distance(&self.classes[b])))
            .unwrap_or(0)
    }

    fn measured(&self, class: usize) -> f32 {
        self.classes.get(class).map_or(0.0, |c| c.2)
    }
}

/// A line's look as far as lines are told apart by it: the font's family,
/// italic, bold, and the size of type by its index in `Sizes`.
#[derive(Debug, Clone, Default, PartialEq, Eq, Hash, PartialOrd, Ord)]
struct Key {
    family: String,
    italic: bool,
    bold: bool,
    size: usize,
}

/// A look of paragraphs and kept lines: the line's look, whether the block
/// stands further in than the text, and whether its lines are kept.
type Look = (Key, bool, bool);

/// What is known of the file as a whole, for the rules of each page.
struct File {
    sizes: Sizes,
    body: Key,
    /// The body's size, measured.
    size: f32,
    /// The step from one line of the body to the next, top to top.
    step: f32,
}

impl File {
    fn key(&self, line: &Line) -> Key {
        Key {
            family: line.style.family.clone(),
            italic: line.style.italic,
            bold: line.style.bold,
            size: self.sizes.class(size_of(line), told(line)),
        }
    }

    /// A line's size as measured for its size of type.
    fn size(&self, line: &Line) -> f32 {
        self.sizes.measured(self.sizes.class(size_of(line), told(line)))
    }

    /// How much room the lines of the body have between them, as a part of their size.
    fn leading(&self) -> f32 {
        ((self.step - self.size) / self.size.max(f32::MIN_POSITIVE)).max(0.0)
    }

    /// Whether there is more room between two lines, one under the other,
    /// than lines of their size have in the body.
    fn room_between(&self, above: &Line, below: &Line) -> bool {
        if below.top < above.top {
            // The next column, or something beside: no line stands over it.
            return true;
        }
        let gap = below.top - above.bottom;
        gap > self.leading() * self.size(above).max(self.size(below)) + ROOM * self.size
    }
}

/// The body's look (`body_style`): the look of most of a file's lines,
/// counted by their characters, and the step between its lines.
fn body_style(pages: &[PageLines], sizes: &Sizes) -> (Key, f32) {
    let probe = File { sizes: sizes.clone(), body: Key::default(), size: 0.0, step: 0.0 };
    let mut counts: BTreeMap<Key, usize> = BTreeMap::new();
    for line in pages.iter().flat_map(|p| &p.lines) {
        *counts.entry(probe.key(line)).or_default() += signs(line);
    }
    let body = counts.into_iter().max_by(|a, b| a.1.cmp(&b.1).then(b.0.cmp(&a.0))).map(|(k, _)| k).unwrap_or_default();
    let size = sizes.measured(body.size);
    // The step: the room from one line of the body to the next, top to top,
    // where they follow each other down the page (`by_place`'s finding).
    let steps: Vec<f32> = pages
        .iter()
        .flat_map(|page| page.lines.windows(2))
        .filter(|w| probe.key(&w[0]) == body && probe.key(&w[1]) == body)
        .map(|w| w[1].top - w[0].top)
        .filter(|&step| step > 0.0 && step < 3.0 * size)
        .collect();
    let step = median(steps).unwrap_or(1.2 * size);
    (body, step)
}

// ---------------------------------------------------------------------------
// Edges: running heads and page numbers
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Edge {
    Head,
    Foot,
}

/// A line at the head or foot of a page that may be left out.
struct Candidate {
    page: usize,
    line: usize,
    edge: Edge,
    /// Its text without digits, spaces and signs, for a running head.
    text: Option<String>,
    /// Its form and value, for a page number.
    number: Option<(String, i64)>,
    /// Whether no other line stands beside it.
    alone: bool,
    /// Its size: a running head keeps one.
    size: f32,
}

/// A running head's text as it is compared: small letters, a run of digits as `#`, and nothing else.
fn normalized(text: &str) -> String {
    let mut out = String::new();
    for c in text.chars().flat_map(char::to_lowercase) {
        if c.is_ascii_digit() {
            if !out.ends_with('#') {
                out.push('#');
            }
        } else if c.is_alphanumeric() {
            out.push(c);
        }
    }
    out
}

fn distance(a: &[char], b: &[char]) -> usize {
    let mut row: Vec<usize> = (0..=b.len()).collect();
    for (i, ca) in a.iter().enumerate() {
        let mut diagonal = row[0];
        row[0] = i + 1;
        for (j, cb) in b.iter().enumerate() {
            let above = row[j + 1];
            row[j + 1] = (above + 1).min(row[j] + 1).min(diagonal + usize::from(ca != cb));
            diagonal = above;
        }
    }
    row[b.len()]
}

/// Whether two running heads are the same: the same text, or, where read
/// by Tesseract, one letter in eight read otherwise.
fn similar(a: &str, b: &str) -> bool {
    if a == b {
        return true;
    }
    let (a, b): (Vec<char>, Vec<char>) = (a.chars().collect(), b.chars().collect());
    let (short, long) = (a.len().min(b.len()), a.len().max(b.len()));
    short >= 6 && long <= short * 5 / 4 && distance(&a, &b) * 8 <= long
}

/// Whether another line of the page stands beside a line: its middle within the other's height.
fn beside(lines: &[Line], at: usize) -> bool {
    let middle = (lines[at].top + lines[at].bottom) / 2.0;
    lines.iter().enumerate().any(|(i, l)| i != at && l.top <= middle && middle <= l.bottom)
}

/// The running heads and page numbers of a file's pages (`edges`), left
/// out. A line in the top or bottom eighth of a page, one of the two
/// outermost there, is a running head where a text the same but for its
/// digits stands at the same edge of two more pages near it, or where two
/// texts alternate page by page; a number alone there is a page number
/// where a page near it has the number that steps to it, and, where none
/// has, where it is the first or the last line of its page and stands
/// beside no line (as `page_paragraphs` leaves it out).
fn edges(pages: &mut [PageLines]) {
    let mut candidates: Vec<Candidate> = Vec::new();
    for (p, page) in pages.iter().enumerate() {
        let height =
            if page.height > 0.0 { page.height } else { page.lines.iter().map(|l| l.bottom).fold(0.0, f32::max) };
        for edge in [Edge::Head, Edge::Foot] {
            let mut at: Vec<usize> = (0..page.lines.len())
                .filter(|&i| match edge {
                    Edge::Head => page.lines[i].bottom <= height * EDGE,
                    Edge::Foot => page.lines[i].top >= height * (1.0 - EDGE),
                })
                .collect();
            at.sort_by(|&a, &b| {
                let (a, b) = (&page.lines[a], &page.lines[b]);
                match edge {
                    Edge::Head => a.top.total_cmp(&b.top),
                    Edge::Foot => b.bottom.total_cmp(&a.bottom),
                }
            });
            for i in at.into_iter().take(2) {
                let text = &page.lines[i].text;
                let number = page_number(text);
                let alone = !beside(&page.lines, i);
                let head = normalized(text);
                let head = (number.is_none() && head.chars().any(char::is_alphabetic)).then_some(head);
                if number.is_some() || head.is_some() {
                    let size = size_of(&page.lines[i]);
                    candidates.push(Candidate { page: p, line: i, edge, text: head, number, alone, size });
                }
            }
        }
    }

    // The candidates stand in the order of their pages, and each is compared
    // only with those of the pages near it, found by halving: compared with
    // every candidate of the file, with a distance of their texts worked out
    // before the pages were looked at, a book of 2 000 pages took seconds.
    let around = |page: usize, reach: usize| -> &[Candidate] {
        let from = candidates.partition_point(|c| c.page + reach < page);
        let to = candidates.partition_point(|c| c.page <= page + reach);
        &candidates[from..to]
    };
    let near = |a: &Candidate, b: &Candidate| a.page != b.page && a.page.abs_diff(b.page) <= NEAR_PAGES;
    // The same text at the same edge in the same size: a title with the
    // words of the running head is not one.
    let same_head = |a: &Candidate, b: &Candidate| {
        a.edge == b.edge
            && a.size.max(b.size) <= a.size.min(b.size) * HEAD_SIZES
            && matches!((&a.text, &b.text), (Some(x), Some(y)) if similar(x, y))
    };
    // Whether a running head's text stands again two pages on or back.
    let again = |c: &Candidate| {
        around(c.page, 2)
            .iter()
            .filter(|o| o.page.abs_diff(c.page) == 2 && same_head(c, o))
            .map(|o| o.page)
            .collect::<Vec<_>>()
    };
    let mut gone: BTreeSet<(usize, usize)> = BTreeSet::new();
    for c in &candidates {
        if c.text.is_some() {
            let pages_near: BTreeSet<usize> =
                around(c.page, NEAR_PAGES).iter().filter(|o| near(c, o) && same_head(c, o)).map(|o| o.page).collect();
            // Or two texts alternating: this one two pages away, and on the
            // page between, at the same edge, another that also does.
            let alternates = again(c).into_iter().any(|other| {
                let between = (c.page + other) / 2;
                around(between, 0).iter().any(|b| {
                    b.page == between
                        && b.edge == c.edge
                        && b.text.is_some()
                        && !same_head(b, c)
                        && !again(b).is_empty()
                })
            });
            if pages_near.len() >= 2 || alternates {
                gone.insert((c.page, c.line));
            }
        }
        if let Some((form, value)) = &c.number {
            let steps = around(c.page, NEAR_PAGES).iter().any(|o| {
                near(c, o)
                    && o.number.as_ref().is_some_and(|(f, v)| f == form && v - value == o.page as i64 - c.page as i64)
            });
            if steps {
                gone.insert((c.page, c.line));
            }
        }
    }
    // A number alone that nothing steps to, first or last on its page.
    for c in candidates.iter().filter(|c| c.number.is_some() && c.alone) {
        let left: Vec<usize> = (0..pages[c.page].lines.len()).filter(|&i| !gone.contains(&(c.page, i))).collect();
        if left.first() == Some(&c.line) || left.last() == Some(&c.line) {
            gone.insert((c.page, c.line));
        }
    }
    for (p, page) in pages.iter_mut().enumerate() {
        let mut i = 0;
        page.lines.retain(|_| {
            i += 1;
            !gone.contains(&(p, i - 1))
        });
    }
}

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

/// Which part of a page a run of lines is in, for the edges of the text.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
enum Part {
    Whole,
    Left,
    Right,
}

/// A run of a page's lines read one after the other, with the edges of
/// the text where it stands.
#[derive(Debug, Clone)]
struct Segment {
    lines: Vec<Line>,
    part: Part,
    left: f32,
    right: f32,
    /// The right end of the type area: as far as three lines of any look reach.
    measure: f32,
}

/// The lines of a page in the order they are read (`columns`). Where lines
/// stand in two columns, one wholly left of the middle of the text and one
/// wholly right of it, each of two lines or more with words, and with room
/// of at least twice the body's size between them, the left is read before
/// the right; lines across the middle part the page into bands, read from
/// the top, each with its own columns. A page without two columns keeps
/// its order.
fn columns(lines: Vec<Line>, file: &File) -> Vec<Segment> {
    let whole = |lines: Vec<Line>| vec![Segment { lines, part: Part::Whole, left: 0.0, right: 0.0, measure: 0.0 }];
    let worded: Vec<&Line> = lines.iter().filter(|l| has_letters(&l.text)).collect();
    if worded.len() < 4 {
        return whole(lines);
    }
    let left = worded.iter().map(|l| l.left).fold(f32::INFINITY, f32::min);
    let right = worded.iter().map(|l| l.right).fold(f32::NEG_INFINITY, f32::max);
    let middle = (left + right) / 2.0;
    let part = |l: &Line| {
        if l.right < middle {
            Part::Left
        } else if l.left > middle {
            Part::Right
        } else {
            Part::Whole
        }
    };
    // The bands: the lines across the middle, from the top, part the others.
    let mut across: Vec<f32> =
        lines.iter().filter(|l| part(l) == Part::Whole).map(|l| (l.top + l.bottom) / 2.0).collect();
    across.sort_by(f32::total_cmp);
    let band = |l: &Line| {
        let middle = (l.top + l.bottom) / 2.0;
        across.iter().filter(|&&a| a < middle).count()
    };
    let mut two = vec![false; across.len() + 1];
    for (b, two) in two.iter_mut().enumerate() {
        let side = |p: Part| lines.iter().filter(|l| part(l) == p && band(l) == b).collect::<Vec<_>>();
        let (lefts, rights) = (side(Part::Left), side(Part::Right));
        let worded = |ls: &[&Line]| ls.iter().filter(|l| has_letters(&l.text)).count() >= 2;
        let gap = rights.iter().map(|l| l.left).fold(f32::INFINITY, f32::min)
            - lefts.iter().map(|l| l.right).fold(f32::NEG_INFINITY, f32::max);
        *two = worded(&lefts) && worded(&rights) && gap >= 2.0 * file.size;
    }
    if !two.iter().any(|&t| t) {
        return whole(lines);
    }
    // In order: each band, its left column before its right, and the line across under it.
    let mut wholes: Vec<(f32, Line)> = Vec::new();
    let mut by_band: Vec<[Vec<Line>; 3]> = vec![Default::default(); across.len() + 1];
    for line in lines {
        let b = band(&line);
        match part(&line) {
            Part::Whole => wholes.push(((line.top + line.bottom) / 2.0, line)),
            _ if !two[b] => by_band[b][0].push(line),
            Part::Left => by_band[b][1].push(line),
            Part::Right => by_band[b][2].push(line),
        }
    }
    wholes.sort_by(|a, b| a.0.total_cmp(&b.0));
    let mut wholes = wholes.into_iter().map(|w| w.1);
    let mut segments: Vec<Segment> = Vec::new();
    let mut push = |lines: Vec<Line>, part: Part| {
        if lines.is_empty() {
            return;
        }
        match segments.last_mut() {
            Some(last) if last.part == part && part == Part::Whole => last.lines.extend(lines),
            _ => segments.push(Segment { lines, part, left: 0.0, right: 0.0, measure: 0.0 }),
        }
    };
    for [all, lefts, rights] in by_band {
        push(all, Part::Whole);
        push(lefts, Part::Left);
        push(rights, Part::Right);
        push(wholes.next().into_iter().collect(), Part::Whole);
    }
    segments
}

/// The text's left and right edges in a run of lines: the 10th and 90th
/// part of the lines' left and right ends, of the body's lines where it
/// has any, and leaving out ends where a number stands. And the right end
/// of the type area, the third farthest of any line's that has no number
/// at its end: where a page of verse has notes across the whole width
/// below it, the verse's own right edge is not the width of the page's text.
fn text_edges<'a>(lines: impl Iterator<Item = &'a Line> + Clone, file: &File) -> (f32, f32, f32) {
    let worded = lines.filter(|l| has_text(&l.text) && !number_alone(&l.text));
    let mut ends: Vec<f32> = worded
        .clone()
        .filter(|l| !l.text.split_whitespace().next_back().is_some_and(digits))
        .map(|l| l.right)
        .collect();
    ends.sort_by(|a, b| b.total_cmp(a));
    let measure = ends.get(2).or(ends.last()).copied().unwrap_or(0.0);
    let body: Vec<&Line> = worded.clone().filter(|l| file.key(l) == file.body).collect();
    let lines: Vec<&Line> = if body.is_empty() { worded.collect() } else { body };
    let first_word = |l: &&Line| l.text.split_whitespace().next().is_some_and(digits);
    let last_word = |l: &&Line| l.text.split_whitespace().next_back().is_some_and(digits);
    let lefts = |all: bool| lines.iter().filter(|l| all || !first_word(l)).map(|l| l.left).collect::<Vec<_>>();
    let rights = |all: bool| lines.iter().filter(|l| all || !last_word(l)).map(|l| l.right).collect::<Vec<_>>();
    let left = percentile(lefts(false), 0.1).or_else(|| percentile(lefts(true), 0.1)).unwrap_or(0.0);
    let right = percentile(rights(false), 0.9).or_else(|| percentile(rights(true), 0.9)).unwrap_or(0.0);
    (left, right, measure.max(right))
}

// ---------------------------------------------------------------------------
// Numbers in the margin
// ---------------------------------------------------------------------------

/// A line, with the number that stood beside it in the margin and the side.
type Numbered = (Line, Option<(String, Side)>);

/// The width of a character of a run of lines, on average.
fn sign_width(lines: &[&Line], file: &File) -> f32 {
    let (width, count) = lines
        .iter()
        .filter(|l| signs(l) > 0)
        .fold((0.0, 0), |(w, n), l| (w + (l.right - l.left).max(0.0), n + l.text.chars().count()));
    if count > 0 && width > 0.0 { width / count as f32 } else { 0.5 * file.size }
}

/// Part of a line's text, from one byte to another, with its runs.
fn cut(line: &Line, from: usize, to: usize) -> Line {
    let mut runs: Vec<Run> = Vec::new();
    for (k, run) in line.runs.iter().enumerate() {
        let end = line.runs.get(k + 1).map_or(line.text.len(), |r| r.from);
        if end > from && run.from < to {
            runs.push(Run { from: run.from.max(from) - from, ..run.clone() });
        }
    }
    let gaps = line
        .gaps
        .as_ref()
        .map(|gaps| gaps.iter().filter(|g| g.at > from && g.at < to).map(|g| Gap { at: g.at - from, ..*g }).collect());
    Line { text: line.text[from..to].to_owned(), runs, gaps, ..line.clone() }
}

/// What stands before the word of a line that begins at a byte, by the
/// spaces measured between its words.
enum Before {
    /// The spaces were not measured: it must be guessed.
    Unknown,
    /// Room enough, from where the text before ends to where the word begins.
    Apart(f32, f32),
    /// A word space, or none.
    Close,
}

fn before(line: &Line, at: usize, file: &File) -> Before {
    let Some(gaps) = &line.gaps else { return Before::Unknown };
    match gaps.iter().find(|g| g.at == at) {
        Some(g) if g.to - g.from >= SPACE_APART * file.size => Before::Apart(g.from, g.to),
        _ => Before::Close,
    }
}

/// The numbers in the margin of a run of lines (`margin_numbers`). A number
/// alone, in figures or Roman numerals, standing wholly left of the text's
/// left edge or wholly right of its right edge, is given to the line whose
/// height its middle lies within, the nearest such, with the side it stood
/// on. Where a line's text begins or ends with figures, and the line
/// reaches beyond the edge on that side by more than the body's size, the
/// figures were drawn in the margin on the line's own baseline: they are
/// split off by place and given to the line so. Numbers within the edges
/// are given to their lines on the terms of `numbers_inside`.
fn margin_numbers(segment: &Segment, file: &File) -> Vec<Numbered> {
    let all: Vec<&Line> = segment.lines.iter().collect();
    let width = sign_width(&all, file);
    let lefts: Vec<f32> = segment
        .lines
        .iter()
        .filter(|l| has_text(&l.text) && !l.text.split_whitespace().next().is_some_and(digits))
        .map(|l| l.left)
        .collect();
    let mut out: Vec<Numbered> = Vec::new();
    for line in &segment.lines {
        let text = &line.text;
        let trimmed = text.trim_end();
        // Figures at the end, beyond the right edge.
        if line.right > segment.right + file.size
            && let Some((head, number)) = last_word_apart(trimmed)
            && digits(number)
            && has_letters(head)
            && let room = before(line, trimmed.len() - number.len(), file)
            && !matches!(room, Before::Close)
        {
            let mut rest = cut(line, 0, head.trim_end().len());
            rest.right = if let Before::Apart(end, _) = room {
                end
            } else {
                let number_left = line.right - number.len() as f32 * width;
                let guess = line.left + rest.text.chars().count() as f32 * width;
                guess.min(number_left - width).max(line.left + width)
            };
            out.push((rest, Some((number.to_owned(), Side::Right))));
            continue;
        }
        // Figures at the beginning, beyond the left edge.
        let start = text.len() - text.trim_start().len();
        if line.left < segment.left - file.size
            && let Some(len) = text[start..].find(char::is_whitespace)
            && digits(&text[start..start + len])
            && has_letters(&text[start + len..])
            && let after = start + len + (text[start + len..].len() - text[start + len..].trim_start().len())
            && let room = before(line, after, file)
            && !matches!(room, Before::Close)
        {
            let number = &text[start..start + len];
            let mut rest = cut(line, after, text.len());
            rest.left = if let Before::Apart(_, begins) = room {
                begins
            } else {
                let number_right = line.left + number.len() as f32 * width;
                let guess = (line.right - rest.text.chars().count() as f32 * width).max(number_right + width);
                snapped(guess, &lefts, file)
            };
            out.push((rest, Some((number.to_owned(), Side::Left))));
            continue;
        }
        out.push((line.clone(), None));
    }
    // Numbers standing alone beyond the edges, given to the line beside.
    let alone = |l: &Line| number_alone(&l.text) && if l.right < segment.left { true } else { l.left > segment.right };
    let mut gone = vec![false; out.len()];
    for i in 0..out.len() {
        let number = &out[i].0;
        if !alone(number) {
            continue;
        }
        let side = if number.right < segment.left { Side::Left } else { Side::Right };
        let middle = (number.top + number.bottom) / 2.0;
        let apart = |l: &Line| if side == Side::Left { l.left - number.right } else { number.left - l.right };
        let target = (0..out.len())
            .filter(|&j| j != i && !gone[j] && out[j].1.is_none())
            .filter(|&j| {
                let l = &out[j].0;
                l.top <= middle && middle <= l.bottom && has_letters(&l.text) && !number_alone(&l.text)
            })
            .min_by(|&a, &b| apart(&out[a].0).total_cmp(&apart(&out[b].0)));
        if let Some(j) = target {
            out[j].1 = Some((number.text.trim().to_owned(), side));
            gone[i] = true;
        }
    }
    numbers_inside(&mut out, &mut gone, width, &lefts, file);
    numbers_flush(&mut out, &gone, &segment.lines, width, file);
    out.into_iter().zip(gone).filter(|(_, gone)| !gone).map(|(n, _)| n).collect()
}

/// Where a number found by `numbers_inside` stood: at the end or the
/// beginning of its line's own text, or on a line of its own.
enum Stood {
    InLine(Line),
    Alone(usize),
}

/// A number beside a line within the text's edges.
struct Inside {
    line: usize,
    number: String,
    value: i64,
    side: Side,
    stood: Stood,
}

/// Where the guess of where a line's text begins falls near where other
/// lines begin, it begins there.
fn snapped(guess: f32, lefts: &[f32], file: &File) -> f32 {
    lefts
        .iter()
        .copied()
        .filter(|l| (l - guess).abs() < 1.5 * file.size)
        .min_by(|a, b| (a - guess).abs().total_cmp(&(b - guess).abs()))
        .unwrap_or(guess)
}

/// The numbers beside lines within the text's edges (`margin_numbers`, the
/// second case), as where the numbers of lines of verse stand at the right
/// edge of a page of prose. A number in figures stands apart from its line,
/// on a line of its own beside it with more than `APART` times the body's
/// size between them, or at the end or the beginning of the line's own
/// text with room enough between that a guess of the text's width cannot
/// be wrong by it (`APART` times the size, and a quarter of the line).
/// Such numbers on one side are given to their lines only where they count
/// upward down the page, two at least, with a line between each two, the
/// numbers already given on that side beyond the edge counted with them:
/// as the numbers of lines do, and the figures of a table do not.
fn numbers_inside(out: &mut [Numbered], gone: &mut [bool], width: f32, lefts: &[f32], file: &File) {
    let apart = APART * file.size;
    let mut found: Vec<Inside> = Vec::new();
    for i in 0..out.len() {
        let (line, number) = &out[i];
        if gone[i] || number.is_some() || !has_letters(&line.text) {
            continue;
        }
        let room = apart.max(0.25 * (line.right - line.left));
        let text = &line.text;
        let trimmed = text.trim_end();
        if let Some((head, number)) = last_word_apart(trimmed)
            && digits(number)
            && has_letters(head)
        {
            let mut rest = cut(line, 0, head.trim_end().len());
            let guess = line.left + rest.text.chars().count() as f32 * width;
            let end = match before(line, trimmed.len() - number.len(), file) {
                Before::Apart(end, _) => Some(end),
                Before::Unknown => (line.right - number.len() as f32 * width - guess > room).then_some(guess),
                Before::Close => None,
            };
            if let Some(end) = end {
                rest.right = end;
                let value = number.parse().unwrap_or_default();
                let (number, side, stood) = (number.to_owned(), Side::Right, Stood::InLine(rest));
                found.push(Inside { line: i, number, value, side, stood });
                continue;
            }
        }
        let start = text.len() - text.trim_start().len();
        if let Some(len) = text[start..].find(char::is_whitespace)
            && digits(&text[start..start + len])
            && has_letters(&text[start + len..])
        {
            let number = &text[start..start + len];
            let after = start + len + (text[start + len..].len() - text[start + len..].trim_start().len());
            let mut rest = cut(line, after, text.len());
            let guess = line.right - rest.text.chars().count() as f32 * width;
            let begins = match before(line, after, file) {
                Before::Apart(_, begins) => Some(begins),
                Before::Unknown => {
                    (guess - (line.left + number.len() as f32 * width) > room).then(|| snapped(guess, lefts, file))
                }
                Before::Close => None,
            };
            if let Some(begins) = begins {
                rest.left = begins;
                let value = number.parse().unwrap_or_default();
                let (number, side, stood) = (number.to_owned(), Side::Left, Stood::InLine(rest));
                found.push(Inside { line: i, number, value, side, stood });
            }
        }
    }
    for j in 0..out.len() {
        let number = &out[j].0;
        if gone[j] || out[j].1.is_some() || !digits(number.text.trim()) {
            continue;
        }
        let middle = (number.top + number.bottom) / 2.0;
        let beside = (0..out.len())
            .filter(|&t| t != j && !gone[t] && out[t].1.is_none() && has_letters(&out[t].0.text))
            .filter(|&t| out[t].0.top <= middle && middle <= out[t].0.bottom)
            .filter_map(|t| {
                let line = &out[t].0;
                if number.left - line.right > apart {
                    Some((t, Side::Right, number.left - line.right))
                } else if line.left - number.right > apart {
                    Some((t, Side::Left, line.left - number.right))
                } else {
                    None
                }
            })
            .min_by(|a, b| a.2.total_cmp(&b.2));
        if let Some((t, side, _)) = beside
            && !found.iter().any(|f| f.line == t)
        {
            let value = number.text.trim().parse().unwrap_or_default();
            found.push(Inside { line: t, number: number.text.trim().to_owned(), value, side, stood: Stood::Alone(j) });
        }
    }
    for side in [Side::Left, Side::Right] {
        let mut these: Vec<Inside> = Vec::new();
        let mut others: Vec<Inside> = Vec::new();
        for f in found.drain(..) {
            if f.side == side { these.push(f) } else { others.push(f) }
        }
        found = others;
        if these.is_empty() {
            continue;
        }
        // With the numbers already given on that side, beyond the edge: one column.
        let mut column: Vec<(usize, i64)> = these.iter().map(|f| (f.line, f.value)).collect();
        column.extend((0..out.len()).filter_map(|k| match &out[k].1 {
            Some((number, s)) if *s == side && !gone[k] => Some((k, number.parse().ok()?)),
            _ => None,
        }));
        column.sort_by(|a, b| out[a.0].0.top.total_cmp(&out[b.0].0.top));
        let counts_up = column.len() >= 2
            && column.windows(2).all(|w| {
                let (a, b) = (&out[w[0].0].0, &out[w[1].0].0);
                let between = (0..out.len())
                    .any(|k| !gone[k] && has_letters(&out[k].0.text) && out[k].0.top > a.top && out[k].0.top < b.top);
                w[1].1 > w[0].1 && between
            });
        if !counts_up {
            continue;
        }
        for f in these {
            match f.stood {
                Stood::InLine(rest) => out[f.line].0 = rest,
                Stood::Alone(j) => gone[j] = true,
            }
            out[f.line].1 = Some((f.number, f.side));
        }
    }
}

/// The numbers at the end of lines that stand flush with the numbers given
/// on the right (`margin_numbers`, the last case), however near their text:
/// the numbers of lines are set in one column, and a long line runs up to
/// it. A number so is its line's where its line is of the size of a line
/// whose number was given there, and where the column counts upward down
/// the page with it, a line between each two. On the left every line
/// begins flush, and standing so tells nothing.
/// A number of the column: its line, its value, and, where it is new, its
/// line without it and the number as written.
type InColumn = (usize, i64, Option<(Line, String)>);

fn numbers_flush(out: &mut [Numbered], gone: &[bool], lines: &[Line], width: f32, file: &File) {
    let given: Vec<usize> = (0..out.len())
        .filter(|&k| {
            !gone[k] && matches!(&out[k].1, Some((n, Side::Right)) if lines[k].text.trim_end().ends_with(n.as_str()))
        })
        .collect();
    let column: Vec<(f32, usize)> = given.iter().map(|&k| (lines[k].right, file.key(&lines[k]).size)).collect();
    if column.is_empty() {
        return;
    }
    let mut numbers: Vec<InColumn> =
        given.iter().filter_map(|&k| Some((k, out[k].1.as_ref()?.0.parse().ok()?, None))).collect();
    for (i, (line, number)) in out.iter().enumerate() {
        if gone[i] || number.is_some() || !has_letters(&line.text) {
            continue;
        }
        let trimmed = line.text.trim_end();
        let Some((head, number)) = last_word_apart(trimmed) else { continue };
        let size = file.key(line).size;
        if !digits(number)
            || !has_letters(head)
            || !column.iter().any(|(right, s)| *s == size && (right - line.right).abs() < 0.5 * file.size)
        {
            continue;
        }
        let Ok(value) = number.parse() else { continue };
        let mut rest = cut(line, 0, head.trim_end().len());
        let guess = line.left + rest.text.chars().count() as f32 * width;
        rest.right = guess.min(line.right - (number.len() + 1) as f32 * width).max(line.left + width);
        numbers.push((i, value, Some((rest, number.to_owned()))));
    }
    if numbers.iter().all(|n| n.2.is_none()) {
        return;
    }
    numbers.sort_by(|a, b| out[a.0].0.top.total_cmp(&out[b.0].0.top));
    let counts_up = numbers.windows(2).all(|w| {
        let (a, b) = (&out[w[0].0].0, &out[w[1].0].0);
        let between = (0..out.len())
            .any(|k| !gone[k] && has_letters(&out[k].0.text) && out[k].0.top > a.top && out[k].0.top < b.top);
        w[1].1 > w[0].1 && between
    });
    if !counts_up {
        return;
    }
    for (i, _, new) in numbers {
        if let Some((rest, number)) = new {
            out[i] = (rest, Some((number, Side::Right)));
        }
    }
}

// ---------------------------------------------------------------------------
// Headings
// ---------------------------------------------------------------------------

/// The headings of a run of lines (`headings`): a line, or up to three
/// lines one under the other without room between them, each at least
/// `HEADING_SIZE` times the body's size, or bold and at least the body's
/// size, with more room above and below than the body's lines have, that
/// has no number in the margin, and whose look is not that of the lines
/// it stands apart from (a heading stands apart from text in another look).
/// One larger than the body may have no more room below than the body's
/// lines where its last line ends short of the text's right edge by twice
/// the body's size, as the headings of many programs are set; the first
/// line of a paragraph set larger reaches the edge.
fn headings(lines: &[Numbered], segment: &Segment, file: &File) -> Vec<Range<usize>> {
    let stands_out = |(line, number): &Numbered| {
        let size = file.size(line);
        number.is_none()
            && has_text(&line.text)
            && (size >= HEADING_SIZE * file.size || (line.style.bold && size >= file.size / SAME_SIZE))
    };
    let mut found = Vec::new();
    let mut i = 0;
    while i < lines.len() {
        if !stands_out(&lines[i]) {
            i += 1;
            continue;
        }
        let mut end = i + 1;
        while end < lines.len() && stands_out(&lines[end]) && !file.room_between(&lines[end - 1].0, &lines[end].0) {
            end += 1;
        }
        let first = &lines[i].0;
        let last = &lines[end - 1].0;
        let looks: BTreeSet<Key> = lines[i..end].iter().map(|l| file.key(&l.0)).collect();
        let apart_above = i == 0 || file.room_between(&lines[i - 1].0, first);
        let larger = lines[i..end].iter().all(|l| file.size(&l.0) >= HEADING_SIZE * file.size);
        let apart_below = end == lines.len()
            || file.room_between(last, &lines[end].0)
            || (larger && last.right < segment.right - 2.0 * file.size);
        let other_look = |n: Option<&Numbered>| n.is_none_or(|n| !looks.contains(&file.key(&n.0)));
        if end - i <= HEADING_LINES
            && apart_above
            && apart_below
            && other_look(i.checked_sub(1).map(|p| &lines[p]))
            && other_look(lines.get(end))
        {
            found.push(i..end);
        }
        i = end;
    }
    found
}

// ---------------------------------------------------------------------------
// Lines kept
// ---------------------------------------------------------------------------

/// Whether lines are set line by line, not run on as prose (`ragged`): their
/// right ends differ by more than `RAGGED` of the width of the type area,
/// or fall short of its right end by that much on the mean (lines of verse
/// of one length do); and more than half of them, the last aside, end
/// short by choice: no sentence ends there, no word is broken there, and
/// the next line's first word would have stood after it within the type
/// area. Prose set ragged ends its lines where the next word would not
/// fit; dialogue ends them where a sentence ends.
fn ragged(lines: &[&Line], segment: &Segment, file: &File) -> bool {
    if lines.len() < 3 {
        return false;
    }
    let rights: Vec<f32> = lines.iter().map(|l| l.right).collect();
    let most = rights.iter().copied().fold(f32::NEG_INFINITY, f32::max);
    let least = lines.iter().map(|l| l.left).fold(f32::INFINITY, f32::min);
    let measure = segment.measure.max(segment.right).max(most);
    let width = if measure > segment.left { measure - segment.left } else { most - least };
    let short = rights.iter().map(|r| measure - r).sum::<f32>() / rights.len() as f32;
    if deviation(&rights) <= RAGGED * width && short <= RAGGED * width {
        return false;
    }
    let sign = sign_width(lines, file);
    let by_choice = lines
        .windows(2)
        .filter(|w| {
            let text = w[0].text.trim_end();
            let next = w[1].text.split_whitespace().next().map_or(0, |word| word.chars().count());
            !ends_sentence(text)
                && !text.ends_with(['-', '\u{2010}', '\u{ad}', '¬'])
                && w[0].right + (next + 1) as f32 * sign < measure
        })
        .count();
    by_choice * 2 > lines.len() - 1
}

/// The blocks of lines kept as lines in a run of lines (`kept`), outside
/// the headings. The lines are taken in runs of one look, parted where
/// there is more room between them than the lines of their size have. Such
/// a run where a number stands in the margin beside any line is kept whole,
/// so that every number keeps its line. Otherwise, within it, three lines
/// or more whose left ends agree within half their size are kept where
/// they are `ragged`.
fn kept(lines: &[Numbered], heads: &[Range<usize>], segment: &Segment, file: &File) -> Vec<Range<usize>> {
    let in_heading = |i: usize| heads.iter().any(|h| h.contains(&i));
    let mut found = Vec::new();
    let mut i = 0;
    while i < lines.len() {
        if in_heading(i) {
            i += 1;
            continue;
        }
        let key = file.key(&lines[i].0);
        let step = file.step * file.size(&lines[i].0) / file.size.max(f32::MIN_POSITIVE);
        let mut end = i + 1;
        while end < lines.len() && !in_heading(end) && file.key(&lines[end].0) == key {
            let down = lines[end].0.top - lines[end - 1].0.top;
            if down > 1.3 * step || down < -0.5 * lines[end].0.height().max(1.0) {
                break;
            }
            end += 1;
        }
        if lines[i..end].iter().any(|l| l.1.is_some()) {
            found.push(i..end);
        } else {
            // Within it, runs whose left ends agree.
            let half = 0.5 * file.size(&lines[i].0);
            let mut from = i;
            while from < end {
                let mut to = from + 1;
                while to < end && (lines[to].0.left - lines[from].0.left).abs() <= half {
                    to += 1;
                }
                let run: Vec<&Line> = lines[from..to].iter().map(|l| &l.0).collect();
                if ragged(&run, segment, file) {
                    found.push(from..to);
                }
                from = to;
            }
        }
        i = end;
    }
    found
}

// ---------------------------------------------------------------------------
// A page shaped
// ---------------------------------------------------------------------------

/// A piece before the file's styles and levels are known.
enum Draft {
    /// `given` is the level the file's outline or the heading's number gives it.
    Heading {
        lines: Vec<Line>,
        size: usize,
        given: Option<u8>,
    },
    Paragraph {
        lines: Vec<Line>,
        indent: bool,
        look: Look,
    },
    Kept {
        lines: Vec<(Line, Option<String>)>,
        side: Option<Side>,
        look: Look,
    },
}

/// The look of most of a run of lines, by their characters.
fn look_of<'a>(lines: impl Iterator<Item = &'a Line>, file: &File) -> Key {
    let mut counts: BTreeMap<Key, usize> = BTreeMap::new();
    for line in lines {
        *counts.entry(file.key(line)).or_default() += signs(line).max(1);
    }
    counts.into_iter().max_by(|a, b| a.1.cmp(&b.1).then(b.0.cmp(&a.0))).map(|(k, _)| k).unwrap_or_default()
}

/// The paragraphs of a run of lines (`paragraphs`), grouped as `by_place`
/// groups them. One is indented where its first line begins further in
/// than its other lines by more than `INDENT` of the body's size, or, of
/// one line, further in than the text's left edge so. The block of a
/// paragraph stands further in where its lines after the first all do.
/// Where the fonts are known, and so the sizes are the fonts' own, lines
/// of two sizes are never one paragraph; where only the heights of the
/// lines are known, `by_place` tells by them. And a line that begins as far
/// in as an indented paragraph's first line, after a line that ends a
/// sentence, begins a paragraph of its own, as lines of dialogue one under
/// the other do.
fn paragraphs(lines: Vec<Line>, segment: &Segment, file: &File) -> Vec<Draft> {
    let by = INDENT * file.size;
    let mut runs: Vec<Vec<Line>> = Vec::new();
    for line in lines {
        let apart = runs.last().and_then(|r| r.last()).is_none_or(|before| {
            !before.style.family.is_empty()
                && !line.style.family.is_empty()
                && file.key(before).size != file.key(&line).size
        });
        if apart {
            runs.push(Vec::new());
        }
        runs.last_mut().expect("a run was begun").push(line);
    }
    let indented =
        |line: &Line, first: &Line| line.left - segment.left > by && (line.left - first.left).abs() <= 0.5 * file.size;
    let mut groups: Vec<Vec<Line>> = Vec::new();
    for group in runs.into_iter().flat_map(text::by_place) {
        let mut current: Vec<Line> = Vec::new();
        for line in group {
            if let (Some(first), Some(before)) = (current.first(), current.last())
                && indented(first, first)
                && indented(&line, first)
                && ends_sentence(&before.text)
            {
                groups.push(std::mem::take(&mut current));
            }
            current.push(line);
        }
        groups.push(current);
    }
    groups
        .into_iter()
        .map(|lines| {
            let first = lines[0].left;
            let others = lines[1..].iter().map(|l| l.left).fold(f32::INFINITY, f32::min);
            let (indent, block) = if lines.len() > 1 {
                (first - others > by, others - segment.left > by)
            } else {
                (first - segment.left > by, false)
            };
            let look = (look_of(lines.iter(), file), block, false);
            Draft::Paragraph { lines, indent, look }
        })
        .collect()
}

/// Shapes a run of a page's lines read one after the other.
fn shape_segment(mut segment: Segment, segments: &HashMap<Part, (f32, f32, f32)>, file: &File) -> Vec<Draft> {
    (segment.left, segment.right, segment.measure) = segments.get(&segment.part).copied().unwrap_or_default();
    let lines = margin_numbers(&segment, file);
    let heads = headings(&lines, &segment, file);
    let blocks = kept(&lines, &heads, &segment, file);
    let mut out: Vec<Draft> = Vec::new();
    let mut loose: Vec<Line> = Vec::new();
    let mut i = 0;
    while i < lines.len() {
        let found = heads.iter().find(|h| h.start == i).map(|h| (h.clone(), true));
        let found = found.or_else(|| blocks.iter().find(|b| b.start == i).map(|b| (b.clone(), false)));
        let Some((range, heading)) = found else {
            loose.push(lines[i].0.clone());
            i += 1;
            continue;
        };
        if !loose.is_empty() {
            out.extend(paragraphs(std::mem::take(&mut loose), &segment, file));
        }
        let part = &lines[range.clone()];
        if heading {
            let size = part.iter().map(|l| file.key(&l.0).size).max().unwrap_or(0);
            out.push(Draft::Heading { lines: part.iter().map(|l| l.0.clone()).collect(), size, given: None });
        } else {
            let sides: Vec<Side> = part.iter().filter_map(|l| l.1.as_ref().map(|n| n.1)).collect();
            let rights = sides.iter().filter(|&&s| s == Side::Right).count();
            let side = (!sides.is_empty()).then(|| if rights * 2 >= sides.len() { Side::Right } else { Side::Left });
            let left = part.iter().map(|l| l.0.left).fold(f32::INFINITY, f32::min);
            let look = (look_of(part.iter().map(|l| &l.0), file), left - segment.left > INDENT * file.size, true);
            let lines = part.iter().map(|(line, n)| (line.clone(), n.as_ref().map(|n| n.0.clone()))).collect();
            out.push(Draft::Kept { lines, side, look });
        }
        i = range.end;
    }
    if !loose.is_empty() {
        out.extend(paragraphs(loose, &segment, file));
    }
    out
}

/// Shapes a page: its columns, then each run of lines read one after the other.
fn shape_page(lines: Vec<Line>, file: &File) -> Vec<Draft> {
    let lines: Vec<Line> = lines.into_iter().filter(|l| has_text(&l.text)).collect();
    let segments = columns(lines, file);
    let mut edges: HashMap<Part, (f32, f32, f32)> = HashMap::new();
    for part in [Part::Whole, Part::Left, Part::Right] {
        let of = segments.iter().filter(|s| s.part == part).flat_map(|s| &s.lines);
        if of.clone().next().is_some() {
            edges.insert(part, text_edges(of, file));
        }
    }
    segments.into_iter().flat_map(|s| shape_segment(s, &edges, file)).collect()
}

// ---------------------------------------------------------------------------
// The file shaped
// ---------------------------------------------------------------------------

/// What a style found is shown by: the first characters of its first piece.
fn sample(draft: &Draft) -> String {
    let text = match draft {
        Draft::Paragraph { lines, .. } => text::join_lines(lines.iter().map(|l| l.text.as_str()), None),
        Draft::Kept { lines, .. } => lines.iter().map(|l| l.0.text.trim()).collect::<Vec<_>>().join("\n"),
        Draft::Heading { .. } => String::new(),
    };
    text::composed(&text).chars().take(SAMPLE).collect()
}

/// The styles of a file (`styles`): every look of paragraphs and kept lines
/// other than the body's and a heading's that occurs on two pages or more,
/// or three times or more, in the order they are first met; the others are
/// the body's. The body is the first. The index of each draft's style, in
/// step with the drafts.
fn styles(pages: &[Vec<Draft>], file: &File) -> (Vec<StyleFound>, Vec<Vec<usize>>) {
    let heading_looks: BTreeSet<Key> = pages
        .iter()
        .flatten()
        .filter_map(|d| match d {
            Draft::Heading { lines, .. } => Some(lines.iter().map(|l| file.key(l)).collect::<Vec<_>>()),
            _ => None,
        })
        .flatten()
        .collect();
    let look = |d: &Draft| match d {
        Draft::Paragraph { look, .. } | Draft::Kept { look, .. } => Some(look.clone()),
        Draft::Heading { .. } => None,
    };
    let body: Look = (file.body.clone(), false, false);
    let mut order: Vec<Look> = Vec::new();
    let mut seen: HashMap<Look, (usize, BTreeSet<usize>)> = HashMap::new();
    for (p, page) in pages.iter().enumerate() {
        for look in page.iter().filter_map(look) {
            if look == body || heading_looks.contains(&look.0) {
                continue;
            }
            let entry = seen.entry(look.clone()).or_insert_with(|| {
                order.push(look.clone());
                (0, BTreeSet::new())
            });
            entry.0 += 1;
            entry.1.insert(p);
        }
    }
    order.retain(|l| seen[l].0 >= 3 || seen[l].1.len() >= 2);
    let style_of = |key: &Key| Style {
        family: key.family.clone(),
        italic: key.italic,
        bold: key.bold,
        size: file.sizes.measured(key.size),
    };
    let mut found: Vec<StyleFound> = std::iter::once(&body)
        .chain(&order)
        .map(|(key, indent, kept)| StyleFound {
            style: style_of(key),
            indent: *indent,
            kept: *kept,
            ..Default::default()
        })
        .collect();
    let mut pages_of: Vec<BTreeSet<usize>> = vec![BTreeSet::new(); found.len()];
    let indices = pages
        .iter()
        .enumerate()
        .map(|(p, page)| {
            page.iter()
                .map(|d| {
                    let Some(look) = look(d) else { return 0 };
                    let index = order.iter().position(|o| *o == look).map_or(0, |i| i + 1);
                    let style = &mut found[index];
                    style.count += 1;
                    if style.sample.is_empty() {
                        style.sample = sample(d);
                    }
                    pages_of[index].insert(p);
                    index
                })
                .collect()
        })
        .collect();
    for (style, pages) in found.iter_mut().zip(pages_of) {
        style.pages = pages.len();
    }
    (found, indices)
}

/// Shapes every page of a file: the pieces of each page, and the styles of
/// the file, the body first. Running heads and page numbers are left out.
pub fn shape(pages: Vec<PageLines>) -> (Vec<Vec<Piece>>, Vec<StyleFound>) {
    shape_with(pages, &[])
}

/// As `shape`, with the outline the file carries of its own headings, which
/// gives the levels of the headings it names before their sizes do.
///
/// The levels of the headings come from the surest source: the file's
/// outline, where it names them (`outlined`); their numbers, 1, 1.2, 1.2.3,
/// where two or more are numbered so (`numbered`); else their sizes over the
/// file, the largest first. The title (`title_of`) is a heading of level 0.
pub fn shape_with(mut pages: Vec<PageLines>, outline: &[OutlineEntry]) -> (Vec<Vec<Piece>>, Vec<StyleFound>) {
    edges(&mut pages);
    let sizes = Sizes::of(pages.iter().flat_map(|p| &p.lines).filter(|l| has_text(&l.text)));
    let (body, step) = body_style(&pages, &sizes);
    let size = sizes.measured(body.size);
    let file = File { sizes, body, size, step };
    let mut drafts: Vec<Vec<Draft>> = pages.into_iter().map(|page| shape_page(page.lines, &file)).collect();
    outlined(&mut drafts, outline, &file);
    numbered(&mut drafts);
    let title = title_of(&drafts);

    // The levels of the other headings: their sizes over the file, the largest first.
    let heading_sizes: BTreeSet<usize> = drafts
        .iter()
        .enumerate()
        .flat_map(|(p, page)| page.iter().enumerate().map(move |(i, d)| ((p, i), d)))
        .filter_map(|(at, d)| match d {
            Draft::Heading { size, given: None, .. } if Some(at) != title => Some(*size),
            _ => None,
        })
        .collect();
    let level = |size: usize| {
        let rank = heading_sizes.iter().rev().position(|&s| s == size).unwrap_or(0);
        (rank.min(LEVELS - 1) + 1) as u8
    };
    let (found, indices) = styles(&drafts, &file);
    let shaped = drafts
        .into_iter()
        .zip(indices)
        .enumerate()
        .map(|(p, (page, indices))| {
            page.into_iter()
                .zip(indices)
                .enumerate()
                .map(|(i, (draft, style))| match draft {
                    Draft::Heading { lines, .. } if Some((p, i)) == title => Piece::Heading { level: 0, lines },
                    Draft::Heading { lines, given: Some(given), .. } => {
                        Piece::Heading { level: given.clamp(1, LEVELS as u8), lines }
                    }
                    Draft::Heading { lines, size, given: None } => Piece::Heading { level: level(size), lines },
                    Draft::Paragraph { lines, indent, .. } => Piece::Paragraph { lines, indent, style },
                    Draft::Kept { lines, side, .. } => Piece::KeptLines { lines, side, style },
                })
                .collect()
        })
        .collect();
    (shaped, found)
}

// ---------------------------------------------------------------------------
// The title, numbered headings and the file's outline
// ---------------------------------------------------------------------------

/// The title of the document: the first heading of the file, where its size
/// is larger than every other heading's and no other heading has that size.
/// A book whose chapters are named as large as its title has none.
fn title_of(drafts: &[Vec<Draft>]) -> Option<(usize, usize)> {
    let headings: Vec<((usize, usize), usize)> = drafts
        .iter()
        .enumerate()
        .flat_map(|(p, page)| page.iter().enumerate().map(move |(i, d)| ((p, i), d)))
        .filter_map(|(at, d)| match d {
            Draft::Heading { size, .. } => Some((at, *size)),
            _ => None,
        })
        .collect();
    let (first, size) = *headings.first()?;
    let alone = headings.iter().filter(|(_, s)| *s >= size).count() == 1;
    alone.then_some(first)
}

/// The words of a heading as compared with the file's outline: small
/// letters, digits and letters only, one space between words, a leading
/// number (1, 1.2, IV.) left out.
fn heading_words(text: &str) -> String {
    let words: Vec<String> =
        text.split(|c: char| !c.is_alphanumeric()).filter(|w| !w.is_empty()).map(str::to_lowercase).collect();
    let numbered = |w: &str| w.chars().all(|c| c.is_ascii_digit()) || roman(w).is_some();
    let start = words.iter().take_while(|w| numbered(w)).count().min(words.len().saturating_sub(1));
    words[start..].join(" ")
}

/// Whether a heading's words and an entry of the outline say the same: the
/// one the other, or the one the beginning of the other.
fn same_heading(a: &str, b: &str) -> bool {
    let (short, long) = if a.len() <= b.len() { (a, b) } else { (b, a) };
    short.chars().count() >= 3 && (long == short || long.starts_with(&format!("{short} ")))
}

/// The levels the file's outline gives the headings it names. Each entry
/// with a page is matched with a heading on that page, or on the next, whose
/// words are its words; where none is, with a paragraph of that page whose
/// first line is its words, which is then a heading of its own (the whole
/// paragraph, where it has one line), set in the body's size or near it,
/// where the sizes could not see it. An outline that matches
/// fewer than half its entries is of another version of the text, and is
/// not used.
fn outlined(drafts: &mut [Vec<Draft>], outline: &[OutlineEntry], file: &File) {
    let with_page = outline.iter().filter(|e| e.page.is_some()).count();
    if with_page == 0 {
        return;
    }
    // Where each entry is found: the page, the piece, whether its first line is cut off, the depth.
    let mut found: Vec<(usize, usize, bool, u8)> = Vec::new();
    for entry in outline {
        let (Some(page), want) = (entry.page, heading_words(&entry.title)) else { continue };
        if want.is_empty() || page == 0 {
            continue;
        }
        let taken = |p: usize, i: usize, found: &[(usize, usize, bool, u8)]| found.iter().any(|f| f.0 == p && f.1 == i);
        let mut hit = None;
        'pages: for p in [page - 1, page] {
            for (i, d) in drafts.get(p).into_iter().flatten().enumerate() {
                if let Draft::Heading { lines, .. } = d
                    && !taken(p, i, &found)
                    && same_heading(&heading_words(&texts_of(lines)), &want)
                {
                    hit = Some((p, i, false));
                    break 'pages;
                }
            }
        }
        if hit.is_none() {
            for (i, d) in drafts.get(page - 1).into_iter().flatten().enumerate() {
                if let Draft::Paragraph { lines, .. } = d
                    && !lines.is_empty()
                    && !taken(page - 1, i, &found)
                    && heading_words(&lines[0].text) == want
                {
                    hit = Some((page - 1, i, true));
                    break;
                }
            }
        }
        if let Some((p, i, cut)) = hit {
            found.push((p, i, cut, entry.depth.max(1)));
        }
    }
    if found.len() * 2 < with_page {
        return;
    }
    // From the last, so that a piece cut in two leaves the places of those before it as they were.
    found.sort_by_key(|f| std::cmp::Reverse((f.0, f.1)));
    for (p, i, cut, depth) in found {
        if cut {
            let Draft::Paragraph { lines, look, .. } = drafts[p].remove(i) else { continue };
            let mut lines = lines.into_iter();
            let first = lines.next().expect("a line");
            let size = file.key(&first).size;
            let rest: Vec<Line> = lines.collect();
            // A paragraph of one line is the heading whole.
            if !rest.is_empty() {
                drafts[p].insert(i, Draft::Paragraph { lines: rest, indent: false, look });
            }
            drafts[p].insert(i, Draft::Heading { lines: vec![first], size, given: Some(depth) });
        } else if let Draft::Heading { given, .. } = &mut drafts[p][i] {
            *given = Some(depth);
        }
    }
}

/// The depth of a heading's number: 1 of `1`, 3 of `1.2.3`, with a dot after
/// it or not, where a space or nothing follows. None where it has no such
/// number.
fn number_depth(text: &str) -> Option<u8> {
    let first = text.split_whitespace().next()?;
    let number = first.strip_suffix('.').unwrap_or(first);
    let parts: Vec<&str> = number.split('.').collect();
    (!parts.is_empty() && parts.iter().all(|p| !p.is_empty() && p.len() <= 3 && p.chars().all(|c| c.is_ascii_digit())))
        .then(|| parts.len().min(LEVELS) as u8)
}

/// The levels numbered headings have by their numbers, where two or more of
/// the file's headings that the outline did not name are numbered: a single
/// one, a year or a figure, is left to its size.
fn numbered(drafts: &mut [Vec<Draft>]) {
    let depth_of = |d: &Draft| match d {
        Draft::Heading { lines, given: None, .. } => lines.first().and_then(|l| number_depth(&l.text)),
        _ => None,
    };
    if drafts.iter().flatten().filter(|d| depth_of(d).is_some()).count() < 2 {
        return;
    }
    for d in drafts.iter_mut().flatten() {
        if let Some(depth) = depth_of(d)
            && let Draft::Heading { given, .. } = d
        {
            *given = Some(depth);
        }
    }
}

/// The text of lines, a space between them.
fn texts_of(lines: &[Line]) -> String {
    lines.iter().map(|l| l.text.trim()).collect::<Vec<_>>().join(" ")
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The width of a character, as a part of the size, in the lines made here.
    const WIDTH: f32 = 0.5;
    /// The pages made here: A4 in points, the text from 72 to 523.
    const PAGE: (f32, f32) = (595.0, 842.0);
    const LEFT: f32 = 72.0;
    const MEASURE: f32 = 451.0;

    fn line(text: &str, left: f32, right: f32, top: f32, bottom: f32, size: f32) -> Line {
        Line {
            text: text.to_owned(),
            left,
            right,
            top,
            bottom,
            style: Style { family: "Serif".into(), size, ..Default::default() },
            runs: Vec::new(),
            gaps: None,
        }
    }

    /// A line as wide as its characters.
    fn at(text: &str, left: f32, top: f32, size: f32) -> Line {
        let right = left + text.chars().count() as f32 * WIDTH * size;
        line(text, left, right, top, top + size, size)
    }

    fn page(lines: Vec<Line>) -> PageLines {
        PageLines { lines, width: PAGE.0, height: PAGE.1 }
    }

    /// Lines set down a page, one under the other, at a step of 1.2 times their size.
    struct Pen {
        top: f32,
        left: f32,
        measure: f32,
        lines: Vec<Line>,
    }

    impl Pen {
        fn new() -> Pen {
            Pen { top: 120.0, left: LEFT, measure: MEASURE, lines: Vec::new() }
        }

        /// A paragraph, broken where the next word does not fit; justified,
        /// its lines but the last reach the right edge.
        fn text(&mut self, text: &str, size: f32, indent: f32, justified: bool) -> &mut Pen {
            let measure = self.measure;
            let fits =
                |chars: usize, first: bool| chars as f32 * WIDTH * size <= measure - if first { indent } else { 0.0 };
            let mut set: Vec<String> = Vec::new();
            let mut current = String::new();
            for word in text.split_whitespace() {
                let longer = if current.is_empty() { word.to_owned() } else { format!("{current} {word}") };
                if fits(longer.chars().count(), set.is_empty()) {
                    current = longer;
                } else {
                    set.push(std::mem::replace(&mut current, word.to_owned()));
                }
            }
            set.push(current);
            let count = set.len();
            for (i, text) in set.into_iter().enumerate() {
                let left = self.left + if i == 0 { indent } else { 0.0 };
                let mut l = at(&text, left, self.top, size);
                if justified && i + 1 < count {
                    l.right = self.left + self.measure;
                }
                self.lines.push(l);
                self.top += 1.2 * size;
            }
            self
        }

        /// Lines as they are, each where it begins.
        fn lines(&mut self, lines: &[&str], left: f32, size: f32) -> &mut Pen {
            for text in lines {
                self.lines.push(at(text, left, self.top, size));
                self.top += 1.2 * size;
            }
            self
        }

        fn space(&mut self, by: f32) -> &mut Pen {
            self.top += by;
            self
        }

        fn page(&mut self) -> PageLines {
            page(std::mem::take(&mut self.lines))
        }
    }

    fn texts(lines: &[Line]) -> String {
        lines.iter().map(|l| l.text.as_str()).collect::<Vec<_>>().join(" ")
    }

    fn all_text(pieces: &[Vec<Piece>]) -> String {
        pieces
            .iter()
            .flatten()
            .map(|p| match p {
                Piece::Heading { lines, .. } | Piece::Paragraph { lines, .. } => texts(lines),
                Piece::KeptLines { lines, .. } => lines.iter().map(|l| l.0.text.as_str()).collect::<Vec<_>>().join(" "),
            })
            .collect::<Vec<_>>()
            .join(" ")
    }

    const NOVEL: [&str; 8] = [
        "The rain had not stopped since the morning, and by the time the coach reached the inn the road had become a river of mud that sucked at the wheels and made the horses stumble and blow.",
        "\"Is there a room?\" she asked.",
        "\"There is always a room,\" said the landlord, and wiped his hands on his apron.",
        "She followed him up the narrow stair, past a window that looked out over the yard, where a boy was leading the horses into the stable one by one, talking to each of them softly as if they could understand every word he said to them, which perhaps they could.",
        "\"Thank you.\"",
        "The room was small and smelled of smoke. A fire had been laid but not lit, and the bed was made up with sheets that were clean if not new. She sat down on the edge of it and listened to the rain on the roof, and for the first time in three days she let herself think of what she had left behind, and of what lay before her, and found that she could not tell which frightened her more.",
        "\"Will you eat?\" he called up the stair.",
        "\"Later,\" she said. \"Not now.\"",
    ];

    /// Pages of a novel: prose in one style, justified, each paragraph's
    /// first line indented, and the number of the page at its foot.
    fn novel(pages: usize) -> Vec<PageLines> {
        (0..pages)
            .map(|p| {
                let mut pen = Pen::new();
                for k in 0..12 {
                    pen.text(NOVEL[(k + p) % NOVEL.len()], 11.0, 11.0, true);
                }
                pen.lines.push(at(&format!("{}", p + 17), 290.0, 790.0, 10.0));
                pen.page()
            })
            .collect()
    }

    #[test]
    fn a_page_of_a_novel_is_paragraphs_in_the_body_alone() {
        let (pieces, styles) = shape(novel(3));
        assert_eq!(styles.len(), 1, "{styles:#?}");
        assert_eq!(styles[0].style.size, 11.0);
        assert!(!styles[0].kept && !styles[0].indent);
        assert!(styles[0].sample.starts_with("The rain had not stopped"), "{}", styles[0].sample);
        for page in &pieces {
            assert_eq!(page.len(), 12);
            for piece in page {
                let Piece::Paragraph { style: 0, indent: true, .. } = piece else { panic!("{piece:#?}") };
            }
        }
        // The numbers of the pages are gone.
        let text = all_text(&pieces);
        assert!(!text.contains("17") && !text.contains("19"));
        assert_eq!(styles[0].count, 36);
        assert_eq!(styles[0].pages, 3);
    }

    #[test]
    fn a_page_of_a_novel_as_tesseract_reads_it_is_the_same() {
        // No font: the size is the line's height, which wanders with the
        // letters of the line, and the left ends are a little uneven.
        let mut pages = novel(3);
        for (k, line) in pages.iter_mut().flat_map(|p| &mut p.lines).enumerate() {
            let height = 11.0 * (0.85 + 0.03 * (k % 9) as f32);
            line.bottom = line.top + height;
            line.style = Style { size: height, ..Default::default() };
            line.left += [0.0, 1.0, -1.0, 0.5][k % 4];
        }
        let (pieces, styles) = shape(pages);
        assert_eq!(styles.len(), 1, "{styles:#?}");
        for page in &pieces {
            assert_eq!(page.len(), 12);
            assert!(page.iter().all(|p| matches!(p, Piece::Paragraph { style: 0, indent: true, .. })));
        }
        assert!(!all_text(&pieces).contains("17"));
    }

    #[test]
    fn an_address_is_kept_as_lines() {
        let mut pen = Pen::new();
        pen.text(NOVEL[0], 11.0, 11.0, true).space(13.2);
        pen.lines(&["Mrs Anne Holt", "The Old Inn", "Upper Valley Road", "Hilltown"], LEFT, 11.0).space(13.2);
        pen.text(NOVEL[5], 11.0, 11.0, true);
        let (pieces, _) = shape(vec![pen.page()]);
        let Piece::KeptLines { lines, side: None, style: 0 } = &pieces[0][1] else { panic!("{:#?}", pieces[0]) };
        assert_eq!(lines.len(), 4);
        assert!(matches!(pieces[0][2], Piece::Paragraph { .. }));
    }

    #[test]
    fn prose_set_ragged_is_not_kept() {
        // Not justified, not indented, the paragraphs apart by a line.
        let pages: Vec<PageLines> = (0..2)
            .map(|p| {
                let mut pen = Pen::new();
                for k in 0..10 {
                    pen.text(NOVEL[(k + p) % NOVEL.len()], 11.0, 0.0, false).space(13.2);
                }
                pen.page()
            })
            .collect();
        let (pieces, styles) = shape(pages);
        assert_eq!(styles.len(), 1, "{styles:#?}");
        assert!(pieces.iter().flatten().all(|p| matches!(p, Piece::Paragraph { style: 0, indent: false, .. })));
    }

    #[test]
    fn running_heads_over_four_pages_are_left_out() {
        // A head that alternates with another, its number changing; and a
        // line at the foot the same on every page.
        let pages: Vec<PageLines> = (0..4)
            .map(|p| {
                let mut pen = Pen::new();
                pen.text(NOVEL[p], 11.0, 11.0, true).text(NOVEL[p + 1], 11.0, 11.0, true);
                let n = p + 12;
                let head = if p % 2 == 0 { format!("{n}   THE WIDOW AT THE INN") } else { format!("A NOVEL   {n}") };
                pen.lines.insert(0, at(&head, LEFT, 40.0, 9.0));
                pen.lines.push(at("Printed in Norway", LEFT, 800.0, 8.0));
                pen.page()
            })
            .collect();
        let (pieces, _) = shape(pages);
        let text = all_text(&pieces);
        assert!(!text.contains("WIDOW") && !text.contains("NOVEL") && !text.contains("Printed"), "{text}");
        assert_eq!(pieces.iter().map(Vec::len).sum::<usize>(), 8);
    }

    #[test]
    fn a_page_number_beside_the_running_head_goes_with_it() {
        // The number on the head's row, but a line of its own, as some readers give it.
        let pages: Vec<PageLines> = (0..3)
            .map(|p| {
                let mut pen = Pen::new();
                pen.text(NOVEL[p], 11.0, 11.0, true).text(NOVEL[p + 3], 11.0, 11.0, true);
                pen.lines.insert(0, at("THE WIDOW AT THE INN", LEFT, 40.0, 9.0));
                pen.lines.insert(1, at(&format!("{}", p + 40), 510.0, 40.0, 9.0));
                pen.page()
            })
            .collect();
        let (pieces, _) = shape(pages);
        let text = all_text(&pieces);
        assert!(!text.contains("WIDOW") && !text.contains("41"), "{text}");
    }

    #[test]
    fn a_head_on_two_pages_alone_stays() {
        let pages: Vec<PageLines> = (0..2)
            .map(|p| {
                let mut pen = Pen::new();
                pen.lines.push(at("CONTENTS", LEFT, 40.0, 9.0));
                pen.text(NOVEL[p], 11.0, 11.0, true);
                pen.page()
            })
            .collect();
        let (pieces, _) = shape(pages);
        assert!(all_text(&pieces).contains("CONTENTS"));
    }

    #[test]
    fn page_numbers_at_the_foot_go_where_they_step() {
        let pages: Vec<PageLines> = ["xi", "xii", "xiii"]
            .iter()
            .map(|n| {
                let mut pen = Pen::new();
                pen.text(NOVEL[0], 11.0, 11.0, true);
                pen.lines.push(at(n, 290.0, 790.0, 10.0));
                pen.page()
            })
            .collect();
        let (pieces, _) = shape(pages);
        assert!(!all_text(&pieces).contains("xi"));
        // One page alone: the number at its foot goes as the last line.
        let mut pen = Pen::new();
        pen.text(NOVEL[0], 11.0, 11.0, true);
        pen.lines.push(at("- 4 -", 290.0, 790.0, 10.0));
        let (pieces, _) = shape(vec![pen.page()]);
        assert!(!all_text(&pieces).contains('4'));
        assert_eq!(page_number("A-3"), Some(("A-".into(), 3)));
        assert_eq!(page_number("[17]"), Some((String::new(), 17)));
        assert_eq!(page_number("XIV"), Some(("I".into(), 14)));
        assert_eq!(page_number("civil"), None);
        assert_eq!(page_number("Chapter"), None);
    }

    #[test]
    fn headings_by_size_and_by_bold_with_their_levels() {
        let mut pen = Pen::new();
        pen.lines(&["The Widow at the Inn"], LEFT, 18.0).space(14.0);
        pen.text(NOVEL[0], 11.0, 0.0, true).space(10.0);
        pen.lines(&["The first evening"], LEFT, 14.0).space(6.0);
        pen.text(NOVEL[3], 11.0, 0.0, true).space(8.0);
        let bold = pen.lines.len();
        pen.lines(&["A note on the road"], LEFT, 11.0).space(6.0);
        pen.text(NOVEL[5], 11.0, 0.0, true);
        // A bold line run into a paragraph, without room around it, is not a heading.
        let run_in = pen.lines.len() + 1;
        pen.text(NOVEL[3], 11.0, 11.0, true);
        let mut first = pen.page();
        first.lines[bold].style.bold = true;
        first.lines[run_in].style.bold = true;
        let mut pen = Pen::new();
        pen.lines(&["The second evening"], LEFT, 14.0).space(6.0);
        pen.text(NOVEL[5], 11.0, 0.0, true);
        let (pieces, styles) = shape(vec![first, pen.page()]);
        let heads: Vec<(u8, String)> = pieces
            .iter()
            .flatten()
            .filter_map(|p| match p {
                Piece::Heading { level, lines } => Some((*level, texts(lines))),
                _ => None,
            })
            .collect();
        assert_eq!(
            heads,
            [
                // The one heading larger than all the others, the first, is the title.
                (0, "The Widow at the Inn".to_owned()),
                (1, "The first evening".to_owned()),
                (2, "A note on the road".to_owned()),
                (1, "The second evening".to_owned()),
            ]
        );
        assert_eq!(styles.len(), 1, "{styles:#?}");
    }

    #[test]
    fn the_title_is_the_first_heading_larger_than_all_others_alone() {
        let page = |first: &str, size: f32| {
            let mut pen = Pen::new();
            pen.lines(&[first], LEFT, size).space(14.0);
            pen.text(NOVEL[0], 11.0, 0.0, true).space(10.0);
            for (i, name) in ["The first evening", "The second evening"].iter().enumerate() {
                pen.lines(&[name], LEFT, 14.0).space(6.0);
                pen.text(NOVEL[i + 3], 11.0, 0.0, true).space(8.0);
            }
            pen.page()
        };
        let levels = |pages: Vec<PageLines>| -> Vec<u8> {
            shape(pages)
                .0
                .iter()
                .flatten()
                .filter_map(|p| if let Piece::Heading { level, .. } = p { Some(*level) } else { None })
                .collect()
        };
        assert_eq!(levels(vec![page("A Short Treatise", 20.0)]), [0, 1, 1]);
        // As large as the chapters, it is one of them.
        assert_eq!(levels(vec![page("Prologue", 14.0)]), [1, 1, 1]);
        // A larger heading that is not the first is no title.
        let mut pen = Pen::new();
        pen.lines(&["The first evening"], LEFT, 14.0).space(6.0);
        pen.text(NOVEL[0], 11.0, 0.0, true).space(8.0);
        pen.lines(&["An Interlude"], LEFT, 20.0).space(14.0);
        pen.text(NOVEL[3], 11.0, 0.0, true);
        assert_eq!(levels(vec![pen.page()]), [2, 1]);
    }

    #[test]
    fn numbered_headings_have_the_depth_of_their_numbers() {
        let heads = |names: &[&str]| -> Vec<(u8, String)> {
            let mut pen = Pen::new();
            for (i, name) in names.iter().enumerate() {
                pen.lines(&[name], LEFT, 14.0).space(6.0);
                pen.text(NOVEL[i % 4], 11.0, 0.0, true).space(8.0);
            }
            shape(vec![pen.page()])
                .0
                .iter()
                .flatten()
                .filter_map(
                    |p| if let Piece::Heading { level, lines } = p { Some((*level, texts(lines))) } else { None },
                )
                .collect()
        };
        let got = heads(&["1 One", "1.1 Under it", "2. Two"]);
        assert_eq!(got.iter().map(|h| h.0).collect::<Vec<_>>(), [1, 2, 1], "{got:?}");
        // One number alone, or a year, is left to its size.
        let got = heads(&["1990 and after", "The next ones", "Last of all"]);
        assert_eq!(got.iter().map(|h| h.0).collect::<Vec<_>>(), [1, 1, 1], "{got:?}");
        assert_eq!(number_depth("1.2.3 Deep"), Some(3));
        assert_eq!(number_depth("3. Methods"), Some(1));
        assert_eq!(number_depth("1990 and after"), None);
        assert_eq!(number_depth("Chapter 1"), None);
    }

    #[test]
    fn the_files_outline_gives_the_levels_it_names() {
        // Two headings of one size on two pages, the outline saying the second is under the first;
        // and a heading in the body's size, the first line of a paragraph, that only the outline names.
        let mut first = Pen::new();
        first.lines(&["Beginnings"], LEFT, 14.0).space(6.0);
        first.text(NOVEL[0], 11.0, 0.0, true);
        let mut second = Pen::new();
        second.lines(&["The first part"], LEFT, 14.0).space(6.0);
        second.text(NOVEL[3], 11.0, 0.0, true).space(8.0);
        second.lines(&["A part in the body's size"], LEFT, 11.0);
        second.text(NOVEL[5], 11.0, 0.0, true);
        let pages = vec![first.page(), second.page()];
        let entry = |title: &str, page: usize, depth: u8| OutlineEntry { title: title.into(), page: Some(page), depth };
        let outline =
            [entry("1 Beginnings", 1, 1), entry("1.1 The first part", 2, 2), entry("A part in the body's size", 2, 2)];
        let (pieces, _) = shape_with(pages.clone(), &outline);
        let heads: Vec<(u8, String)> = pieces
            .iter()
            .flatten()
            .filter_map(|p| if let Piece::Heading { level, lines } = p { Some((*level, texts(lines))) } else { None })
            .collect();
        assert_eq!(
            heads,
            [
                (1, "Beginnings".to_owned()),
                (2, "The first part".to_owned()),
                (2, "A part in the body's size".to_owned()),
            ]
        );
        // An outline that names almost nothing of the text is of another version of it.
        let other = [entry("Beginnings", 1, 2), entry("Elsewhere", 2, 1), entry("Nowhere", 2, 1)];
        let (pieces, _) = shape_with(pages, &other);
        let levels: Vec<u8> = pieces
            .iter()
            .flatten()
            .filter_map(|p| if let Piece::Heading { level, .. } = p { Some(*level) } else { None })
            .collect();
        assert_eq!(levels, [1, 1]);
    }

    #[test]
    fn a_heading_of_two_lines_is_one() {
        let mut pen = Pen::new();
        pen.lines(&["The Widow", "at the Inn"], LEFT, 18.0).space(14.0);
        pen.text(NOVEL[0], 11.0, 0.0, true).text(NOVEL[3], 11.0, 11.0, true);
        let (pieces, _) = shape(vec![pen.page()]);
        let Piece::Heading { level: 0, lines } = &pieces[0][0] else { panic!("{:#?}", pieces[0][0]) };
        assert_eq!(lines.len(), 2);
    }

    #[test]
    fn a_larger_heading_needs_no_room_below_a_larger_first_line_is_none() {
        // Room above, none below, short: a heading as many programs set one.
        let mut pen = Pen::new();
        pen.text(NOVEL[0], 11.0, 11.0, true).space(12.0);
        pen.lines(&["The first evening"], LEFT, 14.0);
        pen.text(NOVEL[3], 11.0, 0.0, true).space(12.0);
        // A first line set larger that reaches the right edge runs into its paragraph.
        let lead = pen.lines.len();
        pen.text(NOVEL[5], 11.0, 0.0, true);
        let mut page = pen.page();
        let line = &mut page.lines[lead];
        line.style.size = 14.0;
        line.bottom = line.top + 14.0;
        let (pieces, _) = shape(vec![page]);
        let heads: Vec<String> = pieces[0]
            .iter()
            .filter_map(|p| match p {
                Piece::Heading { lines, .. } => Some(texts(lines)),
                _ => None,
            })
            .collect();
        assert_eq!(heads, ["The first evening"]);
    }

    #[test]
    fn a_title_in_the_words_of_the_running_head_stays() {
        let pages: Vec<PageLines> = (0..4)
            .map(|p| {
                let mut pen = Pen::new();
                pen.top = 60.0;
                if p == 0 {
                    pen.lines(&["The Widow at the Inn"], LEFT, 18.0).space(14.0);
                } else {
                    pen.lines.push(at("THE WIDOW AT THE INN", LEFT, 40.0, 9.0));
                }
                pen.text(NOVEL[p], 11.0, 11.0, true).text(NOVEL[p + 2], 11.0, 11.0, true);
                pen.page()
            })
            .collect();
        let (pieces, _) = shape(pages);
        assert!(matches!(&pieces[0][0], Piece::Heading { level: 0, .. }), "{:#?}", pieces[0][0]);
        assert!(!all_text(&pieces[1..]).contains("WIDOW"));
    }

    const VERSE: [&str; 12] = [
        "Sing, goddess, of the anger",
        "of the son of Peleus,",
        "the ruinous anger which brought",
        "countless woes upon the Achaeans,",
        "and sent forth to Hades",
        "many valiant souls of heroes,",
        "and made them themselves a spoil",
        "for dogs and every bird;",
        "and thus the will of Zeus",
        "was being brought to fulfilment,",
        "from the time when first they parted",
        "in strife, the king of men and Achilles.",
    ];

    /// A page of prose, then verse with a number at every fifth line on the right.
    fn numbered(on_the_line: bool) -> PageLines {
        let mut pen = Pen::new();
        pen.text(NOVEL[3], 11.0, 11.0, true).space(13.2);
        let first = pen.lines.len();
        pen.lines(&VERSE, LEFT + 33.0, 11.0);
        let mut page = pen.page();
        for (k, n) in [(4, "5"), (9, "10")] {
            let verse = &mut page.lines[first + k];
            if on_the_line {
                // Drawn on the line's own baseline: the PDF's text gives it at the line's end.
                verse.text = format!("{} {n}", verse.text);
                verse.right = 540.0;
            } else {
                let number = line(n, 535.0, 535.0 + n.len() as f32 * 5.5, verse.top, verse.bottom, 11.0);
                page.lines.push(number);
            }
        }
        page
    }

    #[test]
    fn lines_kept_with_numbers_in_the_margin() {
        for on_the_line in [true, false] {
            let (pieces, styles) = shape(vec![numbered(on_the_line)]);
            let page = &pieces[0];
            assert_eq!(page.len(), 2, "{page:#?}");
            assert!(matches!(page[0], Piece::Paragraph { style: 0, .. }));
            let Piece::KeptLines { lines, side, .. } = &page[1] else { panic!("{:#?}", page[1]) };
            assert_eq!(*side, Some(Side::Right));
            assert_eq!(lines.len(), 12);
            let numbers: Vec<(usize, &str)> =
                lines.iter().enumerate().filter_map(|(i, l)| Some((i, l.1.as_deref()?))).collect();
            assert_eq!(numbers, [(4, "5"), (9, "10")]);
            assert_eq!(lines[4].0.text, "and sent forth to Hades");
            assert_eq!(lines[9].0.text, "was being brought to fulfilment,");
            assert!(lines[4].0.right < 400.0);
            // Once, on one page: the body's.
            assert_eq!(styles.len(), 1);
        }
    }

    /// A space wider than a byte before the last word of a line (the no-break
    /// space French puts before `?` and `»`, LaTeX's `~`, a thin space) is
    /// a space like any other, before a number in the margin, a number
    /// within the edges, or a word.
    #[test]
    fn a_space_of_more_than_one_byte_before_the_last_word_is_a_space() {
        for space in ['\u{a0}', '\u{2009}', '\u{202f}', '\u{3000}'] {
            let mut page = numbered(true);
            for l in &mut page.lines {
                if let Some((text, n)) = l.text.rsplit_once(' ')
                    && (n == "5" || n == "10")
                {
                    l.text = format!("{text}{space}{n}");
                }
            }
            let (pieces, _) = shape(vec![page]);
            let Piece::KeptLines { lines, .. } = &pieces[0][1] else { panic!("{:#?}", pieces[0]) };
            let numbers: Vec<(usize, &str)> =
                lines.iter().enumerate().filter_map(|(i, l)| Some((i, l.1.as_deref()?))).collect();
            assert_eq!(numbers, [(4, "5"), (9, "10")], "{space:?}");

            let mut pen = Pen::new();
            pen.text(NOVEL[3], 11.0, 11.0, true).space(13.2);
            let asked = format!("Pourquoi{space}?");
            let seen = format!("voir p.{space}12");
            pen.lines(&[&asked, &seen, "et ainsi de suite."], LEFT, 11.0);
            let (pieces, _) = shape(vec![pen.page()]);
            let all = all_text(&pieces);
            assert!(all.contains(&asked) && all.contains(&seen), "{space:?}: {all}");
        }
    }

    #[test]
    fn numbers_within_the_edges_that_count_up_are_the_lines_numbers() {
        // At the right edge of a page of prose, as in many editions: within the text's edges.
        for on_the_line in [true, false] {
            let mut pen = Pen::new();
            pen.text(NOVEL[3], 11.0, 11.0, true).space(13.2);
            let first = pen.lines.len();
            pen.lines(&VERSE, LEFT, 11.0).space(13.2);
            pen.text(NOVEL[5], 11.0, 11.0, true);
            let mut page = pen.page();
            // From the last, so that the places of the others hold.
            for (k, n) in [(9, "10"), (4, "5")] {
                let verse = &mut page.lines[first + k];
                if on_the_line {
                    verse.text = format!("{} {n}", verse.text);
                    verse.right = LEFT + MEASURE;
                } else {
                    let left = LEFT + MEASURE - n.len() as f32 * 5.5;
                    let number = line(n, left, LEFT + MEASURE, verse.top, verse.bottom, 11.0);
                    page.lines.insert(first + k + 1, number);
                }
            }
            let (pieces, _) = shape(vec![page]);
            let page = &pieces[0];
            let Piece::KeptLines { lines, side, .. } = &page[1] else { panic!("{page:#?}") };
            assert_eq!(*side, Some(Side::Right));
            let numbers: Vec<(usize, &str)> =
                lines.iter().enumerate().filter_map(|(i, l)| Some((i, l.1.as_deref()?))).collect();
            assert_eq!(numbers, [(4, "5"), (9, "10")]);
            assert_eq!(lines[9].0.text, "was being brought to fulfilment,");
            assert_eq!(page.len(), 3);
        }
    }

    #[test]
    fn a_number_after_a_wide_space_measured_is_the_lines_and_after_a_word_space_text() {
        // Long lines kept, their numbers at the end of the measure, too near
        // for a guess from the width of letters to tell; below, smaller text
        // as wide as the measure, one line ending in a number of what it cites.
        // The first number stands beyond the edge too, or within it as the
        // others; one line runs up to its number, a point from it, flush
        // with the others.
        for beyond in [false, true] {
            let mut lines = Vec::new();
            let mut top = 72.0;
            for k in 0..10 {
                let text = format!("Line {k} of a long verse that runs on nearly to the end of the measure");
                let right = LEFT + 380.0 + (k % 3) as f32 * 20.0;
                let mut verse = line(&text, LEFT, right, top, top + 11.0, 11.0);
                verse.gaps = Some(Vec::new());
                if let Some(n) = [(4, "765"), (7, "768"), (9, "770")].iter().find(|(at, _)| *at == k).map(|(_, n)| *n) {
                    verse.text = format!("{text} {n}");
                    verse.right = LEFT + MEASURE + if beyond && k == 4 { 30.0 } else { 0.0 };
                    let begins = verse.right - 3.0 * 5.5;
                    let from = if k == 7 { begins - 1.0 } else { right };
                    verse.gaps = Some(vec![Gap { at: text.len() + 1, from, to: begins }]);
                }
                lines.push(verse);
                top += 13.2;
            }
            top += 20.0;
            for text in [
                "697 Dindorf : -κκαυσα R: -κκυσα cett., Su. α 3033",
                "698 γ᾽ εἰ R: ἐὰν cett. 700 εἰ . . . εἰ R: ἢν . . . ἢν cett. and more",
            ] {
                let mut note = line(text, LEFT, LEFT + MEASURE, top, top + 9.0, 9.0);
                let at = text.rfind(' ').unwrap() + 1;
                note.gaps = Some(vec![Gap { at, from: LEFT + MEASURE - 25.0, to: LEFT + MEASURE - 22.0 }]);
                lines.push(note);
                top += 11.0;
            }
            let (pieces, _) = shape(vec![page(lines)]);
            let page = &pieces[0];
            let Piece::KeptLines { lines, side, .. } = &page[0] else { panic!("{page:#?}") };
            assert_eq!(*side, Some(Side::Right));
            let numbers: Vec<(usize, &str)> =
                lines.iter().enumerate().filter_map(|(i, l)| Some((i, l.1.as_deref()?))).collect();
            assert_eq!(numbers, [(4, "765"), (7, "768"), (9, "770")]);
            assert!(lines[7].0.text.ends_with("measure"), "{:?}", lines[7].0.text);
            assert!(lines[4].0.text.ends_with("measure"), "{:?}", lines[4].0.text);
            let notes = all_text(&pieces);
            assert!(notes.contains("Su. α 3033 698"), "{notes}");
        }
    }

    #[test]
    fn figures_of_a_table_and_years_in_prose_are_not_numbers_of_lines() {
        let mut pen = Pen::new();
        pen.text(NOVEL[3], 11.0, 11.0, true).space(13.2);
        let first = pen.lines.len();
        pen.lines(&["Apples", "Pears", "Plums", "Cherries"], LEFT, 11.0).space(13.2);
        // Prose whose lines end with years, a few lines apart.
        let prose = pen.lines.len();
        pen.text(NOVEL[5], 11.0, 11.0, true);
        let mut page = pen.page();
        for (k, n) in ["4", "7", "9", "12"].iter().enumerate() {
            let row = &page.lines[first + k];
            let figure = line(n, 500.0, 500.0 + n.len() as f32 * 5.5, row.top, row.bottom, 11.0);
            page.lines.insert(first + k * 2 + 1, figure);
        }
        let prose = prose + 4;
        for (k, year) in [(0, "1914"), (2, "1918")] {
            let l = &mut page.lines[prose + k];
            let text = l.text.rsplit_once(' ').map_or(l.text.clone(), |(head, _)| head.to_owned());
            l.text = format!("{text} {year}");
        }
        let (pieces, _) = shape(vec![page]);
        let text = all_text(&pieces);
        assert!(text.contains("Apples 4") || text.contains("Apples") && text.contains(" 4"), "{text}");
        assert!(text.contains("1914") && text.contains("1918"));
        assert!(pieces[0].iter().all(|p| !matches!(p, Piece::KeptLines { side: Some(_), .. })), "{:#?}", pieces[0]);
    }

    #[test]
    fn numbers_in_the_left_margin_and_lines_begun_with_one() {
        let mut pen = Pen::new();
        pen.text(NOVEL[3], 11.0, 11.0, true).space(13.2);
        let first = pen.lines.len();
        pen.lines(&VERSE[..6], LEFT, 11.0);
        let mut page = pen.page();
        let verse = &mut page.lines[first + 4];
        verse.text = format!("5 {}", verse.text);
        verse.left = 40.0;
        let (pieces, _) = shape(vec![page]);
        let Piece::KeptLines { lines, side, .. } = &pieces[0][1] else { panic!("{:#?}", pieces[0]) };
        assert_eq!(*side, Some(Side::Left));
        assert_eq!(lines[4].1.as_deref(), Some("5"));
        assert_eq!(lines[4].0.text, "and sent forth to Hades");
        assert_eq!(lines[4].0.left, LEFT);
    }

    #[test]
    fn verse_without_numbers_is_kept_by_its_stanzas() {
        let pages: Vec<PageLines> = (0..2)
            .map(|_| {
                let mut pen = Pen::new();
                pen.text(NOVEL[3], 11.0, 11.0, true).space(13.2);
                pen.lines(&VERSE[..4], LEFT + 33.0, 11.0).space(13.2);
                pen.lines(&VERSE[4..8], LEFT + 33.0, 11.0).space(13.2);
                pen.text(NOVEL[5], 11.0, 11.0, true);
                pen.page()
            })
            .collect();
        let (pieces, styles) = shape(pages);
        for page in &pieces {
            let kinds: Vec<&str> = page
                .iter()
                .map(|p| match p {
                    Piece::Heading { .. } => "heading",
                    Piece::Paragraph { .. } => "paragraph",
                    Piece::KeptLines { lines, side: None, .. } if lines.len() == 4 => "kept",
                    Piece::KeptLines { .. } => "kept otherwise",
                })
                .collect();
            assert_eq!(kinds, ["paragraph", "kept", "kept", "paragraph"]);
        }
        // Four blocks of lines kept, standing further in: a style found, by its look.
        assert_eq!(styles.len(), 2, "{styles:#?}");
        assert!(styles[1].kept && styles[1].indent);
        assert_eq!((styles[1].count, styles[1].pages), (4, 2));
        assert_eq!(styles[1].sample, VERSE[..4].join("\n"));
        assert!(matches!(pieces[0][1], Piece::KeptLines { style: 1, .. }));
    }

    #[test]
    fn verse_of_one_length_is_kept_against_the_width_of_the_notes_below() {
        // Lines of one length, no numbers, and below them notes across the whole width.
        let verse = [
            "The rain came down upon the inn,",
            "and all the road was turned to mud;",
            "the horses stumbled in the yard",
            "and blew, and would not be consoled,",
            "until the boy who kept them came",
            "and spoke to each of them by name,",
            "as if they knew the words he said,",
            "and they were quiet, one by one.",
        ];
        let pages: Vec<PageLines> = (0..2)
            .map(|_| {
                let mut pen = Pen::new();
                pen.lines(&verse, LEFT, 11.0).lines(&verse, LEFT, 11.0).space(20.0);
                pen.text(NOVEL[5], 9.0, 0.0, true);
                pen.page()
            })
            .collect();
        let (pieces, styles) = shape(pages);
        assert_eq!(styles[0].style.size, 11.0);
        for page in &pieces {
            assert!(matches!(&page[0], Piece::KeptLines { lines, .. } if lines.len() == 16), "{page:#?}");
            assert!(matches!(&page[1], Piece::Paragraph { .. }));
        }
    }

    #[test]
    fn a_paragraph_indented_and_one_not() {
        let mut pen = Pen::new();
        pen.text(NOVEL[0], 11.0, 0.0, true).space(13.2).text(NOVEL[5], 11.0, 11.0, true);
        let (pieces, _) = shape(vec![pen.page()]);
        let indents: Vec<bool> = pieces[0]
            .iter()
            .map(|p| match p {
                Piece::Paragraph { indent, .. } => *indent,
                _ => panic!("{p:#?}"),
            })
            .collect();
        assert_eq!(indents, [false, true]);
    }

    #[test]
    fn a_smaller_style_that_recurs_is_found_with_its_count() {
        let notes = [
            "1 The inn stood on the old road to the north, which was given up when the railway came.",
            "2 Such stairs were common in the houses of the valley; few of them stand now.",
            "3 The custom of calling up the stair is told of in several of the letters.",
        ];
        let pages: Vec<PageLines> = notes
            .iter()
            .enumerate()
            .map(|(p, note)| {
                let mut pen = Pen::new();
                for k in 0..6 {
                    pen.text(NOVEL[(k + p) % NOVEL.len()], 11.0, 11.0, true);
                }
                pen.space(20.0).text(note, 9.0, 0.0, true);
                pen.page()
            })
            .collect();
        let (pieces, styles) = shape(pages);
        assert_eq!(styles.len(), 2, "{styles:#?}");
        let found = &styles[1];
        assert_eq!(found.style.size, 9.0);
        assert_eq!((found.count, found.pages), (3, 3));
        assert!(!found.kept && !found.indent);
        assert!(found.sample.starts_with("1 The inn stood"));
        for page in &pieces {
            assert!(matches!(page.last(), Some(Piece::Paragraph { style: 1, .. })));
            assert!(page[..page.len() - 1].iter().all(|p| matches!(p, Piece::Paragraph { style: 0, .. })));
        }
    }

    #[test]
    fn a_style_seen_once_is_the_body() {
        let mut pen = Pen::new();
        pen.text(NOVEL[0], 11.0, 11.0, true).space(20.0).text(NOVEL[2], 9.0, 0.0, true);
        let (pieces, styles) = shape(vec![pen.page()]);
        assert_eq!(styles.len(), 1);
        assert!(pieces[0].iter().all(|p| matches!(p, Piece::Paragraph { style: 0, .. })));
    }

    #[test]
    fn two_columns_are_read_left_before_right() {
        let mut left = Pen::new();
        left.measure = 213.0;
        left.top = 160.0;
        left.text(NOVEL[0], 11.0, 11.0, true).text(NOVEL[3], 11.0, 11.0, true);
        let mut right = Pen::new();
        right.left = 310.0;
        right.measure = 213.0;
        right.top = 160.0;
        right.text(NOVEL[5], 11.0, 11.0, true);
        // Drawn row by row, as some files draw them.
        let mut lines = vec![at("THE NEWS OF THE VALLEY", 180.0, 120.0, 18.0)];
        let (mut l, mut r) = (left.lines.into_iter(), right.lines.into_iter());
        loop {
            let (a, b) = (l.next(), r.next());
            if a.is_none() && b.is_none() {
                break;
            }
            lines.extend(a);
            lines.extend(b);
        }
        let (pieces, _) = shape(vec![page(lines)]);
        let page = &pieces[0];
        assert!(matches!(&page[0], Piece::Heading { level: 0, .. }), "{:#?}", page[0]);
        let paragraphs: Vec<String> = page[1..]
            .iter()
            .map(|p| match p {
                Piece::Paragraph { lines, .. } => texts(lines),
                _ => panic!("{p:#?}"),
            })
            .collect();
        assert_eq!(paragraphs.len(), 3);
        assert!(paragraphs[0].starts_with("The rain"));
        assert!(paragraphs[1].starts_with("She followed"));
        assert!(paragraphs[2].starts_with("The room was small"));
    }

    #[test]
    fn sizes_close_together_are_one() {
        let lines: Vec<Line> =
            [44.0, 45.0, 46.0, 47.0, 44.0, 9.0, 11.0, 10.5].iter().map(|&s| at("word", 0.0, 0.0, s)).collect();
        let sizes = Sizes::of(lines.iter());
        assert_eq!(sizes.classes.len(), 4);
        assert_eq!(sizes.class(45.5, true), sizes.class(44.0, true));
        assert_ne!(sizes.class(10.5, true), sizes.class(11.0, true));
        assert_eq!(sizes.measured(sizes.class(46.0, true)), 45.0);
        // Heights alone, at a low resolution: 17 to 21 dots are one size, 26 another.
        let heights: Vec<Line> = [17.0, 18.0, 19.0, 20.0, 21.0, 26.0]
            .iter()
            .map(|&s| Line { style: Style { size: s, ..Default::default() }, ..at("word", 0.0, 0.0, s) })
            .collect();
        let sizes = Sizes::of(heights.iter());
        assert_eq!(sizes.classes.len(), 2);
        assert_eq!(sizes.class(17.0, false), sizes.class(21.0, false));
    }

    #[test]
    fn running_heads_read_with_a_letter_otherwise() {
        assert!(similar(&normalized("ARISTOPHANES 23"), &normalized("ARlSTOPHANES 25")));
        assert!(!similar(&normalized("CHAPTER ONE"), &normalized("THE INN")));
        assert_eq!(normalized("12  The Widow, at the Inn"), "#thewidowattheinn");
    }

    #[test]
    fn nothing_from_nothing() {
        let (pieces, styles) = shape(Vec::new());
        assert!(pieces.is_empty());
        assert_eq!(styles.len(), 1);
        let (pieces, _) = shape(vec![page(Vec::new())]);
        assert_eq!(pieces, [Vec::new()]);
    }

    /// The edges of a book of many pages, with two running heads that alternate and are
    /// alike enough in length to be measured against each other, a chapter's title at the
    /// head of some pages, and a number at every foot.
    #[test]
    #[ignore = "a measure, to be run in release: cargo test --release -p glaukopis-core -- --ignored many_pages_edged"]
    fn many_pages_edged() {
        for count in [600, 2_000] {
            let mut pages: Vec<PageLines> = (0..count)
                .map(|p| {
                    let head = if p % 2 == 0 { "STUDIES IN THE HOMERIC POEMS" } else { "THE WRATH OF ACHILLES AGAIN" };
                    let mut lines = vec![at(head, LEFT, 40.0, 9.0)];
                    if p % 20 == 0 {
                        lines.push(at(&format!("Chapter {} of the poems", p / 20), LEFT, 70.0, 9.0));
                    }
                    lines.push(at("A line of the body of the page, as any other.", LEFT, 400.0, 11.0));
                    lines.push(at(&format!("{}", p + 1), 290.0, 800.0, 9.0));
                    page(lines)
                })
                .collect();
            let began = std::time::Instant::now();
            edges(&mut pages);
            eprintln!("{count} pages edged in {:?}", began.elapsed());
            assert!(
                pages.iter().all(|p| p.lines.iter().all(|l| !l.text.contains("HOMERIC") && !l.text.contains("WRATH")))
            );
            assert!(pages.iter().all(|p| p.lines.iter().any(|l| l.text.starts_with("A line"))));
        }
    }
}
