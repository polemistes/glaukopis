//! Commands for bringing tables in from files.

use std::path::PathBuf;

use glaukopis_core::import::tables::{self, Sheet};

use crate::error::CommandResult;

/// The tables of a file: the one a file of text holds, or the sheets of a
/// file of sheets. Of a file that was dropped it is not sure that it holds
/// a table, and text is then read more strictly.
#[tauri::command(async)]
pub fn table_read(path: PathBuf, dropped: Option<bool>) -> CommandResult<Vec<Sheet>> {
    Ok(if dropped.unwrap_or(false) { tables::read_unsure(&path)? } else { tables::read(&path)? })
}
