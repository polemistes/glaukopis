//! Commands for the readable copy of a project (ADR 0041): its Org form,
//! the works it cites and its pictures, written into the project's own
//! folder at every save or into a folder the writer chooses, and read back
//! from one to make a new project. The Org form is the interface's to write
//! and to read; the core puts the folder together.

use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tauri::State;
use tauri::ipc::Request;

use glaukopis_core::bib;
use glaukopis_core::library::entry::Draft;
use glaukopis_core::projectfile::{self, Record};
use glaukopis_core::readable::{self, Readable};

use super::projects::with_head;
use crate::error::CommandResult;
use crate::state::AppState;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct WriteHead {
    /// The project, whose own folder the copy is kept in; or
    id: Option<String>,
    /// a folder the writer chose.
    path: Option<String>,
    /// The pictures the figures show, by their hash.
    #[serde(default)]
    pictures: Vec<String>,
    /// The works cited, as the document keeps them.
    #[serde(default)]
    records: Vec<Record>,
}

/// Writes the readable copy: the Org form is the bytes of the request after
/// what it says of itself, as `with_head` reads it.
#[tauri::command(async)]
pub fn project_readable_write(state: State<'_, AppState>, request: Request<'_>) -> CommandResult<()> {
    let (head, org) = with_head::<WriteHead>(&request)?;
    let org = String::from_utf8_lossy(&org);
    let dir: PathBuf = match (&head.id, &head.path) {
        (Some(id), _) => state.projects.readable_dir(id)?,
        (None, Some(path)) => PathBuf::from(path),
        (None, None) => return Err(glaukopis_core::Error::invalid("no place for the readable copy").into()),
    };
    // The library is not held while the folder is written: a copy of it is enough.
    let library = state.library().clone();
    let copy = Readable { org: &org, records: &head.records, pictures: &head.pictures };
    Ok(readable::write(&dir, &copy, &library, Some(&library))?)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReadOrg {
    /// The Org form, as it was written.
    pub org: String,
    /// The works beside it, each by its key, which is also its id here:
    /// the citations of the Org form name works by their keys.
    pub records: Vec<Record>,
    /// How many pictures the library did not have.
    pub pictures: usize,
}

/// Reads an Org file, or the folder that holds `project.org`, with the works
/// and the pictures beside it; the pictures are taken into the library.
#[tauri::command(async)]
pub fn project_readable_read(state: State<'_, AppState>, path: String) -> CommandResult<ReadOrg> {
    let read = readable::read(Path::new(&path))?;
    let pictures = projectfile::take_pictures(state.library_lock(), &read.pictures);
    let records = bib::parser::parse(&read.bib)
        .entries()
        .map(|raw| {
            let draft = Draft::from_raw(raw);
            Record {
                id: draft.key.clone(),
                key: draft.key,
                entry_type: draft.entry_type,
                fields: draft.fields,
                names: draft.names,
            }
        })
        .collect();
    Ok(ReadOrg { org: read.org, records, pictures })
}
