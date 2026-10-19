//! Commands for text read from PDFs and pictures (ADR 0018): into a map, a
//! PDF of the library made searchable, the text of a picture of the store.
//!
//! A reading takes a while. It is asked for with a ticket, by which it can
//! be stopped, and the interface is told how far it has come by the event
//! `ocr-progress`, which carries the ticket.

use std::path::{Path, PathBuf};

use serde::Serialize;
use tauri::{AppHandle, State};

use glaukopis_core::error::IoContext;
use glaukopis_core::import::document::Imported;
use glaukopis_core::ocr::text::IsWord;
use glaukopis_core::ocr::{self, Asked, Looked, Progress};

use crate::commands::library::{EntryFull, full};
use glaukopis_core::library::StoredFile;
use glaukopis_core::tr;

use super::work::{self, Work};
use crate::error::CommandResult;
use crate::state::AppState;

/// What tells the page how far a reading has come, as `ocr-progress`.
fn teller<'a>(work: &'a Work, app: &'a AppHandle) -> impl FnMut(Progress) + 'a {
    move |progress| work.tell(app, work::OCR_PROGRESS, progress)
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
        .all_languages()
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
    let reading = Work::begin(ticket);
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
    let read = ocr::read_pdf(&path, &tools, &work, &asked, is_word, &mut teller(&reading, &app), &reading.stop)?;
    // The title the file gives itself, as the look at it found.
    let title = read.named.clone().unwrap_or_else(|| stem(&file));
    Ok(ocr::imported_pdf(&file, &title, read))
}

/// Stops a reading that goes on.
#[tauri::command(async)]
pub fn ocr_stop(ticket: String) {
    work::stop(&ticket);
}

/// What came of making a PDF of the library searchable.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MadeSearchable {
    /// The reference it was asked for, which points to the file that has the text.
    pub reference: Option<EntryFull>,
    /// The file that has the text, as it stands in the store now.
    pub file: StoredFile,
    /// The pages that were read, and those that had text already.
    pub read: usize,
    pub with_text: usize,
    /// The pages that could not be read, counted from one, with why.
    pub failed: Vec<(usize, String)>,
    /// How many fonts were given their letters, where the text was translated.
    pub remapped: usize,
    /// The pages Tesseract read poorly, counted from one.
    pub poorly: Vec<usize>,
}

/// Makes a PDF of the library searchable: the file in the store is
/// replaced by the one that has the text, which every reference that
/// pointed to the file then points to, and which takes the file's place
/// among the files. `id` is a reference whose state is given back. The
/// library is not held while the pages are read.
#[tauri::command(async)]
pub fn ocr_searchable(
    app: AppHandle,
    state: State<'_, AppState>,
    id: Option<String>,
    path: String,
    asked: Asked,
    ticket: Option<String>,
) -> CommandResult<MadeSearchable> {
    let reading = Work::begin(ticket);
    let absolute = state.library().attachment_path(&path)?;
    // The reference is looked for before the work, which replaces the file:
    // one that is not there must not make the work that was done look failed.
    if let Some(id) = &id
        && state.library().resolve(id).is_none()
    {
        return Err(glaukopis_core::Error::not_found(tr!("core-library-the-reference")).into());
    }
    let made = ocr::make_searchable(
        &absolute,
        &state.tools(),
        &state.data.work(),
        &asked,
        &mut teller(&reading, &app),
        &reading.stop,
    )?;
    let mut library = state.library();
    let now = match &made.pdf {
        Some(pdf) => library.replace_file(&path, pdf)?.0,
        None => path.clone(),
    };
    // Gone while the work was done, it is not given: the file was made searchable all the same.
    let reference = id.as_deref().and_then(|id| library.resolve(id)).map(|entry| full(&library, entry));
    Ok(MadeSearchable {
        reference,
        file: library.describe_file(&now),
        read: made.read,
        with_text: made.with_text,
        failed: made.failed,
        remapped: made.remapped,
        poorly: made.poorly,
    })
}

/// The text a PDF has, `count` pages from `from` (counted from nought), as
/// it is and as translated: for the preview before it is read. With
/// `stored`, the path is that of a file of the library. At most fifty pages
/// at a time.
#[tauri::command(async)]
pub fn ocr_text(
    state: State<'_, AppState>,
    path: String,
    stored: Option<bool>,
    from: usize,
    count: usize,
) -> CommandResult<Vec<ocr::PageTextView>> {
    let path = if stored.unwrap_or(false) { state.library().attachment_path(&path)? } else { PathBuf::from(path) };
    Ok(ocr::text_of_pages(&path, from, count.min(50))?)
}

/// Tries a page of a PDF, counted from one, before the whole is read: what
/// Tesseract reads of it with the languages and settings asked, how sure it
/// was, and the picture it read. With `stored`, the path is that of a file
/// of the library. Stopped by `ocr_stop` with its ticket, as a reading is.
#[tauri::command(async)]
pub fn ocr_try(
    state: State<'_, AppState>,
    path: String,
    stored: Option<bool>,
    page: usize,
    asked: Asked,
    ticket: Option<String>,
) -> CommandResult<ocr::Tried> {
    let path = if stored.unwrap_or(false) { state.library().attachment_path(&path)? } else { PathBuf::from(path) };
    let trying = Work::begin(ticket);
    let words = words_of(&state, &asked);
    let is_word = words.as_ref().map(|w| w as &IsWord);
    Ok(ocr::try_page(&path, &state.tools(), &state.data.work(), &asked, page, is_word, &trying.stop)?)
}

/// Reads the text of a picture of the store, to be shown, or made a map of.
#[tauri::command(async)]
pub fn ocr_picture(
    state: State<'_, AppState>,
    hash: String,
    asked: Asked,
    ticket: Option<String>,
) -> CommandResult<Imported> {
    let reading = Work::begin(ticket);
    let picture = state.pictures.get(&hash)?;
    let bytes = state.pictures.read(&hash, &picture.extension)?;
    let words = words_of(&state, &asked);
    let is_word = words.as_ref().map(|w| w as &IsWord);
    let paragraphs = ocr::read_picture(&bytes, &state.tools(), &state.data.work(), &asked, is_word, &reading.stop)?;
    let name = if picture.name.trim().is_empty() { hash.chars().take(8).collect() } else { picture.name.clone() };
    Ok(ocr::imported_picture(&name, &stem(&name), paragraphs))
}
