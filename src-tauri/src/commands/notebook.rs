//! Commands for the notebook (`glaukopis_core::notebook`): its document,
//! which passes as bytes as a project's does, and the files its notes hold,
//! which are in the library's store (`library/notebook.rs`). Mirrors
//! `src/lib/api/notebook.ts`.

use std::collections::HashSet;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};

use base64::Engine;
use base64::engine::general_purpose::STANDARD as B64;
use serde::{Deserialize, Serialize};
use tauri::ipc::{Request, Response};
use tauri::{AppHandle, Emitter, EventTarget, Manager, State, WebviewWindow};

use glaukopis_core::i18n::tr;
use glaukopis_core::library::{FileView, Library, attachments, files};
use glaukopis_core::notebook::{self, Place, Summary};

use super::projects::{put_part, with_head};
use super::viewer::blocking;
use crate::error::CommandResult;
use crate::state::AppState;

/// A file taken into the notebook, and what it says of itself.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NotebookFile {
    /// The file as the store keeps it.
    pub file: FileView,
    /// Of an image, the file a figure shows of it: itself, or a copy made to
    /// be shown. None for a file that is no image a figure can show.
    pub shown: Option<FileView>,
    /// When the file was last changed, as the library writes times; none for what was pasted.
    pub time: Option<String>,
    /// Of a photograph, when it was taken, as it says itself, of no time zone.
    pub taken: Option<String>,
    /// Of a photograph, where it was taken.
    pub place: Option<Place>,
}

/// Files taken into the notebook, and what could not be, a line each.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TakenFiles {
    pub files: Vec<NotebookFile>,
    pub problems: Vec<String>,
}

/// The event by which a change to the notebook is passed to the other windows.
pub const NOTEBOOK_UPDATE: &str = "notebook-update";

/// A change to the notebook, as one window wrote it, for the others: the
/// update of its document, in base64.
#[derive(Debug, Clone, Serialize)]
pub struct NotebookUpdate {
    pub update: String,
}

fn not_found() -> glaukopis_core::Error {
    glaukopis_core::Error::not_found(tr!("core-library-the-file-of-library"))
}

/// The file a figure shows of an image the notebook holds; none where it
/// cannot be told, which is said in the log and does not stop the rest.
fn shown(library: &mut Library, hash: &str) -> Option<FileView> {
    library.notebook_shown(hash).unwrap_or_else(|error| {
        tracing::warn!(%error, hash, "what a figure shows of a file of the notebook could not be made");
        None
    })
}

/// The notebook as it is on disk, as bytes: its state, empty where there is
/// none, and the changes after it. Each part has its length before it, and
/// the changes their number.
#[tauri::command(async)]
pub fn notebook_load(state: State<'_, AppState>) -> CommandResult<Response> {
    let loaded = state.notebook.load()?;
    let size = loaded.state.as_ref().map_or(0, Vec::len) + loaded.updates.iter().map(Vec::len).sum::<usize>();
    let mut out = Vec::with_capacity(size + 4 * (loaded.updates.len() + 2));
    put_part(&mut out, loaded.state.as_deref().unwrap_or_default());
    out.extend_from_slice(&(loaded.updates.len() as u32).to_le_bytes());
    for update in &loaded.updates {
        put_part(&mut out, update);
    }
    Ok(Response::new(out))
}

#[derive(Deserialize)]
struct AppendHead {
    time: Option<i64>,
}

/// Adds a change to the notebook's log, written at `time` in milliseconds
/// since 1970 (now, where it is not said); the change is the bytes of the
/// request after what it says of itself. It is passed to every other
/// window, as a change to a project is: the notebook open in two windows is
/// one document.
#[tauri::command(async)]
pub fn notebook_append(window: WebviewWindow, state: State<'_, AppState>, request: Request<'_>) -> CommandResult<()> {
    let (head, update) = with_head::<AppendHead>(&request)?;
    let time = head.time.unwrap_or_else(glaukopis_core::history::now_ms);
    state.notebook.append(&update, time)?;
    if update.is_empty() {
        return Ok(());
    }
    let from = window.label().to_owned();
    let passed = NotebookUpdate { update: B64.encode(&update) };
    let others = |target: &EventTarget| matches!(target, EventTarget::WebviewWindow { label } if *label != from);
    if let Err(error) = window.emit_filter(NOTEBOOK_UPDATE, passed, others) {
        tracing::warn!(%error, "a change to the notebook was not passed to the other windows");
    }
    Ok(())
}

#[derive(Deserialize)]
struct SaveHead {
    #[serde(default)]
    summary: Summary,
}

/// Saves the notebook's whole state, which is the bytes of the request
/// after what it says of itself, and empties its log.
#[tauri::command(async)]
pub fn notebook_save_state(state: State<'_, AppState>, request: Request<'_>) -> CommandResult<()> {
    let (head, document) = with_head::<SaveHead>(&request)?;
    Ok(state.notebook.save_state(&document, &head.summary)?)
}

/// Takes files of this computer into the notebook, and every file in the
/// folders among them: each is copied into the store with the library
/// free, and entered after as a file the notebook holds, with what it says
/// of itself, read from the file where it lies (which copying does not
/// change). A file the store has already is that file. Run on the threads
/// for blocking work: many files take long.
#[tauri::command]
pub async fn notebook_take_files(app: AppHandle, paths: Vec<String>) -> CommandResult<TakenFiles> {
    blocking(move || {
        let state = app.state::<AppState>();
        let dir = state.library().dir().to_owned();
        let paths: Vec<PathBuf> = paths.into_iter().map(PathBuf::from).collect();
        let (taken, problems) = files::store_paths(&dir, &paths, false, &mut |_, _, _| {}, &AtomicBool::new(false));
        let facts: Vec<notebook::Facts> =
            taken.iter().map(|t| notebook::facts(std::path::Path::new(&t.origin))).collect();
        let mut library = state.library();
        library.notebook_take(&taken)?;
        let mut out = Vec::with_capacity(taken.len());
        for (t, facts) in taken.iter().zip(facts) {
            let Some(hash) = attachments::hash_of_path(&t.stored) else { continue };
            let Some(file) = library.file_view(hash) else { continue };
            let shown = shown(&mut library, hash);
            out.push(NotebookFile { file, shown, time: facts.time, taken: facts.taken, place: facts.place });
        }
        Ok(TakenFiles { files: out, problems })
    })
    .await
}

/// Takes a picture into the notebook from what the page holds, in base64:
/// one pasted. It is made what a figure shows first, as the library makes
/// a picture pasted.
#[tauri::command(async)]
pub fn notebook_take_image(state: State<'_, AppState>, name: String, content: String) -> CommandResult<NotebookFile> {
    let bytes =
        B64.decode(content.trim()).map_err(|_| glaukopis_core::Error::invalid(tr!("core-pictures-not-whole")))?;
    let mut library = state.library();
    let file = library.notebook_take_image(&name, &bytes)?;
    let shown = shown(&mut library, &file.hash);
    Ok(NotebookFile { file, shown, time: None, taken: None, place: None })
}

/// A file of the store by its hash, whether the library lists it or the notebook holds it alone.
#[tauri::command(async)]
pub fn notebook_file(state: State<'_, AppState>, hash: String) -> CommandResult<FileView> {
    Ok(state.library().file_view(&hash).ok_or_else(not_found)?)
}

/// Says that notes hold these files of the store.
#[tauri::command(async)]
pub fn notebook_hold(state: State<'_, AppState>, hashes: Vec<String>) -> CommandResult<()> {
    Ok(state.library().notebook_hold(&hashes)?)
}

/// Puts a file the notebook holds among the library's files, with where it came from.
#[tauri::command(async)]
pub fn notebook_to_library(
    state: State<'_, AppState>,
    hash: String,
    origin: Option<String>,
) -> CommandResult<FileView> {
    Ok(state.library().to_library(&hash, origin.as_deref())?)
}

/// Says which files the notes hold, when the notebook has been read for the
/// first time in this run: what the notebook held alone and no note holds
/// leaves the store. The files the notebook said it held when it was last
/// saved are held as well, so that a page that read less than there is
/// removes nothing a saved note holds. Done once in a run; asked again, it
/// does nothing. Gives how many files left the store.
#[tauri::command(async)]
pub fn notebook_sweep(state: State<'_, AppState>, held: Vec<String>) -> CommandResult<usize> {
    if state.notebook_swept.swap(true, Ordering::SeqCst) {
        return Ok(0);
    }
    let saved = state.notebook.held();
    let held: HashSet<&str> = held.iter().chain(&saved).map(String::as_str).collect();
    let swept = state.library().notebook_sweep(&held);
    if swept.is_err() {
        // What failed may be asked again.
        state.notebook_swept.store(false, Ordering::SeqCst);
    }
    Ok(swept?)
}
