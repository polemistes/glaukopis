# Build plan: the data folder, more than one window, favourite projects, and the copied space

The working plan for `docs/adr/0084-the-data-folder-chosen-by-the-writer.md`, `docs/adr/0085-more-than-one-window.md`, `docs/adr/0086-favourite-projects.md` and `docs/adr/0087-what-the-program-holds-in-memory.md`, and for the addendum of 2026-11-06 to `docs/adr/0041-the-shape-of-a-text-and-its-org-form.md`. Read the records first, in full: they say what and why; this says how, in which order, in which files, and how each stage is verified. Where they disagree, the records win; say so in your report. Read `CLAUDE.md` (the map of the code, the checks in their order, how the code is written) and `.claude/briefs/common.md` (the progress note, the languages, the rules); both hold here. Read the last two sections of `docs/brief.md` (both 2026-11-06): the owner's words, and the answers the records are read from.

Nobody answers questions while you build: where something is open, choose the plainer thing, write the choice in your progress note and your report, and go on. The records' "Choices made in writing this" are what the owner has not been asked about; build them as written.

Work on `main`. Six parts, in this order, each committed when it is whole and verified: the copied space (an hour), favourites (half a day), the data folder (a day), the typesetting bounded (a day to two, in two commits), more than one window (two to three days, in four commits), and the text view drawing what is near (a day to two; the one to leave where it will not come whole). The typesetting comes before the windows because what it keeps, measured, dwarfs what a window costs; the text view comes last because the windows do not wait for it. No part depends on an earlier one, except that the windows are measured with the script the typesetting stage makes; if the session ends, what is committed stands. Keep `PROGRESS-opus.md` at the root, not committed, written anew after every commit. Build the binary, `cargo test` and `cargo clippy` in a capped unit (`./capped.sh <name> <command>`, output in `run-<name>.log`), never in the editor's own scope. Never push, never tag, never start the Installers workflow. Commit messages are full sentences, as `git log` shows, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

**The owner's own Glaukopis may be running, on `~/.local/share/glaukopis`. Never touch it, nor that folder, nor `~/.config/glaukopis` once it exists.** The harness sets `GLAUKOPIS_DATA_DIR`; from this plan on it also sets `XDG_CONFIG_HOME` to a folder of the run (stage 3), so that no script ever reads or writes the owner's file of the data folder. Anything you run by hand gets both as well.

## The words

Every word the user sees comes through `t('key')` from `locales/en/<part>.ftl` and `locales/nb/<part>.ftl`, written together, in the same plain voice; `tr!("core-…")` in the core and the shell, from `locales/<tag>/core.ftl`. New keys go at the end of their files under a comment naming this plan. `common.ftl` may be used (`common-cancel`, `common-open`, `common-delete`), not added to. Norwegian quotes are «…». The other languages fall back to English until they are translated.

```
home.ftl
home-favourites = Favourites                                      | Favoritter
home-favourite-add = Add to favourites                            | Legg til i favoritter
home-favourite-remove = Remove from favourites                    | Fjern fra favoritter
home-new-window = New window                                      | Nytt vindu
home-open-window = Open in a new window                           | Åpne i nytt vindu

keys.ftl
keys-new-window = New window                                      | Nytt vindu

settings.ftl
settings-data-change = Change…                                    | Endre …
settings-data-move = Move everything to “{ $path }”               | Flytt alt til «{ $path }»
settings-data-use = Use what is in “{ $path }”                    | Bruk det som er i «{ $path }»
settings-data-use-note = What is in “{ $path }” now stays there, unused.   | Det som er i «{ $path }» nå, blir liggende der, ubrukt.
settings-data-not-empty = The folder is not empty.                | Mappen er ikke tom.
settings-data-restart = Glaukopis closes and starts again.        | Glaukopis lukkes og starter på nytt.
settings-data-move-button = Move                                  | Flytt
settings-data-use-button = Use                                    | Bruk
settings-data-copying = Copying… { $done } of { $count } files    | Kopierer … { $done } av { $count } filer
settings-data-failed = The folder could not be changed            | Mappen kunne ikke endres

core.ftl
core-data-cannot-open-title = The folder could not be opened      | Mappen kunne ikke åpnes
core-data-cannot-open = Glaukopis keeps everything in { $path }, which could not be opened: { $error }
                                                                  | Glaukopis har alt i { $path }, som ikke kunne åpnes: { $error }
core-data-usual = Use the usual folder                            | Bruk den vanlige mappen
core-data-quit = Quit                                             | Avslutt
core-data-move-failed = Everything stays in { $from }: it could not be moved to { $to }. { $error }
                                                                  | Alt blir i { $from }: det kunne ikke flyttes til { $to }. { $error }
```

## Vocabulary

- *The data folder*: `DataDir` (`crates/core/src/paths.rs`), opened once at start by `opening` in `src-tauri/src/lib.rs`, held by `AppState` (`src-tauri/src/state.rs`) with the claim.
- *The settings place*: where the system keeps a program's settings; `data-folder.json` stands there (record 0084, decision 1).
- *The location*: what that file says: the folder, and where a move is from while one is under way.
- *The arrangement*: `projects/folders.json`, `Arrangement` in `crates/core/src/projects.rs`: the folders, the form shown, the places on the map; the favourites go in it.
- *The rows*: what `rows()` in `src/lib/home/folders.ts` gives `ProjectList.svelte` to draw, a `Row` each.
- *An update*: the bytes Yjs gives for a change (`doc.on('update')` in `src/lib/project/model/project.svelte.ts`, about line 355), appended through `projectAppend` (`src/lib/api/projects.ts`) to `project_append` (`src-tauri/src/commands/projects.rs`, line 139).
- *An origin*: what a Yjs transaction says it came from (`src/lib/project/model/origins.ts`): `LOAD` is neither saved nor undone; the sharing's `Connection` passes itself (`src/lib/sharing/connection.svelte.ts`, line 140) and skips its own.
- *An area*: what the core says changed: the projects (their infos, the folders, the favourites, the trash), the library (entries, collections, files, notes), the settings, the languages, the words.
- *The hooks*: `testHook(name, value)` in `src/lib/shell/testing.ts` puts a function on `window` for the scripts, only when the harness runs the application (`GLAUKOPIS_E2E`).
- *PSS*: the proportional set size of a process, as `/proc/<pid>/smaps_rollup` gives it on Linux: its own memory and its share of what it shares with others. The numbers of record 0087 and of this plan are PSS, in megabytes; what a system monitor shows is RSS, which counts the shared libraries whole and is higher.
- *The kept documents*: `KEPT` in `crates/core/src/export/mod.rs`, the last four documents Typst set for the typesetting pane, kept whole in the Rust process to draw pages from; what stage 4 does away with.
- *A served child*: a process of `glaukopis-isolated` (`crates/core/src/isolated.rs`, `Serving`, `start_serving`, `ask`) that keeps something open and answers lines on its standard input within a bound of memory, as `crates/core/src/ocr/server.rs` keeps a PDF open to draw its pages (record 0072).

## Stage 1 — the copied space (the addendum to 0041)

Read `docs/adr/0041-the-shape-of-a-text-and-its-org-form.md`, *Text that looks like a sign* and the addendum; `src/lib/org/escape.ts` (its head comment, `ESCAPABLE`); `src/lib/org/inline.ts`, `escapeWords` (about line 322: the branch `isSpace(c) && (a === '' || a === '\n')` writes `\ {}`, and `isSpace(c)` with `b === ''` or `'\n'` writes `\ ` at a line's start) and whatever hands it `mode`; `src/lib/org/types.ts`, `OrgTextOptions`; `src/lib/editor/clipboard.ts`, `copiedText` (about line 130); `src/lib/org/org.test.ts` or wherever the escaping of spaces is tested (grep `\\ {}`), and `src/lib/editor/clipboard.test.ts`.

What was found: a paragraph whose text is `words ` is written `words\ {}`, one that is ` words` is written `\ words`, and both read back as they were. That stays for the files. The clipboard is the one writer that must not do it.

1. `OrgTextOptions` gains `trimmedLines?: boolean`: whether what reads the text trims the ends of its lines, as Org does; a space at the end or the start of a line is then written with a backslash, and at the end with empty braces after it. True where not given. Carry it to `escapeWords` through whatever carries `mode` and the options (`Writing`, `w`); where it is false, both branches write the space as it is. Nothing else changes: a line that is spaces alone, a break (`\\`) with a space before it, the verse form, are as they are, so check them in the tests you add rather than reason them out.
2. `copiedText` writes with `{ ...(org?.() ?? {}), trimmedLines: false }`. `pastedTextSlice` is as it is: it reads what others wrote, escaped or not.
3. Tests: in the Org tests, `words ` written with the option is `words `, and ` words` is ` words`, and without the option as before; in `clipboard.test.ts`, the copied text of a paragraph ending with a space ends with the space and nothing after it (`copiedText` already takes the final newline off), and of two paragraphs the first ending with a space, the first line ends with the space.

Verify: `pnpm check`, `pnpm test`; `e2e/paste.mjs` as it was (it copies in the text and pastes back). Commit.

## Stage 2 — favourite projects (0086)

Read `docs/adr/0063-the-list-is-the-tree.md`; `crates/core/src/projects.rs` (`Arrangement`, `Folder`, `folders`, `set_places`, `move_to_folder`, `delete`, `restore`, and the private functions that read and write `folders.json`); `src-tauri/src/commands/projects.rs` (`folders_list`, `project_move_to_folder`, `owl_places_set`); `src/lib/api/projects.ts`; `src/lib/state/projects.svelte.ts` (`load`, `folders`, `put`, `reload`); `src/lib/home/folders.ts` in full; `src/lib/home/ProjectList.svelte` (the folder row and the project row snippets, the drop targets, how `listUi.collapsed` folds a folder); `src/lib/home/list-keys.ts` (`ListRow`, `pressed`); `src/lib/home/project-actions.svelte.ts` (`items()` at about 695, `moveItems`, the ⋯ menu at about 660); `src/lib/home/StartView.svelte` (`recent`, the cards); `e2e/list.mjs` and `e2e/projects.mjs`; `docs/guide.md`, *Many projects* (about line 68) and *The start screen* (about 114).

### 2a — the core and the command

- `Arrangement` gains `favourites: Vec<String>` (`skip_serializing_if = "Vec::is_empty"`, so that an arrangement without any is written as today). `Projects::favourites() -> Result<Vec<String>>`; `Projects::set_favourite(id: &str, on: bool) -> Result<Vec<String>>`: `check_id`, the project must exist, on appends where it is not there, off removes; the order of the rest is kept. `delete` takes the id off (and `trash` is as it is: a project brought back is not a favourite again). `list()` and `info()` know nothing of it.
- Tests: on, on again, off, the order kept, delete takes it off, a project that is not there is refused.
- `src-tauri/src/commands/projects.rs`: `favourites_list(state)` and `favourite_set(state, id, on)`, registered in `lib.rs`; `cargo test` rewrites `src/lib/api/contract.generated.ts`, which is committed with the stage.

### 2b — the list, the menu, the start screen

- `src/lib/api/projects.ts`: `favouritesList()`, `favouriteSet(id, on)`.
- `src/lib/state/projects.svelte.ts`: `favourites = $state.raw<string[]>([])`, loaded where the folders are (`load`, `reload`); `setFavourite(id, on)` calls and takes the list given back; `isFavourite(id)`.
- `src/lib/home/folders.ts`: `RowsOptions` gains `favourites: readonly string[]`; `Row` gains `{ kind: 'favourites'; open: boolean; count: number }` for the heading, and `ProjectRow` gains `favourite?: true` for the rows under it (`depth: 1`). `rows()` puts the heading first, then the favourite projects that are there and match the filter, in the list's order, then the tree as today. A heading with nothing under it is not given. Folded (`collapsed` holds the key `favourites`), the heading alone.
- `ProjectList.svelte`: the heading drawn as a folder row is, with the star (`Star` of Lucide) for its icon and `t('home-favourites')`, folding on click and on the keys a folder folds on; a favourite's row drawn as a project row with no tree under it (the branch snippet is not mounted for it), no drop target, not dragged. `list-keys.ts`: the heading is a `ListRow` that folds; a favourite's row opens on Enter and has its menu on the menu key, as a project row; moving with Alt and the arrows does nothing on it.
- `project-actions.svelte.ts`, `items()`: after the fold item and before the first separator, *Add to favourites* or *Remove from favourites* by `projects.isFavourite(p.id)`, icon `Star`, action `projects.setFavourite(p.id, !on)`; a toast is not needed.
- `StartView.svelte`: a strip *Favourites* before the last opened, the same cards, in the list's order; `recent` leaves the favourites out. No favourites, no strip.
- Words: the five of `home.ftl` above, less the two of the windows.
- Guide: *Many projects* gains a paragraph on favourites (the menu item, the group at the top, the order); *The start screen* says the favourites come first.

### 2c — the script

`e2e/favourites.mjs` (first comment: what it covers): two projects made; *Add to favourites* on one from its row's menu; the heading and the row at the top; fold the heading, the row gone, unfold; open the project from the favourite's row, its tree under its own row only; the start screen shows it first; *Remove from favourites*; heading gone. `e2e/list.mjs`, `e2e/projects.mjs` and `e2e/tree-keys.mjs` as they were; `e2e/languages.mjs` finds no English in the Norwegian list.

Verify: steps 2 and 3 of `CLAUDE.md`, the scripts named, the screenshots looked at. Commit.

## Stage 3 — the data folder (0084)

Read `docs/adr/0084-…` in full; `crates/core/src/paths.rs` in full; `crates/core/src/shelf.rs` (things kept as JSON files: use it for the location if it fits, `serde_json` directly if not); `crates/core/src/notices.rs` (`tell`); `src-tauri/src/lib.rs` in full (`run`, `opening`, `Opening`, `speak_as_chosen`, `make_windows`, `say_and_end`, and the tests at its end); `src-tauri/src/state.rs` (`AppState::open`); `src-tauri/src/commands/system.rs`; `src/lib/api/system.ts`; `src/lib/settings/SettingsView.svelte` (the row of the data folder, about line 644); `src/lib/words/WordsBar.svelte` (a folder chosen with the dialog plugin); `src/lib/state/closing.ts` (how the window saves before it closes); `e2e/harness.mjs` (`launch`, the environment given to the application, about line 149) and `e2e/instances.mjs` (a second process watched); `e2e/settings.mjs`; `docs/guide.md`, *Keeping things safe* (about line 3301).

### 3a — the core

In `paths.rs`:

- `settings_place() -> PathBuf`: `$XDG_CONFIG_HOME/glaukopis` or `~/.config/glaukopis` on Linux; `~/Library/Application Support/glaukopis` on the Mac; `%APPDATA%\glaukopis` on Windows. Every function below takes the place as a parameter, so that the tests give a temporary one.
- `Location { folder: PathBuf, moving_from: Option<PathBuf> }`, read from and written to `data-folder.json` in the place: `location(place) -> Result<Option<Location>>` (no file, or an empty one: none; a file that cannot be read: an error, said at start as a failure to start, since silently using the usual folder would be worse); `set_location(place, &Location)`, written whole or not at all; `clear_location(place)`.
- `chosen_root(place) -> Result<PathBuf>`: `GLAUKOPIS_DATA_DIR`, else the location's folder, else `default_root()`. `default_root()` keeps its name and its meaning: the usual folder.
- `what_holds(folder) -> Holds` with `Empty` (not there, or no entries), `Glaukopis` (`library/library.bib` or `projects/` in it), `Other`.
- `copy_tree(from, to, newer_only, progress: &mut dyn FnMut(done: usize, count: usize)) -> Result<()>`: every file under `from`, leaving out `work/` at the top and `.in-use`; with `newer_only`, only files missing in `to` or newer by modification time or differing in size; the count first, then the files, the callback after each. `check_copy(from, to) -> Result<()>`: every file of `from` (the same left out) is in `to` with the same size; an error names the first that is not.
- `finish_move(place) -> Result<PathBuf>`, for the start: with no `moving_from`, the folder; with one, `fs::rename` where `to` does not exist or is empty, else `copy_tree(newer_only)` then `check_copy` then `remove_dir_all(from)`; then the location written without `moving_from`; the folder. On failure the location is written back to `from` alone, and the error returned, for the shell to tell.
- Tests, each in a `tempdir`: the location missing, written, read, cleared; the environment variable winning; `what_holds` three ways; a rename move; a copy move with the newer-only pass bringing a file written after the first copy; `check_copy` failing on a shortened file, and the move then leaving both folders and the location at `from`; `work/` left out.

Words: the five `core-data-…` above.

### 3b — the shell

- `lib.rs`, before `opening`: `let place = settings_place();` `finish_move(&place)` where a move is under way, logged; its failure is told with `notices::tell` (the core's own way of telling the page without being asked; the page shows notices when it starts), and the usual folder or the old one is opened. Then `chosen_root(&place)`, then `opening` as today.
- `Opening::Failed` where the root is a chosen one (the location named it): instead of `say_and_end`, a dialog with two buttons, `core-data-usual` and `core-data-quit` (`MessageDialogButtons::OkCancelCustom` of `tauri-plugin-dialog`), `core-data-cannot-open` as its text. On the first, `opening(default_root(), …)` in the callback, then `app.manage` and the windows; `make_windows` must take an `AppHandle` for that, which `WebviewWindowBuilder::from_config` accepts. On the second, exit 0. The usual folder failing too is a failure to start as today.
- `commands/system.rs`, all on `spawn_blocking` (see `commands/viewer.rs`):
  - `data_folder_check(path) -> Holds` as a string, `empty`, `glaukopis`, `other`; and whether `path` is the folder in use already (refused in the page as nothing to do).
  - `data_folder_move(window, path)`: `copy_tree(data.root(), path, false, progress)` with the progress emitted to the asking window as `data-folder-progress { done, count }` every file or every 200 ms, whichever is rarer; then `check_copy`; then `set_location(place, { folder: path, moving_from: data.root() })`. An error leaves no location written.
  - `data_folder_use(path)`: `set_location(place, { folder: path, moving_from: None })`.
  - `app_restart()`: sets `restart` on the state (an `AtomicBool`), then asks every window to close (`window.close()`, which the page meets with its saving in `closing.ts`, closing when done). In `run`'s callback, on `RunEvent::ExitRequested` with the flag set and the harness not running: `app.restart()`. When `GLAUKOPIS_E2E` is set, the program ends instead of starting again, since the driver cannot reach a program it did not start; log that it would have.
- `SystemInfo` gains `dataFolderChosen: bool`, true where the location named the folder in use, so that the settings can say so if ever needed; not shown now.

### 3c — the settings

- `src/lib/api/system.ts`: `dataFolderCheck`, `dataFolderMove`, `dataFolderUse`, `appRestart`, and `onDataFolderProgress(fn)` on the event.
- A new `src/lib/settings/DataFolderDialog.svelte`, mounted from `SettingsView.svelte`'s row with *Change…* beside *Open* (`settings-data-change`), so that `SettingsView` does not grow: the folder picker (`open({ directory: true })` of the dialog plugin, as `WordsBar.svelte` does), then `dataFolderCheck`; `other`: a dialog with `settings-data-not-empty` and *Close*; `empty`: `settings-data-move` with the path, `settings-data-restart`, *Move* and *Cancel*; `glaukopis`: `settings-data-use`, `settings-data-use-note` with the folder in use, `settings-data-restart`, *Use* and *Cancel*. On *Move*: the buttons go, `settings-data-copying` with the counts from the event, then `appRestart()`; on *Use*: `dataFolderUse` then `appRestart()`. A failure: `settings-data-failed` with the error, the dialog stays. A hook `__glaukopisDataFolder.choose(path)` goes past the picker.
- Guide, *Keeping things safe*, the bullet *Everything is in one folder* grows: *Change…* beside the path; an empty folder has everything moved there and the old folder is removed once everything is checked; a folder with Glaukopis's data is used as it is and what was used till now stays; Glaukopis closes and starts again; a folder on a disk that is not there when Glaukopis starts is asked about; a folder synced between two computers is used from one at a time, and Glaukopis never merges two.

### 3d — the harness and the script

- `e2e/harness.mjs`: `launch` gives the application `XDG_CONFIG_HOME` under the run's folder beside `app.dataDir`, for every script, so that no script can reach `~/.config/glaukopis`. Say so in the harness's comment.
- `e2e/data-folder.mjs`: through the hook, a folder with a stray file: *The folder is not empty*; a folder with `library/library.bib` made by the script: the dialog says *Use what is in*, cancelled; an empty folder: the dialog says *Move everything to*, *Move*; the copy runs, the application closes (watch the process as `instances.mjs` does); `data-folder.json` is in the run's `XDG_CONFIG_HOME/glaukopis`, naming the folder and `movingFrom`; the files are in the new folder, `work/` not among them. `e2e/settings.mjs` as it was.

Verify: steps 2, 3 and the scripts named; by hand once, with `GLAUKOPIS_DATA_DIR` unset and `XDG_DATA_HOME` and `XDG_CONFIG_HOME` both in a folder of your own, that a move and a restart go through, and that an unplugged folder (rename it) brings the dialog with the two buttons. Commit.

## Stage 4 — the typesetting bounded (0087, decisions 1, 2 and 6)

Read `docs/adr/0087-…` in full, its table first; `crates/core/src/export/mod.rs` (`set_for_preview`, `KEPT`, `KEPT_MOST`, `kept`, `kept_or_set`, `preview_ready`, `preview_made`, `preview_pages`, `preview_print_pages`, `pages_from`, and wherever `typeset::places`, `typeset::spots` and `typeset::texts` are called for the chips and the text of the pages; the export's own setting and `typeset::pdf`); `crates/core/src/export/typeset.rs` (`set`, `fonts()`, `comemo::evict(10)` at about line 193, `svg`, `texts`, `places`, `spots`, `pdf`); `crates/core/src/isolated.rs` in full (`Limits`, `available_memory`, `Serving`, `start_serving`, `ask`, `end`, `serve`, `task`, `end_with_parent`); `crates/core/src/ocr/server.rs` in full, the pattern to follow (`Served`, `MOST_OPEN`, `IDLE`, `keep`, `left_before`, how a served file is found by its key, asked, and ended); `crates/core/src/ocr/child.rs` (`serve_task`, `start_serving`: how the child reads a line, does the work, writes files into its place and tells their paths); `crates/core/src/bin/glaukopis-isolated.rs`; `src-tauri/src/commands/documents.rs` (`document_preview`, `document_preview_pages`, `document_preview_stop`, `previews()` and what it keeps per key, `document_export`); `src/lib/api/documents.ts` (`documentPreview`, `documentPreviewPages`, `documentPreviewStop`); `src/lib/preview/PreviewPanel.svelte` (`fetchNear`, and line 779 where `documentPreviewStop` is called); `src/lib/project/sides.svelte.ts` or wherever a project closing closes its typesetting pane; `e2e/preview.mjs`, `e2e/print.mjs`, `e2e/look.mjs`, `e2e/large.mjs` (how a script measures and fails only where it should; the processes of the run found by `GLAUKOPIS_DATA_DIR` in their environment); `e2e/harness.mjs` (`appPids`).

What was measured, and why this comes before the windows: the typesetting pane on a book of 432,000 words takes the Rust process from 137 to 1529 MB, and it holds that after the project is closed, since the document Typst set is kept to draw pages from, with three more before it is let go, and Typst's own cache goes ten settings later. On a book of 44,000 words the pane costs 150 MB in the Rust process and 80 in the page. A second window, by comparison, costs some 150 MB and its page's copy of the project. So the typesetting is bounded first, and its memory becomes the pane's: there while the pane is open, gone when it closes.

### 4a — the script that measures

`e2e/memory.mjs`, written first, so that the stage is measured before and after. Model it on `e2e/large.mjs`: it measures, prints, and fails only where it should.

- First comment: what it covers and how it is run; `node e2e/memory.mjs` makes its book and measures; `GLAUKOPIS_E2E_BINARY` measures another build, so that two can be compared.
- The book: an Org file of 40,000 words in 12 chapters, written by the script into the run's folder from a short list of words, and brought in through `window.__glaukopisOrg.open(path)` as `e2e/org.mjs` does (the question about its works does not come: it cites none). The file is made the same way every run, from a seeded generator, so that the numbers compare.
- The memory: the processes of the application are the driver's children (`app.appPids()`) and their descendants, found through `/proc/<pid>/task/*/children` as `appPids` finds the first; for each, its name from `/proc/<pid>/comm` and `Rss`, `Pss` and `Anonymous` from `/proc/<pid>/smaps_rollup`, in kilobytes. A process gone between the listing and the reading is skipped. The function that reads them goes into `e2e/harness.mjs` as `memory()`, giving `[{ pid, name, rss, pss, anonymous }]`, so that other scripts can ask.
- The states, each settled for a few seconds first, printed as a table of process, PSS, RSS and anonymous memory in megabytes, with the sums: the start screen; the book open in the text view; the typesetting pane open and its first pages come (`.preview .page`); the pane closed (Ctrl+T, or the pane's own close) and the project closed, twenty seconds later; the book opened again and closed again; and, once stage 5 is built, a second window open at the start screen through *New window* in the ⋯ menu, which is skipped where the menu has no such item, so that the script runs before stage 5 too.
- What fails: the Rust process twenty seconds after the typeset project was closed is more than 80 MB over what it was at the start screen (a generous bound: the allocator keeps some of what was freed; what is caught is a document kept, which is hundreds); a child of the typesetting is still alive then (name the task's process as the OCR's `pdf-serve` is named, and look for it); and errors in the window, as every script. The page's memory is printed and not judged: the web process gives memory back when it will.
- Run it against the build as it is before 4b and keep the table for the report: it must fail there, on the Rust process, which is the point.

Verify: the script runs to its end on the build as it is, with one failure, the one expected. Commit, with the harness's `memory()` and the script.

### 4b — Typst in a served child

- A new `crates/core/src/export/served.rs`, the child's side and the parent's together, modelled on `ocr/server.rs` and `serve_task` of `ocr/child.rs`: a task `typeset-serve` registered in `isolated.rs`'s `task()`, whose input is the pane's work folder (the `dir` of `set_for_preview`, which holds `document.typ`, `references.bib` and the files placed). The child answers lines on its standard input, each answered with lines and files in its place (the temporary folder the parent made for it under the work folder, as a served file's `place`):
  - `set`: sets `document.typ` with `typeset::set` and keeps the `PagedDocument` in place of the one before; answers the count of pages, each warning as a line, and the path of a JSON file holding `places(document)` and `spots(document, margins)` (the margins given on the line as the parent has them), since those are wanted once per setting and today come from the kept document. Typst's cache stays in the child between settings (`comemo::evict(10)` as today, there), since a document set again after a change is set anew only where it changed and the child's memory is bounded anyway.
  - `pages n n n…`: for each page it has, its SVG (`typeset::svg`) and its text runs (`typeset::texts`) written as `page-<n>.svg` and `page-<n>.json`, each told as a line with its number and the two paths. The parent reads them into `Page` as `pages_from` makes them today, and removes the files.
  - `print from to`: the pages for printing as `print-<n>.svg`, told the same way (`PrintPage`).
  - `pdf path`: `typeset::pdf` written to the path given, for an export that asks the child that serves the key rather than setting again in the process; told when written.
  - `end`, and the end of its input: the child ends. `end_with_parent` as every child.
- The memory given it: half the available memory (`available_memory()`), and 512 MB at least, as `Limits::for_file` reasons; the time per ask as the OCR's serving gives, generous for `set` of a long book (Typst took some fifteen seconds to set the 432,000 words in the measurement: give `set` two minutes, the rest thirty seconds).
- The parent, in `served.rs`: `Served { key, dir, serving, place, last_asked, asking }` as `ocr/server.rs` has, found by the preview's `dir`; at most `MOST_OPEN = 3` served (one pane per window, three windows), the one asked of longest ago ended when a fourth is started; `IDLE` ten minutes, looked at where the OCR's idle is looked at; `left_before` for the places of a run that was killed. `serving(dir) -> Option<Arc<Served>>` starts one where there is none and `isolated::program_is_set()`.
- `export/mod.rs`: `KEPT`, `KEPT_MOST` and `kept` go. `set_for_preview(dir, stop)` asks the served child `set` and gives back what `SetForPreview` gave, the count and the places and spots read from the file; `kept_or_set` becomes the child of the key, started where it ended, asked `set` only where it was just started (a child that lives has the document); `preview_pages` asks `pages`; `preview_print_pages` asks `print`; `preview_made` is as it is, through `set_for_preview`. `preview_stop(ctx, key)`, new, ends the child of the key. The export, where it sets the document in the process as today, calls `comemo::evict(0)` when it is done, so that nothing of it stays; where a child serves the key already (the pane is open on the document exported), it asks the child `pdf` instead.
- Where the child cannot be started (`program_is_set()` false, or the start fails): set in the process as today, keep one document at most, and let it go in `preview_stop`; log that the child could not be started, once.
- `commands/documents.rs`: `document_preview_stop(key)` also calls `export::preview_stop` (it needs the state for that: give it `state`), and lets go of what `previews()` keeps of the key. Make sure a project closing with its pane open reaches `documentPreviewStop`: the pane closes with its view (the brief of 2026-10-23), and `PreviewPanel.svelte`'s line 779 runs when the pane goes; check it in the harness by watching the child end when the project is closed, and if the call does not come, make the sides call it when they close a pane.
- Tests: `served.rs`'s own, as `ocr/server.rs` is tested, with the real child (`cargo test` builds `glaukopis-isolated`): `set` on a small `document.typ` answers the count; `pages` writes the files; a second `set` after the file changed answers the new count; `end` ends it; a child whose place was removed is started again. The export's eviction has no test.
- Timing, measured and reported: the time to the first page of `e2e/preview.mjs`'s document and of the memory script's book, before and after; the child's start and its loading of the fonts come before the first page now, and must not add more than a second. Where they add more, keep the child alive for the pane's life and start it when the pane opens, before the document is readied, so that the fonts load while Pandoc runs.

Verify: steps 2 and 3; `e2e/memory.mjs` passes now and its table goes in the report beside the one from before; `e2e/preview.mjs`, `e2e/print.mjs`, `e2e/look.mjs`, `e2e/large.mjs` and `e2e/the-document.mjs` as they were (they drive the pane through its pages, printing, the Look, and the document marked); by hand off-screen, that the child is in the process tree while the pane is open and gone twenty seconds after the project is closed, and that a second typesetting pane (split view, two projects, both panes open) is served by a second child. Commit.

## Stage 5 — more than one window (0085, and 0087 decision 3)

Read `docs/adr/0085-…` in full; `src-tauri/src/lib.rs` (`make_windows`, `show_late`, `watch`; the `run` callback); `src-tauri/tauri.conf.json` (the window `main`); `src-tauri/src/commands/projects.rs` (`project_append`, `project_save_state`, `project_save_view`, `project_save_sources`); `src-tauri/src/commands/system.rs` (`settings_load`, `settings_save`); `crates/core/src/settings.rs` and `notices.rs`; `src/main.ts` and `src/App.svelte` (how the page shows its window, how `lastPlace` and `window` are read at start); `src/lib/state/window-place.ts`, `closing.ts`, `router.svelte.ts` (`formatRoute`, `parseRoute`), `settings.svelte.ts` (`set`, `#write`, `load`), `projects.svelte.ts` (`openProject`, `put`, `reload`), `library.svelte.ts` (`reload`), and the stores of the files (`src/lib/files/`), the languages and the words; `src/lib/project/model/project.svelte.ts` (the constructor's `doc.on('update')` at about 355, `#saving`, the undo manager and its `trackedOrigins`), `origins.ts`; `src/lib/sharing/connection.svelte.ts` (`#onUpdate`, where what comes from the server is applied); `src/lib/api/backend.ts` (`call`, `withHead`) and `notices.ts` (`listen`); `src/lib/shell/keys.svelte.ts` (`ENTRIES`, the `everywhere` keys and where they are bound); `src/lib/home/project-actions.svelte.ts` (the ⋯ menu, `items()`); `e2e/harness.mjs` (`App`, `raw`); `e2e/instances.mjs`; `docs/guide.md`, *Many projects* and *Keys*.

Build it in four commits, each verified: 5a a second window; 5b the project in two windows; 5c the lists follow; 5d the second start and the script.

What a window costs, measured (record 0087): on Linux a window is a WebKitWebProcess of its own, some 150 MB with the interface loaded and nothing open, and then its page's copy of what it shows, the open project's document (30 MB for a novel, 110 for a book of 432,000 words), the list of projects, the library's summaries and the settings, a few megabytes together. The Rust process is one for all the windows. The lists are summaries already and need nothing; the workers of the search and the history are made when first asked and need nothing. What can be saved is the engine's baseline, by every window's page sharing one web process: the third thing to find out.

### Before anything: three things to find out

1. **Does tauri-driver pass window handles through?** The harness speaks WebDriver to tauri-driver, which proxies WebKitWebDriver. Try `GET /session/:id/window/handles` and `POST /session/:id/window { handle }` against a running application once 5a makes a second window. If they pass, the script of 5d switches windows and the harness gains `windows()` and `switchTo(handle)`. If not, the script checks the second window through a command `windows_list` (the labels) and the log, and the relays are checked in the unit tests; say which in your report.
2. **Does the single-instance plugin work without a session bus?** On Linux it registers a name on the D-Bus session bus. Try it under the harness (Xvfb, no desktop) in 5d: where there is no bus, the plugin must fall through to a normal start, and the claim then meets the second process as today. If it does not fall through, start the harness's application under `dbus-run-session` in `launch`.

3. **Does a related view share the web process, and what does it save?** Tauri 2.12 has `WebviewWindowBuilder::with_related_view(webkit2gtk::WebView)` on Linux (`tauri/src/webview/webview_window.rs`, about line 1457), which hands wry the view a new one is related to; WebKitGTK then puts the new view in that view's web process. The first window's view comes out of `WebviewWindow::with_webview(|platform| platform.inner())`, which runs its closure on the main thread: build the second window inside that closure, or send the view out through a channel and build on the main thread. In 5a build the new window both ways, behind a constant, and measure each with `e2e/memory.mjs` (its last state, a second window at the start screen, and once with the same project in both): keep the related view where a second window costs 40 MB less or more and every script of 5d passes with it; else each window is its own process, and the record's addendum says what was measured. With one process, a crash of the web process ends every window's page at once, which the saving of every change as it is made makes bearable: say so in the guide's section on windows where the shared process is kept.

### 5a — a second window

- `lib.rs`: `make_windows` becomes `make_window(app: &AppHandle, label: &str, open: Option<&str>, beside: Option<&WebviewWindow>) -> tauri::Result<WebviewWindow>`, used for `main` from the configuration as today and for the others with the same title, size, least size and drag-and-drop (`WebviewWindowBuilder::new(app, label, WebviewUrl::App("index.html".into()))`), hidden until the page shows it, watched, `show_late`. `open`, a route, goes into the page as `window.__glaukopisOpen = "<route>"` by an initialization script, as `__glaukopisTesting` does. `beside` gives the place: the outer position of that window plus 40 pixels each way, on the same monitor. Labels `window-2`, `window-3`, … from a counter on the state. On Linux, where the third thing to find out kept it, the builder is given `with_related_view` of the first window's view, so that the page is in the first window's web process; the constant that chooses stays, so that the other way is one line away.
- `commands/system.rs` (or a new `commands/windows.rs`): `window_new(app, window, open: Option<String>)`, the asking window as `beside`.
- `src/main.ts` / `App.svelte`: a page with `__glaukopisOpen` goes there instead of to `lastPlace`, and is not placed from `settings.window` (the shell placed it). `window-place.ts`: nothing changes for `main`. `closing.ts` works per window as it is (`getCurrentWindow()`); every window writes `window` and `lastPlace` on closing, so the last to close is what is kept; make sure a window closing while others stay does not end the program (Tauri ends it on the last by itself) and does not run the tasks of the others.
- The key and the items: `ENTRIES` gains `{ id: 'new-window', keys: 'Ctrl+Shift+N', place: 'everywhere', bound: true }`, bound where the `everywhere` keys are, with `keys-new-window`; the ⋯ at the head of the list of projects gains *New window* (`home-new-window`, icon `AppWindow`); `items()` gains *Open in a new window* (`home-open-window`, the same icon) after *Open* and *Open beside*, calling `windowNew(formatRoute({ view: 'project', project: p.id }))`.
- The settings are written key by key from here on, so that the second window's writes do not erase the first's: `settings.svelte.ts` keeps the keys changed since the last write and sends them alone to `settings_set(partial)`, which the core merges into the file (`settings::merge`, written whole or not at all); `settings_save` stays for the first write that makes `person`, or goes if that can be a merge too. `settings.reload()` reads the file again and keeps the keys not yet written.
- Guide: a section *More than one window* after *Many projects*: the three ways to a new window, that every window shows the same projects and library, that a project may be open in two and is one, that closing one closes it alone. *Keys* gains Ctrl+Shift+N.

Verify: steps 2 and 3; `e2e/memory.mjs`, whose last state now runs, with its table for the report, both ways where the third thing was tried; by hand off-screen (the harness) that a second window opens with the start screen and with a project, that closing it leaves the first, and that closing the first leaves the second and the program running. Commit.

### 5b — a project in two windows

- `origins.ts` gains `WINDOW = 'window'`: what came from another window of this program; saved by that window, not by this; not undone here.
- `commands/projects.rs`, `project_append(window, state, request)`: after the core appends, `app.emit_filter("project-update", ProjectUpdate { id, update: base64 }, |target| target.label() != window.label())` (`Emitter::emit_filter` of Tauri 2). Base64 keeps the update one string; updates are a few bytes a keystroke and tens of kilobytes for a paste.
- `src/lib/api/projects.ts`: `onProjectUpdate(fn(id, update: Uint8Array))` over `listen`.
- `state/projects.svelte.ts`: one listener for the window; for an open project with that id, `project.applyFromWindow(update)`.
- `project.svelte.ts`: `applyFromWindow(update)` is `Y.applyUpdate(this.doc, update, WINDOW)`. In `doc.on('update')`: for the origin `WINDOW`, the revision rises and the listeners are called, so that the views redraw, but `#saving.change` is not called: the other window saved it. The undo manager does not track `WINDOW` (check `trackedOrigins`). `afterTransaction` for the history skips it as it skips what is not local.
- `project_save_state` from either window is complete after the relay, and an update appended after a state is replayed on load, as today; nothing to do. `project_save_view` and `project_save_sources` are written by whoever leaves last; nothing to do.
- Tests: in `project.svelte.ts`'s tests, an update applied with `WINDOW` changes the document and the revision and is not appended; in `projects.svelte.ts`'s, the listener applies to the open project with the id and ignores the rest.

Verify: steps 2 and 3; by hand off-screen, the same project in two windows, typed in one, seen in the other, undo in the first undoing only its own. Commit.

### 5c — the lists follow

- `crates/core/src/changes.rs`, after `notices.rs`: `Area { Projects, Library, Files, Settings, Languages, Words }`; `on_changed(f: impl Fn(Area))`; `changed(area)`. The call goes into the one function of each store that writes its file, not at each caller: the writers of `info.json` and `folders.json` in `projects.rs` (and the trash), `Library`'s save, the files store's save, `settings::save` and `merge`, the languages' import and removal, the words' writing. A write that fails tells nothing.
- `lib.rs`, in setup, beside `notices::on_told`: `changes::on_changed(move |area| handle.emit("changed", area))`.
- `src/lib/api/changes.ts`: `onChanged(fn(area))`, with the areas as strings. One listener in `App.svelte` (or the state modules each, where that is plainer), debounced 100 ms per area, since an import writes many times: `projects` reloads the list, the folders, the favourites and the trash, and puts the infos of the open projects; `library` reloads; `files` reloads its store; `settings` reloads keeping the keys not yet written; `languages` and `words` reload where their panes are shown. The window that wrote reloads too; that is a fetch it makes after its own writes already, and harmless.
- Tests: `changes.rs` (told once per write, not on failure); the page's debounce.

Verify: steps 2 and 3; by hand off-screen, a project renamed in one window and seen in the other's list and path; a reference added in one and seen in the other's library; the list of projects hidden in one and hidden in the other. Commit.

### 5d — the second start, the harness, the script

- `src-tauri/Cargo.toml`: `tauri-plugin-single-instance = "2"`; in `lib.rs` the plugin first among the plugins, as its documentation says, with a callback that makes a new window beside the one with the focus (or the first) and brings it to the front. The claim stays as it is, with its dialog.
- `e2e/harness.mjs`: `windows()` and `switchTo(handle)` where the first thing to find out allowed it; every method of `App` then works in the window switched to.
- `e2e/windows.mjs`: *New window* from the ⋯ menu, two handles; the same project open in both; a line typed in one, read in the other; a project renamed in one, the name in the other's list; a favourite added in one, in the other's list; the second window closed, the first lives; Ctrl+Shift+N; *Open in a new window* from a row, the project open there. `e2e/instances.mjs`: a second process now opens a second window of the first (the log says so, and the window count), or, where the plugin falls through without a bus, meets the claim as before; the script says which it saw and checks that.
- Guide, *More than one window*: starting Glaukopis again opens a new window of the one that runs.

Verify: steps 2 and 3; `e2e/windows.mjs`, `e2e/instances.mjs`, `e2e/list.mjs`, `e2e/settings.mjs`, `e2e/keys.mjs`, `e2e/languages.mjs`. Commit.

## Stage 6 — the text view draws what is near (0087, decision 4)

The last stage, and the one least sure to come whole: build it only when stages 1 to 5 are committed, and where it is not whole after two days, or breaks a key or the search in a way you cannot mend, commit nothing of it, write what stood in the way in the report, and stop; the owner decides.

Read `src/lib/project/text/MapText.svelte` (the `{#each rows}` at about line 1491 mounting a `TextSection` for every row; `textClosed`; line 367, where an element folded away is shown before the cursor goes there; the brackets at about 1447 and whatever else is drawn along the rows: the others' presence, the comments' marks, the review's); `src/lib/project/text/TextSection.svelte` (the editor of the body, `closed`, how it is mounted and destroyed); `src/lib/project/text/layout.ts` (`textRows`, `Row`, `RowFacts.words`); `folding.svelte.ts`; `src/lib/editor/` (how an editor is made over a block and torn down; y-prosemirror's binding); `src/lib/search/text.svelte.ts` and `prosemirror.ts` (what the search in the text marks, and where the count comes from); `src/lib/comments/` and `src/lib/review/` (what they draw in the text view); `e2e/large.mjs`, `e2e/search-large.mjs`, and the scripts of the text named below.

What was measured: a book of 432,000 words in 60 elements takes the page to near 500 MB while every element's editor is made at once, and 110 MB over the start when it has settled; one of 44,000 words, 60 MB. Every element of the branch in view is mounted with its editor, in sight or not.

- A row far from the view is not mounted: `TextSection` gets `near: boolean`, and where it is false renders the name as today and, for the body, a placeholder with the height the body last had, measured when it was mounted (`ResizeObserver` on the body, the height kept in a map of the view by the element's id), or, before it was ever mounted, a height from its words (`Row.words` over twelve words a line at the body's line height; a function in `layout.ts`, tested). Near is within two screens of the view above and below, judged from the rows' heights (the placeholders' and the mounted bodies'), recomputed on scroll, debounced to a frame; a row scrolled away from stays mounted until it is three screens away, so that scrolling back and forth does not churn.
- Whatever brings an element into view mounts it first and waits a tick: the cursor leaving an element for the next with the keys, the outline, the path, the search's next match, a comment opened, the others' presence followed; line 367 shows how a folded element is shown before the cursor goes there, and the same place serves. The element in view and the one the cursor is in are always near.
- The search in the text marks the mounted editors, as today, and its count comes from the document, not the editors: check `text.svelte.ts`, and where the count is of the marks, count from the document instead. The search through everything reads the files, not the view, and needs nothing.
- The brackets, the others' presence and the comments draw from the rows' heights, placeholders included; what they draw inside a body is drawn when it is mounted.
- Nothing the user sees changes: no word, no key, no setting; the guide needs nothing unless a thing is found to behave differently, and then the guide says so.
- Tests: `layout.test.ts` for the height from the words; `MapText`'s tests if it has any for the rows; the scripts.

Verify: steps 2; `e2e/memory.mjs` with a book of 400,000 words once (make the generator take a size), the peak of the page in the text view below what it was by half or more, for the report; `e2e/large.mjs` and `e2e/search-large.mjs` as they were, their timings in the report; `e2e/text-structure.mjs`, `e2e/folding.mjs`, `e2e/tree-keys.mjs`, `e2e/search.mjs`, `e2e/line-numbers.mjs`, `e2e/brackets.mjs`, `e2e/editors.mjs`, `e2e/verse.mjs`, `e2e/comments.mjs`, `e2e/review.mjs`, `e2e/passing.mjs` and `e2e/the-document.mjs` as they were. Commit.

## The records

When all is built: an *As built* section in each of 0084, 0085, 0086 and 0087 saying what was built and what was chosen on the way, with the counts of the tests and the scripts, and in 0087 the tables of `e2e/memory.mjs` before and after stage 4, with one window and two, and what the shared web process saved or did not; the index `docs/adr/README.md` sets the four to *holds* (0087 *holds in part* where stage 6 was left) and says in 0041's line that the clipboard writes a space at a line's end as it is. The index of the records is read before the records: keep it true.

## Report

What was built, stage by stage, with the commits; the two things found out first and what they allowed; every choice made where the plan was open; the counts of `pnpm test`, `cargo test` and the scripts run, with the ones that failed before you mended them and why; the tables of the memory script, before and after, and the timings of the first page; what was left out, and why. Plain words, no record numbers when writing for the owner.
