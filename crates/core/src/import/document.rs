//! Bringing a document in from a file, to become a map of its own.
//!
//! Pandoc reads the file and gives the document in its own shapes, as JSON.
//! That is turned into the shapes of `crate::document`, in sections: what
//! stands before the first heading, and then every heading with what stands
//! under it. The interface makes the map of them: the title the centre, every
//! heading an element under the heading above it.
//!
//! What the application has no place for is kept as text where it has text,
//! and otherwise left out; what was done is said in the remarks, in words
//! for the one who wrote the document.
//!
//! The pictures of the document are taken into the store of pictures. A file
//! that holds its pictures itself (DOCX, ODT, EPUB) has them taken out by
//! Pandoc, which is then kept from reading anything but the file; a file
//! that names its pictures (Markdown, HTML, LaTeX) has them read from where
//! it says, beside it. Nothing is fetched from the network.
//!
//! An OpenDocument or a Word file is looked at before Pandoc reads it, and
//! where Pandoc would lose something of it, Pandoc reads a copy that is
//! made for it (`lifting.rs`). What is said of figures and tables, which
//! such files have as paragraphs beside them, is given to them
//! (`captions.rs`).
//!
//! A citation that cannot be made a citation of the application at once
//! stands as the text it was in the file, under the mark `found`, which
//! holds what is known of it (`cited.rs`, and `crate::found`): one by a tag
//! that names a work the library does not have, and every one that was made
//! by a program that keeps references (`made.rs`).

mod captions;
mod cited;
mod lifting;
mod made;

use std::collections::{BTreeMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::OnceLock;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

use base64::Engine;
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

use crate::document::{self, Author, Block, Cell, CiteItem, CiteMode, Inline, Table};
use crate::error::{Error, IoContext, Result};
use crate::export::Tools;
use crate::export::tools;
use crate::formats::Stand;
use crate::found::{self, By, FoundItem};
use crate::pictures::{Picture, Pictures};
use crate::tr;

/// The largest file that is read.
pub const MAX_BYTES: u64 = 50 * 1024 * 1024;

const TERMS_JSON: &str = include_str!("../../../../resources/csl/locator-terms.json");

/// The kinds of file that are read.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Format {
    Docx,
    Odt,
    Markdown,
    Html,
    Latex,
    Rtf,
    Epub,
    Org,
    Rst,
    Typst,
    /// Text without any marks: read here, without Pandoc.
    Plain,
    AsciiDoc,
    DocBook,
    Jats,
    FictionBook,
    Opml,
    MediaWiki,
    Textile,
    Djot,
    Muse,
    Notebook,
}

/// The endings of the files that are read, in small letters.
pub const ENDINGS: [&str; 33] = [
    "docx",
    "odt",
    "md",
    "markdown",
    "mdown",
    "mkd",
    "html",
    "htm",
    "xhtml",
    "tex",
    "latex",
    "ltx",
    "rtf",
    "epub",
    "org",
    "rst",
    "typ",
    "txt",
    "text",
    "adoc",
    "asciidoc",
    "dbk",
    "docbook",
    "jats",
    "fb2",
    "opml",
    "mediawiki",
    "wiki",
    "textile",
    "dj",
    "djot",
    "muse",
    "ipynb",
];

impl Format {
    /// The kind of a file, told from the ending of its name and nothing else.
    pub fn of(path: &Path) -> Option<Format> {
        let ending = path.extension()?.to_str()?.to_ascii_lowercase();
        Some(match ending.as_str() {
            "docx" => Format::Docx,
            "odt" => Format::Odt,
            "md" | "markdown" | "mdown" | "mkd" => Format::Markdown,
            "html" | "htm" | "xhtml" => Format::Html,
            "tex" | "latex" | "ltx" => Format::Latex,
            "rtf" => Format::Rtf,
            "epub" => Format::Epub,
            "org" => Format::Org,
            "rst" => Format::Rst,
            "typ" => Format::Typst,
            "txt" | "text" => Format::Plain,
            "adoc" | "asciidoc" => Format::AsciiDoc,
            "dbk" | "docbook" => Format::DocBook,
            "jats" => Format::Jats,
            "fb2" => Format::FictionBook,
            "opml" => Format::Opml,
            "mediawiki" | "wiki" => Format::MediaWiki,
            "textile" => Format::Textile,
            "dj" | "djot" => Format::Djot,
            "muse" => Format::Muse,
            "ipynb" => Format::Notebook,
            _ => return None,
        })
    }

    /// What Pandoc calls it. Nothing for what is read without Pandoc.
    fn reader(self) -> Option<&'static str> {
        Some(match self {
            Format::Docx => "docx",
            Format::Odt => "odt",
            Format::Markdown => "markdown",
            Format::Html => "html",
            Format::Latex => "latex",
            Format::Rtf => "rtf",
            Format::Epub => "epub",
            Format::Org => "org",
            Format::Rst => "rst",
            Format::Typst => "typst",
            Format::Plain => return None,
            Format::AsciiDoc => "asciidoc",
            Format::DocBook => "docbook",
            Format::Jats => "jats",
            Format::FictionBook => "fb2",
            Format::Opml => "opml",
            Format::MediaWiki => "mediawiki",
            Format::Textile => "textile",
            Format::Djot => "djot",
            Format::Muse => "muse",
            Format::Notebook => "ipynb",
        })
    }

    /// What it is called, in words, in the language of the interface.
    pub fn name(self) -> String {
        match self {
            Format::Docx => "Word (DOCX)",
            Format::Odt => "OpenDocument (ODT)",
            Format::Markdown => "Markdown",
            Format::Html => "HTML",
            Format::Latex => "LaTeX",
            Format::Rtf => "Rich Text (RTF)",
            Format::Epub => "EPUB",
            Format::Org => "Org",
            Format::Rst => "reStructuredText",
            Format::Typst => "Typst",
            Format::Plain => return tr!("core-import-document-plain-text"),
            Format::AsciiDoc => "AsciiDoc",
            Format::DocBook => "DocBook",
            Format::Jats => "JATS",
            Format::FictionBook => "FictionBook",
            Format::Opml => "OPML",
            Format::MediaWiki => "MediaWiki",
            Format::Textile => "Textile",
            Format::Djot => "Djot",
            Format::Muse => "Muse",
            Format::Notebook => return tr!("core-import-document-notebook"),
        }
        .to_owned()
    }

    /// Whether the file holds its pictures itself.
    fn holds_pictures(self) -> bool {
        matches!(self, Format::Docx | Format::Odt | Format::Epub | Format::Rtf | Format::FictionBook | Format::Notebook)
    }
}

/// A part of the document: a heading with what stands under it. The first
/// may be without a heading, and is then what stands before the first one.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Section {
    /// 1 for the parts directly under the title; 0 for what stands before the first heading.
    pub level: u8,
    pub heading: Vec<Inline>,
    pub blocks: Vec<Block>,
}

/// How much there is of everything, for saying so before the map is made.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Counts {
    /// The parts that have a heading.
    pub parts: usize,
    /// The words of the text, with those of the notes and without those of the headings.
    pub words: usize,
    pub notes: usize,
    pub figures: usize,
    pub tables: usize,
    pub equations: usize,
    /// Works cited by keys that the library has, as often as they are cited.
    pub cited: usize,
    /// Works cited by keys that the library does not have, as often as they are cited.
    pub not_found: usize,
    /// Citations that were found and are not yet tied to references: they
    /// stand in the text as the text they were, under the mark `found`
    /// (see `crate::found`). Each is counted once, however many works it cites.
    pub found: usize,
    /// Those of them that were made by a program that keeps references.
    pub found_made: usize,
}

/// A document as it was read.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Imported {
    /// What the file is called.
    pub file: String,
    /// The kind of file, in words.
    pub kind: String,
    /// With the marks a name can have.
    pub title: Vec<Inline>,
    pub subtitle: Option<String>,
    pub authors: Vec<Author>,
    pub date: Option<String>,
    #[serde(rename = "abstract")]
    pub abstract_text: Option<String>,
    pub keywords: Vec<String>,
    /// BCP 47: en-GB, nb, de, el.
    pub language: Option<String>,
    pub sections: Vec<Section>,
    /// What the one who brings the document in should know.
    pub remarks: Vec<String>,
    pub counts: Counts,
    /// The pictures that were taken into the store for this document and
    /// were not there before, by the names they are kept by: to be taken
    /// out again if no map is made of it.
    pub pictures: Vec<String>,
}

/// What a file says of itself besides its text, where Pandoc does not tell.
/// Not the language: what such files say of that is what the program that
/// wrote them was set to, and not what the text is written in.
#[derive(Debug, Clone, Default)]
pub struct Properties {
    pub title: Option<String>,
    pub authors: Vec<String>,
    pub keywords: Vec<String>,
}

/// A picture of the document, by what the document calls it.
pub type TakeIn<'a> = dyn FnMut(&str) -> std::result::Result<Picture, String> + 'a;
/// The id of the reference of the library that has a key, if one has.
pub type Keys<'a> = dyn Fn(&str) -> Option<String> + 'a;

// =========================================================================
// Reading a file
// =========================================================================

fn stopped() -> Error {
    Error::invalid(tr!("core-import-document-stopped"))
}

/// Runs Pandoc to its end, unless it is stopped before. What it writes goes
/// to files, so that nothing has to be listened to meanwhile.
fn pandoc(tools: &Tools, args: &[String], dir: &Path, work: &Path, stop: &AtomicBool) -> Result<Vec<u8>> {
    let program = &tools.pandoc()?.path;
    let out = work.join("document.json");
    let said = work.join("messages.txt");
    let failed = |e: std::io::Error| Error::Program { program: "Pandoc".into(), message: e.to_string() };
    let mut child = tools::command(program)
        .args(args)
        .arg("-o")
        .arg(&out)
        .current_dir(dir)
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::null())
        .stderr(fs::File::create(&said).context(|| tr!("io-writing", path = &said))?)
        .spawn()
        .map_err(failed)?;
    let status = loop {
        if stop.load(Ordering::Relaxed) {
            let _ = child.kill();
            let _ = child.wait();
            return Err(stopped());
        }
        match child.try_wait().map_err(failed)? {
            Some(status) => break status,
            None => std::thread::sleep(Duration::from_millis(30)),
        }
    };
    if !status.success() {
        let messages = fs::read_to_string(&said).unwrap_or_default();
        // What it says can be long, and is not written for the one who reads this: the beginning is enough.
        let message: String = messages.trim().lines().take(3).collect::<Vec<_>>().join(" ");
        let message = if message.chars().count() > 300 {
            format!("{}…", message.chars().take(300).collect::<String>().trim_end())
        } else {
            message
        };
        return Err(Error::Program {
            program: "Pandoc".into(),
            message: if message.is_empty() { tr!("program-ended", status = status.to_string()) } else { message },
        });
    }
    fs::read(&out).context(|| tr!("io-reading", path = &out))
}

/// Reads a document. `work` is where what is made on the way is put, in a
/// directory of its own that is gone afterwards; `keys` finds the reference
/// of the library that has a key; `stop` is set from elsewhere to end the
/// reading.
pub fn read(
    path: &Path,
    tools: &Tools,
    pictures: &Pictures,
    work: &Path,
    keys: &Keys,
    stop: &AtomicBool,
) -> Result<Imported> {
    fs::create_dir_all(work).context(|| tr!("io-creating", path = work))?;
    let place = tempfile::Builder::new()
        .prefix("document-")
        .tempdir_in(work)
        .context(|| tr!("io-creating-directory-in", path = work))?;
    let work = place.path();
    // Pandoc works elsewhere than here: the file is named from the root.
    let named = std::path::absolute(path).unwrap_or_else(|_| path.to_owned());
    let path = named.as_path();
    let file = path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
    let Some(format) = Format::of(path) else {
        return Err(Error::invalid(tr!("core-import-document-kind", file = &file)));
    };
    let size = fs::metadata(path).context(|| tr!("io-reading", path = path))?.len();
    if size > MAX_BYTES {
        return Err(Error::invalid(tr!("core-import-document-too-large", file = &file)));
    }
    let stem = path.file_stem().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
    let beside = path.parent().map(Path::to_owned).unwrap_or_default();

    let before: HashSet<String> = pictures.list().into_iter().map(|p| p.hash).collect();
    let mut taken: Vec<String> = Vec::new();
    // The pictures that were asked for, by what the document calls them.
    let mut asked: HashSet<String> = HashSet::new();
    let mut held = 0usize;
    let mut told: Vec<String> = Vec::new();
    let media = work.join("media");
    let mut take_in = |named: &str| -> std::result::Result<Picture, String> {
        asked.insert(named.to_owned());
        let bytes = picture_bytes(named, &beside, &media, format.holds_pictures())?;
        // What a file that holds its pictures calls them says nothing (image1.png): they are called after
        // the document, and counted.
        let called = if format.holds_pictures() {
            let ending = kind_of_name(named).map(|e| format!(".{}", e.to_lowercase())).unwrap_or_default();
            format!("{stem} {}{ending}", asked.len())
        } else {
            name_of(named)
        };
        let picture = pictures.add(&called, &bytes).map_err(|_| match kind_of_name(named) {
            Some(kind) => tr!("core-import-document-picture-kind", kind = kind),
            None => tr!("core-import-document-picture-not-read"),
        })?;
        if !before.contains(&picture.hash) && !taken.contains(&picture.hash) {
            taken.push(picture.hash.clone());
        }
        Ok(picture)
    };

    let mut imported = match format.reader() {
        None => {
            let bytes = fs::read(path).context(|| tr!("io-reading", path = path))?;
            plain(&decode(&bytes), &stem)
        }
        Some(reader) => {
            let prepared = lifting::prepare(path, format, work);
            // What EndNote made, Pandoc reads where it is asked to. What
            // Zotero and Mendeley made is read already, and stands in the
            // copy as text between signs.
            let reader = if prepared.made.endnote > 0 { format!("{reader}+citations") } else { reader.to_owned() };
            let mut args: Vec<String> = vec!["-f".into(), reader, "-t".into(), "json".into()];
            if format == Format::Docx {
                args.push("--track-changes=accept".into());
            }
            // Where the file holds its pictures, Pandoc takes them out, and
            // is kept from reading anything else, on this computer or from
            // the network. Otherwise it works where the file is, so that
            // what the file names as parts of it is found.
            let dir = if format.holds_pictures() {
                args.push("--sandbox".into());
                args.push(format!("--extract-media={}", media.display()));
                work
            } else {
                beside.as_path()
            };
            held = prepared.held;
            told = prepared.remarks;
            args.push(prepared.copy.as_deref().unwrap_or(path).display().to_string());
            let json = pandoc(tools, &args, dir, work, stop).map_err(|e| match e {
                Error::Program { message, .. } => Error::invalid(tr!(
                    "core-import-document-unreadable",
                    file = &file,
                    kind = format.name(),
                    message = message
                )),
                other => other,
            })?;
            let value: Value = serde_json::from_slice(&json).map_err(|e| {
                Error::invalid(tr!("core-import-document-pandoc-unreadable", file = &file, error = e.to_string()))
            })?;
            convert_with(&value, &stem, &prepared.properties, &prepared.made, keys, &mut take_in)
        }
    };
    if stop.load(Ordering::Relaxed) {
        for hash in &taken {
            let _ = pictures.remove(hash);
        }
        return Err(stopped());
    }
    // Never without a word: the pictures that the file holds and the text that was read has not.
    let wanting = held.saturating_sub(asked.len());
    if wanting > 0 {
        imported.remarks.push(tr!("core-import-document-pictures-wanting", count = wanting));
    }
    imported.remarks.extend(told);
    imported.file = file;
    imported.kind = format.name();
    imported.pictures = taken;
    Ok(imported)
}

/// Takes pictures out of the store again: those that were taken in for a
/// document of which no map was made.
pub fn forget(pictures: &Pictures, hashes: &[String]) {
    for hash in hashes {
        let _ = pictures.remove(hash);
    }
}

fn name_of(named: &str) -> String {
    let last = named.rsplit(['/', '\\']).next().unwrap_or(named);
    let last = last.split(['?', '#']).next().unwrap_or(last);
    let name = unescape(last);
    if name.trim().is_empty() || named.starts_with("data:") { tr!("core-pictures-unnamed") } else { name }
}

fn kind_of_name(named: &str) -> Option<String> {
    let name = name_of(named);
    let (_, ending) = name.rsplit_once('.')?;
    (!ending.is_empty() && ending.len() <= 5 && ending.chars().all(|c| c.is_ascii_alphanumeric()))
        .then(|| ending.to_ascii_uppercase())
}

/// `%20` and its like, as addresses have them.
fn unescape(text: &str) -> String {
    let bytes = text.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%'
            && i + 2 < bytes.len()
            && let Some(byte) =
                std::str::from_utf8(&bytes[i + 1..i + 3]).ok().and_then(|h| u8::from_str_radix(h, 16).ok())
        {
            out.push(byte);
            i += 3;
            continue;
        }
        out.push(bytes[i]);
        i += 1;
    }
    String::from_utf8(out).unwrap_or_else(|_| text.to_owned())
}

/// What a picture holds, by what the document calls it.
fn picture_bytes(named: &str, beside: &Path, media: &Path, held: bool) -> std::result::Result<Vec<u8>, String> {
    let lower = named.to_ascii_lowercase();
    if let Some(rest) = named.strip_prefix("data:") {
        let (kind, content) = rest.split_once(',').ok_or_else(|| tr!("core-import-document-picture-unreadable"))?;
        return if kind.ends_with(";base64") {
            let clean: String = content.chars().filter(|c| !c.is_whitespace()).collect();
            base64::engine::general_purpose::STANDARD
                .decode(clean)
                .map_err(|_| tr!("core-import-document-picture-unreadable"))
        } else {
            Ok(unescape(content).into_bytes())
        };
    }
    if lower.starts_with("http://") || lower.starts_with("https://") || lower.starts_with("//") {
        return Err(tr!("core-import-document-picture-network"));
    }
    let plain = named.strip_prefix("file://").unwrap_or(named);
    let plain = unescape(plain.split(['?', '#']).next().unwrap_or(plain));
    let path = PathBuf::from(&plain);
    let candidates: Vec<PathBuf> = if path.is_absolute() {
        vec![path]
    } else if held {
        vec![media.join(&path), media.parent().unwrap_or(media).join(&path)]
    } else {
        vec![beside.join(&path)]
    };
    let found = candidates.into_iter().find(|c| c.is_file());
    let Some(found) = found else {
        return Err(if held {
            tr!("core-import-document-picture-not-taken-out")
        } else {
            tr!("core-import-document-picture-not-found")
        });
    };
    match fs::metadata(&found) {
        Ok(m) if m.len() > crate::pictures::MAX_BYTES => return Err(tr!("core-import-document-picture-too-large")),
        _ => {}
    }
    fs::read(&found).map_err(|_| tr!("core-import-document-picture-file-unreadable"))
}

/// Text as it is, whatever it was written in: UTF-8, UTF-16 where it says
/// so, and otherwise the letters of Western Europe.
fn decode(bytes: &[u8]) -> String {
    if let Some(rest) = bytes.strip_prefix(&[0xef, 0xbb, 0xbf])
        && let Ok(text) = std::str::from_utf8(rest)
    {
        return text.to_owned();
    }
    for (mark, big) in [([0xff_u8, 0xfe], false), ([0xfe, 0xff], true)] {
        if let Some(rest) = bytes.strip_prefix(&mark) {
            let units: Vec<u16> = rest
                .as_chunks::<2>()
                .0
                .iter()
                .map(|c| if big { u16::from_be_bytes(*c) } else { u16::from_le_bytes(*c) })
                .collect();
            return String::from_utf16_lossy(&units);
        }
    }
    match std::str::from_utf8(bytes) {
        Ok(text) => text.to_owned(),
        Err(_) => bytes.iter().map(|b| western(*b)).collect(),
    }
}

/// A letter of Windows-1252, which is Latin-1 but for a few.
fn western(byte: u8) -> char {
    const HIGH: [char; 32] = [
        '€', '\u{81}', '‚', 'ƒ', '„', '…', '†', '‡', 'ˆ', '‰', 'Š', '‹', 'Œ', '\u{8d}', 'Ž', '\u{8f}', '\u{90}', '‘',
        '’', '“', '”', '•', '–', '—', '˜', '™', 'š', '›', 'œ', '\u{9d}', 'ž', 'Ÿ',
    ];
    match byte {
        0x80..=0x9f => HIGH[usize::from(byte - 0x80)],
        _ => char::from(byte),
    }
}

/// Text without marks: paragraphs are set apart by empty lines; where there
/// are none, every line is a paragraph.
fn plain(text: &str, stem: &str) -> Imported {
    let text = text.replace("\r\n", "\n").replace('\r', "\n");
    let apart = text.trim().contains("\n\n");
    let paragraphs: Vec<String> = if apart {
        let mut out = Vec::new();
        let mut current: Vec<&str> = Vec::new();
        for line in text.lines() {
            if line.trim().is_empty() {
                if !current.is_empty() {
                    out.push(current.join(" "));
                    current.clear();
                }
            } else {
                current.push(line.trim());
            }
        }
        if !current.is_empty() {
            out.push(current.join(" "));
        }
        out
    } else {
        text.lines().map(|l| l.trim().to_owned()).filter(|l| !l.is_empty()).collect()
    };
    let blocks: Vec<Block> = paragraphs
        .into_iter()
        .map(|p| Block::Paragraph { content: vec![Inline::Text { text: clean(&p), marks: BTreeMap::new() }] })
        .collect();
    let sections = if blocks.is_empty() { Vec::new() } else { vec![Section { level: 0, heading: Vec::new(), blocks }] };
    let counts = count(&sections, 0, 0);
    Imported { title: vec![text_of(stem)], sections, counts, ..Default::default() }
}

/// Without the signs that are not text.
fn clean(text: &str) -> String {
    text.chars().filter(|c| !c.is_control() || *c == '\t').map(|c| if c == '\t' { ' ' } else { c }).collect()
}

fn text_of(text: &str) -> Inline {
    Inline::Text { text: text.to_owned(), marks: BTreeMap::new() }
}

// =========================================================================
// From the shapes of Pandoc to ours
// =========================================================================

type Marks = BTreeMap<String, Value>;

/// Something that stands in a line, or something that the line is divided by.
enum Piece {
    Inline(Inline),
    Block(Block),
}

#[derive(Default)]
struct Tally {
    code: usize,
    definitions: usize,
    rules: usize,
    raw: usize,
    /// Notes on headings, which stand in the text under them.
    moved: usize,
    /// What is said of figures and tables: what was made of it.
    said: captions::Taken,
    /// Headings where a map has none: in quotations, lists, tables.
    headings: usize,
    /// Pictures that were left out, with why.
    lost: Vec<(String, String)>,
    cited: usize,
    not_found: usize,
    /// Citations of EndNote that Pandoc read.
    endnote: usize,
}

struct Part {
    /// The level the file gives the heading; 0 for what stands before the first.
    level: i64,
    heading: Vec<Inline>,
    /// The notes of the heading.
    notes: Vec<Inline>,
    blocks: Vec<Block>,
}

struct Reading<'a, 'b> {
    keys: &'a Keys<'a>,
    take_in: &'a mut TakeIn<'b>,
    /// The words that say what a locator counts, with what they say.
    terms: Vec<(String, String)>,
    /// In a name, where a citation is the text it was written as.
    naming: bool,
    /// What programs that keep references made in the file.
    made: &'a [made::Citation],
    /// The mark of the citation that the text now read is of: it stands
    /// between the signs that were set around it before Pandoc read.
    within: Option<Value>,
    /// What the file says of the works that a program cites in it, by what
    /// the citations call them, where Pandoc read citations that a program
    /// made. Tags are not read in such a file.
    told: Option<Vec<(String, Value)>>,
    /// Figures that stood where none can stand, to stand after it.
    hoisted: Vec<Block>,
    tally: Tally,
}

fn tag(v: &Value) -> &str {
    v.get("t").and_then(Value::as_str).unwrap_or("")
}

fn inner(v: &Value) -> &Value {
    v.get("c").unwrap_or(&Value::Null)
}

fn list(v: &Value) -> &[Value] {
    v.as_array().map(Vec::as_slice).unwrap_or(&[])
}

/// The classes and the named values of what Pandoc calls attributes.
fn classes(attr: &Value) -> Vec<&str> {
    list(&attr[1]).iter().filter_map(Value::as_str).collect()
}

fn named<'v>(attr: &'v Value, name: &str) -> Option<&'v str> {
    list(&attr[2]).iter().find(|pair| pair[0].as_str() == Some(name)).and_then(|pair| pair[1].as_str())
}

fn with(marks: &Marks, name: &str, value: Value) -> Marks {
    let mut out = marks.clone();
    // Raised and lowered at once is not a thing.
    match name {
        "sup" => {
            out.remove("sub");
        }
        "sub" => {
            out.remove("sup");
        }
        _ => {}
    }
    out.insert(name.to_owned(), value);
    out
}

fn push_text(out: &mut Vec<Piece>, text: &str, marks: &Marks) {
    if text.is_empty() {
        return;
    }
    if let Some(Piece::Inline(Inline::Text { text: before, marks: same })) = out.last_mut()
        && same == marks
    {
        before.push_str(text);
        return;
    }
    out.push(Piece::Inline(Inline::Text { text: clean(text), marks: marks.clone() }));
}

/// The text of inline content of Pandoc as it was written, with what was
/// written raw.
fn written(inlines: &[Value]) -> String {
    let mut out = String::new();
    for v in inlines {
        let c = inner(v);
        match tag(v) {
            "Str" => out.push_str(&made::without_signs(c.as_str().unwrap_or(""))),
            "Space" | "SoftBreak" | "LineBreak" => out.push(' '),
            "Emph" | "Underline" | "Strong" | "Strikeout" | "Superscript" | "Subscript" | "SmallCaps" => {
                out.push_str(&written(list(c)));
            }
            "Quoted" => {
                let double = tag(&c[0]) != "SingleQuote";
                out.push(if double { '“' } else { '‘' });
                out.push_str(&written(list(&c[1])));
                out.push(if double { '”' } else { '’' });
            }
            "Cite" => out.push_str(&written(list(&c[1]))),
            "Code" | "Math" | "RawInline" => out.push_str(c[1].as_str().unwrap_or("")),
            "Link" | "Image" | "Span" => out.push_str(&written(list(&c[1]))),
            _ => {}
        }
    }
    out
}

/// Without the room at the ends, and without the texts that hold nothing.
fn trim(line: &mut Vec<Inline>) {
    while let Some(first) = line.first_mut() {
        match first {
            Inline::Text { text, .. } => {
                let kept = text.trim_start();
                if kept.is_empty() {
                    line.remove(0);
                } else {
                    if kept.len() != text.len() {
                        *text = kept.to_owned();
                    }
                    break;
                }
            }
            Inline::Break => {
                line.remove(0);
            }
            _ => break,
        }
    }
    while let Some(last) = line.last_mut() {
        match last {
            Inline::Text { text, .. } => {
                let kept = text.trim_end();
                if kept.is_empty() {
                    line.pop();
                } else {
                    if kept.len() != text.len() {
                        *text = kept.to_owned();
                    }
                    break;
                }
            }
            Inline::Break => {
                line.pop();
            }
            _ => break,
        }
    }
}

/// Puts texts that follow each other with the same marks together.
fn join(line: Vec<Inline>) -> Vec<Inline> {
    let mut out: Vec<Inline> = Vec::with_capacity(line.len());
    for i in line {
        if let Inline::Text { text, marks } = &i
            && let Some(Inline::Text { text: before, marks: same }) = out.last_mut()
            && same == marks
        {
            before.push_str(text);
            continue;
        }
        out.push(i);
    }
    out
}

/// Blocks as one line: the paragraphs joined. Figures cannot stand in a
/// line, and are set aside.
fn line_of(blocks: Vec<Block>, aside: &mut Vec<Block>) -> Vec<Inline> {
    fn walk(blocks: Vec<Block>, out: &mut Vec<Inline>, aside: &mut Vec<Block>) {
        let apart = |out: &mut Vec<Inline>| {
            if !out.is_empty() {
                out.push(text_of(" "));
            }
        };
        for b in blocks {
            match b {
                Block::Paragraph { content } => {
                    if !content.is_empty() {
                        apart(out);
                        out.extend(content);
                    }
                }
                Block::Blockquote { content } => walk(content, out, aside),
                Block::BulletList { items } | Block::OrderedList { items, .. } => {
                    for item in items {
                        walk(item, out, aside);
                    }
                }
                Block::Equation { tex, .. } => {
                    apart(out);
                    out.push(Inline::Math { tex });
                }
                Block::Table(table) => {
                    if !table.caption.is_empty() {
                        apart(out);
                        out.extend(table.caption);
                    }
                    for row in table.rows {
                        for cell in row {
                            walk(cell.content, out, aside);
                        }
                    }
                }
                Block::Row { items } => walk(items, out, aside),
                figure @ Block::Figure { .. } => aside.push(figure),
            }
        }
    }
    let mut out = Vec::new();
    walk(blocks, &mut out, aside);
    join(out)
}

/// What a cell of a table can hold: paragraphs.
fn paragraphs_of(blocks: Vec<Block>, aside: &mut Vec<Block>) -> Vec<Block> {
    let mut out = Vec::new();
    for b in blocks {
        match b {
            paragraph @ Block::Paragraph { .. } => out.push(paragraph),
            Block::Blockquote { content } => out.extend(paragraphs_of(content, aside)),
            Block::BulletList { items } | Block::OrderedList { items, .. } => {
                for item in items {
                    out.extend(paragraphs_of(item, aside));
                }
            }
            Block::Equation { tex, .. } => out.push(Block::Paragraph { content: vec![Inline::Math { tex }] }),
            Block::Row { items } => out.extend(paragraphs_of(items, aside)),
            other => {
                let line = line_of(vec![other], aside);
                if !line.is_empty() {
                    out.push(Block::Paragraph { content: line });
                }
            }
        }
    }
    out
}

/// How wide a figure is when the file does not say: as suits what the
/// picture holds. As `widthFor` in `src/lib/editor/commands.ts`.
fn width_for(picture: &Picture) -> u8 {
    match picture.width {
        None | Some(0) => {
            if picture.extension == "svg" {
                60
            } else {
                100
            }
        }
        Some(width) => {
            let share = (f64::from(width) / 9.5 / 5.0).round() * 5.0;
            share.clamp(25.0, 100.0) as u8
        }
    }
}

/// A width in hundredths, where the file gives one so.
fn percent(attr: &Value) -> Option<u8> {
    let said = named(attr, "width")?.trim();
    let number: f64 = said.strip_suffix('%')?.trim().parse().ok()?;
    (number.is_finite() && number > 0.0).then(|| number.round().clamp(10.0, 100.0) as u8)
}

fn stand_of(align: &Value) -> Option<Stand> {
    match tag(align) {
        "AlignCenter" => Some(Stand::Center),
        "AlignRight" => Some(Stand::Right),
        // To the left is where what a cell holds stands when nothing is said.
        _ => None,
    }
}

/// For every language, the words for every kind of locator, in their forms.
type Terms = BTreeMap<String, BTreeMap<String, BTreeMap<String, Vec<String>>>>;

fn terms() -> &'static Terms {
    static TERMS: OnceLock<Terms> = OnceLock::new();
    TERMS.get_or_init(|| serde_json::from_str(TERMS_JSON).unwrap_or_default())
}

/// The kinds of locator the application knows, as CSL names them.
const LABELS: [&str; 15] = [
    "page",
    "chapter",
    "section",
    "paragraph",
    "line",
    "verse",
    "book",
    "volume",
    "part",
    "column",
    "folio",
    "figure",
    "note",
    "number",
    "sub-verbo",
];

/// The words that say what a locator counts, in English and in the
/// language of the document, the longest first.
fn terms_for(language: Option<&str>) -> Vec<(String, String)> {
    let mut out: Vec<(String, String)> = Vec::new();
    let mut add = |word: &str, label: &str| {
        let word = word.trim().to_lowercase();
        if !word.is_empty() && !out.iter().any(|(w, _)| *w == word) {
            out.push((word, label.to_owned()));
        }
    };
    let all = terms();
    let mut locales: Vec<&str> = vec!["en-US", "en-GB"];
    if let Some(language) = language.map(str::trim).filter(|l| !l.is_empty()) {
        let short = language.split('-').next().unwrap_or(language).to_lowercase();
        if let Some(found) = all.keys().find(|k| k.eq_ignore_ascii_case(language)) {
            locales.insert(0, found);
        } else if let Some(found) = all.keys().find(|k| k.to_lowercase().split('-').next() == Some(short.as_str())) {
            locales.insert(0, found);
        }
    }
    for locale in locales {
        let Some(of_locale) = all.get(locale) else { continue };
        for label in LABELS {
            let Some(forms) = of_locale.get(label) else { continue };
            for words in forms.values() {
                for word in words {
                    add(word, label);
                }
            }
        }
    }
    for (word, label) in [("chap.", "chapter"), ("chaps.", "chapter"), ("sect.", "section"), ("§", "section")] {
        add(word, label);
    }
    out.sort_by_key(|(word, _)| std::cmp::Reverse(word.chars().count()));
    out
}

fn is_roman(word: &str) -> bool {
    !word.is_empty() && word.chars().all(|c| "ivxlcdmIVXLCDM".contains(c))
}

/// What is said after a work that is cited, in its parts: the locator, what
/// it counts, and the words after it.
fn locator(suffix: &str, terms: &[(String, String)]) -> (Option<String>, Option<String>, Option<String>) {
    let some = |text: &str| {
        let text = text.trim().trim_start_matches([',', ';']).trim();
        (!text.is_empty()).then(|| text.to_owned())
    };
    let clean = suffix.replace('\u{a0}', " ");
    let rest = clean.trim().trim_start_matches(',').trim_start();
    if rest.is_empty() {
        return (None, None, None);
    }
    let label_of = |text: &str| -> (Option<String>, usize) {
        let lower = text.to_lowercase();
        for (word, label) in terms {
            if !lower.starts_with(word.as_str()) {
                continue;
            }
            // The word whole, and something counted after it.
            let after = &text[lower.char_indices().nth(word.chars().count()).map_or(lower.len(), |(i, _)| i)..];
            let next = after.chars().next();
            let whole = word.ends_with('.') || word == "§" || next.is_none_or(|c| c.is_whitespace());
            if whole && after.trim_start().chars().next().is_some_and(|c| c.is_alphanumeric()) {
                return (Some(label.clone()), text.len() - after.len());
            }
        }
        (None, 0)
    };
    // In braces, it is the locator and nothing else.
    if let Some(within) = rest.strip_prefix('{')
        && let Some(end) = within.find('}')
    {
        let said = within[..end].trim();
        let (label, at) = label_of(said);
        let label = label.filter(|l| l != "page");
        return (some(&said[at..]), label, some(&within[end + 1..]));
    }
    let (label, at) = label_of(rest);
    let after = rest[at..].trim_start();
    let mut taken = 0usize;
    let mut words = 0usize;
    for word in after.split_whitespace() {
        let bare = word.trim_end_matches([',', ';', '.', ':']);
        let counted = bare.chars().any(|c| c.is_ascii_digit());
        let fits = if words == 0 {
            match label {
                Some(_) => counted || is_roman(bare),
                None => bare.chars().next().is_some_and(|c| c.is_ascii_digit()),
            }
        } else {
            counted || matches!(bare, "f" | "ff" | "sq" | "sqq")
        };
        if !fits {
            break;
        }
        // Where the word ends in what was written.
        let start = after[taken..].find(word).map_or(taken, |i| taken + i);
        taken = start + word.len();
        words += 1;
        // A full stop or a colon ends the locator; a comma may go on to another number.
        if word.ends_with(['.', ':', ';']) && !matches!(bare, "f" | "ff" | "sq" | "sqq") {
            break;
        }
    }
    if words == 0 {
        return (None, None, some(rest));
    }
    let found = after[..taken].trim_end_matches([',', ';', ':']);
    // "f." and "ff." keep their stop; a number does not.
    let found = if found.ends_with('.') && !found.ends_with("f.") && !found.ends_with("q.") {
        found.trim_end_matches('.')
    } else {
        found
    };
    (some(found), label.filter(|l| l != "page"), some(&after[taken..]))
}

impl Reading<'_, '_> {
    /// Text, under the mark of the citation it is of, if it is of one.
    fn push(&self, out: &mut Vec<Piece>, text: &str, marks: &Marks) {
        match &self.within {
            Some(mark) => push_text(out, text, &with(marks, found::MARK, mark.clone())),
            None => push_text(out, text, marks),
        }
    }

    /// Text of the file, in which the signs may stand that a citation made
    /// by a program is set between.
    fn text(&mut self, text: &str, marks: &Marks, out: &mut Vec<Piece>) {
        let mut rest = text;
        while let Some(at) = rest.find([made::BEGIN, made::END]) {
            self.push(out, &rest[..at], marks);
            let begins = rest[at..].starts_with(made::BEGIN);
            rest = &rest[at + if begins { made::BEGIN } else { made::END }.len_utf8()..];
            self.within = None;
            if !begins {
                continue;
            }
            // Which of them it is.
            let Some(end) = rest.find(made::NUMBERED) else { continue };
            let citation = rest[..end].parse::<usize>().ok().and_then(|number| self.made.get(number));
            rest = &rest[end + made::NUMBERED.len_utf8()..];
            // A name has no marks but those of names.
            if let Some(citation) = citation.filter(|_| !self.naming) {
                self.within = Some(cited::mark(citation.by, citation.items.clone(), CiteMode::Normal));
            }
        }
        self.push(out, rest, marks);
    }

    fn inlines(&mut self, inlines: &[Value], marks: &Marks, out: &mut Vec<Piece>) {
        for v in inlines {
            let c = inner(v);
            match tag(v) {
                "Str" => self.text(c.as_str().unwrap_or(""), marks, out),
                "Space" | "SoftBreak" => self.push(out, " ", marks),
                "LineBreak" => out.push(Piece::Inline(Inline::Break)),
                "Emph" => self.inlines(list(c), &with(marks, "em", Value::Bool(true)), out),
                "Strong" => self.inlines(list(c), &with(marks, "strong", Value::Bool(true)), out),
                "Strikeout" => self.inlines(list(c), &with(marks, "strike", Value::Bool(true)), out),
                "Superscript" => self.inlines(list(c), &with(marks, "sup", Value::Bool(true)), out),
                "Subscript" => self.inlines(list(c), &with(marks, "sub", Value::Bool(true)), out),
                "SmallCaps" => self.inlines(list(c), &with(marks, "smallcaps", Value::Bool(true)), out),
                "Underline" => self.inlines(list(c), marks, out),
                "Quoted" => {
                    let double = tag(&c[0]) != "SingleQuote";
                    self.push(out, if double { "“" } else { "‘" }, marks);
                    self.inlines(list(&c[1]), marks, out);
                    self.push(out, if double { "”" } else { "’" }, marks);
                }
                "Code" => self.text(c[1].as_str().unwrap_or(""), marks, out),
                "Math" => {
                    let tex = c[1].as_str().unwrap_or("").trim().to_owned();
                    if tex.is_empty() {
                        continue;
                    }
                    if tag(&c[0]) == "DisplayMath" {
                        out.push(Piece::Block(Block::Equation {
                            id: String::new(),
                            tex,
                            numbered: false,
                            align: None,
                        }));
                    } else {
                        out.push(Piece::Inline(Inline::Math { tex }));
                    }
                }
                "RawInline" => self.tally.raw += 1,
                "Link" => {
                    let href = c[2][0].as_str().unwrap_or("").trim();
                    // A link to a place in the document itself leads nowhere in a map.
                    if href.is_empty() || href.starts_with('#') {
                        self.inlines(list(&c[1]), marks, out);
                    } else {
                        self.inlines(list(&c[1]), &with(marks, "link", json!({ "href": href })), out);
                    }
                }
                "Span" => {
                    if classes(&c[0]).contains(&"smallcaps") {
                        self.inlines(list(&c[1]), &with(marks, "smallcaps", Value::Bool(true)), out);
                    } else {
                        self.inlines(list(&c[1]), marks, out);
                    }
                }
                "Image" => {
                    let named = c[2][0].as_str().unwrap_or("");
                    let title = c[2][1].as_str().unwrap_or("").trim();
                    if let Some(title) = title.strip_prefix("fig:") {
                        // As Pandoc once said that a picture is a figure: what
                        // stands with it is what is said of it.
                        let mut pieces = Vec::new();
                        self.inlines(list(&c[1]), &Marks::new(), &mut pieces);
                        let line: Vec<Inline> = pieces
                            .into_iter()
                            .filter_map(|p| match p {
                                Piece::Inline(i) => Some(i),
                                Piece::Block(_) => None,
                            })
                            .collect();
                        let line = captions::said(line, &mut self.tally.said);
                        if let Some(mut figure) = self.figure(&c[0], title.trim(), named) {
                            if let Block::Figure { caption, numbered, .. } = &mut figure {
                                *numbered = !line.is_empty();
                                *caption = line;
                            }
                            out.push(Piece::Block(figure));
                        } else if !line.is_empty() {
                            out.push(Piece::Block(Block::Paragraph { content: line }));
                        }
                    } else {
                        let shows = written(list(&c[1]));
                        let shows = if shows.trim().is_empty() { title } else { shows.trim() };
                        if let Some(figure) = self.figure(&c[0], shows, named) {
                            out.push(Piece::Block(figure));
                        }
                    }
                }
                "Note" => {
                    // What a note holds is not of the citation the note stands in.
                    let around = self.within.take();
                    let blocks = self.blocks(list(c));
                    self.within = around;
                    let mut content = line_of(blocks, &mut self.hoisted);
                    // A note within a note is not a thing.
                    content.retain(|i| !matches!(i, Inline::Footnote { .. }));
                    trim(&mut content);
                    if !content.is_empty() {
                        out.push(Piece::Inline(Inline::Footnote { content, place: None }));
                    }
                }
                "Cite" => self.cite(c, marks, out),
                _ => {}
            }
        }
    }

    /// A work in a citation of Pandoc, in its parts: the words before it,
    /// where in it, what that counts, the words after, and whether its
    /// author is left out.
    fn cited(&self, one: &Value) -> (Option<String>, Option<String>, Option<String>, Option<String>, bool) {
        let prefix = written(list(&one["citationPrefix"])).replace('\u{a0}', " ");
        let suffix = written(list(&one["citationSuffix"]));
        let (locator, label, after) = locator(&suffix, &self.terms);
        let prefix = Some(prefix.trim().to_owned()).filter(|p| !p.is_empty());
        (prefix, locator, label, after, tag(&one["citationMode"]) == "SuppressAuthor")
    }

    fn cite(&mut self, c: &Value, marks: &Marks, out: &mut Vec<Piece>) {
        let citations = list(&c[0]);
        let as_written = written(list(&c[1]));
        if self.naming {
            push_text(out, &as_written, marks);
            return;
        }
        let key = |one: &Value| one["citationId"].as_str().unwrap_or("").to_owned();
        let mode = match citations.first() {
            Some(first) if tag(&first["citationMode"]) == "AuthorInText" => CiteMode::Intext,
            _ => CiteMode::Normal,
        };
        if let Some(told) = &self.told {
            // Made by a program, and read by Pandoc: the text it showed,
            // with what the file says of each work.
            let items = citations
                .iter()
                .map(|one| {
                    let (prefix, locator, label, suffix, suppress_author) = self.cited(one);
                    let data = told.iter().find(|(id, _)| *id == key(one)).map(|(_, data)| data.clone());
                    FoundItem { data, locator, label, prefix, suffix, suppress_author, ..Default::default() }
                })
                .collect();
            self.tally.endnote += 1;
            let around = self.within.replace(cited::mark(By::Mendeley, items, mode));
            self.inlines(list(&c[1]), marks, out);
            self.within = around;
            return;
        }
        let known: Vec<Option<String>> = citations.iter().map(|one| (self.keys)(&key(one))).collect();
        for id in &known {
            if id.is_some() {
                self.tally.cited += 1;
            } else {
                self.tally.not_found += 1;
            }
        }
        if known.iter().any(Option::is_none) {
            // Not a citation until every work of it is known: it stands as
            // it was written, with what it says of each work, of those the
            // library has as well.
            let items = citations
                .iter()
                .map(|one| {
                    let (prefix, locator, label, suffix, suppress_author) = self.cited(one);
                    FoundItem {
                        key: Some(key(one)),
                        locator,
                        label,
                        prefix,
                        suffix,
                        suppress_author,
                        ..Default::default()
                    }
                })
                .collect();
            push_text(out, &as_written, &with(marks, found::MARK, cited::mark(By::Key, items, mode)));
            return;
        }
        let items = citations
            .iter()
            .zip(known)
            .filter_map(|(one, id)| {
                let (prefix, locator, label, suffix, suppress_author) = self.cited(one);
                Some(CiteItem { id: id?, locator, label, prefix, suffix, suppress_author })
            })
            .collect();
        out.push(Piece::Inline(Inline::Citation { items, mode }));
    }

    /// A picture of the document as a figure, if it can be taken in.
    fn figure(&mut self, attr: &Value, shows: &str, named: &str) -> Option<Block> {
        match (self.take_in)(named) {
            Ok(picture) => Some(Block::Figure {
                id: String::new(),
                width: percent(attr).unwrap_or_else(|| width_for(&picture)),
                file: picture.hash,
                extension: picture.extension,
                name: picture.name,
                caption: Vec::new(),
                alt: shows.to_owned(),
                // One of which nothing is said has no number either.
                numbered: false,
                align: None,
                wrap: None,
            }),
            Err(why) => {
                self.tally.lost.push((name_of(named), why));
                None
            }
        }
    }

    /// A line of Pandoc as blocks: paragraphs, and what divides them.
    fn paragraph(&mut self, inlines: &[Value], marks: &Marks, out: &mut Vec<Block>) {
        let mut pieces = Vec::new();
        self.inlines(inlines, marks, &mut pieces);
        // A citation ends where the paragraph does, whatever the signs say.
        self.within = None;
        // A paragraph that is marked as saying something of a figure or a
        // table may hold the picture itself, before its words: the mark is
        // of the words.
        let marked = match pieces.first_mut() {
            Some(Piece::Inline(Inline::Text { text, .. })) if text.starts_with(lifting::MARK) => {
                *text = text[lifting::MARK.len()..].to_owned();
                true
            }
            _ => false,
        };
        let mut line: Vec<Inline> = Vec::new();
        let end = |line: &mut Vec<Inline>, out: &mut Vec<Block>| {
            let mut content = std::mem::take(line);
            trim(&mut content);
            if !content.is_empty() {
                if marked {
                    content.insert(0, text_of(lifting::MARK));
                    content = join(content);
                }
                out.push(Block::Paragraph { content });
            }
        };
        for piece in pieces {
            match piece {
                Piece::Inline(i) => line.push(i),
                Piece::Block(b) => {
                    end(&mut line, out);
                    out.push(b);
                }
            }
        }
        end(&mut line, out);
    }

    fn blocks(&mut self, blocks: &[Value]) -> Vec<Block> {
        let mut out = Vec::new();
        for b in blocks {
            self.block(b, &mut out);
        }
        out
    }

    fn block(&mut self, b: &Value, out: &mut Vec<Block>) {
        let c = inner(b);
        match tag(b) {
            "Para" | "Plain" => self.paragraph(list(c), &Marks::new(), out),
            "LineBlock" => {
                let mut lines: Vec<Value> = Vec::new();
                for (i, line) in list(c).iter().enumerate() {
                    if i > 0 {
                        lines.push(json!({ "t": "LineBreak" }));
                    }
                    lines.extend(list(line).iter().cloned());
                }
                self.paragraph(&lines, &Marks::new(), out);
            }
            "Header" => {
                // Not where a map has its headings: in a quotation, a list, a table.
                self.tally.headings += 1;
                self.paragraph(list(&c[2]), &with(&Marks::new(), "strong", Value::Bool(true)), out);
            }
            "BlockQuote" => {
                let content = self.blocks(list(c));
                if !content.is_empty() {
                    out.push(Block::Blockquote { content });
                }
            }
            "BulletList" => {
                let items = self.items(list(c));
                if !items.is_empty() {
                    out.push(Block::BulletList { items });
                }
            }
            "OrderedList" => {
                let items = self.items(list(&c[1]));
                let start = c[0][0].as_u64().and_then(|n| u32::try_from(n).ok()).filter(|n| *n > 0).unwrap_or(1);
                if !items.is_empty() {
                    out.push(Block::OrderedList { start, items });
                }
            }
            "DefinitionList" => {
                self.tally.definitions += 1;
                for entry in list(c) {
                    self.paragraph(list(&entry[0]), &with(&Marks::new(), "strong", Value::Bool(true)), out);
                    for definition in list(&entry[1]) {
                        for b in list(definition) {
                            self.block(b, out);
                        }
                    }
                }
            }
            "CodeBlock" => {
                self.tally.code += 1;
                for line in c[1].as_str().unwrap_or("").lines().filter(|l| !l.trim().is_empty()) {
                    out.push(Block::Paragraph { content: vec![text_of(&clean(line))] });
                }
            }
            "HorizontalRule" => self.tally.rules += 1,
            "RawBlock" => self.tally.raw += 1,
            "Table" => self.table(c, out),
            "Figure" => self.pandoc_figure(c, out),
            "Div" => {
                for b in list(&c[1]) {
                    self.block(b, out);
                }
            }
            _ => {}
        }
        out.append(&mut self.hoisted);
    }

    fn items(&mut self, items: &[Value]) -> Vec<Vec<Block>> {
        items.iter().map(|item| self.blocks(list(item))).filter(|item| !item.is_empty()).collect()
    }

    /// What is said of a figure or a table: a line, in which no note
    /// stands, and without a word and a number before it.
    fn said(&mut self, blocks: &[Value]) -> Vec<Inline> {
        let converted = self.blocks(blocks);
        let line = line_of(converted, &mut self.hoisted);
        captions::said(line, &mut self.tally.said)
    }

    /// What Pandoc calls a figure: something with a caption, most often a picture.
    fn pandoc_figure(&mut self, c: &Value, out: &mut Vec<Block>) {
        let caption = self.said(list(&c[1][1]));
        let mut within = self.blocks(list(&c[2]));
        let figures = within.iter().filter(|b| matches!(b, Block::Figure { .. })).count();
        if figures == 1 {
            for b in &mut within {
                if let Block::Figure { caption: said, alt, numbered, .. } = b {
                    // What is said of it twice is said once.
                    if captions::said_twice(alt, &document::plain(&caption)) {
                        alt.clear();
                    }
                    *numbered = !caption.is_empty();
                    *said = caption.clone();
                }
            }
        } else if !caption.is_empty() {
            within.push(Block::Paragraph { content: caption });
        }
        out.extend(within);
    }

    fn table(&mut self, c: &Value, out: &mut Vec<Block>) {
        let caption = self.said(list(&c[1][1]));
        let columns: Vec<Option<Stand>> = list(&c[2]).iter().map(|spec| stand_of(&spec[0])).collect();
        let shares: f64 = list(&c[2]).iter().filter_map(|spec| inner(&spec[1]).as_f64()).sum();
        let mut rows: Vec<Vec<Cell>> = Vec::new();
        self.rows(list(&c[3][1]), true, 0, &columns, &mut rows);
        for body in list(&c[4]) {
            let heads = body[1].as_u64().unwrap_or(0) as usize;
            self.rows(list(&body[2]), true, 0, &columns, &mut rows);
            self.rows(list(&body[3]), false, heads, &columns, &mut rows);
        }
        self.rows(list(&c[5][1]), false, 0, &columns, &mut rows);
        if rows.is_empty() {
            if !caption.is_empty() {
                out.push(Block::Paragraph { content: caption });
            }
            return;
        }
        out.push(Block::Table(Table {
            id: String::new(),
            numbered: !caption.is_empty(),
            caption,
            rows,
            align: None,
            wrap: None,
            width: if shares > 0.0 { (shares * 100.0).round().clamp(10.0, 100.0) as u8 } else { 0 },
        }));
    }

    /// Rows of one part of a table. `heads` are the columns at the left
    /// whose cells are headings of their rows.
    fn rows(
        &mut self,
        rows: &[Value],
        header: bool,
        heads: usize,
        columns: &[Option<Stand>],
        out: &mut Vec<Vec<Cell>>,
    ) {
        // For every column, how many rows a cell from above still takes.
        let mut taken: Vec<usize> = Vec::new();
        for row in rows {
            let mut cells: Vec<Cell> = Vec::new();
            let mut at = 0usize;
            for cell in list(&row[1]) {
                while taken.get(at).is_some_and(|rows| *rows > 0) {
                    at += 1;
                }
                let rowspan = cell[2].as_u64().unwrap_or(1).clamp(1, 1000) as u16;
                let colspan = cell[3].as_u64().unwrap_or(1).clamp(1, 1000) as u16;
                let blocks = self.blocks(list(&cell[4]));
                let mut content = paragraphs_of(blocks, &mut self.hoisted);
                if content.is_empty() {
                    content.push(Block::Paragraph { content: Vec::new() });
                }
                cells.push(Cell {
                    content,
                    colspan,
                    rowspan,
                    header: header || at < heads,
                    align: stand_of(&cell[1]).or_else(|| columns.get(at).copied().flatten()),
                });
                for column in at..at + usize::from(colspan) {
                    if taken.len() <= column {
                        taken.resize(column + 1, 0);
                    }
                    taken[column] = usize::from(rowspan);
                }
                at += usize::from(colspan);
            }
            for rows in &mut taken {
                *rows = rows.saturating_sub(1);
            }
            if !cells.is_empty() {
                out.push(cells);
            }
        }
    }

    /// A name: text with the marks a name can have. The notes that stood
    /// in it are given beside it.
    fn name(&mut self, inlines: &[Value]) -> (Vec<Inline>, Vec<Inline>) {
        let mut pieces = Vec::new();
        self.naming = true;
        self.inlines(inlines, &Marks::new(), &mut pieces);
        self.naming = false;
        self.within = None;
        let mut line: Vec<Inline> = Vec::new();
        let mut notes: Vec<Inline> = Vec::new();
        for piece in pieces {
            match piece {
                Piece::Inline(Inline::Text { text, marks }) => {
                    let marks = marks
                        .into_iter()
                        .filter(|(name, _)| matches!(name.as_str(), "em" | "smallcaps" | "sup" | "sub"))
                        .collect();
                    line.push(Inline::Text { text, marks });
                }
                Piece::Inline(Inline::Break) => line.push(text_of(" ")),
                Piece::Inline(Inline::Math { tex }) | Piece::Block(Block::Equation { tex, .. }) => {
                    line.push(text_of(&tex));
                }
                Piece::Inline(note @ Inline::Footnote { .. }) => {
                    self.tally.moved += 1;
                    notes.push(note);
                }
                Piece::Block(figure @ Block::Figure { .. }) => self.hoisted.push(figure),
                _ => {}
            }
        }
        let mut line = join(line);
        trim(&mut line);
        (line, notes)
    }

    /// The document in its parts, as the file has them.
    fn parts(&mut self, blocks: &[Value], parts: &mut Vec<Part>) {
        for b in blocks {
            match tag(b) {
                "Header" => {
                    let c = inner(b);
                    let (heading, notes) = self.name(list(&c[2]));
                    if heading.is_empty() {
                        // A heading that says nothing divides nothing.
                        if let Some(part) = parts.last_mut() {
                            part.notes.extend(notes);
                        }
                        continue;
                    }
                    parts.push(Part { level: c[0].as_i64().unwrap_or(1).max(1), heading, notes, blocks: Vec::new() });
                }
                "Div" => self.parts(list(&inner(b)[1]), parts),
                _ => {
                    let mut out = Vec::new();
                    self.block(b, &mut out);
                    if let Some(part) = parts.last_mut() {
                        part.blocks.extend(out);
                    }
                }
            }
        }
    }
}

/// The text of what a file says of itself.
fn meta_text(v: &Value) -> String {
    let c = inner(v);
    let text = match tag(v) {
        "MetaString" => c.as_str().unwrap_or("").to_owned(),
        "MetaBool" => String::new(),
        "MetaInlines" => written(list(c)),
        "MetaBlocks" => {
            list(c).iter().map(meta_block).filter(|p| !p.trim().is_empty()).collect::<Vec<_>>().join("\n\n")
        }
        "MetaList" => list(c).iter().map(meta_text).filter(|p| !p.is_empty()).collect::<Vec<_>>().join(", "),
        _ => String::new(),
    };
    text.replace('\u{a0}', " ").trim().to_owned()
}

fn meta_block(b: &Value) -> String {
    let c = inner(b);
    match tag(b) {
        "Para" | "Plain" => written(list(c)),
        "LineBlock" => list(c).iter().map(|l| written(list(l))).collect::<Vec<_>>().join("\n"),
        "BlockQuote" => list(c).iter().map(meta_block).collect::<Vec<_>>().join("\n\n"),
        "Div" => list(&c[1]).iter().map(meta_block).collect::<Vec<_>>().join("\n\n"),
        _ => String::new(),
    }
}

fn meta_list(v: &Value) -> Vec<&Value> {
    match tag(v) {
        "MetaList" => list(inner(v)).iter().collect(),
        "" => Vec::new(),
        _ => vec![v],
    }
}

fn authors_of(meta: &Value) -> Vec<Author> {
    let mut out = Vec::new();
    let given = meta.get("author").or_else(|| meta.get("authors"));
    for one in given.map(meta_list).unwrap_or_default() {
        let author = if tag(one) == "MetaMap" {
            let of = |name: &str| inner(one).get(name).map(meta_text).filter(|t| !t.is_empty());
            Author {
                name: of("name").unwrap_or_default(),
                affiliation: of("affiliation").or_else(|| of("institute")),
                email: of("email"),
                orcid: of("orcid"),
            }
        } else {
            Author { name: meta_text(one), ..Default::default() }
        };
        if !author.name.is_empty() {
            out.push(author);
        }
    }
    out
}

/// The headings under which a document has the list of what it cites.
const BIBLIOGRAPHIES: [&str; 22] = [
    "references",
    "reference list",
    "list of references",
    "bibliography",
    "select bibliography",
    "selected bibliography",
    "works cited",
    "literature",
    "literature cited",
    "sources",
    "litteratur",
    "litteraturliste",
    "referanser",
    "referenser",
    "kilder",
    "literatur",
    "literaturverzeichnis",
    "bibliographie",
    "références",
    "bibliografia",
    "bibliografía",
    "referencias",
];

fn is_bibliography(heading: &str) -> bool {
    let said = heading.trim().trim_end_matches([':', '.']).trim();
    // Without a number before it.
    let said = said.trim_start_matches(|c: char| c.is_ascii_digit() || c == '.' || c.is_whitespace());
    let lower = said.to_lowercase();
    BIBLIOGRAPHIES.contains(&lower.as_str())
}

fn is_word_char(c: char) -> bool {
    c.is_alphabetic() || c.is_numeric()
}

/// The words of a text, as the application counts them: letters and
/// digits in runs, with apostrophes and hyphens inside them.
pub fn count_words(text: &str) -> usize {
    let chars: Vec<char> = text.chars().collect();
    let mut count = 0;
    let mut i = 0;
    while i < chars.len() {
        if !is_word_char(chars[i]) {
            i += 1;
            continue;
        }
        count += 1;
        while i < chars.len() {
            if is_word_char(chars[i]) {
                i += 1;
            } else if matches!(chars[i], '\'' | '’' | '-') && chars.get(i + 1).is_some_and(|c| is_word_char(*c)) {
                i += 2;
            } else {
                break;
            }
        }
    }
    count
}

fn count(sections: &[Section], cited: usize, not_found: usize) -> Counts {
    /// The citations that were found, by their ids, with whether a program made them.
    type Found = Vec<(String, bool)>;
    fn line(inlines: &[Inline], text: &mut String, notes: &mut usize, found: &mut Found) {
        for i in inlines {
            match i {
                Inline::Text { text: t, marks } => {
                    text.push_str(t);
                    // The pieces of one citation have one id, and are counted once.
                    if let Some((id, made)) = marks.get(found::MARK).and_then(cited::counted)
                        && !found.iter().any(|(has, _)| has == id)
                    {
                        found.push((id.to_owned(), made));
                    }
                }
                Inline::Break => text.push(' '),
                Inline::Math { .. } | Inline::CrossRef { .. } => text.push_str(" x "),
                Inline::Footnote { content, .. } => {
                    *notes += 1;
                    text.push(' ');
                    line(content, text, notes, found);
                    text.push(' ');
                }
                Inline::Citation { .. } => {}
            }
        }
    }
    let mut counts =
        Counts { parts: sections.iter().filter(|s| s.level > 0).count(), cited, not_found, ..Default::default() };
    let mut text = String::new();
    let mut notes = 0usize;
    let mut found = Found::new();
    for section in sections {
        document::walk(
            &section.blocks,
            &mut |b| match b {
                Block::Figure { .. } => counts.figures += 1,
                Block::Table(_) => counts.tables += 1,
                Block::Equation { .. } => counts.equations += 1,
                _ => {}
            },
            &mut |l| {
                line(l, &mut text, &mut notes, &mut found);
                text.push('\n');
            },
        );
    }
    counts.words = count_words(&text);
    counts.notes = notes;
    counts.found = found.len();
    counts.found_made = found.iter().filter(|(_, made)| *made).count();
    counts
}

/// What Pandoc gives of what a file says of itself, as JSON is written.
fn meta_value(v: &Value) -> Value {
    let c = inner(v);
    match tag(v) {
        "MetaBool" => c.clone(),
        "MetaList" => Value::Array(list(c).iter().map(meta_value).collect()),
        "MetaMap" => Value::Object(
            c.as_object()
                .map(|all| all.iter().map(|(name, v)| (name.clone(), meta_value(v))).collect())
                .unwrap_or_default(),
        ),
        _ => Value::String(meta_text(v)),
    }
}

/// A date as Pandoc writes it (1979, 1979-05, 1979-05-02), in the form of
/// CSL. What is written otherwise is kept as it is written.
fn csl_date(said: &str) -> Value {
    let parts: Vec<&str> = said.trim().split('-').collect();
    let numbers = !parts.is_empty()
        && parts.len() <= 3
        && parts.iter().all(|part| !part.is_empty() && part.chars().all(|c| c.is_ascii_digit()));
    if numbers { json!({ "date-parts": [parts] }) } else { json!({ "raw": said.trim() }) }
}

/// What a file says of the works that are cited in it by a program, as
/// Pandoc read it, in the form of CSL: by what the citations call the works.
fn told_of(meta: &Value) -> Vec<(String, Value)> {
    const DATES: [&str; 5] = ["issued", "accessed", "original-date", "event-date", "submitted"];
    let mut out = Vec::new();
    for one in meta.get("references").map(meta_list).unwrap_or_default() {
        let Value::Object(mut said) = meta_value(one) else { continue };
        let Some(id) = said.get("id").and_then(Value::as_str).map(str::to_owned) else { continue };
        for name in DATES {
            if let Some(date) = said.get_mut(name)
                && let Some(text) = date.as_str()
            {
                *date = csl_date(text);
            }
        }
        if let Some(data) = made::data(&Value::Object(said)) {
            out.push((id, data));
        }
    }
    out
}

/// What is said of the citations that were found, where there are any.
fn found_remark(counts: &Counts) -> Option<String> {
    if counts.found == 0 {
        return None;
    }
    // How many of them a program that keeps references made: none, all, or some.
    let made = match counts.found_made {
        0 => "none",
        all if all == counts.found => "all",
        _ => "some",
    };
    Some(tr!("core-import-document-found", count = counts.found, made = made, some = counts.found_made))
}

/// Turns what Pandoc has read into a document in parts. `stem` is what the
/// file is called, without its ending: the title where the document has none.
pub fn convert(doc: &Value, stem: &str, properties: &Properties, keys: &Keys, take_in: &mut TakeIn) -> Imported {
    convert_with(doc, stem, properties, &made::Made::default(), keys, take_in)
}

/// As `convert`, of a file in which programs that keep references made
/// something, which was read before Pandoc read the file.
fn convert_with(
    doc: &Value,
    stem: &str,
    properties: &Properties,
    made: &made::Made,
    keys: &Keys,
    take_in: &mut TakeIn,
) -> Imported {
    let empty = json!({});
    let meta = doc.get("meta").unwrap_or(&empty);
    let of = |names: &[&str]| names.iter().find_map(|n| meta.get(*n)).map(meta_text).filter(|t| !t.is_empty());
    let language = of(&["lang", "language"]);

    let mut reading = Reading {
        keys,
        take_in,
        terms: terms_for(language.as_deref()),
        naming: false,
        made: &made.citations,
        within: None,
        told: (made.endnote > 0).then(|| told_of(meta)),
        hoisted: Vec::new(),
        tally: Tally::default(),
    };

    let mut parts = vec![Part { level: 0, heading: Vec::new(), notes: Vec::new(), blocks: Vec::new() }];
    // The title the document gives itself.
    let mut title: Vec<Inline> = Vec::new();
    if let Some(given) = meta.get("title") {
        let (name, notes) = match tag(given) {
            "MetaInlines" => reading.name(list(inner(given))),
            "MetaBlocks" => {
                let lines: Vec<Value> = list(inner(given))
                    .iter()
                    .filter(|b| matches!(tag(b), "Para" | "Plain"))
                    .flat_map(|b| {
                        let mut line = list(inner(b)).to_vec();
                        line.push(json!({ "t": "Space" }));
                        line
                    })
                    .collect();
                reading.name(&lines)
            }
            _ => (vec![text_of(&meta_text(given))], Vec::new()),
        };
        title = name;
        parts[0].notes = notes;
    }
    title.retain(|i| !matches!(i, Inline::Text { text, .. } if text.is_empty()));
    let mut from_properties = !title.is_empty();
    // Whether the title is what the file says of itself, which is without marks.
    let mut bare = false;
    if title.is_empty()
        && let Some(given) = properties.title.as_deref().map(str::trim).filter(|t| !t.is_empty())
    {
        title = vec![text_of(given)];
        from_properties = true;
        bare = true;
    }

    reading.parts(list(doc.get("blocks").unwrap_or(&Value::Null)), &mut parts);
    // What was set aside at the very end.
    let left = std::mem::take(&mut reading.hoisted);
    if let Some(last) = parts.last_mut() {
        last.blocks.extend(left);
    }

    // One heading alone at the top, in a document without a title, is the title.
    if title.is_empty() && parts.len() > 1 {
        let top = parts.iter().skip(1).map(|p| p.level).min().unwrap_or(1);
        let alone = parts.iter().skip(1).filter(|p| p.level == top).count() == 1;
        if alone && parts[1].level == top {
            let first = parts.remove(1);
            title = first.heading;
            parts[0].notes.extend(first.notes);
            parts[0].blocks.extend(first.blocks);
        }
    }
    if title.is_empty() {
        title = vec![text_of(if stem.trim().is_empty() { "Untitled" } else { stem.trim() })];
    } else if from_properties {
        // The title as it is set at the top of the page is not part of the
        // text, nor a part of the document: as a paragraph, or as a heading
        // before all others.
        let said = document::plain(&title);
        if let Some(Block::Paragraph { content }) = parts[0].blocks.first()
            && document::plain(content) == said
            && !content.iter().any(|i| matches!(i, Inline::Footnote { .. } | Inline::Citation { .. }))
        {
            let set = parts[0].blocks.remove(0);
            // As it is set there, it has the marks the writer gave it.
            if bare && let Block::Paragraph { content } = set {
                let mut name: Vec<Inline> = content
                    .into_iter()
                    .filter_map(|i| match i {
                        Inline::Text { text, marks } => Some(Inline::Text {
                            text,
                            marks: marks
                                .into_iter()
                                .filter(|(name, _)| matches!(name.as_str(), "em" | "smallcaps" | "sup" | "sub"))
                                .collect(),
                        }),
                        Inline::Break => Some(text_of(" ")),
                        _ => None,
                    })
                    .collect();
                name = join(name);
                trim(&mut name);
                if document::plain(&name) == said {
                    title = name;
                }
            }
        } else if parts.len() > 1 && document::plain(&parts[1].heading) == said {
            let first = parts.remove(1);
            parts[0].notes.extend(first.notes);
            parts[0].blocks.extend(first.blocks);
        }
    }

    // The levels, made to begin at one and to go down by one at a time.
    let mut above: Vec<i64> = Vec::new();
    let mut sections: Vec<Section> = Vec::new();
    let mut bibliography: Option<String> = None;
    for mut part in parts {
        captions::attach(&mut part.blocks, &mut reading.tally.said);
        part.heading = captions::unmarked(part.heading);
        part.notes = captions::unmarked(part.notes);
        captions::unmark(&mut part.blocks);
        if !part.notes.is_empty() {
            match part.blocks.first_mut() {
                Some(Block::Paragraph { content }) => {
                    let mut with_notes = std::mem::take(&mut part.notes);
                    with_notes.append(content);
                    *content = with_notes;
                }
                _ => part.blocks.insert(0, Block::Paragraph { content: std::mem::take(&mut part.notes) }),
            }
        }
        if part.level == 0 {
            if !part.blocks.is_empty() {
                sections.push(Section { level: 0, heading: Vec::new(), blocks: part.blocks });
            }
            continue;
        }
        while above.last().is_some_and(|l| *l >= part.level) {
            above.pop();
        }
        above.push(part.level);
        let said = document::plain(&part.heading);
        if bibliography.is_none() && !part.blocks.is_empty() && is_bibliography(&said) {
            bibliography = Some(said);
        }
        sections.push(Section { level: above.len().min(12) as u8, heading: part.heading, blocks: part.blocks });
    }

    let tally = reading.tally;
    let mut remarks: Vec<String> = Vec::new();
    let counts = count(&sections, tally.cited, tally.not_found);
    if let Some(remark) = found_remark(&counts) {
        remarks.push(remark);
    }
    // Where EndNote keeps what it says apart from the field, Pandoc does not read it.
    let unread = made.endnote.saturating_sub(tally.endnote);
    if unread > 0 {
        remarks.push(tr!("core-import-document-endnote", count = unread));
    }
    if let Some(heading) = &bibliography {
        remarks.push(tr!("core-import-document-bibliography", heading = heading));
    } else if made.list {
        remarks.push(tr!("core-import-document-bibliography-made"));
    }
    for (name, why) in &tally.lost {
        remarks.push(tr!("core-import-document-picture-left-out", name = name, why = why));
    }
    if tally.moved > 0 {
        remarks.push(tr!("core-import-document-heading-notes", count = tally.moved));
    }
    if tally.said.labels > 0 {
        let first = tally.said.first.clone().unwrap_or_else(|| tr!("core-import-document-label-example"));
        remarks.push(tr!("core-import-document-labels", count = tally.said.labels, first = first));
    }
    if tally.said.bracketed > 0 {
        remarks.push(tr!("core-import-document-caption-notes", count = tally.said.bracketed));
    }
    if tally.headings > 0 {
        remarks.push(tr!("core-import-document-headings", count = tally.headings));
    }
    if tally.code > 0 {
        remarks.push(tr!("core-import-document-code", count = tally.code));
    }
    if tally.definitions > 0 {
        remarks.push(tr!("core-import-document-definitions", count = tally.definitions));
    }
    if tally.rules > 0 {
        remarks.push(tr!("core-import-document-rules", count = tally.rules));
    }
    if tally.raw > 0 {
        remarks.push(tr!("core-import-document-raw", count = tally.raw));
    }

    let keywords: Vec<String> = match meta.get("keywords").or_else(|| meta.get("keyword")).or_else(|| meta.get("tags"))
    {
        Some(given) if tag(given) == "MetaList" => {
            list(inner(given)).iter().map(meta_text).filter(|k| !k.is_empty()).collect()
        }
        Some(given) => {
            meta_text(given).split([',', ';']).map(|k| k.trim().to_owned()).filter(|k| !k.is_empty()).collect()
        }
        None => properties.keywords.clone(),
    };
    let mut authors = authors_of(meta);
    if authors.is_empty() {
        authors = properties
            .authors
            .iter()
            .filter(|a| !a.trim().is_empty())
            .map(|a| Author { name: a.trim().to_owned(), ..Default::default() })
            .collect();
    }

    Imported {
        file: String::new(),
        kind: String::new(),
        title: captions::unmarked(title),
        subtitle: of(&["subtitle"]),
        authors,
        date: of(&["date"]),
        abstract_text: of(&["abstract"]),
        keywords,
        language,
        counts,
        sections,
        remarks,
        pictures: Vec::new(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::pictures::fixtures::PNG;

    fn none(_: &str) -> Option<String> {
        None
    }

    fn library(key: &str) -> Option<String> {
        match key {
            "nagy1979" => Some("r1".to_owned()),
            "west1988" => Some("r2".to_owned()),
            _ => None,
        }
    }

    fn a_picture(named: &str) -> std::result::Result<Picture, String> {
        if named.ends_with(".emf") {
            return Err("it is of a kind that is not read (EMF)".to_owned());
        }
        Ok(Picture {
            hash: "a".repeat(64),
            extension: "png".into(),
            name: name_of(named),
            width: Some(480),
            height: Some(300),
            ..Default::default()
        })
    }

    fn read_json(json: &str, keys: &Keys) -> Imported {
        let value: Value = serde_json::from_str(json).unwrap();
        convert(&value, "the file", &Properties::default(), keys, &mut a_picture)
    }

    fn words(text: &str) -> String {
        let tokens: Vec<String> =
            text.split(' ').map(|w| format!(r#"{{"t":"Str","c":{}}}"#, serde_json::to_string(w).unwrap())).collect();
        tokens.join(r#",{"t":"Space"},"#)
    }

    fn para(text: &str) -> String {
        format!(r#"{{"t":"Para","c":[{}]}}"#, words(text))
    }

    fn header(level: u8, text: &str) -> String {
        format!(r#"{{"t":"Header","c":[{level},["",[],[]],[{}]]}}"#, words(text))
    }

    fn doc(meta: &str, blocks: &[String]) -> String {
        format!(r#"{{"pandoc-api-version":[1,23,1],"meta":{meta},"blocks":[{}]}}"#, blocks.join(","))
    }

    fn text(s: &str) -> Inline {
        text_of(s)
    }

    fn marked(s: &str, marks: &[&str]) -> Inline {
        Inline::Text { text: s.into(), marks: marks.iter().map(|m| ((*m).to_owned(), Value::Bool(true))).collect() }
    }

    fn paragraph(content: Vec<Inline>) -> Block {
        Block::Paragraph { content }
    }

    /// What the mark of a citation that was found holds, of a piece of text.
    fn found_of(inline: &Inline) -> Option<found::Found> {
        let Inline::Text { marks, .. } = inline else { return None };
        serde_json::from_value(marks.get(found::MARK)?.clone()).ok()
    }

    /// The citations that were found in a line, each once, in the order
    /// they stand in, with their text: all its pieces together.
    fn found_in(line: &[Inline]) -> Vec<(String, found::Found)> {
        let mut out: Vec<(String, found::Found)> = Vec::new();
        for inline in line {
            match inline {
                Inline::Text { text, .. } => {
                    let Some(found) = found_of(inline) else { continue };
                    assert_eq!(found.id.len(), 12, "{found:?}");
                    assert!(found.id.chars().all(|c| c.is_ascii_alphanumeric()), "{found:?}");
                    match out.iter_mut().find(|(_, has)| has.id == found.id) {
                        Some((all, has)) => {
                            assert_eq!(*has, found, "the pieces of one citation hold the same");
                            all.push_str(text);
                        }
                        None => out.push((text.clone(), found)),
                    }
                }
                Inline::Footnote { content, .. } => out.extend(found_in(content)),
                _ => {}
            }
        }
        out
    }

    /// The citations that were found in a document.
    fn all_found(read: &Imported) -> Vec<(String, found::Found)> {
        let mut out = Vec::new();
        for section in &read.sections {
            document::walk(&section.blocks, &mut |_| {}, &mut |l| out.extend(found_in(l)));
        }
        out
    }

    /// A text as it is written, without the ids of the citations that were
    /// found in it, which are made anew every time a file is read.
    fn without_ids(sections: &[Section]) -> Value {
        fn walk(value: &mut Value) {
            match value {
                Value::Object(fields) => {
                    if let Some(Value::Object(found)) = fields.get_mut(found::MARK)
                        && found.contains_key("id")
                    {
                        found.insert("id".into(), Value::String(String::new()));
                    }
                    fields.values_mut().for_each(walk);
                }
                Value::Array(all) => all.iter_mut().for_each(walk),
                _ => {}
            }
        }
        let mut written = serde_json::to_value(sections).unwrap();
        walk(&mut written);
        written
    }

    /// A work as a tag cites it.
    fn by_key(key: &str) -> FoundItem {
        FoundItem { key: Some(key.into()), ..Default::default() }
    }

    #[test]
    fn the_kind_is_told_from_the_ending() {
        assert_eq!(Format::of(Path::new("/a/b/Thesis.DOCX")), Some(Format::Docx));
        assert_eq!(Format::of(Path::new("notes.markdown")), Some(Format::Markdown));
        assert_eq!(Format::of(Path::new("notes.txt")), Some(Format::Plain));
        assert_eq!(Format::of(Path::new("paper.pdf")), None);
        assert_eq!(Format::of(Path::new("no ending")), None);
        for ending in ENDINGS {
            assert!(Format::of(Path::new(&format!("x.{ending}"))).is_some(), "{ending}");
        }
    }

    #[test]
    fn headings_become_parts_in_their_order() {
        let read = read_json(
            &doc(
                r#"{"title":{"t":"MetaInlines","c":[{"t":"Str","c":"Wrath"}]}}"#,
                &[
                    para("Before the first."),
                    header(2, "One"),
                    para("Under one."),
                    header(4, "Deep"),
                    header(3, "Less deep"),
                    header(2, "Two"),
                    header(1, "Above"),
                    header(3, "Under it"),
                ],
            ),
            &none,
        );
        assert_eq!(read.title, vec![text("Wrath")]);
        let shape: Vec<(u8, String)> = read.sections.iter().map(|s| (s.level, document::plain(&s.heading))).collect();
        assert_eq!(
            shape,
            vec![
                (0, String::new()),
                (1, "One".into()),
                (2, "Deep".into()),
                (2, "Less deep".into()),
                (1, "Two".into()),
                (1, "Above".into()),
                (2, "Under it".into()),
            ]
        );
        assert_eq!(read.sections[0].blocks, vec![paragraph(vec![text("Before the first.")])]);
        assert_eq!(read.sections[1].blocks, vec![paragraph(vec![text("Under one.")])]);
        assert_eq!(read.counts.parts, 6);
        assert_eq!(read.counts.words, 5);
    }

    #[test]
    fn one_heading_alone_at_the_top_is_the_title() {
        let read = read_json(
            &doc(
                "{}",
                &[
                    header(1, "The wrath"),
                    para("Of the centre."),
                    header(2, "One"),
                    header(3, "Within"),
                    header(2, "Two"),
                ],
            ),
            &none,
        );
        assert_eq!(read.title, vec![text("The wrath")]);
        let shape: Vec<(u8, String)> = read.sections.iter().map(|s| (s.level, document::plain(&s.heading))).collect();
        assert_eq!(shape, vec![(0, String::new()), (1, "One".into()), (2, "Within".into()), (1, "Two".into())]);

        // Two at the top: neither is the title, which is then what the file is called.
        let read = read_json(&doc("{}", &[header(1, "One"), header(1, "Two")]), &none);
        assert_eq!(read.title, vec![text("the file")]);
        assert_eq!(read.sections.len(), 2);

        // One at the top that is not the first is a part like the others.
        let read = read_json(&doc("{}", &[header(2, "One"), header(1, "Two")]), &none);
        assert_eq!(read.title, vec![text("the file")]);
        assert_eq!(read.sections.iter().map(|s| s.level).collect::<Vec<_>>(), vec![1, 1]);
    }

    #[test]
    fn marks_breaks_and_links() {
        let read = read_json(
            &doc(
                "{}",
                &[r##"{"t":"Para","c":[
                    {"t":"Emph","c":[{"t":"Str","c":"mênis"},{"t":"Space"},{"t":"Strong","c":[{"t":"Str","c":"both"}]}]},
                    {"t":"Space"},
                    {"t":"SmallCaps","c":[{"t":"Str","c":"Small"}]},
                    {"t":"Str","c":"H"},{"t":"Subscript","c":[{"t":"Str","c":"2"}]},
                    {"t":"Superscript","c":[{"t":"Str","c":"3"}]},
                    {"t":"Strikeout","c":[{"t":"Str","c":"gone"}]},
                    {"t":"LineBreak"},
                    {"t":"Link","c":[["",[],[]],[{"t":"Str","c":"a"},{"t":"Space"},{"t":"Str","c":"link"}],["https://example.org",""]]},
                    {"t":"Link","c":[["",[],[]],[{"t":"Str","c":"within"}],["#part",""]]},
                    {"t":"Quoted","c":[{"t":"DoubleQuote"},[{"t":"Str","c":"said"}]]},
                    {"t":"RawInline","c":["html","<br>"]},
                    {"t":"Code","c":[["",[],[]],"x = 1"]}
                ]}"##
                .to_owned()],
            ),
            &none,
        );
        let mut link = BTreeMap::new();
        link.insert("link".to_owned(), json!({ "href": "https://example.org" }));
        assert_eq!(
            read.sections[0].blocks,
            vec![paragraph(vec![
                marked("mênis ", &["em"]),
                marked("both", &["em", "strong"]),
                text(" "),
                marked("Small", &["smallcaps"]),
                text("H"),
                marked("2", &["sub"]),
                marked("3", &["sup"]),
                marked("gone", &["strike"]),
                Inline::Break,
                Inline::Text { text: "a link".into(), marks: link },
                text("within“said”x = 1"),
            ])]
        );
        assert!(read.remarks.iter().any(|r| r.starts_with("1 piece written in HTML or TeX")), "{:?}", read.remarks);
    }

    #[test]
    fn notes_are_one_line() {
        let read = read_json(
            &doc(
                "{}",
                &[format!(
                    r#"{{"t":"Para","c":[{{"t":"Str","c":"Text."}},{{"t":"Note","c":[{},{}]}}]}}"#,
                    para("The note."),
                    para("And more.")
                )],
            ),
            &none,
        );
        assert_eq!(
            read.sections[0].blocks,
            vec![paragraph(vec![
                text("Text."),
                Inline::Footnote { content: vec![text("The note. And more.")], place: None },
            ])]
        );
        assert_eq!(read.counts.notes, 1);
        assert_eq!(read.counts.words, 5);
    }

    #[test]
    fn a_note_on_a_heading_stands_under_it() {
        let read = read_json(
            &doc(
                "{}",
                &[
                    header(1, "One"),
                    format!(
                        r#"{{"t":"Header","c":[1,["",[],[]],[{{"t":"Str","c":"Two"}},{{"t":"Note","c":[{}]}}]]}}"#,
                        para("With thanks.")
                    ),
                    para("The text."),
                ],
            ),
            &none,
        );
        assert_eq!(read.sections[1].heading, vec![text("Two")]);
        assert_eq!(
            read.sections[1].blocks,
            vec![paragraph(vec![
                Inline::Footnote { content: vec![text("With thanks.")], place: None },
                text("The text."),
            ])]
        );
        assert!(read.remarks.iter().any(|r| r.starts_with("A note on a heading")), "{:?}", read.remarks);
    }

    #[test]
    fn mathematics_in_the_line_and_by_itself() {
        let read = read_json(
            &doc(
                "{}",
                &[r#"{"t":"Para","c":[{"t":"Str","c":"Where"},{"t":"Space"},
                    {"t":"Math","c":[{"t":"InlineMath"},"x_i \\leq \\alpha"]},
                    {"t":"Space"},{"t":"Str","c":"and"},
                    {"t":"Math","c":[{"t":"DisplayMath"},"a^2 + b^2 = c^2"]},
                    {"t":"Str","c":"holds."}]}"#
                    .to_owned()],
            ),
            &none,
        );
        assert_eq!(
            read.sections[0].blocks,
            vec![
                paragraph(vec![text("Where "), Inline::Math { tex: "x_i \\leq \\alpha".into() }, text(" and")]),
                Block::Equation { id: String::new(), tex: "a^2 + b^2 = c^2".into(), numbered: false, align: None },
                paragraph(vec![text("holds.")]),
            ]
        );
        assert_eq!(read.counts.equations, 1);
    }

    #[test]
    fn lists_quotations_and_what_has_no_place() {
        let read = read_json(
            &doc(
                "{}",
                &[
                    format!(r#"{{"t":"BlockQuote","c":[{}]}}"#, para("Sing, goddess.")),
                    format!(
                        r#"{{"t":"BulletList","c":[[{}],[{},{{"t":"OrderedList","c":[[3,{{"t":"Decimal"}},{{"t":"Period"}}],[[{}]]]}}]]}}"#,
                        para("one"),
                        para("two"),
                        para("nested")
                    ),
                    r#"{"t":"CodeBlock","c":[["",[],[]],"first line\n\nsecond line"]}"#.to_owned(),
                    format!(r#"{{"t":"DefinitionList","c":[[[{}],[[{}]]]]}}"#, words("Term"), para("What it means.")),
                    r#"{"t":"HorizontalRule"}"#.to_owned(),
                    r#"{"t":"RawBlock","c":["html","<hr>"]}"#.to_owned(),
                    format!(r#"{{"t":"Div","c":[["",[],[]],[{}]]}}"#, para("In a division.")),
                    r#"{"t":"LineBlock","c":[[{"t":"Str","c":"A"}],[{"t":"Str","c":"B"}]]}"#.to_owned(),
                ],
            ),
            &none,
        );
        assert_eq!(
            read.sections[0].blocks,
            vec![
                Block::Blockquote { content: vec![paragraph(vec![text("Sing, goddess.")])] },
                Block::BulletList {
                    items: vec![
                        vec![paragraph(vec![text("one")])],
                        vec![
                            paragraph(vec![text("two")]),
                            Block::OrderedList { start: 3, items: vec![vec![paragraph(vec![text("nested")])]] },
                        ],
                    ],
                },
                paragraph(vec![text("first line")]),
                paragraph(vec![text("second line")]),
                paragraph(vec![marked("Term", &["strong"])]),
                paragraph(vec![text("What it means.")]),
                paragraph(vec![text("In a division.")]),
                paragraph(vec![text("A"), Inline::Break, text("B")]),
            ]
        );
        let all = read.remarks.join("\n");
        assert!(all.contains("1 block of code is brought in as plain paragraphs"), "{all}");
        assert!(all.contains("1 list of terms"), "{all}");
        assert!(all.contains("1 line across the page is left out"), "{all}");
        assert!(all.contains("1 piece written in HTML or TeX"), "{all}");
    }

    #[test]
    fn pictures_become_figures() {
        let image = |src: &str, width: &str| {
            format!(r#"{{"t":"Image","c":[["",[],[{width}]],[{}],["{src}",""]]}}"#, words("A round shield"))
        };
        let read = read_json(
            &doc(
                "{}",
                &[
                    format!(
                        r#"{{"t":"Figure","c":[["",[],[]],[null,[{}]],[{{"t":"Plain","c":[{}]}}]]}}"#,
                        para("The shield of Achilles"),
                        image("pictures/The%20shield.png", r#"["width","50%"]"#)
                    ),
                    format!(r#"{{"t":"Para","c":[{}]}}"#, image("media/image2.png", r#"["width","3in"]"#)),
                    format!(
                        r#"{{"t":"Figure","c":[["",[],[]],[null,[{}]],[{{"t":"Plain","c":[{}]}}]]}}"#,
                        para("A drawing from Word"),
                        image("media/image1.emf", "")
                    ),
                ],
            ),
            &none,
        );
        assert_eq!(
            read.sections[0].blocks,
            vec![
                Block::Figure {
                    id: String::new(),
                    file: "a".repeat(64),
                    extension: "png".into(),
                    name: "The shield.png".into(),
                    caption: vec![text("The shield of Achilles")],
                    alt: "A round shield".into(),
                    width: 50,
                    numbered: true,
                    align: None,
                    wrap: None,
                },
                Block::Figure {
                    id: String::new(),
                    file: "a".repeat(64),
                    extension: "png".into(),
                    name: "image2.png".into(),
                    caption: vec![],
                    alt: "A round shield".into(),
                    // As suits a picture of 480 points.
                    width: 50,
                    numbered: false,
                    align: None,
                    wrap: None,
                },
                paragraph(vec![text("A drawing from Word")]),
            ]
        );
        assert_eq!(read.counts.figures, 2);
        assert!(
            read.remarks
                .contains(&"The picture “image1.emf” is left out: it is of a kind that is not read (EMF).".to_owned()),
            "{:?}",
            read.remarks
        );
    }

    #[test]
    fn what_stands_with_a_picture_that_is_said_to_be_a_figure_is_said_of_it() {
        // As Pandoc gives a picture in a frame of an ODT that it reads as it is.
        let read = read_json(
            &doc(
                "{}",
                &[format!(
                    r#"{{"t":"Para","c":[{{"t":"Image","c":[["",[],[["width","6cm"]]],[{}],["Pictures/1.png","fig:"]]}},{{"t":"Str","c":"After."}}]}}"#,
                    words("Figure 1: The shield")
                )],
            ),
            &none,
        );
        assert_eq!(
            read.sections[0].blocks,
            vec![
                Block::Figure {
                    id: String::new(),
                    file: "a".repeat(64),
                    extension: "png".into(),
                    name: "1.png".into(),
                    caption: vec![text("The shield")],
                    alt: String::new(),
                    width: 50,
                    numbered: true,
                    align: None,
                    wrap: None,
                },
                paragraph(vec![text("After.")]),
            ]
        );
        assert!(read.remarks[0].starts_with("1 caption began with a word and a number, such as “Figure 1:”. It is"));
    }

    #[test]
    fn tables_with_headings_and_spans() {
        let cell = |align: &str, rows: u8, columns: u8, text: &str| {
            format!(
                r#"[["",[],[]],{{"t":"{align}"}},{rows},{columns},[{}]]"#,
                if text.is_empty() { String::new() } else { format!(r#"{{"t":"Plain","c":[{}]}}"#, words(text)) }
            )
        };
        let row = |cells: &[String]| format!(r#"[["",[],[]],[{}]]"#, cells.join(","));
        let table = format!(
            r#"{{"t":"Table","c":[["",[],[]],[null,[{}]],
                [[{{"t":"AlignLeft"}},{{"t":"ColWidth","c":0.3}}],[{{"t":"AlignRight"}},{{"t":"ColWidth","c":0.3}}],[{{"t":"AlignDefault"}},{{"t":"ColWidth","c":0.2}}]],
                [["",[],[]],[{}]],
                [[["",[],[]],1,[],[{},{}]]],
                [["",[],[]],[]]]}}"#,
            para("Forms of the word"),
            row(&[cell("AlignDefault", 1, 1, "Form"), cell("AlignDefault", 1, 2, "Where")]),
            row(&[
                cell("AlignDefault", 2, 1, "mênis"),
                cell("AlignDefault", 1, 1, "12"),
                cell("AlignCenter", 1, 1, "Iliad")
            ]),
            row(&[cell("AlignDefault", 1, 1, "3"), cell("AlignDefault", 1, 1, "")]),
        );
        let read = read_json(&doc("{}", &[table]), &none);
        let Block::Table(table) = &read.sections[0].blocks[0] else { panic!("{:?}", read.sections[0].blocks) };
        assert_eq!(table.caption, vec![text("Forms of the word")]);
        assert!(table.numbered);
        assert_eq!(table.width, 80);
        type Shape = (String, u16, u16, bool, Option<Stand>);
        let shape: Vec<Vec<Shape>> = table
            .rows
            .iter()
            .map(|row| {
                row.iter()
                    .map(|c| {
                        let said = match &c.content[0] {
                            Block::Paragraph { content } => document::plain(content),
                            other => panic!("{other:?}"),
                        };
                        (said, c.colspan, c.rowspan, c.header, c.align)
                    })
                    .collect()
            })
            .collect();
        assert_eq!(
            shape,
            vec![
                vec![("Form".into(), 1, 1, true, None), ("Where".into(), 2, 1, true, Some(Stand::Right))],
                vec![
                    ("mênis".into(), 1, 2, true, None),
                    ("12".into(), 1, 1, false, Some(Stand::Right)),
                    ("Iliad".into(), 1, 1, false, Some(Stand::Center)),
                ],
                // The first column is taken from above: these stand in the second and the third.
                vec![("3".into(), 1, 1, false, Some(Stand::Right)), (String::new(), 1, 1, false, None)],
            ]
        );
        assert_eq!(table.columns(), 3);
        assert_eq!(read.counts.tables, 1);
    }

    #[test]
    fn citations_by_key() {
        let citation = |key: &str, prefix: &str, suffix: &str, mode: &str| {
            format!(
                r#"{{"citationId":"{key}","citationPrefix":[{}],"citationSuffix":[{}],"citationMode":{{"t":"{mode}"}},"citationNoteNum":1,"citationHash":0}}"#,
                if prefix.is_empty() { String::new() } else { words(prefix) },
                if suffix.is_empty() { String::new() } else { words(suffix) },
            )
        };
        let cite = |citations: &[String], as_written: &str| {
            format!(r#"{{"t":"Cite","c":[[{}],[{}]]}}"#, citations.join(","), words(as_written))
        };
        let read = read_json(
            &doc(
                "{}",
                &[format!(
                    r#"{{"t":"Para","c":[{},{{"t":"Space"}},{},{{"t":"Space"}},{},{{"t":"Space"}},{},{{"t":"Space"}},{}]}}"#,
                    cite(
                        &[citation("nagy1979", "see", ", 73–75 and passim", "NormalCitation")],
                        "[see @nagy1979, 73–75 and passim]"
                    ),
                    cite(&[citation("west1988", "", "chap. 3", "AuthorInText")], "@west1988 [chap. 3]"),
                    cite(&[citation("nokey", "", ", 12", "NormalCitation")], "[@nokey, 12]"),
                    cite(
                        &[
                            citation("other", "cf.", "", "NormalCitation"),
                            citation("nagy1979", "", "", "SuppressAuthor"),
                        ],
                        "[cf. @other; -@nagy1979]"
                    ),
                    cite(&[citation("nokey", "", "p. 5", "AuthorInText")], "@nokey [p. 5]"),
                )],
            ),
            &library,
        );
        let Block::Paragraph { content } = &read.sections[0].blocks[0] else { panic!() };
        assert_eq!(
            content[..4],
            [
                Inline::Citation {
                    items: vec![CiteItem {
                        id: "r1".into(),
                        locator: Some("73–75".into()),
                        prefix: Some("see".into()),
                        suffix: Some("and passim".into()),
                        ..Default::default()
                    }],
                    mode: CiteMode::Normal,
                },
                text(" "),
                Inline::Citation {
                    items: vec![CiteItem {
                        id: "r2".into(),
                        locator: Some("3".into()),
                        label: Some("chapter".into()),
                        ..Default::default()
                    }],
                    mode: CiteMode::Intext,
                },
                text(" "),
            ]
        );
        // Where the library has not every work, the whole is the text it
        // was written as, with what it says of each work: of the one the
        // library has as well.
        assert_eq!(document::plain(&content[4..]), "[@nokey, 12] [cf. @other; -@nagy1979] @nokey [p. 5]");
        assert_eq!(content.len(), 9);
        assert_eq!(content[5], text(" "));
        let found = found_in(content);
        let told: Vec<(&str, By, CiteMode, &[FoundItem])> =
            found.iter().map(|(text, found)| (text.as_str(), found.by, found.mode, found.items.as_slice())).collect();
        assert_eq!(
            told,
            vec![
                (
                    "[@nokey, 12]",
                    By::Key,
                    CiteMode::Normal,
                    &[FoundItem { locator: Some("12".into()), ..by_key("nokey") }][..]
                ),
                (
                    "[cf. @other; -@nagy1979]",
                    By::Key,
                    CiteMode::Normal,
                    &[
                        FoundItem { prefix: Some("cf.".into()), ..by_key("other") },
                        FoundItem { suppress_author: true, ..by_key("nagy1979") },
                    ][..]
                ),
                (
                    "@nokey [p. 5]",
                    By::Key,
                    CiteMode::Intext,
                    &[FoundItem { locator: Some("5".into()), ..by_key("nokey") }][..]
                ),
            ]
        );
        assert!(!found.iter().any(|(_, found)| found.left));
        assert_eq!((read.counts.cited, read.counts.not_found), (3, 3));
        assert_eq!((read.counts.found, read.counts.found_made), (3, 0));
        assert_eq!(
            read.remarks,
            vec![
                "3 citations were found that are not yet tied to references of your library. They stand as the text \
                 they were written as, and can be gone through when the map is made, and later."
            ]
        );
    }

    #[test]
    fn a_citation_that_was_found_keeps_the_marks_it_stands_in_and_is_text_in_a_name() {
        let cite = r#"{"t":"Cite","c":[[{"citationId":"nokey","citationPrefix":[],"citationSuffix":[],"citationMode":{"t":"NormalCitation"},"citationNoteNum":1,"citationHash":0}],[{"t":"Str","c":"[@nokey]"}]]}"#;
        let read = read_json(
            &doc(
                "{}",
                &[
                    format!(r#"{{"t":"Header","c":[1,["",[],[]],[{},{{"t":"Space"}},{cite}]]}}"#, words("One")),
                    format!(
                        r#"{{"t":"Para","c":[{{"t":"Emph","c":[{},{{"t":"Space"}},{cite}]}},{{"t":"Note","c":[{{"t":"Para","c":[{cite}]}}]}}]}}"#,
                        words("As")
                    ),
                ],
            ),
            &library,
        );
        assert_eq!(read.title, vec![text("One [@nokey]")]);
        let Block::Paragraph { content } = &read.sections[0].blocks[0] else { panic!() };
        assert_eq!(content[0], marked("As ", &["em"]));
        let Inline::Text { text: said, marks } = &content[1] else { panic!() };
        assert_eq!(said, "[@nokey]");
        assert_eq!(marks.keys().collect::<Vec<_>>(), vec!["em", "found"]);
        let found = all_found(&read);
        assert_eq!(found.len(), 2);
        assert_ne!(found[0].1.id, found[1].1.id);
        // In the name nothing was found; in the text and in the note, one each.
        assert_eq!((read.counts.found, read.counts.found_made, read.counts.notes), (2, 0, 1));
        assert!(read.remarks[0].starts_with("2 citations were found"), "{:?}", read.remarks);
    }

    #[test]
    fn what_is_said_of_the_citations_that_were_found() {
        let said = |found: usize, found_made: usize| {
            found_remark(&Counts { found, found_made, ..Default::default() }).unwrap_or_default()
        };
        assert_eq!(said(0, 0), "");
        assert_eq!(
            said(1, 0),
            "1 citation was found that is not yet tied to a reference of your library. It stands as the text it was \
             written as, and can be gone through when the map is made, and later."
        );
        assert!(said(1, 1).starts_with(
            "1 citation was found that is not yet tied to a reference of your library, made by a program that keeps \
             references. It stands"
        ));
        assert!(said(4, 4).contains("of your library, all made by a program that keeps references. They stand"));
        assert!(said(4, 1).contains("of your library, 1 of them made by a program that keeps references. They"));
    }

    #[test]
    fn locators_in_their_parts() {
        let terms = terms_for(Some("nb"));
        let parts = |suffix: &str| {
            let (locator, label, after) = locator(suffix, &terms);
            (locator.unwrap_or_default(), label.unwrap_or_default(), after.unwrap_or_default())
        };
        assert_eq!(parts(", 73"), ("73".into(), String::new(), String::new()));
        assert_eq!(parts(", pp. 33-35, 38"), ("33-35, 38".into(), String::new(), String::new()));
        assert_eq!(parts(" p.\u{a0}5"), ("5".into(), String::new(), String::new()));
        assert_eq!(parts(", 12 f."), ("12 f.".into(), String::new(), String::new()));
        assert_eq!(parts(", vol. 2, for the rest"), ("2".into(), "volume".into(), "for the rest".into()));
        assert_eq!(parts(", ch. iv"), ("iv".into(), "chapter".into(), String::new()));
        assert_eq!(parts(", kap. 3"), ("3".into(), "chapter".into(), String::new()));
        assert_eq!(parts(", and passim"), (String::new(), String::new(), "and passim".into()));
        assert_eq!(parts(" {ii, A}, as said"), ("ii, A".into(), String::new(), "as said".into()));
        assert_eq!(parts(", part of it"), (String::new(), String::new(), "part of it".into()));
        assert_eq!(parts(""), (String::new(), String::new(), String::new()));
    }

    #[test]
    fn what_the_document_says_of_itself() {
        let read = read_json(
            &doc(
                r#"{
                  "title":{"t":"MetaInlines","c":[{"t":"Str","c":"Wrath"},{"t":"Space"},{"t":"Emph","c":[{"t":"Str","c":"and"}]},{"t":"Space"},{"t":"Strong","c":[{"t":"Str","c":"hero"}]}]},
                  "subtitle":{"t":"MetaInlines","c":[{"t":"Str","c":"A"},{"t":"Space"},{"t":"Str","c":"study"}]},
                  "author":{"t":"MetaList","c":[
                    {"t":"MetaMap","c":{"name":{"t":"MetaInlines","c":[{"t":"Str","c":"A."},{"t":"Space"},{"t":"Str","c":"Scholar"}]},"affiliation":{"t":"MetaInlines","c":[{"t":"Str","c":"Oslo"}]}}},
                    {"t":"MetaInlines","c":[{"t":"Str","c":"B."},{"t":"Space"},{"t":"Str","c":"Other"}]}]},
                  "date":{"t":"MetaInlines","c":[{"t":"Str","c":"2026-01-02"}]},
                  "abstract":{"t":"MetaBlocks","c":[{"t":"Para","c":[{"t":"Str","c":"Short."}]},{"t":"Para","c":[{"t":"Str","c":"Two."}]}]},
                  "keywords":{"t":"MetaList","c":[{"t":"MetaInlines","c":[{"t":"Str","c":"wrath"}]},{"t":"MetaInlines","c":[{"t":"Str","c":"epic"}]}]},
                  "lang":{"t":"MetaInlines","c":[{"t":"Str","c":"en-GB"}]}
                }"#,
                &[para("Wrath and hero"), para("The text.")],
            ),
            &none,
        );
        assert_eq!(read.title, vec![text("Wrath "), marked("and", &["em"]), text(" hero")]);
        assert_eq!(read.subtitle.as_deref(), Some("A study"));
        assert_eq!(
            read.authors,
            vec![
                Author { name: "A. Scholar".into(), affiliation: Some("Oslo".into()), ..Default::default() },
                Author { name: "B. Other".into(), ..Default::default() },
            ]
        );
        assert_eq!(read.date.as_deref(), Some("2026-01-02"));
        assert_eq!(read.abstract_text.as_deref(), Some("Short.\n\nTwo."));
        assert_eq!(read.keywords, vec!["wrath", "epic"]);
        assert_eq!(read.language.as_deref(), Some("en-GB"));
        // The title as it is set at the top of the page is not part of the text.
        assert_eq!(read.sections[0].blocks, vec![paragraph(vec![text("The text.")])]);
    }

    #[test]
    fn the_title_set_as_a_heading_is_no_part() {
        let read = read_json(
            &doc(
                r#"{"title":{"t":"MetaInlines","c":[{"t":"Str","c":"Wrath"}]}}"#,
                &[para("Before."), header(1, "Wrath"), para("Under the title."), header(2, "One"), header(1, "Two")],
            ),
            &none,
        );
        assert_eq!(read.title, vec![text("Wrath")]);
        let shape: Vec<(u8, String)> = read.sections.iter().map(|s| (s.level, document::plain(&s.heading))).collect();
        assert_eq!(shape, vec![(0, String::new()), (1, "One".into()), (1, "Two".into())]);
        assert_eq!(
            read.sections[0].blocks,
            vec![paragraph(vec![text("Before.")]), paragraph(vec![text("Under the title.")])]
        );
    }

    #[test]
    fn a_list_of_what_is_cited_is_kept_and_said() {
        let read = read_json(
            &doc("{}", &[header(1, "One"), header(1, "Works Cited:"), para("Nagy, G. 1979."), header(1, "Literature")]),
            &none,
        );
        assert_eq!(read.sections.len(), 3);
        assert_eq!(read.sections[1].blocks.len(), 1);
        assert_eq!(read.remarks.iter().filter(|r| r.contains("a list of what it cites")).count(), 1);
        assert!(read.remarks[0].contains("under “Works Cited:”"), "{:?}", read.remarks);
    }

    #[test]
    fn words_are_counted_as_the_application_counts_them() {
        assert_eq!(count_words("The hero's well-known wrath — 24 books; l'ire."), 7);
        assert_eq!(count_words("μῆνιν ἄειδε θεά"), 3);
        assert_eq!(count_words(" - ' "), 0);
    }

    #[test]
    fn text_without_marks() {
        let read = plain("One line\nof a paragraph.\r\n\r\nAnother.\n\n\n", "notes");
        assert_eq!(
            read.sections[0].blocks,
            vec![paragraph(vec![text("One line of a paragraph.")]), paragraph(vec![text("Another.")])]
        );
        assert_eq!(read.title, vec![text("notes")]);
        let read = plain("A paragraph to a line.\nAnd another.\n", "notes");
        assert_eq!(read.sections[0].blocks.len(), 2);
        assert_eq!(decode(b"\xef\xbb\xbfna\xc3\xafve"), "naïve");
        assert_eq!(decode(b"na\xefve \x93so\x94"), "naïve “so”");
        assert_eq!(decode(&[0xff, 0xfe, b'a', 0, 0xe5, 0]), "aå");
        assert!(plain("", "empty").sections.is_empty());
    }

    // ---- with Pandoc ----

    struct Setup {
        tmp: tempfile::TempDir,
        tools: Tools,
        pictures: Pictures,
    }

    /// Nothing, when Pandoc is not installed: the tests that need it are
    /// then passed over.
    fn setup() -> Option<Setup> {
        let tools = tools::discover(&tools::Configured::default());
        if tools.pandoc.is_none() {
            eprintln!("Pandoc is not installed; the test is passed over");
            return None;
        }
        let tmp = tempfile::tempdir().unwrap();
        let pictures = Pictures::open(tmp.path().join("pictures")).unwrap();
        Some(Setup { tmp, tools, pictures })
    }

    impl Setup {
        fn desk(&self) -> PathBuf {
            let desk = self.tmp.path().join("desk");
            fs::create_dir_all(&desk).unwrap();
            desk
        }

        fn read(&self, path: &Path) -> Result<Imported> {
            let work = self.tmp.path().join("work");
            let _ = fs::remove_dir_all(&work);
            fs::create_dir_all(&work).unwrap();
            read(path, &self.tools, &self.pictures, &work, &library, &AtomicBool::new(false))
        }

        fn pandoc(&self, args: &[&str]) {
            let program = &self.tools.pandoc.as_ref().unwrap().path;
            tools::run(program, "Pandoc", args, None, Some(&self.desk())).unwrap();
        }
    }

    const EVERYTHING: &str = r#"---
title: Wrath and the *hero*
subtitle: A study
author:
  - A. Scholar
date: 2026-01-02
lang: en-GB
---

Before the first heading, with a note.[^1]

# The word

A wrath [@nagy1979, 73] that @west1988 [chap. 3] knows and [@nokey, 12] does not.
It is *more* than **anger**, H~2~O, x^2^, ~~gone~~, [a link](https://example.org).
Where $x_i \leq \alpha$ holds:

$$a^2 + b^2 = c^2$$

> Sing, goddess, the wrath.

- one
- two
    1. nested

### Deep

| Form  | Lines |
|:------|------:|
| mênis |    12 |

: Forms of the word

![The shield of Achilles](shield.png){width=50%}

## Less deep

```
a line of code
```

# References

Nagy, G. 1979. The Best of the Achaeans.

[^1]: The note.

    In two paragraphs.
"#;

    fn everything(setup: &Setup) -> PathBuf {
        let desk = setup.desk();
        fs::write(desk.join("shield.png"), PNG).unwrap();
        let path = desk.join("wrath.md");
        fs::write(&path, EVERYTHING).unwrap();
        path
    }

    fn shape(read: &Imported) -> Vec<(u8, String)> {
        read.sections.iter().map(|s| (s.level, document::plain(&s.heading))).collect()
    }

    fn kinds(blocks: &[Block]) -> Vec<&'static str> {
        blocks
            .iter()
            .map(|b| match b {
                Block::Paragraph { .. } => "paragraph",
                Block::Blockquote { .. } => "blockquote",
                Block::BulletList { .. } => "bullet_list",
                Block::OrderedList { .. } => "ordered_list",
                Block::Equation { .. } => "equation",
                Block::Table(_) => "table",
                Block::Row { .. } => "row",
                Block::Figure { .. } => "figure",
            })
            .collect()
    }

    #[test]
    fn markdown_with_everything_in_it() {
        let Some(s) = setup() else { return };
        let read = s.read(&everything(&s)).unwrap();
        assert_eq!(read.file, "wrath.md");
        assert_eq!(read.kind, "Markdown");
        assert_eq!(read.title, vec![text("Wrath and the "), marked("hero", &["em"])]);
        assert_eq!(read.subtitle.as_deref(), Some("A study"));
        assert_eq!(read.authors.len(), 1);
        assert_eq!(read.language.as_deref(), Some("en-GB"));
        assert_eq!(
            shape(&read),
            vec![
                (0, String::new()),
                (1, "The word".into()),
                (2, "Deep".into()),
                (2, "Less deep".into()),
                (1, "References".into()),
            ]
        );
        assert_eq!(
            read.sections[0].blocks,
            vec![paragraph(vec![
                text("Before the first heading, with a note."),
                Inline::Footnote { content: vec![text("The note. In two paragraphs.")], place: None },
            ])]
        );
        assert_eq!(kinds(&read.sections[1].blocks), vec!["paragraph", "equation", "blockquote", "bullet_list"]);
        let Block::Paragraph { content } = &read.sections[1].blocks[0] else { panic!() };
        assert_eq!(
            content[1],
            Inline::Citation {
                items: vec![CiteItem { id: "r1".into(), locator: Some("73".into()), ..Default::default() }],
                mode: CiteMode::Normal,
            }
        );
        assert_eq!(
            content[3],
            Inline::Citation {
                items: vec![CiteItem {
                    id: "r2".into(),
                    locator: Some("3".into()),
                    label: Some("chapter".into()),
                    ..Default::default()
                }],
                mode: CiteMode::Intext,
            }
        );
        assert_eq!(content[4], text(" knows and "));
        assert_eq!(content[6], text(" does not. It is "));
        let found = found_in(content);
        assert_eq!(found.len(), 1);
        assert_eq!(found[0].0, "[@nokey, 12]");
        assert_eq!(found[0].1.by, By::Key);
        assert_eq!(found[0].1.items, vec![FoundItem { locator: Some("12".into()), ..by_key("nokey") }]);
        assert!(content.contains(&Inline::Math { tex: "x_i \\leq \\alpha".into() }));
        assert_eq!(kinds(&read.sections[2].blocks), vec!["table", "figure"]);
        let Block::Figure { caption, alt, width, numbered, file, extension, name, .. } = &read.sections[2].blocks[1]
        else {
            panic!()
        };
        assert_eq!(caption, &vec![text("The shield of Achilles")]);
        assert_eq!((alt.as_str(), *width, *numbered), ("", 50, true));
        assert_eq!(name, "shield.png");
        assert!(s.pictures.has(file, extension));
        assert_eq!(read.pictures, vec![file.clone()]);
        assert_eq!(
            read.counts,
            Counts {
                parts: 4,
                words: 65,
                notes: 1,
                figures: 1,
                tables: 1,
                equations: 1,
                cited: 2,
                not_found: 1,
                found: 1,
                found_made: 0,
            }
        );
        let all = read.remarks.join("\n");
        assert!(all.contains("1 citation was found that is not yet tied to a reference of your library."), "{all}");
        assert!(all.contains("under “References”"), "{all}");
        assert!(all.contains("1 block of code"), "{all}");

        // Read again, the picture is in the store already, and is not one to be taken out.
        let again = s.read(&everything(&s)).unwrap();
        assert!(again.pictures.is_empty());
        // What was found gets an id of its own every time.
        assert_eq!(without_ids(&again.sections), without_ids(&read.sections));
        assert_ne!(again.sections, read.sections);
    }

    #[test]
    fn word_and_opendocument_made_of_the_same() {
        let Some(s) = setup() else { return };
        let source = everything(&s);
        for (ending, kind) in [("docx", "Word (DOCX)"), ("odt", "OpenDocument (ODT)")] {
            let made = s.desk().join(format!("wrath.{ending}"));
            s.pandoc(&[source.to_str().unwrap(), "-o", made.to_str().unwrap()]);
            let read = s.read(&made).unwrap();
            assert_eq!(read.kind, kind);
            assert_eq!(document::plain(&read.title), "Wrath and the hero", "{ending}");
            let headings: Vec<(u8, String)> = shape(&read).into_iter().filter(|(level, _)| *level > 0).collect();
            assert_eq!(
                headings,
                vec![(1, "The word".into()), (2, "Deep".into()), (2, "Less deep".into()), (1, "References".into()),],
                "{ending}"
            );
            assert_eq!(read.counts.notes, 1, "{ending}");
            assert_eq!(read.counts.tables, 1, "{ending}");
            assert_eq!(read.counts.figures, 1, "{ending}: {:?}", read.remarks);
            // Citations that are text stay text.
            assert_eq!((read.counts.cited, read.counts.not_found), (0, 0), "{ending}");
            assert_eq!((read.counts.found, read.counts.found_made), (0, 0), "{ending}");
            let word = read.sections.iter().find(|s| document::plain(&s.heading) == "The word").unwrap();
            let Block::Paragraph { content } = &word.blocks[0] else { panic!("{ending}") };
            assert!(document::plain(content).starts_with("A wrath [@nagy1979, 73] that @west1988"), "{ending}");
            assert!(kinds(&word.blocks).contains(&"blockquote"), "{ending}");
            assert!(kinds(&word.blocks).contains(&"bullet_list"), "{ending}");
            let figure = read
                .sections
                .iter()
                .flat_map(|s| &s.blocks)
                .find_map(|b| match b {
                    Block::Figure { file, extension, .. } => Some((file.clone(), extension.clone())),
                    _ => None,
                })
                .unwrap();
            assert!(s.pictures.has(&figure.0, &figure.1), "{ending}");
            assert!(read.remarks.iter().any(|r| r.contains("under “References”")), "{ending}");
        }
    }

    #[test]
    fn the_other_kinds_are_read() {
        let Some(s) = setup() else { return };
        let desk = s.desk();
        let small = "---\ntitle: Wrath\n---\n\nBefore.\n\n# One\n\nUnder *one*.[^1]\n\n## Within\n\nDeeper.\n\n# Two\n\nUnder two.\n\n[^1]: A note.\n";
        fs::write(desk.join("small.md"), small).unwrap();
        let writers = [
            ("html", "html"),
            ("tex", "latex"),
            ("rtf", "rtf"),
            ("epub", "epub"),
            ("org", "org"),
            ("rst", "rst"),
            ("adoc", "asciidoc"),
            ("dbk", "docbook"),
            ("jats", "jats"),
            ("fb2", "fb2"),
            ("opml", "opml"),
            ("mediawiki", "mediawiki"),
            ("textile", "textile"),
            ("dj", "djot"),
            ("muse", "muse"),
            ("ipynb", "ipynb"),
        ];
        for (ending, writer) in writers {
            let made = desk.join(format!("small.{ending}"));
            s.pandoc(&["small.md", "-s", "-t", writer, "-o", made.to_str().unwrap()]);
            check(&s, &made, ending);
        }
        // Typst as it is written by hand: what Pandoc writes around a whole
        // document of that kind, it does not read itself.
        let made = desk.join("small.typ");
        fs::write(
            &made,
            "#set document(title: \"Wrath\")\n\nBefore.\n\n= One\nUnder _one_.#footnote[A note.]\n\n== Within\nDeeper.\n\n= Two\nUnder two.\n",
        )
        .unwrap();
        check(&s, &made, "typ");

        fn check(s: &Setup, made: &Path, ending: &str) {
            let read = s.read(made).unwrap_or_else(|e| panic!("{ending}: {e}"));
            let headings: Vec<String> =
                read.sections.iter().filter(|s| s.level > 0).map(|s| document::plain(&s.heading)).collect();
            assert!(headings.contains(&"Within".to_owned()), "{ending}: {headings:?}");
            let all: String = read
                .sections
                .iter()
                .map(|s| {
                    let mut text = String::new();
                    document::walk(&s.blocks, &mut |_| {}, &mut |l| {
                        text.push_str(&document::plain(l));
                        text.push(' ');
                    });
                    text
                })
                .collect();
            assert!(all.contains("Deeper."), "{ending}: {all}");
            assert!(all.contains("Under two."), "{ending}: {all}");
        }
    }

    #[test]
    fn latex_with_citations_and_parts_of_its_own() {
        let Some(s) = setup() else { return };
        let desk = s.desk();
        fs::write(desk.join("part.tex"), "\\section{From another file}\nRead from beside it.\n").unwrap();
        let path = desk.join("paper.tex");
        fs::write(
            &path,
            "\\documentclass{article}\n\\title{Wrath}\n\\author{A. Scholar \\and B. Other}\n\\begin{document}\n\\maketitle\n\\section{One}\nAs \\cite[73]{nagy1979} and \\cite{nokey} say.\\footnote{A note.} And \\textcite[see][chap. 3]{nagy1979,other}.\n\\input{part}\n\\end{document}\n",
        )
        .unwrap();
        let read = s.read(&path).unwrap();
        assert_eq!(document::plain(&read.title), "Wrath");
        assert_eq!(read.authors.len(), 2);
        assert_eq!(shape(&read), vec![(1, "One".into()), (1, "From another file".into())]);
        let Block::Paragraph { content } = &read.sections[0].blocks[0] else { panic!() };
        assert_eq!(
            content[1],
            Inline::Citation {
                items: vec![CiteItem { id: "r1".into(), locator: Some("73".into()), ..Default::default() }],
                mode: CiteMode::Normal,
            }
        );
        let found = found_in(content);
        assert_eq!(found.len(), 2, "{content:?}");
        assert_eq!(found[0].0, "\\cite{nokey}");
        assert_eq!(found[0].1.items, vec![by_key("nokey")]);
        // One of two that the library has, and one that is named as the author is: all of it is text.
        assert_eq!(found[1].0, "\\textcite[see][chap. 3]{nagy1979,other}");
        assert_eq!((found[1].1.by, found[1].1.mode), (By::Key, CiteMode::Intext));
        assert_eq!(
            found[1].1.items,
            vec![
                FoundItem { prefix: Some("see".into()), ..by_key("nagy1979") },
                FoundItem { locator: Some("3".into()), label: Some("chapter".into()), ..by_key("other") },
            ]
        );
        assert_eq!((read.counts.cited, read.counts.not_found, read.counts.notes), (2, 2, 1));
        assert_eq!((read.counts.found, read.counts.found_made), (2, 0));
    }

    #[test]
    fn failures_in_plain_words() {
        let Some(s) = setup() else { return };
        let desk = s.desk();
        let broken = desk.join("broken.docx");
        fs::write(&broken, "This only says that it is one.").unwrap();
        let said = s.read(&broken).unwrap_err().to_string();
        assert!(said.starts_with("“broken.docx” could not be read as Word (DOCX)."), "{said}");

        let unknown = desk.join("paper.pdf");
        fs::write(&unknown, "%PDF").unwrap();
        let said = s.read(&unknown).unwrap_err().to_string();
        assert!(said.contains("is not of a kind that can be brought in as a document"), "{said}");

        let large = desk.join("large.md");
        let file = fs::File::create(&large).unwrap();
        file.set_len(MAX_BYTES + 1).unwrap();
        let said = s.read(&large).unwrap_err().to_string();
        assert!(said.contains("is larger than 50 MB"), "{said}");

        // Without Pandoc, text without marks is read all the same, and the rest is not.
        let none = Tools::default();
        let work = s.tmp.path().join("work");
        let text = desk.join("notes.txt");
        fs::write(&text, "A line.\n").unwrap();
        let stop = AtomicBool::new(false);
        assert!(read(&text, &none, &s.pictures, &work, &library, &stop).is_ok());
        let error = read(&everything(&s), &none, &s.pictures, &work, &library, &stop).unwrap_err();
        assert_eq!(error.kind(), "missing-program");

        // Stopped before it began, nothing is read.
        let stop = AtomicBool::new(true);
        let error = read(&everything(&s), &s.tools, &s.pictures, &work, &library, &stop).unwrap_err();
        assert_eq!(error.to_string(), "The reading was stopped.");
    }

    // ---- files as word processors write them ----

    /// A document of `crates/core/tests/documents`. Those of LibreOffice
    /// were made of the `.fodt` beside them, which was written by hand, by
    /// `soffice --headless --convert-to odt` and `--convert-to docx`.
    fn written(name: &str) -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/documents").join(name)
    }

    fn all_text(read: &Imported) -> String {
        let mut text = String::new();
        for section in &read.sections {
            text.push_str(&document::plain(&section.heading));
            text.push('\n');
            document::walk(&section.blocks, &mut |_| {}, &mut |l| {
                text.push_str(&document::plain(l));
                text.push('\n');
            });
        }
        text
    }

    const CAPTIONS: &str = "3 captions began with a word and a number, such as “Figure 1:”. They are left out: the map \
                            numbers its figures and tables itself. Where the text names one of them by its number, \
                            that is text as it was written, and does not follow the numbers of the map.";
    const TRACKED: &str = "The document has changes that are tracked. The text is brought in as it stands when all of \
                           them are accepted.";

    #[test]
    fn a_picture_in_a_frame_with_what_is_said_of_it() {
        let Some(s) = setup() else { return };
        for (name, keywords, shows) in [
            ("captions.odt", vec!["Homer", "the shield"], ["", ""]),
            // LibreOffice writes the keywords of a DOCX with nothing but room between them.
            ("captions.docx", vec!["Homer", "the", "shield"], ["A round shield", "The river round the rim"]),
        ] {
            let read = s.read(&written(name)).unwrap();
            assert_eq!(read.title, vec![text("The shield of "), marked("Achilles", &["em"])], "{name}");
            assert_eq!(read.authors, vec![Author { name: "A. Scholar".into(), ..Default::default() }], "{name}");
            assert_eq!(read.keywords, keywords, "{name}");
            // What the file says of the language is what the computer was set to.
            assert_eq!(read.language, None, "{name}");
            assert_eq!(
                shape(&read),
                vec![
                    (0, String::new()),
                    (1, "The shield".into()),
                    // Written as a paragraph of the style of a heading.
                    (2, "What is on it".into()),
                    (1, "The river".into()),
                ],
                "{name}"
            );
            assert_eq!(read.remarks, vec![CAPTIONS, TRACKED], "{name}");

            // The frame stood in the paragraph that is before it now.
            assert_eq!(kinds(&read.sections[1].blocks), vec!["paragraph", "paragraph", "figure"], "{name}");
            assert_eq!(
                read.sections[1].blocks[..2],
                [
                    paragraph(vec![text("Hephaestus makes it, as Figure 1 shows. This was put in. The end.")]),
                    paragraph(vec![text("He looks at the shield.")]),
                ],
                "{name}"
            );
            let Block::Figure { caption, numbered, alt, file, extension, .. } = &read.sections[1].blocks[2] else {
                panic!("{name}")
            };
            assert_eq!(caption, &vec![text("The shield, with its "), marked("rings", &["em"])], "{name}");
            assert!(*numbered, "{name}");
            assert_eq!(alt, shows[0], "{name}");
            assert!(s.pictures.has(file, extension), "{name}");
            assert_eq!(s.pictures.get(file).unwrap().width, Some(120), "{name}");

            // What is said of the table stood over it.
            assert_eq!(kinds(&read.sections[2].blocks), vec!["table", "paragraph"], "{name}");
            let Block::Table(table) = &read.sections[2].blocks[0] else { panic!("{name}") };
            assert_eq!(table.caption, vec![text("What the shield shows")], "{name}");
            assert!(table.numbered, "{name}");
            assert_eq!(table.rows.len(), 3, "{name}");
            assert!(table.rows[0].iter().all(|c| c.header), "{name}");
            // What names the table is text, and no caption.
            assert_eq!(
                read.sections[2].blocks[1],
                paragraph(vec![text("Table 1 shows that the rings are many.")]),
                "{name}"
            );

            // A picture in the line, and what is said of it in the paragraph under it.
            assert_eq!(kinds(&read.sections[3].blocks), vec!["figure", "paragraph"], "{name}");
            let Block::Figure { caption, numbered, alt, file, extension, .. } = &read.sections[3].blocks[0] else {
                panic!("{name}")
            };
            assert_eq!(caption, &vec![text("Ocean, the river")], "{name}");
            assert!(*numbered, "{name}");
            assert_eq!(alt, shows[1], "{name}");
            assert!(s.pictures.has(file, extension), "{name}");
            assert_eq!(s.pictures.get(file).unwrap().width, Some(60), "{name}");
            // Called after the document, and not what the file calls it within.
            let called = s.pictures.get(file).unwrap().name;
            assert!(called.starts_with("captions ") && !called.contains("1000"), "{name}: {called}");

            assert_eq!(read.counts.figures, 2, "{name}");
            let all = all_text(&read);
            // What was taken out with the changes tracked is not in the text; what was put in is.
            assert!(!all.contains("taken out"), "{name}: {all}");
            assert!(all.contains("This was put in."), "{name}: {all}");
            assert!(!all.contains(lifting::MARK), "{name}: {all}");
            assert!(!all.contains("Figure 1:") && !all.contains("Table 1:"), "{name}: {all}");
        }
    }

    #[test]
    fn a_frame_that_holds_text_alone() {
        let Some(s) = setup() else { return };
        // In these the picture was lost when LibreOffice read what they were made of: they hold none.
        for name in ["book.odt", "book.docx"] {
            let read = s.read(&written(name)).unwrap();
            assert_eq!(document::plain(&read.title), "The wrath of Achilles", "{name}");
            assert_eq!(read.authors, vec![Author { name: "Robert Emil Berge".into(), ..Default::default() }], "{name}");
            assert_eq!(read.keywords, vec!["Homer", "wrath"], "{name}");
            assert_eq!(read.language, None, "{name}");
            let forms = read.sections.iter().find(|s| document::plain(&s.heading) == "Its forms").unwrap();
            assert_eq!(kinds(&forms.blocks), vec!["table", "paragraph"], "{name}");
            let Block::Table(table) = &forms.blocks[0] else { panic!("{name}") };
            assert_eq!(table.caption, vec![text("Forms of the word")], "{name}");
            assert!(table.numbered, "{name}");
            let iliad = read.sections.iter().find(|s| document::plain(&s.heading) == "In the Iliad").unwrap();
            assert_eq!(
                iliad.blocks,
                vec![
                    paragraph(vec![text("He looks at the shield.")]),
                    paragraph(vec![text("Figure : The shield of Achilles")]),
                ],
                "{name}"
            );
            assert_eq!(read.counts.figures, 0, "{name}");
            assert_eq!(read.remarks.len(), 2, "{name}: {:?}", read.remarks);
            assert!(read.remarks[0].starts_with("1 caption began with a word and a number, such as “Table 1:”. It is"));
            assert_eq!(read.remarks[1], TRACKED, "{name}");
        }
    }

    #[test]
    fn pictures_that_the_file_holds_and_the_text_has_not_are_told_of() {
        let Some(s) = setup() else { return };
        // The same, with the second picture taken out of the text and left in the file.
        let source = written("captions.odt");
        let mut archive = zip::ZipArchive::new(fs::File::open(&source).unwrap()).unwrap();
        let mut content = String::new();
        std::io::Read::read_to_string(&mut archive.by_name("content.xml").unwrap(), &mut content).unwrap();
        let from = content.find(r#"<draw:frame draw:style-name="fr3""#).unwrap();
        let to = from + content[from..].find("</draw:frame>").unwrap() + "</draw:frame>".len();
        content.replace_range(from..to, "");
        let made = s.desk().join("wanting.odt");
        lifting::write_copy(&mut archive, &made, &[("content.xml".to_owned(), content)]).unwrap();

        let read = s.read(&made).unwrap();
        assert_eq!(read.counts.figures, 1);
        assert_eq!(
            read.remarks,
            vec![
                "2 captions began with a word and a number, such as “Figure 1:”. They are left out: the map numbers \
                 its figures and tables itself. Where the text names one of them by its number, that is text as it \
                 was written, and does not follow the numbers of the map.",
                "1 picture that the file holds is not in the text that was read, and is left out. It may stand in \
                 the head or the foot of the pages, or in a drawing.",
                TRACKED,
            ]
        );
        // What was said of it had nothing to be said of, and stands as it was written.
        let river = read.sections.iter().find(|s| document::plain(&s.heading) == "The river").unwrap();
        assert_eq!(river.blocks[0], paragraph(vec![text("Figure 1. Ocean, the river")]));
    }

    #[test]
    fn what_is_said_of_figures_and_tables_as_word_has_it() {
        let Some(s) = setup() else { return };
        let desk = s.desk();
        fs::write(desk.join("shield.png"), PNG).unwrap();
        // A paragraph of the style of captions under a picture in the line,
        // and over a table; and the ways of Pandoc itself.
        fs::write(
            desk.join("word.md"),
            r#"---
title: The shield
---

Before it, Figure 1 is named.

![A round shield](shield.png)\

::: {custom-style="Caption"}
Figure 1: The shield of *Achilles*
:::

::: {custom-style="Caption"}
Table 1 Rings
:::

| Ring  | Shows |
|-------|-------|
| first | stars |

::: {custom-style="Caption"}
Of nothing that stands here
:::

Text between.

| Ring   | Shows  |
|--------|--------|
| second | cities |

: Table 2: As Pandoc writes what is said of a table

![Figure 2. As Pandoc writes what is said of a figure](shield.png)
"#,
        )
        .unwrap();
        s.pandoc(&["word.md", "-o", "word.docx"]);
        let read = s.read(&desk.join("word.docx")).unwrap();
        let blocks = &read.sections[0].blocks;
        assert_eq!(
            kinds(blocks),
            vec!["paragraph", "figure", "table", "paragraph", "paragraph", "table", "figure"],
            "{blocks:?}"
        );
        let said: Vec<(String, bool)> = blocks
            .iter()
            .filter_map(|b| match b {
                Block::Figure { caption, numbered, .. } => Some((document::plain(caption), *numbered)),
                Block::Table(table) => Some((document::plain(&table.caption), table.numbered)),
                _ => None,
            })
            .collect();
        assert_eq!(
            said,
            vec![
                ("The shield of Achilles".to_owned(), true),
                ("Rings".to_owned(), true),
                ("As Pandoc writes what is said of a table".to_owned(), true),
                ("As Pandoc writes what is said of a figure".to_owned(), true),
            ]
        );
        let Block::Figure { caption, alt, .. } = &blocks[1] else { panic!() };
        assert_eq!(caption, &vec![text("The shield of "), marked("Achilles", &["em"])]);
        assert_eq!(alt, "A round shield");
        assert_eq!(blocks[0], paragraph(vec![text("Before it, Figure 1 is named.")]));
        assert_eq!(blocks[3], paragraph(vec![text("Of nothing that stands here")]));
        assert_eq!(blocks[4], paragraph(vec![text("Text between.")]));
        assert_eq!(read.remarks.len(), 1);
        assert!(read.remarks[0].starts_with("4 captions began with a word and a number, such as “"));
        assert!(!all_text(&read).contains(lifting::MARK));
        // What the second shows was said in the words that are said of it.
        let Block::Figure { alt, .. } = &blocks[6] else { panic!() };
        assert_eq!(alt, "");

        // The same in Markdown, where nothing says what a paragraph is but its shape and its place.
        fs::write(
            desk.join("shape.md"),
            "![](shield.png)\\\n\nFigur 1 – Skjoldet\n\nTabell 1. Ringene\n\n| Ring  | Shows |\n|-------|-------|\n| first | stars |\n\nTabell 1 viser ringene.\n",
        )
        .unwrap();
        let read = s.read(&desk.join("shape.md")).unwrap();
        let blocks = &read.sections[0].blocks;
        assert_eq!(kinds(blocks), vec!["figure", "table", "paragraph"], "{blocks:?}");
        let Block::Figure { caption, numbered, .. } = &blocks[0] else { panic!() };
        assert_eq!((document::plain(caption).as_str(), *numbered), ("Skjoldet", true));
        let Block::Table(table) = &blocks[1] else { panic!() };
        assert_eq!((document::plain(&table.caption).as_str(), table.numbered), ("Ringene", true));
        assert_eq!(blocks[2], paragraph(vec![text("Tabell 1 viser ringene.")]));
    }

    // ---- citations that programs made ----

    fn zotero(key: &str) -> Vec<String> {
        vec![format!("http://zotero.org/users/1234567/items/{key}")]
    }

    /// What the documents say of the works they cite: see `cited.py` beside them.
    fn nagy() -> Value {
        json!({
            "type": "book",
            "event-place": "Baltimore",
            "ISBN": "978-0-8018-2200-6",
            "publisher": "Johns Hopkins University Press",
            "publisher-place": "Baltimore",
            "title": "The Best of the Achaeans: Concepts of the Hero in Archaic Greek Poetry",
            "author": [{ "family": "Nagy", "given": "Gregory" }],
            "issued": { "date-parts": [["1979"]] }
        })
    }

    fn west() -> Value {
        json!({
            "type": "article-journal",
            "container-title": "The Journal of Hellenic Studies",
            "DOI": "10.2307/632637",
            "page": "151-172",
            "title": "The Rise of the Greek Epic",
            "volume": "108",
            "author": [{ "family": "West", "given": "M. L." }],
            "issued": { "date-parts": [["1988"]] }
        })
    }

    fn lord() -> Value {
        json!({
            "type": "book",
            "event-place": "Cambridge, Mass.",
            "publisher": "Harvard University Press",
            "title": "The Singer of Tales",
            "author": [{ "family": "Lord", "given": "Albert B." }],
            "issued": { "date-parts": [["1960"]] }
        })
    }

    #[test]
    fn what_zotero_made_is_found_with_all_that_the_file_says_of_it() {
        let Some(s) = setup() else { return };
        // As fields and as reference marks, and as bookmarks with what is
        // cited in the properties of the document.
        for name in ["cited.docx", "cited.odt", "bookmarks.docx", "bookmarks.odt"] {
            let read = s.read(&written(name)).unwrap();
            let found = all_found(&read);
            let shown: Vec<&str> = found.iter().map(|(text, _)| text.as_str()).collect();
            let mut expected = vec![
                "(Nagy 1979, 73)",
                "(see Nagy 1979, chap. 2; West 1988; 1960, 12 and elsewhere)",
                "(Lord, The Singer of Tales, 12)",
                "Nagy, The Best of the Achaeans, 73",
            ];
            if name == "cited.docx" {
                expected.push("(West 1988)");
            }
            assert_eq!(shown, expected, "{name}");
            for (_, found) in &found[..4] {
                assert_eq!((found.by, found.mode, found.left), (By::Zotero, CiteMode::Normal, false), "{name}");
            }
            let nagy_73 = FoundItem {
                uris: zotero("ABCD2345"),
                data: Some(nagy()),
                locator: Some("73".into()),
                ..Default::default()
            };
            let lord_12 = FoundItem {
                uris: zotero("QRST2345"),
                data: Some(lord()),
                locator: Some("12".into()),
                ..Default::default()
            };
            assert_eq!(found[0].1.items, vec![nagy_73.clone()], "{name}");
            // Three works, in a field whose code is cut into several runs.
            assert_eq!(
                found[1].1.items,
                vec![
                    FoundItem {
                        uris: zotero("ABCD2345"),
                        data: Some(nagy()),
                        locator: Some("2".into()),
                        label: Some("chapter".into()),
                        prefix: Some("see".into()),
                        ..Default::default()
                    },
                    FoundItem { uris: zotero("WXYZ6789"), data: Some(west()), ..Default::default() },
                    FoundItem { suffix: Some("and elsewhere".into()), suppress_author: true, ..lord_12.clone() },
                ],
                "{name}"
            );
            assert_eq!(found[2].1.items, vec![lord_12], "{name}");
            assert_eq!(found[3].1.items, vec![nagy_73], "{name}");

            // What stands in italics within a citation is a piece of it, and is in italics.
            let word = read.sections.iter().find(|s| document::plain(&s.heading) == "The word").unwrap();
            let Block::Paragraph { content } = &word.blocks[1] else { panic!("{name}") };
            let pieces: Vec<(&str, Vec<&str>)> = content
                .iter()
                .filter_map(|i| match i {
                    Inline::Text { text, marks } => Some((text.as_str(), marks.keys().map(String::as_str).collect())),
                    _ => None,
                })
                .collect();
            assert_eq!(
                pieces,
                vec![
                    ("Much is written of it ", vec![]),
                    ("(see Nagy 1979, chap. 2; West 1988; 1960, 12 and elsewhere)", vec!["found"]),
                    (". The singer ", vec![]),
                    ("(Lord, ", vec!["found"]),
                    ("The Singer of Tales", vec!["em", "found"]),
                    (", 12)", vec!["found"]),
                    (" is another matter.", vec![]),
                ],
                "{name}"
            );

            // In a note, with what else the note says.
            let Block::Paragraph { content } = &word.blocks[2] else { panic!("{name}") };
            assert_eq!(content[0], text("Not all agree."), "{name}");
            let Inline::Footnote { content: note, .. } = &content[1] else { panic!("{name}") };
            assert_eq!(note.len(), 5, "{name}: {note:?}");
            assert_eq!(note[0], text("See "), "{name}");
            assert_eq!(note[4], text("; but he says otherwise elsewhere."), "{name}");
            assert!(note[1..4].iter().all(|piece| found_of(piece).is_some_and(|f| f.id == found[3].1.id)), "{name}");
            assert_eq!(content[2], text(" And so it stands."), "{name}");

            let made = expected.len();
            assert_eq!((read.counts.found, read.counts.found_made), (made, made), "{name}");
            assert_eq!((read.counts.cited, read.counts.not_found, read.counts.notes), (0, 0, 1), "{name}");
            assert!(
                read.remarks[0].starts_with(&format!(
                    "{made} citations were found that are not yet tied to references of your library, all made by a \
                     program that keeps references."
                )),
                "{name}: {:?}",
                read.remarks
            );
            // The list of the works is text, and is told of where a program made it.
            let works = read.sections.iter().find(|s| document::plain(&s.heading) == "Works").unwrap();
            assert_eq!(works.blocks.len(), 3, "{name}");
            assert!(all_found(&Imported { sections: vec![works.clone()], ..Default::default() }).is_empty());
            let told =
                read.remarks.iter().filter(|r| r.contains("a list of what it cites, made by the program")).count();
            assert_eq!(told, usize::from(name.starts_with("cited")), "{name}: {:?}", read.remarks);
            assert_eq!(read.remarks.len(), 1 + told, "{name}: {:?}", read.remarks);
            let all = all_text(&read);
            assert!(!all.contains([made::BEGIN, made::NUMBERED, made::END]), "{name}: {all}");
        }
    }

    #[test]
    fn what_mendeley_made_is_found_as_well() {
        let Some(s) = setup() else { return };
        let read = s.read(&written("cited.docx")).unwrap();
        let found = all_found(&read);
        let (shown, found) = found.last().unwrap();
        assert_eq!(shown, "(West 1988)");
        assert_eq!(found.by, By::Mendeley);
        assert_eq!(
            found.items,
            vec![FoundItem {
                uris: vec!["http://www.mendeley.com/documents/?uuid=0c6e6bd1-9f3b-4f2a-8b1e-2f4f3c1d9a77".into()],
                data: Some(west()),
                ..Default::default()
            }]
        );
    }

    #[test]
    fn tags_that_the_library_has_and_has_not_in_files_of_text() {
        let Some(s) = setup() else { return };
        // As each kind of file writes them; the library has `nagy1979` and `west1988`.
        let files = [
            (
                "tags.md",
                vec![
                    "[see @nagy1979, chap. 2; @lord1960; -@west1988, 12 and elsewhere]",
                    "[@lord1960, 12]",
                    "@lord1960",
                    "[@nagy1979, 73; @parry1971]",
                ],
            ),
            (
                "tags.tex",
                vec![
                    "\\parencite[see][chap. 2]{nagy1979,lord1960}",
                    "\\cite[12]{lord1960}",
                    "\\citeauthor{lord1960}",
                    "\\cite[73]{nagy1979,parry1971}",
                ],
            ),
            (
                "tags.org",
                vec![
                    "[cite:see @nagy1979 chap. 2; @lord1960; @west1988 p. 12 and elsewhere]",
                    "[cite:@lord1960 p. 12]",
                    "[cite:@nagy1979 p. 73; @parry1971]",
                ],
            ),
        ];
        for (name, expected) in files {
            let read = s.read(&written(name)).unwrap();
            let found = all_found(&read);
            let shown: Vec<&str> = found.iter().map(|(text, _)| text.as_str()).collect();
            assert_eq!(shown, expected, "{name}");
            assert!(found.iter().all(|(_, found)| found.by == By::Key && !found.left), "{name}");
            let keys = |at: usize| -> Vec<&str> { found[at].1.items.iter().filter_map(|i| i.key.as_deref()).collect() };
            assert_eq!(keys(1), vec!["lord1960"], "{name}");
            assert_eq!(found[1].1.items[0].locator.as_deref(), Some("12"), "{name}");
            // The one in the note names a work the library has, and one it has not.
            assert_eq!(keys(found.len() - 1), vec!["nagy1979", "parry1971"], "{name}");
            let word = &read.sections[0];
            let Block::Paragraph { content } = &word.blocks[2] else { panic!("{name}") };
            let Inline::Footnote { content: note, .. } = &content[1] else { panic!("{name}") };
            assert_eq!(note[0], text("See "), "{name}");
            assert_eq!(found_of(&note[1]).map(|f| f.id), Some(found[found.len() - 1].1.id.clone()), "{name}");
            assert_eq!(note[2], text("; but he says otherwise elsewhere."), "{name}");
            // Those of which the library has every work are citations.
            let Block::Paragraph { content } = &word.blocks[0] else { panic!("{name}") };
            let cited: Vec<(&str, Option<&str>, CiteMode)> = content
                .iter()
                .filter_map(|i| match i {
                    Inline::Citation { items, mode } => {
                        Some((items[0].id.as_str(), items[0].locator.as_deref(), *mode))
                    }
                    _ => None,
                })
                .collect();
            assert_eq!(
                cited,
                vec![("r1", Some("73"), CiteMode::Normal), ("r2", Some("3"), CiteMode::Intext)],
                "{name}"
            );
            assert!(found_in(content).is_empty(), "{name}");
            assert_eq!((read.counts.found, read.counts.found_made), (expected.len(), 0), "{name}");
            assert_eq!(read.counts.cited + read.counts.not_found, if name == "tags.md" { 9 } else { 8 }, "{name}");
            assert_eq!(
                read.remarks,
                vec![format!(
                    "{} citations were found that are not yet tied to references of your library. They stand as \
                     the text they were written as, and can be gone through when the map is made, and later.",
                    expected.len()
                )],
                "{name}"
            );
        }
        // Three works, of which the library has two: what is said of each is kept.
        let read = s.read(&written("tags.md")).unwrap();
        assert_eq!(
            all_found(&read)[0].1.items,
            vec![
                FoundItem {
                    locator: Some("2".into()),
                    label: Some("chapter".into()),
                    prefix: Some("see".into()),
                    ..by_key("nagy1979")
                },
                by_key("lord1960"),
                FoundItem {
                    locator: Some("12".into()),
                    suffix: Some("and elsewhere".into()),
                    suppress_author: true,
                    ..by_key("west1988")
                },
            ]
        );
    }

    #[test]
    fn what_endnote_made_is_found_where_pandoc_reads_it() {
        let Some(s) = setup() else { return };
        let read = s.read(&written("endnote.docx")).unwrap();
        let found = all_found(&read);
        assert_eq!(found.len(), 1, "{found:?}");
        let (shown, found) = &found[0];
        assert_eq!(shown, "(see Nagy 1979, 73)");
        assert_eq!((found.by, found.mode), (By::Mendeley, CiteMode::Normal));
        assert_eq!(
            found.items,
            vec![FoundItem {
                data: Some(json!({
                    "type": "book",
                    "title": "The Best of the Achaeans",
                    "author": [{ "family": "Nagy", "given": "Gregory" }],
                    "issued": { "date-parts": [["1979"]] },
                    "publisher": "Johns Hopkins University Press",
                    "publisher-place": "Baltimore"
                })),
                locator: Some("73".into()),
                prefix: Some("see".into()),
                ..Default::default()
            }]
        );
        let word = read.sections.iter().find(|s| document::plain(&s.heading) == "The word").unwrap();
        let Block::Paragraph { content } = &word.blocks[0] else { panic!() };
        assert_eq!(content[0], text("The wrath of Achilles is what the poem is of "));
        assert_eq!(content[2], text(", as is often said."));
        // Where EndNote keeps what it says apart from the field, the text is text, and that is said.
        assert!(all_text(&read).contains("The singer (Lord, The Singer of Tales, 12) is another matter."));
        assert_eq!((read.counts.found, read.counts.found_made), (1, 1));
        assert_eq!((read.counts.cited, read.counts.not_found), (0, 0));
        assert_eq!(read.remarks.len(), 2, "{:?}", read.remarks);
        assert_eq!(
            read.remarks[1],
            "1 citation made by EndNote is brought in as the text it shows, and is not among those that were found: \
             what EndNote says of the works could not be read."
        );
    }

    #[test]
    fn what_pandoc_says_of_works_in_the_form_of_csl() {
        assert_eq!(csl_date("1979"), json!({ "date-parts": [["1979"]] }));
        assert_eq!(csl_date("1979-05-02"), json!({ "date-parts": [["1979", "05", "02"]] }));
        assert_eq!(csl_date("spring 1979"), json!({ "raw": "spring 1979" }));
        let meta: Value = serde_json::from_str(
            r#"{"references":{"t":"MetaList","c":[{"t":"MetaMap","c":{
                "id":{"t":"MetaString","c":"12"},
                "abstract":{"t":"MetaInlines","c":[{"t":"Str","c":"Long."}]},
                "issued":{"t":"MetaString","c":"1979-05"},
                "title":{"t":"MetaInlines","c":[{"t":"Str","c":"The"},{"t":"Space"},{"t":"Emph","c":[{"t":"Str","c":"Best"}]}]},
                "author":{"t":"MetaList","c":[{"t":"MetaMap","c":{"family":{"t":"MetaString","c":"Nagy"}}}]}
            }},{"t":"MetaMap","c":{"title":{"t":"MetaString","c":"Without what it is called by"}}}]}}"#,
        )
        .unwrap();
        assert_eq!(
            told_of(&meta),
            vec![(
                "12".to_owned(),
                json!({ "issued": { "date-parts": [["1979", "05"]] }, "title": "The Best", "author": [{ "family": "Nagy" }] })
            )]
        );
    }

    #[test]
    fn the_same_text_without_anything_of_a_program_has_nothing_found() {
        let Some(s) = setup() else { return };
        let read = s.read(&written("plain.docx")).unwrap();
        assert!(all_found(&read).is_empty());
        assert_eq!((read.counts.found, read.counts.found_made), (0, 0));
        assert!(read.remarks.is_empty(), "{:?}", read.remarks);
        assert!(all_text(&read).contains("is what the poem is of (Nagy 1979, 73), as is often said."));
    }

    #[test]
    fn signs_that_do_not_end_and_signs_in_a_name() {
        use made::{BEGIN, END, NUMBERED};
        let made = made::Made {
            citations: vec![made::Citation { by: By::Zotero, items: vec![FoundItem::default()] }],
            ..Default::default()
        };
        let value: Value = serde_json::from_str(&doc(
            "{}",
            &[
                header(1, &format!("One {BEGIN}0{NUMBERED}(Nagy 1979){END}")),
                para(&format!("Open {BEGIN}0{NUMBERED}(Nagy 1979) to the end")),
                para(&format!("The next, {BEGIN}7{NUMBERED}unknown{END} and {END}closed.")),
            ],
        ))
        .unwrap();
        let read = convert_with(&value, "the file", &Properties::default(), &made, &none, &mut a_picture);
        assert_eq!(read.title, vec![text("One (Nagy 1979)")]);
        let found = all_found(&read);
        assert_eq!(found.len(), 1);
        assert_eq!(found[0].0, "(Nagy 1979) to the end");
        assert_eq!(read.sections[0].blocks[1], paragraph(vec![text("The next, unknown and closed.")]));
    }

    #[test]
    fn a_file_named_from_where_the_work_is_done() {
        let Some(s) = setup() else { return };
        let here = std::env::current_dir().unwrap();
        let source = written("captions.odt");
        let Ok(named) = source.strip_prefix(&here) else { return };
        let read = s.read(named).unwrap();
        assert_eq!(read.counts.figures, 2);
    }

    #[test]
    fn pictures_that_cannot_be_taken_in() {
        let Some(s) = setup() else { return };
        let desk = s.desk();
        fs::write(desk.join("drawing.emf"), b"not read").unwrap();
        let path = desk.join("pictures.md");
        fs::write(
            &path,
            "![Far away](https://example.org/far.png)\n\n![Not there](missing.png)\n\n![From Word](drawing.emf)\n",
        )
        .unwrap();
        let read = s.read(&path).unwrap();
        assert_eq!(read.counts.figures, 0);
        assert_eq!(
            read.remarks,
            vec![
                "The picture “far.png” is left out: it is on the network, and nothing is fetched from there.",
                "The picture “missing.png” is left out: the file was not found where the document says it is.",
                "The picture “drawing.emf” is left out: it is of a kind that is not read (EMF).",
            ]
        );
        // What was said of them is kept.
        assert_eq!(kinds(&read.sections[0].blocks), vec!["paragraph", "paragraph", "paragraph"]);
    }
}
