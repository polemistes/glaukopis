//! Typst, within the application (ADR 0023): the document that Pandoc wrote
//! as Typst is set into pages here, not by the program `typst`. The pages
//! of the preview are then drawn from the document that was set, as they are
//! looked at, without its being set again; and what is set again is set
//! anew only where it changed, as Typst remembers what it did.
//!
//! What Typst may read is the place where the document is made, and nothing
//! outside it; it asks for no packages. Its fonts are those of the computer
//! and, where they are compiled in, those that come with Typst, found once.

use std::path::Path;
use std::sync::OnceLock;

use typst::diag::{FileError, FileResult, Severity, SourceDiagnostic, Warned};
use typst::foundations::{Bytes, Datetime};
use typst::syntax::{FileId, RootedPath, Source, VirtualPath, VirtualRoot};
use typst::text::{Font, FontBook};
use typst::utils::LazyHash;
use typst::{Library, LibraryExt, World};
use typst_kit::files::{FileLoader, FileStore, FsRoot};
use typst_kit::fonts::FontStore;
pub use typst_layout::PagedDocument;

use crate::error::{Error, Result};

/// The fonts Typst can set with: those of the computer, and those that come
/// with Typst, in that order, as the program has them. The fonts of Typst
/// are compiled in only with the feature `embedded-fonts`: on Windows and
/// macOS, where nothing else would install them; a package of Linux is
/// built without them and depends on the packages of the fonts instead, so
/// that the application is the smaller and the fonts are shared and kept up
/// by the system.
fn fonts() -> &'static FontStore {
    static FONTS: OnceLock<FontStore> = OnceLock::new();
    FONTS.get_or_init(|| {
        let began = std::time::Instant::now();
        let mut store = FontStore::new();
        store.extend(typst_kit::fonts::system());
        #[cfg(feature = "embedded-fonts")]
        store.extend(typst_kit::fonts::embedded());
        tracing::info!(took = ?began.elapsed(), "the fonts Typst sets with are found");
        store
    })
}

/// The families of the fonts Typst can set with, in order, each once.
pub fn families() -> Vec<String> {
    let mut out: Vec<String> = fonts().book().families().map(|(name, _)| name.to_owned()).collect();
    out.sort_by_key(|name| name.to_lowercase());
    out.dedup();
    out
}

fn library() -> &'static LazyHash<Library> {
    static LIBRARY: OnceLock<LazyHash<Library>> = OnceLock::new();
    LIBRARY.get_or_init(|| LazyHash::new(Library::builder().build()))
}

/// The files of the place where a document is made; no packages.
struct Place(FsRoot);

impl FileLoader for Place {
    fn load(&self, id: FileId) -> FileResult<Bytes> {
        match id.root() {
            VirtualRoot::Project => self.0.load(id.vpath()),
            VirtualRoot::Package(_) => Err(FileError::Other(Some("packages are not used".into()))),
        }
    }
}

/// What Typst sees of a document: its place, and the file it begins with.
struct Setting {
    main: FileId,
    files: FileStore<Place>,
}

impl Setting {
    fn new(dir: &Path, main: &str) -> Result<Self> {
        let path = VirtualPath::new(main).map_err(|e| Error::invalid(format!("{main}: {e:?}")))?;
        Ok(Setting {
            main: RootedPath::new(VirtualRoot::Project, path).intern(),
            files: FileStore::new(Place(FsRoot::new(dir.to_path_buf()))),
        })
    }
}

impl World for Setting {
    fn library(&self) -> &LazyHash<Library> {
        library()
    }

    fn book(&self) -> &LazyHash<FontBook> {
        fonts().book()
    }

    fn main(&self) -> FileId {
        self.main
    }

    fn source(&self, id: FileId) -> FileResult<Source> {
        self.files.source(id)
    }

    fn file(&self, id: FileId) -> FileResult<Bytes> {
        self.files.file(id)
    }

    fn font(&self, index: usize) -> Option<Font> {
        fonts().font(index)
    }

    fn today(&self, offset: Option<typst::foundations::Duration>) -> Option<Datetime> {
        let now = time::OffsetDateTime::now_utc();
        let now = match offset {
            Some(hours) => now.checked_add(time::Duration::seconds(hours.seconds() as i64))?,
            // The day as it is in UTC, which the day here differs from only about midnight.
            None => now,
        };
        Datetime::from_ymd(now.year(), now.month().into(), now.day())
    }
}

/// A document that was set, and what Typst said of it.
pub struct Set {
    pub document: PagedDocument,
    pub warnings: Vec<String>,
}

/// What Typst said, as the one who writes is told it: the message, and its hints.
fn said(diagnostic: &SourceDiagnostic) -> String {
    let mut out = diagnostic.message.to_string();
    for hint in &diagnostic.hints {
        out.push_str(" (");
        out.push_str(&hint.v);
        out.push(')');
    }
    out
}

/// Sets a document, which begins with the file `main` in `dir`, into pages.
pub fn set(dir: &Path, main: &str) -> Result<Set> {
    let setting = Setting::new(dir, main)?;
    let began = std::time::Instant::now();
    let Warned { output, warnings } = typst::compile::<PagedDocument>(&setting);
    // What Typst remembers of earlier settings is kept for a few more: a
    // document set again after a change is set anew only where it changed.
    comemo::evict(10);
    tracing::debug!(took = ?began.elapsed(), "Typst has set the document");
    let document = output.map_err(|errors| Error::Program {
        program: "Typst".into(),
        message: errors.iter().filter(|e| e.severity == Severity::Error).map(said).collect::<Vec<_>>().join("\n"),
    })?;
    let warnings = warnings
        .iter()
        .map(said)
        // A font that is not there is told of by the preview in its own words.
        .filter(|w| !w.to_lowercase().contains("unknown font family"))
        .collect();
    Ok(Set { document, warnings })
}

/// A page of a document that was set, drawn as SVG: the first is 1.
pub fn svg(document: &PagedDocument, number: usize) -> Option<String> {
    let page = document.pages().get(number.checked_sub(1)?)?;
    Some(typst_svg::svg(page, &typst_svg::SvgOptions::default()))
}

/// A document that was set, as a PDF.
pub fn pdf(document: &PagedDocument) -> Result<Vec<u8>> {
    typst_pdf::pdf(document, &typst_pdf::PdfOptions::default()).map_err(|errors| Error::Program {
        program: "Typst".into(),
        message: errors.iter().map(said).collect::<Vec<_>>().join("\n"),
    })
}

/// Sets a document and makes a PDF of it, where it is.
pub fn pdf_of(dir: &Path, main: &str) -> Result<(Vec<u8>, Vec<String>)> {
    let set = set(dir, main)?;
    Ok((pdf(&set.document)?, set.warnings))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_document_is_set_drawn_and_made_a_pdf() {
        let tmp = tempfile::tempdir().unwrap();
        std::fs::write(
            tmp.path().join("document.typ"),
            "#set page(width: 100mm, height: 80mm)\n= One\nSome words.\n#pagebreak()\n= Two\n#text(font: \"No Such Font\")[Else.]\n",
        )
        .unwrap();
        let set = set(tmp.path(), "document.typ").unwrap();
        assert_eq!(set.document.pages().len(), 2);
        assert!(set.warnings.is_empty(), "a font that is not there is not told of here: {:?}", set.warnings);
        let page = svg(&set.document, 2).unwrap();
        assert!(page.starts_with("<svg"), "{}", &page[..40]);
        assert!(svg(&set.document, 3).is_none() && svg(&set.document, 0).is_none());
        assert!(pdf(&set.document).unwrap().starts_with(b"%PDF"));
    }

    #[test]
    fn what_is_wrong_is_said_and_nothing_outside_the_place_is_read() {
        let tmp = tempfile::tempdir().unwrap();
        let place = tmp.path().join("place");
        std::fs::create_dir_all(&place).unwrap();
        std::fs::write(tmp.path().join("secret.txt"), "not to be read").unwrap();
        std::fs::write(place.join("document.typ"), "#read(\"../secret.txt\")").unwrap();
        let Err(Error::Program { program, message }) = set(&place, "document.typ") else { panic!("read outside") };
        assert_eq!(program, "Typst");
        assert!(!message.is_empty());
        std::fs::write(place.join("document.typ"), "#let x = \n").unwrap();
        assert!(set(&place, "document.typ").is_err());
    }

    #[test]
    fn its_fonts_are_known() {
        let families = families();
        // Those that come with Typst are there wherever they are compiled in;
        // without them, the fonts are the computer's alone, whatever it has.
        #[cfg(feature = "embedded-fonts")]
        assert!(families.iter().any(|f| f == "Libertinus Serif"), "{families:?}");
        let mut lowered: Vec<String> = families.iter().map(|f| f.to_lowercase()).collect();
        lowered.dedup();
        assert_eq!(lowered.len(), families.len(), "each family once");
    }
}
