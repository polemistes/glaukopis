//! The settings that follow the writer from computer to computer, as a
//! store that is brought to be the same as a map of the home document
//! (`mirror`, record 0120).
//!
//! A setting follows where it is the writer's: who they are, the language,
//! the look they chose, how they like to write. It stays where it belongs
//! to the computer: its screen, the programs installed on it, and where
//! things were left. Both lists are here, by name. A setting that is in
//! neither is not sent anywhere; a test of the interface
//! (`src/lib/sync/settings.test.ts`) fails when the interface has a setting
//! that is in neither, so that whoever adds one decides which it is.

use std::collections::BTreeMap;
use std::path::PathBuf;

use serde_json::{Map, Value};

use crate::error::Result;

use super::mirror::Store;

/// The settings that follow the writer.
pub const FOLLOW: &[&str] = &[
    // Who the writer is: the person as the history of a project knows them, and what they say of themselves.
    "person",
    "displayName",
    "firstName",
    "lastName",
    "organization",
    "position",
    "address",
    "phone",
    "orcid",
    "contactEmail",
    // The languages, and the look chosen.
    "language",
    "textLanguage",
    "theme",
    "ownTheme",
    // How the writer works.
    "textDepth",
    "newProjectView",
    "defaultStyle",
    "defaultFormat",
    "defaultTemplate",
    "kinds",
    "passageKinds",
    "found",
    "spelling",
    "pageChips",
    "headingNumbers",
    "headingNumbersText",
    "headingNumbersDiagram",
    "enterBreaks",
    "chatReadShown",
    "newVersions",
    // How text is read from scans, apart from what is installed.
    "ocrDpi",
    "ocrLayout",
    "ocrContrast",
    // The servers the writer uses.
    "server",
    "languagesServer",
];

/// The settings that stay on each computer.
pub const STAY: &[&str] = &[
    // The screen.
    "window",
    "arrangement",
    "projectsPaneWidth",
    "librarySideWidth",
    "libraryDetailWidth",
    "notebookListWidth",
    "interfaceSize",
    "textSize",
    "projectsList",
    // What is installed.
    "editorFont",
    "pandocPath",
    "tesseractPath",
    "ocrLanguages",
    // Where things were left.
    "lastPlace",
    "recentProjects",
    "recentEmojis",
    "notebookView",
    "filesView",
    "versionTold",
];

/// The file of the settings, as the store of those that follow.
pub struct Settings {
    pub path: PathBuf,
}

impl Store for Settings {
    fn name(&self) -> &'static str {
        "settings"
    }

    fn read(&self) -> Result<BTreeMap<String, String>> {
        let settings = crate::settings::load(&self.path)?;
        Ok(FOLLOW
            .iter()
            .filter_map(|name| {
                let value = settings.get(*name).filter(|v| !v.is_null())?;
                Some(((*name).to_owned(), value.to_string()))
            })
            .collect())
    }

    fn write(&self, changes: &BTreeMap<String, Option<String>>) -> Result<()> {
        let mut changed = Map::new();
        for (name, value) in changes {
            // What another version put there under a name that does not follow here is left alone.
            if !FOLLOW.contains(&name.as_str()) {
                continue;
            }
            let value = match value.as_deref().map(serde_json::from_str::<Value>) {
                Some(Ok(value)) => value,
                Some(Err(_)) => continue,
                // Taken out: the setting is as it is where none is chosen.
                None => Value::Null,
            };
            changed.insert(name.clone(), value);
        }
        if changed.is_empty() {
            return Ok(());
        }
        crate::settings::merge(&self.path, &changed)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn no_setting_both_follows_and_stays() {
        for name in FOLLOW {
            assert!(!STAY.contains(name), "{name} is in both lists");
        }
        let mut all: Vec<&str> = FOLLOW.iter().chain(STAY).copied().collect();
        all.sort();
        let count = all.len();
        all.dedup();
        assert_eq!(all.len(), count, "a setting is listed twice");
    }

    #[test]
    fn the_settings_that_follow_are_read_and_written_and_the_others_left() {
        let tmp = tempfile::tempdir().unwrap();
        let path = tmp.path().join("settings.json");
        let mut kept = Map::new();
        kept.insert("theme".into(), json!("dark"));
        kept.insert("ownTheme".into(), json!({ "paper": "#fff", "ink": "#000" }));
        kept.insert("projectsPaneWidth".into(), json!(300));
        kept.insert("person".into(), json!("p-1"));
        crate::settings::save(&path, &kept).unwrap();
        let store = Settings { path: path.clone() };
        let read = store.read().unwrap();
        assert_eq!(read.len(), 3, "what belongs to the computer is not read: {read:?}");
        assert_eq!(read["theme"], "\"dark\"");

        store
            .write(&BTreeMap::from([
                ("theme".to_owned(), None),
                ("person".to_owned(), Some("\"p-2\"".to_owned())),
                ("language".to_owned(), Some("\"nb\"".to_owned())),
                ("projectsPaneWidth".to_owned(), Some("999".to_owned())),
                ("enterBreaks".to_owned(), Some("not json".to_owned())),
            ]))
            .unwrap();
        let now = crate::settings::load(&path).unwrap();
        assert_eq!(now.get("theme"), None);
        assert_eq!(now["person"], json!("p-2"));
        assert_eq!(now["language"], json!("nb"));
        assert_eq!(now["projectsPaneWidth"], json!(300), "what stays is not written from elsewhere");
        assert_eq!(now.get("enterBreaks"), None);
        // What was written reads as it was written: the two agree.
        assert_eq!(store.read().unwrap()["ownTheme"], read["ownTheme"]);
    }
}
