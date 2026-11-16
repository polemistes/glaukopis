//! The readers of notes, tried on small exports that the tests write
//! themselves, with invented content.

use std::fs;
use std::io::Cursor;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::sync::atomic::{AtomicBool, Ordering};

use base64::Engine;

use super::*;
use crate::document::Inline;
use crate::export::tools::{self, Tools};

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

    fn desk(&self) -> PathBuf {
        let desk = self.tmp.path().join("desk");
        fs::create_dir_all(&desk).unwrap();
        desk
    }

    fn read_with(&self, path: &Path, tools: &Tools, stop: &AtomicBool) -> Result<ReadNotes> {
        read(path, tools, &self.library, &self.tmp.path().join("work"), &mut |_, _, _| {}, stop)
    }

    fn read(&self, path: &Path, tools: &Tools) -> ReadNotes {
        self.read_with(path, tools, &AtomicBool::new(false)).unwrap()
    }

    /// What the library lists: none of what the notebook holds alone.
    fn listed(&self) -> usize {
        self.library.lock().unwrap().file_views().len()
    }

    fn in_store(&self, hash: &str) -> bool {
        self.library.lock().unwrap().file_view(hash).is_some_and(|f| f.exists)
    }
}

/// Tools with Pandoc, or nothing where it is not installed: the test is then passed over.
fn with_pandoc() -> Option<Tools> {
    let tools = tools::discover(&tools::Configured::default());
    if tools.pandoc.is_none() {
        crate::testing::passed_over("Pandoc is not installed");
        return None;
    }
    Some(tools)
}

fn write(path: &Path, content: impl AsRef<[u8]>) {
    fs::create_dir_all(path.parent().unwrap()).unwrap();
    fs::write(path, content).unwrap();
}

/// A small picture of one colour, as PNG: each colour its own file.
fn png(r: u8, g: u8, b: u8) -> Vec<u8> {
    let picture = image::DynamicImage::ImageRgb8(image::RgbImage::from_pixel(4, 3, image::Rgb([r, g, b])));
    let mut out = Cursor::new(Vec::new());
    picture.write_to(&mut out, image::ImageFormat::Png).unwrap();
    out.into_inner()
}

fn note<'a>(read: &'a ReadNotes, key: &str) -> &'a ReadNote {
    read.notes.iter().find(|n| n.key == key).unwrap_or_else(|| panic!("no note {key} in {:?}", keys(read)))
}

fn keys(read: &ReadNotes) -> Vec<&str> {
    read.notes.iter().map(|n| n.key.as_str()).collect()
}

/// The paragraphs of a note, each as its kind and its words.
fn paragraphs(note: &ReadNote) -> Vec<(String, String)> {
    note.blocks
        .iter()
        .filter_map(|b| match b {
            Block::Paragraph { name, content, .. } => Some((name.clone(), crate::document::plain(content))),
            _ => None,
        })
        .collect()
}

/// The words of a note with the mark they carry, where they carry one.
fn marked<'a>(note: &'a ReadNote, mark: &str) -> Vec<(&'a str, &'a serde_json::Value)> {
    let mut out = Vec::new();
    crate::document::walk(&note.blocks, &mut |_| {}, &mut |line| {
        for i in line {
            if let Inline::Text { text, marks } = i
                && let Some(value) = marks.get(mark)
            {
                out.push((text.as_str(), value));
            }
        }
    });
    out
}

fn figures(note: &ReadNote) -> Vec<&str> {
    note.blocks
        .iter()
        .filter_map(|b| match b {
            Block::Figure { file, .. } => Some(file.as_str()),
            _ => None,
        })
        .collect()
}

fn hash_of_named<'a>(note: &'a ReadNote, name: &str) -> &'a str {
    &note.held.iter().find(|h| h.file.name == name).unwrap_or_else(|| panic!("{name} is not held")).file.hash
}

// ---- telling them apart ----

#[test]
fn what_is_there_is_told_apart_and_counted() {
    let s = Setup::new();
    let desk = s.desk();
    let none = Tools::default();

    let vault = desk.join("Vault");
    write(&vault.join(".obsidian/app.json"), "{}");
    write(&vault.join("One.md"), "one");
    write(&vault.join("Folder/Two.markdown"), "two");
    write(&vault.join("Folder/Three.txt"), "three");
    write(&vault.join(".trash/Gone.md"), "gone");
    write(&vault.join("pictures/cat.png"), png(1, 2, 3));
    let look = look(&vault, &none).unwrap();
    assert_eq!((look.kind, look.name.as_str(), look.notes, look.attachments), (Kind::Obsidian, "Vault", 3, 1));
    assert_eq!(look.remarks.len(), 1, "without Pandoc, Markdown is not read: {:?}", look.remarks);

    let joplin = desk.join("Joplin");
    write(&joplin.join("_resources/a.png"), png(1, 2, 4));
    write(&joplin.join("_resources/b.pdf"), "%PDF");
    write(&joplin.join("Book/Note.md"), "x");
    let look = super::look(&joplin, &none).unwrap();
    assert_eq!((look.kind, look.notes, look.attachments), (Kind::Joplin, 1, 2));

    let notion = desk.join("Notion");
    write(&notion.join("Page 0123456789abcdef0123456789abcdef.md"), "x");
    assert_eq!(super::look(&notion, &none).unwrap().kind, Kind::Notion);

    let bear = desk.join("Bear");
    write(&bear.join("A note.textbundle/text.md"), "x");
    write(&bear.join("A note.textbundle/info.json"), "{}");
    write(&bear.join("A note.textbundle/assets/p.png"), png(1, 2, 5));
    write(&bear.join("Loose.md"), "y");
    let look = super::look(&bear, &none).unwrap();
    assert_eq!((look.kind, look.notes, look.attachments), (Kind::Bear, 2, 1));

    let plain = desk.join("Plain");
    write(&plain.join("a.txt"), "a");
    let look = super::look(&plain, &none).unwrap();
    assert_eq!((look.kind, look.notes, look.attachments), (Kind::Markdown, 1, 0));
    assert!(look.remarks.is_empty(), "text needs no Pandoc");
    let look = super::look(&plain.join("a.txt"), &none).unwrap();
    assert_eq!((look.kind, look.name.as_str(), look.notes), (Kind::Markdown, "a", 1));

    let enex = desk.join("Export.enex");
    write(&enex, evernote_export());
    let look = super::look(&enex, &none).unwrap();
    assert_eq!((look.kind, look.name.as_str(), look.notes, look.attachments), (Kind::Evernote, "Export", 2, 2));
    assert!(!look.remarks.is_empty(), "links between notes are not read");

    let takeout = desk.join("Takeout");
    keep_export(&takeout.join("Keep"));
    let look = super::look(&takeout, &none).unwrap();
    assert_eq!((look.kind, look.notes, look.attachments), (Kind::Keep, 3, 2));

    let onenote = desk.join("Notebook.one");
    write(&onenote, [0u8; 16]);
    let look = super::look(&onenote, &none).unwrap();
    assert_eq!((look.kind, look.notes), (Kind::Onenote, 0));
    assert!(look.remarks[0].contains("Word"), "{:?}", look.remarks);

    let empty = desk.join("Empty");
    write(&empty.join("paper.pdf"), "%PDF");
    let error = super::look(&empty, &none).unwrap_err();
    assert_eq!(error.kind(), "invalid");
    assert!(error.to_string().contains("holds no notes"), "{error}");
    assert_eq!(super::look(&empty.join("paper.pdf"), &none).unwrap_err().kind(), "invalid");
    assert!(super::look(&desk.join("nothing here"), &none).is_err());
}

#[test]
fn evernote_counts_tags_cut_by_the_pieces_it_is_read_in() {
    let s = Setup::new();
    let path = s.desk().join("Many.enex");
    // Enough notes that a tag falls on every border of the pieces it is read in.
    let one = "<note><title>x</title><content>y</content></note>\n";
    write(&path, format!("<en-export>{}</en-export>", one.repeat(5000)));
    assert_eq!(evernote::tally(&path).unwrap(), (5000, 0));
}

// ---- a folder of Markdown ----

#[test]
fn an_obsidian_vault_is_read_with_its_names_tags_pictures_files_and_links() {
    let Some(tools) = with_pandoc() else { return };
    let s = Setup::new();
    let vault = s.desk().join("Vault");
    write(&vault.join(".obsidian/app.json"), "{}");
    write(
        &vault.join("Inbox/First.md"),
        "---\ntags: [alpha, \"beta\"]\ncreated: 2024-05-06 07:08:09Z\nsource: https://example.org/article\n---\n\
         # The first note\n\
         Text with #inline/tag and [[Second]] and [[Second|other words]] and [[Third#Part]].\n\
         ![[cat.png|200]]\n\
         ![[paper.pdf]]\n\n\
         - [ ] open\n- [x] done\n\n\
         ## Within\n\n\
         [web](https://example.org/x) and [rel](../Notes/Third.md) and [Missing note](Nowhere.md)\n",
    );
    write(&vault.join("Notes/Second.md"), "Plain text of the second.\nAnother line.\n");
    write(&vault.join("Notes/Third.md"), "Back to [the first](../Inbox/First.md).\n\n![](missing.png)\n");
    write(&vault.join("attachments/cat.png"), png(200, 30, 30));
    write(&vault.join("attachments/paper.pdf"), "%PDF a paper");
    let bad = fs::File::create(vault.join("Notes/Bad.md")).unwrap();
    bad.set_len(crate::import::document::MAX_BYTES + 1).unwrap();

    let read = s.read(&vault, &tools);
    assert_eq!(keys(&read), ["Inbox/First.md", "Notes/Second.md", "Notes/Third.md"]);
    assert!(read.problems.iter().any(|p| p.contains("Bad.md")), "{:?}", read.problems);
    assert!(read.problems.iter().any(|p| p.contains("missing.png") && p.contains("Third")), "{:?}", read.problems);

    let first = note(&read, "Inbox/First.md");
    assert_eq!(first.name, "The first note");
    assert_eq!(first.made.as_deref(), Some("2024-05-06T07:08:09Z"));
    assert_eq!(first.tags, ["alpha", "beta", "inline/tag"]);
    assert_eq!(
        first.source,
        Some(Source { url: "https://example.org/article".into(), title: "The first note".into() })
    );
    let said = paragraphs(first);
    assert!(!said.iter().any(|(_, words)| words == "The first note"), "the name is taken off the text: {said:?}");
    assert!(said.contains(&("item".into(), "☐ open".into())) && said.contains(&("item".into(), "☒ done".into())));
    assert!(said.iter().any(|(_, w)| w.starts_with("Text with #inline/tag and Second and other words and Third#Part")));
    let bold = marked(first, "strong");
    assert_eq!(bold.iter().map(|(t, _)| *t).collect::<Vec<_>>(), ["Within"], "a heading within is a paragraph in bold");
    // Only the link to the web is a link still; a link to a note that is not there stays as it was.
    let links: Vec<&str> = marked(first, "link").iter().map(|(t, _)| *t).collect();
    assert_eq!(links, ["web", "Missing note"]);

    // The picture is a figure and held, as it is shown; the file is held and stands at the end.
    let cat = hash_of_named(first, "cat.png");
    let paper = hash_of_named(first, "paper.pdf");
    assert_eq!(first.held.len(), 2);
    let shown = first.held.iter().find(|h| h.file.hash == cat).unwrap().shown.as_ref().unwrap();
    assert_eq!(figures(first), [shown.hash.as_str()]);
    assert_eq!(first.attachments, [paper]);
    assert!(first.held.iter().all(|h| h.time.is_some()), "the files' own times");
    assert!(s.in_store(cat) && s.in_store(paper));
    assert_eq!(s.listed(), 0, "none of it in the library's lists");
    if let Some(Block::Figure { alt, .. }) = first.blocks.iter().find(|b| matches!(b, Block::Figure { .. })) {
        assert!(alt.is_empty(), "the size after the bar is not what the picture shows: {alt}");
    }

    assert_eq!(first.links, ["Notes/Second.md", "Notes/Third.md"]);
    let second = note(&read, "Notes/Second.md");
    assert_eq!(second.name, "Second");
    assert!(second.made.is_some(), "the file's own time");
    assert!(second.links.is_empty() && second.tags.is_empty() && second.source.is_none());
    assert_eq!(paragraphs(second), [("text".into(), "Plain text of the second. Another line.".into())]);
    if let Block::Paragraph { content, .. } = &second.blocks[0] {
        assert!(content.contains(&Inline::Break), "its lines are kept");
    }
    let third = note(&read, "Notes/Third.md");
    assert_eq!(third.links, ["Inbox/First.md"]);
    assert!(marked(third, "link").is_empty());
}

#[test]
fn joplin_notion_and_bear_are_read_as_they_export() {
    let Some(tools) = with_pandoc() else { return };
    let s = Setup::new();
    let desk = s.desk();

    // Joplin, with the lines before the text, and its files in `_resources`.
    let joplin = desk.join("Joplin");
    write(&joplin.join("_resources/photo.png"), png(10, 200, 10));
    write(&joplin.join("_resources/sheet.ods"), "PK sheet");
    write(
        &joplin.join("Journal/Day.md"),
        "---\ntitle: A day\nupdated: 2023-01-02 10:00:00Z\ncreated: 2023-01-01 09:30:00Z\nsource: https://example.org/day\n\
         tags:\n  - diary\n  - work\n---\n\n<img src=\":/abc\" />![A photo](../_resources/photo.png)\n\n\
         See [the sheet](../_resources/sheet.ods) and [Other](../Journal/Other.md).<br>Next line.\n",
    );
    write(&joplin.join("Journal/Other.md"), "---\ntitle: Other\n---\n\nThe other.\n");
    let read = s.read(&joplin, &tools);
    let day = note(&read, "Journal/Day.md");
    assert_eq!((day.name.as_str(), day.made.as_deref()), ("A day", Some("2023-01-01T09:30:00Z")));
    assert_eq!(day.tags, ["diary", "work"]);
    assert_eq!(day.source.as_ref().map(|s| s.url.as_str()), Some("https://example.org/day"));
    let photo = hash_of_named(day, "photo.png");
    let sheet = hash_of_named(day, "sheet.ods");
    assert_eq!(figures(day).len(), 1);
    assert_eq!(day.attachments, [sheet]);
    assert_eq!(day.links, ["Journal/Other.md"]);
    assert!(marked(day, "link").is_empty(), "the words of links to files and notes stay, without the mark");
    assert!(paragraphs(day).iter().any(|(_, w)| w.contains("See the sheet and Other.")));
    assert!(s.in_store(photo));
    assert!(read.problems.iter().any(|p| p.contains("abc") && p.contains("A day")), "{:?}", read.problems);

    // Notion: names with the long number after them, links as paths.
    let notion = desk.join("Notion");
    let one = "Page One 0123456789abcdef0123456789abcdef";
    let two = "Page Two fedcba9876543210fedcba9876543210";
    write(
        &notion.join(format!("{one}.md")),
        format!("# Page One\n\nGo to [Page Two]({}.md).\n", two.replace(' ', "%20")),
    );
    write(&notion.join(format!("{one}/{two}.md")), "Under the first.\n");
    let read = s.read(&notion, &tools);
    let first = note(&read, &format!("{one}.md"));
    assert_eq!(first.name, "Page One");
    assert_eq!(first.links, [format!("{one}/{two}.md")], "found by the name of its file, though it lies elsewhere");
    let second = note(&read, &format!("{one}/{two}.md"));
    assert_eq!(second.name, "Page Two", "the long number is taken off");
    write(
        &notion.join(format!("{one}.md")),
        format!("Go to [Page Two]({}/{}.md).\n", one.replace(' ', "%20"), two.replace(' ', "%20")),
    );
    let read = s.read(&notion, &tools);
    assert_eq!(note(&read, &format!("{one}.md")).links, [format!("{one}/{two}.md")]);
    assert_eq!(note(&read, &format!("{one}.md")).name, "Page One");

    // Bear: a TextBundle, its tags of several words, its picture in `assets`, its page in `info.json`.
    let bear = desk.join("Bear");
    write(
        &bear.join("Clip.textbundle/text.markdown"),
        "# Bear note\nWith #several words# and #one\n\n![](assets/pic.png)\n",
    );
    write(&bear.join("Clip.textbundle/assets/pic.png"), png(10, 10, 220));
    write(
        &bear.join("Clip.textbundle/info.json"),
        r#"{"version": 2, "net.shinyfrog.bear": {"sourceURL": "https://example.org/clip"}}"#,
    );
    let read = s.read(&bear, &tools);
    let clip = note(&read, "Clip.textbundle");
    assert_eq!(clip.name, "Bear note");
    assert_eq!(clip.tags, ["several words", "one"]);
    assert_eq!(clip.source.as_ref().map(|s| s.url.as_str()), Some("https://example.org/clip"));
    assert_eq!(figures(clip).len(), 1);
    assert!(clip.attachments.is_empty());
    assert!(paragraphs(clip).iter().any(|(_, w)| w.contains("#several words#")), "the tags stay in the text");
    assert_eq!(s.listed(), 0);
}

#[test]
fn a_file_of_text_is_read_as_a_folder_of_one_and_without_pandoc() {
    let s = Setup::new();
    let path = s.desk().join("Shopping.txt");
    write(&path, "#list milk\neggs\n\nbread");
    let none = Tools::default();
    let read = s.read(&path, &none);
    assert_eq!(keys(&read), ["Shopping.txt"]);
    let shopping = &read.notes[0];
    assert_eq!((shopping.name.as_str(), shopping.tags.as_slice()), ("Shopping", ["list".to_owned()].as_slice()));
    assert_eq!(paragraphs(shopping).len(), 2);
    assert!(shopping.made.is_some());

    // Markdown is not read without Pandoc, and the reading says why.
    let markdown = s.desk().join("Note.md");
    write(&markdown, "# Note\n");
    assert_eq!(s.read_with(&markdown, &none, &AtomicBool::new(false)).unwrap_err().kind(), "missing-program");
}

// ---- Evernote ----

fn evernote_export() -> String {
    let b64 = |bytes: &[u8]| base64::engine::general_purpose::STANDARD.encode(bytes);
    let picture = png(250, 200, 0);
    let paper = b"%PDF an attachment".to_vec();
    let hex = |bytes: &[u8]| {
        use md5::Digest;
        md5::Md5::digest(bytes).iter().map(|b| format!("{b:02x}")).collect::<String>()
    };
    format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE en-export SYSTEM "http://xml.evernote.com/pub/evernote-export4.dtd">
<en-export export-date="20240101T000000Z" application="Evernote" version="10">
  <note>
    <title>A clipped page</title>
    <created>20230401T102030Z</created>
    <tag>reading</tag>
    <tag>web</tag>
    <note-attributes><source-url>https://example.org/clipped</source-url></note-attributes>
    <content><![CDATA[<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd"><en-note><div><en-todo checked="true"/>Done&nbsp;it</div><div><en-todo/>Not yet</div><h2>Inside</h2><p>A <a href="https://example.org/link">link</a> and <a href="evernote:///view/1/s1/abc/abc/">another note</a>.</p><en-media hash="{picture_hash}" type="image/png"/><en-media hash="{paper_hash}" type="application/pdf"/><en-crypt hint="h">U2VjcmV0</en-crypt></en-note>]]></content>
    <resource><data encoding="base64">
{picture_data}
</data><mime>image/png</mime><resource-attributes><file-name>sun.png</file-name></resource-attributes></resource>
    <resource><data encoding="base64">{paper_data}</data><mime>application/pdf</mime><resource-attributes><file-name>paper.pdf</file-name></resource-attributes></resource>
  </note>
  <note>
    <title>Plain</title>
    <content><![CDATA[<en-note>Only words.</en-note>]]></content>
  </note>
</en-export>
"#,
        picture_hash = hex(&picture).to_uppercase(),
        paper_hash = hex(&paper),
        picture_data = b64(&picture),
        paper_data = b64(&paper),
    )
}

#[test]
fn an_evernote_export_is_read_with_its_pictures_and_files() {
    let Some(tools) = with_pandoc() else { return };
    let s = Setup::new();
    let path = s.desk().join("Export.enex");
    write(&path, evernote_export());
    let read = s.read(&path, &tools);
    assert_eq!(keys(&read), ["Export.enex#1", "Export.enex#2"]);
    let clipped = &read.notes[0];
    assert_eq!(clipped.name, "A clipped page");
    assert_eq!(clipped.made.as_deref(), Some("2023-04-01T10:20:30Z"));
    assert_eq!(clipped.tags, ["reading", "web"]);
    assert_eq!(
        clipped.source,
        Some(Source { url: "https://example.org/clipped".into(), title: "A clipped page".into() })
    );
    let said = paragraphs(clipped);
    assert!(said.iter().any(|(_, w)| w == "☒ Done it"), "{said:?}");
    assert!(said.iter().any(|(_, w)| w == "☐ Not yet"), "{said:?}");
    assert!(!said.iter().any(|(_, w)| w.contains("U2VjcmV0")), "what is encrypted is left out");
    assert_eq!(marked(clipped, "strong").iter().map(|(t, _)| *t).collect::<Vec<_>>(), ["Inside"]);
    assert_eq!(marked(clipped, "link").iter().map(|(t, _)| *t).collect::<Vec<_>>(), ["link"]);
    let sun = hash_of_named(clipped, "sun.png");
    let paper = hash_of_named(clipped, "paper.pdf");
    assert_eq!(figures(clipped).len(), 1);
    assert_eq!(clipped.attachments, [paper]);
    assert!(clipped.links.is_empty());
    assert!(s.in_store(sun) && s.in_store(paper));
    assert_eq!(s.listed(), 0);
    assert!(read.problems.iter().any(|p| p.contains("encrypted")), "{:?}", read.problems);

    let plain = &read.notes[1];
    assert_eq!((plain.name.as_str(), plain.made.as_deref()), ("Plain", None));
    assert_eq!(paragraphs(plain), [("text".into(), "Only words.".into())]);

    // An export that is no XML is said to be none.
    let broken = s.desk().join("Broken.enex");
    write(&broken, "<en-export><note>");
    let error = s.read_with(&broken, &tools, &AtomicBool::new(false)).unwrap_err();
    assert!(error.to_string().contains("Broken.enex"), "{error}");
}

// ---- Google Keep ----

fn keep_export(dir: &Path) {
    write(
        &dir.join("Groceries.json"),
        r#"{"color": "DEFAULT", "isTrashed": false, "isPinned": false, "isArchived": false,
            "listContent": [{"text": "Milk", "isChecked": true}, {"text": "Bread", "isChecked": false}],
            "title": "Groceries", "userEditedTimestampUsec": 1614859994000000,
            "createdTimestampUsec": 1614859994000000, "labels": [{"name": "home"}]}"#,
    );
    write(
        &dir.join("2021-03-04T12_13_14.000+01_00.json"),
        r#"{"isTrashed": false, "textContent": "First line\nSecond line\n\nNew paragraph", "title": "",
            "createdTimestampUsec": "1614859994000000",
            "annotations": [{"description": "", "source": "WEBLINK", "title": "A page", "url": "https://example.org/page"}],
            "attachments": [{"filePath": "photo.jpeg", "mimetype": "image/jpeg"}, {"filePath": "voice.3gp", "mimetype": "audio/3gpp"}],
            "labels": [{"name": "ideas"}, {"name": "ideas"}]}"#,
    );
    write(&dir.join("Gone.json"), r#"{"isTrashed": true, "textContent": "In the bin", "title": "Gone"}"#);
    write(&dir.join("Groceries.html"), "<html></html>");
    write(&dir.join("Labels.txt"), "home\nideas\n");
    write(&dir.join("photo.png"), png(5, 5, 5));
    write(&dir.join("voice.3gp"), "sound");
}

#[test]
fn google_keep_s_notes_are_read_without_pandoc() {
    let s = Setup::new();
    let takeout = s.desk().join("Takeout");
    keep_export(&takeout.join("Keep"));
    let read = s.read(&takeout, &Tools::default());
    assert_eq!(
        keys(&read),
        ["2021-03-04T12_13_14.000+01_00.json", "Groceries.json"],
        "the one in the bin is passed over"
    );
    assert!(read.problems.is_empty(), "{:?}", read.problems);

    let idea = &read.notes[0];
    assert_eq!(idea.name, "", "a note without a title has no name");
    assert_eq!(idea.made.as_deref(), Some("2021-03-04T12:13:14Z"));
    assert_eq!(idea.tags, ["ideas"]);
    assert_eq!(idea.source, Some(Source { url: "https://example.org/page".into(), title: "A page".into() }));
    assert!(matches!(idea.blocks[0], Block::Figure { .. }), "its picture first, as Keep shows it");
    assert_eq!(
        paragraphs(idea),
        [("text".into(), "First line Second line".into()), ("text".into(), "New paragraph".into())]
    );
    let voice = hash_of_named(idea, "voice.3gp");
    assert_eq!(idea.attachments, [voice]);
    assert_eq!(idea.held.len(), 2);

    let groceries = &read.notes[1];
    assert_eq!(groceries.name, "Groceries");
    assert_eq!(groceries.tags, ["home"]);
    assert_eq!(paragraphs(groceries), [("item".into(), "☒ Milk".into()), ("item".into(), "☐ Bread".into())]);
    assert_eq!(s.listed(), 0);
}

// ---- stopping, and what cannot be read ----

#[test]
fn a_reading_is_stopped_between_notes() {
    let s = Setup::new();
    let takeout = s.desk().join("Takeout");
    keep_export(&takeout.join("Keep"));
    let none = Tools::default();
    let error = s.read_with(&takeout, &none, &AtomicBool::new(true)).unwrap_err();
    assert_eq!(error.kind(), tools::STOPPED);

    // Stopped while it reads: told how far it came first.
    let stop = AtomicBool::new(false);
    let mut told: Vec<(usize, usize, String)> = Vec::new();
    let error = read(
        &takeout,
        &none,
        &s.library,
        &s.tmp.path().join("work"),
        &mut |done, total, name| {
            told.push((done, total, name.to_owned()));
            if done == 1 {
                stop.store(true, Ordering::Relaxed);
            }
        },
        &stop,
    )
    .unwrap_err();
    assert_eq!(error.kind(), tools::STOPPED);
    assert_eq!(told.iter().map(|t| (t.0, t.1)).collect::<Vec<_>>(), [(0, 3), (1, 3)]);

    // Read to its end, it says so.
    let mut told: Vec<(usize, usize)> = Vec::new();
    let read = read(
        &takeout,
        &none,
        &s.library,
        &s.tmp.path().join("work"),
        &mut |d, t, _| told.push((d, t)),
        &AtomicBool::new(false),
    )
    .unwrap();
    assert_eq!(read.notes.len(), 2);
    assert_eq!(told.last(), Some(&(2, 2)));
}

#[test]
fn a_note_that_cannot_be_read_is_said_and_the_rest_are_read() {
    let s = Setup::new();
    let dir = s.desk().join("Keep");
    keep_export(&dir);
    write(&dir.join("Broken.json"), "{ not whole");
    let read = s.read(&dir, &Tools::default());
    assert_eq!(read.notes.len(), 2);
    assert_eq!(read.problems.len(), 1);
    assert!(read.problems[0].contains("Broken.json"), "{:?}", read.problems);
}
