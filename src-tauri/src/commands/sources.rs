//! Commands for what comes from outside: databases of books and articles,
//! PDF files, and the libraries of Zotero.

use std::path::Path;
use std::sync::Mutex;
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};

use serde::Serialize;
use tauri::{AppHandle, State};

use glaukopis_core::duplicates;
use glaukopis_core::i18n::tr;
use glaukopis_core::import::zotero::{self, Options, ZoteroCollection, ZoteroInfo};
use glaukopis_core::import::{self, Candidate, Plan, SummaryLite, pdf};
use glaukopis_core::library::entry::Draft;
use glaukopis_core::lookup::{self, Hit, Query, Scope};
use glaukopis_core::ocr;

use super::work::{self, Count, Work};
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
    let index = library.duplicates_index();
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

/// What was found out of a PDF.
pub(crate) struct Identified {
    /// What the file says of itself.
    pub facts: pdf::PdfFacts,
    /// What it is taken to be: what the services said of it, where they were
    /// asked and knew it, else what the file says.
    pub candidate: Candidate,
    /// Whether the candidate is what the services said.
    pub looked_up: bool,
    /// What was said of the asking: that the services do not know the
    /// number, or could not be reached. In the candidate's notes as well.
    pub said: Vec<String>,
}

/// What a PDF is, as far as it can be told: from the file itself, and from
/// what is known elsewhere of the DOI or ISBN printed in it, where `ask`.
/// A file that cannot be read is none, and said so in `warnings`.
pub(crate) fn identify(
    state: &AppState,
    path: &Path,
    ask: bool,
    warnings: &mut Vec<String>,
    stop: &AtomicBool,
) -> Option<Identified> {
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
    let mut said = Vec::new();
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
        return Some(Identified { facts, candidate, looked_up: false, said });
    }
    let query = if let Some(doi) = &facts.doi {
        Some(Query::Doi(doi.clone()))
    } else if let Some(arxiv) = &facts.arxiv {
        Some(Query::Arxiv(arxiv.clone()))
    } else {
        facts.isbns.first().map(|isbn| Query::Isbn(isbn.clone()))
    };
    let Some(query) = query.filter(|_| ask && !stop.load(Ordering::Relaxed)) else {
        return Some(Identified { facts, candidate, looked_up: false, said });
    };
    let mut looked_up = false;
    match lookup::lookup(&state.client(), &query, Scope::Any) {
        Ok(outcome) => match outcome.hits.into_iter().next() {
            Some(hit) => {
                candidate.draft = hit.draft;
                candidate.notes = hit.remarks;
                candidate.notes.insert(0, tr!("core-import-details-from", service = &hit.source));
                looked_up = true;
            }
            None => said.push(tr!("core-import-number-unknown")),
        },
        Err(e) => said.push(tr!("core-import-databases-failed", error = e.to_string())),
    }
    candidate.notes.extend(said.iter().cloned());
    Some(Identified { facts, candidate, looked_up, said })
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
    let work = Work::begin(ticket);
    plan_pdfs(&app, &state, &paths, ask.unwrap_or(true), &work)
}

/// Stops the finding out about PDF files that goes on.
#[tauri::command(async)]
pub fn import_pdfs_stop(ticket: String) {
    work::stop(&ticket);
}

fn plan_pdfs(app: &AppHandle, state: &AppState, paths: &[String], ask: bool, work: &Work) -> CommandResult<Plan> {
    let stop = &*work.stop;
    let stopped = || glaukopis_core::Error::Refused {
        kind: glaukopis_core::export::tools::STOPPED,
        message: tr!("core-import-pdfs-stopped"),
    };
    let name_of = |path: &Path| path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
    // A few files at a time: each is read, and may be looked up, which is
    // mostly waiting. The services are paced whatever asks them. Each is
    // taken up as soon as one is done with. The interface is told how many
    // are done, and of one that is at hand, whenever either changes.
    const AT_ONCE: usize = 3;
    let next = AtomicUsize::new(0);
    /// What was found out about a file: what it may be, and what was said of it.
    type Found = (Option<Candidate>, Vec<String>);
    let found: Mutex<Vec<Option<Found>>> = Mutex::new(paths.iter().map(|_| None).collect());
    let at_hand: Mutex<Vec<String>> = Mutex::new(Vec::new());
    let done = AtomicUsize::new(0);
    let tell = |name: String| {
        let told = Count { done: done.load(Ordering::Relaxed), total: paths.len(), name };
        work.tell(app, work::PDFS_PROGRESS, told);
    };
    std::thread::scope(|s| {
        let working: Vec<_> = (0..AT_ONCE.min(paths.len()))
            .map(|_| {
                s.spawn(|| {
                    super::guarded(stop, || {
                        loop {
                            let i = next.fetch_add(1, Ordering::Relaxed);
                            let Some(given) = paths.get(i) else { break };
                            if stop.load(Ordering::Relaxed) {
                                break;
                            }
                            let path = Path::new(given);
                            let name = name_of(path);
                            at_hand.lock().unwrap_or_else(|poisoned| poisoned.into_inner()).push(name.clone());
                            tell(name.clone());
                            let mut said = Vec::new();
                            let candidate = if path.extension().is_some_and(|e| e.eq_ignore_ascii_case("pdf")) {
                                identify(state, path, ask, &mut said, stop).map(|found| found.candidate)
                            } else {
                                said.push(tr!("core-import-not-a-pdf", name = &name));
                                None
                            };
                            found.lock().unwrap_or_else(|poisoned| poisoned.into_inner())[i] = Some((candidate, said));
                            done.fetch_add(1, Ordering::Relaxed);
                            let still = {
                                let mut at_hand = at_hand.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
                                at_hand.retain(|n| *n != name);
                                at_hand.first().cloned()
                            };
                            if let Some(still) = still {
                                tell(still);
                            }
                        }
                    })
                })
            })
            .collect();
        // What went wrong in finding out about a file is not passed over in
        // silence: a worker that panicked fails the command, which answers.
        super::all_answered(working.into_iter().map(|h| h.join()))
    })?;
    let mut warnings = Vec::new();
    let mut candidates = Vec::new();
    // In the order the files were given, whatever order they were found out about in.
    for (candidate, said) in found.into_inner().unwrap_or_else(|poisoned| poisoned.into_inner()).into_iter().flatten() {
        candidates.extend(candidate);
        warnings.extend(said);
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

/// The libraries of Zotero on this computer. One that is there and cannot
/// be read (locked while Zotero runs, of a form not known here) is given
/// with what was wrong as its warning, not left out as if there were none.
///
/// The dialog of Zotero asks for what a library holds, for its collections
/// and for its references, in steps; each is answered from one copy of the
/// database, made at the first step and removed by `zotero_done` when the
/// dialog closes (`AppState::with_zotero`).
#[tauri::command(async)]
pub fn zotero_find(state: State<'_, AppState>) -> Vec<ZoteroInfo> {
    zotero::find()
        .iter()
        .map(|dir| {
            state.with_zotero(dir, |copy| copy.inspect()).unwrap_or_else(|e| {
                tracing::warn!(dir = %dir.display(), %e, "a library of Zotero was found, and could not be read");
                ZoteroInfo { path: dir.display().to_string(), warnings: vec![e.to_string()], ..Default::default() }
            })
        })
        .collect()
}

#[tauri::command(async)]
pub fn zotero_inspect(state: State<'_, AppState>, path: String) -> CommandResult<ZoteroInfo> {
    Ok(state.with_zotero(Path::new(&path), |copy| copy.inspect())?)
}

#[tauri::command(async)]
pub fn zotero_collections(
    state: State<'_, AppState>,
    path: String,
    library: Option<i64>,
) -> CommandResult<Vec<ZoteroCollection>> {
    Ok(state.with_zotero(Path::new(&path), |copy| copy.collections(library))?)
}

#[tauri::command(async)]
pub fn import_zotero(state: State<'_, AppState>, path: String, options: Options) -> CommandResult<Plan> {
    let (candidates, warnings) = state.with_zotero(Path::new(&path), |copy| copy.read(&options))?;
    let mut library = state.library();
    library.refresh()?;
    Ok(import::plan(&library, candidates, "Zotero", warnings))
}

/// The dialog of Zotero is closed: the copies it read are removed.
#[tauri::command]
pub fn zotero_done(state: State<'_, AppState>) {
    state.zotero_done();
}
