//! The core of Glaukopis: everything that is data and not interface.
//!
//! This crate does not depend on Tauri. The desktop application and the
//! command-line tools both call it.

pub mod bib;
pub mod document;
pub mod duplicates;
pub mod error;
pub mod export;
pub mod formats;
pub mod found;
pub mod fsutil;
pub mod history;
pub mod i18n;
pub mod import;
pub mod isolated;
pub mod languages;
pub mod library;
pub mod lookup;
pub mod net;
pub mod notices;
pub mod ocr;
pub mod paths;
pub mod pictures;
pub mod projectfile;
pub mod projects;
pub mod readable;
pub mod settings;
pub mod sharing;
mod shelf;
pub mod sidefile;
pub mod spelling;
pub mod styles;
pub mod templates;
#[cfg(test)]
pub(crate) mod testing;
pub mod written;

pub use error::{Error, Result};
