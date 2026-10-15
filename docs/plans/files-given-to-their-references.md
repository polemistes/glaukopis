# Build plan: files given to their references one by one

The working plan for `docs/adr/0046-files-given-one-by-one.md`. Read the record first, in full: it says what; this says how, in which order, in which files, with which interfaces, and how each step is verified. Where they disagree, the record wins; say so in your report. Read also `docs/adr/0043-the-files-of-the-library.md`, whose going-through this amends, and `docs/plans/the-shape-of-a-text-and-its-org-form.md`, section "How to work", which holds here too (plain words; never a record number when talking to the owner; verify before you commit; edit then format; e2e with `timeout`, processes ended by PID only; commit when a step is whole, never push; report the counts). Commit at the end of every step: work that is not committed is lost when the session is.

The whole of this is small enough for one session, in series; no worktree agents are needed. Build the binary once per step for the e2e script (`pnpm e2e:build`), with `CARGO_TARGET_DIR` left as it is.

## Why, in one paragraph

The owner selected a thousand files, chose *Assign to a reference…*, and the chooser asked "Choose" with a search over the references: the owner read it as "which work is this one" and gave all thousand to one book, twice. The going-through that was wanted (*Go through…*) exists and stood third in the menu. So: the many-to-one assignment goes from the selection; the going-through becomes the one action over several files and is offered where files come in; buttons over many things say how many and to what; what was done to many can be undone at once; and the going-through learns the folder's name and groups its rows by case, so that a thousand files are a few decisions.

## Vocabulary

- *Going-through*: `src/lib/files/GoThroughDialog.svelte`, with the finding-out behind it (`files_identify` in `src-tauri/src/commands/files.rs`, `proposals::propose` in `crates/core/src/import/proposals.rs`).
- *Proposal*: what was found out of one file (`Proposal` in `src/lib/api/files.ts`): its `matches` (works of the library, certain or probable, each with reasons), its `lookup` (a new reference from the services), its `named` (what its name says).
- *Case* of a proposal: *certain* (a certain match), *probable* (a probable match and no certain one), *new* (a lookup and no match), *nothing* (none of these).
- *Decision*: what the writer chose for a file (`Decision` in `src/lib/files/store.svelte.ts`): `this`, `other`, `new`, `later`.
- *The bar*: the line at the head of the files list that says how many files of the folder in view belong to no reference, and offers the going-through.
- *Assigned*, *unassigned*, *kind*, *record*, *store*: as in the plan of the files of the library.

## What exists, and what each piece becomes

| Today | Becomes |
| --- | --- |
| `FilesView.svelte` `fileItems(chosen)`: *Assign to a reference…* first, *Move to*, *Go through these N…* third | one file: *Assign to a reference…*, *Move to*, *Go through it…*; several: *Go through these N…* first, then *Move to*, *Export…*, *Remove*; no assignment |
| `FilesView.svelte`, the pane when several are selected: *Assign to a reference…*, *Move*, *Remove* | *Go through these N…* (primary), *Move*, *Export…*, *Remove* |
| `FilesView.svelte` `choosing: FileView[]` and `ReferenceChooser` titled `files-assign-many-title` | `choosing: FileView \| null`, one file; `files-assign-many-title` goes |
| `store.svelte.ts` `takeIn`: a message with the action *Go through the N new files…* | the message alone; the bar offers the going-through |
| `FilesView.svelte` head: the icon *Go through the files…* | stays |
| `GoThroughDialog.svelte`: rows in the order asked, `MOST = 400`, head rows for certain and probable, *Done* | rows in four groups by case, each with its count and head row, folded above 40; the button says *Give N files to their references*; the message after carries *Undo* |
| `proposals::Known { hash, name, facts, lookup, notes }` | gains `folders: Vec<String>`, the names of the file's folder and its parents, nearest first |
| `duplicates::Reason` | gains `Folder` |
| `library/format.ts` `reasonWords` | gains `'folder'` |
| `ReferencePane.svelte` `attach(paths?)`: attaches all picked or dropped | asks first where there are several, with the count and the title |
| `ReferencePane.svelte` files section: *Attach*, each file with × | also *Add files of the library…* and, with several files, *Remove all N from this reference* |
| `library/mod.rs` `detach(id, stored)` | also `detach_all(id)`, saved once |
| `commands/library.rs` `attachment_remove(id, path)` | also `attachment_remove_all(id)` |
| `src/lib/files/ReferenceChooser.svelte` | stays, for one file, a picture, and *Another…* |
| — | `src/lib/files/FileChooser.svelte`, new: files of the library picked by name, several at once |
| `e2e/files.mjs` part 2 (the offer taken from the message) | the offer taken from the bar; new checks below |

Nothing changes in the store, the record, sharing, the project file, or `library.bib`.

## Step 1 — the core and the commands

### 1.1 Every file taken from a reference at once — `crates/core/src/library/mod.rs`, `src-tauri/src/commands/library.rs`, `src/lib/api/library.ts`

```rust
/// Unlinks every file from the entry, saved once. The files stay in the
/// store and the record, as `detach` leaves them.
pub fn detach_all(&mut self, id: &str) -> Result<Entry>
```

A command `attachment_remove_all(id: String) -> CommandResult<Reference>` beside `attachment_remove`, registered in `src-tauri/src/lib.rs`; `attachmentRemoveAll(id)` in `api/library.ts`.

Test, in `library/mod.rs`'s tests beside those of `detach`: an entry with three stored files; after `detach_all` it has none, the record still knows the three, the files are on the disk, and `modified` moved.

### 1.2 The folder as a clue — `crates/core/src/import/proposals.rs`, `crates/core/src/duplicates.rs`, `src-tauri/src/commands/files.rs`

`Known` gains `pub folders: Vec<String>`: the names of the folder the file stands in and of the folders above it, nearest first, empty for a file in no folder. `files_identify` fills it from `library.files.path_of(folder)` (`crates/core/src/library/files.rs`), reversed to nearest first, while the library is held.

`Reason` gains `Folder` (`"folder"` in kebab case, as the others).

In `propose`, after the file's name and before the first page, where nothing is certain yet:

- The nearest folder whose name `pdf::from_name` reads with a year in it is *the named folder*; folders without a year say nothing (`Greek`, `To read`, `Articles`), whatever else their names say.
- What the file's own name leaves out, the named folder gives: families where the file's are empty, the year where the file's is none, the title where the file's is empty. Where the file's name says nothing at all (`chapter 3`, `scan0001`), the merged name is the folder's.
- A merged name that says more than the file's alone is looked for in the index as the file's name is (`draft_of_name`, `index.find`), with `Reason::Folder` on what it finds, probable; and it becomes `Proposal.named`, so that a new reference made from the row is filled from it.

Tests in `proposals.rs`, beside the one of the name: a file `chapter 3.pdf` in a folder `Nagy 1979 - The Best of the Achaeans` proposes that work, probable, with the reason `folder`, and `named` gives Nagy, 1979 and the title; a file `1979 The Best of the Achaeans.pdf` in a folder `Nagy` (no year) proposes by its name alone, without `folder`; a file `scan0001.pdf` in a folder `Greek` proposes nothing; a file in a folder `Lord 1960` within a folder `Nagy 1979 - The Best of the Achaeans` takes the nearer, `Lord 1960`.

`reasonWords` in `src/lib/library/format.ts` gains `'folder'`, and `locales/en/library.ftl` the words `library-reason-folder = in a folder named like it`.

Verify: `cargo test -p glaukopis-core library:: import::proposals`, `cargo test -p glaukopis contract` (the `Reason` kind in the contract, if it is in it: look). Commit.

## Step 2 — the files view

### 2.1 No assignment of several — `src/lib/files/FilesView.svelte`

- `fileItems(chosen)`: with one file, *Assign to a reference…*, then *Move to*, then *Go through it…*, then the file's own actions as today; with several, *Go through these N…* first, then *Move to*, *Export…* (`exportFiles({ kind: 'files', hashes }, n)`, as the pane does it today if it does; look), *Remove*. No *Assign* with several.
- The pane when several are selected (`selection.length > 1`): the buttons *Go through these N…* (primary, `data-go-through-chosen`), *Move*, *Export…*, *Remove*. The title `files-selected` stays.
- `choosing` becomes one `FileView | null`; the chooser's title is `files-assign-title` always. `files-assign-many-title` goes from `locales/en/files.ftl` and from every other locale that has it (`grep -rl files-assign-many-title locales`), so that the locales check does not count it.

### 2.2 The bar — `src/lib/files/UnassignedBar.svelte` (new), `FilesView.svelte`, `store.svelte.ts`

Above the list, under the head, when the folder in view, with the folders under it (at the top: all files), has files that belong to no reference and the bar is not hidden:

```
[icon] 1000 files here belong to no reference.    [Go through them…]  [×]
```

- Words, `locales/en/files.ftl`: `files-unassigned-here = { $count -> [one] One file here belongs to no reference. *[other] { $count } files here belong to no reference. }`, `files-unassigned-go = Go through them…`, `files-unassigned-hide = Hide this`.
- The count is `unassignedIn(folderId).length` (`store.svelte.ts`), as `goThroughHere` reckons it; the button calls `goThroughHere`.
- × hides the bar for the session for that folder (the top is its own key): `filesUi.barHidden: Set<string | null>` in `FilesUi`. `takeIn` clears the set when files were taken in, so that the bar comes back where new files are.
- `takeIn`'s message after taking in loses its `action`: `notifyOk(words)` for every case that is not a failure. `files-go-through-new` goes from every locale.
- `data-unassigned-bar`, with `data-count`, for the e2e script. The bar is one line, 32px high, in the colours of a hint (as `.hint` in the going-through), not a message.

Verify: `pnpm check`, `pnpm test`. Commit.

## Step 3 — the going-through

### 3.1 The rows in groups — `src/lib/files/GoThroughDialog.svelte`

The *deciding* phase shows four groups, in this order, each only where it has rows:

| Group | `data-group` | Its head | Its head row |
| --- | --- | --- | --- |
| found for certain | `certain` | `files-going-all-certain` (exists), with the count | *This one* / *Later* (exists) |
| found as probable | `probable` | `files-going-all-probable` (exists) | *This one* / *Later* (exists) |
| new from the services | `new` | `files-going-all-new = { $count -> [one] One is new, from the services: *[other] All { $count } new, from the services: }` | *New reference* / *Later*: `chooseForAll(list, 'this')` is what *This one* is for a lookup today (`done()` makes the reference from `p.lookup` on `'this'`); the segmented control shows the words `files-going-this-new = New reference` for this group |
| nothing found | `nothing` | `files-going-all-nothing = { $count -> [one] One with nothing found: *[other] { $count } with nothing found: }` | none; the rows are *Later* unless the writer chooses *Another…* or *New reference…* |

The head rows are shown for a group of one as well (today only above one): the words then read "The one found for certain:" as the plural forms already give. A group with more than `FOLDED = 40` rows shows its first 40 and a button `files-going-show-all = Show all { $count }` (`data-show-all`) that unfolds it; `MOST` and the line that said the rest were decided as they stand go. The `alike` derivation becomes `groups: Record<'certain' | 'probable' | 'new' | 'nothing', Proposal[]>`, by `certainty(p)` and `p.lookup`.

Keep the rows as they are inside their groups: the name, the segmented control, the proposal with its reasons, *Another…*, *New reference…*.

### 3.2 The button says what it does

`files-going-done = { $count -> [0] Nothing to give [one] Give one file to its reference *[other] Give { $count } files to their references }`, with `counts.assign`, disabled at 0 (`data-going-done` stays). The foot's `files-going-counts` stays beside it.

### 3.3 Undo — `GoThroughDialog.svelte`, `store.svelte.ts`, `FilesView.svelte`

`done()` records what it did:

```ts
/** What the last going-through did, while the application is open, so that it can be undone at once. */
export interface Done {
  /** The files given to references: each with the reference it went to. */
  assigned: { hash: string; id: string }[];
  /** The references made from the services' descriptions. */
  made: string[];
}
```

in `filesUi.lastDone: Done | null` (`FilesUi`). `assigned` gathers every `fileAssign` that succeeded; `made` is `outcome.added` of `importApply` (ids). Where `assigned.length + made.length > 0`, the message after the going-through is shown with `toasts.show({ kind: 'ok', message: words, action: { label: t('files-going-undo'), run: () => void undoLast() } }, 0)`: it stays until dismissed. Words: `files-going-undo = Undo`.

`undoLast()` in `store.svelte.ts`: for each of `assigned`, `fileUnassign(hash, id)` (problems gathered, not stopping); then `libraryRemove(made, false)` where `made` is not empty (the files of those references stay, as `withFiles = false` leaves them); then `files.reload()` and `library.reload()`; `filesUi.lastDone = null`; `notifyOk(t('files-going-undone', { count, made }))` with `files-going-undone = { $count -> [one] One file taken back *[other] { $count } files taken back } { $made -> [0] {""} [one] , one new reference removed *[other] , { $made } new references removed }` (write it as the Fluent of the project does selectors; look at `files-going-made` for the pattern). The decisions of those files (`decisions`) are cleared, so that a going-through opened again starts from the proposals.

While `lastDone` stands, `headItems()` in `FilesView.svelte` gains, after the separator before *Export all*, `files-undo-last = Undo: { $count -> [one] one file given to its reference *[other] { $count } files given to their references }` (`count = assigned.length + made.length`), which calls `undoLast()`. A new going-through that gives anything replaces `lastDone`.

Verify: `pnpm check`, `pnpm test`; a unit test of `undoLast` is not worth mocking the calls for, the e2e script covers it. Commit.

## Step 4 — the pane of a reference

### 4.1 Several files from the disk ask first — `src/lib/library/ReferencePane.svelte`

In `attach(paths?)`, where `chosen.length > 1`, before `attachmentAdd`:

```ts
const ok = await confirm({
  title: t('library-pane-attach-many-title', { count, title }),
  message: t('library-pane-attach-many-message'),
  confirm: t('library-pane-attach-many', { count }),
});
```

Words, `locales/en/library.ftl`: `library-pane-attach-many-title = Attach { $count } files to “{ $title }”?`, `library-pane-attach-many-message = Each becomes a file of this reference. To give many files each to its own reference, go through them among the files of the library.`, `library-pane-attach-many = Attach { $count } files`. `title` is the reference's title, or its key where it has none (`referenceWords` or what the pane uses for its heading; look). One file is attached as today, without asking.

### 4.2 Files of the library added to a reference — `src/lib/files/FileChooser.svelte` (new), `ReferencePane.svelte`

A dialog like `ReferenceChooser.svelte`, over the files of the library (`files` of `store.svelte.ts`, loaded on open as the chooser loads the library):

- a search box over the names (`fileMatches`), the kind icon, the name, the folder's name, and the references it belongs to in small (`referenceWords`), the unassigned first, then by name; at most 50 rows shown, as the chooser;
- a checkbox on each row (`aria-checked` on the row, space toggles, the arrows move), the chosen kept across searches;
- the foot: `files-choose-add = { $count -> [0] Add files [one] Add one file *[other] Add { $count } files }`, disabled at 0, `data-choose-add`; *Cancel*.
- `Props { title: string; except: string[]; onpick: (hashes: string[]) => void; onclose }`; `except` are the hashes the reference has already, left out of the list.

In the pane's files section head, beside *Attach*, a button *Add files of the library…* (`library-pane-add-files = Add files of the library…`, `data-add-files`), which opens the chooser titled `library-pane-add-files-title = Add files of the library to “{ $title }”` and, on pick, calls `fileAssign(hash, reference.id)` for each, reloads the reference (`library.put`, as `attach` does) and the files, and says `files-added-to = { $count -> [one] One file added to “{ $title }” *[other] { $count } files added to “{ $title }” }`.

### 4.3 All files taken from a reference at once — `ReferencePane.svelte`

In the files section head, where `reference.files.length > 1`, a ghost button `library-pane-unassign-all = Remove all { $count } from this reference` (`data-unassign-all`). It asks once: `library-pane-unassign-all-title = Remove all { $count } files from “{ $title }”?`, `library-pane-unassign-all-message = The files stay among the files of the library, where they can be found and given to other references. They are deleted only from there.`, confirm `library-pane-unassign-all-confirm = Remove { $count } files`; then `attachmentRemoveAll(reference.id)`, `library.put`, `filesState.reload()`.

Verify: `pnpm check`, `pnpm test`. Commit.

## Step 5 — the words, the guide, the e2e script

### 5.1 The guide — `docs/guide.md`, "The files of the library"

Rewrite *Files and references* and *Going through the files*:

- A file may belong to one reference, to several, or to none. *Assign to a reference…* in the pane of one file finds the reference as when you cite. Over several files there is no assignment to one reference: Glaukopis never gives one reference to many files in one step from a selection, since a thousand files given to one book by one click are a thousand to take back. Several files that are parts of one work are added from the work's side, *Add files of the library…* in the pane of the reference, or attached from the disk, which asks first when there are several.
- The going-through: the bar; what is found out (the identifier, the metadata, the name, the first page, and the folder's name where it is named as files are, with a year); the four groups and their head rows; that nothing is given until the button, which says how many; *Undo* in the message after, and in the menu of the head while the application is open.
- Taking files from a reference: the × beside one, *Remove all N from this reference* for all.

### 5.2 The e2e script — `e2e/files.mjs`

Part 2 changes where it took the offer from the message: after the two files are dropped, the bar says *2 files here belong to no reference* (`[data-unassigned-bar]`), and its button opens the going-through. Then new checks, in this order, with the names the script already uses:

1. With the two files selected (`selection` of both rows: click one, shift-click the other, or whatever the list supports; look at how `FileList` selects), the pane has no *Assign to a reference…* and has *Go through these 2…*; the menu over them (right-click) lists *Go through these 2…* first.
2. In the going-through: the groups `[data-group="probable"]` and `[data-group="nothing"]` stand, with the head words *The one found as probable:* and *One with nothing found:*; the button reads *Give one file to its reference*.
3. After it: the message carries *Undo*; clicking it takes the file back (its row says *No reference*) and says *One file taken back*; the bar says *2 files here belong to no reference* again. Then go through again, *This one* for the named file, and give it, so that the rest of the script finds the file assigned as before.
4. The folder clue: a temporary folder `Nagy 1979 - The Best of the Achaeans` holding a copy of the Nagy stub named `chapter 3.pdf` (made with `mkdtemp` and `copyFile`, as the script makes its stubs), dropped on the view with its structure; the bar offers; in the going-through the row *chapter 3.pdf* is proposed Nagy, probable, with the reasons containing *in a folder named like it*; *Later* for it, close.
5. The pane of the reference Nagy 1979: *Add files of the library…* opens the chooser; search `chapter`; tick *chapter 3.pdf*; the button reads *Add one file*; after it the reference has two files. Then *Remove all 2 from this reference* asks *Remove all 2 files from “The Best of the Achaeans”?* (or the key), confirmed with *Remove 2 files*; the reference has no files and both stand among the files, unassigned. Then give the named file back by *Assign to a reference…* in its pane, so that part 3 (the export) finds what it expects, or adjust part 3's expectations and say so.
6. Attaching from the disk: in the pane of Nagy 1979, drop the two stubs (`drop(paths, x, y)` on the pane); the question *Attach 2 files to …?* stands with the button *Attach 2 files*; cancel it; the reference's files are as before.

The count of checks grows; report it. Screenshots: `files-2-bar`, `files-3-go-through` (grouped), `files-3-go-through-dark`, `files-4-add-files`.

### 5.3 The other locales

New words go into `locales/en` only; the others lag, as usual. Removed keys (`files-assign-many-title`, `files-go-through-new`) go from every locale that has them. `node scripts/check-locales.mjs` reports 0 faults in every language.

Verify: `cargo test -p glaukopis-core`, `cargo test -p glaukopis contract`, `cargo clippy -p glaukopis-core -p glaukopis --all-targets`, `pnpm check`, `pnpm test`, `node scripts/check-locales.mjs`, `pnpm e2e:build`, `timeout 900 node e2e/files.mjs`, and `timeout 600 node e2e/documents.mjs` for the library's other paths. Commit.

## Report

At the end, to the owner, in plain words: what was built step by step; what was left; the counts of every check and of the e2e scripts; anything done otherwise than the record, with why. Do not build a package unless asked; offer it.
