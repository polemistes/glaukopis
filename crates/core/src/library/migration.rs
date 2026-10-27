//! The store of pictures taken into the library, once (ADR 0070).
//!
//! Before, images were kept in a store of their own beside the library:
//!
//! ```text
//! pictures/pictures.json             what was known and said of each
//! pictures/files/<hash>.<extension>  the images
//! pictures/small/                    lighter copies
//! ```
//!
//! and before that, each project kept its own in `projects/<id>/files/`.
//! Both are taken into the library's store under the hashes they had, so
//! that every figure finds its image as it did: recorded with their names,
//! the time they were taken in, their size and what they show, in a folder
//! of their own. What was said of them as a caption, and the notes on them,
//! are not taken: a caption is the document's, and notes belong to works.
//! The old store is then set aside under another name, never deleted here.

use std::fs;
use std::path::{Path, PathBuf};

use serde::Deserialize;

use crate::error::Result;
use crate::sidefile;
use crate::tr;

use super::files::FileRecord;
use super::{Library, attachments, figures, now};

/// What was known of a picture in the store of pictures, as far as it is taken.
#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
struct Old {
    hash: String,
    extension: String,
    name: String,
    added: String,
    width: Option<u32>,
    height: Option<u32>,
    alt: String,
}

/// What came of taking the pictures in.
#[derive(Debug, Default, PartialEq)]
pub struct Migrated {
    /// Images new to the library.
    pub moved: usize,
    /// Images the library had already, which were given what was known of them.
    pub same: usize,
    /// What could not be taken, a line each.
    pub problems: Vec<String>,
    /// Where the old store was set aside, where it was.
    pub aside: Option<PathBuf>,
}

/// Whether there is a store of pictures to take in: one with its record or
/// its files. An empty directory, as the application made at every start,
/// is nothing to take.
pub fn has_pictures(pictures_dir: &Path) -> bool {
    pictures_dir.join("pictures.json").is_file() || pictures_dir.join("files").is_dir()
}

impl Library {
    /// Takes the images of the store of pictures at `pictures_dir`, and of
    /// the directories where projects once kept their own, into the library,
    /// in the folder *Images* (made where there is at least one to take);
    /// then sets the store aside as `pictures.old-<date>` beside it, and
    /// takes away from the projects' directories what was taken. An image
    /// whose file is missing, or does not hold what its name says, is said
    /// and passed over. Nothing is done where there is nothing to take; an
    /// empty store is taken away.
    pub fn take_in_pictures(&mut self, pictures_dir: &Path, of_projects: &[PathBuf]) -> Result<Migrated> {
        let mut out = Migrated::default();
        let mut found: Vec<(PathBuf, Old)> = Vec::new();
        if has_pictures(pictures_dir) {
            let read = sidefile::read_json::<Vec<Old>>(&pictures_dir.join("pictures.json"))?;
            let known = read.or_default();
            let files = pictures_dir.join("files");
            for old in known {
                if !attachments::is_hash(&old.hash) || old.extension.contains(['/', '\\', '.']) {
                    continue;
                }
                let path = files.join(format!("{}.{}", old.hash, old.extension));
                found.push((path, old));
            }
            // Files the record did not know were known all the same, by their names.
            if let Ok(entries) = fs::read_dir(&files) {
                for entry in entries.flatten() {
                    if let Some(old) = named(&entry.path())
                        && !found.iter().any(|(_, f)| f.hash == old.hash)
                    {
                        found.push((entry.path(), old));
                    }
                }
            }
        }
        let mut from_projects = Vec::new();
        for dir in of_projects {
            let Ok(entries) = fs::read_dir(dir) else { continue };
            for entry in entries.flatten() {
                if let Some(old) = named(&entry.path()) {
                    from_projects.push(entry.path());
                    if !found.iter().any(|(_, f)| f.hash == old.hash) {
                        found.push((entry.path(), old));
                    }
                }
            }
        }

        let mut folder: Option<String> = None;
        let mut taken = Vec::new();
        for (path, old) in found {
            let shown =
                if old.name.trim().is_empty() { figures::shown_name("", &old.extension) } else { old.name.clone() };
            if !path.is_file() {
                out.problems.push(tr!("core-library-picture-missing", name = &shown));
                continue;
            }
            match attachments::hash_file(&path) {
                Ok(hash) if hash == old.hash => {}
                _ => {
                    out.problems.push(tr!("core-library-picture-not-itself", name = &shown));
                    continue;
                }
            }
            taken.push(path.clone());
            let (width, height) = match (old.width, old.height) {
                (Some(w), Some(h)) => (Some(w), Some(h)),
                _ => figures::measure(&path).map_or((None, None), |(w, h)| (Some(w), Some(h))),
            };
            if self.files.get(&old.hash).is_some() {
                self.files.add_image_facts(&old.hash, width, height, &old.alt);
                out.same += 1;
                continue;
            }
            let stored = match attachments::store_file(&self.dir, &path, &shown) {
                Ok(stored) => stored,
                Err(e) => {
                    out.problems.push(format!("{shown}: {e}"));
                    continue;
                }
            };
            let at = match &folder {
                Some(id) => id.clone(),
                None => {
                    let id = self.files.folder_named(&tr!("core-library-images-folder"), None)?.id;
                    folder = Some(id.clone());
                    id
                }
            };
            self.files.insert(FileRecord {
                hash: old.hash.clone(),
                path: stored,
                name: shown,
                folder: Some(at),
                origin: None,
                added: if old.added.is_empty() { now() } else { old.added },
                width,
                height,
                alt: old.alt.split_whitespace().collect::<Vec<_>>().join(" "),
                made_from: None,
            });
            out.moved += 1;
        }
        if out.moved > 0 || out.same > 0 {
            self.save_files()?;
        }

        // What projects kept is taken away where it was taken; their directories go where nothing else is left.
        for path in &from_projects {
            if taken.contains(path) {
                let _ = fs::remove_file(path);
            }
        }
        for dir in of_projects {
            let _ = fs::remove_dir(dir);
        }
        if has_pictures(pictures_dir) {
            let date: String = now().chars().take(10).collect();
            let mut aside = pictures_dir.with_file_name(format!("pictures.old-{date}"));
            let mut n = 2;
            while aside.exists() {
                aside = pictures_dir.with_file_name(format!("pictures.old-{date}-{n}"));
                n += 1;
            }
            fs::rename(pictures_dir, &aside)
                .map_err(|e| crate::error::Error::io(tr!("io-writing", path = pictures_dir), e))?;
            out.aside = Some(aside);
        } else {
            // Made empty by an earlier start, and nothing to keep.
            let _ = fs::remove_dir(pictures_dir);
        }
        Ok(out)
    }
}

/// A file named as the store of pictures named its files, `<hash>.<ending>`.
fn named(path: &Path) -> Option<Old> {
    let name = path.file_name()?.to_string_lossy().into_owned();
    let (hash, extension) = name.split_once('.')?;
    if !attachments::is_hash(hash) || !matches!(extension, "png" | "jpg" | "jpeg" | "svg") || !path.is_file() {
        return None;
    }
    Some(Old { hash: hash.to_owned(), extension: extension.to_owned(), ..Default::default() })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::library::attachments::hash_bytes;
    use crate::library::figures::fixtures::{PNG, SVG};

    #[test]
    fn the_store_of_pictures_is_taken_into_the_library_once() {
        let tmp = tempfile::tempdir().unwrap();
        let mut lib = Library::open_at(&tmp.path().join("library")).unwrap();
        let pictures = tmp.path().join("pictures");
        fs::create_dir_all(pictures.join("files")).unwrap();
        fs::create_dir_all(pictures.join("small")).unwrap();
        let png = hash_bytes(&PNG);
        let svg = hash_bytes(SVG.as_bytes());
        let lost = "1".repeat(64);
        let wrong = "2".repeat(64);
        fs::write(pictures.join("files").join(format!("{png}.png")), PNG).unwrap();
        fs::write(pictures.join("files").join(format!("{svg}.svg")), SVG).unwrap();
        fs::write(pictures.join("files").join(format!("{wrong}.png")), PNG).unwrap();
        let unknown = SVG.replace("30", "20");
        let unknown_hash = hash_bytes(unknown.as_bytes());
        fs::write(pictures.join("files").join(format!("{unknown_hash}.svg")), &unknown).unwrap();
        fs::write(
            pictures.join("pictures.json"),
            serde_json::json!([
                {"hash": png, "extension": "png", "name": "The vase.png", "size": 73, "width": 4, "height": 3,
                 "added": "2026-09-30T10:00:00Z", "caption": [{"kind": "text", "text": "A vase"}], "alt": "A vase with a lid", "note": "Florence"},
                {"hash": svg, "extension": "svg", "name": "Circle.svg", "added": "2026-10-01T10:00:00Z", "alt": ""},
                {"hash": lost, "extension": "png", "name": "Lost.png"},
                {"hash": wrong, "extension": "png", "name": "Wrong.png"}
            ])
            .to_string(),
        )
        .unwrap();
        // One the library has already, as a file of its own.
        let desk = tmp.path().join("circle drawing.svg");
        fs::write(&desk, SVG).unwrap();
        let (taken, _) = super::super::files::store_paths(
            lib.dir(),
            &[desk],
            false,
            &mut |_, _, _| {},
            &std::sync::atomic::AtomicBool::new(false),
        );
        lib.enter_taken(&taken, None).unwrap();
        // And one a project kept by itself.
        let project = tmp.path().join("projects").join("p1").join("files");
        fs::create_dir_all(&project).unwrap();
        let other = SVG.replace("30", "10");
        let other_hash = hash_bytes(other.as_bytes());
        fs::write(project.join(format!("{other_hash}.svg")), &other).unwrap();

        let got = lib.take_in_pictures(&pictures, std::slice::from_ref(&project)).unwrap();
        assert_eq!((got.moved, got.same), (3, 1), "{got:?}");
        assert_eq!(got.problems.len(), 2, "{:?}", got.problems);
        let aside = got.aside.clone().unwrap();
        assert!(aside.file_name().unwrap().to_string_lossy().starts_with("pictures.old-"));
        assert!(aside.join("pictures.json").is_file(), "set aside as it was");
        assert!(!pictures.exists());
        assert!(!project.exists(), "what a project kept is taken away");

        let vase = lib.file_view(&png).unwrap();
        assert_eq!(vase.name, "The vase.png");
        assert_eq!((vase.width, vase.height, vase.alt.as_str()), (Some(4), Some(3), "A vase with a lid"));
        assert_eq!(vase.added, "2026-09-30T10:00:00Z");
        let images = lib.files.folder(vase.folder.as_deref().unwrap()).unwrap();
        assert_eq!((images.name.as_str(), images.parent.as_deref()), ("Images", None));
        assert!(lib.attachment_path(&vase.path).unwrap().is_file());
        // The one the library had keeps its place and name.
        let circle = lib.file_view(&svg).unwrap();
        assert_eq!((circle.name.as_str(), circle.folder.as_deref()), ("circle drawing.svg", None));
        assert_eq!(lib.file_view(&unknown_hash).unwrap().name, "image.svg");
        assert!(lib.file_view(&other_hash).is_some());
        assert!(lib.file_view(&lost).is_none());
        let written = fs::read_to_string(lib.dir().join(super::super::files::FILE)).unwrap();
        assert!(!written.contains("Florence") && !written.contains("caption"));

        // Again: nothing to take, nothing done.
        let again = lib.take_in_pictures(&pictures, &[]).unwrap();
        assert_eq!(again, Migrated::default());
        // An empty store, as the application made at every start, is taken away.
        fs::create_dir_all(&pictures).unwrap();
        assert_eq!(lib.take_in_pictures(&pictures, &[]).unwrap(), Migrated::default());
        assert!(!pictures.exists());
    }
}
