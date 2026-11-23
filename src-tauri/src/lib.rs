//! The application: a window, and commands that call the core. On a computer
//! it is the package `glaukopis`; the same sources are the package
//! `glaukopis-phone` (`../src-phone`), built for Android alone, and empty
//! where that package is built for anything else.
#![cfg(not(phone_elsewhere))]

// A role registers the commands its page calls. On a phone the others lie
// unused, and the linker leaves them out (record 0121): that is allowed
// there, and only there. They are not put behind the desktop one by one,
// since the phone's page registers more of them as it grows.
#[cfg_attr(mobile, allow(dead_code))]
mod commands;
#[cfg(test)]
mod contract;
mod door;
mod error;
mod log;
mod phone;
#[cfg_attr(mobile, allow(dead_code))]
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
#[cfg(desktop)]
pub use phone::{asked as phone_asked, run as run_phone};

/// Where Android starts the application: in the role of the phone.
#[cfg(mobile)]
#[tauri::mobile_entry_point]
fn start() {
    phone::run()
}
