# Build plan: a reading says how well it went

The working plan for `docs/adr/0060-a-reading-says-how-well-it-went.md`. Read the record first, in full: it says what; this says how, in which order, in which files, with which interfaces, and how each stage is verified. Where they disagree, the record wins; say so in your report. Read also `docs/adr/0018-text-read-from-pdfs-and-pictures.md` with its addenda, and `docs/plans/the-text-a-pdf-has.md`, whose dialog this plan extends.

## How to work

Nobody answers questions while you work. Where this plan leaves a choice open, choose the plainer thing, write the choice down in your report, and go on.

- **Plain words**, as the code around you: comments, commit messages, the guide, the words of the interface. Never a record number when writing for the owner.
- **Stages end in commits.** A stage is committed when its checks pass, without asking; never push; never start the Installers workflow or make a tag. End every commit message with the attribution line the session gives you. Do not touch other projects or folders outside this repository, except the folder of PDFs named under *Evidence*.
- **Checks**: `pnpm check`, `pnpm test`, `cargo test -p glaukopis-core`, `cargo test -p glaukopis contract` (writes `src/lib/api/contract.generated.ts`; run after any change of a core type the interface sees), `node scripts/check-templates.mjs`. Paste the counts into your report.
- **Edit, then format**: `pnpm exec prettier --write <files under src>`; `cargo fmt -p glaukopis-core` (it may reformat `crates/core/build.rs`; put that back with `git checkout crates/core/build.rs`). The scripts in `e2e/` are not formatted by prettier.
- **e2e**: `pnpm e2e:build`, then one script at a time, `timeout 400 node e2e/<name>.mjs > /tmp/<name>.log 2>&1`, and read the log and the screenshots in `e2e/output/`. A hang is a loop in the page: end your own processes by PID (`ps -eo pid,comm | grep -E 'Xvfb|WebKitWebDriver|glaukopis'`), never `pkill -f`. Nothing touches the owner's desktop; never drive the owner's own windows.
- **Agents**: the stages that touch different files run in worktree agents at the same time (below). Every agent commits in its worktree when a step is whole, and at least once an hour, so that nothing is lost to a disconnect; an agent is never stopped with uncommitted work. The main session merges the worktrees into `main` and resolves what conflicts.
- **The editor's extension host** on this computer grows by the minute; it may be killed before a long build.
- **Report** at the end: what was built, with paths; the DOM of the new parts of the dialog (classes and data attributes, for the scripts that come later); what was left or doubtful; every departure from the record; the counts, verbatim.

## Evidence

`.claude/briefs/ocr-quality/bench/` holds the scores of the bench the record rests on, and the texts of the telling pages. The PDFs themselves are in `/home/proteus/glaukopis-pdfer/`, placed there by the owner for this work: use them only to try the reading by hand (the thresholds, the Fraktur model, the resolution of the 72 dpi book, the strip on a 559-page file), never as fixtures of the tests, and read nothing else outside the repository. The Fraktur model (`deu_latf.traineddata`, 12 MB) is not kept in the repository: fetch it as the packaging script does, from `tessdata_best`, into `packaging/build/languages/`, which is not in git, and give it to Tesseract with `--tessdata-dir` when trying by hand.

## Vocabulary

- *Confidence*: Tesseract's number beside each word, 0 to 100; a page's confidence is the mean over its words. In code `confidence`.
- *Read poorly*: a page whose confidence is under `POORLY = 80.0` (a constant in `ocr/mod.rs`, with the bench's numbers in its comment).
- *Resolution*: the dots to the inch of the picture a scanned page is, as the look tells it. `Looked.resolution`.
- *Trying a page*: reading one page with the current choices, and showing the picture and the text. `ocr_try`, `Tried`.
- *Stretch*: a run of pages with its own languages and layout. `Asked.stretches`, `Stretch`.
- *The strip*: the small pictures of all pages in the dialog. `PageStrip.svelte`, `ocr_pages`.
- *Blocks*: Tesseract's level-2 rows of the TSV, as rectangles on the tried page. `Tried.blocks`.

## The shape of the work

Six stages. Stages 1, 2, 4 and 5 are the main session's, in order, since they all touch `crates/core/src/ocr/mod.rs`, `child.rs` and `ReadStep.svelte`. Stage 3 touches other files and runs in a worktree agent from the start; the strip's drawing (the first half of stage 4) runs in a second worktree agent from the start, against the interface this plan fixes, and is mounted by the main session.

| Who | Stages | Touches |
| --- | --- | --- |
| Main session | 1 confidence and resolution → 2 trying a page → merges → 4b stretches and the strip mounted → 5 blocks → 6 words, guide, e2e | `crates/core/src/ocr/{mod,child,text,layer,searchable}.rs`, `src-tauri/src/commands/ocr.rs`, `src/lib/api/ocr.ts`, `src/lib/ocr/{ReadStep,SearchableDialog,HowDisclosure,TextPart}.svelte`, `src/lib/ocr/TryPane.svelte` (new), `src/lib/documents/DocumentDialog.svelte`, `locales/en/{ocr,core-ocr}.ftl`, `locales/nb/…`, `docs/guide.md`, `e2e/ocr.mjs` |
| Agent B (worktree) | 3 the Fraktur model | `scripts/make-language-packages.py`, `src/lib/ocr/languages.ts` (+ test), `src/lib/ocr/LanguagePicker.svelte`, `locales/en/ocr.ftl` (its own keys, at the end), `locales/nb/ocr.ftl`, `docs/language-packages.md` |
| Agent C (worktree) | 4a the strip drawn | `crates/core/src/ocr/child.rs` (one new task variant and its arm only), `crates/core/src/ocr/mod.rs` (one new function at the end: `pages_pictures`), `src-tauri/src/commands/ocr.rs` (`ocr_pages`), `src/lib/api/ocr.ts` (`ocrPages`), `src/lib/ocr/PageStrip.svelte` (new, + `strip.ts` and its test), `locales/en/ocr.ftl` (its own keys, at the end) |

Order of merging: B and C after stage 2. Conflicts with C will be in `child.rs` and `mod.rs`, both additive; take both sides.

## Stage 1 — confidence kept and told; the resolution of scanned pages

**Confidence.** `text::tsv_paragraphs` already sums the confidences of each line's words and throws the sums away after `only_marks`. Keep them: `Line` gains `confidence: Option<f32>` (serde default, so that lines that cross the child boundary and lines of the text a PDF has, which have none, stay as they are). `read_page` in `mod.rs` keeps it through the scaling. `PageText` gains `confidence: Option<f32>`: the mean over the words of the page's lines, weighted by the words (keep a word count on `Line` as well, `words: u32`, or compute the mean of lines; say which in the report, the weighted one is truer). `ReadPdf` gains `poorly: Vec<usize>`, the pages read poorly, counted from one, and the remark `ocr-remark-poorly` (`core-ocr.ftl`): "{count} of them read poorly: pages {pages}", the pages as stretches ("3–42, 57"; a helper `stretches_of(&[usize]) -> String` in `mod.rs`, tested). Where every page read with Latin-script models only (`scriptsAlike`'s table is in the interface; in the core, a model is Latin-script unless it is `grc`, `ell`, `rus`, …, or `script/…`: keep a small list `LATIN_SCRIPT_UNLESS` and say so) was read poorly, a second remark `ocr-remark-fraktur`: "Books in Gothic type are read with the Fraktur model." The log: `tracing::info!` gains `poorly`.

The same for a PDF made searchable: `child::Made` gains `poorly: Vec<usize>` (the child has the TSV; compute there with the same helper, moved to `text.rs` as `page_confidence(tsv) -> Option<f32>`), `ocr::Searchable` and `MadeSearchable` carry it, and `SearchableDialog.svelte` says it in its result beside the counts.

A picture of the store (`read_picture`): its paragraphs are returned without confidence today; leave it, say so.

**Resolution.** In the look (`child::look_here` → `layer::read`), for each page, the largest image XObject among the page's resources (`Subtype /Image`, `Width`, `Height`; through `lopdf`, as `layer.rs` already walks the pages; form XObjects not followed, say so), and its dots to the inch: `width / (page width in points / 72)`, with the page's size as the layer already keeps it (`Layer.sizes`). `Layer` gains `resolutions: Vec<Option<u32>>`; `Looked` gains `resolution: Option<u32>`, the median over the pages that are pictures, nothing where fewer than half the pages are. `ReadStep.svelte`'s `about` text gains a sentence where `resolution < 150`: `ocr-about-low-resolution` ("The pages are pictures at {dpi} dots to the inch: too few to read well, whatever is chosen."), and `firstTextChoice` keeps the text the PDF has in that case rather than proposing to read anew. Do not refuse to read; say.

**Tests** (`crates/core/src/ocr/tests.rs`, fixtures from `fixture.rs`, passed over where Tesseract or the language is not installed, as the tests there do): the scanned English fixture read with `eng` has every page's confidence over 80 and `poorly` empty; read with `grc` alone (installed on this computer) has `poorly` holding every page, and both remarks. A fixture made from a picture 600 dots wide on a page 8.3 inches wide looks as 72 dots to the inch; the Typst-made scans look as what Typst draws them at. `stretches_of(&[3,4,5,9]) == "3–5, 9"`.

**Checks**: the five commands; `contract` regenerated. Commit.

## Stage 2 — trying a page

**Core.** `child::Task::Try { page: usize }` (counted from nought): the page drawn as the job's quality asks, read with the job's `With`, and returned as `child::Done::Tried(Tried)` with `tsv: String`, `dpi: u32`, `picture: Vec<u8>` (PNG, grey, the drawn page shrunk so that its longer side is at most 1600 dots, by `image`'s `resize` with the triangle filter; the shrinking factor returned as `scale: f32` so that the TSV's places can be laid on the picture), `width`, `height`. `ocr::try_page(path, tools, work, asked, page, stop) -> Result<Tried>` where `ocr::Tried { paragraphs: Vec<String>, confidence: Option<f32>, picture: Vec<u8>, width: u32, height: u32, blocks: Vec<Block> }`; `blocks` are filled in stage 5 and empty here. The paragraphs as `read_pdf` makes them without the shape (`text::page_paragraphs`, sigmas mended where Greek is among the languages). The page's stretch, when stage 4 is in, chooses the `With`; until then the job's.

**Command and API.** `ocr_try(path, stored, page, asked, ticket) -> TriedView { paragraphs, confidence, picture: String (a `data:image/png;base64,` URL), width, height, blocks }` in `commands/ocr.rs`; `ocrTry` in `api/ocr.ts`. It runs under the same work registry as a reading (`Work::begin(ticket)`), so that leaving the dialog stops it.

**Interface.** `src/lib/ocr/TryPane.svelte`: a page field (`<input type="number">`, `data-ocr-try-page`, from 1 to `looked.pages`, at first the first page Tesseract is to read: the first without text, or 1 when all are read anew), a button *Try* (`data-ocr-try`), and, once tried, the picture (`<img data-ocr-tried-picture>`) beside the text (`data-ocr-tried-text`, the paragraphs as `TextPreview` shows pages) with a line *Read with a confidence of {confidence}* (`data-ocr-tried-confidence`), coloured as the warnings are where under 80, with the words `ocr-tried-poorly`: "read poorly: try another language, the Fraktur model for Gothic type, or another layout". While trying, a spinner; a failure shown in the pane, never swallowed. Mounted in `ReadStep.svelte` under the language picker and the disclosure of settings, only where `scanning && reader.installed` and the file is not a picture; it takes the right-hand column of the split (`wide` becomes true whenever the pane is there), above or in place of `TextPreview`: show the preview of the text the PDF has until a page has been tried, then the trial, with a small link back (`ocr-tried-show-text`). The same pane in `SearchableDialog.svelte`, which has the same picker and disclosure. The trial reads with `chosen` and `how` as they stand at the press, nothing else.

**Tests**: core: `try_page` on the English fixture gives paragraphs holding the fixture's words, a confidence over 80, and a PNG (`picture` begins with the PNG signature) whose longer side is at most 1600. Interface: `TryPane` has no logic worth a unit test beyond the first page proposed: `firstPageToTry(looked, text)` in `how.ts`, tested.

**Checks** and commit.

## Stage 3 — the Fraktur model (agent B)

- `scripts/make-language-packages.py`: `OCR` gains `("deu_latf", "de", "Fraktur")`; the manifest's `title` is "Fraktur (gotisk skrift)" in Norwegian or "Fraktur (Gothic type)"? The title is in the package's own language per `docs/language-packages.md`; a model of type has none: use "Fraktur". Run the script with `--fetch` into `packaging/build/languages` and check that `out/index.json` gains the package and the zip is made; `e2e/language-packages.mjs` tries it. Say in the report that the owner uploads `out/` by hand.
- `languages.ts`: `ocrLanguageName('deu_latf')` becomes `t('ocr-language-fraktur-model')` = "Fraktur (Gothic type)", not "German (Fraktur)"; `frk` and `*_frak` the same with the language named after, since those are older models. `byName` sorts it under F. Tests in `languages.test.ts`.
- `LanguagePicker.svelte`: where `deu_latf` (or `frk`, `script/Fraktur`) is installed, a hint under the list (`ocr-languages-fraktur-hint`): "Books in Gothic type, as Norwegian, Danish, Swedish and German ones often were before about 1900, are read with the Fraktur model, chosen first or alone, whatever their language." Where it is not installed, nothing: the settings' page of languages is where models are installed.
- `docs/language-packages.md`: a line that models of type are packages like any other, under the language they were trained on, with the title saying what they are.
- `locales/nb/ocr.ftl` for the new keys; the other locales are left to the translation brief, say so.

Commit in the worktree.

## Stage 4a — the strip drawn (agent C)

- `child::Task::Pictures { from: usize, count: usize, width: u32 }`: pages `from..from+count` (counted from nought, clipped to the file) drawn by hayro at the dots to the inch that make them `width` dots wide (`drawing::draw_with_hayro` with a `Quality` whose `dpi` is computed from the page's width: add `Quality::for_width(points, width)`; Poppler where hayro cannot, with `-scale-to`), as PNG grey bytes; `Done::Pictures(Vec<(usize, Result<Vec<u8>, String>)>)`. A page that cannot be drawn is an error of that page alone.
- `ocr::pages_pictures(path, tools, work, from, count, width, stop) -> Result<Vec<(usize, Result<Vec<u8>, String>)>>` at the end of `mod.rs`.
- `ocr_pages(path, stored, from, count, width, ticket) -> Vec<PagePicture { number, picture: Option<String> (data URL), failed: Option<String> }>` in `commands/ocr.rs`; `ocrPages` in `api/ocr.ts`.
- `src/lib/ocr/PageStrip.svelte`: props `path`, `stored`, `pages`, `marks: Map<number, string>` (a page number → a short label drawn in its corner: a stretch's beginning, in 4b), `selected: number | null`, `onselect(page)`, `onbegin(page)` (the writer asks to begin a stretch here; 4b). Draws 40 pages at a time as scrolled (as `TextPreview` fetches text), 120 dots wide, each with its number under it (`data-strip-page="{n}"`), the selected one outlined, a page not drawn showing its failure in words. `strip.ts`: `nextBatch(shown, total)` and the dots-per-inch arithmetic, tested.
- Not mounted anywhere by the agent; the main session mounts it in 4b.

Commit in the worktree.

## Stage 4b — stretches, and the strip mounted (main session)

- `Asked` gains `stretches: Vec<Stretch>` with `Stretch { from: usize (counted from one), languages: Vec<String>, layout: String }`; empty means one stretch, the whole file, with `Asked.languages` and `Asked.layout`. `ready(tools, asked)` checks the languages of every stretch as it checks `asked.languages`. `child::Job` gains `stretches: Vec<(usize, tesseract::With)>` (from, counted from nought); `read_pages` picks for page `i` the last stretch whose `from <= i`, else the job's `With`. `try_page` picks the same for the page tried.
- `ReadStep.svelte`: the strip mounted under the choices, full width (the split becomes rows: choices and the try pane above, the strip below; keep it under 200 px high, scrolling sideways). Selecting a page sets the page of the try pane. *Begin a stretch here* on the selected page (`data-ocr-begin-stretch`) makes a stretch from that page with the languages and layout as chosen now; the stretches are listed over the strip as chips (`data-ocr-stretch="{from}"`: "From page 39: Greek, English · as it judges"), the current one highlighted; choosing a chip makes the picker and the layout edit that stretch; a chip can be removed (the pages fall to the stretch before). The first stretch is the file's own choices and cannot be removed. Where `looked` has an outline (`Looked` gains `outline: Vec<{ title, page }>` of the top level, from `Layer.outline`), the chips row offers *Begin at the outline's parts* (`data-ocr-stretches-outline`), which makes a stretch at each top entry's page, all with the current choices, for the writer to adjust.
- `SearchableDialog.svelte`: the same strip and stretches (one component, `Stretches.svelte`, holding the chips and the editing; `ReadStep` and `SearchableDialog` both mount it with the strip).
- `how.ts`: `stretchOf(stretches, page)` and `withStretch(stretches, from, choices)`, tested.

**Tests**: core: a two-page fixture read with a stretch from page 2 in `grc` has page 1 read well and page 2 poorly (or the reverse). `ready` refuses a stretch with a language not installed, with the message naming it.

Commit.

## Stage 5 — blocks on the tried page

`child::Tried` keeps the TSV; `ocr::try_page` reads its level-2 rows (`text::tsv_blocks(tsv) -> Vec<Block { left, top, width, height }>`, in the TSV's dots), scales them by `scale`, and `Tried.blocks` carries them. `TryPane.svelte` draws them as an SVG over the picture (`<svg data-ocr-tried-blocks>` with a `<rect>` per block, thin lines in the accent colour, numbered in reading order). `tsv_blocks` tested on the TSV sample in `text.rs`'s tests.

Commit.

## Stage 6 — words, the guide, e2e, cleanup

- Every new key in `locales/en` and `locales/nb`; `pnpm check` finds keys missing in one and not the other where the check covers it; else `grep`.
- `docs/guide.md`, "Text in scans and pictures": a paragraph *How well it went* (the confidence, pages read poorly, what to do: another language, the Fraktur model, another layout; the resolution of a scan and what cannot be helped), *Trying a page* (the pane, the picture and the blocks), *Stretches* (when a book changes language or type part way), and under *Languages* the Fraktur model.
- `e2e/ocr.mjs`: with the scanned fixture, try a page (press *Try*, wait for `[data-ocr-tried-confidence]`, read its number, screenshot), the strip drawn (`[data-strip-page="1"]` has an image), a stretch begun at page 2 and its chip shown, the reading done and its remarks shown with no page read poorly; and, where `grc` is installed, the same file read with Greek alone, its remarks naming every page as read poorly and the Fraktur remark shown. Where Tesseract is missing, the script says so and ends, as it does now.
- Remove what stage 2 left: the `TextPreview` shown where the try pane has taken its place, if that is what you chose.

Commit. Report.

## Open choices, decided here so that nobody has to ask

- The threshold is 80. Make it one constant; do not tune it to the fixtures.
- Pages read by stretch keep their numbers in the remarks as pages of the file, not of the stretch.
- The strip's pictures are not cached between openings of the dialog.
- A picture of the store (one page, `PictureTextDialog`) gets neither the strip nor stretches; it gets the try pane only if that costs nothing, else not, say which.
