//! The files of the projects: figures, which belong to a project and must
//! reach everyone who has it.
//!
//! The project names each file by the SHA-256 of what it holds, and so does
//! the server: a file is kept as `rooms/<room>/files/<hash>`. A name made from
//! the content cannot come to stand for something else, so a file that is
//! there is never written again, and one that is sent must be what its name
//! says it is.
//!
//! A file that arrives is written under another name, in the directory where
//! it is to stand, and is given its own name when all of it has come and it
//! has been found to be what it should: no one is ever given half a file.
//!
//! Nothing here knows of HTTP, or of who may do what. That is for those who
//! call, and so is keeping a room from being taken off the server while a
//! file of it is begun or given its name.

use std::fs::File;
use std::io::{self, Write};
use std::path::PathBuf;
use std::sync::Mutex;

use serde::Serialize;
use sha2::{Digest, Sha256};

use crate::registry::{room_dir, valid_room_id};
use crate::secrets;

/// The most one file may hold where nothing else is said: 50 MiB.
pub const MAX_FILE_BYTES: u64 = 50 << 20;

/// The most the files of one room may hold together where nothing else is said: 1 GiB.
pub const MAX_ROOM_BYTES: u64 = 1 << 30;

#[derive(Debug, thiserror::Error)]
pub enum Refused {
    #[error("there is no such project on this server")]
    NoRoom,
    #[error("the project has no such file on this server")]
    NoFile,
    #[error("a file is named by the SHA-256 of what it holds: 64 characters, each of 0 to 9 or a to f")]
    BadName,
    #[error("what was sent is not what its name says it is: its SHA-256 is another")]
    NotAsNamed,
    #[error("the file is larger than this server takes: one file may hold {} at the most", in_words(*.0))]
    FileTooLarge(u64),
    #[error(
        "there is not room for the file: the files of one project may hold {} together at the most on this server",
        in_words(*.0)
    )]
    RoomFull(u64),
    #[error("the server could not use its disk: {0}")]
    Io(#[from] io::Error),
}

/// A number of bytes as it is said: in megabytes or gigabytes, of 1024 to the
/// next as the limits are given, where it is a whole number of them.
fn in_words(bytes: u64) -> String {
    const MB: u64 = 1 << 20;
    const GB: u64 = 1 << 30;
    match bytes {
        0 => "0 bytes".into(),
        b if b.is_multiple_of(GB) => format!("{} GB", b / GB),
        b if b.is_multiple_of(MB) => format!("{} MB", b / MB),
        b => format!("{b} bytes"),
    }
}

/// Whether a file can have this name. Nothing else is ever made part of a
/// path, so that no name leads out of the directory of the room.
pub fn valid_hash(hash: &str) -> bool {
    hash.len() == 64 && hash.bytes().all(|b| matches!(b, b'0'..=b'9' | b'a'..=b'f'))
}

/// The name of what holds these bytes.
pub fn hash_of(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}

/// A file that is kept.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Kept {
    pub hash: String,
    pub size: u64,
}

pub struct Files {
    data: PathBuf,
    max_file_bytes: u64,
    max_room_bytes: u64,
    /// Held while a file is given its name, so that two that arrive at the
    /// same time do not both take the room that is left.
    naming: Mutex<()>,
}

/// What comes of making ready to receive a file.
pub enum Begun {
    /// The room has the file already: nothing needs to be sent.
    Had(Kept),
    Arriving(Arriving),
}

/// A file that is arriving, written under another name until it is whole.
pub struct Arriving {
    room: String,
    hash: String,
    tmp: PathBuf,
    file: File,
    hasher: Sha256,
    size: u64,
    max_file_bytes: u64,
    /// The room that was left when the file began to arrive, and the limit it comes from.
    left: u64,
    max_room_bytes: u64,
}

impl Arriving {
    /// Takes in the next piece. What would pass a limit is refused before it is written.
    pub fn take(&mut self, piece: &[u8]) -> Result<(), Refused> {
        self.size = self.size.saturating_add(piece.len() as u64);
        if self.size > self.max_file_bytes {
            return Err(Refused::FileTooLarge(self.max_file_bytes));
        }
        if self.size > self.left {
            return Err(Refused::RoomFull(self.max_room_bytes));
        }
        self.hasher.update(piece);
        self.file.write_all(piece)?;
        Ok(())
    }
}

impl Drop for Arriving {
    /// Whatever ends the arriving, nothing is left of what was not kept. After
    /// the file has been given its name there is nothing by this one.
    fn drop(&mut self) {
        let _ = std::fs::remove_file(&self.tmp);
    }
}

impl Files {
    pub fn new(data: PathBuf, max_file_bytes: u64, max_room_bytes: u64) -> Self {
        Files { data, max_file_bytes, max_room_bytes, naming: Mutex::new(()) }
    }

    fn dir(&self, room: &str) -> Result<PathBuf, Refused> {
        if !valid_room_id(room) {
            return Err(Refused::NoRoom);
        }
        Ok(room_dir(&self.data, room).join("files"))
    }

    fn path(&self, room: &str, hash: &str) -> Result<PathBuf, Refused> {
        if !valid_hash(hash) {
            return Err(Refused::BadName);
        }
        Ok(self.dir(room)?.join(hash))
    }

    /// The file as it is kept, if it is.
    fn kept(&self, room: &str, hash: &str) -> Result<Option<Kept>, Refused> {
        match std::fs::metadata(self.path(room, hash)?) {
            Ok(meta) => Ok(Some(Kept { hash: hash.to_owned(), size: meta.len() })),
            Err(e) if e.kind() == io::ErrorKind::NotFound => Ok(None),
            Err(e) => Err(e.into()),
        }
    }

    /// The files of a room, in the order of their names.
    pub fn list(&self, room: &str) -> Result<Vec<Kept>, Refused> {
        let entries = match std::fs::read_dir(self.dir(room)?) {
            Ok(entries) => entries,
            // No file has been kept for the room yet.
            Err(e) if e.kind() == io::ErrorKind::NotFound => return Ok(Vec::new()),
            Err(e) => return Err(e.into()),
        };
        let mut files = Vec::new();
        for entry in entries {
            let entry = entry?;
            let name = entry.file_name();
            // What is arriving is not yet a file of the room.
            let Some(hash) = name.to_str().filter(|n| valid_hash(n)) else { continue };
            match entry.metadata() {
                Ok(meta) if meta.is_file() => files.push(Kept { hash: hash.to_owned(), size: meta.len() }),
                Ok(_) => {}
                // Gone since the directory was read: the room is being taken off the server.
                Err(e) if e.kind() == io::ErrorKind::NotFound => {}
                Err(e) => return Err(e.into()),
            }
        }
        files.sort_by(|a, b| a.hash.cmp(&b.hash));
        Ok(files)
    }

    /// How much the files of a room hold together.
    pub fn used(&self, room: &str) -> Result<u64, Refused> {
        Ok(self.list(room)?.iter().map(|f| f.size).sum())
    }

    /// Opens a file for reading. Returns it with its size.
    pub fn open(&self, room: &str, hash: &str) -> Result<(File, u64), Refused> {
        let file = match File::open(self.path(room, hash)?) {
            Ok(file) => file,
            Err(e) if e.kind() == io::ErrorKind::NotFound => return Err(Refused::NoFile),
            Err(e) => return Err(e.into()),
        };
        let size = file.metadata()?.len();
        Ok((file, size))
    }

    /// Makes ready to receive a file. `announced` is how much the sender says
    /// it holds, if it says: what is too large by that is refused before any
    /// of it has come.
    pub fn begin(&self, room: &str, hash: &str, announced: Option<u64>) -> Result<Begun, Refused> {
        if let Some(kept) = self.kept(room, hash)? {
            return Ok(Begun::Had(kept));
        }
        let left = self.max_room_bytes.saturating_sub(self.used(room)?);
        if let Some(size) = announced {
            if size > self.max_file_bytes {
                return Err(Refused::FileTooLarge(self.max_file_bytes));
            }
            if size > left {
                return Err(Refused::RoomFull(self.max_room_bytes));
            }
        }
        let dir = self.dir(room)?;
        // The directory of the room is not made here: a room without one is
        // no longer on the server, and is not to come back by a file.
        match std::fs::create_dir(&dir) {
            Ok(()) => {}
            Err(e) if e.kind() == io::ErrorKind::AlreadyExists => {}
            Err(e) if e.kind() == io::ErrorKind::NotFound => return Err(Refused::NoRoom),
            Err(e) => return Err(e.into()),
        }
        // A name of its own for each arriving: the same file may be sent by two at once.
        let tmp = dir.join(format!(".{hash}.{}.tmp", &secrets::token()[..16]));
        let file = File::create(&tmp)?;
        Ok(Begun::Arriving(Arriving {
            room: room.to_owned(),
            hash: hash.to_owned(),
            tmp,
            file,
            hasher: Sha256::new(),
            size: 0,
            max_file_bytes: self.max_file_bytes,
            left,
            max_room_bytes: self.max_room_bytes,
        }))
    }

    /// Gives a file that has arrived its name, if it is what the name says
    /// and there is room for it. Tells also whether it was stored: not if the
    /// room came to have it while it arrived.
    pub fn keep(&self, mut arriving: Arriving) -> Result<(Kept, bool), Refused> {
        if format!("{:x}", arriving.hasher.finalize_reset()) != arriving.hash {
            return Err(Refused::NotAsNamed);
        }
        let _one_at_a_time = self.naming.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
        if let Some(kept) = self.kept(&arriving.room, &arriving.hash)? {
            return Ok((kept, false));
        }
        // Counted again: others may have arrived since this one began.
        if self.used(&arriving.room)?.saturating_add(arriving.size) > self.max_room_bytes {
            return Err(Refused::RoomFull(self.max_room_bytes));
        }
        match std::fs::rename(&arriving.tmp, self.path(&arriving.room, &arriving.hash)?) {
            Ok(()) => Ok((Kept { hash: arriving.hash.clone(), size: arriving.size }, true)),
            // The room was taken off the server while the file arrived.
            Err(e) if e.kind() == io::ErrorKind::NotFound => Err(Refused::NoRoom),
            Err(e) => Err(e.into()),
        }
    }

    /// Removes what was arriving when the server last stopped: no one comes
    /// back to send the rest of it.
    pub fn sweep(&self) {
        let Ok(rooms) = std::fs::read_dir(self.data.join("rooms")) else { return };
        for room in rooms.flatten() {
            let Ok(files) = std::fs::read_dir(room.path().join("files")) else { continue };
            for file in files.flatten() {
                if file.file_name().to_str().is_some_and(|n| n.starts_with('.') && n.ends_with(".tmp")) {
                    let _ = std::fs::remove_file(file.path());
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const ROOM: &str = "0a1b2c3d-0000-4000-8000-000000000001";
    const OTHER: &str = "0a1b2c3d-0000-4000-8000-000000000002";

    /// A store with rooms as the registry makes them: a directory for each.
    fn store(data: &std::path::Path, max_file_bytes: u64, max_room_bytes: u64) -> Files {
        for room in [ROOM, OTHER] {
            std::fs::create_dir_all(room_dir(data, room)).unwrap();
        }
        Files::new(data.to_owned(), max_file_bytes, max_room_bytes)
    }

    /// Sends a file as it is sent over the network: in pieces, and without saying how large it is.
    fn send(files: &Files, room: &str, hash: &str, bytes: &[u8]) -> Result<(Kept, bool), Refused> {
        match files.begin(room, hash, None)? {
            Begun::Had(kept) => Ok((kept, false)),
            Begun::Arriving(mut arriving) => {
                for piece in bytes.chunks(7) {
                    arriving.take(piece)?;
                }
                files.keep(arriving)
            }
        }
    }

    fn names(dir: &std::path::Path) -> Vec<String> {
        let mut names: Vec<String> =
            std::fs::read_dir(dir).unwrap().map(|e| e.unwrap().file_name().into_string().unwrap()).collect();
        names.sort();
        names
    }

    #[test]
    fn storing_listing_and_reading() {
        let tmp = tempfile::tempdir().unwrap();
        let files = store(tmp.path(), MAX_FILE_BYTES, MAX_ROOM_BYTES);
        assert_eq!(files.list(ROOM).unwrap(), vec![], "a room without files has none, and no directory for them");

        let figure = b"a figure, as it might be drawn".to_vec();
        let hash = hash_of(&figure);
        assert_eq!(hash.len(), 64);
        let kept = Kept { hash: hash.clone(), size: figure.len() as u64 };
        assert_eq!(send(&files, ROOM, &hash, &figure).unwrap(), (kept.clone(), true));
        let dir = room_dir(tmp.path(), ROOM).join("files");
        assert_eq!(std::fs::read(dir.join(&hash)).unwrap(), figure);
        assert_eq!(names(&dir), vec![hash.clone()], "nothing is left of the name it arrived under");

        // Stored again, it is there already; and nothing is asked of what is sent then.
        assert_eq!(send(&files, ROOM, &hash, &figure).unwrap(), (kept.clone(), false));
        assert!(matches!(files.begin(ROOM, &hash, Some(u64::MAX)), Ok(Begun::Had(k)) if k == kept));

        // Listed in the order of the names, whatever the order of arriving.
        let nothing = hash_of(b"");
        assert_eq!(nothing, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
        assert_eq!(send(&files, ROOM, &nothing, b"").unwrap(), (Kept { hash: nothing.clone(), size: 0 }, true));
        let another = b"another".to_vec();
        send(&files, ROOM, &hash_of(&another), &another).unwrap();
        let listed = files.list(ROOM).unwrap();
        assert_eq!(listed.len(), 3);
        assert!(listed.is_sorted_by(|a, b| a.hash < b.hash));
        assert!(listed.contains(&kept) && listed.contains(&Kept { hash: nothing, size: 0 }));
        assert_eq!(files.used(ROOM).unwrap(), (figure.len() + another.len()) as u64);

        // Read as it was written, and only in the room it was sent to.
        let (mut file, size) = files.open(ROOM, &hash).unwrap();
        let mut read = Vec::new();
        io::Read::read_to_end(&mut file, &mut read).unwrap();
        assert_eq!((read, size), (figure.clone(), figure.len() as u64));
        assert!(matches!(files.open(OTHER, &hash), Err(Refused::NoFile)));
        assert!(matches!(files.open(ROOM, &hash_of(b"never sent")), Err(Refused::NoFile)));
        assert_eq!(files.list(OTHER).unwrap(), vec![]);
    }

    #[test]
    fn what_is_not_what_its_name_says_is_not_kept() {
        let tmp = tempfile::tempdir().unwrap();
        let files = store(tmp.path(), MAX_FILE_BYTES, MAX_ROOM_BYTES);
        let hash = hash_of(b"what was meant");
        assert!(matches!(send(&files, ROOM, &hash, b"what was sent"), Err(Refused::NotAsNamed)));
        assert!(matches!(files.open(ROOM, &hash), Err(Refused::NoFile)));
        assert_eq!(names(&room_dir(tmp.path(), ROOM).join("files")), Vec::<String>::new());

        // One that is given up halfway leaves nothing either.
        let Ok(Begun::Arriving(mut arriving)) = files.begin(ROOM, &hash, None) else { panic!("it is not there") };
        arriving.take(b"what was").unwrap();
        assert_eq!(names(&room_dir(tmp.path(), ROOM).join("files")).len(), 1);
        drop(arriving);
        assert_eq!(names(&room_dir(tmp.path(), ROOM).join("files")), Vec::<String>::new());
        assert_eq!(files.list(ROOM).unwrap(), vec![]);
    }

    #[test]
    fn names_that_cannot_be() {
        let tmp = tempfile::tempdir().unwrap();
        let files = store(tmp.path(), MAX_FILE_BYTES, MAX_ROOM_BYTES);
        let good = hash_of(b"x");
        assert!(valid_hash(&good));
        let bad = [
            String::new(),
            "..".into(),
            "../room.json".into(),
            "/etc/passwd".into(),
            good[..63].to_owned(),
            format!("{good}0"),
            good.to_uppercase().replace('0', "A"),
            format!("{}/", &good[..63]),
            format!("../{}", &good[..61]),
            format!("{}\0", &good[..63]),
            format!("{}g", &good[..63]),
            format!("{}é", &good[..62]),
        ];
        for name in &bad {
            assert!(!valid_hash(name), "{name:?}");
            assert!(matches!(files.begin(ROOM, name, Some(1)), Err(Refused::BadName)), "{name:?}");
            assert!(matches!(files.open(ROOM, name), Err(Refused::BadName)), "{name:?}");
        }
        // Nor does the name of a room lead anywhere but to a room.
        for room in ["", "..", "../..", "a/b", "-x", "."] {
            assert!(matches!(files.begin(room, &good, Some(1)), Err(Refused::NoRoom)), "{room:?}");
            assert!(matches!(files.open(room, &good), Err(Refused::NoRoom)), "{room:?}");
            assert!(matches!(files.list(room), Err(Refused::NoRoom)), "{room:?}");
        }
        // A room that is not on the server is not made by sending a file to it.
        let nowhere = "0a1b2c3d-0000-4000-8000-000000000003";
        assert!(matches!(files.begin(nowhere, &good, Some(1)), Err(Refused::NoRoom)));
        assert!(!room_dir(tmp.path(), nowhere).exists());
        assert_eq!(names(&tmp.path().join("rooms")), vec![ROOM.to_owned(), OTHER.to_owned()]);
    }

    #[test]
    fn a_file_may_hold_so_much_and_no_more() {
        let tmp = tempfile::tempdir().unwrap();
        let files = store(tmp.path(), 100, 1000);
        let most = vec![7u8; 100];
        let more = vec![7u8; 101];

        // Refused before anything has come, when it says how large it is.
        assert!(matches!(files.begin(ROOM, &hash_of(&more), Some(101)), Err(Refused::FileTooLarge(100))));
        assert!(!room_dir(tmp.path(), ROOM).join("files").exists(), "nothing was made ready for it");
        // And when the limit is passed, when it does not, or says what is not so.
        assert!(matches!(send(&files, ROOM, &hash_of(&more), &more), Err(Refused::FileTooLarge(100))));
        let Ok(Begun::Arriving(mut arriving)) = files.begin(ROOM, &hash_of(&more), Some(10)) else { panic!() };
        arriving.take(&most).unwrap();
        assert!(matches!(arriving.take(&[7]), Err(Refused::FileTooLarge(100))));
        drop(arriving);
        assert_eq!(names(&room_dir(tmp.path(), ROOM).join("files")), Vec::<String>::new());

        assert!(send(&files, ROOM, &hash_of(&most), &most).unwrap().1, "as much as the limit is not too much");
        let said = Refused::FileTooLarge(50 << 20).to_string();
        assert!(said.contains("one file") && said.contains("50 MB"), "{said}");
        assert!(Refused::FileTooLarge(100).to_string().contains("100 bytes"));
    }

    #[test]
    fn the_files_of_a_room_may_hold_so_much_together() {
        let tmp = tempfile::tempdir().unwrap();
        let files = store(tmp.path(), 100, 250);
        let file = |n: u8| vec![n; 100];
        send(&files, ROOM, &hash_of(&file(1)), &file(1)).unwrap();
        send(&files, ROOM, &hash_of(&file(2)), &file(2)).unwrap();
        assert_eq!(files.used(ROOM).unwrap(), 200);

        // Fifty are left. Refused before anything has come, or when what is left has been passed.
        assert!(matches!(files.begin(ROOM, &hash_of(&file(3)), Some(100)), Err(Refused::RoomFull(250))));
        assert!(matches!(send(&files, ROOM, &hash_of(&file(3)), &file(3)), Err(Refused::RoomFull(250))));
        assert_eq!(files.list(ROOM).unwrap().len(), 2);
        assert_eq!(names(&room_dir(tmp.path(), ROOM).join("files")).len(), 2, "and nothing is left of it");
        let small = vec![3u8; 50];
        assert!(send(&files, ROOM, &hash_of(&small), &small).unwrap().1, "what is left can be taken");
        assert!(send(&files, ROOM, &hash_of(b""), b"").unwrap().1, "and what holds nothing takes none");
        assert!(matches!(send(&files, ROOM, &hash_of(b"x"), b"x"), Err(Refused::RoomFull(250))));

        // What the room has is still said to be there, though it is full.
        assert!(!send(&files, ROOM, &hash_of(&file(1)), &file(1)).unwrap().1);
        // Each room has its own.
        assert!(send(&files, OTHER, &hash_of(&file(1)), &file(1)).unwrap().1);

        let said = Refused::RoomFull(1 << 30).to_string();
        assert!(said.contains("one project") && said.contains("1 GB"), "{said}");
        assert!(Refused::RoomFull(1536 << 20).to_string().contains("1536 MB"));
    }

    #[test]
    fn two_that_arrive_at_once_do_not_both_take_what_is_left() {
        let tmp = tempfile::tempdir().unwrap();
        let files = store(tmp.path(), 100, 150);
        let (a, b) = (vec![1u8; 100], vec![2u8; 100]);
        let Ok(Begun::Arriving(mut first)) = files.begin(ROOM, &hash_of(&a), Some(100)) else { panic!() };
        let Ok(Begun::Arriving(mut second)) = files.begin(ROOM, &hash_of(&b), Some(100)) else { panic!() };
        first.take(&a).unwrap();
        second.take(&b).unwrap();
        assert!(files.keep(first).unwrap().1);
        assert!(matches!(files.keep(second), Err(Refused::RoomFull(150))));
        assert_eq!(names(&room_dir(tmp.path(), ROOM).join("files")), vec![hash_of(&a)]);

        // The same file from two: it is stored once, and both are told that it is there.
        let c = vec![3u8; 10];
        let Ok(Begun::Arriving(mut first)) = files.begin(ROOM, &hash_of(&c), None) else { panic!() };
        let Ok(Begun::Arriving(mut second)) = files.begin(ROOM, &hash_of(&c), None) else { panic!() };
        first.take(&c).unwrap();
        second.take(&c).unwrap();
        assert!(files.keep(first).unwrap().1);
        assert_eq!(files.keep(second).unwrap(), (Kept { hash: hash_of(&c), size: 10 }, false));
        assert_eq!(names(&room_dir(tmp.path(), ROOM).join("files")).len(), 2);
    }

    #[test]
    fn a_room_taken_off_the_server_while_a_file_arrives() {
        let tmp = tempfile::tempdir().unwrap();
        let files = store(tmp.path(), MAX_FILE_BYTES, MAX_ROOM_BYTES);
        let Ok(Begun::Arriving(mut arriving)) = files.begin(ROOM, &hash_of(b"late"), None) else { panic!() };
        arriving.take(b"late").unwrap();
        std::fs::remove_dir_all(room_dir(tmp.path(), ROOM)).unwrap();
        assert!(matches!(files.keep(arriving), Err(Refused::NoRoom)));
        assert!(!room_dir(tmp.path(), ROOM).exists(), "it does not come back by the file");
    }

    #[test]
    fn what_was_arriving_when_the_server_stopped_is_removed() {
        let tmp = tempfile::tempdir().unwrap();
        let files = store(tmp.path(), MAX_FILE_BYTES, MAX_ROOM_BYTES);
        send(&files, ROOM, &hash_of(b"kept"), b"kept").unwrap();
        let Ok(Begun::Arriving(mut arriving)) = files.begin(ROOM, &hash_of(b"half"), None) else { panic!() };
        arriving.take(b"ha").unwrap();
        // As when the server is stopped at once: nothing is tidied.
        std::mem::forget(arriving);
        let dir = room_dir(tmp.path(), ROOM).join("files");
        assert_eq!(names(&dir).len(), 2);
        assert_eq!(files.list(ROOM).unwrap().len(), 1, "what is arriving is not among the files");

        store(tmp.path(), MAX_FILE_BYTES, MAX_ROOM_BYTES).sweep();
        assert_eq!(names(&dir), vec![hash_of(b"kept")]);
    }
}
