//! The application: a window, and commands that call the core. On a computer
//! it is the package `glaukopis`; the same sources are the package
//! `glaukopis-phone` (`../src-phone`), built for Android alone, and empty
//! where that package is built for anything else.
#![cfg(not(phone_elsewhere))]
// On a phone only the phone's role is started (`phone.rs`), and what the
// roles of a computer are made of lies unused there. Until the roles are
// each a file of their own (the plan's stage 1), that is allowed.
#![cfg_attr(mobile, allow(dead_code, unused_imports))]

mod commands;
#[cfg(test)]
mod contract;
mod error;
mod log;
#[cfg(mobile)]
mod phone;
mod state;
// The roles: the application on a computer, the window of a note, the phone;
// and what every role starts with.
#[cfg(desktop)]
mod application;
#[cfg(desktop)]
mod note_window;
mod starting;

#[cfg(desktop)]
pub use application::run;
#[cfg(desktop)]
pub use note_window::run as run_note_window;

/// Where Android starts the application: in the role of the phone.
#[cfg(mobile)]
#[tauri::mobile_entry_point]
fn start() {
    phone::run()
}
