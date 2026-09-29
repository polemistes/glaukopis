//! Commands for what comes from outside: databases of books and articles,
//! PDF files, and the libraries of Zotero.

use std::path::{Path, PathBuf};
use std::sync::atomic::AtomicBool;

use serde::Serialize;
use tauri::State;

use glaukopis_core::duplicates;
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
fn identify(state: &AppState, path: &Path, ask: bool, warnings: &mut Vec<String>) -> Option<Candidate> {
    let name = path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
    // A scan has what it is read from pictures of its first pages, where Tesseract is there.
    let tools = state.tools();
    let read = |count| ocr::first_pages(path, &tools, &state.data.work(), count, &AtomicBool::new(false));
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
    if !ask {
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
                candidate.notes.insert(0, format!("The details are from {}.", hit.source));
            }
            None => candidate.notes.push(
                "A number was found in the file, but nothing is known of it in the databases; the details are from the file itself and should be checked."
                    .into(),
            ),
        },
        Err(e) => candidate
            .notes
            .push(format!("The databases could not be asked ({e}); the details are from the file itself and should be checked.")),
    }
    Some(candidate)
}

/// Makes references of PDF files: each is identified, and kept with its reference.
#[tauri::command(async)]
pub fn import_pdfs(state: State<'_, AppState>, paths: Vec<String>, ask: Option<bool>) -> CommandResult<Plan> {
    let mut warnings = Vec::new();
    let mut candidates = Vec::new();
    for path in &paths {
        let path = Path::new(path);
        let is_pdf = path.extension().is_some_and(|e| e.eq_ignore_ascii_case("pdf"));
        if !is_pdf {
            let name = path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
            warnings.push(format!("{name} is not a PDF."));
            continue;
        }
        candidates.extend(identify(&state, path, ask.unwrap_or(true), &mut warnings));
    }
    let source = match paths.as_slice() {
        [one] => Path::new(one).file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default(),
        many => format!("{} files", many.len()),
    };
    let mut library = state.library();
    library.refresh()?;
    Ok(import::plan(&library, candidates, &source, warnings))
}

#[derive(Serialize)]
pub struct Acknowledgement {
    pub service: &'static str,
    pub words: &'static str,
}

/// What the services that are asked want said of them.
#[tauri::command]
pub fn lookup_acknowledgements() -> Vec<Acknowledgement> {
    lookup::ACKNOWLEDGEMENTS.iter().map(|(service, words)| Acknowledgement { service, words }).collect()
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
