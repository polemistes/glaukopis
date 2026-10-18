//! Commands for a project as one file (ADR 0036). The document passes
//! through as bytes, as it does for projects; what is done with it is the
//! interface's.

use std::collections::HashMap;
use std::path::Path;

use serde::{Deserialize, Serialize};
use tauri::ipc::{Request, Response};
use tauri::{AppHandle, State};

use glaukopis_core::projectfile::{self, Choice, Contents, Found, Manifest, Record};

use super::library::{EntryFull, full};
use super::projects::{put_part, with_head};
use crate::error::CommandResult;
use crate::state::AppState;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct WriteHead {
    path: String,
    name: String,
    #[serde(default)]
    description: String,
    /// The pictures the figures show, by their hash.
    #[serde(default)]
    pictures: Vec<String>,
    /// The works cited, as the document keeps them.
    #[serde(default)]
    records: Vec<Record>,
}

/// Writes a project file: what it is written from says itself before the
/// bytes of the document, as `with_head` reads it.
#[tauri::command(async)]
pub fn project_file_write(app: AppHandle, state: State<'_, AppState>, request: Request<'_>) -> CommandResult<()> {
    let (head, document) = with_head::<WriteHead>(&request)?;
    let manifest = Manifest {
        name: head.name,
        description: head.description,
        app: app.package_info().version.to_string(),
        ..Default::default()
    };
    let contents = Contents { manifest, state: &document, pictures: &head.pictures, records: &head.records };
    // The library is not held while the file is written: a copy of it is enough.
    let library = state.library().clone();
    Ok(projectfile::write(Path::new(&head.path), &contents, &state.pictures, Some(&library))?)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReadHead {
    pub manifest: Manifest,
    /// How many pictures the store did not have.
    pub pictures: usize,
}

/// Reads a project file and takes its pictures into the store. Gives what
/// the file says of itself, in JSON, and the document, each with its length
/// before it, as `project_load` gives a project.
#[tauri::command(async)]
pub fn project_file_read(state: State<'_, AppState>, path: String) -> CommandResult<Response> {
    let opened = projectfile::read(Path::new(&path))?;
    let added = projectfile::take_pictures(&state.pictures, &opened.pictures);
    let head = serde_json::to_vec(&ReadHead { manifest: opened.manifest, pictures: added })
        .map_err(glaukopis_core::Error::from)?;
    let mut out = Vec::with_capacity(head.len() + opened.state.len() + 8);
    put_part(&mut out, &head);
    put_part(&mut out, &opened.state);
    Ok(Response::new(out))
}

/// What each work a project file cites is to the library.
#[tauri::command(async)]
pub fn project_file_references(state: State<'_, AppState>, records: Vec<Record>) -> CommandResult<Vec<Found>> {
    let mut library = state.library();
    library.refresh()?;
    Ok(projectfile::examine(&library, &records))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SettledWork {
    pub from: String,
    pub to: String,
    /// The library's entry the project is to cite, as it is now.
    pub reference: Option<EntryFull>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Settled {
    pub settled: Vec<SettledWork>,
    pub added: Vec<String>,
    pub changed: Vec<String>,
    pub problems: Vec<String>,
}

/// Brings the works of a project file into the library as was chosen, and
/// says by which entry each is to be cited.
#[tauri::command(async)]
pub fn project_file_settle(
    state: State<'_, AppState>,
    records: Vec<Record>,
    choices: HashMap<String, Choice>,
) -> CommandResult<Settled> {
    let mut library = state.library();
    let done = projectfile::settle(&mut library, &records, &choices)?;
    let settled = done
        .settled
        .into_iter()
        .map(|s| {
            let reference = library.get(&s.to).map(|e| full(&library, e));
            SettledWork { from: s.from, to: s.to, reference }
        })
        .collect();
    Ok(Settled { settled, added: done.added, changed: done.changed, problems: done.problems })
}
