//! Who may enter which room: owners, members and invitations, kept as one
//! JSON file for each room.

use std::collections::HashMap;
use std::io;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::secrets;

pub fn now() -> i64 {
    time::OffsetDateTime::now_utc().unix_timestamp()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Member {
    pub id: String,
    pub name: String,
    /// The hash of the member's token.
    pub token: String,
    pub joined: i64,
    #[serde(default)]
    pub last_seen: i64,
    /// The invitation by which the member came.
    #[serde(default)]
    pub invitation: String,
}

/// An invitation to a project. Its code is told once, when it is made, and
/// kept only as its hash, as tokens are: one who reads the server's disk
/// cannot come in by it. The last four of its signs are kept to tell it by.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Invitation {
    #[serde(default)]
    pub id: String,
    /// The hash of the code.
    #[serde(default)]
    pub hash: String,
    /// Its last four signs.
    #[serde(default)]
    pub hint: String,
    /// The code itself: only where the invitation was just made, and never
    /// written; or as a server before this one wrote it, which is hashed
    /// when it is read.
    #[serde(default, skip_serializing)]
    pub code: String,
    #[serde(default)]
    pub label: String,
    pub created: i64,
    /// After this moment the code admits no one.
    #[serde(default)]
    pub expires: Option<i64>,
    /// How many more may come by the code. None for any number.
    #[serde(default)]
    pub uses_left: Option<u32>,
    #[serde(default)]
    pub used: u32,
}

impl Invitation {
    /// Keeps a code as an invitation keeps it.
    fn keep(&mut self, code: &str) {
        self.hash = secrets::hash(code);
        self.hint = code.chars().rev().take(4).collect::<Vec<_>>().into_iter().rev().collect();
        if self.id.is_empty() {
            self.id = uuid::Uuid::new_v4().to_string();
        }
    }

    pub fn is_open(&self, at: i64) -> bool {
        self.expires.is_none_or(|e| e > at) && self.uses_left.is_none_or(|u| u > 0)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoomMeta {
    pub id: String,
    pub name: String,
    pub created: i64,
    /// The hash of the owner's token.
    pub owner: String,
    #[serde(default)]
    pub members: Vec<Member>,
    #[serde(default)]
    pub invitations: Vec<Invitation>,
}

/// Who a token belongs to.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Who {
    Owner,
    Member(String),
}

#[derive(Debug, thiserror::Error)]
pub enum Refusal {
    #[error("there is no such project on this server")]
    NoRoom,
    #[error("the token is not valid for this project")]
    NotAdmitted,
    #[error("only the owner of the project may do this")]
    NotOwner,
    #[error("the code is not valid: it may have been mistyped, withdrawn, used up, or it has expired")]
    BadCode,
    #[error("a project with this id is already on the server")]
    Exists,
    #[error("the server holds as many projects as it is allowed to")]
    Full,
    #[error("{0}")]
    Invalid(String),
    #[error("the server could not write to its disk: {0}")]
    Io(#[from] io::Error),
}

pub struct Registry {
    dir: PathBuf,
    rooms: HashMap<String, RoomMeta>,
}

pub fn valid_room_id(id: &str) -> bool {
    !id.is_empty()
        && id.len() <= 64
        && id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-')
        && !id.starts_with('-')
}

pub fn room_dir(data: &Path, id: &str) -> PathBuf {
    data.join("rooms").join(id)
}

fn clean(text: &str, limit: usize) -> String {
    text.split_whitespace().collect::<Vec<_>>().join(" ").chars().take(limit).collect()
}

impl Registry {
    pub fn open(data: &Path) -> io::Result<Self> {
        let rooms_dir = data.join("rooms");
        std::fs::create_dir_all(&rooms_dir)?;
        let mut rooms = HashMap::new();
        let mut rewrite = Vec::new();
        for entry in std::fs::read_dir(&rooms_dir)?.flatten() {
            let path = entry.path().join("room.json");
            let Ok(text) = std::fs::read_to_string(&path) else { continue };
            match serde_json::from_str::<RoomMeta>(&text) {
                Ok(mut meta) if valid_room_id(&meta.id) => {
                    // Codes written whole by an earlier server are kept as their hashes from now on.
                    let whole = meta.invitations.iter().any(|i| !i.code.is_empty());
                    for i in meta.invitations.iter_mut().filter(|i| !i.code.is_empty()) {
                        let code = std::mem::take(&mut i.code);
                        i.keep(&code);
                        for m in meta.members.iter_mut().filter(|m| m.invitation == code) {
                            m.invitation = i.id.clone();
                        }
                    }
                    let id = meta.id.clone();
                    rooms.insert(id.clone(), meta);
                    if whole {
                        rewrite.push(id);
                    }
                }
                Ok(_) => tracing::warn!(path = %path.display(), "a room with an id that cannot be is left out"),
                Err(e) => tracing::warn!(path = %path.display(), %e, "a room could not be read"),
            }
        }
        tracing::info!(rooms = rooms.len(), "rooms read");
        let registry = Registry { dir: data.to_owned(), rooms };
        for id in rewrite {
            registry.save(&id)?;
        }
        Ok(registry)
    }

    pub fn len(&self) -> usize {
        self.rooms.len()
    }

    pub fn is_empty(&self) -> bool {
        self.rooms.is_empty()
    }

    fn save(&self, id: &str) -> io::Result<()> {
        let Some(meta) = self.rooms.get(id) else { return Ok(()) };
        let dir = room_dir(&self.dir, id);
        std::fs::create_dir_all(&dir)?;
        let tmp = dir.join(".room.json.tmp");
        std::fs::write(&tmp, serde_json::to_vec_pretty(meta)?)?;
        std::fs::rename(&tmp, dir.join("room.json"))
    }

    pub fn get(&self, id: &str) -> Option<&RoomMeta> {
        self.rooms.get(id)
    }

    /// Makes a room. Returns the owner's token, which is told once.
    pub fn create(&mut self, id: &str, name: &str, limit: Option<usize>) -> Result<String, Refusal> {
        if !valid_room_id(id) {
            return Err(Refusal::Invalid("the id of the project is not one the server can use".into()));
        }
        if self.rooms.contains_key(id) {
            return Err(Refusal::Exists);
        }
        if limit.is_some_and(|l| self.rooms.len() >= l) {
            return Err(Refusal::Full);
        }
        let name = clean(name, 200);
        if name.is_empty() {
            return Err(Refusal::Invalid("the project has no name".into()));
        }
        let token = secrets::token();
        self.rooms.insert(
            id.to_owned(),
            RoomMeta {
                id: id.to_owned(),
                name,
                created: now(),
                owner: secrets::hash(&token),
                members: Vec::new(),
                invitations: Vec::new(),
            },
        );
        self.save(id)?;
        Ok(token)
    }

    /// Tells whose the token is, for a room.
    pub fn admit(&self, room: &str, token: &str) -> Result<Who, Refusal> {
        let meta = self.rooms.get(room).ok_or(Refusal::NoRoom)?;
        let hash = secrets::hash(token);
        if secrets::same(&meta.owner, &hash) {
            return Ok(Who::Owner);
        }
        meta.members
            .iter()
            .find(|m| secrets::same(&m.token, &hash))
            .map(|m| Who::Member(m.id.clone()))
            .ok_or(Refusal::NotAdmitted)
    }

    pub fn require_owner(&self, room: &str, token: &str) -> Result<(), Refusal> {
        match self.admit(room, token) {
            Ok(Who::Owner) => Ok(()),
            Ok(Who::Member(_)) => Err(Refusal::NotOwner),
            Err(e) => Err(e),
        }
    }

    pub fn rename(&mut self, room: &str, name: &str) -> Result<(), Refusal> {
        let name = clean(name, 200);
        if name.is_empty() {
            return Err(Refusal::Invalid("the project has no name".into()));
        }
        self.rooms.get_mut(room).ok_or(Refusal::NoRoom)?.name = name;
        Ok(self.save(room)?)
    }

    pub fn invite(
        &mut self,
        room: &str,
        label: &str,
        uses: Option<u32>,
        hours: Option<u32>,
    ) -> Result<Invitation, Refusal> {
        let at = now();
        let meta = self.rooms.get_mut(room).ok_or(Refusal::NoRoom)?;
        // Codes that admit no one any more are of no use to anyone.
        meta.invitations.retain(|i| i.is_open(at) || i.used > 0);
        if meta.invitations.iter().filter(|i| i.is_open(at)).count() >= 50 {
            return Err(Refusal::Invalid("there are fifty open invitations already; withdraw some".into()));
        }
        let code = secrets::code();
        let mut invitation = Invitation {
            id: String::new(),
            hash: String::new(),
            hint: String::new(),
            code: String::new(),
            label: clean(label, 100),
            created: at,
            expires: hours.filter(|h| *h > 0).map(|h| at + i64::from(h) * 3600),
            uses_left: uses.filter(|u| *u > 0),
            used: 0,
        };
        invitation.keep(&code);
        meta.invitations.push(invitation.clone());
        self.save(room)?;
        // The code is told this once.
        invitation.code = code;
        Ok(invitation)
    }

    /// Withdraws an invitation, by its id.
    pub fn withdraw(&mut self, room: &str, invitation: &str) -> Result<(), Refusal> {
        let meta = self.rooms.get_mut(room).ok_or(Refusal::NoRoom)?;
        let before = meta.invitations.len();
        meta.invitations.retain(|i| i.id != invitation);
        if meta.invitations.len() == before {
            return Err(Refusal::BadCode);
        }
        Ok(self.save(room)?)
    }

    /// Admits whoever presents a code. Returns the room and the member's
    /// token, which is told once.
    pub fn join(&mut self, code: &str, name: &str) -> Result<(RoomMeta, String, String), Refusal> {
        let code = secrets::normalise_code(code);
        if code.len() != 14 {
            return Err(Refusal::BadCode);
        }
        let hashed = secrets::hash(&code);
        let at = now();
        let room = self
            .rooms
            .values()
            .find(|r| r.invitations.iter().any(|i| secrets::same(&i.hash, &hashed) && i.is_open(at)))
            .map(|r| r.id.clone())
            .ok_or(Refusal::BadCode)?;
        let name = clean(name, 100);
        let token = secrets::token();
        let id = uuid::Uuid::new_v4().to_string();
        let meta = self.rooms.get_mut(&room).expect("the room was found a moment ago");
        let mut by = String::new();
        if let Some(i) = meta.invitations.iter_mut().find(|i| secrets::same(&i.hash, &hashed)) {
            i.used += 1;
            if let Some(left) = i.uses_left.as_mut() {
                *left = left.saturating_sub(1);
            }
            by = i.id.clone();
        }
        meta.members.push(Member {
            id: id.clone(),
            name: if name.is_empty() { "A collaborator".into() } else { name },
            token: secrets::hash(&token),
            joined: at,
            last_seen: at,
            invitation: by,
        });
        let result = meta.clone();
        self.save(&room)?;
        Ok((result, id, token))
    }

    pub fn remove_member(&mut self, room: &str, member: &str) -> Result<(), Refusal> {
        let meta = self.rooms.get_mut(room).ok_or(Refusal::NoRoom)?;
        let before = meta.members.len();
        meta.members.retain(|m| m.id != member);
        if meta.members.len() == before {
            return Err(Refusal::Invalid("there is no such collaborator".into()));
        }
        Ok(self.save(room)?)
    }

    pub fn seen(&mut self, room: &str, member: &str) {
        if let Some(m) = self.rooms.get_mut(room).and_then(|r| r.members.iter_mut().find(|m| m.id == member)) {
            m.last_seen = now();
            let _ = self.save(room);
        }
    }

    /// Takes a room off the server, with everything in it.
    pub fn delete(&mut self, room: &str) -> Result<(), Refusal> {
        self.rooms.remove(room).ok_or(Refusal::NoRoom)?;
        let dir = room_dir(&self.dir, room);
        if dir.exists() {
            std::fs::remove_dir_all(dir)?;
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const ROOM: &str = "0a1b2c3d-0000-4000-8000-000000000001";

    #[test]
    fn rooms_codes_and_members() {
        let tmp = tempfile::tempdir().unwrap();
        let mut r = Registry::open(tmp.path()).unwrap();
        let owner = r.create(ROOM, "  Wrath and  the hero ", None).unwrap();
        assert_eq!(r.get(ROOM).unwrap().name, "Wrath and the hero");
        assert!(matches!(r.create(ROOM, "Again", None), Err(Refusal::Exists)));
        assert!(matches!(r.create("../x", "Bad", None), Err(Refusal::Invalid(_))));
        assert!(matches!(r.create("other", "One too many", Some(1)), Err(Refusal::Full)));

        assert_eq!(r.admit(ROOM, &owner).unwrap(), Who::Owner);
        assert!(matches!(r.admit(ROOM, "nonsense"), Err(Refusal::NotAdmitted)));
        assert!(matches!(r.admit("nowhere", &owner), Err(Refusal::NoRoom)));

        let once = r.invite(ROOM, "for Anna", Some(1), None).unwrap();
        let (meta, id, token) = r.join(&once.code.to_lowercase().replace('-', " "), " Anna ").unwrap();
        assert_eq!(meta.id, ROOM);
        assert_eq!(r.admit(ROOM, &token).unwrap(), Who::Member(id.clone()));
        assert!(matches!(r.require_owner(ROOM, &token), Err(Refusal::NotOwner)));
        assert!(matches!(r.join(&once.code, "Another"), Err(Refusal::BadCode)), "the code was for one");
        assert!(matches!(r.join("AAAA-BBBB-CCCC", "x"), Err(Refusal::BadCode)));
        assert!(matches!(r.join("short", "x"), Err(Refusal::BadCode)));

        let many = r.invite(ROOM, "", None, Some(24)).unwrap();
        r.join(&many.code, "B").unwrap();
        r.join(&many.code, "").unwrap();
        assert_eq!(r.get(ROOM).unwrap().members.len(), 3);
        assert_eq!(r.get(ROOM).unwrap().members[2].name, "A collaborator");
        assert!(matches!(r.withdraw(ROOM, &many.code), Err(Refusal::BadCode)), "withdrawn by its id");
        r.withdraw(ROOM, &many.id).unwrap();
        assert!(matches!(r.join(&many.code, "C"), Err(Refusal::BadCode)));
        assert_eq!(many.hint, &many.code[10..]);

        r.remove_member(ROOM, &id).unwrap();
        assert!(matches!(r.admit(ROOM, &token), Err(Refusal::NotAdmitted)));

        // Nothing but hashes of tokens and codes is on disk, and everything is there after a restart.
        let text = std::fs::read_to_string(room_dir(tmp.path(), ROOM).join("room.json")).unwrap();
        assert!(!text.contains(&owner) && !text.contains(&token));
        assert!(!text.contains(&once.code) && !text.contains(&many.code), "{text}");
        let again = Registry::open(tmp.path()).unwrap();
        assert_eq!(again.admit(ROOM, &owner).unwrap(), Who::Owner);
        assert_eq!(again.get(ROOM).unwrap().members.len(), 2);
    }

    #[test]
    fn codes_an_earlier_server_wrote_whole_are_hashed_when_read() {
        let tmp = tempfile::tempdir().unwrap();
        let dir = room_dir(tmp.path(), ROOM);
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(
            dir.join("room.json"),
            format!(
                r#"{{"id":"{ROOM}","name":"Old","created":0,"owner":"{}",
                "members":[{{"id":"m1","name":"Anna","token":"x","joined":0,"invitation":"ABCD-EFGH-JKMN"}}],
                "invitations":[{{"code":"ABCD-EFGH-JKMN","label":"old","created":0,"used":1}}]}}"#,
                secrets::hash("owner")
            ),
        )
        .unwrap();
        let mut r = Registry::open(tmp.path()).unwrap();
        let text = std::fs::read_to_string(dir.join("room.json")).unwrap();
        assert!(!text.contains("ABCD-EFGH-JKMN"), "{text}");
        let meta = r.get(ROOM).unwrap();
        assert_eq!(meta.invitations[0].hint, "JKMN");
        assert_eq!(meta.members[0].invitation, meta.invitations[0].id);
        // The code goes on admitting those it admitted before.
        r.join("abcd efgh jkmn", "Björn").unwrap();
    }

    #[test]
    fn a_code_that_has_expired() {
        let tmp = tempfile::tempdir().unwrap();
        let mut r = Registry::open(tmp.path()).unwrap();
        r.create(ROOM, "A", None).unwrap();
        let i = r.invite(ROOM, "", None, Some(1)).unwrap();
        r.rooms.get_mut(ROOM).unwrap().invitations[0].expires = Some(now() - 1);
        assert!(matches!(r.join(&i.code, "x"), Err(Refusal::BadCode)));
        r.delete(ROOM).unwrap();
        assert!(r.is_empty());
        assert!(!room_dir(tmp.path(), ROOM).exists());
    }
}
