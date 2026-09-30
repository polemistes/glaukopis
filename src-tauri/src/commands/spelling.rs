//! Commands for spelling: the dictionaries there are, the checking of words,
//! what a misspelt word may be, and the writer's own words. What reads a
//! dictionary, or goes through one, is done away from the window.

use std::collections::BTreeMap;

use tauri::State;

use glaukopis_core::spelling::{Checking, Found};

use crate::error::CommandResult;
use crate::state::AppState;

/// The dictionaries there are, looked for anew.
#[tauri::command(async)]
pub fn spelling_languages(state: State<'_, AppState>) -> CommandResult<Vec<Found>> {
    Ok(state.spelling.languages())
}

/// How a text in the language is checked, with its dictionaries read now if
/// they were not. Nothing, where there is no dictionary for it.
#[tauri::command(async)]
pub fn spelling_prepare(state: State<'_, AppState>, language: Option<String>) -> CommandResult<Option<Checking>> {
    Ok(state.spelling.prepare(language.as_deref())?)
}

/// For each word, whether it is right in the language.
#[tauri::command(async)]
pub fn spelling_check(
    state: State<'_, AppState>,
    language: Option<String>,
    words: Vec<String>,
) -> CommandResult<Vec<bool>> {
    Ok(state.spelling.check(language.as_deref(), &words)?)
}

/// What a misspelt word may be, the likeliest first.
#[tauri::command(async)]
pub fn spelling_suggest(
    state: State<'_, AppState>,
    language: Option<String>,
    word: String,
) -> CommandResult<Vec<String>> {
    Ok(state.spelling.suggest(language.as_deref(), &word)?)
}

/// The writer's own words, by language (`en`, `nb`).
#[tauri::command]
pub fn spelling_words(state: State<'_, AppState>) -> CommandResult<BTreeMap<String, Vec<String>>> {
    Ok(state.spelling.own_words())
}

/// Adds a word to the writer's own, for the language of a text.
#[tauri::command(async)]
pub fn spelling_add_word(state: State<'_, AppState>, language: Option<String>, word: String) -> CommandResult<()> {
    Ok(state.spelling.add_word(language.as_deref(), &word)?)
}

/// Takes a word away from the writer's own words of a language (`en`).
#[tauri::command(async)]
pub fn spelling_remove_word(state: State<'_, AppState>, language: String, word: String) -> CommandResult<()> {
    Ok(state.spelling.remove_word(&language, &word)?)
}
