//! The library as stores brought to be the same as the maps of the
//! library's document (`mirror`, record 0120): the folders of its files,
//! the record of the files, the references and the collections. The
//! document is of the kind the home document is (`home`), kept beside it in
//! `sync/library.bin`, since a library may hold thousands of references.
//!
//! | Map | Name | Value |
//! | --- | --- | --- |
//! | `meta` | `form` | the form of the library's document: `"1"` |
//! | `file-folders` | `<folder>/name`, `/parent`, `/order` | a folder of the files, field by field |
//! | `files` | `<hash>/added` | the record of a file: when it was taken in |
//! | | `<hash>/name`, `/folder`, `/origin`, `/width`, `/height`, `/alt`, `/from`, `/notebook` | the rest of it, field by field |
//! | | `<hash>/mark/<id>` | a bookmark in it: `{page, at, name}` |
//! | `references` | `<id>/=added` | a reference: when it was added |
//! | | `<id>/=type`, `/=key`, `/=modified`, `/=merged`, `/=zotero` | the entry's own parts |
//! | | `<id>/<field>` | each BibLaTeX field, but `file` |
//! | | `<id>/=file/<hash>` | a file of the store it has, by its place among them |
//! | `collections` | `<collection>/created` | a collection: when it was made |
//! | | `<collection>/name`, `/parent` | |
//! | | `<collection>/in/<entry>` | an entry in it, by its place among them |
//! | `stored` | `<hash>` | that the home holds the file, and its size (`files`) |
//!
//! A reference, a collection and a record are many names, so that what was
//! changed of one on one computer and what of it on another are both kept.
//! Each is there by a name that never changes once it is made (`=added`,
//! `created`, `added`): a reference deleted on one computer while another
//! changed it leaves what the other wrote without that name, and is put
//! back whole by every computer that holds it (`put_back`); and one that is
//! deleted here after another changed it is taken back (`take_back`). It is
//! kept, then, on every computer, as a project written in on one computer
//! and deleted on another is kept. A folder of the files is there by its
//! name, as a folder of projects is (`arrangement`).
//!
//! What lies only on this disk stays: where a file lies in the store, here
//! and in the `file` field of a reference, which follows as hashes; a path
//! in that field outside the store; what the library's file holds besides
//! its entries; the small pictures of the files.

use std::cell::{Cell, RefCell};
use std::collections::{BTreeMap, BTreeSet};
use std::sync::{Mutex, MutexGuard, PoisonError};

use serde::{Deserialize, Serialize};

use crate::error::Result;
use crate::library::elsewhere::Arrived;
use crate::library::files::{Bookmark, FileFolder, Held};
use crate::library::{Collection, Entry, FileRecord, Library, attachments, entry};

use super::home::HomeDoc;
use super::kept::Kept;
use super::mirror::Store;

/// The form of the library's document this version writes and reads.
pub const LIBRARY_FORM: u32 = 1;

/// The map that says which files the home holds.
pub const STORED: &str = "stored";

/// The longest name a folder of the files is given from elsewhere, as one typed here may be.
const NAME_LIMIT: usize = 240;

fn locked(library: &Mutex<Library>) -> MutexGuard<'_, Library> {
    library.lock().unwrap_or_else(PoisonError::into_inner)
}

/// The library held by a store that writes into it, counting how often its
/// files are written while it is held (`Library::writes`), so that the round
/// can tell what it wrote itself from what others wrote meanwhile.
struct Writing<'a> {
    library: MutexGuard<'a, Library>,
    before: u64,
    written: &'a Cell<u64>,
}

impl<'a> Writing<'a> {
    fn new(library: &'a Mutex<Library>, written: &'a Cell<u64>) -> Self {
        let library = locked(library);
        let before = library.writes();
        Writing { library, before, written }
    }
}

impl std::ops::Deref for Writing<'_> {
    type Target = Library;

    fn deref(&self) -> &Library {
        &self.library
    }
}

impl std::ops::DerefMut for Writing<'_> {
    fn deref_mut(&mut self) -> &mut Library {
        &mut self.library
    }
}

impl Drop for Writing<'_> {
    fn drop(&mut self) {
        self.written.set(self.written.get() + self.library.writes().saturating_sub(self.before));
    }
}

/// Where a thing stands among others, as a number of six places.
fn place(index: usize) -> String {
    format!("{:06}", index + 1)
}

/// The names of a map that are of one thing: those that begin with its id and a slash.
pub fn under<'m>(map: &'m BTreeMap<String, String>, id: &str) -> impl Iterator<Item = (&'m String, &'m String)> {
    let prefix = format!("{id}/");
    map.range(prefix.clone()..).take_while(move |(name, _)| name.starts_with(&prefix))
}

/// Changes by the thing they are of: its id, and each part with what it is now.
fn by_thing(changes: &BTreeMap<String, Option<String>>) -> BTreeMap<&str, Vec<(&str, Option<&str>)>> {
    let mut out: BTreeMap<&str, Vec<(&str, Option<&str>)>> = BTreeMap::new();
    for (name, value) in changes {
        if let Some((id, part)) = name.split_once('/')
            && !id.is_empty()
        {
            out.entry(id).or_default().push((part, value.as_deref()));
        }
    }
    out
}

/// Things in their order, by their places: those that came with one, those
/// that had one, and the rest after, each kept where it was among the others.
fn in_order(had: &[String], changes: &[(&str, Option<&str>)], prefix: &str) -> Vec<String> {
    let mut placed: BTreeMap<String, String> = had.iter().enumerate().map(|(i, id)| (id.clone(), place(i))).collect();
    for (part, value) in changes {
        let Some(id) = part.strip_prefix(prefix) else { continue };
        match value {
            Some(at) => placed.insert(id.to_owned(), (*at).to_owned()),
            None => placed.remove(id),
        };
    }
    let mut order: Vec<(String, String)> = placed.into_iter().map(|(id, at)| (at, id)).collect();
    order.sort();
    order.into_iter().map(|(_, id)| id).collect()
}

/// Whether the map knows a thing: whether it holds the name by which it is there.
fn known(doc: &HomeDoc, map: &str, name: &str, exists: &str) -> bool {
    name.split_once('/').is_some_and(|(id, _)| doc.get(map, &format!("{id}/{exists}")).is_some())
}

// ---------------------------------------------------------------------------
// What was deleted on one computer and changed on another

/// What a store says of its things, for `take_back` and `put_back`: the
/// name by which one is there, and the beginning of the names that only say
/// where one of its parts stands among the others (which a store may number
/// anew: whether such a name is there says something, its value does not).
#[derive(Debug, Clone, Copy)]
pub struct Things {
    pub exists: &'static str,
    pub order: Option<&'static str>,
}

pub const OF_REFERENCES: Things = Things { exists: REFERENCE, order: Some("=file/") };
pub const OF_COLLECTIONS: Things = Things { exists: COLLECTION, order: Some("in/") };
pub const OF_RECORDS: Things = Things { exists: RECORD, order: None };

impl Things {
    /// Whether two say the same of one thing.
    fn same<'m>(
        &self,
        a: impl Iterator<Item = (&'m String, &'m String)>,
        b: impl Iterator<Item = (&'m String, &'m String)>,
    ) -> bool {
        let said = |(name, value): (&'m String, &'m String)| {
            let part = name.split_once('/').map_or("", |(_, part)| part);
            let only_order = self.order.is_some_and(|order| part.starts_with(order));
            (name, if only_order { None } else { Some(value) })
        };
        a.map(said).eq(b.map(said))
    }
}

/// Takes back what was deleted here of things that were changed elsewhere
/// since the store and its map last agreed: they are written back to the
/// store as the map has them, and their deletion is never told. Done before
/// what changed here is written into the map, where what changed elsewhere
/// was taken in first.
pub fn take_back(doc: &HomeDoc, kept: &Kept, store: &dyn Store, things: Things) -> Result<()> {
    let Some(agreed) = kept.base(store.name())? else { return Ok(()) };
    let map = doc.map(store.name());
    let here = store.read()?;
    let ending = format!("/{}", things.exists);
    let mut changes = BTreeMap::new();
    for name in agreed.keys().filter(|name| name.ends_with(&ending)) {
        let id = &name[..name.len() - ending.len()];
        // Still here, or gone from the map as well.
        if here.contains_key(name) || !map.contains_key(name) {
            continue;
        }
        if !things.same(under(&map, id), under(&agreed, id)) {
            changes.extend(under(&map, id).map(|(name, value)| (name.clone(), Some(value.clone()))));
        }
    }
    if !changes.is_empty() {
        tracing::info!(store = store.name(), "what was deleted here and changed elsewhere is taken back");
        store.write(&changes)?;
    }
    Ok(())
}

/// Puts back things of which the map holds names but not the one by which
/// they are there: deleted on one computer while another changed them. What
/// the map lacks of each is written into it from the store, or from what
/// was last agreed where the store has it no more. Whether anything was
/// written. A thing no one here knows of is left as it is: its names are
/// spoken of by no store (`Store::speaks_of`).
pub fn put_back(doc: &HomeDoc, kept: &Kept, store: &dyn Store, things: Things) -> Result<bool> {
    let map = doc.map(store.name());
    let ending = format!("/{}", things.exists);
    let orphans: BTreeSet<&str> = map
        .keys()
        .filter_map(|name| name.split_once('/').map(|(id, _)| id))
        .filter(|id| !map.contains_key(&format!("{id}{ending}")))
        .collect();
    if orphans.is_empty() {
        return Ok(false);
    }
    let here = store.read()?;
    let agreed = kept.base(store.name())?.unwrap_or_default();
    let mut put = BTreeMap::new();
    for id in orphans {
        let from = if under(&here, id).next().is_some() { &here } else { &agreed };
        for (name, value) in under(from, id) {
            if !map.contains_key(name) {
                put.insert(name.clone(), Some(value.clone()));
            }
        }
    }
    if !put.is_empty() {
        tracing::info!(store = store.name(), "what was deleted elsewhere while it was changed is put back");
    }
    Ok(doc.set(store.name(), &put))
}

/// Forgets of what a store and its map agreed on the names `which` says:
/// they are told as changed here when they next meet. For what the store
/// made otherwise than the map said, by its own rules.
pub fn forget_agreed(kept: &Kept, store: &str, which: impl Fn(&str) -> bool) -> Result<()> {
    let Some(mut agreed) = kept.base(store)? else { return Ok(()) };
    let before = agreed.len();
    agreed.retain(|name, _| !which(name));
    if agreed.len() != before {
        kept.keep_base(store, &agreed)?;
    }
    Ok(())
}

// ---------------------------------------------------------------------------
// The references

/// The references of the library, entry by entry and field by field.
pub struct References<'a> {
    pub library: &'a Mutex<Library>,
    /// The library's document: what it knows is spoken of.
    pub doc: &'a HomeDoc,
    /// How often the library's files were written by this store (`Writing`).
    pub written: Cell<u64>,
}

/// The name by which a reference is there.
pub const REFERENCE: &str = "=added";

/// An id a reference can be known by among the names of a map.
fn speakable(id: &str) -> bool {
    !id.is_empty() && !id.contains('/')
}

fn names_of_entry(e: &Entry, out: &mut BTreeMap<String, String>) {
    let id = &e.id;
    out.insert(format!("{id}/{REFERENCE}"), e.added.clone());
    out.insert(format!("{id}/=type"), e.entry_type.clone());
    out.insert(format!("{id}/=key"), e.key.clone());
    if !e.modified.is_empty() {
        out.insert(format!("{id}/=modified"), e.modified.clone());
    }
    if !e.merged.is_empty() {
        out.insert(format!("{id}/=merged"), e.merged.join(","));
    }
    if !e.zotero.is_empty() {
        out.insert(format!("{id}/=zotero"), e.zotero.join(" "));
    }
    for (field, value) in &e.fields {
        // A field's name holds no `=`: a name of the entry's own parts does.
        if field != "file" && !field.is_empty() && !field.contains('=') {
            out.insert(format!("{id}/{field}"), value.clone());
        }
    }
    for (i, hash) in hashes_of(e).iter().enumerate() {
        out.insert(format!("{id}/=file/{hash}"), place(i));
    }
}

/// The files of the store an entry has, by their hashes, in their order.
fn hashes_of(e: &Entry) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    for path in e.attachments() {
        if let Some(hash) = attachments::hash_of_path(&path)
            && !out.iter().any(|h| h == hash)
        {
            out.push(hash.to_owned());
        }
    }
    out
}

impl Store for References<'_> {
    fn name(&self) -> &'static str {
        "references"
    }

    fn read(&self) -> Result<BTreeMap<String, String>> {
        let mut library = locked(self.library);
        library.refresh()?;
        let mut out = BTreeMap::new();
        for e in library.entries().iter().filter(|e| speakable(&e.id)) {
            names_of_entry(e, &mut out);
        }
        Ok(out)
    }

    /// Nothing is said of a reference the map has no more but for what was
    /// written of it meanwhile (`put_back` sees to it), nor of one held in
    /// text of the library's file that could not be read: it was not taken out.
    fn speaks_of(&self, name: &str) -> bool {
        let Some((id, _)) = name.split_once('/') else { return false };
        known(self.doc, self.name(), name, REFERENCE) && !locked(self.library).unread_holds(id)
    }

    fn write(&self, changes: &BTreeMap<String, Option<String>>) -> Result<()> {
        let mut library = Writing::new(self.library, &self.written);
        library.refresh()?;
        let mut arrived = Vec::new();
        let mut gone = Vec::new();
        for (id, parts) in by_thing(changes) {
            if !speakable(id) {
                continue;
            }
            let had = library.get(id).cloned();
            if parts.iter().any(|(part, value)| *part == REFERENCE && value.is_none()) {
                if had.is_some() {
                    gone.push(id.to_owned());
                }
                continue;
            }
            // A reference is made here only by all that is said of it.
            if had.is_none() && !parts.iter().any(|(part, value)| *part == REFERENCE && value.is_some()) {
                continue;
            }
            let mut entry = had.clone().unwrap_or_else(|| Entry {
                id: id.to_owned(),
                key: String::new(),
                entry_type: String::new(),
                fields: Vec::new(),
                added: String::new(),
                modified: String::new(),
                merged: Vec::new(),
                zotero: Vec::new(),
            });
            for (part, value) in &parts {
                let text = value.unwrap_or_default();
                match *part {
                    REFERENCE => entry.added = text.to_owned(),
                    "=type" => entry.entry_type = text.to_owned(),
                    "=key" => entry.key = text.to_owned(),
                    "=modified" => entry.modified = text.to_owned(),
                    "=merged" => {
                        entry.merged =
                            text.split(',').map(str::trim).filter(|m| !m.is_empty()).map(str::to_owned).collect()
                    }
                    "=zotero" => entry.zotero = entry::zotero_keys(text),
                    part if part.starts_with('=') || part == "file" => {}
                    field => match value {
                        Some(value) => entry.set(field, *value),
                        None => {
                            entry.remove(field);
                        }
                    },
                }
            }
            let files = in_order(&had.as_ref().map(hashes_of).unwrap_or_default(), &parts, "=file/");
            arrived.push(Arrived { entry, files });
        }
        library.put_entries(arrived)?;
        if !gone.is_empty() {
            library.remove(&gone, false)?;
        }
        Ok(())
    }
}

/// The references whose key here is not the one the map says, as the
/// library's rules made it (two entries had one): to be told when the store
/// and its map next meet, so that every computer comes to give the same.
pub fn keys_made_here(library: &Mutex<Library>, doc: &HomeDoc) -> BTreeSet<String> {
    let library = locked(library);
    library
        .entries()
        .iter()
        .filter(|e| speakable(&e.id))
        .filter_map(|e| {
            let said = doc.get("references", &format!("{}/=key", e.id))?;
            (said != e.key).then(|| format!("{}/=key", e.id))
        })
        .collect()
}

// ---------------------------------------------------------------------------
// The collections

/// The collections of the library, each with the entries in it.
pub struct Collections<'a> {
    pub library: &'a Mutex<Library>,
    pub doc: &'a HomeDoc,
    pub written: Cell<u64>,
}

/// The name by which a collection is there.
pub const COLLECTION: &str = "created";

impl Store for Collections<'_> {
    fn name(&self) -> &'static str {
        "collections"
    }

    fn read(&self) -> Result<BTreeMap<String, String>> {
        let library = locked(self.library);
        let mut out = BTreeMap::new();
        for c in library.collections.list.iter().filter(|c| speakable(&c.id)) {
            out.insert(format!("{}/{COLLECTION}", c.id), c.created.clone());
            out.insert(format!("{}/name", c.id), c.name.clone());
            if let Some(parent) = &c.parent {
                out.insert(format!("{}/parent", c.id), parent.clone());
            }
            for (i, entry) in c.entries.iter().enumerate().filter(|(_, e)| speakable(e)) {
                out.insert(format!("{}/in/{entry}", c.id), place(i));
            }
        }
        Ok(out)
    }

    fn speaks_of(&self, name: &str) -> bool {
        known(self.doc, self.name(), name, COLLECTION)
    }

    fn write(&self, changes: &BTreeMap<String, Option<String>>) -> Result<()> {
        let mut library = Writing::new(self.library, &self.written);
        let mut list = library.collections.list.clone();
        for (id, parts) in by_thing(changes) {
            let at = list.iter().position(|c| c.id == id);
            if parts.iter().any(|(part, value)| *part == COLLECTION && value.is_none()) {
                if let Some(at) = at {
                    list.remove(at);
                }
                continue;
            }
            let at = match at {
                Some(at) => at,
                None if parts.iter().any(|(part, value)| *part == COLLECTION && value.is_some()) => {
                    list.push(Collection {
                        id: id.to_owned(),
                        name: String::new(),
                        parent: None,
                        entries: Vec::new(),
                        created: String::new(),
                    });
                    list.len() - 1
                }
                None => continue,
            };
            let c = &mut list[at];
            for (part, value) in &parts {
                match *part {
                    COLLECTION => c.created = value.unwrap_or_default().to_owned(),
                    "name" => c.name = value.unwrap_or_default().trim().to_owned(),
                    "parent" => c.parent = value.filter(|p| !p.is_empty()).map(str::to_owned),
                    _ => {}
                }
            }
            c.entries = in_order(&c.entries, &parts, "in/");
        }
        library.put_collections(list)
    }
}

// ---------------------------------------------------------------------------
// The folders of the files

/// The folders the files of the library are kept in, there by their names,
/// as the folders of projects are.
pub struct FileFolders<'a> {
    pub library: &'a Mutex<Library>,
    pub written: Cell<u64>,
}

impl Store for FileFolders<'_> {
    fn name(&self) -> &'static str {
        "file-folders"
    }

    fn read(&self) -> Result<BTreeMap<String, String>> {
        let library = locked(self.library);
        let mut out = BTreeMap::new();
        for f in library.files.folders().iter().filter(|f| speakable(&f.id)) {
            out.insert(format!("{}/name", f.id), f.name.clone());
            out.insert(format!("{}/parent", f.id), f.parent.clone().unwrap_or_default());
            out.insert(format!("{}/order", f.id), f.order.clone());
        }
        Ok(out)
    }

    fn write(&self, changes: &BTreeMap<String, Option<String>>) -> Result<()> {
        let mut library = Writing::new(self.library, &self.written);
        let mut folders: Vec<FileFolder> = library.files.folders().to_vec();
        let mut gone = BTreeSet::new();
        for (id, parts) in by_thing(changes) {
            for (part, value) in parts {
                if part == "name" && value.is_none() {
                    gone.insert(id.to_owned());
                    continue;
                }
                let at = match folders.iter().position(|f| f.id == id) {
                    Some(at) => at,
                    None => {
                        folders.push(FileFolder { id: id.to_owned(), ..Default::default() });
                        folders.len() - 1
                    }
                };
                let folder = &mut folders[at];
                let value = value.unwrap_or_default();
                match part {
                    "name" => {
                        folder.name =
                            value.split_whitespace().collect::<Vec<_>>().join(" ").chars().take(NAME_LIMIT).collect()
                    }
                    "parent" => folder.parent = Some(value.to_owned()).filter(|p| !p.is_empty()),
                    "order" => folder.order = value.to_owned(),
                    _ => {}
                }
            }
        }
        // A folder is there once it has a name: its other fields may have come first.
        folders.retain(|f| !gone.contains(&f.id) && !f.name.is_empty());
        library.put_file_folders(folders)
    }
}

// ---------------------------------------------------------------------------
// The record of the files

/// A bookmark as a name of the map holds it.
#[derive(Serialize, Deserialize)]
struct Mark {
    page: usize,
    at: f32,
    name: String,
}

/// The record of the files of the store, file by file and field by field:
/// every file of the store has one, the library's, the images of the
/// projects and the files the notes hold. Where a file lies on this disk
/// is not among them.
///
/// What the notes of this device hold is never taken from it by what
/// another device said (`held`). A device that reads less of the notebook
/// than there is sweeps out the files of the notes it does not know, and
/// tells the home that their records went, or that the notes hold them no
/// more. Here, where the notes hold the file, neither is taken: a record
/// said to be gone leaves the file to the notebook whatever its mark says,
/// and where the mark alone is said to be gone, the file is marked as one
/// the notes hold beside the library, which then lists it, whatever its
/// mark was here; and both are told again.
pub struct Records<'a> {
    pub library: &'a Mutex<Library>,
    pub doc: &'a HomeDoc,
    /// The files the notes here hold, as the notebook last said (`Notebook::held`).
    pub held: &'a BTreeSet<String>,
    /// The files whose records were taken out elsewhere and that stay
    /// here, held by the notes here: to be told again, so that a computer
    /// that took them out with less of the notebook than there is does not
    /// take them from the others.
    pub kept_for_notes: RefCell<BTreeSet<String>>,
    /// The files of which only the mark that the notes hold them was taken
    /// off elsewhere, and that are marked here as held beside the library,
    /// the notes here holding them: that mark is told again.
    pub marks_kept_for_notes: RefCell<BTreeSet<String>>,
    pub written: Cell<u64>,
}

/// The part of a record that says whether the notes hold the file.
pub const MARK: &str = "notebook";

/// The name by which a record is there.
pub const RECORD: &str = "added";

fn names_of_record(r: &FileRecord, out: &mut BTreeMap<String, String>) {
    let h = &r.hash;
    out.insert(format!("{h}/{RECORD}"), r.added.clone());
    out.insert(format!("{h}/name"), r.name.clone());
    let optional = [
        ("folder", r.folder.clone()),
        ("origin", r.origin.clone()),
        ("width", r.width.map(|w| w.to_string())),
        ("height", r.height.map(|h| h.to_string())),
        ("alt", Some(r.alt.clone()).filter(|a| !a.is_empty())),
        ("from", r.made_from.clone()),
        (
            MARK,
            r.notebook.map(|held| match held {
                Held::Also => "also".to_owned(),
                Held::Only => "only".to_owned(),
            }),
        ),
    ];
    for (part, value) in optional {
        if let Some(value) = value {
            out.insert(format!("{h}/{part}"), value);
        }
    }
    for b in &r.bookmarks {
        if speakable(&b.id)
            && let Ok(mark) = serde_json::to_string(&Mark { page: b.page, at: b.at, name: b.name.clone() })
        {
            out.insert(format!("{h}/mark/{}", b.id), mark);
        }
    }
}

impl Records<'_> {
    /// Has what was kept for the notes here told again when the records
    /// and their map next meet: of a record that stays though it was taken
    /// out elsewhere, all that was agreed on is forgotten, and of a mark
    /// that stays, the mark alone. Done when the store has met its map.
    pub fn tell_again(&self, kept: &Kept) -> Result<()> {
        let records = self.kept_for_notes.take();
        let marks = self.marks_kept_for_notes.take();
        if records.is_empty() && marks.is_empty() {
            return Ok(());
        }
        forget_agreed(kept, self.name(), |name| {
            name.split_once('/')
                .is_some_and(|(hash, part)| records.contains(hash) || (part == MARK && marks.contains(hash)))
        })
    }

    /// Whether anything was kept for the notes here that is to be told
    /// again (`tell_again`): the one who makes the rounds must then have
    /// the records meet their map once more, also where nothing else changes.
    pub fn keeps_for_notes(&self) -> bool {
        !self.kept_for_notes.borrow().is_empty() || !self.marks_kept_for_notes.borrow().is_empty()
    }
}

impl Store for Records<'_> {
    fn name(&self) -> &'static str {
        "files"
    }

    fn read(&self) -> Result<BTreeMap<String, String>> {
        let library = locked(self.library);
        let mut out = BTreeMap::new();
        for r in library.files.files().iter().filter(|r| attachments::is_hash(&r.hash)) {
            names_of_record(r, &mut out);
        }
        Ok(out)
    }

    fn speaks_of(&self, name: &str) -> bool {
        known(self.doc, self.name(), name, RECORD)
    }

    fn write(&self, changes: &BTreeMap<String, Option<String>>) -> Result<()> {
        let mut library = Writing::new(self.library, &self.written);
        let mut put = Vec::new();
        let mut gone = Vec::new();
        for (hash, parts) in by_thing(changes) {
            if !attachments::is_hash(hash) {
                continue;
            }
            let had = library.files.get(hash).cloned();
            if parts.iter().any(|(part, value)| *part == RECORD && value.is_none()) {
                if had.is_some() {
                    gone.push(hash.to_owned());
                }
                continue;
            }
            if had.is_none() && !parts.iter().any(|(part, value)| *part == RECORD && value.is_some()) {
                continue;
            }
            let mut record = had.unwrap_or_else(|| FileRecord { hash: hash.to_owned(), ..Default::default() });
            let mut marks: BTreeMap<String, Bookmark> =
                record.bookmarks.iter().map(|b| (b.id.clone(), b.clone())).collect();
            for (part, value) in &parts {
                let text = || value.map(str::to_owned);
                match *part {
                    RECORD => record.added = value.unwrap_or_default().to_owned(),
                    "name" => {
                        if let Some(name) = value.filter(|n| !n.trim().is_empty()) {
                            record.name = name.to_owned();
                        }
                    }
                    "folder" => record.folder = text().filter(|f| !f.is_empty()),
                    "origin" => record.origin = text().filter(|o| !o.is_empty()),
                    "width" => record.width = value.and_then(|w| w.parse().ok()),
                    "height" => record.height = value.and_then(|h| h.parse().ok()),
                    "alt" => record.alt = value.unwrap_or_default().to_owned(),
                    "from" => record.made_from = text().filter(|f| attachments::is_hash(f)),
                    MARK => {
                        let said = match *value {
                            Some("also") => Some(Held::Also),
                            Some("only") => Some(Held::Only),
                            _ => None,
                        };
                        if said.is_none() && record.notebook.is_some() && self.held.contains(hash) {
                            // Taken off elsewhere, by one that knows less of the notebook than
                            // this device: the notes here hold the file, and a mark stays. It
                            // is the mark of a file the library has too, never of one the
                            // notebook holds alone: with no mark in the home the library
                            // lists the file, and to tell again that the notebook holds it
                            // alone would take it out of the library's lists on every
                            // device, for the next sweep there to delete.
                            record.notebook = Some(Held::Also);
                            self.marks_kept_for_notes.borrow_mut().insert(hash.to_owned());
                        } else {
                            record.notebook = said;
                        }
                    }
                    part => {
                        let Some(id) = part.strip_prefix("mark/") else { continue };
                        match value.and_then(|v| serde_json::from_str::<Mark>(v).ok()) {
                            Some(m) => marks.insert(
                                id.to_owned(),
                                Bookmark { id: id.to_owned(), page: m.page, at: m.at, name: m.name },
                            ),
                            None => marks.remove(id),
                        };
                    }
                }
            }
            let mut bookmarks: Vec<Bookmark> = marks.into_values().collect();
            bookmarks.sort_by(|a, b| a.page.cmp(&b.page).then(a.at.total_cmp(&b.at)).then(a.id.cmp(&b.id)));
            record.bookmarks = bookmarks;
            put.push(record);
        }
        library.put_records(put)?;
        if !gone.is_empty() {
            // What the notes here hold is left to the notebook whatever its
            // mark says: it is given the mark first, as a note that comes to
            // hold a file gives it, since the mark may have been taken off
            // by the one that now takes the record out.
            let held_here: Vec<String> = gone.iter().filter(|hash| self.held.contains(*hash)).cloned().collect();
            if !held_here.is_empty() {
                library.notebook_hold(&held_here)?;
            }
            // The library's rule: a file the notebook holds leaves the
            // library's lists, and stays in the store for the notes.
            library.remove_files(&gone, false)?;
            for hash in gone {
                if library.files.get(&hash).is_some() && self.held.contains(&hash) {
                    self.kept_for_notes.borrow_mut().insert(hash);
                }
            }
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::library::draft_from_source;
    use crate::sync::mirror::{inward, outward};

    /// A computer: its library, its copy of the library's document, and what it keeps.
    struct Computer {
        library: Mutex<Library>,
        doc: HomeDoc,
        kept: Kept,
        _tmp: tempfile::TempDir,
    }

    impl Computer {
        fn new() -> Self {
            let tmp = tempfile::tempdir().unwrap();
            let library = Mutex::new(Library::open_at(&tmp.path().join("library")).unwrap());
            Computer { library, doc: HomeDoc::new(), kept: Kept::at(tmp.path().join("sync")), _tmp: tmp }
        }

        fn lib(&self) -> MutexGuard<'_, Library> {
            locked(&self.library)
        }

        /// A round of the library's stores, with `server` standing for the
        /// server's document: as the engine makes it.
        fn meet(&self, server: &HomeDoc) {
            self.meet_holding(server, &BTreeSet::new());
        }

        /// The same, where the notes here held the files `held` when the notebook was last saved.
        fn meet_holding(&self, server: &HomeDoc, held: &BTreeSet<String>) {
            let folders = FileFolders { library: &self.library, written: Cell::default() };
            let records = Records {
                library: &self.library,
                doc: &self.doc,
                held,
                kept_for_notes: RefCell::default(),
                marks_kept_for_notes: RefCell::default(),
                written: Cell::default(),
            };
            let references = References { library: &self.library, doc: &self.doc, written: Cell::default() };
            let collections = Collections { library: &self.library, doc: &self.doc, written: Cell::default() };
            let stores: [(&dyn Store, Option<Things>); 4] = [
                (&folders, None),
                (&records, Some(OF_RECORDS)),
                (&references, Some(OF_REFERENCES)),
                (&collections, Some(OF_COLLECTIONS)),
            ];
            self.doc.take_in(&server.whole()).unwrap();
            for (store, things) in stores {
                if let Some(things) = things {
                    take_back(&self.doc, &self.kept, store, things).unwrap();
                }
            }
            let outwards: Vec<_> = stores.iter().map(|(s, _)| outward(&self.doc, &self.kept, *s).unwrap().0).collect();
            server.take_in(&self.doc.whole()).unwrap();
            self.doc.take_in(&server.whole()).unwrap();
            let mut again = false;
            for (store, things) in stores {
                if let Some(things) = things {
                    again |= put_back(&self.doc, &self.kept, store, things).unwrap();
                }
            }
            if again {
                server.take_in(&self.doc.whole()).unwrap();
            }
            for ((store, _), out) in stores.iter().zip(outwards) {
                inward(&self.doc, &self.kept, *store, out).unwrap();
            }
            let keys = keys_made_here(&self.library, &self.doc);
            forget_agreed(&self.kept, "references", |name| keys.contains(name)).unwrap();
            records.tell_again(&self.kept).unwrap();
        }

        fn add(&self, source: &str) -> Entry {
            self.lib().add(&draft_from_source(source).unwrap()).unwrap()
        }

        fn field(&self, id: &str, field: &str) -> Option<String> {
            self.lib().get(id).and_then(|e| e.get(field).map(str::to_owned))
        }

        fn update(&self, id: &str, field: &str, value: &str) {
            let mut lib = self.lib();
            let mut draft = crate::library::Draft::from_entry(lib.get(id).unwrap());
            draft.fields.insert(field.into(), value.into());
            lib.update(id, &draft).unwrap();
        }
    }

    #[test]
    fn a_reference_follows_field_by_field() {
        let server = HomeDoc::new();
        let (a, b) = (Computer::new(), Computer::new());
        let nagy = a.add("@book{nagy1979, author={Nagy, Gregory}, title={The Best of the Achaens}, date={1979}}");
        a.meet(&server);
        b.meet(&server);
        let there = b.lib().get(&nagy.id).cloned().expect("the reference is on the other computer, under its id");
        assert_eq!(there, nagy, "as it is on the first, its times with it");

        // The title corrected on one, the year on the other, apart.
        a.update(&nagy.id, "title", "The Best of the Achaeans");
        b.update(&nagy.id, "date", "1999");
        a.meet(&server);
        b.meet(&server);
        a.meet(&server);
        for computer in [&a, &b] {
            assert_eq!(computer.field(&nagy.id, "title").as_deref(), Some("The Best of the Achaeans"));
            assert_eq!(computer.field(&nagy.id, "date").as_deref(), Some("1999"));
        }
        // The same field apart: one wins, the same on both.
        a.update(&nagy.id, "note", "from the desk");
        b.update(&nagy.id, "note", "from the laptop");
        a.meet(&server);
        b.meet(&server);
        a.meet(&server);
        assert_eq!(a.field(&nagy.id, "note"), b.field(&nagy.id, "note"));
        // Nothing more is written when nothing changed.
        let before = std::fs::read(a.lib().file()).unwrap();
        a.meet(&server);
        b.meet(&server);
        assert_eq!(std::fs::read(a.lib().file()).unwrap(), before);
    }

    #[test]
    fn a_reference_deleted_on_one_is_deleted_on_the_other_unless_it_was_changed_there() {
        let server = HomeDoc::new();
        let (a, b) = (Computer::new(), Computer::new());
        let gone = a.add("@book{gone, title={To go}}");
        let kept = a.add("@book{kept, title={To keep}}");
        a.meet(&server);
        b.meet(&server);
        a.lib().remove(std::slice::from_ref(&gone.id), false).unwrap();
        a.meet(&server);
        b.meet(&server);
        assert!(b.lib().get(&gone.id).is_none(), "deleted on the other");

        // Deleted on one while changed on the other, whichever meets the home first: kept, with the change.
        for deleter_first in [true, false] {
            let id = if deleter_first { kept.id.clone() } else { b.add("@book{second, title={Second}}").id };
            if !deleter_first {
                b.meet(&server);
                a.meet(&server);
            }
            a.lib().remove(std::slice::from_ref(&id), false).unwrap();
            b.update(&id, "title", "Changed meanwhile");
            if deleter_first {
                a.meet(&server);
                b.meet(&server);
            } else {
                b.meet(&server);
                a.meet(&server);
            }
            a.meet(&server);
            b.meet(&server);
            for computer in [&a, &b] {
                assert_eq!(computer.field(&id, "title").as_deref(), Some("Changed meanwhile"), "{deleter_first}");
                assert!(computer.lib().get(&id).unwrap().key.len() > 1);
            }
        }
    }

    #[test]
    fn at_the_first_meeting_both_libraries_are_kept_whole() {
        let server = HomeDoc::new();
        let (a, b) = (Computer::new(), Computer::new());
        let mine = a.add("@book{nagy1979, title={The Best of the Achaeans}}");
        let theirs = b.add("@book{nagy1979, title={The Best of the Achaeans}}");
        let other = b.add("@article{lord1960, title={The Singer of Tales}}");
        a.meet(&server);
        b.meet(&server);
        a.meet(&server);
        b.meet(&server);
        for computer in [&a, &b] {
            let lib = computer.lib();
            assert_eq!(lib.len(), 3, "the same work under two ids stays two");
            assert!(lib.get(&mine.id).is_some() && lib.get(&theirs.id).is_some() && lib.get(&other.id).is_some());
        }
        // Their keys were one, and are each its own, the same on both.
        let keys = |c: &Computer| {
            let lib = c.lib();
            [lib.get(&mine.id).unwrap().key.clone(), lib.get(&theirs.id).unwrap().key.clone()]
        };
        assert_eq!(keys(&a), keys(&b));
        assert_ne!(keys(&a)[0], keys(&a)[1]);
    }

    #[test]
    fn collections_follow_with_what_is_in_them() {
        let server = HomeDoc::new();
        let (a, b) = (Computer::new(), Computer::new());
        let one = a.add("@book{one, title={One}}");
        let two = a.add("@book{two, title={Two}}");
        let homer = a.lib().collection_create("Homer", None).unwrap();
        a.lib().collection_add(&homer.id, std::slice::from_ref(&one.id)).unwrap();
        a.meet(&server);
        b.meet(&server);
        assert_eq!(b.lib().collections.get(&homer.id).unwrap().entries, vec![one.id.clone()]);
        // Each adds to it apart, and one renames it.
        a.lib().collection_add(&homer.id, std::slice::from_ref(&two.id)).unwrap();
        let three = b.add("@book{three, title={Three}}");
        b.lib().collection_add(&homer.id, std::slice::from_ref(&three.id)).unwrap();
        b.lib().collection_rename(&homer.id, "Homeric").unwrap();
        a.meet(&server);
        b.meet(&server);
        a.meet(&server);
        for computer in [&a, &b] {
            let lib = computer.lib();
            let c = lib.collections.get(&homer.id).unwrap();
            assert_eq!(c.name, "Homeric");
            assert_eq!(c.entries.len(), 3, "both additions are kept: {:?}", c.entries);
        }
        a.lib().collection_delete(&homer.id).unwrap();
        a.meet(&server);
        b.meet(&server);
        assert!(b.lib().collections.list.is_empty());
    }

    #[test]
    fn the_record_of_a_file_follows_and_where_it_lies_stays() {
        let server = HomeDoc::new();
        let (a, b) = (Computer::new(), Computer::new());
        let source = a._tmp.path().join("scan.pdf");
        std::fs::write(&source, b"%PDF the scan").unwrap();
        let work = a.add("@book{w, title={A Work}}");
        a.lib().attach(&work.id, &source).unwrap();
        let hash = attachments::hash_bytes(b"%PDF the scan");
        let shelf = a.lib().files.folder_create("Shelf", None).unwrap();
        a.lib().move_files(std::slice::from_ref(&hash), Some(&shelf.id)).unwrap();
        a.meet(&server);
        b.meet(&server);
        let record = b.lib().files.get(&hash).cloned().expect("the record is on the other computer");
        assert_eq!(record.folder.as_deref(), Some(shelf.id.as_str()));
        assert_eq!(record.name, a.lib().files.get(&hash).unwrap().name);
        assert_eq!(
            b.lib().get(&work.id).unwrap().attachments(),
            vec![record.path.clone()],
            "named by where it will lie here"
        );

        // Renamed on one and bookmarked on the other, apart.
        a.lib().files.rename(&hash, "Renamed.pdf").unwrap();
        a.lib().save_files().unwrap();
        let mark = Bookmark { id: "m1".into(), page: 3, at: 0.25, name: "Here".into() };
        b.lib().set_bookmarks(&hash, vec![mark.clone()]).unwrap();
        a.meet(&server);
        b.meet(&server);
        a.meet(&server);
        for computer in [&a, &b] {
            let lib = computer.lib();
            let r = lib.files.get(&hash).unwrap();
            assert_eq!((r.name.as_str(), r.bookmarks.clone()), ("Renamed.pdf", vec![mark.clone()]));
        }
        // Removed on one: from the other's record, its reference and its disk.
        a.lib().remove_file(&hash).unwrap();
        a.meet(&server);
        b.meet(&server);
        assert!(b.lib().files.get(&hash).is_none());
        assert!(b.lib().get(&work.id).unwrap().attachments().is_empty());
    }

    #[test]
    fn a_file_the_notes_here_hold_is_not_taken_from_the_others_by_a_computer_that_swept_it_out() {
        let server = HomeDoc::new();
        let (a, b) = (Computer::new(), Computer::new());
        let hash = a.lib().notebook_take_image("pasted", &crate::library::figures::fixtures::PNG).unwrap().hash;
        let held: BTreeSet<String> = [hash.clone()].into();
        a.meet_holding(&server, &held);
        b.meet(&server);
        assert_eq!(b.lib().files.get(&hash).unwrap().notebook, Some(Held::Only));
        // The other computer reads its notebook with less of it than there is, and sweeps the file out.
        assert_eq!(b.lib().notebook_sweep(&std::collections::HashSet::new()).unwrap(), 1);
        b.meet(&server);
        // The first, whose notes hold it, keeps it, held by them alone, and tells it again.
        a.meet_holding(&server, &held);
        assert_eq!(a.lib().files.get(&hash).unwrap().notebook, Some(Held::Only));
        a.meet_holding(&server, &held);
        b.meet(&server);
        assert_eq!(b.lib().files.get(&hash).map(|r| r.notebook), Some(Some(Held::Only)), "it is on the other again");
        // Where the notes of the first hold it no more either, it goes from both.
        assert_eq!(a.lib().notebook_sweep(&std::collections::HashSet::new()).unwrap(), 1);
        a.meet(&server);
        b.meet(&server);
        assert!(b.lib().files.get(&hash).is_some(), "the other keeps it until its own notes are read");
        assert_eq!(b.lib().notebook_sweep(&std::collections::HashSet::new()).unwrap(), 1);
        b.meet(&server);
        a.meet(&server);
        assert!(a.lib().files.get(&hash).is_none() && b.lib().files.get(&hash).is_none());
    }

    /// A file the library of `a` has, of a reference, which a note there
    /// has come to hold, and both have met the home: the reference's id,
    /// the file's hash, and what the notes of `a` hold.
    fn a_file_of_the_library_that_a_note_holds(
        server: &HomeDoc,
        a: &Computer,
        b: &Computer,
    ) -> (String, String, BTreeSet<String>) {
        let source = a._tmp.path().join("scan.pdf");
        std::fs::write(&source, b"%PDF the scan").unwrap();
        let work = a.add("@book{w, title={A Work}}");
        a.lib().attach(&work.id, &source).unwrap();
        let hash = attachments::hash_bytes(b"%PDF the scan");
        a.lib().notebook_hold(std::slice::from_ref(&hash)).unwrap();
        let held: BTreeSet<String> = [hash.clone()].into();
        a.meet_holding(server, &held);
        b.meet(server);
        assert_eq!(b.lib().files.get(&hash).unwrap().notebook, Some(Held::Also));
        (work.id, hash, held)
    }

    #[test]
    fn the_mark_of_a_file_the_notes_here_hold_is_not_taken_off_by_a_device_that_swept_with_less_of_the_notebook() {
        let server = HomeDoc::new();
        let (a, b) = (Computer::new(), Computer::new());
        let (_, hash, held) = a_file_of_the_library_that_a_note_holds(&server, &a, &b);
        let mark = |c: &Computer| c.lib().files.get(&hash).expect("the record").notebook;
        // The second reads its notebook with less of it than there is, and sweeps: the mark goes there.
        assert_eq!(b.lib().notebook_sweep(&std::collections::HashSet::new()).unwrap(), 0);
        assert_eq!(mark(&b), None);
        b.meet(&server);
        assert_eq!(server.get("files", &format!("{hash}/{MARK}")), None, "the home is told that the mark went");
        // On the first, whose notes hold the file, the mark is as it was.
        a.meet_holding(&server, &held);
        assert_eq!(mark(&a), Some(Held::Also));
        // And it is told again: after they have met twice the second has it.
        a.meet_holding(&server, &held);
        b.meet(&server);
        assert_eq!(mark(&b), Some(Held::Also), "it is on the other again");
        assert_eq!(mark(&a), Some(Held::Also));

        // Where the notes of the first hold the file no more, the mark goes as it is said.
        assert_eq!(b.lib().notebook_sweep(&std::collections::HashSet::new()).unwrap(), 0);
        b.meet(&server);
        a.meet(&server);
        assert_eq!(mark(&a), None, "the library's alone again");
        assert!(a.lib().stored_path(&hash).is_some(), "and the library has its file");
    }

    #[test]
    fn a_mark_kept_for_the_notes_is_of_a_file_the_library_has_too_never_of_one_the_notebook_holds_alone() {
        let server = HomeDoc::new();
        let (a, b) = (Computer::new(), Computer::new());
        // A picture pasted into a note: the notebook holds it alone, on both.
        let hash = a.lib().notebook_take_image("pasted", &crate::library::figures::fixtures::PNG).unwrap().hash;
        let held: BTreeSet<String> = [hash.clone()].into();
        a.meet_holding(&server, &held);
        b.meet(&server);
        let mark = |c: &Computer| c.lib().files.get(&hash).expect("the record").notebook;
        assert_eq!((mark(&a), mark(&b)), (Some(Held::Only), Some(Held::Only)));
        // On the second the picture is put among the library's files, as
        // when its note goes into a document; then the note is deleted
        // there, and the sweep leaves the picture to the library alone.
        b.lib().to_library(&hash, None).unwrap();
        assert_eq!(mark(&b), Some(Held::Also));
        assert_eq!(b.lib().notebook_sweep(&std::collections::HashSet::new()).unwrap(), 0);
        assert_eq!(mark(&b), None);
        b.meet(&server);
        // The first was not running meanwhile: what its notes hold was last said when they held the picture.
        a.meet_holding(&server, &held);
        assert_eq!(mark(&a), Some(Held::Also), "held beside the library, which lists it now");
        assert!(a.lib().files.get(&hash).unwrap().listed());
        a.meet_holding(&server, &held);
        assert_eq!(server.get("files", &format!("{hash}/{MARK}")).as_deref(), Some("also"), "that is what is told");
        b.meet(&server);
        assert_eq!(mark(&b), Some(Held::Also));
        assert!(b.lib().files.get(&hash).unwrap().listed(), "the library of the second lists it still");
        // The second sweeps again, its notes holding nothing: the picture is the library's, and stays.
        assert_eq!(b.lib().notebook_sweep(&std::collections::HashSet::new()).unwrap(), 0, "nothing leaves the store");
        assert!(b.lib().files.get(&hash).is_some());
    }

    #[test]
    fn a_file_the_notes_here_hold_stays_when_its_record_goes_elsewhere_whatever_its_mark_says() {
        let server = HomeDoc::new();
        let (a, b) = (Computer::new(), Computer::new());
        let (work, hash, held) = a_file_of_the_library_that_a_note_holds(&server, &a, &b);
        // The mark is taken off the first one's record by hand, as a sweep
        // elsewhere could take it before a mark was kept for the notes.
        let mut record = a.lib().files.get(&hash).cloned().unwrap();
        record.notebook = None;
        a.lib().put_records(vec![record]).unwrap();
        a.meet_holding(&server, &held);
        b.meet(&server);
        assert_eq!(b.lib().files.get(&hash).unwrap().notebook, None);
        // The second removes the file from its library: with no mark, it is deleted there.
        b.lib().remove_file(&hash).unwrap();
        assert!(b.lib().files.get(&hash).is_none());
        b.meet(&server);
        assert_eq!(server.get("files", &format!("{hash}/{RECORD}")), None, "the home is told that the record went");

        // The first, whose notes hold the file, keeps it on its disk, held by the notes alone.
        a.meet_holding(&server, &held);
        {
            let lib = a.lib();
            assert_eq!(lib.files.get(&hash).expect("the record stays").notebook, Some(Held::Only));
            let path = lib.stored_path(&hash).expect("the file is on the disk");
            assert_eq!(std::fs::read(path).unwrap(), b"%PDF the scan");
            assert!(lib.get(&work).unwrap().attachments().is_empty(), "it left the library's lists and its reference");
        }
        // And it is told again: after they have met twice the second has its record.
        a.meet_holding(&server, &held);
        b.meet(&server);
        assert_eq!(b.lib().files.get(&hash).map(|r| r.notebook), Some(Some(Held::Only)));
        assert!(a.lib().stored_path(&hash).is_some());
    }

    #[test]
    fn what_was_amiss_in_a_store_is_not_sent_and_a_lost_record_is_mended_from_the_home() {
        let server = HomeDoc::new();
        let (a, b) = (Computer::new(), Computer::new());
        let shelf = a.lib().files.folder_create("Shelf", None).unwrap();
        a.lib().save_files().unwrap();
        a.meet(&server);
        b.meet(&server);
        assert_eq!(b.lib().files.folders().len(), 1);
        // The record of the files is lost on the other computer: it is set aside, and the library opens without it.
        let dir = b.lib().dir().to_owned();
        std::fs::write(dir.join(crate::library::files::FILE), b"{ not json").unwrap();
        *b.lib() = Library::open_at(&dir).unwrap();
        assert!(b.lib().files.folders().is_empty());
        let damaged = b.lib().take_damaged();
        assert!(damaged.files);
        b.kept.forget_base("file-folders").unwrap();
        b.kept.forget_base("files").unwrap();
        b.meet(&server);
        a.meet(&server);
        assert_eq!(a.lib().files.folders().len(), 1, "not taken from the others");
        assert_eq!(b.lib().files.folders()[0].id, shelf.id, "and mended from the home");
    }
}
