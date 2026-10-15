# Build plan: the shape of a page

The working plan for `docs/adr/0045-the-shape-of-a-page.md`. Read the record first, in full: it says what; this says how, in which order, in which files, with which interfaces, and how each step is verified. Where they disagree, the record wins; say so in your report. Read also `docs/plans/the-shape-of-a-text-and-its-org-form.md`, section "How to work", which holds here too (plain words; never a record number when talking to the owner; verify before you commit; edit then format; e2e with `timeout`, processes ended by PID only, never `pkill -f`; commit when a step is whole, never push; report the counts). Commit at the end of every step and more often where a step is long.

One rule stands over this plan, from the owner: find structure, never give it a meaning the program cannot know. Name what is found by its look. Where you are tempted to write a rule that fits one kind of text, write the general rule or none. The owner's Oxford Aristophanes (its place is in `docs/plans/the-text-a-pdf-has.md`, "The book to test on") is a text to test against, one among the fixtures below, not the one to design for.

Read before anything else: `crates/core/src/ocr/mod.rs` (`read_pdf`, `imported_pdf`, `read_picture`), `text.rs` (`Line`, `by_place`, `page_paragraphs`, `join_lines`, `tsv_paragraphs`), `layer.rs` (the `Gatherer`, which knows each glyph's font), `crates/core/src/document/mod.rs` (`Block::Paragraph`, `Inline`, `Numbering`), `crates/core/src/import/document.rs` (`Imported`, `Section`, `Counts`), `src/lib/project/model/import.ts` (`makeImported`) and `blocks.ts` (`writeBody`), `src/lib/project/model/types.ts` (`PassageKindRecord`), `src/lib/editor/own-kinds.svelte.ts`, `src/lib/documents/DocumentDialog.svelte`, `src/lib/ocr/ReadStep.svelte`, `src/lib/ocr/how.ts`, and `e2e/ocr.mjs`.

## Vocabulary

- *Line*: `text::Line`, a line of a page with its place; it gains its *style*.
- *Style*: the look of a line: the font's family, whether it says italic or bold, the size, the indent of the line's left edge from the text's left edge, and whether the line is in a block of kept lines.
- *Body*: the style most lines of the file are in.
- *Style found*: a style other than the body and the headings that recurs on several pages (`StyleFound`).
- *Shape*: what the structure of a page was found to be (`shape.rs`).
- *Kept lines*: a block of lines kept as lines, one paragraph with line breaks.

## What exists, and what each piece becomes

| Today | Becomes |
| --- | --- |
| `text::Line { text, left, right, top, bottom }` | gains `style: Style` and `runs: Vec<Run>` (marks within the line) |
| the `Gatherer` keeps the font of a line's last glyph | keeps the font of every glyph, in runs |
| `tsv_paragraphs` keeps a line's words and confidence | gives each line a style of size and indent alone |
| `read_pdf` → `Vec<Vec<String>>` paragraphs per page → `imported_pdf` | `read_pdf` → shaped pages → `imported_pdf` with headings as sections and blocks of kinds |
| `Imported` | gains `styles: Vec<StyleFound>` |
| `Block::Paragraph { name, … }` | `name` may be `style:<n>` until the map is made; `makeImported` replaces it by the writer's choice |
| `DocumentDialog.svelte` facts and remarks | gains the list of styles found with the choice for each, and *Keep the shape of the pages* |
| `Asked` | gains `shape: bool` |
| `how.ts`: `latinWithGreek` | `scriptsAlike(chosen)`: pairs of scripts whose letters look alike |

## Step 1 — lines know their style

### 1.1 `crates/core/src/ocr/text.rs`

```rust
/// The look of a line, as far as it can be told: from the font for the text a PDF has, from the size alone for what Tesseract reads.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct Style {
    /// The font's family, without the prefix of a subset and without what says italic or bold: `Bembo`; empty where not known.
    pub family: String,
    pub italic: bool,
    pub bold: bool,
    /// The height of the line, in the page's units: the size of the type, near enough.
    pub size: f32,
}
/// A run of a line's text in one look: from the byte offset, with the marks it has.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct Run { pub from: usize, pub italic: bool, pub bold: bool, pub smallcaps: bool }
pub struct Line { pub text: String, pub left: f32, pub right: f32, pub top: f32, pub bottom: f32, pub style: Style, pub runs: Vec<Run> }
```

`Style::from_font(name: &str, size: f32)`: the family is the name without a subset prefix (`ABCDEF+`) and without a suffix after `-` or `,` (`Bembo-Italic`, `TimesNewRoman,Italic`), or a word within it, that says italic (`Italic`, `Oblique`, `It`, `Slanted`) or bold (`Bold`, `Semibold`, `Black`, `Heavy`); the flags accordingly. Tests on `Bembo-Italic`, `FCIOCM+PorsonGreekSF`, `Minion-SemiboldItalic`, `TimesNewRoman,Bold`, `Helvetica`.

### 1.2 `layer.rs`

The `Gatherer` keeps, per line, the runs: a run begins where the glyph's font or its small-capitals status (a name the expert scheme translates as a small capital) differs from the last glyph's, with the byte offset in the line's text as it is and as translated (two offsets; the translated line's runs are what is kept, since that is the line taken). The line's `style` is that of the run with most glyphs; `size` is the line's height as `Line` has it. Where no font is known, `Style::default()` with the size.

### 1.3 `tsv_paragraphs`

Each line's `style.size` is its height; nothing else is known. (Tesseract's TSV has no fonts.)

Verify: `cargo test -p glaukopis-core` — the existing tests pass with the fields added. Commit.

## Step 2 — the shape of a page: `crates/core/src/ocr/shape.rs` (new)

```rust
/// A page's lines, in reading order, as they are to be shaped.
pub struct PageLines { pub lines: Vec<Line>, pub width: f32, pub height: f32 }

/// What a page was found to be made of, in order.
pub enum Piece {
    Heading { level: u8, lines: Vec<Line> },
    /// Lines joined into a paragraph; `indent` where it begins further in than the lines around it.
    Paragraph { lines: Vec<Line>, indent: bool, style: usize },
    /// Lines kept as lines, with the given number of each where one stood in the margin.
    KeptLines { lines: Vec<(Line, Option<String>)>, side: Option<Side>, style: usize },
}
/// A style found across the file: its look, a sample, how often, on how many pages.
pub struct StyleFound { pub style: Style, pub indent: bool, pub kept: bool, pub sample: String, pub count: usize, pub pages: usize }

/// Shapes every page of a file. `styles[0]` is the body. Running heads and page numbers are left out.
pub fn shape(pages: Vec<PageLines>) -> (Vec<Vec<Piece>>, Vec<StyleFound>)
```

The rules, each a function of its own with tests:

- **Edges and running heads** (`edges`): a line in the top or bottom eighth of the page; its text with digits replaced by `#`; where the same such text stands at the same edge on at least three pages, or two texts alternate page by page, those lines are running heads and go. A line that is a number alone (`is_page_number` of `text.rs`, widened to roman numerals and `A-3`) at an edge goes where the numbers step across pages. Keep `page_paragraphs`' dropping of a leading or trailing page number as it is, for the case of one page.
- **The body** (`body_style`): the style (family, italic, bold, size rounded to half a point) of most lines by their count of characters, over the whole file.
- **Headings** (`headings`): a line, or up to three consecutive lines, whose size is at least 1.15 of the body's, or whose style is bold and size at least the body's, standing with more room above and below than the body's step (`by_place` finds the step: lift its finding into a function), and not in a block of kept lines. Their levels: the distinct heading sizes across the file, sorted downwards, at most three; smaller distinct sizes beyond three fold into level three.
- **Margin numbers** (`margin_numbers`): a line, or a bit of a line split off by place, that is digits (or roman numerals) alone, standing wholly left of the text's left edge or right of its right edge (the edges: the 10th and 90th percentiles of lines' left and right over the page, body lines only), and whose vertical middle lies within a line's top and bottom: the number is that line's given number, and the side is remembered. The `Gatherer` and `tsv_paragraphs` must not merge a margin number into the line's text: `layer.rs` already keeps parts of a line apart by place and joins them; give `page_lines` a step that splits off a part standing beyond the edges into a line of its own (do this in `shape.rs` on the lines as given, by place, where a line's text begins or ends with digits and its `left` or `right` lies beyond the edges by more than the body's size).
- **Kept lines** (`kept`): a block of three or more consecutive lines of one style where the right edges are ragged (the standard deviation of `right` is more than 8% of the text's width, and no line reaches within 2% of the right edge except the last of a sentence) and the left edges agree within half the size, or where margin numbers stand beside any of the lines: kept as lines. Lines of a kept block are not joined; a word broken at a line's end is left as it is.
- **Paragraphs** (`paragraphs`): what is left, grouped as `by_place` groups, joined as `page_paragraphs` joins (with the dictionary); `indent` where the first line's `left` exceeds the block's other lines' by more than the body's size, or exceeds the text's left edge so where the block is one line.
- **Styles found** (`styles`): every (style, indent, kept) of paragraphs and kept blocks that is not the body's and not a heading's, where it occurs on at least two pages or three times; others are the body's. The sample is the first paragraph's first 120 characters.
- **Columns** (`columns`): where the lines of a page fall into two groups by `left`, one wholly left of the page's middle and one wholly right, with a gap of at least twice the body's size between the widest right of the left group and the narrowest left of the right group, the left group is ordered before the right. Apply before the other rules.

Tests, with lines made by hand (a helper `line(text, left, right, top, bottom, size)`): running heads over four pages found and dropped; a page number at the foot; a heading by size and one by bold; kept lines with margin numbers every fifth line on the right; a paragraph indented; a smaller recurring style on three pages found with its count; two columns ordered; a prose page with nothing found but paragraphs (the important negative test: a page of a novel yields one style, the body, and no kept lines).

Verify: `cargo test -p glaukopis-core`. Commit.

## Step 3 — the shaped pages become a document

### 3.1 `ocr/mod.rs`

- `Asked` gains `pub shape: bool` (serde default `true`).
- `read_pdf`: the lines of each page (Tesseract's, or the layer's as taken) go through `shape::shape` when `asked.shape`; `PageText.paragraphs: Vec<String>` becomes `PageText.pieces: Vec<Piece>` (and `ReadPdf` gains `styles: Vec<StyleFound>`); a page that failed holds one `Piece::Paragraph` with the failure line. `mend_across` works over the body paragraphs' strings as before: lift the strings, mend, put back.
- `imported_pdf`: for each page a `Section { level: 1, heading: label }` as now, its blocks from the pieces up to the first heading; each `Piece::Heading { level }` opens a `Section { level: 1 + level }` under the page with the pieces that follow it. Blocks: `Piece::Paragraph` → `Block::Paragraph { name, indent: 1 or 0, content }` with `content` from the runs (`Inline::Text` with `em`, `strong`, `smallcaps` marks); `Piece::KeptLines` → one `Block::Paragraph { name, numbering: Given where any number, side, content }` with the lines parted by `Inline::Break` and each numbered line beginning with `Inline::LineMark { number: Some(..), counted: true, .. }` (a line without a number: no mark). `name` is `text` for the body, `style:<index>` for a style found. `Imported.styles` carries `StyleFound` as the interface needs it (`StyleFoundView { id, family, italic, bold, size, indent, kept, sample, count, pages }`). `Counts.parts` counts the sections made.
- `read_picture` is unchanged (one page, no file-wide styles; shaping a single picture adds nothing).

### 3.2 `src/lib/api/imported.ts`, `src/lib/api/ocr.ts`, `contract.rs`

`Imported.styles: StyleFoundView[]`; `Asked.shape`. A value in the contract made from a shaped fixture (the Typst fixture of step 5, written into the core's `testing` as `shaped_pdf()`).

Verify: `cargo test -p glaukopis-core`, `cargo test -p glaukopis contract`, `pnpm check`. Commit.

## Step 4 — the dialog: the shape kept, the styles named

### 4.1 `src/lib/ocr/ReadStep.svelte`

A checkbox *Keep the shape of the pages* (`data-choice="shape"`, on at first; hint: "Headings, lines kept as lines, numbers in the margin, and the running heads left out. Off, the pages become plain paragraphs."), sent as `shape`. It stands under the text's choices, for pictures too? No: a picture is one page; show it only for PDFs.

### 4.2 `src/lib/documents/DocumentDialog.svelte`

After the reading, where `read.styles.length > 0`: a part *Styles found* under the facts: a line "{count} styles of text recur beside the body; say what each is, or leave it as text." and for each style a row (`data-style={id}`): a sample in its look (italic, bold, smaller as `size` relates to the body's, indented, kept lines shown as such), how often and on how many pages, and a `Select` of: *Text* (the default), the kinds of the catalogue by family (as the kind menu lists them, `src/lib/editor/kinds.ts`), *A kind of my own…* which asks a name (a `TextField` shown in the row; the name's first guess is the look in words: "Smaller text", "Italic text", "Indented text", "Lines kept"). The choices are kept in the dialog's state as `Map<id, { kind: string } | { own: string }>`.

`makeImported` (or a step before it in the dialog): for each style chosen as a kind of the writer's own, make a `PassageKindRecord` in `project.yPassageKinds` (see how `newPassageKind` in `own-kinds.svelte.ts` and the project make one: id, name, family *text*, `basedOn: 'text'`, an empty look, an order after the last); then replace `name: 'style:<id>'` in every block by the chosen kind's id, or by `text`. Do the replacing in `import.ts` as a function `nameStyles(imported, choices)` with a unit test in `import.test.ts`.

### 4.3 Words, e2e

`locales/en|nb/ocr.ftl` and `documents.ftl` for the new words. `e2e/ocr.mjs`: see step 5.

Verify: `pnpm check`, `pnpm test`, `node scripts/check-locales.mjs nb`. Commit.

## Step 5 — fixtures, e2e, the owner's book, the guide, the warning made general

### 5.1 A fixture with a shape — `crates/core/src/testing.rs` and `e2e/ocr.mjs`

A PDF made with Typst (the core's tests have `kit.typeset`; the e2e script has `typst(...)`): four pages with a running head (`#set page(header: ...)`) and page numbers (`numbering: "1"`), a title in 18 pt, a heading in 14 pt, body in 11 pt with an indented paragraph and an italic run, a block of eight ragged lines with numbers in the right margin at every fourth line (a `grid` with the number in a narrow right column), and a smaller recurring text (9 pt) at the foot of every page. The core's test `the_shape_of_a_file_is_found` asserts: headings as sections with levels 1 and 2 under the pages, the running head and page numbers gone, eight lines kept with given numbers on the right, the paragraph indented, the italic run marked, one style found with count 4 on 4 pages, and the same file read with `shape: false` giving plain paragraphs.

`e2e/ocr.mjs`: the same PDF dropped on the tabs, *Keep the shape of the pages* on, read; the dialog lists one style found with its sample; it is named a kind of the writer's own, "Foot notes"; *Bring it in*: the page elements have child elements for the headings, the kept lines stand with their numbers in the margin (check the line marks in the text view, `.linemark` with the number), and the paragraphs of the style have the new kind (the kind menu shows "Foot notes" as an own kind). Screenshots `ocr-6-shape` light and dark, and of the styles part.

### 5.2 By hand, on the owner's book (a text to test against)

Read pages 100–120 of the print with the shape kept, and say what came out, without changing the rules for the book's sake: whether the running head *ΑΡΙΣΤΟΦΑΝΟΥΣ* and the page numbers went, whether the verse stood as kept lines with the numbers 700, 705, 710 given, whether the speakers' names stayed at the head of their lines, and what the apparatus became (a style found, in the smaller size). Quote a few lines. If a rule misfires on it in a way that is general (a running head not found, a number not attached), fix the rule; if only a rule for dramas would help, say so and leave it.

### 5.3 The warning made general — `src/lib/ocr/how.ts`, `ReadStep.svelte`, `SearchableDialog.svelte`

`latinWithGreek` becomes `scriptsAlike(chosen: string[]): { a: string; b: string; alike: string }[]`: pairs of scripts among the languages chosen whose letters look alike, Greek and Latin (`ϲ c, ο o, ν v, ρ p, α a`), Cyrillic and Latin (`с c, о o, р p, а a, е e, у y, х x`), Greek and Cyrillic (`ο о, α а, ρ р`); the words `ocr-languages-scripts-alike = { $a } is read together with { $b }: letters that look alike in the two ({ $alike }) are often read as the other, and whole words come out wrong. For one script alone, take the others away.` with the scripts named by `ocr-language-script`; `ocr-languages-greek-with-latin` goes. A table of Tesseract's language codes by script in `how.ts` (Latin, Greek, Cyrillic, and the rest as *other*, never warned of). Tests in `how.test.ts`.

### 5.4 The guide

`docs/guide.md`, *Text in scans and pictures*: a part on the shape of the pages, what is found and how it is named, the styles found and naming them, and that no kind of text is guessed; the warning on scripts.

Verify: `cargo test -p glaukopis-core`, `cargo test -p glaukopis contract`, `pnpm check`, `pnpm test`, `node scripts/check-locales.mjs` over every language, `pnpm e2e:build`, `timeout 600 node e2e/ocr.mjs`, and `documents.mjs`, `files.mjs`. Commit.

## Report

At the end: what was built step by step; what was left; what the owner's book gave by hand, quoted, with any rule you did not write because it would have been for dramas alone; the counts of every check and of each e2e script; and anything done otherwise than the record, with why.
