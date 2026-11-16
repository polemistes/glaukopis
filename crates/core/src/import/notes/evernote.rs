//! Evernote's export: a file `.enex`, XML, which holds notes, each with its
//! title, when it was made, its tags, the page it was clipped from, its
//! text as ENML (HTML of Evernote's own) and its files, in base64, which
//! the text names by the MD5 of what they hold. The file is read once,
//! whole. The text is made HTML that Pandoc reads: a picture of the text a
//! picture, a box to tick its sign (and the words after it a point to tick,
//! once read), an encrypted part passed over. Which
//! note a link leads to the file does not say: no links between notes are
//! read.

use std::cell::RefCell;
use std::collections::HashMap;
use std::fs;
use std::io::Read;
use std::path::Path;

use base64::Engine;
use md5::{Digest, Md5};
use serde_json::Value;

use super::taking::{Holding, is_picture};
use super::{Counter, Pandoc, ReadNote, Reading, Source, raw_html};
use crate::error::{Error, IoContext, Result};
use crate::tr;

/// The largest export that is read: it is read whole.
const LARGEST: u64 = 1024 * 1024 * 1024;

/// How a picture of the text is named in the HTML made for Pandoc: by the
/// MD5 of what it holds, after this.
const MEDIA: &str = "glaukopis-media:";

/// How many notes, and how many files, an export holds, counted by their
/// tags without the file being read whole.
pub(super) fn tally(path: &Path) -> Result<(usize, usize)> {
    let mut file = fs::File::open(path).context(|| tr!("io-reading", path = path))?;
    let patterns: [&[u8]; 2] = [b"<note>", b"<resource>"];
    let mut counts = [0usize; 2];
    let keep = patterns.iter().map(|p| p.len()).max().unwrap_or(1) - 1;
    let mut buffer = vec![0u8; 1 << 16];
    let mut carried: Vec<u8> = Vec::new();
    loop {
        let n = file.read(&mut buffer).context(|| tr!("io-reading", path = path))?;
        carried.extend_from_slice(&buffer[..n]);
        // What begins in the last few bytes may end in the next piece: it is counted with that.
        let counted = if n == 0 { carried.len() } else { carried.len().saturating_sub(keep) };
        for (pattern, count) in patterns.iter().zip(counts.iter_mut()) {
            *count += (0..counted).filter(|&i| carried[i..].starts_with(pattern)).count();
        }
        if n == 0 {
            break;
        }
        carried.drain(..counted);
    }
    Ok((counts[0], counts[1]))
}

/// A file of a note.
struct Resource {
    data: Vec<u8>,
    mime: String,
    name: String,
    /// The MD5 of what it holds, by which the text names it.
    hash: String,
}

impl Resource {
    fn picture(&self) -> bool {
        self.mime.starts_with("image/") || is_picture(&self.name)
    }
}

/// When a note was made, as Evernote writes it (`20230401T102030Z`), as ISO.
fn made_of(said: &str) -> Option<String> {
    let s = said.trim();
    let b = s.as_bytes();
    if s.len() < 15 || b[8] != b'T' || !s[..8].bytes().chain(s[9..15].bytes()).all(|c| c.is_ascii_digit()) {
        return None;
    }
    let zone = if s[15..].starts_with('Z') { "Z" } else { "" };
    Some(format!("{}-{}-{}T{}:{}:{}{zone}", &s[..4], &s[4..6], &s[6..8], &s[9..11], &s[11..13], &s[13..15]))
}

/// The attributes of a tag, as `name="value"`.
fn attributes(tag: &str) -> HashMap<String, String> {
    let mut out = HashMap::new();
    let mut rest = tag;
    while let Some(eq) = rest.find('=') {
        let name = rest[..eq].rsplit(|c: char| c.is_whitespace()).next().unwrap_or("").trim().to_ascii_lowercase();
        let after = rest[eq + 1..].trim_start();
        let Some(quote) = after.chars().next().filter(|c| *c == '"' || *c == '\'') else {
            rest = &rest[eq + 1..];
            continue;
        };
        let value_rest = &after[1..];
        let Some(end) = value_rest.find(quote) else { break };
        out.insert(name, value_rest[..end].to_owned());
        rest = &value_rest[end + 1..];
    }
    out
}

/// ENML made HTML that Pandoc reads: `<en-note>` a `div`; `<en-todo>` the
/// sign of a box, ticked or not; `<en-media>` a picture where the file is
/// one, else nothing (the file stands at the note's end); `<en-crypt>`
/// passed over. Gives the HTML and whether something encrypted was passed
/// over.
fn html_of(enml: &str, resources: &[Resource]) -> (String, bool) {
    let mut out = String::with_capacity(enml.len());
    let mut crypt = false;
    let mut rest = enml;
    while let Some(at) = rest.find('<') {
        out.push_str(&rest[..at]);
        rest = &rest[at..];
        let Some(end) = rest.find('>') else { break };
        let tag = &rest[..=end];
        let name: String = tag[1..]
            .trim_start_matches('/')
            .chars()
            .take_while(|c| !c.is_whitespace() && *c != '>' && *c != '/')
            .collect::<String>()
            .to_ascii_lowercase();
        let closing = tag.starts_with("</");
        rest = &rest[end + 1..];
        match name.as_str() {
            _ if tag.starts_with("<?") || tag.starts_with("<!") => {}
            "en-note" => out.push_str(if closing { "</div>" } else { "<div>" }),
            "en-todo" if !closing => {
                let checked = attributes(tag).get("checked").is_some_and(|v| v.eq_ignore_ascii_case("true"));
                out.push_str(if checked { "☒ " } else { "☐ " });
            }
            "en-media" if !closing => {
                let said = attributes(tag);
                let hash = said.get("hash").map(|h| h.to_ascii_lowercase()).unwrap_or_default();
                if resources.iter().any(|r| r.hash == hash && r.picture()) {
                    let alt = said.get("alt").cloned().unwrap_or_default().replace('"', "&quot;");
                    out.push_str(&format!("<img src=\"{MEDIA}{hash}\" alt=\"{alt}\">"));
                }
            }
            "en-crypt" if !closing => {
                crypt = true;
                if !tag.ends_with("/>") {
                    match rest.to_ascii_lowercase().find("</en-crypt>") {
                        Some(close) => rest = &rest[close + "</en-crypt>".len()..],
                        None => rest = "",
                    }
                }
            }
            "en-todo" | "en-media" | "en-crypt" => {}
            _ => out.push_str(tag),
        }
    }
    out.push_str(rest);
    (out, crypt)
}

/// The text of the first child of `node` named `name`.
fn child_text(node: roxmltree::Node, name: &str) -> Option<String> {
    let found = node.children().find(|c| c.has_tag_name(name))?;
    let text: String = found.descendants().filter(|d| d.is_text()).filter_map(|d| d.text()).collect();
    Some(text.trim().to_owned()).filter(|t| !t.is_empty())
}

fn resource_of(node: roxmltree::Node) -> Option<Resource> {
    let data: String = child_text(node, "data")?.chars().filter(|c| !c.is_whitespace()).collect();
    let data = base64::engine::general_purpose::STANDARD.decode(data).ok()?;
    let mime = child_text(node, "mime").unwrap_or_default().to_ascii_lowercase();
    let attributes = node.children().find(|c| c.has_tag_name("resource-attributes"));
    let named = attributes.and_then(|a| child_text(a, "file-name"));
    let name = named.unwrap_or_else(|| {
        let (kind, sub) = mime.split_once('/').unwrap_or(("", ""));
        let ending = sub.split(['+', ';']).next().unwrap_or("");
        let stem = if kind == "image" { "image" } else { "attachment" };
        if ending.is_empty() { stem.to_owned() } else { format!("{stem}.{ending}") }
    });
    let hash = Md5::digest(&data).iter().map(|b| format!("{b:02x}")).collect();
    Some(Resource { data, mime, name, hash })
}

pub(super) fn read(reading: &mut Reading, files: &[std::path::PathBuf], count: &mut Counter) -> Result<Vec<ReadNote>> {
    reading.tools.pandoc()?;
    let total: usize = files.iter().map(|f| tally(f).map_or(0, |(notes, _)| notes)).sum();
    let mut done = 0usize;
    let mut notes = Vec::new();
    let mut encrypted = 0usize;
    for path in files {
        reading.stopped()?;
        let file = path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
        let size = fs::metadata(path).context(|| tr!("io-reading", path = path))?.len();
        if size > LARGEST {
            reading.problems.push(tr!("core-notes-too-large", file = &file));
            continue;
        }
        let text = fs::read(path).context(|| tr!("io-reading", path = path))?;
        let text = String::from_utf8_lossy(&text);
        let options = roxmltree::ParsingOptions { allow_dtd: true, ..Default::default() };
        let document = match roxmltree::Document::parse_with_options(&text, options) {
            Ok(document) => document,
            Err(error) => {
                if files.len() == 1 {
                    return Err(Error::invalid(tr!(
                        "core-notes-evernote-unreadable",
                        file = &file,
                        message = error.to_string()
                    )));
                }
                reading.problems.push(tr!("core-notes-evernote-unreadable", file = &file, message = error.to_string()));
                continue;
            }
        };
        let all: Vec<roxmltree::Node> = document.root_element().children().filter(|n| n.has_tag_name("note")).collect();
        for (n, node) in all.iter().enumerate() {
            reading.stopped()?;
            let name = child_text(*node, "title").unwrap_or_default();
            count(done, total.max(done + 1), &name);
            done += 1;
            match note(reading, path, *node, n, &name) {
                Ok((read, crypt)) => {
                    encrypted += usize::from(crypt);
                    notes.push(read);
                }
                Err(error) => {
                    reading.stopped()?;
                    reading.unreadable(&name, &error);
                }
            }
        }
    }
    if encrypted > 0 {
        reading.problems.push(tr!("core-notes-encrypted", count = encrypted));
    }
    Ok(notes)
}

/// One note of an export: the `n`th of the file at `path`.
fn note(reading: &mut Reading, path: &Path, node: roxmltree::Node, n: usize, name: &str) -> Result<(ReadNote, bool)> {
    let file = path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
    let made = child_text(node, "created").as_deref().and_then(made_of);
    let tags: Vec<String> = node
        .children()
        .filter(|c| c.has_tag_name("tag"))
        .filter_map(|c| c.text())
        .map(|t| t.trim().to_owned())
        .filter(|t| !t.is_empty())
        .collect();
    let source = node
        .children()
        .find(|c| c.has_tag_name("note-attributes"))
        .and_then(|a| child_text(a, "source-url"))
        .filter(|url| url.contains("://"))
        .map(|url| Source { url, title: name.to_owned() });
    let resources: Vec<Resource> =
        node.children().filter(|c| c.has_tag_name("resource")).filter_map(resource_of).collect();
    let enml = child_text(node, "content").unwrap_or_default();
    let (html, crypt) = html_of(&enml, &resources);

    let origin = path.display().to_string();
    let holding = RefCell::new(Holding::default());
    let pictured: RefCell<Vec<String>> = RefCell::new(Vec::new());
    let taker = RefCell::new(&mut reading.taker);
    let mut edit = |value: &mut Value| {
        super::edit_all(value, &mut |item| {
            // A link into Evernote leads nowhere here: its words stay.
            if item.get("t").and_then(Value::as_str) == Some("Link") {
                let href = item["c"][2][0].as_str().unwrap_or("").to_ascii_lowercase();
                if href.starts_with("evernote:") {
                    return item["c"][1].as_array().cloned();
                }
            }
            raw_html(item)
        });
    };
    let mut take_in = |named: &str| -> std::result::Result<crate::library::figures::Image, String> {
        if let Some(hash) = named.strip_prefix(MEDIA) {
            let resource =
                resources.iter().find(|r| r.hash == hash).ok_or_else(|| tr!("core-notes-picture-not-found"))?;
            let held = taker.borrow_mut().bytes(&resource.data, &resource.name, &origin)?;
            pictured.borrow_mut().push(hash.to_owned());
            return holding.borrow_mut().picture(&held).ok_or_else(String::new);
        }
        match crate::import::document::named_picture_bytes(named) {
            Some(bytes) => {
                let held = taker.borrow_mut().bytes(&bytes?, &super::data_name(named), &origin)?;
                holding.borrow_mut().picture(&held).ok_or_else(String::new)
            }
            None => Err(tr!("core-notes-picture-not-found")),
        }
    };
    let pandoc = Pandoc { tools: reading.tools, work: reading.work, stop: reading.stop };
    let (blocks, lost) = pandoc.read(&html, "html", "HTML", &mut edit, &mut take_in)?;
    // A box to tick stands before its words in Evernote, in a list or not: each is a point to tick.
    let blocks = crate::import::document::boxed_as_points(blocks);
    // The files the text shows no picture of stand at its end.
    let pictured = pictured.into_inner();
    let mut failed = Vec::new();
    for resource in resources.iter().filter(|r| !pictured.contains(&r.hash)) {
        match taker.borrow_mut().bytes(&resource.data, &resource.name, &origin) {
            Ok(held) => holding.borrow_mut().attach(&held),
            Err(why) => failed.push((resource.name.clone(), why)),
        }
    }
    reading.left_out(name, lost);
    reading.left_out(name, failed);
    let holding = holding.into_inner();
    Ok((
        ReadNote {
            key: format!("{file}#{}", n + 1),
            name: name.to_owned(),
            made,
            tags,
            source,
            blocks,
            held: holding.held,
            attachments: holding.attachments,
            links: Vec::new(),
        },
        crypt,
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn evernote_s_times_and_attributes_are_read() {
        assert_eq!(made_of("20230401T102030Z").as_deref(), Some("2023-04-01T10:20:30Z"));
        assert_eq!(made_of("2023-04-01"), None);
        let said = attributes("<en-media hash=\"ABC\" type='image/png' />");
        assert_eq!((said["hash"].as_str(), said["type"].as_str()), ("ABC", "image/png"));
    }

    #[test]
    fn enml_is_made_html() {
        let picture = Resource { data: vec![1], mime: "image/png".into(), name: "a.png".into(), hash: "aa".into() };
        let paper = Resource { data: vec![2], mime: "application/pdf".into(), name: "b.pdf".into(), hash: "bb".into() };
        let enml = "<?xml version=\"1.0\"?><!DOCTYPE en-note SYSTEM \"x\"><en-note style=\"a\"><div><en-todo checked=\"true\"/>Done<en-todo/>Not</div>\
                    <en-media hash=\"AA\" type=\"image/png\"/><en-media hash=\"bb\" type=\"application/pdf\"></en-media>\
                    <en-crypt hint=\"h\">SECRET</en-crypt><p>After</p></en-note>";
        let (html, crypt) = html_of(enml, &[picture, paper]);
        assert!(crypt);
        assert_eq!(html, "<div><div>☒ Done☐ Not</div><img src=\"glaukopis-media:aa\" alt=\"\"><p>After</p></div>");
    }
}
