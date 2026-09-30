//! What the server answers: a handful of calls over HTTP for publishing,
//! inviting and joining, and the WebSocket over which a project is kept the
//! same for everyone. The files of a project, its figures, are sent and
//! fetched over HTTP, each by the name the project has for it.
//!
//! The token of an owner or a member is sent in the `Authorization` header and
//! never in an address, where it would end up in the logs of whatever stands
//! in front of the server. A WebSocket cannot be given headers by a browser, so
//! it is opened with a ticket: good for one connection, and for a minute.

use std::collections::HashMap;
use std::io;
use std::net::{IpAddr, SocketAddr};
use std::time::{Duration, Instant};

use axum::body::{Body, Bytes};
use axum::extract::ws::{CloseFrame, Message as Frame, WebSocket, WebSocketUpgrade};
use axum::extract::{ConnectInfo, Path, Query, State};
use axum::http::{HeaderMap, StatusCode, header};
use axum::response::{IntoResponse, Response};
use axum::routing::{delete, get, post};
use axum::{Json, Router};
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use tokio::io::AsyncReadExt;
use tokio::sync::mpsc;

use crate::files::{Begun, Kept, Refused};
use crate::registry::{self, Invitation, Refusal, Registry, RoomMeta, Who};
use crate::rooms::{EnterError, Outgoing};
use crate::{Shared, secrets};

/// The version of what is said between the application and the server. Raised
/// when an older application could no longer take part.
pub const PROTOCOL: u32 = 1;

const MINUTE: Duration = Duration::from_secs(60);

// ---------------------------------------------------------------------------
// Refusals, as they are told

#[derive(Debug)]
pub struct Failure {
    status: StatusCode,
    kind: &'static str,
    message: String,
}

impl Failure {
    fn new(status: StatusCode, kind: &'static str, message: impl Into<String>) -> Self {
        Failure { status, kind, message: message.into() }
    }

    fn no_token() -> Self {
        Failure::new(StatusCode::UNAUTHORIZED, "not-admitted", "no token was given")
    }

    fn too_many() -> Self {
        Failure::new(
            StatusCode::TOO_MANY_REQUESTS,
            "too-many",
            "too many attempts have come from this address; try again in a while",
        )
    }
}

impl IntoResponse for Failure {
    fn into_response(self) -> Response {
        (self.status, Json(serde_json::json!({ "error": self.kind, "message": self.message }))).into_response()
    }
}

impl From<Refusal> for Failure {
    fn from(refusal: Refusal) -> Self {
        let (status, kind) = match &refusal {
            Refusal::NoRoom => (StatusCode::NOT_FOUND, "no-room"),
            Refusal::NotAdmitted => (StatusCode::UNAUTHORIZED, "not-admitted"),
            Refusal::NotOwner => (StatusCode::FORBIDDEN, "not-owner"),
            Refusal::BadCode => (StatusCode::NOT_FOUND, "bad-code"),
            Refusal::Exists => (StatusCode::CONFLICT, "exists"),
            Refusal::Full => (StatusCode::SERVICE_UNAVAILABLE, "full"),
            Refusal::Invalid(_) => (StatusCode::BAD_REQUEST, "invalid"),
            Refusal::Io(e) => {
                tracing::error!(%e, "the disk could not be written");
                (StatusCode::INTERNAL_SERVER_ERROR, "server")
            }
        };
        Failure::new(status, kind, refusal.to_string())
    }
}

impl From<Refused> for Failure {
    fn from(refused: Refused) -> Self {
        let (status, kind) = match &refused {
            Refused::NoRoom => (StatusCode::NOT_FOUND, "no-room"),
            Refused::NoFile => (StatusCode::NOT_FOUND, "no-file"),
            Refused::BadName | Refused::NotAsNamed => (StatusCode::BAD_REQUEST, "invalid"),
            Refused::FileTooLarge(_) | Refused::RoomFull(_) => (StatusCode::PAYLOAD_TOO_LARGE, "too-large"),
            Refused::Io(e) => {
                tracing::error!(%e, "the disk could not be used for a file");
                (StatusCode::INTERNAL_SERVER_ERROR, "server")
            }
        };
        Failure::new(status, kind, refused.to_string())
    }
}

type Answer<T> = Result<T, Failure>;

// ---------------------------------------------------------------------------
// Keeping count of attempts

/// Counts what has come from each address, so that no one tries codes or
/// passwords without end, or fills the server with projects.
#[derive(Default)]
pub struct Limiter {
    seen: HashMap<(IpAddr, &'static str), Vec<Instant>>,
}

impl Limiter {
    /// Whether fewer than `most` of `what` have come from `from` within `within`.
    pub fn allows(&mut self, from: IpAddr, what: &'static str, most: usize, within: Duration) -> bool {
        match self.seen.get_mut(&(from, what)) {
            Some(times) => {
                times.retain(|t| t.elapsed() < within);
                times.len() < most
            }
            None => true,
        }
    }

    pub fn record(&mut self, from: IpAddr, what: &'static str) {
        if self.seen.len() > 10_000 {
            // Nothing is counted for longer than an hour.
            self.seen.retain(|_, times| times.last().is_some_and(|t| t.elapsed() < 60 * MINUTE));
        }
        self.seen.entry((from, what)).or_default().push(Instant::now());
    }
}

// ---------------------------------------------------------------------------
// Tickets

struct Ticket {
    room: String,
    member: Option<String>,
    expires: Instant,
}

/// Tickets that have been given out and not yet used.
#[derive(Default)]
pub struct Tickets {
    open: HashMap<String, Ticket>,
}

impl Tickets {
    const VALID: Duration = MINUTE;

    pub fn issue(&mut self, room: &str, who: &Who) -> String {
        let now = Instant::now();
        self.open.retain(|_, t| t.expires > now);
        let ticket = secrets::token();
        let member = match who {
            Who::Owner => None,
            Who::Member(id) => Some(id.clone()),
        };
        self.open.insert(secrets::hash(&ticket), Ticket { room: room.to_owned(), member, expires: now + Self::VALID });
        ticket
    }

    /// Takes the ticket, if it is good for the room. Returns the member it was
    /// given to, none standing for the owner.
    pub fn redeem(&mut self, room: &str, ticket: &str) -> Option<Option<String>> {
        let key = secrets::hash(ticket);
        let found = self.open.get(&key)?;
        if found.room != room {
            return None;
        }
        let found = self.open.remove(&key)?;
        (found.expires > Instant::now()).then_some(found.member)
    }
}

// ---------------------------------------------------------------------------
// Who is calling

fn bearer(headers: &HeaderMap) -> Answer<&str> {
    let value = headers.get(header::AUTHORIZATION).and_then(|v| v.to_str().ok()).ok_or_else(Failure::no_token)?;
    let (scheme, token) = value.trim().split_once(' ').ok_or_else(Failure::no_token)?;
    if !scheme.eq_ignore_ascii_case("bearer") || token.trim().is_empty() {
        return Err(Failure::no_token());
    }
    Ok(token.trim())
}

/// The address the call came from. Behind a proxy that is the last address of
/// `X-Forwarded-For`: the one the proxy itself saw, and the only one that
/// could not have been made up by the caller.
fn caller(server: &Shared, headers: &HeaderMap, addr: SocketAddr) -> IpAddr {
    if server.config.trust_proxy {
        let forwarded = headers
            .get_all("x-forwarded-for")
            .iter()
            .filter_map(|v| v.to_str().ok())
            .flat_map(|v| v.split(','))
            .filter_map(|a| a.trim().parse::<IpAddr>().ok())
            .next_back();
        if let Some(ip) = forwarded {
            return ip;
        }
    }
    addr.ip()
}

// ---------------------------------------------------------------------------
// What is told of a room

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct MemberView {
    id: String,
    name: String,
    joined: i64,
    last_seen: i64,
    present: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct InvitationView {
    id: String,
    /// The last four signs of the code, to tell it by.
    hint: String,
    /// The code: only in the answer that made it.
    #[serde(skip_serializing_if = "Option::is_none")]
    code: Option<String>,
    label: String,
    created: i64,
    expires: Option<i64>,
    uses_left: Option<u32>,
    used: u32,
    open: bool,
}

impl From<&Invitation> for InvitationView {
    fn from(i: &Invitation) -> Self {
        InvitationView {
            id: i.id.clone(),
            hint: i.hint.clone(),
            code: Some(i.code.clone()).filter(|c| !c.is_empty()),
            label: i.label.clone(),
            created: i.created,
            expires: i.expires,
            uses_left: i.uses_left,
            used: i.used,
            open: i.is_open(registry::now()),
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct RoomView {
    room: String,
    name: String,
    created: i64,
    /// `owner` or `member`.
    role: &'static str,
    /// The member who asks, if it is not the owner.
    you: Option<String>,
    owner_present: bool,
    members: Vec<MemberView>,
    /// Told to the owner only.
    invitations: Vec<InvitationView>,
}

fn view(meta: &RoomMeta, who: &Who, present: &[Option<String>]) -> RoomView {
    RoomView {
        room: meta.id.clone(),
        name: meta.name.clone(),
        created: meta.created,
        role: if *who == Who::Owner { "owner" } else { "member" },
        you: match who {
            Who::Owner => None,
            Who::Member(id) => Some(id.clone()),
        },
        owner_present: present.iter().any(Option::is_none),
        members: meta
            .members
            .iter()
            .map(|m| MemberView {
                id: m.id.clone(),
                name: m.name.clone(),
                joined: m.joined,
                last_seen: m.last_seen,
                present: present.iter().any(|p| p.as_deref() == Some(m.id.as_str())),
            })
            .collect(),
        invitations: match who {
            Who::Owner => meta.invitations.iter().map(InvitationView::from).collect(),
            Who::Member(_) => Vec::new(),
        },
    }
}

/// The room as it is told to the one whose token is given.
async fn told(server: &Shared, registry: &Registry, room: &str, who: &Who) -> Answer<Json<RoomView>> {
    let meta = registry.get(room).ok_or(Refusal::NoRoom)?;
    let present = server.rooms.present(room).await;
    Ok(Json(view(meta, who, &present)))
}

// ---------------------------------------------------------------------------
// The calls

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Info {
    name: &'static str,
    version: &'static str,
    protocol: u32,
    password_required: bool,
}

async fn info(State(server): State<Shared>) -> Json<Info> {
    Json(Info {
        name: "glaukopis-server",
        version: env!("CARGO_PKG_VERSION"),
        protocol: PROTOCOL,
        password_required: server.config.password.is_some(),
    })
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Publish {
    room: String,
    name: String,
    #[serde(default)]
    password: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Published {
    room: String,
    /// The owner's token. It is told this once.
    token: String,
}

async fn publish(
    State(server): State<Shared>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    headers: HeaderMap,
    Json(body): Json<Publish>,
) -> Answer<(StatusCode, Json<Published>)> {
    let from = caller(&server, &headers, addr);
    {
        let mut limiter = server.limiter.lock().await;
        if !limiter.allows(from, "refused", 10, 10 * MINUTE) || !limiter.allows(from, "published", 30, 60 * MINUTE) {
            return Err(Failure::too_many());
        }
        if let Some(required) = &server.config.password {
            let given = body.password.as_deref().unwrap_or("");
            if !secrets::same(&secrets::hash(given), &secrets::hash(required)) {
                limiter.record(from, "refused");
                return Err(Failure::new(
                    StatusCode::UNAUTHORIZED,
                    "password",
                    if given.is_empty() {
                        "this server asks for a password from those who publish projects on it"
                    } else {
                        "the password is not the one this server asks for"
                    },
                ));
            }
        }
        limiter.record(from, "published");
    }
    let token = server.registry.lock().await.create(&body.room, &body.name, server.config.max_rooms)?;
    tracing::info!(room = %body.room, "a project was published");
    Ok((StatusCode::CREATED, Json(Published { room: body.room, token })))
}

async fn room(State(server): State<Shared>, Path(room): Path<String>, headers: HeaderMap) -> Answer<Json<RoomView>> {
    let registry = server.registry.lock().await;
    let who = registry.admit(&room, bearer(&headers)?)?;
    told(&server, &registry, &room, &who).await
}

#[derive(Deserialize)]
struct Rename {
    name: String,
}

async fn rename(
    State(server): State<Shared>,
    Path(room): Path<String>,
    headers: HeaderMap,
    Json(body): Json<Rename>,
) -> Answer<Json<RoomView>> {
    let mut registry = server.registry.lock().await;
    registry.require_owner(&room, bearer(&headers)?)?;
    registry.rename(&room, &body.name)?;
    told(&server, &registry, &room, &Who::Owner).await
}

async fn remove(State(server): State<Shared>, Path(room): Path<String>, headers: HeaderMap) -> Answer<StatusCode> {
    // The list of rooms is held throughout, so that no one enters in between.
    let mut registry = server.registry.lock().await;
    registry.require_owner(&room, bearer(&headers)?)?;
    server.rooms.abandon(&room).await;
    registry.delete(&room)?;
    tracing::info!(%room, "a project was taken off the server");
    Ok(StatusCode::NO_CONTENT)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct TicketView {
    ticket: String,
    /// For how many seconds it is good.
    valid: u64,
}

async fn ticket(
    State(server): State<Shared>,
    Path(room): Path<String>,
    headers: HeaderMap,
) -> Answer<Json<TicketView>> {
    let who = server.registry.lock().await.admit(&room, bearer(&headers)?)?;
    let ticket = server.tickets.lock().await.issue(&room, &who);
    Ok(Json(TicketView { ticket, valid: Tickets::VALID.as_secs() }))
}

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct Invite {
    label: String,
    /// How many may come by the code. None, or nought, for any number.
    uses: Option<u32>,
    /// For how many hours the code is good. None, or nought, for as long as it is not withdrawn.
    hours: Option<u32>,
}

async fn invite(
    State(server): State<Shared>,
    Path(room): Path<String>,
    headers: HeaderMap,
    Json(body): Json<Invite>,
) -> Answer<(StatusCode, Json<InvitationView>)> {
    let mut registry = server.registry.lock().await;
    registry.require_owner(&room, bearer(&headers)?)?;
    let invitation = registry.invite(&room, &body.label, body.uses, body.hours)?;
    Ok((StatusCode::CREATED, Json(InvitationView::from(&invitation))))
}

async fn withdraw(
    State(server): State<Shared>,
    Path((room, invitation)): Path<(String, String)>,
    headers: HeaderMap,
) -> Answer<StatusCode> {
    let mut registry = server.registry.lock().await;
    registry.require_owner(&room, bearer(&headers)?)?;
    registry.withdraw(&room, &invitation)?;
    Ok(StatusCode::NO_CONTENT)
}

/// The owner removes a collaborator, or a collaborator leaves.
async fn remove_member(
    State(server): State<Shared>,
    Path((room, member)): Path<(String, String)>,
    headers: HeaderMap,
) -> Answer<StatusCode> {
    let mut registry = server.registry.lock().await;
    match registry.admit(&room, bearer(&headers)?)? {
        Who::Owner => {}
        Who::Member(me) if me == member => {}
        Who::Member(_) => return Err(Refusal::NotOwner.into()),
    }
    registry.remove_member(&room, &member)?;
    server.rooms.expel(&room, &member).await;
    Ok(StatusCode::NO_CONTENT)
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Join {
    code: String,
    #[serde(default)]
    name: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Joined {
    room: String,
    /// What the project is called.
    name: String,
    member: String,
    /// The member's token. It is told this once.
    token: String,
}

async fn join(
    State(server): State<Shared>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    headers: HeaderMap,
    Json(body): Json<Join>,
) -> Answer<Json<Joined>> {
    let from = caller(&server, &headers, addr);
    if !server.limiter.lock().await.allows(from, "refused", 10, 10 * MINUTE) {
        return Err(Failure::too_many());
    }
    let joined = server.registry.lock().await.join(&body.code, &body.name);
    match joined {
        Ok((meta, member, token)) => {
            tracing::info!(room = %meta.id, "a collaborator joined");
            Ok(Json(Joined { room: meta.id, name: meta.name, member, token }))
        }
        Err(refusal) => {
            if matches!(refusal, Refusal::BadCode) {
                server.limiter.lock().await.record(from, "refused");
            }
            Err(refusal.into())
        }
    }
}

// ---------------------------------------------------------------------------
// The files of a room

/// How much of a file is read from the disk at a time when it is sent.
const PIECE: usize = 64 << 10;

/// How many pieces of a file that arrives may wait to be written. When the
/// disk is slower than the network, the network is made to wait.
const UNWRITTEN: usize = 16;

/// Does what is done on the disk on a thread for such work, so that the
/// others who are served are not kept waiting for it.
async fn aside<T: Send + 'static>(work: impl FnOnce() -> Result<T, Refused> + Send + 'static) -> Answer<T> {
    let done = tokio::task::spawn_blocking(work).await.unwrap_or_else(|e| Err(Refused::Io(io::Error::other(e))));
    Ok(done?)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct FilesView {
    files: Vec<Kept>,
    /// The most one file may hold here, so that none is sent in vain.
    max_file_bytes: u64,
}

async fn files(State(server): State<Shared>, Path(room): Path<String>, headers: HeaderMap) -> Answer<Json<FilesView>> {
    server.registry.lock().await.admit(&room, bearer(&headers)?)?;
    let max_file_bytes = server.config.max_file_bytes;
    let files = aside(move || server.files.list(&room)).await?;
    Ok(Json(FilesView { files, max_file_bytes }))
}

async fn file(
    State(server): State<Shared>,
    Path((room, hash)): Path<(String, String)>,
    headers: HeaderMap,
) -> Answer<Response> {
    server.registry.lock().await.admit(&room, bearer(&headers)?)?;
    let (file, size) = aside(move || server.files.open(&room, &hash)).await?;
    // Sent as it is read, a piece at a time: no file is held in memory whole.
    let pieces = futures_util::stream::unfold(tokio::fs::File::from_std(file), |mut file| async move {
        let mut piece = vec![0; PIECE];
        match file.read(&mut piece).await {
            Ok(0) => None,
            Ok(read) => {
                piece.truncate(read);
                Some((Ok(Bytes::from(piece)), file))
            }
            Err(e) => Some((Err(e), file)),
        }
    });
    let told =
        [(header::CONTENT_TYPE, "application/octet-stream".to_owned()), (header::CONTENT_LENGTH, size.to_string())];
    Ok((told, Body::from_stream(pieces)).into_response())
}

#[derive(Serialize)]
struct FileStored {
    hash: String,
    size: u64,
    /// Whether it was stored now. If not, the room had it already.
    stored: bool,
}

impl FileStored {
    fn answer(kept: Kept, stored: bool) -> (StatusCode, Json<FileStored>) {
        let status = if stored { StatusCode::CREATED } else { StatusCode::OK };
        (status, Json(FileStored { hash: kept.hash, size: kept.size, stored }))
    }
}

/// Takes in a file of a room.
///
/// What is sent is taken as it comes, and not by way of axum, whose limit on
/// what it takes in is for what it collects in memory. The limits here are
/// those of the store, which counts what it writes and takes no more when one
/// of them is passed.
async fn store(
    State(server): State<Shared>,
    Path((room, hash)): Path<(String, String)>,
    headers: HeaderMap,
    body: Body,
) -> Answer<(StatusCode, Json<FileStored>)> {
    let token = bearer(&headers)?;
    let announced = headers.get(header::CONTENT_LENGTH).and_then(|v| v.to_str().ok()).and_then(|v| v.parse().ok());
    let begun = {
        // The list of rooms is held while the file is begun, and again while
        // it is given its name, so that the room is not taken off the server
        // meanwhile. It is not held while the file arrives, which may take long.
        let registry = server.registry.lock().await;
        registry.admit(&room, token)?;
        let (server, room, hash) = (server.clone(), room.clone(), hash.clone());
        aside(move || server.files.begin(&room, &hash, announced)).await?
    };
    let mut body = body.into_data_stream();
    let mut arriving = match begun {
        Begun::Had(kept) => {
            // What is sent is let come, and let go: an answer given to one
            // who is still sending may never be heard. No more is let come
            // than a file may hold, and nothing from one who waits to be
            // told whether to send.
            let mut came = 0;
            while !headers.contains_key(header::EXPECT)
                && came <= server.config.max_file_bytes
                && let Some(Ok(piece)) = body.next().await
            {
                came += piece.len() as u64;
            }
            return Ok(FileStored::answer(kept, false));
        }
        Begun::Arriving(arriving) => arriving,
    };

    // Counting and writing are done on a thread of their own, which is handed
    // the pieces as they come.
    let (coming, mut came) = mpsc::channel::<Bytes>(UNWRITTEN);
    let writing = tokio::task::spawn_blocking(move || {
        while let Some(piece) = came.blocking_recv() {
            arriving.take(&piece)?;
        }
        Ok(arriving)
    });
    let mut whole = true;
    loop {
        let piece = tokio::select! {
            // The one who writes has given up, and tells why below. No more
            // is read, and what may be on its way is not waited for.
            _ = coming.closed() => break,
            piece = body.next() => piece,
        };
        match piece {
            Some(Ok(piece)) => {
                if coming.send(piece).await.is_err() {
                    break;
                }
            }
            Some(Err(_)) => {
                whole = false;
                break;
            }
            None => break,
        }
    }
    drop(coming);
    let arriving = writing.await.unwrap_or_else(|e| Err(Refused::Io(io::Error::other(e))))?;
    if !whole {
        return Err(Failure::new(StatusCode::BAD_REQUEST, "invalid", "the file did not arrive whole"));
    }

    let registry = server.registry.lock().await;
    // The room may be gone since, or the one who sends no longer among its collaborators.
    registry.admit(&room, token)?;
    let (kept, stored) = {
        let server = server.clone();
        aside(move || server.files.keep(arriving)).await?
    };
    drop(registry);
    if stored {
        tracing::debug!(%room, hash = %kept.hash, size = kept.size, "a file was stored");
    }
    Ok(FileStored::answer(kept, stored))
}

// ---------------------------------------------------------------------------
// The WebSocket

/// Codes for closing that are the server's own, besides those of the rooms.
const CROWDED: u16 = 4005;
const UNAVAILABLE: u16 = 1011;
const NOT_ADMITTED: u16 = 4001;

/// How long the server waits for one frame to be taken.
const SENDING: Duration = Duration::from_secs(20);
/// How often the server asks whether the other side is there, and how long it
/// goes on without an answer.
const ASKING: Duration = Duration::from_secs(25);
const SILENT: Duration = Duration::from_secs(70);

async fn socket(
    State(server): State<Shared>,
    Path(room): Path<String>,
    Query(query): Query<HashMap<String, String>>,
    upgrade: WebSocketUpgrade,
) -> Response {
    let Some(ticket) = query.get("ticket") else {
        return Failure::new(StatusCode::UNAUTHORIZED, "not-admitted", "no ticket was given").into_response();
    };
    let Some(member) = server.tickets.lock().await.redeem(&room, ticket) else {
        return Failure::new(
            StatusCode::UNAUTHORIZED,
            "not-admitted",
            "the ticket is not valid: it may have been used, or it is too old",
        )
        .into_response();
    };
    // A message may hold no more than the document may: the first may bring all of it.
    upgrade
        .max_message_size(server.config.max_document_bytes)
        .on_upgrade(move |socket| attend(server, room, member, socket))
}

fn still_admitted(registry: &Registry, room: &str, member: &Option<String>) -> bool {
    match (registry.get(room), member) {
        (None, _) => false,
        (Some(_), None) => true,
        (Some(meta), Some(id)) => meta.members.iter().any(|m| m.id == *id),
    }
}

async fn end(mut socket: WebSocket, code: u16, reason: &'static str) {
    let _ = socket.send(Frame::Close(Some(CloseFrame { code, reason: reason.into() }))).await;
}

async fn attend(server: Shared, id: String, member: Option<String>, socket: WebSocket) {
    let entered = {
        // Held while entering, so that no one enters a room that is being
        // taken off the server, or after having been removed from it.
        let mut registry = server.registry.lock().await;
        if !still_admitted(&registry, &id, &member) {
            drop(registry);
            return end(socket, NOT_ADMITTED, "you are no longer among the collaborators").await;
        }
        if let Some(member) = &member {
            registry.seen(&id, member);
        }
        server.rooms.enter(&id, member).await
    };
    let (room, mut entered) = match entered {
        Ok(entered) => entered,
        Err(EnterError::Crowded) => return end(socket, CROWDED, "too many have the project open").await,
        Err(EnterError::Io(e)) => {
            tracing::error!(room = %id, %e, "a room could not be opened");
            return end(socket, UNAVAILABLE, "the server could not read the project").await;
        }
    };
    let peer = entered.peer;
    let (mut sink, mut stream) = socket.split();
    let mut asking = tokio::time::interval(ASKING);
    let mut heard = Instant::now();

    loop {
        let frame = tokio::select! {
            out = entered.incoming.recv() => match out {
                Some(Outgoing::Message(bytes)) => Frame::Binary(bytes),
                Some(Outgoing::Close(code, reason)) => {
                    let close = Frame::Close(Some(CloseFrame { code, reason: reason.into() }));
                    let _ = tokio::time::timeout(SENDING, sink.send(close)).await;
                    break;
                }
                // Let go by the room, with no room left to say why.
                None => break,
            },
            frame = stream.next() => match frame {
                Some(Ok(Frame::Binary(data))) => {
                    heard = Instant::now();
                    room.receive(peer, &data);
                    continue;
                }
                Some(Ok(Frame::Ping(_) | Frame::Pong(_) | Frame::Text(_))) => {
                    heard = Instant::now();
                    continue;
                }
                Some(Ok(Frame::Close(_))) | Some(Err(_)) | None => break,
            },
            _ = asking.tick() => {
                if heard.elapsed() > SILENT {
                    break;
                }
                Frame::Ping(Bytes::new())
            }
        };
        // One who does not take what is sent must not hold the room up.
        match tokio::time::timeout(SENDING, sink.send(frame)).await {
            Ok(Ok(())) => {}
            _ => break,
        }
    }
    room.leave(peer);
}

// ---------------------------------------------------------------------------

pub fn router(server: Shared) -> Router {
    Router::new()
        .route("/api/info", get(info))
        .route("/api/rooms", post(publish))
        .route("/api/rooms/{room}", get(room).patch(rename).delete(remove))
        .route("/api/rooms/{room}/tickets", post(ticket))
        .route("/api/rooms/{room}/invitations", post(invite))
        .route("/api/rooms/{room}/invitations/{invitation}", delete(withdraw))
        .route("/api/rooms/{room}/members/{member}", delete(remove_member))
        .route("/api/rooms/{room}/files", get(files))
        .route("/api/rooms/{room}/files/{hash}", get(file).put(store))
        .route("/api/join", post(join))
        .route("/ws/{room}", get(socket))
        .with_state(server)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn attempts_are_counted_for_each_address() {
        let mut limiter = Limiter::default();
        let a: IpAddr = "192.0.2.1".parse().unwrap();
        let b: IpAddr = "192.0.2.2".parse().unwrap();
        for _ in 0..3 {
            assert!(limiter.allows(a, "refused", 3, MINUTE));
            limiter.record(a, "refused");
        }
        assert!(!limiter.allows(a, "refused", 3, MINUTE));
        assert!(limiter.allows(b, "refused", 3, MINUTE));
        assert!(limiter.allows(a, "published", 3, MINUTE));
        assert!(limiter.allows(a, "refused", 3, Duration::ZERO), "what is old is not counted");
    }

    #[test]
    fn a_ticket_is_good_once_and_for_its_room() {
        let mut tickets = Tickets::default();
        let owner = tickets.issue("a", &Who::Owner);
        let member = tickets.issue("a", &Who::Member("m".into()));
        assert_eq!(tickets.redeem("b", &owner), None);
        assert_eq!(tickets.redeem("a", &owner), Some(None));
        assert_eq!(tickets.redeem("a", &owner), None, "used");
        assert_eq!(tickets.redeem("a", &member), Some(Some("m".into())));
        assert_eq!(tickets.redeem("a", "nonsense"), None);

        let old = tickets.issue("a", &Who::Owner);
        tickets.open.get_mut(&secrets::hash(&old)).unwrap().expires = Instant::now() - MINUTE;
        assert_eq!(tickets.redeem("a", &old), None);
    }
}
