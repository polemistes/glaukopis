//! The home document (record 0120): what a writer's computers hold that is
//! no document on disk, made one for the journey. It is a Yjs document of
//! maps whose values are strings, kept here in `sync/home.bin` and brought
//! to be the same as the server's by the exchange, as any document is.
//!
//! | Map | Name | Value |
//! | --- | --- | --- |
//! | `meta` | `form` | the form of the home document: `"1"` |
//! | `folders` | `<folder>/name`, `/parent`, `/order` | a folder of projects, field by field |
//! | `places` | `<project>` | the folder the project is in, or `""` |
//! | `favourites` | `<project>` | where it stands among the favourites |
//! | `facts` | `<project>` | what the list shows of it |
//! | `shared` | `<project>` | how it is shared, with the key |
//! | `gone` | `<project>` | deleted: when, and the digest the deleter last saw |
//! | `settings` | the setting's name | its value |
//!
//! Each name is one value that the last to write wins: a folder renamed on
//! one computer and moved on another is both, since its name and its parent
//! are names of their own. The stores on disk are brought to be the same as
//! their maps by `mirror`.
//!
//! The document is made by the core, with a client of its own for each run
//! of the application, as the interface has one for each document it opens:
//! a client kept from run to run would write over its own changes should
//! the folder of the data ever be put back as it was earlier.
//!
//! The library's document (`library`) is a document of the same kind, kept
//! beside this one and exchanged by the same steps: the library may hold
//! thousands of references, and is not put into the home document.

use std::collections::BTreeMap;

use yrs::updates::decoder::Decode;
use yrs::updates::encoder::Encode;
use yrs::{Any, Doc, Map, Out, ReadTxn, StateVector, Transact, Update};

use crate::error::{Error, Result};
use crate::tr;

/// The form of the home document this version writes and reads. Raised
/// when a version before could not write into it without harm; one that
/// does not know the form of a home leaves it alone.
pub const HOME_FORM: u32 = 1;

pub struct HomeDoc {
    doc: Doc,
}

fn unread(error: impl std::fmt::Display) -> Error {
    Error::invalid(tr!("core-sync-not-a-change", why = error.to_string()))
}

impl Default for HomeDoc {
    fn default() -> Self {
        Self::new()
    }
}

impl HomeDoc {
    /// An empty home document.
    pub fn new() -> Self {
        HomeDoc { doc: Doc::new() }
    }

    /// The home document as it was kept; an empty one where none was.
    pub fn load(state: Option<&[u8]>) -> Result<Self> {
        let home = Self::new();
        if let Some(state) = state.filter(|s| !s.is_empty()) {
            home.take_in(state)?;
        }
        Ok(home)
    }

    /// All of it, as one update.
    pub fn whole(&self) -> Vec<u8> {
        self.doc.transact().encode_state_as_update_v1(&StateVector::default())
    }

    /// What it holds beyond what one at the state vector `since` has; all of
    /// it where there is none.
    pub fn beyond(&self, since: Option<&[u8]>) -> Result<Vec<u8>> {
        let since = match since {
            Some(bytes) => StateVector::decode_v1(bytes).map_err(unread)?,
            None => StateVector::default(),
        };
        Ok(self.doc.transact().encode_state_as_update_v1(&since))
    }

    pub fn vector(&self) -> Vec<u8> {
        self.doc.transact().state_vector().encode_v1()
    }

    /// Takes in what another computer wrote.
    pub fn take_in(&self, update: &[u8]) -> Result<()> {
        let update = Update::decode_v1(update).map_err(unread)?;
        self.doc.transact_mut().apply_update(update).map_err(unread)
    }

    /// A map, as names and values. What is no string there was written by
    /// no version of this, and is passed over.
    pub fn map(&self, name: &str) -> BTreeMap<String, String> {
        let map = self.doc.get_or_insert_map(name);
        let txn = self.doc.transact();
        map.iter(&txn)
            .filter_map(|(key, value)| match value {
                Out::Any(Any::String(text)) => Some((key.to_owned(), text.to_string())),
                _ => None,
            })
            .collect()
    }

    pub fn get(&self, name: &str, key: &str) -> Option<String> {
        let map = self.doc.get_or_insert_map(name);
        match map.get(&self.doc.transact(), key) {
            Some(Out::Any(Any::String(text))) => Some(text.to_string()),
            _ => None,
        }
    }

    /// Writes into a map: a value set, or with none, the name taken out.
    /// What the map says already is not written again. Whether anything was
    /// written.
    pub fn set(&self, name: &str, changes: &BTreeMap<String, Option<String>>) -> bool {
        let map = self.doc.get_or_insert_map(name);
        let mut txn = self.doc.transact_mut();
        let mut wrote = false;
        for (key, value) in changes {
            let said = match map.get(&txn, key) {
                Some(Out::Any(Any::String(text))) => Some(text.to_string()),
                _ => None,
            };
            match value {
                Some(value) if said.as_deref() != Some(value) => {
                    map.insert(&mut txn, key.as_str(), value.as_str());
                    wrote = true;
                }
                None if map.contains_key(&txn, key) => {
                    map.remove(&mut txn, key);
                    wrote = true;
                }
                _ => {}
            }
        }
        wrote
    }

    /// Sets one name of a map, or takes it out. Whether anything was written.
    pub fn put(&self, name: &str, key: &str, value: Option<&str>) -> bool {
        self.set(name, &BTreeMap::from([(key.to_owned(), value.map(str::to_owned))]))
    }

    /// The form the document says it is in; the first where it says none.
    pub fn form(&self) -> u32 {
        self.get("meta", "form").and_then(|f| f.parse().ok()).unwrap_or(1).max(1)
    }

    /// Says the form of the document, where none is said: done by the
    /// computer that makes it (`HOME_FORM` of the home document).
    pub fn begin(&self, form: u32) -> bool {
        match self.get("meta", "form") {
            Some(_) => false,
            None => self.put("meta", "form", Some(&form.to_string())),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn changes(pairs: &[(&str, Option<&str>)]) -> BTreeMap<String, Option<String>> {
        pairs.iter().map(|(k, v)| ((*k).to_owned(), v.map(str::to_owned))).collect()
    }

    #[test]
    fn what_is_written_into_a_map_is_read_and_kept() {
        let home = HomeDoc::new();
        assert!(home.begin(HOME_FORM));
        assert!(!home.begin(HOME_FORM), "said once");
        assert_eq!(home.form(), 1);
        assert!(home.set("settings", &changes(&[("theme", Some("\"dark\"")), ("language", Some("\"nb\""))])));
        assert!(!home.set("settings", &changes(&[("theme", Some("\"dark\""))])), "what it says already is not written");
        assert!(home.set("settings", &changes(&[("language", None)])));
        assert!(!home.set("settings", &changes(&[("language", None)])), "nor what is not there taken out");
        assert_eq!(home.map("settings"), BTreeMap::from([("theme".to_owned(), "\"dark\"".to_owned())]));

        let again = HomeDoc::load(Some(&home.whole())).unwrap();
        assert_eq!(again.map("settings"), home.map("settings"));
        assert_eq!(again.get("meta", "form").as_deref(), Some("1"));
        assert!(HomeDoc::load(None).unwrap().map("settings").is_empty());
    }

    #[test]
    fn two_computers_that_wrote_apart_come_to_hold_the_same() {
        let a = HomeDoc::new();
        a.put("folders", "f/name", Some("Drafts"));
        a.put("folders", "f/parent", Some(""));
        let b = HomeDoc::load(Some(&a.whole())).unwrap();
        let since = a.vector();
        // One renames the folder, the other moves it, and takes a setting out.
        a.put("folders", "f/name", Some("Old drafts"));
        a.put("settings", "theme", Some("\"dark\""));
        b.put("folders", "f/parent", Some("g"));
        let from_a = a.beyond(Some(&since)).unwrap();
        let from_b = b.beyond(Some(&since)).unwrap();
        a.take_in(&from_b).unwrap();
        b.take_in(&from_a).unwrap();
        assert_eq!(a.map("folders"), b.map("folders"));
        assert_eq!(a.get("folders", "f/name").as_deref(), Some("Old drafts"));
        assert_eq!(a.get("folders", "f/parent").as_deref(), Some("g"));
        // A name taken out is a deletion alone, and is in what goes beyond a state vector all the same.
        let since = b.vector();
        b.put("settings", "theme", None);
        a.take_in(&b.beyond(Some(&since)).unwrap()).unwrap();
        assert_eq!(a.get("settings", "theme"), None);
    }
}
