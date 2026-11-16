# 0108 — A paragraph made an element

Date: 2026-11-16. Status: built on 2026-11-16, its choices not yet confirmed by the owner; from the owner's words of the same day ("Then a feature in the text view. When pressing alt+enter with the cursor inside a paragraph, the paragraph text should be made an element. If alt+enter is pressed when text is selected, the selected text becomes the element. The text before the selection belongs to the previous element, and the text after belongs to the new element.").

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
