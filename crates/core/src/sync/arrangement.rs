//! How the projects are arranged, as stores that are brought to be the same
//! as maps of the home document (`mirror`): the folders, the folder each
//! project is in, and the favourites (record 0120). They were kept on each
//! computer alone (record 0031), which is right for those who share a
//! project and wrong for one writer's own computers.

use std::collections::{BTreeMap, BTreeSet};

use crate::error::Result;
use crate::projects::{Folder, Projects};

use super::mirror::Store;

/// The folders of projects: `<folder>/name`, `<folder>/parent` (empty at
/// the top) and `<folder>/order`, each a name of its own, so that a folder
/// renamed on one computer and moved on another is both.
pub struct Folders<'a> {
    pub projects: &'a Projects,
}

/// The longest name a folder is given from elsewhere, as one typed here may be.
const NAME_LIMIT: usize = 200;

impl Store for Folders<'_> {
    fn name(&self) -> &'static str {
        "folders"
    }

    fn read(&self) -> Result<BTreeMap<String, String>> {
        let mut out = BTreeMap::new();
        for folder in self.projects.read_arrangement()?.folders {
            out.insert(format!("{}/name", folder.id), folder.name);
            out.insert(format!("{}/parent", folder.id), folder.parent.unwrap_or_default());
            out.insert(format!("{}/order", folder.id), folder.order);
        }
        Ok(out)
    }

    fn write(&self, changes: &BTreeMap<String, Option<String>>) -> Result<()> {
        self.projects.change_arrangement(|arrangement| {
            let folders = &mut arrangement.folders;
            let mut gone = BTreeSet::new();
            for (name, value) in changes {
                let Some((id, field)) = name.rsplit_once('/') else { continue };
                if id.trim().is_empty() {
                    continue;
                }
                if field == "name" && value.is_none() {
                    gone.insert(id.to_owned());
                    continue;
                }
                let at = match folders.iter().position(|f| f.id == id) {
                    Some(at) => at,
                    None => {
                        folders.push(Folder {
                            id: id.to_owned(),
                            name: String::new(),
                            parent: None,
                            order: String::new(),
                        });
                        folders.len() - 1
                    }
                };
                let folder = &mut folders[at];
                let value = value.clone().unwrap_or_default();
                match field {
                    "name" => {
                        folder.name =
                            value.split_whitespace().collect::<Vec<_>>().join(" ").chars().take(NAME_LIMIT).collect()
                    }
                    "parent" => folder.parent = Some(value).filter(|p| !p.is_empty()),
                    "order" => folder.order = value,
                    _ => {}
                }
            }
            // A folder is there once it has a name: its other fields may have come first.
            folders.retain(|f| !gone.contains(&f.id) && !f.name.is_empty());
            tidy(folders);
            Ok(())
        })
    }
}

/// Brings the folders to hold together after what was written from
/// elsewhere: a folder whose parent is not there stands at the top, and so
/// does one folder of each ring of folders that lie in each other, the one
/// whose id comes first, so that every computer breaks the ring alike. Two
/// computers that each moved a folder into the other's make such a ring.
fn tidy(folders: &mut [Folder]) {
    let ids: BTreeSet<String> = folders.iter().map(|f| f.id.clone()).collect();
    for folder in folders.iter_mut() {
        if folder.parent.as_ref().is_some_and(|p| !ids.contains(p) || *p == folder.id) {
            folder.parent = None;
        }
    }
    loop {
        let parent: BTreeMap<&str, &str> =
            folders.iter().filter_map(|f| Some((f.id.as_str(), f.parent.as_deref()?))).collect();
        // The first folder, by its id, from which going up comes back to itself.
        let ringed = ids.iter().find(|id| {
            let mut at = id.as_str();
            for _ in 0..=folders.len() {
                match parent.get(at) {
                    Some(up) if *up == id.as_str() => return true,
                    Some(up) => at = up,
                    None => return false,
                }
            }
            false
        });
        let Some(id) = ringed.cloned() else { break };
        if let Some(folder) = folders.iter_mut().find(|f| f.id == id) {
            folder.parent = None;
        }
    }
}

/// The folder each project is in: the project's id, and the folder's, or
/// nothing for one that is in none.
pub struct Places<'a> {
    pub projects: &'a Projects,
    /// The projects this computer may speak of: see `Store::speaks_of`.
    pub met: &'a BTreeSet<String>,
}

impl Store for Places<'_> {
    fn name(&self) -> &'static str {
        "places"
    }

    fn read(&self) -> Result<BTreeMap<String, String>> {
        Ok(self
            .projects
            .list()?
            .into_iter()
            .filter(|info| self.met.contains(&info.id))
            .map(|info| (info.id, info.folder.unwrap_or_default()))
            .collect())
    }

    fn speaks_of(&self, name: &str) -> bool {
        self.met.contains(name)
    }

    fn write(&self, changes: &BTreeMap<String, Option<String>>) -> Result<()> {
        let folders: BTreeSet<String> = self.projects.read_arrangement()?.folders.into_iter().map(|f| f.id).collect();
        for (id, value) in changes {
            let folder = value.clone().filter(|f| !f.is_empty());
            // A folder that is not here yet: left, and tried again.
            if folder.as_ref().is_some_and(|f| !folders.contains(f)) {
                continue;
            }
            if let Err(error) = self.projects.update_info(id, |info| info.folder = folder) {
                tracing::warn!(%error, project = %id, "the folder of a project could not be written");
            }
        }
        Ok(())
    }
}

/// The favourites: the project's id, and where it stands among them, as a
/// number of six places.
pub struct Favourites<'a> {
    pub projects: &'a Projects,
    pub met: &'a BTreeSet<String>,
}

fn place(index: usize) -> String {
    format!("{:06}", index + 1)
}

impl Store for Favourites<'_> {
    fn name(&self) -> &'static str {
        "favourites"
    }

    fn read(&self) -> Result<BTreeMap<String, String>> {
        Ok(self
            .projects
            .read_arrangement()?
            .favourites
            .into_iter()
            .enumerate()
            .filter(|(_, id)| self.met.contains(id))
            .map(|(index, id)| (id, place(index)))
            .collect())
    }

    fn speaks_of(&self, name: &str) -> bool {
        self.met.contains(name)
    }

    fn write(&self, changes: &BTreeMap<String, Option<String>>) -> Result<()> {
        self.projects.change_arrangement(|arrangement| {
            let mut placed: BTreeMap<String, String> =
                arrangement.favourites.iter().enumerate().map(|(index, id)| (id.clone(), place(index))).collect();
            for (id, value) in changes {
                match value {
                    Some(at) if self.met.contains(id) => placed.insert(id.clone(), at.clone()),
                    Some(_) => None,
                    None => placed.remove(id),
                };
            }
            let mut order: Vec<(String, String)> = placed.into_iter().map(|(id, at)| (at, id)).collect();
            order.sort();
            arrangement.favourites = order.into_iter().map(|(_, id)| id).collect();
            Ok(())
        })
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

    fn set(pairs: &[(&str, Option<&str>)]) -> BTreeMap<String, Option<String>> {
        pairs.iter().map(|(k, v)| ((*k).to_owned(), v.map(str::to_owned))).collect()
    }

    #[test]
    fn folders_are_read_and_written_field_by_field() {
        let (_tmp, projects) = projects();
        let drafts = projects.folder_create("Drafts", None).unwrap();
        let store = Folders { projects: &projects };
        let read = store.read().unwrap();
        assert_eq!(read.get(&format!("{}/name", drafts.id)).map(String::as_str), Some("Drafts"));
        assert_eq!(read.get(&format!("{}/parent", drafts.id)).map(String::as_str), Some(""));

        // A folder made elsewhere, under the first; the first renamed.
        store
            .write(&set(&[
                ("new/order", Some("000009")),
                ("new/parent", Some(&drafts.id)),
                ("new/name", Some("  Old   drafts ")),
                (&format!("{}/name", drafts.id), Some("Writing")),
            ]))
            .unwrap();
        let folders = projects.folders().unwrap();
        assert_eq!(folders.len(), 2);
        let new = folders.iter().find(|f| f.id == "new").unwrap();
        assert_eq!((new.name.as_str(), new.parent.as_deref()), ("Old drafts", Some(drafts.id.as_str())));
        assert_eq!(folders.iter().find(|f| f.id == drafts.id).unwrap().name, "Writing");

        // The first deleted elsewhere: what lay in it stands at the top until it is said where.
        store.write(&set(&[(&format!("{}/name", drafts.id), None)])).unwrap();
        let folders = projects.folders().unwrap();
        assert_eq!(folders.len(), 1);
        assert_eq!(folders[0].parent, None);
        // What has no name yet is no folder.
        store.write(&set(&[("half/parent", Some("new"))])).unwrap();
        assert_eq!(projects.folders().unwrap().len(), 1);
    }

    #[test]
    fn a_ring_of_folders_is_broken_the_same_everywhere() {
        let (_tmp, projects) = projects();
        let store = Folders { projects: &projects };
        store
            .write(&set(&[
                ("b/name", Some("B")),
                ("a/name", Some("A")),
                ("c/name", Some("C")),
                ("a/parent", Some("b")),
                ("b/parent", Some("a")),
                ("c/parent", Some("a")),
            ]))
            .unwrap();
        let folders = projects.folders().unwrap();
        let parent = |id: &str| folders.iter().find(|f| f.id == id).unwrap().parent.clone();
        assert_eq!(parent("a"), None, "the one whose id comes first stands at the top");
        assert_eq!(parent("b").as_deref(), Some("a"));
        assert_eq!(parent("c").as_deref(), Some("a"));
    }

    #[test]
    fn the_folder_of_a_project_and_the_favourites_are_those_of_the_projects_met() {
        let (_tmp, projects) = projects();
        let drafts = projects.folder_create("Drafts", None).unwrap();
        let a = projects.create_in("A", Some(&drafts.id)).unwrap();
        let b = projects.create("B").unwrap();
        let c = projects.create("C").unwrap();
        projects.set_favourite(&b.id, true).unwrap();
        projects.set_favourite(&a.id, true).unwrap();
        let met: BTreeSet<String> = [a.id.clone(), b.id.clone()].into();

        let places = Places { projects: &projects, met: &met };
        let read = places.read().unwrap();
        assert_eq!(read.len(), 2, "nothing is said of the one not met");
        assert_eq!(read[&a.id], drafts.id);
        assert_eq!(read[&b.id], "");
        assert!(!places.speaks_of(&c.id));
        places.write(&set(&[(&a.id, Some("")), (&b.id, Some(&drafts.id)), (&c.id, Some("no such folder"))])).unwrap();
        assert_eq!(projects.info(&a.id).unwrap().folder, None);
        assert_eq!(projects.info(&b.id).unwrap().folder.as_deref(), Some(drafts.id.as_str()));
        assert_eq!(projects.info(&c.id).unwrap().folder, None, "a folder that is not here is not written");

        let favourites = Favourites { projects: &projects, met: &met };
        assert_eq!(favourites.read().unwrap(), BTreeMap::from([(b.id.clone(), place(0)), (a.id.clone(), place(1))]));
        // Elsewhere the first was put last, and one not met was made a favourite.
        favourites.write(&set(&[(&b.id, Some("000005")), (&c.id, Some("000001"))])).unwrap();
        assert_eq!(projects.favourites().unwrap(), vec![a.id.clone(), b.id.clone()]);
        favourites.write(&set(&[(&a.id, None)])).unwrap();
        assert_eq!(projects.favourites().unwrap(), vec![b.id.clone()]);
    }
}
