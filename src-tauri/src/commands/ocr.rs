//! Commands for text read from PDFs and pictures (ADR 0018): into a map, a
//! PDF of the library made searchable, the text of a picture of the store.
//!
//! A reading takes a while. It is asked for with a ticket, by which it can
//! be stopped, and the interface is told how far it has come by the event
//! `ocr-progress`, which carries the ticket.

use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex, MutexGuard};

use serde::Serialize;
use tauri::{AppHandle, Emitter, State};

use glaukopis_core::error::IoContext;
use glaukopis_core::import::document::Imported;
use glaukopis_core::ocr::text::IsWord;
use glaukopis_core::ocr::{self, Asked, Looked, Progress};

use crate::commands::library::{EntryFull, full};
use glaukopis_core::tr;

use crate::error::CommandResult;
use crate::state::AppState;

/// The readings that go on, by the tickets they were asked for with, each
/// with what stops it.
static READINGS: Mutex<Vec<(String, Arc<AtomicBool>)>> = Mutex::new(Vec::new());

fn readings() -> MutexGuard<'static, Vec<(String, Arc<AtomicBool>)>> {
    READINGS.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
}

/// A reading that goes on, known by its ticket until it is done.
struct Reading {
    ticket: Option<String>,
    stop: Arc<AtomicBool>,
}

impl Reading {
    fn begin(ticket: Option<String>) -> Reading {
        let stop = Arc::new(AtomicBool::new(false));
        if let Some(ticket) = &ticket {
            readings().push((ticket.clone(), stop.clone()));
        }
        Reading { ticket, stop }
    }

    /// Tells the interface how far the reading has come.
    fn teller<'a>(&'a self, app: &'a AppHandle) -> impl FnMut(Progress) + 'a {
        move |progress| {
            if let Some(ticket) = &self.ticket {
                let _ = app.emit("ocr-progress", Told { ticket: ticket.clone(), progress });
            }
        }
    }
}

impl Drop for Reading {
    fn drop(&mut self) {
        if let Some(ticket) = &self.ticket {
            readings().retain(|(t, _)| t != ticket);
        }
    }
}

/// How far a reading has come, as the interface is told it.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct Told {
    ticket: String,
    #[serde(flatten)]
    progress: Progress,
}

fn file_name(path: &Path) -> String {
    path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default()
}

fn stem(name: &str) -> String {
    Path::new(name).file_stem().map(|n| n.to_string_lossy().into_owned()).unwrap_or_else(|| name.to_owned())
}

/// The tag of the dictionary for a language as Tesseract names it: `nor` is
/// Bokmål, `eng` English.
fn dictionary_tag(tesseract: &str) -> Option<&'static str> {
    Some(match tesseract {
        "eng" => "en",
        "nor" | "nob" => "nb",
        "nno" => "nn",
        "dan" => "da",
        "swe" => "sv",
        "deu" => "de",
        "fra" => "fr",
        "ita" => "it",
        "spa" => "es",
        "por" => "pt",
        "nld" => "nl",
        "lat" => "la",
        "ell" => "el",
        _ => return None,
    })
}

/// Whether a word is a word in one of the languages the text is read in, as
/// the dictionaries of spelling know them: by it, words broken at the end of
/// a line are joined again. Nothing, where none of the languages has a
/// dictionary.
fn words_of<'a>(state: &'a AppState, asked: &Asked) -> Option<impl Fn(&str) -> bool + Sync + 'a> {
    let tags: Vec<&'static str> = asked
        .languages
        .iter()
        .filter_map(|l| dictionary_tag(l))
        .filter(|tag| !state.spelling.chosen(Some(tag)).is_empty())
        .collect();
    if tags.is_empty() {
        return None;
    }
    Some(move |word: &str| {
        let words = [word.to_owned()];
        tags.iter().any(|tag| state.spelling.check(Some(tag), &words).is_ok_and(|known| known.first() == Some(&true)))
    })
}

/// Looks at a PDF or a picture before it is read: its pages, and how many
/// of them have text. With `stored`, the path is that of a file of the
/// library, within its store.
#[tauri::command(async)]
pub fn ocr_look(state: State<'_, AppState>, path: String, stored: Option<bool>) -> CommandResult<Looked> {
    let path = if stored.unwrap_or(false) { state.library().attachment_path(&path)? } else { PathBuf::from(path) };
    Ok(ocr::look(&path, &state.tools())?)
}

/// Reads a PDF or a picture, to become a map: a part for each page of a
/// PDF, named by its number; the text of a picture under its name. With
/// `stored`, the path is that of a file of the library, within its store,
/// as for `ocr_look`.
#[tauri::command(async)]
pub fn ocr_read(
    app: AppHandle,
    state: State<'_, AppState>,
    path: String,
    asked: Asked,
    ticket: Option<String>,
    stored: Option<bool>,
) -> CommandResult<Imported> {
    let path = if stored.unwrap_or(false) { state.library().attachment_path(&path)? } else { PathBuf::from(path) };
    let reading = Reading::begin(ticket);
    let tools = state.tools();
    let work = state.data.work();
    let file = file_name(&path);
    if ocr::is_picture(&path) {
        let bytes = std::fs::read(&path).context(|| tr!("io-reading", path = &path))?;
        let words = words_of(&state, &asked);
        let paragraphs =
            ocr::read_picture(&bytes, &tools, &work, &asked, words.as_ref().map(|w| w as &IsWord), &reading.stop)?;
        return Ok(ocr::imported_picture(&file, &stem(&file), paragraphs));
    }
    let words = words_of(&state, &asked);
    let is_word = words.as_ref().map(|w| w as &IsWord);
    let read = ocr::read_pdf(&path, &tools, &work, &asked, is_word, &mut reading.teller(&app), &reading.stop)?;
    let title = glaukopis_core::import::pdf::identify(&path).ok().and_then(|facts| facts.title);
    Ok(ocr::imported_pdf(&file, &title.unwrap_or_else(|| stem(&file)), read))
}

/// Stops a reading that goes on.
#[tauri::command(async)]
pub fn ocr_stop(ticket: String) {
    for (_, stop) in readings().iter().filter(|(t, _)| *t == ticket) {
        stop.store(true, Ordering::Relaxed);
    }
}

/// What came of making a PDF of the library searchable.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MadeSearchable {
    /// The reference, which points to the file that has the text.
    pub reference: EntryFull,
    /// The pages that were read, and those that had text already.
    pub read: usize,
    pub with_text: usize,
    /// The pages that could not be read, counted from one, with why.
    pub failed: Vec<(usize, String)>,
}

/// Makes a PDF attached to a reference searchable: the file in the store is
/// replaced by the one that has the text, which the reference then points
/// to, as does every other that pointed to the file. The library is not
/// held while the pages are read.
#[tauri::command(async)]
pub fn ocr_searchable(
    app: AppHandle,
    state: State<'_, AppState>,
    id: String,
    path: String,
    asked: Asked,
    ticket: Option<String>,
) -> CommandResult<MadeSearchable> {
    let reading = Reading::begin(ticket);
    let absolute = state.library().attachment_path(&path)?;
    let made = ocr::make_searchable(
        &absolute,
        &state.tools(),
        &state.data.work(),
        &asked,
        &mut reading.teller(&app),
        &reading.stop,
    )?;
    let mut library = state.library();
    if let Some(pdf) = &made.pdf {
        library.replace_file(&path, pdf)?;
    }
    let entry = library.resolve(&id).ok_or_else(|| glaukopis_core::Error::not_found(id.clone()))?.clone();
    Ok(MadeSearchable {
        reference: full(&library, &entry),
        read: made.read,
        with_text: made.with_text,
        failed: made.failed,
    })
}

/// Reads the text of a picture of the store, to be shown, or made a map of.
#[tauri::command(async)]
pub fn ocr_picture(
    state: State<'_, AppState>,
    hash: String,
    asked: Asked,
    ticket: Option<String>,
) -> CommandResult<Imported> {
    let reading = Reading::begin(ticket);
    let picture = state.pictures.get(&hash)?;
    let bytes = state.pictures.read(&hash, &picture.extension)?;
    let words = words_of(&state, &asked);
    let is_word = words.as_ref().map(|w| w as &IsWord);
    let paragraphs = ocr::read_picture(&bytes, &state.tools(), &state.data.work(), &asked, is_word, &reading.stop)?;
    let name = if picture.name.trim().is_empty() { hash.chars().take(8).collect() } else { picture.name.clone() };
    Ok(ocr::imported_picture(&name, &stem(&name), paragraphs))
}
