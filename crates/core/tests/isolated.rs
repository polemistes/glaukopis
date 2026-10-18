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

/// A child whose application is gone, killed or forced to quit, ends
/// itself, as it must on macOS where nothing else ends it. Started by a
/// shell that ends at once, and without the signal the application asks for
/// on Linux, it is left to another as such a child is.
#[cfg(unix)]
#[test]
fn a_child_whose_parent_is_gone_ends_itself() {
    let out = std::process::Command::new("sh")
        .arg("-c")
        .arg("\"$0\" --glaukopis-isolated test-sleep . /dev/null >/dev/null 2>&1 & echo $!")
        .arg(program())
        .output()
        .unwrap();
    let pid = String::from_utf8_lossy(&out.stdout).trim().to_owned();
    assert!(pid.parse::<u32>().is_ok(), "{pid:?}");
    let started = Instant::now();
    let alive = || {
        let state = std::process::Command::new("ps").args(["-o", "stat=", "-p", &pid]).output().unwrap();
        let state = String::from_utf8_lossy(&state.stdout).trim().to_owned();
        !state.is_empty() && !state.starts_with('Z')
    };
    while alive() {
        assert!(started.elapsed() < Duration::from_secs(10), "the child {pid} lives on without its parent");
        std::thread::sleep(Duration::from_millis(100));
    }
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
