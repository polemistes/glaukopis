//! The reference library: one BibLaTeX file for all projects.

pub mod attachments;
pub mod collections;
pub mod entry;
pub mod export;
pub mod files;
pub mod keys;
pub mod schema;

use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

use serde::Serialize;

use crate::bib::{self, RawEntry};
use crate::error::{Error, IoContext, Result};
use crate::fsutil::write_atomic_with_backup;
use crate::paths::DataDir;
use crate::tr;

pub use attachments::StoredFile;
pub use collections::{Collection, Collections};
pub use entry::{Draft, Entry, EntryView, Summary};
pub use files::{FileFolder, FileKind, FileRecord, Files};

const HEADER: &str = "\
% The reference library of Glaukopis. BibLaTeX, UTF-8.
%
% This file is written by Glaukopis. It may be read by any BibLaTeX tool.
% Changes made to it by hand are taken up when Glaukopis next looks at it.
% The fields beginning with glaukopis- identify each entry to the application.

";

/// Over what could not be read, which is written back as it was found.
const UNREAD: &str = "\
% What follows could not be read by Glaukopis. It is kept as it was written,
% to be put right by hand; until then it is not in the library.

";

/// The time now, as written in the library: `2026-09-27T14:03:22Z`.
pub fn now() -> String {
    let t = time::OffsetDateTime::now_utc().replace_nanosecond(0).unwrap_or_else(|_| time::OffsetDateTime::now_utc());
    t.format(&time::format_description::well_known::Rfc3339).unwrap_or_default()
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Stamp {
    modified: Option<SystemTime>,
    len: u64,
}

fn stamp_of(path: &Path) -> Option<Stamp> {
    let meta = fs::metadata(path).ok()?;
    Some(Stamp { modified: meta.modified().ok(), len: meta.len() })
}

/// The library. A clone is a copy of it as it is, to be read while the
/// library itself goes on being changed: a document is made from one.
#[derive(Debug, Clone)]
pub struct Library {
    dir: PathBuf,
    file: PathBuf,
    collections_file: PathBuf,
    files_file: PathBuf,
    entries: Vec<Entry>,
    by_id: HashMap<String, usize>,
    /// Ids of entries merged away, pointing to the entry that absorbed them.
    aliases: HashMap<String, String>,
    pub collections: Collections,
    /// What is known of the files of the store, and their folders (`files.rs`).
    pub files: Files,
    /// Whether the record of the files was changed and is not written yet:
    /// it is written with the library, or by `save_files`.
    files_dirty: bool,
    stamp: Option<Stamp>,
    /// What was found amiss when the file was last read.
    pub warnings: Vec<String>,
    /// What stands in the file besides the entries, to be written back as it is.
    kept: Vec<bib::Verbatim>,
    /// Whether the file was read again, from a change made outside, since the
    /// interface last took the whole library: a change of one entry, which
    /// reads it first, does not tell the interface of the others.
    reread: bool,
    /// What duplicates are found by: made when it is first asked for after a change.
    index: std::cell::OnceCell<crate::duplicates::Index>,
    /// The entries by their keys, in lower case, and whether the key is theirs
    /// now or one they had before (kept in `ids`): made when first asked for
    /// after a change, and kept up to date as entries are added.
    keys: std::cell::OnceCell<HashMap<String, (usize, bool)>>,
}

impl Library {
    pub fn open(data: &DataDir) -> Result<Self> {
        Self::open_at(&data.library())
    }

    pub fn open_at(dir: &Path) -> Result<Self> {
        fs::create_dir_all(dir.join(attachments::DIR)).context(|| tr!("io-creating", path = dir))?;
        let mut library = Library {
            dir: dir.to_owned(),
            file: dir.join("library.bib"),
            collections_file: dir.join("collections.json"),
            files_file: dir.join(files::FILE),
            entries: Vec::new(),
            by_id: HashMap::new(),
            aliases: HashMap::new(),
            collections: Collections::default(),
            files: Files::default(),
            files_dirty: false,
            stamp: None,
            warnings: Vec::new(),
            kept: Vec::new(),
            reread: false,
            index: std::cell::OnceCell::new(),
            keys: std::cell::OnceCell::new(),
        };
        library.load()?;
        Ok(library)
    }

    pub fn dir(&self) -> &Path {
        &self.dir
    }

    pub fn file(&self) -> &Path {
        &self.file
    }

    fn load(&mut self) -> Result<()> {
        self.entries.clear();
        self.warnings.clear();
        let mut needs_saving = false;

        let text = match fs::read(&self.file) {
            Ok(bytes) => String::from_utf8_lossy(&bytes).into_owned(),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => String::new(),
            Err(e) => return Err(e).context(|| tr!("io-reading", path = &self.file)),
        };
        self.stamp = stamp_of(&self.file);

        let mut parsed = bib::parse(&text);
        for w in &parsed.warnings {
            self.warnings.push(tr!("core-library-line", line = w.line, message = &w.message));
        }
        self.kept = std::mem::take(&mut parsed.verbatim);

        let mut ids = HashSet::new();
        let mut keys = HashSet::new();
        for raw in parsed.entries() {
            let mut entry = stored_entry(raw);
            if entry.id.is_empty() || !ids.insert(entry.id.clone()) {
                // Added by hand, or copied by hand with its id.
                entry.id = uuid::Uuid::new_v4().to_string();
                ids.insert(entry.id.clone());
                needs_saving = true;
            }
            if entry.added.is_empty() {
                entry.added = now();
                needs_saving = true;
            }
            if entry.modified.is_empty() {
                entry.modified = entry.added.clone();
            }
            let wanted = keys::sanitise_key(&entry.key).unwrap_or_else(|| keys::base_key(&entry));
            let key = keys::unique_key(&wanted, &keys);
            if key != entry.key {
                self.warnings.push(tr!("core-library-key-changed", from = &entry.key, to = &key));
                entry.key = key;
                needs_saving = true;
            }
            keys.insert(entry.key.clone());
            self.entries.push(entry);
        }
        self.reindex();
        self.collections = Collections::load(&self.collections_file)?;
        self.load_files();

        if needs_saving {
            self.save()?;
        }
        self.save_files_if_changed()?;
        Ok(())
    }

    /// Reads the record of the files, and enters what the store has that it
    /// lacks. A record that cannot be read is put aside under another name,
    /// not written over, and said to be.
    fn load_files(&mut self) {
        self.files = match Files::load(&self.files_file) {
            Ok(files) => files,
            Err(e) => {
                let aside =
                    self.files_file.with_extension(format!("unreadable-{}.json", uuid::Uuid::new_v4().simple()));
                let _ = fs::rename(&self.files_file, &aside);
                self.warnings.push(tr!("core-library-files-unreadable", path = &aside, message = e.to_string()));
                Files::default()
            }
        };
        if self.files.reconcile(&self.dir) {
            self.files_dirty = true;
        }
    }

    fn reindex(&mut self) {
        self.index = std::cell::OnceCell::new();
        self.keys = std::cell::OnceCell::new();
        self.by_id.clear();
        self.aliases.clear();
        for (i, e) in self.entries.iter().enumerate() {
            self.by_id.insert(e.id.clone(), i);
        }
        for e in &self.entries {
            for old in &e.merged {
                if !self.by_id.contains_key(old) {
                    self.aliases.insert(old.clone(), e.id.clone());
                }
            }
        }
    }

    /// Reads the file again if it was changed from outside. Returns whether it was.
    pub fn refresh(&mut self) -> Result<bool> {
        if stamp_of(&self.file) == self.stamp {
            return Ok(false);
        }
        tracing::info!("the library file changed on disk; reading it again");
        self.load()?;
        self.reread = true;
        Ok(true)
    }

    /// Whether the file was read again since this was last asked; asking forgets it.
    pub fn take_reread(&mut self) -> bool {
        std::mem::take(&mut self.reread)
    }

    /// The index by which the duplicates of an entry are found, kept until the library changes.
    pub fn duplicates_index(&self) -> &crate::duplicates::Index {
        self.index.get_or_init(|| crate::duplicates::Index::new(&self.entries))
    }

    pub(crate) fn save(&mut self) -> Result<()> {
        // Whatever was changed is written: what was found by is made again when it is asked for.
        self.index = std::cell::OnceCell::new();
        self.keys = std::cell::OnceCell::new();
        let mut out = String::with_capacity(self.entries.len() * 400 + HEADER.len());
        out.push_str(HEADER);
        for v in self.kept.iter().filter(|v| v.readable) {
            out.push_str(v.text.trim_end());
            out.push_str("\n\n");
        }
        for e in &self.entries {
            out.push_str(&e.to_bib(true, true));
            out.push('\n');
        }
        let mut unread = self.kept.iter().filter(|v| !v.readable).peekable();
        if unread.peek().is_some() {
            out.push_str(UNREAD);
            for v in unread {
                out.push_str(&v.text);
                out.push_str("\n\n");
            }
        }
        write_atomic_with_backup(&self.file, out.as_bytes())?;
        self.stamp = stamp_of(&self.file);
        self.save_files_if_changed()
    }

    pub(crate) fn save_collections(&self) -> Result<()> {
        self.collections.save(&self.collections_file)
    }

    /// Writes the record of the files.
    pub fn save_files(&mut self) -> Result<()> {
        self.files.save(&self.files_file)?;
        self.files_dirty = false;
        Ok(())
    }

    fn save_files_if_changed(&mut self) -> Result<()> {
        if self.files_dirty { self.save_files() } else { Ok(()) }
    }

    // ---- reading ----

    pub fn len(&self) -> usize {
        self.entries.len()
    }

    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }

    pub fn entries(&self) -> &[Entry] {
        &self.entries
    }

    pub fn get(&self, id: &str) -> Option<&Entry> {
        self.by_id.get(id).map(|&i| &self.entries[i])
    }

    /// As `get`, following the trail of an entry that was merged into another.
    pub fn resolve(&self, id: &str) -> Option<&Entry> {
        self.get(id).or_else(|| self.aliases.get(id).and_then(|real| self.get(real)))
    }

    pub fn require(&self, id: &str) -> Result<&Entry> {
        self.get(id).ok_or_else(|| Error::not_found(tr!("core-library-the-reference")))
    }

    /// The entry with a key, or that had it before: earlier keys are remembered in `ids`.
    pub fn by_key(&self, key: &str) -> Option<&Entry> {
        self.keys().get(&key.to_lowercase()).map(|&(i, _)| &self.entries[i])
    }

    fn keys(&self) -> &HashMap<String, (usize, bool)> {
        self.keys.get_or_init(|| {
            let mut keys = HashMap::with_capacity(self.entries.len());
            for (i, e) in self.entries.iter().enumerate() {
                keys.entry(e.key.to_lowercase()).or_insert((i, true));
            }
            // A key an entry has now is found before one another had before.
            for (i, e) in self.entries.iter().enumerate() {
                for earlier in e.get("ids").into_iter().flat_map(|ids| ids.split(',')) {
                    keys.entry(earlier.trim().to_lowercase()).or_insert((i, false));
                }
            }
            keys
        })
    }

    /// Whether a key is that of an entry now, other than the one given.
    fn key_taken(&self, key: &str, except: Option<&str>) -> bool {
        self.keys().get(&key.to_lowercase()).is_some_and(|&(i, now)| now && Some(self.entries[i].id.as_str()) != except)
    }

    pub fn summaries(&self) -> Vec<Summary> {
        self.entries.iter().map(Entry::summary).collect()
    }

    // ---- changing ----

    /// The key for a draft: the one it asks for, if it is free; otherwise one is made.
    /// `strict` refuses a key that is taken instead of making another.
    fn key_for(&self, draft: &Draft, except: Option<&str>, strict: bool) -> Result<String> {
        let taken = |key: &str| self.key_taken(key, except);
        let asked = draft.key.trim();
        if asked.is_empty() {
            return Ok(keys::unique_key_where(&keys::base_key(&draft.to_entry()), taken));
        }
        let Some(clean) = keys::sanitise_key(asked) else {
            return Err(key_error(tr!("core-library-bad-key", key = asked)));
        };
        if strict {
            if clean != asked {
                return Err(key_error(tr!("core-library-key-letters", key = &clean)));
            }
            if taken(&clean) {
                return Err(key_error(tr!("core-library-key-taken", key = &clean)));
            }
            return Ok(clean);
        }
        Ok(keys::unique_key_where(&clean, taken))
    }

    /// The key a draft would be given, as the form suggests it: the entry
    /// `except` is the one being changed, whose own key is free for it.
    pub fn suggest_key(&self, draft: &Draft, except: Option<&str>) -> String {
        let mut asked = draft.clone();
        asked.key.clear();
        self.key_for(&asked, except, false).unwrap_or_default()
    }

    fn check_type(entry_type: &str) -> Result<String> {
        let t = entry_type.trim().to_ascii_lowercase();
        if t.is_empty() || !t.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-') {
            return Err(Error::invalid(tr!("core-library-no-type")));
        }
        if matches!(t.as_str(), "comment" | "string" | "preamble") {
            return Err(Error::invalid(tr!("core-library-not-a-type", kind = &t)));
        }
        Ok(t)
    }

    /// Adds an entry from the form. A key given by the user must be free.
    pub fn add(&mut self, draft: &Draft) -> Result<Entry> {
        self.refresh()?;
        let entry = self.insert(draft, true)?;
        self.save()?;
        Ok(entry)
    }

    /// Adds entries from an import. Keys that are taken are replaced.
    pub fn add_many(&mut self, drafts: &[Draft]) -> Result<Vec<Entry>> {
        self.refresh()?;
        let mut out = Vec::with_capacity(drafts.len());
        for d in drafts {
            out.push(self.insert(d, false)?);
        }
        if !out.is_empty() {
            self.save()?;
        }
        Ok(out)
    }

    pub(crate) fn insert(&mut self, draft: &Draft, strict: bool) -> Result<Entry> {
        let entry_type = Self::check_type(&draft.entry_type)?;
        let key = self.key_for(draft, None, strict)?;
        let stamp = now();
        let entry = Entry {
            id: uuid::Uuid::new_v4().to_string(),
            key,
            entry_type,
            fields: draft.stored_fields(),
            added: stamp.clone(),
            modified: stamp,
            merged: Vec::new(),
            zotero: draft.zotero(),
        };
        self.by_id.insert(entry.id.clone(), self.entries.len());
        if let Some(keys) = self.keys.get_mut() {
            keys.insert(entry.key.to_lowercase(), (self.entries.len(), true));
        }
        self.index = std::cell::OnceCell::new();
        self.entries.push(entry.clone());
        Ok(entry)
    }

    /// As `insert`, under an id that is given: a work that came with a
    /// project, whose citations name it by that id (ADR 0036). Where an
    /// entry has the id, or it is no id the library could keep, the new
    /// entry is given an id of its own; the caller sees which it has.
    pub(crate) fn insert_with_id(&mut self, id: &str, draft: &Draft) -> Result<Entry> {
        let keepable = !id.is_empty()
            && id.len() <= 64
            && id.chars().all(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.' | ':'));
        let free = keepable && !self.by_id.contains_key(id);
        let mut entry = self.insert(draft, false)?;
        if free && let Some(at) = self.by_id.remove(&entry.id) {
            entry.id = id.to_owned();
            self.entries[at].id = entry.id.clone();
            self.by_id.insert(entry.id.clone(), at);
            // An entry merged away under this id no longer stands for it.
            self.aliases.remove(id);
        }
        Ok(entry)
    }

    /// Replaces an entry's content by the draft. Attachments are not touched.
    pub fn update(&mut self, id: &str, draft: &Draft) -> Result<Entry> {
        self.refresh()?;
        let entry = self.apply(id, draft)?;
        self.save()?;
        Ok(entry)
    }

    /// Gives an entry the keys of what it is in Zotero that it lacks; nothing
    /// else of it changes. Returns whether anything was added.
    pub fn add_zotero_keys(&mut self, id: &str, keys: &[String]) -> Result<bool> {
        self.refresh()?;
        let index = *self.by_id.get(id).ok_or_else(|| Error::not_found(tr!("core-library-the-reference")))?;
        let entry = &mut self.entries[index];
        let mut added = false;
        for key in keys.iter().flat_map(|k| entry::zotero_keys(k)) {
            if !entry.zotero.contains(&key) {
                entry.zotero.push(key);
                added = true;
            }
        }
        if added {
            entry.modified = now();
            self.save()?;
        }
        Ok(added)
    }

    /// What the user has written about a work: their reflections and
    /// comments, which are not part of what is cited. Kept in the field
    /// `annotation`, which is what BibLaTeX has for it. Nothing, or only
    /// blanks, takes the note away.
    pub fn set_note(&mut self, id: &str, text: &str) -> Result<Entry> {
        self.refresh()?;
        let mut draft = Draft::from_entry(self.require(id)?);
        let text = tidy_note(text);
        if text.is_empty() {
            draft.fields.remove("annotation");
        } else {
            draft.fields.insert("annotation".into(), text);
        }
        let entry = self.apply(id, &draft)?;
        self.save()?;
        Ok(entry)
    }

    pub(crate) fn apply(&mut self, id: &str, draft: &Draft) -> Result<Entry> {
        let index = *self.by_id.get(id).ok_or_else(|| Error::not_found(tr!("core-library-the-reference")))?;
        let entry_type = Self::check_type(&draft.entry_type)?;
        let key = self.key_for(draft, Some(id), true)?;
        let files = self.entries[index].get("file").map(str::to_owned);

        let entry = &mut self.entries[index];
        let old_key = std::mem::replace(&mut entry.key, key);
        entry.entry_type = entry_type;
        entry.fields = draft.stored_fields();
        entry.fields.retain(|(n, _)| n != "file");
        if let Some(files) = files {
            entry.fields.push(("file".into(), files));
        }
        if old_key != entry.key {
            remember_key(entry, &old_key);
        }
        // What the entry is in Zotero is not taken away by a draft that does
        // not say it, as that of the form does not: it is only added to.
        for key in draft.zotero() {
            if !entry.zotero.contains(&key) {
                entry.zotero.push(key);
            }
        }
        entry.modified = now();
        Ok(entry.clone())
    }

    /// The entry as BibLaTeX source, for editing by hand.
    pub fn source(&self, id: &str) -> Result<String> {
        Ok(self.require(id)?.to_bib(false, false))
    }

    /// Replaces an entry by what the source says. The source must hold one entry.
    pub fn update_from_source(&mut self, id: &str, source: &str) -> Result<Entry> {
        let draft = draft_from_source(source)?;
        self.update(id, &draft)
    }

    /// Removes entries. Their files stay in the store, belonging to no entry,
    /// unless `with_files` is asked for: then those that no other entry has
    /// are removed from the store with them.
    pub fn remove(&mut self, ids: &[String], with_files: bool) -> Result<usize> {
        self.refresh()?;
        let doomed: HashSet<&String> = ids.iter().filter(|id| self.by_id.contains_key(*id)).collect();
        if doomed.is_empty() {
            return Ok(0);
        }
        let mut files: Vec<String> = Vec::new();
        for e in &self.entries {
            if doomed.contains(&e.id) {
                files.extend(e.attachments());
            }
        }
        let count = doomed.len();
        let doomed: HashSet<String> = doomed.into_iter().cloned().collect();
        self.entries.retain(|e| !doomed.contains(&e.id));
        self.reindex();
        self.save()?;

        let gone: Vec<String> = doomed.into_iter().collect();
        if self.collections.forget_entries(&gone) {
            self.save_collections()?;
        }
        if with_files {
            for f in files {
                let used = self.entries.iter().any(|e| e.attachments().contains(&f));
                if let (false, Some(hash)) = (used, attachments::hash_of_path(&f)) {
                    let hash = hash.to_owned();
                    if let Err(e) = self.remove_file(&hash) {
                        tracing::warn!(%e, f, "could not remove a stored file");
                    }
                }
            }
        }
        Ok(count)
    }

    /// Merges `absorbed` into `kept`, whose content becomes `draft`. Whatever
    /// pointed to the absorbed entry will find the kept one.
    pub fn merge(&mut self, kept: &str, absorbed: &str, draft: &Draft) -> Result<Entry> {
        self.refresh()?;
        if kept == absorbed {
            return Err(Error::invalid(tr!("core-library-merge-itself")));
        }
        let gone = self.require(absorbed)?.clone();
        self.require(kept)?;

        // Remove first, so that the absorbed entry's key is free to be taken.
        self.entries.retain(|e| e.id != absorbed);
        self.reindex();
        self.apply(kept, draft)?;

        let index = self.by_id[kept];
        let entry = &mut self.entries[index];
        let mut files = entry.attachments();
        for f in gone.attachments() {
            if !files.contains(&f) {
                files.push(f);
            }
        }
        entry.set_attachments(&files);
        if gone.key != entry.key {
            remember_key(entry, &gone.key);
        }
        if let Some(ids) = gone.get("ids") {
            for k in ids.split(',') {
                remember_key(entry, k.trim());
            }
        }
        entry.merged.push(gone.id.clone());
        entry.merged.extend(gone.merged.iter().cloned());
        entry.merged.sort();
        entry.merged.dedup();
        // A citation that Zotero made of either finds the one that is kept.
        for key in &gone.zotero {
            if !entry.zotero.contains(key) {
                entry.zotero.push(key.clone());
            }
        }
        if gone.added < entry.added && !gone.added.is_empty() {
            entry.added = gone.added.clone();
        }
        let result = entry.clone();
        self.reindex();
        self.save()?;
        if self.collections.replace_entry(absorbed, kept) {
            self.save_collections()?;
        }
        Ok(result)
    }

    // ---- attachments ----

    pub fn attachments_of(&self, id: &str) -> Result<Vec<StoredFile>> {
        Ok(self.require(id)?.attachments().iter().map(|p| self.describe_file(p)).collect())
    }

    /// A stored file as the lists show it: by the name the record gives it.
    pub fn describe_file(&self, stored: &str) -> StoredFile {
        let mut file = attachments::describe(&self.dir, stored);
        if let Some(record) = self.files.get(&file.hash) {
            file.name = record.name.clone();
        }
        file
    }

    pub fn attachment_path(&self, relative: &str) -> Result<PathBuf> {
        attachments::absolute(&self.dir, relative)
    }

    /// A name for a file of this entry: `Nagy 1979 - The Best of the Achaeans`.
    pub fn file_name_for(entry: &Entry) -> String {
        let s = entry.summary();
        let mut name = String::new();
        let authors = bib::names::short_list(&entry.creators());
        if !authors.is_empty() {
            name.push_str(&authors);
        }
        if !s.year.is_empty() {
            if !name.is_empty() {
                name.push(' ');
            }
            name.push_str(&s.year);
        }
        let title: String = entry.get("title").map(bib::latex::plain).unwrap_or_default().chars().take(80).collect();
        if !title.is_empty() {
            if !name.is_empty() {
                name.push_str(" - ");
            }
            name.push_str(title.trim());
        }
        name
    }

    /// Copies a file into the store and links it to the entry.
    pub fn attach(&mut self, id: &str, source: &Path) -> Result<Entry> {
        self.refresh()?;
        let index = *self.by_id.get(id).ok_or_else(|| Error::not_found(tr!("core-library-the-reference")))?;
        let name = Self::file_name_for(&self.entries[index]);
        let stored = attachments::store_file(&self.dir, source, &name)?;
        self.link_file(index, stored, Some(&source.display().to_string()))
    }

    /// The name a file of an entry is given in the store, and where the store
    /// is: that a file may be copied there without the library being held,
    /// and linked with `attach_stored` after.
    pub fn file_name_of(&self, id: &str) -> Result<(String, PathBuf)> {
        let entry = self.resolve(id).ok_or_else(|| Error::not_found(tr!("core-library-the-reference")))?;
        Ok((Self::file_name_for(entry), self.dir.clone()))
    }

    /// Links a file that is already in the store; `origin` is where it was
    /// copied from, for the record, where it is new to it.
    pub fn attach_stored(&mut self, id: &str, stored: &str, origin: Option<&str>) -> Result<Entry> {
        self.refresh()?;
        let index = *self.by_id.get(id).ok_or_else(|| Error::not_found(tr!("core-library-the-reference")))?;
        let path = attachments::absolute(&self.dir, stored)?;
        if !path.is_file() {
            return Err(Error::not_found(tr!("core-library-the-stored-file", path = stored)));
        }
        self.link_file(index, stored.to_owned(), origin)
    }

    fn link_file(&mut self, index: usize, stored: String, origin: Option<&str>) -> Result<Entry> {
        if self.link_file_unsaved(index, stored, origin) {
            self.save()?;
        } else {
            self.save_files_if_changed()?;
        }
        Ok(self.entries[index].clone())
    }

    fn link_file_unsaved(&mut self, index: usize, stored: String, origin: Option<&str>) -> bool {
        if self.files.record(&stored, None, origin, &now()) {
            self.files_dirty = true;
        }
        let entry = &mut self.entries[index];
        let mut files = entry.attachments();
        if files.contains(&stored) {
            return false;
        }
        files.push(stored);
        entry.set_attachments(&files);
        entry.modified = now();
        true
    }

    /// As `attach`, leaving the saving to the caller, who has more changes to make.
    pub(crate) fn attach_unsaved(&mut self, id: &str, source: &Path) -> Result<bool> {
        let index = *self.by_id.get(id).ok_or_else(|| Error::not_found(tr!("core-library-the-reference")))?;
        let name = Self::file_name_for(&self.entries[index]);
        let stored = attachments::store_file(&self.dir, source, &name)?;
        Ok(self.link_file_unsaved(index, stored, Some(&source.display().to_string())))
    }

    /// Unlinks a file from the entry. The file stays in the store, whether
    /// another entry has it or none: it leaves only by `remove_file`.
    pub fn detach(&mut self, id: &str, stored: &str) -> Result<Entry> {
        self.refresh()?;
        let index = *self.by_id.get(id).ok_or_else(|| Error::not_found(tr!("core-library-the-reference")))?;
        let entry = &mut self.entries[index];
        let mut files = entry.attachments();
        let before = files.len();
        files.retain(|f| f != stored);
        if files.len() == before {
            return Ok(entry.clone());
        }
        entry.set_attachments(&files);
        entry.modified = now();
        let result = entry.clone();
        self.save()?;
        Ok(result)
    }

    /// Removes a file from the store: from every entry that has it, from the
    /// record, and from the disk. The one way a file leaves the library.
    pub fn remove_file(&mut self, hash: &str) -> Result<()> {
        self.refresh()?;
        let mut stored: Vec<String> = self.files.get(hash).map(|r| vec![r.path.clone()]).unwrap_or_default();
        let mut changed = false;
        for entry in &mut self.entries {
            let mut files = entry.attachments();
            let before = files.len();
            files.retain(|f| {
                let ours = attachments::hash_of_path(f) == Some(hash);
                if ours && !stored.contains(f) {
                    stored.push(f.clone());
                }
                !ours
            });
            if files.len() != before {
                entry.set_attachments(&files);
                entry.modified = now();
                changed = true;
            }
        }
        if stored.is_empty() && attachments::find_by_hash(&self.dir, hash).is_none() {
            return Err(Error::not_found(tr!("core-library-the-file-of-library")));
        }
        if let Some(found) = attachments::find_by_hash(&self.dir, hash)
            && !stored.contains(&found)
        {
            stored.push(found);
        }
        if self.files.forget(hash).is_some() {
            self.files_dirty = true;
        }
        if changed {
            self.save()?;
        } else {
            self.save_files_if_changed()?;
        }
        for path in stored {
            attachments::delete(&self.dir, &path)?;
        }
        Ok(())
    }

    /// Puts other content in the place of a stored file, for every entry
    /// that links to it: a PDF made searchable in the place of the scan it
    /// was made of. It is stored under the name the file had, and the file
    /// is deleted from the store; the record of the new one is that of the
    /// old, its folder, name and origin. The stored path of the new file,
    /// and the entries that were changed.
    pub fn replace_file(&mut self, stored: &str, content: &[u8]) -> Result<(String, Vec<Entry>)> {
        self.refresh()?;
        let old_hash = attachments::hash_of_path(stored).unwrap_or_default().to_owned();
        let linked = self.entries.iter().any(|e| e.attachments().iter().any(|f| f == stored));
        let on_disk = attachments::absolute(&self.dir, stored).is_ok_and(|p| p.is_file());
        if !linked && !(on_disk && self.files.get(&old_hash).is_some()) {
            return Err(Error::not_found(stored.to_owned()));
        }
        let name = stored.rsplit('/').next().unwrap_or(stored);
        let new = attachments::store_bytes(&self.dir, content, name)?;
        let mut changed = Vec::new();
        for entry in &mut self.entries {
            let mut files = entry.attachments();
            let Some(at) = files.iter().position(|f| f == stored) else { continue };
            files[at] = new.clone();
            // One that had the new content already has it once.
            let mut seen = HashSet::new();
            files.retain(|f| seen.insert(f.clone()));
            entry.set_attachments(&files);
            entry.modified = now();
            changed.push(entry.clone());
        }
        if new != stored {
            let new_hash = attachments::hash_of_path(&new).unwrap_or_default().to_owned();
            let old = self.files.forget(&old_hash);
            self.files.forget(&new_hash);
            let mut record = old.unwrap_or_else(|| FileRecord {
                name: stored.rsplit('/').next().unwrap_or(stored).to_owned(),
                added: now(),
                ..Default::default()
            });
            record.hash = new_hash;
            record.path = new.clone();
            self.files.files.push(record);
            self.files_dirty = true;
        }
        self.save()?;
        if new != stored
            && let Err(e) = attachments::delete(&self.dir, stored)
        {
            tracing::warn!(%e, stored, "could not delete a stored file");
        }
        Ok((new, changed))
    }

    /// The entries that link to content with this hash.
    pub fn entries_with_file_hash(&self, hash: &str) -> Vec<&Entry> {
        self.entries
            .iter()
            .filter(|e| e.attachments().iter().any(|f| attachments::hash_of_path(f) == Some(hash)))
            .collect()
    }

    /// A file of the store as the files view shows it.
    pub fn file_view(&self, hash: &str) -> Option<FileView> {
        let record = self.files.get(hash)?;
        Some(self.view_of(record))
    }

    /// Every file of the store, in the order of the record.
    pub fn file_views(&self) -> Vec<FileView> {
        let mut by_hash: HashMap<&str, Vec<Summary>> = HashMap::new();
        for e in &self.entries {
            for f in e.attachments() {
                if let Some(hash) = attachments::hash_of_path(&f)
                    && let Some(record) = self.files.get(hash)
                {
                    let list = by_hash.entry(record.hash.as_str()).or_default();
                    if !list.iter().any(|s| s.id == e.id) {
                        list.push(e.summary());
                    }
                }
            }
        }
        self.files
            .files
            .iter()
            .map(|r| FileView::of(&self.dir, r, by_hash.remove(r.hash.as_str()).unwrap_or_default()))
            .collect()
    }

    fn view_of(&self, record: &FileRecord) -> FileView {
        let references = self.entries_with_file_hash(&record.hash).into_iter().map(Entry::summary).collect();
        FileView::of(&self.dir, record, references)
    }

    /// Enters into the record files that were copied into the store by
    /// `files::store_paths`, each in its folder: the folders of `structure`
    /// made where they are not, under `folder`. Nothing is linked to any
    /// entry. A file the record knew already is said to be the same, and
    /// left where it was.
    pub fn enter_taken(&mut self, taken: &[files::Taken], folder: Option<&str>) -> Result<TakenIn> {
        if let Some(folder) = folder {
            self.files.folder(folder)?;
        }
        let before = self.files.folders.len();
        let mut out = TakenIn::default();
        let mut seen = HashSet::new();
        for t in taken {
            let Some(hash) = attachments::hash_of_path(&t.stored).map(str::to_owned) else { continue };
            if self.files.get(&hash).is_some() || !seen.insert(hash.clone()) {
                if let Some(view) = self.file_view(&hash)
                    && !out.same.iter().any(|v: &FileView| v.hash == hash)
                {
                    out.same.push(view);
                }
                continue;
            }
            let mut at = folder.map(str::to_owned);
            for name in &t.folders {
                match self.files.folder_named(name, at.as_deref()) {
                    Ok(f) => at = Some(f.id),
                    Err(e) => out.problems.push(format!("{name}: {e}")),
                }
            }
            self.files.record(&t.stored, at.as_deref(), Some(&t.origin), &now());
            if let Some(view) = self.file_view(&hash) {
                out.files.push(view);
            }
        }
        out.folders = self.files.folders.len() - before;
        if !out.files.is_empty() || out.folders > 0 {
            self.save_files()?;
        }
        Ok(out)
    }

    // ---- collections ----

    pub fn collection_create(&mut self, name: &str, parent: Option<&str>) -> Result<Collection> {
        let c = self.collections.create(name, parent, &now())?;
        self.save_collections()?;
        Ok(c)
    }

    pub fn collection_rename(&mut self, id: &str, name: &str) -> Result<()> {
        self.collections.rename(id, name)?;
        self.save_collections()
    }

    pub fn collection_move(&mut self, id: &str, parent: Option<&str>) -> Result<()> {
        self.collections.move_to(id, parent)?;
        self.save_collections()
    }

    pub fn collection_delete(&mut self, id: &str) -> Result<()> {
        self.collections.delete(id)?;
        self.save_collections()
    }

    pub fn collection_add(&mut self, id: &str, entries: &[String]) -> Result<usize> {
        let known: Vec<String> = entries.iter().filter(|e| self.by_id.contains_key(*e)).cloned().collect();
        let n = self.collections.add_entries(id, &known)?;
        self.save_collections()?;
        Ok(n)
    }

    pub fn collection_remove(&mut self, id: &str, entries: &[String]) -> Result<()> {
        self.collections.remove_entries(id, entries)?;
        self.save_collections()
    }

    // ---- export ----

    /// The entries as a BibLaTeX file for use elsewhere: without the
    /// application's own fields. `ids` of `None` exports everything.
    pub fn export(&self, ids: Option<&[String]>, with_files: bool) -> String {
        self.bib_of(ids, |e| {
            with_files.then(|| {
                e.attachments()
                    .iter()
                    .filter_map(|f| attachments::absolute(&self.dir, f).ok())
                    .map(|p| p.display().to_string())
                    .collect()
            })
        })
    }

    /// The body of `export` and of `export_with_paths` (`export.rs`): the
    /// entries, with the parents they name, each with the `file` field that
    /// `files` gives it, or none where it gives nothing.
    fn bib_of(&self, ids: Option<&[String]>, files: impl Fn(&Entry) -> Option<Vec<String>>) -> String {
        let mut out = String::new();
        let mut wanted: Vec<&Entry> = match ids {
            None => self.entries.iter().collect(),
            Some(ids) => ids.iter().filter_map(|id| self.resolve(id)).collect(),
        };
        // Parents named by crossref must be in the file, and after their children.
        let mut seen: HashSet<String> = wanted.iter().map(|e| e.id.clone()).collect();
        let mut i = 0;
        while i < wanted.len() {
            for field in ["crossref", "xref"] {
                if let Some(parent) = wanted[i].get(field).and_then(|k| self.by_key(k))
                    && seen.insert(parent.id.clone())
                {
                    wanted.push(parent);
                }
            }
            i += 1;
        }
        let (children, parents): (Vec<&Entry>, Vec<&Entry>) =
            wanted.into_iter().partition(|e| e.get("crossref").is_some());
        for e in children.into_iter().chain(parents) {
            match files(e) {
                Some(paths) => {
                    let mut copy = e.clone();
                    copy.set_attachments(&paths);
                    out.push_str(&copy.to_bib(false, true));
                }
                None => out.push_str(&e.to_bib(false, false)),
            }
            out.push('\n');
        }
        out
    }
}

/// Keeps an earlier key in `ids`, so that documents citing it still resolve.
fn remember_key(entry: &mut Entry, old: &str) {
    let old = old.trim();
    if old.is_empty() || old == entry.key {
        return;
    }
    let mut ids: Vec<String> = entry
        .get("ids")
        .map(|v| v.split(',').map(|k| k.trim().to_owned()).filter(|k| !k.is_empty()).collect())
        .unwrap_or_default();
    ids.retain(|k| *k != entry.key);
    if !ids.iter().any(|k| k == old) {
        ids.push(old.to_owned());
    }
    entry.set("ids", ids.join(","));
}

/// An entry as it is read from the library's own file.
fn stored_entry(raw: &RawEntry) -> Entry {
    let draft = Draft::from_raw(raw);
    let mut entry = draft.to_entry();
    // Names are kept as they were written; the draft would have reformatted them.
    for (name, value) in &mut entry.fields {
        if draft.names.contains_key(name)
            && let Some(original) = raw.get(name)
        {
            *value = bib::latex::decode(original);
        }
    }
    entry.id = raw.get(entry::FIELD_ID).unwrap_or("").trim().to_owned();
    entry.added = raw.get(entry::FIELD_ADDED).unwrap_or("").trim().to_owned();
    entry.modified = raw.get(entry::FIELD_MODIFIED).unwrap_or("").trim().to_owned();
    entry.merged = raw
        .get(entry::FIELD_MERGED)
        .map(|v| v.split(',').map(|s| s.trim().to_owned()).filter(|s| !s.is_empty()).collect())
        .unwrap_or_default();
    entry.zotero = raw.get(entry::FIELD_ZOTERO).map(entry::zotero_keys).unwrap_or_default();
    if let Some(files) = raw.get("file") {
        entry.set("file", files.trim());
    }
    entry
}

/// What is wrong with a citation key that was asked for. It has a kind of its
/// own, by which the interface shows it beside the key, in whatever language
/// it is said.
fn key_error(message: String) -> Error {
    Error::Refused { kind: "key", message }
}

/// Reads exactly one entry from source typed by the user.
pub fn draft_from_source(source: &str) -> Result<Draft> {
    let parsed = bib::parse(source);
    if let Some(w) = parsed.warnings.first() {
        return Err(Error::invalid(tr!("core-library-line-sentence", line = w.line, message = &w.message)));
    }
    let mut entries = parsed.into_entries();
    match entries.len() {
        0 => Err(Error::invalid(tr!("core-library-no-entry"))),
        1 => Ok(Draft::from_raw(&entries.remove(0))),
        n => Err(Error::invalid(tr!("core-library-many-entries", count = n))),
    }
}

/// A note as it is kept. What the user writes as lines are paragraphs to
/// BibLaTeX, which an empty line sets apart: a line break alone is no more
/// than a space there, and would be lost the next time the file is read.
fn tidy_note(text: &str) -> String {
    text.replace("\r\n", "\n")
        .replace('\r', "\n")
        .lines()
        .map(crate::bib::parser::normalise_space)
        .filter(|line| !line.is_empty())
        .collect::<Vec<_>>()
        .join("\n\n")
}

/// A file of the store, with what the record and the entries say of it.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileView {
    pub hash: String,
    /// The stored path, as the entries name it.
    pub path: String,
    pub name: String,
    pub kind: FileKind,
    pub size: u64,
    pub exists: bool,
    pub folder: Option<String>,
    pub origin: Option<String>,
    pub added: String,
    /// The references the file belongs to, in the order of the library.
    pub references: Vec<Summary>,
}

impl FileView {
    fn of(dir: &Path, record: &FileRecord, references: Vec<Summary>) -> Self {
        let meta = attachments::absolute(dir, &record.path).ok().and_then(|p| fs::metadata(p).ok());
        FileView {
            hash: record.hash.clone(),
            path: record.path.clone(),
            name: record.name.clone(),
            kind: files::kind_of(&record.name),
            size: meta.as_ref().map(|m| m.len()).unwrap_or(0),
            exists: meta.is_some_and(|m| m.is_file()),
            folder: record.folder.clone(),
            origin: record.origin.clone(),
            added: record.added.clone(),
            references,
        }
    }
}

/// What came of taking files in.
#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TakenIn {
    /// The files that are new to the library.
    pub files: Vec<FileView>,
    /// Those it had already, left where they were.
    pub same: Vec<FileView>,
    /// How many folders were made.
    pub folders: usize,
    pub problems: Vec<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn what_the_user_writes_about_a_work() {
        let tmp = tempfile::tempdir().unwrap();
        let mut lib = Library::open_at(&tmp.path().join("library")).unwrap();
        let e = lib
            .add(
                &draft_from_source(
                    "@book{nagy1979, author={Nagy, Gregory}, title={The Best of the Achaeans}, date={1979}}",
                )
                .unwrap(),
            )
            .unwrap();
        assert!(!e.summary().has_note);

        let note = "On mênis & kleos: 100% of chapter 5 {sic}.  \r\n\r\n\r\nRead again: “best” is a title, not praise.\nCf. #12 in my notebook_2.\n";
        let e = lib.set_note(&e.id, note).unwrap();
        assert!(e.summary().has_note);
        let kept = "On mênis & kleos: 100% of chapter 5 {sic}.\n\nRead again: “best” is a title, not praise.\n\nCf. #12 in my notebook_2.";
        assert_eq!(Draft::from_entry(&e).get("annotation"), Some(kept));
        assert_eq!(e.key, "nagy1979");
        assert_eq!(e.get("title"), Some("The Best of the Achaeans"));

        // As it is read from the file again, by this application or another.
        let again = Library::open_at(&tmp.path().join("library")).unwrap();
        assert_eq!(Draft::from_entry(again.require(&e.id).unwrap()).get("annotation"), Some(kept));
        assert!(again.summaries().iter().any(|s| s.id == e.id && s.has_note));
        assert!(again.summaries()[0].search.contains("kleos"), "a note is found by what it says");

        let e = lib.set_note(&e.id, "  \n ").unwrap();
        assert!(!e.summary().has_note);
        assert!(!lib.source(&e.id).unwrap().contains("annotation"));
        assert!(lib.set_note("nothing", "x").is_err());
    }

    fn draft(src: &str) -> Draft {
        draft_from_source(src).unwrap()
    }

    fn library() -> (tempfile::TempDir, Library) {
        let tmp = tempfile::tempdir().unwrap();
        let lib = Library::open_at(&tmp.path().join("library")).unwrap();
        (tmp, lib)
    }

    #[test]
    fn add_reopen_update_remove() {
        let (tmp, mut lib) = library();
        let a = lib
            .add(&draft("@book{, author={Nagy, Gregory}, title={The Best of the {Achaeans}}, date={1979}, publisher={Johns Hopkins & Sons}}"))
            .unwrap();
        assert_eq!(a.key, "nagy1979");
        let b = lib.add(&draft("@book{, author={Nagy, Gregory}, title={Another}, date={1979}}")).unwrap();
        assert_eq!(b.key, "nagy1979a");
        // What is wrong with a key has a kind of its own, by which the
        // interface shows it beside the key in any language.
        let taken = lib.add(&draft("@book{nagy1979, title={Clash}}")).unwrap_err();
        assert_eq!(taken.kind(), "key");
        assert_eq!(taken.to_string(), "The citation key “nagy1979” is already in use.");
        let spaced = lib.add(&draft("@book{bad key, title={Clash}}")).unwrap_err();
        assert_eq!(spaced.kind(), "key");
        assert_eq!(spaced.to_string(), "A citation key may hold letters, digits and - _ : . only. Try “bad_key”.");

        let text = fs::read_to_string(lib.file()).unwrap();
        assert!(text.contains("Johns Hopkins \\& Sons"));
        assert!(text.contains("glaukopis-id"));

        let reopened = Library::open_at(&tmp.path().join("library")).unwrap();
        assert_eq!(reopened.len(), 2);
        let again = reopened.get(&a.id).unwrap();
        assert_eq!(again.get("publisher"), Some("Johns Hopkins & Sons"));
        assert_eq!(again.get("title"), Some("The Best of the {Achaeans}"));
        assert_eq!(again.added, a.added);

        let mut d = Draft::from_entry(&a);
        d.key = "nagy:best".into();
        d.fields.insert("edition".into(), "2".into());
        let updated = lib.update(&a.id, &d).unwrap();
        assert_eq!(updated.key, "nagy:best");
        assert_eq!(updated.get("ids"), Some("nagy1979"));
        assert_eq!(lib.by_key("nagy1979").unwrap().id, a.id);

        assert_eq!(lib.remove(&[a.id.clone(), "nonsense".into()], false).unwrap(), 1);
        assert!(lib.get(&a.id).is_none());
        assert_eq!(lib.len(), 1);
    }

    #[test]
    fn entries_added_by_hand_are_adopted() {
        let tmp = tempfile::tempdir().unwrap();
        let dir = tmp.path().join("library");
        fs::create_dir_all(&dir).unwrap();
        fs::write(
            dir.join("library.bib"),
            "@article{same, title={One}, journal={J}, year={2001}}\n@article{same, title={Two}}\n@book{bad key!, title={Three}}\n",
        )
        .unwrap();
        let lib = Library::open_at(&dir).unwrap();
        assert_eq!(lib.len(), 3);
        let keys: Vec<&str> = lib.entries().iter().map(|e| e.key.as_str()).collect();
        assert_eq!(keys, vec!["same", "same2", "bad_key"]);
        assert!(lib.entries().iter().all(|e| e.id.len() == 36 && !e.added.is_empty()));
        assert_eq!(lib.entries()[0].get("journaltitle"), Some("J"));
        assert_eq!(lib.entries()[0].get("date"), Some("2001"));
        // Adopting wrote the ids back.
        assert!(fs::read_to_string(dir.join("library.bib")).unwrap().contains("glaukopis-id"));
        assert!(dir.join("library.bib.bak").exists());
    }

    #[test]
    fn changes_from_outside_are_seen() {
        let (_tmp, mut lib) = library();
        lib.add(&draft("@book{a, title={A}}")).unwrap();
        let mut text = fs::read_to_string(lib.file()).unwrap();
        text.push_str("\n@book{b, title={B, added by hand}}\n");
        fs::write(lib.file(), text).unwrap();
        assert!(lib.refresh().unwrap());
        assert_eq!(lib.len(), 2);
        assert!(!lib.refresh().unwrap());
        // A change made now is applied on top of what was read.
        lib.add(&draft("@book{c, title={C}}")).unwrap();
        assert_eq!(lib.len(), 3);
        assert!(lib.take_reread() && !lib.take_reread(), "the interface is told once");

        // What a change of one entry reads first is told to the interface as well.
        let mut text = fs::read_to_string(lib.file()).unwrap();
        text.push_str("\n@book{d, title={D, added by hand}}\n");
        fs::write(lib.file(), text).unwrap();
        lib.add(&draft("@book{e, title={E}}")).unwrap();
        assert_eq!(lib.len(), 5);
        assert!(lib.take_reread());
    }

    #[test]
    fn what_cannot_be_read_is_not_lost_when_the_file_is_written() {
        let (_tmp, mut lib) = library();
        lib.add(&draft("@book{a, title={A}}")).unwrap();
        let mut text = fs::read_to_string(lib.file()).unwrap();
        text.push_str(
            "\n@string{hup = {Harvard University Press}}\n@comment{jabref-meta: databaseType:biblatex;}\n\
             @book{b, title={B}, publisher = hup}\n@book{broken, title={Its brace is never closed\n\
             @book{c, title={C}}\n",
        );
        fs::write(lib.file(), text).unwrap();
        assert!(lib.refresh().unwrap());
        assert_eq!(lib.len(), 3, "a, b and c are read; the broken one is not");
        assert_eq!(lib.warnings.len(), 1);

        // Reading adopted b and c, and so wrote the file again; a change writes it once more.
        lib.add(&draft("@book{d, title={D}}")).unwrap();
        let written = fs::read_to_string(lib.file()).unwrap();
        assert!(written.contains("@book{broken, title={Its brace is never closed"), "{written}");
        assert!(written.contains("@string{hup = {Harvard University Press}}"));
        assert!(written.contains("@comment{jabref-meta: databaseType:biblatex;}"));

        // Read again, it is the same, and writing it again adds nothing.
        let reopened = Library::open_at(lib.dir()).unwrap();
        assert_eq!(reopened.len(), 4);
        assert_eq!(reopened.warnings.len(), 1);
        let b = reopened.entries().iter().find(|e| e.key == "b").unwrap();
        assert_eq!(b.get("publisher"), Some("Harvard University Press"));
        lib.add(&draft("@book{e, title={E}}")).unwrap();
        let again = fs::read_to_string(lib.file()).unwrap();
        assert_eq!(again.matches("@book{broken").count(), 1);
        assert_eq!(again.matches("@string{hup").count(), 1);
        assert_eq!(again.matches("could not be read by Glaukopis").count(), 1);
    }

    #[test]
    fn a_library_without_anything_amiss_is_written_as_before() {
        let (_tmp, mut lib) = library();
        lib.add(&draft("@book{a, title={A}}")).unwrap();
        let written = fs::read_to_string(lib.file()).unwrap();
        assert!(!written.contains("could not be read"));
        assert!(written.starts_with(HEADER));
        assert!(written[HEADER.len()..].starts_with("@book{a,"), "{written}");
    }

    #[test]
    fn what_duplicates_are_found_by_follows_the_library() {
        let (_tmp, mut lib) = library();
        lib.add(&draft("@book{a, author={Nagy, Gregory}, title={The Best of the Achaeans}, date={1979}}")).unwrap();
        let later = draft("@book{b, author={Lord, Albert}, title={The Singer of Tales}, date={1960}}");
        let print = crate::duplicates::fingerprint(&later.to_entry());
        assert!(lib.duplicates_index().find(&print, None).is_empty());
        // A copy is the library as it was.
        let copy = lib.clone();
        lib.add(&later).unwrap();
        assert_eq!(lib.duplicates_index().find(&print, None).len(), 1, "made again after the change");
        assert!(copy.duplicates_index().find(&print, None).is_empty());
        assert_eq!((copy.len(), lib.len()), (1, 2));
    }

    #[test]
    fn a_file_is_stored_without_the_library_and_linked_after() {
        let (tmp, mut lib) = library();
        let e = lib.add(&draft("@book{a, author={Nagy, Gregory}, title={Homeric Questions}, date={1996}}")).unwrap();
        let source = tmp.path().join("questions.pdf");
        fs::write(&source, b"%PDF-1.4 Homeric").unwrap();
        let (name, dir) = lib.file_name_of(&e.id).unwrap();
        assert_eq!(name, "Nagy 1996 - Homeric Questions");
        let stored = attachments::store_file(&dir, &source, &name).unwrap();
        let linked = lib.attach_stored(&e.id, &stored, None).unwrap();
        assert_eq!(linked.attachments(), [stored]);
    }

    #[test]
    fn keys_are_known_by_the_library_as_entries_come_and_change() {
        let (_tmp, mut lib) = library();
        let a = lib.add(&draft("@book{nagy1979, author={Nagy, Gregory}, title={A}, date={1979}}")).unwrap();
        assert_eq!(lib.by_key("NAGY1979").unwrap().id, a.id);
        // An import that brings the same key twice gives the second another.
        let added = lib
            .add_many(&[
                draft("@book{nagy1979, title={B}, date={1979}}"),
                draft("@book{nagy1979, title={C}, date={1979}}"),
            ])
            .unwrap();
        let keys: Vec<&str> = added.iter().map(|e| e.key.as_str()).collect();
        assert_eq!(keys, ["nagy1979a", "nagy1979b"]);
        assert_eq!(lib.by_key("nagy1979b").unwrap().id, added[1].id);
        // A key given up is still known, as one the entry had.
        let mut changed = Draft::from_entry(&a);
        changed.key = "nagy-best".into();
        lib.update(&a.id, &changed).unwrap();
        assert_eq!(lib.by_key("nagy-best").unwrap().id, a.id);
        assert_eq!(lib.by_key("nagy1979").unwrap().id, a.id, "the earlier key");
        // And no longer taken: a new entry may have it.
        assert_eq!(lib.suggest_key(&draft("@book{x, author={Nagy, G.}, title={D}, date={1979}}"), None), "nagy1979");
        // The entry changed has its own key free for itself.
        assert_eq!(lib.suggest_key(&Draft::from_entry(lib.get(&a.id).unwrap()), Some(&a.id)), "nagy1979");
    }

    #[test]
    #[ignore = "a measure, to be run in release: cargo test --release -p glaukopis-core -- --ignored many_added"]
    fn many_added() {
        let (_tmp, mut lib) = library();
        let make = |from: usize, count: usize| -> Vec<Draft> {
            (from..from + count)
                .map(|i| {
                    draft(&format!(
                        "@book{{k, author={{Family{}, A.}}, title={{Title {i}}}, date={{{}}}}}",
                        i % 50,
                        1950 + i % 50
                    ))
                })
                .collect()
        };
        lib.add_many(&make(0, 20_000)).unwrap();
        let began = std::time::Instant::now();
        lib.add_many(&make(20_000, 1_000)).unwrap();
        eprintln!("1000 added to 20000 in {:?}", began.elapsed());
        let keys: Vec<String> = lib.entries().iter().step_by(21).map(|e| e.key.clone()).collect();
        let began = std::time::Instant::now();
        for key in &keys {
            assert!(lib.by_key(key).is_some());
        }
        eprintln!("1000 keys looked up in {:?}", began.elapsed());
    }

    #[test]
    fn names_survive_storage_unchanged() {
        let (tmp, mut lib) = library();
        let e = lib
            .add(&draft(r#"@book{x, author={van Beethoven, Ludwig and {British Museum} and King, Jr., Martin Luther}, title={T}}"#))
            .unwrap();
        let reopened = Library::open_at(&tmp.path().join("library")).unwrap();
        assert_eq!(
            reopened.get(&e.id).unwrap().get("author"),
            Some("van Beethoven, Ludwig and {British Museum} and King, Jr., Martin Luther")
        );
    }

    #[test]
    fn merging() {
        let (_tmp, mut lib) = library();
        let a = lib.add(&draft("@book{nagy1979, author={Nagy, G.}, title={Best}, date={1979}}")).unwrap();
        let b = lib
            .add(&draft("@book{Nagy:1979, author={Nagy, Gregory}, title={The Best}, date={1979}, isbn={123}}"))
            .unwrap();
        let c = lib.collection_create("Homer", None).unwrap();
        lib.collection_add(&c.id, std::slice::from_ref(&b.id)).unwrap();

        let mut merged = Draft::from_entry(&a);
        merged.fields.insert("isbn".into(), "123".into());
        let kept = lib.merge(&a.id, &b.id, &merged).unwrap();

        assert_eq!(lib.len(), 1);
        assert_eq!(kept.get("isbn"), Some("123"));
        assert_eq!(kept.get("ids"), Some("Nagy:1979"));
        assert_eq!(kept.merged, vec![b.id.clone()]);
        assert_eq!(lib.resolve(&b.id).unwrap().id, a.id);
        assert_eq!(lib.collections.get(&c.id).unwrap().entries, vec![a.id.clone()]);

        // The trail survives a restart.
        let reopened = Library::open_at(lib.dir()).unwrap();
        assert_eq!(reopened.resolve(&b.id).unwrap().id, a.id);
    }

    #[test]
    fn what_an_entry_is_in_zotero_is_kept_and_not_shown() {
        let (_tmp, mut lib) = library();
        let mut d = draft("@book{nagy1979, author={Nagy, G.}, title={Best}, date={1979}}");
        d.fields.insert(entry::FIELD_ZOTERO.into(), "abcd2345".into());
        let a = lib.add(&d).unwrap();
        assert_eq!(a.zotero, vec!["ABCD2345"]);
        assert_eq!(a.get(entry::FIELD_ZOTERO), None);
        assert!(fs::read_to_string(lib.file()).unwrap().contains("glaukopis-zotero = {ABCD2345}"));

        // Not in the form, not in the source, not in what is exported.
        assert!(!a.view().fields.contains_key(entry::FIELD_ZOTERO));
        assert!(!lib.source(&a.id).unwrap().contains("glaukopis"));
        assert!(!lib.export(None, true).contains("glaukopis"));

        // What the form hands back does not say it, and does not take it away.
        let mut changed = Draft::from_entry(&a);
        changed.fields.insert("edition".into(), "2".into());
        assert_eq!(lib.update(&a.id, &changed).unwrap().zotero, vec!["ABCD2345"]);
        let source = lib.source(&a.id).unwrap().replace("{Best}", "{The Best}");
        assert_eq!(lib.update_from_source(&a.id, &source).unwrap().zotero, vec!["ABCD2345"]);

        // When entries are merged, the keys of both are kept.
        let mut d = draft("@book{nagy1979b, author={Nagy, Gregory}, title={The Best}, date={1979}}");
        d.fields.insert(entry::FIELD_ZOTERO.into(), "WXYZ6789".into());
        let b = lib.add(&d).unwrap();
        let kept = lib.merge(&a.id, &b.id, &Draft::from_entry(lib.require(&a.id).unwrap())).unwrap();
        assert_eq!(kept.zotero, vec!["ABCD2345", "WXYZ6789"]);

        let reopened = Library::open_at(lib.dir()).unwrap();
        assert_eq!(reopened.require(&a.id).unwrap().zotero, vec!["ABCD2345", "WXYZ6789"]);
    }

    #[test]
    fn attaching_and_detaching() {
        let (tmp, mut lib) = library();
        let a = lib.add(&draft("@book{a, author={Nagy, G.}, title={Best: of}, date={1979}}")).unwrap();
        let b = lib.add(&draft("@book{b, title={B}}")).unwrap();
        let pdf = tmp.path().join("x.pdf");
        fs::write(&pdf, b"%PDF one").unwrap();

        let a2 = lib.attach(&a.id, &pdf).unwrap();
        let stored = a2.attachments()[0].clone();
        assert!(stored.ends_with("/Nagy 1979 - Best of.pdf"), "{stored}");
        // Attaching again changes nothing.
        assert_eq!(lib.attach(&a.id, &pdf).unwrap().attachments().len(), 1);
        // The same file on a second entry is the same stored file.
        assert_eq!(lib.attach(&b.id, &pdf).unwrap().attachments(), vec![stored.clone()]);
        let hash = attachments::hash_of_path(&stored).unwrap().to_owned();
        assert_eq!(lib.entries_with_file_hash(&hash).len(), 2);

        lib.detach(&a.id, &stored).unwrap();
        assert!(lib.attachment_path(&stored).unwrap().exists(), "still used by b");
        lib.remove(std::slice::from_ref(&b.id), false).unwrap();
        assert!(lib.attachment_path(&stored).unwrap().exists(), "a file stays when its references go");
        let view = lib.file_view(&hash).unwrap();
        assert!(view.references.is_empty(), "it belongs to none");
        assert_eq!(view.kind, FileKind::Pdf);
        assert_eq!(view.origin.as_deref(), Some(pdf.display().to_string().as_str()));

        // An update from the form does not lose attachments.
        let a3 = lib.attach(&a.id, &pdf).unwrap();
        let d = Draft::from_entry(&a3);
        assert!(!d.fields.contains_key("file"));
        assert_eq!(lib.update(&a.id, &d).unwrap().attachments().len(), 1);
    }

    #[test]
    fn a_tree_of_files_is_taken_in_with_its_folders() {
        use std::sync::atomic::AtomicBool;
        let (tmp, mut lib) = library();
        let desk = tmp.path().join("Greek");
        fs::create_dir_all(desk.join("Homer")).unwrap();
        fs::write(desk.join("Homer/Nagy 1979.pdf"), b"%PDF nagy").unwrap();
        fs::write(desk.join("Homer/West 1988.pdf"), b"%PDF west").unwrap();
        fs::write(desk.join("plate.png"), b"png plate").unwrap();
        fs::write(desk.join("notes.txt"), b"notes").unwrap();
        fs::write(desk.join(".hidden"), b"hidden").unwrap();
        fs::write(desk.join("empty.pdf"), b"").unwrap();
        let loose = tmp.path().join("copy of nagy.pdf");
        fs::write(&loose, b"%PDF nagy").unwrap();
        let top = lib.files.folder_create("Sources", None).unwrap();
        lib.save_files().unwrap();

        let mut told = Vec::new();
        let stop = AtomicBool::new(false);
        let (taken, problems) =
            files::store_paths(lib.dir(), &[desk.clone()], true, &mut |d, t, _| told.push((d, t)), &stop);
        assert!(problems.is_empty(), "{problems:?}");
        assert_eq!(taken.len(), 4);
        assert_eq!(told.last(), Some(&(4, 4)));
        let got = lib.enter_taken(&taken, Some(&top.id)).unwrap();
        assert_eq!((got.files.len(), got.same.len(), got.folders), (4, 0, 2));
        let homer = lib.files.folders.iter().find(|f| f.name == "Homer").unwrap().clone();
        let greek = lib.files.folder(homer.parent.as_deref().unwrap()).unwrap().clone();
        assert_eq!((greek.name.as_str(), greek.parent.as_deref()), ("Greek", Some(top.id.as_str())));
        let nagy = got.files.iter().find(|f| f.name == "Nagy 1979.pdf").unwrap();
        assert_eq!(nagy.folder.as_deref(), Some(homer.id.as_str()));
        assert!(nagy.references.is_empty());

        // The same tree again: the same files, no new folders.
        let (again, _) = files::store_paths(lib.dir(), &[desk.clone()], true, &mut |_, _, _| {}, &stop);
        let got = lib.enter_taken(&again, Some(&top.id)).unwrap();
        assert_eq!((got.files.len(), got.same.len(), got.folders), (0, 4, 0));

        // One content under two names is one file.
        let (copy, _) = files::store_paths(lib.dir(), &[loose], true, &mut |_, _, _| {}, &stop);
        let got = lib.enter_taken(&copy, None).unwrap();
        assert_eq!((got.files.len(), got.same.len()), (0, 1));

        // The record is read back as it was written; a file is removed from everything.
        let again = Library::open_at(lib.dir()).unwrap();
        assert_eq!(again.files, lib.files);
        let e = lib.add(&draft("@book{n, title={Best}}")).unwrap();
        lib.attach_stored(&e.id, &nagy.path, None).unwrap();
        lib.remove_file(&nagy.hash).unwrap();
        assert!(lib.require(&e.id).unwrap().attachments().is_empty());
        assert!(lib.file_view(&nagy.hash).is_none());
        assert!(!lib.attachment_path(&nagy.path).unwrap().exists());
        assert_eq!(lib.remove_file(&nagy.hash).unwrap_err().kind(), "not-found");

        // Removing a reference with its files removes those no other has.
        let west = lib.file_views().into_iter().find(|f| f.name == "West 1988.pdf").unwrap();
        let plate = lib.file_views().into_iter().find(|f| f.name == "plate.png").unwrap();
        let w = lib.add(&draft("@book{w, title={West}}")).unwrap();
        let o = lib.add(&draft("@book{o, title={Other}}")).unwrap();
        lib.attach_stored(&w.id, &west.path, None).unwrap();
        lib.attach_stored(&w.id, &plate.path, None).unwrap();
        lib.attach_stored(&o.id, &plate.path, None).unwrap();
        lib.remove(std::slice::from_ref(&w.id), true).unwrap();
        assert!(lib.file_view(&west.hash).is_none(), "had no other");
        assert_eq!(lib.file_view(&plate.hash).unwrap().references.len(), 1, "another has it");
    }

    #[test]
    fn a_stored_file_is_replaced_for_all_that_link_it() {
        let (tmp, mut lib) = library();
        let a = lib.add(&draft("@book{a, author={Nagy, G.}, title={Best}, date={1979}}")).unwrap();
        let b = lib.add(&draft("@incollection{b, title={A chapter}}")).unwrap();
        let other = tmp.path().join("other.pdf");
        fs::write(&other, b"%PDF other").unwrap();
        let scan = tmp.path().join("scan.pdf");
        fs::write(&scan, b"%PDF scan").unwrap();
        lib.attach(&a.id, &other).unwrap();
        let stored = lib.attach(&a.id, &scan).unwrap().attachments()[1].clone();
        lib.attach(&b.id, &scan).unwrap();

        let scan_hash = attachments::hash_of_path(&stored).unwrap().to_owned();
        let folder = lib.files.folder_create("Scans", None).unwrap();
        lib.files.move_file(&scan_hash, Some(&folder.id)).unwrap();
        let (new, changed) = lib.replace_file(&stored, b"%PDF scan, searchable").unwrap();
        assert_eq!(changed.len(), 2);
        let now = lib.require(&a.id).unwrap().attachments();
        assert_eq!(now.len(), 2);
        assert_ne!(now[1], stored, "in the same place, another file");
        assert!(now[1].ends_with("/Nagy 1979 - Best.pdf"), "{}", now[1]);
        assert_eq!(lib.require(&b.id).unwrap().attachments(), vec![now[1].clone()]);
        assert_eq!(fs::read(lib.attachment_path(&now[1]).unwrap()).unwrap(), b"%PDF scan, searchable");
        assert!(!lib.attachment_path(&stored).unwrap().exists(), "the scan is gone from the store");
        assert_eq!(now[1], new);
        let record = lib.files.get(attachments::hash_of_path(&new).unwrap()).unwrap();
        assert_eq!(record.folder.as_deref(), Some(folder.id.as_str()), "the new file stands where the scan stood");
        assert!(lib.files.get(&scan_hash).is_none());

        assert_eq!(lib.replace_file(&stored, b"%PDF").unwrap_err().kind(), "not-found");
    }

    #[test]
    fn editing_the_source() {
        let (_tmp, mut lib) = library();
        let a = lib.add(&draft("@book{a, title={A}, publisher={P & Q}}")).unwrap();
        let src = lib.source(&a.id).unwrap();
        assert!(src.contains("P \\& Q") && !src.contains("glaukopis"));
        let changed = src.replace("@book", "@collection").replace("{A}", "{A, revised}");
        let e = lib.update_from_source(&a.id, &changed).unwrap();
        assert_eq!(e.entry_type, "collection");
        assert_eq!(e.get("title"), Some("A, revised"));
        assert_eq!(e.id, a.id);
        assert!(lib.update_from_source(&a.id, "nothing").is_err());
        assert!(lib.update_from_source(&a.id, "@book{a, title={x}}\n@book{b, title={y}}").is_err());
        assert!(lib.update_from_source(&a.id, "@book{a, title={x}").is_err());
    }

    #[test]
    fn export_brings_parents() {
        let (_tmp, mut lib) = library();
        let parent =
            lib.add(&draft("@collection{fowler2004, editor={Fowler, R.}, title={Companion}, date={2004}}")).unwrap();
        let child = lib
            .add(&draft("@incollection{nagy2004, author={Nagy, G.}, title={Chapter}, crossref={fowler2004}}"))
            .unwrap();
        let out = lib.export(Some(std::slice::from_ref(&child.id)), false);
        let child_at = out.find("@incollection{nagy2004").unwrap();
        let parent_at = out.find("@collection{fowler2004").unwrap();
        assert!(child_at < parent_at);
        assert!(!out.contains("glaukopis-"));
        let _ = parent;
    }
}
