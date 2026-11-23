//! What another app handed to Glaukopis on a phone (Share, and the menu
//! over selected words), written into the notebook's inbox as one thing of
//! the kind `shared` (stage 3 of `docs/plans/an-app-for-android.md`). The
//! part of the app in Kotlin reads what was handed over, copies each file
//! into a folder of its own, and calls the door of the shell, which calls
//! `put`. Nothing here knows of Android.
//!
//! Nothing is read of what came: the words are kept as they were handed
//! over, the subject whatever it says, and each file under the name the
//! other app gave it. What the words are, an address or other words, and
//! what the subject is of, is read where the thing is taken in.

use std::fs;
use std::path::Path;

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::error::{Error, Result};
use crate::library::attachments::hash_file;
use crate::tr;

use super::inbox::{Collected, HeldFile, Inbox, Kind, MAX_FILE, file_too_large};

/// What another app handed over, as the part in Kotlin says it.
#[derive(Debug, Clone, Default, PartialEq, Eq, Deserialize)]
#[serde(default)]
pub struct Shared {
    /// The words, as they were handed over.
    pub text: String,
    /// The subject the other app gave, whatever it says.
    pub subject: String,
    /// The files, in their order, each copied into the folder `put` is given.
    pub files: Vec<SharedFile>,
}

/// A file handed over: where it lies in the folder `put` is given, and its name.
#[derive(Debug, Clone, Default, PartialEq, Eq, Deserialize)]
#[serde(default)]
pub struct SharedFile {
    /// Its plain name in that folder.
    pub at: String,
    /// What the other app calls it.
    pub name: String,
}

/// What came of putting a thing shared into the inbox.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize)]
pub struct Put {
    /// The name of the thing in the inbox.
    pub id: String,
    /// What could not be taken, in words, each a line.
    pub problems: Vec<String>,
}

/// The most signs of the name of a file in the folder `put` is given.
const MOST_AT: usize = 64;

/// What a file with no name is called.
const NAMELESS: &str = "file";

/// Whether `at` is a plain name of what lies in the folder: one to 64
/// signs, ASCII letters, digits, `-` and `_`, and so nothing that leaves it.
fn plain(at: &str) -> bool {
    (1..=MOST_AT).contains(&at.len()) && at.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
}

/// Puts what another app handed over into the inbox as one thing, with the
/// files that lie in `from` moved into it (renamed, as the inbox is on the
/// same disk), each by what it holds. It is there whole, or not at all.
///
/// A file that cannot be read, or is larger than `MAX_FILE`, is left out
/// and said in the problems, and the rest go on. Where neither words nor
/// any file are left, nothing is put, and the error says why: a subject
/// alone is nothing, since it is said of something and nothing came.
/// `from` itself is not removed: whoever made it removes it.
pub fn put(inbox: &Inbox, shared: Shared, from: &Path) -> Result<Put> {
    // A fault of whoever calls, not of a file: nothing is touched.
    if let Some(file) = shared.files.iter().find(|file| !plain(&file.at)) {
        return Err(Error::invalid(tr!("io-reading", path = &from.join(&file.at))));
    }
    let mut problems: Vec<String> = Vec::new();
    let mut kept: Vec<HeldFile> = Vec::new();
    for file in &shared.files {
        let name = if file.name.trim().is_empty() { NAMELESS } else { file.name.as_str() };
        let path = from.join(&file.at);
        let size = match fs::metadata(&path) {
            Ok(meta) if meta.is_file() => meta.len(),
            _ => {
                problems.push(tr!("core-notebook-shared-unread", name = name));
                continue;
            }
        };
        if size > MAX_FILE as u64 {
            problems.push(file_too_large(name).to_string());
            continue;
        }
        let Ok(hash) = hash_file(&path) else {
            problems.push(tr!("core-notebook-shared-unread", name = name));
            continue;
        };
        let there = from.join(&hash);
        if there.exists() {
            // The same content handed over twice: it is one file, which the thing names twice.
            if let Err(error) = fs::remove_file(&path) {
                tracing::warn!(%error, "a file handed over twice was not removed from where it was copied");
            }
        } else if let Err(error) = fs::rename(&path, &there) {
            tracing::warn!(%error, "a file handed over was not named by what it holds");
            problems.push(tr!("core-notebook-shared-unread", name = name));
            continue;
        }
        kept.push(HeldFile { hash, name: name.to_owned() });
    }
    if shared.text.trim().is_empty() && kept.is_empty() {
        return Err(Error::invalid(if problems.is_empty() {
            tr!("core-notebook-shared-empty")
        } else {
            problems.join("; ")
        }));
    }
    let thing = Collected {
        kind: Kind::Shared,
        url: String::new(),
        title: shared.subject,
        when: crate::library::now(),
        text: shared.text,
        html: String::new(),
        alt: String::new(),
        name: String::new(),
        doc: Value::Null,
        files: kept,
    };
    let id = inbox.put_note(&thing, from)?;
    Ok(Put { id, problems })
}

#[cfg(test)]
mod tests {
    use super::*;

    /// An inbox, and a folder beside it where what was handed over was copied.
    fn place() -> (tempfile::TempDir, Inbox, std::path::PathBuf) {
        let tmp = tempfile::tempdir().unwrap();
        let inbox = Inbox::at(tmp.path().join("notebook").join("inbox"));
        let from = tmp.path().join("notebook").join("sharing").join("1-abcdefgh");
        fs::create_dir_all(&from).unwrap();
        (tmp, inbox, from)
    }

    fn handed(text: &str, subject: &str, files: &[(&str, &str)]) -> Shared {
        Shared {
            text: text.into(),
            subject: subject.into(),
            files: files.iter().map(|(at, name)| SharedFile { at: (*at).into(), name: (*name).into() }).collect(),
        }
    }

    fn folder_is_empty(dir: &Path) -> bool {
        fs::read_dir(dir).unwrap().next().is_none()
    }

    #[test]
    fn words_alone_are_put_with_when_and_nothing_else() {
        let (_tmp, inbox, from) = place();
        let put = put(&inbox, handed("\"A word\" and another.", "", &[]), &from).unwrap();
        assert!(put.problems.is_empty());
        assert_eq!(inbox.ids(), vec![put.id.clone()]);
        let (thing, picture) = inbox.read(&put.id).unwrap();
        assert_eq!(thing.kind, Kind::Shared);
        assert_eq!(thing.text, "\"A word\" and another.", "as it was handed over, quotation marks and all");
        assert!(thing.title.is_empty() && thing.url.is_empty() && thing.html.is_empty());
        assert!(thing.alt.is_empty() && thing.name.is_empty() && thing.doc.is_null() && thing.files.is_empty());
        assert!(thing.when.starts_with("20") && thing.when.ends_with('Z'), "{}", thing.when);
        assert_eq!(picture, None);
    }

    #[test]
    fn a_subject_is_the_title_of_the_thing_whatever_it_says() {
        let (_tmp, inbox, from) = place();
        let put = put(&inbox, handed("words", "Including link: ", &[]), &from).unwrap();
        let (thing, _) = inbox.read(&put.id).unwrap();
        assert_eq!(thing.title, "Including link: ");
    }

    #[test]
    fn two_files_are_hashed_moved_into_the_thing_and_read_back_each_under_its_name() {
        let (_tmp, inbox, from) = place();
        fs::write(from.join("0"), b"%PDF-1.4 a letter").unwrap();
        fs::write(from.join("1"), b"\x89PNG\r\n\x1a\nrest").unwrap();
        let put = put(&inbox, handed("see these", "", &[("0", "Letter.pdf"), ("1", "owl.png")]), &from).unwrap();
        let (thing, _) = inbox.read(&put.id).unwrap();
        assert_eq!(thing.files.len(), 2);
        assert_eq!(thing.files[0].name, "Letter.pdf");
        assert_eq!(thing.files[1].name, "owl.png");
        assert_eq!(thing.files[0].hash, crate::library::attachments::hash_bytes(b"%PDF-1.4 a letter"));
        assert_eq!(fs::read(inbox.file_of(&put.id, &thing.files[0].hash).unwrap()).unwrap(), b"%PDF-1.4 a letter");
        assert_eq!(fs::read(inbox.file_of(&put.id, &thing.files[1].hash).unwrap()).unwrap(), b"\x89PNG\r\n\x1a\nrest");
        assert!(folder_is_empty(&from), "moved into the thing, not copied");
    }

    #[test]
    fn a_file_alone_is_put_with_no_words() {
        let (_tmp, inbox, from) = place();
        fs::write(from.join("0"), b"one file").unwrap();
        let put = put(&inbox, handed("", "A subject", &[("0", "one.txt")]), &from).unwrap();
        let (thing, _) = inbox.read(&put.id).unwrap();
        assert!(thing.text.is_empty());
        assert_eq!(thing.files.len(), 1);
    }

    #[test]
    fn a_file_with_no_name_is_called_file() {
        let (_tmp, inbox, from) = place();
        fs::write(from.join("0"), b"nameless").unwrap();
        let put = put(&inbox, handed("", "", &[("0", "  ")]), &from).unwrap();
        let (thing, _) = inbox.read(&put.id).unwrap();
        assert_eq!(thing.files[0].name, "file");
    }

    #[test]
    fn the_same_content_twice_is_one_file_named_twice() {
        let (_tmp, inbox, from) = place();
        fs::write(from.join("0"), b"the same").unwrap();
        fs::write(from.join("1"), b"the same").unwrap();
        let put = put(&inbox, handed("", "", &[("0", "first.txt"), ("1", "second.txt")]), &from).unwrap();
        let (thing, _) = inbox.read(&put.id).unwrap();
        assert_eq!(thing.files.len(), 2);
        assert_eq!(thing.files[0].hash, thing.files[1].hash);
        assert_eq!((thing.files[0].name.as_str(), thing.files[1].name.as_str()), ("first.txt", "second.txt"));
        let held: Vec<_> = fs::read_dir(inbox.dir().join(&put.id).join("files")).unwrap().collect();
        assert_eq!(held.len(), 1, "kept once");
        assert!(folder_is_empty(&from), "the second copy was removed");
    }

    #[test]
    fn a_file_larger_than_a_file_may_be_is_left_out_and_said_and_the_rest_is_put() {
        let (_tmp, inbox, from) = place();
        fs::File::create(from.join("0")).unwrap().set_len(MAX_FILE as u64 + 1).unwrap();
        fs::write(from.join("1"), b"small").unwrap();
        let put = put(&inbox, handed("words", "", &[("0", "film.mov"), ("1", "small.txt")]), &from).unwrap();
        assert_eq!(put.problems.len(), 1);
        assert!(put.problems[0].contains("film.mov") && put.problems[0].contains("50 MB"), "{:?}", put.problems);
        let (thing, _) = inbox.read(&put.id).unwrap();
        assert_eq!(thing.files.iter().map(|f| f.name.as_str()).collect::<Vec<_>>(), vec!["small.txt"]);
    }

    #[test]
    fn a_file_that_is_not_there_is_left_out_and_said() {
        let (_tmp, inbox, from) = place();
        fs::write(from.join("1"), b"here").unwrap();
        fs::create_dir(from.join("2")).unwrap();
        let shared = handed("words", "", &[("0", "gone.pdf"), ("1", "here.txt"), ("2", "a folder")]);
        let put = put(&inbox, shared, &from).unwrap();
        assert_eq!(put.problems.len(), 2);
        assert!(put.problems[0].contains("gone.pdf") && put.problems[1].contains("a folder"), "{:?}", put.problems);
        let (thing, _) = inbox.read(&put.id).unwrap();
        assert_eq!(thing.files.len(), 1);
        assert_eq!(thing.files[0].name, "here.txt");
    }

    #[test]
    fn a_file_too_large_with_nothing_beside_it_puts_nothing_and_the_error_says_the_file() {
        let (_tmp, inbox, from) = place();
        fs::File::create(from.join("0")).unwrap().set_len(MAX_FILE as u64 + 1).unwrap();
        let error = put(&inbox, handed("", "", &[("0", "film.mov")]), &from).unwrap_err().to_string();
        assert!(error.contains("film.mov"), "{error}");
        assert!(inbox.ids().is_empty());
        assert!(!inbox.dir().exists(), "the inbox was not even made");
    }

    #[test]
    fn an_at_that_is_no_plain_name_puts_nothing_and_touches_nothing() {
        let (tmp, inbox, from) = place();
        fs::write(from.join("0"), b"fine").unwrap();
        fs::write(tmp.path().join("outside"), b"not the folder's").unwrap();
        for at in ["", "../outside", "a/b", "a.b", "a b", &"x".repeat(65), "é"] {
            let shared = handed("words", "", &[("0", "fine.txt"), (at, "bad.txt")]);
            assert!(put(&inbox, shared, &from).is_err(), "{at:?}");
        }
        assert!(inbox.ids().is_empty());
        assert!(!inbox.dir().exists());
        assert!(from.join("0").is_file(), "no file was named by what it holds before the fault was found");
        assert!(tmp.path().join("outside").is_file());
        // The longest and the plainest are fine.
        let longest = "A-z_9".repeat(12) + "abcd";
        assert_eq!(longest.len(), 64);
        fs::write(from.join(&longest), b"long").unwrap();
        assert!(put(&inbox, handed("", "", &[(&longest, "long.txt")]), &from).is_ok());
    }

    #[test]
    fn neither_words_nor_files_puts_nothing_and_the_inbox_is_not_even_made() {
        let (_tmp, inbox, from) = place();
        for shared in [handed("", "", &[]), handed(" \n\t ", "", &[]), handed("", "A subject alone", &[])] {
            let error = put(&inbox, shared, &from).unwrap_err().to_string();
            assert_eq!(error, "nothing was shared");
        }
        assert!(!inbox.dir().exists());
        // Files that all fail are said in the error, in place of that.
        let error = put(&inbox, handed("", "", &[("0", "gone.pdf")]), &from).unwrap_err().to_string();
        assert!(error.contains("gone.pdf"), "{error}");
        assert!(!inbox.dir().exists());
    }

    #[test]
    fn a_thing_is_read_from_json_with_what_it_says_and_no_html_or_document() {
        let said = r#"{"text": "x", "subject": "s", "files": [{"at": "0", "name": "a.txt"}, {"at": "1"}], "html": "<b>no</b>", "doc": {"type": "doc"}}"#;
        let shared: Shared = serde_json::from_str(said).unwrap();
        assert_eq!(shared, handed("x", "s", &[("0", "a.txt"), ("1", "")]));
        assert_eq!(serde_json::from_str::<Shared>("{}").unwrap(), Shared::default());
        // Whatever it says in `html` or `doc`, the thing put holds none; the two files named are not there.
        let (_tmp, inbox, from) = place();
        let put = put(&inbox, shared, &from).unwrap();
        assert_eq!(put.problems.len(), 2);
        let (thing, _) = inbox.read(&put.id).unwrap();
        assert!(thing.html.is_empty() && thing.doc.is_null() && thing.files.is_empty());
        // And what is answered is its id and the problems, as JSON.
        let answered = serde_json::to_value(&put).unwrap();
        assert_eq!(answered["id"], serde_json::json!(put.id));
        assert_eq!(answered["problems"].as_array().unwrap().len(), 2);
    }
}
