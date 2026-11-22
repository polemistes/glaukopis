//! The doors by which what the writer's other computers wrote comes into
//! the library (record 0119; `sync::library` brings it). It is written by
//! the library itself, under its rules and saved as it saves, so that it
//! says it changed and every window reads it again.
//!
//! Nothing here stamps a time or makes a name of its own where one was
//! given: what is written is what the other computer wrote, its times with
//! it, so that writing it here is no change made here, to be sent back.
//! Where the library's rules make it otherwise (a key that is taken here),
//! what they make is what this computer then holds, and says.

use std::collections::{BTreeMap, HashSet};
use std::fs;
use std::path::Path;

use crate::error::{Error, IoContext, Result};
use crate::tr;

use super::files::FileFolder;
use super::{Collection, Entry, FileRecord, Library, attachments, keys};

/// An entry as it came from elsewhere: whole, with the files of the store
/// it has, by the hashes of what they hold, in their order. Where a file
/// lies on this disk is this computer's own, and is found here.
#[derive(Debug, Clone)]
pub struct Arrived {
    pub entry: Entry,
    pub files: Vec<String>,
}

/// Which of its files the library found amiss when it last read them: set
/// aside, read in part, or holding less than the store holds. What is read
/// from such a file is no change the writer made, and is not to be sent to
/// their other computers as one.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct Damaged {
    /// `library.bib`, which was read in part.
    pub references: bool,
    pub collections: bool,
    /// The record of the files, set aside, or without files the store has.
    pub files: bool,
}

impl Damaged {
    pub fn any(&self) -> bool {
        self.references || self.collections || self.files
    }
}

impl Library {
    /// How many times the library has written one of its files in this run:
    /// what is written while it is held by one who writes from elsewhere is
    /// told from what others wrote by it, so that what was written only from
    /// elsewhere is not read and compared again as a change made here.
    pub fn writes(&self) -> u64 {
        self.writes.get()
    }

    /// What the library found amiss when it last read its files, since this
    /// was last asked; asking forgets it.
    pub fn take_damaged(&mut self) -> Damaged {
        std::mem::take(&mut self.damaged)
    }

    /// Whether text of the library's file that could not be read holds an
    /// entry of this id: such an entry is in the library no more until the
    /// text is put right, but was not taken out of it.
    pub fn unread_holds(&self, id: &str) -> bool {
        !id.is_empty() && self.kept.iter().any(|v| !v.readable && v.text.contains(id))
    }

    /// Writes entries that came from elsewhere, each in the place of the
    /// entry of its id, or added where there is none, and saves the library
    /// once. Each file is named by where it lies on this disk; a path of the
    /// entry here that is not in the store is kept. A key is the library's
    /// to keep unique: where two entries have one, the one whose id comes
    /// first keeps it and the other is given one made from it, so that every
    /// computer gives the same; an entry without a key is given one.
    pub fn put_entries(&mut self, arrived: Vec<Arrived>) -> Result<()> {
        self.refresh()?;
        if arrived.is_empty() {
            return Ok(());
        }
        let mut changed = false;
        for Arrived { mut entry, files } in arrived {
            let at = self.by_id.get(&entry.id).copied();
            let mut paths: Vec<String> =
                files.iter().filter(|hash| attachments::is_hash(hash)).map(|hash| self.stored_path_of(hash)).collect();
            if let Some(at) = at {
                // What lies outside the store is this computer's.
                paths.extend(
                    self.entries[at].attachments().into_iter().filter(|p| attachments::hash_of_path(p).is_none()),
                );
            }
            entry.fields.retain(|(name, _)| name != "file");
            entry.set_attachments(&paths);
            if entry.entry_type.trim().is_empty() {
                entry.entry_type = "misc".into();
            }
            match at {
                Some(at) if self.entries[at] == entry => {}
                Some(at) => {
                    self.entries[at] = entry;
                    changed = true;
                }
                None => {
                    self.by_id.insert(entry.id.clone(), self.entries.len());
                    self.entries.push(entry);
                    changed = true;
                }
            }
        }
        changed |= self.keys_made_unique();
        if changed {
            self.reindex();
            self.save()?;
        }
        Ok(())
    }

    /// Where the file with this hash lies in the store here, as an entry
    /// names it: as its record says, or where it is found, or where it will
    /// be kept when it comes.
    fn stored_path_of(&self, hash: &str) -> String {
        if let Some(record) = self.files.get(hash).filter(|r| attachments::hash_of_path(&r.path) == Some(hash)) {
            return record.path.clone();
        }
        attachments::find_by_hash(&self.dir, hash).unwrap_or_else(|| attachments::path_for(hash, "file"))
    }

    /// Gives a key to every entry that has none, and one of its own to every
    /// entry but the first by id of those that share one. Whether any was
    /// given.
    fn keys_made_unique(&mut self) -> bool {
        let mut by_key: BTreeMap<String, Vec<usize>> = BTreeMap::new();
        for (i, e) in self.entries.iter().enumerate() {
            by_key.entry(e.key.to_lowercase()).or_default().push(i);
        }
        let mut taken: HashSet<String> = by_key.keys().filter(|k| !k.is_empty()).cloned().collect();
        let mut changed = false;
        for (key, mut sharing) in by_key {
            sharing.sort_by(|a, b| self.entries[*a].id.cmp(&self.entries[*b].id));
            let keeps = if key.is_empty() { 0 } else { 1 };
            for &i in &sharing[keeps..] {
                let base = keys::sanitise_key(&self.entries[i].key).unwrap_or_else(|| keys::base_key(&self.entries[i]));
                let new = keys::unique_key_where(&base, |k| taken.contains(&k.to_lowercase()));
                taken.insert(new.to_lowercase());
                self.entries[i].key = new;
                changed = true;
            }
        }
        changed
    }

    /// Puts the collections that came from elsewhere in the stead of those
    /// there are, and saves them; a parent that is not there, or a ring,
    /// is mended as the collections mend it when they are read.
    pub fn put_collections(&mut self, list: Vec<Collection>) -> Result<()> {
        if self.collections.list == list {
            return Ok(());
        }
        self.collections.replace_all(list);
        self.save_collections()
    }

    /// Puts the folders of the files that came from elsewhere in the stead
    /// of those there are (`Files::replace_folders`), and saves the record.
    pub fn put_file_folders(&mut self, folders: Vec<FileFolder>) -> Result<()> {
        if self.files.replace_folders(folders) {
            self.save_files()?;
        }
        Ok(())
    }

    /// Writes records of files that came from elsewhere, each in the place
    /// of the record of its hash, or added, and saves the record once.
    /// Where the file lies is this computer's: as its record here says, or
    /// where the store has it, or where it will be kept when it comes. A
    /// folder that is not here is not written: the record keeps the one it
    /// has, or none.
    pub fn put_records(&mut self, records: Vec<FileRecord>) -> Result<()> {
        let mut changed = false;
        for mut record in records {
            if !attachments::is_hash(&record.hash) {
                continue;
            }
            let known = self.files.get(&record.hash).cloned();
            record.path = match &known {
                Some(k) if attachments::hash_of_path(&k.path) == Some(record.hash.as_str()) => k.path.clone(),
                _ => attachments::find_by_hash(&self.dir, &record.hash)
                    .unwrap_or_else(|| attachments::path_for(&record.hash, &record.name)),
            };
            if record.folder.as_deref().is_some_and(|f| self.files.folder(f).is_err()) {
                record.folder = known.as_ref().and_then(|k| k.folder.clone());
            }
            if known.as_ref() != Some(&record) {
                self.files.insert(record);
                changed = true;
            }
        }
        if changed {
            self.save_files()?;
        }
        Ok(())
    }

    /// Keeps a file of the store that was fetched from elsewhere. `arrived`
    /// was written where `attachments::arriving` said, whole, and holds what
    /// its hash says; it is given the name its record gives it and becomes
    /// the file of the store. One that came meanwhile by another way is that
    /// file, and what arrived goes.
    pub fn keep_arrived(&mut self, hash: &str, arrived: &Path) -> Result<()> {
        if !attachments::is_hash(hash) {
            return Err(Error::invalid(tr!("core-pictures-not-as-asked")));
        }
        if let Some(found) = attachments::find_by_hash(&self.dir, hash) {
            let _ = fs::remove_file(arrived);
            if self.files.record(&found, None, None, &super::now()) {
                self.save_files()?;
            }
            return Ok(());
        }
        let stored = match self.files.get(hash) {
            Some(record) if attachments::hash_of_path(&record.path) == Some(hash) => record.path.clone(),
            Some(record) => attachments::path_for(hash, &record.name),
            None => attachments::path_for(hash, "file"),
        };
        let target = attachments::absolute(&self.dir, &stored)?;
        fs::rename(arrived, &target).context(|| tr!("io-storing", path = &target))?;
        // The record is the one that came; a file that came before its record is entered as the store enters one.
        self.files.record(&stored, None, None, &super::now());
        self.files.measure(&self.dir, hash);
        self.save_files()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::library::draft_from_source;

    fn library() -> (tempfile::TempDir, Library) {
        let tmp = tempfile::tempdir().unwrap();
        let lib = Library::open_at(&tmp.path().join("library")).unwrap();
        (tmp, lib)
    }

    fn entry(id: &str, key: &str, title: &str) -> Entry {
        let mut entry = draft_from_source(&format!("@book{{{key}, title={{{title}}}}}")).unwrap().to_entry();
        entry.id = id.into();
        entry.added = "2026-11-01T10:00:00Z".into();
        entry.modified = "2026-11-02T10:00:00Z".into();
        entry
    }

    #[test]
    fn an_entry_from_elsewhere_is_written_with_its_id_and_its_times() {
        let (_tmp, mut lib) = library();
        let came = entry("from-the-desk", "nagy1979", "The Best of the Achaeans");
        lib.put_entries(vec![Arrived { entry: came.clone(), files: Vec::new() }]).unwrap();
        let there = lib.get("from-the-desk").unwrap();
        assert_eq!(there, &came, "nothing is stamped anew");
        let again = Library::open_at(lib.dir()).unwrap();
        assert_eq!(again.get("from-the-desk").unwrap().modified, "2026-11-02T10:00:00Z");

        // Changed elsewhere: in its place.
        let mut changed = came.clone();
        changed.set("year", "1979");
        lib.put_entries(vec![Arrived { entry: changed.clone(), files: Vec::new() }]).unwrap();
        assert_eq!(lib.len(), 1);
        assert_eq!(lib.get("from-the-desk").unwrap().get("year"), Some("1979"));
    }

    #[test]
    fn a_key_two_entries_share_is_kept_by_the_one_whose_id_comes_first() {
        let (_tmp, mut lib) = library();
        let mine = lib.add(&draft_from_source("@book{nagy1979, title={Mine}}").unwrap()).unwrap();
        // An id before any uuid, and one after.
        let first = entry("0-first", "nagy1979", "First");
        let last = entry("z-last", "Nagy1979", "Last");
        lib.put_entries(vec![Arrived { entry: first, files: Vec::new() }, Arrived { entry: last, files: Vec::new() }])
            .unwrap();
        assert_eq!(lib.get("0-first").unwrap().key, "nagy1979");
        let keys: HashSet<String> = lib.entries().iter().map(|e| e.key.to_lowercase()).collect();
        assert_eq!(keys.len(), 3, "every key its own: {keys:?}");
        assert_ne!(lib.get(&mine.id).unwrap().key, "nagy1979");
        // An entry that came without a key is given one.
        lib.put_entries(vec![Arrived { entry: entry("keyless", "", "Untitled things"), files: Vec::new() }]).unwrap();
        assert!(!lib.get("keyless").unwrap().key.is_empty());
    }

    #[test]
    fn a_file_is_named_by_where_it_lies_on_this_disk() {
        let (tmp, mut lib) = library();
        let source = tmp.path().join("scan.pdf");
        fs::write(&source, b"%PDF the scan").unwrap();
        let here = attachments::store_file(lib.dir(), &source, "Scan as named here").unwrap();
        let hash = attachments::hash_of_path(&here).unwrap().to_owned();
        let absent = attachments::hash_bytes(b"not here yet");
        let mut came = entry("r", "r", "R");
        came.set("file", "attachments/zz/elsewhere.pdf;/home/someone/paper.pdf");
        lib.put_entries(vec![Arrived { entry: came, files: vec![hash.clone(), absent.clone()] }]).unwrap();
        let files = lib.get("r").unwrap().attachments();
        assert_eq!(files[0], here, "as the store has it here");
        assert_eq!(files[1], attachments::path_for(&absent, "file"), "where it will be kept");
        assert_eq!(files.len(), 2, "the paths of the other computer are not taken");

        // A path outside the store, of this computer, stays.
        let source = format!("@book{{local, title={{L}}, file={{{here};/home/me/local.pdf}}}}");
        let local = lib.add(&draft_from_source(&source).unwrap()).unwrap();
        let mut again = local.clone();
        again.set("title", "L again");
        lib.put_entries(vec![Arrived { entry: again, files: vec![hash] }]).unwrap();
        let there = lib.get(&local.id).unwrap();
        assert_eq!(there.attachments(), vec![here, "/home/me/local.pdf".to_owned()]);
        assert_eq!(there.get("title"), Some("L again"));
    }

    #[test]
    fn records_and_folders_from_elsewhere_keep_where_the_file_lies_here() {
        let (tmp, mut lib) = library();
        let source = tmp.path().join("a.pdf");
        fs::write(&source, b"%PDF a").unwrap();
        let here = attachments::store_file(lib.dir(), &source, "As named here").unwrap();
        let hash = attachments::hash_of_path(&here).unwrap().to_owned();
        lib.files.record(&here, None, None, "then");
        let shelf = FileFolder { id: "shelf".into(), name: "Shelf".into(), parent: None, order: "000001".into() };
        lib.put_file_folders(vec![shelf]).unwrap();
        let came = FileRecord {
            hash: hash.clone(),
            path: "attachments/elsewhere/whatever.pdf".into(),
            name: "Nagy 1979.pdf".into(),
            folder: Some("shelf".into()),
            added: "2026-11-01T10:00:00Z".into(),
            ..Default::default()
        };
        let missing = FileRecord {
            hash: attachments::hash_bytes(b"to come"),
            name: "Later.pdf".into(),
            folder: Some("no such folder".into()),
            ..Default::default()
        };
        lib.put_records(vec![came, missing.clone()]).unwrap();
        let record = lib.files.get(&hash).unwrap();
        assert_eq!((record.path.as_str(), record.name.as_str()), (here.as_str(), "Nagy 1979.pdf"));
        assert_eq!(record.folder.as_deref(), Some("shelf"));
        let later = lib.files.get(&missing.hash).unwrap().clone();
        assert_eq!(later.path, attachments::path_for(&missing.hash, "Later.pdf"));
        assert_eq!(later.folder, None, "a folder that is not here is not written");

        // The file arrives, and is kept where its record says.
        let arriving = attachments::arriving(lib.dir(), &missing.hash).unwrap();
        fs::write(&arriving, b"to come").unwrap();
        lib.keep_arrived(&missing.hash, &arriving).unwrap();
        assert!(!arriving.exists());
        assert_eq!(fs::read(lib.stored_path(&missing.hash).unwrap()).unwrap(), b"to come");
        assert_eq!(lib.files.get(&missing.hash).unwrap().path, later.path);
        assert!(attachments::find_by_hash(lib.dir(), &missing.hash).is_some());

        // The folder goes elsewhere: what was in it stands where it stood.
        lib.put_file_folders(Vec::new()).unwrap();
        assert!(lib.files.folders().is_empty());
        assert_eq!(lib.files.get(&hash).unwrap().folder, None);
    }

    #[test]
    fn what_could_not_be_read_and_what_was_amiss_are_told() {
        let (_tmp, mut lib) = library();
        assert!(!lib.take_damaged().any());
        let mut text = fs::read_to_string(lib.file()).unwrap_or_default();
        text.push_str("@book{broken, title={Not closed, glaukopis-id = {held-in-broken-text}\n");
        fs::write(lib.file(), text).unwrap();
        lib.refresh().unwrap();
        assert!(lib.unread_holds("held-in-broken-text"));
        assert!(!lib.unread_holds("another"));

        // A record of the files that cannot be read is set aside, and said to be amiss.
        fs::write(lib.dir().join(super::super::files::FILE), b"{ not json").unwrap();
        let mut again = Library::open_at(lib.dir()).unwrap();
        assert_eq!(again.take_damaged(), Damaged { files: true, ..Default::default() });
        assert!(!again.take_damaged().any(), "said once");
    }
}
