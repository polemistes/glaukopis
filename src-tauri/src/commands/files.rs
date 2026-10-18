//! Commands for the files of the library and their folders (ADR 0043).

use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::sync::atomic::{AtomicBool, Ordering};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};

use glaukopis_core::i18n::tr;
use glaukopis_core::library::export::{ExportSelection, Exported};
use glaukopis_core::library::files::{self, FileFolder};
use glaukopis_core::library::{FileView, Library, TakenIn, attachments};
use glaukopis_core::pictures::Picture;

use super::work::{self, Work};
use crate::error::CommandResult;
use crate::state::AppState;

/// The folders and the files of the library.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FilesListing {
    pub folders: Vec<FileFolder>,
    pub files: Vec<FileView>,
}

pub(crate) fn files_listing(library: &Library) -> FilesListing {
    FilesListing { folders: library.files.folders_sorted(), files: library.file_views() }
}

fn view(library: &Library, hash: &str) -> CommandResult<FileView> {
    library
        .file_view(hash)
        .ok_or_else(|| glaukopis_core::Error::not_found(tr!("core-library-the-file-of-library")).into())
}

fn record_path(library: &Library, hash: &str) -> CommandResult<String> {
    Ok(library
        .files
        .get(hash)
        .ok_or_else(|| glaukopis_core::Error::not_found(tr!("core-library-the-file-of-library")))?
        .path
        .clone())
}

#[tauri::command(async)]
pub fn files_list(state: State<'_, AppState>) -> CommandResult<FilesListing> {
    let mut library = state.library();
    library.refresh()?;
    Ok(files_listing(&library))
}

// ---- folders ----

#[tauri::command(async)]
pub fn files_folder_create(
    state: State<'_, AppState>,
    name: String,
    parent: Option<String>,
) -> CommandResult<FileFolder> {
    let mut library = state.library();
    let folder = library.files.folder_create(&name, parent.as_deref())?;
    library.save_files()?;
    Ok(folder)
}

#[tauri::command(async)]
pub fn files_folder_rename(state: State<'_, AppState>, id: String, name: String) -> CommandResult<FileFolder> {
    let mut library = state.library();
    let folder = library.files.folder_rename(&id, &name)?;
    library.save_files()?;
    Ok(folder)
}

/// Puts a folder in another, or at the top. Refused where it would lie under itself.
#[tauri::command(async)]
pub fn files_folder_move(state: State<'_, AppState>, id: String, parent: Option<String>) -> CommandResult<FileFolder> {
    let mut library = state.library();
    let folder = library.files.folder_move(&id, parent.as_deref())?;
    library.save_files()?;
    Ok(folder)
}

/// Deletes a folder. With `withFolders`, the folders under it go too, else
/// they move up to where it was; with `withFiles`, the files in the folders
/// that go are removed from the library, else they are put where it was.
/// Returns how many files were removed.
#[tauri::command(async)]
pub fn files_folder_delete(
    state: State<'_, AppState>,
    id: String,
    with_folders: bool,
    with_files: bool,
) -> CommandResult<usize> {
    Ok(state.library().delete_folder(&id, with_folders, with_files)?)
}

// ---- one file ----

/// Puts a file in a folder, or at the top in none.
#[tauri::command(async)]
pub fn file_move(state: State<'_, AppState>, hash: String, folder: Option<String>) -> CommandResult<FileView> {
    let mut library = state.library();
    library.files.move_file(&hash, folder.as_deref())?;
    library.save_files()?;
    view(&library, &hash)
}

/// What the file is called in the lists. The file in the store keeps its name.
#[tauri::command(async)]
pub fn file_rename(state: State<'_, AppState>, hash: String, name: String) -> CommandResult<FileView> {
    let mut library = state.library();
    library.files.rename(&hash, &name)?;
    library.save_files()?;
    view(&library, &hash)
}

/// Removes a file from the library: from every reference that has it, and from the store.
#[tauri::command(async)]
pub fn file_remove(state: State<'_, AppState>, hash: String) -> CommandResult<()> {
    Ok(state.library().remove_file(&hash)?)
}

// ---- many files at once ----

/// A file and a reference, for giving many files each to its own.
#[derive(Deserialize)]
pub struct FileAndReference {
    hash: String,
    id: String,
}

fn pairs_of(pairs: Vec<FileAndReference>) -> Vec<(String, String)> {
    pairs.into_iter().map(|p| (p.hash, p.id)).collect()
}

/// What came of removing many files.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FilesRemoved {
    files: usize,
    folders: usize,
}

/// The folders that removing these files would leave empty, for asking
/// whether they go too. Those that were empty before are not among them.
#[tauri::command(async)]
pub fn files_left_empty(state: State<'_, AppState>, hashes: Vec<String>) -> CommandResult<Vec<String>> {
    let library = state.library();
    let wanted = hashes.iter().map(String::as_str).collect();
    Ok(library.files.left_empty(&wanted))
}

/// Removes many files from the library at once, as `file_remove` removes
/// one; with `folders`, the folders this leaves empty go too.
#[tauri::command(async)]
pub fn files_remove(state: State<'_, AppState>, hashes: Vec<String>, folders: bool) -> CommandResult<FilesRemoved> {
    let (files, folders) = state.library().remove_files(&hashes, folders)?;
    Ok(FilesRemoved { files, folders })
}

/// Puts many files in a folder, or at the top in none.
#[tauri::command(async)]
pub fn files_move(state: State<'_, AppState>, hashes: Vec<String>, folder: Option<String>) -> CommandResult<()> {
    Ok(state.library().move_files(&hashes, folder.as_deref())?)
}

/// Gives many files to references, each to its own; says what could not be given.
#[tauri::command(async)]
pub fn files_assign(state: State<'_, AppState>, pairs: Vec<FileAndReference>) -> CommandResult<Vec<String>> {
    Ok(state.library().assign_files(&pairs_of(pairs))?)
}

/// Takes many files from references, each from its own; the files stay.
#[tauri::command(async)]
pub fn files_unassign(state: State<'_, AppState>, pairs: Vec<FileAndReference>) -> CommandResult<()> {
    Ok(state.library().unassign_files(&pairs_of(pairs))?)
}

/// Makes a file one of a reference's.
#[tauri::command(async)]
pub fn file_assign(state: State<'_, AppState>, hash: String, id: String) -> CommandResult<FileView> {
    let mut library = state.library();
    let path = record_path(&library, &hash)?;
    library.attach_stored(&id, &path, None)?;
    view(&library, &hash)
}

/// Takes a file from a reference; the file stays in the library.
#[tauri::command(async)]
pub fn file_unassign(state: State<'_, AppState>, hash: String, id: String) -> CommandResult<FileView> {
    let mut library = state.library();
    let path = record_path(&library, &hash)?;
    let linked: Vec<String> = library
        .require(&id)?
        .attachments()
        .into_iter()
        .filter(|f| attachments::hash_of_path(f) == Some(hash.as_str()))
        .collect();
    for stored in linked.iter().chain(std::iter::once(&path)) {
        library.detach(&id, stored)?;
    }
    view(&library, &hash)
}

/// Where a file of the library is on this computer: for handing a file to
/// what takes paths, as an import does.
#[tauri::command(async)]
pub fn file_path(state: State<'_, AppState>, hash: String) -> CommandResult<String> {
    let library = state.library();
    let path = record_path(&library, &hash)?;
    Ok(library.attachment_path(&path)?.display().to_string())
}

// ---- finding out ----

use std::sync::atomic::AtomicUsize;

use glaukopis_core::import::proposals::{self, Known, Proposal};
use glaukopis_core::library::files::FileKind;

use crate::commands::sources::identify;

/// What may be found out of the files with these hashes, for the going-through:
/// for each, the works of the library it may belong to, the most certain
/// first, and a new reference where the services know the identifier printed
/// in it and the library does not. A PDF is read, and its identifier looked
/// up where `ask` (the default); every file is known by its name as well. The
/// library is held only while what is needed of it is copied, so that it is
/// free while the files are read and looked up. With a ticket, the interface
/// is told how far it has come (`files-progress`), and it can be stopped
/// (`files_stop`): it then gives what was found out before, and leaves out the
/// files it had not finished. Hashes the library does not know are left out.
#[tauri::command(async)]
pub fn files_identify(
    app: AppHandle,
    state: State<'_, AppState>,
    hashes: Vec<String>,
    ask: Option<bool>,
    ticket: Option<String>,
) -> CommandResult<Vec<Proposal>> {
    let work = Work::begin(ticket);
    let (entries, index, wanted) = {
        let mut library = state.library();
        library.refresh()?;
        let mut wanted = Vec::new();
        for hash in &hashes {
            if let Some(record) = library.files.get(hash) {
                let path = library.attachment_path(&record.path)?;
                let kind = files::kind_of(&record.path);
                // The folder it stands in and those above it, the nearest first.
                let folders = record
                    .folder
                    .as_deref()
                    .map(|f| library.files.path_of(f).into_iter().rev().map(|f| f.name).collect())
                    .unwrap_or_default();
                wanted.push(Wanted { hash: hash.clone(), name: record.name.clone(), path, kind, folders });
            }
        }
        (library.entries().to_vec(), library.duplicates_index().clone(), wanted)
    };
    let ask = ask.unwrap_or(true);
    let tell = Mutex::new(work.counter(&app, work::FILES_PROGRESS));
    let told = |done: usize, name: &str| {
        let mut tell = tell.lock().unwrap_or_else(|p| p.into_inner());
        (*tell)(done, wanted.len(), name);
    };

    // A few files at a time, as the import of PDF files has them: each is
    // read, and may be looked up, which is mostly waiting. The interface is
    // told how many are done, and of a file at hand, whenever either changes.
    const AT_ONCE: usize = 3;
    let next = AtomicUsize::new(0);
    let done = AtomicUsize::new(0);
    let found: Mutex<Vec<Option<Proposal>>> = Mutex::new(wanted.iter().map(|_| None).collect());
    let at_hand: Mutex<Vec<String>> = Mutex::new(Vec::new());
    std::thread::scope(|s| {
        let working: Vec<_> = (0..AT_ONCE.min(wanted.len()))
            .map(|_| {
                s.spawn(|| {
                    super::guarded(&work.stop, || {
                        loop {
                            let i = next.fetch_add(1, Ordering::Relaxed);
                            let Some(file) = wanted.get(i) else { break };
                            if work.stopped() {
                                break;
                            }
                            at_hand.lock().unwrap_or_else(|p| p.into_inner()).push(file.name.clone());
                            told(done.load(Ordering::Relaxed), &file.name);
                            let known = known_of(&state, file, ask, &work.stop);
                            let proposal = proposals::propose(&entries, &index, known);
                            // What was cut short by the stop may be less than the file would tell.
                            if !work.stopped() {
                                found.lock().unwrap_or_else(|p| p.into_inner())[i] = Some(proposal);
                            }
                            let finished = done.fetch_add(1, Ordering::Relaxed) + 1;
                            let still = {
                                let mut at_hand = at_hand.lock().unwrap_or_else(|p| p.into_inner());
                                at_hand.retain(|n| *n != file.name);
                                at_hand.first().cloned()
                            };
                            told(finished, still.as_deref().unwrap_or(""));
                        }
                    })
                })
            })
            .collect();
        // What went wrong in finding out about a file is not passed over in
        // silence: a worker that panicked fails the command, which answers.
        super::all_answered(working.into_iter().map(|h| h.join()))
    })?;
    // In the order the files were asked for, whatever order they were found out about in.
    Ok(found.into_inner().unwrap_or_else(|p| p.into_inner()).into_iter().flatten().collect())
}

/// A file to find out about, as the library knows it.
struct Wanted {
    hash: String,
    name: String,
    path: PathBuf,
    kind: FileKind,
    folders: Vec<String>,
}

/// What can be found out of a file before it is compared with the library:
/// of a PDF, what it says of itself and what the services say of its
/// identifier; of any other file, nothing but its name, which `propose` reads.
fn known_of(state: &AppState, file: &Wanted, ask: bool, stop: &AtomicBool) -> Known {
    let mut known =
        Known { hash: file.hash.clone(), name: file.name.clone(), folders: file.folders.clone(), ..Default::default() };
    if file.kind != FileKind::Pdf {
        return known;
    }
    if let Some(found) = identify(state, &file.path, ask, &mut known.notes, stop) {
        known.notes.extend(found.said);
        known.lookup = found.looked_up.then_some(found.candidate);
        known.facts = Some(found.facts);
    }
    known
}

// ---- taking in ----

/// Stops the work on files with this ticket: taking in, finding out, exporting.
#[tauri::command(async)]
pub fn files_stop(ticket: String) {
    work::stop(&ticket);
}

/// Takes files and folders into the library, into `folder`: a folder with
/// the folders in it, where `structure` is asked for. They are copied with
/// the library free, and entered into its record after. What was taken in
/// before it was stopped is kept.
#[tauri::command(async)]
pub fn files_take_in(
    app: AppHandle,
    state: State<'_, AppState>,
    paths: Vec<String>,
    folder: Option<String>,
    structure: Option<bool>,
    ticket: Option<String>,
) -> CommandResult<TakenIn> {
    let work = Work::begin(ticket);
    let dir = state.library().dir().to_owned();
    if let Some(folder) = &folder {
        state.library().files.folder(folder)?;
    }
    let paths: Vec<PathBuf> = paths.into_iter().map(PathBuf::from).collect();
    let (taken, problems) = files::store_paths(
        &dir,
        &paths,
        structure.unwrap_or(true),
        &mut work.counter(&app, work::FILES_PROGRESS),
        &work.stop,
    );
    let mut library = state.library();
    let mut out = library.enter_taken(&taken, folder.as_deref())?;
    out.problems.splice(0..0, problems);
    Ok(out)
}

// ---- between the files and the pictures ----

/// Takes a picture that is a file of the library into the store of
/// pictures, so that it can become a figure. The file stays where it was.
#[tauri::command(async)]
pub fn file_to_picture(state: State<'_, AppState>, hash: String) -> CommandResult<Picture> {
    let (absolute, name) = {
        let library = state.library();
        let path = record_path(&library, &hash)?;
        let name = library.files.get(&hash).map(|r| r.name.clone()).unwrap_or_default();
        (library.attachment_path(&path)?, name)
    };
    let bytes =
        std::fs::read(&absolute).map_err(|e| glaukopis_core::Error::io(tr!("io-reading", path = &absolute), e))?;
    Ok(state.pictures.add(&name, &bytes)?)
}

/// Takes a picture of the store of pictures into the files of the library,
/// into `folder`, and makes it one of the reference `id`'s where that is
/// given. The picture stays where it was.
#[tauri::command(async)]
pub fn picture_to_file(
    state: State<'_, AppState>,
    hash: String,
    id: Option<String>,
    folder: Option<String>,
) -> CommandResult<FileView> {
    let picture = state.pictures.get(&hash)?;
    let source = state.pictures.path(&picture.hash, &picture.extension)?;
    let dir = state.library().dir().to_owned();
    let name = with_ending(&picture.name, &picture.extension);
    let stored = attachments::store_file(&dir, &source, &name)?;
    let mut library = state.library();
    let taken = files::Taken { stored: stored.clone(), folders: Vec::new(), origin: String::new() };
    library.enter_taken(&[taken], folder.as_deref())?;
    if let Some(id) = &id {
        library.attach_stored(id, &stored, None)?;
    }
    let file_hash = attachments::hash_of_path(&stored).unwrap_or_default().to_owned();
    view(&library, &file_hash)
}

/// A name with the ending of its kind, where it has none. What follows the
/// last point is an ending only when it is one of a picture: "Fig. 3" and
/// "Plate 2.1" have none, and would otherwise be files of no kind.
fn with_ending(name: &str, extension: &str) -> String {
    let extension = extension.to_lowercase();
    let has = name.rsplit_once('.').is_some_and(|(_, after)| {
        let after = after.to_lowercase();
        after == extension || glaukopis_core::ocr::PICTURE_ENDINGS.contains(&after.as_str())
    });
    if has { name.to_owned() } else { format!("{name}.{extension}") }
}

// ---- export ----

/// Writes the files of the selection into the folder `into`, under readable
/// names in the folders of the store, with a `references.bib` beside them
/// where `with_bib` is asked for. The library is copied, and let go before
/// the files are, so that it may be used meanwhile. What was written before
/// it was stopped stays.
#[tauri::command(async)]
pub fn files_export(
    app: AppHandle,
    state: State<'_, AppState>,
    selection: ExportSelection,
    into: String,
    with_bib: Option<bool>,
    ticket: Option<String>,
) -> CommandResult<Exported> {
    let work = Work::begin(ticket);
    let library = {
        let mut library = state.library();
        library.refresh()?;
        library.clone()
    };
    Ok(library.export_files(
        &selection,
        Path::new(&into),
        with_bib.unwrap_or(false),
        &mut work.counter(&app, work::FILES_PROGRESS),
        &work.stop,
    )?)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_picture_becomes_a_file_with_the_ending_of_its_kind() {
        assert_eq!(with_ending("Fig. 3", "png"), "Fig. 3.png");
        assert_eq!(with_ending("Plate 2.1", "jpg"), "Plate 2.1.jpg");
        assert_eq!(with_ending("map", "PNG"), "map.png");
        assert_eq!(with_ending("map.png", "png"), "map.png");
        assert_eq!(with_ending("Scan.TIFF", "tif"), "Scan.TIFF");
        assert_eq!(with_ending("drawing.svg", "svg"), "drawing.svg");
        assert_eq!(glaukopis_core::library::files::kind_of(&with_ending("Fig. 3", "png")), files::FileKind::Picture);
    }
}
