# 0073 — The tabs opened, files by their references, and a file read in the library

Date: 2026-10-29. Status: accepted by the owner on 2026-10-29 ("Yes to all", with the act renamed for what it does, and the word *sources* given up for *tabs*; then "I agree. Make the adjustments." on a project coming back as it was shown), from their trial of the tabs built that day (0072): no way to open the tabs without adding a file; the files list showing files by name where their references are known; the pane's preview too small to read a title page by, and showing the file sending it to the project; and the tabs not coming back with the project. To be built from `docs/plans/the-tabs-opened-files-by-their-references-and-a-file-read-in-the-library.md`. Amends 0072 (the words: *tabs*, not *sources*; *Add to the project's tabs*, not *Show*; a way in to the tabs themselves), 0070 (the files list: columns of the reference; a double-click reads), 0043 (the pane of a file: a reader beside it), and 0063 (the window as it was left: a project now remembers what stood beside it, where that was its own).

## Context

- **The tabs have no door of their own.** Every way in built in 0072 is "show this file": from the library, a reference, a citation, Split view's chooser. A file side closed, or a window opened at the map alone, has no item that opens the project's tabs as they were. The owner looked for one.
- **The words.** The row of tabs is labelled *Sources*, the Split view's tooltip says *The sources of …*, and the record speaks of sources throughout. The owner: the PDFs will often not be sources but reference material, dictionaries and the like; the language must not restrict what the function is used for. *Show*, meanwhile, now adds a tab to the project and should say so.
- **The files list.** It shows one line a file: the kind, the name, where the file is used (the reference's short label, *Lord 1960*, or the projects it is a figure in), when it was taken in, its size; sorted by name, kind, reference, date or size (`FileList.svelte`, `order.ts`). A reference's summary (`Summary` in `api/library.ts`, `Entry::summary` in the core) carries its people as one string, authors or editors marked as such, the year, the title, the container and the publisher; translators are in the search words only. The tabs, the chooser and the tree under a side's chevron name a file by its file name alone (`TabRow.svelte`, `FileChooser.svelte`, `LibraryTrees.svelte`).
- **The tabs do not come back with the project.** Since 0063 a project remembers where it was left, the element and the view, and the window remembers its sides; a project opened from the list comes alone in the active side, the other side staying as it was. Now that the tabs are the project's, the owner expects them back with it; two projects side by side should not be remembered by either, but the same project both ways might be, as a way of working; they asked whether that wants an option.
- **The pane's preview.** A thumbnail 220 pixels high (`FilePane.svelte`, `Thumb.svelte`), a PDF by its first page; a press on it, or a double-click or Enter on the row, shows the file, which since 0072 adds it to the open project's tabs. To read a title page and make a reference from it, the owner had to add the file to a project they were not working in. The viewer of the window (`src/lib/viewer/`: `PdfView`, `ImageView`, `ViewerBar`) shows a file large with its text to copy, but only in a side of the window.

## Decision

### The words

- The row of tabs over a file side is called by nothing but its tabs; its label for assistive tools is *Tabs*. What was *Show* in the files of the library, in a file's pane and menu, among the files of a reference in the library, and in Split view's chooser, is **Add to the project's tabs**, and does what it says. Within a project, from a citation's editor and from the references of a document, *Show the file* stays: there the file comes beside the text at once, which is what is asked for.
- The tooltip of the project's name over a file side says *The tabs of …*; the guide says *files in tabs*. The record 0072 and the code keep their inner words.

### The tabs opened

- **The project's tabs**, in the menu of Split view, opens the file side of the project beside the text with its tabs as they were; where it is open already, it gets the focus; where the project has no tabs yet, the empty side with its plus. With no project in the window, the tabs of the project the window was last in.

### Files by their references

- **Columns of the reference** in the files list, where the file belongs to one: the people with their role (the authors; the editors marked as such, as the summary marks them; the translators after them, marked), the year, the title and the publisher; and the file's own name, small, after them. A file of no reference keeps its name in the first place and says *No reference*, as now. In a narrow list the columns fold into one line, the people and the year first.
- **Sorting** by people (what *By reference* is), by year, by title and by publisher, each in the Sort menu beside the orders there are; files of no reference last in each, as now.
- **The same words name a file** wherever it stands in for its reference: the tab, the file chooser, the tree under a side's chevron. The short form, *Lord 1960*, or the title where there are no people; the file's name as the tooltip, and as the name where the file belongs to no reference. The cell over a file side keeps the file's name, which is also what the bar's field asks of.
- The reference's summary gains its translators, so that they can be shown.

### A file read in the library

- **Read**, first among what can be done with a PDF or an image in its pane, a press on the pane's preview, and a double-click or Enter on its row in the list, shows the file in the files view itself: the viewer of the window, with its bar, pages, zoom and text to be selected and copied, in the place of the list, as high as the view, the pane of the file staying at the right so that a reference is made or assigned while the title page is in view. **Back to the files**, at the head, Escape, or a press on another folder returns to the list where it was. Nothing of the window's sides or the project's tabs is touched; the place read to is not kept.
- A file of another kind is still opened in another program by a double-click, as now.

### A project comes back as it was shown

- **A project remembers how it was shown when it was left**: alone; with its tabs beside it; or both ways, the other side's element and view. It is kept with the rest of what the project remembers of how it was looked at, on this computer, and changes as the sides change while the project is shown: closing the tabs leaves it alone.
- **Opened from the list, a link, a citation or the search, it comes back that way**, provided the other side is free: no other side, or a file side, which follows the project anyway. Another project's map in the other side stays, and the tabs or the second view are one press away in Split view. A project opened at an element still brings its other side.
- **The window as a whole** is still laid out as it was left when Glaukopis starts (0063): two projects side by side come back then, and only then.
- **No option.** The three cases fall out of one sentence: the shape belongs to the project where both sides are the project's own, and to the window where they are two projects.

### What is not done

- No bookmarks in the reader of the library: they belong to reading beside a text.
- No columns of the reference in the thumbnails; the tile keeps its name and its mark.
- No renaming of the inner names: `sources` in the code and the records of 2026-10-29 stand.

## Choices made in writing this, which the owner has not been asked about

1. *Add to the project's tabs* in the library and Split view; *Show the file* kept within a project.
2. The reader takes the place of the list, the pane staying; not an overlay over the window.
3. The people of a reference in one column with their roles, not three columns; translators marked after the authors or editors.
4. The tab shows the short form, *Lord 1960*, not the title; the title is in the tooltip with the file's name.
5. The cell over the file side keeps the file's name.
6. The place read to in the library is not kept.
7. A project opened at an element brings its other side all the same; the element asked for goes in the side opened, and the other side keeps the element it had.
8. The focus stays in the side the project was opened in, whichever comes beside it.

## Why not otherwise

- **Not *Files* for the row**: the library's files are *Files* already, and the row is the project's.
- **Not a larger thumbnail**: one page at one size, and the owner wants to read the page and copy from it.
- **Not showing the file in a side without adding a tab**: two rules for one act, and the owner's wish was to catalogue without touching the project at all.
- **Not the title in the tab**: titles are long and tabs are many; the short form is what citations use.
- **Not an option for what comes back with a project**: one rule decides it the way the owner expects in each case, and a setting would be one more thing to explain.
- **Not the tabs or the second view in the place of another project's map**: what the window shows beside a project opened from the list is the user's own doing; it is not taken away.

## Consequences

- Words in `viewer.ftl`, `files.ftl`, `project.ftl`, `library.ftl`, English and Norwegian; `files-show` and `project-beside-file` go or change. `Summary` gains `translators`; the files list gains columns and three orders; a function names a file by its reference for the tabs, the chooser and the tree; the files view gains a reader made of the viewer's parts, and `FilePane` a *Read*; `Sides` gains the opening of a project's tabs; the Split view menu its item. The project's memory (`StoredView`, `Memory` in `layout.ts`) gains what stood beside it; the window applies it when a project arrives in a side. The guide's *The files of the library* and *A file in a view* change; `e2e/files.mjs` and `e2e/source-tabs.mjs` grow.

## Addendum, 2026-10-30: as built

Built on `main` from c1d96fb1 to the commit of this addendum, by one builder, the stages running through the same files. Nothing is pushed. The Arch packages of 0.2.6, release 6, were built at the owner's word after stage 1, from that stage.

What departs from the plan, or was settled in the building:

- **The words of the columns** are `files-column-people`, `-year`, `-title` and `-publisher`, as the pane's *Used in* is `files-column-used`: `files-title` names the files view already, and the first commit of stage 1 failed the test of the words for it (mended at once).
- **The columns from 560 pixels of list, not 720.** In a window of 1360 pixels the list is about 670 wide, the pane of a file and the tree taking the rest; at 720 the columns would not be seen where most would look. Under 900 pixels the date a file was taken in is left out of every line: it is in the pane and in the orders. The widths: people 18 %, the year 44 pixels, the title 34 % and growing, the publisher 14 %, the file's name 14 %.
- **The translators** are in the summary only where authors or editors stand first; where translators stand first they are the people already.
- **The chooser** names a file by its reference's short form, its second line the folder and the file's name; a file of no reference keeps its name, the second line saying so.
- **The reader** takes the whole middle column, its head and its search with it, not only the list, so that it is as high as the view; it is ended by another folder and by another search. Its action in the pane is `read-file`, since images had a `read` already (*Read the text…*). It focuses its pages as it opens, so that the keys of pages work at once.
- **A project that arrives** is marked so by `open` and `beside` where they make a side, and by `arrange` where the window that was kept showed another project: a project opened from the start screen into such a window arrives as from the list. The window laid out whole as it was left brings nothing more.
- **What stood beside a project in both sides** is recorded as the active side sees it: as first built, each side wrote its own, the last won, and both came back as text.
- **A side still arriving** is not recorded: the effect that keeps what stands beside ran first and wrote "nothing" for a project that had just come alone.
- **The tabs already there count as free** for a second view: a project left both ways, opened beside its own tabs, takes their place with its second view. A project left with its tabs, opened beside its tabs, needs nothing.
- In the scripts: `e2e/file-view.mjs` adds a file to the tabs from the pane, since a double-click reads; `e2e/maps.mjs` reads Split view's new items; `e2e/files.mjs` reads the cells of the reference.

Counts: `pnpm check` without errors or warnings; `pnpm test` 1352; `cargo test --workspace` 977, none failing; `cargo clippy --workspace --all-targets` without warnings. The scripts: `source-tabs` 34 of 34, `files` 102 of 102, `file-view` 45 of 45, `maps` 78 of 78, `as-left` 31 of 31, `list` 31 of 31, `tree-keys` 44 of 44, `image-editing` 27 of 27, `library` 40 of 40, `languages` 17 of 17 (it does not walk the reader).
