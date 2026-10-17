# Build plan: the owl map behaves as a tree

The working plan for `docs/adr/0050-the-owl-map-behaves-as-a-tree.md`. Read the record first, in full: it says what; this says how, in which order, in which files, with which interfaces, and how each step is verified. Where they disagree, the record wins; say so in your report. Read also `.claude/briefs/common.md` (the progress note, the languages, the rules) and `docs/plans/the-shape-of-a-text-and-its-org-form.md`, section "How to work", which holds here too (plain words; never a record number when talking to the owner; verify before you commit; edit then format; e2e with `timeout`, processes ended by PID only; commit when a step is whole, never push; report the counts). Commit at the end of every step, and more often where a step is long: work that is not committed is lost when the session is.

Read before you begin: `src/lib/home/OwlMap.svelte`, `OwlView.svelte`, `owl.ts`, `owl.test.ts`, `ProjectList.svelte` (the rows, their keys, their drag), `project-actions.svelte.ts`, `src/lib/state/projects.svelte.ts`, `src/lib/project/diagram/keys.ts` (the shape to mirror), `layout.ts` (`neighbour`), `src/lib/ui/drag.svelte.ts`, `toast.svelte.ts`, `src/lib/shell/keys.svelte.ts`, and `docs/guide.md` lines 60–90 and around 1300.

## Vocabulary

- *Owl map*: `OwlMap.svelte`, the map of folders and projects, drawn by itself with the diagram's `layout`, `linesOf` and camera.
- *Key*: what names a thing on the map: `owl`, `folder:<id>`, `project:<id>` (`owl.ts`: `OWL`, `folderKey`, `projectKey`). The selection, the folds and the route use keys; the state of projects uses ids.
- *Item*: `OwlItem`, what a key stands for (`owl.ts`).
- *In view*: `at`, the key at the centre: the owl, or a folder entered.
- *Provisional*: a card or a label shown while the name of a thing not yet made is written; it exists in the map's state only.
- *Home change*: a change of folders or projects that can be undone: a name, a move, a making, a deletion.
- *Surface*: the `OwlSurface` the keys act on, as `Diagram` is to the diagram's keys.

## What exists, and what each piece becomes

| Today | Becomes |
| --- | --- |
| `owl.ts`: `owlTree(folders, projects, folds)` with `OWL` at the top | `owlTree(folders, projects, folds, at = OWL)`: the tree under `at`; and the pure questions the keys ask: `parentKey`, `siblingsOf`, `folderBefore`, `whereNew` |
| `owl.test.ts` | the same, grown by the questions and by `at` |
| `OwlMap.svelte`: pans, zooms, folds, opens on a click, a project's menu | selection, keys through `owl-keys.ts`, corners, name field, provisional items, drag of items and drop targets, menus of folders and of the background; `open` becomes `onopen(key)` and `onup()` |
| `owl-keys.ts` (new), `owl-keys.test.ts` (new) | `pressed(event, surface)` as `diagram/keys.ts` has it, over `OwlSurface`; tested with a stub surface |
| `NameField.svelte` (new, `src/lib/home`) | a name written in place: an input whose width follows the text; Enter keeps, Escape cancels, blur keeps what is not empty |
| `undo.svelte.ts` (new, `src/lib/home`) | the home changes of the session, undone and redone; a toast with *Undo* |
| `state/projects.svelte.ts`: `create(name)` | `create(name, folder: string \| null)`; the rest stays |
| `api/projects.ts`, `commands/projects.rs`, `crates/core/src/projects.rs`: `create(name)`, `SHOWN` of three | `create(name, folder)`, `project_create(name, id, folder)`; `SHOWN` of two |
| `project-actions.svelte.ts`: `items(p)`; `ProjectList.svelte`: `projectItems`, the folder menu | the folder items of a project and the menu of a folder lifted into `project-actions.svelte.ts` as `folderItems(p)` and `folderMenu(f)`, used by the list and by the map |
| `state/router.svelte.ts`: `{ view: 'owl' }` | `{ view: 'owl'; at?: string }`, `#/owl` and `#/owl/<folderId>` |
| `list.svelte.ts`: `owlFolds` | and `owlReveal`, a key shown once when the map comes up |
| `OwlView.svelte`: the bar with *All projects* | the bar says where one is, with an up button; Alt+Shift+Up goes up; `at` from the route |
| `ProjectsPane.svelte`, `ProjectList.svelte`: `owlHere` | `owlAt: string \| null \| undefined`; the folder in view is current; a folder's row has *Open as map* |
| `ProjectView.svelte` `up()` at the top, `MapBar.svelte` `.up.home` | go to the project's folder with the project revealed |
| `shell/keys.svelte.ts`, `locales/*/keys.ftl` | a place `owl`, *On the map of projects*, with its entries |
| `locales/en/home.ftl`, `locales/nb/home.ftl` | the new words |
| `docs/guide.md` *Many projects* | two forms, and the map with what is done on it |
| `e2e/owl.mjs` (new) | the map driven by keys and pointer |

Nothing changes in the trees inside projects, in sharing, in the project file, or in how folders are kept on disk.

## Step 1 — the ground

### 1.1 The core and the command — `crates/core/src/projects.rs`, `src-tauri/src/commands/projects.rs`, `src/lib/api/projects.ts`, `contract.rs`

- `create(&self, name: &str, folder: Option<&str>) -> Result<ProjectInfo>` and `create_with_id(&self, id, name, folder)`: the folder must exist (as `move_to_folder` checks), and is written into `project.json` at creation. `project_create(state, name, id: Option<String>, folder: Option<String>)`. In the interface `projectCreate(name, id?, folder?)` and `projects.create(name, folder)`; the three callers that make a project in no folder pass `null`, and the owl map passes the folder.
- `SHOWN` loses `"map"`; `shown()` reads a remembered `map` as `recent` (the interface already does; the core should too, so that an old `folders.json` is not refused).
- Tests: a project made in a folder has it; in a folder that is not there is refused.

### 1.2 The route — `src/lib/state/router.svelte.ts`

`{ view: 'owl'; at?: string }`. `parseRoute`: `owl/<id>` gives `at`; `formatRoute` writes it. `App.svelte` passes `route.at` to `OwlView` and to `ProjectsPane` as `owlAt` (null when there is none).

### 1.3 The pure questions — `src/lib/home/owl.ts`

- `owlTree(folders, projects, folds, at: string = OWL)`: when `at` is a folder's key, the flat nodes are those under that folder only, and `buildTree(flat, at)`; a folder that is not there falls back to the owl. The centre is never folded (the layout ignores the root's fold already).
- `parentKey(key, items, folders): string | null` (the owl's is null).
- `siblingsOf(key, tree): string[]` in the tree's order (folders by name, then projects by name, as today).
- `folderBefore(key, tree, items): string | null`: the nearest sibling before `key` that is a folder.
- `whereNew(selection: string[], items): { parent: string | null }`: the folder id a new thing goes into: the selected folder; the folder of the selected project; the folder in view when the owl or nothing is selected at a folder entered; null at the top. Of several selected, the last.
- Tests for each, in `owl.test.ts`.

### 1.4 The home's undo — `src/lib/home/undo.svelte.ts` (new)

```ts
export interface HomeChange {
  /** What was done, for the toast: "“Iliad” was moved to Greek". */
  message: string;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
}
class HomeUndo {
  done = $state.raw<HomeChange[]>([]);
  undone = $state.raw<HomeChange[]>([]);
  /** Remembers a change that was just made, and says so with a toast that offers Undo. */
  remember(change: HomeChange): void;
  async undo(): Promise<void>;  // runs the last, moves it to undone, toasts "Undone: …" with Redo
  async redo(): Promise<void>;
}
export const homeUndo = new HomeUndo();
```

The toasts go through `notifyOk`/`notify` of `toast.svelte.ts` with `action: { label: Undo, run }`; use the word for Undo that `common.ftl` has if it has one, else add `home-undo` and `home-redo`. A change whose undo fails (the project is gone) is reported with `notifyError` and dropped. Tests with stub changes: order, redo after undo, a new change clears `undone`.

The changes themselves are built where they are made (steps 3 and 4), always as a pair: rename ↔ rename back (through `projects.rename`, which tells the server for a shared project); move ↔ move back; new project ↔ to the trash (`projects.remove`) ↔ restore (the api function `TrashDialog.svelte` uses); new folder ↔ `deleteFolder` ↔ `createFolder` again and move the former contents back by their ids; delete folder ↔ the same the other way round, the new folder's id taken into the change so that redo deletes the right one; delete project ↔ restore.

### 1.5 The name field — `src/lib/home/NameField.svelte` (new)

Props: `value: string`, `placeholder?: string`, `selectAll?: boolean` (F2: the whole name selected; a letter typed: the field holds that letter, cursor after it), `oncommit: (name: string) => void`, `oncancel: () => void`. An `<input>` with a hidden mirror span giving its width, `autofocus`, `maxlength` 200 as `check_name` caps it. Enter commits the trimmed value, empty cancels; Escape cancels; blur commits what is not empty and differs, else cancels. `keydown` stops propagation so that the map's keys do not act while a name is written, and the arrow keys move within the text. No test of its own; the e2e covers it.

Verify: `cargo test --workspace`, `cargo clippy --workspace --all-targets`, `cargo test -p glaukopis contract`, `pnpm check`, `pnpm test`. Commit.

## Step 2 — selection, going about, opening, menus

### 2.1 The surface and the keys — `src/lib/home/owl-keys.ts` (new)

```ts
export interface OwlSurface {
  tree: Tree; items: ReadonlyMap<string, OwlItem>; lay: Layout; at: string;
  selection: string[]; last: string | null;
  select(keys: string[], last?: string): void;
  /** A project opens at its top; a folder is entered. */
  open(key: string): void;
  up(): void;
  rename(key: string, startingWith?: string): void;
  make(kind: 'project' | 'folder'): void;
  deeper(keys: string[]): void; shallower(keys: string[]): void;
  fold(key: string): void;
  remove(keys: string[]): void;
  menu(key: string | null, at: RectLike): void;
  fit(): void; closer(): void; farther(): void;
  undo(): void; redo(): void;
}
/** True when the key was taken. */
export function pressed(event: KeyboardEvent, owl: OwlSurface): boolean
```

The table, mirroring `diagram/keys.ts`:

| Key | Does |
| --- | --- |
| ↑↓←→ | `neighbour(lay, last ?? at, direction)` from `diagram/layout.ts`; selects it; with nothing selected, selects the centre |
| Shift+arrows | the same, added to the selection |
| Enter, Ctrl+Enter | `make('project')` |
| Tab, Ctrl+Shift+Enter | `make('folder')` |
| Alt+Shift+↓ | `open(last)` |
| Alt+Shift+↑ | `up()` |
| Alt+←, Alt+→ | by the side of `last` in the layout (`placed.side`, as `diagram/keys.ts` maps it): outwards is `deeper(selection)`, inwards `shallower(selection)`; on the centre nothing |
| F2 | `rename(last)` |
| a printable letter, no Ctrl/Meta/Alt | `rename(last, letter)` |
| Space | `fold(last)` when it is a folder |
| Delete, Backspace | `remove(selection)` |
| Escape | `select([])` |
| Ctrl+A | all keys of `lay.order` but the centre |
| ContextMenu, Shift+F10 | `menu(last, rect of last)` |
| Ctrl+0, Ctrl+=/+, Ctrl+- | `fit`, `closer`, `farther` |
| Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y | `undo`, `redo` |

The owl itself is selectable and is the centre at the top: Enter on it makes a project at the top, Tab a folder, the rest that has no meaning on it does nothing. `owl-keys.test.ts`: a stub surface records calls; one test per row, and that a key not in the table returns false.

### 2.2 The map — `src/lib/home/OwlMap.svelte`

- State: `selection = $state<string[]>([])`, `last`. `data-selected` on the label or card; the ring in CSS (`outline` in the accent colour, offset so that the card's shape is kept; on a label, around the text). `aria-selected`, `role="tree"` on the viewport with `aria-activedescendant`, `role="treeitem"` and `aria-level` on labels and cards (the e2e reads them), `data-owl-parent="<key>"` on each.
- The viewport takes the focus (`tabindex="0"`) and the keys: `onkeydown` only when `event.target === viewport`, then `pressed(event, surface)`. A click on the background focuses the viewport and clears the selection; a click on a label or a card selects as the record says (Ctrl toggles, Shift adds) and focuses the viewport. A click on a folder's label no longer folds by itself: the fold is the small button that is there (`home-owl-fold`), Space, or a double click? No: a double click enters. Keep the fold button and Space; a click selects.
- Double click on a card: `open`; on a label: `open` (enters; step 5 makes it work, until then a folder's `open` does nothing but is wired). The corners: an *enter* corner on a card and on a label on hover, as `DiagramNode.svelte` draws them, in the owl map's style (the icon only, no box); the *leave* corner on the centre when it is a folder (step 5).
- Menus: `openContextMenu` on a label with `folderMenu(f)`; on a card with `actions.items(p)` plus `folderItems(p)`; on the background with *New project here*, *New folder here*, *Show all*. The ellipsis button on a card stays. Shift+F10 opens the same at the selected one.
- Panning: a press on the background pans as today; a press on a label or a card selects and, moved, drags (step 4); until step 4 it selects only.
- `onopen(key)` prop: `OwlView` opens a project, or goes to `#/owl/<id>` for a folder (step 5).

### 2.3 Lifting the menus — `src/lib/home/project-actions.svelte.ts`, `ProjectList.svelte`

`folderItems(p: ProjectInfo): MenuItem[]` (*Move to folder* with its submenu, *Out of folders*) and `folderMenu(f: Folder): MenuItem[]` (*Rename…*, *New project here*, *New folder inside…*, *Move to folder*, *Out of folders*, *Delete*) move from `ProjectList.svelte` into `ProjectActions`, with the dialogs they use; the list calls them as before. *New project here* is new: `newProject(folder)` opens the naming dialog with the folder given, and `create(name, folder)`.

### 2.4 The key sheet and the words

`Place` gains `'owl'`; `keys-place-owl = On the map of projects`; entries `owl-go`, `owl-more`, `owl-new-project` (Enter, Ctrl+Enter), `owl-new-folder` (Tab, Ctrl+Shift+Enter), `owl-open` (Alt+Shift+↓), `owl-up`, `owl-depth` (Alt+←→), `owl-rename`, `owl-fold`, `owl-delete`, `owl-menu`, `owl-all`, `owl-undo`, `owl-redo`, `owl-whole`, `owl-closer`, `owl-farther`, with their words in `keys.ftl` in both languages, in the voice of the diagram's. `TOGETHER` gets the owl's place if the clash test needs it. In `home.ftl`: `home-owl-new-project-here`, `home-owl-new-folder-here`, `home-owl-enter`, `home-owl-enter-folder`, `home-owl-leave`, and what step 3 and 4 need, added as they come.

### 2.5 e2e — `e2e/owl.mjs` (new), first part

Launch; make a folder *Greek* and two projects through the list, as `projects.mjs` does, and move one into the folder; go to `#/owl` (`app.go('owl')`). Then: click the owl mark, ArrowRight selects a label or a card (`[data-selected]`), Shift+ArrowDown adds; Escape clears; Ctrl+A selects all but the owl; Shift+F10 on a folder opens a menu with *Rename…*; Escape; right-click the background gives *New project here*; a double click on a card opens the project (`.text-view`); back with `app.go('owl')`. Screenshot `owl-1-selected`. Check `aria-level` of a card in *Greek* is 3 (owl 1, folder 2).

Verify: `pnpm check`, `pnpm test`, `pnpm e2e:build`, `timeout 300 node e2e/owl.mjs`, and `projects.mjs` still passes. Commit.

## Step 3 — names: renaming and making in place

### 3.1 Renaming — `OwlMap.svelte`

`renaming = $state<{ key: string; startingWith?: string } | null>(null)`. The label or the card shows `NameField` in the place of its name; `oncommit(name)`: a folder → `projects.renameFolder`, a project → `projects.rename` (the server is told for a shared one, as `project-actions` does: use the same function); then `homeUndo.remember({ message: home-renamed, undo: rename back, redo: rename again })`. A name equal to the old is no change. The project that is open cannot be renamed from the home today (`here`); on the owl map no project is open, so no such guard; but a project opened beside is not a concern here either.

### 3.2 Making — `OwlMap.svelte`, `owl.ts`

`provisional = $state<{ kind: 'project' | 'folder'; parent: string | null; key: 'new' } | null>(null)`. `owlTree` takes it as one more flat node under its parent (a folder sorts first among folders, a project among projects, by an empty name, so at the head), so that the layout gives it a place and the lines reach it; `items` has it as `{ kind: 'provisional', of: 'project' | 'folder' }`; drawn as an empty card or label with `NameField` open and the placeholder `home-name-placeholder` (“Name”, as the diagram's `diagram-idea`). `oncommit(name)`: `projects.createFolder(name, parent)` or `projects.create(name, parent)`; the new key is selected; `homeUndo.remember` (a new project's undo moves it to the trash, its redo restores it; a new folder's undo deletes it, its redo makes it again, the change keeping the id it gets). `oncancel`: `provisional = null`. A folder that is folded unfolds when something is made in it (`listUi.owlFold(id, false)`). A second Enter while a provisional stands is ignored.

Words: `home-name-placeholder`, `home-renamed`, `home-folder-made`, `home-project-made`, `home-undone`, `home-redone` (with the thing's name), in both languages.

### 3.3 e2e — `e2e/owl.mjs`, second part

On the owl map: select the owl, Tab, type *Latin*, Enter → a label *Latin* (`[data-owl-folder]` text); select it, Enter, type *Aeneid*, Enter → a card *Aeneid* with `data-owl-parent` of *Latin*; F2 on it, type *Aeneis*, Enter → renamed; a letter typed on a selected card begins a new name and Escape brings the old back; Enter then Escape makes nothing; the toast *Undo* after the renaming gives the old name back; Ctrl+Z after making *Aeneid* moves it to the trash (the card goes), Ctrl+Shift+Z brings it back. Screenshot `owl-2-made`. Then `app.go('')` and check the list shows *Latin* with one project.

Verify: the four checks and `owl.mjs`, `projects.mjs`. Commit.

## Step 4 — moving and deleting, with undo

### 4.1 By keys — `OwlMap.svelte`

`deeper(keys)`: for each, `folderBefore(key)`; where there is one, `projects.moveToFolder(id, folder)` or `projects.moveFolder(id, folder)` (`moveFolder` refuses a loop already); one change for the lot in `homeUndo`, its undo moving each back. `shallower(keys)`: to the parent's parent, or out of folders at the top. The selection stays on the things moved; the folder they went into unfolds.

### 4.2 By dragging — `OwlMap.svelte`

- A press on a card or a label that moves more than six pixels starts `startDrag` with the list's payload: `{ kind: 'project' | 'folder', data: id, label: name }`; of a selection, one payload per thing is not how `drag.svelte.ts` works: give `{ kind: 'projects', data: { projects: string[]; folders: string[] }, label: "3 things" }` when more than one is selected, and teach the list's `accepts`/`drop` that kind too (`ProjectList.svelte` 259–287), so that a selection dropped on a row of the pane goes there as well.
- Drop targets (`dropTarget` from `drag.svelte.ts`): every label (into the folder), the owl mark (out of folders), every card (into the card's folder). `accepts`: the three kinds, refusing a folder dropped into itself or under itself (`descendants` of `folders.ts`). `onover` marks the target (`data-drop-over`, drawn as the diagram's `.target`). `ondrop`: the moves as 4.1, one change in `homeUndo`, a toast *“Iliad” was moved to Greek* with Undo (the word `home-moved-to` exists; the toast now carries the action).
- The viewport is a target too for what comes from the pane and is dropped on the background: nothing happens (there are no positions), the label says nothing; `quiet`.
- The pan starts only from the background now.

### 4.3 Deleting

`remove(keys)`: folders through the question `removeFolder` asks in `ProjectList.svelte` (lift it into `project-actions` beside `folderMenu` if it is not already there), projects through `actions.remove` (the question of `project-actions`). After each, `homeUndo.remember`: a project's undo restores it from the trash; a folder's undo makes it again with its name under its parent and moves its former folders and projects back (their ids remembered before the deletion); redo deletes the new one. Several selected: one question for the lot where the questions are alike, else one each.

### 4.4 e2e — `e2e/owl.mjs`, third part

Select *Aeneis* and press Alt+arrow outwards (read the side from `data-side` on the card, as the layout sets `placed.side`; the harness has `press` and `keys`) → its parent is *Latin*'s sibling folder before it if there is one; make the test deterministic: make a folder *Roman* before *Latin* by name, so that *Latin*'s deeper target is *Roman*; check `data-owl-parent`; Alt+arrow inwards brings it out. Drag the card *Iliad* onto the label *Greek* (`app.drag`) → parent *Greek*; Ctrl+Z → back; drag *Greek* onto the owl mark → stays at the top (a no-op, no error); Delete on a card → the dialog, confirm → the card goes, the toast's *Undo* brings it back; Delete on *Roman* → confirm → its contents move up, Ctrl+Z makes it again with them. Screenshot `owl-3-moved`.

Verify: the four checks, `owl.mjs`, `projects.mjs`, `housekeeping.mjs`. Commit.

## Step 5 — entering a folder

### 5.1 The map at a folder — `OwlMap.svelte`, `OwlView.svelte`, `App.svelte`

- `OwlMap` takes `at: string` (a key; the owl's by default) and builds `owlTree(…, at)`. The centre of a folder entered is its label, larger (the `serif` size of the bar's name), never a card and never a box; a *leave* corner on hover, its tooltip naming the parent (*Up to Greek*, or *Up to all projects*), as `DiagramNode.svelte` does for the root. `open(folderKey)` → `onopen`, which `OwlView` turns into `router.go({ view: 'owl', at: id })`; `onup` → the parent folder, or `{ view: 'owl' }`.
- `OwlView`: `at` from the route; the bar's `.here` shows, when a folder is in view, the parent's name small before the folder's name (the owl mark small when the parent is the owl), as `MapBar.svelte` shows the parent of the element in view, and an up button as `MapBar`'s `.up`; Alt+Shift+Up in `OwlView`'s keydown goes up, as `ProjectView.svelte` has it. The *All projects* title stays when the owl is in view.
- `listUi.owlReveal: string | null`: set before `router.go`; `OwlMap` reads it once the layout holds the key: selects it, and if it lies outside the view, centres the camera on it (`fitting` has what is needed, or `zoomedAt`); then clears it.
- `ProjectView.svelte` `up()` at the top and `goHome`, `MapBar.svelte`'s `.up.home`: `listUi.owlReveal = projectKey(id); router.go({ view: 'owl', at: folderOf(project) ?? undefined })`. The *All projects* button of `ProjectView`'s header keeps going to the page of projects.

### 5.2 The pane — `ProjectsPane.svelte`, `ProjectList.svelte`

`owlHere` becomes `owlAt: string | null | undefined`: `undefined` away from the owl map; `null` the owl in view (the owl row is current, as today); an id the folder in view (that folder's row is current and its folders open to it, through `foldersOpenTo`). A folder's row gains *Open as map* in its menu (`folderMenu` gains it with a callback, as `Open beside` is added only where it applies), going to `#/owl/<id>`; a double click on a folder's row does the same.

### 5.3 e2e — `e2e/owl.mjs`, fourth part

Double-click the label *Greek* → the route is `#/owl/<id>` (`location.hash`), the centre shows *Greek* and the cards in it, the bar says *Greek* with the owl small before it; Alt+Shift+Up → the owl map at the top with *Greek* selected. Open *Iliad* (double click), then at its top Alt+Shift+Up → the owl map at *Greek* with *Iliad* selected and in view (`[data-selected]` text). In the pane (`[data-projects-pane]`), the row of *Greek* is `[data-current]`. Screenshot `owl-4-entered`.

Verify: the four checks, `owl.mjs`, `maps.mjs` (its enter and leave at the root, lines around 623–660, now come to the owl map at the folder: adjust its expectation), `breaks-and-projects.mjs`, `projects.mjs`. Commit.

## Step 6 — the guide, the other scripts, the last checks

- `docs/guide.md`, *Many projects* (lines 60–90): the two forms of the page, cards and list; then the map above every project: how it is reached, what it shows, selecting, the keys, making and naming in place, renaming, moving by keys and by dragging, folding, deleting, undoing, entering a folder and coming up, that the folds last for the session and the order is by name. Around line 1300 (*the owl at the left of the bar goes up from it*): goes up to the project's folder. Mention the key sheet's place.
- `timeout 300 node e2e/languages.mjs` finds no English left on the owl map in Norwegian; `node scripts/check-locales.mjs` exits 0.
- `cargo clippy --workspace --all-targets` clean; the four checks; every e2e script that touches the home or goes up from a project: `owl.mjs`, `projects.mjs`, `housekeeping.mjs`, `breaks-and-projects.mjs`, `maps.mjs`, `keys.mjs`.

Commit.

## Report

At the end: what was built step by step, what was left (the folds not remembered, no order by hand, no renaming in place in the list, no tooltip), the counts of `pnpm check`, `pnpm test`, `cargo test --workspace`, and of each e2e script run; the five choices of the record and whether anything in building them gave reason to do otherwise; and a short list of the things in the record that the build found reason to do otherwise, if any.
