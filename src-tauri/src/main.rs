// No console window on Windows in release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Started to read a PDF in a process of its own: that, and nothing else.
    let args: Vec<std::ffi::OsString> = std::env::args_os().collect();
    // Started by Firefox as the helper of the plugin of the notebook, with
    // the path of its manifest: that, and nothing else, before anything of
    // the application starts.
    if let Some(code) = glaukopis_core::notebook::host::serve(&args) {
        std::process::exit(code);
    }
    if args.get(1).is_some_and(|a| a == glaukopis_core::isolated::FLAG) {
        // What the child says in the log, such as a page it could not read,
        // goes where the application reads it and writes it into its own.
        let _ = tracing_subscriber::fmt()
            .with_writer(std::io::stderr)
            .with_max_level(tracing::Level::WARN)
            .with_ansi(false)
            .without_time()
            .try_init();
    }
    if let Some(code) = glaukopis_core::isolated::serve(&args) {
        std::process::exit(code);
    }
    // Started to write a note in a window of its own (`--note`): that
    // window, and nothing else of the application.
    if glaukopis_core::notebook::note_window::asked(&args) {
        glaukopis_app::run_note_window();
        return;
    }
    // Started as the phone, for trying it on a computer (`--phone`): that
    // role, in a window as narrow as a phone, and nothing else.
    if glaukopis_app::phone_asked(&args) {
        glaukopis_app::run_phone();
        return;
    }
    glaukopis_app::run()
}
