//! Commands for the files of the library and their folders (ADR 0043).

use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex, MutexGuard};

use serde::Serialize;
use tauri::{AppHandle, Emitter, State};

use glaukopis_core::i18n::tr;
use glaukopis_core::library::files::{self, FileFolder};
use glaukopis_core::library::{FileView, Library, TakenIn, attachments};
use glaukopis_core::pictures::Picture;

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

/// Deletes a folder; what was in it moves up to where it was.
#[tauri::command(async)]
pub fn files_folder_delete(state: State<'_, AppState>, id: String) -> CommandResult<()> {
    let mut library = state.library();
    library.files.folder_delete(&id)?;
    library.save_files()?;
    Ok(())
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
    let work = Ticket::begin(ticket);
    let (entries, index, wanted) = {
        let mut library = state.library();
        library.refresh()?;
        let mut wanted = Vec::new();
        for hash in &hashes {
            if let Some(record) = library.files.get(hash) {
                let path = library.attachment_path(&record.path)?;
                let kind = files::kind_of(&record.path);
                wanted.push(Wanted { hash: hash.clone(), name: record.name.clone(), path, kind });
            }
        }
        (library.entries().to_vec(), library.duplicates_index().clone(), wanted)
    };
    let ask = ask.unwrap_or(true);
    let tell = Mutex::new(work.teller(&app));
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
                    loop {
                        let i = next.fetch_add(1, Ordering::Relaxed);
                        let Some(file) = wanted.get(i) else { break };
                        if work.stop.load(Ordering::Relaxed) {
                            break;
                        }
                        at_hand.lock().unwrap_or_else(|p| p.into_inner()).push(file.name.clone());
                        told(done.load(Ordering::Relaxed), &file.name);
                        let known = known_of(&state, file, ask, &work.stop);
                        let proposal = proposals::propose(&entries, &index, known);
                        // What was cut short by the stop may be less than the file would tell.
                        if !work.stop.load(Ordering::Relaxed) {
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
            .collect();
        // What went wrong in finding out about a file is not passed over in silence.
        for h in working {
            h.join().unwrap_or_else(|e| std::panic::resume_unwind(e));
        }
    });
    // In the order the files were asked for, whatever order they were found out about in.
    Ok(found.into_inner().unwrap_or_else(|p| p.into_inner()).into_iter().flatten().collect())
}

/// A file to find out about, as the library knows it.
struct Wanted {
    hash: String,
    name: String,
    path: PathBuf,
    kind: FileKind,
}

/// What can be found out of a file before it is compared with the library:
/// of a PDF, what it says of itself and what the services say of its
/// identifier; of any other file, nothing but its name, which `propose` reads.
fn known_of(state: &AppState, file: &Wanted, ask: bool, stop: &AtomicBool) -> Known {
    let mut known = Known { hash: file.hash.clone(), name: file.name.clone(), ..Default::default() };
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

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct FilesProgress {
    ticket: String,
    done: usize,
    total: usize,
    /// The file at hand.
    name: String,
}

/// The work on files that goes on, by the tickets it was asked for with,
/// each with what stops it.
static GOING: Mutex<Vec<(String, Arc<AtomicBool>)>> = Mutex::new(Vec::new());

fn going() -> MutexGuard<'static, Vec<(String, Arc<AtomicBool>)>> {
    GOING.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
}

/// What stops the work with a ticket, and forgets it when the work is done.
pub(crate) struct Ticket {
    ticket: Option<String>,
    pub stop: Arc<AtomicBool>,
}

impl Ticket {
    pub(crate) fn begin(ticket: Option<String>) -> Self {
        let stop = Arc::new(AtomicBool::new(false));
        if let Some(t) = &ticket {
            going().push((t.clone(), stop.clone()));
        }
        Ticket { ticket, stop }
    }

    /// Tells the interface how far the work has come, as `files-progress`.
    pub(crate) fn teller<'a>(&'a self, app: &'a AppHandle) -> impl FnMut(usize, usize, &str) + 'a {
        move |done, total, name| {
            if let Some(ticket) = &self.ticket {
                let _ = app.emit(
                    "files-progress",
                    FilesProgress { ticket: ticket.clone(), done, total, name: name.to_owned() },
                );
            }
        }
    }
}

impl Drop for Ticket {
    fn drop(&mut self) {
        if let Some(t) = &self.ticket {
            going().retain(|(x, _)| x != t);
        }
    }
}

/// Stops the work on files with this ticket: taking in, finding out, exporting.
#[tauri::command(async)]
pub fn files_stop(ticket: String) {
    for (_, stop) in going().iter().filter(|(t, _)| *t == ticket) {
        stop.store(true, Ordering::Relaxed);
    }
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
    let work = Ticket::begin(ticket);
    let dir = state.library().dir().to_owned();
    if let Some(folder) = &folder {
        state.library().files.folder(folder)?;
    }
    let paths: Vec<PathBuf> = paths.into_iter().map(PathBuf::from).collect();
    let (taken, problems) =
        files::store_paths(&dir, &paths, structure.unwrap_or(true), &mut work.teller(&app), &work.stop);
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

/// A name with the ending of its kind, where it has none.
fn with_ending(name: &str, extension: &str) -> String {
    let ending = format!(".{}", extension.to_lowercase());
    if Path::new(name).extension().is_some() || name.to_lowercase().ends_with(&ending) {
        name.to_owned()
    } else {
        format!("{name}{ending}")
    }
}
