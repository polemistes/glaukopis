//! The text a PDF has already, page by page, with where its lines stand:
//! read with pdf-extract, as the library reads PDFs (`import/pdf.rs`).
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

use pdf_extract::{Document, MediaBox, Object, OutputDev, OutputError, Transform};

use super::text::Line;
use crate::tr;

/// A page has text when it has at least this many letters and digits.
pub const TEXT_PAGE: usize = 100;

/// A page whose content is larger than this, as it is stored, is a drawing,
/// and reading it for the sake of its text takes long.
const LARGEST_PAGE: usize = 4 << 20;

/// What was read of the text of a PDF.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct Layer {
    /// The pages, each with the lines of its text; nothing where the page
    /// could not be read, or the time was up before it was.
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
}

impl Layer {
    /// Whether a page has text enough not to be read by Tesseract.
    pub fn has_text(&self, index: usize) -> bool {
        self.laid.get(index).copied().unwrap_or(false)
            || self.pages.get(index).and_then(Option::as_ref).is_some_and(|lines| {
                lines.iter().map(|l| l.text.chars().filter(|c| c.is_alphanumeric()).count()).sum::<usize>() >= TEXT_PAGE
            })
    }

    /// The label of a page, counted from nought.
    pub fn label(&self, index: usize) -> String {
        self.labels.get(index).cloned().unwrap_or_else(|| (index + 1).to_string())
    }
}

/// Gathers the characters of a page into lines, with where each stands.
///
/// The library hands over the characters one by one with the place of
/// each, in the space of the page (from its bottom left, upwards). A new
/// line begins wherever the writing moves off the line by half its height;
/// a space is put wherever it moves on by more than a tenth of it, at the
/// beginning of a run of characters. As `import/pdf.rs` does it.
#[derive(Default)]
struct Gatherer {
    lines: Vec<Line>,
    /// The top of the page, from which lines are measured down.
    top: f64,
    /// Where the last character ended.
    end: (f64, f64),
    /// The height of the last character.
    size: f64,
    /// Whether a run of characters begins: only there are spaces and lines told.
    begins: bool,
}

type Told = std::result::Result<(), OutputError>;

impl Gatherer {
    fn line_for(&mut self, x: f64, baseline: f64, size: f64) -> &mut Line {
        let top = (self.top - baseline - size) as f32;
        let bottom = (self.top - baseline) as f32;
        self.lines.push(Line { text: String::new(), left: x as f32, right: x as f32, top, bottom });
        self.lines.last_mut().expect("a line was pushed")
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
        let stretch = trm.m11.hypot(trm.m12);
        let size = (font_size * trm.m21.hypot(trm.m22)).abs();
        let direction = if stretch > 0.0 { (trm.m11 / stretch, trm.m12 / stretch) } else { (1.0, 0.0) };
        let (x, y) = (trm.m31, trm.m32);
        let mut new_line = self.lines.is_empty();
        let mut space = false;
        if self.begins && !new_line {
            let (dx, dy) = (x - self.end.0, y - self.end.1);
            let along = dx * direction.0 + dy * direction.1;
            let across = (dy * direction.0 - dx * direction.1).abs();
            // Superscripts are smaller than the line they belong to.
            let height = size.max(self.size);
            if across > height * 0.5 {
                new_line = true;
            } else if along > size * 0.1 || along < -height {
                space = true;
            }
        }
        let advance = width * font_size.abs() * stretch;
        let (right, bottom) = ((x + direction.0 * advance) as f32, (self.top - y) as f32);
        let line = if new_line { self.line_for(x, y, size) } else { self.lines.last_mut().expect("there is a line") };
        if space && !line.text.ends_with(' ') {
            line.text.push(' ');
        }
        line.text.push_str(char);
        line.left = line.left.min(x as f32);
        line.right = line.right.max(right);
        line.top = line.top.min(bottom - size as f32);
        line.bottom = line.bottom.max(bottom);
        self.begins = false;
        self.end = (x + direction.0 * advance, y + direction.1 * advance);
        self.size = size;
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

/// The lines of a page, as far as they can be read. The library panics on
/// fonts and encodings it does not know; what it had read by then is kept.
fn page_lines(doc: &Document, number: u32) -> Option<Vec<Line>> {
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
    match catch_unwind(AssertUnwindSafe(|| pdf_extract::output_doc_page(doc, &mut gatherer, number))) {
        Ok(Ok(())) => {}
        Ok(Err(e)) => tracing::debug!(%e, number, "a page of the PDF could not be read to its end"),
        Err(_) => tracing::debug!(number, "a page of the PDF could not be read to its end"),
    }
    for line in &mut gatherer.lines {
        line.text = line.text.trim().to_owned();
    }
    gatherer.lines.retain(|l| !l.text.is_empty());
    Some(gatherer.lines)
}

// ---------------------------------------------------------------------------
// The numbers of the pages in print
// ---------------------------------------------------------------------------

/// A number in Roman numerals.
fn roman(mut n: usize) -> String {
    const NUMERALS: [(usize, &str); 13] = [
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
            Some(b'R') => roman(n).to_uppercase(),
            Some(b'r') => roman(n),
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
            .and_then(|p| pdf_extract::decode_text_string(p).ok())
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
    for number in 1..=count {
        let lines = page_lines(&doc, number as u32);
        keep(layer, |l| l.pages[number - 1] = lines);
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
    fn numbers_in_print() {
        assert_eq!(roman(1994), "mcmxciv");
        assert_eq!(roman(14), "xiv");
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
