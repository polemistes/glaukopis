//! Commands for bringing notes of other programs into the notebook
//! (`glaukopis_core::import::notes`): what a folder or a file holds, looked
//! at first, and the notes read, with their pictures and files taken into
//! the store as the notebook's. Mirrors the part of `src/lib/api/notebook.ts`
//! of notes brought in from other programs.

use std::path::PathBuf;

use tauri::{AppHandle, Manager};

use glaukopis_core::import::notes::{self, Look, ReadNotes};

use super::viewer::blocking;
use super::work::{self, Work};
use crate::error::CommandResult;
use crate::state::AppState;

/// The event by which the page is told how far a reading of notes has come.
pub const NOTES_PROGRESS: &str = "notes-progress";

/// What a folder or a file of notes holds, looked at before anything is read.
pub type NotesLook = Look;

/// Looks at a folder or a file of another program's notes, without taking
/// anything in: which program's, how many notes and files, and what the
/// writer should know first. One look at a folder and its files' names, or
/// at an export's tags.
#[tauri::command]
pub async fn notes_look(app: AppHandle, path: PathBuf) -> CommandResult<NotesLook> {
    blocking(move || {
        let tools = app.state::<AppState>().tools();
        Ok(notes::look(&path, &tools)?)
    })
    .await
}

/// Reads the notes at `path`, telling the page how far it has come by
/// `notes-progress` with its ticket: their pictures and files are taken into
/// the store as the notebook's while it reads. Stopped by its ticket, it
/// fails with the kind `stopped`. Run on the threads for blocking work.
#[tauri::command]
pub async fn notes_read(app: AppHandle, path: PathBuf, ticket: String) -> CommandResult<ReadNotes> {
    blocking(move || {
        let state = app.state::<AppState>();
        let work = Work::begin(Some(ticket));
        let mut count = work.counter(&app, NOTES_PROGRESS);
        let read = notes::read(&path, &state.tools(), state.library_lock(), &state.data.work(), &mut count, &work.stop);
        Ok(read?)
    })
    .await
}

/// Stops a reading of notes that goes on.
#[tauri::command(async)]
pub fn notes_read_stop(ticket: String) {
    work::stop(&ticket);
}
