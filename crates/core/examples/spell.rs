//! Checks words, and says what the misspelt ones may be, as the application
//! does; and how long each thing took.
//!
//!     cargo run --release -p glaukopis-core --example spell -- <language> <word>...
//!
//! The dictionaries are those that come with the application and those of
//! the system. The language is that of a map: `en`, `en-GB`, `nb`, `nn`.

use std::path::Path;
use std::time::Instant;

use glaukopis_core::spelling::{Place, Source, Spelling, found};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let Some((language, words)) = args.split_first() else {
        eprintln!("usage: spell <language> <word>...");
        std::process::exit(2);
    };
    let resources = std::env::var_os("GLAUKOPIS_RESOURCES")
        .map(Into::into)
        .unwrap_or_else(|| Path::new(env!("CARGO_MANIFEST_DIR")).join("../../resources"));
    let mut places = vec![Place::new(resources.join("dictionaries"), Source::Application)];
    places.extend(found::system_dirs().into_iter().map(|dir| Place::new(dir, Source::System)));
    let words_dir = std::env::temp_dir().join("glaukopis-spell-words");
    let spelling = Spelling::new(places, words_dir);

    let started = Instant::now();
    let Some(checking) = spelling.prepare(Some(language))? else {
        println!("There is no dictionary for {language}.");
        return Ok(());
    };
    let names: Vec<&str> = checking.dictionaries.iter().map(|d| d.name.as_str()).collect();
    println!("{} read in {} ms; script {:?}", names.join(" and "), started.elapsed().as_millis(), checking.script);

    let started = Instant::now();
    let right = spelling.check(Some(language), words)?;
    let each = started.elapsed().as_secs_f64() * 1e6 / words.len().max(1) as f64;
    println!("{} words checked, {each:.1} µs each", words.len());
    for (word, right) in words.iter().zip(right) {
        if right {
            println!("  {word}: right");
        } else {
            let started = Instant::now();
            let suggestions = spelling.suggest(Some(language), word)?;
            println!("  {word}: wrong ({} ms): {}", started.elapsed().as_millis(), suggestions.join(", "));
        }
    }
    Ok(())
}
