//! Commands for text read from PDFs and pictures (ADR 0018): into a map, a
//! PDF of the library made searchable, the text of a picture of the store.
//!
//! A reading takes a while. It is asked for with a ticket, by which it can
//! be stopped, and the interface is told how far it has come by the event
//! `ocr-progress`, which carries the ticket.
//!
//! A PDF read into elements is kept after the reading, under a token: what
//! is made of it, the shape kept or plain paragraphs, the tree by its
//! headings or by its pages, the pages marked, is chosen after the reading,
//! and the tree is made anew from the reading kept (`ocr_assemble`) without
//! reading the file again. One reading is kept at a time: a new one takes
//! its place when it is done, and the dialog lets it go when it closes
//! (`ocr_forget`).

use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Mutex, PoisonError};

use serde::Serialize;
use tauri::{AppHandle, State};

use glaukopis_core::error::IoContext;
use glaukopis_core::import::document::Imported;
use glaukopis_core::ocr::text::IsWord;
use glaukopis_core::ocr::{self, Asked, Looked, Making, Progress};

use crate::commands::library::{EntryFull, full};
use glaukopis_core::library::StoredFile;
use glaukopis_core::tr;

use super::work::{self, Work};
use crate::error::CommandResult;
use crate::state::{AppState, KeptReading};

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

/// What a reading into elements came to: the tree as first made, and the
/// token of the reading kept, where there is one (a PDF), by which the tree
/// is made anew otherwise (`ocr_assemble`) without reading it again.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReadDone {
    pub imported: Imported,
    pub kept: Option<String>,
}

/// Reads a PDF or a picture, to become a map: by its headings, or a part
/// for each page of a PDF, named by its number; the text of a picture under
/// its name. With `stored`, the path is that of a file of the library,
/// within its store, as for `ocr_look`.
#[tauri::command(async)]
pub fn ocr_read(
    app: AppHandle,
    state: State<'_, AppState>,
    path: String,
    asked: Asked,
    ticket: Option<String>,
    stored: Option<bool>,
) -> CommandResult<ReadDone> {
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
        return Ok(ReadDone { imported: ocr::imported_picture(&file, &stem(&file), paragraphs), kept: None });
    }
    let words = words_of(&state, &asked);
    let is_word = words.as_ref().map(|w| w as &IsWord);
    let read = ocr::read_pdf(&path, &tools, &work, &asked, is_word, &mut teller(&reading, &app), &reading.stop)?;
    // The title the file gives itself, as the look at it found.
    let title = read.named.clone().unwrap_or_else(|| stem(&file));
    // At first by its headings, the shape kept, the pages marked.
    let imported = ocr::imported_pdf(&file, &title, &read, Making::default());
    let kept = keep(&state.reading, file, title, read);
    Ok(ReadDone { imported, kept: Some(kept) })
}

/// Keeps a reading of a PDF into elements in `slot`, in the place of the
/// one kept there before, and gives the token it is kept under: one that
/// was not given before while the application runs.
fn keep(slot: &Mutex<Option<KeptReading>>, file: String, title: String, read: ocr::ReadPdf) -> String {
    static GIVEN: AtomicU64 = AtomicU64::new(0);
    let token = format!("reading-{}", GIVEN.fetch_add(1, Ordering::Relaxed) + 1);
    *slot.lock().unwrap_or_else(PoisonError::into_inner) =
        Some(KeptReading { token: token.clone(), file, title, read });
    token
}

/// What is said where a reading asked for is not the one kept: it was let
/// go, or another took its place.
fn gone() -> glaukopis_core::Error {
    glaukopis_core::Error::Refused { kind: "not-found", message: tr!("ocr-reading-gone") }
}

/// The tree made from the reading kept in `slot` under `token`, as `making`
/// says; or that it is gone.
fn assemble(slot: &Mutex<Option<KeptReading>>, token: &str, making: Making) -> glaukopis_core::Result<Imported> {
    match slot.lock().unwrap_or_else(PoisonError::into_inner).as_ref() {
        Some(kept) if kept.token == token => Ok(ocr::imported_pdf(&kept.file, &kept.title, &kept.read, making)),
        _ => Err(gone()),
    }
}

/// Lets the reading kept in `slot` go, where it is the one under `token`:
/// a dialog that closes after another reading took the place of its own
/// lets nothing go.
fn forget(slot: &Mutex<Option<KeptReading>>, token: &str) {
    let mut kept = slot.lock().unwrap_or_else(PoisonError::into_inner);
    if kept.as_ref().is_some_and(|k| k.token == token) {
        *kept = None;
    }
}

/// The tree made anew from the reading kept under `kept`, as `making` says:
/// the shape kept or plain paragraphs, by its headings or by its pages, the
/// pages marked or not. The pages are not read again. Where the reading is
/// not the one kept, it is said to be gone, by the kind `not-found`.
#[tauri::command(async)]
pub fn ocr_assemble(state: State<'_, AppState>, kept: String, making: Making) -> CommandResult<Imported> {
    Ok(assemble(&state.reading, &kept, making)?)
}

/// Lets the reading kept under `kept` go, where it is the one kept.
#[tauri::command(async)]
pub fn ocr_forget(state: State<'_, AppState>, kept: String) {
    forget(&state.reading, &kept);
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

/// Tries a page of a PDF, counted from one, before the whole is read, or a
/// picture as its one page: what Tesseract reads of it with the languages
/// and settings asked, word by word, how sure it was, and the picture it
/// read. With `stored`, the path is that of a file of the library. Stopped
/// by `ocr_stop` with its ticket, as a reading is.
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
    Ok(ocr::try_page(&path, &state.tools(), &state.data.work(), &asked, page, &trying.stop)?)
}

/// Reads the text of an image of the library, to be shown, or made a map of.
#[tauri::command(async)]
pub fn ocr_picture(
    state: State<'_, AppState>,
    hash: String,
    asked: Asked,
    ticket: Option<String>,
) -> CommandResult<Imported> {
    let reading = Work::begin(ticket);
    let (path, called) = {
        let library = state.library();
        let record = library
            .files
            .get(&hash)
            .ok_or_else(|| glaukopis_core::Error::not_found(tr!("core-library-the-file-of-library")))?;
        (library.attachment_path(&record.path)?, record.name.clone())
    };
    let bytes = std::fs::read(&path).map_err(|e| glaukopis_core::Error::io(tr!("io-reading", path = &path), e))?;
    let words = words_of(&state, &asked);
    let is_word = words.as_ref().map(|w| w as &IsWord);
    let paragraphs = ocr::read_picture(&bytes, &state.tools(), &state.data.work(), &asked, is_word, &reading.stop)?;
    let name = if called.trim().is_empty() { hash.chars().take(8).collect() } else { called };
    Ok(ocr::imported_picture(&name, &stem(&name), paragraphs))
}

/// A small picture of a page, for the strip of pages: drawn, or why it
/// could not be.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PagePicture {
    /// Counted from one.
    pub number: usize,
    /// The page in grey, as a data URL of a PNG, where it could be drawn.
    pub picture: Option<String>,
    /// Why it could not be drawn, where it could not.
    pub failed: Option<String>,
}

impl From<(usize, Result<String, String>)> for PagePicture {
    /// A page counted from nought, and its PNG in base64 or why it was not drawn.
    fn from((index, drawn): (usize, Result<String, String>)) -> PagePicture {
        match drawn {
            Ok(png) => {
                PagePicture { number: index + 1, picture: Some(format!("data:image/png;base64,{png}")), failed: None }
            }
            Err(why) => PagePicture { number: index + 1, picture: None, failed: Some(why) },
        }
    }
}

/// Small pictures of `count` pages of a PDF from `from` (counted from
/// nought), as many as it has, each `width` dots wide, in grey: for the
/// strip of pages. At most a hundred at a time. With `stored`, the path is
/// that of a file of the library; with a ticket, it is stopped by `ocr_stop`.
#[tauri::command(async)]
pub fn ocr_pages(
    state: State<'_, AppState>,
    path: String,
    stored: Option<bool>,
    from: usize,
    count: usize,
    width: u32,
    ticket: Option<String>,
) -> CommandResult<Vec<PagePicture>> {
    let path = if stored.unwrap_or(false) { state.library().attachment_path(&path)? } else { PathBuf::from(path) };
    let drawing = Work::begin(ticket);
    let pictures =
        ocr::pages_pictures(&path, &state.tools(), &state.data.work(), from, count.min(100), width, &drawing.stop)?;
    Ok(pictures.into_iter().map(PagePicture::from).collect())
}

#[cfg(test)]
mod tests {
    use super::*;
    use glaukopis_core::document::Inline;
    use glaukopis_core::ocr::Structure;

    /// A reading of a page for each text, each a paragraph, read by Tesseract.
    fn reading(texts: &[&str]) -> ocr::ReadPdf {
        let pages = texts
            .iter()
            .enumerate()
            .map(|(i, text)| ocr::PageText {
                number: i + 1,
                label: (i + 1).to_string(),
                paragraphs: vec![(*text).to_owned()],
                read: true,
                ..Default::default()
            })
            .collect();
        ocr::ReadPdf { pages, ..Default::default() }
    }

    fn plain(content: &[Inline]) -> String {
        content.iter().map(|i| if let Inline::Text { text, .. } = i { text.as_str() } else { "" }).collect()
    }

    /// A reading is kept under a token, made into a tree as often as asked,
    /// until another takes its place or it is let go; a token of a reading
    /// gone is said to be so.
    #[test]
    fn a_reading_is_kept_until_another_takes_its_place_or_it_is_let_go() {
        let slot = Mutex::new(None);
        let first = keep(&slot, "a.pdf".into(), "Alpha".into(), reading(&["One.", "Two."]));
        let imported = assemble(&slot, &first, Making::default()).unwrap();
        assert_eq!((imported.file.as_str(), plain(&imported.title).as_str()), ("a.pdf", "Alpha"));
        let headings: Vec<String> = imported.sections.iter().map(|s| plain(&s.heading)).collect();
        assert_eq!(headings, ["1", "2"]);
        let by_pages = Making { shape: false, structure: Structure::Pages, page_marks: false };
        assert_eq!(assemble(&slot, &first, by_pages).unwrap().sections.len(), 2);

        let second = keep(&slot, "b.pdf".into(), "Beta".into(), reading(&["Three."]));
        assert_ne!(first, second);
        let err = assemble(&slot, &first, Making::default()).unwrap_err();
        assert_eq!((err.kind(), err.to_string()), ("not-found", tr!("ocr-reading-gone")));
        // The first let go after the second took its place: the second stays.
        forget(&slot, &first);
        assert_eq!(assemble(&slot, &second, Making::default()).unwrap().file, "b.pdf");
        forget(&slot, &second);
        assert!(assemble(&slot, &second, Making::default()).is_err());
        assert!(slot.lock().unwrap().is_none());
    }
}
