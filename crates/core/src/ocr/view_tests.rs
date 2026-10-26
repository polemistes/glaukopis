//! A file shown in a view: its facts, its pages drawn at a width in colour
//! and kept, and the lines of a page placed on it. With files made here;
//! the measures at the end are run by hand.

use std::path::{Path, PathBuf};
use std::sync::atomic::AtomicBool;

use lopdf::{Document, Object, dictionary};

use super::*;

fn never() -> AtomicBool {
    AtomicBool::new(false)
}

fn porson(dir: &Path) -> PathBuf {
    let pdf = dir.join("porson.pdf");
    std::fs::write(&pdf, fixture::porson_pdf()).unwrap();
    pdf
}

/// A PDF of pages of these sizes, in points, each with a red square near
/// its top left, and the numbers in print `labels` gives (`/PageLabels`).
fn red_pages(sizes: &[(i64, i64)], labels: Option<Object>) -> Vec<u8> {
    let mut doc = Document::with_version("1.5");
    let pages_id = doc.new_object_id();
    let mut kids: Vec<Object> = Vec::new();
    for (width, height) in sizes {
        let square = format!("1 0 0 rg 20 {} 100 100 re f\n", height - 120);
        let content = doc.add_object(lopdf::Stream::new(dictionary! {}, square.into_bytes()));
        let page = doc.add_object(dictionary! {
            "Type" => "Page",
            "Parent" => pages_id,
            "Contents" => content,
            "MediaBox" => vec![0.into(), 0.into(), (*width).into(), (*height).into()],
        });
        kids.push(page.into());
    }
    let count = kids.len() as i64;
    doc.objects
        .insert(pages_id, Object::Dictionary(dictionary! { "Type" => "Pages", "Kids" => kids, "Count" => count }));
    let mut catalog = dictionary! { "Type" => "Catalog", "Pages" => pages_id };
    if let Some(labels) = labels {
        catalog.set("PageLabels", labels);
    }
    let catalog = doc.add_object(catalog);
    doc.trailer.set("Root", catalog);
    let mut out = Vec::new();
    doc.save_to(&mut out).unwrap();
    out
}

/// A PNG in colour, its width and height.
fn colour_of(png: &[u8]) -> image::RgbImage {
    assert!(png.starts_with(b"\x89PNG\r\n\x1a\n"), "a PNG");
    let picture = image::load_from_memory(png).unwrap();
    assert_eq!(picture.color(), image::ColorType::Rgb8, "in colour");
    picture.into_rgb8()
}

fn drawn(pages: &[PageDrawn]) -> Vec<(usize, image::RgbImage)> {
    pages.iter().map(|(index, png)| (*index, colour_of(png.as_ref().unwrap()))).collect()
}

/// A page of the fixture drawn 600 wide is a PNG in colour of that width,
/// as high as the page's shape makes it; red is drawn red.
#[test]
fn a_page_is_drawn_at_a_width_in_colour() {
    let tmp = tempfile::tempdir().unwrap();
    let work = tmp.path().join("work");
    let pdf = porson(tmp.path());
    let pages = pages_at(&pdf, &Tools::default(), &work, None, &[0], 600, &never()).unwrap();
    let pages = drawn(&pages);
    assert_eq!(pages.len(), 1);
    // 400 by 360 points.
    assert_eq!((pages[0].0, pages[0].1.dimensions()), (0, (600, 540)));
    let dark = pages[0].1.pixels().filter(|p| p.0.iter().all(|c| *c < 100)).count();
    assert!(dark > 100, "the letters are drawn: {dark}");

    let red = tmp.path().join("red.pdf");
    std::fs::write(&red, red_pages(&[(595, 842), (842, 595)], None)).unwrap();
    let pages = drawn(&pages_at(&red, &Tools::default(), &work, None, &[1, 0], 300, &never()).unwrap());
    assert_eq!(pages.iter().map(|(i, p)| (*i, p.dimensions())).collect::<Vec<_>>(), [(1, (300, 212)), (0, (300, 425))]);
    // The square, 100 points from the top left, at 300 / 595 of a dot a point.
    let [r, g, b] = pages[1].1.get_pixel(30, 30).0;
    assert!(r > 200 && g < 60 && b < 60, "red: {r} {g} {b}");
    assert_eq!(pages[1].1.get_pixel(250, 300).0, [255, 255, 255], "white elsewhere");
}

/// Pages asked for are given in the order asked, each once, those the file
/// has; asked to stop, it says so; what is not a PDF is not drawn.
#[test]
fn the_pages_asked_for_are_given_in_their_order() {
    let tmp = tempfile::tempdir().unwrap();
    let work = tmp.path().join("work");
    let pdf = tmp.path().join("three.pdf");
    std::fs::write(&pdf, red_pages(&[(595, 842), (842, 595), (420, 595)], None)).unwrap();
    let pages = pages_at(&pdf, &Tools::default(), &work, None, &[2, 0, 7, 0], 120, &never()).unwrap();
    assert_eq!(pages.iter().map(|(i, _)| *i).collect::<Vec<_>>(), [2, 0]);
    assert!(pages_at(&pdf, &Tools::default(), &work, None, &[], 120, &never()).unwrap().is_empty());
    let stopped = pages_at(&pdf, &Tools::default(), &work, None, &[0], 120, &AtomicBool::new(true)).unwrap_err();
    assert_eq!(stopped.kind(), tools::STOPPED);
    let text = tmp.path().join("text.pdf");
    std::fs::write(&text, "no PDF").unwrap();
    assert!(pages_at(&text, &Tools::default(), &work, None, &[0], 120, &never()).is_err());
}

/// A page drawn is kept, and asked for again it is taken from the cache,
/// not drawn: a page put there by hand is what comes back. At another width
/// it is drawn anew, and so it is when the file changes.
#[test]
fn a_page_drawn_is_kept_and_taken_from_the_cache() {
    let tmp = tempfile::tempdir().unwrap();
    let work = tmp.path().join("work");
    let cache = tmp.path().join("cache");
    let pdf = tmp.path().join("red.pdf");
    std::fs::write(&pdf, red_pages(&[(595, 842), (595, 842)], None)).unwrap();
    let first = pages_at(&pdf, &Tools::default(), &work, Some(&cache), &[0, 1], 200, &never()).unwrap();
    let key = pages_cache::key_of(&pdf).unwrap();
    assert_eq!(pages_cache::get(&cache, &key, 1, 200).as_ref(), first[0].1.as_ref().ok());
    assert_eq!(pages_cache::get(&cache, &key, 2, 200).as_ref(), first[1].1.as_ref().ok());

    // Put there by hand: a page of one dot, which no drawing gives.
    let mut dot = std::io::Cursor::new(Vec::new());
    image::RgbImage::new(1, 1).write_to(&mut dot, image::ImageFormat::Png).unwrap();
    let dot = dot.into_inner();
    pages_cache::put(&cache, &key, 2, 200, &dot);
    let again = pages_at(&pdf, &Tools::default(), &work, Some(&cache), &[1, 0], 200, &never()).unwrap();
    assert_eq!(again[0], (1, Ok(dot.clone())));
    assert_eq!(again[1], first[0]);
    let wider = pages_at(&pdf, &Tools::default(), &work, Some(&cache), &[1], 300, &never()).unwrap();
    assert_eq!(colour_of(wider[0].1.as_ref().unwrap()).width(), 300);

    // Changed, it is another file.
    std::fs::write(&pdf, red_pages(&[(595, 842), (842, 595)], None)).unwrap();
    let changed = pages_at(&pdf, &Tools::default(), &work, Some(&cache), &[1], 200, &never()).unwrap();
    assert_eq!(colour_of(changed[0].1.as_ref().unwrap()).dimensions(), (200, 141));
}

/// The lines of the fixture's page, as translated, in the order they stand,
/// each placed within the page; past its pages, none.
#[test]
fn the_lines_of_a_page_are_placed_on_it() {
    let tmp = tempfile::tempdir().unwrap();
    let work = tmp.path().join("work");
    let pdf = porson(tmp.path());
    let page = page_lines(&pdf, &Tools::default(), &work, 0).unwrap();
    assert_eq!((page.number, page.label.as_str(), page.width, page.height), (1, "1", 400.0, 360.0));
    assert!(page.translated);
    let texts: Vec<&str> = page.lines.iter().map(|l| l.text.trim()).collect();
    assert_eq!(texts, fixture::LINES.map(|l| l.trim()));
    let mut above = 0.0;
    for line in &page.lines {
        assert!(0.0 <= line.left && line.left < line.right && line.right <= 400.0, "{line:?}");
        assert!(above <= line.top && line.top < line.bottom && line.bottom <= 360.0, "{line:?}");
        above = line.top;
    }
    // The first line stands 40 points from the left, its foot 60 from the top.
    let first = &page.lines[0];
    assert!((first.left - 40.0).abs() < 1.0 && (first.bottom - 60.0).abs() < 4.0, "{first:?}");
    let past = page_lines(&pdf, &Tools::default(), &work, 1).unwrap_err();
    assert_eq!(past.to_string(), tr!("ocr-no-such-page", page = 2, pages = 1));

    // A page without text has no lines.
    let red = tmp.path().join("red.pdf");
    std::fs::write(&red, red_pages(&[(595, 842)], None)).unwrap();
    let page = page_lines(&red, &Tools::default(), &work, 0).unwrap();
    assert!(page.lines.is_empty() && !page.translated);
    assert_eq!((page.width, page.height), (595.0, 842.0));
}

/// Shown turned a quarter, the page is as wide as it was high, and its
/// lines stand where the turned page has them: down its right side.
#[test]
fn the_lines_of_a_turned_page_are_turned_with_it() {
    let tmp = tempfile::tempdir().unwrap();
    let work = tmp.path().join("work");
    let pdf = porson(tmp.path());
    let mut doc = Document::load(&pdf).unwrap();
    let id = doc.get_pages()[&1];
    doc.get_dictionary_mut(id).unwrap().set("Rotate", 90);
    doc.save(&pdf).unwrap();
    let page = page_lines(&pdf, &Tools::default(), &work, 0).unwrap();
    assert_eq!((page.width, page.height), (360.0, 400.0));
    assert_eq!(page.lines.len(), fixture::LINES.len());
    for line in &page.lines {
        assert!(line.bottom - line.top > line.right - line.left, "upright: {line:?}");
        assert!(line.left > 180.0 && line.right <= 360.0, "at the right: {line:?}");
        assert!((line.top - 40.0).abs() < 1.0, "from the top, where it began at the left: {line:?}");
    }
    let facts = file_facts(&pdf, &Tools::default(), &work).unwrap();
    assert_eq!(facts.sizes, [(360.0, 400.0)]);
}

/// What a view needs of a file: of the fixture, one page of its size; of a
/// file with numbers in print, those; of a picture, its one page in its
/// pixels; of a file that asks for a password, that.
#[test]
fn the_facts_of_a_file() {
    let tmp = tempfile::tempdir().unwrap();
    let work = tmp.path().join("work");
    let tools = Tools::default();
    let facts = file_facts(&porson(tmp.path()), &tools, &work).unwrap();
    assert_eq!(
        facts,
        FileFacts { picture: false, pages: 1, sizes: vec![(400.0, 360.0)], labels: vec!["1".into()], locked: false }
    );

    let numbered = tmp.path().join("numbered.pdf");
    let labels = dictionary! { "Nums" => vec![
        0.into(), Object::Dictionary(dictionary! { "S" => "r" }),
        2.into(), Object::Dictionary(dictionary! { "S" => "D" }),
    ] };
    std::fs::write(&numbered, red_pages(&[(595, 842), (595, 842), (842, 595)], Some(Object::Dictionary(labels))))
        .unwrap();
    let facts = file_facts(&numbered, &tools, &work).unwrap();
    assert_eq!((facts.pages, facts.labels.as_slice()), (3, &["i".to_owned(), "ii".into(), "1".into()][..]));
    assert_eq!(facts.sizes, [(595.0, 842.0), (595.0, 842.0), (842.0, 595.0)]);

    let picture = tmp.path().join("picture.png");
    image::RgbImage::new(30, 20).save(&picture).unwrap();
    let facts = file_facts(&picture, &tools, &work).unwrap();
    assert_eq!(
        facts,
        FileFacts { picture: true, pages: 1, sizes: vec![(30.0, 20.0)], labels: vec!["1".into()], locked: false }
    );

    // Locked with a password to open it.
    let mut doc = Document::load_mem(&fixture::porson_pdf()).unwrap();
    let id = Object::String(b"0123456789abcdef".to_vec(), lopdf::StringFormat::Hexadecimal);
    doc.trailer.set("ID", vec![id.clone(), id]);
    let version = lopdf::EncryptionVersion::V2 {
        document: &doc,
        owner_password: "owner",
        user_password: "user",
        key_length: 128,
        permissions: lopdf::Permissions::default(),
    };
    let state = lopdf::EncryptionState::try_from(version).unwrap();
    doc.encrypt(&state).unwrap();
    let locked = tmp.path().join("locked.pdf");
    doc.save(&locked).unwrap();
    let facts = file_facts(&locked, &tools, &work).unwrap();
    assert!(facts.locked && !facts.picture, "{facts:?}");

    let text = tmp.path().join("text.pdf");
    std::fs::write(&text, "no PDF").unwrap();
    assert!(file_facts(&text, &tools, &work).is_err());
}

/// How long a view waits, measured on files made here and on the fixtures
/// of the end-to-end scripts: the look at a file (`seen_of`, which reads its
/// text), opening it for its pages alone (`facts_of`), and a page drawn
/// 1600 wide the first time and from the cache. Run by hand:
/// `cargo test -p glaukopis-core --release measure_a_file_in_a_view -- --ignored --nocapture`.
#[test]
#[ignore]
fn measure_a_file_in_a_view() {
    use std::time::Instant;
    let tmp = tempfile::tempdir().unwrap();
    let work = tmp.path().join("work");
    let cache = tmp.path().join("cache");
    let tools = crate::export::tools::discover(&crate::export::tools::Configured::default());
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
    let mut files: Vec<PathBuf> =
        ["porson.pdf", "shape.pdf", "structure.pdf"].iter().map(|f| root.join("e2e/fixtures").join(f)).collect();
    files.push(porson(tmp.path()));
    // A book of four hundred pages of text, set by Typst where it is installed.
    if let Some(typst) = crate::export::tools::find("typst", None, &[]) {
        let source = tmp.path().join("book.typ");
        let paragraph = "The wrath of Achilles is the subject of the Iliad, and Homer sings of the quarrel \
                         between the king and the hero, and of all that came of it. "
            .repeat(6);
        let mut text = String::from("#set page(paper: \"a5\", numbering: \"i\")\n#set text(size: 10pt)\n");
        for chapter in 1..=40 {
            text.push_str(&format!("= Chapter {chapter}\n"));
            for _ in 0..30 {
                text.push_str(&paragraph);
                text.push_str("\n\n");
            }
        }
        std::fs::write(&source, text).unwrap();
        let book = tmp.path().join("book.pdf");
        let args = ["compile".to_owned(), source.display().to_string(), book.display().to_string()];
        tools::run(&typst, "Typst", &args, None, None).unwrap();
        files.push(book);
    }
    for file in &files {
        let size = checked_pdf(file).unwrap();
        let started = Instant::now();
        let seen = child::look(file, size, tools.pdftoppm.as_ref()).unwrap();
        let looked = started.elapsed();
        let started = Instant::now();
        let facts = facts_of(file, size, tools.pdftoppm.as_ref(), &work).unwrap();
        let opened = started.elapsed();
        let started = Instant::now();
        let first = pages_at(file, &tools, &work, Some(&cache), &[0], 1600, &never()).unwrap();
        let drawn = started.elapsed();
        let started = Instant::now();
        let again = pages_at(file, &tools, &work, Some(&cache), &[0], 1600, &never()).unwrap();
        let kept = started.elapsed();
        assert_eq!(first, again);
        let middle = facts.frames.len() / 2;
        let started = Instant::now();
        let several =
            pages_at(file, &tools, &work, Some(&cache), &[middle, middle + 1, middle + 2], 1600, &never()).unwrap();
        let three = started.elapsed();
        let png = first[0].1.as_ref().map(Vec::len).unwrap_or(0);
        println!(
            "{}: {} bytes, {} pages; look {looked:?}; opened for its pages {opened:?}; page 1 at 1600 drawn {drawn:?} ({png} bytes), from the cache {kept:?}; three pages from the middle {three:?} ({} drawn)",
            file.file_name().unwrap().to_string_lossy(),
            size,
            seen.layer.pages.len().max(facts.frames.len()),
            several.iter().filter(|(_, r)| r.is_ok()).count(),
        );
    }
}
