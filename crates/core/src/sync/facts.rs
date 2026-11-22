//! What is kept about a project beside its document, as stores that are
//! brought to be the same as maps of the home document (`mirror`): what the
//! list of projects shows of it, and how it is shared (record 0119).

use std::collections::{BTreeMap, BTreeSet};

use serde::{Deserialize, Serialize};

use crate::error::Result;
use crate::projects::{MapInfo, Projects, Sharing};

use super::mirror::Store;

/// What the list shows of a project, which the interface says when it saves
/// the project's whole state: on a computer where the project has not been
/// opened since it changed, nobody else could say it.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
struct Shown {
    name: String,
    description: String,
    maps: Vec<MapInfo>,
    words: usize,
    references: usize,
    pictures: Vec<String>,
    cited: Option<Vec<String>>,
}

pub struct Facts<'a> {
    pub projects: &'a Projects,
    /// The projects this computer may speak of: see `Store::speaks_of`.
    pub met: &'a BTreeSet<String>,
}

impl Store for Facts<'_> {
    fn name(&self) -> &'static str {
        "facts"
    }

    fn read(&self) -> Result<BTreeMap<String, String>> {
        let mut out = BTreeMap::new();
        for info in self.projects.list()? {
            if !self.met.contains(&info.id) {
                continue;
            }
            let shown = Shown {
                name: info.name,
                description: info.description,
                maps: info.maps,
                words: info.words,
                references: info.references,
                pictures: info.pictures,
                cited: info.cited,
            };
            out.insert(info.id, serde_json::to_string(&shown)?);
        }
        Ok(out)
    }

    fn speaks_of(&self, name: &str) -> bool {
        self.met.contains(name)
    }

    fn write(&self, changes: &BTreeMap<String, Option<String>>) -> Result<()> {
        for (id, value) in changes {
            // Nothing said of a project that is here takes nothing from it.
            let Some(shown) = value.as_deref().and_then(|v| serde_json::from_str::<Shown>(v).ok()) else { continue };
            let written = self.projects.update_info(id, |info| {
                if !shown.name.trim().is_empty() {
                    info.name = shown.name;
                }
                info.description = shown.description;
                info.maps = shown.maps;
                info.words = shown.words;
                info.references = shown.references;
                info.pictures = shown.pictures;
                info.cited = shown.cited;
            });
            if let Err(error) = written {
                tracing::warn!(%error, project = %id, "what the list shows of a project could not be written");
            }
        }
        Ok(())
    }
}

/// How a project is shared, with the key that admits the writer to it, so
/// that every computer of the writer is the same collaborator in it. The
/// server that keeps the home can read the key, as it can read all else.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
struct Shared {
    sharing: Sharing,
    key: String,
}

pub struct SharedProjects<'a> {
    pub projects: &'a Projects,
    pub met: &'a BTreeSet<String>,
}

impl Store for SharedProjects<'_> {
    fn name(&self) -> &'static str {
        "shared"
    }

    fn read(&self) -> Result<BTreeMap<String, String>> {
        let mut out = BTreeMap::new();
        for info in self.projects.list()? {
            if !self.met.contains(&info.id) || info.sharing.is_none() {
                continue;
            }
            // Shared, and the key missing: nothing can be said of it.
            let Ok((sharing, key)) = self.projects.shared(&info.id) else { continue };
            out.insert(info.id, serde_json::to_string(&Shared { sharing, key })?);
        }
        Ok(out)
    }

    fn speaks_of(&self, name: &str) -> bool {
        self.met.contains(name)
    }

    fn write(&self, changes: &BTreeMap<String, Option<String>>) -> Result<()> {
        for (id, value) in changes {
            let written = match value.as_deref().map(serde_json::from_str::<Shared>) {
                Some(Ok(shared)) => self.projects.share(id, shared.sharing, &shared.key).map(|_| ()),
                Some(Err(_)) => continue,
                None => self.projects.unshare(id).map(|_| ()),
            };
            if let Err(error) = written {
                tracing::warn!(%error, project = %id, "how a project is shared could not be written");
            }
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn projects() -> (tempfile::TempDir, Projects) {
        let tmp = tempfile::tempdir().unwrap();
        let projects = Projects::at(tmp.path().join("projects"));
        std::fs::create_dir_all(tmp.path().join("projects")).unwrap();
        (tmp, projects)
    }

    #[test]
    fn what_the_list_shows_of_a_project_is_read_and_written() {
        let (_tmp, projects) = projects();
        let a = projects.create("The Iliad").unwrap();
        let b = projects.create("Not met").unwrap();
        projects.update_info(&a.id, |info| info.words = 12).unwrap();
        let met: BTreeSet<String> = [a.id.clone()].into();
        let facts = Facts { projects: &projects, met: &met };
        let read = facts.read().unwrap();
        assert_eq!(read.len(), 1);
        assert!(read[&a.id].contains("\"words\":12"), "{}", read[&a.id]);
        assert!(!facts.speaks_of(&b.id));

        let elsewhere = r#"{"name":"The wrath of Achilles","description":"Sing, goddess","maps":[{"id":"m","name":"Book 1","elements":3}],"words":40,"references":2,"pictures":["p.png"],"cited":["r"]}"#;
        facts
            .write(&BTreeMap::from([
                (a.id.clone(), Some(elsewhere.to_owned())),
                ("gone".to_owned(), Some(elsewhere.to_owned())),
            ]))
            .unwrap();
        let info = projects.info(&a.id).unwrap();
        assert_eq!((info.name.as_str(), info.words, info.maps.len()), ("The wrath of Achilles", 40, 1));
        assert_eq!(facts.read().unwrap()[&a.id], elsewhere, "written as it is read");
        // Nothing said takes nothing away.
        facts.write(&BTreeMap::from([(a.id.clone(), None)])).unwrap();
        assert_eq!(projects.info(&a.id).unwrap().words, 40);
    }

    #[test]
    fn how_a_project_is_shared_follows_with_its_key() {
        let (_tmp, projects) = projects();
        let a = projects.create("Shared").unwrap();
        let b = projects.create("Mine").unwrap();
        let met: BTreeSet<String> = [a.id.clone(), b.id.clone()].into();
        let store = SharedProjects { projects: &projects, met: &met };
        assert!(store.read().unwrap().is_empty());
        let sharing =
            Sharing { server: "https://glaukopis.example.org".into(), room: a.id.clone(), owner: true, member: None };
        projects.share(&a.id, sharing.clone(), "the-key").unwrap();
        let read = store.read().unwrap();
        assert_eq!(read.len(), 1);
        // On another computer, which has the project and not the sharing.
        let (_other_tmp, other) = self::projects();
        other.create_with_id(&a.id, "Shared", None).unwrap();
        let there = SharedProjects { projects: &other, met: &met };
        there.write(&BTreeMap::from([(a.id.clone(), Some(read[&a.id].clone()))])).unwrap();
        assert_eq!(other.shared(&a.id).unwrap(), (sharing, "the-key".to_owned()));
        assert_eq!(there.read().unwrap(), read);
        there.write(&BTreeMap::from([(a.id.clone(), None)])).unwrap();
        assert!(other.info(&a.id).unwrap().sharing.is_none());
    }
}
