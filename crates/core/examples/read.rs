//! Reads a document from a file, as the application does when one is brought in.
//!
//!     cargo run -p glaukopis-core --example read -- <file> <store of pictures> [work directory]
//!
//! What was read is written as JSON, as the interface gets it. The store of
//! pictures is a directory of its own choosing; the pictures of the document
//! are taken into it.

use std::path::{Path, PathBuf};
use std::sync::atomic::AtomicBool;

use glaukopis_core::export::tools;
use glaukopis_core::import::document;
use glaukopis_core::pictures::Pictures;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().skip(1).collect();
    if args.len() < 2 {
        eprintln!("usage: read <file> <store of pictures> [work directory]");
        std::process::exit(2);
    }
    let work = args.get(2).map(PathBuf::from).unwrap_or_else(|| std::env::temp_dir().join("glaukopis-read"));
    let found = tools::discover(&tools::Configured::default());
    let pictures = Pictures::open(Path::new(&args[1]))?;
    // No library: every citation stays the text it was written as.
    let keys = |_: &str| -> Option<String> { None };
    let read = document::read(Path::new(&args[0]), &found, &pictures, &work, &keys, &AtomicBool::new(false))?;
    println!("{}", serde_json::to_string_pretty(&read)?);
    Ok(())
}
