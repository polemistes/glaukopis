//! A PDF made searchable, as OCRmyPDF makes it.
//!
//! For each page that was read, Tesseract makes a page of text alone: each
//! word unseen in its place, over nothing (`textonly_pdf`). That page is
//! laid over the page of the PDF as it was, as a form XObject, turned and
//! moved as the page is shown: its crop box, and how it is to be turned.
//! Nothing that is seen changes.
//!
//! The rest of the file is left as it is, to the byte: what is changed (the
//! pages that are given text) and what is added (the text, and the font it
//! is set in, once) is written after it, as an update of the file, which
//! every program that reads PDF knows how to read. Where the update does not
//! read back as whole, the file is written anew with the same changes.

use std::collections::HashMap;
use std::io::Write;

use lopdf::{Dictionary, Document, IncrementalDocument, Object, ObjectId, Stream, dictionary};

use crate::error::{Error, Result};
use crate::tr;

/// The name the text is given among the XObjects of a page; a number is
/// added where a page has one of that name already.
const NAME: &str = "GlaukopisText";

/// A page of text, as Tesseract made it, to be laid over a page, counted from nought.
#[derive(Debug, Clone)]
pub struct Layer {
    pub page: usize,
    pub pdf: Vec<u8>,
}

fn unreadable(e: impl std::fmt::Display) -> Error {
    Error::invalid(tr!("ocr-searchable-unreadable", message = e.to_string()))
}

/// Opens a PDF to be made searchable: one that is locked cannot be, since
/// what is added would have to be locked in the same way.
pub fn open(bytes: &[u8]) -> Result<Document> {
    let doc = std::panic::catch_unwind(|| Document::load_mem(bytes))
        .map_err(|_| unreadable("the file could not be taken apart"))?
        .map_err(unreadable)?;
    if doc.is_encrypted() || doc.was_encrypted() {
        return Err(Error::Refused { kind: "locked", message: tr!("ocr-searchable-locked") });
    }
    Ok(doc)
}

// ---------------------------------------------------------------------------
// Where a page is, and how it is turned
// ---------------------------------------------------------------------------

/// A value of a page, or of the pages above it, from which it inherits
/// what it does not say itself: its boxes, how it is turned, its resources.
fn inherited<'a>(doc: &'a Document, page: &'a Dictionary, key: &[u8]) -> Option<&'a Object> {
    let mut node = page;
    for _ in 0..64 {
        if let Ok(value) = node.get(key) {
            return doc.dereference(value).ok().map(|(_, o)| o);
        }
        let parent = node.get(b"Parent").and_then(Object::as_reference).ok()?;
        node = doc.get_dictionary(parent).ok()?;
    }
    None
}

/// A rectangle as a PDF writes it, with its corners put in order: left,
/// bottom, right, top.
fn rectangle(doc: &Document, object: &Object) -> Option<[f32; 4]> {
    let numbers: Vec<f32> = object
        .as_array()
        .ok()?
        .iter()
        .filter_map(|n| doc.dereference(n).ok().and_then(|(_, n)| n.as_float().ok()))
        .collect();
    let [a, b, c, d] = numbers[..] else { return None };
    Some([a.min(c), b.min(d), a.max(c), b.max(d)])
}

/// What of a page is shown, as hayro and Poppler draw it: the crop box
/// within the media box, in the space of the page.
fn shown(doc: &Document, page: &Dictionary) -> [f32; 4] {
    let media =
        inherited(doc, page, b"MediaBox").and_then(|m| rectangle(doc, m)).unwrap_or([0.0, 0.0, 595.276, 841.89]);
    let crop = inherited(doc, page, b"CropBox").and_then(|c| rectangle(doc, c)).unwrap_or(media);
    let meet = [crop[0].max(media[0]), crop[1].max(media[1]), crop[2].min(media[2]), crop[3].min(media[3])];
    if meet[2] - meet[0] < 1.0 || meet[3] - meet[1] < 1.0 { media } else { meet }
}

/// How far a page is turned when it is shown, clockwise, in quarters.
fn quarters(doc: &Document, page: &Dictionary) -> i64 {
    let degrees = inherited(doc, page, b"Rotate").and_then(|r| r.as_float().ok()).unwrap_or(0.0);
    let degrees = (degrees.round() as i64).rem_euclid(360);
    if degrees % 90 == 0 { degrees / 90 } else { 0 }
}

/// What takes a page of text as large as `text` (its width and height) to
/// where the page it was read from stands: the part of the page that is
/// shown, turned as it is shown. As the matrix of `cm`.
pub fn placing(text: (f32, f32), shown: [f32; 4], quarters: i64) -> [f32; 6] {
    let [x0, y0, x1, y1] = shown;
    let (width, height) = if quarters % 2 == 0 { (x1 - x0, y1 - y0) } else { (y1 - y0, x1 - x0) };
    let sx = width / text.0.max(1.0);
    let sy = height / text.1.max(1.0);
    match quarters {
        1 => [0.0, sx, -sy, 0.0, x1, y0],
        2 => [-sx, 0.0, 0.0, -sy, x1, y1],
        3 => [0.0, -sx, sy, 0.0, x0, y1],
        _ => [sx, 0.0, 0.0, sy, x0, y0],
    }
}

// ---------------------------------------------------------------------------
// Objects taken from one document into another
// ---------------------------------------------------------------------------

/// Writes an object in a form that is the same for objects that are the
/// same, by which what was taken in before is known again.
fn key_of(object: &Object, out: &mut Vec<u8>) {
    match object {
        Object::Null => out.push(b'n'),
        Object::Boolean(b) => out.extend_from_slice(if *b { b"t" } else { b"f" }),
        Object::Integer(i) => {
            let _ = write!(out, "i{i};");
        }
        Object::Real(r) => {
            let _ = write!(out, "r{r};");
        }
        Object::Name(name) => {
            let _ = write!(out, "/{};", name.len());
            out.extend_from_slice(name);
        }
        Object::String(text, _) => {
            let _ = write!(out, "({};", text.len());
            out.extend_from_slice(text);
        }
        Object::Array(items) => {
            out.push(b'[');
            items.iter().for_each(|i| key_of(i, out));
            out.push(b']');
        }
        Object::Dictionary(dict) => dictionary_key(dict, out),
        Object::Stream(stream) => {
            dictionary_key(&stream.dict, out);
            let _ = write!(out, "s{};", stream.content.len());
            out.extend_from_slice(&stream.content);
        }
        Object::Reference((id, generation)) => {
            let _ = write!(out, "R{id}.{generation};");
        }
    }
}

fn dictionary_key(dict: &Dictionary, out: &mut Vec<u8>) {
    let mut entries: Vec<(&Vec<u8>, &Object)> = dict.iter().collect();
    entries.sort_by(|a, b| a.0.cmp(b.0));
    out.push(b'<');
    for (name, value) in entries {
        let _ = write!(out, "{};", name.len());
        out.extend_from_slice(name);
        key_of(value, out);
    }
    out.push(b'>');
}

/// Takes objects from the pages of text into the document. An object that
/// was taken in before, as the font of the text is for every page, is not
/// taken in again.
struct Taking {
    /// What each object of the page of text became, while that page is taken in.
    became: HashMap<ObjectId, ObjectId>,
    /// The objects taken in, by what they are.
    known: HashMap<Vec<u8>, ObjectId>,
}

impl Taking {
    fn object(&mut self, from: &Document, object: &Object, into: &mut Document, depth: usize) -> Object {
        if depth > 32 {
            return Object::Null;
        }
        match object {
            Object::Reference(id) => {
                if let Some(taken) = self.became.get(id) {
                    return Object::Reference(*taken);
                }
                let Ok(found) = from.get_object(*id) else { return Object::Null };
                // Kept for now in case the object points back to itself.
                let place = into.new_object_id();
                self.became.insert(*id, place);
                let taken = self.object(from, found, into, depth + 1);
                let mut key = Vec::new();
                key_of(&taken, &mut key);
                match self.known.get(&key) {
                    Some(known) => {
                        self.became.insert(*id, *known);
                        Object::Reference(*known)
                    }
                    None => {
                        into.objects.insert(place, taken);
                        self.known.insert(key, place);
                        Object::Reference(place)
                    }
                }
            }
            Object::Array(items) => {
                Object::Array(items.iter().map(|i| self.object(from, i, into, depth + 1)).collect())
            }
            Object::Dictionary(dict) => Object::Dictionary(self.dictionary(from, dict, into, depth)),
            Object::Stream(stream) => {
                let mut taken = stream.clone();
                taken.dict = self.dictionary(from, &stream.dict, into, depth);
                Object::Stream(taken)
            }
            other => other.clone(),
        }
    }

    fn dictionary(&mut self, from: &Document, dict: &Dictionary, into: &mut Document, depth: usize) -> Dictionary {
        dict.iter().map(|(name, value)| (name.clone(), self.object(from, value, into, depth + 1))).collect()
    }
}

// ---------------------------------------------------------------------------
// The text laid over the pages
// ---------------------------------------------------------------------------

/// What a page of text of Tesseract holds: its size, what it draws, and
/// what that needs.
struct Text {
    size: (f32, f32),
    content: Vec<u8>,
    resources: Dictionary,
    doc: Document,
}

fn text_page(pdf: &[u8]) -> Result<Text> {
    let doc = Document::load_mem(pdf).map_err(unreadable)?;
    let page = *doc.get_pages().get(&1).ok_or_else(|| unreadable("the text has no page"))?;
    let dict = doc.get_dictionary(page).map_err(unreadable)?;
    let [x0, y0, x1, y1] = inherited(&doc, dict, b"MediaBox")
        .and_then(|m| rectangle(&doc, m))
        .ok_or_else(|| unreadable("the text has no size"))?;
    let resources = inherited(&doc, dict, b"Resources").and_then(|r| r.as_dict().ok()).cloned().unwrap_or_default();
    let content = doc.get_page_content(page).map_err(unreadable)?;
    // Text alone begins at nought: Tesseract makes it so.
    let content = if x0 != 0.0 || y0 != 0.0 {
        let mut moved = format!("1 0 0 1 {} {} cm\n", -x0, -y0).into_bytes();
        moved.extend_from_slice(&content);
        moved
    } else {
        content
    };
    Ok(Text { size: (x1 - x0, y1 - y0), content, resources, doc })
}

/// The contents of a page as a list of streams.
fn contents_of(doc: &Document, page: &Dictionary) -> Vec<Object> {
    let Ok(contents) = page.get(b"Contents") else { return Vec::new() };
    match contents {
        Object::Array(items) => items.clone(),
        Object::Reference(id) => match doc.get_object(*id) {
            Ok(Object::Array(items)) => items.clone(),
            _ => vec![contents.clone()],
        },
        _ => Vec::new(),
    }
}

/// The resources of a page as a dictionary of its own, with its XObjects as
/// one of their own: a page that shares them with others, or inherits them,
/// is given a copy, so that what is added to them is added to it alone.
fn own_resources(doc: &Document, page: &Dictionary) -> Dictionary {
    let mut resources = inherited(doc, page, b"Resources").and_then(|r| r.as_dict().ok()).cloned().unwrap_or_default();
    let xobjects = resources
        .get(b"XObject")
        .ok()
        .and_then(|x| doc.dereference(x).ok())
        .and_then(|(_, x)| x.as_dict().ok())
        .cloned()
        .unwrap_or_default();
    resources.set("XObject", Object::Dictionary(xobjects));
    resources
}

/// A name for the text among the XObjects of a page that is not taken.
fn free_name(xobjects: &Dictionary) -> String {
    (0..)
        .map(|n| if n == 0 { NAME.to_owned() } else { format!("{NAME}{n}") })
        .find(|name| !xobjects.has(name.as_bytes()))
        .expect("some name is free")
}

fn number(n: f32) -> String {
    let rounded = (n * 10_000.0).round() / 10_000.0;
    if rounded == rounded.trunc() { format!("{}", rounded as i64) } else { format!("{rounded}") }
}

/// What belonged to the cross-reference stream of a file, which is not that
/// of an update of it, nor of the file written anew.
const OF_THE_STREAM: [&[u8]; 8] = [b"DecodeParms", b"Filter", b"XRefStm", b"Type", b"W", b"Index", b"Length", b"Prev"];

/// Lays the pages of text over the pages of `doc`, which was read from
/// `bytes`, and gives the file that has them.
pub fn lay_over(bytes: Vec<u8>, doc: Document, layers: &[Layer]) -> Result<Vec<u8>> {
    let pages = doc.get_pages();
    let count = pages.len();
    let largest = doc.trailer.get(b"Size").and_then(Object::as_i64).unwrap_or(0).max(1) as u32 - 1;
    let mut new = Document::new_from_prev(&doc);
    new.max_id = new.max_id.max(largest);
    for key in OF_THE_STREAM.into_iter().filter(|k| *k != b"Prev") {
        new.trailer.remove(key);
    }

    // Everything drawn before is kept apart from the text, whatever it leaves the state of drawing in.
    let begin = new.add_object(Stream::new(Dictionary::new(), b"q\n".to_vec()));
    let mut taking = Taking { became: HashMap::new(), known: HashMap::new() };
    for layer in layers {
        let Some(&page_id) = pages.get(&(layer.page as u32 + 1)) else { continue };
        let text = text_page(&layer.pdf)?;
        taking.became.clear();
        let resources = taking.dictionary(&text.doc, &text.resources, &mut new, 0);
        let mut form = Stream::new(
            dictionary! {
                "Type" => "XObject",
                "Subtype" => "Form",
                "BBox" => vec![0.into(), 0.into(), text.size.0.into(), text.size.1.into()],
                "Resources" => resources,
            },
            text.content,
        );
        form.compress().map_err(unreadable)?;
        let form = new.add_object(form);

        let page = doc.get_dictionary(page_id).map_err(unreadable)?;
        let place = placing(text.size, shown(&doc, page), quarters(&doc, page));
        let mut resources = own_resources(&doc, page);
        let xobjects = resources.get_mut(b"XObject").and_then(Object::as_dict_mut).map_err(unreadable)?;
        let name = free_name(xobjects);
        xobjects.set(name.as_bytes(), Object::Reference(form));
        let matrix = place.iter().map(|n| number(*n)).collect::<Vec<_>>().join(" ");
        let end = format!("\nQ\nq {matrix} cm /{name} Do Q\n");
        let end = new.add_object(Stream::new(Dictionary::new(), end.into_bytes()));

        let mut contents = vec![Object::Reference(begin)];
        contents.extend(contents_of(&doc, page));
        contents.push(Object::Reference(end));
        let mut changed = page.clone();
        changed.set("Resources", Object::Dictionary(resources));
        changed.set("Contents", Object::Array(contents));
        new.objects.insert(page_id, Object::Dictionary(changed));
    }

    let size = bytes.len() + layers.len() * 4096;
    let mut update = IncrementalDocument::create_from(bytes, doc);
    update.new_document = new;
    let mut out = Vec::with_capacity(size);
    update.save_to(&mut out).map_err(unreadable)?;
    if holds(&out, count, layers) {
        return Ok(out);
    }
    // Written anew, with the same changes, where the update does not read back as whole.
    tracing::warn!("the update of the PDF did not read back as whole; the file is written anew");
    drop(out);
    let mut whole = update.get_prev_documents().clone();
    let new = &update.new_document;
    whole.max_id = whole.max_id.max(new.max_id);
    for (id, object) in &new.objects {
        whole.objects.insert(*id, object.clone());
    }
    for key in OF_THE_STREAM {
        whole.trailer.remove(key);
    }
    let mut out = Vec::with_capacity(size);
    whole.save_to(&mut out).map_err(unreadable)?;
    if holds(&out, count, layers) { Ok(out) } else { Err(unreadable("it does not hold its pages")) }
}

/// Whether a file made searchable reads back as whole: with as many pages
/// as the one it was made of, each page that was given text having it.
pub fn holds(bytes: &[u8], pages: usize, layers: &[Layer]) -> bool {
    let Ok(Ok(doc)) = std::panic::catch_unwind(|| Document::load_mem(bytes)) else { return false };
    let read = doc.get_pages();
    read.len() == pages
        && layers.iter().all(|layer| {
            read.get(&(layer.page as u32 + 1)).and_then(|id| doc.get_dictionary(*id).ok()).is_some_and(|page| {
                inherited(&doc, page, b"Resources")
                    .and_then(|r| r.as_dict().ok())
                    .and_then(|r| r.get(b"XObject").ok())
                    .and_then(|x| doc.dereference(x).ok())
                    .and_then(|(_, x)| x.as_dict().ok())
                    .is_some_and(|x| x.iter().any(|(name, _)| name.starts_with(NAME.as_bytes())))
            })
        })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn apply(m: [f32; 6], (u, v): (f32, f32)) -> (f32, f32) {
        (m[0] * u + m[2] * v + m[4], m[1] * u + m[3] * v + m[5])
    }

    fn near(a: (f32, f32), b: (f32, f32)) -> bool {
        (a.0 - b.0).abs() < 0.01 && (a.1 - b.1).abs() < 0.01
    }

    #[test]
    fn the_text_is_placed_where_the_page_is_shown() {
        // A page shown from 10,20 to 110,220: the text is half as large.
        let shown = [10.0, 20.0, 110.0, 220.0];
        let m = placing((50.0, 100.0), shown, 0);
        assert!(near(apply(m, (0.0, 0.0)), (10.0, 20.0)));
        assert!(near(apply(m, (50.0, 100.0)), (110.0, 220.0)));

        // Turned a quarter clockwise, it is shown 200 wide and 100 high. The
        // corner of the text at its bottom left is shown at the bottom left,
        // which is the corner of the page at its bottom right.
        let m = placing((200.0, 100.0), shown, 1);
        assert!(near(apply(m, (0.0, 0.0)), (110.0, 20.0)), "{:?}", apply(m, (0.0, 0.0)));
        // The top left of what is shown is the bottom left of the page.
        assert!(near(apply(m, (0.0, 100.0)), (10.0, 20.0)));
        assert!(near(apply(m, (200.0, 100.0)), (10.0, 220.0)));

        let m = placing((100.0, 200.0), shown, 2);
        assert!(near(apply(m, (0.0, 0.0)), (110.0, 220.0)));
        assert!(near(apply(m, (100.0, 200.0)), (10.0, 20.0)));

        let m = placing((200.0, 100.0), shown, 3);
        assert!(near(apply(m, (0.0, 0.0)), (10.0, 220.0)));
        assert!(near(apply(m, (200.0, 0.0)), (10.0, 20.0)));
        assert!(near(apply(m, (0.0, 100.0)), (110.0, 220.0)));
    }

    #[test]
    fn numbers_as_they_are_written() {
        assert_eq!(number(2.0), "2");
        assert_eq!(number(-0.5), "-0.5");
        assert_eq!(number(0.333_333_3), "0.3333");
    }

    #[test]
    fn the_same_object_is_known_again() {
        let mut a = Vec::new();
        let mut b = Vec::new();
        key_of(&Object::Dictionary(dictionary! { "A" => 1, "B" => "x" }), &mut a);
        key_of(&Object::Dictionary(dictionary! { "B" => "x", "A" => 1 }), &mut b);
        assert_eq!(a, b);
        let mut c = Vec::new();
        key_of(&Object::Dictionary(dictionary! { "A" => 2, "B" => "x" }), &mut c);
        assert_ne!(a, c);
    }
}
