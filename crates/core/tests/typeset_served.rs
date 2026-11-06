//! The typesetting pane's document is set and kept by a child
//! (`src/export/served.rs`, record 0087): the child sets `document.typ` of
//! the pane's work folder, keeps it, and draws the pages asked of it,
//! until its pane closes. In a test binary of its own, since the program
//! for children is set once for the whole process, and the documents
//! served are the process's own.

use std::path::{Path, PathBuf};
use std::sync::{Mutex, MutexGuard, Once, PoisonError};
use std::time::{Duration, Instant};

use glaukopis_core::export::served::{self, Margins};

/// The child, set once for every test of this file.
fn with_child() {
    static SET: Once = Once::new();
    SET.call_once(|| glaukopis_core::isolated::set_program(PathBuf::from(env!("CARGO_BIN_EXE_glaukopis-isolated"))));
}

/// The documents served are the process's own: the tests take turns.
fn one_at_a_time() -> MutexGuard<'static, ()> {
    static TURN: Mutex<()> = Mutex::new(());
    let turn = TURN.lock().unwrap_or_else(PoisonError::into_inner);
    with_child();
    served::end_all();
    turn
}

/// A document of `pages` pages, each with a heading and the place of an element.
fn write_document(dir: &Path, pages: usize) {
    let mut source = String::from("#set page(width: 100mm, height: 80mm)\n");
    for n in 1..=pages {
        if n > 1 {
            source.push_str("#pagebreak()\n");
        }
        source.push_str(&format!("#metadata(\"e{n}\") <gk-el-e{n}>\n\n= Part {n}\nThe words of part {n}.\n\n"));
    }
    std::fs::write(dir.join("document.typ"), source).unwrap();
}

fn margins() -> Margins {
    Margins { top: 20.0, bottom: 20.0, head: false, foot: true }
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
        assert!(started.elapsed() < time, "the typesetting process {pid} lives on");
        std::thread::sleep(Duration::from_millis(20));
    }
}

/// What the child left in the folder: the files of its place, but its job.
fn left_in_place(dir: &Path) -> Vec<String> {
    std::fs::read_dir(dir)
        .unwrap()
        .flatten()
        .filter(|e| e.file_name().to_string_lossy().starts_with("typeset-"))
        .flat_map(|place| std::fs::read_dir(place.path()).unwrap().flatten())
        .map(|e| e.file_name().to_string_lossy().into_owned())
        .filter(|name| name != "job.json")
        .collect()
}

#[test]
fn a_document_is_set_and_its_pages_drawn_by_one_child() {
    let _turn = one_at_a_time();
    let tmp = tempfile::tempdir().unwrap();
    let dir = tmp.path();
    write_document(dir, 3);

    let set = served::set(dir, Some(margins())).expect("a child is started").unwrap();
    assert_eq!(set.count, 3);
    let places: Vec<(&str, u32)> = set.places.iter().map(|p| (p.element.as_str(), p.page)).collect();
    assert_eq!(places, [("e1", 1), ("e2", 2), ("e3", 3)], "{:?}", set.places);
    assert!(!set.spots.is_empty(), "the headings stand somewhere");
    let pid = served::serving(dir).expect("the child serves the folder");

    let (count, pages) = served::pages(dir, &[2, 3, 9]).unwrap().unwrap();
    assert_eq!(count, 3);
    assert_eq!(pages.iter().map(|p| p.number).collect::<Vec<_>>(), [2, 3], "a page it has not is passed over");
    assert!(pages[0].svg.starts_with("<svg"), "{}", &pages[0].svg[..40]);
    assert!(pages[0].texts.iter().any(|run| run.text.contains("Part")), "{:?}", pages[0].texts);
    let printed = served::print(dir, 1, 3).unwrap().unwrap();
    assert_eq!(printed.iter().map(|p| p.number).collect::<Vec<_>>(), [1, 2, 3]);
    assert!(left_in_place(dir).is_empty(), "the files of the pages are taken: {:?}", left_in_place(dir));
    assert_eq!(served::serving(dir), Some(pid), "one child did it all");

    // The document changed and set again, by the same child.
    write_document(dir, 5);
    let again = served::set(dir, None).unwrap().unwrap();
    assert_eq!(again.count, 5);
    assert!(again.places.is_empty(), "no places where no margins were given");
    assert_eq!(served::pages(dir, &[5]).unwrap().unwrap().1.len(), 1);
    assert_eq!(served::serving(dir), Some(pid));

    // The pane closes: the child ends.
    served::end(dir);
    assert_eq!(served::serving(dir), None);
    gone_within(pid, Duration::from_secs(5));
}

#[test]
fn a_child_ended_or_without_its_place_is_started_again_and_sets_from_the_file() {
    let _turn = one_at_a_time();
    let tmp = tempfile::tempdir().unwrap();
    let dir = tmp.path();
    write_document(dir, 2);
    served::set(dir, Some(margins())).unwrap().unwrap();
    let first = served::serving(dir).unwrap();

    // Its place taken from under it: another is started, which sets the
    // document before it draws.
    for entry in std::fs::read_dir(dir).unwrap().flatten() {
        if entry.file_name().to_string_lossy().starts_with("typeset-") {
            std::fs::remove_dir_all(entry.path()).unwrap();
        }
    }
    let (count, pages) = served::pages(dir, &[1]).unwrap().unwrap();
    assert_eq!((count, pages.len()), (2, 1));
    let second = served::serving(dir).unwrap();
    assert_ne!(first, second);
    gone_within(first, Duration::from_secs(5));

    // Ended, as when the pane was idle: the next ask starts a third.
    served::end(dir);
    gone_within(second, Duration::from_secs(5));
    let printed = served::print(dir, 1, 2).unwrap().unwrap();
    assert_eq!(printed.len(), 2);
    let third = served::serving(dir).unwrap();
    assert!(third != first && third != second);
    served::end_all();
    gone_within(third, Duration::from_secs(5));
}

#[test]
fn what_typst_cannot_set_is_said_and_the_child_lives_on() {
    let _turn = one_at_a_time();
    let tmp = tempfile::tempdir().unwrap();
    let dir = tmp.path();
    std::fs::write(dir.join("document.typ"), "#set page(width: 100mm)\n#nothing-of-the-kind()\n").unwrap();
    let error = served::set(dir, Some(margins())).unwrap().err().expect("Typst fails");
    assert_eq!(error.kind(), "program", "{error}");
    let pid = served::serving(dir).expect("the child lives on");
    // Nothing is held to draw from: it is set again, and fails again.
    assert!(served::pages(dir, &[1]).unwrap().is_err());
    write_document(dir, 1);
    assert_eq!(served::set(dir, None).unwrap().unwrap().count, 1);
    assert_eq!(served::serving(dir), Some(pid));
    served::end_all();
}

#[test]
fn no_more_are_served_than_the_most_and_those_idle_are_let_go() {
    let _turn = one_at_a_time();
    let folders: Vec<tempfile::TempDir> = (0..=served::MOST_OPEN).map(|_| tempfile::tempdir().unwrap()).collect();
    let mut pids = Vec::new();
    for folder in &folders {
        write_document(folder.path(), 1);
        served::set(folder.path(), None).unwrap().unwrap();
        pids.push(served::serving(folder.path()).unwrap());
        std::thread::sleep(Duration::from_millis(20));
    }
    assert_eq!(served::all_serving().len(), served::MOST_OPEN);
    assert_eq!(served::serving(folders[0].path()), None, "the one asked of longest ago is let go");
    gone_within(pids[0], Duration::from_secs(5));
    served::let_go_idle(Duration::ZERO);
    assert!(served::all_serving().is_empty());
    for pid in &pids[1..] {
        gone_within(*pid, Duration::from_secs(5));
    }
}
