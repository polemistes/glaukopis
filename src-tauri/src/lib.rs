//! The desktop application: a window, and commands that call the core.

mod commands;
#[cfg(test)]
mod contract;
mod error;
mod log;
mod state;

use std::path::PathBuf;

use glaukopis_core::i18n::tr;
use glaukopis_core::paths::{DataDir, default_root};
use tauri::{Emitter, Manager};
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};

/// The variable by which WebKitGTK 2.54 and later are told which compositor
/// to use: `0` for TextureMapper, the one of the releases before, `1` for Skia.
#[cfg(target_os = "linux")]
const COMPOSITOR_SWITCH: &str = "WEBKIT_USE_SKIA_FOR_COMPOSITION";

/// WebKitGTK 2.54 composites the page with Skia, where the releases before
/// used TextureMapper. On some desktops (seen on Hyprland, 2026-10-17) the new
/// compositor shows stale frames while something fades or moves: a menu that
/// opens seems to open, close and open again. Until that is fixed upstream the
/// previous compositor is asked for, before anything of GTK or WebKit starts;
/// one who has set the variable themselves is not overruled (ADR 0049).
/// Returns whether the application set it.
#[cfg(target_os = "linux")]
fn previous_compositor() -> bool {
    if std::env::var_os(COMPOSITOR_SWITCH).is_some() {
        return false;
    }
    // SAFETY: called first of all in `run`, before any thread is started, so
    // nothing reads the environment while it is written.
    unsafe { std::env::set_var(COMPOSITOR_SWITCH, "0") };
    true
}

pub fn run() {
    #[cfg(target_os = "linux")]
    let compositor_asked = previous_compositor();
    let log_file = log::start(&default_root());
    // PDFs are read in a process of their own, this program started anew, so
    // that one a library loses itself in cannot take the machine's memory.
    match std::env::current_exe() {
        Ok(exe) => glaukopis_core::isolated::set_program(exe),
        Err(error) => tracing::warn!(%error, "PDFs are read within the application"),
    }
    #[cfg(target_os = "linux")]
    tracing::info!(
        asked_by_the_application = compositor_asked,
        value = ?std::env::var_os(COMPOSITOR_SWITCH),
        "the compositor of WebKitGTK"
    );

    let built = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(move |app| {
            // Nothing in setup returns an error: Tauri would panic with it, and
            // started from the desktop the program would vanish without a word.
            // What goes wrong is said in a dialog, after which the program ends.
            let failed = |app: &tauri::App, error: &dyn std::fmt::Display| {
                tracing::error!(%error, "the application could not start");
                let mut message = tr!("core-start-failed", error = error.to_string());
                if let Some(log) = &log_file {
                    message = format!("{message}\n\n{}", tr!("core-start-failed-log", log = log));
                }
                say_and_end(app, tr!("core-start-failed-title"), message, MessageDialogKind::Error, 1);
            };
            // What the core tells without being asked (a file set aside while
            // the stores open, say) waits for the page; the page is told when
            // more comes, and takes what waits when it starts.
            let handle = app.handle().clone();
            glaukopis_core::notices::on_told(move || {
                let _ = handle.emit(commands::notices::EVENT, ());
            });
            match opening(default_root(), app.path().resource_dir().ok(), speak_as_chosen) {
                Opening::Ready(state) => {
                    app.manage(*state);
                    // The windows are made only now that what their commands ask
                    // for is there (they are not made by Tauri from the
                    // configuration, where `create` is false): a page that ran
                    // without it had its first command panic on the main thread.
                    if let Err(error) = make_windows(app) {
                        failed(app, &error);
                    }
                }
                Opening::InUse(root) => {
                    // Another is at work in the same data: this one says so, and goes.
                    tracing::warn!("the data directory is in use by another instance; this one ends");
                    say_and_end(
                        app,
                        tr!("core-in-use-title"),
                        tr!("core-in-use", path = &root),
                        MessageDialogKind::Info,
                        0,
                    );
                }
                Opening::Failed(error) => failed(app, &error),
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::system::system_info,
            commands::system::settings_load,
            commands::system::settings_save,
            commands::system::languages,
            commands::system::language_set,
            commands::system::reveal_path,
            commands::system::file_write,
            commands::system::file_read,
            commands::system::zip_read,
            commands::system::zip_write,
            commands::system::log_page,
            commands::notices::notices_take,
            commands::clipboard::clipboard_read,
            commands::library::library_list,
            commands::library::library_refresh,
            commands::library::library_get,
            commands::library::library_get_many,
            commands::library::library_add,
            commands::library::library_update,
            commands::library::library_set_note,
            commands::library::library_add_zotero_keys,
            commands::library::library_remove,
            commands::library::library_source,
            commands::library::library_update_source,
            commands::library::library_draft_source,
            commands::library::library_parse_source,
            commands::library::library_suggest_key,
            commands::library::library_find_matches,
            commands::library::library_duplicates,
            commands::library::library_merge_preview,
            commands::library::library_merge,
            commands::library::library_export,
            commands::library::collection_create,
            commands::library::collection_rename,
            commands::library::collection_move,
            commands::library::collection_delete,
            commands::library::collection_add,
            commands::library::collection_remove,
            commands::library::collection_list,
            commands::library::attachment_add,
            commands::library::attachment_remove,
            commands::library::attachment_remove_all,
            commands::library::attachment_open,
            commands::library::attachment_reveal,
            commands::files::files_list,
            commands::files::files_folder_create,
            commands::files::files_folder_rename,
            commands::files::files_folder_move,
            commands::files::files_folder_delete,
            commands::files::file_move,
            commands::files::file_rename,
            commands::files::files_name_by_reference,
            commands::files::file_remove,
            commands::files::files_left_empty,
            commands::files::files_remove,
            commands::files::files_move,
            commands::files::files_assign,
            commands::files::files_unassign,
            commands::files::file_assign,
            commands::files::file_unassign,
            commands::files::file_path,
            commands::files::files_stop,
            commands::files::files_identify,
            commands::files::files_take_in,
            commands::files::file_small,
            commands::files::file_set_alt,
            commands::files::file_bookmarks_set,
            commands::files::file_for_figure,
            commands::files::file_edit_facts,
            commands::files::file_edit_preview,
            commands::files::file_edit_keep,
            commands::files::file_smaller_copy,
            commands::files::files_add_image,
            commands::files::files_take_in_for_figure,
            commands::files::files_sync,
            commands::files::files_export,
            commands::import::import_bib_file,
            commands::import::import_bib_text,
            commands::import::import_apply,
            commands::sources::lookup_find,
            commands::sources::lookup_acknowledgements,
            commands::sources::import_pdfs,
            commands::sources::import_pdfs_stop,
            commands::sources::zotero_find,
            commands::sources::zotero_inspect,
            commands::sources::zotero_collections,
            commands::sources::import_zotero,
            commands::sources::zotero_done,
            commands::projects::project_list,
            commands::projects::project_create,
            commands::projects::project_rename,
            commands::projects::project_describe,
            commands::projects::project_delete,
            commands::projects::project_trash,
            commands::projects::project_restore,
            commands::projects::project_purge,
            commands::projects::project_copy_from_history,
            commands::projects::project_duplicate,
            commands::projects::project_load,
            commands::projects::project_append,
            commands::projects::project_save_state,
            commands::projects::project_save_view,
            commands::projects::project_sources,
            commands::projects::project_save_sources,
            commands::projectfile::project_file_write,
            commands::projectfile::project_file_read,
            commands::readable::project_readable_write,
            commands::readable::project_readable_read,
            commands::projectfile::project_file_references,
            commands::projectfile::project_file_settle,
            commands::projects::project_history,
            commands::projects::project_history_state,
            commands::projects::folders_list,
            commands::projects::owl_places,
            commands::projects::owl_places_set,
            commands::projects::folder_create,
            commands::projects::folder_rename,
            commands::projects::folder_move,
            commands::projects::folder_delete,
            commands::projects::project_move_to_folder,
            commands::projects::projects_shown,
            commands::history::history_read,
            commands::history::history_room,
            commands::history::history_delete,
            commands::history::history_merge,
            commands::history::history_cut,
            commands::history::history_archive_read,
            commands::math::math_render,
            commands::tables::table_read,
            commands::sharing::sharing_server,
            commands::sharing::sharing_read_invitation,
            commands::sharing::sharing_publish,
            commands::sharing::sharing_join,
            commands::sharing::sharing_ticket,
            commands::sharing::sharing_room,
            commands::sharing::sharing_invite,
            commands::sharing::sharing_withdraw,
            commands::sharing::sharing_remove_member,
            commands::sharing::sharing_rename,
            commands::sharing::sharing_end,
            commands::sharing::sharing_forget,
            commands::documents::tools_info,
            commands::documents::fonts_list,
            commands::documents::styles_list,
            commands::documents::styles_search,
            commands::documents::styles_fetch,
            commands::documents::styles_import,
            commands::documents::styles_read,
            commands::documents::styles_save,
            commands::documents::styles_delete,
            commands::documents::style_sample,
            commands::documents::formats_list,
            commands::documents::formats_get,
            commands::documents::formats_save,
            commands::documents::formats_delete,
            commands::documents::format_kind_looks,
            commands::templates::templates_list,
            commands::templates::templates_get,
            commands::templates::templates_save,
            commands::templates::templates_delete,
            commands::documents::document_preview,
            commands::documents::document_preview_pages,
            commands::documents::document_preview_stop,
            commands::documents::document_export,
            commands::documents::document_export_stop,
            commands::documents::open_path,
            commands::found::found_suggest,
            commands::found::found_propose,
            commands::found::found_draft,
            commands::reading::document_read,
            commands::reading::document_read_stop,
            commands::reading::document_forget,
            commands::ocr::ocr_look,
            commands::ocr::ocr_read,
            commands::ocr::ocr_assemble,
            commands::ocr::ocr_forget,
            commands::ocr::ocr_stop,
            commands::ocr::ocr_pages,
            commands::ocr::ocr_searchable,
            commands::ocr::ocr_text,
            commands::ocr::ocr_picture,
            commands::ocr::ocr_try,
            commands::viewer::file_facts,
            commands::viewer::file_page,
            commands::viewer::file_page_lines,
            commands::viewer::file_keep,
            commands::languages::languages_installed,
            commands::words::words_read,
            commands::words::words_write,
            commands::words::words_own,
            commands::words::words_own_write,
            commands::words::words_own_remove,
            commands::words::words_own_use,
            commands::languages::languages_offered,
            commands::languages::languages_install,
            commands::languages::languages_import,
            commands::languages::languages_remove,
            commands::spelling::spelling_languages,
            commands::spelling::spelling_prepare,
            commands::spelling::spelling_check,
            commands::spelling::spelling_suggest,
            commands::spelling::spelling_words,
            commands::spelling::spelling_add_word,
            commands::spelling::spelling_remove_word,
        ])
        .build(tauri::generate_context!());
    // Before the loop of events runs no dialog can be shown: what failed to
    // be built (the webview's runtime, a plugin) is logged, and the program ends.
    let app = match built {
        Ok(app) => app,
        Err(error) => {
            tracing::error!(%error, "the application could not be built");
            std::process::exit(1);
        }
    };
    app.run(|app, event| match event {
        tauri::RunEvent::WindowEvent { label, event: tauri::WindowEvent::CloseRequested { .. }, .. } => {
            tracing::info!(window = label, "the window is asked to close")
        }
        tauri::RunEvent::WindowEvent { label, event: tauri::WindowEvent::Destroyed, .. } => {
            tracing::info!(window = label, "the window is destroyed")
        }
        tauri::RunEvent::ExitRequested { code, .. } => tracing::info!(?code, "the application is asked to end"),
        tauri::RunEvent::Exit => {
            tracing::info!("the application ends");
            if let Some(state) = app.try_state::<state::AppState>() {
                state.zotero_done();
            }
            // The children that keep files open for the views end with it (ADR 0072).
            glaukopis_core::ocr::server::end_all();
        }
        _ => {}
    });
}

/// What came of opening the data directory, before any window is made.
enum Opening {
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
/// instance holds it.
fn opening(root: PathBuf, resources: Option<PathBuf>, speak: impl FnOnce(Option<&DataDir>)) -> Opening {
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
fn speak_as_chosen(data: Option<&DataDir>) {
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

/// Makes the windows of the configuration, which Tauri is told not to make
/// itself, and watches each. A window is shown only once it is watched, so
/// that the log sees it come on the screen.
fn make_windows(app: &tauri::App) -> tauri::Result<()> {
    // The hooks the e2e scripts reach the page by are there only when the
    // harness asks for them (`shell/testing.ts`), never in a working window.
    let testing = std::env::var_os("GLAUKOPIS_E2E").is_some_and(|v| !v.is_empty());
    for config in &app.config().app.windows {
        let mut builder = tauri::WebviewWindowBuilder::from_config(app.handle(), config)?.visible(false);
        if testing {
            builder = builder.initialization_script("window.__glaukopisTesting = true;");
        }
        let window = builder.build()?;
        watch(&window);
        if config.visible {
            window.show()?;
        } else {
            show_late(&window);
        }
    }
    Ok(())
}

/// A window made hidden is shown by its page, once the page is drawn where the
/// window was left (`App.svelte`, and `main.ts` after a few seconds). One whose
/// page never ran so far, as when its scripts could not be loaded, is shown
/// here all the same after a while: a window that stays hidden cannot even
/// be closed.
fn show_late(window: &tauri::WebviewWindow) {
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

/// Shows a message, and ends the program with `code` when it has been read.
/// There is no window to show it over, and none is needed.
fn say_and_end(app: &tauri::App, title: String, message: String, kind: MessageDialogKind, code: i32) {
    let handle = app.handle().clone();
    app.dialog().message(message).title(title).kind(kind).show(move |_| handle.exit(code));
}

/// Logs what becomes of a window that the log of the run cannot see from
/// the events of Tauri: taken off the screen or put back by the desktop,
/// and the end of the page's own process, with why.
fn watch(window: &tauri::WebviewWindow) {
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
        let first = opening(root.clone(), None, |_| {});
        assert!(matches!(first, Opening::Ready(_)));
        let mut spoken = false;
        match opening(root.clone(), None, |data| spoken = data.is_some()) {
            Opening::InUse(at) => assert_eq!(at, root),
            _ => panic!("the second opening did not find the data in use"),
        }
        assert!(spoken, "the language is chosen before the claim, so that the dialog speaks it");
        drop(first);
        assert!(matches!(opening(root, None, |_| {}), Opening::Ready(_)), "the claim is let go with the state");
    }

    #[test]
    fn data_that_cannot_be_made_is_a_failure_to_say() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().join("a file");
        std::fs::write(&root, "not a directory").unwrap();
        let mut spoken = None;
        let opened = opening(root, None, |data| spoken = Some(data.is_some()));
        assert!(matches!(opened, Opening::Failed(_)));
        assert_eq!(spoken, Some(false), "a failure is said in the language of the system");
    }

    #[test]
    fn a_library_that_cannot_be_read_is_a_failure_to_say() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().join("data");
        let data = DataDir::open(&root).unwrap();
        std::fs::create_dir_all(data.library_file()).unwrap();
        assert!(matches!(opening(root, None, |_| {}), Opening::Failed(_)));
    }

    #[test]
    fn the_windows_are_made_by_the_application_not_by_tauri() {
        let config: serde_json::Value = serde_json::from_str(include_str!("../tauri.conf.json")).unwrap();
        let windows = config["app"]["windows"].as_array().unwrap();
        assert!(!windows.is_empty());
        for window in windows {
            assert_eq!(window["create"], false, "{window}: a page made before the state is managed asks for it");
        }
    }
}
