# 0066 — The settings in plain words, the preview's zoom, keys for the kinds, and five faults

Date: 2026-10-24. Status: accepted by the owner on 2026-10-24, from their comments after trying the build of 0065, an assessment with recommendations, which they accepted ("Please make the plan"); to be built from `docs/plans/settings-zoom-keys-for-kinds-and-five-faults.md`. Amends 0065 (the hints: the settings window's go too), 0054 and 0042 (the defaults of new documents in the settings), 0040 (the text view's cues of the kinds), 0041 (the numbers of lines, as Typst places them), 0046 (the look of a kind with small capitals), 0044 (LaTeX's language), 0056 (the chips of the preview, now named *look chips*).

## Context

The owner, after the build of 0065: the settings window's help texts go, but the Hunspell one stays; *Default view for new projects*, *Default document type*, *Default look*, *Default citation style*; the defaults they set cannot be reset, and choosing another document type should at least bring its look and style; *Display look chips in the preview window*; the Fraktur models should say which languages they were trained on; the fields of *Your details* have double borders. The preview should be zoomable. Small capitals chosen for a kind show as normal letters. The box of a kind in Look closes at every change, for Text and others but not for Speaker. No kind should be indented in the text view but Quotation, Code and Attribution, unless others need it. Each document type should have keys for its kinds, Ctrl+Alt+0–9, reassignable in Look. The numbers given by hand are missing from the preview and the PDF, though Word and Writer show them. A PDF set by LaTeX failed on `Unknown option 'norsk'`.

What was found:

- **The defaults.** `defaultTemplate`, `defaultFormat` and `defaultStyle` (`api/system.ts`) are chosen by three choosers in the settings with no empty choice, so a default once set cannot be unset. A default look applies only where the document type brings no layout: the type's layout wins (`DocumentType.svelte`). The type chosen for a document does not touch the document's own look and style (`own.format`, `own.style`), chosen in Look.
- **Small capitals.** Typst sets small capitals only from the font's own (`smallcaps()`), and does nothing where the font has none: tested, DejaVu Sans renders `smallcaps[hello]` and `hello` alike, pixel for pixel; Libertinus has them. Times New Roman, the Manuscript layout's font, has none. The text view synthesizes them (`font-variant-caps`), so the two disagree.
- **The kind box** in Look is `<details open={k.id === kindInView}>`: its open state is not kept by Look, and the boxes of the kinds the document uses are rebuilt after a change, which closes them; Speaker is not in use.
- **Indentation.** The text view indents by the cues of `editor/kinds.ts`: quote, attribution, epigraph, line, speaker, direction, character, dialogue, parenthetical, gloss, item and numbered.
- **Keys.** Ctrl+Alt+digits is what Word and Google Docs use. On Windows, Ctrl+Alt is AltGr, and on a Norwegian keyboard AltGr with 2, 3, 4, 5, 7, 8, 9 and 0 types @ £ $ € { [ ] }; the key dispatcher already lets a chord through as typing when `getModifierState('AltGraph')` says so (`keys.svelte.ts`), so the digits are safe. Ctrl+1–4 and Ctrl+0 are taken; Ctrl+Alt+digits are free. The document type (`Template`) holds the kinds a type has, and the natural place for their keys.
- **The numbers given by hand.** The lines of the owner's Antigone are text paragraphs with line breaks, not verse: the speaker is set in by its cue, the lines are not. For a number on a line after a break, the core places it with `gk-beside`, which asks Typst for the position (`here().position()`) before the break is laid out, so that the number is placed from the end of the previous line and falls off the page. On a paragraph's first line the position is right, which is why 10 and 15 show. Verse lines (`gk-line`) are blocks of their own and are not affected. Word and Writer write the numbers into the line as text. An empty box before the placement makes Typst lay the break out first: tested in raw Typst with the six lines, all numbers show, a number in the middle of a wrapped line too. Inline numbers set in the margin (`gk-refmark`) and words in the margin use the same placement.
- **LaTeX.** Pandoc hands babel the language as the class option `norsk`, which babel knows only through TeX Live's package of European languages. With babel's option `provide=*` it takes the language from its own locale files instead: tested on this computer, Norwegian compiles with pdfLaTeX and LuaLaTeX whether the package is installed or not, English unchanged, and the hyphenation is the same with the package installed (the patterns come from the format either way). An earlier failed test was a test file named like a file of TeX Live. Without the patterns installed, babel's log says the hyphenation rules fall back to English.
- **The double borders** are seen in a screenshot: a second frame inside each field of *Your details*. The cause is to be found with the inspector; the field component draws one frame itself.

## Decision

### The settings window

- **No help text** in the settings but the spelling section's about Hunspell: the colours, the text size, the editor's font, the depth, the new project's view, *Your details*, the programs, the data, the logs and the chips lose theirs.
- **Names**: *Default view for new projects*; *Default document type*, *Default look*, *Default citation style*; *Display look chips in the preview window*.
- **A "none" choice** for the three defaults: *None, as the document type has it*. With none, a new document is of the plain type, and a type without a layout or style of its own takes the core's own defaults, as the plain type does today.
- **Choosing a document type for a document drops the document's own look and style**, so that the type's take hold, in one undoable step with the choice.
- **The Fraktur models** are named by their languages: *Fraktur (Gothic type), German* for Tesseract's, *Fraktur (Gothic type), Norwegian and Danish* for Glaukopis's own, which was trained on Norwegian and reads Danish.
- **The double borders go.**

### The preview

- **The typesetting pane is zoomable**: Ctrl with the wheel over the pages, Ctrl with plus and minus, Ctrl+0 for the page width, and a percentage in the pane's head with a menu of steps and *Fit the width*. The zoom is the window's, kept with the arrangement. The chips follow, being measured in the page's width.

### The Look pane

- **Small capitals where the font has none** are set as capitals at four fifths of the size: the core asks the font whether it has small capitals (its OpenType feature `smcp`) and writes Typst accordingly, wherever it writes `smallcaps`: the kinds, the headings, the title, the running head.
- **The kind boxes keep their state**: Look remembers which are open, by kind, and a change does not close one.

### The text view

- **Indentation** stays for Quotation, Attribution, Code (which gains the quotation's), Epigraph, which is a quotation by nature, and the lists, whose bullets and numbers hang; it goes for verse lines, Speaker, Stage direction, Character, Dialogue, Parenthetical and Gloss, which only mimicked the page.

### Keys for the kinds

- **Ctrl+Alt+0 to Ctrl+Alt+9 choose kinds of paragraph**, as the document type assigns them. Ctrl+Alt+0 is always Text. The types that come with Glaukopis assign their digits sensibly: the plain type Quotation, Verse, Bullet list, Numbered list, Code…; a play Speaker, Stage direction, Verse…; a screenplay its kinds.
- **The assignment is the document type's**, kept with it, and changed in Look under *Paragraph kinds*: each kind's box has a row *Key*, a chooser of the digits and *None*; a digit taken from another kind leaves that kind without. A type that comes with Glaukopis becomes one of the writer's own when its keys change, as any change to it does.
- **The Paragraph kind menu shows the keys** beside the kinds, and the key sheet lists them.
- Kinds of words have no keys yet.

### The two faults of the core

- **Numbers on later lines**: `gk-beside` and `gk-refmark` begin with an empty box, so that Typst lays the line break out before it answers where the line is.
- **LaTeX**: the core adds the class option `provide=*`, so that babel takes any language from its own locale files when its package is missing, and the output is the same when it is there. Where babel's log says the hyphenation rules of the language fell back to English, the export warns that no hyphenation patterns are installed for the language, naming the package of TeX Live to install. The Arch package names `texlive-langeuropean` among the optional packages.

## Choices made in writing this, which the owner has not been asked about

1. **Epigraph and the lists keep their indentation**, beyond the three the owner named; the owner asked to be told, and this is the telling. The rest lose it.
2. **Code gains an indentation** in the text view, since the owner named it among the three, and it had none.
3. **The keys are kept in the document type** and set in Look, as the owner asked, which means that setting them on a type that comes with Glaukopis makes a copy of one's own, as any change to such a type does.
4. **Ctrl+Alt+0 is Text** on every type, so that one key always leads back to plain text.
5. **`provide=*` always**, rather than only when the package is missing: the output is the same, the locale files are babel's recommended way, and one option is simpler than asking `kpsewhich` before every run.
6. **The zoom is the window's**, not the project's, like the pane itself.
7. **Small capitals are synthesized at four fifths**, the usual size of synthesized small capitals.
8. **The box of a kind in Look** is remembered by kind for the life of the pane, not kept in the arrangement.

## Why not otherwise

- *Ask Typst to synthesize small capitals*: it does not, in 0.15.
- *Set numbered text paragraphs line by line, as verse*: a heavier change than the empty box, which is tested.
- *Detect the language package and use babel's own file when it is there*: no gain in the output, and one more program to run.
- *Keys per document instead of per type*: the owner wants them per type.

## Consequences

- `SettingsView.svelte` and `settings.ftl` lose the hints and take the names and the none choice; `DocumentType.svelte` drops the document's own look and style with the type; `ocr.ftl` names the Fraktur models.
- `PreviewPanel.svelte` and `panes.svelte.ts` gain the zoom; the keys gain three entries of the typesetting pane.
- `formats/typst.rs` and `export/typeset.rs` learn whether a font has small capitals; `LookPanel.svelte` keeps the open boxes; `editor/kinds.ts` loses eight indentations and gains one.
- `templates/mod.rs`, `api/templates.ts`, the templates that ship, `keys.svelte.ts`, `editor/keys.ts`, `WritingTools.svelte` and `LookPanel.svelte` carry the keys of the kinds.
- `formats/typst.rs`'s preamble and `export/latex.rs` carry the two fixes; the LaTeX log is read for the hyphenation warning; `PKGBUILD` names the language package.

## Addendum, 2026-10-24: as built

Built on 2026-10-24 from the plan by two agents in worktrees (stages 5, 1 and 2; stages 3 and 4), merged into main. Where the build departs from the plan:

- **LaTeX's language is not always given `provide=*`.** Always given, it broke German PDFs ("'ngerman' not valid with the 'ini' mechanism") and Greek by pdfLaTeX. The export runs LaTeX as before, and only where babel fails with *Unknown option* runs it again with the option; the owner's case was reproduced by hiding the Norwegian package, and the retry makes the PDF. The LaTeX test makes a German PDF too.
- **The hyphenation warning** is read from a line the preamble writes, not from LaTeX's log, which Pandoc keeps to itself: a line in the form Pandoc passes on (*Missing character:*) gives the language's pattern number beside English's.
- **The none of the defaults** falls back to a fresh installation's defaults (Manuscript, Chicago notes and bibliography) where a type has no layout or style of its own; *Your usual* is said only where one is chosen.
- **The double borders** came from `src/settings.css`, whose rule for inputs in the settings' forms drew a frame inside the field's own.
- **The zoom** has a fourth key, Ctrl+=, since + sits over = on an English keyboard; the keys hold while the pane has the focus or the pointer, so that the diagram keeps its Ctrl+0; pages wider than the pane begin at its left and scroll sideways, the middle of the view staying where it was. The key sheet has a place of its own for them.
- **The OCR languages' hint** in the settings stays, as the Tesseract twin of the Hunspell one. The language server's package keeps its title; the application names the models in its own words.
- **Small capitals** are made of the small letters only, at four fifths, the capitals left whole, as a font's own and the text view have them; the font's feature list is read by hand, with no new crate; a rule for the small capitals Pandoc writes (kinds of words, the mark) is added where the text's font has none. A part whose own font has small capitals, in a document whose font has none, keeps the made ones for Pandoc's, since a show rule of Typst cannot be undone.
- **The keys of the kinds** share one word in the key sheet, which names each digit by its kind; with no document open it shows one row, Ctrl+Alt+0–9. Where a kind has an older key too (Ctrl+' for a quotation, Ctrl+Shift+8 and 7 for the lists), the Paragraph kind menu shows the Ctrl+Alt key and the sheet both. `templates-from-formats.mjs` carries the keys into the journal, publisher and style-guide types.
- **The digits** of the types that come with Glaukopis: the plain document, the articles, papers, theses, reports, poems, letters, blog posts, news, every journal and style guide: 1 Quotation, 2 Verse, 3 List, 4 Numbered list, 5 Code, 6 Epigraph, 7 Attribution; a book and its publishers add 8 Headword and 9 Gloss; a novel, its manuscript, a short story and a collection add 8 Break; a play: 1 Speaker, 2 Stage direction, 3 Verse, 4 Quotation, 5 List, 6 Numbered list; a screenplay: 1 Scene heading, 2 Action, 3 Character, 4 Dialogue, 5 Parenthetical, 6 Transition. 0 is Text in every type.
