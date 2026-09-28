//! Commands for preview and export, reference styles and document formats.

use std::path::Path;

use serde::Serialize;
use tauri::State;

use glaukopis_core::export::{self, Context, ExportOptions, Exported, Preview, Request, Target, Tools};
use glaukopis_core::formats::{DocumentFormat, FormatSummary};
use glaukopis_core::styles::{Found, StyleSummary};

use crate::error::CommandResult;
use crate::state::AppState;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolsInfo {
    #[serde(flatten)]
    pub tools: Tools,
    pub resources: String,
}

#[tauri::command(async)]
pub fn tools_info(state: State<'_, AppState>, again: Option<bool>) -> CommandResult<ToolsInfo> {
    let tools = if again.unwrap_or(false) { state.discover_tools() } else { state.tools() };
    Ok(ToolsInfo { tools, resources: state.resources.display().to_string() })
}

#[tauri::command(async)]
pub fn fonts_list(state: State<'_, AppState>) -> CommandResult<Vec<String>> {
    Ok(state.fonts())
}

// ---- reference styles ----

#[tauri::command(async)]
pub fn styles_list(state: State<'_, AppState>) -> CommandResult<Vec<StyleSummary>> {
    Ok(state.styles.list())
}

#[tauri::command(async)]
pub fn styles_search(state: State<'_, AppState>, query: String) -> CommandResult<Vec<Found>> {
    Ok(state.styles.search(&query, 60))
}

#[tauri::command(async)]
pub fn styles_fetch(state: State<'_, AppState>, id: String) -> CommandResult<StyleSummary> {
    Ok(state.styles.fetch(&id, &state.client())?)
}

#[tauri::command(async)]
pub fn styles_import(state: State<'_, AppState>, path: String) -> CommandResult<StyleSummary> {
    Ok(state.styles.import(Path::new(&path))?)
}

#[tauri::command(async)]
pub fn styles_read(state: State<'_, AppState>, id: String) -> CommandResult<String> {
    Ok(state.styles.read(&id)?)
}

#[tauri::command(async)]
pub fn styles_save(state: State<'_, AppState>, id: String, title: String, xml: String) -> CommandResult<StyleSummary> {
    Ok(state.styles.save(&id, &title, &xml)?)
}

#[tauri::command(async)]
pub fn styles_delete(state: State<'_, AppState>, id: String) -> CommandResult<()> {
    Ok(state.styles.delete(&id)?)
}

// ---- document formats ----

#[tauri::command(async)]
pub fn formats_list(state: State<'_, AppState>) -> CommandResult<Vec<FormatSummary>> {
    Ok(state.formats.list())
}

#[tauri::command(async)]
pub fn formats_get(state: State<'_, AppState>, id: String) -> CommandResult<DocumentFormat> {
    Ok(state.formats.get_or_default(&id))
}

#[tauri::command(async)]
pub fn formats_save(state: State<'_, AppState>, format: DocumentFormat) -> CommandResult<DocumentFormat> {
    Ok(state.formats.save(format)?)
}

#[tauri::command(async)]
pub fn formats_delete(state: State<'_, AppState>, id: String) -> CommandResult<()> {
    Ok(state.formats.delete(&id)?)
}

// ---- documents ----

/// Runs `work` with everything the making of a document needs.
fn with_context<T>(
    state: &AppState,
    library: bool,
    work: impl FnOnce(&Context) -> glaukopis_core::Result<T>,
) -> CommandResult<T> {
    let _one_at_a_time = state.making.lock().unwrap_or_else(|p| p.into_inner());
    let tools = state.tools();
    let fonts = state.fonts();
    let guard = library.then(|| state.library());
    let projects = state.data.projects();
    let ctx = Context {
        tools: &tools,
        resources: &state.resources,
        styles: &state.styles,
        library: guard.as_deref(),
        work: state.data.work(),
        fonts: &fonts,
        projects: Some(&projects),
    };
    Ok(work(&ctx)?)
}

#[tauri::command(async)]
pub fn document_preview(state: State<'_, AppState>, mut request: Request) -> CommandResult<Preview> {
    request.format.sanitise();
    with_context(&state, true, |ctx| export::preview(ctx, &request))
}

#[tauri::command(async)]
pub fn document_export(
    state: State<'_, AppState>,
    mut request: Request,
    target: Target,
    path: String,
    options: Option<ExportOptions>,
) -> CommandResult<Exported> {
    request.format.sanitise();
    with_context(&state, true, |ctx| {
        export::export(ctx, &request, target, Path::new(&path), &options.unwrap_or_default())
    })
}

/// What a reference style makes of some works, as HTML.
#[tauri::command(async)]
pub fn style_sample(
    state: State<'_, AppState>,
    xml: String,
    references: Vec<glaukopis_core::document::CarriedReference>,
    language: Option<String>,
) -> CommandResult<String> {
    with_context(&state, true, |ctx| export::style_sample(ctx, &xml, &references, language.as_deref()))
}

/// Opens a file that was made, in the program the system uses for its kind.
#[tauri::command(async)]
pub fn open_path(app: tauri::AppHandle, path: String, reveal: Option<bool>) -> CommandResult<()> {
    use tauri_plugin_opener::OpenerExt;
    let result = if reveal.unwrap_or(false) {
        app.opener().reveal_item_in_dir(Path::new(&path))
    } else {
        app.opener().open_path(path, None::<&str>)
    };
    result.map_err(|e| crate::error::CommandError { kind: "open", message: e.to_string() })
}
