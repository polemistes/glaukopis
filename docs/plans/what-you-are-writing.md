# Build plan: what you are writing, and the doors to how it looks

The working plan for `docs/adr/0054-what-you-are-writing-and-the-doors-to-how-it-looks.md`. Read the record first, in full: it says what; this says how, in which order, in which files, with which interfaces, and how each stage is verified. Where they disagree, the record wins; say so in your report. Read also `docs/plans/the-shape-of-a-text-and-its-org-form.md`, section "How to work", which holds here too, and `docs/plans/the-look-of-a-document.md`, which built the panel this plan reorders: its vocabulary and its DOM are the starting point.

## How to work, tonight

The owner is asleep and will read the result in the morning. Nobody answers questions. Where this plan leaves a choice open, choose the plainer thing, write the choice down in your report, and go on.

- **Plain words**, as the code around you: comments, commit messages, the guide, the words of the interface. Never a record number when writing for the owner.
- **Stages end in commits.** A stage is committed when its checks pass, without asking; never push; never start the Installers workflow or make a tag. End every commit message with the attribution line the session gives you. Do not touch other projects or folders outside this repository.
- **Checks**: `pnpm check`, `pnpm test`, `cargo test -p glaukopis-core`, `cargo test -p glaukopis contract` (writes `src/lib/api/contract.generated.ts`; run after any change of a core type the interface sees), `node scripts/check-templates.mjs`. Paste the counts into your report.
- **Edit, then format**: `pnpm exec prettier --write <files under src>`; `cargo fmt -p glaukopis-core` (it may reformat `crates/core/build.rs`; put that back with `git checkout crates/core/build.rs`). The scripts in `e2e/` are not formatted by prettier.
- **e2e**: `pnpm e2e:build`, then one script at a time, `timeout 400 node e2e/<name>.mjs > /tmp/<name>.log 2>&1`, and read the log and the screenshots in `e2e/output/`. A hang is a loop in the page: end your own processes by PID (`ps -eo pid,comm | grep -E 'Xvfb|WebKitWebDriver|glaukopis'`), never `pkill -f`. Nothing touches the owner's desktop; never drive the owner's own windows.
- **Agents**: the stages that touch different files run in worktree agents at the same time (below). Every agent commits in its worktree when a step is whole, and at least once an hour, so that nothing is lost to a disconnect; an agent is never stopped with uncommitted work. The main session merges the worktrees into `main` and resolves what conflicts.
- **The editor's extension host** on this computer grows by the minute; it may be killed before a long build.
- **Report** at the end: what was built, with paths; the DOM of the new doors (classes and data attributes, for the scripts that come later); what was left or doubtful; every departure from the record; the counts, verbatim.

## Vocabulary

- *What the document is*: the template, as the interface names it to the writer. In code the word stays `template`.
- *The chooser*: the dialog "What are you writing?" (`TemplateChooser.svelte`).
- *About*: the window "About this document" (`AboutDocumentWindow.svelte`), formerly the document settings.
- *The first rows*: the handful of rows at the top of Look.
- *Composition*: `DocumentSettings.composition`, what a document sets otherwise than its template: parts on or off, requirements.
- *Template used*: the template with the composition laid over it; what everything is made with (`templateUsed`).
- *Spot*: a stretch of a page and what it is, as the core tells the preview (`Preview.spots`).
- *Chip*: the small button at the edge of a page that names what a line is.

## The shape of the night

Six stages. Stages 0 to 3 and 6 are the main session's, in order, since they all touch `LookPanel.svelte`, `PreviewPanel.svelte` and the window. Stages 4 and 5 touch other files and run in two worktree agents from the start.

| Who | Stages | Touches |
| --- | --- | --- |
| Main session | 0 catalogue → 1 chooser and header → 2 Look in order → 3 About → merges → 6 words, guide, e2e, cleanup | `resources/templates`, `resources/formats`, `src/lib/document/*`, `src/lib/look/LookPanel.svelte`, `look.svelte.ts`, `src/lib/preview/PreviewPanel.svelte` (header), `MapBar.svelte`, `ProjectView.svelte`, `locales/en`, `locales/nb`, `docs/guide.md`, `e2e/*` |
| Agent B (worktree) | 4 composition | `src/lib/document/composition.ts` (+ test), `src/lib/project/model/types.ts`, `project.svelte.ts` (+ test), `src/lib/org/properties.ts`, `fixtures.ts`, `org.test.ts`, `src/lib/preview/documents.svelte.ts` (`templateUsed`), `src/lib/look/ContentsSection.svelte` (new), `locales/en/look.ftl` (its own keys only, at the end of the file) |
| Agent C (worktree) | 5 spots | `crates/core/src/export/typeset.rs`, `export/mod.rs` (`Preview.spots`), `src/lib/api/documents.ts`, `contract.generated.ts`, `src/lib/preview/PreviewPanel.svelte` (the pages, the lines and the foot only, not the header), `src/lib/preview/spots.ts` (new, + test), `src/lib/state/settings.svelte.ts` (`pageChips`), `src/lib/settings/SettingsView.svelte` (one row), `locales/en/preview.ftl` and `settings.ftl` (its own keys, at the end) |

Order of merging: B after stage 2 (its section is mounted in Look, and stage 3 needs its *Make one*), C after stage 3. Then stage 6. If an agent is not done when the main session reaches its merge, the main session goes on with stage 3 and waits, rather than doing the agent's work twice.

Brief each agent with: the record, this plan, its stage's section, the "How to work" above, and the files it may touch. Tell each to commit in its worktree at every whole step.

If the night runs short, the order of what may be left is: the chips on the pages (stage 5's interface half), the requirements rows of the composition (stage 4), the Bokmål words. Everything else is the owner's complaint and is not left.

## What exists, and what each piece becomes

| Today | Becomes |
| --- | --- |
| `PreviewPanel.svelte` header: button `.in-use` "Template, layout, references / Plain document · Manuscript · Chicago…" → Look | button `.what` named for the template → the chooser; button `.look` → Look; the names of the layout and the style leave the header |
| `DocumentSettingsWindow.svelte`, tabs Template · Details · Parts · Look · Language · Checklist; `documentSettingsUi`; `DocumentSection` | `AboutDocumentWindow.svelte`, sections Details · Language · Checklist; `aboutDocumentUi` in `about-document.svelte.ts`; `AboutSection = 'details' \| 'language' \| 'checklist'` |
| The Template tab's list, search and "Change this template… / New template…" | `TemplateChooser.svelte` with `templateChooserUi` (`chooser.svelte.ts`): the plain document, the kinds of text, the second step for journals, publishers and style guides, "Make a template of my own from this…" |
| The Parts tab | Look's section *What the document contains* (`ContentsSection.svelte`, stage 4) |
| The Look tab ("Open Look") | gone |
| `LookPanel.svelte`: the line `.map` "Template → Layout · changes → Style", the three rows under it, chips that switch sections | the button `.what` and one line `.layout-line`; search; `.first` rows; chips `.chips` that scroll; sections `.part[data-part]` all rendered, in order; the layout's choosing and its changes at the foot |
| `LookSection`: type · page · paragraphs · headings · kinds · quotations · numbers · notes · bibliography · figures · title · about | page · type · paragraphs · headings · numbers · notes · figures · front · contents · layout |
| `MapBar.svelte` menu: "Document settings…", "Language…" | "What this document is…" → chooser; "About this document…" → About; "Language…" → About at language |
| `ProjectView.svelte` palette commands `document-settings`, `look-type` | the same, plus `what-document` (the chooser) |
| `resources/templates/paper.json` group `plain` | group `article` |
| `resources/formats/{novel-book,novel-manuscript,play-script,screenplay,poetry}.json` `style` | removed |

## Stage 0 — the catalogue (main session; small; first)

1. `resources/templates/paper.json`: `"group": "article"`. `resources/templates/plain.json`: description "Text with a title, for anything: what every document is until you say what you are writing. The title, the text, the notes and the bibliography." Run `node scripts/check-templates.mjs`; run `node scripts/templates-from-formats.mjs` and confirm it changes nothing (`git status`).
2. The five layouts named above lose their `style` field. Grep the core's tests and `check-templates.mjs` for anything that asserts those styles; mend the assertion, not the decision. A template that named no style and whose layout now names none falls back to the writer's usual, as `documents.choice()` already does.
3. `locales/en/template.ftl`: `template-group-plain = To begin with` (the chooser does not show this heading; the template editor's *Group* field still does). `locales/en/settings.ftl`: `settings-template = What new documents are`, `settings-document-format = How their pages look`, `settings-reference-style = How they cite`. The same in `locales/nb`.
4. `resources/templates/README.md`: the paragraph on the generic templates says where `paper` now stands and that the chooser shows the plain document alone at the top and the journals, publishers and style guides as a second step.

Verify: `node scripts/check-templates.mjs`; `cargo test -p glaukopis-core`; `pnpm test`. Commit.

## Stage 1 — what you are writing: the chooser, the header, the menu (main session)

### 1.1 The chooser — `src/lib/document/TemplateChooser.svelte`, `src/lib/document/chooser.svelte.ts`

```ts
// chooser.svelte.ts
export interface ChooserRequest { project: Project; at: string }
class TemplateChooserUi { request = $state.raw<ChooserRequest | null>(null); open(r: ChooserRequest) {…}; close() {…} }
export const templateChooserUi = new TemplateChooserUi();
```

Mounted once in `ProjectView.svelte`, beside the window (see how `documentSettingsUi.request` is mounted; do the same). Move the Template tab's code out of `DocumentSettingsWindow.svelte` into the chooser: the search, the groups, the radio list, `setTemplate` (written as its own step of undo, as now), the inherited line, `editTemplate(true)`. Delete what is not reused.

The dialog (`Dialog` from `$lib/ui`, width 720, `tall`): title `t('chooser-title')` "What are you writing?", subtitle the element's name. Body, in order:

1. `.search` input, placeholder "A kind of text, a journal, a publisher…" (`document-window-template-search-placeholder` moves to `chooser-search-placeholder`).
2. `.inherited` line where `project.documentOf(at).from.get('template')` is another element: "From *The book*: Novel" with a button "Choose for this element alone" that only reveals the list is live (the list is always live; the line just says where the value comes from), and where the element itself sets one, "Take it from *The book* again" / "Take your usual again" (`write({ template: undefined })`, as the tab has).
3. `.templates[role=radiogroup]`:
   - the writer's own (`group === 'own'`) under "Your own", first, where any;
   - the plain document (`id === 'plain'`), alone, under no heading, with its description;
   - then the groups `article`, `book`, `fiction`, `poetry`, `stage`, `other`, each under its `templateGroupWords`, each template a radio `.template > button.choose` with `.name` and `.description`, `aria-checked` on the one in use (`choice.template`), `data-template={id}`;
   - under the chosen one, `.about`: small print `t('chooser-brings', { layout, style })` "Pages as {layout}; cites in {style}" — where the template and its layout name no style: `t('chooser-brings-layout', { layout })` "Pages as {layout}"; where it names no layout either: `t('chooser-brings-usual')` "Your usual pages"; the source line as the tab shows it (name, url, read, confidence) stays under the chosen one.
   - `.submission`: a `details` element, summary `t('chooser-submission')` "Writing for a journal, a publisher or a style guide?", `data-step`. Open, it lists the groups `journal`, `publisher`, `style-guide` in the same radio form. Narrowed: when the template in use is a generic one, only those whose `basedOn` chain reaches it are listed (walk `basedOn` through `documents.templates`' summaries: `TemplateSummary` carries `basedOn`? if it does not, add it to the summary in the core (`templates/mod.rs`, the list) and the contract); the chain of `apa-7-professional` reaches `article`, of `mla-9` reaches `paper`, of `yale-university-press` reaches `book`. When the template in use is itself a submission template, the details is open and shows all three groups with it marked. When the search field holds anything, the details is open and every template that matches is listed, in its group, whatever is chosen. A line under the summary says what was narrowed to: "Those for an article. Search to find the rest."
4. Footer: `Button` "Make a template of my own from this…" (`editTemplate(true)`: opens `TemplateEditor` on the template in use, as *New template…* did), and "Close". Choosing writes at once, as the tab did; there is nothing to save.

The search: as the tab's `query` filter (name, description, group words, source name), over every template including the submission ones.

Words: new file `locales/en/chooser.ftl` (and `nb`): `chooser-title`, `chooser-search`, `chooser-search-placeholder`, `chooser-none-found`, `chooser-from`, `chooser-for-this`, `chooser-again`, `chooser-usual-again`, `chooser-brings`, `chooser-brings-layout`, `chooser-brings-usual`, `chooser-submission`, `chooser-submission-narrowed`, `chooser-submission-all`, `chooser-own-from`, `chooser-of-project`. Move the `document-window-template-*` keys the chooser reuses into it, and delete them from `document-window.ftl` in every language.

### 1.2 The header of the preview — `src/lib/preview/PreviewPanel.svelte`

Replace the `.in-use` button with:

```svelte
<button type="button" class="what" data-template={choice.template} title={t('preview-what-title')} aria-label={t('preview-what-label', { name })} onclick={() => templateChooserUi.open({ project, at })}>
  <span class="name truncate">{templateName(project, choice.template)}</span><ChevronDown size={13} />
</button>
<Button size="sm" class="look" onclick={() => lookUi.open()}>{#snippet icon()}<Palette size={13} />{/snippet}{t('look-title')}</Button>
```

(`Palette` from `@lucide/svelte/icons/palette`, or `Brush`; one icon, the same one the side tabs use for Look — look in `SideTabs.svelte` and reuse it.) The sliders button keeps its place and becomes "About this document…" (`aboutDocumentUi.open({ project, at })`, key `document-settings`). The `inUse` derived and `preview-made-by` go. The header's words: `preview-what-title = What you are writing: choose…`, `preview-what-label = What this document is: { $name }`. Keep the header to one line at the widths the e2e scripts use (1440 wide, the preview beside the text): shorten with `truncate` on the name, never wrap.

### 1.3 The menu and the palette — `src/lib/project/MapBar.svelte`, `src/lib/project/ProjectView.svelte`

- `MapBar.svelte`: the entry "Document settings…" becomes two: `t('chooser-menu')` "What this document is…" → `templateChooserUi.open({ project, at })`; `t('about-menu')` "About this document…" → `aboutDocumentUi.open({ project, at })` (until stage 3, `documentSettingsUi.open` with section `details`). "Language…" opens About at `language`.
- `ProjectView.svelte`: palette command `what-document` → the chooser on the focused pane's element, words `palette-what-document = What are you writing…`; `document-settings` keeps its id, its words become "About this document…" in `keys.ftl` and wherever its label is read.
- Look's two buttons that opened the window at `template` (lines ~1219 and ~1260 of `LookPanel.svelte`) open the chooser instead; stage 2 reshapes them.

### 1.4 e2e — `e2e/harness.mjs`, `e2e/templates.mjs`

Harness: `async chooseWhat(name)`: clicks `.preview header .what`, waits for `dialog[open] .templates`, clicks `.templates .choose` whose `.name` text is `name` (opening `[data-step]` first where the name is not in the list), waits until `.preview header .what .name` reads `name`, closes with the footer's Close. `async whatIs()`: the header's name. `templates.mjs`: every `openDocumentSettings('Template')`/`documentSection('Template')` becomes `chooseWhat`; the screenshots `templates-1-chooser`, `templates-2-search`, `templates-3-chosen` are of the chooser; add a check that the second step is narrowed under *Journal article* (the journals are listed, the publishers of books are not) and that the search finds "Yale" all the same.

Verify: `pnpm check`, `pnpm test`, `templates.mjs`, `preview.mjs` (its header checks), `look.mjs` (will break at the top line; mend what stage 2 does not change, leave the rest for stage 2). Commit.

## Stage 2 — Look in the order of the page (main session)

### 2.1 Sections — `src/lib/look/look.svelte.ts`

```ts
export type LookSection = 'page' | 'type' | 'paragraphs' | 'headings' | 'numbers' | 'notes' | 'figures' | 'front' | 'contents' | 'layout';
export const LOOK_SECTIONS: readonly LookSection[] = ['page', 'type', 'paragraphs', 'headings', 'numbers', 'notes', 'figures', 'front', 'contents', 'layout'];
export interface LookRequest {
  section?: LookSection;
  /** The kind whose look is opened and brought into view, under Paragraphs. */
  kind?: string;
  /** The level of heading whose rows are opened, under Headings. */
  level?: number;
  /** A subheading to bring into view: 'bibliography' under Notes and citations, 'quotations' under Paragraphs. */
  at?: string;
}
```

Every caller: `WritingTools.svelte` (`section: 'kinds'` → `'paragraphs'`), `ProjectView.svelte` (`look-type` stays `'type'`), the window (gone), the palette. Words: `look-section-*` keys renamed to the ten above (`look-section-page`, `-type`, `-paragraphs`, `-headings`, `-numbers`, `-notes = Notes and citations`, `-figures = Figures and tables`, `-front = Front page`, `-contents = What the document contains`, `-layout = The layout`); the old keys (`kinds`, `quotations`, `bibliography`, `title`, `about`) are removed from every language.

### 2.2 The panel — `src/lib/look/LookPanel.svelte`

Top to bottom, inside `.through.settings`:

1. `<section class="whole">`:
   - `<button class="what" data-template>` as the header's, naming the template, opening the chooser; under it `<small class="hint">` `t('look-what-hint')` "What you are writing decides the parts, the pages and the citations; change any of them below."
   - `<button class="link layout-line" data-layout data-changes={n}>` `t('look-layout-line', { layout, count })`: "Layout: Manuscript · 2 changes" / "Layout: Manuscript" (count 0); scrolls to `[data-part="layout"]`. The `.map` line, the list of changes and the three rows leave the top; the changes list and the layout and style choosers move to their sections.
2. The search (`label.search`), unchanged, moved up to here.
3. `<section class="first" data-first>`: the rows, each with its `from` line, reused by path (the same `Row` objects as the sections have; build them once and reference them from both places): `fontRow` (`font.family`), `font.size`, `text.lineSpacing`, `page.size`, `pageNumbers.show`, the row of `numbersRows` that says whether headings are numbered; and, when `citing` (below), the reference style row (2.3). No heading over them.
4. `<nav class="chips">`: one `button[data-section]` per section, in order; `onclick` scrolls `.part[data-part=section]` into view (`scrollIntoView({ block: 'start', behavior: 'smooth' })` inside the panel's scroller) and marks itself `.current`; an `IntersectionObserver` over the sections may move `.current` as the writer scrolls (optional; say in the report). Sticky at the top of the scroller (`position: sticky; top: 0`) with the panel's background.
5. The sections, all rendered, each `<section class="part" data-part={key}><h3>{sectionWords[key]}</h3>…</section>`:
   - **page**: `pageRows` (size, margins, columns, page numbers, running head: everything `pageRows` has today, and the page-number rows if they are in `numbersRows`).
   - **type**: `fontRow`, `typeRows`.
   - **paragraphs**: `paragraphRows`; `<h4 data-at="quotations">` Quotations: `quotationRows`; `<h4>` Kinds: the `kindGroups` as today (in use, then the catalogue's groups, then the writer's own), each kind a `details[data-kind]` as today; the hint on lengths.
   - **headings**: `headingRows`, the levels as today (`details.level`, `data-level={i + 1}`), add/remove, hint.
   - **numbers**: `numbersRows` less what moved to page.
   - **notes**: `noteRows`; `<h4 data-at="citations">` Citations: the reference style row (2.3) and `Change this reference style…` (hosting `StyleEditor` as today); `<h4 data-at="bibliography">` Bibliography: `bibliographyRows`.
   - **figures**: as today.
   - **front**: `titleRows`.
   - **contents**: until agent B is merged, the heading and a line `t('look-contents-soon')`? No: leave the section out of `LOOK_SECTIONS` until the merge, then add it with `<ContentsSection {project} {at} {ongo} />` (see stage 4 for its props). Never ship a section that says "soon".
   - **layout**: `<h4>` the layout's name; the layout chooser (`select`, `formatGroups()`, first option "From *The book*: Manuscript" / "As Novel brings: Novel, as a book" / "Your usual (Manuscript)", as the top rows had it); the list `.changed` of the document's changes with `take … again` (moved from the top); `Keep these changes as a layout of my own…` / `Put these changes into it`; `Delete this layout` for the writer's own; the description and source (`about` today); and last `Button` `t('about-open')` "About this document…" → `aboutDocumentUi.open({ project, at })`.

The search's `finds` view stays as it is (headings per section, rows that match, kinds that match), with the new section words.

`lookUi` requests: `section` scrolls to the part; `kind` opens and scrolls the kind's `details` (as today, now under paragraphs); `level` opens `details.level[data-level]`; `at` scrolls to `h4[data-at]`.

### 2.3 The reference style, one row — `LookPanel.svelte`

The row as it is today (`label.row` with `.what` "Reference style" and the `select` with `styleGroups()` and the `…` option that opens `StyleBrowser`), rendered by a snippet `styleRow()` used in two places: always under *Notes and citations*; and among the first rows when `citing`:

```ts
/** Whether the document cites: it holds a citation, or what it is or its layout brings a style. */
const citing = $derived(hasCitations(project, at) || Boolean(brought.style) || Boolean(layout?.style));
```

`hasCitations(project, at)`: a cheap walk of the element's tree for a citation node; look for what the preview or `buildDocument` already knows (`leanDocument`, `documentMark`, the references of a built document) and reuse it; where nothing cheap exists, derive it from `buildDocument(project, at).references.length > 0` behind `$derived.by` keyed on the project's change counter. Say in the report what you used.

### 2.4 Doors

- The side tab is unchanged. The preview's `.look` button (stage 1) → `lookUi.open()`.
- `WritingTools.svelte`: "How “Quotation” looks…" → `lookUi.open({ section: 'paragraphs', kind })`.
- Palette: `look-type` unchanged.

### 2.5 e2e — `e2e/harness.mjs`, `e2e/look.mjs`, `e2e/editors.mjs`, `e2e/found.mjs`, `e2e/runs.mjs`

Harness: `openLook(section)` waits for `.side .look .chips`; `lookSection(section)` clicks the chip and waits until `.part[data-part]` whose `h3` reads `section` is within the scroller's view (`getBoundingClientRect` against the scroller's); `lookMap()` becomes `lookTop()`: the text of `.whole` (name of the template and the layout line). Scripts: the checks of the top line read the layout line (`data-changes`); the style editor is opened from *Notes and citations*; `look-1-panel.png` and `look-3-kinds.png` are taken again. Grep every script for `lookSection(` and the old section names (`'Kinds'`, `'Quotations'`, `'Bibliography'`, `'Title and abstract'`, `'About the layout'`) and change them.

Verify: `pnpm check`, `pnpm test`, `look.mjs`, `editors.mjs`, `kinds.mjs`, `kinds-of-passage.mjs`, `found.mjs`, `runs.mjs`. Read `look-1-panel.png`: the panel must read, top to bottom, the template's name, the layout line, the search, six rows, the chips, *Page*. Commit.

Then merge agent B's worktree (stage 4), add `contents` to `LOOK_SECTIONS` and mount `ContentsSection`, run `pnpm check`, `pnpm test`, `look.mjs`, commit.

## Stage 3 — About this document (main session; after B is merged)

### 3.1 The window — `src/lib/document/AboutDocumentWindow.svelte`, `about-document.svelte.ts`

`git mv DocumentSettingsWindow.svelte AboutDocumentWindow.svelte`, `git mv document-settings.svelte.ts about-document.svelte.ts`. `AboutSection = 'details' | 'language' | 'checklist'`; `ABOUT_SECTIONS`; `aboutDocumentUi` with `open({ project, at, section? })`. Remove the Template, Parts and Look sections and their code (the template's loading stays where the checklist needs it: the checklist takes `templateUsed`, see 4.4). The nav keeps three buttons; the DOM classes `.window`, `nav`, `.form.settings`, `label.row > .what` stay, so that the harness's `documentChoose`/`documentChosen` still find the language chooser. Title `t('about-title')` "About this document", subtitle the element's name; the words `document-window-*` that remain are renamed `about-*` (one sweep, every language; keep the values). Footer Save/Cancel as today.

The checklist keeps its remarks and gains none: parts the template has a place for and their *Make one* live in Look's *What the document contains*.

### 3.2 Doors

`PreviewPanel.svelte` sliders button; `MapBar.svelte`; `ProjectView.svelte` key `document-settings` → `aboutDocumentUi.open(...)`; Look's foot. `keys.ftl`: the key's words "About this document…". Grep for `documentSettingsUi` and `DocumentSection` until none is left.

### 3.3 e2e

Harness: `openDocumentSettings(section)` → `openAbout(section)` waiting for `h2` "About this document"; `documentSection(section)` over the three; `closeDocumentSettings` → `closeAbout`. Scripts: `spelling.mjs`, `preview.mjs`, `look.mjs`, `templates.mjs` (its Parts and Checklist screenshots: `templates-4-parts` is now of Look's contents section, `templates-8-checklist` of About), `languages.mjs` if it uses the window, and any other that greps for the old names.

Verify: `pnpm check`, `pnpm test`, the scripts named. Commit.

## Stage 4 — what the document contains, and changes that belong to it (agent B, worktree)

### 4.1 The module — `src/lib/document/composition.ts` (pure: no `$lib/i18n`, nothing reactive)

```ts
import type { GeneratedPart, Template } from '$lib/api/templates';

/** What a document sets otherwise than its template, each present only where set. */
export interface CompositionChanges {
  /** The parts the core makes itself, turned on (true) or off (false), by id. */
  parts?: Partial<Record<GeneratedPart, boolean>>;
  /** What is required, set otherwise than the template; null takes a requirement away. */
  requirements?: { words?: number | null; abstractWords?: number | null; keywords?: number | null; anonymous?: boolean | null };
}
/** A path into the changes, dotted: `parts.contents`, `requirements.words`. */
export type CompositionPath = string;
export function compositionPaths(changes: CompositionChanges | undefined): CompositionPath[];
export function withoutCompositionPath(changes: CompositionChanges | undefined, path: CompositionPath): CompositionChanges;
/** A copy of the template with the changes laid over it: a part turned on is put into `contents` before the first part that comes later in GENERATED_PARTS (kind items are passed over), or at the end; a part turned off is taken out; `body` is never taken out; the requirements are set, null meaning none. */
export function composed(template: Template, changes: CompositionChanges | undefined): Template;
/** Whether the template as used has a generated part. */
export function hasPart(template: Template, part: GeneratedPart): boolean;
```

Reuse `getAt`/`setAt`/`pathsOf` from `src/lib/look/changes.ts` where they fit (they are pure). `GENERATED_PARTS` is in `src/lib/document/templates.ts`; if importing it pulls `$lib/i18n` into the pure module, move the constant into `src/lib/api/templates.ts` or a small `parts-order.ts` and import it from both.

Tests, `composition.test.ts`: a part turned on lands in order (contents turned on in an article goes between keywords and body; list-of-figures after contents); off removes; body stays; requirements null; `compositionPaths`; `withoutCompositionPath` prunes.

### 4.2 The model — `src/lib/project/model/types.ts`, `project.svelte.ts`, `changing/elements.ts`

`DocumentSettings.composition?: CompositionChanges` (the name is stored in projects and must not change). `Project.compositionOf(id): { changes: CompositionChanges; from: Map<CompositionPath, string> }`, written as `lookOf` is, path by path down `pathTo(id)`. `clean()` already drops an empty object. Test in `project.test.ts`: the book turns the table of contents off, the chapter turns the list of figures on; the chapter's `compositionOf` has both with their `from`.

### 4.3 The Org form — `src/lib/org/properties.ts`, `of-project.ts` (or wherever `LOOK` is read back), `fixtures.ts`, `org.test.ts`

`COMPOSITION`, one line of JSON, written where `LOOK` is written and read where it is read; a fixture with one; the round trip holds.

### 4.4 The template used — `src/lib/preview/documents.svelte.ts`

```ts
/** The template of an element's document as it is to be used: the template, with the document's changes laid over it. */
export async function templateUsed(project: Project, at: string): Promise<Template>;
/** The same, as read already: reactive in the changes; nothing until the template has arrived. */
export function templateUsedCached(project: Project, at: string): Template | undefined;
```

`documentRequest` sends `templateUsed`. Then every place that makes something of a template takes the template used: `PreviewPanel.svelte` (`templateFor` at its request, ~line 301; leave that one line to the main session: write the two functions and say in the report that the preview's request must call `templateUsed`; or do it yourself if the file is untouched in your worktree), the checklist's caller in the window, `ExportDialog.svelte` (the outputs), the kind menu's template kinds (`WritingTools.svelte`, where it lists the template's kinds; unchanged by composition, so it may keep `templateFor`).

### 4.5 The section — `src/lib/look/ContentsSection.svelte`

Props: `{ project: Project; at: string; ongo: (element: string) => void }`. Renders, inside Look's `.part[data-part="contents"]` (the main session mounts it; render only the body, with `h4`s):

1. `<h4>` "The parts of the document": one `label.row` per `GENERATED_PARTS` entry in order, `.what` its `generatedPartWords`, a checkbox `input[type=checkbox][data-part-switch={id}]` checked by `hasPart(templateUsed, id)`; `body` checked and disabled. A change writes `composition.parts[id]` on this element (`project.setDocument(at, { composition })`, one step of undo), and where the value equals what the template says, the path is removed instead (`withoutCompositionPath`), so that a change taken back leaves nothing. Under each row a `from` line as Look's rows have: "from Journal article" (the template), "changed here", "changed in *The book*" with `take Journal article's again`. Reuse the `Settings` component and its `from` prop if it fits; else render the rows by hand in the same classes (`label.row`, `.what`, `.from`).
2. `<h4>` "Elements with a place of their own": what the Parts tab showed (move it from `DocumentSettingsWindow.svelte`: `partOf`, the template's kinds, the elements under `at` of each kind, "None yet", "Only the first is used", `Make one` which makes a child element of that kind named in the language of the document, and a button per element that calls `ongo`). Words move from `document-window-parts-*` to `look-contents-*`.
3. `<h4>` "What is required": rows words, words of the abstract, keywords (numbers, nullable, blank "none"), anonymous (yes/no/as the template), each writing `composition.requirements.<key>`, with `from` lines. The template's `requirements.note` is shown under them when present, read-only.

Words in `locales/en/look.ftl`, keys `look-contents-*`, appended at the end of the file (the main session edits the same file above; keep to the end to merge cleanly). Bokmål in stage 6.

Verify: `pnpm check`, `pnpm test`, `cargo test -p glaukopis-core` (nothing of the core changes; run it all the same). Commit in the worktree at each of 4.1–4.5. Report the props of the section and what the main session must mount.

## Stage 5 — what stands where on the page (agent C, worktree)

### 5.1 The core — `crates/core/src/export/typeset.rs`, `export/mod.rs`

```rust
/// A stretch of a page and what stands in it, for the preview to say what a
/// line is and to open its look: the page, the first being 1, the top and
/// the bottom in points from the top of the page, and what it is.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Spot { pub page: u32, pub top: f32, pub bottom: f32, pub what: String }

/// What stands where on the pages …
pub fn spots(document: &PagedDocument) -> Vec<Spot>
```

`what`: `kind:<id>` for a block labelled `gk-kind-<id>`; `part:<id>` for `gk-part-<id>`; `front` for the block labelled `gk-front` (the title block the core writes, see `div("gk-front", …)` in `export/mod.rs`); `bibliography` for the block labelled `refs`; `heading:<level>` for a `HeadingElem`; `note` for a `FootnoteEntry`; `figure` for a `FigureElem`, `table` where the figure's body is a `TableElem`. The labels of kinds are what Pandoc writes from the divs' identifiers (`] <gk-kind-scene>` in the tests of `export/mod.rs`): confirm with one preview's `document.typ`.

How: walk each page's frame as `runs_in` does, with the same transforms, and take the `FrameItem::Tag` items (`typst::introspection::Tag::Start(content, ..)` and `Tag::End(location, ..)`; typst 0.15.1): a start opens a spot at its y for an element of one of the kinds above, the end with the same location closes it at its y; a spot still open at the end of a page closes at the page's height and a new one opens at the top of the next page where the element goes on. Where the tags do not give what is needed, fall back to `introspector.query` by label and element with `introspector.position()` for the tops and the next spot's top on the page as the bottom, and say so in the report. The heading's level: `HeadingElem`'s `level` when given, else `offset + depth`, as Typst resolves it. Add `pub spots: Vec<Spot>` to `Preview` and fill it in `preview_made` beside `places`.

Test beside `the_text_of_a_page_and_the_places_of_the_elements_are_found`: a Typst source with a paragraph, a `#block[…] <gk-kind-quote>`, a `= Heading`, a footnote and a `#block[…] <refs>`; assert the spots' order on page 1, that the quotation's bottom is above the heading's top, and that a plain paragraph is in no spot.

`cargo test -p glaukopis contract`; `src/lib/api/documents.ts` gains `Spot` and `Preview.spots`.

### 5.2 The lines — `src/lib/preview/spots.ts` (pure, + test), `PreviewPanel.svelte`

```ts
/** What a line is, by the spots of its page: the innermost spot whose top and bottom hold the line's baseline; `text` where none. */
export function whatIs(spots: Spot[], page: number, baseline: number): string;
/** Where Look opens for what a line is. */
export function lookFor(what: string): LookRequest;   // kind:ID → { section: 'paragraphs', kind: ID }; part:ID → { section: 'contents' }; heading:N → { section: 'headings', level: N }; note → { section: 'notes' }; bibliography → { section: 'notes', at: 'bibliography' }; figure | table → { section: 'figures' }; front → { section: 'front' }; text → { section: 'type' }
```

`PreviewPanel.svelte`: keep `spots` from the preview's answer (`$state.raw<Spot[]>`), give `linesOf` the page's spots and set `what` on each `Line` (by the first run's baseline, in points, before the percent conversion); render `data-what={line.what}` on `.line`. Only the pages' part of the file: the header is the main session's.

### 5.3 The chip — `PreviewPanel.svelte`, words

While `settings.value.pageChips` is on (5.4), on `pointerenter` of a `.line`, show one `button.chip` per page, absolutely placed at the line's top and at the page's right edge (outside the text block, inside the page; `right: 0; transform: translateX(…)` so that it does not cover text), reading the words of `what`; it stays while the pointer is on the line or on the chip, and goes a moment after. Press → `lookUi.open(lookFor(what))`. Words of `what` (`src/lib/preview/spots.ts` may take a `words` function from the panel to stay pure): `kind:ID` → the kind's name as `WritingTools.svelte`'s `nameOf` gives it (the catalogue's `specOf(id)?.label()` or the project's own kind's name); `part:ID` → `partOf(project, ID)`'s words; `heading:N` → `t('format-level', { number: N })`; `note` → `preview-what-note = Note`; `bibliography` → `preview-what-bibliography = Bibliography`; `figure` → `preview-what-figure = Figure`; `table` → `preview-what-table = Table`; `front` → `preview-what-front = Front page`; `text` → `preview-what-text = Text`. The chip's `aria-label`: `preview-what-open = How “{ $what }” looks…`. Keys appended at the end of `locales/en/preview.ftl`.

Selecting and copying text on the page must work as before: the chip is beside the lines, not over them, and no handler is added to the lines but `pointerenter`/`pointerleave`.

### 5.4 The switch — `src/lib/state/settings.svelte.ts`, `PreviewPanel.svelte`, `src/lib/settings/SettingsView.svelte`

The writer's settings gain `pageChips: boolean`, true by default, kept as the other settings are. Two places turn it:

- the foot of the preview (the bar with the pages, the words and the remarks): an `IconButton` `.chip-switch` with `aria-pressed={settings.value.pageChips}`, icon `Tag` (or `Tags`) from lucide, label `preview-chips = Name the lines of the page` and, pressed, `preview-chips-off = Stop naming the lines`; pressing it sets the setting;
- the settings view, in the section that holds the writer's usual template, layout and reference style: a toggle row `settings-page-chips = Name what a line of the preview is` with the hint `settings-page-chips-hint = When the pointer rests on a line of the preview, a chip at the edge of the page says what the line is (text, a quotation, a heading…) and opens Look at it.`

With the setting off, no chip is shown and no handler runs on the lines; `data-what` stays on them, so that the scripts and anything later can still read what a line is.

### 5.5 e2e — `e2e/what.mjs` (new), stage 6 merges it

In the Odyssey of `look.mjs`: after the preview has pages, `.line[data-what="kind:quote"]` exists for the quotation and `.line[data-what="text"]` for the text and `.line[data-what="heading:1"]` for *Book one*; hovering the quotation's line (`app.hover`) shows `.chip` reading "Quotation"; pressing it opens `.side .look` with `details[data-kind="quote"][open]`. Screenshot `what-3-chip`. Then press `.chip-switch`: hovering the line shows no `.chip`, `data-what` is still there; press it again and the chip is back.

Verify: `cargo test -p glaukopis-core`, `cargo test -p glaukopis contract`, `pnpm check`, `pnpm test`. Commit in the worktree at 5.1, 5.2, 5.3, 5.4.

## Stage 6 — words, guide, scripts, cleanup (main session, after both merges)

1. **Bokmål** for every new key, in `locales/nb/`, in the same files; the owner reads both. The other languages keep theirs; the keys removed in stages 1–3 are removed from every language's file (`grep -rl` over `locales/`).
2. **Dead words and code**: `look-open`, `look-whole`, `look-template`, `look-template-hint`, `look-layout-hint`, `look-citations-hint`, `preview-made-by`, `document-window-section-template`, `-parts`, `-look`, `document-window-look-*`, `document-window-parts-*` (moved), `document-window-template-*` (moved); `documentSettingsUi`, `DocumentSection`, `DOCUMENT_SECTIONS`; the old `LookSection` names. `pnpm check` and a grep for each key over `src/` and `locales/` must find nothing.
3. **The guide** — `docs/guide.md`: write again *What goes into the document*, *Templates* (now "What you are writing"), *The document settings* (now "About this document"), *The preview, and the manuscript* (the header, the chips and their switch) and *The look of a document* (the order, the first rows, the reference style's place, the layout at the foot, what the document contains); and the line in *Kinds of paragraph and of words* that names Look's part for kinds. Say in each what a new writer does first, then what a writer who wants to go further does. Keep the guide's voice.
4. **e2e**: `pnpm e2e:build`; run `templates.mjs`, `look.mjs`, `preview.mjs`, `editors.mjs`, `kinds.mjs`, `kinds-of-passage.mjs`, `found.mjs`, `runs.mjs`, `spelling.mjs`, `figures.mjs`, `languages.mjs`, `what.mjs`, `smoke.mjs`; then `pnpm e2e` whole once, and read `e2e/output/`: `look-1-panel.png`, `templates-1-chooser.png`, `what-*.png`, `preview-*`. Judge them as the owner would: one name over the preview, no citation style there; the chooser's first entry the plain document; Look's top as 2.2 says.
5. **The names of the templates in the writer's language** — `src/lib/preview/documents.svelte.ts`, `locales/en/template.ftl`, `locales/nb/template.ftl`: `templateName(project, id)` returns the words' `template-name-<id>` where the words have that key (`has()` from `$lib/i18n`), else as now. Keys for the sixteen templates that come with the application and are not a journal's, a publisher's or a style guide's (`plain`, `paper`, `article`, `report`, `book`, `thesis`, `novel`, `novel-manuscript`, `short-story`, `story-collection`, `poems`, `play`, `screenplay`, `letter`, `blog-post`, `news-article`), in English as the files have them and in Bokmål (`template-name-plain = Vanlig dokument`, and so on). The journals, the publishers and the style guides keep the names of their files in every language. The chooser's descriptions stay as the files have them tonight.
6. **Memory and records**: nothing to write in the records beyond this plan's departures; the report carries them.

Verify: every check; commit.

## Report

For the owner, in plain words: what a new writer now meets, in the order they meet it; what was built, with paths; the DOM of the doors (`.preview header .what`, `dialog .templates .choose[data-template]`, `[data-step]`, `.side .look .what`, `.layout-line[data-changes]`, `.first`, `.chips [data-section]`, `.part[data-part]`, `[data-part-switch]`, `.line[data-what]`, `.chip`, `.chip-switch`); what was left or doubtful; every departure from the record; the counts of every check, verbatim; the scripts run and their results. Do not push; do not bump packages; do not touch the installers.
