//! The kinds of elements that make a document, and their looks.
//!
//! An element may say what it is in the document: the abstract, a
//! dedication, an appendix, the cover. The application brings a catalogue of
//! such kinds, each with a base, a place, whether a document has one of it
//! or many, and a look that the layout may change (`DocumentFormat::parts`).
//! A kind is a delta on the kind it is based on, as kinds of passage are
//! (`formats/kinds.rs`). See ADR 0038.
//!
//! The interface has the same catalogue (`src/lib/project/parts.ts`) with
//! the words; the contract test holds the ids alike.

use std::collections::{BTreeMap, HashMap};
use std::sync::OnceLock;

use serde::{Deserialize, Serialize};

use crate::formats::{Align, DocumentFormat};

/// Where a part is printed: before the parent's text and body, after its
/// last child, where it stands among its siblings, in a cover output only,
/// or nowhere.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Place {
    #[default]
    Front,
    Back,
    Here,
    Cover,
    None,
}

/// The group the menu shows a kind in.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PartGroup {
    #[default]
    Front,
    Back,
    Cover,
}

/// How a part kind differs from the kind it is based on. What is not said
/// is as the base has it.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct PartLook {
    /// Whether the element's name is printed as a heading.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub heading: Option<bool>,
    /// On a page of its own.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub own_page: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub new_page: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub align: Option<Align>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub italic: Option<bool>,
    /// In points; 0 for the size of the text.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub size: Option<f32>,
    /// Numbered by letters, as appendices are.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lettered: Option<bool>,
}

impl PartLook {
    pub fn is_empty(&self) -> bool {
        *self == PartLook::default()
    }

    /// Puts values that make no sense back within bounds.
    pub fn sanitise(&mut self) {
        if let Some(s) = self.size
            && (!s.is_finite() || !(0.0..=72.0).contains(&s))
        {
            self.size = None;
        }
    }
}

/// The look of a part kind with everything said.
#[derive(Debug, Clone, PartialEq)]
pub struct Resolved {
    pub heading: bool,
    pub own_page: bool,
    pub new_page: bool,
    pub align: Align,
    pub italic: bool,
    /// 0 for the size of the text.
    pub size: f32,
    pub lettered: bool,
}

impl Default for Resolved {
    /// A section as the text has it: with its heading, where the text is,
    /// set as the text is set.
    fn default() -> Self {
        Resolved {
            heading: true,
            own_page: false,
            new_page: false,
            align: Align::Left,
            italic: false,
            size: 0.0,
            lettered: false,
        }
    }
}

impl Resolved {
    /// Takes in what a look says.
    pub fn apply(&mut self, look: &PartLook) {
        if let Some(v) = look.heading {
            self.heading = v;
        }
        if let Some(v) = look.own_page {
            self.own_page = v;
        }
        if let Some(v) = look.new_page {
            self.new_page = v;
        }
        if let Some(v) = look.align {
            self.align = v;
        }
        if let Some(v) = look.italic {
            self.italic = v;
        }
        if let Some(v) = look.size {
            self.size = v;
        }
        if let Some(v) = look.lettered {
            self.lettered = v;
        }
    }
}

/// A kind that comes with the application. Written as the interface
/// declares a `PartKindEntry`, for the contract test.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Entry {
    pub id: &'static str,
    pub group: PartGroup,
    pub based_on: Option<&'static str>,
    pub place: Place,
    /// Whether a document has one of it, or many.
    pub one: bool,
    /// The name of its style in Word and Writer.
    pub style: &'static str,
    pub look: PartLook,
}

fn entry(
    id: &'static str,
    group: PartGroup,
    based_on: Option<&'static str>,
    place: Place,
    one: bool,
    style: &'static str,
    look: PartLook,
) -> Entry {
    Entry { id, group, based_on, place, one, style, look }
}

/// The kinds that come with the application, in the order the menu lists
/// them: the bases first, then the named kinds by group.
pub fn catalogue() -> &'static [Entry] {
    static ALL: OnceLock<Vec<Entry>> = OnceLock::new();
    ALL.get_or_init(|| {
        use PartGroup::{Back, Cover, Front};
        let plain = PartLook::default;
        let unheaded = || PartLook { heading: Some(false), ..PartLook::default() };
        vec![
            // The bases.
            entry("front-section", Front, None, Place::Front, false, "Front Section", plain()),
            entry("back-section", Back, None, Place::Back, false, "Back Section", plain()),
            entry(
                "own-page",
                Front,
                None,
                Place::Front,
                false,
                "Own Page",
                PartLook { own_page: Some(true), align: Some(Align::Center), ..unheaded() },
            ),
            entry("cover", Cover, None, Place::Cover, true, "Cover", unheaded()),
            // The front matter. The abstract is set as the layout sets the
            // abstract, under the layout's label (`export::prepare`); its
            // look serves where it stands deeper down.
            entry("abstract", Front, Some("front-section"), Place::Front, true, "Abstract", plain()),
            entry(
                "dedication",
                Front,
                Some("own-page"),
                Place::Front,
                false,
                "Dedication",
                PartLook { italic: Some(true), ..plain() },
            ),
            // "Epigraph" is the style of the kind of passage; the page is told apart by its name.
            entry("epigraph", Front, Some("own-page"), Place::Front, false, "Epigraph Page", plain()),
            entry(
                "copyright",
                Front,
                Some("own-page"),
                Place::Front,
                true,
                "Copyright",
                PartLook { align: Some(Align::Left), size: Some(9.0), ..plain() },
            ),
            entry("foreword", Front, Some("front-section"), Place::Front, false, "Foreword", plain()),
            entry("preface", Front, Some("front-section"), Place::Front, false, "Preface", plain()),
            entry("cast", Front, Some("front-section"), Place::Front, false, "Cast", plain()),
            entry("setting", Front, Some("front-section"), Place::Front, false, "Setting", plain()),
            entry(
                "standfirst",
                Front,
                Some("front-section"),
                Place::Front,
                true,
                "Standfirst",
                PartLook { italic: Some(true), ..unheaded() },
            ),
            // The back matter.
            entry("acknowledgements", Back, Some("back-section"), Place::Back, false, "Acknowledgements", plain()),
            entry(
                "appendix",
                Back,
                Some("back-section"),
                Place::Back,
                false,
                "Appendix",
                PartLook { lettered: Some(true), ..plain() },
            ),
            entry("afterword", Back, Some("back-section"), Place::Back, false, "Afterword", plain()),
            entry("glossary", Back, Some("back-section"), Place::Back, false, "Glossary", plain()),
            entry("about-the-author", Back, Some("back-section"), Place::Back, true, "About the Author", plain()),
            entry("signature", Back, Some("back-section"), Place::Back, true, "Signature", unheaded()),
            // The cover.
            entry("blurb", Cover, Some("cover"), Place::Cover, true, "Blurb", unheaded()),
        ]
    })
}

pub fn entry_of(id: &str) -> Option<&'static Entry> {
    catalogue().iter().find(|e| e.id == id)
}

/// Where a kind is printed; a kind that is not known is printed as a
/// section of the front matter, so that nothing is lost.
pub fn place_of(id: &str) -> Place {
    entry_of(id).map(|e| e.place).unwrap_or(Place::Front)
}

/// Whether a document has one of a kind. Of a kind that is not known, many.
pub fn one_of(id: &str) -> bool {
    entry_of(id).is_some_and(|e| e.one)
}

/// The look of a part kind, with everything the layout and the kinds it is
/// based on say: the base, then what the kind says of itself, then what the
/// layout says of it. Of a kind that is not known, that of a section with
/// its heading.
pub fn resolve(f: &DocumentFormat, id: &str) -> Resolved {
    fn go(f: &DocumentFormat, id: &str, depth: u8) -> Resolved {
        if depth > 8 {
            return Resolved::default();
        }
        let mut r = match entry_of(id) {
            Some(e) => {
                let mut r = match e.based_on {
                    Some(base) => go(f, base, depth + 1),
                    None => Resolved::default(),
                };
                r.apply(&e.look);
                r
            }
            None => Resolved::default(),
        };
        if let Some(look) = f.parts.get(id) {
            r.apply(look);
        }
        r
    }
    go(f, id, 0)
}

/// What is known of a part kind where a document is made: the name of its
/// style in Word and Writer, and its look.
#[derive(Debug, Clone, PartialEq)]
pub struct PartInfo {
    pub style: String,
    pub look: Resolved,
}

/// Every kind of the catalogue, with what is known of it under the layout.
pub fn table(f: &DocumentFormat) -> HashMap<String, PartInfo> {
    catalogue()
        .iter()
        .map(|e| (e.id.to_owned(), PartInfo { style: e.style.to_owned(), look: resolve(f, e.id) }))
        .collect()
}

/// The kinds in a steady order, the catalogue's, each with what is known of
/// it: for the styles of Word and Writer, and the rules of the other targets.
pub fn styled(f: &DocumentFormat) -> Vec<(String, PartInfo)> {
    catalogue()
        .iter()
        .map(|e| (e.id.to_owned(), PartInfo { style: e.style.to_owned(), look: resolve(f, e.id) }))
        .collect()
}

/// The looks of the layout's table, kept within bounds.
pub fn sanitise(parts: &mut BTreeMap<String, PartLook>) {
    parts.retain(|id, _| !id.is_empty() && id.len() <= 80);
    for look in parts.values_mut() {
        look.sanitise();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_kind_is_a_delta_on_the_kind_it_is_based_on() {
        let mut f = DocumentFormat::default();
        let dedication = resolve(&f, "dedication");
        assert!(dedication.own_page && !dedication.heading, "as a page of its own");
        assert_eq!(dedication.align, Align::Center);
        assert!(dedication.italic, "and in italics");
        let copyright = resolve(&f, "copyright");
        assert_eq!(copyright.align, Align::Left);
        assert_eq!(copyright.size, 9.0);
        assert!(copyright.own_page);
        let appendix = resolve(&f, "appendix");
        assert!(appendix.heading && appendix.lettered && !appendix.own_page);
        assert!(!resolve(&f, "standfirst").heading);
        // The layout can say otherwise of any kind, and of a base for every kind on it.
        f.parts.insert("own-page".into(), PartLook { italic: Some(true), new_page: Some(true), ..Default::default() });
        f.parts.insert("dedication".into(), PartLook { align: Some(Align::Right), ..Default::default() });
        let again = resolve(&f, "dedication");
        assert_eq!(again.align, Align::Right);
        assert!(again.italic && again.new_page);
        assert!(resolve(&f, "epigraph").italic, "through the base");
        // One that is not known is a plain section.
        assert_eq!(resolve(&f, "gone"), Resolved::default());
        assert_eq!(place_of("gone"), Place::Front);
        assert_eq!(place_of("appendix"), Place::Back);
        assert_eq!(place_of("blurb"), Place::Cover);
        assert!(one_of("abstract") && !one_of("appendix") && !one_of("gone"));
    }

    #[test]
    fn the_catalogue_is_whole() {
        let all = catalogue();
        let mut ids = std::collections::HashSet::new();
        for e in all {
            assert!(ids.insert(e.id), "{} twice", e.id);
            if let Some(base) = e.based_on {
                assert!(entry_of(base).is_some(), "{}: based on {base}, which is not there", e.id);
            }
            assert!(!e.style.is_empty(), "{}: no style", e.id);
        }
        let styles: Vec<&str> = all.iter().map(|e| e.style).collect();
        for s in &styles {
            assert_eq!(styles.iter().filter(|t| t == &s).count(), 1, "the style {s} is named twice");
        }
        // No style named as a kind of passage is, which would be one style with two looks.
        for p in crate::formats::kinds::catalogue() {
            assert!(!styles.contains(&p.style) || p.style.is_empty(), "{} is also a kind of passage", p.style);
        }
        assert_eq!(table(&DocumentFormat::default()).len(), all.len());
    }

    #[test]
    fn a_look_read_and_written() {
        let look: PartLook =
            serde_json::from_str(r#"{"heading":false,"ownPage":true,"align":"center","size":900}"#).unwrap();
        assert_eq!(look.own_page, Some(true));
        let mut clean = look.clone();
        clean.sanitise();
        assert_eq!(clean.size, None);
        assert_eq!(serde_json::to_string(&clean).unwrap(), r#"{"heading":false,"ownPage":true,"align":"center"}"#);
        let entry: serde_json::Value = serde_json::to_value(entry_of("appendix").unwrap()).unwrap();
        assert_eq!(entry["basedOn"], "back-section");
        assert_eq!(entry["look"]["lettered"], true);
    }
}
