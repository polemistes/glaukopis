//! Commands for the notebook (`glaukopis_core::notebook`): its document,
//! which passes as bytes as a project's does, and the files its notes hold,
//! which are in the library's store (`library/notebook.rs`). Mirrors
//! `src/lib/api/notebook.ts`.

use std::collections::HashSet;
use std::path::PathBuf;
use std::sync::PoisonError;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

use base64::Engine;
use base64::engine::general_purpose::STANDARD as B64;
use serde::{Deserialize, Serialize};
use tauri::ipc::{Request, Response};
use tauri::{AppHandle, Emitter, EventTarget, Manager, State, WebviewWindow};

use glaukopis_core::i18n::tr;
use glaukopis_core::library::{FileView, Library, attachments, files};
use glaukopis_core::notebook::inbox::{self, Stamp};
use glaukopis_core::notebook::{self, Place, Summary, firefox};

use super::projects::{put_part, with_head};
use super::viewer::blocking;
use crate::error::CommandResult;
use crate::state::AppState;

/// A file taken into the notebook, and what it says of itself.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NotebookFile {
    /// The file as the store keeps it.
    pub file: FileView,
    /// Of an image, the file a figure shows of it: itself, or a copy made to
    /// be shown. None for a file that is no image a figure can show.
    pub shown: Option<FileView>,
    /// When the file was last changed, as the library writes times; none for what was pasted.
    pub time: Option<String>,
    /// Of a photograph, when it was taken, as it says itself, of no time zone.
    pub taken: Option<String>,
    /// Of a photograph, where it was taken.
    pub place: Option<Place>,
}

/// Files taken into the notebook, and what could not be, a line each.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TakenFiles {
    pub files: Vec<NotebookFile>,
    pub problems: Vec<String>,
}

/// The event by which a change to the notebook is passed to the other windows.
pub const NOTEBOOK_UPDATE: &str = "notebook-update";

/// A change to the notebook, as one window wrote it, for the others: the
/// update of its document, in base64.
#[derive(Debug, Clone, Serialize)]
pub struct NotebookUpdate {
    pub update: String,
}

fn not_found() -> glaukopis_core::Error {
    glaukopis_core::Error::not_found(tr!("core-library-the-file-of-library"))
}

/// The file a figure shows of an image the notebook holds; none where it
/// cannot be told, which is said in the log and does not stop the rest.
fn shown(library: &mut Library, hash: &str) -> Option<FileView> {
    library.notebook_shown(hash).unwrap_or_else(|error| {
        tracing::warn!(%error, hash, "what a figure shows of a file of the notebook could not be made");
        None
    })
}

/// The notebook as it is on disk, as bytes: its state, empty where there is
/// none, and the changes after it. Each part has its length before it, and
/// the changes their number.
#[tauri::command(async)]
pub fn notebook_load(state: State<'_, AppState>) -> CommandResult<Response> {
    let loaded = state.notebook.load()?;
    let size = loaded.state.as_ref().map_or(0, Vec::len) + loaded.updates.iter().map(Vec::len).sum::<usize>();
    let mut out = Vec::with_capacity(size + 4 * (loaded.updates.len() + 2));
    put_part(&mut out, loaded.state.as_deref().unwrap_or_default());
    out.extend_from_slice(&(loaded.updates.len() as u32).to_le_bytes());
    for update in &loaded.updates {
        put_part(&mut out, update);
    }
    Ok(Response::new(out))
}

#[derive(Deserialize)]
struct AppendHead {
    time: Option<i64>,
}

/// Adds a change to the notebook's log, written at `time` in milliseconds
/// since 1970 (now, where it is not said); the change is the bytes of the
/// request after what it says of itself. It is passed to every other
/// window, as a change to a project is: the notebook open in two windows is
/// one document.
#[tauri::command(async)]
pub fn notebook_append(window: WebviewWindow, state: State<'_, AppState>, request: Request<'_>) -> CommandResult<()> {
    let (head, update) = with_head::<AppendHead>(&request)?;
    let time = head.time.unwrap_or_else(glaukopis_core::history::now_ms);
    state.notebook.append(&update, time)?;
    if update.is_empty() {
        return Ok(());
    }
    let from = window.label().to_owned();
    let passed = NotebookUpdate { update: B64.encode(&update) };
    let others = |target: &EventTarget| matches!(target, EventTarget::WebviewWindow { label } if *label != from);
    if let Err(error) = window.emit_filter(NOTEBOOK_UPDATE, passed, others) {
        tracing::warn!(%error, "a change to the notebook was not passed to the other windows");
    }
    // And, in a moment, to the writer's other computers (record 0119).
    super::sync::touched(window.app_handle());
    Ok(())
}

#[derive(Deserialize)]
struct SaveHead {
    #[serde(default)]
    summary: Summary,
}

/// Saves the notebook's whole state, which is the bytes of the request
/// after what it says of itself, and empties its log.
#[tauri::command(async)]
pub fn notebook_save_state(state: State<'_, AppState>, request: Request<'_>) -> CommandResult<()> {
    let (head, document) = with_head::<SaveHead>(&request)?;
    Ok(state.notebook.save_state(&document, &head.summary)?)
}

/// Takes files of this computer into the notebook, and every file in the
/// folders among them: each is copied into the store with the library
/// free, and entered after as a file the notebook holds, with what it says
/// of itself, read from the file where it lies (which copying does not
/// change). A file the store has already is that file. Run on the threads
/// for blocking work: many files take long.
#[tauri::command]
pub async fn notebook_take_files(app: AppHandle, paths: Vec<String>) -> CommandResult<TakenFiles> {
    blocking(move || {
        let state = app.state::<AppState>();
        let dir = state.library().dir().to_owned();
        let paths: Vec<PathBuf> = paths.into_iter().map(PathBuf::from).collect();
        let (taken, problems) = files::store_paths(&dir, &paths, false, &mut |_, _, _| {}, &AtomicBool::new(false));
        let facts: Vec<notebook::Facts> =
            taken.iter().map(|t| notebook::facts(std::path::Path::new(&t.origin))).collect();
        let mut library = state.library();
        library.notebook_take(&taken)?;
        let mut out = Vec::with_capacity(taken.len());
        for (t, facts) in taken.iter().zip(facts) {
            let Some(hash) = attachments::hash_of_path(&t.stored) else { continue };
            let Some(file) = library.file_view(hash) else { continue };
            let shown = shown(&mut library, hash);
            out.push(NotebookFile { file, shown, time: facts.time, taken: facts.taken, place: facts.place });
        }
        Ok(TakenFiles { files: out, problems })
    })
    .await
}

/// Takes a picture into the notebook from what the page holds, in base64:
/// one pasted. It is made what a figure shows first, as the library makes
/// a picture pasted.
#[tauri::command(async)]
pub fn notebook_take_image(state: State<'_, AppState>, name: String, content: String) -> CommandResult<NotebookFile> {
    let bytes =
        B64.decode(content.trim()).map_err(|_| glaukopis_core::Error::invalid(tr!("core-pictures-not-whole")))?;
    let mut library = state.library();
    let file = library.notebook_take_image(&name, &bytes)?;
    let shown = shown(&mut library, &file.hash);
    Ok(NotebookFile { file, shown, time: None, taken: None, place: None })
}

/// A file of the store by its hash, whether the library lists it or the notebook holds it alone.
#[tauri::command(async)]
pub fn notebook_file(state: State<'_, AppState>, hash: String) -> CommandResult<FileView> {
    Ok(state.library().file_view(&hash).ok_or_else(not_found)?)
}

/// Says that notes hold these files of the store.
#[tauri::command(async)]
pub fn notebook_hold(state: State<'_, AppState>, hashes: Vec<String>) -> CommandResult<()> {
    Ok(state.library().notebook_hold(&hashes)?)
}

/// Puts a file the notebook holds among the library's files, with where it came from.
#[tauri::command(async)]
pub fn notebook_to_library(
    state: State<'_, AppState>,
    hash: String,
    origin: Option<String>,
) -> CommandResult<FileView> {
    Ok(state.library().to_library(&hash, origin.as_deref())?)
}

/// Says which files the notes hold, when the notebook has been read for the
/// first time in this run: what the notebook held alone and no note holds
/// leaves the store. The files the notebook said it held when it was last
/// saved are held as well, so that a page that read less than there is
/// removes nothing a saved note holds. Done once in a run; asked again, it
/// does nothing. Gives how many files left the store.
#[tauri::command(async)]
pub fn notebook_sweep(state: State<'_, AppState>, held: Vec<String>) -> CommandResult<usize> {
    if state.notebook_swept.swap(true, Ordering::SeqCst) {
        return Ok(0);
    }
    let saved = state.notebook.held();
    let held: HashSet<&str> = held.iter().chain(&saved).map(String::as_str).collect();
    let swept = state.library().notebook_sweep(&held);
    if swept.is_err() {
        // What failed may be asked again.
        state.notebook_swept.store(false, Ordering::SeqCst);
    }
    Ok(swept?)
}

// ---- what the plugin for Firefox hands over (record 0102) ----

/// A thing the plugin for Firefox handed to the helper, or a note written
/// in a window of its own, as it is taken out of the notebook's inbox:
/// where it came from, what it is, its picture taken into the store where
/// it has one, and of a note its text and the files it holds, taken into
/// the store.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InboxItem {
    pub kind: inbox::Kind,
    pub url: String,
    pub title: String,
    pub when: String,
    pub text: String,
    pub html: String,
    pub alt: String,
    pub image: Option<NotebookFile>,
    /// Of a note, its text as ProseMirror's JSON of the body schema; null for the rest.
    pub doc: serde_json::Value,
    /// Of a note, the files it holds, in the order it names them; each by
    /// the hash the store keeps it by, which is the hash the note names it
    /// by. A file that could not be taken in is left out, and logged.
    pub files: Vec<NotebookFile>,
}

/// The event by which one window is told that something lies in the inbox.
pub const NOTEBOOK_INBOX: &str = "notebook-inbox";

/// The name a picture handed over is taken in by, where it has none.
const PICTURE_NAME: &str = "image.png";

/// Takes one thing out of the inbox: its picture, where it has one, into
/// the store as a picture of a note.
fn take(state: &AppState, id: &str) -> glaukopis_core::Result<InboxItem> {
    let (collected, picture) = state.inbox.read(id)?;
    let image = match picture {
        Some(bytes) => {
            let name = if collected.name.trim().is_empty() { PICTURE_NAME } else { collected.name.as_str() };
            let mut library = state.library();
            let file = library.notebook_take_image(name, &bytes)?;
            let shown = shown(&mut library, &file.hash);
            Some(NotebookFile { file, shown, time: None, taken: None, place: None })
        }
        None => None,
    };
    let files = if collected.kind == inbox::Kind::Note { held(state, id, &collected.files) } else { Vec::new() };
    let inbox::Collected { kind, url, title, when, text, html, alt, name: _, doc, files: _ } = collected;
    Ok(InboxItem { kind, url, title, when, text, html, alt, image, doc, files })
}

/// The files a note in the inbox holds, taken into the store as the
/// notebook's, with what each says of itself, read from where it lies, and
/// under the name the note gives it. A file the store has already is that
/// file. One that cannot be taken in is left out, and the rest go on.
fn held(state: &AppState, id: &str, held: &[inbox::HeldFile]) -> Vec<NotebookFile> {
    let dir = state.library().dir().to_owned();
    let mut taken = Vec::new();
    let mut facts = Vec::new();
    for file in held {
        let stored = state
            .inbox
            .file_of(id, &file.hash)
            .and_then(|path| Ok((notebook::facts(&path), attachments::store_file(&dir, &path, &file.name)?)));
        match stored {
            Ok((said, stored)) => {
                facts.push(said);
                taken.push(files::Taken { stored, folders: Vec::new(), origin: file.name.clone() });
            }
            Err(error) => {
                tracing::warn!(%error, id, hash = file.hash, "a file of a note in the inbox could not be taken in")
            }
        }
    }
    let mut library = state.library();
    if let Err(error) = library.notebook_take(&taken) {
        tracing::warn!(%error, id, "the files of a note in the inbox could not be entered as the notebook's");
        return Vec::new();
    }
    let mut out = Vec::with_capacity(taken.len());
    for (t, facts) in taken.iter().zip(facts) {
        let Some(hash) = attachments::hash_of_path(&t.stored) else { continue };
        let Some(file) = library.file_view(hash) else { continue };
        let shown = shown(&mut library, hash);
        out.push(NotebookFile { file, shown, time: facts.time, taken: facts.taken, place: facts.place });
    }
    out
}

/// A file a note holds, as the notebook's readable copy names it.
#[derive(serde::Deserialize)]
pub struct HeldNamed {
    hash: String,
    name: String,
}

/// Writes the readable copy of the notebook into its folder: the Org form
/// the interface made, the pictures its notes show and the files they hold
/// (record 0104). A copy to be read, never read back.
#[tauri::command(async)]
pub fn notebook_readable_write(
    state: State<'_, AppState>,
    org: String,
    pictures: Vec<String>,
    files: Vec<HeldNamed>,
) -> CommandResult<()> {
    let held: Vec<glaukopis_core::notebook::readable::Held<'_>> =
        files.iter().map(|f| glaukopis_core::notebook::readable::Held { hash: &f.hash, name: &f.name }).collect();
    let library = state.library();
    Ok(glaukopis_core::notebook::readable::write(state.notebook.dir(), &org, &pictures, &held, &library)?)
}

/// How many things lie in the notebook's inbox: one look at a folder. The
/// window asks before it takes, so that the notebook is read first and
/// nothing leaves the inbox that the notebook is not there to receive.
#[tauri::command(async)]
pub fn notebook_inbox_waiting(state: State<'_, AppState>) -> usize {
    state.inbox.ids().len()
}

/// Takes what lies in the notebook's inbox out of it, in the order it came:
/// each thing given once, to whichever window asks first, and removed from
/// the inbox then. A thing that cannot be read or taken is set aside and
/// said in the log, and the rest go on. Run on the threads for blocking
/// work: pictures and files are read and copied.
#[tauri::command]
pub async fn notebook_inbox_take(app: AppHandle) -> CommandResult<Vec<InboxItem>> {
    blocking(move || Ok(take_all(&app.state::<AppState>()))).await
}

/// Takes everything that lies in the inbox, one taking at a time.
pub(crate) fn take_all(state: &AppState) -> Vec<InboxItem> {
    let _taking = state.inbox_taking.lock().unwrap_or_else(PoisonError::into_inner);
    let mut items = Vec::new();
    for id in state.inbox.ids() {
        match take(state, &id) {
            Ok(item) => {
                items.push(item);
                if let Err(error) = state.inbox.remove(&id) {
                    // Left there, it would be given again: set aside.
                    tracing::warn!(%error, id, "a thing taken from the inbox could not be removed from it");
                    if let Err(error) = state.inbox.set_aside(&id) {
                        tracing::error!(%error, id, "a thing taken from the inbox could not be set aside");
                    }
                }
            }
            Err(error) => {
                tracing::warn!(%error, id, "a thing in the inbox could not be taken in: it is set aside");
                if let Err(error) = state.inbox.set_aside(&id) {
                    tracing::error!(%error, id, "a thing in the inbox could not be set aside");
                }
            }
        }
    }
    if !items.is_empty() {
        tracing::info!(count = items.len(), "taken from the notebook's inbox");
    }
    items
}

/// How often the inbox is looked at while the application runs.
const LOOK_EVERY: Duration = Duration::from_millis(1500);
/// After how many looks a window is told again of things that still lie
/// there: one told before its page listened would otherwise never ask.
const TELL_AGAIN_AFTER: u32 = 20;

/// Looks at the inbox every second and a half, on a thread of its own, and
/// tells one window (`main` where it is there, else the first) when
/// something has come and lies there, which then asks for it. One look at
/// a folder while nothing comes. The thread holds the application from
/// nothing: it ends with the process.
pub fn look_at_the_inbox(app: AppHandle) {
    let looking = std::thread::Builder::new().name("notebook-inbox".into()).spawn(move || {
        let mut last = Stamp::default();
        let mut unchanged = 0u32;
        loop {
            std::thread::sleep(LOOK_EVERY);
            let Some(state) = app.try_state::<AppState>() else { continue };
            let stamp = state.inbox.stamp();
            unchanged = if stamp == last { unchanged + 1 } else { 0 };
            if stamp.waiting() && unchanged.is_multiple_of(TELL_AGAIN_AFTER) {
                tell_one_window(&app);
            }
            last = stamp;
        }
    });
    if let Err(error) = looking {
        tracing::warn!(%error, "the notebook's inbox is not looked at while the application runs");
    }
}

/// Tells the window labelled `main`, else the first there is, that
/// something lies in the inbox.
fn tell_one_window(app: &AppHandle) {
    let windows = app.webview_windows();
    let Some(label) = windows.get("main").map(|w| w.label().to_owned()).or_else(|| {
        let mut labels: Vec<&String> = windows.keys().collect();
        labels.sort();
        labels.first().map(|l| (*l).clone())
    }) else {
        return;
    };
    if let Err(error) = app.emit_to(EventTarget::WebviewWindow { label }, NOTEBOOK_INBOX, ()) {
        tracing::warn!(%error, "a window was not told of what lies in the notebook's inbox");
    }
}

/// Whether Firefox is set up to start the helper for this user.
pub type FirefoxSetup = firefox::Setup;

/// This program, as Firefox is to start it.
fn this_program() -> glaukopis_core::Result<PathBuf> {
    let exe = std::env::current_exe().map_err(|e| glaukopis_core::Error::invalid(e.to_string()))?;
    Ok(firefox::this_program(exe))
}

/// Whether the file that tells Firefox of the helper is there, and names this program.
#[tauri::command(async)]
pub fn firefox_setup() -> CommandResult<FirefoxSetup> {
    Ok(firefox::Place::of_this_user().state(&this_program()?))
}

/// Writes the file that tells Firefox of the helper, for this user.
#[tauri::command(async)]
pub fn firefox_set_up() -> CommandResult<FirefoxSetup> {
    let setup = firefox::Place::of_this_user().set_up(&this_program()?)?;
    tracing::info!(manifest = setup.manifest, "Firefox is told of the helper of the notebook");
    Ok(setup)
}

/// Removes it.
#[tauri::command(async)]
pub fn firefox_remove() -> CommandResult<FirefoxSetup> {
    let setup = firefox::Place::of_this_user().remove(&this_program()?)?;
    tracing::info!(manifest = setup.manifest, "Firefox is no longer told of the helper of the notebook");
    Ok(setup)
}

#[cfg(test)]
mod tests {
    use super::*;
    use glaukopis_core::notebook::inbox::{Collected, Kind};

    fn collected(kind: Kind, name: &str) -> Collected {
        Collected {
            kind,
            url: "https://example.org/an-article".into(),
            title: "An article".into(),
            when: "2026-11-15T12:00:00.000Z".into(),
            text: "What it says.".into(),
            html: "<p>What it says.</p>".into(),
            alt: "A red square".into(),
            name: name.into(),
            doc: serde_json::Value::Null,
            files: Vec::new(),
        }
    }

    #[test]
    fn a_note_in_the_inbox_is_taken_with_its_files_into_the_store() {
        use glaukopis_core::notebook::note_window::{NoteText, NoteWindow};
        let tmp = tempfile::tempdir().unwrap();
        let crate::Opening::Ready(state) = crate::opening(tmp.path().join("data"), false, None, |_| {}) else {
            panic!("the data folder was not opened");
        };
        // Written in a window of its own, beside the application.
        let window = NoteWindow::new(glaukopis_core::paths::DataDir::at(tmp.path().join("data")));
        let picture = window.add_bytes("owl.png", include_bytes!("../../icons/32x32.png")).unwrap();
        let letter = tmp.path().join("letter.pdf");
        std::fs::write(&letter, b"%PDF-1.4").unwrap();
        let file = window.add_file(&letter).unwrap();
        let doc = serde_json::json!({"type": "doc", "content": [
            {"type": "paragraph", "content": [{"type": "text", "text": "Words"}]},
            {"type": "figure", "attrs": {"file": picture.hash, "extension": "png", "name": "owl.png"}},
            {"type": "file", "attrs": {"hash": file.hash, "name": "letter.pdf", "extension": "pdf"}},
        ]});
        let files = vec![
            inbox::HeldFile { hash: picture.hash.clone(), name: "owl.png".into() },
            inbox::HeldFile { hash: file.hash.clone(), name: "letter.pdf".into() },
        ];
        window.send(&NoteText { doc: doc.clone(), words: "Words".into(), files }).unwrap();

        let items = take_all(&state);
        assert_eq!(items.len(), 1);
        let note = &items[0];
        assert_eq!(note.kind, Kind::Note);
        assert_eq!((note.text.as_str(), &note.doc), ("Words", &doc));
        assert!(note.image.is_none() && note.url.is_empty());
        let hashes: Vec<&str> = note.files.iter().map(|f| f.file.hash.as_str()).collect();
        assert_eq!(hashes, vec![picture.hash.as_str(), file.hash.as_str()], "the store keeps each by the note's hash");
        assert_eq!(note.files[1].file.name, "letter.pdf");
        assert!(note.files[0].shown.is_some(), "a picture a figure can show");
        assert!(note.files[1].shown.is_none());
        assert!(state.library().file_view(&file.hash).is_some());
        assert!(state.inbox.ids().is_empty(), "taken, and gone from the inbox");
    }

    #[test]
    fn what_lies_in_the_inbox_is_taken_once_in_order_and_what_cannot_be_is_set_aside() {
        let tmp = tempfile::tempdir().unwrap();
        let crate::Opening::Ready(state) = crate::opening(tmp.path().join("data"), false, None, |_| {}) else {
            panic!("the data folder was not opened");
        };
        let picture = include_bytes!("../../icons/32x32.png");
        state.inbox.put(&collected(Kind::Page, ""), None).unwrap();
        state.inbox.put(&collected(Kind::Region, ""), Some(picture)).unwrap();
        let broken = state.inbox.put(&collected(Kind::Selection, ""), None).unwrap();
        std::fs::write(state.inbox.dir().join(&broken).join("item.json"), "{ not whole").unwrap();
        state.inbox.put(&collected(Kind::Image, "owl.png"), Some(picture)).unwrap();

        let items = take_all(&state);
        let kinds: Vec<Kind> = items.iter().map(|item| item.kind).collect();
        assert_eq!(kinds, vec![Kind::Page, Kind::Region, Kind::Image], "the one that cannot be read is left out");
        assert!(items[0].image.is_none());
        assert_eq!(items[0].title, "An article");
        assert_eq!(items[0].alt, "A red square");
        let region = items[1].image.as_ref().expect("the picture was taken into the store");
        assert!(region.shown.is_some());
        assert_eq!(region.file.name, "image.png", "named so where the plugin gave no name");
        assert!(state.library().file_view(&region.file.hash).is_some());
        assert!(items[2].image.is_some());

        assert!(state.inbox.ids().is_empty(), "taken once");
        assert!(take_all(&state).is_empty());
        assert!(state.inbox.dir().join(format!(".unread-{broken}")).is_dir(), "set aside, not lost");
    }
}
