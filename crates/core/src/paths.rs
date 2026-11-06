//! Where Glaukopis keeps its data.
//!
//! Everything lives under one data directory. `GLAUKOPIS_DATA_DIR` overrides
//! the location, which the tests and a portable installation use. The writer
//! may choose another folder (ADR 0084): a small file in the place the system
//! keeps a program's settings says which, and where the data is being moved
//! from while a move is under way.

use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

use serde::{Deserialize, Serialize};

use crate::error::{Error, IoContext, Result};
use crate::fsutil::write_atomic;
use crate::tr;

#[derive(Debug, Clone)]
pub struct DataDir {
    root: PathBuf,
}

/// A claim on a data directory: while it is held, no other instance of the
/// application works in it. It is let go when it is dropped, or when the
/// process ends however it ends.
#[derive(Debug)]
pub struct Claim {
    _file: fs::File,
}

impl DataDir {
    /// The data directory for this user, created if it does not exist.
    pub fn open_default() -> Result<Self> {
        Self::open(default_root())
    }

    pub fn open(root: impl Into<PathBuf>) -> Result<Self> {
        let dir = DataDir { root: root.into() };
        for sub in [
            dir.library(),
            dir.attachments(),
            dir.styles(),
            dir.formats(),
            dir.projects(),
            // So that the writer finds where a dictionary of their own goes.
            dir.dictionaries(),
        ] {
            fs::create_dir_all(&sub).context(|| tr!("io-creating", path = &sub))?;
        }
        Ok(dir)
    }

    pub fn root(&self) -> &Path {
        &self.root
    }

    /// Claims the directory for this instance of the application; `None` when
    /// another holds it. Two that worked in one directory would each write
    /// the library, the pictures and the projects over what the other wrote.
    /// Where the file system cannot lock, it is worked in without a claim, as
    /// before there was one.
    pub fn claim(&self) -> Result<Option<Claim>> {
        let path = self.root.join(".in-use");
        let file = fs::OpenOptions::new()
            .create(true)
            .truncate(false)
            .write(true)
            .open(&path)
            .context(|| tr!("io-creating", path = &path))?;
        match file.try_lock() {
            Ok(()) => Ok(Some(Claim { _file: file })),
            Err(fs::TryLockError::WouldBlock) => Ok(None),
            Err(fs::TryLockError::Error(e)) => {
                tracing::warn!("the data directory cannot be claimed, and is used without: {e}");
                Ok(Some(Claim { _file: file }))
            }
        }
    }

    pub fn library(&self) -> PathBuf {
        self.root.join("library")
    }

    pub fn library_file(&self) -> PathBuf {
        self.library().join("library.bib")
    }

    pub fn collections_file(&self) -> PathBuf {
        self.library().join("collections.json")
    }

    pub fn attachments(&self) -> PathBuf {
        self.library().join("attachments")
    }

    /// Where images were kept before they were files of the library; taken
    /// into the library once, then set aside (`library::migration`).
    pub fn pictures(&self) -> PathBuf {
        self.root.join("pictures")
    }

    pub fn styles(&self) -> PathBuf {
        self.root.join("styles")
    }

    pub fn formats(&self) -> PathBuf {
        self.root.join("formats")
    }

    /// The writer's own templates (ADR 0038).
    pub fn templates(&self) -> PathBuf {
        self.root.join("templates")
    }

    pub fn projects(&self) -> PathBuf {
        self.root.join("projects")
    }

    pub fn project(&self, id: &str) -> PathBuf {
        self.projects().join(id)
    }

    /// For what can be made again: documents on their way to preview and export.
    pub fn work(&self) -> PathBuf {
        self.root.join("work")
    }

    /// Dictionaries the writer has put here, which are used before those of
    /// the application and of the system: see `spelling`.
    pub fn dictionaries(&self) -> PathBuf {
        self.root.join("dictionaries")
    }

    /// The languages of spelling and of OCR that are imported: see `languages`.
    pub fn languages(&self) -> PathBuf {
        self.root.join("languages")
    }

    /// The writer's own words: a list for each language, for spelling (see
    /// `spelling`); and, in a folder for each language (`words/nb/`), Fluent
    /// files laid over the words of the application (see `i18n`, ADR 0035).
    pub fn words(&self) -> PathBuf {
        self.root.join("words")
    }

    pub fn settings_file(&self) -> PathBuf {
        self.root.join("settings.json")
    }
}

/// Where the data is when nothing else is said: `GLAUKOPIS_DATA_DIR`, or the
/// place of the system for the data of programs.
pub fn default_root() -> PathBuf {
    if let Some(dir) = std::env::var_os("GLAUKOPIS_DATA_DIR").filter(|v| !v.is_empty()) {
        return PathBuf::from(dir);
    }
    platform_data_home().join("glaukopis")
}

/// Whether `GLAUKOPIS_DATA_DIR` says where the data is: then the file of the
/// location is neither read nor acted on.
pub fn data_dir_from_environment() -> bool {
    std::env::var_os("GLAUKOPIS_DATA_DIR").is_some_and(|v| !v.is_empty())
}

/// The place the system gives a program for its settings, where the file
/// that says where the data is stands: `$XDG_CONFIG_HOME/glaukopis` or
/// `~/.config/glaukopis` on Linux, `~/Library/Application Support/glaukopis`
/// on the Mac, `%APPDATA%\glaukopis` on Windows.
pub fn settings_place() -> PathBuf {
    platform_config_home().join("glaukopis")
}

#[cfg(all(unix, not(target_os = "macos")))]
fn platform_config_home() -> PathBuf {
    if let Some(dir) = std::env::var_os("XDG_CONFIG_HOME").filter(|v| !v.is_empty()) {
        return PathBuf::from(dir);
    }
    home().join(".config")
}

#[cfg(not(all(unix, not(target_os = "macos"))))]
fn platform_config_home() -> PathBuf {
    platform_data_home()
}

/// The name of the file in the settings place that says where the data is.
const LOCATION_FILE: &str = "data-folder.json";

/// Where the writer has chosen to keep the data, and, while a move is under
/// way, where it is moved from.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Location {
    pub folder: PathBuf,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub moving_from: Option<PathBuf>,
}

/// What the file in `place` says: nothing where there is no file, or an
/// empty one. A file that cannot be read is an error, which is a failure to
/// start: to use the usual folder in silence would be worse.
pub fn location(place: &Path) -> Result<Option<Location>> {
    let path = place.join(LOCATION_FILE);
    let text = match fs::read_to_string(&path) {
        Ok(text) => text,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(e) => return Err(Error::io(tr!("io-reading", path = &path), e)),
    };
    if text.trim().is_empty() {
        return Ok(None);
    }
    serde_json::from_str(&text)
        .map(Some)
        .map_err(|e| Error::invalid(format!("{}: {e}", tr!("io-reading", path = &path))))
}

/// Writes where the data is, whole or not at all.
pub fn set_location(place: &Path, location: &Location) -> Result<()> {
    let bytes = serde_json::to_vec_pretty(location).map_err(|e| Error::invalid(e.to_string()))?;
    write_atomic(&place.join(LOCATION_FILE), &bytes)
}

/// Forgets where the data was chosen to be: the usual folder again.
pub fn clear_location(place: &Path) -> Result<()> {
    let path = place.join(LOCATION_FILE);
    match fs::remove_file(&path) {
        Err(e) if e.kind() != std::io::ErrorKind::NotFound => Err(Error::io(tr!("io-removing", path = &path), e)),
        _ => Ok(()),
    }
}

/// The folder the data is in: `GLAUKOPIS_DATA_DIR`, else the folder the
/// file in `place` names, else the usual one.
pub fn chosen_root(place: &Path) -> Result<PathBuf> {
    if data_dir_from_environment() {
        return Ok(default_root());
    }
    Ok(location(place)?.map(|l| l.folder).unwrap_or_else(default_root))
}

/// What a folder the data could go to holds.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Holds {
    /// Nothing, or it is not there yet: everything can be moved there.
    Empty,
    /// Glaukopis's data already: it can be used as it is.
    Glaukopis,
    /// Something else: refused, since two sets of data are not merged.
    Other,
}

/// What `folder` holds, for the choice of a new data folder.
pub fn what_holds(folder: &Path) -> Holds {
    let mut entries = match fs::read_dir(folder) {
        Ok(entries) => entries,
        Err(_) if !folder.exists() => return Holds::Empty,
        Err(_) => return Holds::Other,
    };
    if entries.next().is_none() {
        return Holds::Empty;
    }
    if folder.join("library").join("library.bib").is_file() || folder.join("projects").is_dir() {
        return Holds::Glaukopis;
    }
    Holds::Other
}

/// Whether a path under the data folder, given from its top, is left out of
/// a move: the work folder, made again as it is needed; the claim; and the
/// file of the location, where it stands in the data folder (on Windows).
fn left_out(relative: &Path) -> bool {
    let mut parts = relative.components();
    let first = parts.next().map(|c| c.as_os_str().to_owned());
    let top = parts.next().is_none();
    match first {
        Some(name) => name == "work" || (top && (name == ".in-use" || name == LOCATION_FILE)),
        None => false,
    }
}

/// Every file under `from` that a move carries, as paths from its top;
/// and every folder, so that an empty one is made where it is moved to.
fn files_to_move(from: &Path) -> Result<(Vec<PathBuf>, Vec<PathBuf>)> {
    let mut files = Vec::new();
    let mut all_folders = Vec::new();
    let mut folders = vec![PathBuf::new()];
    while let Some(relative) = folders.pop() {
        let dir = from.join(&relative);
        for entry in fs::read_dir(&dir).context(|| tr!("io-reading", path = &dir))? {
            let entry = entry.context(|| tr!("io-reading", path = &dir))?;
            let inner = relative.join(entry.file_name());
            if left_out(&inner) {
                continue;
            }
            // A link is followed: what it points to is the writer's data too.
            let meta = fs::metadata(entry.path()).context(|| tr!("io-reading", path = &entry.path()))?;
            if meta.is_dir() {
                all_folders.push(inner.clone());
                folders.push(inner);
            } else {
                files.push(inner);
            }
        }
    }
    files.sort();
    all_folders.sort();
    Ok((files, all_folders))
}

/// Whether `a` is `b` or inside it, or `b` inside `a`, as far as the system can say.
fn overlapping(a: &Path, b: &Path) -> bool {
    let a = fs::canonicalize(a).unwrap_or_else(|_| a.to_owned());
    let b = nearest_canonical(b);
    a.starts_with(&b) || b.starts_with(&a)
}

/// The path, with as much of it as exists made canonical: a folder not yet
/// made is judged by the folder it will be made in.
fn nearest_canonical(path: &Path) -> PathBuf {
    let mut rest = Vec::new();
    let mut at = path.to_owned();
    loop {
        if let Ok(found) = fs::canonicalize(&at) {
            return rest.iter().rev().fold(found, |p, name| p.join(name));
        }
        match (at.file_name().map(|n| n.to_owned()), at.parent()) {
            (Some(name), Some(parent)) => {
                rest.push(name);
                at = parent.to_owned();
            }
            _ => return path.to_owned(),
        }
    }
}

/// Copies every file under `from` to the same place under `to`, leaving out
/// the work folder and the claim; with `newer_only`, only those missing in
/// `to`, or newer there, or of another size. `progress` is told how many
/// files of how many are done: the count first, then after each file.
pub fn copy_tree(from: &Path, to: &Path, newer_only: bool, progress: &mut dyn FnMut(usize, usize)) -> Result<()> {
    if overlapping(from, to) {
        return Err(Error::invalid(tr!("core-data-inside", from = from, to = to)));
    }
    let (files, folders) = files_to_move(from)?;
    for folder in &folders {
        let target = to.join(folder);
        fs::create_dir_all(&target).context(|| tr!("io-creating", path = &target))?;
    }
    let count = files.len();
    progress(0, count);
    for (done, relative) in files.iter().enumerate() {
        let source = from.join(relative);
        let target = to.join(relative);
        let meta = fs::metadata(&source).context(|| tr!("io-reading", path = &source))?;
        if newer_only && let Ok(there) = fs::metadata(&target) {
            let newer = match (meta.modified(), there.modified()) {
                (Ok(here), Ok(there)) => here > there,
                _ => true,
            };
            if !newer && there.len() == meta.len() {
                progress(done + 1, count);
                continue;
            }
        }
        if let Some(parent) = target.parent() {
            fs::create_dir_all(parent).context(|| tr!("io-creating", path = parent))?;
        }
        fs::copy(&source, &target).context(|| tr!("io-copying", path = &source))?;
        // The copy keeps the time of the file it was made from, so that a
        // pass of the newer only sees what was written after it.
        if let Ok(modified) = meta.modified() {
            set_modified(&target, modified);
        }
        progress(done + 1, count);
    }
    Ok(())
}

fn set_modified(path: &Path, when: SystemTime) {
    if let Ok(file) = fs::OpenOptions::new().write(true).open(path) {
        let _ = file.set_modified(when);
    }
}

/// Whether every file under `from` a move carries is under `to` with the
/// same size; the error names the first that is not.
pub fn check_copy(from: &Path, to: &Path) -> Result<()> {
    for relative in files_to_move(from)?.0 {
        let source = from.join(&relative);
        let target = to.join(&relative);
        let here = fs::metadata(&source).context(|| tr!("io-reading", path = &source))?.len();
        if fs::metadata(&target).map(|m| m.len()).ok() != Some(here) {
            return Err(Error::invalid(tr!("core-data-not-copied", path = &target)));
        }
    }
    Ok(())
}

/// Whether two folders are on the same disk, so that one can be renamed to
/// the other: the second judged by the folder it will be made in. Where the
/// system cannot say, they are taken to be apart, and the data is copied.
pub fn same_disk(a: &Path, b: &Path) -> bool {
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        let mut at = b.to_owned();
        let b = loop {
            if let Ok(meta) = fs::metadata(&at) {
                break meta.dev();
            }
            match at.parent() {
                Some(parent) => at = parent.to_owned(),
                None => return false,
            }
        };
        fs::metadata(a).map(|m| m.dev() == b).unwrap_or(false)
    }
    #[cfg(not(unix))]
    {
        let _ = (a, b);
        false
    }
}

/// Whether a folder is empty, or not there.
fn empty_or_missing(folder: &Path) -> bool {
    fs::read_dir(folder).map(|mut e| e.next().is_none()).unwrap_or(!folder.exists())
}

/// Finishes a move that is under way, at the start, before the data is
/// opened: renames the old folder to the new where that is empty, or else
/// brings over what was written after the copy and checks every file; then
/// removes the old folder and writes the location without the move. Gives
/// the folder the data is in. What fails leaves the location saying the old
/// folder alone, and is given back to be told.
pub fn finish_move(place: &Path) -> Result<PathBuf> {
    let Some(location) = location(place)? else {
        return Ok(default_root());
    };
    let Some(from) = location.moving_from.clone() else {
        return Ok(location.folder);
    };
    let to = location.folder.clone();
    // The run that asked for the move may still be ending, its claim held.
    wait_until_free(&from, std::time::Duration::from_secs(10));
    let moved = (|| -> Result<()> {
        if !from.is_dir() {
            // Moved already, by a start that ended before it wrote so.
            return Ok(());
        }
        let renamed = empty_or_missing(&to) && {
            if to.exists() {
                let _ = fs::remove_dir(&to);
            }
            if let Some(parent) = to.parent() {
                fs::create_dir_all(parent).context(|| tr!("io-creating", path = parent))?;
            }
            fs::rename(&from, &to).is_ok()
        };
        if !renamed {
            copy_tree(&from, &to, true, &mut |_, _| {})?;
            check_copy(&from, &to)?;
            // Everything is in the new folder: what of the old cannot be
            // removed is left, and is no reason to stay.
            if let Err(error) = remove_moved(&from, place) {
                tracing::warn!(%error, "the old data folder could not be removed whole");
            }
        }
        Ok(())
    })();
    match moved {
        Ok(()) => {
            set_location(place, &Location { folder: to.clone(), moving_from: None })?;
            Ok(to)
        }
        Err(error) => {
            set_location(place, &Location { folder: from, moving_from: None })?;
            Err(error)
        }
    }
}

/// Waits, at most `within`, until no other run holds the claim on `root`;
/// whether it is free. A folder without a claim file is free.
pub fn wait_until_free(root: &Path, within: std::time::Duration) -> bool {
    let path = root.join(".in-use");
    let Ok(file) = fs::OpenOptions::new().write(true).open(&path) else {
        return true;
    };
    let until = std::time::Instant::now() + within;
    loop {
        match file.try_lock() {
            Ok(()) => return true,
            Err(fs::TryLockError::Error(_)) => return true,
            Err(fs::TryLockError::WouldBlock) if std::time::Instant::now() >= until => return false,
            Err(fs::TryLockError::WouldBlock) => std::thread::sleep(std::time::Duration::from_millis(100)),
        }
    }
}

/// Removes the old data folder once everything is in the new one; where the
/// settings place is inside it (on Windows, the usual folder), that is kept.
fn remove_moved(from: &Path, place: &Path) -> Result<()> {
    let keep = place.join(LOCATION_FILE);
    if !keep.starts_with(from) {
        return fs::remove_dir_all(from).context(|| tr!("io-removing", path = from));
    }
    for entry in fs::read_dir(from).context(|| tr!("io-reading", path = from))? {
        let path = entry.context(|| tr!("io-reading", path = from))?.path();
        if keep == path {
            continue;
        }
        if keep.starts_with(&path) {
            remove_moved(&path, place)?;
        } else if path.is_dir() {
            fs::remove_dir_all(&path).context(|| tr!("io-removing", path = &path))?;
        } else {
            fs::remove_file(&path).context(|| tr!("io-removing", path = &path))?;
        }
    }
    Ok(())
}

#[cfg(all(unix, not(target_os = "macos")))]
fn platform_data_home() -> PathBuf {
    if let Some(dir) = std::env::var_os("XDG_DATA_HOME").filter(|v| !v.is_empty()) {
        return PathBuf::from(dir);
    }
    home().join(".local").join("share")
}

#[cfg(target_os = "macos")]
fn platform_data_home() -> PathBuf {
    home().join("Library").join("Application Support")
}

#[cfg(windows)]
fn platform_data_home() -> PathBuf {
    std::env::var_os("APPDATA").map(PathBuf::from).unwrap_or_else(|| home().join("AppData").join("Roaming"))
}

fn home() -> PathBuf {
    #[cfg(unix)]
    let var = "HOME";
    #[cfg(windows)]
    let var = "USERPROFILE";
    std::env::var_os(var).map(PathBuf::from).unwrap_or_else(|| PathBuf::from("."))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn creates_the_layout() {
        let tmp = tempfile::tempdir().unwrap();
        let dir = DataDir::open(tmp.path().join("data")).unwrap();
        assert!(dir.attachments().is_dir());
        assert!(dir.projects().is_dir());
        assert_eq!(dir.library_file().file_name().unwrap(), "library.bib");
    }

    /// A data folder with a library, a project, a log and a work folder.
    fn some_data(root: &Path) {
        let dir = DataDir::open(root).unwrap();
        fs::write(dir.library_file(), "@book{a, title={A}}\n").unwrap();
        fs::create_dir_all(dir.project("p1")).unwrap();
        fs::write(dir.project("p1").join("info.json"), "{}").unwrap();
        fs::create_dir_all(dir.work().join("preview")).unwrap();
        fs::write(dir.work().join("preview").join("document.typ"), "made again").unwrap();
        fs::write(root.join(".in-use"), "").unwrap();
    }

    #[test]
    fn the_location_is_missing_written_read_and_cleared() {
        let tmp = tempfile::tempdir().unwrap();
        let place = tmp.path().join("config");
        assert_eq!(location(&place).unwrap(), None);
        fs::create_dir_all(&place).unwrap();
        fs::write(place.join(LOCATION_FILE), "  \n").unwrap();
        assert_eq!(location(&place).unwrap(), None, "an empty file says nothing");
        let chosen = Location { folder: tmp.path().join("data"), moving_from: Some(tmp.path().join("old")) };
        set_location(&place, &chosen).unwrap();
        assert_eq!(location(&place).unwrap(), Some(chosen));
        let text = fs::read_to_string(place.join(LOCATION_FILE)).unwrap();
        assert!(text.contains("movingFrom"), "{text}");
        clear_location(&place).unwrap();
        clear_location(&place).unwrap();
        assert_eq!(location(&place).unwrap(), None);
        fs::write(place.join(LOCATION_FILE), "{ not json").unwrap();
        assert!(location(&place).is_err(), "a file that cannot be read is not taken for none");
    }

    #[test]
    fn the_environment_wins_over_the_location() {
        // The tests run with GLAUKOPIS_DATA_DIR unset or set; either way the
        // root chosen follows it.
        let tmp = tempfile::tempdir().unwrap();
        let place = tmp.path().join("config");
        set_location(&place, &Location { folder: tmp.path().join("chosen"), moving_from: None }).unwrap();
        let root = chosen_root(&place).unwrap();
        if data_dir_from_environment() {
            assert_eq!(root, default_root());
        } else {
            assert_eq!(root, tmp.path().join("chosen"));
        }
    }

    #[test]
    fn what_a_folder_holds() {
        let tmp = tempfile::tempdir().unwrap();
        assert_eq!(what_holds(&tmp.path().join("not there")), Holds::Empty);
        assert_eq!(what_holds(tmp.path()), Holds::Empty);
        fs::write(tmp.path().join("stray.txt"), "x").unwrap();
        assert_eq!(what_holds(tmp.path()), Holds::Other);
        let data = tmp.path().join("data");
        fs::create_dir_all(data.join("library")).unwrap();
        fs::write(data.join("library").join("library.bib"), "").unwrap();
        assert_eq!(what_holds(&data), Holds::Glaukopis);
        let projects_only = tmp.path().join("projects only");
        fs::create_dir_all(projects_only.join("projects")).unwrap();
        assert_eq!(what_holds(&projects_only), Holds::Glaukopis);
    }

    #[test]
    fn a_move_on_one_disk_is_a_rename_at_the_start() {
        let tmp = tempfile::tempdir().unwrap();
        let place = tmp.path().join("config");
        let from = tmp.path().join("old");
        let to = tmp.path().join("new");
        some_data(&from);
        fs::create_dir_all(&to).unwrap();
        set_location(&place, &Location { folder: to.clone(), moving_from: Some(from.clone()) }).unwrap();
        assert_eq!(finish_move(&place).unwrap(), to);
        assert!(!from.exists());
        assert!(to.join("library").join("library.bib").is_file());
        assert_eq!(location(&place).unwrap(), Some(Location { folder: to, moving_from: None }));
    }

    #[test]
    fn a_copied_move_brings_what_was_written_after_the_copy_and_leaves_out_the_work() {
        let tmp = tempfile::tempdir().unwrap();
        let place = tmp.path().join("config");
        let from = tmp.path().join("old");
        let to = tmp.path().join("new");
        some_data(&from);
        let mut told = Vec::new();
        copy_tree(&from, &to, false, &mut |done, count| told.push((done, count))).unwrap();
        assert_eq!(told.first(), Some(&(0, 2)), "the count first: the library and the project");
        assert_eq!(told.last(), Some(&(2, 2)));
        assert!(!to.join("work").exists(), "the work folder is made again, not moved");
        assert!(!to.join(".in-use").exists());
        assert!(to.join("dictionaries").is_dir(), "an empty folder is made where the data goes");
        check_copy(&from, &to).unwrap();
        // Written while Glaukopis closed, after the copy.
        std::thread::sleep(std::time::Duration::from_millis(20));
        fs::write(from.join("projects").join("p1").join("info.json"), "{\"name\":\"later\"}").unwrap();
        fs::write(from.join("settings.json"), "{}").unwrap();
        set_location(&place, &Location { folder: to.clone(), moving_from: Some(from.clone()) }).unwrap();
        assert_eq!(finish_move(&place).unwrap(), to);
        assert!(!from.exists(), "the old folder is removed once everything is checked");
        assert_eq!(
            fs::read_to_string(to.join("projects").join("p1").join("info.json")).unwrap(),
            "{\"name\":\"later\"}"
        );
        assert!(to.join("settings.json").is_file());
        assert_eq!(location(&place).unwrap().unwrap().moving_from, None);
    }

    #[test]
    fn a_copy_that_does_not_check_leaves_both_folders_and_the_old_place() {
        let tmp = tempfile::tempdir().unwrap();
        let place = tmp.path().join("config");
        let from = tmp.path().join("old");
        let to = tmp.path().join("new");
        some_data(&from);
        copy_tree(&from, &to, false, &mut |_, _| {}).unwrap();
        // The copy shortened: the check finds it.
        fs::write(to.join("library").join("library.bib"), "@").unwrap();
        assert!(check_copy(&from, &to).is_err());
        set_location(&place, &Location { folder: to.clone(), moving_from: Some(from.clone()) }).unwrap();
        // A copy that cannot be written over, so that the move fails.
        let file = to.join("library").join("library.bib");
        let mut perms = fs::metadata(&file).unwrap().permissions();
        perms.set_readonly(true);
        fs::set_permissions(&file, perms.clone()).unwrap();
        let finished = finish_move(&place);
        #[allow(clippy::permissions_set_readonly_false)]
        perms.set_readonly(false);
        fs::set_permissions(&file, perms).unwrap();
        assert!(finished.is_err());
        assert!(from.join("library").join("library.bib").is_file(), "the old folder is as it was");
        assert!(to.exists(), "and the new one is left");
        assert_eq!(location(&place).unwrap(), Some(Location { folder: from, moving_from: None }));
    }

    #[test]
    fn a_folder_inside_the_data_is_refused() {
        let tmp = tempfile::tempdir().unwrap();
        let from = tmp.path().join("data");
        some_data(&from);
        assert!(copy_tree(&from, &from.join("inside"), false, &mut |_, _| {}).is_err());
    }

    #[test]
    fn one_at_a_time_works_in_a_directory() {
        let tmp = tempfile::tempdir().unwrap();
        let dir = DataDir::open(tmp.path().join("data")).unwrap();
        let first = dir.claim().unwrap();
        assert!(first.is_some());
        assert!(dir.claim().unwrap().is_none(), "a second is refused while the first holds it");
        let other = DataDir::open(tmp.path().join("other")).unwrap();
        assert!(other.claim().unwrap().is_some(), "another directory is another matter");
        drop(first);
        // A program another test starts at the same time holds a copy of the
        // file, and so the lock, between being forked and running what it
        // runs: the claim is free again, but perhaps a moment later.
        let mut again = dir.claim().unwrap();
        for _ in 0..50 {
            if again.is_some() {
                break;
            }
            std::thread::sleep(std::time::Duration::from_millis(40));
            again = dir.claim().unwrap();
        }
        assert!(again.is_some(), "and it is free again when let go");
    }
}
