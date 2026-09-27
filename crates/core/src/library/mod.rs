//! The reference library: one BibLaTeX file for all projects.

pub mod attachments;
pub mod collections;
pub mod entry;
pub mod keys;
pub mod schema;

use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

use crate::bib::{self, RawEntry};
use crate::error::{Error, IoContext, Result};
use crate::fsutil::write_atomic_with_backup;
use crate::paths::DataDir;

pub use attachments::StoredFile;
pub use collections::{Collection, Collections};
pub use entry::{Draft, Entry, EntryView, Summary};

const HEADER: &str = "\
% The reference library of Glaukopis. BibLaTeX, UTF-8.
%
% This file is written by Glaukopis. It may be read by any BibLaTeX tool.
% Changes made to it by hand are taken up when Glaukopis next looks at it.
% The fields beginning with glaukopis- identify each entry to the application.

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

#[derive(Debug)]
pub struct Library {
    dir: PathBuf,
    file: PathBuf,
    collections_file: PathBuf,
    entries: Vec<Entry>,
    by_id: HashMap<String, usize>,
    /// Ids of entries merged away, pointing to the entry that absorbed them.
    aliases: HashMap<String, String>,
    pub collections: Collections,
    stamp: Option<Stamp>,
    /// What was found amiss when the file was last read.
    pub warnings: Vec<String>,
}

impl Library {
    pub fn open(data: &DataDir) -> Result<Self> {
        Self::open_at(&data.library())
    }

    pub fn open_at(dir: &Path) -> Result<Self> {
        fs::create_dir_all(dir.join(attachments::DIR)).context(|| format!("creating {}", dir.display()))?;
        let mut library = Library {
            dir: dir.to_owned(),
            file: dir.join("library.bib"),
            collections_file: dir.join("collections.json"),
            entries: Vec::new(),
            by_id: HashMap::new(),
            aliases: HashMap::new(),
            collections: Collections::default(),
            stamp: None,
            warnings: Vec::new(),
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
            Err(e) => return Err(e).context(|| format!("reading {}", self.file.display())),
        };
        self.stamp = stamp_of(&self.file);

        let parsed = bib::parse(&text);
        for w in &parsed.warnings {
            self.warnings.push(format!("line {}: {}", w.line, w.message));
        }

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
                self.warnings.push(format!("the key “{}” was changed to “{}”", entry.key, key));
                entry.key = key;
                needs_saving = true;
            }
            keys.insert(entry.key.clone());
            self.entries.push(entry);
        }
        self.reindex();
        self.collections = Collections::load(&self.collections_file)?;

        if needs_saving {
            self.save()?;
        }
        Ok(())
    }

    fn reindex(&mut self) {
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
        Ok(true)
    }

    pub(crate) fn save(&mut self) -> Result<()> {
        let mut out = String::with_capacity(self.entries.len() * 400 + HEADER.len());
        out.push_str(HEADER);
        for e in &self.entries {
            out.push_str(&e.to_bib(true, true));
            out.push('\n');
        }
        write_atomic_with_backup(&self.file, out.as_bytes())?;
        self.stamp = stamp_of(&self.file);
        Ok(())
    }

    pub(crate) fn save_collections(&self) -> Result<()> {
        self.collections.save(&self.collections_file)
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
        self.get(id).ok_or_else(|| Error::not_found("the reference"))
    }

    pub fn by_key(&self, key: &str) -> Option<&Entry> {
        let lower = key.to_lowercase();
        self.entries.iter().find(|e| e.key.to_lowercase() == lower).or_else(|| {
            // Earlier keys are remembered in `ids`.
            self.entries
                .iter()
                .find(|e| e.get("ids").is_some_and(|ids| ids.split(',').any(|k| k.trim().to_lowercase() == lower)))
        })
    }

    pub fn summaries(&self) -> Vec<Summary> {
        self.entries.iter().map(Entry::summary).collect()
    }

    fn taken_keys(&self, except: Option<&str>) -> HashSet<String> {
        self.entries.iter().filter(|e| Some(e.id.as_str()) != except).map(|e| e.key.clone()).collect()
    }

    // ---- changing ----

    /// The key for a draft: the one it asks for, if it is free; otherwise one is made.
    /// `strict` refuses a key that is taken instead of making another.
    fn key_for(&self, draft: &Draft, except: Option<&str>, strict: bool) -> Result<String> {
        let taken = self.taken_keys(except);
        let asked = draft.key.trim();
        if asked.is_empty() {
            return Ok(keys::unique_key(&keys::base_key(&draft.to_entry()), &taken));
        }
        let Some(clean) = keys::sanitise_key(asked) else {
            return Err(Error::invalid(format!("“{asked}” cannot be used as a citation key.")));
        };
        if strict {
            if clean != asked {
                return Err(Error::invalid(format!(
                    "A citation key may hold letters, digits and - _ : . only. Try “{clean}”."
                )));
            }
            if taken.iter().any(|k| k.to_lowercase() == clean.to_lowercase()) {
                return Err(Error::invalid(format!("The citation key “{clean}” is already in use.")));
            }
            return Ok(clean);
        }
        Ok(keys::unique_key(&clean, &taken))
    }

    fn check_type(entry_type: &str) -> Result<String> {
        let t = entry_type.trim().to_ascii_lowercase();
        if t.is_empty() || !t.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-') {
            return Err(Error::invalid("The reference has no publication type."));
        }
        if matches!(t.as_str(), "comment" | "string" | "preamble") {
            return Err(Error::invalid(format!("“{t}” is not a publication type.")));
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
        };
        self.by_id.insert(entry.id.clone(), self.entries.len());
        self.entries.push(entry.clone());
        Ok(entry)
    }

    /// Replaces an entry's content by the draft. Attachments are not touched.
    pub fn update(&mut self, id: &str, draft: &Draft) -> Result<Entry> {
        self.refresh()?;
        let entry = self.apply(id, draft)?;
        self.save()?;
        Ok(entry)
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
        let index = *self.by_id.get(id).ok_or_else(|| Error::not_found("the reference"))?;
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

    pub fn remove(&mut self, ids: &[String]) -> Result<usize> {
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
        for f in files {
            self.delete_file_if_unused(&f);
        }
        Ok(count)
    }

    /// Merges `absorbed` into `kept`, whose content becomes `draft`. Whatever
    /// pointed to the absorbed entry will find the kept one.
    pub fn merge(&mut self, kept: &str, absorbed: &str, draft: &Draft) -> Result<Entry> {
        self.refresh()?;
        if kept == absorbed {
            return Err(Error::invalid("An entry cannot be merged with itself."));
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
        Ok(self.require(id)?.attachments().iter().map(|p| attachments::describe(&self.dir, p)).collect())
    }

    pub fn attachment_path(&self, relative: &str) -> Result<PathBuf> {
        attachments::absolute(&self.dir, relative)
    }

    /// A name for a file of this entry: `Nagy 1979 - The Best of the Achaeans`.
    fn file_name_for(entry: &Entry) -> String {
        let s = entry.summary();
        let mut name = String::new();
        let authors = s.authors.replace(" (ed.)", "").replace(" (eds.)", "");
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
        let index = *self.by_id.get(id).ok_or_else(|| Error::not_found("the reference"))?;
        let name = Self::file_name_for(&self.entries[index]);
        let stored = attachments::store_file(&self.dir, source, &name)?;
        self.link_file(index, stored)
    }

    /// Links a file that is already in the store.
    pub fn attach_stored(&mut self, id: &str, stored: &str) -> Result<Entry> {
        self.refresh()?;
        let index = *self.by_id.get(id).ok_or_else(|| Error::not_found("the reference"))?;
        let path = attachments::absolute(&self.dir, stored)?;
        if !path.is_file() {
            return Err(Error::not_found(format!("the stored file {stored}")));
        }
        self.link_file(index, stored.to_owned())
    }

    fn link_file(&mut self, index: usize, stored: String) -> Result<Entry> {
        if self.link_file_unsaved(index, stored) {
            self.save()?;
        }
        Ok(self.entries[index].clone())
    }

    fn link_file_unsaved(&mut self, index: usize, stored: String) -> bool {
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
        let index = *self.by_id.get(id).ok_or_else(|| Error::not_found("the reference"))?;
        let name = Self::file_name_for(&self.entries[index]);
        let stored = attachments::store_file(&self.dir, source, &name)?;
        Ok(self.link_file_unsaved(index, stored))
    }

    /// Unlinks a file from the entry. The file is deleted from the store when
    /// no other entry links to it.
    pub fn detach(&mut self, id: &str, stored: &str) -> Result<Entry> {
        self.refresh()?;
        let index = *self.by_id.get(id).ok_or_else(|| Error::not_found("the reference"))?;
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
        self.delete_file_if_unused(stored);
        Ok(result)
    }

    fn delete_file_if_unused(&self, stored: &str) {
        let used = self.entries.iter().any(|e| e.attachments().iter().any(|f| f == stored));
        if !used && let Err(e) = attachments::delete(&self.dir, stored) {
            tracing::warn!(%e, stored, "could not delete a stored file");
        }
    }

    /// The entries that link to content with this hash.
    pub fn entries_with_file_hash(&self, hash: &str) -> Vec<&Entry> {
        self.entries
            .iter()
            .filter(|e| e.attachments().iter().any(|f| attachments::hash_of_path(f) == Some(hash)))
            .collect()
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
            if with_files {
                let mut copy = e.clone();
                let absolute: Vec<String> = e
                    .attachments()
                    .iter()
                    .filter_map(|f| attachments::absolute(&self.dir, f).ok())
                    .map(|p| p.display().to_string())
                    .collect();
                copy.set_attachments(&absolute);
                out.push_str(&copy.to_bib(false, true));
            } else {
                out.push_str(&e.to_bib(false, false));
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
    if let Some(files) = raw.get("file") {
        entry.set("file", files.trim());
    }
    entry
}

/// Reads exactly one entry from source typed by the user.
pub fn draft_from_source(source: &str) -> Result<Draft> {
    let parsed = bib::parse(source);
    if let Some(w) = parsed.warnings.first() {
        return Err(Error::invalid(format!("Line {}: {}.", w.line, w.message)));
    }
    let mut entries = parsed.into_entries();
    match entries.len() {
        0 => Err(Error::invalid("There is no entry here. An entry begins with @ and its type, as in @book{key, …}.")),
        1 => Ok(Draft::from_raw(&entries.remove(0))),
        n => Err(Error::invalid(format!("There are {n} entries here; one is expected."))),
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
        assert!(lib.add(&draft("@book{nagy1979, title={Clash}}")).is_err());
        assert!(lib.add(&draft("@book{bad key, title={Clash}}")).is_err());

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

        assert_eq!(lib.remove(&[a.id.clone(), "nonsense".into()]).unwrap(), 1);
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
        lib.remove(std::slice::from_ref(&b.id)).unwrap();
        assert!(!lib.attachment_path(&stored).unwrap().exists());

        // An update from the form does not lose attachments.
        let a3 = lib.attach(&a.id, &pdf).unwrap();
        let d = Draft::from_entry(&a3);
        assert!(!d.fields.contains_key("file"));
        assert_eq!(lib.update(&a.id, &d).unwrap().attachments().len(), 1);
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
