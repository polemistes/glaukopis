//! OneNote's own files: a section (`.one`), or a notebook, which is a
//! folder of sections with a table of contents (`.onetoc2`) beside them.
//! Each page is a note: its title the name, when it was made, its text with
//! what is bold, in italics, struck out, raised or lowered, its links, its
//! lists (points, numbered points, and the tags with a box as points to
//! tick), its tables, its pictures as figures and its files at its end. The
//! other tags of its paragraphs are the tags of the note. A link to another
//! page read with it is a link between the notes. Handwriting is not read.
//!
//! The files are read by the crate `onenote_parser`, in a process of its
//! own (`isolated.rs`): a file made to do harm must not take the
//! application with it. That process gives what it read as plain values
//! ([`Seen`]), with the pictures and files of the pages written into a
//! folder of the reading's work; the notes are made of those here. A file
//! held in a page is written out and taken into the store, and nothing of
//! it is ever run.

use std::collections::HashMap;
use std::fs;
use std::panic::{AssertUnwindSafe, catch_unwind};
use std::path::{Path, PathBuf};
use std::sync::atomic::AtomicBool;
use std::time::Duration;

use onenote_parser::contents::{
    Content, EmbeddedFile, FileDataStatus, Image, NoteTag, OutlineElement, OutlineItem, RichText,
};
use onenote_parser::page::PageContent;
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

use super::taking::{Holding, Taker};
use super::{Counter, Lost, ReadNote, Reading};
use crate::document::{Block, Cell, Inline, Table};
use crate::error::{Error, IoContext, Result};
use crate::import::document;
use crate::isolated::{self, Ended, Limits};
use crate::tr;

/// The task of the process that reads, by name (`isolated.rs`).
pub(crate) const TASK: &str = "onenote-read";

/// What is asked of the process that reads: the sections, and where the
/// pictures and files of their pages are written; nowhere, for a look.
#[derive(Debug, Serialize, Deserialize)]
struct Job {
    sections: Vec<PathBuf>,
    out: Option<PathBuf>,
}

/// What was read, as plain values.
#[derive(Debug, Default, Serialize, Deserialize)]
struct Seen {
    pages: Vec<Page>,
    /// What could not be read: the file's name, or a page's, and why;
    /// no why, where the reading of it broke off.
    unread: Vec<(String, String)>,
}

#[derive(Debug, Default, Serialize, Deserialize)]
struct Page {
    /// The file of its section, by name.
    section: String,
    /// By which other pages link to it, as OneNote writes it.
    id: String,
    title: String,
    /// When it was made: an ISO date-time.
    made: Option<String>,
    parts: Vec<Part>,
}

/// What stands on a page, in its order.
#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "part", rename_all = "lowercase")]
enum Part {
    /// A paragraph: how deep it stands under others, whether it is a point
    /// of a list, a heading, a point to tick (and ticked), the tags on it
    /// that are no box, and its words.
    Text { level: u32, list: Option<Listed>, heading: bool, tick: Option<bool>, tags: Vec<String>, runs: Vec<Run> },
    /// A picture: what it is called, what it says it shows, and where it
    /// was written; nowhere, for a look, or where the file does not hold it.
    Picture { name: String, alt: String, file: Option<PathBuf> },
    /// A file held in the page, as a picture is.
    File { name: String, file: Option<PathBuf> },
    /// A table: its rows, the cells of each, what stands in each cell.
    Table { rows: Vec<Vec<Vec<Part>>> },
    /// Handwriting or a drawing, which is not read.
    Ink,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
enum Listed {
    Point,
    Numbered,
}

/// Words that look the same throughout.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(default)]
struct Run {
    text: String,
    strong: bool,
    em: bool,
    strike: bool,
    sup: bool,
    sub: bool,
    /// Where they lead, as OneNote wrote it.
    link: Option<String>,
}

impl Seen {
    /// How many pictures and files the pages hold, and how many pages hold handwriting.
    fn tally(&self) -> (usize, usize) {
        fn files(parts: &[Part]) -> (usize, bool) {
            let (mut count, mut ink) = (0, false);
            for part in parts {
                match part {
                    Part::Picture { .. } | Part::File { .. } => count += 1,
                    Part::Ink => ink = true,
                    Part::Table { rows } => {
                        for cell in rows.iter().flatten() {
                            let (c, i) = files(cell);
                            count += c;
                            ink |= i;
                        }
                    }
                    Part::Text { .. } => {}
                }
            }
            (count, ink)
        }
        self.pages
            .iter()
            .map(|p| files(&p.parts))
            .fold((0, 0), |(c, n), (count, ink)| (c + count, n + usize::from(ink)))
    }
}

// ---- in the process that reads ----

/// What the process that reads does (`isolated.rs`): from the file that
/// says what is asked, what was read. How far it has come it tells in lines.
pub(crate) fn task(input: &Path) -> std::result::Result<Vec<u8>, String> {
    let job: Job = serde_json::from_slice(&fs::read(input).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;
    let seen = read_here(&job, &mut |done, total, name| {
        isolated::tell(&json!({ "done": done, "total": total, "name": name }).to_string());
    });
    serde_json::to_vec(&seen).map_err(|e| e.to_string())
}

/// Reads the sections here and now: first each file, then page by page,
/// with the pictures and files written out. A file or a page whose reading
/// breaks off is said, and the rest are read.
fn read_here(job: &Job, told: &mut dyn FnMut(usize, usize, &str)) -> Seen {
    let mut seen = Seen::default();
    let mut sections = Vec::new();
    for path in &job.sections {
        let file = path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
        told(0, 0, &file);
        match catch_unwind(AssertUnwindSafe(|| parsed(path))) {
            Ok(Ok(section)) => sections.push((file, section)),
            Ok(Err(why)) => seen.unread.push((file, why)),
            Err(_) => seen.unread.push((file, String::new())),
        }
    }
    let pages = |section: &onenote_parser::section::Section| -> usize {
        section.page_series().iter().map(|series| series.pages().len()).sum()
    };
    let total: usize = sections.iter().map(|(_, section)| pages(section)).sum();
    let mut files = Files { out: job.out.clone(), written: 0 };
    let mut done = 0;
    for (file, section) in &sections {
        for page in section.page_series().iter().flat_map(|series| series.pages()) {
            let title = page.title_text().unwrap_or("").trim().to_owned();
            told(done, total, &title);
            done += 1;
            match catch_unwind(AssertUnwindSafe(|| page_of(page, file, &title, &mut files))) {
                Ok(page) => seen.pages.push(page),
                Err(_) => seen.unread.push((if title.is_empty() { file.clone() } else { title }, String::new())),
            }
        }
    }
    seen
}

/// A section, read by the crate: the path is handed over as the system has it.
fn parsed(path: &Path) -> std::result::Result<onenote_parser::section::Section, String> {
    let parser = onenote_parser::Parser::new();
    #[cfg(unix)]
    let read = {
        use std::os::unix::ffi::OsStrExt;
        parser.parse_section(typed_path::TypedPath::unix(path.as_os_str().as_bytes()))
    };
    #[cfg(not(unix))]
    let read = {
        let text = path.to_str().ok_or_else(|| path.display().to_string())?;
        parser.parse_section(typed_path::TypedPath::windows(text))
    };
    read.map_err(|e| e.to_string())
}

/// Where the pictures and files of the pages are written: each in a folder
/// of its own, under its own name made safe.
struct Files {
    out: Option<PathBuf>,
    written: usize,
}

impl Files {
    /// Writes what `reader` gives. Nothing for a look, for what holds
    /// nothing, and where it could not be written.
    fn write(&mut self, name: &str, mut reader: Box<dyn std::io::Read>) -> Option<PathBuf> {
        let out = self.out.as_ref()?;
        self.written += 1;
        let dir = out.join(self.written.to_string());
        fs::create_dir_all(&dir).ok()?;
        let path = dir.join(crate::fsutil::safe_file_name(name, "file"));
        let mut file = fs::File::create(&path).ok()?;
        match std::io::copy(&mut reader, &mut file) {
            Ok(bytes) if bytes > 0 => Some(path),
            _ => {
                drop(file);
                let _ = fs::remove_file(&path);
                None
            }
        }
    }
}

/// A name as a file of a page gives it: the last part of a path, without
/// the signs that turn the direction of writing, by which a name can be
/// made to look as if it ended otherwise than it does.
fn plain_name(name: &str) -> String {
    let last = name.rsplit(['/', '\\']).next().unwrap_or(name);
    last.chars()
        .filter(
            |c| !matches!(c, '\u{200e}' | '\u{200f}' | '\u{061c}' | '\u{202a}'..='\u{202e}' | '\u{2066}'..='\u{2069}'),
        )
        .collect::<String>()
        .trim()
        .to_owned()
}

/// When a page was made, as ISO; nothing where the page says no time that can be one.
fn made_of(page: &onenote_parser::page::Page) -> Option<String> {
    let at = time::OffsetDateTime::from(page.created_time());
    if at.year() < 1970 {
        return None;
    }
    at.replace_nanosecond(0).unwrap_or(at).format(&time::format_description::well_known::Rfc3339).ok()
}

fn page_of(page: &onenote_parser::page::Page, section: &str, title: &str, files: &mut Files) -> Page {
    let mut parts = Vec::new();
    for content in page.contents() {
        match content {
            PageContent::Outline(outline) => items(outline.items(), 0, files, &mut parts),
            PageContent::Image(image) => parts.push(picture(image, files)),
            PageContent::EmbeddedFile(file) => parts.push(embedded(file, files)),
            PageContent::Ink(_) => parts.push(Part::Ink),
            // What a later OneNote may put on a page is passed over.
            #[allow(unreachable_patterns)]
            _ => {}
        }
    }
    Page {
        section: section.to_owned(),
        id: page.link_target_id().to_owned(),
        title: title.to_owned(),
        made: made_of(page),
        parts,
    }
}

fn items(list: &[OutlineItem], level: u32, files: &mut Files, parts: &mut Vec<Part>) {
    for item in list {
        match item {
            // A group only sets what is in it one step in.
            OutlineItem::Group(group) => items(group.outlines(), level + 1, files, parts),
            OutlineItem::Element(element) => self::element(element, level, files, parts),
        }
    }
}

fn element(element: &OutlineElement, level: u32, files: &mut Files, parts: &mut Vec<Part>) {
    // The sign of a numbered point holds the place of its number.
    let mut list = element
        .list_contents()
        .first()
        .map(|list| if list.list_format().contains(&'\u{fffd}') { Listed::Numbered } else { Listed::Point });
    for content in element.contents() {
        match content {
            // The sign of the list stands before the first paragraph of the point only.
            Content::RichText(text) => parts.push(text_part(text, level, list.take())),
            Content::Table(table) => {
                let rows = table
                    .contents()
                    .iter()
                    .map(|row| {
                        row.contents()
                            .iter()
                            .map(|cell| {
                                let mut inner = Vec::new();
                                for within in cell.contents() {
                                    self::element(within, 0, files, &mut inner);
                                }
                                inner
                            })
                            .collect()
                    })
                    .collect();
                parts.push(Part::Table { rows });
            }
            Content::Image(image) => parts.push(picture(image, files)),
            Content::EmbeddedFile(file) => parts.push(embedded(file, files)),
            Content::Ink(_) => parts.push(Part::Ink),
            #[allow(unreachable_patterns)]
            _ => {}
        }
    }
    items(element.children(), level + 1, files, parts);
}

fn text_part(text: &RichText, level: u32, list: Option<Listed>) -> Part {
    let look_of = |style: &onenote_parser::contents::ParagraphStyling| Look {
        strong: style.bold(),
        em: style.italic(),
        strike: style.strikethrough(),
        sup: style.superscript(),
        sub: style.subscript(),
        hidden: style.hidden(),
    };
    let mut looks: Vec<Look> = text.text_run_formatting().iter().map(look_of).collect();
    if looks.is_empty() {
        looks.push(look_of(text.paragraph_style()));
    }
    let links: Vec<(u32, u32, String)> =
        text.hyperlinks().iter().map(|link| (link.start(), link.end(), link.target().to_owned())).collect();
    let heading = text.paragraph_style().style_id().is_some_and(is_heading);
    let (tick, tags) = tags_of(text.note_tags());
    Part::Text { level, list, heading, tick, tags, runs: runs_of(text.text(), text.text_run_indices(), &looks, &links) }
}

/// Whether a style of OneNote's is one of its headings: `h1` to `h6`.
fn is_heading(style: &str) -> bool {
    let mut chars = style.chars();
    matches!((chars.next(), chars.next(), chars.next()), (Some('h'), Some('1'..='6'), None))
}

/// What the tags on a paragraph say: whether it has a box to tick, ticked
/// or not, and the names of its other tags.
fn tags_of(tags: &[NoteTag]) -> (Option<bool>, Vec<String>) {
    let mut tick = None;
    let mut names = Vec::new();
    for tag in tags {
        // A tag with a box is told by its sign, which OneNote names so.
        let boxed = tag.definition().is_some_and(|d| format!("{:?}", d.shape()).contains("CheckBox"));
        if boxed {
            tick = Some(tick.unwrap_or(false) || tag.item_status().completed());
        } else if let Some(label) = tag.definition().map(|d| d.label().trim()).filter(|l| !l.is_empty())
            && !names.iter().any(|n| n == label)
        {
            names.push(label.to_owned());
        }
    }
    (tick, names)
}

fn picture(image: &Image, files: &mut Files) -> Part {
    let ending = image
        .extension()
        .map(|e| e.trim_start_matches('.').to_ascii_lowercase())
        .filter(|e| !e.is_empty() && e.len() <= 5 && e.chars().all(|c| c.is_ascii_alphanumeric()))
        .unwrap_or_else(|| "png".to_owned());
    let mut name = image.image_filename().map(plain_name).unwrap_or_default();
    if name.is_empty() {
        name = format!("image.{ending}");
    } else if !name.contains('.') {
        name = format!("{name}.{ending}");
    }
    let file = match (image.data_status(), image.read()) {
        (FileDataStatus::Available, Some(reader)) => files.write(&name, reader),
        _ => None,
    };
    Part::Picture { name, alt: image.alt_text().unwrap_or("").trim().to_owned(), file }
}

fn embedded(file: &EmbeddedFile, files: &mut Files) -> Part {
    let mut name = plain_name(file.filename());
    if name.is_empty() {
        name = "file".to_owned();
    }
    let written = if file.data_status() == FileDataStatus::Available { files.write(&name, file.read()) } else { None };
    Part::File { name, file: written }
}

/// How a run of words looks, as OneNote says it.
#[derive(Debug, Clone, Default, PartialEq)]
struct Look {
    strong: bool,
    em: bool,
    strike: bool,
    sup: bool,
    sub: bool,
    /// Not to be seen: where a link leads is written so before its words.
    hidden: bool,
}

/// The words of a paragraph as runs. OneNote counts in the units of
/// UTF-16: `ends` is where each run ends, the last at the end of the text
/// whatever is said of it; `links` are the stretches that lead somewhere.
/// What is hidden is left out, as are the places objects are held at.
fn runs_of(text: &str, ends: &[u32], looks: &[Look], links: &[(u32, u32, String)]) -> Vec<Run> {
    let units: Vec<u16> = text.encode_utf16().collect();
    let len = units.len();
    let mut runs: Vec<Run> = Vec::new();
    let mut start = 0usize;
    for (i, look) in looks.iter().enumerate() {
        let said = ends.get(i).map_or(len, |&end| end as usize);
        let end = if i + 1 == looks.len() { len } else { said.clamp(start, len) };
        let (from, to) = (start, end);
        start = end;
        if look.hidden || from >= to {
            continue;
        }
        let words: String = String::from_utf16_lossy(&units[from..to]).chars().filter(|&c| c != '\u{fffc}').collect();
        if words.is_empty() {
            continue;
        }
        let link = links
            .iter()
            .find(|(s, e, _)| (from as u64) < u64::from(*e) && (to as u64) > u64::from(*s))
            .map(|l| l.2.clone());
        let run = Run {
            text: words,
            strong: look.strong,
            em: look.em,
            strike: look.strike,
            sup: look.sup,
            sub: look.sub,
            link,
        };
        // Runs that look the same are one.
        match runs.last_mut() {
            Some(last) if Run { text: String::new(), ..last.clone() } == Run { text: String::new(), ..run.clone() } => {
                last.text.push_str(&run.text);
            }
            _ => runs.push(run),
        }
    }
    runs
}

// ---- in the application ----

/// How long the reading of files of so many bytes may take.
fn patience(bytes: u64) -> Duration {
    Duration::from_secs((60 + bytes / (1 << 20)).min(20 * 60))
}

/// Has the sections read in a process of its own, within bounds of time
/// and memory, `told` how far it has come and ended where `stop` is set.
/// Only where no program for such processes was given at all, as in the
/// tests of the core, are they read here.
fn seen(job: &Job, work: &Path, told: &mut dyn FnMut(usize, usize, &str), stop: &AtomicBool) -> Result<Seen> {
    let input = work.join("onenote.json");
    let asked = serde_json::to_vec(job).map_err(|e| Error::invalid(e.to_string()))?;
    fs::write(&input, asked).context(|| tr!("io-writing", path = &input))?;
    let bytes: u64 = job.sections.iter().filter_map(|p| fs::metadata(p).ok()).map(|m| m.len()).sum();
    let limits = Limits::for_file(bytes, patience(bytes));
    let mut lines = |line: &str| {
        if let Ok(said) = serde_json::from_str::<Value>(line) {
            let number = |name: &str| said[name].as_u64().and_then(|n| usize::try_from(n).ok()).unwrap_or(0);
            told(number("done"), number("total"), said["name"].as_str().unwrap_or(""));
        }
    };
    match isolated::run_watched::<Seen>(TASK, &input, limits, &mut lines, stop) {
        None => Ok(read_here(job, told)),
        Some(Ok(seen)) => Ok(seen),
        Some(Err(Ended::Stopped)) => {
            Err(Error::Refused { kind: crate::export::tools::STOPPED, message: tr!("core-notes-stopped") })
        }
        Some(Err(Ended::NotStarted(why))) => {
            tracing::error!(%why, "no process could be started for reading OneNote's files; they are not read");
            Err(Error::invalid(tr!("core-notes-onenote-not-started", message = why.as_str())))
        }
        Some(Err(ended)) => {
            tracing::warn!(%ended, "reading OneNote's files was given up");
            let why = match ended {
                Ended::Time => tr!("core-notes-onenote-time"),
                Ended::Memory => tr!("core-notes-onenote-memory"),
                other => other.to_string(),
            };
            Err(Error::invalid(tr!("core-notes-onenote-given-up", why = why)))
        }
    }
}

/// What is said of a file or a page that could not be read.
fn unreadable(name: &str, why: &str) -> String {
    if why.is_empty() {
        tr!("core-notes-onenote-broke", file = name)
    } else {
        tr!("core-notes-onenote-unreadable", file = name, message = why)
    }
}

/// Where nothing at all was read, what is said of the first thing that could not be.
fn nothing_read(seen: &Seen) -> Option<Error> {
    if !seen.pages.is_empty() {
        return None;
    }
    seen.unread.first().map(|(name, why)| Error::invalid(unreadable(name, why)))
}

/// How many pages the sections hold, how many pictures and files, and what
/// the writer should know before they are read: nothing is taken in.
pub(super) fn look(sections: &[PathBuf], work: &Path) -> Result<(usize, usize, Vec<String>)> {
    fs::create_dir_all(work).context(|| tr!("io-creating", path = work))?;
    let place = tempfile::Builder::new()
        .prefix("notes-look-")
        .tempdir_in(work)
        .context(|| tr!("io-creating-directory-in", path = work))?;
    let job = Job { sections: sections.to_vec(), out: None };
    let seen = seen(&job, place.path(), &mut |_, _, _| {}, &AtomicBool::new(false))?;
    if let Some(error) = nothing_read(&seen) {
        return Err(error);
    }
    let (files, ink) = seen.tally();
    let mut remarks: Vec<String> = seen.unread.iter().map(|(name, why)| unreadable(name, why)).collect();
    if ink > 0 {
        remarks.push(tr!("core-notes-onenote-ink", count = ink));
    }
    Ok((seen.pages.len(), files, remarks))
}

/// Reads the pages of the sections as notes.
pub(super) fn read(reading: &mut Reading, sections: &[PathBuf], count: &mut Counter) -> Result<Vec<ReadNote>> {
    let out = reading.work.join("onenote");
    let job = Job { sections: sections.to_vec(), out: Some(out) };
    let seen = seen(&job, reading.work, &mut |done, total, name| count(done, total.max(done + 1), name), reading.stop)?;
    if let Some(error) = nothing_read(&seen) {
        return Err(error);
    }
    for (name, why) in &seen.unread {
        reading.problems.push(unreadable(name, why));
    }
    let origins: HashMap<String, String> = sections
        .iter()
        .map(|p| (p.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default(), p.display().to_string()))
        .collect();
    Ok(notes_of(reading, seen, &origins))
}

/// The notes of what was read: `origins` says where the file of each section lies.
fn notes_of(reading: &mut Reading, seen: Seen, origins: &HashMap<String, String>) -> Vec<ReadNote> {
    // A page is known to the others by its place in its section.
    let mut counted: HashMap<&str, usize> = HashMap::new();
    let keys: Vec<String> = seen
        .pages
        .iter()
        .map(|page| {
            let n = counted.entry(page.section.as_str()).or_default();
            *n += 1;
            format!("{}#{n}", page.section)
        })
        .collect();
    let by_id: HashMap<String, String> = seen
        .pages
        .iter()
        .zip(&keys)
        .filter(|(page, _)| !page.id.is_empty())
        .map(|(page, key)| (page.id.to_ascii_lowercase(), key.clone()))
        .collect();
    let mut notes = Vec::with_capacity(seen.pages.len());
    for (page, key) in seen.pages.into_iter().zip(keys) {
        let origin = origins.get(&page.section).map_or(page.section.as_str(), String::as_str);
        let mut making = Making {
            taker: &mut reading.taker,
            origin,
            own: &key,
            by_id: &by_id,
            holding: Holding::default(),
            links: Vec::new(),
            tags: Vec::new(),
            lost: Vec::new(),
        };
        let blocks = making.blocks(&page.parts);
        let Making { holding, links, tags, lost, .. } = making;
        let said = if page.title.is_empty() { key.as_str() } else { page.title.as_str() };
        reading.left_out(said, lost);
        notes.push(ReadNote {
            key: key.clone(),
            name: page.title.clone(),
            made: page.made,
            tags,
            source: None,
            blocks,
            held: holding.held,
            attachments: holding.attachments,
            links,
        });
    }
    notes
}

/// A note as it is made of a page.
struct Making<'a, 'b> {
    taker: &'a mut Taker<'b>,
    /// Where the file of the page's section lies.
    origin: &'a str,
    /// The page's own key.
    own: &'a str,
    /// The keys of the pages read, by what OneNote links to them by, in small letters.
    by_id: &'a HashMap<String, String>,
    holding: Holding,
    links: Vec<String>,
    tags: Vec<String>,
    lost: Lost,
}

impl Making<'_, '_> {
    fn blocks(&mut self, parts: &[Part]) -> Vec<Block> {
        let mut out = Vec::new();
        // What stands over the paragraph at hand: how deep, and whether a point of a list.
        let mut over: Vec<(u32, bool)> = Vec::new();
        for part in parts {
            match part {
                Part::Text { level, list, heading, tick, tags, runs } => {
                    for tag in tags {
                        if !self.tags.iter().any(|t| t.eq_ignore_ascii_case(tag)) {
                            self.tags.push(tag.clone());
                        }
                    }
                    while over.last().is_some_and(|(above, _)| above >= level) {
                        over.pop();
                    }
                    let content = self.inlines(runs, *heading);
                    let point = tick.is_some() || list.is_some();
                    if content.is_empty() && !point {
                        continue;
                    }
                    // A point under a point is set in a step; so is a paragraph that goes on under one.
                    let indent = u32::try_from(over.iter().filter(|(_, point)| *point).count()).unwrap_or(u32::MAX);
                    over.push((*level, point));
                    out.push(match (tick, list) {
                        (Some(done), _) => Block::of_kind("todo", content).indented(indent).ticked(*done),
                        (None, Some(Listed::Numbered)) => Block::of_kind("numbered", content).indented(indent),
                        (None, Some(Listed::Point)) => Block::of_kind("item", content).indented(indent),
                        (None, None) => Block::of_kind("text", content).indented(indent),
                    });
                }
                Part::Picture { name, alt, file } => {
                    let Some(path) = file else {
                        self.lost.push((name.clone(), tr!("core-notes-onenote-not-stored")));
                        continue;
                    };
                    match self.taker.written(path, self.origin) {
                        // One that no figure can show stands at the note's end, as a file.
                        Ok(held) => {
                            if let Some(mut picture) = self.holding.picture(&held) {
                                picture.alt.clone_from(alt);
                                out.push(document::figure_of(&picture));
                            }
                        }
                        Err(why) => self.lost.push((name.clone(), why)),
                    }
                }
                Part::File { name, file } => {
                    let Some(path) = file else {
                        self.lost.push((name.clone(), tr!("core-notes-onenote-not-stored")));
                        continue;
                    };
                    match self.taker.written(path, self.origin) {
                        Ok(held) => self.holding.attach(&held),
                        Err(why) => self.lost.push((name.clone(), why)),
                    }
                }
                Part::Table { rows } => {
                    let rows: Vec<Vec<Cell>> = rows
                        .iter()
                        .map(|row| {
                            row.iter().map(|cell| Cell { content: self.blocks(cell), ..Cell::default() }).collect()
                        })
                        .filter(|row: &Vec<Cell>| !row.is_empty())
                        .collect();
                    if !rows.is_empty() {
                        out.push(Block::Table(Table {
                            id: String::new(),
                            caption: Vec::new(),
                            rows,
                            numbered: false,
                            align: None,
                            wrap: None,
                            width: 0,
                        }));
                    }
                }
                Part::Ink => {}
            }
        }
        out
    }

    /// The words of a paragraph: a heading in bold, as a note has no tree.
    fn inlines(&mut self, runs: &[Run], heading: bool) -> Vec<Inline> {
        let mut out = Vec::new();
        for run in runs {
            let mut marks = std::collections::BTreeMap::new();
            for (on, name) in [
                (run.strong || heading, "strong"),
                (run.em, "em"),
                (run.strike, "strike"),
                (run.sup, "sup"),
                (run.sub && !run.sup, "sub"),
            ] {
                if on {
                    marks.insert(name.to_owned(), Value::Bool(true));
                }
            }
            if let Some(target) = &run.link {
                match self.leads(target) {
                    Leads::Out(href) => {
                        marks.insert("link".to_owned(), json!({ "href": href }));
                    }
                    Leads::To(key) => {
                        if key != self.own && !self.links.contains(&key) {
                            self.links.push(key);
                        }
                    }
                    Leads::Nowhere => {}
                }
            }
            // A line broken within a paragraph is written with a sign of its own.
            for (n, line) in run.text.split(['\u{b}', '\n']).enumerate() {
                if n > 0 {
                    out.push(Inline::Break);
                }
                if !line.is_empty() {
                    out.push(Inline::Text { text: line.to_owned(), marks: marks.clone() });
                }
            }
        }
        // A paragraph of nothing but room is none.
        if out.iter().all(|i| match i {
            Inline::Text { text, .. } => text.trim().is_empty(),
            _ => true,
        }) {
            out.clear();
        }
        out
    }

    /// Where a link of OneNote's leads: to a page of the web or a letter,
    /// which stays a link; to a page read with it, which is a link between
    /// the notes; or to anything else (a file, a program, a page not read),
    /// of which only the words are kept.
    fn leads(&self, target: &str) -> Leads {
        let target = target.trim();
        let lower = target.to_ascii_lowercase();
        if ["http://", "https://", "mailto:"].iter().any(|scheme| lower.starts_with(scheme)) {
            return Leads::Out(target.to_owned());
        }
        if lower.starts_with("onenote:")
            && let Some(at) = lower.find("page-id=")
        {
            let id = lower[at + "page-id=".len()..].split('&').next().unwrap_or("");
            if let Some(key) = self.by_id.get(id) {
                return Leads::To(key.clone());
            }
        }
        Leads::Nowhere
    }
}

enum Leads {
    Out(String),
    To(String),
    Nowhere,
}

#[cfg(test)]
mod tests {
    use std::sync::Mutex;

    use super::*;
    use crate::library::Library;

    fn look(strong: bool, hidden: bool) -> Look {
        Look { strong, hidden, ..Look::default() }
    }

    fn text(level: u32, list: Option<Listed>, tick: Option<bool>, words: &str) -> Part {
        Part::Text {
            level,
            list,
            heading: false,
            tick,
            tags: Vec::new(),
            runs: vec![Run { text: words.to_owned(), ..Run::default() }],
        }
    }

    #[test]
    fn the_runs_of_a_paragraph_are_counted_as_onenote_counts_them() {
        // The last run ends at the end of the text, whatever is said of it; 𝄞 is two units.
        let runs = runs_of("a𝄞bold rest", &[7], &[look(true, false), look(false, false)], &[]);
        assert_eq!(runs.len(), 2);
        assert_eq!((runs[0].text.as_str(), runs[0].strong), ("a𝄞bold", true));
        assert_eq!((runs[1].text.as_str(), runs[1].strong), (" rest", false));
        // No ends at all: one look for the whole.
        let whole = runs_of("all of it", &[], &[look(true, false)], &[]);
        assert_eq!((whole[0].text.as_str(), whole[0].strong), ("all of it", true));
        // Runs that look the same are one; an end beyond the text does no harm.
        let same = runs_of("one two", &[4, 99], &[look(false, false), look(false, false), look(false, false)], &[]);
        assert_eq!(same.iter().map(|r| r.text.as_str()).collect::<Vec<_>>(), ["one two"]);
    }

    #[test]
    fn what_is_hidden_is_left_out_and_a_link_is_on_its_words() {
        let marker = "\u{fddf}HYPERLINK \"https://example.org/\"";
        let text = format!("See {marker}the page now");
        let hidden_from = 4u32;
        let hidden_to = hidden_from + u32::try_from(marker.encode_utf16().count()).unwrap();
        let link_to = hidden_to + 8;
        let runs = runs_of(
            &text,
            &[hidden_from, hidden_to, link_to],
            &[look(false, false), look(false, true), look(false, false), look(false, false)],
            &[(hidden_to, link_to, "https://example.org/".into())],
        );
        let said: Vec<(&str, Option<&str>)> = runs.iter().map(|r| (r.text.as_str(), r.link.as_deref())).collect();
        assert_eq!(said, [("See ", None), ("the page", Some("https://example.org/")), (" now", None)]);
    }

    #[test]
    fn a_name_is_its_last_part_without_the_signs_that_turn_the_writing() {
        assert_eq!(plain_name("C:\\Users\\a\\Pictures\\owl.png"), "owl.png");
        assert_eq!(plain_name("../../etc/passwd"), "passwd");
        // With the sign U+202E after "invoice", the name looks as if it ended in "ath.pdf".
        assert_eq!(plain_name("invoice\u{202e}fdp.hta"), "invoicefdp.hta");
        assert!(is_heading("h2") && !is_heading("p") && !is_heading("h10") && !is_heading("header"));
    }

    struct Setup {
        tmp: tempfile::TempDir,
        library: Mutex<Library>,
    }

    impl Setup {
        fn new() -> Self {
            let tmp = tempfile::tempdir().unwrap();
            let library = Mutex::new(Library::open_at(&tmp.path().join("library")).unwrap());
            Setup { tmp, library }
        }

        /// The notes of what was read, and what was said of what could not be.
        fn notes(&self, seen: Seen) -> (Vec<ReadNote>, Vec<String>) {
            let tools = crate::export::tools::Tools::default();
            let stop = AtomicBool::new(false);
            let dir = self.library.lock().unwrap().dir().to_owned();
            let mut reading = Reading {
                tools: &tools,
                work: self.tmp.path(),
                stop: &stop,
                taker: Taker::new(&self.library, dir),
                problems: Vec::new(),
                reader: None,
            };
            let origins = HashMap::from([("Owls.one".to_owned(), "/notes/Owls.one".to_owned())]);
            let notes = notes_of(&mut reading, seen, &origins);
            (notes, reading.problems)
        }

        /// A file as the process that reads writes one out.
        fn written(&self, n: usize, name: &str, content: &[u8]) -> PathBuf {
            let dir = self.tmp.path().join("onenote").join(n.to_string());
            fs::create_dir_all(&dir).unwrap();
            let path = dir.join(name);
            fs::write(&path, content).unwrap();
            path
        }
    }

    fn png() -> Vec<u8> {
        let picture = image::DynamicImage::ImageRgb8(image::RgbImage::from_pixel(4, 3, image::Rgb([9, 90, 200])));
        let mut out = std::io::Cursor::new(Vec::new());
        picture.write_to(&mut out, image::ImageFormat::Png).unwrap();
        out.into_inner()
    }

    fn kinds(note: &ReadNote) -> Vec<(String, u32, bool, String)> {
        note.blocks
            .iter()
            .filter_map(|b| match b {
                Block::Paragraph { name, indent, done, content, .. } => {
                    Some((name.clone(), *indent, *done, crate::document::plain(content)))
                }
                _ => None,
            })
            .collect()
    }

    #[test]
    fn a_page_is_a_note_with_its_lists_its_boxes_and_its_tags() {
        let s = Setup::new();
        let page = Page {
            section: "Owls.one".into(),
            id: "{AA}".into(),
            title: "Plans".into(),
            made: Some("2024-05-06T07:08:09Z".into()),
            parts: vec![
                Part::Text {
                    level: 0,
                    list: None,
                    heading: true,
                    tick: None,
                    tags: vec!["Important".into()],
                    runs: vec![Run { text: "A heading".into(), ..Run::default() }],
                },
                text(0, Some(Listed::Point), None, "a point"),
                text(1, Some(Listed::Point), None, "a point under it"),
                text(1, None, None, "and what goes on under it"),
                text(0, Some(Listed::Numbered), None, "numbered"),
                text(0, None, Some(true), "done"),
                text(0, None, Some(false), "to do"),
                text(0, None, None, "   "),
                Part::Text {
                    level: 0,
                    list: None,
                    heading: false,
                    tick: None,
                    tags: vec!["important".into(), "Question".into()],
                    runs: vec![Run { text: "one line\u{b}another".into(), em: true, ..Run::default() }],
                },
                Part::Ink,
            ],
        };
        let (notes, problems) = s.notes(Seen { pages: vec![page], unread: Vec::new() });
        assert!(problems.is_empty(), "{problems:?}");
        let note = &notes[0];
        assert_eq!((note.key.as_str(), note.name.as_str()), ("Owls.one#1", "Plans"));
        assert_eq!(note.made.as_deref(), Some("2024-05-06T07:08:09Z"));
        assert_eq!(note.tags, ["Important", "Question"]);
        assert_eq!(
            kinds(note),
            [
                ("text".into(), 0, false, "A heading".into()),
                ("item".into(), 0, false, "a point".into()),
                ("item".into(), 1, false, "a point under it".into()),
                ("text".into(), 1, false, "and what goes on under it".into()),
                ("numbered".into(), 0, false, "numbered".into()),
                ("todo".into(), 0, true, "done".into()),
                ("todo".into(), 0, false, "to do".into()),
                ("text".into(), 0, false, "one line another".into()),
            ]
        );
        // The heading is in bold; the line broken is broken.
        let Block::Paragraph { content, .. } = &note.blocks[0] else { panic!() };
        assert!(matches!(&content[0], Inline::Text { marks, .. } if marks.contains_key("strong")));
        let Block::Paragraph { content, .. } = note.blocks.last().unwrap() else { panic!() };
        assert!(matches!(content[1], Inline::Break));
        assert!(matches!(&content[0], Inline::Text { marks, .. } if marks.contains_key("em")));
    }

    #[test]
    fn its_pictures_are_figures_its_files_stand_at_its_end_and_nothing_is_listed_in_the_library() {
        let s = Setup::new();
        let picture = s.written(1, "owl.png", &png());
        let script = s.written(2, "test.bat", b"@echo off\r\n");
        let page = Page {
            section: "Owls.one".into(),
            title: "With files".into(),
            parts: vec![
                text(0, None, None, "Before."),
                Part::Picture { name: "owl.png".into(), alt: "An owl".into(), file: Some(picture) },
                Part::File { name: "test.bat".into(), file: Some(script) },
                Part::Picture { name: "gone.png".into(), alt: String::new(), file: None },
                Part::Table {
                    rows: vec![vec![vec![text(0, None, None, "a cell")], vec![text(0, None, None, "another")]]],
                },
            ],
            ..Page::default()
        };
        let (notes, problems) = s.notes(Seen { pages: vec![page], unread: Vec::new() });
        let note = &notes[0];
        let figure = note.blocks.iter().find_map(|b| match b {
            Block::Figure { file, alt, .. } => Some((file.clone(), alt.clone())),
            _ => None,
        });
        let (shown, alt) = figure.expect("the picture is a figure");
        assert_eq!(alt, "An owl");
        assert!(note.held.iter().any(|h| h.shown.as_ref().is_some_and(|f| f.hash == shown)));
        // The file that is no picture stands at the note's end, held, under its own name.
        assert_eq!(note.attachments.len(), 1);
        let held = note.held.iter().find(|h| h.file.hash == note.attachments[0]).unwrap();
        assert_eq!(held.file.name, "test.bat");
        assert_eq!(held.file.origin.as_deref(), Some("/notes/Owls.one"));
        // The table has its cells.
        let table = note.blocks.iter().find_map(|b| match b {
            Block::Table(table) => Some(table),
            _ => None,
        });
        assert_eq!(table.expect("the table").rows[0].len(), 2);
        // What the file did not hold is said, and nothing is among the library's files.
        assert_eq!(problems.len(), 1, "{problems:?}");
        assert!(problems[0].contains("gone.png"), "{problems:?}");
        assert_eq!(s.library.lock().unwrap().file_views().len(), 0);
    }

    #[test]
    fn a_link_stays_a_link_only_to_the_web_and_a_link_to_a_page_read_is_a_link_between_notes() {
        let s = Setup::new();
        let linked =
            |words: &str, target: &str| Run { text: words.into(), link: Some(target.into()), ..Run::default() };
        let first = Page {
            section: "Owls.one".into(),
            id: "{11111111-AAAA-4AAA-8AAA-111111111111}".into(),
            title: "First".into(),
            parts: vec![Part::Text {
                level: 0,
                list: None,
                heading: false,
                tick: None,
                tags: Vec::new(),
                runs: vec![
                    linked("the web", "https://example.org/a"),
                    linked(
                        "the other",
                        "onenote:Owls.one#Second&section-id={S}&page-id={22222222-bbbb-4bbb-8bbb-222222222222}&end",
                    ),
                    linked("a program", "file:///C:/Windows/System32/calc.exe"),
                    linked("itself", "onenote:#First&page-id={11111111-AAAA-4AAA-8AAA-111111111111}&end"),
                ],
            }],
            ..Page::default()
        };
        let second = Page {
            section: "Owls.one".into(),
            id: "{22222222-BBBB-4BBB-8BBB-222222222222}".into(),
            title: "Second".into(),
            parts: vec![text(0, None, None, "Here.")],
            ..Page::default()
        };
        let (notes, _) = s.notes(Seen { pages: vec![first, second], unread: Vec::new() });
        assert_eq!(notes[0].links, ["Owls.one#2"]);
        let Block::Paragraph { content, .. } = &notes[0].blocks[0] else { panic!() };
        let hrefs: Vec<Option<String>> = content
            .iter()
            .map(|i| match i {
                Inline::Text { marks, .. } => marks.get("link").and_then(|l| l["href"].as_str()).map(str::to_owned),
                _ => None,
            })
            .collect();
        assert_eq!(hrefs, [Some("https://example.org/a".to_owned()), None, None, None]);
        assert_eq!(crate::document::plain(content), "the webthe othera programitself");
    }

    #[test]
    fn what_is_asked_and_what_is_read_pass_between_the_processes_as_they_are() {
        let seen = Seen {
            pages: vec![Page {
                section: "Owls.one".into(),
                id: "{AA}".into(),
                title: "T".into(),
                made: None,
                parts: vec![
                    text(2, Some(Listed::Numbered), Some(true), "x"),
                    Part::Table { rows: vec![vec![vec![Part::Ink]]] },
                    Part::File { name: "a.bin".into(), file: Some(PathBuf::from("/w/1/a.bin")) },
                ],
            }],
            unread: vec![("Bad.one".into(), String::new())],
        };
        let back: Seen = serde_json::from_slice(&serde_json::to_vec(&seen).unwrap()).unwrap();
        assert_eq!(serde_json::to_value(&back).unwrap(), serde_json::to_value(&seen).unwrap());
        assert_eq!(back.tally(), (1, 1));
    }

    /// A section of OneNote's own, where one is at hand: named by
    /// `GLAUKOPIS_ONENOTE_SAMPLE`. None comes with the code (those that can
    /// be had are not ours to hand on), so the test is passed over without.
    #[test]
    fn a_section_of_onenote_is_read_where_one_is_at_hand() {
        let Some(sample) = std::env::var_os("GLAUKOPIS_ONENOTE_SAMPLE").map(PathBuf::from) else {
            crate::testing::passed_over("no section of OneNote is named by GLAUKOPIS_ONENOTE_SAMPLE");
            return;
        };
        let s = Setup::new();
        let (notes, files, remarks) = super::look(std::slice::from_ref(&sample), &s.tmp.path().join("work")).unwrap();
        assert!(notes > 0, "{remarks:?}");
        let out = s.tmp.path().join("onenote");
        let seen = read_here(&Job { sections: vec![sample.clone()], out: Some(out) }, &mut |_, _, _| {});
        assert!(seen.unread.is_empty(), "{:?}", seen.unread);
        assert_eq!(seen.pages.len(), notes);
        assert_eq!(seen.tally().0, files);
        let name = sample.file_name().unwrap().to_string_lossy().into_owned();
        let origins = HashMap::from([(name.clone(), sample.display().to_string())]);
        let tools = crate::export::tools::Tools::default();
        let stop = AtomicBool::new(false);
        let dir = s.library.lock().unwrap().dir().to_owned();
        let mut reading = Reading {
            tools: &tools,
            work: s.tmp.path(),
            stop: &stop,
            taker: Taker::new(&s.library, dir),
            problems: Vec::new(),
            reader: None,
        };
        let made = notes_of(&mut reading, seen, &origins);
        assert_eq!(made.len(), notes);
        assert_eq!(made[0].key, format!("{name}#1"));
        assert_eq!(made.iter().map(|n| n.held.len()).sum::<usize>(), files, "{:?}", reading.problems);
        assert_eq!(s.library.lock().unwrap().file_views().len(), 0);
    }
}
