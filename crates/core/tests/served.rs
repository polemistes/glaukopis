//! A file shown in a view is kept open by a child that serves its pages
//! (`src/ocr/server.rs`): the file is opened once, its pages drawn as they
//! are asked, by one process, until it is stopped, let go or killed; and
//! whatever ends it, the pages asked are drawn all the same. In a test
//! binary of its own, since the program for children is set once for the
//! whole process, and the files served are the process's own.

use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Mutex, MutexGuard, Once, PoisonError};
use std::time::{Duration, Instant};

use glaukopis_core::export::tools::{self, Configured, Tools};
use glaukopis_core::ocr::{self, server};
use lopdf::{Document, Object, Stream, dictionary};

/// The child, set once for every test of this file.
fn with_child() {
    static SET: Once = Once::new();
    SET.call_once(|| glaukopis_core::isolated::set_program(PathBuf::from(env!("CARGO_BIN_EXE_glaukopis-isolated"))));
}

/// The files served are the process's own: the tests that count them take turns.
fn one_at_a_time() -> MutexGuard<'static, ()> {
    static TURN: Mutex<()> = Mutex::new(());
    let turn = TURN.lock().unwrap_or_else(PoisonError::into_inner);
    with_child();
    server::end_all();
    turn
}

fn never() -> AtomicBool {
    AtomicBool::new(false)
}

/// A PDF of `count` pages, each a red square placed by its number, so that
/// each page is drawn otherwise.
fn squares(count: usize) -> Vec<u8> {
    let mut doc = Document::with_version("1.5");
    let pages_id = doc.new_object_id();
    let mut kids: Vec<Object> = Vec::new();
    for n in 0..count {
        let square = format!("1 0 0 rg {} 240 100 100 re f\n", 20 + (n % 10) * 25);
        let content = doc.add_object(Stream::new(dictionary! {}, square.into_bytes()));
        let page = doc.add_object(dictionary! {
            "Type" => "Page",
            "Parent" => pages_id,
            "Contents" => content,
            "MediaBox" => vec![0.into(), 0.into(), 400.into(), 360.into()],
        });
        kids.push(page.into());
    }
    let count = kids.len() as i64;
    doc.objects
        .insert(pages_id, Object::Dictionary(dictionary! { "Type" => "Pages", "Kids" => kids, "Count" => count }));
    let catalog = doc.add_object(dictionary! { "Type" => "Catalog", "Pages" => pages_id });
    doc.trailer.set("Root", catalog);
    let mut out = Vec::new();
    doc.save_to(&mut out).unwrap();
    out
}

/// A PDF of one page that takes long to draw: a million lines across it,
/// packed small.
fn slow_to_draw(dir: &Path) -> PathBuf {
    use std::io::Write as _;
    let mut packer = flate2::write::ZlibEncoder::new(Vec::new(), flate2::Compression::fast());
    for _ in 0..1_000_000 {
        packer.write_all(b"0 0 m 400 360 l S\n").unwrap();
    }
    let packed = packer.finish().unwrap();
    let mut doc = Document::with_version("1.5");
    let pages_id = doc.new_object_id();
    let content =
        doc.add_object(Stream::new(dictionary! { "Filter" => "FlateDecode" }, packed).with_compression(false));
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
    let path = dir.join("slow to draw.pdf");
    doc.save(&path).unwrap();
    path
}

/// The pages drawn, each a PNG of the width asked.
fn pictures(drawn: &[(usize, Result<Vec<u8>, String>)], width: u32) -> Vec<usize> {
    drawn
        .iter()
        .map(|(index, png)| {
            let picture = image::load_from_memory(png.as_ref().unwrap()).unwrap();
            assert_eq!(picture.width(), width);
            *index
        })
        .collect()
}

/// Whether the process of this number lives, and is not only left to be
/// waited for: told by `ps`, on Linux and macOS. Elsewhere it is taken to
/// be gone.
fn lives(pid: u32) -> bool {
    if !cfg!(unix) {
        return false;
    }
    let state = std::process::Command::new("ps").args(["-o", "stat=", "-p", &pid.to_string()]).output().unwrap();
    let state = String::from_utf8_lossy(&state.stdout).trim().to_owned();
    !state.is_empty() && !state.starts_with('Z')
}

fn gone_within(pid: u32, time: Duration) {
    let started = Instant::now();
    while lives(pid) {
        assert!(started.elapsed() < time, "the served process {pid} lives on");
        std::thread::sleep(Duration::from_millis(20));
    }
}

/// Two calls for different pages of a file are served by one process,
/// which opened the file for the first; the second does not open it again.
#[test]
fn two_calls_for_pages_of_a_file_are_served_by_one_process() {
    let _turn = one_at_a_time();
    let dir = tempfile::tempdir().unwrap();
    let (work, cache) = (dir.path().join("work"), dir.path().join("cache"));
    let pdf = dir.path().join("squares.pdf");
    std::fs::write(&pdf, squares(20_000)).unwrap();
    let tools = Tools::default();

    let started = Instant::now();
    let first = ocr::pages_at(&pdf, &tools, &work, Some(&cache), &[0, 1], 100, &never()).unwrap();
    let first_took = started.elapsed();
    assert_eq!(pictures(&first, 100), [0, 1]);
    let pid = server::serving(&pdf).expect("a process serves the file");

    let started = Instant::now();
    let second = ocr::pages_at(&pdf, &tools, &work, Some(&cache), &[12_000, 19_999, 25_000], 100, &never()).unwrap();
    let second_took = started.elapsed();
    assert_eq!(pictures(&second, 100), [12_000, 19_999], "those the file has");
    assert_eq!(server::serving(&pdf), Some(pid), "the same process");
    eprintln!("the first call {first_took:?}, the second {second_took:?}");
    assert!(second_took * 5 < first_took, "the first {first_took:?}, the second {second_took:?}");

    // Taken into the cache: a third call is answered from it.
    let started = Instant::now();
    let again = ocr::pages_at(&pdf, &tools, &work, Some(&cache), &[19_999, 0], 100, &never()).unwrap();
    assert_eq!(again.iter().map(|(index, _)| *index).collect::<Vec<_>>(), [19_999, 0]);
    assert_eq!(again[1], first[0]);
    assert!(started.elapsed() < second_took, "{:?}", started.elapsed());
    // What it drew was moved out of its folder.
    let place =
        std::fs::read_dir(&work).unwrap().flatten().find(|e| e.file_name().to_string_lossy().starts_with("served-"));
    let left: Vec<_> = std::fs::read_dir(place.unwrap().path())
        .unwrap()
        .flatten()
        .map(|e| e.file_name().to_string_lossy().into_owned())
        .filter(|name| name.ends_with(".png"))
        .collect();
    assert!(left.is_empty(), "{left:?}");
    server::end_all();
    gone_within(pid, Duration::from_secs(1));
}

/// Calls from several threads at once, as a view makes them, a page each,
/// are served by the one process, together.
#[test]
fn calls_at_once_are_served_by_one_process() {
    let _turn = one_at_a_time();
    let dir = tempfile::tempdir().unwrap();
    let work = dir.path().join("work");
    let pdf = dir.path().join("squares.pdf");
    std::fs::write(&pdf, squares(40)).unwrap();
    let tools = Tools::default();
    let drawn: Vec<_> = std::thread::scope(|scope| {
        let calls: Vec<_> = (0..4)
            .map(|n| {
                let (pdf, tools, work) = (&pdf, &tools, &work);
                scope.spawn(move || ocr::pages_at(pdf, tools, work, None, &[n * 10], 600, &never()).unwrap())
            })
            .collect();
        calls.into_iter().flat_map(|call| call.join().unwrap()).collect()
    });
    assert_eq!(pictures(&drawn, 600), [0, 10, 20, 30]);
    assert_eq!(server::all_serving().len(), 1);
    server::end_all();
}

/// A call that is stopped while its page is drawn kills the process that
/// serves the file, where nothing else is asked of it, and leaves none.
#[test]
fn a_stopped_call_leaves_no_served_child() {
    let _turn = one_at_a_time();
    let dir = tempfile::tempdir().unwrap();
    let work = dir.path().join("work");
    let pdf = slow_to_draw(dir.path());
    let stop = AtomicBool::new(false);
    let started = Instant::now();
    let (got, pid) = std::thread::scope(|scope| {
        let watching = scope.spawn(|| {
            // Stopped once the file is served, while its page is drawn.
            let pid = loop {
                if let Some(pid) = server::serving(&pdf) {
                    break pid;
                }
                assert!(started.elapsed() < Duration::from_secs(10), "no process served the file");
                std::thread::sleep(Duration::from_millis(10));
            };
            std::thread::sleep(Duration::from_millis(300));
            stop.store(true, Ordering::Relaxed);
            pid
        });
        let got = ocr::pages_at(&pdf, &Tools::default(), &work, None, &[0], 1600, &stop);
        (got, watching.join().unwrap())
    });
    assert_eq!(got.unwrap_err().kind(), tools::STOPPED);
    assert!(started.elapsed() < Duration::from_secs(10), "{:?}", started.elapsed());
    assert_eq!(server::serving(&pdf), None);
    assert!(server::all_serving().is_empty());
    gone_within(pid, Duration::from_secs(1));
    // Its folder is gone with it.
    assert_eq!(std::fs::read_dir(&work).map(|d| d.count()).unwrap_or(0), 0);
}

/// A process that serves a file and is killed leaves the view with its
/// pages all the same: the next call has them drawn.
#[test]
fn a_served_child_that_is_killed_leaves_no_page_undrawn() {
    let _turn = one_at_a_time();
    let dir = tempfile::tempdir().unwrap();
    let work = dir.path().join("work");
    let pdf = dir.path().join("squares.pdf");
    std::fs::write(&pdf, squares(10)).unwrap();
    let tools = Tools::default();
    let first = ocr::pages_at(&pdf, &tools, &work, None, &[0], 600, &never()).unwrap();
    assert_eq!(pictures(&first, 600), [0]);
    let pid = server::serving(&pdf).unwrap();
    if cfg!(unix) {
        let killed = std::process::Command::new("kill").args(["-9", &pid.to_string()]).status().unwrap();
        assert!(killed.success());
        gone_within(pid, Duration::from_secs(2));
    } else {
        server::end_all();
    }
    let again = ocr::pages_at(&pdf, &tools, &work, None, &[1, 2], 600, &never()).unwrap();
    assert_eq!(pictures(&again, 600), [1, 2]);
    assert_ne!(server::serving(&pdf), Some(pid));
    server::end_all();
}

/// A file served with nothing asked of it is let go, and no more files are
/// served at once than the most; the one asked of longest ago goes first.
#[test]
fn files_idle_are_let_go_and_no_more_are_served_than_the_most() {
    let _turn = one_at_a_time();
    let dir = tempfile::tempdir().unwrap();
    let work = dir.path().join("work");
    let tools = Tools::default();
    let files: Vec<PathBuf> = (0..3)
        .map(|n| {
            let pdf = dir.path().join(format!("squares {n}.pdf"));
            std::fs::write(&pdf, squares(2 + n)).unwrap();
            pdf
        })
        .collect();
    let mut pids = Vec::new();
    for pdf in &files {
        ocr::pages_at(pdf, &tools, &work, None, &[0], 300, &never()).unwrap();
        pids.push(server::serving(pdf).unwrap());
    }
    assert_eq!(server::MOST_OPEN, 2);
    assert_eq!(server::serving(&files[0]), None, "asked of longest ago, it was let go");
    gone_within(pids[0], Duration::from_secs(1));
    assert_eq!(server::all_serving().len(), 2);
    // Idle for longer than a second, those served are let go.
    server::let_go_idle(Duration::from_secs(60));
    assert_eq!(server::all_serving().len(), 2, "not yet idle");
    std::thread::sleep(Duration::from_millis(1100));
    server::let_go_idle(Duration::from_secs(1));
    assert!(server::all_serving().is_empty());
    gone_within(pids[1], Duration::from_secs(1));
    gone_within(pids[2], Duration::from_secs(1));
    assert_eq!(std::fs::read_dir(&work).map(|d| d.count()).unwrap_or(0), 0, "their folders are gone");
}

/// A file that cannot be opened says why, as it does when it is not served.
#[test]
fn a_file_that_cannot_be_opened_says_why() {
    let _turn = one_at_a_time();
    let dir = tempfile::tempdir().unwrap();
    let work = dir.path().join("work");
    let pdf = dir.path().join("broken.pdf");
    std::fs::write(&pdf, b"%PDF-1.4\nnothing of a PDF follows\n%%EOF\n").unwrap();
    let error = ocr::pages_at(&pdf, &Tools::default(), &work, None, &[0], 300, &never()).unwrap_err();
    assert!(error.to_string().contains("broken.pdf"), "{error}");
    assert!(server::all_serving().is_empty());
}

/// How long a view waits for the pages of a book of 364 pages set by Typst,
/// served: the first call, which opens the file, the second, for a page
/// elsewhere in it, by the same process, and four calls at once for a page
/// each, as a view makes them. Run by hand:
/// `cargo test -p glaukopis-core --release --test served measure -- --ignored --nocapture`.
#[test]
#[ignore]
fn measure_a_book_served() {
    let _turn = one_at_a_time();
    let Some(typst) = tools::find("typst", None, &[]) else {
        eprintln!("The program Typst is not installed; the measure is passed over");
        return;
    };
    let dir = tempfile::tempdir().unwrap();
    let work = dir.path().join("work");
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
    let tools = tools::discover(&Configured::default());
    for round in 1..=3 {
        server::end_all();
        let started = Instant::now();
        ocr::pages_at(&book, &tools, &work, None, &[0], 1600, &never()).unwrap();
        let first = started.elapsed();
        let pid = server::serving(&book);
        let started = Instant::now();
        ocr::pages_at(&book, &tools, &work, None, &[200], 1600, &never()).unwrap();
        let second = started.elapsed();
        let started = Instant::now();
        let four: Vec<usize> = (300..304).collect();
        std::thread::scope(|scope| {
            for &page in &four {
                let (book, tools, work) = (&book, &tools, &work);
                scope.spawn(move || ocr::pages_at(book, tools, work, None, &[page], 1600, &never()).unwrap());
            }
        });
        let at_once = started.elapsed();
        assert_eq!(server::serving(&book), pid);
        println!(
            "round {round}: served, the first page {first:?}, a page elsewhere {second:?}, four pages asked at once {at_once:?}"
        );
    }
}
