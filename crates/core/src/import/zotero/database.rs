//! Reading Zotero's database without touching it.
//!
//! Zotero keeps `zotero.sqlite` locked for as long as it runs, and nothing
//! of Zotero's may ever be written to. So the database is copied to a
//! temporary directory and the copy is read. Where SQLite has something to
//! set right before it can read (a transaction Zotero had not finished), it
//! sets it right in the copy.

use std::collections::{BTreeMap, HashMap, HashSet};
use std::fs::{self, File};
use std::io::{self, Read, Seek, SeekFrom, Write};
use std::ops::Range;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

use rusqlite::types::ValueRef;
use rusqlite::{Connection, OpenFlags, Params, Row};

use crate::error::{Error, IoContext, Result};
use crate::tr;

pub(super) const DATABASE: &str = "zotero.sqlite";
/// The copy Zotero itself makes from time to time.
const BACKUP: &str = "zotero.sqlite.bak";
/// What SQLite keeps beside a database while it is being written to.
const COMPANIONS: [&str; 3] = ["-journal", "-wal", "-shm"];

/// The tables that must be there, with the columns read from them.
const REQUIRED: &[(&str, &[&str])] = &[
    ("libraries", &["libraryID", "type"]),
    ("items", &["itemID", "itemTypeID", "libraryID", "key"]),
    ("itemTypes", &["itemTypeID", "typeName"]),
    ("itemData", &["itemID", "fieldID", "valueID"]),
    ("itemDataValues", &["valueID", "value"]),
    ("fields", &["fieldID", "fieldName"]),
    ("creators", &["creatorID", "firstName", "lastName", "fieldMode"]),
    ("itemCreators", &["itemID", "creatorID", "creatorTypeID", "orderIndex"]),
    ("creatorTypes", &["creatorTypeID", "creatorType"]),
];

/// A table that can be done without, the columns read from it, and what is
/// then missing, in words.
type Optional = (&'static str, &'static [&'static str], fn() -> String);

/// The tables that can be done without.
const OPTIONAL: &[Optional] = &[
    ("deletedItems", &["itemID"], || tr!("core-import-zotero-no-bin")),
    ("collections", &["collectionID", "collectionName", "parentCollectionID", "libraryID", "key"], || {
        tr!("core-import-zotero-no-collections")
    }),
    ("collectionItems", &["collectionID", "itemID"], || tr!("core-import-zotero-no-collections")),
    ("itemAttachments", &["itemID", "parentItemID", "linkMode", "contentType", "path"], || {
        tr!("core-import-zotero-no-attachments")
    }),
    ("itemNotes", &["itemID", "parentItemID", "note"], || tr!("core-import-zotero-no-notes")),
    ("tags", &["tagID", "name"], || tr!("core-import-zotero-no-keywords")),
    ("itemTags", &["itemID", "tagID"], || tr!("core-import-zotero-no-keywords")),
    ("groups", &["libraryID", "name"], || tr!("core-import-zotero-no-group-names")),
];

pub(super) struct Library {
    pub id: i64,
    pub group: bool,
    pub name: String,
}

pub(super) struct Creator {
    /// As Zotero names it: `author`, `bookAuthor`, `seriesEditor`.
    pub role: String,
    pub first: String,
    pub last: String,
    /// The name is kept in one piece, as that of an institution is.
    pub single: bool,
}

pub(super) struct Item {
    pub id: i64,
    pub key: String,
    /// The type as Zotero names it: `journalArticle`, `bookSection`.
    pub kind: String,
    /// By the names Zotero gives its fields: `publicationTitle`, `abstractNote`.
    pub fields: BTreeMap<String, String>,
    pub creators: Vec<Creator>,
    pub tags: Vec<String>,
}

pub(super) struct Collection {
    pub id: i64,
    pub key: String,
    pub name: String,
    pub parent: Option<i64>,
}

pub(super) struct Attachment {
    pub parent: i64,
    /// The key of the attachment, which names its directory in `storage`.
    pub key: String,
    /// 0 and 1: a file in Zotero's storage. 2: a file elsewhere, linked to.
    /// 3: an address on the web, without a file.
    pub link_mode: i64,
    pub content_type: String,
    pub path: String,
}

pub(super) struct Note {
    pub parent: i64,
    pub html: String,
}

/// A copy of the database, open for reading.
pub(super) struct Database {
    /// Zotero's data directory, where `storage` is.
    pub dir: PathBuf,
    /// The file the copy was made from.
    source: PathBuf,
    conn: Connection,
    /// The tables of `OPTIONAL` that are there.
    tables: HashSet<&'static str>,
    /// Holds the copy, which goes when this goes.
    _copy: tempfile::TempDir,
}

/// The data directory and the database in it, from what was given: the
/// directory, or the database itself.
fn locate(path: &Path) -> Result<(PathBuf, PathBuf)> {
    if path.is_dir() {
        let file = path.join(DATABASE);
        if !file.is_file() && !path.join(BACKUP).is_file() {
            return Err(Error::not_found(tr!("core-import-zotero-no-database", file = DATABASE, path = path)));
        }
        return Ok((path.to_owned(), file));
    }
    if path.is_file() {
        let dir = path.parent().filter(|p| !p.as_os_str().is_empty()).unwrap_or(Path::new("."));
        return Ok((dir.to_owned(), path.to_owned()));
    }
    Err(Error::not_found(path.display().to_string()))
}

fn with_suffix(path: &Path, suffix: &str) -> PathBuf {
    let mut name = path.as_os_str().to_owned();
    name.push(suffix);
    PathBuf::from(name)
}

/// By these it is seen whether a file was written to while it was copied.
fn stamp(path: &Path) -> Option<(u64, Option<SystemTime>)> {
    let meta = fs::metadata(path).ok()?;
    Some((meta.len(), meta.modified().ok()))
}

/// The bytes SQLite takes its locks on: the pending byte, the reserved
/// byte and the 510 shared bytes, from 1 GiB on. On Windows these are
/// locked with `LockFileEx`, which forbids even reading them, and Zotero
/// holds them for as long as it runs, so a plain copy of a database longer
/// than 1 GiB fails there. SQLite never stores anything in the page that
/// holds them, the lock-byte page of its file format, so a copy with zeros
/// in their place is the same database.
const LOCK_BYTES: Range<u64> = 0x4000_0000..0x4000_0200;

/// How much is read at a time.
const CHUNK: usize = 1 << 16;

/// Copies what `source` holds into `target`, from the start of each, all
/// but `LOCK_BYTES`, which are never read and are zeros in the copy. A
/// chunk of zeros is passed over rather than written, so that a database
/// with much empty room costs the temporary directory only what it holds.
/// Says how long the copy is.
fn copy_content(source: &mut (impl Read + Seek), target: &mut File) -> io::Result<u64> {
    static ZEROS: [u8; CHUNK] = [0; CHUNK];
    let mut buffer = vec![0; CHUNK];
    let mut position = 0;
    loop {
        if LOCK_BYTES.contains(&position) {
            // Only as far as the file goes: a file that ends among the
            // lock bytes (no database does) is copied no longer than it is.
            let length = source.seek(SeekFrom::End(0))?;
            if length <= position {
                break;
            }
            position = length.min(LOCK_BYTES.end);
            source.seek(SeekFrom::Start(position))?;
            target.seek(SeekFrom::Start(position))?;
            continue;
        }
        // A read never reaches into the lock bytes.
        let room =
            if position < LOCK_BYTES.start { (LOCK_BYTES.start - position).min(CHUNK as u64) } else { CHUNK as u64 };
        let read = match source.read(&mut buffer[..room as usize]) {
            Ok(0) => break,
            Ok(read) => read,
            Err(e) if e.kind() == io::ErrorKind::Interrupted => continue,
            Err(e) => return Err(e),
        };
        if buffer[..read] == ZEROS[..read] {
            target.seek(SeekFrom::Current(read as i64))?;
        } else {
            target.write_all(&buffer[..read])?;
        }
        position += read as u64;
    }
    // What was passed over at the end is there only once the length is set.
    target.set_len(position)?;
    Ok(position)
}

/// Whether reading failed because another process holds the bytes locked:
/// on Windows, ERROR_SHARING_VIOLATION or ERROR_LOCK_VIOLATION. Elsewhere
/// SQLite's locks do not stop a reader.
fn locked(error: &io::Error) -> bool {
    cfg!(windows) && matches!(error.raw_os_error(), Some(32 | 33))
}

/// Whether the error is that of a database Zotero holds locked.
fn locked_database(error: &Error) -> bool {
    matches!(error, Error::Io { source, .. } if locked(source))
}

/// Copies the content only. `fs::copy` would copy the permissions too, and
/// a copy that cannot be written to cannot be set right by SQLite.
fn copy_file(from: &Path, to: &Path) -> Result<()> {
    let context = || tr!("core-import-zotero-copying", path = from);
    let mut source = File::open(from).context(context)?;
    let mut target = File::create(to).context(context)?;
    copy_content(&mut source, &mut target).map_err(|source| {
        // Should Zotero hold more than SQLite's lock bytes, the one who
        // imports is told what lets the database be read.
        let context = if locked(&source) { tr!("core-import-zotero-locked", path = from) } else { context() };
        Error::io(context, source)
    })?;
    Ok(())
}

/// Copies the database and what SQLite keeps beside it. Says whether there
/// was anything beside it, and whether Zotero wrote to the files meanwhile.
fn copy_database(file: &Path, target: &Path) -> Result<(bool, bool)> {
    let files = || std::iter::once(file.to_owned()).chain(COMPANIONS.iter().map(|suffix| with_suffix(file, suffix)));
    let stamps = || files().map(|f| stamp(&f)).collect::<Vec<_>>();
    let mut attempts = 0;
    loop {
        attempts += 1;
        let before = stamps();
        let mut companions = false;
        copy_file(file, target)?;
        for suffix in COMPANIONS {
            let (from, to) = (with_suffix(file, suffix), with_suffix(target, suffix));
            // One that is there one moment may be gone the next.
            let _ = fs::remove_file(&to);
            if from.is_file() && copy_file(&from, &to).is_ok() {
                companions = true;
            }
        }
        let disturbed = before != stamps();
        if !disturbed || attempts == 3 {
            return Ok((companions, disturbed));
        }
    }
}

impl Database {
    fn error(&self) -> impl Fn(rusqlite::Error) -> Error + '_ {
        |e| Error::Parse { path: self.source.clone(), message: e.to_string() }
    }

    fn open(dir: &Path, file: &Path, warnings: &mut Vec<String>) -> Result<Self> {
        let copy =
            tempfile::Builder::new().prefix("glaukopis-zotero-").tempdir().context(|| tr!("io-creating-temporary"))?;
        let target = copy.path().join(DATABASE);
        let (companions, disturbed) = copy_database(file, &target)?;
        // To SQLite an empty file is a database with nothing in it.
        if fs::metadata(&target).map(|meta| meta.len() == 0).unwrap_or(true) {
            return Err(Error::Parse { path: file.to_owned(), message: tr!("core-import-zotero-empty") });
        }
        if disturbed {
            warnings.push(tr!("core-import-zotero-disturbed"));
        }
        let error = |e: rusqlite::Error| Error::Parse { path: file.to_owned(), message: e.to_string() };

        // A journal that came along belongs to a transaction Zotero had not
        // finished. Opened for writing, SQLite undoes it: in the copy.
        if companions {
            let conn = Connection::open_with_flags(
                &target,
                OpenFlags::SQLITE_OPEN_READ_WRITE | OpenFlags::SQLITE_OPEN_NO_MUTEX,
            )
            .map_err(error)?;
            conn.query_row("SELECT count(*) FROM sqlite_master", [], |_| Ok(())).map_err(error)?;
            conn.close().map_err(|(_, e)| error(e))?;
        }

        let conn =
            Connection::open_with_flags(&target, OpenFlags::SQLITE_OPEN_READ_ONLY | OpenFlags::SQLITE_OPEN_NO_MUTEX)
                .map_err(error)?;
        let mut database =
            Database { dir: dir.to_owned(), source: file.to_owned(), conn, tables: HashSet::new(), _copy: copy };
        database.check(warnings)?;
        Ok(database)
    }

    /// The columns of a table. None when there is no such table.
    fn columns(&self, table: &str) -> Result<Option<HashSet<String>>> {
        let mut statement = self.conn.prepare("SELECT name FROM pragma_table_info(?1)").map_err(self.error())?;
        let names = statement
            .query_map([table], |row| Ok(text(row, 0)))
            .and_then(|rows| rows.collect::<rusqlite::Result<HashSet<String>>>())
            .map_err(self.error())?;
        Ok((!names.is_empty()).then_some(names))
    }

    /// The version of Zotero's scheme for the user's data, for messages.
    fn version(&self) -> Option<String> {
        self.conn
            .query_row("SELECT version FROM version WHERE schema = 'userdata'", [], |row| Ok(text(row, 0)))
            .ok()
            .filter(|v| !v.is_empty())
    }

    /// Sees that the database is one of Zotero's, in the form known here.
    fn check(&mut self, warnings: &mut Vec<String>) -> Result<()> {
        if self.columns("items")?.is_none() {
            return Err(Error::invalid(tr!("core-import-zotero-not-a-database", path = &self.source)));
        }
        let lacking = |what: String, version: Option<String>| {
            Error::invalid(match version {
                Some(version) => tr!("core-import-zotero-unreadable-version", version = version, what = what),
                None => tr!("core-import-zotero-unreadable", what = what),
            })
        };
        for (table, wanted) in REQUIRED {
            let Some(columns) = self.columns(table)? else {
                return Err(lacking(tr!("core-import-zotero-no-table", table = *table), self.version()));
            };
            if let Some(column) = wanted.iter().find(|c| !columns.contains(**c)) {
                return Err(lacking(
                    tr!("core-import-zotero-no-column", table = *table, column = *column),
                    self.version(),
                ));
            }
        }
        // What is lacking is said once, though several tables may lack for it.
        let mut said: Vec<String> = Vec::new();
        for (table, wanted, consequence) in OPTIONAL {
            match self.columns(table)? {
                Some(columns) if wanted.iter().all(|c| columns.contains(*c)) => {
                    self.tables.insert(*table);
                }
                _ => {
                    let consequence = consequence();
                    if !said.contains(&consequence) {
                        warnings.push(tr!(
                            "core-import-zotero-no-optional",
                            table = *table,
                            consequence = &consequence
                        ));
                        said.push(consequence);
                    }
                }
            }
        }
        // Deleted collections have a table of their own since Zotero 7.
        if self.columns("deletedCollections")?.is_some_and(|c| c.contains("collectionID")) {
            self.tables.insert("deletedCollections");
        }
        Ok(())
    }

    fn has(&self, tables: &[&str]) -> bool {
        tables.iter().all(|t| self.tables.contains(t))
    }

    /// The condition by which items in the bin are left out.
    fn not_deleted(&self, column: &str) -> String {
        if self.has(&["deletedItems"]) {
            format!("{column} NOT IN (SELECT itemID FROM deletedItems)")
        } else {
            "1".to_owned()
        }
    }

    /// Runs a query and gathers what `read` makes of each row.
    fn rows<T>(&self, sql: &str, params: impl Params, read: impl Fn(&Row) -> T) -> Result<Vec<T>> {
        let mut statement = self.conn.prepare(sql).map_err(self.error())?;
        statement
            .query_map(params, |row| Ok(read(row)))
            .and_then(|rows| rows.collect::<rusqlite::Result<Vec<T>>>())
            .map_err(self.error())
    }

    /// The user's own library and those of groups. Feeds are not libraries
    /// of references.
    pub(super) fn libraries(&self) -> Result<Vec<Library>> {
        let sql = if self.has(&["groups"]) {
            "SELECT l.libraryID, l.type, g.name FROM libraries l \
             LEFT JOIN groups g ON g.libraryID = l.libraryID \
             WHERE l.type IN ('user', 'group') \
             ORDER BY l.type = 'group', g.name COLLATE NOCASE, l.libraryID"
        } else {
            "SELECT libraryID, type, NULL FROM libraries \
             WHERE type IN ('user', 'group') ORDER BY type = 'group', libraryID"
        };
        let found = self.rows(sql, [], |row| (integer(row, 0), text(row, 1), text(row, 2)))?;
        Ok(found
            .into_iter()
            .filter_map(|(id, kind, name)| {
                let id = id?;
                let group = kind == "group";
                let name = match (group, name.trim()) {
                    (false, _) => tr!("core-import-zotero-my-library"),
                    (true, "") => tr!("core-import-zotero-group", id = id),
                    (true, name) => name.to_owned(),
                };
                Some(Library { id, group, name })
            })
            .collect())
    }

    /// The condition by which an item is a reference, and not a file, a
    /// note or a mark in a file, and is not in the bin.
    fn is_reference(&self) -> String {
        format!(
            "COALESCE(t.typeName, '') NOT IN ('attachment', 'note', 'annotation') AND {}",
            self.not_deleted("i.itemID")
        )
    }

    /// The numbers of the references a library holds.
    pub(super) fn references(&self, library: i64) -> Result<HashSet<i64>> {
        let sql = format!(
            "SELECT i.itemID FROM items i LEFT JOIN itemTypes t ON t.itemTypeID = i.itemTypeID \
             WHERE i.libraryID = ?1 AND {}",
            self.is_reference()
        );
        Ok(self.rows(&sql, [library], |row| integer(row, 0))?.into_iter().flatten().collect())
    }

    /// The references of a library, in the order in which they were added.
    pub(super) fn items(&self, library: i64) -> Result<Vec<Item>> {
        let sql = format!(
            "SELECT i.itemID, i.key, t.typeName FROM items i \
             LEFT JOIN itemTypes t ON t.itemTypeID = i.itemTypeID \
             WHERE i.libraryID = ?1 AND {} ORDER BY i.itemID",
            self.is_reference()
        );
        let mut items: Vec<Item> = self
            .rows(&sql, [library], |row| (integer(row, 0), text(row, 1), text(row, 2)))?
            .into_iter()
            .filter_map(|(id, key, kind)| {
                Some(Item { id: id?, key, kind, fields: BTreeMap::new(), creators: Vec::new(), tags: Vec::new() })
            })
            .collect();
        let position: HashMap<i64, usize> = items.iter().enumerate().map(|(n, item)| (item.id, n)).collect();

        let values = self.rows(
            "SELECT d.itemID, f.fieldName, v.value FROM itemData d \
             JOIN items i ON i.itemID = d.itemID \
             JOIN fields f ON f.fieldID = d.fieldID \
             JOIN itemDataValues v ON v.valueID = d.valueID \
             WHERE i.libraryID = ?1",
            [library],
            |row| (integer(row, 0), text(row, 1), text(row, 2)),
        )?;
        for (id, field, value) in values {
            if let Some(&n) = id.and_then(|id| position.get(&id))
                && !field.is_empty()
                && !value.trim().is_empty()
            {
                items[n].fields.insert(field, value);
            }
        }

        let creators = self.rows(
            "SELECT c.itemID, t.creatorType, p.firstName, p.lastName, p.fieldMode FROM itemCreators c \
             JOIN items i ON i.itemID = c.itemID \
             JOIN creators p ON p.creatorID = c.creatorID \
             LEFT JOIN creatorTypes t ON t.creatorTypeID = c.creatorTypeID \
             WHERE i.libraryID = ?1 ORDER BY c.itemID, c.orderIndex",
            [library],
            |row| {
                let creator = Creator {
                    role: text(row, 1),
                    first: text(row, 2),
                    last: text(row, 3),
                    single: integer(row, 4) == Some(1),
                };
                (integer(row, 0), creator)
            },
        )?;
        for (id, creator) in creators {
            if let Some(&n) = id.and_then(|id| position.get(&id)) {
                items[n].creators.push(creator);
            }
        }

        if self.has(&["tags", "itemTags"]) {
            let tags = self.rows(
                "SELECT x.itemID, t.name FROM itemTags x \
                 JOIN items i ON i.itemID = x.itemID \
                 JOIN tags t ON t.tagID = x.tagID \
                 WHERE i.libraryID = ?1 ORDER BY x.itemID, t.name COLLATE NOCASE",
                [library],
                |row| (integer(row, 0), text(row, 1)),
            )?;
            for (id, tag) in tags {
                if let Some(&n) = id.and_then(|id| position.get(&id)) {
                    items[n].tags.push(tag);
                }
            }
        }
        Ok(items)
    }

    /// The collections of a library that are not in the bin, nor within one
    /// that is.
    pub(super) fn collections(&self, library: i64) -> Result<Vec<Collection>> {
        if !self.has(&["collections", "collectionItems"]) {
            return Ok(Vec::new());
        }
        let all: Vec<Collection> = self
            .rows(
                "SELECT collectionID, key, collectionName, parentCollectionID FROM collections \
                 WHERE libraryID = ?1 ORDER BY collectionName COLLATE NOCASE, collectionID",
                [library],
                |row| (integer(row, 0), text(row, 1), text(row, 2), integer(row, 3)),
            )?
            .into_iter()
            .filter_map(|(id, key, name, parent)| Some(Collection { id: id?, key, name, parent }))
            .collect();
        if !self.has(&["deletedCollections"]) {
            return Ok(all);
        }
        let deleted: HashSet<i64> = self
            .rows("SELECT collectionID FROM deletedCollections", [], |row| integer(row, 0))?
            .into_iter()
            .flatten()
            .collect();
        let parents: HashMap<i64, Option<i64>> = all.iter().map(|c| (c.id, c.parent)).collect();
        let in_bin = |id: i64| {
            let mut at = Some(id);
            // No tree of collections is deeper than it has collections.
            for _ in 0..=parents.len() {
                match at {
                    Some(id) if deleted.contains(&id) => return true,
                    Some(id) => at = parents.get(&id).copied().flatten(),
                    None => return false,
                }
            }
            false
        };
        Ok(all.into_iter().filter(|c| !in_bin(c.id)).collect())
    }

    /// Which item is in which collection: pairs of collection and item.
    pub(super) fn memberships(&self, library: i64) -> Result<Vec<(i64, i64)>> {
        if !self.has(&["collections", "collectionItems"]) {
            return Ok(Vec::new());
        }
        let pairs = self.rows(
            "SELECT x.collectionID, x.itemID FROM collectionItems x \
             JOIN collections c ON c.collectionID = x.collectionID \
             WHERE c.libraryID = ?1 ORDER BY x.collectionID, x.itemID",
            [library],
            |row| (integer(row, 0), integer(row, 1)),
        )?;
        Ok(pairs.into_iter().filter_map(|(collection, item)| Some((collection?, item?))).collect())
    }

    /// The files attached to references, without those in the bin.
    pub(super) fn attachments(&self, library: i64) -> Result<Vec<Attachment>> {
        if !self.has(&["itemAttachments"]) {
            return Ok(Vec::new());
        }
        let sql = format!(
            "SELECT a.parentItemID, i.key, a.linkMode, a.contentType, a.path FROM itemAttachments a \
             JOIN items i ON i.itemID = a.itemID \
             WHERE i.libraryID = ?1 AND a.parentItemID IS NOT NULL AND {} ORDER BY a.itemID",
            self.not_deleted("a.itemID")
        );
        let found = self.rows(&sql, [library], |row| {
            (integer(row, 0), text(row, 1), integer(row, 2), text(row, 3), text(row, 4))
        })?;
        Ok(found
            .into_iter()
            .filter_map(|(parent, key, link_mode, content_type, path)| {
                Some(Attachment { parent: parent?, key, link_mode: link_mode.unwrap_or(0), content_type, path })
            })
            .collect())
    }

    /// The notes kept under references, without those in the bin.
    pub(super) fn notes(&self, library: i64) -> Result<Vec<Note>> {
        if !self.has(&["itemNotes"]) {
            return Ok(Vec::new());
        }
        let sql = format!(
            "SELECT n.parentItemID, n.note FROM itemNotes n \
             JOIN items i ON i.itemID = n.itemID \
             WHERE i.libraryID = ?1 AND n.parentItemID IS NOT NULL AND {} ORDER BY n.itemID",
            self.not_deleted("n.itemID")
        );
        let found = self.rows(&sql, [library], |row| (integer(row, 0), text(row, 1)))?;
        Ok(found.into_iter().filter_map(|(parent, html)| Some(Note { parent: parent?, html })).collect())
    }

    /// How many files and notes stand alone in a library, under no
    /// reference. They are not imported, which the user should be told.
    pub(super) fn count_alone(&self, library: i64) -> Result<usize> {
        let mut count = 0;
        // Files as `is_file` takes them: a snapshot of a web page is none.
        let files = "x.linkMode IN (0, 1, 2) AND TRIM(COALESCE(x.path, '')) <> '' \
                     AND NOT (x.linkMode = 1 AND LOWER(TRIM(COALESCE(x.contentType, ''))) \
                     IN ('text/html', 'application/xhtml+xml'))";
        for (table, condition) in [("itemAttachments", files), ("itemNotes", "1")] {
            if !self.has(&[table]) {
                continue;
            }
            // A file has a row for its note as well, which is not a note standing alone.
            let sql = format!(
                "SELECT COUNT(*) FROM {table} x JOIN items i ON i.itemID = x.itemID \
                 JOIN itemTypes t ON t.itemTypeID = i.itemTypeID \
                 WHERE i.libraryID = ?1 AND x.parentItemID IS NULL AND {condition} \
                 AND t.typeName = '{}' AND {}",
                if table == "itemNotes" { "note" } else { "attachment" },
                self.not_deleted("x.itemID")
            );
            count += self.rows(&sql, [library], |row| integer(row, 0))?.into_iter().flatten().sum::<i64>();
        }
        Ok(count.max(0) as usize)
    }
}

/// A value as text, whatever SQLite holds it as. Zotero's values have no
/// declared type: a volume may be kept as the number 12.
fn text(row: &Row, column: usize) -> String {
    match row.get_ref(column) {
        Ok(ValueRef::Text(bytes)) | Ok(ValueRef::Blob(bytes)) => String::from_utf8_lossy(bytes).into_owned(),
        Ok(ValueRef::Integer(n)) => n.to_string(),
        Ok(ValueRef::Real(n)) => n.to_string(),
        Ok(ValueRef::Null) | Err(_) => String::new(),
    }
}

fn integer(row: &Row, column: usize) -> Option<i64> {
    match row.get_ref(column) {
        Ok(ValueRef::Integer(n)) => Some(n),
        Ok(ValueRef::Text(bytes)) => std::str::from_utf8(bytes).ok()?.trim().parse().ok(),
        _ => None,
    }
}

/// Runs `work` on a copy of the database. When the database cannot be read
/// and Zotero's own backup of it can, the backup is read, with a warning.
/// The second value holds the warnings.
pub(super) fn with_database<T>(
    path: &Path,
    work: impl Fn(&Database, &mut Vec<String>) -> Result<T>,
) -> Result<(T, Vec<String>)> {
    let (dir, file) = locate(path)?;
    let attempt = |file: &Path| {
        let mut warnings = Vec::new();
        let database = Database::open(&dir, file, &mut warnings)?;
        let value = work(&database, &mut warnings)?;
        Ok((value, warnings))
    };
    let error = match attempt(&file) {
        Ok(done) => return Ok(done),
        Err(e) => e,
    };
    // Only a database that cannot be read sends us to the backup. An answer
    // such as "there is no such collection" would be the same there.
    let backup = dir.join(BACKUP);
    if !matches!(error, Error::Io { .. } | Error::Parse { .. }) || backup == file || !backup.is_file() {
        return Err(error);
    }
    match attempt(&backup) {
        Ok((value, mut warnings)) => {
            let warning = if locked_database(&error) {
                tr!("core-import-zotero-backup-read-locked", backup = BACKUP)
            } else {
                tr!("core-import-zotero-backup-read", error = error.to_string(), backup = BACKUP)
            };
            warnings.insert(0, warning);
            Ok((value, warnings))
        }
        Err(_) => Err(error),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The data of the file `Locked` stands for; zeros elsewhere.
    fn regions() -> [Range<u64>; 3] {
        [0..2 * CHUNK as u64, LOCK_BYTES.start - CHUNK as u64 - 7..LOCK_BYTES.start, LOCK_BYTES.end..u64::MAX]
    }

    /// A file as long as asked, which holds data near its start, just
    /// before the lock bytes and after them, and zeros elsewhere, the way
    /// a sparse file does. Like a database Zotero holds open on Windows, it
    /// fails a read that reaches into the lock bytes.
    struct Locked {
        length: u64,
        position: u64,
    }

    /// What `Locked` holds from `start` on, as far as `buffer` goes.
    fn fill(start: u64, buffer: &mut [u8]) {
        buffer.fill(0);
        let end = start + buffer.len() as u64;
        for region in regions() {
            for position in region.start.max(start)..region.end.min(end) {
                buffer[(position - start) as usize] = (position % 251) as u8 | 1;
            }
        }
    }

    impl Read for Locked {
        fn read(&mut self, buffer: &mut [u8]) -> io::Result<usize> {
            let count = self.length.saturating_sub(self.position).min(buffer.len() as u64);
            let asked = self.position..self.position + count;
            if asked.start < LOCK_BYTES.end && LOCK_BYTES.start < asked.end {
                return Err(io::Error::other("another process has locked a portion of the file"));
            }
            fill(self.position, &mut buffer[..count as usize]);
            self.position += count;
            Ok(count as usize)
        }
    }

    impl Seek for Locked {
        fn seek(&mut self, to: SeekFrom) -> io::Result<u64> {
            self.position = match to {
                SeekFrom::Start(n) => n,
                SeekFrom::End(n) => self.length.checked_add_signed(n).unwrap(),
                SeekFrom::Current(n) => self.position.checked_add_signed(n).unwrap(),
            };
            Ok(self.position)
        }
    }

    /// Copies a file of the given length and checks the copy byte by byte:
    /// the same as the source, with zeros in place of the lock bytes.
    fn copied_whole_but_the_lock_bytes(length: u64) {
        let mut target = tempfile::tempfile().unwrap();
        let copied = copy_content(&mut Locked { length, position: 0 }, &mut target).unwrap();
        assert_eq!(copied, length);
        assert_eq!(target.metadata().unwrap().len(), length);

        target.seek(SeekFrom::Start(0)).unwrap();
        let (mut got, mut wanted) = (vec![0; CHUNK], vec![0; CHUNK]);
        let mut position = 0;
        while position < length {
            let count = (length - position).min(CHUNK as u64) as usize;
            target.read_exact(&mut got[..count]).unwrap();
            fill(position, &mut wanted[..count]);
            let end = position + count as u64;
            let (from, to) = (LOCK_BYTES.start.clamp(position, end), LOCK_BYTES.end.clamp(position, end));
            wanted[(from - position) as usize..(to - position) as usize].fill(0);
            assert!(got[..count] == wanted[..count], "the copy differs within {position}..+{count}");
            position += count as u64;
        }
        assert_eq!(target.read(&mut got).unwrap(), 0);
    }

    #[test]
    fn a_database_longer_than_a_gibibyte_is_copied_around_the_lock_bytes() {
        // Data on both sides of the lock-byte page, a length that is no
        // multiple of the chunk, and zeros between that are passed over.
        copied_whole_but_the_lock_bytes(LOCK_BYTES.end + 3 * CHUNK as u64 + 100);
        // Before them the copy is that of any file.
        copied_whole_but_the_lock_bytes(LOCK_BYTES.start);
        copied_whole_but_the_lock_bytes(3 * CHUNK as u64 + 5);
        // A file that ends among them is copied no longer than it is.
        copied_whole_but_the_lock_bytes(LOCK_BYTES.start + 100);
    }
}
