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
//!
//! Where the text a page has is poor, as an old OCR's may be, it can be
//! taken away as the new is laid over ([`lay_over`] with `strip`): the
//! page's content is written anew without the text that is unseen, as
//! scanners and OCR programs lay it, and without a text laid over it here
//! before; what is seen stays, letters among it.

use std::collections::HashMap;
use std::io::Write;

use lopdf::content::{Content, Operation};
use lopdf::{Dictionary, Document, IncrementalDocument, Object, ObjectId, Stream, dictionary};

use super::layer;
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
    let content = long_s_as_s(doc.get_page_content(page).map_err(unreadable)?);
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

/// Tesseract's page of text with every long s (ſ) written as s: the long s
/// is a form of s that Gothic type prints, and a reader searching the PDF
/// for *samme* must find what was printed *ſamme*. Tesseract writes each word
/// as a string of two-byte codes that are the letters' own (its font is
/// `Identity-H`, and each glyph as wide as the next), so the code of ſ,
/// `017F`, is made that of s, `0073`, and nothing moves on the page.
fn long_s_as_s(content: Vec<u8>) -> Vec<u8> {
    let Ok(mut decoded) = Content::decode(&content) else { return content };
    let mut changed = false;
    let mut mend = |object: &mut Object| {
        if let Object::String(bytes, _) = object {
            for pair in bytes.chunks_exact_mut(2) {
                if pair == [0x01, 0x7F] {
                    pair.copy_from_slice(&[0x00, 0x73]);
                    changed = true;
                }
            }
        }
    };
    for op in &mut decoded.operations {
        if matches!(op.operator.as_str(), "Tj" | "TJ" | "'" | "\"") {
            for operand in &mut op.operands {
                match operand {
                    Object::Array(items) => items.iter_mut().for_each(&mut mend),
                    other => mend(other),
                }
            }
        }
    }
    if !changed {
        return content;
    }
    decoded.encode().unwrap_or(content)
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

// ---------------------------------------------------------------------------
// The text a page has, taken away
// ---------------------------------------------------------------------------

/// The operators that show text.
const SHOWING: [&str; 4] = ["Tj", "TJ", "'", "\""];

/// Whether text shown in a render mode (`Tr`) is unseen: neither filled nor
/// stroked, whether it clips (7) or not (3).
fn unseen(render_mode: i64) -> bool {
    matches!(render_mode, 3 | 7)
}

/// The content of a page decoded, its streams one after another. Nothing
/// where a stream is packed in a way that cannot be unpacked here, or where
/// they unpack to more than a page of text may be when it is read for its
/// text ([`layer::LARGEST_UNPACKED`]): this is done in the application's
/// own process, and a stream that packs small and unpacks without end would
/// take its memory. What could not be read whole is not written anew.
fn decoded_contents(doc: &Document, page: &Dictionary) -> Option<Vec<u8>> {
    let mut out = Vec::new();
    for object in contents_of(doc, page) {
        let stream = match &object {
            Object::Reference(id) => doc.get_object(*id).ok()?,
            other => other,
        };
        let Ok(stream) = stream.as_stream() else { continue };
        let left = layer::LARGEST_UNPACKED.saturating_sub(out.len() as u64);
        out.extend(layer::unpacked_within(stream, left)?);
        out.push(b'\n');
    }
    Some(out)
}

/// The operator a picture within the content stands in for while the rest
/// is read, numbered in letters, since the library reads only letters in an
/// operator's name: the picture is put back where it stood, to the byte.
const INLINE: &str = "GlaukopisInline";

/// A number in letters, `a` for nought: `a`, `b`, … `z`, `ba`, ….
fn in_letters(mut n: usize) -> String {
    let mut out = Vec::new();
    loop {
        out.push(b'a' + (n % 26) as u8);
        n /= 26;
        if n == 0 {
            break;
        }
    }
    out.reverse();
    String::from_utf8(out).expect("letters")
}

fn from_letters(s: &str) -> Option<usize> {
    if s.is_empty() {
        return None;
    }
    s.bytes().try_fold(0usize, |n, b| b.is_ascii_lowercase().then(|| n * 26 + usize::from(b - b'a')))
}

/// Whether a byte ends a token of a content stream.
fn delimiter(b: u8) -> bool {
    b.is_ascii_whitespace() || b"()<>[]{}/%".contains(&b)
}

/// Whether a byte may stand just before an operator: white space, or what
/// ends the operand before it. Never `/`, after which `BI` or `ID` is a
/// name, as of a state of drawing (`/BI gs`) or a tag (`/BI BMC`).
fn before_operator(b: u8) -> bool {
    b.is_ascii_whitespace() || b")>]}".contains(&b)
}

/// Where a string that begins at `start`, with `(`, ends: after its closing
/// bracket, its brackets nested and its escapes gone past; or the end.
fn past_string(raw: &[u8], start: usize) -> usize {
    let mut i = start;
    let mut depth = 0usize;
    while i < raw.len() {
        match raw[i] {
            b'\\' => i += 1,
            b'(' => depth += 1,
            b')' => {
                depth -= 1;
                if depth == 0 {
                    break;
                }
            }
            _ => {}
        }
        i += 1;
    }
    (i + 1).min(raw.len())
}

/// Takes the pictures within the content (`BI … ID … EI`) out of it, each
/// as it was written, and puts in their place an operator that stands for
/// it. The library that reads contents reads such a picture only where it
/// can tell its length from what it says of itself, and loses the page
/// where it cannot, as with one packed in hexadecimal; taken out first, a
/// picture is never read, only kept. Strings and comments are gone past, so
/// that a `BI` in a line of text is not taken for one. Nothing where a
/// picture has no end.
fn take_inline_images(raw: &[u8]) -> Option<(Vec<u8>, Vec<Vec<u8>>)> {
    let mut out = Vec::with_capacity(raw.len());
    let mut images = Vec::new();
    let mut i = 0;
    while i < raw.len() {
        match raw[i] {
            // A string, with its brackets nested and its escapes: passed whole.
            b'(' => {
                let start = i;
                i = past_string(raw, i);
                out.extend_from_slice(&raw[start..i]);
            }
            // A comment, to the end of its line.
            b'%' => {
                let start = i;
                while i < raw.len() && raw[i] != b'\n' && raw[i] != b'\r' {
                    i += 1;
                }
                out.extend_from_slice(&raw[start..i]);
            }
            b'B' if raw.get(i + 1) == Some(&b'I')
                && (i == 0 || before_operator(raw[i - 1]))
                && raw.get(i + 2).is_none_or(|b| delimiter(*b)) =>
            {
                // What it says of itself runs to `ID`, and one byte of white
                // after it; a string in it, which may say ID, is gone past.
                let start = i;
                let mut j = i + 2;
                let data = loop {
                    if j + 1 >= raw.len() {
                        return None;
                    }
                    if raw[j] == b'(' {
                        j = past_string(raw, j);
                        continue;
                    }
                    if raw[j] == b'I'
                        && raw[j + 1] == b'D'
                        && before_operator(raw[j - 1])
                        && raw.get(j + 2).is_none_or(|b| b.is_ascii_whitespace())
                    {
                        break j + 3;
                    }
                    j += 1;
                };
                // Its bytes run to white, `EI`, and white or the end, as readers find it.
                let mut k = data.min(raw.len());
                let end = loop {
                    if k + 2 > raw.len() {
                        return None;
                    }
                    if raw[k] == b'E'
                        && raw[k + 1] == b'I'
                        && k > 0
                        && raw[k - 1].is_ascii_whitespace()
                        && raw.get(k + 2).is_none_or(|b| delimiter(*b))
                    {
                        break k + 2;
                    }
                    k += 1;
                };
                out.extend_from_slice(format!("\n{INLINE}{}\n", in_letters(images.len())).as_bytes());
                images.push(raw[start..end].to_vec());
                i = end;
            }
            b => {
                out.push(b);
                i += 1;
            }
        }
    }
    Some((out, images))
}

/// The content of a page without the text that is unseen: an operation
/// that shows text is dropped while the render mode (`Tr`, a part of the
/// graphics state, saved and restored with `q` and `Q`) is one that neither
/// fills nor strokes the letters, as scanners and OCR programs lay their
/// text; and so is a text laid over the page here before, whose XObject is
/// taken from `xobjects` as well. Everything else stays as it was, letters
/// that are seen and what sets them among it. Nothing where the content
/// cannot be read whole, as when it holds a picture packed in a way that is
/// not read here: the page is then left as it is. Pictures within the
/// content are taken out before it is read, and put back to the byte.
fn stripped(doc: &Document, page: &Dictionary, xobjects: &mut Dictionary) -> Option<Vec<u8>> {
    let (raw, images) = take_inline_images(&decoded_contents(doc, page)?)?;
    let content = Content::decode(&raw).ok()?;
    let mut out = Vec::new();
    let mut run: Vec<Operation> = Vec::new();
    let flush = |run: &mut Vec<Operation>, out: &mut Vec<u8>| -> Option<()> {
        if !run.is_empty() {
            out.extend(Content { operations: std::mem::take(run) }.encode().ok()?);
            out.push(b'\n');
        }
        Some(())
    };
    let mut render_mode: i64 = 0;
    let mut saved: Vec<i64> = Vec::new();
    for operation in content.operations {
        let operator = operation.operator.as_str();
        match operator {
            "q" => saved.push(render_mode),
            "Q" => render_mode = saved.pop().unwrap_or(0),
            "Tr" => render_mode = operation.operands.first().and_then(|m| m.as_i64().ok()).unwrap_or(render_mode),
            _ => {}
        }
        if SHOWING.contains(&operator) && unseen(render_mode) {
            continue;
        }
        if operator == "Do"
            && let Some(Object::Name(name)) = operation.operands.first()
            && name.starts_with(NAME.as_bytes())
        {
            xobjects.remove(name);
            continue;
        }
        // A picture within the content, put back as it was written.
        if let Some(n) = operator.strip_prefix(INLINE) {
            let image = images.get(from_letters(n)?)?;
            flush(&mut run, &mut out)?;
            out.extend_from_slice(image);
            out.push(b'\n');
            continue;
        }
        run.push(operation);
    }
    flush(&mut run, &mut out)?;
    Some(out)
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
/// `bytes`, and gives the file that has them. With `strip`, the text each
/// of those pages had is taken away first ([`stripped`]).
pub fn lay_over(bytes: Vec<u8>, doc: Document, layers: &[Layer], strip: bool) -> Result<Vec<u8>> {
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
        let mut contents = vec![Object::Reference(begin)];
        match strip.then(|| stripped(&doc, page, xobjects)) {
            Some(Some(without_text)) => {
                let mut stream = Stream::new(Dictionary::new(), without_text);
                stream.compress().map_err(unreadable)?;
                contents.push(Object::Reference(new.add_object(stream)));
            }
            Some(None) => {
                tracing::warn!(
                    page = layer.page + 1,
                    "the content of the page could not be read whole; its text stays"
                );
                contents.extend(contents_of(&doc, page));
            }
            None => contents.extend(contents_of(&doc, page)),
        }
        let name = free_name(xobjects);
        xobjects.set(name.as_bytes(), Object::Reference(form));
        let matrix = place.iter().map(|n| number(*n)).collect::<Vec<_>>().join(" ");
        let end = format!("\nQ\nq {matrix} cm /{name} Do Q\n");
        let end = new.add_object(Stream::new(Dictionary::new(), end.into_bytes()));
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
            read.get(&(layer.page as u32 + 1))
                .and_then(|id| doc.get_dictionary(*id).ok())
                .is_some_and(|page| has_laid(&doc, page))
        })
}

/// Whether a page has the text that was laid over it here.
pub fn has_laid(doc: &Document, page: &Dictionary) -> bool {
    inherited(doc, page, b"Resources")
        .and_then(|r| r.as_dict().ok())
        .and_then(|r| r.get(b"XObject").ok())
        .and_then(|x| doc.dereference(x).ok())
        .and_then(|(_, x)| x.as_dict().ok())
        .is_some_and(|x| x.iter().any(|(name, _)| name.starts_with(NAME.as_bytes())))
}

/// The right map of one font of a PDF, from code to text (ADR 0044).
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub struct FontMap {
    /// The font's object.
    pub font: ObjectId,
    /// Each code of the font, with the text it stands for.
    pub entries: Vec<(u32, String)>,
}

/// A map from code to Unicode as a PDF keeps it (a `ToUnicode` CMap): codes
/// of one byte, text in UTF-16 written in hexadecimal, at most a hundred to
/// a block, as the specification of CMaps asks.
fn to_unicode_cmap(entries: &[(u32, String)]) -> Vec<u8> {
    let mut out = String::from(
        "/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n\
         /CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n\
         /CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n\
         1 begincodespacerange\n<00> <FF>\nendcodespacerange\n",
    );
    let mut entries: Vec<&(u32, String)> =
        entries.iter().filter(|(code, text)| *code < 256 && !text.is_empty()).collect();
    entries.sort_by_key(|(code, _)| *code);
    for block in entries.chunks(100) {
        out.push_str(&format!("{} beginbfchar\n", block.len()));
        for (code, text) in block {
            let units: String = text.encode_utf16().map(|u| format!("{u:04X}")).collect();
            out.push_str(&format!("<{code:02X}> <{units}>\n"));
        }
        out.push_str("endbfchar\n");
    }
    out.push_str("endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend\n");
    out.into_bytes()
}

/// Writes into a PDF a right map from glyph to Unicode for each font in
/// `maps`, as an addition to the file: the pages stay as they are, and every
/// reader then copies and searches the text rightly. A font that is not a
/// simple font, or not to be found, is left as it was. The file, and how
/// many fonts were given a map.
pub fn remap(bytes: Vec<u8>, doc: Document, maps: &[FontMap]) -> Result<(Vec<u8>, usize)> {
    let count = doc.get_pages().len();
    let largest = doc.trailer.get(b"Size").and_then(Object::as_i64).unwrap_or(0).max(1) as u32 - 1;
    let mut new = Document::new_from_prev(&doc);
    new.max_id = new.max_id.max(largest);
    for key in OF_THE_STREAM.into_iter().filter(|k| *k != b"Prev") {
        new.trailer.remove(key);
    }
    let mut given = 0;
    for map in maps {
        let Ok(font) = doc.get_dictionary(map.font) else {
            tracing::warn!(font = ?map.font, "a font to be given its letters was not found");
            continue;
        };
        let simple = matches!(font.get(b"Subtype").and_then(Object::as_name), Ok(b"Type1" | b"TrueType" | b"MMType1"));
        if !simple || map.entries.is_empty() {
            tracing::info!(font = ?map.font, "a font that is not simple is left as it was");
            continue;
        }
        let mut stream = Stream::new(Dictionary::new(), to_unicode_cmap(&map.entries));
        stream.compress().map_err(unreadable)?;
        let cmap = new.add_object(stream);
        let mut changed = font.clone();
        changed.set("ToUnicode", Object::Reference(cmap));
        new.objects.insert(map.font, Object::Dictionary(changed));
        given += 1;
    }
    if given == 0 {
        return Ok((bytes, 0));
    }
    let mut update = IncrementalDocument::create_from(bytes, doc);
    update.new_document = new;
    let mut out = Vec::new();
    update.save_to(&mut out).map_err(unreadable)?;
    let reads = std::panic::catch_unwind(|| Document::load_mem(&out)).ok().and_then(|d| d.ok());
    if reads.is_some_and(|d| d.get_pages().len() == count) {
        return Ok((out, given));
    }
    tracing::warn!("the update of the PDF did not read back as whole; the file is written anew");
    let mut whole = update.get_prev_documents().clone();
    let new = &update.new_document;
    whole.max_id = whole.max_id.max(new.max_id);
    for (id, object) in &new.objects {
        whole.objects.insert(*id, object.clone());
    }
    for key in OF_THE_STREAM {
        whole.trailer.remove(key);
    }
    let mut out = Vec::new();
    whole.save_to(&mut out).map_err(unreadable)?;
    Ok((out, given))
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

    /// The long s that Tesseract's Fraktur model reads is written as s in the
    /// text laid under the page, code by code, and nothing else is touched.
    #[test]
    fn the_long_s_is_laid_as_s() {
        let content = b"BT 3 Tr /f-0-0 11 Tf 86.4 Tz [ <006f0067017f006100610020> ] TJ <017f> Tj ET".to_vec();
        let mended = long_s_as_s(content);
        let ops = Content::decode(&mended).unwrap().operations;
        let strings: Vec<Vec<u8>> = ops
            .iter()
            .flat_map(|op| op.operands.iter())
            .flat_map(|o| match o {
                Object::Array(items) => items.clone(),
                other => vec![other.clone()],
            })
            .filter_map(|o| o.as_str().ok().map(<[u8]>::to_vec))
            .collect();
        assert_eq!(strings, vec![b"\x00o\x00g\x00s\x00a\x00a\x00 ".to_vec(), b"\x00s".to_vec()]);
        assert!(ops.iter().any(|op| op.operator == "Tz"), "the rest is kept");
        // A code that only looks like it across two letters, and text without
        // the long s, are left as they were, byte for byte.
        let across = b"BT [ <00017f00> ] TJ ET".to_vec();
        assert_eq!(long_s_as_s(across.clone()), across);
        let plain = b"BT [ <0073> ] TJ ET".to_vec();
        assert_eq!(long_s_as_s(plain.clone()), plain);
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

    /// A PDF of one page, 200 by 100 points, with `content` and Helvetica as `F1`.
    fn page_of(content: &[u8]) -> Vec<u8> {
        let mut doc = Document::with_version("1.5");
        let pages = doc.new_object_id();
        let font = doc.add_object(dictionary! { "Type" => "Font", "Subtype" => "Type1", "BaseFont" => "Helvetica" });
        let stream = doc.add_object(Stream::new(Dictionary::new(), content.to_vec()));
        let page = doc.add_object(dictionary! {
            "Type" => "Page",
            "Parent" => pages,
            "MediaBox" => vec![0.into(), 0.into(), 200.into(), 100.into()],
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
        bytes
    }

    /// The operators of the content of the first page, in order.
    fn operators(pdf: &[u8]) -> Vec<String> {
        let doc = Document::load_mem(pdf).unwrap();
        let page = doc.get_pages()[&1];
        let content = Content::decode(&doc.get_page_content(page).unwrap()).unwrap();
        content.operations.into_iter().map(|o| o.operator).collect()
    }

    /// The names of the XObjects of the first page.
    fn xobject_names(pdf: &[u8]) -> Vec<String> {
        let doc = Document::load_mem(pdf).unwrap();
        let page = doc.get_dictionary(doc.get_pages()[&1]).unwrap();
        inherited(&doc, page, b"Resources")
            .and_then(|r| r.as_dict().ok())
            .and_then(|r| r.get(b"XObject").ok())
            .and_then(|x| doc.dereference(x).ok())
            .and_then(|(_, x)| x.as_dict().ok())
            .map(|x| x.iter().map(|(name, _)| String::from_utf8_lossy(name).into_owned()).collect())
            .unwrap_or_default()
    }

    #[test]
    fn a_picture_the_library_cannot_read_is_kept_and_the_text_taken_away_all_the_same() {
        // As Acrobat's Paper Capture writes a page: a picture of one dot packed in
        // hexadecimal, which the library that reads contents cannot tell the
        // length of; a word that says BI; and the unseen text of its reading.
        let picture: &[u8] = b"BI /W 1 /H 1 /IM true /BPC 1 /F [/AHx] ID\n\n00>\r\nEI";
        let mut content = b"q 12 0 0 58 0 170 cm\n".to_vec();
        content.extend_from_slice(picture);
        content.extend_from_slice(b"\nQ\nBT 0 Tr /F1 12 Tf 10 10 Td (Seen BI word) Tj ET\n");
        content.extend_from_slice(b"BT 3 Tr /F1 12 Tf 72 70 Td (NORGE'> DAE1t!RING) Tj ET\n");
        let before = page_of(&content);
        let laid = page_of(b"BT 3 Tr /F1 12 Tf 72 70 Td (NORGES DAEMRING) Tj ET\n");
        let layers = [Layer { page: 0, pdf: laid }];
        let doc = open(&before).unwrap();
        let stripped = lay_over(before.clone(), doc, &layers, true).unwrap();
        assert!(holds(&stripped, 1, &layers));
        let text = pdf_text::extract_text_from_mem(&stripped).unwrap();
        assert!(!text.contains("DAE1t"), "the old reading is gone: {text}");
        assert!(text.contains("NORGES DAEMRING") && text.contains("Seen BI word"), "{text}");
        // The picture is in the page as it was written, to the byte.
        let doc = Document::load_mem(&stripped).unwrap();
        let page = doc.get_pages()[&1];
        let written = doc.get_page_content(page).unwrap();
        assert!(written.windows(picture.len()).any(|w| w == picture), "{}", String::from_utf8_lossy(&written));
    }

    /// A page whose content unpacks to more than the limit is not unpacked
    /// whole to be stripped, in the application's own process: it is left
    /// as it is, as a page that could not be read whole.
    #[test]
    fn a_content_that_unpacks_without_end_is_not_unpacked_to_be_stripped() {
        let large = crate::ocr::fixture::inflating_pdf(layer::LARGEST_UNPACKED as usize + (8 << 20));
        let doc = Document::load_mem(&large).unwrap();
        let page = doc.get_dictionary(doc.get_pages()[&1]).unwrap();
        assert!(decoded_contents(&doc, page).is_none());
        // Within the limit, it is unpacked as before.
        let small = crate::ocr::fixture::inflating_pdf(1 << 20);
        let doc = Document::load_mem(&small).unwrap();
        let page = doc.get_dictionary(doc.get_pages()[&1]).unwrap();
        assert_eq!(decoded_contents(&doc, page).map(|c| c.len()), Some((1 << 20) + 1));

        let laid = page_of(b"BT 3 Tr /F1 12 Tf 72 70 Td (Laid) Tj ET\n");
        let layers = [Layer { page: 0, pdf: laid }];
        let doc = open(&large).unwrap();
        let kept = lay_over(large.clone(), doc, &layers, true).unwrap();
        assert!(holds(&kept, 1, &layers));
    }

    /// Packed in more than one way, with Flate last, as PostScript makes it.
    #[test]
    fn a_content_packed_twice_is_unpacked_within_the_limit() {
        use std::io::Write;
        let content = b"0 0 m 10 10 l S\n".repeat(100);
        let mut packer = flate2::write::ZlibEncoder::new(Vec::new(), flate2::Compression::default());
        packer.write_all(&content).unwrap();
        let packed = packer.finish().unwrap();
        // ASCII85 of the packed bytes, by hand: four bytes to five letters.
        let mut letters = Vec::new();
        for chunk in packed.chunks(4) {
            let mut word = [0u8; 4];
            word[..chunk.len()].copy_from_slice(chunk);
            let mut n = u32::from_be_bytes(word);
            let mut five = [0u8; 5];
            for c in five.iter_mut().rev() {
                *c = b'!' + (n % 85) as u8;
                n /= 85;
            }
            letters.extend_from_slice(&five[..chunk.len() + 1]);
        }
        letters.extend_from_slice(b"~>");
        let stream = Stream::new(
            dictionary! { "Filter" => vec![Object::from("ASCII85Decode"), Object::from("FlateDecode")] },
            letters,
        );
        assert_eq!(layer::unpacked_within(&stream, 1 << 20).as_deref(), Some(content.as_slice()));
        assert_eq!(layer::unpacked_within(&stream, 100), None);
    }

    #[test]
    fn pictures_within_a_content_are_taken_out_and_strings_and_comments_gone_past() {
        let raw = b"(a BI in a string) Tj % BI in a comment\nBI /W 2 /H 1 /BPC 8 /CS /G ID \x00\x45\x49 EI Q";
        let (out, images) = take_inline_images(raw).unwrap();
        assert_eq!(images, vec![b"BI /W 2 /H 1 /BPC 8 /CS /G ID \x00\x45\x49 EI".to_vec()]);
        let out = String::from_utf8_lossy(&out);
        assert!(out.contains("(a BI in a string)") && out.contains("% BI in a comment"), "{out}");
        assert!(out.contains("GlaukopisInlinea") && out.trim_end().ends_with('Q'), "{out}");
        for n in [0, 1, 25, 26, 27, 700] {
            assert_eq!(from_letters(&in_letters(n)), Some(n), "{n}");
        }
        // A picture with no end: the content is not read.
        assert!(take_inline_images(b"q BI /W 1 /H 1 ID \x00\x01").is_none());
    }

    /// The name `/BI` (of a state of drawing, an XObject, a tag) is no
    /// picture, nor does a string that says ID end what a picture says of
    /// itself.
    #[test]
    fn a_name_bi_is_no_picture_and_a_string_does_not_end_one() {
        let raw: &[u8] = b"/BI gs /BI BMC EMC q /BI Do Q BT (ID card) Tj ET";
        let (out, images) = take_inline_images(raw).unwrap();
        assert!(images.is_empty(), "{images:?}");
        assert_eq!(out, raw);
        let raw: &[u8] = b"/BI gs BT (Seen) Tj ET BI /W 1 /H 1 /BPC 8 /CS /G ID \x80 EI Q";
        let (out, images) = take_inline_images(raw).unwrap();
        assert_eq!(images, vec![b"BI /W 1 /H 1 /BPC 8 /CS /G ID \x80 EI".to_vec()]);
        assert!(
            String::from_utf8_lossy(&out).starts_with("/BI gs BT (Seen) Tj ET"),
            "{}",
            String::from_utf8_lossy(&out)
        );
        // What a picture says of itself may hold a string, which is gone past.
        let raw: &[u8] = b"BI /W 1 /H 1 /BPC 8 /CS /G /Note (an ID in it) ID \x80 EI Q";
        let (_, images) = take_inline_images(raw).unwrap();
        assert_eq!(images, vec![b"BI /W 1 /H 1 /BPC 8 /CS /G /Note (an ID in it) ID \x80 EI".to_vec()]);
    }

    #[test]
    fn the_text_a_page_has_is_taken_away_and_the_rest_stays() {
        // An unseen word, a rectangle, and a picture of one grey dot within the content.
        let before = page_of(
            b"BT 3 Tr /F1 12 Tf 72 70 Td (Hello) Tj ET\n0 0 10 10 re f\nq BI /W 1 /H 1 /CS /DeviceGray /BPC 8 ID \x80 EI Q\n",
        );
        assert!(pdf_text::extract_text_from_mem(&before).unwrap().contains("Hello"));
        // Laid: unseen, as Tesseract makes it.
        let laid = page_of(b"BT 3 Tr /F1 12 Tf 72 70 Td (Laid) Tj ET\n");
        let layers = [Layer { page: 0, pdf: laid.clone() }];

        let doc = open(&before).unwrap();
        let kept = lay_over(before.clone(), doc, &layers, false).unwrap();
        assert!(holds(&kept, 1, &layers));
        let ops = operators(&kept);
        assert!(ops.contains(&"Tj".to_owned()) && ops.contains(&"re".to_owned()), "{ops:?}");
        let text = pdf_text::extract_text_from_mem(&kept).unwrap();
        assert!(text.contains("Hello") && text.contains("Laid"), "{text}");

        let doc = open(&before).unwrap();
        let stripped = lay_over(before.clone(), doc, &layers, true).unwrap();
        assert!(holds(&stripped, 1, &layers));
        let ops = operators(&stripped);
        assert!(!ops.iter().any(|o| SHOWING.contains(&o.as_str())), "{ops:?}");
        assert_eq!(ops.iter().filter(|o| *o == "re").count(), 1, "{ops:?}");
        assert_eq!(ops.iter().filter(|o| *o == "BI").count(), 1, "{ops:?}");
        assert_eq!(ops.iter().filter(|o| *o == "Do").count(), 1, "{ops:?}");
        assert_eq!(xobject_names(&stripped), vec!["GlaukopisText"]);
        let text = pdf_text::extract_text_from_mem(&stripped).unwrap();
        assert!(!text.contains("Hello") && text.contains("Laid"), "{text}");
        // The picture within the content is as it was.
        let doc = Document::load_mem(&stripped).unwrap();
        let content = Content::decode(&doc.get_page_content(doc.get_pages()[&1]).unwrap()).unwrap();
        let image = content.operations.iter().find(|o| o.operator == "BI").unwrap();
        let Object::Stream(image) = &image.operands[0] else { panic!("no picture") };
        assert_eq!((image.content.as_slice(), image.dict.get(b"W").unwrap().as_i64().unwrap()), (&[0x80][..], 1));

        // Laid over again with strip, the text laid before goes with the rest.
        let again = page_of(b"BT 3 Tr /F1 12 Tf 72 70 Td (Again) Tj ET\n");
        let layers = [Layer { page: 0, pdf: again }];
        let doc = open(&kept).unwrap();
        let twice = lay_over(kept.clone(), doc, &layers, true).unwrap();
        assert!(holds(&twice, 1, &layers));
        assert_eq!(xobject_names(&twice), vec!["GlaukopisText"]);
        assert_eq!(operators(&twice).iter().filter(|o| *o == "Do").count(), 1);
        let text = pdf_text::extract_text_from_mem(&twice).unwrap();
        assert!(!text.contains("Hello") && !text.contains("Laid") && text.contains("Again"), "{text}");
        // Without strip, both texts stay, the second under a name of its own.
        let doc = open(&kept).unwrap();
        let both = lay_over(kept.clone(), doc, &layers, false).unwrap();
        assert_eq!(xobject_names(&both), vec!["GlaukopisText", "GlaukopisText1"]);
    }

    /// Letters that are seen stay; only text that is unseen is taken away,
    /// by the render mode as it stands when the text is shown, saved and
    /// restored with the graphics state.
    #[test]
    fn letters_that_are_seen_stay_and_unseen_text_goes() {
        let before = page_of(
            b"BT 3 Tr /F1 12 Tf 72 70 Td (Hidden) Tj ET\n\
              BT 0 Tr /F1 12 Tf 72 50 Td (Shown) Tj ET\n\
              0 0 10 10 re f\n\
              q 7 Tr BT /F1 12 Tf 72 30 Td (Clipped) Tj ET Q\n\
              BT /F1 12 Tf 72 10 Td (Restored) Tj [(Also) -20 (shown)] TJ ET\n",
        );
        let laid = page_of(b"BT 3 Tr /F1 12 Tf 72 70 Td (Laid) Tj ET\n");
        let layers = [Layer { page: 0, pdf: laid }];
        let doc = open(&before).unwrap();
        let stripped = lay_over(before.clone(), doc, &layers, true).unwrap();
        assert!(holds(&stripped, 1, &layers));
        let text = pdf_text::extract_text_from_mem(&stripped).unwrap();
        for word in ["Shown", "Restored", "Also", "Laid"] {
            assert!(text.contains(word), "{word} is gone: {text}");
        }
        for word in ["Hidden", "Clipped"] {
            assert!(!text.contains(word), "{word} stays: {text}");
        }
        let ops = operators(&stripped);
        // The seen words' operations and the rectangle stay, and so do BT, ET and Tr.
        assert_eq!(ops.iter().filter(|o| *o == "Tj").count(), 2, "{ops:?}");
        assert_eq!(ops.iter().filter(|o| *o == "TJ").count(), 1, "{ops:?}");
        assert_eq!(ops.iter().filter(|o| *o == "BT").count(), 4, "{ops:?}");
        assert_eq!(ops.iter().filter(|o| *o == "Tr").count(), 3, "{ops:?}");
        assert!(ops.contains(&"re".to_owned()), "{ops:?}");
        assert!(unseen(3) && unseen(7) && !unseen(0) && !unseen(1) && !unseen(2) && !unseen(4));
    }

    /// A page whose content cannot be read whole is left as it is, its text
    /// with it, rather than lose what could not be read: here a picture
    /// within the content that names its colours as lopdf does not know them.
    #[test]
    fn a_page_whose_content_is_not_read_whole_keeps_its_text() {
        // A picture within the content that has no end.
        let before = page_of(b"BT 3 Tr /F1 12 Tf 72 70 Td (Hello) Tj ET\nq BI /W 1 /H 1 /CS /G /BPC 8 ID \x80\x80\n");
        let laid = page_of(b"BT 3 Tr /F1 12 Tf 72 70 Td (Laid) Tj ET\n");
        let layers = [Layer { page: 0, pdf: laid }];
        let doc = open(&before).unwrap();
        let made = lay_over(before.clone(), doc, &layers, true).unwrap();
        assert!(holds(&made, 1, &layers));
        // Its own text stays in its content, and the text laid is over it.
        let doc = Document::load_mem(&made).unwrap();
        let content = doc.get_page_content(doc.get_pages()[&1]).unwrap();
        assert!(content.windows(10).any(|w| w == b"(Hello) Tj"), "{}", String::from_utf8_lossy(&content));
        assert_eq!(xobject_names(&made), vec!["GlaukopisText"]);
        assert!(made.starts_with(&before), "the page is kept to the byte");
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
