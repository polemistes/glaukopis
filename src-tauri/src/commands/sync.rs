//! Commands for the synchronization between the writer's computers (record
//! 0120), and the engine as the application runs it. Mirrors
//! `src/lib/api/sync.ts`.
//!
//! The engine is the core's (`glaukopis_core::sync`), one thread that brings
//! this computer to be the same as its home. What it has to tell goes to
//! every window as an event; what another computer wrote into a project or
//! the notebook is handed to the windows as a change of another window is
//! (record 0085), and is in the log already.

use std::sync::{Arc, OnceLock};

use base64::Engine as _;
use base64::engine::general_purpose::STANDARD as B64;
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, State};

use glaukopis_core::sync::kept::Apart;
use glaukopis_core::sync::remote::{NewCode, Told};
use glaukopis_core::sync::{self, Hears, Status, Sync, Takes};

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

/// Whom an engine tells what it has to tell: the application, once it is
/// known. An engine made before there is any window (the phone's door, for
/// a round with the app closed: `door.rs`) tells nobody until the role that
/// takes it over sets this.
pub type Windows = Arc<OnceLock<AppHandle>>;

/// The engine, telling the windows of this application what it has to tell.
/// What `takes` says is what the device takes of its home: everything on a
/// computer, the notes on a phone (`phone.rs`).
pub fn engine(app: &AppHandle, state: &AppState, takes: Takes) -> Arc<Sync> {
    let windows: Windows = Arc::new(OnceLock::new());
    let _ = windows.set(app.clone());
    engine_for(windows, state, takes)
}

/// The engine, telling what it has to tell to `windows` at the moment it is
/// to be told, where they are known by then, and to nobody before.
pub fn engine_for(windows: Windows, state: &AppState, takes: Takes) -> Arc<Sync> {
    let (of_status, of_project, of_notebook, of_apart) = (windows.clone(), windows.clone(), windows.clone(), windows);
    let hears = Hears {
        status: Box::new(move |status| tell(&of_status, SYNC, status.clone(), "the status of the synchronization")),
        project: Box::new(move |id, update| {
            let passed = ProjectUpdate { id: id.to_owned(), update: B64.encode(update) };
            tell(&of_project, PROJECT_UPDATE, passed, "what another computer wrote into a project");
        }),
        notebook: Box::new(move |update| {
            let passed = NotebookUpdate { update: B64.encode(update) };
            tell(&of_notebook, NOTEBOOK_UPDATE, passed, "what another computer wrote into the notebook");
        }),
        apart: Box::new(move |id, name| {
            let passed = ProjectApart { id: id.to_owned(), name: name.to_owned() };
            tell(&of_apart, PROJECT_APART, passed, "a project written in apart");
        }),
    };
    // What the role says this device takes of its home.
    Arc::new(Sync::new(
        &state.data,
        state.projects.clone(),
        state.notebook.clone(),
        state.library_shared(),
        takes,
        hears,
    ))
}

/// Tells the windows something, where they are known.
fn tell<T: Serialize + Clone>(windows: &Windows, event: &str, payload: T, what: &str) {
    let Some(app) = windows.get() else { return };
    if let Err(error) = app.emit(event, payload) {
        tracing::warn!(%error, "the windows were not told of {what}");
    }
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

/// What the system calls this device: what it is offered to be called among the others.
#[tauri::command]
pub fn sync_device() -> String {
    sync::device()
}

/// Whether the app is in front: a phone's engine rests where it is not, and
/// makes one round on going behind and one on coming back (the phone's alone).
#[tauri::command]
pub fn sync_front(sync: Engine<'_>, front: bool) {
    sync.front(front);
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
