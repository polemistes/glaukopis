//! Files that belong to entries. They are copied into the store and kept by
//! the hash of their content, so the same file is never stored twice.

use std::fs;
use std::io::Read;
use std::path::{Component, Path, PathBuf};

use serde::Serialize;
use sha2::{Digest, Sha256};

use crate::error::{Error, IoContext, Result};
use crate::fsutil::safe_file_name;
use crate::tr;

/// The directory name under the library directory.
pub const DIR: &str = "attachments";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StoredFile {
    /// Relative to the library directory, with forward slashes.
    pub path: String,
    pub name: String,
    pub size: u64,
    pub exists: bool,
    pub hash: String,
}

pub fn hash_file(path: &Path) -> Result<String> {
    let mut file = fs::File::open(path).context(|| tr!("io-opening", path = path))?;
    let mut hasher = Sha256::new();
    let mut buffer = vec![0u8; 1 << 16];
    loop {
        let n = file.read(&mut buffer).context(|| tr!("io-reading", path = path))?;
        if n == 0 {
            break;
        }
        hasher.update(&buffer[..n]);
    }
    Ok(hex(&hasher.finalize()))
}

pub fn hash_bytes(bytes: &[u8]) -> String {
    hex(&Sha256::digest(bytes))
}

fn hex(bytes: &[u8]) -> String {
    const DIGITS: &[u8; 16] = b"0123456789abcdef";
    let mut s = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        s.push(DIGITS[(b >> 4) as usize] as char);
        s.push(DIGITS[(b & 15) as usize] as char);
    }
    s
}

/// The directory, relative to the library, where content with this hash lies.
fn hash_dir(hash: &str) -> String {
    format!("{DIR}/{}/{}", &hash[..2], hash)
}

/// The hash a stored path belongs to.
pub fn hash_of_path(relative: &str) -> Option<&str> {
    let mut parts = relative.split('/');
    if parts.next()? != DIR {
        return None;
    }
    parts.next()?;
    let hash = parts.next()?;
    (hash.len() == 64 && hash.bytes().all(|b| b.is_ascii_hexdigit())).then_some(hash)
}

/// Resolves a stored path, refusing anything that would leave the library directory.
pub fn absolute(library_dir: &Path, relative: &str) -> Result<PathBuf> {
    let rel = Path::new(relative);
    let safe = rel.components().all(|c| matches!(c, Component::Normal(_)));
    if !safe || relative.is_empty() {
        return Err(Error::invalid(tr!("core-library-not-in-library", path = relative)));
    }
    Ok(library_dir.join(rel))
}

/// The stored path of content with this hash, if it is in the store.
pub fn find_by_hash(library_dir: &Path, hash: &str) -> Option<String> {
    let dir = hash_dir(hash);
    let entries = fs::read_dir(library_dir.join(&dir)).ok()?;
    for e in entries.flatten() {
        if e.file_type().map(|t| t.is_file()).unwrap_or(false) {
            return Some(format!("{dir}/{}", e.file_name().to_string_lossy()));
        }
    }
    None
}

/// Copies a file into the store and returns its stored path. When the content
/// is already there, nothing is copied and the existing path is returned.
pub fn store_file(library_dir: &Path, source: &Path, name: &str) -> Result<String> {
    let meta = fs::metadata(source).context(|| tr!("io-reading", path = source))?;
    if !meta.is_file() {
        return Err(Error::invalid(tr!("core-library-not-a-file", path = source)));
    }
    let hash = hash_file(source)?;
    if let Some(existing) = find_by_hash(library_dir, &hash) {
        return Ok(existing);
    }
    let dir = hash_dir(&hash);
    let target_dir = library_dir.join(&dir);
    fs::create_dir_all(&target_dir).context(|| tr!("io-creating", path = &target_dir))?;
    let name = file_name_for(name, source);
    let target = target_dir.join(&name);
    // Copy to a temporary name first: a crash must not leave half a file under its final name.
    let tmp = target_dir.join(format!(".tmp-{}", uuid::Uuid::new_v4()));
    fs::copy(source, &tmp).context(|| tr!("io-copying", path = source))?;
    fs::rename(&tmp, &target).context(|| tr!("io-storing", path = &target))?;
    Ok(format!("{dir}/{name}"))
}

pub fn store_bytes(library_dir: &Path, bytes: &[u8], name: &str) -> Result<String> {
    let hash = hash_bytes(bytes);
    if let Some(existing) = find_by_hash(library_dir, &hash) {
        return Ok(existing);
    }
    let dir = hash_dir(&hash);
    let target_dir = library_dir.join(&dir);
    let name = safe_file_name(name, "file");
    crate::fsutil::write_atomic(&target_dir.join(&name), bytes)?;
    Ok(format!("{dir}/{name}"))
}

/// The name to store under: the one asked for, with the extension of the source.
fn file_name_for(name: &str, source: &Path) -> String {
    let ext = source.extension().map(|e| e.to_string_lossy().to_lowercase()).filter(|e| !e.is_empty() && e.len() <= 8);
    let source_name = source.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
    let base = if name.trim().is_empty() { source_name.clone() } else { name.to_owned() };
    let mut safe = safe_file_name(&base, "file");
    if let Some(ext) = ext {
        let suffix = format!(".{ext}");
        if !safe.to_lowercase().ends_with(&suffix) {
            safe.push_str(&suffix);
        }
    }
    safe
}

pub fn describe(library_dir: &Path, relative: &str) -> StoredFile {
    let name = relative.rsplit('/').next().unwrap_or(relative).to_owned();
    let meta = absolute(library_dir, relative).ok().and_then(|p| fs::metadata(p).ok());
    StoredFile {
        path: relative.to_owned(),
        name,
        size: meta.as_ref().map(|m| m.len()).unwrap_or(0),
        exists: meta.is_some_and(|m| m.is_file()),
        hash: hash_of_path(relative).unwrap_or_default().to_owned(),
    }
}

/// Removes a stored file and the directories left empty by it.
pub fn delete(library_dir: &Path, relative: &str) -> Result<()> {
    let path = absolute(library_dir, relative)?;
    match fs::remove_file(&path) {
        Ok(()) => {}
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
        Err(e) => return Err(e).context(|| tr!("io-removing", path = &path)),
    }
    let root = library_dir.join(DIR);
    let mut dir = path.parent().map(Path::to_owned);
    while let Some(d) = dir {
        if d == root || !d.starts_with(&root) {
            break;
        }
        if fs::remove_dir(&d).is_err() {
            break; // not empty
        }
        dir = d.parent().map(Path::to_owned);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_same_content_is_stored_once() {
        let tmp = tempfile::tempdir().unwrap();
        let lib = tmp.path().join("library");
        fs::create_dir_all(&lib).unwrap();
        let a = tmp.path().join("scan 1.PDF");
        let b = tmp.path().join("copy.pdf");
        fs::write(&a, b"%PDF-1.4 one").unwrap();
        fs::write(&b, b"%PDF-1.4 one").unwrap();

        let first = store_file(&lib, &a, "Nagy 1979 - The Best of the Achaeans").unwrap();
        assert!(first.ends_with("/Nagy 1979 - The Best of the Achaeans.pdf"), "{first}");
        assert_eq!(store_file(&lib, &b, "Other name").unwrap(), first);

        let info = describe(&lib, &first);
        assert!(info.exists);
        assert_eq!(info.size, 12);
        assert_eq!(info.hash.len(), 64);
        assert_eq!(find_by_hash(&lib, &info.hash).as_deref(), Some(first.as_str()));

        delete(&lib, &first).unwrap();
        assert!(!describe(&lib, &first).exists);
        assert!(fs::read_dir(lib.join(DIR)).unwrap().next().is_none());
    }

    #[test]
    fn paths_cannot_leave_the_library() {
        let lib = Path::new("/data/library");
        assert!(absolute(lib, "attachments/ab/x/file.pdf").is_ok());
        assert!(absolute(lib, "../secrets").is_err());
        assert!(absolute(lib, "/etc/passwd").is_err());
        assert!(absolute(lib, "a/../../b").is_err());
        assert!(absolute(lib, "").is_err());
    }
}
