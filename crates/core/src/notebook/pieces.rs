//! A file the page holds, taken in piece by piece (stage 3 of
//! `docs/plans/an-app-for-android.md`). On Android every call of the page
//! reaches Rust as one string of JSON, through Java: a photograph of 30 MB
//! in one call is a string of 40 MB three times over, and a file of 50 MB
//! ends the app on a phone with little memory. So the page sends a file in
//! pieces, each under a ticket, and says when it is whole.
//!
//! ```text
//! notebook/taking/<ticket>   the pieces so far, put end to end
//! ```
//!
//! A ticket is made by the page for one file, and lives until the file is
//! taken in or thrown away; what a run that ended left is removed when the
//! application next opens its folder (`clear`).

use std::fs;
use std::io::Write;
use std::path::PathBuf;

use crate::error::{Error, IoContext, Result};
use crate::paths::DataDir;
use crate::tr;

use super::inbox::{MAX_FILE, file_too_large};

/// The most signs of a ticket.
const MOST_TICKET: usize = 64;

/// The files being taken in, in the folder they are kept in.
#[derive(Debug)]
pub struct Pieces {
    dir: PathBuf,
}

impl Pieces {
    /// The pieces of this data folder: `notebook/taking`, which is made when
    /// a first piece is put.
    pub fn new(data: &DataDir) -> Self {
        Self::at(data.notebook().join("taking"))
    }

    /// The pieces kept in `dir`.
    pub fn at(dir: impl Into<PathBuf>) -> Self {
        Pieces { dir: dir.into() }
    }

    /// Where the file of a ticket lies; a ticket that is no plain name is
    /// refused: one to 64 ASCII letters and digits, and nothing that leaves
    /// the folder.
    fn of(&self, ticket: &str) -> Result<PathBuf> {
        let plain = (1..=MOST_TICKET).contains(&ticket.len()) && ticket.bytes().all(|b| b.is_ascii_alphanumeric());
        if !plain {
            return Err(Error::invalid(tr!("io-reading", path = &self.dir.join(ticket))));
        }
        Ok(self.dir.join(ticket))
    }

    /// Puts bytes at the end of the file of a ticket, which the first piece
    /// makes, with the folder. Gives how large the file is now. Where it
    /// would be larger than `MAX_FILE`, the file is removed and the piece
    /// refused, `name` being what the file is called.
    pub fn add(&self, ticket: &str, name: &str, bytes: &[u8]) -> Result<u64> {
        let path = self.of(ticket)?;
        let before = match fs::metadata(&path) {
            Ok(meta) => meta.len(),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => 0,
            Err(e) => return Err(e).context(|| tr!("io-reading", path = &path)),
        };
        let now = before + bytes.len() as u64;
        if now > MAX_FILE as u64 {
            self.drop(ticket)?;
            return Err(file_too_large(name));
        }
        fs::create_dir_all(&self.dir).context(|| tr!("io-creating", path = &self.dir))?;
        let mut file =
            fs::OpenOptions::new().create(true).append(true).open(&path).context(|| tr!("io-writing", path = &path))?;
        file.write_all(bytes).context(|| tr!("io-writing", path = &path))?;
        Ok(now)
    }

    /// Where the file of a ticket lies; an error where there is none.
    pub fn whole(&self, ticket: &str) -> Result<PathBuf> {
        let path = self.of(ticket)?;
        if path.is_file() { Ok(path) } else { Err(Error::not_found(ticket.to_owned())) }
    }

    /// Removes the file of a ticket. One not there is gone already.
    pub fn drop(&self, ticket: &str) -> Result<()> {
        let path = self.of(ticket)?;
        match fs::remove_file(&path) {
            Err(e) if e.kind() != std::io::ErrorKind::NotFound => Err(e).context(|| tr!("io-removing", path = &path)),
            _ => Ok(()),
        }
    }

    /// Removes everything in the folder: what a run that ended left. Said in
    /// the log where it cannot be done, and never an error.
    pub fn clear(&self) {
        match fs::remove_dir_all(&self.dir) {
            Err(error) if error.kind() != std::io::ErrorKind::NotFound => {
                tracing::warn!(%error, dir = %self.dir.display(), "files left half taken in could not be removed")
            }
            _ => {}
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn place() -> (tempfile::TempDir, Pieces) {
        let tmp = tempfile::tempdir().unwrap();
        let pieces = Pieces::at(tmp.path().join("notebook").join("taking"));
        (tmp, pieces)
    }

    #[test]
    fn three_pieces_are_the_file_whole_byte_for_byte() {
        let (_tmp, pieces) = place();
        assert_eq!(pieces.add("abc123", "paper.pdf", b"%PDF-1.4 ").unwrap(), 9);
        assert_eq!(pieces.add("abc123", "paper.pdf", b"the middle \x00\xff ").unwrap(), 9 + 14);
        assert_eq!(pieces.add("abc123", "paper.pdf", b"end").unwrap(), 9 + 14 + 3);
        let path = pieces.whole("abc123").unwrap();
        assert_eq!(fs::read(path).unwrap(), b"%PDF-1.4 the middle \x00\xff end");
    }

    #[test]
    fn two_tickets_are_two_files() {
        let (_tmp, pieces) = place();
        pieces.add("one", "a.txt", b"first").unwrap();
        pieces.add("two", "b.txt", b"second").unwrap();
        pieces.add("one", "a.txt", b" more").unwrap();
        assert_eq!(fs::read(pieces.whole("one").unwrap()).unwrap(), b"first more");
        assert_eq!(fs::read(pieces.whole("two").unwrap()).unwrap(), b"second");
    }

    #[test]
    fn a_ticket_that_is_no_plain_name_is_refused() {
        let (tmp, pieces) = place();
        for ticket in ["", "../x", "a/b", "a.b", "a-b", "a b", "é", &"x".repeat(65)] {
            assert!(pieces.add(ticket, "x", b"bytes").is_err(), "{ticket:?}");
            assert!(pieces.whole(ticket).is_err(), "{ticket:?}");
            assert!(pieces.drop(ticket).is_err(), "{ticket:?}");
        }
        assert!(!tmp.path().join("notebook").exists(), "nothing was made for them");
        assert!(pieces.add(&"Az09".repeat(16), "x", b"bytes").is_ok(), "the longest is fine");
    }

    #[test]
    fn the_piece_that_passes_the_most_is_refused_and_the_file_is_gone() {
        let (_tmp, pieces) = place();
        let large = vec![0u8; MAX_FILE - 10];
        assert_eq!(pieces.add("big", "film.mov", &large).unwrap(), (MAX_FILE - 10) as u64);
        assert_eq!(pieces.add("big", "film.mov", &[1u8; 10]).unwrap(), MAX_FILE as u64, "exactly the most is fine");
        let error = pieces.add("big", "film.mov", &[1u8]).unwrap_err().to_string();
        assert!(error.contains("film.mov") && error.contains("50 MB"), "{error}");
        assert!(pieces.whole("big").is_err(), "what was sent before is gone");
        // A single piece that is too large makes nothing at all.
        let (tmp, pieces) = place();
        assert!(pieces.add("one", "film.mov", &vec![0u8; MAX_FILE + 1]).is_err());
        assert!(pieces.whole("one").is_err());
        assert!(!tmp.path().join("notebook").join("taking").exists());
    }

    #[test]
    fn a_ticket_dropped_is_gone_and_dropped_again_is_no_fault() {
        let (_tmp, pieces) = place();
        pieces.add("gone", "a.txt", b"bytes").unwrap();
        pieces.drop("gone").unwrap();
        assert!(pieces.whole("gone").is_err());
        pieces.drop("gone").unwrap();
        pieces.drop("never").unwrap();
    }

    #[test]
    fn clear_takes_what_was_left() {
        let (tmp, pieces) = place();
        pieces.add("one", "a.txt", b"left").unwrap();
        pieces.add("two", "b.txt", b"left").unwrap();
        pieces.clear();
        assert!(pieces.whole("one").is_err() && pieces.whole("two").is_err());
        pieces.clear();
        // A folder never made is as clear.
        Pieces::at(tmp.path().join("nothing").join("here")).clear();
        // And a ticket may be used again.
        assert_eq!(pieces.add("one", "a.txt", b"new").unwrap(), 3);
    }

    #[test]
    fn the_file_of_a_ticket_never_given_is_an_error() {
        let (_tmp, pieces) = place();
        assert!(matches!(pieces.whole("never"), Err(Error::NotFound(_))));
    }
}
