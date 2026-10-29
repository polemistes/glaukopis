# Sources in tabs, bookmarks in a file, and the scrolling of pages — the build plan

The working plan for `docs/adr/0072-sources-in-tabs-bookmarks-in-a-file-and-the-scrolling-of-pages.md`. Read the record first, in full: it says what and why, and what was found; this says how, in which order, in which files, and how each stage is verified. Where they disagree, the record wins; say so in your report. Read also `.claude/briefs/common.md` (the progress note, the languages, the rules), and the records 0069 (a file in a view), 0070 (one place for files) and 0071 (a simple image editor), whose code this builds on, with their addenda.

Read the last section of `docs/brief.md` (2026-10-29, *sources in tabs, bookmarks in a file, and the scrolling of pages*): it is the owner's words, and the record is read from them. Nobody answers questions while you build: where something is open, choose the plainer thing, write the choice down in your progress note and your report, and go on. The record's "Choices made in writing this" lists what the owner has not been asked about; build them as written.

Work on `main`. Commit after every stage that builds, with a message that says what was built, in the voice of `git log`; more often where a stage is long. Keep `PROGRESS-opus.md` at the root as the common brief says. Build the binary, `cargo test` and `cargo clippy` only in a capped `systemd-run` unit, as `.claude/briefs/fewer-words/common.md` shows (the memory of this machine is shared with the owner's editor; a build that runs out of memory inside the editor takes the editor down). Never push, never tag, never start the GitHub Installers workflow.

Stage 6, the served child, touches only `crates/core` and may be built in a worktree of its own beside stages 3–5, if the main session chooses to fan the work out; its commands' signatures (`pages_at` unchanged) make that possible. Stages 1 and 2 come first in either case.

## Vocabulary

- *A file side*: a side of the window that shows files (`sides.svelte.ts`, `FileSide`); it has *tabs*. *A map side* shows a project.
- *A tab*: a place in a file: the file's hash, its *place*, its zoom.
- *A place*: the page at the top edge of the view, counted from one, and how far down that page the edge stands, as a fraction of the page's height, 0 at its top. It holds across zooms and widths of the side. The bar goes on saying the page at the middle (`viewer-page-of`).
- *The sources of a project*: its tabs and which is active, kept in the project's record on this computer (`ProjectInfo.sources`). *A side's own tabs*: those of a file side with no project, kept with the arrangement.
- *A bookmark*: a place in a file with a name, kept in the library's record of the file (`FileRecord.bookmarks`).
- *The contents*: the outline a PDF carries of its own headings (`Layer.outline`, `OutlineEntry` in `ocr/shape.rs`).
- *The served child*: a child process that keeps one file open and draws its pages on request (`ocr/server.rs`, new), beside the one-shot child of `ocr/child.rs`.
- *The viewer*: `src/lib/viewer/`: `FileSide.svelte` the side, `ViewerBar.svelte` its bar, `PdfView.svelte` the pages, `pages.ts` their places, `PageText.svelte` the text over a page, `ImageView.svelte` an image, `FilePath.svelte` the cell in the top row, `LibraryTrees.svelte` the trees under the chevron, `show.ts` the ways in, `viewers.svelte.ts` the facts of the files shown.

## The words

Every word the user sees comes through `t('key')` from `locales/en/<part>.ftl` and `locales/nb/<part>.ftl`; write English and Bokmål together, in the same plain voice (`.claude/briefs/words.md` has the glossary). New keys go at the end of their files under a comment naming this plan. The other languages are left to be translated later; a key whose English changes is removed from the other languages' files so that they fall back (`scripts/prune-locales.mjs` helps). `common.ftl` may be used, not added to. No help texts.

```
viewer.ftl
viewer-tabs = Sources                                            | Kilder
viewer-tab-add = Add a file…                                     | Legg til en fil …
viewer-tab-add-title = Add a file to the sources                 | Legg til en fil blant kildene
viewer-tab-menu = The tab's menu                                 | Fanens meny
viewer-tab-close = Close the tab                                 | Lukk fanen
viewer-tab-close-others = Close the other tabs                   | Lukk de andre fanene
viewer-tab-again = Open again in a new tab                       | Åpne igjen i en ny fane
viewer-tab-in-library = Show in the library                      | Vis i biblioteket
viewer-tab-gone = No longer in the library                       | Ikke lenger i biblioteket
# The tooltip of the project's name in the cell of a file side.
viewer-sources-of = The sources of { $name }                     | Kildene til { $name }
viewer-places = Bookmarks and contents                           | Bokmerker og innhold
viewer-bookmark-here = Mark this place                           | Merk dette stedet
viewer-bookmarks = Bookmarks                                     | Bokmerker
viewer-bookmarks-none = No bookmarks yet                         | Ingen bokmerker ennå
# The default name of a bookmark, and the small page said beside one.
viewer-bookmark-page = Page { $label }                           | Side { $label }
viewer-bookmark-name = The bookmark's name                       | Bokmerkets navn
viewer-bookmark-rename = Rename                                  | Gi nytt navn
viewer-bookmark-remove = Remove                                  | Fjern
viewer-contents = Contents                                       | Innhold
viewer-contents-none = The file has no table of contents of its own | Filen har ingen egen innholdsfortegnelse

keys.ftl
keys-viewer-tab-next = Next tab                                  | Neste fane
keys-viewer-tab-previous = Previous tab                          | Forrige fane
keys-viewer-bookmark = Mark this place                           | Merk dette stedet
# Changed: on a file side it closes the tab first.
keys-close-side = Close the tab, or this side                    | Lukk fanen, eller denne siden
```

`project-beside-file` and `project-beside-file-title` (Split view's chooser), `files-show`, `files-open-elsewhere`, `viewer-not-found`, `viewer-not-drawn` and the rest of `viewer.ftl` stay as they are.

## Stage 1 — measure first

### 1.1 `e2e/viewer-speed.mjs` (new; the harness as `e2e/file-view.mjs` uses it)

Before anything is changed, so that the numbers of the record's addendum have a baseline from `main` as it is.

- Makes a book: writes `long.typ` in its temp dir, three hundred pages, a heading `= Chapter n` every ten pages (Typst writes them as the PDF's outline) and `#lorem(350)` of text a page with `#pagebreak()`, and compiles it with `typst compile` (`/usr/bin/typst`; where Typst is not there, the script says so, writes nothing and ends with its checks passed, so that it never fails for want of a tool). Takes it into the library (`files_take_in` through `__TAURI_INTERNALS__.invoke`, as `file-view.mjs` does), opens a project, shows the file (`__glaukopisViewer.show(hash)`).
- Measures, each by polling the page every 20 ms:
  - *first*: ms from the show until the first page's `img` is complete (`img.complete && img.naturalWidth > 0`).
  - *scroll*: installs in the page a recorder on `requestAnimationFrame` that keeps every gap over 32 ms between frames, then a scroller that adds a tenth of a page's height to the scroller's `scrollTop` every 50 ms until page 60 is passed (both inside the page, by one `execAsync`, so that the driver's round trips add nothing); samples every 300 ms whether the page at the middle has a complete picture. Reports the longest gap, the count of gaps over 50 ms, and the samples without a picture, of how many.
  - *jump cold*: goes to page 200 by the bar's field; ms until that page's picture is complete.
  - *jump warm*: back to page 1 the same way; ms until complete.
  - After stage 3: *switch*, ms until the picture is there when a second tab of the same file at page 150 is made, page 1 is gone back to in the first, and the second is switched to.
- Prints the numbers as one JSON line, `{ first, longestGap, gapsOver50, blank, samples, jumpCold, jumpWarm, switch }`, and `check`s only that each was measured (a slow machine must not make it fail). Takes screenshots `viewer-speed-1-scrolled`.
- Run it on `main` before stage 2, three times, and write the numbers in `PROGRESS-opus.md`; run it again after stages 3 and 6.

Commit: *A script that measures the file view: the first page, the gaps while scrolling, a page jumped to.*

## Stage 2 — the core: sources, bookmarks, the contents, a page as bytes

### 2.1 The sources of a project — `crates/core/src/projects.rs`, `src-tauri/src/commands/projects.rs`, `lib.rs`, `src/lib/api/projects.ts`

- `ProjectInfo` gains `pub sources: serde_json::Value` with `#[serde(default, skip_serializing_if = "serde_json::Value::is_null")]`, beside `view`, opaque to the core as `view` is: the page owns its shape (2.2 of stage 3).
- Commands `project_sources(id) -> serde_json::Value` (read from the info) and `project_save_sources(id, sources: serde_json::Value)` (through `update_info`, as `project_save_view` does). Register them. `api/projects.ts`: `projectSources`, `projectSaveSources`; `ProjectInfo.sources?: unknown`.
- A test beside the others of `projects.rs`: saved sources are read back; a project without any gives null.

### 2.2 Bookmarks in the record of a file — `crates/core/src/library/files.rs`, `library/mod.rs`, `src-tauri/src/commands/files.rs`, `src/lib/api/files.ts`

- `FileRecord` gains `pub bookmarks: Vec<Bookmark>` with `#[serde(default, skip_serializing_if = "Vec::is_empty")]`; `pub struct Bookmark { pub id: String, pub page: usize, pub at: f32, pub name: String }`, `id` a short random id made by the page, `page` counted from one, `at` a fraction in 0–1. An old `files.json` reads with none.
- `Library::set_bookmarks(&mut self, hash, bookmarks: Vec<Bookmark>) -> Result<FileView>`: replaces the list (checked: page ≥ 1, `at` within 0–1, names trimmed, at most 500), saves the files (`save_files`), gives the view. `view_of` (`mod.rs:1301`) carries `bookmarks` into `FileView`.
- Command `file_bookmarks_set(hash, bookmarks) -> FileView`; `api/files.ts`: `fileBookmarksSet`, `FileView.bookmarks: Bookmark[]`; `files/store.svelte.ts` takes the view returned into its records as `fileRename` does.
- A test: bookmarks set are read back after a reload of the record; a bad page is refused.

### 2.3 The contents in the facts — `crates/core/src/ocr/mod.rs`, `src-tauri/src/commands/viewer.rs`, `src/lib/api/viewer.ts`

- `FileFacts` (`mod.rs:1538`) gains `pub outline: Vec<OutlineEntry>`: from `seen.layer.outline` in `file_facts` (`mod.rs:1607`, which reads the look already), those entries that lead to a page (`page.is_some()`), with the page clamped to the count, up to 2000; empty for a picture, a locked file, and a file only Poppler opens. The command's `FileFacts` and the page's type carry it as `outline: { title: string; page: number; depth: number }[]`.
- A test on `e2e/fixtures/structure.pdf` (its headings are an outline; see `layer.rs:1573` for the test that reads them): the facts list them with their pages.

### 2.4 A page as bytes — `src-tauri/src/commands/viewer.rs`, `contract.rs`, `src/lib/api/viewer.ts`

- `file_page(hash, page: usize, width: u32, ticket: Option<String>) -> CommandResult<tauri::ipc::Response>`: the PNG of one page through `ocr::pages_at` with that one index (the cache first, as today); a page the file does not have is `Error::invalid(tr!("ocr-no-such-page", …))`; a page that could not be drawn is `Error::invalid(why)`, so that the page shows `viewer-not-drawn` with the message. Model it on `file_edit_preview` (`commands/files.rs:432`). `file_pages` and `PageAt` go, with their lines in `contract.rs` (`pagesAt`, `:408` and `:642`); `cargo test -p glaukopis contract` rewrites the page's types.
- `api/viewer.ts`: `filePage(hash, page, width, ticket?) -> Promise<ArrayBuffer>` as `fileEditPreview` is written (`invoke<ArrayBuffer>`); `filePages` and `PageAt` removed. The page compiles again only after 3.1; do 2.4 and 3.1 in one commit if you prefer.

### Verify

- `cargo test --workspace` and `cargo clippy --workspace --all-targets` in a capped unit; `pnpm check` after 3.1.

Commit: *The core keeps the sources of a project and the bookmarks of a file, tells a file's contents, and gives a page as bytes.*

## Stage 3 — the viewer made quick

### 3.1 Pages as blobs, fewer mounted, the nearest first — `src/lib/viewer/PdfView.svelte`, `pages.ts`, `pages.test.ts`

- `drawn` holds `{ url: string | null; failed: string | null; width: number }`; a page fetched is `URL.createObjectURL(new Blob([bytes], { type: 'image/png' }))`. A page drawn before is swapped only once the new picture is decoded, as today (`new Image()` on the blob URL, `decode()`), and the old URL is revoked after the swap; a page let go (`toLetGo`) and every page on destroy has its URL revoked. `<img decoding="async">`.
- One page to a call. `pages.ts` gets `wanted(placed, scrolled, roomHeight, drawn, asked, ratio): number[]`, pure and tested: the pages seen with `BESIDE` around them that lack a picture at the width wanted, ordered by their distance from the page at the middle, nearest first. `PdfView` keeps at most `IN_FLIGHT = 4` calls going: the effect fills the set from `wanted` as calls finish. One ticket a side for `ocrStop` on destroy, as today.
- Mounted pages: the `{#if Math.abs(n - page) <= 6 || d}` becomes "the pages seen with `BESIDE` around them", from `pagesSeen`; a drawn page beyond them keeps its blob and no element. `KEPT` stays 40.
- A failure to fetch (the error's message) is shown in the page's box as `viewer-not-drawn`, as today; a `not-found` is left to the side (`viewers`).

### 3.2 Exact widths — `pages.ts`, `PdfView.svelte`

- `widthWanted(shown, ratio) = Math.min(WIDEST, Math.ceil(shown * Math.max(ratio, 1)))`; `WIDTH_STEP` goes, and its test becomes one for the exact width. The page's box is `placed.widths[i]` CSS pixels and its picture `ceil(widths[i] × ratio)` dots, so that the picture is painted at its own size. The rest of the zoom (about the pointer, `resting` after 250 ms, the stretched picture meanwhile) stays.
- The e2e harness's expectation that a page's `img` has a `data:` source (`fileSide()` in `e2e/file-view.mjs`) becomes `blob:`.

### 3.3 The text layer in one pass — `src/lib/viewer/PageText.svelte`

- The effect that stretches the lines does three loops instead of one: every span's transform reset, then every natural and wanted width read, then every transform written. Two layouts a page instead of two a line.

### 3.4 Fast PNG — `crates/core/src/ocr/drawing.rs`

- `colour_png` writes with `PngEncoder::new_with_quality(&mut out, CompressionType::Fast, FilterType::Adaptive)`. Measure, in a test marked `#[ignore]` or a small bench run by hand, the time to encode and the size for a page of `structure.pdf` and of `porson.pdf` at 1800 dots, default against fast; keep fast where the time saved is more than the extra bytes cost at about a millisecond a megabyte across the bridge; write both numbers in the progress note. The cache's key does not change: pages drawn before are served as they are.

### Verify

- `pnpm check`, `pnpm test` (`pages.test.ts` grown), `cargo test -p glaukopis-core` capped.
- `e2e/file-view.mjs` passes with `blob:`; `e2e/image-editing.mjs` passes.
- `e2e/viewer-speed.mjs` three times; the numbers against the baseline in `PROGRESS-opus.md`. Expect the longest gap and the gaps over 50 ms to fall a great deal and *jump warm* to be well under 100 ms; *jump cold* and *first* fall only in stage 6.

Commit: *Pages of a file cross the bridge as bytes, at the width they are shown, the nearest first, fewer of them in the document; the text layer measured in one pass.*

## Stage 4 — the tabs

### 4.1 The shape of the sources, pure — `src/lib/viewer/sources.ts` (new), `sources.test.ts`

```ts
export interface Place { page: number; at: number }
export interface SourceTab { id: string; file: string; place: Place; zoom: number | null }
export interface Sources { tabs: SourceTab[]; active: string | null }
```

- `readSources(stored: unknown): Sources` with care (a bad tab is left out, `active` made one of the tabs or the first); `emptySources()`.
- `withFile(sources, file, place?, again = false): { sources: Sources; id: string }`: goes to the tab of that file where there is one and `again` is false, else adds a tab after the active one and makes it active; `without(sources, id)` (the active moves to the neighbour), `withoutOthers(sources, id)`, `moved(sources, id, to)`, `activated(sources, id)`, `next(sources)`, `previous(sources)`, `placed(sources, id, place)`, `zoomed(sources, id, zoom)`, `replaced(sources, id, file)` (the editor's new copy, place at the top, zoom fitted). All return new objects. Ids from `newId()` (`$lib/util/id`).
- Tests for each, including: the same file twice only with `again`; closing the last tab leaves none; `readSources` of an old shape gives empty.

### 4.2 The store of sources — `src/lib/viewer/sources.svelte.ts` (new)

- `class SourcesStore`: `of(project: string): Sources` (reactive; loads once with `projectSources` and gives `emptySources()` until then; a project that cannot be read gives empty and is said once in the log), `change(project, change: (s: Sources) => Sources)`, which sets and writes with `projectSaveSources` 300 ms after the last change, flushed by `beforeClose` as `settings.svelte.ts` does (`#saveTimer`, `flush`), and `forget(project)` when the project is deleted. Export `sourcesStore`.

### 4.3 The sides — `src/lib/project/sides.svelte.ts`, `sides.svelte.test.ts`

- `FileSide` becomes `{ kind: 'file'; key: string; project: string | null; own: Sources | null }`: `own` for a side with no project only. `Arrangement` gains `lastProject: string | null`. `readSide`: a kept file side with `project` and nothing else; one of the old shape (`file`, `page`, `zoom`) becomes `{ project: null, own: one tab at that page }`; `own` read by `readSources`. `toKeep` writes `project` and `own`, and `lastProject`.
- `Sides` takes the sources through an interface at construction, `{ of(project): Sources; change(project, fn): void }`, the real one `sourcesStore` (`export const sides = new Sides(sourcesStore)`), a fake in the tests, as `open-projects` takes its `Opener`. Helpers: `sourcesOf(side: FileSide): Sources` (the project's or its own) and `#changeSources(side, fn)` (the project's through the store, its own in the spec).
- New acts: `showFile(file: string, place?: Place): string` by the record's rule (a file side where there is one, the active side first; else the other side becomes a file side of the project beside, in the place of what it showed, the first side where none; the file side gets the focus; the project of a new file side: the map beside it, else `lastProject`, else none), returning the side's key; `showFileIn(key, file)` (that side becomes a file side of the project it had, or keeps the one it has); `tabs(key)`, `activate(key, id)`, `closeTab(key, id)` (the side closes with its last tab), `closeOtherTabs(key, id)`, `moveTab(key, id, to)`, `again(key, id)`, `setPlace(key, id, place)`, `setTabZoom(key, id, zoom)`, `setFile(key, file)` (the active tab's file replaced: the editor), `nextTab(key)`, `previousTab(key)`. `openFile`, `besideFile`, `setPage`, `setFileZoom` go; their callers follow in 4.6.
- `#follow()`, run at the end of every act that changes the sides (`open`, `beside`, `bothWays`, `showFile`, `showFileIn`, `close`, `switchSides`, `arrange`, `clear`): a file side with a map side beside it has that map's project; a side with `own` tabs that gains a project gives them to it (`withFile` for each, keeping their places) and keeps none; `lastProject` is the project of the map side most recently opened or arranged. `closeProject(project)` closes its file sides too, and the store forgets it. At most one file side of a project: `showFile` goes to the one there.
- `arrange`: a kept file side whose project is gone is left out; a side of no project stays with its own tabs; the route `file` is given to `showFile` after the sides are laid out, where the active side does not already show it.
- Tests: the rule of `showFile` in each of its cases; the follow when a project opens beside and when the map closes; own tabs given to a project; `lastProject`; the old kept shape read; the last tab closing the side; `arrange` with a gone project.

### 4.4 The place and the window — `src/lib/project/ProjectView.svelte`, `src/lib/state/router.svelte.ts`

- The effect that makes the place follow the active side writes the active tab's file and its place's page for a file side; the effect that shows a place gone to calls `sides.showFile(route.file, { page: route.page ?? 1, at: 0 })` where the active side does not show that file. `router.lastProject` stays as it is.
- `close-side` (`ProjectView.svelte:859`): on a file side, `sides.closeTab(key, active)`; the × in the top row still closes the side. The row of the key sheet reads `keys-close-side` as changed.
- Split view's chooser (`ProjectView.svelte:1229`, `FileChooser single`) calls `sides.showFile(hash)`. `project-beside-file` stays in the menu, enabled always.
- The arrangement effect (`:140`) keeps writing as it does; the places of tabs are the store's and not the arrangement's, so that scrolling writes nothing to the settings.

### 4.5 The row of tabs, the side, the cell — `src/lib/viewer/TabRow.svelte` (new), `FileSide.svelte`, `ViewerBar.svelte`, `PdfView.svelte`, `ImageView.svelte`, `FilePath.svelte`, `LibraryTrees.svelte`

- `TabRow.svelte`: `role="tablist"` labelled `viewer-tabs`, one `button role="tab"` a tab with the file's icon (`KIND_ICONS` of `files/store.svelte.ts`) and name from the files store, `data-tab={id}` and `data-tab-file={hash}`, `aria-selected` on the active, a title with the name and the folder; a tab whose file the store has not is marked and titled `viewer-tab-gone`. A close mark (`X`, size 12) on the active tab and on the one under the pointer; the middle button closes; the plus at the end (`viewer-tab-add`) opens `FileChooser` in `single` mode titled `viewer-tab-add-title`, the file chosen to `sides.showFileIn(key, hash)`. The row scrolls sideways (`overflow-x: auto`, scrollbar hidden, the wheel's vertical delta turned sideways). Reordering by pointer: on a drag of a tab past the middle of a neighbour, `sides.moveTab`; keep it small, no ghost needed. A tab's menu, on the right button and on a chevron that appears on the active tab (`viewer-tab-menu`), through `openMenu`: `viewer-tab-close`, `viewer-tab-close-others`, `viewer-tab-again`, a separator, `viewer-tab-in-library` (`router.go({ view: 'files', folder, file })`), `files-open-elsewhere`.
- `FileSide.svelte`: reads `sides.tabs(spec.key)`, the active tab, and renders the row above the bar; `viewers.fetch(key, tab.file)` for the active tab; `{#key tab.id}` around `PdfView`/`ImageView`, so that a tab switched to is laid out anew at its place, from the cache. The editor's `sides.setFile(spec.key, hash)` stays; switching tabs with an unkept edit goes through `cancelEditing` first (the effect that drops an edit when the file changes becomes one that asks, as Escape does). `data-file-side` stays the active tab's file.
- `PdfView.svelte` takes `place: Place` and `onplace(place)` in the stead of `page`/`onpage`: `goTo(place)` scrolls to `tops[page-1] + at × heights[page-1] − AROUND.top`; `onscroll` tells the place at the top edge (`pageAt(placed, scrolled + AROUND.top)` and the fraction) whenever it changes, and the bar's page at the middle as today (`onmiddle`). The field and the keys go to a place with `at: 0`. `ImageView` keeps a zoom per tab through `onzoom`.
- `ViewerBar.svelte`: `onpage` becomes `onplace` with `at: 0`; the button of 5.2 is added later.
- `FilePath.svelte`: the cell is the chevron, then the project's name small with `FolderTree`'s icon or none (title `viewer-sources-of`), a press opening the project in the other side (`viewing.beside(project)`), then the active tab's file name in bold; no folder crumb. With no project, the chevron and the name. `LibraryTrees`' `onfile` goes to `sides.showFileIn(key, hash)`, and marks the active tab's file.
- Keys (`shell/keys.svelte.ts`, place `viewer`, bound): `viewer-tab-next` Ctrl+PageDown, `viewer-tab-previous` Ctrl+PageUp, bound in `FileSide` with `shortcuts.bind` and `when: () => active` as the zoom keys are; `keys.ftl` as in *The words*.

### 4.6 The ways in — `src/lib/viewer/show.ts`, `ShowFileButton.svelte`, `src/lib/files/FilePane.svelte`, `files/FilesView.svelte`, `library/ReferencePane.svelte`, `project/ReferencePanel.svelte`

- `show.ts`: one function, `showFile(hash, place?)`: in the window, `sides.showFile`; from the library, the files or the images, `router.go({ view: 'file', file: hash, page })` as today, which 4.4 turns into `sides.showFile`. `besideFile` goes; its callers (`ShowFileButton.svelte:38,45`, `ReferencePanel.svelte:88`) call `showFile`; `FilePane.svelte:189,288`, `FilesView.svelte:274,595` and `ReferencePane.svelte:456` already call `showFile`. The test hook `__glaukopisViewer` keeps `show` and gains `again(hash)` (a second tab, for the scripts), and `beside` is kept as a name for `show`.

### Verify

- `pnpm check`, `pnpm test`.
- `e2e/sources.mjs` (new): take `structure.pdf`, `porson.pdf` and `resources/brand/owl.png` into the library; open a project in a side; `__glaukopisViewer.show(structure)`: two sides, the file side with one tab, focused, its cell naming the project; `show(porson)`: a second tab, active; `show(structure)`: the first tab active again, still two tabs; `again(structure)`: three tabs; scroll the third to page 2, switch to the first, back to the third: the third is at page 2 and the first at page 1 (read the scroller's `scrollTop` and the bar); Ctrl+PageUp and Ctrl+PageDown move among the tabs; the plus opens the chooser (press it, choose the image by name): a fourth tab, an image. Close the map side with its ×: the file side stays, its cell still names the project. Open another project in the other side through Split view's *Another project…* (`e2e/maps.mjs` drives that menu; the harness has `openProject` for the list): the file side's cell names the new project and its tabs are the new project's (none, so the chooser's plus is what the row offers, or the file side shows an empty row and the viewer's empty state). Open the first project again beside: the four tabs are back. Ctrl+W closes a tab; closing the last closes the side. Relaunch with `keepData`: the file side and its tabs come back, the active tab at its place. Screenshots `sources-1-tabs`, `sources-2-after-switch`, `sources-3-as-left`.
- `e2e/file-view.mjs` updated where it expects the file in the active side's place, the folder crumb, `data:` sources and `besideFile`; `e2e/image-editing.mjs` where it sets the side's file; both pass. `e2e/maps.mjs`, `e2e/as-left.mjs`, `e2e/files.mjs`, `e2e/library.mjs` still pass.

Commit: *A file side shows the sources of a project in tabs, each at its own place, following the project beside it and kept with the project on this computer.*

## Stage 5 — bookmarks and contents

### 5.1 The bookmarks, pure — `src/lib/viewer/bookmarks.ts` (new), `bookmarks.test.ts`

- `withBookmark(list, place, name): { list, id }` (ordered by page, then `at`), `renamed(list, id, name)`, `without(list, id)`, `defaultName(place, labels)` (`viewer-bookmark-page` with the printed label), `checked` (names trimmed, at most 500). Tests.

### 5.2 The list in the bar — `src/lib/viewer/PlacesPopover.svelte` (new), `ViewerBar.svelte`, `FileSide.svelte`, `PdfView.svelte`

- A button in the bar after the zoom, `Bookmark` icon, label `viewer-places`, `data-viewer-places`, which opens a `Popover` (as `FilePath` opens its tree) anchored to it: at the top *Mark this place* (`viewer-bookmark-here`): a small form appears with a field (`viewer-bookmark-name`) holding the default name selected, Enter keeps it, Escape leaves; then the heading `viewer-bookmarks` and the list, each row the name and the small page (`viewer-bookmark-page`), `data-bookmark={id}`, a press going to its place (`sides.setPlace` and the view's `goTo`), a menu on the row with `viewer-bookmark-rename` (the field in the row) and `viewer-bookmark-remove`; `viewer-bookmarks-none` while there are none. Then the heading `viewer-contents` and the outline from the facts, each entry indented by `(depth − 1) × 12px`, `data-contents-page`, a press going to `{ page, at: 0 }`; `viewer-contents-none` where it is empty. The popover's list scrolls; Escape closes it.
- The bookmarks come from the files store's record of the active tab's file (`FileView.bookmarks`) and are written with `fileBookmarksSet` through the store, so that every side showing the file sees them.
- The key `viewer-bookmark` Ctrl+Shift+B (place `viewer`, bound in `FileSide`): opens the popover with the form at the top, as the button and *Mark this place* do. The image side has the button disabled (no bookmarks on images).

### Verify

- `pnpm check`, `pnpm test`.
- `e2e/sources.mjs` grows: on `structure.pdf` at page 2, Ctrl+Shift+B, Enter: a bookmark named after the page; go to page 1, press the bookmark's row: page 2 again; rename it through its menu; it is in the list of the same file in another project (open a second project, show the file there, open the list); the contents list the fixture's headings and a press goes to the heading's page; remove the bookmark. Screenshot `sources-4-places`.

Commit: *Bookmarks in a file, kept with the file in the library, and the file's own contents, in one list from the viewer's bar.*

## Stage 6 — the served child

Touches only `crates/core`. `pages_at` keeps its signature, so the commands and the page need no change.

### 6.1 A long-lived task — `crates/core/src/isolated.rs`, `crates/core/tests/isolated.rs`

- `pub struct Serving { child, stdin: ChildStdin, lines: Receiver<String>, pid, started }` and `pub fn start_serving(task, input, limits) -> Option<Result<Serving, Ended>>`: spawns as `run_in` does (`command(program)`, `FLAG task input output`, `PARENT`, `unix_child`, the Windows job kept in the struct, stderr gathered, stdout read line by line on a thread) but with `stdin(Stdio::piped())`, and returns at once. `Serving::ask(&mut self, line: &str, deadline: Duration, told: &mut dyn FnMut(&str) -> bool, stop) -> Result<(), Ended>`: writes the line, then watches as `run_in`'s loop does, every 40 ms, handing lines to `told` until it returns `true` (the answer is complete), killing on `stop`, on the deadline, and when `resident` passes the memory; a child that has ended is `Ended::Failed` with what it said. `Serving::end(self)` closes stdin and kills (`kill`), `Drop` the same. `pub fn alive(&mut self) -> bool`.
- `serve()` runs a long-lived task the same way as the others (`task(name)` gives a `fn(&Path) -> Result<Vec<u8>, String>`; such a task returns when stdin ends, giving an empty answer); `end_with_parent` holds for it.
- Testing-only task `test-serve-echo`: for each line of stdin, tells `echo: <line>`. Tests: two asks answered by one process (its pid the same); `end` ends it within a second; an ask with `stop` set kills it and the next `start_serving` is a new process; a served child given `test-eat`'s appetite (a `test-serve-eat` that eats on its first line) is killed with `Ended::Memory`.

### 6.2 The server of pages — `crates/core/src/ocr/server.rs` (new), `ocr/child.rs`, `ocr/mod.rs`, `ocr/pages_cache.rs`

- The child's side, in `child.rs`: `pub(crate) fn serve_task(input: &Path)`: reads a `Job` (the file, Poppler, the language, the memory, a directory to write in), opens the file once (`Pages::open`), then for each line of stdin, `Request { id: u64, pages: Vec<usize>, width: u32 }`, draws the pages several at a time as `pages_at` (`child.rs:544`) does, but writes each PNG to `<dir>/<id>-<page>.png` and tells `{"id":…,"page":…,"file":…}`, or `{"id":…,"page":…,"failed":…}`, and `{"id":…,"done":true}` at the end; a stop is by being killed. Register the task `pdf-serve` in `isolated::task`.
- The parent's side, `server.rs`: `static SERVED: Mutex<Vec<Served>>`, `Served { key: String /* pages_cache::key_of */, serving: Serving, dir: TempDir, last_used: Instant, next_id }`; `MOST_OPEN = 2`, `IDLE = 90 s`. `pub fn draw(path, size, pdftoppm, work, pages: &[usize], width, stop) -> Result<Vec<(usize, Result<PathBuf, String>)>>`: finds or starts the served child of the file (the oldest let go past `MOST_OPEN`), asks, gathers the files, with a deadline of `layer::patience(size) + 20 s × pages`; an `Ended` of any kind ends that served child and is returned as the error. A reaper thread, started with the first server, ends those idle past `IDLE` every 5 s. `pub fn end_all()` for the application's close, called from `AppState`'s drop or `beforeClose` where the core has such a hook (look at how `ocr_stop` and the work registry end; where there is none, the children end with the parent by `end_with_parent`, which suffices).
- `pages_cache::put_file(root, key, page, width, from: &Path)`: moves the file into the cache (`rename`, a copy across file systems), keeping the bound as `put` does.
- `pages_at` (`mod.rs:1747`): where a program is set, the lacking pages go to `server::draw` first; each file given is `put_file` into the cache and read back; on an `Ended` that is not `Stopped`, the lacking pages are drawn each alone by the one-shot job, as the existing fallback does (the branch "the child ended without its answer"); where no program is set, the one-shot path in the process, as today.
- Tests in `ocr/view_tests.rs` or `tests.rs` with the test program (`CARGO_BIN_EXE_glaukopis-isolated`, as `tests/isolated.rs` finds it): two calls of `pages_at` for different pages of `porson.pdf` are served by one process; the second call takes less than a fifth of the first (measure both and write them down); a stopped call leaves no served child.

### Verify

- `cargo test --workspace`, `cargo clippy --workspace --all-targets`, capped.
- `e2e/viewer-speed.mjs` three times: *first* and *jump cold* against stage 3's numbers; expect *jump cold* near the time of drawing one page (tens of milliseconds) once the book is open. `e2e/file-view.mjs`, `e2e/sources.mjs` and `e2e/ocr.mjs` (which reads a PDF with Tesseract through the one-shot child, which must be untouched) pass.
- Watch the processes while the script runs (`ps --ppid <app pid>`): at most two served children, gone within two minutes of the last page.

Commit: *A file read in a view is kept open by a child that serves its pages, bounded as every child is and ended when idle.*

## Stage 7 — the words, the guide, the scripts, the record

### 7.1 The words and the languages

- Every key of *The words* in `en` and `nb`; `keys-close-side` changed in English and Norwegian and removed from the other languages (`scripts/prune-locales.mjs`); `pnpm test` (the check of the locales) and `e2e/languages.mjs` pass.

### 7.2 The guide — `docs/guide.md`, the section *A file in a view* (line 1328)

- Rewrite the section's opening and *Where a file is shown from* for the tabs: a file view shows the sources of a project in tabs, each remembering its place; whose sources (the project beside; kept when the map closes; following a new project; the window's own with no project at all); where a file is shown from (one rule now; the trees under the chevron; *Open again in a new tab*); the row of tabs, its plus and its menu; the keys (Ctrl+PageDown, Ctrl+PageUp, Ctrl+W, Ctrl+Shift+B); the path's cell (the project and the file); *Bookmarks and contents* (what a bookmark is, that it is of the file and the same in every project, that it stays on this computer; the file's own contents). *Editing an image* stays, with a sentence on tabs. The *Keys* section's place *In a file* gains the three keys.

### 7.3 The record

- An addendum to 0072, *as built*: what departs from the plan, the choices made alone, the measurements of stage 1 (baseline), stage 3 and stage 6 side by side, the encode times of 3.4, and the counts.

## At the end

- Run every e2e script this plan names, and `e2e/maps.mjs`, `e2e/as-left.mjs`, `e2e/tree-keys.mjs`, `e2e/list.mjs`, `e2e/files.mjs`, `e2e/library.mjs`, `e2e/documents.mjs`, `e2e/languages.mjs`.
- Report: what was built, stage by stage, with the commits; what was left and why; the table of the speed script's numbers before and after each stage; the counts of `pnpm check`, `pnpm test`, `cargo test`, and every e2e script with its ok/FAIL counts; the paths of the screenshots to look at.
