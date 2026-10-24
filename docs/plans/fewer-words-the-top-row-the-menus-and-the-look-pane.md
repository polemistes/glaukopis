# Fewer words: the top row, the menus, and the Look pane in plain words — the build plan

The working plan for `docs/adr/0065-fewer-words-the-top-row-the-menus-and-the-look-pane.md`. Read the record first, in full: it says what and why, and what was found out; this says how, in which order, in which files, and how each stage is verified. Where they disagree, the record wins; say so in your report. Read also `.claude/briefs/common.md` (the progress note, the languages, the rules), `docs/plans/the-sides-the-panes-and-the-bars.md` for the shape of the window as 0064 built it, and `docs/plans/the-shape-of-a-text-and-its-org-form.md`, section "How to work", which holds here too: plain words; never a record number when talking to the owner; verify before you commit; edit then format (batch your edits of a file before `pnpm format` or `cargo fmt`, since exact-string edits break after a reflow); e2e with `timeout`, processes ended by PID only, never `pkill -f`; commit when a stage is whole, never push; report the counts. Commit at the end of every stage and more often where a stage is long: work that is not committed is lost when the session is. Keep a progress note as `common.md` says.

Read the last section of `docs/brief.md` (2026-10-24, with the owner's answers): it is the owner's words, and the record is read from them. The owner's last answers are settled: *Time stamp…*, *sub-elements*, and clones with names of their own. Older projects need not be spared: the owner says no real work exists yet; keep the test projects working where it is cheap.

The work is five stages. Stages 1 and 5 are small; 2 is medium; 3 and 4 are the bulk and touch the same files (`LookPanel.svelte`, `ContentsSection.svelte`, `Settings.svelte`, `format.ftl`, `look.ftl`), so one builder does 3 then 4 on main, or two builders take 3 and 4 in worktrees only if they agree first on who touches which rows. Stages 1 and 2 can go to a second builder in a worktree at once; they touch nothing of Look.

## The words

The interface's words are in `locales/en/*.ftl` and `locales/nb/*.ftl` (`locales/README.md`). The test `src/lib/i18n/i18n.test.ts` requires English and Bokmål to be complete and no language to have a message English has not. Therefore:

- **A message that says something else gets a new id**; the old id is removed. A message reworded under its old id would keep the old translation in the six other languages that are complete today (nn sv da de fr it), and they would say the old thing. The new id falls back to English there until someone translates it.
- **After removing or renaming, run `node scripts/prune-locales.mjs`**, which cuts the removed ids from every language. Run `node scripts/check-locales.mjs` and `pnpm test -- i18n` before committing a stage with word changes.
- **Hints removed**: delete the `-hint` id (or `.hint` attribute) from `en` and `nb` only when nothing else uses it (`grep -rn "the-id" src locales/en`); a hint still used by a dialog elsewhere stays there.
- Write the Bokmål yourself, in the voice of the files (see `locales/GLOSSARY.md`). The words below give en and nb; where the plan gives none, choose in that voice. *Sub-elements* is *underelementer*; *clone* is *klon*, *klone*.

## Stage 1 — the top row and the rail

Files: `src/lib/shell/Rail.svelte`, `src/lib/project/ProjectView.svelte`, `src/lib/project/SideBar.svelte`, `src/lib/project/SideView.svelte` (where the bar's `onclose` comes from), `src/lib/home/ProjectList.svelte`, `e2e/harness.mjs` and the scripts named below, `docs/guide.md`.

1. **The list's button on the rail.** `Rail.svelte` loses the `<a class="mark">` with the owl (`Mark.svelte` stays: the start screen and the settings use it). In its place, first in the rail, an `IconButton` as `ProjectView.svelte` has it today in the `.list` cell: label `home-pane-toggle`, `shortcut={keysFor('projects-pane')}`, `active={settings.value.projectsList}`, `data-projects-button`, icon `PanelLeft`. Its action is what `toggleProjectsPane` in `ProjectView.svelte` does: move that function to where both can reach it (the settings, or a small module beside `Rail.svelte`), so that the key `projects-pane` and the button do the same. The button is enabled while `router.route.view` is `project` or `home` and disabled elsewhere. Keep the rail's `margin-bottom` under it as the mark had, so the places below do not move.
2. **The top row without the list cell.** In `ProjectView.svelte` the `<div class="list">` goes, with `listWidth`, its `bind:offsetWidth`, and the subtraction of `listWidth` from the first cell's `flex-basis` and from `.cells`' basis (search `listWidth` and `leftmost`). The cells begin at the left edge of the top row.
3. **The × of a side in its cell.** In each `.cell`, after `<Path …/>`, an `IconButton` with `label={t('project-close-side')}`, `shortcut={keysFor('close-side')}`, `size="sm"`, `data-close-side`, whose `onclick` does what `SideBar`'s × did for that side: follow `onclose` from `SideBar.svelte` through `SideView.svelte` to the call on `sides` and call the same for `spec.key`. The × stands at the right end of the cell: the path takes the room and truncates, the × stays. In the active cell the × takes the accent's ink as the path does (`--ink` is set on `.cell.active`); in the other cell, the grey. With one side the × shows too: closing the only side brings the start screen. In `SideBar.svelte` the `.spring` and the × go; the bar ends with the Document button.
4. **Split view's background.** `.split .tool` gets a standing `background: var(--paper-sunken)` and `border-color: var(--line)` at rest; `:hover` and `.on` stay (`.on` is the accent-soft while two sides are shown). Check it against both cell colours with two sides and with one.
5. **No count on a folder.** In `ProjectList.svelte` remove `<span class="count">{row.projects}</span>` (about line 607) and its style (about 887); `row.projects` may stay computed if the tree uses it otherwise. The path's tree dropdown is the same component and loses the count with it.
6. **Scripts.** `e2e/harness.mjs` clicks `[data-projects-button]` (about lines 652 and 765): the selector holds, the button has moved; check nothing waits for it inside `[data-top]`. `[data-close-side]` is pressed in `e2e/breaks-and-projects.mjs`, `e2e/maps.mjs` and `e2e/path.mjs`: the selector holds; where a script scopes it to the side's bar, scope it to the top row's cell. Run `e2e/as-left.mjs`, `e2e/path.mjs`, `e2e/list.mjs`, `e2e/breaks-and-projects.mjs` and `e2e/maps.mjs`.
7. **Guide.** `docs/guide.md`: the owl in the corner (search "owl" and "rail"), the list's button, where the × stands, Split view.

Verify: `pnpm check`, `pnpm test`, the five scripts, and a screenshot of the top row with one side and with two (the harness's screenshots go to `e2e/output`). Commit.

## Stage 2 — the menus: hints, the heading flag, the clone, the words, the library, Escape, the loose citations

Files: `src/lib/project/elements.ts`, `src/lib/project/diagram/MapDiagram.svelte`, `src/lib/project/diagram/DiagramNode.svelte`, `src/lib/project/text/MapText.svelte`, `src/lib/project/text/TextSection.svelte`, `src/lib/project/text/Outline.svelte`, `src/lib/project/text/layout.ts`, `src/lib/project/model/document.ts`, `src/lib/project/model/changing/elements.ts`, `src/lib/project/model/project.svelte.ts`, `src/lib/project/parts.ts`, `src/lib/document/TemplateEditor.svelte`, `src/lib/timeline/when.svelte.ts` and its dialog, `src/lib/library/LibraryView.svelte`, `src/lib/ui/MenuHost.svelte`, `src/lib/found/FoundPanel.svelte`, `locales/*/project.ftl`, `diagram.ftl`, `text.ftl`, `keys.ftl`, `timeline.ftl`, `parts.ftl`, `library.ftl`, `found.ftl`, `docs/guide.md`.

### 2.1 The hints

Remove from `elements.ts`: `project-associate-hint` (about line 492), the `hint` of *Say when it is…* (about 504, what the element's time is; the time stays visible in the diagram and the timeline), `project-leave-out-hint` (about 612), and the `hint: placeWords(...)` of the kind submenu's items (about 531 and 543). From `MapDiagram.svelte`: `diagram-open-as-map-hint` (about 828), `diagram-new-here-hint` (about 1009), `diagram-tidy-hint` (about 1023). From `MapText.svelte`'s menu (about 1030–1070): `text-open-as-map-hint`, `text-fold-all-under-hint`, `text-split-hint`, `editor-numbers-lines-hint`. From `LibraryView.svelte`'s `addMenu` (about 316 and 328): `library-import-file.hint` and `library-add-pdfs.hint`. Remove the ids and attributes from `en` and `nb` where nothing else uses them.

### 2.2 *Print the name as a heading* goes

Remove the item (`elements.ts` about 600–609) and `project.setHeading` if nothing else calls it. Stop reading the flag: `model/document.ts` about line 109, `printed = !isRoot && node.titleHtml.length > 0`; `text/layout.ts` about 63, the next level is always `level + 1`; `MapText.svelte` about 208, every element counts in the outline numbers; `TextSection.svelte` about 307 and 429, the `plain` class and the `text-not-printed` tag go, with the `.plain .heading` style. `project.svelte.ts` about 824 may keep reading `heading` into the record; nothing acts on it; say so at `types.ts` line 153. Check `src/lib/org/` and `model/import.ts`: the import's `heading` is the heading's text, not the flag; if the Org form writes the flag as a property, stop writing it. The guide (about line 1970) loses the bullet; the sentence at about 750 ("an element whose name is printed as a heading") is checked.

### 2.3 The clone

The data keeps its name: `node.include` is the original's id; `setInclude` in `model/changing/elements.ts` about line 334 stays the way it is set. The rules:

- **Words** (`project.ftl`; the old `project-stand-for*` ids go): `project-clone-other` = *Clone other element…* / *Klon av et annet element…*; `project-clone-of` = *Clone of “{ $name }”* / *Klon av «{ $name }»* (the submenu's label on a clone, and the diagram's mark where `project-stands-for-map` was); `project-clone-choose` = *Choose another element…* / *Velg et annet element…*; `project-clone-go` = *Go to the original* / *Gå til originalen*; `project-clone-none` = *No longer a clone* / *Ikke lenger en klon*; the picker's `project-pick-stand-title` and `project-pick-stand` become `project-pick-clone-title` = *Clone which element into “{ $name }”?* (or in the picker's own shape; read `ElementPicker.svelte`) and `project-pick-clone` = *Clone it*; `project-pick-self` and `project-pick-loop` stay. In `text.ftl`: `text-include` and `text-include-open` become `text-clone` = *Clone of { $name }* and `text-clone-go` = *Go to the original*.
- **The menu** (`elements.ts` about 616–650): on an element that is not a clone, one item *Clone other element…* (icon `FileInput`, action `chooseIncluded`), **disabled where the element has text (`!node.empty`) or sub-elements** (`hasChildren`), with no hint. On a clone, a submenu *Clone of “X”* with *Choose another element…*, *Go to the original* (`actions.enter` or `onenter` of the original, as the text's button does it) and, after a separator, *No longer a clone* (`setInclude(id, null)`). The list of the trees under the project that the submenu offered (`includes`) goes: the picker is the way. **A clone of a clone**: in `chooseIncluded`, where the chosen element is itself a clone, take its original (`project.node(e)?.include ?? e`) before `wouldLoop`; make `wouldLoop` look through clones too if it does not.
- **Nothing of its own but its name**: on a clone, *Add child element*, *Write its text* (`actions.edit`) and *Paste under it* are disabled, *Rename* is not; the diagram's and the text's keys that add under or write (`tree-new-under`, double-click to write, Enter into the text) do nothing on a clone; `moveElements`/the drop targets in `changing/elements.ts` refuse a clone as the new parent (return false, as they refuse a loop); `setInclude` refuses an element that has text or sub-elements (the menu is disabled already; the model holds the rule). Older data with a clone that has text or sub-elements: not printed, not shown in the text; the diagram still shows the sub-elements, and that is accepted.
- **The name** is the clone's own, edited as any name. `DiagramNode.svelte` (about 178–219): the clone mark stays, with `project-clone-of` as its tooltip. `TextSection.svelte` (about 440–480): the heading is the clone's own name, editable; the `.include` row says `text-clone` and `text-clone-go`; the `.body` is not rendered (no editor for a text of its own).
- **The document** (`model/document.ts` `walkBranch`, about 96–140): today the clone prints its own name, its own text, then the original's text and sub-elements (the original walked as a root, whose name is not printed), then its own sub-elements. Keep the name and the original's part; skip the clone's own blocks and children. The counting of words (about 267–280) follows the same rule. Test in `document.test.ts`: a clone prints its own name, then the original's text and sub-elements at the clone's level, and nothing of its own; the original prints at its own place too when it is within the document; a cycle is not entered.
- **The core** needs no change: it receives the composed document.
- **The guide**: the two passages (about lines 1269 and 1454) and the sentence at about 2066 say *clone*: what it is, that it has nothing of its own, that the original prints at its own place as well.

### 2.4 The words of the menus

New ids, en and nb; the old go. `project.ftl`: `project-add-under` → `project-add-child` = *Add child element* / *Legg til underelement*; `project-add-after` → `project-add-sibling` = *Add sibling element* / *Legg til element på samme nivå*; the project's root (`isProject`, `elements.ts` about 445–460) shows *Add child element* once, not two items; `project-delete-keeping` → `project-delete-promote` = *Delete and promote sub-elements* / *Slett og flytt underelementene opp*; a new `project-delete-with` = *Delete with sub-elements* / *Slett med underelementer*, used in place of `common-delete` where `hasChildren` (about 716), `common-delete` where there are none. `timeline.ftl`: `when-say` and `when-change` → one `when-stamp` = *Time stamp…* / *Tidsstempel…*; `when-title` → `when-stamp-title` = *Time stamp* / *Tidsstempel*; `timeline-empty`, `timeline-without-hint` and `timeline-waiting-hint` say *Time stamp…* where they said *Say when it is…*. 

`text.ftl` (the fold words; read lines 22–60 and `keys.ftl` 61–68): `text-open` → `text-unfold` = *Unfold this element* / *Brett ut dette elementet*; `text-fold` → `text-fold-this` = *Fold this element* / *Brett sammen dette elementet*; `text-open-all-under` → `text-unfold-all-under` = *Unfold all sub-elements* / *Brett ut alle underelementer*; `text-fold-all-under` → `text-fold-all-sub` = *Fold all sub-elements* / *Brett sammen alle underelementer*; `text-open-all` → `text-unfold-all` = *Unfold all* / *Brett ut alt*; `text-outline-open` → *Unfold sub-elements*, `text-outline-fold` → *Fold sub-elements*; the tooltips `text-open-shift` and `text-fold-shift` say *Unfold · with Shift, all sub-elements as well* and *Fold this element · with Shift, unfold all sub-elements*; `text-fold-hint` goes; `keys-tree-fold` and `keys-tree-fold-all` say *fold* and *unfold* and *sub-elements*. `text-folded` (what is folded away, in its place) keeps *folded*. The guide's *fold* passages (many) are read and changed where they name the items.

### 2.5 One list of kinds, no groups

In `elements.ts` about line 554 the kind submenu lists `PARTS` in the catalogue's order without the `PART_GROUPS` headings; in `TemplateEditor.svelte` about 197–215 the add menu and `kindGroups` likewise. `PART_GROUPS`, `partGroupWords` and `parts-group-*` go if nothing else uses them. `placeWords` keeps `cover` and `none` and returns nothing for `front` and `back`; `parts-placed-front`, `-back` and their `-short` go. Find the text's tag that used the short form (`grep -rn placeWords src`).

### 2.6 The library's menu

`LibraryView.svelte` `addMenu` (about 310–345): the order is *Import Bib(La)TeX…*, *Import from Zotero…*, *Paste references…*, *Add PDF files…*, separator, the duplicates and the map as today. `library-import-file` → `library-import-bibtex` = *Import Bib(La)TeX…* / *Importer Bib(La)TeX…*, used by the empty library's button (about 497) too; no `.hint` on it nor on `library-add-pdfs`. The file filter (`references.svelte.ts` about 172) stays.

### 2.7 Escape closes any menu

`MenuHost.svelte`: a `<svelte:window onkeydowncapture>` that, while `menuState.current` is set and the key is `Escape` and the event did not come from inside `.menu`, closes the menu and stops the event, so that the editor under it does not act on it too; `MenuList.svelte`'s own Escape handling stays for when the menu has the focus. Then find what takes the focus from the text's right-click menu: in a dev run, after `openContextMenu` in `MapText.svelte`'s `oncontextmenu`, add for the moment `document.addEventListener('focusin', e => console.trace(e.target), { once: true })` and see who focuses the editor after `MenuList`'s `$effect` focused the menu (ProseMirror's mouse handling on the `mouseup` of the right button, or an `activate(...)` after the press, are the likely ones). Stop it at its source, remove the trace, and add a check in `e2e/editors.mjs` or `e2e/keys.mjs`: right-click in a paragraph, `.menu` is there, `document.activeElement` is inside `.menu`, Escape pressed without the harness's `closeMenu` trick, `.menu` gone.

### 2.8 Loose citations

`FoundPanel.svelte` about 315–316: the overline says `found-plain-text` = *Plain text citations* / *Kildehenvisninger i ren tekst*; the `<p class="always">` and `found-taken-always` go; `found-taken` goes.

### 2.9 Scripts and the report

`e2e/folding.mjs` about 217 checks the menu's words *Open all that is folded under it* and *Fold it away*: the new words. `e2e/harness.mjs` about 791 presses *Add an element under it* by its words (`thisElement`): *Add child element*. `e2e/timeline.mjs` presses *Say when it is…*: *Time stamp…*. Grep `e2e/` for *Stand for*, *Delete, keeping*, *Import a file* and *Open it*. Run `e2e/folding.mjs`, `e2e/timeline.mjs`, `e2e/maps.mjs`, `e2e/editors.mjs`, `e2e/found.mjs`, `e2e/found-window.mjs`, and `e2e/sources.mjs` or whichever script uses the library's menu.

List in your report, with their English words, the hints that remain in the application outside Look and the menus named: `grep -rn "hint: t(\|\.hint')" src/lib --include='*.svelte' --include='*.ts' | grep -v 'look/\|settings/\|TemplateEditor\|StyleEditor\|FormulaPanel'` (the review's *Forget accepted*, the tables' *The table*, the files' *Add a folder*, the library's references pane and names field). Change none of them: the owner decides at once.

Verify: `pnpm check`, `pnpm test`, `node scripts/prune-locales.mjs`, `node scripts/check-locales.mjs`, the scripts above. Commit; this stage may be three commits (2.1–2.2, 2.3, 2.4–2.9).

## Stage 3 — Look: the words and the hints

Files: `src/lib/look/LookPanel.svelte`, `src/lib/look/ContentsSection.svelte`, `src/lib/ui/settings/Settings.svelte`, `src/lib/document/AboutDocumentWindow.svelte`, `locales/*/look.ftl`, `format.ftl`, `template.ftl`, `about.ftl`, `docs/guide.md`.

### 3.1 The hints and the examples

Remove every help text of Look, and nothing else of its rows:

- In `LookPanel.svelte`'s rows, every `hint:` option (search `hint:` from about line 690 to 1220) and the `hint` of `ptOrText` and `counted`; the `{ note: … }` rows (`format-lengths-hint` ×2, `format-numbers-hint`); the literal `'1, 1.1, 1.1.1'` hints. In the markup: `look-what-hint` (about 1703), `look-scope-hint` (about 1732), the `<small>` under *Font* (about 1565) and under *Reference style* (about 1654), `look-quotations-hint` and `format-kinds-hint` (about 1813–1816), the `format-lengths-hint` line under the kinds (about 1821; its `kindsOk` red state goes in stage 4 with the centimetres), `format-levels-hint` (about 1852), `look-front-title-page-hint` (about 1900), `look-layout-hint` (about 1927), `look-bundled` (about 2057), `format-source-none`. The example rows go: in the `captioned` snippet (about 1621–1629) and under the equations (about 1879–1882); `format-as-it-will-stand` and `format-caption-example` go if nothing else uses them. The `<small>` under the placeholder (about 1634) keeps only `format-captioned-placeholder-missing`, shown while the `{}` is missing, since that is a fault to mend; `format-captioned-placeholder-shown` goes.
- In `ContentsSection.svelte`: `look-contents-parts-hint`, `look-contents-kinds-hint`, `look-contents-kinds-none`, `look-contents-requirements-hint`, the `partHints` under the generated parts' switches (the Body's switch stays disabled and checked), `template-requirement-anonymous-hint`. `look-contents-requirements-note` stays: it is the type's own words, not a help text.

Delete the ids that nothing uses any more (grep each): `look-what-hint`, `look-scope-hint`, `look-layout-hint`, `look-citations-hint`, `look-quotations-hint`, `look-contents-*-hint`, `look-contents-kinds-none`, `look-contents-part-body/notes/bibliography/keywords`, `look-front-title-page-hint`, `look-bundled`, `format-typeface-hint`, `format-indent-first-hint`, `format-refmarks-hint`, `format-level-run-in-hint`, `format-level-begins-hint`, `format-level-numbering-hint`, `format-levels-hint`, `format-title-anonymous-hint`, `format-quote-from-words-hint`, `format-bibliography-title-hint`, `format-captioned-called-hint`, `format-captioned-reference-hint`, `format-captioned-separator-hint`, `format-caption-align-hint`, `format-unless-said`, `format-captioned-placement-hint`, `format-captioned-end-title-hint`, `format-captioned-placeholder-shown`, `format-table-rules-hint`, `format-line-numbers-hint`, `format-verse-every-hint`, `format-numbers-hint`, `format-lengths-hint`, `format-columns-hint`, `format-size-zero-hint`, `format-margin-openers-hint`, `format-kinds-hint`, `format-source-none`, `format-as-it-will-stand`, `format-caption-example`, `template-requirement-anonymous-hint`. Some are used by `PassageKindDialog`, `KindDialog` or `rows.svelte.ts`: those stay for those dialogs.

### 3.2 The words

New ids, en and nb; the old ids go. In `look.ftl`:

| old id | new id | en | nb |
|---|---|---|---|
| `look-section-numbers` | `look-section-line-numbers` | Line numbers | Linjenummer |
| `look-section-contents` | `look-section-type-parts` | Parts of the document type | Dokumenttypens deler |
| `look-section-layout` | `look-section-the-layout` | Layout | Oppsett |
| `look-layout` | `look-choose-layout` | Choose a layout | Velg et oppsett |
| `look-layout-changes` | `look-layout-modifications` | Modifications to the layout | Endringer i oppsettet |
| `look-at-quotations` | `look-at-quotations-warning` | Quotations | Sitater |
| `look-at-kinds` | `look-at-paragraph-kinds` and `look-at-words-kinds` | Paragraph kinds · Words kinds | Avsnittstyper · Ordtyper |
| `look-contents-requirements` | `look-type-requirements` | Requirements of the document type | Dokumenttypens krav |
| `look-contents-parts`, `look-contents-kinds` | go | (one list, stage 4.4) | |

In `format.ftl`:

| old id | new id | en | nb |
|---|---|---|---|
| `format-level-run-in-label` | `format-level-begins-paragraph` | Begins the paragraph | Innleder avsnittet |
| `format-level-begins` | `format-level-placement` | Placement | Plassering |
| `format-title-shown` | `format-title-include` | Include | Ta med |
| `format-title-how` | `format-title-formatting` | Formatting | Formatering |
| `format-title-anonymous` | `format-title-anonymize` | Anonymize the front page | Anonymiser forsiden |
| `format-table-itself` | `format-table-inside` | Inside the table | Inne i tabellen |
| `format-quote-when` | `format-quote-warn` | Warn about long inline quotations | Varsle om lange sitater i løpende tekst |
| `format-indent` | `format-indent-first-line` | Indent first line | Innrykk i første linje |
| `format-paragraphs`, `-indent`, `-spaced` | go | (stage 4.1) | |

`format-space-between` stays. In `template.ftl`: `template-requirement-anonymous` becomes `template-requirement-anonymity` = *Anonymous* / *Anonymt*, used in Look's requirements and in the document type's editor alike; `about-requirement-anonymous` in `about.ftl` may stay as the sentence it is.

The chips of the parts (`sectionWords`, about line 516) and the `h3`s take the new words. *Paragraph kinds* and *Words kinds*: in the paragraphs part (about 1815) two `h4`s, each followed by the kinds of that family: `kindGroups` is grouped by the catalogue's `GROUPS`; filter each group's kinds by `family` under the two headings, keeping *In this document* first under each where it has kinds of that family. Check the search (`fits`) and `bring(form, { kind })` still land on a kind.

### 3.3 Figures and tables, Front page, Layout

- *Equations* of the same rank as *Figures* and *Tables*: in the figures part (about 1875–1884) render `<h4>{t('format-equations')}</h4>` in the markup and give `Settings` the equation rows as their own list, without the `{ heading }` row; if no other place uses `heading` rows, remove the kind from `Settings.svelte` and `rows.ts`, else style its `h3` as the parts' `h4`.
- The layout section (about 1922–2060): the heading `look-section-the-layout`; the row's label `look-choose-layout`; the changes list under `look-layout-modifications`; the `source` block (about 2023–2051) goes with `format-source`, `format-source-read`, `-high`, `-medium`, `-low`, `-changed` if nothing else uses them; `look-bundled` goes; the description (textarea for a layout of one's own, the paragraph for another) and the buttons stay.
- The source as one line in Document properties: in `AboutDocumentWindow.svelte`'s Document type tab, under the layout the type brings, where `documents.formatCached(layout)?.source?.name` is there, one line `about-layout-source` = *Source: { $name }* / *Kilde: { $name }* whose name opens the url with `openPath` as Look did.

### 3.4 The guide

`docs/guide.md`, section *The look of a document* and wherever the old words stand: *What the document contains* (4), *What is required* (2), *The parts of the document* (1), *Long quotations* (1), *What is shown* (1), *Front matter* and *Back matter* (1 each), and the new names. Say the lengths are in centimetres once stage 4 is built.

Verify: `pnpm check`, `pnpm test`, `node scripts/prune-locales.mjs`, `node scripts/check-locales.mjs`; `e2e/preview.mjs` and any script that finds Look by its words or `data-at` (grep `look-\|data-part\|data-at=` in `e2e/`); a screenshot of each part of Look. Commit.

## Stage 4 — Look: paragraphs, centimetres, quotations, the parts in print order, anonymity

### 4.1 Two lengths for paragraphs

The core, `crates/core`:

- `formats/kinds.rs` `Resolved::text` (about line 164): `first_line = f.text.indent`, `space_after = f.text.space_between`, always both.
- `formats/typst.rs` (about 513): `first-line-indent: (amount: indent, all: indent_first)` and `spacing: body_leading + space_between`, always both.
- `export/latex.rs` (about 133–146, 330, 408): `\parindent` is the indent and `\parskip` the space, both always; what is conditional on `Paragraphs::Indent` becomes conditional on the indent not being nought (`indent_first`, the ragged-right case).
- `export/reference.rs` (about 331): `first_line = indent`, `between = space_between.twips()`, both.
- `export/mod.rs` (about 1849, HTML): indent `1.2em` while the indent is not nought, between `0.8em` while the space is not nought, or the lengths themselves if the CSS there takes them.
- `formats/mod.rs`: `Paragraphs` and `text.paragraphs` are **no longer written** (`skip_serializing`, read with a default of "unsaid"). In `DocumentFormat::modernise`, where the field was present in what was read: `Indent` zeroes `space_between`, `Spaced` zeroes `indent`. A file without the field is taken as it is. Tests: a layout of each old shape prints as before (typst and docx); a new file with both lengths prints both.
- `scripts/modernise-formats.mjs`: add the rule and run it over `resources/formats/*.json`: 36 layouts say `indent` and have `spaceBetween` at nought already; four say `spaced` and keep an indent of 1.27cm (`journal-of-hellenic-studies`, `routledge-books`, `sage-books`, `universitetsforlaget-books`), which become `0cm`; the field `paragraphs` goes from every file. `scripts/check-templates.mjs` and the core's tests over the bundled layouts must pass.

The interface:

- `src/lib/api/documents.ts`: `paragraphs` becomes optional and is not written; grep `text.paragraphs` and `'indent' | 'spaced'` in `src/lib` and remove the choice everywhere.
- A document's changes over its layout (`look/changes.ts`): a change at `text.paragraphs` in an older document is read as its zeroing (`spaced` → `text.indent: '0cm'`, `indent` → `text.spaceBetween: '0pt'`) when the changes are read, and not written again. Test it in `changes.test.ts`.
- `LookPanel.svelte` `paragraphRows` (about 938): `length(format-indent-first-line, 'text.indent')`, `toggle(format-indent-first, 'text.indentFirst', { when: indent not nought })`, `length(format-space-between, 'text.spaceBetween')`; no `when: indented` elsewhere (grep `indented`).

### 4.2 Lengths in centimetres

`src/lib/ui/settings/Settings.svelte` (about line 53) and `rows.ts`: the `length` row becomes a number field with *cm* after it, as the `number` rows with a unit are rendered (`.with-unit`), `step="0.05"`, `min="0"`, two decimals. Add to `rows.ts` `toCm(value: string): number | null` (reads `pt|mm|cm|in`, the comma as a decimal point too; `1in = 2.54cm`, `1mm = 0.1cm`, `1pt = 2.54/72 cm`) and `fromCm(n: number): string` (`${n}cm`, up to two decimals, no trailing zeros), with tests. A row whose value is unsaid (the kinds' lengths in `look/rows.svelte.ts`, `LENGTHS`, where empty means *as the base*) shows an empty field with the base's value as the placeholder, as the `number` rows with `nullable` do; typing says it, clearing unsays it. `lengthOk` and the `invalid` class go where the field is numeric; `lengthsOk` stays for what is read from a file, `kindsOk` in `LookPanel.svelte` goes if nothing typed can be wrong. The provenance line under a row (`from`) is unchanged.

### 4.3 Quotations: a warning, not a look

- `LookPanel.svelte` `quotationRows` (about 1042): the five look rows go. The subheading is `look-at-quotations-warning`. Under it: `toggle(format-quote-warn, …)` whose value is `fromWords != null || fromLines != null`; turning it on with nothing set writes `fromWords = 40`; turning it off writes both `null`. While on: `number(format-quote-from-words, 'quote.fromWords', …)` and `number(format-quote-from-lines, 'quote.fromLines', …)`, each nullable (empty is not counted), without the *not said* word.
- The kind Quotation stays in the kinds list; its base is `Resolved::quote(f)` from the file's `quote` block, which Look no longer edits. Say in the record's addendum that a layout of one's own changes the quotation's look through the kind.
- `src/lib/document/checklist.ts`: a remark kind `quotation`. For every paragraph block of the document (`project.blocksOf`, `kind === 'paragraph'`) whose kind is not `quote` and not based on it, find runs between quotation marks — the pairs `“ ”`, `” ”`, `„ “`, `« »`, `» «`, and straight `" "` — and count their words and their characters. **Words**: a run with at least `fromWords` words. **Lines**: estimated from the layout: characters a line ≈ `textWidth / (0.5 × fontSize)`, where `textWidth` is the page's width less its left and right margins, divided by the columns, all in points (`toCm` and the page sizes: A4 595×842, US Letter 612×792, A5 420×595, B5 499×709, US Legal 612×1008, custom from `page.width`/`height`); a run with `characters / charsPerLine ≥ fromLines`. One remark per paragraph: `checklist-long-quotation` = *“{ $element }” has a quotation of { $words } words in the text, about { $lines } lines; the layout sets quotations off from { $limit }.* with `$limit` in words or in lines as the layout says it (two message variants, or `$by` chosen in Fluent), and the element among `elements`. The checklist already receives `format` (unused, `void format`): use it. Test in `checklist.test.ts`: forty-one quoted words at a limit of forty; a lines limit with a wide and a narrow page; the kind Quotation, which is not remarked on.

### 4.4 The parts of the document type in print order

`ContentsSection.svelte` becomes one list under the part's heading (the `h3` `look-section-type-parts` is in `LookPanel.svelte`):

- The order is the document's print order: the type's `contents` list (`ContentsItem`: `{ part }` generated or `{ kind }`), then the kinds the type names in `kinds` but does not place, where the core puts them: front kinds before the body, back kinds after everything, as `crates/core/src/export/mod.rs` about lines 596–630 does it. Look for a way to ask the core (`src/lib/api/documents.ts`, the generated contract: a command that composes a document or lists its parts); if there is none, write `printOrder(template, kinds)` in `src/lib/document/composition.ts` mirroring the core, with a test that holds a fixture alike on both sides.
- Each row: a generated part shows its name and its switch as today (`data-part-switch`, Body disabled and on; the title page's switch is the same as under Front page); a kind shows its name, the elements under this document of that kind as today (`data-kind`, `data-element`, `data-make`, *Only the first is used*, *None yet*, *Make one*). No words of front or back.
- Under the list, `h4` `look-type-requirements`, the limits, the switch `template-requirement-anonymity`, the type's note.
- The scripts: `grep -n "data-part-switch\|data-kind=\|data-make" e2e/*.mjs` and run those.

### 4.5 Anonymity

- `checklist.ts`: a remark kind `anonymous` when `template?.requirements.anonymous` and `format && !format.title.anonymous`: `checklist-anonymous` = *The document type asks for an anonymous document; the front page names the authors. Turn on Anonymize the front page under Front page in Look.* / nb likewise. Test it.
- The exports' metadata: the tests that hold already are the docx one (`export/mod.rs` about 3470) and Typst's (`formats/typst.rs` about 1020); add, where missing, one for LaTeX (`pdfauthor` absent while anonymous) and one for the Pandoc path's `author-meta`. Nothing to build; the tests say it holds.

Verify: `cargo test` in `crates/core` (the crate's name is in its `Cargo.toml`), `node scripts/check-templates.mjs`, `pnpm check`, `pnpm test`; `e2e/preview.mjs`, `e2e/figures.mjs`, `e2e/tables.mjs`, and a PDF and a DOCX exported from a document with an indent and a space both set, looked at. Commit; this stage may be two commits (4.1–4.2, then 4.3–4.5).

## Stage 5 — image for picture, the review script, the guide, the record

1. ***Picture* becomes *image*** wherever the user reads it, in `locales/en` and `locales/nb`: `pictures.ftl` (66 in en), `ocr.ftl` (24), `project.ftl` (18), `core-import.ftl` (15), `core-pictures.ftl` (12), `figures.ftl` (12), `core-sharing.ftl` (8), `files.ftl` (7), `core-ocr.ftl` (5), `core-export.ftl` (5), `credits.ftl` (4), `keys.ftl` (3), `core-projectfile.ftl` (2), `editor.ftl` (2), `format.ftl` (2), `shell.ftl` (1), `style.ftl` (1), and `document.ftl` (2). Reword under the same ids where only the one word changes and the meaning does not; the ids keep `picture` (the code keeps its names). `document.ftl` prints in documents in thirty languages: look at its two first; if they are printed words, change en, nb and nn and leave the rest to translators, and say so. Grep `Picture\|picture` in `docs/guide.md` too.
2. **The review and the other side**: in `e2e/review.mjs`, or a short new `e2e/review-sides.mjs` on the harness alone, open a project, Split view with *This element, as diagram and text*, press Ctrl+Shift+E in the left side (check `window.__glaukopisHistory.review` is not null and the changes tab is shown), click into the right side's text, check `review` is null and the tab of changes is closed (`document-pane.svelte.ts` about line 122: `toggleReview(false)` when the key changes). Add it where the scripts are listed.
3. **The guide**: everything renamed or removed in stages 1–4 that is not yet done; read the sections *The look of a document*, *One tree, entered anywhere*, the rail and the top row, folding, the element's menu, the library, the loose citations.
4. **The record's addendum**: in `docs/adr/0065-…md`, "Addendum, <date>: as built", with what departs from the plan, 

Verify: `pnpm test -- i18n`, `node scripts/check-locales.mjs`, the new script. Commit.

## The report

At the end, in plain words, without record numbers: what each stage did; the counts (words renamed, hints removed, tests added, scripts run and their results); where the build departs from the plan and why; the list of the hints that remain (stage 2.9) for the owner to decide; and what was left undone, if anything, with the reason.
