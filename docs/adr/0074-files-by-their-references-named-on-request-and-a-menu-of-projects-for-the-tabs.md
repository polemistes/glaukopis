# 0074 — Files by their references, named by them on request, and a menu of projects for the tabs

Date: 2026-10-30. Status: accepted by the owner on 2026-10-30 ("I think renaming files should be a separate function, run manually. Files should possible be renamable.", answering the two questions left open after their four points of the same day were agreed to; and, the same day, "The add a file on the tabbar and the add a file to the tabs in the split menu, should be multiple choice"), from their trial of the files view as built from 0073: the file's name shown everywhere where the author, year and title are what matters; no way to give a file the name its reference would give it; a magnifying glass over the preview where a press reads the file; and *Add to the project's tabs* leaving the files view for the project. To be built from `docs/plans/files-by-their-references-named-on-request-and-a-menu-of-projects-for-the-tabs.md`. Amends 0073 (the files list: the file's own name no longer after the columns; the pane's head; *Add to the project's tabs* becomes a menu of projects), 0070 (the pane of a file: the name among the facts), 0043 (the name a file takes from its reference, given at attaching and export, now also on request), and 0069 (how a file reaches the tabs from the library: by choice of project, not by the window's last project).

## Context

- **The file's name is shown wherever a file is named.** The files list keeps a column for it after the people, the year, the title and the publisher of the reference (`FileList.svelte`, `.file-name`); the narrow list shows the short form and then the name; a tile of the thumbnails shows the name under the picture; the pane of a file leads with a *Name* field (`FilePane.svelte`, the head); the links *made from* and *Copies made from it* name files by it. The tabs, the chooser under a side's plus and the tree under a side's chevron name a file by its reference already, the file's name in the tooltip (`fileLabel` in `files/store.svelte.ts`, from 0073). The owner: the author, the year and the title are the interesting information; the name is what the file happened to be called where it came from, and the repositories of articles and books give nonsense names.
- **The name a reference gives a file exists.** The core builds *Nagy 1979 - The Best of the Achaeans* (`Library::file_name_for`: the people as a short list, the year, a dash, the title to eighty characters), gives it to a file attached from a reference in the library (`attach`), and names every exported file by it (`export.rs`: a second file of the same work with the same ending gets the file's own name after a dash). A file taken into the files view first and given a reference after keeps the name it came with. The name is a field of the file's record (`FileRecord.name`, `files.rs`); renaming (`file_rename`) changes it alone, the file on disk staying under its hash (`attachments.rs`: `hash_dir`), so the name is a label and renaming is cheap.
- **The pointer over the preview** is `cursor: zoom-in` (`FilePane.svelte`, `.preview`), set when a press showed the file in the window (0069); since 0073 a press reads the file in the files view. The owner expected the press to magnify.
- **Adding to the tabs leaves the view.** *Add to the project's tabs* in the pane, in the list's menu, and on a file of a reference in the library's pane calls `showFile` (`viewer/show.ts`), which, with no project on screen, goes to the file route, and the window is laid out with the project it was last in and the file in a side beside it (`Sides.arrange`, `lastProject`). The owner: the button should open a menu of projects, add the file to the one chosen, and stay. The tabs of a project are kept per project in one store (`SourcesStore`, `viewer/sources.svelte.ts`), which a side reads from directly and which takes a change for a project whose tabs have not yet come; so a file can be added to the tabs of a project that is not on screen, and a side showing that project sees it at once.

## Decision

### A file is shown by its reference

- **In the list**, a file that belongs to a reference is shown by the columns of 0073 alone: the people with their roles, the year, the title and the publisher. Its own name follows small after them only where the library holds another file of the same work with the same ending, so that two volumes of one book are told apart, as export tells them apart. The narrow list shows the short form alone, with the same exception. A file of no reference is shown by its name, as now. Wherever the name is not shown, the line's tooltip is the name.
- **In the thumbnails**, the words under a tile are what the tabs would show, the short form, *Lord 1960*, or the name of a file of no reference; the tooltip of the tile stays the name.
- **In the pane**, the head names the file as the tabs do: the short form, and the title under it; a file of no reference, its name. The *Name* field moves among the facts under *About this file*, first of them, and stays a field: a name written there and confirmed with Enter, or by leaving the field, is kept, as now; Escape puts the name back. Wherever else the pane names a file, *made from* and *Copies made from it*, it names it as the tabs do, the name in the tooltip.

### Named by the reference, on request

- **Name by the reference**, beside the *Name* field of a file that belongs to a reference, and **Name by their references** in the menu of the files chosen in the list, one or many, gives each file that belongs to a reference the name the core gives a file attached from one: the people as a short list, the year, a dash, the title cut at a word; the file's ending kept. A second file of the same work with the same ending gets the file's own name after a dash, the own name being what the file was called, without its ending and without a leading *work -*, so that the act gives the same names run twice. A file of no reference keeps its name. One notice says how many were named and how many of no reference kept their names; where no name changed, that the names were by their references already.
- **It is never done by itself.** Assigning a file to a reference does not rename it. A file attached from a reference in the library is still named by it when it is taken in, as since 0043: that is a name given, not a name taken away.
- **Every file stays renamable** by hand, named by its reference or not.
- **The file on disk is not touched**: it stays under its hash, and export names it by its reference already.

### A hand over the preview

- The pointer over the preview in the pane is the hand of a button, as everywhere a press does something: the press reads the file. Nothing else changes.

### A menu of projects for the tabs

- **Add to a project's tabs…**, in the pane of a file, in the menu of the files chosen, and on a PDF or an image among the files of a reference in the library's pane, opens a menu of the projects: the one the window was last in first, where there is one, then all of them as the start screen lists them. Choosing one adds the file, or every PDF and image chosen, to that project's tabs, each after the one shown, the last of them shown, a file already among the tabs not given twice; nothing on screen changes. A notice says *Added to the tabs of …*, or that the file was there already, with **Show** in it, which opens the project with its tabs beside the text and the file shown. With no project at all, the button is disabled.
- **Within a project nothing changes** in where a file goes: *Show the file* from a citation and from the references of a document, the chooser under the plus of a file side, and the item in Split view's menu all act on the project on screen, as decided in 0073.

### Several files at once, from the plus and from Split view

- **Add files to the tabs…**, under the plus of a file side and in Split view's menu, opens the chooser as the files of a reference have it: PDFs and images chosen one after another, by name or by searching, each staying chosen while the search changes, the button saying how many it adds; Enter adds them. All are added to the tabs after the one shown, in the order chosen, the last of them shown. Files already among the tabs are not offered. A chooser that leaves nothing to choose says so.
- The chooser's one-and-done way, where a press takes the file at once, is no longer used anywhere; the code that does it goes.

### What is not done

- No renaming of the files on disk, nor of files outside the library: export is where readable names on disk come from.
- No naming of a file when it is assigned to a reference.
- No columns in the thumbnails.
- No marks in the menu of projects for the files a project already has among its tabs: the notice says so after the fact.

## Choices made in writing this, which the owner has not been asked about

1. The file's own name stays in the list only where the work has another file of the same ending; elsewhere the tooltip carries it.
2. The pane's head names the file as the tabs do, and the *Name* field moves among the facts.
3. The name given on request is the name export gives, the ending kept, and the act gives the same names run twice.
4. A second file of the same work takes the file's own name after a dash, as export does; the owner may want to write a volume number there by hand.
5. The menu lists the project the window was last in first, then all projects as the start screen lists them, flat; no marks for the files a project has already.
6. The notice carries *Show*, which opens the project with its tabs and the file shown; nothing moves until it is pressed.
7. Several files chosen are added to one project's tabs in one step: a tab is one press to close, and the tabs have *Close the others*; this is unlike assigning, where one reference is never given to many files at once.
8. The files of a reference in the library's pane get the same menu; the ways in within a project are unchanged.

## Why not otherwise

- **Not the file's name as a column always**: it is the one thing in the line nobody chose, and it most often means nothing; where it means something, two files of one work, it is shown.
- **Not naming on assigning**: the owner's word; and a name written by hand is not taken away by a reference found later.
- **Not renaming on disk**: the store keeps files by their hash, and the name on disk is seen only on export, which names by the reference already.
- **Not a zoom on the press**: the preview is one page at one size, and reading, with zoom, is one press away in the view.
- **Not the project the window was last in, without asking**: the owner's word; the library is where files are catalogued, and the project to read them in is a choice.
- **Not a dialog for choosing the project**: a menu is one press, and the projects are few enough; where they are many, the menu scrolls.
- **Not marks in the menu**: the tabs of every project would have to be read to draw them, for a mark that the notice gives a moment later.

## Consequences

- Words in `files.ftl`, `library.ftl`, `viewer.ftl` and `project.ftl`, English and Norwegian: `files-show`, `library-pane-add-to-tabs`, `viewer-tab-add-title`, `project-beside-file` and `project-beside-file-title` change; words for the naming, its notice, and the notice of the tabs come. The core gains the naming of files by their references, with the rule of a second file lifted out of export where both can use it, and a command for it; `api/files.ts` and the files store carry it; `FilePane` moves its name among the facts and names the file by its reference at the head; `FileList` hides the name where the reference tells, and the tiles take the tabs' words; `viewer/show.ts` gains the menu of projects and the adding; the file route carries the project for *Show*; `FileChooser` loses its one-and-done way, and the plus and Split view take several files. The guide's *The files of the library* and *A file in a view* change; `e2e/files.mjs`, `e2e/file-view.mjs` and `e2e/library.mjs` grow or change where they press the button that is now a menu.

## Addendum, 2026-10-30: as built

Built on `main` from 7c6283d8 to the commit of this addendum: stages 1, 2's page and 3 by one builder, the core of stage 2 and its command by an agent in a worktree of its own, merged after. The editor fell over while stage 3's scripts were to run; the work was taken up again from the progress note, the commits and the agent's branch, and nothing was lost. Nothing is pushed.

What departs from the plan, or was settled in the building:

- **A file named by the work alone has no name of its own.** A second file attached from the reference is named by the work at attaching; named again, it keeps the work's name, rather than *Work - Work.pdf*, and export gives it *Work (2).pdf* by its numbering of names taken, as before. Export's naming changes only where it would have written the work's name twice. The rule of a second file is one function in `export.rs`, `name_of_work_file`, that export and the naming share.
- **A second file is told over the whole library**, as the list's twins are, not folder by folder as export tells them.
- **A file the store does not know, or one asked twice,** is passed over: neither named nor counted as kept.
- The core's tests are in `export.rs`'s tests, beside the export's and with their fixture, not in `mod.rs`'s. Clippy found two needless clones in them after the merge, mended there.
- **Where nothing was named and some files had no reference**, the notice says only that they kept their names, as plain news. Failures are told with the words of a failed renaming.
- *Name by the reference* in the menu of one file comes after *Assign to a reference…*; *Name by their references* for several after *Go through these…*, both with a tag for their icon.
- **Show, in the notice, puts the project in the place of a map** where the window has one, so that the text stays where the text was, else in the active side; the project comes alone with its tabs and the file, not with what stood beside it when it was left, since the file is what was asked for. The plan's way, a map laid as for a project that arrives, put the project in the place of the file's own side.
- **The menu of projects** has the project the window was last in first, then the others by name: the start screen lists the recent ones newest first and the rest in its tree, so "as the start screen lists them" gave no one flat order.
- The count of tabs added is taken through a callback of the store's change, told the tabs before and after, which runs when the tabs come where they had not.
- In the scripts: several files at once are tried in `e2e/file-view.mjs`'s Split view part, with a one-dot image made there, since the later checks of `e2e/source-tabs.mjs` count its tabs; that script checks the plus's words and that it offers only the files not among the tabs. The button beside a PDF in a reference's pane is tried in `e2e/files.mjs`, which stands in such a pane; `e2e/library.mjs` never presses one, and is unchanged.

Counts: `pnpm check` without errors or warnings; `pnpm test` 1357; `cargo test --workspace` 981, none failing (`glaukopis-core` 924 again after the mending of clippy's two); `cargo clippy --workspace --all-targets` without warnings. The scripts: `files` 117 of 117, `file-view` 52 of 52, `library` 40 of 40, `source-tabs` 35 of 35, `as-left` 31 of 31, `maps` 78 of 78, `languages` 17 of 17.

## Addendum, 2026-10-31: Split view loses its item for files

The owner, trying the build, asked that *Add files to the tabs…* leave the menu of Split view. The menu is for what the other side shows, a project, an element, the tabs; files are added where the tabs are, by the plus at the end of their row, which asks the same question, several files at once and the files among the tabs already left out. The item, its two words (`project-beside-file`, `project-beside-file-title`) and the chooser in the window went the same day; `e2e/file-view.mjs` presses the plus where it pressed the item, and checks that Split view offers no files. The guide's list of the ways into the tabs is shorter by one.
