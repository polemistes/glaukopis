//! Work done in a process of its own (`src/isolated.rs`): given back, or
//! killed when its time is up or it takes more memory than it may.

use std::path::Path;
use std::time::{Duration, Instant};

use glaukopis_core::isolated::{Ended, Limits, run_with};
use glaukopis_core::ocr::layer::{Layer, read_file};

fn program() -> &'static Path {
    Path::new(env!("CARGO_BIN_EXE_glaukopis-isolated"))
}

fn limits(seconds: u64, megabytes: u64) -> Limits {
    Limits { time: Duration::from_secs(seconds), memory: megabytes << 20 }
}

#[test]
fn what_the_child_gives_comes_back() {
    let dir = tempfile::tempdir().unwrap();
    let input = dir.path().join("in.txt");
    std::fs::write(&input, "Μῆνιν ἄειδε").unwrap();
    let got: String = run_with(program(), "test-echo", &input, limits(30, 1024)).unwrap();
    assert_eq!(got, "Μῆνιν ἄειδε");
}

#[test]
fn a_child_whose_time_is_up_is_killed() {
    let started = Instant::now();
    let got = run_with::<String>(program(), "test-sleep", Path::new("."), limits(1, 1024));
    assert_eq!(got, Err(Ended::Time));
    assert!(started.elapsed() < Duration::from_secs(10), "{:?}", started.elapsed());
}

#[test]
fn a_child_that_takes_too_much_memory_is_killed() {
    let started = Instant::now();
    let got = run_with::<String>(program(), "test-eat", Path::new("."), limits(60, 300));
    assert_eq!(got, Err(Ended::Memory));
    assert!(started.elapsed() < Duration::from_secs(30), "{:?}", started.elapsed());
}

#[test]
fn a_task_that_is_not_known_fails() {
    let got = run_with::<String>(program(), "nothing-such", Path::new("."), limits(10, 1024));
    assert!(matches!(got, Err(Ended::Failed(_))), "{got:?}");
}

#[test]
fn the_text_of_a_pdf_read_in_a_child_is_as_read_here() {
    let pdf = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../e2e/fixtures/porson.pdf");
    let child: Layer = run_with(program(), "pdf-layer", &pdf, limits(60, 2048)).unwrap();
    assert_eq!(child, read_file(&pdf).unwrap());
    assert!(!child.maps.is_empty());
}
