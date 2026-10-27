//! Mathematics as it is shown where it is written.

use tauri::State;

use glaukopis_core::export::math::{self, Formula, Rendered};

use crate::error::CommandResult;
use crate::state::AppState;

/// Formulas as MathML, in their order.
#[tauri::command(async)]
pub fn math_render(state: State<'_, AppState>, formulas: Vec<Formula>) -> CommandResult<Vec<Rendered>> {
    Ok(math::render(&state.tools(), &formulas)?)
}
