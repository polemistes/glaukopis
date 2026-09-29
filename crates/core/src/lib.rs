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
pub mod library;
pub mod lookup;
pub mod net;
pub mod ocr;
pub mod paths;
pub mod pictures;
pub mod projects;
pub mod settings;
pub mod sharing;
pub mod spelling;
pub mod styles;

pub use error::{Error, Result};
