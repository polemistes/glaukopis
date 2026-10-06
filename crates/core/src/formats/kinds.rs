//! The kinds of passage and of words, and their looks.
//!
//! A passage has a kind, which is a meaning and not a look: a quotation, an
//! epigraph, the heading of a scene, a word in another language. The look
//! of a kind lives in the format, as a row of its table (`DocumentFormat::
//! kinds`), never in the text; and a kind says only how it differs from the
//! kind it is based on, so that a kind of the writer's own works in every
//! format. See ADR 0029.
//!
//! The catalogue here is the kinds that come with the application: what
//! each is based on, how it differs by default, and what its style is
//! called in Word and Writer. The interface has the same catalogue
//! (`src/lib/editor/kinds.ts`) with what each kind does while writing; the
//! contract test holds the two alike.

use std::collections::{BTreeMap, HashMap};
use std::sync::OnceLock;

use serde::{Deserialize, Serialize};

use super::{Align, Case, DocumentFormat, Length, Paragraphs};

/// Of paragraphs, or of words within them.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Family {
    #[default]
    Paragraph,
    Words,
}

/// How a kind differs from the kind it is based on. What is not said is as
/// the base has it.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Look {
    /// In points.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub size: Option<f32>,
    /// 1 is single spacing, 2 is double.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub line_spacing: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub align: Option<Align>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub indent_left: Option<Length>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub indent_right: Option<Length>,
    /// How far the first line begins in, beyond the rest.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub first_line: Option<Length>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub space_before: Option<Length>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub space_after: Option<Length>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bold: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub italic: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub case: Option<Case>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub underline: Option<bool>,
    /// In letters of equal width, as code is.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub monospace: Option<bool>,
    /// Kept on the page with what follows it.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub keep_with_next: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub new_page: Option<bool>,
    /// What stands in a passage that holds no text of its own: the sign of a break.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
}

impl Look {
    pub fn is_empty(&self) -> bool {
        *self == Look::default()
    }

    /// Puts values that make no sense back within bounds.
    pub fn sanitise(&mut self) {
        if let Some(s) = self.size
            && (!s.is_finite() || !(0.0..=72.0).contains(&s))
        {
            self.size = None;
        }
        if let Some(l) = self.line_spacing
            && (!l.is_finite() || !(0.0..=4.0).contains(&l))
        {
            self.line_spacing = None;
        }
        for l in [&mut self.indent_left, &mut self.indent_right, &mut self.first_line] {
            if l.is_some_and(|l| l.points().abs() > 400.0) {
                *l = None;
            }
        }
        for l in [&mut self.space_before, &mut self.space_after] {
            if l.is_some_and(|l| !(0.0..=400.0).contains(&l.points())) {
                *l = None;
            }
        }
        if let Some(t) = &self.text
            && t.chars().count() > 40
        {
            self.text = Some(t.chars().take(40).collect());
        }
    }
}

/// The look of a kind with everything said: what the format and the kinds it
/// is based on come to.
#[derive(Debug, Clone, PartialEq)]
pub struct Resolved {
    pub size: f32,
    pub line_spacing: f32,
    pub align: Align,
    pub indent_left: Length,
    pub indent_right: Length,
    pub first_line: Length,
    pub space_before: Length,
    pub space_after: Length,
    pub bold: bool,
    pub italic: bool,
    pub case: Case,
    pub underline: bool,
    pub monospace: bool,
    pub keep_with_next: bool,
    pub new_page: bool,
    pub text: String,
}

impl Resolved {
    /// The look that words have before anything is said of them: as the
    /// text around them. A size of nought is that of the text.
    pub fn words() -> Self {
        Resolved {
            size: 0.0,
            line_spacing: 0.0,
            align: Align::Left,
            indent_left: Length::pt(0.0),
            indent_right: Length::pt(0.0),
            first_line: Length::pt(0.0),
            space_before: Length::pt(0.0),
            space_after: Length::pt(0.0),
            bold: false,
            italic: false,
            case: Case::None,
            underline: false,
            monospace: false,
            keep_with_next: false,
            new_page: false,
            text: String::new(),
        }
    }

    /// The look of a paragraph of text, as the format has it.
    pub fn text(f: &DocumentFormat) -> Self {
        let (first, after) = match f.text.paragraphs {
            Paragraphs::Indent => (f.text.indent, Length::pt(0.0)),
            Paragraphs::Spaced => (Length::pt(0.0), f.text.space_between),
        };
        Resolved {
            size: f.font.size,
            line_spacing: f.text.line_spacing,
            align: f.text.align,
            first_line: first,
            space_after: after,
            ..Resolved::words()
        }
    }

    /// The look of a quotation set off from the text, as the format has it.
    pub fn quote(f: &DocumentFormat) -> Self {
        let text = Resolved::text(f);
        let gap = Length::pt(6.0 + text.space_after.points());
        Resolved {
            size: if f.quote.size > 0.0 { f.quote.size } else { text.size },
            line_spacing: if f.quote.line_spacing > 0.0 { f.quote.line_spacing } else { text.line_spacing },
            indent_left: f.quote.indent_left,
            indent_right: f.quote.indent_right,
            first_line: Length::pt(0.0),
            space_before: gap,
            space_after: gap,
            italic: f.quote.italic,
            ..text
        }
    }

    /// Takes in what a look says.
    pub fn apply(&mut self, look: &Look) {
        if let Some(v) = look.size {
            self.size = v;
        }
        if let Some(v) = look.line_spacing {
            self.line_spacing = v;
        }
        if let Some(v) = look.align {
            self.align = v;
        }
        if let Some(v) = look.indent_left {
            self.indent_left = v;
        }
        if let Some(v) = look.indent_right {
            self.indent_right = v;
        }
        if let Some(v) = look.first_line {
            self.first_line = v;
        }
        if let Some(v) = look.space_before {
            self.space_before = v;
        }
        if let Some(v) = look.space_after {
            self.space_after = v;
        }
        if let Some(v) = look.bold {
            self.bold = v;
        }
        if let Some(v) = look.italic {
            self.italic = v;
        }
        if let Some(v) = look.case {
            self.case = v;
        }
        if let Some(v) = look.underline {
            self.underline = v;
        }
        if let Some(v) = look.monospace {
            self.monospace = v;
        }
        if let Some(v) = look.keep_with_next {
            self.keep_with_next = v;
        }
        if let Some(v) = look.new_page {
            self.new_page = v;
        }
        if let Some(v) = &look.text {
            self.text = v.clone();
        }
    }
}

/// A kind of the writer's own, as the document carries it: based on
/// another kind, with how it differs from it.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct OwnKind {
    pub id: String,
    pub name: String,
    pub family: Family,
    /// The id of the kind it is based on; text, where it says nothing.
    pub based_on: String,
    pub look: Look,
}

/// A kind that comes with the application. Written as the interface
/// declares a `KindEntry`, for the contract test.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Entry {
    pub id: &'static str,
    pub family: Family,
    /// The group the tools show it in.
    pub group: &'static str,
    pub based_on: Option<&'static str>,
    /// The name of its style in Word and Writer; empty where the kind is
    /// set by the program that writes the document, as lists are.
    pub style: &'static str,
    pub look: Look,
}

fn entry(
    id: &'static str,
    family: Family,
    group: &'static str,
    based_on: Option<&'static str>,
    style: &'static str,
    look: Look,
) -> Entry {
    Entry { id, family, group, based_on, style, look }
}

const NONE: Length = Length::pt(0.0);

/// The kinds that come with the application, in the order the tools list them.
pub fn catalogue() -> &'static [Entry] {
    static ALL: OnceLock<Vec<Entry>> = OnceLock::new();
    ALL.get_or_init(|| {
        use Family::{Paragraph, Words};
        let plain = Look::default;
        let flat = || Look { first_line: Some(NONE), ..Look::default() };
        vec![
            // Text.
            entry("text", Paragraph, "text", None, "Body Text", plain()),
            entry("quote", Paragraph, "text", None, "Block Text", plain()),
            entry("list", Paragraph, "text", None, "", plain()),
            entry("numbered", Paragraph, "text", None, "", plain()),
            // What goes with a quotation.
            entry(
                "attribution",
                Paragraph,
                "quotation",
                Some("quote"),
                "Attribution",
                Look { align: Some(Align::Right), space_before: Some(NONE), italic: Some(false), ..flat() },
            ),
            entry(
                "epigraph",
                Paragraph,
                "quotation",
                Some("quote"),
                "Epigraph",
                Look {
                    indent_left: Some(Length::cm(4.0)),
                    indent_right: Some(NONE),
                    space_after: Some(Length::pt(18.0)),
                    ..flat()
                },
            ),
            // Verse: the lines, the speaker, the stage direction.
            entry("verse", Paragraph, "verse", None, "", plain()),
            entry("speaker", Words, "verse", None, "Speaker", Look { case: Some(Case::Smallcaps), ..plain() }),
            entry("direction", Words, "verse", None, "Stage Direction", Look { italic: Some(true), ..plain() }),
            // A screenplay: the measures of the standard script page, from the margin of the text.
            entry(
                "scene",
                Paragraph,
                "script",
                None,
                "Scene Heading",
                Look {
                    bold: Some(true),
                    case: Some(Case::Upper),
                    space_before: Some(Length::pt(19.0)),
                    space_after: Some(Length::pt(11.0)),
                    keep_with_next: Some(true),
                    align: Some(Align::Left),
                    ..flat()
                },
            ),
            entry(
                "action",
                Paragraph,
                "script",
                None,
                "Action",
                Look {
                    space_before: Some(Length::pt(11.0)),
                    space_after: Some(Length::pt(11.0)),
                    align: Some(Align::Left),
                    ..flat()
                },
            ),
            entry(
                "character",
                Paragraph,
                "script",
                None,
                "Character",
                Look {
                    indent_left: Some(Length::cm(5.6)),
                    case: Some(Case::Upper),
                    space_before: Some(Length::pt(11.0)),
                    space_after: Some(NONE),
                    keep_with_next: Some(true),
                    align: Some(Align::Left),
                    ..flat()
                },
            ),
            entry(
                "dialogue",
                Paragraph,
                "script",
                None,
                "Dialogue",
                Look {
                    indent_left: Some(Length::cm(2.5)),
                    indent_right: Some(Length::cm(3.8)),
                    space_before: Some(NONE),
                    space_after: Some(NONE),
                    align: Some(Align::Left),
                    ..flat()
                },
            ),
            entry(
                "parenthetical",
                Paragraph,
                "script",
                None,
                "Parenthetical",
                Look {
                    indent_left: Some(Length::cm(4.0)),
                    indent_right: Some(Length::cm(4.0)),
                    space_before: Some(NONE),
                    space_after: Some(NONE),
                    keep_with_next: Some(true),
                    align: Some(Align::Left),
                    ..flat()
                },
            ),
            entry(
                "transition",
                Paragraph,
                "script",
                None,
                "Transition",
                Look {
                    align: Some(Align::Right),
                    case: Some(Case::Upper),
                    space_before: Some(Length::pt(11.0)),
                    space_after: Some(Length::pt(11.0)),
                    ..flat()
                },
            ),
            // More kinds of paragraph.
            entry(
                "headword",
                Paragraph,
                "more",
                None,
                "Headword",
                Look {
                    bold: Some(true),
                    space_before: Some(Length::pt(6.0)),
                    space_after: Some(NONE),
                    keep_with_next: Some(true),
                    ..flat()
                },
            ),
            entry(
                "gloss",
                Paragraph,
                "more",
                None,
                "Gloss",
                Look {
                    indent_left: Some(Length::cm(1.27)),
                    space_before: Some(NONE),
                    space_after: Some(Length::pt(6.0)),
                    ..flat()
                },
            ),
            entry(
                "code",
                Paragraph,
                "more",
                None,
                "Source Code",
                Look {
                    monospace: Some(true),
                    line_spacing: Some(1.0),
                    align: Some(Align::Left),
                    space_before: Some(Length::pt(6.0)),
                    space_after: Some(Length::pt(6.0)),
                    ..flat()
                },
            ),
            entry(
                "break",
                Paragraph,
                "more",
                None,
                "Section Break",
                Look {
                    align: Some(Align::Center),
                    space_before: Some(Length::pt(12.0)),
                    space_after: Some(Length::pt(12.0)),
                    keep_with_next: Some(true),
                    text: Some("* * *".into()),
                    ..flat()
                },
            ),
            entry("draft", Paragraph, "more", None, "", plain()),
            // Kinds of words.
            entry("foreign", Words, "words", None, "Foreign", Look { italic: Some(true), ..plain() }),
            entry("title", Words, "words", None, "Title of a Work", Look { italic: Some(true), ..plain() }),
            entry("term", Words, "words", None, "Term", Look { italic: Some(true), ..plain() }),
            entry("mention", Words, "words", None, "Mention", plain()),
            entry("highlight", Words, "words", None, "", plain()),
        ]
    })
}

pub fn entry_of(id: &str) -> Option<&'static Entry> {
    catalogue().iter().find(|e| e.id == id)
}

/// The look of a kind, with everything the format and the kinds it is based
/// on say; of a kind that is not known, that of text or of plain words.
pub fn resolve(f: &DocumentFormat, id: &str, own: &[OwnKind]) -> Resolved {
    fn go(f: &DocumentFormat, id: &str, own: &[OwnKind], depth: u8) -> Resolved {
        if depth > 8 {
            return Resolved::text(f);
        }
        let with_format = |mut r: Resolved| {
            if let Some(look) = f.kinds.get(id) {
                r.apply(look);
            }
            r
        };
        match id {
            "text" => return with_format(Resolved::text(f)),
            "quote" => return with_format(Resolved::quote(f)),
            _ => {}
        }
        if let Some(e) = entry_of(id) {
            let mut r = match (e.family, e.based_on) {
                (Family::Words, Some(base)) => go(f, base, own, depth + 1),
                (Family::Words, None) => Resolved::words(),
                (Family::Paragraph, base) => go(f, base.unwrap_or("text"), own, depth + 1),
            };
            r.apply(&e.look);
            return with_format(r);
        }
        if let Some(k) = own.iter().find(|k| k.id == id) {
            let base = k.based_on.trim();
            let known = !base.is_empty() && (entry_of(base).is_some() || own.iter().any(|o| o.id == base));
            let mut r = match (k.family, known) {
                (Family::Words, true) => go(f, base, own, depth + 1),
                (Family::Words, false) => Resolved::words(),
                (Family::Paragraph, true) => go(f, base, own, depth + 1),
                (Family::Paragraph, false) => Resolved::text(f),
            };
            r.apply(&k.look);
            return with_format(r);
        }
        Resolved::text(f)
    }
    go(f, id, own, 0)
}

/// Of what family a kind is; nothing for one that is not known.
pub fn family_of(id: &str, own: &[OwnKind]) -> Option<Family> {
    entry_of(id).map(|e| e.family).or_else(|| own.iter().find(|k| k.id == id).map(|k| k.family))
}

/// What is known of a kind where a document is made: its family, the name
/// of its style in Word and Writer, and its look.
#[derive(Debug, Clone, PartialEq)]
pub struct KindInfo {
    pub family: Family,
    /// Empty where the kind has no style of its own.
    pub style: String,
    pub look: Resolved,
    /// Whether it is the writer's own.
    pub own: bool,
}

/// The name of a style in Word and Writer made from the name of a kind of
/// the writer's own: letters, digits and single spaces, which both know.
pub fn style_name(name: &str) -> String {
    let cleaned: String = name.chars().map(|c| if c.is_alphanumeric() { c } else { ' ' }).collect();
    let words: Vec<&str> = cleaned.split_whitespace().collect();
    let joined = words.join(" ");
    let out: String = joined.chars().take(60).collect();
    if out.is_empty() { "Kind".into() } else { out }
}

/// Every kind, with what is known of it: those that come with the
/// application, and the writer's own.
pub fn table(f: &DocumentFormat, own: &[OwnKind]) -> HashMap<String, KindInfo> {
    let mut out = HashMap::new();
    let mut names: Vec<String> = catalogue().iter().map(|e| e.style.to_ascii_lowercase()).collect();
    for e in catalogue() {
        out.insert(
            e.id.to_owned(),
            KindInfo { family: e.family, style: e.style.to_owned(), look: resolve(f, e.id, own), own: false },
        );
    }
    for k in own {
        if k.id.trim().is_empty() || out.contains_key(&k.id) {
            continue;
        }
        let mut style = style_name(&k.name);
        let mut n = 2;
        while names.contains(&style.to_ascii_lowercase()) {
            style = format!("{} {n}", style_name(&k.name));
            n += 1;
        }
        names.push(style.to_ascii_lowercase());
        out.insert(k.id.clone(), KindInfo { family: k.family, style, look: resolve(f, &k.id, own), own: true });
    }
    out
}

/// The kinds that have a style of their own in Word and Writer, in a steady
/// order: the catalogue's, then the writer's own.
pub fn styled(f: &DocumentFormat, own: &[OwnKind]) -> Vec<(String, KindInfo)> {
    let all = table(f, own);
    let mut out: Vec<(String, KindInfo)> = Vec::new();
    for e in catalogue() {
        if let Some(info) = all.get(e.id)
            && !info.style.is_empty()
            && !matches!(e.id, "text" | "quote")
        {
            out.push((e.id.to_owned(), info.clone()));
        }
    }
    for k in own {
        if let Some(info) = all.get(&k.id)
            && info.own
        {
            out.push((k.id.clone(), info.clone()));
        }
    }
    out
}

/// The quotation marks of a language, for a word that is mentioned.
pub fn quotes(language: Option<&str>) -> (&'static str, &'static str) {
    let whole = language.unwrap_or("en").trim().to_ascii_lowercase();
    let mut subtags = whole.split(['-', '_']);
    let lang = subtags.next().unwrap_or("en");
    let rest: Vec<&str> = subtags.collect();
    let traditional = rest.iter().any(|s| matches!(*s, "hant" | "tw" | "hk" | "mo"));
    let brazil = rest.iter().any(|s| *s == "br");
    match lang {
        "nb" | "nn" | "no" | "el" | "es" | "it" | "ru" | "uk" | "be" | "sq" => ("«", "»"),
        "pt" if !brazil => ("«", "»"),
        "fr" => ("«\u{a0}", "\u{a0}»"),
        "da" => ("»", "«"),
        "de" | "cs" | "sk" | "sl" | "sr" | "bs" | "is" | "bg" | "mk" | "et" | "lt" => ("„", "“"),
        "sv" | "fi" => ("”", "”"),
        "nl" | "pl" | "hr" | "ro" | "hu" | "lv" => ("„", "”"),
        "zh" if traditional => ("「", "」"),
        "ja" => ("「", "」"),
        _ => ("“", "”"),
    }
}

/// The looks of the format's table, kept within bounds.
pub fn sanitise(kinds: &mut BTreeMap<String, Look>) {
    kinds.retain(|id, _| !id.is_empty() && id.len() <= 80);
    for look in kinds.values_mut() {
        look.sanitise();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_kind_is_a_delta_on_the_kind_it_is_based_on() {
        let mut f = DocumentFormat::default();
        f.quote.indent_left = Length::cm(2.0);
        f.quote.italic = true;
        let attribution = resolve(&f, "attribution", &[]);
        assert_eq!(attribution.indent_left, Length::cm(2.0), "as the quotation has it");
        assert_eq!(attribution.align, Align::Right);
        assert!(!attribution.italic, "but not in italics");
        assert_eq!(attribution.size, f.font.size);
        // The format can say otherwise of any kind.
        f.kinds.insert("attribution".into(), Look { italic: Some(true), size: Some(10.0), ..Default::default() });
        let again = resolve(&f, "attribution", &[]);
        assert!(again.italic);
        assert_eq!(again.size, 10.0);
    }

    #[test]
    fn a_kind_of_the_writers_own_works_in_every_format() {
        let own = vec![OwnKind {
            id: "k1".into(),
            name: "Letter".into(),
            family: Family::Paragraph,
            based_on: "epigraph".into(),
            look: Look { italic: Some(true), ..Default::default() },
        }];
        let f = DocumentFormat::default();
        let letter = resolve(&f, "k1", &own);
        assert_eq!(letter.indent_left, Length::cm(4.0), "as an epigraph");
        assert!(letter.italic);
        let table = table(&f, &own);
        assert_eq!(table["k1"].style, "Letter");
        assert!(table["k1"].own);
        assert_eq!(table["scene"].style, "Scene Heading");
        // One based on nothing that is known is text.
        let lost = vec![OwnKind { id: "k2".into(), based_on: "gone".into(), ..own[0].clone() }];
        assert_eq!(resolve(&f, "k2", &lost).indent_left, Length::pt(0.0));
        // A circle ends.
        let circle = vec![
            OwnKind { id: "a".into(), based_on: "b".into(), ..own[0].clone() },
            OwnKind { id: "b".into(), based_on: "a".into(), ..own[0].clone() },
        ];
        let _ = resolve(&f, "a", &circle);
    }

    #[test]
    fn names_of_styles() {
        assert_eq!(style_name("  Letter (old) / 2 "), "Letter old 2");
        assert_eq!(style_name("!!!"), "Kind");
        let own = vec![
            OwnKind { id: "x".into(), name: "Epigraph".into(), ..Default::default() },
            OwnKind { id: "y".into(), name: "Epigraph".into(), ..Default::default() },
        ];
        let table = table(&DocumentFormat::default(), &own);
        assert_eq!(table["x"].style, "Epigraph 2");
        assert_eq!(table["y"].style, "Epigraph 3");
        assert_eq!(styled(&DocumentFormat::default(), &own).len(), catalogue().len() - 7 + 2);
    }

    #[test]
    fn the_quotes_of_languages() {
        assert_eq!(quotes(Some("en-GB")), ("“", "”"));
        assert_eq!(quotes(Some("nb")), ("«", "»"));
        assert_eq!(quotes(Some("de-DE")), ("„", "“"));
        assert_eq!(quotes(None), ("“", "”"));
    }

    #[test]
    fn a_look_read_and_written() {
        let look: Look = serde_json::from_str(r##"{"italic":true,"indentLeft":"1cm","text":"#"}"##).unwrap();
        assert_eq!(look.indent_left, Some(Length::cm(1.0)));
        assert_eq!(serde_json::to_string(&look).unwrap(), r##"{"indentLeft":"1cm","italic":true,"text":"#"}"##);
        let mut wild = Look { size: Some(900.0), line_spacing: Some(-1.0), ..Default::default() };
        wild.sanitise();
        assert!(wild.is_empty());
    }
}
