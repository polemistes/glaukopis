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
//! Its page is the phone's own (`src/lib/phone/`): the notes, a note, the
//! settings. It registers the commands that page calls and no others; a
//! test below holds the list.

#[cfg(desktop)]
use std::ffi::OsString;
use std::path::PathBuf;

use tauri::{AppHandle, Manager};

use crate::{commands, door, starting};

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

/// The argument, after `--phone`, by which the application makes one round
/// of the door and ends (`door.rs`).
#[cfg(desktop)]
pub const ROUND: &str = "--round";

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
    // `--round`: the door's round, as Android makes it with the app closed,
    // for trying; nothing of Tauri is built, and the program ends with 0
    // for done and 1 for to be tried again.
    #[cfg(desktop)]
    if let Some(root) = &root
        && std::env::args_os().skip(1).any(|a| a == ROUND)
    {
        std::process::exit(door::FOLDER.round(root, "").code());
    }
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
            // What a round with the app closed opened in this process is
            // taken over as it is (`door.rs`); else the folder is opened, and
            // the engine made, told this device takes the notes alone.
            let opening = || starting::opening(root.clone(), false, None, starting::speak_as_chosen);
            match door::FOLDER.for_role(opening) {
                door::Given::Ready(state, sync, windows) => {
                    let _ = windows.set(app.handle().clone());
                    app.manage(*state);
                    app.manage(sync.clone());
                    if let Err(error) = make_window(app.handle()) {
                        starting::failed(app.handle(), &error, log.as_deref());
                        return Ok(());
                    }
                    if let Err(error) = sync.run() {
                        tracing::error!(%error, "the thread of the synchronization could not be started");
                    }
                }
                door::Given::InUse(root) => starting::in_use(app.handle(), &root),
                door::Given::Failed(error) => starting::failed(app.handle(), &error, log.as_deref()),
            }
            Ok(())
        })
        // The system's picker, to choose the files added to the note.
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            // Of the system.
            commands::system::system_info,
            commands::system::languages,
            commands::system::language_set,
            commands::system::log_page,
            commands::system::file_read,
            commands::system::settings_load,
            commands::system::settings_set,
            commands::notices::notices_take,
            commands::clipboard::clipboard_read,
            // Of the notebook: no sweep on a phone (stage 2, part A), no readable copy.
            commands::notebook::notebook_load,
            commands::notebook::notebook_append,
            commands::notebook::notebook_save_state,
            commands::notebook::notebook_take_image,
            commands::notebook::notebook_file,
            commands::notebook::notebook_hold,
            commands::notebook::notebook_say_held,
            commands::notebook::notebook_inbox_waiting,
            commands::notebook::notebook_inbox_take,
            // A file the page holds, taken in piece by piece; the application's page has paths instead.
            commands::notebook::notebook_take_piece,
            commands::notebook::notebook_take_whole,
            commands::notebook::notebook_take_dropped,
            // Of the files a note shows.
            commands::files::file_path,
            commands::files::file_small,
            // Of the references, for the line that says a source.
            commands::library::library_list,
            commands::library::library_refresh,
            // Of the server, looked at before a home is started or joined.
            commands::sharing::sharing_server,
            // Of the synchronization.
            commands::sync::sync_status,
            commands::sync::sync_device,
            commands::sync::sync_start,
            commands::sync::sync_join,
            commands::sync::sync_home,
            commands::sync::sync_code,
            commands::sync::sync_rename,
            commands::sync::sync_remove,
            commands::sync::sync_stop,
            commands::sync::sync_now,
            commands::sync::sync_front,
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

    /// The commands registered for the phone, read from this file's source.
    fn registered() -> Vec<String> {
        let source = include_str!("phone.rs");
        let start = source.find("generate_handler![").unwrap();
        let end = start + source[start..].find("])").unwrap();
        source[start..end]
            .lines()
            .filter_map(|line| line.trim().strip_prefix("commands::"))
            .map(|path| path.trim_end_matches(',').rsplit("::").next().unwrap().to_owned())
            .collect()
    }

    #[test]
    fn the_phone_registers_the_commands_of_its_page_and_no_others() {
        let mut have = registered();
        have.sort();
        let mut want: Vec<String> = [
            "system_info",
            "languages",
            "language_set",
            "log_page",
            "file_read",
            "settings_load",
            "settings_set",
            "notices_take",
            "clipboard_read",
            "notebook_load",
            "notebook_append",
            "notebook_save_state",
            "notebook_take_image",
            "notebook_file",
            "notebook_hold",
            "notebook_say_held",
            "notebook_inbox_waiting",
            "notebook_inbox_take",
            "notebook_take_piece",
            "notebook_take_whole",
            "notebook_take_dropped",
            "file_path",
            "file_small",
            "library_list",
            "library_refresh",
            "sharing_server",
            "sync_status",
            "sync_device",
            "sync_start",
            "sync_join",
            "sync_home",
            "sync_code",
            "sync_rename",
            "sync_remove",
            "sync_stop",
            "sync_now",
            "sync_front",
        ]
        .map(str::to_owned)
        .to_vec();
        want.sort();
        assert_eq!(have, want);
        for refused in ["notebook_sweep", "notebook_readable_write", "notebook_take_files", "notebook_to_library"] {
            assert!(!have.iter().any(|c| c == refused), "{refused} is not the phone's");
        }
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
