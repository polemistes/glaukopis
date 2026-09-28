//! Commands for bringing documents in, to become maps.

use std::cell::RefCell;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

use tauri::State;

use glaukopis_core::import::document::{self, Imported};

use crate::error::CommandResult;
use crate::state::AppState;

/// The readings that are going on, by the tickets they were asked for with,
/// each with what stops it.
static READING: Mutex<Vec<(String, Arc<AtomicBool>)>> = Mutex::new(Vec::new());

fn readings() -> std::sync::MutexGuard<'static, Vec<(String, Arc<AtomicBool>)>> {
    READING.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
}

/// Reads a document from a file: its parts, what it says of itself, and
/// what the one who brings it in should know. Its pictures are taken into
/// the store. With a ticket, the reading can be stopped while it goes on.
#[tauri::command(async)]
pub fn document_read(state: State<'_, AppState>, path: PathBuf, ticket: Option<String>) -> CommandResult<Imported> {
    let stop = Arc::new(AtomicBool::new(false));
    if let Some(ticket) = &ticket {
        readings().push((ticket.clone(), stop.clone()));
    }
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
        .and_then(|()| document::read(&path, &state.tools(), &state.pictures, &state.data.work(), &keys, &stop));
    if let Some(ticket) = &ticket {
        readings().retain(|(t, _)| t != ticket);
    }
    Ok(read?)
}

/// Stops a reading that goes on.
#[tauri::command(async)]
pub fn document_read_stop(ticket: String) {
    for (_, stop) in readings().iter().filter(|(t, _)| *t == ticket) {
        stop.store(true, Ordering::Relaxed);
    }
}

/// Takes out of the store the pictures that were taken in for a document
/// of which no map was made after all.
#[tauri::command(async)]
pub fn document_forget(state: State<'_, AppState>, pictures: Vec<String>) {
    document::forget(&state.pictures, &pictures);
}
