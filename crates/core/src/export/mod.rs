//! Preview and export.
//!
//! The document is handed to Pandoc as JSON. Pandoc formats the citations and
//! writes the output; for the preview and for PDF it writes Typst, which Typst
//! makes into pages. See ADR 0005.

pub mod after;
pub mod latex;
pub mod math;
pub mod reference;
pub mod tools;
pub mod typeset;

use std::fmt::Write as _;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value, json};

use crate::document::bibliography::{Bibliography, gather};
use crate::document::pandoc::{
    Converter, Extras, Flavour, PageBegins, meta_inlines, meta_list, meta_string, meta_text,
};
use crate::document::{Block, Contributor, Document, Inline, NotePlace, OwnKind, Part, Role, Section};
use crate::error::{Error, IoContext, Result};
use crate::formats::typst::{self, Particulars, preamble};
use crate::formats::{DocumentFormat, NoteKind, TitlePlacement};
use crate::fsutil::write_atomic;
use crate::library::Library;
use crate::styles::Styles;
use crate::templates::kinds::{Place as PartPlace, one_of, place_of};
use crate::templates::{ContentsItem, GeneratedPart, Output, Template};
use crate::tr;

pub use tools::{Tool, Tools};
pub use typeset::{Place, Spot, TextRun};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Target {
    /// Pages set by Typst: what the preview shows.
    Pdf,
    /// Pages set by LaTeX, for those who want its typesetting or are asked for it.
    PdfLatex,
    Docx,
    Odt,
    Latex,
    Markdown,
    Html,
    /// A book for readers of e-books.
    Epub,
    Typst,
}

impl Target {
    pub fn extension(self) -> &'static str {
        match self {
            Target::Pdf | Target::PdfLatex => "pdf",
            Target::Docx => "docx",
            Target::Odt => "odt",
            Target::Latex => "tex",
            Target::Markdown => "md",
            Target::Html => "html",
            Target::Epub => "epub",
            Target::Typst => "typ",
        }
    }

    fn pandoc(self) -> &'static str {
        match self {
            Target::Pdf | Target::Typst => "typst",
            Target::Docx => "docx",
            Target::Odt => "odt",
            Target::Latex | Target::PdfLatex => "latex",
            Target::Markdown => "markdown",
            Target::Html => "html",
            Target::Epub => "epub3",
        }
    }

    /// How a new page is begun, where the target knows pages.
    fn page_break(self) -> Option<Value> {
        let raw = |format: &str, text: &str| json!({"t": "RawBlock", "c": [format, text]});
        match self {
            Target::Pdf | Target::Typst => Some(raw("typst", "#pagebreak(weak: true)")),
            Target::Docx => Some(raw("openxml", "<w:p><w:r><w:br w:type=\"page\"/></w:r></w:p>")),
            Target::Odt => Some(raw("opendocument", "<text:p text:style-name=\"Pagebreak\"/>")),
            Target::Latex | Target::PdfLatex => Some(raw("latex", "\\clearpage")),
            Target::Markdown | Target::Html | Target::Epub => None,
        }
    }

    /// Where headings begin a page, and how a target begins one where
    /// something was told to (ADR 0057): Typst marks the opener and finds the
    /// blank left page by its marks; Word begins a section, whose first page
    /// takes the opener's header and footer, where the layout leaves either
    /// off the openers or a heading begins on a right-hand page; LaTeX gives
    /// the opener its own style of page; Writer begins a plain new page.
    fn page_begins(self, f: &DocumentFormat) -> PageBegins {
        let raw = |format: &str, text: &str| json!({"t": "RawBlock", "c": [format, text]});
        let levels = f
            .headings
            .levels
            .iter()
            .enumerate()
            .filter(|(_, l)| l.begins_page())
            .map(|(i, l)| (i as u8 + 1, l.begins))
            .collect();
        let off_openers = [&f.header, &f.footer].iter().any(|m| m.is_visible() && !m.openers);
        let section = |kind: &str| {
            raw("openxml", &format!("<w:p><w:pPr><w:sectPr><w:type w:val=\"{kind}\"/></w:sectPr></w:pPr></w:p>"))
        };
        let (opener, right) = match self {
            Target::Pdf | Target::Typst => (
                vec![raw("typst", &format!("#pagebreak(weak: true)\n{}", typst::OPENER))],
                vec![raw(
                    "typst",
                    &format!("{}\n#pagebreak(weak: true, to: \"odd\")\n{}", typst::BEFORE_RIGHT, typst::OPENER),
                )],
            ),
            Target::Docx => (
                vec![if off_openers { section("nextPage") } else { self.page_break().expect("Word has pages") }],
                vec![section("oddPage")],
            ),
            Target::Latex | Target::PdfLatex => (
                vec![raw("latex", "\\clearpage\\thispagestyle{opener}")],
                vec![raw(
                    "latex",
                    "\\clearpage\\ifodd\\value{page}\\else\\hbox{}\\thispagestyle{empty}\\newpage\\fi\\thispagestyle{opener}",
                )],
            ),
            Target::Odt => (self.page_break().into_iter().collect(), Vec::new()),
            Target::Markdown | Target::Html | Target::Epub => (Vec::new(), Vec::new()),
        };
        PageBegins { levels, opener, right }
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Request {
    pub document: Document,
    /// The id of the reference style.
    pub style: String,
    pub format: DocumentFormat,
    /// The template whole (ADR 0038); the plain one where nothing is given.
    #[serde(default = "Template::plain")]
    pub template: Template,
    /// Which of the template's outputs: the document where nothing is given.
    #[serde(default = "document_output")]
    pub output: String,
    /// Tells apart the work of different projects: the id of the project.
    #[serde(default)]
    pub key: String,
}

fn document_output() -> String {
    Output::DOCUMENT.into()
}

impl Request {
    /// A request of a document, with the plain template and the document output.
    pub fn new(document: Document, style: impl Into<String>, format: DocumentFormat, key: impl Into<String>) -> Self {
        Request {
            document,
            style: style.into(),
            format,
            template: Template::plain(),
            output: document_output(),
            key: key.into(),
        }
    }

    /// Only the document output is made in this piece; a request of another
    /// output is refused, and says so.
    pub fn check_output(&self) -> Result<()> {
        let id = self.output.trim();
        if id.is_empty() || id == Output::DOCUMENT {
            return Ok(());
        }
        Err(Error::invalid(if self.template.output(id).is_some() {
            tr!("core-export-output-not-yet", id = id)
        } else {
            tr!("core-export-output-unknown", id = id)
        }))
    }
}

/// A page of the preview.
#[derive(Debug, Clone, Default, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Page {
    /// Which page it is, the first being 1.
    pub number: u32,
    /// The page, as SVG.
    pub svg: String,
    /// The runs of text on the page, where they stand, for selecting and
    /// copying what the drawing shows.
    pub texts: Vec<TextRun>,
}

/// At most so many pages are given at once: a page is a quarter of a
/// megabyte, and those that are looked at are few.
pub const MOST_PAGES: usize = 12;

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Preview {
    /// How many pages the document has.
    pub count: usize,
    /// The pages that were asked for, in their order.
    pub pages: Vec<Page>,
    /// The size of a page in points.
    pub width: f32,
    pub height: f32,
    pub warnings: Vec<String>,
    /// Ids of works cited that are in neither the library nor the project.
    pub missing: Vec<String>,
    /// The font used in place of the one the format asks for, when that is not installed.
    pub substitute: Option<String>,
    /// Where each element of the document begins on the pages, in the order
    /// of the text, for keeping the text and the pages side by side.
    pub places: Vec<Place>,
    /// What stands where on the pages: the stretches of the quotations, the
    /// headings, the notes and the rest, page by page, so that the preview
    /// can say what a line is and open its look.
    pub spots: Vec<Spot>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct ExportOptions {
    /// For LaTeX: citations stay commands of BibLaTeX, and the references go
    /// into a `.bib` file beside the document.
    pub biblatex: bool,
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Exported {
    pub path: String,
    /// Other files written beside it.
    pub also: Vec<String>,
    pub warnings: Vec<String>,
    pub missing: Vec<String>,
}

pub struct Context<'a> {
    pub tools: &'a Tools,
    pub resources: &'a Path,
    pub styles: &'a Styles,
    pub library: Option<&'a Library>,
    /// Where work in progress is kept.
    pub work: PathBuf,
    /// The fonts Typst finds, if they have been asked for.
    pub fonts: &'a [String],
    /// The library's directory, where the files of the figures are kept by
    /// their hashes (ADR 0070).
    pub pictures: Option<&'a Path>,
}

/// The files of the figures of a document, where the program that makes the
/// document finds them.
#[derive(Debug, Default)]
struct Placed {
    /// The directory they are in, as the document names it.
    name: String,
    /// Those that are there, as `<hash>.<extension>`.
    present: std::collections::HashSet<String>,
    /// How many the store has and could not be put there, and why the
    /// first could not: a disk that is full, a folder that cannot be
    /// written. Said apart from the pictures that are not in the store.
    failed: usize,
    error: Option<String>,
}

impl Placed {
    fn failed(&mut self, count: usize, error: String) {
        tracing::warn!(count, %error, "the files of figures could not be placed");
        self.failed += count;
        self.error.get_or_insert(error);
    }

    /// What is said of those that could not be placed.
    fn remark(&self) -> Option<String> {
        let error = self.error.as_ref()?;
        Some(tr!("core-export-files-not-placed", count = self.failed, error = error))
    }
}

/// The widest a picture is in the preview, in points of the picture: a
/// page is looked at there, at the size of a window.
const WIDEST_SHOWN: u32 = 1400;

/// Puts the files of the figures into a directory beside what is made.
///
/// With `light`, large pictures are put there smaller than they are: the
/// preview is made again and again as the text is written, and shows its
/// pages at the size of a window.
fn place_files(ctx: &Context, request: &Request, into: &Path, name: &str, light: bool) -> Placed {
    let mut placed = Placed { name: name.to_owned(), ..Default::default() };
    let wanted = request.document.figure_files();
    let Some(pictures) = ctx.pictures else { return placed };
    if wanted.is_empty() {
        return placed;
    }
    let to = into.join(name);
    if let Err(e) = fs::create_dir_all(&to) {
        placed.failed(wanted.len(), Error::io(tr!("io-creating", path = &to), e).to_string());
        return placed;
    }
    for (hash, extension) in wanted {
        let Some(source) = crate::library::figures::file_of(pictures, &hash) else { continue };
        let file = format!("{hash}.{extension}");
        let target = to.join(&file);
        let size = |path: &Path| path.metadata().ok().filter(|m| m.is_file()).map(|m| m.len());
        let Some(whole) = size(&source) else { continue };
        // A file is what its name says: one that is there need not be made
        // again. A lighter one is known by being there at all.
        let there = match size(&target) {
            Some(n) if light => n > 0,
            Some(n) => n == whole,
            None => false,
        };
        // A lighter one that cannot be made is not a failure: the whole one is copied.
        let lighter = || {
            (light && whole > 200_000)
                .then(|| fs::read(&source).ok())
                .flatten()
                .and_then(|bytes| crate::library::figures::lighter(&bytes, &extension, WIDEST_SHOWN))
        };
        let made = if there {
            Ok(())
        } else if let Some(small) = lighter() {
            write_atomic(&target, &small)
        } else {
            fs::copy(&source, &target).map(|_| ()).context(|| tr!("io-copying", path = &source))
        };
        match made {
            Ok(()) => {
                placed.present.insert(file);
            }
            Err(e) => placed.failed(1, e.to_string()),
        }
    }
    placed
}

fn safe_key(key: &str) -> String {
    let k: String = key.chars().filter(|c| c.is_ascii_alphanumeric() || *c == '-').take(64).collect();
    if k.is_empty() { "document".into() } else { k }
}

fn particulars(doc: &Document, f: &DocumentFormat) -> Particulars {
    let (flows, tables) = doc.flows_and_tables((f.figures.align, f.figures.wrap), (f.tables.align, f.tables.wrap));
    Particulars {
        title: doc.title_plain(),
        authors: doc.authors().map(|a| a.name.trim().to_owned()).collect(),
        editors: doc.editors().map(|a| a.name.trim().to_owned()).collect(),
        translators: doc.translators().map(|a| a.name.trim().to_owned()).collect(),
        date: doc.date.as_deref().map(str::trim).filter(|d| !d.is_empty()).map(str::to_owned),
        language: doc.language.clone(),
        lettered_footnotes: f.notes.kind == NoteKind::Endnotes && doc.placed_notes().contains(&NotePlace::Foot),
        flows,
        tables,
        own_kinds: doc.kinds.clone(),
    }
}

/// Whether the notes have to be placed by the filter: the format has them at
/// the end, or single ones have been set to stand there.
fn notes_are_placed(doc: &Document, f: &DocumentFormat) -> bool {
    f.notes.kind == NoteKind::Endnotes || !doc.placed_notes().is_empty()
}

fn div(id: &str, blocks: Vec<Value>) -> Value {
    json!({"t": "Div", "c": [[id, [], []], blocks]})
}

fn para_text(text: &str) -> Value {
    let v = meta_text(text);
    json!({"t": "Para", "c": v["c"]})
}

/// What a file says of itself outside its pages (ADR 0055): its title, and
/// who made it, every author with a name, whether the layout shows them on
/// the title page or not; none where it is anonymous, for review.
fn properties(doc: &Document, f: &DocumentFormat) -> after::Properties {
    after::Properties {
        title: doc.title_plain(),
        creators: if f.title.anonymous {
            Vec::new()
        } else {
            doc.authors().map(|a| a.name.trim().to_owned()).collect()
        },
    }
}

/// A block in the language of one target, as it stands.
fn raw(format: &str, text: impl Into<String>) -> Value {
    json!({"t": "RawBlock", "c": [format, text.into()]})
}

/// Blocks in a paragraph style of the reference document of Word or Writer.
fn styled(style: &str, blocks: Vec<Value>) -> Value {
    json!({"t": "Div", "c": [["", [], [["custom-style", style]]], blocks]})
}

/// The names of the authors on the title page, in one line, as the preview sets them.
fn names_of(authors: &[&Contributor]) -> String {
    authors.iter().map(|a| a.name.trim()).collect::<Vec<_>>().join(", ")
}

/// The lines under the authors on the title page: each author's
/// affiliation, e-mail and ORCID, in one line, and a line that two authors
/// share once.
fn affiliation_lines(authors: &[&Contributor]) -> Vec<String> {
    let mut lines: Vec<String> = Vec::new();
    for a in authors {
        let line = [a.affiliation.as_deref(), a.email.as_deref()]
            .into_iter()
            .flatten()
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .collect::<Vec<_>>()
            .join(", ");
        let line = match a.orcid.as_deref().map(str::trim).filter(|o| !o.is_empty()) {
            Some(o) if line.is_empty() => format!("ORCID {o}"),
            Some(o) => format!("{line}, ORCID {o}"),
            None => line,
        };
        if !line.is_empty() && !lines.contains(&line) {
            lines.push(line);
        }
    }
    lines
}

/// Names in a line, in the language of the document: *A*, *A and B*, *A, B
/// and C*; what stands between them and before the last is the language's,
/// spaces and all, as Japanese has *A・B・C* with none.
fn joined(names: &[String], language: Option<&str>) -> String {
    match names {
        [] => String::new(),
        [one] => one.clone(),
        [rest @ .., last] => {
            let between = crate::document::term(language, "document-names-between");
            let before_last = crate::document::term(language, "document-names-last");
            format!("{}{before_last}{last}", rest.join(&between))
        }
    }
}

/// The lines of the editors and the translators on the title page, in the
/// language of the document: *Edited by …*, then *Translated by …*; or
/// one, *Edited and translated by …*, where they are the same persons in
/// the same order. Nothing where there are neither.
fn role_lines(editors: &[String], translators: &[String], language: Option<&str>) -> Vec<String> {
    let line = |id: &str, names: &[String]| crate::document::term(language, id).replace("{}", &joined(names, language));
    if !editors.is_empty() && editors == translators {
        return vec![line("document-edited-and-translated-by", editors)];
    }
    let mut out = Vec::new();
    if !editors.is_empty() {
        out.push(line("document-edited-by", editors));
    }
    if !translators.is_empty() {
        out.push(line("document-translated-by", translators));
    }
    out
}

/// The persons of a title page: the authors, the lines of their
/// affiliations, and the lines of the editors and the translators.
type Persons<'a> = (&'a [&'a Contributor], &'a [String], &'a [String]);

/// The title page of a document that is not set by Typst, as the core
/// writes it where the template puts it (ADR 0055): the title, the
/// subtitle, the authors in one line, the lines of their affiliations, the
/// lines of the editors and the translators, which stand in the authors'
/// place where there are none, and the date, as the preview sets them;
/// nothing where there is nothing to say. For Word and Writer, paragraphs
/// in the styles of the reference document.
fn title_page(
    target: Target,
    title: &[Value],
    subtitle: Option<&str>,
    (authors, affiliations, roles): Persons,
    date: Option<&str>,
) -> Vec<Value> {
    if title.is_empty() && subtitle.is_none() && authors.is_empty() && roles.is_empty() && date.is_none() {
        return Vec::new();
    }
    let mut out = Vec::new();
    match target {
        Target::Docx | Target::Odt => {
            if !title.is_empty() {
                out.push(styled("Title", vec![json!({"t": "Para", "c": title})]));
            }
            if let Some(s) = subtitle {
                out.push(styled("Subtitle", vec![para_text(s)]));
            }
            if !authors.is_empty() {
                out.push(styled("Author", vec![para_text(&names_of(authors))]));
                if !affiliations.is_empty() {
                    out.push(styled("Affiliation", affiliations.iter().map(|l| para_text(l)).collect()));
                }
            }
            if !roles.is_empty() {
                out.push(styled("Role", roles.iter().map(|l| para_text(l)).collect()));
            }
            if let Some(d) = date {
                out.push(styled("Date", vec![para_text(d)]));
            }
        }
        // LaTeX's own title, set where the template puts it: the title with the subtitle under
        // it, the authors with the lines of their affiliations, the date, and `\maketitle`.
        Target::Latex | Target::PdfLatex => {
            let tex = |s: &str| json!({"t": "RawInline", "c": ["latex", s]});
            let words = |s: &str| meta_text(s)["c"].as_array().cloned().unwrap_or_default();
            let mut line: Vec<Value> = vec![tex("\\title{")];
            line.extend(title.iter().cloned());
            if let Some(s) = subtitle {
                line.push(tex("\\\\[0.35em]{\\large "));
                line.extend(words(s));
                line.push(tex("}"));
            }
            line.push(tex("}\\author{"));
            if !authors.is_empty() {
                line.extend(words(&names_of(authors)));
                for l in affiliations {
                    line.push(tex("\\\\{\\small "));
                    line.extend(words(l));
                    line.push(tex("}"));
                }
            }
            for (i, l) in roles.iter().enumerate() {
                if i > 0 || !authors.is_empty() {
                    line.push(tex("\\\\"));
                }
                line.extend(words(l));
            }
            line.push(tex("}\\date{"));
            if let Some(d) = date {
                line.extend(words(d));
            }
            line.push(tex("}\\maketitle"));
            out.push(json!({"t": "Plain", "c": line}));
        }
        // A page of the web and a book for e-readers: blocks with classes, set by the style
        // sheet as the layout's look of the title says (`front_styles`).
        Target::Html | Target::Epub => {
            let classed = |class: &str, blocks: Vec<Value>| json!({"t": "Div", "c": [["", [class], []], blocks]});
            let mut parts = Vec::new();
            if !title.is_empty() {
                parts.push(classed("gk-title", vec![json!({"t": "Para", "c": title})]));
            }
            if let Some(s) = subtitle {
                parts.push(classed("gk-subtitle", vec![para_text(s)]));
            }
            if !authors.is_empty() {
                parts.push(classed("gk-authors", vec![para_text(&names_of(authors))]));
                if !affiliations.is_empty() {
                    parts.push(classed("gk-affiliations", affiliations.iter().map(|l| para_text(l)).collect()));
                }
            }
            if !roles.is_empty() {
                parts.push(classed("gk-roles", roles.iter().map(|l| para_text(l)).collect()));
            }
            if let Some(d) = date {
                parts.push(classed("gk-date", vec![para_text(d)]));
            }
            out.push(classed("gk-front", parts));
        }
        // Markdown keeps the title as metadata at its head: it has no page to place it on.
        _ => {}
    }
    out
}

/// Where the template places a list that Pandoc makes at the head of the
/// document, the contents (`toc`) or the list of figures (`lof`) or of
/// tables (`lot`): a mark, to which it is moved after Pandoc has written the
/// document (`after::placed_lists`). Nothing where it is not moved.
fn list_mark(target: Target, name: &str) -> Option<Value> {
    let format = match target {
        Target::Docx => "openxml",
        Target::Odt => "opendocument",
        Target::Html => "html",
        _ => return None,
    };
    Some(raw(format, format!("<!--gk:{name}-->")))
}

struct Prepared {
    json: Value,
    bibliography: Bibliography,
    has_citations: bool,
    /// What there is to say of the document that was prepared.
    remarks: Vec<String>,
    /// The lists the template asks for, which Pandoc makes where its
    /// pattern has them: the contents, the figures, the tables.
    toc: bool,
    lof: bool,
    lot: bool,
}

/// One thing of the order of a document: a part the core makes, or an
/// element of a kind.
enum Item<'a> {
    Made(GeneratedPart),
    Part(&'a Part),
}

/// The order of a document, as the template's contents say. A kind item
/// stands for every element of that kind, in tree order; of a kind a
/// document has one of, the first is used and the rest passed over. A part
/// of a kind the template does not list is printed by its place, after what
/// is listed there: a front kind before the body, a back kind at the end,
/// and one of place `here` with the back matter, since where it stood among
/// its siblings is not known here. A kind of place `cover` is printed only
/// by a cover output, and one of place `none` nowhere. A template that does
/// not list the body has it after what it lists, so that the text is never
/// lost; a part the template lists twice is printed once.
fn order<'a>(template: &Template, parts: &'a [Part]) -> Vec<Item<'a>> {
    let mut seen: Vec<&str> = Vec::new();
    let usable: Vec<&'a Part> = parts
        .iter()
        .filter(|p| {
            if one_of(&p.kind) {
                if seen.contains(&p.kind.as_str()) {
                    return false;
                }
                seen.push(&p.kind);
            }
            true
        })
        .collect();
    let mut out: Vec<Item<'a>> = Vec::new();
    let mut made: Vec<GeneratedPart> = Vec::new();
    let mut placed: Vec<usize> = Vec::new();
    for item in &template.contents {
        match item {
            ContentsItem::Part { part } => {
                if !made.contains(part) {
                    made.push(*part);
                    out.push(Item::Made(*part));
                }
            }
            ContentsItem::Kind { kind } => {
                for (i, p) in usable.iter().enumerate() {
                    if p.kind == *kind && !placed.contains(&i) {
                        placed.push(i);
                        out.push(Item::Part(p));
                    }
                }
            }
        }
    }
    let rest = |place: PartPlace| -> Vec<Item<'a>> {
        usable
            .iter()
            .enumerate()
            .filter(|(i, p)| !placed.contains(i) && place_of(&p.kind) == place)
            .map(|(_, p)| Item::Part(p))
            .collect()
    };
    let front = rest(PartPlace::Front);
    let mut back = rest(PartPlace::Here);
    back.extend(rest(PartPlace::Back));
    let at = out.iter().position(|i| matches!(i, Item::Made(GeneratedPart::Body))).unwrap_or(out.len());
    let n = front.len();
    out.splice(at..at, front);
    if !made.contains(&GeneratedPart::Body) {
        out.insert(at + n, Item::Made(GeneratedPart::Body));
    }
    out.extend(back);
    out
}

/// The letter of the n-th lettered part: A, B, … Z, AA, BB.
fn letter_of(n: u32) -> String {
    let n = n.max(1) - 1;
    let letter = (b'A' + (n % 26) as u8) as char;
    std::iter::repeat_n(letter, (n / 26 + 1) as usize).collect()
}

/// A part as sections, handed to the converter: its own text (the sections
/// at level 0) under a heading of the element's name at level 1, which the
/// kind's look may leave out, and its children a level deeper. Appendices
/// and their like are lettered in the order they are printed.
fn part_sections(converter: &Converter, part: &Part, letters: &mut u32) -> Vec<Section> {
    let look = converter.extras.parts.get(&part.kind).map(|i| &i.look);
    let mut title = part.title.clone();
    if look.is_some_and(|l| l.lettered && l.heading) && !crate::document::plain(&title).is_empty() {
        *letters += 1;
        title.insert(0, Inline::Text { text: format!("{} ", letter_of(*letters)), marks: Default::default() });
    }
    let own: Vec<Block> =
        part.sections.iter().filter(|s| s.level == 0).flat_map(|s| s.blocks.iter().cloned()).collect();
    let head = Section {
        level: 1,
        heading: Some(title),
        blocks: own,
        element: part.element.clone(),
        kind: Some(part.kind.clone()),
    };
    let mut out = vec![head];
    out.extend(
        part.sections.iter().filter(|s| s.level > 0).map(|s| Section { level: s.level.saturating_add(1), ..s.clone() }),
    );
    out
}

/// The stretches of the elements that have a look of their own, as the
/// sections are written (ADR 0059): an element's stretch is its section
/// and the deeper ones after it. A stack, since a chapter within a part
/// may have a look within the part's.
struct Stretches<'a> {
    looks: std::collections::HashMap<&'a str, &'a DocumentFormat>,
    base: &'a DocumentFormat,
    stack: Vec<(u8, &'a DocumentFormat)>,
}

impl<'a> Stretches<'a> {
    fn new(doc: &'a Document, base: &'a DocumentFormat) -> Self {
        let looks = doc.looks.iter().map(|l| (l.element.as_str(), &l.format)).collect();
        Stretches { looks, base, stack: Vec::new() }
    }

    fn current(&self) -> &'a DocumentFormat {
        self.stack.last().map(|(_, f)| *f).unwrap_or(self.base)
    }

    /// Where a section begins: the look it leaves, the look it comes to, and
    /// whether it is the beginning of a stretch; nothing where the look
    /// stays.
    fn before(&mut self, section: &Section) -> Option<(&'a DocumentFormat, &'a DocumentFormat, bool)> {
        let from = self.current();
        while self.stack.last().is_some_and(|(level, _)| *level >= section.level) {
            self.stack.pop();
        }
        let own = section.element.as_deref().and_then(|e| self.looks.get(e).copied());
        if let Some(f) = own {
            self.stack.push((section.level, f));
        }
        let to = self.current();
        (!std::ptr::eq(from, to) || own.is_some()).then_some((from, to, own.is_some()))
    }

    /// Where a run of sections ends: back to the document's look.
    fn end(&mut self) -> Option<(&'a DocumentFormat, &'a DocumentFormat)> {
        let from = self.current();
        self.stack.clear();
        (!std::ptr::eq(from, self.base)).then_some((from, self.base))
    }
}

/// What a target writes where the look changes between two stretches (ADR
/// 0059): in Typst, the rules of the look it comes to, and a new page where
/// the pages differ; in LaTeX, its page, type and paragraphs; in Word and
/// Writer, a new section or master page where their pages differ. The web
/// page and the e-book have no pages, and follow nothing of it.
fn look_switch(
    target: Target,
    from: &DocumentFormat,
    to: &DocumentFormat,
    entering: bool,
    p: &Particulars,
) -> Vec<Value> {
    match target {
        Target::Pdf | Target::Typst => vec![raw("typst", typst::switch(from, to, p, entering))],
        // LaTeX: the page, the type and the paragraphs of the look it comes to.
        Target::Latex | Target::PdfLatex => vec![raw("latex", latex::switch(from, to, entering))],
        // Word and Writer follow the pages, where what they can say of them
        // differs or the count begins anew: Word begins a section, Writer a
        // page of the look's master page. Neither can set one stretch in
        // other type: their styles are the document's.
        Target::Docx => {
            let restart = entering && to.page.restart;
            let differs = reference::docx_section_mark(from, false) != reference::docx_section_mark(to, false);
            if differs || restart {
                vec![raw("openxml", reference::docx_section_mark(to, restart))]
            } else {
                Vec::new()
            }
        }
        Target::Odt => {
            let restart = entering && to.page.restart;
            let differs = reference::odt_look_name(from, p) != reference::odt_look_name(to, p);
            if differs || restart {
                vec![raw("opendocument", reference::odt_look_mark(to, p, restart))]
            } else {
                Vec::new()
            }
        }
        _ => Vec::new(),
    }
}

/// Writes a run of sections, with the looks of the elements among them.
fn write_sections(
    converter: &Converter,
    sections: &[Section],
    stretches: &mut Stretches,
    target: Target,
    p: &Particulars,
    out: &mut Vec<Value>,
) {
    for s in sections {
        if let Some((from, to, entering)) = stretches.before(s) {
            out.extend(look_switch(target, from, to, entering, p));
        }
        converter.section(s, out);
    }
    if let Some((from, to)) = stretches.end() {
        out.extend(look_switch(target, from, to, false, p));
    }
}

/// An outline of Typst: the contents, or the figures or the tables.
fn outline(title: &str, target: Option<&str>) -> Value {
    let title = crate::document::pandoc::typst_text(title.trim());
    let target = target.map(|t| format!(", target: {t}")).unwrap_or_default();
    json!({"t": "RawBlock", "c": ["typst", format!("#outline(title: [{title}], indent: auto{target})")]})
}

/// The metadata that Pandoc reads from the identifiers of a document, by
/// their names: `isbn`, `doi`, `publisher`, `edition`, `place`, and the
/// like. For a book of EPUB, an ISBN or a DOI is also the identifier of the
/// book, with its scheme. Names that the document's own metadata uses are
/// not overwritten.
fn identifier_meta(meta: &mut Map<String, Value>, doc: &Document, target: Target) {
    const TAKEN: [&str; 12] = [
        "title",
        "subtitle",
        "author",
        "date",
        "abstract",
        "abstract-title",
        "keywords",
        "lang",
        "toc-title",
        "bibliography",
        "csl",
        "identifier",
    ];
    for (name, value) in &doc.identifiers {
        let name: String = name
            .trim()
            .chars()
            .map(|c| c.to_ascii_lowercase())
            .filter(|c| c.is_ascii_alphanumeric() || *c == '-')
            .take(40)
            .collect();
        let value = value.trim();
        if name.is_empty() || value.is_empty() || TAKEN.contains(&name.as_str()) || name.starts_with("gk-") {
            continue;
        }
        if target == Target::Epub {
            let scheme = match name.as_str() {
                "isbn" if value.chars().filter(char::is_ascii_digit).count() == 10 => Some("ISBN-10"),
                "isbn" => Some("ISBN-13"),
                "doi" => Some("DOI"),
                _ => None,
            };
            if let Some(scheme) = scheme
                && !meta.contains_key("identifier")
            {
                meta.insert(
                    "identifier".into(),
                    json!({"t": "MetaMap", "c": {"text": meta_text(value), "scheme": meta_text(scheme)}}),
                );
            }
        }
        meta.insert(name, meta_text(value));
    }
}

/// Makes the document that Pandoc reads: the parts in the order the
/// template says (ADR 0038), the body among them, and the bibliography
/// where it is listed.
fn prepare(ctx: &Context, request: &Request, target: Target, keep_citations: bool, placed: Placed) -> Result<Prepared> {
    request.check_output()?;
    // Where a citation stands beside punctuation is the style's to say
    // (`document/beside.rs`): after it in a style of notes, before it
    // otherwise. Where the citations are kept as they are, for another
    // program to set, they stand as they were written.
    let mut document = request.document.clone();
    if !keep_citations {
        let notes = ctx.styles.get(&request.style).is_ok_and(|s| s.kind == "note");
        crate::document::beside::place_citations(&mut document, notes);
    }
    let doc = &document;
    let f = &request.format;
    let not_placed = placed.remark();
    let bibliography = gather(doc, ctx.library);
    let has_citations = !bibliography.keys.is_empty();
    let style_has_bibliography =
        ctx.styles.get(&request.style).map(|s| s.bibliography).unwrap_or(true) || keep_citations;

    let mut converter = Converter {
        keys: &bibliography.keys,
        language: doc.language.as_deref(),
        run_in: f
            .headings
            .levels
            .iter()
            .enumerate()
            .filter(|(_, l)| l.run_in)
            .map(|(i, l)| crate::document::pandoc::RunIn { level: i as u8 + 1, bold: l.bold, italic: l.italic })
            .collect(),
        begins: target.page_begins(f),
        page_break: target.page_break(),
        deepest: f.headings.levels.len().clamp(1, 6) as u8,
        extras: Extras::new(
            match target {
                Target::Pdf | Target::Typst => Flavour::Typst,
                Target::Latex | Target::PdfLatex => Flavour::Latex,
                Target::Docx => Flavour::Docx,
                Target::Odt => Flavour::Odt,
                Target::Markdown | Target::Html | Target::Epub => Flavour::Plain,
            },
            f.figures.clone(),
            f.tables.clone(),
            f.equations.clone(),
            placed.name,
            placed.present,
        ),
    };
    converter.extras.first_indented = f.text.indent_first;
    converter.extras.flows = particulars(doc, f).flows;
    converter.extras.text_width =
        f64::from(f.page.dimensions().0 - f.page.margin_left.points() - f.page.margin_right.points()).max(72.0);
    // The numbers of the headings: the core writes them where the levels are
    // numbered otherwise than 1, 1.1, 1.1.1, which Typst does itself and
    // the others are asked to (ADR 0058).
    converter.extras.numbering = f.headings.resolved_numbering();
    converter.extras.written_numbers = !matches!(target, Target::Pdf | Target::Typst) && !f.headings.plain_numbering();
    converter.extras.targets = converter.targets(doc, &converter.extras.numbering);
    converter.extras.kinds = crate::formats::kinds::table(f, &doc.kinds);
    converter.extras.parts = crate::templates::kinds::table(f);
    converter.extras.italics_underlined = f.text.italics == crate::formats::Italics::Underline;
    converter.extras.refmarks = f.text.refmarks;
    converter.extras.verse = f.verse.clone();
    converter.extras.step = f.text.indent_step;
    converter.extras.classes = matches!(target, Target::Html | Target::Epub);
    converter.extras.columns = f.page.columns;

    let mut meta = Map::new();
    if let Some(lang) = doc.language.as_deref().filter(|l| !l.trim().is_empty()) {
        meta.insert("lang".into(), meta_string(lang.trim()));
    }
    meta.insert("gk-notes-title".into(), meta_string(&f.notes.title));
    meta.insert(
        "gk-notes-kind".into(),
        meta_string(if f.notes.kind == NoteKind::Endnotes { "endnotes" } else { "footnotes" }),
    );

    let title = converter.inlines(&doc.title);
    let authors: Vec<&Contributor> =
        if f.title.anonymous || !f.title.show_authors { Vec::new() } else { doc.authors().collect() };
    // The editors and the translators on the title page: in lines of their
    // own after the authors, in the language of the document.
    let named = |role| doc.in_role(role).map(|c| c.name.trim().to_owned()).collect::<Vec<_>>();
    let (editors, translators) = if f.title.anonymous || !f.title.show_roles {
        (Vec::new(), Vec::new())
    } else {
        (named(Role::Editor), named(Role::Translator))
    };
    let roles = role_lines(&editors, &translators, doc.language.as_deref());
    let keywords: Vec<&str> = doc.keywords.iter().map(|k| k.trim()).filter(|k| !k.is_empty()).collect();
    let date = doc.date.as_deref().map(str::trim).filter(|d| !d.is_empty() && f.title.show_date);
    let keywords_para = (!keywords.is_empty() && f.title.show_abstract).then(|| {
        let mut inlines = vec![json!({"t": "Strong", "c": meta_text(&format!("{}:", f.title.keywords_label))["c"]})];
        inlines.push(json!({"t": "Space"}));
        inlines.extend(meta_text(&keywords.join(", "))["c"].as_array().cloned().unwrap_or_default());
        json!({"t": "Para", "c": inlines})
    });
    // The abstract is the element of that kind: its blocks, set as the
    // format sets the abstract, under the format's label.
    let abstract_blocks: Option<Vec<Value>> = doc
        .parts
        .iter()
        .find(|p| p.kind == "abstract")
        .filter(|_| f.title.show_abstract)
        .map(|p| {
            let mut out = Vec::new();
            converter.blocks(&p.blocks(), &mut out);
            out
        })
        .filter(|b| !b.is_empty());
    let typst = matches!(target, Target::Pdf | Target::Typst);
    let latex = matches!(target, Target::Latex | Target::PdfLatex);
    let words = |id: &str| crate::document::term(doc.language.as_deref(), id);

    // The title block of Typst: blocks with labels, gathered in one block
    // that the preamble sets on a page of its own or at the top. The
    // abstract and the keywords go into it where they follow the title
    // page, as they did before the parts were the writer's.
    let mut front: Vec<Value> = Vec::new();
    let mut blocks: Vec<Value> = Vec::new();
    // In every other document what stands with the title page is gathered so
    // too, and ends with a page break where the title has a page of its own,
    // after the abstract and the keywords that follow it, as in the preview.
    let own_page = f.title.placement == TitlePlacement::OwnPage;
    let mut titled = false;
    let flush = |front: &mut Vec<Value>, blocks: &mut Vec<Value>, titled: &mut bool| {
        if !front.is_empty() {
            if typst {
                blocks.push(div("gk-front", std::mem::take(front)));
            } else {
                blocks.append(front);
                if *titled
                    && own_page
                    && let Some(b) = target.page_break()
                {
                    blocks.push(b);
                }
            }
        }
        *titled = false;
    };
    let (mut toc, mut lof, mut lot) = (false, false, false);
    // The looks of the elements that have their own, and what their rules are made with.
    let mut stretches = Stretches::new(doc, f);
    let looked = particulars(doc, f);
    let mut letters = 0u32;
    let mut bibliography_placed = false;
    let wants_bibliography = has_citations && style_has_bibliography && !keep_citations;
    let bibliography_blocks = |blocks: &mut Vec<Value>| {
        if f.bibliography.new_page
            && let Some(b) = target.page_break()
        {
            blocks.push(b);
        }
        if !f.bibliography.title.trim().is_empty() {
            blocks.push(json!({
                "t": "Header",
                "c": [1, ["bibliography", ["unnumbered"], []], meta_text(f.bibliography.title.trim())["c"]],
            }));
        }
        blocks.push(div("refs", vec![]));
    };
    for item in order(&request.template, &doc.parts) {
        match item {
            Item::Made(GeneratedPart::HalfTitle) => {
                flush(&mut front, &mut blocks, &mut titled);
                if !title.is_empty() {
                    let para = json!({"t": "Para", "c": title.clone()});
                    if typst {
                        blocks.push(div("gk-half-title", vec![para]));
                    } else {
                        blocks.push(
                            json!({"t": "Div", "c": [["", ["gk-half-title"], [["custom-style", "Title"]]], [para]]}),
                        );
                        blocks.extend(target.page_break());
                    }
                }
            }
            Item::Made(GeneratedPart::TitlePage) => {
                let subtitle = doc.subtitle.as_deref().map(str::trim).filter(|s| !s.is_empty());
                let affiliations = if f.title.show_affiliations { affiliation_lines(&authors) } else { Vec::new() };
                if !typst {
                    // The title page where the template puts it, and nowhere where it puts none, as the
                    // preview has it: Pandoc is given no title to set a block of its own from (ADR 0055).
                    let page = title_page(target, &title, subtitle, (&authors, &affiliations, &roles), date);
                    titled |= !page.is_empty();
                    front.extend(page);
                    continue;
                }
                let mut parts: Vec<Value> = Vec::new();
                if !title.is_empty() {
                    parts.push(div("gk-title", vec![json!({"t": "Para", "c": title.clone()})]));
                }
                if let Some(s) = subtitle {
                    parts.push(div("gk-subtitle", vec![para_text(s)]));
                }
                if !authors.is_empty() {
                    parts.push(div("gk-authors", vec![para_text(&names_of(&authors))]));
                    if !affiliations.is_empty() {
                        parts.push(div("gk-affiliations", affiliations.iter().map(|l| para_text(l)).collect()));
                    }
                }
                if !roles.is_empty() {
                    parts.push(div("gk-roles", roles.iter().map(|l| para_text(l)).collect()));
                }
                if let Some(d) = date {
                    parts.push(div("gk-date", vec![para_text(d)]));
                }
                front.extend(parts);
            }
            Item::Made(GeneratedPart::Keywords) => {
                let Some(k) = &keywords_para else { continue };
                if typst {
                    front.push(div("gk-keywords", vec![k.clone()]));
                } else {
                    front.push(k.clone());
                }
            }
            // The lists: in Typst outlines where they are listed; elsewhere
            // Pandoc makes them, and places them where its pattern has them,
            // after the title block, whatever the template's order says.
            // Elsewhere where the template places them too (ADR 0055): LaTeX is
            // given its commands there; Pandoc makes them for Word, Writer and the
            // web at the head, whence they are moved to the mark left here
            // (`after::placed_lists`).
            Item::Made(GeneratedPart::Contents) => {
                flush(&mut front, &mut blocks, &mut titled);
                let named = words("document-contents");
                if typst {
                    blocks.push(outline(&named, None));
                } else if latex {
                    blocks.push(raw(
                        "latex",
                        format!(
                            "\\renewcommand*\\contentsname{{{}}}{{\\setcounter{{tocdepth}}{{3}}\\tableofcontents}}",
                            latex::escape(&named)
                        ),
                    ));
                } else {
                    toc = true;
                    meta.insert("toc-title".into(), meta_text(&named));
                    blocks.extend(list_mark(target, "toc"));
                }
            }
            Item::Made(GeneratedPart::ListOfFigures) => {
                flush(&mut front, &mut blocks, &mut titled);
                if typst {
                    blocks.push(outline(&f.figures.end_title, Some("figure.where(kind: image)")));
                } else if latex {
                    blocks.push(raw(
                        "latex",
                        format!(
                            "\\renewcommand*\\listfigurename{{{}}}\\listoffigures",
                            latex::escape(&f.figures.end_title)
                        ),
                    ));
                } else {
                    lof = true;
                    blocks.extend(list_mark(target, "lof"));
                }
            }
            Item::Made(GeneratedPart::ListOfTables) => {
                flush(&mut front, &mut blocks, &mut titled);
                if typst {
                    blocks.push(outline(&f.tables.end_title, Some("figure.where(kind: table)")));
                } else if latex {
                    blocks.push(raw(
                        "latex",
                        format!(
                            "\\renewcommand*\\listtablename{{{}}}\\listoftables",
                            latex::escape(&f.tables.end_title)
                        ),
                    ));
                } else {
                    lot = true;
                    blocks.extend(list_mark(target, "lot"));
                }
            }
            Item::Made(GeneratedPart::Body) => {
                flush(&mut front, &mut blocks, &mut titled);
                // In LaTeX the columns are an environment around the body.
                let columns = crate::export::latex::columns_around(f)
                    .filter(|_| matches!(target, Target::Latex | Target::PdfLatex));
                if let Some((open, _)) = &columns {
                    blocks.push(json!({"t": "RawBlock", "c": ["latex", open]}));
                }
                write_sections(&converter, &doc.sections, &mut stretches, target, &looked, &mut blocks);
                if let Some((_, close)) = &columns {
                    blocks.push(json!({"t": "RawBlock", "c": ["latex", close]}));
                }
            }
            // The notes are placed by the filter (`resources/pandoc/notes.lua`),
            // before the bibliography or at the end, as before: the item
            // has no place of its own in this piece.
            Item::Made(GeneratedPart::Notes) => flush(&mut front, &mut blocks, &mut titled),
            Item::Made(GeneratedPart::Bibliography) => {
                flush(&mut front, &mut blocks, &mut titled);
                if wants_bibliography {
                    bibliography_blocks(&mut blocks);
                }
                bibliography_placed = true;
            }
            Item::Part(p) if p.kind == "abstract" => {
                let Some(a) = &abstract_blocks else { continue };
                if typst {
                    front.push(div("gk-abstract-title", vec![para_text(&f.title.abstract_label)]));
                    front.push(div("gk-abstract", a.clone()));
                } else if matches!(target, Target::Docx | Target::Odt) {
                    // In its place, as paragraphs with the styles the reference document defines, where
                    // the template puts it: not as metadata, which Pandoc sets at the head (ADR 0055).
                    front.push(styled("AbstractTitle", vec![para_text(&f.title.abstract_label)]));
                    front.push(styled("Abstract", a.clone()));
                } else if latex {
                    // The environment of the class, under the layout's label.
                    front.push(raw(
                        "latex",
                        format!(
                            "\\renewcommand*\\abstractname{{{}}}\\begin{{abstract}}",
                            latex::escape(&f.title.abstract_label)
                        ),
                    ));
                    front.extend(a.iter().cloned());
                    front.push(raw("latex", "\\end{abstract}"));
                } else if matches!(target, Target::Html | Target::Epub) {
                    let mut inner = vec![
                        json!({"t": "Div", "c": [["", ["abstract-title"], []], [para_text(&f.title.abstract_label)]]}),
                    ];
                    inner.extend(a.iter().cloned());
                    front.push(json!({"t": "Div", "c": [["", ["abstract"], []], inner]}));
                } else {
                    meta.insert("abstract".into(), json!({"t": "MetaBlocks", "c": a}));
                    meta.insert("abstract-title".into(), meta_text(&f.title.abstract_label));
                }
            }
            Item::Part(p) => {
                flush(&mut front, &mut blocks, &mut titled);
                let sections = part_sections(&converter, p, &mut letters);
                write_sections(&converter, &sections, &mut stretches, target, &looked, &mut blocks);
            }
        }
    }
    flush(&mut front, &mut blocks, &mut titled);
    // The bibliography is never lost: where the template has no place for it, it stands at the end.
    if wants_bibliography && !bibliography_placed {
        bibliography_blocks(&mut blocks);
    }

    // The title, the subtitle, the authors and the date as metadata only where
    // the core writes no title page of its own: elsewhere a writer of Pandoc's
    // would set a title block of its own from them, at the head, whatever the
    // template says (ADR 0055). Word and Writer have them in their properties,
    // written after (`after::Properties`).
    let title_as_meta = matches!(target, Target::Markdown | Target::Epub);
    // What a page of the web says of itself in its head: its title, its authors, its date.
    if target == Target::Html {
        let p = properties(doc, f);
        if !p.title.is_empty() {
            meta.insert("pagetitle".into(), meta_text(&p.title));
        }
        if !p.creators.is_empty() {
            meta.insert("author-meta".into(), meta_list(p.creators.iter().map(|c| meta_text(c)).collect()));
        }
        if let Some(d) = doc.date.as_deref().map(str::trim).filter(|d| !d.is_empty()) {
            meta.insert("date-meta".into(), meta_text(d));
        }
    }
    // What the PDF says of itself, from the variables that set `\hypersetup` and nothing on a page.
    if latex {
        let p = properties(doc, f);
        if !p.title.is_empty() {
            meta.insert("title-meta".into(), meta_text(&p.title));
        }
        if !p.creators.is_empty() {
            meta.insert("author-meta".into(), meta_list(p.creators.iter().map(|c| meta_text(c)).collect()));
        }
    }
    if title_as_meta {
        if !title.is_empty() {
            meta.insert("title".into(), meta_inlines(title));
        }
        if let Some(s) = doc.subtitle.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
            meta.insert("subtitle".into(), meta_text(s));
        }
        // The e-book's are its properties, in its package, printed nowhere: every author with a
        // name, unless anonymous, and the date the document has. Markdown's stand at its head
        // as its title block, as the page shows them.
        let names: Vec<String> = if target == Target::Epub {
            properties(doc, f).creators
        } else {
            authors.iter().map(|a| a.name.trim().to_owned()).collect()
        };
        if !names.is_empty() {
            meta.insert("author".into(), meta_list(names.iter().map(|n| meta_text(n)).collect()));
        }
        // The editors and the translators: the e-book's in its package, each
        // with the role the package names them by, unless anonymous; those at
        // the head of Markdown as the page shows them.
        if target == Target::Epub {
            if !f.title.anonymous {
                let roles = doc.editors().map(|c| (c, "edt")).chain(doc.translators().map(|c| (c, "trl")));
                let list: Vec<Value> = roles
                    .map(|(c, role)| {
                        json!({"t": "MetaMap", "c": {"text": meta_text(c.name.trim()), "role": meta_string(role)}})
                    })
                    .collect();
                if !list.is_empty() {
                    meta.insert("contributor".into(), meta_list(list));
                }
            }
        } else {
            for (key, list) in [("editor", &editors), ("translator", &translators)] {
                if !list.is_empty() {
                    meta.insert(key.into(), meta_list(list.iter().map(|n| meta_text(n)).collect()));
                }
            }
        }
        let day =
            if target == Target::Epub { doc.date.as_deref().map(str::trim).filter(|d| !d.is_empty()) } else { date };
        if let Some(d) = day {
            meta.insert("date".into(), meta_text(d));
        }
    }
    // The editors and the translators of a file of Word or Writer, in its
    // properties, unless anonymous: Pandoc writes what it is given and does
    // not know of as properties of the file's own, custom properties in
    // Word and user-defined ones in Writer, and sets nothing of it on a page.
    if matches!(target, Target::Docx | Target::Odt) && !f.title.anonymous {
        for (key, list) in [("editor", &looked.editors), ("translator", &looked.translators)] {
            if !list.is_empty() {
                meta.insert(key.into(), meta_text(&list.join("; ")));
            }
        }
    }
    if !typst {
        if !keywords.is_empty() {
            meta.insert("keywords".into(), meta_list(keywords.iter().map(|k| meta_text(k)).collect()));
        }
        // The identifiers, for the formats that carry metadata. Typst's
        // `#set document` has no field for them.
        identifier_meta(&mut meta, doc, target);
    }

    let mut json = json!({ "pandoc-api-version": ctx.tools.pandoc_api, "meta": meta, "blocks": blocks });
    let blocks = json["blocks"].as_array_mut().expect("a document has blocks");

    // The figures, where the format has them at the end.
    let held = converter.extras.held();
    if !held.is_empty() {
        if let Some(b) = target.page_break() {
            blocks.push(b);
        }
        if !f.figures.end_title.trim().is_empty() {
            blocks.push(json!({
                "t": "Header",
                "c": [1, ["figures", ["unnumbered"], []], meta_text(f.figures.end_title.trim())["c"]],
            }));
        }
        blocks.extend(held);
    }
    // And the tables.
    let held = converter.extras.held_tables();
    if !held.is_empty() {
        if let Some(b) = target.page_break() {
            blocks.push(b);
        }
        if !f.tables.end_title.trim().is_empty() {
            blocks.push(json!({
                "t": "Header",
                "c": [1, ["tables", ["unnumbered"], []], meta_text(f.tables.end_title.trim())["c"]],
            }));
        }
        blocks.extend(held);
    }
    let remarks: Vec<String> = not_placed
        .into_iter()
        .chain(converter.extras.absent().into_iter().map(|name| tr!("core-export-picture-missing", name = name)))
        .chain(match converter.extras.astray() {
            0 => None,
            n => Some(tr!("core-export-astray", count = n)),
        })
        .collect();

    Ok(Prepared { json, bibliography, has_citations, remarks, toc, lof, lot })
}

/// The arguments for Pandoc that are the same for every target.
fn arguments(
    ctx: &Context,
    request: &Request,
    target: Target,
    prepared: &Prepared,
    bib: &Path,
    keep_citations: bool,
) -> Result<Vec<String>> {
    let mut args: Vec<String> =
        vec!["-f".into(), "json".into(), "-t".into(), target.pandoc().into(), "--wrap=none".into()];
    if prepared.has_citations && !keep_citations {
        let style = ctx.styles.path_or_default(&request.style)?;
        args.push("--citeproc".into());
        args.push("--csl".into());
        args.push(style.display().to_string());
        args.push("--bibliography".into());
        args.push(bib.display().to_string());
    }
    let filters = ctx.resources.join("pandoc");
    if notes_are_placed(&request.document, &request.format) {
        args.push("--lua-filter".into());
        args.push(filters.join("notes.lua").display().to_string());
    }
    if matches!(target, Target::Docx | Target::Odt) {
        args.push("--lua-filter".into());
        args.push(filters.join("styles.lua").display().to_string());
    }
    if matches!(target, Target::Latex | Target::PdfLatex) {
        args.push("--lua-filter".into());
        args.push(filters.join("tables.lua").display().to_string());
    }
    if request.format.headings.plain_numbering()
        && !matches!(target, Target::Pdf | Target::Typst | Target::Latex | Target::PdfLatex)
    {
        args.push("--number-sections".into());
    }
    // The lists, where Pandoc makes them: not in Typst, where they are
    // written as outlines. The lists of figures and tables came with
    // Pandoc 3.1.11.
    if !matches!(target, Target::Pdf | Target::Typst) {
        if prepared.toc {
            args.push("--toc".into());
        }
        let has_lists = ctx.tools.pandoc.as_ref().is_some_and(|p| !tools::older(&p.version, "3.1.11"));
        if prepared.lof && has_lists {
            args.push("--list-of-figures".into());
        }
        if prepared.lot && has_lists {
            args.push("--list-of-tables".into());
        }
    }
    Ok(args)
}

fn warnings_of(messages: &str) -> Vec<String> {
    messages
        .lines()
        .map(str::trim)
        .filter(|l| !l.is_empty())
        .map(|l| l.trim_start_matches("[WARNING]").trim().to_owned())
        // What is said of fonts is told in another way.
        .filter(|l| !l.to_lowercase().contains("unknown font family"))
        .collect()
}

fn work_dir(ctx: &Context, key: &str, what: &str) -> Result<PathBuf> {
    let dir = ctx.work.join(safe_key(key)).join(what);
    fs::create_dir_all(&dir).context(|| tr!("io-creating", path = &dir))?;
    Ok(dir)
}

/// The name of the directory for the files of the figures: `files` where
/// the document is made here, and a name after the document where they go
/// beside one that is given away as it is written.
fn files_name(target: Target, path: Option<&Path>) -> String {
    match (target, path) {
        (Target::Typst | Target::Latex | Target::Markdown, Some(path)) => {
            let stem = path.file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_default();
            let stem: String =
                stem.chars().map(|c| if c.is_alphanumeric() || c == '-' || c == '_' { c } else { '-' }).collect();
            if stem.is_empty() { "files".into() } else { format!("{stem}-files") }
        }
        _ => "files".into(),
    }
}

/// The files of the figures, put beside a document that names them.
fn files_beside(ctx: &Context, request: &Request, path: &Path, name: &str, exported: &mut Exported) {
    let Some(parent) = path.parent() else { return };
    let placed = place_files(ctx, request, parent, name, false);
    if !placed.present.is_empty() {
        exported.also.push(parent.join(name).display().to_string());
    }
    exported.warnings.extend(placed.remark());
}

/// The document as Typst, whole.
fn typst_source(
    ctx: &Context,
    request: &Request,
    dir: &Path,
    files: &str,
    light: bool,
) -> Result<(String, Prepared, Vec<String>)> {
    let pandoc = ctx.tools.pandoc()?;
    let began = std::time::Instant::now();
    let placed = place_files(ctx, request, dir, files, light);
    let prepared = prepare(ctx, request, Target::Typst, false, placed)?;
    let bib = dir.join("references.bib");
    write_atomic(&bib, prepared.bibliography.text.as_bytes())?;
    let args = arguments(ctx, request, Target::Typst, &prepared, &bib, false)?;
    let input = serde_json::to_vec(&prepared.json)?;
    let readied = began.elapsed();
    let out = tools::run(&pandoc.path, "Pandoc", &args, Some(&input), Some(dir))?;
    tracing::debug!(
        readied = ?readied,
        pandoc = ?(began.elapsed() - readied),
        given = input.len(),
        "the document as Typst"
    );
    let body = String::from_utf8_lossy(&out.stdout).into_owned();
    let mut source = preamble(&request.format, &particulars(&request.document, &request.format));
    source.push_str(&body);
    let mut warnings = prepared.remarks.clone();
    warnings.extend(warnings_of(&out.messages));
    Ok((source, prepared, warnings))
}

/// All the pages of a document. For a document of many pages, see
/// [`preview_ready`], [`preview_made`] and [`preview_pages`], which give the
/// pages that are asked for and can be stopped.
pub fn preview(ctx: &Context, request: &Request) -> Result<Preview> {
    let readied = preview_ready(ctx, request)?;
    preview_made(ctx, request, readied, &[], &AtomicBool::new(false))
}

/// What the making of the pages needs of the library and of the pictures,
/// gathered at once, so that the library need not be held while the pages
/// are made, which takes long of a long document.
pub struct Readied {
    dir: PathBuf,
    prepared: Prepared,
    args: Vec<String>,
    input: Vec<u8>,
}

/// The first part of making the pages: what is cited is looked up, the
/// pictures are put where they are found, and the document is written as
/// Pandoc reads it.
pub fn preview_ready(ctx: &Context, request: &Request) -> Result<Readied> {
    ctx.tools.pandoc()?;
    let began = std::time::Instant::now();
    let dir = work_dir(ctx, &request.key, "preview")?;
    let placed = place_files(ctx, request, &dir, "files", true);
    let prepared = prepare(ctx, request, Target::Typst, false, placed)?;
    let bib = dir.join("references.bib");
    write_atomic(&bib, prepared.bibliography.text.as_bytes())?;
    let args = arguments(ctx, request, Target::Typst, &prepared, &bib, false)?;
    let input = serde_json::to_vec(&prepared.json)?;
    tracing::debug!(took = ?began.elapsed(), given = input.len(), "the document is readied for the preview");
    Ok(Readied { dir, prepared, args, input })
}

/// The second part: Pandoc writes the document as Typst, and Typst sets the
/// pages, of which those that are wanted are given; all of them where none
/// is named. The library is not needed for it. It ends when `stop` is set,
/// with an error of the kind [`tools::STOPPED`].
pub fn preview_made(
    ctx: &Context,
    request: &Request,
    readied: Readied,
    wanted: &[u32],
    stop: &AtomicBool,
) -> Result<Preview> {
    let pandoc = ctx.tools.pandoc()?;
    let Readied { dir, prepared, args, input } = readied;
    let began = std::time::Instant::now();
    let out = tools::run_until(&pandoc.path, "Pandoc", &args, Some(&input), Some(&dir), stop)?;
    let written = began.elapsed();
    let mut source = preamble(&request.format, &particulars(&request.document, &request.format));
    source.push_str(&String::from_utf8_lossy(&out.stdout));
    let mut warnings = prepared.remarks.clone();
    warnings.extend(warnings_of(&out.messages));
    write_atomic(&dir.join("document.typ"), source.as_bytes())?;

    let set = set_for_preview(&dir, stop)?;
    warnings.extend(set.warnings);
    let (count, pages) = pages_from(&set.document, wanted);
    let places = typeset::places(&set.document);
    // The text stands between the margins the opening of the document sets on
    // every page; in them, the header and the footer, where the layout shows
    // them (ADRs 0056 and 0057).
    let f = &request.format;
    let margins = typeset::Margins {
        top: f.page.margin_top.points(),
        bottom: f.page.margin_bottom.points(),
        head: f.header.shown.then_some("header"),
        foot: f.footer.shown.then_some("footer"),
    };
    let spots = typeset::spots(&set.document, &margins);
    tracing::debug!(pandoc = ?written, typst = ?(began.elapsed() - written), count, "the pages of the preview are made");
    let (width, height) = request.format.page.dimensions();
    Ok(Preview {
        count,
        pages,
        width,
        height,
        warnings,
        missing: prepared.bibliography.missing,
        substitute: reference::substitute(&request.format, ctx.fonts),
        places,
        spots,
    })
}

/// Pages of the document that was made last for a key: those that come into
/// view when the preview is moved through. How many pages there are, and
/// the pages. They are drawn from the document as it was set, which is set
/// again only where it is not kept, as after the application was restarted.
pub fn preview_pages(ctx: &Context, key: &str, wanted: &[u32], stop: &AtomicBool) -> Result<(usize, Vec<Page>)> {
    let document = kept_or_set(ctx, key, stop)?;
    Ok(pages_from(&document, wanted))
}

/// The document last set for the preview of a key: the one kept, or, where
/// it is no longer kept, set again from what was written for it.
fn kept_or_set(ctx: &Context, key: &str, stop: &AtomicBool) -> Result<Arc<typeset::PagedDocument>> {
    let dir = work_dir(ctx, key, "preview")?;
    if let Some(document) = kept(&dir) {
        return Ok(document);
    }
    if !dir.join("document.typ").is_file() {
        return Err(Error::NotFound(tr!("core-export-preview-document")));
    }
    Ok(set_for_preview(&dir, stop)?.document)
}

/// A page to be printed (record 0075): drawn as SVG, without the runs of its
/// text, which the printing does not want.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PrintPage {
    /// Which page it is, the first being 1.
    pub number: u32,
    pub svg: String,
}

/// The pages `from` to `to` of the document last set for the preview of a
/// key, for printing: as many as are asked, not the few the preview is
/// given at a time; those the document has not are passed over.
pub fn preview_print_pages(ctx: &Context, key: &str, from: u32, to: u32, stop: &AtomicBool) -> Result<Vec<PrintPage>> {
    let document = kept_or_set(ctx, key, stop)?;
    let count = document.pages().len() as u32;
    Ok((from.max(1)..=to.min(count))
        .filter_map(|number| Some(PrintPage { number, svg: typeset::svg(&document, number as usize)? }))
        .collect())
}

/// The documents last set for the preview, by the places they were made
/// in: the pages are drawn from them as they are looked at. A few, for the
/// projects last looked at.
static KEPT: Mutex<Vec<(PathBuf, Arc<typeset::PagedDocument>)>> = Mutex::new(Vec::new());
const KEPT_MOST: usize = 4;

fn kept(dir: &Path) -> Option<Arc<typeset::PagedDocument>> {
    let kept = KEPT.lock().unwrap_or_else(|p| p.into_inner());
    kept.iter().find(|(d, _)| d == dir).map(|(_, document)| document.clone())
}

/// A document set by Typst for the preview, and kept to draw its pages from.
struct SetForPreview {
    document: Arc<typeset::PagedDocument>,
    warnings: Vec<String>,
}

/// Sets the document that stands in a place of the preview. Typst cannot be
/// stopped while it sets, which takes a second or so of a long book: it is
/// asked whether to stop before, and after.
fn set_for_preview(dir: &Path, stop: &AtomicBool) -> Result<SetForPreview> {
    let stopped = || Error::Refused { kind: tools::STOPPED, message: tr!("program-stopped", program = "Typst") };
    if stop.load(Ordering::Relaxed) {
        return Err(stopped());
    }
    let set = typeset::set(dir, "document.typ")?;
    let document = Arc::new(set.document);
    {
        let mut kept = KEPT.lock().unwrap_or_else(|p| p.into_inner());
        kept.retain(|(d, _)| d != dir);
        kept.push((dir.to_path_buf(), document.clone()));
        let over = kept.len().saturating_sub(KEPT_MOST);
        kept.drain(..over);
    }
    // What was set is kept all the same, for the pages that are asked for next.
    if stop.load(Ordering::Relaxed) {
        return Err(stopped());
    }
    Ok(SetForPreview { document, warnings: set.warnings })
}

/// The pages of a document that are wanted, drawn and with their text, and
/// how many there are. Pages that are wanted and are not there are passed
/// over; where none is named, all are drawn.
fn pages_from(document: &typeset::PagedDocument, wanted: &[u32]) -> (usize, Vec<Page>) {
    let count = document.pages().len();
    let wanted: Vec<u32> = if wanted.is_empty() {
        (1..=count as u32).collect()
    } else {
        let mut named: Vec<u32> = wanted.iter().copied().filter(|n| *n > 0 && (*n as usize) <= count).collect();
        named.sort_unstable();
        named.dedup();
        named.truncate(MOST_PAGES);
        named
    };
    let pages = wanted
        .into_iter()
        .filter_map(|number| {
            let svg = typeset::svg(document, number as usize)?;
            Some(Page { number, svg, texts: typeset::texts(document, number as usize) })
        })
        .collect();
    (count, pages)
}

pub fn export(
    ctx: &Context,
    request: &Request,
    target: Target,
    path: &Path,
    options: &ExportOptions,
) -> Result<Exported> {
    export_until(ctx, request, target, path, options, &AtomicBool::new(false))
}

/// As [`export`], until `stop` is set: the program that is at work is then
/// ended, and it fails with the kind `stopped`. Nothing is written where the
/// file was to go.
pub fn export_until(
    ctx: &Context,
    request: &Request,
    target: Target,
    path: &Path,
    options: &ExportOptions,
    stop: &AtomicBool,
) -> Result<Exported> {
    let pandoc = ctx.tools.pandoc()?;
    let dir = work_dir(ctx, &request.key, "export")?;
    let mut exported = Exported { path: path.display().to_string(), ..Default::default() };
    let p = particulars(&request.document, &request.format);

    if matches!(target, Target::Pdf | Target::Typst) {
        let files = files_name(target, Some(path));
        let (source, prepared, warnings) = typst_source(ctx, request, &dir, &files, false)?;
        exported.warnings = warnings;
        exported.missing = prepared.bibliography.missing;
        if target == Target::Typst {
            write_atomic(path, source.as_bytes())?;
            files_beside(ctx, request, path, &files, &mut exported);
            return Ok(exported);
        }
        write_atomic(&dir.join("document.typ"), source.as_bytes())?;
        if stop.load(Ordering::Relaxed) {
            return Err(Error::Refused { kind: tools::STOPPED, message: tr!("program-stopped", program = "Typst") });
        }
        let (bytes, said) = typeset::pdf_of(&dir, "document.typ")?;
        exported.warnings.extend(said);
        write_atomic(path, &bytes)?;
        return Ok(exported);
    }

    let keep_citations = target == Target::Latex && options.biblatex || target == Target::Markdown;
    let files = files_name(target, Some(path));
    let placed = place_files(ctx, request, &dir, &files, false);
    let prepared = prepare(ctx, request, target, keep_citations, placed)?;
    exported.warnings.extend(prepared.remarks.iter().cloned());
    let bib = dir.join("references.bib");
    write_atomic(&bib, prepared.bibliography.text.as_bytes())?;
    let mut args = arguments(ctx, request, target, &prepared, &bib, keep_citations)?;
    args.push("--standalone".into());

    // The references go beside the document when the citations stay what they are.
    let beside_bib = || -> PathBuf {
        let stem = path.file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_else(|| "document".into());
        path.with_file_name(format!("{stem}.bib"))
    };

    match target {
        Target::Docx | Target::Odt => {
            let name = if target == Target::Docx { "reference.docx" } else { "reference.odt" };
            let default = tools::run(&pandoc.path, "Pandoc", ["--print-default-data-file", name], None, None)?.stdout;
            let pattern = if target == Target::Docx {
                reference::docx(&default, &request.format, &p)?
            } else {
                // A style for beginning a new page, which the pattern of Writer lacks.
                // The master pages of the elements with a look of their own, which their stretches bring.
                let looks: Vec<&DocumentFormat> = request.document.looks.iter().map(|l| &l.format).collect();
                let with_break = reference::odt_with_looks(&default, &request.format, &p, &looks)?;
                add_odt_break(&with_break)?
            };
            let pattern_path = dir.join(name);
            write_atomic(&pattern_path, &pattern)?;
            args.push("--reference-doc".into());
            args.push(pattern_path.display().to_string());
        }
        Target::Latex | Target::PdfLatex => {
            let looks: Vec<&DocumentFormat> = request.document.looks.iter().map(|l| &l.format).collect();
            let settings = latex::settings(&request.format, &looks, &p);
            let mut without_font = false;
            if target == Target::PdfLatex {
                let engine = ctx.tools.latex_engine()?;
                args.push(format!("--pdf-engine={engine}"));
                let fonts = tools::system_fonts();
                // LaTeX ends with an error where it does not find the font.
                // The document is then set in the font LaTeX has of its own,
                // and that is said.
                without_font = engine == "pdflatex" || !tools::has_font(&fonts, &request.format.font.family);
                if without_font && engine != "pdflatex" {
                    exported.warnings.push(tr!("core-export-latex-font", font = &request.format.font.family));
                }
                // A font has the letters it has. For those it lacks, as many
                // lack Greek with its accents, others are asked in turn.
                if engine == "lualatex" {
                    for fallback in latex::FALLBACK_FONTS.iter().filter(|f| tools::has_font(&fonts, f)).take(4) {
                        args.push("-V".into());
                        args.push(format!("mainfontfallback={fallback}:"));
                    }
                }
            }
            for (name, value) in &settings.variables {
                if without_font && name == "mainfont" {
                    continue;
                }
                args.push("-V".into());
                args.push(format!("{name}={value}"));
            }
            let header = dir.join("header.tex");
            let mut said = settings.header;
            // Whether the language has hyphenation patterns, asked of a PDF
            // only: the LaTeX given away is the writer's to run.
            if target == Target::PdfLatex {
                said.push_str(latex::HYPHENATION_CHECK);
            }
            write_atomic(&header, said.as_bytes())?;
            args.push("--include-in-header".into());
            args.push(header.display().to_string());
            if settings.number_sections {
                args.push("--number-sections".into());
            }
            if target == Target::Latex && options.biblatex && prepared.has_citations {
                let kind = ctx.styles.get(&request.style).map(|s| s.kind).unwrap_or_default();
                let target_bib = beside_bib();
                args.push("--biblatex".into());
                args.push("--bibliography".into());
                args.push(target_bib.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default());
                args.push("-V".into());
                args.push(format!("biblatexoptions=style={}", latex::biblatex_style(&request.style, &kind)));
                args.push("-V".into());
                // Pandoc puts it into the source as it stands: `\printbibliography[title=…]`.
                args.push(format!("biblio-title={{{}}}", latex::escape(&request.format.bibliography.title)));
                write_atomic(&target_bib, prepared.bibliography.text.as_bytes())?;
                exported.also.push(target_bib.display().to_string());
            }
        }
        Target::Markdown => {
            if prepared.has_citations {
                let target_bib = beside_bib();
                write_atomic(&target_bib, prepared.bibliography.text.as_bytes())?;
                exported.also.push(target_bib.display().to_string());
                args.push("-M".into());
                args.push(format!(
                    "bibliography={}",
                    target_bib.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default()
                ));
            }
        }
        Target::Html => {
            args.push("--embed-resources".into());
            // How what stands by itself is set on a page of the web.
            let header = dir.join("header.html");
            write_atomic(
                &header,
                format!("<style>\n{}</style>\n", html_styles(&request.format, &request.document.kinds)).as_bytes(),
            )?;
            args.push("--include-in-header".into());
            args.push(header.display().to_string());
        }
        Target::Epub => {
            // A reader sets the text; the book says of the parts what the
            // format says, and begins each chapter on a page of its own.
            let css = dir.join("book.css");
            write_atomic(&css, epub_styles(&request.format, &request.document.kinds).as_bytes())?;
            args.push("--css".into());
            args.push(css.display().to_string());
            args.push("--epub-chapter-level=1".into());
            args.push("--epub-title-page=false".into());
            // The cover: the first picture of the cover part, where the
            // document has one and the store has the picture.
            let cover = request
                .document
                .parts
                .iter()
                .filter(|p| place_of(&p.kind) == PartPlace::Cover)
                .find_map(|p| p.first_figure());
            // A cover that cannot be put there is said, not left out quietly.
            if let (Some((hash, extension)), Some(pictures)) = (cover, ctx.pictures) {
                let target = dir.join(format!("cover.{extension}"));
                let copied = crate::library::figures::file_of(pictures, &hash)
                    .ok_or_else(|| Error::not_found(tr!("core-pictures-the-picture")))
                    .and_then(|source| {
                        fs::copy(&source, &target).map(|_| ()).context(|| tr!("io-copying", path = &source))
                    });
                match copied {
                    Ok(()) => {
                        args.push("--epub-cover-image".into());
                        args.push(target.display().to_string());
                    }
                    Err(error) => {
                        tracing::warn!(%error, "the cover of the book could not be placed");
                        exported.warnings.push(tr!("core-export-cover-left-out", error = error.to_string()));
                    }
                }
            }
        }
        Target::Pdf | Target::Typst => unreachable!(),
    }
    // In a PDF the citations are always set by the reference style.
    debug_assert!(target != Target::PdfLatex || !keep_citations);

    let made = dir.join(format!("document.{}", target.extension()));
    args.push("-o".into());
    args.push(made.display().to_string());
    let input = serde_json::to_vec(&prepared.json)?;
    let mut ran = tools::run_until(&pandoc.path, "Pandoc", &args, Some(&input), Some(&dir), stop);
    // Where babel does not know the language, its package of TeX Live not
    // being installed, it is asked again to take it from its own files.
    if target == Target::PdfLatex
        && matches!(&ran, Err(Error::Program { message, .. }) if latex::lacks_language(message))
    {
        args.push("-V".into());
        args.push(format!("classoption={}", latex::FROM_LOCALE_FILES));
        ran = tools::run_until(&pandoc.path, "Pandoc", &args, Some(&input), Some(&dir), stop);
    }
    let out = ran.map_err(|e| match e {
        // What LaTeX says when it fails is long, and the first of it says little.
        Error::Program { message, .. } if target == Target::PdfLatex => {
            Error::Program { program: "LaTeX".into(), message: latex::what_went_wrong(&message) }
        }
        other => other,
    })?;
    let mut warnings = warnings_of(&out.messages);
    if target == Target::PdfLatex {
        // What the preamble wrote of the hyphenation is said as what it means.
        let without: Vec<String> = warnings.iter().filter_map(|w| latex::without_patterns(w).flatten()).collect();
        warnings.retain(|w| latex::without_patterns(w).is_none());
        for language in without {
            let warning = tr!("core-export-latex-no-hyphenation", language = language);
            if !warnings.contains(&warning) {
                warnings.push(warning);
            }
        }
    }
    exported.warnings.extend(warnings.into_iter().filter(|w| {
        // What LaTeX says of its own packages is of no use to the one who writes.
        target != Target::PdfLatex
            || !(w.contains("LaTeX Warning: Command") || w.contains("Check if current package is valid"))
    }));
    exported.missing = prepared.bibliography.missing;
    let bytes = fs::read(&made).context(|| tr!("core-export-reading-made"))?;
    // What Pandoc cannot be told, of a document for a word processor, is set right after.
    let bytes = match target {
        Target::Docx => after::docx(&bytes, &properties(&request.document, &request.format))?,
        Target::Odt => after::odt(&bytes, &request.format, &properties(&request.document, &request.format))?,
        // The contents where the template places them.
        Target::Html => after::html_lists(&String::from_utf8_lossy(&bytes)).into_bytes(),
        _ => bytes,
    };
    write_atomic(path, &bytes)?;
    if matches!(target, Target::Latex | Target::Markdown) {
        files_beside(ctx, request, path, &files, &mut exported);
    }
    Ok(exported)
}

/// The styles of figures, tables and rows for a page of the web.
/// How the title page stands on a page of the web and in a book for
/// e-readers, as the layout's look of the title sets it in the preview:
/// its size against the text's, its weight, its slant, its letters, and
/// where it stands (ADR 0055).
fn front_styles(f: &DocumentFormat) -> String {
    use crate::formats::{Align, Case};
    let t = &f.title;
    let align = match t.align {
        Align::Left | Align::Justified => "left",
        Align::Center => "center",
        Align::Right => "right",
    };
    let text = f.font.size.max(1.0);
    let letters = match t.case {
        Case::Upper => "text-transform: uppercase; ",
        Case::Smallcaps => "font-variant: small-caps; ",
        Case::None => "",
    };
    format!(
        ".gk-front {{ margin: 2em 0 2.5em; text-align: {align}; }}\n\
         .gk-front p {{ text-indent: 0; }}\n\
         .gk-title p {{ font-size: {title:.2}em; font-weight: {weight}; font-style: {slant}; {letters}line-height: 1.2; margin: 0 0 0.4em; }}\n\
         .gk-subtitle p {{ font-size: {sub:.2}em; margin: 0 0 0.6em; }}\n\
         .gk-authors p {{ margin: 0.8em 0 0.2em; }}\n\
         .gk-affiliations p {{ font-size: 0.85em; margin: 0; }}\n\
         .gk-roles p {{ margin: 0.6em 0 0; }}\n\
         .gk-date p {{ margin: 0.6em 0 0; }}\n",
        title = t.size / text,
        sub = (t.size * 0.8).max(f.font.size) / text,
        weight = if t.bold { "bold" } else { "normal" },
        slant = if t.italic { "italic" } else { "normal" },
    )
}

/// What a book for e-readers says of its parts: little, as the reader sets
/// the text; what the format says of headings, quotations and verse.
fn epub_styles(f: &DocumentFormat, own: &[OwnKind]) -> String {
    use crate::formats::Align;
    let to = |a: Align| match a {
        Align::Left => "left",
        Align::Center => "center",
        Align::Right => "right",
        Align::Justified => "justify",
    };
    let h1 = f.heading(1);
    let h2 = f.heading(2);
    let indent = if f.text.indent.is_zero() { "0" } else { "1.2em" };
    let between = if f.text.space_between.is_zero() { "0" } else { "0.8em" };
    let mut css = format!(
        "body {{ text-align: {align}; {hyphens} }}
p {{ margin: 0 0 {between} 0; text-indent: {indent}; }}
h1 {{ text-align: {h1_align}; font-weight: {h1_weight}; font-style: {h1_style}; margin: 2em 0 1em; }}
h2 {{ text-align: {h2_align}; font-weight: {h2_weight}; font-style: {h2_style}; margin: 1.5em 0 0.8em; }}
h1 + p, h2 + p, h3 + p {{ text-indent: 0; }}
blockquote {{ margin: 1em 1.5em; }}
.line-block {{ margin-left: 1.5em; white-space: pre-wrap; }}
.line-block p {{ text-indent: 0; margin: 0; }}
.gk-after {{ visibility: hidden; margin-right: 1em; }}
table.gk-parallel {{ width: 100%; border: none; }}
table.gk-parallel td {{ vertical-align: top; width: 50%; padding: 0 0.5em; border: none; }}
.footnotes {{ font-size: 0.9em; }}
",
        align = to(f.text.align),
        hyphens = if f.text.hyphenate { "hyphens: auto;" } else { "hyphens: manual;" },
        h1_align = to(h1.align),
        h1_weight = if h1.bold { "bold" } else { "normal" },
        h1_style = if h1.italic { "italic" } else { "normal" },
        h2_align = to(h2.align),
        h2_weight = if h2.bold { "bold" } else { "normal" },
        h2_style = if h2.italic { "italic" } else { "normal" },
    );
    css.push_str(&kind_styles(f, own));
    css.push_str(&part_styles(f));
    css.push_str(&front_styles(f));
    css
}

/// The styles of the kinds of elements that make a document, for a page of
/// the web and for an e-book: a rule on the class of each kind
/// (`gk-part-<id>`), with the look as the format resolves it. A page of its
/// own begins a new page, where pages are known, and a way down it.
fn part_styles(f: &DocumentFormat) -> String {
    use crate::formats::Align;
    let to = |a: Align| match a {
        Align::Left => "left",
        Align::Center => "center",
        Align::Right => "right",
        Align::Justified => "justify",
    };
    let mut css = String::new();
    for (id, info) in crate::templates::kinds::styled(f) {
        let look = &info.look;
        let class = format!("gk-part-{}", crate::document::pandoc::label(&id));
        let mut rules: Vec<String> = Vec::new();
        if look.align != Align::Left {
            rules.push(format!("text-align: {}", to(look.align)));
            rules.push("text-indent: 0".into());
        }
        if look.italic {
            rules.push("font-style: italic".into());
        }
        if look.size > 0.0 {
            rules.push(format!("font-size: {}pt", look.size));
        }
        if look.own_page || look.new_page {
            rules.push("page-break-before: always".into());
        }
        if look.own_page {
            rules.push("margin-top: 25vh".into());
        }
        if rules.is_empty() {
            continue;
        }
        let _ = writeln!(css, ".{class} {{ {}; }}", rules.join("; "));
    }
    css
}

fn html_styles(f: &DocumentFormat, own: &[OwnKind]) -> String {
    use crate::formats::{Align, CaptionPosition, Rules};
    let to = |a: Align| match a {
        Align::Left => "left",
        Align::Center => "center",
        Align::Right => "right",
        Align::Justified => "justify",
    };
    let line = match f.tables.rules {
        Rules::Horizontal => {
            "table { border-collapse: collapse; border-top: 1.5px solid; border-bottom: 1.5px solid; }\n\
             thead th, thead td { border-bottom: 1px solid; }\n"
        }
        Rules::Grid => "table { border-collapse: collapse; }\nth, td { border: 1px solid; }\n",
        Rules::None => "table { border-collapse: collapse; }\nthead th, thead td { border: none; }\n",
    };
    let above = |c: CaptionPosition| if c == CaptionPosition::Above { "0.2em" } else { "0.6em" };
    let mut css = format!(
        ".gk-figure, .gk-table {{ margin: 1.5em 0; }}\n\
         .gk-figure img {{ max-width: 100%; height: auto; }}\n\
         .gk-figure.gk-center, .gk-table.gk-center {{ text-align: center; }}\n\
         .gk-figure.gk-right, .gk-table.gk-right {{ text-align: right; }}\n\
         .gk-table table {{ display: inline-table; width: auto; margin: 0; text-align: left; }}\n\
         .gk-around {{ width: var(--gk-share, 40%); margin-top: 0.3em; margin-bottom: 0.6em; text-align: center; }}\n\
         .gk-around.gk-left {{ float: left; margin-right: 1.4em; }}\n\
         .gk-around.gk-right {{ float: right; margin-left: 1.4em; }}\n\
         .gk-around img {{ width: 100% !important; }}\n\
         .gk-figure-caption {{ text-align: {figure}; margin-top: {figure_above}; }}\n\
         .gk-table-caption {{ text-align: {table}; margin-top: {table_above}; }}\n\
         .gk-figure-caption p, .gk-table-caption p {{ margin: 0.3em 0; }}\n\
         .gk-row {{ display: grid; grid-template-columns: repeat(var(--gk-columns, 2), 1fr); gap: 0.5em 4%; \
         margin: 1.5em 0; text-align: center; clear: both; }}\n\
         .gk-row .gk-above, .gk-row .gk-body {{ align-self: end; }}\n\
         .gk-row .gk-below {{ align-self: start; }}\n\
         .gk-equation.gk-left {{ text-align: left; padding-left: 2em; }}\n\
         .gk-equation.gk-right {{ text-align: right; }}\n\
         .gk-equation .math.display {{ display: inline-block; }}\n\
         th, td {{ padding: 0.25em 0.6em; vertical-align: top; }}\n\
         {line}",
        figure = to(f.figures.caption_align),
        table = to(f.tables.caption_align),
        figure_above = above(f.figures.caption_position),
        table_above = above(f.tables.caption_position),
    );
    css.push_str(&kind_styles(f, own));
    css.push_str(&part_styles(f));
    css.push_str(&front_styles(f));
    css
}

/// The styles of the kinds of paragraph and of words, for a page of the web
/// and for an e-book: a rule on the class of each kind that has a look of
/// its own (`gk-kind-<id>`), with the look as the format resolves it. A
/// paragraph of a kind is a block with the class, holding its text as a
/// paragraph that is given no room of its own; words of a kind are a span
/// with the class. What is as the text has it is left unsaid.
fn kind_styles(f: &DocumentFormat, own: &[OwnKind]) -> String {
    use crate::formats::kinds::{self, Family};
    use crate::formats::{Align, Case, Length};
    let to = |a: Align| match a {
        Align::Left => "left",
        Align::Center => "center",
        Align::Right => "right",
        Align::Justified => "justify",
    };
    let pt = |l: Length| format!("{}pt", (l.points() * 100.0).round() / 100.0);
    let text = kinds::resolve(f, "text", own);
    let mut css = String::new();
    for (id, info) in kinds::styled(f, own) {
        let look = &info.look;
        let class = format!("gk-kind-{}", crate::document::pandoc::label(&id));
        let mut rules: Vec<String> = Vec::new();
        if info.family == Family::Paragraph {
            rules.push(format!("text-align: {}", to(look.align)));
            rules.push(format!("margin: {} 0 {}", pt(look.space_before), pt(look.space_after)));
            if !look.indent_left.is_zero() {
                rules.push(format!("padding-left: {}", pt(look.indent_left)));
            }
            if !look.indent_right.is_zero() {
                rules.push(format!("padding-right: {}", pt(look.indent_right)));
            }
            rules.push(format!("text-indent: {}", pt(look.first_line)));
            if look.keep_with_next {
                rules.push("page-break-after: avoid".into());
            }
            if look.new_page {
                rules.push("page-break-before: always".into());
            }
        }
        if look.bold {
            rules.push("font-weight: bold".into());
        }
        if look.italic {
            rules.push("font-style: italic".into());
        }
        match look.case {
            Case::Upper => rules.push("text-transform: uppercase".into()),
            Case::Smallcaps => rules.push("font-variant: small-caps".into()),
            Case::None => {}
        }
        if look.underline {
            rules.push("text-decoration: underline".into());
        }
        if look.monospace {
            rules.push("font-family: monospace".into());
        }
        if look.size > 0.0 && (look.size - text.size).abs() > 0.01 {
            rules.push(format!("font-size: {}pt", look.size));
        }
        if rules.is_empty() {
            continue;
        }
        let rules = rules.join("; ");
        match info.family {
            Family::Paragraph => {
                let _ = writeln!(css, ".{class} {{ {rules}; }}\n.{class} p {{ margin: 0; text-indent: inherit; }}");
            }
            Family::Words => {
                let _ = writeln!(css, "span.{class} {{ {rules}; }}");
            }
        }
    }
    css
}

fn add_odt_break(odt: &[u8]) -> Result<Vec<u8>> {
    use std::io::{Cursor, Read, Write};
    let mut archive = zip::ZipArchive::new(Cursor::new(odt))
        .map_err(|e| Error::invalid(tr!("core-export-pattern-unreadable", error = e.to_string())))?;
    let mut out = zip::ZipWriter::new(Cursor::new(Vec::new()));
    let names: Vec<String> =
        (0..archive.len()).filter_map(|i| archive.by_index(i).ok().map(|f| f.name().to_owned())).collect();
    let mut ordered = names.clone();
    ordered.sort_by_key(|n| n != "mimetype");
    for name in ordered {
        let mut file = archive.by_name(&name).map_err(|e| Error::invalid(e.to_string()))?;
        if file.is_dir() {
            continue;
        }
        let mut bytes = Vec::new();
        file.read_to_end(&mut bytes).map_err(|e| Error::io(tr!("core-export-pattern-reading"), e))?;
        if name == "styles.xml" {
            let mut text = String::from_utf8_lossy(&bytes).into_owned();
            let style = "<style:style style:name=\"Pagebreak\" style:family=\"paragraph\" style:parent-style-name=\"Standard\">\
                         <style:paragraph-properties fo:break-before=\"page\"/></style:style>";
            if !text.contains("style:name=\"Pagebreak\"")
                && let Some(at) = text.find("</office:styles>")
            {
                text.insert_str(at, style);
            }
            bytes = text.into_bytes();
        }
        let method = if name == "mimetype" { zip::CompressionMethod::Stored } else { zip::CompressionMethod::Deflated };
        out.start_file(name.as_str(), zip::write::SimpleFileOptions::default().compression_method(method))
            .map_err(|e| Error::invalid(e.to_string()))?;
        out.write_all(&bytes).map_err(|e| Error::io(tr!("core-export-pattern-writing"), e))?;
    }
    Ok(out.finish().map_err(|e| Error::invalid(e.to_string()))?.into_inner())
}

/// What a reference style does with some works: citations of several kinds,
/// and the bibliography, as HTML. The interface takes the parts it shows from
/// the blocks named `gk-sample-…` and `refs`.
///
/// `xml` is the style itself, which need not have been saved.
pub fn style_sample(
    ctx: &Context,
    xml: &str,
    references: &[crate::document::CarriedReference],
    language: Option<&str>,
) -> Result<String> {
    use crate::document::fixtures_for_samples as samples;
    let pandoc = ctx.tools.pandoc()?;
    let dir = work_dir(ctx, "style-sample", "sample")?;
    let style = dir.join("style.csl");
    write_atomic(&style, xml.as_bytes())?;

    let document = samples::document(references, language);
    let bibliography = gather(&document, ctx.library);
    let bib = dir.join("references.bib");
    write_atomic(&bib, bibliography.text.as_bytes())?;

    let converter = Converter {
        keys: &bibliography.keys,
        language,
        run_in: Vec::new(),
        begins: Default::default(),
        page_break: None,
        deepest: 6,
        extras: Default::default(),
    };
    let mut meta = Map::new();
    if let Some(l) = language.filter(|l| !l.trim().is_empty()) {
        meta.insert("lang".into(), meta_string(l.trim()));
    }
    meta.insert("link-citations".into(), crate::document::pandoc::meta_bool(false));
    let mut blocks: Vec<Value> = Vec::new();
    for (i, section) in document.sections.iter().enumerate() {
        let mut inner = Vec::new();
        converter.blocks(&section.blocks, &mut inner);
        blocks.push(div(&format!("gk-sample-{}", i + 1), inner));
    }
    blocks.push(div("refs", vec![]));
    let json = json!({ "pandoc-api-version": ctx.tools.pandoc_api, "meta": meta, "blocks": blocks });

    let args: Vec<String> = vec![
        "-f".into(),
        "json".into(),
        "-t".into(),
        "html".into(),
        "--wrap=none".into(),
        "--citeproc".into(),
        "--csl".into(),
        style.display().to_string(),
        "--bibliography".into(),
        bib.display().to_string(),
        "--lua-filter".into(),
        ctx.resources.join("pandoc").join("inline-notes.lua").display().to_string(),
    ];
    let out = tools::run(&pandoc.path, "Pandoc", &args, Some(&serde_json::to_vec(&json)?), Some(&dir))?;
    Ok(String::from_utf8_lossy(&out.stdout).into_owned())
}

/// Counts the words of a document as it would be printed: the text, with
/// notes or without.
pub fn count_words(document: &Document, with_notes: bool) -> usize {
    fn inlines(list: &[Inline], with_notes: bool, out: &mut String) {
        for i in list {
            match i {
                Inline::Text { text, .. } => out.push_str(text),
                Inline::Break => out.push(' '),
                Inline::Footnote { content, .. } if with_notes => {
                    out.push(' ');
                    inlines(content, with_notes, out);
                    out.push(' ');
                }
                // A formula in the line stands for a word, and so do words that point;
                // what is said of a line by hand is no word.
                Inline::Math { .. } | Inline::CrossRef { .. } => out.push_str(" x "),
                _ => {}
            }
        }
    }
    fn blocks(list: &[crate::document::Block], with_notes: bool, out: &mut String) {
        use crate::document::Block;
        for b in list {
            match b {
                Block::Paragraph { name, content, .. } => {
                    // A note to oneself is in no document.
                    if name != "draft" {
                        inlines(content, with_notes, out);
                    }
                }
                Block::Figure { caption, .. } => inlines(caption, with_notes, out),
                Block::Equation { .. } | Block::Break { .. } => {}
                Block::Row { items } => blocks(items, with_notes, out),
                Block::Table(table) => {
                    inlines(&table.caption, with_notes, out);
                    for row in &table.rows {
                        for cell in row {
                            out.push('\n');
                            blocks(&cell.content, with_notes, out);
                        }
                    }
                }
                Block::Parallel { left, right } => {
                    blocks(left, with_notes, out);
                    blocks(right, with_notes, out);
                }
            }
            out.push('\n');
        }
    }
    let mut text = String::new();
    for s in &document.sections {
        if let Some(h) = &s.heading {
            inlines(h, with_notes, &mut text);
            text.push('\n');
        }
        blocks(&s.blocks, with_notes, &mut text);
    }
    // By the one rule of words the application has, which the page keeps too.
    crate::import::document::count_words(&text)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::document::fixtures::sample;

    /// An image taken into the library at `dir`, as a figure finds it.
    fn add_picture(dir: &Path, name: &str, bytes: &[u8]) -> crate::library::FileView {
        crate::library::Library::open_at(dir).unwrap().add_image(name, bytes, None, None).unwrap().0
    }

    struct Setup {
        _tmp: tempfile::TempDir,
        tools: Tools,
        resources: PathBuf,
        styles: Styles,
        work: PathBuf,
        pictures: PathBuf,
    }

    /// Nothing, when Pandoc is not installed: the tests that need it are
    /// then passed over. Typst is part of the application.
    fn setup() -> Option<Setup> {
        let tools = tools::discover(&tools::Configured::default());
        if tools.pandoc.is_none() {
            crate::testing::passed_over("Pandoc is not installed");
            return None;
        }
        let tmp = tempfile::tempdir().unwrap();
        let resources = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../resources");
        let styles = Styles::new(&resources, &tmp.path().join("styles"));
        let work = tmp.path().join("work");
        let pictures = tmp.path().join("library");
        Some(Setup { _tmp: tmp, tools, resources, styles, work, pictures })
    }

    impl Setup {
        fn ctx(&self) -> Context<'_> {
            Context {
                tools: &self.tools,
                resources: &self.resources,
                styles: &self.styles,
                library: None,
                work: self.work.clone(),
                fonts: &[],
                pictures: Some(&self.pictures),
            }
        }
    }

    /// A part of a document: an element of a kind, with its text at level 0.
    fn part(kind: &str, name: &str, element: &str, words: &str) -> Part {
        use crate::document::fixtures::text;
        Part {
            kind: kind.into(),
            element: Some(element.into()),
            title: vec![text(name)],
            sections: vec![Section {
                level: 0,
                blocks: vec![Block::paragraph(vec![text(words)])],
                element: Some(element.into()),
                kind: Some(kind.into()),
                ..Default::default()
            }],
        }
    }

    fn request(style: &str) -> Request {
        let mut document = sample();
        document.parts = vec![part("abstract", "Abstract", "p-abs", "What the wrath of Achilles is.")];
        document.keywords = vec!["Homer".into(), "wrath".into()];
        Request::new(document, style, DocumentFormat { name: "Test".into(), ..Default::default() }, "test")
    }

    /// The order of a document of the kind a journal asks for, with the
    /// abstract, an appendix and the acknowledgements in their places.
    fn article() -> Template {
        use GeneratedPart::{Bibliography, Body, Contents, Keywords, Notes, TitlePage};
        let made = |part| ContentsItem::Part { part };
        let kind = |kind: &str| ContentsItem::Kind { kind: kind.into() };
        Template {
            contents: vec![
                made(TitlePage),
                kind("abstract"),
                made(Keywords),
                made(Contents),
                made(Body),
                kind("appendix"),
                kind("acknowledgements"),
                made(Notes),
                made(Bibliography),
            ],
            ..Template::plain()
        }
    }

    /// A document with the parts of an article and of a book: an abstract,
    /// a dedication, an appendix, the acknowledgements; and a second
    /// abstract, which is passed over.
    fn with_parts() -> Request {
        let mut r = request("chicago-author-date");
        r.document.parts = vec![
            part("dedication", "Dedication", "p-ded", "For the goddess."),
            part("abstract", "Abstract", "p-abs", "What the wrath of Achilles is."),
            part("abstract", "Abstract again", "p-abs2", "Zzsecondzz abstract, passed over."),
            part("appendix", "The scholia", "p-app", "Notes of the scholiasts."),
            part("acknowledgements", "Acknowledgements", "p-ack", "Thanks are due to the Muses."),
        ];
        r.template = article();
        r
    }

    /// Where the first of some words stands in a text; the test fails where they are not there.
    fn at(text: &str, words: &str) -> usize {
        text.find(words).unwrap_or_else(|| panic!("“{words}” is not in the document:\n{text}"))
    }

    #[test]
    fn the_order_of_the_parts_is_the_templates() {
        let r = with_parts();
        let names = |template: &Template| -> Vec<String> {
            order(template, &r.document.parts)
                .iter()
                .map(|i| match i {
                    Item::Made(p) => format!("{p:?}"),
                    Item::Part(p) => format!("{}:{}", p.kind, p.element.as_deref().unwrap_or("")),
                })
                .collect()
        };
        // The second abstract is passed over; the dedication, which the
        // template does not list, is printed by its place, before the body.
        assert_eq!(
            names(&r.template),
            [
                "TitlePage",
                "abstract:p-abs",
                "Keywords",
                "Contents",
                "dedication:p-ded",
                "Body",
                "appendix:p-app",
                "acknowledgements:p-ack",
                "Notes",
                "Bibliography"
            ]
        );
        // The plain template lists no kind: the front matter before the
        // body, the back matter after what is listed.
        assert_eq!(
            names(&Template::plain()),
            [
                "TitlePage",
                "dedication:p-ded",
                "abstract:p-abs",
                "Body",
                "Notes",
                "Bibliography",
                "appendix:p-app",
                "acknowledgements:p-ack"
            ]
        );
        // A template that lists no body has it after what it lists; a part listed twice is printed once.
        let odd = Template {
            contents: vec![
                ContentsItem::Kind { kind: "appendix".into() },
                ContentsItem::Kind { kind: "appendix".into() },
                ContentsItem::Part { part: GeneratedPart::TitlePage },
            ],
            ..Template::plain()
        };
        assert_eq!(
            names(&odd),
            ["appendix:p-app", "TitlePage", "dedication:p-ded", "abstract:p-abs", "Body", "acknowledgements:p-ack"]
        );
        assert_eq!(letter_of(1), "A");
        assert_eq!(letter_of(26), "Z");
        assert_eq!(letter_of(27), "AA");
    }

    #[test]
    fn another_output_than_the_document_is_refused() {
        let mut r = with_parts();
        r.output = "cover".into();
        let e = r.check_output().unwrap_err();
        assert!(e.to_string().contains("cover"), "{e}");
        r.template.outputs.push(crate::templates::Output { id: "cover".into(), ..Default::default() });
        let e = r.check_output().unwrap_err();
        assert!(e.to_string().contains("cannot be made yet"), "{e}");
        r.output = Output::DOCUMENT.into();
        r.check_output().unwrap();
        r.output = String::new();
        r.check_output().unwrap();
    }

    #[test]
    fn the_parts_of_a_document_are_placed_as_the_template_says() {
        let Some(s) = setup() else { return };
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        let r = with_parts();

        // Typst: the abstract under the format's label, the dedication on a
        // page of its own before the body, the appendix lettered after it,
        // then the acknowledgements, and the second abstract nowhere.
        let typ = out.join("parts.typ");
        export(&s.ctx(), &r, Target::Typst, &typ, &ExportOptions::default()).unwrap();
        let t = fs::read_to_string(&typ).unwrap();
        assert!(t.contains("<gk-abstract>"), "{t}");
        assert!(!t.contains("Zzsecondzz"), "the second abstract is passed over:\n{t}");
        assert!(t.contains("#show <gk-part-dedication>") && t.contains("<gk-part-dedication>"), "{t}");
        assert!(t.contains("#show <gk-part-appendix>"), "{t}");
        assert!(t.contains("#outline(title: [Contents], indent: auto)"), "{t}");
        assert!(t.contains("#metadata(\"p-app\") <gk-el-p-app>"), "the parts are marked for the preview: {t}");
        let abstract_at = at(&t, "What the wrath of Achilles is.");
        let dedication = at(&t, "For the goddess.");
        let body = at(&t, "Before the first section.");
        let appendix = at(&t, "A The scholia");
        let acknowledgements = at(&t, "Thanks are due to the Muses.");
        let refs = at(&t, "] <refs>");
        assert!(abstract_at < dedication && dedication < body, "{t}");
        assert!(body < appendix && appendix < acknowledgements && acknowledgements < refs, "{t}");
        let before_dedication = &t[..dedication];
        assert!(
            before_dedication.trim_end().ends_with("#pagebreak(weak: true)\n#block[")
                || before_dedication.contains("#pagebreak(weak: true)"),
            "{t}"
        );
        let p = preview(&s.ctx(), &r).unwrap();
        assert!(p.warnings.is_empty(), "{:?}", p.warnings);
        assert!(p.count >= 3, "the dedication has a page of its own: {} pages", p.count);
        assert!(p.places.iter().any(|pl| pl.element == "p-ded"), "{:?}", p.places);

        // Word: each part in a style of its name, which the pattern defines;
        // the abstract as Word's; the second abstract nowhere.
        let docx = out.join("parts.docx");
        export(&s.ctx(), &r, Target::Docx, &docx, &ExportOptions::default()).unwrap();
        let xml = unzip(&docx, "word/document.xml");
        assert!(xml.contains("w:val=\"Dedication\"") && xml.contains("For the goddess."), "{xml}");
        assert!(xml.contains("w:val=\"Appendix\"") && xml.contains("A The scholia"), "{xml}");
        assert!(xml.contains("w:val=\"Acknowledgements\""), "{xml}");
        assert!(xml.contains("What the wrath of Achilles is."), "{xml}");
        assert!(!xml.contains("Zzsecondzz"), "{xml}");
        let styles = unzip(&docx, "word/styles.xml");
        assert!(styles.contains("w:styleId=\"Dedication\"") && styles.contains("w:styleId=\"Appendix\""), "{styles}");
        assert!(styles.contains("w:styleId=\"EpigraphPage\"") && styles.contains("w:styleId=\"Epigraph\""), "{styles}");
        let body_xml = at(&xml, "Before the first section.");
        assert!(at(&xml, "For the goddess.") < body_xml && body_xml < at(&xml, "A The scholia"), "{xml}");

        // Writer: the styles, as in Word.
        let odt = out.join("parts.odt");
        export(&s.ctx(), &r, Target::Odt, &odt, &ExportOptions::default()).unwrap();
        let content = unzip(&odt, "content.xml");
        assert!(
            content.contains("text:style-name=\"Dedication\"") && content.contains("For the goddess."),
            "{content}"
        );
        assert!(unzip(&odt, "styles.xml").contains("style:name=\"Dedication\""));

        // The e-book: the parts with their classes, and the cover the
        // first picture of the cover part.
        {
            use crate::library::figures::fixtures::PNG;
            let picture = add_picture(&s.pictures, "cover.png", &PNG);
            let mut with_cover = r.clone();
            with_cover.document.identifiers.insert("isbn".into(), "978-0-00-000000-0".into());
            with_cover.document.identifiers.insert("publisher".into(), "The Press".into());
            with_cover.document.parts.push(Part {
                kind: "cover".into(),
                element: Some("p-cov".into()),
                title: vec![crate::document::fixtures::text("Cover")],
                sections: vec![Section {
                    level: 0,
                    blocks: vec![Block::Figure {
                        id: String::new(),
                        file: picture.hash.clone(),
                        extension: "png".into(),
                        name: "cover.png".into(),
                        caption: vec![],
                        alt: String::new(),
                        width: 100,
                        numbered: false,
                        align: None,
                        wrap: None,
                    }],
                    element: Some("p-cov".into()),
                    kind: Some("cover".into()),
                    ..Default::default()
                }],
            });
            let epub = out.join("parts.epub");
            export(&s.ctx(), &with_cover, Target::Epub, &epub, &ExportOptions::default()).unwrap();
            let archive = zip::ZipArchive::new(fs::File::open(&epub).unwrap()).unwrap();
            let names: Vec<String> = archive.file_names().map(str::to_owned).collect();
            assert!(names.iter().any(|n| n.contains("cover")), "{names:?}");
            let text: String = names.iter().filter(|n| n.starts_with("EPUB/text/")).map(|n| unzip(&epub, n)).collect();
            assert!(text.contains("gk-part-dedication") && text.contains("For the goddess."), "{text}");
            assert!(text.contains("gk-part-appendix"), "{text}");
            assert!(!text.contains("Zzsecondzz"), "{text}");
            let opf = unzip(&epub, "EPUB/content.opf");
            assert!(opf.contains("978-0-00-000000-0") && opf.contains("The Press"), "{opf}");
            let css = unzip(&epub, "EPUB/styles/stylesheet1.css");
            assert!(css.contains(".gk-part-dedication {"), "{css}");
        }

        // A page of the web: the identifiers in its metadata, and the parts with their classes.
        let html = out.join("parts.html");
        export(&s.ctx(), &r, Target::Html, &html, &ExportOptions::default()).unwrap();
        let h = fs::read_to_string(&html).unwrap();
        assert!(h.contains("class=\"gk-part-dedication\"") && h.contains(".gk-part-dedication {"), "{h}");
        assert!(h.contains("What the wrath of Achilles is."), "{h}");
        assert!(h.contains("id=\"TOC\"") || h.contains("id=\"toc\""), "the contents are listed: {h}");

        // LaTeX: a group around each part.
        let tex = out.join("parts.tex");
        export(&s.ctx(), &r, Target::Latex, &tex, &ExportOptions::default()).unwrap();
        let l = fs::read_to_string(&tex).unwrap();
        assert!(l.contains("\\centering\\itshape") && l.contains("For the goddess."), "{l}");
        assert!(l.contains("\\tableofcontents"), "{l}");
        assert!(!l.contains("Zzsecondzz"), "{l}");
    }

    #[test]
    fn a_part_the_template_does_not_list_is_printed_by_its_place() {
        let Some(s) = setup() else { return };
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        let mut r = with_parts();
        // The plain template lists no kind: the dedication goes before the
        // body, the appendix and the acknowledgements after the bibliography.
        r.template = Template::plain();
        let typ = out.join("unlisted.typ");
        export(&s.ctx(), &r, Target::Typst, &typ, &ExportOptions::default()).unwrap();
        let t = fs::read_to_string(&typ).unwrap();
        let dedication = at(&t, "For the goddess.");
        let body = at(&t, "Before the first section.");
        let refs = at(&t, "] <refs>");
        let appendix = at(&t, "A The scholia");
        let acknowledgements = at(&t, "Thanks are due to the Muses.");
        assert!(dedication < body && body < refs && refs < appendix && appendix < acknowledgements, "{t}");
        assert!(t.contains("What the wrath of Achilles is."), "the abstract is set as the abstract all the same: {t}");
        assert!(!t.contains("#outline("), "{t}");
        // A kind of the cover is printed by no document; one that is not known is a section of the front matter.
        r.document.parts.push(part("blurb", "Blurb", "p-blurb", "Zzblurbzz: a book to read."));
        r.document.parts.push(part("authors-note", "A note", "p-note", "Zznotezz: a word before."));
        let typ = out.join("unlisted-2.typ");
        export(&s.ctx(), &r, Target::Typst, &typ, &ExportOptions::default()).unwrap();
        let t = fs::read_to_string(&typ).unwrap();
        assert!(!t.contains("Zzblurbzz"), "{t}");
        assert!(at(&t, "Zznotezz") < at(&t, "Before the first section."), "{t}");
        assert!(t.contains("A note"), "{t}");

        // Deeper down, a section made from an element of a kind is set by
        // the kind's look at the level it stands at: the chapter's abstract
        // under the chapter, with its heading unnumbered, in a block of the kind.
        r.document.sections.push(Section {
            level: 2,
            heading: Some(vec![crate::document::fixtures::text("Summary")]),
            blocks: vec![Block::paragraph(vec![crate::document::fixtures::text("Zzsummaryzz of the chapter.")])],
            element: Some("e-sum".into()),
            kind: Some("abstract".into()),
        });
        let typ = out.join("unlisted-3.typ");
        export(&s.ctx(), &r, Target::Typst, &typ, &ExportOptions::default()).unwrap();
        let t = fs::read_to_string(&typ).unwrap();
        let heading = at(&t, "#heading(level: 2, numbering: none)[Summary]");
        let block = at(&t, "] <gk-part-abstract>");
        assert!(at(&t, "Before the first section.") < heading && heading < block, "{t}");
        assert!(t[heading..block].contains("Zzsummaryzz"), "{t}");
        let docx = out.join("unlisted.docx");
        export(&s.ctx(), &r, Target::Docx, &docx, &ExportOptions::default()).unwrap();
        let xml = unzip(&docx, "word/document.xml");
        assert!(xml.contains("Summary") && xml.contains("Zzsummaryzz"), "{xml}");
    }

    #[test]
    fn the_preview_tells_what_stands_where_on_its_pages() {
        use crate::document::fixtures::text;
        use crate::document::{Block, Section};
        use std::collections::BTreeMap;
        let Some(s) = setup() else { return };
        // The sample, with its heading, citations, note and quotation; figures
        // and a table; the parts of an article; a deeper heading, a passage of
        // a kind, and words of a kind.
        let mut r = with_figures(&s);
        let parts = with_parts();
        r.document.parts = parts.document.parts;
        r.template = parts.template;
        r.key = "spots".into();
        let foreign = Inline::Text {
            text: "μῆνις".into(),
            marks: BTreeMap::from([("kind".to_owned(), json!({"name": "foreign", "lang": "el"}))]),
        };
        r.document.sections.push(Section {
            level: 2,
            heading: Some(vec![text("Deeper")]),
            blocks: vec![
                Block::of_kind("epigraph", vec![text("Rage, goddess, sing.")]),
                Block::of_kind("line", vec![text("Tell me, Muse, of the man.")]),
                Block::paragraph(vec![text("Of "), foreign, text(", wrath.")]),
                Block::Table(poems("t-poems", "The poems")),
            ],
            element: Some("e3".into()),
            kind: None,
        });
        let p = preview(&s.ctx(), &r).unwrap();
        assert!(p.warnings.iter().all(|w| w.contains("lost.jpg")), "{:?}", p.warnings);
        for spot in &p.spots {
            assert!(spot.page >= 1 && spot.page as usize <= p.count, "{spot:?}");
            assert!(spot.top < spot.bottom && spot.bottom <= p.height, "{spot:?}");
        }
        // What each run of these words is, as the preview names a line: the innermost spot that holds it.
        let names = |words: &str| -> Vec<Option<&str>> {
            let mut out: Vec<Option<&str>> = p
                .pages
                .iter()
                .flat_map(|page| page.texts.iter().map(move |r| (page.number, r)))
                .filter(|(_, r)| r.text.trim() == words || r.text.trim().starts_with(&format!("{words} ")))
                .map(|(page, r)| {
                    p.spots
                        .iter()
                        .filter(|s| s.page == page && s.top - 0.5 <= r.baseline && r.baseline <= s.bottom + 0.5)
                        .min_by(|a, b| (a.bottom - a.top).total_cmp(&(b.bottom - b.top)))
                        .map(|s| s.what.as_str())
                })
                .collect();
            assert!(!out.is_empty(), "“{words}” is not on the pages");
            out.dedup();
            out
        };
        assert!(names("Wrath and the hero").contains(&Some("front")), "{:?}", p.spots);
        assert!(names("Contents").contains(&Some("part:contents")), "{:?}", p.spots);
        assert_eq!(names("For the goddess."), [Some("part:dedication")]);
        assert!(names("The word").contains(&Some("heading:1")), "{:?}", names("The word"));
        assert!(names("Deeper").contains(&Some("heading:2")), "{:?}", names("Deeper"));
        // The quotation is a block Pandoc writes as Typst's own; another kind is a block with its label.
        assert_eq!(names("Sing, goddess, the wrath."), [Some("kind:quote")]);
        assert_eq!(names("Rage, goddess, sing."), [Some("kind:epigraph")]);
        // A line of verse is named by its kind, as the lines of a play are.
        assert_eq!(names("Tell me, Muse, of the man."), [Some("kind:line")]);
        assert_eq!(names("So the scholia"), [Some("note")]);
        // A figure and a table, with what is said of them.
        assert_eq!(names("Figure\u{a0}1. The shield, as"), [Some("figure")]);
        assert_eq!(names("Figure\u{a0}2. A vase"), [Some("figure")]);
        assert_eq!(names("Table\u{a0}1. The poems"), [Some("table")]);
        assert_eq!(names("Iliad"), [Some("table")]);
        assert_eq!(names("Notes of the scholiasts."), [Some("part:appendix")]);
        assert_eq!(names("Thanks are due to the Muses."), [Some("part:acknowledgements")]);
        assert!(names("Bibliography").ends_with(&[Some("bibliography")]), "{:?}", names("Bibliography"));
        assert_eq!(names("Nagy, Gregory. 1979."), [Some("bibliography")]);
        // The text is in no spot, nor are words of a kind within it.
        assert_eq!(names("Before the first section."), [None]);
        assert_eq!(names("Of"), [None]);
        assert!(!p.spots.iter().any(|s| s.what.contains("foreign")), "{:?}", p.spots);
        // The footer, in the margin at the foot, as the layout puts it there; no header.
        assert!(
            p.spots.iter().any(|s| s.page == 1 && s.what == "footer" && s.bottom > p.height - 1.0),
            "{:?}",
            p.spots
        );
        assert!(!p.spots.iter().any(|s| s.what == "header"), "{:?}", p.spots);
        // A header with the title and the number, and no footer.
        r.format.header = crate::formats::Margin {
            shown: true,
            places: crate::formats::Sides {
                left: vec![crate::formats::Item::Title],
                right: vec![crate::formats::Item::PageNumber],
                ..Default::default()
            },
            ..Default::default()
        };
        r.format.footer.shown = false;
        r.key = "spots-head".into();
        let p = preview(&s.ctx(), &r).unwrap();
        assert!(p.spots.iter().any(|s| s.page == 1 && s.what == "header" && s.top < 1.0), "{:?}", p.spots);
        assert!(!p.spots.iter().any(|s| s.what == "footer"), "{:?}", p.spots);
    }

    #[test]
    fn a_preview_in_pages() {
        let Some(s) = setup() else { return };
        let p = preview(&s.ctx(), &request("chicago-author-date")).unwrap();
        assert!(!p.pages.is_empty());
        assert!(p.pages[0].svg.starts_with("<svg"));
        assert_eq!(p.count, p.pages.len());
        assert_eq!(p.pages[0].number, 1);
        assert!(p.missing.is_empty());
        assert!(p.warnings.is_empty(), "{:?}", p.warnings);
        assert_eq!((p.width, p.height), (595.28, 841.89));

        let source = fs::read_to_string(s.work.join("test/preview/document.typ")).unwrap();
        assert!(source.contains("<gk-title>"));
        assert!(source.contains("Nagy 1979, 73"), "{source}");
        assert!(source.contains("<refs>"));
        assert!(source.contains("#footnote["));
    }

    #[test]
    fn a_document_is_given_whole_for_printing_past_the_few_pages_of_the_preview() {
        use crate::document::fixtures::text;
        use crate::document::{Block, Section};
        let Some(s) = setup() else { return };
        let mut r = request("chicago-author-date");
        r.key = "printing".into();
        r.document.sections.push(Section {
            level: 1,
            heading: Some(vec![text("Long")]),
            blocks: (0..400).map(|_| Block::paragraph(vec![text(&"Many words follow. ".repeat(20))])).collect(),
            element: Some("e2".into()),
            kind: None,
        });
        let p = preview(&s.ctx(), &r).unwrap();
        assert!(p.count > MOST_PAGES, "{}", p.count);
        let stop = AtomicBool::new(false);
        let all = preview_print_pages(&s.ctx(), &r.key, 1, p.count as u32, &stop).unwrap();
        assert_eq!(all.len(), p.count);
        assert_eq!(all.last().unwrap().number, p.count as u32);
        let some = preview_print_pages(&s.ctx(), &r.key, 2, 3, &stop).unwrap();
        assert_eq!(some.iter().map(|page| page.number).collect::<Vec<_>>(), [2, 3]);
        assert_eq!(some[0].svg, all[1].svg);
    }

    #[test]
    fn the_preview_tells_where_the_elements_are_and_what_the_pages_say() {
        use crate::document::fixtures::text;
        use crate::document::{Block, Section};
        let Some(s) = setup() else { return };
        let mut r = request("chicago-author-date");
        // Two sections made from elements: the sample's, and one more of many
        // paragraphs, so that it may reach a page of its own.
        assert_eq!(r.document.sections[1].element.as_deref(), Some("e1"));
        let para = |w: &str| Block::paragraph(vec![text(&w.repeat(40))]);
        r.document.sections.push(Section {
            level: 1,
            heading: Some(vec![text("Afterwards")]),
            blocks: (0..30).map(|_| para("Many words follow. ")).collect(),
            element: Some("e2".into()),
            kind: None,
        });
        let p = preview(&s.ctx(), &r).unwrap();
        assert!(p.warnings.is_empty(), "{:?}", p.warnings);

        let places: Vec<(&str, u32)> = p.places.iter().map(|pl| (pl.element.as_str(), pl.page)).collect();
        assert_eq!(places, [("e1", 1), ("e2", 1)], "{:?}", p.places);
        let (first, second) = (&p.places[0], &p.places[1]);
        assert!(second.page >= first.page);
        assert!(second.page > first.page || second.y > first.y, "{first:?} {second:?}");
        assert!(first.y >= 0.0 && first.y <= p.height, "{first:?}");

        let runs = &p.pages[0].texts;
        assert!(!runs.is_empty());
        let word = runs.iter().find(|r| r.text.contains("belongs")).unwrap_or_else(|| panic!("{runs:?}"));
        assert!(word.size > 0.0 && word.width > 0.0, "{word:?}");
        for run in runs {
            assert!(run.x >= 0.0 && run.x <= p.width, "{run:?}");
            assert!(run.baseline >= 0.0 && run.baseline <= p.height, "{run:?}");
        }
        // The heading of the first section stands at the top of its words, near its place.
        let heading = runs.iter().find(|r| r.text.starts_with("The word")).unwrap_or_else(|| panic!("{runs:?}"));
        assert!(heading.baseline > first.y && heading.baseline - first.y < 60.0, "{heading:?} {first:?}");
        assert!(word.baseline > heading.baseline);
        // The pages asked for afterwards carry their text as well.
        let (count, pages) = preview_pages(&s.ctx(), &r.key, &[1], &AtomicBool::new(false)).unwrap();
        assert_eq!(count, p.count);
        assert_eq!(pages[0].texts, p.pages[0].texts);
        // The pages are given for printing as many as are asked, the last ones passed over that the document has not.
        let stop = AtomicBool::new(false);
        let printed = preview_print_pages(&s.ctx(), &r.key, 1, p.count as u32 + 5, &stop).unwrap();
        assert_eq!(
            printed.iter().map(|page| page.number).collect::<Vec<_>>(),
            (1..=p.count as u32).collect::<Vec<_>>()
        );
        assert!(printed.iter().all(|page| page.svg.starts_with("<svg")));
        assert_eq!(printed[0].svg, p.pages[0].svg);
        assert!(preview_print_pages(&s.ctx(), &r.key, 0, 0, &stop).unwrap().is_empty());
        assert!(preview_print_pages(&s.ctx(), &r.key, 3, 2, &stop).unwrap().is_empty());

        // The marks are no part of what the other formats are given.
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        let docx = out.join("marked.docx");
        let e = export(&s.ctx(), &r, Target::Docx, &docx, &ExportOptions::default()).unwrap();
        assert!(e.warnings.is_empty(), "{:?}", e.warnings);
        assert!(!unzip(&docx, "word/document.xml").contains("gk-el-"));
        let tex = out.join("marked.tex");
        export(&s.ctx(), &r, Target::Latex, &tex, &ExportOptions::default()).unwrap();
        assert!(!fs::read_to_string(&tex).unwrap().contains("gk-el-"));
        let typ = out.join("marked.typ");
        export(&s.ctx(), &r, Target::Typst, &typ, &ExportOptions::default()).unwrap();
        assert!(fs::read_to_string(&typ).unwrap().contains("#metadata(\"e1\") <gk-el-e1>"));
    }

    #[test]
    fn an_element_with_a_look_of_its_own_has_it_in_the_document() {
        use crate::document::fixtures::text;
        use crate::document::{Block, ElementLook, Section};
        let Some(s) = setup() else { return };
        let mut r = request("chicago-author-date");
        let section = |level: u8, heading: &str| Section {
            level,
            heading: Some(vec![text(heading)]),
            blocks: vec![Block::paragraph(vec![text(&format!("Words of {heading}."))])],
            element: Some(heading.to_lowercase()),
            kind: None,
        };
        r.document.sections = vec![section(1, "One"), section(1, "Two"), section(2, "Within"), section(1, "Three")];
        r.format.title.placement = TitlePlacement::Top;
        // Two in larger type, without its footer, its pages counted anew.
        let mut two = r.format.clone();
        two.font.size = 14.0;
        two.footer.shown = false;
        two.page.restart = true;
        r.document.looks = vec![ElementLook { element: "two".into(), format: two }];
        r.key = "looks".into();
        let p = preview(&s.ctx(), &r).unwrap();
        assert!(p.warnings.is_empty(), "{:?}", p.warnings);
        let t = fs::read_to_string(s.work.join("looks/preview/document.typ")).unwrap();
        let at = |w: &str| t.find(w).unwrap_or_else(|| panic!("{w} in {t}"));
        let switch = at("#pagebreak(weak: true)\n#set page(");
        assert!(at("= One") < switch && switch < at("= Two"), "{t}");
        let into = &t[switch..at("= Two")];
        assert!(into.contains("footer: none,") && into.contains("#counter(page).update(1)"), "{into}");
        assert!(into.contains("size: 14pt"), "{into}");
        // Back to the document's look after Within, which is Two's.
        let back = &t[at("= Within")..at("= Three")];
        assert!(back.contains("#set page(") && back.contains("size: 12pt") && !back.contains("update(1)"), "{back}");
        assert_eq!(t.matches("#set page(").count(), 3, "no look elsewhere: {t}");

        // The pages: One, Two on a page of its own without its footer, numbered anew, Three on the next.
        let words = |n: usize| p.pages[n].texts.iter().map(|t| t.text.trim().to_owned()).collect::<Vec<_>>();
        assert_eq!(p.count, 3, "{:?}", (0..p.count).map(words).collect::<Vec<_>>());
        assert!(words(0).contains(&"One".to_owned()) && words(0).contains(&"1".to_owned()), "{:?}", words(0));
        assert!(words(1).contains(&"Two".to_owned()) && !words(1).contains(&"2".to_owned()), "{:?}", words(1));
        assert!(words(1).contains(&"Within".to_owned()));
        assert!(
            words(2).contains(&"Three".to_owned()) && words(2).contains(&"2".to_owned()),
            "counted on from Two's one: {:?}",
            words(2)
        );
        // The places of the elements are still found.
        let places: Vec<(&str, u32)> = p.places.iter().map(|pl| (pl.element.as_str(), pl.page)).collect();
        assert_eq!(places, [("one", 1), ("two", 2), ("within", 2), ("three", 3)], "{:?}", p.places);
    }

    const W: &str = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
    const R: &str = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
    const STYLE: &str = "urn:oasis:names:tc:opendocument:xmlns:style:1.0";

    #[test]
    fn word_and_writer_follow_the_pages_of_an_element_with_a_look_of_its_own() {
        use crate::document::fixtures::text;
        use crate::document::{Block, ElementLook, Section};
        use crate::formats::NumberStyle;
        let Some(s) = setup() else { return };
        let mut r = request("chicago-author-date");
        let section = |level: u8, heading: &str| Section {
            level,
            heading: Some(vec![text(heading)]),
            blocks: vec![Block::paragraph(vec![text(&format!("Words of {heading}."))])],
            element: Some(heading.to_lowercase()),
            kind: None,
        };
        r.document.sections = vec![section(1, "One"), section(1, "Two"), section(2, "Within"), section(1, "Three")];
        r.format.title.placement = TitlePlacement::Top;
        // Two in larger type, without its footer, its pages counted anew in small roman numbers.
        let mut two = r.format.clone();
        two.font.size = 14.0;
        two.footer.shown = false;
        two.page.restart = true;
        two.page.numbering = NumberStyle::RomanLower;
        r.document.looks = vec![ElementLook { element: "two".into(), format: two }];
        r.key = "looks-word".into();
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();

        // Word: a section ends before Two with the document's settings; Two's
        // ends before Three, numbered anew in roman, its footer the empty
        // one; the last is the document's again.
        let docx = out.join("looks.docx");
        let e = export(&s.ctx(), &r, Target::Docx, &docx, &ExportOptions::default()).unwrap();
        assert!(e.warnings.is_empty(), "{:?}", e.warnings);
        let d = unzip(&docx, "word/document.xml");
        let tree = roxmltree::Document::parse(&d).unwrap();
        let sections: Vec<roxmltree::Node> = tree.descendants().filter(|n| n.has_tag_name((W, "sectPr"))).collect();
        assert_eq!(sections.len(), 3, "{d}");
        let starts: Vec<usize> = sections.iter().map(|n| n.range().start).collect();
        assert!(at(&d, "Words of One.") < starts[0] && starts[0] < at(&d, ">Two<"), "{d}");
        assert!(at(&d, "Words of Within.") < starts[1] && starts[1] < at(&d, ">Three<"), "{d}");
        // What a section says: its footers, how it begins, how its pages are numbered.
        let child = |n: &roxmltree::Node, tag: &str, attribute: &str| {
            n.children().find(|c| c.has_tag_name((W, tag))).and_then(|c| c.attribute((W, attribute))).map(str::to_owned)
        };
        let footers = |n: &roxmltree::Node| {
            n.children()
                .filter(|c| c.has_tag_name((W, "footerReference")))
                .map(|c| format!("{}={}", c.attribute((W, "type")).unwrap(), c.attribute((R, "id")).unwrap()))
                .collect::<Vec<_>>()
        };
        let ours = vec!["default=rIdGkfooter1xml".to_owned()];
        assert_eq!(footers(&sections[0]), ours);
        assert_eq!(child(&sections[0], "pgNumType", "fmt"), None);
        assert_eq!(child(&sections[1], "type", "val").as_deref(), Some("nextPage"));
        assert_eq!(child(&sections[1], "pgNumType", "fmt").as_deref(), Some("lowerRoman"));
        assert_eq!(child(&sections[1], "pgNumType", "start").as_deref(), Some("1"));
        assert_eq!(
            footers(&sections[1]),
            ["default", "even", "first"].map(|t| format!("{t}=rIdGkfooterEmptyxml")),
            "{d}"
        );
        assert_eq!(footers(&sections[2]), ours);
        assert_eq!(child(&sections[2], "type", "val").as_deref(), Some("nextPage"));
        assert_eq!(child(&sections[2], "pgNumType", "fmt"), None);
        assert!(unzip(&docx, "word/_rels/document.xml.rels").contains("Target=\"footerEmpty.xml\""));
        assert!(!unzip(&docx, "word/footerEmpty.xml").contains("PAGE"));

        // Writer: the look's master page, without the footer, numbered in
        // roman; a paragraph that brings it before Two, counting anew, and
        // one that brings the document's back before Three.
        let odt = out.join("looks.odt");
        let e = export(&s.ctx(), &r, Target::Odt, &odt, &ExportOptions::default()).unwrap();
        assert!(e.warnings.is_empty(), "{:?}", e.warnings);
        let styles = unzip(&odt, "styles.xml");
        let content = unzip(&odt, "content.xml");
        roxmltree::Document::parse(&styles).unwrap();
        roxmltree::Document::parse(&content).unwrap();
        let p = particulars(&r.document, &r.format);
        let name = reference::odt_look_name(&r.document.looks[0].format, &p);
        let own = reference::odt_look_name(&r.format, &p);
        let tree = roxmltree::Document::parse(&styles).unwrap();
        let named = |tag: &str, n: &str| {
            tree.descendants()
                .find(|e| e.has_tag_name((STYLE, tag)) && e.attribute((STYLE, "name")) == Some(n))
                .unwrap_or_else(|| panic!("{tag} {n} in {styles}"))
        };
        let master = named("master-page", &name);
        assert_eq!(master.attribute((STYLE, "page-layout-name")), Some(format!("{name}Layout").as_str()));
        assert!(!master.children().any(|c| c.has_tag_name((STYLE, "footer"))), "{styles}");
        assert!(named("master-page", "Standard").children().any(|c| c.has_tag_name((STYLE, "footer"))));
        let layout = named("page-layout", &format!("{name}Layout"));
        let properties = layout.first_element_child().unwrap();
        assert_eq!(properties.attribute((STYLE, "num-format")), Some("i"));
        let restart = named("style", &format!("{name}Restart"));
        assert_eq!(restart.attribute((STYLE, "master-page-name")), Some(name.as_str()));
        assert_eq!(restart.first_element_child().unwrap().attribute((STYLE, "page-number")), Some("1"));
        assert_eq!(named("style", &own).attribute((STYLE, "master-page-name")), Some("Standard"));
        let into = at(&content, &format!("<text:p text:style-name=\"{name}Restart\"/>"));
        let back = at(&content, &format!("<text:p text:style-name=\"{own}\"/>"));
        assert!(at(&content, "Words of One.") < into && into < at(&content, ">Two<"), "{content}");
        assert!(at(&content, "Words of Within.") < back && back < at(&content, ">Three<"), "{content}");

        // Where the chapters begin a page anyway, the new section or page is
        // that page: no empty page beside it.
        r.format.headings.levels[0].begins = crate::formats::Begins::Page;
        r.document.looks[0].format.headings.levels[0].begins = crate::formats::Begins::Page;
        r.key = "looks-pages".into();
        export(&s.ctx(), &r, Target::Docx, &docx, &ExportOptions::default()).unwrap();
        let d = unzip(&docx, "word/document.xml");
        assert_eq!(d.matches("<w:sectPr").count(), 3, "{d}");
        assert_eq!(d.matches("w:type=\"page\"").count(), 1, "only One's: {d}");
        export(&s.ctx(), &r, Target::Odt, &odt, &ExportOptions::default()).unwrap();
        let content = unzip(&odt, "content.xml");
        assert_eq!(content.matches("text:style-name=\"Pagebreak\"").count(), 1, "only One's: {content}");
        assert_eq!(content.matches("text:style-name=\"GkLook").count(), 2, "{content}");
    }

    #[test]
    fn latex_follows_the_look_of_an_element() {
        use crate::document::fixtures::text;
        use crate::document::{Block, ElementLook, Section};
        let Some(s) = setup() else { return };
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        let mut r = request("chicago-author-date");
        let section = |level: u8, heading: &str| Section {
            level,
            heading: Some(vec![text(heading)]),
            blocks: vec![Block::paragraph(vec![text(&format!("Words of {heading}."))])],
            element: Some(heading.to_lowercase()),
            kind: None,
        };
        r.document.sections = vec![section(1, "One"), section(1, "Two"), section(2, "Within"), section(1, "Three")];
        r.format.title.placement = TitlePlacement::Top;
        // Two in larger type, on a page in landscape without its footer, its pages counted anew in roman.
        let mut two = r.format.clone();
        two.font.size = 14.0;
        two.footer.shown = false;
        two.header.shown = true;
        two.header.places.right = vec![crate::formats::Item::PageNumber];
        two.page.size = "custom".into();
        two.page.width = crate::formats::Length::mm(297.0);
        two.page.height = crate::formats::Length::mm(210.0);
        two.page.numbering = crate::formats::NumberStyle::RomanLower;
        two.page.restart = true;
        r.document.looks = vec![ElementLook { element: "two".into(), format: two }];

        let tex = out.join("looks.tex");
        export(&s.ctx(), &r, Target::Latex, &tex, &ExportOptions::default()).unwrap();
        let l = fs::read_to_string(&tex).unwrap();
        let at = |w: &str| l.find(w).unwrap_or_else(|| panic!("{w} in {l}"));
        assert!(l.contains("\\fancypagestyle{gklook") && l.contains("\\newcommand{\\gkopener}"), "{l}");
        let into = &l[at("\\section{One}")..at("\\section{Two}")];
        assert!(into.contains("\\clearpage") && into.contains("\\newgeometry{layoutwidth=841.89"), "{into}");
        assert!(into.contains("\\pagenumbering{roman}") && into.contains("\\gktype{14}{16.8}"), "{into}");
        // Back to the document's look after Within, which is Two's.
        let back = &l[at("\\subsection{Within}")..at("\\section{Three}")];
        assert!(back.contains("\\newgeometry{layoutwidth=595.28bp,layoutheight=841.89bp"), "{back}");
        assert!(back.contains("\\gdef\\thepage{\\arabic{page}}") && !back.contains("\\pagenumbering"), "{back}");
        assert!(back.contains("\\gktype{12}{14.4}"), "{back}");
        assert_eq!(l.matches("\\newgeometry").count(), 2, "no look elsewhere: {l}");

        // The PDF, where there is LaTeX: Two begins a page of its own, in landscape, numbered i.
        if s.tools.latex_engine().is_ok() {
            let pdf = out.join("looks.pdf");
            let e = export(&s.ctx(), &r, Target::PdfLatex, &pdf, &ExportOptions::default()).unwrap();
            assert!(fs::read(&pdf).unwrap().starts_with(b"%PDF"), "{:?}", e.warnings);
            let text = std::process::Command::new("pdftotext").args(["-layout"]).arg(&pdf).arg("-").output();
            if let Some(text) = text.ok().filter(|t| t.status.success()) {
                let pages: Vec<String> =
                    String::from_utf8_lossy(&text.stdout).split('\u{c}').map(|p| p.to_owned()).collect();
                let words = |n: usize| pages[n].split_whitespace().collect::<Vec<_>>().join(" ");
                assert!(words(0).contains("One") && !words(0).contains("Two"), "{pages:?}");
                assert!(words(1).starts_with("i ") && words(1).contains("Two Words of Two."), "{pages:?}");
                assert!(words(2).contains("Three") && words(2).ends_with('2'), "counted on from Two's one: {pages:?}");
            }
            // The body in two columns: they are ended for Two's new page and begun again after it.
            r.format.page.columns = 2;
            let e = export(&s.ctx(), &r, Target::PdfLatex, &pdf, &ExportOptions::default()).unwrap();
            assert!(fs::read(&pdf).unwrap().starts_with(b"%PDF"), "{:?}", e.warnings);
        } else {
            eprintln!("LaTeX is not installed: the PDF of the looks by LaTeX is not tested");
        }
    }

    #[test]
    fn headings_are_numbered_level_by_level_in_every_document() {
        use crate::document::fixtures::text;
        use crate::document::{Block, Section};
        use crate::formats::LevelNumbering;
        let Some(s) = setup() else { return };
        let mut r = request("chicago-author-date");
        let section = |level: u8, heading: &str| Section {
            level,
            heading: Some(vec![text(heading)]),
            blocks: vec![Block::paragraph(vec![text("Words.")])],
            element: Some(heading.to_lowercase()),
            kind: None,
        };
        r.document.sections = vec![section(1, "One"), section(2, "Inner"), section(1, "Two")];
        r.format.headings.numbered = true;
        r.format.headings.levels[0].numbering = LevelNumbering::Roman;
        r.format.headings.levels[1].numbering = LevelNumbering::None;
        r.key = "numbered-levels".into();
        let p = preview(&s.ctx(), &r).unwrap();
        assert!(p.warnings.is_empty(), "{:?}", p.warnings);
        let source = fs::read_to_string(s.work.join("numbered-levels/preview/document.typ")).unwrap();
        assert!(
            source.contains("#set heading(numbering: (..nums) => {\n  let styles = (\"I\", none, none,)"),
            "{source}"
        );
        let words: Vec<&str> = p.pages.iter().flat_map(|p| p.texts.iter().map(|t| t.text.trim())).collect();
        let place = |w: &str| words.iter().position(|x| *x == w).unwrap_or_else(|| panic!("{w} in {words:?}"));
        assert!(place("I") < place("One") && place("One") < place("Inner") && place("II") < place("Two"), "{words:?}");
        assert_eq!(words[place("Inner") - 1], "Words.", "the second level is not numbered: {words:?}");

        // Word and LaTeX: the numbers written into the headings by the core.
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        let docx = out.join("numbered.docx");
        export(&s.ctx(), &r, Target::Docx, &docx, &ExportOptions::default()).unwrap();
        let document = unzip(&docx, "word/document.xml");
        assert!(at(&document, ">II<") < at(&document, "Two"), "{document}");
        assert!(!document.contains(">1<"), "{document}");
        let tex = out.join("numbered.tex");
        export(&s.ctx(), &r, Target::Latex, &tex, &ExportOptions::default()).unwrap();
        let l = fs::read_to_string(&tex).unwrap();
        assert!(l.contains("II Two"), "{l}");
        assert!(!l.contains("\\thesection"), "LaTeX numbers nothing itself: {l}");
    }

    #[test]
    fn chapters_begin_on_right_hand_pages_with_bare_openers() {
        use crate::document::fixtures::text;
        use crate::document::{Block, Section};
        use crate::formats::{Begins, Item, Margin, Sides};
        let Some(s) = setup() else { return };
        let mut r = request("chicago-author-date");
        // Three chapters, the second long enough for pages that are no openers.
        let para = |w: &str| Block::paragraph(vec![text(&w.repeat(40))]);
        r.document.sections = (1..=3)
            .map(|n| Section {
                level: 1,
                heading: Some(vec![text(&format!("Chapter {n}"))]),
                blocks: if n == 2 {
                    (0..30).map(|_| para("Many words follow. ")).collect()
                } else {
                    vec![para("One. ")]
                },
                element: Some(format!("c{n}")),
                kind: None,
            })
            .collect();
        r.format.headings.levels[0].begins = Begins::RightPage;
        r.format.footer.openers = false;
        r.format.header = Margin {
            shown: true,
            openers: false,
            places: Sides { right: vec![Item::Text { text: "Running".into() }], ..Default::default() },
            ..Default::default()
        };
        r.key = "right-hand".into();
        let p = preview(&s.ctx(), &r).unwrap();
        assert!(p.warnings.is_empty(), "{:?}", p.warnings);
        let source = fs::read_to_string(s.work.join("right-hand/preview/document.typ")).unwrap();
        assert_eq!(
            source.matches("#pagebreak(weak: true, to: \"odd\")\n#metadata(\"opener\") <gk-opener>").count(),
            3,
            "{source}"
        );

        let (mut blank, mut plain) = (0, 0);
        for page in &p.pages {
            let words: Vec<&str> = page.texts.iter().map(|t| t.text.trim()).collect();
            let number = page.number.to_string();
            if words.iter().any(|w| w.starts_with("Chapter")) {
                assert!(page.number % 2 == 1, "a chapter on a left page: {} {words:?}", page.number);
                assert!(
                    !words.contains(&"Running") && !words.contains(&number.as_str()),
                    "an opener is bare: {words:?}"
                );
            } else if words.is_empty() {
                assert!(page.number % 2 == 0, "a blank page on the right: {}", page.number);
                blank += 1;
            } else {
                assert!(words.contains(&"Running") && words.contains(&number.as_str()), "{} {words:?}", page.number);
                plain += 1;
            }
        }
        assert!(blank >= 1 && plain >= 1, "{blank} blank, {plain} plain, of {}", p.count);

        // Word: the chapters begin sections on odd pages, whose first page has the openers' header.
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        let docx = out.join("right-hand.docx");
        export(&s.ctx(), &r, Target::Docx, &docx, &ExportOptions::default()).unwrap();
        let document = unzip(&docx, "word/document.xml");
        roxmltree::Document::parse(&document).unwrap();
        assert_eq!(document.matches("<w:type w:val=\"oddPage\"/>").count(), 3, "{document}");
        assert!(document.contains("<w:headerReference w:type=\"first\" r:id=\"rIdGkheaderOpenerxml\"/>"), "{document}");
        assert!(unzip(&docx, "word/headerOpener.xml").contains("<w:tab/>"));
        assert!(!unzip(&docx, "word/headerOpener.xml").contains("Running"));
        assert!(unzip(&docx, "word/header1.xml").contains("Running"));
        // LaTeX: a right-hand page before each, and the openers' style of page.
        let tex = out.join("right-hand.tex");
        export(&s.ctx(), &r, Target::Latex, &tex, &ExportOptions::default()).unwrap();
        let l = fs::read_to_string(&tex).unwrap();
        assert_eq!(
            l.matches("\\ifodd\\value{page}\\else\\hbox{}\\thispagestyle{empty}\\newpage\\fi\\thispagestyle{opener}")
                .count(),
            3,
            "{l}"
        );
    }

    #[test]
    fn every_format_that_comes_with_the_application_makes_pages() {
        let Some(s) = setup() else { return };
        let formats = crate::formats::Formats::new(&s.resources, &s.work.join("formats"));
        for (format, _) in formats.all() {
            let mut r = request(format.style.as_deref().unwrap_or("chicago-notes-bibliography"));
            r.key = format!("format-{}", format.id);
            r.format = format.clone();
            let p = preview(&s.ctx(), &r).unwrap_or_else(|e| panic!("{}: {e}", format.id));
            assert!(!p.pages.is_empty(), "{}", format.id);
            assert!(p.warnings.is_empty(), "{}: {:?}", format.id, p.warnings);
        }
    }

    #[test]
    fn a_screenplay_is_set_as_scripts_are() {
        use crate::document::fixtures::text;
        use crate::document::{Block, Section};
        let Some(s) = setup() else { return };
        let formats = crate::formats::Formats::new(&s.resources, &s.work.join("formats"));
        let screenplay = formats.all().into_iter().map(|(f, _)| f).find(|f| f.id == "screenplay").unwrap();
        let mut r = request("chicago-notes-bibliography");
        r.format = screenplay;
        let part = |part: &str, words: &str| Block::of_kind(part, vec![text(words)]);
        r.document.sections.push(Section {
            level: 1,
            heading: Some(vec![text("Act one")]),
            blocks: vec![
                part("scene", "Int. Palace – night"),
                part("action", "Medea paces. The nurse watches."),
                part("character", "Nurse"),
                part("parenthetical", "quietly"),
                part("dialogue", "If only the Argo had never flown."),
                part("transition", "Cut to:"),
            ],
            element: Some("act".into()),
            kind: None,
        });
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        let typ = out.join("script.typ");
        export(&s.ctx(), &r, Target::Typst, &typ, &ExportOptions::default()).unwrap();
        let t = fs::read_to_string(&typ).unwrap();
        // The parts are blocks with labels; the capitals are set by the rules of the opening.
        assert!(t.contains("<gk-kind-scene>") && t.contains("<gk-kind-dialogue>"), "{t}");
        assert!(t.contains("Int. Palace") && t.contains("Nurse") && t.contains("Cut to:"), "{t}");
        let scene = t.find("#show <gk-kind-scene>").expect("a rule for scene headings");
        assert!(t[scene..].lines().take(6).any(|l| l.contains("upper(it.body)")), "{t}");
        assert_eq!(t.matches("(quietly)").count(), 1, "the parentheses are put in once: {t}");
        let p = preview(&s.ctx(), &r).unwrap();
        assert!(p.warnings.is_empty(), "{:?}", p.warnings);
        let tex = out.join("script.tex");
        export(&s.ctx(), &r, Target::Latex, &tex, &ExportOptions::default()).unwrap();
        let l = fs::read_to_string(&tex).unwrap();
        assert!(l.contains("\\leftskip=5.6cm") && l.contains("NURSE"), "{l}");
        assert!(l.contains("\\noindent (quietly)"), "{l}");
        let docx = out.join("script.docx");
        export(&s.ctx(), &r, Target::Docx, &docx, &ExportOptions::default()).unwrap();
        let xml = unzip(&docx, "word/document.xml");
        assert!(xml.contains("SceneHeading") && xml.contains("Dialogue"), "{xml}");
    }

    #[test]
    fn a_chapter_begins_a_new_page_where_the_format_says() {
        let Some(s) = setup() else { return };
        let formats = crate::formats::Formats::new(&s.resources, &s.work.join("formats"));
        let novel = formats.all().into_iter().map(|(f, _)| f).find(|f| f.id == "novel-manuscript").unwrap();
        assert_eq!(novel.headings.levels[0].begins, crate::formats::Begins::Page);
        let mut r = request("chicago-notes-bibliography");
        r.format = novel;
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        let typ = out.join("novel.typ");
        export(&s.ctx(), &r, Target::Typst, &typ, &ExportOptions::default()).unwrap();
        let t = fs::read_to_string(&typ).unwrap();
        let heading = t.find("= The word").expect("a heading of the first level");
        // The break of the page and the mark of the opener, then the mark of the element, then the heading.
        let before = t[..heading].trim_end().trim_end_matches("#metadata(\"e1\") <gk-el-e1>").trim_end();
        assert!(
            before.ends_with("#pagebreak(weak: true)\n#metadata(\"opener\") <gk-opener>"),
            "{}",
            &t[heading.saturating_sub(80)..heading]
        );
        let tex = out.join("novel.tex");
        export(&s.ctx(), &r, Target::Latex, &tex, &ExportOptions::default()).unwrap();
        let l = fs::read_to_string(&tex).unwrap();
        assert!(l.contains("\\clearpage\\thispagestyle{opener}\n\n\\section"), "{l}");
    }

    #[test]
    fn notes_at_the_end_and_a_style_with_notes() {
        let Some(s) = setup() else { return };
        let mut r = request("chicago-notes-bibliography");
        r.format.notes.kind = NoteKind::Endnotes;
        r.format.notes.title = "Endnotes".into();
        let p = preview(&s.ctx(), &r).unwrap();
        assert!(p.warnings.is_empty(), "{:?}", p.warnings);
        let source = fs::read_to_string(s.work.join("test/preview/document.typ")).unwrap();
        assert!(!source.contains("#footnote["));
        assert!(source.contains("Endnotes"));
        assert!(source.contains("<gk-notes>"));
        // The note made by the citation and the note written by hand are both there.
        assert!(source.contains("#super[1]") && source.contains("#super[2]"), "{source}");
    }

    /// The first note written by hand in the sample, set to a place.
    fn place_first_note(r: &mut Request, place: NotePlace) {
        for section in &mut r.document.sections {
            for block in &mut section.blocks {
                if let crate::document::Block::Paragraph { content, .. } = block {
                    for inline in content.iter_mut() {
                        if let Inline::Footnote { place: p, .. } = inline {
                            *p = Some(place);
                            return;
                        }
                    }
                }
            }
        }
        panic!("the sample has no note");
    }

    #[test]
    fn a_note_set_against_the_format() {
        let Some(s) = setup() else { return };

        // The format has its notes at the foot; one is set to stand at the end.
        let mut r = request("chicago-author-date");
        place_first_note(&mut r, NotePlace::End);
        let p = preview(&s.ctx(), &r).unwrap();
        assert!(p.warnings.is_empty(), "{:?}", p.warnings);
        let source = fs::read_to_string(s.work.join("test/preview/document.typ")).unwrap();
        assert!(source.contains("<gk-notes>") && source.contains("#super[a]"), "{source}");
        assert!(source.contains("a. So the scholia") || source.contains("a. "), "{source}");
        assert!(!source.contains("numbering: \"a\""), "the notes at the foot, if any, keep their numbers");

        // The format has its notes at the end; one is set to stand at the foot.
        let mut r = request("chicago-notes-bibliography");
        r.format.notes.kind = NoteKind::Endnotes;
        place_first_note(&mut r, NotePlace::Foot);
        let p = preview(&s.ctx(), &r).unwrap();
        assert!(p.warnings.is_empty(), "{:?}", p.warnings);
        let source = fs::read_to_string(s.work.join("test/preview/document.typ")).unwrap();
        assert!(source.contains("#footnote["), "{source}");
        assert!(source.contains("#set footnote(numbering: \"a\")"));
        assert!(source.contains("#super[1]"), "the notes of the reference style are at the end, numbered");
        assert_eq!(source.matches("#footnote[").count(), 1);

        // In the documents that are exported the notes at the foot are lettered as well.
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        let docx = out.join("mixed.docx");
        export(&s.ctx(), &r, Target::Docx, &docx, &ExportOptions::default()).unwrap();
        assert!(unzip(&docx, "word/document.xml").contains("w:numFmt w:val=\"lowerLetter\""));
        assert!(unzip(&docx, "word/footnotes.xml").contains("So the scholia"));
        let odt = out.join("mixed.odt");
        export(&s.ctx(), &r, Target::Odt, &odt, &ExportOptions::default()).unwrap();
        let styles = unzip(&odt, "styles.xml");
        let settings: Vec<&str> = styles
            .split("<text:notes-configuration")
            .skip(1)
            .map(|rest| rest.split('>').next().unwrap_or(""))
            .filter(|tag| tag.contains("text:note-class=\"footnote\""))
            .collect();
        assert_eq!(settings.len(), 1, "{settings:?}");
        assert!(settings[0].contains("style:num-format=\"a\""), "{settings:?}");
        let tex = out.join("mixed.tex");
        export(&s.ctx(), &r, Target::Latex, &tex, &ExportOptions::default()).unwrap();
        assert!(fs::read_to_string(&tex).unwrap().contains("\\alph{footnote}"));

        // A note set to where the format has its notes anyway changes nothing.
        let mut r = request("chicago-author-date");
        place_first_note(&mut r, NotePlace::Foot);
        preview(&s.ctx(), &r).unwrap();
        let source = fs::read_to_string(s.work.join("test/preview/document.typ")).unwrap();
        assert!(source.contains("#footnote["));
        assert!(!source.contains("#super[a]") && !source.contains("numbering: \"a\""), "{source}");
    }

    #[test]
    fn a_reference_that_is_nowhere() {
        let Some(s) = setup() else { return };
        let mut r = request("chicago-author-date");
        r.document.references.remove(0);
        let p = preview(&s.ctx(), &r).unwrap();
        assert_eq!(p.missing, vec!["r1"]);
        let source = fs::read_to_string(s.work.join("test/preview/document.typ")).unwrap();
        assert!(source.contains("reference not found"));
    }

    fn unzip(path: &Path, name: &str) -> String {
        use std::io::Read;
        let mut archive = zip::ZipArchive::new(fs::File::open(path).unwrap()).unwrap();
        let mut file = archive.by_name(name).unwrap();
        let mut s = String::new();
        file.read_to_string(&mut s).unwrap();
        s
    }

    #[test]
    fn breaks_and_columns_in_every_kind_of_document() {
        use crate::document::fixtures::text;
        use crate::document::{Block, BreakKind};
        let Some(s) = setup() else { return };
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        let mut r = request("chicago-author-date");
        r.format.page.columns = 2;
        r.format.page.column_gap = crate::formats::Length::cm(0.8);
        let blocks = &mut r.document.sections[1].blocks;
        blocks.push(Block::Break { what: BreakKind::Page });
        blocks.push(Block::paragraph(vec![text("At the top of a page.")]));
        blocks.push(Block::Break { what: BreakKind::Column });
        blocks.push(Block::paragraph(vec![text("At the top of a column.")]));

        // Typst: the page in two columns, and its own breaks; the pages are made.
        let typ = out.join("columns.typ");
        export(&s.ctx(), &r, Target::Typst, &typ, &ExportOptions::default()).unwrap();
        let t = fs::read_to_string(&typ).unwrap();
        assert!(t.contains("\n  columns: 2,\n") && t.contains("#set columns(gutter: 0.8cm)"), "{t}");
        assert!(t.contains("#pagebreak()") && t.contains("#colbreak()"), "{t}");
        let p = preview(&s.ctx(), &r).unwrap();
        assert!(p.warnings.is_empty(), "{:?}", p.warnings);
        assert!(p.pages.len() >= 2, "a break of the page makes a page");

        // LaTeX: the body in a `multicols`, and its breaks.
        let tex = out.join("columns.tex");
        export(&s.ctx(), &r, Target::Latex, &tex, &ExportOptions::default()).unwrap();
        let l = fs::read_to_string(&tex).unwrap();
        assert!(l.contains("\\usepackage{multicol}") && l.contains("\\setlength{\\columnsep}{0.8cm}"), "{l}");
        let open = l.find("\\begin{multicols}{2}").expect("the body in two columns");
        let close = l.rfind("\\end{multicols}").expect("and their end");
        let column = l.find("\\columnbreak").expect("a break of the column");
        assert!(open < column && column < close, "{l}");
        assert!(
            l.contains("\\end{multicols}\\newpage\\begin{multicols}{2}"),
            "a new page begun outside the columns: {l}"
        );
        if s.tools.latex_engine().is_ok() {
            let pdf = out.join("columns.pdf");
            let e = export(&s.ctx(), &r, Target::PdfLatex, &pdf, &ExportOptions::default()).unwrap();
            assert!(fs::read(&pdf).unwrap().starts_with(b"%PDF"), "{:?}", e.warnings);
        }

        // Word: the section in two columns, and breaks of the page and the column.
        let docx = out.join("columns.docx");
        let e = export(&s.ctx(), &r, Target::Docx, &docx, &ExportOptions::default()).unwrap();
        assert!(e.warnings.is_empty(), "{:?}", e.warnings);
        let document = unzip(&docx, "word/document.xml");
        roxmltree::Document::parse(&document).unwrap();
        let section = &document[document.rfind("<w:sectPr").unwrap_or(0)..];
        assert!(section.contains("<w:cols w:num=\"2\""), "{section}");
        assert!(document.contains("w:br w:type=\"column\"") && document.contains("w:br w:type=\"page\""), "{document}");

        // Writer: the page style in two columns, and the breaks paragraphs in styles that break.
        let odt = out.join("columns.odt");
        let e = export(&s.ctx(), &r, Target::Odt, &odt, &ExportOptions::default()).unwrap();
        assert!(e.warnings.is_empty(), "{:?}", e.warnings);
        let content = unzip(&odt, "content.xml");
        roxmltree::Document::parse(&content).unwrap();
        let styles = unzip(&odt, "styles.xml");
        roxmltree::Document::parse(&styles).unwrap();
        assert!(styles.contains("fo:column-count=\"2\""), "{styles}");
        for (name, what) in [("Page_20_Break", "page"), ("Column_20_Break", "column")] {
            assert!(content.contains(&format!("text:style-name=\"{name}\"")), "{name}: {content}");
            let at = styles.find(&format!("style:name=\"{name}\"")).unwrap_or_else(|| panic!("no {name}"));
            assert!(styles[at..].contains(&format!("fo:break-before=\"{what}\"")), "{styles}");
        }

        // A page of the web is told by its style; Markdown as TeX writes it.
        let html = out.join("columns.html");
        export(&s.ctx(), &r, Target::Html, &html, &ExportOptions::default()).unwrap();
        let h = fs::read_to_string(&html).unwrap();
        assert!(h.contains("break-before: page") && h.contains("break-before: column"), "{h}");
        let md = out.join("columns.md");
        export(&s.ctx(), &r, Target::Markdown, &md, &ExportOptions::default()).unwrap();
        let m = fs::read_to_string(&md).unwrap();
        assert!(m.contains("\\newpage") && !m.contains("break-before"), "{m}");
    }

    #[test]
    fn the_title_page_stands_where_the_template_puts_it_or_nowhere() {
        let Some(s) = setup() else { return };
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        use GeneratedPart::{Bibliography, Body, HalfTitle, TitlePage};
        let made = |part| ContentsItem::Part { part };
        let styles = ["Title", "Subtitle", "Author", "Affiliation", "Date"];
        let mut r = request("chicago-author-date");
        r.document.subtitle = Some("A study of the Iliad".into());
        r.document.date = Some("2026".into());
        r.document.contributors[0].affiliation = Some("The University".into());
        r.format.title.show_date = true;

        // A book's order: the half title, a page, then the title page with all that stands on
        // it, then the text; as the preview has it, not the title block at the head.
        r.template = Template {
            contents: vec![made(HalfTitle), made(TitlePage), made(Body), made(Bibliography)],
            ..Template::plain()
        };
        let docx = out.join("book.docx");
        export(&s.ctx(), &r, Target::Docx, &docx, &ExportOptions::default()).unwrap();
        let x = unzip(&docx, "word/document.xml");
        roxmltree::Document::parse(&x).unwrap();
        assert_eq!(x.matches("w:val=\"Title\"").count(), 2, "the half title and the title: {x}");
        let half = at(&x, "w:val=\"Title\"");
        let title = half + 1 + at(&x[half + 1..], "w:val=\"Title\"");
        let page = at(&x, "w:br w:type=\"page\"");
        assert!(half < page && page < title, "{x}");
        for style in &styles[1..] {
            let found = at(&x, &format!("w:val=\"{style}\""));
            assert!(title < found && found < at(&x, "Before the first section."), "{style}: {x}");
        }
        assert!(x.contains("A study of the Iliad") && x.contains("The University") && x.contains(">2026<"), "{x}");
        let odt = out.join("book.odt");
        export(&s.ctx(), &r, Target::Odt, &odt, &ExportOptions::default()).unwrap();
        let c = unzip(&odt, "content.xml");
        assert_eq!(c.matches("text:style-name=\"Title\"").count(), 2, "{c}");
        assert!(at(&c, "text:style-name=\"Affiliation\"") < at(&c, "Before the first section."), "{c}");

        // No title page in the template: none in the document, and the title and the
        // author in the file's properties all the same.
        r.template = Template { contents: vec![made(Body), made(Bibliography)], ..Template::plain() };
        let docx = out.join("none.docx");
        export(&s.ctx(), &r, Target::Docx, &docx, &ExportOptions::default()).unwrap();
        let x = unzip(&docx, "word/document.xml");
        for style in styles {
            assert!(!x.contains(&format!("w:val=\"{style}\"")), "{style}: {x}");
        }
        assert!(!x.contains("A study of the Iliad"), "{x}");
        let core = unzip(&docx, "docProps/core.xml");
        assert!(core.contains("<dc:title>Wrath and the hero</dc:title>"), "{core}");
        assert!(core.contains("<dc:creator>A. Scholar</dc:creator>"), "{core}");
        let odt = out.join("none.odt");
        export(&s.ctx(), &r, Target::Odt, &odt, &ExportOptions::default()).unwrap();
        let c = unzip(&odt, "content.xml");
        for style in styles {
            assert!(!c.contains(&format!("text:style-name=\"{style}\"")), "{style}: {c}");
        }
        let meta = unzip(&odt, "meta.xml");
        assert!(meta.contains("<dc:title>Wrath and the hero</dc:title>"), "{meta}");
        assert!(meta.contains("<dc:creator>A. Scholar</dc:creator>"), "{meta}");

        // Anonymous, for review: the author neither on the page nor in the properties.
        r.template = Template::plain();
        r.format.title.anonymous = true;
        let docx = out.join("anonymous.docx");
        export(&s.ctx(), &r, Target::Docx, &docx, &ExportOptions::default()).unwrap();
        assert!(!unzip(&docx, "word/document.xml").contains("w:val=\"Author\""));
        let core = unzip(&docx, "docProps/core.xml");
        assert!(!core.contains("A. Scholar"), "{core}");
        // The authors not shown on the page: still named in the properties, which are no page.
        r.format.title.anonymous = false;
        r.format.title.show_authors = false;
        let docx = out.join("unnamed.docx");
        export(&s.ctx(), &r, Target::Docx, &docx, &ExportOptions::default()).unwrap();
        assert!(!unzip(&docx, "word/document.xml").contains("w:val=\"Author\""));
        assert!(unzip(&docx, "docProps/core.xml").contains("<dc:creator>A. Scholar</dc:creator>"));
    }

    #[test]
    fn an_anonymous_front_page_leaves_the_authors_out_of_what_latex_and_html_say_of_themselves() {
        let Some(s) = setup() else { return };
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        let mut r = with_parts();
        // Named: the PDF's properties and the page's head name the author.
        let tex = out.join("named.tex");
        export(&s.ctx(), &r, Target::Latex, &tex, &ExportOptions::default()).unwrap();
        assert!(fs::read_to_string(&tex).unwrap().contains("pdfauthor={A. Scholar}"));
        let html = out.join("named.html");
        export(&s.ctx(), &r, Target::Html, &html, &ExportOptions::default()).unwrap();
        let page = fs::read_to_string(&html).unwrap();
        assert!(page.contains("<meta name=\"author\" content=\"A. Scholar\""), "{page}");

        // Anonymous: neither says who wrote it, on the page or off it.
        r.format.title.anonymous = true;
        let tex = out.join("anonymous.tex");
        export(&s.ctx(), &r, Target::Latex, &tex, &ExportOptions::default()).unwrap();
        let l = fs::read_to_string(&tex).unwrap();
        assert!(!l.contains("pdfauthor"), "{l}");
        assert!(!l.contains("A. Scholar"), "{l}");
        assert!(l.contains("pdftitle={Wrath and the hero}"), "the title is still said: {l}");
        let html = out.join("anonymous.html");
        export(&s.ctx(), &r, Target::Html, &html, &ExportOptions::default()).unwrap();
        let page = fs::read_to_string(&html).unwrap();
        assert!(!page.contains("A. Scholar"), "{page}");
        assert!(!page.contains("name=\"author\""), "{page}");
    }

    #[test]
    fn the_editors_and_the_translators_stand_on_the_title_page_in_lines_of_their_own() {
        use crate::document::{Contributor, Role};
        let Some(s) = setup() else { return };
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        let person = |role, name: &str| Contributor { role, name: name.into(), ..Default::default() };
        let mut r = request("chicago-author-date");
        r.document.contributors = vec![
            person(Role::Author, "A. Scholar"),
            person(Role::Editor, "B. Editor"),
            person(Role::Translator, "C. One"),
            person(Role::Translator, "D. Other"),
        ];
        r.document.date = Some("2026".into());
        r.format.title.show_date = true;
        let (edited, translated) = ("Edited by B. Editor", "Translated by C. One and D. Other");

        // Word: the authors, then a paragraph of the style Role for each role, then the date;
        // the editors and the translators named in the file's own properties.
        let docx = out.join("roles.docx");
        export(&s.ctx(), &r, Target::Docx, &docx, &ExportOptions::default()).unwrap();
        let x = unzip(&docx, "word/document.xml");
        let role = at(&x, "w:val=\"Role\"");
        assert!(at(&x, "w:val=\"Author\"") < role && role < at(&x, edited), "{x}");
        assert!(at(&x, edited) < at(&x, translated) && at(&x, translated) < at(&x, "w:val=\"Date\""), "{x}");
        let custom = unzip(&docx, "docProps/custom.xml");
        assert!(custom.contains("name=\"editor\"") && custom.contains("B. Editor"), "{custom}");
        assert!(custom.contains("name=\"translator\"") && custom.contains("C. One; D. Other"), "{custom}");
        assert!(unzip(&docx, "docProps/core.xml").contains("<dc:creator>A. Scholar</dc:creator>"));
        // Writer: the same, and its properties.
        let odt = out.join("roles.odt");
        export(&s.ctx(), &r, Target::Odt, &odt, &ExportOptions::default()).unwrap();
        let c = unzip(&odt, "content.xml");
        assert!(at(&c, "text:style-name=\"Role\"") < at(&c, translated), "{c}");
        let meta = unzip(&odt, "meta.xml");
        assert!(meta.contains("meta:name=\"translator\"") && meta.contains("C. One; D. Other"), "{meta}");
        // LaTeX: within the author, each a line of its own.
        let tex = out.join("roles.tex");
        export(&s.ctx(), &r, Target::Latex, &tex, &ExportOptions::default()).unwrap();
        let l = fs::read_to_string(&tex).unwrap();
        assert!(l.contains(&format!("\\author{{A. Scholar\\\\{edited}\\\\{translated}}}")), "{l}");
        // A page of the web, and Typst.
        let html = out.join("roles.html");
        export(&s.ctx(), &r, Target::Html, &html, &ExportOptions::default()).unwrap();
        let h = fs::read_to_string(&html).unwrap();
        assert!(at(&h, "class=\"gk-authors\"") < at(&h, "class=\"gk-roles\""), "{h}");
        assert!(at(&h, translated) < at(&h, "class=\"gk-date\""), "{h}");
        assert!(h.contains(".gk-roles p {"), "{h}");
        let typ = out.join("roles.typ");
        export(&s.ctx(), &r, Target::Typst, &typ, &ExportOptions::default()).unwrap();
        let t = fs::read_to_string(&typ).unwrap();
        assert!(at(&t, "] <gk-authors>") < at(&t, translated) && at(&t, translated) < at(&t, "] <gk-roles>"), "{t}");
        assert!(at(&t, "] <gk-roles>") < at(&t, "] <gk-date>") && t.contains("#show <gk-roles>"), "{t}");
        // Markdown at its head, the e-book in its package with their roles.
        let md = out.join("roles.md");
        export(&s.ctx(), &r, Target::Markdown, &md, &ExportOptions::default()).unwrap();
        let m = fs::read_to_string(&md).unwrap();
        assert!(m.contains("editor:") && m.contains("translator:") && m.contains("D. Other"), "{m}");
        let epub = out.join("roles.epub");
        export(&s.ctx(), &r, Target::Epub, &epub, &ExportOptions::default()).unwrap();
        let opf = unzip(&epub, "EPUB/content.opf");
        assert!(opf.contains("B. Editor</dc:contributor>") && opf.contains("D. Other</dc:contributor>"), "{opf}");
        assert!(opf.contains(">edt</meta>") && opf.contains(">trl</meta>"), "{opf}");

        // The header names the translators where it is told to.
        let mut headed = r.clone();
        headed.format.header.shown = true;
        headed.format.header.places.left = vec![crate::formats::Item::Translator];
        let typ = out.join("headed.typ");
        export(&s.ctx(), &headed, Target::Typst, &typ, &ExportOptions::default()).unwrap();
        assert!(fs::read_to_string(&typ).unwrap().contains("text(\"C. One, D. Other\")"));

        // No author: the translator's line stands where the authors would.
        r.document.contributors = vec![person(Role::Translator, "C. One")];
        let tex = out.join("translated.tex");
        export(&s.ctx(), &r, Target::Latex, &tex, &ExportOptions::default()).unwrap();
        let l = fs::read_to_string(&tex).unwrap();
        assert!(l.contains("\\author{Translated by C. One}"), "{l}");
        let docx = out.join("translated.docx");
        export(&s.ctx(), &r, Target::Docx, &docx, &ExportOptions::default()).unwrap();
        let x = unzip(&docx, "word/document.xml");
        assert!(!x.contains("w:val=\"Author\"") && at(&x, "w:val=\"Title\"") < at(&x, "w:val=\"Role\""), "{x}");

        // The same person edited and translated: one line.
        r.document.contributors =
            vec![person(Role::Author, "A. Scholar"), person(Role::Editor, "B. E"), person(Role::Translator, "B. E")];
        let html = out.join("both.html");
        export(&s.ctx(), &r, Target::Html, &html, &ExportOptions::default()).unwrap();
        let h = fs::read_to_string(&html).unwrap();
        assert!(h.contains("Edited and translated by B. E") && !h.contains("Edited by"), "{h}");

        // In the language of the document; three names with the word for and.
        r.document.language = Some("nb".into());
        r.document.contributors = ["C", "D", "E"].map(|n| person(Role::Translator, n)).to_vec();
        let html = out.join("norsk.html");
        export(&s.ctx(), &r, Target::Html, &html, &ExportOptions::default()).unwrap();
        assert!(fs::read_to_string(&html).unwrap().contains("Oversatt av C, D og E"));
        r.document.language = None;

        // Without the switch of the roles: no lines on the page; the properties still name them.
        r.document.contributors = vec![person(Role::Author, "A. Scholar"), person(Role::Translator, "C. One")];
        r.format.title.show_roles = false;
        let docx = out.join("unroled.docx");
        export(&s.ctx(), &r, Target::Docx, &docx, &ExportOptions::default()).unwrap();
        let x = unzip(&docx, "word/document.xml");
        assert!(!x.contains("w:val=\"Role\"") && !x.contains("C. One"), "{x}");
        assert!(unzip(&docx, "docProps/custom.xml").contains("C. One"));

        // Anonymous: nobody, on the page or off it.
        r.format.title.show_roles = true;
        r.format.title.anonymous = true;
        let docx = out.join("anonymous.docx");
        export(&s.ctx(), &r, Target::Docx, &docx, &ExportOptions::default()).unwrap();
        let x = unzip(&docx, "word/document.xml");
        assert!(!x.contains("w:val=\"Role\"") && !x.contains("C. One"), "{x}");
        let archive = zip::ZipArchive::new(fs::File::open(&docx).unwrap()).unwrap();
        let names: Vec<String> = archive.file_names().map(str::to_owned).collect();
        assert!(names.iter().all(|n| !n.ends_with(".xml") || !unzip(&docx, n).contains("C. One")), "{names:?}");
        let epub = out.join("anonymous.epub");
        export(&s.ctx(), &r, Target::Epub, &epub, &ExportOptions::default()).unwrap();
        assert!(!unzip(&epub, "EPUB/content.opf").contains("C. One"));
    }

    #[test]
    fn the_title_page_and_the_lists_stand_where_the_template_puts_them_in_latex() {
        let Some(s) = setup() else { return };
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        use GeneratedPart::{Bibliography, Body, HalfTitle, TitlePage};
        let made = |part| ContentsItem::Part { part };
        // An article: the title page, the abstract and the keywords, the contents, then the text.
        let mut r = with_parts();
        r.document.subtitle = Some("A study of the Iliad".into());
        r.document.contributors[0].affiliation = Some("The University".into());
        let tex = out.join("article.tex");
        export(&s.ctx(), &r, Target::Latex, &tex, &ExportOptions::default()).unwrap();
        let l = fs::read_to_string(&tex).unwrap();
        let begin = at(&l, "\\begin{document}");
        let title = at(&l, "\\title{Wrath and the hero");
        let made_title = at(&l, "\\maketitle");
        let abstract_at = at(&l, "\\begin{abstract}");
        let contents = at(&l, "\\tableofcontents");
        let body = at(&l, "Before the first section.");
        assert!(begin < title && title < made_title && made_title < abstract_at, "{l}");
        assert!(abstract_at < at(&l, "What the wrath of Achilles is.") && at(&l, "\\end{abstract}") < contents, "{l}");
        assert!(contents < body, "{l}");
        assert!(
            l[title..made_title].contains("A study of the Iliad") && l[title..made_title].contains("The University"),
            "{l}"
        );
        // The PDF says what it is, from the preamble, without printing it again.
        assert!(
            l[..begin].contains("pdftitle={Wrath and the hero}") && l[..begin].contains("pdfauthor={A. Scholar}"),
            "{l}"
        );
        assert_eq!(l.matches("\\maketitle").count(), 1, "{l}");
        assert_eq!(l.matches("\\tableofcontents").count(), 1, "{l}");

        // No title page in the template: none in the document, and the PDF's title all the same.
        r.template = Template { contents: vec![made(Body), made(Bibliography)], ..Template::plain() };
        let tex = out.join("untitled.tex");
        export(&s.ctx(), &r, Target::Latex, &tex, &ExportOptions::default()).unwrap();
        let l = fs::read_to_string(&tex).unwrap();
        assert!(!l.contains("\\maketitle") && !l.contains("\\title{"), "{l}");
        assert!(l.contains("pdftitle={Wrath and the hero}"), "{l}");

        // A book's order: the half title, a page, then the title.
        r.template = Template { contents: vec![made(HalfTitle), made(TitlePage), made(Body)], ..Template::plain() };
        let tex = out.join("book.tex");
        export(&s.ctx(), &r, Target::Latex, &tex, &ExportOptions::default()).unwrap();
        let l = fs::read_to_string(&tex).unwrap();
        let begin = at(&l, "\\begin{document}");
        let half = begin + at(&l[begin..], "Wrath and the hero");
        assert!(half < at(&l, "\\clearpage") && at(&l, "\\clearpage") < at(&l, "\\maketitle"), "{l}");
        if s.tools.latex_engine().is_ok() {
            let pdf = out.join("book.pdf");
            let e = export(&s.ctx(), &r, Target::PdfLatex, &pdf, &ExportOptions::default()).unwrap();
            assert!(fs::read(&pdf).unwrap().starts_with(b"%PDF"), "{:?}", e.warnings);
        }
    }

    #[test]
    fn the_contents_stand_where_the_template_puts_them_in_word_and_writer() {
        let Some(s) = setup() else { return };
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        // An article: the title page, the abstract and the keywords, then the contents, then the text.
        let r = with_parts();
        let docx = out.join("contents.docx");
        export(&s.ctx(), &r, Target::Docx, &docx, &ExportOptions::default()).unwrap();
        let x = unzip(&docx, "word/document.xml");
        roxmltree::Document::parse(&x).unwrap();
        let contents = at(&x, "TOC \\o");
        assert!(at(&x, "w:val=\"Title\"") < contents, "the contents after the title page: {x}");
        assert!(at(&x, "What the wrath of Achilles is.") < contents, "and after the abstract: {x}");
        assert!(contents < at(&x, "Before the first section."), "{x}");
        assert!(!x.contains("<!--gk:"), "{x}");
        let odt = out.join("contents.odt");
        export(&s.ctx(), &r, Target::Odt, &odt, &ExportOptions::default()).unwrap();
        let c = unzip(&odt, "content.xml");
        roxmltree::Document::parse(&c).unwrap();
        let contents = at(&c, "<text:table-of-content>");
        assert!(at(&c, "text:style-name=\"Title\"") < contents, "{c}");
        assert!(at(&c, "What the wrath of Achilles is.") < contents, "{c}");
        assert!(contents < at(&c, "Before the first section."), "{c}");
        assert!(!c.contains("<!--gk:"), "{c}");
    }

    #[test]
    fn the_title_page_stands_where_the_template_puts_it_on_the_web_and_in_a_book() {
        let Some(s) = setup() else { return };
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        use GeneratedPart::{Bibliography, Body};
        let made = |part| ContentsItem::Part { part };
        // An article: the title page, the abstract and the keywords, then the contents, then the text.
        let mut r = with_parts();
        r.document.date = Some("2026".into());
        let html = out.join("article.html");
        export(&s.ctx(), &r, Target::Html, &html, &ExportOptions::default()).unwrap();
        let h = fs::read_to_string(&html).unwrap();
        assert!(!h.contains("title-block-header"), "no title block of Pandoc's: {h}");
        assert!(h.contains("<title>Wrath and the hero</title>"), "the page's title in its head: {h}");
        assert!(h.contains("<meta name=\"author\" content=\"A. Scholar\""), "{h}");
        assert!(h.contains("<meta name=\"dcterms.date\" content=\"2026\""), "{h}");
        assert_eq!(h.matches("class=\"gk-title\"").count(), 1, "{h}");
        let front = at(&h, "class=\"gk-front\"");
        let abstract_at = at(&h, "class=\"abstract\"");
        let contents = at(&h, "<nav id=\"TOC\"");
        assert!(front < abstract_at && abstract_at < contents && contents < at(&h, "Before the first section."), "{h}");
        assert!(h.contains(".gk-title p {"), "the title page set as the layout's look of the title says: {h}");
        assert!(!h.contains("<!--gk:"), "{h}");

        let epub = out.join("article.epub");
        export(&s.ctx(), &r, Target::Epub, &epub, &ExportOptions::default()).unwrap();
        let archive = zip::ZipArchive::new(fs::File::open(&epub).unwrap()).unwrap();
        let names: Vec<String> = archive.file_names().map(str::to_owned).collect();
        let text: String = names.iter().filter(|n| n.starts_with("EPUB/text/")).map(|n| unzip(&epub, n)).collect();
        assert_eq!(text.matches("class=\"gk-title\"").count(), 1, "{text}");
        assert!(at(&text, "class=\"gk-title\"") < at(&text, "class=\"abstract\""), "{text}");
        let opf = unzip(&epub, "EPUB/content.opf");
        assert!(opf.contains("Wrath and the hero</dc:title>") && opf.contains("A. Scholar</dc:creator>"), "{opf}");
        let css: String = names.iter().filter(|n| n.ends_with(".css")).map(|n| unzip(&epub, n)).collect();
        assert!(css.contains(".gk-title p {"), "{css}");

        // Markdown keeps the title as metadata at its head, and writes no title page.
        let md = out.join("article.md");
        export(&s.ctx(), &r, Target::Markdown, &md, &ExportOptions::default()).unwrap();
        let m = fs::read_to_string(&md).unwrap();
        assert!(m.starts_with("---") && m.contains("title: Wrath and the hero") && m.contains("A. Scholar"), "{m}");
        assert!(!m.contains("gk-front"), "{m}");

        // No title page in the template: none on the page or in the book; their titles all the same.
        r.template = Template { contents: vec![made(Body), made(Bibliography)], ..Template::plain() };
        let html = out.join("untitled.html");
        export(&s.ctx(), &r, Target::Html, &html, &ExportOptions::default()).unwrap();
        let h = fs::read_to_string(&html).unwrap();
        assert!(!h.contains("class=\"gk-title\"") && !h.contains("class=\"gk-front\""), "{h}");
        assert!(h.contains("<title>Wrath and the hero</title>"), "{h}");
        let epub = out.join("untitled.epub");
        export(&s.ctx(), &r, Target::Epub, &epub, &ExportOptions::default()).unwrap();
        let archive = zip::ZipArchive::new(fs::File::open(&epub).unwrap()).unwrap();
        let names: Vec<String> = archive.file_names().map(str::to_owned).collect();
        let text: String = names.iter().filter(|n| n.starts_with("EPUB/text/")).map(|n| unzip(&epub, n)).collect();
        assert!(!text.contains("gk-title"), "{text}");
        assert!(unzip(&epub, "EPUB/content.opf").contains("Wrath and the hero</dc:title>"));
    }

    #[test]
    fn documents_for_word_processors() {
        let Some(s) = setup() else { return };
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        let mut r = request("chicago-author-date");
        r.format.page.size = "letter".into();
        r.format.footer.shown = false;
        r.format.header.shown = true;
        r.format.header.places.right = vec![crate::formats::Item::PageNumber];
        r.format.title.placement = TitlePlacement::OwnPage;
        r.format.bibliography.new_page = true;

        let docx = out.join("wrath.docx");
        let e = export(&s.ctx(), &r, Target::Docx, &docx, &ExportOptions::default()).unwrap();
        assert!(e.warnings.is_empty(), "{:?}", e.warnings);
        let document = unzip(&docx, "word/document.xml");
        roxmltree::Document::parse(&document).unwrap();
        assert!(document.contains("Nagy 1979, 73"));
        // Pandoc writes the attributes in an order of its own.
        let section = &document[document.rfind("<w:sectPr").unwrap_or(0)..];
        assert!(section.contains("w:w=\"12240\"") && section.contains("w:h=\"15840\""), "{section}");
        assert!(document.contains("w:headerReference"));
        assert!(document.contains("w:br w:type=\"page\""));
        assert!(document.contains("w:pStyle w:val=\"Bibliography\""));
        // The title page, written where the template puts it, in the styles of the reference
        // document, before the text; the abstract in its place after it, in its styles.
        assert_eq!(document.matches("w:pStyle w:val=\"Title\"").count(), 1, "{document}");
        assert_eq!(document.matches("w:pStyle w:val=\"Author\"").count(), 1, "{document}");
        assert!(at(&document, "w:val=\"Title\"") < at(&document, "w:val=\"AbstractTitle\""), "{document}");
        assert!(at(&document, "What the wrath of Achilles is.") < at(&document, "Before the first section."));
        // And the title and the author in the file's properties, which Pandoc was not given them for.
        let core = unzip(&docx, "docProps/core.xml");
        roxmltree::Document::parse(&core).unwrap();
        assert!(core.contains("<dc:title>Wrath and the hero</dc:title>"), "{core}");
        assert!(core.contains("<dc:creator>A. Scholar</dc:creator>"), "{core}");
        let styles = unzip(&docx, "word/styles.xml");
        assert!(styles.contains("w:line=\"480\""));
        assert!(styles.contains("w:styleId=\"Affiliation\""));
        assert!(unzip(&docx, "word/header1.xml").contains(" PAGE "));

        let odt = out.join("wrath.odt");
        let e = export(&s.ctx(), &r, Target::Odt, &odt, &ExportOptions::default()).unwrap();
        assert!(e.warnings.is_empty(), "{:?}", e.warnings);
        let content = unzip(&odt, "content.xml");
        roxmltree::Document::parse(&content).unwrap();
        assert!(content.contains("Nagy 1979, 73"));
        assert!(
            content.contains("text:style-name=\"Bibliography\""),
            "the entries of the bibliography have their style"
        );
        assert!(
            content.contains("<text:p text:style-name=\"Abstract\">What the wrath of Achilles is.</text:p>"),
            "{content}"
        );
        assert!(content.contains("<text:p text:style-name=\"AbstractTitle\">Abstract</text:p>"));
        assert_eq!(content.matches("text:style-name=\"Title\"").count(), 1, "{content}");
        assert!(at(&content, "text:style-name=\"Title\"") < at(&content, "AbstractTitle"), "{content}");
        let meta = unzip(&odt, "meta.xml");
        roxmltree::Document::parse(&meta).unwrap();
        assert!(meta.contains("<dc:title>Wrath and the hero</dc:title>"), "{meta}");
        assert!(meta.contains("<meta:initial-creator>A. Scholar</meta:initial-creator>"), "{meta}");
        let styles = unzip(&odt, "styles.xml");
        roxmltree::Document::parse(&styles).unwrap();
        assert!(styles.contains("style:name=\"Affiliation\""));
        assert!(styles.contains("fo:page-width=\"8.5000in\""));
        assert!(styles.contains("style:name=\"Bibliography\""));
        assert!(styles.contains("fo:line-height=\"200%\""));
    }

    #[test]
    fn a_making_that_is_stopped_writes_nothing() {
        let Some(s) = setup() else { return };
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        let r = request("chicago-author-date");
        for (target, name) in [(Target::Docx, "stopped.docx"), (Target::Pdf, "stopped.pdf")] {
            let path = out.join(name);
            let stopped = export_until(&s.ctx(), &r, target, &path, &ExportOptions::default(), &AtomicBool::new(true));
            assert!(matches!(stopped, Err(Error::Refused { kind, .. }) if kind == tools::STOPPED), "{stopped:?}");
            assert!(!path.exists());
        }
    }

    #[test]
    fn latex_markdown_and_pdf() {
        let Some(s) = setup() else { return };
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        let mut r = request("chicago-author-date");

        let tex = out.join("wrath.tex");
        export(&s.ctx(), &r, Target::Latex, &tex, &ExportOptions::default()).unwrap();
        let text = fs::read_to_string(&tex).unwrap();
        assert!(text.contains("\\documentclass"));
        assert!(text.contains("Nagy 1979, 73"));
        assert!(text.contains("\\titleformat{\\section}"));
        assert!(text.contains("\\setstretch{2}"));

        // A title with what LaTeX and the options of biblatex take as signs of their own.
        r.format.bibliography.title = "Works & Days, 100% [cited]".into();
        let e = export(&s.ctx(), &r, Target::Latex, &tex, &ExportOptions { biblatex: true }).unwrap();
        let text = fs::read_to_string(&tex).unwrap();
        assert!(text.contains("\\printbibliography[title={Works \\& Days, 100\\% [cited]}]"), "{text}");
        assert!(text.contains("\\autocite[73]{nagy1979}") || text.contains("\\autocite[\\pno~73]{nagy1979}"), "{text}");
        assert!(text.contains("\\addbibresource{wrath.bib}"));
        assert!(text.contains("style=chicago-authordate"));
        assert_eq!(e.also.len(), 1);
        assert!(fs::read_to_string(out.join("wrath.bib")).unwrap().contains("@book{nagy1979,"));

        let md = out.join("wrath.md");
        export(&s.ctx(), &r, Target::Markdown, &md, &ExportOptions::default()).unwrap();
        let text = fs::read_to_string(&md).unwrap();
        assert!(text.contains("# The word *mênis*"));
        assert!(text.contains("@nagy1979"));
        assert!(text.contains("\\*more\\*"), "what looks like markup in the text is text");

        let pdf = out.join("wrath.pdf");
        export(&s.ctx(), &r, Target::Pdf, &pdf, &ExportOptions::default()).unwrap();
        assert!(fs::read(&pdf).unwrap().starts_with(b"%PDF"));

        // The same by LaTeX, where there is one.
        if s.tools.latex_engine().is_ok() {
            let by_latex = out.join("wrath-latex.pdf");
            let e = export(&s.ctx(), &r, Target::PdfLatex, &by_latex, &ExportOptions { biblatex: true }).unwrap();
            assert!(fs::read(&by_latex).unwrap().starts_with(b"%PDF"));
            assert!(e.also.is_empty(), "the references are in the document, not beside it");
            assert!(!e.warnings.iter().any(|w| w.contains("glaukopis-hyphenation")), "{:?}", e.warnings);
            assert!(!e.warnings.iter().any(|w| w.contains("hyphenation patterns")), "{:?}", e.warnings);
            // Norwegian, which babel takes from its own files where the
            // language's package of TeX Live is not installed (tried by hand
            // with the package hidden); and German, which babel's own files
            // do not take by the name Pandoc gives it.
            for language in ["nb", "de"] {
                let mut other = r.clone();
                other.document.language = Some(language.into());
                let e = export(&s.ctx(), &other, Target::PdfLatex, &by_latex, &ExportOptions { biblatex: true })
                    .unwrap_or_else(|e| panic!("{language}: {e}"));
                assert!(fs::read(&by_latex).unwrap().starts_with(b"%PDF"));
                assert!(!e.warnings.iter().any(|w| w.contains("glaukopis-hyphenation")), "{:?}", e.warnings);
            }
        } else {
            // LaTeX is too large to ask of every machine the tests run on.
            eprintln!("LaTeX is not installed: the PDF by LaTeX is not tested");
        }
    }

    /// The sample, with a drawing, a photograph that is not there, and mathematics.
    fn with_figures(s: &Setup) -> Request {
        use crate::document::Block;
        use crate::document::fixtures::text;
        use crate::library::figures::fixtures::{PNG, SVG};
        let mut r = request("chicago-author-date");
        r.key = "p1".into();
        let drawing = add_picture(&s.pictures, "circle.svg", SVG.as_bytes());
        let picture = add_picture(&s.pictures, "vase.png", &PNG);
        let blocks = &mut r.document.sections[1].blocks;
        blocks.push(Block::Figure {
            id: "fig-shield".into(),
            align: None,
            wrap: None,
            file: drawing.hash,
            extension: "svg".into(),
            name: drawing.name,
            caption: vec![text("The shield, as "), cite_of("r2"), text(" has it")],
            alt: "A circle".into(),
            width: 40,
            numbered: true,
        });
        blocks.push(Block::paragraph(vec![
            text("Where "),
            Inline::Math { tex: "x_i \\leq \\alpha".into() },
            text(" holds:"),
        ]));
        blocks.push(Block::Equation {
            align: None,
            id: "eq-sum".into(),
            tex: "a^2 + b^2 = c^2".into(),
            numbered: true,
        });
        blocks.push(Block::Equation { align: None, id: "".into(), tex: "e^{i\\pi} = -1".into(), numbered: false });
        blocks.push(Block::Equation {
            align: None,
            id: "eq-series".into(),
            tex: "\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}".into(),
            numbered: true,
        });
        blocks.push(Block::Figure {
            id: "fig-vase".into(),
            align: None,
            wrap: None,
            file: picture.hash,
            extension: "png".into(),
            name: picture.name,
            caption: vec![text("A vase")],
            alt: String::new(),
            width: 100,
            numbered: true,
        });
        blocks.push(Block::Figure {
            id: "".into(),
            align: None,
            wrap: None,
            file: "c".repeat(64),
            extension: "jpg".into(),
            name: "lost.jpg".into(),
            caption: vec![],
            alt: String::new(),
            width: 100,
            numbered: false,
        });
        r
    }

    fn cite_of(id: &str) -> Inline {
        Inline::Citation {
            items: vec![crate::document::CiteItem { id: id.into(), ..Default::default() }],
            mode: Default::default(),
        }
    }

    #[test]
    fn figures_and_equations() {
        let Some(s) = setup() else { return };
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        let r = with_figures(&s);
        let drawing = r.document.figure_files()[0].0.clone();
        assert_eq!(r.document.figure_files().len(), 3);

        let p = preview(&s.ctx(), &r).unwrap();
        assert!(!p.pages.is_empty());
        assert_eq!(p.warnings.iter().filter(|w| w.contains("lost.jpg")).count(), 1, "{:?}", p.warnings);
        assert_eq!(p.warnings.len(), 1, "{:?}", p.warnings);
        assert!(p.missing.is_empty());

        // The document as Typst, with its pictures beside it.
        let typ = out.join("with figures.typ");
        let e = export(&s.ctx(), &r, Target::Typst, &typ, &ExportOptions::default()).unwrap();
        let text = fs::read_to_string(&typ).unwrap();
        assert!(text.contains(&format!("image(\"with-figures-files/{drawing}.svg\", width: 40")), "{text}");
        assert!(text.contains("alt: \"A circle\""));
        assert!(text.contains("] <gk-figure-center>") && text.contains("] <gk-figure-caption>"));
        assert!(text.contains("Figure~1. The shield, as \\(West 1988) has it"), "{text}");
        assert!(text.contains("Figure~2. A vase"));
        assert!(text.contains("#[#set math.equation(numbering: (..n) => [(1)])"));
        assert!(text.contains("(..n) => [(2)]"));
        assert!(text.contains("$x_i lt.eq alpha$") || text.contains("$x_i <= alpha$"), "{text}");
        assert!(text.contains("The image is not here: lost.jpg"));
        assert!(out.join("with-figures-files").join(format!("{drawing}.svg")).is_file());
        assert_eq!(e.also, vec![out.join("with-figures-files").display().to_string()]);

        // For LaTeX.
        let tex = out.join("figures.tex");
        export(&s.ctx(), &r, Target::Latex, &tex, &ExportOptions::default()).unwrap();
        let text = fs::read_to_string(&tex).unwrap();
        assert!(text.contains("\\usepackage{float}"));
        assert!(text.contains("\\begin{figure}[H]"));
        assert!(text.contains(&format!("figures-files/{drawing}.svg")), "{text}");
        assert!(text.contains("\\begin{equation*}\na^2 + b^2 = c^2\n\\tag*{(1)}"), "{text}");
        assert!(text.contains("\\[e^{i\\pi} = -1\\]"));
        assert!(text.contains("\\(x_i \\leq \\alpha\\)"));
        assert!(out.join("figures-files").is_dir());

        // For word processors.
        let docx = out.join("figures.docx");
        export(&s.ctx(), &r, Target::Docx, &docx, &ExportOptions::default()).unwrap();
        let document = unzip(&docx, "word/document.xml");
        assert!(document.contains("<w:pStyle w:val=\"FigureCaption\""), "{document}");
        assert!(document.contains("<w:pStyle w:val=\"Figure\""));
        assert!(document.contains("<m:oMath"));
        assert!(document.contains("<pic:pic"));
        assert!(unzip(&docx, "word/styles.xml").contains("w:styleId=\"FigureCaption\""));

        let odt = out.join("figures.odt");
        export(&s.ctx(), &r, Target::Odt, &odt, &ExportOptions::default()).unwrap();
        let content = unzip(&odt, "content.xml");
        assert!(content.contains("text:style-name=\"Figure_20_Caption\""), "{content}");
        assert!(content.contains("<draw:image"));
        assert!(unzip(&odt, "styles.xml").contains("style:name=\"Figure_20_Caption\""));

        let html = out.join("figures.html");
        export(&s.ctx(), &r, Target::Html, &html, &ExportOptions::default()).unwrap();
        let text = fs::read_to_string(&html).unwrap();
        assert!(text.contains("class=\"gk-figure gk-center\""), "{text}");
        assert!(text.contains("data:image/png;base64,") || text.contains("<svg"), "the pictures are in the document");

        let pdf = out.join("figures.pdf");
        export(&s.ctx(), &r, Target::Pdf, &pdf, &ExportOptions::default()).unwrap();
        assert!(fs::read(&pdf).unwrap().starts_with(b"%PDF"));
        if s.tools.latex_engine().is_ok() {
            let by_latex = out.join("figures-latex.pdf");
            export(&s.ctx(), &r, Target::PdfLatex, &by_latex, &ExportOptions::default()).unwrap();
            assert!(fs::read(&by_latex).unwrap().starts_with(b"%PDF"));
        }
    }

    /// A table of poems.
    fn poems(id: &str, said: &str) -> crate::document::Table {
        use crate::document::fixtures::text;
        use crate::document::{Block, Cell, Table};
        use crate::formats::Stand;
        let cell = |words: &str, header: bool, to: Option<Stand>| Cell {
            content: vec![Block::paragraph(vec![text(words)])],
            header,
            align: to,
            ..Default::default()
        };
        let right = Some(Stand::Right);
        Table {
            id: id.into(),
            caption: if said.is_empty() { vec![] } else { vec![text(said)] },
            rows: vec![
                vec![cell("Poem", true, None), cell("Lines", true, right)],
                vec![cell("Iliad", false, None), cell("15 693", false, right)],
                vec![cell("Odyssey", false, None), cell("12 109", false, right)],
            ],
            numbered: true,
            ..Default::default()
        }
    }

    #[test]
    fn tables_and_where_things_stand() {
        use crate::document::fixtures::text;
        use crate::document::{Block, RefForm, Table};
        use crate::formats::{Rules, Stand};
        let Some(s) = setup() else { return };
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        let mut r = with_figures(&s);
        let para = |words: &str| Block::paragraph(vec![text(words)]);
        let long = "The wrath of Achilles is the first word of the poem and its subject. ".repeat(6);
        {
            let blocks = &mut r.document.sections[1].blocks;
            // The first figure to the left; the second to the right, with the text flowing around it.
            for block in blocks.iter_mut() {
                match block {
                    Block::Figure { id, align, .. } if id == "fig-shield" => *align = Some(Stand::Left),
                    Block::Figure { id, align, wrap, width, .. } if id == "fig-vase" => {
                        *align = Some(Stand::Right);
                        *wrap = Some(true);
                        *width = 40;
                    }
                    Block::Equation { id, align, .. } if id == "eq-sum" => *align = Some(Stand::Left),
                    _ => {}
                }
            }
            blocks.push(para(&long));
            blocks.push(Block::paragraph(vec![
                text("See "),
                Inline::CrossRef { target: "t-poems".into(), form: RefForm::Full },
                text("."),
            ]));
            blocks.push(Block::Table(poems("t-poems", "The poems")));
            blocks.push(para(&long));
            blocks.push(Block::Table(Table {
                align: Some(Stand::Left),
                wrap: Some(true),
                ..poems("t-left", "The poems again")
            }));
            blocks.push(para(&long));
            blocks.push(Block::Row {
                items: vec![
                    Block::Table(poems("t-row", "In a row")),
                    Block::Equation { align: None, id: "eq-row".into(), tex: "x = 1".into(), numbered: true },
                ],
            });
            blocks.push(para("After."));
        }

        // As Typst.
        let typ = out.join("stands.typ");
        export(&s.ctx(), &r, Target::Typst, &typ, &ExportOptions::default()).unwrap();
        let t = fs::read_to_string(&typ).unwrap();
        assert!(t.contains("] <gk-figure-left>") && t.contains("] <gk-figure-caption-left>"), "{t}");
        assert!(t.contains("#gk-around(right, 40.0%, ["), "{t}");
        assert!(t.contains("] <gk-figure-within>"));
        assert!(t.contains("#let gk-around(side, width, fixed, body)"), "what makes the text flow is in the opening");
        assert!(t.contains("#show math.equation: set align(left)"));
        assert!(
            t.contains("Table~1. The poems")
                && t.contains("Table~2. The poems again")
                && t.contains("Table~3. In a row")
        );
        assert!(t.contains("See #link(<gk-to-t-poems>)[Table~1]."), "{t}");
        assert!(t.contains("] <gk-table-center>") && t.contains("#gk-around(left, 45.0%, ["));
        // What is said of the table over it, the table and the equation on their feet.
        assert!(t.contains("#gk-row(2, (bottom, bottom,), ["), "{t}");
        assert!(t.contains("table.header(table.cell(align: left)[Poem], table.cell(align: right)[Lines],)"), "{t}");
        assert!(t.contains("align: (left,left,)"));
        let p = preview(&s.ctx(), &r).unwrap();
        assert!(p.warnings.iter().all(|w| w.contains("lost.jpg")), "{:?}", p.warnings);

        // For LaTeX.
        let tex = out.join("stands.tex");
        export(&s.ctx(), &r, Target::Latex, &tex, &ExportOptions::default()).unwrap();
        let t = fs::read_to_string(&tex).unwrap();
        assert!(t.contains("\\usepackage{wrapfig}") && t.contains("\\usepackage{longtable,booktabs,array}"));
        assert!(t.contains("\\begin{figure}[H]\n\\raggedright"), "{t}");
        assert!(t.contains("\\needspace{9\\baselineskip}\n\\begin{wrapfigure}{r}{0.400\\linewidth}"), "{t}");
        assert!(t.contains("\\begin{wrapfigure}{l}{0.450\\linewidth}"));
        assert!(t.contains("\\begin{flalign*}"));
        // A table by itself may go over pages; within something it may not.
        assert_eq!(t.matches("\\begin{longtable}").count(), 1, "{t}");
        assert_eq!(t.matches("\\begin{tabular}{@{}").count(), 2, "{t}");
        assert_eq!(t.matches("\\bottomrule").count(), 3);
        assert!(!t.contains("\\endlastfoot\n\\end{tabular}") && !t.contains("endhead\nIliad"), "{t}");
        assert!(t.contains("\\begin{minipage}[b]{0.4800\\linewidth}\\centering"), "{t}");
        assert!(t.contains("\\end{minipage}%\n\\hfill\\begin{minipage}"), "{t}");
        if s.tools.latex_engine().is_ok() {
            let pdf = out.join("stands-latex.pdf");
            export(&s.ctx(), &r, Target::PdfLatex, &pdf, &ExportOptions::default()).unwrap();
            assert!(fs::read(&pdf).unwrap().starts_with(b"%PDF"));
        }

        // For word processors.
        let docx = out.join("stands.docx");
        export(&s.ctx(), &r, Target::Docx, &docx, &ExportOptions::default()).unwrap();
        let document = unzip(&docx, "word/document.xml");
        assert!(!document.contains("<!--gk"), "{document}");
        assert!(
            document.contains("<w:pStyle w:val=\"FigureLeft\"")
                && document.contains("<w:pStyle w:val=\"FigureCaptionLeft\"")
        );
        assert!(document.contains("w:tblpXSpec=\"right\"") && document.contains("w:tblpXSpec=\"left\""));
        assert!(document.contains("<w:pStyle w:val=\"TableCaption\""));
        assert!(document.contains("<w:jc w:val=\"center\"/>"));
        assert!(document.contains("<m:jc m:val=\"left\""));
        assert!(document.contains("<w:pStyle w:val=\"TableText\""));
        let styles = unzip(&docx, "word/styles.xml");
        assert_eq!(styles.matches("w:styleId=\"TableCaption\"").count(), 1);
        assert!(styles.contains("w:styleId=\"Layout\"") && styles.contains("<w:tblStylePr w:type=\"firstRow\">"));

        let odt = out.join("stands.odt");
        export(&s.ctx(), &r, Target::Odt, &odt, &ExportOptions::default()).unwrap();
        let content = unzip(&odt, "content.xml");
        assert!(!content.contains("<!--gk"), "{content}");
        assert!(
            content.contains("draw:style-name=\"GkAroundRight\"")
                && content.contains("draw:style-name=\"GkAroundLeft\"")
        );
        assert!(content.contains("text:style-name=\"Figure_20_Left\""));
        assert!(
            content.contains("table:style-name=\"GkCellHead\"") && content.contains("table:style-name=\"GkCellLast\"")
        );
        assert!(
            content.contains("table:style-name=\"GkRow\"") && content.contains("draw:style-name=\"GkFormulaLeft\"")
        );
        assert!(unzip(&odt, "styles.xml").contains("style:name=\"GkAroundRight\""));

        let html = out.join("stands.html");
        export(&s.ctx(), &r, Target::Html, &html, &ExportOptions::default()).unwrap();
        let text = fs::read_to_string(&html).unwrap();
        assert!(text.contains("gk-around") && text.contains("class=\"gk-row\""), "{text}");
        assert!(text.contains(".gk-around"), "the page says how they are set");

        // The format says where things stand when nothing is said of them, and what lines a table has.
        let mut f = with_figures(&s);
        f.format.figures.align = Stand::Right;
        f.format.figures.wrap = true;
        f.format.tables.rules = Rules::Grid;
        f.format.tables.label = "Tab.".into();
        f.format.equations.align = Stand::Left;
        f.document.sections[1].blocks.push(Block::Table(poems("t", "Poems")));
        f.document.sections[1].blocks.push(para(&long));
        let typ = out.join("format.typ");
        export(&s.ctx(), &f, Target::Typst, &typ, &ExportOptions::default()).unwrap();
        let t = fs::read_to_string(&typ).unwrap();
        assert!(t.contains("#gk-around(right, 40.0%, ["), "{t}");
        assert!(t.contains("#set table(stroke: 0.5pt"));
        assert!(t.contains("Tab.~1. Poems"));
        assert_eq!(t.matches("#show math.equation: set align(left)").count(), 3);
        assert!(!preview(&s.ctx(), &f).unwrap().pages.is_empty());
    }

    #[test]
    fn verse_and_texts_side_by_side() {
        use crate::document::fixtures::text;
        use crate::document::{Block, Numbering, Section};
        let Some(s) = setup() else { return };
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        let mut r = request("chicago-author-date");
        use crate::document::fixtures::{lines, mark};
        let counted = |b: Block| b.numbered(Numbering::Counted, None, None).counting_from("1");
        // A speaker, two stanzas with a direction between them, counted from 1, and a third
        // with a number given by hand, a line not counted, and words in the margin.
        let mut blocks = vec![
            counted(Block::of_kind("speaker", vec![text("Nurse")])),
            counted(lines(
                "line",
                vec![
                    (None, "If only the Argo had never flown"),
                    (Some(mark().indent(1).done()), "through the dark Clashing Rocks"),
                ],
            )),
            counted(Block::of_kind("direction", vec![text("She weeps.")])),
            counted(lines(
                "line",
                vec![
                    (None, "to the land of Colchis,"),
                    (None, "nor the pine been felled"),
                    (None, "in the glens of Pelion."),
                ],
            )),
            counted(lines(
                "line",
                vec![
                    (Some(mark().number("1094a1").done()), "Nor had the heroes rowed"),
                    (Some(mark().indent(2).uncounted().done()), "for Pelias"),
                    (Some(mark().margin("ia. trim.").done()), "the golden fleece."),
                ],
            )),
        ];
        blocks.push(Block::Parallel {
            left: vec![Block::of_kind("line", vec![text("Εἴθ᾽ ὤφελ᾽ Ἀργοῦς μὴ διαπτάσθαι σκάφος")])],
            right: vec![Block::paragraph(vec![text("If only the Argo had never flown.")])],
        });
        r.document.sections.push(Section {
            level: 1,
            heading: Some(vec![text("The nurse")]),
            blocks,
            element: Some("nurse".into()),
            kind: None,
        });

        // Typst: the lines are blocks the opening sets, numbered; the pages are made.
        let typ = out.join("verse.typ");
        export(&s.ctx(), &r, Target::Typst, &typ, &ExportOptions::default()).unwrap();
        let t = fs::read_to_string(&typ).unwrap();
        assert!(t.contains("#gk-verse["), "{t}");
        assert!(t.contains("#gk-line(\"speaker\", 0, n: none, margin: none, side: \"left\")["), "{t}");
        // A count from 1 where every fifth is shown begins on no page; it goes on from it.
        assert!(!t.contains("n: \"1\","), "{t}");
        assert!(t.contains("#gk-line(\"line\", 1, n: none, margin: none, side: \"left\")["), "{t}");
        assert!(t.contains("#gk-line(\"line\", 0, n: \"5\", margin: none, side: \"left\")["), "{t}");
        assert!(t.contains("#gk-line(\"line\", 0, n: \"1094a1\", margin: none, side: \"left\")["), "{t}");
        assert!(t.contains("#gk-line(\"line\", 2, n: none, margin: none, side: \"left\")["), "{t}");
        assert!(t.contains("#gk-line(\"line\", 0, n: none, margin: \"ia. trim.\", side: \"left\")["), "{t}");
        // One verse, the direction a line of it, and room between two stanzas that follow each other.
        assert_eq!(t.matches("#gk-verse[").count(), 2, "the verse, and the one beside its translation: {t}");
        assert!(t.contains("#gk-line(\"direction\", 0, n: none, margin: none, side: \"left\")["), "{t}");
        assert_eq!(t.matches("#v(1em)").count(), 1, "{t}");
        assert!(t.contains("#gk-parallel(["), "{t}");
        let p = preview(&s.ctx(), &r).unwrap();
        assert!(p.warnings.is_empty(), "{:?}", p.warnings);
        let svg: String = p.pages.iter().map(|page| page.svg.as_str()).collect();
        assert!(!svg.is_empty());

        // Reference marks, raised and in the margin: the pages are made either way.
        {
            let mut marked = r.clone();
            marked.document.sections[0].blocks.push(Block::paragraph(vec![
                text("In the beginning. "),
                Inline::RefMark { label: "2".into() },
                text("And the earth was without form."),
            ]));
            for margin in [false, true] {
                if margin {
                    marked.format.text.refmarks = crate::formats::RefMarks::Margin;
                }
                let typ = out.join("marks.typ");
                export(&s.ctx(), &marked, Target::Typst, &typ, &ExportOptions::default()).unwrap();
                let t = fs::read_to_string(&typ).unwrap();
                assert!(t.contains("#gk-refmark(\"2\");"), "{t}");
                assert_eq!(t.contains("gk-refmark(label) = { box[]; context"), margin, "{t}");
                let p = preview(&s.ctx(), &marked).unwrap();
                assert!(p.warnings.is_empty(), "{:?}", p.warnings);
            }
        }

        // LaTeX: each line a paragraph, the speaker in small capitals, the numbers in the margin.
        let tex = out.join("verse.tex");
        export(&s.ctx(), &r, Target::Latex, &tex, &ExportOptions::default()).unwrap();
        let l = fs::read_to_string(&tex).unwrap();
        assert!(l.contains("\\textsc{Nurse}"), "{l}");
        assert!(l.contains("{\\par\\leftskip=1cm\\relax"), "the lines stand in as far as a line looks: {l}");
        assert!(l.contains("\\noindent If only the Argo had never flown"), "the 1 given is not printed: {l}");
        assert!(l.contains("\\llap{{\\footnotesize 5}\\hspace{0.9em}}in the glens"), "{l}");
        assert!(l.contains("\\hspace*{0.6cm}through the dark"), "a step of the layout: {l}");
        assert!(l.contains("\\llap{{\\footnotesize 1094a1}\\hspace{0.9em}}Nor had"), "{l}");
        assert!(l.contains("\\rlap{\\hspace{1em}\\footnotesize\\itshape ia. trim.}"), "{l}");
        assert!(l.contains("\\begin{minipage}[t]{0.48\\textwidth}"), "{l}");

        // An e-book: the chapters are its parts, and the lines stay lines.
        let epub = out.join("verse.epub");
        export(&s.ctx(), &r, Target::Epub, &epub, &ExportOptions::default()).unwrap();
        let bytes = fs::read(&epub).unwrap();
        assert!(bytes.starts_with(b"PK"), "an EPUB is a zip");
        let opf = unzip(&epub, "EPUB/content.opf");
        assert!(opf.contains("<dc:title"), "{opf}");
        // The verse is in the last chapter, whichever number that has.
        let text: String = {
            let mut archive = zip::ZipArchive::new(fs::File::open(&epub).unwrap()).unwrap();
            let names: Vec<String> =
                archive.file_names().filter(|n| n.starts_with("EPUB/text/")).map(str::to_owned).collect();
            names
                .iter()
                .map(|n| {
                    use std::io::Read;
                    let mut s = String::new();
                    archive.by_name(n).unwrap().read_to_string(&mut s).unwrap();
                    s
                })
                .collect()
        };
        assert!(text.contains("If only the Argo had never flown"), "{text}");
        assert!(text.contains("line-block"), "{text}");

        // With a cover: a picture of the store, which the book carries.
        {
            use crate::library::figures::fixtures::PNG;
            let picture = add_picture(&s.pictures, "cover.png", &PNG);
            let mut with_cover = r.clone();
            with_cover.document.parts.push(Part {
                kind: "cover".into(),
                element: Some("p-cov".into()),
                title: vec![crate::document::fixtures::text("Cover")],
                sections: vec![Section {
                    level: 0,
                    blocks: vec![Block::Figure {
                        id: String::new(),
                        file: picture.hash.clone(),
                        extension: "png".into(),
                        name: "cover.png".into(),
                        caption: vec![],
                        alt: String::new(),
                        width: 100,
                        numbered: false,
                        align: None,
                        wrap: None,
                    }],
                    element: Some("p-cov".into()),
                    kind: Some("cover".into()),
                    ..Default::default()
                }],
            });
            let epub = out.join("covered.epub");
            export(&s.ctx(), &with_cover, Target::Epub, &epub, &ExportOptions::default()).unwrap();
            let archive = zip::ZipArchive::new(fs::File::open(&epub).unwrap()).unwrap();
            assert!(
                archive.file_names().any(|n| n.contains("cover")),
                "{:?}",
                archive.file_names().collect::<Vec<_>>()
            );
        }

        // Word: the lines stay lines, and the texts side by side are a table.
        let docx = out.join("verse.docx");
        export(&s.ctx(), &r, Target::Docx, &docx, &ExportOptions::default()).unwrap();
        let xml = unzip(&docx, "word/document.xml");
        assert!(xml.contains("If only the Argo had never flown"), "no verse in Word");
        assert!(
            xml.contains("VerseNumber") && xml.contains(">5\u{a0}\u{a0}<"),
            "the numbers stand at the head of their lines: {xml}"
        );
        assert!(xml.contains("<w:pStyle w:val=\"Line\""), "the lines are in the style of a line: {xml}");
        assert!(xml.contains("<w:rStyle w:val=\"SpeakerChar\""), "the speaker in its character style: {xml}");
        let styles = unzip(&docx, "word/styles.xml");
        assert!(styles.contains("w:styleId=\"SpeakerChar\"") && styles.contains("w:styleId=\"Line\""), "{styles}");
        assert!(xml.contains("<w:tbl>"), "no table for the texts side by side");

        // With the numbers at the right, as the layout says: at the end of their lines in Word.
        let mut right = r.clone();
        right.format.verse.side = crate::document::Side::Right;
        export(&s.ctx(), &right, Target::Docx, &docx, &ExportOptions::default()).unwrap();
        let xml = unzip(&docx, "word/document.xml");
        assert!(xml.contains(">\u{a0}\u{a0}5<"), "the numbers stand at the end of their lines: {xml}");
        export(&s.ctx(), &right, Target::Typst, &typ, &ExportOptions::default()).unwrap();
        let t = fs::read_to_string(&typ).unwrap();
        assert!(t.contains("#gk-line(\"line\", 0, n: \"5\", margin: none, side: \"right\")["), "{t}");
        let p = preview(&s.ctx(), &right).unwrap();
        assert!(p.warnings.is_empty(), "{:?}", p.warnings);

        // A numbered passage of prose: the numbers beside the paragraphs, in every kind of document.
        let mut prose = r.clone();
        prose.document.sections[0].blocks = vec![
            lines("quote", vec![(Some(mark().number("327a").done()), "I went down yesterday to the Piraeus.")]),
            lines("quote", vec![(None, "Polemarchus saw us from a distance.")]),
        ]
        .into_iter()
        .map(|b| b.numbered(Numbering::Counted, Some(1), None))
        .collect();
        export(&s.ctx(), &prose, Target::Typst, &typ, &ExportOptions::default()).unwrap();
        let t = fs::read_to_string(&typ).unwrap();
        assert!(t.contains("#gk-beside(\"left\", gk-number(\"327a\"));"), "{t}");
        assert!(t.contains("#gk-beside(\"left\", gk-number(\"328\"));"), "the count goes on from the digits: {t}");
        assert!(t.contains("#quote(block: true)"), "{t}");
        let p = preview(&s.ctx(), &prose).unwrap();
        assert!(p.warnings.is_empty(), "{:?}", p.warnings);
        export(&s.ctx(), &prose, Target::Latex, &tex, &ExportOptions::default()).unwrap();
        let l = fs::read_to_string(&tex).unwrap();
        assert!(l.contains("\\llap{{\\footnotesize 327a}\\hspace{0.9em}}I went down"), "{l}");
        export(&s.ctx(), &prose, Target::Docx, &docx, &ExportOptions::default()).unwrap();
        let xml = unzip(&docx, "word/document.xml");
        assert!(xml.contains("VerseNumber") && xml.contains(">328\u{a0}\u{a0}<"), "{xml}");
    }

    #[test]
    fn a_number_given_on_a_later_line_of_a_paragraph_stands_beside_that_line() {
        use crate::document::Numbering;
        use crate::document::fixtures::{lines, mark};
        let Some(s) = setup() else { return };
        let mut r = request("chicago-author-date");
        // A text paragraph of three lines, as a play's lines are often
        // written: a number given by hand on the second only.
        r.document.sections[1].blocks = vec![
            lines(
                "text",
                vec![
                    (None, "Ismene, my sister, true child of my mother,"),
                    (Some(mark().number("7").shown().done()), "what evil is there of all"),
                    (None, "that Zeus does not bring to pass for us two?"),
                ],
            )
            .numbered(Numbering::Counted, Some(5), None),
        ];
        let p = preview(&s.ctx(), &r).unwrap();
        assert!(p.warnings.is_empty(), "{:?}", p.warnings);
        let runs: Vec<&TextRun> = p.pages.iter().flat_map(|page| page.texts.iter()).collect();
        let line = |w: &str| *runs.iter().find(|r| r.text.contains(w)).unwrap_or_else(|| panic!("“{w}”: {runs:?}"));
        let (first, second) = (line("Ismene"), line("what evil"));
        let seven = runs.iter().find(|r| r.text.trim() == "7").unwrap_or_else(|| panic!("no 7 on the page: {runs:?}"));
        assert!(seven.x >= 0.0 && seven.x < second.x, "the number stands left of the text: {seven:?} {second:?}");
        assert!(
            (seven.baseline - second.baseline).abs() < (second.baseline - first.baseline) / 2.0,
            "the number stands at the second line's height: {seven:?} {first:?} {second:?}"
        );
    }

    #[test]
    fn tables_at_the_end() {
        use crate::document::Block;
        let Some(s) = setup() else { return };
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        let mut r = request("chicago-author-date");
        r.format.tables.placement = crate::formats::FigurePlacement::AtEnd;
        r.document.sections[1]
            .blocks
            .push(Block::Row { items: vec![Block::Table(poems("a", "One")), Block::Table(poems("b", "Another"))] });
        let typ = out.join("tables-end.typ");
        export(&s.ctx(), &r, Target::Typst, &typ, &ExportOptions::default()).unwrap();
        let t = fs::read_to_string(&typ).unwrap();
        let here = t.find("Table~1 about here").expect("a line says where the table belongs");
        assert!(t.contains("Table~2 about here"));
        let heading = t.find("[Tables]").expect("the tables have a heading at the end");
        let table = t.find("#table(").unwrap();
        assert!(here < heading && heading < table, "{t}");
        assert!(!t.contains("#gk-row("), "what stands at the end stands by itself");
        assert_eq!(t.matches("#table(").count(), 2);
    }

    #[test]
    fn words_that_point() {
        use crate::document::fixtures::text;
        use crate::document::{Block, RefForm, Section};
        let Some(s) = setup() else { return };
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        let mut r = with_figures(&s);
        r.format.headings.numbered = true;
        let to = |target: &str, form: RefForm| Inline::CrossRef { target: target.into(), form };
        r.document.sections.push(Section {
            level: 2,
            heading: Some(vec![text("Under the word")]),
            blocks: vec![Block::paragraph(vec![
                text("See "),
                to("fig-vase", RefForm::Full),
                text(", and "),
                to("fig-shield", RefForm::Number),
                text("; by "),
                to("eq-series", RefForm::Full),
                text(" and "),
                to("eq-sum", RefForm::Number),
                text("; in "),
                to("e1", RefForm::Full),
                text(", that is “"),
                to("e1", RefForm::Name),
                text("”, and here in "),
                to("e2", RefForm::Full),
                text("; and "),
                to("gone", RefForm::Full),
                text("."),
            ])],
            element: Some("e2".into()),
            kind: None,
        });

        let typ = out.join("points.typ");
        let e = export(&s.ctx(), &r, Target::Typst, &typ, &ExportOptions::default()).unwrap();
        let t = fs::read_to_string(&typ).unwrap();
        assert!(t.contains("See #link(<gk-to-fig-vase>)[Figure~2], and #link(<gk-to-fig-shield>)[1]\\;"), "{t}");
        assert!(t.contains("by #link(<gk-to-eq-series>)[\\(2)] and #link(<gk-to-eq-sum>)[1]\\;"), "{t}");
        assert!(t.contains("in #link(<gk-to-e1>)[1], that is “#link(<gk-to-e1>)[The word #emph[mênis]]”"), "{t}");
        assert!(t.contains("and here in #link(<gk-to-e2>)[1.1]\\; and #strong[\\[?\\]]."), "{t}");
        // What is pointed to has a place; what is not has none.
        for place in [
            "\u{200b}<gk-to-fig-vase>",
            "\u{200b}<gk-to-fig-shield>",
            "\n<gk-to-eq-series>\n",
            "\n<gk-to-eq-sum>\n",
            "\n<gk-to-e1>\n",
        ] {
            assert_eq!(t.matches(place).count(), 1, "{place}\n{t}");
        }
        assert!(t.contains("$ a^2 + b^2 = c^2 $\n\n<gk-to-eq-sum>"), "{t}");
        assert_eq!(
            e.warnings.iter().filter(|w| w.contains("refers to something that is not in the document")).count(),
            1
        );
        let p = preview(&s.ctx(), &r).unwrap();
        assert!(p.warnings.iter().all(|w| !w.contains("label")), "{:?}", p.warnings);
        assert!(!p.pages.is_empty());

        // The format says what a figure is called where it is pointed to.
        r.format.figures.reference = "fig.".into();
        r.format.headings.numbered = false;
        r.format.equations.before_number = "[".into();
        r.format.equations.after_number = "]".into();
        let tex = out.join("points.tex");
        export(&s.ctx(), &r, Target::Latex, &tex, &ExportOptions::default()).unwrap();
        let t = fs::read_to_string(&tex).unwrap();
        assert!(t.contains("\\hyperref[gk-to-fig-vase]{fig.~2}"), "{t}");
        assert!(
            t.contains("\\hyperref[gk-to-eq-series]{{[}2{]}}") || t.contains("\\hyperref[gk-to-eq-series]{[2]}"),
            "{t}"
        );
        assert!(t.contains("here in \\hyperref[gk-to-e2]{Under the word}"), "{t}");
        assert!(t.contains("\\label{gk-to-eq-sum}%\n\\begin{equation*}"), "{t}");
        assert!(t.contains("\\label{gk-to-e1}"), "{t}");
        if s.tools.latex_engine().is_ok() {
            let pdf = out.join("points.pdf");
            export(&s.ctx(), &r, Target::PdfLatex, &pdf, &ExportOptions::default()).unwrap();
            assert!(fs::read(&pdf).unwrap().starts_with(b"%PDF"));
        }

        // In a document for a word processor they are words, and not links.
        let docx = out.join("points.docx");
        export(&s.ctx(), &r, Target::Docx, &docx, &ExportOptions::default()).unwrap();
        let document = unzip(&docx, "word/document.xml");
        assert!(!document.contains("w:anchor=\"gk-to-"), "{document}");
        assert!(document.contains("fig.\u{a0}2") || document.contains("fig. 2"), "{document}");
    }

    #[test]
    fn the_preview_has_large_pictures_lighter() {
        let Some(s) = setup() else { return };
        let mut r = request("chicago-author-date");
        r.key = "p2".into();
        let large = image::DynamicImage::ImageRgb8(image::RgbImage::from_fn(2400, 1600, |x, y| {
            image::Rgb([(x / 10) as u8, (y / 7) as u8, ((x * y) % 251) as u8])
        }));
        let mut bytes = std::io::Cursor::new(Vec::new());
        large.write_to(&mut bytes, image::ImageFormat::Png).unwrap();
        let kept = add_picture(&s.pictures, "large.png", bytes.get_ref());
        assert!(kept.size > 200_000);
        r.document.sections[1].blocks.push(crate::document::Block::Figure {
            id: String::new(),
            align: None,
            wrap: None,
            file: kept.hash.clone(),
            extension: "png".into(),
            name: kept.name.clone(),
            caption: vec![],
            alt: String::new(),
            width: 100,
            numbered: true,
        });
        let file = format!("{}.png", kept.hash);
        let p = preview(&s.ctx(), &r).unwrap();
        assert!(p.warnings.is_empty(), "{:?}", p.warnings);
        let shown = s.work.join("p2").join("preview").join("files").join(&file);
        let small = fs::metadata(&shown).unwrap().len();
        assert!(small < kept.size / 2, "{small} of {}", kept.size);
        // Made once, and not again.
        let made = fs::metadata(&shown).unwrap().modified().unwrap();
        preview(&s.ctx(), &r).unwrap();
        assert_eq!(fs::metadata(&shown).unwrap().modified().unwrap(), made);

        // What is given away has the picture as it is.
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        export(&s.ctx(), &r, Target::Pdf, &out.join("large.pdf"), &ExportOptions::default()).unwrap();
        let whole = s.work.join("p2").join("export").join("files").join(&file);
        assert_eq!(fs::metadata(&whole).unwrap().len(), kept.size);
    }

    #[test]
    fn the_pages_that_are_wanted_are_given_and_no_others() {
        let Some(s) = setup() else { return };
        let mut r = with_figures(&s);
        // Figures at the end make a document of two pages at the least.
        r.format.figures.placement = crate::formats::FigurePlacement::AtEnd;
        let go = AtomicBool::new(false);
        let ctx = s.ctx();
        let all = preview(&ctx, &r).unwrap();
        assert!(all.count >= 2 && all.pages.len() == all.count);

        let last = all.count as u32;
        let readied = preview_ready(&ctx, &r).unwrap();
        let some = preview_made(&ctx, &r, readied, &[last, last], &go).unwrap();
        assert_eq!(some.count, all.count);
        assert_eq!(some.pages.iter().map(|p| p.number).collect::<Vec<_>>(), vec![last]);
        assert_eq!(some.pages[0].svg, all.pages[last as usize - 1].svg);

        // As they come into view; one that is not there is passed over.
        let (count, pages) = preview_pages(&ctx, &r.key, &[1, 999], &go).unwrap();
        assert_eq!(count, all.count);
        assert_eq!(pages.iter().map(|p| p.number).collect::<Vec<_>>(), vec![1]);
        assert_eq!(pages[0].svg, all.pages[0].svg);
        let (count, none) = preview_pages(&ctx, &r.key, &[999], &go).unwrap();
        assert_eq!(count, all.count, "how many there are is known, though the page that was wanted is not there");
        assert!(none.iter().all(|p| p.number == 1), "only the page that says how many there are");

        // Nothing is left behind of the pages that were made.
        let dir = s.work.join(&r.key).join("preview");
        let left: Vec<String> = fs::read_dir(&dir)
            .unwrap()
            .flatten()
            .map(|e| e.file_name().to_string_lossy().into_owned())
            .filter(|n| n.starts_with("page"))
            .collect();
        assert!(left.is_empty(), "{left:?}");

        // Of a document that was never made there are no pages.
        assert!(preview_pages(&ctx, "never", &[1], &go).is_err());
    }

    #[test]
    fn what_is_stopped_ends_and_says_so() {
        let Some(s) = setup() else { return };
        let r = with_figures(&s);
        let ctx = s.ctx();
        let readied = preview_ready(&ctx, &r).unwrap();
        let stop = AtomicBool::new(true);
        let e = preview_made(&ctx, &r, readied, &[1], &stop).unwrap_err();
        assert_eq!(e.kind(), tools::STOPPED, "{e}");
    }

    #[test]
    fn figures_at_the_end() {
        let Some(s) = setup() else { return };
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        let mut r = with_figures(&s);
        r.format.figures.placement = crate::formats::FigurePlacement::AtEnd;
        r.format.figures.caption_position = crate::formats::CaptionPosition::Above;
        r.format.figures.label = "Fig.".into();
        r.format.figures.separator = ": ".into();
        r.format.figures.label_bold = true;
        let typ = out.join("end.typ");
        export(&s.ctx(), &r, Target::Typst, &typ, &ExportOptions::default()).unwrap();
        let text = fs::read_to_string(&typ).unwrap();
        let place = text.find("about here").expect("a line says where the figure belongs");
        let refs = text.find("] <refs>").unwrap();
        let picture = text.find("image(").unwrap();
        let caption = text.find("#strong[Fig.~1]: The shield").expect("the caption");
        assert!(place < refs && refs < caption && caption < picture, "{text}");
        assert!(text.contains("[Figures]"), "{text}");
        assert!(preview(&s.ctx(), &r).unwrap().pages.len() >= 2);
    }

    #[test]
    fn a_sample_of_a_style() {
        let Some(s) = setup() else { return };
        let references = sample().references;
        let author_date = s.styles.read("chicago-author-date").unwrap();
        let html = style_sample(&s.ctx(), &author_date, &references, Some("en-GB")).unwrap();
        assert!(html.contains("id=\"gk-sample-1\""), "{html}");
        assert!(html.contains("(Nagy 1979)"), "{html}");
        assert!(html.contains("(Nagy 1979, 45)"));
        assert!(html.contains("id=\"refs\""));
        assert!(html.contains("csl-entry"));

        // A style with notes: the notes stand where they are made.
        let notes = s.styles.read("chicago-notes-bibliography").unwrap();
        let html = style_sample(&s.ctx(), &notes, &references, None).unwrap();
        assert!(html.contains("class=\"gk-note\""), "{html}");
        assert!(!html.contains("footnote-ref"));

        // A style that is broken says so.
        let broken = author_date.replace("</style>", "");
        assert!(style_sample(&s.ctx(), &broken, &references, None).is_err());
    }

    /// The sample with the kinds of passage and of words in it: an epigraph
    /// with its attribution, a kind of the writer's own based on it, a
    /// break, a note to oneself, a passage of code, and words of every kind.
    fn with_kinds(language: &str) -> Request {
        use crate::document::fixtures::text;
        use crate::document::{Block, Section};
        use crate::formats::kinds::{Family, Look};
        use std::collections::BTreeMap;
        let mut r = request("chicago-author-date");
        r.document.language = Some(language.into());
        r.document.kinds = vec![OwnKind {
            id: "k1".into(),
            name: "Letter".into(),
            family: Family::Paragraph,
            based_on: "epigraph".into(),
            look: Look { italic: Some(true), ..Default::default() },
        }];
        let kind = |name: &str, words: &str| Block::of_kind(name, vec![text(words)]);
        let marked = |words: &str, mark: &str, value: Value| Inline::Text {
            text: words.into(),
            marks: BTreeMap::from([(mark.to_owned(), value)]),
        };
        r.document.sections.push(Section {
            level: 1,
            heading: Some(vec![text("Kinds")]),
            blocks: vec![
                kind("epigraph", "Sing, goddess, the wrath."),
                kind("attribution", "Homer"),
                kind("k1", "Dear friend, I write of wrath."),
                kind("break", ""),
                kind("draft", "Zzdraftzz: look this up again."),
                Block::of_kind("code", vec![text("let x = 1;"), Inline::Break, text("let y = 2;")]),
                Block::paragraph(vec![
                    marked("Me.", "kind", json!({"name": "speaker"})),
                    text(" The word "),
                    marked("μῆνις", "kind", json!({"name": "foreign", "lang": "el"})),
                    text(" is "),
                    marked("wrath", "kind", json!({"name": "mention"})),
                    text(", "),
                    marked("underlined", "underline", json!(true)),
                    text(", "),
                    marked("x_1", "code", json!(true)),
                    text(" and "),
                    marked("stressed", "em", json!(true)),
                    text("."),
                ]),
                // Words and a whole paragraph in a language of their own; where foreign words
                // say another, the language of the passage holds.
                Block::paragraph(vec![
                    text("Of longing, "),
                    marked("Weltschmerz", "lang", json!({"tag": "de"})),
                    text("; of song, "),
                    Inline::Text {
                        text: "ἄειδε".into(),
                        marks: BTreeMap::from([
                            ("kind".to_owned(), json!({"name": "foreign", "lang": "el"})),
                            ("lang".to_owned(), json!({"tag": "grc"})),
                        ]),
                    },
                    text("."),
                ]),
                Block::paragraph(vec![marked("Arma virumque cano.", "lang", json!({"tag": "la"}))]),
            ],
            element: Some("kinds".into()),
            kind: None,
        });
        r
    }

    /// The style of an id in Word's styles, as written.
    fn word_style<'a>(styles: &'a str, id: &str) -> &'a str {
        let at = styles.find(&format!("w:styleId=\"{id}\"")).unwrap_or_else(|| panic!("no style {id}"));
        let end = styles[at..].find("</w:style>").unwrap();
        &styles[at..at + end]
    }

    #[test]
    fn kinds_of_passage_and_of_words_in_word() {
        let Some(s) = setup() else { return };
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        let mut r = with_kinds("nb");
        r.format.text.italics = crate::formats::Italics::Underline;
        let docx = out.join("kinds.docx");
        let e = export(&s.ctx(), &r, Target::Docx, &docx, &ExportOptions::default()).unwrap();
        assert!(e.warnings.is_empty(), "{:?}", e.warnings);
        let document = unzip(&docx, "word/document.xml");
        roxmltree::Document::parse(&document).unwrap();
        let styles = unzip(&docx, "word/styles.xml");
        roxmltree::Document::parse(&styles).unwrap();
        // Every kind of paragraph is a style that is defined, the writer's own among them.
        for style in ["Epigraph", "Attribution", "Letter", "SourceCode", "SectionBreak"] {
            assert!(document.contains(&format!("<w:pStyle w:val=\"{style}\"")), "{style} is not used: {document}");
            assert!(styles.contains(&format!("w:styleId=\"{style}\"")), "{style} is not defined");
        }
        // Pandoc writes the styles anew, with a space before the end of a tag.
        let letter = word_style(&styles, "Letter");
        assert!(
            letter.contains("w:left=\"2268\"") && letter.contains("<w:i />"),
            "as an epigraph, in italics: {letter}"
        );
        // A foreign word carries its language; a word mentioned stands in the marks of the document's.
        assert!(document.contains("<w:lang w:val=\"el\""), "{document}");
        assert!(document.contains("<w:rStyle w:val=\"Foreign\""), "{document}");
        assert!(word_style(&styles, "Foreign").contains("<w:i />"));
        assert!(document.contains("«wrath»"), "{document}");
        // A passage in a language of its own carries it, and has no look of its own.
        for tag in ["de", "grc", "la"] {
            assert!(document.contains(&format!("<w:lang w:val=\"{tag}\"")), "{tag}: {document}");
        }
        let run = |word: &str| {
            let at = document.find(word).unwrap_or_else(|| panic!("no {word}"));
            &document[document[..at].rfind("<w:r>").unwrap()..at]
        };
        assert!(run("Weltschmerz").contains("w:val=\"de\"") && !run("Weltschmerz").contains("<w:i"), "{document}");
        assert!(run("ἄειδε").contains("w:val=\"grc\"") && !run("ἄειδε").contains("w:val=\"el\""), "{document}");
        assert!(run("ἄειδε").contains("<w:rStyle w:val=\"Foreign\""), "{document}");
        // Underlined by the mark, and by the format, which sets italics so: here and in the sample's heading.
        assert_eq!(document.matches("<w:u ").count(), 3, "{document}");
        assert!(document.contains("let x = 1;") && document.contains("let y = 2;"), "{document}");
        assert!(document.contains("* * *"), "{document}");
        assert!(!document.contains("Zzdraftzz"), "a note to oneself goes into no document");
        // A speaker within a line, in the character style beside the paragraph style of a speaker.
        assert!(document.contains("<w:rStyle w:val=\"SpeakerChar\""), "{document}");
        assert!(word_style(&styles, "SpeakerChar").contains("<w:smallCaps"), "{styles}");
        assert!(styles.contains("w:styleId=\"StageDirectionChar\""), "{styles}");

        // In English the marks are the English ones, and italics are italics.
        let r = with_kinds("en-GB");
        export(&s.ctx(), &r, Target::Docx, &docx, &ExportOptions::default()).unwrap();
        let document = unzip(&docx, "word/document.xml");
        assert!(document.contains("“wrath”"), "{document}");
        assert_eq!(document.matches("<w:u ").count(), 1, "{document}");
    }

    #[test]
    fn kinds_of_passage_and_of_words_in_typst_and_latex() {
        let Some(s) = setup() else { return };
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        let r = with_kinds("en-GB");
        let typ = out.join("kinds.typ");
        export(&s.ctx(), &r, Target::Typst, &typ, &ExportOptions::default()).unwrap();
        let t = fs::read_to_string(&typ).unwrap();
        assert!(t.contains("<gk-kind-epigraph>") && t.contains("<gk-kind-k1>"), "{t}");
        assert!(
            t.contains("#show <gk-kind-k1>: it => {\n  set text(size: 12pt, weight: \"regular\", style: \"italic\")"),
            "{t}"
        );
        assert!(t.contains("#underline[underlined]"), "{t}");
        assert!(t.contains("```\nlet x = 1;\nlet y = 2;\n```"), "{t}");
        assert!(t.contains("#text(lang: \"el\")["), "{t}");
        assert!(t.contains("#text(lang: \"de\")[Weltschmerz]"), "{t}");
        assert!(t.contains("#text(lang: \"grc\")[ἄειδε]"), "{t}");
        assert!(t.contains("#text(lang: \"la\")[Arma virumque cano.]"), "{t}");
        assert!(t.contains("“wrath”"), "{t}");
        assert!(!t.contains("Zzdraftzz"));
        let p = preview(&s.ctx(), &r).unwrap();
        assert!(p.warnings.is_empty(), "{:?}", p.warnings);

        let tex = out.join("kinds.tex");
        export(&s.ctx(), &r, Target::Latex, &tex, &ExportOptions::default()).unwrap();
        let l = fs::read_to_string(&tex).unwrap();
        assert!(l.contains("\\foreignlanguage{greek}{\\emph{μῆνις}}"), "{l}");
        assert!(l.contains("\\foreignlanguage{ngerman}{Weltschmerz}"), "{l}");
        assert!(l.contains("\\foreignlanguage{latin}{Arma virumque cano.}"), "{l}");
        assert!(l.contains("\\ul{underlined}"), "{l}");
        assert!(l.contains("\\begin{verbatim}\nlet x = 1;\nlet y = 2;\n\\end{verbatim}"), "{l}");
        assert!(l.contains("\\leftskip=4cm") && l.contains("\\itshape\\raggedright\\noindent Dear friend"), "{l}");
        assert!(!l.contains("Zzdraftzz"));
    }

    #[test]
    fn kinds_of_passage_and_of_words_on_the_web_and_in_writer() {
        let Some(s) = setup() else { return };
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        let r = with_kinds("en-GB");
        let html = out.join("kinds.html");
        export(&s.ctx(), &r, Target::Html, &html, &ExportOptions::default()).unwrap();
        let h = fs::read_to_string(&html).unwrap();
        assert!(h.contains("class=\"gk-kind-epigraph\"") && h.contains("class=\"gk-kind-k1\""), "{h}");
        assert!(h.contains(".gk-kind-k1 { ") && h.contains("span.gk-kind-foreign { font-style: italic; }"), "{h}");
        assert!(h.contains("lang=\"el\""), "{h}");
        assert!(h.contains("<span lang=\"de\">Weltschmerz</span>"), "{h}");
        assert!(h.contains("<span lang=\"la\">Arma virumque cano.</span>"), "{h}");
        assert!(h.contains("<u>underlined</u>") && h.contains("<pre"), "{h}");
        assert!(!h.contains("Zzdraftzz"));

        let odt = out.join("kinds.odt");
        let e = export(&s.ctx(), &r, Target::Odt, &odt, &ExportOptions::default()).unwrap();
        assert!(e.warnings.is_empty(), "{:?}", e.warnings);
        let content = unzip(&odt, "content.xml");
        roxmltree::Document::parse(&content).unwrap();
        let styles = unzip(&odt, "styles.xml");
        roxmltree::Document::parse(&styles).unwrap();
        for style in ["Epigraph", "Attribution", "Letter", "Preformatted_20_Text", "Section_20_Break"] {
            assert!(content.contains(&format!("text:style-name=\"{style}\"")), "{style} is not used: {content}");
        }
        assert!(content.contains("<text:span text:style-name=\"Foreign\">"), "{content}");
        for tag in ["de", "la"] {
            assert!(content.contains(&format!("fo:language=\"{tag}\"")), "{tag}: {content}");
        }
        for style in ["Epigraph", "Letter", "Foreign", "Source_20_Code", "Stage_20_Direction"] {
            assert!(styles.contains(&format!("style:name=\"{style}\"")), "{style} is not defined");
        }
        assert!(!content.contains("Zzdraftzz"));
    }

    #[test]
    fn counting_words() {
        let d = sample();
        assert_eq!(count_words(&d, false), 22);
        assert_eq!(count_words(&d, true), 25);

        // What is said of a figure is counted, and a formula in the line is a word.
        let mut d = d;
        d.sections[1].blocks.push(crate::document::Block::Figure {
            id: String::new(),
            align: None,
            wrap: None,
            file: "a".repeat(64),
            extension: "png".into(),
            name: "vase.png".into(),
            caption: vec![crate::document::fixtures::text("A vase, seen from above")],
            alt: "not counted".into(),
            width: 100,
            numbered: true,
        });
        d.sections[1].blocks.push(crate::document::Block::Equation {
            align: None,
            id: String::new(),
            tex: "a = b".into(),
            numbered: true,
        });
        d.sections[1].blocks.push(crate::document::Block::paragraph(vec![
            crate::document::fixtures::text("where"),
            Inline::Math { tex: "x".into() },
        ]));
        assert_eq!(count_words(&d, false), 22 + 5 + 2);
    }

    #[test]
    fn files_of_figures_that_cannot_be_placed_are_said_to_be_that() {
        let tmp = tempfile::tempdir().unwrap();
        let resources = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../resources");
        let styles = Styles::new(&resources, &tmp.path().join("styles"));
        let tools = Tools::default();
        let store = tmp.path().join("library");
        let vase = add_picture(&store, "vase.png", &crate::library::figures::fixtures::PNG);
        let ctx = Context {
            tools: &tools,
            resources: &resources,
            styles: &styles,
            library: None,
            work: tmp.path().join("w"),
            fonts: &[],
            pictures: Some(&store),
        };
        let mut request = request("apa");
        request.document.sections[1].blocks.push(Block::Figure {
            id: String::new(),
            align: None,
            wrap: None,
            file: vase.hash.clone(),
            extension: "png".into(),
            name: "vase.png".into(),
            caption: Vec::new(),
            alt: String::new(),
            width: 100,
            numbered: true,
        });
        let into = tmp.path().join("made");
        fs::create_dir_all(&into).unwrap();
        let placed = place_files(&ctx, &request, &into, "files", false);
        assert_eq!(placed.present.len(), 1);
        assert!(placed.remark().is_none());

        // Where the folder of the files cannot be made, that is said, and why.
        fs::write(into.join("blocked"), "a file where the folder would be").unwrap();
        let placed = place_files(&ctx, &request, &into, "blocked", false);
        assert!(placed.present.is_empty());
        let remark = placed.remark().unwrap();
        assert!(remark.starts_with("The file of an image could not be put where the document is made"), "{remark}");
        assert!(remark.contains("blocked"), "{remark}");
    }

    #[test]
    fn a_missing_program_is_named() {
        let tmp = tempfile::tempdir().unwrap();
        let resources = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../resources");
        let styles = Styles::new(&resources, &tmp.path().join("styles"));
        let tools = Tools::default();
        let ctx = Context {
            tools: &tools,
            resources: &resources,
            styles: &styles,
            library: None,
            work: tmp.path().join("w"),
            fonts: &[],
            pictures: None,
        };
        let e = preview(&ctx, &request("apa")).unwrap_err();
        assert_eq!(e.kind(), "missing-program");
        assert_eq!(e.to_string(), "Pandoc is not installed or could not be found");
    }
}
