//! The readable copy of the notebook (record 0104): its Org form, the
//! pictures its notes show and the files they hold, in the notebook's own
//! folder, kept up a moment after the notebook is saved:
//!
//! ```text
//! notebook.org
//! pictures/<hash>.<extension>
//! files/<name>
//! ```
//!
//! The interface writes the Org form; the core puts the three together.
//! The copy is written and never read back. Pictures and files are linked
//! to the store where the file system allows it, so that they take no room
//! twice, and copied where it does not.

use std::collections::HashSet;
use std::fs;
use std::path::Path;

use crate::error::{IoContext, Result};
use crate::fsutil::write_atomic;
use crate::library::Library;
use crate::library::attachments::is_hash;
use crate::library::figures::Images;
use crate::tr;

/// The name of the Org form in the folder.
pub const ORG: &str = "notebook.org";
/// The folder of the pictures the notes show.
pub const PICTURES: &str = "pictures";
/// The folder of the files the notes hold.
pub const FILES: &str = "files";

/// A file a note holds, as the copy names it.
pub struct Held<'a> {
    pub hash: &'a str,
    pub name: &'a str,
}

/// A name a file may be written under in the folder of files: the name
/// itself and nothing of a path; none where it would lead elsewhere.
fn safe_name(name: &str) -> Option<&str> {
    let name = name.trim();
    let plain = !name.is_empty()
        && name != "."
        && name != ".."
        && !name.starts_with('.')
        && !name.contains(['/', '\\', '\0'])
        && Path::new(name).file_name().is_some_and(|n| n == name);
    plain.then_some(name)
}

/// Puts a file of the store into the copy under a name: linked, or copied
/// where it cannot be linked. What is there already under the name is left.
fn put(from: &Path, folder: &Path, name: &str) -> Result<()> {
    let to = folder.join(name);
    if to.is_file() {
        return Ok(());
    }
    fs::create_dir_all(folder).context(|| tr!("io-creating", path = folder))?;
    if fs::hard_link(from, &to).is_err() {
        fs::copy(from, &to).context(|| tr!("io-writing", path = &to))?;
    }
    Ok(())
}

/// Takes out of a folder of the copy what the notebook no longer has there.
fn tidy(folder: &Path, wanted: &HashSet<String>, ours: impl Fn(&str) -> bool) {
    let Ok(entries) = fs::read_dir(folder) else { return };
    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().into_owned();
        if ours(&name)
            && !wanted.contains(&name)
            && let Err(e) = fs::remove_file(entry.path())
        {
            tracing::warn!(%e, name, "what the notebook no longer holds could not be taken out of its readable copy");
        }
    }
}

/// Writes the readable copy into `dir`: the Org form anew, the pictures and
/// the files that are not there yet, and none that the notes no longer show
/// or hold. What the store lacks is left out. In the folder of files, a file
/// that was changed since under the same name is not written over: the copy
/// names files by what they are called, and a file of the store never
/// changes.
pub fn write(dir: &Path, org: &str, pictures: &[String], files: &[Held<'_>], library: &Library) -> Result<()> {
    fs::create_dir_all(dir).context(|| tr!("io-creating", path = dir))?;
    write_atomic(&dir.join(ORG), org.as_bytes())?;

    let folder = dir.join(PICTURES);
    let mut wanted = HashSet::new();
    let mut lacking: Vec<&str> = Vec::new();
    for hash in pictures {
        let Some((image, from)) = library.image(hash) else {
            lacking.push(hash);
            continue;
        };
        let name = format!("{}.{}", image.hash, image.extension);
        put(&from, &folder, &name)?;
        wanted.insert(name);
    }
    // Pictures the notes no longer show go; nothing else in the folder is touched.
    tidy(&folder, &wanted, |name| name.split_once('.').is_some_and(|(hash, _)| is_hash(hash)));

    let folder = dir.join(FILES);
    let mut wanted = HashSet::new();
    for file in files {
        let (Some(name), Some(from)) = (safe_name(file.name), library.stored_path(file.hash)) else {
            lacking.push(file.hash);
            continue;
        };
        put(&from, &folder, name)?;
        wanted.insert(name.to_owned());
    }
    // The folder of files is the copy's own: what the notes no longer hold goes.
    tidy(&folder, &wanted, |_| true);

    if !lacking.is_empty() {
        // The copy is written at every save: one line for all that are lacking.
        tracing::warn!(lacking = ?lacking, "what the notes hold is not in the store, or has a name that cannot be written, and is not in the notebook's readable copy");
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::paths::DataDir;

    #[test]
    fn the_copy_holds_the_org_form_the_pictures_and_the_files_and_drops_what_is_gone() {
        let tmp = tempfile::tempdir().unwrap();
        let data = DataDir::open(tmp.path().join("data")).unwrap();
        let mut library = Library::open(&data).unwrap();
        // A picture and a file of the notebook's, taken into the store.
        let png: Vec<u8> = {
            let mut out = Vec::new();
            let image = image::RgbImage::from_pixel(4, 3, image::Rgb([200, 30, 30]));
            image::DynamicImage::ImageRgb8(image)
                .write_to(&mut std::io::Cursor::new(&mut out), image::ImageFormat::Png)
                .unwrap();
            out
        };
        let picture = library.notebook_take_image("owl.png", &png).unwrap();
        let source = tmp.path().join("Letter.pdf");
        fs::write(&source, b"%PDF-1.4 a letter").unwrap();
        let stored = crate::library::attachments::store_file(library.dir(), &source, "Letter.pdf").unwrap();
        let taken = crate::library::files::Taken { stored, folders: Vec::new(), origin: source.display().to_string() };
        let letter = library.notebook_take(&[taken]).unwrap().remove(0);

        let dir = tmp.path().join("copy");
        let files =
            [Held { hash: &letter.hash, name: "Letter.pdf" }, Held { hash: &letter.hash, name: "../outside.pdf" }];
        write(&dir, "* Unsorted\n", &[picture.hash.clone(), "0".repeat(64)], &files, &library).unwrap();
        assert_eq!(fs::read_to_string(dir.join(ORG)).unwrap(), "* Unsorted\n");
        assert!(dir.join(PICTURES).join(format!("{}.png", picture.hash)).is_file());
        assert_eq!(fs::read(dir.join(FILES).join("Letter.pdf")).unwrap(), b"%PDF-1.4 a letter");
        // A name that would lead out of the folder is not written anywhere.
        assert!(!tmp.path().join("outside.pdf").exists() && !dir.join("outside.pdf").exists());

        // What the notes no longer show or hold goes; the Org form is written anew.
        write(&dir, "* Unsorted\n** A note\n", &[], &[], &library).unwrap();
        assert_eq!(fs::read_to_string(dir.join(ORG)).unwrap(), "* Unsorted\n** A note\n");
        assert_eq!(fs::read_dir(dir.join(PICTURES)).unwrap().count(), 0);
        assert_eq!(fs::read_dir(dir.join(FILES)).unwrap().count(), 0);
    }

    #[test]
    fn a_name_is_the_name_itself_and_nothing_of_a_path() {
        assert_eq!(safe_name(" Letter.pdf "), Some("Letter.pdf"));
        for bad in ["", ".", "..", ".hidden", "a/b", "a\\b", "../x"] {
            assert_eq!(safe_name(bad), None, "{bad}");
        }
    }
}
