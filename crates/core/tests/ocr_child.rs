//! A PDF is taken apart only in a process of its own (`src/ocr/child.rs`):
//! the look at it, the drawing of its pages, Tesseract's reading of them and
//! the writing of the file made searchable. Here the parent's own functions
//! are called, as the application calls them, with the child set; a file
//! that makes lopdf or hayro take memory without end ends the child, with an
//! error that says so, and never this process.

use std::io::Write as _;
use std::path::{Path, PathBuf};
use std::sync::Once;
use std::sync::atomic::AtomicBool;

use glaukopis_core::export::tools::{self, Configured, Tools};
use glaukopis_core::ocr::{self, Asked, Progress, TextChoice};
use glaukopis_core::tr;
use lopdf::{Document, Object, Stream, dictionary};

/// The child, set once for every test of this file.
fn with_child() {
    static SET: Once = Once::new();
    SET.call_once(|| glaukopis_core::isolated::set_program(PathBuf::from(env!("CARGO_BIN_EXE_glaukopis-isolated"))));
}

fn passed_over(why: &str) {
    if std::env::var_os("GLAUKOPIS_TESTS_NEED_ALL").is_some_and(|v| !v.is_empty() && v != "0") {
        panic!("{why}, and GLAUKOPIS_TESTS_NEED_ALL says every test must be run");
    }
    eprintln!("{why}; the test is passed over");
}

/// Tesseract with English, where it is installed.
fn reading_tools() -> Option<Tools> {
    let tools = tools::discover(&Configured::default());
    if tools.tesseract.is_none() || !tools.ocr_languages.iter().any(|l| l == "eng") {
        passed_over("Tesseract with English is not installed");
        return None;
    }
    Some(tools)
}

fn never() -> AtomicBool {
    AtomicBool::new(false)
}

fn english() -> Asked {
    Asked { languages: vec!["eng".into()], ..Asked::default() }
}

/// What this process holds in memory, in bytes.
#[cfg(target_os = "linux")]
fn resident() -> u64 {
    let statm = std::fs::read_to_string("/proc/self/statm").unwrap();
    let pages: u64 = statm.split_whitespace().nth(1).unwrap().parse().unwrap();
    pages * 4096
}

/// Fails where this process has come to hold much more memory than `before`:
/// the file was taken apart here.
fn held_little(before: u64) {
    #[cfg(target_os = "linux")]
    {
        let now = resident();
        assert!(now < before + (300 << 20), "this process went from {before} to {now} bytes");
    }
    #[cfg(not(target_os = "linux"))]
    let _ = before;
}

fn before() -> u64 {
    #[cfg(target_os = "linux")]
    {
        resident()
    }
    #[cfg(not(target_os = "linux"))]
    0
}

/// Packed data, as Flate packs it, that unpacks to `sixteenths` times 16 MiB
/// of noughts: some 16 kB of the file for each 16 MiB unpacked. Packing
/// stops at a flush after each 16 MiB, and the packing of noughts after
/// noughts is then the same each time; so it is made once and repeated, and
/// the stream is ended by hand, with the checksum of what it unpacks to.
fn packed_noughts(sixteenths: usize) -> Vec<u8> {
    let chunk = vec![0u8; 16 << 20];
    let mut packer = flate2::write::ZlibEncoder::new(Vec::new(), flate2::Compression::best());
    let mut ends = Vec::new();
    for _ in 0..3 {
        packer.write_all(&chunk).unwrap();
        packer.flush().unwrap();
        ends.push(packer.get_ref().len());
    }
    let made = packer.get_ref().clone();
    let (first, again, more) = (&made[..ends[0]], &made[ends[0]..ends[1]], &made[ends[1]..ends[2]]);
    assert_eq!(again, more, "the packing of noughts after noughts is the same each time");
    let mut out = first.to_vec();
    for _ in 1..sixteenths {
        out.extend_from_slice(again);
    }
    // The last block, empty and stored, and Adler-32 of so many noughts.
    out.extend_from_slice(&[0x01, 0x00, 0x00, 0xff, 0xff]);
    let length = (sixteenths as u64) * (16 << 20);
    let adler = ((length % 65521) << 16) | 1;
    out.extend_from_slice(&(adler as u32).to_be_bytes());
    out
}

/// A PDF of one page, with `extra` objects beside it, and its content as given.
fn one_page(content: Stream, extra: Vec<Object>) -> Vec<u8> {
    let mut doc = Document::with_version("1.5");
    let pages_id = doc.new_object_id();
    let content = doc.add_object(content);
    let page = doc.add_object(dictionary! {
        "Type" => "Page",
        "Parent" => pages_id,
        "Contents" => content,
        "MediaBox" => vec![0.into(), 0.into(), 400.into(), 360.into()],
    });
    doc.objects.insert(
        pages_id,
        Object::Dictionary(dictionary! { "Type" => "Pages", "Kids" => vec![page.into()], "Count" => 1 }),
    );
    let catalog = doc.add_object(dictionary! { "Type" => "Catalog", "Pages" => pages_id });
    doc.trailer.set("Root", catalog);
    for object in extra {
        doc.add_object(object);
    }
    let mut out = Vec::new();
    doc.save_to(&mut out).unwrap();
    out
}

/// A page whose content unpacks to 4 GiB: hayro unpacks it whole to draw it.
fn drawing_without_end(dir: &Path) -> PathBuf {
    let content = Stream::new(dictionary! { "Filter" => "FlateDecode" }, packed_noughts(256)).with_compression(false);
    let path = dir.join("drawing without end.pdf");
    std::fs::write(&path, one_page(content, Vec::new())).unwrap();
    path
}

/// A file with an object stream that unpacks to 4 GiB: lopdf unpacks it as
/// it loads the file. Written by hand, since lopdf leaves object streams out
/// of what it writes.
fn loading_without_end(dir: &Path) -> PathBuf {
    let packed = packed_noughts(256);
    let mut objects: Vec<Vec<u8>> = vec![
        b"<< /Type /Catalog /Pages 2 0 R >>".to_vec(),
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>".to_vec(),
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 360] /Contents 4 0 R >>".to_vec(),
        b"<< /Length 14 >>\nstream\n0 0 m 1 1 l S\n\nendstream".to_vec(),
    ];
    let mut stream =
        format!("<< /Type /ObjStm /N 1 /First 4 /Filter /FlateDecode /Length {} >>\nstream\n", packed.len())
            .into_bytes();
    stream.extend_from_slice(&packed);
    stream.extend_from_slice(b"\nendstream");
    objects.push(stream);
    let mut out = b"%PDF-1.5\n".to_vec();
    let mut offsets = Vec::new();
    for (n, object) in objects.iter().enumerate() {
        offsets.push(out.len());
        out.extend_from_slice(format!("{} 0 obj\n", n + 1).as_bytes());
        out.extend_from_slice(object);
        out.extend_from_slice(b"\nendobj\n");
    }
    let xref = out.len();
    out.extend_from_slice(format!("xref\n0 {}\n0000000000 65535 f \n", objects.len() + 1).as_bytes());
    for offset in offsets {
        out.extend_from_slice(format!("{offset:010} 00000 n \n").as_bytes());
    }
    out.extend_from_slice(
        format!("trailer\n<< /Size {} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n", objects.len() + 1).as_bytes(),
    );
    let path = dir.join("loading without end.pdf");
    std::fs::write(&path, out).unwrap();
    path
}

fn memory_error(file: &Path) -> String {
    tr!("ocr-child-memory", file = &file.file_name().unwrap().to_string_lossy().into_owned())
}

#[test]
fn a_pdf_is_looked_at_in_the_child() {
    with_child();
    let porson = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../e2e/fixtures/porson.pdf");
    let looked = ocr::look(&porson, &Tools::default()).unwrap();
    assert_eq!((looked.pages, looked.with_text, looked.searchable, looked.locked), (1, 1, true, false));
    assert!(!looked.schemes.is_empty(), "{looked:?}");
    let pages = ocr::text_of_pages(&porson, 0, 5).unwrap();
    assert_eq!(pages.len(), 1);
    assert!(pages[0].translated.is_some(), "{pages:?}");
}

#[test]
fn a_page_that_draws_without_end_ends_the_child_and_not_the_application() {
    with_child();
    let dir = tempfile::tempdir().unwrap();
    let pdf = drawing_without_end(dir.path());
    let before = before();
    // Looked at, it has a page, without text: its content is too large to be read for text.
    let looked = ocr::look(&pdf, &Tools::default()).unwrap();
    assert_eq!((looked.pages, looked.with_text), (1, 0));
    held_little(before);
    let Some(tools) = reading_tools() else { return };
    let work = dir.path().join("work");
    let err = ocr::read_pdf(&pdf, &tools, &work, &english(), None, &mut |_| {}, &never()).unwrap_err();
    assert_eq!(err.to_string(), memory_error(&pdf));
    held_little(before);
    let err = ocr::make_searchable(&pdf, &tools, &work, &english(), &mut |_| {}, &never()).unwrap_err();
    assert_eq!(err.to_string(), memory_error(&pdf));
    held_little(before);
    // What was made on the way is gone.
    assert_eq!(std::fs::read_dir(&work).map(|d| d.count()).unwrap_or(0), 0);
}

/// A file shown in a view, in the child: the facts of the fixture, its page
/// drawn in colour, its lines; a page that draws without end says so in its
/// place, and the child, not the application, ends.
#[test]
fn a_file_is_shown_from_the_child() {
    with_child();
    let dir = tempfile::tempdir().unwrap();
    let work = dir.path().join("work");
    let porson = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../e2e/fixtures/porson.pdf");
    let facts = ocr::file_facts(&porson, &Tools::default(), &work).unwrap();
    assert_eq!((facts.pages, facts.sizes.as_slice(), facts.locked), (1, &[(400.0, 360.0)][..], false));
    let pages = ocr::pages_at(&porson, &Tools::default(), &work, None, &[0], 600, &never()).unwrap();
    let picture = image::load_from_memory(pages[0].1.as_ref().unwrap()).unwrap();
    assert_eq!((picture.color(), picture.width(), picture.height()), (image::ColorType::Rgb8, 600, 540));
    let lines = ocr::page_lines(&porson, &Tools::default(), &work, 0).unwrap();
    assert_eq!(lines.lines.len(), 4);

    let pdf = drawing_without_end(dir.path());
    let before = before();
    let facts = ocr::file_facts(&pdf, &Tools::default(), &work).unwrap();
    assert_eq!(facts.pages, 1);
    let pages = ocr::pages_at(&pdf, &Tools::default(), &work, None, &[0, 1], 600, &never()).unwrap();
    assert_eq!(pages, [(0, Err(memory_error(&pdf)))]);
    held_little(before);
    // What was made on the way is gone; the fixture is still served, and
    // its folder lives with the child that serves it.
    let left: Vec<String> = std::fs::read_dir(&work)
        .into_iter()
        .flatten()
        .flatten()
        .map(|entry| entry.file_name().to_string_lossy().into_owned())
        .collect();
    assert!(left.iter().all(|name| name.starts_with("served-")) && left.len() <= 1, "{left:?}");
    assert!(ocr::server::serving(&porson).is_some());
    assert_eq!(ocr::server::serving(&pdf), None, "the child that drew without end is gone");
}

/// How long a view waits with the child, as the application has it: the
/// facts of a book of 364 pages set by Typst (the child opens it, and reads
/// its text for the numbers in print), a page drawn 1600 wide the first
/// time and from the cache, and the lines of a page. Run by hand:
/// `cargo test -p glaukopis-core --release --test ocr_child measure -- --ignored --nocapture`.
#[test]
#[ignore]
fn measure_a_file_shown_from_the_child() {
    use std::time::Instant;
    with_child();
    let Some(typst) = tools::find("typst", None, &[]) else {
        passed_over("The program Typst is not installed");
        return;
    };
    let dir = tempfile::tempdir().unwrap();
    let (work, cache) = (dir.path().join("work"), dir.path().join("cache"));
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
    std::fs::write(dir.path().join("book.typ"), text).unwrap();
    let book = dir.path().join("book.pdf");
    let ran = std::process::Command::new(&typst).arg("compile").arg(dir.path().join("book.typ")).arg(&book).status();
    assert!(ran.unwrap().success());
    let porson = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../e2e/fixtures/porson.pdf");
    let structure = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../e2e/fixtures/structure.pdf");
    let tools = tools::discover(&Configured::default());
    for file in [&porson, &structure, &book] {
        let started = Instant::now();
        let facts = ocr::file_facts(file, &tools, &work).unwrap();
        let facts_took = started.elapsed();
        let started = Instant::now();
        let first = ocr::pages_at(file, &tools, &work, Some(&cache), &[0], 1600, &never()).unwrap();
        let drawn = started.elapsed();
        let started = Instant::now();
        let again = ocr::pages_at(file, &tools, &work, Some(&cache), &[0], 1600, &never()).unwrap();
        let kept = started.elapsed();
        assert_eq!(first, again);
        let six: Vec<usize> = (facts.pages / 2..facts.pages / 2 + 6).collect();
        let started = Instant::now();
        ocr::pages_at(file, &tools, &work, Some(&cache), &six, 1600, &never()).unwrap();
        let several = started.elapsed();
        let started = Instant::now();
        let lines = ocr::page_lines(file, &tools, &work, facts.pages - 1).unwrap();
        let lines_took = started.elapsed();
        println!(
            "{}: {} pages; facts {facts_took:?}; page 1 at 1600 {drawn:?}, from the cache {kept:?}; six pages from the middle {several:?}; lines of the last page {lines_took:?} ({} lines, labelled {})",
            file.file_name().unwrap().to_string_lossy(),
            facts.pages,
            lines.lines.len(),
            lines.label,
        );
    }
}

#[test]
fn a_file_that_loads_without_end_ends_the_child_and_not_the_application() {
    with_child();
    let dir = tempfile::tempdir().unwrap();
    let pdf = loading_without_end(dir.path());
    let before = before();
    // On Windows the child's job refuses the memory itself: the libraries
    // unpack with a reading that fails without aborting when it is refused,
    // and give up the stream that would not unpack, so that the child answers
    // within its bound with what is left, a page without text. Elsewhere the
    // child is watched from outside, and killed when it holds too much.
    if cfg!(windows)
        && let Ok(looked) = ocr::look(&pdf, &Tools::default())
    {
        assert_eq!((looked.pages, looked.with_text), (1, 0), "{looked:?}");
        return;
    }
    let err = ocr::look(&pdf, &Tools::default()).unwrap_err();
    assert_eq!(err.to_string(), memory_error(&pdf));
    held_little(before);
    let err = ocr::text_of_pages(&pdf, 0, 5).unwrap_err();
    assert_eq!(err.to_string(), memory_error(&pdf));
    let err = ocr::make_searchable(&pdf, &Tools::default(), dir.path(), &english(), &mut |_| {}, &never()).unwrap_err();
    assert_eq!(err.to_string(), memory_error(&pdf));
    held_little(before);
}

/// A look at one file does not keep a look at another waiting: what was
/// seen last is kept, but its lock is not held while the child works.
#[test]
fn a_file_is_looked_at_while_another_is_read() {
    with_child();
    let dir = tempfile::tempdir().unwrap();
    let slow = loading_without_end(dir.path());
    let porson = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../e2e/fixtures/porson.pdf");
    let (slow_done, porson_done) = std::thread::scope(|scope| {
        let slow = scope.spawn(|| {
            let _ = ocr::look(&slow, &Tools::default());
            std::time::Instant::now()
        });
        std::thread::sleep(std::time::Duration::from_millis(100));
        ocr::look(&porson, &Tools::default()).unwrap();
        let porson_done = std::time::Instant::now();
        (slow.join().unwrap(), porson_done)
    });
    assert!(porson_done < slow_done, "the look at a small file waited for the look at a large one");
}

/// A scan, made by Typst: a PDF whose only content is a picture of a page of text.
fn scan(dir: &Path) -> Option<PathBuf> {
    let Some(typst) = tools::find("typst", None, &[]) else {
        passed_over("The program Typst is not installed");
        return None;
    };
    let page = "#set page(width: 150mm, height: 100mm, margin: 14mm)\n#set text(size: 12pt)\n\
                The wrath of Achilles is the subject of the Iliad.\n\n\
                Many scholars have written of the poem since then; the oral theory of Milman Parry changed the field.\n";
    std::fs::write(dir.join("page.typ"), page).unwrap();
    let png = dir.join("page.png");
    let ran = std::process::Command::new(&typst)
        .args(["compile", "--ppi", "300"])
        .arg(dir.join("page.typ"))
        .arg(&png)
        .status()
        .unwrap();
    assert!(ran.success());
    std::fs::write(
        dir.join("scan.typ"),
        "#set page(width: 150mm, height: 100mm, margin: 0pt)\n#image(\"page.png\", width: 100%, height: 100%)\n",
    )
    .unwrap();
    let pdf = dir.join("scan.pdf");
    let ran = std::process::Command::new(&typst).arg("compile").arg(dir.join("scan.typ")).arg(&pdf).status().unwrap();
    assert!(ran.success());
    Some(pdf)
}

#[test]
fn a_scan_is_read_and_made_searchable_in_the_child_page_by_page() {
    with_child();
    let Some(tools) = reading_tools() else { return };
    let dir = tempfile::tempdir().unwrap();
    let Some(pdf) = scan(dir.path()) else { return };
    let work = dir.path().join("work");

    let mut told: Vec<Progress> = Vec::new();
    let read = ocr::read_pdf(&pdf, &tools, &work, &english(), None, &mut |p| told.push(p), &never()).unwrap();
    assert_eq!(told, [Progress { done: 1, total: 1, page: 1 }]);
    assert!(read.pages[0].read);
    assert!(read.pages[0].paragraphs.join(" ").contains("Milman Parry"), "{:?}", read.pages);

    let mut told = 0;
    let anew = Asked { text: TextChoice::Anew, ..english() };
    let made = ocr::make_searchable(&pdf, &tools, &work, &anew, &mut |_| told += 1, &never()).unwrap();
    assert_eq!((made.read, made.failed.len(), told), (1, 0, 1));
    let text = pdf_text::extract_text_from_mem(&made.pdf.unwrap()).unwrap();
    // Tesseract's versions lay the words over with one space or two between
    // them; what is asked is that the words are there, in their order.
    let plain = text.split_whitespace().collect::<Vec<_>>().join(" ");
    assert!(plain.contains("Milman Parry"), "{text}");

    // Stopped, it is not done.
    let stop = AtomicBool::new(true);
    let err = ocr::read_pdf(&pdf, &tools, &work, &english(), None, &mut |_| {}, &stop).unwrap_err();
    assert_eq!(err.kind(), tools::STOPPED);
    assert_eq!(std::fs::read_dir(&work).map(|d| d.count()).unwrap_or(0), 0);
}

#[test]
fn the_noughts_unpack_whole() {
    use std::io::Read as _;
    let mut out = Vec::new();
    flate2::read::ZlibDecoder::new(&packed_noughts(4)[..]).read_to_end(&mut out).unwrap();
    assert_eq!(out.len(), 64 << 20);
    assert!(out.iter().all(|b| *b == 0));
}
