//! Commands for the citations that were found in a text that was written
//! elsewhere.

use serde_json::Value;
use tauri::State;

use glaukopis_core::found::{self, FoundItem, Options, Passage, Proposal, Suggestion};
use glaukopis_core::library::entry::Draft;

use crate::error::CommandResult;
use crate::state::AppState;

/// For each work that is cited, the references of the library it may be,
/// the likeliest first.
#[tauri::command(async)]
pub fn found_suggest(state: State<'_, AppState>, items: Vec<FoundItem>) -> CommandResult<Vec<Vec<Suggestion>>> {
    let library = state.library();
    Ok(items.iter().map(|item| found::suggest(&library, item)).collect())
}

/// What looks like citations in the passages, with the references of the
/// library for them.
#[tauri::command(async)]
pub fn found_propose(
    state: State<'_, AppState>,
    passages: Vec<Passage>,
    options: Options,
) -> CommandResult<Vec<Proposal>> {
    let library = state.library();
    Ok(found::propose(&library, &passages, &options))
}

/// What a program that keeps references says of a work, as a reference that
/// can be added to the library. Nothing, where it says too little.
#[tauri::command(async)]
pub fn found_draft(data: Value) -> CommandResult<Option<Draft>> {
    Ok(found::draft(&data))
}
