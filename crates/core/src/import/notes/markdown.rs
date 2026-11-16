//! A folder of notes in Markdown or text, as Obsidian, Joplin, Notion and
//! Bear export them, or as anyone keeps them: every `.md`, `.markdown` and
//! `.txt` under it a note, and every TextBundle (`.textbundle`,
//! `.bearnote`) one. Folders and files whose names begin with a dot are
//! passed over, as `.obsidian`; Joplin's `_resources` and a TextBundle's
//! `assets` are where files lie, not notes.
//!
//! The notes are looked at in two passes: first what each says of itself
//! (its name, when it was made, its tags, its source), so that every link
//! between them can be told by a name; then each text is read by Pandoc,
//! its pictures and files taken in, its links to the others found.

use std::cell::RefCell;
use std::collections::HashMap;
use std::fs;
use std::path::{Component, Path, PathBuf};

use serde_json::{Value, json};

use super::taking::{Holding, Taker, is_picture};
use super::{Counter, Kind, ReadNote, Reading, Source, front, has_scheme, iso, raw_html, tags, unescape, words_of};
use crate::error::{Error, IoContext, Result};
use crate::import::document::{self, MAX_BYTES};
use crate::library::figures::Image;
use crate::tr;

/// The endings of the files that are notes.
const ENDINGS: [&str; 3] = ["md", "markdown", "txt"];

/// A note in a folder: its text, and the TextBundle it is, where it is one.
#[derive(Debug, Clone)]
pub(super) struct NoteFile {
    /// The file of its text.
    pub(super) path: PathBuf,
    /// The folder of a TextBundle, which is the note.
    pub(super) bundle: Option<PathBuf>,
    /// Its path within what is read, with `/` between the folders.
    pub(super) key: String,
}

impl NoteFile {
    /// Whether its text is Markdown, which Pandoc reads, and not text.
    pub(super) fn markdown(&self) -> bool {
        super::ending_of(&self.path) != "txt"
    }

    /// What it is called, without its ending.
    fn stem(&self) -> String {
        let named = self.bundle.as_deref().unwrap_or(&self.path);
        named.file_stem().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default()
    }
}

/// What a folder holds.
#[derive(Debug)]
pub(super) struct Found {
    pub(super) kind: Kind,
    /// The folder read: pictures named by a note are found in it and below.
    root: PathBuf,
    pub(super) notes: Vec<NoteFile>,
    /// How many other files lie with them.
    pub(super) files: usize,
    /// Evernote's exports among them.
    pub(super) enex: Vec<PathBuf>,
    /// Whether OneNote's own files are among them.
    pub(super) onenote: bool,
    /// Whether it is one file, read as a folder of one: pictures are then
    /// not looked for by their names in the folder it lies in.
    single: bool,
}

pub(super) fn is_note(path: &Path) -> bool {
    ENDINGS.contains(&super::ending_of(path).as_str())
}

/// Whether a name ends in the long number Notion gives every page: a space
/// and 32 signs of 0-9a-f.
fn notion_number(stem: &str) -> Option<&str> {
    let (before, number) = stem.rsplit_once(' ')?;
    (number.len() == 32 && number.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))).then_some(before)
}

/// A name without Notion's long number.
fn without_number(stem: &str) -> &str {
    notion_number(stem).unwrap_or(stem)
}

/// One file of a note, read as a folder of one.
pub(super) fn single(path: &Path) -> Found {
    let key = path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
    let stem = path.file_stem().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
    Found {
        kind: if notion_number(&stem).is_some() { Kind::Notion } else { Kind::Markdown },
        root: path.parent().map(Path::to_owned).unwrap_or_default(),
        notes: vec![NoteFile { path: path.to_owned(), bundle: None, key }],
        files: 0,
        enex: Vec::new(),
        onenote: false,
        single: true,
    }
}

/// What lies in a folder, and which program's notes they are.
pub(super) fn found(root: &Path) -> Found {
    let mut walk = Walk::default();
    walk.folder(root, root, "");
    let kind = if walk.obsidian {
        Kind::Obsidian
    } else if walk.bear {
        Kind::Bear
    } else if walk.joplin {
        Kind::Joplin
    } else if walk.notion {
        Kind::Notion
    } else {
        Kind::Markdown
    };
    Found {
        kind,
        root: root.to_owned(),
        notes: walk.notes,
        files: walk.files,
        enex: walk.enex,
        onenote: walk.onenote,
        single: false,
    }
}

#[derive(Default)]
struct Walk {
    notes: Vec<NoteFile>,
    files: usize,
    enex: Vec<PathBuf>,
    onenote: bool,
    obsidian: bool,
    bear: bool,
    joplin: bool,
    notion: bool,
}

/// What lies in a folder, by name, links not followed, in the order of
/// their names.
fn entries(dir: &Path) -> Vec<(String, PathBuf, fs::FileType)> {
    let Ok(read) = fs::read_dir(dir) else { return Vec::new() };
    let mut out: Vec<(String, PathBuf, fs::FileType)> = read
        .filter_map(|e| e.ok())
        .filter_map(|e| Some((e.file_name().to_string_lossy().into_owned(), e.path(), e.file_type().ok()?)))
        .collect();
    out.sort_by(|a, b| a.0.cmp(&b.0));
    out
}

fn joined(rel: &str, name: &str) -> String {
    if rel.is_empty() { name.to_owned() } else { format!("{rel}/{name}") }
}

/// How many files lie in a folder and below, passing over what is hidden.
fn count_files(dir: &Path) -> usize {
    entries(dir)
        .into_iter()
        .filter(|(name, _, _)| !name.starts_with('.'))
        .map(|(_, path, kind)| if kind.is_dir() { count_files(&path) } else { usize::from(kind.is_file()) })
        .sum()
}

impl Walk {
    fn folder(&mut self, root: &Path, dir: &Path, rel: &str) {
        for (name, path, kind) in entries(dir) {
            if name.starts_with('.') {
                if dir == root && name == ".obsidian" && kind.is_dir() {
                    self.obsidian = true;
                }
                continue;
            }
            let lower = name.to_lowercase();
            if kind.is_dir() {
                if lower.ends_with(".textbundle") || lower.ends_with(".bearnote") {
                    self.bundle(&path, &joined(rel, &name));
                } else if name == "_resources" {
                    self.joplin = true;
                    self.files += count_files(&path);
                } else {
                    self.folder(root, &path, &joined(rel, &name));
                }
            } else if kind.is_file() {
                let ending = super::ending_of(&path);
                if ENDINGS.contains(&ending.as_str()) {
                    let stem = path.file_stem().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
                    self.notion |= notion_number(&stem).is_some();
                    self.notes.push(NoteFile { path, bundle: None, key: joined(rel, &name) });
                } else if ending == "enex" {
                    self.enex.push(path);
                } else {
                    self.onenote |= super::ONENOTE.contains(&ending.as_str());
                    self.files += 1;
                }
            }
        }
    }

    /// A TextBundle: one note, its text `text.md` (or `.markdown`, or
    /// `.txt`), its files in `assets`.
    fn bundle(&mut self, dir: &Path, key: &str) {
        let text = ["text.md", "text.markdown", "text.txt"].into_iter().map(|n| dir.join(n)).find(|p| p.is_file());
        let Some(text) = text else {
            self.files += count_files(dir);
            return;
        };
        self.bear = true;
        self.files += count_files(dir).saturating_sub(1 + usize::from(dir.join("info.json").is_file()));
        self.notes.push(NoteFile { path: text, bundle: Some(dir.to_owned()), key: key.to_owned() });
    }
}

// ---- the first pass: what each note says of itself ----

/// A note, with what it says of itself, its text not yet read.
struct Prepared {
    file: NoteFile,
    /// Its text, without the lines before it, and without its name where
    /// it began with that as a heading.
    body: String,
    name: String,
    made: Option<String>,
    tags: Vec<String>,
    source: Option<String>,
    /// The folder it lies in, within what is read.
    folder: String,
}

/// The name a text gives itself in a heading of the first level that it
/// begins with, and the text without it.
fn first_heading(body: &str) -> Option<(String, String)> {
    let start = body.len() - body.trim_start_matches(['\n', '\r', ' ', '\t']).len();
    // Only blank lines may stand before it, not text set in.
    let start = body[..start].rfind('\n').map_or(0, |n| n + 1);
    let rest = &body[start..];
    let line_end = rest.find('\n').map_or(rest.len(), |n| n + 1);
    let line = rest[..line_end].trim_end();
    let heading = line.strip_prefix("# ")?;
    let heading = heading.trim().trim_end_matches('#').trim_end();
    if heading.is_empty() {
        return None;
    }
    Some((heading.to_owned(), rest[line_end..].to_owned()))
}

/// Where a TextBundle says its text was clipped from.
fn bundle_source(bundle: &Path) -> Option<String> {
    let text = fs::read_to_string(bundle.join("info.json")).ok()?;
    let value: Value = serde_json::from_str(&text).ok()?;
    fn find(v: &Value, depth: usize) -> Option<String> {
        let map = v.as_object()?;
        if let Some(url) = map.get("sourceURL").and_then(Value::as_str).filter(|u| !u.trim().is_empty()) {
            return Some(url.trim().to_owned());
        }
        if depth == 0 {
            return None;
        }
        map.values().find_map(|v| find(v, depth - 1))
    }
    find(&value, 2)
}

fn prepare(reading: &mut Reading, file: NoteFile) -> Result<Prepared> {
    let size = fs::metadata(&file.path).context(|| tr!("io-reading", path = &file.path))?.len();
    let file_name = file.path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
    if size > MAX_BYTES {
        return Err(Error::invalid(tr!("core-import-document-too-large", file = &file_name)));
    }
    let bytes = fs::read(&file.path).context(|| tr!("io-reading", path = &file.path))?;
    let decoded = crate::import::decoding::decode_text(&bytes);
    if decoded.western {
        reading.problems.push(tr!("core-import-read-as-western", name = &file.key));
    }
    let text = decoded.text.replace("\r\n", "\n");
    let markdown = file.markdown();
    let (said, body) = if markdown { front::split(&text) } else { (front::Front::default(), text.as_str()) };
    let mut body = body.to_owned();
    let name = match said.title.clone() {
        Some(title) => title,
        None => match first_heading(&body).filter(|_| markdown) {
            Some((heading, rest)) => {
                body = rest;
                heading
            }
            None => without_number(&file.stem()).to_owned(),
        },
    };
    let mut tags = said.tags.clone();
    for tag in tags::tags_in(&body) {
        if !tags.iter().any(|t| t.to_lowercase() == tag.to_lowercase()) {
            tags.push(tag);
        }
    }
    let made = said.created.as_deref().and_then(iso).or_else(|| crate::notebook::facts(&file.path).time);
    let source = said.source.clone().or_else(|| file.bundle.as_deref().and_then(bundle_source));
    let folder = file.key.rsplit_once('/').map(|(f, _)| f.to_owned()).unwrap_or_default();
    Ok(Prepared { file, body, name, made, tags, source, folder })
}

// ---- telling what a link names ----

/// The notes read, by what a link may call them.
struct Index {
    /// By their keys, in small letters.
    keys: HashMap<String, usize>,
    /// By the names of their files without endings (and without Notion's
    /// numbers), in small letters.
    stems: HashMap<String, Vec<usize>>,
    /// By their names, in small letters.
    names: HashMap<String, Vec<usize>>,
    /// Their folders within what is read.
    folders: Vec<String>,
}

impl Index {
    fn new(notes: &[Prepared]) -> Self {
        let mut index =
            Index { keys: HashMap::new(), stems: HashMap::new(), names: HashMap::new(), folders: Vec::new() };
        for (i, note) in notes.iter().enumerate() {
            index.keys.insert(note.file.key.to_lowercase(), i);
            let stem = note.file.stem().to_lowercase();
            let bare = without_number(&stem).to_owned();
            index.stems.entry(stem.clone()).or_default().push(i);
            if bare != stem {
                index.stems.entry(bare).or_default().push(i);
            }
            index.names.entry(note.name.to_lowercase()).or_default().push(i);
            index.folders.push(note.folder.clone());
        }
        index
    }

    /// Of several, the one in the folder `folder`, else the first.
    fn choose(&self, found: Option<&Vec<usize>>, folder: &str) -> Option<usize> {
        let found = found?;
        found.iter().copied().find(|&i| self.folders[i] == folder).or_else(|| found.first().copied())
    }

    /// The note a `[[link]]` names, as Obsidian tells it: by the name of
    /// its file, or its path, or else by its name; what follows `#` or `^`
    /// is a place within it.
    fn by_name(&self, target: &str, folder: &str) -> Option<usize> {
        let target = target.split(['#', '^']).next().unwrap_or(target).trim();
        let lower = target.to_lowercase();
        let bare = ENDINGS
            .iter()
            .find_map(|e| lower.strip_suffix(&format!(".{e}")))
            .unwrap_or(&lower)
            .trim_start_matches('/')
            .to_owned();
        if bare.is_empty() {
            return None;
        }
        if bare.contains('/') {
            let ends = |key: &str| {
                let key = ENDINGS.iter().find_map(|e| key.strip_suffix(&format!(".{e}"))).unwrap_or(key);
                key == bare || key.ends_with(&format!("/{bare}"))
            };
            let mut found: Vec<usize> = self.keys.iter().filter(|(k, _)| ends(k)).map(|(_, &i)| i).collect();
            found.sort_unstable();
            return found.first().copied();
        }
        self.choose(self.stems.get(&bare), folder).or_else(|| self.choose(self.names.get(&lower), folder))
    }
}

/// A path within what is read, `..` and `.` taken away; none where it
/// leads out of it.
fn normal(path: &str) -> Option<String> {
    let mut parts: Vec<&str> = Vec::new();
    for part in Path::new(path).components() {
        match part {
            Component::Normal(p) => parts.push(p.to_str()?),
            Component::ParentDir => {
                parts.pop()?;
            }
            Component::CurDir => {}
            Component::RootDir | Component::Prefix(_) => {}
        }
    }
    Some(parts.join("/"))
}

/// What a link's address names, within what is read.
enum Named {
    Note(usize),
    File(PathBuf),
    Nothing,
}

/// What a note's text calls for, as it is read.
struct Note<'r, 'a> {
    taker: &'r mut Taker<'a>,
    index: &'r Index,
    keys: &'r [String],
    root: &'r Path,
    /// The note's own folder, within what is read and on the disk.
    folder: &'r str,
    /// Its place among the notes.
    me: usize,
    /// Pictures and files by their names, anywhere in what is read; made
    /// when first asked for.
    by_name: &'r mut Option<HashMap<String, Vec<PathBuf>>>,
    single: bool,
    origin: String,
    holding: Holding,
    links: Vec<String>,
}

/// Every file under a folder, by its name in small letters, the nearest first.
fn files_by_name(root: &Path) -> HashMap<String, Vec<PathBuf>> {
    fn walk(dir: &Path, out: &mut HashMap<String, Vec<PathBuf>>) {
        for (name, path, kind) in entries(dir) {
            if name.starts_with('.') {
                continue;
            }
            if kind.is_dir() {
                walk(&path, out);
            } else if kind.is_file() {
                out.entry(name.to_lowercase()).or_default().push(path);
            }
        }
    }
    let mut out = HashMap::new();
    walk(root, &mut out);
    for paths in out.values_mut() {
        paths.sort_by_key(|p| p.components().count());
    }
    out
}

impl Note<'_, '_> {
    fn link(&mut self, to: usize) {
        if to != self.me && !self.links.contains(&self.keys[to]) {
            self.links.push(self.keys[to].clone());
        }
    }

    /// Whether a file lies within what is read.
    fn within(&self, path: &Path) -> bool {
        match (path.canonicalize(), self.root.canonicalize()) {
            (Ok(path), Ok(root)) => path.starts_with(root),
            _ => false,
        }
    }

    /// The file a text names, beside the note or below it, or else by its
    /// name anywhere in what is read; or why there is none.
    fn locate(&mut self, named: &str) -> std::result::Result<PathBuf, String> {
        let plain = named.strip_prefix("file://").unwrap_or(named);
        let plain = unescape(plain.split(['?', '#']).next().unwrap_or(plain).trim());
        let path = Path::new(&plain);
        let mut outside = false;
        let candidate = if path.is_absolute() {
            Some(path.to_owned())
        } else {
            normal(&format!("{}/{plain}", self.folder)).map(|rel| self.root.join(rel))
        };
        if let Some(candidate) = candidate.filter(|c| c.is_file()) {
            if self.within(&candidate) {
                return Ok(candidate);
            }
            outside = true;
        }
        if !self.single {
            let name = path.file_name().map(|n| n.to_string_lossy().to_lowercase()).unwrap_or_default();
            let all = self.by_name.get_or_insert_with(|| files_by_name(self.root));
            if let Some(found) = all.get(&name).and_then(|paths| paths.first()) {
                return Ok(found.clone());
            }
        }
        Err(if outside { tr!("core-notes-picture-outside") } else { tr!("core-notes-picture-not-found") })
    }

    /// What an address of a link leads to: a note read with this one, or
    /// another file of what is read.
    fn named(&mut self, href: &str) -> Named {
        let plain = unescape(href.split(['?', '#']).next().unwrap_or(href).trim());
        if plain.is_empty() {
            return Named::Nothing;
        }
        let rel = match plain.strip_prefix('/') {
            Some(from_root) => normal(from_root),
            None => normal(&format!("{}/{plain}", self.folder)),
        };
        if let Some(rel) = rel {
            let lower = rel.to_lowercase();
            if let Some(&i) = self.index.keys.get(&lower).or_else(|| self.index.keys.get(&format!("{lower}.md"))) {
                return Named::Note(i);
            }
            let path = self.root.join(&rel);
            if path.is_file() && self.within(&path) {
                return Named::File(path);
            }
        }
        // A link to a note by the name of its file alone, wherever it lies.
        if is_note(Path::new(&plain))
            && let Some(i) = self.index.by_name(&plain, self.folder)
        {
            return Named::Note(i);
        }
        Named::Nothing
    }

    /// A file named by a link, taken in to stand at the note's end. What
    /// could not be taken is said in the problems by `failed`.
    fn attach(&mut self, path: &Path, failed: &mut Vec<(String, String)>) {
        match self.taker.file(path) {
            Ok(held) => self.holding.attach(&held),
            Err(why) => {
                failed.push((path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default(), why))
            }
        }
    }

    /// What Pandoc made of a link, an embedded note or raw HTML, changed:
    /// a link to another note read is that note linked, its words without
    /// the mark of a link, since its address leads nowhere any more; so too
    /// a link to another file, which is taken in to stand at the note's end.
    /// A link to the web stays a link.
    fn edit(&mut self, item: &Value, failed: &mut Vec<(String, String)>) -> Option<Vec<Value>> {
        let t = item.get("t").and_then(Value::as_str)?;
        let c = &item["c"];
        let wiki = c[0][1].as_array().is_some_and(|classes| classes.iter().any(|c| c == "wikilink"));
        let words = || c[1].as_array().cloned().unwrap_or_default();
        match t {
            "Link" => {
                let href = c[2][0].as_str().unwrap_or("").trim();
                if wiki {
                    if let Some(i) = self.index.by_name(href, self.folder) {
                        self.link(i);
                    } else if let Ok(path) = self.locate(href) {
                        self.attach(&path, failed);
                    }
                    return Some(words());
                }
                if href.is_empty() || href.starts_with('#') {
                    return None;
                }
                if has_scheme(href) {
                    // What leads into another program's notes leads nowhere here.
                    let lower = href.to_ascii_lowercase();
                    return ["evernote:", "joplin:", "obsidian:", "bear:", "notion:"]
                        .iter()
                        .any(|s| lower.starts_with(s))
                        .then(words);
                }
                match self.named(href) {
                    Named::Note(i) => {
                        self.link(i);
                        Some(words())
                    }
                    Named::File(path) => {
                        self.attach(&path, failed);
                        Some(words())
                    }
                    Named::Nothing => None,
                }
            }
            "Image" => {
                let target = c[2][0].as_str().unwrap_or("").trim();
                let note = if wiki {
                    self.index.by_name(target, self.folder).filter(|_| !is_picture(target))
                } else if has_scheme(target) {
                    None
                } else {
                    match self.named(target) {
                        Named::Note(i) => Some(i),
                        _ => None,
                    }
                };
                if let Some(i) = note {
                    // A note shown within another: linked, and named where it stood.
                    self.link(i);
                    let shown = if wiki { target.to_owned() } else { words_of(&c[1]) };
                    return Some(super::inlines_of(shown.trim()));
                }
                // What Obsidian says after the bar of a picture is its size, not what it shows.
                let said = words_of(&c[1]);
                let size =
                    !said.is_empty() && said.split('x').all(|n| !n.is_empty() && n.bytes().all(|b| b.is_ascii_digit()));
                if wiki && size {
                    let mut item = item.clone();
                    item["c"][1] = json!([]);
                    return Some(vec![item]);
                }
                None
            }
            _ => raw_html(item),
        }
    }

    /// A picture of the text, by what the text calls it: taken in and held,
    /// and the figure that shows it. A file that is no picture is taken in
    /// to stand at the note's end, and stands in no figure: said by an
    /// empty why.
    fn take_in(&mut self, named: &str) -> std::result::Result<Image, String> {
        if let Some(bytes) = document::named_picture_bytes(named) {
            let held = self.taker.bytes(&bytes?, &super::data_name(named), &self.origin)?;
            return self.holding.picture(&held).ok_or_default();
        }
        let path = self.locate(named)?;
        let held = self.taker.file(&path)?;
        let name = path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
        if is_picture(&name) {
            self.holding.picture(&held).ok_or_default()
        } else {
            self.holding.attach(&held);
            Err(String::new())
        }
    }
}

trait OrDefault<T> {
    fn ok_or_default(self) -> std::result::Result<T, String>;
}

impl<T> OrDefault<T> for Option<T> {
    /// None as the empty why of a file that stands at the note's end.
    fn ok_or_default(self) -> std::result::Result<T, String> {
        self.ok_or_else(String::new)
    }
}

// ---- the second pass: the texts ----

pub(super) fn read(reading: &mut Reading, found: Found, count: &mut Counter) -> Result<Vec<ReadNote>> {
    let total = found.notes.len();
    let mut prepared: Vec<Prepared> = Vec::with_capacity(total);
    for file in found.notes {
        reading.stopped()?;
        let key = file.key.clone();
        match prepare(reading, file) {
            Ok(p) => prepared.push(p),
            Err(error) => reading.unreadable(&key, &error),
        }
    }
    // Without Pandoc, no note in Markdown is read; the reading says so.
    let reader = if prepared.iter().any(|p| p.file.markdown()) { Some(reading.markdown_reader()?) } else { None };
    let index = Index::new(&prepared);
    let keys: Vec<String> = prepared.iter().map(|p| p.file.key.clone()).collect();
    let mut by_name: Option<HashMap<String, Vec<PathBuf>>> = None;
    let pandoc = reading.pandoc_run();
    let mut notes = Vec::with_capacity(prepared.len());
    for (me, p) in prepared.iter().enumerate() {
        reading.stopped()?;
        count(me, prepared.len(), &p.name);
        let note = RefCell::new(Note {
            taker: &mut reading.taker,
            index: &index,
            keys: &keys,
            root: &found.root,
            folder: &p.folder,
            me,
            by_name: &mut by_name,
            single: found.single,
            origin: p.file.path.display().to_string(),
            holding: Holding::default(),
            links: Vec::new(),
        });
        let mut failed: Vec<(String, String)> = Vec::new();
        let read = match &reader {
            Some(reader) if p.file.markdown() => {
                let mut edit = |value: &mut Value| {
                    super::edit_all(value, &mut |item| note.borrow_mut().edit(item, &mut failed));
                };
                let mut take_in = |named: &str| note.borrow_mut().take_in(named);
                pandoc.read(&p.body, reader, "Markdown", &mut edit, &mut take_in)
            }
            _ => Ok((document::plain_blocks(&p.body), Vec::new())),
        };
        let Note { holding, links, .. } = note.into_inner();
        match read {
            Ok((blocks, lost)) => {
                reading.left_out(&p.name, lost);
                reading.left_out(&p.name, failed);
                notes.push(ReadNote {
                    key: p.file.key.clone(),
                    name: p.name.clone(),
                    made: p.made.clone(),
                    tags: p.tags.clone(),
                    source: p.source.clone().map(|url| Source { url, title: p.name.clone() }),
                    blocks,
                    held: holding.held,
                    attachments: holding.attachments,
                    links,
                });
            }
            Err(error) => {
                reading.stopped()?;
                reading.unreadable(&p.name, &error);
            }
        }
    }
    Ok(notes)
}
