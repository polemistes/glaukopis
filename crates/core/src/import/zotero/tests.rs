//! Tests of the import as a whole, on a database built the way Zotero
//! builds its own.

use std::fs;
use std::path::{Path, PathBuf};

use rusqlite::{Connection, params};

use super::*;
use crate::bib::names::Person;
use crate::library::entry::{Draft, FIELD_ZOTERO};

/// The tables that are read, as Zotero's `userdata.sql` and `system.sql`
/// define them.
const SCHEMA: &str = "
CREATE TABLE version (schema TEXT PRIMARY KEY, version INT NOT NULL);
CREATE TABLE libraries (
    libraryID INTEGER PRIMARY KEY,
    type TEXT NOT NULL,
    editable INT NOT NULL,
    filesEditable INT NOT NULL,
    version INT NOT NULL DEFAULT 0,
    storageVersion INT NOT NULL DEFAULT 0,
    lastSync INT NOT NULL DEFAULT 0,
    archived INT NOT NULL DEFAULT 0
);
CREATE TABLE groups (
    groupID INTEGER PRIMARY KEY,
    libraryID INT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    version INT NOT NULL,
    FOREIGN KEY (libraryID) REFERENCES libraries(libraryID) ON DELETE CASCADE
);
CREATE TABLE itemTypes (
    itemTypeID INTEGER PRIMARY KEY,
    typeName TEXT,
    templateItemTypeID INT,
    display INT DEFAULT 1
);
CREATE TABLE fields (
    fieldID INTEGER PRIMARY KEY,
    fieldName TEXT,
    fieldFormatID INT
);
CREATE TABLE creatorTypes (
    creatorTypeID INTEGER PRIMARY KEY,
    creatorType TEXT
);
CREATE TABLE items (
    itemID INTEGER PRIMARY KEY,
    itemTypeID INT NOT NULL,
    dateAdded TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dateModified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    clientDateModified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    libraryID INT NOT NULL,
    key TEXT NOT NULL,
    version INT NOT NULL DEFAULT 0,
    synced INT NOT NULL DEFAULT 0,
    UNIQUE (libraryID, key),
    FOREIGN KEY (libraryID) REFERENCES libraries(libraryID) ON DELETE CASCADE
);
CREATE TABLE itemDataValues (
    valueID INTEGER PRIMARY KEY,
    value UNIQUE
);
CREATE TABLE itemData (
    itemID INT,
    fieldID INT,
    valueID,
    PRIMARY KEY (itemID, fieldID),
    FOREIGN KEY (itemID) REFERENCES items(itemID) ON DELETE CASCADE,
    FOREIGN KEY (fieldID) REFERENCES fields(fieldID),
    FOREIGN KEY (valueID) REFERENCES itemDataValues(valueID)
);
CREATE TABLE itemNotes (
    itemID INTEGER PRIMARY KEY,
    parentItemID INT,
    note TEXT,
    title TEXT,
    FOREIGN KEY (itemID) REFERENCES items(itemID) ON DELETE CASCADE,
    FOREIGN KEY (parentItemID) REFERENCES items(itemID) ON DELETE CASCADE
);
CREATE TABLE itemAttachments (
    itemID INTEGER PRIMARY KEY,
    parentItemID INT,
    linkMode INT,
    contentType TEXT,
    charsetID INT,
    path TEXT,
    syncState INT DEFAULT 0,
    storageModTime INT,
    storageHash TEXT,
    lastProcessedModificationTime INT,
    FOREIGN KEY (itemID) REFERENCES items(itemID) ON DELETE CASCADE,
    FOREIGN KEY (parentItemID) REFERENCES items(itemID) ON DELETE CASCADE
);
CREATE TABLE tags (
    tagID INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);
CREATE TABLE itemTags (
    itemID INT NOT NULL,
    tagID INT NOT NULL,
    type INT NOT NULL,
    PRIMARY KEY (itemID, tagID),
    FOREIGN KEY (itemID) REFERENCES items(itemID) ON DELETE CASCADE,
    FOREIGN KEY (tagID) REFERENCES tags(tagID) ON DELETE CASCADE
);
CREATE TABLE creators (
    creatorID INTEGER PRIMARY KEY,
    firstName TEXT,
    lastName TEXT,
    fieldMode INT,
    UNIQUE (lastName, firstName, fieldMode)
);
CREATE TABLE itemCreators (
    itemID INT NOT NULL,
    creatorID INT NOT NULL,
    creatorTypeID INT NOT NULL DEFAULT 1,
    orderIndex INT NOT NULL DEFAULT 0,
    PRIMARY KEY (itemID, creatorID, creatorTypeID, orderIndex),
    UNIQUE (itemID, orderIndex),
    FOREIGN KEY (itemID) REFERENCES items(itemID) ON DELETE CASCADE,
    FOREIGN KEY (creatorID) REFERENCES creators(creatorID) ON DELETE CASCADE,
    FOREIGN KEY (creatorTypeID) REFERENCES creatorTypes(creatorTypeID)
);
CREATE TABLE collections (
    collectionID INTEGER PRIMARY KEY,
    collectionName TEXT NOT NULL,
    parentCollectionID INT DEFAULT NULL,
    clientDateModified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    libraryID INT NOT NULL,
    key TEXT NOT NULL,
    version INT NOT NULL DEFAULT 0,
    synced INT NOT NULL DEFAULT 0,
    UNIQUE (libraryID, key),
    FOREIGN KEY (libraryID) REFERENCES libraries(libraryID) ON DELETE CASCADE,
    FOREIGN KEY (parentCollectionID) REFERENCES collections(collectionID) ON DELETE CASCADE
);
CREATE TABLE collectionItems (
    collectionID INT NOT NULL,
    itemID INT NOT NULL,
    orderIndex INT NOT NULL DEFAULT 0,
    PRIMARY KEY (collectionID, itemID),
    FOREIGN KEY (collectionID) REFERENCES collections(collectionID) ON DELETE CASCADE,
    FOREIGN KEY (itemID) REFERENCES items(itemID) ON DELETE CASCADE
);
CREATE TABLE deletedItems (
    itemID INTEGER PRIMARY KEY,
    dateDeleted DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (itemID) REFERENCES items(itemID) ON DELETE CASCADE
);
CREATE TABLE deletedCollections (
    collectionID INTEGER PRIMARY KEY,
    dateDeleted DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (collectionID) REFERENCES collections(collectionID) ON DELETE CASCADE
);
INSERT INTO version VALUES ('userdata', 123);
INSERT INTO libraries (libraryID, type, editable, filesEditable) VALUES (1, 'user', 1, 1);
";

/// A data directory of Zotero, to be filled.
struct Zotero {
    dir: tempfile::TempDir,
    conn: Connection,
}

/// A library of Zotero that nothing holds open.
struct Folder(tempfile::TempDir);

impl Folder {
    fn path(&self) -> &Path {
        self.0.path()
    }
}

impl Zotero {
    fn new() -> Self {
        let dir = tempfile::tempdir().unwrap();
        let conn = Connection::open(dir.path().join("zotero.sqlite")).unwrap();
        // As Zotero leaves it: SQLite compiled in (Windows, macOS) holds to foreign keys unless told not to.
        conn.execute_batch("PRAGMA synchronous = OFF; PRAGMA foreign_keys = OFF;").unwrap();
        conn.execute_batch(SCHEMA).unwrap();
        Zotero { dir, conn }
    }

    fn path(&self) -> &Path {
        self.dir.path()
    }

    /// The number of a name in one of the tables of names, added when new.
    fn number(&self, table: &str, id: &str, column: &str, name: &str) -> i64 {
        let find = format!("SELECT {id} FROM {table} WHERE {column} = ?1");
        if let Ok(found) = self.conn.query_row(&find, [name], |row| row.get(0)) {
            return found;
        }
        self.conn.execute(&format!("INSERT INTO {table} ({column}) VALUES (?1)"), [name]).unwrap();
        self.conn.last_insert_rowid()
    }

    fn bare_item(&self, library: i64, kind: &str, key: &str) -> i64 {
        let kind = self.number("itemTypes", "itemTypeID", "typeName", kind);
        self.conn
            .execute("INSERT INTO items (itemTypeID, libraryID, key) VALUES (?1, ?2, ?3)", params![kind, library, key])
            .unwrap();
        self.conn.last_insert_rowid()
    }

    fn item_in(&self, library: i64, kind: &str, key: &str, fields: &[(&str, &str)]) -> i64 {
        let item = self.bare_item(library, kind, key);
        for (name, value) in fields {
            let field = self.number("fields", "fieldID", "fieldName", name);
            let value = self.number("itemDataValues", "valueID", "value", value);
            self.conn.execute("INSERT INTO itemData VALUES (?1, ?2, ?3)", params![item, field, value]).unwrap();
        }
        item
    }

    fn item(&self, kind: &str, key: &str, fields: &[(&str, &str)]) -> i64 {
        self.item_in(1, kind, key, fields)
    }

    fn creator(&self, item: i64, role: &str, first: &str, last: &str, single: bool) {
        let role = self.number("creatorTypes", "creatorTypeID", "creatorType", role);
        self.conn
            .execute(
                "INSERT OR IGNORE INTO creators (firstName, lastName, fieldMode) VALUES (?1, ?2, ?3)",
                params![first, last, single as i64],
            )
            .unwrap();
        let creator: i64 = self
            .conn
            .query_row(
                "SELECT creatorID FROM creators WHERE firstName = ?1 AND lastName = ?2 AND fieldMode = ?3",
                params![first, last, single as i64],
                |row| row.get(0),
            )
            .unwrap();
        self.conn
            .execute(
                "INSERT INTO itemCreators VALUES (?1, ?2, ?3, (SELECT COUNT(*) FROM itemCreators WHERE itemID = ?1))",
                params![item, creator, role],
            )
            .unwrap();
    }

    fn tag(&self, item: i64, name: &str, kind: i64) {
        let tag = self.number("tags", "tagID", "name", name);
        self.conn.execute("INSERT INTO itemTags VALUES (?1, ?2, ?3)", params![item, tag, kind]).unwrap();
    }

    fn collection(&self, library: i64, name: &str, key: &str, parent: Option<i64>) -> i64 {
        self.conn
            .execute(
                "INSERT INTO collections (collectionName, parentCollectionID, libraryID, key) VALUES (?1, ?2, ?3, ?4)",
                params![name, parent, library, key],
            )
            .unwrap();
        self.conn.last_insert_rowid()
    }

    fn place(&self, collection: i64, item: i64) {
        self.conn
            .execute("INSERT INTO collectionItems (collectionID, itemID) VALUES (?1, ?2)", params![collection, item])
            .unwrap();
    }

    fn attach(&self, parent: Option<i64>, key: &str, mode: i64, kind: &str, path: Option<&str>) -> i64 {
        let item = self.bare_item(1, "attachment", key);
        self.conn
            .execute(
                "INSERT INTO itemAttachments (itemID, parentItemID, linkMode, contentType, path) VALUES (?1, ?2, ?3, ?4, ?5)",
                params![item, parent, mode, kind, path],
            )
            .unwrap();
        item
    }

    fn note(&self, parent: Option<i64>, key: &str, html: &str) -> i64 {
        let item = self.bare_item(1, "note", key);
        self.conn
            .execute(
                "INSERT INTO itemNotes (itemID, parentItemID, note, title) VALUES (?1, ?2, ?3, '')",
                params![item, parent, html],
            )
            .unwrap();
        item
    }

    fn delete(&self, item: i64) {
        self.conn.execute("INSERT INTO deletedItems (itemID) VALUES (?1)", [item]).unwrap();
    }

    fn group(&self, name: &str) -> i64 {
        self.conn.execute("INSERT INTO libraries (type, editable, filesEditable) VALUES ('group', 1, 1)", []).unwrap();
        let library = self.conn.last_insert_rowid();
        self.conn
            .execute(
                "INSERT INTO groups (libraryID, name, description, version) VALUES (?1, ?2, '', 1)",
                params![library, name],
            )
            .unwrap();
        library
    }

    /// Puts a file where Zotero keeps the file of an attachment.
    fn store(&self, key: &str, name: &str) -> PathBuf {
        let dir = self.path().join("storage").join(key);
        fs::create_dir_all(&dir).unwrap();
        fs::write(dir.join(name), b"%PDF-1.4 a paper").unwrap();
        dir.join(name)
    }
}

const EVERYTHING: Options = Options { library: None, attachments: true, notes: true, collection: None };

fn read_all(zotero: &Zotero) -> (Vec<Candidate>, Vec<String>) {
    candidates_of(zotero, &EVERYTHING)
}

/// As `read`, without what the settings of a Zotero on this machine may add.
fn candidates_of(zotero: &Zotero, options: &Options) -> (Vec<Candidate>, Vec<String>) {
    database::with_database(zotero.path(), |db, warnings| candidates(db, options, &[], warnings)).unwrap()
}

fn by_key<'a>(candidates: &'a [Candidate], key: &str) -> &'a Candidate {
    let origin = format!("Zotero, {key}");
    candidates.iter().find(|c| c.origin == origin).unwrap_or_else(|| panic!("{key} is not among the candidates"))
}

/// What the draft says of the work. The key of the item, which every draft
/// has, is looked at on its own.
fn fields(draft: &Draft) -> Vec<(&str, &str)> {
    draft
        .fields
        .iter()
        .filter(|(name, _)| *name != FIELD_ZOTERO)
        .map(|(name, value)| (name.as_str(), value.as_str()))
        .collect()
}

fn names(draft: &Draft) -> Vec<(&str, &[Person])> {
    draft.names.iter().map(|(name, people)| (name.as_str(), people.as_slice())).collect()
}

/// A library such as a classicist may have.
fn a_library() -> Zotero {
    let z = Zotero::new();

    let article = z.item(
        "journalArticle",
        "ARTICLE1",
        &[
            ("title", "The Rise of the Greek Epic"),
            ("publicationTitle", "The Journal of Hellenic Studies"),
            ("journalAbbreviation", "JHS"),
            ("volume", "108"),
            ("issue", "2"),
            ("pages", "151-172"),
            ("date", "1988-11-00 November 1988"),
            ("DOI", "https://doi.org/10.2307/632637"),
            ("ISSN", "0075-4269"),
            ("language", "en-GB"),
            ("abstractNote", "On the\nbeginnings of epic."),
            ("libraryCatalog", "JSTOR"),
        ],
    );
    z.creator(article, "author", "M. L.", "West", false);
    z.creator(article, "author", "Gregory", "Nagy", false);
    z.tag(article, "Homer", 0);
    z.tag(article, "epic, Greek", 1);
    let homer = z.collection(1, "Homer", "COLLHOME", None);
    let epic = z.collection(1, "Epic", "COLLEPIC", Some(homer));
    z.collection(1, "To read", "COLLREAD", None);
    z.place(epic, article);

    let book = z.item(
        "book",
        "BOOK0001",
        &[
            ("title", "A Catalogue of the Greek Vases"),
            ("publisher", "Trustees of the British Museum"),
            ("place", "London"),
            ("date", "1893-00-00 1893"),
            ("numPages", "412"),
            ("ISBN", "978-0-8018-2388-6"),
            ("edition", "2nd ed."),
            ("series", "Catalogues"),
            ("seriesNumber", "3"),
        ],
    );
    z.creator(book, "author", "", "British Museum", true);
    z.place(homer, book);

    let chapter = z.item(
        "bookSection",
        "CHAPTER1",
        &[
            ("title", "Homeric Questions"),
            ("bookTitle", "A New Companion to Homer"),
            ("publisher", "Brill"),
            ("place", "Leiden; New York"),
            ("date", "1997-00-00 1997"),
            ("pages", "101–122"),
            ("series", "Mnemosyne Supplements"),
            ("seriesNumber", "163"),
        ],
    );
    z.creator(chapter, "author", "Gregory", "Nagy", false);
    z.creator(chapter, "editor", "Ian", "Morris", false);
    z.creator(chapter, "editor", "Barry", "Powell", false);
    z.place(epic, chapter);
    z.place(homer, chapter);

    let thesis = z.item(
        "thesis",
        "THESIS01",
        &[
            ("title", "Sangeren og sangen: en studie i muntlig diktning"),
            ("thesisType", "Ph.D. dissertation"),
            ("university", "Universitetet i Oslo"),
            ("place", "Oslo"),
            ("date", "2004-06-15 15. juni 2004"),
            ("numPages", "310"),
            ("language", "nb"),
        ],
    );
    z.creator(thesis, "author", "Kari", "Nordmann", false);

    let page = z.item(
        "webpage",
        "WEBPAGE1",
        &[
            ("title", "Homer Multitext"),
            ("websiteTitle", "The Center for Hellenic Studies"),
            ("url", "https://www.homermultitext.org/"),
            ("accessDate", "2019-05-12 14:33:21"),
        ],
    );
    z.attach(Some(page), "SNAPSHOT", 1, "text/html", Some("storage:index.html"));
    z.store("SNAPSHOT", "index.html");

    let deleted = z.item("book", "DELETED1", &[("title", "A Book Thrown Away")]);
    z.delete(deleted);

    let with_files = z.item("book", "FILES001", &[("title", "The Singer of Tales"), ("date", "1960-00-00 1960")]);
    z.creator(with_files, "author", "Albert B.", "Lord", false);
    z.attach(Some(with_files), "PDFHERE1", 0, "application/pdf", Some("storage:Lord 1960.pdf"));
    z.store("PDFHERE1", "Lord 1960.pdf");
    z.attach(Some(with_files), "PDFGONE1", 1, "application/pdf", Some("storage:gone.pdf"));
    z.attach(Some(with_files), "LINKEDUP", 2, "application/pdf", Some("attachments:epic/lord.pdf"));
    z.attach(Some(with_files), "WEBLINK1", 3, "application/pdf", None);
    let thrown = z.attach(Some(with_files), "PDFTRASH", 0, "application/pdf", Some("storage:thrown.pdf"));
    z.store("PDFTRASH", "thrown.pdf");
    z.delete(thrown);
    z.note(
        Some(with_files),
        "NOTE0001",
        "<div class=\"zotero-note znv1\"><p>The <em>guslar</em> &amp; his song.</p>\n<p>See ch.&nbsp;2.</p></div>",
    );
    z.note(Some(with_files), "NOTE0002", "<div data-schema-version=\"8\"><p>Read again in 2019.</p></div>");
    let thrown = z.note(Some(with_files), "NOTE0003", "<p>Thrown away.</p>");
    z.delete(thrown);

    z.item(
        "book",
        "EXTRA001",
        &[
            ("title", "Homeric Hymns"),
            (
                "extra",
                "Citation Key: west2003hymns\nDOI: 10.4159/DLCL.homeric_hymns.2003\noriginal-date: 1914\nA Loeb.",
            ),
        ],
    );

    // What stands alone is not a reference.
    z.attach(None, "ALONE001", 0, "application/pdf", Some("storage:alone.pdf"));
    z.note(None, "ALONE002", "<p>A note to self.</p>");

    let group = z.group("Oral Poetry Seminar");
    let shared = z.item_in(
        group,
        "book",
        "GROUP001",
        &[("title", "Epic Singers and Oral Tradition"), ("date", "1991-00-00 1991")],
    );
    z.creator(shared, "author", "Albert B.", "Lord", false);
    let seminar = z.collection(group, "Seminar", "COLLSEMI", None);
    z.place(seminar, shared);
    z
}

#[test]
fn the_references_of_a_library() {
    let z = a_library();
    let (candidates, warnings) = read_all(&z);
    assert_eq!(
        candidates.iter().map(|c| c.origin.as_str()).collect::<Vec<_>>(),
        vec![
            "Zotero, ARTICLE1",
            "Zotero, BOOK0001",
            "Zotero, CHAPTER1",
            "Zotero, THESIS01",
            "Zotero, WEBPAGE1",
            "Zotero, FILES001",
            "Zotero, EXTRA001",
        ]
    );
    assert_eq!(warnings, vec!["2 files and notes stand in Zotero under no reference, and were left out."]);
    // The library makes the keys, but for the one that was pinned.
    assert!(candidates.iter().all(|c| c.draft.key.is_empty() || c.origin == "Zotero, EXTRA001"));
}

#[test]
fn an_article() {
    let z = a_library();
    let (candidates, _) = read_all(&z);
    let c = by_key(&candidates, "ARTICLE1");
    assert_eq!(c.draft.entry_type, "article");
    assert_eq!(
        fields(&c.draft),
        vec![
            ("abstract", "On the\nbeginnings of epic."),
            ("date", "1988-11"),
            ("doi", "10.2307/632637"),
            ("issn", "0075-4269"),
            ("journaltitle", "The Journal of Hellenic Studies"),
            ("keywords", "epic; Greek, Homer"),
            ("langid", "british"),
            ("number", "2"),
            ("pages", "151–172"),
            ("shortjournal", "JHS"),
            ("title", "The Rise of the Greek Epic"),
            ("volume", "108"),
        ]
    );
    assert_eq!(names(&c.draft), vec![("author", &[Person::new("West", "M. L."), Person::new("Nagy", "Gregory")][..])]);
    assert_eq!(c.collections, vec![vec!["Homer".to_owned(), "Epic".to_owned()]]);
    assert!(c.files.is_empty() && c.notes.is_empty());
}

#[test]
fn a_book_by_an_institution() {
    let z = a_library();
    let (candidates, _) = read_all(&z);
    let c = by_key(&candidates, "BOOK0001");
    assert_eq!(c.draft.entry_type, "book");
    assert_eq!(
        fields(&c.draft),
        vec![
            ("date", "1893"),
            ("edition", "2"),
            ("isbn", "978-0-8018-2388-6"),
            ("location", "London"),
            ("number", "3"),
            ("pagetotal", "412"),
            ("publisher", "Trustees of the British Museum"),
            ("series", "Catalogues"),
            ("title", "A Catalogue of the Greek Vases"),
        ]
    );
    assert_eq!(names(&c.draft), vec![("author", &[Person::literal("British Museum")][..])]);
    assert_eq!(c.collections, vec![vec!["Homer".to_owned()]]);
    // It is written, and read again, as one name.
    assert_eq!(c.draft.to_entry().get("author"), Some("{British Museum}"));
}

#[test]
fn a_chapter() {
    let z = a_library();
    let (candidates, _) = read_all(&z);
    let c = by_key(&candidates, "CHAPTER1");
    assert_eq!(c.draft.entry_type, "incollection");
    assert_eq!(
        fields(&c.draft),
        vec![
            ("booktitle", "A New Companion to Homer"),
            ("date", "1997"),
            ("location", "Leiden and New York"),
            ("number", "163"),
            ("pages", "101–122"),
            ("publisher", "Brill"),
            ("series", "Mnemosyne Supplements"),
            ("title", "Homeric Questions"),
        ]
    );
    assert_eq!(
        names(&c.draft),
        vec![
            ("author", &[Person::new("Nagy", "Gregory")][..]),
            ("editor", &[Person::new("Morris", "Ian"), Person::new("Powell", "Barry")][..]),
        ]
    );
    assert_eq!(c.collections, vec![vec!["Homer".to_owned()], vec!["Homer".to_owned(), "Epic".to_owned()]]);
}

#[test]
fn a_thesis() {
    let z = a_library();
    let (candidates, _) = read_all(&z);
    let c = by_key(&candidates, "THESIS01");
    assert_eq!(c.draft.entry_type, "thesis");
    assert_eq!(
        fields(&c.draft),
        vec![
            ("date", "2004-06-15"),
            ("institution", "Universitetet i Oslo"),
            ("langid", "norsk"),
            ("location", "Oslo"),
            ("pagetotal", "310"),
            ("subtitle", "en studie i muntlig diktning"),
            ("title", "Sangeren og sangen"),
            ("type", "phdthesis"),
        ]
    );
    assert_eq!(names(&c.draft), vec![("author", &[Person::new("Nordmann", "Kari")][..])]);
    assert!(c.collections.is_empty());
}

#[test]
fn a_web_page() {
    let z = a_library();
    let (candidates, _) = read_all(&z);
    let c = by_key(&candidates, "WEBPAGE1");
    assert_eq!(c.draft.entry_type, "online");
    assert_eq!(
        fields(&c.draft),
        vec![
            ("organization", "The Center for Hellenic Studies"),
            ("title", "Homer Multitext"),
            ("url", "https://www.homermultitext.org/"),
            ("urldate", "2019-05-12"),
        ]
    );
    // The snapshot of the page is not taken along, and nothing is said of it.
    assert!(c.files.is_empty() && c.notes.is_empty());
}

#[test]
fn files_and_notes() {
    let z = a_library();
    let (candidates, _) = read_all(&z);
    let c = by_key(&candidates, "FILES001");
    assert_eq!(
        c.files.iter().map(Path::new).collect::<Vec<_>>(),
        vec![z.path().join("storage/PDFHERE1/Lord 1960.pdf")]
    );
    assert!(Path::new(&c.files[0]).is_absolute() && Path::new(&c.files[0]).is_file());
    assert_eq!(
        c.notes,
        vec![
            "The file “gone.pdf” was not found.",
            "The file “epic/lord.pdf” was not found. Zotero links to it from a directory of its own choosing, which is not known here.",
        ]
    );
    assert_eq!(c.draft.get("annotation"), Some("The guslar & his song.\nSee ch.\u{a0}2.\n\nRead again in 2019."));

    // Neither is asked for.
    let (candidates, _) = candidates_of(&z, &Options::default());
    let c = by_key(&candidates, "FILES001");
    assert!(c.files.is_empty() && c.notes.is_empty());
    assert_eq!(fields(&c.draft), vec![("date", "1960"), ("title", "The Singer of Tales")]);
}

#[test]
fn linked_files() {
    let z = Zotero::new();
    let item = z.item("book", "LINKS001", &[("title", "Linked")]);
    let elsewhere = tempfile::tempdir().unwrap();
    fs::create_dir_all(elsewhere.path().join("base/epic")).unwrap();
    let absolute = elsewhere.path().join("paper.pdf");
    let relative = elsewhere.path().join("base/epic/lord.pdf");
    fs::write(&absolute, b"%PDF one").unwrap();
    fs::write(&relative, b"%PDF two").unwrap();
    z.attach(Some(item), "LINKABS1", 2, "application/pdf", Some(&absolute.display().to_string()));
    z.attach(Some(item), "LINKREL1", 2, "application/pdf", Some("attachments:epic/lord.pdf"));
    z.attach(Some(item), "LINKGONE", 2, "application/pdf", Some("/nowhere/at/all.pdf"));
    z.attach(Some(item), "ODDPATH1", 0, "application/pdf", Some("storage:../../zotero.sqlite"));
    z.attach(Some(item), "NOPATH01", 0, "application/pdf", None);

    let bases = [elsewhere.path().join("base")];
    let (candidates, _) =
        database::with_database(z.path(), |db, warnings| candidates(db, &EVERYTHING, &bases, warnings)).unwrap();
    assert_eq!(
        candidates[0].files.iter().map(Path::new).collect::<Vec<_>>(),
        vec![absolute.as_path(), relative.as_path()]
    );
    assert_eq!(
        candidates[0].notes,
        vec!["The file “/nowhere/at/all.pdf” was not found.", "The file “../../zotero.sqlite” was not found.",]
    );
}

#[test]
fn what_extra_holds() {
    let z = a_library();
    let (candidates, _) = read_all(&z);
    let c = by_key(&candidates, "EXTRA001");
    assert_eq!(c.draft.key, "west2003hymns");
    assert_eq!(
        fields(&c.draft),
        vec![
            ("doi", "10.4159/DLCL.homeric_hymns.2003"),
            ("note", "A Loeb."),
            ("origdate", "1914"),
            ("title", "Homeric Hymns"),
        ]
    );
}

#[test]
fn a_group_library() {
    let z = a_library();
    let group = inspect(z.path()).unwrap().libraries[1].id;
    let (candidates, warnings) = candidates_of(&z, &Options { library: Some(group), ..Default::default() });
    assert_eq!(candidates.len(), 1);
    let c = &candidates[0];
    assert_eq!(c.origin, "Zotero, GROUP001");
    assert_eq!(c.draft.entry_type, "book");
    assert_eq!(fields(&c.draft), vec![("date", "1991"), ("title", "Epic Singers and Oral Tradition")]);
    assert_eq!(names(&c.draft), vec![("author", &[Person::new("Lord", "Albert B.")][..])]);
    assert_eq!(c.collections, vec![vec!["Seminar".to_owned()]]);
    assert!(warnings.is_empty(), "{warnings:?}");

    let error = read(z.path(), &Options { library: Some(99), ..Default::default() }).unwrap_err();
    assert_eq!(error.to_string(), "not found: the library 99 in Zotero");
}

#[test]
fn inspecting() {
    let z = a_library();
    let info = inspect(z.path()).unwrap();
    assert_eq!(info.path, z.path().display().to_string());
    assert_eq!(info.items, 8);
    // Three files under the book; not the snapshot, the link to the web, what is in the bin or what stands alone.
    assert_eq!(info.attachments, 3);
    assert_eq!(info.collections, 4);
    assert!(info.warnings.is_empty());
    let libraries: Vec<_> = info.libraries.iter().map(|l| (l.name.as_str(), l.kind, l.items)).collect();
    assert_eq!(libraries, vec![("My Library", LibraryKind::User, 7), ("Oral Poetry Seminar", LibraryKind::Group, 1)]);
    assert_eq!(info.libraries[0].id, 1);

    let json = serde_json::to_value(&info).unwrap();
    assert_eq!(json["libraries"][1]["kind"], "group");
    assert_eq!(json["attachments"], 3);

    // The database itself may be named in place of the directory.
    let info = inspect(&z.path().join("zotero.sqlite")).unwrap();
    assert_eq!((info.items, info.path), (8, z.path().display().to_string()));
    let (candidates, _) = read(&z.path().join("zotero.sqlite"), &EVERYTHING).unwrap();
    assert_eq!(by_key(&candidates, "FILES001").files.len(), 1);
}

#[test]
fn one_collection() {
    let z = a_library();
    let listed = collections(z.path(), None).unwrap();
    assert_eq!(
        listed.iter().map(|c| (c.key.as_str(), c.path.join(" / "), c.items)).collect::<Vec<_>>(),
        vec![
            ("COLLHOME", "Homer".to_owned(), 2),
            ("COLLEPIC", "Homer / Epic".to_owned(), 2),
            ("COLLREAD", "To read".to_owned(), 0),
        ]
    );

    let only = |key: &str| candidates_of(&z, &Options { collection: Some(key.into()), ..Default::default() });
    let (candidates, warnings) = only("COLLEPIC");
    assert_eq!(
        candidates.iter().map(|c| c.origin.as_str()).collect::<Vec<_>>(),
        vec!["Zotero, ARTICLE1", "Zotero, CHAPTER1"]
    );
    // Of the collections the chapter is in, the one that was not asked for is left out.
    assert_eq!(by_key(&candidates, "CHAPTER1").collections, vec![vec!["Homer".to_owned(), "Epic".to_owned()]]);
    assert!(warnings.is_empty(), "{warnings:?}");

    // With a collection come those within it.
    let (candidates, _) = only("COLLHOME");
    assert_eq!(
        candidates.iter().map(|c| c.origin.as_str()).collect::<Vec<_>>(),
        vec!["Zotero, ARTICLE1", "Zotero, BOOK0001", "Zotero, CHAPTER1"]
    );
    assert_eq!(by_key(&candidates, "CHAPTER1").collections.len(), 2);
    assert!(only("COLLREAD").0.is_empty());

    let options: Options = serde_json::from_str(r#"{"collection": "NOSUCHCO", "attachments": true}"#).unwrap();
    assert!(options.attachments && !options.notes && options.library.is_none());
    let error = read(z.path(), &options).unwrap_err();
    assert_eq!(error.kind(), "not-found");
    assert_eq!(error.to_string(), "not found: the collection NOSUCHCO in Zotero");
}

#[test]
fn collections_in_the_bin_and_in_a_knot() {
    let z = Zotero::new();
    let item = z.item("book", "BOOK0001", &[("title", "T")]);
    let kept = z.collection(1, "Kept", "COLLKEPT", None);
    let thrown = z.collection(1, "Thrown", "COLLTHRO", None);
    let within = z.collection(1, "Within", "COLLWITH", Some(thrown));
    // Each is within the other, as no collection of Zotero's is.
    let one = z.collection(1, "One", "COLLONE1", None);
    let other = z.collection(1, "Other", "COLLOTHE", Some(one));
    z.conn.execute("UPDATE collections SET parentCollectionID = ?1 WHERE collectionID = ?2", [other, one]).unwrap();
    for collection in [kept, thrown, within, one] {
        z.place(collection, item);
    }
    z.conn.execute("INSERT INTO deletedCollections (collectionID) VALUES (?1)", [thrown]).unwrap();

    let (candidates, _) = read_all(&z);
    assert_eq!(candidates[0].collections.len(), 2);
    assert_eq!(candidates[0].collections[0], vec!["Kept".to_owned()]);
    assert_eq!(candidates[0].collections[1], vec!["Other".to_owned(), "One".to_owned()]);
    assert_eq!(inspect(z.path()).unwrap().collections, 3);
    // What is in the bin cannot be asked for.
    let thrown = Options { collection: Some("COLLWITH".into()), ..Default::default() };
    assert_eq!(read(z.path(), &thrown).unwrap_err().kind(), "not-found");
}

#[test]
fn zotero_running_is_no_hindrance() {
    let z = a_library();
    // Zotero holds its database locked for as long as it runs, and may be
    // in the middle of writing.
    z.conn.execute_batch("PRAGMA locking_mode = EXCLUSIVE; BEGIN EXCLUSIVE;").unwrap();
    z.item("book", "UNSAVED1", &[("title", "Not Yet Saved")]);
    assert!(z.path().join("zotero.sqlite-journal").is_file());
    let before = fs::read(z.path().join("zotero.sqlite")).unwrap();

    let (candidates, _) = read(z.path(), &EVERYTHING).unwrap();
    assert_eq!(candidates.len(), 7);
    assert!(candidates.iter().all(|c| c.origin != "Zotero, UNSAVED1"));
    assert_eq!(inspect(z.path()).unwrap().items, 8);

    // Nothing of Zotero's was touched, and Zotero goes on as before.
    assert_eq!(fs::read(z.path().join("zotero.sqlite")).unwrap(), before);
    assert!(z.path().join("zotero.sqlite-journal").is_file());
    let mut left: Vec<String> =
        fs::read_dir(z.path()).unwrap().map(|e| e.unwrap().file_name().to_string_lossy().into_owned()).collect();
    left.sort();
    assert_eq!(left, vec!["storage", "zotero.sqlite", "zotero.sqlite-journal"]);
    z.conn.execute_batch("COMMIT;").unwrap();
    assert_eq!(read(z.path(), &EVERYTHING).unwrap().0.len(), 8);
}

#[test]
fn a_database_that_keeps_a_log() {
    // Zotero does not write ahead of its database, but others that use
    // the database may have set it to.
    let z = Zotero::new();
    z.conn.execute_batch("PRAGMA journal_mode = WAL; PRAGMA wal_autocheckpoint = 0;").unwrap();
    z.item("book", "INTHELOG", &[("title", "Written to the Log Only")]);
    assert!(fs::metadata(z.path().join("zotero.sqlite-wal")).unwrap().len() > 0);
    let before = fs::read(z.path().join("zotero.sqlite")).unwrap();

    let (candidates, warnings) = read(z.path(), &EVERYTHING).unwrap();
    assert_eq!(candidates.len(), 1);
    assert_eq!(candidates[0].draft.get("title"), Some("Written to the Log Only"));
    assert!(warnings.is_empty(), "{warnings:?}");
    assert_eq!(fs::read(z.path().join("zotero.sqlite")).unwrap(), before);
    assert!(fs::metadata(z.path().join("zotero.sqlite-wal")).unwrap().len() > 0);
}

#[test]
fn no_database() {
    let empty = tempfile::tempdir().unwrap();
    let error = read(empty.path(), &EVERYTHING).unwrap_err();
    assert_eq!(error.kind(), "not-found");
    assert!(error.to_string().contains("a Zotero database (zotero.sqlite) in"), "{error}");
    assert_eq!(inspect(&empty.path().join("nowhere")).unwrap_err().kind(), "not-found");
    assert_eq!(collections(&empty.path().join("zotero.sqlite"), None).unwrap_err().kind(), "not-found");
}

#[test]
fn a_database_that_cannot_be_read() {
    let z = a_library();
    // What made the library lets go of it, as Zotero does when it is closed:
    // Windows keeps a file that is open from being taken away.
    let Zotero { dir, conn } = z;
    drop(conn);
    let z = Folder(dir);
    let database = z.path().join("zotero.sqlite");
    let good = fs::read(&database).unwrap();

    fs::write(&database, b"This is no database, whatever its name.").unwrap();
    let error = read(z.path(), &EVERYTHING).unwrap_err();
    assert_eq!(error.kind(), "parse");
    assert!(error.to_string().contains("zotero.sqlite"), "{error}");
    assert!(inspect(z.path()).is_err());

    // Cut off in the middle.
    fs::write(&database, &good[..good.len() / 2]).unwrap();
    assert!(read(z.path(), &EVERYTHING).is_err());
    fs::write(&database, b"").unwrap();
    assert!(read(z.path(), &EVERYTHING).is_err());

    // With Zotero's backup beside it, the backup is read.
    fs::write(z.path().join("zotero.sqlite.bak"), &good).unwrap();
    let (candidates, warnings) = read(z.path(), &EVERYTHING).unwrap();
    assert_eq!(candidates.len(), 7);
    assert_eq!(by_key(&candidates, "FILES001").files.len(), 1);
    assert_eq!(warnings.len(), 2, "{warnings:?}");
    assert!(warnings[0].starts_with("Zotero’s database could not be read (could not read "), "{}", warnings[0]);
    assert!(warnings[0].contains("zotero.sqlite.bak, was read instead"), "{}", warnings[0]);
    assert_eq!(inspect(z.path()).unwrap().warnings.len(), 1);

    // So it is when the database is not there at all.
    fs::remove_file(&database).unwrap();
    let (candidates, warnings) = read(z.path(), &EVERYTHING).unwrap();
    assert_eq!((candidates.len(), warnings.len()), (7, 2));
}

#[cfg(unix)]
#[test]
fn a_database_that_may_not_be_read() {
    use std::os::unix::fs::PermissionsExt;
    let z = a_library();
    let database = z.path().join("zotero.sqlite");
    fs::set_permissions(&database, fs::Permissions::from_mode(0o000)).unwrap();
    // To the superuser nothing is closed.
    if fs::File::open(&database).is_ok() {
        return;
    }
    let error = read(z.path(), &EVERYTHING).unwrap_err();
    assert_eq!(error.kind(), "io");
    assert!(error.to_string().starts_with("copying "), "{error}");
}

#[test]
fn a_database_that_may_only_be_read() {
    let z = a_library();
    let database = z.path().join("zotero.sqlite");
    let mut permissions = fs::metadata(&database).unwrap().permissions();
    permissions.set_readonly(true);
    fs::set_permissions(&database, permissions).unwrap();
    // A journal beside it has SQLite set the copy right, for which the copy must be open to writing.
    fs::write(z.path().join("zotero.sqlite-journal"), b"").unwrap();
    assert_eq!(read(z.path(), &EVERYTHING).unwrap().0.len(), 7);
}

#[test]
fn databases_of_another_form() {
    // Not Zotero's.
    let other = tempfile::tempdir().unwrap();
    let conn = Connection::open(other.path().join("zotero.sqlite")).unwrap();
    conn.execute_batch("CREATE TABLE books (title TEXT); INSERT INTO books VALUES ('x');").unwrap();
    let error = read(other.path(), &EVERYTHING).unwrap_err();
    assert_eq!(error.kind(), "invalid");
    assert!(error.to_string().ends_with("zotero.sqlite is not a database of Zotero."), "{error}");

    // Zotero's, of a time before the libraries had a type.
    let z = a_library();
    z.conn
        .execute_batch("ALTER TABLE libraries RENAME COLUMN type TO libraryType; UPDATE version SET version = 77;")
        .unwrap();
    let error = inspect(z.path()).unwrap_err();
    assert_eq!(
        error.to_string(),
        "The Zotero database has a form that cannot be read here (version 77 of Zotero’s database): \
         the table “libraries” has no column “type”. If it was written by an old version of Zotero, \
         opening it once in a current one brings it up to date."
    );
    let z = a_library();
    z.conn.execute_batch("DROP TABLE itemData; DROP TABLE version;").unwrap();
    let error = read(z.path(), &EVERYTHING).unwrap_err();
    assert!(error.to_string().contains("cannot be read here: the table “itemData” is missing."), "{error}");
}

#[test]
fn tables_that_can_be_done_without() {
    let z = a_library();
    z.conn
        .execute_batch(
            "DROP TABLE itemTags; DROP TABLE tags; DROP TABLE collectionItems; DROP TABLE itemNotes; \
             DROP TABLE deletedCollections; DROP TABLE groups;",
        )
        .unwrap();
    let (candidates, warnings) = read_all(&z);
    assert_eq!(candidates.len(), 7);
    let article = by_key(&candidates, "ARTICLE1");
    assert_eq!(article.draft.get("keywords"), None);
    assert!(article.collections.is_empty());
    assert_eq!(by_key(&candidates, "FILES001").draft.get("annotation"), None);
    assert_eq!(by_key(&candidates, "FILES001").files.len(), 1);
    assert_eq!(
        warnings,
        vec![
            "The Zotero database has no table “collectionItems” of the form known here: collections were not read.",
            "The Zotero database has no table “itemNotes” of the form known here: notes were not read.",
            "The Zotero database has no table “tags” of the form known here: keywords were not read.",
            "The Zotero database has no table “groups” of the form known here: the names of group libraries are not known.",
            "1 file or note stands in Zotero under no reference, and was left out.",
        ]
    );
    let info = inspect(z.path()).unwrap();
    assert_eq!((info.items, info.collections), (8, 0));
    assert_eq!(info.libraries[1].name, "Group 2");
}

#[test]
fn odd_data() {
    let z = Zotero::new();
    // Of a type that is not known, with a number where text is expected
    // and text that is not text.
    z.conn.execute_batch("INSERT INTO items (itemTypeID, libraryID, key) VALUES (999, 1, 'NOTYPE01');").unwrap();
    let item = z.conn.last_insert_rowid();
    let title = z.number("fields", "fieldID", "fieldName", "title");
    let volume = z.number("fields", "fieldID", "fieldName", "volume");
    let place = z.number("fields", "fieldID", "fieldName", "place");
    z.conn
        .execute("INSERT INTO itemDataValues (valueID, value) VALUES (1, ?1), (2, 12), (3, NULL)", [&b"Il\xffiad"[..]])
        .unwrap();
    z.conn
        .execute_batch(&format!(
            "INSERT INTO itemData VALUES ({item}, {title}, 1), ({item}, {volume}, 2), ({item}, {place}, 3), ({item}, 4711, 1);"
        ))
        .unwrap();
    // Creators without a name, of no kind, and of a kind that is not known.
    z.conn
        .execute_batch(&format!(
            "INSERT INTO creators (creatorID, firstName, lastName, fieldMode) VALUES (1, NULL, NULL, NULL), (2, 'Gregory', 'Nagy', 'x');
             INSERT INTO itemCreators VALUES ({item}, 1, 1, 0), ({item}, 2, 77, 1), ({item}, 3, 1, 2);"
        ))
        .unwrap();
    // Nothing at all.
    z.item("book", "EMPTY001", &[]);
    z.item("book", "EMPTY002", &[("title", "  ")]);
    // A file and a note under nothing that is there, and a file under a note.
    z.attach(Some(4711), "ORPHAN01", 0, "application/pdf", Some("storage:x.pdf"));
    let note = z.note(Some(4711), "ORPHAN02", "<p>x</p>");
    z.attach(Some(note), "IMAGE001", 4, "image/png", Some("storage:image.png"));
    // A library of a kind that is not one of references.
    z.conn
        .execute_batch("INSERT INTO libraries (libraryID, type, editable, filesEditable) VALUES (7, 'feed', 0, 0);")
        .unwrap();
    z.item_in(7, "journalArticle", "FEEDITEM", &[("title", "From a feed")]);

    let (candidates, warnings) = read_all(&z);
    assert_eq!(candidates.len(), 1);
    let c = &candidates[0];
    assert_eq!(c.origin, "Zotero, NOTYPE01");
    assert_eq!(c.draft.entry_type, "misc");
    assert_eq!(fields(&c.draft), vec![("editoratype", "collaborator"), ("title", "Il\u{fffd}iad"), ("volume", "12")]);
    assert_eq!(names(&c.draft), vec![("editora", &[Person::new("Nagy", "Gregory")][..])]);
    assert_eq!(
        warnings,
        vec![
            "The item EMPTY001 in Zotero is empty and was left out.",
            "The item EMPTY002 in Zotero is empty and was left out.",
        ]
    );
    let info = inspect(z.path()).unwrap();
    assert_eq!((info.items, info.attachments, info.libraries.len()), (3, 0, 1));
}

#[test]
fn what_is_read_can_be_added_to_the_library() {
    let z = a_library();
    let (candidates, warnings) = read_all(&z);
    let store = tempfile::tempdir().unwrap();
    let mut library = crate::library::Library::open_at(&store.path().join("library")).unwrap();
    let plan = crate::import::plan(&library, candidates, "Zotero", warnings);
    assert!(plan.items.iter().all(|item| item.action == crate::import::Action::Add));
    let outcome = crate::import::apply(&mut library, &plan).unwrap();
    assert_eq!(outcome.added.len(), 7);
    assert_eq!(outcome.files, 1);
    assert!(outcome.problems.is_empty(), "{:?}", outcome.problems);
    assert_eq!(library.by_key("west2003hymns").and_then(|e| e.get("origdate")), Some("1914"));
    assert_eq!(library.collections.list.len(), 2);

    // The same again adds nothing: each is known, by its DOI, its ISBN or its title.
    let (candidates, _) = read_all(&z);
    let again = crate::import::plan(&library, candidates, "Zotero", vec![]);
    assert!(
        again.items.iter().all(|item| item.action == crate::import::Action::Skip),
        "{:?}",
        again.items.iter().map(|item| &item.action).collect::<Vec<_>>()
    );
}

#[test]
fn every_entry_keeps_the_key_of_its_item() {
    let z = a_library();
    let (candidates, warnings) = read_all(&z);
    let keys: Vec<String> = candidates.iter().map(|c| c.origin.trim_start_matches("Zotero, ").to_owned()).collect();
    for (candidate, key) in candidates.iter().zip(&keys) {
        assert_eq!(candidate.draft.zotero(), vec![key.clone()], "{}", candidate.origin);
    }

    let store = tempfile::tempdir().unwrap();
    let mut library = crate::library::Library::open_at(&store.path().join("library")).unwrap();
    let plan = crate::import::plan(&library, candidates, "Zotero", warnings);
    // The plan goes to the interface and comes back.
    let plan: crate::import::Plan = serde_json::from_str(&serde_json::to_string(&plan).unwrap()).unwrap();
    crate::import::apply(&mut library, &plan).unwrap();
    let mut kept: Vec<String> = library.entries().iter().flat_map(|e| e.zotero.clone()).collect();
    let mut keys = keys;
    kept.sort();
    keys.sort();
    assert_eq!(kept, keys);
    assert!(library.entries().iter().all(|e| e.zotero.len() == 1 && e.get(FIELD_ZOTERO).is_none()));

    // Read from the file again.
    let again = crate::library::Library::open_at(&store.path().join("library")).unwrap();
    let read: Vec<(&str, &[String])> = again.entries().iter().map(|e| (e.key.as_str(), e.zotero.as_slice())).collect();
    let held: Vec<(&str, &[String])> =
        library.entries().iter().map(|e| (e.key.as_str(), e.zotero.as_slice())).collect();
    assert_eq!(read, held);
}

#[test]
fn what_came_from_zotero_before_gets_its_key_when_it_is_brought_in_again() {
    let z = a_library();
    let (candidates, _) = read_all(&z);
    let store = tempfile::tempdir().unwrap();
    let mut library = crate::library::Library::open_at(&store.path().join("library")).unwrap();
    // As they were brought in when no key was kept.
    let mut before = candidates.clone();
    for candidate in &mut before {
        candidate.draft.fields.remove(FIELD_ZOTERO);
    }
    let plan = crate::import::plan(&library, before, "Zotero", vec![]);
    crate::import::apply(&mut library, &plan).unwrap();
    assert!(library.entries().iter().all(|e| e.zotero.is_empty()));
    let text_before: Vec<String> = library.entries().iter().map(|e| e.to_bib(false, true)).collect();

    let plan = crate::import::plan(&library, candidates, "Zotero", vec![]);
    for item in &plan.items {
        let first = &item.matches[0];
        assert_eq!(first.gains, vec![FIELD_ZOTERO], "{}", item.candidate.origin);
        assert_eq!(item.action, crate::import::Action::Merge { into: first.id.clone() });
    }
    let outcome = crate::import::apply(&mut library, &plan).unwrap();
    assert_eq!((outcome.added.len(), outcome.updated.len()), (0, 7));
    for item in &plan.items {
        let entry = library.get(&item.matches[0].id).unwrap();
        assert_eq!(format!("Zotero, {}", entry.zotero.join(" ")), item.candidate.origin);
    }
    // Nothing else of them is changed.
    let text_after: Vec<String> = library.entries().iter().map(|e| e.to_bib(false, true)).collect();
    assert_eq!(text_before, text_after);

    // And a third time there is nothing to gain.
    let (candidates, _) = read_all(&z);
    let again = crate::import::plan(&library, candidates, "Zotero", vec![]);
    assert!(again.items.iter().all(|item| item.action == crate::import::Action::Skip));
}

/// Reads the Zotero of whoever runs the test, if there is one, and says
/// what was found in numbers: nothing of what the library holds is shown.
/// Nothing is written.
#[test]
#[ignore]
fn the_zotero_of_this_machine() {
    use std::collections::BTreeMap;
    let found = find();
    println!("{} data directories", found.len());
    for dir in found {
        let info = inspect(&dir).unwrap();
        println!(
            "{} libraries, {} items, {} attachments, {} collections, {} warnings",
            info.libraries.len(),
            info.items,
            info.attachments,
            info.collections,
            info.warnings.len()
        );
        for library in &info.libraries {
            let options = Options { library: Some(library.id), attachments: true, notes: true, collection: None };
            let (candidates, warnings) = read(&dir, &options).unwrap();
            let empty = warnings.iter().filter(|w| w.ends_with("is empty and was left out.")).count();
            assert_eq!(candidates.len() + empty, library.items);
            assert!(collections(&dir, Some(library.id)).unwrap().len() <= info.collections);

            let mut types: BTreeMap<&str, usize> = BTreeMap::new();
            let mut fields: BTreeMap<&str, usize> = BTreeMap::new();
            let mut remarks: BTreeMap<String, usize> = BTreeMap::new();
            for c in &candidates {
                *types.entry(c.draft.entry_type.as_str()).or_default() += 1;
                for name in c.draft.fields.keys().chain(c.draft.names.keys()) {
                    *fields.entry(name.as_str()).or_default() += 1;
                }
                for note in &c.notes {
                    // Of a remark only the kind: what follows the colon is the user's.
                    let kind = match note.split_once(" has no counterpart") {
                        Some((field, _)) => field.to_owned(),
                        None if note.starts_with("The file") => "a file was not found".to_owned(),
                        None if note.starts_with("Zotero names") => "a name was left out".to_owned(),
                        None => "another remark".to_owned(),
                    };
                    *remarks.entry(kind).or_default() += 1;
                }
                assert!(c.files.iter().all(|file| Path::new(file).is_file()));
            }
            let files: usize = candidates.iter().map(|c| c.files.len()).sum();
            let placed = candidates.iter().filter(|c| !c.collections.is_empty()).count();
            let keyed = candidates.iter().filter(|c| !c.draft.key.is_empty()).count();
            println!(
                "{} candidates, {files} files, {placed} in collections, {keyed} with a key of their own",
                candidates.len()
            );
            println!("{} warnings, of which {empty} of empty items", warnings.len());
            println!("types: {types:?}");
            println!("fields: {fields:?}");
            println!("remarks: {remarks:#?}");
        }
    }
}
