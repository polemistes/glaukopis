# 0096 — The row over the window: the rail gone, Split view beside the ×

Date: 2026-11-14. Status: built on 2026-11-14, its choices not yet confirmed by the owner; from the owner's words of the same day (the last section of `docs/brief.md`): "What if we move the project, library, keys, search and settings icons to the top pane instead of having a side pane for them. Horizontal space is precious for this program. Perhps only the projects and list of projects icons are on the left side, with the others on the right side, in place of the split button. I do not think the split button is placed in an intuitive place now." And, to the views given: "One button was what I meant, yes. If the button will be in the title bar when the view is split, it should be there also when it is not split. But let it just be the button, beside the close window button." Amends 0063 (Split view at the right end of the top row; the house in the rail), 0064 (the button that switched the sides, between the cells; Split view at the right end), 0065 (the list's button at the top of the rail; Split view on a ground of its own, lit with two sides) and 0043 (the switch of references and files at the head of the library; the rail's place of the library); it moves the place of the search, which 0017 put in the rail. Plan: `docs/plans/the-lists-of-the-document-pane-and-the-row-over-the-window.md`, part B.

## Context

- **A rail 52 pixels wide stood down the left edge of the window** (`shell/Rail.svelte`): the list's button, the house of the projects, the book of the library, the search, and at its foot the keys and the settings. Nothing else stood in it.
- **A project has a top row of its own** (0063, 0064, 0065): over each side a cell as wide as the side, with its path and its ×; on the join of two cells a small round button that switched them; at the right end **Split**, a button with a word, on a ground of its own and lit while two sides were shown, whose menu chooses what the other side shows. The head of the list of projects stands at the same height beside it. The library, the files and the search had heads of their own and no such row; the start screen had none.
- **The width is the text's.** With the list, two sides and a pane, each side's bar already wrapped to three rows in a window 1360 pixels wide.
- **Switch sides was in the menu of Split view already**, beside the round button.

## Decision

1. **The rail is gone.** Its six places stand in the row at the top of the window, in two groups:
   - **the start of the row**: the list's button, then the house of the projects;
   - **the end of the row**: the library, the search, the keys, the settings, in this order.
   Each place is what it was on the rail: its icon, its name, its key, where it goes, when it is lit; the list's button is lit while the list is shown. The tooltips open downwards.
2. **Where the two groups stand.**
   - **A project shown, the list shown**: the start of the row stands at the left of the list's head, then the list's **+** and **⋯** at its right.
   - **A project shown, the list hidden**: the start of the row stands at the left end of the project's top row. Its width is taken from the cell shown leftmost, so that the line between two cells still stands over the line between the two sides.
   - **The end of the row** stands at the right end of the project's top row, where Split view stood; the cell at the right gives way to it as it gave way to Split view.
   - **The start screen**: a row over it with the end of the row, and the start of the row when the list is hidden; when the list is shown, the list's head has it.
   - **The library and its files**: a row over the whole view with both groups, and between them, at the left, the switch **References | Files**, which leaves the heads of the two views. It stays in the row while a file is read in the files view.
   - **The search**: a row over the view with both groups and nothing between.
   - Where there is no list (the library, the files, the search) the list's button is shown and disabled, as it was on the rail, so that the house does not move.
3. **Split view is one button in the top row, beside the × of the side**, an icon and no word.
   - **One side**: in the side's cell, just before its ×, of the size of the ×.
   - **Two sides**: on the join of the two cells, where the button that switched them stood, round as that one was. The button that switched the sides is gone; *Switch sides* is in the menu of Split view, as it always was.
   - Its menu is as it was, and its key (**Ctrl+Shift+S**) opens the menu at the button wherever it stands.
   - It is not lit: where it stands says whether the view is split.
   - It is there whatever the one side shows, a project or the tabs of files, with the items that need a map disabled as before.
4. **Nothing else of the top row changes**: the paths, the menus of files, the ×, the colours of the active and the other cell, the document pane and the typesetting pane under it.
5. **The words** that only the rail and the old head used go: *Split* (the word on the button), *Close the list of projects* (the list's ×), *Projects* over the list, and the name of the rail for those who do not see it.

## Choices made in building this, which the owner has not been asked about

1. **The word *Projects* and the × leave the head of the list.** The list's button stands in the same head now, and closes it as the × did.
2. **The switch *References | Files* moves into the row**, beside the start of the row, where it stands over the whole of the library and does not move when a file is read.
3. **The list's button is disabled, not hidden, where there is no list**, so that the house stands in the same place in every view.
4. **The Split button is not lit with two sides.** Where it stands says it.
5. **The row has its line under it on the start screen too**, as over every other view.
6. **The places are a little smaller than on the rail**: 32 pixels square with icons of 17, where they were 36 with icons of 19, so that they sit in a row as high as the top row beside the smaller buttons there.
7. **The two groups are not landmarks of their own** for assistive tools: two landmarks of one name would mislead, and the row is not one element in every view. The places keep their names. The name of the rail (*Main*) goes with it.
8. **Two-sided, the round button keeps the size of the one that switched the sides** (22 pixels), and the icon of Split view (`columns-2`), smaller.

## Not done

- The places do not move into a menu in a narrow window; the start of the row and the end are always shown, and the paths give way first, as they did before Split view.
- The row over the library is not shared with the library's own head: the search field and the filters of the library stand where they stood, under the row.

## As built, 2026-11-14

- **The groups**: `shell/RowStart.svelte` (`data-row-start`; the list's button, `data-place="list"` and `data-projects-button`; the house, `data-place="projects"`), `shell/RowEnd.svelte` (`data-row-end`; `data-place` `library`, `search`, `keys`, `settings`). Every place keeps the class `place`; their look, shared by the two groups, is in `app.css`. `--rail-w` is gone.
- **The row of the other views**: `shell/TopRow.svelte` (`data-top-row`): the start of the row unless `start` is false, what the view puts between, the end of the row; `App.svelte` puts it over the library and the files (with `files/LibrarySwitch.svelte`, which leaves `LibraryView.svelte` and `FilesView.svelte`), the search and the start screen.
- **The list's head**: `home/ProjectsPane.svelte` has `RowStart` and a spring before **+** and **⋯**.
- **The project's top row**: `project/ProjectView.svelte` puts `RowStart` before the cells while the list is hidden, measuring its width and taking it from the leftmost cell and from the row of cells, and `RowEnd` at the right end; `project/SideBySideButton.svelte` is Split view, in the cell of one side or on the join of two (`data-side-by-side` in both). `data-switch-sides` is gone.
- **Words**: dropped `project-side-by-side-short`, `home-pane-close`, `home-title`, `shell-main`; none new. The comments of `shell.ftl` and the line of `locales/README.md` say what `shell.ftl` holds now.
- **The guide** and `CLAUDE.md` say where the places stand.
- **The scripts**: every script that found a place on the rail, the list's ×, the Split button's look or the button that switched the sides finds them where they stand now; `e2e/path.mjs` checks the row anew; a new script, `e2e/window-row.mjs`, walks the row in every view. They have not been run.
- **Tests**: the row mounted over the library and the start screen, its six places in their order, the list's button disabled where there is no list and lit while the list is shown, the start left out (`shell/TopRow.test.ts`); the button of Split view in the cell and on the join, opening its menu at itself and never lit (`project/SideBySideButton.test.ts`).
- **Counts.** All 1540 tests of the interface pass, and svelte-check finds nothing. No change to the core, the shell or the server, and none to the contract.
