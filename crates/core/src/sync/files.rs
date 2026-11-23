//! The files of the store follow their records (record 0120). The store is
//! by the SHA-256 of what each file holds, and every file in it has a
//! record (`library`): the files of the library, the images of the projects,
//! the files the notes hold. Once the records here and in the home are the
//! same, by the records of the library's document:
//!
//! - a file a record names that is here and that the home does not hold is
//!   sent;
//! - one a record names that the home holds and that is not here is fetched;
//! - one the home holds that no record names any more is taken off the server.
//!
//! So on a device that takes everything of its home, a computer. One that
//! takes the notes, a phone (`Takes`), holds the files its notes hold and no
//! others, and does not hold what the home holds:
//!
//! - a file is sent as on a computer;
//! - one is fetched only where its record says, besides, that the notes hold
//!   it (`<hash>/notebook`, beside the library or alone);
//! - none is taken off the server, ever: a file no record names lies there
//!   until a computer of the home makes a round.
//!
//! What the home holds is said in the map `stored` of the library's
//! document, by the computer that sent a file or found it there, so that a
//! computer knows what there is to fetch without asking, and a round in
//! which nothing changed asks nothing of the files at all.
//!
//! A file is sent from the disk and fetched to the disk a piece at a time,
//! never held whole: one may hold hundreds of megabytes. What is fetched is
//! written under another name in the folder where it is to stand, and given
//! its own by the library (`Library::keep_arrived`) when it is whole and
//! holds what its name says. A file larger than the server takes is not
//! sent, and said once in a run. The library is held only while something
//! is looked up or kept, never while the network is waited for.

use std::cell::Cell;
use std::collections::{BTreeMap, BTreeSet};
use std::fs::File;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, MutexGuard, PoisonError};

use sha2::{Digest, Sha256};

use crate::error::{Error, Result};
use crate::library::{Library, attachments};
use crate::tr;

use super::hex;
use super::home::HomeDoc;
use super::kept::Takes;
use super::library::{RECORD, STORED};
use super::remote::Home;

fn locked(library: &Mutex<Library>) -> MutexGuard<'_, Library> {
    library.lock().unwrap_or_else(PoisonError::into_inner)
}

/// What a run keeps in memory of the files between rounds.
#[derive(Debug, Default)]
pub struct Told {
    /// The files found larger than the server takes: said once in a run,
    /// and not offered again in it.
    too_large: BTreeSet<String>,
}

/// What came of bringing the files to be the same.
#[derive(Debug, Default)]
pub struct Done {
    /// What could not be done, in words, each once.
    pub problems: Vec<String>,
    /// Whether something is to be tried again at the next round.
    pub again: bool,
}

/// A file a record names, as the library's document says it.
struct Named {
    name: String,
    /// Whether the record says that the notes hold it, beside the library or alone.
    notes: bool,
}

/// Writes what is fetched to its file, and works out what it holds as it does.
struct Hashing {
    file: File,
    hasher: Sha256,
}

impl Write for Hashing {
    fn write(&mut self, piece: &[u8]) -> std::io::Result<usize> {
        let written = self.file.write(piece)?;
        self.hasher.update(&piece[..written]);
        Ok(written)
    }

    fn flush(&mut self) -> std::io::Result<()> {
        self.file.flush()
    }
}

/// Takes away what was being fetched and did not become a file, with the
/// folders it leaves empty.
fn clear(arrived: &Path) {
    let _ = std::fs::remove_file(arrived);
    let mut dir = arrived.parent();
    for _ in 0..2 {
        let Some(at) = dir else { break };
        if std::fs::remove_dir(at).is_err() {
            break;
        }
        dir = at.parent();
    }
}

/// Brings the files of the store here and in the home to be the same, as
/// the records of the library's document say. `note` writes into the map
/// `stored` of the document: a size where the home holds the file, nothing
/// where it does not. `written` counts how often the library's files were
/// written by keeping what came (`Library::writes`). `takes` is what this
/// device takes of its home: one that takes the notes fetches the files
/// the notes hold and no others, and takes none off the server. What fails
/// for one file is said and the rest go on; what fails for the server as a
/// whole ends it.
pub fn bring(
    home: &Home,
    library: &Mutex<Library>,
    doc: &HomeDoc,
    told: &mut Told,
    note: &dyn Fn(&str, Option<&str>) -> Result<()>,
    written: &Cell<u64>,
    takes: Takes,
) -> Result<Done> {
    let records = doc.map("files");
    let named: BTreeMap<&str, Named> = records
        .keys()
        .filter_map(|name| name.strip_suffix(&format!("/{RECORD}")))
        .filter(|hash| attachments::is_hash(hash))
        .map(|hash| {
            let name = records.get(&format!("{hash}/name")).cloned().unwrap_or_default();
            let notes = matches!(records.get(&format!("{hash}/notebook")).map(String::as_str), Some("also" | "only"));
            (hash, Named { name, notes })
        })
        .collect();
    let stored = doc.map(STORED);
    // Where each lies here, with its size, looked up at once.
    let (dir, here): (PathBuf, BTreeMap<&str, (PathBuf, u64)>) = {
        let library = locked(library);
        let here = named
            .keys()
            .filter_map(|hash| {
                let path = library.stored_path(hash)?;
                let size = path.metadata().ok()?.len();
                Some((*hash, (path, size)))
            })
            .collect();
        (library.dir().to_owned(), here)
    };
    let mut done = Done::default();
    let mut say = |problem: String| {
        if !done.problems.contains(&problem) {
            done.problems.push(problem);
        }
    };

    let to_send: Vec<&str> = named
        .keys()
        .copied()
        .filter(|hash| here.contains_key(hash) && !stored.contains_key(*hash) && !told.too_large.contains(*hash))
        .collect();
    if !to_send.is_empty() {
        let (there, most) = home.files()?;
        let there: BTreeSet<&str> = there.iter().map(|f| f.hash.as_str()).collect();
        for hash in to_send {
            let (path, size) = &here[hash];
            let name = &named[hash].name;
            if there.contains(hash) {
                note(hash, Some(&size.to_string()))?;
                continue;
            }
            if *size > most {
                // Said before it is sent: a server that refuses what is on its way may not be heard.
                if told.too_large.insert(hash.to_owned()) {
                    tracing::info!(hash, size, most, "a file is larger than the server takes, and is not sent");
                    say(tr!("core-sync-file-too-large", name = name.as_str(), most = most >> 20));
                }
                continue;
            }
            match home.send_file(hash, path) {
                Ok(()) => note(hash, Some(&size.to_string()))?,
                Err(error) if of_the_server(&error) => return Err(error),
                Err(Error::Refused { kind: "too-large", message }) => {
                    told.too_large.insert(hash.to_owned());
                    say(tr!("core-sync-file-not-sent", name = name.as_str(), why = message));
                }
                Err(error) => {
                    tracing::warn!(%error, hash, "a file could not be sent");
                    say(tr!("core-sync-file-not-sent", name = name.as_str(), why = error.to_string()));
                    done.again = true;
                }
            }
        }
    }

    // Whether a file a record names is one this device fetches: a computer
    // every one, a phone those whose record says that the notes hold them.
    let fetched = |file: &Named| match takes {
        Takes::Everything => true,
        Takes::Notes => file.notes,
    };
    for (hash, size) in stored.iter().filter(|(hash, _)| {
        named.get(hash.as_str()).is_some_and(fetched) && !here.contains_key(hash.as_str())
    }) {
        let name = &named[hash.as_str()].name;
        let limit = size.parse::<u64>().unwrap_or(u64::MAX);
        match fetch(home, library, &dir, hash, limit, written) {
            Ok(()) => {}
            Err(error) if of_the_server(&error) => return Err(error),
            // The home holds it no more: whoever has it sends it again.
            Err(Error::Refused { kind: "no-file", .. }) => note(hash, None)?,
            Err(error) => {
                tracing::warn!(%error, hash, "a file could not be fetched");
                say(tr!("core-sync-file-not-fetched", name = name.as_str(), why = error.to_string()));
                done.again = true;
            }
        }
    }

    match takes {
        Takes::Everything => {
            for hash in stored.keys().filter(|hash| !named.contains_key(hash.as_str())) {
                match home.delete_file(hash) {
                    Ok(()) => note(hash, None)?,
                    Err(error) if of_the_server(&error) => return Err(error),
                    Err(error) => {
                        tracing::warn!(%error, hash, "a file no record names could not be taken off the server");
                        done.again = true;
                    }
                }
            }
        }
        // A phone takes nothing off the server: it does not hold what the
        // home holds, and a record it lacks says nothing of the file.
        Takes::Notes => {}
    }
    Ok(done)
}

/// Fetches one file to the disk and has the library keep it.
fn fetch(home: &Home, library: &Mutex<Library>, dir: &Path, hash: &str, limit: u64, written: &Cell<u64>) -> Result<()> {
    let arrived = attachments::arriving(dir, hash)?;
    let fetched = (|| {
        let file = File::create(&arrived).map_err(|e| Error::io(tr!("io-creating", path = &arrived), e))?;
        let mut into = Hashing { file, hasher: Sha256::new() };
        home.fetch_file(hash, &mut into, &arrived, limit)?;
        // On the disk before it is given its name, as the store keeps every file.
        into.file.sync_all().map_err(|e| Error::io(tr!("io-flushing", path = &arrived), e))?;
        if hex(&into.hasher.finalize()) != hash {
            tracing::warn!(hash, "a file the server gave is not the one its record names");
            return Err(Error::invalid(tr!("core-sync-file-not-as-named")));
        }
        let mut library = locked(library);
        let before = library.writes();
        let kept = library.keep_arrived(hash, &arrived);
        written.set(written.get() + library.writes().saturating_sub(before));
        kept
    })();
    if fetched.is_err() {
        clear(&arrived);
    }
    fetched
}

/// Whether the server as a whole did not answer, or lets this computer in
/// no more: what ends a round.
fn of_the_server(error: &Error) -> bool {
    matches!(error, Error::Network(_))
        || matches!(error, Error::Refused { kind, .. } if matches!(*kind, "not-admitted" | "no-room" | "no-home" | "no-server"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn what_is_fetched_is_written_and_hashed_as_it_comes() {
        let tmp = tempfile::tempdir().unwrap();
        let path = tmp.path().join("arriving");
        let mut into = Hashing { file: File::create(&path).unwrap(), hasher: Sha256::new() };
        into.write_all(b"Sing, goddess, ").unwrap();
        into.write_all(b"the wrath").unwrap();
        assert_eq!(hex(&into.hasher.finalize()), attachments::hash_bytes(b"Sing, goddess, the wrath"));
        assert_eq!(std::fs::read(&path).unwrap(), b"Sing, goddess, the wrath");
    }

    #[test]
    fn what_did_not_become_a_file_is_cleared_away_with_its_folders() {
        let tmp = tempfile::tempdir().unwrap();
        let hash = attachments::hash_bytes(b"never whole");
        let arrived = attachments::arriving(tmp.path(), &hash).unwrap();
        std::fs::write(&arrived, b"never").unwrap();
        clear(&arrived);
        assert!(!arrived.exists());
        assert!(!arrived.parent().unwrap().exists(), "the folder of the hash");
        assert!(tmp.path().join(attachments::DIR).exists(), "the store itself stays");
    }
}
