use std::io::Write;

use super::*;
use crate::spelling::{Place, Source};

const AFF: &[u8] = b"SET UTF-8\n";
const DIC: &[u8] = b"2\nord\nbok\n";

/// A zip of files, by name.
fn zip(files: &[(&str, &[u8])]) -> Vec<u8> {
    let mut out = Cursor::new(Vec::new());
    {
        let mut writer = zip::ZipWriter::new(&mut out);
        for (name, bytes) in files {
            writer.start_file(*name, zip::write::SimpleFileOptions::default()).unwrap();
            writer.write_all(bytes).unwrap();
        }
        writer.finish().unwrap();
    }
    out.into_inner()
}

fn manifest(json: &str) -> Vec<u8> {
    json.as_bytes().to_vec()
}

#[test]
fn a_package_of_spelling_is_imported_under_the_name_of_its_language() {
    let tmp = tempfile::tempdir().unwrap();
    let languages = Languages::new(tmp.path().join("languages"));
    let package = zip(&[
        (
            MANIFEST,
            &manifest(
                r#"{"format":1,"kind":"spelling","language":"nb-NO","title":"Norsk bokmål","version":"2026.10.06","licence":"CC-BY-4.0"}"#,
            ),
        ),
        ("dictionaries/whatever.aff", AFF),
        ("dictionaries/whatever.dic", DIC),
        ("LICENSE.txt", b"CC BY 4.0"),
        ("description.xml", b"<x/>"),
    ]);
    let path = tmp.path().join("nb.zip");
    fs::write(&path, package).unwrap();
    let installed = languages.import_paths(&[path]).unwrap();
    assert_eq!(installed.len(), 1);
    assert_eq!(installed[0].name, "nb_NO");
    assert_eq!(installed[0].language, "nb-NO");
    assert_eq!(installed[0].title, "Norsk bokmål");
    let dir = languages.dir(Kind::Spelling);
    assert_eq!(fs::read(dir.join("nb_NO.dic")).unwrap(), DIC);
    assert!(tmp.path().join("languages/licences/spelling-nb_NO/LICENSE.txt").is_file());
    assert!(!tmp.path().join("languages/licences/spelling-nb_NO/description.xml").exists());
    assert_eq!(languages.installed(), installed);

    // Spelling finds it where it looks for what is imported.
    let found = found::find(&[Place::new(&dir, Source::Imported)]);
    assert_eq!(found.len(), 1);
    assert_eq!((found[0].tag.as_str(), found[0].source), ("nb-NO", Source::Imported));
}

#[test]
fn an_extension_of_dictionaries_gives_each_of_its_languages() {
    let tmp = tempfile::tempdir().unwrap();
    let languages = Languages::new(tmp.path());
    let oxt = zip(&[
        ("en_US.aff", AFF),
        ("en_US.dic", DIC),
        ("en_GB.aff", AFF),
        ("en_GB.dic", DIC),
        // Hyphenation and a thesaurus, which are not dictionaries of spelling.
        ("hyph_en_US.dic", b"UTF-8\n"),
        ("th_en_US_v2.dat", b"x"),
        ("README_en_US.txt", b"SCOWL"),
    ]);
    let path = tmp.path().join("dict-en.oxt");
    fs::write(&path, oxt).unwrap();
    let installed = languages.import_paths(&[path]).unwrap();
    let names: Vec<(&str, &str)> = installed.iter().map(|i| (i.name.as_str(), i.language.as_str())).collect();
    assert_eq!(names, [("en_GB", "en-GB"), ("en_US", "en-US")]);
    assert!(!languages.dir(Kind::Spelling).join("hyph_en_US.dic").exists());
}

#[test]
fn the_files_of_a_dictionary_may_be_chosen_side_by_side() {
    let tmp = tempfile::tempdir().unwrap();
    let languages = Languages::new(tmp.path().join("languages"));
    let aff = tmp.path().join("de_DE_frami.aff");
    let dic = tmp.path().join("de_DE_frami.dic");
    fs::write(&aff, AFF).unwrap();
    fs::write(&dic, DIC).unwrap();
    let installed = languages.import_paths(&[aff, dic]).unwrap();
    assert_eq!(installed[0].name, "de_DE_frami");
    assert_eq!(installed[0].language, "de-DE");
}

#[test]
fn what_is_not_a_language_is_refused() {
    let tmp = tempfile::tempdir().unwrap();
    let languages = Languages::new(tmp.path().join("languages"));
    let path = tmp.path().join("nothing.zip");
    fs::write(&path, zip(&[("README.txt", b"hello")])).unwrap();
    assert!(languages.import_paths(&[path]).is_err());

    // A name that would reach outside the folder.
    let path = tmp.path().join("bad.zip");
    let bad = manifest(r#"{"kind":"spelling","name":"../x","language":"en"}"#);
    fs::write(&path, zip(&[(MANIFEST, &bad), ("a.aff", AFF), ("a.dic", DIC)])).unwrap();
    assert!(languages.import_paths(&[path]).is_err());

    // A package that says it is of spelling and holds no dictionary.
    let path = tmp.path().join("ocr-as-spelling.zip");
    let wrong = manifest(r#"{"kind":"spelling","language":"nb"}"#);
    fs::write(&path, zip(&[(MANIFEST, &wrong), ("nor.traineddata", b"data")])).unwrap();
    assert!(languages.import_paths(&[path]).is_err());
    assert!(languages.installed().is_empty());
}

#[cfg(unix)]
#[test]
fn tesseract_is_given_its_own_data_and_the_languages_imported_before_it() {
    let tmp = tempfile::tempdir().unwrap();
    let base = tmp.path().join("system-tessdata");
    fs::create_dir_all(base.join("configs")).unwrap();
    fs::write(base.join("configs/pdf"), "tessedit_create_pdf 1").unwrap();
    fs::write(base.join("eng.traineddata"), "eng").unwrap();
    fs::write(base.join("nor.traineddata"), "old nor").unwrap();
    fs::write(base.join("pdf.ttf"), "font").unwrap();

    let languages = Languages::new(tmp.path().join("languages"));
    let file = tmp.path().join("nor.traineddata");
    fs::write(&file, "new nor").unwrap();
    let installed = languages.import_paths(&[file]).unwrap();
    assert_eq!((installed[0].kind, installed[0].name.as_str()), (Kind::Ocr, "nor"));
    assert!(languages.has_ocr());

    let merged = languages.tessdata();
    let imported = languages.dir(Kind::Ocr);
    merge_tessdata(Some(&base), &imported, &merged).unwrap();
    assert_eq!(fs::read_to_string(merged.join("nor.traineddata")).unwrap(), "new nor");
    assert_eq!(fs::read_to_string(merged.join("eng.traineddata")).unwrap(), "eng");
    assert_eq!(fs::read_to_string(merged.join("configs/pdf")).unwrap(), "tessedit_create_pdf 1");
    assert!(merged.join("pdf.ttf").exists());
    // The manifests of what is imported are not Tesseract's.
    assert!(!merged.join("nor.json").exists());
    // Made again, it stays as it is.
    merge_tessdata(Some(&base), &imported, &merged).unwrap();
    assert_eq!(fs::read_to_string(merged.join("nor.traineddata")).unwrap(), "new nor");

    // Taken away, Tesseract has its own again.
    languages.remove(Kind::Ocr, "nor").unwrap();
    assert!(!languages.has_ocr());
    merge_tessdata(Some(&base), &imported, &merged).unwrap();
    assert_eq!(fs::read_to_string(merged.join("nor.traineddata")).unwrap(), "old nor");
    // The files themselves are untouched.
    assert_eq!(fs::read_to_string(base.join("nor.traineddata")).unwrap(), "old nor");
    assert!(languages.remove(Kind::Ocr, "nor").is_err());
}

#[test]
fn a_server_may_be_a_folder_and_what_is_fetched_must_be_what_it_says() {
    let tmp = tempfile::tempdir().unwrap();
    let server = tmp.path().join("server");
    fs::create_dir_all(&server).unwrap();
    let package = zip(&[
        (MANIFEST, &manifest(r#"{"kind":"ocr","language":"nb","name":"nor"}"#)),
        ("nor.traineddata", b"data"),
        ("LICENSE", b"Apache-2.0"),
    ]);
    fs::write(server.join("ocr-nor.zip"), &package).unwrap();
    let offered = Offered {
        kind: Kind::Ocr,
        name: "nor".into(),
        language: "nb".into(),
        title: "Norsk".into(),
        version: "4.1.0".into(),
        file: "ocr-nor.zip".into(),
        size: package.len() as u64,
        sha256: hex(&Sha256::digest(&package)),
        licence: "Apache-2.0".into(),
        source: "tessdata_best".into(),
    };
    let index = Index { format: 1, packages: vec![offered.clone()] };
    fs::write(server.join(INDEX), serde_json::to_vec(&index).unwrap()).unwrap();

    let named = server.to_string_lossy().into_owned();
    assert_eq!(super::index(&named).unwrap(), index);
    assert_eq!(super::index(&format!("file://{named}")).unwrap(), index);
    let bytes = fetch(&named, &offered).unwrap();
    let languages = Languages::new(tmp.path().join("languages"));
    let installed = languages.install(&offered, &bytes).unwrap();
    assert_eq!(installed[0].version, "4.1.0");
    assert_eq!(installed[0].language, "nb");

    let wrong = Offered { sha256: "0".repeat(64), ..offered.clone() };
    assert!(fetch(&named, &wrong).is_err());
    let outside = Offered { file: "../secret".into(), ..offered };
    assert!(fetch(&named, &outside).is_err());
}

#[test]
fn the_server_is_the_projects_unless_another_is_said() {
    assert_eq!(server(None), DEFAULT_SERVER);
    assert_eq!(server(Some("  ")), DEFAULT_SERVER);
    assert_eq!(server(Some("https://example.org/languages")), "https://example.org/languages");
    assert_eq!(address("https://example.org/l/", "index.json"), "https://example.org/l/index.json");
    assert_eq!(address("https://example.org/l", "index.json"), "https://example.org/l/index.json");
}
