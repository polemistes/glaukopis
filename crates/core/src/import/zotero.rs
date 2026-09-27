//! Importing from Zotero.
//!
//! What is read is Zotero's data directory: the database `zotero.sqlite` and
//! the attached files beside it in `storage`. Nothing of Zotero's is written
//! to, and Zotero may be running: the database is copied and the copy is
//! read (see `database`).
//!
//! Every reference of a library becomes a candidate. How the types and
//! fields of Zotero become those of BibLaTeX is in `mapping`.

mod database;
mod dates;
mod extra;
mod mapping;
mod markup;
mod places;
mod text;

use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::error::{Error, Result};

use super::Candidate;
use database::{Attachment, Collection, Database};

/// Places where a Zotero data directory is usually found on this system,
/// those that exist. Where the user has told Zotero to keep its data
/// elsewhere, that place comes first.
pub fn find() -> Vec<PathBuf> {
    places::find()
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum LibraryKind {
    /// The user's own library.
    User,
    /// The library of a group the user is a member of.
    Group,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ZoteroLibrary {
    /// Zotero's number for the library, by which `Options` names it.
    pub id: i64,
    pub name: String,
    pub kind: LibraryKind,
    /// The references in it.
    pub items: usize,
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ZoteroInfo {
    /// The data directory.
    pub path: String,
    /// References in all the libraries. Files, notes and what is in
    /// Zotero's bin are not counted.
    pub items: usize,
    /// Files attached to references, without snapshots of web pages.
    pub attachments: usize,
    pub collections: usize,
    pub libraries: Vec<ZoteroLibrary>,
    /// What was amiss with the database, if anything.
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ZoteroCollection {
    /// Zotero's key for the collection, by which `Options` names it.
    pub key: String,
    pub name: String,
    /// The names from the top collection down to this one.
    pub path: Vec<String>,
    /// The references in it, not counting those in collections within it.
    pub items: usize,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Options {
    /// The library to read, by Zotero's number for it. None: the user's own.
    pub library: Option<i64>,
    /// Whether the attached files are taken along.
    pub attachments: bool,
    /// Whether the notes kept under a reference go into its `annotation`.
    pub notes: bool,
    /// Only this collection, named by Zotero's key for it, and those within it.
    pub collection: Option<String>,
}

/// What a directory holds, without importing anything. `dir` is the data
/// directory, or the database in it.
pub fn inspect(dir: &Path) -> Result<ZoteroInfo> {
    let (mut info, warnings) = database::with_database(dir, |db, _| {
        let mut info = ZoteroInfo { path: db.dir.display().to_string(), ..Default::default() };
        for library in db.libraries()? {
            let references = db.references(library.id)?;
            info.items += references.len();
            info.attachments +=
                db.attachments(library.id)?.iter().filter(|a| is_file(a) && references.contains(&a.parent)).count();
            info.collections += db.collections(library.id)?.len();
            info.libraries.push(ZoteroLibrary {
                id: library.id,
                name: library.name,
                kind: if library.group { LibraryKind::Group } else { LibraryKind::User },
                items: references.len(),
            });
        }
        Ok(info)
    })?;
    info.warnings = warnings;
    Ok(info)
}

/// The collections of a library, each after the one it is in, for choosing
/// one to import. None: the user's own library.
pub fn collections(dir: &Path, library: Option<i64>) -> Result<Vec<ZoteroCollection>> {
    let (found, _) = database::with_database(dir, |db, _| {
        let library = library_of(db, library)?;
        let references = db.references(library.id)?;
        let mut counts: HashMap<i64, usize> = HashMap::new();
        for (collection, item) in db.memberships(library.id)? {
            if references.contains(&item) {
                *counts.entry(collection).or_default() += 1;
            }
        }
        let tree = Tree::new(db.collections(library.id)?);
        let mut found: Vec<ZoteroCollection> = tree
            .collections
            .iter()
            .map(|c| ZoteroCollection {
                key: c.key.clone(),
                name: c.name.clone(),
                path: tree.path(c.id),
                items: counts.get(&c.id).copied().unwrap_or(0),
            })
            .collect();
        found.sort_by_cached_key(|c| c.path.iter().map(|name| name.to_lowercase()).collect::<Vec<_>>());
        Ok(found)
    })?;
    Ok(found)
}

/// Reads the references of a Zotero library as candidates for import. The
/// second value holds warnings. `dir` is the data directory, or the
/// database in it.
pub fn read(dir: &Path, options: &Options) -> Result<(Vec<Candidate>, Vec<String>)> {
    let bases = places::linked_file_bases();
    database::with_database(dir, |db, warnings| candidates(db, options, &bases, warnings))
}

fn library_of(db: &Database, wanted: Option<i64>) -> Result<database::Library> {
    let found = db.libraries()?.into_iter().find(|library| match wanted {
        Some(id) => library.id == id,
        None => !library.group,
    });
    found.ok_or_else(|| match wanted {
        Some(id) => Error::not_found(format!("the library {id} in Zotero")),
        None => Error::not_found("the user’s own library in Zotero"),
    })
}

/// The collections of a library as the tree they form.
struct Tree {
    collections: Vec<Collection>,
    by_id: HashMap<i64, usize>,
}

impl Tree {
    fn new(collections: Vec<Collection>) -> Self {
        let by_id = collections.iter().enumerate().map(|(n, c)| (c.id, n)).collect();
        Tree { collections, by_id }
    }

    /// The names from the top down to a collection. Empty for one that is
    /// not there.
    fn path(&self, id: i64) -> Vec<String> {
        let mut path = Vec::new();
        let mut passed = Vec::new();
        let mut at = self.by_id.get(&id);
        while let Some(&n) = at {
            // A damaged database may have a collection that is within itself.
            if passed.contains(&n) {
                break;
            }
            passed.push(n);
            let collection = &self.collections[n];
            path.insert(0, collection.name.trim().to_owned());
            at = collection.parent.and_then(|parent| self.by_id.get(&parent));
        }
        path
    }

    /// A collection, named by its key, and all those within it.
    fn within(&self, key: &str) -> Option<HashSet<i64>> {
        let top = self.collections.iter().find(|c| c.key.eq_ignore_ascii_case(key.trim()))?;
        let mut found = HashSet::from([top.id]);
        loop {
            let more: Vec<i64> = self
                .collections
                .iter()
                .filter(|c| !found.contains(&c.id) && c.parent.is_some_and(|parent| found.contains(&parent)))
                .map(|c| c.id)
                .collect();
            if more.is_empty() {
                return Some(found);
            }
            found.extend(more);
        }
    }
}

/// Whether an attachment is a file to take along. Snapshots of web pages
/// are left behind: they are copies of what the address leads to, in many
/// files or in one that only a browser shows. Links to the web have no
/// file, and of a file without a path there is nothing to be said.
fn is_file(attachment: &Attachment) -> bool {
    let kind = attachment.content_type.trim().to_ascii_lowercase();
    matches!(attachment.link_mode, 0..=2)
        && !attachment.path.trim().is_empty()
        && !matches!(kind.as_str(), "text/html" | "application/xhtml+xml")
}

/// Where the file of an attachment is. `Err` holds what to tell the user
/// when it is not there.
fn file_of(dir: &Path, attachment: &Attachment, bases: &[PathBuf]) -> std::result::Result<PathBuf, String> {
    let path = attachment.path.trim();
    let missing = |name: &str| format!("The file “{name}” was not found.");
    if let Some(name) = path.strip_prefix("storage:") {
        // Zotero keeps each file in a directory named by the key of the attachment.
        let file = dir.join("storage").join(&attachment.key).join(name);
        let plain = !name.is_empty() && !name.contains(['/', '\\']) && name != "..";
        return if plain && file.is_file() { Ok(file) } else { Err(missing(name)) };
    }
    if let Some(relative) = path.strip_prefix("attachments:") {
        return bases.iter().map(|base| base.join(relative)).find(|file| file.is_file()).ok_or_else(|| {
            format!(
                "The file “{relative}” was not found. Zotero links to it from a directory of its own choosing, \
                 which is not known here."
            )
        });
    }
    let file = PathBuf::from(path);
    if file.is_absolute() && file.is_file() { Ok(file) } else { Err(missing(path)) }
}

fn candidates(
    db: &Database,
    options: &Options,
    bases: &[PathBuf],
    warnings: &mut Vec<String>,
) -> Result<Vec<Candidate>> {
    let library = library_of(db, options.library)?;
    let tree = Tree::new(db.collections(library.id)?);
    let within = match &options.collection {
        Some(key) => Some(tree.within(key).ok_or_else(|| Error::not_found(format!("the collection {key} in Zotero")))?),
        None => None,
    };

    // For each item, the collections it is in.
    let mut places: HashMap<i64, Vec<Vec<String>>> = HashMap::new();
    for (collection, item) in db.memberships(library.id)? {
        if within.as_ref().is_some_and(|within| !within.contains(&collection)) {
            continue;
        }
        let path = tree.path(collection);
        let paths = places.entry(item).or_default();
        if !path.is_empty() && !paths.contains(&path) {
            paths.push(path);
        }
    }

    let mut attached: HashMap<i64, Vec<Attachment>> = HashMap::new();
    if options.attachments {
        for attachment in db.attachments(library.id)?.into_iter().filter(is_file) {
            attached.entry(attachment.parent).or_default().push(attachment);
        }
    }
    let mut remarks: HashMap<i64, Vec<String>> = HashMap::new();
    if options.notes {
        for note in db.notes(library.id)? {
            let words = text::paragraphs(&markup::plain(&note.html));
            if !words.is_empty() {
                remarks.entry(note.parent).or_default().push(words);
            }
        }
    }

    let mut out = Vec::new();
    for item in db.items(library.id)? {
        if within.is_some() && !places.contains_key(&item.id) {
            continue;
        }
        let attached = attached.remove(&item.id).unwrap_or_default();
        let remarks = remarks.remove(&item.id).unwrap_or_default();
        if item.fields.is_empty() && item.creators.is_empty() && attached.is_empty() && remarks.is_empty() {
            warnings.push(format!("The item {} in Zotero is empty and was left out.", item.key));
            continue;
        }

        let (mut draft, mut notes) = mapping::entry(&item);
        if !remarks.is_empty() && !draft.fields.contains_key("annotation") {
            draft.fields.insert("annotation".into(), remarks.join("\n\n"));
        }
        let mut files = Vec::new();
        for attachment in &attached {
            match file_of(&db.dir, attachment, bases) {
                Ok(file) => {
                    let file = file.display().to_string();
                    if !files.contains(&file) {
                        files.push(file);
                    }
                }
                Err(note) => notes.push(note),
            }
        }
        let mut collections = places.remove(&item.id).unwrap_or_default();
        collections.sort();

        out.push(Candidate { draft, files, origin: format!("Zotero, {}", item.key), collections, notes });
    }

    if within.is_none() {
        let alone = db.count_alone(library.id)?;
        if alone > 0 {
            warnings.push(format!(
                "{alone} {} in Zotero under no reference, and {} left out.",
                if alone == 1 { "file or note stands" } else { "files and notes stand" },
                if alone == 1 { "was" } else { "were" },
            ));
        }
    }
    Ok(out)
}

#[cfg(test)]
mod tests;
