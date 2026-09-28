//! Preview and export.
//!
//! The document is handed to Pandoc as JSON. Pandoc formats the citations and
//! writes the output; for the preview and for PDF it writes Typst, which Typst
//! makes into pages. See ADR 0005.

pub mod latex;
pub mod math;
pub mod reference;
pub mod tools;

use std::fs;
use std::path::{Path, PathBuf};

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
use crate::pictures::Pictures;
use crate::styles::Styles;

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

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Preview {
    /// The pages, each an SVG.
    pub pages: Vec<String>,
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
    /// Where the projects are kept: the files of the figures of a document
    /// are with the project it is made from.
    pub projects: Option<&'a Path>,
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

/// Puts the files of the figures into a directory beside what is made.
fn place_files(ctx: &Context, request: &Request, into: &Path, name: &str) -> Placed {
    let mut placed = Placed { name: name.to_owned(), ..Default::default() };
    let wanted = request.document.figure_files();
    let Some(projects) = ctx.projects else { return placed };
    if wanted.is_empty() {
        return placed;
    }
    let pictures = Pictures::of(&projects.join(safe_key(&request.key)));
    let to = into.join(name);
    if fs::create_dir_all(&to).is_err() {
        return placed;
    }
    for (hash, extension) in wanted {
        let Ok(source) = pictures.path(&hash, &extension) else { continue };
        let file = format!("{hash}.{extension}");
        let target = to.join(&file);
        // A file is what its name says: one that is there need not be copied again.
        let there =
            target.is_file() && target.metadata().ok().map(|m| m.len()) == source.metadata().ok().map(|m| m.len());
        if there || fs::copy(&source, &target).is_ok() {
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
    Particulars {
        title: doc.title_plain(),
        authors: doc.authors.iter().map(|a| a.name.trim().to_owned()).filter(|n| !n.is_empty()).collect(),
        language: doc.language.clone(),
        lettered_footnotes: f.notes.kind == NoteKind::Endnotes && doc.placed_notes().contains(&NotePlace::Foot),
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
                Target::Docx | Target::Odt => Flavour::Styled,
                Target::Markdown | Target::Html => Flavour::Plain,
            },
            f.figures.clone(),
            f.equations.clone(),
            placed.name,
            placed.present,
        ),
    };
    converter.extras.first_indented = f.text.indent_first;

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
    let remarks: Vec<String> = converter
        .extras
        .absent()
        .into_iter()
        .map(|name| format!("The picture “{name}” is not on this computer, and is left out of the document."))
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
    fs::create_dir_all(&dir).context(|| format!("creating {}", dir.display()))?;
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
    let placed = place_files(ctx, request, parent, name);
    if !placed.present.is_empty() {
        exported.also.push(parent.join(name).display().to_string());
    }
}

/// The document as Typst, whole.
fn typst_source(ctx: &Context, request: &Request, dir: &Path, files: &str) -> Result<(String, Prepared, Vec<String>)> {
    let pandoc = ctx.tools.pandoc()?;
    let placed = place_files(ctx, request, dir, files);
    let prepared = prepare(ctx, request, Target::Typst, false, placed);
    let bib = dir.join("references.bib");
    write_atomic(&bib, prepared.bibliography.text.as_bytes())?;
    let args = arguments(ctx, request, Target::Typst, &prepared, &bib, false)?;
    let input = serde_json::to_vec(&prepared.json)?;
    let out = tools::run(&pandoc.path, "Pandoc", &args, Some(&input), Some(dir))?;
    let body = String::from_utf8_lossy(&out.stdout).into_owned();
    let mut source = preamble(&request.format, &particulars(&request.document, &request.format));
    source.push_str(&body);
    let mut warnings = prepared.remarks.clone();
    warnings.extend(warnings_of(&out.messages));
    Ok((source, prepared, warnings))
}

pub fn preview(ctx: &Context, request: &Request) -> Result<Preview> {
    ctx.tools.pandoc()?;
    let typst = ctx.tools.typst()?;
    let dir = work_dir(ctx, &request.key, "preview")?;
    let (source, prepared, mut warnings) = typst_source(ctx, request, &dir, "files")?;
    write_atomic(&dir.join("document.typ"), source.as_bytes())?;

    // Pages of an earlier run must not be taken for pages of this one.
    if let Ok(entries) = fs::read_dir(&dir) {
        for e in entries.flatten() {
            let name = e.file_name().to_string_lossy().into_owned();
            if name.starts_with("page-") && name.ends_with(".svg") {
                let _ = fs::remove_file(e.path());
            }
        }
    }
    let out = tools::run(
        &typst.path,
        "Typst",
        ["compile", "--format", "svg", "document.typ", "page-{0p}.svg"],
        None,
        Some(&dir),
    )?;
    warnings.extend(typst_warnings(&out.messages));

    let mut names: Vec<String> = fs::read_dir(&dir)
        .context(|| format!("reading {}", dir.display()))?
        .flatten()
        .map(|e| e.file_name().to_string_lossy().into_owned())
        .filter(|n| n.starts_with("page-") && n.ends_with(".svg"))
        .collect();
    names.sort_by_key(|n| n.trim_start_matches("page-").trim_end_matches(".svg").parse::<u32>().unwrap_or(0));
    let mut pages = Vec::with_capacity(names.len());
    for n in &names {
        pages.push(fs::read_to_string(dir.join(n)).context(|| format!("reading {n}"))?);
    }
    let (width, height) = request.format.page.dimensions();
    Ok(Preview {
        pages,
        width,
        height,
        warnings,
        missing: prepared.bibliography.missing,
        substitute: reference::substitute(&request.format, ctx.fonts),
    })
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
    let pandoc = ctx.tools.pandoc()?;
    let dir = work_dir(ctx, &request.key, "export")?;
    let mut exported = Exported { path: path.display().to_string(), ..Default::default() };
    let p = particulars(&request.document, &request.format);

    if matches!(target, Target::Pdf | Target::Typst) {
        let files = files_name(target, Some(path));
        let (source, prepared, warnings) = typst_source(ctx, request, &dir, &files)?;
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
        let out = tools::run(&typst.path, "Typst", ["compile", "document.typ", "document.pdf"], None, Some(&dir))?;
        exported.warnings.extend(typst_warnings(&out.messages));
        let bytes = fs::read(&made).context(|| "reading the PDF that was made".to_owned())?;
        write_atomic(path, &bytes)?;
        return Ok(exported);
    }

    let keep_citations = target == Target::Latex && options.biblatex || target == Target::Markdown;
    let files = files_name(target, Some(path));
    let placed = place_files(ctx, request, &dir, &files);
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
                    exported.warnings.push(format!(
                        "{} is not installed. The document is set in Latin Modern, the font that LaTeX has of its own.",
                        request.format.font.family
                    ));
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
                args.push(format!("biblio-title={}", request.format.bibliography.title));
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
        }
        Target::Pdf | Target::Typst => unreachable!(),
    }
    // In a PDF the citations are always set by the reference style.
    debug_assert!(target != Target::PdfLatex || !keep_citations);

    let made = dir.join(format!("document.{}", target.extension()));
    args.push("-o".into());
    args.push(made.display().to_string());
    let input = serde_json::to_vec(&prepared.json)?;
    let out = tools::run(&pandoc.path, "Pandoc", &args, Some(&input), Some(&dir)).map_err(|e| match e {
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
    let bytes = fs::read(&made).context(|| "reading the document that was made".to_owned())?;
    write_atomic(path, &bytes)?;
    if matches!(target, Target::Latex | Target::Markdown) {
        files_beside(ctx, request, path, &files, &mut exported);
    }
    Ok(exported)
}

fn add_odt_break(odt: &[u8]) -> Result<Vec<u8>> {
    use std::io::{Cursor, Read, Write};
    let mut archive = zip::ZipArchive::new(Cursor::new(odt))
        .map_err(|e| Error::invalid(format!("the pattern document could not be read: {e}")))?;
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
        file.read_to_end(&mut bytes).map_err(|e| Error::io("reading the pattern document", e))?;
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
        out.write_all(&bytes).map_err(|e| Error::io("writing the pattern document", e))?;
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
                // Mathematics in the line stands for a word.
                Inline::Math { .. } => out.push_str(" x "),
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

    struct Setup {
        _tmp: tempfile::TempDir,
        tools: Tools,
        resources: PathBuf,
        styles: Styles,
        work: PathBuf,
        projects: PathBuf,
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
        let projects = tmp.path().join("projects");
        Some(Setup { _tmp: tmp, tools, resources, styles, work, projects })
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
                projects: Some(&self.projects),
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
        assert!(p.pages[0].starts_with("<svg"));
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
    fn latex_markdown_and_pdf() {
        let Some(s) = setup() else { return };
        let out = s.work.join("out");
        fs::create_dir_all(&out).unwrap();
        let r = request("chicago-author-date");

        let tex = out.join("wrath.tex");
        export(&s.ctx(), &r, Target::Latex, &tex, &ExportOptions::default()).unwrap();
        let text = fs::read_to_string(&tex).unwrap();
        assert!(text.contains("\\documentclass"));
        assert!(text.contains("Nagy 1979, 73"));
        assert!(text.contains("\\titleformat{\\section}"));
        assert!(text.contains("\\setstretch{2}"));

        let e = export(&s.ctx(), &r, Target::Latex, &tex, &ExportOptions { biblatex: true }).unwrap();
        let text = fs::read_to_string(&tex).unwrap();
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
        let pictures = Pictures::of(&s.projects.join("p1"));
        let drawing = pictures.add("circle.svg", SVG.as_bytes()).unwrap();
        let picture = pictures.add("vase.png", &PNG).unwrap();
        let blocks = &mut r.document.sections[1].blocks;
        blocks.push(Block::Figure {
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
        blocks.push(Block::Equation { tex: "a^2 + b^2 = c^2".into(), numbered: true });
        blocks.push(Block::Equation { tex: "e^{i\\pi} = -1".into(), numbered: false });
        blocks.push(Block::Equation { tex: "\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}".into(), numbered: true });
        blocks.push(Block::Figure {
            file: picture.hash,
            extension: "png".into(),
            name: picture.name,
            caption: vec![text("A vase")],
            alt: String::new(),
            width: 100,
            numbered: true,
        });
        blocks.push(Block::Figure {
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
        assert!(text.contains("] <gk-figure>") && text.contains("] <gk-caption>"));
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
        assert!(text.contains("class=\"gk-figure\""));
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
            file: "a".repeat(64),
            extension: "png".into(),
            name: "vase.png".into(),
            caption: vec![crate::document::fixtures::text("A vase, seen from above")],
            alt: "not counted".into(),
            width: 100,
            numbered: true,
        });
        d.sections[1].blocks.push(crate::document::Block::Equation { tex: "a = b".into(), numbered: true });
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
            projects: None,
        };
        let e = preview(&ctx, &request("apa")).unwrap_err();
        assert_eq!(e.kind(), "missing-program");
        assert_eq!(e.to_string(), "Pandoc is not installed or could not be found");
    }
}
