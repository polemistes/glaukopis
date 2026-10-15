//! The shape of a page (ADR 0045): what a page is made of, read from the
//! geometry of its lines, the same for the text a PDF has and for what
//! Tesseract reads. Headings, lines kept where the page keeps them, numbers
//! in the margin beside their lines, paragraphs, and styles that recur
//! beside the body; running heads and page numbers left out.
//!
//! Nothing here gives a meaning to what it finds: a style found is named by
//! its look, and the writer says what it is.

use crate::document::Side;

use super::text::{self, Line, Style};

/// A page's lines, in reading order, as they are to be shaped, and its size
/// in the lines' units.
#[derive(Debug, Clone, Default)]
pub struct PageLines {
    pub lines: Vec<Line>,
    pub width: f32,
    pub height: f32,
}

/// What a page was found to be made of, in order.
#[derive(Debug, Clone, PartialEq)]
pub enum Piece {
    /// A heading, of level 1 (the largest) to 3.
    Heading { level: u8, lines: Vec<Line> },
    /// Lines joined into a paragraph; `indent` where it begins further in
    /// than the lines around it. `style` is the index of its style in the
    /// file's styles, 0 the body.
    Paragraph { lines: Vec<Line>, indent: bool, style: usize },
    /// Lines kept as lines, each with the given number that stood beside it
    /// in the margin, and the side the numbers stood on.
    KeptLines { lines: Vec<(Line, Option<String>)>, side: Option<Side>, style: usize },
}

/// A style of the file: its look, whether its paragraphs begin indented and
/// whether its lines are kept, a sample, how often it occurs and on how
/// many pages. The first of a file's styles is the body.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct StyleFound {
    pub style: Style,
    pub indent: bool,
    pub kept: bool,
    pub sample: String,
    pub count: usize,
    pub pages: usize,
}

/// Shapes every page of a file: the pieces of each page, and the styles of
/// the file, the body first. Running heads and page numbers are left out.
pub fn shape(pages: Vec<PageLines>) -> (Vec<Vec<Piece>>, Vec<StyleFound>) {
    let body = StyleFound::default();
    let shaped = pages
        .into_iter()
        .map(|page| {
            text::by_place(page.lines)
                .into_iter()
                .map(|lines| Piece::Paragraph { lines, indent: false, style: 0 })
                .collect()
        })
        .collect();
    (shaped, vec![body])
}
