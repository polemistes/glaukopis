//! Reads a document from a file, as the application does when one is brought in.
//!
//!     cargo run -p glaukopis-core --example read -- <file> <library> [work directory] [keys]
//!
//! What was read is written as JSON, as the interface gets it. The library
//! is a directory of its own choosing; the pictures of the document are
//! taken into its files. The keys, with commas between them, are those that the
//! library is taken to have: a citation by tags that are all among them
//! becomes a citation, of references that are called as their keys.

use std::path::{Path, PathBuf};
use std::sync::atomic::AtomicBool;

use glaukopis_core::export::tools;
use glaukopis_core::import::document;
use glaukopis_core::library::Library;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().skip(1).collect();
    if args.len() < 2 {
        eprintln!("usage: read <file> <library> [work directory] [keys]");
        std::process::exit(2);
    }
    let work = args.get(2).map(PathBuf::from).unwrap_or_else(|| std::env::temp_dir().join("glaukopis-read"));
    let found = tools::discover(&tools::Configured::default());
    let pictures = std::sync::Mutex::new(Library::open_at(Path::new(&args[1]))?);
    // Without keys there is no library: every citation is found, and stands as the text it was written as.
    let has: Vec<&str> = args.get(3).map(|keys| keys.split(',').map(str::trim).collect()).unwrap_or_default();
    let keys = |key: &str| -> Option<String> { has.contains(&key).then(|| key.to_owned()) };
    let read = document::read(Path::new(&args[0]), &found, &pictures, &work, &keys, &AtomicBool::new(false))?;
    println!("{}", serde_json::to_string_pretty(&read)?);
    Ok(())
}
