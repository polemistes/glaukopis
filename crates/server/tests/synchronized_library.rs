//! The library kept the same on a writer's computers through their home on
//! the server (record 0119, stage 5 of the plan): the references field by
//! field, the collections, the record of the files, and the files of the
//! store, tried with the application's own engine on each computer and the
//! server between them, over HTTP, as `synchronization.rs` tries the rest.
//!
//! A computer here is a folder of data with the stores the application
//! opens in it; what the interface would do to the library is done by
//! calling the library, and a round of the engine is made by calling it.

use std::path::PathBuf;
use std::sync::{Arc, Mutex, MutexGuard};
use std::time::{Duration, Instant};

use glaukopis_core::library::files::{Bookmark, Held, store_paths};
use glaukopis_core::library::{Draft, Entry, Library, draft_from_source};
use glaukopis_core::notebook::Notebook;
use glaukopis_core::paths::DataDir;
use glaukopis_core::projects::Projects;
use glaukopis_core::sync::{self, Hears, Sync};
use glaukopis_server::{Config, Server, serve};
use tokio::io::{AsyncBufReadExt, AsyncReadExt, AsyncWriteExt, BufReader};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::oneshot;

struct Computer {
    tmp: tempfile::TempDir,
    data: DataDir,
    library: Arc<Mutex<Library>>,
    sync: Sync,
}

impl Computer {
    fn new() -> Computer {
        let tmp = tempfile::tempdir().unwrap();
        let data = DataDir::open(tmp.path().join("data")).unwrap();
        let projects = Projects::new(&data);
        let notebook = Arc::new(Notebook::new(&data));
        let library = Arc::new(Mutex::new(Library::open(&data).unwrap()));
        let sync = Sync::new(&data, projects, notebook, library.clone(), Hears::default());
        Computer { tmp, data, library, sync }
    }

    /// A round, in which nothing is to go wrong.
    fn round(&self) {
        let problems = self.sync.round().expect("the round is made");
        assert!(problems.is_empty(), "{problems:?}");
    }

    fn lib(&self) -> MutexGuard<'_, Library> {
        self.library.lock().unwrap()
    }

    fn add(&self, source: &str) -> Entry {
        self.lib().add(&draft_from_source(source).unwrap()).unwrap()
    }

    /// Changes one field of a reference, as the form does.
    fn set(&self, id: &str, field: &str, value: &str) {
        let mut lib = self.lib();
        let mut draft = Draft::from_entry(lib.get(id).unwrap());
        draft.fields.insert(field.into(), value.into());
        lib.update(id, &draft).unwrap();
    }

    fn field(&self, id: &str, field: &str) -> Option<String> {
        self.lib().get(id).and_then(|e| e.get(field).map(str::to_owned))
    }

    fn has(&self, id: &str) -> bool {
        self.lib().get(id).is_some()
    }

    /// A file on this computer's disk, outside the library, to be taken in.
    fn file(&self, name: &str, bytes: &[u8]) -> PathBuf {
        let path = self.tmp.path().join(name);
        std::fs::write(&path, bytes).unwrap();
        path
    }

    /// Gives a reference a file, as the pane of a reference does. Its hash.
    fn attach(&self, id: &str, name: &str, bytes: &[u8]) -> String {
        let path = self.file(name, bytes);
        self.lib().attach(id, &path).unwrap();
        glaukopis_core::library::attachments::hash_bytes(bytes)
    }

    /// Takes a file into the library alone, of no reference. Its hash.
    fn take_in(&self, name: &str, bytes: &[u8]) -> String {
        let path = self.file(name, bytes);
        let dir = self.lib().dir().to_owned();
        let (taken, problems) = store_paths(&dir, &[path], false, &mut |_, _, _| {}, &Default::default());
        assert!(problems.is_empty(), "{problems:?}");
        self.lib().enter_taken(&taken, None).unwrap();
        glaukopis_core::library::attachments::hash_bytes(bytes)
    }

    /// What the store here holds of a file, where it holds it.
    fn bytes(&self, hash: &str) -> Option<Vec<u8>> {
        let path = self.lib().stored_path(hash)?;
        Some(std::fs::read(path).unwrap())
    }

    /// The library as it reads alike on every computer that holds the same:
    /// every reference with its fields in order of their names and its files
    /// by their hashes, every collection, every record but where its file
    /// lies on this disk, every folder of the files.
    fn library_as_said(&self) -> Vec<String> {
        let lib = self.lib();
        let mut out = Vec::new();
        for e in lib.entries() {
            let mut fields: Vec<(String, String)> = e.fields.iter().filter(|(n, _)| n != "file").cloned().collect();
            fields.sort();
            let files: Vec<String> = e
                .attachments()
                .iter()
                .filter_map(|p| glaukopis_core::library::attachments::hash_of_path(p).map(str::to_owned))
                .collect();
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

    /// The home this computer is in, as the engine reaches it.
    fn home_files(&self) -> Vec<String> {
        let (joined, token) = sync::kept::Kept::new(&self.data).joined().unwrap().unwrap();
        let client = glaukopis_core::net::Client::new();
        let home = sync::remote::Home::new(&client, &joined.server, &joined.home, &token).unwrap();
        home.files().unwrap().0.into_iter().map(|f| f.hash).collect()
    }
}

/// Runs `work` with a server made with `config` changed by `set`, taken
/// down after it: its address. What the engine asks waits for its answers,
/// so it is done on a thread for such work.
async fn with_server_set<T: Send + 'static>(
    set: impl FnOnce(&mut Config),
    work: impl FnOnce(String) -> T + Send + 'static,
) -> T {
    let tmp = tempfile::tempdir().unwrap();
    let mut config = Config::new(tmp.path().join("server"));
    set(&mut config);
    let server = Server::open(config).unwrap();
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = format!("http://{}", listener.local_addr().unwrap());
    let (stop, stopped) = oneshot::channel::<()>();
    let serving = tokio::spawn(serve(server, listener, async {
        let _ = stopped.await;
    }));
    let done = tokio::task::spawn_blocking(move || work(address)).await.expect("the work was done");
    let _ = stop.send(());
    tokio::time::timeout(Duration::from_secs(10), serving).await.expect("the server stops").unwrap().unwrap();
    done
}

async fn with_server<T: Send + 'static>(work: impl FnOnce(String) -> T + Send + 'static) -> T {
    with_server_set(|_| {}, work).await
}

/// Two computers of one writer: the first makes the home, the second enters
/// it by a code, and each has made its first round.
fn two(address: &str) -> (Computer, Computer) {
    let (a, b) = (Computer::new(), Computer::new());
    a.sync.start(address, "The desk", None).unwrap();
    a.round();
    b.sync.join(address, &a.sync.code().unwrap().code, "The laptop").unwrap();
    b.round();
    (a, b)
}

/// Rounds of each in turn, as many as it takes what one wrote to reach the
/// others and what they then say of it to come back.
fn settle(computers: &[&Computer]) {
    for _ in 0..2 {
        for computer in computers {
            computer.round();
        }
    }
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_reference_added_changed_and_deleted_on_one_computer_is_so_on_the_other() {
    with_server(|address| {
        let (a, b) = two(&address);
        let nagy = a.add("@book{nagy1979, author={Nagy, Gregory}, title={The Best of the Achaens}, date={1979}}");
        a.round();
        b.round();
        let there = b.lib().get(&nagy.id).cloned().expect("the reference is on the other computer, under its id");
        assert_eq!(there.key, "nagy1979");
        assert_eq!((there.added.as_str(), there.modified.as_str()), (nagy.added.as_str(), nagy.modified.as_str()));
        assert_eq!(b.field(&nagy.id, "author").as_deref(), Some("Nagy, Gregory"));

        a.set(&nagy.id, "title", "The Best of the Achaeans");
        a.round();
        b.round();
        assert_eq!(b.field(&nagy.id, "title").as_deref(), Some("The Best of the Achaeans"));

        // A note written about the work, on the second.
        b.lib().set_note(&nagy.id, "Read for the chapter on kleos.").unwrap();
        b.round();
        a.round();
        assert_eq!(a.field(&nagy.id, "annotation").as_deref(), Some("Read for the chapter on kleos."));

        a.lib().remove(std::slice::from_ref(&nagy.id), false).unwrap();
        a.round();
        b.round();
        assert!(!b.has(&nagy.id), "deleted on the other");
        settle(&[&a, &b]);
        assert!(!a.has(&nagy.id), "and not brought back by it");
        assert_eq!(a.library_as_said(), b.library_as_said());
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn what_two_computers_changed_of_one_reference_apart_is_kept_field_by_field() {
    with_server(|address| {
        let (a, b) = two(&address);
        let nagy = a.add("@book{nagy1979, title={The Best of the Achaens}, date={1997}}");
        settle(&[&a, &b]);
        // The title corrected on one, the year on the other, while they did not meet.
        a.set(&nagy.id, "title", "The Best of the Achaeans");
        b.set(&nagy.id, "date", "1979");
        a.round();
        b.round();
        a.round();
        for computer in [&a, &b] {
            assert_eq!(computer.field(&nagy.id, "title").as_deref(), Some("The Best of the Achaeans"));
            assert_eq!(computer.field(&nagy.id, "date").as_deref(), Some("1979"));
        }
        // The same field on both: one wins, and it is the same on both.
        a.set(&nagy.id, "publisher", "Johns Hopkins University Press");
        b.set(&nagy.id, "publisher", "The Johns Hopkins University Press");
        a.round();
        b.round();
        a.round();
        let said = a.field(&nagy.id, "publisher");
        assert!(said.is_some());
        assert_eq!(said, b.field(&nagy.id, "publisher"));
        settle(&[&a, &b]);
        assert_eq!(a.library_as_said(), b.library_as_said());
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_collection_made_and_changed_follows_with_what_is_in_it() {
    with_server(|address| {
        let (a, b) = two(&address);
        let iliad = a.add("@book{iliad, title={Iliad}}");
        let odyssey = a.add("@book{odyssey, title={Odyssey}}");
        let homer = a.lib().collection_create("Homer", None).unwrap();
        let epic = a.lib().collection_create("Epic", Some(&homer.id)).unwrap();
        a.lib().collection_add(&homer.id, std::slice::from_ref(&iliad.id)).unwrap();
        a.round();
        b.round();
        {
            let lib = b.lib();
            assert_eq!(lib.collections.get(&homer.id).unwrap().entries, vec![iliad.id.clone()]);
            assert_eq!(lib.collections.get(&epic.id).unwrap().parent.as_deref(), Some(homer.id.as_str()));
        }
        // Renamed on one, added to on both, apart.
        a.lib().collection_rename(&homer.id, "Homeric").unwrap();
        a.lib().collection_add(&homer.id, std::slice::from_ref(&odyssey.id)).unwrap();
        let hymns = b.add("@book{hymns, title={Hymns}}");
        b.lib().collection_add(&homer.id, std::slice::from_ref(&hymns.id)).unwrap();
        b.lib().collection_move(&epic.id, None).unwrap();
        settle(&[&a, &b]);
        for computer in [&a, &b] {
            let lib = computer.lib();
            let c = lib.collections.get(&homer.id).unwrap();
            assert_eq!(c.name, "Homeric");
            assert_eq!(c.entries.len(), 3, "what both added: {:?}", c.entries);
            assert_eq!(lib.collections.get(&epic.id).unwrap().parent, None);
        }
        // Taken out of it, and the collection deleted.
        b.lib().collection_remove(&homer.id, std::slice::from_ref(&iliad.id)).unwrap();
        settle(&[&a, &b]);
        assert!(!a.lib().collections.get(&homer.id).unwrap().entries.contains(&iliad.id));
        a.lib().collection_delete(&epic.id).unwrap();
        settle(&[&a, &b]);
        assert!(b.lib().collections.get(&epic.id).is_none());
        assert_eq!(a.library_as_said(), b.library_as_said());
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_file_on_one_computer_arrives_on_the_other_with_its_record_and_its_bytes_and_goes_with_it() {
    with_server(|address| {
        let (a, b) = two(&address);
        let nagy = a.add("@book{nagy1979, author={Nagy, Gregory}, title={The Best of the Achaeans}, date={1979}}");
        // Three megabytes: sent and fetched a piece at a time.
        let book: Vec<u8> = (0..3 << 20).map(|i: u32| (i % 251) as u8).collect();
        let scan = a.attach(&nagy.id, "scan.pdf", &book);
        let loose = a.take_in("letter.txt", b"Dear Albert");
        let shelf = a.lib().files.folder_create("Shelf", None).unwrap();
        a.lib().move_files(std::slice::from_ref(&loose), Some(&shelf.id)).unwrap();
        let mark = Bookmark { id: "m1".into(), page: 12, at: 0.5, name: "Kleos".into() };
        a.lib().set_bookmarks(&scan, vec![mark.clone()]).unwrap();
        // A file a note holds alone, in none of the library's lists.
        let pasted = a.lib().notebook_take_image("pasted", &PNG).unwrap().hash;
        a.round();
        b.round();

        assert_eq!(b.bytes(&scan).as_deref(), Some(&book[..]), "the same bytes");
        assert_eq!(b.bytes(&loose).as_deref(), Some(&b"Dear Albert"[..]));
        assert_eq!(b.bytes(&pasted).as_deref(), Some(&PNG[..]));
        {
            let lib = b.lib();
            let record = lib.files.get(&scan).unwrap();
            assert_eq!(record.name, a.lib().files.get(&scan).unwrap().name);
            assert_eq!(record.bookmarks, vec![mark.clone()]);
            assert_eq!(lib.files.get(&loose).unwrap().folder.as_deref(), Some(shelf.id.as_str()));
            assert_eq!(lib.files.get(&pasted).unwrap().notebook, Some(Held::Only));
            // The reference names its file where it lies on this disk.
            let named = lib.get(&nagy.id).unwrap().attachments();
            assert_eq!(named, vec![record.path.clone()]);
            assert!(lib.attachment_path(&named[0]).unwrap().is_file());
        }
        settle(&[&a, &b]);
        assert_eq!(a.library_as_said(), b.library_as_said());

        // Removed on the second: from the first, from its reference there, and from the server.
        b.lib().remove_file(&loose).unwrap();
        b.round();
        a.round();
        assert!(a.lib().files.get(&loose).is_none());
        assert!(a.bytes(&loose).is_none(), "and from the disk");
        assert!(!a.home_files().contains(&loose), "and from the server");
        assert!(a.home_files().contains(&scan));
        // A file lost from the disk here is fetched again.
        let lost = a.lib().stored_path(&scan).unwrap();
        std::fs::remove_file(&lost).unwrap();
        let c = Computer::new();
        c.sync.join(&address, &a.sync.code().unwrap().code, "A third").unwrap();
        c.round();
        assert_eq!(c.bytes(&scan).as_deref(), Some(&book[..]), "a computer that comes now is given it");
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_file_larger_than_the_server_takes_is_said_once_and_holds_nothing_else_up() {
    with_server_set(
        |config| config.max_home_file_bytes = 64 << 10,
        |address| {
            let (a, b) = two(&address);
            let work = a.add("@book{w, title={A Work}}");
            let large = a.attach(&work.id, "large.pdf", &vec![7u8; 100 << 10]);
            let small = a.attach(&work.id, "small.pdf", b"%PDF small");
            let problems = a.sync.round().unwrap();
            assert_eq!(problems.len(), 1, "{problems:?}");
            assert!(problems[0].contains("large.pdf") || problems[0].contains("A Work"), "{problems:?}");
            assert!(a.sync.round().unwrap().is_empty(), "said once");
            b.round();
            assert_eq!(b.bytes(&small).as_deref(), Some(&b"%PDF small"[..]), "the rest arrives");
            assert!(b.lib().files.get(&large).is_some(), "its record with it");
            assert!(b.bytes(&large).is_none(), "but not the file");
            assert_eq!(b.field(&work.id, "title").as_deref(), Some("A Work"));
            assert!(!a.home_files().contains(&large));
        },
    )
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn at_the_first_meeting_both_libraries_and_their_files_are_kept() {
    with_server(|address| {
        let (a, b) = (Computer::new(), Computer::new());
        let mine = a.add("@book{nagy1979, author={Nagy, Gregory}, title={The Best of the Achaeans}, date={1979}}");
        let my_scan = a.attach(&mine.id, "nagy.pdf", b"%PDF nagy");
        let both = a.take_in("on both.txt", b"the same file on both");
        let homer = a.lib().collection_create("Homer", None).unwrap();
        // The same work on the other, entered there by itself, and others.
        let theirs = b.add("@book{nagy1979, author={Nagy, Gregory}, title={The Best of the Achaeans}, date={1979}}");
        let lord = b.add("@book{lord1960, author={Lord, Albert}, title={The Singer of Tales}, date={1960}}");
        let their_scan = b.attach(&lord.id, "lord.pdf", b"%PDF lord");
        b.take_in("named otherwise.txt", b"the same file on both");
        let theirs_too = b.lib().collection_create("Homer", None).unwrap();

        a.sync.start(&address, "The desk", None).unwrap();
        a.round();
        b.sync.join(&address, &a.sync.code().unwrap().code, "The laptop").unwrap();
        settle(&[&b, &a]);
        for computer in [&a, &b] {
            let lib = computer.lib();
            assert_eq!(lib.len(), 3, "the same work under two ids stays two");
            assert!(lib.get(&mine.id).is_some() && lib.get(&theirs.id).is_some() && lib.get(&lord.id).is_some());
            assert_eq!(lib.collections.list.len(), 2, "two collections of one name stay two");
            assert!(lib.collections.get(&homer.id).is_some() && lib.collections.get(&theirs_too.id).is_some());
            assert_eq!(lib.files.files().len(), 3, "one file each, and the one both had once");
            assert_eq!(lib.files.get(&both).unwrap().name, "on both.txt", "under the home's name");
            assert_ne!(lib.get(&mine.id).unwrap().key, lib.get(&theirs.id).unwrap().key, "each key its own");
        }
        assert_eq!(b.bytes(&my_scan).as_deref(), Some(&b"%PDF nagy"[..]));
        assert_eq!(a.bytes(&their_scan).as_deref(), Some(&b"%PDF lord"[..]));
        assert_eq!(a.library_as_said(), b.library_as_said());
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_reference_deleted_on_one_while_it_was_changed_on_the_other_is_kept_on_both() {
    with_server(|address| {
        let (a, b) = two(&address);
        let first = a.add("@book{first, title={First}, date={1950}}");
        let second = a.add("@book{second, title={Second}, date={1960}}");
        settle(&[&a, &b]);
        // The one who deleted meets the home first.
        a.lib().remove(std::slice::from_ref(&first.id), false).unwrap();
        b.set(&first.id, "title", "First, corrected");
        a.round();
        b.round();
        a.round();
        // The one who changed it meets the home first.
        a.lib().remove(std::slice::from_ref(&second.id), false).unwrap();
        b.set(&second.id, "title", "Second, corrected");
        b.round();
        a.round();
        b.round();
        settle(&[&a, &b]);
        for computer in [&a, &b] {
            assert_eq!(computer.field(&first.id, "title").as_deref(), Some("First, corrected"));
            assert_eq!(computer.field(&first.id, "date").as_deref(), Some("1950"), "whole, not only what changed");
            assert_eq!(computer.field(&second.id, "title").as_deref(), Some("Second, corrected"));
            assert_eq!(computer.field(&second.id, "date").as_deref(), Some("1960"));
        }
        assert_eq!(a.library_as_said(), b.library_as_said());
    })
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_computer_that_was_off_through_many_changes_catches_up() {
    with_server(|address| {
        let (a, b) = two(&address);
        let c = Computer::new();
        c.sync.join(&address, &a.sync.code().unwrap().code, "The old laptop").unwrap();
        let early: Vec<Entry> =
            (0..10).map(|i| a.add(&format!("@book{{early{i}, title={{Early {i}}}, date={{19{i:02}}}}}"))).collect();
        settle(&[&a, &b, &c]);
        // The third is off while the others work.
        for round in 0..6 {
            for i in 0..5 {
                let one = if i % 2 == 0 { &a } else { &b };
                one.add(&format!("@article{{later{round}x{i}, title={{Later {round}.{i}}}}}"));
            }
            a.set(&early[round].id, "note", &format!("changed in round {round}"));
            if round + 6 < early.len() {
                b.lib().remove(std::slice::from_ref(&early[round + 6].id), false).unwrap();
            }
            let hash = b.take_in(&format!("file {round}.txt"), format!("file {round}").as_bytes());
            if round % 3 == 2 {
                b.round();
                a.round();
                a.lib().remove_file(&hash).unwrap();
            }
            let shelf = a.lib().collection_create(&format!("Shelf {round}"), None).unwrap();
            a.lib().collection_add(&shelf.id, std::slice::from_ref(&early[round].id)).unwrap();
            a.round();
            b.round();
        }
        settle(&[&a, &b]);
        c.round();
        c.round();
        assert_eq!(c.library_as_said(), a.library_as_said(), "everything, after a round or two");
        assert_eq!(c.library_as_said(), b.library_as_said());
        let lib = c.lib();
        assert_eq!(lib.len(), 10 - 4 + 30);
        assert_eq!(lib.files.files().len(), 6 - 2);
        for r in lib.files.files() {
            assert!(lib.stored_path(&r.hash).is_some(), "with the bytes of every file: {}", r.name);
        }
    })
    .await;
}

/// The way to a server, through which every request is written down as it
/// goes: its method and its path. What the engine asks is counted so.
async fn counting(server: &str) -> (String, Arc<Mutex<Vec<String>>>) {
    let to = server.trim_start_matches("http://").to_owned();
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = format!("http://{}", listener.local_addr().unwrap());
    let asked = Arc::new(Mutex::new(Vec::new()));
    let writing = asked.clone();
    tokio::spawn(async move {
        while let Ok((client, _)) = listener.accept().await {
            let (to, writing) = (to.clone(), writing.clone());
            tokio::spawn(async move {
                let Ok(server) = TcpStream::connect(&to).await else { return };
                let (from_client, mut to_client) = client.into_split();
                let (mut from_server, mut to_server) = server.into_split();
                tokio::spawn(async move {
                    let _ = tokio::io::copy(&mut from_server, &mut to_client).await;
                });
                let mut reader = BufReader::new(from_client);
                loop {
                    // A request: its head, line by line, and as much body as it says.
                    let mut head = String::new();
                    let mut length = 0u64;
                    loop {
                        let mut line = String::new();
                        if reader.read_line(&mut line).await.unwrap_or(0) == 0 {
                            return;
                        }
                        if let Some((name, value)) = line.split_once(':')
                            && name.eq_ignore_ascii_case("content-length")
                        {
                            length = value.trim().parse().unwrap_or(0);
                        }
                        let end = line == "\r\n";
                        head.push_str(&line);
                        if end {
                            break;
                        }
                    }
                    let asked_for = head.lines().next().unwrap_or("").rsplit_once(' ').map_or("", |(r, _)| r);
                    writing.lock().unwrap().push(asked_for.to_owned());
                    if to_server.write_all(head.as_bytes()).await.is_err() {
                        return;
                    }
                    let mut body = (&mut reader).take(length);
                    if tokio::io::copy(&mut body, &mut to_server).await.is_err() {
                        return;
                    }
                }
            });
        }
    });
    (address, asked)
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_round_in_which_nothing_changed_asks_the_server_for_nothing_beyond_the_list() {
    let tmp = tempfile::tempdir().unwrap();
    let server = Server::open(Config::new(tmp.path().join("server"))).unwrap();
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let direct = format!("http://{}", listener.local_addr().unwrap());
    let (stop, stopped) = oneshot::channel::<()>();
    let serving = tokio::spawn(serve(server, listener, async {
        let _ = stopped.await;
    }));
    let (address, asked) = counting(&direct).await;
    tokio::task::spawn_blocking(move || {
        let (a, b) = two(&address);
        let nagy = a.add("@book{nagy1979, title={The Best of the Achaeans}}");
        a.attach(&nagy.id, "scan.pdf", b"%PDF the scan");
        let homer = a.lib().collection_create("Homer", None).unwrap();
        a.lib().collection_add(&homer.id, std::slice::from_ref(&nagy.id)).unwrap();
        b.add("@book{lord1960, title={The Singer of Tales}}");
        settle(&[&a, &b]);
        settle(&[&a, &b]);
        asked.lock().unwrap().clear();
        a.round();
        b.round();
        let asked = asked.lock().unwrap().clone();
        assert_eq!(asked.len(), 2, "one call each: {asked:#?}");
        for call in &asked {
            assert!(call.starts_with("GET /api/homes/") && call.contains("/docs?seen="), "{call}");
        }
    })
    .await
    .unwrap();
    let _ = stop.send(());
    tokio::time::timeout(Duration::from_secs(10), serving).await.expect("the server stops").unwrap().unwrap();
}

/// How quick a round is with a library of some thousands of references: the
/// first, which sends it all; the other computer's first, which takes it
/// all; one in which nothing changed; and one after a reference was changed.
/// A measure, run by hand: cargo test -p glaukopis-server --test
/// synchronized_library -- --ignored --nocapture a_large_library
#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
#[ignore = "a measure, run by hand"]
async fn a_large_library_is_quick_when_nothing_changed() {
    with_server(|address| {
        const COUNT: usize = 5000;
        let (a, b) = two(&address);
        let drafts: Vec<Draft> = (0..COUNT)
            .map(|i| {
                draft_from_source(&format!(
                    "@article{{work{i}, author={{Author{i}, Given and Other{i}, Name}}, title={{The title of the work numbered {i}}}, \
                     journaltitle={{A Journal of Studies}}, volume={{{v}}}, pages={{{p}--{q}}}, date={{{y}}}, doi={{10.1000/work.{i}}}, \
                     keywords={{one, two, three}}}}",
                    v = i % 80,
                    p = i % 300,
                    q = i % 300 + 20,
                    y = 1900 + i % 120
                ))
                .unwrap()
            })
            .collect();
        let entries = a.lib().add_many(&drafts).unwrap();
        let timed = |what: &str, computer: &Computer| {
            let began = Instant::now();
            computer.round();
            eprintln!("{what}: {:?}", began.elapsed());
        };
        timed("the first round of the computer that holds the library", &a);
        timed("the first round of the other, which takes it all", &b);
        timed("a round of the first in which nothing changed", &a);
        timed("a round of the other in which nothing changed", &b);
        a.set(&entries[17].id, "title", "Changed");
        timed("a round of the first after one reference was changed", &a);
        timed("a round of the other, which takes that change", &b);
        timed("a round of the first after the other took it", &a);
        timed("a round of the first in which nothing changed, again", &a);
        assert_eq!(b.field(&entries[17].id, "title").as_deref(), Some("Changed"));
        let state = std::fs::metadata(a.data.sync().join("library.bin")).unwrap().len();
        let agreed = std::fs::metadata(a.data.sync().join("base").join("references.json")).unwrap().len();
        eprintln!("the library's document: {state} bytes; what its references agreed on: {agreed} bytes");
    })
    .await;
}

/// A picture of four points by three, in one colour.
const PNG: [u8; 73] = [
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 4, 0, 0, 0, 3, 8, 2, 0, 0, 0, 59, 150, 57,
    145, 0, 0, 0, 16, 73, 68, 65, 84, 120, 218, 99, 56, 17, 160, 1, 71, 12, 56, 57, 0, 44, 54, 15, 1, 74, 169, 232,
    210, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
];
