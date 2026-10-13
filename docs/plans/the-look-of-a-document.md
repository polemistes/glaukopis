# Build plan: the look of a document, in one place

The working plan for `docs/adr/0042-the-look-of-a-document.md`. Read the record first, in full: it says what; this says how, in which order, in which files, with which interfaces, and how each step is verified. Where they disagree, the record wins; say so in your report. Read also `docs/plans/the-shape-of-a-text-and-its-org-form.md`, section "How to work", which holds here too (plain words; never a record number when talking to the owner; verify before you commit; edit then format; e2e with `timeout`, processes ended by PID only; commit when a step is whole, never push; report the counts).

## Vocabulary

- *Layout*: a `DocumentFormat` as a file (`resources/formats/*.json`, the writer's own in the data directory), read by `documents.format(id)` in `src/lib/preview/documents.svelte.ts`.
- *Changes*: `DocumentSettings.look`, what a document sets otherwise than its layout.
- *Effective layout*: the layout with the changes laid over it; what everything is made with.
- *Look*: the panel.

## What exists, and what each piece becomes

| Today | Becomes |
| --- | --- |
| `src/lib/preview/FormatEditor.svelte` (the layout window: sections, rows, sample, save as own, delete) | `src/lib/look/LookPanel.svelte`; the window is deleted |
| `src/lib/preview/format-editor.svelte.ts` (`formatEditorUi`, `lookRows`, `lookWords`, `resolvedWords`, `lengthsOk`, `setKindLook`, `unsaid`) | `src/lib/look/rows.svelte.ts` (the row helpers, moved) and `src/lib/look/look.svelte.ts` (`lookUi`); `formatEditorUi` is deleted |
| `DocumentSettingsWindow.svelte`, part "Layout and citations" (choosing the layout and the style, `editLayout`, the style editor) | the choosing moves to Look's top line; the part becomes a line and a button; the `StyleEditor` is hosted by Look |
| `WritingTools.svelte` `changeFormat()` and the kind menu's foot "Change the layout…" | `lookUi.open({ …, section: 'kinds', kind })` under "How <kind>s look…" |
| `PreviewPanel.svelte` button `.in-use` (template · layout · style) → document settings | → Look |
| `ProjectView.svelte` host of `<FormatEditor>` and `sampleOf` | gone; Look is a side panel kind |

## Step 1 — the changes of a document

### 1.1 Types — `src/lib/project/model/types.ts`, `src/lib/api/documents.ts`

```ts
// types.ts
import type { LookChanges } from '$lib/look/changes';
export interface DocumentSettings { …; lineNumbers?: boolean; look?: LookChanges }
```

`src/lib/look/changes.ts` (pure; no `$lib/i18n`, no `.svelte.ts`; usable from the Org module and the search thread):

```ts
import type { DocumentFormat } from '$lib/api/documents';
/** The look fields of a layout: everything but what names and describes it, what it brings (`style`, `suggests`) and `lineNumbers`, which the document sets by a setting of its own. */
export type LookFields = Omit<DocumentFormat, 'id' | 'name' | 'kind' | 'description' | 'source' | 'basedOn' | 'style' | 'suggests' | 'lineNumbers'>;
/** The values a document sets otherwise than its layout, each present only where set; a list is taken whole. */
export type LookChanges = DeepPartial<LookFields>;   // write DeepPartial here: objects recursively partial, arrays as they are
/** A path into a layout, dotted: `font.family`, `page.marginTop`, `headings.levels`, `kinds.quote.italic`. */
export type LookPath = string;
export function pathsOf(changes: LookChanges): LookPath[];          // every leaf path set (a list counts as one path)
export function getAt(target: unknown, path: LookPath): unknown;
export function setAt<T extends object>(target: T, path: LookPath, value: unknown): void;   // makes the objects on the way
export function withoutPath(changes: LookChanges, path: LookPath): LookChanges;              // removes a leaf and empty objects above it
export function laidOver(layout: DocumentFormat, changes: LookChanges): DocumentFormat;      // a deep copy of the layout with the changes over it; lists replaced whole
export function changesBetween(layout: DocumentFormat, effective: DocumentFormat): LookChanges; // every leaf (list whole) where `effective` differs from `layout`, as JSON compares them
export function countOf(changes: LookChanges): number;                                      // pathsOf(changes).length
```

`src/lib/ui/settings/rows.ts` already has `read(target, path)` and `write(target, path, value)` for one dotted path, and imports nothing: `getAt`/`setAt` may be those, imported, rather than written again.

Tests in `src/lib/look/changes.test.ts`: round trip `laidOver`/`changesBetween`; lists whole; `withoutPath` prunes; paths of nested kinds.

### 1.2 Inheritance — `src/lib/project/model/project.svelte.ts`

Beside `documentOf(id)` (which merges settings key by key and says `from` per key — `look` as a whole would be wrong), add:

```ts
/** The changes of an element's document: those of the elements over it laid over by its own, path by path, and which element set each path. */
lookOf(id: string): { changes: LookChanges; from: Map<LookPath, string> }
```

Walk `pathTo(id)` from the top; for each element's `document.look`, `setAt` every `pathsOf` into the result and record the element in `from`. Test in `project.test.ts`: a book sets `font.family`, a chapter sets `font.size`; the chapter's `lookOf` has both, `from` names each.

`setDocument(id, { look })` already stores any key; `clean()` in `changing/elements.ts` (line ~125) drops `undefined`, `null`, `''` and empty lists — make it drop an empty object too, so that a `look` with every change taken back leaves nothing behind.

### 1.3 The effective layout, everywhere — `src/lib/preview/documents.svelte.ts`

```ts
/** The layout of an element's document as it is to be used: the chosen layout with the document's changes laid over it. */
async formatFor(project: Project, at: string): Promise<DocumentFormat>
/** The same, as read already; nothing until the layout has arrived. Reactive in the changes. */
formatForCached(project: Project, at: string): DocumentFormat | undefined
```

Both: `choice = this.choice(project.documentOf(at).settings, project)`, the layout by `format`/`formatCached`, then `laidOver(layout, project.lookOf(at).changes)`; `formatFor` returns a plain object (`$state.snapshot` where needed). Replace the readers of the layout:

- `src/lib/preview/PreviewPanel.svelte` line ~296 (`refresh`): `const f = await documents.formatFor(project, at)`; the `from` string that decides whether to make anew must include the changes (`JSON.stringify(f)` is already in it — keep).
- `src/lib/preview/documents.svelte.ts` `documentRequest` (export, the sample): `formatFor`.
- `src/lib/editor/WritingTools.svelte` ~line 164 (`format` for the kinds' names and suggestions): `formatForCached(project, at ?? element)`.
- `src/lib/editor/RichText.svelte` ~line 153 (the numbers' layout): `formatForCached(project, at)?.verse`.
- Remove the special case of `lineNumbers` in `PreviewPanel.svelte` and `documentRequest` (the switch in the Numbers menu writes `DocumentSettings.lineNumbers`): keep that setting as it is, and apply it after `laidOver` in `formatFor`, so that it keeps working; do not move it into `look`.

The core already sanitises the layout of every request (`format.sanitise()` in `src-tauri/src/commands/documents.rs`: `format_kind_looks` line ~103, `document_preview` ~306, `document_export` ~366), so a layout with changes laid over it needs nothing in Rust. Nothing in the core changes in this work.

### 1.4 The Org form — `src/lib/org/properties.ts`, `of-project.ts`, `fixtures.ts`, `org.test.ts`

`LOOK` in the element's drawer: `JSON.stringify(document.look)` where set; read back with `jsonOf`. The fixture's book element gets changes; the round-trip test covers it.

Verify step 1: `pnpm check`, `pnpm test`, `cargo test -p glaukopis-core`. Commit.

## Step 2 — the Look panel

### 2.1 The panel's state — `src/lib/look/look.svelte.ts`

```ts
export interface LookRequest { section?: LookSection; kind?: string }
export type LookSection = 'type' | 'page' | 'paragraphs' | 'headings' | 'kinds' | 'numbers' | 'notes' | 'bibliography' | 'figures' | 'title' | 'citations' | 'about';
class LookUi {
  /** Rises when the panel is asked for; the view of the project opens it. */
  asked = $state(0);
  request = $state.raw<LookRequest>({});
  open(request: LookRequest = {}) { this.request = request; this.asked++; }
}
export const lookUi = new LookUi();
```

`src/lib/project/SideTabs.svelte`: `SideKind` gains `'look'`; the list of tabs gets `{ kind: 'look', label: t('look-title'), icon: Palette (from '@lucide/svelte/icons/palette'), shortcut: 'Ctrl+Shift+A' }`, first, before the references. `src/lib/project/ProjectView.svelte`: an effect on `lookUi.asked` calls `side('look', true)`; the side panel renders `<LookPanel project={project} at={ownPane.at} passageKinds={project.passageKinds} request={lookUi.request} onpreview={showPreview} />` where the other side kinds are rendered (~line 1400–1470); the `shortcuts.bind` (~line 960) gains `'side-look': () => side('look')` and `'look-type': () => lookUi.open({ section: 'type' })`. `src/lib/shell/keys.svelte.ts`: `{ id: 'side-look', keys: 'Ctrl+Shift+A', place: 'project', bound: true }` beside the other `side-*` entries (Ctrl+Shift+K is small capitals in the text; A, as in appearance, is free: check with `grep "Ctrl+Shift+A" src/lib/shell/keys.svelte.ts` before taking it) and `{ id: 'look-type', keys: '', place: 'project', bound: true }` for the palette's *Change the font…*. Words `keys-side-look = Look` and `keys-look-type = Change the font…` in `locales/en|nb/keys.ftl`.

### 2.2 The panel — `src/lib/look/LookPanel.svelte`

Props: `project: Project`, `at: string`, `passageKinds: PassageKindRecord[]`, `request: LookRequest`.

State:
- `choice = documents.choice(project.documentOf(at).settings, project)`; `layout = documents.formatCached(choice.format)`; `inherited = project.lookOf(at)`.
- `effective = $state<DocumentFormat>` — `laidOver(layout, inherited.changes)`, made anew whenever the layout or the changes change *from outside* (another element's edit, undo): compare by JSON and replace only when different, so that the rows' fields are not reset under the writer's hands.
- The rows edit `effective` through `Settings.svelte` as the window did. After each change (debounced 250 ms for text and lengths, at once for choices and toggles): `const mine = changesBetween(layout, effective)`; keep only the paths that are not inherited from above with the same value (a path whose value equals an ancestor's change is not this element's); then `project.checkpoint(); project.setDocument(at, { look: Object.keys(mine).length ? mine : undefined }); project.checkpoint();` — one step of undo per change.
- `resolved = formatKindLooks(effective, own)` 150 ms after each change, as the window did, for the kinds' "as it will stand" lines.

The top line: `templateName → layoutName · N changes → styleName`:
- the template: a button → `documentSettingsUi.open({ project, at, section: 'template' })`;
- the layout: a `<select>` of the layouts grouped as `DocumentSettingsWindow.svelte` groups them (move `formatGroups` and `layoutName` into `src/lib/look/choosing.ts`); choosing writes `{ format }` on the element that sets it now (`documentOf(at).from.get('format') ?? at`), as the window did; "· N changes" = `countOf(inherited.changes)`, with a hint listing the paths' labels on hover;
- the citations: the style `<select>` as the window has it (move `styleGroups`, `styleName`, the "…" item that opens `StyleBrowser`), and *Change this reference style…* that hosts `StyleEditor` as the window did.
Each of the three has a one-sentence hint under it (`look-template-hint`, `look-layout-hint`, `look-citations-hint`).

The search field: `TextField` at the top; while it holds words, the panel shows every row of every section whose label or hint contains them (case-insensitive, by `languages.current`'s locale compare), under its section's heading; empty, the sections.

The sections, as a row of chips that wrap (`nav` of buttons, as the window had, but wrapping): `type`, `page`, `paragraphs`, `headings`, `kinds`, `numbers`, `notes`, `bibliography`, `figures`, `title`, `citations`, `about` — the window's `page`, `type`, `paragraphs`, `headings`, `title`, `quotations` (fold into `kinds` as the row of `quote`, or keep as a section if the rows do not fit), `kinds`, `numbers`, `notes`, `bibliography`, `figures`, `margins` (fold into `page`), `about`. Move the row builders from `FormatEditor.svelte` into `src/lib/look/rows.svelte.ts` (they read `t()`, so `.svelte.ts` is fine) with `lookRows`, `lookWords`, `resolvedWords`, `lengthsOk`, `setKindLook`, `unsaid` from `format-editor.svelte.ts`. The kinds section lists every kind as the window does (`details[data-kind]`, the `data-said`/`p.resolved` marks kept, since `e2e/runs.mjs` reads them), but the ones this document uses first: the `kind` of every paragraph in `project.blocksOf(id)` for `at` and every element under it (`viewOf`/`buildTree` of `src/lib/project/model/tree.ts` give the subtree), gathered when the panel opens and when `project.nodes` changes, not per keystroke; then the rest by group; then the writer's own.

**Where it comes from**: `src/lib/ui/settings/rows.ts` — every setting row may carry `path?: string`; `Settings.svelte` takes a new prop `from?: (path: string) => { words: string; reset?: () => void } | null` and, under a row that has a path and for which `from` gives something, renders `<small class="from">{words}{#if reset} · <button>{t('look-take-again', { layout })}</button>{/if}</small>`. Give the rows their paths: the ones by `at:` have them already (`row.at`); the rows made with `get`/`set` (kinds via `lookRows`, headings' levels, captions) are given `path` explicitly (`kinds.quote.italic`, `headings.levels`, `figures.caption`). In the panel: `from(path)` = `inherited.from.get(path)` → not set: `{ words: t('look-from-layout', { layout }) }`; set by `at`: `{ words: t('look-changed-here'), reset }`; set by another element X: `{ words: t('look-changed-in', { name }), reset }` — `reset` removes the path from the element that set it: `project.setDocument(X, { look: withoutPath(lookOfX, path) })`. For a path not in `inherited.from` but different from the layout (should not happen), say nothing.

The foot: *Keep these changes as a layout of my own…* (enabled when `countOf(inherited.changes) > 0`): a small dialog asks a name (as `FormatEditor` asked in its header), then `formatsSave({ ...effective, id: '', name, basedOn: layout.id })` as `FormatEditor.save` did (`documents.forgetFormat`, `reload`, `notifyOk`), then `setDocument` on the element that sets `format` with `{ format: saved.id }` and, on every element of `pathTo(at)` that holds `look`, `{ look: undefined }`. Where the layout is the writer's own (`documents.formatSummary(id)?.own` or however `FormatEditor` told `own`): *Put these changes into <name>* saves the effective layout under the same id, then clears the changes the same way. In `about`: the description (editable for an own layout, saved with *Put these changes into*), the source as the window showed it, and for an own layout *Delete this layout of mine…* with the confirm and the fallback to `basedOn ?? 'manuscript'` as `FormatEditor.remove` did.

When the preview is closed, a line at the top of the panel: *Open the preview to see the changes* with a button (`showPreview` through a callback prop `onpreview`).

### 2.3 The doors

- `src/lib/preview/PreviewPanel.svelte`: the `.in-use` button opens Look (`lookUi.open()`); its label stays; the settings icon keeps opening the document settings window.
- `src/lib/editor/WritingTools.svelte`: `changeFormat()` (~line 538) → `lookUi.open({ section: 'kinds', kind })`, the `formatEditorUi` import (line 69) gone; the foot of the kind menu: the heading `editor-kinds-set-by` stays ("Set as “Manuscript” has them"), the item `editor-kinds-change-format` ("Change the layout…") becomes `editor-kinds-change-look = How “{ $kind }” looks…` with `{ kind: nameOf(kind) }` (nb: `Hvordan «{ $kind }» ser ut…`), its hint `editor-kinds-change-look-hint = Its look in this document, and the rest of the page`, icon `palette`.
- `src/lib/document/DocumentSettingsWindow.svelte` (~line 680–740): the part `layout` → `look`: a hint line (`document-window-look-hint = How the page looks, and how it cites, are set in Look, the panel beside the preview.`) and a button `document-window-look-open = Open Look` (`lookUi.open()` then `onclose()`); the template part's lines "Layout: … · Reference style: …" (`document-window-from-with`) stay, as information. Remove `editLayout` (~355), the layout and style selects (`formatGroups`, `styleGroups`, ~333–350, moved to `src/lib/look/choosing.ts`) and the hosted `StyleBrowser`/`StyleEditor` (~822–840, moved to the panel); `src/lib/document/document-settings.svelte.ts`: `DocumentSection` `'layout'` → `'look'` in the type and in `DOCUMENT_SECTIONS`; `document-window-section-layout` → `document-window-section-look = Look`; `document-window-layout*` and `document-window-style*` keys that nothing uses any more are pruned. Whoever opens the window at `'layout'` (`grep -rn "section: 'layout'" src`): the Numbers menu of `WritingTools` for the lines of the page opens Look at `page` instead.
- `src/lib/project/ProjectView.svelte`: remove the `<FormatEditor>` host, `sampleOf`, `formatEditorUi`; `src/lib/preview/FormatEditor.svelte` and `format-editor.svelte.ts` deleted (the helpers having moved), `format-editor.test.ts` moved to `src/lib/look/rows.test.ts`.
- `src/lib/settings/SettingsView.svelte`: the usual layout chooser stays.

### 2.4 Words and guide

`locales/en/look.ftl` and `locales/nb/look.ftl` (new): the panel's name, the sections, the three hints, *from*, *changed here*, *changed in*, *take again*, *keep as a layout*, *put these changes into*, *delete this layout*, *open the preview*, the search field. Move the words of the sections and rows from `format.ftl` where they are reused (keep their keys); remove `format-save-own`, `format-leave-*`, `format-sections`, `format-sample-*` and the rest of the window's own words; `node scripts/prune-locales.mjs`, `node scripts/check-locales.mjs` clean for en and nb. `docs/guide.md`: "The preview, and the manuscript" and "The document settings" rewritten: Look, the line at its top, where a value comes from, keeping as a layout; "Kinds of paragraph and of words": the foot of the kind menu.

### 2.5 e2e

- `e2e/harness.mjs` (~line 546–600, the helpers of the document settings): add, in the same style, `openLook(section?)` (Ctrl+Shift+A, waits for `.side .look`, then clicks the section's chip by its words), `lookSection(name)`, `lookChoose(label, value)` and `lookChosen(label)` (as `documentChoose`/`documentChosen`, finding the row in `.side .look label.row` — the top line's layout and style choosers are `label.row`s too, labelled "Layout" and "Reference style"), `lookRow(label)` giving a row's element for a script to set its field; mend the comment of `documentSection`, whose parts no longer include "Layout and citations".
- New `e2e/look.mjs`: a project with a text and a quotation; open the preview; the `.in-use` button opens Look (`.side .look`); the top line names the template, the layout and the citations; the search field with "font" shows the font row alone; choose Garamond; the from-line of the row reads "changed here" and the top line "· 1 change"; the preview's Typst (`document.typ` found under `app.dataDir`, as `e2e/line-numbers.mjs` line ~325 finds it) names Garamond; *Take Manuscript's again* removes it, the top line says no changes; from the kind menu's foot "How “Quotation” looks…" opens Look at the quotation's row (`details[data-kind="quote"]` open); set italic there; keep as a layout "Mine": `formats/mine.json` in the data dir has `quote.italic`, the top line names Mine with no changes, the `.in-use .names` of the preview includes Mine; a child element's Look shows a change of the parent as "changed in <parent>"; the document settings window's Look part has the button; the palette's "Change the font…" opens Look at type. Screenshots `look-1-panel`, `look-2-from`, `look-3-kinds`, `look-4-kept`.
- `e2e/editors.mjs`: lines ~50–130 (the layout, reached from the document settings and the layout window) → Look: the spacing, the figures' label and placement and "about here" are set in the panel's rows (`.side .look .form`), then *Keep these changes as a layout of my own…* with the name "My publisher"; the checks of `formats/my-publisher.json` and of the preview's Typst stay; `editorGone()` becomes "no `dialog[open]`" (the panel is not a dialog); the reference style editor (~130–215) is reached by Look's *Change this reference style…* and its result read with `lookChosen('Reference style')`.
- `e2e/runs.mjs` lines ~305–363: the menu item "How “Line of verse” looks…" (or the kind at the cursor) opens Look at kinds; "a part for the numbers" is a chip; `details[data-kind="scene"]` in `.side .look`; the columns rows found in `.side .look label.row`; no "Save as my own" (the changes stay as the document's — check the top line says "· 1 change" after the columns), and the preview part that follows still passes with the columns as changes.
- `e2e/preview.mjs` lines ~199–232: the `.in-use` button now opens Look, so the template is chosen after `app.openDocumentSettings()` (by its key); "the layouts are offered by kind" reads the optgroups of Look's layout chooser; `documentChoose('Layout', 'novel-book')` → `lookChoose`; lines ~315–320 likewise. `e2e/templates.mjs` (the template editor, lines ~44–47, ~108, ~300–326) should pass unchanged; `e2e/settings.mjs`: check.
- Then `pnpm e2e` (build first with `pnpm e2e:build`; `cargo build -p glaukopis-server` for the sharing scripts).

Verify step 2: `pnpm check` 0 errors, `pnpm test`, `cargo test -p glaukopis-core`, `pnpm e2e` all green, and a look by hand at `e2e/output/look-*.png`: the panel's rows, the from-lines, the top line. Commit.

## Report

What was built with file paths; the DOM of the panel (classes, data attributes); what was left or doubtful; every departure from the record; the counts, verbatim. Do not bump the Arch package or push.
