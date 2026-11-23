//! The application on a computer: the data folder found (the one the writer
//! chose, a move under way finished first), its windows made once what
//! their commands ask for is there, a second start that opens another
//! window, and every command of the windows. Its first window's page is
//! `App.svelte` (`src/main.ts`).

use std::path::PathBuf;
use std::sync::atomic::Ordering;

use glaukopis_core::i18n::tr;
use glaukopis_core::paths::{self, default_root};
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};

use crate::{commands, log, starting, state};

/// The application on a computer: its windows, and every command of theirs.
pub fn run() {
    #[cfg(target_os = "linux")]
    let compositor_asked = starting::previous_compositor();
    // Where the data is: the folder the writer chose, where a file in the
    // settings place says so, else the usual one (ADR 0084). A move under
    // way is finished first, before anything is open in either folder.
    let place = paths::settings_place();
    let from_environment = paths::data_dir_from_environment();
    let moving = (!from_environment)
        .then(|| paths::location(&place).ok().flatten())
        .flatten()
        .and_then(|location| location.moving_from.map(|from| (from, location.folder)));
    let moved = moving.map(|(from, to)| {
        let finished = paths::finish_move(&place);
        (from, to, finished)
    });
    let root = paths::chosen_root(&place);
    let chosen = !from_environment && matches!(paths::location(&place), Ok(Some(_)));
    // The log is begun in the folder the data is in; a chosen folder that is
    // not there, its disk unplugged, is not made by it, and the log goes to
    // the usual folder.
    let usual = default_root();
    let log_root = root.as_deref().ok().filter(|root| !chosen || root.is_dir()).unwrap_or(usual.as_path());
    let log_file = log::start(log_root);
    match &moved {
        Some((from, to, Ok(_))) => {
            tracing::info!(from = %from.display(), to = %to.display(), "the data folder was moved")
        }
        Some((from, to, Err(error))) => {
            tracing::error!(from = %from.display(), to = %to.display(), %error, "the data folder could not be moved");
            let (from, to, error) = (from.clone(), to.clone(), error.to_string());
            glaukopis_core::notices::tell(move || {
                tr!("core-data-move-failed", from = &from, to = &to, error = error.as_str())
            });
        }
        None => {}
    }
    // PDFs are read in a process of their own, this program started anew, so
    // that one a library loses itself in cannot take the machine's memory.
    match std::env::current_exe() {
        Ok(exe) => glaukopis_core::isolated::set_program(exe),
        Err(error) => tracing::warn!(%error, "PDFs are read within the application"),
    }
    #[cfg(target_os = "linux")]
    starting::say_compositor(compositor_asked);

    // Started again while it runs, Glaukopis opens a new window of the one
    // that runs (ADR 0085), first of the plugins, as the plugin asks. Not
    // where GLAUKOPIS_DATA_DIR says where the data is: the scripts set it,
    // and must never reach a Glaukopis someone works in through the session
    // bus they share; and a portable installation keeps to its folder. There
    // the claim on the folder meets a second start, as it does where the
    // plugin cannot work.
    let builder = tauri::Builder::default();
    #[cfg(desktop)]
    let builder = if paths::data_dir_from_environment() {
        builder
    } else {
        builder.plugin(tauri_plugin_single_instance::init(|app, _arguments, _folder| started_again(app)))
    };
    let built = builder
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(move |app| {
            // Nothing in setup returns an error: Tauri would panic with it, and
            // started from the desktop the program would vanish without a word.
            // What goes wrong is said in a dialog, after which the program ends.
            starting::tell_the_windows(app.handle());
            let start = Start { log: log_file.clone(), resources: app.path().resource_dir().ok() };
            match &root {
                Ok(root) => start.open(app.handle(), root.clone(), chosen),
                Err(error) => start.failed(app.handle(), error),
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::system::system_info,
            commands::system::newer_version,
            commands::system::settings_load,
            commands::system::settings_set,
            commands::system::languages,
            commands::system::language_set,
            commands::system::reveal_path,
            commands::system::file_write,
            commands::system::file_read,
            commands::system::zip_read,
            commands::system::zip_write,
            commands::system::log_page,
            commands::system::data_folder_check,
            commands::system::data_folder_move,
            commands::system::data_folder_use,
            commands::system::app_restart,
            commands::system::window_new,
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
            commands::notebook::notebook_load,
            commands::notebook::notebook_append,
            commands::notebook::notebook_save_state,
            commands::notebook::notebook_take_files,
            commands::notebook::notebook_take_image,
            commands::notebook::notebook_file,
            commands::notebook::notebook_hold,
            commands::notebook::notebook_to_library,
            commands::notebook::notebook_sweep,
            commands::notebook::notebook_readable_write,
            commands::notebook::notebook_inbox_waiting,
            commands::notebook::notebook_inbox_take,
            commands::notebook::firefox_setup,
            commands::notebook::firefox_set_up,
            commands::notebook::firefox_remove,
            commands::notes::notes_look,
            commands::notes::notes_read,
            commands::notes::notes_read_stop,
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
            commands::projects::favourites_list,
            commands::projects::favourite_set,
            commands::history::history_read,
            commands::history::history_room,
            commands::history::history_delete,
            commands::history::history_merge,
            commands::history::history_cut,
            commands::history::history_archive_read,
            commands::math::math_render,
            commands::tables::table_read,
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
            commands::sync::project_apart,
            commands::sync::project_apart_seen,
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
            commands::documents::style_written,
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
            commands::documents::document_print_pages,
            commands::documents::document_preview_stop,
            commands::documents::document_export,
            commands::documents::document_export_stop,
            commands::documents::open_path,
            commands::printing::print_pages,
            commands::printing::print_paper,
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
        .build(starting::context());
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
        tauri::RunEvent::ExitRequested { code, .. } => {
            tracing::info!(?code, "the application is asked to end");
            let restart = app.try_state::<state::AppState>().is_some_and(|s| s.restart.load(Ordering::SeqCst));
            if restart && code.is_none() {
                // The driver of the scripts cannot reach a program it did not
                // start: there the program ends, and says it would have started.
                if std::env::var_os("GLAUKOPIS_E2E").is_some_and(|v| !v.is_empty()) {
                    tracing::info!("the application would start again, but the harness runs it: it ends");
                    return;
                }
                tracing::info!("the application starts again");
                if let Some(state) = app.try_state::<state::AppState>() {
                    state.zotero_done();
                }
                glaukopis_core::ocr::server::end_all();
                app.restart();
            }
        }
        tauri::RunEvent::Exit => {
            tracing::info!("the application ends");
            if let Some(state) = app.try_state::<state::AppState>() {
                state.zotero_done();
            }
            // The children that keep files open for the views end with it (ADR 0072).
            glaukopis_core::ocr::server::end_all();
            // And those that keep the typesetting panes' documents (record 0087).
            glaukopis_core::export::served::end_all();
        }
        _ => {}
    });
}

/// What starting needs, past the data folder: where the log of the run is,
/// and where the resources were installed.
#[derive(Clone)]
struct Start {
    log: Option<PathBuf>,
    resources: Option<PathBuf>,
}

impl Start {
    /// Opens the data folder at `root` and makes the windows; says what went
    /// wrong and ends where it cannot. A folder the writer chose that cannot
    /// be opened, a disk not plugged in, is asked about: the usual folder
    /// for this run, or quit (ADR 0084).
    fn open(&self, app: &AppHandle, root: PathBuf, chosen: bool) {
        match starting::opening(root.clone(), chosen, self.resources.clone(), starting::speak_as_chosen) {
            starting::Opening::Ready(mut state) => {
                state.data_folder_chosen = chosen;
                // The engine that keeps this computer the same as the
                // writer's others (record 0120): made with the stores it
                // shares with the commands, and started once the windows are.
                let sync = commands::sync::engine(app, &state, glaukopis_core::sync::Takes::Everything);
                app.manage(*state);
                app.manage(sync.clone());
                // The windows are made only now that what their commands ask
                // for is there (they are not made by Tauri from the
                // configuration, where `create` is false): a page that ran
                // without it had its first command panic on the main thread.
                if let Err(error) = make_windows(app) {
                    self.failed(app, &error);
                    return;
                }
                // What the plugin for Firefox hands over while the
                // application runs is told to a window as it comes.
                commands::notebook::look_at_the_inbox(app.clone());
                if let Err(error) = sync.run() {
                    tracing::error!(%error, "the thread of the synchronization could not be started");
                }
            }
            // Another is at work in the same data: this one says so, and goes.
            starting::Opening::InUse(root) => starting::in_use(app, &root),
            starting::Opening::Failed(error) if chosen => {
                tracing::error!(%error, root = %root.display(), "the data folder chosen could not be opened");
                let (start, handle) = (self.clone(), app.clone());
                app.dialog()
                    .message(tr!("core-data-cannot-open", path = &root, error = error.to_string()))
                    .title(tr!("core-data-cannot-open-title"))
                    .kind(MessageDialogKind::Warning)
                    .buttons(MessageDialogButtons::OkCancelCustom(tr!("core-data-usual"), tr!("core-data-quit")))
                    .show(move |usual| {
                        if usual {
                            tracing::info!("the usual data folder is used for this run");
                            start.open(&handle, default_root(), false);
                        } else {
                            handle.exit(0);
                        }
                    });
            }
            starting::Opening::Failed(error) => self.failed(app, &error),
        }
    }

    /// Says that the application could not start, and why, and ends it.
    fn failed(&self, app: &AppHandle, error: &dyn std::fmt::Display) {
        starting::failed(app, error, self.log.as_deref());
    }
}

/// Whether a new window's page is put in the web process of a window there
/// is already, on Linux, where every web view is otherwise a process of its
/// own with its own copy of the engine (ADR 0087, decision 3). One line, so
/// that the other way is measured as easily.
#[cfg(target_os = "linux")]
const SHARED_WEB_PROCESS: bool = true;

/// Makes the windows of the configuration, which Tauri is told not to make
/// itself, and watches each. A window is shown only once it is watched, so
/// that the log sees it come on the screen.
fn make_windows(app: &AppHandle) -> tauri::Result<()> {
    for config in &app.config().app.windows {
        let window = window_builder(app, config, None)?.build()?;
        starting::watch(&window);
        if config.visible {
            window.show()?;
        } else {
            starting::show_late(&window);
        }
    }
    Ok(())
}

/// A window as the configuration says, hidden until its page shows it.
/// A window made after the first is told so, and where to go (`open`, a
/// route of the page, or the start screen), by a script run before the page.
fn window_builder<'a>(
    app: &'a AppHandle,
    config: &tauri::utils::config::WindowConfig,
    made: Option<&serde_json::Value>,
) -> tauri::Result<tauri::WebviewWindowBuilder<'a, tauri::Wry, AppHandle>> {
    let mut builder = tauri::WebviewWindowBuilder::from_config(app, config)?.visible(false);
    if starting::testing() {
        builder = builder.initialization_script("window.__glaukopisTesting = true;");
    }
    if let Some(made) = made {
        builder = builder.initialization_script(format!("window.__glaukopisWindow = {made};"));
    }
    Ok(builder)
}

/// Makes a new window (ADR 0085), like the first, with the start screen or
/// the place `open` names, and the list of projects as `list` says (shown or
/// not, and how wide, as in the window it came from; as the settings say
/// where nothing is said), beside `beside` and a little down and to the
/// right of it. On Linux its page goes in the web process of a window there
/// is already, where `SHARED_WEB_PROCESS` says so.
pub(crate) fn make_window(
    app: &AppHandle,
    open: Option<String>,
    list: Option<serde_json::Value>,
    beside: Option<&tauri::WebviewWindow>,
) -> tauri::Result<tauri::WebviewWindow> {
    let made = serde_json::json!({ "open": open, "list": list });
    let count = app.state::<state::AppState>().windows.fetch_add(1, Ordering::SeqCst);
    let mut config = app.config().app.windows.first().cloned().ok_or(tauri::Error::WindowNotFound)?;
    config.label = format!("window-{count}");
    let place = beside.and_then(|beside| {
        let position = beside.outer_position().ok()?;
        let scale = beside.scale_factor().ok()?;
        Some(position.to_logical::<f64>(scale))
    });
    #[cfg(target_os = "linux")]
    let shared = SHARED_WEB_PROCESS.then(|| app.webview_windows().into_values().next()).flatten();
    #[cfg(not(target_os = "linux"))]
    let shared: Option<tauri::WebviewWindow> = None;
    let is_shared = shared.is_some();
    let window = match shared {
        #[cfg(target_os = "linux")]
        Some(first) => {
            // The view of the first is had on the main thread, and cannot be
            // sent from it: the new window is built there.
            let (sent, received) = std::sync::mpsc::channel();
            let (app, config, made) = (app.clone(), config.clone(), made.clone());
            first.with_webview(move |platform| {
                let built = window_builder(&app, &config, Some(&made))
                    .and_then(|builder| placed(builder, place).with_related_view(platform.inner()).build());
                let _ = sent.send(built);
            })?;
            received.recv().map_err(|_| tauri::Error::WindowNotFound)??
        }
        _ => placed(window_builder(app, &config, Some(&made))?, place).build()?,
    };
    tracing::info!(window = window.label(), shared_web_process = is_shared, "a new window");
    starting::watch(&window);
    starting::show_late(&window);
    Ok(window)
}

/// Glaukopis was started again while it runs: a new window of this one,
/// beside the window that has the focus, or the first. Its page brings it to
/// the front once it is shown. Made on a thread of its own, since the new
/// window is built on the main thread, where this is called.
fn started_again(app: &AppHandle) {
    tracing::info!("Glaukopis was started again: a new window of the one that runs");
    if app.try_state::<state::AppState>().is_none() {
        tracing::info!("the one that runs has no window yet: nothing is made");
        return;
    }
    let app = app.clone();
    std::thread::spawn(move || {
        let windows = app.webview_windows();
        let beside = windows
            .values()
            .find(|w| w.is_focused().unwrap_or(false))
            .or_else(|| windows.get("main"))
            .or_else(|| windows.values().next());
        if let Err(error) = make_window(&app, None, None, beside) {
            tracing::error!(%error, "no new window was made for the second start");
        }
    });
}

/// A new window down and to the right of the window it came from.
fn placed(
    builder: tauri::WebviewWindowBuilder<'_, tauri::Wry, AppHandle>,
    place: Option<tauri::LogicalPosition<f64>>,
) -> tauri::WebviewWindowBuilder<'_, tauri::Wry, AppHandle> {
    match place {
        Some(place) => builder.position(place.x + 40.0, place.y + 40.0),
        None => builder,
    }
}

#[cfg(test)]
mod tests {
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
