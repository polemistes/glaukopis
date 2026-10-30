# 0069 — A file in a view

Date: 2026-10-26. Status: accepted by the owner on 2026-10-26 ("great, do it"), from their question whether a PDF could be shown in a view instead of a map, an assessment, and their three resolutions of it (a view shows a map or a file, and a file view is tied to no map; no File button, the file shown from the library, a reference or the images window, from Split view in the new view, from a citation in the other view; no connection kept between a PDF and the map made from it; closing a file view closes the view, and the map does not reappear); to be built from `docs/plans/a-file-in-a-view.md`. Amends 0063 and 0064 (the sides: a side may show no project), 0043 (the files of the library: a file is shown in the window), 0018 and 0061 (the drawing of pages: at the size shown, in colour), 0044 (the text a PDF has: laid over its pages to be copied).

## Context

The owner asks for a PDF viewer that can be in a view instead of a map: to read a source beside the text one writes, without leaving the application.

What was found:

- **The window and its sides.** The window shows one or two sides (`sides.svelte.ts`, `SideView.svelte`), each a project at an element, as diagram, text or timeline; the active side is the one with the focus. Three things read the active side's project: the path at the top (`Path.svelte`, one cell a side), the document pane (`document-pane.svelte.ts`, "the document of the active side"), and the keys of the tree. The typesetting pane shows the side whose button was pressed and does not follow the focus (`panes.typesetting`, a side's key). The place in the address follows the active side (`#/project/<id>/<element>?mode=`), and the window's arrangement, the sides and the panes, is kept in the settings and laid out again at the start (`arrange`, `toKeep`). The Split view menu offers *This element, as diagram and text*, *Another element…*, *Another project…*, and with two sides *Switch sides* and *One at a time*; the × of a side stands in its cell of the top row. The library, the files and the images are views of their own in the shell (`App.svelte`), in the window's place, and come back to it by the rail.
- **Files, and how they are opened today.** The library keeps the files in a store by their hash, each in a folder, each belonging to references or none (`api/files.ts`, `FileView`; a reference's `files` as `StoredFile`). A file is opened in another program: *Open it* in the pane of a file (`FilePane.svelte`, `attachmentOpen`), Enter or a double-click on a row of the files (`FileList`'s `onopen`), and the files listed in the pane of a reference in the library (`ReferencePane.svelte`). The references tab of the document pane lists the works cited with a clip where they have files, and opens the reference's form; the form lists no files. A citation in the text opens its editor (`CitationEditor.svelte`), one item a work, each knowing its reference's id; the library gives a reference with its files by that id (`libraryGet`). The images of the store are shown in their own view with a pane of one image (`pictures/PicturePane.svelte`), and read by hash (`pictureRead`).
- **The drawing of pages.** The core opens a PDF with a renderer of its own, hayro, and with Poppler's `pdftoppm` where hayro cannot (`ocr/drawing.rs`, `Pages`), and draws pages in a child process bounded in time and memory (`ocr/child.rs`, `isolated.rs`): for Tesseract in grey at the quality asked, and for the strip of the reading's window small, grey, a given width (`Task::Pictures`, `Pages::small`, up to a hundred at a time, carried as PNG in base64). Each call of the child starts a process and opens the file anew. The core knows the size of each page in points, and the number each page has in print (`Layer::labels`, `label(index)`: *xiv*, *A-3*). A file is bounded to what `checked_pdf` takes; a locked file has its pages drawn where it opens without a password.
- **The text of a page, with its places.** Looking at a PDF (`seen_of`, `look`) reads the text of every page as lines with their places on the page in points, their style and their runs (`ocr/text.rs`, `Line`: `left`, `right`, `top`, `bottom`, `runs`), as translated by the schemes where any applied, with the pages' sizes; one file is kept at a time (`KEPT`), read again when another is looked at. The typesetting pane lays the lines of its pages over the drawn page, in percent of the page, one line a box with its runs, so that the browser selects and copies them as lines (`PreviewPanel.svelte`, `Line`). The pane keeps the pages nearest to what is looked at, forty at most, and fetches those around the view with it (`KEPT`, `documentPreviewPages`); its zoom is a factor of the size on paper, or the width of the pane (`preview/zoom.ts`), kept with the arrangement.
- **The engines.** WebKitGTK, WebView2 and WKWebView could each show a PDF in a frame, each in its own way, with no say over the page shown and no way to tie a selection to anything. Not used.

## Decision

### A view shows a map or a file

- **A side of the window shows a project at an element, as today, or a file of the library.** A file side belongs to no project. It has its own × in the top row and closes as any side does, and nothing of a map stays with it: to see a map again one opens it as maps are opened, from the list, in any side, and the project opens where it was left.
- **No File button.** Diagram, Text and Timeline belong to a map. The bar of a file side holds what a file needs: the page in view and the number it has in print, *Page 3 of 271*, a field to go to a page, the zoom (the steps of the typesetting pane, and the width of the side), and nothing of the writing tools, the typesetting or the document.
- **What the path says.** The cell of a file side in the top row shows the chevron of all projects, then the file's folder in the library, small, and the file's name, in bold, with its page. The folder opens the files of the library at that folder; the name does nothing. A file that no longer exists in the store is said so in its cell, and the side offers to close.
- **The document pane and the typesetting pane are of maps.** With a file side active, the document pane shows the document of the other side where that is a map, and its head line names it; with no map side open, it is closed. The typesetting pane shows the side whose button was pressed, as today; a file side has no such button. The keys of the tree, of the views and of writing do nothing on a file side; the keys of pages and zoom act on it.
- **The window remembers a file side** as it remembers a map side: the file, the page and the zoom, laid out again at the start where the file is still in the store, left out where it is not. The place in the address names a file side as `#/file/<hash>?page=`, and the window shows it as it shows a project.
- **Images too.** A file side shows a PDF, page by page, or an image of the library's files or of the store of images, as one page.

### The viewer

- **Pages are drawn by the core**, in colour, at the width they are shown, those nearest to the page in view first, and kept as the typesetting pane keeps its pages: forty at most, those around the view fetched with it. The core draws them in the child process with bounds, as it draws every page, several at a time; and keeps what it drew in a cache on disk, by the file, the page and the width, bounded in size and cleared oldest first, so that turning back is immediate. A page that cannot be drawn says why in its place, and the others are drawn all the same.
- **The text lies over the pages**, as it does in the typesetting pane: the lines of the text the PDF has, at their places, as translated by the schemes where any applied, so that words can be selected, copied and searched for with the browser's own means. A page without text, a scan, shows its picture alone; the file's pane says *Make searchable…* for that already.
- **Moving about.** The pages stand one under another, scrolled; PageDown and PageUp turn a page, Home and End go to the first and the last, the field goes to a page by its printed number or its count, and the zoom has the keys of the typesetting pane. The page in view is the one at the middle of the side.

### Where a file is shown from

- **From the library's files**: a double-click or Enter on a file shows it, and ***Show*** at the head of the file's pane, where *Open it* stood; *Open it* becomes ***Open in another program***, below. From the files of a reference in the library's pane of a reference, the same. From the images: *Show* in the pane of an image. These show the file **in the active side**, in the place of what it showed, and bring the window back, as choosing a project in the list does.
- **From Split view**: ***A file of the library…*** beside *Another project…*, choosing among the files by name, shows the file **in the new side**; the file chooser of the library serves for it.
- **From within a map**: a citation's editor offers ***Show the file*** for each work that has files, with the file's name where it has several; and the row of a work in the references tab of the document pane offers the same in its menu. These show the file **in the other side**, which opens where there is none, so that the text one writes never gives way to the source one reads.
- **From a file dropped on a side**: a PDF dropped on the window is taken into the library, as today, and nothing more.

### What is not done

- No connection is kept between a PDF and the map made from it: the mark where a page began stays a number in the text. The owner sees no use for it.
- A citation does not open its page: printed numbers and the order of pages do not always agree. Later, if wanted.
- No annotating, no searching within the file by the application (the browser's own search serves on the pages shown, and the text is searched when the file is read into a map), no printing.

## Choices made in writing this, which the owner has not been asked about

1. Showing is an act, not the selection: a double-click, Enter, or *Show* at the head of a file's pane; selecting a file still opens its pane, where it is renamed and moved.
2. From the library and the images, the file takes the active side; from a citation and from the references tab, the other side; from Split view, the new side. The owner gave the three rules; which of them the references tab follows is my choice (the other side, being within a map).
3. The page in view is the one at the middle of the side, and the window keeps the page and the zoom of a file side.
4. Pages are drawn in colour at the width shown, in the child process as every page is, with a cache on disk; the viewer does not hold the file open itself.
5. The text of a page is laid over it from the core's reading of the file, as translated by the schemes, so that what is copied is letters; where the reading of a large file takes a while, the pages are shown first and the text comes after.
6. A locked PDF that opens without a password is shown; one that asks for a password is not, and says so.
7. The cell of a file side shows the folder and the name; nothing opens from the name.
8. Images are shown by the same side, as one page, since the cost is small and the owner named the images window among the places a file is shown from.
9. The keys of pages (PageUp, PageDown, Home, End) and of zoom (those of the typesetting pane) are the viewer's; no new key is bound.

## Why not otherwise

- **Not the file tied to a side's project.** It was proposed so that the path and the panes had something to show, and the owner found it confusing. The panes have their rule instead.
- **Not a File button among the views.** The views are of a map; a file is not a way of showing a map.
- **Not the engines' own viewers in a frame.** Three behaviours, no control of the page, nothing to tie a selection to.
- **Not a PDF library in the page** (PDF.js). A second renderer, two megabytes, where the core draws pages already and has their text.
- **Not drawing in the application's own process.** A page can take the process down or eat its memory; the child with bounds is there for that.
- **Not the page marks opening the PDF.** Enticing, and of no real use, the owner says.

## Consequences

- `SideSpec` becomes one of two kinds, and every use of a side's project is made to handle a file side (the compiler finds them); the route gains `file`; the shell shows the window for it.
- A viewer in `src/lib/viewer/` (the side, its bar, the pages, the text over them, the keys); the core gains the drawing of pages at a width in colour with a cache, and a command for the lines of a page with their places; the library's files, the pane of a reference, the images, the Split view menu, the citation editor and the references tab gain their items.
- Words in a part of their own, `viewer.ftl`; a section of the guide, *A file in a view*; an e2e script that shows a PDF and an image, turns pages, copies text, keeps the window and comes back to it.
- Nothing of the model changes; projects and the library are as they were.

## Addendum, 2026-10-26: as built

Built the same day: the core by an agent in a worktree (the drawing of pages at a width in colour, the cache, the lines of a page, the facts of a file, the commands `file_facts`, `file_pages`, `file_page_lines`), merged as ce3fb0ff; the window, the viewer, the ways in and the guide on main. What departs from the plan, or was settled in the building:

- **Measured**: the facts of a file come from the child in under 0.1 s for a small PDF and 0.5 s for a book of 364 pages; a page at 1600 dots takes some 40 ms through the child the first time and well under a millisecond from the cache; the lines of a page under a millisecond once the text is read. The pages show before the text is read, as the plan allowed.
- **The facts come from the child**, so that the sizes are those of the pages as drawn (cropped and turned), and files only Poppler opens are shown too; their pages are not known to be turned, and their text may then lie wrong.
- **An image of the store** is found by its hash where the library has no file of it: the page tries the library, then the store. An image among a project's images is shown beside the map, as from within a map; one of the store's images in the active side.
- **The page is said by the bar alone**: the path over the side names the folder and the file, and not the page twice.
- **The keys of a page** are bound where the pointer is over the pages or the focus is in them, as the typesetting pane's zoom keys are; where two views bind the same key, the later that can act now takes it, else the earlier (a change to the key dispatcher, which before gave up when the later could not act).
- **A line of the text ends in a break**, as in the typesetting pane, so that lines copied together come out as lines.
- **The file chooser** gained a mode for one file, taken at once, of the kinds that can be shown.
- **The e2e harness** knows PageUp and PageDown, and the script acts through a hook for the ways in that pass through a native dialog or a double-click on a list, as the other scripts do.
- *Open it* was renamed *Open in another program* everywhere, and its old words removed from every language.

## Addendum, 2026-10-27: the zoom, and the trees under the projects

The owner found the zoom narrow and the wheel unsteady: the pages flickered and moved about, and an image kept its top left corner rather than the place under the pointer. Changed the next day:

- **About the pointer.** A turn of the wheel zooms about the point under it, which stays over the same place of the same page, sideways as well as up and down; the keys, the menu and the field zoom about the middle of the view. The view is laid out at once, before the next turn can read a half-moved one, and the pages are drawn anew by the core only once the zoom has rested a quarter of a second, the pictures drawn before being stretched meanwhile; a page drawn before is swapped only once its new picture is decoded, so that it never goes blank.
- **A wide range, by a ladder.** A file zooms between 5 % and 800 %, kept to a thousandth; the keys go by rungs of a ladder with 100 % on it and six rungs to each doubling; the wheel by a factor for each pixel it turns, a mouse's notch near a rung and a touchpad's small turns as small as they are, never more than a quarter in one turn. The menu offers an eighth, a quarter, a half, one, two and four times. A field in the bar shows the percent and takes any, with or without the sign, a comma as a point. The typesetting pane keeps its own range and tenths.
- **An image fitted whole**, as small as that takes, in the middle of the view while it is smaller than the view, scrolled from its corner once larger; the fit may lie below the least zoom.
- **The files and the images under the projects.** The tree of all projects, which the chevron over a side opens, has under it a rule and two trees folded until opened: *Files*, the PDFs and images of the library in their folders, and *Images*, those of the store. One chosen is shown in that side, in the place of what it showed, as a project chosen there is. The one the side shows is marked.

## Addendum, 2026-10-31: the files in a menu of their own, and the name alone over a file

The owner, trying the build, asked for three things of the top row, built the same day:

- **The chevron has the projects alone.** The tree of files under the projects (addendum of 27 October) is gone from the chevron's menu. Beside the chevron stands a button of its own, the files of the library (`FilesMenu`), over a map side as over a file side: a menu with a field at its head, which has the cursor when the menu opens, and under it the PDFs and images of the library in their folders, folded until opened. What is written in the field leaves the files that answer to it, by name or by the work they belong to, in the folders that hold them, unfolded; Enter shows the first found; the arrow down goes to the rows, and up from the first back to the field. The file the side shows is marked. A file chosen is shown in that side, as before.
- **The path over a file side names the file alone.** The project whose tabs these are stood before it, small, with the sign of a tree that read as letters at that size, and a separator; the owner asked for the file's name by itself. The project is told by the pointer over the name, with the name whole, and the press on the project's name that showed its map beside is gone; the map is one press away in the chevron or in Split view. The scripts read the project off the cell (`data-project-name`).
- The changes to the words: `viewer-tree-files` went, `viewer-files-menu` and `viewer-files-search` came, English and Norwegian.

## Addendum, 2026-10-31: the zoom, a third time

The owner found the wheel still flickering a lot over a PDF, and a little over an image, after the changes of 27 October. Off-screen, nothing could be caught: the pages paint, and the probes that counted pages removed and pictures loaded during a burst of turns found none. What remained was how WebKit paints while the layout changes at every turn: the pages laid out anew, their pictures painted scaled, large pictures decoded again off the main thread and painted as nothing until the decoding is done, and decoded pictures let go of under memory pressure to be decoded once more. So the zoom was built the way every smooth zoom is built:

- **While the wheel turns, nothing is laid out anew.** Each page in the document, and the frame of an image, is shown where the zoom in progress shows it, by a transform about its own corner (`Gesture`, `turned`, `under` and `boxTransform` in `pages.ts`, tested), so that what lies under the pointer stays there even as the pointer moves between the turns; the pages are layers of their own meanwhile. A quarter of a second after the last turn, or a key, the zoom reached is committed: the pages are laid out at it, the side scrolled so that the same point stays under the pointer, and the transform taken off, in one drawing. The bar's menu and field, and *As wide as the view*, commit at once. A scroll or a change of the side's width during a zoom commits it first; a tab left mid-zoom keeps the zoom reached.
- **The pictures are canvases.** A page's picture, and an image with pixels, is decoded once, off the main thread, and copied into a canvas, which holds the pixels: WebKit neither decodes them again when the canvas is painted at another size nor lets them go under memory pressure, and a new picture replaces the old in one step (`picture.ts`). A drawing (SVG) stays an image, so that it is sharp at any zoom.
- **The pages in view are those at the new place.** Before the commit's drawing, the scrolled position is told, so that no page leaves the document and comes back within one turn, which had made a page's picture load again.

Not measured on the owner's machine: whether the flicker is gone there. The scripts check what can be checked: that the pages are shown by a transform while the wheel turns, with the place under the pointer kept, that no page is removed and no picture made anew by the turns, and that the pages are laid out anew without a transform once the zoom rests.
