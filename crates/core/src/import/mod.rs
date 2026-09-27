//! Bringing references into the library.
//!
//! Whatever the source, an import has the same three steps. The source is read
//! into **candidates**. A **plan** is made, in which each candidate is compared
//! with the library and with the candidates before it, and given an action.
//! The user may change the plan. Then the plan is **applied**.

pub mod bibfile;
pub mod pdf;
pub mod zotero;

use std::path::Path;

use serde::{Deserialize, Serialize};

use crate::duplicates::{self, Certainty, Reason};
use crate::error::Result;
use crate::library::Library;
use crate::library::entry::{Draft, Entry, Summary};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Candidate {
    pub draft: Draft,
    /// Files to be copied into the store, as absolute paths.
    pub files: Vec<String>,
    /// Where the candidate came from, in words.
    pub origin: String,
    /// Collections to place it in, each as a path of names from the top.
    pub collections: Vec<Vec<String>>,
    /// What the user should know about this candidate.
    pub notes: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "kebab-case")]
pub enum Action {
    /// Add as a new entry.
    Add,
    /// Leave out.
    Skip,
    /// Give the existing entry what it lacks, and the files.
    Merge { into: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlanMatch {
    pub id: String,
    pub certainty: CertaintyWord,
    pub reasons: Vec<ReasonWord>,
    pub summary: SummaryLite,
    /// The fields the existing entry would gain from the candidate.
    pub gains: Vec<String>,
}

// The plan travels to the interface and back, so its parts must be readable as
// well as writable. These mirror the types of `duplicates`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CertaintyWord {
    Certain,
    Probable,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ReasonWord {
    Doi,
    Isbn,
    Identical,
    TitleAuthorYear,
    File,
}

impl From<Certainty> for CertaintyWord {
    fn from(c: Certainty) -> Self {
        match c {
            Certainty::Certain => CertaintyWord::Certain,
            Certainty::Probable => CertaintyWord::Probable,
        }
    }
}

impl From<Reason> for ReasonWord {
    fn from(r: Reason) -> Self {
        match r {
            Reason::Doi => ReasonWord::Doi,
            Reason::Isbn => ReasonWord::Isbn,
            Reason::Identical => ReasonWord::Identical,
            Reason::TitleAuthorYear => ReasonWord::TitleAuthorYear,
            Reason::File => ReasonWord::File,
        }
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct SummaryLite {
    pub key: String,
    #[serde(rename = "type")]
    pub entry_type: String,
    pub authors: String,
    pub year: String,
    pub title: String,
    pub container: String,
}

impl From<&Summary> for SummaryLite {
    fn from(s: &Summary) -> Self {
        SummaryLite {
            key: s.key.clone(),
            entry_type: s.entry_type.clone(),
            authors: s.authors.clone(),
            year: s.year.clone(),
            title: s.title.clone(),
            container: s.container.clone(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlanItem {
    pub candidate: Candidate,
    pub summary: SummaryLite,
    /// Entries of the library that match, the most certain first.
    #[serde(default)]
    pub matches: Vec<PlanMatch>,
    /// When the candidate repeats an earlier one of the same import: its position.
    #[serde(default)]
    pub repeats: Option<usize>,
    pub action: Action,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Plan {
    /// What is being imported, in words: a file name, "Zotero", a DOI.
    pub source: String,
    pub items: Vec<PlanItem>,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Outcome {
    pub added: Vec<String>,
    pub updated: Vec<String>,
    pub skipped: usize,
    pub files: usize,
    pub problems: Vec<String>,
}

/// What `existing` lacks and `incoming` has. Returns the completed draft and
/// the names of the fields gained.
pub fn fill_missing(existing: &Entry, incoming: &Draft) -> (Draft, Vec<String>) {
    let mut draft = Draft::from_entry(existing);
    let mut gains = Vec::new();
    let has_date = draft.fields.contains_key("date") || draft.fields.contains_key("year");
    for (name, people) in &incoming.names {
        if people.is_empty() || draft.names.get(name).is_some_and(|p| !p.is_empty()) {
            continue;
        }
        draft.names.insert(name.clone(), people.clone());
        gains.push(name.clone());
    }
    for (name, value) in &incoming.fields {
        if value.trim().is_empty() || draft.fields.get(name).is_some_and(|v| !v.trim().is_empty()) {
            continue;
        }
        if matches!(name.as_str(), "date" | "year" | "month") && has_date {
            continue;
        }
        // Keys by which the incoming entry was cited are of no use to the existing one.
        if matches!(name.as_str(), "ids" | "crossref" | "xref" | "options") {
            continue;
        }
        draft.fields.insert(name.clone(), value.clone());
        gains.push(name.clone());
    }
    (draft, gains)
}

fn lite(draft: &Draft) -> SummaryLite {
    SummaryLite::from(&draft.to_entry().summary())
}

pub fn plan(library: &Library, candidates: Vec<Candidate>, source: &str, warnings: Vec<String>) -> Plan {
    let existing = library.entries();
    let index = duplicates::Index::new(existing);
    let mut batch = duplicates::Index::default();
    let mut batch_positions: Vec<usize> = Vec::new();
    let mut items: Vec<PlanItem> = Vec::with_capacity(candidates.len());

    for candidate in candidates {
        let entry = candidate.draft.to_entry();
        let print = duplicates::fingerprint(&entry);

        // What the files hold, by which it is told whether an entry has them already.
        let hashes: Vec<Option<String>> =
            candidate.files.iter().map(|f| crate::library::attachments::hash_file(Path::new(f)).ok()).collect();
        let brings_a_file = |e: &Entry| {
            hashes.iter().any(|hash| match hash {
                Some(hash) => {
                    !e.attachments().iter().any(|a| crate::library::attachments::hash_of_path(a) == Some(hash.as_str()))
                }
                // A file that cannot be read is not brought.
                None => false,
            })
        };

        let mut matches: Vec<PlanMatch> = index
            .find(&print, None)
            .into_iter()
            .map(|m| {
                let e = &existing[m.index];
                let (_, mut gains) = fill_missing(e, &candidate.draft);
                if brings_a_file(e) {
                    gains.push("file".into());
                }
                PlanMatch {
                    id: e.id.clone(),
                    certainty: m.certainty.into(),
                    reasons: m.reasons.into_iter().map(Into::into).collect(),
                    summary: SummaryLite::from(&e.summary()),
                    gains,
                }
            })
            .collect();

        // A file already in the store identifies the entry it belongs to.
        for hash in hashes.iter().flatten() {
            for e in library.entries_with_file_hash(hash) {
                if let Some(m) = matches.iter_mut().find(|m| m.id == e.id) {
                    m.certainty = CertaintyWord::Certain;
                    if !m.reasons.contains(&ReasonWord::File) {
                        m.reasons.push(ReasonWord::File);
                    }
                } else {
                    let (_, gains) = fill_missing(e, &candidate.draft);
                    matches.insert(
                        0,
                        PlanMatch {
                            id: e.id.clone(),
                            certainty: CertaintyWord::Certain,
                            reasons: vec![ReasonWord::File],
                            summary: SummaryLite::from(&e.summary()),
                            gains,
                        },
                    );
                }
            }
        }
        matches.sort_by_key(|m| m.certainty != CertaintyWord::Certain);

        let repeats = if matches.is_empty() {
            batch
                .find(&print, None)
                .into_iter()
                .find(|m| m.certainty == Certainty::Certain)
                .map(|m| batch_positions[m.index])
        } else {
            None
        };

        let action = match (matches.first(), repeats) {
            (Some(m), _) => {
                if m.gains.is_empty() {
                    Action::Skip
                } else {
                    Action::Merge { into: m.id.clone() }
                }
            }
            (None, Some(_)) => Action::Skip,
            (None, None) => Action::Add,
        };

        if let Some(first) = repeats {
            // What the repetition adds goes to the first occurrence.
            let (target_draft, more_files) = {
                let target = &items[first].candidate;
                let (filled, _) = fill_missing(&target.draft.to_entry(), &candidate.draft);
                let mut filled = filled;
                filled.key = target.draft.key.clone();
                (filled, candidate.files.clone())
            };
            let target = &mut items[first].candidate;
            target.draft = target_draft;
            for f in more_files {
                if !target.files.contains(&f) {
                    target.files.push(f);
                }
            }
            for c in &candidate.collections {
                if !target.collections.contains(c) {
                    target.collections.push(c.clone());
                }
            }
        } else if matches.is_empty() {
            batch.push(print);
            batch_positions.push(items.len());
        }

        items.push(PlanItem { summary: lite(&candidate.draft), candidate, matches, repeats, action });
    }

    Plan { source: source.to_owned(), items, warnings }
}

/// Finds or makes the collection at a path of names, and returns its id.
fn collection_at(library: &mut Library, path: &[String]) -> Result<Option<String>> {
    let mut parent: Option<String> = None;
    for name in path {
        let name = name.trim();
        if name.is_empty() {
            continue;
        }
        let found = library
            .collections
            .list
            .iter()
            .find(|c| c.parent == parent && c.name.to_lowercase() == name.to_lowercase())
            .map(|c| c.id.clone());
        parent = Some(match found {
            Some(id) => id,
            None => library.collections.create(name, parent.as_deref(), &crate::library::now())?.id,
        });
    }
    Ok(parent)
}

pub fn apply(library: &mut Library, plan: &Plan) -> Result<Outcome> {
    library.refresh()?;
    let mut outcome = Outcome::default();
    let mut collections_changed = false;

    for item in &plan.items {
        let candidate = &item.candidate;
        let id = match &item.action {
            Action::Skip => {
                outcome.skipped += 1;
                continue;
            }
            Action::Add => match library.insert(&candidate.draft, false) {
                Ok(entry) => {
                    outcome.added.push(entry.id.clone());
                    entry.id
                }
                Err(e) => {
                    outcome.problems.push(format!("{}: {e}", describe(item)));
                    continue;
                }
            },
            Action::Merge { into } => {
                let Some(existing) = library.resolve(into).cloned() else {
                    outcome.problems.push(format!("{}: the entry to merge with is no longer there", describe(item)));
                    continue;
                };
                let (draft, gains) = fill_missing(&existing, &candidate.draft);
                if !gains.is_empty()
                    && let Err(e) = library.apply(&existing.id, &draft)
                {
                    outcome.problems.push(format!("{}: {e}", describe(item)));
                    continue;
                }
                if !gains.is_empty() || !candidate.files.is_empty() {
                    outcome.updated.push(existing.id.clone());
                } else {
                    outcome.skipped += 1;
                }
                existing.id
            }
        };

        for file in &candidate.files {
            match library.attach_unsaved(&id, Path::new(file)) {
                Ok(true) => outcome.files += 1,
                Ok(false) => {}
                Err(e) => outcome.problems.push(format!("{}: {e}", describe(item))),
            }
        }
        for path in &candidate.collections {
            match collection_at(library, path) {
                Ok(Some(c)) => {
                    library.collections.add_entries(&c, std::slice::from_ref(&id))?;
                    collections_changed = true;
                }
                Ok(None) => {}
                Err(e) => outcome.problems.push(format!("{}: {e}", describe(item))),
            }
        }
    }

    outcome.updated.sort();
    outcome.updated.dedup();
    if !outcome.added.is_empty() || !outcome.updated.is_empty() {
        library.save()?;
    }
    if collections_changed {
        library.save_collections()?;
    }
    Ok(outcome)
}

fn describe(item: &PlanItem) -> String {
    let s = &item.summary;
    let mut out = String::new();
    if !s.authors.is_empty() {
        out.push_str(&s.authors);
        out.push(' ');
    }
    if !s.year.is_empty() {
        out.push_str(&s.year);
        out.push(' ');
    }
    if !s.title.is_empty() {
        let short: String = s.title.chars().take(60).collect();
        out.push_str(&format!("“{short}”"));
    }
    if out.trim().is_empty() { item.candidate.origin.clone() } else { out.trim().to_owned() }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::library::draft_from_source;

    fn candidate(src: &str) -> Candidate {
        Candidate { draft: draft_from_source(src).unwrap(), ..Default::default() }
    }

    fn library() -> (tempfile::TempDir, Library) {
        let tmp = tempfile::tempdir().unwrap();
        let lib = Library::open_at(&tmp.path().join("library")).unwrap();
        (tmp, lib)
    }

    #[test]
    fn new_known_and_repeated() {
        let (_tmp, mut lib) = library();
        let known = lib
            .add(
                &draft_from_source(
                    "@book{nagy1979, author={Nagy, Gregory}, title={The Best of the Achaeans}, date={1979}}",
                )
                .unwrap(),
            )
            .unwrap();

        let plan = plan(
            &lib,
            vec![
                // Known, and brings an ISBN.
                candidate(
                    "@book{N79, author={Nagy, G.}, title={The Best of the Achaeans}, year={1979}, isbn={0801823889}}",
                ),
                // New.
                candidate("@book{lord, author={Lord, Albert}, title={The Singer of Tales}, year={1960}}"),
                // The same again, with a publisher.
                candidate(
                    "@book{lord2, author={Lord, Albert}, title={The Singer of Tales}, year={1960}, publisher={Harvard}}",
                ),
                // Known, and brings nothing.
                candidate("@book{x, author={Nagy, Gregory}, title={The Best of the Achaeans}, date={1979}}"),
            ],
            "test.bib",
            vec![],
        );
        assert_eq!(plan.items[0].action, Action::Merge { into: known.id.clone() });
        assert_eq!(plan.items[0].matches[0].gains, vec!["isbn"]);
        assert_eq!(plan.items[1].action, Action::Add);
        assert_eq!(plan.items[1].candidate.draft.get("publisher"), Some("Harvard"));
        assert_eq!(plan.items[2].action, Action::Skip);
        assert_eq!(plan.items[2].repeats, Some(1));
        assert_eq!(plan.items[3].action, Action::Skip);

        // The plan survives the journey to the interface and back.
        let json = serde_json::to_string(&plan).unwrap();
        let plan: Plan = serde_json::from_str(&json).unwrap();

        let outcome = apply(&mut lib, &plan).unwrap();
        assert_eq!(outcome.added.len(), 1);
        assert_eq!(outcome.updated, vec![known.id.clone()]);
        assert_eq!(outcome.skipped, 2);
        assert!(outcome.problems.is_empty(), "{:?}", outcome.problems);
        assert_eq!(lib.len(), 2);
        assert_eq!(lib.get(&known.id).unwrap().get("isbn"), Some("0801823889"));
        assert_eq!(lib.get(&known.id).unwrap().key, "nagy1979");
        assert_eq!(lib.by_key("lord").unwrap().get("publisher"), Some("Harvard"));

        // Importing the same again adds nothing.
        let again = super::plan(&lib, plan.items.iter().map(|i| i.candidate.clone()).collect(), "test.bib", vec![]);
        assert!(
            again.items.iter().all(|i| i.action == Action::Skip),
            "{:?}",
            again.items.iter().map(|i| &i.action).collect::<Vec<_>>()
        );
    }

    #[test]
    fn files_and_collections() {
        let (tmp, mut lib) = library();
        let pdf = tmp.path().join("paper.pdf");
        std::fs::write(&pdf, b"%PDF paper").unwrap();
        let mut c =
            candidate("@article{west1988, author={West, M. L.}, title={The Rise of the Greek Epic}, date={1988}}");
        c.files = vec![pdf.display().to_string(), tmp.path().join("missing.pdf").display().to_string()];
        c.collections = vec![vec!["Homer".into(), "Epic".into()], vec!["To read".into()]];

        let p = plan(&lib, vec![c.clone()], "x", vec![]);
        let outcome = apply(&mut lib, &p).unwrap();
        assert_eq!(outcome.files, 1);
        assert_eq!(outcome.problems.len(), 1, "the missing file is reported");
        let id = &outcome.added[0];
        assert_eq!(lib.get(id).unwrap().attachments().len(), 1);
        assert_eq!(lib.collections.list.len(), 3);

        // The same again brings nothing: the file is there already.
        let mut same = c.clone();
        same.files.truncate(1);
        let again = plan(&lib, vec![same.clone()], "x", vec![]);
        assert_eq!(again.items[0].action, Action::Skip, "{:?}", again.items[0].matches);
        // Another file for the same reference is something gained.
        let other = tmp.path().join("scan.pdf");
        std::fs::write(&other, b"%PDF another").unwrap();
        same.files = vec![other.display().to_string()];
        let more = plan(&lib, vec![same], "x", vec![]);
        assert_eq!(more.items[0].action, Action::Merge { into: id.clone() });
        assert_eq!(more.items[0].matches[0].gains, vec!["file"]);
        let epic = lib.collections.list.iter().find(|c| c.name == "Epic").unwrap();
        assert!(epic.parent.is_some());
        assert_eq!(epic.entries, vec![id.clone()]);

        // A different description with the same file is recognised by the file.
        let mut other = candidate("@misc{scan, title={Scan 0042}}");
        other.files = vec![pdf.display().to_string()];
        let p = plan(&lib, vec![other], "x", vec![]);
        assert_eq!(p.items[0].matches[0].reasons, vec![ReasonWord::File]);
        assert_eq!(p.items[0].matches[0].certainty, CertaintyWord::Certain);
    }

    #[test]
    fn a_taken_key_is_replaced_on_import() {
        let (_tmp, mut lib) = library();
        lib.add(
            &draft_from_source("@book{smith2000, author={Smith, A.}, title={Alpha Beta Gamma}, date={2000}}").unwrap(),
        )
        .unwrap();
        let p = plan(
            &lib,
            vec![candidate("@book{smith2000, author={Smith, B.}, title={Something Quite Different}, date={2000}}")],
            "x",
            vec![],
        );
        assert_eq!(p.items[0].action, Action::Add);
        let outcome = apply(&mut lib, &p).unwrap();
        assert_eq!(lib.get(&outcome.added[0]).unwrap().key, "smith2000a");
    }
}
