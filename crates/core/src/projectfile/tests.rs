use std::io::{Cursor, Read};

use serde_json::json;

use super::*;
use crate::library::attachments::hash_bytes;
use crate::library::draft_from_source;
use crate::pictures::fixtures::{PNG, SVG};

fn library(tmp: &tempfile::TempDir) -> Library {
    Library::open_at(&tmp.path().join("library")).unwrap()
}

fn store(tmp: &tempfile::TempDir, name: &str) -> Pictures {
    Pictures::open(tmp.path().join(name)).unwrap()
}

fn draft(source: &str) -> Draft {
    draft_from_source(source).unwrap()
}

/// A work as the document keeps it, made as the interface makes it of an entry.
fn record_of(entry: &Entry) -> Record {
    let view = entry.view();
    Record { id: view.id, key: view.key, entry_type: view.entry_type, fields: view.fields, names: view.names }
}

fn record(id: &str, source: &str) -> Record {
    let mut entry = draft(source).to_entry();
    entry.id = id.to_owned();
    record_of(&entry)
}

fn names_in(bytes: &[u8]) -> Vec<String> {
    let archive = zip::ZipArchive::new(Cursor::new(bytes)).unwrap();
    let mut names: Vec<String> = archive.file_names().map(str::to_owned).collect();
    names.sort();
    names
}

fn text_in(bytes: &[u8], name: &str) -> String {
    let mut archive = zip::ZipArchive::new(Cursor::new(bytes)).unwrap();
    let mut out = String::new();
    archive.by_name(name).unwrap().read_to_string(&mut out).unwrap();
    out
}

#[test]
fn a_project_is_written_as_one_file_and_read_again() {
    let tmp = tempfile::tempdir().unwrap();
    let pictures = store(&tmp, "pictures");
    let png = pictures.add("vase.png", &PNG).unwrap();
    let svg = pictures.add("circle.svg", SVG.as_bytes()).unwrap();
    let caption = json!([{"kind": "text", "text": "A circle", "marks": {}}]);
    pictures
        .update(
            &svg.hash,
            Change {
                caption: Some(caption.clone()),
                alt: Some("A red circle".into()),
                note: Some("Drawn by hand.".into()),
                ..Default::default()
            },
        )
        .unwrap();
    let mut lib = library(&tmp);
    let parent =
        lib.add(&draft("@collection{fowler2004, editor={Fowler, R.}, title={Companion}, date={2004}}")).unwrap();
    let child =
        lib.add(&draft("@incollection{nagy2004, author={Nagy, G.}, title={Chapter}, crossref={fowler2004}}")).unwrap();
    let records = [
        record_of(&child),
        record("not-in-library", "@book{lord1960, author={Lord, Albert}, title={The Singer of Tales}, date={1960}}"),
    ];

    let state = b"the document, as Yjs writes it".to_vec();
    let missing = "0".repeat(64);
    let hashes = [png.hash.clone(), svg.hash.clone(), missing.clone(), png.hash.clone()];
    let contents = Contents {
        manifest: Manifest {
            name: "Wrath".into(),
            description: "On the wrath of Achilles".into(),
            app: "0.1.0".into(),
            ..Default::default()
        },
        state: &state,
        pictures: &hashes,
        records: &records,
    };
    let path = tmp.path().join("Wrath.glaukopis");
    write(&path, &contents, &pictures, Some(&lib)).unwrap();
    let bytes = std::fs::read(&path).unwrap();

    let mut expected = vec![
        "document.bin".to_owned(),
        "manifest.json".to_owned(),
        format!("pictures/{}.png", png.hash),
        format!("pictures/{}.svg", svg.hash),
        "pictures.json".to_owned(),
        "references.bib".to_owned(),
    ];
    expected.sort();
    assert_eq!(names_in(&bytes), expected, "a picture the store has not is left out, and one twice is there once");

    let manifest: Manifest = serde_json::from_str(&text_in(&bytes, "manifest.json")).unwrap();
    assert_eq!(manifest.format, FORMAT);
    assert_eq!((manifest.name.as_str(), manifest.app.as_str()), ("Wrath", "0.1.0"));
    assert_eq!(manifest.description, "On the wrath of Achilles");
    assert!(!manifest.written.is_empty());

    let bib = text_in(&bytes, "references.bib");
    assert!(bib.contains("@incollection{nagy2004,"), "{bib}");
    assert!(bib.contains("@book{lord1960,"), "a work the library lacks is written from its record");
    assert!(bib.contains("@collection{fowler2004,"), "the work it is part of comes with it");
    assert!(!bib.contains("glaukopis-"), "nothing of the application's own");
    assert!(bib.find("@incollection{nagy2004").unwrap() < bib.find("@collection{fowler2004").unwrap());
    let _ = parent;

    let opened = read(&path).unwrap();
    assert_eq!(opened.state, state);
    assert_eq!(opened.manifest, manifest);
    assert_eq!(opened.pictures.len(), 2);
    let (said, held) = opened.pictures.iter().find(|(p, _)| p.hash == svg.hash).unwrap();
    assert_eq!(held, SVG.as_bytes());
    assert_eq!(
        (said.caption.clone(), said.alt.as_str(), said.note.as_str()),
        (caption, "A red circle", "Drawn by hand.")
    );
    assert_eq!(said.name, "circle.svg");
}

/// A project file is read with its pictures taken into the store one by
/// one, none of them held when it is done.
#[test]
fn pictures_are_taken_in_as_they_are_read() {
    let tmp = tempfile::tempdir().unwrap();
    let there = store(&tmp, "there");
    let png = there.add("vase.png", &PNG).unwrap();
    let svg = there.add("circle.svg", SVG.as_bytes()).unwrap();
    let hashes = [png.hash.clone(), svg.hash.clone()];
    let contents = Contents {
        manifest: Manifest { name: "P".into(), ..Default::default() },
        state: b"x",
        pictures: &hashes,
        records: &[],
    };
    let path = tmp.path().join("p.glaukopis");
    write(&path, &contents, &there, None).unwrap();
    let here = store(&tmp, "here");
    let (opened, added) = read_into(&path, &here).unwrap();
    assert_eq!(
        (opened.manifest.name.as_str(), opened.state.as_slice(), opened.pictures.len(), added),
        ("P", &b"x"[..], 0, 2)
    );
    assert_eq!(here.read(&svg.hash, "svg").unwrap(), SVG.as_bytes());
    assert!(here.get(&png.hash).is_ok());
    // Those the store has already are not counted again.
    assert_eq!(read_into(&path, &here).unwrap().1, 0);
}

#[test]
fn pictures_are_taken_in_by_their_hash() {
    let tmp = tempfile::tempdir().unwrap();
    let here = store(&tmp, "here");
    let png = here.add("vase.png", &PNG).unwrap();
    here.update(&png.hash, Change { note: Some("Mine.".into()), ..Default::default() }).unwrap();

    let there = store(&tmp, "there");
    let other = there.add("A vase from elsewhere.png", &PNG).unwrap();
    there.update(&other.hash, Change { note: Some("Theirs.".into()), ..Default::default() }).unwrap();
    let svg = there.add("circle.svg", SVG.as_bytes()).unwrap();
    there
        .update(
            &svg.hash,
            Change {
                alt: Some("A red circle".into()),
                caption: Some(json!([{"kind": "text", "text": "C"}])),
                ..Default::default()
            },
        )
        .unwrap();
    let hashes = [other.hash.clone(), svg.hash.clone()];
    let bytes = to_bytes(
        &Contents {
            manifest: Manifest { name: "P".into(), ..Default::default() },
            state: b"x",
            pictures: &hashes,
            records: &[],
        },
        &there,
        None,
    )
    .unwrap();
    let mut opened = read_from(Cursor::new(bytes)).unwrap();

    // A picture whose name says other than it holds.
    let wrong = "1".repeat(64);
    opened
        .pictures
        .push((Picture { hash: wrong.clone(), extension: "png".into(), ..Default::default() }, PNG.to_vec()));

    assert_eq!(take_pictures(&here, &opened.pictures), 1);
    let kept = here.get(&png.hash).unwrap();
    assert_eq!((kept.name.as_str(), kept.note.as_str()), ("vase.png", "Mine."), "what the store says is kept");
    let added = here.get(&svg.hash).unwrap();
    assert_eq!((added.name.as_str(), added.alt.as_str(), added.note.as_str()), ("circle.svg", "A red circle", ""));
    assert_eq!(added.caption, json!([{"kind": "text", "text": "C"}]));
    assert_eq!(here.read(&svg.hash, "svg").unwrap(), SVG.as_bytes());
    assert!(here.get(&wrong).is_err());
    assert_eq!(hash_bytes(&PNG), png.hash);
}

#[test]
fn what_is_no_project_file_is_refused() {
    let kind_of = |bytes: Vec<u8>| read_from(Cursor::new(bytes)).unwrap_err().to_string();
    assert_eq!(kind_of(b"plain text".to_vec()), "This is not a project file of Glaukopis.");

    let zip_of = |parts: &[(&str, &[u8])]| {
        let mut zip = zip::ZipWriter::new(Cursor::new(Vec::new()));
        for (name, bytes) in parts {
            zip.start_file(*name, zip::write::SimpleFileOptions::default()).unwrap();
            zip.write_all(bytes).unwrap();
        }
        zip.finish().unwrap().into_inner()
    };
    assert_eq!(kind_of(zip_of(&[("other.txt", b"x")])), "This is not a project file of Glaukopis.");
    assert_eq!(
        kind_of(zip_of(&[("manifest.json", br#"{"format": 2, "name": "Later"}"#), ("document.bin", b"x")])),
        "This project file was written by a later version of Glaukopis (form 2). Update Glaukopis to open it."
    );
    assert_eq!(
        kind_of(zip_of(&[("manifest.json", br#"{"format": 1, "name": "Empty"}"#)])),
        "The project file holds no project."
    );
    let read = read_from(Cursor::new(zip_of(&[
        ("manifest.json", br#"{"format": 1, "name": "Bare"}"#),
        ("document.bin", b"x"),
        ("pictures/not-a-hash.png", &PNG),
    ])))
    .unwrap();
    assert_eq!((read.manifest.name.as_str(), read.pictures.len()), ("Bare", 0));
}

const NAGY: &str =
    "@book{nagy1979, author={Nagy, Gregory}, title={The Best of the Achaeans}, date={1979}, publisher={Johns Hopkins}}";

#[test]
fn the_same_work_under_the_same_id_is_not_asked_of() {
    let tmp = tempfile::tempdir().unwrap();
    let mut lib = library(&tmp);
    let e = lib.add(&draft(NAGY)).unwrap();
    let records = [record_of(&e)];
    let found = examine(&lib, &records);
    assert!(matches!(found[0].finding, Finding::Same));
    assert_eq!(found[0].file.title, "The Best of the Achaeans");
    let done = settle(&mut lib, &records, &HashMap::new()).unwrap();
    assert_eq!(done.settled, [Settled { from: e.id.clone(), to: e.id.clone() }]);
    assert!(done.added.is_empty() && done.changed.is_empty());
    assert_eq!(lib.len(), 1);
}

#[test]
fn the_same_id_but_different_is_chosen_for() {
    let tmp = tempfile::tempdir().unwrap();
    let mut lib = library(&tmp);
    let e = lib.add(&draft(NAGY)).unwrap();
    let mut theirs = record_of(&e);
    theirs.fields.insert("edition".into(), "2".into());
    let records = [theirs.clone()];
    assert!(matches!(&examine(&lib, &records)[0].finding, Finding::Differs { library } if library.key == "nagy1979"));

    // Nothing said: the library's is kept, and cited by its id.
    let done = settle(&mut lib, &records, &HashMap::new()).unwrap();
    assert_eq!(done.settled[0].to, e.id);
    assert!(lib.get(&e.id).unwrap().get("edition").is_none());

    // The file's is taken into the library.
    let file = HashMap::from([(e.id.clone(), Choice::File)]);
    let done = settle(&mut lib, &records, &file).unwrap();
    assert_eq!((done.settled[0].to.as_str(), done.changed.as_slice()), (e.id.as_str(), [e.id.clone()].as_slice()));
    assert_eq!(lib.get(&e.id).unwrap().get("edition"), Some("2"));
    assert!(matches!(examine(&lib, &records)[0].finding, Finding::Same));

    // Both: the file's as an entry of its own.
    theirs.fields.insert("edition".into(), "3".into());
    let both = HashMap::from([(e.id.clone(), Choice::Both)]);
    let done = settle(&mut lib, std::slice::from_ref(&theirs), &both).unwrap();
    let new = &done.settled[0].to;
    assert_ne!(new, &e.id);
    assert_eq!(done.added, std::slice::from_ref(new));
    assert_eq!(lib.len(), 2);
    assert_eq!(lib.get(new).unwrap().get("edition"), Some("3"));
    assert_eq!(lib.get(&e.id).unwrap().get("edition"), Some("2"));
    assert_ne!(lib.get(new).unwrap().key, "nagy1979", "a key that is taken is not given twice");

    // Taken in, with a key another entry has: it keeps its own.
    let mut other = record_of(lib.get(&e.id).unwrap());
    other.key = lib.get(new).unwrap().key.clone();
    other.fields.insert("note".into(), "A note".into());
    let done = settle(&mut lib, &[other], &file).unwrap();
    assert!(done.problems.is_empty(), "{:?}", done.problems);
    let kept = lib.get(&e.id).unwrap();
    assert_eq!((kept.key.as_str(), kept.get("note")), ("nagy1979", Some("A note")));

    // It is all on disk.
    let again = Library::open_at(lib.dir()).unwrap();
    assert_eq!(again.len(), 2);
    assert_eq!(again.get(&e.id).unwrap().get("note"), Some("A note"));
}

#[test]
fn a_work_the_library_lacks_is_added_under_its_id() {
    let tmp = tempfile::tempdir().unwrap();
    let mut lib = library(&tmp);
    lib.add(&draft("@book{nagy1979, author={Nagy, Gregory}, title={Other}, date={1990}}")).unwrap();
    let records = [
        record("1b4e28ba-2fa1-11d2-883f-0016d3cca427", NAGY),
        record("{not an id}", "@book{lord1960, author={Lord, Albert}, title={The Singer of Tales}, date={1960}}"),
    ];
    let found = examine(&lib, &records);
    assert!(matches!((&found[0].finding, &found[1].finding), (Finding::New, Finding::New)));
    let done = settle(&mut lib, &records, &HashMap::new()).unwrap();
    assert_eq!(done.settled[0].to, records[0].id, "the citations hold as they are");
    let added = lib.get(&records[0].id).unwrap();
    assert_eq!(added.get("title"), Some("The Best of the Achaeans"));
    assert_eq!(added.key, "nagy1979a", "a key that is taken is not given twice");
    // An id the library could not keep is given one of its own, to be cited by.
    assert_ne!(done.settled[1].to, records[1].id);
    assert!(lib.get(&done.settled[1].to).is_some());
    assert_eq!(done.added.len(), 2);
    let again = Library::open_at(lib.dir()).unwrap();
    assert!(again.get(&records[0].id).is_some(), "the id is kept on disk");
}

#[test]
fn a_work_the_library_has_under_another_id_is_chosen_for() {
    let tmp = tempfile::tempdir().unwrap();
    let mut lib = library(&tmp);
    let doi = "@article{a, author={Nagy, Gregory}, title={On Wrath}, journaltitle={J}, date={1979}, doi={10.1/wrath}}";
    let ours = lib.add(&draft(doi)).unwrap();
    let theirs = record(
        "theirs-1",
        "@article{nagy1979w, author={Nagy, Gregory}, title={On Wrath}, journaltitle={J}, date={1979}, doi={10.1/wrath}, pages={1--20}}",
    );
    let records = [theirs.clone()];
    let Finding::Alike { id, certainty, reasons, merged, gains, .. } = &examine(&lib, &records)[0].finding else {
        panic!("alike")
    };
    assert_eq!((id, *certainty, *merged), (&ours.id, CertaintyWord::Certain, false));
    assert!(reasons.contains(&ReasonWord::Doi));
    assert_eq!(gains, &["pages"]);

    // Certain: the library's is cited, and gains what it lacks.
    let done = settle(&mut lib, &records, &HashMap::new()).unwrap();
    assert_eq!(done.settled[0], Settled { from: "theirs-1".into(), to: ours.id.clone() });
    assert_eq!(lib.get(&ours.id).unwrap().get("pages"), Some("1–20"));
    assert_eq!(lib.len(), 1);

    // Or the file's is another work, under its id.
    let another = HashMap::from([("theirs-1".to_owned(), Choice::Another)]);
    let done = settle(&mut lib, &records, &another).unwrap();
    assert_eq!(done.settled[0].to, "theirs-1");
    assert_eq!(lib.len(), 2);
    assert_eq!(lib.get("theirs-1").unwrap().get("doi"), Some("10.1/wrath"));
}

#[test]
fn a_work_alike_but_not_for_certain_is_added_unless_chosen() {
    let tmp = tempfile::tempdir().unwrap();
    let mut lib = library(&tmp);
    let ours =
        lib.add(&draft("@book{a, author={Nagy, Gregory}, title={The Best of the Achaeans}, date={1979}}")).unwrap();
    let records = [record("theirs-2", "@book{b, author={Nagy, G.}, title={The Best of the Achaeans}, date={1980}}")];
    let Finding::Alike { certainty, .. } = &examine(&lib, &records)[0].finding else { panic!("alike") };
    assert_eq!(*certainty, CertaintyWord::Probable);
    let done = settle(&mut lib, &records, &HashMap::new()).unwrap();
    assert_eq!(done.settled[0].to, "theirs-2");
    assert_eq!(lib.len(), 2);

    let tmp = tempfile::tempdir().unwrap();
    let mut lib = library(&tmp);
    let ours2 = lib.add(&Draft::from_entry(&ours)).unwrap();
    let cite = HashMap::from([("theirs-2".to_owned(), Choice::Cite)]);
    let done = settle(&mut lib, &records, &cite).unwrap();
    assert_eq!(done.settled[0].to, ours2.id);
    assert_eq!(lib.len(), 1);
}

#[test]
fn a_work_merged_away_is_cited_by_the_one_it_was_merged_into() {
    let tmp = tempfile::tempdir().unwrap();
    let mut lib = library(&tmp);
    let a = lib.add(&draft(NAGY)).unwrap();
    let b = lib.add(&draft("@book{nagy:best, author={Nagy, Gregory}, title={The Best of the Achaeans}, date={1979}, isbn={0801823889}}")).unwrap();
    let records = [record_of(&b)];
    lib.merge(&a.id, &b.id, &Draft::from_entry(&a)).unwrap();
    let Finding::Alike { id, merged, gains, .. } = &examine(&lib, &records)[0].finding else { panic!("alike") };
    assert_eq!((id, *merged), (&a.id, true));
    assert_eq!(gains, &["isbn"]);
    let done = settle(&mut lib, &records, &HashMap::new()).unwrap();
    assert_eq!(done.settled[0].to, a.id);
    assert_eq!(lib.get(&a.id).unwrap().get("isbn"), Some("0801823889"));
}
