//! The references of a document, as the BibLaTeX file that Pandoc reads.

use std::collections::{BTreeMap, HashMap, HashSet};

use crate::library::Library;
use crate::library::entry::{Draft, Entry};
use crate::library::keys::{sanitise_key, unique_key};

use super::Document;

/// The references of a document and the keys they are cited by.
#[derive(Debug, Default)]
pub struct Bibliography {
    /// From the id of a reference to its key in this document.
    pub keys: HashMap<String, String>,
    /// The file.
    pub text: String,
    /// Ids cited for which no reference was found.
    pub missing: Vec<String>,
}

/// Gathers the references cited in a document. The library's entry is used
/// where there is one: it is the newest. What the project carries serves for
/// the rest, which is how the references of a collaborator are found.
pub fn gather(document: &Document, library: Option<&Library>) -> Bibliography {
    let carried: HashMap<&str, &super::CarriedReference> =
        document.references.iter().map(|r| (r.id.as_str(), r)).collect();

    let mut entries: Vec<(String, Entry)> = Vec::new();
    let mut missing = Vec::new();
    let mut seen: HashSet<String> = HashSet::new();

    for id in document.cited() {
        if let Some(entry) = library.and_then(|l| l.resolve(&id)) {
            if seen.insert(entry.id.clone()) {
                entries.push((id.clone(), entry.clone()));
            } else {
                // Two ids that are one entry, after a merge.
                entries.push((id.clone(), entry.clone()));
            }
        } else if let Some(r) = carried.get(id.as_str()) {
            let draft = Draft {
                key: r.key.clone(),
                entry_type: r.entry_type.clone(),
                fields: r.fields.clone(),
                names: r.names.clone(),
            };
            let mut entry = draft.to_entry();
            entry.id = id.clone();
            entries.push((id.clone(), entry));
        } else {
            missing.push(id);
        }
    }

    // Keys: each entry's own where it can be had, made different where two agree.
    let mut keys: HashMap<String, String> = HashMap::new();
    let mut by_entry: HashMap<String, String> = HashMap::new();
    let mut taken: HashSet<String> = HashSet::new();
    let mut unique: Vec<Entry> = Vec::new();
    for (cited_as, entry) in entries {
        if let Some(key) = by_entry.get(&entry.id) {
            keys.insert(cited_as, key.clone());
            continue;
        }
        let wanted = sanitise_key(&entry.key).unwrap_or_else(|| "reference".into());
        let key = unique_key(&wanted, &taken);
        taken.insert(key.clone());
        by_entry.insert(entry.id.clone(), key.clone());
        keys.insert(cited_as, key.clone());
        let mut e = entry;
        e.key = key;
        unique.push(e);
    }

    // The entries that the cited ones inherit from must be in the file, after them.
    let mut parents: Vec<Entry> = Vec::new();
    if let Some(library) = library {
        let mut renamed: BTreeMap<String, String> = BTreeMap::new();
        let mut i = 0;
        let mut all: Vec<Entry> = unique.clone();
        while i < all.len() {
            for field in ["crossref", "xref"] {
                let Some(named) = all[i].get(field).map(str::to_owned) else { continue };
                let Some(parent) = library.by_key(&named) else { continue };
                if let Some(key) = by_entry.get(&parent.id) {
                    renamed.insert(named, key.clone());
                    continue;
                }
                let key = unique_key(&sanitise_key(&parent.key).unwrap_or_else(|| "reference".into()), &taken);
                taken.insert(key.clone());
                by_entry.insert(parent.id.clone(), key.clone());
                renamed.insert(named, key.clone());
                let mut p = parent.clone();
                p.key = key;
                parents.push(p.clone());
                all.push(p);
            }
            i += 1;
        }
        for e in unique.iter_mut().chain(parents.iter_mut()) {
            for field in ["crossref", "xref"] {
                if let Some(new) = e.get(field).and_then(|k| renamed.get(k)).cloned() {
                    e.set(field, new);
                }
            }
        }
    }

    let mut text = String::new();
    for e in unique.iter().chain(parents.iter()) {
        text.push_str(&e.to_bib(false, false));
        text.push('\n');
    }
    Bibliography { keys, text, missing }
}

#[cfg(test)]
mod tests {
    use super::super::fixtures::*;
    use super::*;
    use crate::library::draft_from_source;

    #[test]
    fn from_what_the_project_carries() {
        let b = gather(&sample(), None);
        assert_eq!(b.keys["r1"], "nagy1979");
        assert_eq!(b.keys["r2"], "west1988");
        assert!(b.text.contains("@book{nagy1979,"));
        assert!(b.text.contains("@article{west1988,"));
        assert!(b.missing.is_empty());
    }

    #[test]
    fn the_same_key_twice_and_a_reference_not_found() {
        let mut doc = sample();
        doc.references[1].key = "nagy1979".into();
        doc.sections[1].blocks.push(para(vec![cite("gone", None)]));
        let b = gather(&doc, None);
        assert_eq!(b.keys["r1"], "nagy1979");
        assert_eq!(b.keys["r2"], "nagy1979a");
        assert_eq!(b.missing, vec!["gone"]);
        assert!(b.text.contains("@article{nagy1979a,"));
    }

    #[test]
    fn the_library_is_preferred_and_parents_come_along() {
        let tmp = tempfile::tempdir().unwrap();
        let mut lib = Library::open_at(&tmp.path().join("library")).unwrap();
        lib.add(&draft_from_source("@collection{fowler2004, editor={Fowler, Robert}, title={The Cambridge Companion to Homer}, date={2004}}").unwrap()).unwrap();
        let chapter = lib
            .add(&draft_from_source("@incollection{foley2004, author={Foley, John Miles}, title={Epic as Genre}, crossref={fowler2004}, pages={171--187}}").unwrap())
            .unwrap();

        let mut doc = sample();
        // The project carries an older state of the chapter, under the library's id.
        doc.references.push(reference(
            &chapter.id,
            "foley-old",
            "@incollection{foley-old, author={Foley, J.}, title={Epic}}",
        ));
        doc.sections[1].blocks.push(para(vec![cite(&chapter.id, Some("172"))]));

        let b = gather(&doc, Some(&lib));
        assert_eq!(b.keys[&chapter.id], "foley2004");
        assert!(b.text.contains("title        = {Epic as Genre}") || b.text.contains("{Epic as Genre}"));
        let child = b.text.find("@incollection{foley2004").unwrap();
        let parent = b.text.find("@collection{fowler2004").unwrap();
        assert!(child < parent);
        assert!(!b.text.contains("glaukopis-"));
    }
}
