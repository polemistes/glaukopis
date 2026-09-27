//! The server as it is met from outside: over HTTP and WebSocket, on a port
//! of its own, with a directory that is thrown away.

use std::net::SocketAddr;
use std::path::Path;
use std::time::Duration;

use futures_util::{SinkExt, StreamExt};
use glaukopis_server::{Config, Server, serve};
use serde_json::{Value, json};
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

struct Running {
    addr: SocketAddr,
    stop: Option<oneshot::Sender<()>>,
    done: tokio::task::JoinHandle<std::io::Result<()>>,
}

impl Running {
    async fn start(data: &Path, password: Option<&str>) -> Running {
        let mut config = Config::new(data);
        config.password = password.map(str::to_owned);
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

    async fn ticket(&self, token: &str) -> String {
        let (status, body) = self.call("POST", &format!("/api/rooms/{ROOM}/tickets"), Some(token), None).await;
        assert_eq!(status, 200, "{body}");
        body["ticket"].as_str().unwrap().to_owned()
    }
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
