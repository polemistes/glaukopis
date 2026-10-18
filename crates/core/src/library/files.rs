//! What is known of the files of the library, and the folders they are kept
//! in: `library/files.json`, beside the store (ADR 0043).
//!
//! The store itself (`attachments.rs`) keeps every file by the hash of its
//! content, and the entries name the files they have by their stored paths.
//! The record says what the store cannot: what a file is called in the
//! lists, which folder it stands in, where it came from and when. A file may
//! belong to no entry; it is in the store all the same, and leaves it only
//! when it is removed itself.

use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::Path;

use serde::{Deserialize, Serialize};

use crate::error::{Error, Result};
use crate::fsutil::write_atomic;
use crate::sidefile::{self, SetAside};
use crate::tr;

use super::attachments;

/// The name of the record, in the library's directory.
pub const FILE: &str = "files.json";

/// A folder of the files of the library. It may lie in another.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct FileFolder {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent: Option<String>,
    /// Sorts among its siblings as a string; new folders are given one after the last.
    pub order: String,
}

/// What is known of one file of the store.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct FileRecord {
    /// The SHA-256 of what the file holds: the name the store keeps it by.
    pub hash: String,
    /// Where it is in the store, relative to the library, as the entries name it.
    pub path: String,
    /// What the file is called in the lists: at first, the name it was stored under.
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub folder: Option<String>,
    /// Where it came from: the path it was copied from, where that is known.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub origin: Option<String>,
    /// When it was taken in, as the library writes times; for a file found
    /// in the store without a record, the time of the file.
    pub added: String,
}

/// The record of the files of the library.
///
/// The files are found by their hashes and the folders by their ids through
/// indexes kept beside the lists: a store of thousands of files is looked
/// through at every load (`reconcile`) and for every view of the files, and
/// a search of the list for each made those quadratic. The lists are changed
/// only here, so that the indexes stay true to them.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", from = "Stored")]
pub struct Files {
    folders: Vec<FileFolder>,
    files: Vec<FileRecord>,
    /// Where each file stands in `files`, by its hash.
    #[serde(skip)]
    by_hash: HashMap<String, usize>,
    /// Where each folder stands in `folders`, by its id.
    #[serde(skip)]
    by_id: HashMap<String, usize>,
    /// The first folder of each name under each parent, by the two.
    #[serde(skip)]
    by_place: HashMap<(Option<String>, String), usize>,
}

/// The record as it is written.
#[derive(Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
struct Stored {
    folders: Vec<FileFolder>,
    files: Vec<FileRecord>,
}

impl From<Stored> for Files {
    fn from(stored: Stored) -> Files {
        let mut files = Files { folders: stored.folders, files: stored.files, ..Default::default() };
        files.index_files();
        files.index_folders();
        files
    }
}

/// Two records are the same where their lists are: the indexes follow from them.
impl PartialEq for Files {
    fn eq(&self, other: &Files) -> bool {
        self.folders == other.folders && self.files == other.files
    }
}

impl Files {
    /// The files, in the order of the record.
    pub fn files(&self) -> &[FileRecord] {
        &self.files
    }

    /// The folders, in the order they were made in.
    pub fn folders(&self) -> &[FileFolder] {
        &self.folders
    }

    fn index_files(&mut self) {
        self.by_hash = self.files.iter().enumerate().map(|(i, f)| (f.hash.clone(), i)).collect();
    }

    fn index_folders(&mut self) {
        self.by_id = self.folders.iter().enumerate().map(|(i, f)| (f.id.clone(), i)).collect();
        self.by_place.clear();
        for (i, f) in self.folders.iter().enumerate() {
            self.by_place.entry((f.parent.clone(), f.name.clone())).or_insert(i);
        }
    }

    fn folder_at(&self, id: &str) -> Option<&FileFolder> {
        self.by_id.get(id).map(|&i| &self.folders[i])
    }

    /// Enters a record of a file the record does not know; one it knows is
    /// put in the place of what was known.
    pub fn insert(&mut self, record: FileRecord) {
        match self.by_hash.get(&record.hash) {
            Some(&at) => self.files[at] = record,
            None => {
                self.by_hash.insert(record.hash.clone(), self.files.len());
                self.files.push(record);
            }
        }
    }

    /// Forgets the files of these hashes. Returns how many it knew.
    pub fn forget_all(&mut self, hashes: &HashSet<&str>) -> usize {
        let before = self.files.len();
        self.files.retain(|f| !hashes.contains(f.hash.as_str()));
        if self.files.len() != before {
            self.index_files();
        }
        before - self.files.len()
    }

    /// Reads the record; one that is not there is empty, and one that
    /// cannot be read is set aside (see `sidefile`), which `aside` says.
    pub fn load(path: &Path) -> Result<(Self, Option<SetAside>)> {
        let read = sidefile::read_json::<Files>(path)?;
        let aside = read.set_aside().cloned();
        Ok((read.or_default(), aside))
    }

    pub fn save(&self, path: &Path) -> Result<()> {
        write_atomic(path, serde_json::to_string_pretty(self)?.as_bytes())
    }

    pub fn get(&self, hash: &str) -> Option<&FileRecord> {
        self.by_hash.get(hash).map(|&i| &self.files[i])
    }

    fn get_mut(&mut self, hash: &str) -> Result<&mut FileRecord> {
        match self.by_hash.get(hash) {
            Some(&i) => Ok(&mut self.files[i]),
            None => Err(Error::not_found(tr!("core-library-the-file-of-library"))),
        }
    }

    /// Enters a file of the store that the record does not know. One that it
    /// knows keeps what is known of it, its path brought up to date. Returns
    /// whether anything changed.
    pub fn record(&mut self, path: &str, folder: Option<&str>, origin: Option<&str>, added: &str) -> bool {
        let Some(hash) = attachments::hash_of_path(path) else { return false };
        if let Some(&at) = self.by_hash.get(hash) {
            let known = &mut self.files[at];
            if known.path != path {
                known.path = path.to_owned();
                return true;
            }
            return false;
        }
        let folder = folder.filter(|f| self.by_id.contains_key(*f)).map(str::to_owned);
        self.insert(FileRecord {
            hash: hash.to_owned(),
            path: path.to_owned(),
            name: path.rsplit('/').next().unwrap_or(path).to_owned(),
            folder,
            origin: origin.filter(|o| !o.is_empty()).map(str::to_owned),
            added: added.to_owned(),
        });
        true
    }

    /// Forgets a file. Returns what was known of it.
    pub fn forget(&mut self, hash: &str) -> Option<FileRecord> {
        let at = *self.by_hash.get(hash)?;
        let record = self.files.remove(at);
        self.index_files();
        Some(record)
    }

    pub fn rename(&mut self, hash: &str, name: &str) -> Result<FileRecord> {
        let name = check_name(name)?;
        let file = self.get_mut(hash)?;
        file.name = name;
        Ok(file.clone())
    }

    /// Puts a file in a folder, or at the top in none.
    pub fn move_file(&mut self, hash: &str, folder: Option<&str>) -> Result<FileRecord> {
        if let Some(folder) = folder {
            self.folder(folder)?;
        }
        let file = self.get_mut(hash)?;
        file.folder = folder.map(str::to_owned);
        Ok(file.clone())
    }

    // ---- folders ----

    pub fn folder(&self, id: &str) -> Result<&FileFolder> {
        self.folder_at(id).ok_or_else(|| Error::not_found(tr!("core-library-the-folder")))
    }

    /// The folders, in their order.
    pub fn folders_sorted(&self) -> Vec<FileFolder> {
        let mut folders = self.folders.clone();
        folders.sort_by(|a, b| a.order.cmp(&b.order).then(a.name.cmp(&b.name)));
        folders
    }

    /// Whether `folder` is `ancestor`, or lies under it.
    fn folder_under(&self, folder: &str, ancestor: &str) -> bool {
        let mut at = Some(folder.to_owned());
        let mut steps = 0;
        while let Some(id) = at {
            if id == ancestor {
                return true;
            }
            steps += 1;
            if steps > self.folders.len() {
                return false;
            }
            at = self.folder_at(&id).and_then(|f| f.parent.clone());
        }
        false
    }

    pub fn folder_create(&mut self, name: &str, parent: Option<&str>) -> Result<FileFolder> {
        let name = check_name(name)?;
        if let Some(parent) = parent {
            self.folder(parent)?;
        }
        let last = self.folders.iter().map(|f| f.order.as_str()).max();
        let folder = FileFolder {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            parent: parent.map(str::to_owned),
            order: next_order(last),
        };
        self.by_id.insert(folder.id.clone(), self.folders.len());
        self.by_place.entry((folder.parent.clone(), folder.name.clone())).or_insert(self.folders.len());
        self.folders.push(folder.clone());
        Ok(folder)
    }

    /// The folder of this name under `parent`, made where there is none.
    pub fn folder_named(&mut self, name: &str, parent: Option<&str>) -> Result<FileFolder> {
        let name = check_name(name)?;
        if let Some(&at) = self.by_place.get(&(parent.map(str::to_owned), name.clone())) {
            return Ok(self.folders[at].clone());
        }
        self.folder_create(&name, parent)
    }

    pub fn folder_rename(&mut self, id: &str, name: &str) -> Result<FileFolder> {
        let name = check_name(name)?;
        self.folder(id)?;
        let at = self.by_id[id];
        self.folders[at].name = name;
        self.index_folders();
        Ok(self.folders[at].clone())
    }

    /// Puts a folder in another, or at the top. A folder cannot be put in
    /// itself or in one that lies under it.
    pub fn folder_move(&mut self, id: &str, parent: Option<&str>) -> Result<FileFolder> {
        self.folder(id)?;
        if let Some(parent) = parent {
            self.folder(parent)?;
            if self.folder_under(parent, id) {
                return Err(Error::invalid(tr!("core-library-folder-in-itself")));
            }
        }
        let at = self.by_id[id];
        self.folders[at].parent = parent.map(str::to_owned);
        self.index_folders();
        Ok(self.folders[at].clone())
    }

    /// Deletes a folder. The folders and files in it move up to where it was.
    pub fn folder_delete(&mut self, id: &str) -> Result<()> {
        let parent = self.folder(id)?.parent.clone();
        for f in self.folders.iter_mut() {
            if f.parent.as_deref() == Some(id) {
                f.parent = parent.clone();
            }
        }
        for f in self.files.iter_mut() {
            if f.folder.as_deref() == Some(id) {
                f.folder = parent.clone();
            }
        }
        self.folders.retain(|f| f.id != id);
        self.index_folders();
        Ok(())
    }

    /// The folders that removing these files would leave empty: those the
    /// files stood in, and the folders above them, where nothing else would
    /// be left in them or under them. A folder that was empty before, or
    /// that holds one that was, is not among them: it was made for files to
    /// come, and stays.
    pub fn left_empty(&self, removed: &HashSet<&str>) -> Vec<String> {
        let mut touched: HashSet<String> = HashSet::new();
        for file in self.files.iter().filter(|f| removed.contains(f.hash.as_str())) {
            if let Some(folder) = &file.folder {
                touched.extend(self.path_of(folder).into_iter().map(|f| f.id));
            }
        }
        let kept: Vec<&str> = self
            .files
            .iter()
            .filter(|f| !removed.contains(f.hash.as_str()))
            .filter_map(|f| f.folder.as_deref())
            .collect();
        let mut out: Vec<String> = touched
            .iter()
            .filter(|id| {
                let under = self.with_descendants(id);
                under.iter().all(|u| touched.contains(u)) && !kept.iter().any(|k| under.iter().any(|u| u == k))
            })
            .cloned()
            .collect();
        out.sort();
        out
    }

    /// The folder and every folder under it.
    pub fn with_descendants(&self, id: &str) -> Vec<String> {
        let mut out = vec![id.to_owned()];
        let mut i = 0;
        while i < out.len() {
            let at = out[i].clone();
            for f in &self.folders {
                if f.parent.as_deref() == Some(at.as_str()) && !out.contains(&f.id) {
                    out.push(f.id.clone());
                }
            }
            i += 1;
        }
        out
    }

    /// The folders from the top down to this one, its own name last.
    pub fn path_of(&self, id: &str) -> Vec<FileFolder> {
        let mut out = Vec::new();
        let mut at = self.folder_at(id);
        while let Some(folder) = at {
            if out.iter().any(|f: &FileFolder| f.id == folder.id) {
                break;
            }
            out.push(folder.clone());
            at = folder.parent.as_deref().and_then(|p| self.folder_at(p));
        }
        out.reverse();
        out
    }

    /// Enters every file of the store that the record does not know, in no
    /// folder, with the time of the file as when it was taken in. A record
    /// whose file is gone stays: the lists say it is missing. Returns
    /// whether anything was entered.
    pub fn reconcile(&mut self, library_dir: &Path) -> bool {
        let root = library_dir.join(attachments::DIR);
        let Ok(shelves) = fs::read_dir(&root) else { return false };
        let mut changed = false;
        for shelf in shelves.flatten() {
            if !shelf.file_type().is_ok_and(|t| t.is_dir()) {
                continue;
            }
            let Ok(hashes) = fs::read_dir(shelf.path()) else { continue };
            for dir in hashes.flatten() {
                let hash = dir.file_name().to_string_lossy().into_owned();
                if !dir.file_type().is_ok_and(|t| t.is_dir()) || !attachments::is_hash(&hash) {
                    continue;
                }
                if self.get(&hash).is_some() {
                    continue;
                }
                let Ok(inside) = fs::read_dir(dir.path()) else { continue };
                let found = inside.flatten().find(|e| {
                    e.file_type().is_ok_and(|t| t.is_file()) && !e.file_name().to_string_lossy().starts_with(".tmp-")
                });
                let Some(file) = found else { continue };
                let shelf_name = shelf.file_name().to_string_lossy().into_owned();
                let path =
                    format!("{}/{}/{}/{}", attachments::DIR, shelf_name, hash, file.file_name().to_string_lossy());
                let added = file
                    .metadata()
                    .ok()
                    .and_then(|m| m.modified().ok())
                    .map(|t| {
                        let t: time::OffsetDateTime = t.into();
                        t.replace_nanosecond(0)
                            .unwrap_or(t)
                            .format(&time::format_description::well_known::Rfc3339)
                            .unwrap_or_default()
                    })
                    .unwrap_or_else(super::now);
                changed |= self.record(&path, None, None, &added);
            }
        }
        changed
    }
}

/// A file copied into the store by `store_paths`, to be entered into the
/// record by `Library::enter_taken`.
#[derive(Debug, Clone, PartialEq)]
pub struct Taken {
    pub stored: String,
    /// The names of the folders it stood in, from the top folder that was
    /// taken in down to its own; empty for a file taken in by itself, or
    /// where the structure is not kept.
    pub folders: Vec<String>,
    /// The path it was copied from.
    pub origin: String,
}

/// Copies files, and the files in folders, into the store, each under its
/// own name. A folder is walked through, without following links and passing
/// over what is hidden (a name beginning with a dot) and what is empty; with
/// `structure`, every file says the folders it stood in, the folder that was
/// given first among them. `progress` is told how many are done of how many,
/// and of the one at hand. What cannot be read is said, and the rest go on.
/// Nothing is entered into the record: the library need not be held while
/// files are copied.
pub fn store_paths(
    library_dir: &Path,
    paths: &[std::path::PathBuf],
    structure: bool,
    progress: &mut dyn FnMut(usize, usize, &str),
    stop: &std::sync::atomic::AtomicBool,
) -> (Vec<Taken>, Vec<String>) {
    let mut found: Vec<(std::path::PathBuf, Vec<String>)> = Vec::new();
    let mut problems = Vec::new();
    for path in paths {
        let Ok(meta) = fs::symlink_metadata(path) else {
            problems.push(tr!("core-library-not-a-file", path = path));
            continue;
        };
        if meta.is_dir() {
            let top = path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
            walk(path, if structure { vec![top] } else { Vec::new() }, structure, &mut found, &mut problems);
        } else if meta.is_file() {
            found.push((path.clone(), Vec::new()));
        } else {
            problems.push(tr!("core-library-not-a-file", path = path));
        }
    }
    let total = found.len();
    let mut taken = Vec::with_capacity(total);
    for (done, (path, folders)) in found.into_iter().enumerate() {
        if stop.load(std::sync::atomic::Ordering::Relaxed) {
            break;
        }
        let name = path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
        progress(done, total, &name);
        match attachments::store_file(library_dir, &path, &name) {
            Ok(stored) => taken.push(Taken { stored, folders, origin: path.display().to_string() }),
            Err(e) => problems.push(format!("{name}: {e}")),
        }
    }
    progress(taken.len(), total, "");
    (taken, problems)
}

fn walk(
    dir: &Path,
    folders: Vec<String>,
    structure: bool,
    found: &mut Vec<(std::path::PathBuf, Vec<String>)>,
    problems: &mut Vec<String>,
) {
    let entries = match fs::read_dir(dir) {
        Ok(entries) => entries,
        Err(e) => {
            problems.push(format!("{}: {e}", dir.display()));
            return;
        }
    };
    let mut entries: Vec<_> = entries.flatten().collect();
    entries.sort_by_key(|e| e.file_name());
    for e in entries {
        let name = e.file_name().to_string_lossy().into_owned();
        if name.starts_with('.') {
            continue;
        }
        let Ok(kind) = e.file_type() else { continue };
        if kind.is_dir() {
            let mut deeper = folders.clone();
            if structure {
                deeper.push(name);
            }
            walk(&e.path(), deeper, structure, found, problems);
        } else if kind.is_file() && e.metadata().is_ok_and(|m| m.len() > 0) {
            found.push((e.path(), folders.clone()));
        }
    }
}

/// The kind of a file, by the ending of its name: what can be done with it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum FileKind {
    Pdf,
    Picture,
    Document,
    #[default]
    Other,
}

pub fn kind_of(name: &str) -> FileKind {
    let ending = name.rsplit_once('.').map(|(_, e)| e.to_ascii_lowercase()).unwrap_or_default();
    if ending == "pdf" {
        FileKind::Pdf
    } else if crate::ocr::PICTURE_ENDINGS.contains(&ending.as_str()) {
        FileKind::Picture
    } else if crate::import::document::ENDINGS.contains(&ending.as_str()) {
        FileKind::Document
    } else {
        FileKind::Other
    }
}

fn check_name(name: &str) -> Result<String> {
    let name = name.split_whitespace().collect::<Vec<_>>().join(" ");
    if name.is_empty() {
        return Err(Error::invalid(tr!("core-library-needs-name")));
    }
    if name.chars().count() > 240 {
        return Err(Error::invalid(tr!("core-library-name-too-long")));
    }
    Ok(name)
}

/// An order after the last: decimal numbers of six places, so that comparing
/// them as strings is comparing them as numbers.
fn next_order(last: Option<&str>) -> String {
    let n = last.and_then(|s| s.trim().parse::<u64>().ok()).unwrap_or(0);
    format!("{:06}", n + 1)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn folders_nest_and_move_up_when_deleted() {
        let mut files = Files::default();
        let greek = files.folder_create("Greek", None).unwrap();
        let homer = files.folder_create(" Homer ", Some(&greek.id)).unwrap();
        assert_eq!(homer.name, "Homer");
        assert!(greek.order < homer.order);
        let deeper = files.folder_create("Iliad", Some(&homer.id)).unwrap();

        // Not into itself, nor under itself.
        assert_eq!(files.folder_move(&greek.id, Some(&deeper.id)).unwrap_err().kind(), "invalid");
        assert_eq!(files.folder_move(&greek.id, Some(&greek.id)).unwrap_err().kind(), "invalid");
        assert_eq!(files.folder_create("", None).unwrap_err().kind(), "invalid");
        assert_eq!(files.folder_create("x", Some("nonsense")).unwrap_err().kind(), "not-found");

        let hash = "a".repeat(64);
        assert!(files.record(&format!("attachments/aa/{hash}/x.pdf"), Some(&homer.id), Some("/home/x.pdf"), "t"));
        assert!(!files.record(&format!("attachments/aa/{hash}/x.pdf"), None, None, "u"), "known already");
        assert_eq!(files.get(&hash).unwrap().folder.as_deref(), Some(homer.id.as_str()));
        assert_eq!(files.with_descendants(&greek.id).len(), 3);
        assert_eq!(
            files.path_of(&deeper.id).iter().map(|f| f.name.as_str()).collect::<Vec<_>>(),
            ["Greek", "Homer", "Iliad"]
        );

        files.folder_delete(&homer.id).unwrap();
        assert_eq!(files.get(&hash).unwrap().folder.as_deref(), Some(greek.id.as_str()));
        assert_eq!(files.folder(&deeper.id).unwrap().parent.as_deref(), Some(greek.id.as_str()));

        assert_eq!(files.move_file(&hash, Some("nonsense")).unwrap_err().kind(), "not-found");
        assert_eq!(files.move_file(&hash, None).unwrap().folder, None);
        assert_eq!(files.rename(&hash, "  The   Best ").unwrap().name, "The Best");
        assert_eq!(files.folder_named("Greek", None).unwrap().id, greek.id);
        assert_ne!(files.folder_named("Greek", Some(&deeper.id)).unwrap().id, greek.id);
    }

    #[test]
    fn the_store_is_reconciled_with_the_record() {
        let tmp = tempfile::tempdir().unwrap();
        let lib = tmp.path().join("library");
        fs::create_dir_all(&lib).unwrap();
        let a = tmp.path().join("a.pdf");
        fs::write(&a, b"%PDF a").unwrap();
        let b = tmp.path().join("b.png");
        fs::write(&b, b"png b").unwrap();
        let stored_a = attachments::store_file(&lib, &a, "Nagy 1979").unwrap();
        attachments::store_file(&lib, &b, "plate").unwrap();

        let mut files = Files::default();
        files.record(&stored_a, None, Some("/desk/a.pdf"), "then");
        assert!(files.reconcile(&lib));
        assert_eq!(files.files.len(), 2);
        assert_eq!(files.files[0].origin.as_deref(), Some("/desk/a.pdf"), "what was known is kept");
        let plate = files.files.iter().find(|f| f.name == "plate.png").unwrap();
        assert!(plate.added.starts_with("20"), "{}", plate.added);
        assert!(!files.reconcile(&lib), "nothing more to enter");

        let path = lib.join(FILE);
        files.save(&path).unwrap();
        assert_eq!(Files::load(&path).unwrap().0, files);
        assert_eq!(Files::load(&tmp.path().join("none.json")).unwrap().0, Files::default());
    }

    /// The indexes follow the lists through every change, and are made again when the record is read.
    #[test]
    fn files_and_folders_are_found_after_every_change() {
        let mut files = Files::default();
        let hashes: Vec<String> = (0..5).map(|i| attachments::hash_bytes(&[i])).collect();
        for (i, hash) in hashes.iter().enumerate() {
            assert!(files.record(&format!("attachments/{}/{hash}/{i}.pdf", &hash[..2]), None, None, "t"));
        }
        assert_eq!(files.forget(&hashes[1]).unwrap().hash, hashes[1]);
        assert_eq!(files.forget_all(&[hashes[0].as_str(), hashes[3].as_str(), "unknown"].into_iter().collect()), 2);
        assert!(files.get(&hashes[0]).is_none() && files.get(&hashes[1]).is_none() && files.get(&hashes[3]).is_none());
        assert_eq!(files.get(&hashes[4]).unwrap().name, "4.pdf");
        assert_eq!(files.rename(&hashes[2], "Two").unwrap().name, "Two");
        files.insert(FileRecord { hash: hashes[2].clone(), name: "Again".into(), ..Default::default() });
        assert_eq!(files.files().len(), 2);
        assert_eq!(files.get(&hashes[2]).unwrap().name, "Again");

        let greek = files.folder_create("Greek", None).unwrap();
        let latin = files.folder_create("Latin", None).unwrap();
        let epic = files.folder_create("Epic", Some(&greek.id)).unwrap();
        files.folder_rename(&greek.id, "Hellenic").unwrap();
        assert_ne!(files.folder_named("Greek", None).unwrap().id, greek.id, "the old name is free");
        assert_eq!(files.folder_named("Hellenic", None).unwrap().id, greek.id);
        files.folder_move(&epic.id, Some(&latin.id)).unwrap();
        assert_eq!(files.folder_named("Epic", Some(&latin.id)).unwrap().id, epic.id);
        assert_ne!(files.folder_named("Epic", Some(&greek.id)).unwrap().id, epic.id);
        files.move_file(&hashes[4], Some(&epic.id)).unwrap();
        files.folder_delete(&latin.id).unwrap();
        assert!(files.folder(&latin.id).is_err());
        assert_eq!(files.path_of(&epic.id).len(), 1, "moved up to the top");
        assert_eq!(files.folder(&epic.id).unwrap().name, "Epic");

        let tmp = tempfile::tempdir().unwrap();
        let path = tmp.path().join(FILE);
        files.save(&path).unwrap();
        let read = Files::load(&path).unwrap().0;
        assert_eq!(read, files);
        assert_eq!(read.get(&hashes[4]).unwrap().folder.as_deref(), Some(epic.id.as_str()));
        assert_eq!(read.folder(&greek.id).unwrap().name, "Hellenic");
        assert_eq!(read.clone().folder_named("Epic", None).unwrap().id, epic.id);
    }

    #[test]
    fn kinds_by_ending() {
        assert_eq!(kind_of("Nagy 1979.PDF"), FileKind::Pdf);
        assert_eq!(kind_of("plate.jpeg"), FileKind::Picture);
        assert_eq!(kind_of("paper.docx"), FileKind::Document);
        assert_eq!(kind_of("book.epub"), FileKind::Document);
        assert_eq!(kind_of("book.djvu"), FileKind::Other);
        assert_eq!(kind_of("README"), FileKind::Other);
    }

    /// A store of many files in many folders, taken in, reconciled and
    /// looked up as the library does at every load and in the files view.
    #[test]
    #[ignore = "a measure, to be run in release: cargo test --release -p glaukopis-core -- --ignored many_files_recorded"]
    fn many_files_recorded() {
        for count in [5_000, 20_000] {
            let mut files = Files::default();
            let hashes: Vec<String> = (0..count).map(|i| attachments::hash_bytes(format!("{i}").as_bytes())).collect();
            let began = std::time::Instant::now();
            for (i, hash) in hashes.iter().enumerate() {
                // As `enter_taken`: the folders of the file made where they are not, then the file entered.
                let top = files.folder_named(&format!("Author {}", i % 100), None).unwrap();
                let sub = files.folder_named(&format!("Work {}", i % 7), Some(&top.id)).unwrap();
                assert!(files.get(hash).is_none());
                files.record(&format!("attachments/{}/{hash}/file {i}.pdf", &hash[..2]), Some(&sub.id), None, "t");
            }
            let entered = began.elapsed();
            let began = std::time::Instant::now();
            // As `reconcile` and `file_views`: every file looked up by its hash, and its folder's path.
            let mut deep = 0;
            for hash in &hashes {
                let record = files.get(hash).unwrap();
                deep += files.path_of(record.folder.as_deref().unwrap()).len();
            }
            let looked_up = began.elapsed();
            eprintln!(
                "{count} files in {} folders: entered in {entered:?}, each looked up with its folder in {looked_up:?}",
                files.folders().len()
            );
            assert_eq!(deep, 2 * count);
        }
    }
}
