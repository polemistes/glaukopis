//! A document from its bytes on disk (record 0120): what it holds, as one
//! update; what it holds beyond what another has; and the moment it is at.
//!
//! A project's document and the notebook's are kept as a state and the
//! changes after it (`projects`, `notebook`), which the interface owns and
//! the core keeps as bytes. They are brought to be the same as the server's
//! without being made documents here: what Yjs calls an update can be merged
//! with others, compared with a state vector and asked for its deletions as
//! it is, and that is all the exchange needs.

use std::fs;
use std::path::Path;

use serde::{Deserialize, Serialize};
use yrs::updates::decoder::Decode;
use yrs::updates::encoder::Encode;
use yrs::{Any, Doc, Map, Out, Snapshot, StateVector, Transact, Update};

use crate::error::{Error, IoContext, Result};
use crate::history::read_records;
use crate::projects::{LOG, STATE};
use crate::tr;

/// What the two files of a document held when they were looked at: how much
/// each holds, and when it was written, in nanoseconds since 1970. Where
/// both are what they were, nothing was written to the document since.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct Lies {
    pub state: (u64, i64),
    pub log: (u64, i64),
}

/// How much a file holds, and when it was written, in nanoseconds since
/// 1970; nothing where there is no file.
pub fn lying(path: &Path) -> (u64, i64) {
    let Ok(meta) = fs::metadata(path) else { return (0, 0) };
    let written = meta
        .modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map_or(0, |d| d.as_nanos() as i64);
    (meta.len(), written)
}

/// How the document in `dir` lies there now.
pub fn lies(dir: &Path) -> Lies {
    Lies { state: lying(&dir.join(STATE)), log: lying(&dir.join(LOG)) }
}

/// Bytes that are to be a change, and are none.
fn unread(error: impl std::fmt::Display) -> Error {
    Error::invalid(tr!("core-sync-not-a-change", why = error.to_string()))
}

fn change(bytes: &[u8]) -> Result<Update> {
    Update::decode_v1(bytes).map_err(unread)
}

/// Several changes as one.
pub fn merged<'a>(changes: impl IntoIterator<Item = &'a [u8]>) -> Result<Vec<u8>> {
    let changes = changes.into_iter().map(change).collect::<Result<Vec<_>>>()?;
    Ok(Update::merge_updates(changes).encode_v1())
}

/// The document kept in `dir`, as one update; nothing where nothing was
/// written there yet.
///
/// The log is read before the state. One who saves the whole writes the
/// state and then empties the log, so that what was in a log read first is
/// in the state read after it: read the other way round, a state saved
/// between the two readings would leave what the log held in neither.
pub fn read(dir: &Path) -> Result<Option<Vec<u8>>> {
    let changes = read_records(&dir.join(LOG))?;
    let state = match fs::read(dir.join(STATE)) {
        Ok(bytes) => bytes,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Vec::new(),
        Err(e) => return Err(e).context(|| tr!("core-projects-reading")),
    };
    let mut parts = Vec::with_capacity(changes.len() + 1);
    if !state.is_empty() {
        parts.push(state.as_slice());
    }
    parts.extend(changes.iter().map(|record| record.update.as_slice()).filter(|update| !update.is_empty()));
    if parts.is_empty() {
        return Ok(None);
    }
    merged(parts).map(Some)
}

/// Whether a change holds nothing at all: what a server answers that has
/// nothing of a document.
pub fn nothing(update: &[u8]) -> bool {
    update.is_empty() || change(update).is_ok_and(|update| update.is_empty())
}

/// What `whole` holds beyond what one who is at the state vector `since`
/// has. What was deleted is in it always: a state vector does not say what
/// its holder knows to be deleted.
pub fn beyond(whole: &[u8], since: &[u8]) -> Result<Vec<u8>> {
    yrs::diff_updates_v1(whole, since).map_err(unread)
}

/// The state vector of a whole document.
pub fn vector(whole: &[u8]) -> Result<Vec<u8>> {
    Ok(change(whole)?.state_vector().encode_v1())
}

/// Whether one at the state vector `ours` has every change that one at
/// `theirs` has. It says nothing of what was deleted.
pub fn covers(ours: &[u8], theirs: &[u8]) -> Result<bool> {
    let ours = StateVector::decode_v1(ours).map_err(unread)?;
    let theirs = StateVector::decode_v1(theirs).map_err(unread)?;
    Ok(theirs.iter().all(|(client, clock)| ours.get(client) >= *clock))
}

/// The moment a whole document is at, as Yjs writes a snapshot: what was
/// deleted, and the state vector. The review of a project reads it as the
/// moment to show the changes from.
pub fn moment(whole: &[u8]) -> Result<Vec<u8>> {
    let whole = change(whole)?;
    Ok(Snapshot::new(whole.state_vector(), whole.delete_set().clone()).encode_v1())
}

/// Whether a whole document holds all it held at an earlier `moment` of its
/// own: every change, and every deletion. A document only grows, so one that
/// does not has lost something on its way to the disk, as when a window
/// saved a state that lacked what had just been added to the log.
pub fn holds(whole: &[u8], moment: &[u8]) -> Result<bool> {
    let whole = change(whole)?;
    let then = Snapshot::decode_v1(moment).map_err(unread)?;
    let vector = whole.state_vector();
    if !then.state_map.iter().all(|(client, clock)| vector.get(client) >= *clock) {
        return Ok(false);
    }
    let deleted = whole.delete_set();
    Ok(then.delete_set.client_ids().all(|client| match (then.delete_set.get(&client), deleted.get(&client)) {
        (Some(then), Some(now)) => then.subset_of(now),
        (Some(then), None) => then.is_empty(),
        (None, _) => true,
    }))
}

/// What a project calls itself: the name in the map `meta` of its document,
/// which the interface writes. For this alone the document is made, since
/// a map is read from no bytes.
pub fn name(whole: &[u8]) -> Option<String> {
    let doc = Doc::new();
    let meta = doc.get_or_insert_map("meta");
    doc.transact_mut().apply_update(change(whole).ok()?).ok()?;
    match meta.get(&doc.transact(), "name") {
        Some(Out::Any(Any::String(name))) if !name.trim().is_empty() => Some(name.to_string()),
        _ => None,
    }
}

#[cfg(test)]
pub(crate) mod tests {
    use super::*;
    use crate::fsutil::write_atomic;
    use crate::history::{Record, append_record, now_ms};
    use yrs::{GetString, ReadTxn, Text};

    /// A document as the interface would hold it, written in by hand.
    pub(crate) struct Written {
        pub doc: Doc,
    }

    impl Written {
        pub fn new() -> Self {
            Written { doc: Doc::new() }
        }

        /// Writes words at a place of the text, and gives the change.
        pub fn write(&self, at: u32, words: &str) -> Vec<u8> {
            let text = self.doc.get_or_insert_text("text");
            let before = self.doc.transact().state_vector();
            text.insert(&mut self.doc.transact_mut(), at, words);
            self.doc.transact().encode_state_as_update_v1(&before)
        }

        /// Takes words away, and gives the change: it holds a deletion and nothing else.
        pub fn take_away(&self, at: u32, len: u32) -> Vec<u8> {
            let text = self.doc.get_or_insert_text("text");
            let before = self.doc.transact().state_vector();
            text.remove_range(&mut self.doc.transact_mut(), at, len);
            self.doc.transact().encode_state_as_update_v1(&before)
        }

        pub fn name(&self, name: &str) -> Vec<u8> {
            let meta = self.doc.get_or_insert_map("meta");
            let before = self.doc.transact().state_vector();
            meta.insert(&mut self.doc.transact_mut(), "name", name);
            self.doc.transact().encode_state_as_update_v1(&before)
        }

        pub fn take_in(&self, update: &[u8]) {
            self.doc.transact_mut().apply_update(Update::decode_v1(update).unwrap()).unwrap();
        }

        pub fn whole(&self) -> Vec<u8> {
            self.doc.transact().encode_state_as_update_v1(&StateVector::default())
        }

        pub fn text(&self) -> String {
            self.doc.get_or_insert_text("text").get_string(&self.doc.transact())
        }
    }

    /// The text of a whole document, as one who takes it in reads it.
    pub(crate) fn text_of(whole: &[u8]) -> String {
        let reader = Written::new();
        reader.take_in(whole);
        reader.text()
    }

    fn log(dir: &Path, update: Vec<u8>) {
        append_record(&dir.join(LOG), &Record::change(update, true, now_ms())).unwrap();
    }

    #[test]
    fn a_document_is_read_from_its_state_and_its_log() {
        let tmp = tempfile::tempdir().unwrap();
        assert_eq!(read(tmp.path()).unwrap(), None, "nothing was written yet");
        let written = Written::new();
        written.write(0, "Sing, goddess");
        write_atomic(&tmp.path().join(STATE), &written.whole()).unwrap();
        log(tmp.path(), written.write(13, ", the wrath"));
        log(tmp.path(), written.take_away(0, 6));
        let whole = read(tmp.path()).unwrap().unwrap();
        assert_eq!(text_of(&whole), "goddess, the wrath");
        // Of the log alone, where no state was saved yet.
        let other = tempfile::tempdir().unwrap();
        let fresh = Written::new();
        log(other.path(), fresh.write(0, "μῆνιν"));
        assert_eq!(text_of(&read(other.path()).unwrap().unwrap()), "μῆνιν");
    }

    #[test]
    fn what_one_has_beyond_another_is_what_the_other_lacks() {
        let a = Written::new();
        a.write(0, "Sing, goddess");
        let b = Written::new();
        b.take_in(&a.whole());
        let since = vector(&b.whole()).unwrap();
        a.write(13, ", the wrath");
        let more = beyond(&a.whole(), &since).unwrap();
        assert!(more.len() < a.whole().len(), "less than the whole");
        b.take_in(&more);
        assert_eq!(b.text(), "Sing, goddess, the wrath");
        assert!(covers(&vector(&a.whole()).unwrap(), &since).unwrap());
        assert!(!covers(&since, &vector(&a.whole()).unwrap()).unwrap());
    }

    #[test]
    fn a_document_that_lost_something_does_not_hold_its_earlier_moment() {
        let a = Written::new();
        a.write(0, "Sing, goddess");
        let early = a.whole();
        a.write(13, ", the wrath");
        let written = a.whole();
        a.take_away(0, 6);
        let deleted = a.whole();
        assert!(holds(&deleted, &moment(&written).unwrap()).unwrap(), "a document holds what it held before");
        assert!(holds(&deleted, &moment(&deleted).unwrap()).unwrap());
        assert!(!holds(&early, &moment(&written).unwrap()).unwrap(), "words are missing");
        assert!(!holds(&written, &moment(&deleted).unwrap()).unwrap(), "a deletion alone is missed too");
    }

    #[test]
    fn a_change_that_holds_nothing_is_known() {
        assert!(nothing(&[]));
        assert!(nothing(Update::EMPTY_V1));
        assert!(nothing(&Written::new().whole()));
        let written = Written::new();
        written.write(0, "a");
        assert!(!nothing(&written.whole()));
    }

    #[test]
    fn a_project_says_its_name() {
        let a = Written::new();
        a.write(0, "text");
        assert_eq!(name(&a.whole()), None);
        a.name("The Iliad");
        assert_eq!(name(&a.whole()).as_deref(), Some("The Iliad"));
        assert_eq!(name(b"\xff\xff not a change"), None);
    }

    #[test]
    fn how_a_document_lies_changes_when_it_is_written_to() {
        let tmp = tempfile::tempdir().unwrap();
        let none = lies(tmp.path());
        assert_eq!(none, Lies::default());
        let written = Written::new();
        log(tmp.path(), written.write(0, "a"));
        let one = lies(tmp.path());
        assert_ne!(one, none);
        log(tmp.path(), written.write(1, "b"));
        assert_ne!(lies(tmp.path()), one);
    }
}
