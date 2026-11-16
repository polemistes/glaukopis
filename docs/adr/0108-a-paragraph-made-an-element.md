# 0108 — A paragraph made an element

Date: 2026-11-16. Status: built on 2026-11-16, its choices not yet confirmed by the owner, and added to later the same day (the last section); from the owner's words of the same day ("Then a feature in the text view. When pressing alt+enter with the cursor inside a paragraph, the paragraph text should be made an element. If alt+enter is pressed when text is selected, the selected text becomes the element. The text before the selection belongs to the previous element, and the text after belongs to the new element.").

## Context

- **Alt+Enter in a text made a heading at the cursor** (0062): what followed the cursor in its paragraph became the name of a new element, and the paragraphs below it the new element's text. At the start of a paragraph the whole paragraph was the name; in its middle, the tail; at its end the name was empty.
- **The owner wants the paragraph, or what is selected.** Asked what the very end of a paragraph should do, the owner chose one rule everywhere in a paragraph: the paragraph becomes the element there too, and an empty element is begun by Enter and then Alt+Enter in the empty line.
- **The parting of a text at the cursor** is a function of its own (`project/text/heading.ts`), tested; `split` in `MapText.svelte` makes the element and cuts the old text.

## Decision

1. **With nothing selected, the paragraph the cursor is in becomes the name of a new element**, the whole of it, wherever in it the cursor stands: at its start, in its middle, at its end. The paragraphs before it stay in the element they were in; the paragraphs after it, to the end of the text, become the new element's text. The paragraph itself goes from the old text. **In an empty paragraph** the name is empty, the paragraphs below go in, and the empty paragraph goes: so Enter and then Alt+Enter begins an empty element after what was written, and leaves no empty line.
2. **With text selected, what is selected becomes the name.** What stands before it, in its paragraph and above, stays in the element; what stands after it in its paragraph becomes the first paragraph of the new element's text (a paragraph of the same kind and attributes, without the spaces it would begin with; none where nothing is left), followed by the paragraphs below. The name is without the spaces at its two ends, and what is left before it is without the spaces at its end, as before.
3. **A selection over more than one paragraph**: the name is what is selected of the first paragraph (from where the selection begins to that paragraph's end), and every paragraph after the first, selected or not, goes whole into the new element's text. **A selection that begins at the very end of a paragraph and goes on into the next begins with the next**: someone who dragged over a whole line from the end of the line above means that line.
4. **What a name cannot hold is not lost**, as before: a name holds italics, small capitals, raised and lowered text and nothing else. Where what was to be the name holds a citation, a note, a picture, a formula, a reference mark, a line break or another mark, the name is left empty, and it becomes the first paragraph of the new element's text instead: the whole paragraph with nothing selected; with a selection, what is selected together with what follows it in the paragraph, as one paragraph. A message says so.
5. **Within what stands as one block** (a table, a text side by side with another), as before: the block stays whole, the name is empty, and what follows the block is the new element's text. A selection that is not of text (a picture selected, cells of a table, everything by Ctrl+A where that is not a text selection) is read as a cursor at its start.
6. **Where the new element goes is as before**: the first under the element where it has elements under it or is the one in view, else after it; **Alt+Shift+Enter** the first under it. The cursor goes to the new name: at its end where it has words, at its start where it is empty. One step of undo takes it all back.
7. **In a name, nothing changes**: Alt+Enter at its end makes an empty element after it, and in its middle gives the rest of the name to the new element.
8. **The entry of the right-click menu** says what happens: **Make the paragraph an element**, and with text selected **Make the selection an element**. It is the same act as the key.

## Choices made in building this, which the owner has not been asked about

1. **A selection over several paragraphs** (3): the name is what is selected of the first; the paragraphs after it go whole. A selection that begins at the very end of a paragraph begins with the next.
2. **What a name cannot hold is kept as a paragraph with a selection too** (4): what is selected, with what follows it in its paragraph, as one paragraph.
3. **In a name nothing changes** (7).
4. **The words of the menu** (8), and the toast: *What was to be the name holds what a name cannot, such as a citation or a note, and is the first paragraph of the new element*.
5. **A paragraph goes whole where only spaces stand before the selection**, so that no line of spaces is left behind; and a selection of nothing but the break between two paragraphs is read as the cursor in the second.
6. **The spaces counted at the ends are those of text only**, never those inside a note or a citation, so that the cut never lands inside one.

## Not done

- The messages of the other languages: the new words (the menu's two entries, the toast) are in English and Bokmål, and the other languages say them in English until they are translated. The two messages they had (*Split here* and the old toast) are no longer used.

## As built, 2026-11-16

- **The parting of the text**: `headingAt(doc, from, to)` and `headingOfSelection(doc, selection)` in `project/text/heading.ts`; `split` in `MapText.svelte` calls the second and passes the selection's end only for a text selection that is not empty. The entry of the menu is named for what is selected by `selectsWords`.
- **Words**: `text-make-paragraph-element`, `text-make-selection-element` and `text-name-kept` in `locales/en/text.ftl` and `locales/nb/text.ftl`; the keys' sheet says it in `keys-tree-new` and `keys-tree-new-under`.
- **The guide**: *A paragraph made an element*, the table of the text's keys and the table of all keys.
- **Tests**: `heading.test.ts` holds every case above, by what it shows: the cursor at the start, in the middle and at the very end; the first and the last paragraph; the only paragraph of a text, which leaves one empty paragraph; an empty paragraph at the end and in the middle; words selected, with what stood before and after, the kind of the paragraph, the spaces, the paragraph that goes whole; a selection over several paragraphs and one that begins at the end of a paragraph; what a name cannot hold, with a cursor and with a selection; a block left whole; a selection that is not of text.
- **The scripts**: `e2e/paragraph-element.mjs` is new; the scripts that pressed Alt+Enter at the end of a paragraph with words in it to begin an empty element press Enter first (`folding`, `maps`, `preview`, `scope`), `text-structure` selects the word it means for the name, and the text's part of `tree-keys` is rewritten for the whole paragraph as the name. Written, and not yet run.
- **Checked**: `pnpm check` finds nothing; `pnpm test` passes, 236 files and 2017 tests, among them the 32 of `heading.test.ts` and the help reader against the whole guide.
- **Tried in the running application, 2026-11-16, after the merge.** The script `paragraph-element` passed as it was written, 35 of 35, and the scripts changed for the new rule with it: `tree-keys` 44 of 44, `text-structure` 35 of 35, `maps` 81 of 81, `folding` 30 of 30, `preview` 48 of 48 and `scope` 12 of 12. The presses of Alt+Enter in seventeen of the scripts left unchanged were read again: each is in the diagram or in an empty text.

## Added to, 2026-11-16 (later)

Told what was built, and which choices had been made without asking, the owner wrote: "I think any paragraph type should be turned into the name of the element. An exception I thought about now is when there are line breaks in a paragraph. Only the part that is after and before a line break becomes the name of the element."

**What no longer holds above.** Decision 4, that what a name cannot hold makes the name empty and is kept as the first paragraph of the new element's text, is replaced by what follows, and so is the toast of choice 4 of the choices made in building. Decision 3 gains the line, and decision 2 gains the line break. The rest holds.

### Decision

1. **Every paragraph becomes the name**: its words. A mark a name cannot have, which is every mark but italics, small capitals, raised and lowered text, is **dropped and the words kept**: bold, underlined, struck through, code, a kind of words, a language, a link. Nothing is said of a dropped mark.
2. **Where the paragraph has line breaks, only the line the cursor is in becomes the name**: from the line break before the cursor, or the paragraph's start, to the line break after it, or its end. The lines before it stay in the element as the paragraph they were, without the break that ended them; the lines after it become the first paragraph of the new element's text, a paragraph of the same kind and attributes, without the break that began them, followed by the paragraphs below. In the first line nothing of the paragraph stays; in the last nothing follows.
3. **With words selected**, the name is what is selected, as before, **up to the first line break within it**. What follows from there, without that break, begins the new element's text, with what stood after the selection. What stands before the selection stays, the lines before it too, and a line break at the end of what stays is not left there, as the spaces are not.
4. **What is not words cannot stand in a name, and is not lost**: a citation, a note, a formula, a reference mark or a cross-reference, every inline node that is neither text nor a line break, is taken out of the name and **stands at the start of the first paragraph of the new element's text**, in the order it stood, before what stood after the name in the paragraph; where nothing stood after it, in a paragraph of its own, of the paragraph's kind and attributes. Where taking one out leaves two spaces together in the name, one stays. **A toast says so** whenever something was taken out: *What a name cannot hold, such as a citation or a note, stands at the start of the new element’s text*. A paragraph of nothing but such things gives an empty name and keeps them, as before.
5. Everything else is as above: a block left whole, a selection that is not of text, where the new element goes, Alt+Shift+Enter, the cursor in the new name, one step of undo, a name unchanged, the two entries of the menu.

### Choices made in building this, which the owner has not been asked about

- **What is not words is kept at the start of the new text, with a toast**, rather than left out, or turned into the words it shows as. The owner said any paragraph, and spoke of line breaks alone.
- **A selection over line breaks ends the name at the first of them.**
- **What was taken out stands on a line of its own, with a line break between it and the lines that follow**, where the name was a line or a paragraph that ended at a line break; where a selection ended in the middle of a line, it runs straight into the rest of that line, as it stood. So a citation that was on the second line is not set against the first word of the third.
- **Blank lines and spaces are not left at the seams.** What stays does not end, and what begins the new text does not begin, with spaces or line breaks: a paragraph of "One, an empty line, Three" with the cursor in Three leaves "One", and the empty line between is gone, as the space at the end of what stayed was gone in the first form. Only empty lines are dropped, never words.
- **A selection that begins at the very end of a line and goes on into the next begins with the next line**, as one that begins at the end of a paragraph begins with the next paragraph.
- **A line mark that holds a number or words for the margin, set by hand on a line, is kept with what is not words**, at the start of the new element's text, so that they are not lost; one that only says how its line is set (set in, not counted, going on from the line before) says nothing of a name and is dropped without a word. Changed when the part was read in the main thread: as it was first built, every line mark was dropped.
- **A figure is left whole**, as a table is. Its caption is a text too, and the rule that took the paragraph the cursor is in for the name took the caption of a figure as well, and cut the picture away with it. Only a paragraph is a paragraph here.
- **`nameable` goes**: nothing asks whether a paragraph can be a name any more.

### As built, 2026-11-16 (later)

- **The parting of the text**: `headingAt` in `project/text/heading.ts` finds the line, or the selection to its first break; `Heading.name` is always a fragment, and `keptAsParagraph` gave way to `keptInText`, which says that something was taken out of the name and stands at the start of the body. `split` in `MapText.svelte` follows it and tells by the same message, reworded, `text-name-kept`, in English and Bokmål (no other language has it yet).
- **The guide**: *A paragraph made an element* and the two rows of the keys that name what Alt+Enter takes.
- **Tests**: `heading.test.ts` is written again for the new rule: a bold word in the name's place; marks kept and dropped side by side, and every mark of the schema that a name cannot have; the first, a middle and the last line of a paragraph of three lines, with the cursor at the end of a line and at the start of the next; empty lines; a selection within a line and over a line break, at the end of a line and of a whole line; a citation, a note, a formula, a reference mark and a cross-reference at the start, in the middle and at the end, with the two spaces, with and without words after the name, on a line of its own before the lines after it; a paragraph of nothing but such things; a figure.
- **The scripts, written and not yet run**: `paragraph-element` has the paragraph with a bold word as the name without a message, and a paragraph of three lines with the cursor in the second, which Ctrl+Z takes back whole; `tree-keys` has the paragraph with a citation, whose words are the name and whose citation is the first paragraph of the new text, with the new message. No other script relied on the old rule.
- **Checked**: `pnpm check` finds nothing; `pnpm test` passes, 241 files and 2137 tests, among them the 54 of `heading.test.ts` and the help reader against the whole guide. The scripts are not yet run.
