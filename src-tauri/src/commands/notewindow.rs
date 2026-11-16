//! Commands of a note written in a window of its own (record 0109,
//! `glaukopis_core::notebook::note_window`): the application in another
//! role, `glaukopis --note`, which has these, the few of the application's
//! that need nothing of it (the languages, the clipboard, a file read, the
//! page's log). Mirrors `src/lib/api/notewindow.ts`.

use std::path::Path;

use base64::Engine;
use base64::engine::general_purpose::STANDARD as B64;
use serde::Serialize;
use serde_json::{Map, Value};
use tauri::{AppHandle, Manager, State};

use glaukopis_core::i18n::tr;
use glaukopis_core::notebook::note_window::{Added, NoteText, NoteWindow};

use super::viewer::blocking;
use crate::error::{CommandError, CommandResult};

/// The window of a note, in the data folder it writes into; or what was
/// wrong with finding that folder (a chosen one not there), which the
/// window says when its note cannot be kept or sent.
pub struct NoteWindowState(pub Result<NoteWindow, String>);

impl NoteWindowState {
    fn window(&self) -> CommandResult<&NoteWindow> {
        self.0.as_ref().map_err(|message| CommandError { kind: "not-found", message: message.clone() })
    }
}

/// What the window of a note begins with: the settings, read and never
/// written, for its language and its look; and the note written in it
/// before and not sent, where there is one.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteWindowStart {
    pub settings: Map<String, Value>,
    pub unsent: Option<NoteText>,
}

/// Files added to a note, and what could not be added, a line each.
#[derive(Debug, Serialize)]
pub struct AddedFiles {
    pub files: Vec<Added>,
    pub problems: Vec<String>,
}

#[tauri::command(async)]
pub fn note_window_start(state: State<'_, NoteWindowState>) -> NoteWindowStart {
    match &state.0 {
        Ok(window) => NoteWindowStart { settings: window.settings(), unsent: window.unsent() },
        Err(_) => NoteWindowStart { settings: Map::new(), unsent: None },
    }
}

/// Keeps the note written and not sent, in place of what was kept
/// before; one that holds nothing, and what was kept goes, its files with it.
#[tauri::command]
pub async fn note_window_keep(app: AppHandle, text: NoteText) -> CommandResult<()> {
    blocking(move || Ok(app.state::<NoteWindowState>().window()?.keep(&text)?)).await
}

/// Writes the note into the notebook's inbox, its files with it, and
/// forgets what was kept of it; the application takes it in at its start,
/// or within a moment where it runs.
#[tauri::command]
pub async fn note_window_send(app: AppHandle, text: NoteText) -> CommandResult<()> {
    blocking(move || {
        let id = app.state::<NoteWindowState>().window()?.send(&text)?;
        tracing::info!(id, "a note was written into the notebook's inbox");
        Ok(())
    })
    .await
}

/// Adds files of this computer to the note, each copied beside it; what
/// could not be added, as one larger than the inbox takes, is said a line
/// each, and the rest go on.
#[tauri::command]
pub async fn note_window_add_files(app: AppHandle, paths: Vec<String>) -> CommandResult<AddedFiles> {
    blocking(move || {
        let state = app.state::<NoteWindowState>();
        let window = state.window()?;
        let mut added = AddedFiles { files: Vec::new(), problems: Vec::new() };
        for path in &paths {
            match window.add_file(Path::new(path)) {
                Ok(file) => added.files.push(file),
                Err(error) => added.problems.push(error.to_string()),
            }
        }
        Ok(added)
    })
    .await
}

/// Adds a file the page holds to the note, by its name and its bytes in
/// base64: a picture pasted.
#[tauri::command]
pub async fn note_window_add_bytes(app: AppHandle, name: String, content: String) -> CommandResult<Added> {
    blocking(move || {
        let bytes =
            B64.decode(content.trim()).map_err(|_| glaukopis_core::Error::invalid(tr!("core-pictures-not-whole")))?;
        Ok(app.state::<NoteWindowState>().window()?.add_bytes(&name, &bytes)?)
    })
    .await
}

/// Where a file added to the note lies, by what it holds: where the
/// pictures of its text are read from (`figures/pictures.svelte.ts`).
#[tauri::command(async)]
pub fn note_window_file_path(state: State<'_, NoteWindowState>, hash: String) -> CommandResult<String> {
    Ok(state.window()?.file_path(&hash)?.display().to_string())
}
