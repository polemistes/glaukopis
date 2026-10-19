//! Document formats: how a manuscript is to look.
//!
//! A format is a set of parameters, kept as JSON. Those that come with the
//! application are in `resources/formats/`, each naming the published
//! requirements it follows and the day they were read. The user's own are in
//! the data directory. From a format are made a Typst preamble (for preview
//! and PDF), settings for LaTeX, and reference documents for DOCX and ODT.

pub mod kinds;
pub mod length;
pub mod typst;

use std::collections::BTreeMap;
use std::fs;
use std::path::Path;

use serde::{Deserialize, Serialize};

use crate::document::Side;
use crate::error::{Error, IoContext, Result};
use crate::shelf::{self, Shelf, Shelved};
use crate::tr;

pub use length::Length;

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Kind {
    #[default]
    General,
    StyleGuide,
    Publisher,
    Journal,
    /// Novels and stories.
    Fiction,
    /// Plays and screenplays.
    Stage,
    Poetry,
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
    /// How many columns the text is set in: 1 for none, at most 4.
    pub columns: u8,
    /// The room between two columns.
    pub column_gap: Length,
    /// How the pages are numbered (ADR 0057).
    pub numbering: NumberStyle,
    /// The pages begin to be counted anew where the element this is set on
    /// begins (ADR 0059).
    pub restart: bool,
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
            columns: 1,
            column_gap: Length::cm(1.0),
            numbering: NumberStyle::Arabic,
            restart: false,
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

/// How italics are set: as italics, or underlined, as the manuscripts of
/// the typewriter were and some publishers of fiction still ask.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Italics {
    #[default]
    Italic,
    Underline,
}

/// How reference marks are set (ADR 0039): small and raised in the line,
/// or in the margin beside their line. Word and Writer have no room in the
/// margin, and raise them.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum RefMarks {
    #[default]
    Raised,
    Margin,
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
    /// How italics are set.
    pub italics: Italics,
    /// How reference marks are set: verses, pages of Stephanus, numbers of Bekker.
    pub refmarks: RefMarks,
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
            italics: Italics::Italic,
            refmarks: RefMarks::Raised,
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
    /// Where the heading begins: in the text, on a new page (a chapter of a
    /// book), or on a right-hand page (ADR 0057).
    pub begins: Begins,
    /// How the level is numbered (ADR 0058).
    pub numbering: LevelNumbering,
    pub space_before: Length,
    pub space_after: Length,
    /// The switch the level had before it had `begins`, read from layouts
    /// written then; never written.
    #[serde(default, skip_serializing)]
    pub new_page: Option<bool>,
}

impl HeadingLevel {
    /// Whether the heading begins a page, new or right-hand.
    pub fn begins_page(&self) -> bool {
        self.begins != Begins::Text
    }
}

/// Where a heading begins (ADR 0057).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Begins {
    #[default]
    Text,
    Page,
    /// On a right-hand (odd) page, with a blank left page put in where one is needed.
    RightPage,
}

/// How a level of heading is numbered (ADR 0058).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum LevelNumbering {
    /// As the level above: numbered where it is, in its style, under its number.
    #[default]
    AsAbove,
    None,
    Arabic,
    Alpha,
    AlphaLower,
    Roman,
    RomanLower,
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
            begins: Begins::Text,
            numbering: LevelNumbering::AsAbove,
            space_before: Length::pt(24.0),
            space_after: Length::pt(12.0),
            new_page: None,
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

impl Headings {
    /// The numbering of each level as it comes to be (ADR 0058): its style,
    /// None where it is not numbered. Nothing is numbered where the headings
    /// are not; the first level as above is arabic; a level as above takes
    /// the numbering of the level above it.
    pub fn resolved_numbering(&self) -> Vec<Option<NumberStyle>> {
        let mut out: Vec<Option<NumberStyle>> = Vec::with_capacity(self.levels.len());
        for level in &self.levels {
            let style = if !self.numbered {
                None
            } else {
                match level.numbering {
                    LevelNumbering::AsAbove => out.last().copied().unwrap_or(Some(NumberStyle::Arabic)),
                    LevelNumbering::None => None,
                    LevelNumbering::Arabic => Some(NumberStyle::Arabic),
                    LevelNumbering::Alpha => Some(NumberStyle::Letters),
                    LevelNumbering::AlphaLower => Some(NumberStyle::LettersLower),
                    LevelNumbering::Roman => Some(NumberStyle::Roman),
                    LevelNumbering::RomanLower => Some(NumberStyle::RomanLower),
                }
            };
            out.push(style);
        }
        out
    }

    /// Whether the headings are numbered 1, 1.1, 1.1.1 and no otherwise, as
    /// Pandoc and LaTeX number them of themselves.
    pub fn plain_numbering(&self) -> bool {
        self.numbered && self.resolved_numbering().iter().all(|s| *s == Some(NumberStyle::Arabic))
    }
}

/// The number of a heading from how many headings of each level have been
/// counted down to it (ADR 0058): the numbers of the numbered levels above
/// it and its own, in their styles, with full stops between; None where its
/// own level is not numbered. Levels deeper than the numbering says are
/// numbered as its last.
pub fn heading_number(counts: &[u32], numbering: &[Option<NumberStyle>]) -> Option<String> {
    let style = |i: usize| numbering.get(i.min(numbering.len().saturating_sub(1))).copied().flatten();
    let own = counts.len().checked_sub(1)?;
    style(own)?;
    let parts: Vec<String> =
        counts.iter().enumerate().filter_map(|(i, n)| style(i).map(|s| styled_number(*n, s))).collect();
    Some(parts.join("."))
}

/// A number in a style: 4 as 4, IV, iv, D or d.
pub fn styled_number(n: u32, style: NumberStyle) -> String {
    fn roman(mut n: u32) -> String {
        const NUMERALS: [(u32, &str); 13] = [
            (1000, "M"),
            (900, "CM"),
            (500, "D"),
            (400, "CD"),
            (100, "C"),
            (90, "XC"),
            (50, "L"),
            (40, "XL"),
            (10, "X"),
            (9, "IX"),
            (5, "V"),
            (4, "IV"),
            (1, "I"),
        ];
        let mut out = String::new();
        for (value, numeral) in NUMERALS {
            while n >= value {
                out.push_str(numeral);
                n -= value;
            }
        }
        out
    }
    // A, …, Z, AA, AB, … as Typst letters them.
    fn letters(mut n: u32) -> String {
        let mut out = Vec::new();
        while n > 0 {
            n -= 1;
            out.push(char::from(b'A' + (n % 26) as u8));
            n /= 26;
        }
        out.iter().rev().collect()
    }
    match style {
        NumberStyle::Arabic => n.to_string(),
        NumberStyle::Roman if n > 0 => roman(n),
        NumberStyle::RomanLower if n > 0 => roman(n).to_lowercase(),
        NumberStyle::Letters if n > 0 => letters(n),
        NumberStyle::LettersLower if n > 0 => letters(n).to_lowercase(),
        _ => n.to_string(),
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

/// How the numbers of a numbered passage are shown, where the passage does
/// not say (ADR 0040): every how many, and on which side of the text.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Verse {
    /// Every how many: 5 shows 5, 10, 15.
    pub every: u32,
    pub side: Side,
}

impl Default for Verse {
    fn default() -> Self {
        Verse { every: 5, side: Side::Left }
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

/// What stands in a place of the header or the footer (ADR 0057).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case", tag = "kind")]
pub enum Item {
    PageNumber,
    Title,
    Author,
    /// The heading of the chapter the page is in: the nearest heading of the first level before it.
    Chapter,
    Date,
    Text {
        #[serde(default)]
        text: String,
    },
}

/// The three places of a margin, each a list of items in order.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Sides {
    pub left: Vec<Item>,
    pub center: Vec<Item>,
    pub right: Vec<Item>,
}

impl Sides {
    pub fn is_empty(&self) -> bool {
        self.left.is_empty() && self.center.is_empty() && self.right.is_empty()
    }

    /// Every item, wherever it stands.
    pub fn items(&self) -> impl Iterator<Item = &Item> {
        self.left.iter().chain(&self.center).chain(&self.right)
    }
}

/// The header or the footer of the pages (ADR 0057): shown or not, on the
/// first page and on the openers or not, three places of items, and three
/// more for left pages where they differ.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Margin {
    pub shown: bool,
    /// On the first page of the document too.
    pub first_page: bool,
    /// On the openers too: the pages where a heading that begins a page, or
    /// a part on a page of its own, begins.
    pub openers: bool,
    /// Different on left (even) pages: `even` holds their places.
    pub alternate: bool,
    #[serde(flatten)]
    pub places: Sides,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub even: Option<Sides>,
    /// What stands between two items of a place.
    pub separator: String,
    /// In points; nought is the text's.
    pub size: f32,
    pub italic: bool,
    pub case: Case,
}

impl Default for Margin {
    fn default() -> Self {
        Margin {
            shown: false,
            first_page: true,
            openers: true,
            alternate: false,
            places: Sides::default(),
            even: None,
            separator: " · ".into(),
            size: 0.0,
            italic: false,
            case: Case::None,
        }
    }
}

impl Margin {
    /// The footer as a layout has it where it says nothing: the number of the page in the middle.
    pub fn footer() -> Self {
        Margin {
            shown: true,
            places: Sides { center: vec![Item::PageNumber], ..Default::default() },
            ..Default::default()
        }
    }

    /// Whether anything stands in it on some page.
    pub fn is_visible(&self) -> bool {
        self.shown && (!self.places.is_empty() || (self.alternate && self.even.as_ref().is_some_and(|e| !e.is_empty())))
    }

    /// The places of left pages: their own where they differ, else the same.
    pub fn even_places(&self) -> &Sides {
        match &self.even {
            Some(even) if self.alternate => even,
            _ => &self.places,
        }
    }

    /// Whether the number of the page stands in it.
    pub fn has_number(&self) -> bool {
        self.places.items().chain(self.even_places().items()).any(|i| *i == Item::PageNumber)
    }
}

/// How the pages are numbered (ADR 0057).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum NumberStyle {
    #[default]
    Arabic,
    Roman,
    RomanLower,
    Letters,
    LettersLower,
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

/// The page numbers as a layout had them before the footer (ADR 0057): read, never written.
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

/// The running head as a layout had it before the header (ADR 0057): read, never written.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct RunningHead {
    pub content: HeadContent,
    pub text: String,
    pub align: Align,
    pub case: Case,
}

/// Where something that stands by itself stands: a figure, a table, an equation.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Stand {
    Left,
    #[default]
    Center,
    Right,
}

/// The lines of a table.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Rules {
    /// Over the table, under it, and under its headings: as books have them.
    #[default]
    Horizontal,
    /// Around every cell.
    Grid,
    None,
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
    /// What it is called where the text points to it, when that is not the
    /// same: "fig." in the text, "Figure" under the picture. Empty for the same.
    pub reference: String,
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
    /// Where figures stand, unless something else is said of one.
    pub align: Stand,
    /// Whether the text flows around figures that stand to the left or the
    /// right, unless something else is said of one.
    pub wrap: bool,
}

/// How tables are set. What is said of a table is set as what is said of a
/// figure is, by settings of the same names.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Tables {
    /// What a table is called: "Table", "Tab.", "Tabelle".
    pub label: String,
    pub reference: String,
    pub separator: String,
    pub label_bold: bool,
    pub label_italic: bool,
    pub caption_position: CaptionPosition,
    pub caption_align: Align,
    pub caption_size: f32,
    pub caption_italic: bool,
    pub caption_line_spacing: f32,
    pub placement: FigurePlacement,
    pub end_title: String,
    pub placeholder: String,
    pub align: Stand,
    pub wrap: bool,
    /// The size of what stands in the table, in points; 0 for the size of the text.
    pub size: f32,
    /// 0 for the spacing of the text.
    pub line_spacing: f32,
    pub rules: Rules,
    /// Whether the headings of columns and rows are set in bold.
    pub header_bold: bool,
}

impl Default for Tables {
    fn default() -> Self {
        Tables {
            label: "Table".into(),
            reference: String::new(),
            separator: ". ".into(),
            label_bold: false,
            label_italic: false,
            // What is said of a table stands over it, by old custom.
            caption_position: CaptionPosition::Above,
            caption_align: Align::Center,
            caption_size: 0.0,
            caption_italic: false,
            caption_line_spacing: 1.0,
            placement: FigurePlacement::InText,
            end_title: "Tables".into(),
            placeholder: "[{} about here]".into(),
            align: Stand::Center,
            wrap: false,
            size: 0.0,
            line_spacing: 1.0,
            rules: Rules::Horizontal,
            header_bold: false,
        }
    }
}

/// How what is said of a figure or a table is set, and where they stand:
/// what the settings for the two have in common.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct Captioned {
    pub label: String,
    pub reference: String,
    pub separator: String,
    pub label_bold: bool,
    pub label_italic: bool,
    pub caption_position: CaptionPosition,
    pub caption_align: Align,
    pub caption_size: f32,
    pub caption_italic: bool,
    pub caption_line_spacing: f32,
    pub placement: FigurePlacement,
    pub end_title: String,
    pub placeholder: String,
    pub align: Stand,
    pub wrap: bool,
}

macro_rules! captioned {
    ($from:expr) => {
        Captioned {
            label: $from.label.clone(),
            reference: $from.reference.clone(),
            separator: $from.separator.clone(),
            label_bold: $from.label_bold,
            label_italic: $from.label_italic,
            caption_position: $from.caption_position,
            caption_align: $from.caption_align,
            caption_size: $from.caption_size,
            caption_italic: $from.caption_italic,
            caption_line_spacing: $from.caption_line_spacing,
            placement: $from.placement,
            end_title: $from.end_title.clone(),
            placeholder: $from.placeholder.clone(),
            align: $from.align,
            wrap: $from.wrap,
        }
    };
}

impl Figures {
    pub fn captioned(&self) -> Captioned {
        captioned!(self)
    }
}

impl Tables {
    pub fn captioned(&self) -> Captioned {
        captioned!(self)
    }
}

impl Default for Figures {
    fn default() -> Self {
        Figures {
            label: "Figure".into(),
            reference: String::new(),
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
            align: Stand::Center,
            wrap: false,
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
    /// Where equations stand, unless something else is said of one.
    pub align: Stand,
}

impl Default for Equations {
    fn default() -> Self {
        Equations { before_number: "(".into(), after_number: ")".into(), align: Stand::Center }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
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
    /// How the numbers of a numbered passage are shown, where the passage does not say.
    pub verse: Verse,
    pub notes: Notes,
    pub bibliography: BibliographyFormat,
    pub figures: Figures,
    pub tables: Tables,
    pub equations: Equations,
    /// What stands at the top of the pages (ADR 0057).
    pub header: Margin,
    /// What stands at the foot of the pages: the page number in the middle, unless the layout says otherwise.
    pub footer: Margin,
    pub line_numbers: bool,
    /// The reference style that goes with the format, by id.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style: Option<String>,
    /// How the kinds of paragraph and of words are set, where the format
    /// says otherwise than the kind has it of itself: by the id of the kind.
    /// See `kinds.rs`.
    #[serde(skip_serializing_if = "BTreeMap::is_empty")]
    pub kinds: BTreeMap<String, kinds::Look>,
    /// How the kinds of elements that make a document are set, where the
    /// layout says otherwise than the kind has it of itself: by the id of
    /// the kind. See `templates/kinds.rs` and ADR 0038.
    #[serde(skip_serializing_if = "BTreeMap::is_empty")]
    pub parts: BTreeMap<String, crate::templates::PartLook>,
    /// The page numbers as layouts had them before the footer: read from
    /// such a layout and turned into the header and the footer by
    /// `modernise`; never written.
    #[serde(default, skip_serializing)]
    pub page_numbers: Option<PageNumbers>,
    /// The running head as layouts had it before the header: likewise.
    #[serde(default, skip_serializing)]
    pub running_head: Option<RunningHead>,
}

impl Default for DocumentFormat {
    fn default() -> Self {
        DocumentFormat {
            id: String::new(),
            name: String::new(),
            kind: Kind::default(),
            description: String::new(),
            source: None,
            based_on: None,
            page: Page::default(),
            font: Font::default(),
            text: Text::default(),
            headings: Headings::default(),
            title: TitleBlock::default(),
            quote: Quote::default(),
            verse: Verse::default(),
            notes: Notes::default(),
            bibliography: BibliographyFormat::default(),
            figures: Figures::default(),
            tables: Tables::default(),
            equations: Equations::default(),
            header: Margin::default(),
            footer: Margin::footer(),
            line_numbers: false,
            style: None,
            kinds: BTreeMap::new(),
            parts: BTreeMap::new(),
            page_numbers: None,
            running_head: None,
        }
    }
}

impl DocumentFormat {
    /// Turns what a layout written before the header and the footer said of
    /// its page numbers and running head into its header and footer (ADR
    /// 0057), and the old switch of a level that began a new page into where
    /// it begins. Where the layout has a header or a footer of its own, those
    /// stand and the old names are let go.
    pub fn modernise(&mut self) {
        let numbers = self.page_numbers.take();
        let head = self.running_head.take();
        if (numbers.is_some() || head.is_some()) && self.header == Margin::default() && self.footer == Margin::footer()
        {
            let numbers = numbers.unwrap_or_default();
            let head = head.unwrap_or_default();
            let mut header = Margin::default();
            let mut footer = Margin { places: Sides::default(), ..Margin::default() };
            fn at(sides: &mut Sides, align: Align) -> &mut Vec<Item> {
                match align {
                    Align::Left | Align::Justified => &mut sides.left,
                    Align::Center => &mut sides.center,
                    Align::Right => &mut sides.right,
                }
            }
            let items = match head.content {
                HeadContent::None => vec![],
                HeadContent::Title => vec![Item::Title],
                HeadContent::Author => vec![Item::Author],
                HeadContent::AuthorTitle => vec![Item::Author, Item::Title],
                HeadContent::Text if head.text.trim().is_empty() => vec![],
                HeadContent::Text => vec![Item::Text { text: head.text.trim().to_owned() }],
            };
            if items.len() == 2 {
                header.separator = " / ".into();
            }
            at(&mut header.places, head.align).extend(items);
            header.case = head.case;
            if numbers.show {
                let margin = if numbers.position.is_top() { &mut header } else { &mut footer };
                at(&mut margin.places, numbers.position.align()).push(Item::PageNumber);
            }
            for m in [&mut header, &mut footer] {
                m.shown = !m.places.is_empty();
                m.first_page = numbers.first_page;
            }
            self.header = header;
            self.footer = footer;
        }
        for l in &mut self.headings.levels {
            if let Some(old) = l.new_page.take()
                && l.begins == Begins::Text
                && old
            {
                l.begins = Begins::Page;
            }
        }
    }

    /// Where the number of the page stands: the footer where it holds it, else the header where that does.
    pub fn numbered_margin(&self) -> Option<&Margin> {
        [&self.footer, &self.header].into_iter().find(|m| m.shown && m.has_number())
    }

    /// The description of a level of heading; the last one serves for deeper levels.
    pub fn heading(&self, level: usize) -> HeadingLevel {
        let levels = &self.headings.levels;
        if levels.is_empty() {
            return HeadingLevel::default();
        }
        levels[level.clamp(1, levels.len()) - 1].clone()
    }

    /// Gives the words the format prints in the language of the document
    /// (ADR 0020): those it has as they are in English ("Notes",
    /// "Bibliography", "Figure") are given in the language of the document,
    /// where documents have words in it; its own are kept.
    pub fn speak(&mut self, language: Option<&str>) {
        let words = [
            &mut self.title.abstract_label,
            &mut self.title.keywords_label,
            &mut self.notes.title,
            &mut self.bibliography.title,
            &mut self.figures.label,
            &mut self.figures.reference,
            &mut self.figures.end_title,
            &mut self.figures.placeholder,
            &mut self.tables.label,
            &mut self.tables.reference,
            &mut self.tables.end_title,
            &mut self.tables.placeholder,
        ];
        for word in words {
            *word = crate::i18n::in_language(language, word);
        }
    }

    /// The format as a document is made with it, for the preview and the
    /// export alike: within bounds first, and then in the language of the
    /// document, so that a word put back to its default is given in that
    /// language too.
    pub fn readied(&mut self, language: Option<&str>) {
        self.sanitise();
        self.speak(language);
    }

    /// Puts values that make no sense back within bounds, so that a format
    /// made by hand cannot break the making of a document.
    pub fn sanitise(&mut self) {
        self.modernise();
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
        if self.verse.every == 0 || self.verse.every > 1000 {
            self.verse.every = 5;
        }
        clamp(&mut self.bibliography.size, 0.0, 36.0, 0.0);
        clamp(&mut self.bibliography.line_spacing, 0.0, 4.0, 0.0);
        clamp(&mut self.figures.caption_size, 0.0, 36.0, 0.0);
        clamp(&mut self.figures.caption_line_spacing, 0.0, 4.0, 1.0);
        clamp(&mut self.tables.caption_size, 0.0, 36.0, 0.0);
        clamp(&mut self.tables.caption_line_spacing, 0.0, 4.0, 1.0);
        clamp(&mut self.tables.size, 0.0, 36.0, 0.0);
        clamp(&mut self.tables.line_spacing, 0.0, 4.0, 1.0);
        if !self.tables.placeholder.contains("{}") {
            self.tables.placeholder = Tables::default().placeholder;
        }
        if !self.figures.placeholder.contains("{}") {
            self.figures.placeholder = Figures::default().placeholder;
        }
        for l in &mut self.headings.levels {
            clamp(&mut l.size, 6.0, 72.0, 12.0);
        }
        for m in [&mut self.header, &mut self.footer] {
            clamp(&mut m.size, 0.0, 36.0, 0.0);
            if m.separator.chars().count() > 12 {
                m.separator = " · ".into();
            }
        }
        self.headings.levels.truncate(6);
        if self.headings.levels.is_empty() {
            self.headings = Headings::default();
        }
        if self.font.family.trim().is_empty() {
            self.font.family = "Times New Roman".into();
        }
        kinds::sanitise(&mut self.kinds);
        crate::templates::kinds::sanitise(&mut self.parts);
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
        self.page.columns = self.page.columns.clamp(1, 4);
        let gap = self.page.column_gap.points();
        if !gap.is_finite() || !(0.0..=w / 4.0).contains(&gap) {
            self.page.column_gap = Length::cm(1.0);
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

/// Fonts that mathematics may be set in, the first that is installed used.
/// Mathematics needs a font made for it, which says how its parts are put
/// together; a font of text will not do, and Typst sets no equation without
/// one. First the font Typst sets it in by itself, which comes with Typst
/// where its fonts are compiled in (Windows, macOS); then that of Libertinus,
/// which the package of Linux depends on; then those that are common.
pub const MATH_FONTS: [&str; 9] = [
    "New Computer Modern Math",
    "Libertinus Math",
    "Latin Modern Math",
    "STIX Two Math",
    "TeX Gyre Termes Math",
    "TeX Gyre Pagella Math",
    "Cambria Math",
    "DejaVu Math TeX Gyre",
    "Noto Sans Math",
];

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
    shelf: Shelf,
}

/// A format read from its file, put right where it says nonsense.
fn read(path: &Path) -> Result<DocumentFormat> {
    let text = fs::read_to_string(path).context(|| tr!("io-reading", path = path))?;
    let mut format: DocumentFormat =
        serde_json::from_str(&text).map_err(|e| Error::Parse { path: path.to_owned(), message: e.to_string() })?;
    if format.id.is_empty() {
        format.id = shelf::stem(path);
    }
    format.sanitise();
    Ok(format)
}

impl Shelved for DocumentFormat {
    const CALLED: &'static str = "a format";

    fn read_bundled(_: &Shelf, path: &Path) -> Result<Self> {
        read(path)
    }

    fn read_own(path: &Path) -> Result<Self> {
        let mut format = read(path)?;
        format.kind = Kind::Own;
        Ok(format)
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
        self.kind = Kind::Own;
        self.sanitise();
    }
    fn rank(&self) -> u8 {
        match self.kind {
            Kind::Own => 0,
            Kind::General => 1,
            Kind::Fiction => 2,
            Kind::Stage => 3,
            Kind::Poetry => 4,
            Kind::StyleGuide => 5,
            Kind::Publisher => 6,
            Kind::Journal => 7,
        }
    }
    fn name(&self) -> &str {
        &self.name
    }

    fn bad_id(id: &str) -> Error {
        Error::invalid(tr!("core-export-format-bad-id", id = id))
    }
    fn needs_name() -> Error {
        Error::invalid(tr!("core-export-format-needs-name"))
    }
    fn own_only() -> Error {
        Error::invalid(tr!("core-export-format-own-only"))
    }
    fn not_found(id: &str) -> Error {
        Error::not_found(tr!("core-export-the-format", id = id))
    }
}

impl Formats {
    pub fn new(resources: &Path, own: &Path) -> Self {
        Formats { shelf: Shelf::new(resources.join("formats"), own) }
    }

    pub fn all(&self) -> Vec<(DocumentFormat, bool)> {
        self.shelf.all()
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
        self.shelf.get(id)
    }

    /// The format with an id, or the general one when it is not there.
    pub fn get_or_default(&self, id: &str) -> DocumentFormat {
        self.shelf.get_or(id, "manuscript", || {
            let mut f = DocumentFormat { id: "manuscript".into(), name: "Manuscript".into(), ..Default::default() };
            f.sanitise();
            f
        })
    }

    /// Saves a format as the user's own. Returns it as saved.
    pub fn save(&self, format: DocumentFormat) -> Result<DocumentFormat> {
        self.shelf.save(format)
    }

    pub fn delete(&self, id: &str) -> Result<()> {
        self.shelf.delete::<DocumentFormat>(id)
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
    fn headings_are_numbered_level_by_level() {
        let mut h = Headings { numbered: true, ..Default::default() };
        let arabic = Some(NumberStyle::Arabic);
        assert_eq!(h.resolved_numbering(), [arabic, arabic, arabic]);
        assert!(h.plain_numbering());
        assert_eq!(heading_number(&[2, 1, 3], &h.resolved_numbering()).as_deref(), Some("2.1.3"));
        // Level 3 none: not numbered, the deeper as it.
        h.levels[2].numbering = LevelNumbering::None;
        assert_eq!(h.resolved_numbering(), [arabic, arabic, None]);
        assert!(!h.plain_numbering());
        assert_eq!(heading_number(&[2, 1, 3], &h.resolved_numbering()), None);
        assert_eq!(heading_number(&[2, 1], &h.resolved_numbering()).as_deref(), Some("2.1"));
        // Level 1 roman, level 2 as above: in its style, under its number.
        h.levels[2].numbering = LevelNumbering::AsAbove;
        h.levels[0].numbering = LevelNumbering::Roman;
        assert_eq!(heading_number(&[4, 2], &h.resolved_numbering()).as_deref(), Some("IV.II"));
        h.levels[1].numbering = LevelNumbering::Arabic;
        assert_eq!(heading_number(&[4, 2], &h.resolved_numbering()).as_deref(), Some("IV.2"));
        assert_eq!(heading_number(&[4, 2, 1], &h.resolved_numbering()).as_deref(), Some("IV.2.1"));
        // A level not numbered between: the numbers of the numbered levels.
        h.levels[1].numbering = LevelNumbering::None;
        h.levels[2].numbering = LevelNumbering::AlphaLower;
        assert_eq!(heading_number(&[4, 2, 3], &h.resolved_numbering()).as_deref(), Some("IV.c"));
        // Not numbered at all, whatever the levels say.
        h.numbered = false;
        assert_eq!(h.resolved_numbering(), [None, None, None]);
        assert!(!h.plain_numbering());
        assert_eq!(styled_number(1994, NumberStyle::Roman), "MCMXCIV");
        assert_eq!(styled_number(28, NumberStyle::Letters), "AB");
        assert_eq!(styled_number(3, NumberStyle::RomanLower), "iii");
    }

    #[test]
    fn a_layout_in_the_old_shape_reads_as_the_new() {
        let old = r#"{"pageNumbers": {"show": true, "position": "top-right", "firstPage": false},
                      "runningHead": {"content": "author-title", "align": "right", "case": "upper"},
                      "headings": {"levels": [{"size": 14, "newPage": true}, {"size": 12}]}}"#;
        let mut f: DocumentFormat = serde_json::from_str(old).unwrap();
        f.sanitise();
        let header = Margin {
            shown: true,
            first_page: false,
            case: Case::Upper,
            separator: " / ".into(),
            places: Sides { right: vec![Item::Author, Item::Title, Item::PageNumber], ..Default::default() },
            ..Default::default()
        };
        assert_eq!(f.header, header);
        assert_eq!(f.footer, Margin { first_page: false, ..Default::default() });
        assert!(!f.footer.shown);
        assert_eq!(f.headings.levels[0].begins, Begins::Page);
        assert_eq!(f.headings.levels[1].begins, Begins::Text);
        let written = serde_json::to_value(&f).unwrap();
        for old in ["pageNumbers", "runningHead"] {
            assert!(written.get(old).is_none(), "{old} is not written");
        }
        assert!(written["headings"]["levels"][0].get("newPage").is_none());
        assert_eq!(written["header"]["right"][2], serde_json::json!({"kind": "page-number"}));
        // Read again, it is the same.
        let mut again: DocumentFormat = serde_json::from_value(written).unwrap();
        again.sanitise();
        assert_eq!(again, f);

        // A layout with no word of the margins has the number in the middle of the footer.
        let mut plain: DocumentFormat = serde_json::from_str("{}").unwrap();
        plain.sanitise();
        assert_eq!(plain.footer, Margin::footer());
        assert!(!plain.header.shown);
        // The page numbers turned off leave the footer empty and hidden.
        let mut off: DocumentFormat = serde_json::from_str(r#"{"pageNumbers": {"show": false}}"#).unwrap();
        off.sanitise();
        assert!(!off.footer.shown && off.footer.places.is_empty() && off.numbered_margin().is_none());
    }

    #[test]
    fn a_format_with_nothing_said_is_whole() {
        let f: DocumentFormat = serde_json::from_str(r#"{"id":"x","name":"X"}"#).unwrap();
        assert_eq!(f.font.size, 12.0);
        assert_eq!(f.page.size, "a4");
        assert_eq!((f.page.columns, f.page.column_gap), (1, Length::cm(1.0)), "one column, where nothing is said");
        assert_eq!(f.headings.levels.len(), 3);
        assert_eq!(f.heading(9), f.heading(3));
        assert_eq!(f.heading(0), f.heading(1));
        let text = serde_json::to_string(&f).unwrap();
        let again: DocumentFormat = serde_json::from_str(&text).unwrap();
        assert_eq!(f, again);
    }

    #[test]
    fn a_word_put_back_to_its_default_is_in_the_language_of_the_document() {
        let mut f = DocumentFormat::default();
        f.figures.placeholder = "Figur".into();
        f.readied(Some("nb"));
        let default = Figures::default().placeholder;
        assert_eq!(f.figures.placeholder, crate::i18n::in_language(Some("nb"), &default));
        assert_ne!(f.figures.placeholder, default, "said in Bokmål");
        assert!(f.figures.placeholder.contains("{}"));
    }

    #[test]
    fn nonsense_is_put_right() {
        let mut f: DocumentFormat = serde_json::from_str(
            r#"{"font":{"family":" ","size":400},"text":{"lineSpacing":-1},
                "page":{"size":"a4","marginLeft":"40cm","marginTop":"1in","columns":9,"columnGap":"-2cm"},
                "headings":{"levels":[]}}"#,
        )
        .unwrap();
        f.sanitise();
        assert_eq!(f.font.size, 12.0);
        assert_eq!(f.font.family, "Times New Roman");
        assert_eq!(f.text.line_spacing, 1.5);
        assert_eq!(f.page.margin_left, Length::cm(2.5));
        assert_eq!(f.page.margin_top.points(), 72.0);
        assert_eq!((f.page.columns, f.page.column_gap), (4, Length::cm(1.0)));
        assert!(!f.headings.levels.is_empty());
        let mut none: DocumentFormat = serde_json::from_str(r#"{"page":{"columns":0}}"#).unwrap();
        none.sanitise();
        assert_eq!(none.page.columns, 1);
        // Written as the interface reads it.
        let page = serde_json::to_value(&none.page).unwrap();
        assert_eq!((page["columns"].as_u64(), page["columnGap"].as_str()), (Some(1), Some("1cm")));
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
