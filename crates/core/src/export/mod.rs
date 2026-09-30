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

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::AtomicBool;

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value, json};

use crate::document::bibliography::{Bibliography, gather};
use crate::document::pandoc::{
    Converter, Extras, Flavour, meta_blocks, meta_inlines, meta_list, meta_string, meta_text,
};
use crate::document::{Document, Inline, NotePlace};
use crate::error::{Error, IoContext, Result};
use crate::formats::typst::{Particulars, preamble};
use crate::formats::{DocumentFormat, NoteKind, TitlePlacement};
use crate::fsutil::write_atomic;
use crate::library::Library;
use crate::styles::Styles;
use crate::tr;

pub use tools::{Tool, Tools};

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
            Target::Markdown | Target::Html => None,
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Request {
    pub document: Document,
    /// The id of the reference style.
    pub style: String,
    pub format: DocumentFormat,
    /// Tells apart the work of different projects: the id of the project.
    #[serde(default)]
    pub key: String,
}

/// A page of the preview.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Page {
    /// Which page it is, the first being 1.
    pub number: u32,
    /// The page, as SVG.
    pub svg: String,
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
    /// The store of pictures, where the files of the figures are.
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
    if fs::create_dir_all(&to).is_err() {
        return placed;
    }
    for (hash, extension) in wanted {
        let Ok(source) = crate::pictures::file_in(pictures, &hash, &extension) else { continue };
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
        let made = there
            || (light
                && whole > 200_000
                && fs::read(&source)
                    .ok()
                    .and_then(|bytes| crate::pictures::lighter(&bytes, &extension, WIDEST_SHOWN))
                    .is_some_and(|small| write_atomic(&target, &small).is_ok()))
            || fs::copy(&source, &target).is_ok();
        if made {
            placed.present.insert(file);
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
        authors: doc.authors.iter().map(|a| a.name.trim().to_owned()).filter(|n| !n.is_empty()).collect(),
        language: doc.language.clone(),
        lettered_footnotes: f.notes.kind == NoteKind::Endnotes && doc.placed_notes().contains(&NotePlace::Foot),
        flows,
        tables,
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

struct Prepared {
    json: Value,
    bibliography: Bibliography,
    has_citations: bool,
    /// What there is to say of the document that was prepared.
    remarks: Vec<String>,
}

/// Makes the document that Pandoc reads.
fn prepare(ctx: &Context, request: &Request, target: Target, keep_citations: bool, placed: Placed) -> Prepared {
    let doc = &request.document;
    let f = &request.format;
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
        deepest: f.headings.levels.len().clamp(1, 6) as u8,
        extras: Extras::new(
            match target {
                Target::Pdf | Target::Typst => Flavour::Typst,
                Target::Latex | Target::PdfLatex => Flavour::Latex,
                Target::Docx => Flavour::Docx,
                Target::Odt => Flavour::Odt,
                Target::Markdown | Target::Html => Flavour::Plain,
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
    converter.extras.targets = converter.targets(doc, f.headings.numbered);

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
    let authors: Vec<&crate::document::Author> = if f.title.anonymous || !f.title.show_authors {
        Vec::new()
    } else {
        doc.authors.iter().filter(|a| !a.name.trim().is_empty()).collect()
    };
    let abstract_text = doc.abstract_text.as_deref().map(str::trim).filter(|a| !a.is_empty() && f.title.show_abstract);
    let keywords: Vec<&str> = doc.keywords.iter().map(|k| k.trim()).filter(|k| !k.is_empty()).collect();
    let date = doc.date.as_deref().map(str::trim).filter(|d| !d.is_empty() && f.title.show_date);
    let keywords_para = (!keywords.is_empty() && f.title.show_abstract).then(|| {
        let mut inlines = vec![json!({"t": "Strong", "c": meta_text(&format!("{}:", f.title.keywords_label))["c"]})];
        inlines.push(json!({"t": "Space"}));
        inlines.extend(meta_text(&keywords.join(", "))["c"].as_array().cloned().unwrap_or_default());
        json!({"t": "Para", "c": inlines})
    });

    let mut front: Vec<Value> = Vec::new();
    let typst = matches!(target, Target::Pdf | Target::Typst);
    if typst {
        // The title block as blocks with labels, which the preamble gives their form.
        let mut parts: Vec<Value> = Vec::new();
        if !title.is_empty() {
            parts.push(div("gk-title", vec![json!({"t": "Para", "c": title})]));
        }
        if let Some(s) = doc.subtitle.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
            parts.push(div("gk-subtitle", vec![para_text(s)]));
        }
        if !authors.is_empty() {
            let names = authors.iter().map(|a| a.name.trim()).collect::<Vec<_>>().join(", ");
            parts.push(div("gk-authors", vec![para_text(&names)]));
            if f.title.show_affiliations {
                let mut lines: Vec<String> = Vec::new();
                for a in &authors {
                    let line = [a.affiliation.as_deref(), a.email.as_deref(), a.orcid.as_deref().map(|_| "")]
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
                if !lines.is_empty() {
                    parts.push(div("gk-affiliations", lines.iter().map(|l| para_text(l)).collect()));
                }
            }
        }
        if let Some(d) = date {
            parts.push(div("gk-date", vec![para_text(d)]));
        }
        if let Some(a) = abstract_text {
            parts.push(div("gk-abstract-title", vec![para_text(&f.title.abstract_label)]));
            parts.push(div("gk-abstract", meta_blocks(a)["c"].as_array().cloned().unwrap_or_default()));
        }
        if let Some(k) = &keywords_para {
            parts.push(div("gk-keywords", vec![k.clone()]));
        }
        if !parts.is_empty() {
            front.push(div("gk-front", parts));
        }
    } else {
        if !title.is_empty() {
            meta.insert("title".into(), meta_inlines(title));
        }
        if let Some(s) = doc.subtitle.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
            meta.insert("subtitle".into(), meta_text(s));
        }
        if !authors.is_empty() {
            meta.insert("author".into(), meta_list(authors.iter().map(|a| meta_text(a.name.trim())).collect()));
        }
        if let Some(d) = date {
            meta.insert("date".into(), meta_text(d));
        }
        if let Some(a) = abstract_text {
            if target == Target::Odt {
                // Pandoc's pattern for ODT sets an abstract of one paragraph as
                // bare text; here it is given as paragraphs with their styles.
                let styled = |style: &str, blocks: Vec<Value>| json!({"t": "Div", "c": [["", [], [["custom-style", style]]], blocks]});
                front.push(styled("AbstractTitle", vec![para_text(&f.title.abstract_label)]));
                front.push(styled("Abstract", meta_blocks(a)["c"].as_array().cloned().unwrap_or_default()));
            } else {
                meta.insert("abstract".into(), meta_blocks(a));
                meta.insert("abstract-title".into(), meta_text(&f.title.abstract_label));
            }
        }
        if !keywords.is_empty() {
            meta.insert("keywords".into(), meta_list(keywords.iter().map(|k| meta_text(k)).collect()));
        }
        if let Some(k) = keywords_para {
            front.push(k);
        }
        if f.title.placement == TitlePlacement::OwnPage
            && let Some(b) = target.page_break()
        {
            front.push(b);
        }
    }

    let mut json = converter.document(doc, &ctx.tools.pandoc_api, meta);
    let blocks = json["blocks"].as_array_mut().expect("a document has blocks");
    for (i, b) in front.into_iter().enumerate() {
        blocks.insert(i, b);
    }

    // The bibliography: its heading, and the place where Pandoc puts the entries.
    if has_citations && style_has_bibliography && !keep_citations {
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
    }

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
    let remarks: Vec<String> = converter
        .extras
        .absent()
        .into_iter()
        .map(|name| tr!("core-export-picture-missing", name = name))
        .chain(match converter.extras.astray() {
            0 => None,
            n => Some(tr!("core-export-astray", count = n)),
        })
        .collect();

    Prepared { json, bibliography, has_citations, remarks }
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
    if request.format.headings.numbered
        && !matches!(target, Target::Pdf | Target::Typst | Target::Latex | Target::PdfLatex)
    {
        args.push("--number-sections".into());
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
    let prepared = prepare(ctx, request, Target::Typst, false, placed);
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
    ctx.tools.typst()?;
    let began = std::time::Instant::now();
    let dir = work_dir(ctx, &request.key, "preview")?;
    let placed = place_files(ctx, request, &dir, "files", true);
    let prepared = prepare(ctx, request, Target::Typst, false, placed);
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

    let (count, pages, said) = pages_of(ctx, &dir, wanted, stop)?;
    warnings.extend(typst_warnings(&said));
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
    })
}

/// Pages of the document that was made last for a key: those that come into
/// view when the preview is moved through. How many pages there are, and
/// the pages.
pub fn preview_pages(ctx: &Context, key: &str, wanted: &[u32], stop: &AtomicBool) -> Result<(usize, Vec<Page>)> {
    let dir = work_dir(ctx, key, "preview")?;
    if !dir.join("document.typ").is_file() {
        return Err(Error::NotFound(tr!("core-export-preview-document")));
    }
    let (count, pages, _) = pages_of(ctx, &dir, wanted, stop)?;
    Ok((count, pages))
}

/// Has Typst set the document that stands in a directory, and gives the
/// pages that are wanted, with how many there are and what Typst said.
/// Pages that are wanted and are not there are passed over.
fn pages_of(ctx: &Context, dir: &Path, wanted: &[u32], stop: &AtomicBool) -> Result<(usize, Vec<Page>, String)> {
    let typst = ctx.tools.typst()?;
    // Each making has a place of its own for its pages, so that two that
    // are made at once do not take each other's.
    let into = tempfile::Builder::new()
        .prefix("pages-")
        .tempdir_in(dir)
        .context(|| tr!("io-creating-directory-in", path = dir))?;
    let mut wanted: Vec<u32> = wanted.iter().copied().filter(|n| *n > 0).collect();
    wanted.sort_unstable();
    wanted.dedup();
    wanted.truncate(MOST_PAGES);
    let template = into.path().join("page-{p}-of-{t}.svg").display().to_string();

    let run = |pages: Option<String>| {
        let mut args: Vec<String> = vec!["compile".into(), "--format".into(), "svg".into()];
        if let Some(pages) = pages {
            args.push("--pages".into());
            args.push(pages);
        }
        args.push("document.typ".into());
        args.push(template.clone());
        tools::run_until(&typst.path, "Typst", &args, None, Some(dir), stop)
    };
    let list = |pages: &[u32]| pages.iter().map(u32::to_string).collect::<Vec<_>>().join(",");
    let out = if wanted.is_empty() {
        run(None)?
    } else {
        // A page that is wanted may not be there, the document having grown shorter: Typst
        // refuses then, or gives nothing. The first page says how many there are, and those
        // that are there are asked for again.
        let first = match run(Some(list(&wanted))) {
            Ok(out) if read_pages(into.path())?.0 > 0 => Some(out),
            Ok(_) | Err(Error::Program { .. }) => None,
            Err(e) => return Err(e),
        };
        match first {
            Some(out) => out,
            None => {
                let first = run(Some("1".into()))?;
                let count = read_pages(into.path())?.0;
                let there: Vec<u32> = wanted.iter().copied().filter(|n| (*n as usize) <= count && *n != 1).collect();
                if there.is_empty() { first } else { run(Some(list(&there)))? }
            }
        }
    };
    let (count, pages) = read_pages(into.path())?;
    Ok((count, pages, out.messages))
}

/// The pages that stand in a directory, named `page-<number>-of-<count>.svg`.
fn read_pages(dir: &Path) -> Result<(usize, Vec<Page>)> {
    let mut count = 0usize;
    let mut found: Vec<(u32, PathBuf)> = Vec::new();
    for entry in fs::read_dir(dir).context(|| tr!("io-reading", path = dir))?.flatten() {
        let name = entry.file_name().to_string_lossy().into_owned();
        let Some(rest) = name.strip_prefix("page-").and_then(|n| n.strip_suffix(".svg")) else { continue };
        let Some((number, of)) = rest.split_once("-of-") else { continue };
        let (Ok(number), Ok(of)) = (number.parse::<u32>(), of.parse::<usize>()) else { continue };
        count = count.max(of);
        found.push((number, entry.path()));
    }
    found.sort_by_key(|(number, _)| *number);
    let mut pages = Vec::with_capacity(found.len());
    for (number, path) in found {
        let svg = fs::read_to_string(&path).context(|| tr!("io-reading", path = &path))?;
        pages.push(Page { number, svg });
    }
    Ok((count, pages))
}

fn typst_warnings(messages: &str) -> Vec<String> {
    messages
        .lines()
        .filter(|l| l.starts_with("warning:") || l.starts_with("error:"))
        .map(|l| l.trim_start_matches("warning:").trim().to_owned())
        .filter(|l| !l.to_lowercase().contains("unknown font family"))
        .collect()
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
        let typst = ctx.tools.typst()?;
        write_atomic(&dir.join("document.typ"), source.as_bytes())?;
        let made = dir.join("document.pdf");
        let out = tools::run_until(
            &typst.path,
            "Typst",
            ["compile", "document.typ", "document.pdf"],
            None,
            Some(&dir),
            stop,
        )?;
        exported.warnings.extend(typst_warnings(&out.messages));
        let bytes = fs::read(&made).context(|| tr!("core-export-reading-pdf"))?;
        write_atomic(path, &bytes)?;
        return Ok(exported);
    }

    let keep_citations = target == Target::Latex && options.biblatex || target == Target::Markdown;
    let files = files_name(target, Some(path));
    let placed = place_files(ctx, request, &dir, &files, false);
    let prepared = prepare(ctx, request, target, keep_citations, placed);
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
                let with_break = reference::odt(&default, &request.format, &p)?;
                add_odt_break(&with_break)?
            };
            let pattern_path = dir.join(name);
            write_atomic(&pattern_path, &pattern)?;
            args.push("--reference-doc".into());
            args.push(pattern_path.display().to_string());
        }
        Target::Latex | Target::PdfLatex => {
            let settings = latex::settings(&request.format, &p);
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
            write_atomic(&header, settings.header.as_bytes())?;
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
            write_atomic(&header, format!("<style>\n{}</style>\n", html_styles(&request.format)).as_bytes())?;
            args.push("--include-in-header".into());
            args.push(header.display().to_string());
        }
        Target::Pdf | Target::Typst => unreachable!(),
    }
    // In a PDF the citations are always set by the reference style.
    debug_assert!(target != Target::PdfLatex || !keep_citations);

    let made = dir.join(format!("document.{}", target.extension()));
    args.push("-o".into());
    args.push(made.display().to_string());
    let input = serde_json::to_vec(&prepared.json)?;
    let out = tools::run_until(&pandoc.path, "Pandoc", &args, Some(&input), Some(&dir), stop).map_err(|e| match e {
        // What LaTeX says when it fails is long, and the first of it says little.
        Error::Program { message, .. } if target == Target::PdfLatex => {
            Error::Program { program: "LaTeX".into(), message: latex::what_went_wrong(&message) }
        }
        other => other,
    })?;
    exported.warnings.extend(warnings_of(&out.messages).into_iter().filter(|w| {
        // What LaTeX says of its own packages is of no use to the one who writes.
        target != Target::PdfLatex
            || !(w.contains("LaTeX Warning: Command") || w.contains("Check if current package is valid"))
    }));
    exported.missing = prepared.bibliography.missing;
    let bytes = fs::read(&made).context(|| tr!("core-export-reading-made"))?;
    // What Pandoc cannot be told, of a document for a word processor, is set right after.
    let bytes = match target {
        Target::Docx => after::docx(&bytes)?,
        Target::Odt => after::odt(&bytes, &request.format)?,
        _ => bytes,
    };
    write_atomic(path, &bytes)?;
    if matches!(target, Target::Latex | Target::Markdown) {
        files_beside(ctx, request, path, &files, &mut exported);
    }
    Ok(exported)
}

/// The styles of figures, tables and rows for a page of the web.
fn html_styles(f: &DocumentFormat) -> String {
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
    format!(
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
    )
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

    let converter =
        Converter { keys: &bibliography.keys, language, run_in: Vec::new(), deepest: 6, extras: Default::default() };
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
                // A formula in the line stands for a word, and so do words that point.
                Inline::Math { .. } | Inline::CrossRef { .. } => out.push_str(" x "),
                _ => {}
            }
        }
    }
    fn blocks(list: &[crate::document::Block], with_notes: bool, out: &mut String) {
        use crate::document::Block;
        for b in list {
            match b {
                Block::Paragraph { content } => inlines(content, with_notes, out),
                Block::Figure { caption, .. } => inlines(caption, with_notes, out),
                Block::Equation { .. } => {}
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
                Block::Blockquote { content } => blocks(content, with_notes, out),
                Block::BulletList { items } | Block::OrderedList { items, .. } => {
                    for item in items {
                        blocks(item, with_notes, out);
                    }
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
    text.split(|c: char| !(c.is_alphanumeric() || c == '\'' || c == '’' || c == '-'))
        .filter(|w| w.chars().any(char::is_alphanumeric))
        .count()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::document::fixtures::sample;
    use crate::pictures::Pictures;

    struct Setup {
        _tmp: tempfile::TempDir,
        tools: Tools,
        resources: PathBuf,
        styles: Styles,
        work: PathBuf,
        pictures: PathBuf,
    }

    /// Nothing, when Pandoc and Typst are not installed: the tests that need
    /// them are then passed over.
    fn setup() -> Option<Setup> {
        let tools = tools::discover(&tools::Configured::default());
        if tools.pandoc.is_none() || tools.typst.is_none() {
            eprintln!("Pandoc or Typst is not installed; the test is passed over");
            return None;
        }
        let tmp = tempfile::tempdir().unwrap();
        let resources = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../resources");
        let styles = Styles::new(&resources, &tmp.path().join("styles"));
        let work = tmp.path().join("work");
        let pictures = tmp.path().join("pictures");
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

    fn request(style: &str) -> Request {
        let mut document = sample();
        document.abstract_text = Some("What the wrath of Achilles is.".into());
        document.keywords = vec!["Homer".into(), "wrath".into()];
        Request {
            document,
            style: style.into(),
            format: DocumentFormat { name: "Test".into(), ..Default::default() },
            key: "test".into(),
        }
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
                if let crate::document::Block::Paragraph { content } = block {
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
    fn documents_for_word_processors() {
        let Some(s) = setup() else { return };
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        let mut r = request("chicago-author-date");
        r.format.page.size = "letter".into();
        r.format.page_numbers.position = crate::formats::Position::TopRight;
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
        let styles = unzip(&docx, "word/styles.xml");
        assert!(styles.contains("w:line=\"480\""));
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
        let styles = unzip(&odt, "styles.xml");
        roxmltree::Document::parse(&styles).unwrap();
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
        } else {
            eprintln!("no LaTeX: the PDF by LaTeX is not tested");
        }
    }

    /// The sample, with a drawing, a photograph that is not there, and mathematics.
    fn with_figures(s: &Setup) -> Request {
        use crate::document::Block;
        use crate::document::fixtures::text;
        use crate::pictures::fixtures::{PNG, SVG};
        let mut r = request("chicago-author-date");
        r.key = "p1".into();
        let pictures = Pictures::open(&s.pictures).unwrap();
        let drawing = pictures.add("circle.svg", SVG.as_bytes()).unwrap();
        let picture = pictures.add("vase.png", &PNG).unwrap();
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
        blocks.push(Block::Paragraph {
            content: vec![text("Where "), Inline::Math { tex: "x_i \\leq \\alpha".into() }, text(" holds:")],
        });
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
        assert!(text.contains("The picture is not here: lost.jpg"));
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
            content: vec![Block::Paragraph { content: vec![text(words)] }],
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
        let para = |words: &str| Block::Paragraph { content: vec![text(words)] };
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
            blocks.push(Block::Paragraph {
                content: vec![
                    text("See "),
                    Inline::CrossRef { target: "t-poems".into(), form: RefForm::Full },
                    text("."),
                ],
            });
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
            blocks: vec![Block::Paragraph {
                content: vec![
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
                ],
            }],
            element: Some("e2".into()),
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
        let kept = Pictures::open(&s.pictures).unwrap().add("large.png", bytes.get_ref()).unwrap();
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
        d.sections[1].blocks.push(crate::document::Block::Paragraph {
            content: vec![crate::document::fixtures::text("where"), Inline::Math { tex: "x".into() }],
        });
        assert_eq!(count_words(&d, false), 22 + 5 + 2);
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
