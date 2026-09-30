//! The rooms that are open: the state of each project, those who have it
//! open, and the passing of changes between them.
//!
//! A room is read from disk when the first one enters and put away a while
//! after the last one has left. What the server holds is written every few
//! seconds while it changes. Should the server stop between two writings,
//! nothing is lost as long as one of those who were present comes back: the
//! protocol has each side tell the other what it lacks.

use std::collections::{HashMap, HashSet};
use std::io;
use std::path::PathBuf;
use std::sync::{Arc, Mutex as Guarded, MutexGuard};
use std::time::{Duration, Instant};

use axum::body::Bytes;
use tokio::sync::{Mutex, mpsc};
use yrs::encoding::read::Cursor;
use yrs::sync::{Awareness, Message, MessageReader, SyncMessage};
use yrs::updates::decoder::{Decode, DecoderV1};
use yrs::updates::encoder::{Encode, Encoder, EncoderV1};
use yrs::{ClientID, Doc, ReadTxn, StateVector, Transact, Update};

use crate::registry::room_dir;

/// How many may have one project open at a time.
pub const MOST_PRESENT: usize = 64;

/// How much may wait to be sent to one who is slow to receive. One who falls
/// further behind is let go, and catches up on coming back.
const WAITING: usize = 512;

/// How long a room is kept in memory after the last one has left.
const KEPT_EMPTY: Duration = Duration::from_secs(60);

/// The most the document of a project may hold, as it is written: far more
/// than the text of a long book, whose pictures are files of their own.
pub const MAX_DOCUMENT_BYTES: usize = 64 << 20;

/// What is sent to one who is present.
#[derive(Debug, Clone)]
pub enum Outgoing {
    Message(Bytes),
    /// The connection is to be closed, with the code and the reason told.
    Close(u16, &'static str),
}

/// Codes for closing, from the range left to applications.
pub mod close {
    /// The server is stopping: the code that is common for this.
    pub const STOPPING: u16 = 1001;
    /// The one connected may no longer enter: a member who was removed.
    pub const REMOVED: u16 = 4001;
    /// The project was taken off the server.
    pub const DELETED: u16 = 4002;
    /// More waited to be sent than the server keeps.
    pub const BEHIND: u16 = 4003;
    /// What was received could not be understood.
    pub const NOT_UNDERSTOOD: u16 = 4004;
    /// A change would make the project larger than the server keeps.
    pub const TOO_LARGE: u16 = 4005;
}

#[derive(Debug, thiserror::Error)]
pub enum EnterError {
    #[error("as many have the project open as the server allows at a time")]
    Crowded,
    #[error("the server could not read the project: {0}")]
    Io(#[from] io::Error),
}

struct Peer {
    tx: mpsc::Sender<Outgoing>,
    /// The member, or none for the owner.
    member: Option<String>,
    /// Those whose presence came by this connection, and goes with it.
    clients: HashSet<ClientID>,
}

struct Inner {
    awareness: Awareness,
    peers: HashMap<u64, Peer>,
    next: u64,
    /// Whether there is something that has not been written.
    unsaved: bool,
    /// The room was taken off the server: nothing of it is written again.
    gone: bool,
    empty_since: Option<Instant>,
    /// About how much the document holds: what it held when it was last
    /// read or written, and the changes since, which may overlap.
    size: usize,
    /// The most it may hold.
    most: usize,
}

pub struct Room {
    pub id: String,
    dir: PathBuf,
    inner: Guarded<Inner>,
    /// One writing at a time, in the order of the states.
    writing: Mutex<()>,
}

fn encode(message: &Message) -> Bytes {
    let mut encoder = EncoderV1::new();
    message.encode(&mut encoder);
    Bytes::from(encoder.to_vec())
}

impl Inner {
    /// Sends to everyone present but `except`. Those who cannot take more are let go.
    fn tell(&mut self, message: Bytes, except: Option<u64>) {
        let mut lost = Vec::new();
        for (id, peer) in &self.peers {
            if Some(*id) == except {
                continue;
            }
            if peer.tx.try_send(Outgoing::Message(message.clone())).is_err() {
                lost.push(*id);
            }
        }
        for id in lost {
            self.dismiss(id, Some((close::BEHIND, "too much was waiting to be sent")));
        }
    }

    /// Takes one out of the room, and tells the others that they left.
    fn dismiss(&mut self, id: u64, close: Option<(u16, &'static str)>) {
        let Some(peer) = self.peers.remove(&id) else { return };
        if let Some((code, reason)) = close {
            // If there is no room for this either, the connection ends when the sender is dropped.
            let _ = peer.tx.try_send(Outgoing::Close(code, reason));
        }
        let clients: Vec<ClientID> = peer.clients.into_iter().collect();
        if !clients.is_empty() {
            for client in &clients {
                self.awareness.remove_state(*client);
            }
            if let Ok(update) = self.awareness.update_with_clients(clients) {
                self.tell(encode(&Message::Awareness(update)), None);
            }
        }
        if self.peers.is_empty() {
            self.empty_since = Some(Instant::now());
        }
    }

    fn reply(&mut self, to: u64, message: &Message) {
        let sent = match self.peers.get(&to) {
            Some(peer) => peer.tx.try_send(Outgoing::Message(encode(message))).is_ok(),
            None => true,
        };
        if !sent {
            self.dismiss(to, Some((close::BEHIND, "too much was waiting to be sent")));
        }
    }

    fn handle(&mut self, from: u64, message: Message) -> Result<(), yrs::sync::Error> {
        // One who was let go while their messages were read is heard no more.
        if !self.peers.contains_key(&from) {
            return Ok(());
        }
        match message {
            Message::Sync(SyncMessage::SyncStep1(theirs)) => {
                let lacking = self.awareness.doc().transact().encode_state_as_update_v1(&theirs);
                self.reply(from, &Message::Sync(SyncMessage::SyncStep2(lacking)));
            }
            Message::Sync(SyncMessage::SyncStep2(bytes)) | Message::Sync(SyncMessage::Update(bytes)) => {
                // What would make the project larger than the server keeps is not taken in.
                if self.size + bytes.len() > self.most {
                    self.size =
                        self.awareness.doc().transact().encode_state_as_update_v1(&StateVector::default()).len();
                    if self.size + bytes.len() > self.most {
                        tracing::warn!(
                            peer = from,
                            size = self.size,
                            "a change would make a project larger than is kept"
                        );
                        self.dismiss(
                            from,
                            Some((close::TOO_LARGE, "the project would be larger than this server keeps")),
                        );
                        return Ok(());
                    }
                }
                self.size += bytes.len();
                let update = Update::decode_v1(&bytes)?;
                self.awareness.doc().transact_mut().apply_update(update)?;
                self.unsaved = true;
                self.tell(encode(&Message::Sync(SyncMessage::Update(bytes))), Some(from));
            }
            Message::Awareness(mut update) => {
                // One speaks for oneself: the presence of those who came by
                // another connection is not changed by this one.
                let others: HashSet<ClientID> = self
                    .peers
                    .iter()
                    .filter(|(id, _)| **id != from)
                    .flat_map(|(_, peer)| peer.clients.iter().copied())
                    .collect();
                update.clients.retain(|client, _| !others.contains(client));
                if update.clients.is_empty() {
                    return Ok(());
                }
                let clients: Vec<ClientID> = update.clients.keys().copied().collect();
                let changed = self.awareness.apply_update_summary(update.clone())?;
                if let Some(peer) = self.peers.get_mut(&from) {
                    match &changed {
                        Some(summary) => {
                            peer.clients.extend(summary.added.iter().chain(&summary.updated));
                            for gone in &summary.removed {
                                peer.clients.remove(gone);
                            }
                        }
                        // Nothing new: still, those told of are this one's.
                        None => peer.clients.extend(clients.iter().filter(|c| self.awareness.meta(**c).is_some())),
                    }
                }
                // The sender is told as well. The application counts on hearing
                // from the server now and then, and its own sign of life is
                // what it hears when it is alone.
                self.tell(encode(&Message::Awareness(update)), None);
            }
            Message::AwarenessQuery => {
                let update = self.awareness.update()?;
                self.reply(from, &Message::Awareness(update));
            }
            // Nothing is asked of the server by these.
            Message::Auth(_) | Message::Custom(..) => {}
        }
        Ok(())
    }
}

impl Room {
    fn load(id: &str, dir: PathBuf, most: usize) -> io::Result<Room> {
        let doc = Doc::new();
        let state = dir.join("state.bin");
        let mut size = 0;
        match std::fs::read(&state) {
            Ok(bytes) => {
                size = bytes.len();
                let applied = Update::decode_v1(&bytes)
                    .map_err(|e| e.to_string())
                    .and_then(|u| doc.transact_mut().apply_update(u).map_err(|e| e.to_string()));
                match applied {
                    // What the room held when it was last opened is kept, should
                    // something go wrong while it is open this time.
                    Ok(()) => {
                        let _ = std::fs::copy(&state, dir.join("state.bak"));
                    }
                    Err(e) => {
                        // Those who come bring what they have, so the room is
                        // opened empty rather than not at all.
                        tracing::error!(room = id, %e, "the state of a room could not be read; it is set aside");
                        let _ = std::fs::rename(&state, dir.join("state.damaged"));
                    }
                }
            }
            Err(e) if e.kind() == io::ErrorKind::NotFound => {}
            Err(e) => return Err(e),
        }
        Ok(Room {
            id: id.to_owned(),
            dir,
            inner: Guarded::new(Inner {
                awareness: Awareness::new(doc),
                peers: HashMap::new(),
                next: 1,
                unsaved: false,
                gone: false,
                empty_since: Some(Instant::now()),
                size,
                most,
            }),
            writing: Mutex::new(()),
        })
    }

    fn inner(&self) -> MutexGuard<'_, Inner> {
        // A panic while the room was held leaves it as it was: changes are
        // applied by the library as wholes.
        self.inner.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
    }

    fn enter(&self, member: Option<String>) -> Result<Entered, EnterError> {
        let mut inner = self.inner();
        if inner.peers.len() >= MOST_PRESENT {
            return Err(EnterError::Crowded);
        }
        let (tx, rx) = mpsc::channel(WAITING);
        let id = inner.next;
        inner.next += 1;
        inner.empty_since = None;

        // The server asks for what it lacks, and tells who is present.
        let theirs = inner.awareness.doc().transact().state_vector();
        let _ = tx.try_send(Outgoing::Message(encode(&Message::Sync(SyncMessage::SyncStep1(theirs)))));
        if let Ok(present) = inner.awareness.update()
            && !present.clients.is_empty()
        {
            let _ = tx.try_send(Outgoing::Message(encode(&Message::Awareness(present))));
        }
        inner.peers.insert(id, Peer { tx, member, clients: HashSet::new() });
        Ok(Entered { peer: id, incoming: rx })
    }

    /// Takes in what one who is present has sent.
    pub fn receive(&self, peer: u64, data: &[u8]) {
        let mut inner = self.inner();
        if !inner.peers.contains_key(&peer) {
            return;
        }
        let mut decoder = DecoderV1::new(Cursor::new(data));
        let messages: Result<Vec<Message>, _> = MessageReader::new(&mut decoder).collect();
        let result = match messages {
            Ok(messages) => messages.into_iter().try_for_each(|m| inner.handle(peer, m)),
            Err(e) => Err(e.into()),
        };
        if let Err(e) = result {
            tracing::warn!(room = %self.id, peer, %e, "a message could not be taken in");
            inner.dismiss(peer, Some((close::NOT_UNDERSTOOD, "a message could not be understood")));
        }
    }

    pub fn leave(&self, peer: u64) {
        self.inner().dismiss(peer, None);
    }

    /// Closes the connections of a member.
    pub fn expel(&self, member: &str) {
        let mut inner = self.inner();
        let theirs: Vec<u64> =
            inner.peers.iter().filter(|(_, p)| p.member.as_deref() == Some(member)).map(|(id, _)| *id).collect();
        for id in theirs {
            inner.dismiss(id, Some((close::REMOVED, "you are no longer among the collaborators")));
        }
    }

    fn dismiss_everyone(&self, code: u16, reason: &'static str) {
        let mut inner = self.inner();
        let all: Vec<u64> = inner.peers.keys().copied().collect();
        for id in all {
            inner.dismiss(id, Some((code, reason)));
        }
    }

    /// Closes every connection; nothing of the room is written after this.
    fn abandon(&self) {
        self.inner().gone = true;
        self.dismiss_everyone(close::DELETED, "the project was taken off the server");
    }

    /// The members present, with none standing for the owner: one for each connection.
    pub fn present(&self) -> Vec<Option<String>> {
        self.inner().peers.values().map(|p| p.member.clone()).collect()
    }

    /// The whole state, as one change to an empty document.
    pub fn state(&self) -> Vec<u8> {
        self.inner().awareness.doc().transact().encode_state_as_update_v1(&StateVector::default())
    }

    /// Writes the state if it has changed since it was written.
    pub async fn save(&self) -> io::Result<bool> {
        let _one_at_a_time = self.writing.lock().await;
        let state = {
            let mut inner = self.inner();
            if !inner.unsaved || inner.gone {
                return Ok(false);
            }
            inner.unsaved = false;
            let state = inner.awareness.doc().transact().encode_state_as_update_v1(&StateVector::default());
            inner.size = state.len();
            state
        };
        let dir = self.dir.clone();
        let written = tokio::task::spawn_blocking(move || {
            std::fs::create_dir_all(&dir)?;
            let tmp = dir.join(".state.bin.tmp");
            std::fs::write(&tmp, &state)?;
            std::fs::rename(&tmp, dir.join("state.bin"))
        })
        .await
        .unwrap_or_else(|e| Err(io::Error::other(e)));
        match written {
            Ok(()) if self.inner().gone => {
                // Taken off the server while this was written.
                let _ = std::fs::remove_dir_all(&self.dir);
                Ok(false)
            }
            Ok(()) => Ok(true),
            Err(e) => {
                self.inner().unsaved = true;
                Err(e)
            }
        }
    }

    fn may_be_put_away(&self) -> bool {
        let inner = self.inner();
        inner.peers.is_empty() && !inner.unsaved && inner.empty_since.is_none_or(|t| t.elapsed() >= KEPT_EMPTY)
    }
}

/// What one who has entered holds.
pub struct Entered {
    pub peer: u64,
    pub incoming: mpsc::Receiver<Outgoing>,
}

pub struct Rooms {
    data: PathBuf,
    open: Mutex<HashMap<String, Arc<Room>>>,
    /// The most the document of a project may hold.
    most: usize,
}

impl Rooms {
    pub fn new(data: PathBuf, most: usize) -> Self {
        Rooms { data, open: Mutex::new(HashMap::new()), most }
    }

    /// Lets one into a room, which is read from disk if it is not open.
    ///
    /// Entering and putting away both hold the list of open rooms, so that no
    /// one enters a room that is being put away.
    pub async fn enter(&self, id: &str, member: Option<String>) -> Result<(Arc<Room>, Entered), EnterError> {
        let mut open = self.open.lock().await;
        let room = match open.get(id) {
            Some(room) => room.clone(),
            None => {
                let dir = room_dir(&self.data, id);
                let name = id.to_owned();
                let most = self.most;
                let room = tokio::task::spawn_blocking(move || Room::load(&name, dir, most))
                    .await
                    .unwrap_or_else(|e| Err(io::Error::other(e)))?;
                let room = Arc::new(room);
                open.insert(id.to_owned(), room.clone());
                room
            }
        };
        let entered = room.enter(member)?;
        Ok((room, entered))
    }

    /// The room, if it is open.
    pub async fn get(&self, id: &str) -> Option<Arc<Room>> {
        self.open.lock().await.get(id).cloned()
    }

    /// Who is present in a room: one for each connection.
    pub async fn present(&self, id: &str) -> Vec<Option<String>> {
        match self.get(id).await {
            Some(room) => room.present(),
            None => Vec::new(),
        }
    }

    pub async fn expel(&self, id: &str, member: &str) {
        if let Some(room) = self.get(id).await {
            room.expel(member);
        }
    }

    /// Closes a room that is being taken off the server. To be called before
    /// its directory is removed.
    pub async fn abandon(&self, id: &str) {
        let room = self.open.lock().await.remove(id);
        if let Some(room) = room {
            room.abandon();
            // A writing that was under way is let finish, so that it does not
            // put the directory back afterwards.
            let _ = room.writing.lock().await;
        }
    }

    /// Closes every connection, for a server that is stopping.
    pub async fn dismiss_all(&self) {
        let rooms: Vec<Arc<Room>> = self.open.lock().await.values().cloned().collect();
        for room in rooms {
            room.dismiss_everyone(close::STOPPING, "the server is stopping");
        }
    }

    pub async fn save_all(&self) {
        let rooms: Vec<Arc<Room>> = self.open.lock().await.values().cloned().collect();
        for room in rooms {
            if let Err(e) = room.save().await {
                tracing::error!(room = %room.id, %e, "a room could not be written");
            }
        }
    }

    /// Puts away the rooms that have been empty for a while.
    pub async fn unload_idle(&self) {
        let mut open = self.open.lock().await;
        let before = open.len();
        open.retain(|_, room| !room.may_be_put_away());
        if open.len() < before {
            tracing::debug!(put_away = before - open.len(), open = open.len(), "rooms put away");
        }
    }

    pub async fn open_count(&self) -> usize {
        self.open.lock().await.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use yrs::sync::AwarenessUpdate;
    use yrs::{GetString, Text};

    const ROOM: &str = "0a1b2c3d-0000-4000-8000-000000000001";

    /// One side of a conversation with the server, as the application holds it.
    struct Side {
        doc: Doc,
        peer: u64,
        incoming: mpsc::Receiver<Outgoing>,
        room: Arc<Room>,
    }

    impl Side {
        async fn enter(rooms: &Rooms, member: Option<&str>) -> Side {
            let (room, entered) = rooms.enter(ROOM, member.map(str::to_owned)).await.unwrap();
            let side = Side { doc: Doc::new(), peer: entered.peer, incoming: entered.incoming, room };
            // As the application does on connecting.
            let sv = side.doc.transact().state_vector();
            side.send(&Message::Sync(SyncMessage::SyncStep1(sv)));
            side
        }

        fn send(&self, message: &Message) {
            self.room.receive(self.peer, &encode(message));
        }

        /// Takes in everything that has been sent to this side, answering as the application would.
        fn take_in(&mut self) -> Vec<Message> {
            let mut seen = Vec::new();
            while let Ok(out) = self.incoming.try_recv() {
                let Outgoing::Message(bytes) = out else { continue };
                let mut decoder = DecoderV1::new(Cursor::new(&bytes[..]));
                for message in MessageReader::new(&mut decoder) {
                    let message = message.unwrap();
                    match &message {
                        Message::Sync(SyncMessage::SyncStep1(theirs)) => {
                            let lacking = self.doc.transact().encode_state_as_update_v1(theirs);
                            self.send(&Message::Sync(SyncMessage::SyncStep2(lacking)));
                        }
                        Message::Sync(SyncMessage::SyncStep2(bytes)) | Message::Sync(SyncMessage::Update(bytes)) => {
                            self.doc.transact_mut().apply_update(Update::decode_v1(bytes).unwrap()).unwrap();
                        }
                        _ => {}
                    }
                    seen.push(message);
                }
            }
            seen
        }

        /// Writes, and sends what was written as the application would.
        fn write(&self, at: u32, words: &str) {
            let text = self.doc.get_or_insert_text("text");
            let before = self.doc.transact().state_vector();
            text.insert(&mut self.doc.transact_mut(), at, words);
            let change = self.doc.transact().encode_state_as_update_v1(&before);
            self.send(&Message::Sync(SyncMessage::Update(change)));
        }

        fn text(&self) -> String {
            self.doc.get_or_insert_text("text").get_string(&self.doc.transact())
        }

        fn closed_with(&mut self) -> Option<u16> {
            let mut code = None;
            while let Ok(out) = self.incoming.try_recv() {
                if let Outgoing::Close(c, _) = out {
                    code = Some(c);
                }
            }
            code
        }
    }

    const OWNER: ClientID = ClientID::new(11);
    const ANNA: ClientID = ClientID::new(22);

    fn presence(client: ClientID, clock: u32, json: &str) -> Message {
        let mut clients = HashMap::new();
        clients.insert(client, yrs::sync::awareness::AwarenessUpdateEntry { clock, json: json.into() });
        Message::Awareness(AwarenessUpdate { clients })
    }

    #[tokio::test]
    async fn one_speaks_for_oneself_only() {
        let tmp = tempfile::tempdir().unwrap();
        let rooms = Rooms::new(tmp.path().to_owned(), MAX_DOCUMENT_BYTES);
        let mut owner = Side::enter(&rooms, None).await;
        let mut anna = Side::enter(&rooms, Some("anna")).await;
        owner.take_in();
        anna.take_in();
        owner.send(&presence(OWNER, 1, r#"{"user":{"name":"Robert"}}"#));
        owner.take_in();
        anna.take_in();
        // Anna says the owner has left, and names herself as him: neither is taken.
        anna.send(&presence(OWNER, 2, "null"));
        anna.send(&presence(OWNER, 3, r#"{"user":{"name":"Not Robert"}}"#));
        let heard = owner.take_in();
        assert!(!heard.iter().any(|m| matches!(m, Message::Awareness(_))), "nothing was passed on: {heard:?}");
        let clock = owner.room.inner().awareness.meta(OWNER).map(|(clock, _)| clock);
        assert_eq!(clock, Some(1), "the owner's own presence stands");
        // What is her own she may say.
        anna.send(&presence(ANNA, 1, r#"{"user":{"name":"Anna"}}"#));
        assert!(owner.take_in().iter().any(|m| matches!(m, Message::Awareness(_))));
    }

    #[tokio::test]
    async fn a_project_grows_no_larger_than_is_kept() {
        let tmp = tempfile::tempdir().unwrap();
        let rooms = Rooms::new(tmp.path().to_owned(), 4096);
        let mut a = Side::enter(&rooms, None).await;
        let mut b = Side::enter(&rooms, Some("anna")).await;
        a.take_in();
        b.take_in();
        a.write(0, "Sing, goddess");
        b.take_in();
        assert_eq!(b.text(), "Sing, goddess");
        // More than the room keeps: refused, and the one who sent it let go.
        a.write(13, &"x".repeat(5000));
        assert_eq!(a.closed_with(), Some(close::TOO_LARGE));
        b.take_in();
        assert_eq!(b.text(), "Sing, goddess", "what was refused did not reach the others");
        let inner = a.room.inner();
        let doc = inner.awareness.doc();
        assert_eq!(doc.get_or_insert_text("text").get_string(&doc.transact()), "Sing, goddess", "nor the room");
    }

    #[tokio::test]
    async fn what_one_writes_reaches_the_others_and_the_disk() {
        let tmp = tempfile::tempdir().unwrap();
        let rooms = Rooms::new(tmp.path().to_owned(), MAX_DOCUMENT_BYTES);

        let mut a = Side::enter(&rooms, None).await;
        a.take_in();
        a.write(0, "Sing, goddess");
        let mut b = Side::enter(&rooms, Some("anna")).await;
        b.take_in();
        assert_eq!(b.text(), "Sing, goddess", "one who comes later is given what is there");

        b.write(13, ", the wrath");
        a.write(0, "μῆνιν: ");
        a.take_in();
        b.take_in();
        assert_eq!(a.text(), b.text());
        assert_eq!(a.text(), "μῆνιν: Sing, goddess, the wrath");
        assert_eq!(rooms.present(ROOM).await.len(), 2);

        assert!(a.room.save().await.unwrap());
        assert!(!a.room.save().await.unwrap(), "nothing has changed since");
        assert!(room_dir(tmp.path(), ROOM).join("state.bin").exists());

        // After a restart of the server, the text is there for one who has nothing.
        let again = Rooms::new(tmp.path().to_owned(), MAX_DOCUMENT_BYTES);
        let mut c = Side::enter(&again, Some("carl")).await;
        c.take_in();
        assert_eq!(c.text(), "μῆνιν: Sing, goddess, the wrath");
        assert!(room_dir(tmp.path(), ROOM).join("state.bak").exists());
    }

    #[tokio::test]
    async fn the_server_is_given_what_it_lacks() {
        let tmp = tempfile::tempdir().unwrap();
        let rooms = Rooms::new(tmp.path().to_owned(), MAX_DOCUMENT_BYTES);
        // One who wrote while away from the server, or whose server lost what it had.
        let (room, entered) = rooms.enter(ROOM, None).await.unwrap();
        let mut a = Side { doc: Doc::new(), peer: entered.peer, incoming: entered.incoming, room };
        a.doc.get_or_insert_text("text").insert(&mut a.doc.transact_mut(), 0, "written on the train");
        let sv = a.doc.transact().state_vector();
        a.send(&Message::Sync(SyncMessage::SyncStep1(sv)));
        a.take_in();

        let mut b = Side::enter(&rooms, Some("anna")).await;
        b.take_in();
        assert_eq!(b.text(), "written on the train");
    }

    #[tokio::test]
    async fn presence_comes_and_goes_with_the_connection() {
        let tmp = tempfile::tempdir().unwrap();
        let rooms = Rooms::new(tmp.path().to_owned(), MAX_DOCUMENT_BYTES);
        let mut a = Side::enter(&rooms, None).await;
        a.send(&presence(OWNER, 1, r#"{"user":{"name":"Owner"}}"#));
        let heard = a.take_in();
        assert!(
            heard.iter().any(|m| matches!(m, Message::Awareness(u) if u.clients.contains_key(&OWNER))),
            "one who is alone hears their own sign of life"
        );

        let mut b = Side::enter(&rooms, Some("anna")).await;
        let told = b.take_in();
        assert!(
            told.iter().any(|m| matches!(m, Message::Awareness(u)
                if u.clients.get(&OWNER).is_some_and(|e| e.json.contains("Owner")))),
            "one who comes is told who is there"
        );
        b.send(&presence(ANNA, 1, r#"{"user":{"name":"Anna"}}"#));
        let heard = a.take_in();
        assert!(heard.iter().any(|m| matches!(m, Message::Awareness(u) if u.clients.contains_key(&ANNA))));

        b.room.leave(b.peer);
        let heard = a.take_in();
        assert!(
            heard.iter().any(|m| matches!(m, Message::Awareness(u)
                if u.clients.get(&ANNA).is_some_and(|e| e.json.as_ref() == "null"))),
            "those who remain are told when one leaves"
        );
        assert_eq!(rooms.present(ROOM).await, vec![None]);
    }

    #[tokio::test]
    async fn removal_and_nonsense_close_the_connection() {
        let tmp = tempfile::tempdir().unwrap();
        let rooms = Rooms::new(tmp.path().to_owned(), MAX_DOCUMENT_BYTES);
        let mut a = Side::enter(&rooms, None).await;
        let mut b = Side::enter(&rooms, Some("anna")).await;
        let mut c = Side::enter(&rooms, Some("carl")).await;

        rooms.expel(ROOM, "anna").await;
        assert_eq!(b.closed_with(), Some(close::REMOVED));
        assert_eq!(rooms.present(ROOM).await.len(), 2);

        // A message that is cut short is passed over; one that is whole and
        // holds a change that is none ends the connection.
        c.room.receive(c.peer, &[0, 2, 9, 255, 255, 255]);
        assert_eq!(c.closed_with(), None);
        c.room.receive(c.peer, &[0, 2, 3, 255, 255, 255]);
        assert_eq!(c.closed_with(), Some(close::NOT_UNDERSTOOD));
        // What was sent after the removal is not taken in.
        b.write(0, "too late");
        a.take_in();
        assert_eq!(a.text(), "");

        a.write(0, "kept");
        rooms.abandon(ROOM).await;
        assert_eq!(a.closed_with(), Some(close::DELETED));
        assert!(!a.room.save().await.unwrap(), "a room taken off the server is not written");
        assert_eq!(rooms.open_count().await, 0);
    }

    #[tokio::test]
    async fn a_room_is_put_away_when_it_has_been_empty() {
        let tmp = tempfile::tempdir().unwrap();
        let rooms = Rooms::new(tmp.path().to_owned(), MAX_DOCUMENT_BYTES);
        let a = Side::enter(&rooms, None).await;
        a.write(0, "x");
        rooms.unload_idle().await;
        assert_eq!(rooms.open_count().await, 1, "someone is there");
        a.room.leave(a.peer);
        rooms.unload_idle().await;
        assert_eq!(rooms.open_count().await, 1, "not written yet, and only just left");
        rooms.save_all().await;
        a.room.inner().empty_since = Some(Instant::now() - KEPT_EMPTY);
        rooms.unload_idle().await;
        assert_eq!(rooms.open_count().await, 0);
    }

    #[tokio::test]
    async fn a_state_that_cannot_be_read_is_set_aside() {
        let tmp = tempfile::tempdir().unwrap();
        let dir = room_dir(tmp.path(), ROOM);
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join("state.bin"), b"\xff\xff not a state").unwrap();
        let rooms = Rooms::new(tmp.path().to_owned(), MAX_DOCUMENT_BYTES);
        let mut a = Side::enter(&rooms, None).await;
        a.take_in();
        assert_eq!(a.text(), "");
        assert!(dir.join("state.damaged").exists());
    }
}
