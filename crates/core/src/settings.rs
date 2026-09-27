//! The user's settings, kept as JSON in the data directory.
//!
//! The core does not interpret most of them: the interface owns their meaning.
//! They are stored as given, so a newer version's settings survive an older one.

use std::path::Path;

use serde_json::{Map, Value};

use crate::error::{IoContext, Result};
use crate::fsutil::write_atomic;

pub fn load(path: &Path) -> Result<Map<String, Value>> {
    match std::fs::read_to_string(path) {
        Ok(text) => match serde_json::from_str::<Value>(&text) {
            Ok(Value::Object(map)) => Ok(map),
            // A damaged settings file must not stop the application.
            _ => {
                tracing::warn!(path = %path.display(), "settings unreadable, using defaults");
                Ok(Map::new())
            }
        },
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(Map::new()),
        Err(e) => Err(e).context(|| format!("reading {}", path.display())),
    }
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

    #[test]
    fn round_trip_and_damage() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("settings.json");
        assert!(load(&path).unwrap().is_empty());

        let mut map = Map::new();
        map.insert("theme".into(), Value::String("dark".into()));
        save(&path, &map).unwrap();
        assert_eq!(string(&load(&path).unwrap(), "theme").as_deref(), Some("dark"));

        std::fs::write(&path, "{ not json").unwrap();
        assert!(load(&path).unwrap().is_empty());
    }
}
