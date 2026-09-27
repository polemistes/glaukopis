//! Writing files so that a crash never leaves half a file.

use std::fs::{self, File};
use std::io::Write;
use std::path::Path;

use crate::error::{Error, IoContext, Result};

/// Writes `bytes` to `path` by way of a temporary file in the same directory,
/// flushed to disk and then renamed over the target.
pub fn write_atomic(path: &Path, bytes: &[u8]) -> Result<()> {
    let dir = path.parent().ok_or_else(|| Error::invalid(format!("{} has no directory", path.display())))?;
    fs::create_dir_all(dir).context(|| format!("creating {}", dir.display()))?;

    let mut tmp = tempfile::Builder::new()
        .prefix(".tmp-")
        .tempfile_in(dir)
        .context(|| format!("creating a temporary file in {}", dir.display()))?;
    tmp.write_all(bytes).context(|| format!("writing {}", path.display()))?;
    tmp.as_file().sync_all().context(|| format!("flushing {}", path.display()))?;
    tmp.persist(path).map_err(|e| Error::io(format!("replacing {}", path.display()), e.error))?;

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
        fs::copy(path, &backup).context(|| format!("backing up {}", path.display()))?;
    }
    write_atomic(path, bytes)
}

/// Turns a title into something safe to use as a file name on every platform.
pub fn safe_file_name(name: &str, fallback: &str) -> String {
    let mut out = String::with_capacity(name.len());
    for c in name.chars() {
        match c {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' | '\0' => out.push(' '),
            c if c.is_control() => out.push(' '),
            c => out.push(c),
        }
    }
    let collapsed = out.split_whitespace().collect::<Vec<_>>().join(" ");
    let trimmed = collapsed.trim_matches(|c: char| c == '.' || c == ' ');
    let mut cut: String = trimmed.chars().take(120).collect();
    cut = cut.trim().to_owned();
    if cut.is_empty() { fallback.to_owned() } else { cut }
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
}
