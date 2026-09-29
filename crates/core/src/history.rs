//! The full history of a project (ADR 0021): every change, kept while the
//! project's history is on. It is not the earlier versions, whole states kept
//! now and then in `history/`, which are kept whether it is on or not.
//!
//! ```text
//! projects/<id>/changes.log   a heading, then the records of the history
//! ```
//!
//! What the changes mean is the interface's, which knows Yjs; here they are
//! bytes, each in a record with what is known of it here: its kind, whether it
//! was made on this computer or came from another, and when it was written
//! here. The history begins with a record of the whole state of the project
//! when it was turned on. While it is on, the changes that are written to the
//! log of the project are moved here when the whole state is saved, instead of
//! being thrown away. Older changes can be merged into fewer (the interface
//! merges them, and they are replaced here), and history before a moment can
//! be taken out, into an archive or for good: what is left then begins with
//! the project as it was at that moment. An archive is a file of the same
//! form, which can be read again to be looked at.
//!
//! A record is its length, with the highest bit set, a checksum, and a body:
//! the kind, whether it was made here, the time in milliseconds since 1970
//! (for merged changes, the times of the first and the last), and the change.
//! The log of the project holds records of the same form; those written by
//! earlier versions, which are the length (without that bit), the checksum and
//! the change, are read as they were.

use std::fs::{self, File, OpenOptions};
use std::io::{Read, Write};
use std::path::Path;
use std::sync::Mutex;

use crate::error::{Error, IoContext, Result};
use crate::fsutil::write_atomic;
use crate::projects::Projects;
use crate::tr;

/// The file of the history, beside the state of the project.
pub(crate) const CHANGES: &str = "changes.log";

/// What a file of history begins with: the store of a project, and an archive.
const HEADING: &[u8; 8] = b"GLKHIST1";

/// The bit of the length that marks a record of this form.
const TIMED: u32 = 0x8000_0000;

/// Changes to a history are made one at a time: moving the log in when the
/// state is saved, merging, taking out.
static WRITING: Mutex<()> = Mutex::new(());

#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Kind {
    /// A batch of changes, as it was written to the log.
    Change,
    /// The whole state of the project: where the history begins.
    Start,
    /// Batches merged into one, so that the moments between them are gone.
    Merged,
}

impl Kind {
    fn byte(self) -> u8 {
        match self {
            Kind::Change => 0,
            Kind::Start => 1,
            Kind::Merged => 2,
        }
    }

    fn from_byte(byte: u8) -> Option<Kind> {
        match byte {
            0 => Some(Kind::Change),
            1 => Some(Kind::Start),
            2 => Some(Kind::Merged),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Record {
    pub kind: Kind,
    /// Made on this computer, rather than received from another.
    pub here: bool,
    /// When it was written on this computer, in milliseconds since 1970. Of
    /// merged changes, when the first was; of a record written by an earlier
    /// version, which did not say, nought.
    pub time: i64,
    /// Of merged changes, when the last was written; of others, `time`.
    pub until: i64,
    pub update: Vec<u8>,
}

impl Record {
    /// A batch of changes written now.
    pub fn change(update: Vec<u8>, here: bool, time: i64) -> Record {
        Record { kind: Kind::Change, here, time, until: time, update }
    }

    /// The whole state, where a history begins.
    pub fn start(state: Vec<u8>, time: i64) -> Record {
        Record { kind: Kind::Start, here: true, time, until: time, update: state }
    }

    /// The record as it is written, with its length and checksum.
    pub fn encode_into(&self, out: &mut Vec<u8>) {
        let merged = self.kind == Kind::Merged;
        let mut body = Vec::with_capacity(self.update.len() + 18);
        body.push(self.kind.byte());
        body.push(u8::from(self.here));
        body.extend_from_slice(&self.time.to_le_bytes());
        if merged {
            body.extend_from_slice(&self.until.to_le_bytes());
        }
        body.extend_from_slice(&self.update);
        out.extend_from_slice(&(body.len() as u32 | TIMED).to_le_bytes());
        out.extend_from_slice(&checksum(&body).to_le_bytes());
        out.extend_from_slice(&body);
    }

    pub fn encode(&self) -> Vec<u8> {
        let mut out = Vec::with_capacity(self.update.len() + 26);
        self.encode_into(&mut out);
        out
    }
}

/// Now, in milliseconds since 1970.
pub fn now_ms() -> i64 {
    (time::OffsetDateTime::now_utc().unix_timestamp_nanos() / 1_000_000) as i64
}

pub(crate) fn checksum(bytes: &[u8]) -> u32 {
    // FNV-1a: enough to tell a record that was written whole from one that was not.
    let mut hash: u32 = 0x811c9dc5;
    for b in bytes {
        hash ^= *b as u32;
        hash = hash.wrapping_mul(0x01000193);
    }
    hash
}

/// Reads records one after another. A record cut short by a crash, or
/// damaged, is left out with all that follows it: what follows cannot be
/// trusted to begin where it seems to.
pub fn decode(bytes: &[u8], path: &Path) -> Vec<Record> {
    let mut out = Vec::new();
    let mut pos = 0;
    while pos + 8 <= bytes.len() {
        let head = u32::from_le_bytes(bytes[pos..pos + 4].try_into().unwrap());
        let sum = u32::from_le_bytes(bytes[pos + 4..pos + 8].try_into().unwrap());
        let len = (head & !TIMED) as usize;
        let start = pos + 8;
        let Some(end) = start.checked_add(len).filter(|&e| e <= bytes.len()) else {
            tracing::warn!(path = %path.display(), "a log ends in a record that was cut short");
            break;
        };
        let body = &bytes[start..end];
        if checksum(body) != sum {
            tracing::warn!(path = %path.display(), "a log holds a damaged record; what follows it is left out");
            break;
        }
        pos = end;
        if head & TIMED == 0 {
            // Written by an earlier version: the change alone.
            out.push(Record::change(body.to_vec(), true, 0));
            continue;
        }
        let Some(record) = decode_body(body) else {
            tracing::warn!(path = %path.display(), "a log holds a record of a kind not known; what follows it is left out");
            break;
        };
        out.push(record);
    }
    out
}

fn decode_body(body: &[u8]) -> Option<Record> {
    let kind = Kind::from_byte(*body.first()?)?;
    let here = *body.get(1)? != 0;
    let time = i64::from_le_bytes(body.get(2..10)?.try_into().ok()?);
    let (until, rest) =
        if kind == Kind::Merged { (i64::from_le_bytes(body.get(10..18)?.try_into().ok()?), 18) } else { (time, 10) };
    Some(Record { kind, here, time, until, update: body.get(rest..)?.to_vec() })
}

/// Reads a file of records. A file that is not there has none.
pub(crate) fn read_records(path: &Path) -> Result<Vec<Record>> {
    let mut bytes = Vec::new();
    match File::open(path) {
        Ok(mut f) => {
            f.read_to_end(&mut bytes).context(|| tr!("io-reading", path = path))?;
        }
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(Vec::new()),
        Err(e) => return Err(e).context(|| tr!("io-opening", path = path)),
    }
    Ok(decode(&bytes, path))
}

/// Adds a record to the end of a file. It is on disk when this returns.
pub(crate) fn append_record(path: &Path, record: &Record) -> Result<()> {
    let mut file =
        OpenOptions::new().create(true).append(true).open(path).context(|| tr!("io-opening", path = path))?;
    file.write_all(&record.encode()).context(|| tr!("io-writing", path = path))?;
    file.sync_data().context(|| tr!("io-flushing", path = path))?;
    Ok(())
}

/// Reads a file of history: a store or an archive. Something else is refused.
fn read_history(path: &Path) -> Result<Option<Vec<Record>>> {
    let bytes = match fs::read(path) {
        Ok(bytes) => bytes,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(e) => return Err(e).context(|| tr!("io-reading", path = path)),
    };
    if !bytes.starts_with(HEADING) {
        return Err(Error::invalid(tr!("core-history-not-history", path = path)));
    }
    Ok(Some(decode(&bytes[HEADING.len()..], path)))
}

fn write_history(path: &Path, records: &[Record]) -> Result<()> {
    let mut bytes = HEADING.to_vec();
    for r in records {
        r.encode_into(&mut bytes);
    }
    write_atomic(path, &bytes)
}

/// Reads an archive of history, to be looked at.
pub fn read_archive(path: &Path) -> Result<Vec<Record>> {
    read_history(path)?.ok_or_else(|| Error::not_found(tr!("core-history-the-archive")))
}

/// Records as the interface is given them: one after another, as they are
/// written, without a heading.
pub fn encode_all(records: &[Record]) -> Vec<u8> {
    let mut out = Vec::with_capacity(records.iter().map(|r| r.update.len() + 26).sum());
    for r in records {
        r.encode_into(&mut out);
    }
    out
}

/// Whether a file ends in these bytes, read from its end alone.
fn ends_with(path: &Path, tail: &[u8]) -> Result<bool> {
    use std::io::{Seek, SeekFrom};
    let mut file = File::open(path).context(|| tr!("io-opening", path = path))?;
    let len = file.metadata().context(|| tr!("io-reading", path = path))?.len();
    let Some(from) = len.checked_sub(tail.len() as u64) else { return Ok(false) };
    file.seek(SeekFrom::Start(from)).context(|| tr!("io-reading", path = path))?;
    let mut end = vec![0; tail.len()];
    file.read_exact(&mut end).context(|| tr!("io-reading", path = path))?;
    Ok(end == tail)
}

fn lock() -> std::sync::MutexGuard<'static, ()> {
    WRITING.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
}

/// What is said of a stretch of the history that is to be replaced: where it
/// begins, how long it is, and the times of its first and last records, by
/// which it is known to be the stretch that was read.
#[derive(Debug, Clone, Copy, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Stretch {
    pub first: usize,
    pub count: usize,
    pub time: i64,
    pub until: i64,
}

impl Stretch {
    fn check(&self, records: &[Record]) -> Result<()> {
        let end = self.first.checked_add(self.count).filter(|&e| self.count > 0 && e <= records.len());
        let matches =
            end.is_some_and(|end| records[self.first].time == self.time && records[end - 1].until == self.until);
        if matches { Ok(()) } else { Err(Error::invalid(tr!("core-history-changed"))) }
    }
}

impl Projects {
    /// Moves what the log holds into the history, or begins the history with
    /// the state when there is none. Called while the state is saved, before
    /// the log is emptied: `state` is what it will hold.
    pub(crate) fn keep_changes(&self, dir: &Path, log: &Path, state: &[u8]) -> Result<()> {
        let _writing = lock();
        let path = dir.join(CHANGES);
        if !path.is_file() {
            // The history begins here, with the whole state: what the log
            // holds is in it.
            return write_history(&path, &[Record::start(state.to_vec(), now_ms())]);
        }
        let records = read_records(log)?;
        let Some(last) = records.last() else { return Ok(()) };
        // A save that was cut short after the history had taken in the log,
        // and before the log was emptied, has the same log again: it is in.
        if ends_with(&path, &last.encode())? {
            return Ok(());
        }
        let mut bytes = Vec::new();
        for r in &records {
            r.encode_into(&mut bytes);
        }
        let mut file = OpenOptions::new().append(true).open(&path).context(|| tr!("io-opening", path = &path))?;
        file.write_all(&bytes).context(|| tr!("io-writing", path = &path))?;
        file.sync_data().context(|| tr!("io-flushing", path = &path))?;
        Ok(())
    }

    /// Everything the history holds, the oldest first: what was moved into it,
    /// and what the log holds since. Nothing, where the history is off.
    pub fn changes(&self, id: &str) -> Result<Vec<Record>> {
        let dir = self.existing_dir(id)?;
        let _writing = lock();
        let Some(mut records) = read_history(&dir.join(CHANGES))? else { return Ok(Vec::new()) };
        records.extend(read_records(&dir.join(crate::projects::LOG))?);
        Ok(records)
    }

    /// Whether the project keeps a history on this computer.
    pub fn has_changes(&self, id: &str) -> Result<bool> {
        Ok(self.existing_dir(id)?.join(CHANGES).is_file())
    }

    /// How much room the history takes on disk, in bytes: the history, and
    /// the log that will be moved into it.
    pub fn changes_room(&self, id: &str) -> Result<u64> {
        let dir = self.existing_dir(id)?;
        let size = |name: &str| fs::metadata(dir.join(name)).map(|m| m.len()).unwrap_or(0);
        let kept = size(CHANGES);
        Ok(if kept > 0 { kept + size(crate::projects::LOG) } else { 0 })
    }

    /// Deletes the history. The project, and its earlier versions, stay.
    pub fn forget_changes(&self, id: &str) -> Result<()> {
        let dir = self.existing_dir(id)?;
        let _writing = lock();
        match fs::remove_file(dir.join(CHANGES)) {
            Ok(()) => Ok(()),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
            Err(e) => Err(e).context(|| tr!("core-history-deleting")),
        }
    }

    /// Replaces a stretch of the history by other records: batches merged
    /// into fewer. Refused when the stretch is not what was read.
    pub fn merge_changes(&self, id: &str, stretch: Stretch, merged: Vec<Record>) -> Result<()> {
        let dir = self.existing_dir(id)?;
        let _writing = lock();
        let path = dir.join(CHANGES);
        let mut records = read_history(&path)?.ok_or_else(|| Error::invalid(tr!("core-history-none")))?;
        stretch.check(&records)?;
        records.splice(stretch.first..stretch.first + stretch.count, merged);
        write_history(&path, &records)
    }

    /// Takes out the history before a moment: the first `stretch.count`
    /// records, into an archive where one is given. What is left begins with
    /// `start`, the whole state at that moment.
    pub fn cut_changes(&self, id: &str, stretch: Stretch, start: Record, archive: Option<&Path>) -> Result<()> {
        let dir = self.existing_dir(id)?;
        let _writing = lock();
        let path = dir.join(CHANGES);
        let records = read_history(&path)?.ok_or_else(|| Error::invalid(tr!("core-history-none")))?;
        if stretch.first != 0 {
            return Err(Error::invalid(tr!("core-history-changed")));
        }
        stretch.check(&records)?;
        if let Some(archive) = archive {
            write_history(archive, &records[..stretch.count])?;
        }
        let mut left = Vec::with_capacity(records.len() - stretch.count + 1);
        left.push(start);
        left.extend_from_slice(&records[stretch.count..]);
        write_history(&path, &left)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::projects::LOG;

    fn projects() -> (tempfile::TempDir, Projects) {
        let tmp = tempfile::tempdir().unwrap();
        let p = Projects::at(tmp.path().join("projects"));
        (tmp, p)
    }

    fn updates(records: &[Record]) -> Vec<&[u8]> {
        records.iter().map(|r| r.update.as_slice()).collect()
    }

    #[test]
    fn records_old_and_new_are_read_from_the_log() {
        let (_tmp, p) = projects();
        let a = p.create("A").unwrap();
        let log = p.dir(&a.id).unwrap().join(LOG);
        // Two records as earlier versions wrote them: the length, the checksum, the change.
        let mut bytes = Vec::new();
        for update in [&b"old one"[..], &b"old two"[..]] {
            bytes.extend_from_slice(&(update.len() as u32).to_le_bytes());
            bytes.extend_from_slice(&checksum(update).to_le_bytes());
            bytes.extend_from_slice(update);
        }
        fs::write(&log, &bytes).unwrap();
        p.append_change(&a.id, b"new, from another", false, 1_000).unwrap();
        p.append_change(&a.id, b"new, made here", true, 2_000).unwrap();

        let loaded = p.load(&a.id).unwrap();
        assert_eq!(
            loaded.updates,
            vec![b"old one".to_vec(), b"old two".to_vec(), b"new, from another".to_vec(), b"new, made here".to_vec()]
        );
        let records = read_records(&log).unwrap();
        assert_eq!(records[0], Record::change(b"old one".to_vec(), true, 0));
        assert_eq!(records[2], Record::change(b"new, from another".to_vec(), false, 1_000));
        assert!(records[3].here && records[3].time == 2_000);
    }

    #[test]
    fn a_record_cut_short_loses_only_the_tail() {
        let records = [
            Record::change(b"one".to_vec(), true, 5),
            Record { kind: Kind::Merged, here: false, time: 6, until: 9, update: b"two".to_vec() },
        ];
        let mut bytes = encode_all(&records);
        assert_eq!(decode(&bytes, Path::new("x")), records);
        let whole = bytes.len();
        bytes.extend_from_slice(&(100u32 | TIMED).to_le_bytes());
        bytes.extend_from_slice(&[1, 2, 3]);
        assert_eq!(decode(&bytes, Path::new("x")), records);
        bytes.truncate(whole);
        bytes[whole - 1] ^= 1;
        assert_eq!(decode(&bytes, Path::new("x")), records[..1]);
    }

    #[test]
    fn without_the_history_the_log_is_thrown_away() {
        let (_tmp, p) = projects();
        let a = p.create("A").unwrap();
        p.append_change(&a.id, b"one", true, 1).unwrap();
        p.save_state_keeping(&a.id, b"STATE", None, false).unwrap();
        assert!(!p.has_changes(&a.id).unwrap());
        assert!(p.changes(&a.id).unwrap().is_empty());
        assert_eq!(p.changes_room(&a.id).unwrap(), 0);
    }

    #[test]
    fn the_history_begins_with_the_state_and_keeps_every_change_through_saving() {
        let (_tmp, p) = projects();
        let a = p.create("A").unwrap();
        p.append_change(&a.id, b"before", true, 1).unwrap();
        // Turned on: the history begins with the state, which holds what the log held.
        p.save_state_keeping(&a.id, b"STATE 1", None, true).unwrap();
        let kept = p.changes(&a.id).unwrap();
        assert_eq!(kept.len(), 1);
        assert_eq!(kept[0].kind, Kind::Start);
        assert_eq!(kept[0].update, b"STATE 1");

        p.append_change(&a.id, b"one", true, 10).unwrap();
        p.append_change(&a.id, b"two", false, 20).unwrap();
        // What the log holds is part of the history before it is saved.
        assert_eq!(updates(&p.changes(&a.id).unwrap()), vec![&b"STATE 1"[..], b"one", b"two"]);
        p.save_state_keeping(&a.id, b"STATE 2", None, true).unwrap();
        assert!(p.load(&a.id).unwrap().updates.is_empty(), "the log is emptied as before");
        p.append_change(&a.id, b"three", true, 30).unwrap();
        p.save_state_keeping(&a.id, b"STATE 3", None, true).unwrap();

        let kept = p.changes(&a.id).unwrap();
        assert_eq!(updates(&kept), vec![&b"STATE 1"[..], b"one", b"two", b"three"]);
        assert_eq!(
            kept.iter().map(|r| (r.here, r.time)).collect::<Vec<_>>()[1..],
            [(true, 10), (false, 20), (true, 30)]
        );
        assert!(p.changes_room(&a.id).unwrap() > 0);

        // A save cut short after the log was taken in: the same log is not taken in twice.
        p.append_change(&a.id, b"four", true, 40).unwrap();
        let dir = p.dir(&a.id).unwrap();
        p.keep_changes(&dir, &dir.join(LOG), b"STATE 4").unwrap();
        p.save_state_keeping(&a.id, b"STATE 4", None, true).unwrap();
        assert_eq!(updates(&p.changes(&a.id).unwrap()).len(), 5);

        // Turned off: what was kept is deleted, when it is turned off here or
        // when the project is next saved on a copy that learns it is off.
        p.forget_changes(&a.id).unwrap();
        assert!(p.changes(&a.id).unwrap().is_empty());
        assert_eq!(p.load(&a.id).unwrap().state.as_deref(), Some(&b"STATE 4"[..]));
        p.save_state_keeping(&a.id, b"STATE 5", None, true).unwrap();
        assert!(p.has_changes(&a.id).unwrap());
        p.save_state_keeping(&a.id, b"STATE 6", None, false).unwrap();
        assert!(!p.has_changes(&a.id).unwrap());
    }

    #[test]
    fn merging_replaces_the_stretch_that_was_read() {
        let (_tmp, p) = projects();
        let a = p.create("A").unwrap();
        p.save_state_keeping(&a.id, b"S", None, true).unwrap();
        for (i, u) in [b"a", b"b", b"c", b"d"].iter().enumerate() {
            p.append_change(&a.id, *u, true, 100 + i as i64).unwrap();
        }
        p.save_state_keeping(&a.id, b"S2", None, true).unwrap();
        let merged = Record { kind: Kind::Merged, here: true, time: 101, until: 102, update: b"bc".to_vec() };
        // A stretch that is not what is there is refused.
        let wrong = Stretch { first: 2, count: 2, time: 100, until: 102 };
        assert!(p.merge_changes(&a.id, wrong, vec![merged.clone()]).is_err());
        let past = Stretch { first: 4, count: 2, time: 103, until: 104 };
        assert!(p.merge_changes(&a.id, past, vec![merged.clone()]).is_err());

        p.merge_changes(&a.id, Stretch { first: 2, count: 2, time: 101, until: 102 }, vec![merged.clone()]).unwrap();
        let kept = p.changes(&a.id).unwrap();
        assert_eq!(updates(&kept), vec![&b"S"[..], b"a", b"bc", b"d"]);
        assert_eq!(kept[2], merged);
    }

    #[test]
    fn history_is_taken_out_into_an_archive_or_deleted() {
        let (tmp, p) = projects();
        let a = p.create("A").unwrap();
        p.save_state_keeping(&a.id, b"S", None, true).unwrap();
        for (i, u) in [b"a", b"b", b"c"].iter().enumerate() {
            p.append_change(&a.id, *u, i != 1, 100 + i as i64).unwrap();
        }
        p.save_state_keeping(&a.id, b"S2", None, true).unwrap();
        let before = p.changes(&a.id).unwrap();

        let archive = tmp.path().join("A until b.glaukopis-history");
        let stretch = Stretch { first: 0, count: 3, time: before[0].time, until: 101 };
        p.cut_changes(&a.id, stretch, Record::start(b"S at b".to_vec(), 101), Some(&archive)).unwrap();
        let left = p.changes(&a.id).unwrap();
        assert_eq!(updates(&left), vec![&b"S at b"[..], b"c"]);
        assert_eq!(left[0].kind, Kind::Start);
        let archived = read_archive(&archive).unwrap();
        assert_eq!(archived, before[..3]);

        // Deleting the same way, without an archive.
        let stretch = Stretch { first: 0, count: 1, time: 101, until: 101 };
        p.cut_changes(&a.id, stretch, Record::start(b"S at c".to_vec(), 102), None).unwrap();
        assert_eq!(updates(&p.changes(&a.id).unwrap()), vec![&b"S at c"[..], b"c"]);

        // What is not a history is not read as one.
        let other = tmp.path().join("other");
        fs::write(&other, b"something else").unwrap();
        assert!(read_archive(&other).is_err());
        assert!(read_archive(&tmp.path().join("missing")).is_err());
    }
}
