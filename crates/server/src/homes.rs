//! Homes: where the computers of one writer keep the same things. A home is
//! the computers that may enter it, the documents it keeps and one store of
//! files. It is made by the first computer, which is given a token; a
//! computer that is in makes a code, and the code admits another, which is
//! given a token of its own. All computers are equals: any of them may make
//! codes, rename and remove any other, and the last to leave takes the home
//! with it.
//!
//! What is kept of who may enter is one JSON file for each home,
//! `homes/<home>/home.json`, with hashes only, as `registry.rs` keeps the
//! rooms. The documents are rooms (`rooms.rs`), kept in
//! `homes/<home>/docs/<kind>/<id>/`; what is known of them without reading
//! them, their digests, is kept in memory by `Listing`.

use std::collections::{BTreeMap, HashMap};
use std::io;
use std::path::{Path, PathBuf};
use std::sync::Mutex as Guarded;

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::registry::{now, valid_room_id};
use crate::rooms::Said;
use crate::secrets;

/// How many computers may be in one home.
pub const MOST_COMPUTERS: usize = 16;

/// How many codes of one home may be open at a time.
pub const MOST_CODES: usize = 5;

/// For how long a code admits, in seconds.
pub const CODE_GOOD_FOR: i64 = 3600;

/// How many documents one home may keep.
pub const MOST_DOCUMENTS: usize = 10_000;

/// How often that a computer was seen is written, at the most, in seconds.
const SEEN_EVERY: i64 = 60;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Device {
    pub id: String,
    pub name: String,
    /// The hash of the computer's token.
    pub token: String,
    pub joined: i64,
    #[serde(default)]
    pub last_seen: i64,
}

/// A code that admits a computer: good once, and for an hour. It is told
/// once, when it is made, and kept only as its hash.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Code {
    pub id: String,
    /// The hash of the code: `secrets::code_hash`.
    pub hash: String,
    pub created: i64,
    /// From this moment the code admits no one.
    pub expires: i64,
}

impl Code {
    pub fn is_open(&self, at: i64) -> bool {
        self.expires > at
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HomeMeta {
    pub id: String,
    pub created: i64,
    #[serde(default)]
    pub devices: Vec<Device>,
    #[serde(default)]
    pub codes: Vec<Code>,
}

#[derive(Debug, thiserror::Error)]
pub enum HomeRefusal {
    #[error("there is no such home on this server")]
    NoHome,
    #[error("the token is not valid for this home: the computer may have been removed from it")]
    NotAdmitted,
    #[error("the code is not valid: it may have been mistyped, withdrawn, used up, or it has expired")]
    BadCode,
    #[error("the server holds as many homes as it is allowed to")]
    Full,
    // What a request asked that cannot be: each is a refusal of its own, so
    // that every sentence the server may say is here, where the test of the
    // client's words (in api.rs) finds it.
    #[error("a home may have sixteen computers; remove one first")]
    ManyComputers,
    #[error("there are five open codes already; withdraw one")]
    ManyCodes,
    #[error("there is no such computer in the home")]
    NoComputer,
    #[error("the computer has no name")]
    NoName,
    #[error("the server could not write to its disk: {0}")]
    Io(#[from] io::Error),
}

pub fn home_dir(data: &Path, home: &str) -> PathBuf {
    data.join("homes").join(home)
}

/// Whether a kind of document can be: one to sixteen small letters.
pub fn valid_kind(kind: &str) -> bool {
    (1..=16).contains(&kind.len()) && kind.bytes().all(|b| b.is_ascii_lowercase())
}

/// Where a document of a home is kept. The kind and the id are to have been
/// found valid (`valid_kind`, `valid_room_id`): nothing else is made part of a path.
pub fn doc_dir(data: &Path, home: &str, kind: &str, id: &str) -> PathBuf {
    home_dir(data, home).join("docs").join(kind).join(id)
}

/// What a computer is called, as its name is given.
fn clean(text: &str) -> String {
    text.split_whitespace().collect::<Vec<_>>().join(" ").chars().take(100).collect()
}

/// What a computer is called that was given no name.
const NAMELESS: &str = "A computer";

pub struct Homes {
    data: PathBuf,
    homes: HashMap<String, HomeMeta>,
}

/// What a computer is given when it comes into a home.
#[derive(Debug, Clone)]
pub struct Admitted {
    pub home: String,
    pub device: String,
    /// The computer's token. It is told this once.
    pub token: String,
}

impl Homes {
    pub fn open(data: &Path) -> io::Result<Self> {
        let dir = data.join("homes");
        std::fs::create_dir_all(&dir)?;
        let mut homes = HashMap::new();
        for entry in std::fs::read_dir(&dir)?.flatten() {
            let path = entry.path().join("home.json");
            let Ok(text) = std::fs::read_to_string(&path) else { continue };
            match serde_json::from_str::<HomeMeta>(&text) {
                Ok(meta) if valid_room_id(&meta.id) && entry.file_name().to_str() == Some(meta.id.as_str()) => {
                    homes.insert(meta.id.clone(), meta);
                }
                Ok(_) => tracing::warn!(path = %path.display(), "a home with an id that cannot be is left out"),
                Err(e) => tracing::warn!(path = %path.display(), %e, "a home could not be read"),
            }
        }
        tracing::info!(homes = homes.len(), "homes read");
        Ok(Homes { data: data.to_owned(), homes })
    }

    pub fn len(&self) -> usize {
        self.homes.len()
    }

    pub fn is_empty(&self) -> bool {
        self.homes.is_empty()
    }

    pub fn ids(&self) -> impl Iterator<Item = &str> {
        self.homes.keys().map(String::as_str)
    }

    pub fn get(&self, home: &str) -> Option<&HomeMeta> {
        self.homes.get(home)
    }

    fn save(&self, home: &str) -> io::Result<()> {
        let Some(meta) = self.homes.get(home) else { return Ok(()) };
        let dir = home_dir(&self.data, home);
        std::fs::create_dir_all(&dir)?;
        let tmp = dir.join(".home.json.tmp");
        std::fs::write(&tmp, serde_json::to_vec_pretty(meta)?)?;
        std::fs::rename(&tmp, dir.join("home.json"))
    }

    /// Makes a home, with one computer in it, called `name`.
    pub fn create(&mut self, name: &str, limit: Option<usize>) -> Result<Admitted, HomeRefusal> {
        if limit.is_some_and(|l| self.homes.len() >= l) {
            return Err(HomeRefusal::Full);
        }
        let home = uuid::Uuid::new_v4().to_string();
        let at = now();
        let (device, token) = new_device(name, at);
        let admitted = Admitted { home: home.clone(), device: device.id.clone(), token };
        self.homes
            .insert(home.clone(), HomeMeta { id: home.clone(), created: at, devices: vec![device], codes: Vec::new() });
        if let Err(e) = self.save(&home) {
            self.homes.remove(&home);
            let _ = std::fs::remove_dir_all(home_dir(&self.data, &home));
            return Err(e.into());
        }
        Ok(admitted)
    }

    /// Tells which computer of the home the token is.
    pub fn admit(&self, home: &str, token: &str) -> Result<String, HomeRefusal> {
        let meta = self.homes.get(home).ok_or(HomeRefusal::NoHome)?;
        let hash = secrets::hash(token);
        meta.devices
            .iter()
            .find(|d| secrets::same(&d.token, &hash))
            .map(|d| d.id.clone())
            .ok_or(HomeRefusal::NotAdmitted)
    }

    /// Notes that a computer was seen: written once a minute at the most.
    pub fn seen(&mut self, home: &str, device: &str) {
        let at = now();
        let Some(d) = self.homes.get_mut(home).and_then(|h| h.devices.iter_mut().find(|d| d.id == device)) else {
            return;
        };
        if at - d.last_seen >= SEEN_EVERY {
            d.last_seen = at;
            let _ = self.save(home);
        }
    }

    /// Makes a code that admits one computer, for an hour. Returns it with
    /// the code itself, which is told once.
    pub fn code(&mut self, home: &str) -> Result<(Code, String), HomeRefusal> {
        let at = now();
        let meta = self.homes.get_mut(home).ok_or(HomeRefusal::NoHome)?;
        // Codes that admit no one any more are of no use to anyone.
        meta.codes.retain(|c| c.is_open(at));
        if meta.codes.len() >= MOST_CODES {
            return Err(HomeRefusal::ManyCodes);
        }
        let code = secrets::code();
        let kept = Code {
            id: uuid::Uuid::new_v4().to_string(),
            hash: secrets::code_hash(&code),
            created: at,
            expires: at + CODE_GOOD_FOR,
        };
        meta.codes.push(kept.clone());
        self.save(home)?;
        Ok((kept, code))
    }

    /// Withdraws a code, by its id.
    pub fn withdraw(&mut self, home: &str, code: &str) -> Result<(), HomeRefusal> {
        let meta = self.homes.get_mut(home).ok_or(HomeRefusal::NoHome)?;
        let before = meta.codes.len();
        meta.codes.retain(|c| c.id != code);
        if meta.codes.len() == before {
            return Err(HomeRefusal::BadCode);
        }
        Ok(self.save(home)?)
    }

    /// Admits the computer that presents a code, which is good no more.
    pub fn join(&mut self, code: &str, name: &str) -> Result<Admitted, HomeRefusal> {
        let code = secrets::normalise_code(code);
        if code.len() != 14 {
            return Err(HomeRefusal::BadCode);
        }
        let hashed = secrets::code_hash(&code);
        let at = now();
        let home = self
            .homes
            .values()
            .find(|h| h.codes.iter().any(|c| secrets::same(&c.hash, &hashed) && c.is_open(at)))
            .map(|h| h.id.clone())
            .ok_or(HomeRefusal::BadCode)?;
        let meta = self.homes.get_mut(&home).expect("the home was found a moment ago");
        // The code is kept for another try where the home has no room.
        if meta.devices.len() >= MOST_COMPUTERS {
            return Err(HomeRefusal::ManyComputers);
        }
        meta.codes.retain(|c| !secrets::same(&c.hash, &hashed));
        let (device, token) = new_device(name, at);
        let admitted = Admitted { home: home.clone(), device: device.id.clone(), token };
        meta.devices.push(device);
        self.save(&home)?;
        Ok(admitted)
    }

    pub fn rename(&mut self, home: &str, device: &str, name: &str) -> Result<(), HomeRefusal> {
        let name = clean(name);
        if name.is_empty() {
            return Err(HomeRefusal::NoName);
        }
        let meta = self.homes.get_mut(home).ok_or(HomeRefusal::NoHome)?;
        meta.devices.iter_mut().find(|d| d.id == device).ok_or(HomeRefusal::NoComputer)?.name = name;
        Ok(self.save(home)?)
    }

    /// Removes a computer from a home. True where it was the last: the home
    /// is then to be taken off the server (`delete`), which the caller does
    /// after closing its documents.
    pub fn remove(&mut self, home: &str, device: &str) -> Result<bool, HomeRefusal> {
        let meta = self.homes.get_mut(home).ok_or(HomeRefusal::NoHome)?;
        let before = meta.devices.len();
        meta.devices.retain(|d| d.id != device);
        if meta.devices.len() == before {
            return Err(HomeRefusal::NoComputer);
        }
        if meta.devices.is_empty() {
            return Ok(true);
        }
        self.save(home)?;
        Ok(false)
    }

    /// Takes a home off the server, with everything it kept.
    pub fn delete(&mut self, home: &str) -> Result<(), HomeRefusal> {
        self.homes.remove(home).ok_or(HomeRefusal::NoHome)?;
        let dir = home_dir(&self.data, home);
        if dir.exists() {
            std::fs::remove_dir_all(dir)?;
        }
        Ok(())
    }
}

fn new_device(name: &str, at: i64) -> (Device, String) {
    let name = clean(name);
    let token = secrets::token();
    let device = Device {
        id: uuid::Uuid::new_v4().to_string(),
        name: if name.is_empty() { NAMELESS.into() } else { name },
        token: secrets::hash(&token),
        joined: at,
        last_seen: at,
    };
    (device, token)
}

// ---------------------------------------------------------------------------
// What is known of the documents of the homes

/// A document of a home, as it is listed.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Listed {
    pub kind: String,
    pub id: String,
    pub digest: String,
    pub bytes: usize,
}

/// The digest and the size of each document of each home, so that the list
/// of a home's documents is told without reading them. Read from what is
/// said of each (`said.json`) when the server starts, and kept as they
/// change: an exchange tells it under the room's lock (`Room::exchange`),
/// so that it is told in the order of the changes. Its own lock is held
/// only for a moment, and nothing is waited for while it is held.
/// The documents of each home: by kind and id, the digest and the size.
type Documents = HashMap<String, BTreeMap<(String, String), (String, usize)>>;

#[derive(Default)]
pub struct Listing {
    homes: Guarded<Documents>,
}

impl Listing {
    /// What is said of the documents of these homes on disk. A document
    /// whose state is there without what is said of it (the server stopped
    /// between the two) is listed with no digest, which no computer has
    /// seen: the next exchange of it says it anew.
    pub fn read<'a>(data: &Path, homes: impl Iterator<Item = &'a str>) -> Listing {
        let mut all = HashMap::new();
        for home in homes {
            let mut docs = BTreeMap::new();
            let Ok(kinds) = std::fs::read_dir(home_dir(data, home).join("docs")) else {
                all.insert(home.to_owned(), docs);
                continue;
            };
            for kind in kinds.flatten() {
                let Some(kind_name) = kind.file_name().to_str().filter(|k| valid_kind(k)).map(str::to_owned) else {
                    continue;
                };
                let Ok(ids) = std::fs::read_dir(kind.path()) else { continue };
                for id in ids.flatten() {
                    let Some(id_name) = id.file_name().to_str().filter(|i| valid_room_id(i)).map(str::to_owned) else {
                        continue;
                    };
                    let said = std::fs::read(id.path().join("said.json"))
                        .ok()
                        .and_then(|bytes| serde_json::from_slice::<Said>(&bytes).ok());
                    let listed = match said {
                        Some(said) => (said.digest, said.bytes),
                        None => match std::fs::metadata(id.path().join("state.bin")) {
                            Ok(meta) => (String::new(), meta.len() as usize),
                            Err(_) => continue,
                        },
                    };
                    docs.insert((kind_name.clone(), id_name), listed);
                }
            }
            all.insert(home.to_owned(), docs);
        }
        Listing { homes: Guarded::new(all) }
    }

    fn held(&self) -> std::sync::MutexGuard<'_, Documents> {
        self.homes.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
    }

    /// Notes what a document holds now.
    pub fn note(&self, home: &str, kind: &str, id: &str, digest: &str, bytes: usize) {
        self.held()
            .entry(home.to_owned())
            .or_default()
            .insert((kind.to_owned(), id.to_owned()), (digest.to_owned(), bytes));
    }

    pub fn forget(&self, home: &str, kind: &str, id: &str) {
        if let Some(docs) = self.held().get_mut(home) {
            docs.remove(&(kind.to_owned(), id.to_owned()));
        }
    }

    pub fn forget_home(&self, home: &str) {
        self.held().remove(home);
    }

    /// Whether the home keeps the document.
    pub fn has(&self, home: &str, kind: &str, id: &str) -> bool {
        self.held().get(home).is_some_and(|docs| docs.contains_key(&(kind.to_owned(), id.to_owned())))
    }

    /// How many documents the home keeps.
    pub fn count(&self, home: &str) -> usize {
        self.held().get(home).map_or(0, BTreeMap::len)
    }

    /// The documents of a home, by kind and id, with the stamp of the list:
    /// the SHA-256 of the kinds, ids and digests in that order, which is
    /// another whenever any of them is.
    pub fn list(&self, home: &str) -> (String, Vec<Listed>) {
        let held = self.held();
        let mut hasher = Sha256::new();
        let mut listed = Vec::new();
        for ((kind, id), (digest, bytes)) in held.get(home).into_iter().flatten() {
            for part in [kind, id, digest] {
                hasher.update(part.as_bytes());
                hasher.update([0]);
            }
            listed.push(Listed { kind: kind.clone(), id: id.clone(), digest: digest.clone(), bytes: *bytes });
        }
        (format!("{:x}", hasher.finalize()), listed)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn homes_codes_and_computers() {
        let tmp = tempfile::tempdir().unwrap();
        let mut homes = Homes::open(tmp.path()).unwrap();
        let first = homes.create("  The  study ", None).unwrap();
        assert!(matches!(homes.create("Another", Some(1)), Err(HomeRefusal::Full)));
        let meta = homes.get(&first.home).unwrap();
        assert_eq!(meta.devices[0].name, "The study");
        assert_eq!(homes.admit(&first.home, &first.token).unwrap(), first.device);
        assert!(matches!(homes.admit(&first.home, "nonsense"), Err(HomeRefusal::NotAdmitted)));
        assert!(matches!(homes.admit("nowhere", &first.token), Err(HomeRefusal::NoHome)));

        // A code admits once.
        let (kept, code) = homes.code(&first.home).unwrap();
        assert_eq!(kept.expires - kept.created, CODE_GOOD_FOR);
        let laptop = homes.join(&code.to_lowercase().replace('-', " "), "").unwrap();
        assert_eq!(laptop.home, first.home);
        assert_eq!(homes.get(&first.home).unwrap().devices[1].name, NAMELESS);
        assert!(matches!(homes.join(&code, "again"), Err(HomeRefusal::BadCode)), "good once");
        assert!(homes.get(&first.home).unwrap().codes.is_empty());

        // Five open codes at a time; one withdrawn is good no more.
        let codes: Vec<(Code, String)> = (0..MOST_CODES).map(|_| homes.code(&first.home).unwrap()).collect();
        assert!(matches!(homes.code(&first.home), Err(HomeRefusal::ManyCodes)));
        homes.withdraw(&first.home, &codes[0].0.id).unwrap();
        assert!(matches!(homes.withdraw(&first.home, &codes[0].0.id), Err(HomeRefusal::BadCode)));
        assert!(matches!(homes.join(&codes[0].1, "x"), Err(HomeRefusal::BadCode)));
        // One that has expired admits no one, and is not counted.
        homes.homes.get_mut(&first.home).unwrap().codes[0].expires = now() - 1;
        assert!(matches!(homes.join(&codes[1].1, "x"), Err(HomeRefusal::BadCode)));
        homes.code(&first.home).unwrap();

        homes.rename(&first.home, &laptop.device, " The  laptop ").unwrap();
        assert!(matches!(homes.rename(&first.home, &laptop.device, "  "), Err(HomeRefusal::NoName)));
        assert!(matches!(homes.rename(&first.home, "nobody", "x"), Err(HomeRefusal::NoComputer)));

        // Nothing but hashes on disk, and everything there after a restart.
        let text = std::fs::read_to_string(home_dir(tmp.path(), &first.home).join("home.json")).unwrap();
        assert!(!text.contains(&first.token) && !text.contains(&laptop.token) && !text.contains(&codes[2].1));
        let again = Homes::open(tmp.path()).unwrap();
        assert_eq!(again.admit(&first.home, &laptop.token).unwrap(), laptop.device);
        assert_eq!(again.get(&first.home).unwrap().devices[1].name, "The laptop");

        // The last to leave is told so.
        assert!(!homes.remove(&first.home, &first.device).unwrap());
        assert!(matches!(homes.admit(&first.home, &first.token), Err(HomeRefusal::NotAdmitted)));
        assert!(matches!(homes.remove(&first.home, &first.device), Err(HomeRefusal::NoComputer)));
        assert!(homes.remove(&first.home, &laptop.device).unwrap());
        homes.delete(&first.home).unwrap();
        assert!(homes.is_empty());
        assert!(!home_dir(tmp.path(), &first.home).exists());
    }

    #[test]
    fn a_home_has_sixteen_computers_at_the_most() {
        let tmp = tempfile::tempdir().unwrap();
        let mut homes = Homes::open(tmp.path()).unwrap();
        let first = homes.create("One", None).unwrap();
        for n in 1..MOST_COMPUTERS {
            let (_, code) = homes.code(&first.home).unwrap();
            homes.join(&code, &format!("Computer {n}")).unwrap();
        }
        let (_, code) = homes.code(&first.home).unwrap();
        assert!(matches!(homes.join(&code, "One too many"), Err(HomeRefusal::ManyComputers)));
        homes.remove(&first.home, &first.device).unwrap();
        homes.join(&code, "In its place").unwrap();
    }

    #[test]
    fn kinds_of_documents() {
        for good in ["project", "notebook", "home", "library", "a", "abcdefghijklmnop"] {
            assert!(valid_kind(good), "{good}");
        }
        for bad in ["", "Project", "abcdefghijklmnopq", "..", "a/b", "note-book", "kind1", "é"] {
            assert!(!valid_kind(bad), "{bad}");
        }
    }

    #[test]
    fn the_stamp_of_the_list_changes_with_any_digest() {
        let tmp = tempfile::tempdir().unwrap();
        let listing = Listing::read(tmp.path(), std::iter::empty());
        let (empty, docs) = listing.list("h");
        assert!(docs.is_empty());
        listing.note("h", "project", "p", "d1", 10);
        listing.note("h", "notebook", "the", "d2", 20);
        let (one, docs) = listing.list("h");
        assert_ne!(one, empty);
        assert_eq!(docs.iter().map(|d| d.kind.as_str()).collect::<Vec<_>>(), ["notebook", "project"], "in order");
        listing.note("h", "project", "p", "d3", 10);
        let (two, _) = listing.list("h");
        assert_ne!(two, one);
        listing.note("h", "project", "p", "d1", 10);
        assert_eq!(listing.list("h").0, one, "the same list, the same stamp");
        assert_eq!(listing.count("h"), 2);
        listing.forget("h", "project", "p");
        assert!(!listing.has("h", "project", "p"));
        listing.forget_home("h");
        assert_eq!(listing.list("h").0, empty);
    }
}
