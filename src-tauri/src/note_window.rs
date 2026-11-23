//! The window of a note (record 0109): the application in another role,
//! `glaukopis --note`, one small window to write a note in and nothing else.

use glaukopis_core::notebook::note_window::{self, NoteWindow};
use glaukopis_core::paths::{self, DataDir};
use tauri::AppHandle;

use crate::{commands, starting};

/// The label of the window of a note: the page mounts the small component
/// of that window, and nothing of the application, in a window so labelled
/// (`src/main.ts`); and the window is allowed what it does by it
/// (`capabilities/note-window.json`).
const NOTE_WINDOW: &str = "note";

/// The application in another role (record 0109): one small window to write
/// a note in, whose words go into the notebook's inbox when they are sent,
/// and nothing else of the application. Beside the application and never
/// through it: no part in the single instance, so that it opens while
/// Glaukopis runs and a second one opens a second window; the data folder
/// found as `run` finds it, with nothing moved, made or claimed; the
/// settings read and never written; only the commands the window needs.
pub fn run() {
    #[cfg(target_os = "linux")]
    let compositor_asked = starting::previous_compositor();
    // The log goes to the standard error, and into no file: the
    // application, which may be running, writes its own, and the folder of
    // the logs keeps the last runs of the application, not of its windows.
    let filter = tracing_subscriber::EnvFilter::try_from_env("GLAUKOPIS_LOG").unwrap_or_else(|_| "info".into());
    let _ = tracing_subscriber::fmt().with_env_filter(filter).with_writer(std::io::stderr).try_init();
    #[cfg(target_os = "linux")]
    starting::say_compositor(compositor_asked);
    let window = match note_window::data_root(&paths::settings_place()) {
        Ok(root) => {
            tracing::info!(data = %root.display(), "the window of a note");
            let data = DataDir::at(root);
            starting::speak_as_chosen(Some(&data));
            Ok(NoteWindow::new(data))
        }
        Err(error) => {
            starting::speak_as_chosen(None);
            tracing::error!(%error, "the data folder of the window of a note is not there");
            Err(error.to_string())
        }
    };
    let built = tauri::Builder::default()
        .manage(commands::notewindow::NoteWindowState(window))
        .setup(|app| {
            // As in `run`, nothing in setup returns an error, lest Tauri panic with it.
            if let Err(error) = make_note_window(app.handle()) {
                tracing::error!(%error, "the window of a note could not be made");
                app.handle().exit(1);
            }
            Ok(())
        })
        // The system's dialog, to choose the files added to the note.
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::notewindow::note_window_start,
            commands::notewindow::note_window_keep,
            commands::notewindow::note_window_send,
            commands::notewindow::note_window_add_files,
            commands::notewindow::note_window_add_bytes,
            commands::notewindow::note_window_file_path,
            // The fonts of this computer, for the list of fonts in the head of rich text (ADR 0113).
            commands::documents::fonts_list,
            commands::system::languages,
            commands::system::log_page,
            commands::system::file_read,
            commands::clipboard::clipboard_read,
        ])
        .build(starting::context());
    let app = match built {
        Ok(app) => app,
        Err(error) => {
            tracing::error!(%error, "the window of a note could not be built");
            std::process::exit(1);
        }
    };
    // The process ends with its one window, sent or closed.
    app.run(|_, event| match event {
        tauri::RunEvent::WindowEvent { label, event: tauri::WindowEvent::CloseRequested { .. }, .. } => {
            tracing::info!(window = label, "the window is asked to close")
        }
        tauri::RunEvent::Exit => tracing::info!("the window of a note ends"),
        _ => {}
    });
}

/// Makes the window of a note, about 480 by 320 and resizable, hidden
/// until its page has its words and its look and shows it (`show_late`
/// shows it all the same after a while). Its title is the page's, in the
/// language of the settings. Files dropped on it come to the page by their
/// paths, as they come to the application's windows. The hooks of the e2e
/// scripts are there only where the harness runs it, as in `window_builder`.
fn make_note_window(app: &AppHandle) -> tauri::Result<()> {
    let mut builder = tauri::WebviewWindowBuilder::new(app, NOTE_WINDOW, tauri::WebviewUrl::default())
        .title("Glaukopis")
        .inner_size(480.0, 320.0)
        .min_inner_size(280.0, 160.0)
        .resizable(true)
        .visible(false);
    if starting::testing() {
        builder = builder.initialization_script("window.__glaukopisTesting = true;");
    }
    let window = builder.build()?;
    starting::watch(&window);
    starting::show_late(&window);
    Ok(())
}
