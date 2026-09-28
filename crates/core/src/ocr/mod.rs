//! Text read from PDFs and pictures (ADR 0018).
//!
//! Tesseract reads the text, as an installed program, as Pandoc and Typst
//! are used. The pages of a PDF are drawn for it as pictures
//! (`drawing.rs`); what it reads becomes paragraphs (`text.rs`).

pub mod drawing;
pub mod text;
