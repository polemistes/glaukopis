//! Commands for templates: what a document of a kind consists of (ADR 0038).

use tauri::State;

use glaukopis_core::templates::{Template, TemplateSummary};

use crate::error::CommandResult;
use crate::state::AppState;

#[tauri::command(async)]
pub fn templates_list(state: State<'_, AppState>) -> CommandResult<Vec<TemplateSummary>> {
    Ok(state.templates.list())
}

#[tauri::command(async)]
pub fn templates_get(state: State<'_, AppState>, id: String) -> CommandResult<Template> {
    Ok(state.templates.get_or_default(&id))
}

#[tauri::command(async)]
pub fn templates_save(state: State<'_, AppState>, template: Template) -> CommandResult<Template> {
    Ok(state.templates.save(template)?)
}

#[tauri::command(async)]
pub fn templates_delete(state: State<'_, AppState>, id: String) -> CommandResult<()> {
    Ok(state.templates.delete(&id)?)
}
