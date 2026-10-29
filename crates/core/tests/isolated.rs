//! Work done in a process of its own (`src/isolated.rs`): given back, or
//! killed when its time is up or it takes more memory than it may.

use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::{Duration, Instant};

use glaukopis_core::isolated::{Ended, Limits, Serving, run_watched_with, run_with, start_serving_with};
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
/// on Linux, it is left to another as such a child is; the shell tells it
/// its number as the application does, so that the child knows its parent
/// even where the shell is gone before the child first looks (as in a
/// systemd unit, where it was).
#[cfg(unix)]
#[test]
fn a_child_whose_parent_is_gone_ends_itself() {
    let out = std::process::Command::new("sh")
        .arg("-c")
        .arg(
            "GLAUKOPIS_ISOLATED_PARENT=$$ \"$0\" --glaukopis-isolated test-sleep . /dev/null >/dev/null 2>&1 & echo $!",
        )
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

#[test]
fn what_the_child_tells_comes_as_it_works_and_before_what_it_gives() {
    let dir = tempfile::tempdir().unwrap();
    let input = dir.path().join("in.txt");
    std::fs::write(&input, "given").unwrap();
    let mut lines = Vec::new();
    let got: String = run_watched_with(
        program(),
        "test-tell-and-give",
        &input,
        limits(30, 1024),
        &mut |line| lines.push(line.to_owned()),
        &AtomicBool::new(false),
    )
    .unwrap();
    assert_eq!(got, "given");
    assert_eq!(lines, ["line 1", "line 2", "line 3"]);
}

#[test]
fn a_child_that_is_stopped_is_killed() {
    let stop = AtomicBool::new(false);
    let mut lines = 0;
    let started = Instant::now();
    let got = run_watched_with::<String>(
        program(),
        "test-tell",
        Path::new("."),
        limits(60, 1024),
        &mut |_| {
            lines += 1;
            if lines == 3 {
                stop.store(true, Ordering::Relaxed);
            }
        },
        &stop,
    );
    assert_eq!(got, Err(Ended::Stopped));
    assert!(lines >= 3, "{lines}");
    assert!(started.elapsed() < Duration::from_secs(10), "{:?}", started.elapsed());
    // Stopped before it starts, it is not started.
    let got = run_watched_with::<String>(program(), "test-sleep", Path::new("."), limits(60, 1024), &mut |_| {}, &stop);
    assert_eq!(got, Err(Ended::Stopped));
}

/// What a child starts, as Tesseract, is killed with it.
#[cfg(unix)]
#[test]
fn what_a_killed_child_started_is_killed_with_it() {
    let mut sleeper = String::new();
    let got = run_watched_with::<String>(
        program(),
        "test-family",
        Path::new("."),
        limits(2, 1024),
        &mut |line| sleeper = line.to_owned(),
        &AtomicBool::new(false),
    );
    assert_eq!(got, Err(Ended::Time));
    assert!(sleeper.parse::<u32>().is_ok(), "{sleeper:?}");
    let started = Instant::now();
    let alive = || {
        let state = std::process::Command::new("ps").args(["-o", "stat=", "-p", &sleeper]).output().unwrap();
        let state = String::from_utf8_lossy(&state.stdout).trim().to_owned();
        !state.is_empty() && !state.starts_with('Z')
    };
    while alive() {
        assert!(started.elapsed() < Duration::from_secs(5), "the program {sleeper} the child started lives on");
        std::thread::sleep(Duration::from_millis(50));
    }
}

// ---------------------------------------------------------------------------
// A task that lives on, and is asked one thing after another
// ---------------------------------------------------------------------------

fn served(task: &str, megabytes: u64) -> Serving {
    start_serving_with(program(), task, Path::new("."), megabytes << 20).unwrap()
}

/// What a served child tells first of `line`, taken as its whole answer.
fn first_answer(serving: &Serving, line: &str) -> Result<String, Ended> {
    let mut got = String::new();
    let mut told = |line: &str| {
        got = line.to_owned();
        true
    };
    serving.ask(line, Duration::from_secs(30), &mut told, &AtomicBool::new(false))?;
    Ok(got)
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

#[test]
fn a_served_child_answers_one_ask_after_another() {
    let serving = served("test-serve-echo", 1024);
    let pid = serving.pid();
    assert_eq!(first_answer(&serving, "one"), Ok("echo: one".to_owned()));
    assert_eq!(first_answer(&serving, "Μῆνιν ἄειδε"), Ok("echo: Μῆνιν ἄειδε".to_owned()));
    assert!(serving.alive());
    assert_eq!(serving.pid(), pid);
}

/// A served child outlives the thread that started it, as it must where
/// the threads that ask are a pool's, which end when they are idle.
#[test]
fn a_served_child_outlives_the_thread_that_started_it() {
    let serving = std::thread::spawn(|| served("test-serve-echo", 1024)).join().unwrap();
    std::thread::sleep(Duration::from_millis(200));
    assert!(serving.alive());
    assert_eq!(first_answer(&serving, "still here"), Ok("echo: still here".to_owned()));
}

/// Asks from several threads at once wait for the child at once, each
/// handed what is told of it.
#[test]
fn asks_at_once_are_answered_at_once() {
    let serving = served("test-serve-wait", 1024);
    let started = Instant::now();
    std::thread::scope(|scope| {
        let asks: Vec<_> = (0..3).map(|_| scope.spawn(|| first_answer(&serving, "500"))).collect();
        for ask in asks {
            assert_eq!(ask.join().unwrap(), Ok("waited".to_owned()));
        }
    });
    // One after another, they would take a second and a half.
    assert!(started.elapsed() < Duration::from_millis(1200), "{:?}", started.elapsed());
}

#[test]
fn a_served_child_that_is_ended_is_gone_within_a_second() {
    let serving = served("test-serve-echo", 1024);
    let pid = serving.pid();
    assert!(first_answer(&serving, "one").is_ok());
    serving.end();
    assert!(!serving.alive());
    gone_within(pid, Duration::from_secs(1));
    assert!(matches!(first_answer(&serving, "two"), Err(Ended::Failed(_))));
    // Let go, it is ended too.
    let serving = served("test-serve-echo", 1024);
    let pid = serving.pid();
    drop(serving);
    gone_within(pid, Duration::from_secs(1));
}

#[test]
fn a_served_child_stopped_while_asked_is_killed_and_the_next_is_another() {
    let serving = served("test-serve-wait", 1024);
    let pid = serving.pid();
    let stop = AtomicBool::new(false);
    let started = Instant::now();
    let got = std::thread::scope(|scope| {
        scope.spawn(|| {
            std::thread::sleep(Duration::from_millis(200));
            stop.store(true, Ordering::Relaxed);
        });
        serving.ask("10000", Duration::from_secs(60), &mut |_| true, &stop)
    });
    assert_eq!(got, Err(Ended::Stopped));
    assert!(started.elapsed() < Duration::from_secs(5), "{:?}", started.elapsed());
    assert!(!serving.alive());
    gone_within(pid, Duration::from_secs(1));
    let next = served("test-serve-wait", 1024);
    assert_ne!(next.pid(), pid);
    // Stopped before it is asked, nothing is asked and nothing killed.
    assert_eq!(next.ask("1", Duration::from_secs(10), &mut |_| true, &stop), Err(Ended::Stopped));
    assert!(next.alive());
}

/// One who stops lets go of the child, which goes on for another who waits for it.
#[test]
fn a_stopped_ask_leaves_the_child_to_another_that_waits() {
    let serving = served("test-serve-wait", 1024);
    let stop = AtomicBool::new(false);
    std::thread::scope(|scope| {
        let other = scope.spawn(|| first_answer(&serving, "800"));
        scope.spawn(|| {
            std::thread::sleep(Duration::from_millis(300));
            stop.store(true, Ordering::Relaxed);
        });
        std::thread::sleep(Duration::from_millis(100));
        assert_eq!(serving.ask("10000", Duration::from_secs(60), &mut |_| true, &stop), Err(Ended::Stopped));
        assert_eq!(other.join().unwrap(), Ok("waited".to_owned()));
    });
    assert!(serving.alive());
}

#[test]
fn an_ask_whose_time_is_up_kills_the_served_child() {
    let serving = served("test-serve-wait", 1024);
    let started = Instant::now();
    let got = serving.ask("10000", Duration::from_millis(300), &mut |_| true, &AtomicBool::new(false));
    assert_eq!(got, Err(Ended::Time));
    assert!(started.elapsed() < Duration::from_secs(5), "{:?}", started.elapsed());
    assert!(!serving.alive());
}

#[test]
fn a_served_child_that_takes_too_much_memory_is_killed() {
    let serving = served("test-serve-eat", 300);
    let started = Instant::now();
    assert_eq!(first_answer(&serving, "eat"), Err(Ended::Memory));
    assert!(started.elapsed() < Duration::from_secs(30), "{:?}", started.elapsed());
}

#[test]
fn a_served_child_that_ends_while_asked_says_why() {
    let serving = served("test-serve-end", 1024);
    assert_eq!(first_answer(&serving, "anything"), Err(Ended::Failed("given up at once".to_owned())));
}
