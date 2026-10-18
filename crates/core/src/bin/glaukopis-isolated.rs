//! The program the tests of `isolated.rs` start as a child. The application
//! does the same with its own program, before anything else.

fn main() {
    let args: Vec<std::ffi::OsString> = std::env::args_os().collect();
    std::process::exit(glaukopis_core::isolated::serve(&args).unwrap_or(2));
}
