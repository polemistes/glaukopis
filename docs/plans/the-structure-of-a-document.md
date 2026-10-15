# Build plan: the structure of a document read from a PDF

The working plan for `docs/adr/0047-the-structure-of-a-document-read-from-a-pdf.md`. Read the record first, in full: it says what; this says how, in which order, in which files, with which interfaces, and how each step is verified. Where they disagree, the record wins; say so in your report. Read also `docs/adr/0045-the-shape-of-a-page.md` and `docs/plans/the-shape-of-a-page.md`, whose work this builds on, and `docs/plans/the-shape-of-a-text-and-its-org-form.md`, section "How to work", which holds here too (plain words; never a record number when talking to the owner; verify before you commit; edit then format; e2e with `timeout`, processes ended by PID only; commit when a step is whole, never push; report the counts). Commit at the end of every step: work that is not committed is lost when the session is.

The owner's rule from 0045 holds throughout: find structure, never give it a meaning the program cannot know. No heading is found by its words. The owner's Greek editions are a case to test against, never to design around.

The steps are in series, in one session; step 2 (the file's outline) can go to a worktree agent while step 3 is built, if you like, since it touches only `layer.rs` and `shape.rs`'s levels. Build the binary once per step for the e2e script (`pnpm e2e:build`), with `CARGO_TARGET_DIR` left as it is. Note that `crates/core/build.rs` is sometimes reverted by `cargo fmt` runs in this tree: after `cargo fmt`, run `git checkout crates/core/build.rs` if it shows as changed.

## Vocabulary

- *Shape*: what `ocr::shape::shape` finds of the pages (0045): `Piece::{Heading, Paragraph, KeptLines}` per page and the `StyleFound` list.
- *Pieces*: `ocr::shaped::Shaped`, the pieces with their text as inlines, per page (`PageText.pieces`).
- *Structure*: the tree made of the pieces of all pages by the headings' levels; built by the new `shaped::structure`.
- *Title*: the heading that names the document's element, found by `shape`.
- *Outline*: the PDF's own `/Outlines` (bookmarks), read by `layer`.
- *Page mark*: `Inline::RefMark { label }` with the page's label, where a page begins.
- *By its headings* / *by its pages*: the two ways, `Structure::Headings` and `Structure::Pages`.
- *Front*: what stands before the first heading: the document element's own text, a `Section` of level 0.

## What exists, and what each piece becomes

| Today | Becomes |
| --- | --- |
| `shape::shape(pages) -> (Vec<Vec<Piece>>, Vec<StyleFound>)` | returns `Shape { pages, styles, title: Option<(usize, usize)> }` (the page and index of the title piece), levels also from numbers and from the outline |
| `shape::Piece::Heading { level, lines }` | unchanged; the title stays a `Heading` of level 1 at its place, pointed to by `title` |
| `layer::Layer` | gains `outline: Vec<OutlineEntry>` read from the document's `/Outlines` |
| `shaped::of`, `shaped::mend_across` | unchanged |
| `shaped::sections(label, pieces)` (one page) | stays, for *by its pages*; new `shaped::structure(pages, marks) -> Structured` for *by its headings* |
| `ocr::Asked { shape, .. }` | gains `structure: Structure` (`Headings`, `Pages`) and `page_marks: bool` |
| `ocr::ReadPdf` | gains `title: Option<Vec<Inline>>`, the title found |
| `ocr::imported_pdf(file, title, read)` | the title found names the document where there is one; `Imported.sections` from `structure` or from `sections` by `asked` |
| `src/lib/api/ocr.ts` `Asked` | the two new fields |
| `src/lib/ocr/ReadStep.svelte` | under the shape checkbox: *By its headings* / *By its pages*, and *Mark where each page begins* |
| `DocumentDialog.svelte`, `PdfMapDialog.svelte` | an outline of what will be made, from `imported.sections`, where the shape is kept |
| `e2e/ocr.mjs`, the shape part | the checks say the structure; a new fixture `e2e/fixtures/structure.typ` with an outline and numbered headings |
| `docs/guide.md`, *Text in scans and pictures* | says how a PDF becomes a map |

Nothing changes in the editor, the formats, the Org form or the project file: a page mark is a reference mark as they have it.

## Step 1 — the title and the numbered headings — `crates/core/src/ocr/shape.rs`

### 1.1 The title

In `shape`, after the levels are reckoned: the title is the first `Draft::Heading` of the file (the first page that has one, its first heading) where its size class is the largest of `heading_sizes` and no other heading of the file has that class. `shape` returns it as `title: Option<(usize, usize)>`, the page and the index of the piece, and the piece stays a `Piece::Heading { level: 1, .. }`. Where the largest size occurs twice or more, there is no title (a book whose chapter titles are as large as its title).

Return type: `pub struct Shape { pub pages: Vec<Vec<Piece>>, pub styles: Vec<StyleFound>, pub title: Option<(usize, usize)> }`; change the callers (`ocr/mod.rs`, the tests).

### 1.2 Numbered headings

A heading whose first line begins with a number of the form `1`, `1.2`, `1.2.3`, then a space or the end (`^\d+(\.\d+)*\.?(\s|$)`; a single trailing dot allowed, as in *3. Methods*), has the depth of its number: the count of its parts, at most `LEVELS`. Where two or more headings of the file are numbered so, the numbered ones take that depth as their level, whatever their size; the others keep their level from their sizes, and where an unnumbered heading's size class is larger than that of a numbered heading of depth 1, it is level 1 too. A single numbered heading is left to its size: a year or a figure is not a numbering.

Tests in `shape.rs`'s tests, beside `headings_by_size_and_by_bold_with_their_levels`: a file with a title and three headings of one smaller size gives `title = Some((0, 0))` and the three at level 1; the same with two headings of the title's size gives no title; headings *1 One*, *1.1 Under*, *2 Two* of one size give levels 1, 2, 1; a heading *1990 and after* alone among unnumbered ones keeps its size level.

Verify: `cargo test -p glaukopis-core ocr::shape`. Commit.

## Step 2 — the file's outline — `crates/core/src/ocr/layer.rs`, `shape.rs`, `ocr/mod.rs`

### 2.1 Reading it

```rust
/// An entry of the outline a PDF carries of its own headings (its bookmarks).
#[derive(Debug, Clone, PartialEq)]
pub struct OutlineEntry {
    pub title: String,
    /// The page it points to, counted from one; none where the destination could not be read.
    pub page: Option<usize>,
    /// 1 for the entries at the top.
    pub depth: u8,
}
```

`Layer` gains `pub outline: Vec<OutlineEntry>`, read in `read_into` from the catalogue's `/Outlines`: walk `/First` and `/Next` from the root, `/First` of an item for its children, with a visited set so a loop ends. The title is the item's `/Title` as lopdf decodes PDF strings (`Object::as_string` and `Document::decode_text` or the equivalent in the vendored `pdf-text` crate's lopdf; look at how `labels` and `numberings` read strings in this file). The page: `/Dest` as a name or an array whose first element is a page reference, or `/A` with `/S /GoTo` and `/D` the same; a named destination is looked up in the catalogue's `/Dests` or the `/Names` tree's `/Dests` (look for what lopdf offers: `Document::get_named_destinations` or walk the tree). The page reference is turned into a number through `doc.get_pages()` (object id to page number). Entries that could not be read keep `page: None`. Depth is clamped to `LEVELS`.

Test in `layer.rs` with a PDF of the fixtures that has an outline: make `e2e/fixtures/structure.pdf` now, from `structure.typ` (step 5.1), since Typst writes an outline for its headings; the test reads it and finds the entries with their pages and depths.

### 2.2 Using it

`shape::shape` takes the outline: `pub fn shape(pages: Vec<PageLines>, outline: &[OutlineEntry]) -> Shape`. Before the levels are reckoned from sizes: each outline entry with a page is matched to a heading on that page, or on the page after it (destinations are sometimes a page early), whose text, normalised (`normalized` in `shape.rs`: lower case, one space, no punctuation), equals the entry's title normalised, or begins with it, or which the entry's title begins with; the first unmatched heading that fits. A matched heading takes the entry's depth as its level. Where no heading on the page fits but a `Draft::Paragraph` on that page begins with the entry's title (its first line's text, normalised), that paragraph's first line is cut off as a `Draft::Heading` of the entry's depth and the rest stays a paragraph: a heading set in the body's size, which the sizes could not see. Unmatched headings keep their size levels, and numbered ones their numbers; the outline wins over both for those it matched. An outline that matches fewer than half of its entries is not used: it is of another version of the text.

The title (1.1) is unchanged by the outline, but an outline entry of depth 1 that is the only one on the first page with headings and matches the title piece does not make the title a level-1 heading: `title` still points to it.

`ocr::read_pdf` passes `layer.outline` to `shape`.

Tests in `shape.rs`: an outline that names two headings of one size on two pages with depths 1 and 2 gives those levels against the sizes; an outline that names a paragraph's first line makes a heading of it; an outline of three entries where one matches is not used.

Verify: `cargo test -p glaukopis-core ocr::`. Commit.

## Step 3 — the structure — `crates/core/src/ocr/shaped.rs`, `crates/core/src/ocr/mod.rs`

### 3.1 The way and the marks

In `ocr/mod.rs`:

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Structure { #[default] Headings, Pages }
```

`Asked` gains `#[serde(default)] pub structure: Structure` and `#[serde(default = "yes")] pub page_marks: bool` (true at first). `ReadPdf` gains `pub title: Option<Vec<Inline>>`: the title piece's inlines (`shaped::of` has them), where `shape.title` is some and the shape is kept.

### 3.2 Building it

```rust
/// What the pages become by the document's headings: what stands before the
/// first heading, and the sections, each at its level, with a mark where
/// each page begins where asked.
pub fn structure(pages: Vec<(String, Vec<Shaped>)>, title: Option<(usize, usize)>, marks: bool) -> Vec<Section>
```

- The pieces of all pages are laid in one row, in order, with a page's label before its first piece where `marks` (the first page's too). The title piece is left out of the row.
- **Across the edges**, before the row is cut into sections, at each page's edge (not for the first page):
  - *A paragraph goes on.* Where the last piece of the body (`style == 0`, a `Paragraph`) before the edge and the first body `Paragraph` after it are both there, with nothing of the body between them, they are one paragraph when: the text after begins with a lowercase letter (`char::is_lowercase` of its first alphabetic char); or `mend_across` moved a word (run it first, as today, and note whether it changed anything); or the text before does not end in `.`, `!`, `?`, `:`, `;`, `…`, `”`, `’`, `"`, `'`, `)`, `]` (after trimming), and the paragraph after is not `indent: true`. Joining: the inlines of the after are appended to the before, a space between where the before's last text does not end with a hyphen that `mend_across` left (it leaves none: it joins the word), the page mark between them where marks are made. Pieces of other styles that stood between them (the foot of the page) go after the joined paragraph, in their order.
  - *Lines kept go on.* Where the last piece before the edge and the first after are `Kept` of one style and one side, they are one `Kept`, the lines of the after appended, the page mark as the first inline of the first line after the edge (a `RefMark` before the line's text; a `LineMark` of the line, where it has one, stays first).
- **The row is cut into sections** as `sections` does for one page, with the levels from the headings and the page marks as inlines: a mark that stands where a block begins goes first in that block; one that stands between blocks goes first in the next block; one at the end of everything goes last in the last block. What stands before the first heading is a `Section { level: 0, heading: vec![], blocks }`; a heading of level L opens `Section { level: L, .. }`. Where the title piece was the only heading on its page and the lines after it on that page (the author, the date) stand before the first heading, they are in the front, as the record says.
- The page mark is `Inline::RefMark { label }` with the page's label as `PageText.label` has it.

`sections` (by its pages) gains the marks too: with `marks`, the page's label as a `RefMark` first in the first block of the page's section, so that *by its pages* with marks and without are both possible; it needs no mark where the element is named by the page, so **the dialog disables the marks for by its pages**: pass `false` there. (Simplest: `sections` is unchanged, and the marks are only for the headings.)

### 3.3 In `imported_pdf`

`imported_pdf(file, title, read, asked)`: where the shape was kept and `asked.structure == Headings` and at least one page has a `Shaped::Heading`, the sections are `structure(...)`; else by pages as today (`sections` per page, the plain path where no shape). The title: `read.title` where some, else the `title` given (the PDF's description, else the file's stem, as `ocr_read` passes it). Where `Headings` is asked and no heading was found, the pages are used and `Imported.remarks` says so in one line (`tr!("ocr-no-headings")`, `core-ocr.ftl`: `No heading was found: the pages are the elements.`), so the dialog can tell it.

Tests in `shaped.rs`: a document of three pages, a title and two headings, a paragraph that goes on over page 2's edge beginning with a small letter, a foot note between the halves, kept lines over page 3's edge: `structure` gives one level-0 front (the author line), two level-1 sections, the joined paragraph with a `RefMark { label: "2" }` inside it and the note after it, the kept lines as one block with the mark in the first line of page 3; the same without marks has no `RefMark`. A paragraph ending in a full stop before an indented paragraph stays two. The shape fixture through `read_pdf` with `Structure::Headings` (`the_shape_of_a_file_is_found` in `tests.rs` is the model): the title *The Measure of Things* is `read.title`, the sections are the three headings at level 1 under a front, and the marks are the labels 1 to 4.

`src-tauri/src/contract.rs`: `shapedImport` is made with the new `Asked`; the generated contract is rewritten by `cargo test -p glaukopis contract` (commit the generated file with it).

Verify: `cargo test -p glaukopis-core`, `cargo test -p glaukopis contract`, `cargo clippy -p glaukopis-core -p glaukopis --all-targets`. Commit.

## Step 4 — the dialogs

### 4.1 The choices — `src/lib/api/ocr.ts`, `src/lib/ocr/ReadStep.svelte`, `src/lib/ocr/how.ts` (where `Asked` is built)

`Asked` gains `structure: 'headings' | 'pages'` and `pageMarks: boolean`. Under the shape checkbox (`data-choice="shape"`), shown only while it is on: a `Segmented` *By its headings* / *By its pages* (`data-choice="structure"`), and a checkbox *Mark where each page begins* (`data-choice="page-marks"`), on at first, disabled and unchecked while *by its pages*. Words, `locales/en/ocr.ftl` and `locales/nb/ocr.ftl` (Norwegian is kept complete; the i18n test holds it): `ocr-structure = Elements`, `ocr-structure-headings = By its headings`, `ocr-structure-pages = By its pages`, `ocr-page-marks = Mark where each page begins`, `ocr-page-marks-hint = A reference mark with the page's number, where it began.`; `ocr-shape-hint` says now `Headings, lines kept as lines, numbers in the margin, and the running heads left out. Off, the pages become plain paragraphs.`: leave it.

Where the file is read and no heading was found (the remark of 3.3), the dialog shows the remark as it shows remarks today, and *by its pages* is what was made.

### 4.2 The outline — `src/lib/ocr/Outline.svelte` (new), `DocumentDialog.svelte`, `PdfMapDialog.svelte`

After the reading, where `imported.sections` has a section of level 1 or more and the shape was kept, the dialogs show, under the counts and before the styles found, *What will be made*: the title (as the field has it), then each heading of `imported.sections` with level ≥ 1, set in by its level (12px a level), its text from its inlines (`plainOf` or what `titleOf` uses; look in `import.ts`), the first 40 and a button *Show all N* (`data-outline-all`); `data-outline` on the list, `data-outline-level={level}` on rows. Where the sections are pages (by its pages, or no heading found), the outline is not shown; the counts say the parts as today.

Verify: `pnpm check`, `pnpm test`, `node scripts/check-locales.mjs`. Commit.

## Step 5 — the fixture, the e2e script, the guide

### 5.1 A born-digital file with an outline — `e2e/fixtures/structure.typ`, `structure.pdf`

A4, Libertinus Serif as `shape.typ` has it, `#set heading(numbering: "1.1")`, `#show outline` not needed: Typst writes the PDF outline for headings by itself (check with `pdfinfo` or by reading it in the test of 2.1). A title `#text(size: 20pt, weight: "bold")[A Short Treatise]` on the first page, then `Anna Lind` and `2026` on lines of their own; `= Beginnings` with two paragraphs, the second running over the page's edge (fill with `#lorem`); `== The First Part` with a paragraph; `== The Second Part` with a paragraph; `= Endings` with a paragraph; and a page number in the footer. Make it with `typst compile`; commit both.

### 5.2 The script — `e2e/ocr.mjs`

The shape part changes where it checked *the headings are elements under the pages*: now (the shape fixture, by its headings at first) the map's name is *The Measure of Things* (the title found; check `tabs()` or the map's name), the three headings are elements directly under it (the `sections()` helper's `level` or parent, look at what it gives), there are no elements named *1* to *4*, and the page marks stand in the text: `document.querySelectorAll('.text-view .refmark')` gives four with labels 1 to 4 (look at how the editor renders `refmark`; `html.ts` gives `data-refmark`). The running head is still left out; the kept lines and the style found as before.

Then the new fixture, dropped on the tabs: read with the shape kept; the dialog's outline (`[data-outline]`) lists *Beginnings*, *The First Part*, *The Second Part* and *Endings* with levels 1, 2, 2, 1 (from the outline of the file and the numbers both); the title field says *A Short Treatise*; import; the map is named so; *Beginnings* has *The First Part* and *The Second Part* under it; the paragraph that ran over the edge is one paragraph holding a page mark; the front holds *Anna Lind* and *2026*. Then once more, with *By its pages* chosen: the pages *1* and *2* are the elements, with the headings under them, and no page mark stands in the text.

Screenshots `ocr-6-shape` (as before, the structure now) and `ocr-6b-outline`, light and dark.

### 5.3 The owner's book, by hand

As 0045's plan did: on the copy of the owner's Aristophanes, read print pages 98–120 with the shape kept and by its headings, in an ignored probe test, and say what came out: the title, if any was taken; what became elements; whether the verse joined across the pages with the marks in place; and say whether *by its pages* is what suits an edition. Change no rule for the book's sake; if a general rule misfires, fix it and say so.

### 5.4 The guide — `docs/guide.md`, *Text in scans and pictures*

The first bullet (*A PDF or a picture becomes a tree of elements*) says now: an element for the document, named by its title where one is found on its pages, else as the PDF names itself, else by its file; under it the headings of the text as elements, each level under the one above, with what follows each; what stood before the first heading as the document element's own text; a mark where each page begins, so that what is quoted is found on its page, unless unmarked; or, by its pages, an element for each page as before. The part *The shape of the pages* gains a line on the title and the outline, and on numbered headings. The action's name is *Import the text as a map…* (done already).

Verify: `cargo test -p glaukopis-core`, `cargo test -p glaukopis contract`, `cargo clippy -p glaukopis-core -p glaukopis --all-targets`, `pnpm check`, `pnpm test`, `node scripts/check-locales.mjs`, `pnpm e2e:build`, `timeout 900 node e2e/ocr.mjs`, and `timeout 600 node e2e/documents.mjs`. Commit.

## Report

At the end, to the owner, in plain words: what was built step by step; what was left; what the owner's book gave by hand, quoted; the counts of every check and of the e2e scripts; anything done otherwise than the record, with why. Do not build a package unless asked; offer it.
