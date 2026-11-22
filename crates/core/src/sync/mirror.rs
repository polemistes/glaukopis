//! What is no document on disk brought to be the same as a map of the home
//! document (record 0119): the folders, the settings, what the list shows
//! of each project.
//!
//! A store holds names and values, and so does its map. Two computers may
//! each have changed their store since they last met, so a difference
//! between a store and its map says nothing by itself: the name may have
//! changed here, or elsewhere. What tells them apart is what the store and
//! the map agreed on when they last met, kept in `sync/base/<name>.json`.
//!
//! 1. `outward`: what the store says now and did not when they last agreed
//!    changed here, and is written into the map.
//! 2. The home document is exchanged with the server's.
//! 3. `inward`: where the map says another thing than the store, and the
//!    store has not changed since step 1, it changed elsewhere, and is
//!    written to the store. What they then agree on is kept.
//!
//! Where the same name changed on both, the one written into the map last
//! stands on both.
//!
//! A store and a map that have never met are not merged so: there, where
//! both say something of the same name, the map's stands, and the store adds
//! only the names the map lacks. A computer that joins a home takes the
//! home's settings, and does not write its own over them.

use std::collections::BTreeMap;

use crate::error::Result;

use super::home::HomeDoc;
use super::kept::Kept;

/// A store that is brought to be the same as a map of the home document.
pub trait Store {
    /// The name of its map, under which what is agreed is kept too.
    fn name(&self) -> &'static str;

    /// What it holds now, as names and values.
    fn read(&self) -> Result<BTreeMap<String, String>>;

    /// Whether the store can say anything of a name now. What is said of a
    /// project is said by no one on a computer where the project is not:
    /// that the name is missing there does not mean it was taken out, and
    /// what the map says of it cannot be written there yet.
    fn speaks_of(&self, _name: &str) -> bool {
        true
    }

    /// Writes what changed elsewhere: a value set, or with none, the name
    /// taken out. What cannot be written now is left as it is, and is tried
    /// again when they next meet.
    fn write(&self, changes: &BTreeMap<String, Option<String>>) -> Result<()>;
}

/// What a store held when what changed in it was written into its map.
pub struct Outward {
    here: BTreeMap<String, String>,
}

/// Step 1. Returns what the store held, for `inward`, and whether anything
/// was written into the map.
pub fn outward(home: &HomeDoc, kept: &Kept, store: &dyn Store) -> Result<(Outward, bool)> {
    let here = store.read()?;
    let map = home.map(store.name());
    let mut changes = BTreeMap::new();
    match kept.base(store.name())? {
        // They have never met: what the map says stands.
        None => {
            for (name, value) in &here {
                if !map.contains_key(name) {
                    changes.insert(name.clone(), Some(value.clone()));
                }
            }
        }
        Some(agreed) => {
            for (name, value) in &here {
                if agreed.get(name) != Some(value) {
                    changes.insert(name.clone(), Some(value.clone()));
                }
            }
            for name in agreed.keys() {
                if !here.contains_key(name) && store.speaks_of(name) {
                    changes.insert(name.clone(), None);
                }
            }
        }
    }
    let wrote = home.set(store.name(), &changes);
    Ok((Outward { here }, wrote))
}

/// Step 3: what changed elsewhere is written to the store, and what the two
/// agree on is kept.
pub fn inward(home: &HomeDoc, kept: &Kept, store: &dyn Store, outward: Outward) -> Result<()> {
    let map = home.map(store.name());
    let now = store.read()?;
    // What changed here while the home document was away is left as it is:
    // it goes into the map when they next meet.
    let unchanged = |name: &String| now.get(name) == outward.here.get(name);
    let mut changes = BTreeMap::new();
    for (name, value) in &map {
        if now.get(name) != Some(value) && store.speaks_of(name) && unchanged(name) {
            changes.insert(name.clone(), Some(value.clone()));
        }
    }
    for name in now.keys() {
        if !map.contains_key(name) && unchanged(name) {
            changes.insert(name.clone(), None);
        }
    }
    let after = if changes.is_empty() {
        now.clone()
    } else {
        store.write(&changes)?;
        store.read()?
    };
    let before = kept.base(store.name())?.unwrap_or_default();
    let mut agreed = BTreeMap::new();
    for name in after.keys().chain(map.keys()) {
        let (says, said) = (after.get(name), map.get(name));
        let keep = if says == said {
            says
        } else if now.get(name) != outward.here.get(name) {
            // Changed here meanwhile: what was agreed before stands, so
            // that the change is seen as one when they next meet.
            before.get(name)
        } else {
            // Could not be written: the store's own stands as agreed, so
            // that it is not taken for a change made here, and the map's
            // is tried again.
            says
        };
        if let Some(value) = keep {
            agreed.insert(name.clone(), value.clone());
        }
    }
    kept.keep_base(store.name(), &agreed)
}

#[cfg(test)]
pub(crate) mod tests {
    use super::*;
    use std::cell::RefCell;
    use std::collections::BTreeSet;

    /// A store in memory.
    #[derive(Default)]
    pub(crate) struct Shelf {
        pub holds: RefCell<BTreeMap<String, String>>,
        /// Names it cannot write now.
        pub stuck: RefCell<BTreeSet<String>>,
        /// Names it can say nothing of.
        pub silent: RefCell<BTreeSet<String>>,
    }

    impl Shelf {
        pub fn put(&self, name: &str, value: &str) {
            self.holds.borrow_mut().insert(name.to_owned(), value.to_owned());
        }

        pub fn take(&self, name: &str) {
            self.holds.borrow_mut().remove(name);
        }

        pub fn get(&self, name: &str) -> Option<String> {
            self.holds.borrow().get(name).cloned()
        }
    }

    impl Store for Shelf {
        fn name(&self) -> &'static str {
            "shelf"
        }

        fn read(&self) -> Result<BTreeMap<String, String>> {
            Ok(self.holds.borrow().clone())
        }

        fn speaks_of(&self, name: &str) -> bool {
            !self.silent.borrow().contains(name)
        }

        fn write(&self, changes: &BTreeMap<String, Option<String>>) -> Result<()> {
            for (name, value) in changes {
                if self.stuck.borrow().contains(name) {
                    continue;
                }
                match value {
                    Some(value) => self.holds.borrow_mut().insert(name.clone(), value.clone()),
                    None => self.holds.borrow_mut().remove(name),
                };
            }
            Ok(())
        }
    }

    /// A computer: its store, its copy of the home document, and what it keeps.
    struct Computer {
        shelf: Shelf,
        home: HomeDoc,
        kept: Kept,
        _tmp: tempfile::TempDir,
    }

    impl Computer {
        fn new() -> Self {
            let tmp = tempfile::tempdir().unwrap();
            Computer { shelf: Shelf::default(), home: HomeDoc::new(), kept: Kept::at(tmp.path()), _tmp: tmp }
        }

        /// A round: with `server` standing for the server's home document.
        fn meet(&self, server: &HomeDoc) {
            self.home.take_in(&server.whole()).unwrap();
            let (outward, _) = outward(&self.home, &self.kept, &self.shelf).unwrap();
            server.take_in(&self.home.whole()).unwrap();
            self.home.take_in(&server.whole()).unwrap();
            inward(&self.home, &self.kept, &self.shelf, outward).unwrap();
        }
    }

    #[test]
    fn what_changes_on_one_computer_is_on_the_other() {
        let server = HomeDoc::new();
        let (a, b) = (Computer::new(), Computer::new());
        a.shelf.put("theme", "dark");
        a.shelf.put("language", "nb");
        a.meet(&server);
        b.meet(&server);
        assert_eq!(b.shelf.get("theme").as_deref(), Some("dark"));
        b.shelf.put("theme", "light");
        b.shelf.take("language");
        b.meet(&server);
        a.meet(&server);
        assert_eq!(a.shelf.get("theme").as_deref(), Some("light"));
        assert_eq!(a.shelf.get("language"), None, "what was taken out on one is taken out on the other");
    }

    #[test]
    fn changed_on_both_one_stands_on_both() {
        let server = HomeDoc::new();
        let (a, b) = (Computer::new(), Computer::new());
        a.shelf.put("theme", "dark");
        a.shelf.put("size", "1");
        a.meet(&server);
        b.meet(&server);
        // Apart: each changes the theme; one changes the size as well.
        a.shelf.put("theme", "sepia");
        b.shelf.put("theme", "light");
        b.shelf.put("size", "2");
        a.meet(&server);
        b.meet(&server);
        a.meet(&server);
        assert_eq!(a.shelf.get("theme"), b.shelf.get("theme"));
        assert_eq!(a.shelf.get("theme").as_deref(), Some("light"), "the one written into the map last");
        assert_eq!(a.shelf.get("size").as_deref(), Some("2"), "what only one changed is that one's");
    }

    #[test]
    fn at_the_first_meeting_the_homes_stands_and_what_it_lacks_is_added() {
        let server = HomeDoc::new();
        let (a, b) = (Computer::new(), Computer::new());
        a.shelf.put("theme", "dark");
        a.meet(&server);
        b.shelf.put("theme", "light");
        b.shelf.put("font", "serif");
        b.meet(&server);
        assert_eq!(b.shelf.get("theme").as_deref(), Some("dark"), "the home's stands");
        a.meet(&server);
        assert_eq!(a.shelf.get("theme").as_deref(), Some("dark"));
        assert_eq!(a.shelf.get("font").as_deref(), Some("serif"), "what the home lacked is added");
    }

    #[test]
    fn what_cannot_be_written_is_tried_again_and_not_taken_for_a_change_made_here() {
        let server = HomeDoc::new();
        let (a, b) = (Computer::new(), Computer::new());
        a.shelf.put("place", "f1");
        a.meet(&server);
        b.shelf.stuck.borrow_mut().insert("place".to_owned());
        b.meet(&server);
        assert_eq!(b.shelf.get("place"), None, "it could not be written");
        b.meet(&server);
        a.meet(&server);
        assert_eq!(a.shelf.get("place").as_deref(), Some("f1"), "and that was not taken for its removal");
        b.shelf.stuck.borrow_mut().clear();
        b.meet(&server);
        assert_eq!(b.shelf.get("place").as_deref(), Some("f1"), "written when it could be");
    }

    #[test]
    fn what_a_store_cannot_speak_of_is_neither_written_nor_taken_out() {
        let server = HomeDoc::new();
        let (a, b) = (Computer::new(), Computer::new());
        a.shelf.put("project", "in a folder");
        a.meet(&server);
        // The other computer does not have the project yet.
        b.shelf.silent.borrow_mut().insert("project".to_owned());
        b.meet(&server);
        assert_eq!(b.shelf.get("project"), None);
        b.meet(&server);
        assert_eq!(server.get("shelf", "project").as_deref(), Some("in a folder"));
        // And one that had it, and has it no more, does not take it out for the others.
        a.shelf.take("project");
        a.shelf.silent.borrow_mut().insert("project".to_owned());
        a.meet(&server);
        assert_eq!(server.get("shelf", "project").as_deref(), Some("in a folder"));
    }

    #[test]
    fn what_changes_here_while_the_home_is_away_is_not_written_over() {
        let server = HomeDoc::new();
        let (a, b) = (Computer::new(), Computer::new());
        a.shelf.put("theme", "dark");
        a.meet(&server);
        b.meet(&server);
        a.shelf.put("theme", "sepia");
        a.meet(&server);
        // The other computer meets the home, and its theme is changed while it does.
        b.home.take_in(&server.whole()).unwrap();
        let (outward, _) = outward(&b.home, &b.kept, &b.shelf).unwrap();
        b.shelf.put("theme", "light");
        inward(&b.home, &b.kept, &b.shelf, outward).unwrap();
        assert_eq!(b.shelf.get("theme").as_deref(), Some("light"), "left as it was changed");
        b.meet(&server);
        a.meet(&server);
        assert_eq!(a.shelf.get("theme").as_deref(), Some("light"), "and it goes into the map the next time");
    }
}
