//! How the small things that texts and records are made of are written:
//! the identifiers of works, locators, numbers in Roman letters, the
//! entities of HTML, page ranges, the names of languages. Each is read and
//! put in its form here, and only here, wherever it is met: in the library,
//! the lookup, the imports, the reading of PDFs and of documents.

pub mod entities;
pub mod identifiers;
pub mod languages;
pub mod locators;
pub mod pages;
pub mod roman;
