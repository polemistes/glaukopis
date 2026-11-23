//! A home that is full, and a file that cannot be sent (the addendum of
//! 2026-11-23 to record 0120; items 8 and 10 of *After stage 2* in the plan
//! `docs/plans/an-app-for-android.md`), tried with the application's own
//! engine on each device and the server between them, over HTTP, as
//! `synchronized_library.rs` and `phone.rs` try the rest.
//!
//! What was found on the owner's computer: a home that holds less than the
//! library. The server refused each file that did not fit before all of it
//! had been sent, and closed the connection; the proxy in front of it
//! answered 502; the application took that for a server that is not
//! reached, and ended its round, at every round. So the pictures of the
//! notes were never sent, and the phone showed notes without them.
//!
//! What is held here: a file that does not fit is not sent, and it is said
//! that the server is full, at every round and not as a server that is not
//! reached; the files the notes hold go first and the smaller before the
//! larger, so that the pictures of the notes reach a phone though the home
//! is too full for the library; room that is made is used; a file that a
//! proxy cuts off is said of that file, and what is to be fetched arrives;
//! a network that is away still ends the round; and the server's own
//! refusal for want of room is known for what it is.
//!
//! And, after a second reading of the first build: room is kept in the
//! home for the files of the notes, so that a library larger than the home
//! does not fill it and leave none for a picture taken later; a file that
//! fails at every try waits longer each time, and those as large are sent
//! meanwhile; a file that cannot be fetched does not hold back what is to
//! be sent; a phone that is not in front asks nothing at regular times for
//! a file that failed so; and what was taken off the server in a round
//! that ended at a file is told by the next.

use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::sync::{Arc, Mutex, MutexGuard};
use std::time::Duration;

use glaukopis_core::Error;
use glaukopis_core::library::files::store_paths;
use glaukopis_core::library::{Entry, Library, attachments, draft_from_source};
use glaukopis_core::net::Client;
use glaukopis_core::notebook::Notebook;
use glaukopis_core::paths::DataDir;
use glaukopis_core::projects::Projects;
use glaukopis_core::sync::home::HomeDoc;
use glaukopis_core::sync::kept::Kept;
use glaukopis_core::sync::remote::Home;
use glaukopis_core::sync::{self, Hears, State, Status, Sync, Takes};
use glaukopis_server::{Config, Server, serve};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::oneshot;

struct Device {
    tmp: tempfile::TempDir,
    data: DataDir,
    library: Arc<Mutex<Library>>,
    sync: Sync,
}

impl Device {
    /// A device that takes everything of its home.
    fn computer() -> Device {
        Self::opened(Takes::Everything)
    }

    /// A device that takes the notes.
    fn phone() -> Device {
        Self::opened(Takes::Notes)
    }

    fn opened(takes: Takes) -> Device {
        let tmp = tempfile::tempdir().unwrap();
        let data = DataDir::open(tmp.path().join("data")).unwrap();
        let projects = Projects::new(&data);
        let notebook = Arc::new(Notebook::new(&data));
        let library = Arc::new(Mutex::new(Library::open(&data).unwrap()));
        let sync = Sync::new(&data, projects, notebook, library.clone(), takes, Hears::default());
        Device { tmp, data, library, sync }
    }

    /// A round, in which nothing is to go wrong.
    fn round(&self) {
        let problems = self.sync.round().expect("the round is made");
        assert!(problems.is_empty(), "{problems:?}");
    }

    /// A round as the thread makes one, asked for as the writer asks for
    /// one, with what the engine says after it.
    fn once(&self) -> Status {
        self.sync.once(true);
        self.sync.status()
    }

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

    /// Takes a file into a note, as one dropped into it is taken: a file the notes hold alone. Its hash.
    fn take_into_a_note(&self, name: &str, bytes: &[u8]) -> String {
        let path = self.file(name, bytes);
        let dir = self.lib().dir().to_owned();
        let (taken, problems) = store_paths(&dir, &[path], false, &mut |_, _, _| {}, &Default::default());
        assert!(problems.is_empty(), "{problems:?}");
        self.lib().notebook_take(&taken).unwrap();
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

    /// The home this device is in, as the engine reaches it, handed to `ask`.
    fn asked<T>(&self, ask: impl FnOnce(&Home) -> T) -> T {
        let (joined, token) = Kept::new(&self.data).joined().unwrap().expect("the device is in a home");
        let client = Client::new();
        let home = Home::new(&client, &joined.server, &joined.home, &token).unwrap();
        ask(&home)
    }

    /// The files the home holds, by their hashes.
    fn home_files(&self) -> Vec<String> {
        self.asked(|home| home.files().unwrap().0.into_iter().map(|f| f.hash).collect())
    }

    /// The files the library's document says the home holds, as the
    /// server keeps the document: all of it asked for, and nothing sent.
    fn said_to_be_stored(&self) -> Vec<String> {
        self.asked(|home| {
            let answer = home.exchange("library", "the", None, None, &[], sync::FORM, true).unwrap();
            HomeDoc::load(Some(&answer.news)).unwrap().map("stored").into_keys().collect()
        })
    }
}

/// Runs `work` with a server made with `config` changed by `set`, taken
/// down after it: its address, as `with` gives it, where something is to
/// stand between the devices and the server. What the engine asks waits
/// for its answers, so it is done on a thread for such work.
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

/// A way to a server that answers some requests itself, as a proxy does
/// when the server behind it closes the connection: 502, with nothing
/// read of what was being sent. `cut` is asked of each request, by its
/// method and path and how much it says it sends. The rest is passed on,
/// one request to a connection.
async fn through(server: &str, cut: impl Fn(&str, u64) -> bool + Send + std::marker::Sync + 'static) -> String {
    let to = server.trim_start_matches("http://").to_owned();
    let cut = Arc::new(cut);
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = format!("http://{}", listener.local_addr().unwrap());
    tokio::spawn(async move {
        while let Ok((client, _)) = listener.accept().await {
            let (to, cut) = (to.clone(), cut.clone());
            tokio::spawn(async move {
                let mut client = BufReader::new(client);
                // The head of the request, line by line, without what it says of the connection.
                let (mut head, mut length) = (String::new(), 0u64);
                loop {
                    let mut line = String::new();
                    if client.read_line(&mut line).await.unwrap_or(0) == 0 {
                        return;
                    }
                    if line == "\r\n" {
                        break;
                    }
                    if let Some((name, value)) = line.split_once(':') {
                        if name.eq_ignore_ascii_case("content-length") {
                            length = value.trim().parse().unwrap_or(0);
                        }
                        if name.eq_ignore_ascii_case("connection") {
                            continue;
                        }
                    }
                    head.push_str(&line);
                }
                let asked = head.lines().next().unwrap_or("").rsplit_once(' ').map_or("", |(asked, _)| asked);
                if cut(asked, length) {
                    let answer = b"HTTP/1.1 502 Bad Gateway\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
                    let _ = client.get_mut().write_all(answer).await;
                    return;
                }
                let Ok(mut server) = TcpStream::connect(&to).await else { return };
                // One request to a connection, so that each is asked of `cut`.
                head.push_str("Connection: close\r\n\r\n");
                if server.write_all(head.as_bytes()).await.is_ok() {
                    let _ = tokio::io::copy_bidirectional(&mut client, &mut server).await;
                }
            });
        }
    });
    address
}

/// Whether a request sends a file of a home that holds more than a thousand bytes.
fn sends_a_large_file(asked: &str, length: u64) -> bool {
    asked.starts_with("PUT /api/homes/") && asked.contains("/files/") && length > 1000
}

/// Whether a request asks how a home stands: what the engine asks when a
/// file failed as the network fails, to know which of the two it was.
fn asks_how_the_home_stands(asked: &str) -> bool {
    asked.strip_prefix("GET /api/homes/").is_some_and(|home| !home.contains('/'))
}

/// A device enters the home another is in, by a code made there, at `address`.
fn join(device: &Device, home: &Device, address: &str, name: &str) {
    assert!(device.sync.join(address, &home.sync.code().unwrap().code, name).unwrap().on);
}

/// What a file of so many kibibytes holds: each one otherwise, by `with`.
fn kib(count: usize, with: u8) -> Vec<u8> {
    vec![with; count << 10]
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_home_too_full_for_the_files_of_the_library_still_takes_the_pictures_of_the_notes_which_reach_a_phone() {
    with_server_set(
        |config| config.max_home_bytes = 64 << 10,
        |address| {
            // The computer reaches the server by a way that counts the files
            // of more than 45 KiB whose sending is begun, and cuts nothing.
            let begun = Arc::new(AtomicUsize::new(0));
            let counted = begun.clone();
            let counting = move |asked: &str, length: u64| {
                if asked.starts_with("PUT /api/homes/") && asked.contains("/files/") && length > 45 << 10 {
                    counted.fetch_add(1, Ordering::SeqCst);
                }
                false
            };
            let counted_way = tokio::runtime::Handle::current().block_on(through(&address, counting));
            let (computer, phone) = (Device::computer(), Device::phone());
            assert!(computer.sync.start(&counted_way, "The desk", None).unwrap().on);
            computer.round();
            join(&phone, &computer, &address, "The phone");
            phone.round();

            // The home holds 64 KiB. A file of the library of 40 is sent.
            let work = computer.add("@book{w, title={A Work}}");
            let first = computer.attach(&work.id, "first.pdf", &kib(40, 1));
            computer.round();
            assert!(computer.home_files().contains(&first));

            // Two more, of 50 and of 55, for which there is no room; and a picture in a note.
            let scan = computer.attach(&work.id, "scan.pdf", &kib(50, 2));
            let plates = computer.take_in("plates.pdf", &kib(55, 3));
            let sketch = computer.take_picture("sketch", &PNG);
            let status = computer.once();
            assert_eq!(status.state, State::Idle, "the server was reached: {:?}", status.problem);
            let full = status.problem.expect("it is said that the server is full");
            assert!(full.starts_with("The server is full.") && full.contains('2'), "{full}");
            let there = computer.home_files();
            assert!(there.contains(&sketch), "the picture of the note was sent");
            assert!(!there.contains(&scan) && !there.contains(&plates), "what does not fit was not");
            assert_eq!(
                begun.load(Ordering::SeqCst),
                0,
                "its sending was not even begun: the server need not refuse it"
            );

            // The phone has the picture.
            phone.round();
            assert_eq!(phone.bytes(&sketch).as_deref(), Some(&PNG[..]), "byte for byte");
            // And one taken there reaches the computer: what is to be fetched is not held back.
            let drawing = phone.take_picture("drawing", SVG.as_bytes());
            phone.round();
            // It is said at every round for as long as it is so, also one in which the files are not looked at.
            for _ in 0..2 {
                let problems = computer.sync.round().expect("the round is made");
                assert_eq!(problems, vec![full.clone()]);
            }
            assert_eq!(computer.bytes(&drawing), phone.bytes(&drawing));
            assert!(computer.bytes(&drawing).is_some(), "the picture taken on the phone is on the computer");
            let status = computer.once();
            assert_eq!((status.state, status.problem.as_deref()), (State::Idle, Some(full.as_str())));
            assert_eq!(status.last, None, "and not everything is the same");
            assert_eq!(
                begun.load(Ordering::SeqCst),
                0,
                "asked for again and again, what does not fit is still not sent"
            );

            // Room is made: the first file leaves the library. It is taken
            // off the server before anything is sent, and of the two that
            // waited, the smaller is sent.
            computer.lib().remove_file(&first).unwrap();
            let status = computer.once();
            let there = computer.home_files();
            assert!(!there.contains(&first) && there.contains(&scan) && !there.contains(&plates), "{there:?}");
            assert_eq!(begun.load(Ordering::SeqCst), 1, "the one there is room for, and not the other");
            let one = status.problem.expect("one is left");
            assert!(one.starts_with("The server is full.") && one != full, "{one}");
            // And more: the last fits, and nothing is wrong any more.
            computer.lib().remove_file(&scan).unwrap();
            let status = computer.once();
            assert!(computer.home_files().contains(&plates));
            assert_eq!((status.state, status.problem), (State::Idle, None));
            assert!(status.last.is_some(), "everything is the same");
        },
    )
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn the_files_of_the_library_stop_short_of_what_the_home_may_hold_and_a_picture_of_a_note_still_fits() {
    with_server_set(
        |config| config.max_home_bytes = 100 << 10,
        |address| {
            let (computer, phone) = (Device::computer(), Device::phone());
            assert!(computer.sync.start(&address, "The desk", None).unwrap().on);
            computer.round();
            join(&phone, &computer, &address, "The phone");
            phone.round();

            // The home holds 100 KiB, of which a tenth is kept for the files
            // of the notes. A library of one file of 5 KiB and three of 30:
            // the smaller go first, and after two of 30 there are 35 KiB
            // left. The third would fit in that; it does not fit in what is
            // the library's, and waits.
            let small = computer.take_in("leaflet.pdf", &kib(5, 4));
            let large: Vec<String> =
                (1..=3).map(|n| computer.take_in(&format!("volume-{n}.pdf"), &kib(30, n))).collect();
            let status = computer.once();
            assert_eq!(status.state, State::Idle, "{:?}", status.problem);
            let of_the_library = status.problem.expect("one file waits");
            assert!(of_the_library.starts_with("The server is full.") && !of_the_library.contains("notes"));
            assert_eq!(of_the_library.lines().count(), 1, "{of_the_library}");
            let there = computer.home_files();
            assert!(there.contains(&small), "{there:?}");
            assert_eq!(large.iter().filter(|file| there.contains(file)).count(), 2, "one of the three waits");

            // A picture taken on the phone after that still fits, and reaches the computer.
            let photograph = phone.take_picture("photograph", &PNG);
            phone.round();
            assert!(phone.home_files().contains(&photograph));
            let status = computer.once();
            assert_eq!(computer.bytes(&photograph).as_deref(), Some(&PNG[..]));
            assert_eq!(status.problem.as_deref(), Some(of_the_library.as_str()), "the third volume waits still");

            // A file of a note for which there is no room even so is said apart, and first.
            let recording = computer.take_into_a_note("recording.bin", &kib(36, 5));
            let status = computer.once();
            assert!(!computer.home_files().contains(&recording));
            let problem = status.problem.expect("two things are said");
            let said: Vec<&str> = problem.lines().collect();
            assert_eq!(said.len(), 2, "{problem}");
            assert!(said[0].starts_with("The server is full.") && said[0].contains("of your notes"), "{problem}");
            assert_eq!(said[1], of_the_library);
        },
    )
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_file_that_a_proxy_cuts_off_is_said_of_the_file_and_what_is_to_be_fetched_arrives() {
    with_server_set(
        |_| {},
        |direct| {
            let proxied = tokio::runtime::Handle::current().block_on(through(&direct, sends_a_large_file));
            let (desk, laptop) = (Device::computer(), Device::computer());
            assert!(desk.sync.start(&proxied, "The desk", None).unwrap().on);
            desk.round();
            join(&laptop, &desk, &direct, "The laptop");
            laptop.round();
            // On the laptop, which reaches the server itself: a file of 30 KiB, sent.
            let article = laptop.take_in("article.pdf", &kib(30, 1));
            laptop.round();
            // On the desk, behind the proxy: a small file, which passes, and one of 20 KiB, which is cut off.
            let letter = desk.take_in("letter.txt", b"Dear Albert");
            let scan = desk.take_in("scan.pdf", &kib(20, 2));
            for _ in 0..2 {
                let status = desk.once();
                assert_eq!(status.state, State::Idle, "the server is reached: {:?}", status.problem);
                let problem = status.problem.expect("it is said of the file");
                assert!(problem.contains("scan.pdf") && problem.contains("could not be sent"), "{problem}");
                assert_eq!(problem.lines().count(), 1, "and of nothing else: {problem}");
            }
            let there = desk.home_files();
            assert!(there.contains(&letter) && !there.contains(&scan));
            assert_eq!(desk.bytes(&article), laptop.bytes(&article), "what was to be fetched has arrived");
            assert!(desk.bytes(&article).is_some());
        },
    )
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_file_that_fails_at_every_try_waits_longer_each_time_and_those_as_large_are_sent_meanwhile() {
    with_server_set(
        |_| {},
        |direct| {
            // The sending of one file is cut off every time: the one of 20 KiB.
            let tried = Arc::new(AtomicUsize::new(0));
            let counted = tried.clone();
            let cut = move |asked: &str, length: u64| {
                let it = asked.starts_with("PUT /api/homes/") && asked.contains("/files/") && length == 20 << 10;
                if it {
                    counted.fetch_add(1, Ordering::SeqCst);
                }
                it
            };
            let proxied = tokio::runtime::Handle::current().block_on(through(&direct, cut));
            let desk = Device::computer();
            assert!(desk.sync.start(&proxied, "The desk", None).unwrap().on);
            desk.round();
            let scan = desk.take_in("scan.pdf", &kib(20, 2));
            let plates = desk.take_in("plates.pdf", &kib(25, 3));
            let atlas = desk.take_in("atlas.pdf", &kib(30, 4));
            let said_of_the_scan = |status: Status| {
                assert_eq!(status.state, State::Idle, "{:?}", status.problem);
                let problem = status.problem.expect("it is said of the file");
                assert!(problem.contains("scan.pdf") && problem.lines().count() == 1, "{problem}");
            };

            // The round in which it fails: nothing as large is sent in it.
            said_of_the_scan(desk.once());
            assert!(desk.home_files().is_empty());
            // The next: the file waits, and those as large are sent.
            said_of_the_scan(desk.once());
            let there = desk.home_files();
            assert!(there.contains(&plates) && there.contains(&atlas) && !there.contains(&scan), "{there:?}");
            // It is tried again after one round, then after two, then after four.
            let mut tries = vec![1, tried.load(Ordering::SeqCst)];
            for _ in 0..7 {
                said_of_the_scan(desk.once());
                tries.push(tried.load(Ordering::SeqCst));
            }
            assert_eq!(tries, [1, 1, 2, 2, 2, 3, 3, 3, 3], "how often it was tried after each round");
        },
    )
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_file_that_cannot_be_fetched_is_said_of_the_file_and_what_is_to_be_sent_goes_on() {
    with_server_set(
        |_| {},
        |direct| {
            let cut = |asked: &str, _: u64| asked.starts_with("GET /api/homes/") && asked.contains("/files/");
            let proxied = tokio::runtime::Handle::current().block_on(through(&direct, cut));
            let (desk, laptop) = (Device::computer(), Device::computer());
            assert!(desk.sync.start(&proxied, "The desk", None).unwrap().on);
            desk.round();
            join(&laptop, &desk, &direct, "The laptop");
            laptop.round();
            let article = laptop.take_in("article.pdf", &kib(3, 1));
            laptop.round();
            // The desk is to fetch that one, which is cut off, and to send one larger.
            let scan = desk.take_in("scan.pdf", &kib(20, 2));
            let status = desk.once();
            assert_eq!(status.state, State::Idle, "the server is reached: {:?}", status.problem);
            let problem = status.problem.expect("it is said of the file");
            assert!(problem.contains("article.pdf") && problem.contains("could not be fetched"), "{problem}");
            assert!(desk.bytes(&article).is_none());
            assert!(desk.home_files().contains(&scan), "what was to be sent was sent, though it is larger");
        },
    )
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_phone_that_is_not_in_front_asks_nothing_at_regular_times_for_a_file_that_a_proxy_cuts_off() {
    with_server_set(
        |_| {},
        |direct| {
            let cut = |asked: &str, _: u64| asked.starts_with("PUT /api/homes/") && asked.contains("/files/");
            let proxied = tokio::runtime::Handle::current().block_on(through(&direct, cut));
            let (computer, phone) = (Device::computer(), Device::phone());
            assert!(computer.sync.start(&direct, "The desk", None).unwrap().on);
            computer.round();
            join(&phone, &computer, &proxied, "The phone");
            phone.round();
            assert!(!phone.sync.rests(), "in front, it asks every half minute");

            // A picture is taken, and the app goes behind the others: the round it makes then fails for that file.
            phone.take_picture("photograph", &PNG);
            phone.sync.front(false);
            let status = phone.once();
            assert_eq!(status.state, State::Idle, "the server is reached: {:?}", status.problem);
            assert!(status.problem.is_some_and(|problem| problem.contains("could not be sent")));
            // As before such a file was told from a server not reached: behind the others, nothing more is asked.
            assert!(phone.sync.rests(), "it waits until it is woken");
            phone.sync.front(true);
            assert!(!phone.sync.rests());
        },
    )
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_network_that_is_away_when_a_file_fails_ends_the_round_as_a_server_not_reached() {
    with_server_set(
        |_| {},
        |direct| {
            // The sending of a large file is cut off, and so is everything
            // asked of the home after the first such file was tried.
            let tried = Arc::new(AtomicUsize::new(0));
            let counted = tried.clone();
            let cut = move |asked: &str, length: u64| {
                if sends_a_large_file(asked, length) {
                    counted.fetch_add(1, Ordering::SeqCst);
                    return true;
                }
                counted.load(Ordering::SeqCst) > 0 && asks_how_the_home_stands(asked)
            };
            let proxied = tokio::runtime::Handle::current().block_on(through(&direct, cut));
            let (desk, laptop) = (Device::computer(), Device::computer());
            assert!(desk.sync.start(&proxied, "The desk", None).unwrap().on);
            desk.round();
            join(&laptop, &desk, &direct, "The laptop");
            laptop.round();
            let article = laptop.take_in("article.pdf", &kib(30, 1));
            laptop.round();
            desk.take_in("scan.pdf", &kib(20, 2));
            desk.take_in("plates.pdf", &kib(25, 3));
            let status = desk.once();
            assert_eq!(status.state, State::Offline, "{:?}", status.problem);
            assert_eq!(tried.load(Ordering::SeqCst), 1, "the round ended at the first file, and tried no other");
            assert!(desk.bytes(&article).is_none(), "nothing more was asked of a server that is not reached");
        },
    )
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn what_was_taken_off_the_server_in_a_round_that_ended_at_a_file_is_told_by_the_next() {
    with_server_set(
        |_| {},
        |direct| {
            // While the network is away: the sending of a large file is cut
            // off, and so is what is asked of the home after that.
            let away = Arc::new(AtomicBool::new(false));
            let tried = Arc::new(AtomicUsize::new(0));
            let (is_away, counted) = (away.clone(), tried.clone());
            let cut = move |asked: &str, length: u64| {
                if !is_away.load(Ordering::SeqCst) {
                    return false;
                }
                if sends_a_large_file(asked, length) {
                    counted.fetch_add(1, Ordering::SeqCst);
                    return true;
                }
                counted.load(Ordering::SeqCst) > 0 && asks_how_the_home_stands(asked)
            };
            let proxied = tokio::runtime::Handle::current().block_on(through(&direct, cut));
            let (desk, laptop) = (Device::computer(), Device::computer());
            assert!(desk.sync.start(&proxied, "The desk", None).unwrap().on);
            desk.round();
            join(&laptop, &desk, &direct, "The laptop");
            let old = desk.take_in("old.pdf", &kib(2, 9));
            desk.round();
            laptop.round();
            assert_eq!(laptop.bytes(&old), desk.bytes(&old));

            // The file leaves the library on the desk, and another is taken in. The network goes
            // in the round: the file is taken off the server first, and the round ends at the sending.
            desk.lib().remove_file(&old).unwrap();
            let scan = desk.take_in("scan.pdf", &kib(20, 2));
            away.store(true, Ordering::SeqCst);
            assert_eq!(desk.once().state, State::Offline);
            assert_eq!(tried.load(Ordering::SeqCst), 1);
            assert!(!laptop.home_files().contains(&old), "taken off the server before anything was sent");
            assert!(laptop.said_to_be_stored().contains(&old), "which the home's document does not say yet");

            // The network is back: the next round tells it, and sends what waited.
            away.store(false, Ordering::SeqCst);
            let status = desk.once();
            assert_eq!((status.state, status.problem), (State::Idle, None));
            let said = laptop.said_to_be_stored();
            assert!(!said.contains(&old) && said.contains(&scan), "{said:?}");
            laptop.round();
            assert!(laptop.bytes(&old).is_none() && laptop.bytes(&scan).is_some());
        },
    )
    .await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_refusal_for_want_of_room_that_does_arrive_is_known_from_one_of_a_file_too_large() {
    with_server_set(
        |config| {
            config.max_home_bytes = 1000;
            config.max_home_file_bytes = 600;
        },
        |address| {
            let computer = Device::computer();
            assert!(computer.sync.start(&address, "The desk", None).unwrap().on);
            computer.round();
            let send = |bytes: &[u8]| {
                let path = computer.file("sent", bytes);
                computer.asked(|home| home.send_file(&attachments::hash_bytes(bytes), &path))
            };
            assert_eq!(
                computer.asked(|home| home.holds_at_most()).unwrap(),
                Some(1000),
                "the home says what it may hold"
            );
            send(&[1u8; 500]).expect("there is room for the first");
            // There is not room for a second of 550, which is no file too large.
            let refused = send(&[2u8; 550]).expect_err("the home is full");
            assert!(matches!(refused, Error::Refused { kind: "full", .. }), "{refused:?}");
            // One of 700 is larger than a file may be, whatever room there is.
            let refused = send(&[3u8; 700]).expect_err("the file is too large");
            assert!(matches!(refused, Error::Refused { kind: "too-large", .. }), "{refused:?}");
            assert_eq!(computer.home_files().len(), 1);
        },
    )
    .await;
}

/// A picture of four by three points.
const PNG: [u8; 73] = [
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 4, 0, 0, 0, 3, 8, 2, 0, 0, 0, 59, 150, 57,
    145, 0, 0, 0, 16, 73, 68, 65, 84, 120, 218, 99, 56, 17, 160, 1, 71, 12, 56, 57, 0, 44, 54, 15, 1, 74, 169, 232,
    210, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
];

/// Another picture: a drawing of a circle.
const SVG: &str = "<?xml version=\"1.0\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"80\" \
                   viewBox=\"0 0 120 80\"><circle cx=\"60\" cy=\"40\" r=\"30\" fill=\"#a33\"/></svg>";
