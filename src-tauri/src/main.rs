// No console window on Windows in release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Started to read a PDF in a process of its own: that, and nothing else.
    let args: Vec<std::ffi::OsString> = std::env::args_os().collect();
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
    glaukopis_app::run()
}
