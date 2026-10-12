# 0040 — The kind of a paragraph, and passages

Date: 2026-10-12. Status: accepted. Amends ADR 0027, 0029 and 0039.

## Context

A paragraph of a kind was stored three ways: as a container holding
paragraphs (`blockquote`, `verse` holding `verse_line`s, the lists), as a
typed paragraph (`script` with a part, `passage` with a name), and as the
role of a line inside a container (`verse_line.kind`). The kind menu listed
the three as one, so choosing a kind did three different things: it wrapped
or lifted a container, unmade a whole container (in a verse, *Text* turned
every line into text), or retyped one paragraph. The owner could not tell
when a kind applied to a paragraph and when to the whole element.

The catalogue of kinds carried a default look for each kind, repeated in the
editor's style sheet and in the hints ("in italics", "at the right"); no
layout that ships said anything of any kind. So the look of a stage direction
was decided by the kind, in three places, though ADR 0029 had said that a
kind is a meaning and not a look. Line numbering was an attribute of the
verse container, so only verse had it, on one side, and numbers given by
hand could not stand alone, since the count began with the first of them.
Five sources decided what the kind menu showed, and two submenus, *More…*
and *Kinds in hand*, listed the same catalogue for two verbs.

The owner asked for the logic of kinds of text to be thought through anew,
so that such problems are resolved by the logic itself: intuitive, flexible
and simple.

## Decision

Seven rules; everything else follows from them.

1. **The writer chooses one thing: the kind of a paragraph.** Every
   paragraph — a line of verse, a speaker, a list item, a scene heading — has
   one kind. A kind is set on the paragraphs selected, or on the one the
   caret is in: never more, never less.
2. **Passages are consequences, not choices.** Paragraphs of kinds that
   belong together, one after another, form a *passage*: lines a verse,
   quoted paragraphs a quotation, items a list, lines of code a code block.
   The editor shows a passage with a bracket in the margin, named; the
   document sets it as one. Nothing makes or unmakes a container. The fifth
   line of a verse set to text splits the verse around it; set back, it
   joins again.
3. **What belongs together is said by the family of the kind.** The
   families: *text* (forms no passage), *quotation*, *verse*, *script*,
   *glossary*, *list*, *code*, *break*, *draft*. A kind of the writer's own
   has the family of the kind it is based on; one based on text is a family
   of its own, so that paragraphs of a kind *Letter* form a passage named
   *Letter*.
4. **What is said of a passage is said on the passage**, from its bracket:
   the numbering of its lines, its language, *Select the passage*, *Make it
   text*, *Split the passage here*. The button over the text acts on
   paragraphs; the bracket acts on the passage; nothing acts on the element.
5. **A kind carries no look; every look lives in a layout.** The catalogue
   says what a kind means, its family, and what Enter and Tab make. The base
   layout, which every layout is resolved against, has the look of every
   kind; a layout changes what it will. The layout editor shows the look of
   every kind. Hints say what a kind is. Where one writes, the editor shows
   kinds by cues of its own — the bracket and its name, indentation, small
   capitals for a speaker, italics for a direction, capitals for a scene
   heading — which never reach a document.
6. **Numbers belong to what they number.** The lines one writes are numbered
   by a passage; a place in prose by a reference mark (ADR 0039); the lines
   the page makes by the layout (`lineNumbers`). One tool, *Numbers*, offers
   the three, each saying what it numbers. How numbers look — the side, every
   how many — is the layout's, with a passage's own choice over it.
7. **One list of kinds.** The kind menu shows the kinds of the passage the
   caret is in, then the kinds at hand, then *More…*. At hand are the plain
   kinds, every kind the project's texts use, and the template's. There is
   no pinning; the menu learns from use.

An element is no scope of kinds. Its kind may say in which kind its text
begins (`begins` on a kind of element), as before; nothing more. Enter
continues a passage, so an element that is a poem stays a poem.

### The catalogue

Ids are kept where they were, since projects store them; `verse` becomes
`line`, `list` becomes `item`. Each kind has a family, says whether its
paragraphs are *counted* by a numbering, what *Enter* makes after it and
what *Tab* makes of it, and whether it *joins* the passage before it.

| Family | Kinds (id) | Counted | Enter → | Tab |
| --- | --- | --- | --- | --- |
| text | `text` | — | text | — |
| quotation | `quote`, `epigraph`, `attribution` (joins) | quote, epigraph | quote → quote; epigraph → attribution; attribution → text | — |
| verse | `line`, `speaker`, `direction` | line | line; speaker → line; direction → line | indent |
| script | `scene`, `action`, `character`, `dialogue`, `parenthetical`, `transition` | all | as ADR 0029 | as ADR 0029 |
| glossary | `headword`, `gloss` | all | headword → gloss → headword | the other |
| list | `item`, `numbered` | all | the same | indent |
| code | `code` | all | code | — |
| break | `break` | — | text | — |
| draft | `draft` | all | draft | — |
| words | `foreign`, `title`, `term`, `mention`, `highlight` | | | |

*Joins*: an attribution stands in the passage that precedes it, whatever
its family — under quoted verse as under quoted prose; at the top it forms
a quotation passage by itself. A kind of the writer's own takes all of this
from the kind it is based on. The marks `em`, `strong`, `smallcaps`, `sup`,
`sub`, `strike`, `underline`, `code`, `link`, `lang` and `kind` (of words)
stay as they are.

The menu's groups are the families, with *Glossary*, *Code*, *Break* and
*Draft* together under *More*; the words of the interface for the verse
family say that it serves poetry, drama and transcripts alike.

### The shape of a text

In the editor:

```
doc            (paragraph | passage | figure | tabular | equation | row)+
passage        paragraph+        attrs: family, numbering, every, side
paragraph      inline*           attrs: kind, indent, number, counted, margin
parallel_side  (paragraph | passage)+
```

- `paragraph.kind`: the id of its kind; `text` by default. `indent`: steps,
  for lines and items (0 by default). `number`, `counted`, `margin`: as ADR
  0039 gave them to a line of verse, on any paragraph.
- `passage.family`: a family above, or the id of a kind of the writer's own
  based on text. `numbering`: `none`, `counted` or `given`. `every`: a
  number, or null for the layout's. `side`: `left`, `right`, or null for the
  layout's.
- `blockquote`, `verse`, `verse_line`, `script`, the old `passage`,
  `bullet_list`, `ordered_list` and `list_item` go. Lists are paragraphs of
  kind `item` or `numbered` with an indent, as Word stores them; a deeper
  indent is a list within the list. `parallel` stays, as do figures, tables,
  equations and rows, which are structures under *Insert*, not kinds.
- A passage holds no passage. A list quoted in a quotation is a list passage
  between two quotation passages.

**The editor keeps the shape** by a step after every change: a paragraph of
a kind that is not text standing outside a passage is put in one of its
family; a text paragraph inside a passage is lifted out, splitting it; a
paragraph whose family is not its passage's, and that does not join, is
split out into a passage of its own; passages of one family that stand next
to each other are joined, the first one's settings holding; an empty passage
goes. Enter splits a paragraph within its passage and gives the new one the
kind Enter makes; a text paragraph so made is lifted out. Enter on an empty
last paragraph of a passage makes it text. Backspace at the start of an
empty paragraph of a kind makes it text. Tab in a line or an item indents it,
Shift+Tab the other way; in a script or a glossary Tab is as before.

### Numbering

A passage with `numbering: counted` counts its counted paragraphs — those
whose kind is counted, less those with `counted: false` — and the count
begins at the first of them that was given a number, going on from its last
run of digits as ADR 0039 says; a passage without a given number shows
nothing. There is no `start`: *Number the lines from 45* gives the first
counted paragraph the number 45. The number shown every *n* is the
passage's `every`, else the layout's `verse.every` (5); of a list every
item shows its number. With `numbering: given`, only paragraphs given a
number show it, and nothing is counted. A number given by hand is shown as
dark as the text; a counted one faint. The rule is written once in each
side, `src/lib/project/model/lines.ts` and
`crates/core/src/document/numbers.rs`, with the same cases in their tests.
The numbers stand on the passage's `side`, else the layout's `verse.side`
(`left`); margin words stand on the other side.

The numbers in the margin of the editor can be edited in place: pressing
one opens a field for that paragraph's number.

### The layout

- `DocumentFormat::kinds` stays the table of looks by kind id. The looks
  that were the catalogue's defaults become the **base looks**, a table in
  the core (`formats/kinds.rs`, `base_look`) that every layout is resolved
  against: base, then the chain of what a kind is based on, then the
  layout's row. The catalogue entries have no look. The `quote` section of
  a layout feeds the base look of `quote`, as `Resolved::quote` did; a row
  `quote` in `kinds` overrides it.
- `DocumentFormat::verse` is new: `{ "every": 5, "side": "left" }`.
- The layout editor's part for kinds lists every kind of the catalogue with
  its look as resolved, and the writer's own.

### What the core receives and makes

```
{ "kind": "paragraph", "name": "line", "indent": 0, "number": "45",
  "counted": true, "margin": "trochaic", "content": [ … ] }
{ "kind": "passage", "family": "verse", "numbering": "counted",
  "every": null, "side": null, "content": [ paragraphs ] }
```

`name` is the id of the kind (`text` by default); `indent`, `number`,
`counted` (true by default) and `margin` as the editor has them. `Block`
loses Blockquote, Verse, Script, Passage, BulletList and OrderedList and
gains these two. Old shapes are not read by the core; the interface sends
the new.

By family, in every target:

- *quotation*: a block quote (Pandoc `BlockQuote`; Typst `quote`; LaTeX
  `quote`), its paragraphs with the look of their kind, an attribution a
  paragraph of its style after the quoted text.
- *verse*: as ADR 0027 and 0039: a line block for Word and Writer, `gk-line`
  in Typst, a line each in LaTeX, numbers and margin words as before; the
  side now follows the passage and the layout, and in Word and Writer a
  number at the head of its line for `left`, at its end for `right`.
- *script*, *glossary*, *draft*, a family of the writer's own: paragraphs
  with the look of their kind (custom styles, show rules, groups, classes
  as ADR 0029); *draft* goes into no document.
- *list*: a bullet or numbered list, nested by indent, numbered from the
  first item's given number (Pandoc `BulletList`/`OrderedList`); a run of
  items of the other kind within one passage is a list of its own.
- *code*: a code block, its paragraphs the lines. *break*: a paragraph of
  the sign the look gives.
- A numbered passage of any other family is written as verse is, paragraph
  by paragraph with its number, in the look of its kind.
- A passage's `family` that is not of the catalogue is a kind of the
  writer's own based on text: a div with the kind's style around its
  paragraphs.

A document brought in (Word, Writer, Markdown) is read into the same shapes:
a block quote into a quotation passage, a line block into verse, lists into
item paragraphs with indents, styles into kinds where their names are the
catalogue's.

### Old projects

A text written before is rewritten once, when the project is opened, within
the same transaction as ADR 0037's and 0038's changes, outside undo:

- a block quote → a quotation passage of `quote` paragraphs; what stood
  inside it that was no paragraph stands after it in its own passage;
- a verse → a verse passage, `numbering` *counted* where `start` was given
  and *none* otherwise, `every` the old `by` where it was not 5, the first
  counted line without a number given `start`; its lines → paragraphs of
  `line`, `speaker` or `direction` with their indent, number, counted and
  margin;
- a script paragraph → a `script`-family passage of paragraphs of its part;
  an old passage of a name → a paragraph of that kind in a passage of its
  family; lists → list passages of `item` or `numbered` paragraphs, their
  indent the depth, a numbered list that did not start at 1 giving its
  first item that number; a second paragraph of an item → an item;
- passages of one family next to each other are then joined, as the editor
  would join them.

The `hand` of the project goes. In the project's own kinds and in `begins`
of kinds of elements, `verse` becomes `line` and `list` `item`. A reader
of the old shapes stays in `text.ts`, since the history of a project and
the search through projects on disk read texts as they were written. A
version of the application before this one does not read a project
rewritten by it.

## The tools

- The kind button names the kind of the paragraph the caret is in, or
  *Mixed* over a selection of several kinds. Its menu: the kinds of the
  caret's passage (the roles of the family, the current one marked), the
  kinds at hand, *More…* (the catalogue by family, *Your own*, *Make a
  kind…*), and the foot naming the layout.
- The bracket of a passage, at its left, shows the family's name (or the
  own kind's) when the caret is in the passage or the pointer over it. Its
  menu: *Numbers…*, *Language…*, *Select the passage*, *Make it text*,
  *Split the passage here*.
- *Numbers* (the # button): *Number the lines of this passage…* (the dialog
  of ADR 0039, with the three ways and the side), *Reference mark…*
  (Ctrl+Alt+K), *Number the lines of the page…* (the layout's line
  numbering, in the document settings).

## Amended the same day, after the owner tried it

- **Text can be numbered.** Rule 6 gave the numbering of prose to
  reference marks and the page, which left numbered paragraphs out. Text
  still forms no passage of itself, but *Number these paragraphs…* makes
  the paragraphs of text the cursor is in (or those selected) a passage of
  family `text`, numbered, every paragraph counted from 1. A passage of
  text stands only while it is numbered: set to *Not numbered*, its
  paragraphs are lifted out. The kind `text` is counted (it is counted only
  in such a passage, since it stands in no other).
- **Stanzas.** A poem is often written as paragraphs of lines broken by
  hand. Made verse, such paragraphs are read as written: each broken line
  a line, each paragraph a stanza, an empty line between. Made another kind,
  lines with an empty line among them become a paragraph for each stanza,
  its lines broken by hand. An empty line in verse is the break between
  stanzas: Enter on an empty last line begins a stanza, Enter again leaves
  the verse; Backspace takes the break away. An empty paragraph is never
  counted, in either rule of numbering, and the documents keep the room of
  the break (`#v(1em)` in Typst, a skip of a line in LaTeX, an empty line
  of the line block elsewhere).
- **The lines of the page** are numbered from the Numbers menu at once, a
  check that is said of the document of the element in view
  (`DocumentSettings.lineNumbers`, inherited), over the layout's
  `lineNumbers`; the layout keeps its own as the default.

## Why not otherwise

- *Two buttons, Passage and Paragraph*: explicit, but two taxonomies to
  learn, and whether an epigraph is a kind of passage or of paragraph has no
  good answer. One choice and a visible consequence is simpler.
- *Lists kept as the structures they were*: consistent for nothing but the
  list commands; Word's flat items with levels are what every writer knows
  and what the converters already read.
- *Looks left in the catalogue, hints rewritten*: the words would be right
  and the code wrong; the base looks in the layout make the logic true.
- *Numbering per passage only*: a parallel text wants its numbers on the
  outer sides of both columns once; a critical edition wants every fifth
  line in the whole book. Both are served by the layout with a passage's
  choice over it.

## Consequences

- The names `kind`, `indent`, `number`, `counted`, `margin`, `family`,
  `numbering`, `every` and `side` are stored in projects and must not
  change; nor the ids of the catalogue.
- The screen cues are the editor's and fixed for now; settings for how kinds
  look where one writes are a later piece, as the owner asked.
- Later pieces: a speaker's name within a line as a kind of words; styles
  of a document brought in mapped to the writer's own kinds; the levels of
  a template (ADR 0038).
- The e2e scripts of kinds, verse, line numbers and the structure of the
  text are written anew to the new shape.
