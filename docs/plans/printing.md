# Printing — the build plan

The working plan for `docs/adr/0075-printing.md`. Read the record first, in full: it says what and why, and what was found; this says how, in which order, in which files, and how each stage is verified. Where they disagree, the record wins; say so in your report. Read also `.claude/briefs/common.md` (the progress note, the languages, the rules), and the records 0064 (the typesetting pane), 0069 and 0072 (a file in a view, its bar and its pages), whose code this builds on.

Read the last section of `docs/brief.md` (2026-10-30, *printing*): it is the owner's words, and the record is read from them. Nobody answers questions while you build: where something is open, choose the plainer thing, write the choice down in your progress note and your report, and go on. The record's "Choices made in writing this" lists what the owner has not been asked about; build them as written.

Work on `main`. Commit after every stage that builds, with a message that says what was built, in the voice of `git log`. Keep `PROGRESS-opus.md` at the root as the common brief says. Build the binary, `cargo test` and `cargo clippy` only in a capped `systemd-run` unit, as `.claude/briefs/fewer-words/common.md` shows. Never push, never tag, never start the GitHub Installers workflow. The owner's own Glaukopis may be running: never touch it, nor its data.

## Vocabulary

- *The typesetting pane*: `src/lib/preview/PreviewPanel.svelte`, in `ProjectView.svelte` (`previewSpec` says which side it shows; `panes.typesetFor(key)` opens it for a side, `panes.closeTypesetting()` closes it). Its pages come from `document_preview` and `document_preview_pages` as SVG, each shown as an `<img>` of a blob URL (`take`, about line 317), and `size` holds the page's width and height in points.
- *The kept document*: the `typst::PagedDocument` the core keeps per project after setting it for the pane (`KEPT` in `crates/core/src/export/mod.rs`, found by `kept(dir)`, the dir from `work_dir(ctx, key, "preview")`); `typeset::svg(document, n)` draws page n.
- *A file side*: `src/lib/viewer/FileSide.svelte`, with `ViewerBar.svelte` over its pages (`PdfView.svelte`, `ImageView.svelte`). `fileFacts(hash)` gives the count and the size of every page in points (`sizes`), `filePage(hash, n, width, ticket)` the PNG of a page drawn `width` dots wide, stoppable by `ocrStop(ticket)`.
- *The key table*: `src/lib/shell/keys.svelte.ts`, `ENTRIES`; an act is bound in `ProjectView.svelte` (`shortcuts.bind({...})`, about line 930) and its words are `keys-<id>` in `keys.ftl`. The palette lists every entry by those words.
- *The hooks*: `testHook(name, value)` in `src/lib/shell/testing.ts` puts a function on `window` for the scripts, only when the harness runs the application; `__glaukopisViewer` is the viewer's.
- *Points*: the unit of every page size here, 72 to the inch; CSS takes them as `pt`.

## The words

Every word the user sees comes through `t('key')` from `locales/en/<part>.ftl` and `locales/nb/<part>.ftl`; write English and Bokmål together, in the same plain voice (`.claude/briefs/words.md` has the glossary). New keys go at the end of their files under a comment naming this plan. The other languages fall back to English until they are translated. `common.ftl` may be used, not added to: take its word for cancelling, and the export dialog's way of a *Stop*, where this plan says *Stop*.

```
preview.ftl
preview-print = Print…                                            | Skriv ut …
preview-print-preparing = { $count ->
    [one] Preparing one page for printing…
   *[other] Preparing { $count } pages for printing…
}                                                                  | Gjør klar én side for utskrift … / Gjør klar { $count } sider for utskrift …
preview-print-failed = The pages could not be printed              | Sidene kunne ikke skrives ut

viewer.ftl
viewer-print = Print…                                             | Skriv ut …
viewer-print-pages = Pages to print                               | Sider som skal skrives ut
viewer-print-all = All { $count }                                  | Alle { $count }
viewer-print-from = From                                          | Fra
viewer-print-to = to                                              | til
viewer-print-drawing = { $count ->
    [one] Drawing one page for printing…
   *[other] Drawing { $count } pages for printing…
}                                                                  | Tegner én side for utskrift … / Tegner { $count } sider for utskrift …
viewer-print-failed = The pages could not be drawn for printing   | Sidene kunne ikke tegnes for utskrift

keys.ftl
keys-print = Print                                                | Skriv ut
```

`keys-preview` (*Typesetting*) stays; only its key changes. Write the Bokmål plural forms with the same `{ $count -> [one] … *[other] … }` shape as `files-count` has.

## Before anything: does WebKitGTK 2.54 print?

WebKitGTK renders with Skia since 2.46; the application turns Skia off for composition alone (`WEBKIT_USE_SKIA_FOR_COMPOSITION=0`, record 0049). Printing through it has not been tried here. So the first thing, before the pages or the words: a bare command that prints the window's page to a PDF file (stage 1.2 with `to_file`, nothing else), called from the page by the harness's `invoke`, on the start screen or any view. Look at the PDF with `pdfinfo` and by eye (`pdftoppm -png -r 50`). If it is empty, or the command never returns, say so in the progress note and the report at once, with the log, and go on with the stages all the same: the owner decides whether the way through CUPS is to be built instead. If it prints, go on.

## Stage 1 — the way through: pages into the page, and the system's dialog

### 1.1 The core — `crates/core/src/export/mod.rs`, `typeset.rs`

- Beside `pages_from`: `pub fn preview_print_pages(ctx: &Context, key: &str, from: u32, to: u32, stop: &AtomicBool) -> Result<Vec<PrintPage>>`, `#[derive(Serialize)] pub struct PrintPage { pub number: u32, pub svg: String }`: the kept document as `preview_pages` finds it (lift the finding into a small `fn kept_or_set(ctx, key, stop)` both use); the pages `from..=to` clamped to what there is, each `typeset::svg`, without the text runs and without the cap of `MOST_PAGES`. `from > to` or nothing in range gives an empty list, not an error.
- Test beside the preview's tests: a document of three pages gives pages 2 to 3 asked for 2 to 9; 1 to 3 asked for 0 to 0 gives none; the SVG of each has `<svg` and its number.

### 1.2 The command — a new `src-tauri/src/commands/printing.rs`, `lib.rs`, `contract.rs`, `src/lib/api/printing.ts`

- `document_print_pages(state, key: String, from: u32, to: u32) -> CommandResult<Vec<PrintPage>>` in `commands/documents.rs`, built as `document_preview_pages` builds its `Context`; `api/documents.ts`: `documentPrintPages(key, from, to)`.
- `print_pages(window: tauri::WebviewWindow, paper: Option<Paper>, to_file: Option<String>) -> CommandResult<()>`, `#[tauri::command] async`, `Paper { width: f64, height: f64 }` in points, `camelCase`: prints the page of the window as the system prints.
  - **Linux**: through `window.with_webview(move |platform| …)`, on the main thread: `webkit2gtk::PrintOperation::new(&platform.inner())`; a `gtk::PageSetup` with `gtk::PaperSize::new_custom("glaukopis-page", "Page", width, height, gtk::Unit::Points)` and every margin 0 where `paper` is given, `set_page_setup`; `gtk::PrintSettings::new()`, with the same paper size; where `to_file` is given, `settings.set_printer("Print to File")`, `settings.set("output-file-format", Some("pdf"))`, `settings.set("output-uri", Some(&format!("file://{path}")))` and `operation.print()` (no dialog); else `operation.run_dialog(Some(&gtk_window))` with `window.gtk_window()` as the parent, as `watch` in `lib.rs` gets it. The `finished` and `failed` signals (`connect_finished`, `connect_failed`) send on a channel the command awaits (`tauri::async_runtime::channel`, or a `std::sync::mpsc` received in `spawn_blocking`); `run_dialog` returning `Cancel` sends `Ok` at once. Keep the operation alive until one of them fires: a `thread_local!` `RefCell<Option<PrintOperation>>` on the main thread, taken out in the handlers. One printing at a time: a second call while one is kept fails with the kind `busy`. `failed` gives the error's message with the kind `print`.
  - **Windows and macOS**: `window.print()` (Tauri's, which evaluates `window.print()` in WebView2 and runs the print operation of the WKWebView); the command returns at once; `to_file` fails with the kind `unsupported`, since the harness runs on Linux alone.
  - The file name of GTK's file printer is translated by GTK (*Skriv ut til fil* in Norwegian): the harness launches the application with `LC_ALL=C` for the script that prints (1.5); say so in a comment where the name is written.
- Register both in `lib.rs`; the contract test (`cargo test -p glaukopis contract`) rewrites `contract.generated.ts`.
- `src/lib/api/printing.ts`: `printPagesCommand(paper: Paper | null, toFile: string | null)`.

### 1.3 The pages in the page — a new `src/lib/print/pages.ts`, with `pages.test.ts`

- `export interface PrintablePage { url: string; width: number; height: number }` (the picture of one page and its size in points) and `export async function printPages(pages: PrintablePage[], name: string, toFile?: string): Promise<void>`:
  - Removes a container left by a printing before, where there is one. Appends `<div id="print-pages" aria-hidden="true">` to `document.body` with a `<style>` and, per page, `<div class="page" style="width:{w}pt;height:{h}pt"><img src={url} alt=""></div>`. The style: on the screen `#print-pages { display: none }`; `@media print { @page { size: {W}pt {H}pt; margin: 0 } html, body { height: auto !important; overflow: visible !important; margin: 0; background: white } body > :not(#print-pages) { display: none !important } #print-pages { display: block } #print-pages .page { break-after: page; page-break-after: always; overflow: hidden; display: flex; align-items: center; justify-content: center } #print-pages img { max-width: 100%; max-height: 100%; width: 100%; height: 100% } }`, where W and H are the first page's size (the paper of the job; a page of another size is fitted into it keeping its proportions: give such a page `width:100%;height:100%` of the paper and let the image keep its ratio with `object-fit: contain`). Put the rules in one place, built from the sizes; test that the style names the first page's size and that every page gets its own.
  - Waits until every image is decoded (`img.decode()`, failures passed over), sets `document.title` to `name` for the duration and puts it back after, then `await printPagesCommand({ width: W, height: H }, toFile ?? null)`.
  - Takes the container out of the page only when the printing is over: on Linux when the command returns (it returns after `finished`, `failed` or *Cancel*); elsewhere the command returns at once, so wait for `afterprint` on `window` after it, and in any case take the pages out at the next printing. Never take them out while the system may still draw from them. Does not revoke the URLs: the callers own them and revoke after.
  - Errors of the command are thrown to the caller; the container is taken out first.
- `pure` helpers for the tests: `printStyle(sizes: [number, number][]): string` and the building of the container's HTML.

### 1.4 The typesetting pane prints — `PreviewPanel.svelte`

- `export async function print(): Promise<void>`: waits until the pane is settled: `making` false and no `again`; add `function whenSettled(): Promise<void>` kept as resolvers flushed in `make`'s `finally`, resolved at once where nothing is being made. Then, where `status !== 'shown'`, returns (the pane shows what is wrong). Else: a notice `preview-print-preparing` with `count` (`toasts.show`, `kind: 'info'`; look at `toast.svelte.ts` for how a notice is replaced or dismissed); `documentPrintPages(projectId, from, to)` in batches of 24 pages until `count`; each SVG to a blob URL as `take` does; `printPages(pages, name)` with `name = project.node(at)?.title || t('preview-file-name')` and every page `size`; afterwards the URLs revoked and the notice dismissed. Errors: `notifyError(t('preview-print-failed'), e)`. A second press while one printing runs is ignored (`printing` flag; the button disabled by it).
- The button: in the `<header>`, before the *Export* button: `<Button variant="ghost" size="sm" data-print disabled={printing || status !== 'shown'} onclick={() => void print()}>` with `Printer` of lucide as its icon and `t('preview-print')`; its tooltip the key, `keysFor('print')`, once stage 2 gives it one.
- The hook: `testHook('__glaukopisPrint', { toFile: (path: string) => print-to-file })`: the same as `print()` with `toFile` passed through, returning `{ count, width, height }` of what was printed. Set it in `onMount` of the pane and remove it in the teardown.

### 1.5 Verify

- `pnpm check`, `pnpm test`, `cargo test -p glaukopis-core` and `-p glaukopis` capped, `cargo clippy`, `pnpm format` on the files under `src/`.
- A new `e2e/print.mjs`, launched as `App.launch({ width: 1500, height: 920, env: { LC_ALL: 'C' } })`: a project with a few paragraphs over two or three pages, as `e2e/preview.mjs` makes one (take its way of writing text and opening the pane; the pane is opened with its button, not the key, since stage 2 moves the key); `await app.waitFor('.preview .page', 20000)`; the header has `[data-print]` with the words *Print…* (screenshot `print-1-pane`); then `const printed = await app.execAsync('return await window.__glaukopisPrint.toFile(arguments[0])', path)` with a path under `e2e/output/`; wait for the file; `pdfinfo` (spawned with `LC_ALL=C`): `Pages:` equals `printed.count` and the pane's `data-count`, `Page size:` equals `printed.width` and `printed.height` to a point; `pdfimages -list` lists no image (the pages are vector); `pdffonts` lists no font (the glyphs are outlines). **If `pdfimages` lists one image per page**, WebKit drew the `<img>` as a bitmap: then lay the SVG inline instead, each page's ids made unique by prefixing `id="`, `href="#` and `url(#` with `p{n}-`, and check again; write in the report which it was.
- The GTK dialog itself cannot be pressed by the harness; it is not tried by script. Say so in the script's comment.

Commit: *A document is printed from the typesetting pane: its pages, as SVG, are laid into the window's page and printed through the system's dialog, the paper set to the page on Linux; the harness prints to a PDF file.*

## Stage 2 — the keys and the act

### 2.1 The table — `keys.svelte.ts`, `keys.test.ts`, `keys.ftl`

- `{ id: 'print', keys: 'Ctrl+P', place: 'project', bound: true }` before `preview`; `preview` becomes `Ctrl+T`. The comment on `preview` says why T: P is printing, as everywhere. `keys-print` in `keys.ftl`, both languages. Grep `e2e/` and `src/` for `Ctrl+P` and for a press of `p` with Ctrl that means the pane: change what is found (none was found by name when this plan was written; look all the same).
- The key sheet (`KeySheet.svelte`) and the palette list by the table: nothing to add. `keys.test.ts` has a test that no key is given twice: it must still pass.

### 2.2 The act — `ProjectView.svelte`

- In `shortcuts.bind`: `print: { run: printActive, when: shown }`. `printActive()`: `const side = sides.active`; a file side (`isFile(side)`): `fileSideViews[side.key]?.print()` (stage 3; until then, nothing); a map side: where the pane is closed or shows another side (`!previewSpec || previewSpec.key !== side.key`), `panes.typesetFor(side.key)`; `await tick()`; then `previewPanel?.print()`, the instance bound with `bind:this={previewPanel}` on `<PreviewPanel>` (inside the `{#key}`: read it after `tick`). `print()` waits for the pages itself (1.4).
- The pane's close button shows `keysFor('preview')` already; the *Typesetting* buttons in the bars of the sides show the key through `keysFor` too: check with a grep that none writes the key by hand.

### Verify

- `pnpm check`, `pnpm test`.
- `e2e/print.mjs` grows: from the text, `Ctrl+T` opens the pane and closes it again; with the pane closed, `Ctrl+P` opens it, and the hook's print-to-file works after, since `print()` waits for the pages: here, since the key cannot print to a file, check instead that the pane opened and that the `[data-print]` button is enabled once `.preview .page` is there. The palette (`Ctrl+K`) finds *Print* by its word and shows `Ctrl+P` beside it; Escape. The key sheet (`Ctrl+/`) lists *Print* under *In a project*.
- `e2e/keys.mjs`, `e2e/preview.mjs`, `e2e/look.mjs` and `e2e/what.mjs` still pass (they open the pane; where one presses the old key, it is changed in 2.1).

Commit: *Ctrl+P prints the document of the side one is in, opening the typesetting pane where it is closed; the pane itself takes Ctrl+T.*

## Stage 3 — a file in a view prints

### 3.1 The range — a new `src/lib/viewer/PrintRangeDialog.svelte`

- A `Dialog` as the export dialog uses it, titled `viewer-print-pages`: two radio rows, *All { count }* chosen, and *From [ ] to [ ]* with two number fields prefilled 1 and `count`, choosing the row when a field is touched; the fields clamped to 1..count and from ≤ to; buttons: `viewer-print` (primary) and the common cancel. `onprint(from, to)`, `onclose`. Enter prints, Escape closes.

### 3.2 The side prints — `FileSide.svelte`, `ViewerBar.svelte`, `PdfView.svelte` or `ImageView.svelte` as needed

- `ViewerBar.svelte`: after the bookmarks button, a `<button class="zoom print" data-viewer-print aria-label={t('viewer-print')} use:tooltip={{ text: t('viewer-print'), shortcut: keysFor('print') }} onclick={onprint}>` with `Printer` of lucide, where `onprint` is given; a `printing` prop disables it.
- `FileSide.svelte`: `export async function print(): Promise<void>`: the facts of the shown file (`fileFacts`; the side has them already for its bar: use what it has). A PDF: open the range dialog; on `onprint(from, to)`, draw the pages: a ticket (`newId()`), a notice `viewer-print-drawing` with `count = to - from + 1` and an action *Stop* that calls `ocrStop(ticket)` and sets a flag; for each page in order, at most two in flight, `filePage(hash, n, Math.round(sizes[n-1][0] / 72 * 300), ticket)` to a blob URL, with its size in points from `sizes`; a stop ends the drawing quietly and revokes what was drawn; an error ends it with `notifyError(t('viewer-print-failed'), e)`. Then `printPages(pages, name)`; the URLs revoked after; the notice dismissed. A picture: no dialog; one page, `filePage(hash, 1, sizes[0][0], ticket)` at its own width in pixels, its size in points `pixels * 72 / 300`. A second press while one printing runs is ignored.
- The hook: `__glaukopisViewer.printToFile(path, from, to)` beside `show` and `beside` (look where they are set): draws as above without the dialog and passes `path` through, returning `{ count, width, height }`.

### 3.3 The act for a file — `ProjectView.svelte`

- `printActive` of 2.2 calls `fileSideViews[side.key].print()` for a file side; nothing else.

### Verify

- `pnpm check`, `pnpm test`.
- `e2e/print.mjs` grows: `e2e/fixtures/structure.pdf` taken in and shown in a side as `e2e/file-view.mjs` does (`files_take_in`, then `window.__glaukopisViewer.show(hash)`); the bar has `[data-viewer-print]`; pressing it opens the dialog titled *Pages to print* with *All N* (screenshot `print-2-range`); Escape. Then `window.__glaukopisViewer.printToFile(path, 1, 2)`: the PDF has 2 pages by `pdfinfo`, its page size the fixture's first page's to a point, and `pdfimages -list` lists 2 images. With `Ctrl+P` while the file side has the focus, the dialog opens; Escape.
- `e2e/file-view.mjs`, `e2e/source-tabs.mjs` and `e2e/viewer-speed.mjs` still pass.

Commit: *A file in a view is printed: a PDF by a range of its pages drawn at 300 dots per inch, an image as one page, from the bar and with Ctrl+P.*

## Stage 4 — the guide, the record

- `docs/guide.md`, *Typesetting* (about line 2502): **Ctrl+T** opens the pane. After the paragraphs of *Export* (about line 2573 to 2627), a paragraph *Printing*: **Print…** in the head of the pane, or **Ctrl+P** anywhere in the project, prints the document through the printing of your system, its own dialog with its printers, copies, range and two-sided printing; on Linux that is GTK's dialog with the printers of CUPS and *Print to File*; the pages print as they are set, the paper being the document's page; with the pane closed, Ctrl+P opens it and prints when the pages are set. *Reading* (about line 1442): the bar's **Print…** for a PDF, which asks the pages first since they must be drawn, and prints them at the resolution print wants, and for an image; **Ctrl+P** does the same while the file has the focus. *Keys* (about line 3330): the row of **Ctrl+P** becomes *Print: the document of the side you are in, or the file*, and a row **Ctrl+T** for the typesetting pane in its place.
- An addendum to 0075, *as built*: what departs from the plan, the choices made alone, whether WebKitGTK printed vector from `<img>` or the SVG had to be inlined, the counts.

## At the end

- Run `e2e/print.mjs`, `e2e/preview.mjs`, `e2e/keys.mjs`, `e2e/file-view.mjs`, `e2e/source-tabs.mjs`, `e2e/look.mjs`, `e2e/what.mjs`, `e2e/languages.mjs`.
- Report: what was built, stage by stage, with the commits; whether WebKitGTK 2.54 printed, and how the printed PDF looked (`pdfinfo`, `pdfimages -list`, `pdffonts`); what was left and why; the counts of `pnpm check`, `pnpm test`, `cargo test`, and every e2e script with its ok/FAIL counts; the paths of the screenshots to look at. Windows and macOS are not tried here: say what in them rests on reading alone (`window.print()` in WebView2 with `@page size`; the print sheet of the WKWebView with the system's paper).
