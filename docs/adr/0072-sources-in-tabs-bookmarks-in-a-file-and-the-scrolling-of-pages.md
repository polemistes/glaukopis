# 0072 — Sources in tabs, bookmarks in a file, and the scrolling of pages

Date: 2026-10-29. Status: accepted by the owner on 2026-10-29 ("Yes to all. Make the plan."), from their trial of the file view (a set of files connected to the project, chosen from tabs in the view, each tab remembering its place; bookmarks that belong to the PDF itself; nothing of it shared; the scrolling of pages lagging), an assessment with five things to confirm, their one question (whose tabs when no project is up) and its answer; to be built from `docs/plans/sources-in-tabs-bookmarks-and-the-scrolling-of-pages.md`. Amends 0069 (a file in a view: a file side belongs to no project; where a file is shown from; pages carried as base64), 0043 and 0070 (the files of the library: a file's record gains its bookmarks), and 0018 (PDFs read in a child process: a child may now live while a file is read in a view).

## Context

The owner writes with sources open beside the text: books and articles as PDFs, several at once, and several places in one. The file view of 0069 shows one file in a side; changing it means going to the library each time, and a place left in a file is lost when another is shown. They ask for a set of files connected to the project, selected from tabs in the view, the list and the place of each tab remembered; for bookmarks that belong to the PDF, the same in every project; and for the scrolling of pages, which lags behind other viewers, to be made quick. None of it is to be shared.

What was found:

- **The file side today.** A side of the window is a map side or a file side (`sides.svelte.ts`, `SideSpec`); a file side holds a file's hash, its page and its zoom, is kept with the arrangement in the settings, and belongs to no project. The viewer (`src/lib/viewer/`) draws the pages of the file one under another, the page in view the one at the middle (`PdfView.svelte`, `pages.ts`), and lays the text over them (`PageText.svelte`). The ways in (`show.ts`): from the library, a reference's files and the images, the active side; from a citation and the references tab, the other side; from Split view, the new side; from the trees under a side's chevron, that side.
- **Where the window keeps things.** The arrangement of the window is in the settings (`ProjectView.svelte`, `settings.set('arrangement')`, written 300 ms after a change). A project keeps a memory of how it was looked at, cameras, folding, where it was left, in its own record on this computer (`ProjectInfo.view`, `project_save_view`, `update_info` in `crates/core/src/projects.rs`), which no sharing carries. The library keeps a record of each file by its hash in `library/files.json` (`FileRecord`, `crates/core/src/library/files.rs`), on this computer alone, with its name, folder, origin, size and what it was made from. The router remembers the project or file shown last (`router.lastProject`).
- **The drawing of pages, measured.** The cache of pages drawn (`cache/pages`) held 116 pages at 1800 dots wide when looked at: the median page 1.7 MB as PNG, the largest 2.1 MB. Each page crosses the bridge as a data URL, so 2.2 MB of base64 inside a JSON reply, parsed by the page's own thread; a batch of about five pages is 11 MB of JSON. Each batch whose pages are not in the cache starts a child process that reads and parses the whole file before drawing (0.5 s for a book of 364 pages, by the measurement in 0069's addendum), so the pages of a book read for the first time show white and come late. The page keeps up to forty pages as strings (some 90 MB) and mounts the thirteen nearest, each a decoded bitmap of some 17 MB. Pages are drawn at a width rounded up to a step of 200 dots (`WIDTH_STEP`) and scaled at every paint; on Linux the compositor is the CPU one, since Skia's showed stale frames (0049). The text layer forces one layout per line when a page appears (`PageText.svelte`, a `getBoundingClientRect` after each transform reset). PNGs are written at the `image` crate's default compression (`colour_png`). The image editor already carries an image's bytes raw through the bridge (`file_edit_preview`, `tauri::ipc::Response`, shown through a blob URL), so the bridge can carry bytes without JSON. The writes of the settings are debounced and are not a cause.
- **The file's own contents.** The look at a PDF reads the outline the file carries of its headings, with the page each leads to (`Layer.outline`, `outline_of` in `ocr/layer.rs`, for the structure import of 0047), and `file_facts` already reads the look; the viewer shows none of it.

## Decision

### The tabs are the list

- **A file side shows tabs, each a place in a file**: a file of the library, a PDF or an image, the page and how far down it the view stands, and the zoom. The same file may stand in two tabs with two places. The files connected to a project are exactly the files its tabs show; there is no second list. Switching tabs is immediate, from the cache of pages drawn.
- **The tabs belong to a project**, and are kept in the project's own memory on this computer (`ProjectInfo`, beside `view`), with which tab is active. Nothing of them is written into the project's document, and no sharing carries them: a collaborator sees no tabs of yours, and the files are of this computer's library in any case. A tab whose file is no longer in the library says so, and is closed by hand.

### Whose tabs a file side shows

- **A file side belongs to a project and names it in the top row**: its cell shows the chevron of all projects, the project's name, small, and the file's name in bold, as a map side's cell names its project. The project's name opens that project in the other side, which is where its map stands when it is open.
- **It gets its project when it opens**: the project of the map side beside it; or, when a file is shown from the library with no map in the window, the project the window was last in (`lastProject`, now kept with the arrangement). **It keeps its project when the map side closes**, so that with only the PDF up the cell still names the project, the tabs are its, and a file added goes to it. **When a project opens in the other side, the tabs follow it**: the file side's project becomes that of the map beside it, and the cell names the new one. There is at most one file side of a project; a second request goes to the one there.
- **With no project at all** (a fresh installation, a file shown before any project exists), the side's tabs are the window's own, kept with the arrangement, and the cell names no project. Such a side that later gets a map beside it gives its tabs to that project and keeps none of its own.
- What the rule costs: one cannot read A's sources beside B's text. A file of A's that is wanted while writing B is added to B's tabs.

### Where a file is shown from

- **From the library, a reference's files, the images, the chooser of Split view, a citation and the references tab**: the file goes to the file side where there is one, as a new tab, or to its tab where it has one already; else the other side becomes a file side of the project beside it, in the place of what it showed; else, with no side at all, the first side. The file side gets the focus. A file shown from the library no longer takes the map's place: a source belongs beside the text.
- **From the trees under a side's chevron**: in that side, which becomes a file side of the project the side had, or keeps the one it has, with the file as a tab.
- **Open again in a new tab**, in a tab's menu, makes the second tab of a file; nothing else does.

### The tabs in the window

- **A row of tabs** above the viewer's bar: each tab the file's icon and name, the active one marked, a close mark on the active tab and on the one under the pointer, a plus at the end that opens the library's chooser of one file. Tabs are reordered by dragging and closed by the middle button. A row wider than the side scrolls sideways under the wheel. A tab's menu: *Close the tab*, *Close the other tabs*, *Open again in a new tab*, *Show in the library* (the files view at the file's folder and file), *Open in another program*.
- **Keys**: Ctrl+PageDown and Ctrl+PageUp go to the next and the previous tab (PageDown and PageUp alone still turn a page). Ctrl+W, which closes the side, on a file side closes the active tab, and the side with its last tab. Ctrl+Shift+B marks the place (below).
- **The place in the address** names the active tab's file and page, `#/file/<hash>?page=`, as today; opened at such an address, the window puts the file where the rules above put it.
- **An image in a tab** is shown and edited as today (0071); an edit kept puts the new file into the tab in the old one's place; switching tabs while an edit is unkept asks first, as changing the file does.

### Bookmarks, and the file's own contents

- **A bookmark is of the file**: the page, how far down it the top of the view stands, and a name, kept in the library's record of the file (`FileRecord.bookmarks`), by the file's hash, so that it is the same in every project, survives renaming and moving, and goes when the file is removed from the library. It keeps no zoom. It stays on this computer. A bookmark's name is given when it is made, the printed page number offered as the default, and can be changed later.
- **One button in the bar**, *Bookmarks and contents*, opens a list: *Mark this place* at the top, then the bookmarks in the order of their places, each going to its place on a press, with *Rename* and *Remove* in its menu; then, under *Contents*, the table of contents the file carries of its own headings, indented by depth, each entry going to the top of its page. A file without one says so.

### The viewer made quick

- **A page crosses the bridge as bytes**, one page to a call (`file_page`, a `Response`), shown through a blob URL and let go with the page: no base64, no JSON. At most four pages are asked for at once, the nearest to the view first.
- **Only the pages in view and two beside them stand in the document**; the pictures of up to forty are kept as blobs, not strings.
- **A page is drawn at exactly the width it is shown**, times the device's ratio, so that nothing is scaled when it is painted; drawn anew once the zoom has rested, as today, the old picture stretched meanwhile.
- **The file stays open while it is read.** A child process serves one file: started when its first page is asked for, it reads the file once and draws pages on request, several at a time, writing each as a file for the parent to take into the cache; bounded in memory as every child is, each request bounded in time, ended after a minute and a half without a request, killed when the one who asked stops, at most two files served at once. A child that dies has the pages asked of it drawn each alone by the one-shot job, as today, so that one bad page does not blank the others. Where no program is set, as in the tests, the work is done in the process.
- **The text layer measures its lines in one pass**, and **PNGs are written with fast compression** where that is measured quicker in all.
- **Measured before and after**, by a script that reads a book of three hundred pages: the time to the first page, the gaps between frames while scrolling, the pages passed without a picture, the time to a page jumped to, cold and from the cache. The numbers go in the addendum.

### What is not done

- No annotation of PDFs, no search within a file by the application, no printing (as 0069).
- No tabs shared between computers or people; no tabs of two projects at once; no second file side of one project.
- No zoom in a bookmark; no bookmarks on images.
- No scheme of the application's own for pages (`glaukopis://…`). It would serve too, but has three shapes of URL on three platforms, a handler to keep off the main thread, and nothing to tie a stop to; bytes through the bridge do the same with none of that. If the measurement shows the bridge itself to be the cost, the scheme is the next step.

## Choices made in writing this, which the owner has not been asked about

1. The cell of a file side names the project and the file, and no longer the file's folder; *Show in the library* in the tab's menu opens the files at the file's folder and file.
2. The project's name in the cell opens the project in the other side.
3. The keys: Ctrl+PageDown and Ctrl+PageUp for the tabs, Ctrl+W for the tab and then the side, Ctrl+Shift+B for a bookmark; adding a file has no key.
4. From the library, a file goes beside the map, not in its place; with two maps in the window, the file side takes the other side's place, as Split view's chooser does today.
5. The file side gets the focus when a file is shown in it, from wherever.
6. A place is the page at the top edge of the view and how far down it that edge stands, as fractions that hold across zooms and widths; the bar goes on saying the page at the middle.
7. A bookmark is named when it is made, the printed page number offered; the list orders bookmarks by place.
8. The contents list every entry of the outline that leads to a page, indented, up to two thousand, without folding.
9. Two files served at once, ninety seconds idle, four pages in flight, two pages beside the view mounted, forty kept.
10. A file side kept by an older arrangement becomes a side of no project with one tab.

## Why not otherwise

- **Not a set of files beside the tabs.** It would need its own adding and removing, a file in the set with no tab has no use, and the owner's description of the set is the tabs.
- **Not the tabs in the project's document.** They would travel to collaborators who have none of the files, and the owner wants nothing of this shared.
- **Not a file side without a project when one can be had.** Tabs that belong to nobody while a project is open, or to a project not named, are hidden state; the cell names the project.
- **Not the tabs following the focus.** They follow the project beside them, so that what is read is the sources of what is written.
- **Not the bookmarks in the project.** A bookmark is a place in the file, the owner says, and must be there from every project.
- **Not PDF.js, not the engines' viewers, not drawing in the application's process** (0069 still holds).
- **Not a child for every request** (as now): the file is parsed again each time, which is the half second a book costs before its first page.

## Consequences

- `FileSide` becomes a side of a project with its tabs in the project's record, or of no project with its own; `Arrangement` gains `lastProject`; `Sides` gains the tabs' acts and the rule by which a file side follows the map beside it; every way in goes through one rule. `ProjectInfo` gains `sources`; `FileRecord` gains `bookmarks`; `FileFacts` gains the outline; `file_pages` gives way to `file_page`, which returns bytes.
- In the viewer: a row of tabs, a list of bookmarks and contents, places per tab, pages as blobs, exact widths, fewer pages mounted. In the core: a served child (`ocr/server.rs`), a long-lived task of `isolated.rs`, pages taken into the cache from files. The contract's types, the e2e scripts of the file view and the image editor, the guide's section *A file in a view* and the key sheet change with them. Projects' documents and the library's store are untouched.
