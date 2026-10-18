// No console window on Windows in release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Started to read a PDF in a process of its own: that, and nothing else.
    let args: Vec<std::ffi::OsString> = std::env::args_os().collect();
    if let Some(code) = glaukopis_core::isolated::serve(&args) {
        std::process::exit(code);
    }
    glaukopis_app::run()
}
