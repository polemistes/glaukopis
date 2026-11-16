//! Notes brought into the notebook from other programs (record 0105): what
//! their exports hold, looked at first, and then read note by note.
//!
//! What is read, and how it is told apart:
//!
//! - **A folder of Markdown or text** (`markdown.rs`): every `.md`,
//!   `.markdown` and `.txt` under it is a note, and a TextBundle (Bear) is
//!   one. Which program wrote it is told by what is there: `.obsidian`
//!   (Obsidian), a TextBundle (Bear), `_resources` (Joplin), names with the
//!   long number of Notion after them (Notion). What a note says of itself
//!   before its text is read by `front.rs`, its tags in the text by
//!   `tags.rs`; the text is read by Pandoc, as a document is.
//! - **Evernote's export** (`evernote.rs`): a file `.enex`, or a folder of
//!   them.
//! - **Google Keep's export** (`keep.rs`): Takeout's folder `Keep`, a file
//!   `.json` for each note.
//! - **OneNote**'s own files are not read: `look` says what can be done.
//!
//! Every picture and file of what is read is taken into the store as the
//! notebook's (`taking.rs`), out of the library's lists. Read and stopped,
//! or never made into notes, they are held by no note, and the sweep of the
//! notebook at the next start takes them out of the store again.

mod evernote;
mod front;
mod keep;
mod markdown;
mod tags;
mod taking;
#[cfg(test)]
mod tests;

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::sync::atomic::{AtomicBool, Ordering};

use serde::Serialize;
use serde_json::{Value, json};

use crate::document::Block;
use crate::error::{Error, IoContext, Result};
use crate::export::Tools;
use crate::export::tools;
use crate::library::Library;
use crate::tr;

pub use taking::HeldFile;

/// Which program's notes a folder or a file holds.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Kind {
    Markdown,
    Obsidian,
    Joplin,
    Notion,
    Bear,
    Evernote,
    Keep,
    Onenote,
}

/// What a folder or a file of notes holds, looked at before anything is read.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Look {
    pub kind: Kind,
    /// What it is called: the folder's name, or the file's without its ending.
    pub name: String,
    /// How many notes it holds.
    pub notes: usize,
    /// How many pictures and other files lie with them.
    pub attachments: usize,
    /// What the writer should know before reading it: each a line.
    pub remarks: Vec<String>,
}

/// The page a note was clipped from.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Source {
    pub url: String,
    pub title: String,
}

/// A note as it was read from another program.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReadNote {
    /// By which the other notes read with it link to it: its path within
    /// what is read, or its name in the file.
    pub key: String,
    pub name: String,
    /// When it was made, where it says: an ISO date-time.
    pub made: Option<String>,
    pub tags: Vec<String>,
    /// The page it was clipped from, where it says.
    pub source: Option<Source>,
    /// Its text. A figure in it names a picture by its hash, taken into the
    /// store as the notebook's.
    pub blocks: Vec<Block>,
    /// Every file taken into the store for it: the pictures of its text as
    /// they are shown, and its other files.
    pub held: Vec<HeldFile>,
    /// Among those, by their hashes, the files that are no picture of the
    /// text: they stand at the note's end.
    pub attachments: Vec<String>,
    /// The keys of the notes it links to.
    pub links: Vec<String>,
}

/// The notes read, and what could not be: each said in a line.
#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReadNotes {
    pub notes: Vec<ReadNote>,
    pub problems: Vec<String>,
}

/// What tells how far a reading has come: how many notes are done, of how
/// many, and the name of the one at hand.
pub type Counter<'a> = dyn FnMut(usize, usize, &str) + 'a;

/// What is there to be read, told from what lies there.
enum There {
    Folder(markdown::Found),
    Evernote(Vec<PathBuf>),
    Keep(keep::Found),
    OneNote,
}

/// The endings of OneNote's own files.
const ONENOTE: [&str; 2] = ["one", "onetoc2"];

fn ending_of(path: &Path) -> String {
    path.extension().map(|e| e.to_string_lossy().to_ascii_lowercase()).unwrap_or_default()
}

fn name_of(path: &Path) -> String {
    let named = if path.is_dir() { path.file_name() } else { path.file_stem() };
    named.map(|n| n.to_string_lossy().into_owned()).unwrap_or_default()
}

/// Tells which program's notes lie at `path`, by what is there, without
/// reading a file whole.
fn tell(path: &Path) -> Result<There> {
    let meta = fs::metadata(path).context(|| tr!("io-reading", path = path))?;
    let name = path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
    if meta.is_file() {
        let ending = ending_of(path);
        return match ending.as_str() {
            _ if markdown::is_note(path) => Ok(There::Folder(markdown::single(path))),
            "enex" => Ok(There::Evernote(vec![path.to_owned()])),
            "json" if keep::is_note(path) => Ok(There::Keep(keep::single(path))),
            _ if ONENOTE.contains(&ending.as_str()) => Ok(There::OneNote),
            _ => Err(Error::invalid(tr!("core-notes-nothing-found", name = name))),
        };
    }
    // Takeout's folder, with Keep's folder in it.
    if let Some(found) = keep::found(path) {
        return Ok(There::Keep(found));
    }
    let found = markdown::found(path);
    if !found.notes.is_empty() {
        return Ok(There::Folder(found));
    }
    if !found.enex.is_empty() {
        return Ok(There::Evernote(found.enex));
    }
    if found.onenote {
        return Ok(There::OneNote);
    }
    Err(Error::invalid(tr!("core-notes-nothing-found", name = name)))
}

/// Looks at a folder or a file of another program's notes, without taking
/// anything in and without Pandoc: which program's it is, how many notes
/// and files it holds, and what the writer should know first. Anything that
/// holds no notes Glaukopis reads is an error that says what was looked for.
pub fn look(path: &Path, tools: &Tools) -> Result<Look> {
    let name = name_of(path);
    let pandoc = || tools.pandoc().err().map(|e| tr!("core-notes-without-pandoc", message = e.to_string()));
    Ok(match tell(path)? {
        There::Folder(found) => {
            let mut remarks = Vec::new();
            if found.notes.iter().any(|n| n.markdown())
                && let Some(remark) = pandoc()
            {
                remarks.push(remark);
            }
            Look { kind: found.kind, name, notes: found.notes.len(), attachments: found.files, remarks }
        }
        There::Evernote(files) => {
            let (mut notes, mut attachments) = (0, 0);
            for file in &files {
                let (n, a) = evernote::tally(file)?;
                notes += n;
                attachments += a;
            }
            let mut remarks = vec![tr!("core-notes-evernote-links")];
            remarks.extend(pandoc());
            Look { kind: Kind::Evernote, name, notes, attachments, remarks }
        }
        There::Keep(found) => {
            Look { kind: Kind::Keep, name, notes: found.notes.len(), attachments: found.files, remarks: Vec::new() }
        }
        There::OneNote => {
            Look { kind: Kind::Onenote, name, notes: 0, attachments: 0, remarks: vec![tr!("core-notes-onenote")] }
        }
    })
}

/// Reads the notes at `path`, note by note, telling `count` how far it has
/// come and looking at `stop` between notes. Their pictures and files are
/// taken into the store as the notebook's while it reads. A note that
/// cannot be read is said in the problems, and the rest are read; stopped,
/// it fails with the kind `stopped`. `work` is where what is made on the
/// way is put, in a directory of its own that is gone afterwards.
pub fn read(
    path: &Path,
    tools: &Tools,
    library: &Mutex<Library>,
    work: &Path,
    count: &mut Counter,
    stop: &AtomicBool,
) -> Result<ReadNotes> {
    let there = tell(path)?;
    fs::create_dir_all(work).context(|| tr!("io-creating", path = work))?;
    let place = tempfile::Builder::new()
        .prefix("notes-")
        .tempdir_in(work)
        .context(|| tr!("io-creating-directory-in", path = work))?;
    let dir = library.lock().unwrap_or_else(std::sync::PoisonError::into_inner).dir().to_owned();
    let mut reading = Reading {
        tools,
        work: place.path(),
        stop,
        taker: taking::Taker::new(library, dir),
        problems: Vec::new(),
        reader: None,
    };
    let notes = match there {
        There::Folder(found) => markdown::read(&mut reading, found, count)?,
        There::Evernote(files) => evernote::read(&mut reading, &files, count)?,
        There::Keep(found) => keep::read(&mut reading, found, count)?,
        There::OneNote => return Err(Error::invalid(tr!("core-notes-onenote"))),
    };
    reading.stopped()?;
    let total = notes.len();
    count(total, total, "");
    Ok(ReadNotes { notes, problems: reading.problems })
}

/// What a reading needs as it goes.
struct Reading<'a> {
    tools: &'a Tools,
    /// A directory of this reading's own, gone afterwards.
    work: &'a Path,
    stop: &'a AtomicBool,
    taker: taking::Taker<'a>,
    problems: Vec<String>,
    /// How Pandoc is asked to read Markdown, once it has been asked what it reads.
    reader: Option<String>,
}

impl Reading<'_> {
    /// An error of the kind `stopped`, where the reading was asked to stop.
    fn stopped(&self) -> Result<()> {
        if self.stop.load(Ordering::Relaxed) {
            return Err(Error::Refused { kind: tools::STOPPED, message: tr!("core-notes-stopped") });
        }
        Ok(())
    }

    /// How Pandoc reads a note in Markdown: with lines kept as they stand,
    /// `[[links]]` with the words after the bar, points to tick and
    /// `==marked==` words, and without citations (`@name` is a name in a
    /// note), the lines before the text (read here) or raw TeX, as far as
    /// the Pandoc that is installed knows each of these.
    fn markdown_reader(&mut self) -> Result<String> {
        if let Some(reader) = &self.reader {
            return Ok(reader.clone());
        }
        let program = &self.tools.pandoc()?.path;
        let known = tools::command(program)
            .arg("--list-extensions=markdown")
            .stdin(std::process::Stdio::null())
            .output()
            .map(|o| String::from_utf8_lossy(&o.stdout).into_owned())
            .unwrap_or_default();
        let knows = |name: &str| known.lines().any(|l| l.get(1..) == Some(name));
        let mut reader = String::from("markdown");
        for (sign, name) in [
            ('+', "hard_line_breaks"),
            ('+', "wikilinks_title_after_pipe"),
            ('+', "task_lists"),
            ('+', "mark"),
            ('-', "citations"),
            ('-', "yaml_metadata_block"),
            ('-', "raw_tex"),
        ] {
            // Markdown's line breaks are kept whatever the list says.
            if knows(name) || name == "hard_line_breaks" {
                reader.push(sign);
                reader.push_str(name);
            }
        }
        self.reader = Some(reader.clone());
        Ok(reader)
    }

    /// Says in the problems what could not be read of the note `name`.
    fn unreadable(&mut self, name: &str, error: &Error) {
        tracing::warn!(%error, name, "a note brought in could not be read");
        self.problems.push(tr!("core-notes-unreadable", name = name, message = error.to_string()));
    }

    /// Says in the problems the pictures of the note `name` that were left out.
    fn left_out(&mut self, name: &str, lost: Vec<(String, String)>) {
        for (picture, why) in lost {
            self.problems.push(tr!("core-notes-picture-left-out", note = name, name = picture, why = why));
        }
    }
}

/// What was left out of a note, each by its name and why.
type Lost = Vec<(String, String)>;

/// How Pandoc is run for a note.
#[derive(Clone, Copy)]
struct Pandoc<'a> {
    tools: &'a Tools,
    work: &'a Path,
    stop: &'a AtomicBool,
}

impl Pandoc<'_> {
    /// Reads a text by Pandoc as `reader` into one run of blocks: written
    /// to a file of the work first. `edit` changes what Pandoc made before
    /// it is read, and `take_in` takes in a picture by what the text calls
    /// it. Gives the blocks and the pictures left out, each with why; not
    /// those that were left out of the text for being files that stand at
    /// the note's end, of which nothing is said.
    fn read(
        self,
        text: &str,
        reader: &str,
        kind: &str,
        edit: &mut dyn FnMut(&mut Value),
        take_in: &mut crate::import::document::TakeIn,
    ) -> Result<(Vec<Block>, Lost)> {
        let file = self.work.join(if reader == "html" { "note.html" } else { "note.md" });
        fs::write(&file, text).context(|| tr!("io-writing", path = &file))?;
        let mut value = crate::import::document::pandoc_json(self.tools, reader, &file, kind, self.work, self.stop)?;
        edit(&mut value);
        let (blocks, lost) = crate::import::document::note_blocks(&value, take_in);
        Ok((blocks, lost.into_iter().filter(|(_, why)| !why.is_empty()).collect()))
    }
}

impl<'a> Reading<'a> {
    fn pandoc_run(&self) -> Pandoc<'a> {
        Pandoc { tools: self.tools, work: self.work, stop: self.stop }
    }
}

/// The name a picture held in an address of data is taken in by: of the
/// kind the address says.
fn data_name(named: &str) -> String {
    let kind = named.trim().strip_prefix("data:").and_then(|r| r.split([';', ',']).next()).unwrap_or("");
    let ending = kind.strip_prefix("image/").map(|s| s.split('+').next().unwrap_or(s)).unwrap_or("png");
    let ending = if ending.is_empty() || !ending.chars().all(|c| c.is_ascii_alphanumeric()) { "png" } else { ending };
    format!("image.{ending}")
}

/// A date and a time as a note says it, as ISO: `2026-11-15`,
/// `2026-11-15T14:03`, `2026-11-15 14:03:22Z` (as Joplin writes it),
/// `2026-11-15T14:03:22.123+01:00`. Nothing where it is none of these.
fn iso(said: &str) -> Option<String> {
    let said = said.trim();
    let digits = |s: &str| !s.is_empty() && s.bytes().all(|b| b.is_ascii_digit());
    let date = said.get(..10)?;
    let parts: Vec<&str> = date.split('-').collect();
    if parts.len() != 3 || parts[0].len() != 4 || parts[1].len() != 2 || parts[2].len() != 2 {
        return None;
    }
    if !parts.iter().all(|p| digits(p)) {
        return None;
    }
    let rest = &said[10..];
    if rest.is_empty() {
        return Some(date.to_owned());
    }
    let rest = rest.strip_prefix(['T', 't', ' '])?.trim_start();
    // The time: hours and minutes at least, then what may follow them.
    let (clock, zone) = match rest.find(['Z', 'z', '+', '-']) {
        Some(at) => (&rest[..at], &rest[at..]),
        None => (rest, ""),
    };
    let clock = clock.trim();
    let (whole, fraction) = clock.split_once('.').unwrap_or((clock, ""));
    let pieces: Vec<&str> = whole.split(':').collect();
    if !(2..=3).contains(&pieces.len()) || !pieces.iter().all(|p| p.len() == 2 && digits(p)) {
        return None;
    }
    if !fraction.is_empty() && !digits(fraction) {
        return None;
    }
    let zone = zone.trim();
    let zone = match zone {
        "" => String::new(),
        "Z" | "z" => "Z".to_owned(),
        _ => {
            let (sign, offset) = zone.split_at(1);
            let offset = offset.replace(':', "");
            if offset.len() != 4 || !digits(&offset) {
                return None;
            }
            format!("{sign}{}:{}", &offset[..2], &offset[2..])
        }
    };
    let fraction = if fraction.is_empty() { String::new() } else { format!(".{fraction}") };
    Some(format!("{date}T{whole}{fraction}{zone}"))
}

/// A time given in microseconds since 1970, as ISO in UTC.
fn from_micros(micros: i64) -> Option<String> {
    let at = time::OffsetDateTime::from_unix_timestamp_nanos(i128::from(micros) * 1000).ok()?;
    at.replace_nanosecond(0).unwrap_or(at).format(&time::format_description::well_known::Rfc3339).ok()
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

/// Whether an address names a scheme, as `https:` or `mailto:` do: it leads
/// out of what is read.
fn has_scheme(href: &str) -> bool {
    match href.split_once(':') {
        Some((scheme, _)) => {
            scheme.len() > 1
                && scheme.chars().next().is_some_and(|c| c.is_ascii_alphabetic())
                && scheme.chars().all(|c| c.is_ascii_alphanumeric() || matches!(c, '+' | '-' | '.'))
        }
        None => false,
    }
}

// ---- what Pandoc made, changed before it is read ----

/// The words of a run of Pandoc's inlines, as they read.
fn words_of(inlines: &Value) -> String {
    let mut out = String::new();
    for i in inlines.as_array().map(Vec::as_slice).unwrap_or(&[]) {
        match i.get("t").and_then(Value::as_str) {
            Some("Str") => out.push_str(i["c"].as_str().unwrap_or("")),
            Some("Space" | "SoftBreak" | "LineBreak") => out.push(' '),
            Some("Code") => out.push_str(i["c"][1].as_str().unwrap_or("")),
            Some("Link" | "Image" | "Span") => out.push_str(&words_of(&i["c"][1])),
            Some("Emph" | "Strong" | "Strikeout" | "Underline" | "SmallCaps" | "Superscript" | "Subscript") => {
                out.push_str(&words_of(&i["c"]));
            }
            Some("Quoted") => out.push_str(&words_of(&i["c"][1])),
            _ => {}
        }
    }
    out
}

/// Plain words as Pandoc's inlines.
fn inlines_of(text: &str) -> Vec<Value> {
    let mut out = Vec::new();
    for (i, word) in text.split(' ').enumerate() {
        if i > 0 {
            out.push(json!({ "t": "Space" }));
        }
        if !word.is_empty() {
            out.push(json!({ "t": "Str", "c": word }));
        }
    }
    out
}

/// Goes through all that Pandoc made, and gives each inline or block that
/// has a kind (`t`) to `change`, which may put a run of others in its place.
fn edit_all(value: &mut Value, change: &mut dyn FnMut(&Value) -> Option<Vec<Value>>) {
    match value {
        Value::Array(items) => {
            let mut out = Vec::with_capacity(items.len());
            for mut item in std::mem::take(items) {
                edit_all(&mut item, change);
                match item.get("t").and_then(Value::as_str).is_some().then(|| change(&item)).flatten() {
                    Some(put) => out.extend(put),
                    None => out.push(item),
                }
            }
            *items = out;
        }
        Value::Object(map) => {
            for v in map.values_mut() {
                edit_all(v, change);
            }
        }
        _ => {}
    }
}

/// What raw HTML in a text means where it is no more than a break or a
/// picture, as notes written in Markdown hold it: `<br>`, and `<img src>`.
fn raw_html(item: &Value) -> Option<Vec<Value>> {
    let t = item.get("t").and_then(Value::as_str)?;
    if !matches!(t, "RawInline" | "RawBlock") || item["c"][0].as_str() != Some("html") {
        return None;
    }
    let raw = item["c"][1].as_str()?.trim();
    let lower = raw.to_ascii_lowercase();
    if t == "RawInline" && (lower == "<br>" || lower == "<br/>" || lower == "<br />") {
        return Some(vec![json!({ "t": "LineBreak" })]);
    }
    if !lower.starts_with("<img") {
        return None;
    }
    let attribute = |name: &str| -> Option<String> {
        let at = lower.find(&format!(" {name}="))? + name.len() + 2;
        let rest = &raw[at..];
        let quote = rest.chars().next()?;
        if quote == '"' || quote == '\'' {
            let rest = &rest[1..];
            Some(rest[..rest.find(quote)?].to_owned())
        } else {
            Some(rest.split(|c: char| c.is_whitespace() || c == '>' || c == '/').next()?.to_owned())
        }
    };
    let src = attribute("src")?;
    let alt = attribute("alt").unwrap_or_default();
    let image = json!({ "t": "Image", "c": [["", [], []], inlines_of(&alt), [src, ""]] });
    Some(if t == "RawBlock" { vec![json!({ "t": "Para", "c": [image] })] } else { vec![image] })
}

#[cfg(test)]
mod iso_tests {
    use super::*;

    #[test]
    fn dates_and_times_as_notes_write_them_are_made_iso() {
        assert_eq!(iso("2021-03-04").as_deref(), Some("2021-03-04"));
        assert_eq!(iso("2021-03-04 12:13:14Z").as_deref(), Some("2021-03-04T12:13:14Z"));
        assert_eq!(iso("2021-03-04T12:13").as_deref(), Some("2021-03-04T12:13"));
        assert_eq!(iso("2021-03-04T12:13:14.250+0100").as_deref(), Some("2021-03-04T12:13:14.250+01:00"));
        assert_eq!(iso(" 2021-03-04 12:13:14 -05:00 ").as_deref(), Some("2021-03-04T12:13:14-05:00"));
        assert_eq!(iso("4 March 2021"), None);
        assert_eq!(iso("2021-3-4"), None);
        assert_eq!(iso("2021-03-04 noon"), None);
        assert_eq!(from_micros(1_614_859_994_000_000).as_deref(), Some("2021-03-04T12:13:14Z"));
    }

    #[test]
    fn addresses_are_unescaped_and_their_schemes_told() {
        assert_eq!(unescape("Other%20Note.md"), "Other Note.md");
        assert_eq!(unescape("100%"), "100%");
        assert_eq!(unescape("%C3%A6"), "æ");
        assert!(has_scheme("https://example.org") && has_scheme("mailto:a@example.org"));
        assert!(has_scheme("evernote:///view/1/s1/abc/abc/"));
        assert!(!has_scheme("Folder/Note.md") && !has_scheme("../Note.md") && !has_scheme("C:"));
    }

    #[test]
    fn raw_html_that_is_a_break_or_a_picture_is_read_as_one() {
        let br = json!({ "t": "RawInline", "c": ["html", "<br/>"] });
        assert_eq!(raw_html(&br), Some(vec![json!({ "t": "LineBreak" })]));
        let img = json!({ "t": "RawBlock", "c": ["html", "<img src=\"../_resources/a b.png\" alt=\"A cat\" width=\"300\"/>"] });
        let made = raw_html(&img).unwrap();
        assert_eq!(made[0]["t"], "Para");
        assert_eq!(made[0]["c"][0]["c"][2][0], "../_resources/a b.png");
        assert_eq!(words_of(&made[0]["c"][0]["c"][1]), "A cat");
        assert_eq!(raw_html(&json!({ "t": "RawInline", "c": ["html", "<span>"] })), None);
    }
}
