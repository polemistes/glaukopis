//! A phone among a writer's computers (the plan
//! `docs/plans/an-app-for-android.md`, stage 1): a device that takes the
//! notes of its home and not everything, tried with the application's own
//! engine on each device and the server between them, over HTTP, as
//! `synchronization.rs` and `synchronized_library.rs` try two computers.
//!
//! A phone holds the notebook, the files its notes hold, and the references
//! without their files. It does not hold what the home holds, so nothing it
//! lacks may be taken for deleted: a phone takes no document and no file off
//! the server, says no project to be gone, and writes nothing into the home
//! document. That is what is held here, rule by rule.
//!
//! And what the notes hold is kept (stage 2 of the plan), by the last six:
//! a file a phone's note holds comes back to a computer that swept it out
//! with less of the notebook than there is; a device whose notebook was
//! refused says so, for the sweep to be left; a phone that loses the files
//! of its library tells nothing as taken out; a phone says whether what
//! was written on it waits for a server that is not reached; a picture
//! that became the library's is not taken out of its lists by a device
//! whose notes held it alone (two computers, since any device will do);
//! and a lost file of the library is remembered through a start that
//! never reaches the server.
//!
//! And where the form has changed, the synchronization stops (the owner's
//! rule of 2026-11-23): a device that meets a document of its home in a
//! later form than its version knows, the notebook, a project, the
//! library's document or the home document, sends, fetches and takes
//! nothing more, says that an update is needed, and goes on when the
//! application has been updated; a phone and a computer alike. It can
//! still leave its home.
//!
//! A device is a folder of data with the stores the application opens in
//! it, and an engine that is told what the device takes: that is the one
//! difference between a computer and a phone. What the interface would do
//! is done by hand, and a round of the engine is made by calling it.

use std::collections::{BTreeMap, HashSet};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, MutexGuard};
use std::time::Duration;

use glaukopis_core::Error;
use glaukopis_core::history::now_ms;
use glaukopis_core::library::files::{Held, store_paths};
use glaukopis_core::library::{Entry, Library, attachments, draft_from_source};
use glaukopis_core::net::Client;
use glaukopis_core::notebook::Notebook;
use glaukopis_core::paths::DataDir;
use glaukopis_core::projects::Projects;
use glaukopis_core::sync::home::{HOME_FORM, HomeDoc};
use glaukopis_core::sync::kept::Kept;
use glaukopis_core::sync::library::LIBRARY_FORM;
use glaukopis_core::sync::remote::{Home, Listing};
use glaukopis_core::sync::{self, Hears, Knows, State, Sync, Takes, whole};
use glaukopis_server::{Config, Server, serve};
use serde_json::{Map, Value, json};
use tokio::sync::oneshot;
use yrs::updates::decoder::Decode;
use yrs::{Doc, GetString, Map as _, ReadTxn, Text, Transact, Update};

struct Device {
    tmp: tempfile::TempDir,
    data: DataDir,
    projects: Projects,
    notebook: Arc<Notebook>,
    library: Arc<Mutex<Library>>,
    sync: Sync,
    /// What its engine was told that the device takes.
    takes: Takes,
}

impl Device {
    /// A device that takes everything of its home.
    fn computer() -> Device {
        Self::opened(tempfile::tempdir().unwrap(), Takes::Everything)
    }

    /// A computer with a later version of the application, which knows the forms `knows`.
    fn later_computer(knows: Knows) -> Device {
        Self::of_version(tempfile::tempdir().unwrap(), Takes::Everything, knows)
    }

    /// A device that takes the notes.
    fn phone() -> Device {
        Self::opened(tempfile::tempdir().unwrap(), Takes::Notes)
    }

    /// The stores of a folder opened, and an engine made that is told
    /// `takes`: as when the application is started in a role.
    fn opened(tmp: tempfile::TempDir, takes: Takes) -> Device {
        Self::of_version(tmp, takes, Knows::default())
    }

    /// The same, with the engine of a version of the application that knows the forms `knows`.
    fn of_version(tmp: tempfile::TempDir, takes: Takes, knows: Knows) -> Device {
        let data = DataDir::open(tmp.path().join("data")).unwrap();
        let projects = Projects::new(&data);
        let notebook = Arc::new(Notebook::new(&data));
        let library = Arc::new(Mutex::new(Library::open(&data).unwrap()));
        let hears = Hears::default();
        let sync = Sync::of_version(&data, projects.clone(), notebook.clone(), library.clone(), takes, hears, knows);
        Device { tmp, data, projects, notebook, library, sync, takes }
    }

    /// The same folder, with all it holds and the home it is in, given an
    /// engine that is told another thing than the device joined as.
    fn given(self, takes: Takes) -> Device {
        let Device { tmp, data, projects, notebook, library, sync, .. } = self;
        drop((sync, library, notebook, projects, data));
        Self::opened(tmp, takes)
    }

    /// The same folder, with all it holds and the home it is in, started
    /// again: by the version it ran, or, with other `knows`, when the
    /// application has been updated to a version that knows those forms.
    fn started_again(self, knows: Knows) -> Device {
        let Device { tmp, data, projects, notebook, library, sync, takes } = self;
        drop((sync, library, notebook, projects, data));
        Self::of_version(tmp, takes, knows)
    }

    /// A round, in which nothing is to go wrong.
    fn round(&self) {
        let problems = self.sync.round().expect("the round is made");
        assert!(problems.is_empty(), "{problems:?}");
    }

    // ---- the projects ----

    /// The document of a project as a window that opens it would hold it.
    fn open(&self, id: &str) -> Doc {
        let doc = Doc::new();
        if let Some(whole) = whole::read(&self.projects.dir(id).unwrap()).unwrap() {
            doc.transact_mut().apply_update(Update::decode_v1(&whole).unwrap()).unwrap();
        }
        doc
    }

    /// A project with a name in its document and words in its text.
    fn project(&self, name: &str, words: &str) -> String {
        let id = self.projects.create(name).unwrap().id;
        let doc = Doc::new();
        doc.get_or_insert_map("meta").insert(&mut doc.transact_mut(), "name", name);
        doc.get_or_insert_text("text").insert(&mut doc.transact_mut(), 0, words);
        let change = doc.transact().encode_state_as_update_v1(&yrs::StateVector::default());
        self.projects.append(&id, &change).unwrap();
        id
    }

    /// Writes words into the text of a project, as a window would: the change goes to the log.
    fn write(&self, id: &str, at: u32, words: &str) {
        let doc = self.open(id);
        let before = doc.transact().state_vector();
        doc.get_or_insert_text("text").insert(&mut doc.transact_mut(), at, words);
        let change = doc.transact().encode_state_as_update_v1(&before);
        self.projects.append(id, &change).unwrap();
        // As the shell marks a project that the writer wrote in.
        sync::wrote::mark(&self.projects.dir(id).unwrap());
    }

    fn text(&self, id: &str) -> String {
        let doc = self.open(id);
        doc.get_or_insert_text("text").get_string(&doc.transact())
    }

    /// Writes into a project as a later version of the application does
    /// that puts something of the form `form` into a text: the document
    /// says its form, in the map `form`, and the words follow.
    fn write_in_form(&self, id: &str, form: u32, words: &str) {
        let doc = self.open(id);
        let before = doc.transact().state_vector();
        doc.get_or_insert_map("form").insert(&mut doc.transact_mut(), form.to_string(), true);
        doc.get_or_insert_text("text").insert(&mut doc.transact_mut(), 0, words);
        self.projects.append(id, &doc.transact().encode_state_as_update_v1(&before)).unwrap();
        sync::wrote::mark(&self.projects.dir(id).unwrap());
    }

    fn has(&self, id: &str) -> bool {
        self.projects.info(id).is_ok()
    }

    /// The name a project has in the trash, where it is there.
    fn trashed(&self, id: &str) -> Option<String> {
        self.projects.trash().unwrap().into_iter().find(|(_, info)| info.id == id).map(|(entry, _)| entry)
    }

    fn in_trash(&self, id: &str) -> bool {
        self.trashed(id).is_some()
    }

    /// Puts a project that another device holds into this one's folder by
    /// hand, under its id, with all it holds and with what the other last
    /// saw of the server's document: as a computer of the home holds it,
    /// and as a phone has no way to come by it.
    fn put_project_of(&self, other: &Device, id: &str) {
        let from = other.projects.dir(id).unwrap();
        let state = whole::read(&from).unwrap().expect("the other holds the project");
        let name = other.projects.info(id).unwrap().name;
        self.projects.create_from(id, &name, &state).unwrap();
        let (joined, _) = Kept::new(&other.data).joined().unwrap().expect("the other is in a home");
        let seen = sync::kept::cursor(&from, &joined.home, &format!("project/{id}")).expect("the other exchanged it");
        let had = sync::kept::had(&from).unwrap_or_default();
        sync::kept::keep_cursor(&self.projects.dir(id).unwrap(), &seen, &had).unwrap();
    }

    // ---- the settings ----

    fn settings(&self) -> Map<String, Value> {
        glaukopis_core::settings::load(&self.data.settings_file()).unwrap()
    }

    fn set(&self, name: &str, value: Value) {
        let mut changed = Map::new();
        changed.insert(name.to_owned(), value);
        glaukopis_core::settings::merge(&self.data.settings_file(), &changed).unwrap();
    }

    /// A reference style of the writer's own, put into its folder.
    fn style(&self, name: &str, text: &str) {
        std::fs::create_dir_all(self.data.styles()).unwrap();
        std::fs::write(self.data.styles().join(name), text).unwrap();
    }

    /// The reference styles of the writer's own that this device holds, by their names.
    fn styles(&self) -> Vec<String> {
        names_in(&self.data.styles())
    }

    // ---- the notebook ----

    /// The notebook's document as its page would hold it.
    fn notebook_open(&self) -> Doc {
        let doc = Doc::new();
        if let Some(whole) = whole::read(self.notebook.dir()).unwrap() {
            doc.transact_mut().apply_update(Update::decode_v1(&whole).unwrap()).unwrap();
        }
        doc
    }

    /// Writes into the notebook, as its page would.
    fn note(&self, words: &str) {
        let doc = self.notebook_open();
        let before = doc.transact().state_vector();
        let notes = doc.get_or_insert_map("notes");
        notes.insert(&mut doc.transact_mut(), uuid(), words);
        self.notebook.append(&doc.transact().encode_state_as_update_v1(&before), now_ms()).unwrap();
    }

    /// Writes a note as a later version of the application does that puts
    /// something of the form `form` into it: the notebook says its form.
    fn note_in_form(&self, form: u32, words: &str) {
        let doc = self.notebook_open();
        let before = doc.transact().state_vector();
        doc.get_or_insert_map("form").insert(&mut doc.transact_mut(), form.to_string(), true);
        doc.get_or_insert_map("notes").insert(&mut doc.transact_mut(), uuid(), words);
        self.notebook.append(&doc.transact().encode_state_as_update_v1(&before), now_ms()).unwrap();
    }

    /// Takes a note away, as its page would: a deletion, and nothing added.
    fn take_note_away(&self, words: &str) {
        let doc = self.notebook_open();
        let notes = doc.get_or_insert_map("notes");
        let key = {
            let txn = doc.transact();
            let found =
                notes.iter(&txn).find_map(|(key, value)| (value.to_string(&txn) == words).then(|| key.to_owned()));
            found.expect("the note is there")
        };
        let before = doc.transact().state_vector();
        notes.remove(&mut doc.transact_mut(), &key);
        self.notebook.append(&doc.transact().encode_state_as_update_v1(&before), now_ms()).unwrap();
    }

    /// Saves the notebook whole, as its page does now and then: the state
    /// written anew and the log emptied, with nothing new in it.
    fn save_notebook(&self) {
        let whole = whole::read(self.notebook.dir()).unwrap().expect("there is a notebook");
        self.notebook.save_state(&whole, &Default::default()).unwrap();
    }

    fn notes(&self) -> Vec<String> {
        let doc = self.notebook_open();
        let notes = doc.get_or_insert_map("notes");
        let txn = doc.transact();
        let mut out: Vec<String> = notes.iter(&txn).map(|(_, value)| value.to_string(&txn)).collect();
        out.sort();
        out
    }

    // ---- the library ----

    fn lib(&self) -> MutexGuard<'_, Library> {
        self.library.lock().unwrap()
    }

    fn add(&self, source: &str) -> Entry {
        self.lib().add(&draft_from_source(source).unwrap()).unwrap()
    }

    /// A file on this device's disk, outside the library, to be taken in.
    fn file(&self, name: &str, bytes: &[u8]) -> PathBuf {
        let path = self.tmp.path().join(name);
        std::fs::write(&path, bytes).unwrap();
        path
    }

    /// Gives a reference a file, as the pane of a reference does. Its hash.
    fn attach(&self, id: &str, name: &str, bytes: &[u8]) -> String {
        let path = self.file(name, bytes);
        self.lib().attach(id, &path).unwrap();
        attachments::hash_bytes(bytes)
    }

    /// Takes a file into the library alone, of no reference. Its hash.
    fn take_in(&self, name: &str, bytes: &[u8]) -> String {
        let path = self.file(name, bytes);
        let dir = self.lib().dir().to_owned();
        let (taken, problems) = store_paths(&dir, &[path], false, &mut |_, _, _| {}, &Default::default());
        assert!(problems.is_empty(), "{problems:?}");
        self.lib().enter_taken(&taken, None).unwrap();
        attachments::hash_bytes(bytes)
    }

    /// Takes a picture as one pasted into a note is taken: a file the notes hold alone. Its hash.
    fn take_picture(&self, name: &str, bytes: &[u8]) -> String {
        self.lib().notebook_take_image(name, bytes).unwrap().hash
    }

    /// What the store here holds of a file, where it holds it.
    fn bytes(&self, hash: &str) -> Option<Vec<u8>> {
        let path = self.lib().stored_path(hash)?;
        Some(std::fs::read(path).unwrap())
    }

    /// The files the store here holds on its disk, by their hashes: each
    /// lies in a folder named by its hash.
    fn store(&self) -> Vec<String> {
        fn walk(dir: &Path, out: &mut Vec<String>) {
            let Ok(entries) = std::fs::read_dir(dir) else { return };
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    walk(&path, out);
                } else if let Some(hash) = path.parent().and_then(Path::file_name) {
                    out.push(hash.to_string_lossy().into_owned());
                }
            }
        }
        let mut out = Vec::new();
        walk(&self.lib().dir().join(attachments::DIR), &mut out);
        out.sort();
        out
    }

    /// The library as it reads alike on every device that holds the same:
    /// every reference with its fields in order of their names and its files
    /// by their hashes, every collection, every record but where its file
    /// lies on this disk, every folder of the files.
    fn library_as_said(&self) -> Vec<String> {
        let lib = self.lib();
        let mut out = Vec::new();
        for e in lib.entries() {
            let mut fields: Vec<(String, String)> = e.fields.iter().filter(|(n, _)| n != "file").cloned().collect();
            fields.sort();
            let files: Vec<String> =
                e.attachments().iter().filter_map(|p| attachments::hash_of_path(p).map(str::to_owned)).collect();
            out.push(format!(
                "reference {} {} {} {fields:?} {} {} {:?} {:?} {files:?}",
                e.id, e.key, e.entry_type, e.added, e.modified, e.merged, e.zotero
            ));
        }
        for c in &lib.collections.list {
            out.push(format!("collection {} {} {:?} {:?} {}", c.id, c.name, c.parent, c.entries, c.created));
        }
        for r in lib.files.files() {
            out.push(format!(
                "file {} {} {:?} {:?} {} {:?} {:?} {} {:?} {:?} {:?}",
                r.hash,
                r.name,
                r.folder,
                r.origin,
                r.added,
                r.width,
                r.height,
                r.alt,
                r.made_from,
                r.bookmarks,
                r.notebook
            ));
        }
        for f in lib.files.folders() {
            out.push(format!("folder {} {} {:?} {}", f.id, f.name, f.parent, f.order));
        }
        out.sort();
        out
    }

    // ---- the home, asked of the server and as it is kept here ----

    /// The home this device is in, as the engine reaches it, handed to `ask`.
    fn asked<T>(&self, ask: impl FnOnce(&Home) -> T) -> T {
        let (joined, token) = Kept::new(&self.data).joined().unwrap().expect("the device is in a home");
        let client = Client::new();
        let home = Home::new(&client, &joined.server, &joined.home, &token).unwrap();
        ask(&home)
    }

    /// The documents the home keeps, as the server lists them: each by its
    /// kind and id, with its digest.
    fn listed(&self) -> BTreeMap<String, String> {
        self.asked(|home| match home.list(None).unwrap() {
            Listing::Docs { docs, .. } => {
                docs.into_iter().map(|doc| (format!("{}/{}", doc.kind, doc.id), doc.digest)).collect()
            }
            Listing::Same => panic!("the home lists its documents"),
        })
    }

    /// The files the home holds, by their hashes.
    fn home_files(&self) -> Vec<String> {
        self.asked(|home| home.files().unwrap().0.into_iter().map(|f| f.hash).collect())
    }

    /// A document of maps as the server holds it, by its kind (`home`,
    /// `library`): all of it asked for, and nothing sent.
    fn maps_of_the_home(&self, kind: &str) -> HomeDoc {
        self.asked(|home| {
            let answer = home.exchange(kind, "the", None, None, &[], sync::FORM, true).unwrap();
            HomeDoc::load(Some(&answer.news)).unwrap()
        })
    }

    /// Says in a document of maps of the home (`home`, `library`) that it
    /// is of the form `form`, and sets one more name of one of its maps, as
    /// a later version of the application does that keeps it otherwise:
    /// written into the server's document by hand.
    fn raise_form_of_maps(&self, kind: &str, form: u32, map: &str, name: &str, value: &str) {
        let doc = self.maps_of_the_home(kind);
        let before = doc.vector();
        doc.put("meta", "form", Some(&form.to_string()));
        doc.put(map, name, Some(value));
        let change = doc.beyond(Some(&before)).unwrap();
        self.asked(|home| home.exchange(kind, "the", None, None, &[change.as_slice()], sync::FORM, false).unwrap());
    }

    /// That the synchronization has stopped on this device for a later
    /// form: asked as the thread asks, it says so in the owner's words, and
    /// that nothing waits. The device looks for its home where nothing
    /// answers while it is asked: one that asked the server anything would
    /// say that the server is not reached.
    fn is_stopped(&self) {
        let nowhere = {
            let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
            format!("http://{}", listener.local_addr().unwrap())
        };
        let server = self.looks_at(&nowhere);
        for hurried in [true, false] {
            self.sync.once(hurried);
            let status = self.sync.status();
            assert_eq!(status.state, State::Outdated, "{:?}", status.problem);
            assert_eq!(status.problem.as_deref(), Some("Update is needed for synchronization."));
            assert!(status.on && !status.waiting);
        }
        self.looks_at(&server);
        assert!(sync::notebook_refused(&self.data), "a device that is stopped sweeps no file out of its store");
    }

    /// The home document as this device keeps it.
    fn home_kept(&self) -> HomeDoc {
        HomeDoc::load(Kept::new(&self.data).doc("home").unwrap().as_deref()).unwrap()
    }

    /// Has the device look for its home at another address from its next
    /// round on, by what it keeps of the home, written by hand. The address
    /// it looked at before.
    fn looks_at(&self, server: &str) -> String {
        let path = self.data.sync().join("sync.json");
        let mut joined: Value = serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
        let before = joined["server"].as_str().expect("the device is in a home").to_owned();
        joined["server"] = json!(server);
        std::fs::write(&path, serde_json::to_string_pretty(&joined).unwrap()).unwrap();
        before
    }

    /// A round as the thread makes one, with what came of it said: the
    /// state the engine is in after it, and whether what was written here
    /// waits to be sent.
    fn once(&self) -> (State, bool) {
        self.sync.once(true);
        let status = self.sync.status();
        (status.state, status.waiting)
    }
}

/// The names of what lies in a folder, in their order; none where there is no such folder.
fn names_in(dir: &Path) -> Vec<String> {
    let Ok(entries) = std::fs::read_dir(dir) else { return Vec::new() };
    let mut out: Vec<String> = entries.flatten().map(|e| e.file_name().to_string_lossy().into_owned()).collect();
    out.sort();
    out
}

/// A name that no other has, of the letters an id may have.
fn uuid() -> String {
    static NEXT: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(1);
    format!("n-{}-{}", now_ms(), NEXT.fetch_add(1, std::sync::atomic::Ordering::Relaxed))
}

/// Runs `work` with a server that is taken down after it: its address, and
/// the folder it keeps its data in. What the engine asks waits for its
/// answers, so it is done on a thread for such work.
async fn with_server<T: Send + 'static>(work: impl FnOnce(String, PathBuf) -> T + Send + 'static) -> T {
    let tmp = tempfile::tempdir().unwrap();
    let kept = tmp.path().join("server");
    let server = Server::open(Config::new(&kept)).unwrap();
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = format!("http://{}", listener.local_addr().unwrap());
    let (stop, stopped) = oneshot::channel::<()>();
    let serving = tokio::spawn(serve(server, listener, async {
        let _ = stopped.await;
    }));
    let done = tokio::task::spawn_blocking(move || work(address, kept)).await.expect("the work was done");
    let _ = stop.send(());
    tokio::time::timeout(Duration::from_secs(10), serving).await.expect("the server stops").unwrap().unwrap();
    done
}

/// Rounds of each in turn, as many as it takes what one wrote to reach the
/// others and what they then say of it to come back.
fn settle(devices: &[&Device]) {
    for _ in 0..2 {
        for device in devices {
            device.round();
        }
    }
}

/// A device enters the home another is in, by a code made there.
fn join(device: &Device, home: &Device, address: &str, name: &str) {
    assert!(device.sync.join(address, &home.sync.code().unwrap().code, name).unwrap().on);
}

/// A computer and a phone of one writer: the computer makes the home, the
/// phone enters it by a code, and each has made its first round.
fn a_computer_and_a_phone(address: &str) -> (Device, Device) {
    let (computer, phone) = (Device::computer(), Device::phone());
    assert!(computer.sync.start(address, "The desk", None).unwrap().on);
    computer.round();
    join(&phone, &computer, address, "The phone");
    phone.round();
    (computer, phone)
}

/// What the computer of `desk` holds, by its ids and hashes.
struct Desk {
    project: String,
    folder: String,
    reference: String,
    /// The file the reference has.
    scan: String,
    /// The file of the library alone.
    letter: String,
}

const WORDS: &str = "Sing, goddess";
const STYLE: (&str, &str) = ("my-style.csl", "<style>mine</style>");
const SCAN: &[u8] = b"%PDF the scan of a book";
const LETTER: &[u8] = b"Dear Albert";

/// A computer that makes a home and holds something of every kind a home
/// keeps: a project in a folder, a favourite; a setting changed; a style of
/// its own; a reference with a file; a file of the library alone. It has
/// made its first round.
fn desk(address: &str) -> (Device, Desk) {
    let computer = Device::computer();
    assert!(computer.sync.start(address, "The desk", None).unwrap().on);
    let folder = computer.projects.folder_create("Drafts", None).unwrap().id;
    let project = computer.project("The Iliad", WORDS);
    computer.projects.move_to_folder(&project, Some(&folder)).unwrap();
    computer.projects.set_favourite(&project, true).unwrap();
    computer.set("theme", json!("dark"));
    computer.style(STYLE.0, STYLE.1);
    let nagy = computer.add("@book{nagy1979, author={Nagy, Gregory}, title={The Best of the Achaeans}, date={1979}}");
    let scan = computer.attach(&nagy.id, "scan.pdf", SCAN);
    let letter = computer.take_in("letter.txt", LETTER);
    computer.round();
    (computer, Desk { project, folder, reference: nagy.id, scan, letter })
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_phone_that_leaves_last_takes_the_home_and_what_it_never_held_off_the_server() {
    with_server(|address, kept| {
        let computer = Device::computer();
        assert!(computer.sync.start(&address, "The desk", None).unwrap().on);
        let iliad = computer.project("The Iliad", WORDS);
        let letter = computer.take_in("letter.txt", LETTER);
        computer.note("from the desk");
        computer.round();
        let phone = Device::phone();
        join(&phone, &computer, &address, "The phone");
        phone.note("from the street");
        settle(&[&phone, &computer]);
        let notes = vec!["from the desk".to_owned(), "from the street".to_owned()];
        assert_eq!(phone.notes(), notes);
        assert!(!phone.has(&iliad) && phone.bytes(&letter).is_none(), "the phone holds neither");

        // The computer leaves: the phone is the last.
        assert!(!computer.sync.stop().unwrap().on);
        let (joined, token) = Kept::new(&phone.data).joined().unwrap().unwrap();
        let on_the_server = kept.join("homes").join(&joined.home);
        for _ in 0..3 {
            phone.round();
            assert!(phone.listed().contains_key(&format!("project/{iliad}")), "the server lists the project still");
            assert!(phone.home_files().contains(&letter), "and holds the file");
        }
        assert!(on_the_server.join("files").join(&letter).is_file());
        let told = phone.sync.told().unwrap();
        assert_eq!(told.devices.len(), 1, "the phone is told that it is the last: {:?}", told.devices);
        assert!(told.devices[0].you);

        // The phone leaves, and the home goes with it: the project and the file it never held too.
        assert!(!phone.sync.stop().unwrap().on);
        let client = Client::new();
        let refused = Home::new(&client, &joined.server, &joined.home, &token).unwrap().told();
        assert!(refused.is_err(), "the server lets its token in no more: {refused:?}");
        assert!(!on_the_server.exists(), "the home's folder is gone from the server's disk");

        assert_eq!(computer.text(&iliad), WORDS, "the computer holds its project as it did");
        assert_eq!(computer.bytes(&letter).as_deref(), Some(LETTER), "and its file");
        assert_eq!(computer.notes(), notes);
        assert_eq!(phone.notes(), notes, "and the phone its notes");
    })
    .await;
}

/// What a later version of the application than this one knows: one more form of the texts.
fn later_texts() -> Knows {
    Knows { version: "later".into(), texts: sync::FORM + 1, ..Knows::default() }
}

/// That a round ended because it met a later form, and stopped the synchronization.
fn stops(device: &Device) {
    let error = device.sync.round().expect_err("the round ends where it meets the later form");
    assert!(matches!(error, Error::Refused { kind: "later", .. }), "{error}");
    device.is_stopped();
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_phone_older_than_the_form_of_the_notebook_stops_as_a_whole_and_goes_on_when_the_app_is_updated() {
    with_server(|address, _| {
        // The computer has a later version of the application than the phone.
        let (computer, phone) = (Device::later_computer(later_texts()), Device::phone());
        assert!(computer.sync.start(&address, "The desk", None).unwrap().on);
        computer.round();
        join(&phone, &computer, &address, "The phone");
        phone.round();
        computer.note("from the desk");
        phone.note("from the street");
        settle(&[&computer, &phone]);
        let mut held = vec!["from the desk".to_owned(), "from the street".to_owned()];
        assert_eq!(phone.notes(), held);

        // The later version puts something of its form into a note, and a reference is added there.
        computer.note_in_form(sync::FORM + 1, "of a later form");
        let nagy = computer.add("@book{nagy1979, title={The Best of the Achaeans}}");
        computer.round();
        let listed = computer.listed();

        // On the phone meanwhile: a note, a picture, a reference.
        phone.note("written while the app was old");
        let photograph = phone.take_picture("photograph", &PNG);
        let lord = phone.add("@book{lord1960, title={The Singer of Tales}}");
        stops(&phone);
        for _ in 0..2 {
            assert!(phone.sync.round().is_err(), "and every round after it ends as it began");
        }
        // Nothing of the phone's was sent, of the notebook or of anything else.
        assert_eq!(phone.listed(), listed, "the documents of the home are as the computer left them");
        assert!(!phone.home_files().contains(&photograph), "the picture was not sent");
        // And nothing was fetched: not the later note, and not the reference, though it is in no form of the texts.
        held.push("written while the app was old".to_owned());
        held.sort();
        assert_eq!(phone.notes(), held);
        assert!(phone.lib().get(&nagy.id).is_none(), "the round did not go on to the library");
        // What the phone holds is as it was written.
        assert_eq!(phone.bytes(&photograph).as_deref(), Some(&PNG[..]));
        assert!(phone.lib().get(&lord.id).is_some());

        // Started again by the same version, it is stopped from its start.
        let phone = phone.started_again(Knows::default());
        assert_eq!(phone.sync.status().state, State::Outdated, "before any round is made");
        phone.is_stopped();
        assert_eq!(phone.listed(), listed);

        // The app is updated: it goes on, and what was written meanwhile is brought along.
        let phone = phone.started_again(later_texts());
        assert_eq!(phone.sync.status().state, State::Idle);
        settle(&[&phone, &computer]);
        held.push("of a later form".to_owned());
        held.sort();
        assert_eq!(phone.notes(), held, "the phone holds the later note");
        assert_eq!(computer.notes(), held, "and the computer what was written on the phone");
        assert!(phone.lib().get(&nagy.id).is_some() && computer.lib().get(&lord.id).is_some());
        assert_eq!(computer.bytes(&photograph).as_deref(), Some(&PNG[..]));
        assert!(!sync::notebook_refused(&phone.data), "its notebook was taken again");
        assert_eq!(phone.sync.status().problem, None);
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_computer_that_meets_a_project_in_a_later_form_stops_as_a_whole_and_goes_on_when_it_is_updated() {
    with_server(|address, _| {
        let (desk, laptop) = (Device::later_computer(later_texts()), Device::computer());
        assert!(desk.sync.start(&address, "The desk", None).unwrap().on);
        desk.round();
        join(&laptop, &desk, &address, "The laptop");
        laptop.round();
        let iliad = desk.project("The Iliad", WORDS);
        let odyssey = laptop.project("The Odyssey", "Tell me, Muse");
        settle(&[&desk, &laptop]);
        assert!(laptop.has(&iliad) && desk.has(&odyssey));

        // The later version puts something of its form into a text of the first project.
        desk.write_in_form(&iliad, sync::FORM + 1, "Of a later form. ");
        desk.round();

        // On the laptop meanwhile: words in both projects, a note, a reference with a file, a setting.
        laptop.write(&iliad, 0, "Written on the old laptop. ");
        laptop.write(&odyssey, 0, "And here. ");
        laptop.note("from the laptop");
        let work = laptop.add("@book{w, title={A Work}}");
        let scan = laptop.attach(&work.id, "scan.pdf", SCAN);
        laptop.set("theme", json!("dark"));
        stops(&laptop);

        // What the round exchanged before it met the later form stands: the
        // home document comes before the projects. What comes after them
        // was not sent, and nothing went into the project of the later form.
        desk.round();
        assert_eq!(desk.settings().get("theme"), Some(&json!("dark")), "exchanged before the later form was met");
        assert!(desk.notes().is_empty(), "the note was not sent");
        assert!(desk.lib().get(&work.id).is_none() && !desk.home_files().contains(&scan), "nor the library");
        assert!(!desk.text(&iliad).contains("old laptop"), "nothing was written into the project of a later form");
        assert!(!laptop.text(&iliad).contains("later form"), "and nothing of it was taken");
        // What the laptop holds is as it was written, and goes on being written.
        assert!(laptop.text(&iliad).starts_with("Written on the old laptop. "));
        assert_eq!(laptop.bytes(&scan).as_deref(), Some(SCAN));
        laptop.note("and one more");
        let listed = desk.listed();
        laptop.is_stopped();
        for _ in 0..2 {
            assert!(laptop.sync.round().is_err());
        }
        assert_eq!(laptop.listed(), listed, "nothing more is sent");

        // The application is updated on the laptop: it goes on with everything.
        let laptop = laptop.started_again(later_texts());
        settle(&[&laptop, &desk]);
        assert_eq!(laptop.text(&iliad), desk.text(&iliad));
        assert!(desk.text(&iliad).contains("Written on the old laptop. ") && desk.text(&iliad).contains("later form"));
        assert!(desk.text(&odyssey).starts_with("And here. "));
        assert_eq!(desk.notes(), vec!["and one more".to_owned(), "from the laptop".to_owned()]);
        assert_eq!(desk.bytes(&scan).as_deref(), Some(SCAN));
        assert_eq!(desk.library_as_said(), laptop.library_as_said());
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_computer_that_meets_the_librarys_document_in_a_later_form_stops_and_keeps_nothing_of_it() {
    with_server(|address, _| {
        let (desk, laptop) = (Device::computer(), Device::computer());
        assert!(desk.sync.start(&address, "The desk", None).unwrap().on);
        desk.round();
        join(&laptop, &desk, &address, "The laptop");
        laptop.round();
        let nagy = desk.add("@book{nagy1979, title={The Best of the Achaeans}}");
        settle(&[&desk, &laptop]);
        assert!(laptop.lib().get(&nagy.id).is_some());

        // The application is updated on the desk to a version that keeps
        // the library's document otherwise: the document says its form,
        // and something this version does not know is written in it.
        let later = Knows { version: "later".into(), library: LIBRARY_FORM + 1, ..Knows::default() };
        let desk = desk.started_again(later.clone());
        desk.raise_form_of_maps("library", LIBRARY_FORM + 1, "later", "thing", "of a later form");
        let singer = desk.add("@book{lord1960, title={The Singer of Tales}}");
        desk.round();
        let listed = desk.listed();

        // The laptop, with a reference added meanwhile.
        let parry = laptop.add("@book{parry1971, title={The Making of Homeric Verse}}");
        stops(&laptop);
        assert_eq!(laptop.listed(), listed, "nothing of the laptop's was sent into the later document");
        // Nothing of the later document is kept here, or written to the library.
        let kept = HomeDoc::load(Kept::new(&laptop.data).doc("library").unwrap().as_deref()).unwrap();
        assert_eq!((kept.form(), kept.get("later", "thing")), (LIBRARY_FORM, None));
        assert!(laptop.lib().get(&singer.id).is_none(), "what it says is not written to the library here");
        assert!(laptop.lib().get(&parry.id).is_some() && laptop.lib().get(&nagy.id).is_some(), "which is as it was");

        // Updated, it goes on.
        let laptop = laptop.started_again(later);
        settle(&[&laptop, &desk]);
        assert!(desk.lib().get(&parry.id).is_some() && laptop.lib().get(&singer.id).is_some());
        assert_eq!(desk.library_as_said(), laptop.library_as_said());
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_home_document_in_a_later_form_stops_a_phone_and_a_computer_alike() {
    with_server(|address, _| {
        let (desk, laptop, phone) = (Device::computer(), Device::computer(), Device::phone());
        assert!(desk.sync.start(&address, "The desk", None).unwrap().on);
        desk.round();
        join(&laptop, &desk, &address, "The laptop");
        join(&phone, &desk, &address, "The phone");
        desk.note("from the desk");
        settle(&[&desk, &laptop, &phone]);

        // The application is updated on the desk to a version that keeps
        // the home document otherwise, and a setting is changed there.
        let later = Knows { version: "later".into(), home: HOME_FORM + 1, ..Knows::default() };
        let desk = desk.started_again(later.clone());
        desk.raise_form_of_maps("home", HOME_FORM + 1, "settings", "theme", "\"dark\"");
        desk.round();
        let listed = desk.listed();

        laptop.note("from the laptop");
        phone.note("from the street");
        for device in [&laptop, &phone] {
            stops(device);
            assert_eq!(device.home_kept().form(), HOME_FORM, "nothing of the later document is kept");
            assert_eq!(device.listed(), listed, "and nothing was sent");
        }
        assert_eq!(laptop.settings().get("theme"), None, "what the later document says is not written here");
        // The notes are exchanged no more, on the phone either, which writes nothing into the home document.
        assert_eq!(phone.notes(), vec!["from the desk".to_owned(), "from the street".to_owned()]);
        assert_eq!(laptop.notes(), vec!["from the desk".to_owned(), "from the laptop".to_owned()]);

        // Updated, both go on.
        let (laptop, phone) = (laptop.started_again(later.clone()), phone.started_again(later));
        settle(&[&laptop, &phone, &desk]);
        let all = vec!["from the desk".to_owned(), "from the laptop".to_owned(), "from the street".to_owned()];
        for device in [&desk, &laptop, &phone] {
            assert_eq!(device.notes(), all);
        }
        assert_eq!(laptop.settings().get("theme"), Some(&json!("dark")));
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_device_that_is_stopped_for_a_later_form_can_still_leave_its_home() {
    with_server(|address, _| {
        let (computer, phone) = (Device::later_computer(later_texts()), Device::phone());
        assert!(computer.sync.start(&address, "The desk", None).unwrap().on);
        computer.round();
        join(&phone, &computer, &address, "The phone");
        phone.note("from the street");
        settle(&[&phone, &computer]);
        computer.note_in_form(sync::FORM + 1, "of a later form");
        computer.round();
        phone.note("written while the app was old");
        stops(&phone);
        let held = vec!["from the street".to_owned(), "written while the app was old".to_owned()];

        // The devices of the home are told as ever, and it leaves as ever.
        assert_eq!(phone.sync.told().unwrap().devices.len(), 2);
        assert!(!phone.sync.stop().unwrap().on);
        assert_eq!(phone.sync.status().state, State::Off);
        assert!(!phone.data.sync().exists(), "what it kept of the home is gone, and of the stop with it");
        assert_eq!(computer.sync.told().unwrap().devices.len(), 1, "the server was told");
        assert_eq!(phone.notes(), held, "what it holds stays");

        // Joined again with the same version, it meets the later form again, and stops again.
        join(&phone, &computer, &address, "The phone");
        assert_eq!(phone.sync.status().state, State::Idle);
        stops(&phone);
        assert_eq!(phone.notes(), held);
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_computer_never_learns_of_deletion_from_what_a_phone_lacks() {
    with_server(|address, _| {
        let (first, desk) = desk(&address);
        let phone = Device::phone();
        join(&phone, &first, &address, "The phone");
        settle(&[&first, &phone]);
        settle(&[&first, &phone]);
        let second = Device::computer();
        join(&second, &first, &address, "The laptop");
        settle(&[&first, &phone, &second]);

        for computer in [&first, &second] {
            assert!(computer.has(&desk.project), "the project is on both computers");
            assert!(!computer.in_trash(&desk.project), "and not in the trash");
            assert_eq!(computer.text(&desk.project), WORDS);
            assert_eq!(computer.projects.info(&desk.project).unwrap().folder.as_deref(), Some(desk.folder.as_str()));
            let folders = computer.projects.folders().unwrap();
            assert_eq!(folders.iter().map(|f| f.name.as_str()).collect::<Vec<_>>(), ["Drafts"], "the folder");
            assert_eq!(computer.projects.favourites().unwrap(), vec![desk.project.clone()]);
            assert_eq!(computer.settings()["theme"], json!("dark"), "the setting");
            assert_eq!(std::fs::read_to_string(computer.data.styles().join(STYLE.0)).unwrap(), STYLE.1, "the style");
            assert_eq!(computer.bytes(&desk.scan).as_deref(), Some(SCAN), "the file of the reference, byte for byte");
            assert_eq!(computer.bytes(&desk.letter).as_deref(), Some(LETTER), "and the file of the library alone");
            let lib = computer.lib();
            let named = lib.get(&desk.reference).expect("the reference").attachments();
            let files: Vec<&str> = named.iter().filter_map(|p| attachments::hash_of_path(p)).collect();
            assert_eq!(files, [desk.scan.as_str()], "which the reference names");
        }
        assert_eq!(first.library_as_said(), second.library_as_said());

        assert!(first.listed().contains_key(&format!("project/{}", desk.project)), "the server lists the project");
        let files = first.home_files();
        assert!(files.contains(&desk.scan) && files.contains(&desk.letter), "and holds both files");
        assert!(first.home_kept().map("gone").is_empty(), "nothing was said to be gone");
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_phone_holds_the_notes_and_the_references_and_no_project_and_no_file_of_the_library() {
    with_server(|address, _| {
        let (computer, desk) = desk(&address);
        computer.note("from the desk");
        let pasted = computer.take_picture("pasted", &PNG);
        // Another picture, an image of the project: a file of the library, which no note holds.
        let vase = computer.lib().add_image("vase.svg", SVG.as_bytes(), None, None).unwrap().0.hash;
        computer.projects.update_info(&desk.project, |info| info.pictures = vec![vase.clone()]).unwrap();
        let phone = Device::phone();
        join(&phone, &computer, &address, "The phone");
        settle(&[&computer, &phone]);

        assert_eq!(phone.notes(), vec!["from the desk".to_owned()], "the same notes");
        assert_eq!(phone.notes(), computer.notes());
        assert_eq!(phone.bytes(&pasted).as_deref(), Some(&PNG[..]), "the picture a note holds, byte for byte");
        assert_eq!(phone.library_as_said(), computer.library_as_said(), "the library as the computer says it");
        {
            let lib = phone.lib();
            assert!(lib.get(&desk.reference).is_some(), "the reference");
            for hash in [&desk.scan, &desk.letter, &vase, &pasted] {
                assert!(lib.files.get(hash).is_some(), "the record of every file");
            }
        }
        assert_eq!(phone.store(), vec![pasted.clone()], "no file of the store but the picture");
        assert_eq!(computer.store().len(), 4, "of the four the computer holds");

        assert!(phone.projects.list().unwrap().is_empty(), "no project");
        assert!(phone.projects.trash().unwrap().is_empty(), "and none in the trash");
        assert!(phone.projects.folders().unwrap().is_empty(), "nor a folder for one");
        assert_eq!(phone.settings().get("theme"), None, "the computer's setting is not the phone's");
        assert!(phone.styles().is_empty(), "no style");

        let sync = phone.data.sync();
        assert_eq!(
            names_in(&sync.join("base")),
            ["collections.json", "file-folders.json", "files.json", "references.json"],
            "the stores of the library met their maps, and no other store did"
        );
        let joined = std::fs::read_to_string(sync.join("sync.json")).unwrap();
        assert!(joined.contains("\"takes\": \"notes\""), "{joined}");
        assert!(!sync.join("home.unsent").exists(), "the phone has nothing of the home document to send");
        assert!(
            phone.home_kept().get("facts", &desk.project).is_some(),
            "the home document is kept as it came, with what the list shows of the project"
        );
        assert_eq!(
            names_in(&sync.join("home")),
            ["sync.had", "sync.json"],
            "and with it what was last seen of the server's, as with every document"
        );
        // And the computer says of itself what it is.
        let joined = std::fs::read_to_string(computer.data.sync().join("sync.json")).unwrap();
        assert!(joined.contains("\"takes\": \"everything\""), "{joined}");
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_note_written_on_a_phone_and_a_picture_taken_there_are_on_the_computer() {
    with_server(|address, _| {
        let (computer, phone) = a_computer_and_a_phone(&address);
        phone.note("from the street");
        let photograph = phone.take_picture("photograph", &PNG);
        phone.round();
        computer.round();
        assert_eq!(computer.notes(), vec!["from the street".to_owned()], "the note");
        assert_eq!(computer.bytes(&photograph).as_deref(), Some(&PNG[..]), "the picture, byte for byte");
        assert_eq!(
            computer.lib().files.get(&photograph).expect("its record").notebook,
            Some(Held::Only),
            "which says that the notes hold it alone"
        );
        assert!(computer.home_files().contains(&photograph), "the server holds the picture");
        settle(&[&phone, &computer]);
        assert_eq!(computer.library_as_said(), phone.library_as_said());
        assert_eq!(phone.bytes(&photograph).as_deref(), Some(&PNG[..]), "and the phone holds it still");
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_phone_fetches_a_file_once_a_note_holds_it_and_takes_none_off_the_server() {
    with_server(|address, _| {
        let (computer, phone) = a_computer_and_a_phone(&address);
        let letter = computer.take_in("letter.txt", LETTER);
        settle(&[&computer, &phone]);
        assert!(phone.lib().files.get(&letter).is_some(), "the record of a file of the library is on the phone");
        assert!(phone.bytes(&letter).is_none(), "the file is not");
        assert!(phone.store().is_empty());

        // A note comes to hold it, on the computer.
        computer.lib().notebook_hold(std::slice::from_ref(&letter)).unwrap();
        settle(&[&computer, &phone]);
        assert_eq!(phone.bytes(&letter).as_deref(), Some(LETTER), "held by a note, it is fetched");

        // A picture taken on the phone, which both hold and the server too.
        let photograph = phone.take_picture("photograph", &PNG);
        settle(&[&phone, &computer]);
        assert_eq!(computer.bytes(&photograph).as_deref(), Some(&PNG[..]));
        assert!(computer.home_files().contains(&photograph));

        // It is swept out on the phone, as when its note is gone.
        assert_eq!(phone.lib().notebook_sweep(&HashSet::new()).unwrap(), 1);
        assert!(phone.bytes(&photograph).is_none() && phone.lib().files.get(&photograph).is_none());
        for _ in 0..2 {
            phone.round();
            let said = phone.maps_of_the_home("library");
            assert_eq!(said.get("files", &format!("{photograph}/added")), None, "its record is out of the document");
            assert!(said.get("stored", &photograph).is_some(), "which says still that the home holds the file");
            assert!(phone.home_files().contains(&photograph), "and the server holds it: a phone takes none off");
        }
        assert_eq!(phone.bytes(&letter).as_deref(), Some(LETTER), "a file that was the notes' stays on the phone");

        // A computer of the home takes it off.
        computer.round();
        assert!(!computer.home_files().contains(&photograph), "after the computer's round the server holds it not");
        assert!(computer.home_files().contains(&letter));
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn nothing_of_a_phones_own_projects_settings_or_styles_reaches_the_home() {
    with_server(|address, _| {
        let computer = Device::computer();
        assert!(computer.sync.start(&address, "The desk", None).unwrap().on);
        computer.set("theme", json!("dark"));
        computer.round();
        let phone = Device::phone();
        join(&phone, &computer, &address, "The phone");
        settle(&[&phone, &computer]);
        let before = computer.listed();
        assert!(before.contains_key("home/the"));

        // Put into the phone's folder by hand: what a phone has no way to make.
        let own = phone.project("Made on a phone", "never sent");
        phone.set("theme", json!("sepia"));
        phone.style("a-phones.csl", "<style>a phone's</style>");
        for _ in 0..3 {
            phone.round();
        }
        let after = computer.listed();
        assert!(!after.contains_key(&format!("project/{own}")), "the server lists no such project");
        assert_eq!(after["home/the"], before["home/the"], "and the home document is what it was");
        assert_eq!(after, before, "as is all the home keeps");
        assert!(!phone.data.sync().join("home.unsent").exists());
        assert!(!phone.data.sync().join("base").exists(), "no store of the phone met a map");

        // The computer learns nothing of them, and the phone keeps them as they are.
        computer.round();
        assert!(!computer.has(&own));
        assert_eq!(computer.settings()["theme"], json!("dark"));
        assert!(computer.styles().is_empty());
        assert_eq!(computer.listed(), before);
        phone.round();
        assert_eq!(phone.text(&own), "never sent");
        assert_eq!(phone.settings()["theme"], json!("sepia"));
        assert_eq!(phone.styles(), ["a-phones.csl"]);
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_phone_may_start_the_home_and_a_computer_that_joins_brings_everything() {
    with_server(|address, _| {
        let phone = Device::phone();
        phone.note("from the street");
        let photograph = phone.take_picture("photograph", &PNG);
        assert!(phone.sync.start(&address, "The phone", None).unwrap().on);
        for _ in 0..2 {
            phone.round();
        }
        let listed: Vec<String> = phone.listed().into_keys().collect();
        assert_eq!(listed, ["library/the", "notebook/the"], "the server has no home document: a phone makes none");
        assert!(phone.home_files().contains(&photograph));

        let computer = Device::computer();
        let iliad = computer.project("The Iliad", WORDS);
        let nagy = computer.add("@book{nagy1979, title={The Best of the Achaeans}}");
        computer.set("theme", json!("dark"));
        join(&computer, &phone, &address, "The desk");
        settle(&[&computer, &phone]);

        let listed = phone.listed();
        assert!(listed.contains_key("home/the"), "the home document is there, made by the computer");
        assert!(listed.contains_key(&format!("project/{iliad}")), "with the computer's project");
        assert_eq!(computer.notes(), vec!["from the street".to_owned()], "the computer holds the note");
        assert_eq!(computer.bytes(&photograph).as_deref(), Some(&PNG[..]), "and the picture");
        assert!(phone.lib().get(&nagy.id).is_some(), "the phone holds the reference");
        assert!(phone.projects.list().unwrap().is_empty(), "and no project");
        assert_eq!(phone.settings().get("theme"), None);
        let kept = phone.home_kept();
        assert_eq!(kept.get("meta", "form").as_deref(), Some("1"), "the form of the home document is the computer's");
        assert!(kept.get("facts", &iliad).is_some(), "and the phone keeps it as it came");
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_device_does_no_more_than_its_role_and_what_it_joined_as_both_allow() {
    with_server(|address, _| {
        let (computer, phone) = a_computer_and_a_phone(&address);

        // A folder that joined as a phone, given an engine that says it is a computer.
        let phone = phone.given(Takes::Everything);
        let own = phone.project("Made on a phone", "never sent");
        phone.set("theme", json!("sepia"));
        let before = computer.listed();
        for _ in 0..2 {
            phone.round();
        }
        assert!(!phone.listed().contains_key(&format!("project/{own}")), "the project is not sent");
        assert_eq!(phone.listed(), before, "nor anything else");
        computer.round();
        assert!(!computer.has(&own));
        assert_eq!(computer.settings().get("theme"), None);

        // A folder that joined as a computer, given an engine that says it is a phone.
        let laptop = Device::computer();
        let iliad = laptop.project("The Iliad", WORDS);
        join(&laptop, &computer, &address, "The laptop");
        settle(&[&laptop, &computer]);
        assert_eq!(computer.text(&iliad), WORDS, "as a computer it sent its project");
        // It holds something of the home document that the server was not
        // sent, as a computer does whose round ended between the writing and
        // the sending.
        let unsent = laptop.home_kept();
        assert!(unsent.put("settings", "theme", Some("\"sepia\"")));
        let kept = Kept::new(&laptop.data);
        kept.keep_doc("home", &unsent.whole()).unwrap();
        kept.mark_unsent("home", true).unwrap();
        // And the home document is another on the server meanwhile, so that the device has something to read.
        computer.set("language", json!("nb"));
        computer.round();
        let before = computer.listed();

        let laptop = laptop.given(Takes::Notes);
        laptop.write(&iliad, 13, ", the wrath");
        laptop.set("enterBreaks", json!("line"));
        let other = laptop.project("Another", "never sent");
        for _ in 0..2 {
            laptop.round();
        }
        let after = computer.listed();
        let project = format!("project/{iliad}");
        assert_eq!(after[&project], before[&project], "what is written into its project after is not sent");
        assert_eq!(after["home/the"], before["home/the"], "and the home document is not written into");
        assert!(!after.contains_key(&format!("project/{other}")));
        assert_eq!(after, before);
        let read = laptop.home_kept();
        assert_eq!(read.get("settings", "language").as_deref(), Some("\"nb\""), "it read what the home says");
        assert_eq!(read.get("settings", "theme").as_deref(), Some("\"sepia\""), "and keeps what it held unsent");
        assert!(laptop.data.sync().join("home.unsent").exists(), "marked as unsent still");
        assert_eq!(laptop.settings().get("language"), None, "nothing of it is written to the device");
        computer.round();
        assert_eq!(computer.text(&iliad), WORDS);
        assert_eq!(computer.settings().get("theme"), None);
        assert_eq!(computer.settings().get("enterBreaks"), None);
        assert_eq!(laptop.text(&iliad), "Sing, goddess, the wrath", "the device holds what was written on it");
        assert!(laptop.has(&other));
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_phone_takes_no_document_off_the_server_and_says_no_project_gone_whatever_its_trash_holds() {
    with_server(|address, _| {
        let (computer, phone) = a_computer_and_a_phone(&address);
        let in_the_trash = computer.project("Left in the trash", WORDS);
        let brought_back = computer.project("Brought back from the trash", WORDS);
        let removed = computer.project("Removed from the trash", WORDS);
        let all = [&in_the_trash, &brought_back, &removed];
        settle(&[&computer, &phone]);
        assert!(phone.projects.list().unwrap().is_empty(), "a phone fetches none of them");

        // Put into the phone's folder by hand: the computer's projects, each
        // as a computer of the home holds it.
        for id in all {
            phone.put_project_of(&computer, id);
        }
        let before = phone.listed();
        // Then, by the core's own calls, one goes to the trash and stays;
        // one goes there and is brought back; and one goes there and, after
        // a round or two, is removed from it for good. On a computer the
        // first is then said to be gone, and the last is taken off the server.
        phone.projects.delete(&in_the_trash).unwrap();
        phone.projects.delete(&brought_back).unwrap();
        let back = phone.projects.restore(&phone.trashed(&brought_back).expect("it is in the trash")).unwrap();
        assert_eq!(back.id, brought_back, "under its own id");
        phone.projects.delete(&removed).unwrap();
        for _ in 0..2 {
            phone.round();
        }
        phone.projects.purge(&phone.trashed(&removed).expect("it is in the trash")).unwrap();
        for _ in 0..3 {
            phone.round();
        }

        let listed = phone.listed();
        for id in all {
            assert!(listed.contains_key(&format!("project/{id}")), "the server lists every project the computer made");
        }
        assert_eq!(listed, before, "each as it was, and the home document as it was");
        assert!(phone.maps_of_the_home("home").map("gone").is_empty(), "no project is said to be gone");
        let base = phone.data.sync().join("base");
        assert!(
            !base.join("gone.json").exists() && !base.join("trash.json").exists(),
            "the phone keeps nothing of what is gone or of what it saw in its trash"
        );

        // The computer holds them all as it did, and on the phone they lie where they were left.
        for _ in 0..2 {
            computer.round();
        }
        for id in all {
            assert!(computer.has(id) && !computer.in_trash(id), "none went to the computer's trash");
            assert_eq!(computer.text(id), WORDS);
        }
        assert!(computer.home_kept().map("gone").is_empty());
        assert_eq!(computer.listed(), before);
        assert!(phone.in_trash(&in_the_trash) && phone.has(&brought_back));
        assert!(!phone.has(&removed) && !phone.in_trash(&removed));
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_phone_sends_nothing_of_the_home_document_where_the_server_holds_less_of_it_than_it_did() {
    with_server(|address, _| {
        let (computer, phone) = a_computer_and_a_phone(&address);
        computer.set("theme", json!("dark"));
        settle(&[&computer, &phone]);
        let dark = Some("\"dark\"".to_owned());
        assert_eq!(phone.home_kept().get("settings", "theme"), dark, "the phone has read the home document");
        let unsent = phone.data.sync().join("home.unsent");
        let marked = unsent.exists();

        // The server loses the home document and holds another in its place,
        // written by one the phone never saw: less than the phone last saw of
        // it. A computer that meets such a server sends all of its own again.
        let lesser = HomeDoc::new();
        assert!(lesser.put("settings", "language", Some("\"nb\"")));
        let all = lesser.whole();
        computer.asked(|home| {
            home.delete("home", "the").unwrap();
            home.exchange("home", "the", None, None, &[all.as_slice()], sync::FORM, true).unwrap();
        });
        let digest = phone.listed()["home/the"].clone();

        for _ in 0..2 {
            phone.round();
            assert_eq!(phone.listed()["home/the"], digest, "the phone sent nothing, at the second asking either");
            assert_eq!(unsent.exists(), marked, "and the mark of something unsent is as it was");
        }
        assert!(!marked, "a phone has nothing of the home document to send");
        let on_the_server = phone.maps_of_the_home("home");
        assert_eq!(on_the_server.get("settings", "theme"), None, "what the phone holds of it was not sent again");
        assert_eq!(on_the_server.map("settings").len(), 1);
        let kept = phone.home_kept();
        assert_eq!(kept.get("settings", "language").as_deref(), Some("\"nb\""), "it took in what the server holds");
        assert_eq!(kept.get("settings", "theme"), dark, "beside what it had read before");
    })
    .await;
}

// What the notes hold, kept (stage 2 of the plan): four more.

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_file_a_phones_note_holds_is_kept_when_a_computer_sweeps_it_with_less_of_the_notebook() {
    with_server(|address, _| {
        let (computer, phone) = a_computer_and_a_phone(&address);
        // A picture taken on the phone into a note, and the phone says what its notes hold.
        let photograph = phone.take_picture("photograph", &PNG);
        phone.note("with a photograph");
        phone.notebook.say_held(std::slice::from_ref(&photograph)).unwrap();
        settle(&[&phone, &computer]);
        assert_eq!(computer.bytes(&photograph).as_deref(), Some(&PNG[..]), "the computer holds the picture");
        assert!(computer.home_files().contains(&photograph), "and the server");

        // The computer sweeps with nothing held, as one that read less of the notebook than there is.
        assert_eq!(computer.lib().notebook_sweep(&HashSet::new()).unwrap(), 1);
        assert!(computer.bytes(&photograph).is_none() && computer.lib().files.get(&photograph).is_none());
        computer.round();
        // The round in which the phone keeps the picture asks for another
        // at once, which is the one that tells it again: the phone's app
        // may not be in front, where nothing is asked at regular times.
        let phone = phone.given(Takes::Notes);
        assert!(!phone.sync.asked(), "an engine just made has asked for no round");
        phone.round();
        assert!(phone.sync.asked(), "a round is asked for at once, to tell again what was kept");
        for _ in 0..2 {
            settle(&[&computer, &phone]);
        }
        // A round in which nothing is kept asks for none.
        let phone = phone.given(Takes::Notes);
        phone.round();
        assert!(!phone.sync.asked());

        assert_eq!(phone.bytes(&photograph).as_deref(), Some(&PNG[..]), "the phone holds the picture");
        assert_eq!(phone.lib().files.get(&photograph).expect("and its record").notebook, Some(Held::Only));
        assert_eq!(
            computer.bytes(&photograph).as_deref(),
            Some(&PNG[..]),
            "the computer holds it again, byte for byte"
        );
        assert!(phone.home_files().contains(&photograph), "and the server holds it");
        assert_eq!(computer.library_as_said(), phone.library_as_said());

        // A file of the library that a note has come to hold as well. The
        // computer sweeps once more, with the picture held and that file
        // not: the mark goes off its record there, and nothing else. On the
        // phone, whose notes hold the file, the mark stays, and it is told
        // again though nothing was written to the phone's library by it.
        let letter = computer.take_in("letter.txt", LETTER);
        computer.lib().notebook_hold(std::slice::from_ref(&letter)).unwrap();
        phone.notebook.say_held(&[photograph.clone(), letter.clone()]).unwrap();
        settle(&[&computer, &phone]);
        assert_eq!(phone.bytes(&letter).as_deref(), Some(LETTER), "held by a note, the file is on the phone");
        let held: HashSet<&str> = [photograph.as_str()].into();
        assert_eq!(computer.lib().notebook_sweep(&held).unwrap(), 0);
        assert_eq!(computer.lib().files.get(&letter).expect("its record").notebook, None);
        for _ in 0..2 {
            settle(&[&computer, &phone]);
        }
        for device in [&phone, &computer] {
            let mark = device.lib().files.get(&letter).expect("its record").notebook;
            assert_eq!(mark, Some(Held::Also), "the mark is as it was on the phone, and on the computer again");
        }
        assert_eq!(computer.library_as_said(), phone.library_as_said());
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_device_whose_notebook_is_not_taken_says_so_and_says_it_no_more_when_it_is() {
    with_server(|address, _| {
        let (computer, phone) = a_computer_and_a_phone(&address);
        computer.note("from the desk");
        phone.note("from the street");
        settle(&[&computer, &phone]);
        // The phone's notebook saved whole, as its page saves it: a state on the disk.
        let whole = whole::read(phone.notebook.dir()).unwrap().expect("the phone holds a notebook");
        phone.notebook.save_state(&whole, &Default::default()).unwrap();
        settle(&[&computer, &phone]);
        let kept = phone.data.sync().join("notebook-refused.json");
        assert!(!sync::notebook_refused(&phone.data), "the notebook was taken at every round");
        assert!(!kept.exists(), "and nothing is written of it while it is as it was");

        // The state is made bytes that are no document, and a note's change is written after it.
        let state = phone.notebook.dir().join("state.bin");
        let as_it_was = std::fs::read(&state).unwrap();
        let doc = phone.notebook_open();
        std::fs::write(&state, b"\xff\xff no document").unwrap();
        let before = doc.transact().state_vector();
        doc.get_or_insert_map("notes").insert(&mut doc.transact_mut(), uuid(), "written beside what cannot be read");
        phone.notebook.append(&doc.transact().encode_state_as_update_v1(&before), now_ms()).unwrap();
        for _ in 0..2 {
            let problems = phone.sync.round().expect("the round gives no error");
            assert_eq!(problems.len(), 1, "one problem, of the notebook: {problems:?}");
            assert!(sync::notebook_refused(&phone.data), "the notebook was not taken, and the phone says so");
        }
        assert_eq!(std::fs::read_to_string(&kept).unwrap().trim(), "true");

        // A round that ends for the server's sake, before the notebook is
        // come to, leaves it as it is kept: the state is readable again, but
        // the notebook was not taken.
        std::fs::write(&state, &as_it_was).unwrap();
        let nowhere = {
            let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
            format!("http://{}", listener.local_addr().unwrap())
        };
        let server = phone.looks_at(&nowhere);
        assert!(phone.sync.round().is_err(), "the server is not reached");
        assert!(sync::notebook_refused(&phone.data), "not taken yet, it says so still");
        phone.looks_at(&server);

        // The state put back as it was, and the server reached: the notebook is taken again.
        phone.round();
        assert!(!sync::notebook_refused(&phone.data), "taken again, it says so no more");
        computer.round();
        assert!(computer.notes().contains(&"written beside what cannot be read".to_owned()));

        // A phone older than the form of the notebook, as a later version
        // of the application on the computer makes it: the form of a
        // notebook is never put back.
        let later = sync::FORM + 1;
        let doc = computer.notebook_open();
        let before = doc.transact().state_vector();
        doc.get_or_insert_map("form").insert(&mut doc.transact_mut(), later.to_string(), true);
        doc.get_or_insert_map("notes").insert(&mut doc.transact_mut(), uuid(), "of a later form");
        let change = doc.transact().encode_state_as_update_v1(&before);
        computer
            .asked(|home| home.exchange("notebook", "the", None, None, &[change.as_slice()], later, false).unwrap());
        phone.note("written while the app was old");
        assert!(phone.sync.round().is_err(), "the synchronization stops on the phone, as a whole");
        assert!(sync::notebook_refused(&phone.data), "stopped for a later form, the phone says so");
        // What a device keeps of it goes with its home.
        assert!(!phone.sync.stop().unwrap().on);
        assert!(!sync::notebook_refused(&phone.data), "a device in no home says nothing of it");
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_phone_that_loses_the_record_of_its_files_tells_nothing_as_taken_out() {
    with_server(|address, _| {
        let computer = Device::computer();
        assert!(computer.sync.start(&address, "The desk", None).unwrap().on);
        let nagy =
            computer.add("@book{nagy1979, author={Nagy, Gregory}, title={The Best of the Achaeans}, date={1979}}");
        let lord = computer.add("@book{lord1960, author={Lord, Albert}, title={The Singer of Tales}, date={1960}}");
        let homer = computer.lib().collection_create("Homer", None).unwrap();
        computer.lib().collection_add(&homer.id, std::slice::from_ref(&nagy.id)).unwrap();
        let letter = computer.take_in("letter.txt", LETTER);
        computer.round();
        let phone = Device::phone();
        join(&phone, &computer, &address, "The phone");
        settle(&[&computer, &phone]);
        let said = computer.library_as_said();
        assert_eq!(phone.library_as_said(), said, "the phone holds the library as the computer says it");
        assert!(phone.store().is_empty(), "and no file of it");

        // The three files of the phone's library are lost, and its library is read anew.
        let dir = phone.lib().dir().to_owned();
        for name in ["library.bib", "collections.json", "files.json"] {
            std::fs::remove_file(dir.join(name)).unwrap();
        }
        *phone.lib() = Library::open(&phone.data).unwrap();
        assert!(phone.library_as_said().is_empty(), "it reads as a library that was emptied");
        // A picture is taken into a note there before its round: the record
        // of the files is on the disk again, with one file in it.
        let photograph = phone.take_picture("photograph", &PNG);
        assert!(dir.join("files.json").is_file());
        for _ in 0..2 {
            settle(&[&phone, &computer]);
        }

        {
            let lib = computer.lib();
            assert!(lib.get(&nagy.id).is_some() && lib.get(&lord.id).is_some(), "the computer holds its references");
            assert_eq!(lib.collections.get(&homer.id).expect("its collection").entries, vec![nagy.id.clone()]);
            assert!(lib.files.get(&letter).is_some(), "and the record of its file");
        }
        assert_eq!(computer.bytes(&letter).as_deref(), Some(LETTER), "and the file, byte for byte");
        assert!(computer.home_files().contains(&letter), "which the server holds still");
        let mut but_the_picture = computer.library_as_said();
        but_the_picture.retain(|line| !line.contains(&photograph));
        assert_eq!(but_the_picture, said, "all as before, but for the record of the picture that came");
        assert_eq!(
            phone.library_as_said(),
            computer.library_as_said(),
            "the phone has the references, the collection and the records again"
        );
        assert_eq!(phone.bytes(&photograph).as_deref(), Some(&PNG[..]), "and its picture");
        assert_eq!(phone.store(), vec![photograph.clone()]);
        assert_eq!(computer.bytes(&photograph).as_deref(), Some(&PNG[..]), "which is on the computer too");
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_phone_says_that_what_was_written_waits_while_the_server_is_not_reached() {
    with_server(|address, _| {
        let (computer, phone) = a_computer_and_a_phone(&address);
        computer.note("from the desk");
        phone.note("from the street");
        // A note taken away again, so that the notebook holds a deletion, as every notebook that is written in does.
        phone.note("thought better of");
        phone.take_note_away("thought better of");
        settle(&[&computer, &phone]);
        assert_eq!(phone.once(), (State::Idle, false));

        // The server is not reached: nothing listens where the phone looks for it.
        let nowhere = {
            let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
            format!("http://{}", listener.local_addr().unwrap())
        };
        let server = phone.looks_at(&nowhere);
        assert_eq!(phone.once(), (State::Offline, false), "nothing was written here that the server lacks");

        // The notebook saved whole, as its page saves it, with nothing new
        // in it: its files lie otherwise, and it holds no more than it did.
        phone.save_notebook();
        assert_eq!(phone.once(), (State::Offline, false), "a save of the whole is nothing that waits");

        // A note written.
        phone.note("written under ground");
        assert_eq!(phone.once(), (State::Offline, true), "what was written waits");
        assert_eq!(phone.once(), (State::Offline, true), "and goes on waiting");
        phone.save_notebook();
        assert_eq!(phone.once(), (State::Offline, true), "also when the whole is saved with it");

        // The server reached again.
        phone.looks_at(&server);
        assert_eq!(phone.once(), (State::Idle, false), "sent, it waits no more");
        computer.round();
        assert!(computer.notes().contains(&"written under ground".to_owned()));

        // A note taken away while the server is not reached waits too, though nothing is added by it.
        phone.looks_at(&nowhere);
        assert_eq!(phone.once(), (State::Offline, false));
        phone.take_note_away("written under ground");
        assert_eq!(phone.once(), (State::Offline, true), "a deletion alone waits");
        phone.looks_at(&server);
        assert_eq!(phone.once(), (State::Idle, false));
        computer.round();
        assert!(!computer.notes().contains(&"written under ground".to_owned()));

        // A picture taken while the server is not reached waits as a note does: its record is the library's.
        phone.looks_at(&nowhere);
        assert_eq!(phone.once(), (State::Offline, false));
        let photograph = phone.take_picture("photograph", &PNG);
        assert_eq!(phone.once(), (State::Offline, true));
        phone.looks_at(&server);
        assert_eq!(phone.once(), (State::Idle, false));
        phone.looks_at(&nowhere);
        assert_eq!(phone.once(), (State::Offline, false), "and once it was sent nothing waits");
        phone.looks_at(&server);
        computer.round();
        assert_eq!(computer.bytes(&photograph).as_deref(), Some(&PNG[..]));
    })
    .await;
}

// And two more, of what the second reading of part A found.

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_picture_that_became_the_librarys_is_not_taken_out_of_its_lists_by_a_device_whose_notes_held_it_alone() {
    with_server(|address, _| {
        // Two computers suffice.
        let (a, b) = (Device::computer(), Device::computer());
        assert!(a.sync.start(&address, "The desk", None).unwrap().on);
        a.round();
        join(&b, &a, &address, "The laptop");
        // A picture pasted into a note: on both the notebook holds it alone, and both have said that their notes hold it.
        let picture = a.take_picture("pasted", &PNG);
        a.note("with a picture");
        a.notebook.say_held(std::slice::from_ref(&picture)).unwrap();
        settle(&[&a, &b]);
        b.notebook.say_held(std::slice::from_ref(&picture)).unwrap();
        for device in [&a, &b] {
            assert_eq!(device.bytes(&picture).as_deref(), Some(&PNG[..]));
            assert_eq!(device.lib().files.get(&picture).expect("its record").notebook, Some(Held::Only));
        }

        // On the second the note goes into a document, and the picture is
        // the library's too. Then the note is deleted there, and the sweep
        // of its next start leaves the picture to the library alone.
        b.lib().to_library(&picture, None).unwrap();
        assert_eq!(b.lib().files.get(&picture).unwrap().notebook, Some(Held::Also));
        b.notebook.say_held(&[]).unwrap();
        assert_eq!(b.lib().notebook_sweep(&HashSet::new()).unwrap(), 0);
        assert_eq!(b.lib().files.get(&picture).unwrap().notebook, None);
        b.round();

        // The first was not running meanwhile, and starts with what its
        // notes held when it last said so: the picture, held alone.
        settle(&[&a, &b]);
        // The second's next sweep, its notes holding nothing.
        assert_eq!(
            b.lib().notebook_sweep(&HashSet::new()).unwrap(),
            0,
            "the picture is the library's: no sweep takes it"
        );
        b.round();
        assert_eq!(b.bytes(&picture).as_deref(), Some(&PNG[..]), "it is on the second still");
        assert!(b.home_files().contains(&picture), "and on the server");
        for _ in 0..2 {
            settle(&[&a, &b]);
        }
        for device in [&a, &b] {
            assert_eq!(device.bytes(&picture).as_deref(), Some(&PNG[..]), "the picture is on both");
            let lib = device.lib();
            assert!(lib.files.get(&picture).expect("with its record").listed(), "which the library lists");
            assert!(lib.file_views().iter().any(|file| file.hash == picture), "among its files");
        }
        assert!(a.home_files().contains(&picture), "and the server holds it");

        // When the first has learnt that its notes hold the picture no more, it is the library's alone on both.
        a.notebook.say_held(&[]).unwrap();
        assert_eq!(a.lib().notebook_sweep(&HashSet::new()).unwrap(), 0);
        assert_eq!(b.lib().notebook_sweep(&HashSet::new()).unwrap(), 0);
        for _ in 0..2 {
            settle(&[&a, &b]);
        }
        for device in [&a, &b] {
            assert_eq!(device.lib().files.get(&picture).expect("its record").notebook, None);
            assert_eq!(device.bytes(&picture).as_deref(), Some(&PNG[..]));
        }
    })
    .await;
}

/// How the files of a library are found lost, and what then becomes of the run that finds it.
#[derive(Debug, Clone, Copy)]
enum Found {
    /// When the application is started, and its round does not reach the server.
    AtAStartWhoseRoundFails,
    /// When the application is started, and it ends before any round is made.
    AtAStartWithoutARound,
    /// While the application runs, by the library read anew, and its round does not reach the server.
    WhileItRuns,
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_lost_file_of_the_library_is_remembered_through_a_start_that_never_reaches_the_server() {
    with_server(|address, _| {
        for found in [Found::AtAStartWhoseRoundFails, Found::AtAStartWithoutARound, Found::WhileItRuns] {
            lost_and_remembered(&address, found);
        }
    })
    .await;
}

/// A phone loses the three files of its library; the run that finds them
/// lost never comes to the library in a round, and writes each of them
/// anew; and the phone is started again where its server is reached.
fn lost_and_remembered(address: &str, found: Found) {
    let computer = Device::computer();
    assert!(computer.sync.start(address, "The desk", None).unwrap().on);
    let nagy = computer.add("@book{nagy1979, author={Nagy, Gregory}, title={The Best of the Achaeans}, date={1979}}");
    let lord = computer.add("@book{lord1960, author={Lord, Albert}, title={The Singer of Tales}, date={1960}}");
    let homer = computer.lib().collection_create("Homer", None).unwrap();
    computer.lib().collection_add(&homer.id, std::slice::from_ref(&nagy.id)).unwrap();
    let letter = computer.take_in("letter.txt", LETTER);
    computer.round();
    let phone = Device::phone();
    join(&phone, &computer, address, "The phone");
    settle(&[&computer, &phone]);
    let said = computer.library_as_said();
    assert_eq!(phone.library_as_said(), said);

    // The three files of the phone's library are lost, where its server is not reached.
    let dir = phone.lib().dir().to_owned();
    let three = ["library.bib", "collections.json", "files.json"];
    for name in three {
        std::fs::remove_file(dir.join(name)).unwrap();
    }
    let nowhere = {
        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        format!("http://{}", listener.local_addr().unwrap())
    };
    let server = phone.looks_at(&nowhere);
    let phone = match found {
        Found::WhileItRuns => {
            *phone.lib() = Library::open(&phone.data).unwrap();
            phone
        }
        Found::AtAStartWhoseRoundFails | Found::AtAStartWithoutARound => phone.given(Takes::Notes),
    };
    assert!(phone.library_as_said().is_empty(), "{found:?}: the library reads as one that was emptied");
    let rounds = !matches!(found, Found::AtAStartWithoutARound);
    if rounds {
        assert!(phone.sync.round().is_err(), "{found:?}: the server is not reached");
    }
    // In that run each file is written anew: a picture taken, a reference added, a collection made.
    let photograph = phone.take_picture("photograph", &PNG);
    let own = phone.add("@book{own, title={Written on the phone}}");
    let shelf = phone.lib().collection_create("Shelf", None).unwrap();
    for name in three {
        assert!(dir.join(name).is_file(), "{found:?}: {name} is on the disk again");
    }
    if rounds {
        assert!(phone.sync.round().is_err());
    }

    // A new start, with the server back: no file of the library says that it was lost.
    phone.looks_at(&server);
    let phone = phone.given(Takes::Notes);
    for _ in 0..2 {
        settle(&[&phone, &computer]);
    }

    // No record was told as taken out: nothing left the computer or the server.
    {
        let lib = computer.lib();
        assert!(lib.get(&nagy.id).is_some() && lib.get(&lord.id).is_some(), "{found:?}: the computer's references");
        assert_eq!(lib.collections.get(&homer.id).expect("its collection").entries, vec![nagy.id.clone()]);
        assert!(lib.files.get(&letter).is_some(), "{found:?}: and the record of its file");
    }
    assert_eq!(computer.bytes(&letter).as_deref(), Some(LETTER), "{found:?}: and the file, byte for byte");
    assert!(computer.home_files().contains(&letter), "{found:?}: which the server holds still");
    let mut but_the_phones = computer.library_as_said();
    but_the_phones.retain(|line| ![&photograph, &own.id, &shelf.id].iter().any(|new| line.contains(new.as_str())));
    assert_eq!(but_the_phones, said, "{found:?}: all as before, but for what the phone added");
    assert_eq!(phone.library_as_said(), computer.library_as_said(), "{found:?}: and the phone has it all again");
    assert_eq!(computer.bytes(&photograph).as_deref(), Some(&PNG[..]));
}

/// A picture of four points by three, in one colour.
const PNG: [u8; 73] = [
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 4, 0, 0, 0, 3, 8, 2, 0, 0, 0, 59, 150, 57,
    145, 0, 0, 0, 16, 73, 68, 65, 84, 120, 218, 99, 56, 17, 160, 1, 71, 12, 56, 57, 0, 44, 54, 15, 1, 74, 169, 232,
    210, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
];

/// Another picture: a drawing of a circle.
const SVG: &str = "<?xml version=\"1.0\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"80\" \
                   viewBox=\"0 0 120 80\"><circle cx=\"60\" cy=\"40\" r=\"30\" fill=\"#a33\"/></svg>";
