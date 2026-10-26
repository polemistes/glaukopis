# A file in a view — the build plan

The working plan for `docs/adr/0069-a-file-in-a-view.md`. Read the record first, in full: it says what and why, and what was found out; this says how, in which order, in which files, and how each stage is verified. Where they disagree, the record wins; say so in your report. Read also `.claude/briefs/common.md` (the progress note, the languages, the rules) and `docs/plans/the-shape-of-a-text-and-its-org-form.md`, section "How to work", which holds here too: plain words; never a record number when talking to the owner; verify before you commit; edit then format (batch your edits of a file before `pnpm format` or `cargo fmt`); e2e with `timeout`, processes ended by PID only, never `pkill -f`; commit when a stage is whole, never push; report the counts. Commit at the end of every stage and more often where a stage is long: work that is not committed is lost when the session is. Keep a progress note as `common.md` says. Build the binary and run `cargo test` only in a capped `systemd-run` unit, as `.claude/briefs/fewer-words/common.md` shows (the memory of this machine is shared with the owner's editor).

Read the last section of `docs/brief.md` (2026-10-26, *a file in a view*): it is the owner's words, and the record is read from them. Nobody answers questions while you build: where something is open, choose the plainer thing, write the choice down in your progress note and your report, and go on. The record's "Choices made in writing this" lists what the owner has not been asked about; build to the record.

## Vocabulary

- *A side*: one of the one or two panes of the window (`ProjectView.svelte`, `SideView.svelte`), kept as a `SideSpec` in `sides.svelte.ts`. *A map side* shows a project at an element; *a file side* shows a file of the library or an image of the store. *The active side* has the focus.
- *The viewer*: what a file side shows, `src/lib/viewer/` (new).
- *A page at a width*: a page of a PDF drawn by the core in colour, so many dots wide, as PNG.
- *The lines of a page*: the text the PDF has on a page, as lines with their places in points (`ocr/text.rs`, `Line`), as translated by the schemes where any applied.

## The words

Every word the user sees comes through `t('key')` from `locales/en/<part>.ftl` and `locales/nb/<part>.ftl`; write English and Bokmål together, in the same plain voice (`.claude/briefs/words.md` has the glossary). The viewer's words go in a part of their own, `viewer.ftl`; the items in other parts at the end of their files under a comment naming this plan. No help texts: the labels speak for themselves.

```
viewer.ftl
viewer-file = File                                        | Fil
viewer-page-of = Page { $page } of { $count }             | Side { $page } av { $count }
# The number the page has in print, where it differs from its count: shown after the count, small.
viewer-printed = ({ $label })                             | ({ $label })
viewer-go-to-page = Go to page                            | Gå til side
viewer-zoom = Zoom                                        | Zoom
viewer-fit-width = As wide as the view                    | Så bred som visningen
viewer-zoom-percent = { $percent }%                      | { $percent } %
viewer-not-drawn = This page could not be drawn: { $why } | Denne siden kunne ikke tegnes: { $why }
viewer-not-found = The file is no longer in the library.  | Filen er ikke lenger i biblioteket.
viewer-locked = The file asks for a password, and cannot be shown. | Filen ber om et passord og kan ikke vises.
viewer-not-shown = This kind of file cannot be shown here: open it in another program. | Denne typen fil kan ikke vises her: åpne den i et annet program.
viewer-loading = Opening the file…                        | Åpner filen …
viewer-text-coming = The text of the pages is being read… | Teksten på sidene leses …

files.ftl
files-show = Show                                         | Vis
files-open-elsewhere = Open in another program            | Åpne i et annet program

pictures.ftl
pictures-show = Show                                      | Vis

project.ftl
project-beside-file = A file of the library…              | En fil fra biblioteket …
project-beside-file-title = Beside: choose a file          | Ved siden av: velg en fil
project-show-file = Show the file                         | Vis filen
project-show-file-named = Show “{ $name }”                | Vis «{ $name }»
# The head line of the document pane while the active side shows a file: the document of the other side.
project-document-of-other = The document of the other side | Dokumentet på den andre siden

keys.ftl
keys-place-viewer = In a file                             | I en fil
keys-viewer-next = Next page                              | Neste side
keys-viewer-previous = Previous page                      | Forrige side
keys-viewer-first = First page                            | Første side
keys-viewer-last = Last page                              | Siste side
```

The zoom keys of the typesetting pane (`preview-zoom-in`, `preview-zoom-out`, `preview-zoom-fit` in `shell/keys.svelte.ts`, Ctrl++, Ctrl+-, Ctrl+0) serve the viewer too, with the place *In a file* added to their rows in the key sheet; do not bind new keys for them.

## Stage 1 — the core: pages at a width, the lines of a page, a cache

### 1.1 Pages at a width, in colour — `crates/core/src/ocr/drawing.rs`, `ocr/child.rs`, `ocr/mod.rs`

- `Pages::at_width(&self, index, wide: u32, dir, stop) -> Result<Vec<u8>>`: a page drawn `wide` dots wide, in colour, as PNG. With hayro: `render_dimensions`, the scale `wide / width`, `RenderSettings` as `draw_with_hayro` sets them, the RGBA kept as RGB and written as PNG with the `image` crate (`RgbImage`, `write_to`), within `catch_unwind` as every drawing is. With Poppler: `pdftoppm -png -r <dpi> -f n -l n` as `small` does it, but not `-gray`. The longest side bounded as `small_size` bounds it (`LONGEST`); a width over the bound is drawn at the bound and scaled by the page.
- `child::Task::PagesAt { pages: Vec<usize>, width: u32 }` and `Done::PagesAt(Vec<(usize, Result<String, String>)>)`, carried in base64 as `Pictures` are; drawn several at a time as `pictures()` does, with `at_once` from the dots of a page at that width.
- `pub fn pages_at(path, tools, work, pages: &[usize], width, stop) -> Result<Vec<(usize, Result<Vec<u8>, String>)>>` beside `pages_pictures`, decoding the base64 back to bytes.

### 1.2 The cache of pages — `crates/core/src/ocr/pages_cache.rs` (new)

- Under the data directory, `cache/pages/<key>/<page>-<width>.png`, the key a hash of the file's path, size and time of change (as `seen_of` tells a file). `pub fn get(root, key, page, width) -> Option<Vec<u8>>` and `pub fn put(root, key, page, width, bytes)`.
- Bounded: 200 MB in all. After a `put` that passes the bound, the oldest files by time of change are removed until under 150 MB; a missing or damaged file is drawn again, never an error. A directory that cannot be written is told once in the log and the viewer goes on without a cache.
- A unit test with a temporary root: the bound holds, the oldest go first.

### 1.3 The lines of a page — `ocr/mod.rs`

- `pub struct PageLines { number, label, width, height, lines: Vec<Line>, translated: bool }`; `pub fn page_lines(path, index) -> Result<PageLines>` from `seen_of`'s layer: `best_lines(index)` (translated where the schemes applied, else the page's own), the size from `layer.sizes`, the label from `layer.label`. A page without text gives no lines. Nothing is read anew: `seen_of` keeps the file.
- `pub fn file_facts(path, tools) -> Result<FileFacts { pages, sizes: Vec<(f32, f32)>, labels: Vec<String>, locked, picture }>` for the viewer's first need. Measure it on `e2e/fixtures/structure.pdf` and on the largest PDF of the core's fixtures: where `seen_of` takes over a second for a file of a few hundred pages, give the facts from the child instead (a `Task::Facts` that opens the file and gives the count and sizes, the labels from the layer only when it is there), so that the pages show before the text is read. Write what you measured in the report.

### 1.4 The commands — `src-tauri/src/commands/files.rs` (or a new `commands/viewer.rs`), `lib.rs`, `src/lib/api/viewer.ts` (new)

- `file_facts(hash) -> FileFacts`, `file_pages(hash, pages: Vec<usize>, width: u32, ticket: Option<String>) -> Vec<PageAt { number, png: Option<String> /* data URL */, failed: Option<String> }>` (the cache asked first, the lacking drawn in one child run, then put), `file_page_lines(hash, page) -> PageLines`. The path from the hash as `file_path` finds it (`record_path`, `attachment_path`); a hash not in the store is `not-found`. Register the commands; `cargo test -p glaukopis contract` writes the page's types.
- `api/viewer.ts`: `fileFacts`, `filePages`, `filePageLines`, with the types.

### Verify

- `cargo test -p glaukopis-core` in a capped unit, with new tests: a page of `fixture::porson_pdf()` drawn at 600 wide is a PNG in colour of that width; the cache's bound; `page_lines` of the porson fixture gives lines with places within the page.
- `cargo clippy -p glaukopis --all-targets`, `pnpm check`.

Commit: *Pages of a PDF drawn at a width in colour, with a cache, and the lines of a page with their places, for a file shown in a view.*

## Stage 2 — a file side in the window

### 2.1 The sides — `src/lib/project/sides.svelte.ts`

- `SideSpec` becomes `MapSide | FileSide`:
  ```ts
  interface MapSide { kind: 'map'; key; project; at; mode; outline; fresh? }
  interface FileSide { kind: 'file'; key; file: string /* the hash */; page: number; zoom: number | null }
  ```
  `readSide` gives `kind: 'map'` to a kept side that names a project and `'file'` to one that names a file; `arrange` takes an `exists` for files too (`(project) => boolean` becomes `{ project, file }` or two functions); `toKeep` writes both kinds. The type makes the compiler find every use of `.project`, `.at`, `.mode` on a side: go through them all (`ProjectView.svelte`, `SideView.svelte`, `SideBar.svelte`, `Path.svelte`, `document-pane.svelte.ts`, `panes.svelte.ts`, `side-api.svelte.ts`, `open-projects.svelte.ts`, `shell/keys.svelte.ts`, the list's "shown" marks in `home/`, the tests), and give each its rule from the record.
- New: `openFile(file, page = 1)` (in the active side, in the place of what it showed; the first side where there is none), `besideFile(file, page = 1)` (the other side, which opens where there is none; the other side gets the focus), `setPage(key, page)`, `setFileZoom(key, zoom)`. `bothWays` and `closeProject` do nothing for a file side; `across` counts projects of map sides only.
- `sides.svelte.test.ts`: a file side opened, kept and laid out again; left out when its file is gone; `across` with a file side.

### 2.2 The place — `src/lib/state/router.svelte.ts`, `src/App.svelte`, `ProjectView.svelte`

- `Route` gains `{ view: 'file'; file: string; page?: number }`, written `#/file/<hash>?page=<n>`. `App.svelte` shows `ProjectView` for `file` as for `project`. In `ProjectView`, the effect that makes the place follow the active side writes `file` for a file side (its page), and the effect that shows a place gone to opens a file side with `sides.openFile` where the active side is not that file, else sets its page. `router.lastProject` is untouched by a file side.

### 2.3 The window — `ProjectView.svelte`, `Path.svelte`, `SideView.svelte`, `SideBar.svelte`, `document-pane.svelte.ts`

- **The cell of a file side**: `Path.svelte` gets a branch for a file side, or a small `FilePath.svelte` beside it: the chevron of all projects (as today, opening a project in this side), the folder of the file in the library, small, with the folder icon, opening the files view at that folder (`router.go({ view: 'files', folder })`), the file's name in bold with the `FileText` icon, and the page as `viewer-page-of`. The name and the folder come from `filesList`'s records (`files/store.svelte.ts`); where the file is not in the store, `viewer-not-found` in the cell. The × closes the side as today.
- **The side**: `SideView.svelte` branches on `spec.kind`: a file side renders `viewer/FileSide.svelte` (2.4) with its own bar, and registers a `SideApi` with `el` and `focus` and no `show`; every key of the tree, the views and writing in `shell/keys.svelte.ts` that reaches a side through `sideApis` or `active.mode` does nothing where the active side is a file (check each; none may throw). `SideBar.svelte` is not rendered for a file side.
- **The document pane**: the `DocumentPaneHost` in `ProjectView` gives the nearest map side: the active side where it is a map, else the other side where that is a map, else none. While it gives the other side, the pane's head line says `project-document-of-other` under the document's name. While it gives none and the pane is open, the pane closes (`panes.document = false`), and the Document button of a map side opens it again as today. The typesetting pane keeps its side by key; a file side never has the key.
- **The Split view menu**: `project-beside-this` and `project-beside-element` disabled while the active side is a file; `project-beside-file` added after `project-beside-project` (stage 4 fills it).
- **Open projects**: `shownIds` and whatever else lists the projects of the sides take map sides only.

### 2.4 The viewer — `src/lib/viewer/` (new)

- `FileSide.svelte`: the bar (`ViewerBar.svelte`) and the view: for a PDF `PdfView.svelte`, for an image `ImageView.svelte`, for a kind that cannot be shown an `EmptyState` with `viewer-not-shown` and *Open in another program*; while the facts are fetched, `viewer-loading`; `not-found` from the core gives `viewer-not-found` with a button to close the side; a locked file `viewer-locked`.
- `PdfView.svelte`: the pages one under another, each a box of the page's size at the zoom, scrolled; the page in view is the one at the middle of the side (`setPage` as it changes); pages are fetched for those in view and around them (model the keeping on `PreviewPanel.svelte`: at most forty kept, those nearest the view, the ones around the view fetched with it; where a function of the pane can be shared without change, move it into `preview/pages.ts` and import it in both, otherwise write the viewer's own and do not touch the pane). The width asked for is the page's shown width in device pixels (`devicePixelRatio`), rounded up to a step of 200 so that the cache serves a zoom that changes a little; a page that failed shows `viewer-not-drawn` in its box. The zoom: `null` fits the width of the side (as the pane's does), else a factor of the size on paper (`PX_PER_PT`, `clampZoom`, `stepped` of `preview/zoom.ts`); Ctrl+wheel zooms about the pointer as the pane does. Keys, on the side's element: PageDown/PageUp one page, Home/End first and last, Ctrl++/−/0 the zoom; `viewer-next` etc. registered in `shell/keys.svelte.ts` with the place `viewer`, bound, so that the key sheet lists them.
- `ViewerBar.svelte`: `viewer-page-of` with the printed label after it where it differs (`viewer-printed`); a field that goes to a page by its printed label or its count (Enter); the zoom as the pane's menu has it (`ZOOMS`, `viewer-fit-width`).
- `ImageView.svelte`: the image at its size or fitted, zoomed with the same keys; read with `pictureRead` for an image of the store and `file_read` (`api/system.ts`, exists) for an image among the files, shown through a Blob URL, revoked on destroy.
- `viewer.svelte.ts`: the state per side key: facts, pages kept, the page in view, what is being fetched; cleared when the side closes.

### Verify

- `pnpm check`, `pnpm test` (the sides' tests, a test of the page-keeping where it is a pure function).
- `e2e/file-view.mjs`, new, first half: take `e2e/fixtures/structure.pdf` into the library through the command the files script uses (`files_take_in` by `__TAURI_INTERNALS__.invoke`), open a project, then through a test hook `__glaukopisViewer.show(hash)` (the file in the active side; stage 4 gives the real ways in) show the file: the cell says its name, the bar says *Page 1 of N*, pages are drawn (an `img` with a `data:` source in the first page's box), PageDown turns to page 2, the zoom keys change the page's width, the place is `#/file/<hash>?page=2`. Close the side with its ×: the start screen or the other side, and nothing of a map reappears. Open the project from the list in the active side, then `__glaukopisViewer.beside(hash)`: two sides, the file in the second with the focus. Relaunch the app with `keepData` as `e2e/as-left.mjs` does: the two sides come back, the file at its page. Screenshots `file-view-1-pdf`, `file-view-2-beside`, `file-view-3-as-left`. `e2e/maps.mjs`, `e2e/as-left.mjs`, `e2e/tree-keys.mjs`, `e2e/list.mjs` still pass.

Commit: *A side of the window shows a file of the library: its pages drawn by the core, turned with the keys, kept with the window.*

## Stage 3 — the text over the pages

- In `PdfView.svelte`, after a page's picture is there, its lines are fetched (`filePageLines`) and laid over the page as `PreviewPanel.svelte` lays its lines: each line a box in percent of the page, from `left`, `top`, `right`, `bottom` in points against the page's size, its runs following one another, the size of type from the line's height, so that the browser selects and copies a line as one line, and a selection across lines copies them in order. The text is transparent over the picture (as the pane's is), `user-select: text`, the picture `draggable="false"` and not selectable. A page without lines shows its picture alone. While the lines of a large file are not there yet, nothing is said on the page; where `file_page_lines` says the file's text is still being read, the bar shows `viewer-text-coming` small until it is.
- Translated lines (the schemes of 0044) are what `best_lines` gives: what is copied is letters.

### Verify

- `e2e/file-view.mjs` grows: on page 1 of `structure.pdf`, select the text of the first page's lines through a `Range` over its text layer and read `getSelection().toString()`: it holds the words the fixture's first page holds (read them from the fixture's expected text in the core's tests or `e2e/fixtures`); Ctrl+F of the browser is not driven, but the layer's text is in the page. Screenshot `file-view-4-text` with a selection shown.

Commit: *The text a PDF has lies over its pages in the view, to be selected and copied.*

## Stage 4 — the ways in

- **The files of the library** (`files/FilePane.svelte`, `files/FilesView.svelte`, `files/FileList.svelte`): the first action of a file's pane becomes `files-show` with the `Eye` icon (lucide), the old *Open it* becomes `files-open-elsewhere` with `ExternalLink` under it; `onopen` of the list (Enter, double-click) shows instead of opening elsewhere. Showing: `viewing.showFile(hash)` on the window's bridge (`Viewing` in `ProjectView.svelte`; add `showFile` and `besideFile`), which opens the file in the active side (`sides.openFile`) and goes to the place `file`; where the window has no side (the start screen was the last place), the file opens as the first side. An image among the files is shown the same way.
- **The pane of a reference in the library** (`library/ReferencePane.svelte`, the list `reference.files`): each file row's press shows it (`viewing.showFile`), and its menu has `files-open-elsewhere` and *Show in folder* as today.
- **The images** (`pictures/PicturePane.svelte`): `pictures-show` among the actions, showing the image in the active side.
- **Split view** (`ProjectView.svelte`): `project-beside-file` opens a chooser of one file by name, modelled on `files/FileChooser.svelte` (give it a `single` mode, or a small list of its own with the same search), titled `project-beside-file-title`; the file chosen goes to `sides.besideFile`.
- **A citation's editor** (`editor/CitationEditor.svelte`, `CitationItem.svelte`): for each item whose reference has files (`libraryGet(id)` → `files`, fetched when the editor opens, cached for its life), a button `project-show-file` where there is one file, or a menu of `project-show-file-named` per file where there are several; it calls `viewing.besideFile(hash)`.
- **The references tab of the document pane** (`project/ReferencePanel.svelte`): in the row's menu, `project-show-file` (or the named items) where the work has files, the same way.
- A PDF dropped on the window goes on being taken into the library, as today.

### Verify

- `e2e/file-view.mjs` grows: from the files view, double-click the row of `structure.pdf`: the window comes back with the file in the active side. Add a reference, attach the file to it (`attachment_add` through `invoke`, as the library script does), cite it in the text of an element, open the citation's editor (Enter on the citation), press *Show the file*: the file in the other side, the text still in the first. In the library's pane of the reference, press the file: the active side. Split view → *A file of the library…* → choose by name → the new side. Screenshots `file-view-5-from-citation`, `file-view-6-chooser`. `e2e/files.mjs`, `e2e/library.mjs`, `e2e/documents.mjs` still pass (their expectations of *Open it* and `onopen` must be updated where they drove the old items).

Commit: *A file is shown from the library, from a reference, from the images, from Split view and from a citation.*

## Stage 5 — the guide, the keys, the record

- `docs/guide.md`: a section *A file in a view* after *The document pane*: what a file side is, where it is shown from (the three rules), the bar, the keys, the text that can be copied, that closing the side closes it and a map is opened as maps are; the row of PDF in the table under *The files of the library* (*Show*; *Open in another program*; *Make searchable…*; *Import the text as a map…*), and the images' *Show*. The *Keys* section: the place *In a file*.
- The key sheet (`keys.ftl`, `shell/keys.svelte.ts`): the viewer's keys with their place.
- `e2e/languages.mjs` for Norwegian; `scripts/prune-locales.mjs` where keys were removed.
- An addendum to the record, *as built*, naming what departs from the plan and the choices you made alone.

## At the end

- Run every e2e script this plan names, and `e2e/maps.mjs`, `e2e/as-left.mjs`, `e2e/tree-keys.mjs`, `e2e/list.mjs`, `e2e/files.mjs`, `e2e/library.mjs`, `e2e/documents.mjs`, `e2e/languages.mjs`.
- Report: what was built, stage by stage, with the commits; what was left and why; the measurements of 1.3 and of a page drawn at 1600 wide (first time and from the cache); the counts of `pnpm check`, `pnpm test`, `cargo test`, and every e2e script with its ok/FAIL counts; the paths of the screenshots to look at.
