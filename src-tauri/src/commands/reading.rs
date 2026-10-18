//! Commands for bringing documents in, to become maps.

use std::cell::RefCell;
use std::collections::HashMap;
use std::path::PathBuf;

use tauri::State;

use glaukopis_core::import::document::{self, Imported};

use super::work::{self, Work};
use crate::error::CommandResult;
use crate::state::AppState;

/// Reads a document from a file: its parts, what it says of itself, and
/// what the one who brings it in should know. Its pictures are taken into
/// the store. With a ticket, the reading can be stopped while it goes on.
/// With `stored`, the path is that of a file of the library, in its store.
#[tauri::command(async)]
pub fn document_read(
    state: State<'_, AppState>,
    path: PathBuf,
    ticket: Option<String>,
    stored: Option<bool>,
) -> CommandResult<Imported> {
    let path = if stored.unwrap_or(false) { state.library().attachment_path(&path.to_string_lossy())? } else { path };
    let work = Work::begin(ticket);
    // The library as it is now; every key is looked for once.
    let refreshed = state.library().refresh().map(|_| ());
    let known: RefCell<HashMap<String, Option<String>>> = RefCell::new(HashMap::new());
    let keys = |key: &str| -> Option<String> {
        if let Some(found) = known.borrow().get(key) {
            return found.clone();
        }
        let found = state.library().by_key(key).map(|entry| entry.id.clone());
        known.borrow_mut().insert(key.to_owned(), found.clone());
        found
    };
    let read = refreshed
        .and_then(|()| document::read(&path, &state.tools(), &state.pictures, &state.data.work(), &keys, &work.stop));
    Ok(read?)
}

/// Stops a reading that goes on.
#[tauri::command(async)]
pub fn document_read_stop(ticket: String) {
    work::stop(&ticket);
}

/// Takes out of the store the pictures that were taken in for a document
/// of which no map was made after all.
#[tauri::command(async)]
pub fn document_forget(state: State<'_, AppState>, pictures: Vec<String>) {
    document::forget(&state.pictures, &pictures);
}
