# 0113 — The look set by hand, in rich text

Date: 2026-11-19. Status: built on 2026-11-19 (the third stage of `docs/plans/a-box-of-rich-text.md`); its choices not yet confirmed by the owner; not offered yet (0112, 16). From the owner's words of the same day (the last section of `docs/brief.md`). Builds on 0112 (the box) and 0111 (the form of the texts). Within a box of rich text, and nowhere else, it sets aside the rule of 0029 and 0040 that there is no direct formatting: no font, size or colour in the tools.

## Context

- **What the box is for**: "a simple text that they just want to make look this way or that, as they are used to in Word", with "all the formatting tools on the top of the stretch".
- **The page stays in the Look** (the owner). So what is not set by hand follows the Look: the notes, the bibliography, the headings and the page numbers are set by it, and a box with a font of its own from the start would make every simple document a document in two fonts.
- **A look has measures already** (0029): size, line spacing, alignment, indents, the first line, space before and after. It has no font and no colour.
- **The core writes a document for Pandoc**, which writes each kind of document; what Pandoc has no word for is written raw, in the words of the kind of document (`document/pandoc.rs`, `passages.rs`).

## Decision

1. **Of words, three things are set by hand**: the font, by its name; the size, in points; the colour. Each is a mark of its own (`font`, `size`, `colour` in `editor/schema.ts`), so that a colour is laid over words of several sizes without cutting them up. Bold, italic, underlined and the other marks are those every text has.
2. **Of a paragraph, how it stands**: across the line (left, centred, right, justified), its line spacing, the space before and after it, its indents from the left and the right, and its first line: the measures a look has, said of this paragraph alone (`hand` on the paragraph; `HandLook` in `byhand/hand.ts`) and laid over what the layout gives its kind. What is not said is the layout's.
3. **What is read of either is read through one place** (`byhand/hand.ts`), which lets through only a name of a font without what could be read as something else, a size between 4 and 400 points to the half point, a colour of six digits, and lengths with their unit. The core reads them with the same care.
4. **It lives only in a box.** An editor takes it away, in the same step, from whatever comes to stand outside one (`byhand/rule.ts`): a paragraph lifted or dragged out, what is pasted elsewhere, a box made ordinary text. Nothing is written by hand into a text outside a box, wherever its blocks came from (`project/model/blocks.ts`). So no text holds a look that the tools of its place could not show or take away, and a version that knows no box never meets one of these marks.
5. **Not in a note at the foot**, though the note is written in a box: its look is the layout's.
6. **The tools stand in the head of the box** (`byhand/BoxHead.svelte`) and show while the cursor is in that box: a list of fonts, those used in this text first; a field for the size, with the usual sizes offered; a menu of colours, eight plain ones and *Another…*, which opens the system's own chooser; bold, italic, underlined; the four alignments; list and numbered list; a small panel, *Paragraph*, with the line spacing, the space before and after, the indents and the first line; and *Clear formatting*. Each shows what is set of what is selected, and nothing where the words selected differ. The head is as high with the tools as without.
7. **With nothing selected**, a font, a size or a colour is set for what is written next, as bold is; how a paragraph stands is set of the paragraph the cursor is in.
8. ***As the document*** in the list of fonts and the menu of colours, an empty field for the size, and an empty field of the panel, take what was set by hand away again.
9. ***Clear formatting*** takes away everything set by hand of what is selected, or of the paragraph the cursor is in: fonts, sizes, colours, and how the paragraphs stand. Bold and the other marks stay.
10. ***Make it ordinary text* asks first** where anything in the box is set by hand (the owner: "warn"), saying that it is taken away; then the rule (4) takes it away with the box, in one step that undo takes back.
11. ***The look of the whole document…***, in the menu of the box in a text of a project, opens the Look at Type: the remedy for a font set by hand on everything, which leaves the notes behind.
12. **Drawn in proportion.** Where one writes, the size of type of the document is the editor's own size of text, and a size and a length set by hand are drawn as so much of it (`--hand-base`). So a text looks alike in the editor whatever the Look's size of type, and a word set larger is as much larger as on the page.
13. **An empty paragraph in a box is a blank line in the document**, in every kind of document; anywhere else it is nothing, as before.
14. **In Org**, what is set of words is said in the bracket there is for what Org cannot say, with no name before it, as the language of some words is: `[welcome]{size=20 colour=#a02020}`, `[opening]{font="EB Garamond"}`; one bracket where the very same words have several, one within another where they reach differently. Of a paragraph it stands on the settings line before it: `#+ATTR_GLAUKOPIS: :align center :space-after 12pt`. Where a list or a verse cannot say it of one of its paragraphs, they are written in blocks of their kind, as whenever a list would not read back. An empty paragraph in a box is Org's break of the line alone on its line, `\\`.
15. **In the typeset page and the PDF** (Typst) all of it is set (`document/pandoc.rs`, `passages.rs`): the words within `text(font:, size:, fill:)`; a paragraph with its alignment, line spacing and first line said for it alone, room added before and after it, and, where it is set in from the left or the right, in a block of its own. **The other kinds of document set the words and the paragraphs without it for now**: the fourth stage.
16. **The form of the texts stays the second**: the marks and the paragraph's look live only in a box, and a box is of the second form. No version with the second form and without them has been released.

## Choices made in building this, which the owner has not been asked about

1. **What can be set**: the short list of 1 and 2, and nothing else. No colour behind words, no tab stops, no borders.
2. **The colours of the menu**: black, grey, red, orange, green, blue, purple, brown, and *Another…*.
3. **The sizes offered**: 8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72; any other is written into the field.
4. **A number alone** in the panel is points for the space before and after, and centimetres for the indents and the first line.
5. **The row repeats** bold, italic, underlined and the two lists, which the bar of the side has too.
6. **The way to the Look is in the menu of the box**, not a button in the row.
7. **A font the computer has not** is set, where the page is set, in the document's font, and nothing is said of it yet.
8. **A paragraph set in by hand** begins its first line with the rest unless a first line is said by hand too, whatever the layout says of first lines.
9. **How a point of a list or a line of verse stands by hand** is kept, drawn where one writes, and written in Org; on the page it is not set yet. What is set of its words is.
10. **Nothing is pasted with its look from another program**: the three marks are read from Glaukopis's own text alone.
11. **No keys of their own.**

## Left for the stages that follow

- **The other kinds of document** (stage 4): LaTeX, Word and Writer with named styles made for each combination, HTML and EPUB; Markdown has the words only. A font the computer has not, told of.
- **Around it** (stage 5): the tools folded into a menu where the head is narrow (now those that do not fit are not shown); the colours of what is drawn over a text, on the white sheet in a dark scheme; how a point of a list and a line of verse stand, on the page; copying between boxes; the other languages.

## Checked

- `src/lib/byhand/hand.test.ts`: what is kept of a font, a size, a colour and a paragraph's measures, and what is not. `commands.test.ts`: setting and taking away each, one over another, for what is written next, kept to the box; what the tools are told; clearing. `rule.test.ts`: taken away outside a box in the same step, with a box made ordinary text, from a mark put on outside, from a note; what a change did not touch left alone.
- `src/lib/project/model/boxes.test.ts`: kept in a box and nowhere else when a text is written without an editor; the rule of 0112, without what is set by hand. `src/lib/org/org.test.ts`, with all of it in the project that uses everything: the bracket, the settings line, an empty paragraph, lists and verse that say it of one paragraph.
- `crates/core/src/document/passages.rs`: the words and the paragraphs in Typst, from the document as the interface hands it over; what is no font, size, colour or measure not set; nothing outside a box; an empty paragraph a blank line in a box in every kind of document.
- `e2e/rich-text.mjs`, in the running application: the tools in the head while the cursor is in the box, the head as high without them; a size typed, a colour from the menu, a font, bold, centred, room after from the panel, which stays open after Enter; the tools showing what is set; any colour as from the system's chooser; the typesetting pane setting it (looked at: the word larger, bold, in its colour and centred on the page); Clear formatting; the Org of the readable copy; the question before ordinary text, and nothing by hand left outside a sheet.
- Not tried: the system's own chooser of colours, which no script can press; a font the computer has not.

## Addendum, 2026-11-19: LaTeX, a page of the web, and a book for e-readers

The first part of the plan's fourth stage. What is set by hand is now set in three more kinds of document; Word and Writer are still to come, and Markdown has the words alone, as was planned.

- **LaTeX, and the PDF set by it.** The words stand in a group with the size and its line (`\fontsize{20pt}{24pt}\selectfont`), the colour (`\color[HTML]{A02020}`), and the font where LaTeX can take the fonts of the computer and has this one (`\IfFontExistsTF{…}{\fontspec{…}}{}`, where that is defined: LuaLaTeX and XeLaTeX). With pdfLaTeX, or a font that is not there, the words are in the document's font and the document is set all the same; a name with a sign LaTeX reads as its own is not given to it. A paragraph stands in a group of its own, as a paragraph of a kind does, with only what was said: `\centering`, `\raggedleft`, ragged or justified, the room at its sides, its first line, its line spacing, and room before and after.
- **A page of the web and a book for e-readers.** The words stand in a span with its style (`font-family`, `font-size`, `color`); a paragraph in a division with its style (`text-align`, `line-height`, room within the division before and after, margins at its sides, `text-indent`). Where a first line is said, or the paragraph is centred or set to the right, the class `gk-hand-first` and one rule of the style sheet have the paragraph begin as the division says and not as the layout has every paragraph begin. A reader of e-books may put its own font, size and colours over it.
- **Choices not asked about**: a paragraph centred or set to the right begins its first line with the rest, in all three; in LaTeX a paragraph set in by hand keeps the first line the layout gives it unless one is said (in Typst it has none); the line spacing on a page of the web is 1.2 times what was said, as single spacing is elsewhere.
- **Checked**: `crates/core/src/document/passages.rs` for what each is given, and `export/mod.rs`, `what_is_set_by_hand_in_every_kind_of_document`, which writes whole documents with the real Pandoc, Typst and LaTeX: the pages are made by Typst and by LuaLaTeX with a font no computer has among those set by hand; the page of the web has its spans, divisions and rule; the e-book is written; Markdown has no style in it.
