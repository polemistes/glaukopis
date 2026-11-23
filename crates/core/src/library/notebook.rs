//! The files of the notebook's notes, in the library's store (see
//! `crate::notebook`). A file a note holds has a record as every file of the
//! store has, which says that the notebook holds it (`files::Held`): beside
//! the library (`also`), or alone (`only`), when the library's lists leave
//! it out. The library that removes a file the notebook holds removes it
//! from its lists alone; the notebook says, once in a run, which files its
//! notes hold, and those it held alone that no note holds leave the store.
//! That is said of the files the notebook held when the run began: what a
//! note is given in the run is left to the next (`notebook_sweep_of_run`).

use std::collections::HashSet;

use crate::error::{Error, Result};
use crate::tr;

use super::files::{self, FileKind, Held};
use super::{FileRecord, FileView, Library, attachments, figures, now, small};

/// Whether an origin is no more than the path of a file it was copied from:
/// an address says more, and takes its place.
fn is_path(origin: &str) -> bool {
    !origin.contains("://")
}

impl Library {
    /// Enters a file of the store that a note has come to hold: one the
    /// record does not know is the notebook's alone, in no folder; one the
    /// library has is held beside it. Whether the record changed.
    fn enter_held(&mut self, stored: &str, origin: Option<&str>) -> bool {
        let Some(hash) = attachments::hash_of_path(stored) else { return false };
        // A note was given it in this run, whatever the record said before:
        // the sweep of this run does not judge it.
        self.notebook_before.remove(hash);
        let known = self.files.get(hash).map(|r| r.notebook);
        // A path that moved is brought up to date; nothing else of a known one.
        let changed = self.files.record(stored, None, origin, &now());
        let mark = match known {
            None => Held::Only,
            Some(None) => Held::Also,
            Some(Some(_)) => return changed,
        };
        let Ok(file) = self.files.get_mut(hash) else { return changed };
        file.notebook = Some(mark);
        if known.is_none() {
            self.files.measure(&self.dir, hash);
        }
        true
    }

    /// Enters files that were copied into the store by `files::store_paths`
    /// as files the notebook holds (`enter_held`), the record written once.
    /// Gives each as `file_view` shows it, in the order given.
    pub fn notebook_take(&mut self, taken: &[files::Taken]) -> Result<Vec<FileView>> {
        let mut changed = false;
        for t in taken {
            changed |= self.enter_held(&t.stored, Some(&t.origin));
        }
        if changed {
            self.save_files()?;
        }
        Ok(taken
            .iter()
            .filter_map(|t| attachments::hash_of_path(&t.stored))
            .filter_map(|hash| self.file_view(hash))
            .collect())
    }

    /// Takes a picture pasted into the notebook: made what a figure shows
    /// first, as `add_image` makes it, and entered as a file the notebook
    /// holds, in no folder.
    pub fn notebook_take_image(&mut self, name: &str, bytes: &[u8]) -> Result<FileView> {
        if bytes.len() as u64 > figures::MAX_BYTES {
            return Err(figures::too_large());
        }
        let (content, ending, _) = figures::prepared(bytes)?;
        if content.len() as u64 > figures::MAX_BYTES {
            return Err(figures::too_large());
        }
        let hash = attachments::hash_bytes(&content);
        let stored = match self.files.get(&hash) {
            Some(there) => there.path.clone(),
            None => attachments::store_bytes(&self.dir, &content, &figures::shown_name(name, ending))?,
        };
        if self.enter_held(&stored, None) {
            self.save_files()?;
        }
        self.file_view(&hash).ok_or_else(not_found)
    }

    /// Of an image, the file a figure shows of it, as `for_figure` gives
    /// it: itself, or a copy made to be shown, which is held as the image
    /// is. None for a file that is no image a figure can show.
    pub fn notebook_shown(&mut self, hash: &str) -> Result<Option<FileView>> {
        let record = self.files.get(hash).cloned().ok_or_else(not_found)?;
        if files::kind_of(&record.name) != FileKind::Picture {
            return Ok(None);
        }
        let shown = match self.for_figure(hash) {
            Ok(shown) => shown,
            // No picture that can be read, or one larger than a figure takes.
            Err(e) if e.kind() == "invalid" => return Ok(None),
            Err(e) => return Err(e),
        };
        // A copy made before for the library alone is held now as well.
        if shown.hash != hash
            && record.notebook.is_some()
            && let Ok(copy) = self.files.get_mut(&shown.hash)
            && copy.notebook.is_none()
        {
            copy.notebook = Some(Held::Also);
            self.notebook_before.remove(&shown.hash);
            self.save_files()?;
            return Ok(self.file_view(&shown.hash));
        }
        Ok(Some(shown))
    }

    /// Where a file of the store lies, by its hash, whether the library lists
    /// it or the notebook holds it alone; none where the store has it not.
    pub fn stored_path(&self, hash: &str) -> Option<std::path::PathBuf> {
        let record = self.files.get(hash)?;
        attachments::absolute(&self.dir, &record.path).ok().filter(|p| p.is_file())
    }

    /// Notes have come to hold these files of the store, as when an image
    /// of the library is dropped into one: those of the library alone are
    /// held beside it. Hashes the record does not know are passed over.
    pub fn notebook_hold(&mut self, hashes: &[String]) -> Result<()> {
        let mut changed = false;
        for hash in hashes {
            // A note was given it in this run: see `enter_held`.
            self.notebook_before.remove(hash);
            if let Ok(file) = self.files.get_mut(hash)
                && file.notebook.is_none()
            {
                file.notebook = Some(Held::Also);
                changed = true;
            }
        }
        if changed { self.save_files() } else { Ok(()) }
    }

    /// Puts a file the notebook holds among the library's files: an image
    /// into the folder *Images*, as images taken in to be figures go, with
    /// the file it was made from where the notebook held that alone too.
    /// `origin` is where it came from, kept where the record says nothing,
    /// or no more than the path of a file. Gives the file as the library
    /// shows it.
    pub fn to_library(&mut self, hash: &str, origin: Option<&str>) -> Result<FileView> {
        let record = self.files.get(hash).cloned().ok_or_else(not_found)?;
        let mut put = vec![record.clone()];
        if let Some(source) = record.made_from.as_deref().and_then(|s| self.files.get(s))
            && !source.listed()
        {
            put.push(source.clone());
        }
        let origin = origin.map(str::trim).filter(|o| !o.is_empty());
        let mut changed = false;
        for file in &put {
            if !file.listed() {
                let folder = if files::kind_of(&file.name) == FileKind::Picture {
                    Some(self.files.folder_named(&tr!("core-library-images-folder"), None)?.id)
                } else {
                    None
                };
                changed |= self.files.adopt(&file.hash, folder.as_deref(), None);
            }
            if let Some(origin) = origin
                && let Ok(known) = self.files.get_mut(&file.hash)
                && known.origin.as_deref().is_none_or(is_path)
                && known.origin.as_deref() != Some(origin)
            {
                known.origin = Some(origin.to_owned());
                changed = true;
            }
        }
        if changed {
            self.save_files()?;
        }
        self.file_view(hash).ok_or_else(not_found)
    }

    /// Done once in a run, when the notebook has been read: `held` are the
    /// files its notes hold. A file the notebook held alone that no note
    /// holds leaves the store, as `remove_file` removes one, with its small
    /// picture; one it held beside the library is the library's alone
    /// again; one held that the record says is the library's alone is held
    /// beside it. A file is held where a note holds it, where it is the file
    /// one that a note holds was made from, or where it was made from one: a
    /// figure shows a copy of its image. Gives how many files left the store.
    ///
    /// This judges every file, and is the rule. A run of the application
    /// sweeps by `notebook_sweep_of_run`, which judges fewer.
    pub fn notebook_sweep(&mut self, held: &HashSet<&str>) -> Result<usize> {
        self.sweep(held, None)
    }

    /// The sweep as a run of the application makes it: `notebook_sweep`,
    /// which judges only the files the notebook held when the library was
    /// opened, and of those none that a note was given since.
    ///
    /// `held` is what the notes held when the page read the notebook, and
    /// the sweep is done some time after: both wait for the library, and
    /// neither is first by any rule. A file that became the notebook's
    /// meanwhile is in no such list, whichever way it came: taken out of
    /// the inbox as the application starts, pasted or dropped into a note
    /// in its first moments, or written into the record by what another
    /// device said. Judged by the list, it would leave the store while a
    /// note holds it, and one taken out of the inbox is nowhere else. So
    /// what this run made the notebook's is left to the sweep of the next
    /// run, whose list is read after it.
    pub fn notebook_sweep_of_run(&mut self, held: &HashSet<&str>) -> Result<usize> {
        let before = std::mem::take(&mut self.notebook_before);
        let swept = self.sweep(held, Some(&before));
        self.notebook_before = before;
        swept
    }

    /// What `notebook_sweep` does, of the files in `judged` alone where
    /// that is given: no other leaves the store or loses its mark.
    fn sweep(&mut self, held: &HashSet<&str>, judged: Option<&HashSet<String>>) -> Result<usize> {
        let sources: HashSet<&str> = self
            .files
            .files()
            .iter()
            .filter(|r| held.contains(r.hash.as_str()))
            .filter_map(|r| r.made_from.as_deref())
            .collect();
        let kept = |r: &FileRecord| {
            held.contains(r.hash.as_str())
                || sources.contains(r.hash.as_str())
                || r.made_from.as_deref().is_some_and(|m| held.contains(m))
        };
        let mut gone: Vec<FileRecord> = Vec::new();
        let mut marks: Vec<(String, Option<Held>)> = Vec::new();
        for r in self.files.files() {
            let judged = judged.is_none_or(|judged| judged.contains(&r.hash));
            match (r.notebook, kept(r)) {
                (Some(Held::Only), false) if judged => gone.push(r.clone()),
                (Some(Held::Also), false) if judged => marks.push((r.hash.clone(), None)),
                (None, true) if held.contains(r.hash.as_str()) => marks.push((r.hash.clone(), Some(Held::Also))),
                _ => {}
            }
        }
        // One that a reference has after all is the library's, and stays.
        gone.retain(|r| {
            let linked = !self.entries_with_file_hash(&r.hash).is_empty();
            if linked {
                marks.push((r.hash.clone(), None));
            }
            !linked
        });
        if gone.is_empty() && marks.is_empty() {
            return Ok(0);
        }
        for (hash, mark) in marks {
            if let Ok(file) = self.files.get_mut(&hash) {
                file.notebook = mark;
            }
        }
        let hashes: HashSet<&str> = gone.iter().map(|r| r.hash.as_str()).collect();
        self.files.forget_all(&hashes);
        self.save_files()?;
        for r in &gone {
            let mut stored = vec![r.path.clone()];
            if let Some(found) = attachments::find_by_hash(&self.dir, &r.hash)
                && !stored.contains(&found)
            {
                stored.push(found);
            }
            for path in stored {
                if let Err(e) = attachments::delete(&self.dir, &path) {
                    tracing::warn!(%e, path, "a file no note holds could not be deleted from the store");
                }
            }
            small::forget(&self.dir, &r.hash);
        }
        Ok(gone.len())
    }
}

fn not_found() -> Error {
    Error::not_found(tr!("core-library-the-file-of-library"))
}

#[cfg(test)]
mod tests {
    use std::fs;
    use std::io::Cursor;
    use std::path::{Path, PathBuf};
    use std::sync::atomic::AtomicBool;

    use super::*;
    use crate::library::draft_from_source;
    use crate::library::export::ExportSelection;

    fn library() -> (tempfile::TempDir, Library) {
        let tmp = tempfile::tempdir().unwrap();
        let lib = Library::open_at(&tmp.path().join("library")).unwrap();
        (tmp, lib)
    }

    fn write(dir: &Path, name: &str, bytes: &[u8]) -> PathBuf {
        let path = dir.join(name);
        fs::write(&path, bytes).unwrap();
        path
    }

    fn store(lib: &Library, paths: &[PathBuf]) -> Vec<files::Taken> {
        files::store_paths(lib.dir(), paths, false, &mut |_, _, _| {}, &AtomicBool::new(false)).0
    }

    fn listed(lib: &Library) -> Vec<String> {
        lib.file_views().into_iter().map(|f| f.name).collect()
    }

    fn mark(lib: &Library, hash: &str) -> Option<Held> {
        lib.files.get(hash).unwrap().notebook
    }

    fn on_disk(lib: &Library, hash: &str) -> bool {
        lib.file_view(hash).is_some_and(|f| f.exists)
    }

    fn gif() -> Vec<u8> {
        let picture = image::DynamicImage::ImageRgb8(image::RgbImage::from_pixel(3, 2, image::Rgb([200, 30, 30])));
        let mut out = Cursor::new(Vec::new());
        picture.write_to(&mut out, image::ImageFormat::Gif).unwrap();
        out.into_inner()
    }

    #[test]
    fn what_the_notebook_holds_alone_is_in_none_of_the_library_s_lists() {
        let (tmp, mut lib) = library();
        let shelf = lib.files.folder_create("Shelf", None).unwrap();
        let theirs = store(&lib, &[write(tmp.path(), "theirs.pdf", b"%PDF theirs")]);
        lib.enter_taken(&theirs, Some(&shelf.id)).unwrap();
        let ours = store(
            &lib,
            &[write(tmp.path(), "ours.pdf", b"%PDF ours"), write(tmp.path(), "theirs.pdf", b"%PDF theirs")],
        );
        let taken = lib.notebook_take(&ours).unwrap();
        assert_eq!(taken.iter().map(|f| f.name.as_str()).collect::<Vec<_>>(), ["ours.pdf", "theirs.pdf"]);
        let (ours, theirs) = (taken[0].clone(), taken[1].clone());
        assert_eq!((ours.folder.as_deref(), ours.origin.as_deref().is_some()), (None, true));
        assert_eq!(mark(&lib, &ours.hash), Some(Held::Only));
        assert_eq!(mark(&lib, &theirs.hash), Some(Held::Also), "the library had it");
        assert_eq!(theirs.folder.as_deref(), Some(shelf.id.as_str()), "and it stays where it was");

        // Every list leaves out what the notebook holds alone; a file by its hash is there all the same.
        assert_eq!(listed(&lib), ["theirs.pdf"]);
        assert!(lib.file_view(&ours.hash).is_some());
        assert!(lib.files.left_empty(&[theirs.hash.as_str()].into_iter().collect()).contains(&shelf.id));
        let named = lib.name_files_by_reference(std::slice::from_ref(&ours.hash)).unwrap();
        assert_eq!((named.changed.len(), named.kept), (0, 0), "not counted at all");
        let out = tmp.path().join("out");
        let exported =
            lib.export_files(&ExportSelection::All, &out, false, &mut |_, _, _| {}, &AtomicBool::new(false)).unwrap();
        assert!(exported.problems.is_empty(), "{:?}", exported.problems);
        assert!(!out.join("ours.pdf").exists() && out.join("Shelf").join("theirs.pdf").exists());
        let asked = ExportSelection::Files { hashes: vec![ours.hash.clone()] };
        let exported = lib.export_files(&asked, &out, false, &mut |_, _, _| {}, &AtomicBool::new(false)).unwrap();
        assert_eq!(exported.problems.len(), 1);

        // Read again, as it was written.
        let again = Library::open_at(lib.dir()).unwrap();
        assert_eq!(listed(&again), ["theirs.pdf"]);
        assert_eq!(again.files.get(&ours.hash).unwrap().notebook, Some(Held::Only));
        let written = fs::read_to_string(lib.dir().join(files::FILE)).unwrap();
        assert!(written.contains("\"notebook\": \"only\"") && written.contains("\"notebook\": \"also\""), "{written}");
    }

    #[test]
    fn a_record_written_before_the_notebook_reads_and_writes_as_it_was() {
        let (tmp, mut lib) = library();
        let taken = store(&lib, &[write(tmp.path(), "a.pdf", b"%PDF a")]);
        lib.enter_taken(&taken, None).unwrap();
        let before = fs::read_to_string(lib.dir().join(files::FILE)).unwrap();
        assert!(!before.contains("notebook"));
        let mut again = Library::open_at(lib.dir()).unwrap();
        assert!(again.files.files().iter().all(|f| f.notebook.is_none()));
        again.save_files().unwrap();
        assert_eq!(fs::read_to_string(lib.dir().join(files::FILE)).unwrap(), before);
    }

    #[test]
    fn the_library_removes_a_file_the_notebook_holds_from_its_lists_alone() {
        let (tmp, mut lib) = library();
        let work = lib.add(&draft_from_source("@book{w, title={A Work}, date={2000}}").unwrap()).unwrap();
        let shelf = lib.files.folder_create("Shelf", None).unwrap();
        let taken = store(
            &lib,
            &[
                write(tmp.path(), "held.pdf", b"%PDF held"),
                write(tmp.path(), "loose.pdf", b"%PDF loose"),
                write(tmp.path(), "two.pdf", b"%PDF two"),
            ],
        );
        let got = lib.enter_taken(&taken, Some(&shelf.id)).unwrap().files;
        let (held, loose, two) = (got[0].clone(), got[1].clone(), got[2].clone());
        lib.attach_stored(&work.id, &held.path, None).unwrap();
        lib.notebook_hold(&[held.hash.clone(), two.hash.clone(), "0".repeat(64)]).unwrap();
        assert_eq!(mark(&lib, &held.hash), Some(Held::Also));

        lib.remove_file(&held.hash).unwrap();
        assert!(on_disk(&lib, &held.hash), "it stays in the store");
        assert_eq!(mark(&lib, &held.hash), Some(Held::Only));
        assert_eq!(lib.files.get(&held.hash).unwrap().folder, None, "it left its folder");
        assert!(lib.require(&work.id).unwrap().attachments().is_empty(), "and its reference");
        assert_eq!(listed(&lib), ["loose.pdf", "two.pdf"]);

        // Many at once: the held one counted with those that went, the folder left empty with them.
        let (count, folders) = lib.remove_files(&[two.hash.clone(), loose.hash.clone()], true).unwrap();
        assert_eq!((count, folders), (2, 1));
        assert!(on_disk(&lib, &two.hash) && !on_disk(&lib, &loose.hash));
        assert!(lib.files.get(&loose.hash).is_none());
        assert_eq!(mark(&lib, &two.hash), Some(Held::Only));
        assert!(listed(&lib).is_empty());

        // To the library again, with where it came from.
        let back = lib.to_library(&held.hash, Some("https://example.org/held")).unwrap();
        assert_eq!(back.origin.as_deref(), Some("https://example.org/held"), "an address says more than a path");
        assert_eq!(back.folder, None, "no image: no folder");
        assert_eq!(mark(&lib, &held.hash), Some(Held::Also));
        assert_eq!(listed(&lib), ["held.pdf"]);
        let kept = lib.to_library(&held.hash, Some("/somewhere/else.pdf")).unwrap();
        assert_eq!(kept.origin.as_deref(), Some("https://example.org/held"), "an address is kept");
        assert_eq!(lib.to_library(&"0".repeat(64), None).unwrap_err().kind(), "not-found");

        // A folder deleted with its files: the held one stays in the store.
        let box_ = lib.files.folder_create("Box", None).unwrap();
        lib.move_files(std::slice::from_ref(&held.hash), Some(&box_.id)).unwrap();
        assert_eq!(lib.delete_folder(&box_.id, true, true).unwrap(), 1);
        assert!(on_disk(&lib, &held.hash));
        assert_eq!(mark(&lib, &held.hash), Some(Held::Only));
    }

    #[test]
    fn the_library_that_takes_in_a_file_the_notebook_holds_alone_has_it_as_new() {
        let (tmp, mut lib) = library();
        let path = write(tmp.path(), "found.pdf", b"%PDF found");
        let ours = lib.notebook_take(&store(&lib, std::slice::from_ref(&path))).unwrap()[0].clone();
        let shelf = lib.files.folder_create("Shelf", None).unwrap();
        let got = lib.enter_taken(&store(&lib, &[path]), Some(&shelf.id)).unwrap();
        assert_eq!(got.files.len(), 1, "new to the library");
        assert_eq!(got.files[0].folder.as_deref(), Some(shelf.id.as_str()));
        assert_eq!(mark(&lib, &ours.hash), Some(Held::Also));
    }

    #[test]
    fn a_picture_pasted_and_the_copy_a_figure_shows_are_held_as_their_source_is() {
        let (tmp, mut lib) = library();
        let pasted = lib.notebook_take_image("pasted", &figures::fixtures::PNG).unwrap();
        assert_eq!((pasted.name.as_str(), pasted.folder.as_deref()), ("pasted.png", None), "not among the images");
        assert_eq!(mark(&lib, &pasted.hash), Some(Held::Only));
        assert_eq!(lib.notebook_shown(&pasted.hash).unwrap().unwrap().hash, pasted.hash, "shown as it is");
        assert!(lib.notebook_take_image("words", b"no picture").is_err());

        // A picture a figure shows as a copy: the copy is the notebook's alone as well.
        let plate = lib.notebook_take(&store(&lib, &[write(tmp.path(), "plate.gif", &gif())])).unwrap()[0].clone();
        let shown = lib.notebook_shown(&plate.hash).unwrap().unwrap();
        assert_ne!(shown.hash, plate.hash);
        assert_eq!(shown.made_from.as_deref(), Some(plate.hash.as_str()));
        assert_eq!(mark(&lib, &shown.hash), Some(Held::Only));
        assert!(listed(&lib).is_empty());
        assert_eq!(lib.notebook_shown(&shown.hash).unwrap().unwrap().hash, shown.hash, "made once");

        // No image a figure can show is no error.
        let paper = lib.notebook_take(&store(&lib, &[write(tmp.path(), "paper.pdf", b"%PDF")])).unwrap()[0].clone();
        assert!(lib.notebook_shown(&paper.hash).unwrap().is_none());
        let false_picture =
            lib.notebook_take(&store(&lib, &[write(tmp.path(), "false.png", b"not png")])).unwrap()[0].clone();
        assert!(lib.notebook_shown(&false_picture.hash).unwrap().is_none());

        // To the library: the copy, and the picture it was made from, among the images.
        let put = lib.to_library(&shown.hash, None).unwrap();
        let images = lib.files.folder_named(&tr!("core-library-images-folder"), None).unwrap().id;
        assert_eq!(put.folder.as_deref(), Some(images.as_str()));
        assert_eq!(mark(&lib, &plate.hash), Some(Held::Also));
        assert_eq!(lib.file_view(&plate.hash).unwrap().folder.as_deref(), Some(images.as_str()));
        assert_eq!(listed(&lib).len(), 2);
    }

    #[test]
    fn a_copy_made_before_for_the_library_is_held_when_the_notebook_holds_its_source() {
        let (tmp, mut lib) = library();
        let taken = store(&lib, &[write(tmp.path(), "plate.gif", &gif())]);
        let plate = lib.enter_taken(&taken, None).unwrap().files[0].clone();
        let copy = lib.for_figure(&plate.hash).unwrap();
        assert_eq!(mark(&lib, &copy.hash), None);
        lib.notebook_hold(std::slice::from_ref(&plate.hash)).unwrap();
        let shown = lib.notebook_shown(&plate.hash).unwrap().unwrap();
        assert_eq!(shown.hash, copy.hash);
        assert_eq!(mark(&lib, &copy.hash), Some(Held::Also));
    }

    #[test]
    fn the_sweep_removes_what_no_note_holds_and_nothing_else() {
        let (tmp, mut lib) = library();
        let theirs = lib.enter_taken(&store(&lib, &[write(tmp.path(), "theirs.pdf", b"%PDF t")]), None).unwrap().files;
        let theirs = theirs[0].clone();
        let lent = lib.enter_taken(&store(&lib, &[write(tmp.path(), "lent.pdf", b"%PDF l")]), None).unwrap().files;
        let lent = lent[0].clone();
        lib.notebook_hold(std::slice::from_ref(&lent.hash)).unwrap();
        let taken = store(
            &lib,
            &[
                write(tmp.path(), "kept.pdf", b"%PDF k"),
                write(tmp.path(), "dropped.pdf", b"%PDF d"),
                write(tmp.path(), "plate.gif", &gif()),
            ],
        );
        let ours = lib.notebook_take(&taken).unwrap();
        let (kept, dropped, plate) = (ours[0].clone(), ours[1].clone(), ours[2].clone());
        let shown = lib.notebook_shown(&plate.hash).unwrap().unwrap();

        // The notes hold the copy a figure shows, not the picture it was made from; and the library's own file.
        let held: HashSet<&str> = [kept.hash.as_str(), shown.hash.as_str(), theirs.hash.as_str()].into_iter().collect();
        assert_eq!(lib.notebook_sweep(&held).unwrap(), 1);
        assert!(
            lib.files.get(&dropped.hash).is_none()
                && !attachments::absolute(lib.dir(), &dropped.path).unwrap().exists()
        );
        assert!(on_disk(&lib, &kept.hash) && on_disk(&lib, &shown.hash) && on_disk(&lib, &plate.hash));
        assert_eq!(mark(&lib, &plate.hash), Some(Held::Only), "the source of what is held stays");
        assert_eq!(mark(&lib, &lent.hash), None, "held by no note, the library's alone again");
        assert!(on_disk(&lib, &lent.hash));
        assert_eq!(mark(&lib, &theirs.hash), Some(Held::Also), "held by a note, held beside the library");
        assert_eq!(lib.notebook_sweep(&held).unwrap(), 0, "nothing more");

        let none = HashSet::new();
        assert_eq!(lib.notebook_sweep(&none).unwrap(), 3);
        assert_eq!(listed(&lib), ["theirs.pdf", "lent.pdf"]);
        assert!(lib.files.files().iter().all(|f| f.notebook.is_none()));
    }

    #[test]
    fn the_sweep_of_a_run_judges_what_the_notebook_held_when_the_run_began_and_nothing_a_note_was_given_since() {
        let tmp = tempfile::tempdir().unwrap();
        let dir = tmp.path().join("library");
        // The run before: two files the notebook holds alone, and one of the library that a note holds too.
        let (old, again, lent) = {
            let mut lib = Library::open_at(&dir).unwrap();
            let taken =
                store(&lib, &[write(tmp.path(), "old.pdf", b"%PDF o"), write(tmp.path(), "again.pdf", b"%PDF a")]);
            let ours = lib.notebook_take(&taken).unwrap();
            let lent = lib.enter_taken(&store(&lib, &[write(tmp.path(), "lent.pdf", b"%PDF l")]), None).unwrap().files;
            lib.notebook_hold(std::slice::from_ref(&lent[0].hash)).unwrap();
            (ours[0].hash.clone(), ours[1].hash.clone(), lent[0].hash.clone())
        };

        // This run. Before the sweep comes to the library: a picture is taken
        // out of the inbox; a file the notebook held already is given to a
        // note anew; a file of the library is dropped into a note.
        let mut lib = Library::open_at(&dir).unwrap();
        let arrived = lib.notebook_take_image("region.png", &figures::fixtures::PNG).unwrap().hash;
        lib.notebook_take(&store(&lib, &[write(tmp.path(), "again.pdf", b"%PDF a")])).unwrap();
        let theirs = lib.enter_taken(&store(&lib, &[write(tmp.path(), "theirs.pdf", b"%PDF t")]), None).unwrap().files;
        let theirs = theirs[0].hash.clone();
        lib.notebook_hold(std::slice::from_ref(&theirs)).unwrap();

        // The sweep, by the list the page read before any of that: no note holds anything.
        let none = HashSet::new();
        assert_eq!(lib.notebook_sweep_of_run(&none).unwrap(), 1, "the file whose note was deleted before the run");
        assert!(lib.files.get(&old).is_none(), "its record is gone");
        assert!(on_disk(&lib, &arrived), "what came in this run is in the store");
        assert_eq!(mark(&lib, &arrived), Some(Held::Only), "and its record says the notebook holds it");
        assert!(on_disk(&lib, &again), "what a note was given anew stays, though the notebook held it before");
        assert_eq!(mark(&lib, &theirs), Some(Held::Also), "a mark set in this run stays");
        assert_eq!(mark(&lib, &lent), None, "a mark of the run before, of a file no note holds, is taken off");
        assert_eq!(lib.notebook_sweep_of_run(&none).unwrap(), 0, "nothing more, asked again");

        // The next run reads its list after all of it, and judges it: what no note holds then goes.
        drop(lib);
        let mut lib = Library::open_at(&dir).unwrap();
        let held: HashSet<&str> = [arrived.as_str()].into_iter().collect();
        assert_eq!(lib.notebook_sweep_of_run(&held).unwrap(), 1, "the file given anew, which no note holds now");
        assert!(on_disk(&lib, &arrived) && lib.files.get(&again).is_none());
        assert_eq!(mark(&lib, &theirs), None);
    }

    #[test]
    fn a_record_emptied_by_the_sweep_is_written_and_reads_as_emptied_and_one_lost_is_said_to_be_missing() {
        let (_tmp, mut lib) = library();
        lib.notebook_take_image("pasted", &figures::fixtures::PNG).unwrap();
        assert!(lib.take_missing().files, "a library never written to had no record");
        assert_eq!(lib.notebook_sweep(&HashSet::new()).unwrap(), 1);
        let record = lib.dir().join(files::FILE);
        assert!(record.is_file(), "written when its last file is taken out, not removed");
        let mut emptied = Library::open_at(lib.dir()).unwrap();
        assert!(emptied.files.files().is_empty());
        assert!(!emptied.take_missing().files, "emptied, it reads as emptied");

        fs::remove_file(&record).unwrap();
        let mut lost = Library::open_at(lib.dir()).unwrap();
        assert!(lost.files.files().is_empty(), "lost, it reads the same");
        assert!(lost.take_missing().files, "and is said to have been missing");
        assert!(!lost.take_missing().files, "once");
    }
}
