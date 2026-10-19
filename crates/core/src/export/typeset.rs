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
use typst::foundations::{Bytes, Content, Datetime, NativeElement, Selector, Smart, StyleChain, Value};
use typst::introspection::{Introspector, Location, MetadataElem, Tag};
use typst::layout::{BlockElem, Frame, FrameItem, Point, Transform};
use typst::model::{
    EnumElem, FigureElem, FigureKind, FootnoteEntry, HeadingElem, ListElem, OutlineElem, QuoteElem, TableElem,
};
use typst::syntax::{FileId, RootedPath, Source, VirtualPath, VirtualRoot};
use typst::text::RawElem;
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

/// A stretch of a page and what stands in it, for the preview to say what a
/// line is and to open its look: the page, the first being 1, the top and
/// the bottom in points from the top of the page, as the SVG of the page
/// has them, and what it is.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Spot {
    pub page: u32,
    pub top: f32,
    pub bottom: f32,
    /// `kind:<id>` for a kind of paragraph, `part:<id>` for an element of a
    /// kind that makes a document or a part the core makes (the contents,
    /// the lists of figures and of tables), `heading:<level>`, `note`,
    /// `bibliography`, `figure`, `table` or `front`.
    pub what: String,
}

/// What a block that was set is, where the preview names it; nothing for
/// the rest, which is text. Only blocks are named: a run of words of a kind
/// lies within a line, and would name the whole line.
fn what_of(content: &Content) -> Option<String> {
    // Typst copies what the styles say into an element as it prepares it:
    // the fields of one that was set are read without them.
    let styles = StyleChain::default();
    // The divisions of the document, which Pandoc writes as blocks with
    // labels: `#block[…] <gk-kind-epigraph>`.
    if content.elem() == BlockElem::ELEM {
        let label = content.label()?.resolve();
        let label: &str = &label;
        if let Some(id) = label.strip_prefix("gk-kind-") {
            return Some(format!("kind:{id}"));
        }
        if let Some(id) = label.strip_prefix("gk-part-") {
            return Some(format!("part:{id}"));
        }
        let placed = |side: &str| matches!(side, "left" | "center" | "right" | "within");
        return match label {
            "gk-front" | "gk-half-title" => Some("front".into()),
            "refs" => Some("bibliography".into()),
            "gk-notes" => Some("note".into()),
            _ if label.strip_prefix("gk-figure-").is_some_and(placed) => Some("figure".into()),
            _ if label.strip_prefix("gk-table-").is_some_and(placed) => Some("table".into()),
            _ => None,
        };
    }
    if let Some(heading) = content.to_packed::<HeadingElem>() {
        // The title of a list of contents is a heading that is not listed: it is the list's.
        if !heading.outlined.get(styles) {
            return None;
        }
        let label = content.label().map(|l| l.resolve());
        return Some(match label.as_deref() {
            Some("bibliography") => "bibliography".into(),
            Some("notes") => "note".into(),
            _ => format!("heading:{}", heading.resolve_level(styles)),
        });
    }
    if content.is::<FootnoteEntry>() {
        return Some("note".into());
    }
    // A quotation set off from the text, as Pandoc writes one; a quotation within a line is not.
    if let Some(quote) = content.to_packed::<QuoteElem>() {
        return quote.block.get(styles).then(|| "kind:quote".into());
    }
    if let Some(raw) = content.to_packed::<RawElem>() {
        return raw.block.get(styles).then(|| "kind:code".into());
    }
    if content.is::<ListElem>() {
        return Some("kind:item".into());
    }
    if content.is::<EnumElem>() {
        return Some("kind:numbered".into());
    }
    if content.is::<TableElem>() {
        return Some("table".into());
    }
    if let Some(figure) = content.to_packed::<FigureElem>() {
        let table =
            matches!(figure.kind.get_cloned(styles), Smart::Custom(FigureKind::Elem(e)) if e == TableElem::ELEM);
        return Some(if table { "table" } else { "figure" }.into());
    }
    if let Some(outline) = content.to_packed::<OutlineElem>() {
        // The lists of figures and of tables are outlines of figures of a kind.
        let listed = match &outline.target.get_cloned(styles).0 {
            Selector::Elem(elem, Some(fields)) if *elem == FigureElem::ELEM => {
                let tables =
                    fields.iter().any(|(_, v)| matches!(v, Value::Func(f) if f.to_element() == Some(TableElem::ELEM)));
                if tables { "list-of-tables" } else { "list-of-figures" }
            }
            _ => "contents",
        };
        return Some(format!("part:{listed}"));
    }
    None
}

/// The tags of a frame and of what is within it, each with its y on the
/// page, in the order Typst set them: where an element begins, where it ends.
fn tags_in<'a>(frame: &'a Frame, ts: Transform, out: &mut Vec<(f32, &'a Tag)>) {
    for (pos, item) in frame.items() {
        match item {
            FrameItem::Group(group) => {
                let ts = ts.pre_concat(Transform::translate(pos.x, pos.y)).pre_concat(group.transform);
                tags_in(&group.frame, ts, out);
            }
            FrameItem::Tag(tag) => out.push((pos.transform(ts).y.to_pt() as f32, tag)),
            _ => {}
        }
    }
}

/// What stands where on the pages of a document that was set: the stretch
/// of every block the preview names (see [`Spot`]), page by page, from the
/// top. Typst marks where each element begins and ends among what it set.
/// An element that goes on to the next page goes on there from the top of
/// the text, below the margin at the head (`margins.0`, in points), and
/// fills the pages between to the margin at the foot (`margins.1`): the
/// running head and the number of the page stand outside it. A note that
/// goes on to the next page is named on its first page only: what goes on
/// stands among the notes at the foot of the next, which nothing tells
/// apart from the text above them.
pub fn spots(document: &PagedDocument, margins: (f32, f32)) -> Vec<Spot> {
    struct Open {
        location: Location,
        what: String,
        page: usize,
        top: f32,
    }
    let pages = document.pages();
    // Where the text of a page stands, between its margins.
    let text = |page: usize| {
        let p = &pages[page];
        let top = p.bleed.top.to_pt() as f32;
        (top + margins.0, top + p.frame.height().to_pt() as f32 - margins.1)
    };
    let mut out: Vec<Spot> = Vec::new();
    let mut close = |Open { what, page: from, top, .. }: Open, page: usize, y: f32| {
        let mut add = |at: usize, top: f32, bottom: f32| {
            // What has no height holds no line: an end found at the top of the next page.
            if bottom - top >= 0.5 {
                out.push(Spot { page: at as u32 + 1, top, bottom, what: what.clone() });
            }
        };
        if from == page && y >= top {
            add(page, top, y);
            return;
        }
        // An end above the beginning on the same page: it went on in the next column.
        let (_, foot) = text(from);
        add(from, top, foot);
        if from != page && what == "note" {
            return;
        }
        for between in from + 1..page {
            let (head, foot) = text(between);
            add(between, head, foot);
        }
        let (head, _) = text(page);
        add(page, head, y);
    };
    let mut open: Vec<Open> = Vec::new();
    for (i, page) in pages.iter().enumerate() {
        let mut tags = Vec::new();
        // Moved by the bleed, as the SVG of the page is drawn.
        tags_in(&page.frame, Transform::translate(page.bleed.left, page.bleed.top), &mut tags);
        for (y, tag) in tags {
            match tag {
                Tag::Start(content, _) => {
                    if let (Some(location), Some(what)) = (content.location(), what_of(content)) {
                        open.push(Open { location, what, page: i, top: y });
                    }
                }
                Tag::End(location, ..) => {
                    if let Some(at) = open.iter().rposition(|o| o.location == *location) {
                        close(open.remove(at), i, y);
                    }
                }
            }
        }
    }
    // Typst ends every element it begins; one that was not ended ends with the text.
    if let Some(last) = pages.len().checked_sub(1) {
        let (_, foot) = text(last);
        while let Some(o) = open.pop() {
            close(o, last, foot);
        }
    }
    out.sort_by(|a, b| a.page.cmp(&b.page).then(a.top.total_cmp(&b.top)));
    out
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
    fn what_stands_where_on_the_pages_is_found() {
        let tmp = tempfile::tempdir().unwrap();
        // The pages as the opening of a document sets them: margins, a running
        // head, the number at the foot, and the edges of the type. The blocks
        // with labels as Pandoc writes them, and the rest as Typst has it.
        let source = "#set page(width: 100mm, height: 80mm, margin: (top: 30pt, bottom: 30pt, x: 20pt), \
              header: [Running head], footer: context counter(page).display())\n\
            #set text(size: 9pt, top-edge: 0.8em, bottom-edge: -0.2em)\n\
            #show <gk-kind-epigraph>: it => block(inset: (left: 1em), it.body)\n\
            #block[#block[The title] <gk-title>] <gk-front>\n\
            #outline(title: [Contents])\n\
            #outline(title: [Tables], target: figure.where(kind: table))\n\
            Words before.#footnote[A note.]\n\n\
            #block[Sing, goddess.] <gk-kind-epigraph>\n\n\
            #quote(block: true)[The wrath of Achilles.]\n\n\
            Within a line #quote[a quotation] and #box[words] <gk-kind-foreign> of a kind.\n\n\
            = A heading\n\
            == A deeper one\n\
            #block[#rect(width: 10pt, height: 10pt) #block[Figure 1.] <gk-figure-caption>] <gk-figure-center>\n\
            #figure(table(columns: 2)[a][b], caption: [The poems])\n\n\
            - One\n- Two\n\n\
            #block[#lorem(400)] <gk-part-appendix>\n\n\
            Words with a long note.#footnote[#lorem(250)]\n\n\
            #heading(level: 1, numbering: none)[Bibliography]\n<bibliography>\n\
            #block[#block[Nagy 1979.] <ref-nagy>] <refs>\n";
        std::fs::write(tmp.path().join("document.typ"), source).unwrap();
        let set = set(tmp.path(), "document.typ").unwrap();
        let count = set.document.pages().len();
        let height = 80.0 * 72.0 / 25.4;
        let found = spots(&set.document, (30.0, 30.0));
        for s in &found {
            assert!(s.page >= 1 && s.page as usize <= count, "{s:?}");
            assert!(s.top >= 0.0 && s.top < s.bottom && s.bottom <= height + 0.01, "{s:?}");
        }
        // What a line is: the innermost spot that holds its baseline, as the preview reads it.
        let named = |page: usize, baseline: f32| {
            found
                .iter()
                .filter(|s| s.page as usize == page && s.top - 0.5 <= baseline && baseline <= s.bottom + 0.5)
                .min_by(|a, b| (a.bottom - a.top).total_cmp(&(b.bottom - b.top)))
                .map(|s| s.what.as_str())
        };
        let runs: Vec<(usize, TextRun)> =
            (1..=count).flat_map(|page| texts(&set.document, page).into_iter().map(move |r| (page, r))).collect();
        // What each run of these words is, wherever it stands, in the order of the pages.
        let names = |words: &str| -> Vec<Option<&str>> {
            let mut out: Vec<Option<&str>> = runs
                .iter()
                .filter(|(_, r)| r.text.trim() == words || r.text.trim().starts_with(&format!("{words} ")))
                .map(|(p, r)| named(*p, r.baseline))
                .collect();
            assert!(!out.is_empty(), "“{words}” is not on the pages: {runs:?}");
            out.dedup();
            out
        };

        assert_eq!(names("The title"), [Some("front")]);
        // The titles of the lists of contents are theirs, not headings; what they list is theirs too.
        assert_eq!(names("Contents"), [Some("part:contents")]);
        assert_eq!(names("Tables"), [Some("part:list-of-tables")]);
        assert_eq!(names("A heading"), [Some("part:contents"), Some("heading:1")]);
        assert_eq!(names("A deeper one"), [Some("part:contents"), Some("heading:2")]);
        assert_eq!(names("Sing, goddess."), [Some("kind:epigraph")]);
        assert_eq!(names("The wrath of Achilles."), [Some("kind:quote")]);
        assert_eq!(names("Figure 1."), [Some("figure")]);
        assert_eq!(names("a"), [Some("table")]);
        assert_eq!(names("b"), [Some("table")]);
        assert_eq!(names("One"), [Some("kind:item")]);
        assert_eq!(names("Two"), [Some("kind:item")]);
        assert_eq!(names("Nagy 1979."), [Some("bibliography")]);
        assert!(names("Bibliography").ends_with(&[Some("bibliography")]), "{:?}", names("Bibliography"));
        assert_eq!(names("A note."), [Some("note")]);
        // A plain paragraph is in no spot, nor are words of a kind or a quotation within a line,
        // nor the running head and the numbers of the pages.
        assert_eq!(names("Words before."), [None]);
        assert_eq!(names("Within a line"), [None]);
        assert_eq!(names("Words with a long"), [None]);
        assert_eq!(names("Running head"), [None]);
        for (page, run) in
            runs.iter().filter(|(_, r)| r.baseline > height - 30.0 && r.text.trim().parse::<usize>().is_ok())
        {
            assert_eq!(named(*page, run.baseline), None, "the number of page {page}");
        }
        assert_eq!(found.iter().filter(|s| s.what == "kind:quote").count(), 1, "{found:?}");
        assert!(!found.iter().any(|s| s.what.contains("foreign")), "{found:?}");

        // In the order of the text, and one below another: the epigraph above the
        // quotation, the quotation above the heading.
        let first =
            |what: &str| found.iter().find(|s| s.what == what).unwrap_or_else(|| panic!("no {what}: {found:?}"));
        let order = [
            "front",
            "part:contents",
            "part:list-of-tables",
            "kind:epigraph",
            "kind:quote",
            "heading:1",
            "heading:2",
            "figure",
            "table",
            "kind:item",
            "part:appendix",
            "bibliography",
        ];
        for pair in order.windows(2) {
            let (a, b) = (first(pair[0]), first(pair[1]));
            assert!((a.page, a.top) < (b.page, b.top), "{a:?} {b:?}");
            if a.page == b.page {
                assert!(a.bottom <= b.top + 0.01, "{a:?} {b:?}");
            }
        }

        // A part that goes on over pages goes on below the margin at the head of
        // each and fills those between, to the margin at the foot.
        let appendix: Vec<&Spot> = found.iter().filter(|s| s.what == "part:appendix").collect();
        assert!(appendix.len() >= 3, "{appendix:?}");
        for (i, s) in appendix.iter().enumerate() {
            assert_eq!(s.page, appendix[0].page + i as u32, "{appendix:?}");
            if i > 0 {
                assert!((s.top - 30.0).abs() < 0.01, "{s:?}");
            }
            if i + 1 < appendix.len() {
                assert!((s.bottom - (height - 30.0)).abs() < 0.01, "{s:?}");
            }
        }
        // Each note once, the long one too, which goes on to the next page and
        // is named on its first only.
        assert_eq!(found.iter().filter(|s| s.what == "note").count(), 2, "{found:?}");

        // Plain text names nothing.
        std::fs::write(tmp.path().join("document.typ"), "#set page(width: 100mm, height: 80mm)\nWords.\n\nMore words.")
            .unwrap();
        let plain = super::set(tmp.path(), "document.typ").unwrap();
        assert!(spots(&plain.document, (30.0, 30.0)).is_empty());
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
