# Build plan: the list, the path, and the window as it was left

The working plan for `docs/adr/0063-the-list-the-path-and-the-window-as-it-was-left.md`. Read the record first, in full: it says what and why; this says how, in which order, in which files, with which interfaces, and how each stage is verified. Where they disagree, the record wins; say so in your report. Read also `.claude/briefs/common.md` (the progress note, the languages, the rules) and `docs/plans/the-shape-of-a-text-and-its-org-form.md`, section "How to work", which holds here too: plain words; never a record number when talking to the owner; verify before you commit; edit then format; e2e with `timeout`, processes ended by PID only; commit when a stage is whole, never push; report the counts. Commit at the end of every stage and more often where a stage is long: work that is not committed is lost when the session is.

Read before you begin: `docs/adr/0062-one-home-one-tree-one-set-of-keys.md` and its plan (what was built yesterday, and is now partly undone), `docs/adr/0037-a-project-is-one-tree.md` (the pane, the bar, side by side), `src/App.svelte`, `src/lib/state/router.svelte.ts`, `src/lib/shell/Rail.svelte`, `src/lib/shell/keys.svelte.ts` (the table, `TOGETHER`, `over`, `bind`, `keysFor`), `src/lib/shell/KeySheet.svelte`, `src/lib/home/OwlView.svelte` (what goes, and what it holds that must move: the plus menu, the ⋯ menu, the welcome, `fromDocument`, `written`, the join dialog), `OwlMap.svelte` (goes), `owl.ts`, `owl-keys.ts` (go), `ProjectsPane.svelte`, `ProjectList.svelte` (the forms at about line 97, the head at about 490, the owl row at about 513, the marking of the open project at about 125), `list.svelte.ts`, `list-keys.ts`, `closed.svelte.ts`, `project-actions.svelte.ts`, `ProjectActionsHost.svelte`, `changes.ts`, `undo.svelte.ts`, `folders.ts`, `src/lib/project/ProjectView.svelte` (`Viewing` at the top; `panes`, `focused`, `cameras` at about 123; the guest at about 168; `besideProject` and `goHome` at about 250; the store at about 340; `onMount` at about 362; `leave` and `onDestroy` at about 468–536; the router effect at about 560; `show`, `holding`, `goTo`, `up` and the window's `onkeydown` at about 593–655; `beside`, `sideBySide`, `oneAtATime`, `sideBySideMenu` at about 656–711; `closePane` at about 780; the key bindings at about 812; the header markup at about 897; the bars of the panes at about 1037; the views at about 1131; the head of the panel at the side, `side-map`, at about 1275), `layout.ts`, `view-store.svelte.ts`, `MapBar.svelte` (goes into the path), `BesideDialog.svelte`, `guest.svelte.ts`, `text/MapText.svelte` (`goTo` at about 233, the `ontop` prop, `currentElement` at about 774), `src/lib/state/settings.svelte.ts`, `src/lib/state/closing.ts`, `src/lib/api/system.ts` (`Settings` at about 74, `defaultSettings` at about 195), `src/lib/ui/menu.svelte.ts` (`MenuItem`, with `submenu`), `src/lib/ui/tree-menu.ts`, `locales/en/home.ftl`, `project.ftl`, `keys.ftl`, `shell.ftl`, `e2e/harness.mjs` (the `App` options `dataDir`, `width`, `height`), and `docs/guide.md` at lines 45–197 (a first project, many projects, the map of the projects), 1408–1528 (one tree, entered anywhere) and 2908–2961 (keys).

## Vocabulary

- *The list*: the list at the left, `ProjectsPane.svelte` holding `ProjectList.svelte`.
- *The start screen*: `StartView.svelte` (new), at `#/`, the route `home`.
- *A side*: one of the panes of `ProjectView.svelte`, a `Pane` of `layout.ts`. *The project of the view*: `projectId` of `ProjectView`, the route's project; its sides are *own sides*. *The guest side*: `panes[1]` with `project` set, another project shown beside (`guest.svelte.ts`).
- *The active side*: the pane with the focus, `focused`.
- *The top row*: the one row over the sides, with a *cell* per side holding the path, and *Split view* at its right end.
- *The bar of the project*: today's `<header>` of `ProjectView.svelte`, which stands under the top row from stage 4. *The bar of a side*: today's `.pane-bar` of a pane.
- *The path*: `Path.svelte` (new), the crumbs from the top folder to the element in view, with the chevron and ⋯ *This element*.
- *The place*: the route, as the address writes it (`formatRoute`).

## What exists, and what each piece becomes

| Today | Becomes |
| --- | --- |
| `router.svelte.ts`: `{ view: 'owl'; at? }` at `#/`, `#/owl`, `#/owl/<id>` | `{ view: 'home' }` at `#/`; `owl`, `owl/<id>` and `projects` read as `home` (old links); the router remembers the last project route of the run |
| `App.svelte`: `OwlView` with the pane for `owl` and `settings`; the key `projects` goes up from a project to the map | `StartView` with the pane for `home`; `projects` goes to the project shown last in the run, else home; at start, the place kept is gone to; the window is shown once ready, at its kept size |
| `Rail.svelte`: the house current on `project` and `owl` | current on `project` and `home` |
| `OwlView.svelte`, `OwlMap.svelte`, `owl.ts`, `owl-keys.ts`, their tests | go; the plus menu, the ⋯ menu, the welcome, the document drop and the join dialog move to the list's head and the start screen |
| `list.svelte.ts`: `owlFolds`, `owlReveal`, `owlMaps`, `owlElementFolds`, `upFromProject` | go; `toList(id)` shows the list and puts the focus on a project's row |
| `state/projects.svelte.ts`: `places`, `setPlaces`, `shown`, `show` | go, with their calls; the core's commands stay |
| `ProjectList.svelte`: the owl row, `owlAt`, the forms *Folders · Last used*, the one open project marked | no owl row; one form; the project of each side marked, with its tree to that side's element; `shown` and `close` in the menus |
| `ProjectsPane.svelte`: head with a plus (new project), open a file, × | head with the plus menu, the ⋯ menu, × |
| `project-actions.svelte.ts`: `items(p, { current, beside, fold })`, `folderItems(f, { enter, here, fold, make })` | `items(p, { shown, close, beside, fold })` with *Open*, *Open beside*, *Close*; `folderItems(f, { fold, make })` without *Enter* |
| `keys.svelte.ts`: place `owl`; `side-by-side`; `projects-pane` | `owl` goes; `side-by-side` is Split view; `close-side` (Ctrl+W), `switch-sides` (no key); `list-undo`, `list-redo` over the project's |
| `ProjectView.svelte`: the header over both panes; a bar in each pane with `MapBar`; the focused pane's bar tinted | the top row with a cell per side, the path in each, the active cell in the accent, Split view at its right end; the header under it, less Side by side; the bar of each side as today, less `MapBar`, with × always; mirrored sides |
| `MapBar.svelte` | goes into `Path.svelte` (the crumbs, the chevron's menu of all projects, ⋯ *This element*); the pull-down of siblings and the owl go |
| `layout.ts`, `view-store.svelte.ts`: panes, cameras, side, outline, preview, sizes, folded | gain `tops`, `focused`, `mirrored` |
| `api/system.ts` `Settings`: `projectsPane: false` | `projectsPane: true`; `lastPlace`, `recentProjects`, `window` |
| `locales/*/home.ftl`, `project.ftl`, `keys.ftl` | the map's words go; the words of the start screen, the list's head, the path, Split view, Close |
| `docs/guide.md` | the sections named in the record |
| `e2e/owl.mjs` | `e2e/list.mjs`; `e2e/as-left.mjs` and `e2e/path.mjs` new; the scripts named in the record revised |

Nothing changes in the core, in the project file, in sharing, or in how folders are kept on disk, but for the settings where the core types them (see 2.2).

## Order

Stage 1, then stage 2, each whole before the next. Stages 3 and 4 may be built side by side by two agents in worktrees: stage 3 owns `layout.ts`, `view-store.svelte.ts`, `App.svelte`'s start, the settings, `MapText.svelte`'s top and `src-tauri`; stage 4 owns `Path.svelte`, `path.ts`, `projects-menu.ts`, the top row, the keys of the sides, the words of the bar and the marks in the list. Both change `ProjectView.svelte`, in different regions: stage 3 the store (about line 340) and the restoring of `focused` and the tops; stage 4 the markup of the header and the bars (about 897–1130) and the functions of the sides (about 656–790). Stage 3 adds `mirrored` to `layout.ts` too, so that stage 4 only reads it; merge stage 3 first. Stage 5, the guide and the whole, runs with each stage for its part and once more at the end.

## Stage 1 — the map goes; the list is the tree

### 1.1 The route and the shell — `src/lib/state/router.svelte.ts`, `src/App.svelte`, `src/lib/shell/Rail.svelte`

- `Route` loses `{ view: 'owl'; at? }` and gains `{ view: 'home' }`. `parseRoute`: an empty path, `owl`, `owl/<anything>`, `projects` and anything not known give `{ view: 'home' }`. `formatRoute`: `#/`. `router.test.ts` revised.
- `Router` gains `lastProject = $state<Route | null>(null)`: set to the route whenever a route with `view === 'project'` is gone to or arrives by the hash, cleared by `forgetProject()` (called when a project is closed, stage 4). `App.svelte`'s key `projects`: `go(router.lastProject ?? { view: 'home' })`; the house in `Rail.svelte` does the same from `onclick` (keep `href="#/"` for the middle click, as a fallback).
- `App.svelte`: the branch `route.view === 'owl' || route.view === 'settings'` becomes `route.view === 'home' || route.view === 'settings'`, showing `ProjectsPane` (no `owlAt`) and `StartView` (stage 2; in this stage a `StartView` that shows the welcome of `OwlView` as it is, so that the scripts that begin at *Welcome to Glaukopis* hold). The `settings` effect replaces with `{ view: 'home' }`.
- `grep -rn "view: 'owl'" src` and send each to `home`: `project-back` in `ProjectView.svelte`, the unsharing at about line 437, `changes.ts`, and whatever else there is.

### 1.2 What goes

- Delete `OwlView.svelte`, `OwlMap.svelte`, `owl.ts`, `owl.test.ts`, `owl-keys.ts`, `owl-keys.test.ts`. `NameField.svelte` stays: the library uses it.
- `list.svelte.ts`: `owlFolds`, `owlFold`, `owlReveal`, `owlMaps`, `owlMap`, `owlElementFolds`, `owlElementFold` and `upFromProject` go; `projectKey` is imported from `owl.ts`, so move what `changes.ts`, `list-keys.ts` and the list still need of `owl.ts` (`projectKey`, `folderKey`, the keys of things) into `folders.ts`, and leave the layout, the regions and the places behind.
- `state/projects.svelte.ts`: `places`, `setPlaces`, `shown`, `show` go, with the calls of `owlPlaces`, `owlPlacesSet` and `projectsShown` in `load`; `api/projects.ts` keeps the wrappers only if the generated contract needs them to compile; else they go. The core is not touched.
- `changes.ts` and `changes.test.ts`: the changes that place things on the map (grep `places`, `Place`, `tidy`) go; the moves between folders, the names, the makings and the deletions stay, with their undo.
- `keys.svelte.ts`: the place `owl` and its five entries go; `TOGETHER` loses `owl` everywhere; `KeySheet.svelte`'s list of places loses it; `keys.ftl` (en, nb) loses `keys-place-owl` and `keys-owl-*`; `keys-place-tree` becomes *In the tree: the diagram, the text, the list at the left*.
- `project-actions.svelte.ts`:

```ts
export interface ProjectPlace {
  /** The projects shown in the sides: not opened again from here, and closed from here. */
  shown?: readonly string[];
  /** Closes the sides that show the project: Close. */
  close?: (project: string) => void;
  /** Shows a project beside the open one: Open beside. Given only where a project is open. */
  beside?: (project: string, at?: string) => void;
  fold?: { folded: boolean; toggle: () => void };
}
items(p: ProjectInfo, place: ProjectPlace = {}): MenuItem[]
// Open (home-open; disabled with the hint home-open-now when shown has p.id); Open beside
// (home-open-beside) when place.beside && shown.length && !shown.includes(p.id); Close
// (home-close, shortcut keysFor('close-side') after stage 4) when shown.includes(p.id) &&
// place.close; Unfold/Fold when place.fold; then as today.

export interface FolderPlace {
  fold?: { folded: boolean; toggle: () => void };
  make?: (kind: 'project' | 'folder') => void;
}
folderItems(f: Folder, place: FolderPlace): MenuItem[]
// Unfold/Fold; separator; New project here, New folder here, Rename; separator; the move
// items; separator; Delete the folder. No Enter.
```

  `elementItems` is unchanged. The callers: `ProjectList.svelte` (`projectItems`, `folderItems`, `openAsMap` goes), `BesideDialog.svelte` (nothing), and whatever `grep -rn "folderItems\|\.items(" src` finds.
- `ProjectList.svelte`: the owl row (`data-owl`, `owlHere`, the `owl` kind of `ListRow` in `list-keys.ts` and its tests) goes; the prop `owlAt` goes; `recent`, `RECENT`, `forms`, the `Segmented` of the head and `left`'s two values go: one form, the rows of `makeRows`; the drop of things from the map goes where `thingsOf` took a payload of the map (dragging among the rows stays).
- `MapBar.svelte`: the owl button (`home`, `onhome`, `goHome`) goes now; `project-all-projects` and `project-up-home-hint` go from the words. The rest of the bar stays until stage 4 replaces the file.
- `ProjectView.svelte`: `goHome` and the import of `upFromProject` go; `up()` at the project's top calls `toList(projectId)` (1.6).
- Words, en and nb: `home-owl-*`, `home-shown`, `home-recent`, `home-all`, `project-all-projects`, `project-up-home-hint` go; `home-enter` stays for elements; new: `home-open = Open`, `home-close = Close`; `home-open-beside` stays *Open beside*. `pnpm test` checks that every name used exists, not the other way round: grep for each name you remove, in `src` and in `e2e`.

### 1.3 The head of the list — `src/lib/home/ProjectsPane.svelte`, `ProjectActions`, `ProjectActionsHost.svelte`

- The head: `h2` *Projects*; a plus whose menu (`openMenu`) has *New project…* (`home-new`), *New folder* (`home-new-folder`), separator, *Join a shared project…* (`home-join`), *A project from a document…* (`home-from-document`), *Open a project file…* (`home-file-open`), *Open an Org file…* (`home-org-open`); a ⋯ (`home-page-menu`) whose menu has *Deleted projects…* with the count (as `OwlView`'s `moreMenu` builds it) and *A project of all the projects…* (`home-map-menu`); and × as today. `data-projects-new`, `data-projects-more` on the buttons, for the scripts.
- What `OwlView.svelte` did for these (`newMenu`, `moreMenu`, `joining` and `JoinDialog`, `fromDocument`, `written`, the trash and the project of all the projects) moves into `ProjectActions` (`project-actions.svelte.ts`) and its host `ProjectActionsHost.svelte`, which the pane already mounts, so that the start screen (stage 2) and the pane share one set.
- `settings`: `projectsPane: true` in `defaultSettings` of `api/system.ts`; `grep -rn projectsPane crates src-tauri` and set it true wherever the core declares a default too.

### 1.4 Undo in the list — `src/lib/home/ProjectList.svelte`, `keys.svelte.ts`

- The table gains a place `list`, in force with `everywhere`, `project` and `tree` (name it on both sides of `TOGETHER`), with `{ id: 'list-undo', keys: 'Ctrl+Z', place: 'list', over: ['undo'] }` and `{ id: 'list-redo', keys: 'Ctrl+Shift+Z', place: 'list', over: ['redo'] }`; `keys-place-list = In the list of projects` and the two words, en and nb. The sheet shows the place.
- `ProjectList.svelte`'s `onkeydown`, which already takes the keys of the tree, takes Ctrl+Z and Ctrl+Shift+Z while the focus is in the list and calls `homeUndo.undo()` / `homeUndo.redo()` (see `undo.svelte.ts`), with `stopPropagation`, so that the project's undo does not fire.

### 1.5 The marks of the sides — `ProjectView.svelte` (`Viewing`), `ProjectsPane.svelte`, `ProjectList.svelte`

```ts
/** A side of the view, as the list is told of it. */
export interface ShownSide {
  /** The project's id. */
  id: string;
  /** The project itself, once it is open; the list shows its tree from it. */
  project: Project | null;
  /** The element in view in that side. */
  at: string;
  /** Whether the side has the focus. */
  focused: boolean;
}
class Viewing {
  sides = $state.raw<ShownSide[]>([]);
  enter: ((id: string) => void) | null = null;
  beside: ((projectId: string, at?: string) => void) | null = null;
  /** Closes the sides that show a project (stage 4 gives it; until then null). */
  close: ((projectId: string) => void) | null = null;
}
```

  The effect at about line 295 fills `sides` from `panes` (`projectOf(p)`, `p.at`, `i === focused`), one entry per project (two own sides are one entry, with the focused side's `at`). `ProjectsPane` passes `sides` to `ProjectList`, which marks the row of each (`data-current` as today for the focused one, `data-shown` for the other, a quieter mark in the styles), shows each one's tree to its `at`, and passes `shown: sides.map((s) => s.id)` and `close: viewing.close` to `actions.items`. `current` (the focused side's id) stays as the one the keys of the tree act in.

### 1.6 Up into the list — `src/lib/home/list.svelte.ts`

```ts
/** Shows the list, if it was hidden, and puts the focus on a project's row. */
export function toList(project: string): void
```

  `listUi.focusRow = projectKey(project)`; `settings.set('projectsPane', true)` where it is off; `ProjectList` watches `listUi.focusRow` and, once the row is there (`tick`), reveals its folders, selects it (`selected`), focuses it and clears `focusRow`. `ProjectView.svelte`'s `up()`: `else if (i === 0 && p.at === PROJECT) toList(projectId)`.

### 1.7 The scripts

- `e2e/owl.mjs` becomes `e2e/list.mjs`: what it tried on the map, tried in the list: folders made, renamed and deleted; a project moved into a folder by dragging and by Alt with the arrows; undo from the message and by Ctrl+Z in the list; the menus of a project and a folder (their items by their English words); the plus menu and the ⋯ menu of the head; a project opened beside from the list and *Close* in its menu (the words exist from this stage; closing a side works from stage 4, so leave the closing for `path.mjs` and keep this script to what works now).
- `e2e/tree-keys.mjs`: part 4 (the map) goes; part 5 (the list) stays and gains the owl row's absence. `e2e/projects.mjs`, `housekeeping.mjs`, `maps.mjs`, `languages.mjs` (the screenshot 4d of the map becomes one of the list), `new-project-view.mjs`: wherever they went to the map, opened its menus or looked for *All projects*, they use the list.

Verify: `pnpm check`, `pnpm test`; `pnpm e2e:build`, then `timeout 300 node e2e/list.mjs`, `tree-keys.mjs`, `projects.mjs`, `housekeeping.mjs`, `maps.mjs`, `new-project-view.mjs`, `languages.mjs`, each to a file; look at the screenshots. Commit.

## Stage 2 — the start screen

### 2.1 The view — `src/lib/home/StartView.svelte` (new)

- No props. Two states, from `projects.loaded`, `projects.list` and `projects.folders`:
  - **Nothing at all**: the welcome as `OwlView` had it (the owl `Mark` at 120, `home-welcome`, `home-welcome-text`, the buttons *Begin a project*, *Join a shared project*, *A project from a document…*, *Open a project file…*, *Open an Org file…*, through `ProjectActions`), so that the scripts that begin at *Welcome to Glaukopis* and *Begin a project* hold.
  - **Projects, none open**: the owl at 120; a primary button *New project* (`home-new`, `data-start-new`); under it the heading *Last opened* (`home-start-recent`, new) and a list (`data-start-recent`) of up to ten rows, each a button: the badge (`ProjectBadge`), the name in the serif, the folder's name small where there is one, and `ago(modified)` as the list writes it; a click opens the project (`router.go({ view: 'project', project: id })`). Nothing under the button where no project was opened yet in this installation.
- The whole view is a drop target for a document, as `OwlView`'s welcome was (`written`, `fromDocument` from `ProjectActions`).
- Styles: centred, as the welcome; the list of the last opened at most 480px wide, rows 36px, hover as the list's rows.
- `App.svelte` shows it for `home` (1.1).

### 2.2 The projects last opened — `src/lib/api/system.ts`, `src/lib/state/projects.svelte.ts`

- `Settings` gains `recentProjects: string[]`, default `[]`; `grep -rn "projectsPane" crates src-tauri` tells whether the core types the settings: where it does, add the field there with the same default (and `lastPlace: Option<String>` and `window` of stage 3 at the same time, so that the core is touched once).
- `openProject()` (the function at the foot of `projects.svelte.ts`), before loading: `settings.set('recentProjects', [id, ...settings.value.recentProjects.filter((x) => x !== id)].slice(0, 20))`. `StartView` shows those among `projects.list`, in that order, the first ten.

### 2.3 The script

- `e2e/list.mjs` gains a part: with projects made, the app is closed and started again on the same data folder (`new App({ dataDir: first.dataDir })`; the first was made with `keepData: true` or a `dataDir` of your own under the scratchpad, since `close()` removes a folder it owns): the start screen shows *Last opened* with the projects in the order they were opened; a click opens one. (Until stage 3 the window starts at the start screen; after stage 3 it starts where it was left, so write this part so that it closes at the start screen — or move it to `as-left.mjs` in stage 3.)

Verify: `pnpm check`, `pnpm test`, `list.mjs`, `maps.mjs` (begins at the welcome), `smoke.mjs`. Commit.

## Stage 3 — the window opens as it was left

### 3.1 The place — `api/system.ts`, `App.svelte`

- `Settings` gains `lastPlace: string | null`, default null.
- `App.svelte`: an effect on `router.route` writes `settings.set('lastPlace', formatRoute(route))`, except for `settings` (which is replaced at once anyway). The settings are flushed before the window closes already (`closing.ts`, stage `first`).
- At start, in `onMount` after the settings and the languages are known and before `ready = true`: where `location.hash` is empty or `#/`, read `settings.value.lastPlace`; where it names a route, `parseRoute` it; where that is a project, `await projects.load()` (idempotent; the pane calls it too) and go on only if `projects.list` has the project; then `router.replace(route)`. Only then `ready = true`, so that nothing is drawn twice. A hash that names a place wins over the setting (links, and the scripts that open a place by its address).

### 3.2 The text's place, the focus and the mirror — `layout.ts`, `view-store.svelte.ts`, `ProjectView.svelte`, `text/MapText.svelte`

- `layout.ts`: `Layout` and `StoredView` gain `tops: (string | null)[]` (the element at the top of the text of each pane, by index; null where the pane shows no text), `focused: number`, `mirrored: boolean`; `arranged` reads them (`tops` cut to the panes there are, and only ids the project has; `focused` within the panes; `mirrored` false where unknown) and `toStore` writes them; `layout.test.ts` gains the cases.
- `ProjectView.svelte`: `tops` already exists (for the outline); the store's `layout()` returns it and `apply(laid)` sets it, `focused` and `mirrored` (new `let mirrored = $state(false)`, read by stage 4). `follow()` in `view-store.svelte.ts` reads `shown.tops`, `shown.focused` and `shown.mirrored` too, so that a change saves. The scroll fires `ontop` often: `MapText` calls it only when the element at the top changes, which it does today; keep it so.
- `MapText.svelte` gains a prop `top?: string | null`: on its first layout (where it lays the sections out and is ready to scroll; look at how `reveal` is handled, at about line 233 and in the effect that reads `reveal`), where `top` names an element it has, it scrolls so that the element's heading stands at the top, as `goTo` does but without selecting or marking it; once only. `ProjectView` passes `top={tops[i]}` where the pane shows the text. The diagram needs nothing: its camera is kept per element already.
- After `store.arrange(p)` the focused pane is as kept: `focused = laid.focused`.
- `view-store.svelte.test.ts`: the three fields go round through `toStore` and `arranged`.

### 3.3 The window — `api/system.ts`, `App.svelte`, `src-tauri/tauri.conf.json`, `closing.ts`

- `Settings` gains `window: { width: number; height: number; x: number; y: number; maximized: boolean } | null`, default null.
- `closing.ts`: at the beginning of `onCloseRequested`, before the tasks, read `getCurrentWindow().isMaximized()`, `outerSize()` and `outerPosition()` (scaled to logical pixels by `scaleFactor()`), and `settings.set('window', …)`; the flush of the settings in the stage `first` writes it. Only in Tauri (`inTauri`).
- `tauri.conf.json`: the main window gains `"visible": false`. `App.svelte`, once `ready` is true: where `settings.value.window` is there, `setSize(new LogicalSize(w, h))`, `setPosition(new LogicalPosition(x, y))`, and `maximize()` where it was maximised; then `getCurrentWindow().show()`, in Tauri, whatever happened before (a failure to size is logged, never a window that stays hidden). The harness drives the window through WebDriver and sets its rect itself (`harness.mjs` at about line 168): check that a hidden window does not break the scripts; if it does, show at once when `GLAUKOPIS_E2E` or whatever the harness sets is there — look at how `testHook` knows the harness.
- On Hyprland and other tiling managers the size and the place are the manager's; nothing breaks.

### 3.4 The script — `e2e/as-left.mjs` (new)

- Run 1, on a data folder of its own under the scratchpad: a project with a tree of a dozen elements and long texts; enter an element; Split view with another element in the second side as text; scroll the second side's text so that a far element stands at the top; put the focus in the second side; close the app (the harness's `close()`, which closes the window as the user would: check that it goes through `onCloseRequested`; if it kills the process, add a way to close the window through WebDriver first).
- Run 2 on the same folder: the address is the project at the element, two sides, the second as text with the same element at the top (read `data-` attributes the text gives its sections; add `data-top` to the text if nothing says it), the focus in the second side. Then go to the library and close.
- Run 3: the library is where it opens. Delete the project through its menu, go to the start screen, close.
- Run 4: the start screen, with nothing in *Last opened* for the deleted project.
- Screenshots of each run's first screen.

Verify: `pnpm check`, `pnpm test`, `cargo test --workspace` and `cargo clippy --workspace --all-targets` where the core or `src-tauri` changed, `as-left.mjs`, `smoke.mjs`, `instances.mjs` (two windows on two folders). Commit.

## Stage 4 — the top row: the path, the sides, the colours

### 4.1 The crumbs and their fitting — `src/lib/project/path.ts` (new, pure, tested)

```ts
export type Crumb =
  | { kind: 'folder'; id: string; name: string }
  | { kind: 'project'; id: string; name: string }
  | { kind: 'element'; id: string; name: string };

/** The path from the top folder to the element in view: the folders the project lies in, the project, the elements down to `at`. */
export function crumbsOf(
  folders: readonly Folder[],
  info: ProjectInfo,
  project: { pathTo(id: string): string[]; node(id: string): { title: string } | undefined },
  at: string,
): Crumb[]

/**
 * Which crumbs are shown in a room: the first and the last always, then as many
 * of the rest as fit, taken from the end; the hidden ones stand behind one crumb
 * of `ellipsis` width. Widths are of the crumbs drawn whole, with their
 * separators. The last crumb may be cut: `cutLast` is how much it may shrink.
 */
export function fitCrumbs(
  widths: readonly number[],
  room: number,
  ellipsis: number,
): { shown: number[]; hidden: number[] }
```

  `path.test.ts`: all fit; only first and last fit; the last alone too wide (shown, to be cut); the middle hidden from the start, not the end; a project in no folder; the project itself in view.

### 4.2 The menu of all projects — `src/lib/home/projects-menu.ts` (new, tested)

```ts
/** The folders as submenus and the projects as items, in the list's order; a folder `at` gives the menu of that folder alone. */
export function projectsMenu(
  folders: readonly Folder[],
  list: readonly ProjectInfo[],
  options: { shown: readonly string[]; choose: (project: string) => void; at?: string | null },
): MenuItem[]
```

  Folders sorted by `byName` with the projects in them after their folders, as `makeRows` orders them; a folder is `{ kind: 'submenu', label, icon: Folder, items }`; a project `{ label, icon: ProjectBadge's sign is not a Component: use the `Book` icon of Lucide as the list does, checked: shown.includes(id), action }`. An empty folder is a disabled submenu with one disabled item *Nothing in it* (`home-folder-empty`, new).

### 4.3 The path — `src/lib/project/Path.svelte` (new)

- Props: `project: Project`, `info: ProjectInfo`, `at: string`, `shown: readonly string[]`, `onselect: (id: string) => void` (enters an element, or the project's top), `onproject: (id: string) => void` (shows another project in this side), `ondocument?: () => void`.
- Markup: the chevron button (`data-path-all`, `aria-haspopup="menu"`, label `project-all-projects-menu` = *All projects*), which opens `projectsMenu` with `choose: onproject`; then the crumbs in a row that does not wrap, each a button (`data-crumb={kind}`), separated by `›` in `--ink-4`; folders in `--text-xs` and `--ink-3`, the project in `--text-sm` 600 with `ProjectBadge`, elements in `--text-sm`, the last in the serif at 15px 600 as `.name` of `MapBar` is today; a hidden *…* crumb button (`data-crumb="more"`) where `fitCrumbs` hides any, whose menu lists the hidden crumbs with their actions; after the last crumb the ⋯ button *This element* (`data-this-element`) with `openActions` of `MapBar.svelte` moved here as is, and the naming field (`rename`, `naming`, `commit`, `addUnder`, `remove`) with it.
- Measuring: render every crumb once in a measuring row (`visibility: hidden; position: absolute`) to read its `offsetWidth`, and the visible row from `fitCrumbs`; a `ResizeObserver` on the host re-measures when its width changes; the names change rarely, re-measure when `at` or any name changes (`$effect` reading them). Keep it cheap: no measuring on every keystroke in the text (the names of the crumbs change only when a crumb's name is edited).
- `MapBar.svelte` goes; `project-where`, `project-siblings-hint`, `project-trees-hint`, `project-shown-beside` go from the words where nothing uses them; `project-up-hint` stays for the folder crumbs' tooltips (`Up to “…”`) or goes — your call, say it.

### 4.4 The top row and the sides — `src/lib/project/ProjectView.svelte`

- **Markup.** A new row `<div class="top" data-top>` before the `<header>` at about line 897: one `<div class="cell" data-side={i}>` per pane, in the order of the panes (reversed where `mirrored`), each holding `<Path …>` and nothing else; and at the right end, outside the cells, the *Split view* button of today (`data-side-by-side` kept for the scripts, words `project-side-by-side` = *Split view*), moved up out of the header. The `<header>` stays under the top row with what it has today less that button: the view chooser of the focused pane, *Preview*, *Share* with its dot and the presence, the status, undo, redo, the panel's button. The `.pane-bar` of each pane stays as today less `MapBar`: the list's button in the first, the outline, the writing tools while the pane shows the text, the small view chooser while two panes are shown, and × (`project-close-side`, `data-close-side`), shown always now, since one side can be closed alone. Move nothing else: the rearrangement of the toolbars comes after this, and the owner will decide it.
- **Widths.** Each pane's width is observed (`ResizeObserver` on `paneEls[i]`, into `paneWidths[i]`) and its cell gets `style:width="{paneWidths[i]}px"; flex: none`; between two cells a 5px gap where the divider stands. *Split view* takes what is left at the right, over the preview and the panel at the side where those are open; where nothing is left, the cells give way before it, the last crumb of each path last (`fitCrumbs`).
- **Colours.** With two panes, the cell of the focused pane has `class="cell active"`, the other `class="cell other"`; with one pane neither. In `app.css` or the component: `.cell.active { background: var(--accent); --ink: var(--accent-ink); --ink-2: var(--accent-ink); --ink-3: color-mix(in srgb, var(--accent-ink) 78%, transparent); --ink-4: color-mix(in srgb, var(--accent-ink) 55%, transparent); --paper-hover: color-mix(in srgb, var(--accent-ink) 14%, transparent); --line: color-mix(in srgb, var(--accent-ink) 30%, transparent); }` so that the buttons, the badge and the chooser inside draw themselves in the accent's ink without knowing; `.cell.other { background: var(--paper-sunken); color: var(--ink-3); }`. Check both in the light and the dark theme, and in *mellow*, with a screenshot each; the difference must be seen at a glance from across the room. `.pane.focused .pane-bar`'s tint goes: the cell says which side is active.
- **Mirroring.** `mirrored` (from the store, stage 3): `.top` and `.panes` get `flex-direction: row-reverse` where it is true, the `<header>` between them is not mirrored; `moveSplit(dx)` uses `-dx` where mirrored, so that the line follows the pointer; the keys and the indices do not change. *Switch sides* (`project-switch-sides`, new, en and nb) in the Split view menu while two sides are shown, before *One at a time*: `mirrored = !mirrored`. `switch-sides` in the table with no key, bound, so that the palette has it.
- **Closing.** `closeSide(i)`:
  - one pane: `closeProject()`: `router.forgetProject()`, `router.go({ view: 'home' })`; the view is destroyed by `App.svelte` as it is when the library is gone to, and `leave` saves it.
  - `i` is an own side and the other pane is the guest: `router.go({ view: 'project', project: guest.id, at: panes[1].at, mode: panes[1].mode })`; the view of that project opens anew with one pane at that element (`arranged` takes the route's `at` and no second pane), after `projects.closed(id)` as `onMount` already waits.
  - else `closePane(i)` as today.
  - `viewing.close = (id) => { the sides that show id: the own sides where id === ownId (closeProject), the guest where id === guest.id (closePane(1)) }`.
  - `close-side` in the table: `{ id: 'close-side', keys: 'Ctrl+W', place: 'project', bound: true }`, bound to `closeSide(focused)`; `keys-close-side` en and nb; the × buttons show `keysFor('close-side')` in their tooltips.
- **The panel's head.** `.side-map` (about line 1275) shows, where `across`, the name of the project the panel is about (`project.name`) over the element's title, so that it is clear while the guest has the focus.
- **The words.** `project-side-by-side = Split view`, `project-side-by-side-short = Split`, nb *Delt visning* / *Del*; `keys-side-by-side = Split view…`; `project-switch-sides = Switch sides`, nb *Bytt side*; `project-close-side` stays *Close this side*; `project-view` and `project-view-this` as they are. The guide's words follow in stage 5.

### 4.5 The scripts — `e2e/path.mjs` (new), and the old ones

- `path.mjs`, in a window 1360 wide: a folder in a folder, a project in it with a tree five deep and long names; enter the deepest element: the path shows all crumbs, the last strongest (screenshot); a crumb entered goes there; the chevron's menu has the folders as submenus and the project checked; another project chosen from it is shown in this side. Then `new App({ width: 900 })` on the same folder: the path is elided, the first and the last crumbs shown, *…* between, whose menu lists the hidden crumbs and enters one (screenshot). Split view: *This element, as diagram and text*: two cells, the active one with `.active` (assert the class and take a screenshot in light and in dark); a click in the other side moves the colour; *Switch sides* reverses the order (assert `data-side` order under `.top`); *Another project…* shows a second project: both cells begin with their project's name; the list marks both rows; the panel at the side, opened while the guest has the focus, names the project; the header under the top row has Preview, Share, undo and redo and no Split view; the × in the guest's bar closes it; Ctrl+W closes the focused side; with one side, the × in its bar gives the start screen and the list marks no row.
- `maps.mjs` parts 13–15, `look.mjs` parts 4–5 and `keys.mjs`: the words *Side by side* become *Split view*; the pane's bar they looked for (`data-maps`) is the path now (`data-crumb`); revise the selectors.
- `tree-keys.mjs`: the script of Alt+Shift+Up at the project's top expects the map; now the list's row takes the focus (1.6).

Verify: `pnpm check`, `pnpm test`, `path.mjs`, `maps.mjs`, `look.mjs`, `keys.mjs`, `tree-keys.mjs`, `list.mjs`, `as-left.mjs` (the mirror and the focus come back), and the screenshots in both themes. Commit.

## Stage 5 — the guide, the words, the whole

- `docs/guide.md`: *Many projects* (line 68) says the list: its head, the one menu of a project with *Open*, *Open beside*, *Close*, the folder's menu, the undo; *The map of the projects* (110–197) goes, and in its place *The start screen* (the owl, *New project*, *Last opened*, what comes back at start: the place, the sides, the element at the top of the text, the diagram's view, the window's size); *One tree, entered anywhere* (1408–1528): the bar becomes the path (the chevron's menu of all projects, the crumbs, *…*, *This element*), *Side by side* becomes *Split view* with *Switch sides*, the × in a side's bar and Ctrl+W, the colours of the sides, the bar of the project under the top row for now, what the second project can and cannot do; *Keys* (2908–2961): the map's keys go, Ctrl+W and the list's undo come, *In the tree* names three places. Read the guide through once for *map of the projects*, *owl map*, *All projects*, *Side by side*, *Last used*, *Open as a map*, *Enter* on a project: none of them where the record has changed it.
- The record gains an addendum, *As built*: what was built, and where the build departs from the plan, in a few lines.
- `e2e/languages.mjs` in Norwegian: no English left in what you added.
- The full run of the scripts you touched, with `timeout 300` each, in sequence, and the counts in the report: interface tests, core tests unchanged, scripts run and passed, screenshots to look at.

## Report

At the end, in plain words for the owner, who does not know the records by number: what the list, the start screen, the top row and the sides do now; what comes back when the window opens; the keys that changed, as one short table; what departs from the plan and why; what is left (the other languages; the sides made equal; the rearrangement of the toolbars, which comes next); the counts.
