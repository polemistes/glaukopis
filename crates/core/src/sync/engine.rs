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
//! That is the round of a device that takes everything of its home: a
//! computer. A device that takes the notes, a phone (`Takes`; the plan
//! `docs/plans/an-app-for-android.md`), holds the notebook, the files its
//! notes hold, and the references without their files, and does less:
//!
//! - the home document is read, where the server's is not the one last
//!   seen, and nothing is written into it (`home_read`): no folder,
//!   favourite, setting, style or word of a phone is mirrored, and it is
//!   never sent;
//! - step 3 is not done: no project is listed, fetched, sent, moved to the
//!   trash or said to be gone, and no document is taken off the server;
//! - the notebook and the library are exchanged as on a computer;
//! - of the files, one is sent as on a computer, one is fetched only where
//!   its record says that the notes hold it, and none is taken off the
//!   server (`files`).
//!
//! The role that makes the engine says what it takes, and what the device
//! joined its home as is kept (`kept`): a device does no more than both
//! allow (`Takes::narrower`), so everything by which a round takes a
//! document or a file off the server, or says that a project is gone, is
//! done only where both say everything.
//!
//! What the notes hold is kept through all of it (stage 2 of that plan):
//!
//! - whether the notebook was refused at its last exchange is kept from one
//!   run to the next (`sync::notebook_refused`), since a device that lacks
//!   the notes of others must sweep no file out of the store;
//! - what the notes here hold is not taken from this device by what another
//!   said (`library::Records`), and what was kept so is told again by a
//!   round that is asked for at once;
//! - a file of the library that was not on the disk when the library was
//!   read, where this device and its home had agreed on something of it,
//!   was lost and not emptied: its store meets its map as for the first
//!   time. What was agreed on is forgotten on the disk as soon as the
//!   engine is made, and before every round (`heed_amiss`).
//!
//! The thread is woken when something was written here (`touched`), and
//! otherwise asks the server every half minute. A phone's app that is not
//! in front asks nothing at regular times (`front`), but where a file was
//! left to be tried again. What is told of it all (`Status`) says whether
//! what was written here waits for a server that is not reached.

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
    /// Whether the notebook or the library here holds what the server was
    /// not sent, as far as the disk says without asking it: worked out
    /// where a round could not reach the server, and false where it ended
    /// in any other way. Of the projects it says nothing.
    pub waiting: bool,
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

/// The notebook's document, as the home keeps it.
const NOTEBOOK: &str = "notebook/the";

/// Under what name the round keeps whether the notebook was refused at its
/// last exchange (`sync::notebook_refused`).
pub(super) const NOTEBOOK_REFUSED: &str = "notebook-refused";

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

/// Whether a library holds nothing at all: no reference, no collection, no
/// record of a file and no folder for one.
fn holds_nothing(library: &Library) -> bool {
    library.is_empty()
        && library.collections.list.is_empty()
        && library.files.files().is_empty()
        && library.files.folders().is_empty()
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
    /// Whether the notebook was refused at its last exchange, as it is
    /// kept (`NOTEBOOK_REFUSED`): written only where it is another than it
    /// was. Nothing before it was read or written in this run.
    notebook_refused: Option<bool>,
}

struct Wake {
    /// Something was written here.
    touched: bool,
    /// A round is asked for at once.
    now: bool,
    /// The thread is to end.
    end: bool,
    /// Whether the app is in front (`Sync::front`): a computer's always is.
    front: bool,
    /// Whether the last round left a file of the store to be tried again:
    /// one that could not be sent, fetched or taken off the server.
    left: bool,
}

impl Default for Wake {
    fn default() -> Self {
        Wake { touched: false, now: false, end: false, front: true, left: false }
    }
}

impl Wake {
    /// How long the thread waits at the most before it asks the server
    /// whether anything changed: the half minute while the app is in front,
    /// and without end while it is not, until something wakes it. Where a
    /// file was left to be tried again it is the half minute in front or
    /// not: a picture that is on this device alone is not left so for as
    /// long as the app stays behind the others. It is not tried at once,
    /// since what failed may fail every time.
    fn at_most(&self) -> Option<Duration> {
        (self.front || self.left).then_some(EVERY)
    }
}

struct Said {
    state: State,
    last: Option<String>,
    problem: Option<String>,
    waiting: bool,
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
    /// The stores of the library whose files were found amiss or lost, and
    /// of which what was agreed on is still to be forgotten on the disk
    /// (`heed_amiss`): none, but where the disk refused it.
    amiss: Mutex<BTreeSet<&'static str>>,
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
        let sync = Sync {
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
            said: Mutex::new(Said {
                state: if on { State::Idle } else { State::Off },
                last: None,
                problem: None,
                waiting: false,
            }),
            wake: Mutex::new(Wake::default()),
            woken: Condvar::new(),
            amiss: Mutex::new(BTreeSet::new()),
        };
        // Before any thread runs and anything is asked of a server: see `heed_amiss`.
        if let Err(error) = sync.heed_amiss() {
            tracing::error!(%error, "what was agreed on of a damaged or lost file of the library could not be forgotten: it is tried again before every round");
        }
        sync
    }

    /// Takes from the library what it found amiss in its files, or not on
    /// the disk, when it read them, and forgets on the disk what the
    /// stores of those files and their maps had agreed on: they meet the
    /// next time as for the first time, where what the home says stands
    /// and nothing is taken out of either.
    ///
    /// What was read from a damaged file is no change made here. And a file
    /// that was not on the disk reads as one emptied: where this device and
    /// its home had agreed on something of it, it was lost, since the
    /// writer who empties a library leaves its files written, with nothing
    /// in them.
    ///
    /// It is done when the engine is made, which is as soon as the library
    /// has been read, and again before every round and before the library
    /// is come to in one, for what is found amiss while the application
    /// runs. The library knows of it in memory alone, and writes a file
    /// anew in the run that found it missing: were it left to the round
    /// that comes to the library, a start whose rounds never come there (no
    /// server, a home document in a later form) would leave nothing to
    /// remember it by, and the next start would tell everything that file
    /// held as taken out, on every device. What was agreed on is forgotten
    /// on the disk, so no start can lose it.
    fn heed_amiss(&self) -> Result<()> {
        let (damaged, missing) = {
            let mut library = held(&self.library);
            // The library's file lost while the application runs is missed
            // here, and not first by the round's own reading of the library.
            // Where it cannot be read at all, the round says so when it comes to it.
            if let Err(error) = library.refresh() {
                tracing::warn!(%error, "the library's file could not be looked at before a round");
            }
            (library.take_damaged(), library.take_missing())
        };
        // A device in no home has agreed on nothing.
        if self.kept.joined().ok().flatten().is_none() {
            return Ok(());
        }
        // What cannot be read of what was agreed on counts as something: nothing is to be told by it.
        let agreed_on =
            |store: &str| self.kept.base(store).map_or(true, |agreed| agreed.is_some_and(|names| !names.is_empty()));
        let files = damaged.files || (missing.files && (agreed_on("files") || agreed_on("file-folders")));
        let found = [
            (damaged.references || (missing.references && agreed_on("references")), "references"),
            (damaged.collections || (missing.collections && agreed_on("collections")), "collections"),
            (files, "files"),
            (files, "file-folders"),
        ];
        let mut amiss = held(&self.amiss);
        amiss.extend(found.into_iter().filter(|(found, _)| *found).map(|(_, store)| store));
        if amiss.is_empty() {
            return Ok(());
        }
        for store in amiss.iter() {
            tracing::warn!(
                store,
                "a file of the library was found amiss or lost: its store meets the home as for the first time"
            );
            self.kept.forget_base(store)?;
        }
        // And the round that comes to the library reads it, though its files may lie as they did.
        self.kept.forget_note(LIBRARY_LIES)?;
        amiss.clear();
        Ok(())
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
            waiting: joined.is_some() && said.waiting,
        }
    }

    /// Says what the engine is doing. `waiting` is whether what was written
    /// here waits to be sent, where that was worked out; with none it is
    /// left as it was said, as while a round is under way, so that it does
    /// not go and come with every try.
    fn say(&self, state: State, problem: Option<String>, done: bool, waiting: Option<bool>) {
        let before = self.status();
        {
            let mut said = held(&self.said);
            said.state = state;
            said.problem = problem;
            if done {
                said.last = Some(now());
            }
            if let Some(waiting) = waiting {
                said.waiting = waiting;
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
        let joined =
            Joined { server, home: entered.home, device: entered.device, name: name.to_owned(), takes: self.takes };
        self.kept.join(&joined, &entered.token)?;
        *held(&self.round) = Round::default();
        {
            let mut said = held(&self.said);
            said.last = None;
        }
        self.say(State::Idle, None, false, Some(false));
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
            self.say(state, problem, false, None);
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
        self.say(State::Off, None, false, Some(false));
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

    /// Whether a round is asked for at once and not yet begun: by `now`, by
    /// `front`, by entering a home, or by a round that kept something for
    /// the notes that the next is to tell again.
    pub fn asked(&self) -> bool {
        held(&self.wake).now
    }

    /// Ends the thread.
    pub fn end(&self) {
        held(&self.wake).end = true;
        self.woken.notify_all();
    }

    /// Says whether the app is in front. Either way a round is made at
    /// once: what was written before the app left the front is sent, and
    /// what was written elsewhere is fetched when it comes back. While it
    /// is not in front the thread asks nothing at regular times
    /// (`Wake::at_most`); it is woken as ever by what is written here, by
    /// `now` and by `end`. A computer never says it, and is always in front.
    pub fn front(&self, front: bool) {
        {
            let mut wake = held(&self.wake);
            if wake.front != front {
                if front {
                    tracing::info!("the app is in front again");
                } else {
                    tracing::info!("the app is not in front, and nothing is asked at regular times");
                }
            }
            wake.front = front;
            wake.now = true;
        }
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
                let asleep = |w: &mut Wake| !w.touched && !w.now && !w.end;
                let mut wake = match wake.at_most() {
                    Some(most) => {
                        self.woken.wait_timeout_while(wake, most, asleep).unwrap_or_else(PoisonError::into_inner).0
                    }
                    // Not in front: until something wakes it.
                    None => self.woken.wait_while(wake, asleep).unwrap_or_else(PoisonError::into_inner),
                };
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
            self.say(State::Working, problem, false, None);
        }
        match self.round() {
            Ok(problems) if problems.is_empty() => self.say(State::Idle, None, true, Some(false)),
            Ok(problems) => self.say(State::Idle, Some(problems.join("\n")), false, Some(false)),
            Err(error) if refused_entry(&error) => {
                tracing::warn!(%error, "the server lets this computer into its home no more");
                self.say(State::Refused, Some(tr!("core-sync-refused")), false, Some(false));
            }
            // The server was not reached: whether what was written here waits for it is looked at on the disk.
            Err(Error::Network(why)) => {
                let waiting = self.waits();
                self.say(State::Offline, Some(sentence(&why)), false, Some(waiting));
            }
            Err(error) => {
                tracing::warn!(%error, "a round of the synchronization failed");
                self.say(State::Idle, Some(error.to_string()), false, Some(false));
            }
        }
    }

    // ---- what waits to be sent ----

    /// Whether the notebook or the library here holds what the server was
    /// not sent, as far as the disk says without asking it. Of the projects
    /// it says nothing: it is the phone's page that shows it, and a phone
    /// has none.
    fn waits(&self) -> bool {
        let Ok(Some((joined, _))) = self.kept.joined() else { return false };
        self.notebook_waits(&joined) || self.library_waits(&joined)
    }

    /// Whether the notebook's files lie otherwise than at its last
    /// exchange, and the document here holds more than it held at the
    /// moment kept then (`sync.had`, kept with what was last seen of the
    /// server's document): a change, or a deletion, made since. All it held
    /// at that moment the server holds: what it had was sent, and what came
    /// was taken in. The document is read only where the files lie
    /// otherwise.
    ///
    /// It is not asked what the document holds beyond the state vector the
    /// server was last seen at (`whole::beyond`): what was deleted is in
    /// that always, so a notebook in which anything was ever deleted would
    /// be said to wait whenever its files were written since, as when its
    /// page saves the whole with nothing new in it.
    fn notebook_waits(&self, joined: &Joined) -> bool {
        let dir = self.notebook.dir();
        let cursor = kept::cursor(dir, &joined.home, NOTEBOOK);
        // As they lay then, or never written to and never exchanged: nothing was written since.
        if whole::lies(dir) == cursor.as_ref().map(|c| c.lies).unwrap_or_default() {
            return false;
        }
        // The moment is of the exchange with this home, as what was seen then is; of a notebook never exchanged there is none.
        let then = cursor.and_then(|_| kept::had(dir)).filter(|moment| !moment.is_empty());
        match (whole::read(dir), then) {
            // A moment that cannot be read says nothing of what was sent.
            (Ok(Some(here)), Some(then)) => whole::holds_more(&here, &then).unwrap_or(true),
            (Ok(Some(here)), None) => !whole::nothing(&here),
            (Ok(None), _) => false,
            // Written to since, and not readable: what it holds cannot be said to have been sent.
            (Err(_), _) => true,
        }
    }

    /// Whether the library's files lie otherwise than when it was last
    /// brought to be the same as the home. A library that holds nothing and
    /// was never exchanged is nobody's to send (`library_round`).
    fn library_waits(&self, joined: &Joined) -> bool {
        let (dir, empty) = {
            let library = held(&self.library);
            (library.dir().to_owned(), holds_nothing(&library))
        };
        let exchanged =
            self.kept.of_doc(LIBRARY.kind).is_ok_and(|of| kept::cursor(&of, &joined.home, &LIBRARY.name()).is_some());
        if empty && !exchanged {
            return false;
        }
        self.kept.noted::<LibraryLies>(LIBRARY_LIES) != Some(LibraryLies::of(&dir))
    }

    // ---- a round ----

    /// Brings this computer and its home to be the same. Returns what could
    /// not be done for single documents, in words. A phone does of it what
    /// a device that takes the notes does: see the head of this file.
    pub fn round(&self) -> Result<Vec<String>> {
        let Some((joined, token)) = self.kept.joined()? else { return Ok(Vec::new()) };
        // No more than the role and what the device joined as both allow: asked here, once, and handed down.
        let takes = self.takes.narrower(joined.takes);
        let mut round = held(&self.round);
        // Before anything is asked of the server, and so before anything can end the round.
        self.heed_amiss()?;
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
        let Round {
            home: Some((_, doc)),
            library: Some((_, library)),
            docs,
            told,
            files_settled,
            notebook_refused,
            ..
        } = &mut *round
        else {
            unreachable!("the documents of maps were read above")
        };

        match takes {
            Takes::Everything => {
                let met = self.met(&joined, docs)?;
                self.home_round(&home, &joined, doc, docs, &met)?;
                self.projects_round(&home, &joined, doc, docs, &mut problems)?;
            }
            // A phone reads the home document and writes nothing into it, and touches no project.
            Takes::Notes => self.home_read(&home, &joined, doc, docs)?,
        }
        // Where the round ends here for the server's sake, or ended before,
        // whether the notebook was refused is left as it is kept.
        let refused = match self.notebook_round(&home, &joined, docs) {
            Ok(()) => false,
            Err(error) if of_the_server(&error) => return Err(error),
            // A later form, too large, not readable here: the notes of others are not on this device.
            Err(error) => {
                problems.push(tr!("core-sync-problem-notebook", why = error.to_string()));
                true
            }
        };
        let was = notebook_refused.unwrap_or_else(|| self.kept.noted::<bool>(NOTEBOOK_REFUSED).unwrap_or(false));
        if refused != was {
            self.kept.note(NOTEBOOK_REFUSED, &refused)?;
        }
        *notebook_refused = Some(refused);
        // After the notebook, whose notes hold files of the store.
        if let Err(error) = self.library_round(&home, &joined, library, docs, told, files_settled, takes, &mut problems)
        {
            if of_the_server(&error) {
                return Err(error);
            }
            tracing::warn!(%error, "the library could not be synchronized");
            problems.push(tr!("core-sync-problem-library", why = error.to_string()));
        }
        match takes {
            // What the projects wrote into the home document, that one is gone or is not, is sent.
            Takes::Everything => {
                if self.kept.unsent(HOME.kind) {
                    self.exchange_maps(&home, &joined, HOME, doc, docs, true)?;
                }
            }
            // A phone sends nothing of the home document, also where it is marked as holding something unsent.
            Takes::Notes => {}
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
    /// kept. Whether anything came. Without `send` nothing is sent, whatever
    /// the document holds, and the mark that it holds something unsent is
    /// left as it is: so a phone reads the home document (`home_read`).
    fn exchange_maps(
        &self,
        home: &Home,
        joined: &Joined,
        maps: Maps,
        doc: &HomeDoc,
        docs: &mut BTreeMap<String, String>,
        send: bool,
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
            // Without `send` the document gives nothing of its own whatever
            // it is asked, so that no change goes with the exchange: also
            // where `ask` asks a second time, the server holding less than it did.
            &|since| if send { doc.beyond(since).map(Some) } else { Ok(None) },
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
        if send {
            self.kept.mark_unsent(maps.kind, false)?;
        }
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
            news = self.exchange_maps(home, joined, maps, doc, docs, true)?;
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
            changed |= self.exchange_maps(home, joined, maps, doc, docs, true)?;
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

    /// What a phone does with the home document, in the place of
    /// `home_round`: where the server's is not the one last seen, it is
    /// exchanged with nothing sent, and what came is taken in and kept, with
    /// what was seen of it. The maps lie in `sync/home.bin` as they came,
    /// for the list of projects later. Nothing is written into the
    /// document: a phone does not begin its form, and gives it no store, so
    /// nothing of the folders, the favourites, what the list shows, how a
    /// project is shared, the settings, the styles, the formats, the
    /// templates or the words is read from the phone's disk or written to
    /// it, and nothing is kept of them as agreed. That a project is said to
    /// be gone is not acted on. A home document in a later form ends the
    /// round, as it does on a computer.
    fn home_read(
        &self,
        home: &Home,
        joined: &Joined,
        doc: &HomeDoc,
        docs: &mut BTreeMap<String, String>,
    ) -> Result<()> {
        let name = HOME.name();
        let cursor = kept::cursor(&self.kept.of_doc(HOME.kind)?, &joined.home, &name);
        let theirs = docs.get(&name).cloned();
        if theirs.is_some() && theirs != cursor.and_then(|c| c.seen) {
            self.exchange_maps(home, joined, HOME, doc, docs, false)?;
        }
        if doc.form() > HOME.form {
            return Err(Error::invalid((HOME.later)()));
        }
        Ok(())
    }

    // ---- the library ----

    /// The library: its stores and the library's document, where either
    /// changed; then its files, where they are due. Where the files of the
    /// library lie as they did when it was last brought to be the same, and
    /// the server's document is the one last seen, nothing of it is read.
    /// The same on a phone, its stores mirrored both ways as on a computer:
    /// `takes` is for the files alone (`files::bring`).
    #[allow(clippy::too_many_arguments, reason = "what a round holds, handed on as it is")]
    fn library_round(
        &self,
        home: &Home,
        joined: &Joined,
        doc: &HomeDoc,
        docs: &mut BTreeMap<String, String>,
        told: &mut files::Told,
        files_settled: &mut bool,
        takes: Takes,
        problems: &mut Vec<String>,
    ) -> Result<()> {
        let name = LIBRARY.name();
        let cursor = kept::cursor(&self.kept.of_doc(LIBRARY.kind)?, &joined.home, &name);
        // What the library found amiss or lost since the round began: the
        // stores of such files meet their maps as for the first time, and
        // how the library's files lay is forgotten, so that this round
        // reads them.
        self.heed_amiss()?;
        // How its files lie, with how often the library wrote them, under one hold of it.
        let (dir, empty, lies, writes) = {
            let library = held(&self.library);
            let empty = holds_nothing(&library);
            let dir = library.dir().to_owned();
            let lies = LibraryLies::of(&dir);
            (dir, empty, lies, library.writes())
        };
        // A library that holds nothing, of a home that has none, is nobody's to send.
        if empty && cursor.is_none() && !docs.contains_key(&name) {
            return Ok(());
        }
        // How often the round wrote the library's files itself.
        let own = Cell::new(0);
        let quiet = !self.kept.unsent(LIBRARY.kind)
            && cursor.is_some_and(|c| c.seen.as_ref() == docs.get(&name))
            && self.kept.noted::<LibraryLies>(LIBRARY_LIES).as_ref() == Some(&lies);
        let mut changed = false;
        // Whether something stays here for the notes that is to be told again at the next round.
        let mut again = false;
        if !quiet {
            let held_by_notes: BTreeSet<String> = self.notebook.held().into_iter().collect();
            let folders = FileFolders { library: &self.library, written: Cell::new(0) };
            let records = Records {
                library: &self.library,
                doc,
                held: &held_by_notes,
                kept_for_notes: Default::default(),
                marks_kept_for_notes: Default::default(),
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
            // What stays here for the notes, though another device took it
            // out, is told again when the records next meet their map: at
            // the next round, which must read the library for it also
            // where nothing else has changed by then. So how the library's
            // files lay is forgotten, and that first: a round that finds
            // nothing kept of it is never one in which nothing changed.
            again = records.keeps_for_notes();
            if again {
                self.kept.forget_note(LIBRARY_LIES)?;
            }
            records.tell_again(&self.kept)?;
            if again {
                // And that round is asked for at once: until it is made the
                // file may be on this device alone, and where the app is not
                // in front the thread would wait for it without end.
                self.now();
            }
            own.set(
                folders.written.get() + records.written.get() + references.written.get() + collections.written.get(),
            );
        }
        if changed || !*files_settled {
            let note = |hash: &str, size: Option<&str>| self.note(LIBRARY, doc, STORED, hash, size);
            let done = files::bring(home, &self.library, doc, told, &note, &own, takes)?;
            problems.extend(done.problems);
            *files_settled = !done.again;
            // A file left to be tried again is tried within the half minute, in front or not (`Wake::at_most`).
            held(&self.wake).left = done.again;
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
        // And where something is to be told again, nothing is kept of how
        // they lie: it was forgotten above, for the next round to read them.
        if !again {
            if written == own.get() {
                if written > 0 || !quiet {
                    self.kept.note(LIBRARY_LIES, &now)?;
                }
            } else if !quiet {
                self.kept.note(LIBRARY_LIES, &lies)?;
            }
        }
        if self.kept.unsent(LIBRARY.kind) {
            self.exchange_maps(home, joined, LIBRARY, doc, docs, true)?;
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
        const NAME: &str = NOTEBOOK;
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

#[cfg(test)]
mod tests {
    use super::*;

    /// An engine of a device that is in no home, in a folder of its own.
    fn engine() -> (tempfile::TempDir, Sync) {
        let tmp = tempfile::tempdir().unwrap();
        let data = DataDir::open(tmp.path().join("data")).unwrap();
        let sync = Sync::new(
            &data,
            Projects::new(&data),
            Arc::new(Notebook::new(&data)),
            Arc::new(Mutex::new(Library::open(&data).unwrap())),
            Takes::Notes,
            Hears::default(),
        );
        (tmp, sync)
    }

    #[test]
    fn in_front_the_thread_waits_half_a_minute_at_the_most_and_not_in_front_until_it_is_woken() {
        let wake = Wake::default();
        assert!(wake.front, "a device is in front until it says otherwise, and a computer never says it");
        assert_eq!(wake.at_most(), Some(EVERY));
        let behind = Wake { front: false, ..Wake::default() };
        assert_eq!(behind.at_most(), None, "nothing is asked at regular times");
        // But where a file was left to be tried again: within the half minute, in front or not, and never at once.
        let left = Wake { front: false, left: true, ..Wake::default() };
        assert_eq!(left.at_most(), Some(EVERY));
        assert_eq!(Wake { left: true, ..Wake::default() }.at_most(), Some(EVERY));
    }

    #[test]
    fn what_the_library_found_amiss_is_taken_when_the_engine_is_made() {
        let tmp = tempfile::tempdir().unwrap();
        let data = DataDir::open(tmp.path().join("data")).unwrap();
        let library = Arc::new(Mutex::new(Library::open(&data).unwrap()));
        let made = |library: &Arc<Mutex<Library>>| {
            Sync::new(
                &data,
                Projects::new(&data),
                Arc::new(Notebook::new(&data)),
                library.clone(),
                Takes::Notes,
                Hears::default(),
            )
        };
        // A device in a home, which had agreed with it on a reference and a record, and on no collection.
        let kept = Kept::new(&data);
        let joined = Joined { server: "http://127.0.0.1:1".into(), home: "h".into(), ..Default::default() };
        kept.join(&joined, "t").unwrap();
        let agreed = BTreeMap::from([("r/=added".to_owned(), "then".to_owned())]);
        for store in ["references", "files", "file-folders"] {
            kept.keep_base(store, &agreed).unwrap();
        }
        kept.keep_base("collections", &BTreeMap::new()).unwrap();
        kept.note(LIBRARY_LIES, &LibraryLies::of(&data.library())).unwrap();
        // The library, never written to, had none of its files when it was read.
        let sync = made(&library);
        for store in ["references", "files", "file-folders"] {
            assert_eq!(kept.base(store).unwrap(), None, "{store}: what was agreed on is forgotten on the disk");
        }
        assert_eq!(kept.base("collections").unwrap(), Some(BTreeMap::new()), "nothing was agreed on of it");
        assert_eq!(kept.noted::<LibraryLies>(LIBRARY_LIES), None, "and the library is read at the next round");
        assert!(held(&sync.amiss).is_empty());
        let mut library = held(&library);
        assert!(!library.take_missing().references && !library.take_damaged().any(), "taken from the library");
    }

    #[test]
    fn leaving_the_front_and_coming_back_each_ask_for_a_round_at_once() {
        let (_tmp, sync) = engine();
        assert_eq!(held(&sync.wake).at_most(), Some(EVERY));
        sync.front(false);
        {
            let mut wake = held(&sync.wake);
            assert!(wake.now, "a round is made at once, with what was written before the app left");
            assert_eq!(wake.at_most(), None);
            wake.now = false;
        }
        // What is written here wakes it as ever.
        sync.touched();
        assert!(held(&sync.wake).touched);
        sync.front(true);
        let wake = held(&sync.wake);
        assert!(wake.now, "and one when it comes back");
        assert_eq!(wake.at_most(), Some(EVERY));
    }

    #[test]
    fn a_device_in_no_home_says_that_nothing_waits() {
        let (_tmp, sync) = engine();
        sync.notebook.append(b"written here", 1).unwrap();
        assert!(!sync.waits());
        let status = sync.status();
        assert_eq!((status.state, status.waiting), (State::Off, false));
    }
}
