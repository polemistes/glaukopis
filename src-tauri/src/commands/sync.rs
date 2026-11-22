//! Commands for the synchronization between the writer's computers (record
//! 0120), and the engine as the application runs it. Mirrors
//! `src/lib/api/sync.ts`.
//!
//! The engine is the core's (`glaukopis_core::sync`), one thread that brings
//! this computer to be the same as its home. What it has to tell goes to
//! every window as an event; what another computer wrote into a project or
//! the notebook is handed to the windows as a change of another window is
//! (record 0085), and is in the log already.

use std::sync::Arc;

use base64::Engine as _;
use base64::engine::general_purpose::STANDARD as B64;
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, State};

use glaukopis_core::sync::kept::Apart;
use glaukopis_core::sync::remote::{NewCode, Told};
use glaukopis_core::sync::{self, Hears, Status, Sync};

use super::notebook::{NOTEBOOK_UPDATE, NotebookUpdate};
use super::projects::{PROJECT_UPDATE, ProjectUpdate};
use super::viewer::blocking;
use crate::error::CommandResult;
use crate::state::AppState;

/// The event by which the status of the synchronization is told when it changes.
pub const SYNC: &str = "sync";

/// The event that tells that a project was written in on two computers while they were apart.
pub const PROJECT_APART: &str = "project-apart";

/// A project that was written in apart: its id, and its name.
#[derive(Clone, Serialize)]
pub struct ProjectApart {
    pub id: String,
    pub name: String,
}

/// The engine, telling the windows of this application what it has to tell.
pub fn engine(app: &AppHandle, state: &AppState) -> Arc<Sync> {
    let (of_status, of_project, of_notebook, of_apart) = (app.clone(), app.clone(), app.clone(), app.clone());
    let told = |sent: tauri::Result<()>, what: &str| {
        if let Err(error) = sent {
            tracing::warn!(%error, "the windows were not told of {what}");
        }
    };
    let hears = Hears {
        status: Box::new(move |status| told(of_status.emit(SYNC, status.clone()), "the status of the synchronization")),
        project: Box::new(move |id, update| {
            let passed = ProjectUpdate { id: id.to_owned(), update: B64.encode(update) };
            told(of_project.emit(PROJECT_UPDATE, passed), "what another computer wrote into a project");
        }),
        notebook: Box::new(move |update| {
            let passed = NotebookUpdate { update: B64.encode(update) };
            told(of_notebook.emit(NOTEBOOK_UPDATE, passed), "what another computer wrote into the notebook");
        }),
        apart: Box::new(move |id, name| {
            let passed = ProjectApart { id: id.to_owned(), name: name.to_owned() };
            told(of_apart.emit(PROJECT_APART, passed), "a project written in apart");
        }),
    };
    Arc::new(Sync::new(&state.data, state.projects.clone(), state.notebook.clone(), state.library_shared(), hears))
}

/// Something was written on this computer: the engine sends it in a moment.
/// Nothing, where the application runs without one, as the window of a note does.
pub fn touched(app: &AppHandle) {
    if let Some(sync) = app.try_state::<Arc<Sync>>() {
        sync.touched();
    }
}

type Engine<'a> = State<'a, Arc<Sync>>;

#[tauri::command]
pub fn sync_status(sync: Engine<'_>) -> Status {
    sync.status()
}

/// What the system calls this computer: what it is offered to be called among the others.
#[tauri::command]
pub fn sync_computer() -> String {
    sync::computer()
}

/// Makes a home on a server, with this computer as its first.
#[tauri::command]
pub async fn sync_start(
    sync: Engine<'_>,
    server: String,
    name: String,
    password: Option<String>,
) -> CommandResult<Status> {
    let sync = sync.inner().clone();
    blocking(move || Ok(sync.start(&server, &name, password.as_deref())?)).await
}

/// Enters a home by a code made on a computer that is in it.
#[tauri::command]
pub async fn sync_join(sync: Engine<'_>, server: String, code: String, name: String) -> CommandResult<Status> {
    let sync = sync.inner().clone();
    blocking(move || Ok(sync.join(&server, &code, &name)?)).await
}

/// The computers of the home and the codes that are open, asked of the server.
#[tauri::command]
pub async fn sync_home(sync: Engine<'_>) -> CommandResult<Told> {
    let sync = sync.inner().clone();
    blocking(move || Ok(sync.told()?)).await
}

/// Makes a code by which one more computer may enter. It is told this once.
#[tauri::command]
pub async fn sync_code(sync: Engine<'_>) -> CommandResult<NewCode> {
    let sync = sync.inner().clone();
    blocking(move || Ok(sync.code()?)).await
}

#[tauri::command]
pub async fn sync_rename(sync: Engine<'_>, device: String, name: String) -> CommandResult<Told> {
    let sync = sync.inner().clone();
    blocking(move || Ok(sync.rename(&device, &name)?)).await
}

/// Removes another computer from the home.
#[tauri::command]
pub async fn sync_remove(sync: Engine<'_>, device: String) -> CommandResult<Told> {
    let sync = sync.inner().clone();
    blocking(move || Ok(sync.remove(&device)?)).await
}

/// This computer leaves its home. What it holds stays.
#[tauri::command]
pub async fn sync_stop(sync: Engine<'_>) -> CommandResult<Status> {
    let sync = sync.inner().clone();
    blocking(move || Ok(sync.stop()?)).await
}

/// A round is made at once.
#[tauri::command]
pub fn sync_now(sync: Engine<'_>) {
    sync.now();
}

/// What is kept of a project having been written in on two computers
/// apart, until the writer has seen it: when, the moment before, and the
/// version kept.
#[tauri::command(async)]
pub fn project_apart(sync: Engine<'_>, id: String) -> CommandResult<Option<Apart>> {
    Ok(sync.apart(&id)?)
}

#[tauri::command(async)]
pub fn project_apart_seen(sync: Engine<'_>, id: String) -> CommandResult<()> {
    Ok(sync.apart_seen(&id)?)
}
