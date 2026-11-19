# A box of rich text — the build plan

From the owner's words of 2026-11-19 (the last section of `docs/brief.md`: read it first). This is the plan of the whole, written to be read by the owner before anything is built. **Built**: stage 1, the guard (record 0111, on 2026-11-19), stage 2, the box (record 0112, the same day), and stage 3, the look set by hand, with Typst (record 0113, the same day). **Rich text is not offered yet**: one switch, `RICH_TEXT_OFFERED` in `src/lib/byhand/offered.ts`, keeps it out of the Insert menu and the row of the note window, while everything of it is built in, kept and tried by the scripts (see *Not offered yet* below). Each stage is given its detailed part here (the files, the words, the checks) when it is begun, after the code it touches has been read, and its record when it is built, as the notebook's stages were.

## What it is

A box in a text where the writer sets the look by hand, as in Word: the font, the size and the colour of words, and how a paragraph stands. It is shown where one writes as a sheet of the document's paper with its tools at its head, so that it is plain where formatting by hand holds and where it does not. Everything outside a box is as it was: kinds that mean something, and a look that lives in the layout.

It is wanted with reluctance. So the plan is judged by two things: that someone used to Word can make a simple text look this way or that without learning anything first, and that nothing else in the program has to know that the box exists.

## Decided by the owner

1. **Why**: "users are frustrated about not being able to work as they are used to". It is "a feature I am very reluctant to include".
2. **What for**: mostly "a simple text that they just want to make look this way or that, as they are used to in Word".
3. **How it is shown**: the stretch is "a rich text editor in place, with all the formatting tools on the top of the stretch (but not scrolling off screen), where the writing surface is white if the background is white", "a real and clearly marked wysiwyg editor for the stretch".
4. **The page** (its size and the like) is not set in the box; it stays in the Look.
5. **The name**: *Rich text*, and in Bokmål *Formatert tekst* (answered on 2026-11-19, as the four that follow).
6. **The guard goes out a release ahead of the box** ("what you say is best"): the fewer versions without it, the better.
7. **Insert offers the box in a note** of the notebook, on the notebook's page and in the window of a note alone: "both".
8. **Make it ordinary text warns** before it takes away what was set by hand.

## Proposed in the conversation, and not confirmed

The owner has read these and not objected; none is confirmed. They are the assistant's, to be told of again when they are built.

1. **A box that is put in, not a kind of paragraph.** A paragraph has one kind, so a kind *rich text* could not also be an item of a list or a quotation, and rich text as people know it has both. The box is put in from *Insert*, around the paragraphs selected or empty, and is kept in the text as texts side by side are. The paragraphs in it keep their kinds.
2. **What is not set by hand follows the Look.** The notes at the foot, the bibliography, the headings and the page numbers are set by the Look, outside the box; a box with a font of its own from the start would make every simple document a document in two fonts. This is also how Word does it: the document's defaults, and over them what is set by hand.
3. **What can be set by hand** is a short list (see *What is set by hand* below), and *Clear formatting* takes it away.
4. **One editor.** The box is drawn inside the text it stands in. The cursor goes in and out with the arrows, a selection may cross its edge, and undo, Find, spelling, comments and working together go on as one.
5. **A head that is always there**, thin, with the name; the tools show in it while the cursor is in the box, so nothing shifts on entering and a text with five boxes does not show five rows of tools. The head stays under the side's bar while a long box is scrolled through.
6. **The row is complete in itself**: it repeats bold, italic, underline and the two lists, which are the same commands as elsewhere, because that is where people look for them.
7. **The surface is the document's paper**: white, since a layout has no colour of paper today, with the document's fonts, whatever the scheme of the window.
8. **Sizes are in points**, as in Word, and drawn in proportion: the Look's size of type at the editor's own size of text.
9. **An empty paragraph in a box is a blank line in the document**, since that is how space is made by those the box is for. Outside a box an empty paragraph is nothing, as now.
10. **Notes and citations** (see below): a note's text and the bibliography follow the Look; a citation in the line takes the font, size and colour of the words around it.
11. **A button in the row opens the Look at Type**, for the font and the size of the whole document: the remedy for the font set by hand on everything, which leaves the notes behind.
12. **Never the usual way of writing.** A document brought in never makes a box. A kind of element cannot say that its text begins with one. *Make it ordinary text* takes the box away and what was set by hand with it, after a warning (decided, number 8 above).
13. **Left out** (see *Later, on the owner's word*).

## Offered

Rich text is offered in every build from 0.2.14, on the owner's word of 2026-11-19 at the release ("Offer it"), and with it the headings of a sheet. The switch that kept it out of the Insert menu is gone (`src/lib/byhand/offered.ts`, and what the Arch recipe passed to the building of the interface), and so is the question that was asked before the first rich text in a shared project: the owner's word of the same day is that earlier versions are no worry yet. The guard stays as it was built (record 0111): a version that does not know the form of a project does not open it, and the server keeps it out. The section that waited here for the guide is in the guide, under *Rich text*.

## The rule that keeps it small

**Take the box away, and nothing but the look changes.** The words counted, what is cited, the numbers of the notes, the figures and the tables, what Find finds, what spelling marks, the outline, the comments and where they stand: all the same with the box and without it. A test holds this, on the text that uses everything there is (the fixture of the Org form), once as it is and once in a box.

And its other half: **what is set by hand lives only in a box.** A paragraph that leaves a box, dragged, lifted or pasted outside one, loses what was set by hand, at once, in one place in the code. So no text outside a box can carry a look the tools there cannot show or take away.

## What stands in the code today

Read on 2026-11-19, each to be read again by whoever builds on it.

- **The schema** (`src/lib/editor/schema.ts`): a text is `block+`; a paragraph has its kind, its indent and the settings of its stretch as attributes; the marks are few and none carries a font, a size or a colour. **Texts side by side** (`parallel` with two `parallel_side`) is the one container kept in a text, and its sides hold paragraphs only.
- **Where a container is known.** Texts side by side are named in `editor/` (`plugins.ts`, `parallel.ts`, `WritingTools.svelte`), `project/model/` (`text.ts`, `blocks.ts`, `html.ts`, `portable.ts`, `import.ts`), `org/blocks.ts` and its fixture, `search/` (`passages.ts`, `prosemirror.ts`, `replacing.ts`), `review/drawn.ts`, `history/reading.ts`, `found/atonce.ts`, `mindmaps/html.ts`, `notebook/model/pieces.ts` and `notebook/out.ts`; in the core in `document/` (`mod.rs`, `passages.rs`, `beside.rs`, `pandoc.rs`), `formats/typst.rs`, `export/mod.rs` and `export/reference.rs`, and `import/document/`. That list is the map of where a box must be known.
- **What draws around paragraphs.** The brackets of runs are widgets and marks on paragraphs, nothing kept (`editor/brackets.ts`); figures, tables and notes have views of their own (`editor/views.svelte.ts`, `tables/plugins.ts`).
- **The tools for writing** (`editor/WritingTools.svelte`) stand in a side's bar and in the box of an element; where there is no text they are disabled, not hidden, so the bar does not shift. A bar appears over a selection with the marks.
- **A look** (`Look` in `src/lib/api/documents.ts`, resolved in `crates/core/src/formats/kinds.rs`: the base, then the kind, then the layout) has size, line spacing, alignment, the indents, the first line, space before and after, bold, italic, the case of letters, underline and letters of equal width. It has **no font and no colour**. A layout has no colour of paper.
- **The chooser of fonts** (in this document, elsewhere in this project, all fonts) is inside `look/LookPanel.svelte`, one of the largest files; the fonts of the system are listed by the core (`export/tools.rs`, `system_fonts`, `has_font`), and a font that is missing has a fallback (`formats::fallbacks`).
- **The document handed to the core** (`crates/core/src/document/mod.rs`): `Block::Paragraph` with its kind and settings; the marks of words are a map by name with their attributes as they are, so a new mark arrives in the core without a change of the type.
- **The forms of a document** (`export/mod.rs`, `Target`): PDF by Typst (what the typesetting pane shows), PDF by LaTeX, Word, Writer, LaTeX, Markdown, HTML, EPUB, Typst. Word and Writer get their looks from a pattern document made from the layout, one named style for each kind (`export/reference.rs`), which the text names (`custom-style` in `document/pandoc.rs`).
- **The Org form** (`src/lib/org/`: `write.ts`, `read.ts`, `inline.ts`, `blocks.ts`, `fixtures.ts`, `diff.ts`): a stretch of several blocks is wrapped as `#+BEGIN_numbered`, things side by side as `#+BEGIN_row`, what is said of what follows stands on an `#+ATTR_GLAUKOPIS:` line, and what Org cannot say of words is `[words]{what}`. A block of a name that is not known becomes a kind of the writer's own of that name.
- **What an older version does with what it does not know.** The binding of the editor to the project's document (y-prosemirror 1.3.7, `sync-plugin.js`, `createNodeFromYElement` and `createTextNodesFromYText`) takes out of the document any block or any words with a mark that its schema cannot make, and the taking out goes to everyone in a shared project. A project file says which form it was written in and is refused by an older version (`projectfile.rs`, `FORMAT`); those who share compare the server's protocol only (`sharing.rs`, `PROTOCOL`). Nothing compares the form of the texts.
- **The scripts near this part**: `e2e/kinds.mjs`, `kinds-of-passage.mjs`, `look.mjs`, `org.mjs`, `paste.mjs`.

## The design, part by part

### The box

- **Made** from *Insert → Rich text*: around the paragraphs selected, or empty where nothing is selected.
- **Holds** what a text holds: paragraphs of every kind, figures, tables, formulas, breaks. Not another box, and not texts side by side; the sides of texts side by side hold no box.
- **Left** by Enter on an empty paragraph of text at its end, as a list is left. Backspace in an empty box takes the box away. (As built: the arrows go in and out where there is a line to go to, and make no paragraph; record 0112 says why.)
- **Its head**: the name at the left; the tools; at the right a menu with *Select*, *Make it ordinary text* and *Delete*. *Make it ordinary text* asks first where anything in the box is set by hand, saying that it will be taken away; where nothing is, it does not ask.
- **In small places** (the box of an element in the diagram, a narrow side) the tools fold into a menu in the head, as the side's bar folds.
- **In the code it is not called rich text**: `editor/RichText.svelte` is the editor of every text already. The part is *by hand* (`src/lib/byhand/`, `byhand.ftl`); the words the user sees say *Rich text*, and so do the block of the schema and of Org, `rich`. **The interface and the guide never say "box"**, which is the notebook's word: what is seen is called a sheet.

### What is set by hand

| Of | What | How it is kept |
| --- | --- | --- |
| words | the font | a mark with the name of the font |
| words | the size, in points | a mark |
| words | the colour | a mark |
| a paragraph | alignment: left, centred, right, justified | the measures of a look, said of this paragraph, laid over what the layout gives its kind |
| a paragraph | line spacing; space before and after | the same |
| a paragraph | the indents and the first line | the same |

Three marks and not one, so that a colour can be laid over words of several sizes without cutting them up. A paragraph's part is the measures a kind's look already has, resolved in the one place that resolves looks: the base, the kind, the layout, and then what was set by hand.

Bold, italic, underline, small capitals, raised and lowered are the marks there are. The kinds of words (foreign, title, term) may stand in a box and keep the look the layout gives them.

### The row of tools

Font (the chooser of the Look, lifted out of `LookPanel.svelte` along its seam, not copied), size, colour (a few plain colours and a field for any other); bold, italic, underline; the four alignments; list and numbered list; *Paragraph…* (line spacing, space, indents); *Clear formatting*; *The whole document…*, which opens the Look at Type.

No new keys at first.

### The surface

White, with a line around it. The colours of the selection, of what Find found, of spelling, of comments and of the marks of changes are the scheme's today, chosen for its own paper; in a dark scheme they are given again for the white surface.

What it shows truly: font, size, colour, alignment, spacing. What it cannot show: where the lines and the pages break, which the typesetting pane shows.

### Notes and citations

- **A note** has its number in the box and its text at the foot of the page or at the end, outside it. The text follows the Look; in it, the marks there are, and nothing by hand at first. The numbers run through the document.
- **A citation in the line** is written by the reference style. It takes the font, size and colour of the words around it; the style's own italics stay.
- **Citations in notes** follow the Look, as notes do. **The bibliography** is made by the document and is the Look's.

### In Org

```org
#+BEGIN_rich
#+ATTR_GLAUKOPIS: :align center :space-after 12pt
Dear all, [welcome]{size=20 colour=#a02020} to the [opening]{font="EB Garamond"}.

- An item, still a list
- With [see [cite:@nagy1979 p. 73]]{colour=#a02020} inside it

#+BEGIN_QUOTE
A quotation, still a quotation.
#+END_QUOTE
#+END_rich
```

- The box is a block, as a numbered stretch of several blocks is; other tools read it as a block they do not know, with ordinary paragraphs in it.
- What is set by hand of a paragraph stands on the settings line before it, in the words the looks of the writer's own kinds are written in today (`indent-left`, and so on).
- What is set by hand of words is the bracket there is, with `font`, `size` and `colour`; together with a kind as `[Iliad]{title size=14}`.
- An empty paragraph in a box is written with a sign of its own, so that it reads back.
- **To be read before it is built**: how the names `numbered` and `row` are kept apart from a kind of the writer's own of the same name, for `rich` must be kept apart the same way; how something is said of one item of a list; how the reader takes a value with a space in it.

The cost is plain: a text with little set by hand reads well, and one with five fonts in a paragraph is brackets. Every change of formatting is a change of the Org, so the history and the review show it.

### In each form of a document

| Form | What is set by hand |
| --- | --- |
| PDF by Typst, and Typst | all of it |
| PDF by LaTeX, and LaTeX | all of it with LuaLaTeX and XeLaTeX; with pdfLaTeX the font is the document's, and the document says so |
| Word and Writer | all of it, as named styles made in the pattern document, one for each combination that occurs, based on the style of the kind |
| HTML | all of it |
| EPUB | all of it written; a reader of e-books may put its own font, size and colours over it |
| Markdown | the words; nothing set by hand |

A font that the machine does not have gets the fallback and the notice a layout's font gets today.

### Older versions, and shared projects

Built as stage 1; record 0111 says how, and what was chosen in the building. In short:

- **The texts have a form, a number**, 1 today (`src/lib/editor/form.ts`). A project's document and the notebook's say theirs in a map of their own, where the number is a key set once, so that it can be read from the bytes of a change before anything of it is taken in.
- **A project or a notebook of a later form is not opened**, and says that it was written by a later version.
- **What the others send of a later form is not taken in**: the sharing stops for the while, the project stays open, and what is written is brought along when the version knows the form.
- **The server keeps the form of each project**, is told by each application which form it knows, lets no one in who does not know the project's, and lets go those who do not when it rises, before anything of the new form reaches them. That is what keeps the versions that are out (0.2.13 and before) from deleting a box: to them the server is not within reach.

**What the box must do with it** (stage 2):

All four are built with stage 2 (record 0112).

- **`FORM` becomes 2** with the box in the schema, and **the first box put into a document raises the document's form** (`raiseForm`, a change of its own, made before the box is), in a project and in the notebook alike. A document in which no box was ever made stays of the first form, open to every version.
- **A project file** (`.glaukopis`) written from a project of the second form is written with a higher number of its own (`projectfile.rs`, `FORMAT`), so that the versions that are out refuse the file by the guard they have, and do not open it and lose the box.
- **Making the first box in a shared project warns** that all who share it need this version, since the others will be kept out until they have it.
- **The server must be the one of stage 1 or later** before the box is used in a shared project; an older server lets everyone in. `docs/server.md` says so.

## The stages

1. **The guard. Built** (record 0111): the form of the texts in a project's document and the notebook's, asked before either is opened and of everything the others send; the server keeping out those who do not know a project's form; the words; the tests, one of them binding an editor to a document that holds a block and a mark its schema does not know, which it deletes; `e2e/later-form.mjs`, and `e2e/later-form-shared.mjs` with the real server, two applications and the script as a later version. Nothing of the box. It goes out a release ahead of the box, and the server is updated with it.
2. **The box, with nothing set by hand. Built** (record 0112), and smaller than this stage feared: the box is a block of its own in the editor only, and everything else reads a text as a run of blocks that each say they stand in a box, as paragraphs say how they are numbered; so the rule below holds by how a text is read, the core is not told of the box, and the places that had to learn of it are the editor, the reading and writing of a text, Org and the drawn text. As it was planned: The block and its place in the schema; *Insert → Rich text*, the keys in and out, the head and its menu, the white surface; every walk of a text's paragraphs going into the box, held by the test of the rule; the Org block; the core setting what is in a box as it sets any text. What one sees: a white sheet in the text that changes nothing in the document. This is the stage that touches the most places, and it is checked before any tool is added.
3. **Set by hand, and seen. Built** (record 0113). As it was planned: The three marks and the paragraph's measures; the row of tools with the chooser of fonts lifted out; *Clear formatting*; the rule that nothing by hand lives outside a box; the Org forms; Typst, so that the typesetting pane and the PDF show it; the empty paragraph as a blank line. From here the box does what it is for.
4. **The other forms of a document.** LaTeX; Word and Writer with their made styles; HTML and EPUB; Markdown. Four parts that do not touch each other, for four agents. **Built** (record 0113, its two addenda), in the main thread and not by agents: LaTeX, HTML and EPUB, Word and Writer with a named style for each look, and Markdown with the words alone.
5. **Around it.** **Built of it**: the tools folded into a menu where the head is narrow (record 0113, its third addendum); the sheet moved by its name, and words moved by dragging them (record 0114); the look of the document drawn on the sheet, and what is set by hand drawn where a text is only shown (record 0113, its fourth addendum). Headings on the sheet, which are paragraphs and no elements (record 0115). The ground of words, a highlight with a colour, which is of every text and no part of rich text, with a highlighter in the head of a sheet too (record 0116). The rest is left, and with it the looks of the kinds of paragraph on the sheet, which the owner would rather not have for now. As it was planned: The colours on the white surface in a dark scheme; the tools folded in small places; the history and the review; Find and Replace; copying between boxes; the notebook; the mind maps; the guide; Bokmål with the English, the other languages in a round. Separable parts again.

Stages 2 and 3 are the main thread's with one agent at a time, since they settle the shape; 4 and 5 are fanned out when 3 holds.

**Checked at each stage**: the tests of the interface and of the core; a new script `e2e/rich-text.mjs` from stage 2, grown with each stage (make a box, write in it, set a font and a colour, see the typesetting pane, save as Org and open it again, make it ordinary text); `org`, `kinds`, `paste` and `look` where they are touched; `languages` when the words are in.

## Later, on the owner's word

- **Pasting from Word or a browser with its look.** At first, what is pasted into a box arrives as it does anywhere: the words and the marks there are. Keeping fonts, sizes and colours from outside needs a rule for what is cleaned away.
- **Setting by hand inside a note.**
- **A colour behind words**, tab stops, columns in a box, a frame placed on the page.
- **A text that begins as a box**, said by a kind of element or a setting: cheap, and the step that makes the box the usual way of writing.
- **A Word file brought in as a box**, with its look.
- **A font and a colour in the look of a kind**, so that a layout and a kind of the writer's own can say them too.
- **A heading made by hand turned into an element**: Alt+Enter does it today for any paragraph; whether it should be offered in the box's row.

## What can go wrong

- **The Org stops being readable** where much is set by hand. Nothing in the plan mends that; it is the price.
- **The promise of wysiwyg.** The box shows the look and not the breaking of lines. Said in the guide in one sentence; the typesetting pane beside it is the page.
- **It becomes the usual way**, and the outline, the numbering and the table of contents know nothing of headings made by hand. The plan holds the line at three places (number 12 above); what is asked for after it has been used decides the rest.
- **The places a box must be known** are many (the list above). The test of the rule finds a walk that forgot it; a view that forgot it is found by the script and by looking.
- **Two of the largest files** are touched: `LookPanel.svelte` (the chooser lifted out) and the tools for writing. Both along a seam, nothing added to them.
