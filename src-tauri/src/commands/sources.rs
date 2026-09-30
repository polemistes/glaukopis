//! Commands for what comes from outside: databases of books and articles,
//! PDF files, and the libraries of Zotero.

use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

use serde::Serialize;
use tauri::{AppHandle, Emitter, State};

use glaukopis_core::duplicates;
use glaukopis_core::i18n::tr;
use glaukopis_core::import::zotero::{self, Options, ZoteroCollection, ZoteroInfo};
use glaukopis_core::import::{self, Candidate, Plan, SummaryLite, pdf};
use glaukopis_core::library::entry::Draft;
use glaukopis_core::lookup::{self, Hit, Query, Scope};
use glaukopis_core::ocr;

use crate::error::CommandResult;
use crate::state::AppState;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FoundHit {
    #[serde(flatten)]
    pub hit: Hit,
    pub summary: SummaryLite,
    /// The entry of the library that this is, if it is there already.
    pub known: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Found {
    /// What the words were taken to be.
    pub query: Query,
    pub hits: Vec<FoundHit>,
    /// Services that did not answer, in words.
    pub failures: Vec<String>,
}

fn summary(draft: &Draft) -> SummaryLite {
    SummaryLite::from(&draft.to_entry().summary())
}

/// Looks for a book or an article by its DOI, ISBN or other number, or by
/// words of its title and the names of its authors.
#[tauri::command(async)]
pub fn lookup_find(state: State<'_, AppState>, input: String, scope: Option<Scope>) -> CommandResult<Found> {
    let query = lookup::classify(&input);
    let client = state.client();
    let outcome = lookup::lookup(&client, &query, scope.unwrap_or_default())?;

    let library = state.library();
    let entries = library.entries();
    let index = duplicates::Index::new(entries);
    let hits = outcome
        .hits
        .into_iter()
        .map(|hit| {
            let print = duplicates::fingerprint(&hit.draft.to_entry());
            let known = index
                .find(&print, None)
                .into_iter()
                .find(|m| m.certainty == duplicates::Certainty::Certain)
                .map(|m| entries[m.index].id.clone());
            FoundHit { summary: summary(&hit.draft), known, hit }
        })
        .collect();
    Ok(Found { query, hits, failures: outcome.failures })
}

/// What a PDF is, as far as it can be told: from the file itself, and from
/// what is known elsewhere of the DOI or ISBN printed in it.
fn identify(
    state: &AppState,
    path: &Path,
    ask: bool,
    warnings: &mut Vec<String>,
    stop: &AtomicBool,
) -> Option<Candidate> {
    let name = path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
    // A scan has what it is read from pictures of its first pages, where Tesseract is there.
    let tools = state.tools();
    let read = |count| ocr::first_pages(path, &tools, &state.data.work(), count, stop);
    let facts = match pdf::identify_scan(path, read) {
        Ok(facts) => facts,
        Err(e) => {
            warnings.push(format!("{name}: {e}"));
            return None;
        }
    };
    let mut candidate = pdf::candidate(path, &facts);
    if facts.doi.is_none() && facts.isbns.is_empty() && facts.arxiv.is_none() && facts.title.is_none() {
        // Nothing says what it is. The name of the file is something to know
        // it by until the details are filled in; the year would be that of
        // the file, which for a scan is the year it was scanned.
        let stem = path.file_stem().map(|n| n.to_string_lossy().replace(['_', '-'], " ")).unwrap_or_default();
        if !stem.trim().is_empty() {
            candidate.draft.fields.insert("title".into(), stem.trim().to_owned());
        }
        candidate.draft.fields.remove("date");
        candidate.draft.fields.remove("year");
        return Some(candidate);
    }
    if !ask || stop.load(Ordering::Relaxed) {
        return Some(candidate);
    }
    let query = if let Some(doi) = &facts.doi {
        Some(Query::Doi(doi.clone()))
    } else if let Some(arxiv) = &facts.arxiv {
        Some(Query::Arxiv(arxiv.clone()))
    } else {
        facts.isbns.first().map(|isbn| Query::Isbn(isbn.clone()))
    };
    let Some(query) = query else { return Some(candidate) };
    match lookup::lookup(&state.client(), &query, Scope::Any) {
        Ok(outcome) => match outcome.hits.into_iter().next() {
            Some(hit) => {
                candidate.draft = hit.draft;
                candidate.notes = hit.remarks;
                candidate.notes.insert(0, tr!("core-import-details-from", service = &hit.source));
            }
            None => candidate.notes.push(tr!("core-import-number-unknown")),
        },
        Err(e) => candidate.notes.push(tr!("core-import-databases-failed", error = e.to_string())),
    }
    Some(candidate)
}

/// The files that are being found out about, by the tickets they were asked
/// for with, each with what stops it.
static IDENTIFYING: Mutex<Vec<(String, Arc<AtomicBool>)>> = Mutex::new(Vec::new());

fn identifying() -> std::sync::MutexGuard<'static, Vec<(String, Arc<AtomicBool>)>> {
    IDENTIFYING.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
}

/// How far the finding out about PDF files has come, as the interface is told it.
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct PdfsProgress {
    ticket: String,
    /// How many files are done, and of how many.
    done: usize,
    total: usize,
    /// The file that is at hand.
    name: String,
}

/// Makes references of PDF files: each is identified, and kept with its
/// reference. With a ticket, the interface is told how far it has come
/// (`pdfs-progress`), and it can be stopped: it then fails with the kind
/// `stopped`, and nothing is added.
#[tauri::command(async)]
pub fn import_pdfs(
    app: AppHandle,
    state: State<'_, AppState>,
    paths: Vec<String>,
    ask: Option<bool>,
    ticket: Option<String>,
) -> CommandResult<Plan> {
    let stop = Arc::new(AtomicBool::new(false));
    if let Some(ticket) = &ticket {
        identifying().push((ticket.clone(), stop.clone()));
    }
    let planned = plan_pdfs(&app, &state, &paths, ask.unwrap_or(true), ticket.as_deref(), &stop);
    if let Some(ticket) = &ticket {
        identifying().retain(|(t, _)| t != ticket);
    }
    planned
}

/// Stops the finding out about PDF files that goes on.
#[tauri::command(async)]
pub fn import_pdfs_stop(ticket: String) {
    for (_, stop) in identifying().iter().filter(|(t, _)| *t == ticket) {
        stop.store(true, Ordering::Relaxed);
    }
}

fn plan_pdfs(
    app: &AppHandle,
    state: &AppState,
    paths: &[String],
    ask: bool,
    ticket: Option<&str>,
    stop: &AtomicBool,
) -> CommandResult<Plan> {
    let stopped = || glaukopis_core::Error::Refused {
        kind: glaukopis_core::export::tools::STOPPED,
        message: tr!("core-import-pdfs-stopped"),
    };
    let mut warnings = Vec::new();
    let mut candidates = Vec::new();
    for (done, path) in paths.iter().enumerate() {
        if stop.load(Ordering::Relaxed) {
            return Err(stopped().into());
        }
        let path = Path::new(path);
        if let Some(ticket) = ticket {
            let name = path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
            let told = PdfsProgress { ticket: ticket.to_owned(), done, total: paths.len(), name };
            let _ = app.emit("pdfs-progress", told);
        }
        let is_pdf = path.extension().is_some_and(|e| e.eq_ignore_ascii_case("pdf"));
        if !is_pdf {
            let name = path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
            warnings.push(tr!("core-import-not-a-pdf", name = &name));
            continue;
        }
        candidates.extend(identify(state, path, ask, &mut warnings, stop));
    }
    if stop.load(Ordering::Relaxed) {
        return Err(stopped().into());
    }
    let source = match paths {
        [one] => Path::new(one).file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default(),
        many => tr!("core-import-files", count = many.len()),
    };
    let mut library = state.library();
    library.refresh()?;
    Ok(import::plan(&library, candidates, &source, warnings))
}

#[derive(Serialize)]
pub struct Acknowledgement {
    pub service: String,
    pub words: String,
}

/// What the services that are asked want said of them.
#[tauri::command]
pub fn lookup_acknowledgements() -> Vec<Acknowledgement> {
    lookup::acknowledgements().into_iter().map(|(service, words)| Acknowledgement { service, words }).collect()
}

/// The libraries of Zotero on this computer.
#[tauri::command(async)]
pub fn zotero_find() -> Vec<ZoteroInfo> {
    zotero::find().iter().filter_map(|dir| zotero::inspect(dir).ok()).collect()
}

#[tauri::command(async)]
pub fn zotero_inspect(path: String) -> CommandResult<ZoteroInfo> {
    Ok(zotero::inspect(&PathBuf::from(path))?)
}

#[tauri::command(async)]
pub fn zotero_collections(path: String, library: Option<i64>) -> CommandResult<Vec<ZoteroCollection>> {
    Ok(zotero::collections(&PathBuf::from(path), library)?)
}

#[tauri::command(async)]
pub fn import_zotero(state: State<'_, AppState>, path: String, options: Options) -> CommandResult<Plan> {
    let (candidates, warnings) = zotero::read(&PathBuf::from(path), &options)?;
    let mut library = state.library();
    library.refresh()?;
    Ok(import::plan(&library, candidates, "Zotero", warnings))
}
