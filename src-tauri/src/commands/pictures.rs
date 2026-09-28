//! Commands for the pictures of a project, and for mathematics as it is
//! shown where it is written.

use std::path::PathBuf;

use base64::Engine;
use base64::engine::general_purpose::STANDARD as B64;
use tauri::State;
use tauri::ipc::Response;

use glaukopis_core::Error;
use glaukopis_core::export::math::{self, Formula, Rendered};
use glaukopis_core::pictures::Picture;
use glaukopis_core::sharing::{Remote, Synced};

use crate::error::CommandResult;
use crate::state::AppState;

/// Takes in a picture that is a file on this computer.
#[tauri::command(async)]
pub fn picture_add_file(state: State<'_, AppState>, id: String, path: PathBuf) -> CommandResult<Picture> {
    Ok(state.projects.pictures(&id)?.add_from(&path)?)
}

/// Takes in a picture that the interface holds: one that was pasted, or
/// dropped from where there are no files.
#[tauri::command(async)]
pub fn picture_add(state: State<'_, AppState>, id: String, name: String, content: String) -> CommandResult<Picture> {
    let bytes = B64.decode(content.trim()).map_err(|_| Error::invalid("the picture did not arrive whole"))?;
    Ok(state.projects.pictures(&id)?.add(&name, &bytes)?)
}

/// The picture itself, as it is kept.
#[tauri::command(async)]
pub fn picture_read(
    state: State<'_, AppState>,
    id: String,
    hash: String,
    extension: String,
) -> CommandResult<Response> {
    Ok(Response::new(state.projects.pictures(&id)?.read(&hash, &extension)?))
}

/// Which of these pictures are here.
#[tauri::command(async)]
pub fn picture_present(
    state: State<'_, AppState>,
    id: String,
    pictures: Vec<(String, String)>,
) -> CommandResult<Vec<bool>> {
    let store = state.projects.pictures(&id)?;
    Ok(pictures.iter().map(|(hash, extension)| store.has(hash, extension)).collect())
}

/// Sends the pictures the server lacks and fetches those that are lacking
/// here. Nothing is done for a project that is not shared.
#[tauri::command(async)]
pub fn picture_sync(state: State<'_, AppState>, id: String) -> CommandResult<Synced> {
    let Ok((sharing, token)) = state.projects.shared(&id) else { return Ok(Synced::default()) };
    let client = state.client();
    let remote = Remote::new(&client, &sharing.server)?;
    Ok(remote.sync_pictures(&sharing.room, &token, &state.projects.pictures(&id)?)?)
}

/// Formulas as MathML, in their order.
#[tauri::command(async)]
pub fn math_render(state: State<'_, AppState>, formulas: Vec<Formula>) -> CommandResult<Vec<Rendered>> {
    Ok(math::render(&state.tools(), &formulas)?)
}
