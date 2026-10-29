# The tabs opened, files by their references, and a file read in the library — the build plan

The working plan for `docs/adr/0073-the-tabs-opened-files-by-their-references-and-a-file-read-in-the-library.md`. Read the record first, in full: it says what and why, and what was found; this says how, in which order, in which files, and how each stage is verified. Where they disagree, the record wins; say so in your report. Read also `.claude/briefs/common.md` (the progress note, the languages, the rules), and the records 0070 (one place for files) and 0072 (sources in tabs, with its addendum), whose code this builds on.

Read the last section of `docs/brief.md` (2026-10-29, *the tabs opened, files by their references, and a file read in the library*): it is the owner's words, and the record is read from them. Nobody answers questions while you build: where something is open, choose the plainer thing, write the choice down in your progress note and your report, and go on. The record's "Choices made in writing this" lists what the owner has not been asked about; build them as written.

Work on `main`. Commit after every stage that builds, with a message that says what was built, in the voice of `git log`. Keep `PROGRESS-opus.md` at the root as the common brief says. Build the binary, `cargo test` and `cargo clippy` only in a capped `systemd-run` unit, as `.claude/briefs/fewer-words/common.md` shows. Never push, never tag, never start the GitHub Installers workflow.

## Vocabulary

- *The tabs*: the row over a file side (`src/lib/viewer/TabRow.svelte`), each a file of the library at a place of its own; the project's, kept in its record (`sources` in the code, which keeps that name).
- *A file side*: a side of the window that shows the tabs (`FileSide.svelte`, `sides.svelte.ts`).
- *The files list*: the list of the files view (`src/lib/files/FileList.svelte`, in `FilesView.svelte`), one line a file, or tiles.
- *The pane*: the pane of the file selected, at the right of the files view (`FilePane.svelte`).
- *The reader*: the file shown large in the files view, in the place of the list (new).
- *The short form* of a reference: its people and year, *Lord 1960*, as `shortLabel` in `src/lib/library/format.ts` makes it.

## The words

Every word the user sees comes through `t('key')` from `locales/en/<part>.ftl` and `locales/nb/<part>.ftl`; write English and Bokmål together, in the same plain voice (`.claude/briefs/words.md` has the glossary). New keys go at the end of their files under a comment naming this plan. The other languages are left to be translated later; a key whose English changes is removed from the other languages' files so that they fall back (`scripts/prune-locales.mjs`); a key removed goes from every language.

```
viewer.ftl
# Changed: the row of tabs, and the tooltip of the project's name over a file side.
viewer-tabs = Tabs                                            | Faner
viewer-sources-of = The tabs of { $name }                     | Fanene til { $name }
viewer-tab-add-title = Add a file to the tabs                 | Legg til en fil blant fanene
# The reader of the files view.
viewer-back-to-files = Back to the files                      | Tilbake til filene

files.ftl
# Changed: Show becomes what it does; the preview and a double-click read.
files-show = Add to the project's tabs                        | Legg til i prosjektets faner
files-read = Read                                             | Les
# The columns of the reference in the list.
files-people = People                                         | Personer
files-year = Year                                             | År
files-title = Title                                           | Tittel
files-publisher = Publisher                                   | Utgiver
files-sort-year = By year                                     | Etter år
files-sort-title = By title                                   | Etter tittel
files-sort-publisher = By publisher                           | Etter utgiver
# The translators after the authors or editors: "Lord; tr. Smith".
files-translated = tr. { $names }                             | overs. { $names }

project.ftl
# Changed.
project-beside-file = Add a file to the tabs…                 | Legg til en fil blant fanene …
project-beside-file-title = Add a file to the tabs            | Legg til en fil blant fanene
project-beside-tabs = The project's tabs                      | Prosjektets faner

library.ftl
# The files of a reference in its pane: the act, as the files view names it.
library-pane-add-to-tabs = Add to the project's tabs          | Legg til i prosjektets faner
```

`files-sort-reference` (*By reference*) stays and means by people. `project-show-file` and `project-show-file-named` stay. The guide (stage 5) stops saying *sources*.

## Stage 1 — the words, and the tabs opened

### 1.1 The words — `locales/en`, `locales/nb`, the other languages

- As in *The words*. `viewer-tabs` is the label of the row for assistive tools (`TabRow.svelte`, `aria-label`); `viewer-sources-of` the tooltip in `FilePath.svelte`. Grep `src/` for `files-show`, `project-beside-file`, `viewer-tab-add-title` to see every use.
- In `src/lib/library/ReferencePane.svelte` (about line 447), the press on a file of a reference: a PDF or an image is added to the tabs, as now; its tooltip or label `library-pane-add-to-tabs`, where it has one.

### 1.2 The project's tabs, from Split view — `src/lib/project/sides.svelte.ts`, `ProjectView.svelte`, `sides.svelte.test.ts`

- `Sides.showTabs(): string | null`: the file side there is gets the focus; else a file side is made as `showFile` makes one (beside the active map, in the other side's place where there are two maps, alone with `lastProject` where there is no side), with no tab added; the key of the side, or none where nothing could be made (no project at all and no `lastProject`: then the empty side of no project, which is a side all the same). Reuse what `showFile` has in a private function that both call.
- `ProjectView.svelte`, `sideBySideMenu` (about line 596): `project-beside-tabs` after *Another project…* and before *Add a file to the tabs…*, `icon: PanelRight` or `Files` of lucide, `action: () => sides.showTabs()`.
- Tests: `showTabs` with one map (a file side beside, focused, no tabs), with a file side there (the focus alone), with two maps (the other side's place), with nothing (a side of no project).

### Verify

- `pnpm check`, `pnpm test`, `e2e/languages.mjs`.
- `e2e/source-tabs.mjs` grows: with the map alone (after the file side was closed in the second run), Split view → *The project's tabs*: the file side with its tabs as they were, the cell naming the project; the row's label is *Tabs*; the plus's chooser is titled *Add a file to the tabs*.

Commit: *The tabs are named tabs, adding to them says so, and Split view opens the project's tabs as they were.*

## Stage 2 — files by their references

### 2.1 The translators in the summary — `crates/core/src/library/entry.rs`, `src/lib/api/library.ts`, `src-tauri/src/contract.rs`

- `Summary` gains `pub translators: String`: `short_list(&self.people("translator"))`, as `authors` is made of the creators (`summary()`, about line 150); empty where there are none. Carried to the page as `translators: string`; the contract test's summary values gain it (`cargo test -p glaukopis contract` rewrites `contract.generated.ts`). A unit test beside the summary's: a work with a translator says it.

### 2.2 The columns — `src/lib/files/FileList.svelte`, `files/order.ts`, `order.test.ts`, `FilesView.svelte`, `files/store.svelte.ts`

- `store.svelte.ts`: `export function peopleWords(s: Summary): string` — `s.authors` (which says *edited by* where the editors stand for the authors, as the core marks it), then, where `s.translators` is not empty, `; ` and `files-translated` with them. `referenceWords` stays the short form for the tabs and the chooser (2.3).
- `FileList.svelte`, the line of a file in list mode (about line 345): where the file has a reference, in the place of the one `.reference` span, four cells: people (`peopleWords`), year, title, publisher, each `truncate`, followed by the file's name small (`.file-name`), then the date and the size as now; where it has none, the name first and *No reference* as now, with the figure's words where it is a figure (`used()`). With several references, the first, and ` +N` after the people as now. Widths: people `flex: 0 1 22%`, year `width: 48px`, title `flex: 1 1 30%`, publisher `flex: 0 1 18%`, the name `flex: 0 1 20%`; under 720 px of the list's width (`width`, measured already), one line as now: the short form, then the name. Keep the list's keys and selection untouched.
- `order.ts`: `FileSortKey` gains `'year' | 'title' | 'publisher'`; `sortFiles` orders by `references[0]`'s `yearNumber` (then people), `title` (folded, `localeCompare`), `publisher` (folded), files of no reference last whatever the direction, as `'reference'` does; `'reference'` itself orders by `authorsSort`, as now. Tests for the three.
- `FilesView.svelte`, `sortMenu` (about line 383): *By year*, *By title*, *By publisher* after *By reference*; the kept sort read with care where an older setting names none of these (`kept.sort`).

### 2.3 The same words everywhere a file stands in for its reference — `store.svelte.ts`, `TabRow.svelte`, `FileChooser.svelte`, `LibraryTrees.svelte`

- `store.svelte.ts`: `export function fileLabel(file: FileView | undefined, fallback = ''): { name: string; title: string }`: where the file belongs to a reference, `name` the short form of the first (`referenceWords`) and `title` the reference's title, a line break, and the file's name; else `name` the file's name (or `fallback`) and `title` the file's name.
- `TabRow.svelte`: the tab's words and its `title` from `fileLabel`; `nameOf` goes. `FileChooser.svelte` (about line 144): the first line `fileLabel(file).name`, the second the folder and the file's name where it differs. `LibraryTrees.svelte` (about line 68): the row's `name` from `fileLabel`, the file's name in `title`; the rows still sorted by what they show.
- The cell over a file side (`FilePath.svelte`) keeps the file's name.

### Verify

- `pnpm check`, `pnpm test` (`order.test.ts` grown; a test of `fileLabel` and `peopleWords` in `store.test.ts`), `cargo test -p glaukopis-core` and `-p glaukopis` capped.
- `e2e/files.mjs` grows: the PDF given to *Singer of Tales* shows *Lord*, *1960*, the title and the publisher in its line (`rows()` reads the cells: add `people`, `year`, `title`, `publisher` to what it reads, keeping `reference` as the people for the checks there are); Sort → *By year* puts it before a file of no reference; the file of no reference keeps its name first. Screenshot `files-2e-columns`.
- `e2e/source-tabs.mjs` grows: a file given to a reference shows the short form in its tab, and the tooltip holds the file's name.

Commit: *Files by their references: the people with their roles, the year, the title and the publisher in the files list, sortable; the same short form names a file in the tabs, the chooser and the tree.*

## Stage 3 — a file read in the library

### 3.1 The reader — `src/lib/files/FileReader.svelte` (new), `src/lib/viewer/`

- `FileReader.svelte`, props `hash: string`, `onback: () => void`: fetches the facts as `FileSide` does (`viewers.fetch(key, hash)` with a key of its own, `viewers.forget` on destroy; `viewers.get(key)`), and shows a head with *Back to the files* (`viewer-back-to-files`, an arrow icon, `data-reader-back`) and the file's name, then `ViewerBar` (page, field, zoom; no `onplaces`, no editing) and `PdfView` (`tab` a key of its own, `place` the top of page 1, `onplace` kept in the component alone, `onmiddle` for the bar, `zoom` and `onzoom` in the component) or `ImageView` for an image; the empty states of `FileSide` for a file gone, locked or not shown. Nothing of `sides`. Escape in the reader calls `onback`; the keys of pages and zoom work as in a side (they are bound by `PdfView` where the pointer is over the pages or the focus in them).
- Where `FileSide.svelte` and the reader would hold the same code (the facts, the empty states), lift it into a small shared piece only if that is less code than the repetition; do not change `FileSide`'s behaviour.

### 3.2 Reading from the files view — `FilesView.svelte`, `FilePane.svelte`, `FileList.svelte`

- `FilesView.svelte`: `let reading = $state<string | null>(null)`; in `.body`, `{#if reading}<FileReader hash={reading} onback={() => (reading = null)} />{:else}` the list as now. The pane at the right stays, of the file selected: reading a file selects it (`selection = [hash]`). Selecting another folder, searching, or going elsewhere ends the reading (`reading = null` where `folderId` changes). The list keeps its scroll (`filesUi.scrollTop`) and comes back where it was.
- `onopen` of the list (about line 591): a PDF or an image is read (`reading = f.hash`), another kind opened in its own program, as now. `FilePane.svelte`: the preview's press reads, its tooltip `files-read`; `kindActions` (about line 189): `read` first, `{ id: 'read', label: t('files-read'), icon: BookOpen }`, then `show` as *Add to the project's tabs* (`files-show`, `icon: PanelRight` or as the Split view item), then *Open in another program* and the rest. The pane tells the view through a prop `onread: (hash) => void`. The context menu of the list (`fileItems`) gains *Read* first for one PDF or image.
- Keys: in the `files` place, Escape ends the reading before it clears the search (`FilesView`'s `onkeydown`, about line 492).

### Verify

- `pnpm check`, `pnpm test`.
- `e2e/files.mjs` grows: double-click the PDF's row: the reader shows its first page (`[data-reader-back]` there, `.page[data-page="1"] img` complete) and the pane at the right still shows the file; the window's sides are untouched (no `[data-file-side]` anywhere; `location.hash` still `#/files…`); PageDown turns a page; Escape brings the list back with the row still selected; *Read* in the pane's actions does the same; the preview's press too. Screenshot `files-2f-reader`.

Commit: *A file is read in the library: the viewer in the place of the list, the pane beside it, nothing of the window touched.*

## Stage 4 — the guide, the record

- `docs/guide.md`: *The files of the library*: the list's columns and the orders; the pane's preview reads; the table of what can be done (*Read*; *Add to the project's tabs*; …); *Files and references* unchanged. *A file in a view*: every *source* and *sources* becomes *tabs* or *files in tabs* (the heading *Whose sources* becomes *Whose tabs*; *The tabs* stays), *Add to the project's tabs* where *Show* stood, *The project's tabs* in Split view's list, the chooser's new words. The *Keys* table: Ctrl+W's row says *tabs*.
- An addendum to 0073, *as built*: what departs from the plan, the choices made alone, the counts.

## At the end

- Run `e2e/files.mjs`, `e2e/source-tabs.mjs`, `e2e/file-view.mjs`, `e2e/library.mjs`, `e2e/maps.mjs`, `e2e/as-left.mjs`, `e2e/languages.mjs`, `e2e/image-editing.mjs`.
- Report: what was built, stage by stage, with the commits; what was left and why; the counts of `pnpm check`, `pnpm test`, `cargo test`, and every e2e script with its ok/FAIL counts; the paths of the screenshots to look at.
