# Build plan: the files of the library

The working plan for `docs/adr/0043-the-files-of-the-library.md`. Read the record first, in full: it says what; this says how, in which order, in which files, with which interfaces, and how each step is verified. Where they disagree, the record wins; say so in your report. Read also `docs/plans/the-shape-of-a-text-and-its-org-form.md`, section "How to work", which holds here too (plain words; never a record number when talking to the owner; verify before you commit; edit then format; e2e with `timeout`, processes ended by PID only; commit when a step is whole, never push; report the counts). Commit at the end of every step, and more often where a step is long: work that is not committed is lost when the session is.

## Vocabulary

- *Store*: `library/attachments/<2>/<hash>/<name>`, as `crates/core/src/library/attachments.rs` keeps it. It does not change.
- *Stored path*: `attachments/ab/abcd…/Nagy 1979 - The Best of the Achaeans.pdf`, relative to the library directory with forward slashes; what the `file` field of an entry names, `;`-joined (`entry.attachments()`, `set_attachments`).
- *Record*: `library/files.json`, new: the folders, and what is known of each file. `crates/core/src/library/files.rs`.
- *Assigned*: a file that at least one entry names; *unassigned*: one that none names.
- *Kind*: `pdf`, `picture`, `document`, `other`, by the ending of the name: `pdf`; `ocr::PICTURE_ENDINGS`; `import::document::ENDINGS`; the rest.
- *Going-through*: the dialog that assigns files to references, with the finding-out behind it.

## What exists, and what each piece becomes

| Today | Becomes |
| --- | --- |
| `attachments.rs`: `store_file`, `store_bytes`, `find_by_hash`, `describe`, `hash_of_path` | stay as they are; `describe` is joined by the record's view of a file |
| `library/mod.rs`: `attach`, `attach_stored`, `attach_unsaved`, `link_file*` | stay, and enter the file into the record where it is not yet |
| `library/mod.rs`: `detach`, `remove(ids)`, `delete_file_if_unused` | `detach` unlinks only; `remove(ids, with_files)`; `delete_file_if_unused` becomes `remove_file(hash)`, the one way out of the store |
| `library/mod.rs`: `replace_file` (a PDF made searchable) | the same, and the record follows the new hash; works for a file no entry names |
| `library/mod.rs`: `file_name_for(entry)` (private) | public; names the export |
| `commands/library.rs`: `attachment_add/remove/open/reveal`, `library_remove(ids)` | stay; `library_remove` gains `withFiles`; the files' commands go into `commands/files.rs` |
| `commands/sources.rs`: `identify` (a PDF's DOI/ISBN/arXiv/title, looked up), `plan_pdfs` | `identify` becomes `pub(crate)` and serves the going-through too; `plan_pdfs` stays |
| `import/pdf.rs`: `PdfFacts` | gains `first_page`; a new `from_name` reads a file's name |
| `duplicates.rs`: `Reason`, `Index::find` | `Reason` gains `Name` and `FirstPage`; a new `by_first_page` |
| `ReferencePane.svelte`: the file rows (open, reveal, make searchable, read into elements, remove) | stay; gain the picture's and the document's actions, *Take into the pictures*, and *Remove from this reference*, which no longer deletes |
| `ocr/SearchableDialog.svelte` (`reference`, `file`, `ondone(reference)`) | takes a file alone: `file`, `ondone(replaced: StoredFile)`; the reference pane maps it back |
| `ocr/PictureTextDialog.svelte` (`hash`, `name` of a picture) | also a file of the library: `file?: StoredFile`, read through `ReadStep` with `stored` |
| `documents/bringing.svelte.ts` `bringIn(path)`, `commands/reading.rs` `document_read(path)` | a `stored` flag, the path resolved in the store |
| `LibraryView.svelte` head | a switch *References · Files* |
| `state/router.svelte.ts` | a route `files` |
| `library/ImportDialog.svelte` | stays; the going-through is a dialog of its own |

Nothing changes in sharing, in the project file, in the pictures' store, or in the form of `library.bib`.

## Step 1 — the core: the record, the folders, and files that stay

### 1.1 The record — `crates/core/src/library/files.rs` (new)

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileFolder { pub id: String, pub name: String, #[serde(default)] pub parent: Option<String>, pub order: String }

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct FileRecord {
    pub hash: String,
    /// The stored path.
    pub path: String,
    /// What the file is called in the lists; at first, the name it was taken in under.
    pub name: String,
    pub folder: Option<String>,
    /// Where it came from: the path it was copied from, or "zotero", or nothing where it is not known.
    pub origin: Option<String>,
    /// When it was taken in, RFC 3339; for a file found in the store, the file's time.
    pub added: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Files { pub folders: Vec<FileFolder>, pub files: Vec<FileRecord> }
```

`Files::load(path)` (a missing file is an empty record), `save(path)` (`fsutil::write_atomic`, `serde_json::to_string_pretty`), `get(hash)`, `record(hash, path, name, folder, origin, now)` (enters a file not yet there; one that is there keeps its record), `forget(hash)`, `rename(hash, name)`, `move_file(hash, folder)` (the folder must exist), folders as `projects.rs` has them — `folder_create(name, parent, order after the last)`, `folder_rename`, `folder_move` refusing a folder under itself (`folder_under` as in `projects.rs`), `folder_delete` moving the folders and files in it up to its parent — and `reconcile(library_dir)`: walk `attachments/<2>/<hash>/` and enter every file whose hash the record lacks (name = the file's name, added = its modification time, folder and origin none); a record whose file is gone stays (the view says `exists: false`, as today). `reconcile` returns whether anything was entered.

`Library` gains `pub files: Files` and `files_path` (`dir.join("files.json")`), loaded in `open_at` after the collections and reconciled; `refresh` reconciles again when the library file was re-read. `save_files()` beside `save_collections()`.

Tests, in `files.rs`: the folder operations (mirror the tests of folders in `projects.rs`); `reconcile` over a store made with `attachments::store_file`; `folder_delete` moves files and folders up; `move_file` into a folder that is not there is refused.

### 1.2 The library — `crates/core/src/library/mod.rs`

- `attach`, `attach_stored`, `attach_unsaved`: after linking, `self.files.record(hash_of_path(&stored), stored, name of the stored file, None, Some(source path), now())` and `save_files()` (in `attach_unsaved`, leave the saving to the caller as the entries' is: add a `files_dirty` flag, or save the record in `import::apply` at the end — choose one and say which).
- `detach(id, stored)`: unlinks and saves; no deletion.
- `remove(ids, with_files: bool)`: as now; then, with `with_files`, every file of the removed entries that no remaining entry names goes through `remove_file`.
- `pub fn remove_file(&mut self, hash: &str) -> Result<()>`: unlinks the stored path from every entry that names it (one save), deletes the file's directory in the store, forgets the record, saves the record. Replaces `delete_file_if_unused`.
- `replace_file(stored, content)`: the new hash takes the old record's `name`, `folder`, `origin`, `added`; the old is forgotten; works when no entry names the file (drop the `not_found` check, keep replacing in the entries that do).
- `pub fn file_name_for(entry: &Entry) -> String`: public, unchanged (`creators()` already gives editors where there are no authors; the test of the export in step 4 covers it).
- `pub fn entries_of_file(&self, hash: &str) -> Vec<&Entry>`.
- `pub fn file_views(&self) -> Vec<FileView>` and `pub fn file_view(&self, hash) -> Option<FileView>`:

```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileView {
    pub hash: String, pub path: String, pub name: String, pub kind: FileKind,
    pub size: u64, pub exists: bool, pub folder: Option<String>, pub origin: Option<String>, pub added: String,
    /// The references the file belongs to, in the order of the library, as `summaries()` gives them (`Summary` carries the id).
    pub references: Vec<Summary>,
}
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FileKind { Pdf, Picture, Document, Other }
pub fn kind_of(name: &str) -> FileKind
```

`StoredFile` (`attachments.rs`) gains `kind: FileKind`, so the reference pane needs no second lookup.

- `pub fn take_in(&mut self, paths: &[PathBuf], folder: Option<&str>, structure: bool, progress: &mut dyn FnMut(usize, usize, &str), stop: &AtomicBool) -> Result<TakenIn>`:

```rust
#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TakenIn { pub files: Vec<FileView>, pub same: Vec<FileView>, pub folders: usize, pub problems: Vec<String> }
```

A path that is a file is copied with `store_file(dir, path, file name)` and recorded in `folder`. A path that is a directory is walked (no symbolic links followed; names beginning with `.` skipped; empty files skipped; count the files first so that `progress(done, total, name)` can say how far); with `structure`, a directory becomes a folder under the one above, named as it is, and one of that name under that parent is used when it exists; the top directory given becomes a folder under `folder`. A file whose hash the store has is `same`, left where it was in the record. Problems (a file that cannot be read) are collected, not fatal. Nothing is linked to any entry.

Tests: a tree of two directories and four files taken in with structure; the same tree again gives four `same` and no new folder; a file taken in twice under two names is one file.

### 1.3 The commands — `src-tauri/src/commands/files.rs` (new), `lib.rs`, `contract.rs`

```
files_list() -> FilesListing { folders: Vec<FileFolder>, files: Vec<FileView> }
files_folder_create(name, parent) -> FileFolder; files_folder_rename(id, name) -> FileFolder; files_folder_move(id, parent) -> FileFolder; files_folder_delete(id)
file_move(hash, folder) -> FileView; file_rename(hash, name) -> FileView; file_remove(hash)
file_assign(hash, id) -> FileView        // attach_stored by the record's path
file_unassign(hash, id) -> FileView      // detach
files_take_in(paths: Vec<String>, folder: Option<String>, structure: bool, ticket: Option<String>) -> TakenIn
files_take_in_stop(ticket)               // the event `files-progress` { ticket, done, total, name }, as `pdfs-progress` in sources.rs
file_to_picture(hash) -> Picture         // reads the stored file and adds it to the store of pictures as `picture_add_file` does
picture_to_file(hash, id: Option<String>, folder: Option<String>) -> FileView   // copies a picture into the store, links it to `id` where given
```

`library_remove(ids, with_files: Option<bool>)`. `commands/reading.rs` `document_read(path, ticket, stored: Option<bool>)`: with `stored`, `state.library().attachment_path(&path)`, as `ocr_look` does. `commands/ocr.rs` `ocr_searchable`: unchanged in its call; works through the new `replace_file`.

Register every command in `src-tauri/src/lib.rs`. In `contract.rs`, add values of `FilesListing`, `FileView`, `TakenIn`, `FileFolder` and the grown `StoredFile`, then `cargo test -p glaukopis contract` writes `contract.generated.ts`.

The interface's API: `src/lib/api/files.ts`, mirroring the above (`FileFolder`, `FileRecordView` named `FileView`, `FileKind`, `TakenIn`, `FilesListing`; `onFilesProgress(ticket, fn)` after `onPdfsProgress` in `sources.ts`); `src/lib/api/library.ts`: `StoredFile.kind`, `libraryRemove(ids, withFiles)`; `src/lib/api/imported.ts`: `documentRead(path, ticket, stored)`.

Verify: `cargo test -p glaukopis-core`, `cargo test -p glaukopis contract`, `pnpm check`, `pnpm test`. Commit.

## Step 2 — the files view

### 2.1 Route, rail, keys

- `src/lib/state/router.svelte.ts`: `| { view: 'files'; folder?: string; file?: string }`, parsed from `#/files?folder=…&file=…`, formatted the same way as `pictures`.
- `src/App.svelte`: render `FilesView` for `view === 'files'` where `PicturesView` is rendered.
- `src/lib/shell/Rail.svelte`: the library's place is `current` for `library` and `files`; its tooltip stays *Library*.
- `src/lib/shell/keys.svelte.ts`: a place `files` (the library's keys, `library-find`, do not reach it: add `files-find` Ctrl+F in place `files`); a key for the view, `{ id: 'files', keys: 'Ctrl+4', place: 'everywhere', bound: true }` — `grep "Ctrl+4" src/lib/shell/keys.svelte.ts` first; it was free on 2026-10-14. Words in `locales/en|nb/keys.ftl`. The palette lists what `keys.svelte.ts` lists; nothing more to do there.
- `src/lib/library/LibraryView.svelte`: at the head, left of the search, a `Segmented` (`src/lib/ui/Segmented.svelte`) with *References* and *Files*; *Files* does `router.go({ view: 'files' })`. `FilesView` has the same, going back to `{ view: 'library' }`.

### 2.2 State — `src/lib/files/store.svelte.ts`

```ts
class FilesState {
  loaded = $state(false); folders = $state.raw<FileFolder[]>([]); files = $state.raw<FileView[]>([]);
  load(); reload();                         // files_list
  get(hash): FileView | undefined;
  inFolder(id: string | null, below = true): FileView[];   // the folder's files, and those of the folders under it
  descendants(id): Set<string>;             // as `home/folders.ts` has it; import `descendants`/`ancestors`/`folderTree` from there if their Folder shape fits (id, name, parent, order) — it does; reuse, do not copy
  put(view: FileView); forget(hash); setFolders(folders);
}
export const files = new FilesState();
export function kindWords(kind: FileKind): string;
export function fileMatches(file: FileView, query: string): boolean;   // name, origin, each reference's authors and title, folded as `state/library.svelte.ts` folds
export async function takeIn(paths: string[], folder: string | null, structure: boolean): Promise<TakenIn | null>;  // progress through `dialogs.working`/`dialogs.stop` of `library/references.svelte.ts`, as `importPdfFiles` does; a toast with the counts
export async function removeFile(file: FileView): Promise<boolean>;   // confirms, naming the references it belongs to; `file_remove`; `library.reload()` where it had any
export async function assign(file: FileView, id: string): Promise<void>;   // file_assign; `files.put`; `library.reload()` or `library.put` of the reference
export async function unassign(file: FileView, id: string): Promise<void>;
```

After any change that touches an entry's `file` field, both states are brought up to date: `files.put(view)` and the library (`library.reload()` is cheap enough; `library.put(reference)` where the full reference is at hand).

### 2.3 The view — `src/lib/files/FilesView.svelte`, `FolderTree.svelte`, `FileList.svelte`, `FilePane.svelte`, `ReferenceChooser.svelte`

- **`FolderTree.svelte`**, after `library/CollectionTree.svelte` (its `Node`, its drag and drop with `dropTarget`/`startDrag`, its renaming in place, its context menu): the top node *All files* with the count of all, each folder with the count of the files in it and under it; the menu: *New folder inside*, *Rename* (F2), *Move to ▸*, *Export…* (step 4), *Delete* (confirm: "what is in it moves up"). Accepts a drop of files dragged from the list (`FILES_DRAGGED = 'files'`, declared in `files/store.svelte.ts` as `PICTURES_DRAGGED` is in `figures/pictures.svelte.ts`) and of paths from the desktop (into that folder, with structure).
- **`FileList.svelte`**: one row a file, `data-hash`, the kind's icon (`file-text` for pdf, `image` for picture, `file-type` for document, `file` for other), the name, the size (`fileSize` of `library/format.ts`), the first reference as *Authors Year* or, unassigned, a muted *No reference*; several selected (click, Shift, Ctrl, as `ReferenceList.svelte` does); drag of the selected rows (`startDrag` with `FILES_DRAGGED`); the context menu: *Assign to a reference…*, *Move to ▸* (the folders, as `collectionItems` lists collections), *Take into the pictures* (pictures), *Export…* (step 4), *Remove*. Sorted by name, added, size or reference, chosen at the head as the library's sort is.
- **`FilesView.svelte`**: the switch; the head with *Add files…* (`open({ multiple: true })`), *Add a folder…* (`open({ directory: true })`), *New folder*, *Go through…* (step 3), a menu with *Export all files…* (step 4); the search field (`files-find`), the filters as `Segmented`s or a popover like `FilterPopover.svelte`: kind (*All, PDFs, Pictures, Documents, Other*) and *Unassigned only*; a toggle *This folder only / with the folders under it* — default with; the tree at the left, the list in the middle, the pane at the right, as `LibraryView` is laid out. Drop on the view: `dropTarget({ accepts: ['files'], ondrop })` → `takeIn(paths, folderInView, true)`. `EmptyState` with the three ways of taking in when the store is empty. The route names the folder and the file; selecting changes the route with `router.replace`.
- **`FilePane.svelte`**: the name as a `TextField` (renames on blur or Enter, as `PicturePane` keeps the name), the folder as a path (`pathOf` of `home/folders.ts`) with *Move…*, the kind and the size, where it came from and when (`dateWords`), the references as links (`#/library?entry=<id>`) each with an *×* that unassigns, *Assign to a reference…*; then the actions of the kind:
  - pdf: *Open*, *Show in folder*, *Make searchable…* (`SearchableDialog` with `file`; on done, `files.put`), *Read into elements…* (`PdfMapDialog` with `file`), and a line *N pages · has text / no text* from `ocrLook(path, true)` asked when the file is selected (and not again for the same hash);
  - picture: *Open*, *Show in folder*, *Read the text…* (`PictureTextDialog` with `file`), *Take into the pictures* (`file_to_picture`, then a toast with *Show* → `#/pictures?picture=<hash>`);
  - document: *Open*, *Show in folder*, *Bring in as elements…* (`bringIn(path, { stored: true, name })` of `documents/bringing.svelte.ts`; `DocumentHost` is mounted in `ProjectsView.svelte` and `ProjectView.svelte` only — mount one in `FilesView.svelte` as well, so that the dialog appears there);
  - other: *Open*, *Show in folder*;
  then *Export…* (step 4) and *Remove* (danger). `attachment_open(path)`/`attachment_reveal(path)` serve *Open* and *Show in folder* with the stored path.
- **`ReferenceChooser.svelte`**: a `Dialog` with a search field over `library.entries` (`search()` and `sortEntries` of `state/library.svelte.ts`), at most 50 rows, each as `ReferenceRow` shows a summary, Enter or a click picks; *New reference…* at its foot opens `newReference()` of `references.svelte.ts` and picks what it returns. Used by the pane, the list's menu, the going-through, and `PicturePane`.
- **`ReferencePane.svelte`**: the file rows gain the picture's and the document's actions and *Take into the pictures*; *Remove* becomes *Remove from this reference* and calls `attachment_remove` as now, which no longer deletes; the confirm says the file stays in the library's files.
- **`PicturePane.svelte`**: *Attach to a reference…* → `ReferenceChooser` → `picture_to_file(hash, id, null)`; a toast.
- **Removing references** (`LibraryView.svelte`'s remove, and wherever `libraryRemove` is called — `grep -rn libraryRemove src`): where any of the references has files, the confirmation gains the choice. `confirm.svelte.ts`'s `Question` has no checkbox: use `ask()` with `alternative: t('files-remove-with-files')` as the third button — *Cancel · Remove, keep the files · Remove with the files* — and pass `withFiles` accordingly.

### 2.4 Words — `locales/en/files.ftl`, `locales/nb/files.ftl` (new), `core-library.ftl`

All the view's words under `files-`; the kinds (`files-kind-pdf = PDF`, …); the confirmations; the toasts (`files-taken-in = { $count -> [one] One file taken in *[other] { $count } files taken in }`, `files-same = { $count } already there`). The core's messages (`core-library-the-folder`, `core-library-folder-under-itself`, `core-library-not-a-folder`) in `locales/en/core-library.ftl` and `nb`. `node scripts/check-locales.mjs en` and `nb` pass.

### 2.5 e2e — `e2e/files.mjs` (first part)

In a temporary directory make a tree: `Greek/Homer/Nagy 1979 - The Best of the Achaeans.pdf` (a PDF by Typst as `sources.mjs` makes them, passed over where Typst is missing — then a `%PDF-1.4` stub, which is still taken in as a file), `Greek/plate.png` (the one-dot PNG of `contract.rs`, or any PNG of the fixtures), `notes.txt`. Through the view: *Add a folder…* cannot be driven (a system dialog), so call `invoke('files_take_in', …)` as `ocr.mjs` calls `attachment_add`, then check the tree shows *Greek › Homer*, the list shows three files, the filter *PDFs* shows one, *Unassigned only* shows three; assign the PDF to a reference through the pane and the chooser (the library of the fixture `sample.bib` is imported as `library.mjs` imports it); remove that reference with *keep the files*: the file is still there, unassigned; screenshots `files-1-view`, `files-2-pane`.

Verify: `pnpm check`, `pnpm test`, `cargo test -p glaukopis-core`, `pnpm e2e:build`, `timeout 400 node e2e/files.mjs`, and `library.mjs`, `ocr.mjs`, `pictures.mjs` still pass. Commit.

## Step 3 — the going-through

### 3.1 Finding out — `crates/core/src/import/pdf.rs`, `duplicates.rs`, `import/mod.rs`, `commands/files.rs`

- `PdfFacts` gains `pub first_page: String`: the text of the first page that has any, whitespace normalised, line breaks kept as `\n`, at most 4000 characters; `facts()` fills it from `raw.first`; for a scan, `identify_scan` fills it after Tesseract has read the first pages.
- `pub fn from_name(stem: &str) -> Option<Named>` with `pub struct Named { pub families: Vec<String>, pub year: Option<i32>, pub title: String }`: underscores to spaces; split at ` - `, ` – `, ` — `; a year 1450–2099 standing alone, or in parentheses or brackets, or glued to a name (`Nagy1979`), is the year; what stands before the year is the authors, split at `,`, `&`, ` and `, ` og `, ` und `, ` et `; what stands after is the title; without a year, the first part is the authors when it has at most three words and the rest is the title; when the first part has more than three words and the last part at most two (`The Best of the Achaeans - Nagy`), they are swapped; a stem with no letters, or that is only a number (`scan0001`, `document`), is `None`. Strip `(1)`, `copy`, `final`, `v2` at the end. Tests with at least twelve names, the ones above among them.
- `duplicates.rs`: `Reason` gains `Name` and `FirstPage`; `pub fn by_first_page(prints: &[Fingerprint], page: &str) -> Vec<Match>`: fold the page (`fold` of `bib/latex.rs`), split into lines; for every print whose first family name (`families[0]`, folded) occurs in the page as a word, compare `title_similarity`-wise the print against a fingerprint made of each line and of each pair of adjacent lines joined by a space (`without_article`), and where the best is ≥ 0.9, a `Match { certainty: Probable, reasons: vec![FirstPage] }`; most alike first; at most five. `Index` gains `pub fn prints(&self) -> &[Fingerprint]` or `by_first_page` becomes a method on it. Tests: a page with a title over two lines and the author's name; a page with the name but another title.
- `import/mod.rs`: `ReasonWord` gains `Name`, `FirstPage` (and the `From<Reason>`); `src/lib/library/ImportDialog.svelte`'s `reasonWords` and `src/lib/api/library.ts`'s reason type gain them, with words `library-reason-name = named like it`, `library-reason-first-page = the first page agrees`.
- `commands/sources.rs`: `identify` becomes `pub(crate)` and takes the path (already does) — call it with `library.attachment_path(&record.path)`.
- `commands/files.rs`:

```
files_identify(hashes: Vec<String>, ask: bool, ticket: Option<String>) -> Vec<Proposal>
files_identify_stop(ticket)                       // event `files-identify-progress` { ticket, done, total, name }
```

```rust
#[derive(Serialize)] #[serde(rename_all = "camelCase")]
pub struct Proposal {
    pub hash: String, pub name: String,
    /// Works of the library, the most certain first, at most five.
    pub matches: Vec<PlanMatch>,
    /// A new reference the services propose, when the identifier is not in the library.
    pub lookup: Option<Candidate>,
    pub notes: Vec<String>,
}
```

Per file, three at a time as `plan_pdfs` does, with the library's `duplicates::Index` built once over the entries: for a PDF, `identify` (which looks the identifier up when `ask`); the fingerprint of the lookup's draft, else of a draft made of the facts (doi, isbn, arxiv in `eprint`, title, authors, year) → `index.find` → matches, as `plan` makes `PlanMatch`es (with `fill_missing` for `gains`, which the dialog does not need to show); where none is *certain*: `from_name(stem of name)` → a draft (families as `author` literal names, year as `date`, title) → `index.find`, each match capped at `Probable` with `Name` added to its reasons; then `by_first_page` over the facts' `first_page`; dedup by id, keep the order certain → probable, at most five. `lookup` = the candidate from the services where `identify` got one and no match is certain. For a picture, a document or another file: `from_name` only; for a document, also its title from Pandoc if cheap — leave out and say so. `notes` carries what `identify` said (`core-import-number-unknown`, the services' failure).

### 3.2 The dialog — `src/lib/files/GoThroughDialog.svelte`, hosted by `FilesView.svelte`

Opened over a set of hashes: the selection where there is one, else the unassigned files of the folder in view and under it, else all unassigned. Phase *finding out*: a bar *N of M: name*, *Stop*; files already identified in this session are kept (a map hash → proposal in `store.svelte.ts`, forgotten on `reload`). Phase *deciding*: a list, one row a file — the kind's icon and name, then the proposal: the first match as `ReferenceRow`-like summary with the reason words (`reasonWords`), or *A new reference: <summary> · from <service>*, or *Nothing found*; the choice as a `Segmented`: *This one* (default where there is a match or a lookup), *Another…* (opens `ReferenceChooser`; the chosen reference shows in the row), *New reference…* (the form, prefilled from the lookup's draft or the name's `Named`; what it returns shows in the row), *Later* (default where nothing was found). Where there are several matches, the row's summary is a `<select>` of them. Head rows: *All certain: This one · Later*, *All probable: This one · Later*, as `ImportDialog` has `chooseForAll`. Foot: *N to assign, M later*, *Done*, *Cancel*. More than 400 rows: the rest as *… and N more*, as `ImportDialog` does.

*Done* applies in order and collects problems: for *This one* with a match → `file_assign(hash, id)`; with a lookup → `importApply({ source: name, items: [{ candidate: { ...lookup, files: [<absolute stored path from a new command file_path(hash)>] }, summary, matches: [], action: { kind: 'add' } }], warnings: [] })` so that the new reference is made and the file linked as any import links one (`attach_unsaved` finds the hash already in the store and only links); for a reference chosen or made by hand → `file_assign`. Then `files.reload()`, `library.reload()`, a toast with the counts.

### 3.3 Entry points

- After `takeIn` with new files: the toast carries *Go through N files…*, which opens the dialog over them.
- The head's *Go through…* button; the folder's context menu *Go through the unassigned files…*; the list's context menu over the selection.

### 3.4 Words, e2e

`files-go-through…` words; `e2e/files.mjs` second part: with the fixture library imported, a file named `Nagy 1979 - The Best of the Achaeans.pdf` (a stub PDF with no text; the name alone must do) is proposed to the reference of that title as *probable · named like it*; *This one*, *Done*: the file is assigned, the pane shows the reference; a file `scan0001.pdf` has *Nothing found* and *Later*; screenshot `files-3-go-through`.

Verify: the four checks and the e2e scripts of step 2. Commit.

## Step 4 — the export

### 4.1 The core — `files.rs`, `mod.rs`

```rust
#[derive(Debug, Clone, Deserialize)] #[serde(tag = "kind", rename_all = "kebab-case")]
pub enum ExportSelection { All, Folder { id: String }, Files { hashes: Vec<String> } }

#[derive(Debug, Clone, Default, Serialize)] #[serde(rename_all = "camelCase")]
pub struct Exported { pub files: usize, pub folders: usize, pub bib: Option<String>, pub problems: Vec<String> }

impl Library { pub fn export_files(&self, selection: &ExportSelection, into: &Path, with_bib: bool, progress: &mut dyn FnMut(usize, usize, &str), stop: &AtomicBool) -> Result<Exported> }
```

- `All`: the tree from the top, every folder a directory under `into`. `Folder`: the folder's files directly in `into`, the folders under it as directories. `Files`: the chosen files directly in `into`.
- The name of a file: `Library::file_name_for(first reference)` where it has one (the first in the order of the library), with the ending of the stored file; a second file of the same work in the same directory: `<that name> - <the record's name without its ending>.<ending>`; a file with no reference: the record's name; through `safe_file_name`; two that would still collide in one directory are numbered ` (2)`, ` (3)`; a file that is already in `into` under that name is not overwritten but numbered too. Copy to a temporary name beside the target and rename, as `store_file` does. Directory names through `safe_file_name` as well.
- `with_bib`: `references.bib` in `into`, the entries of every exported file that has any, written as `export(ids, false)` writes them, but with the `file` field set to the exported paths relative to `into`, `;`-joined, forward slashes. Add `pub fn export_with_paths(&self, ids: &[String], paths: &HashMap<String, Vec<String>>) -> String` beside `export`, sharing its body (lift the body into a private function that takes a closure for the `file` field).

Tests: a tree with two folders, a work with two files, a file with no reference, an entry with editors and no authors (`Snell 1971 - Tragicorum Graecorum Fragmenta`), a collision; `with_bib` names the paths.

### 4.2 The command and the view

`files_export(selection, into: String, with_bib: bool, ticket) -> Exported` with the `files-progress` event. In the interface: *Export…* in the folder's menu, the list's context menu, the pane; *Export all files…* in the head's menu. Each: `open({ directory: true, title })`, then `ask()` with *With a references.bib* as the alternative (or a small dialog with a checkbox if `ask` reads badly), then the progress as `takeIn` shows it, then a toast with the counts and *Show* (`attachment_reveal` refuses a path outside the library: add `reveal_path(path)` in `commands/system.rs`, with `app.opener().reveal_item_in_dir` as `attachment_reveal` uses it; there is no such command yet).

Words; `e2e/files.mjs` third part: export *All* into a temporary directory; check the directories `Greek/Homer` exist, the assigned file is named `Nagy 1979 - The Best of the Achaeans.pdf`, the unassigned `scan0001.pdf` keeps its name, and `references.bib` names `Greek/Homer/Nagy 1979 - The Best of the Achaeans.pdf`; screenshot `files-4-exported` of the toast.

Verify. Commit.

## Step 5 — the guide, the other scripts, the last checks

- `docs/guide.md`: a section *### The files of the library* under *The library*, after *PDF files*: the switch, the folders, taking in (files, a folder with its structure, dropping), what is done with each kind, assigning and the going-through with its reasons, that files stay when references go, exporting with readable names and the `.bib`. Under *PDF files*, a sentence that a dropped PDF also stands among the files. Under *Working together*: "Files of the library are not shared; the references themselves are" stays true. Under *Keeping things safe*: "the files of the library do not go with it" stays true; add that `files.json` beside the store is where the folders are. Under *Text in scans and pictures*: that a file of the library is made searchable or read from the files view as well.
- `node scripts/check-locales.mjs` over every language exits 0 (lacking words are not a fault).
- `cargo clippy -p glaukopis-core -p glaukopis` clean on what was touched.
- The full e2e set that touches the library: `library.mjs`, `sources.mjs`, `ocr.mjs`, `pictures.mjs`, `documents.mjs`, `files.mjs`.

Commit.

## Report

At the end: what was built step by step, what was left (the picture's and document's finding-out is by name only; no note on a file; no pages shown inside), the counts of `pnpm check`, `pnpm test`, `cargo test -p glaukopis-core`, and of each e2e script run; and a short list of the things in the record that the build found reason to do otherwise, if any.
