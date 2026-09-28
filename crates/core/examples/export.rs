//! Makes a document from a request, as the application does.
//!
//!     cargo run -p glaukopis-core --example export -- <request.json> <target> <output> [work directory]
//!
//! The request is what the interface sends: `{ "document": …, "style": …, "format": …, "key": … }`.
//! The target is one of pdf, docx, odt, latex, markdown, html, typst.

use std::path::{Path, PathBuf};

use glaukopis_core::export::{self, Context, ExportOptions, Request, Target, tools};
use glaukopis_core::styles::Styles;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().skip(1).collect();
    if args.len() < 3 {
        eprintln!("usage: export <request.json> <target> <output> [work directory]");
        std::process::exit(2);
    }
    let mut request: Request = serde_json::from_str(&std::fs::read_to_string(&args[0])?)?;
    request.format.sanitise();
    let target: Target = serde_json::from_value(serde_json::Value::String(args[1].clone()))?;
    let work = args.get(3).map(PathBuf::from).unwrap_or_else(|| std::env::temp_dir().join("glaukopis-export"));
    let resources = std::env::var_os("GLAUKOPIS_RESOURCES")
        .map(PathBuf::from)
        .unwrap_or_else(|| Path::new(env!("CARGO_MANIFEST_DIR")).join("../../resources"));
    let found = tools::discover(&tools::Configured::default());
    let styles = Styles::new(&resources, &work.join("styles"));
    // Where the projects are, for the files of figures.
    let projects = std::env::var_os("GLAUKOPIS_PROJECTS").map(PathBuf::from);
    let ctx = Context {
        tools: &found,
        resources: &resources,
        styles: &styles,
        library: None,
        work: work.clone(),
        fonts: &[],
        projects: projects.as_deref(),
    };
    let done = export::export(&ctx, &request, target, Path::new(&args[2]), &ExportOptions::default())?;
    println!("{}", done.path);
    for w in done.warnings {
        eprintln!("warning: {w}");
    }
    Ok(())
}
