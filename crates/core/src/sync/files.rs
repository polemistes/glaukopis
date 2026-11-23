//! The files of the store follow their records (record 0120). The store is
//! by the SHA-256 of what each file holds, and every file in it has a
//! record (`library`): the files of the library, the images of the projects,
//! the files the notes hold. Once the records here and in the home are the
//! same, by the records of the library's document:
//!
//! - a file the home holds that no record names any more is taken off the
//!   server;
//! - one a record names that is here and that the home does not hold is
//!   sent;
//! - one a record names that the home holds and that is not here is fetched.
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
//! The order (the addendum of 2026-11-23 to record 0120). What is taken off
//! the server goes first, since it makes room there. Then the files are
//! sent and fetched in one order, whichever way each goes: those the notes
//! hold before the library's, and of each the smaller before the larger
//! (`in_order`). So a picture of a note is never behind a scan of hundreds
//! of megabytes, to be sent or to be fetched, and where the home has not
//! room for everything, it is the large files of the library that stay
//! behind.
//!
//! A home holds so much and no more. Before a file is sent, it is asked how
//! much the home holds and may hold: a file that does not fit is passed
//! over, and it is said that the server is full, at every round for as long
//! as it is so (`Told::full`). The server would refuse such a file before
//! all of it was sent and close the connection, which a proxy in front of
//! it tells as an answer of its own, and the application could not tell
//! that from a server that is not reached. A file that does not fit is
//! offered again whenever the files are looked at: when the library
//! changes, when the writer asks for a round, and at the next start.
//!
//! What fails for one file is said, and the others go on; what fails for
//! the server as a whole ends it. A file whose sending or fetching fails as
//! the network fails may be either, so the home is asked at once how it
//! stands, a small thing to ask. Where that fails as well, the server is
//! not reached, and the round ends. Where it is answered, the failure was
//! the file's own: it is said and tried again at the next round, and
//! nothing as large goes the same way in this one, since each try may send
//! much before it fails. So a file that cannot be sent does not hold back
//! what is to be fetched, and a network that is away ends the round at the
//! second thing asked of it.
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

use super::engine::sentence;
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
    /// The files that were not sent when the files were last looked at,
    /// because the home has not room for them. They are offered again
    /// each time the files are looked at, and while there are any, every
    /// round says that the server is full (`full`).
    full: BTreeSet<String>,
}

impl Told {
    /// That the server is full, in words, while files are not sent for it:
    /// one of the problems of every round, whether the files were looked
    /// at in it or not, so that it is not said for half a minute and then
    /// taken for mended.
    pub fn full(&self) -> Option<String> {
        (!self.full.is_empty()).then(|| tr!("core-sync-server-full", count = self.full.len()))
    }
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

/// Which way a file goes.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Way {
    Sent,
    Fetched,
}

/// A file that is to be sent or fetched.
#[derive(Debug, Clone, PartialEq, Eq)]
struct Due<'a> {
    hash: &'a str,
    way: Way,
    /// How much it holds: on the disk here, or as the home says of it.
    size: u64,
    /// Whether the notes hold it.
    notes: bool,
}

/// Puts the files that are to be sent and fetched in the order in which it
/// is done: those the notes hold before the library's, and of each the
/// smaller before the larger, whichever way they go. What a writer put
/// into a note is small and looked at soon; and where not everything can
/// be done, for a home that is full or a network that goes, it is the
/// large files that are left.
fn in_order(due: &mut [Due]) {
    due.sort_by(|a, b| (!a.notes, a.size, a.hash).cmp(&(!b.notes, b.size, b.hash)));
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
/// the records of the library's document say, in the order the head of
/// this file gives. `note` writes into the map `stored` of the document: a
/// size where the home holds the file, nothing where it does not.
/// `written` counts how often the library's files were written by keeping
/// what came (`Library::writes`). `takes` is what this device takes of its
/// home: one that takes the notes fetches the files the notes hold and no
/// others, and takes none off the server. What fails for one file is said
/// and the rest go on; what fails for the server as a whole ends it.
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

    match takes {
        // First, since it makes room in the home for what is to be sent.
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

    let mut due: Vec<Due> = Vec::new();
    // How much more the files of the home may hold, where the server says.
    let mut room: Option<u64> = None;
    let offered: Vec<&str> = named
        .keys()
        .copied()
        .filter(|hash| here.contains_key(hash) && !stored.contains_key(*hash) && !told.too_large.contains(*hash))
        .collect();
    if !offered.is_empty() {
        let (there, most) = home.files()?;
        let used: u64 = there.iter().map(|file| file.size).sum();
        room = home.holds_at_most()?.map(|most| most.saturating_sub(used));
        let there: BTreeSet<&str> = there.iter().map(|f| f.hash.as_str()).collect();
        for hash in offered {
            let size = here[hash].1;
            let name = &named[hash].name;
            if there.contains(hash) {
                note(hash, Some(&size.to_string()))?;
                continue;
            }
            if size > most {
                // Said before it is sent: a server that refuses what is on its way may not be heard.
                if told.too_large.insert(hash.to_owned()) {
                    tracing::info!(hash, size, most, "a file is larger than the server takes, and is not sent");
                    say(tr!("core-sync-file-too-large", name = name.as_str(), most = most >> 20));
                }
                continue;
            }
            due.push(Due { hash, way: Way::Sent, size, notes: named[hash].notes });
        }
    }
    // Whether a file a record names is one this device fetches: a computer
    // every one, a phone those whose record says that the notes hold them.
    let fetched = |file: &Named| match takes {
        Takes::Everything => true,
        Takes::Notes => file.notes,
    };
    for (hash, size) in &stored {
        let hash = hash.as_str();
        if let Some(file) = named.get(hash).filter(|file| fetched(file))
            && !here.contains_key(hash)
        {
            due.push(Due { hash, way: Way::Fetched, size: size.parse().unwrap_or(u64::MAX), notes: file.notes });
        }
    }
    in_order(&mut due);

    // What could not be done with a file, in words.
    let failed = |file: &Due, why: String| {
        let name = named[file.hash].name.as_str();
        match file.way {
            Way::Sent => tr!("core-sync-file-not-sent", name = name, why = why),
            Way::Fetched => tr!("core-sync-file-not-fetched", name = name, why = why),
        }
    };
    // The files that are not sent in this round because the home has not room for them.
    let mut full: BTreeSet<String> = BTreeSet::new();
    // How much a file held whose sending, or whose fetching, failed in this
    // round as the network fails while the server answered: nothing as
    // large goes the same way in the round.
    let (mut sent_below, mut fetched_below): (Option<u64>, Option<u64>) = (None, None);
    for file in &due {
        if file.way == Way::Sent && room.is_some_and(|room| file.size > room) {
            // Said before it is sent, as a file too large is.
            full.insert(file.hash.to_owned());
            continue;
        }
        let below = match file.way {
            Way::Sent => &mut sent_below,
            Way::Fetched => &mut fetched_below,
        };
        if below.is_some_and(|below| file.size >= below) {
            continue;
        }
        let came = match file.way {
            Way::Sent => home.send_file(file.hash, &here[file.hash].0),
            Way::Fetched => fetch(home, library, &dir, file.hash, file.size, written),
        };
        let came = match came {
            // As the network fails: the file's own failure, or the server
            // not reached? The home is asked how it stands, which is a
            // small thing to ask.
            Err(Error::Network(why)) => {
                match home.holds_at_most() {
                    Err(error) if refused_entry(&error) => return Err(error),
                    // The server is not reached: the round ends.
                    Err(Error::Network(_)) => return Err(Error::Network(why)),
                    _ => {}
                }
                // The server answers: it was this file's own. It is tried
                // again at the next round, and what is as large waits for
                // it: what cuts one off on its way most often does so by
                // how much it holds, and each try may send much before it
                // fails. What goes the other way is not held back by it.
                tracing::warn!(hash = file.hash, way = ?file.way, %why, "a file failed as the network fails while the server answers");
                say(failed(file, sentence(&why)));
                done.again = true;
                *below = Some(file.size);
                continue;
            }
            Err(error) if refused_entry(&error) => return Err(error),
            came => came,
        };
        match (file.way, came) {
            (Way::Sent, Ok(())) => {
                note(file.hash, Some(&file.size.to_string()))?;
                room = room.map(|room| room.saturating_sub(file.size));
            }
            // Another device filled the home since it was asked: this file
            // does not fit, and nothing as large is offered in this round.
            (Way::Sent, Err(Error::Refused { kind: "full", .. })) => {
                full.insert(file.hash.to_owned());
                let less = file.size.saturating_sub(1);
                room = Some(room.map_or(less, |room| room.min(less)));
            }
            (Way::Sent, Err(Error::Refused { kind: "too-large", message })) => {
                told.too_large.insert(file.hash.to_owned());
                say(failed(file, message));
            }
            (Way::Fetched, Ok(())) => {}
            // The home holds it no more: whoever has it sends it again.
            (Way::Fetched, Err(Error::Refused { kind: "no-file", .. })) => note(file.hash, None)?,
            (way, Err(error)) => {
                tracing::warn!(%error, hash = file.hash, ?way, "a file could not be sent or fetched");
                say(failed(file, error.to_string()));
                done.again = true;
            }
        }
    }

    // In the log once, when it is so and when more files are left by it,
    // not at every round.
    if full.iter().any(|hash| !told.full.contains(hash)) {
        tracing::warn!(files = full.len(), room = ?room, "the home has not room for every file: those that do not fit are not sent");
    } else if full.is_empty() && !told.full.is_empty() {
        tracing::info!("the home has room for every file again");
    }
    told.full = full;
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
    matches!(error, Error::Network(_)) || refused_entry(error)
}

/// Whether the server lets this computer into its home no more.
fn refused_entry(error: &Error) -> bool {
    matches!(error, Error::Refused { kind, .. } if matches!(*kind, "not-admitted" | "no-room" | "no-home" | "no-server"))
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
    fn the_files_of_the_notes_go_first_and_the_smaller_before_the_larger_whichever_way_they_go() {
        let due = |hash: &'static str, way: Way, size: u64, notes: bool| Due { hash, way, size, notes };
        let mut files = vec![
            due("scan", Way::Sent, 700 << 20, false),
            due("photograph", Way::Sent, 4 << 20, true),
            due("article", Way::Fetched, 2 << 20, false),
            due("sketch", Way::Fetched, 30 << 10, true),
            due("letter", Way::Sent, 12 << 10, false),
            // One the home says no size of is fetched last of its kind.
            due("unsized", Way::Fetched, u64::MAX, true),
            due("b", Way::Sent, 1, false),
            due("a", Way::Fetched, 1, false),
        ];
        in_order(&mut files);
        let order: Vec<&str> = files.iter().map(|file| file.hash).collect();
        assert_eq!(order, ["sketch", "photograph", "unsized", "a", "b", "letter", "article", "scan"]);
    }

    #[test]
    fn a_full_server_is_said_for_as_long_as_files_are_left_by_it() {
        let mut told = Told::default();
        assert_eq!(told.full(), None);
        told.full.insert("one".into());
        let one = told.full().expect("it is said");
        told.full.insert("two".into());
        let two = told.full().expect("it is said");
        assert!(two.contains('2'), "{two}");
        assert_ne!(one, two, "one file is said otherwise than several");
        told.full.clear();
        assert_eq!(told.full(), None);
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
