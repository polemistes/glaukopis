# Build plan: one home, one tree, one set of keys

The working plan for `docs/adr/0062-one-home-one-tree-one-set-of-keys.md`. Read the record first, in full: it says what and why; this says how, in which order, in which files, with which interfaces, and how each stage is verified. Where they disagree, the record wins; say so in your report. Read also `.claude/briefs/common.md` (the progress note, the languages, the rules) and `docs/plans/the-shape-of-a-text-and-its-org-form.md`, section "How to work", which holds here too: plain words; never a record number when talking to the owner; verify before you commit; edit then format; e2e with `timeout`, processes ended by PID only; commit when a stage is whole, never push; report the counts. Commit at the end of every stage and more often where a stage is long: work that is not committed is lost when the session is.

Read before you begin: `src/App.svelte`, `src/lib/state/router.svelte.ts`, `src/lib/shell/Rail.svelte`, `src/lib/shell/keys.svelte.ts` (the table, `TOGETHER`, `over`, `bind`, `keysFor`), `src/lib/home/ProjectsView.svelte` (what goes, and what it holds that must move), `OwlView.svelte`, `OwlMap.svelte`, `owl.ts`, `owl-keys.ts`, `ProjectList.svelte`, `ProjectsPane.svelte`, `project-actions.svelte.ts`, `list.svelte.ts`, `changes.ts`, `src/lib/project/ProjectView.svelte` (the header at about line 860, `sideBySide`, `beside`, `besideProject`, `viewing`, the key bindings at about line 777, the window's `onkeydown` for Alt+Shift+Up), `MapBar.svelte`, `diagram/keys.ts`, `diagram/MapDiagram.svelte`, `diagram/DiagramNode.svelte` (the corners, the name field), `diagram/layout.ts`, `diagram/lines.ts`, `text/MapText.svelte` (`onkeydown` at about line 546), `text/TextSection.svelte`, `src/lib/editor/plugins.ts` (lines 330–345 and 395–402: Tab and Mod-Enter), `picker.svelte.ts`, `locales/en/keys.ftl`, `locales/en/home.ftl`, and `docs/guide.md` at lines 45–169 (a first project, many projects, the map of the projects), 169–297 (the diagram, the text), 1357–1459 (one tree, entered anywhere) and 2839–2891 (keys).

## Vocabulary

- *The map*: the map of all projects, `OwlMap.svelte` in `OwlView.svelte`, the home after stage 2.
- *The list*: the list at the left, `ProjectsPane.svelte` holding `ProjectList.svelte` in its compact form. The wide form of `ProjectList` goes with the page.
- *The page*: `ProjectsView.svelte`, the home page of cards and list, which goes.
- *A row*: a folder, a project, or an element of a project's tree in the list.
- *A thing*: a folder or a project, on the map or in the list, as `changes.ts` has `Things`.
- *The tree's keys*: the one set of the record, place `tree` in the table of keys.
- *Region*: a folder drawn as a box around what is in it.

## What exists, and what each piece becomes

| Today | Becomes |
| --- | --- |
| `router.svelte.ts`: `{ view: 'projects' }` at `#/`, `{ view: 'owl'; at? }` at `#/owl`, `#/owl/<id>` | `projects` goes; `#/` and `#/owl` are the map at the owl, `#/owl/<id>` at a folder; `#/settings` opens the settings over the map |
| `App.svelte`: `ProjectsView` for `projects` and `settings`; `projects` key goes home | `OwlView` with the pane for the map; Ctrl+1 goes to the map, from a project at its folder (`upFromProject`) |
| `Rail.svelte`: the house at `#/`, current on `projects`, `project`, `owl` | the same link, current on `project` and `owl` |
| `ProjectsView.svelte`: welcome, five buttons, the forms, cards, list, page menu, trash, join dialog, document drop, `__glaukopisOrg` hook | goes; each piece has a new place in `OwlView.svelte` or `ProjectsPane.svelte` (stage 2) |
| `OwlView.svelte`: a header with a back arrow and a one-choice chooser, and a pane-bar | one bar: list button, where one is, plus with a menu, a menu; the empty state with the welcome and the buttons |
| `ProjectList.svelte`: wide and compact, rows with click and a few keys, menus of its own | compact only; one row selected, the tree's keys, names written in place; the one menus from `project-actions`; a `choose` prop for the chooser of a project beside; a *Last used* form |
| `ProjectsPane.svelte` | gains the toggle *Folders · Last used* at the head of the list |
| `project-actions.svelte.ts`: `items(p, { here })`, `itemsWithMoves`, `folderItems(f, first, make)` | `items(p, place)`, `folderItems(f, place)`, `elementItems(project, id, place)`: the one menus, in the record's order |
| `OwlMap.svelte`: cards and labels; menus of its own; `dropOnCard` takes things; the empty state | regions (stage 5); the one menus; a project refuses things; Enter opens in the text; the surface grows (`foldAll`, `write`); the empty state moves to `OwlView` |
| `owl-keys.ts` | the tree's keys over `OwlSurface` |
| `diagram/keys.ts` | the tree's keys over `Diagram`: Alt+Enter after, Alt+Shift+Enter under, Tab folds, Shift+Tab all, Enter opens the text; Space, Tab-as-child, Enter-as-sibling, Ctrl+Enter, Ctrl+Shift+Enter, Alt+Enter-as-write go |
| `text/MapText.svelte` `onkeydown`, `split` | Alt+Enter and Alt+Shift+Enter make a heading at the cursor by the record's rule; Ctrl+Enter, Ctrl+Shift+Enter, Ctrl+Alt+U, Ctrl+Alt+Shift+U go; the hooks `tab` and `shift-tab` in a name fold; F2 goes to the name |
| `text/heading.ts` (new) | the pure splitting of a text at the cursor into a name and a body, tested |
| `editor/plugins.ts`: `keys['Mod-Enter'] = hardBreak` | goes; Shift+Enter is the one line break |
| `shell/keys.svelte.ts`: places `diagram`, `owl`, `text` with their own entries; `up`; `writing-break`; `side-by-side` with no key | a place `tree` with the one set; the entries it replaces go; `side-by-side` is Ctrl+Shift+S |
| `ProjectView.svelte`: the back arrow; `sideBySide` as a toggle | the arrow goes; the button opens a menu; `BesideDialog.svelte` (new) chooses a project |
| `diagram/layout.ts`: `layout(tree, nodes, sizes, held, { keepRoom })` | `margin` per node in the options, for the regions |
| `locales/*/keys.ftl`, `home.ftl`, `project.ftl`, `text.ftl`, `diagram.ftl`, `editor.ftl` | the new words, en and nb; what nothing uses any more goes |
| `docs/guide.md` | the sections named in the record |
| `e2e/*.mjs` | the scripts that press the old keys or use the page; `e2e/tree-keys.mjs` (new) |

Nothing changes in the core, in the project file, in sharing, or in how folders and places are kept on disk. `projects_shown` keeps its two values and now remembers the form of the list.

## Order

Stage 1, then stage 2, each whole before the next. Stages 3 and 4 may be built side by side by two agents in worktrees: their files are disjoint but for `ProjectList.svelte`, where stage 4 adds one prop and one menu item, and `keys.svelte.ts`, where stage 4 changes one entry; merge stage 3 first. Stage 5 after stage 3, since both change `OwlMap.svelte`. Stage 6, the guide and the scripts, runs with each stage for its part and once more at the end.

## Stage 1 — one menu, one word

### 1.1 The menus — `src/lib/home/project-actions.svelte.ts`

```ts
export interface ProjectPlace {
  /** The project that is open, if any: it is not entered, renamed or deleted from here; the others get Enter beside. */
  current?: string | null;
  /** Shows a project beside the open one: Enter beside. Given only where a project is open. */
  beside?: (project: string, at?: string) => void;
  /** Where the place shows the project's map under it: whether it is unfolded, and the toggle. */
  fold?: { folded: boolean; toggle: () => void };
}
/** The menu of a project, the same everywhere, in the record's order. */
items(p: ProjectInfo, place: ProjectPlace = {}): MenuItem[]

export interface FolderPlace {
  enter: () => void;
  /** Whether the folder is the one in view, which is not entered again. */
  here?: boolean;
  fold?: { folded: boolean; toggle: () => void };
  /** Where a new thing is named in place, the maker; else the dialog asks. */
  make?: (kind: 'project' | 'folder') => void;
}
folderItems(f: Folder, place: FolderPlace): MenuItem[]

export interface ElementPlace {
  enter: () => void;
  beside?: () => void;
  fold?: { folded: boolean; toggle: () => void };
}
/** The menu of an element of a project's map shown on the top map, or under a closed project in the list. */
elementItems(place: ElementPlace): MenuItem[]
```

- `items`: *Enter* (`home-enter`, new in `home.ftl`, since `common.ftl` is not added to), shortcut `keysFor('tree-enter')` after stage 3, disabled with the hint `home-open-now` when `p.id === place.current`; *Enter beside* (`home-open-beside` reworded) when `place.beside && place.current && p.id !== place.current`; *Unfold*/*Fold* when `place.fold`; separator; Rename, Duplicate, History…, Save as a file…, Save as Org…; separator; the move items (`moveItems`, as today); separator; Delete. `itemsWithMoves` goes; the callers call `items`.
- `folderItems`: *Enter* (disabled when `here`); *Unfold*/*Fold*; separator; *New project here*, *New folder here*, *Rename*; separator; the move items; separator; *Delete the folder*.
- `elementItems`: *Enter*; *Enter beside* when given; *Unfold*/*Fold* when given.
- Every item that has a key names it with `keysFor`, so that the menus teach the keys; until stage 3 the old ids are used and stage 3 replaces them.

### 1.2 The callers

- `ProjectList.svelte`: `projectItems(p)` → `actions.items(p, { current, beside: viewing.beside ?? undefined, fold: unfoldable(p) ? {...} : undefined })`; `folderItems(f)` → `actions.folderItems(f, { enter: () => openAsMap(f), here: owlAt === f.id, fold: {...} })`; `elementItems(src, id)` → `actions.elementItems({ enter: () => src.enter(id), beside: ..., fold: holds ? {...} : undefined })`.
- `OwlMap.svelte`: `itemsOf(key)` builds the three from the same functions; the map's own items (*Show its map here*, *Open the project here*, *Jump*) go, since they are *Unfold*/*Fold* and *Enter* now.

### 1.3 The words — `locales/en/*.ftl`, `locales/nb/*.ftl`

English, with the Norwegian beside it in the same voice (see `.claude/briefs/words.md`):

| Name | Was | Becomes |
| --- | --- | --- |
| `home-enter` (new) | — | Enter |
| `home-open-beside` | Open beside | Enter beside |
| `home-owl-open` | Open the project | goes; `home-enter` |
| `home-owl-enter` | Open the folder as a map | goes; `home-enter` |
| `home-owl-jump` | Open the project here | goes; `home-enter` |
| `home-owl-map-show`, `home-owl-map-hide` | Show its map here, Hide its map | Unfold, Fold (`home-unfold`, `home-fold`, used for folders and elements too; the `home-owl-fold*` and `home-tree-*fold` names fold into them) |
| `home-map-menu` | A map of the projects… | A project of all the projects… |
| `diagram-open-as-map`, `text-open-as-map` | Open as a map | Enter |
| the corner tooltips in `DiagramNode.svelte`, `TextSection.svelte`, `OwlMap.svelte` | Open as a map / Open the project | Enter |

`project-all-projects` stays *All projects* and names the map alone. Remove from the ftl files, in both languages, every name nothing uses after the stage; `pnpm test` checks that every name used exists, not the other way round, so grep for each name you remove.

Verify: `pnpm check`, `pnpm test`; `pnpm e2e:build`, then `timeout 300 node e2e/owl.mjs`, `timeout 300 node e2e/maps.mjs`: they find menu items by their English words, so revise the words they look for. Commit.

## Stage 2 — one home

### 2.1 The route — `src/lib/state/router.svelte.ts`, `src/App.svelte`, `src/lib/shell/Rail.svelte`

- `Route` loses `{ view: 'projects' }`. `parseRoute`: an empty path, `projects` and `owl` give `{ view: 'owl' }`; `owl/<id>` gives `at`. `formatRoute`: the map at the owl is `#/`, at a folder `#/owl/<id>`.
- `App.svelte`: the `projects` and `settings` branches go; `settings` as a route does `settingsUi.show()` and `router.replace({ view: 'owl' })`. The key `projects`: where `route.view === 'project'`, `upFromProject(route.project)` (from `list.svelte.ts`, which goes to the map at the project's folder with the project revealed); else `go({ view: 'owl' })`.
- `Rail.svelte`: `current` on `project` and `owl`. The tooltip's words (`shell-projects`) stay *Projects*.
- `grep -rn "view: 'projects'" src` and send each to `{ view: 'owl' }`: `project-back` in `ProjectView.svelte`, and whatever else there is.

### 2.2 The map's bar and empty state — `src/lib/home/OwlView.svelte`, `OwlMap.svelte`

- The `<header>` with the back arrow and the `Segmented` goes. The `.pane-bar` is the view's one bar, `height: var(--bar-h)`, so that its line meets the header of the list beside it.
- The bar: the list button; where one is, as today; a plus `IconButton` that opens a menu (`openMenu`): *New project* (`keysFor('tree-new')` after stage 3), *New folder*, separator, *Join a shared project…*, *A project from a document…*, *Open a project file…* and *Open an Org file…*. Making a project or a folder from the menu names it in place on the map as Alt+Enter does (`OwlMap`'s `make`), in the folder in view: pass a `make` callback from `OwlMap` up through a bindable prop or a small store. The dialog of `actions.newProject` is for the empty state only.
- A second `IconButton` with the ellipsis opens: *Deleted projects…* with the count (`home-deleted-projects`), disabled at nought; *A project of all the projects…*; *Place everything by itself*; *Show all of it*. The two latter stay in the ground's menu too.
- Move from `ProjectsView.svelte` into `OwlView.svelte`: `joining` and `<JoinDialog>`; `fromDocument` with `chooseDocument`, `bringIn`, `goThroughWhenOpen`; the trash: `readTrash`, `trash`, `showTrash`, `<TrashDialog>`, the effect on `projects.trashed`; `mapping` and `<ProjectsMapDialog>`; the `testHook('__glaukopisOrg', …)`, which `e2e/org.mjs` uses; the drop target of documents, now on the map's ground (`OwlMap` takes a prop `ondocument?: (path: string) => void` and accepts a `files` payload with a document in it beside what the ground accepts today). `bringIn(path, null)`: look at its signature in `src/lib/documents/bringing.svelte.ts`; where it takes a folder, give the folder in view.
- The empty state: `OwlMap`'s `{#if empty}` block moves to `OwlView` (render `OwlMap` only when `projects.list.length`), with the owl mark, `home-welcome` as `<h2>`, `home-welcome-text`, and the five buttons as the page had them, the first *Begin a project*. Keep these words: the scripts begin at `waitForText('h2', 'Welcome to Glaukopis')` and click *Begin a project*.
- `ProjectsView.svelte` is deleted, with its imports that nothing else uses. `projects.show()` and `projectsShown` stay for 2.4.

### 2.3 The project's header — `src/lib/project/ProjectView.svelte`

The `IconButton` with `ArrowLeft` and its divider go. The `EmptyState` buttons *Back to the projects* go to the map. `goHome` stays (the owl in `MapBar`).

### 2.4 Last used — `src/lib/home/ProjectsPane.svelte`, `ProjectList.svelte`

- `ProjectList` takes `form: 'list' | 'recent'`. In `recent` the rows are `projects.list.slice(0, 12)` (the state sorts by `modified`, as the page's cards were), no folders, no owl row, each row with the name and `home-changed`; the search field holds for both forms. Rows are projects only, with the project menu.
- `ProjectsPane`: a small `Segmented` at the head of the list body, beside the field, two icons with labels *Folders* (`home-all`, reworded) and *Last used* (`home-recent`); the value from `projects.shown` and set by `projects.show(form)`, which calls `projectsShown` as the page did. Where the width is too small for words, icons only (`iconOnly`).
- `compact` goes from `ProjectList`: the list is always the narrow one. Remove the wide form's styles.

### 2.5 The scripts

`grep -ln "Last used\|All projects\|home-recent\|\.cards\|Show all" e2e/*.mjs` and read each use: the page's forms, cards, *Show all*, the page menu and the trash link are gone; the map, the list and its toggle take their place. `e2e/projects.mjs` is the script of the page: rewrite it as the script of the home: the empty state and its buttons, the plus menu, the ellipsis menu, the trash, *Last used* in the list, Ctrl+1 from a project coming to its folder with it selected, `#/settings` opening the settings over the map. Keep the screenshots' names where the pictures mean the same.

Verify: `pnpm check`, `pnpm test`, `pnpm e2e:build`, then `e2e/projects.mjs`, `e2e/owl.mjs`, `e2e/smoke.mjs`, `e2e/org.mjs`, `e2e/keys.mjs`, `e2e/settings.mjs`, each with `timeout 300`, and the screenshots looked at. Commit.

## Stage 3 — the tree's keys

### 3.1 The table — `src/lib/shell/keys.svelte.ts`, `locales/*/keys.ftl`

- `Place` gains `'tree'`. `TOGETHER`: `tree` is in force with `everywhere`, `project`, `review`, `diagram`, `text`, `writing`, `owl`, and is named on their sides. The test of the table that two keys do not clash where they hold together will fail until the entries below are right: let it guide you.
- Entries, in this order, replacing `up`, `diagram-new-after`, `diagram-sibling`, `diagram-new-under`, `diagram-child`, `diagram-enter`, `diagram-shift`, `diagram-depth`, `diagram-open`, `diagram-rename`, `diagram-fold`, `diagram-delete`, `diagram-go`, `diagram-more`, `diagram-menu`, `diagram-all`, all of `owl-*` but `owl-undo`, `owl-redo`, `owl-whole`, `owl-closer`, `owl-farther`, and `text-new-after`, `text-new-under`, `text-enter`, `text-shift`, `text-depth`, `text-deeper`, `text-shallower`, `text-fold`, `text-unfold-all`, and `writing-break`. `redo-y` and `writing-redo-y` stay, and so do `text-found-next` and `text-found-previous`.

```ts
// In the tree, wherever it is shown: the diagram, the text, the map of all projects, the list at the left.
{ id: 'tree-new', keys: 'Alt+Enter', place: 'tree' },
{ id: 'tree-new-under', keys: 'Alt+Shift+Enter', place: 'tree' },
{ id: 'tree-fold', keys: 'Tab', place: 'tree', over: ['writing-list-in'] },
{ id: 'tree-fold-all', keys: 'Shift+Tab', place: 'tree', over: ['writing-list-out'] },
{ id: 'tree-shift', keys: 'Alt+↑↓', place: 'tree' },
{ id: 'tree-depth', keys: 'Alt+←→', place: 'tree' },
{ id: 'tree-enter', keys: 'Alt+Shift+↓', place: 'tree' },
{ id: 'tree-up', keys: 'Alt+Shift+↑', place: 'tree' },
{ id: 'tree-open', keys: 'Enter', place: 'tree' },
{ id: 'tree-rename', keys: 'F2', place: 'tree' },
{ id: 'tree-delete', keys: 'Delete', place: 'tree' },
{ id: 'tree-go', keys: '↑↓←→', place: 'tree' },
{ id: 'tree-more', keys: 'Shift+↑↓←→', place: 'tree' },
{ id: 'tree-menu', keys: 'Shift+F10', place: 'tree' },
{ id: 'tree-all', keys: 'Ctrl+A', place: 'tree' },
```

- `keys-place-tree = In the tree: the diagram, the text, the map of all projects, the list at the left`, and the words of each entry as the record's table has them, short: `keys-tree-new = A new element after this one; in a text, a heading at the cursor; on the map, a new project`, `keys-tree-new-under = A new element under this one, the first; on the map, a new folder`, `keys-tree-open = Open: the text of the element; on the map, the project in its text`, and so on. `keys-diagram-*`, `keys-owl-*` and `keys-text-*` that remain keep their words.
- `grep -rn "keysFor('up')\|keysFor('diagram-\|keysFor('owl-\|keysFor('text-" src` and send each to the new id; the sheet and the palette read the table.

### 3.2 The diagram — `src/lib/project/diagram/keys.ts`, `MapDiagram.svelte`, `DiagramNode.svelte`

`pressed(event, d)` becomes:

| Key | Does |
| --- | --- |
| Alt+Enter | `after(one)`; with nothing selected `d.add('child', tree.root)`; with an association begun, nothing |
| Alt+Shift+Enter | `d.add('child', one)`; with nothing selected `d.add('child', tree.root)` |
| Tab | `project.setCollapsed(one, !collapsed)` when `one` has children; else nothing; `preventDefault` always, so that the focus does not leave the diagram |
| Shift+Tab | `d.foldAll()`: new on `Diagram`: where any element under the one in view is collapsed, `setCollapsed(id, false)` for all of them in one step; else `setCollapsed(id, true)` for each child of the one in view that has children, in one step |
| Alt+↑↓←→ | as today |
| Alt+Shift+↓ | `d.enter(one)` as today; Alt+Shift+↑ is the view's, as today |
| Enter | with an association begun, ends it, as today; else `d.open(one)`, the text box; with nothing selected, `d.select([tree.root])` as today |
| F2, a letter, Delete, Backspace, Escape, the arrows, Shift+arrows, Shift+F10, ContextMenu, Ctrl+A/C/X/V/Z/Y/0/=/- | as today |
| Space, Ctrl+Enter, Ctrl+Shift+Enter, Enter as new, Tab as new, Alt+Enter as open | go |

- `Diagram` gains `foldAll(): void`; `MapDiagram.svelte` provides it, as one `checkpoint`-bounded step so that Ctrl+Z takes it back whole.
- The name field of a new element (`DiagramNode.svelte`, `renaming`) is as today: Enter keeps the name, Escape lets go; Tab in it commits the name as Enter does, since a field is modal.
- `DiagramNode.svelte`: the corners say *Enter* and *Up to “…”* with `keysFor('tree-enter')` and `keysFor('tree-up')`; the menu's *New element after*, *New element under*, *Fold* and *Enter* show the new keys.
- Tests: make `src/lib/project/diagram/keys.test.ts` with a stub `Diagram`, as `owl-keys.test.ts` has a stub surface, if there is none; one test per row, and that Space, Ctrl+Enter, Enter with one selected and no association, and Tab with nothing to fold do what the table says and no more.

### 3.3 The text — `src/lib/project/text/MapText.svelte`, `TextSection.svelte`, `text/heading.ts` (new), `src/lib/editor/plugins.ts`

- `onkeydown` of `MapText`: `Alt+Enter` (no Ctrl) → `addHere(id, part, false)`; `Alt+Shift+Enter` → `addHere(id, part, true)`; the branch that took Ctrl+Enter and Ctrl+Shift+Enter goes, and the branch that swallowed Alt+Enter; `Ctrl+Alt+U` goes; `F2` → `go(id, 'title', 'all')` or whatever `go` offers to put the cursor in the name with the name selected (add a `'all'` if it has `'start'` and `'end'` only). Alt and the arrows, Alt+Shift and the arrows: as today.
- **A heading at the cursor.** `split(id, view, under)` is rewritten to the record's rule through a pure function in `src/lib/project/text/heading.ts`:

```ts
/** What a name may hold: text with the title's marks (em, smallcaps, sup, sub) and nothing else. */
export function nameable(fragment: Fragment): boolean
/**
 * A text parted at the cursor for a new element: the tail of the paragraph
 * the cursor is in as the name, where a name can hold it, and the paragraphs
 * after that paragraph as the body. `keptAsParagraph` says the tail held what
 * a name cannot and stands first in the body instead, with an empty name.
 */
export function headingAt(doc: Node, from: number): {
  name: Fragment | null;
  body: Fragment;
  keptAsParagraph: boolean;
  /** The position from which the old text is cut: the cursor, or the start of its paragraph when the whole paragraph goes. */
  cutFrom: number;
}
```

  `split` calls `headingAt`, makes the new element where it does today (`under || isRoot || hasChildren ? addChild(id, { index: 0 }) : addSibling(id)`), writes the name into the new element's `title` fragment (through `project.setTitle` or the title fragment, as `TextSection` writes a name) and the body into its `body` fragment, deletes from `cutFrom` to the end in the old editor, and goes to the new name: at its end where it has text, else into it. Where `keptAsParagraph`, `notify(t('text-heading-kept'))`: *What follows the cursor holds what a name cannot, and is the first paragraph of the new element.* With the cursor at the very end of the text, nothing is cut and the name is empty, as today.
  `heading.test.ts`: the start, the middle and the end of a paragraph; the last paragraph; a tail with italics (named); a tail with a citation, a note, a bold word (kept as a paragraph); an empty text.
- In a name (`part === 'title'`): at its end, `addAfter` or `addUnder` as today; in the middle, the rest of the name becomes the new element's name and is cut from the old; at the start, the whole name moves and the old element is left unnamed. Do it in `addHere` with the title editor's selection.
- The buttons over the text, *New element* (`newElement('after' | 'under' | 'split')`), keep their three ways but say the new keys; `text-split-hint` and `editor-new-split-hint` are reworded to the rule: *What follows the cursor becomes the name of a new element, and the paragraphs below its text*.
- The hooks `tab` and `shift-tab` of the name's editor (`plugins.ts` lines 395–402, handled where `MapText` or `TextSection` takes the hooks): Tab → `fold(id, false)` toggles the element's fold; Shift+Tab → fold all under the element in view or unfold all, the same rule as the diagram's `foldAll`. The Tab of the body (`plugins.ts` line 336): lists as today; nothing else changes there.
- `keys['Mod-Enter'] = hardBreak` goes (line 345), and `writing-break` from the table; Shift+Enter is the line break.
- The hint at the foot of the text, `text-keys` in `text.ftl`: `{ $alt }+{ $enter } new element · { $alt }+{ $shift }+{ $enter } one under it · { $at } cite`; `MapText.svelte` line 260 passes `alt` from `keyLabel`.
- The text's menu items *Fold*/*Open*, *Enter*, *New element after*, *New element under* show `keysFor('tree-fold')`, `keysFor('tree-enter')`, `keysFor('tree-new')`, `keysFor('tree-new-under')`.

### 3.4 The map — `src/lib/home/owl-keys.ts`, `owl-keys.test.ts`, `OwlMap.svelte`

`pressed(event, owl)`:

| Key | Does |
| --- | --- |
| Alt+Enter | `owl.make('project')`, unless the last selected is an element |
| Alt+Shift+Enter | `owl.make('folder')`, unless on an element |
| Tab | `owl.fold(last)` for a folder, a project (its map) or an element; `preventDefault` always |
| Shift+Tab | `owl.foldAll()`: new on `OwlSurface`: where any folder shown or any project's map is unfolded, folds them all (`listUi.owlFold`, the maps shown); else unfolds every folder at the first level |
| Alt+↑↓←→, Alt+Shift+↓, Alt+Shift+↑ | as today |
| Enter | `owl.write(last)`: new on `OwlSurface`: a project opens at its top in the text (`router.go({ view: 'project', project, mode: 'text' })`), an element opens its project at it in the text, a folder is entered (`owl.open`) |
| F2, a letter, Delete, Backspace, Escape, the arrows, Shift+F10, ContextMenu, Ctrl+A/Z/Y/0/=/- | as today |
| Enter as make, Tab as make, Ctrl+Enter, Ctrl+Shift+Enter, Space | go |

- The double click on a card or an element does what Enter does, in the text; the corner and Alt+Shift+Down open in the diagram, as today. Update the tooltips.
- `owl-keys.test.ts`: one test per row, and that the old keys do nothing.

### 3.5 The list — `src/lib/home/ProjectList.svelte`

Today rows are focusable one by one and have a few keys of their own. Make the list the fourth place of the one set:

- One row is *selected*: `selected = $state<string | null>()` by the row's key (`f:<id>`, `p:<id>`, `e:<project>:<id>`); the list has `role="tree"`, the selected row `tabindex="0"`, the rest `-1` (roving focus); a click selects and does what it does today; `aria-selected`.
- `onkeydown` on the list, through a `pressed(event, surface)` of its own in `src/lib/home/list-keys.ts` (new, with `list-keys.test.ts`), over a `ListSurface` with the rows in order and their depth:

| Key | Does |
| --- | --- |
| ↑, ↓ | the row before, after; `scrollIntoView` |
| ← | the row the selected one stands under (a folder's folder, a project's folder, an element's parent or project); at the top, nothing |
| → | the first row under the selected one when it is unfolded; else nothing |
| Tab | folds or unfolds the row: `listUi.toggle` for a folder, `toggleClosed` for a closed project, `toggleFold` for an element; `preventDefault` |
| Shift+Tab | where any folder or project is unfolded, folds all; else unfolds every folder |
| Alt+Enter | a new project: in the selected folder, beside the selected project, or at the top; a provisional row with `NameField`, made on Enter as the map makes it (`makeProject` of `changes.ts`, undoable) |
| Alt+Shift+Enter | a new folder, likewise (`makeFolder`) |
| Alt+↑, Alt+↓ | an element of the open project: `shift` through `viewing.project`; else nothing |
| Alt+→, Alt+← | a thing: into the folder before it among its siblings, out of its folder (`moveThings`); an element of the open project: `indent`, `outdent` |
| Alt+Shift+↓ | what a click does: enter the project, the element, or the folder on the map |
| Alt+Shift+↑ | on the map: up as the map goes up; in a project: the project's own |
| Enter | what a click does |
| F2, a letter | rename in place with `NameField` (`renameProject`, `renameFolder` of `changes.ts`); not the open project |
| Delete | `deleteThings` after its question; not the open project |
| Shift+F10 | the row's menu |

- The rows' own `onkeydown` handlers go. The `TextField` of the search keeps its keys: Tab there goes to the list.
- The `home-owl-*` words that the map uses for the name field hold here too.

### 3.6 The guide and the scripts of this stage

- `docs/guide.md`: *A first project* steps 2 and 3 (Alt+Shift+Enter for an element under the project, Alt+Enter for one beside it); *The diagram* table; *The text* table, with the rule of a heading at the cursor in a sentence; *The map of the projects* (Making, Renaming, Moving, Folding, The maps of the projects); the list's paragraph under *A first project* and in *One tree, entered anywhere*; the *Keys* table. Everywhere a key is named, the new one; nowhere two, but for Ctrl+Y and F3, which the record keeps.
- `e2e/tree-keys.mjs` (new): one project with a few elements; part 1 the diagram, part 2 the text (with a heading made at the start, the middle and the end of a paragraph, and one kept as a paragraph for a citation), part 3 the map, part 4 the list, each pressing the one set and checking the same outcomes by the tree's shape (`aria-level`, the names, what the place exposes of folding); part 5 that the old keys do nothing: Ctrl+Enter in the diagram, Space, Tab on a card. Screenshots `tree-keys-<n>-<place>`.
- `grep -ln "'Control', 'Enter'\|Key.Enter\|Key.Tab\|Key.Space\|'Alt', 'Enter'" e2e/*.mjs` and read each press: where it pressed Ctrl+Enter, Ctrl+Shift+Enter, Enter, Tab or Space for a new element, a fold or a name, change it to the one set. The list is long (`text-structure.mjs`, `maps.mjs`, `tables.mjs`, `timeline.mjs`, `map-icons.mjs`, `owl.mjs`, `sharing.mjs`, `verse.mjs`, and more); Enter in a name field and in dialogs stays Enter.

Verify: `pnpm check`, `pnpm test` (the table's test, `heading.test.ts`, the key tests), `pnpm e2e:build`, then `tree-keys.mjs`, `keys.mjs`, `owl.mjs`, `maps.mjs`, `text-structure.mjs`, `folding.mjs`, `new-project-view.mjs`, each with `timeout 300`; then every script you changed. Commit after 3.2, 3.3, 3.4, 3.5 each.

## Stage 4 — side by side is a menu

### 4.1 The menu — `src/lib/project/ProjectView.svelte`

- The *Side by side* button (`class="tool"`, `onclick={sideBySide}`) opens a menu with `openMenu(anchor, items, { align: 'start' })`:
  - *This element, as diagram and text* (`project-beside-this`): `sideBySide()` as today, when one pane; when two of the same project, *One at a time* (`project-one-at-a-time`) closes the second; when two projects, *One at a time* closes the other project's pane.
  - *Another element…* (`project-beside-element`): `pickElement({ project, at: ownPane.at, title: …, confirm: t('project-beside-show') })` from `picker.svelte.ts`, with the element in view chosen first; on a choice, `beside(id)`.
  - *Another project…* (`project-beside-project`): opens `BesideDialog`; on a choice, `besideProject(project, at)`.
- `class:on={panes.length > 1}` stays; `aria-haspopup="menu"`.
- The key: `{ id: 'side-by-side', keys: 'Ctrl+Shift+S', place: 'project', bound: true }` opens the menu at the button (keep the anchor in a `bind:this`); the words `keys-side-by-side = Side by side…`.

### 4.2 The chooser — `src/lib/project/BesideDialog.svelte` (new)

A dialog (`Dialog` of `$lib/ui`, movable as all are) titled *Beside: choose a project* (`project-beside-title`), holding `ProjectList` with `choose: (project: string, at?: string) => void` and `current` = the project of the view, which is greyed with the hint `home-open-now`. With `choose` given, `ProjectList` does not open or enter on a click or Enter but calls `choose` with the project, or with the project and the element of a closed project's tree unfolded under it; the owl row, the menus, the drag and the new-thing keys are off; the search field, the folds and the tree's going-about keys are on. The dialog closes on a choice and on Escape. A test is not needed beyond the e2e.

### 4.3 Enter beside — `ProjectList.svelte`

Already in the one menu (stage 1) through `place.beside`, which `ProjectsPane` passes as `viewing.beside` while a project is open: nothing more. Check that an element of a closed project in the list offers it too (`elementItems` with `beside`).

### 4.4 The guide and the script

- `docs/guide.md`, *One tree, entered anywhere*: the paragraphs *Side by side* and *Another project beside* rewritten around the menu and *Enter beside*; the *Keys* table gains Ctrl+Shift+S.
- `e2e/maps.mjs` part 13 (`maps-13-beside`) and `e2e/look.mjs` part 4 open a project beside through the list's menu: do it through the new menu as well, and add a part that chooses an element of the same project through *Another element…*.

Verify: `pnpm check`, `pnpm test`, `maps.mjs`, `look.mjs`, `keys.mjs`. Commit.

## Stage 5 — folders are regions

### 5.1 Room in the layout — `src/lib/project/diagram/layout.ts`

`layout(tree, nodes, sizes, held, options)` gains `options.margin?: ReadonlyMap<string, number>`: for a node named in it, its subtree's extent (the rectangle the balancing stacks) grows by that many pixels on every side, so that siblings keep that distance from everything under it; the node itself is placed as today. The diagram passes nothing; `layout.test.ts` gains a test that two folders of one project each keep twice the margin between their nearest elements.

### 5.2 The regions — `src/lib/home/OwlMap.svelte`, `owl.ts`

- `owl.ts`: `regionOf(lay, key, items): Rect | null`: the bounding box of the folder's label and of every placed descendant (`lay.placed`), plus the padding `REGION_PAD` (12px) and the label's height above; null for the owl, for the centre, and for a folded folder (whose box is its label and count, as today). Pure, tested in `owl.test.ts` with a small layout.
- `OwlMap.svelte` passes `margin` for every folder not at the centre and not folded: `REGION_PAD + 4`.
- Drawing: before the labels and cards, in the same transformed layer, one `<div class="region">` per region, absolutely placed at its rectangle, `data-owl-region={f.id}`, `role="presentation"`; the folder's label keeps its own element at its place (the upper inner edge; the layout puts the label at the inner side of its subtree already), drawn over the region. Styles: `border-radius: 10px`, `border: 1px solid color-mix(in srgb, var(--line) 80%, transparent)`, `background: color-mix(in srgb, var(--ink) 3%, transparent)`, deeper regions a shade more; the selection ring (`data-selected` on the label today) goes around the region: `outline` on `.region[data-selected]`, and the label's ring goes. Dark theme checked.
- Lines: `linesOf(lay, …)` is filtered: no line whose parent is a folder with a region (its contents are inside the box); the line from the owl or the centre to a region ends at the point of the region's edge nearest to the parent, not at the label (`lines.ts` draws between placed rectangles: give it the region's rectangle for the folder where there is one; look at how it takes sizes).
- Fold: `Tab`, the fold sign and the menu as today; a folded folder is its label and count, no box.
- Drop: the region `use:dropTarget={dropInto(f.id)}` and is marked (`data-drop`) as the label is today; the label keeps its own target too. `dropOnCard`: things are no longer accepted; `accepts` returns false for a `THINGS` payload, and the drag's label (the payload's label the map shows, `home-owl-dragged`) says *Not into a project* (`home-owl-not-into-project`) while over a card, through `drag.welcome` or whatever the drag module offers for a refused target; if it offers nothing, add a `refusedLabel` to `dropTarget`.
- Places by hand: unchanged; the region grows to hold a thing placed within it, since the bounding box takes every placed descendant.
- `Show all of it` fits the regions too (`fit` takes the union of regions and placed things).

### 5.3 The guide and the script

- `docs/guide.md`, *The map of the projects*: the first paragraph (folders as boxes with their projects inside) and *Moving* (onto a folder's box; a project takes no project).
- `e2e/owl.mjs`: screenshots of a map with two folders, one nested, one folded, one unfolded with a project's map open inside it; a drop onto the box; a drop of a project on a project refused with the word.

Verify: `pnpm check`, `pnpm test`, `owl.mjs`, `tree-keys.mjs`, `maps.mjs`, and look at the screenshots in light and dark (`owl.mjs` has a dark part if it has; else add one). Commit.

## Stage 6 — the whole

- `docs/guide.md` read through once for *page of projects*, *home page*, *cards*, *Last used*, *Open as a map*, *Open beside*, *Side by side*, *Ctrl+Enter*, *Ctrl+Shift+Enter*, *Space*, *Ctrl+Alt+U*: none of them where the record has changed it.
- The record gains an addendum: what was built, and where the build departs from the plan, in a few lines.
- `e2e/languages.mjs` in Norwegian: no English left in what you added.
- The full run of the scripts you touched, with `timeout 300` each, in sequence, and the counts in the report: interface tests, core tests unchanged, scripts run and passed, screenshots to look at.

## Report

At the end, in plain words for the owner, who does not know the records by number: what each of the six parts does now; the keys as one short table; what departs from the plan and why; what is left (the other languages); the counts.
