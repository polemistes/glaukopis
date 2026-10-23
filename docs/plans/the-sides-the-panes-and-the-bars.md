# Build plan: the sides, the panes, and the bars

The working plan for `docs/adr/0064-equal-sides-the-typesetting-pane-the-document-pane-and-the-bars.md`. Read the record first, in full: it says what and why; this says how, in which order, in which files, with which interfaces, and how each stage is verified. Where they disagree, the record wins; say so in your report. Read also `.claude/briefs/common.md` (the progress note, the languages, the rules) and `docs/plans/the-shape-of-a-text-and-its-org-form.md`, section "How to work", which holds here too: plain words; never a record number when talking to the owner; verify before you commit; edit then format; e2e with `timeout`, processes ended by PID only; commit when a stage is whole, never push; report the counts. Commit at the end of every stage and more often where a stage is long: work that is not committed is lost when the session is.

Read before you begin: `docs/adr/0063-the-list-the-path-and-the-window-as-it-was-left.md` with its addendum and its plan (what was built yesterday and today, which this builds on), `docs/adr/0037-a-project-is-one-tree.md` (side by side), `docs/adr/0042-the-look-of-a-document.md` and `0054-what-you-are-writing-and-the-doors-to-how-it-looks.md` (the preview, Look and the chooser), `0039-line-numbers-by-hand-and-reference-marks.md`, `0029-kinds-and-looks.md` and `0040-the-kind-of-a-paragraph-and-passages.md` (kinds and marks), `src/App.svelte` (the start, the `{#key route.project}` that remakes the view), `src/lib/state/router.svelte.ts`, `src/lib/api/system.ts` (the settings: `lastPlace`, `window`, `recentProjects`, `breakSigns`), `src/lib/project/ProjectView.svelte` in full (1866 lines: `Viewing` and `ShownSide` at the top; `panes`, `focused`, `mirrored`, `cameras` at about 138; the guest at about 180; `projectOf`, `across`, `ownIndex`, `previewIndex` at about 200–240; the `Side` of the panel at about 320; the store at about 360; `onMount` at about 385; `leave` and `onDestroy` at about 490–560; the router effect at about 585; `show`, `holding`, `goTo`, `up` at about 620–680; the sides' functions at about 680–820; the key bindings at about 840; the markup: the top row, the header, the panes with their bars, the preview, the panel at the side, the dialogs; the styles), `guest.svelte.ts` (the opener of a project beside: the shape of a side's lifecycle), `layout.ts`, `view-store.svelte.ts`, `side.svelte.ts` (the state of the panel at the side), `SideTabs.svelte`, `elsewhere.ts` (`openHere`, `closedHere`, `openedHere`), `Path.svelte` (the crumbs, the chevron's menu, the ⋯), `elements.ts` (the element's menu, at about 400–680), `text/MapText.svelte` (`menuFor`, `oncontextmenu` at about 1062), `src/lib/editor/WritingTools.svelte` in full (937 lines: `numbers` at about 245, the insert menu at about 300, the kind menu at about 480, `words` at about 565, the markup at about 650), `ElementBox.svelte` (the box's tools), `src/lib/editor/schema.ts` (the marks at about 82–135), `commands.ts`, `keys.ts`, `plugins.ts`, `src/lib/editor/references.svelte.ts` (`setProject`, `currentProject`), `src/lib/figures/pictures.svelte.ts` (`open` at about 329), `src/lib/preview/PreviewPanel.svelte` (the head at about 600–650; the chooser of what you are writing at about 620), `src/lib/look/LookPanel.svelte` (the chooser's button at about 1699), `src/lib/document/AboutDocumentWindow.svelte` and `about-document.svelte.ts` (the sections), `TemplateChooser.svelte` and `chooser.svelte.ts`, `src/lib/sharing/SharePanel.svelte` and `Presence.svelte`, `src/lib/home/project-actions.svelte.ts` (`items`), `ProjectList.svelte` (`choose`), `src/lib/shell/keys.svelte.ts` (the entries of a project), `src/app.css` (the sign of a break at about 630), `e2e/harness.mjs` (`openThisMap`, `thisMap`, `newMap`, `openChooser`, `chooseWhat`, `openAbout`, `openLook`, the `path` getter at about 615), and `docs/guide.md`: *The text* (187), *Notes* (338), *Lines and paragraphs* (449), *Reference marks*, *Pictures*, *Citations*, *The panel at the side*, *Comments*, *One tree, entered anywhere* (1346), *What you are writing*, *About this document*, *The preview, and the manuscript*, *The look of a document*, *Working together*, *Keys*.

## Vocabulary

- *A side*: one of the one or two things the window shows, each with its project: `SideView.svelte` (new), described by a `SideSpec`. *The active side*: the one with the focus. *The key* of a side: a string of its own that lasts while it is shown, so that the panes can name it.
- *The arrangement*: what the window keeps of its sides and panes, `Arrangement` in `sides.svelte.ts` (new), kept in the settings.
- *The typesetting pane*: `PreviewPanel.svelte`, with the Look column. *The document pane*: what the panel at the side becomes. *Document properties*: `AboutDocumentWindow.svelte`. *Document type*: its new tab, what `TemplateChooser.svelte` showed.
- *The top row*: the row over the sides, with the list's button, a cell per side, the switch button and Split view. *A side's bar*: the row of icons under its cell, `SideBar.svelte` (new).
- *The kind menus*: Paragraph kind and Words kind. *The marks menu*: the eight marks. *The whitespace marks*: ¶, ↵ and the ring of a hard space.

## What exists, and what each piece becomes

| Today | Becomes |
| --- | --- |
| `ProjectView.svelte`: one project of the view, `panes[]` of it, a guest in `panes[1]`; the store of the view per project with the panes, the panel, the preview | a shell: the top row, one `SideView` per side, the typesetting pane, the document pane; its state in `sides.svelte.ts` and `panes.svelte.ts`; the project's store keeps cameras, folds, tops, the outline's width |
| `guest.svelte.ts`: the opener of a project beside | `side-open.ts`: the opener of any side's project, the same for every side; `guest.svelte.ts` goes |
| `layout.ts`, `view-store.svelte.ts`: `Layout` with panes, side, outline, preview, sizes, tops, focused, mirrored | `Layout` with cameras, folded, tops by element, `outlineWidth`; the rest is the arrangement |
| `api/system.ts`: `lastPlace`, `window`, `breakSigns` | plus `arrangement: Arrangement \| null`; `breakSigns` goes into the arrangement as `marks` |
| `App.svelte`: `{#key route.project}` remakes the view | the view stays while any side is shown; the route follows the active side |
| `side.svelte.ts` `Side`, `SideTabs.svelte`: look, references, pictures, comments, found, history, changes | `panes.svelte.ts` `DocumentPane`: references, images, comments, found, history, changes, of the active side; Look goes to the typesetting pane |
| `PreviewPanel.svelte`: the preview of the pane it follows, with the chooser of what you are writing | the typesetting pane of the side chosen, with the Look button and the Look column |
| `LookPanel.svelte` in the panel at the side, with the chooser's button | in the typesetting pane's Look column; a plain button *Document type…* |
| `AboutDocumentWindow.svelte`: details, language, checklist | *Document properties*: details, type, language, checklist; the lines of the page numbered in details |
| `TemplateChooser.svelte`, `chooser.svelte.ts` | the body becomes the Document type tab; the dialog and `templateChooserUi` go |
| The header over the panes: view chooser, Split view, Preview, Share, status, undo, redo, panel | goes: the view chooser, undo, redo, Typesetting and Document to each side's bar; Split view to the top row; Share to the list; the status to the path |
| The bar of a pane: list button, outline, `WritingTools`, view chooser, × | `SideBar.svelte`: outline · views · Paragraph kind, Words kind, Marks · undo, redo · spelling, whitespace marks · Insert · Typesetting, Document · ×; the list's button to the top row |
| `WritingTools.svelte`: New element, kind, #, I B Sc, Words, Cite, Note, Comment, Insert, spelling, ↵ | the writing items of a side's bar and of the box: Paragraph kind, Words kind, Marks, spelling, whitespace marks, Insert (with Citation, Note, Comment, Image, Table, Inline number…) |
| `Path.svelte`: chevron with a menu of projects; crumbs; ⋯ This element with renaming | chevron with a tree; crumbs; the Not saved sign on the project's crumb; no ⋯ |
| `elements.ts`: the element's menu | gains *Document properties…* and *A document into it…* |
| `MapText.svelte`: the right-click menu is the element's | gains *Number these lines…* on paragraphs |
| `schema.ts`, `commands.ts`, `keys.ts` | a hard space, Ctrl+Shift+Space |
| `project-actions.svelte.ts` `items` | gains *Share…* |
| `keys.svelte.ts` | `preview` is the typesetting; `side-look` its Look; `what-document` the type tab; `side-panel` the document pane; `share` goes; `writing-hard-space` and `writing-marks` come; `switch-sides` keeps its entry |
| `locales/*/*.ftl` | the words of the record; *picture* becomes *image* where the user sees it |
| `e2e/harness.mjs` and the scripts | `app.view(name)`, `app.thisElement(item)`, the helpers of the panes; the scripts that pressed the header's chooser |

## Order

**Stage 1 first, alone, whole**: it is the foundation, and everything after it touches what it makes. Then **stages 2 and 3 side by side, by two agents in worktrees**: stage 2 (the panes) owns `preview/`, `look/`, `document/`, `panes.svelte.ts`, `SideTabs.svelte`, the sharing's presence, and in `ProjectView.svelte` the blocks marked *the typesetting pane* and *the document pane*; stage 3 (the bars and menus, then stage 4) owns `editor/WritingTools.svelte`, `SideBar.svelte`, `Path.svelte`, `elements.ts`, `MapText.svelte`'s menu, the schema's hard space, `app.css`'s marks, `project-actions.svelte.ts`, the words of the editor, the project, the home and the shell, and in `ProjectView.svelte` the block marked *the top row* and in `SideView.svelte` the block marked *the bar*. Stage 1 leaves those blocks marked with comments, and `panes.svelte.ts` with the interface below, so that the two can build apart; merge stage 2 first. **Stage 4** is done by the agent of stage 3 after it. **Stage 5** at the end, on main.

## Stage 1 — equal sides

### 1.1 The arrangement — `src/lib/project/sides.svelte.ts` (new, tested), `src/lib/api/system.ts`

```ts
export interface SideSpec {
  /** Lasts while the side is shown; the panes name the side by it. */
  key: string;
  project: string;
  at: string;
  mode: MapMode;
  outline: boolean;
}

/** What the window keeps of its sides and panes, with the settings. */
export interface Arrangement {
  sides: SideSpec[];
  focused: number;
  mirrored: boolean;
  /** The part of the width the first side has, of two. */
  split: number;
  /** The side the typesetting pane shows, by index; null while it is closed. */
  typesetting: number | null;
  look: boolean;
  document: boolean;
  tab: DocumentTab;
  /** Whether the marks of whitespace are shown. */
  marks: boolean;
  /** The widths of the panes, in pixels; 0 for what is given. */
  typesettingWidth: number;
  documentWidth: number;
}

export class Sides {
  sides = $state<SideSpec[]>([]);
  focused = $state(0);
  mirrored = $state(false);
  split = $state(0.5);
  /** The active side. */
  readonly active: SideSpec | undefined;
  byKey(key: string): SideSpec | undefined;
  /** Opens a project in the active side, in the place of what was there; makes the first side where there is none. */
  open(project: string, at?: string, mode?: MapMode): void;
  /** Opens a project in the other side, making one where there is one. */
  beside(project: string, at?: string, mode?: MapMode): void;
  /** Enters an element in a side; `mode` turns it. */
  show(key: string, at: string, mode?: MapMode): void;
  focus(key: string): void;
  close(key: string): void;
  /** Closes every side that shows a project. */
  closeProject(project: string): void;
  switchSides(): void;
  /** Lays the window out as the arrangement kept says, where its projects are there. */
  arrange(kept: Arrangement | null, route: Route): void;
  /** The arrangement as it is, to keep. */
  toKeep(): Arrangement;
}
export const sides = new Sides();
```

- `Settings` gains `arrangement: Arrangement | null`, default null; `breakSigns` goes (read once into `marks` where a kept settings file has it, then ignored).
- The arrangement is written with `settings.set('arrangement', sides.toKeep())` a moment after anything of it changes, by an effect in `ProjectView.svelte` (as the view store's `follow` does), and the settings are flushed before the window closes already.
- `arrange(kept, route)`: where the route names a project and the kept arrangement's active side has that project, the kept arrangement is taken whole (every side whose project still exists); else one side at the route's project, element and view. Both cases tested.
- The router mirrors the active side: an effect does `router.replace({ view: 'project', project, at, mode })` when the active side changes; a `hashchange` to a project route that is not the active side's calls `sides.open(route.project, route.at, route.mode)`, so that back, forward and links go to the active side. `router.lastProject` keeps working.

### 1.2 The panes' interface — `src/lib/project/panes.svelte.ts` (new; stage 1 writes it, stage 2 fills it)

```ts
export type DocumentTab = 'references' | 'images' | 'comments' | 'found' | 'history' | 'changes';
export class Panes {
  /** The key of the side the typesetting pane shows; null while it is closed. */
  typesetting = $state<string | null>(null);
  look = $state(false);
  document = $state(false);
  tab = $state<DocumentTab>('references');
  /** The three states of a side's Typesetting button: open for it, turn to it, close. */
  typesetFor(key: string): void;
  closeTypesetting(): void;
  /** Opens the Look column, and the typesetting pane for the side where it is closed. */
  openLook(key: string): void;
  toggleDocument(): void;
  /** Opens the document pane at a tab, or closes it where it shows that tab already (`toggle`). */
  showTab(tab: DocumentTab, toggle?: boolean): void;
}
export const panes = new Panes();
```

The arrangement's `typesetting` is the index of the side whose key `panes.typesetting` is. `sides.close(key)` calls `panes.closeTypesetting()` where that side was shown.

### 1.3 A side — `src/lib/project/SideView.svelte` (new), `side-open.ts` (new, from `guest.svelte.ts`)

- `side-open.ts`: the `Opener` of `guest.svelte.ts` generalised to any side: `openSide(id)` waits for `projects.closed(id)`, `openProject(id)`, `rememberOpened(id)`, makes the `ProjectSharing`, `openHere(id, project)`, `setMe`; `closeSide(opened)` does `historyOf(p, id).stop()`, `sharing.close()`, the view store's save, `p.close()`, `closedHere`, and `projects.closing(id, …)` so that what reads the project from disk waits. `elsewhere.ts` keeps counting what is open by project. Tested as `guest.svelte.test.ts` tested the opener.
- `SideView.svelte`, props `spec: SideSpec`, `focused: boolean`, `mirrored`: opens its project in `onMount` and lets go in `onDestroy` (as `ProjectView` does today at about 385–560, with `gone` for a side gone while opening); holds the project, its `ViewStore` (now cameras, folded, tops by element, `outlineWidth`), its `Folding`, the diagram, the text and the timeline of its element in view (the `{#key}` block of today's pane), the outline, the drop of documents (`documentsIn`), its `WordsBar`, its `EditorHost`, its `ProjectDialogs`, its `PickerHost` where that is per project, the passage kinds' CSS of its project (one `<style>` per side, by key), `beforeClose` for its project; and a block marked `<!-- the bar -->` holding what the pane's bar has today (the outline button, `WritingTools`, the small view chooser, ×) for stage 3 to rewrite.
- What is per side and was per view: `show`, `holding`, `goTo`, `up` (up from the project's top goes to the list), `reveal`, `texts`/`diagrams` refs, `findInText`, `tops`. The keys of the project (`shortcuts.bind` of today at about 840) are bound once by `ProjectView` and act on the active side through `sides.active` and a `SideView` method map (`sideApi.get(key)`), so that one binding serves both.
- The window's title is the active side's project; `pictures.open(id, used)` follows the active side; `references.svelte.ts`'s `setProject` is called with the active side's project when the focus changes (each `EditorHost` sets it on its own focus already; check that two hosts do not fight: the one of the active side wins).
- `viewing` of the list: `sides` gives `ShownSide[]` (one per project, the active side's element where two show one project); `viewing.enter(project, id)` shows in the side that shows the project, the active one where both do; `viewing.beside` and `viewing.close` call `sides`.
- Dragging elements between two sides of two projects (`carrying`) and the doubled divider (`across`) stay, read from `sides`.
- The outline: `spec.outline` per side; Ctrl+Shift+O toggles the active side's.
- Undo and redo act on the active side's project.

### 1.4 The shell — `src/lib/project/ProjectView.svelte`, `src/App.svelte`

- `App.svelte`: the `{#key route.project}` goes; `ProjectView` is mounted while `route.view === 'project'` and reads the route once, through `sides.arrange(settings.value.arrangement, route)`; `ProjectsPane` gets `viewing.sides` as today.
- `ProjectView.svelte` keeps: the top row (block `<!-- the top row -->`, as stage 4 of 0063 built it, now reading `sides`), the `{#each sides.sides as spec (spec.key)}` of `SideView`s with the divider between, the typesetting pane (block `<!-- the typesetting pane -->`: today's `PreviewPanel`, for the side `panes.typesetting` names, or the active side while stage 2 is not built; `panes.typesetting` is set to the active side's key when Ctrl+P or the Preview button opens it, so that it keeps working), the document pane (block `<!-- the document pane -->`: today's panel at the side with its `Side` state, whose host reads the active side's project and element), the dialogs that are the window's (`DocumentHost`, `ConfirmHost`, `BesideDialog`, `SharePanel` for the active side).
- The header over the sides stays in stage 1 as it is, reading the active side (view chooser, Preview, Share of the active side's sharing, status of the active side's project, undo, redo, panel): stage 3 removes it.
- Closing: `sides.close(key)`; with none left, `router.forgetProject()` and `{ view: 'home' }`.
- `guest.svelte.ts`, the `across`/`ownIndex`/`previewIndex` family and `layout.ts`'s `Pane` go; `layout.ts` keeps `Sizes` of a project's own things and `arranged`/`toStore` for what a project keeps.

### 1.5 The scripts

- `e2e/as-left.mjs`: the arrangement comes back (two sides, the focus, the mirror, the typesetting pane open for the side it showed); the kept project place opens the arrangement, a link opens one side.
- `e2e/breaks-and-projects.mjs`: a project opened from the list opens in the active side and the other side stays (new checks). `e2e/list.mjs`: *Open beside* with two sides shown replaces the other side; *Close* on either project. `e2e/maps.mjs` parts 13–15 and `e2e/path.mjs`: both sides have every panel; closing the first side leaves the second as it is, without reopening.

Verify: `pnpm check`, `pnpm test`; `pnpm e2e:build`; `as-left`, `list`, `path`, `maps`, `breaks-and-projects`, `look`, `preview`, `history`, `review`, `comments`, `found`, `sharing`, `instances`, `smoke`. Commit after 1.1, after 1.3 (not yet wired, if it is long), and at the end.

## Stage 2 — the panes

### 2.1 The typesetting pane — `src/lib/preview/PreviewPanel.svelte`, `src/lib/project/panes.svelte.ts`, `ProjectView.svelte` (its block)

- `panes.typesetFor(key)`: closed → `typesetting = key`; shows another → `typesetting = key`; shows this → `typesetting = null`. `openLook(key)`: `typesetting ??= key; look = true`.
- The pane is given the side's project and element (`sides.byKey(panes.typesetting)`), made anew (`{#key}`) when the side's project changes; it no longer follows the focus. Where the side it shows closes, `panes.closeTypesetting()`.
- The head: the chooser of what you are writing (the button at about 620, `preview-what-*`) goes; in its place the **Look** button (`data-look`, lit while `panes.look`), then *Go to the text*, *Show the text*, *Export*, and the pane's × (`preview-hide`, now *Hide the typesetting*). The pane's `aria-label` and the words of its title are *Typesetting* (`preview-title`, en *Typesetting*, nb *Ombrekking*; check `preview.ftl` for every word that says *preview* to the user and change those that name the pane; *preview* as the pages themselves may stay where it reads well).
- The Look column: `LookPanel` mounted inside the typesetting pane, to the right of the pages, with its own divider, shown while `panes.look`; it loses `head={tabs}` and its × sets `panes.look = false`. `LookPanel`'s chooser button (about 1699) becomes a plain button **Document type…** (`look-document-type`, new) that calls `aboutDocumentUi.open({ project, at, section: 'type' })`; it must not look like a dropdown.
- Keys: `preview` → `panes.typesetFor(sides.active.key)`; `side-look` → `panes.openLook(sides.active.key)`, or closes the column where it is open for the active side.

### 2.2 The document pane — `src/lib/project/panes.svelte.ts`, `src/lib/project/side.svelte.ts` → `document-pane.svelte.ts`, `SideTabs.svelte`, `ProjectView.svelte` (its block)

- `Side` of `side.svelte.ts` becomes `DocumentPane` in `document-pane.svelte.ts`: `kind` goes into `panes.document`/`panes.tab`; it keeps `review`, `looking`, `pictureScope`, `citationsOf`, `toggleReview`, `follow`; its host reads the active side (`sides.active`, its project through `sideApi`), so that it always shows the active side's document. When the focus moves to the other side, a review in progress is closed as today's `toggleReview(false)` closes it, and the looking at a moment is left.
- `SideTabs.svelte`: the tabs references, images (`project-pictures` → *Images*), comments, found, history, changes; no Look. The head: `.side-map` names the project of the active side where two sides are shown (as today's `data-side-project`), and the element; a **presence sign** (`data-presence`, a small `Users` icon with the count) while `activeSharing.others.length`, whose hover shows the names (`Presence.svelte` in a tooltip or a small popover).
- The `Document` button of the bars (stage 3) calls `panes.toggleDocument()`; until stage 3 the header's panel button does.
- Keys: `side-panel` → `panes.toggleDocument()`; `side-references` etc. → `panes.showTab(tab, true)`; `side-pictures`'s words *The images of the project*.
- Widths: `typesettingWidth` and `documentWidth` in the arrangement; the dividers write them.

### 2.3 Document properties — `src/lib/document/AboutDocumentWindow.svelte`, `about-document.svelte.ts`, `TemplateChooser.svelte`, `chooser.svelte.ts`

- `ABOUT_SECTIONS` gains `'type'` after `'details'`: the tab **Document type** holds what `TemplateChooser.svelte`'s dialog held (its body becomes `DocumentType.svelte`, used by the tab; the dialog and `templateChooserUi` go; `TemplateEditor` stays as it is). The window's title is *Document properties* (`about-window-title` or whatever names it in `about.ftl`; nb *Dokumentegenskaper*); `about-menu` = *Document properties…*; `chooser-menu` goes.
- The lines of the page: a row in *details*, *Number the lines of the page*, on or off, with where an inherited value comes from as the language shows it (`from('lineNumbers')`); it is what `editor-numbers-page` did (`project.setDocument(on, { lineNumbers })`).
- Keys: `document-settings` opens it for the active side's element in view; `what-document` opens it at `'type'`; `look-type` as it is.
- Every caller of `templateChooserUi.open` (`grep -rn templateChooserUi src`) calls `aboutDocumentUi.open({ …, section: 'type' })`.

### 2.4 The scripts and the harness

- Helpers: `openChooser`, `chooseWhat`, `closeChooser` → open Document properties at the type tab (`openAbout('type')`) and choose there; `openLook`/`lookSection` through the typesetting pane's Look button; new `app.typeset()` (the active side's Typesetting button, `data-typeset` in the bar from stage 3, until then the header's Preview button) and `app.documentPane(tab)`.
- Scripts: `preview`, `look`, `what`, `templates`, `scope`, `comments`, `history`, `review`, `found`, `pictures`, `library`, `sharing` (the presence), `as-left` (the pane comes back for its side; a project closed and reopened does not bring it). Run each.

Verify: `pnpm check`, `pnpm test`, the scripts above. Commit.

## Stage 3 — the bars and the menus

### 3.1 The top row — `ProjectView.svelte` (its block), `Path.svelte`

- The list's button (`data-projects-button`, `PanelLeft`) at the far left of the top row, before the cells. Between two cells, on the join, a small button **Switch sides** (`data-switch-sides`, `ArrowLeftRight`, tooltip `project-switch-sides`) calling `sides.switchSides()`; the menu item stays. Split view at the right end as it is.
- The header over the sides goes, with `project-preview`, `project-share*` as button words where nothing uses them, and the status.
- `Path.svelte`: the ⋯ (`openActions`, `data-this-element`), the naming field (`naming`, `rename`, `commit`, `addUnder`, `remove`) and the props `ondocument` go; a prop `status: 'saved' | 'error'` and `fault?: string` give the **Not saved** sign on the project's crumb (`data-not-saved`, `CircleAlert` in `--danger`, tooltip `project-not-saved` with the fault). The words of the ⋯'s items go where nothing uses them after 3.4.

### 3.2 A side's bar — `src/lib/project/SideBar.svelte` (new), `SideView.svelte` (its block), `src/lib/editor/WritingTools.svelte`

- `SideBar.svelte`, props: the side's `spec`, `project`, `focused`, the text's editor scope, callbacks `onview(mode)`, `onoutline`, `onclose`. Icons only, `IconButton` with tooltips and keys; `data-bar` on the bar. In order: the outline (`ListTree`, lit while shown); a separator; the view chooser, `Segmented` icon-only with `role="radio"` buttons carrying `data-view="diagram|text|timeline"` and `aria-label`, Timeline only where `timed(at)`; a separator; `WritingTools` with its three menus (3.3); a separator; undo and redo of `project`; a separator; spelling and the whitespace marks (3.5), both in `WritingTools`; a separator; Insert (in `WritingTools`); a separator; **Typesetting** (`data-typeset`, `BookOpenText`, lit while `panes.typesetting === spec.key`, `panes.typesetFor(spec.key)`) and **Document** (`data-document`, `PanelRight`, lit while `panes.document && focused`, `panes.toggleDocument()`); and at the right end × (`data-close-side`, Ctrl+W). The separators are thin lines, `role="separator"`.
- While the side shows the diagram or the timeline, the kind menus, Marks, the whitespace marks and Insert are disabled (not hidden), so that the bar does not shift. `WritingTools` keeps serving `ElementBox.svelte` as before, with the same three menus and Insert.
- `WritingTools.svelte` loses *New element* (the context menu has it), the *#* menu, the I, B and Sc buttons, *Cite*, *Note* and *Comment* as buttons, and the ↵ toggle; it gains the Marks menu and the whitespace-marks toggle; its idle state when no editor has the focus stays.

### 3.3 The menus — `WritingTools.svelte`, `locales/*/editor.ftl`

- **Paragraph kind** (`editor-paragraph-kind`, button text the current kind, `data-paragraph-kind`): the menu as today's `kinds` menu.
- **Words kind** (`editor-words-kind` = *Words kind*, nb *Ordtype*; button text the current words kind or the menu's name; `data-words-kind`): foreign words with their language, title of a work, term, mention, highlight, the speaker and the stage direction within a line (as `WORD_KINDS` has them), the writer's own, a separator, the language of the passage, a separator, *Make a kind of words…* and *Change…*. The five marks leave it.
- **Marks** (`editor-marks` = *Marks*, nb *Markeringer*; `data-marks`; icon `Type` or `Italic`): italic, bold, small capitals, underline, superscript, subscript, struck, code, each `checked` where the selection has it and with its key (`keysFor('writing-italic')` …). No buttons for any mark.
- **Insert** (`data-insert`): *Citation* (`editor-cite`, key `writing-cite-keys`), *Note* (`writing-note`), *Comment* (`comment`), separator, *Image* (`editor-image` = *Image*, nb *Bilde*): opens the document pane at the images (`panes.showTab('images')`) and tells it to offer putting an image in at the cursor (the images tab has *Add from a file* and dragging into the text already; check `PicturePanel.svelte` and give it `insertAt` where it lacks a one-click way), *Table* (`editor-table` = *Table*, asks the size as today), *Table from a file…*, *Formula*, *Equation*, *Cross-reference…*, *Inline number…* (`editor-inline-number`, nb *Tall i linjen*; what `editor-refmark` was; the dialog's title too), *Two texts side by side*, *Page break*, *Column break*. Every `hint` of these items goes, and the `-hint` words with them where nothing else uses them.

### 3.4 The ⋯'s items find their places — `elements.ts`, `MapText.svelte`, `DiagramNode.svelte`

- The element's menu (`elements.ts` at about 400) gains, after *Rename*: **Document properties…** (`about-menu`, `aboutDocumentUi.open({ project, at: id })`) and **A document into it…** (`project-document-into`, through a new `actions.documentInto?: (id: string) => void` that `SideView` gives from its `documentsIn`); *Loose citations* and *Languages* are reached through the document pane and Document properties. The project's own element has the menu too (its heading in the text and its node in the diagram), without *Delete*, as today.
- **Number these lines…**: in `MapText.svelte`'s `menuFor(id, section)` where the right click is in a paragraph of the text (the target within `.prose p` or a line), an item `editor-numbers-lines` calling the editor's `askNumbers` hook for that paragraph or the selection (`hooksOf.get(view)`); the `#` menu of the bar is gone with 3.2. `editor-numbers`, `editor-numbers-hint`, `editor-numbers-page*` go where unused (the page's numbering is in Document properties, stage 2).

### 3.5 The marks of whitespace and the hard space — `schema.ts`, `commands.ts`, `keys.ts`, `app.css`, `WritingTools.svelte`, `sides.svelte.ts`

- The toggle **Show marks** (`editor-marks-shown` = *Marks of whitespace*, nb *Tegn for mellomrom og avsnitt*; `data-whitespace`, icon `Pilcrow`), lit while `sides.marks`, kept in the arrangement; `breakSigns` of the settings goes. The root carries `data-marks="on|off"` as it carried `data-break-signs`.
- CSS, on `[data-marks='on']`: `.prose p::after` a faint ¶ (not in names, captions or cells: scope to the text's body paragraphs); `.hard-break::before` the ↵ as today; `.hard-space` a faint ring (`content: '°'` over the space, or a dotted underline, whichever reads better; try both and keep one). Printing and export show nothing of these.
- **The hard space**: a mark `hardSpace` in the schema on the character U+00A0, or a leaf node where the editor cannot keep a mark on one character reliably (say which in the report); the command `insertHardSpace` on Ctrl+Shift+Space (`writing-hard-space`, place `writing`); the character goes out as U+00A0 into HTML, Word, Typst, LaTeX and the Org form (`org/write.ts`, `inline.ts`: the character as it is, since Org reads it); pasting keeps a U+00A0 that comes in (`util/paste.ts`, `editor/clipboard.ts`) and marks it. Search treats it as a space. Tested in `schema.test.ts` or `commands.test.ts`.

### 3.6 Share and the images — `project-actions.svelte.ts`, `ProjectView.svelte`, `locales`

- `items(p, place)` gains **Share…** (`home-share`, nb *Del…*) after *Save as Org…*, through `place.share?: (project: string) => void`: `ProjectView` gives it: where a side shows the project, the sharing window opens for that side's sharing; else `sides.open(p.id)` and the window opens once the side's project is open. `SharePanel` is given the side's `ProjectSharing`. The `share` key entry goes.
- *Picture* becomes *Image* where the user sees it: `shell-pictures` *Images*, `project-pictures` *Images*, the words of `pictures.ftl`, `figures.ftl`, `editor.ftl`, `ocr.ftl`, `core-pictures.ftl`, `project.ftl`, `keys.ftl` that say *picture* or *the store of pictures* (en; nb says *bilde* already, check *bildelager* → *bildene*); the code's names stay; `grep -rn -i "picture" locales/en` and read each.

### 3.7 The harness and the scripts

- `e2e/harness.mjs`: `app.view(name)` clicks `[data-bar] [data-view="<name>"]` in the active side's bar; `app.thisElement(item)` opens the element in view's context menu (in the text, a right click on the heading of the element in view; in the diagram, on the root node) and clicks the item; `openThisMap`, `thisMap`, `newMap` go; `app.insert(item)` opens the Insert menu and clicks; `app.marks(item)`, `app.paragraphKind(item)`, `app.wordsKind(item)`.
- The scripts: `grep -ln "header \[role=\"radio\"\]" e2e/*.mjs` lists 46; replace `app.clickText('header [role="radio"]', 'Diagram')` and the like by `app.view('diagram')`, and read the rest by hand (those that read `aria-checked`, those that use `.tools button[aria-label="Italic"]`, "Words", "Cite", "Note", "Comment", "Insert", "New element", `data-side-by-side`). Run every script you changed.

Verify: `pnpm check`, `pnpm test`, the scripts changed. Commit after 3.2, 3.3, 3.5 and at the end.

## Stage 4 — the dropdown of the path

- `Path.svelte`: the chevron opens a `Popover` (`src/lib/ui/Popover.svelte`) holding `ProjectList` in `choose` mode, `data-path-tree`, with the field focused; `ProjectList` gains `choose` options: `unavailable?: readonly string[]` (what cannot be chosen; the chooser of a project beside passes the active project, the dropdown nothing) and `revealAt?: { project: string; element: string }` (unfolds the folders and the tree to that element and marks it, reading a closed project's tree as it does). Choosing a project: `sides.open(id)` in this side; an element: `sides.open(id, at)` or `sides.show(key, at)` where it is this side's project.
- `projects-menu.ts` and its test go where nothing else uses them; a folder's crumb opens the same tree, unfolded at that folder.
- `e2e/path.mjs`: the dropdown shows the tree unfolded to the current element with it marked; an element of another project chosen opens there in this side, the other side unchanged.

Verify: `pnpm check`, `pnpm test`, `path`, `list`, `maps`. Commit.

## Stage 5 — the whole

- `docs/guide.md`: *The text* (the three menus and Insert), *Notes*, *Citations* and *Comments* (from Insert), *Lines and paragraphs* (the hard space, the marks), *Reference marks* → *Inline numbers*, *Line numbers* (Document properties and the right-click menu), *Pictures* → *Images*, *The panel at the side* → *The document pane*, *The preview, and the manuscript* → *Typesetting*, *The look of a document* (in the typesetting pane; the Document type button), *About this document* → *Document properties*, *Working together* (Share… in the list; the presence sign), *One tree, entered anywhere* (the bars, no ⋯, the tree dropdown, the switch button), *Keys*. Read it through for *preview*, *panel at the side*, *About this document*, *What this document is*, *picture*, *Side by side*, *Words menu*, *This element*.
- `e2e/languages.mjs` in Norwegian: no English left.
- The record gains its addendum, *As built*.
- The full run of every script with `timeout 420` each, `cargo test --workspace` and `cargo clippy` where Rust changed, and the counts.

## Report

At the end, in plain words for the owner, who does not know the records by number: what a side is now and what the window keeps; the two panes and how each is opened; the bars, as one line per bar; the menus, as one short table; the keys that changed; what departs from the plan and why; what is left; the counts.
