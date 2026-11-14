# The lists of the document pane, and the row over the window — the build plan

From the owner's words of 2026-11-14 (the last section of `docs/brief.md`: read it first, both quotations and what they settle). Two parts that do not depend on one another, each built by one agent in a working copy of its own, each with a record of its own:

| Part | Record | Branch's work |
| --- | --- | --- |
| A | 0095, the lists of the document pane: cited or all, used or all, and one adding | `src/lib/project/ReferencePanel.svelte`, `src/lib/project/PicturePanel.svelte`, `src/lib/figures/images.svelte.ts`, a new module in `src/lib/library/` shared with `LibraryView.svelte`, `locales/*/project.ftl` |
| B | 0096, the row over the window: the rail gone, Split view beside the × | `src/lib/shell/`, `src/App.svelte`, `src/lib/home/ProjectsPane.svelte`, the top row of `src/lib/project/ProjectView.svelte`, the heads of the library, the files and the search, `e2e/` |

**No part changes Rust.** Everything is in `src/`, `locales/`, `docs/`, `e2e/` and, for part B, two lines of `CLAUDE.md`. If you find you need a change in `crates/` or `src-tauri/`, stop and say so in your report instead of making it.

The two parts meet in a few files, at different places: `LibraryView.svelte` (A: the menu of adding in the script; B: the switch leaves the head), `locales/*/project.ftl`, `docs/guide.md`, `docs/adr/README.md`, perhaps `e2e/languages.mjs`. Change only what your part needs there, and keep the rest of each line as it was, so that the two merge.

## How each part is built

Read `CLAUDE.md` (the map), then the last section of `docs/brief.md`, then your part below, then the code it names. Nobody answers questions while you build: where something is open, choose the plainer thing, write the choice in your progress note and in the record, and go on.

- **Your working copy is a git worktree** on a branch of its own. Begin with `pnpm install --frozen-lockfile --prefer-offline` (it has no `node_modules`). Commit on your branch after every step that passes `pnpm check`; never push, never merge, never touch `main` or another working copy.
- **Verify with `pnpm check` and `pnpm test`**, and `pnpm format` after your edits are done (edit first, format after; Prettier over `src/` only, never over `e2e/`). **Do not run cargo, `pnpm e2e:build` or any e2e script**: your working copy has no `target/`, and builds side by side would run the machine out of memory. Write and change the e2e scripts your part names, as carefully as you can from the scripts beside them and `e2e/harness.mjs`, and say in your report that they have not been run. They are run, and mended, after the two parts are merged.
- **Words**: every word the user sees is a Fluent message in `locales/en/` and `locales/nb/`, written together, plain and few (`locales/GLOSSARY.md` has the application's own words). New messages go into `en` and `nb` only. Where you drop or rename a message, drop it from `en` and `nb` and then run `node scripts/prune-locales.mjs`, which cuts from every other language what English no longer has. No hints in menus.
- **The guide**: write what the user now sees into `docs/guide.md`, in the guide's own voice, in the sections where the part is described today; change what is no longer true. Grep for every mention.
- **The record**: write `docs/adr/00NN-….md` in the form of `0091` and `0094` (read one): the owner's words, the context, the decision, *choices made in building this, which the owner has not been asked about* (the ones this plan lists, and yours), what is not done, as built. Add its row to the table of `docs/adr/README.md`, change the rows of the records it amends, and add the lines under *Superseded, and by what*. Grep the records for what you change (`This map`, `rail`, `Switch sides`, `Split view`) to find which they are.
- **Large files** (`ProjectView.svelte`): put what is new in a component or a module of its own and call it from there; add as little as you can to the large file.
- **Names**: a part is named for what it is or does, never for one use of it. Icons come from Lucide (`@lucide/svelte`); nothing is drawn.
- **The commit trailer** is the model you are: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` or `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. A commit message is full sentences in plain words, saying what changed and why; no prefix.
- **Your report**: what was built and where, every choice you made, what `pnpm check` and `pnpm test` said (the numbers), what is not verified, and anything you are unsure of. Say plainly what you did not finish.

---

## Part A — the lists of the document pane (record 0095)

Today the tabs *References* and *Images* of the document pane each have a switch of three: **This map | Project | Library**. Beside the switch of the references stand **+** (*New reference*) and a second button, *Import a file*, which asks for a `.bib` file and nothing else. A user who was told to import a PDF "in the Library" went to the choice called Library, pressed *Import a file*, and could not. The Library page (`library/LibraryView.svelte`) has the whole menu of adding beside *New reference*; the pane never got it.

*This map* is the element in view with all under it, a word left from when a project held several maps (`project.usedReferences(at)`, `project.usedPictures(at)`).

### Decided

1. **Two choices in each list.**
   - References: **Cited | All**. *Cited* is every reference the project cites, anywhere in it (what *Project* was). *All* is every reference of the library.
   - Images: **Used | All**. *Used* is every image the figures of the project show. *All* is every image of the library.
   - *This map* is gone, in both. The first choice is the one chosen when the pane opens, as *Project* was. *Insert › Image* still opens the images on *All*.
   - The values in the code stay `'project'` and `'library'`; `'map'` goes from `PictureScope` (`figures/images.svelte.ts`), from both panels, and with it whatever only it used (the `at` of `ReferencePanel`, if nothing else needs it; `PicturePanel` still hands `at` to the dialog of an image's text).
2. **One button adds to the references**: a **+** with a menu, in place of the two buttons:
   - *New reference*
   - a line
   - *Import Bib(La)TeX…*, *Import from Zotero…*, *Paste…*, *Add PDF files…*: the same four, in the same order, with the same words and icons, as the menu beside *New reference* on the Library page.
   The four items are made in **one place** that both the page and the pane call: a small module in `src/lib/library/` (a function that gives the four `MenuItem`s for a collection or none), which `LibraryView.addMenu` uses for its first four items in place of writing them out. The page's other items (duplicates, the map of the library, export) stay the page's own.
3. **What was added is shown.** When references come from any of these (the import says what it added), the list goes to *All*, the search is emptied, and what was added is selected and in view; as the images already do after images are taken in (`took` in `PicturePanel`).
4. **A file dropped on either list goes where its kind belongs.**
   - Both panels take any files dropped on them (today the images take a drop only when an image is among the files, and the references take none, so that the window's own fallback makes references of PDFs and says *nothing to import* of an image).
   - Images among the files are taken in (`takeIn`); the rest go to `importDropped`, which makes references of PDFs and reads `.bib` files.
   - The pane then shows the tab where what came now stands, on *All*, with it selected: an image dropped on the references shows the images; a PDF dropped on the images shows the references. Where both kinds came at once, the tab one is on stays.
5. **Nothing else of the two tabs changes**: the search, the rows, the menus of a row, *Cited in*, dragging into the text, the foot.

### Words

`project.ftl`, in `en` and `nb`:

- new: `project-references-cited = Cited` / `Sitert`; `project-pictures-used = Used` / `Brukt`; `project-all = All` / `Alle`; the label of the **+**, e.g. `project-add-references = Add references` / `Legg til referanser`.
- dropped: `project-this-map`, `project-project`, `project-library`, `project-pictures-library`, `project-import-file`, `project-no-pictures-map`, `project-pictures-absent-map`, and `project-new-reference` if nothing uses it after (the menu's *New reference* is `library-new-reference`).
- reworded: the empty list of images says that the images of the project's figures are listed here and that every image of the library is under *All* (today it says "under Library"); name it without `-project` at the end if you rename it. Read every message of the two panels and mend whatever still says *map* or *Library* of a choice.
- The comments over the messages in the `.ftl` files say what is true now.

Then `node scripts/prune-locales.mjs`.

### Choices the owner has not been asked about

- The words *Cited* and *Used* for the first choice (the owner chose what it means, the whole project, and the word *All*).
- One **+** with a menu, *New reference* first, rather than two buttons.
- The list goes to *All* after something was added.
- A file dropped on the list that is not of its kind shows the other tab.

### Verify

- `pnpm check`, `pnpm test`. A vitest of the shared module (it gives the four, in order), and of what else can be tested without the core; look at `chat/ChatPanel.test.ts` for how a panel is mounted in a test, and mount `ReferencePanel` to show the two choices and the menu if that is within reach.
- `e2e/picture-panel.mjs`, `e2e/image-editing.mjs`, `e2e/notes.mjs`: the choices are pressed by their words (`This map`, `Project`, `Library`); change them. Grep `e2e/` for the other words you changed.
- A new script, `e2e/pane-adding.mjs`, not run. Its first comment says what it covers: the references of the pane have two choices, *Cited* and *All*; the **+** opens the menu with *New reference* and the four of the page, and *New reference* opens the dialog; a `.bib` file dropped on the list of references makes references, and the list shows *All* with them selected; an image dropped on the references is taken in, and the pane shows the images on *All* with it selected; a PDF dropped on the images makes a reference, and the pane shows the references. Files are dropped as the other scripts drop them (`tauri://drag-drop`, see `e2e/files.mjs` and `e2e/figures.mjs`); look at how `e2e/files.mjs` and `e2e/sources.mjs` make a PDF that needs nothing fetched. The native file pickers behind the menu's items cannot be driven and are not pressed.
- `e2e/languages.mjs` walks the Norwegian interface: if it opens these tabs, see that nothing it checks has changed under it.
- The guide: *Images* (the three choices), the paragraph on the panel of references (**Ctrl+Shift+R**), *The document pane*, the table *Where the file is dropped* (a row for the lists of the pane), and *References can be added wherever they are used*.
- The record 0095 amends the records that gave the lists their three choices and named the third *Library* (0070 among them).

---

## Part B — the row over the window (record 0096)

Today a rail 52 pixels wide stands down the left edge of the window (`shell/Rail.svelte`): the list's button, Projects, Library, Search, and at its foot Keys and Settings. A project has a top row of its own (`.top` in `ProjectView.svelte`): over each side a cell with its path and its ×, on the join of two cells a small round button that switches the sides, and at the right end **Split**, a button with a word, whose menu chooses what the other side shows. The list of projects has a head at the same height (`home/ProjectsPane.svelte`). The library, the files and the search have heads of their own and no such row; the start screen has none.

The width matters: with the list, two sides and a pane, each side's bar already wraps to three rows in a window 1360 wide.

### Decided

1. **The rail is gone**: `Rail.svelte` is removed, `--rail-w` with it, and every comment that speaks of the rail says what is true now. Its six places stand in the row at the top of the window, as two groups, each a small component in `src/lib/shell/`:
   - **the start of the row** (`RowStart.svelte`): the list's button, then Projects (the house);
   - **the end of the row** (`RowEnd.svelte`): Library, Search, Keys, Settings, in this order.
   Each place is what it was on the rail: the same icon, `aria-label`, `href`, key, what it does when pressed, when it is lit (`.current`) and when the list's button is pressed or disabled. The tooltips open downwards. For the scripts each keeps the class `place` and gets `data-place` (`list`, `projects`, `library`, `search`, `keys`, `settings`); the list's button keeps `data-projects-button`; the groups have `data-row-start` and `data-row-end`. The places are a little smaller than on the rail, so that they sit in a row `--bar-h` high beside the buttons that are there (about 32 pixels square, icons of 17).
2. **Where the two groups stand.**
   - **A project shown, the list shown**: the start of the row stands at the left of the list's head; after it a spring, then the list's **+** and **⋯**. The word *Projects* and the list's × leave the head: the list's button stands in the same head now. (`PANE_MIN` is 180: see that the head holds at that width.) The `aside` keeps its `aria-label`.
   - **A project shown, the list hidden**: the start of the row stands at the left end of the project's top row, before the cells. Its width is taken from the cell that is shown leftmost (`paneWidths`, `panesWidth` and `mirrored` in `ProjectView.svelte`), not added to the row, so that the line between two cells still stands over the line between the two sides.
   - **The end of the row** stands at the right end of the project's top row, where **Split** stood (`.split`), and the cell at the right gives way to it as it gave way to Split.
   - **The start screen** (and the settings over it): a row over it with the end of the row, and the start of the row when the list is hidden; when the list is shown, the list's head has it.
   - **The library and its files**: a row over the whole view, with both groups, and between them, at the left, the switch **References | Files** (`files/LibrarySwitch.svelte`, `data-library-switch`), which leaves the heads of `LibraryView.svelte` and `FilesView.svelte`. It stays in the row while a file is read in the files view.
   - **The search**: a row over the view with both groups and nothing between.
   - Where there is no list (library, files, search) the list's button is shown and disabled, as it was on the rail, so that the house does not move.
   One component, `shell/TopRow.svelte`, is the row for the views that have none of their own: the start of the row (unless told not to), what the view puts between (`children`), the end of the row; `--bar-h` high, a line under it, `data-top-row`. `App.svelte` puts it over the library, the files, the search and the start screen. The project's top row and the list's head stay where they are and take the two groups in.
3. **Split view is one button in the top row, beside the × of the side.**
   - **One side**: an icon button with no word (Lucide `columns-2`, as today) in the side's cell, just before its ×, of the size of the ×.
   - **Two sides**: the same button on the join of the two cells, where the button that switched the sides stood, in the round look that one had. The button that switched the sides is gone; *Switch sides* is in the menu, as it always was.
   - Its menu is as it is today (`sideBySideMenu`): what the other side shows, and with two sides *Switch sides* and *One at a time*. Its key opens the menu from wherever the button stands. `data-side-by-side` is on it in both places; `data-switch-sides` is gone.
   - It is not lit: where it stands says whether the view is split.
   - It is there whatever the one side shows, a project or the tabs of files, with the items that need a map disabled as today.
4. **Nothing else of the top row changes**: the path, the menu of files, the ×, the colours of the active and the other cell, the document pane and the typesetting pane under it.

### Words

- `project-side-by-side-short` (the word on the button), the message of the list's × (`home-pane-close`) and `home-title` go, where nothing else uses them. Then `node scripts/prune-locales.mjs`.
- The comment at the head of `locales/*/shell.ftl` and the line about `shell.ftl` in `locales/README.md` speak of the rail.
- No new words are expected.

### Choices the owner has not been asked about

- The word *Projects* and the × leave the head of the list.
- The switch *References | Files* moves into the row.
- The list's button is disabled, not hidden, where there is no list.
- The Split button is not lit with two sides.
- The row has its line under it on the start screen too.

### Verify

- `pnpm check`, `pnpm test`. Grep `src/` for `Rail`, `rail`, `--rail-w`, `switchSides`, `data-switch-sides`, `side-by-side-short`: tests and comments too.
- **Scripts changed, not run.** Every script that finds a place on the rail, the list's ×, the Split button's look or the button that switched the sides; among them `path.mjs` (its checks of the top row are rewritten: the start of the row in the list's head, and in the row when the list is hidden; each cell over its side, the first narrower by the start of the row when the list is hidden; Split beside the × with one side and on the join with two; *Switch sides* from its menu), `maps.mjs` (its `lit()`), `list.mjs`, `keys.mjs`, `spelling.mjs`, `documents.mjs`, `files.mjs`, `settings.mjs`, `data-folder.mjs`, `language-packages.mjs`, `languages.mjs` (the names of the places, in both languages), `smoke.mjs`, `as-left.mjs`, `file-view.mjs`, `review-sides.mjs`, `source-tabs.mjs`. Grep `e2e/` for `rail`, `nav `, `data-switch-sides`, `data-side-by-side`, `Switch sides`, `Close the list` and the English of whatever you dropped; read each hit. `.top button[data-side-by-side]` still finds the button, since it stays in `.top`. The first comment of a script says what it covers: mend it where it speaks of the rail.
- **A new script, `e2e/window-row.mjs`**, not run: the row in every view (the start screen, a project with the list shown and hidden, the library, the files, the search); the six places in their order, each lit where it should be and going where it goes; the list's button disabled where there is no list; no rail; the switch *References | Files* in the row; screenshots of each view into `e2e/output/` (`window-row-1-start` and so on), in the three themes for the project with two sides.
- The guide: every mention of the rail (grep), *Split view*, *Switch sides*, the list's × and **Ctrl+Shift+L**, the table of keys at the end.
- `CLAUDE.md`: the two places in the map that name the rail (`App.svelte composes the window: the rail…`, and the row of `shell/` in the table) say what is there now.
- The record 0096 amends the records that put the places on the rail and Split view at the right end of the top row (0063, 0064 and 0065 among them).
