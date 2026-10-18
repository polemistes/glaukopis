//! Writing files so that a crash never leaves half a file.

use std::fs::{self, File};
use std::io::Write;
use std::path::Path;

use crate::error::{Error, IoContext, Result};
use crate::tr;

/// Writes `bytes` to `path` by way of a temporary file in the same directory,
/// flushed to disk and then renamed over the target.
pub fn write_atomic(path: &Path, bytes: &[u8]) -> Result<()> {
    let dir = path.parent().ok_or_else(|| Error::invalid(tr!("io-no-directory", path = path)))?;
    fs::create_dir_all(dir).context(|| tr!("io-creating", path = dir))?;

    let mut tmp = tempfile::Builder::new()
        .prefix(".tmp-")
        .tempfile_in(dir)
        .context(|| tr!("io-creating-temporary-in", path = dir))?;
    tmp.write_all(bytes).context(|| tr!("io-writing", path = path))?;
    tmp.as_file().sync_all().context(|| tr!("io-flushing", path = path))?;
    tmp.persist(path).map_err(|e| Error::io(tr!("io-replacing", path = path), e.error))?;

    // Make the rename itself durable.
    #[cfg(unix)]
    if let Ok(d) = File::open(dir) {
        let _ = d.sync_all();
    }
    #[cfg(not(unix))]
    let _ = File::open(dir);
    Ok(())
}

/// As `write_atomic`, keeping the previous version beside it as `<name>.bak`.
pub fn write_atomic_with_backup(path: &Path, bytes: &[u8]) -> Result<()> {
    if path.exists() {
        let mut name = path.file_name().unwrap_or_default().to_os_string();
        name.push(".bak");
        let backup = path.with_file_name(name);
        fs::copy(path, &backup).context(|| tr!("io-backing-up", path = path))?;
    }
    write_atomic(path, bytes)
}

/// Turns a title into something safe to use as a file name on every
/// platform: cleaned as [`clean_file_name`] cleans it, and cut to 120
/// characters, with the dots and spaces of the end of the cut taken off as
/// well, which Windows would drop and so name the file otherwise than it is
/// recorded. The page proposes names by the same rule
/// (src/lib/util/file-name.ts).
pub fn safe_file_name(name: &str, fallback: &str) -> String {
    let cut: String = clean_file_name(name).chars().take(120).collect();
    let cut = cut.trim_matches(|c: char| c == '.' || c == ' ');
    if cut.is_empty() { fallback.to_owned() } else { not_a_device(cut) }
}

/// The stem of a name Windows keeps for a device, in any case and whatever
/// follows it after a dot: "con.docx" and "Aux. notes.docx" are no files
/// there. The superscript digits are reserved as well.
fn device_stem(name: &str) -> Option<&str> {
    let stem = name.split('.').next().unwrap_or(name).trim_end();
    let lower = stem.to_lowercase();
    let numbered = |of: &str| {
        lower.strip_prefix(of).is_some_and(|n| {
            let mut n = n.chars();
            matches!((n.next(), n.next()), (Some('1'..='9' | '¹' | '²' | '³'), None))
        })
    };
    (matches!(lower.as_str(), "con" | "prn" | "aux" | "nul") || numbered("com") || numbered("lpt")).then_some(stem)
}

/// A name that is not a device of Windows: one that is has an underscore
/// after its stem, `Nul_.pdf`, as the page has it.
fn not_a_device(name: &str) -> String {
    match device_stem(name) {
        Some(stem) => format!("{stem}_{}", &name[stem.len()..]),
        None => name.to_owned(),
    }
}

/// A name with what no platform takes in a file name made spaces, the
/// spaces made single, dots and spaces taken off its ends, and a name
/// Windows keeps for a device given an underscore; as long as it was, for
/// those that cut it in their own way. It may be empty.
pub fn clean_file_name(name: &str) -> String {
    let mut out = String::with_capacity(name.len());
    for c in name.chars() {
        match c {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' | '\0' => out.push(' '),
            c if c.is_control() => out.push(' '),
            c => out.push(c),
        }
    }
    let collapsed = out.split_whitespace().collect::<Vec<_>>().join(" ");
    not_a_device(collapsed.trim_matches(|c: char| c == '.' || c == ' '))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn atomic_write_replaces_and_backs_up() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("a").join("file.txt");
        write_atomic_with_backup(&path, b"one").unwrap();
        write_atomic_with_backup(&path, b"two").unwrap();
        assert_eq!(fs::read_to_string(&path).unwrap(), "two");
        assert_eq!(fs::read_to_string(path.with_file_name("file.txt.bak")).unwrap(), "one");
        let leftovers: Vec<_> = fs::read_dir(path.parent().unwrap())
            .unwrap()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_name().to_string_lossy().starts_with(".tmp-"))
            .collect();
        assert!(leftovers.is_empty());
    }

    #[test]
    fn file_names() {
        assert_eq!(safe_file_name("Iliad: a \"reading\"?", "x"), "Iliad a reading");
        assert_eq!(safe_file_name("  ...  ", "untitled"), "untitled");
        assert_eq!(safe_file_name("Ἰλιάς/Ὀδύσσεια", "x"), "Ἰλιάς Ὀδύσσεια");
    }

    #[test]
    fn names_windows_keeps_for_its_devices_and_dots_at_the_end_of_a_cut() {
        assert_eq!(safe_file_name("Nul.pdf", "x"), "Nul_.pdf");
        assert_eq!(safe_file_name("con", "x"), "con_");
        assert_eq!(safe_file_name("AUX. notes.docx", "x"), "AUX_. notes.docx");
        assert_eq!(safe_file_name("COM1.tar.gz", "x"), "COM1_.tar.gz");
        assert_eq!(safe_file_name("lpt³", "x"), "lpt³_");
        assert_eq!(clean_file_name("Prn "), "Prn_");
        // Names that only begin as a device's do are names.
        for name in ["Console.pdf", "COM10", "com", "lpt0", "Nulla.txt", "Conan, Aux"] {
            assert_eq!(safe_file_name(name, "x"), name);
        }
        // A cut that ends in a dot, as "Vol." does, ends without it.
        let long = format!("{} Vol. 2", "a".repeat(115));
        let cut = safe_file_name(&long, "x");
        assert_eq!(cut, format!("{} Vol", "a".repeat(115)));
    }
}
