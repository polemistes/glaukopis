//! The pages of a file drawn to be shown in a view, kept on disk, so that
//! turning back to a page, or opening the file again, shows it at once.
//!
//! Each page is kept as the PNG it was drawn as, by the file, the page and
//! the width: `<root>/<key>/<page>-<width>.png`, the key standing for the
//! file as it is (its path, its size and when it was changed), so that a
//! file changed is drawn anew. What is kept is bounded: past `MOST` in all,
//! those shown longest ago go first, until `DOWN_TO` is left. A page kept
//! that cannot be read, or is not whole, is drawn again; a cache that
//! cannot be written is said once in the log, and the pages are drawn each
//! time they are asked for. Nothing here is ever an error of the view.

use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Mutex, PoisonError};
use std::time::SystemTime;

/// The most that is kept of the pages drawn, in bytes, and what is left
/// when that is passed.
pub const MOST: u64 = 200 << 20;
pub const DOWN_TO: u64 = 150 << 20;

/// What a PNG begins with, and the chunk it ends with.
const SIGNATURE: &[u8] = b"\x89PNG\r\n\x1a\n";
const END: &[u8] = b"\0\0\0\0IEND\xae\x42\x60\x82";

/// The key a file is kept by, as it is: a hash of its path, its size and
/// when it was changed, as `seen_of` tells a file. Nothing, where the file
/// cannot be found.
pub fn key_of(path: &Path) -> Option<String> {
    use sha2::{Digest, Sha256};
    let meta = std::fs::metadata(path).ok()?;
    let changed = meta.modified().ok().and_then(|t| t.duration_since(SystemTime::UNIX_EPOCH).ok()).unwrap_or_default();
    let mut hash = Sha256::new();
    hash.update(path.as_os_str().as_encoded_bytes());
    hash.update(meta.len().to_le_bytes());
    hash.update(changed.as_nanos().to_le_bytes());
    Some(hash.finalize().iter().take(16).map(|b| format!("{b:02x}")).collect())
}

fn file_of(root: &Path, key: &str, page: usize, width: u32) -> PathBuf {
    root.join(key).join(format!("{page}-{width}.png"))
}

/// The page `page` of the file kept by `key`, drawn `width` dots wide,
/// where it is kept and whole: the time it was last shown is made now, so
/// that what is shown often stays. A page kept that is not whole is let go.
pub fn get(root: &Path, key: &str, page: usize, width: u32) -> Option<Vec<u8>> {
    let path = file_of(root, key, page, width);
    let bytes = std::fs::read(&path).ok()?;
    if !(bytes.starts_with(SIGNATURE) && bytes.ends_with(END)) {
        tracing::debug!(path = %path.display(), "a page kept was not whole, and is drawn again");
        let _ = std::fs::remove_file(&path);
        return None;
    }
    if let Ok(file) = std::fs::File::options().write(true).open(&path) {
        let _ = file.set_modified(SystemTime::now());
    }
    Some(bytes)
}

/// Keeps the page `page` of the file kept by `key`, drawn `width` dots
/// wide, as `bytes`, and lets the oldest go where what is kept passes the
/// bound.
pub fn put(root: &Path, key: &str, page: usize, width: u32, bytes: &[u8]) {
    put_within(root, key, page, width, bytes, (MOST, DOWN_TO));
}

/// Whether it was said that the cache cannot be written: it is said once.
static SAID: AtomicBool = AtomicBool::new(false);

/// How much is kept under each root, as far as is known since it was last
/// gone through: so that a page kept does not go through all of them.
static KEPT: Mutex<Vec<(PathBuf, u64)>> = Mutex::new(Vec::new());

fn put_within(root: &Path, key: &str, page: usize, width: u32, bytes: &[u8], (most, down_to): (u64, u64)) {
    use std::io::Write as _;
    let path = file_of(root, key, page, width);
    // Written beside it and put in its place, so that a page half written is
    // never taken for one; each in a file of its own, so that two views
    // drawing the same page at once do not write into one.
    let written = path.parent().map_or(Ok(()), std::fs::create_dir_all).and_then(|()| {
        let mut part = tempfile::Builder::new().suffix(".part").tempfile_in(path.parent().unwrap_or(root))?;
        part.write_all(bytes)?;
        part.persist(&path).map(|_| ()).map_err(|e| e.error)
    });
    match written {
        Ok(()) => kept_more(root, bytes.len() as u64, (most, down_to)),
        Err(e) => not_kept(root, &e),
    }
}

/// Keeps the page `page` of the file kept by `key`, drawn `width` dots
/// wide, from the PNG at `from`, which is moved into the cache rather than
/// written again: a page drawn by the child that serves a file
/// (`ocr/server.rs`). Across file systems it is copied. The file at `from`
/// is gone afterwards, kept or not. The oldest go where what is kept passes
/// the bound, as [`put`] has it.
pub fn put_file(root: &Path, key: &str, page: usize, width: u32, from: &Path) {
    put_file_within(root, key, page, width, from, (MOST, DOWN_TO));
}

fn put_file_within(root: &Path, key: &str, page: usize, width: u32, from: &Path, bounds: (u64, u64)) {
    let path = file_of(root, key, page, width);
    let moved = std::fs::metadata(from).and_then(|meta| {
        path.parent().map_or(Ok(()), std::fs::create_dir_all)?;
        if std::fs::rename(from, &path).is_err() {
            // Copied beside it and put in its place, as `put` writes.
            let mut part = tempfile::Builder::new().suffix(".part").tempfile_in(path.parent().unwrap_or(root))?;
            std::io::copy(&mut std::fs::File::open(from)?, &mut part)?;
            part.persist(&path).map_err(|e| e.error)?;
            let _ = std::fs::remove_file(from);
        }
        // Moved, it would keep the time it was written; it is kept as shown now.
        if let Ok(file) = std::fs::File::options().write(true).open(&path) {
            let _ = file.set_modified(SystemTime::now());
        }
        Ok(meta.len())
    });
    match moved {
        Ok(size) => kept_more(root, size, bounds),
        Err(e) => {
            let _ = std::fs::remove_file(from);
            not_kept(root, &e);
        }
    }
}

/// Says, once, that the cache cannot be written.
fn not_kept(root: &Path, e: &std::io::Error) {
    if !SAID.swap(true, Ordering::Relaxed) {
        tracing::warn!(%e, root = %root.display(), "the pages drawn cannot be kept: they are drawn each time");
    }
}

/// Counts `size` more kept under `root`, and lets the oldest go where that
/// passes `most`, down to `down_to`.
fn kept_more(root: &Path, size: u64, (most, down_to): (u64, u64)) {
    let mut kept = KEPT.lock().unwrap_or_else(PoisonError::into_inner);
    let at = match kept.iter().position(|(r, _)| r == root) {
        Some(at) => {
            kept[at].1 += size;
            at
        }
        None => {
            kept.push((root.to_owned(), size_of(root)));
            kept.len() - 1
        }
    };
    if kept[at].1 > most {
        kept[at].1 = trim(root, most, down_to);
    }
}

/// The pages kept under `root`: each file, its size, and when it was last
/// shown or drawn.
fn pages_kept(root: &Path) -> Vec<(PathBuf, u64, SystemTime)> {
    let mut found = Vec::new();
    for folder in std::fs::read_dir(root).into_iter().flatten().flatten() {
        for file in std::fs::read_dir(folder.path()).into_iter().flatten().flatten() {
            // Not what is being written.
            if let Ok(meta) = file.metadata()
                && meta.is_file()
                && file.path().extension().is_some_and(|e| e == "png")
            {
                found.push((file.path(), meta.len(), meta.modified().unwrap_or(SystemTime::UNIX_EPOCH)));
            }
        }
    }
    found
}

fn size_of(root: &Path) -> u64 {
    pages_kept(root).iter().map(|(_, size, _)| size).sum()
}

/// Where more than `most` is kept, lets the pages shown longest ago go
/// until no more than `down_to` is left, and the folders of files left
/// empty with them. What is left kept.
fn trim(root: &Path, most: u64, down_to: u64) -> u64 {
    let mut pages = pages_kept(root);
    let mut total: u64 = pages.iter().map(|(_, size, _)| size).sum();
    if total <= most {
        return total;
    }
    pages.sort_by_key(|(_, _, when)| *when);
    let mut let_go = 0;
    for (path, size, _) in &pages {
        if total <= down_to {
            break;
        }
        if std::fs::remove_file(path).is_ok() {
            total -= size;
            let_go += 1;
            if let Some(folder) = path.parent() {
                // Only where it is empty.
                let _ = std::fs::remove_dir(folder);
            }
        }
    }
    tracing::debug!(let_go, left = total, "pages kept were let go, the oldest first");
    total
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    /// A PNG of `size` bytes, whole as far as the cache can tell.
    fn png(size: usize) -> Vec<u8> {
        let mut bytes = SIGNATURE.to_vec();
        bytes.resize(size - END.len(), 7);
        bytes.extend_from_slice(END);
        bytes
    }

    fn age(root: &Path, key: &str, page: usize, width: u32, seconds_ago: u64) {
        let file = std::fs::File::options().write(true).open(file_of(root, key, page, width)).unwrap();
        file.set_modified(SystemTime::now() - Duration::from_secs(seconds_ago)).unwrap();
    }

    #[test]
    fn a_page_kept_is_given_back_by_its_file_page_and_width() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().join("pages");
        assert_eq!(get(&root, "a", 1, 600), None);
        put(&root, "a", 1, 600, &png(100));
        assert_eq!(get(&root, "a", 1, 600), Some(png(100)));
        assert_eq!(get(&root, "a", 1, 800), None, "another width");
        assert_eq!(get(&root, "a", 2, 600), None, "another page");
        assert_eq!(get(&root, "b", 1, 600), None, "another file");
        let written: Vec<_> = std::fs::read_dir(root.join("a")).unwrap().flatten().map(|f| f.file_name()).collect();
        assert_eq!(written, ["1-600.png"], "nothing is left of the writing");
    }

    #[test]
    fn a_page_kept_that_is_not_whole_is_drawn_again() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().join("pages");
        put(&root, "a", 1, 600, &png(100));
        let path = file_of(&root, "a", 1, 600);
        std::fs::write(&path, &png(100)[..60]).unwrap();
        assert_eq!(get(&root, "a", 1, 600), None);
        assert!(!path.exists(), "it is let go");
    }

    /// Past the bound, those shown longest ago go first, until what is
    /// left is under the lower bound; a page shown again is kept as new.
    #[test]
    fn what_is_kept_is_bounded_and_the_oldest_go_first() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().join("pages");
        let bounds = (1000, 600);
        for page in 1..=5 {
            put_within(&root, "a", page, 600, &png(150), bounds);
        }
        put_within(&root, "b", 1, 600, &png(150), bounds);
        // Six of 150, 900 in all: within the bound, all kept.
        assert_eq!(size_of(&root), 900);
        for page in 1..=5 {
            age(&root, "a", page, 600, 1000 - page as u64 * 100);
        }
        age(&root, "b", 1, 600, 50);
        // The oldest, shown again, is as new.
        assert!(get(&root, "a", 1, 600).is_some());
        // Past the bound: 1050, down to 600 or under, those shown longest ago first.
        put_within(&root, "c", 1, 600, &png(150), bounds);
        let left: Vec<bool> = [("a", 1), ("a", 2), ("a", 3), ("a", 4), ("a", 5), ("b", 1), ("c", 1)]
            .iter()
            .map(|(key, page)| file_of(&root, key, *page, 600).exists())
            .collect();
        assert_eq!(left, [true, false, false, false, true, true, true]);
        assert_eq!(size_of(&root), 600);
        // And within it again, more is kept.
        put_within(&root, "c", 2, 600, &png(150), bounds);
        assert_eq!(size_of(&root), 750);
    }

    /// A page drawn into a file of its own is moved into the cache, counted
    /// in what is kept, and given back as any other.
    #[test]
    fn a_page_drawn_into_a_file_is_moved_into_the_cache() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().join("pages");
        let bounds = (1000, 600);
        for page in 1..=6 {
            let drawn = tmp.path().join(format!("{page}.png"));
            std::fs::write(&drawn, png(150)).unwrap();
            put_file_within(&root, "a", page, 600, &drawn, bounds);
            assert!(!drawn.exists(), "moved, not copied");
        }
        assert_eq!(get(&root, "a", 1, 600), Some(png(150)));
        assert_eq!(size_of(&root), 900);
        let drawn = tmp.path().join("7.png");
        std::fs::write(&drawn, png(150)).unwrap();
        put_file_within(&root, "a", 7, 600, &drawn, bounds);
        assert!(size_of(&root) <= 600, "the bound holds");
        assert_eq!(get(&root, "a", 7, 600), Some(png(150)), "the newest is kept");
        // A file that cannot be kept is let go all the same.
        let blocked = tmp.path().join("blocked");
        std::fs::write(&blocked, "not a folder").unwrap();
        std::fs::write(&drawn, png(150)).unwrap();
        put_file(&blocked, "a", 1, 600, &drawn);
        assert!(!drawn.exists());
    }

    #[test]
    fn a_cache_that_cannot_be_written_is_no_error() {
        let tmp = tempfile::tempdir().unwrap();
        // A file where the folder would be.
        let root = tmp.path().join("pages");
        std::fs::write(&root, "not a folder").unwrap();
        put(&root, "a", 1, 600, &png(100));
        assert_eq!(get(&root, "a", 1, 600), None);
    }

    #[test]
    fn a_file_changed_is_kept_by_another_key() {
        let tmp = tempfile::tempdir().unwrap();
        let path = tmp.path().join("a.pdf");
        std::fs::write(&path, "one").unwrap();
        let first = key_of(&path).unwrap();
        assert_eq!(first.len(), 32);
        assert_eq!(key_of(&path), Some(first.clone()));
        std::fs::write(&path, "two, longer").unwrap();
        assert_ne!(key_of(&path).unwrap(), first);
        assert_eq!(key_of(&tmp.path().join("none.pdf")), None);
    }
}
