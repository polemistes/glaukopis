# 0095 — The lists of the document pane: cited or all, used or all, and one adding

Date: 2026-11-14. Status: built on 2026-11-14, its choices not yet confirmed by the owner; from the owner's words of the same day ("At least, the distinction between "This map" and "This project" does not exist anymore, does it? And Library is a bad name for the list of all references, since that is the name of the page containing both references and files. So "All References" perhaps, or just "All"."), and their answers ("1. The whole project. 2. The same adding. No files tab."). Amends 0070 (the images of the pane: three choices, and adding an image there) and 0064 (the document pane: what its two lists are of). Plan: `docs/plans/the-lists-of-the-document-pane-and-the-row-over-the-window.md`, part A.

## Context

- **A user was told to import a PDF "in the Library"** and went to the choice called *Library* in the references of the document pane. It was only the list of every reference, named as the page of the library is named, and the button beside it, *Import a file*, asked for a `.bib` file and nothing else. The page (`LibraryView.svelte`) has the whole menu of adding beside *New reference*; the pane never got it.
- **Each list of the pane had a switch of three**, *This map*, *Project* and *Library* (0070 for the images; the references had the same three). *This map* is the element in view with all under it (`usedReferences(at)`, `usedPictures(at)`): a word from when a project held several maps. A project is one tree now (0037), and the pane already shows the whole of it in the other choice.
- **The two lists took files differently.** The images took a drop only where an image was among the files, and made references of the rest through `importDropped`; the references took none, so that the window's own fallback made references of PDFs and said *nothing to import* of an image dropped on them.
- **The pane lists what goes into a text**, the references and the images; the files of the library are not one of its tabs, and the owner said there is to be none.

## Decision

1. **Two choices in each list.** References: **Cited** (every reference the project cites, anywhere in it; what *Project* was) and **All** (every reference of the library). Images: **Used** (every image the figures of the project show) and **All** (every image of the library). *This map* is gone from both. The first choice is the one chosen when the pane opens, as *Project* was. *Insert › Image* still opens the images on *All*. The values in the code stay `'project'` and `'library'`; `'map'` goes from `PictureScope`.
2. **Only the page is called Library.** No choice of a list bears the word.
3. **One button adds to the references**: a **+** with a menu, in place of the **+** and *Import a file*: *New reference*, a line, then *Import Bib(La)TeX…*, *Import from Zotero…*, *Paste references…* and *Add PDF files…*, the same four, in the same order, with the same words and icons as the menu beside *New reference* on the Library page. The four are made in one place (`library/adding.ts`, `addingItems`), which the page and the pane both call. The page's other items (duplicates, the map of the library, export) stay the page's own.
4. **What was added is shown.** Where references come from any of these, or a new one is made, the list goes to *All*, the search is emptied, and what came is selected and in view; as the images already were after images were taken in.
5. **A file dropped on either list goes where its kind belongs.** Both lists take any files dropped on them. The images among the files are taken in; the rest goes to `importDropped`, which makes references of PDFs and reads `.bib` files. The pane then shows the tab where what came now stands, on *All*, with it selected: an image dropped on the references shows the images; a PDF dropped on the images shows the references. Where both kinds came at once, the tab one is on stays.
6. **Nothing else of the two tabs changes**: the search, the rows, the menus of a row, *Cited in*, dragging into the text, the foot.

## Choices made in building this, which the owner has not been asked about

1. **The words *Cited* and *Used*** for the first choice. The owner chose what it means, the whole project, and the word *All*.
2. **One + with a menu, *New reference* first**, rather than two buttons, or the page's split button.
3. **The list goes to *All* after something was added**, though what was added is cited nowhere yet.
4. **A file dropped on the list that is not of its kind shows the other tab.**
5. **What is shown is what the import says it added**, not what it was about. A PDF already in the library, or a `.bib` file of works already there, makes nothing new, and nothing moves; the toast says so, as it did.
6. **Everything that came is selected**, several where several came, and the last is brought into view. A long import selects every reference it made.
7. **A new reference made from the + is shown as the others are**: on *All*, selected, in view.
8. ***New reference* in the menu has the plus** that the page's button has; the four others have their icons, as on the page.
9. **Nothing is put into a collection** by what is added in the pane: the pane has no collection in view.
10. **Where both kinds came at once, what is of the kind of the list dropped on is shown**, and the other is in the library and not shown. The references are shown once their review is done, when they exist; the images, taken in at once, are shown after it.
11. **What waits to be shown is handed over, not done by the panel dropped on.** The other tab's panel is not there to be told; it is made as the tab is shown, and takes what waits as it is made. The same hand-over serves a list that is shown already.
12. **The element in view no longer counts in the lists**: `ReferencePanel` no longer takes `at`. `Project.usedReferences(within)` and `usedPictures(within)` keep their parameter, which other code and their tests use.
13. **The empty list of images** says that the images of the project's figures are listed here and every image of the library is under *All*, and is named `project-no-pictures-hint`; the other languages lose their old words of it and show English until their next round.

## Not done

- *Cited* and *Used*, where empty, do not point to *All* in the list of references; they did not before.
- The images have no menu of adding; their **+** adds images from files, as before. The Library page's other ways of bringing in make references, not images.
- The pane has no tab of files (the owner's word).
- The other languages are not translated in this change: the four new words are in English and Norwegian.

## As built, 2026-11-14

- **The shared four**: `library/adding.ts` (`addingItems(collection, then)`, the items and, where asked, what came of each); `LibraryView.svelte` calls it for the first four items of its menu.
- **The hand-over**: `project/pane-adding.svelte.ts` (`arrivals`, `arrive`, `dropOnList`); `DocumentPane.follow()` shows the tab of what waits; `ReferencePanel.svelte` and `PicturePanel.svelte` each take what waits for their tab, as they are made and while they stand.
- **The panels**: `ReferencePanel.svelte` (two choices, one **+** with the menu, a drop target on the whole panel, no `at`), `PicturePanel.svelte` (two choices, a drop target that takes any files, `took` and `dropped` gone), `images.svelte.ts` (`PictureScope` is `'project' | 'library'`), `ProjectView.svelte` (no `at` to the references).
- **Words**: `project-references-cited`, `project-pictures-used`, `project-all`, `project-add-references`, `project-no-pictures-hint` in `en` and `nb`; dropped `project-this-map`, `project-project`, `project-library`, `project-pictures-library`, `project-new-reference`, `project-import-file`, `project-no-pictures-map`, `project-no-pictures-project`, `project-pictures-absent-map`, and cut from every language by `scripts/prune-locales.mjs`.
- **Tests**: the four, their order and what each calls (`library/adding.test.ts`); the decisions of a drop and what waits (`project/pane-adding.svelte.test.ts`); the pane showing the tab of what came, opening where closed (`project/document-pane.svelte.test.ts`); both panels mounted, with their two choices, the menu, what came and any files dropped (`project/ReferencePanel.test.ts`, `project/PicturePanel.test.ts`).
- **The scripts**: `e2e/picture-panel.mjs`, `e2e/image-editing.mjs` and `e2e/notes.mjs` press the choices by their new words; `e2e/pane-adding.mjs` is new: the choices, the menu, a `.bib` file dropped on the references, an image dropped on the references, a PDF dropped on the images.
- **The guide**: *Images*, the panel of references, *References can be added wherever they are used*, *Importing*, *Where the file is dropped* (a row for the lists of the pane) and *The document pane*.
- **Counts.** 1563 tests of the interface pass, and svelte-check finds nothing. No change to the core, the shell or the server, and none to the contract.
- **Tried in the running application** in the main thread, after this part was merged with the other: `e2e/pane-adding.mjs` (17 checks), `e2e/picture-panel.mjs`, `e2e/image-editing.mjs` and `e2e/notes.mjs` passed as they were written.
