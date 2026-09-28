//! The server as it is met from outside: over HTTP and WebSocket, on a port
//! of its own, with a directory that is thrown away.

use std::net::SocketAddr;
use std::path::Path;
use std::time::Duration;

use futures_util::{SinkExt, StreamExt};
use glaukopis_server::files::hash_of;
use glaukopis_server::{Config, Server, serve};
use serde_json::{Value, json};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;
use tokio::sync::oneshot;
use tokio_tungstenite::tungstenite::Message as Frame;
use tokio_tungstenite::{MaybeTlsStream, WebSocketStream};
use yrs::encoding::read::Cursor;
use yrs::sync::{Message, MessageReader, SyncMessage};
use yrs::updates::decoder::{Decode, DecoderV1};
use yrs::updates::encoder::{Encode, Encoder, EncoderV1};
use yrs::{Doc, GetString, ReadTxn, Text, Transact, Update};

const ROOM: &str = "0a1b2c3d-0000-4000-8000-000000000001";
const OTHER: &str = "0a1b2c3d-0000-4000-8000-000000000002";

struct Running {
    addr: SocketAddr,
    stop: Option<oneshot::Sender<()>>,
    done: tokio::task::JoinHandle<std::io::Result<()>>,
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
        tokio::time::timeout(Duration::from_secs(10), self.done)
            .await
            .expect("the server stops though connections were open")
            .unwrap()
            .unwrap();
    }

    /// Calls the server. Returns the status and what was answered.
    async fn call(&self, method: &str, path: &str, token: Option<&str>, body: Option<Value>) -> (u16, Value) {
        let url = format!("http://{}{}", self.addr, path);
        let method = method.to_owned();
        let token = token.map(str::to_owned);
        tokio::task::spawn_blocking(move || {
            let agent: ureq::Agent = ureq::Agent::config_builder().http_status_as_error(false).build().into();
            let bearer = token.map(|t| format!("Bearer {t}"));
            let mut response = match (method.as_str(), body) {
                ("GET", _) => {
                    let mut request = agent.get(&url);
                    if let Some(b) = &bearer {
                        request = request.header("authorization", b);
                    }
                    request.call()
                }
                ("DELETE", _) => {
                    let mut request = agent.delete(&url);
                    if let Some(b) = &bearer {
                        request = request.header("authorization", b);
                    }
                    request.call()
                }
                (m, body) => {
                    let mut request = if m == "PATCH" { agent.patch(&url) } else { agent.post(&url) };
                    if let Some(b) = &bearer {
                        request = request.header("authorization", b);
                    }
                    request.send_json(body.unwrap_or(json!({})))
                }
            }
            .unwrap();
            let status = response.status().as_u16();
            let text = response.body_mut().read_to_string().unwrap();
            let value = if text.trim().is_empty() { Value::Null } else { serde_json::from_str(&text).unwrap() };
            (status, value)
        })
        .await
        .unwrap()
    }

    /// Calls the server with bytes, or for them. Returns the status, what the
    /// answer says of its type and its length, and the answer as it came.
    /// With `announced`, what is sent is said beforehand to be as long as it
    /// is; without, it is sent in pieces until there is no more.
    async fn bytes(&self, method: &str, path: &str, token: Option<&str>, body: Vec<u8>, announced: bool) -> Raw {
        let url = format!("http://{}{}", self.addr, path);
        let method = method.to_owned();
        let bearer = token.map(|t| format!("Bearer {t}"));
        tokio::task::spawn_blocking(move || {
            let agent: ureq::Agent = ureq::Agent::config_builder().http_status_as_error(false).build().into();
            let mut response = match method.as_str() {
                "GET" => {
                    let mut request = agent.get(&url);
                    if let Some(b) = &bearer {
                        request = request.header("authorization", b);
                    }
                    request.call()
                }
                _ => {
                    let mut request = agent.put(&url);
                    if let Some(b) = &bearer {
                        request = request.header("authorization", b);
                    }
                    if announced {
                        request.send(&body)
                    } else {
                        request.send(ureq::SendBody::from_owned_reader(std::io::Cursor::new(body)))
                    }
                }
            }
            .unwrap();
            let told = |name: &str| response.headers().get(name).and_then(|v| v.to_str().ok()).map(str::to_owned);
            Raw {
                status: response.status().as_u16(),
                kind: told("content-type"),
                length: told("content-length"),
                body: response.body_mut().with_config().limit(64 << 20).read_to_vec().unwrap(),
            }
        })
        .await
        .unwrap()
    }

    async fn get(&self, path: &str, token: Option<&str>) -> Raw {
        self.bytes("GET", path, token, Vec::new(), true).await
    }

    async fn put(&self, path: &str, token: Option<&str>, body: &[u8]) -> Raw {
        self.bytes("PUT", path, token, body.to_vec(), true).await
    }

    /// Publishes a project and admits one collaborator to it. Returns the
    /// token of the owner and that of the collaborator.
    async fn shared(&self, room: &str) -> (String, String) {
        let (status, body) = self.call("POST", "/api/rooms", None, Some(json!({ "room": room, "name": "A" }))).await;
        assert_eq!(status, 201, "{body}");
        let owner = body["token"].as_str().unwrap().to_owned();
        let (status, body) =
            self.call("POST", &format!("/api/rooms/{room}/invitations"), Some(&owner), Some(json!({}))).await;
        assert_eq!(status, 201, "{body}");
        let (status, body) = self.call("POST", "/api/join", None, Some(json!({ "code": body["code"] }))).await;
        assert_eq!(status, 200, "{body}");
        (owner, body["token"].as_str().unwrap().to_owned())
    }

    async fn ticket(&self, token: &str) -> String {
        let (status, body) = self.call("POST", &format!("/api/rooms/{ROOM}/tickets"), Some(token), None).await;
        assert_eq!(status, 200, "{body}");
        body["ticket"].as_str().unwrap().to_owned()
    }
}

/// An answer as it came, which need not be JSON.
struct Raw {
    status: u16,
    kind: Option<String>,
    length: Option<String>,
    body: Vec<u8>,
}

impl Raw {
    /// The status and, of a refusal, its kind and what it says.
    fn refusal(&self) -> (u16, String, String) {
        let told: Value = serde_json::from_slice(&self.body).unwrap_or(Value::Null);
        let of = |key: &str| told[key].as_str().unwrap_or_default().to_owned();
        (self.status, of("error"), of("message"))
    }

    /// The status and the kind of the refusal, if it is one.
    fn refused(&self) -> (u16, String) {
        let (status, kind, _) = self.refusal();
        (status, kind)
    }

    fn json(&self) -> Value {
        serde_json::from_slice(&self.body).expect("the answer is JSON")
    }
}

fn refused(status: u16, kind: &str) -> (u16, String) {
    (status, kind.to_owned())
}

/// The names in a directory, in order.
fn names(dir: &Path) -> Vec<String> {
    let mut names: Vec<String> =
        std::fs::read_dir(dir).unwrap().map(|e| e.unwrap().file_name().into_string().unwrap()).collect();
    names.sort();
    names
}

type Socket = WebSocketStream<MaybeTlsStream<TcpStream>>;

/// The application's side of a project that is shared.
struct Side {
    doc: Doc,
    socket: Socket,
    /// How many times the server has answered with what this side lacked.
    answers: usize,
}

fn encode(message: &Message) -> Vec<u8> {
    let mut encoder = EncoderV1::new();
    message.encode(&mut encoder);
    encoder.to_vec()
}

impl Side {
    async fn connect(server: &Running, token: &str) -> Side {
        let ticket = server.ticket(token).await;
        let url = format!("ws://{}/ws/{ROOM}?ticket={ticket}", server.addr);
        let (socket, _) = tokio_tungstenite::connect_async(url).await.expect("the ticket opens the door");
        let mut side = Side { doc: Doc::new(), socket, answers: 0 };
        let sv = side.doc.transact().state_vector();
        side.send(&Message::Sync(SyncMessage::SyncStep1(sv))).await;
        side
    }

    async fn send(&mut self, message: &Message) {
        self.socket.send(Frame::Binary(encode(message).into())).await.unwrap();
    }

    async fn write(&mut self, at: u32, words: &str) {
        let text = self.doc.get_or_insert_text("text");
        let before = self.doc.transact().state_vector();
        text.insert(&mut self.doc.transact_mut(), at, words);
        let change = self.doc.transact().encode_state_as_update_v1(&before);
        self.send(&Message::Sync(SyncMessage::Update(change))).await;
    }

    fn text(&self) -> String {
        self.doc.get_or_insert_text("text").get_string(&self.doc.transact())
    }

    /// Takes in what arrives until the text is `expected`. Returns the code
    /// with which the connection was closed, if it was.
    async fn until(&mut self, expected: Option<&str>) -> Option<u16> {
        self.wait(|side| expected.is_some_and(|e| side.text() == e)).await
    }

    /// Waits until the server has taken in everything that was sent. It
    /// answers in the order in which it was told, so an answer to a question
    /// asked now comes after it has dealt with all that went before.
    async fn settle(&mut self) {
        let before = self.answers;
        let sv = self.doc.transact().state_vector();
        self.send(&Message::Sync(SyncMessage::SyncStep1(sv))).await;
        assert_eq!(self.wait(|side| side.answers > before).await, None);
    }

    async fn wait(&mut self, done: impl Fn(&Side) -> bool) -> Option<u16> {
        let waiting = async {
            loop {
                if done(self) {
                    return None;
                }
                let frame = match self.socket.next().await {
                    Some(Ok(frame)) => frame,
                    _ => return Some(0),
                };
                match frame {
                    Frame::Binary(bytes) => {
                        let mut decoder = DecoderV1::new(Cursor::new(&bytes[..]));
                        let messages: Vec<Message> = MessageReader::new(&mut decoder).map(Result::unwrap).collect();
                        for message in messages {
                            match message {
                                Message::Sync(SyncMessage::SyncStep1(theirs)) => {
                                    let lacking = self.doc.transact().encode_state_as_update_v1(&theirs);
                                    self.send(&Message::Sync(SyncMessage::SyncStep2(lacking))).await;
                                }
                                Message::Sync(SyncMessage::SyncStep2(bytes)) => {
                                    self.doc.transact_mut().apply_update(Update::decode_v1(&bytes).unwrap()).unwrap();
                                    self.answers += 1;
                                }
                                Message::Sync(SyncMessage::Update(bytes)) => {
                                    self.doc.transact_mut().apply_update(Update::decode_v1(&bytes).unwrap()).unwrap();
                                }
                                _ => {}
                            }
                        }
                    }
                    Frame::Close(frame) => return Some(frame.map(|f| u16::from(f.code)).unwrap_or(0)),
                    _ => {}
                }
            }
        };
        tokio::time::timeout(Duration::from_secs(10), waiting).await.expect("what was waited for came")
    }
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn publishing_inviting_joining_and_writing_together() {
    let tmp = tempfile::tempdir().unwrap();
    let server = Running::start(tmp.path(), Some("sesame")).await;

    let (status, info) = server.call("GET", "/api/info", None, None).await;
    assert_eq!(status, 200);
    assert_eq!(info["name"], "glaukopis-server");
    assert_eq!(info["protocol"], 1);
    assert_eq!(info["passwordRequired"], true);

    // Publishing asks for the password of the server.
    let project = json!({ "room": ROOM, "name": "Wrath and the hero" });
    let (status, body) = server.call("POST", "/api/rooms", None, Some(project.clone())).await;
    assert_eq!((status, body["error"].as_str()), (401, Some("password")), "{body}");
    let mut with_password = project.clone();
    with_password["password"] = json!("sesame");
    let (status, body) = server.call("POST", "/api/rooms", None, Some(with_password.clone())).await;
    assert_eq!(status, 201, "{body}");
    let owner = body["token"].as_str().unwrap().to_owned();
    let (status, body) = server.call("POST", "/api/rooms", None, Some(with_password)).await;
    assert_eq!((status, body["error"].as_str()), (409, Some("exists")));

    // Nothing is told without a token, or with one that is not of the room.
    let room = format!("/api/rooms/{ROOM}");
    assert_eq!(server.call("GET", &room, None, None).await.0, 401);
    assert_eq!(server.call("GET", &room, Some("nonsense"), None).await.0, 401);
    assert_eq!(server.call("GET", "/api/rooms/nowhere", Some(&owner), None).await.0, 404);

    // The owner invites, and the code admits.
    let invitation = json!({ "label": "for Anna", "uses": 1, "hours": 48 });
    let (status, body) = server.call("POST", &format!("{room}/invitations"), Some(&owner), Some(invitation)).await;
    assert_eq!(status, 201, "{body}");
    let code = body["code"].as_str().unwrap().to_owned();
    assert_eq!(code.len(), 14);
    assert_eq!(body["usesLeft"], 1);

    let typed = code.to_lowercase().replace('-', " ");
    let (status, body) = server.call("POST", "/api/join", None, Some(json!({ "code": typed, "name": "Anna" }))).await;
    assert_eq!(status, 200, "{body}");
    assert_eq!(body["room"], ROOM);
    assert_eq!(body["name"], "Wrath and the hero");
    let anna = body["token"].as_str().unwrap().to_owned();
    let anna_id = body["member"].as_str().unwrap().to_owned();
    let (status, body) = server.call("POST", "/api/join", None, Some(json!({ "code": code, "name": "Another" }))).await;
    assert_eq!((status, body["error"].as_str()), (404, Some("bad-code")), "the code was for one");

    // A member is told who the others are, and nothing of the invitations; and may not invite.
    let (status, body) = server.call("GET", &room, Some(&anna), None).await;
    assert_eq!(status, 200);
    assert_eq!(body["role"], "member");
    assert_eq!(body["you"], json!(anna_id));
    assert_eq!(body["members"][0]["name"], "Anna");
    assert_eq!(body["invitations"], json!([]));
    assert!(!body.to_string().contains(&anna), "tokens are not told again");
    let (status, body) = server.call("POST", &format!("{room}/invitations"), Some(&anna), Some(json!({}))).await;
    assert_eq!((status, body["error"].as_str()), (403, Some("not-owner")));
    assert_eq!(server.call("DELETE", &room, Some(&anna), None).await.0, 403);

    // Writing together.
    let mut a = Side::connect(&server, &owner).await;
    a.write(0, "Sing, goddess").await;
    let mut b = Side::connect(&server, &anna).await;
    assert_eq!(b.until(Some("Sing, goddess")).await, None);
    b.write(13, ", the wrath").await;
    assert_eq!(a.until(Some("Sing, goddess, the wrath")).await, None);

    let (_, body) = server.call("GET", &room, Some(&owner), None).await;
    assert_eq!(body["role"], "owner");
    assert_eq!(body["ownerPresent"], true);
    assert_eq!(body["members"][0]["present"], true);
    assert_eq!(body["invitations"][0]["open"], false, "used up");

    // A ticket opens the door once.
    let ticket = server.ticket(&owner).await;
    let url = format!("ws://{}/ws/{ROOM}?ticket={ticket}", server.addr);
    let (extra, _) = tokio_tungstenite::connect_async(&url).await.unwrap();
    drop(extra);
    assert!(tokio_tungstenite::connect_async(&url).await.is_err());
    assert!(tokio_tungstenite::connect_async(format!("ws://{}/ws/{ROOM}", server.addr)).await.is_err());

    // The owner may rename what the server calls the project.
    let (status, body) = server.call("PATCH", &room, Some(&owner), Some(json!({ "name": "Wrath" }))).await;
    assert_eq!((status, body["name"].as_str()), (200, Some("Wrath")));

    // A member who is removed is shown the door, and the token admits no more.
    let (status, _) = server.call("DELETE", &format!("{room}/members/{anna_id}"), Some(&owner), None).await;
    assert_eq!(status, 204);
    assert_eq!(b.until(None).await, Some(4001));
    assert_eq!(server.call("GET", &room, Some(&anna), None).await.0, 401);
    assert_eq!(server.call("POST", &format!("{room}/tickets"), Some(&anna), None).await.0, 401);

    // What was written is on the disk within a few seconds, and is there
    // after the server has been stopped and started.
    a.write(0, "μῆνιν: ").await;
    a.settle().await;
    server.stop().await;
    assert_eq!(a.until(None).await, Some(1001), "those present are told that the server stops");
    assert!(tmp.path().join("rooms").join(ROOM).join("state.bin").exists());

    let server = Running::start(tmp.path(), Some("sesame")).await;
    let mut c = Side::connect(&server, &owner).await;
    assert_eq!(c.until(Some("μῆνιν: Sing, goddess, the wrath")).await, None);

    // Taking the project off the server.
    assert_eq!(server.call("DELETE", &room, Some(&owner), None).await.0, 204);
    assert_eq!(c.until(None).await, Some(4002));
    assert_eq!(server.call("GET", &room, Some(&owner), None).await.0, 404);
    assert!(!tmp.path().join("rooms").join(ROOM).exists());
    server.stop().await;
    assert!(!tmp.path().join("rooms").join(ROOM).exists(), "nothing of it is written afterwards");
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn one_who_writes_while_away_brings_it_along() {
    let tmp = tempfile::tempdir().unwrap();
    let server = Running::start(tmp.path(), None).await;
    let (status, body) = server.call("POST", "/api/rooms", None, Some(json!({ "room": ROOM, "name": "A" }))).await;
    assert_eq!(status, 201, "{body}");
    let owner = body["token"].as_str().unwrap().to_owned();

    // The project as it was when it was published, with what it held.
    let ticket = server.ticket(&owner).await;
    let url = format!("ws://{}/ws/{ROOM}?ticket={ticket}", server.addr);
    let (socket, _) = tokio_tungstenite::connect_async(url).await.unwrap();
    let mut a = Side { doc: Doc::new(), socket, answers: 0 };
    a.doc.get_or_insert_text("text").insert(&mut a.doc.transact_mut(), 0, "written on the train");
    let sv = a.doc.transact().state_vector();
    a.send(&Message::Sync(SyncMessage::SyncStep1(sv))).await;

    // The server asks for what it lacks; another is then given it.
    let mut b = Side::connect(&server, &owner).await;
    let both = async {
        tokio::select! {
            _ = a.until(Some("never")) => unreachable!(),
            closed = b.until(Some("written on the train")) => closed,
        }
    };
    assert_eq!(both.await, None);
    server.stop().await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn codes_cannot_be_tried_without_end() {
    let tmp = tempfile::tempdir().unwrap();
    let server = Running::start(tmp.path(), None).await;
    let (_, info) = server.call("GET", "/api/info", None, None).await;
    assert_eq!(info["passwordRequired"], false);

    let (_, body) = server.call("POST", "/api/rooms", None, Some(json!({ "room": ROOM, "name": "A" }))).await;
    let owner = body["token"].as_str().unwrap().to_owned();
    let (_, body) = server.call("POST", &format!("/api/rooms/{ROOM}/invitations"), Some(&owner), Some(json!({}))).await;
    let code = body["code"].as_str().unwrap().to_owned();

    for _ in 0..10 {
        let guess = json!({ "code": "AAAA-BBBB-CCCC", "name": "x" });
        let (status, body) = server.call("POST", "/api/join", None, Some(guess)).await;
        assert_eq!((status, body["error"].as_str()), (404, Some("bad-code")));
    }
    // Even the right code is refused now, from this address and for a while.
    let (status, body) = server.call("POST", "/api/join", None, Some(json!({ "code": code, "name": "x" }))).await;
    assert_eq!((status, body["error"].as_str()), (429, Some("too-many")), "{body}");

    // The owner withdraws the code.
    let withdrawn = server.call("DELETE", &format!("/api/rooms/{ROOM}/invitations/{code}"), Some(&owner), None).await;
    assert_eq!(withdrawn.0, 204);
    let (_, body) = server.call("GET", &format!("/api/rooms/{ROOM}"), Some(&owner), None).await;
    assert_eq!(body["invitations"], json!([]));
    server.stop().await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn the_figures_of_a_project_reach_those_who_have_it() {
    let tmp = tempfile::tempdir().unwrap();
    let server = Running::start(tmp.path(), None).await;
    let (owner, anna) = server.shared(ROOM).await;
    let (_, stranger) = server.shared(OTHER).await;
    let files = format!("/api/rooms/{ROOM}/files");
    let kept = tmp.path().join("rooms").join(ROOM).join("files");

    // Larger than what the server takes in where it is not told otherwise, and no two parts of it alike.
    let figure: Vec<u8> = (0..3_000_000u32).flat_map(|i| i.to_le_bytes()).take(3_000_000).collect();
    let hash = hash_of(&figure);
    let small = b"a smaller one".to_vec();

    let (status, body) = server.call("GET", &files, Some(&owner), None).await;
    assert_eq!((status, &body["files"]), (200, &json!([])));
    assert_eq!(body["maxFileBytes"], json!(50 << 20));

    // The owner puts it; a member who puts it again is told that it is there.
    let put = server.put(&format!("{files}/{hash}"), Some(&owner), &figure).await;
    assert_eq!(put.status, 201, "{:?}", put.refusal());
    assert_eq!(put.json(), json!({ "hash": hash, "size": 3_000_000, "stored": true }));
    let again = server.put(&format!("{files}/{hash}"), Some(&anna), &figure).await;
    assert_eq!(again.status, 200, "{:?}", again.refusal());
    assert_eq!(again.json(), json!({ "hash": hash, "size": 3_000_000, "stored": false }));
    assert_eq!(std::fs::read(kept.join(&hash)).unwrap(), figure);

    // A member gets it, byte for byte.
    let got = server.get(&format!("{files}/{hash}"), Some(&anna)).await;
    assert_eq!(got.status, 200);
    assert_eq!(got.kind.as_deref(), Some("application/octet-stream"));
    assert_eq!(got.length.as_deref(), Some("3000000"));
    assert!(got.body == figure, "what is fetched is what was sent");

    // Sent without its length being told, a file is taken as well. The listing names both, in order.
    let sent = server.bytes("PUT", &format!("{files}/{}", hash_of(&small)), Some(&anna), small.clone(), false).await;
    assert_eq!(sent.status, 201, "{:?}", sent.refusal());
    assert_eq!(sent.json(), json!({ "hash": hash_of(&small), "size": small.len(), "stored": true }));
    let (status, body) = server.call("GET", &files, Some(&anna), None).await;
    let mut expected =
        vec![json!({ "hash": hash, "size": 3_000_000 }), json!({ "hash": hash_of(&small), "size": small.len() })];
    expected.sort_by_key(|f| f["hash"].as_str().unwrap().to_owned());
    assert_eq!((status, &body["files"]), (200, &json!(expected)));
    assert_eq!(server.get(&format!("{files}/{}", hash_of(&small)), Some(&owner)).await.body, small);

    // Nothing for one without a token, or with one that is not of the room.
    let another = b"from someone else".to_vec();
    for token in [None, Some("nonsense"), Some(stranger.as_str())] {
        assert_eq!(server.get(&files, token).await.refused(), refused(401, "not-admitted"));
        assert_eq!(server.get(&format!("{files}/{hash}"), token).await.refused(), refused(401, "not-admitted"));
        let put = server.put(&format!("{files}/{}", hash_of(&another)), token, &another).await;
        assert_eq!(put.refused(), refused(401, "not-admitted"));
        let put = server.put(&format!("{files}/{hash}"), token, b"x").await;
        assert_eq!(put.refused(), refused(401, "not-admitted"), "nor is it told that the file is there");
    }
    // The files of one room are not those of another, and a room that is not there has none.
    let elsewhere = format!("/api/rooms/{OTHER}/files");
    assert_eq!(server.get(&format!("{elsewhere}/{hash}"), Some(&stranger)).await.refused(), refused(404, "no-file"));
    assert_eq!(server.get(&elsewhere, Some(&stranger)).await.json()["files"], json!([]));
    assert_eq!(server.get("/api/rooms/nowhere/files", Some(&owner)).await.refused(), refused(404, "no-room"));
    let nowhere = format!("/api/rooms/nowhere/files/{hash}");
    assert_eq!(server.get(&nowhere, Some(&owner)).await.refused(), refused(404, "no-room"));
    assert_eq!(server.put(&nowhere, Some(&owner), b"x").await.refused(), refused(404, "no-room"));
    assert!(!tmp.path().join("rooms").join("nowhere").exists());

    // What is not what its name says is not kept.
    let meant = hash_of(b"what was meant");
    let put = server.put(&format!("{files}/{meant}"), Some(&owner), b"what was sent").await;
    assert_eq!(put.refused(), refused(400, "invalid"), "{:?}", put.refusal());
    assert_eq!(server.get(&format!("{files}/{meant}"), Some(&owner)).await.refused(), refused(404, "no-file"));

    // Names that are none, and those that would lead elsewhere.
    let names_that_are_none = [
        hash.to_uppercase(),
        hash[..63].to_owned(),
        format!("{hash}0"),
        "..%2Froom.json".to_owned(),
        "..%2F..%2F..%2Froom.json".to_owned(),
        format!("..%2F{}", &hash[..61]),
        "room.json".to_owned(),
    ];
    for name in &names_that_are_none {
        let got = server.get(&format!("{files}/{name}"), Some(&owner)).await;
        assert_eq!(got.refused(), refused(400, "invalid"), "{name}");
        let put = server.put(&format!("{files}/{name}"), Some(&owner), b"x").await;
        assert_eq!(put.refused(), refused(400, "invalid"), "{name}");
    }
    let mut expected = vec![hash.clone(), hash_of(&small)];
    expected.sort();
    assert_eq!(names(&kept), expected, "nothing is left of what was refused");
    assert_eq!(names(&tmp.path().join("rooms").join(ROOM)), vec!["files", "room.json"]);

    // The files are there after the server has been stopped and started.
    server.stop().await;
    let server = Running::start(tmp.path(), None).await;
    assert!(server.get(&format!("{files}/{hash}"), Some(&anna)).await.body == figure);

    // They go with the room.
    assert_eq!(server.call("DELETE", &format!("/api/rooms/{ROOM}"), Some(&owner), None).await.0, 204);
    assert!(!kept.exists());
    assert!(!tmp.path().join("rooms").join(ROOM).exists());
    assert_eq!(server.get(&format!("{files}/{hash}"), Some(&owner)).await.refused(), refused(404, "no-room"));
    let put = server.put(&format!("{files}/{}", hash_of(&small)), Some(&owner), &small).await;
    assert_eq!(put.refused(), refused(404, "no-room"));
    assert!(!tmp.path().join("rooms").join(ROOM).exists(), "and do not bring it back");
    server.stop().await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn files_may_hold_so_much_and_no_more() {
    let tmp = tempfile::tempdir().unwrap();
    let mut config = Config::new(tmp.path());
    assert_eq!((config.max_file_bytes, config.max_room_bytes), (50 << 20, 1 << 30));
    config.max_file_bytes = 1000;
    config.max_room_bytes = 1500;
    let server = Running::start_with(config).await;
    let (owner, anna) = server.shared(ROOM).await;
    let files = format!("/api/rooms/{ROOM}/files");
    let file = |n: u8, size: usize| vec![n; size];
    let path = |bytes: &[u8]| format!("/api/rooms/{ROOM}/files/{}", hash_of(bytes));

    // One file: refused by what it says of its length, and by what comes when it says nothing.
    let large = file(1, 1001);
    let (status, kind, message) = server.put(&path(&large), Some(&owner), &large).await.refusal();
    assert_eq!((status, kind.as_str()), (413, "too-large"), "{message}");
    assert!(message.contains("one file") && message.contains("1000 bytes"), "{message}");
    let (status, kind, message) =
        server.bytes("PUT", &path(&large), Some(&owner), large.clone(), false).await.refusal();
    assert_eq!((status, kind.as_str()), (413, "too-large"), "{message}");
    assert!(message.contains("one file") && message.contains("1000 bytes"), "{message}");
    assert_eq!(server.get(&path(&large), Some(&owner)).await.refused(), refused(404, "no-file"));

    let most = file(2, 1000);
    assert_eq!(server.put(&path(&most), Some(&owner), &most).await.status, 201);

    // The files of the room together: five hundred are left.
    let more = file(3, 501);
    let (status, kind, message) = server.put(&path(&more), Some(&anna), &more).await.refusal();
    assert_eq!((status, kind.as_str()), (413, "too-large"), "{message}");
    assert!(message.contains("one project") && message.contains("1500 bytes"), "{message}");
    let (status, kind, message) = server.bytes("PUT", &path(&more), Some(&anna), more.clone(), false).await.refusal();
    assert_eq!((status, kind.as_str()), (413, "too-large"), "{message}");
    assert!(message.contains("one project") && message.contains("1500 bytes"), "{message}");

    let rest = file(4, 500);
    assert_eq!(server.put(&path(&rest), Some(&anna), &rest).await.status, 201);
    assert_eq!(server.put(&path(b"x"), Some(&anna), b"x").await.refused(), refused(413, "too-large"));
    assert_eq!(server.put(&path(&most), Some(&anna), &most).await.status, 200, "what is there is there");

    let mut expected = vec![hash_of(&most), hash_of(&rest)];
    expected.sort();
    assert_eq!(names(&tmp.path().join("rooms").join(ROOM).join("files")), expected);
    let listed = server.get(&files, Some(&owner)).await.json();
    assert_eq!(listed["files"].as_array().unwrap().iter().map(|f| f["size"].as_u64().unwrap()).sum::<u64>(), 1500);

    // The limits are for each room.
    let (other, _) = server.shared(OTHER).await;
    let put = server.put(&format!("/api/rooms/{OTHER}/files/{}", hash_of(&most)), Some(&other), &most).await;
    assert_eq!(put.status, 201);
    server.stop().await;
}

/// Says what is asked, and no more of what is to be sent than is given here.
async fn begin_to_put(server: &Running, room: &str, hash: &str, token: &str, length: &str, first: &[u8]) -> TcpStream {
    let mut stream = TcpStream::connect(server.addr).await.unwrap();
    let head = format!(
        "PUT /api/rooms/{room}/files/{hash} HTTP/1.1\r\nHost: {}\r\nAuthorization: Bearer {token}\r\n\
         Connection: close\r\n{length}\r\n\r\n",
        server.addr
    );
    stream.write_all(head.as_bytes()).await.unwrap();
    stream.write_all(first).await.unwrap();
    stream.flush().await.unwrap();
    stream
}

/// What is answered, until the server ends the connection.
async fn answer(mut stream: TcpStream) -> String {
    let mut answer = Vec::new();
    // The server may end the connection rudely, having said what it had to say.
    let reading = async { while matches!(stream.read_buf(&mut answer).await, Ok(n) if n > 0) {} };
    tokio::time::timeout(Duration::from_secs(10), reading).await.expect("the server answers");
    String::from_utf8_lossy(&answer).into_owned()
}

/// Waits until as many names are in the directory.
async fn until_there_are(dir: &Path, count: usize) {
    let waiting = async {
        while !dir.exists() || names(dir).len() != count {
            tokio::time::sleep(Duration::from_millis(5)).await;
        }
    };
    tokio::time::timeout(Duration::from_secs(10), waiting).await.expect("the file began to arrive")
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn what_happens_while_a_file_arrives() {
    let tmp = tempfile::tempdir().unwrap();
    let mut config = Config::new(tmp.path());
    config.max_file_bytes = 1000;
    let server = Running::start_with(config).await;
    let (owner, anna) = server.shared(ROOM).await;
    let room = format!("/api/rooms/{ROOM}");
    let kept = tmp.path().join("rooms").join(ROOM).join("files");

    // More than a file may hold, sent in pieces with no end to them: the
    // server answers when the limit is passed, and does not wait for the rest.
    let large = vec![1u8; 2000];
    let mut pieces = b"7d0\r\n".to_vec();
    pieces.extend_from_slice(&large);
    pieces.extend_from_slice(b"\r\n");
    let sending = begin_to_put(&server, ROOM, &hash_of(&large), &owner, "Transfer-Encoding: chunked", &pieces).await;
    let answered = answer(sending).await;
    assert!(answered.starts_with("HTTP/1.1 413"), "{answered}");
    assert!(answered.contains("too-large") && answered.contains("1000 bytes"), "{answered}");
    assert_eq!(names(&kept), Vec::<String>::new(), "nothing is left of it");

    // One that breaks off leaves nothing either.
    let figure = b"half of it, and the other half".to_vec();
    let (first, rest) = figure.split_at(15);
    let hash = hash_of(&figure);
    let sending = begin_to_put(&server, ROOM, &hash, &anna, "Content-Length: 30", first).await;
    until_there_are(&kept, 1).await;
    assert_eq!(server.get(&format!("{room}/files"), Some(&owner)).await.json()["files"], json!([]));
    assert_eq!(server.get(&format!("{room}/files/{hash}"), Some(&owner)).await.refused(), refused(404, "no-file"));
    drop(sending);
    until_there_are(&kept, 0).await;

    // A member who is removed while a file of theirs arrives does not have it kept.
    let (_, told) = server.call("GET", &room, Some(&anna), None).await;
    let anna_id = told["you"].as_str().unwrap().to_owned();
    let mut sending = begin_to_put(&server, ROOM, &hash, &anna, "Content-Length: 30", first).await;
    until_there_are(&kept, 1).await;
    assert_eq!(server.call("DELETE", &format!("{room}/members/{anna_id}"), Some(&owner), None).await.0, 204);
    sending.write_all(rest).await.unwrap();
    let answered = answer(sending).await;
    assert!(answered.starts_with("HTTP/1.1 401") && answered.contains("not-admitted"), "{answered}");
    assert_eq!(names(&kept), Vec::<String>::new());

    // A file that arrives whole, though slowly, is kept.
    let mut sending = begin_to_put(&server, ROOM, &hash, &owner, "Content-Length: 30", first).await;
    until_there_are(&kept, 1).await;
    sending.write_all(rest).await.unwrap();
    let answered = answer(sending).await;
    assert!(answered.starts_with("HTTP/1.1 201") && answered.contains(r#""stored":true"#), "{answered}");
    assert_eq!(names(&kept), vec![hash.clone()]);

    // One who asks before sending whether it is wanted is told at once that the file is there.
    let asking = "Content-Length: 30\r\nExpect: 100-continue";
    let answered = answer(begin_to_put(&server, ROOM, &hash, &owner, asking, b"").await).await;
    assert!(answered.starts_with("HTTP/1.1 200") && answered.contains(r#""stored":false"#), "{answered}");

    // A room that is taken off the server while a file arrives does not come back by it.
    let other = b"too late to be of any use".to_vec();
    let (first, rest) = other.split_at(10);
    let mut sending = begin_to_put(&server, ROOM, &hash_of(&other), &owner, "Content-Length: 25", first).await;
    until_there_are(&kept, 2).await;
    assert_eq!(server.call("DELETE", &room, Some(&owner), None).await.0, 204);
    assert!(!tmp.path().join("rooms").join(ROOM).exists());
    sending.write_all(rest).await.unwrap();
    let answered = answer(sending).await;
    assert!(answered.starts_with("HTTP/1.1 404") && answered.contains("no-room"), "{answered}");
    assert!(!tmp.path().join("rooms").join(ROOM).exists());
    server.stop().await;
}
