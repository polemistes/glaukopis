//! Commands for bringing tables in from files.

use std::path::PathBuf;

use glaukopis_core::import::tables::{self, Sheet};

use crate::error::CommandResult;

/// The tables of a file: the one a file of text holds, or the sheets of a
/// file of sheets.
#[tauri::command(async)]
pub fn table_read(path: PathBuf) -> CommandResult<Vec<Sheet>> {
    Ok(tables::read(&path)?)
}
