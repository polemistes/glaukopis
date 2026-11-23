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
//! Of what a home may hold, a tenth is kept for the files the notes hold,
//! and no more than a gibibyte (`kept_for_notes`): the other files stop
//! that far short of the limit. The order puts the notes' files first in
//! one round only, and a library larger than its home would fill the home
//! in the first, so that no picture put into a note afterwards, on any
//! device, found room. Where files of the notes wait for room all the
//! same, it is said of them apart.
//!
//! What fails for one file is said, and the others go on; what fails for
//! the server as a whole ends it. A file whose sending or fetching fails as
//! the network fails may be either, so the home is asked at once how it
//! stands, a small thing to ask. Where that fails as well, the server is
//! not reached, and the round ends. Where it is answered, the failure was
//! the file's own: it is said, and nothing as large goes the same way in
//! this round, since each try may send much before it fails. The file then
//! waits before it is tried again, one round, then two, then four, and is
//! said the while (`Failing`), so that those as large go in the rounds
//! between: tried at every round it would fail first at every round, and
//! hold them back for good. So a file that cannot be sent does not hold
//! back what is to be fetched, nor for long what is to be sent, and a
//! network that is away ends the round at the second thing asked of it.
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
    /// because the home has not room for them, each with whether the
    /// notes hold it. They are offered again each time the files are
    /// looked at, and while there are any, every round says that the
    /// server is full (`full`).
    full: BTreeMap<String, bool>,
    /// How many times the files were looked at in this run.
    looks: u64,
    /// The files whose sending or fetching failed as the network fails
    /// while the server answered, each until it goes through (`Failing`).
    failing: BTreeMap<String, Failing>,
}

/// A file whose sending or fetching failed as the network fails while the
/// server answered. It waits before it is tried again, longer each time it
/// fails so: were it tried at every round, it would fail first at every
/// round, the order being the same, and hold back for good every file as
/// large that goes the same way.
#[derive(Debug)]
struct Failing {
    /// How many times running it has failed so.
    times: u32,
    /// At which look at the files it is tried again.
    again_at: u64,
    /// What is said of it, at every look for as long as it waits.
    said: String,
}

/// How many looks at the files a file is passed over after it failed for
/// the `times`th time running: one, then two, four, and so on to
/// sixty-four, which is about half an hour at the pace of the rounds.
fn passed_over(times: u32) -> u64 {
    1 << times.saturating_sub(1).min(6)
}

impl Told {
    /// That the server is full, in words, while files are not sent for it:
    /// among the problems of every round, whether the files were looked
    /// at in it or not, so that it is not said for half a minute and then
    /// taken for mended. The files the notes hold are said apart, and
    /// first: they are few, and what the writer misses on another device.
    pub fn full(&self) -> Vec<String> {
        let of_notes = self.full.values().filter(|notes| **notes).count();
        let others = self.full.len() - of_notes;
        let mut said = Vec::new();
        if of_notes > 0 {
            said.push(tr!("core-sync-server-full-notes", count = of_notes));
        }
        if others > 0 {
            said.push(tr!("core-sync-server-full", count = others));
        }
        said
    }
}

/// How much of what the files of a home may hold together is kept for the
/// files the notes hold: a tenth, and no more than a gibibyte. The other
/// files stop that far short of the limit.
///
/// The order of a round puts the notes' files first, but that is one
/// round: a library larger than its home fills the home in the first, and
/// from then on a picture put into a note finds no room, on whichever
/// device it is taken. What the notes hold is small beside a library and
/// is what a writer looks for on a phone, so room is kept for it. It is a
/// share and no fixed amount, since a home may be set to hold little; and
/// no more than a gibibyte, since a home may be set to hold very much.
fn kept_for_notes(most: u64) -> u64 {
    (most / 10).min(1 << 30)
}

/// The room the files of a home have, where the server says what a home may hold.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Room {
    /// How much more the home may hold.
    left: u64,
    /// How much of that is kept for the files the notes hold: what is
    /// kept for them of the whole (`kept_for_notes`), less what their
    /// files in the home hold already.
    for_notes: u64,
}

impl Room {
    /// The room of a home that may hold `most`, whose files hold `used`
    /// together, `of_notes` of it in files the notes hold.
    fn of(most: u64, used: u64, of_notes: u64) -> Room {
        Room { left: most.saturating_sub(used), for_notes: kept_for_notes(most).saturating_sub(of_notes) }
    }

    /// Whether there is room for a file: one the notes hold may take all
    /// that is left, another only what is not kept for the notes.
    fn takes(&self, file: &Due) -> bool {
        let kept = if file.notes { 0 } else { self.for_notes };
        file.size.saturating_add(kept) <= self.left
    }

    /// The file was sent.
    fn took(&mut self, file: &Due) {
        self.left = self.left.saturating_sub(file.size);
        if file.notes {
            self.for_notes = self.for_notes.saturating_sub(file.size);
        }
    }

    /// The server refused the file for want of room, though there seemed
    /// to be room: another device filled the home meanwhile. Nothing as
    /// large is offered in this round.
    fn refused(&mut self, file: &Due) {
        let kept = if file.notes { 0 } else { self.for_notes };
        self.left = self.left.min(file.size.saturating_add(kept).saturating_sub(1));
    }
}

/// What came of bringing the files to be the same.
#[derive(Debug, Default)]
pub struct Done {
    /// What could not be done, in words, each once.
    pub problems: Vec<String>,
    /// Whether something is to be tried again at the next round.
    pub again: bool,
    /// Whether a file was left that is to be tried again within the half
    /// minute also where the app is not in front (`Wake::at_most`): one
    /// that could not be sent, fetched or taken off the server for its own
    /// sake. Not one that failed as the network fails: before such a file
    /// was told from a server not reached, it ended the round, and a phone
    /// that is not in front asked nothing more; it still asks nothing, and
    /// tries the file when it comes to the front or is written in.
    pub left: bool,
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
                        done.left = true;
                    }
                }
            }
        }
        // A phone takes nothing off the server: it does not hold what the
        // home holds, and a record it lacks says nothing of the file.
        Takes::Notes => {}
    }

    let mut due: Vec<Due> = Vec::new();
    // The room the files of the home have, where the server says what it may hold.
    let mut room: Option<Room> = None;
    let offered: Vec<&str> = named
        .keys()
        .copied()
        .filter(|hash| here.contains_key(hash) && !stored.contains_key(*hash) && !told.too_large.contains(*hash))
        .collect();
    if !offered.is_empty() {
        let (there, most) = home.files()?;
        let used: u64 = there.iter().map(|file| file.size).sum();
        let of_notes: u64 = there
            .iter()
            .filter(|file| named.get(file.hash.as_str()).is_some_and(|named| named.notes))
            .map(|file| file.size)
            .sum();
        room = home.holds_at_most()?.map(|most| Room::of(most, used, of_notes));
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
    told.looks += 1;
    let look = told.looks;
    // What failed before and is to be done no more, as a file that left the library, is forgotten.
    told.failing.retain(|hash, _| due.iter().any(|file| file.hash == hash));

    // What could not be done with a file, in words.
    let failed = |file: &Due, why: String| {
        let name = named[file.hash].name.as_str();
        match file.way {
            Way::Sent => tr!("core-sync-file-not-sent", name = name, why = why),
            Way::Fetched => tr!("core-sync-file-not-fetched", name = name, why = why),
        }
    };
    // The files that are not sent in this round because the home has not room for them.
    let mut full: BTreeMap<String, bool> = BTreeMap::new();
    // How much a file held whose sending, or whose fetching, failed in this
    // round as the network fails while the server answered: nothing as
    // large goes the same way in the round.
    let (mut sent_below, mut fetched_below): (Option<u64>, Option<u64>) = (None, None);
    for file in &due {
        if file.way == Way::Sent && room.is_some_and(|room| !room.takes(file)) {
            // Said before it is sent, as a file too large is.
            full.insert(file.hash.to_owned(), file.notes);
            continue;
        }
        let below = match file.way {
            Way::Sent => &mut sent_below,
            Way::Fetched => &mut fetched_below,
        };
        if below.is_some_and(|below| file.size >= below) {
            continue;
        }
        // One that failed as the network fails waits its turns, said the
        // while, and those as large go meanwhile.
        if let Some(failing) = told.failing.get(file.hash)
            && look < failing.again_at
        {
            say(failing.said.clone());
            done.again = true;
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
                // The server answers: it was this file's own. Nothing as
                // large goes the same way in this round: what cuts one off
                // on its way most often does so by how much it holds, and
                // each try may send much before it fails. The file itself
                // waits before it is tried again, longer each time
                // (`Failing`), and those as large are tried meanwhile.
                // What goes the other way is not held back by it.
                let times = told.failing.get(file.hash).map_or(0, |failing| failing.times) + 1;
                let wait = passed_over(times);
                tracing::warn!(hash = file.hash, way = ?file.way, %why, times, wait, "a file failed as the network fails while the server answers");
                let said = failed(file, sentence(&why));
                say(said.clone());
                told.failing.insert(file.hash.to_owned(), Failing { times, again_at: look + 1 + wait, said });
                done.again = true;
                *below = Some(file.size);
                continue;
            }
            Err(error) if refused_entry(&error) => return Err(error),
            came => came,
        };
        // It failed in no such way this time.
        told.failing.remove(file.hash);
        match (file.way, came) {
            (Way::Sent, Ok(())) => {
                note(file.hash, Some(&file.size.to_string()))?;
                if let Some(room) = &mut room {
                    room.took(file);
                }
            }
            // Another device filled the home since it was asked: this file
            // does not fit, and nothing as large is offered in this round.
            (Way::Sent, Err(Error::Refused { kind: "full", .. })) => {
                full.insert(file.hash.to_owned(), file.notes);
                // Where the server says nothing of what a home may hold, this is all that is known of it.
                room.get_or_insert(Room { left: u64::MAX, for_notes: 0 }).refused(file);
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
                done.left = true;
            }
        }
    }

    // In the log once, when it is so and when more files are left by it,
    // not at every round.
    if full.keys().any(|hash| !told.full.contains_key(hash)) {
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
    fn a_file_that_fails_again_and_again_is_passed_over_longer_each_time() {
        let waits: Vec<u64> = (1..=9).map(passed_over).collect();
        assert_eq!(waits, [1, 2, 4, 8, 16, 32, 64, 64, 64]);
        assert_eq!(passed_over(0), 1);
        assert_eq!(passed_over(u32::MAX), 64);
    }

    #[test]
    fn a_full_server_is_said_for_as_long_as_files_are_left_by_it_and_the_files_of_the_notes_apart() {
        let mut told = Told::default();
        assert!(told.full().is_empty());
        told.full.insert("one".into(), false);
        let one = told.full();
        assert_eq!(one.len(), 1);
        told.full.insert("two".into(), false);
        let two = told.full();
        assert!(two.len() == 1 && two[0].contains('2'), "{two:?}");
        assert_ne!(one, two, "one file is said otherwise than several");
        // A file a note holds is said in a sentence of its own, before the others.
        told.full.insert("a picture".into(), true);
        let with_notes = told.full();
        assert_eq!(with_notes.len(), 2);
        assert!(with_notes[0].contains("notes") && with_notes[1] == two[0], "{with_notes:?}");
        told.full.clear();
        assert!(told.full().is_empty());
    }

    #[test]
    fn a_tenth_of_a_home_and_no_more_than_a_gibibyte_is_kept_for_the_files_of_the_notes() {
        const GIB: u64 = 1 << 30;
        assert_eq!(kept_for_notes(10 * GIB), GIB, "of a home as the server makes one where nothing else is said");
        assert_eq!(kept_for_notes(100 * GIB), GIB);
        assert_eq!(kept_for_notes(1000), 100);
        assert_eq!(kept_for_notes(0), 0);
        let file = |size: u64, notes: bool| Due { hash: "a file", way: Way::Sent, size, notes };

        // A home of 1000 with nothing in it: the library's files stop at 900, the notes' at 1000.
        let mut room = Room::of(1000, 0, 0);
        assert!(room.takes(&file(900, false)) && !room.takes(&file(901, false)));
        assert!(room.takes(&file(1000, true)) && !room.takes(&file(1001, true)));
        room.took(&file(900, false));
        assert!(!room.takes(&file(1, false)), "what is left is the notes'");
        assert!(room.takes(&file(100, true)));
        // What the notes' files hold comes out of what is kept for them, and then out of what all may use.
        room.took(&file(60, true));
        assert_eq!(room, Room { left: 40, for_notes: 40 });
        let mut room = Room::of(1000, 300, 250);
        assert_eq!(room, Room { left: 700, for_notes: 0 }, "the notes hold more than was kept for them");
        assert!(room.takes(&file(700, false)));
        // A home filled to the brim before room was kept: nothing fits, of either.
        assert!(!Room::of(1000, 1000, 0).takes(&file(1, true)));
        // Refused though there seemed to be room: nothing as large is offered.
        room.refused(&file(500, false));
        assert!(!room.takes(&file(500, false)) && room.takes(&file(499, false)));
        let mut unknown = Room { left: u64::MAX, for_notes: 0 };
        unknown.refused(&file(500, true));
        assert!(!unknown.takes(&file(500, true)) && unknown.takes(&file(499, false)));
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
