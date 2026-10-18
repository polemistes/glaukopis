//! The user's settings, kept as JSON in the data directory.
//!
//! The core does not interpret most of them: the interface owns their meaning.
//! They are stored as given, so a newer version's settings survive an older one.
//!
//! A file that is there but cannot be understood (a bad edit by hand, half
//! a file written by another program) is never taken for "no settings yet"
//! and written over: when the page reads the settings at the start it is
//! set aside under its name with `.broken-<time>` added, the defaults are
//! used, the page is told so that it can say so, and the id of the person
//! is kept where it can still be read from what is left, so that the
//! installation stays who it was in the history of every project. (The
//! other stores are to share one helper for this; the settings do it here,
//! since they also keep the person.)

use std::path::Path;

use serde::Serialize;
use serde_json::{Map, Value};

use crate::error::{Error, IoContext, Result};
use crate::fsutil::write_atomic;
use crate::tr;

/// What is in the file of the settings.
enum Read {
    Missing,
    Good(Map<String, Value>),
    /// There, but not settings: what it holds, and why it is not.
    Damaged(String, String),
}

fn read(path: &Path) -> Result<Read> {
    let bytes = match std::fs::read(path) {
        Ok(bytes) => bytes,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(Read::Missing),
        Err(e) => return Err(e).context(|| tr!("io-reading", path = path)),
    };
    let text = match String::from_utf8(bytes) {
        Ok(text) => text,
        Err(e) => {
            let why = e.utf8_error().to_string();
            return Ok(Read::Damaged(String::from_utf8_lossy(e.as_bytes()).into_owned(), why));
        }
    };
    Ok(match serde_json::from_str::<Value>(&text) {
        Ok(Value::Object(map)) => Read::Good(map),
        Ok(_) => Read::Damaged(text, "not an object".to_owned()),
        Err(e) => {
            let why = e.to_string();
            Read::Damaged(text, why)
        }
    })
}

/// The settings, for a reader that only looks: a damaged file gives the
/// defaults, and is said in the log; it is set aside by `load_or_set_aside`
/// when the page reads the settings at the start.
pub fn load(path: &Path) -> Result<Map<String, Value>> {
    Ok(match read(path)? {
        Read::Missing => Map::new(),
        Read::Good(map) => map,
        Read::Damaged(_, why) => {
            tracing::warn!(path = %path.display(), why, "the settings cannot be read, and the defaults are used");
            Map::new()
        }
    })
}

/// The settings as the page reads them at the start, and what was set
/// aside, if the file was damaged.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Loaded {
    pub settings: Map<String, Value>,
    pub set_aside: Option<SetAside>,
}

/// A damaged file of settings that was set aside.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SetAside {
    /// Where it is now.
    pub path: String,
    /// Why it could not be read.
    pub reason: String,
    /// Whether the id of the person could be read from it, and is kept.
    pub person_kept: bool,
}

/// The settings, with a damaged file set aside: see the head of the module.
/// That it could not be set aside is an error, lest it be written over.
pub fn load_or_set_aside(path: &Path) -> Result<Loaded> {
    match read(path)? {
        Read::Missing => Ok(Loaded { settings: Map::new(), set_aside: None }),
        Read::Good(settings) => Ok(Loaded { settings, set_aside: None }),
        Read::Damaged(text, reason) => {
            let mut name = path.file_name().unwrap_or_default().to_os_string();
            name.push(format!(".broken-{}", stamp(time::OffsetDateTime::now_utc())));
            let aside = path.with_file_name(name);
            if let Err(e) = std::fs::rename(path, &aside) {
                tracing::warn!(path = %path.display(), reason, %e, "the settings cannot be read, nor set aside");
                return Err(Error::io(tr!("io-reading", path = path), e));
            }
            let mut settings = Map::new();
            let person = person_in(&text);
            if let Some(person) = &person {
                settings.insert("person".into(), Value::String(person.clone()));
            }
            tracing::warn!(
                path = %path.display(),
                aside = %aside.display(),
                reason,
                person_kept = person.is_some(),
                "the settings cannot be read, and are set aside; the defaults are used"
            );
            Ok(Loaded {
                settings,
                set_aside: Some(SetAside { path: aside.display().to_string(), reason, person_kept: person.is_some() }),
            })
        }
    }
}

/// The time a file is set aside at, in its name: `20261018T143000Z`.
fn stamp(t: time::OffsetDateTime) -> String {
    format!(
        "{:04}{:02}{:02}T{:02}{:02}{:02}Z",
        t.year(),
        u8::from(t.month()),
        t.day(),
        t.hour(),
        t.minute(),
        t.second()
    )
}

/// The id of the person in what is left of a damaged file: the string after
/// a `"person":`, if it is one the page could have made (letters, digits and
/// dashes, as a uuid has).
fn person_in(text: &str) -> Option<String> {
    let mut rest = text;
    while let Some(at) = rest.find("\"person\"") {
        rest = &rest[at + "\"person\"".len()..];
        let Some(after) = rest.trim_start().strip_prefix(':') else { continue };
        let Some(value) = after.trim_start().strip_prefix('"') else { continue };
        let end = value.find('"')?;
        let id = &value[..end];
        if !id.is_empty() && id.len() <= 64 && id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-') {
            return Some(id.to_owned());
        }
    }
    None
}

pub fn save(path: &Path, settings: &Map<String, Value>) -> Result<()> {
    let text = serde_json::to_string_pretty(settings)?;
    write_atomic(path, text.as_bytes())
}

/// A string setting, when set and not empty.
pub fn string(settings: &Map<String, Value>, key: &str) -> Option<String> {
    settings.get(key).and_then(Value::as_str).map(str::trim).filter(|s| !s.is_empty()).map(str::to_owned)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn set_aside_in(dir: &Path) -> Vec<String> {
        let mut names: Vec<String> = std::fs::read_dir(dir)
            .unwrap()
            .map(|e| e.unwrap().file_name().to_string_lossy().into_owned())
            .filter(|n| n.starts_with("settings.json.broken-"))
            .collect();
        names.sort();
        names
    }

    #[test]
    fn round_trip_and_damage() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("settings.json");
        assert!(load(&path).unwrap().is_empty());
        assert!(load_or_set_aside(&path).unwrap().set_aside.is_none());

        let mut map = Map::new();
        map.insert("theme".into(), Value::String("dark".into()));
        save(&path, &map).unwrap();
        assert_eq!(string(&load(&path).unwrap(), "theme").as_deref(), Some("dark"));
        let loaded = load_or_set_aside(&path).unwrap();
        assert!(loaded.set_aside.is_none());
        assert_eq!(string(&loaded.settings, "theme").as_deref(), Some("dark"));

        // A reader that only looks gets the defaults, and leaves the file be.
        std::fs::write(&path, "{ not json").unwrap();
        assert!(load(&path).unwrap().is_empty());
        assert!(path.exists());
        assert!(set_aside_in(dir.path()).is_empty());
    }

    #[test]
    fn a_damaged_file_is_set_aside_with_the_person_kept() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("settings.json");
        // A missing comma, after a hand edit.
        let text = "{\n  \"theme\": \"dark\"\n  \"person\": \"0b8e7c1e-4f9a-4c3e-9d2b-7a6f5e4d3c2b\",\n  \"language\": \"nb\"\n}";
        std::fs::write(&path, text).unwrap();

        let loaded = load_or_set_aside(&path).unwrap();
        let aside = loaded.set_aside.expect("set aside");
        assert!(aside.person_kept);
        assert!(!aside.reason.is_empty());
        assert_eq!(string(&loaded.settings, "person").as_deref(), Some("0b8e7c1e-4f9a-4c3e-9d2b-7a6f5e4d3c2b"));
        assert_eq!(loaded.settings.len(), 1, "nothing but the person is taken from a damaged file");

        // The file is gone from its place, and what it held is beside it, whole.
        assert!(!path.exists());
        let names = set_aside_in(dir.path());
        assert_eq!(names.len(), 1);
        assert_eq!(aside.path, dir.path().join(&names[0]).display().to_string());
        assert_eq!(std::fs::read_to_string(&aside.path).unwrap(), text);

        // The next start finds no settings, and sets nothing more aside.
        assert!(load_or_set_aside(&path).unwrap().set_aside.is_none());
    }

    #[test]
    fn a_damaged_file_without_a_person() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("settings.json");
        for text in [&b"[1, 2]"[..], b"\xff\xfe not text", b"{\"person\": 7, \"person\": \"a b\""] {
            std::fs::write(&path, text).unwrap();
            let loaded = load_or_set_aside(&path).unwrap();
            let aside = loaded.set_aside.expect("set aside");
            assert!(!aside.person_kept);
            assert!(loaded.settings.is_empty());
            assert!(!path.exists());
            std::fs::remove_file(&aside.path).unwrap();
        }
    }

    #[test]
    fn the_person_read_from_what_is_left() {
        assert_eq!(person_in(r#"{"person" : "abc-123", "#).as_deref(), Some("abc-123"));
        assert_eq!(person_in(r#"{"name": "\"person\"", "person": "x1"}"#).as_deref(), Some("x1"));
        assert_eq!(person_in(r#"{"person": "x1"#), None);
        assert_eq!(person_in(r#"{"person": "with space"}"#), None);
        assert_eq!(person_in(r#"{"theme": "dark"}"#), None);
    }

    #[test]
    fn stamps() {
        assert_eq!(stamp(time::OffsetDateTime::UNIX_EPOCH), "19700101T000000Z");
    }
}
