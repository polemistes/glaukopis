//! Commands for the reference library.

use std::path::Path;

use serde::Serialize;
use tauri::{AppHandle, State};
use tauri_plugin_opener::OpenerExt;

use glaukopis_core::duplicates::{self, Group};
use glaukopis_core::i18n::tr;
use glaukopis_core::import::{PlanMatch, SummaryLite, fill_missing};
use glaukopis_core::library::{Collection, Draft, Entry, EntryView, Library, StoredFile, Summary};

use crate::error::{CommandError, CommandResult};
use crate::state::AppState;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryListing {
    pub entries: Vec<Summary>,
    pub collections: Vec<Collection>,
    pub warnings: Vec<String>,
    pub file: String,
}

/// An entry with all that the form shows.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EntryFull {
    #[serde(flatten)]
    pub view: EntryView,
    pub files: Vec<StoredFile>,
    pub collections: Vec<String>,
}

pub(crate) fn full(library: &Library, entry: &Entry) -> EntryFull {
    EntryFull {
        view: entry.view(),
        files: library.attachments_of(&entry.id).unwrap_or_default(),
        collections: library.collections.of_entry(&entry.id),
    }
}

fn listing(library: &Library) -> LibraryListing {
    LibraryListing {
        entries: library.summaries(),
        collections: library.collections.list.clone(),
        warnings: library.warnings.clone(),
        file: library.file().display().to_string(),
    }
}

#[tauri::command(async)]
pub fn library_list(state: State<'_, AppState>) -> CommandResult<LibraryListing> {
    let mut library = state.library();
    library.refresh()?;
    library.take_reread();
    Ok(listing(&library))
}

/// Looks whether the library file was changed from outside, now or before a
/// change of one entry read it, and if so returns the new listing.
#[tauri::command(async)]
pub fn library_refresh(state: State<'_, AppState>) -> CommandResult<Option<LibraryListing>> {
    let mut library = state.library();
    library.refresh()?;
    Ok(if library.take_reread() { Some(listing(&library)) } else { None })
}

#[tauri::command(async)]
pub fn library_get(state: State<'_, AppState>, id: String) -> CommandResult<EntryFull> {
    let library = state.library();
    let entry =
        library.resolve(&id).ok_or_else(|| glaukopis_core::Error::not_found(tr!("core-library-the-reference")))?;
    Ok(full(&library, entry))
}

/// Several entries at once, for a project that shows the references it uses.
/// Ids that are not found are left out.
#[tauri::command(async)]
pub fn library_get_many(state: State<'_, AppState>, ids: Vec<String>) -> CommandResult<Vec<EntryFull>> {
    let library = state.library();
    Ok(ids.iter().filter_map(|id| library.resolve(id)).map(|e| full(&library, e)).collect())
}

#[tauri::command(async)]
pub fn library_add(state: State<'_, AppState>, draft: Draft) -> CommandResult<EntryFull> {
    let mut library = state.library();
    let entry = library.add(&draft)?;
    Ok(full(&library, &entry))
}

#[tauri::command(async)]
pub fn library_update(state: State<'_, AppState>, id: String, draft: Draft) -> CommandResult<EntryFull> {
    let mut library = state.library();
    let entry = library.update(&id, &draft)?;
    Ok(full(&library, &entry))
}

/// Keeps what the user has written about a work, for all projects.
#[tauri::command(async)]
pub fn library_set_note(state: State<'_, AppState>, id: String, text: String) -> CommandResult<EntryFull> {
    let mut library = state.library();
    let entry = library.set_note(&id, &text)?;
    Ok(full(&library, &entry))
}

#[tauri::command(async)]
pub fn library_remove(state: State<'_, AppState>, ids: Vec<String>) -> CommandResult<usize> {
    Ok(state.library().remove(&ids)?)
}

#[tauri::command(async)]
pub fn library_source(state: State<'_, AppState>, id: String) -> CommandResult<String> {
    Ok(state.library().source(&id)?)
}

#[tauri::command(async)]
pub fn library_update_source(state: State<'_, AppState>, id: String, source: String) -> CommandResult<EntryFull> {
    let mut library = state.library();
    let entry = library.update_from_source(&id, &source)?;
    Ok(full(&library, &entry))
}

/// The source a draft would have, for showing it before the entry exists.
#[tauri::command(async)]
pub fn library_draft_source(draft: Draft) -> CommandResult<String> {
    Ok(draft.to_entry().to_bib(false, false))
}

#[tauri::command(async)]
pub fn library_parse_source(source: String) -> CommandResult<Draft> {
    Ok(glaukopis_core::library::draft_from_source(&source)?)
}

/// The key an entry would be given.
#[tauri::command(async)]
pub fn library_suggest_key(state: State<'_, AppState>, draft: Draft, except: Option<String>) -> CommandResult<String> {
    let library = state.library();
    let taken = library.entries().iter().filter(|e| Some(&e.id) != except.as_ref()).map(|e| e.key.clone()).collect();
    let base = glaukopis_core::library::keys::base_key(&draft.to_entry());
    Ok(glaukopis_core::library::keys::unique_key(&base, &taken))
}

/// Entries of the library that a draft may be a duplicate of.
#[tauri::command(async)]
pub fn library_find_matches(
    state: State<'_, AppState>,
    draft: Draft,
    except: Option<String>,
) -> CommandResult<Vec<PlanMatch>> {
    let library = state.library();
    let entries = library.entries();
    let index = duplicates::Index::new(entries);
    let print = duplicates::fingerprint(&draft.to_entry());
    let except_index = except.as_ref().and_then(|id| entries.iter().position(|e| &e.id == id));
    Ok(index
        .find(&print, except_index)
        .into_iter()
        .map(|m| {
            let e = &entries[m.index];
            PlanMatch {
                id: e.id.clone(),
                certainty: m.certainty.into(),
                reasons: m.reasons.into_iter().map(Into::into).collect(),
                summary: SummaryLite::from(&e.summary()),
                gains: fill_missing(e, &draft).1,
            }
        })
        .collect())
}

#[tauri::command(async)]
pub fn library_duplicates(state: State<'_, AppState>) -> CommandResult<Vec<Group>> {
    let library = state.library();
    Ok(duplicates::find_groups(library.entries()))
}

/// A draft in which `kept` has been given what it lacks from `absorbed`, as a
/// starting point for the user's own merge.
#[tauri::command(async)]
pub fn library_merge_preview(state: State<'_, AppState>, kept: String, absorbed: String) -> CommandResult<Draft> {
    let library = state.library();
    let a = library.require(&kept)?;
    let b = library.require(&absorbed)?;
    Ok(fill_missing(a, &Draft::from_entry(b)).0)
}

#[tauri::command(async)]
pub fn library_merge(
    state: State<'_, AppState>,
    kept: String,
    absorbed: String,
    draft: Draft,
) -> CommandResult<EntryFull> {
    let mut library = state.library();
    let entry = library.merge(&kept, &absorbed, &draft)?;
    Ok(full(&library, &entry))
}

#[tauri::command(async)]
pub fn library_export(
    state: State<'_, AppState>,
    path: String,
    ids: Option<Vec<String>>,
    with_files: bool,
) -> CommandResult<usize> {
    let library = state.library();
    let text = library.export(ids.as_deref(), with_files);
    let count = text.matches("\n@").count() + usize::from(text.starts_with('@'));
    glaukopis_core::fsutil::write_atomic(Path::new(&path), text.as_bytes())?;
    Ok(count)
}

// ---- collections ----

#[tauri::command(async)]
pub fn collection_create(
    state: State<'_, AppState>,
    name: String,
    parent: Option<String>,
) -> CommandResult<Collection> {
    Ok(state.library().collection_create(&name, parent.as_deref())?)
}

#[tauri::command(async)]
pub fn collection_rename(state: State<'_, AppState>, id: String, name: String) -> CommandResult<()> {
    Ok(state.library().collection_rename(&id, &name)?)
}

#[tauri::command(async)]
pub fn collection_move(state: State<'_, AppState>, id: String, parent: Option<String>) -> CommandResult<()> {
    Ok(state.library().collection_move(&id, parent.as_deref())?)
}

#[tauri::command(async)]
pub fn collection_delete(state: State<'_, AppState>, id: String) -> CommandResult<()> {
    Ok(state.library().collection_delete(&id)?)
}

#[tauri::command(async)]
pub fn collection_add(state: State<'_, AppState>, id: String, entries: Vec<String>) -> CommandResult<usize> {
    Ok(state.library().collection_add(&id, &entries)?)
}

#[tauri::command(async)]
pub fn collection_remove(state: State<'_, AppState>, id: String, entries: Vec<String>) -> CommandResult<()> {
    Ok(state.library().collection_remove(&id, &entries)?)
}

#[tauri::command(async)]
pub fn collection_list(state: State<'_, AppState>) -> CommandResult<Vec<Collection>> {
    Ok(state.library().collections.list.clone())
}

// ---- attachments ----

#[tauri::command(async)]
pub fn attachment_add(state: State<'_, AppState>, id: String, paths: Vec<String>) -> CommandResult<EntryFull> {
    let mut library = state.library();
    let mut last = library.require(&id)?.clone();
    for p in &paths {
        last = library.attach(&id, Path::new(p))?;
    }
    Ok(full(&library, &last))
}

#[tauri::command(async)]
pub fn attachment_remove(state: State<'_, AppState>, id: String, path: String) -> CommandResult<EntryFull> {
    let mut library = state.library();
    let entry = library.detach(&id, &path)?;
    Ok(full(&library, &entry))
}

/// Opens a stored file in the program the system uses for its kind.
#[tauri::command(async)]
pub fn attachment_open(app: AppHandle, state: State<'_, AppState>, path: String) -> CommandResult<()> {
    let absolute = state.library().attachment_path(&path)?;
    if !absolute.is_file() {
        return Err(glaukopis_core::Error::not_found(tr!("core-library-the-file", path = &absolute)).into());
    }
    app.opener()
        .open_path(absolute.display().to_string(), None::<&str>)
        .map_err(|e| CommandError { kind: "open", message: e.to_string() })
}

/// Shows a stored file in the file manager.
#[tauri::command(async)]
pub fn attachment_reveal(app: AppHandle, state: State<'_, AppState>, path: String) -> CommandResult<()> {
    let absolute = state.library().attachment_path(&path)?;
    app.opener().reveal_item_in_dir(&absolute).map_err(|e| CommandError { kind: "open", message: e.to_string() })
}
