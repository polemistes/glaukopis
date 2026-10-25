use std::io::{Read, Write};
use std::path::Path;

use serde::{Deserialize, Serialize};
use tauri::ipc::{Request, Response};
use tauri::{AppHandle, State};
use tauri_plugin_opener::OpenerExt;

use glaukopis_core::error::{Error, IoContext};
use glaukopis_core::{i18n, tr};

use crate::error::{CommandError, CommandResult};
use crate::state::AppState;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemInfo {
    pub version: &'static str,
    pub data_dir: String,
    /// The folder of the logs of the last runs (`log.rs`).
    pub logs: String,
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
        logs: state.data.root().join(crate::log::DIR).display().to_string(),
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

/// The settings, as the page reads them at the start: a damaged file is set
/// aside, and the page is told so, to say it (`settings::load_or_set_aside`).
#[tauri::command]
pub fn settings_load(state: State<'_, AppState>) -> CommandResult<glaukopis_core::settings::Loaded> {
    Ok(glaukopis_core::settings::load_or_set_aside(&state.data.settings_file())?)
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
        interface: i18n::interface().iter().map(|&(tag, name)| Language { tag, name }).collect(),
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

/// Shows a file or a folder anywhere on this computer in the file manager:
/// what was exported, say. A file of the library is shown by
/// `attachment_reveal`, which takes its stored path.
#[tauri::command(async)]
pub fn reveal_path(app: AppHandle, path: String) -> CommandResult<()> {
    app.opener()
        .reveal_item_in_dir(std::path::Path::new(&path))
        .map_err(|e| CommandError { kind: "open", message: e.to_string() })
}

/// Where bytes the page has made are written: a path the user chose.
#[derive(Deserialize)]
struct WriteHead {
    path: String,
}

/// Writes bytes the page has made, a picture of the diagram, to a path the
/// user chose, as `with_head` reads them: never half a file, and what went
/// wrong said.
#[tauri::command(async)]
pub fn file_write(request: Request<'_>) -> CommandResult<()> {
    let (head, bytes) = super::projects::with_head::<WriteHead>(&request)?;
    Ok(glaukopis_core::fsutil::write_atomic(std::path::Path::new(&head.path), &bytes)?)
}

/// The most a file read for the page may hold: as much as a document brought in.
const MOST_READ: u64 = 50 * 1024 * 1024;

/// The most a zip archive read for the page may hold, and each text in it.
const MOST_ARCHIVE: u64 = 200 * 1024 * 1024;
const MOST_ENTRY: u64 = 50 * 1024 * 1024;

/// Reads at most `most` bytes from `from`, saying of `path` that it is too large where there are more.
fn read_bounded(from: impl Read, most: u64, path: &Path) -> glaukopis_core::Result<Vec<u8>> {
    let mut bytes = Vec::new();
    from.take(most + 1).read_to_end(&mut bytes).context(|| tr!("io-reading", path = path))?;
    if bytes.len() as u64 > most {
        return Err(Error::invalid(tr!("io-too-large", path = path, most = most / (1024 * 1024))));
    }
    Ok(bytes)
}

/// Reads a file the user chose, for the page to read: a mind map, say. No
/// more than 50 MB of it, and what went wrong said.
#[tauri::command(async)]
pub fn file_read(path: String) -> CommandResult<Response> {
    let path = Path::new(&path);
    let file = std::fs::File::open(path).context(|| tr!("io-opening", path = path))?;
    Ok(Response::new(read_bounded(file, MOST_READ, path)?))
}

/// A text kept in a zip archive, by its name there.
#[derive(Serialize, Deserialize)]
pub struct ZipEntry {
    pub name: String,
    pub text: String,
}

/// Whether an entry of an archive is a text the page reads: JSON or XML.
fn is_text_entry(name: &str) -> bool {
    let name = name.to_ascii_lowercase();
    name.ends_with(".json") || name.ends_with(".xml")
}

/// Reads the texts of a zip archive the user chose, the JSON and the XML
/// in it, for the page to read: an XMind file. The rest, pictures say, is
/// not read. No more than 200 MB of archive, and 50 MB of each text.
#[tauri::command(async)]
pub fn zip_read(path: String) -> CommandResult<Vec<ZipEntry>> {
    let path = Path::new(&path);
    let file = std::fs::File::open(path).context(|| tr!("io-opening", path = path))?;
    let size = file.metadata().context(|| tr!("io-reading", path = path))?.len();
    if size > MOST_ARCHIVE {
        return Err(Error::invalid(tr!("io-too-large", path = path, most = MOST_ARCHIVE / (1024 * 1024))).into());
    }
    let not_one =
        |e: zip::result::ZipError| Error::invalid(tr!("io-not-an-archive", path = path, error = e.to_string()));
    let mut archive = zip::ZipArchive::new(std::io::BufReader::new(file)).map_err(not_one)?;
    let mut entries = Vec::new();
    for i in 0..archive.len() {
        let entry = archive.by_index(i).map_err(not_one)?;
        if !entry.is_file() || !is_text_entry(entry.name()) {
            continue;
        }
        let name = entry.name().to_owned();
        let bytes = read_bounded(entry, MOST_ENTRY, &path.join(&name))?;
        entries.push(ZipEntry { name, text: String::from_utf8_lossy(&bytes).into_owned() });
    }
    Ok(entries)
}

/// Writes texts the page has made as a zip archive at a path the user
/// chose, each packed: an XMind file. Never half a file.
#[tauri::command(async)]
pub fn zip_write(path: String, entries: Vec<ZipEntry>) -> CommandResult<()> {
    let path = Path::new(&path);
    let failed = |e: zip::result::ZipError| Error::invalid(format!("{}: {e}", tr!("io-writing", path = path)));
    let mut zip = zip::ZipWriter::new(std::io::Cursor::new(Vec::new()));
    let packed = zip::write::SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);
    for entry in &entries {
        zip.start_file(entry.name.as_str(), packed).map_err(failed)?;
        zip.write_all(entry.text.as_bytes()).context(|| tr!("io-writing", path = path))?;
    }
    let bytes = zip.finish().map_err(failed)?.into_inner();
    Ok(glaukopis_core::fsutil::write_atomic(path, &bytes)?)
}

/// What went wrong in the page, for the log of the run: a warning or an
/// error the page wrote to its console, an error that was not caught, or a
/// promise that failed with no one to hear it. The page sends a few a
/// second at most (`shell/page-log.ts`); a line is cut at 4000 characters.
#[tauri::command(async)]
pub fn log_page(level: String, message: String) {
    let message: String = message.chars().take(4000).collect();
    if level == "error" {
        tracing::error!(target: "page", "{message}");
    } else {
        tracing::warn!(target: "page", "{message}");
    }
}
