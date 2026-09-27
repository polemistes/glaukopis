//! Writes the pattern documents for a format, for looking at them.
//!
//!     cargo run -p glaukopis-core --example pattern -- <format.json> <directory>

use std::path::Path;

use glaukopis_core::export::{reference, tools};
use glaukopis_core::formats::DocumentFormat;
use glaukopis_core::formats::typst::Particulars;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut args = std::env::args().skip(1);
    let (Some(format), Some(dir)) = (args.next(), args.next()) else {
        eprintln!("usage: pattern <format.json> <directory>");
        std::process::exit(2);
    };
    let mut format: DocumentFormat = serde_json::from_str(&std::fs::read_to_string(format)?)?;
    format.sanitise();
    let found = tools::discover(&tools::Configured::default());
    let pandoc = found.pandoc()?;
    let particulars =
        Particulars { title: "A title".into(), authors: vec!["An author".into()], language: Some("en-GB".into()) };
    let dir = Path::new(&dir);
    std::fs::create_dir_all(dir)?;
    for (name, make) in [
        (
            "reference.docx",
            reference::docx as fn(&[u8], &DocumentFormat, &Particulars) -> glaukopis_core::Result<Vec<u8>>,
        ),
        ("reference.odt", reference::odt),
    ] {
        let default = tools::run(&pandoc.path, "Pandoc", ["--print-default-data-file", name], None, None)?.stdout;
        std::fs::write(dir.join(name), make(&default, &format, &particulars)?)?;
        println!("{}", dir.join(name).display());
    }
    Ok(())
}
