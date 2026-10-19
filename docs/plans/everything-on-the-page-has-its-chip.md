# Build plan: everything the page carries has its chip, and a switch beside its look

The working plan for `docs/adr/0056-everything-on-the-page-has-its-chip.md`. Read the record first, in full. Read also `docs/plans/what-you-are-writing.md`, sections "How to work, tonight" and "Stage 5", which built the chips, and `docs/plans/the-shape-of-a-text-and-its-org-form.md`, section "How to work": both hold. One session, four steps, each a commit, no agents.

## How to work

- Plain words; never a record number when writing for the owner.
- Checks: `cargo test -p glaukopis-core`, `cargo fmt -p glaukopis-core` (put `crates/core/build.rs` back with `git checkout crates/core/build.rs` if it reformats it), `cargo clippy -p glaukopis-core --all-targets -- -D warnings`, `cargo test -p glaukopis contract` after the core's types change, `pnpm check`, `pnpm test`, and the e2e scripts of step 4 after `pnpm e2e:build` (`timeout 400 node e2e/<name>.mjs > /tmp/<name>.log 2>&1`; end your own processes by PID, never `pkill -f`). Paste the counts into your report.
- Edit, then format (`pnpm exec prettier --write <files under src>`; the scripts in `e2e/` are not formatted).
- Commit when a step is whole, without asking; never push; never start the Installers workflow or make a tag. End every commit message with the attribution line the session gives you.

## Vocabulary

- *Spot*: a stretch of a page and what it is (`Spot` in `crates/core/src/export/typeset.rs`, `Preview.spots`), by which the preview names a line (`whatIs` in `src/lib/preview/spots.ts`) and a chip opens Look (`lookFor`).
- *The text area*: between the margins at the head and the foot; `spots(document, margins)` bounds a block that runs over a page by it.
- *A request to Look*: `LookRequest` in `src/lib/look/look.svelte.ts`: `section`, `kind`, `level`, `at`; `bring()` in `LookPanel.svelte` brings it into view.

## Step 1 — the margins are named (core)

### 1.1 `crates/core/src/export/typeset.rs`

```rust
/// What the layout puts in the margins: at the head of every page, and at its foot; nothing where it puts nothing there.
pub struct Margins { pub top: f32, pub bottom: f32, pub head: Option<&'static str>, pub foot: Option<&'static str> }

pub fn spots(document: &PagedDocument, margins: &Margins) -> Vec<Spot>
```

After the blocks, for every page `i` with `(top_of_page, text_top, text_bottom, bottom_of_page)`: where `head` is `Some(what)`, push `Spot { page, top: top_of_page, bottom: text_top, what }`; where `foot` is `Some(what)`, push `Spot { page, top: text_bottom, bottom: bottom_of_page, what }`. Keep the sort. Nothing else changes: the blocks are bounded as before.

### 1.2 `crates/core/src/export/mod.rs`, `preview_made`

```rust
let f = &request.format;
let numbered_at = |top: bool| f.page_numbers.show && (f.page_numbers.position.is_top() == top);
let head = if f.running_head.content != RunningHeadContent::None { Some("running-head") } else if numbered_at(true) { Some("page-number") } else { None };
let foot = numbered_at(false).then_some("page-number");
let margins = typeset::Margins { top: f.page.margin_top.points(), bottom: f.page.margin_bottom.points(), head, foot };
```

Read `formats/mod.rs` for the names of the running head's `content` enum and of `Position` (its six values begin `Top…`/`Bottom…`); write `is_top()` on `Position` if nothing like it exists. Where the running head and the page number share the head, the head is named for the running head: Look's page part shows the page numbers' rows a few rows below the running head's.

### 1.3 Tests

`what_stands_where_on_the_pages_is_found` (typeset.rs): its source sets a running head and the page number at the foot; call `spots` with `head: Some("running-head"), foot: Some("page-number")` and assert `names("Running head") == [Some("running-head")]` and the number at the foot (the digit "1", found by `r.text.trim() == "1"` on page 1 and at the foot: filter the runs by `baseline > height - 30.0`) is `page-number`; the assertion that the running head and the number stand in no spot goes. In `the_preview_tells_what_stands_where_on_its_pages` (mod.rs): the Test layout has page numbers at the bottom (the default `pageNumbers`); assert a spot `page-number` at the foot of page 1 and none named `running-head`; then set `r.format.running_head.content` to the title and `page_numbers.position` to a top position and assert a `running-head` spot and no `page-number` one.

`cargo test -p glaukopis contract` (the `Spot` type is unchanged; run it all the same). Commit.

## Step 2 — the chips name them, and Look lands on their rows (interface)

### 2.1 `src/lib/preview/spots.ts`

`What` gains `{ sort: 'running-head' } | { sort: 'page-number' } | { sort: 'page' }`; `readWhat` reads the first two as it reads `note` (no colon); `lookFor`: `running-head → { section: 'page', at: 'running-head' }`, `page-number → { section: 'page', at: 'page-numbers' }`, `page → { section: 'page' }`. Tests in `spots.test.ts` for the three.

### 2.2 Words — `locales/en/preview.ftl`, `locales/nb/preview.ftl`

`preview-what-running-head = Running head` / `Kolumnetittel`; `preview-what-page-number = Page number` / `Sidetall`; `preview-what-page = Page` / `Side`. `wordsOf` in `PreviewPanel.svelte` already says `t(\`preview-what-${read.sort}\`)` for the sorts it does not treat apart; make sure the three fall there.

### 2.3 A heading within a part — `src/lib/ui/settings/rows.ts`, `Settings.svelte`, `LookPanel.svelte`

The row `{ subheading: string; when?; }` gains `at?: string`; `Settings.svelte` draws `<h4 data-at={row.at}>`. In `LookPanel.svelte`'s `pageRows`: `{ subheading: t('format-page-numbers'), at: 'page-numbers' }` and `{ subheading: t('format-running-head'), at: 'running-head' }`. `bring()` already looks for `[data-at]`; nothing to change there. Test: `rows.test.ts` or a small test of `Settings.svelte` that a subheading with `at` carries `data-at`.

### 2.4 The chip of the page — `PreviewPanel.svelte`

Where the pointer rests on the drawn page (`img`) and on no line, in a margin or between blocks: a chip reading the words of `page`, at the pointer's height, in the margin as the line chips stand, opening Look at `{ section: 'page' }`. `pointed` becomes `{ page: number; what: string; top: number }` (`top` in percent of the page), set by `point()` from a line and by a new `pointPage(event, n)` on the `img`'s `onpointermove` (throttled to when the height changes by more than a line) with `what: 'page'`; the line chips take precedence, since the lines lie over the picture. The chip of the page goes as the line chips go (`part`). While the chips are off, nothing of this runs.

Verify: `pnpm check`, `pnpm test`. Commit.

## Step 3 — first whether, then how: the front page's switch (interface)

### 3.1 The shared switch — new `src/lib/look/composition.svelte.ts`

Move out of `ContentsSection.svelte` what writes a change to what the document contains, so that two parts of Look share it:

```ts
/** The changes of a document to what it contains, as one part of Look reads and writes them (ADR 0054, 0056). */
export class Composition {
  constructor(project: Project, at: () => string)
  /** The template as the document uses it; nothing until read. */
  get used(): Template | undefined
  /** The template as the elements over this one leave it: what a change here is told from. */
  get given(): Template | undefined
  has(part: GeneratedPart): boolean          // hasPart(used, part)
  setPart(part: GeneratedPart, on: boolean)  // as ContentsSection.setPart does: write, or take the change away where it comes back to what is given
  set(path, value, left), takeAgain(who, path), from(path): Provenance | null   // as they are
}
```

`ContentsSection.svelte` makes one and uses it; its behaviour does not change (its test, `ContentsSection.test.ts`, keeps passing).

### 3.2 The front page — `LookPanel.svelte`

The part `front` begins with the title page's switch, drawn as `ContentsSection` draws it (`label.row.check`, `input[type=checkbox][data-part-switch="title-page"]`, the `from` line under it), by a `Composition` of Look's own; then the rows of `titleRows` in this order: the subheading *What is shown* (anonymous, authors, affiliations, date, abstract, the labels), then a subheading *How it is set* (`format-title-how`, new words: "How it is set" / "Hvordan den settes") with placement, size, bold, italic, letters, alignment. The chip `front` thus lands on the switch first. Where the template in use has no title page, the rows under the switch stay (they set the half title and the abstract too) and the switch is off.

Verify: `pnpm check`, `pnpm test` (the test of the section, and a test that `front` begins with the switch, in the panel's test if there is one, else a note in the report). Commit.

## Step 4 — e2e, words, guide

- `e2e/what.mjs`: after the quotation's chip: hover the line at the foot of page 1 that holds the page number (`.line[data-what="page-number"]`), the chip reads "Page number", pressing it opens Look with `[data-at="page-numbers"]` within the panel's view (its top within 120px of the panel's chips' bottom); then `app.chooseWhat('Play')` (the play-script layout has a running head of the title and the number at the top right), wait for `.line[data-what="running-head"]`, its chip reads "Running head", pressing it brings `[data-at="running-head"]` into view; choose "Nothing" (`app.lookChoose('What it shows', 'none')`, or whatever the row's label is) and wait until no `.line[data-what="running-head"]` is on page 1. Then the title: hover the `front` line, press, and check that the first row of the front part is the switch `[data-part-switch="title-page"]`; press it, and wait until no `.line[data-what="front"]` remains. Then the page's chip: `app.hover` on `.preview .page img` (at a point in the margin, below the last line: use the harness's `hover(target, dx, dy)` offsets), the chip reads "Page" and opens Look at `.part[data-part="page"]`. Screenshots `what-6-running-head`, `what-7-page`.
- `docs/guide.md`, *The preview, and the manuscript*: the chips name the running head and the page number too, and the page itself where the pointer rests on no line; *The look of a document*: each part begins with whether a thing is shown and goes on to how it looks, with the front page as the example.
- `pnpm e2e:build`; run `what.mjs`, `look.mjs`, `templates.mjs`, `preview.mjs`. Commit.

## Report

What was built, with paths; the DOM the scripts rely on (`.line[data-what="running-head"|"page-number"]`, `.chip[data-what="page"]`, `[data-at="page-numbers"|"running-head"]`, `.part[data-part="front"] [data-part-switch="title-page"]`); every departure from the record; what was left or doubtful; the counts, verbatim. Do not push.
