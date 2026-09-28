//! Takes the words of the core into the program when it is built: the Fluent
//! files under `locales/` whose names begin with `core`, for what the core
//! says, and `document.ftl`, for what documents print (ADR 0020). The files
//! of the interface are read by the interface.

use std::fmt::Write as _;
use std::fs;
use std::path::{Path, PathBuf};

fn main() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../locales");
    // A directory is watched as a whole: a file that is added is seen.
    println!("cargo:rerun-if-changed={}", root.display());

    let mut languages: Vec<PathBuf> = fs::read_dir(&root)
        .map(|entries| entries.flatten().map(|e| e.path()).filter(|p| p.is_dir()).collect())
        .unwrap_or_default();
    languages.sort();

    let mut out = String::from(
        "/// The Fluent files of the core: the language, the name of the file, and\n\
         /// what it holds.\n\
         pub static FILES: &[(&str, &str, &str)] = &[\n",
    );
    for language in languages {
        let tag = language.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
        let mut files: Vec<PathBuf> =
            fs::read_dir(&language).map(|entries| entries.flatten().map(|e| e.path()).collect()).unwrap_or_default();
        files.retain(|p| {
            let name = p.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
            name.ends_with(".ftl") && (name.starts_with("core") || name == "document.ftl")
        });
        files.sort();
        for file in files {
            let name = file.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
            let path = file.canonicalize().unwrap_or(file);
            writeln!(out, "    ({tag:?}, {name:?}, include_str!({path:?})),").unwrap();
        }
    }
    out.push_str("];\n");

    let target = Path::new(&std::env::var("OUT_DIR").expect("cargo sets OUT_DIR")).join("locales.rs");
    fs::write(target, out).expect("the list of Fluent files could not be written");
}
