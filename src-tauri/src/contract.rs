//! The contract between the two sides: what the commands send, as the
//! interface declares it in `src/lib/api/`.
//!
//! The types of the interface are written by hand. This test makes values of
//! the types the Rust side sends, as it sends them, and writes them into
//! `src/lib/api/contract.generated.ts` as constants of the types the
//! interface declares. The type check of the interface (`pnpm check`) then
//! fails where the two differ: a field that is not declared, one that is
//! declared and not sent, one of another kind, a name spelt otherwise.
//!
//! Every type a command answers with, and every event that tells the page
//! of work that goes on, is here: what a new command sends is put here too,
//! with the name of the type the interface declares for it, written with the
//! module of `src/lib/api/` it is in (`library.Summary`).
//!
//! What differs from one run to the next, ids, times and places on disk, is
//! made the same, so that the file changes only when a type does.

use std::path::Path;

use serde::Serialize;
use serde_json::Value;

use glaukopis_core::export::tools::{Tool, Tools};
use glaukopis_core::export::{Page, Place, Preview, Spot, TextRun};
use glaukopis_core::formats::Formats;
use glaukopis_core::import::{self, bibfile};
use glaukopis_core::library::{Library, attachments, draft_from_source};
use glaukopis_core::paths::DataDir;
use glaukopis_core::pictures::Pictures;
use glaukopis_core::projects::{MapInfo, Projects, Summary};
use glaukopis_core::styles::Styles;
use glaukopis_core::templates::Templates;

use crate::commands::documents::ToolsInfo;
use crate::commands::library::{full, listing};

/// A picture of one dot, as a PNG.
const DOT: &[u8] = &[
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0d, 0x49,
    0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0xf8, 0xcf, 0xc0, 0xf0, 0x1f, 0x00, 0x05, 0x00, 0x01, 0xff, 0x89, 0x99, 0x3d,
    0x1d, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
];

/// What differs from run to run, made the same.
fn steady(value: Value, tmp: &Path, resources: &Path) -> Value {
    match value {
        Value::String(s) => {
            let s =
                s.replace(&tmp.display().to_string(), "/data").replace(&resources.display().to_string(), "/resources");
            let uuid = s.len() == 36 && s.chars().filter(|c| *c == '-').count() == 4;
            let time = s.len() >= 19 && s.as_bytes()[4] == b'-' && s.as_bytes()[10] == b'T';
            Value::String(if uuid {
                "00000000-0000-4000-8000-000000000000".into()
            } else if time {
                "2026-01-01T00:00:00Z".into()
            } else {
                s
            })
        }
        Value::Array(list) => Value::Array(list.into_iter().map(|v| steady(v, tmp, resources)).collect()),
        Value::Object(map) => Value::Object(map.into_iter().map(|(k, v)| (k, steady(v, tmp, resources))).collect()),
        other => other,
    }
}

#[test]
fn what_is_sent_is_what_the_interface_declares() {
    let tmp = tempfile::tempdir().unwrap();
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("..");
    let resources = root.join("resources");
    let data = DataDir::open(tmp.path().join("data")).unwrap();

    // A library with a work that has all it can have: names, a file, a note, a collection.
    let mut library = Library::open(&data).unwrap();
    let draft = draft_from_source(
        "@book{nagy1979, author={Nagy, Gregory}, editor={Else, Some}, title={The Best of the Achaeans}, \
         subtitle={Concepts of the Hero}, date={1979}, location={Baltimore}, publisher={Johns Hopkins}, \
         doi={10.1/x}, isbn={9780801823886}, keywords={hero, epic}}",
    )
    .unwrap();
    let work = library.add(&draft).unwrap();
    let file = tmp.path().join("nagy.pdf");
    std::fs::write(&file, b"%PDF-1.4").unwrap();
    let (name, dir) = library.file_name_of(&work.id).unwrap();
    let stored = attachments::store_file(&dir, &file, &name).unwrap();
    library.attach_stored(&work.id, &stored, None).unwrap();
    let work = library.set_note(&work.id, "Read again.").unwrap();
    let epic = library.collection_create("Epic", None).unwrap();
    library.collection_add(&epic.id, std::slice::from_ref(&work.id)).unwrap();
    let again = library
        .add(
            &draft_from_source("@book{x, author={Nagy, Gregory}, title={The Best of the Achaeans}, date={1979}}")
                .unwrap(),
        )
        .unwrap();
    let (candidates, warnings) = bibfile::read_text(
        "@book{y, author={Nagy, Gregory}, title={The Best of the Achaeans}, date={1979}}\n@article{z, title={Another}, journaltitle={J}, date={2000}}",
        None,
    );
    let plan = import::plan(&library, candidates, "pasted", warnings);
    // A file of the library in a folder, belonging to no reference, beside the work's.
    let shelf = library.files.folder_create("Greek", None).unwrap();
    let loose = tmp.path().join("plate.png");
    std::fs::write(&loose, DOT).unwrap();
    let (taken, _) = glaukopis_core::library::files::store_paths(
        library.dir(),
        &[loose],
        true,
        &mut |_, _, _| {},
        &std::sync::atomic::AtomicBool::new(false),
    );
    let taken_in = library.enter_taken(&taken, Some(&shelf.id)).unwrap();
    // The whole store exported, with a references.bib.
    let exported = library
        .export_files(
            &glaukopis_core::library::export::ExportSelection::All,
            &tmp.path().join("exported"),
            true,
            &mut |_, _, _| {},
            &std::sync::atomic::AtomicBool::new(false),
        )
        .unwrap();
    let work = library.require(&work.id).unwrap().clone();
    // What a file may be: two works by its name, and a new one the services describe.
    let proposals = vec![glaukopis_core::import::proposals::propose(
        library.entries(),
        library.duplicates_index(),
        glaukopis_core::import::proposals::Known {
            hash: taken_in.files[0].hash.clone(),
            name: "Nagy 1979 - The Best of the Achaeans.pdf".into(),
            lookup: Some(plan.items[1].candidate.clone()),
            notes: vec!["A remark.".into()],
            ..Default::default()
        },
    )];
    assert!(!proposals[0].matches.is_empty() && proposals[0].lookup.is_some());
    let groups = glaukopis_core::duplicates::find_groups(library.entries());
    assert!(!groups.is_empty() && again.id != work.id);

    // A PDF that keeps its Greek by the names of its glyphs, looked at and its text given.
    let porson = tmp.path().join("porson.pdf");
    std::fs::write(&porson, glaukopis_core::ocr::fixture::porson_pdf()).unwrap();
    let looked = glaukopis_core::ocr::look(&porson, &Tools::default()).unwrap();
    let page_text = glaukopis_core::ocr::text_of_pages(&porson, 0, 5).unwrap();
    // A file with a shape, read with its shape kept: headings, kept lines, a style found.
    let shaped_import = {
        let pdf = root.join("e2e/fixtures/shape.pdf");
        let asked = glaukopis_core::ocr::Asked { shape: true, ..Default::default() };
        let read = glaukopis_core::ocr::read_pdf(
            &pdf,
            &Tools::default(),
            tmp.path(),
            &asked,
            None,
            &mut |_| {},
            &std::sync::atomic::AtomicBool::new(false),
        )
        .unwrap();
        glaukopis_core::ocr::imported_pdf("shape.pdf", "Shape", read)
    };
    let pictures = Pictures::open(data.pictures()).unwrap();
    let picture = pictures.add("dot.png", DOT).unwrap();
    // A project as it is after it was saved: with what it uses and cites.
    let projects = Projects::new(&data);
    let project = projects.create("Wrath").unwrap();
    let summary = Summary {
        name: None,
        description: None,
        maps: vec![MapInfo { id: "map".into(), name: "Wrath".into(), elements: 3 }],
        words: 12,
        references: 1,
        pictures: vec![picture.hash.clone()],
        cited: Some(vec!["reference".into()]),
    };
    let project = projects.save_state(&project.id, b"state", Some(summary)).unwrap();
    // In a folder that lies in another.
    let greek = projects.folder_create("Greek", None).unwrap();
    let folder = projects.folder_create("Epic", Some(&greek.id)).unwrap();
    let project = projects.move_to_folder(&project.id, Some(&folder.id)).unwrap();
    let formats = Formats::new(&resources, &data.formats());
    let styles = Styles::new(&resources, &data.styles());
    let templates = Templates::new(&resources, &data.templates());
    let tools = ToolsInfo {
        tools: Tools {
            pandoc: Some(Tool { path: "/usr/bin/pandoc".into(), version: "3.10.2".into(), least: None, data: None }),
            latex: vec!["lualatex".into()],
            pandoc_api: vec![1, 23, 1],
            ..Default::default()
        },
        resources: resources.display().to_string(),
    };
    let preview = Preview {
        count: 2,
        pages: vec![Page {
            number: 1,
            svg: "<svg/>".into(),
            texts: vec![TextRun { x: 72.0, baseline: 100.5, width: 40.25, size: 11.0, text: "Wrath".into() }],
        }],
        width: 595.0,
        height: 842.0,
        warnings: vec!["A remark.".into()],
        missing: vec!["gone".into()],
        substitute: Some("Libertinus Serif".into()),
        places: vec![Place { element: "e1".into(), page: 1, y: 72.0 }],
        spots: vec![Spot { page: 1, top: 90.5, bottom: 130.25, what: "kind:quote".into() }],
    };

    // What the rest of the commands send: built as they build it, or as
    // literals where what they send is a plain record.
    let project_info = project.clone();
    let system_info = crate::commands::system::SystemInfo {
        version: "0.0.0",
        data_dir: "/data".into(),
        logs: "/data/logs".into(),
        platform: "linux",
        user: "Some One".into(),
    };
    let languages = crate::commands::system::Languages {
        system: "nb-NO".into(),
        interface: vec![crate::commands::system::Language { tag: "nb", name: "norsk bokmål" }],
        interface_default: "nb",
        texts: vec!["en", "nb"],
        text_default: "nb".into(),
    };
    let settings = glaukopis_core::settings::Loaded {
        settings: serde_json::json!({ "theme": "dark", "textSize": 17 }).as_object().unwrap().clone(),
        set_aside: Some(glaukopis_core::settings::SetAside {
            path: "/data/settings.json.broken-20260101T000000Z".into(),
            reason: "not JSON".into(),
            person_kept: true,
        }),
    };
    let pasted = crate::commands::clipboard::Pasted {
        text: Some("Wrath".into()),
        html: None,
        pictures: vec![
            crate::commands::clipboard::PastedPicture {
                name: String::new(),
                mime: "image/png".into(),
                data: "iVBORw0KGgo=".into(),
                path: None,
            },
            crate::commands::clipboard::PastedPicture {
                name: "dot.png".into(),
                mime: "image/png".into(),
                data: String::new(),
                path: Some("/home/someone/dot.png".into()),
            },
        ],
    };
    let trashed =
        vec![crate::commands::projects::Trashed { entry: "20260101T000000Z-wrath".into(), info: project_info.clone() }];
    let history = vec![glaukopis_core::projects::HistoryEntry {
        id: "20260101T000000Z".into(),
        time: "2026-01-01T00:00:00Z".into(),
        size: 5,
    }];
    let place = glaukopis_core::projects::Place { x: 1.5, y: -2.0 };
    let head = crate::commands::projectfile::ReadHead {
        manifest: glaukopis_core::projectfile::Manifest {
            format: 1,
            name: "Wrath".into(),
            description: "Of Achilles.".into(),
            written: "2026-01-01T00:00:00Z".into(),
            app: "0.0.0".into(),
        },
        pictures: 1,
    };
    let drafted = glaukopis_core::library::entry::Draft::from_entry(&work);
    let records = vec![
        // As the library has it, and as another file has it.
        glaukopis_core::projectfile::Record {
            id: work.id.clone(),
            key: drafted.key.clone(),
            entry_type: drafted.entry_type.clone(),
            fields: drafted.fields.clone(),
            names: drafted.names.clone(),
        },
        glaukopis_core::projectfile::Record {
            id: "another".into(),
            key: "lord1960".into(),
            entry_type: "book".into(),
            fields: [("title".to_owned(), "The Singer of Tales".to_owned())].into(),
            names: Default::default(),
        },
    ];
    let lite = glaukopis_core::import::SummaryLite::from(&work.summary());
    let found_works = {
        use glaukopis_core::projectfile::{Finding, Found};
        let mut found = glaukopis_core::projectfile::examine(&library, &records);
        found.push(Found { id: "x".into(), file: lite.clone(), finding: Finding::Differs { library: lite.clone() } });
        found.push(Found {
            id: "y".into(),
            file: lite.clone(),
            finding: Finding::Alike {
                id: work.id.clone(),
                library: lite.clone(),
                certainty: glaukopis_core::import::CertaintyWord::Probable,
                reasons: vec![
                    glaukopis_core::import::ReasonWord::Doi,
                    glaukopis_core::import::ReasonWord::Alike {
                        title: glaukopis_core::duplicates::Agreement::Same,
                        author: glaukopis_core::duplicates::Agreement::Like,
                        year: glaukopis_core::duplicates::Agreement::None,
                    },
                ],
                merged: false,
                gains: vec!["doi".into()],
            },
        });
        found
    };
    let settled = crate::commands::projectfile::Settled {
        settled: vec![
            crate::commands::projectfile::SettledWork {
                from: "another".into(),
                to: work.id.clone(),
                reference: Some(full(&library, &work)),
            },
            crate::commands::projectfile::SettledWork { from: "x".into(), to: "x".into(), reference: None },
        ],
        added: vec!["x".into()],
        changed: vec![],
        problems: vec!["A remark.".into()],
    };
    let read_org =
        crate::commands::readable::ReadOrg { org: "* Wrath\n".into(), records: records.clone(), pictures: 0 };
    let lookup_found = crate::commands::sources::Found {
        query: glaukopis_core::lookup::Query::Doi("10.1/x".into()),
        hits: vec![crate::commands::sources::FoundHit {
            hit: glaukopis_core::lookup::Hit {
                draft: drafted.clone(),
                source: "Crossref".into(),
                url: Some("https://doi.org/10.1/x".into()),
                remarks: vec!["A remark.".into()],
            },
            summary: lite.clone(),
            known: Some(work.id.clone()),
        }],
        failures: vec!["arXiv: export.arxiv.org could not be reached.".into()],
    };
    let acknowledgements: Vec<crate::commands::sources::Acknowledgement> = glaukopis_core::lookup::acknowledgements()
        .into_iter()
        .take(1)
        .map(|(service, words)| crate::commands::sources::Acknowledgement { service, words })
        .collect();
    let zotero = glaukopis_core::import::zotero::ZoteroInfo {
        path: "/data/Zotero".into(),
        items: 2,
        attachments: 1,
        collections: 1,
        libraries: vec![glaukopis_core::import::zotero::ZoteroLibrary {
            id: 1,
            name: "My Library".into(),
            kind: glaukopis_core::import::zotero::LibraryKind::User,
            items: 2,
        }],
        warnings: vec!["A remark.".into()],
    };
    let zotero_collections = vec![glaukopis_core::import::zotero::ZoteroCollection {
        key: "ABCD1234".into(),
        name: "Epic".into(),
        path: vec!["Greek".into(), "Epic".into()],
        items: 1,
    }];
    let outcome = glaukopis_core::import::Outcome {
        added: vec![work.id.clone()],
        updated: vec![],
        skipped: 1,
        files: 1,
        problems: vec!["A remark.".into()],
    };
    let found_options: glaukopis_core::found::Options =
        serde_json::from_value(serde_json::json!({ "years": true, "named": true, "notes": false })).unwrap();
    let passages: Vec<glaukopis_core::found::Passage> = serde_json::from_value(serde_json::json!([
        { "id": "p1", "text": "As Nagy (1979, 73) argues, the hero is best.", "note": false, "taken": [] }
    ]))
    .unwrap();
    let found_proposals = glaukopis_core::found::propose(&library, &passages, &found_options);
    assert!(!found_proposals.is_empty(), "a citation is found to stand for the type");
    let found_items: Vec<glaukopis_core::found::FoundItem> =
        serde_json::from_value(serde_json::json!([{ "key": "nagy1979" }])).unwrap();
    let suggestions = glaukopis_core::found::suggest_all(&library, &found_items);
    assert!(!suggestions[0].is_empty());
    let searchable = crate::commands::ocr::MadeSearchable {
        reference: Some(full(&library, &work)),
        file: library.describe_file(&stored),
        read: 2,
        with_text: 1,
        failed: vec![(3, "A remark.".into())],
        remapped: 1,
    };
    let synced = glaukopis_core::sharing::Synced { sent: 1, fetched: 0, problems: vec!["A remark.".into()] };
    let rendered = vec![
        glaukopis_core::export::math::Rendered { mathml: Some("<math/>".into()), problem: None },
        glaukopis_core::export::math::Rendered { mathml: None, problem: Some("A remark.".into()) },
    ];
    let sheets = vec![
        glaukopis_core::import::tables::Sheet {
            name: "Sheet".into(),
            rows: vec![vec!["a".into(), "b".into()]],
            problem: None,
        },
        glaukopis_core::import::tables::Sheet { name: "Empty".into(), rows: vec![], problem: Some("A remark.".into()) },
    ];
    let server = glaukopis_core::sharing::ServerInfo {
        server: "https://example.org".into(),
        version: "0.0.0".into(),
        protocol: glaukopis_core::sharing::PROTOCOL,
        password_required: false,
        encrypted: true,
    };
    let invitation = glaukopis_core::sharing::Invitation {
        id: "i1".into(),
        hash: "abc".into(),
        code: Some("ABCD-EFGH-JKMN".into()),
        label: "For a friend".into(),
        created: 1,
        expires: Some(2),
        uses_left: None,
        used: 0,
        open: true,
    };
    let room = glaukopis_core::sharing::Room {
        room: "r1".into(),
        name: "Wrath".into(),
        created: 1,
        role: "owner".into(),
        you: None,
        owner_present: true,
        members: vec![glaukopis_core::sharing::Member {
            id: "m1".into(),
            name: "Some One".into(),
            joined: 1,
            last_seen: 2,
            present: false,
        }],
        invitations: vec![glaukopis_core::sharing::Invitation { code: None, ..invitation.clone() }],
    };
    let read_invitation = crate::commands::sharing::ReadInvitation {
        server: Some("https://example.org".into()),
        code: Some("ABCD-EFGH-JKMN".into()),
    };
    let ticket = crate::commands::sharing::Ticket { url: "wss://example.org/rooms/r1/socket?ticket=t".into() };
    let pages_of = crate::commands::documents::PagesOf { count: preview.count, pages: preview.pages.clone() };
    let exported_document = glaukopis_core::export::Exported {
        path: "/data/wrath.pdf".into(),
        also: vec!["/data/wrath.bib".into()],
        warnings: vec!["A remark.".into()],
        missing: vec![],
    };
    let style_found = vec![glaukopis_core::styles::Found {
        id: "apa".into(),
        title: "American Psychological Association".into(),
        kind: "author-date".into(),
        parent: None,
        fields: vec!["psychology".into()],
        installed: false,
    }];
    let words_files = vec![crate::commands::words::WordsFile { name: "common.ftl".into(), text: "a = A\n".into() }];
    let own_words = vec![crate::commands::words::OwnWords {
        tag: "nb".into(),
        files: vec![crate::commands::words::WordsFile { name: "common.ftl".into(), text: "a = A\n".into() }],
    }];
    let left_out = vec![glaukopis_core::i18n::LeftOut {
        language: "nb".into(),
        file: "common.ftl".into(),
        id: "a".into(),
        why: "A remark.".into(),
    }];
    let installed = vec![glaukopis_core::languages::Installed {
        kind: glaukopis_core::languages::Kind::Spelling,
        name: "nb_NO".into(),
        language: "nb-NO".into(),
        title: "Norsk bokmål".into(),
        version: "2026.10.06".into(),
        licence: "GPL".into(),
        source: "https://example.org".into(),
    }];
    let offer: crate::commands::languages::Offer = crate::commands::languages::Offer {
        server: "https://example.org/glaukopis/".into(),
        packages: vec![
            serde_json::from_value(serde_json::json!({
                "kind": "ocr", "name": "nor", "language": "nb", "title": "Norsk", "version": "4.1",
                "file": "ocr-nor-4.1.zip", "size": 1000, "sha256": "ab", "licence": "Apache-2.0", "source": "tessdata"
            }))
            .unwrap(),
        ],
    };
    let dictionary = glaukopis_core::spelling::found::Found {
        tag: "nb-NO".into(),
        name: "nb_NO".into(),
        source: glaukopis_core::spelling::found::Source::Imported,
        dir: tmp.path().join("languages"),
    };
    let checking = glaukopis_core::spelling::Checking {
        dictionaries: vec![dictionary.clone()],
        script: Some("Latn".into()),
        words: "nb".into(),
    };
    let removed = crate::commands::files::FilesRemoved { files: 2, folders: 1 };
    use crate::commands::work::{Count, Told};
    let files_told = Told { ticket: "t".into(), told: Count { done: 1, total: 3, name: "nagy.pdf".into() } };
    let pdfs_told = files_told.clone();
    let ocr_told = Told { ticket: "t".into(), told: glaukopis_core::ocr::Progress { done: 1, total: 3, page: 2 } };

    let mut values: Vec<(&str, &str, Value)> = Vec::new();
    let mut put = |name: &'static str, kind: &'static str, value: &dyn erased::Json| {
        values.push((name, kind, steady(value.json(), tmp.path(), &resources)));
    };
    put("summary", "library.Summary", &work.summary());
    put("reference", "library.Reference", &full(&library, &work));
    put("listing", "library.LibraryListing", &listing(&library));
    put("looked", "ocr.Looked", &looked);
    put("shapedImport", "imported.Imported", &shaped_import);
    put("pageText", "ocr.PageTextView[]", &page_text);
    put("filesListing", "files.FilesListing", &crate::commands::files::files_listing(&library));
    put("takenIn", "files.TakenIn", &taken_in);
    put("exported", "files.Exported", &exported);
    put("proposal", "files.Proposal[]", &proposals);
    put("importPlan", "library.ImportPlan", &plan);
    put("duplicates", "library.DuplicateGroup[]", &groups);
    put("project", "projects.ProjectInfo", &project);
    put("folder", "projects.Folder", &folder);
    put("picture", "pictures.Picture", &picture);
    put("tools", "documents.ToolsInfo", &tools);
    put("format", "documents.DocumentFormat", &formats.get("manuscript").unwrap());
    put("formats", "documents.FormatSummary[]", &formats.list());
    put("styles", "documents.StyleSummary[]", &styles.list());
    put("preview", "documents.Preview", &preview);
    put("kinds", "documents.KindEntry[]", &glaukopis_core::formats::kinds::catalogue());
    put(
        "kindLooks",
        "documents.KindLooks",
        &glaukopis_core::formats::kinds::looks(&formats.get("manuscript").unwrap(), &[]),
    );
    put("template", "templates.Template", &templates.get("plain").unwrap());
    put("templateSummaries", "templates.TemplateSummary[]", &templates.list());
    put("partKinds", "templates.PartKindEntry[]", &glaukopis_core::templates::kinds::catalogue());
    put("systemInfo", "system.SystemInfo", &system_info);
    put("languagesInfo", "system.LanguagesInfo", &languages);
    put("settingsLoaded", "system.SettingsLoaded", &settings);
    put("pasted", "clipboard.Pasted", &pasted);
    put("trashed", "projects.Trashed[]", &trashed);
    put("history", "projects.HistoryEntry[]", &history);
    put("place", "projects.Place", &place);
    put("projectFileHead", "projects.ProjectFileHead", &head);
    put("foundWorks", "projects.FoundWork[]", &found_works);
    put("settled", "projects.FileSettlement", &settled);
    put("readOrg", "projects.ReadOrg", &read_org);
    put("lookupFound", "sources.Found", &lookup_found);
    put("acknowledgements", "sources.Acknowledgement[]", &acknowledgements);
    put("zotero", "sources.ZoteroInfo", &zotero);
    put("zoteroCollections", "sources.ZoteroCollection[]", &zotero_collections);
    put("importOutcome", "library.ImportOutcome", &outcome);
    put("foundProposals", "found.Proposal[]", &found_proposals);
    put("suggestions", "found.Suggestion[][]", &suggestions);
    put("madeSearchable", "ocr.MadeSearchable", &searchable);
    put("synced", "pictures.Synced", &synced);
    put("rendered", "pictures.Rendered[]", &rendered);
    put("sheets", "tables.Sheet[]", &sheets);
    put("server", "sharing.ServerInfo", &server);
    put("invitation", "sharing.Invitation", &invitation);
    put("room", "sharing.Room", &room);
    put("readInvitation", "sharing.ReadInvitation", &read_invitation);
    put("ticket", "sharing.SharingTicket", &ticket);
    put("pagesOf", "documents.PagesOf", &pages_of);
    put("exportedDocument", "documents.Exported", &exported_document);
    put("styleFound", "documents.StyleFound[]", &style_found);
    put("wordsFiles", "words.WordsFile[]", &words_files);
    put("ownWords", "words.OwnWordsOf[]", &own_words);
    put("leftOut", "words.LeftOut[]", &left_out);
    put("installed", "languages.InstalledLanguage[]", &installed);
    put("offer", "languages.LanguageOffer", &offer);
    put("dictionaries", "spelling.Dictionary[]", &vec![dictionary]);
    put("checking", "spelling.Checking", &checking);
    put("filesRemoved", "files.FilesRemoved", &removed);
    // The events that tell of work that goes on (`commands/work.rs`).
    put("filesProgress", "backend.Told<files.FilesProgress>", &files_told);
    put("pdfsProgress", "backend.Told<sources.PdfsProgress>", &pdfs_told);
    put("ocrProgress", "backend.Told<ocr.Progress>", &ocr_told);

    let mut out = String::from(
        "// Made by the test `contract` in src-tauri/src/contract.rs: what the Rust side\n\
         // sends, as it sends it, typed as the interface declares it. The type check\n\
         // fails where the two differ. Not to be changed by hand: run the tests.\n\n",
    );
    // Each module of the interface is imported whole, by its name, so that
    // two of them may have a type of the same name.
    let mut modules: Vec<&str> = Vec::new();
    for (_, kind, _) in &values {
        for word in kind.split(|c: char| !(c.is_ascii_alphanumeric() || c == '.')) {
            if let Some((module, _)) = word.split_once('.')
                && !modules.contains(&module)
            {
                modules.push(module);
            }
        }
    }
    for module in &modules {
        assert!(values.iter().all(|(name, _, _)| name != module), "the constant {module} has the name of a module");
        out.push_str(&format!("import type * as {module} from './{module}';\n"));
    }
    for (name, kind, value) in &values {
        out.push_str(&format!("\nexport const {name}: {kind} = {};\n", serde_json::to_string_pretty(value).unwrap()));
    }

    let path = root.join("src/lib/api/contract.generated.ts");
    if std::fs::read_to_string(&path).ok().as_deref() != Some(out.as_str()) {
        std::fs::write(&path, &out).unwrap();
        eprintln!("{} was written anew: a type the Rust side sends has changed", path.display());
    }
}

/// Values of any type that is sent, as JSON.
mod erased {
    pub trait Json {
        fn json(&self) -> serde_json::Value;
    }
    impl<T: super::Serialize> Json for T {
        fn json(&self) -> serde_json::Value {
            serde_json::to_value(self).unwrap()
        }
    }
}
