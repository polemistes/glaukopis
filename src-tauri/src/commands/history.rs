//! Commands for the full history of a project (ADR 0021). What is kept is
//! given to the interface as the records are written, in bytes; records
//! merged by the interface come back the same way, in base64.

use std::path::{Path, PathBuf};

use base64::Engine;
use base64::engine::general_purpose::STANDARD as B64;
use tauri::State;
use tauri::ipc::Response;

use glaukopis_core::history::{self, Record, Stretch};
use glaukopis_core::i18n::tr;

use crate::error::{CommandError, CommandResult};
use crate::state::AppState;

fn decode(text: &str) -> CommandResult<Vec<u8>> {
    B64.decode(text)
        .map_err(|e| CommandError { kind: "invalid", message: tr!("core-projects-not-base64", error = e.to_string()) })
}

/// Everything the history of a project holds, the oldest first, as records.
/// Nothing, where it keeps none.
#[tauri::command(async)]
pub fn history_read(state: State<'_, AppState>, id: String) -> CommandResult<Response> {
    Ok(Response::new(history::encode_all(&state.projects.changes(&id)?)))
}

/// How much room the history of a project takes on disk, in bytes.
#[tauri::command(async)]
pub fn history_room(state: State<'_, AppState>, id: String) -> CommandResult<u64> {
    Ok(state.projects.changes_room(&id)?)
}

/// Deletes the history of a project, when it is turned off.
#[tauri::command(async)]
pub fn history_delete(state: State<'_, AppState>, id: String) -> CommandResult<()> {
    Ok(state.projects.forget_changes(&id)?)
}

/// Replaces a stretch of the history by the records the interface merged it into.
#[tauri::command(async)]
pub fn history_merge(state: State<'_, AppState>, id: String, stretch: Stretch, records: String) -> CommandResult<()> {
    let merged = history::decode(&decode(&records)?, Path::new("merged"));
    Ok(state.projects.merge_changes(&id, stretch, merged)?)
}

/// Takes the history before a moment out of a project, into an archive where
/// a file is given. What is left begins with `start`, the whole state then.
#[tauri::command(async)]
pub fn history_cut(
    state: State<'_, AppState>,
    id: String,
    stretch: Stretch,
    start: String,
    time: i64,
    archive: Option<PathBuf>,
) -> CommandResult<()> {
    let start = Record::start(decode(&start)?, time);
    Ok(state.projects.cut_changes(&id, stretch, start, archive.as_deref())?)
}

/// What an archive of history holds, to be looked at.
#[tauri::command(async)]
pub fn history_archive_read(path: PathBuf) -> CommandResult<Response> {
    Ok(Response::new(history::encode_all(&history::read_archive(&path)?)))
}
