# Build plan: the title page in every document, where the template puts it

The working plan for `docs/adr/0055-the-title-page-in-every-document.md`. Read the record first, in full: it says what; this says how, in which files, with which interfaces, and how each step is verified. Where they disagree, the record wins; say so in your report. Read also `docs/plans/the-shape-of-a-text-and-its-org-form.md`, section "How to work", and `docs/plans/what-you-are-writing.md`, section "How to work, tonight": both hold here. This is a piece of the core, built in one session, step by step, each step a commit; no agents are needed.

## How to work

- Plain words everywhere; never a record number when writing for the owner.
- Checks: `cargo test -p glaukopis-core` (its tests of documents run only where Pandoc and Typst are installed, as they are on this computer: `setup()` returns `None` otherwise), `cargo fmt -p glaukopis-core` (put `crates/core/build.rs` back with `git checkout crates/core/build.rs` if it reformats it), `cargo clippy -p glaukopis-core --all-targets -- -D warnings`, `pnpm check`, `pnpm test`; the e2e scripts named in step 5, with `pnpm e2e:build` first. Paste the counts into your report.
- Commit when a step is whole, without asking; never push; never start the Installers workflow or make a tag. End every commit message with the attribution line the session gives you.
- Before you change anything, make the small document of step 0 and keep its files: they show you what Pandoc writes today, and after each step what the core writes instead.

## Vocabulary

- *The title page*: the generated part `title-page` (`GeneratedPart::TitlePage`): the title, the subtitle, the authors with their affiliations, and the date, as the layout's title look (`DocumentFormat::title`, `TitleBlock`) shows or hides each.
- *The front*: the title page with the abstract and the keywords, which Typst gathers in one block `<gk-front>`.
- *The properties*: what a file says of itself outside its pages: Word's `docProps/core.xml`, Writer's `meta.xml`, a web page's `<head>`, a PDF's `\hypersetup`, an e-book's `content.opf`.
- *Withheld*: a metadata key the core no longer gives Pandoc for a target.

## What exists, and what each piece becomes

| Today (`crates/core/src/export/mod.rs`, `prepare`) | Becomes |
| --- | --- |
| `Item::Made(TitlePage)`, `!typst`: a page break where the title is on its own page, then `continue`, with the comment that the title block is metadata | the title page written per target (steps 1–3), then the page break |
| after the items: `meta` gets `title`, `subtitle`, `author`, `date`, `keywords`, identifiers for `!typst` | `keywords`, `lang` and the identifiers for all; `title`/`subtitle`/`author`/`date` for Markdown and the e-book only; `title-meta`/`author-meta` for LaTeX; `pagetitle`/`author-meta`/`date-meta` for the web page |
| `Item::Part(p) if p.kind == "abstract"`: Typst blocks; Writer styled Divs; else `meta.abstract` + `meta["abstract-title"]` | Typst as now; Word as Writer; LaTeX the `abstract` environment in place; web page and e-book the blocks `abstract-title` and `abstract` in place; Markdown as now |
| `after::docx(&bytes)`, `after::odt(&bytes, &format)` | `after::docx(&bytes, &properties)`, `after::odt(&bytes, &format, &properties)`: the properties written where Pandoc wrote none |
| `reference.rs`: styles Title, Subtitle, Author, Date in both reference documents | plus Affiliation |

## Step 0 — what Pandoc writes today

In the scratchpad, a Markdown file with title, subtitle, two authors, a date, keywords and an abstract, run through `pandoc -s` to `.docx`, `.odt`, `html5`, `latex`, `epub3` and `markdown`. Read `docProps/core.xml` and `word/document.xml` of the Word file, `meta.xml` and `content.xml` of the Writer file, the `<head>` and the `<header id="title-block-header">` of the page, the preamble and `\maketitle` of the LaTeX, and `EPUB/content.opf` of the book. Note which elements the properties have (`dc:title`, `dc:creator`, `cp:keywords`; `dc:title`, `meta:initial-creator`, `dc:creator`, `meta:keyword`) and in which order Pandoc writes the title block's paragraphs. Nothing is committed in this step.

## Step 1 — Word and Writer

### 1.1 The title page — `export/mod.rs`, `prepare`

At `Item::Made(GeneratedPart::TitlePage)`, for `Target::Docx | Target::Odt`, push into `blocks`, in this order and only what is there:

```rust
// A paragraph in a style of the reference document.
let styled = |style: &str, inlines: Value| json!({"t": "Div", "c": [["", [], [["custom-style", style]]], [json!({"t": "Para", "c": inlines})]]});
styled("Title", title.clone())                                   // title: converter.inlines(&doc.title), as now
styled("Subtitle", meta_text(subtitle)["c"])                     // where doc.subtitle is given
for each author in `authors` (already empty where anonymous or !show_authors):
    styled("Author", meta_text(name)["c"])
    styled("Affiliation", meta_text(line)["c"])                  // where f.title.show_affiliations and the line is not empty; the line as the Typst branch composes it (affiliation, email, "ORCID …")
styled("Date", meta_text(date)["c"])                             // where `date` (already None where !show_date)
then the page break where f.title.placement == OwnPage, as now
```

Keep the Typst branch as it is. The `continue` goes; the comment about metadata goes. Factor the affiliation line out of the Typst branch into a function `affiliation_line(author: &Author) -> Option<String>`, used by both.

### 1.2 The abstract — same function

Make the Word branch the Writer branch: `Target::Docx | Target::Odt` write `styled("AbstractTitle", …)` and `styled("Abstract", blocks)` (the Div holding the abstract's blocks, as the Writer branch does), at the part's place. The `else` that puts `abstract` into `meta` stays for the other targets until steps 2 and 3 take theirs.

### 1.3 The metadata — same function, after the loop

```rust
let (title_as_meta, front_as_meta) = match target {
    Target::Markdown | Target::Epub => (true, true),   // the e-book's package needs them; Pandoc makes it no title page (--epub-title-page=false)
    _ => (false, false),
};
```

Give `title`, `subtitle`, `author` and `date` only where `title_as_meta`. `keywords`, `lang`, `gk-notes-*` and `identifier_meta` stay for every target but Typst, as now. (Steps 2 and 3 add `title-meta`/`author-meta` and `pagetitle`/`author-meta`/`date-meta`.) The e-book's abstract: step 3.

### 1.4 The properties — `export/after.rs`, `export/mod.rs`

```rust
/// What a file says of itself outside its pages, where Pandoc was given nothing to say it from.
pub struct Properties { pub title: String, pub creators: Vec<String>, pub keywords: Vec<String> }

pub fn docx(bytes: &[u8], properties: &Properties) -> Result<Vec<u8>>   // rewrites docProps/core.xml too
pub fn odt(bytes: &[u8], format: &DocumentFormat, properties: &Properties) -> Result<Vec<u8>>   // rewrites meta.xml too
```

In `core.xml`: where there is no `<dc:title>`, insert `<dc:title>…</dc:title>` before `</cp:coreProperties>`; likewise `<dc:creator>` with the creators joined by `; `, and `<cp:keywords>` with the keywords joined by `, ` where Pandoc wrote none (it writes it from the `keywords` metadata, which is kept: so usually it is there). In `meta.xml`: `<dc:title>`, `<meta:initial-creator>`, `<dc:creator>`, `<meta:keyword>`, inserted before `</office:meta>` where absent; where Pandoc wrote the element empty (`<dc:title/>` or `<dc:title></dc:title>`), replace it. Escape `&`, `<`, `>` and `"` in the values with the function `reference.rs` has for it (line 19, which replaces the four). Keep the XML well formed: the tests parse the files with `roxmltree`.

The properties, in `export_to` (near line 1372 of `mod.rs`): `title: request.document.title_plain()`, `creators`: every author with a name, unless `request.format.title.anonymous`, in which case none; `keywords` as the document has them. A title that is empty writes no `dc:title`.

### 1.5 The style Affiliation — `export/reference.rs`

Word: in the loop that writes Author and Date, add `("Affiliation", "Affiliation")`, with the Author's paragraph values and a run size of `(f.font.size - 1.0).max(8.0)`. The list near line 229 of `reference.rs` (`"Normal" | "BodyText" | "Title" | …`) names the styles Word has of its own, which are written without `w:customStyle`; Affiliation is not one of them, so it is left out of that list and written as a custom style, like Author. The `styles.lua` filter leaves a style name without a space alone, so nothing is needed there. Writer: an `OdtStyle { name: "Affiliation", parent: Some("Standard"), paragraph: as Author's, text: odt_text(Some((size - 1.0).max(8.0)), None, None, Case::None) }`.

### 1.6 Tests — `export/mod.rs`, `export/after.rs`

- `documents_for_word_processors` (line ~2561): add that `word/document.xml` has `w:pStyle w:val="Title"` exactly once and `w:val="Author"` once, in that order, before the first heading; that `docProps/core.xml` holds `<dc:title>Wrath and the hero</dc:title>` (whatever the fixture's title is) and a `<dc:creator>`; for Writer, that `content.xml` has `text:style-name="Title"` once and `meta.xml` has `<dc:title>` and `<meta:initial-creator>`.
- New, `the_title_page_stands_where_the_template_puts_it_or_nowhere`: a template whose contents are `half-title, title-page, body` (make one from `Template::plain()`): in Word the paragraph of the half title stands before the Title paragraph of the title page (both are in the Title style: tell them by their order and by the page break between them); a template whose contents are `body, bibliography` alone: no Title, Subtitle, Author or Date paragraph in `document.xml`, and `core.xml` still has `<dc:title>` and `<dc:creator>`. The same two for Writer.
- `after.rs`: a unit test of the insertion into a small `core.xml` and `meta.xml`, with a title that holds `&`.
- An anonymous layout: no `<dc:creator>`; `show_authors: false` without anonymity: `<dc:creator>` there, no Author paragraph.

Verify: `cargo test -p glaukopis-core`, clippy, fmt. Commit.

## Step 2 — LaTeX

### 2.1 The title page

At `Item::Made(TitlePage)` for `Target::Latex | Target::PdfLatex`, push one `Plain` block whose inlines are raw LaTeX around the title's own inlines, so that italics in a title survive:

```
RawInline latex "\title{"  + title inlines
  + (subtitle: RawInline "\\[0.35em]{\large " + subtitle inlines + RawInline "}")
  + RawInline "}\author{"
  + for each author: name inlines, (affiliation: RawInline "\\ {\small " + line + "}"), between authors RawInline " \and "
  + RawInline "}\date{" + date inlines + RawInline "}\maketitle"
```

`\author{}` with nothing and `\date{}` with nothing are right where there is none (an empty `\date{}` prints no date; without it LaTeX prints today's). Then the page break where own page, as now (`\clearpage`). Pandoc's template still writes `\author{}` and `\date{}` in the preamble from the withheld metadata, empty: harmless. Note the template defines `\subtitle` only when a `subtitle` is given, which it no longer is: the subtitle goes inside `\title` as above, not through `\subtitle`.

### 2.2 The abstract

At the abstract part for LaTeX: `RawBlock latex "\begin{abstract}"`, the abstract's blocks, `RawBlock latex "\end{abstract}"`, in place. The document class is `article` (set in `latex::settings`), which has the environment. Where the layout's abstract label differs from "Abstract", `\renewcommand{\abstractname}{…}` in a `RawBlock` before it, with the label escaped by `latex::escape`.

### 2.3 The metadata

For LaTeX, `meta["title-meta"] = meta_text(plain title)` and `meta["author-meta"] = meta_list(names)` (the authors unless anonymous: the same `creators` as the properties), so that `\hypersetup` has `pdftitle` and `pdfauthor`; `pdfkeywords` comes from `keywords`, kept.

### 2.4 Tests

In `the_parts_of_a_document_are_placed_as_the_template_says` (LaTeX part) and a new test: `\maketitle` stands after `\begin{document}` and before the body's first words, `pdftitle={…}` is in the preamble; with the title page off: no `\maketitle`, `pdftitle` still there; with a half title: the half title's text before `\maketitle`; the abstract between `\begin{abstract}` and `\end{abstract}`, after `\maketitle`. If LaTeX is installed here (`pdflatex`/`lualatex`), export to `Target::PdfLatex` once in a test guarded like the others and assert only that it succeeds.

Verify, commit.

## Step 3 — the web page and the e-book

### 3.1 The title page

At `Item::Made(TitlePage)` for `Target::Html | Target::Epub`, push one Div with id `gk-front` and class `gk-front`, holding Divs by class, each with its paragraphs: `gk-title` (one Para, the title inlines), `gk-subtitle`, `gk-authors` (one Para per author), `gk-affiliations` (one Para per line), `gk-date`. Classes, not ids, for what may stand more than once in a book.

### 3.2 The abstract

For `Html | Epub`: at the part's place a Div of class `abstract` holding a Div of class `abstract-title` (one Para, the label) and the abstract's blocks. Pandoc's own stylesheet (`templates/styles.html`, also in the e-book) styles `div.abstract` and `div.abstract-title`.

### 3.3 The styles — `html_styles`, `epub_styles`

Rules from `f.title` (`t`): `.gk-front { margin: 2em 0 2.5em; text-align: <t.align>; }`, `.gk-title p { font-size: <t.size/f.font.size>em; font-weight: <bold>; font-style: <italic>; text-transform: <case: uppercase | small-caps via font-variant>; margin: 0 0 0.4em; }`, `.gk-subtitle p { font-size: <max(t.size*0.8, f.font.size)/f.font.size>em; margin: 0 0 0.6em; }`, `.gk-authors p { margin: 0.6em 0 0.2em; }`, `.gk-affiliations p { font-size: 0.85em; margin: 0; }`, `.gk-date p { margin: 0.6em 0 0; }`; all with `text-indent: 0`. The e-book's stylesheet gets the same, in its own `format!`.

### 3.4 The metadata

For `Html`: `meta["pagetitle"] = meta_text(plain title)`, `meta["author-meta"] = meta_list(creators)`, `meta["date-meta"] = meta_text(date)` where there is a date; `title`, `subtitle`, `author`, `date`, `abstract`, `abstract-title` withheld. For `Epub`: `title`, `subtitle`, `author`, `date` kept (the package); `abstract` and `abstract-title` withheld, since the abstract is written in place; `--epub-title-page=false` stays.

### 3.5 Tests

The web page in `the_parts_of_a_document_are_placed_as_the_template_says`: no `title-block-header`; `<title>` holds the title; a `<meta name="author"`; `class="gk-title"` once; the abstract within `class="abstract"` after the front and before the body. Off: no `gk-title`, `<title>` still there. The e-book: the text has `gk-title` once; `content.opf` has `<dc:title>` and `<dc:creator>`; with the title page off, the text has no `gk-title` and the package still has `<dc:title>`.

Verify, commit.

## Step 4 — Markdown, and the words

Markdown changes nothing: assert in a test that its head still carries `title:` and `author:` as YAML, and that no `gk-front` is in it. The guide, `docs/guide.md`: in *What the document contains*, after the parts' switches, one sentence that a switch holds in every kind of document made, Word and the web page as the preview; in *The preview, and the manuscript*, where the formats are described, that the title page and the abstract stand where the template puts them in every document, and that the title and the authors are in the file's properties all the same. Commit.

## Step 5 — e2e

`e2e/templates.mjs`, the export by `document_export` near line 324: it builds a `template` from `templates_get('article')`; after the present checks, export once more with `template.contents` without the item `{ part: 'title-page' }` to a second file, and check with `unzip -p` that `word/document.xml` has no `w:val="Title"` and that `docProps/core.xml` has `<dc:title>Wrath and the hero</dc:title>`; and that the first export has `w:val="Title"` once before the heading "The word". `pnpm e2e:build`, then `timeout 400 node e2e/templates.mjs`, `e2e/preview.mjs` (its export dialog), `e2e/documents.mjs` if it exports. Commit.

## Report

What was built, with paths; what each format now writes for the title page, the abstract and the properties, in one line each; every departure from the record; what was left or doubtful; the counts of every check, verbatim; the scripts run. Do not push.
