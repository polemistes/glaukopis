//! Templates: what a document of a kind consists of.
//!
//! A template says which parts a document has and in what order, which
//! kinds of elements and of passages it puts in hand, which layout and
//! citation style it brings, what it requires, and which files it produces.
//! It is a delta on the template it is based on, as kinds of passage are.
//! Those that come with the application are in `resources/templates/`, the
//! writer's own in `templates/` of the data directory. See ADR 0038.

pub mod kinds;

use std::fs;
use std::path::Path;

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::error::{Error, IoContext, Result};
use crate::formats::Source;
use crate::shelf::{self, Shelf, Shelved};
use crate::tr;

pub use kinds::{PartLook, Place};

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Group {
    #[default]
    Plain,
    Article,
    Book,
    Fiction,
    Stage,
    Poetry,
    Other,
    Journal,
    Publisher,
    StyleGuide,
    /// Made by the writer.
    Own,
}

/// The parts of a document the core makes itself, by what the settings and
/// the text hold.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum GeneratedPart {
    HalfTitle,
    TitlePage,
    Keywords,
    Contents,
    ListOfFigures,
    ListOfTables,
    Body,
    Notes,
    Bibliography,
}

/// One item of the order of a document: a generated part, or every element
/// of a kind.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ContentsItem {
    Part { part: GeneratedPart },
    Kind { kind: String },
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Requirements {
    pub words: Option<u32>,
    pub abstract_words: Option<u32>,
    pub keywords: Option<u32>,
    /// The authors are not to be named: for review.
    pub anonymous: bool,
    /// What the limit counts, and anything else to know: "notes included".
    pub note: String,
}

/// A file a document can be made into, as the template names it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum OutputTarget {
    Pdf,
    PdfLatex,
    Docx,
    Odt,
    Latex,
    Typst,
    Markdown,
    Html,
    Epub,
}

impl OutputTarget {
    pub const ALL: [OutputTarget; 9] = [
        OutputTarget::Pdf,
        OutputTarget::PdfLatex,
        OutputTarget::Docx,
        OutputTarget::Odt,
        OutputTarget::Latex,
        OutputTarget::Typst,
        OutputTarget::Markdown,
        OutputTarget::Html,
        OutputTarget::Epub,
    ];
}

/// A file the template makes: the document itself, or a cover, which is a
/// later piece and keeps this shape.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Output {
    pub id: String,
    /// Nothing for the document itself, which is named by the interface.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    pub targets: Vec<OutputTarget>,
    /// A layout of its own; nothing for the document's.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub layout: Option<String>,
    /// The places it prints: nothing for front, body and back.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub places: Option<Vec<Place>>,
}

impl Output {
    /// The id of the output that is the document itself.
    pub const DOCUMENT: &str = "document";

    /// The document itself, in every target.
    pub fn document() -> Self {
        Output { id: Output::DOCUMENT.into(), targets: OutputTarget::ALL.to_vec(), ..Default::default() }
    }
}

/// A template whole: what a built-in one leaves to its base is filled in on
/// reading.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Template {
    pub id: String,
    pub name: String,
    pub group: Group,
    pub description: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<Source>,
    /// What it was made from.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub based_on: Option<String>,
    /// The layout (format) it brings; nothing for the writer's usual.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub layout: Option<String>,
    /// The reference style it brings; nothing for the writer's usual.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style: Option<String>,
    /// The order of the document.
    pub contents: Vec<ContentsItem>,
    /// The kinds of elements it puts in hand, by catalogue id.
    pub kinds: Vec<String>,
    /// The kinds of paragraph and of words it puts in hand, by id.
    pub passage_kinds: Vec<String>,
    pub requirements: Requirements,
    pub outputs: Vec<Output>,
}

/// The id of the root template.
pub const PLAIN: &str = "plain";

/// The fields of a file that are its own: every other is inherited from
/// the template it is based on.
const OWN_FIELDS: [&str; 6] = ["id", "name", "group", "description", "source", "basedOn"];

impl Template {
    /// The root template: title page, body, notes, bibliography; no kinds;
    /// no requirements; the document output with every target. The same as
    /// `resources/templates/plain.json`, for where the file is not there.
    pub fn plain() -> Self {
        use GeneratedPart::{Bibliography, Body, Notes, TitlePage};
        Template {
            id: PLAIN.into(),
            name: "Plain document".into(),
            group: Group::Plain,
            description: "A document of nothing but its text: the title, the body, the notes and the bibliography."
                .into(),
            contents: [TitlePage, Body, Notes, Bibliography]
                .into_iter()
                .map(|part| ContentsItem::Part { part })
                .collect(),
            outputs: vec![Output::document()],
            ..Default::default()
        }
    }

    /// The output with an id; nothing where the template has none such.
    pub fn output(&self, id: &str) -> Option<&Output> {
        self.outputs.iter().find(|o| o.id == id)
    }

    /// Puts values that make no sense back within bounds, so that a template
    /// made by hand cannot break the making of a document.
    pub fn sanitise(&mut self) {
        let id_ok = |id: &String| !id.trim().is_empty() && id.len() <= 80;
        self.name = self.name.split_whitespace().collect::<Vec<_>>().join(" ");
        for s in [&mut self.layout, &mut self.style] {
            if s.as_deref().is_some_and(|v| v.trim().is_empty() || v.len() > 80) {
                *s = None;
            }
        }
        self.contents.retain(|item| match item {
            ContentsItem::Part { .. } => true,
            ContentsItem::Kind { kind } => id_ok(kind),
        });
        self.contents.truncate(60);
        for list in [&mut self.kinds, &mut self.passage_kinds] {
            list.retain(id_ok);
            list.dedup();
            list.truncate(40);
        }
        let r = &mut self.requirements;
        for n in [&mut r.words, &mut r.abstract_words, &mut r.keywords] {
            if n.is_some_and(|v| v == 0 || v > 10_000_000) {
                *n = None;
            }
        }
        if r.note.chars().count() > 2000 {
            r.note = r.note.chars().take(2000).collect();
        }
        self.outputs.retain(|o| id_ok(&o.id));
        self.outputs.truncate(10);
        for o in &mut self.outputs {
            o.targets.dedup();
            if o.name.as_deref().is_some_and(|n| n.trim().is_empty()) {
                o.name = None;
            }
            if o.layout.as_deref().is_some_and(|l| l.trim().is_empty() || l.len() > 80) {
                o.layout = None;
            }
        }
        if self.output(Output::DOCUMENT).is_none() {
            self.outputs.insert(0, Output::document());
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TemplateSummary {
    pub id: String,
    pub name: String,
    pub group: Group,
    pub description: String,
    pub own: bool,
    pub confidence: String,
    pub checked: String,
}

pub struct Templates {
    shelf: Shelf,
}

fn raw(path: &Path) -> Result<Value> {
    let text = fs::read_to_string(path).context(|| tr!("io-reading", path = path))?;
    serde_json::from_str(&text).map_err(|e| Error::Parse { path: path.to_owned(), message: e.to_string() })
}

fn from_value(value: Value, path: &Path) -> Result<Template> {
    let mut template: Template =
        serde_json::from_value(value).map_err(|e| Error::Parse { path: path.to_owned(), message: e.to_string() })?;
    if template.id.is_empty() {
        template.id = shelf::stem(path);
    }
    template.sanitise();
    Ok(template)
}

/// A template that comes with the application, whole: what its file does
/// not say is as the template it is based on has it, down to the root.
fn read_whole(shelf: &Shelf, path: &Path, depth: u8) -> Result<Template> {
    let mut value = raw(path)?;
    let based_on = value.get("basedOn").and_then(Value::as_str).map(str::to_owned);
    let stem = shelf::stem(path);
    if let Some(base) = based_on.filter(|b| *b != stem) {
        let base = if depth < 8 { bundled_whole(shelf, &base, depth + 1) } else { None };
        let base = serde_json::to_value(base.unwrap_or_else(Template::plain))?;
        if let (Some(own), Some(from)) = (value.as_object_mut(), base.as_object()) {
            for (key, v) in from {
                if !OWN_FIELDS.contains(&key.as_str()) && !own.contains_key(key) {
                    own.insert(key.clone(), v.clone());
                }
            }
        }
    }
    from_value(value, path)
}

fn bundled_whole(shelf: &Shelf, id: &str, depth: u8) -> Option<Template> {
    if Shelf::check_id::<Template>(id).is_err() {
        return None;
    }
    let path = shelf.bundled_path(id);
    if !path.is_file() {
        return None;
    }
    match read_whole(shelf, &path, depth) {
        Ok(t) => Some(t),
        Err(e) => {
            tracing::warn!(%e, "a template could not be read");
            None
        }
    }
}

impl Shelved for Template {
    const CALLED: &'static str = "a template";

    fn read_bundled(shelf: &Shelf, path: &Path) -> Result<Self> {
        read_whole(shelf, path, 0)
    }

    /// A template of the writer's own, which is saved whole.
    fn read_own(path: &Path) -> Result<Self> {
        let mut t = from_value(raw(path)?, path)?;
        t.group = Group::Own;
        Ok(t)
    }

    fn id(&self) -> &str {
        &self.id
    }
    fn set_id(&mut self, id: String) {
        self.id = id;
    }
    fn name_mut(&mut self) -> &mut String {
        &mut self.name
    }
    fn based_on_mut(&mut self) -> &mut Option<String> {
        &mut self.based_on
    }
    fn readied_as_own(&mut self) {
        self.group = Group::Own;
        self.sanitise();
    }
    fn rank(&self) -> u8 {
        match self.group {
            Group::Own => 0,
            Group::Plain => 1,
            Group::Article => 2,
            Group::Book => 3,
            Group::Fiction => 4,
            Group::Stage => 5,
            Group::Poetry => 6,
            Group::Other => 7,
            Group::Journal => 8,
            Group::Publisher => 9,
            Group::StyleGuide => 10,
        }
    }
    fn name(&self) -> &str {
        &self.name
    }

    fn bad_id(id: &str) -> Error {
        Error::invalid(tr!("core-export-template-bad-id", id = id))
    }
    fn needs_name() -> Error {
        Error::invalid(tr!("core-export-template-needs-name"))
    }
    fn own_only() -> Error {
        Error::invalid(tr!("core-export-template-own-only"))
    }
    fn not_found(id: &str) -> Error {
        Error::not_found(tr!("core-export-the-template", id = id))
    }
}

impl Templates {
    pub fn new(resources: &Path, own: &Path) -> Self {
        Templates { shelf: Shelf::new(resources.join("templates"), own) }
    }

    pub fn all(&self) -> Vec<(Template, bool)> {
        self.shelf.all()
    }

    pub fn list(&self) -> Vec<TemplateSummary> {
        self.all()
            .into_iter()
            .map(|(t, own)| TemplateSummary {
                id: t.id,
                name: t.name,
                group: t.group,
                description: t.description,
                own,
                confidence: t.source.as_ref().map(|s| s.confidence.clone()).unwrap_or_default(),
                checked: t.source.as_ref().map(|s| s.checked.clone()).unwrap_or_default(),
            })
            .collect()
    }

    /// The template with an id, whole. The writer's own is preferred to one
    /// that comes with the application under the same id.
    pub fn get(&self, id: &str) -> Result<Template> {
        self.shelf.get(id)
    }

    /// The template with an id, or the plain one when it is not there.
    pub fn get_or_default(&self, id: &str) -> Template {
        self.shelf.get_or(id, PLAIN, || {
            let mut t = Template::plain();
            t.sanitise();
            t
        })
    }

    /// Saves a template as the writer's own, whole. Returns it as saved.
    pub fn save(&self, template: Template) -> Result<Template> {
        self.shelf.save(template)
    }

    pub fn delete(&self, id: &str) -> Result<()> {
        self.shelf.delete::<Template>(id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_template_read_and_written() {
        let json = r#"{"id":"x","name":"X","group":"journal","layout":"manuscript",
            "contents":[{"part":"title-page"},{"kind":"abstract"},{"part":"body"}],
            "requirements":{"words":8000,"anonymous":true},
            "outputs":[{"id":"document","targets":["pdf","pdf-latex"]},{"id":"cover","name":"Cover","targets":["pdf"],"layout":"cover-a5","places":["cover"]}]}"#;
        let t: Template = serde_json::from_str(json).unwrap();
        assert_eq!(t.group, Group::Journal);
        assert_eq!(t.contents[1], ContentsItem::Kind { kind: "abstract".into() });
        assert_eq!(t.contents[2], ContentsItem::Part { part: GeneratedPart::Body });
        assert_eq!(t.requirements.words, Some(8000));
        assert!(t.requirements.anonymous);
        assert_eq!(t.outputs[0].targets, [OutputTarget::Pdf, OutputTarget::PdfLatex]);
        assert_eq!(t.outputs[1].places, Some(vec![Place::Cover]));
        let back: Value = serde_json::to_value(&t).unwrap();
        assert_eq!(back["contents"][1], serde_json::json!({"kind": "abstract"}));
        assert_eq!(back["outputs"][0]["targets"][1], "pdf-latex");
        assert!(back.get("source").is_none() && back["outputs"][0].get("name").is_none());
        assert_eq!(back["passageKinds"], serde_json::json!([]));
        // Nothing said is the plain template's shape, less its contents.
        let mut bare: Template = serde_json::from_str(r#"{"id":"y","name":"Y"}"#).unwrap();
        assert!(bare.contents.is_empty());
        bare.sanitise();
        assert_eq!(bare.outputs, vec![Output::document()], "the document is always made");
    }

    #[test]
    fn a_built_in_delta_is_read_whole() {
        let tmp = tempfile::tempdir().unwrap();
        let resources = tmp.path().join("resources");
        fs::create_dir_all(resources.join("templates")).unwrap();
        fs::write(resources.join("templates/plain.json"), serde_json::to_string(&Template::plain()).unwrap()).unwrap();
        fs::write(
            resources.join("templates/article.json"),
            r#"{"id":"article","name":"Article","group":"article","basedOn":"plain",
                "contents":[{"part":"title-page"},{"kind":"abstract"},{"part":"body"},{"part":"bibliography"}],
                "kinds":["abstract"],"requirements":{"abstractWords":250}}"#,
        )
        .unwrap();
        fs::write(
            resources.join("templates/journal.json"),
            r#"{"id":"journal","name":"A Journal","group":"journal","basedOn":"article","layout":"manuscript",
                "source":{"name":"The journal","url":"https://example.org","checked":"2026-10-11","confidence":"high","notes":""},
                "requirements":{"words":8000}}"#,
        )
        .unwrap();
        fs::write(resources.join("templates/lost.json"), r#"{"id":"lost","name":"Lost","basedOn":"gone"}"#).unwrap();
        fs::write(resources.join("templates/broken.json"), "{").unwrap();
        let templates = Templates::new(&resources, &tmp.path().join("own"));

        let journal = templates.get("journal").unwrap();
        assert_eq!(journal.layout.as_deref(), Some("manuscript"));
        assert_eq!(journal.contents.len(), 4, "the contents of the article");
        assert_eq!(journal.kinds, vec!["abstract"]);
        assert_eq!(journal.requirements.words, Some(8000), "its own");
        assert_eq!(
            journal.requirements.abstract_words, None,
            "requirements are one field: the article's are not merged in"
        );
        assert_eq!(journal.outputs, vec![Output::document()], "the plain template's, through the article");
        assert_eq!(journal.based_on.as_deref(), Some("article"), "what it was made from is its own");
        assert_eq!(journal.source.as_ref().map(|s| s.confidence.as_str()), Some("high"));
        assert!(templates.get("article").unwrap().source.is_none(), "the source is not inherited");
        // A base that is not there is the plain template.
        assert_eq!(templates.get("lost").unwrap().contents, Template::plain().contents);

        // By group, then by name: one that names no group is plain.
        let list = templates.list();
        assert_eq!(list.iter().map(|t| t.id.as_str()).collect::<Vec<_>>(), ["lost", "plain", "article", "journal"]);
        assert_eq!(list[3].confidence, "high");
        assert!(list.iter().all(|t| !t.own));
    }

    #[test]
    fn own_templates() {
        let tmp = tempfile::tempdir().unwrap();
        let resources = tmp.path().join("resources");
        fs::create_dir_all(resources.join("templates")).unwrap();
        fs::write(resources.join("templates/plain.json"), serde_json::to_string(&Template::plain()).unwrap()).unwrap();
        let templates = Templates::new(&resources, &tmp.path().join("own"));

        // Changing one that comes with the application makes a new one of the writer's own.
        let mut t = templates.get("plain").unwrap();
        t.name = "My Journal’s Wishes".into();
        t.contents.insert(1, ContentsItem::Kind { kind: "abstract".into() });
        let saved = templates.save(t).unwrap();
        assert_eq!(saved.id, "my-journal-s-wishes");
        assert_eq!(saved.based_on.as_deref(), Some("plain"));
        assert_eq!(saved.group, Group::Own);
        assert_eq!(templates.get("plain").unwrap().contents.len(), 4);
        // It is saved whole, and read whole: what it says is not filled from its base.
        let text = fs::read_to_string(tmp.path().join("own/my-journal-s-wishes.json")).unwrap();
        assert!(text.contains("\"outputs\"") && text.contains("\"abstract\""));
        assert_eq!(templates.get(&saved.id).unwrap(), saved);

        let mut again = saved.clone();
        again.requirements.words = Some(5000);
        assert_eq!(templates.save(again).unwrap().id, saved.id);
        assert_eq!(templates.get(&saved.id).unwrap().requirements.words, Some(5000));
        assert_eq!(templates.list().len(), 2);
        assert_eq!(templates.list()[0].id, saved.id, "the writer's own come first");
        assert!(templates.list()[0].own);

        assert!(templates.delete("plain").is_err());
        templates.delete(&saved.id).unwrap();
        assert!(templates.get("../x").is_err());
        assert!(templates.save(Template { name: " ".into(), ..Default::default() }).is_err());
        assert_eq!(templates.get_or_default("gone").id, "plain");
        assert_eq!(
            Templates::new(&tmp.path().join("nowhere"), &tmp.path().join("own")).get_or_default("gone").id,
            "plain"
        );
    }
}

#[cfg(test)]
mod bundled {
    use super::*;

    /// Every template that comes with the application must be readable, be
    /// named as its file is, name only kinds that are known, and ask for a
    /// layout and a reference style that exist.
    #[test]
    fn the_templates_that_come_with_the_application() {
        let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../resources");
        let templates = Templates::new(&root, &root.join("nowhere"));
        let index = fs::read_to_string(root.join("csl/index.json")).unwrap();
        let mut count = 0;
        for entry in fs::read_dir(root.join("templates")).unwrap().flatten() {
            let path = entry.path();
            if path.extension().is_none_or(|e| e != "json") {
                continue;
            }
            count += 1;
            let name = path.file_stem().unwrap().to_string_lossy().into_owned();
            let raw: Value =
                serde_json::from_str(&fs::read_to_string(&path).unwrap()).unwrap_or_else(|e| panic!("{name}: {e}"));
            assert_eq!(raw["id"], name, "{name}: the id must be the name of the file");
            let t = templates.get(&name).unwrap_or_else(|e| panic!("{name}: {e}"));
            assert!(!t.name.trim().is_empty(), "{name}: no name");
            assert!(!t.description.trim().is_empty(), "{name}: no description");
            assert_ne!(t.group, Group::Own, "{name}");
            if let Some(base) = &t.based_on {
                assert!(
                    root.join(format!("templates/{base}.json")).is_file(),
                    "{name}: based on “{base}”, which is not there"
                );
            }
            if let Some(layout) = &t.layout {
                assert!(root.join(format!("formats/{layout}.json")).is_file(), "{name}: there is no layout “{layout}”");
            }
            if let Some(style) = &t.style {
                assert!(index.contains(&format!("\"i\":\"{style}\"")), "{name}: there is no reference style “{style}”");
            }
            let kinds = t.contents.iter().filter_map(|i| match i {
                ContentsItem::Kind { kind } => Some(kind),
                ContentsItem::Part { .. } => None,
            });
            for kind in kinds.chain(t.kinds.iter()) {
                assert!(kinds::entry_of(kind).is_some(), "{name}: there is no kind of element “{kind}”");
            }
            for kind in &t.passage_kinds {
                assert!(
                    crate::formats::kinds::entry_of(kind).is_some(),
                    "{name}: there is no kind of passage “{kind}”"
                );
            }
            assert!(t.output(Output::DOCUMENT).is_some(), "{name}: no document output");
            assert!(!t.contents.is_empty(), "{name}: no contents");
            // Nothing in it is changed by being put within bounds.
            let mut clean = t.clone();
            clean.sanitise();
            assert_eq!(clean, t, "{name}: holds values out of bounds");
            // No key is misspelt: what is written is what is read.
            if let (Some(x), Some(y)) = (raw.as_object(), serde_json::to_value(&t).unwrap().as_object()) {
                for k in x.keys() {
                    assert!(y.contains_key(k), "{name}: “{k}” is not a field of a template");
                }
            }
        }
        assert!(count >= 1);
        assert_eq!(
            templates.get(PLAIN).unwrap(),
            Template::plain(),
            "plain.json is the root template as the code has it"
        );
    }
}
