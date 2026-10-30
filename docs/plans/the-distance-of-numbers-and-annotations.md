# The distance of the numbers and the annotations from the text — the build plan

The working plan for `docs/adr/0076-the-distance-of-numbers-and-annotations.md`. Read the record first, in full: it says what and why, and what was found; this says how, in which order, in which files, and how each stage is verified. Where they disagree, the record wins; say so in your report. Read also `.claude/briefs/common.md` (the progress note, the languages, the rules), and the records 0067 (the numbering of lines in two windows, the side of the annotations, with its addendum) and 0065 (Look in plain words, lengths in centimetres), whose code this builds on.

Read the last section of `docs/brief.md` (2026-10-31, *the distance of the numbers and the annotations*): it is the owner's words, and the record is read from them. Nobody answers questions while you build: where something is open, choose the plainer thing, write the choice down in your progress note and your report, and go on. The record's "Choices made in writing this" lists what the owner has not been asked about; build them as written.

Work on `main`. Commit after every stage that builds, with a message that says what was built, in the voice of `git log`. Keep `PROGRESS-opus.md` at the root as the common brief says. Build the binary, `cargo test` and `cargo clippy` only in a capped `systemd-run` unit, as `.claude/briefs/fewer-words/common.md` shows. Never push, never tag, never start the GitHub Installers workflow. The owner's own Glaukopis may be running: never touch it, nor its data.

## Vocabulary

- *The layout*: a `DocumentFormat` (`crates/core/src/formats/mod.rs`; `src/lib/api/documents.ts`), the layouts that ship in `resources/formats/*.json`; `verse` is its look of numbered lines: `every`, `side`, `annotations`.
- *A length*: `Length` in `crates/core/src/formats/length.rs`, kept in the unit it was written in, `0.25cm`, written as such into Typst, LaTeX and CSS by its `Display`; in the interface a string, shown and written in centimetres by Look's `length` row (`rowsOf` in `src/lib/ui/settings/rows.ts`, used in `LookPanel.svelte` as `length(label, { get, set }, { path })`, see *Column gap* about line 985).
- *The text's edge*: the edge the paragraphs of the text block share, whatever the indent of their kind; in Typst `gk-beside` finds it from the page's margin, `gk-at` from the verse's inset; in the text view it is the paragraph's box less `--inset`.
- *The near edge*: of a number at the left of the text its right edge, at the right its left edge; of an annotation the same.
- *The preamble*: what `formats/typst.rs` writes before the document, where `gk-number`, `gk-margin`, `gk-at`, `gk-beside` and `gk-line` are defined (about lines 740–830).
- *`beside`*: `crates/core/src/document/passages.rs`, about line 702, which writes what stands beside a paragraph of a numbered stretch, for Typst, LaTeX and the rest.
- *The text view*: `src/lib/editor/RichText.svelte` and the rules of `.prose` in `src/app.css` (`.line-number` about line 1312, `.line-margin` about line 1392, `.run-line` about line 452).

## The words

Every word the user sees comes through `t('key')` from `locales/en/<part>.ftl` and `locales/nb/<part>.ftl`; write English and Bokmål together, in the same plain voice (`.claude/briefs/words.md` has the glossary; the rows beside these are `format-verse-side = Numbers on the | Numrene på` and `format-verse-annotations = Annotations on the | Merknadene på`). New keys go at the end of their files under a comment naming this plan.

```
format.ftl
format-verse-numbers-gap = Numbers from the text              | Numrene fra teksten
format-verse-annotations-gap = Annotations from the text      | Merknadene fra teksten
```

The unit *cm* is the row's, as for every length of Look.

## Stage 1 — the core: two lengths, one column

### 1.1 The layout — `crates/core/src/formats/mod.rs`

- `Verse` gains `#[serde(skip_serializing_if = "Option::is_none")] pub numbers_gap: Option<Length>` and the same `annotations_gap`, both `None` in `Default`; the doc comment of `Verse` says what they measure (the record's *Two lengths of the layout*) and loses "Where they stand on the numbers' side, they stand outside the numbers, further from the text".
- Beside `annotations_beside`: `pub fn numbers_gap(&self) -> Length` (`self.numbers_gap.unwrap_or(Length::cm(0.25))`) and `pub fn annotations_gap(&self, numbers: Side) -> Length`: the length given; else the numbers' length where `annotations_beside(numbers) != numbers`, else `Length::cm(1.5)`. The two defaults are constants with a comment saying they are the em the pages had, to within a millimetre. Tests beside the struct's: the defaults by placement; a layout that gives a length keeps it; a layout written without the fields reads as before (`serde_json::from_str` of a `verse` with `every` and `side` alone).

### 1.2 The preamble — `crates/core/src/formats/typst.rs`

- `gk-at(side, inset, gap, body)` and `gk-beside(side, gap, body)` take the length and lose `out`: at the left, `dx: -inset - gap - 4em` (and `{left} - x - gap - 4em`), the body in `box(width: 4em, align(right, body))` as now; at the right, `dx: 100% + gap` (and `page.width - {right} - x + gap`), a number as it is, an annotation in a box as wide as the margin leaves beyond its length, `{right} - gap - 0.4em`, so that long words wrap as today. Where Typst refuses to compare or subtract a length with em outside a context, do it in absolute lengths inside the `context` the functions already have (`.to-absolute()`), or leave the em out of that one measure.
- `gk-line`: `let out = …` goes; the number is placed with `{numbers_gap}` and the annotation with `{annotations_gap}`, both written into the preamble from `f.verse.numbers_gap()` and `f.verse.annotations_gap(f.verse.side)`, as `{inset}` and `{step}` are. The comment over the preamble (about line 740) says the lengths are the layout's and the same on every line.
- The tests of the preamble that pin `out: out` and `#let gk-beside(side, body, out: 0pt)` (about lines 1076 and 1094) say the new shape; a test that a layout with `annotations_gap: 2cm` writes `2cm` into `gk-line`.

### 1.3 Beside a paragraph — `crates/core/src/document/passages.rs`

- `beside`, the Typst branch: `call(side, text, margin)` writes `#gk-beside("{side}", {gap}, {body});` with the numbers' length for a number and the annotations' for a margin, from the layout the converter has (`self.extras.verse`, see `annotations_beside` there); `k > 0` and `out` go. The LaTeX branch: `\hspace{{{gap}}}` with the same lengths in place of `0.9em`/`3.9em` and `1em`/`4em`. The rest (`_`) is untouched.
- The tests that pin the em (about lines 1176, 1430–1436) and those in `export/mod.rs` (about lines 4557–4560, 4664–4671) say the lengths: `#gk-beside("left", 0.25cm, gk-margin("ia."));` on a line that shows no number as on one that does; `\hspace{0.25cm}` and `\hspace{1.5cm}`.
- The contract test (`src-tauri/src/contract.rs`) puts a shipped layout, which says nothing of the lengths: nothing to add; `cargo test -p glaukopis contract` all the same, so that `contract.generated.ts` is as it should be.

### Verify

- `cargo test -p glaukopis-core` capped, `cargo clippy --workspace --all-targets`, `cargo fmt --all`.
- By hand in the Typst of a test (`preview` of a document with a numbered stretch of prose, every fifth, annotations at the left with the numbers): every line's annotation at the same `dx`.

Commit: *The distance of the numbers and of the annotations from the text are two lengths of the layout, the same on every line of a stretch: Typst and LaTeX write them in place of the em, and an annotation on the numbers' side no longer moves in on a line that shows no number.*

## Stage 2 — Look, the interface's types, the text view

### 2.1 The types and Look — `src/lib/api/documents.ts`, `src/lib/look/LookPanel.svelte`, `format.ftl`

- `DocumentFormat.verse` gains `numbersGap?: string | null` and `annotationsGap?: string | null`, with a comment on what they measure and the defaults.
- `numbersRows` (about line 1120), after the chooser of the annotations' side: `length(t('format-verse-numbers-gap'), { get: (f) => f.verse.numbersGap ?? '0.25cm', set: (f, v) => (f.verse.numbersGap = v) }, { path: 'verse.numbersGap' })` and `length(t('format-verse-annotations-gap'), { get: (f) => f.verse.annotationsGap ?? (sameSide(f) ? '1.5cm' : (f.verse.numbersGap ?? '0.25cm')), set: … }, { path: 'verse.annotationsGap' })`, where `sameSide(f)` is `f.verse.annotations === f.verse.side`. Lift the two defaults and `sameSide` into `src/lib/look/changes.ts` or a small module both Look and the text view read (`src/lib/editor/numbers.ts` is read by the editor; `src/lib/document/` may suit), with a test: the default by placement, the layout's value kept.
- `changesBetween` is generic over the leaves: nothing to add; check that a changed length shows *Changed here* and goes back with the layout's.

### 2.2 The text view — `src/lib/editor/RichText.svelte`, `src/lib/editor/numbers.ts`, `src/app.css`

- `NumbersLayout` gains `numbersGap` and `annotationsGap`, in points as `step` is (`toCm` then `* 72 / 2.54`); `numbersLayout` in `RichText.svelte` (about line 164) fills them from the layout in force with the same defaults as Look; the root sets `style:--numbers-gap` and `style:--annotations-gap` beside `style:--step` (about line 643), in `pt`.
- `app.css`: `.prose .line-number` `right: calc(100% + var(--numbers-gap, 0.25cm) + var(--inset))` and at the right `left: calc(100% + var(--numbers-gap, 0.25cm))`; `.line-margin` at the right `left: calc(100% + var(--annotations-gap, 0.25cm))`, at the left `right: calc(100% + var(--annotations-gap, 0.25cm) + var(--inset))`; the two rules for the numbers' side (about lines 1431–1436) go, since the length carries the placement. The bracket outside the numbers (`p[data-run-numbers='left'] > .run-line`, about line 477): `left: calc(-1 * (var(--numbers-gap, 0.25cm) + 3em) - var(--inset))`. Where an annotation stands at the left and a bracket is drawn, the view keeps the bracket between: `right: calc(100% + max(var(--annotations-gap, 0.25cm), <the bracket's offset> + 0.6em) + var(--inset))` on `p[data-run-numbers]`/`p[data-run]` paragraphs (look at which attribute marks a paragraph with a bracket, `data-run-first`/`data-run-numbers` in `brackets.ts`); the comment says why the view alone does this. The right margin kept for annotations (`margin-right: min(8em, 30%)` and `min(11.7em, 40%)`) becomes one rule from the length: `margin-right: min(calc(var(--annotations-gap, 0.25cm) + 7em), 40%)`, or keep the two where that reads better; say which.
- The dialog of a line (`LineDialog.svelte`, *Numbering of this line*) names the annotation's side: unchanged.

### Verify

- `pnpm check`, `pnpm test`, `pnpm format` on the files under `src/`.
- `e2e/look.mjs`, the part *The side of the annotations* (about lines 471–600), rewritten for the column: the Muse paragraph is numbered as now, and shows its number: set *Show a number every* to 1 in Look's *Line numbers* for this part (or give the line a number by hand in *Numbering of this line*), so that the page has a number on the line; then, as now, across from the numbers, on the numbers' side at the left (`typstHas(/#gk-beside\("left", 1\.5cm, gk-margin\("metre"\)\);/)` and the number with `0.25cm`), the annotation left of the number and the number left of the line on the page and where one writes; with the numbers at the right and the annotations across, then at the right outside; the screenshots `look-8-annotations` and `look-9-annotations-right` as now. Then a second numbered paragraph of the same stretch, whose number is not shown (every 5 again), with an annotation: on the page its annotation stands at the same x as the Muse line's (a check of the column), and so in the text view. Then the lengths: `app.lookWrite('Annotations from the text', '2.5')` moves the annotation on the page by about 1 cm at the page's zoom (measure the span's `left` before and after, as *Indentation step* is measured at the end of the script) and in the text view by `1 * 96 / 2.54` pixels, to within 2; `app.lookWrite('Numbers from the text', '1')` moves the number the same way; *Changed here* appears on the rows; the layout's again takes them back.
- The four checks that failed before this work are among those rewritten; the script passes whole.
- `e2e/line-numbers.mjs`, `e2e/verse.mjs`, `e2e/runs.mjs`, `e2e/brackets.mjs` and `e2e/kinds-of-passage.mjs` still pass: they measure numbers and brackets.

Commit: *Look has the two lengths under Line numbers, Numbers from the text and Annotations from the text, in centimetres; the text view stands its numbers, annotations and brackets by them, as the page does.*

## Stage 3 — the guide, the record

- `docs/guide.md`, *Look*, **Line numbers** (about line 2743): the two rows, what they measure, their defaults, and that an annotation on the numbers' side stands outside them at the layout's length on every line; *Typesetting* (about line 2624, "or beside the number, further out, where the layout sets the annotations on the numbers' side") says "at the length the layout gives"; *The text*, the numbering (about line 570), one sentence that the distances are the layout's, in Look.
- An addendum to 0076, *as built*: what departs from the plan, the choices made alone, the counts.

## At the end

- Run `e2e/look.mjs`, `e2e/line-numbers.mjs`, `e2e/verse.mjs`, `e2e/runs.mjs`, `e2e/brackets.mjs`, `e2e/kinds-of-passage.mjs`, `e2e/preview.mjs`, `e2e/languages.mjs`.
- Report: what was built, stage by stage, with the commits; what was left and why; the counts of `pnpm check`, `pnpm test`, `cargo test`, and every e2e script with its ok/FAIL counts; the paths of the screenshots to look at.
