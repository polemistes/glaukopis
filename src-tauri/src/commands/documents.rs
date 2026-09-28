//! Commands for preview and export, reference styles and document formats.

use std::collections::HashMap;
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

use serde::{Deserialize, Serialize};
use tauri::State;

use glaukopis_core::document::{Author, Block, CarriedReference, Document, Inline, Section};
use glaukopis_core::export::{self, Context, ExportOptions, Exported, Page, Preview, Request, Target, Tools};
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
    let pictures = state.data.pictures();
    let ctx = Context {
        tools: &tools,
        resources: &state.resources,
        styles: &state.styles,
        library: guard.as_deref(),
        work: state.data.work(),
        fonts: &fonts,
        pictures: Some(&pictures),
    };
    Ok(work(&ctx)?)
}

/// A part of a document as it is sent for the preview: with its text, or
/// without it where the same text was sent before, which the stamp says.
///
/// A long document is sent anew every time something in it is changed.
/// Sent whole, it is megabytes that the window must write and this side
/// read, for a change of one letter; so the text of a part is sent once,
/// and named by its stamp from then on.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LeanSection {
    #[serde(default)]
    pub level: u8,
    #[serde(default)]
    pub heading: Option<Vec<Inline>>,
    #[serde(default)]
    pub element: Option<String>,
    /// Tells this text from every other, and from itself as it was before
    /// it was changed.
    pub stamp: String,
    /// The text. Nothing, where it was sent before.
    #[serde(default)]
    pub blocks: Option<Vec<Block>>,
}

/// A document as it is sent for the preview: as `Document`, with its parts lean.
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct LeanDocument {
    pub title: Vec<Inline>,
    pub subtitle: Option<String>,
    pub authors: Vec<Author>,
    pub date: Option<String>,
    #[serde(rename = "abstract")]
    pub abstract_text: Option<String>,
    pub keywords: Vec<String>,
    pub language: Option<String>,
    pub sections: Vec<LeanSection>,
    pub references: Vec<CarriedReference>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LeanRequest {
    pub document: LeanDocument,
    pub style: String,
    pub format: DocumentFormat,
    #[serde(default)]
    pub key: String,
}

/// What is kept of the previews, for each key: the texts that were sent,
/// by their stamps, and what stops the making that goes on.
#[derive(Default)]
struct Kept {
    texts: HashMap<String, Arc<Vec<Block>>>,
    stop: Arc<AtomicBool>,
}

static PREVIEWS: Mutex<Option<HashMap<String, Kept>>> = Mutex::new(None);

fn previews() -> std::sync::MutexGuard<'static, Option<HashMap<String, Kept>>> {
    PREVIEWS.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
}

/// The kind of the error that says that texts were not sent and are not
/// kept: the document is then to be sent whole.
const LACKING: &str = "lacking";

/// The document whole, its texts taken from what was sent before where they
/// are not sent now; and what stops the making of it. What is kept from
/// then on is what this document holds, and nothing else.
fn whole(request: LeanRequest) -> CommandResult<(Request, Arc<AtomicBool>)> {
    let mut all = previews();
    let kept = all.get_or_insert_with(HashMap::new).entry(request.key.clone()).or_default();
    let mut texts: HashMap<String, Arc<Vec<Block>>> = HashMap::with_capacity(request.document.sections.len());
    let mut sections = Vec::with_capacity(request.document.sections.len());
    let mut lacking = 0usize;
    for section in request.document.sections {
        let blocks = match section.blocks {
            Some(blocks) => Arc::new(blocks),
            None => match texts.get(&section.stamp).or_else(|| kept.texts.get(&section.stamp)) {
                Some(blocks) => blocks.clone(),
                None => {
                    lacking += 1;
                    continue;
                }
            },
        };
        texts.insert(section.stamp, blocks.clone());
        sections.push(Section {
            level: section.level,
            heading: section.heading,
            blocks: blocks.as_ref().clone(),
            element: section.element,
        });
    }
    if lacking > 0 {
        return Err(glaukopis_core::Error::Refused {
            kind: LACKING,
            message: format!("{lacking} texts of the document were not sent, and are not kept."),
        }
        .into());
    }
    kept.texts = texts;
    // What is being made for this key is no longer wanted.
    kept.stop.store(true, Ordering::Relaxed);
    kept.stop = Arc::new(AtomicBool::new(false));
    let document = Document {
        title: request.document.title,
        subtitle: request.document.subtitle,
        authors: request.document.authors,
        date: request.document.date,
        abstract_text: request.document.abstract_text,
        keywords: request.document.keywords,
        language: request.document.language,
        sections,
        references: request.document.references,
    };
    Ok((Request { document, style: request.style, format: request.format, key: request.key }, kept.stop.clone()))
}

/// The pages of a document: how many there are, and those that are asked
/// for. The library is held while what is cited is looked up, and not while
/// the pages are made.
#[tauri::command(async)]
pub fn document_preview(state: State<'_, AppState>, request: LeanRequest, pages: Vec<u32>) -> CommandResult<Preview> {
    let (mut request, stop) = whole(request)?;
    request.format.sanitise();
    let readied = with_context(&state, true, |ctx| export::preview_ready(ctx, &request))?;
    with_context(&state, false, |ctx| export::preview_made(ctx, &request, readied, &pages, &stop))
}

/// Pages of the document that was made last for a key, as they come into
/// view. It waits for nothing that is being made.
#[tauri::command(async)]
pub fn document_preview_pages(state: State<'_, AppState>, key: String, pages: Vec<u32>) -> CommandResult<PagesOf> {
    let tools = state.tools();
    let fonts = state.fonts();
    let ctx = Context {
        tools: &tools,
        resources: &state.resources,
        styles: &state.styles,
        library: None,
        work: state.data.work(),
        fonts: &fonts,
        pictures: None,
    };
    let (count, pages) = export::preview_pages(&ctx, &key, &pages, &AtomicBool::new(false))?;
    Ok(PagesOf { count, pages })
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PagesOf {
    pub count: usize,
    pub pages: Vec<Page>,
}

/// Stops what is being made for a key, and lets go of what is kept for it:
/// the preview was closed.
#[tauri::command(async)]
pub fn document_preview_stop(key: String) {
    if let Some(kept) = previews().as_mut().and_then(|all| all.remove(&key)) {
        kept.stop.store(true, Ordering::Relaxed);
    }
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
