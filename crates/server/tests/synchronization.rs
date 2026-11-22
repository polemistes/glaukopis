//! A writer's computers kept the same through a home on the server (record
//! 0120), tried with the application's own engine on each computer and the
//! server between them, over HTTP: what the two were built to do together.
//!
//! A computer here is a folder of data with the stores the application
//! opens in it. What the interface would write into a project is written by
//! hand, as changes to a text; a round of the engine is made by calling it,
//! where the application has a thread make them.

use std::collections::BTreeMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::Duration;

use glaukopis_core::history::now_ms;
use glaukopis_core::library::Library;
use glaukopis_core::library::figures::Images;
use glaukopis_core::notebook::Notebook;
use glaukopis_core::paths::DataDir;
use glaukopis_core::projects::Projects;
use glaukopis_core::sync::{self, Hears, State, Sync, whole};
use glaukopis_server::{Config, Server, serve};
use serde_json::{Map, Value, json};
use tokio::sync::oneshot;
use yrs::updates::decoder::Decode;
use yrs::{Doc, GetString, Map as _, ReadTxn, Text, Transact, Update};

/// What a computer heard from its engine.
#[derive(Default)]
struct Heard {
    /// The projects another computer wrote into, with what it wrote.
    projects: Vec<(String, Vec<u8>)>,
    notebook: Vec<Vec<u8>>,
    /// The projects written in apart: their ids and names.
    apart: Vec<(String, String)>,
}

struct Computer {
    _tmp: tempfile::TempDir,
    data: DataDir,
    projects: Projects,
    notebook: Arc<Notebook>,
    library: Arc<Mutex<Library>>,
    sync: Sync,
    heard: Arc<Mutex<Heard>>,
}

impl Computer {
    fn new() -> Computer {
        let tmp = tempfile::tempdir().unwrap();
        let data = DataDir::open(tmp.path().join("data")).unwrap();
        let projects = Projects::new(&data);
        let notebook = Arc::new(Notebook::new(&data));
        let heard = Arc::new(Mutex::new(Heard::default()));
        let (of_projects, of_notebook, of_apart) = (heard.clone(), heard.clone(), heard.clone());
        let hears = Hears {
            status: Box::new(|_| {}),
            project: Box::new(move |id, update| {
                of_projects.lock().unwrap().projects.push((id.to_owned(), update.to_vec()))
            }),
            notebook: Box::new(move |update| of_notebook.lock().unwrap().notebook.push(update.to_vec())),
            apart: Box::new(move |id, name| of_apart.lock().unwrap().apart.push((id.to_owned(), name.to_owned()))),
        };
        let library = Arc::new(Mutex::new(Library::open(&data).unwrap()));
        let sync = Sync::new(&data, projects.clone(), notebook.clone(), library.clone(), hears);
        Computer { _tmp: tmp, data, projects, notebook, library, sync, heard }
    }

    /// A round, in which nothing is to go wrong.
    fn round(&self) {
        let problems = self.sync.round().expect("the round is made");
        assert!(problems.is_empty(), "{problems:?}");
    }

    /// The document of a project as a window that opens it would hold it.
    fn open(&self, id: &str) -> Doc {
        let doc = Doc::new();
        if let Some(whole) = whole::read(&self.projects.dir(id).unwrap()).unwrap() {
            doc.transact_mut().apply_update(Update::decode_v1(&whole).unwrap()).unwrap();
        }
        doc
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

    /// Writes into a project what the application writes by itself, as who is who in its history: no writing of the writer's.
    fn write_quietly(&self, id: &str, words: &str) {
        let doc = self.open(id);
        let before = doc.transact().state_vector();
        doc.get_or_insert_map("users").insert(&mut doc.transact_mut(), uuid(), words);
        self.projects.append(id, &doc.transact().encode_state_as_update_v1(&before)).unwrap();
    }

    /// Takes words out of the text of a project.
    fn take_out(&self, id: &str, at: u32, len: u32) {
        let doc = self.open(id);
        let before = doc.transact().state_vector();
        doc.get_or_insert_text("text").remove_range(&mut doc.transact_mut(), at, len);
        let change = doc.transact().encode_state_as_update_v1(&before);
        self.projects.append(id, &change).unwrap();
        sync::wrote::mark(&self.projects.dir(id).unwrap());
    }

    fn text(&self, id: &str) -> String {
        let doc = self.open(id);
        doc.get_or_insert_text("text").get_string(&doc.transact())
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

    fn has(&self, id: &str) -> bool {
        self.projects.info(id).is_ok()
    }

    fn in_trash(&self, id: &str) -> Option<String> {
        self.projects.trash().unwrap().into_iter().find(|(_, info)| info.id == id).map(|(entry, _)| entry)
    }

    fn settings(&self) -> Map<String, Value> {
        glaukopis_core::settings::load(&self.data.settings_file()).unwrap()
    }

    fn set(&self, name: &str, value: Value) {
        let mut changed = Map::new();
        changed.insert(name.to_owned(), value);
        glaukopis_core::settings::merge(&self.data.settings_file(), &changed).unwrap();
    }

    /// Writes into the notebook, as its page would.
    fn note(&self, words: &str) {
        let doc = Doc::new();
        if let Some(whole) = whole::read(self.notebook.dir()).unwrap() {
            doc.transact_mut().apply_update(Update::decode_v1(&whole).unwrap()).unwrap();
        }
        let before = doc.transact().state_vector();
        let notes = doc.get_or_insert_map("notes");
        notes.insert(&mut doc.transact_mut(), uuid(), words);
        self.notebook.append(&doc.transact().encode_state_as_update_v1(&before), now_ms()).unwrap();
    }

    fn notes(&self) -> Vec<String> {
        let doc = Doc::new();
        let notes = doc.get_or_insert_map("notes");
        if let Some(whole) = whole::read(self.notebook.dir()).unwrap() {
            doc.transact_mut().apply_update(Update::decode_v1(&whole).unwrap()).unwrap();
        }
        let txn = doc.transact();
        let mut out: Vec<String> = notes.iter(&txn).map(|(_, value)| value.to_string(&txn)).collect();
        out.sort();
        out
    }
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

/// Two computers of one writer: the first makes the home, the second enters
/// it by a code, and each has made its first round.
fn two(address: &str) -> (Computer, Computer) {
    let (a, b) = (Computer::new(), Computer::new());
    assert!(a.sync.start(address, "The desk", None).unwrap().on);
    a.round();
    let code = a.sync.code().unwrap().code;
    assert!(b.sync.join(address, &code, "The laptop").unwrap().on);
    b.round();
    (a, b)
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn what_is_made_and_written_on_one_computer_is_on_the_other() {
    with_server(|address, _| {
        let a = Computer::new();
        a.sync.start(&address, "The desk", None).unwrap();
        // The first computer holds a project in a folder, a favourite.
        let drafts = a.projects.folder_create("Drafts", None).unwrap();
        let iliad = a.project("The Iliad", "Sing, goddess");
        a.projects.move_to_folder(&iliad, Some(&drafts.id)).unwrap();
        a.projects.set_favourite(&iliad, true).unwrap();
        a.projects.update_info(&iliad, |info| info.words = 2).unwrap();
        a.round();

        let b = Computer::new();
        b.sync.join(&address, &a.sync.code().unwrap().code, "The laptop").unwrap();
        b.round();
        assert!(b.has(&iliad), "the project is on the other computer");
        assert_eq!(b.text(&iliad), "Sing, goddess");
        let there = b.projects.info(&iliad).unwrap();
        assert_eq!((there.name.as_str(), there.words), ("The Iliad", 2), "with what the list shows of it");
        assert_eq!(there.folder.as_deref(), Some(drafts.id.as_str()), "in its folder");
        assert_eq!(b.projects.folders().unwrap()[0].name, "Drafts");
        assert_eq!(b.projects.favourites().unwrap(), vec![iliad.clone()]);
        assert!(b.heard.lock().unwrap().apart.is_empty());

        // What is written on the second is on the first after a round of each.
        b.write(&iliad, 13, ", the wrath");
        b.round();
        a.round();
        assert_eq!(a.text(&iliad), "Sing, goddess, the wrath");
        let heard = a.heard.lock().unwrap();
        assert_eq!(heard.projects.len(), 1, "the windows of the first are handed the change");
        assert_eq!(heard.projects[0].0, iliad);
        assert!(heard.apart.is_empty(), "nothing was written apart");
        drop(heard);
        // A round in which nothing changed asks for nothing more.
        a.round();
        b.round();
        assert_eq!(a.heard.lock().unwrap().projects.len(), 1);
        assert!(b.heard.lock().unwrap().projects.is_empty(), "what the second wrote itself is not handed back to it");

        // A project made on the second, and a folder renamed there while the first moves it.
        let odyssey = b.project("The Odyssey", "Tell me, Muse");
        let other = a.projects.folder_create("Epics", None).unwrap();
        b.projects.folder_rename(&drafts.id, "Old drafts").unwrap();
        a.projects.folder_move(&drafts.id, Some(&other.id)).unwrap();
        b.round();
        a.round();
        b.round();
        assert_eq!(a.text(&odyssey), "Tell me, Muse");
        for computer in [&a, &b] {
            let folders = computer.projects.folders().unwrap();
            let drafts = folders.iter().find(|f| f.id == drafts.id).unwrap();
            assert_eq!(drafts.name, "Old drafts", "renamed on one");
            assert_eq!(drafts.parent.as_deref(), Some(other.id.as_str()), "and moved on the other");
        }
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn what_is_written_apart_is_brought_together_and_told() {
    with_server(|address, _| {
        let (a, b) = two(&address);
        let iliad = a.project("The Iliad", "Sing, goddess");
        a.round();
        b.round();
        assert_eq!(b.text(&iliad), "Sing, goddess");

        // Each writes while the other does not know of it.
        a.write(&iliad, 0, "Wrath: ");
        b.write(&iliad, 13, ", the wrath");
        a.round();
        assert!(a.heard.lock().unwrap().apart.is_empty(), "the first to meet the server had nothing to be told");
        assert!(a.sync.apart(&iliad).unwrap().is_none());
        b.round();
        assert_eq!(b.text(&iliad), "Wrath: Sing, goddess, the wrath", "both are in the text");
        assert_eq!(
            b.heard.lock().unwrap().apart,
            vec![(iliad.clone(), "The Iliad".to_owned())],
            "and the writer is told"
        );
        let apart = b.sync.apart(&iliad).unwrap().expect("what was written apart is kept with the project");
        // The project as it stood here before is among its earlier versions.
        let kept = apart.kept.expect("a version was kept");
        let before = b.projects.history_state(&iliad, &kept).unwrap();
        let then = Doc::new();
        then.transact_mut().apply_update(Update::decode_v1(&before).unwrap()).unwrap();
        assert_eq!(then.get_or_insert_text("text").get_string(&then.transact()), "Sing, goddess, the wrath");
        assert!(!apart.moment.is_empty(), "with the moment the review is to show the changes from");

        a.round();
        assert_eq!(a.text(&iliad), b.text(&iliad));
        assert!(a.heard.lock().unwrap().apart.is_empty(), "the other only caught up");
        // Seen, it is forgotten; and it is not told again.
        b.sync.apart_seen(&iliad).unwrap();
        assert!(b.sync.apart(&iliad).unwrap().is_none());
        b.round();
        assert_eq!(b.heard.lock().unwrap().apart.len(), 1);

        // One takes a passage out while the other writes on: what was taken out is gone on both.
        a.take_out(&iliad, 0, 7);
        b.write(&iliad, 31, " of Achilles");
        a.round();
        b.round();
        a.round();
        assert_eq!(a.text(&iliad), "Sing, goddess, the wrath of Achilles");
        assert_eq!(b.text(&iliad), a.text(&iliad));
        assert!(b.sync.apart(&iliad).unwrap().is_some(), "written apart again, and told again");
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_project_deleted_on_one_computer_goes_to_the_trash_of_the_other_unless_it_was_written_in() {
    with_server(|address, _| {
        let (a, b) = two(&address);
        let gone = a.project("To go", "nothing much");
        let kept = a.project("To keep", "Sing, goddess");
        a.round();
        b.round();
        assert!(b.has(&gone) && b.has(&kept));

        // Deleted on one, untouched on the other: it goes to the other's trash.
        a.projects.delete(&gone).unwrap();
        a.round();
        b.round();
        assert!(!b.has(&gone));
        assert!(b.in_trash(&gone).is_some(), "it can be brought back there");

        // Deleted on one while the other wrote in it: it is kept, and comes back where it was deleted.
        a.projects.delete(&kept).unwrap();
        b.write(&kept, 13, ", the wrath");
        a.round();
        b.round();
        assert!(b.has(&kept), "what was written in is not deleted");
        a.round();
        assert!(a.has(&kept), "and it is back where it was deleted");
        assert_eq!(a.text(&kept), "Sing, goddess, the wrath");
        b.round();
        a.round();
        assert!(a.has(&kept) && b.has(&kept), "and stays");

        // Brought back from the trash on one, it comes back on the other.
        let entry = b.in_trash(&gone).unwrap();
        b.projects.restore(&entry).unwrap();
        b.round();
        a.round();
        assert!(a.has(&gone), "brought back on the other too");
        assert_eq!(a.text(&gone), "nothing much");

        // Removed from the trash for good on one: the server's copy goes, the other's trash keeps its own.
        a.projects.delete(&gone).unwrap();
        a.round();
        b.round();
        let entry = a.in_trash(&gone).unwrap();
        a.projects.purge(&entry).unwrap();
        a.round();
        assert!(b.in_trash(&gone).is_some());
        // A computer that comes now is not given what is gone.
        let c = Computer::new();
        c.sync.join(&address, &a.sync.code().unwrap().code, "A third").unwrap();
        c.round();
        assert!(!c.has(&gone) && c.in_trash(&gone).is_none());
        assert!(c.has(&kept));
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn the_settings_follow_the_writer_and_the_homes_stand_at_the_first_meeting() {
    with_server(|address, _| {
        let (a, b) = (Computer::new(), Computer::new());
        a.set("theme", json!("dark"));
        a.set("person", json!("the-writer"));
        a.set("projectsPaneWidth", json!(300));
        b.set("theme", json!("light"));
        b.set("person", json!("someone-else"));
        b.set("enterBreaks", json!("line"));
        b.set("textSize", json!(21));
        a.sync.start(&address, "The desk", None).unwrap();
        a.round();
        b.sync.join(&address, &a.sync.code().unwrap().code, "The laptop").unwrap();
        b.round();
        let there = b.settings();
        assert_eq!(there["theme"], json!("dark"), "the home's stands");
        assert_eq!(there["person"], json!("the-writer"), "the writer is one person on every computer");
        assert_eq!(there["textSize"], json!(21), "what belongs to the computer stays");
        assert_eq!(there.get("projectsPaneWidth"), None);
        a.round();
        assert_eq!(a.settings()["enterBreaks"], json!("line"), "what the home lacked is added");
        assert_eq!(a.settings()["projectsPaneWidth"], json!(300));

        // A setting changed on each, apart: both hold both.
        a.set("language", json!("nb"));
        b.set("theme", json!("sepia"));
        a.round();
        b.round();
        a.round();
        for computer in [&a, &b] {
            let settings = computer.settings();
            assert_eq!((settings["language"].clone(), settings["theme"].clone()), (json!("nb"), json!("sepia")));
        }
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn the_notebooks_of_two_computers_become_one() {
    with_server(|address, _| {
        let (a, b) = (Computer::new(), Computer::new());
        a.note("from the desk");
        b.note("from the laptop");
        a.sync.start(&address, "The desk", None).unwrap();
        a.round();
        b.sync.join(&address, &a.sync.code().unwrap().code, "The laptop").unwrap();
        b.round();
        a.round();
        let both = vec!["from the desk".to_owned(), "from the laptop".to_owned()];
        assert_eq!(a.notes(), both, "everything of both is kept");
        assert_eq!(b.notes(), both);
        assert_eq!(a.heard.lock().unwrap().notebook.len(), 1, "the page of the notebook is handed what came");
        b.note("a third");
        b.round();
        a.round();
        assert_eq!(a.notes().len(), 3);
        // Nothing more is asked or handed on when nothing changed.
        a.round();
        b.round();
        assert_eq!(a.heard.lock().unwrap().notebook.len(), 2);
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_computer_removed_is_let_in_no_more_and_one_that_leaves_keeps_what_it_holds() {
    with_server(|address, _| {
        let (a, b) = two(&address);
        let iliad = a.project("The Iliad", "Sing, goddess");
        a.round();
        b.round();
        let told = a.sync.told().unwrap();
        assert_eq!(told.devices.len(), 2);
        let laptop = told.devices.iter().find(|d| !d.you).unwrap().clone();
        assert_eq!(laptop.name, "The laptop");
        assert_eq!(
            a.sync
                .rename(&laptop.id, "The old laptop")
                .unwrap()
                .devices
                .iter()
                .filter(|d| d.name == "The old laptop")
                .count(),
            1
        );
        assert!(
            a.sync.remove(&told.devices.iter().find(|d| d.you).unwrap().id).is_err(),
            "a computer does not remove itself so"
        );

        assert_eq!(a.sync.remove(&laptop.id).unwrap().devices.len(), 1);
        b.sync.once(true);
        let status = b.sync.status();
        assert_eq!(status.state, State::Refused, "{:?}", status.problem);
        assert!(status.on && status.problem.is_some());
        assert!(b.has(&iliad), "what it holds stays");
        // It stops, and can enter again by a new code, with all it holds.
        assert!(!b.sync.stop().unwrap().on);
        b.sync.join(&address, &a.sync.code().unwrap().code, "The laptop again").unwrap();
        b.write(&iliad, 13, ", the wrath");
        b.round();
        a.round();
        assert_eq!(a.text(&iliad), "Sing, goddess, the wrath");

        // The first leaves: it is off, and holds what it held.
        let status = a.sync.stop().unwrap();
        assert!(!status.on);
        assert_eq!(status.state, State::Off);
        assert_eq!(a.text(&iliad), "Sing, goddess, the wrath");
        assert_eq!(b.sync.told().unwrap().devices.len(), 1);
        assert!(a.sync.round().unwrap().is_empty(), "a computer that is in no home makes no round");
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn what_is_lost_on_the_way_is_asked_for_or_sent_again() {
    with_server(|address, _| {
        let (a, b) = two(&address);
        let iliad = a.project("The Iliad", "Sing, goddess");
        a.round();
        b.round();

        // A window of the second saves a state that lacks what had just come into the log.
        let before = whole::read(&b.projects.dir(&iliad).unwrap()).unwrap().unwrap();
        a.write(&iliad, 13, ", the wrath");
        a.take_out(&iliad, 0, 6);
        a.round();
        b.round();
        assert_eq!(b.text(&iliad), "goddess, the wrath");
        b.projects.save_state(&iliad, &before, None).unwrap();
        assert_eq!(b.text(&iliad), "Sing, goddess", "what came is gone from the disk");
        b.round();
        assert_eq!(b.text(&iliad), "goddess, the wrath", "and is asked for again");

        // The server loses a document: the computer that meets it next sends all of it again.
        let (joined, token) = sync::kept::Kept::new(&a.data).joined().unwrap().unwrap();
        let client = glaukopis_core::net::Client::new();
        sync::remote::Home::new(&client, &joined.server, &joined.home, &token)
            .unwrap()
            .delete("project", &iliad)
            .unwrap();
        a.write(&iliad, 18, " of Achilles");
        a.round();
        b.round();
        assert_eq!(b.text(&iliad), "goddess, the wrath of Achilles");
        let c = Computer::new();
        c.sync.join(&address, &a.sync.code().unwrap().code, "A third").unwrap();
        c.round();
        assert_eq!(c.text(&iliad), "goddess, the wrath of Achilles", "the server holds the whole of it again");
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_server_that_cannot_be_reached_is_said_and_what_was_written_meanwhile_is_brought_along() {
    let (a, b, iliad, address) = with_server(|address, _| {
        let (a, b) = two(&address);
        let iliad = a.project("The Iliad", "Sing, goddess");
        a.round();
        b.round();
        (a, b, iliad, address)
    })
    .await;
    // The server is gone.
    tokio::task::spawn_blocking(move || {
        a.write(&iliad, 13, ", the wrath");
        a.sync.once(true);
        let status = a.sync.status();
        assert_eq!(status.state, State::Offline);
        assert!(status.problem.is_some());
        assert!(status.on, "it is synchronized still, and tries again");
        assert_eq!(a.text(&iliad), "Sing, goddess, the wrath", "and is worked on as before");
        let _ = (b, address);
    })
    .await
    .unwrap();
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn the_images_a_project_uses_are_on_every_computer_under_their_names() {
    /// A picture of four points by three, in one colour.
    const PNG: [u8; 73] = [
        137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 4, 0, 0, 0, 3, 8, 2, 0, 0, 0, 59, 150,
        57, 145, 0, 0, 0, 16, 73, 68, 65, 84, 120, 218, 99, 56, 17, 160, 1, 71, 12, 56, 57, 0, 44, 54, 15, 1, 74, 169,
        232, 210, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
    ];
    with_server(|address, _| {
        let (a, b) = two(&address);
        let vase = a.library.lock().unwrap().add_image("vase.png", &PNG, None, None).unwrap().0;
        let iliad = a.project("The Iliad", "Sing, goddess");
        // As the interface says it when it saves the project: the images of its figures.
        a.projects.update_info(&iliad, |info| info.pictures = vec![vase.hash.clone()]).unwrap();
        a.round();
        b.round();
        // The image is a file of the library: its record came with the library's document, and the file followed its record.
        b.round();
        let (there, path) = b.library.lock().unwrap().image(&vase.hash).expect("the image is on the other computer");
        assert_eq!(there.name, "vase.png", "under the name it has on the first");
        assert_eq!(std::fs::read(path).unwrap(), PNG);
        // Nothing more is sent or fetched when the rounds go on.
        a.round();
        b.round();
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn the_writers_own_styles_templates_and_words_are_on_every_computer() {
    with_server(|address, _| {
        let (a, b) = two(&address);
        std::fs::create_dir_all(a.data.styles()).unwrap();
        std::fs::write(a.data.styles().join("my-style.csl"), "<style>mine</style>").unwrap();
        std::fs::create_dir_all(a.data.templates()).unwrap();
        std::fs::write(a.data.templates().join("thesis.json"), "{\"id\":\"thesis\"}").unwrap();
        let words = |c: &Computer| glaukopis_core::spelling::own::OwnWords::new(c.data.words());
        words(&a).add("en", "menis").unwrap();
        words(&b).add("en", "aoidos").unwrap();
        a.round();
        b.round();
        a.round();
        assert_eq!(std::fs::read_to_string(b.data.styles().join("my-style.csl")).unwrap(), "<style>mine</style>");
        assert!(b.data.templates().join("thesis.json").is_file());
        for computer in [&a, &b] {
            let mut list = words(computer).list("en").unwrap();
            list.sort();
            assert_eq!(list, vec!["aoidos".to_owned(), "menis".to_owned()], "words added on each are on both");
        }
        // Taken away on one, a style and a word go from the other.
        std::fs::remove_file(b.data.styles().join("my-style.csl")).unwrap();
        words(&b).remove("en", "menis").unwrap();
        b.round();
        a.round();
        assert!(!a.data.styles().join("my-style.csl").exists());
        assert_eq!(words(&a).list("en").unwrap(), vec!["aoidos".to_owned()]);
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn what_the_application_writes_by_itself_is_not_writing_apart() {
    with_server(|address, _| {
        let (a, b) = two(&address);
        let iliad = a.project("The Iliad", "Sing, goddess");
        a.round();
        b.round();
        // A window of the second opens the project and writes who is who into it; the writer writes on the first.
        b.write_quietly(&iliad, "the writer, at the laptop");
        a.write(&iliad, 13, ", the wrath");
        b.round();
        a.round();
        b.round();
        assert_eq!(a.text(&iliad), b.text(&iliad));
        assert!(a.heard.lock().unwrap().apart.is_empty(), "the writer wrote on one computer only");
        assert!(b.heard.lock().unwrap().apart.is_empty());
        // And where the one that only opened it meets the server second.
        a.write(&iliad, 0, "Wrath: ");
        b.write_quietly(&iliad, "the writer, at the laptop again");
        a.round();
        b.round();
        a.round();
        assert_eq!(a.text(&iliad), b.text(&iliad));
        assert!(a.heard.lock().unwrap().apart.is_empty() && b.heard.lock().unwrap().apart.is_empty());
        // The writer writes on both: that is writing apart, on the one that meets the server second.
        a.write(&iliad, 0, "A: ");
        b.write(&iliad, 0, "B: ");
        a.round();
        b.round();
        assert!(a.heard.lock().unwrap().apart.is_empty());
        assert_eq!(b.heard.lock().unwrap().apart.len(), 1);
    })
    .await;
}

/// What the home keeps of a writer's settings and arrangement is in one
/// document, and a computer that is new to a home with nothing in it makes
/// it: tried here from what the server lists.
#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn the_home_lists_what_the_computers_brought() {
    with_server(|address, _| {
        let (a, b) = two(&address);
        let iliad = a.project("The Iliad", "Sing, goddess");
        a.note("a note");
        a.round();
        b.round();
        let (joined, token) = sync::kept::Kept::new(&b.data).joined().unwrap().unwrap();
        let client = glaukopis_core::net::Client::new();
        let home = sync::remote::Home::new(&client, &joined.server, &joined.home, &token).unwrap();
        let sync::remote::Listing::Docs { stamp, docs } = home.list(None).unwrap() else {
            panic!("the home lists its documents")
        };
        let names: BTreeMap<String, String> =
            docs.into_iter().map(|d| (format!("{}/{}", d.kind, d.id), d.digest)).collect();
        assert_eq!(
            names.keys().cloned().collect::<Vec<_>>(),
            vec!["home/the".to_owned(), "notebook/the".to_owned(), format!("project/{iliad}")]
        );
        assert_eq!(home.list(Some(&stamp)).unwrap(), sync::remote::Listing::Same);
    })
    .await;
}
