//! Document formats: how a manuscript is to look.
//!
//! A format is a set of parameters, kept as JSON. Those that come with the
//! application are in `resources/formats/`, each naming the published
//! requirements it follows and the day they were read. The user's own are in
//! the data directory. From a format are made a Typst preamble (for preview
//! and PDF), settings for LaTeX, and reference documents for DOCX and ODT.

pub mod length;
pub mod typst;

use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::error::{Error, IoContext, Result};
use crate::fsutil::write_atomic;

pub use length::Length;

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Kind {
    #[default]
    General,
    StyleGuide,
    Publisher,
    Journal,
    /// Made by the user.
    Own,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Source {
    /// Whose requirements these are, and in which document.
    pub name: String,
    pub url: String,
    /// The day the requirements were read: 2026-09-27.
    pub checked: String,
    /// high, medium or low: how sure the values are.
    pub confidence: String,
    /// What the source leaves open, and what was chosen for it here.
    pub notes: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Page {
    /// a4, letter, a5, b5, legal, or custom.
    pub size: String,
    /// For a custom size.
    pub width: Length,
    pub height: Length,
    pub margin_top: Length,
    pub margin_bottom: Length,
    pub margin_left: Length,
    pub margin_right: Length,
}

impl Default for Page {
    fn default() -> Self {
        Page {
            size: "a4".into(),
            width: Length::mm(210.0),
            height: Length::mm(297.0),
            margin_top: Length::cm(2.5),
            margin_bottom: Length::cm(2.5),
            margin_left: Length::cm(2.5),
            margin_right: Length::cm(2.5),
        }
    }
}

impl Page {
    /// Width and height in points.
    pub fn dimensions(&self) -> (f32, f32) {
        match self.size.to_ascii_lowercase().as_str() {
            "a4" => (595.28, 841.89),
            "a5" => (419.53, 595.28),
            "b5" => (498.9, 708.66),
            "letter" | "us-letter" => (612.0, 792.0),
            "legal" | "us-legal" => (612.0, 1008.0),
            _ => (self.width.points().max(72.0), self.height.points().max(72.0)),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Font {
    pub family: String,
    /// In points.
    pub size: f32,
}

impl Default for Font {
    fn default() -> Self {
        Font { family: "Times New Roman".into(), size: 12.0 }
    }
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Align {
    #[default]
    Left,
    Center,
    Right,
    Justified,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Paragraphs {
    /// The first line of each paragraph is indented; no space between paragraphs.
    #[default]
    Indent,
    /// Space between paragraphs; no indent.
    Spaced,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Text {
    /// 1 is single spacing, 2 is double.
    pub line_spacing: f32,
    pub align: Align,
    pub paragraphs: Paragraphs,
    pub indent: Length,
    /// Whether the first paragraph after a heading is indented too.
    pub indent_first: bool,
    /// For spaced paragraphs: the space between them, beyond that between lines.
    pub space_between: Length,
    pub hyphenate: bool,
}

impl Default for Text {
    fn default() -> Self {
        Text {
            line_spacing: 2.0,
            align: Align::Left,
            paragraphs: Paragraphs::Indent,
            indent: Length::cm(1.27),
            indent_first: true,
            space_between: Length::pt(12.0),
            hyphenate: false,
        }
    }
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Case {
    #[default]
    None,
    Upper,
    Smallcaps,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct HeadingLevel {
    /// In points.
    pub size: f32,
    pub bold: bool,
    pub italic: bool,
    pub align: Align,
    pub case: Case,
    /// The heading begins the paragraph that follows it, and ends with a full stop.
    pub run_in: bool,
    /// Indented as a paragraph is.
    pub indent: bool,
    pub space_before: Length,
    pub space_after: Length,
}

impl Default for HeadingLevel {
    fn default() -> Self {
        HeadingLevel {
            size: 12.0,
            bold: true,
            italic: false,
            align: Align::Left,
            case: Case::None,
            run_in: false,
            indent: false,
            space_before: Length::pt(24.0),
            space_after: Length::pt(12.0),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Headings {
    pub numbered: bool,
    /// From the highest level down. Headings deeper than the last are printed as the last.
    pub levels: Vec<HeadingLevel>,
}

impl Default for Headings {
    fn default() -> Self {
        Headings {
            numbered: false,
            levels: vec![
                HeadingLevel { size: 14.0, ..Default::default() },
                HeadingLevel { size: 12.0, ..Default::default() },
                HeadingLevel { size: 12.0, bold: false, italic: true, ..Default::default() },
            ],
        }
    }
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum TitlePlacement {
    /// At the top of the first page of text.
    #[default]
    Top,
    /// On a page of its own.
    OwnPage,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct TitleBlock {
    pub placement: TitlePlacement,
    pub size: f32,
    pub bold: bool,
    pub italic: bool,
    pub align: Align,
    pub case: Case,
    pub show_authors: bool,
    pub show_affiliations: bool,
    pub show_date: bool,
    pub show_abstract: bool,
    pub abstract_label: String,
    pub keywords_label: String,
    /// For review: the authors and their affiliations are left out.
    pub anonymous: bool,
}

impl Default for TitleBlock {
    fn default() -> Self {
        TitleBlock {
            placement: TitlePlacement::Top,
            size: 16.0,
            bold: true,
            italic: false,
            align: Align::Center,
            case: Case::None,
            show_authors: true,
            show_affiliations: true,
            show_date: false,
            show_abstract: true,
            abstract_label: "Abstract".into(),
            keywords_label: "Keywords".into(),
            anonymous: false,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Quote {
    pub indent_left: Length,
    pub indent_right: Length,
    /// In points; 0 for the size of the text.
    pub size: f32,
    /// 0 for the spacing of the text.
    pub line_spacing: f32,
    pub italic: bool,
    /// From how many words a quotation is set off as a block. Not applied:
    /// the writer decides; shown as a reminder.
    pub from_words: Option<u32>,
    /// The same, where the rule counts lines.
    pub from_lines: Option<u32>,
}

impl Default for Quote {
    fn default() -> Self {
        Quote {
            indent_left: Length::cm(1.27),
            indent_right: Length::pt(0.0),
            size: 0.0,
            line_spacing: 0.0,
            italic: false,
            from_words: None,
            from_lines: None,
        }
    }
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum NoteKind {
    #[default]
    Footnotes,
    Endnotes,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Notes {
    pub kind: NoteKind,
    pub size: f32,
    pub line_spacing: f32,
    /// The heading of the notes, when they are endnotes.
    pub title: String,
}

impl Default for Notes {
    fn default() -> Self {
        Notes { kind: NoteKind::Footnotes, size: 10.0, line_spacing: 1.0, title: "Notes".into() }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct BibliographyFormat {
    pub title: String,
    pub hanging_indent: Length,
    /// 0 for the spacing of the text.
    pub line_spacing: f32,
    /// Space between entries, beyond that between lines.
    pub entry_spacing: Length,
    pub new_page: bool,
    /// In points; 0 for the size of the text.
    pub size: f32,
}

impl Default for BibliographyFormat {
    fn default() -> Self {
        BibliographyFormat {
            title: "Bibliography".into(),
            hanging_indent: Length::cm(1.27),
            line_spacing: 0.0,
            entry_spacing: Length::pt(0.0),
            new_page: false,
            size: 0.0,
        }
    }
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Position {
    TopLeft,
    TopCenter,
    TopRight,
    BottomLeft,
    #[default]
    BottomCenter,
    BottomRight,
}

impl Position {
    pub fn is_top(self) -> bool {
        matches!(self, Position::TopLeft | Position::TopCenter | Position::TopRight)
    }

    pub fn align(self) -> Align {
        match self {
            Position::TopLeft | Position::BottomLeft => Align::Left,
            Position::TopCenter | Position::BottomCenter => Align::Center,
            Position::TopRight | Position::BottomRight => Align::Right,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct PageNumbers {
    pub show: bool,
    pub position: Position,
    /// Whether the first page bears its number.
    pub first_page: bool,
}

impl Default for PageNumbers {
    fn default() -> Self {
        PageNumbers { show: true, position: Position::BottomCenter, first_page: true }
    }
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum HeadContent {
    #[default]
    None,
    Title,
    Author,
    AuthorTitle,
    /// The words in `text`.
    Text,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct RunningHead {
    pub content: HeadContent,
    pub text: String,
    pub align: Align,
    pub case: Case,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Limits {
    pub words: Option<u32>,
    pub abstract_words: Option<u32>,
    pub keywords: Option<u32>,
    /// What the limit counts, and anything else to know: "notes included".
    pub note: String,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum CaptionPosition {
    Above,
    #[default]
    Below,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum FigurePlacement {
    /// Where they stand in the text.
    #[default]
    InText,
    /// Gathered at the end, with a line in the text that says where each
    /// belongs: what many journals ask of a manuscript.
    AtEnd,
}

/// How figures are set: the picture, and what is said of it.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Figures {
    /// What a figure is called: "Figure", "Fig.", "Abbildung".
    pub label: String,
    /// What stands between the number and the caption: ". ", ": ". A line
    /// break in it sets the caption on a line of its own.
    pub separator: String,
    pub label_bold: bool,
    pub label_italic: bool,
    pub caption_position: CaptionPosition,
    pub caption_align: Align,
    /// In points; 0 for the size of the text.
    pub caption_size: f32,
    pub caption_italic: bool,
    /// 0 for the spacing of the text.
    pub caption_line_spacing: f32,
    pub placement: FigurePlacement,
    /// The heading over the figures, when they are gathered at the end.
    pub end_title: String,
    /// What the line in the text says, with `{}` for the label and number:
    /// "[{} about here]".
    pub placeholder: String,
}

impl Default for Figures {
    fn default() -> Self {
        Figures {
            label: "Figure".into(),
            separator: ". ".into(),
            label_bold: false,
            label_italic: false,
            caption_position: CaptionPosition::Below,
            caption_align: Align::Center,
            caption_size: 0.0,
            caption_italic: false,
            caption_line_spacing: 1.0,
            placement: FigurePlacement::InText,
            end_title: "Figures".into(),
            placeholder: "[{} about here]".into(),
        }
    }
}

/// How equations that stand on a line of their own are numbered.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Equations {
    /// What stands around the number: "(1)" is "(" and ")".
    pub before_number: String,
    pub after_number: String,
}

impl Default for Equations {
    fn default() -> Self {
        Equations { before_number: "(".into(), after_number: ")".into() }
    }
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct DocumentFormat {
    pub id: String,
    pub name: String,
    pub kind: Kind,
    pub description: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<Source>,
    /// The format this one was made from, when it is the user's own.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub based_on: Option<String>,
    pub page: Page,
    pub font: Font,
    pub text: Text,
    pub headings: Headings,
    pub title: TitleBlock,
    pub quote: Quote,
    pub notes: Notes,
    pub bibliography: BibliographyFormat,
    pub figures: Figures,
    pub equations: Equations,
    pub page_numbers: PageNumbers,
    pub running_head: RunningHead,
    pub line_numbers: bool,
    /// The reference style that goes with the format, by id.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style: Option<String>,
    pub limits: Limits,
}

impl DocumentFormat {
    /// The description of a level of heading; the last one serves for deeper levels.
    pub fn heading(&self, level: usize) -> HeadingLevel {
        let levels = &self.headings.levels;
        if levels.is_empty() {
            return HeadingLevel::default();
        }
        levels[level.clamp(1, levels.len()) - 1].clone()
    }

    /// Puts values that make no sense back within bounds, so that a format
    /// made by hand cannot break the making of a document.
    pub fn sanitise(&mut self) {
        let clamp = |v: &mut f32, lo: f32, hi: f32, or: f32| {
            if !v.is_finite() || *v < lo || *v > hi {
                *v = or;
            }
        };
        clamp(&mut self.font.size, 6.0, 36.0, 12.0);
        clamp(&mut self.text.line_spacing, 0.8, 4.0, 1.5);
        clamp(&mut self.title.size, 6.0, 72.0, 16.0);
        clamp(&mut self.notes.size, 5.0, 36.0, 10.0);
        clamp(&mut self.notes.line_spacing, 0.8, 4.0, 1.0);
        clamp(&mut self.quote.size, 0.0, 36.0, 0.0);
        clamp(&mut self.quote.line_spacing, 0.0, 4.0, 0.0);
        clamp(&mut self.bibliography.size, 0.0, 36.0, 0.0);
        clamp(&mut self.bibliography.line_spacing, 0.0, 4.0, 0.0);
        clamp(&mut self.figures.caption_size, 0.0, 36.0, 0.0);
        clamp(&mut self.figures.caption_line_spacing, 0.0, 4.0, 1.0);
        if !self.figures.placeholder.contains("{}") {
            self.figures.placeholder = Figures::default().placeholder;
        }
        for l in &mut self.headings.levels {
            clamp(&mut l.size, 6.0, 72.0, 12.0);
        }
        self.headings.levels.truncate(6);
        if self.headings.levels.is_empty() {
            self.headings = Headings::default();
        }
        if self.font.family.trim().is_empty() {
            self.font.family = "Times New Roman".into();
        }
        let (w, h) = self.page.dimensions();
        for m in [&mut self.page.margin_left, &mut self.page.margin_right] {
            if m.points() < 0.0 || m.points() > w / 2.0 - 36.0 {
                *m = Length::cm(2.5);
            }
        }
        for m in [&mut self.page.margin_top, &mut self.page.margin_bottom] {
            if m.points() < 0.0 || m.points() > h / 2.0 - 36.0 {
                *m = Length::cm(2.5);
            }
        }
    }

    /// Levels of heading that run into the text.
    pub fn run_in_levels(&self) -> Vec<u8> {
        self.headings.levels.iter().enumerate().filter(|(_, l)| l.run_in).map(|(i, _)| i as u8 + 1).collect()
    }
}

/// Fonts that may stand in for one that is asked for and not installed. The
/// first that is installed is used.
pub fn fallbacks(family: &str) -> Vec<&'static str> {
    let serif = ["Libertinus Serif", "DejaVu Serif", "Noto Serif"];
    let sans = ["DejaVu Sans", "Noto Sans"];
    let mut out: Vec<&'static str> = match family.trim().to_ascii_lowercase().as_str() {
        "times new roman" | "times" => {
            vec!["Liberation Serif", "TeX Gyre Termes", "Tinos", "Nimbus Roman", "FreeSerif"]
        }
        "arial" | "helvetica" => vec!["Liberation Sans", "Arimo", "TeX Gyre Heros", "Nimbus Sans"],
        "calibri" | "aptos" => vec!["Carlito", "Liberation Sans"],
        "brill" => vec!["Gentium Plus", "Liberation Serif", "TeX Gyre Termes"],
        "cambria" => vec!["Caladea", "Liberation Serif"],
        "georgia" => vec!["Gelasio", "DejaVu Serif"],
        "garamond" | "adobe garamond pro" => vec!["EB Garamond", "Cormorant Garamond", "Libertinus Serif"],
        "palatino" | "palatino linotype" | "book antiqua" => vec!["TeX Gyre Pagella", "Palladio", "P052"],
        "courier new" | "courier" => vec!["Liberation Mono", "Cousine", "TeX Gyre Cursor", "DejaVu Sans Mono"],
        "new athena unicode" => vec!["Gentium Plus", "GFS Didot", "Libertinus Serif"],
        "computer modern" | "latin modern" | "latin modern roman" => vec!["New Computer Modern", "Latin Modern Roman"],
        _ => vec![],
    };
    let is_sans = matches!(
        family.trim().to_ascii_lowercase().as_str(),
        "arial" | "helvetica" | "calibri" | "aptos" | "verdana" | "tahoma" | "lucida sans unicode"
    );
    out.extend(if is_sans { sans.iter() } else { serif.iter() });
    out
}

// ---- where formats are kept ----

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FormatSummary {
    pub id: String,
    pub name: String,
    pub kind: Kind,
    pub description: String,
    pub own: bool,
    pub confidence: String,
    pub checked: String,
}

pub struct Formats {
    bundled: PathBuf,
    own: PathBuf,
}

fn check_id(id: &str) -> Result<()> {
    let ok = !id.is_empty()
        && id.len() <= 80
        && id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
        && !id.starts_with('-');
    if ok { Ok(()) } else { Err(Error::invalid(format!("“{id}” cannot be the id of a format"))) }
}

impl Formats {
    pub fn new(resources: &Path, own: &Path) -> Self {
        Formats { bundled: resources.join("formats"), own: own.to_owned() }
    }

    fn read(path: &Path) -> Result<DocumentFormat> {
        let text = fs::read_to_string(path).context(|| format!("reading {}", path.display()))?;
        let mut format: DocumentFormat =
            serde_json::from_str(&text).map_err(|e| Error::Parse { path: path.to_owned(), message: e.to_string() })?;
        if format.id.is_empty() {
            format.id = path.file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_default();
        }
        format.sanitise();
        Ok(format)
    }

    fn read_dir(dir: &Path, own: bool, out: &mut Vec<(DocumentFormat, bool)>) {
        let Ok(entries) = fs::read_dir(dir) else { return };
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().is_some_and(|e| e == "json") {
                match Self::read(&path) {
                    Ok(mut f) => {
                        if own {
                            f.kind = Kind::Own;
                        }
                        out.push((f, own));
                    }
                    Err(e) => tracing::warn!(%e, "a format could not be read"),
                }
            }
        }
    }

    pub fn all(&self) -> Vec<(DocumentFormat, bool)> {
        let mut out = Vec::new();
        Self::read_dir(&self.bundled, false, &mut out);
        Self::read_dir(&self.own, true, &mut out);
        let rank = |k: Kind| match k {
            Kind::Own => 0,
            Kind::General => 1,
            Kind::StyleGuide => 2,
            Kind::Publisher => 3,
            Kind::Journal => 4,
        };
        out.sort_by(|a, b| {
            rank(a.0.kind).cmp(&rank(b.0.kind)).then(a.0.name.to_lowercase().cmp(&b.0.name.to_lowercase()))
        });
        out
    }

    pub fn list(&self) -> Vec<FormatSummary> {
        self.all()
            .into_iter()
            .map(|(f, own)| FormatSummary {
                id: f.id,
                name: f.name,
                kind: f.kind,
                description: f.description,
                own,
                confidence: f.source.as_ref().map(|s| s.confidence.clone()).unwrap_or_default(),
                checked: f.source.as_ref().map(|s| s.checked.clone()).unwrap_or_default(),
            })
            .collect()
    }

    /// The format with an id. The user's own is preferred to one that comes
    /// with the application under the same id.
    pub fn get(&self, id: &str) -> Result<DocumentFormat> {
        check_id(id)?;
        let own = self.own.join(format!("{id}.json"));
        if own.is_file() {
            let mut f = Self::read(&own)?;
            f.kind = Kind::Own;
            return Ok(f);
        }
        let bundled = self.bundled.join(format!("{id}.json"));
        if bundled.is_file() {
            return Self::read(&bundled);
        }
        Err(Error::not_found(format!("the format “{id}”")))
    }

    /// The format with an id, or the general one when it is not there.
    pub fn get_or_default(&self, id: &str) -> DocumentFormat {
        self.get(id).or_else(|_| self.get("manuscript")).unwrap_or_else(|_| {
            let mut f = DocumentFormat { id: "manuscript".into(), name: "Manuscript".into(), ..Default::default() };
            f.sanitise();
            f
        })
    }

    /// Saves a format as the user's own. Returns it as saved.
    pub fn save(&self, mut format: DocumentFormat) -> Result<DocumentFormat> {
        format.name = format.name.split_whitespace().collect::<Vec<_>>().join(" ");
        if format.name.is_empty() {
            return Err(Error::invalid("A format needs a name."));
        }
        if format.id.is_empty() || self.bundled.join(format!("{}.json", format.id)).is_file() {
            // A new one, or one made from a format that comes with the application.
            let base = slug(&format.name);
            let mut id = base.clone();
            let mut n = 2;
            while self.own.join(format!("{id}.json")).exists() || self.bundled.join(format!("{id}.json")).exists() {
                id = format!("{base}-{n}");
                n += 1;
            }
            if format.based_on.is_none() && !format.id.is_empty() {
                format.based_on = Some(format.id.clone());
            }
            format.id = id;
        }
        check_id(&format.id)?;
        format.kind = Kind::Own;
        format.sanitise();
        write_atomic(&self.own.join(format!("{}.json", format.id)), serde_json::to_string_pretty(&format)?.as_bytes())?;
        Ok(format)
    }

    pub fn delete(&self, id: &str) -> Result<()> {
        check_id(id)?;
        let path = self.own.join(format!("{id}.json"));
        if !path.is_file() {
            return Err(Error::invalid("Only your own formats can be deleted."));
        }
        fs::remove_file(&path).context(|| format!("removing {}", path.display()))
    }
}

pub fn slug(name: &str) -> String {
    let mut out = String::new();
    for c in crate::bib::latex::fold(name).chars() {
        if c.is_ascii_alphanumeric() {
            out.push(c);
        } else if !out.ends_with('-') && !out.is_empty() {
            out.push('-');
        }
    }
    let out = out.trim_matches('-').to_owned();
    if out.is_empty() { "format".into() } else { out.chars().take(60).collect() }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_format_with_nothing_said_is_whole() {
        let f: DocumentFormat = serde_json::from_str(r#"{"id":"x","name":"X"}"#).unwrap();
        assert_eq!(f.font.size, 12.0);
        assert_eq!(f.page.size, "a4");
        assert_eq!(f.headings.levels.len(), 3);
        assert_eq!(f.heading(9), f.heading(3));
        assert_eq!(f.heading(0), f.heading(1));
        let text = serde_json::to_string(&f).unwrap();
        let again: DocumentFormat = serde_json::from_str(&text).unwrap();
        assert_eq!(f, again);
    }

    #[test]
    fn nonsense_is_put_right() {
        let mut f: DocumentFormat = serde_json::from_str(
            r#"{"font":{"family":" ","size":400},"text":{"lineSpacing":-1},
                "page":{"size":"a4","marginLeft":"40cm","marginTop":"1in"},
                "headings":{"levels":[]}}"#,
        )
        .unwrap();
        f.sanitise();
        assert_eq!(f.font.size, 12.0);
        assert_eq!(f.font.family, "Times New Roman");
        assert_eq!(f.text.line_spacing, 1.5);
        assert_eq!(f.page.margin_left, Length::cm(2.5));
        assert_eq!(f.page.margin_top.points(), 72.0);
        assert!(!f.headings.levels.is_empty());
    }

    #[test]
    fn own_formats() {
        let tmp = tempfile::tempdir().unwrap();
        let resources = tmp.path().join("resources");
        fs::create_dir_all(resources.join("formats")).unwrap();
        fs::write(
            resources.join("formats/manuscript.json"),
            r#"{"id":"manuscript","name":"Manuscript","kind":"general"}"#,
        )
        .unwrap();
        fs::write(resources.join("formats/broken.json"), "{").unwrap();
        let formats = Formats::new(&resources, &tmp.path().join("own"));
        assert_eq!(formats.list().len(), 1);

        // Changing one that comes with the application makes a new one of the user's own.
        let mut f = formats.get("manuscript").unwrap();
        f.name = "My Publisher’s Wishes".into();
        f.font.size = 11.0;
        let saved = formats.save(f).unwrap();
        assert_eq!(saved.id, "my-publisher-s-wishes");
        assert_eq!(saved.based_on.as_deref(), Some("manuscript"));
        assert_eq!(saved.kind, Kind::Own);
        assert_eq!(formats.get("manuscript").unwrap().font.size, 12.0);

        // Saving it again changes it in place.
        let mut again = saved.clone();
        again.font.size = 10.0;
        assert_eq!(formats.save(again).unwrap().id, saved.id);
        assert_eq!(formats.get(&saved.id).unwrap().font.size, 10.0);
        assert_eq!(formats.list().len(), 2);
        assert_eq!(formats.list()[0].id, saved.id, "the user's own come first");

        assert!(formats.delete("manuscript").is_err());
        formats.delete(&saved.id).unwrap();
        assert!(formats.get("../x").is_err());
        assert_eq!(formats.get_or_default("gone").id, "manuscript");
    }
}

#[cfg(test)]
mod bundled {
    use super::*;

    /// Every format that comes with the application must be readable, name its
    /// source if it claims to follow one, and ask for a reference style that exists.
    #[test]
    fn the_formats_that_come_with_the_application() {
        let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../resources");
        let dir = root.join("formats");
        let mut seen = std::collections::HashSet::new();
        let mut count = 0;
        for entry in fs::read_dir(&dir).unwrap().flatten() {
            let path = entry.path();
            if path.extension().is_none_or(|e| e != "json") {
                continue;
            }
            count += 1;
            let text = fs::read_to_string(&path).unwrap();
            let raw: serde_json::Value =
                serde_json::from_str(&text).unwrap_or_else(|e| panic!("{}: {e}", path.display()));
            let format: DocumentFormat =
                serde_json::from_str(&text).unwrap_or_else(|e| panic!("{}: {e}", path.display()));
            let name = path.file_stem().unwrap().to_string_lossy().into_owned();
            assert_eq!(format.id, name, "{}: the id must be the name of the file", path.display());
            assert!(seen.insert(format.id.clone()));
            assert!(!format.name.trim().is_empty(), "{name}: no name");
            assert!(!format.description.trim().is_empty(), "{name}: no description");
            assert_ne!(format.kind, Kind::Own, "{name}");

            // Nothing in it is changed by being put within bounds.
            let mut clean = format.clone();
            clean.sanitise();
            assert_eq!(clean, format, "{name}: holds values out of bounds");

            // No key is misspelt: what is written is what is read.
            let back = serde_json::to_value(&format).unwrap();
            fn keys(a: &serde_json::Value, b: &serde_json::Value, at: &str, name: &str) {
                if let (Some(x), Some(y)) = (a.as_object(), b.as_object()) {
                    for (k, v) in x {
                        let here = format!("{at}.{k}");
                        assert!(y.contains_key(k), "{name}: “{here}” is not a parameter of a format");
                        keys(v, &y[k], &here, name);
                    }
                } else if let (Some(x), Some(y)) = (a.as_array(), b.as_array()) {
                    for (i, v) in x.iter().enumerate() {
                        if let Some(w) = y.get(i) {
                            keys(v, w, &format!("{at}[{i}]"), name);
                        }
                    }
                }
            }
            keys(&raw, &back, "", &name);

            if format.kind != Kind::General {
                let source = format.source.as_ref().unwrap_or_else(|| panic!("{name}: names no source"));
                assert!(!source.name.trim().is_empty(), "{name}: the source has no name");
                assert!(
                    source.url.starts_with("https://") || source.url.starts_with("http://"),
                    "{name}: the source has no address"
                );
                assert!(source.checked.len() == 10, "{name}: no date on which the source was read");
                assert!(matches!(source.confidence.as_str(), "high" | "medium" | "low"), "{name}: confidence");
            }
            if let Some(style) = &format.style {
                let index = fs::read_to_string(root.join("csl/index.json")).unwrap();
                assert!(index.contains(&format!("\"i\":\"{style}\"")), "{name}: there is no reference style “{style}”");
            }
        }
        assert!(count >= 2);
    }
}
