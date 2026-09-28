//! Collections: named sets of links to entries. An entry in a collection is
//! the entry in the library, not a copy of it.

use std::path::Path;

use serde::{Deserialize, Serialize};

use crate::error::{Error, IoContext, Result};
use crate::fsutil::write_atomic;
use crate::tr;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Collection {
    pub id: String,
    pub name: String,
    /// The collection this one lies within, if any.
    #[serde(default)]
    pub parent: Option<String>,
    /// Ids of entries, in the order they were added.
    #[serde(default)]
    pub entries: Vec<String>,
    #[serde(default)]
    pub created: String,
}

#[derive(Debug, Default, Serialize, Deserialize)]
struct CollectionsFile {
    #[serde(default)]
    collections: Vec<Collection>,
}

#[derive(Debug, Default)]
pub struct Collections {
    pub list: Vec<Collection>,
}

impl Collections {
    pub fn load(path: &Path) -> Result<Self> {
        match std::fs::read_to_string(path) {
            Ok(text) => {
                let file: CollectionsFile = serde_json::from_str(&text)
                    .map_err(|e| Error::Parse { path: path.to_owned(), message: e.to_string() })?;
                let mut c = Collections { list: file.collections };
                c.repair();
                Ok(c)
            }
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(Collections::default()),
            Err(e) => Err(e).context(|| tr!("io-reading", path = path)),
        }
    }

    pub fn save(&self, path: &Path) -> Result<()> {
        let file = CollectionsFile { collections: self.list.clone() };
        write_atomic(path, serde_json::to_string_pretty(&file)?.as_bytes())
    }

    /// A parent that does not exist, or a cycle, makes a collection a top-level one.
    fn repair(&mut self) {
        let ids: Vec<String> = self.list.iter().map(|c| c.id.clone()).collect();
        for c in &mut self.list {
            if c.parent.as_ref().is_some_and(|p| !ids.contains(p) || *p == c.id) {
                c.parent = None;
            }
        }
        for id in ids {
            if self.is_within(&id, &id)
                && let Some(c) = self.get_mut(&id)
            {
                c.parent = None;
            }
        }
    }

    pub fn get(&self, id: &str) -> Option<&Collection> {
        self.list.iter().find(|c| c.id == id)
    }

    fn get_mut(&mut self, id: &str) -> Option<&mut Collection> {
        self.list.iter_mut().find(|c| c.id == id)
    }

    fn require_mut(&mut self, id: &str) -> Result<&mut Collection> {
        self.get_mut(id).ok_or_else(|| Error::not_found(tr!("core-library-the-collection")))
    }

    /// Whether `id` lies within `ancestor`, at any depth.
    fn is_within(&self, id: &str, ancestor: &str) -> bool {
        let mut current = self.get(id).and_then(|c| c.parent.clone());
        let mut steps = 0;
        while let Some(p) = current {
            if p == ancestor {
                return true;
            }
            steps += 1;
            if steps > self.list.len() {
                return true; // a cycle
            }
            current = self.get(&p).and_then(|c| c.parent.clone());
        }
        false
    }

    /// The collection and all that lie within it.
    pub fn with_descendants(&self, id: &str) -> Vec<String> {
        let mut out = vec![id.to_owned()];
        let mut i = 0;
        while i < out.len() {
            let parent = out[i].clone();
            for c in &self.list {
                if c.parent.as_deref() == Some(&parent) && !out.contains(&c.id) {
                    out.push(c.id.clone());
                }
            }
            i += 1;
        }
        out
    }

    fn check_name(&self, name: &str, parent: Option<&str>, except: Option<&str>) -> Result<String> {
        let name = name.trim();
        if name.is_empty() {
            return Err(Error::invalid(tr!("core-library-collection-needs-name")));
        }
        let clash = self.list.iter().any(|c| {
            Some(c.id.as_str()) != except
                && c.parent.as_deref() == parent
                && c.name.to_lowercase() == name.to_lowercase()
        });
        if clash {
            return Err(Error::invalid(tr!("core-library-collection-exists", name = name)));
        }
        Ok(name.to_owned())
    }

    pub fn create(&mut self, name: &str, parent: Option<&str>, now: &str) -> Result<Collection> {
        if let Some(p) = parent
            && self.get(p).is_none()
        {
            return Err(Error::not_found(tr!("core-library-the-collection-to-put-in")));
        }
        let name = self.check_name(name, parent, None)?;
        let c = Collection {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            parent: parent.map(str::to_owned),
            entries: Vec::new(),
            created: now.to_owned(),
        };
        self.list.push(c.clone());
        Ok(c)
    }

    pub fn rename(&mut self, id: &str, name: &str) -> Result<()> {
        let parent = self.get(id).ok_or_else(|| Error::not_found(tr!("core-library-the-collection")))?.parent.clone();
        let name = self.check_name(name, parent.as_deref(), Some(id))?;
        self.require_mut(id)?.name = name;
        Ok(())
    }

    pub fn move_to(&mut self, id: &str, parent: Option<&str>) -> Result<()> {
        let name = self.get(id).ok_or_else(|| Error::not_found(tr!("core-library-the-collection")))?.name.clone();
        if let Some(p) = parent {
            if p == id || self.is_within(p, id) {
                return Err(Error::invalid(tr!("core-library-collection-in-itself")));
            }
            if self.get(p).is_none() {
                return Err(Error::not_found(tr!("core-library-the-collection-to-move-to")));
            }
        }
        self.check_name(&name, parent, Some(id))?;
        self.require_mut(id)?.parent = parent.map(str::to_owned);
        Ok(())
    }

    /// Removes the collection and those within it. The entries stay in the library.
    pub fn delete(&mut self, id: &str) -> Result<()> {
        if self.get(id).is_none() {
            return Err(Error::not_found(tr!("core-library-the-collection")));
        }
        let doomed = self.with_descendants(id);
        self.list.retain(|c| !doomed.contains(&c.id));
        Ok(())
    }

    /// Returns how many were added; entries already there are not added twice.
    pub fn add_entries(&mut self, id: &str, entries: &[String]) -> Result<usize> {
        let c = self.require_mut(id)?;
        let mut added = 0;
        for e in entries {
            if !c.entries.contains(e) {
                c.entries.push(e.clone());
                added += 1;
            }
        }
        Ok(added)
    }

    pub fn remove_entries(&mut self, id: &str, entries: &[String]) -> Result<()> {
        let c = self.require_mut(id)?;
        c.entries.retain(|e| !entries.contains(e));
        Ok(())
    }

    /// When entries leave the library.
    pub fn forget_entries(&mut self, entries: &[String]) -> bool {
        let mut changed = false;
        for c in &mut self.list {
            let before = c.entries.len();
            c.entries.retain(|e| !entries.contains(e));
            changed |= c.entries.len() != before;
        }
        changed
    }

    /// When one entry is merged into another.
    pub fn replace_entry(&mut self, old: &str, new: &str) -> bool {
        let mut changed = false;
        for c in &mut self.list {
            if let Some(i) = c.entries.iter().position(|e| e == old) {
                changed = true;
                if c.entries.iter().any(|e| e == new) {
                    c.entries.remove(i);
                } else {
                    c.entries[i] = new.to_owned();
                }
            }
        }
        changed
    }

    /// The collections an entry is in.
    pub fn of_entry(&self, entry: &str) -> Vec<String> {
        self.list.iter().filter(|c| c.entries.iter().any(|e| e == entry)).map(|c| c.id.clone()).collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn nesting_and_names() {
        let mut c = Collections::default();
        let a = c.create("Homer", None, "").unwrap();
        let b = c.create("Iliad", Some(&a.id), "").unwrap();
        let d = c.create("Book 1", Some(&b.id), "").unwrap();
        assert!(c.create("homer", None, "").is_err());
        assert!(c.create("Homer", Some(&a.id), "").is_ok());
        assert!(c.create("  ", None, "").is_err());

        assert!(c.move_to(&a.id, Some(&d.id)).is_err());
        assert!(c.move_to(&a.id, Some(&a.id)).is_err());
        c.move_to(&d.id, None).unwrap();
        assert_eq!(c.get(&d.id).unwrap().parent, None);

        assert_eq!(c.with_descendants(&a.id).len(), 3);
        c.delete(&a.id).unwrap();
        assert_eq!(c.list.len(), 1);
    }

    #[test]
    fn entries_are_links() {
        let mut c = Collections::default();
        let a = c.create("A", None, "").unwrap();
        let b = c.create("B", None, "").unwrap();
        assert_eq!(c.add_entries(&a.id, &["1".into(), "2".into(), "1".into()]).unwrap(), 2);
        c.add_entries(&b.id, &["2".into(), "3".into()]).unwrap();
        assert_eq!(c.of_entry("2").len(), 2);

        assert!(c.replace_entry("3", "2"));
        assert_eq!(c.get(&b.id).unwrap().entries, vec!["2"]);
        assert!(c.replace_entry("1", "9"));
        assert_eq!(c.get(&a.id).unwrap().entries, vec!["9", "2"]);

        assert!(c.forget_entries(&["2".into()]));
        assert!(c.get(&b.id).unwrap().entries.is_empty());
    }

    #[test]
    fn a_damaged_file_is_repaired() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("collections.json");
        std::fs::write(
            &path,
            r#"{"collections":[
                {"id":"a","name":"A","parent":"b"},
                {"id":"b","name":"B","parent":"a"},
                {"id":"c","name":"C","parent":"gone"}]}"#,
        )
        .unwrap();
        let c = Collections::load(&path).unwrap();
        assert_eq!(c.get("c").unwrap().parent, None);
        assert!(!c.is_within("a", "a"));
        assert!(!c.is_within("b", "b"));
    }
}
