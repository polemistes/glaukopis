//! The pictures and files of the notes read, taken into the store as the
//! notebook's (`library/notebook.rs`): each copied with the library free,
//! entered as a file the notebook holds, and, of a picture, the file a
//! figure shows of it made. A file taken once in a reading is that file
//! again, however many notes name it.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::atomic::AtomicBool;
use std::sync::{Mutex, PoisonError};

use serde::Serialize;

use crate::library::figures::Image;
use crate::library::{FileView, Library, attachments, files};
use crate::notebook::{self, Facts, Place};
use crate::tr;

/// A file taken into the store for a note, and what it says of itself: as
/// `notebook_take_files` gives one (`NotebookFile` of the interface).
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HeldFile {
    /// The file as the store keeps it.
    pub file: FileView,
    /// Of an image, the file a figure shows of it: itself, or a copy made
    /// to be shown. None for a file that is no image a figure can show.
    pub shown: Option<FileView>,
    /// When the file was last changed, as the library writes times; none
    /// for what was held within another file.
    pub time: Option<String>,
    /// Of a photograph, when it was taken, as it says itself.
    pub taken: Option<String>,
    /// Of a photograph, where it was taken.
    pub place: Option<Place>,
}

/// What takes the files of a reading into the store.
pub(super) struct Taker<'a> {
    library: &'a Mutex<Library>,
    /// The library's folder, where the store is.
    dir: PathBuf,
    /// What was taken in this reading, by where it lay.
    by_path: HashMap<PathBuf, HeldFile>,
}

impl<'a> Taker<'a> {
    pub(super) fn new(library: &'a Mutex<Library>, dir: PathBuf) -> Self {
        Taker { library, dir, by_path: HashMap::new() }
    }

    /// Takes the file at `path` into the store, with what it says of
    /// itself, read where it lies. What could not be taken is said in words.
    pub(super) fn file(&mut self, path: &Path) -> Result<HeldFile, String> {
        if let Some(held) = self.by_path.get(path) {
            return Ok(held.clone());
        }
        let facts = notebook::facts(path);
        let (taken, problems) =
            files::store_paths(&self.dir, &[path.to_owned()], false, &mut |_, _, _| {}, &AtomicBool::new(false));
        let Some(taken) = taken.into_iter().next() else {
            return Err(problems.into_iter().next().unwrap_or_else(|| tr!("core-notes-file-unreadable")));
        };
        let held = self.enter(&taken, facts)?;
        self.by_path.insert(path.to_owned(), held.clone());
        Ok(held)
    }

    /// Takes a file into the store that was written out of another file,
    /// which lies at `origin`: it is copied from `path` under the name it
    /// has there. Of a photograph, when and where it was taken is read; the
    /// time of the file is that of its writing out, and says nothing.
    pub(super) fn written(&mut self, path: &Path, origin: &str) -> Result<HeldFile, String> {
        let facts = Facts { time: None, ..notebook::facts(path) };
        let (taken, problems) =
            files::store_paths(&self.dir, &[path.to_owned()], false, &mut |_, _, _| {}, &AtomicBool::new(false));
        let Some(mut taken) = taken.into_iter().next() else {
            return Err(problems.into_iter().next().unwrap_or_else(|| tr!("core-notes-file-unreadable")));
        };
        origin.clone_into(&mut taken.origin);
        self.enter(&taken, facts)
    }

    /// Takes a file into the store from what it holds, held within another
    /// file: named `name`, come from `origin`.
    pub(super) fn bytes(&mut self, bytes: &[u8], name: &str, origin: &str) -> Result<HeldFile, String> {
        let stored = attachments::store_bytes(&self.dir, bytes, name).map_err(|e| e.to_string())?;
        let taken = files::Taken { stored, folders: Vec::new(), origin: origin.to_owned() };
        self.enter(&taken, Facts::default())
    }

    fn enter(&mut self, taken: &files::Taken, facts: Facts) -> Result<HeldFile, String> {
        let mut library = self.library.lock().unwrap_or_else(PoisonError::into_inner);
        let file = library
            .notebook_take(std::slice::from_ref(taken))
            .map_err(|e| e.to_string())?
            .into_iter()
            .next()
            .ok_or_else(|| tr!("core-notes-file-unreadable"))?;
        let shown = library.notebook_shown(&file.hash).unwrap_or_else(|error| {
            tracing::warn!(%error, hash = file.hash, "what a figure shows of a file of a note brought in could not be made");
            None
        });
        Ok(HeldFile { file, shown, time: facts.time, taken: facts.taken, place: facts.place })
    }
}

/// The files a note holds, as it is read.
#[derive(Debug, Default)]
pub(super) struct Holding {
    pub(super) held: Vec<HeldFile>,
    pub(super) attachments: Vec<String>,
}

impl Holding {
    fn hold(&mut self, file: &HeldFile) {
        if !self.held.iter().any(|h| h.file.hash == file.file.hash) {
            self.held.push(file.clone());
        }
    }

    /// A picture of the text: held, and the figure that shows it. One that
    /// no figure can show stands at the note's end as a file, and is none.
    pub(super) fn picture(&mut self, file: &HeldFile) -> Option<Image> {
        match &file.shown {
            Some(shown) => {
                self.hold(file);
                Some(Image::from(shown))
            }
            None => {
                self.attach(file);
                None
            }
        }
    }

    /// A file that stands at the note's end.
    pub(super) fn attach(&mut self, file: &HeldFile) {
        self.hold(file);
        if !self.attachments.contains(&file.file.hash) {
            self.attachments.push(file.file.hash.clone());
        }
    }
}

/// Whether a file is a picture, by its name.
pub(super) fn is_picture(name: &str) -> bool {
    files::kind_of(name) == files::FileKind::Picture
}
