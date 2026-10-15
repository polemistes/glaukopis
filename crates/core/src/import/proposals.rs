//! What the files of the library may be.
//!
//! In the going-through, the writer assigns files to references with the
//! machine proposing. For each file, the works of the library it may belong
//! to are found: by what the file says of itself (an identifier printed in
//! it, the title and authors of its metadata) or what the services say of
//! that identifier; where none of those is certain, by what its name says,
//! and by what its first page says. What the file says of itself may be
//! certain; its name and its first page are only ever probable. Where the
//! services know an identifier that the library does not, the reference
//! they describe is proposed as a new one.
//!
//! Nothing is read or looked up here: [`propose`] is given what was found
//! out of the file, and compares it with the library.

use std::path::Path;

use serde::Serialize;

use crate::bib::names::Person;
use crate::duplicates::{self, Certainty, Index, Match, Reason};
use crate::library::attachments;
use crate::library::entry::{Draft, Entry};

use super::pdf::{self, Named, PdfFacts};
use super::{Candidate, CertaintyWord, PlanMatch, ReasonWord, SummaryLite, fill_missing};

/// How many works are proposed for one file, at most.
pub const MATCHES: usize = 5;

/// What was found out of a file before it is compared with the library.
#[derive(Debug, Clone, Default)]
pub struct Known {
    pub hash: String,
    /// What the file is called in the lists: its name is read from this.
    pub name: String,
    /// What a PDF says of itself, where it is a PDF and could be read.
    pub facts: Option<PdfFacts>,
    /// What the services said of the identifier printed in it, where they
    /// were asked and knew it.
    pub lookup: Option<Candidate>,
    /// What was said in finding out: that the services do not know the
    /// identifier, that they could not be reached, that the file could not
    /// be read.
    pub notes: Vec<String>,
    /// The names of the folder the file stands in and of the folders above
    /// it, the nearest first; empty for a file in no folder.
    pub folders: Vec<String>,
}

/// What a file of the library may be, for the writer to decide.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Proposal {
    pub hash: String,
    pub name: String,
    /// Works of the library, the most certain first, at most five.
    pub matches: Vec<PlanMatch>,
    /// A new reference that the services describe, when the identifier
    /// printed in the file is not in the library: given only where no
    /// match is certain.
    pub lookup: Option<Candidate>,
    /// What the name of the file says of the work, for filling in a new
    /// reference where nothing better is known.
    pub named: Option<Named>,
    pub notes: Vec<String>,
}

/// A draft of what a file's name says: the families as the authors, each
/// as a name of one part, the year as the date, and the title.
pub fn draft_of_name(named: &Named) -> Draft {
    let mut draft = Draft { entry_type: "misc".into(), ..Default::default() };
    if !named.title.is_empty() {
        draft.fields.insert("title".into(), named.title.clone());
    }
    if let Some(year) = named.year {
        draft.fields.insert("date".into(), year.to_string());
    }
    if !named.families.is_empty() {
        draft.names.insert("author".into(), named.families.iter().map(Person::literal).collect());
    }
    draft
}

/// What the nearest folder named as files are named, with a year, says of
/// the work a file is part of: the folder names the work, and the file's
/// own name fills only what the folder's leaves out, since a file in such a
/// folder is often named for its part (`chapter 3`, `Introduction`). `None`
/// where no folder is named so, or where it says no more than the file.
fn with_folder(own: Option<&Named>, folders: &[String]) -> Option<Named> {
    let mut merged = folders.iter().find_map(|f| pdf::from_name(f.trim()).filter(|n| n.year.is_some()))?;
    if let Some(own) = own {
        if merged.families.is_empty() {
            merged.families = own.families.clone();
        }
        if merged.title.is_empty() {
            merged.title = own.title.clone();
        }
    }
    (Some(&merged) != own).then_some(merged)
}

/// The name of a file without its ending.
fn stem(name: &str) -> &str {
    Path::new(name).file_stem().and_then(|s| s.to_str()).unwrap_or(name)
}

/// The matches gathered for one file, each work once.
struct Gathered<'a> {
    entries: &'a [Entry],
    matches: Vec<PlanMatch>,
}

impl Gathered<'_> {
    /// Adds a match. A work found again keeps the higher certainty, and gains
    /// the reasons it was found by this time.
    fn add(&mut self, entry: &Entry, certainty: Certainty, reasons: Vec<ReasonWord>, gains: Vec<String>) {
        if let Some(known) = self.matches.iter_mut().find(|m| m.id == entry.id) {
            if certainty == Certainty::Certain {
                known.certainty = CertaintyWord::Certain;
            }
            for reason in reasons {
                if !known.reasons.contains(&reason) {
                    known.reasons.push(reason);
                }
            }
            return;
        }
        self.matches.push(PlanMatch {
            id: entry.id.clone(),
            certainty: certainty.into(),
            reasons,
            summary: SummaryLite::from(&entry.summary()),
            gains,
        });
    }

    /// Adds what the index found. Matches found by the name or the first
    /// page are probable whatever else agreed, and are said to be found by
    /// `by`, since what agreed is what the name or the page says.
    fn add_found(&mut self, found: Vec<Match>, by: Option<Reason>, draft: Option<&Draft>) {
        for m in found {
            let Some(entry) = self.entries.get(m.index) else { continue };
            let (certainty, reasons) = match by {
                Some(reason) => (Certainty::Probable, vec![reason.into()]),
                None => (m.certainty, m.reasons.into_iter().map(Into::into).collect()),
            };
            let gains = draft.map(|d| fill_missing(entry, d).1).unwrap_or_default();
            self.add(entry, certainty, reasons, gains);
        }
    }

    fn any_certain(&self) -> bool {
        self.matches.iter().any(|m| m.certainty == CertaintyWord::Certain)
    }
}

/// What a file may be, from what was found out of it. `index` is the index
/// of `entries`, in their order, as `Library::duplicates_index` keeps it.
pub fn propose(entries: &[Entry], index: &Index, known: Known) -> Proposal {
    let mut gathered = Gathered { entries, matches: Vec::new() };

    // A reference that has the file already is what it is.
    for entry in entries {
        if entry.attachments().iter().any(|f| attachments::hash_of_path(f) == Some(known.hash.as_str())) {
            gathered.add(entry, Certainty::Certain, vec![ReasonWord::File], Vec::new());
        }
    }

    // What the services said of it, else what it says of itself.
    let said = known.lookup.as_ref().map(|c| c.draft.clone()).or_else(|| known.facts.as_ref().map(pdf::draft));
    if let Some(draft) = &said {
        let print = duplicates::fingerprint(&draft.to_entry());
        gathered.add_found(index.find(&print, None), None, Some(draft));
    }

    // Its name, and its first page, where nothing is certain yet.
    let named = pdf::from_name(stem(&known.name));
    if !gathered.any_certain()
        && let Some(named) = &named
    {
        let print = duplicates::fingerprint(&draft_of_name(named).to_entry());
        gathered.add_found(index.find(&print, None), Some(Reason::Name), None);
    }
    // Its folder's name, where it says what the file's own leaves out.
    let folded = with_folder(named.as_ref(), &known.folders);
    if !gathered.any_certain()
        && let Some(folded) = &folded
    {
        let print = duplicates::fingerprint(&draft_of_name(folded).to_entry());
        gathered.add_found(index.find(&print, None), Some(Reason::Folder), None);
    }
    if !gathered.any_certain()
        && let Some(facts) = &known.facts
        && !facts.first_page.is_empty()
    {
        gathered.add_found(duplicates::by_first_page(index.prints(), &facts.first_page), Some(Reason::FirstPage), None);
    }

    let mut matches = gathered.matches;
    // The certain first; among equals, in the order they were found.
    matches.sort_by_key(|m| m.certainty != CertaintyWord::Certain);
    matches.truncate(MATCHES);
    let certain = matches.first().is_some_and(|m| m.certainty == CertaintyWord::Certain);
    Proposal {
        hash: known.hash,
        name: known.name,
        matches,
        lookup: if certain { None } else { known.lookup },
        named: folded.or(named),
        notes: known.notes,
    }
}

#[cfg(test)]
mod tests {
    use std::sync::atomic::AtomicBool;

    use super::*;
    use crate::library::{Library, draft_from_source, files};

    /// A picture of one dot, as a PNG.
    const DOT: &[u8] = &[
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00,
        0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
        0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0xf8, 0xcf, 0xc0, 0xf0, 0x1f, 0x00, 0x05, 0x00, 0x01, 0xff,
        0x89, 0x99, 0x3d, 0x1d, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ];

    /// What the command gathers of a file of the library, without the
    /// services and without Tesseract.
    fn known(library: &Library, hash: &str) -> Known {
        let record = library.files.get(hash).unwrap();
        let path = library.attachment_path(&record.path).unwrap();
        let facts = (files::kind_of(&record.path) == files::FileKind::Pdf).then(|| pdf::identify(&path).unwrap());
        Known { hash: hash.to_owned(), name: record.name.clone(), facts, ..Default::default() }
    }

    #[test]
    fn what_the_files_of_a_library_may_be() {
        let tmp = tempfile::tempdir().unwrap();
        let mut library = Library::open_at(&tmp.path().join("library")).unwrap();
        let mut ids = Vec::new();
        for source in [
            "@book{nagy, author={Nagy, Gregory}, title={The Best of the Achaeans}, date={1979}, doi={10.56021/9780801860157}}",
            "@book{lord, author={Lord, Albert B.}, title={The Singer of Tales}, date={1960}}",
            "@book{west, author={West, M. L.}, title={Hesiod: Theogony}, date={1966}}",
        ] {
            ids.push(library.add(&draft_from_source(source).unwrap()).unwrap().id);
        }

        // A PDF with no text that its name alone tells, a picture that its
        // name tells, and a scan whose name says nothing.
        let outside = tmp.path().join("outside");
        std::fs::create_dir_all(&outside).unwrap();
        let mut paths = Vec::new();
        for (name, content) in [
            ("Nagy 1979 - The Best of the Achaeans.pdf", b"%PDF-1.4\n".as_slice()),
            ("Lord_1960_The_Singer_of_Tales.png", DOT),
            ("scan0001.pdf", b"%PDF-1.4\n%scan\n".as_slice()),
        ] {
            let path = outside.join(name);
            std::fs::write(&path, content).unwrap();
            paths.push(path);
        }
        let (taken, problems) =
            files::store_paths(library.dir(), &paths, false, &mut |_, _, _| {}, &AtomicBool::new(false));
        assert!(problems.is_empty(), "{problems:?}");
        let taken = library.enter_taken(&taken, None).unwrap();
        let hash_of = |name: &str| taken.files.iter().find(|f| f.name == name).unwrap().hash.clone();

        let entries = library.entries().to_vec();
        let index = library.duplicates_index().clone();
        let propose_for = |name: &str| propose(&entries, &index, known(&library, &hash_of(name)));

        let pdf = propose_for("Nagy 1979 - The Best of the Achaeans.pdf");
        assert_eq!(pdf.matches.len(), 1, "{:?}", pdf.matches);
        assert_eq!(pdf.matches[0].id, ids[0]);
        assert_eq!(pdf.matches[0].certainty, CertaintyWord::Probable);
        assert_eq!(pdf.matches[0].reasons, vec![ReasonWord::Name]);
        assert_eq!(pdf.named.as_ref().map(|n| n.year), Some(Some(1979)));
        assert!(pdf.lookup.is_none());

        let picture = propose_for("Lord_1960_The_Singer_of_Tales.png");
        assert_eq!(picture.matches.iter().map(|m| m.id.as_str()).collect::<Vec<_>>(), vec![ids[1].as_str()]);
        assert_eq!(picture.matches[0].reasons, vec![ReasonWord::Name]);

        let scan = propose_for("scan0001.pdf");
        assert!(scan.matches.is_empty() && scan.named.is_none() && scan.lookup.is_none());
        assert_eq!(scan.name, "scan0001.pdf");

        // Once the file is a reference's, that reference is certain.
        let stored = &taken.files.iter().find(|f| f.name == "Lord_1960_The_Singer_of_Tales.png").unwrap().path;
        library.attach_stored(&ids[1], stored, None).unwrap();
        let entries = library.entries().to_vec();
        let index = library.duplicates_index().clone();
        let again = propose(&entries, &index, known(&library, &hash_of("Lord_1960_The_Singer_of_Tales.png")));
        assert_eq!(again.matches.len(), 1);
        assert_eq!(again.matches[0].certainty, CertaintyWord::Certain);
        assert_eq!(again.matches[0].reasons, vec![ReasonWord::File]);
    }

    fn library_of(sources: &[&str]) -> Vec<Entry> {
        sources
            .iter()
            .map(|s| {
                let mut e = draft_from_source(s).unwrap().to_entry();
                e.id = e.key.clone();
                e
            })
            .collect()
    }

    #[test]
    fn an_identifier_is_certain_and_the_services_are_not_needed() {
        let entries = library_of(&[
            "@book{nagy, author={Nagy, Gregory}, title={The Best of the Achaeans}, date={1979}, doi={10.56021/9780801860157}}",
            "@book{other, author={Nagy, Gregory}, title={The Best of the Achaeans Again}, date={1999}}",
        ]);
        let index = Index::new(&entries);
        let facts =
            PdfFacts { doi: Some("10.56021/9780801860157".into()), pages: 300, has_text: true, ..Default::default() };
        let lookup = Candidate { draft: pdf::draft(&facts), ..Default::default() };
        let known = Known {
            hash: "h".into(),
            name: "Nagy 1979 - The Best of the Achaeans.pdf".into(),
            facts: Some(facts),
            lookup: Some(lookup),
            notes: vec!["said".into()],
            ..Default::default()
        };
        let proposal = propose(&entries, &index, known);
        assert_eq!(proposal.matches[0].id, "nagy");
        assert_eq!(proposal.matches[0].certainty, CertaintyWord::Certain);
        assert_eq!(proposal.matches[0].reasons, vec![ReasonWord::Doi]);
        // A certain match is not looked for further, nor a new reference proposed.
        assert_eq!(proposal.matches.len(), 1);
        assert!(proposal.lookup.is_none());
        assert_eq!(proposal.notes, vec!["said"]);
    }

    #[test]
    fn the_services_propose_what_the_library_lacks() {
        let entries = library_of(&["@book{lord, author={Lord, Albert B.}, title={The Singer of Tales}, date={1960}}"]);
        let index = Index::new(&entries);
        let mut draft = Draft { entry_type: "article".into(), ..Default::default() };
        draft.fields.insert("title".into(), "The Rise of the Greek Epic".into());
        draft.fields.insert("doi".into(), "10.2307/632637".into());
        let known = Known {
            hash: "h".into(),
            name: "west.pdf".into(),
            facts: Some(PdfFacts { doi: Some("10.2307/632637".into()), ..Default::default() }),
            lookup: Some(Candidate { draft, ..Default::default() }),
            ..Default::default()
        };
        let proposal = propose(&entries, &index, known);
        assert!(proposal.matches.is_empty());
        assert_eq!(proposal.lookup.unwrap().draft.fields["title"], "The Rise of the Greek Epic");
    }

    #[test]
    fn the_name_and_the_first_page_agree() {
        let entries = library_of(&[
            "@book{nagy, author={Nagy, Gregory}, title={The Best of the Achaeans}, date={1979}}",
            "@book{lord, author={Lord, Albert B.}, title={The Singer of Tales}, date={1960}}",
        ]);
        let index = Index::new(&entries);
        let page = "THE BEST OF THE ACHAEANS\nGregory Nagy";
        let known = |name: &str| Known {
            hash: "h".into(),
            name: name.into(),
            facts: Some(PdfFacts { pages: 1, has_text: true, first_page: page.into(), ..Default::default() }),
            ..Default::default()
        };
        // The first page alone.
        let proposal = propose(&entries, &index, known("b0034.pdf"));
        assert_eq!(proposal.matches.len(), 1);
        assert_eq!(proposal.matches[0].reasons, vec![ReasonWord::FirstPage]);
        assert_eq!(proposal.matches[0].certainty, CertaintyWord::Probable);
        // The name and the first page: one match, with both reasons.
        let proposal = propose(&entries, &index, known("Nagy - Best of the Achaeans.pdf"));
        assert_eq!(proposal.matches.len(), 1);
        assert_eq!(proposal.matches[0].reasons, vec![ReasonWord::Name, ReasonWord::FirstPage]);
    }

    #[test]
    fn a_folder_named_as_files_are_says_what_the_files_name_leaves_out() {
        let entries = library_of(&[
            "@book{nagy, author={Nagy, Gregory}, title={The Best of the Achaeans}, date={1979}}",
            "@book{lord, author={Lord, Albert B.}, title={The Singer of Tales}, date={1960}}",
        ]);
        let index = Index::new(&entries);
        let known = |name: &str, folders: &[&str]| Known {
            hash: "h".into(),
            name: name.into(),
            folders: folders.iter().map(|f| (*f).to_owned()).collect(),
            ..Default::default()
        };
        // A part of a book in a folder named for the book.
        let proposal = propose(&entries, &index, known("chapter 3.pdf", &["Nagy 1979 - The Best of the Achaeans"]));
        assert_eq!(proposal.matches.len(), 1, "{:?}", proposal.matches);
        assert_eq!(proposal.matches[0].id, "nagy");
        assert_eq!(proposal.matches[0].certainty, CertaintyWord::Probable);
        assert_eq!(proposal.matches[0].reasons, vec![ReasonWord::Folder]);
        let named = proposal.named.unwrap();
        assert_eq!(
            (named.families, named.year, named.title.as_str()),
            (vec!["Nagy".to_owned()], Some(1979), "The Best of the Achaeans")
        );

        // A folder without a year says nothing, whatever its name.
        let proposal = propose(&entries, &index, known("Nagy 1979 - The Best of the Achaeans.pdf", &["Nagy"]));
        assert!(proposal.matches.iter().all(|m| !m.reasons.contains(&ReasonWord::Folder)), "{:?}", proposal.matches);
        assert_eq!(proposal.matches[0].reasons, vec![ReasonWord::Name]);
        let proposal = propose(&entries, &index, known("scan0001.pdf", &["Greek", "To read"]));
        assert!(proposal.matches.is_empty(), "{:?}", proposal.matches);
        assert!(proposal.named.is_none());

        // The nearest folder named so is the one that tells.
        let proposal = propose(
            &entries,
            &index,
            known("chapter 3.pdf", &["Lord 1960 - The Singer of Tales", "Nagy 1979 - The Best of the Achaeans"]),
        );
        assert_eq!(proposal.matches.len(), 1, "{:?}", proposal.matches);
        assert_eq!(proposal.matches[0].id, "lord");
    }
}
