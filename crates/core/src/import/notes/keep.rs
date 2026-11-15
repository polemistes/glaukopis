//! Google Keep's export, as Takeout gives it: a folder `Keep` that holds a
//! file `.json` for each note (and one `.html` beside it, which is not
//! read), with its pictures and files beside them. A note says its title,
//! its text (`textContent`) or its list of points to tick (`listContent`),
//! its labels, the pages it names, its files, and when it was made; one in
//! the bin (`isTrashed`) is passed over. Read without Pandoc.

use std::fs;
use std::path::{Path, PathBuf};

use serde_json::Value;

use super::taking::{Holding, is_picture};
use super::{Counter, ReadNote, Reading, Source, from_micros};
use crate::document::{Block, Inline};
use crate::error::{Error, IoContext, Result};
use crate::import::document;
use crate::tr;

/// The largest file of a note that is read.
const LARGEST: u64 = 16 * 1024 * 1024;

/// A folder of Keep's notes.
#[derive(Debug)]
pub(super) struct Found {
    dir: PathBuf,
    pub(super) notes: Vec<PathBuf>,
    /// How many pictures and other files lie with them.
    pub(super) files: usize,
}

fn value_of(path: &Path) -> Option<Value> {
    if fs::metadata(path).ok()?.len() > LARGEST {
        return None;
    }
    serde_json::from_slice(&fs::read(path).ok()?).ok()
}

/// Whether what was read is a note of Keep's, by the names it has.
fn is_keep(value: &Value) -> bool {
    let has = |name: &str| value.get(name).is_some();
    (has("textContent") || has("listContent"))
        && (has("createdTimestampUsec") || has("userEditedTimestampUsec") || has("isTrashed"))
}

/// Whether a file is a note of Keep's.
pub(super) fn is_note(path: &Path) -> bool {
    value_of(path).is_some_and(|v| is_keep(&v))
}

pub(super) fn single(path: &Path) -> Found {
    Found { dir: path.parent().map(Path::to_owned).unwrap_or_default(), notes: vec![path.to_owned()], files: 0 }
}

/// Keep's notes in a folder, or in the folder `Keep` in it, as Takeout
/// has it: told by the first file `.json` there, which alone is read.
pub(super) fn found(path: &Path) -> Option<Found> {
    for dir in [path.to_owned(), path.join("Keep")] {
        let Ok(read) = fs::read_dir(&dir) else { continue };
        let mut names: Vec<PathBuf> = read.filter_map(|e| e.ok()).map(|e| e.path()).filter(|p| p.is_file()).collect();
        names.sort();
        let (notes, others): (Vec<PathBuf>, Vec<PathBuf>) =
            names.into_iter().partition(|p| super::ending_of(p) == "json");
        if notes.first().is_none_or(|first| !is_note(first)) {
            continue;
        }
        let files = others
            .iter()
            .filter(|p| {
                let name = p.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
                !name.starts_with('.') && super::ending_of(p) != "html" && name != "Labels.txt"
            })
            .count();
        return Some(Found { dir, notes, files });
    }
    None
}

/// A time as Keep gives it, in microseconds, a number or its digits.
fn micros(value: &Value) -> Option<i64> {
    value.as_i64().or_else(|| value.as_str().and_then(|s| s.trim().parse().ok())).filter(|m| *m > 0)
}

/// A file a note names, beside it; Takeout may name a picture `.jpeg` that
/// it wrote as `.jpg`, and the like.
fn beside(dir: &Path, named: &str) -> Option<PathBuf> {
    let name = Path::new(named).file_name()?;
    let path = dir.join(name);
    if path.is_file() {
        return Some(path);
    }
    let stem = path.file_stem()?.to_string_lossy().into_owned();
    ["jpg", "jpeg", "png", "gif", "webp", "3gp", "m4a"]
        .into_iter()
        .map(|e| dir.join(format!("{stem}.{e}")))
        .find(|p| p.is_file())
}

pub(super) fn read(reading: &mut Reading, found: Found, count: &mut Counter) -> Result<Vec<ReadNote>> {
    let total = found.notes.len();
    let mut notes = Vec::new();
    for (done, path) in found.notes.iter().enumerate() {
        reading.stopped()?;
        let key = path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
        count(done, total, &key);
        let value = match fs::metadata(path).context(|| tr!("io-reading", path = path)) {
            Ok(meta) if meta.len() > LARGEST => Err(Error::invalid(tr!("core-notes-too-large", file = &key))),
            Ok(_) => fs::read(path)
                .context(|| tr!("io-reading", path = path))
                .and_then(|bytes| serde_json::from_slice::<Value>(&bytes).map_err(Error::from)),
            Err(e) => Err(e),
        };
        let value = match value {
            Ok(value) if is_keep(&value) => value,
            // What is no note of Keep's lies there besides: passed over.
            Ok(_) => continue,
            Err(error) => {
                reading.unreadable(&key, &error);
                continue;
            }
        };
        if value.get("isTrashed").and_then(Value::as_bool) == Some(true) {
            continue;
        }
        notes.push(note(reading, &found.dir, &key, &value));
    }
    Ok(notes)
}

fn note(reading: &mut Reading, dir: &Path, key: &str, value: &Value) -> ReadNote {
    let text = |name: &str| value.get(name).and_then(Value::as_str).map(str::trim).unwrap_or("").to_owned();
    let name = text("title");
    let made = ["createdTimestampUsec", "userEditedTimestampUsec"]
        .into_iter()
        .find_map(|n| value.get(n).and_then(micros))
        .and_then(from_micros);
    let list = |name: &str| value.get(name).and_then(Value::as_array).map(Vec::as_slice).unwrap_or(&[]);
    let mut tags: Vec<String> = Vec::new();
    for label in list("labels") {
        if let Some(label) = label.get("name").and_then(Value::as_str).map(str::trim).filter(|l| !l.is_empty())
            && !tags.iter().any(|t| t == label)
        {
            tags.push(label.to_owned());
        }
    }
    let source = list("annotations").iter().find_map(|a| {
        let url = a.get("url").and_then(Value::as_str).map(str::trim).filter(|u| u.contains("://"))?;
        let title = a.get("title").and_then(Value::as_str).map(str::trim).filter(|t| !t.is_empty());
        Some(Source { url: url.to_owned(), title: title.map_or_else(|| name.clone(), str::to_owned) })
    });

    // Its pictures first, as Keep shows them; its other files at its end.
    let mut holding = Holding::default();
    let mut blocks: Vec<Block> = Vec::new();
    for attachment in list("attachments") {
        let Some(named) = attachment.get("filePath").and_then(Value::as_str) else { continue };
        let Some(found) = beside(dir, named) else {
            reading.left_out(&name_or(&name, key), vec![(named.to_owned(), tr!("core-notes-picture-not-found"))]);
            continue;
        };
        match reading.taker.file(&found) {
            Ok(held) => {
                let file_name = found.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
                if is_picture(&file_name) {
                    if let Some(picture) = holding.picture(&held) {
                        blocks.push(document::figure_of(&picture));
                    }
                } else {
                    holding.attach(&held);
                }
            }
            Err(why) => reading.left_out(&name_or(&name, key), vec![(named.to_owned(), why)]),
        }
    }
    let body = value.get("textContent").and_then(Value::as_str).unwrap_or("");
    if !body.trim().is_empty() {
        blocks.extend(document::plain_blocks(body));
    }
    for point in list("listContent") {
        let words = point.get("text").and_then(Value::as_str).unwrap_or("").trim();
        let ticked = point.get("isChecked").and_then(Value::as_bool).unwrap_or(false);
        let sign = if ticked { "☒" } else { "☐" };
        let text = if words.is_empty() { sign.to_owned() } else { format!("{sign} {words}") };
        blocks.push(Block::of_kind("item", vec![Inline::Text { text, marks: Default::default() }]));
    }
    ReadNote {
        key: key.to_owned(),
        name,
        made,
        tags,
        source,
        blocks,
        held: holding.held,
        attachments: holding.attachments,
        links: Vec::new(),
    }
}

/// What a note is called in a problem: its name, else its key.
fn name_or(name: &str, key: &str) -> String {
    if name.is_empty() { key.to_owned() } else { name.to_owned() }
}
