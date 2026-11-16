//! Commands of a note written in a window of its own (record 0109,
//! `glaukopis_core::notebook::note_window`): the application in another
//! role, `glaukopis --note`, which has these and the few of the
//! application's that need nothing of it (the languages, the clipboard,
//! the page's log). Mirrors `src/lib/api/notewindow.ts`.

use serde::Serialize;
use serde_json::{Map, Value};
use tauri::{AppHandle, Manager, State};

use glaukopis_core::notebook::note_window::NoteWindow;

use super::viewer::blocking;
use crate::error::{CommandError, CommandResult};

/// The window of a note, in the data folder it writes into; or what was
/// wrong with finding that folder (a chosen one not there), which the
/// window says when its words cannot be kept or sent.
pub struct NoteWindowState(pub Result<NoteWindow, String>);

impl NoteWindowState {
    fn window(&self) -> CommandResult<&NoteWindow> {
        self.0.as_ref().map_err(|message| CommandError { kind: "not-found", message: message.clone() })
    }
}

/// What the window of a note begins with: the settings, read and never
/// written, for its language and its look; and the words written in it
/// before and not sent.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteWindowStart {
    pub settings: Map<String, Value>,
    pub unsent: String,
}

#[tauri::command(async)]
pub fn note_window_start(state: State<'_, NoteWindowState>) -> NoteWindowStart {
    match &state.0 {
        Ok(window) => NoteWindowStart { settings: window.settings(), unsent: window.unsent() },
        Err(_) => NoteWindowStart { settings: Map::new(), unsent: String::new() },
    }
}

/// Keeps the words written and not sent, in place of those kept before;
/// none, or nothing but spaces, and what was kept goes.
#[tauri::command]
pub async fn note_window_keep(app: AppHandle, words: String) -> CommandResult<()> {
    blocking(move || Ok(app.state::<NoteWindowState>().window()?.keep(&words)?)).await
}

/// Writes the words into the notebook's inbox as a note, and forgets what
/// was kept of them; the application takes it in at its start, or within
/// a moment where it runs.
#[tauri::command]
pub async fn note_window_send(app: AppHandle, words: String) -> CommandResult<()> {
    blocking(move || {
        let id = app.state::<NoteWindowState>().window()?.send(&words)?;
        tracing::info!(id, "a note was written into the notebook's inbox");
        Ok(())
    })
    .await
}
