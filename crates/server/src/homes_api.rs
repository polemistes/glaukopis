//! The calls of the homes, by which a writer's computers keep the same
//! things (see `homes.rs`): a home made and joined, its computers and codes,
//! the list of its documents, the exchange of one document, and its files.
//!
//! The token of a computer is sent as a room's is, in the `Authorization`
//! header. Every call but making and joining a home asks for it, and notes
//! that the computer was seen.

use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;

use axum::body::{Body, Bytes};
use axum::extract::{ConnectInfo, Path, Query, State};
use axum::http::{HeaderMap, StatusCode, header};
use axum::response::{IntoResponse, Response};
use axum::routing::{delete, get, patch, post};
use axum::{Json, Router};
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use yrs::StateVector;
use yrs::updates::decoder::Decode;

use crate::api::{
    Answer, Failure, FileStored, FilesView, MINUTE, NOT_WHOLE, Received, announced, aside, bearer, caller, may_publish,
    receive, sent,
};
use crate::homes::{HomeMeta, HomeRefusal, MOST_DOCUMENTS, doc_dir, valid_kind};
use crate::registry::{now, valid_room_id};
use crate::rooms::{EMPTY_DIGEST, EnterError, Exchange, Exchanged, Unexchanged};
use crate::{Shared, secrets};

// ---------------------------------------------------------------------------
// Refusals, as they are told

// The sentences the calls of homes say of their own, besides the refusals of
// the homes and of the files; the test of the client's words in `api.rs`
// asks the client for its words for each. A new sentence goes into `SENTENCES`.
const BAD_KIND: &str = "the kind of a document is one to sixteen small letters";
const BAD_DOCUMENT: &str = "the id of the document is not one the server can use";
const MANY_DOCUMENTS: &str = "the home keeps as many documents as it may";
const NOT_AN_EXCHANGE: &str = "what was sent is not an exchange as this server reads it";
const UNREADABLE: &str = "a change that was sent could not be read";
const LATER: &str = "the document was written in by a later version of Glaukopis";
const TOO_LARGE: &str = "the document would be larger than this server keeps";
const UNAVAILABLE: &str = "the server could not read the document";

/// Every sentence of this file, with the kind and the status it is sent with.
#[cfg(test)]
pub(crate) const SENTENCES: [(&str, StatusCode, &str); 8] = [
    ("invalid", StatusCode::BAD_REQUEST, BAD_KIND),
    ("invalid", StatusCode::BAD_REQUEST, BAD_DOCUMENT),
    ("full", StatusCode::INSUFFICIENT_STORAGE, MANY_DOCUMENTS),
    ("invalid", StatusCode::BAD_REQUEST, NOT_AN_EXCHANGE),
    ("invalid", StatusCode::BAD_REQUEST, UNREADABLE),
    ("later", StatusCode::CONFLICT, LATER),
    ("too-large", StatusCode::PAYLOAD_TOO_LARGE, TOO_LARGE),
    ("server", StatusCode::INTERNAL_SERVER_ERROR, UNAVAILABLE),
];

fn not_an_exchange() -> Failure {
    Failure::new(StatusCode::BAD_REQUEST, "invalid", NOT_AN_EXCHANGE)
}

fn too_large() -> Failure {
    Failure::new(StatusCode::PAYLOAD_TOO_LARGE, "too-large", TOO_LARGE)
}

impl From<Unexchanged> for Failure {
    fn from(refused: Unexchanged) -> Self {
        match refused {
            Unexchanged::Later => Failure::new(StatusCode::CONFLICT, "later", LATER),
            Unexchanged::TooLarge => too_large(),
            Unexchanged::Unreadable => Failure::new(StatusCode::BAD_REQUEST, "invalid", UNREADABLE),
        }
    }
}

// ---------------------------------------------------------------------------
// Who is calling

/// The computer whose token is given, of the home; noted as seen.
async fn admitted(server: &Shared, home: &str, headers: &HeaderMap) -> Answer<String> {
    let token = bearer(headers)?;
    let mut homes = server.homes.lock().await;
    let device = homes.admit(home, token)?;
    homes.seen(home, &device);
    Ok(device)
}

/// A document's kind and id, where they can be.
fn document(kind: &str, id: &str) -> Answer<()> {
    if !valid_kind(kind) {
        return Err(Failure::new(StatusCode::BAD_REQUEST, "invalid", BAD_KIND));
    }
    if !valid_room_id(id) {
        return Err(Failure::new(StatusCode::BAD_REQUEST, "invalid", BAD_DOCUMENT));
    }
    Ok(())
}

/// The key a document of a home is known by among the rooms of the homes.
fn key(home: &str, kind: &str, id: &str) -> String {
    format!("{home}/{kind}/{id}")
}

// ---------------------------------------------------------------------------
// The home, its computers and its codes

#[derive(Deserialize)]
struct MakeHome {
    #[serde(default)]
    name: String,
    #[serde(default)]
    password: Option<String>,
}

#[derive(Serialize)]
struct AdmittedView {
    home: String,
    device: String,
    /// The computer's token. It is told this once.
    token: String,
}

async fn make(
    State(server): State<Shared>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    headers: HeaderMap,
    Json(body): Json<MakeHome>,
) -> Answer<(StatusCode, Json<AdmittedView>)> {
    may_publish(&server, caller(&server, &headers, addr), body.password.as_deref()).await?;
    let admitted = server.homes.lock().await.create(&body.name, server.config.max_homes)?;
    tracing::info!(home = %admitted.home, "a home was made");
    let view = AdmittedView { home: admitted.home, device: admitted.device, token: admitted.token };
    Ok((StatusCode::CREATED, Json(view)))
}

#[derive(Deserialize)]
struct JoinHome {
    code: String,
    #[serde(default)]
    name: String,
}

async fn join(
    State(server): State<Shared>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    headers: HeaderMap,
    Json(body): Json<JoinHome>,
) -> Answer<Json<AdmittedView>> {
    let from = caller(&server, &headers, addr);
    if !server.limiter.lock().await.allows(from, "refused", 10, 10 * MINUTE) {
        return Err(Failure::too_many());
    }
    let joined = server.homes.lock().await.join(&body.code, &body.name);
    match joined {
        Ok(admitted) => {
            tracing::info!(home = %admitted.home, "a computer joined a home");
            Ok(Json(AdmittedView { home: admitted.home, device: admitted.device, token: admitted.token }))
        }
        Err(refusal) => {
            if matches!(refusal, HomeRefusal::BadCode) {
                server.limiter.lock().await.record(from, "refused");
            }
            Err(refusal.into())
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DeviceView {
    id: String,
    name: String,
    joined: i64,
    last_seen: i64,
    you: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CodeView {
    id: String,
    created: i64,
    expires: i64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct HomeView {
    home: String,
    created: i64,
    /// The computer that asks.
    you: String,
    devices: Vec<DeviceView>,
    /// The codes that are open.
    codes: Vec<CodeView>,
    used_bytes: u64,
    max_file_bytes: u64,
    max_home_bytes: u64,
}

/// The home as it is told to one of its computers.
async fn told(server: &Shared, meta: HomeMeta, you: String) -> Answer<Json<HomeView>> {
    let at = now();
    let used_bytes = {
        let (server, home) = (server.clone(), meta.id.clone());
        aside(move || server.home_files.used(&home)).await?
    };
    Ok(Json(HomeView {
        home: meta.id,
        created: meta.created,
        devices: meta
            .devices
            .into_iter()
            .map(|d| DeviceView { you: d.id == you, id: d.id, name: d.name, joined: d.joined, last_seen: d.last_seen })
            .collect(),
        codes: meta
            .codes
            .into_iter()
            .filter(|c| c.is_open(at))
            .map(|c| CodeView { id: c.id, created: c.created, expires: c.expires })
            .collect(),
        you,
        used_bytes,
        max_file_bytes: server.home_files.max_file_bytes(),
        max_home_bytes: server.home_files.max_together_bytes(),
    }))
}

async fn home(State(server): State<Shared>, Path(home): Path<String>, headers: HeaderMap) -> Answer<Json<HomeView>> {
    let you = admitted(&server, &home, &headers).await?;
    let meta = server.homes.lock().await.get(&home).cloned().ok_or(HomeRefusal::NoHome)?;
    told(&server, meta, you).await
}

#[derive(Serialize)]
struct CodeMade {
    id: String,
    /// The code: told this once.
    code: String,
    expires: i64,
}

async fn make_code(
    State(server): State<Shared>,
    Path(home): Path<String>,
    headers: HeaderMap,
) -> Answer<(StatusCode, Json<CodeMade>)> {
    admitted(&server, &home, &headers).await?;
    let (kept, code) = server.homes.lock().await.code(&home)?;
    Ok((StatusCode::CREATED, Json(CodeMade { id: kept.id, code, expires: kept.expires })))
}

async fn withdraw_code(
    State(server): State<Shared>,
    Path((home, code)): Path<(String, String)>,
    headers: HeaderMap,
) -> Answer<StatusCode> {
    admitted(&server, &home, &headers).await?;
    server.homes.lock().await.withdraw(&home, &code)?;
    Ok(StatusCode::NO_CONTENT)
}

#[derive(Deserialize)]
struct Rename {
    name: String,
}

async fn rename_device(
    State(server): State<Shared>,
    Path((home, device)): Path<(String, String)>,
    headers: HeaderMap,
    Json(body): Json<Rename>,
) -> Answer<Json<HomeView>> {
    let you = admitted(&server, &home, &headers).await?;
    let meta = {
        let mut homes = server.homes.lock().await;
        homes.rename(&home, &device, &body.name)?;
        homes.get(&home).cloned().ok_or(HomeRefusal::NoHome)?
    };
    told(&server, meta, you).await
}

/// Any computer of a home removes any, itself too. With the last, the home
/// goes, and everything it kept.
async fn remove_device(
    State(server): State<Shared>,
    Path((home, device)): Path<(String, String)>,
    headers: HeaderMap,
) -> Answer<StatusCode> {
    let token = bearer(&headers)?;
    // The list of homes is held throughout, so that no one enters in between.
    let mut homes = server.homes.lock().await;
    homes.admit(&home, token)?;
    if homes.remove(&home, &device)? {
        server.home_docs.abandon_under(&format!("{home}/")).await;
        server.listing.forget_home(&home);
        homes.delete(&home)?;
        tracing::info!(%home, "the last computer left a home, which was taken off the server");
    }
    Ok(StatusCode::NO_CONTENT)
}

// ---------------------------------------------------------------------------
// The documents

#[derive(Serialize)]
#[serde(untagged)]
enum DocsView {
    Same { stamp: String, same: bool },
    Docs { stamp: String, docs: Vec<crate::homes::Listed> },
}

async fn docs(
    State(server): State<Shared>,
    Path(home): Path<String>,
    Query(query): Query<HashMap<String, String>>,
    headers: HeaderMap,
) -> Answer<Json<DocsView>> {
    admitted(&server, &home, &headers).await?;
    let (stamp, docs) = server.listing.list(&home);
    if query.get("seen").is_some_and(|seen| *seen == stamp) {
        return Ok(Json(DocsView::Same { stamp, same: true }));
    }
    Ok(Json(DocsView::Docs { stamp, docs }))
}

/// What an exchange's head says.
#[derive(Deserialize)]
struct Head {
    #[serde(default)]
    seen: Option<String>,
    /// A state vector, in hex.
    #[serde(default)]
    since: Option<String>,
    /// Whether the writer wrote nothing of what is brought: see `rooms::Change`.
    #[serde(default)]
    quiet: bool,
}

/// The most the head of an exchange may hold.
const MOST_HEAD: usize = 64 << 10;

/// Reads an exchange as it is sent: the length of a head, the head, the
/// number of changes, and each change with its length before it; numbers
/// of 32 bits, little-endian.
fn read_exchange(bytes: &[u8]) -> Answer<(Head, Vec<Vec<u8>>)> {
    /// The next `length` bytes; `rest` is left with what follows them.
    fn take<'a>(rest: &mut &'a [u8], length: usize) -> Answer<&'a [u8]> {
        if length > rest.len() {
            return Err(not_an_exchange());
        }
        let (taken, after) = rest.split_at(length);
        *rest = after;
        Ok(taken)
    }
    fn number(rest: &mut &[u8]) -> Answer<usize> {
        let four = take(rest, 4)?;
        Ok(u32::from_le_bytes(four.try_into().expect("four bytes")) as usize)
    }

    let mut rest = bytes;
    let head_length = number(&mut rest)?;
    if head_length > MOST_HEAD {
        return Err(not_an_exchange());
    }
    let head: Head = serde_json::from_slice(take(&mut rest, head_length)?).map_err(|_| not_an_exchange())?;
    let count = number(&mut rest)?;
    let mut changes = Vec::with_capacity(count.min(1024));
    for _ in 0..count {
        let length = number(&mut rest)?;
        changes.push(take(&mut rest, length)?.to_vec());
    }
    if !rest.is_empty() {
        return Err(not_an_exchange());
    }
    Ok((head, changes))
}

/// The answer of an exchange as it is sent: the length of a head, the head,
/// then the news, to the end.
fn exchange_answer(done: Exchanged) -> Response {
    let head = serde_json::json!({
        "digest": done.digest,
        "now": secrets::hex(&done.now),
        "news": done.news.is_some(),
        "apart": done.apart,
    });
    let head = serde_json::to_vec(&head).expect("JSON is made of what is here");
    let news = done.news.unwrap_or_default();
    let mut answer = Vec::with_capacity(4 + head.len() + news.len());
    answer.extend_from_slice(&(head.len() as u32).to_le_bytes());
    answer.extend_from_slice(&head);
    answer.extend_from_slice(&news);
    ([(header::CONTENT_TYPE, "application/octet-stream")], answer).into_response()
}

/// The exchange of one document: see the plan, and `Room::exchange`.
async fn exchange(
    State(server): State<Shared>,
    Path((home, kind, id)): Path<(String, String, String)>,
    Query(query): Query<HashMap<String, String>>,
    headers: HeaderMap,
    body: Body,
) -> Answer<Response> {
    document(&kind, &id)?;
    let device = admitted(&server, &home, &headers).await?;
    let token = bearer(&headers)?;
    // The form of the texts the computer knows; the first where it says none.
    let form = query.get("form").and_then(|f| f.parse::<u32>().ok()).unwrap_or(1).max(1);

    // What is sent may hold all a document may, and a megabyte.
    let most = server.config.max_document_bytes.saturating_add(1 << 20);
    if announced(&headers).is_some_and(|length| length > most as u64) {
        return Err(too_large());
    }
    let mut sent = Vec::new();
    let mut body = body.into_data_stream();
    while let Some(piece) = body.next().await {
        let piece: Bytes = piece.map_err(|_| Failure::new(StatusCode::BAD_REQUEST, "invalid", NOT_WHOLE))?;
        if sent.len() + piece.len() > most {
            return Err(too_large());
        }
        sent.extend_from_slice(&piece);
    }
    let (head, changes) = read_exchange(&sent)?;
    drop(sent);
    let since = match head.since.as_deref() {
        None => None,
        Some(hex) => {
            let bytes = secrets::unhex(hex).ok_or_else(not_an_exchange)?;
            Some(StateVector::decode_v1(&bytes).map_err(|_| not_an_exchange())?)
        }
    };
    if !changes.is_empty() && !server.listing.has(&home, &kind, &id) && server.listing.count(&home) >= MOST_DOCUMENTS {
        return Err(Failure::new(StatusCode::INSUFFICIENT_STORAGE, "full", MANY_DOCUMENTS));
    }
    let asked = Arc::new(Exchange { device, seen: head.seen, since, changes, form, quiet: head.quiet });
    let key = key(&home, &kind, &id);
    let dir = doc_dir(&server.config.data, &home, &kind, &id);

    let done = loop {
        let room = {
            // Held while the room is found, so that no one finds a room of a
            // home that is being taken off the server, or after leaving it.
            let homes = server.homes.lock().await;
            homes.admit(&home, token)?;
            match server.home_docs.open_in(&key, dir.clone()).await {
                Ok(room) => room,
                Err(EnterError::Io(e)) => {
                    tracing::error!(document = %key, %e, "a document of a home could not be opened");
                    return Err(Failure::new(StatusCode::INTERNAL_SERVER_ERROR, "server", UNAVAILABLE));
                }
                Err(_) => return Err(Failure::new(StatusCode::INTERNAL_SERVER_ERROR, "server", UNAVAILABLE)),
            }
        };
        let (server, asked, home, kind, id) = (server.clone(), asked.clone(), home.clone(), kind.clone(), id.clone());
        let done = room
            .aside(move |room| {
                room.exchange(&asked, |done| {
                    // What holds nothing is not listed: it is not kept.
                    if done.digest != EMPTY_DIGEST {
                        server.listing.note(&home, &kind, &id, &done.digest, done.bytes);
                    }
                })
            })
            .await;
        match done {
            Some(done) => break done?,
            // Put away, or taken off the server, after it was found.
            None => continue,
        }
    };
    Ok(exchange_answer(done))
}

async fn delete_doc(
    State(server): State<Shared>,
    Path((home, kind, id)): Path<(String, String, String)>,
    headers: HeaderMap,
) -> Answer<StatusCode> {
    document(&kind, &id)?;
    let token = bearer(&headers)?;
    // The list of homes is held throughout, so that the document is not found meanwhile.
    let mut homes = server.homes.lock().await;
    let device = homes.admit(&home, token)?;
    homes.seen(&home, &device);
    server.home_docs.abandon(&key(&home, &kind, &id)).await;
    server.listing.forget(&home, &kind, &id);
    let dir = doc_dir(&server.config.data, &home, &kind, &id);
    aside(move || match std::fs::remove_dir_all(&dir) {
        Ok(()) => Ok(()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(e.into()),
    })
    .await?;
    drop(homes);
    Ok(StatusCode::NO_CONTENT)
}

// ---------------------------------------------------------------------------
// The files

async fn files(State(server): State<Shared>, Path(home): Path<String>, headers: HeaderMap) -> Answer<Json<FilesView>> {
    admitted(&server, &home, &headers).await?;
    let max_file_bytes = server.home_files.max_file_bytes();
    let files = aside(move || server.home_files.list(&home)).await?;
    Ok(Json(FilesView { files, max_file_bytes }))
}

async fn file(
    State(server): State<Shared>,
    Path((home, hash)): Path<(String, String)>,
    headers: HeaderMap,
) -> Answer<Response> {
    admitted(&server, &home, &headers).await?;
    let (file, size) = aside(move || server.home_files.open(&home, &hash)).await?;
    Ok(sent(file, size))
}

async fn store(
    State(server): State<Shared>,
    Path((home, hash)): Path<(String, String)>,
    headers: HeaderMap,
    body: Body,
) -> Answer<(StatusCode, Json<FileStored>)> {
    let token = bearer(&headers)?;
    let announced = announced(&headers);
    let begun = {
        // Held while the file is begun, and again while it is given its
        // name, so that the home is not taken off the server meanwhile; not
        // while it arrives, which may take long.
        let mut homes = server.homes.lock().await;
        let device = homes.admit(&home, token)?;
        homes.seen(&home, &device);
        let (server, home, hash) = (server.clone(), home.clone(), hash.clone());
        aside(move || server.home_files.begin(&home, &hash, announced)).await?
    };
    let arriving = match receive(begun, &headers, body, server.home_files.max_file_bytes()).await? {
        Received::Had(kept) => return Ok(FileStored::answer(kept, false)),
        Received::Arrived(arriving) => arriving,
    };
    let homes = server.homes.lock().await;
    // The home may be gone since, or the computer no longer in it.
    homes.admit(&home, token)?;
    let (kept, stored) = {
        let server = server.clone();
        aside(move || server.home_files.keep(arriving)).await?
    };
    drop(homes);
    Ok(FileStored::answer(kept, stored))
}

async fn remove_file(
    State(server): State<Shared>,
    Path((home, hash)): Path<(String, String)>,
    headers: HeaderMap,
) -> Answer<StatusCode> {
    let token = bearer(&headers)?;
    let mut homes = server.homes.lock().await;
    let device = homes.admit(&home, token)?;
    homes.seen(&home, &device);
    let server = server.clone();
    aside(move || server.home_files.remove(&home, &hash)).await?;
    drop(homes);
    Ok(StatusCode::NO_CONTENT)
}

// ---------------------------------------------------------------------------

pub fn routes() -> Router<Shared> {
    Router::new()
        .route("/api/homes", post(make))
        .route("/api/homes/join", post(join))
        .route("/api/homes/{home}", get(home))
        .route("/api/homes/{home}/codes", post(make_code))
        .route("/api/homes/{home}/codes/{code}", delete(withdraw_code))
        .route("/api/homes/{home}/devices/{device}", patch(rename_device).delete(remove_device))
        .route("/api/homes/{home}/docs", get(docs))
        .route("/api/homes/{home}/docs/{kind}/{id}", post(exchange).delete(delete_doc))
        .route("/api/homes/{home}/files", get(files))
        .route("/api/homes/{home}/files/{hash}", get(file).put(store).delete(remove_file))
}

#[cfg(test)]
mod tests {
    use super::*;

    /// An exchange as the application sends it.
    fn exchange_of(head: &str, changes: &[&[u8]]) -> Vec<u8> {
        let mut sent = (head.len() as u32).to_le_bytes().to_vec();
        sent.extend_from_slice(head.as_bytes());
        sent.extend_from_slice(&(changes.len() as u32).to_le_bytes());
        for change in changes {
            sent.extend_from_slice(&(change.len() as u32).to_le_bytes());
            sent.extend_from_slice(change);
        }
        sent
    }

    #[test]
    fn an_exchange_is_read_as_it_is_sent_and_nothing_else() {
        let (head, changes) = read_exchange(&exchange_of(r#"{"seen":"d","since":"00"}"#, &[b"ab", b"", b"c"])).unwrap();
        assert_eq!((head.seen.as_deref(), head.since.as_deref()), (Some("d"), Some("00")));
        assert_eq!(changes, vec![b"ab".to_vec(), vec![], b"c".to_vec()]);
        let (head, changes) = read_exchange(&exchange_of(r#"{"seen":null,"since":null}"#, &[])).unwrap();
        assert!(head.seen.is_none() && head.since.is_none() && changes.is_empty());

        let whole = exchange_of("{}", &[b"abc"]);
        for cut in 0..whole.len() {
            assert!(read_exchange(&whole[..cut]).is_err(), "cut at {cut}");
        }
        let mut more = whole.clone();
        more.push(0);
        assert!(read_exchange(&more).is_err(), "nothing may follow");
        assert!(read_exchange(&exchange_of("not json", &[])).is_err());
        let mut long = (u32::MAX).to_le_bytes().to_vec();
        long.extend_from_slice(b"{}");
        assert!(read_exchange(&long).is_err());
    }
}
