use serde::Serialize;
use tauri::State;

use glaukopis_core::i18n;

use crate::error::CommandResult;
use crate::state::AppState;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemInfo {
    pub version: &'static str,
    pub data_dir: String,
    pub platform: &'static str,
    /// The name the system gives the user: the history of a project names
    /// them so where they have not given a name of their own.
    pub user: String,
}

#[tauri::command(async)]
pub fn system_info(state: State<'_, AppState>) -> CommandResult<SystemInfo> {
    Ok(SystemInfo {
        version: env!("CARGO_PKG_VERSION"),
        data_dir: state.data.root().display().to_string(),
        platform: std::env::consts::OS,
        user: user_name(),
    })
}

/// The user's full name where the system keeps one, and their login otherwise.
fn user_name() -> String {
    let login = std::env::var("USER").or_else(|_| std::env::var("USERNAME")).unwrap_or_default();
    #[cfg(unix)]
    if let Ok(passwd) = std::fs::read_to_string("/etc/passwd") {
        let full = passwd
            .lines()
            .map(|line| line.split(':').collect::<Vec<_>>())
            .find(|fields| fields.first() == Some(&login.as_str()))
            .and_then(|fields| fields.get(4).map(|gecos| gecos.split(',').next().unwrap_or("").trim().to_owned()))
            .filter(|name| !name.is_empty());
        if let Some(full) = full {
            return full;
        }
    }
    login
}

#[tauri::command]
pub fn settings_load(state: State<'_, AppState>) -> CommandResult<serde_json::Map<String, serde_json::Value>> {
    Ok(glaukopis_core::settings::load(&state.data.settings_file())?)
}

#[tauri::command(async)]
pub fn settings_save(
    state: State<'_, AppState>,
    settings: serde_json::Map<String, serde_json::Value>,
) -> CommandResult<()> {
    Ok(glaukopis_core::settings::save(&state.data.settings_file(), &settings)?)
}

/// A language the interface is in: its tag, and its name in itself.
#[derive(Serialize)]
pub struct Language {
    pub tag: &'static str,
    pub name: &'static str,
}

/// The languages of the application, and what the system says (ADR 0020).
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Languages {
    /// What the system says its language is: `nb-NO`.
    pub system: String,
    /// The languages the interface is in.
    pub interface: Vec<Language>,
    /// The language the interface has when none is chosen.
    pub interface_default: &'static str,
    /// The languages documents have words of their own in.
    pub texts: Vec<&'static str>,
    /// The language new texts are given when none is chosen.
    pub text_default: String,
}

#[tauri::command]
pub fn languages() -> Languages {
    let system = i18n::system_tag();
    Languages {
        interface: i18n::INTERFACE.iter().map(|&(tag, name)| Language { tag, name }).collect(),
        interface_default: i18n::interface_language(&system),
        texts: i18n::text_languages(),
        text_default: i18n::text_language(&system),
        system,
    }
}

/// Sets the language the core speaks in, which is that of the interface.
#[tauri::command]
pub fn language_set(tag: String) {
    i18n::set_language(&tag);
}
