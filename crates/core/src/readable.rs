//! The readable copy of a project (ADR 0041): its Org form, the works it
//! cites as BibLaTeX, and the pictures it shows, in a folder: the project's
//! own, kept up at every save, or one the writer chooses. Anyone can read it
//! without this application, and Org mode, Pandoc and the like open it.
//!
//! The interface writes the Org form; the core puts the three together:
//!
//! ```text
//! project.org
//! references.bib
//! pictures/<hash>.<extension>
//! ```
//!
//! The copy is written and never read back, but by opening an Org file as a
//! new project. Pictures are linked to the library where the file system
//! allows it, so that they take no room twice, and copied where it does not.

use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

use crate::error::{Error, IoContext, Result};
use crate::fsutil::write_atomic;
use crate::library::Library;
use crate::library::attachments::is_hash;
use crate::library::figures::Images;
use crate::projectfile::{Picture, Record, references_bib};
use crate::tr;

/// The name of the Org form in the folder.
pub const ORG: &str = "project.org";
/// The name of the works it cites.
pub const BIB: &str = "references.bib";
/// The folder of the pictures.
pub const PICTURES: &str = "pictures";

/// What is written: the Org form, the works it cites, and its pictures by their hash.
pub struct Readable<'a> {
    pub org: &'a str,
    pub records: &'a [Record],
    pub pictures: &'a [String],
}

/// Writes the readable copy into `dir`: the Org form and the works anew,
/// the pictures that are not there yet, and none that the project no longer
/// shows. A picture the library lacks is left out.
pub fn write(dir: &Path, readable: &Readable<'_>, images: &impl Images, library: Option<&Library>) -> Result<()> {
    fs::create_dir_all(dir).context(|| tr!("io-creating", path = dir))?;
    write_atomic(&dir.join(ORG), readable.org.as_bytes())?;
    write_atomic(&dir.join(BIB), references_bib(readable.records, library).as_bytes())?;
    let pictures = dir.join(PICTURES);
    let mut wanted = HashSet::new();
    let mut lacking: Vec<&str> = Vec::new();
    for hash in readable.pictures {
        let Some((image, from)) = images.image(hash) else {
            lacking.push(hash);
            continue;
        };
        let name = format!("{}.{}", image.hash, image.extension);
        wanted.insert(name.clone());
        let to = pictures.join(&name);
        if to.is_file() {
            continue;
        }
        fs::create_dir_all(&pictures).context(|| tr!("io-creating", path = &pictures))?;
        if fs::hard_link(&from, &to).is_err() {
            fs::copy(&from, &to).context(|| tr!("io-writing", path = &to))?;
        }
    }
    // Pictures the project no longer shows go; nothing else in the folder is touched.
    if let Ok(entries) = fs::read_dir(&pictures) {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().into_owned();
            let ours = name.split_once('.').is_some_and(|(hash, _)| is_hash(hash));
            if ours
                && !wanted.contains(&name)
                && let Err(e) = fs::remove_file(entry.path())
            {
                tracing::warn!(%e, picture = name, "a picture the project no longer shows could not be taken out of its readable copy");
            }
        }
    }
    if !lacking.is_empty() {
        // The copy is written at every save: one line for all that are lacking.
        tracing::warn!(pictures = ?lacking, "pictures the project shows are not in the library, and are not in its readable copy");
    }
    Ok(())
}

/// What a readable copy holds, read back: the Org form, the works as
/// BibLaTeX (empty where there are none), and the pictures beside it.
pub struct Read {
    pub org: String,
    pub bib: String,
    pub pictures: Vec<(Picture, Vec<u8>)>,
}

/// The most a picture beside an Org file may weigh, so that a folder of other things is not taken in whole.
const MOST_PICTURE: u64 = 64 * 1024 * 1024;

/// Reads a readable copy: `path` is the Org file, or the folder that holds `project.org`.
pub fn read(path: &Path) -> Result<Read> {
    let file: PathBuf = if path.is_dir() { path.join(ORG) } else { path.to_path_buf() };
    let org = fs::read_to_string(&file).context(|| tr!("io-reading", path = &file))?;
    let dir = file.parent().map(Path::to_path_buf).unwrap_or_default();
    // The works it cites: none when there is no file of them, and an error
    // when there is one that cannot be read, lest the project be opened
    // without its references and no word why.
    let bib_path = dir.join(BIB);
    let bib = match fs::read_to_string(&bib_path) {
        Ok(bib) => bib,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => String::new(),
        Err(e) => return Err(e).context(|| tr!("io-reading", path = &bib_path)),
    };
    let mut pictures = Vec::new();
    if let Ok(entries) = fs::read_dir(dir.join(PICTURES)) {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().into_owned();
            let Some((hash, extension)) = name.split_once('.') else { continue };
            if !is_hash(hash) || entry.metadata().is_ok_and(|m| m.len() > MOST_PICTURE) {
                continue;
            }
            let bytes = match fs::read(entry.path()) {
                Ok(bytes) => bytes,
                Err(e) => {
                    tracing::warn!(%e, picture = name, "a picture beside an Org file could not be read, and is left out");
                    continue;
                }
            };
            let picture = Picture {
                hash: hash.to_owned(),
                extension: extension.to_ascii_lowercase(),
                name: name.clone(),
                size: bytes.len() as u64,
                ..Default::default()
            };
            pictures.push((picture, bytes));
        }
    }
    if org.trim().is_empty() {
        return Err(Error::invalid(tr!("core-readable-empty")));
    }
    Ok(Read { org, bib, pictures })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::BTreeMap;

    fn record() -> Record {
        let mut fields = BTreeMap::new();
        fields.insert("title".to_owned(), "The Best of the Achaeans".to_owned());
        fields.insert("date".to_owned(), "1979".to_owned());
        Record { id: "r1".into(), key: "nagy1979".into(), entry_type: "book".into(), fields, names: BTreeMap::new() }
    }

    #[test]
    fn writes_the_org_form_the_works_and_the_pictures_and_reads_them_back() {
        let tmp = tempfile::tempdir().unwrap();
        let mut store = Library::open_at(&tmp.path().join("store")).unwrap();
        // A one-pixel PNG.
        let png = [
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, b'I', b'H', b'D', b'R', 0, 0, 0, 1, 0, 0, 0,
            1, 8, 6, 0, 0, 0, 0x1f, 0x15, 0xc4, 0x89, 0, 0, 0, 10, b'I', b'D', b'A', b'T', 0x78, 0x9c, 0x63, 0, 1, 0,
            0, 5, 0, 1, 0x0d, 0x0a, 0x2d, 0xb4, 0, 0, 0, 0, b'I', b'E', b'N', b'D', 0xae, 0x42, 0x60, 0x82,
        ];
        let picture = store.add_image("dot.png", &png, None, None).unwrap().0;
        let dir = tmp.path().join("project");
        let records = [record()];
        let readable =
            Readable { org: "* Medea\nThe text.\n", records: &records, pictures: std::slice::from_ref(&picture.hash) };
        write(&dir, &readable, &store, None).unwrap();
        assert_eq!(fs::read_to_string(dir.join(ORG)).unwrap(), "* Medea\nThe text.\n");
        assert!(fs::read_to_string(dir.join(BIB)).unwrap().contains("@book{nagy1979,"));
        let name = format!("{}.png", picture.hash);
        assert!(dir.join(PICTURES).join(&name).is_file());

        // A picture no longer shown goes, and what is not a picture of ours stays.
        fs::write(dir.join(PICTURES).join("notes.txt"), "mine").unwrap();
        write(&dir, &Readable { org: "* Medea\n", records: &[], pictures: &[] }, &store, None).unwrap();
        assert!(!dir.join(PICTURES).join(&name).exists());
        assert!(dir.join(PICTURES).join("notes.txt").exists());

        write(&dir, &readable, &store, None).unwrap();
        let read_back = read(&dir).unwrap();
        assert!(read_back.org.starts_with("* Medea"));
        assert!(read_back.bib.contains("nagy1979"));
        assert_eq!(read_back.pictures.len(), 1);
        assert_eq!(read_back.pictures[0].0.hash, picture.hash);
        // The file itself may be named as well as its folder.
        assert!(read(&dir.join(ORG)).is_ok());
    }

    #[test]
    fn an_empty_org_file_is_no_project() {
        let tmp = tempfile::tempdir().unwrap();
        fs::write(tmp.path().join(ORG), "  \n").unwrap();
        assert!(read(tmp.path()).is_err());
    }

    #[test]
    fn works_that_are_there_and_cannot_be_read_are_not_taken_for_none() {
        let tmp = tempfile::tempdir().unwrap();
        fs::write(tmp.path().join(ORG), "* Wrath\n").unwrap();
        assert_eq!(read(tmp.path()).unwrap().bib, "", "none there, none read");
        // Not UTF-8, as an editor that saves in Latin-1 writes it.
        fs::write(tmp.path().join(BIB), b"@book{a, author = {M\xfcller}}").unwrap();
        let said = read(tmp.path()).err().unwrap().to_string();
        assert!(said.contains(BIB), "{said}");
    }
}
