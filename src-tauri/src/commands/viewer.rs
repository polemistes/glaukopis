//! Commands for a file of the library shown in a side of the window (ADR
//! 0069, 0072): what is known of it before its pages are drawn, a page drawn
//! at a width in colour, given as the bytes of a PNG, and the lines of a
//! page with their places, laid over the page so that its text is selected
//! and copied as text. Mirrors `src/lib/api/viewer.ts`.
//!
//! The file is opened and its pages drawn in the child, as every PDF is
//! (`ocr/child.rs`); the pages drawn are kept on disk under the data
//! directory (`ocr/pages_cache.rs`), so that turning back is immediate.

use std::path::PathBuf;

use serde::Serialize;
use tauri::State;
use tauri::ipc::Response;

use glaukopis_core::ocr;
use glaukopis_core::tr;

use super::work::Work;
use crate::error::CommandResult;
use crate::state::AppState;

/// What is known of a file before its pages are drawn.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileFacts {
    /// What it is called in the library.
    pub name: String,
    /// Whether it is a picture, shown as its one page, and not a PDF.
    pub picture: bool,
    pub pages: usize,
    /// The size of each page as it is drawn, in points; of a picture, in its pixels.
    pub sizes: Vec<(f32, f32)>,
    /// The number each page has in print, where the file tells it; else its count, from one.
    pub labels: Vec<String>,
    /// Whether it asks for a password, and cannot be shown.
    pub locked: bool,
    /// The contents the file carries of its own headings, in their order.
    pub outline: Vec<ContentsEntry>,
}

/// An entry of a file's own contents: a heading's words, the page it leads
/// to, counted from one, and how deep it stands, 1 at the top.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ContentsEntry {
    pub title: String,
    pub page: usize,
    pub depth: u8,
}

/// A line of the text a page has, and where it stands, in points from the
/// top left of the page as it is drawn.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PageLine {
    pub text: String,
    pub left: f32,
    pub top: f32,
    pub right: f32,
    pub bottom: f32,
}

/// The text a page has, as lines with their places.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PageLines {
    /// Counted from one.
    pub number: usize,
    /// The number it has in print.
    pub label: String,
    /// The size of the page as it is drawn, in points: what the places are counted in.
    pub width: f32,
    pub height: f32,
    /// In the order they stand; none for a page without text, or a picture.
    pub lines: Vec<PageLine>,
}

impl From<ocr::PageLines> for PageLines {
    fn from(page: ocr::PageLines) -> PageLines {
        PageLines {
            number: page.number,
            label: page.label,
            width: page.width,
            height: page.height,
            lines: page
                .lines
                .into_iter()
                .map(|l| PageLine { text: l.text, left: l.left, top: l.top, right: l.right, bottom: l.bottom })
                .collect(),
        }
    }
}

/// What a file of the library is called, and where it is on this computer;
/// `not-found` where the library has it no longer. The library is not held
/// afterwards, while the file is opened.
fn stored(state: &AppState, hash: &str) -> CommandResult<(String, PathBuf)> {
    let library = state.library();
    let record = library
        .files
        .get(hash)
        .ok_or_else(|| glaukopis_core::Error::not_found(tr!("core-library-the-file-of-library")))?;
    let path = library.attachment_path(&record.path)?;
    Ok((record.name.clone(), path))
}

/// Where the pages drawn are kept.
fn cache(state: &AppState) -> PathBuf {
    state.data.root().join("cache").join("pages")
}

/// What is known of a file of the library, by its hash, before its pages
/// are drawn: how many it has, their sizes, their numbers in print, and
/// whether it asks for a password. A picture is one page.
#[tauri::command(async)]
pub fn file_facts(state: State<'_, AppState>, hash: String) -> CommandResult<FileFacts> {
    let (name, path) = stored(&state, &hash)?;
    let facts = ocr::file_facts(&path, &state.tools(), &state.data.work())?;
    Ok(FileFacts {
        name,
        picture: facts.picture,
        pages: facts.pages,
        sizes: facts.sizes,
        labels: facts.labels,
        locked: facts.locked,
        outline: facts
            .outline
            .into_iter()
            .filter_map(|e| Some(ContentsEntry { title: e.title, page: e.page?, depth: e.depth }))
            .collect(),
    })
}

/// A page of a file of the library, counted from one, drawn `width` dots
/// wide in colour, as the bytes of a PNG (ADR 0072): from the cache where it
/// was drawn before, else drawn in the child and kept. With a ticket, it is
/// stopped by `ocr_stop`. A page the file has not, or one that could not be
/// drawn, is an error that says why.
#[tauri::command(async)]
pub fn file_page(
    state: State<'_, AppState>,
    hash: String,
    page: usize,
    width: u32,
    ticket: Option<String>,
) -> CommandResult<Response> {
    let (_, path) = stored(&state, &hash)?;
    let (tools, work) = (state.tools(), state.data.work());
    let no_such_page = || -> CommandResult<Response> {
        let pages = ocr::file_facts(&path, &tools, &work)?.pages;
        Err(glaukopis_core::Error::invalid(tr!("ocr-no-such-page", page = page, pages = pages)).into())
    };
    let Some(index) = page.checked_sub(1) else { return no_such_page() };
    let drawing = Work::begin(ticket);
    let cache = cache(&state);
    match ocr::pages_at(&path, &tools, &work, Some(&cache), &[index], width, &drawing.stop)?.into_iter().next() {
        Some((_, Ok(png))) => Ok(Response::new(png)),
        Some((_, Err(why))) => Err(glaukopis_core::Error::invalid(why).into()),
        None => no_such_page(),
    }
}

/// The lines of a page of a file of the library, counted from one, in the
/// order they stand, as translated by the schemes where any applied, with
/// their places on the page as it is drawn. A page without text has none.
#[tauri::command(async)]
pub fn file_page_lines(state: State<'_, AppState>, hash: String, page: usize) -> CommandResult<PageLines> {
    let (_, path) = stored(&state, &hash)?;
    let (tools, work) = (state.tools(), state.data.work());
    let Some(index) = page.checked_sub(1) else {
        let pages = ocr::file_facts(&path, &tools, &work)?.pages;
        return Err(glaukopis_core::Error::invalid(tr!("ocr-no-such-page", page = 0, pages = pages)).into());
    };
    Ok(ocr::page_lines(&path, &tools, &work, index)?.into())
}
