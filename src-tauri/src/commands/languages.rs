//! Commands for the languages of spelling and of OCR that are imported
//! (ADR 0032): those there are, those a server offers, importing one from
//! the server or from files, and taking one away. What fetches or writes is
//! done away from the window.

use std::path::PathBuf;

use serde::Serialize;
use tauri::State;

use glaukopis_core::languages::{self, Installed, Kind, Offered};

use crate::error::CommandResult;
use crate::state::AppState;

/// What a server offers, and which server it is.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Offer {
    pub server: String,
    pub packages: Vec<Offered>,
}

/// The server asked of, or the one the settings say, or the project's own.
fn server(state: &AppState, asked: Option<String>) -> String {
    match asked.filter(|s| !s.trim().is_empty()) {
        Some(server) => server.trim().to_owned(),
        None => languages::server(state.setting("languagesServer").as_deref()),
    }
}

/// After languages are imported or taken away: spelling looks for its
/// dictionaries anew, and Tesseract is given its languages anew.
fn changed(state: &AppState, kinds: impl IntoIterator<Item = Kind>) {
    let kinds: Vec<Kind> = kinds.into_iter().collect();
    if kinds.contains(&Kind::Spelling) {
        state.spelling.forget();
    }
    if kinds.contains(&Kind::Ocr) {
        state.discover_tools();
    }
}

/// The languages that are imported.
#[tauri::command(async)]
pub fn languages_installed(state: State<'_, AppState>) -> CommandResult<Vec<Installed>> {
    Ok(state.languages().installed())
}

/// What a server offers: the one asked of, or the one of the settings.
#[tauri::command(async)]
pub fn languages_offered(state: State<'_, AppState>, server: Option<String>) -> CommandResult<Offer> {
    let server = self::server(&state, server);
    let index = languages::index(&server)?;
    Ok(Offer { server, packages: index.packages })
}

/// Fetches a package from the server and imports it.
#[tauri::command(async)]
pub fn languages_install(
    state: State<'_, AppState>,
    server: Option<String>,
    offered: Offered,
) -> CommandResult<Vec<Installed>> {
    let server = self::server(&state, server);
    let bytes = languages::fetch(&server, &offered)?;
    let installed = state.languages().install(&offered, &bytes)?;
    changed(&state, installed.iter().map(|i| i.kind));
    Ok(installed)
}

/// Imports the files chosen: packages, extensions of dictionaries, the
/// files of a dictionary, or data for Tesseract.
#[tauri::command(async)]
pub fn languages_import(state: State<'_, AppState>, paths: Vec<String>) -> CommandResult<Vec<Installed>> {
    let paths: Vec<PathBuf> = paths.into_iter().map(PathBuf::from).collect();
    let installed = state.languages().import_paths(&paths)?;
    changed(&state, installed.iter().map(|i| i.kind));
    Ok(installed)
}

/// Takes away a language that was imported.
#[tauri::command(async)]
pub fn languages_remove(state: State<'_, AppState>, kind: Kind, name: String) -> CommandResult<()> {
    state.languages().remove(kind, &name)?;
    changed(&state, [kind]);
    Ok(())
}
