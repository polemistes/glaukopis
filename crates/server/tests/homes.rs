//! The homes as they are met from outside, over HTTP, on a port of their
//! own and with a directory that is thrown away: the computers of one writer
//! keeping the same things.

use std::net::SocketAddr;
use std::path::Path;
use std::time::Duration;

use glaukopis_server::files::hash_of;
use glaukopis_server::{Config, Server, serve};
use serde_json::{Value, json};
use tokio::sync::oneshot;
use yrs::updates::decoder::Decode;
use yrs::updates::encoder::Encode;
use yrs::{Doc, GetString, Map, ReadTxn, StateVector, Text, Transact, Update};

struct Running {
    addr: SocketAddr,
    stop: Option<oneshot::Sender<()>>,
    done: tokio::task::JoinHandle<std::io::Result<()>>,
}

/// What is sent with a call.
enum Sent {
    Nothing,
    Json(Value),
    Bytes(Vec<u8>),
}

/// An answer as it came.
struct Raw {
    status: u16,
    body: Vec<u8>,
}

impl Raw {
    fn json(&self) -> Value {
        serde_json::from_slice(&self.body).unwrap_or(Value::Null)
    }

    /// The status and, of a refusal, its kind.
    fn refused(&self) -> (u16, String) {
        (self.status, self.json()["error"].as_str().unwrap_or_default().to_owned())
    }

    fn message(&self) -> String {
        self.json()["message"].as_str().unwrap_or_default().to_owned()
    }
}

fn refused(status: u16, kind: &str) -> (u16, String) {
    (status, kind.to_owned())
}

impl Running {
    async fn start(data: &Path, password: Option<&str>) -> Running {
        let mut config = Config::new(data);
        config.password = password.map(str::to_owned);
        Running::start_with(config).await
    }

    async fn start_with(config: Config) -> Running {
        let server = Server::open(config).unwrap();
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();
        let (stop, stopped) = oneshot::channel::<()>();
        let done = tokio::spawn(serve(server, listener, async {
            let _ = stopped.await;
        }));
        Running { addr, stop: Some(stop), done }
    }

    async fn stop(mut self) {
        let _ = self.stop.take().unwrap().send(());
        tokio::time::timeout(Duration::from_secs(10), self.done).await.expect("the server stops").unwrap().unwrap();
    }

    async fn call(&self, method: &str, path: &str, token: Option<&str>, sent: Sent) -> Raw {
        let url = format!("http://{}{}", self.addr, path);
        let method = method.to_owned();
        let bearer = token.map(|t| format!("Bearer {t}"));
        tokio::task::spawn_blocking(move || {
            let agent: ureq::Agent = ureq::Agent::config_builder().http_status_as_error(false).build().into();
            let mut response = match method.as_str() {
                "GET" | "DELETE" => {
                    let mut request = if method == "GET" { agent.get(&url) } else { agent.delete(&url) };
                    if let Some(b) = &bearer {
                        request = request.header("authorization", b);
                    }
                    request.call()
                }
                m => {
                    let mut request = match m {
                        "PATCH" => agent.patch(&url),
                        "PUT" => agent.put(&url),
                        _ => agent.post(&url),
                    };
                    if let Some(b) = &bearer {
                        request = request.header("authorization", b);
                    }
                    match sent {
                        Sent::Nothing => request.send_empty(),
                        Sent::Json(value) => request.send_json(value),
                        Sent::Bytes(bytes) => request.header("content-type", "application/octet-stream").send(&bytes),
                    }
                }
            }
            .unwrap();
            Raw {
                status: response.status().as_u16(),
                body: response.body_mut().with_config().limit(64 << 20).read_to_vec().unwrap(),
            }
        })
        .await
        .unwrap()
    }

    async fn get(&self, path: &str, token: &str) -> Raw {
        self.call("GET", path, Some(token), Sent::Nothing).await
    }

    /// Makes a home, with a computer called `name`. Returns the home and the computer's token.
    async fn home(&self, name: &str) -> (String, String) {
        let made = self.call("POST", "/api/homes", None, Sent::Json(json!({ "name": name }))).await;
        assert_eq!(made.status, 201, "{}", made.message());
        let made = made.json();
        (made["home"].as_str().unwrap().to_owned(), made["token"].as_str().unwrap().to_owned())
    }

    /// Admits another computer to the home. Returns its id and its token.
    async fn second(&self, home: &str, token: &str, name: &str) -> (String, String) {
        let code = self.call("POST", &format!("/api/homes/{home}/codes"), Some(token), Sent::Nothing).await;
        assert_eq!(code.status, 201, "{}", code.message());
        let code = code.json()["code"].as_str().unwrap().to_owned();
        let joined =
            self.call("POST", "/api/homes/join", None, Sent::Json(json!({ "code": code, "name": name }))).await;
        assert_eq!(joined.status, 200, "{}", joined.message());
        let joined = joined.json();
        (joined["device"].as_str().unwrap().to_owned(), joined["token"].as_str().unwrap().to_owned())
    }
}

// ---------------------------------------------------------------------------
// One computer's side of a document

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

fn unhex(text: &str) -> Vec<u8> {
    (0..text.len()).step_by(2).map(|i| u8::from_str_radix(&text[i..i + 2], 16).unwrap()).collect()
}

/// An exchange as the application sends it.
fn exchange_of(seen: Option<&str>, since: Option<&str>, changes: &[Vec<u8>]) -> Vec<u8> {
    let head = serde_json::to_vec(&json!({ "seen": seen, "since": since })).unwrap();
    let mut sent = (head.len() as u32).to_le_bytes().to_vec();
    sent.extend_from_slice(&head);
    sent.extend_from_slice(&(changes.len() as u32).to_le_bytes());
    for change in changes {
        sent.extend_from_slice(&(change.len() as u32).to_le_bytes());
        sent.extend_from_slice(change);
    }
    sent
}

/// An answer to an exchange: its head, and the news.
fn answer_of(raw: &Raw) -> (Value, Vec<u8>) {
    assert_eq!(raw.status, 200, "{}", raw.message());
    let length = u32::from_le_bytes(raw.body[..4].try_into().unwrap()) as usize;
    let head: Value = serde_json::from_slice(&raw.body[4..4 + length]).unwrap();
    (head, raw.body[4 + length..].to_vec())
}

/// A computer's copy of one document, and what it last saw of the server's.
struct Copy {
    doc: Doc,
    seen: Option<String>,
    since: Option<String>,
    unsent: Vec<Vec<u8>>,
}

impl Copy {
    fn new(client: u64) -> Copy {
        Copy { doc: Doc::with_client_id(client), seen: None, since: None, unsent: Vec::new() }
    }

    fn write(&mut self, words: &str) {
        let before = self.doc.transact().state_vector();
        let text = self.doc.get_or_insert_text("text");
        let at = text.len(&self.doc.transact());
        text.insert(&mut self.doc.transact_mut(), at, words);
        self.unsent.push(self.doc.transact().encode_state_as_update_v1(&before));
    }

    /// Says that the texts are of the form `form`, as a later version does.
    fn raise_form(&mut self, form: u32) {
        let before = self.doc.transact().state_vector();
        self.doc.get_or_insert_map("form").insert(&mut self.doc.transact_mut(), form.to_string(), true);
        self.unsent.push(self.doc.transact().encode_state_as_update_v1(&before));
    }

    fn text(&self) -> String {
        self.doc.get_or_insert_text("text").get_string(&self.doc.transact())
    }

    fn sent(&self) -> Vec<u8> {
        exchange_of(self.seen.as_deref(), self.since.as_deref(), &self.unsent)
    }

    /// What the answer says is taken in, as the application does.
    fn take(&mut self, raw: &Raw) -> Value {
        let (head, news) = answer_of(raw);
        if head["news"] == json!(true) {
            self.doc.transact_mut().apply_update(Update::decode_v1(&news).unwrap()).unwrap();
        } else {
            assert!(news.is_empty(), "news only where it is said there is");
        }
        self.seen = Some(head["digest"].as_str().unwrap().to_owned());
        self.since = Some(head["now"].as_str().unwrap().to_owned());
        self.unsent.clear();
        head
    }

    async fn exchange(&mut self, server: &Running, path: &str, token: &str) -> Value {
        let raw = server.call("POST", path, Some(token), Sent::Bytes(self.sent())).await;
        self.take(&raw)
    }
}

// ---------------------------------------------------------------------------

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_home_is_made_joined_renamed_and_left() {
    let tmp = tempfile::tempdir().unwrap();
    let server = Running::start(tmp.path(), Some("sesame")).await;
    let info = server.call("GET", "/api/info", None, Sent::Nothing).await.json();
    assert_eq!((info["homes"].clone(), info["protocol"].clone()), (json!(true), json!(1)));

    // Made with the password of the server, as a project is published.
    let asked = server.call("POST", "/api/homes", None, Sent::Json(json!({ "name": "The study" }))).await;
    assert_eq!(asked.refused(), refused(401, "password"));
    let wrong = json!({ "name": "The study", "password": "open" });
    assert_eq!(server.call("POST", "/api/homes", None, Sent::Json(wrong)).await.refused(), refused(401, "password"));
    let made = json!({ "name": "The study", "password": "sesame" });
    let made = server.call("POST", "/api/homes", None, Sent::Json(made)).await;
    assert_eq!(made.status, 201, "{}", made.message());
    let made = made.json();
    let home = made["home"].as_str().unwrap().to_owned();
    let study = made["token"].as_str().unwrap().to_owned();
    let study_id = made["device"].as_str().unwrap().to_owned();
    let path = format!("/api/homes/{home}");

    // Nothing is told without a token, or with one that is not of the home.
    assert_eq!(server.call("GET", &path, None, Sent::Nothing).await.refused(), refused(401, "not-admitted"));
    assert_eq!(server.get(&path, "nonsense").await.refused(), refused(401, "not-admitted"));
    let nowhere = "/api/homes/0a1b2c3d-0000-4000-8000-000000000009";
    assert_eq!(server.get(nowhere, &study).await.refused(), refused(404, "no-home"));

    // A code, told once, admits another computer once.
    let code = server.call("POST", &format!("{path}/codes"), Some(&study), Sent::Nothing).await;
    assert_eq!(code.status, 201);
    let code = code.json();
    let typed = code["code"].as_str().unwrap().to_lowercase().replace('-', " ");
    let expires = code["expires"].as_i64().unwrap();
    let told = server.get(&path, &study).await.json();
    assert_eq!(told["codes"], json!([{ "id": code["id"], "created": expires - 3600, "expires": expires }]));
    let join = json!({ "code": typed, "name": " The  laptop " });
    let joined = server.call("POST", "/api/homes/join", None, Sent::Json(join.clone())).await;
    assert_eq!(joined.status, 200, "{}", joined.message());
    let joined = joined.json();
    assert_eq!(joined["home"], json!(home));
    let laptop = joined["token"].as_str().unwrap().to_owned();
    let laptop_id = joined["device"].as_str().unwrap().to_owned();
    let again = server.call("POST", "/api/homes/join", None, Sent::Json(join)).await;
    assert_eq!(again.refused(), refused(404, "bad-code"), "good once");

    // Each is told of all, and which is itself; no token is told again.
    let told = server.get(&path, &laptop).await;
    let told = told.json();
    assert_eq!(told["you"], json!(laptop_id));
    assert_eq!(told["codes"], json!([]), "the code is used");
    let devices = told["devices"].as_array().unwrap();
    assert_eq!(devices.len(), 2);
    assert_eq!((devices[1]["name"].clone(), devices[1]["you"].clone()), (json!("The laptop"), json!(true)));
    assert_eq!((devices[0]["id"].clone(), devices[0]["you"].clone()), (json!(study_id), json!(false)));
    assert!(devices[0]["lastSeen"].as_i64().unwrap() > 0);
    assert_eq!(told["usedBytes"], json!(0));
    assert_eq!(told["maxFileBytes"], json!(512u64 << 20));
    assert_eq!(told["maxHomeBytes"], json!(10u64 << 30));
    assert!(!told.to_string().contains(&study) && !told.to_string().contains(&laptop));

    // Five codes may be open at a time; one withdrawn admits no one.
    let mut codes = Vec::new();
    for _ in 0..5 {
        codes.push(server.call("POST", &format!("{path}/codes"), Some(&laptop), Sent::Nothing).await.json());
    }
    let sixth = server.call("POST", &format!("{path}/codes"), Some(&laptop), Sent::Nothing).await;
    assert_eq!(sixth.refused(), refused(400, "invalid"));
    let withdrawn = format!("{path}/codes/{}", codes[0]["id"].as_str().unwrap());
    assert_eq!(server.call("DELETE", &withdrawn, Some(&study), Sent::Nothing).await.status, 204);
    assert_eq!(
        server.call("DELETE", &withdrawn, Some(&study), Sent::Nothing).await.refused(),
        refused(404, "bad-code")
    );
    let join = json!({ "code": codes[0]["code"], "name": "x" });
    assert_eq!(
        server.call("POST", "/api/homes/join", None, Sent::Json(join)).await.refused(),
        refused(404, "bad-code")
    );

    // Any computer renames any.
    let renamed = server
        .call("PATCH", &format!("{path}/devices/{study_id}"), Some(&laptop), Sent::Json(json!({ "name": "Desk" })))
        .await;
    assert_eq!(renamed.status, 200, "{}", renamed.message());
    assert_eq!(renamed.json()["devices"][0]["name"], json!("Desk"));
    assert_eq!(renamed.json()["you"], json!(laptop_id), "answered as the home is told");
    let nameless = server
        .call("PATCH", &format!("{path}/devices/{study_id}"), Some(&laptop), Sent::Json(json!({ "name": " " })))
        .await;
    assert_eq!(nameless.refused(), refused(400, "invalid"));

    // A computer that is removed is let in no more.
    let (third, third_token) = server.second(&home, &study, "The phone").await;
    let removed = format!("{path}/devices/{third}");
    assert_eq!(server.call("DELETE", &removed, Some(&study), Sent::Nothing).await.status, 204);
    assert_eq!(server.get(&path, &third_token).await.refused(), refused(401, "not-admitted"));
    let doc = format!("{path}/docs/project/p1");
    let refused_doc = server.call("POST", &doc, Some(&third_token), Sent::Bytes(exchange_of(None, None, &[]))).await;
    assert_eq!(refused_doc.refused(), refused(401, "not-admitted"));
    assert_eq!(server.get(&format!("{path}/files"), &third_token).await.refused(), refused(401, "not-admitted"));
    assert_eq!(server.call("DELETE", &removed, Some(&study), Sent::Nothing).await.refused(), refused(400, "invalid"));

    // What is kept is there after a restart, and nothing but hashes of tokens.
    let mut copy = Copy::new(1);
    copy.write("Sing, goddess");
    copy.exchange(&server, &doc, &study).await;
    server.stop().await;
    let kept = std::fs::read_to_string(tmp.path().join("homes").join(&home).join("home.json")).unwrap();
    assert!(!kept.contains(&study) && !kept.contains(&laptop), "{kept}");
    assert!(tmp.path().join("homes").join(&home).join("docs/project/p1/state.bin").exists());
    assert!(tmp.path().join("homes").join(&home).join("docs/project/p1/said.json").exists());
    let server = Running::start(tmp.path(), Some("sesame")).await;
    assert_eq!(server.get(&path, &laptop).await.status, 200);

    // A computer may leave; the last to leave takes the home with all it kept.
    let leaving = format!("{path}/devices/{laptop_id}");
    assert_eq!(server.call("DELETE", &leaving, Some(&laptop), Sent::Nothing).await.status, 204);
    assert_eq!(server.get(&path, &laptop).await.refused(), refused(401, "not-admitted"));
    assert!(tmp.path().join("homes").join(&home).exists());
    let last = format!("{path}/devices/{study_id}");
    assert_eq!(server.call("DELETE", &last, Some(&study), Sent::Nothing).await.status, 204);
    assert!(!tmp.path().join("homes").join(&home).exists());
    assert_eq!(server.get(&path, &study).await.refused(), refused(404, "no-home"));
    assert_eq!(server.get(&format!("{path}/docs"), &study).await.refused(), refused(404, "no-home"));
    server.stop().await;
    assert!(!tmp.path().join("homes").join(&home).exists(), "nothing of it is written afterwards");
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn codes_and_homes_are_counted() {
    let tmp = tempfile::tempdir().unwrap();
    let mut config = Config::new(tmp.path());
    config.max_homes = Some(1);
    let server = Running::start_with(config).await;
    let (home, token) = server.home("One").await;
    let second = server.call("POST", "/api/homes", None, Sent::Json(json!({ "name": "Two" }))).await;
    assert_eq!(second.refused(), refused(503, "full"));
    assert!(second.message().contains("homes"), "{}", second.message());

    let code = server.call("POST", &format!("/api/homes/{home}/codes"), Some(&token), Sent::Nothing).await.json();
    for _ in 0..10 {
        let guess = json!({ "code": "AAAA-BBBB-CCCC", "name": "x" });
        assert_eq!(
            server.call("POST", "/api/homes/join", None, Sent::Json(guess)).await.refused(),
            refused(404, "bad-code")
        );
    }
    // Even the right code is refused now, from this address and for a while.
    let right = json!({ "code": code["code"], "name": "x" });
    assert_eq!(
        server.call("POST", "/api/homes/join", None, Sent::Json(right)).await.refused(),
        refused(429, "too-many")
    );
    server.stop().await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn what_one_computer_brings_reaches_the_other() {
    let tmp = tempfile::tempdir().unwrap();
    let server = Running::start(tmp.path(), None).await;
    let (home, study) = server.home("The study").await;
    let (_, laptop) = server.second(&home, &study, "The laptop").await;
    let doc = format!("/api/homes/{home}/docs/project/0a1b2c3d-0000-4000-8000-000000000001");

    // Asked for before it is there: nothing, and nothing is made.
    let mut b = Copy::new(2);
    let head = b.exchange(&server, &doc, &laptop).await;
    assert_eq!(head["news"], json!(true), "it had not seen the empty document either");
    assert_eq!(head["apart"], json!(false));
    let empty = head["digest"].as_str().unwrap().to_owned();
    assert_eq!(server.get(&format!("/api/homes/{home}/docs"), &laptop).await.json()["docs"], json!([]));
    assert!(!tmp.path().join("homes").join(&home).join("docs").exists());

    // Made by the first that brings a change.
    let mut a = Copy::new(1);
    a.write("Sing, goddess");
    let head = a.exchange(&server, &doc, &study).await;
    assert_eq!((head["apart"].clone(), head["news"].clone()), (json!(false), json!(true)));
    assert_ne!(head["digest"], json!(empty));

    // The other is given it.
    let head = b.exchange(&server, &doc, &laptop).await;
    assert_eq!((head["news"].clone(), head["apart"].clone()), (json!(true), json!(false)));
    assert_eq!(b.text(), "Sing, goddess");
    assert_eq!(b.seen, a.seen);

    // Nothing new: no news, and nothing apart.
    let head = b.exchange(&server, &doc, &laptop).await;
    assert_eq!((head["news"].clone(), head["apart"].clone()), (json!(false), json!(false)));
    let head = a.exchange(&server, &doc, &study).await;
    assert_eq!((head["news"].clone(), head["apart"].clone()), (json!(false), json!(false)));

    // One writes, then the other: the second is given the first's, and is not apart.
    a.write(", the wrath");
    a.exchange(&server, &doc, &study).await;
    let head = b.exchange(&server, &doc, &laptop).await;
    assert_eq!(head["apart"], json!(false));
    b.write(" of Achilles");
    let head = b.exchange(&server, &doc, &laptop).await;
    assert_eq!((head["news"].clone(), head["apart"].clone()), (json!(false), json!(false)));
    let head = a.exchange(&server, &doc, &study).await;
    assert_eq!((head["news"].clone(), head["apart"].clone()), (json!(true), json!(false)));
    assert_eq!(a.text(), "Sing, goddess, the wrath of Achilles");

    // Both write while apart: the second to come is told so, and given what it lacks.
    a.write(" μῆνιν");
    b.write(" ἄειδε");
    let head = a.exchange(&server, &doc, &study).await;
    assert_eq!(head["apart"], json!(false), "the first found nothing it had not seen");
    let head = b.exchange(&server, &doc, &laptop).await;
    assert_eq!((head["news"].clone(), head["apart"].clone()), (json!(true), json!(true)));
    let head = a.exchange(&server, &doc, &study).await;
    assert_eq!((head["news"].clone(), head["apart"].clone()), (json!(true), json!(false)));
    assert_eq!(a.text(), b.text());
    assert_eq!(a.seen, b.seen);

    // One's own change whose answer was lost is not taken for the other's.
    a.write(" — lost");
    let lost = server.call("POST", &doc, Some(&study), Sent::Bytes(a.sent())).await;
    assert_eq!(answer_of(&lost).0["apart"], json!(false));
    a.write(" and more");
    let head = a.exchange(&server, &doc, &study).await;
    assert_eq!(head["apart"], json!(false), "all that came since it last saw was its own");
    assert_eq!(head["news"], json!(true));
    b.exchange(&server, &doc, &laptop).await;
    assert_eq!(b.text(), a.text());

    // A computer that joins with a copy of its own brings it, and is told it wrote apart.
    let (_, phone) = server.second(&home, &study, "The phone").await;
    let mut c = Copy::new(3);
    c.write("written on the train");
    let head = c.exchange(&server, &doc, &phone).await;
    assert_eq!((head["news"].clone(), head["apart"].clone()), (json!(true), json!(true)));
    assert!(c.text().contains("written on the train") && c.text().contains("Sing, goddess"));

    // The state vector it is given says what the server holds.
    let now = StateVector::decode_v1(&unhex(c.since.as_deref().unwrap())).unwrap();
    assert_eq!(now, c.doc.transact().state_vector());
    assert_eq!(hex(&now.encode_v1()), c.since.clone().unwrap());
    server.stop().await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn an_exchange_is_refused_whole() {
    let tmp = tempfile::tempdir().unwrap();
    let mut config = Config::new(tmp.path());
    config.max_document_bytes = 4096;
    let server = Running::start_with(config).await;
    let (home, token) = server.home("The study").await;
    let doc = format!("/api/homes/{home}/docs/notebook/the");

    // A later form of the texts: refused to one that knows it not, before anything is sent or taken.
    let mut later = Copy::new(1);
    later.raise_form(2);
    later.write("of the second form");
    let raw = server.call("POST", &format!("{doc}?form=2"), Some(&token), Sent::Bytes(later.sent())).await;
    later.take(&raw);
    let mut earlier = Copy::new(2);
    let asked = server.call("POST", &doc, Some(&token), Sent::Bytes(earlier.sent())).await;
    assert_eq!(asked.refused(), refused(409, "later"));
    earlier.write("from an earlier version");
    let brought = server.call("POST", &format!("{doc}?form=1"), Some(&token), Sent::Bytes(earlier.sent())).await;
    assert_eq!(brought.refused(), refused(409, "later"));
    let head = later.exchange(&server, &format!("{doc}?form=3"), &token).await;
    assert_eq!(head["news"], json!(false), "nothing of the earlier was taken");

    // Larger than a document may be: refused, and nothing taken.
    later.write(&"x".repeat(5000));
    let raw = server.call("POST", &format!("{doc}?form=2"), Some(&token), Sent::Bytes(later.sent())).await;
    assert_eq!(raw.refused(), refused(413, "too-large"));
    assert!(raw.message().contains("larger than this server keeps"), "{}", raw.message());

    // What cannot be read: none of it is taken.
    let mut good = Copy::new(3);
    good.write("good");
    let mixed = exchange_of(None, None, &[good.unsent[0].clone(), vec![0, 2, 3, 255, 255]]);
    let raw = server.call("POST", &format!("{doc}?form=2"), Some(&token), Sent::Bytes(mixed)).await;
    assert_eq!(raw.refused(), refused(400, "invalid"));
    for nonsense in [vec![1, 2, 3], exchange_of(None, Some("not hex"), &[]), exchange_of(None, Some("ff"), &[])] {
        let raw = server.call("POST", &format!("{doc}?form=2"), Some(&token), Sent::Bytes(nonsense)).await;
        assert_eq!(raw.refused(), refused(400, "invalid"));
    }
    let listed = server.get(&format!("/api/homes/{home}/docs"), &token).await.json();
    assert_eq!(listed["docs"][0]["digest"].as_str(), later.seen.as_deref(), "nothing of it was taken");

    // Kinds and ids that cannot be.
    for (kind, id) in [("Project", "a"), ("project1", "a"), ("abcdefghijklmnopq", "a"), ("project", "-a")] {
        let path = format!("/api/homes/{home}/docs/{kind}/{id}");
        let raw = server.call("POST", &path, Some(&token), Sent::Bytes(exchange_of(None, None, &[]))).await;
        assert_eq!(raw.refused(), refused(400, "invalid"), "{kind}/{id}");
        assert_eq!(server.call("DELETE", &path, Some(&token), Sent::Nothing).await.refused(), refused(400, "invalid"));
    }
    server.stop().await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn the_list_of_documents_and_its_stamp() {
    let tmp = tempfile::tempdir().unwrap();
    let server = Running::start(tmp.path(), None).await;
    let (home, token) = server.home("The study").await;
    let docs = format!("/api/homes/{home}/docs");

    let first = server.get(&docs, &token).await.json();
    let empty = first["stamp"].as_str().unwrap().to_owned();
    assert_eq!(first["docs"], json!([]));
    let same = server.get(&format!("{docs}?seen={empty}"), &token).await.json();
    assert_eq!(same, json!({ "stamp": empty, "same": true }));

    let mut project = Copy::new(1);
    project.write("Sing, goddess");
    project.exchange(&server, &format!("{docs}/project/p1"), &token).await;
    let mut notebook = Copy::new(1);
    notebook.write("a note");
    notebook.exchange(&server, &format!("{docs}/notebook/the"), &token).await;

    let listed = server.get(&format!("{docs}?seen={empty}"), &token).await.json();
    let stamp = listed["stamp"].as_str().unwrap().to_owned();
    assert_ne!(stamp, empty);
    let listed = listed["docs"].as_array().unwrap().clone();
    assert_eq!(listed.len(), 2);
    assert_eq!((listed[0]["kind"].clone(), listed[0]["id"].clone()), (json!("notebook"), json!("the")), "in order");
    assert_eq!(listed[1]["digest"].as_str(), project.seen.as_deref());
    assert!(listed[1]["bytes"].as_u64().unwrap() > 0);
    assert_eq!(server.get(&format!("{docs}?seen={stamp}"), &token).await.json()["same"], json!(true));

    // A change anywhere makes another stamp.
    project.write(", the wrath");
    project.exchange(&server, &format!("{docs}/project/p1"), &token).await;
    let changed = server.get(&format!("{docs}?seen={stamp}"), &token).await.json();
    assert_ne!(changed["stamp"].as_str().unwrap(), stamp);
    let stamp = changed["stamp"].as_str().unwrap().to_owned();

    // The same after a restart, from what is said of each on disk.
    server.stop().await;
    let said = tmp.path().join("homes").join(&home).join("docs/project/p1/said.json");
    let said: Value = serde_json::from_slice(&std::fs::read(said).unwrap()).unwrap();
    assert_eq!(said["digest"].as_str(), project.seen.as_deref());
    assert_eq!(said["changes"].as_array().unwrap().len(), 2);
    let server = Running::start(tmp.path(), None).await;
    assert_eq!(server.get(&format!("{docs}?seen={stamp}"), &token).await.json()["same"], json!(true));
    let head = project.exchange(&server, &format!("{docs}/project/p1"), &token).await;
    assert_eq!(head["news"], json!(false), "the digest is the same after the disk");

    // A document taken off the server.
    let p1 = format!("{docs}/project/p1");
    assert_eq!(server.call("DELETE", &p1, Some(&token), Sent::Nothing).await.status, 204);
    assert!(!tmp.path().join("homes").join(&home).join("docs/project/p1").exists());
    let listed = server.get(&docs, &token).await.json();
    assert_eq!(listed["docs"].as_array().unwrap().len(), 1);
    assert_ne!(listed["stamp"].as_str().unwrap(), stamp);
    let mut fresh = Copy::new(5);
    let head = fresh.exchange(&server, &p1, &token).await;
    assert_eq!(fresh.text(), "", "it is gone: {head}");
    assert_eq!(server.call("DELETE", &p1, Some(&token), Sent::Nothing).await.status, 204, "and gone again");
    server.stop().await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn the_files_of_a_home() {
    let tmp = tempfile::tempdir().unwrap();
    let mut config = Config::new(tmp.path());
    config.max_home_file_bytes = 1000;
    config.max_home_bytes = 1500;
    let server = Running::start_with(config).await;
    let (home, study) = server.home("The study").await;
    let (_, laptop) = server.second(&home, &study, "The laptop").await;
    let (_, stranger) = server.home("Someone else").await;
    let files = format!("/api/homes/{home}/files");
    let path = |bytes: &[u8]| format!("{files}/{}", hash_of(bytes));

    let listed = server.get(&files, &study).await.json();
    assert_eq!(listed, json!({ "files": [], "maxFileBytes": 1000 }));

    // Sent by one, fetched by the other, byte for byte.
    let picture = vec![7u8; 1000];
    let put = server.call("PUT", &path(&picture), Some(&study), Sent::Bytes(picture.clone())).await;
    assert_eq!(put.status, 201, "{}", put.message());
    assert_eq!(put.json(), json!({ "hash": hash_of(&picture), "size": 1000, "stored": true }));
    let again = server.call("PUT", &path(&picture), Some(&laptop), Sent::Bytes(picture.clone())).await;
    assert_eq!((again.status, again.json()["stored"].clone()), (200, json!(false)));
    let got = server.get(&path(&picture), &laptop).await;
    assert_eq!((got.status, got.body == picture), (200, true));
    assert_eq!(server.get(&files, &laptop).await.json()["files"], json!([{ "hash": hash_of(&picture), "size": 1000 }]));
    assert_eq!(server.get(&format!("/api/homes/{home}"), &laptop).await.json()["usedBytes"], json!(1000));
    assert!(tmp.path().join("homes").join(&home).join("files").join(hash_of(&picture)).exists());

    // Not to another home, nor to a stranger.
    assert_eq!(server.get(&path(&picture), &stranger).await.refused(), refused(401, "not-admitted"));
    let theirs = server.call("PUT", &path(b"x"), Some(&stranger), Sent::Bytes(b"x".to_vec())).await;
    assert_eq!(theirs.refused(), refused(401, "not-admitted"));

    // The limits: of one file, and of the files of the home together.
    let large = vec![1u8; 1001];
    let raw = server.call("PUT", &path(&large), Some(&study), Sent::Bytes(large.clone())).await;
    assert_eq!(raw.refused(), refused(413, "too-large"));
    assert!(raw.message().contains("1000 bytes"), "{}", raw.message());
    let more = vec![2u8; 501];
    let raw = server.call("PUT", &path(&more), Some(&study), Sent::Bytes(more.clone())).await;
    assert_eq!(raw.refused(), refused(413, "too-large"));
    assert!(raw.message().contains("a home") && raw.message().contains("1500 bytes"), "{}", raw.message());
    let what = server.call("PUT", &path(b"meant"), Some(&study), Sent::Bytes(b"sent".to_vec())).await;
    assert_eq!(what.refused(), refused(400, "invalid"));

    // Removed: gone, and there is room again.
    let gone = server.call("DELETE", &path(&picture), Some(&laptop), Sent::Nothing).await;
    assert_eq!(gone.status, 204);
    assert_eq!(server.get(&path(&picture), &study).await.refused(), refused(404, "no-file"));
    assert_eq!(
        server.call("DELETE", &path(&picture), Some(&laptop), Sent::Nothing).await.refused(),
        refused(404, "no-file")
    );
    assert_eq!(server.call("PUT", &path(&more), Some(&study), Sent::Bytes(more.clone())).await.status, 201);
    assert_eq!(server.get(&files, &study).await.json()["files"].as_array().unwrap().len(), 1);
    server.stop().await;
}
