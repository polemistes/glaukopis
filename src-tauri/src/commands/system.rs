use serde::Serialize;
use tauri::State;

use crate::error::CommandResult;
use crate::state::AppState;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemInfo {
    pub version: &'static str,
    pub data_dir: String,
    pub platform: &'static str,
}

#[tauri::command]
pub fn system_info(state: State<'_, AppState>) -> CommandResult<SystemInfo> {
    Ok(SystemInfo {
        version: env!("CARGO_PKG_VERSION"),
        data_dir: state.data.root().display().to_string(),
        platform: std::env::consts::OS,
    })
}

#[tauri::command]
pub fn settings_load(state: State<'_, AppState>) -> CommandResult<serde_json::Map<String, serde_json::Value>> {
    Ok(glaukopis_core::settings::load(&state.data.settings_file())?)
}

#[tauri::command]
pub fn settings_save(
    state: State<'_, AppState>,
    settings: serde_json::Map<String, serde_json::Value>,
) -> CommandResult<()> {
    Ok(glaukopis_core::settings::save(&state.data.settings_file(), &settings)?)
}
