//! Commands for the store of pictures, and for mathematics as it is shown
//! where it is written.

use std::path::PathBuf;

use base64::Engine;
use base64::engine::general_purpose::STANDARD as B64;
use tauri::State;
use tauri::ipc::Response;

use glaukopis_core::Error;
use glaukopis_core::export::math::{self, Formula, Rendered};
use glaukopis_core::i18n::tr;
use glaukopis_core::pictures::{Change, Picture};
use glaukopis_core::sharing::{Remote, Synced, Used};

use crate::error::CommandResult;
use crate::state::AppState;

/// The pictures of the store, the one taken in last first.
#[tauri::command(async)]
pub fn picture_list(state: State<'_, AppState>) -> Vec<Picture> {
    state.pictures.list()
}

#[tauri::command(async)]
pub fn picture_get(state: State<'_, AppState>, hash: String) -> CommandResult<Picture> {
    Ok(state.pictures.get(&hash)?)
}

/// Takes in a picture that is a file on this computer.
#[tauri::command(async)]
pub fn picture_add_file(state: State<'_, AppState>, path: PathBuf) -> CommandResult<Picture> {
    Ok(state.pictures.add_from(&path)?)
}

/// Takes in a picture that the interface holds: one that was pasted, or
/// dropped from where there are no files.
#[tauri::command(async)]
pub fn picture_add(state: State<'_, AppState>, name: String, content: String) -> CommandResult<Picture> {
    let bytes = B64.decode(content.trim()).map_err(|_| Error::invalid(tr!("core-pictures-not-whole")))?;
    Ok(state.pictures.add(&name, &bytes)?)
}

/// The picture itself, as it is kept; or, with `small`, as it is shown in a list.
#[tauri::command(async)]
pub fn picture_read(
    state: State<'_, AppState>,
    hash: String,
    extension: String,
    small: Option<bool>,
) -> CommandResult<Response> {
    let bytes = if small.unwrap_or(false) {
        state.pictures.small(&hash, &extension)?
    } else {
        state.pictures.read(&hash, &extension)?
    };
    Ok(Response::new(bytes))
}

/// Says something anew of a picture: what it is called, what is said of it
/// where it becomes a figure, what it shows, what the user makes of it.
#[tauri::command(async)]
pub fn picture_update(state: State<'_, AppState>, hash: String, change: Change) -> CommandResult<Picture> {
    Ok(state.pictures.update(&hash, change)?)
}

/// Takes a picture out of the store.
#[tauri::command(async)]
pub fn picture_remove(state: State<'_, AppState>, hash: String) -> CommandResult<()> {
    Ok(state.pictures.remove(&hash)?)
}

/// Sends the pictures of a project that the server lacks and fetches those
/// that are lacking here. `used` are the pictures of its figures. Nothing is
/// done for a project that is not shared.
#[tauri::command(async)]
pub fn picture_sync(state: State<'_, AppState>, id: String, used: Vec<Used>) -> CommandResult<Synced> {
    let Ok((sharing, token)) = state.projects.shared(&id) else { return Ok(Synced::default()) };
    let client = state.client();
    let remote = Remote::new(&client, &sharing.server)?;
    Ok(remote.sync_pictures(&sharing.room, &token, &state.pictures, &used)?)
}

/// Formulas as MathML, in their order.
#[tauri::command(async)]
pub fn math_render(state: State<'_, AppState>, formulas: Vec<Formula>) -> CommandResult<Vec<Rendered>> {
    Ok(math::render(&state.tools(), &formulas)?)
}
