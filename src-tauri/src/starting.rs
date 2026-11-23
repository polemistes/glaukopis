//! What every role of the application starts with (the application on a
//! computer, the window of a note, the phone): the configuration and the
//! built interface, the data folder opened and claimed, the language the
//! core speaks, what is told to the windows, what is said where starting
//! fails, and on Linux the compositor of WebKitGTK.

use std::path::{Path, PathBuf};

use glaukopis_core::i18n::tr;
use glaukopis_core::paths::DataDir;
use tauri::{AppHandle, Emitter};
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};

use crate::{commands, state};

/// The variable by which WebKitGTK 2.54 and later are told which compositor
/// to use: `0` for TextureMapper, the one of the releases before, `1` for Skia.
#[cfg(target_os = "linux")]
pub(crate) const COMPOSITOR_SWITCH: &str = "WEBKIT_USE_SKIA_FOR_COMPOSITION";

/// WebKitGTK 2.54 composites the page with Skia, where the releases before
/// used TextureMapper. On some desktops (seen on Hyprland, 2026-10-17) the new
/// compositor shows stale frames while something fades or moves: a menu that
/// opens seems to open, close and open again. Until that is fixed upstream the
/// previous compositor is asked for, before anything of GTK or WebKit starts;
/// one who has set the variable themselves is not overruled (ADR 0049).
/// Returns whether the application set it.
#[cfg(target_os = "linux")]
pub(crate) fn previous_compositor() -> bool {
    if std::env::var_os(COMPOSITOR_SWITCH).is_some() {
        return false;
    }
    // SAFETY: called first of all in a role's `run`, before any thread is started, so
    // nothing reads the environment while it is written.
    unsafe { std::env::set_var(COMPOSITOR_SWITCH, "0") };
    true
}

/// Writes into the log which compositor WebKitGTK was asked for, and
/// whether it was the application that asked: the line every role on Linux
/// writes once, at its start.
#[cfg(target_os = "linux")]
pub(crate) fn say_compositor(asked: bool) {
    tracing::info!(
        asked_by_the_application = asked,
        value = ?std::env::var_os(COMPOSITOR_SWITCH),
        "the compositor of WebKitGTK"
    );
}

/// What the configuration and the built interface make of the
/// application: made in one place, for whichever role it starts in, since
/// each making of it carries a copy of the interface.
pub(crate) fn context() -> tauri::Context {
    tauri::generate_context!()
}

/// What came of opening the data directory, before any window is made.
pub(crate) enum Opening {
    /// Claimed and read: what the commands work with.
    Ready(Box<state::AppState>),
    /// Another instance is at work in it, at this place.
    InUse(PathBuf),
    /// It could not be made, claimed or read.
    Failed(glaukopis_core::Error),
}

/// Opens the data directory at `root`, has the core speak as `speak` says
/// (given the directory where it could be opened), claims it, and reads the
/// library and the stores. Nothing of it is read past the claim when another
/// instance holds it. A folder the writer `chosen` must be there: one that
/// is not, a disk not plugged in, is not made anew and empty.
pub(crate) fn opening(
    root: PathBuf,
    chosen: bool,
    resources: Option<PathBuf>,
    speak: impl FnOnce(Option<&DataDir>),
) -> Opening {
    if chosen && !root.is_dir() {
        speak(None);
        // The dialog names the folder; the error says only what is wrong with it.
        let missing = std::io::Error::from(std::io::ErrorKind::NotFound);
        return Opening::Failed(glaukopis_core::Error::invalid(missing.to_string()));
    }
    let data = match DataDir::open(root) {
        Ok(data) => data,
        Err(error) => {
            speak(None);
            return Opening::Failed(error);
        }
    };
    speak(Some(&data));
    tracing::info!(data = %data.root().display(), "data directory");
    let claim = match data.claim() {
        Ok(Some(claim)) => claim,
        Ok(None) => return Opening::InUse(data.root().to_owned()),
        Err(error) => return Opening::Failed(error),
    };
    match state::AppState::open(data, claim, resources) {
        Ok(state) => Opening::Ready(Box::new(state)),
        Err(error) => Opening::Failed(error),
    }
}

/// The core speaks the language of the interface from the start: the one
/// chosen in the settings, or that of the system; with the words the writer
/// has changed, where there are any (ADR 0035). Without a data directory, in
/// that of the system, which is what a failure to start is said in.
pub(crate) fn speak_as_chosen(data: Option<&DataDir>) {
    let chosen = data
        .and_then(|data| glaukopis_core::settings::load(&data.settings_file()).ok())
        .and_then(|settings| glaukopis_core::settings::string(&settings, "language"))
        .filter(|language| language != "system");
    glaukopis_core::i18n::set_language(&chosen.unwrap_or_else(glaukopis_core::i18n::system_tag));
    tracing::info!(language = glaukopis_core::i18n::language(), "language of the interface");
    if let Some(data) = data {
        let left_out = glaukopis_core::i18n::use_own_words(&data.words());
        if !left_out.is_empty() {
            tracing::warn!(count = left_out.len(), "own words that do not fit are left out");
        }
    }
}

/// Whether the harness runs the application: the hooks the e2e scripts
/// reach the page by are there only then (`shell/testing.ts`), never in a
/// working window.
#[cfg(desktop)]
pub(crate) fn testing() -> bool {
    std::env::var_os("GLAUKOPIS_E2E").is_some_and(|v| !v.is_empty())
}

/// What every role tells its windows of what happens outside them: what the
/// core tells without being asked (a file set aside while the stores open,
/// say), which waits for the page, and the page is told when more comes; and
/// what changed on disk, which every window reads again (ADR 0085), and
/// which the engine of the synchronization sends to the writer's other
/// devices (record 0120).
pub(crate) fn tell_the_windows(app: &AppHandle) {
    let handle = app.clone();
    glaukopis_core::notices::on_told(move || {
        let _ = handle.emit(commands::notices::EVENT, ());
    });
    let handle = app.clone();
    glaukopis_core::changes::on_changed(move |area| {
        let _ = handle.emit("changed", area);
        commands::sync::touched(&handle);
    });
}

/// Says that the application could not start, and why, with where the log
/// of the run is where there is one, and ends it.
pub(crate) fn failed(app: &AppHandle, error: &dyn std::fmt::Display, log: Option<&Path>) {
    tracing::error!(%error, "the application could not start");
    let mut message = tr!("core-start-failed", error = error.to_string());
    if let Some(log) = log {
        message = format!("{message}\n\n{}", tr!("core-start-failed-log", log = log));
    }
    say_and_end(app, tr!("core-start-failed-title"), message, MessageDialogKind::Error, 1);
}

/// Says that another is at work in the same data, at `root`, and ends this one.
pub(crate) fn in_use(app: &AppHandle, root: &Path) {
    tracing::warn!("the data directory is in use by another instance; this one ends");
    say_and_end(app, tr!("core-in-use-title"), tr!("core-in-use", path = root), MessageDialogKind::Info, 0);
}

/// Shows a message, and ends the program with `code` when it has been read.
/// There is no window to show it over, and none is needed.
pub(crate) fn say_and_end(app: &AppHandle, title: String, message: String, kind: MessageDialogKind, code: i32) {
    let handle = app.clone();
    app.dialog().message(message).title(title).kind(kind).show(move |_| handle.exit(code));
}

/// A window made hidden is shown by its page, once the page is drawn where the
/// window was left (`App.svelte`, and `main.ts` after a few seconds). One whose
/// page never ran so far, as when its scripts could not be loaded, is shown
/// here all the same after a while: a window that stays hidden cannot even
/// be closed.
#[cfg(desktop)]
pub(crate) fn show_late(window: &tauri::WebviewWindow) {
    let window = window.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_secs(10));
        if window.is_visible().unwrap_or(true) {
            return;
        }
        tracing::warn!(window = window.label(), "the page did not show its window: it is shown now");
        if let Err(error) = window.show() {
            tracing::error!(%error, "the window could not be shown");
        }
    });
}

/// Logs what becomes of a window that the log of the run cannot see from
/// the events of Tauri: taken off the screen or put back by the desktop,
/// and the end of the page's own process, with why.
#[cfg(desktop)]
pub(crate) fn watch(window: &tauri::WebviewWindow) {
    #[cfg(target_os = "linux")]
    {
        use gtk::prelude::WidgetExt;
        use webkit2gtk::WebViewExt;
        let label = window.label().to_owned();
        if let Ok(gtk) = window.gtk_window() {
            let shown = label.clone();
            gtk.connect_map(move |_| tracing::info!(window = shown, "the window is on the screen"));
            let hidden = label.clone();
            gtk.connect_unmap(move |_| tracing::warn!(window = hidden, "the window is taken off the screen"));
        }
        let page = label.clone();
        let _ = window.with_webview(move |webview| {
            let page = page.clone();
            webview.inner().connect_web_process_terminated(move |_, reason| {
                tracing::error!(window = page, ?reason, "the page's own process ended")
            });
        });
    }
    #[cfg(not(target_os = "linux"))]
    let _ = window;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_second_opening_of_the_same_data_finds_it_in_use_and_reads_nothing() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().join("data");
        let first = opening(root.clone(), false, None, |_| {});
        assert!(matches!(first, Opening::Ready(_)));
        let mut spoken = false;
        match opening(root.clone(), false, None, |data| spoken = data.is_some()) {
            Opening::InUse(at) => assert_eq!(at, root),
            _ => panic!("the second opening did not find the data in use"),
        }
        assert!(spoken, "the language is chosen before the claim, so that the dialog speaks it");
        drop(first);
        assert!(matches!(opening(root, false, None, |_| {}), Opening::Ready(_)), "the claim is let go with the state");
    }

    #[test]
    fn data_that_cannot_be_made_is_a_failure_to_say() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().join("a file");
        std::fs::write(&root, "not a directory").unwrap();
        let mut spoken = None;
        let opened = opening(root, false, None, |data| spoken = Some(data.is_some()));
        assert!(matches!(opened, Opening::Failed(_)));
        assert_eq!(spoken, Some(false), "a failure is said in the language of the system");
    }

    #[test]
    fn a_library_that_cannot_be_read_is_a_failure_to_say() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().join("data");
        let data = DataDir::open(&root).unwrap();
        std::fs::create_dir_all(data.library_file()).unwrap();
        assert!(matches!(opening(root, false, None, |_| {}), Opening::Failed(_)));
    }

    #[test]
    fn a_chosen_folder_that_is_not_there_is_not_made_anew() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().join("unplugged").join("glaukopis");
        assert!(matches!(opening(root.clone(), true, None, |_| {}), Opening::Failed(_)));
        assert!(!root.exists(), "an empty folder in its place would be taken for the data");
        assert!(matches!(opening(root, false, None, |_| {}), Opening::Ready(_)), "the usual folder is made");
    }
}
