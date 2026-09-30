//! Commands for projects. The document itself passes through as bytes, as
//! it is: a project that is opened, and every change that is saved, is sent
//! without being written out in text for the journey.

use base64::Engine;
use base64::engine::general_purpose::STANDARD as B64;
use serde::Serialize;
use serde::de::DeserializeOwned;
use tauri::State;
use tauri::ipc::{InvokeBody, Request, Response};

use glaukopis_core::i18n::tr;
use glaukopis_core::projects::{HistoryEntry, ProjectInfo, Summary};

use crate::error::{CommandError, CommandResult};
use crate::state::AppState;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Trashed {
    pub entry: String,
    pub info: ProjectInfo,
}

/// What a request of bytes says of itself before them, and the bytes: the
/// body is the length of what it says (four bytes, least first), that in
/// JSON, and the bytes. See `api/projects.ts`.
fn with_head<T: DeserializeOwned>(request: &Request<'_>) -> CommandResult<(T, Vec<u8>)> {
    let unread = |why: String| CommandError { kind: "invalid", message: tr!("core-projects-not-base64", error = why) };
    let InvokeBody::Raw(body) = request.body() else { return Err(unread("not bytes".into())) };
    let size = body.get(..4).map(|b| u32::from_le_bytes([b[0], b[1], b[2], b[3]]) as usize);
    let Some(head) = size.and_then(|n| body.get(4..4 + n)) else { return Err(unread("too short".into())) };
    let said = serde_json::from_slice(head).map_err(|e| unread(e.to_string()))?;
    Ok((said, body[4 + head.len()..].to_vec()))
}

/// Parts one after another, each with its length before it (four bytes, least first).
fn put_part(out: &mut Vec<u8>, part: &[u8]) {
    out.extend_from_slice(&(part.len() as u32).to_le_bytes());
    out.extend_from_slice(part);
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

/// A project as it is on disk, as bytes: what is known of it, in JSON; its
/// state, which is empty where there is none; and the changes after it. Each
/// part has its length before it, and the changes their number.
#[tauri::command(async)]
pub fn project_load(state: State<'_, AppState>, id: String) -> CommandResult<Response> {
    let loaded = state.projects.load(&id)?;
    let info = serde_json::to_vec(&loaded.info).map_err(glaukopis_core::Error::from)?;
    let size =
        info.len() + loaded.state.as_ref().map_or(0, Vec::len) + loaded.updates.iter().map(Vec::len).sum::<usize>();
    let mut out = Vec::with_capacity(size + 4 * (loaded.updates.len() + 3));
    put_part(&mut out, &info);
    put_part(&mut out, loaded.state.as_deref().unwrap_or_default());
    out.extend_from_slice(&(loaded.updates.len() as u32).to_le_bytes());
    for update in &loaded.updates {
        put_part(&mut out, update);
    }
    Ok(Response::new(out))
}

#[derive(serde::Deserialize)]
struct AppendHead {
    id: String,
    here: Option<bool>,
    time: Option<i64>,
}

/// Adds a change to the log: made here or received from another, and when it
/// was written, in milliseconds since 1970 (now, where it is not said). The
/// change is the bytes of the request, after what it says of itself.
#[tauri::command(async)]
pub fn project_append(state: State<'_, AppState>, request: Request<'_>) -> CommandResult<()> {
    let (head, update) = with_head::<AppendHead>(&request)?;
    let time = head.time.unwrap_or_else(glaukopis_core::history::now_ms);
    Ok(state.projects.append_change(&head.id, &update, head.here.unwrap_or(true), time)?)
}

#[derive(serde::Deserialize)]
struct SaveHead {
    id: String,
    summary: Option<Summary>,
    keep: Option<bool>,
}

/// Saves the whole state, which is the bytes of the request after what it
/// says of itself. With `keep`, where the full history of the project is on,
/// what the log held is kept in it.
#[tauri::command(async)]
pub fn project_save_state(state: State<'_, AppState>, request: Request<'_>) -> CommandResult<ProjectInfo> {
    let (head, document) = with_head::<SaveHead>(&request)?;
    Ok(state.projects.save_state_keeping(&head.id, &document, head.summary, head.keep.unwrap_or(false))?)
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
