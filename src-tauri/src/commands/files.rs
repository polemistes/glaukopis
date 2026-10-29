//! Commands for the files of the library and their folders (ADR 0043).

use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::sync::atomic::{AtomicBool, Ordering};

use base64::Engine;
use base64::engine::general_purpose::STANDARD as B64;
use serde::{Deserialize, Serialize};
use tauri::ipc::Response;
use tauri::{AppHandle, State};

use glaukopis_core::i18n::tr;
use glaukopis_core::library::export::{ExportSelection, Exported};
use glaukopis_core::library::figures::{self, Edit, EditFacts};
use glaukopis_core::library::files::{self, FileFolder};
use glaukopis_core::library::small;
use glaukopis_core::library::{self, FileView, Library, TakenIn, attachments};
use glaukopis_core::sharing::{Remote, Synced, Used};

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
    pub files: usize,
    pub folders: usize,
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

// ---- images, as figures show them (ADR 0070) ----

/// The thumbnail of a file: an image, or the first page of a PDF, at most
/// so wide; made once and kept. The library is let go before it is made.
#[tauri::command(async)]
pub fn file_small(state: State<'_, AppState>, hash: String) -> CommandResult<Response> {
    let (dir, stored, name) = {
        let library = state.library();
        let record = library
            .files
            .get(&hash)
            .ok_or_else(|| glaukopis_core::Error::not_found(tr!("core-library-the-file-of-library")))?;
        (library.dir().to_owned(), record.path.clone(), record.name.clone())
    };
    let bytes = small::small(&dir, &hash, &stored, &name, &state.tools(), &state.data.work())?;
    Ok(Response::new(bytes))
}

/// Says what an image shows, in words, for those who do not see it.
#[tauri::command(async)]
pub fn file_set_alt(state: State<'_, AppState>, hash: String, alt: String) -> CommandResult<FileView> {
    Ok(state.library().set_alt(&hash, &alt)?)
}

/// Keeps the bookmarks of a file of the library (ADR 0072), in the stead of
/// those it had.
#[tauri::command(async)]
pub fn file_bookmarks_set(
    state: State<'_, AppState>,
    hash: String,
    bookmarks: Vec<glaukopis_core::library::Bookmark>,
) -> CommandResult<FileView> {
    Ok(state.library().set_bookmarks(&hash, bookmarks)?)
}

/// The file a figure made of this image shows: itself, or a copy made beside it.
#[tauri::command(async)]
pub fn file_for_figure(state: State<'_, AppState>, hash: String) -> CommandResult<FileView> {
    Ok(state.library().for_figure(&hash)?)
}

// ---- an image edited (ADR 0071) ----

/// What an edit of an image begins from: how large it is upright, what an
/// edit of it is kept as, whether it can be edited and whether it is too
/// large to be.
#[tauri::command(async)]
pub fn file_edit_facts(state: State<'_, AppState>, hash: String) -> CommandResult<EditFacts> {
    Ok(state.library().edit_facts(&hash)?)
}

/// The image shown while it is edited: upright, no larger than 2400 pixels
/// on its longer side, a JPEG or PNG. Made each time and kept nowhere; the
/// library is let go before the file is read.
#[tauri::command(async)]
pub fn file_edit_preview(state: State<'_, AppState>, hash: String) -> CommandResult<Response> {
    let (dir, stored) = {
        let library = state.library();
        (library.dir().to_owned(), record_path(&library, &hash)?)
    };
    let path = attachments::absolute(&dir, &stored)?;
    let bytes = std::fs::read(&path).map_err(|e| glaukopis_core::Error::io(tr!("io-reading", path = &path), e))?;
    let (shown, _, _) = figures::preview(&bytes, figures::PREVIEW_LONGEST)?;
    Ok(Response::new(shown))
}

/// Keeps the image edited as a new file beside it, made from it; the image
/// itself stays as it was. The library is not held while the pixels are
/// worked on.
#[tauri::command(async)]
pub fn file_edit_keep(state: State<'_, AppState>, hash: String, edit: Edit) -> CommandResult<FileView> {
    Ok(library::edited(state.library_lock(), &hash, &edit)?)
}

/// A smaller copy of an image too large to be edited, kept beside it.
#[tauri::command(async)]
pub fn file_smaller_copy(state: State<'_, AppState>, hash: String) -> CommandResult<FileView> {
    Ok(library::smaller_copy(state.library_lock(), &hash)?)
}

/// Takes in an image that the interface holds, one that was pasted or
/// dropped from where there are no files, into `folder` or the folder
/// *Images*: as a figure shows it.
#[tauri::command(async)]
pub fn files_add_image(
    state: State<'_, AppState>,
    name: String,
    content: String,
    folder: Option<String>,
) -> CommandResult<FileView> {
    let bytes =
        B64.decode(content.trim()).map_err(|_| glaukopis_core::Error::invalid(tr!("core-pictures-not-whole")))?;
    Ok(state.library().add_image(&name, &bytes, folder.as_deref(), None)?.0)
}

/// Takes in an image that is a file on this computer, dropped on a text or
/// chosen to be a figure, into the folder *Images*, and gives the file a
/// figure shows of it: itself, or a copy made beside it. One the library
/// has already stays where it is. The file is copied before the library is
/// held.
#[tauri::command(async)]
pub fn files_take_in_for_figure(state: State<'_, AppState>, path: PathBuf) -> CommandResult<FileView> {
    // What is no image a figure can show is refused before it is taken in.
    glaukopis_core::library::figures::check_image_file(&path)?;
    let dir = state.library().dir().to_owned();
    let name = path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
    let stored = attachments::store_file(&dir, &path, &name)?;
    let hash = attachments::hash_of_path(&stored).unwrap_or_default().to_owned();
    let mut library = state.library();
    let folder = library.images_folder()?;
    let taken = files::Taken { stored, folders: Vec::new(), origin: path.display().to_string() };
    library.enter_taken(&[taken], Some(&folder))?;
    Ok(library.for_figure(&hash)?)
}

/// Sends the images of a project that the server lacks and fetches those
/// that are lacking here. `used` are the images of its figures. Nothing is
/// done for a project that is not shared.
#[tauri::command(async)]
pub fn files_sync(state: State<'_, AppState>, id: String, used: Vec<Used>) -> CommandResult<Synced> {
    // A project that is not shared, or no longer there, has nothing to
    // bring together; one whose sharing or token cannot be read fails, lest
    // its figures stop being brought together without a word.
    let (sharing, token) = match state.projects.shared(&id) {
        Ok(shared) => shared,
        Err(e) if matches!(e.kind(), "invalid" | "not-found") => return Ok(Synced::default()),
        Err(e) => return Err(e.into()),
    };
    let client = state.client();
    let remote = Remote::new(&client, &sharing.server)?;
    Ok(remote.sync_pictures(&sharing.room, &token, state.library_lock(), &used)?)
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
