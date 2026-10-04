//! The desktop application: a window, and commands that call the core.

mod commands;
#[cfg(test)]
mod contract;
mod error;
mod state;

use glaukopis_core::i18n::tr;
use glaukopis_core::paths::DataDir;
use tauri::Manager;
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};

pub fn run() {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::try_from_env("GLAUKOPIS_LOG").unwrap_or_else(|_| "info".into()))
        .with_writer(std::io::stderr)
        .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let data = DataDir::open_default()?;
            // The core speaks the language of the interface from the start: the
            // one chosen in the settings, or that of the system.
            let chosen = glaukopis_core::settings::load(&data.settings_file())
                .ok()
                .and_then(|settings| glaukopis_core::settings::string(&settings, "language"))
                .filter(|language| language != "system");
            glaukopis_core::i18n::set_language(&chosen.unwrap_or_else(glaukopis_core::i18n::system_tag));
            tracing::info!(language = glaukopis_core::i18n::language(), "language of the interface");
            tracing::info!(data = %data.root().display(), "data directory");

            let Some(claim) = data.claim()? else {
                // Another is at work in the same data: this one says so, and goes.
                tracing::warn!("the data directory is in use by another instance; this one ends");
                for window in app.webview_windows().values() {
                    let _ = window.hide();
                }
                let handle = app.handle().clone();
                app.dialog()
                    .message(tr!("core-in-use", path = data.root()))
                    .title(tr!("core-in-use-title"))
                    .kind(MessageDialogKind::Info)
                    .show(move |_| handle.exit(0));
                return Ok(());
            };
            let state = state::AppState::open(data, claim, app.path().resource_dir().ok())?;
            app.manage(state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::system::system_info,
            commands::system::settings_load,
            commands::system::settings_save,
            commands::system::languages,
            commands::system::language_set,
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
            commands::library::attachment_open,
            commands::library::attachment_reveal,
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
            commands::projects::project_history,
            commands::projects::project_history_state,
            commands::history::history_read,
            commands::history::history_room,
            commands::history::history_delete,
            commands::history::history_merge,
            commands::history::history_cut,
            commands::history::history_archive_read,
            commands::pictures::picture_list,
            commands::pictures::picture_get,
            commands::pictures::picture_add_file,
            commands::pictures::picture_add,
            commands::pictures::picture_read,
            commands::pictures::picture_update,
            commands::pictures::picture_remove,
            commands::pictures::picture_sync,
            commands::pictures::math_render,
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
            commands::ocr::ocr_stop,
            commands::ocr::ocr_searchable,
            commands::ocr::ocr_picture,
            commands::spelling::spelling_languages,
            commands::spelling::spelling_prepare,
            commands::spelling::spelling_check,
            commands::spelling::spelling_suggest,
            commands::spelling::spelling_words,
            commands::spelling::spelling_add_word,
            commands::spelling::spelling_remove_word,
        ])
        .run(tauri::generate_context!())
        .expect("the application could not start");
}
