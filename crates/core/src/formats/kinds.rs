//! The kinds of paragraph and of words, and their looks.
//!
//! A paragraph has a kind, which is a meaning and not a look: a quotation,
//! a line of verse, the heading of a scene, a word in another language. The
//! look of a kind lives in the layout, as a row of its table (`DocumentFormat::
//! kinds`), never in the text, and never in the kind itself; a kind says
//! only how it differs from the kind it is based on, so that a kind of the
//! writer's own works in every layout. See ADR 0029 and 0040.
//!
//! The catalogue here is the kinds that come with the application: how the
//! document groups paragraphs of each that stand together, whether a
//! numbering counts their lines, whether a kind may also stand on words,
//! what each is based on, and what its style is called in Word and Writer. The base
//! looks, which every layout is resolved against, stand beside it. The
//! interface has the same facts (`src/lib/project/model/families.ts`) and
//! adds what each kind does while writing; the contract test holds the two
//! alike.

use std::collections::{BTreeMap, HashMap};
use std::sync::OnceLock;

use serde::{Deserialize, Serialize};

use super::{Align, Case, DocumentFormat, Length};

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
/// is based on come to. Sent to the layout editor as it is, lengths with
/// their unit (`ResolvedLook` in `src/lib/api/documents.ts`).
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
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

    /// The look of a paragraph of text, as the format has it: the indent of
    /// its first line and the space after it, either of them nought.
    pub fn text(f: &DocumentFormat) -> Self {
        Resolved {
            size: f.font.size,
            line_spacing: f.text.line_spacing,
            align: f.text.align,
            first_line: f.text.indent,
            space_after: f.text.space_between,
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

/// A kind that comes with the application: what it means, as far as the
/// shape of a text needs to know, and nothing of how it looks. Written as
/// the interface declares a `KindEntry`, for the contract test; the
/// interface has the same facts in `src/lib/project/model/families.ts`.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Entry {
    pub id: &'static str,
    pub family: Family,
    /// How the document groups paragraphs of it that stand together:
    /// `lines` (a line block), `quote` (a block quote), `list`, `code`,
    /// `glossary` (a description list), `none` (each a paragraph of its
    /// own); `words` for a kind of words only.
    pub group: &'static str,
    pub based_on: Option<&'static str>,
    /// The name of its style in Word and Writer; empty where the kind is
    /// set by the program that writes the document, as lists are.
    pub style: &'static str,
    /// Whether a numbering counts its lines.
    pub counted: bool,
    /// Whether it may also stand on words, as a speaker and a direction may.
    pub words: bool,
}

const fn entry(
    id: &'static str,
    family: Family,
    group: &'static str,
    based_on: Option<&'static str>,
    style: &'static str,
    counted: bool,
) -> Entry {
    Entry { id, family, group, based_on, style, counted, words: false }
}

/// A kind of paragraph that may also stand on words.
const fn on_words(id: &'static str, style: &'static str) -> Entry {
    Entry { id, family: Family::Paragraph, group: "none", based_on: None, style, counted: false, words: true }
}

/// The kinds that come with the application, in the order the tools list
/// them, as `src/lib/project/model/families.ts` has them. The ids are
/// stored in projects and must not change.
pub const CATALOGUE: &[Entry] = {
    use Family::{Paragraph, Words};
    &[
        entry("text", Paragraph, "none", None, "Body Text", true),
        // A quotation set off from the text, one at the head of a part, and the line that names the source.
        entry("quote", Paragraph, "quote", None, "Block Text", true),
        entry("epigraph", Paragraph, "none", Some("quote"), "Epigraph", true),
        entry("attribution", Paragraph, "none", Some("quote"), "Attribution", false),
        // Verse, which serves poetry, drama and transcripts alike: the lines, the speaker, the stage direction.
        entry("line", Paragraph, "lines", None, "Line", true),
        on_words("speaker", "Speaker"),
        on_words("direction", "Stage Direction"),
        // A screenplay.
        entry("scene", Paragraph, "none", None, "Scene Heading", true),
        entry("action", Paragraph, "none", None, "Action", true),
        entry("character", Paragraph, "none", None, "Character", true),
        entry("dialogue", Paragraph, "none", None, "Dialogue", true),
        entry("parenthetical", Paragraph, "none", None, "Parenthetical", true),
        entry("transition", Paragraph, "none", None, "Transition", true),
        // A glossary.
        entry("headword", Paragraph, "glossary", None, "Headword", true),
        entry("gloss", Paragraph, "glossary", None, "Gloss", true),
        // Lists, which the program that writes the document sets.
        entry("item", Paragraph, "list", None, "", true),
        entry("numbered", Paragraph, "list", None, "", true),
        entry("code", Paragraph, "code", None, "Source Code", true),
        entry("break", Paragraph, "none", None, "Section Break", false),
        entry("draft", Paragraph, "none", None, "", false),
        // Kinds of words.
        entry("foreign", Words, "words", None, "Foreign", false),
        entry("title", Words, "words", None, "Title of a Work", false),
        entry("term", Words, "words", None, "Term", false),
        entry("mention", Words, "words", None, "Mention", false),
        entry("highlight", Words, "words", None, "", false),
    ]
};

pub fn catalogue() -> &'static [Entry] {
    CATALOGUE
}

/// The ids kinds had before ADR 0040, and what they are now.
pub fn renamed(id: &str) -> &str {
    match id {
        "verse" => "line",
        "list" => "item",
        other => other,
    }
}

pub fn entry_of(id: &str) -> Option<&'static Entry> {
    let id = renamed(id);
    CATALOGUE.iter().find(|e| e.id == id)
}

const NONE: Length = Length::pt(0.0);

/// The looks of the kinds of the catalogue before any layout says anything
/// of them: what every layout is resolved against (ADR 0040). A kind that
/// is not here, or that is here with nothing said, is as the kind it is
/// based on; text is as the layout's text, and a quotation as its `quote`.
fn base_looks() -> &'static HashMap<&'static str, Look> {
    static ALL: OnceLock<HashMap<&'static str, Look>> = OnceLock::new();
    ALL.get_or_init(|| {
        let flat = || Look { first_line: Some(NONE), ..Look::default() };
        // A line of verse stands in from the text; a speaker and a direction stand with the lines.
        let verse = || Look { indent_left: Some(Length::cm(1.0)), align: Some(Align::Left), ..flat() };
        HashMap::from([
            (
                "attribution",
                Look { align: Some(Align::Right), space_before: Some(NONE), italic: Some(false), ..flat() },
            ),
            (
                "epigraph",
                Look {
                    indent_left: Some(Length::cm(4.0)),
                    indent_right: Some(NONE),
                    space_after: Some(Length::pt(18.0)),
                    ..flat()
                },
            ),
            ("line", verse()),
            (
                "speaker",
                Look {
                    case: Some(Case::Smallcaps),
                    space_before: Some(Length::pt(8.0)),
                    space_after: Some(Length::pt(3.0)),
                    ..verse()
                },
            ),
            (
                "direction",
                Look {
                    italic: Some(true),
                    space_before: Some(Length::pt(3.0)),
                    space_after: Some(Length::pt(3.0)),
                    ..verse()
                },
            ),
            // A screenplay: the measures of the standard script page, from the margin of the text.
            (
                "scene",
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
            (
                "action",
                Look {
                    space_before: Some(Length::pt(11.0)),
                    space_after: Some(Length::pt(11.0)),
                    align: Some(Align::Left),
                    ..flat()
                },
            ),
            (
                "character",
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
            (
                "dialogue",
                Look {
                    indent_left: Some(Length::cm(2.5)),
                    indent_right: Some(Length::cm(3.8)),
                    space_before: Some(NONE),
                    space_after: Some(NONE),
                    align: Some(Align::Left),
                    ..flat()
                },
            ),
            (
                "parenthetical",
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
            (
                "transition",
                Look {
                    align: Some(Align::Right),
                    case: Some(Case::Upper),
                    space_before: Some(Length::pt(11.0)),
                    space_after: Some(Length::pt(11.0)),
                    ..flat()
                },
            ),
            (
                "headword",
                Look {
                    bold: Some(true),
                    space_before: Some(Length::pt(6.0)),
                    space_after: Some(NONE),
                    keep_with_next: Some(true),
                    ..flat()
                },
            ),
            (
                "gloss",
                Look {
                    indent_left: Some(Length::cm(1.27)),
                    space_before: Some(NONE),
                    space_after: Some(Length::pt(6.0)),
                    ..flat()
                },
            ),
            (
                "code",
                Look {
                    monospace: Some(true),
                    line_spacing: Some(1.0),
                    align: Some(Align::Left),
                    space_before: Some(Length::pt(6.0)),
                    space_after: Some(Length::pt(6.0)),
                    ..flat()
                },
            ),
            (
                "break",
                Look {
                    align: Some(Align::Center),
                    space_before: Some(Length::pt(12.0)),
                    space_after: Some(Length::pt(12.0)),
                    keep_with_next: Some(true),
                    text: Some("* * *".into()),
                    ..flat()
                },
            ),
            ("foreign", Look { italic: Some(true), ..Look::default() }),
            ("title", Look { italic: Some(true), ..Look::default() }),
            ("term", Look { italic: Some(true), ..Look::default() }),
        ])
    })
}

/// The look of a kind of the catalogue before any layout says anything of
/// it; nothing for a kind that is as the kind it is based on.
pub fn base_look(id: &str) -> Option<&'static Look> {
    base_looks().get(renamed(id))
}

/// What is known of a kind as far as the shape of a text goes: how the
/// document groups paragraphs of it, whether a numbering counts its lines,
/// whether it may also stand on words, and the kind of the catalogue it
/// rests on. Of a kind of the writer's own, through what it is based on, as
/// `factsOf` has it in `src/lib/project/model/families.ts`: one based on
/// text, or on nothing that is known, has text's facts, and so has one that
/// is not known at all.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Facts {
    pub group: &'static str,
    pub counted: bool,
    pub words: bool,
    /// The id of the kind of the catalogue the kind is, or rests on.
    pub base: &'static str,
}

impl Facts {
    fn of(e: &'static Entry) -> Facts {
        Facts { group: e.group, counted: e.counted, words: e.words, base: e.id }
    }
}

pub fn facts(id: &str, own: &[OwnKind]) -> Facts {
    let mut seen: Vec<&str> = Vec::new();
    let mut at = renamed(id);
    while seen.len() < 8 && !seen.contains(&at) {
        seen.push(at);
        if let Some(e) = entry_of(at) {
            return Facts::of(e);
        }
        let Some(kind) = own.iter().find(|k| k.id == at) else { break };
        let base = kind.based_on.trim();
        at = if base.is_empty() { "text" } else { renamed(base) };
    }
    Facts::of(entry_of("text").expect("text is of the catalogue"))
}

/// The look of a kind, with everything the layout and the kinds it is
/// based on say: the base of the chain (the layout's text, its quotation,
/// or plain words), then the base look of each kind along the chain and
/// the layout's row for it; of a kind that is not known, that of text or of
/// plain words.
pub fn resolve(f: &DocumentFormat, id: &str, own: &[OwnKind]) -> Resolved {
    fn go(f: &DocumentFormat, id: &str, own: &[OwnKind], depth: u8) -> Resolved {
        if depth > 8 {
            return Resolved::text(f);
        }
        let id = renamed(id);
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
            if let Some(look) = base_look(id) {
                r.apply(look);
            }
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

/// The look of a kind as the layout editor shows it: resolved against the
/// base looks, the chain of what it is based on and the layout's row, and
/// whether the layout's own row says anything of it, so that the writer
/// sees where every look comes from (ADR 0040).
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct KindLook {
    pub look: Resolved,
    /// Whether the layout's row for the kind says anything.
    pub said: bool,
}

/// The resolved look of every kind, by id: those of the catalogue, and the
/// writer's own.
pub fn looks(f: &DocumentFormat, own: &[OwnKind]) -> BTreeMap<String, KindLook> {
    let said = |id: &str| f.kinds.get(id).is_some_and(|l| !l.is_empty());
    let mut out = BTreeMap::new();
    for e in catalogue() {
        out.insert(e.id.to_owned(), KindLook { look: resolve(f, e.id, own), said: said(e.id) });
    }
    for k in own {
        if k.id.trim().is_empty() || out.contains_key(&k.id) {
            continue;
        }
        out.insert(k.id.clone(), KindLook { look: resolve(f, &k.id, own), said: said(&k.id) });
    }
    out
}

/// Of what family a kind is; nothing for one that is not known.
pub fn family_of(id: &str, own: &[OwnKind]) -> Option<Family> {
    entry_of(id).map(|e| e.family).or_else(|| own.iter().find(|k| k.id == id).map(|k| k.family))
}

/// What is known of a kind where a document is made: its family, how the
/// document groups its paragraphs, whether a numbering counts its lines,
/// whether it may stand on words, the kind of the catalogue it rests on,
/// the name of its style in Word and Writer, and its look.
#[derive(Debug, Clone, PartialEq)]
pub struct KindInfo {
    pub family: Family,
    /// How the document groups its paragraphs: `lines`, `quote`, `list`,
    /// `code`, `glossary`, `none`; `words` for a kind of words only.
    pub group: &'static str,
    pub counted: bool,
    /// Whether it may also stand on words, as a speaker and a direction may.
    pub words: bool,
    /// The id of the kind of the catalogue it is, or rests on.
    pub base: &'static str,
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
            KindInfo {
                family: e.family,
                group: e.group,
                counted: e.counted,
                words: e.words,
                base: e.id,
                style: e.style.to_owned(),
                look: resolve(f, e.id, own),
                own: false,
            },
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
        let facts = facts(&k.id, own);
        out.insert(
            k.id.clone(),
            KindInfo {
                family: k.family,
                group: if k.family == Family::Words { "words" } else { facts.group },
                counted: facts.counted,
                words: k.family == Family::Paragraph && facts.words,
                base: facts.base,
                style,
                look: resolve(f, &k.id, own),
                own: true,
            },
        );
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
    let brazil = rest.contains(&"br");
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
        // Text and quote are Pandoc's own; items and drafts and highlights have no style.
        assert_eq!(styled(&DocumentFormat::default(), &own).len(), catalogue().len() - 6 + 2);
    }

    #[test]
    fn the_facts_of_kinds_follow_the_chain_of_what_they_are_based_on() {
        let f = |id: &str, based_on: &str| OwnKind {
            id: id.into(),
            name: id.into(),
            family: Family::Paragraph,
            based_on: based_on.into(),
            look: Look::default(),
        };
        let own = vec![
            f("letter", "text"),
            f("chorus", "speaker"),
            f("verse2", "verse"),
            f("odd", "gone"),
            f("c1", "c2"),
            f("c2", "c1"),
        ];
        let of = |id: &str| facts(id, &own);
        assert_eq!(of("line").group, "lines");
        assert_eq!(of("quote").group, "quote");
        assert_eq!(of("gloss").group, "glossary");
        assert_eq!(of("attribution").group, "none");
        assert_eq!(of("title").group, "words");
        assert!(of("line").counted && !of("speaker").counted && of("text").counted && !of("attribution").counted);
        assert!(of("speaker").words && of("direction").words && !of("line").words && !of("title").words);
        // The old ids are read.
        assert_eq!(of("verse").base, "line");
        assert_eq!(of("list").base, "item");
        // A kind of the writer's own takes the facts of what it is based on.
        assert_eq!(of("chorus"), Facts { group: "none", counted: false, words: true, base: "speaker" });
        assert_eq!(of("verse2").base, "line");
        assert_eq!(of("verse2").group, "lines");
        // One based on text, or on nothing that is known, has text's; so has one not known at all.
        let text = Facts { group: "none", counted: true, words: false, base: "text" };
        for id in ["letter", "odd", "c1", "nothing"] {
            assert_eq!(of(id), text, "{id}");
        }
        let table = table(&DocumentFormat::default(), &own);
        assert_eq!(table["chorus"].group, "none");
        assert_eq!(table["chorus"].base, "speaker");
        assert!(table["chorus"].words && table["speaker"].words);
        assert!(table["item"].counted && table["item"].style.is_empty());
        // In the order of the facts the interface has.
        let ids: Vec<&str> = catalogue().iter().map(|e| e.id).collect();
        assert_eq!(
            ids,
            [
                "text",
                "quote",
                "epigraph",
                "attribution",
                "line",
                "speaker",
                "direction",
                "scene",
                "action",
                "character",
                "dialogue",
                "parenthetical",
                "transition",
                "headword",
                "gloss",
                "item",
                "numbered",
                "code",
                "break",
                "draft",
                "foreign",
                "title",
                "term",
                "mention",
                "highlight"
            ]
        );
    }

    #[test]
    fn the_looks_of_every_kind_say_whether_the_layout_speaks() {
        let mut f = DocumentFormat::default();
        f.kinds.insert("scene".into(), Look { bold: Some(false), ..Look::default() });
        f.kinds.insert("action".into(), Look::default());
        let own = vec![OwnKind {
            id: "k1".into(),
            name: "Letter".into(),
            family: Family::Paragraph,
            based_on: "text".into(),
            look: Look { italic: Some(true), ..Look::default() },
        }];
        let all = looks(&f, &own);
        assert_eq!(all.len(), catalogue().len() + 1);
        assert!(all["scene"].said);
        assert!(!all["scene"].look.bold);
        assert_eq!(all["scene"].look.case, Case::Upper);
        // A row that says nothing is as none.
        assert!(!all["action"].said);
        assert!(!all["k1"].said);
        assert!(all["k1"].look.italic);
        let json = serde_json::to_value(&all["direction"]).unwrap();
        assert_eq!(json["said"], false);
        assert_eq!(json["look"]["italic"], true);
        assert_eq!(json["look"]["indentLeft"], "1cm");
    }

    #[test]
    fn the_base_looks_are_the_kinds_before_any_layout() {
        let f = DocumentFormat::default();
        let line = resolve(&f, "line", &[]);
        assert_eq!(line.indent_left, Length::cm(1.0), "a line stands in from the text");
        assert_eq!(line.first_line, Length::pt(0.0));
        assert_eq!(resolve(&f, "speaker", &[]).case, Case::Smallcaps);
        assert!(resolve(&f, "direction", &[]).italic);
        assert_eq!(base_look("verse"), base_look("line"));
        assert!(base_look("item").is_none() && base_look("nothing").is_none());
        // A layout says otherwise of a line, and the lines follow it.
        let mut f = f;
        f.kinds.insert("line".into(), Look { indent_left: Some(Length::cm(3.0)), ..Default::default() });
        assert_eq!(resolve(&f, "line", &[]).indent_left, Length::cm(3.0));
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
