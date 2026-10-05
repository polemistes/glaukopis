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
//!
//! Pandoc is run in `pandoc.rs`; what it gives is turned into the shapes of
//! the application in `convert.rs`, and what is said after a citation read in
//! `locating.rs`. The pictures are found in `pictures.rs`; text without marks
//! is read in `plain.rs`, without Pandoc.

mod captions;
mod cited;
mod convert;
mod lifting;
mod locating;
mod made;
mod pandoc;
mod pictures;
mod plain;
#[cfg(test)]
mod tests;

use convert::convert_with;
pub use convert::count_words;
use pandoc::{pandoc, stopped};
use pictures::{kind_of_name, name_of, picture_bytes};
use plain::{decode, plain};

use std::collections::{BTreeMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
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
            // A line break in the text stays a break, as in a text file: what
            // is written in Markdown by hand is seldom reflowed, and what is
            // reflowed loses nothing by keeping its lines.
            Format::Markdown => "markdown+hard_line_breaks",
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

/// Turns what Pandoc has read into a document in parts. `stem` is what the
/// file is called, without its ending: the title where the document has none.
pub fn convert(doc: &Value, stem: &str, properties: &Properties, keys: &Keys, take_in: &mut TakeIn) -> Imported {
    convert_with(doc, stem, properties, &made::Made::default(), keys, take_in)
}
