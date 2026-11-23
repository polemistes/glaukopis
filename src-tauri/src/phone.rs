//! The application on a phone (`docs/plans/an-app-for-android.md`, stage 1):
//! the same core and the same page, in a role of their own, as the window
//! of a note is one. On Android it is what the app starts; on a computer it
//! is `glaukopis --phone`, the same role in a window as narrow as a phone,
//! for trying it, in no launcher and not in the guide.
//!
//! The data folder is made, claimed and read as the application's is, into
//! the same state, which the engine of the synchronization shares, told
//! that this device takes the notes alone. On Android the folder is
//! `files/data` in the app's own, which no other app reads, the log of the
//! run with it, since a phone has no terminal; on a computer it is never
//! the application's own (`paths::phone_root`).
//!
//! Until the page of the phone is built (stage 2) the window shows the page
//! of a note: one field to write in, kept on disk until it is sent into the
//! notebook's inbox.

#[cfg(desktop)]
use std::ffi::OsString;
use std::path::PathBuf;

use tauri::{AppHandle, Manager};

use glaukopis_core::notebook::note_window::NoteWindow;
use glaukopis_core::paths::DataDir;
use glaukopis_core::sync::Takes;

use crate::{commands, starting};

/// The label of the phone's window, by which the page knows it is the
/// phone's (`src/lib/phone/label.ts`) and is allowed what it does
/// (`capabilities/phone.json`, on a computer and on Android). Not the label
/// of the window of a note: that window may close itself, and the phone's
/// must not, since a window that cannot close is how the page knows it
/// stays.
const WINDOW: &str = "phone";

/// The argument by which the application on a computer is the phone.
#[cfg(desktop)]
pub const FLAG: &str = "--phone";

/// Whether the application is asked to be the phone: `--phone` among its
/// arguments, wherever it stands.
#[cfg(desktop)]
pub fn asked(args: &[OsString]) -> bool {
    args.iter().skip(1).any(|a| a == FLAG)
}

pub fn run() {
    #[cfg(target_os = "linux")]
    let compositor_asked = starting::previous_compositor();
    // On a computer the folder is known before anything of Tauri is built,
    // and the application's own is refused: this role is for trying, and
    // never works in the writer's real data.
    #[cfg(desktop)]
    let root: Option<PathBuf> = match glaukopis_core::paths::phone_root() {
        Ok(root) => Some(root),
        Err(error) => {
            eprintln!("glaukopis {FLAG}: {error}");
            std::process::exit(2);
        }
    };
    #[cfg(mobile)]
    let root: Option<PathBuf> = None;
    let built = tauri::Builder::default()
        .setup(move |app| {
            // As in the application, nothing in setup returns an error, lest Tauri panic with it.
            let root = match root.clone().map(Ok).unwrap_or_else(|| own_folder(app.handle())) {
                Ok(root) => root,
                Err(error) => {
                    eprintln!("Glaukopis on a phone has no folder for its data: {error}");
                    app.handle().exit(1);
                    return Ok(());
                }
            };
            let log = crate::log::start(&root);
            #[cfg(target_os = "linux")]
            starting::say_compositor(compositor_asked);
            tracing::info!(data = %root.display(), "Glaukopis on a phone");
            starting::tell_the_windows(app.handle());
            match starting::opening(root.clone(), false, None, starting::speak_as_chosen) {
                starting::Opening::Ready(state) => {
                    // The engine, which can join a home only from the page of
                    // stage 2: until then it is in none, and asks nothing of anyone.
                    let sync = commands::sync::engine(app.handle(), &state, Takes::Notes);
                    app.manage(*state);
                    app.manage(sync.clone());
                    // The page of a note, of the same folder: it claims
                    // nothing, and the state beside it holds the claim.
                    app.manage(commands::notewindow::NoteWindowState(Ok(NoteWindow::new(DataDir::at(root)))));
                    if let Err(error) = make_window(app.handle()) {
                        starting::failed(app.handle(), &error, log.as_deref());
                        return Ok(());
                    }
                    if let Err(error) = sync.run() {
                        tracing::error!(%error, "the thread of the synchronization could not be started");
                    }
                }
                starting::Opening::InUse(root) => starting::in_use(app.handle(), &root),
                starting::Opening::Failed(error) => starting::failed(app.handle(), &error, log.as_deref()),
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
            commands::sync::sync_status,
            commands::sync::sync_computer,
            commands::sync::sync_start,
            commands::sync::sync_join,
            commands::sync::sync_home,
            commands::sync::sync_code,
            commands::sync::sync_rename,
            commands::sync::sync_remove,
            commands::sync::sync_stop,
            commands::sync::sync_now,
        ])
        .build(starting::context());
    match built {
        Ok(app) => app.run(|_, event| {
            if let tauri::RunEvent::Exit = event {
                tracing::info!("Glaukopis on a phone ends")
            }
        }),
        Err(error) => {
            eprintln!("Glaukopis on a phone could not be built: {error}");
            tracing::error!(%error, "Glaukopis on a phone could not be built");
        }
    }
}

/// The data folder in the app's own folder on Android: `files/data`, so that
/// the web view and the system keep theirs beside it.
fn own_folder(app: &AppHandle) -> Result<PathBuf, String> {
    app.path().app_data_dir().map(|own| own.join("files").join("data")).map_err(|e| e.to_string())
}

/// Makes the phone's window. On a computer it is as narrow as a phone, made
/// hidden and shown by its page as every window there is; on Android a
/// window has no measures to set.
fn make_window(app: &AppHandle) -> tauri::Result<()> {
    let builder = tauri::WebviewWindowBuilder::new(app, WINDOW, tauri::WebviewUrl::default());
    #[cfg(desktop)]
    {
        let mut builder = builder
            .title("Glaukopis")
            .inner_size(412.0, 915.0)
            .min_inner_size(320.0, 480.0)
            .resizable(true)
            .visible(false);
        if starting::testing() {
            builder = builder.initialization_script("window.__glaukopisTesting = true;");
        }
        let window = builder.build()?;
        starting::watch(&window);
        starting::show_late(&window);
    }
    #[cfg(mobile)]
    builder.build()?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn capability(text: &str) -> (Vec<String>, Vec<String>) {
        let value: serde_json::Value = serde_json::from_str(text).unwrap();
        let strings = |key: &str| -> Vec<String> {
            value[key].as_array().unwrap().iter().map(|v| v.as_str().unwrap().to_owned()).collect()
        };
        (strings("windows"), strings("permissions"))
    }

    #[test]
    fn the_phones_window_may_not_close_itself_on_a_computer_or_on_a_phone() {
        let (computer_windows, computer) = capability(include_str!("../capabilities/phone.json"));
        let (phone_windows, phone) = capability(include_str!("../../src-phone/capabilities/phone.json"));
        assert_eq!(computer_windows, vec![WINDOW.to_owned()]);
        assert_eq!(phone_windows, vec![WINDOW.to_owned()]);
        for permission in computer.iter().chain(&phone) {
            assert!(!permission.contains("close") && !permission.contains("destroy"), "{permission}");
        }
        let mut expected = phone.clone();
        expected.push("core:window:allow-show".to_owned());
        assert_eq!(computer, expected, "the computer's has the phone's and leave to show the window, nothing more");
    }

    #[test]
    fn the_phone_is_asked_for_by_its_argument_wherever_it_stands() {
        let args = |list: &[&str]| list.iter().map(OsString::from).collect::<Vec<_>>();
        assert!(asked(&args(&["glaukopis", "--phone"])));
        assert!(asked(&args(&["glaukopis", "-psn_0_1", "--phone"])));
        assert!(!asked(&args(&["glaukopis"])));
        assert!(!asked(&args(&["--phone"])), "the program's own name is not an argument");
    }
}
