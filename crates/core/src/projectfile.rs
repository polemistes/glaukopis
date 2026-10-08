//! A project as one file (ADR 0036): saved to be carried elsewhere, and
//! opened as a new project.
//!
//! A project file is a zip:
//!
//! ```text
//! manifest.json            the format, the name and description, when and by what it was written
//! document.bin             the document as it is now, as one state of Yjs
//! pictures.json            what the store says of each picture that comes with it
//! pictures/<hash>.<ext>    the pictures its figures show
//! references.bib           the works it cites, as BibLaTeX, for anyone who would read them
//! ```
//!
//! The document is the interface's (ADR 0002), and is not read here: the
//! interface sends it whole, with the records of the works it cites, and is
//! given it back. What is done here is the file, the pictures, and the
//! references, which are resolved against the library before a project is
//! made of the file.

use std::collections::{BTreeMap, HashMap, HashSet};
use std::io::{Cursor, Read, Seek, Write};
use std::path::Path;

use serde::{Deserialize, Serialize};

use crate::bib::names::Person;
use crate::duplicates;
use crate::error::{Error, IoContext, Result};
use crate::fsutil::write_atomic;
use crate::import::{CertaintyWord, ReasonWord, SummaryLite, fill_missing};
use crate::library::{Draft, Entry, Library, now};
use crate::pictures::{self, Change, Picture, Pictures};
use crate::tr;

/// The form of the file this version writes, and the latest it reads.
pub const FORMAT: u32 = 1;
/// What the name of a project file ends in.
pub const ENDING: &str = "glaukopis";

const MANIFEST: &str = "manifest.json";
const DOCUMENT: &str = "document.bin";
const PICTURES: &str = "pictures.json";
const PICTURE_DIR: &str = "pictures/";
const REFERENCES: &str = "references.bib";

/// The most the document may hold, and what is said of the pictures.
const MOST_DOCUMENT: u64 = 1 << 30;
const MOST_SAID: u64 = 64 << 20;

const BIB_HEADER: &str = "\
% The works cited in a project of Glaukopis, as BibLaTeX, UTF-8.
% The project itself is in document.bin, beside this file.

";

/// What a project file says of itself.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Manifest {
    pub format: u32,
    pub name: String,
    pub description: String,
    /// When it was written.
    pub written: String,
    /// By which version of the application.
    pub app: String,
}

/// A work as the document of a project keeps it (`RefRecord` in the
/// interface): what is written in the file, and compared with the library.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Record {
    pub id: String,
    pub key: String,
    #[serde(rename = "type")]
    pub entry_type: String,
    pub fields: BTreeMap<String, String>,
    pub names: BTreeMap<String, Vec<Person>>,
}

impl Record {
    pub fn draft(&self) -> Draft {
        Draft {
            key: self.key.clone(),
            entry_type: self.entry_type.clone(),
            fields: self.fields.clone(),
            names: self.names.clone(),
        }
    }

    /// Whether an entry of the library is this work as it is written here:
    /// the same type, key, fields and names.
    pub fn is(&self, entry: &Entry) -> bool {
        Draft::from_entry(entry) == self.draft()
    }
}

fn zip_error(e: zip::result::ZipError) -> Error {
    Error::invalid(tr!("core-projectfile-unreadable", error = e.to_string()))
}

fn writing_error(e: impl std::fmt::Display) -> Error {
    Error::invalid(tr!("core-projectfile-unwritable", error = e.to_string()))
}

/// The works as BibLaTeX: each record as the library would write it, without
/// the application's own fields, and after them the works they are part of
/// (`crossref`, `xref`) that the library has and the records do not.
pub fn references_bib(records: &[Record], library: Option<&Library>) -> String {
    let mut out = String::from(BIB_HEADER);
    let mut entries: Vec<Entry> = records.iter().map(|r| r.draft().to_entry()).collect();
    entries.sort_by_key(|e| e.key.to_lowercase());
    let mut keys: HashSet<String> = entries.iter().map(|e| e.key.to_lowercase()).collect();
    if let Some(library) = library {
        let mut i = 0;
        while i < entries.len() {
            for field in ["crossref", "xref"] {
                if let Some(parent) = entries[i].get(field).and_then(|k| library.by_key(k))
                    && keys.insert(parent.key.to_lowercase())
                {
                    entries.push(parent.clone());
                }
            }
            i += 1;
        }
    }
    for e in &entries {
        out.push_str(&e.to_bib(false, false));
        out.push('\n');
    }
    out
}

/// What is written into a project file.
pub struct Contents<'a> {
    /// The name and the description; the rest is filled in when it is written.
    pub manifest: Manifest,
    /// The document, as one state.
    pub state: &'a [u8],
    /// The pictures the figures show, by their hash.
    pub pictures: &'a [String],
    /// The works cited, as the document keeps them.
    pub records: &'a [Record],
}

/// The file, as bytes. A picture the store does not have is left out: the
/// figure that shows it is without it here as well.
pub fn to_bytes(contents: &Contents<'_>, store: &Pictures, library: Option<&Library>) -> Result<Vec<u8>> {
    let manifest = Manifest { format: FORMAT, written: now(), ..contents.manifest.clone() };
    let mut zip = zip::ZipWriter::new(Cursor::new(Vec::new()));
    let packed = zip::write::SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);
    // Pictures are packed already.
    let stored =
        zip::write::SimpleFileOptions::default().compression_method(zip::CompressionMethod::Stored).large_file(true);
    let mut put = |name: &str, bytes: &[u8], options| -> Result<()> {
        zip.start_file(name, options).map_err(writing_error)?;
        zip.write_all(bytes).map_err(writing_error)
    };

    put(MANIFEST, serde_json::to_string_pretty(&manifest)?.as_bytes(), packed)?;
    put(DOCUMENT, contents.state, packed.large_file(contents.state.len() as u64 >= u32::MAX as u64))?;

    let mut said: Vec<Picture> = Vec::new();
    let mut seen = HashSet::new();
    for hash in contents.pictures {
        if !seen.insert(hash.as_str()) {
            continue;
        }
        let Ok(picture) = store.get(hash) else { continue };
        let Ok(bytes) = store.read(&picture.hash, &picture.extension) else { continue };
        let options = if picture.extension == "svg" { packed } else { stored };
        put(&format!("{PICTURE_DIR}{}.{}", picture.hash, picture.extension), &bytes, options)?;
        said.push(picture);
    }
    put(PICTURES, serde_json::to_string_pretty(&said)?.as_bytes(), packed)?;
    put(REFERENCES, references_bib(contents.records, library).as_bytes(), packed)?;

    Ok(zip.finish().map_err(writing_error)?.into_inner())
}

/// Writes a project file.
pub fn write(path: &Path, contents: &Contents<'_>, store: &Pictures, library: Option<&Library>) -> Result<()> {
    write_atomic(path, &to_bytes(contents, store, library)?)
}

/// A project file as it was read.
#[derive(Debug, Clone, Default)]
pub struct Opened {
    pub manifest: Manifest,
    pub state: Vec<u8>,
    /// The pictures, each with what the store it came from says of it.
    pub pictures: Vec<(Picture, Vec<u8>)>,
}

/// Reads one part of the file, no more than `most` bytes of it.
fn part<R: Read + Seek>(archive: &mut zip::ZipArchive<R>, name: &str, most: u64) -> Result<Option<Vec<u8>>> {
    let file = match archive.by_name(name) {
        Ok(file) => file,
        Err(zip::result::ZipError::FileNotFound) => return Ok(None),
        Err(e) => return Err(zip_error(e)),
    };
    if file.size() > most {
        return Err(Error::invalid(tr!("core-projectfile-too-large", name = name)));
    }
    let mut bytes = Vec::with_capacity(file.size() as usize);
    file.take(most + 1).read_to_end(&mut bytes).context(|| tr!("core-projectfile-reading"))?;
    if bytes.len() as u64 > most {
        return Err(Error::invalid(tr!("core-projectfile-too-large", name = name)));
    }
    Ok(Some(bytes))
}

/// Reads a project file from what it holds.
pub fn read_from<R: Read + Seek>(source: R) -> Result<Opened> {
    let not_one = || Error::invalid(tr!("core-projectfile-not-one"));
    let mut archive = zip::ZipArchive::new(source).map_err(|_| not_one())?;
    let manifest = part(&mut archive, MANIFEST, MOST_SAID)?.ok_or_else(not_one)?;
    let manifest: Manifest = serde_json::from_slice(&manifest).map_err(|_| not_one())?;
    if manifest.format == 0 {
        return Err(not_one());
    }
    if manifest.format > FORMAT {
        return Err(Error::invalid(tr!("core-projectfile-later", format = manifest.format)));
    }
    let state = part(&mut archive, DOCUMENT, MOST_DOCUMENT)?
        .filter(|s| !s.is_empty())
        .ok_or_else(|| Error::invalid(tr!("core-projectfile-no-document")))?;

    let said: Vec<Picture> = match part(&mut archive, PICTURES, MOST_SAID)? {
        Some(bytes) => serde_json::from_slice(&bytes).unwrap_or_default(),
        None => Vec::new(),
    };
    let names: Vec<String> = archive.file_names().filter(|n| n.starts_with(PICTURE_DIR)).map(str::to_owned).collect();
    let mut pictures = Vec::new();
    for name in names {
        let Some((hash, extension)) = name[PICTURE_DIR.len()..].split_once('.') else { continue };
        if !pictures::is_hash(hash) {
            continue;
        }
        let Some(bytes) = part(&mut archive, &name, pictures::MAX_BYTES)? else { continue };
        let picture = said.iter().find(|p| p.hash == hash).cloned().unwrap_or_else(|| Picture {
            hash: hash.to_owned(),
            extension: extension.to_owned(),
            ..Default::default()
        });
        pictures.push((picture, bytes));
    }
    Ok(Opened { manifest, state, pictures })
}

pub fn read(path: &Path) -> Result<Opened> {
    let file = std::fs::File::open(path).context(|| tr!("io-opening", path = path))?;
    read_from(std::io::BufReader::new(file))
}

/// Takes the pictures of a file into the store. One the store has is the
/// same picture, and what the store says of it is kept; one it lacks is
/// added, with what the file says of it. A picture that is not what its
/// name says is left out. Returns how many were added.
pub fn take_pictures(store: &Pictures, pictures: &[(Picture, Vec<u8>)]) -> usize {
    let mut added = 0;
    for (said, bytes) in pictures {
        if store.get(&said.hash).is_ok() {
            continue;
        }
        let kept = match store.keep(&said.hash, bytes, &said.name) {
            Ok(kept) => kept,
            Err(e) => {
                tracing::warn!(%e, hash = %said.hash, "a picture of a project file was left out");
                continue;
            }
        };
        added += 1;
        let change = Change {
            name: None,
            caption: (!said.caption.is_null()).then(|| said.caption.clone()),
            alt: (!said.alt.is_empty()).then(|| said.alt.clone()),
            note: (!said.note.is_empty()).then(|| said.note.clone()),
        };
        if (change.caption.is_some() || change.alt.is_some() || change.note.is_some())
            && let Err(e) = store.update(&kept.hash, change)
        {
            tracing::warn!(%e, "what a project file says of a picture was not kept");
        }
    }
    added
}

// ---- the references ----

/// What a work of a project file is to the library.
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "kind", rename_all = "kebab-case")]
pub enum Finding {
    /// The library has an entry of its id, and it is the same.
    Same,
    /// The library has an entry of its id, and it differs.
    Differs { library: SummaryLite },
    /// The library has no entry of its id, and none like it: it is added
    /// under its id.
    New,
    /// The library has no entry of its id, but one that is the same work.
    /// `merged` where the id is that of an entry merged into it.
    Alike {
        id: String,
        library: SummaryLite,
        certainty: CertaintyWord,
        reasons: Vec<ReasonWord>,
        merged: bool,
        /// What the library's entry would gain from the file's.
        gains: Vec<String>,
    },
}

/// A work of the file, and what it is to the library.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Found {
    pub id: String,
    /// The work as the file has it.
    pub file: SummaryLite,
    pub finding: Finding,
}

fn lite(entry: &Entry) -> SummaryLite {
    SummaryLite::from(&entry.summary())
}

/// What each work of a project file is to the library.
pub fn examine(library: &Library, records: &[Record]) -> Vec<Found> {
    records
        .iter()
        .map(|record| {
            let draft = record.draft();
            let theirs = draft.to_entry();
            let finding = if let Some(entry) = library.get(&record.id) {
                if record.is(entry) { Finding::Same } else { Finding::Differs { library: lite(entry) } }
            } else if let Some(entry) = library.resolve(&record.id) {
                Finding::Alike {
                    id: entry.id.clone(),
                    library: lite(entry),
                    certainty: CertaintyWord::Certain,
                    reasons: Vec::new(),
                    merged: true,
                    gains: fill_missing(entry, &draft).1,
                }
            } else {
                let print = duplicates::fingerprint(&theirs);
                match library.duplicates_index().find(&print, None).into_iter().next() {
                    Some(m) => {
                        let entry = &library.entries()[m.index];
                        Finding::Alike {
                            id: entry.id.clone(),
                            library: lite(entry),
                            certainty: m.certainty.into(),
                            reasons: m.reasons.into_iter().map(Into::into).collect(),
                            merged: false,
                            gains: fill_missing(entry, &draft).1,
                        }
                    }
                    None => Finding::New,
                }
            };
            Found { id: record.id.clone(), file: lite(&theirs), finding }
        })
        .collect()
}

/// What is done with a work of the file that is asked about.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Choice {
    /// Of an entry of the same id that differs: the library's stays, and
    /// the project shows it.
    Library,
    /// Of an entry of the same id that differs: the file's takes its place.
    File,
    /// Of an entry of the same id that differs: the file's becomes an entry
    /// of its own, with an id of its own.
    Both,
    /// Of one that is alike: the library's is cited, and gains what it lacks.
    Cite,
    /// Of one that is alike: the file's is added, as another work, under its id.
    Another,
}

impl Choice {
    /// What is chosen where nothing is said.
    pub fn given(finding: &Finding) -> Option<Choice> {
        match finding {
            Finding::Same | Finding::New => None,
            Finding::Differs { .. } => Some(Choice::Library),
            Finding::Alike { certainty: CertaintyWord::Certain, .. } => Some(Choice::Cite),
            Finding::Alike { .. } => Some(Choice::Another),
        }
    }
}

/// By which id a work of the file is cited once it is settled.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Settled {
    /// Its id in the file.
    pub from: String,
    /// The id of the library's entry the project is to cite.
    pub to: String,
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Settlement {
    pub settled: Vec<Settled>,
    /// The works added to the library, by their ids.
    pub added: Vec<String>,
    /// The entries of the library that were changed.
    pub changed: Vec<String>,
    /// What could not be done, in words. A work that is here is cited by
    /// its id in the file.
    pub problems: Vec<String>,
}

/// Brings the works of a project file into the library as was chosen (see
/// `Choice`; what is not chosen is as `Choice::given` says), and says by
/// which id each is to be cited. What each is to the library is found as
/// `examine` finds it, once, before anything is changed.
pub fn settle(library: &mut Library, records: &[Record], choices: &HashMap<String, Choice>) -> Result<Settlement> {
    library.refresh()?;
    let found = examine(library, records);
    let mut out = Settlement::default();
    for (record, found) in records.iter().zip(&found) {
        let choice = choices.get(&record.id).copied().or_else(|| Choice::given(&found.finding));
        let draft = record.draft();
        let done: Result<String> = match (&found.finding, choice) {
            (Finding::Same, _) | (Finding::Differs { .. }, Some(Choice::Library) | None) => Ok(record.id.clone()),
            (Finding::Differs { .. }, Some(Choice::File)) => {
                let kept = library.require(&record.id)?.key.clone();
                let result = match library.apply(&record.id, &draft) {
                    // A key another entry has: the entry keeps its own.
                    Err(e) if e.kind() == "key" => library.apply(&record.id, &Draft { key: kept, ..draft }),
                    other => other,
                };
                result.map(|e| {
                    out.changed.push(e.id.clone());
                    e.id
                })
            }
            (Finding::Differs { .. }, Some(_)) => library.insert(&draft, false).map(|e| {
                out.added.push(e.id.clone());
                e.id
            }),
            (Finding::Alike { id, gains, .. }, Some(Choice::Cite) | None) => {
                if gains.is_empty() {
                    Ok(id.clone())
                } else {
                    let existing = library.require(id)?.clone();
                    let (filled, _) = fill_missing(&existing, &draft);
                    library.apply(id, &filled).map(|e| {
                        out.changed.push(e.id.clone());
                        e.id
                    })
                }
            }
            (Finding::New, _) | (Finding::Alike { .. }, Some(_)) => {
                library.insert_with_id(&record.id, &draft).map(|e| {
                    out.added.push(e.id.clone());
                    e.id
                })
            }
        };
        let to = match done {
            Ok(to) => to,
            Err(e) => {
                out.problems.push(format!("{}: {e}", describe(&found.file)));
                record.id.clone()
            }
        };
        out.settled.push(Settled { from: record.id.clone(), to });
    }
    if !out.added.is_empty() || !out.changed.is_empty() {
        library.save()?;
    }
    Ok(out)
}

fn describe(s: &SummaryLite) -> String {
    let said: Vec<&str> =
        [s.authors.as_str(), s.year.as_str(), s.title.as_str()].into_iter().filter(|w| !w.trim().is_empty()).collect();
    if said.is_empty() { s.key.clone() } else { said.join(" ") }
}

#[cfg(test)]
mod tests;
