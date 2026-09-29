//! Commands for importing references.

use std::path::Path;

use tauri::State;

use glaukopis_core::i18n::tr;
use glaukopis_core::import::{self, Outcome, Plan, bibfile};

use crate::error::CommandResult;
use crate::state::AppState;

#[tauri::command(async)]
pub fn import_bib_file(state: State<'_, AppState>, path: String) -> CommandResult<Plan> {
    let path = Path::new(&path);
    let (candidates, warnings) = bibfile::read_file(path)?;
    let name = path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
    let mut library = state.library();
    library.refresh()?;
    Ok(import::plan(&library, candidates, &name, warnings))
}

#[tauri::command(async)]
pub fn import_bib_text(state: State<'_, AppState>, text: String) -> CommandResult<Plan> {
    let (candidates, warnings) = bibfile::read_text(&text, None);
    let mut library = state.library();
    library.refresh()?;
    Ok(import::plan(&library, candidates, &tr!("core-import-pasted"), warnings))
}

#[tauri::command(async)]
pub fn import_apply(state: State<'_, AppState>, plan: Plan) -> CommandResult<Outcome> {
    let mut library = state.library();
    Ok(import::apply(&mut library, &plan)?)
}
