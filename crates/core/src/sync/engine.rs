//! The engine of the synchronization (record 0120): one thread that brings
//! this computer to be the same as the home, one request at a time.
//!
//! A round:
//!
//! 1. What the home keeps is asked for, by one small call that says whether
//!    anything changed since it was last asked.
//! 2. The home document: what changed here is written into it, it is
//!    exchanged, and what changed elsewhere is written to disk (`mirror`).
//! 3. Each project: one that is on the server and not here is fetched whole
//!    and made; one that is here is exchanged where its files are not what
//!    they were at the last exchange, or the server's document is not the
//!    one last seen; one that was deleted goes to the trash, or is kept
//!    where this computer holds more of it than the deleter saw.
//! 4. The notebook.
//! 5. The library (`library`): its stores and the library's document, where
//!    either changed; then the files of the store follow their records
//!    (`files`), where they are due.
//!
//! What fails for one document is said and the round goes on with the next;
//! what fails for the server as a whole ends the round, which is tried again.
//!
//! The thread is woken when something was written here (`touched`), and
//! otherwise asks the server every half minute.

use std::cell::Cell;
use std::collections::{BTreeMap, BTreeSet};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Condvar, Mutex, MutexGuard, PoisonError};
use std::time::Duration;

use base64::Engine as _;
use serde::{Deserialize, Serialize};

use crate::error::{Error, Result};
use crate::history::{Record, now_ms};
use crate::library::{Library, now};
use crate::net::Client;
use crate::notebook::Notebook;
use crate::paths::DataDir;
use crate::projects::{Projects, keep_whole};
use crate::tr;

use super::arrangement::{Favourites, Folders, Places};
use super::facts::{Facts, SharedProjects};
use super::files;
use super::home::{HOME_FORM, HomeDoc};
use super::kept::{self, Apart, Cursor, Joined, Kept, Takes};
use super::library::{
    Collections, FileFolders, LIBRARY_FORM, OF_COLLECTIONS, OF_RECORDS, OF_REFERENCES, Records, References, STORED,
    Things, forget_agreed, keys_made_here, put_back, take_back,
};
use super::mirror::{self, Store};
use super::remote::{self, Answer, Home, Listing, NewCode, Told};
use super::settings::Settings;
use super::shelves::{Folder, InterfaceWords, SpellingWords};
use super::whole::{self, Lies};
use super::wrote;
use super::{FORM, hex, unhex};

/// How often the server is asked whether anything changed.
const EVERY: Duration = Duration::from_secs(30);

/// How long after something was written here it is sent: what is written
/// in the moments after goes with it.
const SOON: Duration = Duration::from_secs(3);

/// What the engine is doing.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum State {
    /// This computer is in no home.
    Off,
    /// Between rounds.
    Idle,
    /// In a round.
    Working,
    /// The server is not reached.
    Offline,
    /// The server lets this computer in no more.
    Refused,
}

/// What is told of the synchronization.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Status {
    /// Whether this computer is synchronized.
    pub on: bool,
    pub server: Option<String>,
    /// What this computer is called among the others.
    pub name: Option<String>,
    pub state: State,
    /// When everything was last the same, as RFC 3339.
    pub last: Option<String>,
    /// What is wrong, in words.
    pub problem: Option<String>,
}

/// What is done when the status is another.
type HearsStatus = Box<dyn Fn(&Status) + Send + std::marker::Sync>;
/// What is done with a change another computer wrote into a project, by the project's id.
type HearsProject = Box<dyn Fn(&str, &[u8]) + Send + std::marker::Sync>;
/// And with one it wrote into the notebook.
type HearsNotebook = Box<dyn Fn(&[u8]) + Send + std::marker::Sync>;
/// What is done when a project was written in apart: its id and its name.
type HearsApart = Box<dyn Fn(&str, &str) + Send + std::marker::Sync>;

/// What a document here holds beyond a state vector, or all of it where
/// there is none; nothing where there is no document.
type Mine<'a> = &'a dyn Fn(Option<&[u8]>) -> Result<Option<Vec<u8>>>;

/// A document of maps the core makes itself (`home`): what stands for no
/// document on disk, made one for the journey.
#[derive(Clone, Copy)]
struct Maps {
    /// Its kind, as the home keeps it; its id is `the`.
    kind: &'static str,
    /// The form of it this version writes and reads.
    form: u32,
    /// What is said where the home's is in a later form.
    later: fn() -> String,
}

impl Maps {
    fn name(&self) -> String {
        format!("{}/the", self.kind)
    }
}

/// The home document: the folders, the settings, what is said of each project.
const HOME: Maps = Maps { kind: "home", form: HOME_FORM, later: || tr!("core-sync-later-home") };

/// The library's document: the references, the collections, the record of the files (`library`).
const LIBRARY: Maps = Maps { kind: "library", form: LIBRARY_FORM, later: || tr!("core-sync-later-library") };

/// What a round of a document of maps does beyond the mirror (`maps_round`).
trait Meeting {
    /// Before what changed here is written into the maps; `news` says
    /// whether what changed elsewhere was taken in just before.
    fn before(&self, _doc: &HomeDoc, _news: bool) -> Result<()> {
        Ok(())
    }

    /// After the exchange, before what changed elsewhere is written to the
    /// stores. Whether it wrote into the document.
    fn between(&self, _doc: &HomeDoc) -> Result<bool> {
        Ok(false)
    }
}

/// A round of the mirror and nothing more.
struct Plain;

impl Meeting for Plain {}

/// The library's stores whose things are many names each: a thing deleted
/// on one computer while another changed it is kept (`library`).
struct OfLibrary<'a> {
    kept: &'a Kept,
    things: [(&'a dyn Store, Things); 3],
}

impl Meeting for OfLibrary<'_> {
    fn before(&self, doc: &HomeDoc, news: bool) -> Result<()> {
        // Where nothing came, the maps say what the stores agreed on last.
        if news {
            for (store, things) in self.things {
                take_back(doc, self.kept, store, things)?;
            }
        }
        Ok(())
    }

    fn between(&self, doc: &HomeDoc) -> Result<bool> {
        let mut wrote = false;
        for (store, things) in self.things {
            wrote |= put_back(doc, self.kept, store, things)?;
        }
        Ok(wrote)
    }
}

/// Under what name the round keeps how the library's files lay (`LibraryLies`).
const LIBRARY_LIES: &str = "library-lies";

/// How the files of the library lay when it was last brought to be the
/// same: how much each holds and when it was written. Where all three are
/// as they were, nothing was written to the library since.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
struct LibraryLies {
    references: (u64, i64),
    collections: (u64, i64),
    files: (u64, i64),
}

impl LibraryLies {
    fn of(dir: &Path) -> Self {
        LibraryLies {
            references: whole::lying(&dir.join("library.bib")),
            collections: whole::lying(&dir.join("collections.json")),
            files: whole::lying(&dir.join(crate::library::files::FILE)),
        }
    }
}

/// What the application does when the engine has something to tell.
pub struct Hears {
    /// The status is another.
    pub status: HearsStatus,
    /// Another computer wrote into a project: the change, for the windows
    /// that have it open. It is in the project's log already.
    pub project: HearsProject,
    /// The same of the notebook.
    pub notebook: HearsNotebook,
    /// A project was written in on two computers while they were apart: its id and its name.
    pub apart: HearsApart,
}

impl Default for Hears {
    fn default() -> Self {
        Hears {
            status: Box::new(|_| {}),
            project: Box::new(|_, _| {}),
            notebook: Box::new(|_| {}),
            apart: Box::new(|_, _| {}),
        }
    }
}

/// What a round keeps in memory from one to the next.
#[derive(Default)]
struct Round {
    /// The home document, of the home whose id is with it.
    home: Option<(String, HomeDoc)>,
    /// The stamp of what the home kept when it was last asked.
    stamp: Option<String>,
    /// The digests of the home's documents, by kind and id.
    docs: BTreeMap<String, String>,
    /// The library's document, of the home whose id is with it.
    library: Option<(String, HomeDoc)>,
    /// What is kept in memory of the files of the store between rounds.
    told: files::Told,
    /// Whether the files of the store were last found the same here and in
    /// the home, with nothing left to try again: until the library's
    /// document changes, they are not looked at. Not at the first round of a run.
    files_settled: bool,
}

#[derive(Default)]
struct Wake {
    /// Something was written here.
    touched: bool,
    /// A round is asked for at once.
    now: bool,
    /// The thread is to end.
    end: bool,
}

struct Said {
    state: State,
    last: Option<String>,
    problem: Option<String>,
}

pub struct Sync {
    projects: Projects,
    notebook: Arc<Notebook>,
    /// The library: held only while something is looked up or written, never while the network is waited for.
    library: Arc<Mutex<Library>>,
    settings: PathBuf,
    /// The folders of the writer's own reference styles, formats, templates and words.
    styles: PathBuf,
    formats: PathBuf,
    templates: PathBuf,
    words: PathBuf,
    kept: Kept,
    /// What the role that made the engine takes of a home: the application
    /// everything, the phone the notes. What a round does is the narrower
    /// of this and what the device joined as (`Takes::narrower`).
    takes: Takes,
    client: Client,
    hears: Hears,
    round: Mutex<Round>,
    said: Mutex<Said>,
    wake: Mutex<Wake>,
    woken: Condvar,
}

/// A project that is gone, as the home document says it.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(default)]
struct Gone {
    /// When it was deleted, in milliseconds since 1970.
    time: i64,
    /// The digest of its document on the server as the deleter last saw it.
    digest: Option<String>,
}

/// What came of exchanging a document: the answer, and the document as it
/// stood here before.
struct Got {
    answer: Answer,
    before: Option<Vec<u8>>,
    /// How the document lay here before it was read.
    lies: Lies,
}

/// What the network said went wrong, as a sentence of its own: it is
/// written to follow other words, and is shown alone here.
fn sentence(said: &str) -> String {
    let said = said.trim();
    let mut letters = said.chars();
    let mut out: String = match letters.next() {
        Some(first) => first.to_uppercase().chain(letters).collect(),
        None => String::new(),
    };
    if !out.ends_with(['.', '!', '?']) {
        out.push('.');
    }
    out
}

fn held<T>(lock: &Mutex<T>) -> MutexGuard<'_, T> {
    lock.lock().unwrap_or_else(PoisonError::into_inner)
}

/// Whether the server as a whole did not answer, or lets this computer in
/// no more: what ends a round, where a refusal of one document does not.
fn of_the_server(error: &Error) -> bool {
    matches!(error, Error::Network(_)) || refused_entry(error)
}

/// Whether the server lets this computer into its home no more: it was
/// removed, or the home is gone.
fn refused_entry(error: &Error) -> bool {
    matches!(error, Error::Refused { kind, .. } if matches!(*kind, "not-admitted" | "no-room" | "no-home" | "no-server"))
}

impl Sync {
    /// The engine of the device whose data is in `data`. `takes` is what
    /// the role that makes it takes of a home: the application everything,
    /// the phone the notes.
    pub fn new(
        data: &DataDir,
        projects: Projects,
        notebook: Arc<Notebook>,
        library: Arc<Mutex<Library>>,
        takes: Takes,
        hears: Hears,
    ) -> Self {
        let kept = Kept::new(data);
        let joined = kept.joined().ok().flatten();
        let on = joined.is_some();
        if let Some((joined, _)) = &joined
            && joined.takes != takes
        {
            // It does not happen to a device that is used as it was set up, and the writer is told nothing.
            tracing::warn!(
                role = ?takes,
                joined = ?joined.takes,
                "this device joined its home as another kind of device than it runs as: it does no more than both allow"
            );
        }
        Sync {
            projects,
            notebook,
            library,
            settings: data.settings_file(),
            styles: data.styles(),
            formats: data.formats(),
            templates: data.templates(),
            words: data.words(),
            kept,
            takes,
            client: Client::new(),
            hears,
            round: Mutex::new(Round::default()),
            said: Mutex::new(Said { state: if on { State::Idle } else { State::Off }, last: None, problem: None }),
            wake: Mutex::new(Wake::default()),
            woken: Condvar::new(),
        }
    }

    // ---- what is told ----

    pub fn status(&self) -> Status {
        let joined = self.kept.joined().ok().flatten().map(|(joined, _)| joined);
        let said = held(&self.said);
        Status {
            on: joined.is_some(),
            server: joined.as_ref().map(|j| j.server.clone()),
            name: joined.as_ref().map(|j| j.name.clone()),
            state: if joined.is_some() { said.state } else { State::Off },
            last: said.last.clone(),
            problem: said.problem.clone(),
        }
    }

    fn say(&self, state: State, problem: Option<String>, done: bool) {
        let before = self.status();
        {
            let mut said = held(&self.said);
            said.state = state;
            said.problem = problem;
            if done {
                said.last = Some(now());
            }
        }
        let after = self.status();
        if after != before {
            (self.hears.status)(&after);
        }
    }

    // ---- entering and leaving ----

    fn joined(&self) -> Result<(Joined, String)> {
        self.kept.joined()?.ok_or_else(|| Error::invalid(tr!("core-sync-not-on")))
    }

    fn enter(&self, server: String, entered: remote::Entered, name: &str) -> Result<Status> {
        let joined = Joined {
            server,
            home: entered.home,
            device: entered.device,
            name: name.to_owned(),
            takes: self.takes,
        };
        self.kept.join(&joined, &entered.token)?;
        *held(&self.round) = Round::default();
        {
            let mut said = held(&self.said);
            said.last = None;
        }
        self.say(State::Idle, None, false);
        self.now();
        Ok(self.status())
    }

    fn name(name: &str) -> Result<String> {
        let name = name.split_whitespace().collect::<Vec<_>>().join(" ");
        if name.is_empty() {
            return Err(Error::invalid(tr!("core-sync-needs-name")));
        }
        Ok(name.chars().take(100).collect())
    }

    /// Makes a home on a server, with this computer as its first.
    pub fn start(&self, server: &str, name: &str, password: Option<&str>) -> Result<Status> {
        if self.kept.joined()?.is_some() {
            return Err(Error::invalid(tr!("core-sync-already")));
        }
        let name = Self::name(name)?;
        let (server, entered) = remote::start(&self.client, server, &name, password)?;
        self.enter(server, entered, &name)
    }

    /// Enters a home by a code made on a computer that is in it.
    pub fn join(&self, server: &str, code: &str, name: &str) -> Result<Status> {
        if self.kept.joined()?.is_some() {
            return Err(Error::invalid(tr!("core-sync-already")));
        }
        let name = Self::name(name)?;
        let (server, entered) = remote::join(&self.client, server, code, &name)?;
        self.enter(server, entered, &name)
    }

    fn home<'a>(&'a self, joined: &Joined, token: &str) -> Result<Home<'a>> {
        Home::new(&self.client, &joined.server, &joined.home, token)
    }

    /// The computers of the home and the codes that are open, asked of the server.
    pub fn told(&self) -> Result<Told> {
        let (joined, token) = self.joined()?;
        self.home(&joined, &token)?.told()
    }

    /// Makes a code by which one more computer may enter.
    pub fn code(&self) -> Result<NewCode> {
        let (joined, token) = self.joined()?;
        self.home(&joined, &token)?.code()
    }

    pub fn rename(&self, device: &str, name: &str) -> Result<Told> {
        let (joined, token) = self.joined()?;
        let name = Self::name(name)?;
        let told = self.home(&joined, &token)?.rename(device, &name)?;
        if device == joined.device {
            self.kept.rename(&name)?;
            // The name is part of what is told.
            let (state, problem) = {
                let said = held(&self.said);
                (said.state, said.problem.clone())
            };
            self.say(state, problem, false);
        }
        Ok(told)
    }

    /// Removes a computer from the home. This one is removed by `stop`.
    pub fn remove(&self, device: &str) -> Result<Told> {
        let (joined, token) = self.joined()?;
        if device == joined.device {
            return Err(Error::invalid(tr!("core-sync-remove-self")));
        }
        let home = self.home(&joined, &token)?;
        home.remove(device)?;
        home.told()
    }

    /// This computer leaves its home. What it holds stays as it is. The
    /// server is told where it can be reached; where it cannot, or it lets
    /// this computer in no more, the computer leaves all the same, and is
    /// removed from another where it still stands in the home.
    pub fn stop(&self) -> Result<Status> {
        if let Some((joined, token)) = self.kept.joined()? {
            // The round under way, if one is, is let finish first.
            let _round = held(&self.round);
            if let Err(error) = self.home(&joined, &token).and_then(|home| home.remove(&joined.device)) {
                tracing::warn!(%error, "the server was not told that this computer leaves its home");
            }
            self.kept.leave()?;
        }
        *held(&self.round) = Round::default();
        {
            let mut said = held(&self.said);
            said.last = None;
        }
        self.say(State::Off, None, false);
        Ok(self.status())
    }

    // ---- the thread ----

    /// Something was written here: it is sent in a moment.
    pub fn touched(&self) {
        held(&self.wake).touched = true;
        self.woken.notify_all();
    }

    /// A round is made at once.
    pub fn now(&self) {
        held(&self.wake).now = true;
        self.woken.notify_all();
    }

    /// Ends the thread.
    pub fn end(&self) {
        held(&self.wake).end = true;
        self.woken.notify_all();
    }

    /// Starts the thread that makes the rounds.
    pub fn run(self: &Arc<Self>) -> std::io::Result<std::thread::JoinHandle<()>> {
        let this = self.clone();
        std::thread::Builder::new().name("synchronization".into()).spawn(move || this.turn())
    }

    fn turn(&self) {
        // The first round is made at once: what was written elsewhere while this computer was off.
        let mut hurried = true;
        loop {
            if !hurried {
                let wake = held(&self.wake);
                let (mut wake, _) = self
                    .woken
                    .wait_timeout_while(wake, EVERY, |w| !w.touched && !w.now && !w.end)
                    .unwrap_or_else(PoisonError::into_inner);
                if wake.end {
                    return;
                }
                hurried = wake.now;
                let touched = wake.touched;
                wake.now = false;
                wake.touched = false;
                drop(wake);
                if touched && !hurried {
                    // What is written in the moments after goes with it.
                    std::thread::sleep(SOON);
                    held(&self.wake).touched = false;
                }
            }
            self.once(hurried);
            hurried = false;
        }
    }

    /// One round, with what came of it said.
    pub fn once(&self, hurried: bool) {
        let Ok(Some(_)) = self.kept.joined() else {
            return;
        };
        let state = held(&self.said).state;
        // A computer the server lets in no more does not ask again: it stops, or joins anew.
        if state == State::Refused {
            return;
        }
        if hurried || state != State::Idle {
            let problem = held(&self.said).problem.clone();
            self.say(State::Working, problem, false);
        }
        match self.round() {
            Ok(problems) if problems.is_empty() => self.say(State::Idle, None, true),
            Ok(problems) => self.say(State::Idle, Some(problems.join("\n")), false),
            Err(error) if refused_entry(&error) => {
                tracing::warn!(%error, "the server lets this computer into its home no more");
                self.say(State::Refused, Some(tr!("core-sync-refused")), false);
            }
            Err(Error::Network(why)) => self.say(State::Offline, Some(sentence(&why)), false),
            Err(error) => {
                tracing::warn!(%error, "a round of the synchronization failed");
                self.say(State::Idle, Some(error.to_string()), false);
            }
        }
    }

    // ---- a round ----

    /// Brings this computer and its home to be the same. Returns what could
    /// not be done for single documents, in words.
    pub fn round(&self) -> Result<Vec<String>> {
        let Some((joined, token)) = self.kept.joined()? else { return Ok(Vec::new()) };
        let mut round = held(&self.round);
        let home = self.home(&joined, &token)?;
        let mut problems = Vec::new();

        match home.list(round.stamp.as_deref())? {
            Listing::Same => {}
            Listing::Docs { stamp, docs } => {
                round.stamp = Some(stamp);
                round.docs = docs.into_iter().map(|doc| (format!("{}/{}", doc.kind, doc.id), doc.digest)).collect();
            }
        }
        if round.home.as_ref().map(|(id, _)| id.as_str()) != Some(joined.home.as_str()) {
            round.home = Some((joined.home.clone(), HomeDoc::load(self.kept.doc(HOME.kind)?.as_deref())?));
        }
        if round.library.as_ref().map(|(id, _)| id.as_str()) != Some(joined.home.as_str()) {
            round.library = Some((joined.home.clone(), HomeDoc::load(self.kept.doc(LIBRARY.kind)?.as_deref())?));
        }
        let Round { home: Some((_, doc)), library: Some((_, library)), docs, told, files_settled, .. } = &mut *round
        else {
            unreachable!("the documents of maps were read above")
        };

        let met = self.met(&joined, docs)?;
        self.home_round(&home, &joined, doc, docs, &met)?;
        self.projects_round(&home, &joined, doc, docs, &mut problems)?;
        if let Err(error) = self.notebook_round(&home, &joined, docs) {
            if of_the_server(&error) {
                return Err(error);
            }
            problems.push(tr!("core-sync-problem-notebook", why = error.to_string()));
        }
        // After the notebook, whose notes hold files of the store.
        if let Err(error) = self.library_round(&home, &joined, library, docs, told, files_settled, &mut problems) {
            if of_the_server(&error) {
                return Err(error);
            }
            tracing::warn!(%error, "the library could not be synchronized");
            problems.push(tr!("core-sync-problem-library", why = error.to_string()));
        }
        // What the projects wrote into the home document, that one is gone or is not, is sent.
        if self.kept.unsent(HOME.kind) {
            self.exchange_maps(&home, &joined, HOME, doc, docs)?;
        }
        Ok(problems)
    }

    /// The projects this computer may speak of in the home document: those
    /// it has exchanged, and those the home does not have, which it is the
    /// one to tell of. A project that is here and on the server and was
    /// never exchanged has not been met: what the home says of it stands.
    fn met(&self, joined: &Joined, docs: &BTreeMap<String, String>) -> Result<BTreeSet<String>> {
        let mut met = BTreeSet::new();
        for info in self.projects.list()? {
            let name = format!("project/{}", info.id);
            let exchanged =
                self.projects.dir(&info.id).is_ok_and(|dir| kept::cursor(&dir, &joined.home, &name).is_some());
            if exchanged || !docs.contains_key(&name) {
                met.insert(info.id);
            }
        }
        Ok(met)
    }

    /// One exchange. Where the server proves to hold less than it was
    /// thought to (it was put back as it was earlier, or lost a document),
    /// everything is sent again and everything asked for.
    #[allow(clippy::too_many_arguments, reason = "what an exchange says, each a thing of its own")]
    fn ask(
        &self,
        home: &Home,
        kind: &str,
        id: &str,
        seen: Option<&str>,
        since: Option<&[u8]>,
        mine: Mine,
        quiet: bool,
    ) -> Result<Answer> {
        let changes = mine(since)?;
        let changes: Vec<&[u8]> = changes.iter().map(Vec::as_slice).collect();
        let answer = home.exchange(kind, id, seen, since, &changes, FORM, quiet)?;
        match since {
            Some(since) if !whole::covers(&answer.now, since)? => {
                tracing::warn!(kind, id, "the server holds less of a document than it did: everything is sent again");
                let all = mine(None)?;
                let all: Vec<&[u8]> = all.iter().map(Vec::as_slice).collect();
                home.exchange(kind, id, None, None, &all, FORM, quiet)
            }
            _ => Ok(answer),
        }
    }

    // ---- the documents of maps: the home document, the library's ----

    /// One exchange of a document of maps: what it holds beyond what the
    /// server was last seen to have is sent, and what came is taken in and
    /// kept. Whether anything came.
    fn exchange_maps(
        &self,
        home: &Home,
        joined: &Joined,
        maps: Maps,
        doc: &HomeDoc,
        docs: &mut BTreeMap<String, String>,
    ) -> Result<bool> {
        let name = maps.name();
        let of = self.kept.of_doc(maps.kind)?;
        let mut cursor = kept::cursor(&of, &joined.home, &name);
        // A document here that holds less than it was said to have had, lost
        // or put back as it was earlier, asks for all of the server's: asked
        // only for what lies beyond, it would never be given what it lost,
        // and what its stores hold would be taken for what was taken out
        // elsewhere.
        if let Some(since) = cursor.as_ref().and_then(|c| c.since.as_deref()).and_then(unhex)
            && !whole::covers(&doc.vector(), &since)?
        {
            tracing::warn!(document = %name, "a document of maps holds less than it did at the last exchange: all of it is asked for");
            cursor = None;
        }
        let seen = cursor.as_ref().and_then(|c| c.seen.clone());
        let since = cursor.as_ref().and_then(|c| c.since.as_deref()).and_then(unhex);
        let answer = self.ask(
            home,
            maps.kind,
            "the",
            seen.as_deref(),
            since.as_deref(),
            &|since| doc.beyond(since).map(Some),
            false,
        )?;
        let news = !whole::nothing(&answer.news);
        if news {
            doc.take_in(&answer.news)?;
        }
        self.kept.keep_doc(maps.kind, &doc.whole())?;
        let seen = Cursor {
            home: joined.home.clone(),
            doc: name.clone(),
            seen: Some(answer.digest.clone()),
            since: Some(hex(&answer.now)),
            lies: Lies::default(),
        };
        kept::keep_cursor(&of, &seen, &[])?;
        self.kept.mark_unsent(maps.kind, false)?;
        docs.insert(name, answer.digest);
        Ok(news)
    }

    /// Brings the stores of a document of maps and their maps to be the
    /// same, and the document and the server's (`mirror`): what changed
    /// elsewhere is taken in first, so that a store is compared with what
    /// the map says now; what changed here is written into it; it is
    /// exchanged; and what changed elsewhere is written to the stores, in
    /// their order. What a `meeting` does beyond that is done at its two
    /// moments. Whether the document changed in the round, here or elsewhere.
    #[allow(clippy::too_many_arguments, reason = "what a round holds, handed on as it is")]
    fn maps_round(
        &self,
        home: &Home,
        joined: &Joined,
        maps: Maps,
        doc: &HomeDoc,
        docs: &mut BTreeMap<String, String>,
        stores: &[&dyn Store],
        meeting: &dyn Meeting,
    ) -> Result<bool> {
        let name = maps.name();
        let cursor = kept::cursor(&self.kept.of_doc(maps.kind)?, &joined.home, &name);
        let theirs = docs.get(&name).cloned();
        let mut changed = false;
        let mut news = false;
        if theirs.is_some() && theirs != cursor.as_ref().and_then(|c| c.seen.clone()) {
            news = self.exchange_maps(home, joined, maps, doc, docs)?;
            changed |= news;
        }
        if doc.form() > maps.form {
            return Err(Error::invalid((maps.later)()));
        }
        // The computer that makes the document says its form.
        if theirs.is_none() && cursor.is_none() && doc.begin(maps.form) {
            self.kept.mark_unsent(maps.kind, true)?;
        }
        meeting.before(doc, news)?;
        let mut outwards = Vec::with_capacity(stores.len());
        let mut wrote = false;
        for store in stores {
            let (outward, written) = mirror::outward(doc, &self.kept, *store)?;
            wrote |= written;
            outwards.push(outward);
        }
        if wrote {
            self.kept.keep_doc(maps.kind, &doc.whole())?;
            self.kept.mark_unsent(maps.kind, true)?;
            changed = true;
        }
        if self.kept.unsent(maps.kind) {
            changed |= self.exchange_maps(home, joined, maps, doc, docs)?;
        }
        if meeting.between(doc)? {
            self.kept.keep_doc(maps.kind, &doc.whole())?;
            self.kept.mark_unsent(maps.kind, true)?;
            changed = true;
        }
        for (store, outward) in stores.iter().zip(outwards) {
            mirror::inward(doc, &self.kept, *store, outward)?;
        }
        Ok(changed)
    }

    fn home_round(
        &self,
        home: &Home,
        joined: &Joined,
        doc: &HomeDoc,
        docs: &mut BTreeMap<String, String>,
        met: &BTreeSet<String>,
    ) -> Result<()> {
        let folders = Folders { projects: &self.projects };
        let places = Places { projects: &self.projects, met };
        let favourites = Favourites { projects: &self.projects, met };
        let facts = Facts { projects: &self.projects, met };
        let shared = SharedProjects { projects: &self.projects, met };
        let settings = Settings { path: self.settings.clone() };
        // What the writer made their own: reference styles, formats, templates, and words.
        let styles = Folder { map: "styles", dir: self.styles.clone(), ending: ".csl" };
        let formats = Folder { map: "formats", dir: self.formats.clone(), ending: ".json" };
        let templates = Folder { map: "templates", dir: self.templates.clone(), ending: ".json" };
        let spelling = SpellingWords { own: crate::spelling::own::OwnWords::new(&self.words) };
        let interface = InterfaceWords { dir: self.words.clone() };
        // The folders before what is put in them; the styles, formats and
        // templates before the settings that name those to begin with.
        let stores: [&dyn Store; 11] = [
            &folders,
            &places,
            &favourites,
            &facts,
            &shared,
            &styles,
            &formats,
            &templates,
            &spelling,
            &interface,
            &settings,
        ];
        self.maps_round(home, joined, HOME, doc, docs, &stores, &Plain)?;
        Ok(())
    }

    // ---- the library ----

    /// The library: its stores and the library's document, where either
    /// changed; then its files, where they are due. Where the files of the
    /// library lie as they did when it was last brought to be the same, and
    /// the server's document is the one last seen, nothing of it is read.
    #[allow(clippy::too_many_arguments, reason = "what a round holds, handed on as it is")]
    fn library_round(
        &self,
        home: &Home,
        joined: &Joined,
        doc: &HomeDoc,
        docs: &mut BTreeMap<String, String>,
        told: &mut files::Told,
        files_settled: &mut bool,
        problems: &mut Vec<String>,
    ) -> Result<()> {
        let name = LIBRARY.name();
        let cursor = kept::cursor(&self.kept.of_doc(LIBRARY.kind)?, &joined.home, &name);
        // How its files lie, with how often the library wrote them, under one hold of it.
        let (dir, empty, lies, writes, damaged) = {
            let mut library = held(&self.library);
            let empty = library.is_empty()
                && library.collections.list.is_empty()
                && library.files.files().is_empty()
                && library.files.folders().is_empty();
            let dir = library.dir().to_owned();
            let lies = LibraryLies::of(&dir);
            (dir, empty, lies, library.writes(), library.take_damaged())
        };
        // A library that holds nothing, of a home that has none, is nobody's to send.
        if empty && cursor.is_none() && !docs.contains_key(&name) {
            return Ok(());
        }
        // How often the round wrote the library's files itself.
        let own = Cell::new(0);
        let quiet = !damaged.any()
            && !self.kept.unsent(LIBRARY.kind)
            && cursor.is_some_and(|c| c.seen.as_ref() == docs.get(&name))
            && self.kept.noted::<LibraryLies>(LIBRARY_LIES).as_ref() == Some(&lies);
        let mut changed = false;
        if !quiet {
            // What was read from a damaged file is no change made here: the store meets its map as for the first time.
            for (amiss, store) in [
                (damaged.references, "references"),
                (damaged.collections, "collections"),
                (damaged.files, "files"),
                (damaged.files, "file-folders"),
            ] {
                if amiss {
                    tracing::warn!(
                        store,
                        "a file of the library was found amiss: it meets the home as for the first time"
                    );
                    self.kept.forget_base(store)?;
                }
            }
            let held_by_notes: BTreeSet<String> = self.notebook.held().into_iter().collect();
            let folders = FileFolders { library: &self.library, written: Cell::new(0) };
            let records = Records {
                library: &self.library,
                doc,
                held: &held_by_notes,
                kept_for_notes: Default::default(),
                written: Cell::new(0),
            };
            let references = References { library: &self.library, doc, written: Cell::new(0) };
            let collections = Collections { library: &self.library, doc, written: Cell::new(0) };
            // A folder before what is put in it, a record before the reference that names its file, a reference before its collection.
            let stores: [&dyn Store; 4] = [&folders, &records, &references, &collections];
            let meeting = OfLibrary {
                kept: &self.kept,
                things: [(&records, OF_RECORDS), (&references, OF_REFERENCES), (&collections, OF_COLLECTIONS)],
            };
            changed = self.maps_round(home, joined, LIBRARY, doc, docs, &stores, &meeting)?;
            // What the library's rules made otherwise than the map said is told at the next round.
            let keys = keys_made_here(&self.library, doc);
            forget_agreed(&self.kept, references.name(), |name| keys.contains(name))?;
            let kept = records.kept_for_notes.take();
            forget_agreed(&self.kept, records.name(), |name| {
                name.split_once('/').is_some_and(|(hash, _)| kept.contains(hash))
            })?;
            own.set(
                folders.written.get() + records.written.get() + references.written.get() + collections.written.get(),
            );
        }
        if changed || !*files_settled {
            let note = |hash: &str, size: Option<&str>| self.note(LIBRARY, doc, STORED, hash, size);
            let done = files::bring(home, &self.library, doc, told, &note, &own)?;
            problems.extend(done.problems);
            *files_settled = !done.again;
        }
        // Where only the round wrote the library's files since they were
        // looked at, they lie as it left them, and that is what is kept:
        // nothing was changed here that the next round must read. Where
        // anything else wrote them meanwhile, how they lay before is kept,
        // and the next round reads them.
        let (now, written) = {
            let library = held(&self.library);
            (LibraryLies::of(&dir), library.writes() - writes)
        };
        if written == own.get() {
            if written > 0 || !quiet {
                self.kept.note(LIBRARY_LIES, &now)?;
            }
        } else if !quiet {
            self.kept.note(LIBRARY_LIES, &lies)?;
        }
        if self.kept.unsent(LIBRARY.kind) {
            self.exchange_maps(home, joined, LIBRARY, doc, docs)?;
        }
        Ok(())
    }

    /// Writes into a document of maps, to be sent at the end of the round.
    fn note(&self, maps: Maps, doc: &HomeDoc, map: &str, name: &str, value: Option<&str>) -> Result<()> {
        if doc.put(map, name, value) {
            self.kept.keep_doc(maps.kind, &doc.whole())?;
            self.kept.mark_unsent(maps.kind, true)?;
        }
        Ok(())
    }

    // ---- documents kept as a state and a log ----

    /// Exchanges the document kept in `dir`. Nothing is written by it: see `settle`.
    fn exchange_doc(&self, home: &Home, joined: &Joined, kind: &str, id: &str, dir: &Path) -> Result<Got> {
        let name = format!("{kind}/{id}");
        // Whether the writer wrote in a project since it was last exchanged
        // (`wrote`): the mark is taken before the project is read, so that
        // what is written meanwhile marks it anew. Of what is no project,
        // all that is written is the writer's.
        let marked = kind == "project" && wrote::take(dir);
        let wrote = marked || kind != "project";
        // How it lies is looked at before it is read: what is written
        // meanwhile makes it lie otherwise, and is sent the next time.
        let lies = whole::lies(dir);
        let before = match whole::read(dir) {
            Ok(before) => before,
            Err(error) => {
                if marked {
                    wrote::mark(dir);
                }
                return Err(error);
            }
        };
        let mut cursor = kept::cursor(dir, &joined.home, &name);
        if let (Some(_), Some(here)) = (&cursor, &before)
            && let Some(had) = kept::had(dir).filter(|had| !had.is_empty())
            && !whole::holds(here, &had)?
        {
            // The document here lost something on its way to the disk: all of the server's is asked for.
            tracing::warn!(document = %name, "a document holds less than it did at the last exchange: all of it is asked for");
            cursor = None;
        }
        if before.is_none() {
            cursor = None;
        }
        let seen = cursor.as_ref().and_then(|c| c.seen.clone());
        let since = cursor.as_ref().and_then(|c| c.since.as_deref()).and_then(unhex);
        let mine: Mine = &|since| match (&before, since) {
            (Some(here), Some(since)) => whole::beyond(here, since).map(Some),
            (Some(here), None) => Ok(Some(here.clone())),
            (None, _) => Ok(None),
        };
        match self.ask(home, kind, id, seen.as_deref(), since.as_deref(), mine, !wrote) {
            Ok(answer) => Ok(Got { answer, before, lies }),
            Err(error) => {
                // Not told to the server: the mark stands for the next time.
                if marked {
                    wrote::mark(dir);
                }
                Err(error)
            }
        }
    }

    /// Keeps what was seen of the server's document, once what it sent is
    /// in the log. `appended` is how much the log grew by that: where the
    /// files are otherwise as they were, they are kept as they lie now, so
    /// that what the engine wrote itself is not taken for a change to send.
    fn settle(&self, joined: &Joined, name: &str, dir: &Path, got: &Got, appended: u64) -> Result<()> {
        let news = Some(got.answer.news.as_slice()).filter(|news| !whole::nothing(news));
        let after = match (&got.before, news) {
            (Some(before), Some(news)) => Some(whole::merged([before.as_slice(), news])?),
            (Some(before), None) => Some(before.clone()),
            (None, Some(news)) => Some(news.to_vec()),
            (None, None) => None,
        };
        let had = match &after {
            Some(after) => whole::moment(after)?,
            None => Vec::new(),
        };
        let now = whole::lies(dir);
        let own = appended > 0 && now.state == got.lies.state && now.log.0 == got.lies.log.0 + appended;
        let cursor = Cursor {
            home: joined.home.clone(),
            doc: name.to_owned(),
            seen: Some(got.answer.digest.clone()),
            since: Some(hex(&got.answer.now)),
            lies: if own { now } else { got.lies },
        };
        kept::keep_cursor(dir, &cursor, &had)
    }

    /// Whether the document in `dir` is to be exchanged: its files are not
    /// what they were at the last exchange, or the server's document is not
    /// the one last seen.
    fn needs(&self, joined: &Joined, name: &str, dir: &Path, docs: &BTreeMap<String, String>) -> bool {
        match kept::cursor(dir, &joined.home, name) {
            None => true,
            Some(cursor) => cursor.lies != whole::lies(dir) || cursor.seen.as_ref() != docs.get(name),
        }
    }

    // ---- the projects ----

    fn projects_round(
        &self,
        home: &Home,
        joined: &Joined,
        doc: &HomeDoc,
        docs: &mut BTreeMap<String, String>,
        problems: &mut Vec<String>,
    ) -> Result<()> {
        let here: BTreeMap<String, String> = self.projects.list()?.into_iter().map(|i| (i.id, i.name)).collect();
        // The trash, by the id of each project: the one deleted last, where one was deleted twice.
        let mut trash: BTreeMap<String, String> = BTreeMap::new();
        for (entry, info) in self.projects.trash()? {
            trash.entry(info.id).or_insert(entry);
        }
        let gone: BTreeMap<String, Gone> = doc
            .map("gone")
            .into_iter()
            .map(|(id, said)| (id, serde_json::from_str(&said).unwrap_or_default()))
            .collect();
        // What this computer knows to be gone, and what it has seen in its trash.
        let mut known = self.kept.base("gone")?.unwrap_or_default();
        let mut trashed = self.kept.base("trash")?.unwrap_or_default();

        let mut ids: BTreeSet<String> = here.keys().cloned().collect();
        ids.extend(trash.keys().cloned());
        ids.extend(gone.keys().cloned());
        ids.extend(trashed.keys().cloned());
        ids.extend(docs.keys().filter_map(|name| name.strip_prefix("project/")).map(str::to_owned));

        for id in ids {
            let project = Project { id: &id, here: here.get(&id), trash: trash.get(&id), gone: gone.get(&id) };
            let done = self.project(home, joined, doc, docs, &project, &mut known, &mut trashed);
            if let Err(error) = done {
                if of_the_server(&error) {
                    self.kept.keep_base("gone", &known)?;
                    self.kept.keep_base("trash", &trashed)?;
                    return Err(error);
                }
                let name = here.get(&id).cloned().unwrap_or_else(|| id.clone());
                tracing::warn!(%error, project = %id, "a project could not be synchronized");
                problems.push(tr!("core-sync-problem-project", name = name, why = error.to_string()));
            }
        }
        self.kept.keep_base("gone", &known)?;
        self.kept.keep_base("trash", &trashed)
    }

    #[allow(clippy::too_many_arguments, reason = "what a round holds, handed on as it is")]
    fn project(
        &self,
        home: &Home,
        joined: &Joined,
        doc: &HomeDoc,
        docs: &mut BTreeMap<String, String>,
        project: &Project,
        known: &mut BTreeMap<String, String>,
        trashed: &mut BTreeMap<String, String>,
    ) -> Result<()> {
        let id = project.id;
        let name = format!("project/{id}");
        if project.here.is_some() {
            let dir = self.projects.dir(id)?;
            if let Some(gone) = project.gone {
                let untouched = !known.contains_key(id)
                    && kept::cursor(&dir, &joined.home, &name).is_some_and(|cursor| {
                        cursor.lies == whole::lies(&dir)
                            && cursor.seen == gone.digest
                            && docs.get(&name) == gone.digest.as_ref()
                    });
                if untouched {
                    // Deleted elsewhere, and nothing was written in it that the deleter did not see.
                    self.projects.delete(id)?;
                    known.insert(id.to_owned(), String::new());
                    trashed.insert(id.to_owned(), String::new());
                    return Ok(());
                }
                // Written in since, here or elsewhere, or brought back here: it is kept, and not gone.
                self.note(HOME, doc, "gone", id, None)?;
                known.remove(id);
            }
            return self.exchange_project(home, joined, doc, docs, id);
        }
        if let Some(entry) = project.trash {
            trashed.insert(id.to_owned(), String::new());
            match (project.gone, known.contains_key(id)) {
                (Some(_), _) => {
                    known.insert(id.to_owned(), String::new());
                }
                // Known to be gone, and gone no more: it was kept elsewhere, and comes back here.
                (None, true) => {
                    let back = self.projects.restore(entry)?;
                    known.remove(id);
                    trashed.remove(id);
                    if back.id == id {
                        return self.exchange_project(home, joined, doc, docs, id);
                    }
                }
                // Deleted here. One that the home never had is told to no one.
                (None, false) => {
                    let dir = self.projects.trashed_dir(entry)?;
                    if let Some(cursor) = kept::cursor(&dir, &joined.home, &name) {
                        let gone = Gone { time: now_ms(), digest: cursor.seen };
                        self.note(HOME, doc, "gone", id, Some(&serde_json::to_string(&gone)?))?;
                        known.insert(id.to_owned(), String::new());
                    }
                }
            }
            return Ok(());
        }
        // Neither here nor in the trash.
        if trashed.remove(id).is_some() {
            // Removed from the trash for good, here: the server's copy goes with it.
            if project.gone.is_some() && docs.contains_key(&name) {
                home.delete("project", id)?;
                docs.remove(&name);
            }
            return Ok(());
        }
        if project.gone.is_none() {
            known.remove(id);
            if docs.contains_key(&name) {
                return self.fetch_project(home, joined, doc, docs, id);
            }
        }
        Ok(())
    }

    /// What the home says of one project is taken as agreed: see `mirror::adopt`.
    fn adopt(&self, doc: &HomeDoc, id: &str) -> Result<()> {
        let met: BTreeSet<String> = [id.to_owned()].into();
        let names = [id.to_owned()];
        let places = Places { projects: &self.projects, met: &met };
        let favourites = Favourites { projects: &self.projects, met: &met };
        let facts = Facts { projects: &self.projects, met: &met };
        let shared = SharedProjects { projects: &self.projects, met: &met };
        let stores: [&dyn Store; 4] = [&places, &favourites, &facts, &shared];
        for store in stores {
            mirror::adopt(doc, &self.kept, store, &names)?;
        }
        Ok(())
    }

    /// A project that the home has and this computer does not is made here, whole.
    fn fetch_project(
        &self,
        home: &Home,
        joined: &Joined,
        doc: &HomeDoc,
        docs: &mut BTreeMap<String, String>,
        id: &str,
    ) -> Result<()> {
        let name = format!("project/{id}");
        let answer = home.exchange("project", id, None, None, &[], FORM, true)?;
        if whole::nothing(&answer.news) {
            return Ok(());
        }
        #[derive(Deserialize)]
        struct Named {
            name: String,
        }
        let called = doc
            .get("facts", id)
            .and_then(|said| serde_json::from_str::<Named>(&said).ok())
            .map(|named| named.name)
            .filter(|name| !name.trim().is_empty())
            .or_else(|| whole::name(&answer.news))
            .unwrap_or_else(|| tr!("core-sync-unnamed"));
        self.projects.create_from(id, &called, &answer.news)?;
        let dir = self.projects.dir(id)?;
        let seen = Cursor {
            home: joined.home.clone(),
            doc: name.clone(),
            seen: Some(answer.digest.clone()),
            since: Some(hex(&answer.now)),
            lies: whole::lies(&dir),
        };
        kept::keep_cursor(&dir, &seen, &whole::moment(&answer.news)?)?;
        docs.insert(name, answer.digest);
        self.adopt(doc, id)
    }

    fn exchange_project(
        &self,
        home: &Home,
        joined: &Joined,
        doc: &HomeDoc,
        docs: &mut BTreeMap<String, String>,
        id: &str,
    ) -> Result<()> {
        let name = format!("project/{id}");
        let dir = self.projects.dir(id)?;
        if !self.needs(joined, &name, &dir, docs) {
            return Ok(());
        }
        let first = kept::cursor(&dir, &joined.home, &name).is_none();
        let got = self.exchange_doc(home, joined, "project", id, &dir)?;
        let mut appended = 0;
        if !whole::nothing(&got.answer.news) {
            let news = &got.answer.news;
            // The project as it stood here is kept before what another
            // computer wrote comes into it: now and then, and always where
            // the two wrote apart.
            let apart = got.answer.apart && got.before.is_some();
            if let Some(before) = &got.before {
                let version = self.projects.keep_version(id, before, apart)?;
                if apart {
                    let moment = base64::engine::general_purpose::STANDARD.encode(whole::moment(before)?);
                    kept::keep_apart(&dir, &Apart { time: now_ms(), moment, kept: version })?;
                }
            }
            let time = now_ms();
            appended = Record::change(news.clone(), false, time).encode().len() as u64;
            self.projects.append_change(id, news, false, time)?;
            (self.hears.project)(id, news);
            let info = self.projects.update_info(id, |info| info.modified = now())?;
            if apart {
                (self.hears.apart)(id, &info.name);
            }
        }
        self.settle(joined, &name, &dir, &got, appended)?;
        docs.insert(name, got.answer.digest.clone());
        if first {
            // Met for the first time: what the home says of it stands.
            self.adopt(doc, id)?;
        }
        Ok(())
    }

    // ---- the notebook ----

    fn notebook_round(&self, home: &Home, joined: &Joined, docs: &mut BTreeMap<String, String>) -> Result<()> {
        const NAME: &str = "notebook/the";
        let dir = self.notebook.dir().to_owned();
        // A notebook that nothing was written in, on a server that has none, is nobody's to send.
        if !docs.contains_key(NAME) && whole::lies(&dir) == Lies::default() {
            return Ok(());
        }
        if !self.needs(joined, NAME, &dir, docs) {
            return Ok(());
        }
        let got = self.exchange_doc(home, joined, "notebook", "the", &dir)?;
        let mut appended = 0;
        if !whole::nothing(&got.answer.news) {
            let news = &got.answer.news;
            if let Some(before) = &got.before {
                keep_whole(&dir, before, got.answer.apart)?;
            }
            let time = now_ms();
            appended = Record::change(news.clone(), false, time).encode().len() as u64;
            self.notebook.append_change(news, false, time)?;
            (self.hears.notebook)(news);
        }
        self.settle(joined, NAME, &dir, &got, appended)?;
        docs.insert(NAME.to_owned(), got.answer.digest.clone());
        Ok(())
    }

    // ---- what was written apart ----

    /// What is kept of a project having been written in on two computers
    /// apart, until the writer has seen it.
    pub fn apart(&self, id: &str) -> Result<Option<Apart>> {
        Ok(kept::apart(&self.projects.dir(id)?))
    }

    /// The writer has seen it.
    pub fn apart_seen(&self, id: &str) -> Result<()> {
        kept::forget_apart(&self.projects.dir(id)?)
    }
}

/// A project as a round finds it.
struct Project<'a> {
    id: &'a str,
    /// Its name, where it is here.
    here: Option<&'a String>,
    /// Its name in the trash, where it is there.
    trash: Option<&'a String>,
    /// What the home document says of its being gone.
    gone: Option<&'a Gone>,
}
