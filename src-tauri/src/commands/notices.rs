//! What the core has to tell without having been asked: a file of its own
//! that could not be read and was set aside, say (ADR 0052). The page takes
//! it when it starts, and again whenever it hears "notices".

/// The event that tells the page there is something to take.
pub const EVENT: &str = "notices";

/// What has been told and not yet taken, in the language of the interface.
#[tauri::command(async)]
pub fn notices_take() -> Vec<String> {
    glaukopis_core::notices::take()
}
