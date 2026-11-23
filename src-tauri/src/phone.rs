//! The application on a phone (`docs/plans/an-app-for-android.md`): the
//! same core and the same page, in a role of their own, as the window of a
//! note is one.
//!
//! For now it is the trial of that plan's first stage, and what it shows is
//! the window of a note (record 0109): one field to write in, kept on disk
//! until it is sent, and sent into the notebook's inbox. It answers whether
//! the core and the shell build for Android, whether the page starts in the
//! phone's web view, and how the editor of the texts behaves under a
//! phone's keyboard. The page of the phone itself comes after it.
//!
//! The data are in the app's own folder, which no other app reads
//! (`files/data` in it). The log of the run is there too (`logs`), since a
//! phone has no terminal.

use tauri::Manager;

use glaukopis_core::notebook::note_window::NoteWindow;
use glaukopis_core::paths::DataDir;

use crate::commands;

/// The label of the phone's window. For the trial it is the label of the
/// window of a note, by which the page mounts that window's component
/// (`src/main.ts`) and is allowed what it does (`capabilities/phone.json`).
const WINDOW: &str = "note";

pub fn run() {
    let built = tauri::Builder::default()
        .setup(|app| {
            // As in `run`, nothing in setup returns an error, lest Tauri panic with it.
            // A folder of its own within the app's: the web view and the
            // system keep theirs beside it.
            let window = match app.path().app_data_dir().map(|own| own.join("files").join("data")) {
                Ok(root) => {
                    crate::log::start(&root);
                    tracing::info!(data = %root.display(), "Glaukopis on a phone");
                    match DataDir::open(root) {
                        Ok(data) => {
                            crate::starting::speak_as_chosen(Some(&data));
                            Ok(NoteWindow::new(data))
                        }
                        Err(error) => {
                            tracing::error!(%error, "the data folder could not be opened");
                            Err(error.to_string())
                        }
                    }
                }
                Err(error) => Err(error.to_string()),
            };
            app.manage(commands::notewindow::NoteWindowState(window));
            let made = tauri::WebviewWindowBuilder::new(app.handle(), WINDOW, tauri::WebviewUrl::default()).build();
            if let Err(error) = made {
                tracing::error!(%error, "the window of the phone could not be made");
            }
            Ok(())
        })
        // The system's picker, to choose the files added to the note.
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::notewindow::note_window_start,
            commands::notewindow::note_window_keep,
            commands::notewindow::note_window_send,
            commands::notewindow::note_window_add_files,
            commands::notewindow::note_window_add_bytes,
            commands::notewindow::note_window_file_path,
            commands::documents::fonts_list,
            commands::system::languages,
            commands::system::log_page,
            commands::system::file_read,
            commands::clipboard::clipboard_read,
        ])
        .build(crate::starting::context());
    match built {
        Ok(app) => app.run(|_, event| {
            if let tauri::RunEvent::Exit = event {
                tracing::info!("Glaukopis on a phone ends")
            }
        }),
        Err(error) => tracing::error!(%error, "Glaukopis on a phone could not be built"),
    }
}
