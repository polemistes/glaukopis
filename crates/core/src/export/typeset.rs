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

use serde::Serialize;
use typst::diag::{FileError, FileResult, Severity, SourceDiagnostic, Warned};
use typst::foundations::{Bytes, Datetime, NativeElement, Value};
use typst::introspection::{Introspector, MetadataElem};
use typst::layout::{Frame, FrameItem, Point, Transform};
use typst::syntax::{FileId, RootedPath, Source, VirtualPath, VirtualRoot};
use typst::text::{Font, FontBook};
use typst::utils::LazyHash;
use typst::{Library, LibraryExt, World};
use typst_kit::files::{FileLoader, FileStore, FsRoot};
use typst_kit::fonts::FontStore;
pub use typst_layout::PagedDocument;

use crate::document::pandoc::ELEMENT_LABEL;
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
struct Files(FsRoot);

impl FileLoader for Files {
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
    files: FileStore<Files>,
}

impl Setting {
    fn new(dir: &Path, main: &str) -> Result<Self> {
        let path = VirtualPath::new(main).map_err(|e| Error::invalid(format!("{main}: {e:?}")))?;
        Ok(Setting {
            main: RootedPath::new(VirtualRoot::Project, path).intern(),
            files: FileStore::new(Files(FsRoot::new(dir.to_path_buf()))),
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

/// A run of text on a page, as Typst set it, for selecting and copying from
/// the drawn page: where it begins, the y of its baseline, how far it
/// reaches, the size of its type, and its characters. All in points from
/// the top left corner of the page, as the SVG of the page has them.
#[derive(Debug, Clone, Default, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TextRun {
    pub x: f32,
    pub baseline: f32,
    pub width: f32,
    pub size: f32,
    pub text: String,
}

/// Where an element of the document begins on the pages: the page, the
/// first being 1, and the y in points from the top of it. By these the text
/// and the pages are kept side by side.
#[derive(Debug, Clone, Default, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Place {
    /// The id of the element.
    pub element: String,
    pub page: u32,
    pub y: f32,
}

/// The runs of text on a page of a document that was set, the first page
/// being 1. Nothing of a page that is not there; a run of nothing but white
/// space is left out.
pub fn texts(document: &PagedDocument, number: usize) -> Vec<TextRun> {
    let mut out = Vec::new();
    if let Some(page) = number.checked_sub(1).and_then(|i| document.pages().get(i)) {
        // Moved by the bleed, as the SVG of the page is drawn.
        runs_in(&page.frame, Transform::translate(page.bleed.left, page.bleed.top), &mut out);
    }
    out
}

/// Walks a frame and what is within it: a group stands at its place and may
/// be transformed, a text item stands with its baseline beginning at its place.
fn runs_in(frame: &Frame, ts: Transform, out: &mut Vec<TextRun>) {
    for (pos, item) in frame.items() {
        match item {
            FrameItem::Group(group) => {
                let ts = ts.pre_concat(Transform::translate(pos.x, pos.y)).pre_concat(group.transform);
                runs_in(&group.frame, ts, out);
            }
            FrameItem::Text(text) if !text.text.trim().is_empty() => {
                let start = pos.transform(ts);
                let end = Point::new(pos.x + text.width(), pos.y).transform(ts);
                out.push(TextRun {
                    x: start.x.to_pt() as f32,
                    baseline: start.y.to_pt() as f32,
                    width: (end.x - start.x).to_pt() as f32,
                    size: (text.size.to_pt() * ts.sy.get().abs()) as f32,
                    text: text.text.to_string(),
                });
            }
            _ => {}
        }
    }
}

/// Where the elements of the document begin on the pages, in the order of
/// the text: the marks that Pandoc was given to write before each section
/// (`#metadata("ID") <gk-el-ID>`, see `document::pandoc`) are asked where
/// they came to stand.
pub fn places(document: &PagedDocument) -> Vec<Place> {
    let introspector = document.introspector();
    introspector
        .query(&MetadataElem::ELEM.select())
        .iter()
        .filter_map(|content| {
            content.label().filter(|l| l.resolve().starts_with(ELEMENT_LABEL))?;
            let Value::Str(element) = &content.to_packed::<MetadataElem>()?.value else { return None };
            let position = introspector.position(content.location()?)?;
            let page = document.pages().get(position.page.get() - 1)?;
            Some(Place {
                element: element.to_string(),
                page: position.page.get() as u32,
                y: (position.point.y + page.bleed.top).to_pt() as f32,
            })
        })
        .collect()
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
    fn the_text_of_a_page_and_the_places_of_the_elements_are_found() {
        let tmp = tempfile::tempdir().unwrap();
        let marked = "#set page(width: 100mm, height: 80mm)\n#show heading: it => block(above: 2em, below: 1em, it)\n\
            #metadata(\"a\") <gk-el-a>\n\n= One\nSome words here.\n\n#pagebreak(weak: true)\n\n#metadata(\"b\") <gk-el-b>\n\n= Two\n\
            #box(move(dx: 10pt, dy: 5pt)[Moved.])\n\n#metadata(\"other\") <note>\n";
        std::fs::write(tmp.path().join("document.typ"), marked).unwrap();
        let set = set(tmp.path(), "document.typ").unwrap();
        assert_eq!(set.document.pages().len(), 2);

        let found = places(&set.document);
        assert_eq!(found.len(), 2, "{found:?}");
        assert_eq!((found[0].element.as_str(), found[0].page), ("a", 1));
        assert_eq!((found[1].element.as_str(), found[1].page), ("b", 2));
        assert!(found[0].y >= 0.0 && found[0].y < 80.0 * 72.0 / 25.4, "{found:?}");

        let runs = texts(&set.document, 1);
        let words: Vec<&str> = runs.iter().map(|r| r.text.as_str()).collect();
        assert!(words.contains(&"One"), "{words:?}");
        assert!(runs.iter().any(|r| r.text.contains("Some words")), "{words:?}");
        for run in &runs {
            assert!(run.size > 0.0 && run.width > 0.0, "{run:?}");
            assert!(run.x >= 0.0 && run.x + run.width <= 100.0 * 72.0 / 25.4 + 0.01, "{run:?}");
            assert!(run.baseline > 0.0 && run.baseline <= 80.0 * 72.0 / 25.4, "{run:?}");
            assert!(!run.text.trim().is_empty(), "{run:?}");
        }
        // The heading stands before its words, which stand below it.
        let one = runs.iter().find(|r| r.text == "One").unwrap();
        let some = runs.iter().find(|r| r.text.contains("Some")).unwrap();
        assert!(some.baseline > one.baseline, "{one:?} {some:?}");
        // A group that is moved moves its text with it.
        let two = texts(&set.document, 2);
        let two_heading = two.iter().find(|r| r.text == "Two").unwrap();
        let moved = two.iter().find(|r| r.text == "Moved.").unwrap();
        assert!((moved.x - two_heading.x - 10.0).abs() < 0.5, "{two_heading:?} {moved:?}");
        assert!(texts(&set.document, 3).is_empty() && texts(&set.document, 0).is_empty());

        // The marks change nothing of how the pages look.
        let bare: String = marked.lines().filter(|l| !l.starts_with("#metadata")).collect::<Vec<_>>().join("\n");
        std::fs::write(tmp.path().join("document.typ"), bare).unwrap();
        let plain = super::set(tmp.path(), "document.typ").unwrap();
        assert_eq!(plain.document.pages().len(), 2);
        assert!(places(&plain.document).is_empty());
        for page in 1..=2 {
            assert_eq!(texts(&plain.document, page), texts(&set.document, page), "page {page}");
            assert_eq!(svg(&plain.document, page), svg(&set.document, page), "page {page}");
        }
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
