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
//! What differs from one run to the next, ids, times and places on disk, is
//! made the same, so that the file changes only when a type does.

use std::path::Path;

use serde::Serialize;
use serde_json::Value;

use glaukopis_core::export::tools::{Tool, Tools};
use glaukopis_core::export::{Page, Place, Preview, TextRun};
use glaukopis_core::formats::Formats;
use glaukopis_core::import::{self, bibfile};
use glaukopis_core::library::{Library, attachments, draft_from_source};
use glaukopis_core::paths::DataDir;
use glaukopis_core::pictures::Pictures;
use glaukopis_core::projects::{MapInfo, Projects, Summary};
use glaukopis_core::styles::Styles;

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
    library.attach_stored(&work.id, &stored).unwrap();
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
    let groups = glaukopis_core::duplicates::find_groups(library.entries());
    assert!(!groups.is_empty() && again.id != work.id);

    let pictures = Pictures::open(data.pictures()).unwrap();
    let picture = pictures.add("dot.png", DOT).unwrap();
    // A project as it is after it was saved: with what it uses and cites.
    let projects = Projects::new(&data);
    let project = projects.create("Wrath").unwrap();
    let summary = Summary {
        name: None,
        maps: vec![MapInfo { id: "map".into(), name: "Wrath".into(), elements: 3 }],
        words: 12,
        references: 1,
        pictures: vec![picture.hash.clone()],
        cited: Some(vec!["reference".into()]),
    };
    let project = projects.save_state(&project.id, b"state", Some(summary)).unwrap();
    let formats = Formats::new(&resources, &data.formats());
    let styles = Styles::new(&resources, &data.styles());
    let tools = ToolsInfo {
        tools: Tools {
            pandoc: Some(Tool { path: "/usr/bin/pandoc".into(), version: "3.10.2".into(), least: None }),
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
    };

    let mut values: Vec<(&str, &str, &str, Value)> = Vec::new();
    let mut put = |name: &'static str, kind: &'static str, from: &'static str, value: &dyn erased::Json| {
        values.push((name, kind, from, steady(value.json(), tmp.path(), &resources)));
    };
    put("summary", "Summary", "library", &work.summary());
    put("reference", "Reference", "library", &full(&library, &work));
    put("listing", "LibraryListing", "library", &listing(&library));
    put("importPlan", "ImportPlan", "library", &plan);
    put("duplicates", "DuplicateGroup[]", "library", &groups);
    put("project", "ProjectInfo", "projects", &project);
    put("picture", "Picture", "pictures", &picture);
    put("tools", "ToolsInfo", "documents", &tools);
    put("format", "DocumentFormat", "documents", &formats.get("manuscript").unwrap());
    put("formats", "FormatSummary[]", "documents", &formats.list());
    put("styles", "StyleSummary[]", "documents", &styles.list());
    put("preview", "Preview", "documents", &preview);
    put("kinds", "KindEntry[]", "documents", &glaukopis_core::formats::kinds::catalogue());

    let mut out = String::from(
        "// Made by the test `contract` in src-tauri/src/contract.rs: what the Rust side\n\
         // sends, as it sends it, typed as the interface declares it. The type check\n\
         // fails where the two differ. Not to be changed by hand: run the tests.\n\n",
    );
    let mut from: Vec<(&str, Vec<&str>)> = Vec::new();
    for (_, kind, module, _) in &values {
        let kind = kind.trim_end_matches("[]");
        match from.iter_mut().find(|(m, _)| m == module) {
            Some((_, kinds)) if !kinds.contains(&kind) => kinds.push(kind),
            Some(_) => {}
            None => from.push((module, vec![kind])),
        }
    }
    for (module, kinds) in &from {
        out.push_str(&format!("import type {{ {} }} from './{module}';\n", kinds.join(", ")));
    }
    for (name, kind, _, value) in &values {
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
