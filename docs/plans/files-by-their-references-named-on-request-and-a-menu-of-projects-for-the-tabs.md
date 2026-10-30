# Files by their references, named by them on request, and a menu of projects for the tabs — the build plan

The working plan for `docs/adr/0074-files-by-their-references-named-on-request-and-a-menu-of-projects-for-the-tabs.md`. Read the record first, in full: it says what and why, and what was found; this says how, in which order, in which files, and how each stage is verified. Where they disagree, the record wins; say so in your report. Read also `.claude/briefs/common.md` (the progress note, the languages, the rules), and the records 0073 (files by their references, with its addendum), 0070 (one place for files) and 0043 (the files of the library, where the name a reference gives a file comes from), whose code this builds on.

Read the last section of `docs/brief.md` (2026-10-30, *files by their references, named by them on request, and a menu of projects for the tabs*): it is the owner's words, and the record is read from them. Nobody answers questions while you build: where something is open, choose the plainer thing, write the choice down in your progress note and your report, and go on. The record's "Choices made in writing this" lists what the owner has not been asked about; build them as written.

Work on `main`. Commit after every stage that builds, with a message that says what was built, in the voice of `git log`. Keep `PROGRESS-opus.md` at the root as the common brief says. Build the binary, `cargo test` and `cargo clippy` only in a capped `systemd-run` unit, as `.claude/briefs/fewer-words/common.md` shows. Never push, never tag, never start the GitHub Installers workflow.

## Vocabulary

- *The files list*: `src/lib/files/FileList.svelte`, in `FilesView.svelte`; one line a file, or tiles.
- *The pane*: the pane of the file selected, at the right of the files view (`FilePane.svelte`).
- *The tabs*: the row over a file side; a project's, kept in its record and read by `SourcesStore` (`src/lib/viewer/sources.svelte.ts`; `sources` is the code's inner name, kept).
- *The short form* of a reference: *Lord 1960*, as `shortLabel` in `src/lib/library/format.ts` makes it; `fileLabel` in `src/lib/files/store.svelte.ts` gives a file's words by it, the file's name in the tooltip.
- *The work's name* of a file: what `Library::file_name_for` builds of its first reference, *Nagy 1979 - The Best of the Achaeans* (`crates/core/src/library/mod.rs`, about line 689).

## The words

Every word the user sees comes through `t('key')` from `locales/en/<part>.ftl` and `locales/nb/<part>.ftl`; write English and Bokmål together, in the same plain voice (`.claude/briefs/words.md` has the glossary). New keys go at the end of their files under a comment naming this plan. The other languages are left to be translated later; a key whose English changes is removed from the other languages' files so that they fall back (`scripts/prune-locales.mjs`); a key removed goes from every language.

```
files.ftl
# Changed: the act opens a menu of projects.
files-show = Add to a project's tabs…                          | Legg til i et prosjekts faner …
# The menu of projects, and what came of the choice.
files-tabs-no-project = No project to add to                   | Ingen prosjekter å legge til i
files-added-to-tabs = Added to the tabs of { $project }        | Lagt til i fanene til { $project }
files-already-in-tabs = Already in the tabs of { $project }    | Allerede i fanene til { $project }
files-show-tabs = Show                                         | Vis
# Named by the reference, on request.
files-name-by-reference = Name by the reference                | Gi navn etter referansen
files-name-by-references = Name by their references           | Gi navn etter referansene
files-named = { $count ->
    [one] One file named by its reference
   *[other] { $count } files named by their references
}                                                             | Én fil fikk navn etter referansen / { $count } filer fikk navn etter referansene
files-named-kept = { $count ->
    [one] One file of no reference kept its name
   *[other] { $count } files of no reference kept their names
}                                                             | Én fil uten referanse beholdt navnet / { $count } filer uten referanse beholdt navnet
files-named-none = The names were by their references already  | Navnene var allerede etter referansene

library.ftl
# Changed: the files of a reference, in its pane.
library-pane-add-to-tabs = Add to a project's tabs…           | Legg til i et prosjekts faner …
```

`files-name` (*Name*) and `files-about` stay. Write the Bokmål plural forms with the same `{ $count -> [one] … *[other] … }` shape as `files-count` has.

## Stage 1 — the hand, and a file shown by its reference

### 1.1 The pointer — `src/lib/files/FilePane.svelte`

- `.preview` (about line 506): `cursor: pointer`. `.preview.none` keeps `default`.

### 1.2 The list — `src/lib/files/FileList.svelte`, `files/store.svelte.ts`, `store.test.ts`

- `store.svelte.ts`: `export function twinsOf(files: readonly FileView[]): Set<string>`: the hashes of files whose first reference has, among `files`, another file with the same ending (`fileEnding` from `$lib/util/file-name`, folded to lower case); a file of no reference is never a twin. Test it: two PDFs of one work are twins, a PDF and an EPUB of one work are not, a file of no reference is not.
- `FileList.svelte`: `const twins = $derived(twinsOf(store.files))`, over the whole library, not the folder in view. In the wide line of a file with a reference (about line 365), the `.file-name` cell only `{#if twins.has(file.hash)}`; the same in the narrow line (about line 368). The line's `title` (now set for the grid alone) becomes the file's name wherever the name is not in the line: a reference and not a twin, or the grid.
- The grid tile (about line 352): `{fileLabel(file).name}` in place of `file.name`; the tooltip stays the name.
- The sizes: with the name gone, `.title` may grow (`flex: 1 1 34%` already grows); leave the widths otherwise.

### 1.3 The pane — `src/lib/files/FilePane.svelte`

- The head (about line 289): in place of the `TextField`, a heading block `data-field="heading"`: the first line `fileLabel(file).name` (the short form, or the name), `class="heading"`, in the text face as `.title` of the list; where `fileLabel(file).named`, a second line with the reference's title, `class="sub truncate"`, `color: var(--ink-2)`. The kind icon stays before it.
- *About this file* (about line 419): before the `dl.facts`, a `.field` with the `TextField` of the name as it was (`label={t('files-name')}`, `bind:value={name}`, `serif`, the same `oninput`, `onblur`, `onkeydown`), `data-field="name"`, so that the scripts find it where it was named. Beside it, stage 2 puts *Name by the reference*.
- *made from* and *Copies made from it* (about lines 381 and 391): the link's words `fileLabel(copy).name`, `title={copy.name}`.

### Verify

- `pnpm check`, `pnpm test`, `pnpm format`.
- `e2e/files.mjs`: the rows of a PDF given to *Singer of Tales* no longer have a `[data-cell="name"]`, and the row's `title` is the file's name; a file of no reference keeps its name in the line; in the thumbnails the tile of the PDF says *Lord 1960*; the pane's head says *Lord 1960* with the title under it, and `[data-field="name"] input` is under *About this file* with the name in it; renaming there still works (there is a check of renaming already: keep it passing). Screenshot `files-2g-by-reference`.

Commit: *A file is shown by its reference where it has one: the name leaves the line, the tile and the pane's head, and stays among the facts; a hand over the preview.*

## Stage 2 — named by the reference, on request

### 2.1 The rule, in the core — `crates/core/src/library/export.rs`, `library/mod.rs`, `library/files.rs`

- `export.rs`: `ending_of`, `without_ending` and `cut_at_word` (about lines 101–130) become `pub(super)`, so that the naming uses them; export itself is not changed.
- `mod.rs`, beside `file_name_for`: `pub fn reference_name_for(&self, hash: &str) -> Option<String>`: the first entry with the file (`entries_with_file_hash(hash)`, about line 1274; none → `None`); `work = cut_at_word(&Self::file_name_for(entry))`; the ending from the record's path (`ending_of`); where the entry's attachments, in their order, hold before this file another file with the same ending (`attachments::hash_of_path`, as export's `position` does), the own name is the record's name without its ending and without a leading `"{work} - "`, and the name is `"{work} - {own}"`, or `work` alone where the own name is empty; else `work`. The ending appended. Where `work` is empty (a reference with no people, no year and no title), `None`.
- `mod.rs`: `pub fn name_files_by_reference(&mut self, hashes: &[String]) -> Result<Named>` with `pub struct Named { pub changed: Vec<String>, pub kept: usize }` (the hashes renamed; how many had no reference): for each hash, `reference_name_for`; none → `kept += 1`; a name equal to the record's → nothing; else `self.files.rename(hash, &name)?` (it checks the name as `file_rename` does) and `files_dirty = true`. Save as `file_rename` saves (`save_files`), once.
- Tests in `mod.rs`'s tests, beside the export's: a file attached from an entry is already named and is not changed; a file taken in as `scan0042.pdf` and linked to the entry after is named *Nagy 1979 - The Best of the Achaeans.pdf*; two PDFs of one work: the second becomes *… - <its own name>*, and the act run twice gives the same names; a PDF and an EPUB of one work both take the work's name; a file of no reference is counted as kept and not renamed.

### 2.2 The command and the page's side — `src-tauri/src/commands/files.rs`, `src-tauri/src/lib.rs`, `src-tauri/src/contract.rs`, `src/lib/api/files.ts`, `src/lib/files/store.svelte.ts`

- `files_name_by_reference(hashes: Vec<String>) -> CommandResult<NamedFiles>`, `NamedFiles { files: Vec<FileView>, kept: usize }`, the views of the files changed (`view(&library, hash)`); registered in `lib.rs` beside `file_rename`; a value in the contract test (`cargo test -p glaukopis contract` rewrites `contract.generated.ts`).
- `api/files.ts`: `filesNameByReference(hashes) => call<NamedFiles>('files_name_by_reference', { hashes })`.
- `store.svelte.ts`: `export async function nameByReference(hashes: string[]): Promise<void>`: calls it; `files.put` each file returned; `library.reload()` where any changed, since the library's pane lists a reference's files by their names; then the notice: `toasts.show({ kind: 'ok', message: t('files-named', { count }), detail: kept ? t('files-named-kept', { count: kept }) : undefined })`, or `notify(t('files-named-none'))` where nothing changed and nothing was kept, or, where nothing changed but some were kept, `files-named-kept` as the message. Errors through `notifyError(t('files-rename-failed'), e)`.

### 2.3 Where it is done from — `FilePane.svelte`, `FilesView.svelte`

- `FilePane.svelte`, beside the *Name* field under *About this file*: `{#if file.references.length}` a ghost `Button` `size="sm"` `data-name-by-reference`, `t('files-name-by-reference')`, `onclick={() => void nameByReference([file.hash])}`. The pane's `name` follows the record through the effect there is.
- `FilesView.svelte`, `fileItems` (about line 263): after *Assign to a reference…* for one file, and after *Go through* for several, an item `t('files-name-by-reference')` for one, `t('files-name-by-references')` for several, `icon: Tag` of lucide (or `TextCursorInput`), `disabled` where none of the chosen has a reference, `action: () => void nameByReference(hashes)`.

### Verify

- `pnpm check`, `pnpm test`, `cargo test -p glaukopis-core` and `-p glaukopis` capped, `cargo clippy`.
- `e2e/files.mjs` grows: the PDF given to *Singer of Tales* (taken in under its own name) is named from the pane: `[data-name-by-reference]`; the name field then holds *Lord 1960 - The Singer of Tales.pdf* (or what the fixture's reference gives: read it from the pane), the notice says one file was named; done again, the notice says the names were by their references already; the menu of two files chosen, one of no reference, says one named, one kept (or both kept where both are named already: arrange the fixture so that one is renamed); the name can still be changed by hand after, and stays. Screenshot `files-2h-named`.
- `e2e/library.mjs`: the reference's pane lists the file by its new name after the library reloaded, where the script passes that pane; else nothing.

Commit: *Files are named by their references on request, from the pane or the menu of the files chosen; a second file of one work keeps its own name after the work's.*

## Stage 3 — a menu of projects for the tabs

### 3.1 The adding — `src/lib/viewer/show.ts`, `src/lib/viewer/sources.svelte.ts`, a test beside `sources.test.ts` or `show.test.ts`

- `show.ts`: `export function addToTabs(project: string, hashes: string[]): { added: number }`: `sourcesStore.change(project, (s) => …)`: for each hash in order, `withFile(s, hash).sources` (a file with a tab is made active, not doubled); count those that had no tab before; the last is shown. Then the notice: `added ? t('files-added-to-tabs', { project: name }) : t('files-already-in-tabs', { project: name })`, `kind: 'ok'`, `action: { label: t('files-show-tabs'), run: () => router.go({ view: 'file', file: hashes[hashes.length - 1], project }) }`; the project's name from `projects.list` (`$lib/state/projects.svelte`). Since `change` takes a change for a project whose tabs have not come, the count is taken inside the change, and the notice shown from there: make the change return what it counted through a variable it closes over, and show the notice after `change` returns where the tabs were there, else when they come — plainer: `SourcesStore` gains `changeThen(project, change, then: (before, after) => void)`, or `change` gains an optional callback run after the change is applied, in both paths. Test the store: a change asked of a project not yet loaded runs its callback once the tabs come.
- `export function addToTabsMenu(anchor: HTMLElement, hashes: string[])`: items from `projects.list`: the project the window was last in (`sides.lastProject`, else `router.lastProject`'s project) first, where it is in the list, then a separator, then every project in the list's order (the one first included again? no: left out of the rest), `label: project.name`, `action: () => addToTabs(project.id, hashes)`; `openMenu(anchor, items, { align: 'start' })`. With no project in the list, the button that opens it is disabled (3.2), so the menu is not asked for; all the same, an empty list gives one disabled item `files-tabs-no-project`.
- The file route gains the project: `router.svelte.ts`, `Route`: `{ view: 'file'; file: string; page?: number; project?: string }`; parsed from `?project=` and written by `formatRoute`. `Sides.arrange` (`sides.svelte.ts`, about line 636): for a file route with a `project` that exists, where the active kept side is not that project's map, lay one map side of the project as the project branch does for a project that arrives (`arriving: true`, `fresh: true`, at `null`, `mode: 'diagram'`), then `showFile(route.file, …)` as now, which makes the file side beside it of that project; where the active kept side is that project's map, `lay()` as now. `router.lastProject` already takes the file route. Tests in `sides.svelte.test.ts`: a file route with a project lays that project's map and a file side of it with the file shown, where the kept sides showed another project; with the kept active map of the same project, the kept sides stay.

### 3.2 The ways in — `FilePane.svelte`, `FilesView.svelte`, `src/lib/library/ReferencePane.svelte`

- `FilePane.svelte`: `Action.run` becomes `(anchor: HTMLElement) => void`; the buttons pass `e.currentTarget as HTMLElement`; the `show` action: `label: t('files-show')`, `run: (anchor) => addToTabsMenu(anchor, [f.hash])`, `disabled` where `projects.list.length === 0` (add `disabled?: boolean` to `Action`, and to the `Button`). The import of `showFile` goes where nothing else uses it.
- `FilesView.svelte`, `fileItems`: the `files-show` item for one PDF or image becomes a submenu (`kind: 'submenu'`, `items` as `addToTabsMenu` builds them: lift the item-building into `export function tabsItems(hashes): MenuItem[]` in `show.ts`, used by both), and for several files a submenu too where any of them is a PDF or an image (the hashes of those alone), `disabled` where there is no project. The import of `showFile` goes.
- `ReferencePane.svelte` (about line 447): the button of a PDF or an image of the reference: `title={t('library-pane-add-to-tabs')}`, `onclick={(e) => addToTabsMenu(e.currentTarget as HTMLElement, [file.hash])}`; another kind opens in its program as now. The import of `showFile` goes where nothing else in the pane uses it (check: a citation's *Show the file* lives elsewhere).
- Grep `src/` for `showFile(` after: what stays must be within a project (ProjectView, the citation editor, the references of a document, `show.ts` itself).

### Verify

- `pnpm check`, `pnpm test`.
- `e2e/file-view.mjs` (about line 320): the press on `.file-pane [data-action="show"]` opens a menu; `app.clickText('[role="menuitem"]', 'Wrath and the hero')` (the project of the script); then: `location.hash` still begins with `#/files`, no `[data-file-side]` in the window, and a notice `Added to the tabs of Wrath and the hero` (`[data-toast]` or what the toasts render as; look at `e2e/lib`); press *Show* in the notice: the window shows the project with the file side and the PDF shown, `location.hash` beginning with `#/file/` and carrying `project=`. Then the rest of the script as it was. Do the same once more from the files view and check *Already in the tabs of …*.
- `e2e/files.mjs`: the list's menu of the PDF has *Add to a project's tabs…* as a submenu with the projects in it (open it, check the items, Escape).
- `e2e/library.mjs`: where it presses a file of a reference in the pane, the menu; else add a short check that the button's tooltip is *Add to a project's tabs…*.
- `e2e/source-tabs.mjs` and `e2e/as-left.mjs` still pass.

Commit: *Adding a file to the tabs asks which project, and stays in the library: a menu of projects from the pane, the list's menu and the files of a reference; Show in the notice opens the project with the file.*

## Stage 4 — the guide, the record

- `docs/guide.md`, *The files of the library* (about line 1185): *How the files are shown*: the line of a file with a reference no longer ends with its name, which is in the tooltip, and shows it only where the work has another file of the same ending; the tiles say the short form. *What a file is for*: the pane's head names the file by its reference, the name among the facts, where it is changed; **Name by the reference** beside it, and **Name by their references** in the menu of the files chosen, with one sentence on what the name is and that a second file of one work keeps its own name after the work's; that the file on disk is not renamed, export naming it. The table of what can be done: *Add to a project's tabs…* in place of *Add to the project's tabs*, with a sentence that it asks which project and stays, and that the notice's *Show* opens it. *A file in a view*, *Where a file comes* (about line 1352): the ways in from the library open a menu of projects; within a project nothing changes.
- An addendum to 0074, *as built*: what departs from the plan, the choices made alone, the counts.

## At the end

- Run `e2e/files.mjs`, `e2e/file-view.mjs`, `e2e/library.mjs`, `e2e/source-tabs.mjs`, `e2e/as-left.mjs`, `e2e/maps.mjs`, `e2e/languages.mjs`.
- Report: what was built, stage by stage, with the commits; what was left and why; the counts of `pnpm check`, `pnpm test`, `cargo test`, and every e2e script with its ok/FAIL counts; the paths of the screenshots to look at.
