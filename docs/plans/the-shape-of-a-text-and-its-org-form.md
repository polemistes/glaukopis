# Build plan: the shape of a text, and its Org form

This is the working plan for building what `docs/adr/0041-the-shape-of-a-text-and-its-org-form.md` decides. Read that record first, in full: it says *what*; this plan says *how*, in which order, in which files, with which interfaces, and how each step is verified. Follow it closely. Where the plan and the record disagree, the record wins; say so in your report.

## How to work

- **Plain words.** Comments, messages to the owner, commit messages and the guide are written in plain words, as the code around them is. Never refer to a decision by a record number when talking to the owner ("the rework of kinds this week", not "ADR 0040").
- **Order.** Do the steps in order; each ends in a commit. Do not begin step 2 before every check of step 1 passes.
- **Verify before you commit.** The checks of a step are listed under *Verify*. Run them all. `pnpm check` (types), `pnpm test` (interface tests), `cargo test -p glaukopis-core` (core tests), `cargo test -p glaukopis contract` (writes `src/lib/api/contract.generated.ts`; run after any change of the core's types that the interface sees). Paste the counts into the commit message's body only when they changed something worth saying; always paste them into your report.
- **Edit, then format**: `pnpm exec prettier --write <files under src>`; `cargo fmt -p glaukopis-core` (it may reformat `crates/core/build.rs`; put that back with `git checkout crates/core/build.rs`). The e2e scripts in `e2e/` are not formatted by prettier; edit them by hand in their style.
- **e2e.** Build with `pnpm e2e:build`. Run one script as `timeout 400 node e2e/<name>.mjs > /tmp/<name>.log 2>&1` and read the log; a script that hangs means a loop in the page — end your own processes by PID (`ps -eo pid,comm | grep -E 'Xvfb|WebKitWebDriver|glaukopis'`), never `pkill -f`. Screenshots land in `e2e/output/`; read them to judge how a thing looks. The scripts drive the application off-screen; nothing touches the owner's desktop.
- **Commit** when a step is whole, without asking; never push. End every commit message with the attribution line the session gives you. Do not touch other projects or folders outside this repository.
- **Old projects** are not brought over. Readers must not fall over an old shape (a `passage` element, a `verse` element), but need not read it well.
- **Report** at the end of each step: what was built, what was left, the counts of the checks.

## Vocabulary

- *Kind*: the label of a paragraph or of a run of words (`families.ts`, `kinds.ts`, `formats/kinds.rs`).
- *Grouping*: how the document sets paragraphs of a kind that stand together: `lines` (a line block), `quote` (a block quote), `list`, `code`, `glossary` (a description list), `none` (each a paragraph of its own). Replaces *family* as the thing that groups; the menu's groups in `kinds.ts` are only the menu's.
- *Stretch*: consecutive paragraphs with the same numbering settings; what is numbered.
- *Run*: consecutive paragraphs of one kind; what the bracket is drawn over. Speakers and directions do not break a run and get no bracket of their own.
- *Line*: a paragraph's content between line breaks (`hard_break`); a paragraph with no breaks is one line.
- *Line mark*: an inline atom at the start of a line that says what the writer said of that line by hand.

---

# Step 1 — The shape of a text

## 1.1 The facts of the kinds — `src/lib/project/model/families.ts`

Rewrite `KindFacts`:

```ts
export type Grouping = 'lines' | 'quote' | 'list' | 'code' | 'glossary' | 'none';
export interface KindFacts {
  /** `words` for a kind of words only; otherwise how the document groups paragraphs of it. */
  grouping: Grouping | 'words';
  /** Whether a numbering counts its lines by default. */
  counted: boolean;
  /** Whether the kind may also stand on a run of words (speaker, direction). */
  words?: boolean;
}
```

The table, by id (ids stay as they are; they are stored in projects):
`text` none/counted; `quote` quote/counted; `epigraph` none/counted; `attribution` none/not; `line` lines/counted; `speaker` none/not/words; `direction` none/not/words; `scene`, `action`, `character`, `dialogue`, `parenthetical`, `transition` none/counted; `headword`, `gloss` glossary/counted; `item`, `numbered` list/counted; `code` code/counted; `break` none/not; `draft` none/not; `foreign`, `title`, `term`, `mention`, `highlight` words.

Remove `next`, `tab`, `joins`, `familyOf`, `nextOf`, `tabOf`, `joinsBefore`, `Family`, `FAMILIES`. Keep `Numbering`, `NUMBERINGS`, `Side`, `renamed`, `BasedKind`, `factsOf` (an own kind takes the facts of what it is based on, through the chain; one based on text or on nothing known takes text's), `countedKind`. Add `groupingOf(id, own)` and `wordsKind(id, own)`. The module stays free of `$lib/i18n` (it runs in the search thread). Rewrite `families.test.ts` to the new facts.

The core mirrors this in `crates/core/src/formats/kinds.rs`: `Entry { id, family, group, based_on, style, counted, words }` where `group` is now the *grouping* word above (`"none"` for most). `facts()` follows `factsOf`. The contract test (`src-tauri/src/contract.rs`, `src/lib/editor/kinds.test.ts`) compares `[id, family, group, basedOn]`; keep it true. `src/lib/api/documents.ts` `KindEntry`: `group` as before (now the grouping), `counted`, add `words: boolean`, remove `joins`.

## 1.2 The schema — `src/lib/editor/schema.ts`

- `paragraph` attrs become `{ kind: 'text', indent: 0, numbering: null, every: null, side: null, new: null }`. Remove `number`, `counted`, `hidden`, `margin` from the paragraph. `numbering` is `null | 'none' | 'counted' | 'given'` (null and `'none'` mean the same; write `null`), `every` `null | number`, `side` `null | 'left' | 'right'`, `new` `null | true` (begins a new run). DOM: `data-kind`, `data-indent` and `--indent`, `data-numbering`, `data-every`, `data-side`, `data-new`, each only when not the default; parseDOM reads them back.
- New inline atom `linemark`, group `inline`, `atom: true`, `selectable: false`, attrs `{ number: null, counted: true, hidden: null, margin: null, indent: 0 }`. DOM `span.linemark` with `data-number`, `data-uncounted`, `data-hidden`, `data-margin`, `data-indent` (only when not default); it shows nothing itself (the numbers plugin draws). It stands at the start of a line: as the first inline of the paragraph, or directly after a `hard_break`. `hidden` is `null` or `true`, never false, as before.
- New block atom `pagebreak`, group `block`, `atom: true`, `selectable: true`, attrs `{ what: 'page' | 'column' }`, DOM `div.pagebreak[data-what]`.
- Remove `passage`. `doc`, `parallel_side` and table cells hold `block+` / `paragraph+` as before; `parallel_side` is `(paragraph | pagebreak)+`? No: `block+` is fine; keep what the node had, minus passage.

`schema.ts` must not import `$lib/i18n`.

## 1.3 The Y shape and the readers — `src/lib/project/model/text.ts`, `blocks.ts`, `html.ts`

`text.ts` types:

```ts
export interface ParagraphBlock {
  kind: 'paragraph';
  name: string;          // the kind's id; 'text'
  indent: number;
  numbering?: Numbering; // absent = none
  every?: number;
  side?: Side;
  new?: true;
  content: Inline[];
}
export interface InlineLineMark {
  kind: 'linemark';
  number?: string; counted?: false; hidden?: true; margin?: string; indent?: number;
}
export interface BreakBlock { kind: 'break'; what: 'page' | 'column' }
```

`PassageBlock` goes. `Block` = paragraph | break | parallel | equation | figure | table | row. `Inline` gains `InlineLineMark`. `readBody` reads the new shape; it tolerates a `passage` element by reading its paragraphs as if they stood where it stands, and old `number`/`counted`/`hidden`/`margin` attributes on a paragraph by turning them into a line mark at the paragraph's start. `blocks.ts` writes the new shape (a line mark as `Y.XmlElement('linemark')` with its attributes; a break as `pagebreak`). `html.ts` draws a paragraph as `<p …>` with its lines parted by `<br>`, and before each numbered line `<span class="line-number" data-n="…" data-n-set>`; `passageNumbers` becomes `stretchNumbers(paragraphs, from, own, layout)` over a stretch. The existing helpers `paragraph(...)`, `passage(...)` in `text.ts`: keep `paragraph`, remove `passage`, add `linemark(...)` and `pagebreak(...)`.

Lines of a paragraph, once, in `src/lib/project/model/lines.ts` beside `lineNumbers`:

```ts
/** The lines of a paragraph: each a slice of its content, with the line mark that begins it, if any; empty lines included. */
export function linesOf(content: Inline[]): { mark: InlineLineMark | null; content: Inline[]; blank: boolean }[];
/** The stretches of a text: runs of paragraphs with the same numbering settings, each with its paragraphs' indices. */
export function stretches(blocks: Block[]): { from: number; to: number; numbering: Numbering; every: number | null; side: Side | null }[];
/** What each line of a stretch shows, paragraph by paragraph, line by line; `every` already resolved against the layout. */
export function stretchNumbers(paragraphs: ParagraphBlock[], every: number, numbering: Numbering, own: BasedKind[]): (Shown | null)[][];
```

A line is counted when its paragraph's kind is counted (`countedKind`), its mark does not say `counted: false`, and it is not blank; a line whose mark says `hidden` is counted and shows nothing. `lineNumbers` itself stays as it is. Tests in `lines.test.ts` for all three, including a stanza paragraph of three lines and a speaker between two verse paragraphs.

Readers to bring to the new shape, removing every special case of passages: `src/lib/search/passages.ts`, `search/replacing.ts`, `search/breaks.test.ts`, `search/search.test.ts`, `spelling/drawn.ts`, `words/project.ts`, `found/atonce.ts`, `found/gather.ts`, `review/drawn.ts`, `history/reading.ts`, `project/model/portable.ts`, `project/model/import.ts`, `project/model/migrate.ts` (remove the rewriting of texts; keep the rest), `project/model/project.svelte.ts` (`uses`, `blocksOf`). A `linemark` is skipped by every reader of words as a `refmark` is.

## 1.4 The core — `crates/core/src/document/mod.rs`, `passages.rs`, `numbers.rs`, `pandoc.rs`, `formats/typst.rs`, `export/latex.rs`, `export/reference.rs`, `export/mod.rs`, `import/document/convert.rs`

- `Block::Paragraph { name, indent, numbering: Numbering, every: Option<u32>, side: Option<Side>, new: bool, content }` (serde defaults; `new` skipped when false). `Block::Passage` goes. `Block::Break { what: BreakKind }` (`page` | `column`). `Inline::LineMark { number, counted, hidden, margin, indent }` (defaults as the interface's).
- `numbers.rs`: keep `numbers()`; add `lines_of(content) -> Vec<Line>` and `stretch_numbers(paragraphs, every, numbering, kinds) -> Vec<Vec<Option<Shown>>>` with the same rules and the same test cases as `lines.ts`.
- `passages.rs` becomes the grouping writer: walk the blocks of a section; cut them into stretches (same settings) and, within a stretch, into runs by grouping (`lines`, `quote`, `list`, `code`, `glossary`, `none`); a `new: true` paragraph begins a run; speakers and directions inside a `lines` run are written inside the line block as lines of their kind (as now, with the character style in Word). Numbers come from `stretch_numbers` over the whole stretch, so that the count runs across speakers and across stanzas. A verse paragraph is a stanza: Pandoc's line block gets an empty line between stanzas; Typst's `gk-verse` gets `#v(1em)`; LaTeX `\vspace{\baselineskip}`. A numbered `none` run is written paragraph by paragraph with the number beside, as now. A block quote holds the quote paragraphs only; an attribution after it is its own paragraph (no joining).
- Page and column breaks: Typst `#pagebreak()` / `#colbreak()`; LaTeX `\newpage` / `\columnbreak`; Word a raw `openxml` block `<w:p><w:r><w:br w:type="page"/></w:r></w:p>` (`column` for a column break); Writer a paragraph in a style `Page Break` / `Column Break` that the reference document (`export/reference.rs`) defines with `fo:break-before`; HTML and EPUB `<div style="break-before: page"></div>`; Markdown a raw TeX `\newpage`.
- Columns: `DocumentFormat.page.columns: u8` (1) and `page.column_gap: Length` (1cm), serde defaults; Typst `#set page(columns: n)` with `#set columns(gutter: …)`; LaTeX `multicol`; Word by `<w:cols w:num="n" w:space="…"/>` in the reference document's `sectPr`; Writer by a page style with columns in the reference. The layout editor's *Page* part gets the two fields (`src/lib/preview/FormatEditor.svelte`, `format-editor.svelte.ts`, `src/lib/api/documents.ts`).
- `import/document/convert.rs`: a line block becomes verse paragraphs, one per stanza (consecutive non-empty lines), lines parted by `Inline::Break`; lists become items with indent as now; a Pandoc `Div` of class `page-break` or a raw `\newpage` becomes `Block::Break`.
- A `kind` mark whose name is a paragraph kind with `words` (speaker, direction) is set as words with that kind's look and, in Word and Writer, its `… Char` style, which `reference.rs` already makes for the verse kinds; make it for every kind with `words`.

Tests: every existing test of `passages.rs` brought to the new blocks; new ones for a stanza gap, a speaker in a numbered stretch (the count runs on), a break in each flavour, columns in Typst.

## 1.5 The editor — `src/lib/editor/*`

Delete `passages.ts`, `passages.test.ts`, `stanzas.ts`, `script.ts`. Rewrite the keys in `plugins.ts` with a new `keys.ts`:

- `enter`: split the paragraph; the new one has the same `kind`, `indent`, `numbering`, `every`, `side` and no `new`; a line mark at the split point stays with the line it begins. If the paragraph is empty and its kind is not `text`, set its kind to `text` instead (and `indent` 0). Enter in a table cell, caption, note: as before (`leaveCaption`, etc.).
- `Shift-Enter`: insert `hard_break`.
- `Backspace` at the start of a line that follows a `hard_break`: delete the break (joining the lines; a line mark at the start of the second line is deleted with it). At the start of a paragraph: ProseMirror's `joinBackward` (joins with the paragraph before, whatever its kind; the kind of the first holds). Nothing else.
- `Tab` / `Shift-Tab`: in a paragraph of kind `line`, change the line mark's `indent` (making a mark if there is none, 0..8, removing the mark when every attribute is the default); in any other paragraph, the paragraph's `indent` (0..8). In a table, the table's keys first, as now; in a parallel text, across the sides, as now.
- Input rules in `plugins.ts`: keep `> `, `- `, `1. ` as they are (they set the kind of a text paragraph).

`commands.ts`: `setKind(id, own)` sets `kind` on the paragraphs the selection touches, keeps `indent` where the new kind is `item`/`numbered`/`line` and sets it to 0 otherwise, keeps everything else; no reading as written, no transformation. Remove `asWritten`. `indentParagraph` as above. `kindOf`, `kindsIn`, `paragraphsIn`, `paragraphAt` stay.

`verse.ts` → rename to `numbers.ts` (the editor's) and rewrite:

```ts
/** The stretch the cursor is in: its paragraphs with positions, and its settings; null in an unnumbered paragraph. */
export function stretchAt(state): { paragraphs: { node; pos }[]; numbering; every; side } | null;
/** The paragraphs a numbering would be set on from the cursor: the selection's, or the run of the cursor's kind with speakers and directions among them. */
export function stretchToNumber(state, own): { node; pos }[];
/** Sets the numbering settings on the paragraphs given (all of them). */
export function numberStretch(paragraphs, how: { numbering; every; side }): Command;
/** The line the cursor is in: its paragraph, its index among the paragraph's lines, its mark and the position where a mark stands or would. */
export function lineAt(state): { paragraph; pos; line: number; mark: Node | null; markPos: number } | null;
/** Sets what is said of the line the cursor is in; a mark with nothing to say is removed. */
export function markLine(marks: { number; counted; hidden; margin; indent? }): Command;
/** Gives the line at `pos` a number by hand (from the margin), '' takes it away. */
export function giveNumber(linePos, value): Command;
/** The plugin: draws, in every stretch, the numbers of every line as widgets at the line's start (`span.line-number[data-label][data-given]`, `.held` for a hidden one, `.blank` where none shows), and `data-numbers=side` on each paragraph of a stretch. */
export function stretchNumbersPlugin(own, layout): Plugin;
export function relayoutNumbers(view): void;
export function numbersAsked(state, own): NumbersAsked | null;  // for the dialog, as before, from stretchAt/lineAt
```

`LineNumbersDialog.svelte`: unchanged in what it asks (numbering, from, every, side; this line: number, not counted, hidden, margin); the words say *this line* where they said *this paragraph*. `RichText.svelte` applies: `numberStretch(stretchToNumber(...))` when the cursor was not in a stretch, else on the stretch's paragraphs; then `markLine`.

`brackets.ts`: runs instead of passages. A run is consecutive paragraphs of one kind, with speakers and directions among them not breaking it and a `new: true` paragraph beginning one. The bracket's label: the kind's name; add " · numbered" when the run lies in a stretch (`t('editor-bracket-numbered')`). The menu: *Numbers…*, *Language* (over the run), *Select the run*, *Make it text* (kind `text` on the run's paragraphs; nothing else), *Begin a new run here* (sets `new: true` on the cursor's paragraph; disabled on the first of a run), *Join with the run before* (unsets it). Remove `splitPassage`, `passageToText`'s transformation, `canSplitPassage`.

`kinds.ts`: `KindSpec` loses `structure`, `next`, `tab`; `inHand` as before; `GROUPS` stay as menu groups; add `WORD_KINDS` = the catalogue's words plus `speaker` and `direction` (`wordsKind`), for the Words menu in `WritingTools.svelte`. The hints in `locales/en/editor.ftl` and `nb` lose every promise about Enter and Tab.

`WritingTools.svelte`: the Words menu lists speaker and direction after the kinds of words; the Numbers menu's first item is *Number these lines…* (enabled wherever the cursor is in a paragraph; the dialog decides the stretch) — one wording, no *paragraphs* variant; *Insert* gets *Page break* and *Column break* (`insertBreak(what)` in `commands.ts`). The `#` button is enabled in any body paragraph.

`app.css`: cues on `p[data-kind]` as now; remove every `.passage` rule; the bracket's rules move to a `data-run` attribute the brackets plugin sets on the first paragraph of a run (`.prose p[data-run]` draws the bracket line by a `::before` pseudo-element spanning the run's height — if that proves hard, a widget decoration before the run's first paragraph with an absolutely positioned line, as `brackets.ts` draws now); `span.linemark` shows nothing; `.prose .pagebreak` a dashed line with its name from a `data-label` the node view sets (`views.svelte.ts`, with the words from `t()`).

Tests: `commands.test.ts` (setKind never changes content; Enter/Shift+Enter/Backspace/Tab in prose, in verse, in a list, on an empty paragraph of a kind), `numbers.test.ts` (stretches, lines, marks, widgets, counting through a speaker and across stanzas, a hidden number), `brackets.test.ts` (runs, new, make it text keeps breaks), `kinds.test.ts`. Remove `passages.test.ts`, `verse.test.ts`'s passage parts.

## 1.6 The layout's columns and page breaks in the interface

`src/lib/api/documents.ts`: `page.columns`, `page.columnGap`; `FormatEditor.svelte` *Page* part: two fields. `KindEntry.words`.

## 1.7 Words, guide, e2e

- `locales/en/editor.ftl` and `locales/nb/editor.ftl`: new keys for the breaks, the run's menu, "· numbered", the Words menu's speaker and direction; remove `editor-numbers-paragraphs*`, `editor-passage-split*`, the family words that are gone; run `node scripts/check-locales.mjs` and `node scripts/prune-locales.mjs`.
- `docs/guide.md`: *Verse, and texts side by side* and *Kinds of paragraph and of words* rewritten to the keys and the runs; a paragraph on page and column breaks and on columns in the layout.
- e2e: rewrite `e2e/verse.mjs` (verse written with Shift+Enter, Enter for a stanza, a speaker, numbering through it), `e2e/line-numbers.mjs` (marks on lines, hidden), `e2e/passages.mjs` → `e2e/runs.mjs` (the bracket, its menu, numbers in place, breaks), `e2e/kinds-of-passage.mjs`; check `e2e/documents.mjs`, `text-structure.mjs`, `maps.mjs`, `comments.mjs`, `search.mjs`, `review.mjs`, `preview.mjs`, `tables.mjs`, `figures.mjs`. Then the whole set: `pnpm e2e`.

## Verify step 1

`pnpm check` 0 errors; `pnpm test` all green; `cargo test -p glaukopis-core` all green; `cargo test -p glaukopis contract` green and the generated file committed; `pnpm e2e` all scripts green (run `large.mjs` alone if it fails under load). Then a look by hand in the built application with a script of your own (as `e2e/verse.mjs` does): a poem typed with Shift+Enter and Enter, made verse, numbered, with a speaker; a quotation; a list; a page break; the preview showing all of it; read the screenshots. Commit: "The shape of a text: …" in plain words.

---

# Step 2 — The Org form

## 2.1 The module — `src/lib/org/`

New files: `write.ts`, `read.ts`, `escape.ts`, `grid.ts` (grid tables), `cite.ts` (org-cite in and out), `properties.ts` (the drawer in and out), `org.test.ts`, `fixtures.ts` (a project that uses everything). No import of `$lib/i18n` or any `.svelte.ts`. The data it works on:

```ts
export interface OrgProject {
  title: string; language: string | null;
  elements: OrgElement[];            // in tree order, each with its depth
  elementKinds: KindRecord[]; paragraphKinds: PassageKindRecord[];
  templates: Record<string, Template>;
  links: LinkRecord[]; comments: Thread[];
  references: RefRecord[];           // written to references.bib by the core, not here
}
export interface OrgElement {
  id: string; depth: number; name: Inline[]; blocks: Block[];
  kind: string | null; status: Status | null; when: When | null;
  heading: boolean; excluded: boolean; include: string | null; origin: string | null;
  pos: Position | null; collapsed: boolean;
  document: DocumentSettings; timeline: TimelineSettings | null;
}
export function writeProject(p: OrgProject): string;
export function readProject(text: string): OrgProject;   // tolerant; never throws on content
export function writeBlocks(blocks: Block[]): string;      // one element's text, for the clipboard
export function readBlocks(text: string): Block[];
```

`src/lib/org/of-project.ts` (main thread only): `orgOf(project: Project): OrgProject` from the project's nodes, tree, links, kinds, comments, settings; and `intoProject(org: OrgProject, project: Project)` that fills a new project (used by *Open an Org file*).

The mapping is the record's section 6, exactly. Pin these details:

- Headlines: `*` × (depth + 1), the name as Org inlines; the project element is depth 0. The drawer's property names: `ID`, `KIND`, `STATUS`, `WHEN`, `HEADING`, `INCLUDE`, `ORIGIN`, `POS` (`x,y` integers), `COLLAPSED`, `LINKS`, `TITLE`, `SUBTITLE`, `AUTHORS`, `DATE`, `KEYWORDS`, `TEMPLATE`, `LAYOUT`, `STYLE`, `LANGUAGE`, `IDENTIFIERS`, `LINE_NUMBERS`, `TIMELINE`. `WHEN` is written by `describeWhen`'s machine form: write the `When` as JSON on one line if no short form exists yet, and note it in the report — the record allows the words the program uses; JSON is acceptable for the first version. The tag `:noexport:` for `excluded`.
- Blocks by grouping: `lines` → `#+BEGIN_VERSE` with stanzas parted by a blank line, speakers `@ `, directions `> `, line indents as two spaces a step, line marks at the line's end `{…}`; `quote` → `#+BEGIN_QUOTE`; `list` → `- `/`1. [@n]` nested by two spaces a step, a numbered list's first item given a number by hand → `[@n]`; `code` → `#+BEGIN_SRC`; `glossary` → `- headword :: gloss` with further gloss paragraphs indented; `none` → `#+BEGIN_<kind>` for every other kind (own kinds by `slug(name)`: lower case, spaces and anything but letters, digits and hyphens turned into hyphens), except `speaker`/`direction` (`@ `/`> ` lines), `break` (`-----`), `draft` (`#+BEGIN_COMMENT`), `text` (bare). A run that begins with `new: true` closes and reopens the block.
- A stretch's settings on the line before its first block as `#+ATTR_GLAUKOPIS: :numbering counted :every 5 :side right`; where the stretch holds more than one block, `#+BEGIN_numbered` around them, the settings line before it. A paragraph's language mark over a whole paragraph as `#+ATTR_GLAUKOPIS: :lang xx` before it, within a line as a span.
- Inlines: Org's marks; spans `[words]{…}` for `smallcaps` (`sc`), `kind` marks (`foreign lang=xx`, `title`, `term`, `mention`, `highlight`, `speaker`, `direction`, own by slug), `lang` (`lang=xx`), `found` (`found key=…` with its items as JSON after); `link` as `[[url][words]]`; `code` as `~…~`; `sup`/`sub` as `^{…}`/`_{…}`; `strike` `+…+`; `underline` `_…_`; `em` `/…/`; `strong` `*…*`. A citation as org-cite (`cite.ts`): modes `cite` and `cite/t`; items `prefix @key locator suffix` with `-@key` for suppressAuthor; the locator label's short word from `LOCATOR_LABELS`. A note `[fn::…]` with `@foot`/`@end` first where `place` is set. Math `$…$`. A reference mark `{#label}`. A cross-reference `[[fig:id]]`, `[[fig:id][n]]`, `[[fig:id][name]]`, `[[id:element]]…`. A line mark `{number | margin}` / `{-}` / `{~}` (combinations: `{45 -}`, `{~ | words}`).
- Blocks that are not text: figure (`#+CAPTION`, `#+NAME: fig:id`, `#+ATTR_GLAUKOPIS: :width :align :wrap :alt :file-name :numbered`, `[[file:pictures/<hash>.<ext>]]`), equation (`#+NAME: eq:id` + `\begin{equation}…\end{equation}` or `\[…\]`, `#+ATTR_GLAUKOPIS: :align`), table (Org table when simple; grid table otherwise — `grid.ts` writes and reads both; `#+CAPTION`, `#+NAME: tab:id`, `#+ATTR_GLAUKOPIS: :width :align :wrap :numbered :header-columns`), row (`#+BEGIN_row`), break (`#+BREAK: page|column`).
- Comments: a `:COMMENTS:` drawer after the properties drawer, one thread per `- [date author] on "words": text`, answers indented, `(settled)` at the end of the first note's line when resolved. Read back: `passage.text` is the quoted words; the positions are found later by `intoProject` searching the element's text for the words (`comments/marks.ts` has the relative-position helpers); not found → on the element.
- Escaping (`escape.ts`): any text that would read as a sign is written so that it reads back as text: a line of prose beginning with `@ `, `> `, `* `, `- `, `1. `, `#+`, `|`, `+-`, `:`, `-----`; Org emphasis markers that would form a mark; `[` … `]{`; `{` at a line's end; `[cite:`, `[fn:`, `[[`, `$`. Use a backslash before the sign; the reader removes a backslash before a sign and keeps every other backslash. The round-trip test includes a text made of such traps.
- Reading (`read.ts`): tolerant as the record says; unknown `#+BEGIN_x` → an own kind named x based on text, made if absent; unknown keyword lines ignored; unknown drawers, tags, TODO states kept as text in a `draft` paragraph; a bare newline in prose joins with a space; `\\` at a line's end is a line break; a block's `#+ATTR_GLAUKOPIS:` line gives its settings.

Tests (`org.test.ts`): the everything fixture round-trips equal (`readProject(writeProject(p))` deep-equals `p`, with empty paragraphs dropped); each mapping has a test of its own; the traps; a grid table with spans and paragraphs; an Org file written by hand with Org's own things (TODO, tags, a bare newline) reads without loss.

## 2.2 The project folder's copy

- `src/lib/project/model/saving.svelte.ts` `snapshot()`: build `writeProject(orgOf(project))`, the cited records (`project.references` as the project file writer gathers them in `src/lib/home/project-file.ts`), and the pictures used (`ProjectInfo.pictures` is what `summary()` gives); send them with the state.
- `src-tauri/src/commands/projects.rs` `project_save_state`: the request's head gains `readable: Option<Readable>`; `crates/core/src/projects.rs` `save_state_keeping` gains the same and writes, atomically, `project.org`, `references.bib` (by `projectfile::references_bib(records, Some(&library))`) and `pictures/<hash>.<ext>` (`fs::hard_link` from `pictures::file_in(store, hash, ext)`, falling back to `fs::copy`; files no longer used are removed). Failing to write the readable copy is logged and does not fail the save.
- `Save as Org` (the project's menu on the front page, beside *Save as a file…*): the same three things into a folder the writer chooses (`project_org_write(path, readable)`), by the file dialog the project file uses.
- `Open an Org file` (beside *Open a project file…*): a core command `project_org_read(path) -> { text, pictures: [(hash, ext, bytes)], bib: String }` that reads `project.org`, the pictures beside it and `references.bib`; the interface parses with `readProject`, makes a project with `intoProject`, takes the pictures into the store (`projectfile::take_pictures`) and settles the references as a project file does (`examine`/`settle` through `ProjectFileDialog.svelte`). Model everything on `makeFromFile` in `src/lib/home/project-file.ts`.

## 2.3 The clipboard, the history and the review

- `src/lib/editor/clipboard.ts`: `copiedText` writes Org of the copied blocks (`writeBlocks`); `pastedTextSlice` reads the pasted text with `readBlocks` (plain text without signs reads as paragraphs and lines, as now). Markdown pasted is taken through Pandoc only if the core already has a command for it; otherwise leave it and say so.
- History: `src/lib/history/PastView.svelte` gets *Show as Org*: the element's text at the moment and now, as Org, shown as a line-by-line difference (a small diff of lines with changed words marked; write it in `src/lib/org/diff.ts` with tests). Review: `src/lib/review/ReviewPanel.svelte` gets the same toggle for the element under review; the in-place marks stay as they are.

## 2.4 Words and guide

New keys in `locales/en` and `nb` (`home.ftl` for the menu items, `history.ftl`, `review.ftl`); `docs/guide.md` gets a section *Your project as Org* under *Keeping things safe*: what the folder holds, that it is written and never read back, *Save as Org*, *Open an Org file*, the clipboard, Org mode in Emacs and Pandoc as readers.

## 2.5 e2e

`e2e/org.mjs`: make a project with a verse (numbered, a speaker), a quotation, a list, a figure from the store, a table, a note, a citation (as `e2e/library.mjs` cites), a comment; wait for the save (the harness can call `window.__TAURI_INTERNALS__.invoke`; or type and wait for the idle snapshot); read `<dataDir>/projects/<id>/project.org` and `references.bib` and check lines of each mapping; then *Open an Org file* through the command with that folder and compare the new project's element names, kinds and texts with the first.

## Verify step 2

`pnpm check`, `pnpm test`, `cargo test -p glaukopis-core`, `cargo test -p glaukopis contract`, `pnpm e2e`. Open a project's folder by hand and read `project.org`; it should read as the record's examples do. Commit.

---

# After both steps

Report to the owner in plain words: what was built, what was left or doubtful, the counts, and anything in the record that could not be done as written. Do not bump the Arch package or push; the owner does both by their own word.
