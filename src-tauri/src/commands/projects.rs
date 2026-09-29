//! Commands for projects. The document itself passes through as bytes,
//! written in base64 for the journey.

use base64::Engine;
use base64::engine::general_purpose::STANDARD as B64;
use serde::Serialize;
use tauri::State;

use glaukopis_core::i18n::tr;
use glaukopis_core::projects::{HistoryEntry, ProjectInfo, Summary};

use crate::error::{CommandError, CommandResult};
use crate::state::AppState;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Loaded {
    pub info: ProjectInfo,
    pub state: Option<String>,
    pub updates: Vec<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Trashed {
    pub entry: String,
    pub info: ProjectInfo,
}

fn decode(text: &str) -> CommandResult<Vec<u8>> {
    B64.decode(text)
        .map_err(|e| CommandError { kind: "invalid", message: tr!("core-projects-not-base64", error = e.to_string()) })
}

#[tauri::command(async)]
pub fn project_list(state: State<'_, AppState>) -> CommandResult<Vec<ProjectInfo>> {
    Ok(state.projects.list()?)
}

#[tauri::command(async)]
pub fn project_create(state: State<'_, AppState>, name: String, id: Option<String>) -> CommandResult<ProjectInfo> {
    Ok(match id {
        Some(id) => state.projects.create_with_id(&id, &name)?,
        None => state.projects.create(&name)?,
    })
}

#[tauri::command(async)]
pub fn project_rename(state: State<'_, AppState>, id: String, name: String) -> CommandResult<ProjectInfo> {
    Ok(state.projects.rename(&id, &name)?)
}

#[tauri::command(async)]
pub fn project_describe(state: State<'_, AppState>, id: String, description: String) -> CommandResult<ProjectInfo> {
    Ok(state.projects.update_info(&id, |info| info.description = description.trim().to_owned())?)
}

#[tauri::command(async)]
pub fn project_delete(state: State<'_, AppState>, id: String) -> CommandResult<()> {
    Ok(state.projects.delete(&id)?)
}

#[tauri::command(async)]
pub fn project_trash(state: State<'_, AppState>) -> CommandResult<Vec<Trashed>> {
    Ok(state.projects.trash()?.into_iter().map(|(entry, info)| Trashed { entry, info }).collect())
}

#[tauri::command(async)]
pub fn project_restore(state: State<'_, AppState>, entry: String) -> CommandResult<ProjectInfo> {
    Ok(state.projects.restore(&entry)?)
}

#[tauri::command(async)]
pub fn project_purge(state: State<'_, AppState>, entry: String) -> CommandResult<()> {
    Ok(state.projects.purge(&entry)?)
}

/// A new project that holds what the project held at an earlier time.
#[tauri::command(async)]
pub fn project_copy_from_history(
    state: State<'_, AppState>,
    id: String,
    entry: String,
    name: String,
) -> CommandResult<ProjectInfo> {
    Ok(state.projects.copy_from_history(&id, &entry, &name)?)
}

#[tauri::command(async)]
pub fn project_duplicate(state: State<'_, AppState>, id: String, name: String) -> CommandResult<ProjectInfo> {
    Ok(state.projects.duplicate(&id, &name)?)
}

#[tauri::command(async)]
pub fn project_load(state: State<'_, AppState>, id: String) -> CommandResult<Loaded> {
    let loaded = state.projects.load(&id)?;
    Ok(Loaded {
        info: loaded.info,
        state: loaded.state.map(|s| B64.encode(s)),
        updates: loaded.updates.iter().map(|u| B64.encode(u)).collect(),
    })
}

#[tauri::command(async)]
pub fn project_append(state: State<'_, AppState>, id: String, update: String) -> CommandResult<()> {
    Ok(state.projects.append(&id, &decode(&update)?)?)
}

#[tauri::command(async)]
pub fn project_save_state(
    state: State<'_, AppState>,
    id: String,
    document: String,
    summary: Option<Summary>,
) -> CommandResult<ProjectInfo> {
    Ok(state.projects.save_state(&id, &decode(&document)?, summary)?)
}

/// Remembers where the user was in the project.
#[tauri::command(async)]
pub fn project_save_view(state: State<'_, AppState>, id: String, view: serde_json::Value) -> CommandResult<()> {
    state.projects.update_info(&id, |info| info.view = view)?;
    Ok(())
}

#[tauri::command(async)]
pub fn project_history(state: State<'_, AppState>, id: String) -> CommandResult<Vec<HistoryEntry>> {
    Ok(state.projects.history(&id)?)
}

#[tauri::command(async)]
pub fn project_history_state(state: State<'_, AppState>, id: String, entry: String) -> CommandResult<String> {
    Ok(B64.encode(state.projects.history_state(&id, &entry)?))
}
