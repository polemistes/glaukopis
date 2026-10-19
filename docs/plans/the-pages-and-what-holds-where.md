# Build plan: the header and the footer, numbering by level, and where changes hold

The working plan for three records: `docs/adr/0057-header-and-footer-as-places.md` (stage 1), `docs/adr/0058-numbering-by-level.md` (stage 2) and `docs/adr/0059-where-changes-hold.md` (stage 3). Read the three first, in full: they say what; this says how, in which files, with which interfaces, and how each step is verified. Where they disagree, the records win; say so in your report. Read also `docs/plans/what-you-are-writing.md`, section "How to work, tonight", and `docs/plans/everything-on-the-page-has-its-chip.md`, which built the chips this plan renames: both hold here.

## How to work

- Plain words; never a record number when writing for the owner.
- Checks: `cargo test -p glaukopis-core`, `cargo fmt -p glaukopis-core` (put `crates/core/build.rs` back with `git checkout crates/core/build.rs` if it reformats it), `cargo clippy -p glaukopis-core --all-targets -- -D warnings`, `cargo test -p glaukopis contract` after any change of a core type the interface sees, `pnpm check`, `pnpm test`, and the e2e scripts named in each stage after `pnpm e2e:build` (`timeout 400 node e2e/<name>.mjs > /tmp/<name>.log 2>&1`; end your own processes by PID, never `pkill -f`). Paste the counts into your report.
- Edit, then format (`pnpm exec prettier --write <files under src>`; the scripts in `e2e/` are not formatted).
- Commit when a step is whole, without asking; never push; never start the Installers workflow or make a tag. End every commit message with the attribution line the session gives you.
- The stages are in order of dependence: stage 2 is small and may be done before or after stage 1; stage 3 builds on stage 1 (the header, the footer and the numbering's restart are what an element most often changes). If the night runs short, stage 3's steps 3.5 (Word and Writer) and 3.6 (LaTeX) are left first, then 3.7's words of the other languages; Look must then say, under the scope line, that Word, Writer and LaTeX follow only the page's settings or nothing, as built.
- One session. Where a step is separable and large (3.5 and 3.6), a worktree agent may take it with the usual brief (commit often, never push, the files it may touch named); the main session merges.

## Vocabulary

- *Margin*: the header or the footer of a page, as a layout sets it (`Margin` in `formats/mod.rs`, stage 1): shown or not, three *places* (left, centre, right), each a list of *items*.
- *Item*: what stands in a place: `page-number`, `title`, `author`, `chapter`, `date`, `text`.
- *Numbering of a level*: `as-above`, `none`, or a style (`arabic`, `Alpha`, `alpha`, `Roman`, `roman`) (stage 2).
- *Look of an element*: the layout as an element uses it, with its changes (`formatFor(project, id)`), sent to the core for every element under the one printed that has changes of its own (`Document.looks`, stage 3).
- *Scope*: which element Look's changes are written on: the document's element, or one under it.

---

# Stage 1 — the header and the footer

## 1.1 The shape — `crates/core/src/formats/mod.rs`

```rust
/// What stands in a margin of the page: the header or the footer (ADR 0057).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Margin {
    pub shown: bool,
    /// On the first page of the document too.
    pub first_page: bool,
    /// On the openers too: the pages where a heading of a level that begins a page begins, or a part on a page of its own.
    pub openers: bool,
    /// Different on left (even) pages: `even` holds their places.
    pub alternate: bool,
    pub left: Vec<Item>,
    pub center: Vec<Item>,
    pub right: Vec<Item>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub even: Option<Sides>,
    /// Between two items of a place.
    pub separator: String,          // " · "
    /// Nought is the text's.
    pub size: f32,
    pub italic: bool,
    pub case: Case,
}
#[derive(…)] pub struct Sides { pub left: Vec<Item>, pub center: Vec<Item>, pub right: Vec<Item> }
#[derive(…)] #[serde(rename_all = "kebab-case", tag = "kind")]
pub enum Item { PageNumber, Title, Author, Chapter, Date, Text { text: String } }

#[derive(…)] #[serde(rename_all = "kebab-case")]
pub enum NumberStyle { #[default] Arabic, Roman, RomanLower, Letters, LettersLower }
```

`Page` gains `numbering: NumberStyle` and `restart: bool` (false; stage 3 reads it). `DocumentFormat` gains `header: Margin`, `footer: Margin`; `page_numbers` and `running_head` go from the struct.

`HeadingLevel.new_page: bool` becomes `begins: Begins`:

```rust
#[derive(…)] #[serde(rename_all = "kebab-case")]
pub enum Begins { #[default] Text, Page, RightPage }
```

read also from the old name: `#[serde(default, skip_serializing)] new_page: Option<bool>` on the level, turned into `begins: Page` in `sanitise()` where `begins` is at its default. `HeadingLevel::begins_page(&self) -> bool` is `begins != Text`, for what asked `new_page` (`typst.rs`, `pandoc.rs` `new_page` levels, `reference.rs`, `latex.rs`: grep `new_page`). Defaults: header `shown: false`, empty places; footer `shown: true, first_page: true, openers: true, center: [PageNumber]`; both `separator: " · "`, `size: 0.0`, `case: Case::None`.

**Old names read.** Keep `PageNumbers`, `RunningHead`, `HeadContent`, `Position` as private types; give `DocumentFormat` two fields `#[serde(default, skip_serializing)] page_numbers: Option<PageNumbers>, running_head: Option<RunningHead>`, and in `sanitise()` (or a `modernise()` called from where formats are read) turn them into `header`/`footer` where the file had them and the new fields are at their defaults: the running head becomes a `Title`/`Author`/`Text` item (`AuthorTitle` two items) in the place of its `align` of the header, with its `case`; `page_numbers.show` puts a `PageNumber` item in the place of its `position`, in the header or the footer; `first_page` goes to both; `show: false` empties the footer's centre. Then the old fields are `None`. Test: a layout written in the old shape reads to the same `header`/`footer` as the new one, and `serde_json::to_value` of it has no `pageNumbers`.

`Particulars::running_head` and `running_head_cased` (`formats/typst.rs`) go; what used them takes the items.

## 1.2 The layouts that ship — `scripts/modernise-formats.mjs`, `resources/formats/*.json`

A node script that reads every `resources/formats/*.json`, converts `pageNumbers`/`runningHead` by the rules of 1.1 into `header`/`footer`, adds `page.numbering: "arabic"` and `page.restart: false`, adds `numbering: "as-above"` to every heading level (stage 2's field, written now so the files are touched once), turns each level's `newPage` into `begins: "page"` or `"text"`, deletes the old fields, and writes the files back with the same formatting (two spaces, trailing newline). Run it; `git diff --stat` shows 43 files; `node scripts/check-templates.mjs` and `cargo test -p glaukopis-core` pass. Keep the script: it says what the old shape was.

## 1.3 Typst — `crates/core/src/formats/typst.rs`

`margin_row(format, p, top)` becomes `margin(m: &Margin, format, p) -> Option<String>`, used for the header and the footer: nothing where `!m.shown` or every place is empty. An item in Typst: `PageNumber` → `counter(page).display({style})` with the style string of `page.numbering` (`"1"`, `"I"`, `"i"`, `"A"`, `"a"`); `Title` → `text({title})`; `Author` → `text({authors joined ", "})` (nothing where `title.anonymous`); `Chapter` → `context { let h = query(selector(heading.where(level: 1)).before(here())); if h.len() > 0 { h.last().body } }`; `Date` → the document's date as words; `Text` → `text({words})`. Items of a place joined by `text({separator})`. The place's cell as today (`align(left|center|right, …)`), the grid as today. Around the grid: `set text(size: {size or text's})`, `set text(style: "italic")` where italic, the case as `cased()`. The first page and the openers: the whole as `context if (counter(page).get().first() == 1 and not m.first_page) { none } else if (not m.openers and query(<gk-opener>).any(o => o.location().page() == here().page())) { none } else { … }`. The mark `<gk-opener>` is `#metadata("opener") <gk-opener>`, written by the core at every place that begins a page because it was told to: after the page break of a heading of a level whose `begins` is not `Text` (`heading_rule` writes the break; the mark goes with it, so that the heading's own page is the opener), and at the start of every part on a page of its own (the title page where `title.placement` is own-page, the `own-page` kinds). A level set to `RightPage` writes `#pagebreak(weak: true)` and then `#context if calc.even(here().page()) { page(header: none, footer: none)[] }`, which puts in a blank left page with nothing in its margins where the heading would have fallen on a left page; the blank page is counted. Check this in a test that sets a document of three one-line chapters at `RightPage` and asserts the page count and that the headings stand on odd pages (`texts()` by page). Alternate: `context if calc.even(here().page()) { <grid of m.even> } else { <grid of m> }`. The `#set page(numbering: none, header: …, footer: …)` line as today.

Tests in `typst.rs`: the defaults give a footer with the number in the centre and `header: none`; a layout with the title left and the number right in the header, alternate with the number left on even pages, `openers: false`; the items of a place joined by the separator; the anonymous layout names no author in the header; the number's style.

## 1.4 Word and Writer — `crates/core/src/export/reference.rs`

`margins(f, p) -> (Margin, Margin)` and `Piece` become the format's `header`/`footer` and `Item`: `docx_margin` writes each place's items as runs joined by the separator; `PageNumber` as the `PAGE` field (with `\* ROMAN`/`\* roman`/`\* ALPHABETIC`/`\* alphabetic` after it for the styles); `Chapter` as `STYLEREF "Heading 1"`; `Date` and `Text` as words. Alternate pages: the settings part gets `<w:evenAndOddHeaders/>` and the section gets `header2.xml`/`footer2.xml` of type `even` with `m.even`'s places. Openers and right-hand starts in Word are sections: where a level's `begins` is `Page` or `RightPage` and (`!header.openers` or `!footer.openers` or `begins == RightPage`), the heading is preceded not by Pandoc's page break but by a section break written as a `RawBlock openxml` paragraph ending the section before it, `<w:p><w:pPr><w:sectPr><w:type w:val="nextPage"|"oddPage"/>…the same pgSz, pgMar, cols, headerReference/footerReference as the document's…<w:titlePg/></w:sectPr></w:pPr></w:p>`, with the first-page header and footer of that section pointing at the empty parts (`headerEmpty.xml`, `footerEmpty.xml`, which `reference::docx` adds always) where `openers` is off, else at the document's. The converter knows the level's `begins` (`Converter::new_page` becomes a map level → `Begins`) and writes the break in `section()`. Where neither applies, Pandoc's page break as today. Test with `unzip`: `w:type w:val="oddPage"` before the chapter, and the first-page header reference of that section. `first_differs` is `!header.first_page || !footer.first_page` where either is shown; the first-page header/footer parts are the ones with `first_page: true` only. The size, italics and case on the runs. The same for Writer (`odt_margin`, the master pages): `<text:page-number style:num-format="i"/>`, `<text:chapter text:display="name" text:outline-level="1"/>`, `<text:title/>`, `<text:initial-creator/>`; alternate pages as `<style:header-left>`/`<style:footer-left>`.

Tests: the existing ones of `reference.rs` moved to the new shape; a header with two items left and the number right; even pages.

## 1.5 LaTeX — `crates/core/src/export/latex.rs`

`\fancyhead[L|C|R]{…}` and `\fancyfoot[…]{…}` per place from the items: `\thepage` (with `\renewcommand{\thepage}{\roman{page}}` for the style), `\leftmark` for the chapter (with `\renewcommand{\sectionmark}[1]{\markboth{#1}{}}` so that `\leftmark` is the section's title), the title and author as words, joined by the separator. Alternate: `\documentclass[twoside]` and `\fancyhead[LE]{…}`/`[RO]{…}` from `m` and `m.even`. First page as today (`\thispagestyle{plain}` with the plain style set from what is shown there). Openers: a `\fancypagestyle{opener}{\fancyhf{}}` (or with the parts of the header and footer that have `openers: true`), and the heading's `\titleformat` after-code (`latex::settings` writes `\titleformat` per level; its optional last argument) gets `\thispagestyle{opener}` for the levels whose `begins` is not `Text`; the parts on a page of their own get `\thispagestyle{opener}` after their page break. A level `RightPage`: `\clearpage\ifodd\value{page}\else\hbox{}\thispagestyle{empty}\newpage\fi` in place of `\clearpage` before its headings (`latex::settings` or `pandoc.rs` where the break is written for LaTeX). Writer: a right-hand start is a plain new page, and the openers keep their header and footer, both said in the report (Writer would need a page style per opener).

## 1.6 The interface — `src/lib/api/documents.ts`, `src/lib/look/LookPanel.svelte`, `src/lib/look/changes.ts`, words

- `cargo test -p glaukopis contract`; `DocumentFormat` in `documents.ts` as the core has it.
- `changes.ts`: `NOT_LOOK` gains nothing, but `laidOver` passes over a path whose first key is `pageNumbers` or `runningHead` (the old names), and `pathsOf` of a document's changes leaves them out, so that Look's count and list do not show them; `console.info` once per document that old changes were passed over. Test.
- Look's Page part: the rows of the page (size, margins, columns), then `<h4 data-at="header">` *Header* and `<h4 data-at="footer">` *Footer*, each by one snippet `marginRows(m: 'header' | 'footer')`: a `toggle` *Shown* (`header.shown`) first; then *On the first page too*, *On the pages where a chapter or a part begins too* (`format-margin-openers`, with the hint "A heading that begins a page, or a part on a page of its own"), *Different on left and right pages*; then the places, each a row `.place` with the items as chips in order (`data-item`), a × on each, and *Add…* which opens a small menu of the six kinds (the words of one's own ask for the text in a field that appears); where `alternate`, the same three places again under *On left pages*; then *Between the items*, *Size* (nought is the text's), *Italic*, *Letters*. The items are a list, taken whole as a change (`header.left`), as the heading levels are. Then `<h4 data-at="page-numbers">` *Page numbers*: *Style* (`page.numbering`); *Begins counting anew here* (`page.restart`) is drawn in stage 3.
- The levels of headings (`levelRows` in `LookPanel.svelte`): the toggle *Begins a new page* becomes a `choice` *Begins* (`begins`): *in the text* / *on a new page* / *on a right-hand page* (`format-level-begins`, `-text`, `-page`, `-right-page`); `levelWords(l)` says the last two. The hint of the right-hand page: "A blank left page is put in where one is needed, with nothing in its header or footer."
- The first rows of Look: *Pages are numbered* becomes a toggle that sets `footer.shown` where the footer holds the number, else `header.shown` (a row with get/set of its own, path `footer.shown`); keep it simple: the row toggles the margin that has a `PageNumber` item, or the footer where none has.
- The chips: the core names the margins `header`/`footer` where each is shown (stage 1 of `export/mod.rs`, `preview_made`: `head: f.header.shown.then_some("header")`, `foot: f.footer.shown.then_some("footer")`); `spots.ts` reads `header`/`footer` → `{ section: 'page', at: 'header' | 'footer' }`; the words `preview-what-header = Header` / `Topptekst`, `preview-what-footer = Footer` / `Bunntekst`; `running-head` and `page-number` go.
- Words (`format.ftl`, en and nb): `format-margin-header`, `format-margin-footer`, `format-margin-shown`, `format-margin-first-page`, `format-margin-openers`, `format-margin-alternate`, `format-margin-left-pages`, `format-margin-place-left|center|right`, `format-margin-add`, `format-margin-separator`, the item kinds `format-item-page-number|title|author|chapter|date|text`, `format-page-numbering`, the styles `format-number-arabic|roman|roman-lower|letters|letters-lower`. The old `format-page-numbers-*` and `format-running-head-*` keys go from every language (`scripts/prune-locales.mjs` or the tool of the night before).

## 1.7 Tests and scripts

- `export/mod.rs`: the margins named `header`/`footer` in `the_preview_tells_what_stands_where_on_its_pages`; `documents_for_word_processors` with the new shape; a test of a document of three chapters at `RightPage` with `openers: false` on both margins: in the Typst, `<gk-opener>` after each chapter's break and the blank-page `context`, the headings on odd pages of the preview and the footer's number absent from those pages (by `texts()`), and in Word `w:type w:val="oddPage"`.
- `e2e/what.mjs`: `page-number` → `footer`, `running-head` → `header`; the running head is turned off by the header's *Shown* (`app.lookChoose`/`lookWrite('Shown', false)` in the part `page` after `lookSection('Page')`, or the row found under `[data-at="header"]`).
- `e2e/look.mjs`, `preview.mjs`, `editors.mjs`, `runs.mjs`: whatever reads `Pages are numbered`, `Where`, `At the top of every page`.
- A new part of `e2e/look.mjs` or `what.mjs`: add the title to the footer's left, and see it in the Typst of the preview (`typstHas`); set level 1 to begin on a right-hand page and the footer off on openers, and see `to: "odd"`-equivalent blank page context and `<gk-opener>` in the Typst.

Verify everything; commit.

---

# Stage 2 — numbering by level

## 2.1 The shape — `formats/mod.rs`

```rust
#[derive(…)] #[serde(rename_all = "kebab-case")]
pub enum LevelNumbering { #[default] AsAbove, None, Arabic, Alpha, AlphaLower, Roman, RomanLower }
pub struct HeadingLevel { …, pub numbering: LevelNumbering }
```

`Headings::numbered` stays. A function on `Headings`:

```rust
/// The numbering of each level as it comes to be: the style of the level, `None` where it is not numbered.
pub fn resolved_numbering(&self) -> Vec<Option<NumberStyle>>   // for levels 1..=levels.len()
```

Level 1 `AsAbove` → `numbered.then_some(Arabic)`; level n `AsAbove` → the resolution of level n−1; `None` → none; a style → that style. A heading's number is the numbers of the numbered levels above it and its own, joined by `.`; where a level above is not numbered, the numbers start from the first numbered level under it. Test the examples of the record: defaults; level 3 `None`; level 1 `Roman` with level 2 `AsAbove` giving I.1.

## 2.2 Typst — `formats/typst.rs`

In place of `#set heading(numbering: "1.1")`: a function, written where any level differs from the plain run:

```
#set heading(numbering: (..nums) => {
  let styles = ("1", "1", none, …)   // per level, from resolved_numbering; none for a level not numbered
  let n = nums.pos()
  let shown = ()
  for (i, x) in n.enumerate() { if styles.at(i) != none { shown.push(numbering(styles.at(i), x)) } }
  if styles.at(n.len() - 1) == none { none } else { shown.join(".") }
})
```

Where the resolution is the plain run (all arabic from level 1, as today), write `"1.1"` as before, so that nothing changes for every layout that ships. Where nothing is numbered, write nothing. `heading_rule` adds `numbering: none` for a level resolved to none only where a heading of that level would otherwise get a number: the function above returns `none` for it, which suffices; test it.

## 2.3 The other documents — `document/pandoc.rs`, `export/latex.rs`, `export/mod.rs`

- The core numbers headings itself for Word, Writer, the web page and the e-book where the resolution is not the plain run: `arguments()` passes `--number-sections` only for the plain run; otherwise `Converter::section` prefixes the heading's inlines with `Span` class `header-section-number` holding the number as `targets()` computes it (extend `targets()` to take `&Headings` and count per the resolution, so that cross-references and the written numbers agree). Pandoc's own numbering writes the same span class, so the styles of the documents are unchanged.
- LaTeX: `\setcounter{secnumdepth}{N}` for the deepest numbered level; for each level with a style of its own, `\renewcommand{\thesection}{\Roman{section}}` and so on (`section`, `subsection`, `subsubsection`, `paragraph`, `subparagraph`); a level `None` under a numbered one cannot be unnumbered by counters alone: write `\setcounter{secnumdepth}` to the level above it and leave deeper numbered levels to the written numbers as for Word (a `Span`), and say so in the report.

## 2.4 Look and words

Each level's `details.level` gets, first, the row *Numbering* (`choice`, `numbering`, with the words `format-level-numbering-as-above = As the level above`, `-none = None`, `-arabic = 1, 2, 3`, `-alpha = A, B, C`, `-alpha-lower = a, b, c`, `-roman = I, II, III`, `-roman-lower = i, ii, iii`), then its look. The switch *Numbered* of all headings stays over the levels. `levelWords(l)` says the numbering where it is not as above.

## 2.5 Tests and scripts

Core tests of 2.1–2.3; `e2e/look.mjs` or `runs.mjs`: set level 1 to roman, see `I` before *Book one* in the Typst (the preview) and the headings numbered in the Word test of `templates.mjs` if it is cheap. Commit.

---

# Stage 3 — where changes hold

## 3.1 What the core receives — `document/mod.rs`, `src/lib/api/documents.ts`

```rust
/// The layout an element under the one printed uses, with its changes (ADR 0059): what holds for its stretch of the document.
#[derive(…)] #[serde(rename_all = "camelCase")]
pub struct ElementLook { pub element: String, pub format: DocumentFormat }
pub struct Document { …, #[serde(default)] pub looks: Vec<ElementLook> }
```

`cargo test -p glaukopis contract`.

## 3.2 The interface sends them — `src/lib/preview/documents.svelte.ts`, `PreviewPanel.svelte`, `src/lib/project/model/document.ts`

```ts
/** The looks of the elements under `at` that have changes, a layout or line numbers of their own: what holds for each one's stretch. */
export async function looksWithin(project: Project, at: string): Promise<ElementLook[]>
```

For each `id` of `project.tree(at).sequence` but `at` whose `document.look` has paths, or `document.format`, or `document.lineNumbers !== undefined`: `{ element: id, format: await documents.formatFor(project, id) }`. `documentRequest` puts them on the document; `PreviewPanel`'s own request too (its `from` key takes `JSON.stringify(looks)` so that a change on a chapter makes the pages anew). `leanDocument` keeps them whole. The Org form carries nothing new: the changes are the elements' own already.

## 3.3 The core follows them — `export/mod.rs`, `formats/typst.rs`

`typst::preamble(format, p)` is split: `opening(format, p)` (the comment, `#set document`, the `#let` definitions that do not depend on the format) and `rules(format, p)` (everything else: the page, the text, the paragraphs, the headings, the kinds, the verse functions, the quotations, the notes). `preamble` = `opening` + `rules`. A `switch(from: &DocumentFormat, to: &DocumentFormat, p) -> String`: `rules(to, p)` with the `#set page(…)` line kept only where `to.page`, `to.header`, `to.footer` differ from `from`'s (compared by `serde_json::to_value`), preceded by `#pagebreak(weak: true)`; and `#counter(page).update(1)` where `to.page.restart`. (A `#set page` anywhere in the flow begins a new page in Typst; it is written only where a new page is wanted.)

In `prepare`, for Typst: the sections are written as today; before the first section of an element with a look (`doc.looks` by `element`), a `RawBlock` of `switch(enclosing, look.format, p)`, and after the last section of its stretch (the next section whose level is not deeper, or the end), `switch(look.format, enclosing, p)`, where `enclosing` is the look of the nearest element above it with one, else the document's format; a stack. The parts (`doc.parts`) likewise. The marks `#metadata(…) <gk-el-…>` stand as before.

Tests in `export/mod.rs`: a document whose second section has a look with a larger size: the Typst has `#set text(… size: 14pt …)` between the first and the second section and the document's size again after the stretch; a look that changes the header: a `#pagebreak(weak: true)` and a `#set page(` before it; `restart`: `#counter(page).update(1)`; the preview's spots and places still right (the test of the spots with such a document). An element with no look: nothing written.

## 3.4 Look's scope — `src/lib/look/look.svelte.ts`, `LookPanel.svelte`, `PreviewPanel.svelte`, `ProjectView.svelte`

- `LookRequest.element?: string`: the element a chip was pressed in. `PreviewPanel`: `elementAt(page, top)` from `places` (the last place with `(page, y) ≤ (page, top in points)`), given to `lookUi.open({ ...lookFor(what), element })`.
- `LookPanel` gains the prop `current: () => string | null` (the element the text is at, as the preview has it; `ProjectView` passes the same function) and a state `scope: string | null`. Under the button of what the document is, where `candidates` is not empty: a `select.scope[data-scope]`, first option *the whole document: {name}* (`''`), then *only {name}* for each candidate: the element of the last request (`lookUi.request.element`) and the element the text is at (`current()`), where each is under `at` and not `at`. Choosing writes nothing; it sets `scope`. Every use of `at` for the look (`documentOf`, `lookOf`, `formatCached`, `setDocument`, `takeAgain`, `from`, `wanted`, `write`, `keep`) takes `target = scope ?? at`; the chooser button, `ContentsSection` and the title page's switch keep `at`. When a request comes with an `element`, `scope` is set to it. Under the scope line, where `scope` is set: the hint `look-scope-hint` "Changes here hold for {name}, wherever it is printed; page settings begin it on a new page." Under the Page part's rows, where `scope` is set: *Begins counting the pages anew here* (`page.restart`, a toggle).
- Words en and nb: `look-scope`, `look-scope-document`, `look-scope-only`, `look-scope-hint`, `format-page-restart`.

## 3.5 Word and Writer follow the page settings — `export/mod.rs`, `export/reference.rs`, `export/after.rs`

At a switch where `page`, `header.shown`, `footer.shown` or `page.restart` differ (the items of the header may not differ per element here: say so in the report), a `RawBlock openxml` that ends the section: `<w:p><w:pPr><w:sectPr>…</w:sectPr></w:pPr></w:p>` holding `w:pgSz` (size, orientation), `w:pgMar`, `w:cols`, `w:pgNumType w:fmt="…" w:start="1"` (`lowerRoman`, `upperRoman`, `lowerLetter`, `upperLetter`, `decimal`), and header/footer references: to the document's parts where shown, to empty parts `headerEmpty.xml`/`footerEmpty.xml` (added by `reference::docx` always) where not. The section's properties written in a paragraph end the section *before* that paragraph; so the raw block stands at the end of the previous element's stretch, with the previous settings, and the document's own `sectPr` at the end of the body stays the last section's. Writer: `<text:p text:style-name="GkSection…"/>` paragraphs whose automatic style carries `style:master-page-name` of a master page per distinct look (`reference::odt` makes a master page and a page layout per look in `doc.looks`, named `GkLook1`, …, with their header/footer shown or not and `style:num-format`); `fo:page-number="1"` on the paragraph's properties restarts. Tests with `unzip`.

## 3.6 LaTeX follows — `export/latex.rs`, `export/mod.rs`

At a switch: `\clearpage`, `\pagenumbering{roman}` where the style or the restart differ (`\pagenumbering` restarts; where only the style differs, `\renewcommand{\thepage}{\roman{page}}`), `\pagestyle{empty}`/`\pagestyle{fancy}` for the margins shown or not, `\newgeometry{…}`/`\restoregeometry` for margins and size, `\fontsize{…}{…}\selectfont` for the type; and back at the end of the stretch.

## 3.7 Words, guide, scripts

- `docs/guide.md`: *The look of a document* gains a part *Where changes hold*: the scope line, the rule of the new page, what each format follows; *The preview, and the manuscript*: the chip's element; the Page part's words of header and footer (stage 1) and the levels' numbering (stage 2) where the parts are described.
- `e2e/look.mjs` (or a new `e2e/scope.mjs`): in the Odyssey, enter *Book one* as text, open Look, choose *only Book one*, set the size to 14; the Typst of the preview has `size: 14pt` after Book one's mark and the document's size before it; set the footer off for Book one: a `#pagebreak(weak: true)` and `#set page(` before Book one; the chip on a line of Book one offers Book one in the scope line. `templates.mjs`'s Word export: a second element with `restart` and roman: `w:pgNumType w:fmt="lowerRoman" w:start="1"` in `document.xml` (step 3.5).

Verify everything; commit.

## Report

For the owner, in plain words: what a writer now does to put the author and the title in the header of a book and the page number outside, to number chapters in roman, and to set one chapter in smaller type; what was built, with paths; what each format follows and what it does not; every departure from the records; what was left; the counts, verbatim; the scripts run. Do not push.
