# Build plan: the workbench of a reading

The working plan for `docs/adr/0061-the-workbench-of-a-reading.md`. Read the record first, in full: it says what; this says how, in which order, in which files, with which interfaces, and how each stage is verified. Where they disagree, the record wins; say so in your report. Read also `docs/adr/0060-a-reading-says-how-well-it-went.md` and its plan `docs/plans/a-reading-says-how-well-it-went.md`, whose dialog this plan replaces, `docs/adr/0044-the-text-a-pdf-has.md` and `docs/adr/0047-the-structure-of-a-document-read-from-a-pdf.md`.

Read, before anything else, the code as it stands: `crates/core/src/ocr/mod.rs`, `child.rs`, `text.rs`, `layer.rs` (its `Verdict`), `searchable.rs` (`lay_over`), `src-tauri/src/commands/ocr.rs`, `src-tauri/src/state.rs`, `src/lib/api/ocr.ts`, `src/lib/ocr/ReadStep.svelte`, `TryPane.svelte`, `PageStrip.svelte`, `strip.ts`, `Stretches.svelte`, `stretches.ts`, `how.ts`, `HowControls.svelte`, `TextPart.svelte`, `TextPreview.svelte`, `LanguagePicker.svelte`, `SearchableDialog.svelte`, `PdfMapDialog.svelte`, `PictureTextDialog.svelte`, `src/lib/documents/DocumentDialog.svelte`, `src/lib/ui/Dialog.svelte` (`width`, `tall`), and `e2e/ocr.mjs`.

## How to work

Nobody answers questions while you work. Where this plan leaves a choice open, choose the plainer thing, write the choice down in your report, and go on.

- **Plain words**, as the code around you: comments, commit messages, the guide, the words of the interface. Never a record number when writing for the owner.
- **Stages end in commits.** A stage is committed when its checks pass, without asking; never push; never start the Installers workflow or make a tag. End every commit message with the attribution line the session gives you. Do not touch other projects or folders outside this repository, except the folder of PDFs named under *Evidence*.
- **Checks**: `pnpm check`, `pnpm test`, `cargo test -p glaukopis-core`, `cargo test -p glaukopis contract` (writes `src/lib/api/contract.generated.ts`; run after any change of a core type the interface sees), `node scripts/check-templates.mjs`. Paste the counts into your report.
- **Edit, then format**: `pnpm exec prettier --write <files under src>`; `cargo fmt -p glaukopis-core` (it may reformat `crates/core/build.rs`; put that back with `git checkout crates/core/build.rs`). The scripts in `e2e/` are not formatted by prettier.
- **e2e**: `pnpm e2e:build`, then one script at a time, `timeout 400 node e2e/<name>.mjs > /tmp/<name>.log 2>&1`, and read the log and the screenshots in `e2e/output/`. A hang is a loop in the page: end your own processes by PID (`ps -eo pid,comm | grep -E 'Xvfb|WebKitWebDriver|glaukopis'`), never `pkill -f`. Nothing touches the owner's desktop; never drive the owner's own windows.
- **Agents**: the stages that touch different files run in worktree agents at the same time (below), from the commit that ends stage 0. Every agent commits in its worktree when a step is whole, and at least once an hour, so that nothing is lost to a disconnect; an agent is never stopped with uncommitted work, and no worktree with work in it is discarded. The main session merges the worktrees into `main` and resolves what conflicts.
- **The editor's extension host** on this computer grows by the minute; it may be killed before a long build.
- **Report** at the end: what was built, with paths; the DOM of the new parts (classes and data attributes); what was left or doubtful; every departure from the record; the counts, verbatim.

## Evidence

`/home/proteus/glaukopis-pdfer/` holds PDFs the owner placed there for the work on reading: a Norwegian novel in Gothic type of 559 pages, scans of the Nasjonalbiblioteket, a Greek edition with English, a book of pictures at 72 dots to the inch. Use them only to try the workbench by hand (a long strip, a book with text on every page, a book with none), never as fixtures of the tests; read nothing else outside the repository. The end-to-end fixtures are made with Typst in `e2e/ocr.mjs` as today.

## Vocabulary

- *Source* of a page: where its text comes from, `pdf` (the text the PDF has) or `read` (Tesseract). In the interface `Source`; in the core, the pages read are `Asked.read`.
- *Settings* of a page: what Tesseract reads it with, `PageSettings { languages, dpi, layout, contrast }`.
- *The plan of the pages*: one `PagePlan` (source and settings) per page, which the workbench keeps and from which `Asked` is made (`plan.ts`). Not to be confused with this document.
- *Selection*: the pages the actions and the settings apply to, counted from one; empty means every page.
- *Stretch* (the core's word, `Asked.stretches`) or *run* (the interface's, `runsOf`): pages in a row with the same settings.
- *The page in view*: the one the panes show; one page, always.
- *Trial*: one reading of one page with given settings; `Trial` in the interface holds the settings and the core's `Tried`.
- *Unsure word*: a word Tesseract gave a confidence under `UNSURE = 70`.
- *The kept reading*: the core's `ReadPdf` held under a token after a reading into elements, from which the tree is assembled with the choices made after it (`Making`).

## What exists, and what each piece becomes

| Today | Becomes |
| --- | --- |
| `Looked { withText, poor, firstWithoutText, … }` | gains `verdicts: Verdict[]`, one per page; the counts stay |
| `Asked { text, structure, pageMarks, stretches: [{from, languages, layout}] }` | `text` stays (keep, translate, anew); `structure` and `pageMarks` leave; `read?: number[]`; a stretch gains `dpi` and `contrast` |
| `Tried { paragraphs: string[], … }` | `paragraphs: TriedWord[][]`, with `words` and `unsure` counted |
| `ocr_read → Imported` | `ocr_read → ReadDone { imported, kept }`; `ocr_assemble(kept, making) → Imported`; `ocr_forget(kept)` |
| `child::Task::Searchable { strip: bool }` | `strip: Vec<usize>`: the pages whose old text is taken away |
| `Reader { with, quality, stretches: [(from, With)] }` | `stretches: [(from, With, Quality)]`; `quality_at(index)` |
| `ReadStep.svelte`'s asking phase (choices, `TextPart`, `HowDisclosure`, `TryPane`, `TextPreview`, `Stretches`, `PageStrip`) | `Workbench.svelte`: `PagesBar`, `PageStrip`, `PagePanes` (`PicturePane`, `PdfTextPane`, `TesseractPane` with `Trials`), `ReadSettings`; the action in the dialog's footer |
| `SearchableDialog.svelte`'s asking phase, the same pieces | the same `Workbench`, in its searchable mode |
| `stretches.ts` | `plan.ts` and `select.ts` |
| shape, structure and page marks asked before the reading | `MadeOf.svelte` in the step after the reading, assembling anew through `ocrAssemble` |
| `TryPane`, `Stretches`, `stretches.ts`, `HowDisclosure`, `TextPart`, `TextPreview` | removed |
| the dialogs 960 wide while asking | 1240 wide and tall while asking |

## The shape of the work

Five stages. Stage 0 is the main session's, first and alone: it fixes the contract every agent builds to. Stages A, B and C then run at the same time in three worktree agents. Stage M is the main session's after the merges.

| Who | Stage | Touches |
| --- | --- | --- |
| Main session, first | 0 the contract | `crates/core/src/ocr/mod.rs` (types only), `text.rs` (types only), `src-tauri/src/commands/ocr.rs` (signatures), `src/lib/api/ocr.ts`, `src/lib/api/contract.generated.ts` |
| Agent A (worktree `work/workbench-core`) | A the core and the commands | `crates/core/src/ocr/{mod,child,text,searchable,layer,tests}.rs`, `src-tauri/src/{state.rs,commands/ocr.rs}`, `src/lib/api/ocr.ts` (the calls only) |
| Agent B (worktree `work/workbench-strip`) | B the plan of the pages and the strip | `src/lib/ocr/plan.ts` (+ test), `select.ts` (+ test), `PageStrip.svelte`, `strip.ts` (+ test), `PagesBar.svelte`, `locales/en/ocr.ftl` and `locales/nb/ocr.ftl` (its own keys, at the end, under a comment `# The pages of the workbench`) |
| Agent C (worktree `work/workbench-panes`) | C the panes, the settings column and the trials | `src/lib/ocr/trials.ts` (+ test), `ReadSettings.svelte`, `PicturePane.svelte`, `PdfTextPane.svelte`, `TesseractPane.svelte`, `Trials.svelte`, `PagePanes.svelte`, `locales/en/ocr.ftl` and `locales/nb/ocr.ftl` (its own keys, at the end, under a comment `# The panes of the workbench`) |
| Main session, after merging | M the workbench, the dialogs, the step after the reading, words, guide, e2e | `Workbench.svelte`, `MadeOf.svelte`, `ReadStep.svelte`, `SearchableDialog.svelte`, `PdfMapDialog.svelte`, `DocumentDialog.svelte`, `how.ts`, `locales/*/ocr.ftl`, `docs/guide.md`, `e2e/ocr.mjs` |

Order of merging: A, then B, then C. The locale files will conflict only at their ends; take both sides. Agents B and C mount nothing in the dialogs: they build components and pure functions, verified by `pnpm check` and their unit tests; the main session mounts them.

## Stage 0 — the contract (main session, before the agents start)

Only types and signatures, compiled and regenerated, with the behaviour of today behind them, so that the three agents start from one truth.

**`src/lib/api/ocr.ts`**, exactly:

```ts
/** What the text a page has is like: none worth taking, text that does not read as text, or sound. */
export type Verdict = 'none' | 'poor' | 'sound';

export interface Looked {
  // … as today, and:
  /** Each page's verdict, in the order of the pages; empty for a picture. */
  verdicts: Verdict[];
}

/** A stretch of a PDF's pages read with settings of their own, to the next stretch or the end. */
export interface Stretch extends How {
  /** The page it begins at, counted from one. */
  from: number;
  languages: string[];
}

export interface Asked extends How {
  languages: string[];
  text: TextChoice;
  shape: boolean;
  stretches?: Stretch[];
  /**
   * The pages Tesseract reads, counted from one. Where given, exactly these,
   * and any page without text, which cannot take what is not there; the
   * others take the text the PDF has, as `text` says. Where not given, as
   * `text` says for every page: all with `anew`, those without text otherwise.
   */
  read?: number[] | null;
}
// `structure` and `pageMarks` leave `Asked`.

/** A word Tesseract read on a page tried, in the dots of the picture as shown. */
export interface TriedWord {
  text: string;
  /** From 0 to 100; nothing where Tesseract gave none. */
  confidence: number | null;
  left: number;
  top: number;
  width: number;
  height: number;
  /** Whether a line of the paragraph begins with it. */
  line: boolean;
}

export interface Tried {
  page: number;
  label: string;
  /** What was read, as paragraphs of words, in the order read. */
  paragraphs: TriedWord[][];
  /** How many words, and how many of them unsure (a confidence under 70). */
  words: number;
  unsure: number;
  confidence: number | null;
  poorly: boolean;
  png: string;
  width: number;
  height: number;
  blocks: TextBlock[];
}

/** What is made of a reading kept: the shape kept or plain paragraphs, the tree by its headings or its pages, the marks where pages begin. */
export interface Making {
  shape: boolean;
  structure: 'headings' | 'pages';
  pageMarks: boolean;
}

/** What a reading into elements came to: the tree as first made, and the token of the reading kept, where there is one (a PDF). */
export interface ReadDone {
  imported: Imported;
  kept: string | null;
}

export const ocrRead = (path: string, asked: Asked, ticket?: string, stored?: boolean) =>
  call<ReadDone>('ocr_read', { path, asked, ticket, stored });
/** The tree assembled anew from a reading kept, with other choices; the reading is not done again. */
export const ocrAssemble = (kept: string, making: Making) =>
  call<Imported>('ocr_assemble', { kept, making });
/** Lets a reading kept go. */
export const ocrForget = (kept: string) => call<void>('ocr_forget', { kept });
```

**The core, types only.** `layer::Verdict` derives `Serialize` with `rename_all = "lowercase"`; `Looked.verdicts: Vec<layer::Verdict>` filled in `look` (one per page; `Vec::new()` for a picture). `Asked` loses `structure` and `page_marks` and gains `read: Option<Vec<usize>>` (serde default); `Stretch` gains `dpi: u32` and `contrast: bool` (serde default). `Making { shape, structure, page_marks }` with serde `camelCase`; `imported_pdf(file, title, read: &ReadPdf, making: Making)`; `ReadPdf` loses `structure` and `page_marks`. `text::Word` (serialised as the interface's `TriedWord`) and `Tried { paragraphs: Vec<Vec<text::Word>>, words: usize, unsure: usize, … }`, filled for now by one word per paragraph holding the old paragraph's text with no confidence, so that it compiles; agent A makes it true. `pub const UNSURE: f32 = 70.0` beside `POORLY`.

**The commands.** `ocr_read` returns `ReadDone { imported, kept: None }` for now; `ocr_assemble` and `ocr_forget` exist and return `Error::not_found` for now, registered in the handler list. `ReadStep.svelte` and `PictureTextDialog.svelte` take `done.imported`. The dialogs still send `structure` and `pageMarks`: stop sending them, and make the shape, structure and page-mark choices of `ReadStep` inert for the moment (they are removed in stage M). `cargo test -p glaukopis contract`; the fixtures of `contract.generated.ts` (`looked`, `tried`) gain the new fields.

**Checks**: all five; the end-to-end script `ocr.mjs` will fail from here until stage M, say so in the commit message. Commit: this is the commit the three worktrees are made from.

## Stage A — the core and the commands (agent A)

A1. **The pages read.** In `read_pdf` and `make_searchable`, `wanted` is `asked.read` where given (counted from one there, from nought here; pages past the end dropped; sorted; each page without text added whatever the marks, since it cannot take text that is not there), else as today. A page not wanted that has text takes it as `taken_lines` says. In `make_searchable`, `child::Task::Searchable.strip` becomes `Vec<usize>`: the wanted pages that have text (`layer.has_text`), whose old text is taken away; `searchable_here` and `lay_over(bytes, doc, layers, strip: &[usize])` strip a page only where its index is in it. `TextChoice::Anew` keeps its meaning where `read` is not given.

A2. **Settings per stretch.** `Reader.stretches: Vec<(usize, tesseract::With, Quality)>`; `Reader::quality_at(index)` beside `with_at`; `child::Job.stretches` the same triple; `Reader::draw_and_read` and `try_here` draw the page with `quality_at`; `at_once` is computed with the largest `dpi` among the pages' qualities. `ready` makes the `With` and the `Quality` of every stretch and refuses a language not installed, naming it, as today.

A3. **The words of a trial.** `text.rs`: `tsv_page` is split into a parse (`parsed(tsv) -> Vec<Vec<ParsedLine>>`, each line with its words `(text, confidence, left, top, width, height)` after the ſ→s) and two derivations: `tsv_page` as today (lines joined, only-marks lines dropped, the page's confidence), and `tsv_words(tsv) -> Vec<Vec<Word>>` (the same paragraphs and the same lines dropped, each paragraph its words in order, `line: true` on the first word of each line). `try_page` fills `Tried.paragraphs` from `tsv_words` with the places scaled by `tried.scale`, each word's text composed (NFC) and, where Greek is among the page's languages, its sigmas mended; `words` the count; `unsure` the count under `UNSURE`. `Tried.paragraphs` are not joined at hyphens: a trial shows what was read, as it was read.

A4. **A picture tried.** `try_page` with a path that `is_picture`: the bytes read, drawn as `read_picture` draws them (`Drawn::of_picture(..).as_asked(quality)`), read in this process with `reader.with`, the TSV made into `Tried` as above, the picture shrunk so that its longer side is at most 1600 (the same shrinking as `try_here`), the blocks and the words scaled to it. `ocr_try` needs no change for it.

A5. **The kept reading.** `src-tauri/src/state.rs`: `AppState.reading: Mutex<Option<KeptReading>>` with `KeptReading { token: String, file: String, title: String, read: ocr::ReadPdf }`; one at a time, a new reading replacing the old. `ocr_read`, for a PDF, assembles `imported_pdf(&file, &title, &read, Making::default())` (shape kept, by headings, page marks on), keeps the reading under a fresh token, and returns `ReadDone { imported, kept: Some(token) }`; for a picture, `kept: None`. `ocr_assemble(kept, making)` assembles from the kept reading, or `Error::not_found(tr!("ocr-reading-gone"))` where the token is not the one kept. `ocr_forget(kept)` drops it where it is the one kept. `imported_pdf` with `making.shape == false` takes the pages' `paragraphs` and ignores their `pieces`, as it does today where no shape was kept; `ReadPdf` must therefore carry both, as it does. The remark `ocr-no-headings` is pushed only where `making.structure == Headings`.

A6. **Tests** (`crates/core/src/ocr/tests.rs`, passed over where Tesseract or the language is not installed, as the tests there do): a two-page fixture with text on page 1 and none on page 2, read with `read: Some(vec![1, 2])`, has both pages `read: true`; with `read: Some(vec![])`, page 2 is read all the same and page 1 taken; with a stretch `{ from: 2, dpi: 600, … }`, `Reader::quality_at(1).dpi == 600` and `quality_at(0)` is the whole's. `tsv_words` on the TSV sample of `text.rs`'s tests: the words in order, their confidences, `line` on the first of each line, and a line that is only marks left out. `lay_over` with `strip = [index]` on a two-page PDF that has text on both leaves the other page's text in place (extend the existing searchable test). `imported_pdf` with `shape: false` makes a section per page of plain paragraphs; with `structure: Pages` a section per page; with `Headings` on the headed fixture a tree. `try_page` on a PNG fixture (`fixture.rs` has pictures of text; else make one with the same means) gives words and a PNG.

A7. **Checks**, `contract` regenerated (the fixtures change again), commit in the worktree.

## Stage B — the plan of the pages and the strip (agent B)

B1. **`src/lib/ocr/plan.ts`**, pure, tested in `plan.test.ts`:

```ts
export type Source = 'pdf' | 'read';
export interface PageSettings { languages: string[]; dpi: number; layout: Layout; contrast: boolean }
export interface PagePlan extends PageSettings { source: Source }
/** The plan at first: `source` for the pages whose verdict is not none, `read` for the rest, all with `settings`. */
export function firstPlan(verdicts: Verdict[], settings: PageSettings, source: Source): PagePlan[];
/** The plan with `change` laid on the pages given (counted from one; every page where none are). */
export function withSettings(plan: PagePlan[], pages: number[], change: Partial<PageSettings>): PagePlan[];
/** The plan with the source of the pages given set; `pdf` is not laid on a page whose verdict is none. */
export function withSource(plan: PagePlan[], pages: number[], source: Source, verdicts: Verdict[]): PagePlan[];
/** The pages given decided by their verdicts: sound takes the PDF's text, the rest are read. */
export function decided(plan: PagePlan[], pages: number[], verdicts: Verdict[]): PagePlan[];
/** Whether two settings are the same; 0 and 300 dots are the same resolution. */
export function sameSettings(a: PageSettings, b: PageSettings): boolean;
/** A run of pages in a row with the same settings, counted from one, both ends in. */
export interface Run { from: number; to: number; settings: PageSettings }
export function runsOf(plan: PagePlan[]): Run[];
/** What is asked of a reading: the first run as the whole's settings, the others as stretches, the pages read as `read`. */
export function askedOf(plan: PagePlan[], text: 'keep' | 'translate', shape: boolean): Asked;
/** How many pages take the PDF's text, and how many are read. */
export function counted(plan: PagePlan[]): { pdf: number; read: number };
export function settingsAt(plan: PagePlan[], page: number): PageSettings;
/** Whether the pages given (every page where none) have one and the same settings. */
export function sameAcross(plan: PagePlan[], pages: number[]): boolean;
```

`askedOf` always gives `read` (the pages whose source is `read`), so that the core never falls back on `text` for the pages. Where the plan is empty (a picture), `askedOf` gives the settings given and `read: null`.

B2. **`src/lib/ocr/select.ts`**, pure, tested: `toggled(selection, page)`, `rangeBetween(anchor, page)` (both ends in, ascending), `pagesOfRun(run)`, `pagesOfPart(outline, index, pages)` (from the part's page to the page before the next part's, or the end), `selectionSaid(selection, pages, t)` → `''` where empty or every page (the caller says *all 559 pages*), *page 280*, or *pages 3–5, 9* through `stretchesOf` of `how.ts`. `moved` of `strip.ts` stays for the keys.

B3. **`PageStrip.svelte`** reworked, lazy drawing kept as it is:

```ts
interface Props {
  path: string; stored: boolean; pages: number;
  plan: PagePlan[]; verdicts: Verdict[]; outline: OutlinePart[];
  /** The pages selected, counted from one; empty for every page. */
  selection: number[];
  /** The page in view. */
  inView: number;
  onview: (page: number) => void;
  onselect: (selection: number[]) => void;
  /** The name of a language, for the bands of the stretches. */
  nameOf: (code: string) => string;
}
```

Each page: its small picture, its number, a badge in its corner saying its source (`data-strip-source="pdf|read"`, the words *PDF* and *Read*, as icons where the words do not fit: a page with lines for the PDF's text, an eye for reading; a tooltip in words), tinted gold where the verdict is `poor` (`data-strip-verdict="poor"`), and `aria-selected` where it is in the selection, `data-strip-view="true"` where it is the page in view. Over the row of pages, where `runsOf(plan).length > 1`, a band per run (`data-strip-stretch="{from}"`, labelled with the languages' names, the resolution where it is not 300, the layout where it is told, and *B/W*), clicking it selects its pages. Under the row, where the outline has parts, a tick per part under its page (`data-strip-part="{page}"`, the title as tooltip and as a label where there is room), clicking it selects the part's pages. A click on a page brings it into view and makes it the selection alone; Shift-click selects the range from the last page clicked without Shift (the anchor) to it; Ctrl-click or Cmd-click toggles the page in the selection (the page in view does not change). The arrow keys move the page in view, and the selection with it unless Shift is held, which extends it from the anchor; Ctrl+A or Cmd+A in the strip selects every page (an empty selection). The strip is at most 170 pixels high with the bands and the ticks.

B4. **`PagesBar.svelte`**: the line over the strip. Props: `looked: Looked`, `plan: PagePlan[]`, `selection: number[]`, `canRead: boolean` (Tesseract is installed), `onsource: (source: Source) => void`, `ondecide: () => void`, `onall: () => void`. It shows the sentence (`data-pages-said`): *412 pages take the text the PDF has; 147 are read with Tesseract.*, with its variants (all one way; a picture; Tesseract not installed, where the pages without text *cannot be read*); the low-resolution warning as today where it applies; the selection said (`data-pages-scope`): *For all 559 pages* or *For pages 39–120* with a small *All pages* link (`data-pages-all`) where a selection stands; and three small buttons: *The PDF's text* (`data-pages-pdf`, disabled where no page of the selection has a verdict other than none), *Read with Tesseract* (`data-pages-read`, disabled where `!canRead`), *Decide by the text's quality* (`data-pages-decide`, disabled where the file has no text or `!canRead`).

B5. **Words**: its keys at the end of `locales/en/ocr.ftl` and `locales/nb/ocr.ftl`. **Checks**, commit in the worktree.

## Stage C — the panes, the settings column and the trials (agent C)

C1. **`src/lib/ocr/trials.ts`**, pure, tested: `UNSURE = 70`; `interface Trial { settings: PageSettings; tried: Tried; at: number }`; `remembered(trials: Trial[], trial: Trial, most = 6): Trial[]` (the newest first, the oldest dropped past `most`); `settingsSaid(settings, nameOf, t): string` → *Fraktur, Danish and Norwegian · 300 · as Tesseract judges*, the layout left out where it is as Tesseract judges and *B/W* added where black and white; `isUnsure(word: TriedWord): boolean`; `paragraphText(paragraph: TriedWord[]): string` (the words joined with spaces, a line's first word after a space too: the pane does not keep the line breaks). Import `PageSettings` from `./plan` as stage B defines it; until the merge, declare the same four fields in a `plan.ts` of your own with only that interface, which the merge replaces.

C2. **`ReadSettings.svelte`**: the column. Props: `value: PageSettings`, `scope: string` (the line over the controls, given in words), `installed: string[]` (Tesseract's languages), `page: number`, `trying: boolean`, `canTry: boolean`, `missing: boolean` (Tesseract is not installed: the controls are shown disabled under the failure line `ocr-no-tesseract`), `onchange: (settings: PageSettings) => void`, `ontry: () => void`. Inside: the scope line (`data-settings-scope`), `LanguagePicker` as today with its hints, the scripts-alike warning of `how.ts`, `HowControls` inline without its hint, and the button *Try page 280* (`data-ocr-try`, with the spinner while trying). The column is 260 pixels wide and scrolls on its own where it must.

C3. **`PicturePane.svelte`**: the picture of the page in view. Props: `picture: string | null` (a data URL), `width: number`, `height: number`, `label: string`, `blocks: TextBlock[]`, `unsure: TriedWord[]` (the unsure words of the trial shown, to be marked faintly under them), `loading: boolean`, `failure: string | null`. A zoom as a segmented control, *Fit*, *100 %*, *200 %* (`data-picture-zoom`), the pane scrolling in both directions past Fit; the blocks drawn as today under a checkbox (`data-ocr-tried-show-blocks`, `data-ocr-tried-blocks`), with the numbers readable at Fit (at least 11 pixels on the screen: compute the font size from the shown width, not the picture's); the unsure words as faint rectangles (`data-unsure-marks`).

C4. **`PdfTextPane.svelte`**: the text the PDF has for the page in view. Props: `page: PageTextView | null`, `loading: boolean`, `failure: string | null`, `verdict: Verdict`, `translated: boolean`, `canTranslate: boolean` (a scheme applies in the file), `ontranslated: (on: boolean) => void`, `canUse: boolean`, `onuse: () => void`, `scope: string`. The header: *The text the PDF has*, a switch *Translated by what the fonts say* where `canTranslate` (`data-text-translated`), and the button *Use for {scope}* (`data-pane-use-pdf`: *Use for this page*, *Use for pages 3–5*, *Use for all pages*), disabled where `!canUse`. A line with the verdict (`data-text-verdict`): *Reads as text* or *Does not read as text: letters of a font that does not say which they are, or a poor reading*. The lines as `TextPreview` shows a page today (translated where the switch is on and the page has a translation); *No text on this page* where it has none.

C5. **`TesseractPane.svelte`** with **`Trials.svelte`**: what Tesseract read. Props: `shown: Trial | null`, `trials: Trial[]`, `trying: boolean`, `failure: string | null`, `current: PageSettings` (what holds for the page now), `nameOf`, `canUse: boolean`, `onuse: () => void`, `onshow: (trial: Trial) => void`, `onsettings: (settings: PageSettings) => void`, `scope: string`. The header: *What Tesseract read* and *Use for {scope}* (`data-pane-use-read`). The body: while trying, the spinner with *Reading page 280…*; a failure as today; the hint *Press Try to read this page with the settings beside* where nothing was tried; else the verdict line as today (`data-ocr-tried-confidence`, `data-poorly`, the words of `ocr-tried-poorly` where poor), the count *14 of 312 words unsure* (`data-unsure`), and the paragraphs (`data-ocr-tried-text`), each word under `UNSURE` wrapped in `<mark data-unsure-word>` with its confidence as a tooltip. Under the body, `Trials`: a list of the page's trials (`data-trial="{n}"`, the newest first), each a row with `settingsSaid` and the confidence, `aria-selected` on the one shown, a faint *not what holds for the page now* where its settings differ from `current`, and a small button *Use these settings* (`data-trial-use`) that calls `onsettings`. Clicking a row calls `onshow`.

C6. **`PagePanes.svelte`**: the three panes in a grid that fills the height given and lets each pane scroll on its own: `minmax(0, 1fr)` each, the picture first; two panes where `hasPdfText` is false (a scan with no text anywhere, or a picture). Props: the union of the panes' props, plus `hasPdfText: boolean`. Keep the panes dumb: no calls to the backend in stage C; the main session's `Workbench` fetches and passes.

C7. **Words** at the end of `locales/en/ocr.ftl` and `locales/nb/ocr.ftl`. **Checks**, commit in the worktree.

## Stage M — the workbench, the dialogs, the step after the reading, words, guide, e2e (main session)

M1. **`Workbench.svelte`**. Props: `path`, `stored`, `looked: Looked`, `mode: 'tree' | 'searchable'`, and a bindable `state` the dialog reads: `{ asked: Asked; canRead: boolean; label: string }` (the footer's action). It owns: `plan` (from `firstPlan(looked.verdicts, howFromSettings() with reader.first(...) as languages, firstSource(looked))`, where `firstSource` is `anewAtFirst(looked) && !lowResolution(looked) ? 'read' : 'pdf'`, `how.ts`), `selection: number[]`, `inView` (the first page whose source is `read`, else 1), `translated` (on where `looked.schemes.length > 0`), `trials: Map<number, Trial[]>`, `shownTrial` per page, `trying`, the caches of the page's PDF text (`ocrText(path, stored, page - 1, 1)`, at most 40 pages kept) and of the page's picture (`ocrPages(path, stored, page - 1, 1, 800)`, at most 10 kept; where the page has a trial shown, the trial's picture is shown instead). It lays out: `PagesBar`, `PageStrip`, then a row of `PagePanes` and `ReadSettings` (`grid-template-columns: minmax(0, 1fr) 260px`), the row taking the height left (`flex: 1; min-height: 0`). Trying: `ocrTry(path, stored, inView, askedOf(plan, …), ticket)`, the result remembered under the page with the settings used, shown, the earlier trial's ticket stopped as `TryPane` stops it. The actions: `onsource` → `withSource(plan, selection, source, verdicts)`; `ondecide` → `decided`; the settings column's `onchange` → `withSettings(plan, selection, change)`; a trial's `onsettings` → `withSettings(plan, selection, settings)`. A picture file (`looked.picture`): no `PagesBar` strip, two panes, `plan` empty, the settings held in a `PageSettings` of their own. The label of the action: `ocr-read-pages` (*Read 147 pages*) where any page is read, `ocr-take-text` (*Take the text*) where none; in the searchable mode `ocr-searchable-make` or `ocr-searchable-make-readable` as today; `canRead` as `readable`/`ready` are today, with `plan` in place of `text`.

M2. **The dialogs.** `ReadStep.svelte` keeps its phases (looking, reading, failed) and mounts `Workbench` in `asking`; it exposes the footer's action through a bindable prop `action: { label: string; enabled: boolean; run: () => void } | null`, which `DocumentDialog` and `PdfMapDialog` render as the primary button of their footer (`data-ocr-read`) while the step is asking, in place of *Bring it in* / *Make the map* disabled. `SearchableDialog` mounts `Workbench` in its asking phase and keeps its footer (`data-ocr-make`). All three dialogs are `width={1240}` and `tall` while the workbench is shown, their body without padding around it (`padded={false}` if `Dialog` has it, else a class), so that the strip and the panes use the height; the workbench's own padding is 16 pixels. The `wide` prop of `ReadStep` becomes `showing: boolean`.

M3. **The step after the reading: `MadeOf.svelte`.** Props: `kept: string`, `making: Making` (bindable), `onmade: (imported: Imported) => void`. Three controls in one group: *Keep the shape of the pages* (`data-made-shape`), *By its headings* / *By its pages* (`data-made-structure`), *Mark where each page begins* (`data-made-page-marks`), with the hints of today's keys (`ocr-shape`, `ocr-shape-hint`, `ocr-structure*`, `ocr-page-marks*`), each change calling `ocrAssemble(kept, making)` and `onmade` with the result (a spinner on the group while it works; a failure as a toast, the controls back to what they were). `DocumentDialog` and `PdfMapDialog` mount it over `Outline` where `done.kept` is set, replace `read` by what comes back (the title field is left as the writer has it), and call `ocrForget(kept)` when they close. `PdfMapDialog` shows the step after the reading for every PDF of more than one page, not only where styles or a structure were found.

M4. **Removed**: `TryPane.svelte`, `Stretches.svelte`, `stretches.ts` and its test, `HowDisclosure.svelte`, `TextPart.svelte`, `TextPreview.svelte`; `firstPageToTry` and `firstTextChoice` of `how.ts` (replaced by `firstSource` and the translation switch), their tests with them. `HowControls.svelte` stays for the settings page and the column.

M5. **Words**: the new keys in `locales/en/ocr.ftl` and `locales/nb/ocr.ftl` where B and C did not write them; the keys no longer used removed from every locale (`ocr-view-*`, `ocr-try-hint`, `ocr-try-page`, `ocr-try-of`, `ocr-tried-changed`, `ocr-stretch*`, `ocr-stretches*`, `ocr-strip-begin`, `ocr-text-title`, `ocr-text-keep*`, `ocr-text-anew*`, `ocr-text-translate`, `ocr-text-translate-hint`, `ocr-about-*` as far as the sentence of `PagesBar` replaces them; check each with `grep` before removing). The other locales get the new keys from the translation brief, not here; say so.

M6. **The guide**, "Text in scans and pictures": *Trying a page* and *Stretches* rewritten for the workbench (the pages, the three panes, the settings that hold for the pages selected, the trials kept, the unsure words); a paragraph *Which pages take which text* (the two sources, the three actions, the start all one way); *What is made of it* moved to after the reading, with the shape, the tree and the page marks. The bullet on how a PDF becomes a tree says the choices are made after the reading.

M7. **`e2e/ocr.mjs`**, the parts that drive the dialog rewritten; the fixtures stay. With the scanned two-page fixture: the workbench shows (`[data-workbench]`), the sentence says both pages are read, the strip has two pages marked `read`, page 1 in view; press Try, wait for `[data-ocr-tried-confidence]` ≥ 80, `[data-unsure]` present, one `[data-trial]`; set the resolution to 400 and Try again: two trials, the newest selected; click the older: it is shown; click page 2 in the strip: the scope line says *page 2*; add a language: the strip shows two stretch bands (`[data-strip-stretch="1"]`, `[data-strip-stretch="2"]`); click *All pages*; read through the footer's `[data-ocr-read]`; after the reading, `[data-made-structure]` is there: choose *By its pages* and check the parts count changes without a reading phase; screenshots `ocr-1-workbench`, `ocr-1b-tried`, `ocr-1b-tried-dark`, `ocr-1c-stretches`, `ocr-2-made`. With the fixture whose text is poor (`junk`): the sentence says the page is read; *The PDF's text* is offered and the pane shows the junk; *Decide by the text's quality* leaves it read. With the fixture that has text and Tesseract installed: both text panes stand side by side for page 1 (`[data-pane-pdf]`, `[data-pane-tesseract]`), the PDF's text of page 1 shown; *Read with Tesseract* on the selection marks the page `read`; Try works without changing anything first. The Greek fixture: the translation switch on, the pane translated. The searchable dialog: the same workbench, made with the pages marked; the notice as today. The Greek-read-as-English part and the stopped reading stay as they are, with the new selectors. Dark screenshots of the workbench and of the step after the reading.

M8. **Checks**, the e2e scripts `ocr.mjs`, `documents.mjs` and `library.mjs` green, commit. Report.

## Open choices, decided here so that nobody has to ask

- `UNSURE` is 70, one constant in the core and one in `trials.ts`, both named so; the core counts, the interface underlines.
- At most six trials per page are kept, the oldest dropped; nothing is kept between openings of the dialog.
- The picture of a page that has not been tried is drawn 800 dots wide through `ocrPages`; a tried page shows Tesseract's picture.
- The dialog is 1240 pixels wide at most, and tall; the strip at most 170 pixels high.
- A selection is a list of page numbers, not ranges; a long book selected whole is the empty list.
- The settings column shows the settings of the page in view; a change holds for the pages selected, and where their settings differed before, the scope line says *settings differ* until they are set.
- `Asked.text` keeps `anew` for callers that give no `read`; the workbench never sends it.
- The text of a picture of the store (`PictureTextDialog` by hash) keeps its small dialog as it is; a picture file brought in gets the workbench.
- `Looked.withText`, `poor`, `firstWithoutText` and `sample` stay in the contract this round, even where `verdicts` could replace them.
