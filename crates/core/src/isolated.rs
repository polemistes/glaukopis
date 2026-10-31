//! Work that may lose itself in a file, done in a process of its own.
//!
//! The libraries that read PDFs can be led by a file into work without end:
//! a loop, or memory taken without limit. On a thread such work can only be
//! abandoned, and goes on eating memory until the application ends; on a
//! machine with little to spare, the whole system then stops. Done in a
//! child process, it is killed when its time is up or when it takes more
//! memory than it is given, and what it had done is lost but nothing else.
//!
//! The child is the application's own program, started with [`FLAG`]: the
//! program calls [`serve`] before anything else and ends with what it gives.
//! Where no program is set ([`set_program`]), as in the tests of this crate,
//! the work is done on a thread as before, and the caller is told so by
//! [`run`] giving nothing.
//!
//! A task may say how far it has come, in lines on its standard output
//! ([`tell`]), which the parent hands on as they come ([`run_watched`]); and
//! it may be stopped by the one who asked for it. A child that is ended is
//! ended with what it started, the programs it runs (Tesseract, Poppler):
//! on Linux and macOS the child leads a process group of its own, which is
//! killed whole; on Windows its job ends them with it.
//!
//! A task may also live on, to be asked one thing after another while it
//! keeps what it has opened ([`start_serving`], [`Serving`]): a file read
//! once whose pages are drawn as they are wanted. It is bounded in memory
//! as every child is, each ask in its time.

use std::ffi::OsString;
use std::path::{Path, PathBuf};
use std::process::{Child, ChildStderr, ChildStdin, ChildStdout, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex, MutexGuard, OnceLock, PoisonError, mpsc};
use std::time::{Duration, Instant};

use serde::Serialize;
use serde::de::DeserializeOwned;

/// What the program is started with to do a task: `FLAG task input output`.
pub const FLAG: &str = "--glaukopis-isolated";

/// The number of the process that started the child, in its environment:
/// the child ends when its parent is no longer that one (`end_with_parent`).
/// Told rather than read at the start, since a parent gone before the child
/// first looks would have handed it to another already.
pub const PARENT: &str = "GLAUKOPIS_ISOLATED_PARENT";

static PROGRAM: OnceLock<PathBuf> = OnceLock::new();

/// The program that does the tasks: the application's own. Set once, at its start.
pub fn set_program(path: PathBuf) {
    let _ = PROGRAM.set(path);
}

/// How long a task may take, and how much memory it may hold.
#[derive(Debug, Clone, Copy)]
pub struct Limits {
    pub time: Duration,
    /// In bytes.
    pub memory: u64,
}

impl Limits {
    /// For reading a file of `bytes`: the time given, and memory enough for a
    /// file of its size many times over, but never more than half of what the
    /// machine has free, nor less than half a gigabyte.
    pub fn for_file(bytes: u64, time: Duration) -> Limits {
        let wanted = (1u64 << 30).saturating_add(bytes.saturating_mul(12));
        let room = available_memory().map_or(wanted, |free| free / 2);
        Limits { time, memory: wanted.min(room).max(512 << 20) }
    }
}

/// How a task ended without giving what it was to give.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Ended {
    /// Its time was up, and it was killed.
    Time,
    /// It took more memory than it was given, and was killed.
    Memory,
    /// It ended otherwise, or what it gave could not be read.
    Failed(String),
    /// It could not be started: the caller may do the work itself.
    NotStarted(String),
    /// The one who asked for it stopped it, and it was killed.
    Stopped,
}

impl std::fmt::Display for Ended {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Ended::Time => write!(f, "its time was up"),
            Ended::Memory => write!(f, "it took more memory than it was given"),
            Ended::Stopped => write!(f, "it was stopped"),
            Ended::Failed(why) | Ended::NotStarted(why) => write!(f, "{why}"),
        }
    }
}

/// Does a task in a child process, on the file at `input`, within `limits`.
/// Nothing where no program is set: the caller does the work itself.
pub fn run<T: DeserializeOwned>(task: &str, input: &Path, limits: Limits) -> Option<Result<T, Ended>> {
    let program = PROGRAM.get()?;
    Some(run_with(program, task, input, limits))
}

/// Whether a program is set to do tasks in children: where none is, the
/// caller does the work itself.
pub fn program_is_set() -> bool {
    PROGRAM.get().is_some()
}

/// As [`run`], with the program given: for the tests.
pub fn run_with<T: DeserializeOwned>(program: &Path, task: &str, input: &Path, limits: Limits) -> Result<T, Ended> {
    run_in(program, task, input, limits, &mut |_| {}, &AtomicBool::new(false))
}

/// As [`run`], with each line the task says ([`tell`]) given to `told` as it
/// comes, and the task killed as soon as `stop` is set.
pub fn run_watched<T: DeserializeOwned>(
    task: &str,
    input: &Path,
    limits: Limits,
    told: &mut dyn FnMut(&str),
    stop: &AtomicBool,
) -> Option<Result<T, Ended>> {
    let program = PROGRAM.get()?;
    Some(run_in(program, task, input, limits, told, stop))
}

/// As [`run_watched`], with the program given: for the tests.
pub fn run_watched_with<T: DeserializeOwned>(
    program: &Path,
    task: &str,
    input: &Path,
    limits: Limits,
    told: &mut dyn FnMut(&str),
    stop: &AtomicBool,
) -> Result<T, Ended> {
    run_in(program, task, input, limits, told, stop)
}

/// Says a line to the parent, which gives it to the one who watches the
/// task: how far the task has come. A line holds no line break.
pub fn tell(line: &str) {
    use std::io::Write;
    let mut out = std::io::stdout().lock();
    // A parent that no longer listens is no reason to stop the work.
    let _ = writeln!(out, "{}", line.replace(['\n', '\r'], " ")).and_then(|()| out.flush());
}

fn run_in<T: DeserializeOwned>(
    program: &Path,
    task: &str,
    input: &Path,
    limits: Limits,
    told: &mut dyn FnMut(&str),
    stop: &AtomicBool,
) -> Result<T, Ended> {
    let failed = |e: &dyn std::fmt::Display| Ended::Failed(e.to_string());
    if stop.load(Ordering::Relaxed) {
        return Err(Ended::Stopped);
    }
    let dir = tempfile::Builder::new()
        .prefix("glaukopis-isolated-")
        .tempdir()
        .map_err(|e| Ended::NotStarted(e.to_string()))?;
    let output = dir.path().join("out.json");
    let mut c = crate::export::tools::command(program);
    c.arg(FLAG).arg(task).arg(input).arg(&output);
    c.env(PARENT, std::process::id().to_string());
    c.stdin(Stdio::null()).stdout(Stdio::piped()).stderr(Stdio::piped());
    unix_child(&mut c);
    let mut child = c.spawn().map_err(|e| Ended::NotStarted(e.to_string()))?;
    // Without its job the child has no bound on its memory, which the loop
    // below cannot watch on Windows: it is said, and the time still holds.
    #[cfg(windows)]
    let job = windows::limit(&child, limits.memory)
        .inspect_err(|code| {
            tracing::warn!(
                task,
                code,
                "the process could not be given a bound on its memory; only its time is bounded"
            );
        })
        .ok();
    let mut stderr = child.stderr.take();
    let said = std::thread::spawn(move || {
        let mut all = String::new();
        if let Some(err) = stderr.as_mut() {
            use std::io::Read;
            let _ = err.read_to_string(&mut all);
        }
        all
    });
    // The lines it tells, handed on here, on the thread of the one who asked.
    let (send, lines) = mpsc::channel::<String>();
    let stdout = child.stdout.take();
    let telling = std::thread::spawn(move || {
        use std::io::BufRead;
        let Some(out) = stdout else { return };
        for line in std::io::BufReader::new(out).lines() {
            let Ok(line) = line else { break };
            if send.send(line).is_err() {
                break;
            }
        }
    });

    let started = Instant::now();
    let mut ended = None;
    let status = loop {
        match child.try_wait() {
            Ok(Some(status)) => break Some(status),
            Ok(None) => {}
            Err(e) => {
                // It cannot be watched: it is ended, lest it go on without bounds.
                ended = Some(failed(&e));
                kill(&mut child);
                break None;
            }
        }
        for line in lines.try_iter() {
            told(&line);
        }
        if stop.load(Ordering::Relaxed) {
            ended = Some(Ended::Stopped);
        } else if started.elapsed() > limits.time {
            ended = Some(Ended::Time);
        } else if resident(child.id()).is_some_and(|held| held > limits.memory) {
            ended = Some(Ended::Memory);
        }
        if ended.is_some() {
            kill(&mut child);
            break None;
        }
        // Waiting for what it tells, it is looked at again as soon as it
        // tells a line or closes its output, as it does when it ends, rather
        // than a tick later: a task of a few milliseconds is not kept waiting.
        match lines.recv_timeout(TICK) {
            Ok(line) => told(&line),
            Err(mpsc::RecvTimeoutError::Timeout) => {}
            Err(mpsc::RecvTimeoutError::Disconnected) => std::thread::sleep(Duration::from_millis(5)),
        }
    };
    // What the child started dies with its job, before what they may hold
    // open of its output is waited for: on Windows they share its handles.
    #[cfg(windows)]
    drop(job);
    // What it told before it ended: the last page of a task that is done.
    let _ = telling.join();
    for line in lines.try_iter() {
        told(&line);
    }
    let said = said.join().unwrap_or_default();
    if let Some(ended) = ended {
        return Err(ended);
    }
    let status = status.expect("ended or a status");
    if !status.success() {
        // On Windows the job ends a child that takes too much, and the child
        // is told so as a failure to allocate.
        if said.contains("memory allocation") {
            return Err(Ended::Memory);
        }
        let first = said.lines().find(|l| !l.trim().is_empty()).unwrap_or("").trim().to_owned();
        return Err(Ended::Failed(if first.is_empty() { status.to_string() } else { first }));
    }
    // What it said while it worked, which it writes where the log of the
    // application cannot see: a page it could not read, a panic it caught.
    let said = said.trim();
    if !said.is_empty() {
        let said: String = said.chars().take(4000).collect();
        tracing::warn!(task, said, "the process said this while it worked");
    }
    let bytes = std::fs::read(&output).map_err(|e| failed(&e))?;
    tracing::info!(task, ms = started.elapsed().as_millis() as u64, "done in a process of its own");
    serde_json::from_slice(&bytes).map_err(|e| failed(&e))
}

/// Kills a child, and on Linux and macOS what it started: the group it leads.
/// The group is killed before the child is waited for, while its number
/// cannot have been given to another.
fn kill(child: &mut std::process::Child) {
    #[cfg(unix)]
    if let Ok(group) = libc::pid_t::try_from(child.id()) {
        // SAFETY: kill has no preconditions; a group that is gone is an error that is not needed.
        unsafe { libc::kill(-group, libc::SIGKILL) };
    }
    let _ = child.kill();
    let _ = child.wait();
}

// ---------------------------------------------------------------------------
// A task that lives on, and is asked one thing after another
// ---------------------------------------------------------------------------

/// How often a child is looked at while it works, at the most: whether it
/// has ended, the memory it holds, and the stop and time of what was asked.
const TICK: Duration = Duration::from_millis(40);

/// How much of what a served child says on its standard error is kept, to
/// say why it ended.
const SAID_KEPT: usize = 4000;

/// A child that keeps what it has opened and is asked one thing after
/// another, a line each, from any number of threads at once: a file kept
/// open while its pages are drawn (`ocr/server.rs`). Each ask is given a
/// number; its line goes to the child as `<number> <line>` on its standard
/// input, and what the child tells of it comes back as `<number> <line>` on
/// its output ([`asked`], [`tell_to`]), handed to the ask that waits for it.
/// The child's memory is watched while an ask waits, as [`run`] watches it;
/// each ask has a time of its own; and the child is killed when it is ended
/// ([`Serving::end`]) or let go. A child that has ended, or was killed, is
/// asked nothing more: a new one is started for that.
pub struct Serving {
    task: String,
    pid: u32,
    started: Instant,
    /// In bytes.
    memory: u64,
    life: Mutex<Life>,
    stdin: Mutex<Option<ChildStdin>>,
    waiting: Arc<Mutex<Waiting>>,
    said: Arc<Said>,
    /// Where it writes what it gives as it ends, which nothing reads.
    _place: tempfile::TempDir,
}

/// The child, and why it ended, once it has.
struct Life {
    child: Child,
    /// Once it is here, the child has been waited for: it is asked nothing
    /// more, and never killed again, since its number may be another's.
    ended: Option<Ended>,
    #[cfg(windows)]
    job: Option<windows::Job>,
}

/// The asks that wait for what the child tells of them, by their numbers,
/// and the number the next is given.
#[derive(Default)]
struct Waiting {
    next: u64,
    asks: Vec<(u64, mpsc::Sender<String>)>,
}

/// What a served child says on its standard error: the last of it, and
/// whether all of it has been read, which it has once the child has ended.
#[derive(Default)]
struct Said {
    last: Mutex<String>,
    all: AtomicBool,
}

fn lock<T>(mutex: &Mutex<T>) -> MutexGuard<'_, T> {
    mutex.lock().unwrap_or_else(PoisonError::into_inner)
}

/// Starts a child that does `task` on the file at `input` and lives on to
/// be asked ([`Serving::ask`]), holding no more than `memory` bytes. Nothing
/// where no program is set: the caller does the work itself.
pub fn start_serving(task: &str, input: &Path, memory: u64) -> Option<Result<Serving, Ended>> {
    let program = PROGRAM.get()?;
    Some(start_serving_with(program, task, input, memory))
}

/// As [`start_serving`], with the program given: for the tests.
pub fn start_serving_with(program: &Path, task: &str, input: &Path, memory: u64) -> Result<Serving, Ended> {
    let not_started = |e: &dyn std::fmt::Display| Ended::NotStarted(e.to_string());
    let place = tempfile::Builder::new().prefix("glaukopis-served-").tempdir().map_err(|e| not_started(&e))?;
    let output = place.path().join("out.json");
    let mut c = crate::export::tools::command(program);
    c.arg(FLAG).arg(task).arg(input).arg(&output);
    c.env(PARENT, std::process::id().to_string());
    c.stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::piped());
    // Not given the signal of its parent's end, which Linux sends when the
    // thread that started the child ends, not the application: a served
    // child outlives the thread that first asked of it. It ends with the
    // application all the same, as its input ends then, and as it watches
    // its parent (`end_with_parent`).
    unix_child_on_its_own(&mut c);
    let mut child = c.spawn().map_err(|e| not_started(&e))?;
    #[cfg(windows)]
    let job = windows::limit(&child, memory)
        .inspect_err(|code| {
            tracing::warn!(task, code, "the served process could not be given a bound on its memory");
        })
        .ok();
    let stdin = child.stdin.take();
    let waiting = Arc::new(Mutex::new(Waiting::default()));
    let said = Arc::new(Said::default());
    let (stdout, stderr) = (child.stdout.take(), child.stderr.take());
    let readers = {
        let (waiting, said, task, also) = (waiting.clone(), said.clone(), task.to_owned(), task.to_owned());
        std::thread::Builder::new().name("served-out".into()).spawn(move || hand_on(stdout, &waiting, &task)).and_then(
            |_| std::thread::Builder::new().name("served-err".into()).spawn(move || gather(stderr, &said, &also)),
        )
    };
    if let Err(e) = readers {
        // Unread, it would stop once its output is full, and be waited for in vain.
        kill(&mut child);
        return Err(not_started(&e));
    }
    tracing::debug!(task, pid = child.id(), "a served process was started");
    Ok(Serving {
        task: task.to_owned(),
        pid: child.id(),
        started: Instant::now(),
        memory,
        life: Mutex::new(Life {
            child,
            ended: None,
            #[cfg(windows)]
            job,
        }),
        stdin: Mutex::new(stdin),
        waiting,
        said,
        _place: place,
    })
}

/// Hands each line a served child tells to the ask it is told of, by the
/// number it begins with. What is told of an ask no longer waiting is let go.
fn hand_on(stdout: Option<ChildStdout>, waiting: &Mutex<Waiting>, task: &str) {
    use std::io::BufRead;
    let Some(out) = stdout else { return };
    for line in std::io::BufReader::new(out).lines() {
        let Ok(line) = line else { break };
        let Some((number, told)) = line.split_once(' ').and_then(|(n, told)| Some((n.parse::<u64>().ok()?, told)))
        else {
            tracing::debug!(task, line, "the served process said this on its output");
            continue;
        };
        let to = lock(waiting).asks.iter().find(|(n, _)| *n == number).map(|(_, to)| to.clone());
        if let Some(to) = to {
            let _ = to.send(told.to_owned());
        }
    }
}

/// Gathers what a served child says on its standard error, the last of it
/// kept; each line is said in the log as it comes, since the child may live
/// long after it was said.
fn gather(stderr: Option<ChildStderr>, said: &Said, task: &str) {
    use std::io::BufRead;
    if let Some(err) = stderr {
        for line in std::io::BufReader::new(err).lines() {
            let Ok(line) = line else { break };
            if !line.trim().is_empty() {
                tracing::warn!(task, line, "the served process said this while it worked");
            }
            let mut last = lock(&said.last);
            last.push_str(&line);
            last.push('\n');
            if last.len() > SAID_KEPT * 2 {
                let cut = last.len() - SAID_KEPT;
                let cut = (cut..last.len()).find(|&at| last.is_char_boundary(at)).unwrap_or(last.len());
                last.drain(..cut);
            }
        }
    }
    said.all.store(true, Ordering::Relaxed);
}

impl Serving {
    /// The number of its process.
    pub fn pid(&self) -> u32 {
        self.pid
    }

    /// Asks the child `line`, which holds no line break, and hands each line
    /// it tells of it to `told` until `told` says the answer is whole, by
    /// giving `true`. Other asks may wait at the same time. The child is
    /// killed when the ask has waited longer than `deadline`, and when it
    /// holds more memory than it was given, and the ask is then given up;
    /// as it is when the child ends. When `stop` is set, the ask is given
    /// up, and the child killed where no other ask waits for it.
    pub fn ask(
        &self,
        line: &str,
        deadline: Duration,
        told: &mut dyn FnMut(&str) -> bool,
        stop: &AtomicBool,
    ) -> Result<(), Ended> {
        if stop.load(Ordering::Relaxed) {
            return Err(Ended::Stopped);
        }
        self.watch()?;
        let (number, answers) = {
            let mut waiting = lock(&self.waiting);
            let number = waiting.next;
            waiting.next += 1;
            let (send, answers) = mpsc::channel();
            waiting.asks.push((number, send));
            (number, answers)
        };
        let asked = Instant::now();
        let answered = self.send(number, line).and_then(|()| {
            loop {
                if let Ok(answer) = answers.recv_timeout(TICK)
                    && told(&answer)
                {
                    break Ok(());
                }
                self.watch()?;
                if stop.load(Ordering::Relaxed) {
                    break Err(self.let_go(number));
                }
                if asked.elapsed() > deadline {
                    self.kill(Ended::Time);
                    break Err(Ended::Time);
                }
            }
        });
        lock(&self.waiting).asks.retain(|(n, _)| *n != number);
        answered
    }

    /// Writes an ask's line to the child. A child that no longer reads has
    /// ended, or is ending: why, once it has.
    fn send(&self, number: u64, line: &str) -> Result<(), Ended> {
        use std::io::Write;
        let written = match lock(&self.stdin).as_mut() {
            Some(input) => writeln!(input, "{number} {}", line.replace(['\n', '\r'], " ")).and_then(|()| input.flush()),
            None => Err(std::io::Error::from(std::io::ErrorKind::BrokenPipe)),
        };
        let Err(e) = written else { return Ok(()) };
        let until = Instant::now() + Duration::from_secs(1);
        while Instant::now() < until {
            self.watch()?;
            std::thread::sleep(Duration::from_millis(10));
        }
        let ended = Ended::Failed(e.to_string());
        self.kill(ended.clone());
        Err(ended)
    }

    /// Whether the child lives within its memory: why not, where it has
    /// ended, or is killed now for the memory it holds.
    fn watch(&self) -> Result<(), Ended> {
        let mut life = lock(&self.life);
        if let Some(ended) = &life.ended {
            return Err(ended.clone());
        }
        let ended = match life.child.try_wait() {
            Ok(Some(status)) => self.why_ended(status),
            Ok(None) if resident(self.pid).is_some_and(|held| held > self.memory) => {
                kill(&mut life.child);
                Ended::Memory
            }
            Ok(None) => return Ok(()),
            Err(e) => {
                // It cannot be watched: it is ended, lest it go on without bounds.
                kill(&mut life.child);
                Ended::Failed(e.to_string())
            }
        };
        self.ended(&mut life, ended.clone());
        Err(ended)
    }

    /// Why a child that has ended of itself ended: what it said last, once
    /// all it said has been read, or how it ended.
    fn why_ended(&self, status: std::process::ExitStatus) -> Ended {
        let until = Instant::now() + Duration::from_millis(200);
        while !self.said.all.load(Ordering::Relaxed) && Instant::now() < until {
            std::thread::sleep(Duration::from_millis(10));
        }
        let said = lock(&self.said.last).clone();
        // On Windows the job ends a child that takes too much, and the child
        // is told so as a failure to allocate.
        if said.contains("memory allocation") {
            return Ended::Memory;
        }
        let last = said.lines().rev().find(|l| !l.trim().is_empty()).unwrap_or("").trim().to_owned();
        Ended::Failed(if last.is_empty() { status.to_string() } else { last })
    }

    /// Kills the child, for `why`, where it has not ended already.
    fn kill(&self, why: Ended) {
        let mut life = lock(&self.life);
        if life.ended.is_none() {
            kill(&mut life.child);
            self.ended(&mut life, why);
        }
    }

    fn ended(&self, life: &mut Life, why: Ended) {
        // What the child started dies with its job.
        #[cfg(windows)]
        drop(life.job.take());
        let lived = self.started.elapsed().as_secs();
        tracing::info!(task = self.task, pid = self.pid, lived, ended = %why, "a served process ended");
        life.ended = Some(why);
    }

    /// An ask that was stopped lets go of the child, which is killed where
    /// no other ask waits for it: what was asked of it is no longer wanted.
    fn let_go(&self, number: u64) -> Ended {
        let mut waiting = lock(&self.waiting);
        waiting.asks.retain(|(n, _)| *n != number);
        if waiting.asks.is_empty() {
            self.kill(Ended::Stopped);
        }
        Ended::Stopped
    }

    /// Whether the child lives, within its memory: one that holds more is killed.
    pub fn alive(&self) -> bool {
        self.watch().is_ok()
    }

    /// Ends the child: it is killed, with what it started. An ask that
    /// waits for it is given up.
    pub fn end(&self) {
        drop(lock(&self.stdin).take());
        self.kill(Ended::Failed("it was ended".to_owned()));
    }
}

impl Drop for Serving {
    fn drop(&mut self) {
        self.end();
    }
}

/// In a task that is served ([`start_serving`]): each line it is asked,
/// with the number by which what it tells of the line is told
/// ([`tell_to`]), until the one who asks is gone.
pub fn asked() -> impl Iterator<Item = (u64, String)> {
    std::io::stdin().lines().map_while(std::result::Result::ok).filter_map(|line| {
        let (number, asked) = line.split_once(' ')?;
        Some((number.parse().ok()?, asked.to_owned()))
    })
}

/// In a task that is served: tells a line of what it was asked by `number`.
pub fn tell_to(number: u64, line: &str) {
    tell(&format!("{number} {line}"));
}

/// What a task of [`serve`] does: from the file it is given, what it gives.
type Task = fn(&Path) -> Result<Vec<u8>, String>;

/// The tasks a child can do, by name.
fn task(name: &str) -> Option<Task> {
    match name {
        "pdf-layer" => Some(|input| answer(&crate::ocr::layer::read_here(input)?)),
        "pdf-facts" => Some(|input| answer(&crate::import::pdf::read_here(input))),
        // The look at a PDF, and the work on its pages (`ocr/child.rs`).
        "pdf-look" => Some(crate::ocr::child::look_task),
        "pdf-job" => Some(crate::ocr::child::work_task),
        // A PDF kept open while its pages are drawn to be shown (`ocr/server.rs`).
        "pdf-serve" => Some(crate::ocr::child::serve_task),
        // For the tests of this module, only where they ask for them.
        "test-sleep" if testing() => Some(|_| {
            std::thread::sleep(Duration::from_secs(600));
            Ok(Vec::new())
        }),
        "test-eat" if testing() => Some(|_| {
            let mut held: Vec<Vec<u8>> = Vec::new();
            loop {
                held.push(vec![1; 16 << 20]);
                std::thread::sleep(Duration::from_millis(5));
            }
        }),
        "test-echo" if testing() => Some(|input| answer(&std::fs::read_to_string(input).map_err(|e| e.to_string())?)),
        // Tells a line every 20 ms, for ever.
        "test-tell" if testing() => Some(|_| {
            let mut n = 0u64;
            loop {
                tell(&n.to_string());
                n += 1;
                std::thread::sleep(Duration::from_millis(20));
            }
        }),
        // Tells three lines, and gives what it was given.
        "test-tell-and-give" if testing() => Some(|input| {
            for n in 1..=3 {
                tell(&format!("line {n}"));
            }
            answer(&std::fs::read_to_string(input).map_err(|e| e.to_string())?)
        }),
        // Starts a program that sleeps, tells its number, and sleeps itself.
        "test-family" if testing() => Some(|_| {
            let sleeper = std::process::Command::new("sleep").arg("600").spawn().map_err(|e| e.to_string())?;
            tell(&sleeper.id().to_string());
            std::thread::sleep(Duration::from_secs(600));
            Ok(Vec::new())
        }),
        // Served: tells each line it is asked back, until it is asked no more.
        "test-serve-echo" if testing() => Some(|_| {
            for (number, line) in asked() {
                tell_to(number, &format!("echo: {line}"));
            }
            Ok(Vec::new())
        }),
        // Served: waits as many milliseconds as each line says, the lines at
        // once, and tells that it has.
        "test-serve-wait" if testing() => Some(|_| {
            std::thread::scope(|scope| {
                for (number, line) in asked() {
                    scope.spawn(move || {
                        std::thread::sleep(Duration::from_millis(line.trim().parse().unwrap_or(0)));
                        tell_to(number, "waited");
                    });
                }
            });
            Ok(Vec::new())
        }),
        // Served: eats memory without end once it is asked anything.
        "test-serve-eat" if testing() => Some(|_| {
            let mut held: Vec<Vec<u8>> = Vec::new();
            if asked().next().is_some() {
                loop {
                    held.push(vec![1; 16 << 20]);
                    std::thread::sleep(Duration::from_millis(5));
                }
            }
            Ok(Vec::new())
        }),
        // Served: says why, and ends, once it is asked anything.
        "test-serve-end" if testing() => Some(|_| {
            if asked().next().is_some() {
                eprintln!("given up at once");
                std::process::exit(1);
            }
            Ok(Vec::new())
        }),
        _ => None,
    }
}

/// Whether the program is the one the tests start (`src/bin/glaukopis-isolated.rs`):
/// the tasks that sleep and eat memory are for it alone.
fn testing() -> bool {
    std::env::current_exe()
        .ok()
        .and_then(|exe| exe.file_stem().map(|s| s.to_string_lossy().starts_with("glaukopis-isolated")))
        .unwrap_or(false)
}

fn answer<T: Serialize>(value: &T) -> Result<Vec<u8>, String> {
    serde_json::to_vec(value).map_err(|e| e.to_string())
}

/// Does a task, where the program was started for one: `program FLAG task
/// input output`. Gives the code to end the program with; nothing where it
/// was started for anything else. The work is done on a thread with a large
/// stack, since PDFs are read by recursion.
pub fn serve(args: &[OsString]) -> Option<i32> {
    if args.get(1).is_none_or(|a| a != FLAG) {
        return None;
    }
    let (Some(name), Some(input), Some(output)) = (args.get(2), args.get(3), args.get(4)) else {
        eprintln!("{FLAG} wants a task, a file to read, and a file to write");
        return Some(2);
    };
    let Some(work) = name.to_str().and_then(task) else {
        eprintln!("no such task: {}", name.to_string_lossy());
        return Some(2);
    };
    let input = PathBuf::from(input);
    end_with_parent();
    let done = std::thread::Builder::new().stack_size(64 << 20).spawn(move || work(&input));
    let result = match done.map(|handle| handle.join()) {
        Ok(Ok(result)) => result,
        Ok(Err(_)) => Err("the task ended in a panic".to_owned()),
        Err(e) => Err(e.to_string()),
    };
    Some(match result.and_then(|bytes| std::fs::write(output, bytes).map_err(|e| e.to_string())) {
        Ok(()) => 0,
        Err(why) => {
            eprintln!("{why}");
            1
        }
    })
}

/// Where the system does not end the child with its parent (on Linux the
/// child is given a signal for it, `unix_child`; on Windows its job ends it),
/// the child ends itself once the parent is gone. It looks on Linux too,
/// where the signal makes it needless, so that what macOS relies on is run
/// and tested here, where it can be. The parent is what keeps
/// its time and its memory within bounds, and an application that was
/// killed or forced to quit must not leave a reader of PDFs eating the
/// machine's memory. The child looks about once a second; a parent that is
/// gone has given it to another (launchd, on macOS), and the parent's
/// number it is told is no longer the one it was. The parent's number is
/// the one in [`PARENT`], where the parent put it; where none is there, the
/// one the child has as it starts.
fn end_with_parent() {
    #[cfg(unix)]
    {
        let told = std::env::var(PARENT).ok().and_then(|v| v.parse::<libc::pid_t>().ok());
        // SAFETY: getppid has no preconditions and cannot fail.
        let parent = told.unwrap_or_else(|| unsafe { libc::getppid() });
        let gone = move || {
            // SAFETY: as above.
            let now = unsafe { libc::getppid() };
            now != parent || now == 1
        };
        if gone() {
            eprintln!("the application that asked for this is gone");
            std::process::exit(3);
        }
        let watching = std::thread::Builder::new().name("parent".into()).spawn(move || {
            loop {
                std::thread::sleep(Duration::from_secs(1));
                if gone() {
                    std::process::exit(3);
                }
            }
        });
        if let Err(e) = watching {
            eprintln!("the application cannot be watched, and this may outlive it: {e}");
        }
    }
}

/// The memory the machine has free, in bytes, where that can be told.
pub fn available_memory() -> Option<u64> {
    #[cfg(target_os = "linux")]
    {
        let info = std::fs::read_to_string("/proc/meminfo").ok()?;
        let line = info.lines().find(|l| l.starts_with("MemAvailable:"))?;
        let kb: u64 = line.split_whitespace().nth(1)?.parse().ok()?;
        Some(kb * 1024)
    }
    #[cfg(target_os = "macos")]
    {
        // What is free is hard to tell on macOS, where the system keeps memory
        // in use until it is wanted: half of what there is, as a fair guess.
        let mut size: u64 = 0;
        let mut len = std::mem::size_of::<u64>();
        let name = c"hw.memsize";
        // SAFETY: the name is a valid C string, and the buffer is a u64 of the given length.
        let ok =
            unsafe { libc::sysctlbyname(name.as_ptr(), (&raw mut size).cast(), &raw mut len, std::ptr::null_mut(), 0) };
        (ok == 0 && size > 0).then_some(size / 2)
    }
    #[cfg(windows)]
    {
        windows::available()
    }
    #[cfg(not(any(target_os = "linux", target_os = "macos", windows)))]
    {
        None
    }
}

/// The memory a process holds, in bytes, where it can be read: on Linux and
/// macOS, where the child is watched; on Windows its job keeps it within bounds.
fn resident(pid: u32) -> Option<u64> {
    #[cfg(target_os = "linux")]
    {
        let statm = std::fs::read_to_string(format!("/proc/{pid}/statm")).ok()?;
        let pages: u64 = statm.split_whitespace().nth(1)?.parse().ok()?;
        // SAFETY: sysconf has no preconditions.
        let page = unsafe { libc::sysconf(libc::_SC_PAGESIZE) };
        Some(pages * u64::try_from(page).ok()?)
    }
    #[cfg(target_os = "macos")]
    {
        // Asked of the kernel, as `ps` asks it, without starting a process
        // for it 25 times a second: one that may itself fail to start when
        // memory runs short, just when the answer matters.
        let pid = libc::c_int::try_from(pid).ok()?;
        // SAFETY: proc_taskinfo is plain integers, for which all zeros is a value.
        let mut info: libc::proc_taskinfo = unsafe { std::mem::zeroed() };
        let size = libc::c_int::try_from(std::mem::size_of::<libc::proc_taskinfo>()).ok()?;
        // SAFETY: the buffer is a proc_taskinfo of the size given, as PROC_PIDTASKINFO fills.
        let filled =
            unsafe { libc::proc_pidinfo(pid, libc::PROC_PIDTASKINFO, 0, (&raw mut info).cast::<libc::c_void>(), size) };
        // A short answer is no answer: the process has gone, or may not be asked.
        (filled == size).then_some(info.pti_resident_size)
    }
    #[cfg(not(any(target_os = "linux", target_os = "macos")))]
    {
        let _ = pid;
        None
    }
}

/// On Linux and macOS the child leads a process group of its own, so that
/// what it starts is killed with it ([`kill`]); on Linux it ends with the
/// application, should the application end first.
fn unix_child(c: &mut std::process::Command) {
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        // SAFETY: setpgid and prctl are safe to call between fork and exec,
        // and touch nothing of the parent.
        unsafe {
            c.pre_exec(|| {
                libc::setpgid(0, 0);
                #[cfg(target_os = "linux")]
                libc::prctl(libc::PR_SET_PDEATHSIG, libc::SIGKILL);
                Ok(())
            });
        }
    }
    #[cfg(not(unix))]
    {
        let _ = c;
    }
}

/// As [`unix_child`], without the signal on Linux: for a child that
/// outlives the thread that started it.
fn unix_child_on_its_own(c: &mut std::process::Command) {
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        // SAFETY: setpgid is safe to call between fork and exec, and touches
        // nothing of the parent.
        unsafe {
            c.pre_exec(|| {
                libc::setpgid(0, 0);
                Ok(())
            });
        }
    }
    #[cfg(not(unix))]
    {
        let _ = c;
    }
}

#[cfg(windows)]
mod windows {
    use std::os::windows::io::AsRawHandle;

    use windows_sys::Win32::Foundation::{CloseHandle, GetLastError, HANDLE};
    use windows_sys::Win32::System::JobObjects::{
        AssignProcessToJobObject, CreateJobObjectW, JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
        JOB_OBJECT_LIMIT_PROCESS_MEMORY, JOBOBJECT_EXTENDED_LIMIT_INFORMATION, JobObjectExtendedLimitInformation,
        SetInformationJobObject,
    };
    use windows_sys::Win32::System::SystemInformation::{GlobalMemoryStatusEx, MEMORYSTATUSEX};

    /// A job the child is put in: it may commit no more memory than it is
    /// given, and it ends when the job is closed, with the application.
    pub struct Job(HANDLE);

    // SAFETY: the handle of a job object belongs to the process, not to the
    // thread that made it, and may be used and closed from any thread; a Job
    // only closes it, once, as it is dropped. A served child's job is held in
    // its life, behind a mutex, and is dropped by whichever thread ends it.
    unsafe impl Send for Job {}

    impl Drop for Job {
        fn drop(&mut self) {
            // SAFETY: the handle was made by CreateJobObjectW and is closed once.
            unsafe { CloseHandle(self.0) };
        }
    }

    /// The job, or the code of the error of the system that kept it from
    /// being made or the child from being put in it.
    pub fn limit(child: &std::process::Child, memory: u64) -> Result<Job, u32> {
        // SAFETY: the calls are given valid handles and a limit structure of
        // the size they are told; the job handle is closed by Job's drop.
        // GetLastError has no preconditions.
        unsafe {
            let job = CreateJobObjectW(std::ptr::null(), std::ptr::null());
            if job.is_null() {
                return Err(GetLastError());
            }
            let job = Job(job);
            let mut info: JOBOBJECT_EXTENDED_LIMIT_INFORMATION = std::mem::zeroed();
            info.BasicLimitInformation.LimitFlags =
                JOB_OBJECT_LIMIT_PROCESS_MEMORY | JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
            info.ProcessMemoryLimit = usize::try_from(memory).unwrap_or(usize::MAX);
            let set = SetInformationJobObject(
                job.0,
                JobObjectExtendedLimitInformation,
                (&raw const info).cast(),
                std::mem::size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as u32,
            );
            if set == 0 || AssignProcessToJobObject(job.0, child.as_raw_handle() as HANDLE) == 0 {
                return Err(GetLastError());
            }
            Ok(job)
        }
    }

    pub fn available() -> Option<u64> {
        // SAFETY: the structure is zeroed and its length set, as the call asks.
        unsafe {
            let mut status: MEMORYSTATUSEX = std::mem::zeroed();
            status.dwLength = std::mem::size_of::<MEMORYSTATUSEX>() as u32;
            (GlobalMemoryStatusEx(&raw mut status) != 0).then_some(status.ullAvailPhys)
        }
    }
}
