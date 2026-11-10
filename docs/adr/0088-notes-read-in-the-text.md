# 0088 — Notes read in the text

Date: 2026-11-10. Status: built on 2026-11-10, its choices not yet confirmed by the owner; from the owner's words of the same day ("when there are foot/end-notes in the text view, they are all numbered "1", and the text can only be seen when hovering over the text. I think we should see the whole text, as we see the whole citation text for citations, just with the current note number in front of it.").

## Context

A note stood in the text as its number alone, a small gold mark; what it said was the mark's tooltip, and was read by opening the note or hovering over it. The number was counted by the style sheet, with CSS counters reset on the column of the text view and passed through the texts of its elements. In WebKitGTK the count did not pass from one element's text to the next: every element's first note was 1, as the owner saw and the maps script's screenshot of 5 November shows. The script checked only that the counters were reset where they should be, which they were.

## Decision

1. **A note is read where it stands**: its number, raised and small, then what it says, on a soft ground of the note's colour, as a citation stands in the text as what it reads as. It runs on with the line and breaks with it. Pressing it opens it, as before; the tooltip is gone, since what it said is in view.
2. **The number is the note's number in the document**, counted as figures and equations are: through the elements of the document the text is shown in, in the order of the document, from what is kept of each element (its notes, and of them those set to a place of their own), not by the page. A note set to a place of its own is lettered, counted with the others so set. An element left out of the document numbers its own from 1.
3. **Everywhere a text is shown**: in the element being written, in the text drawn around it, in the edit box of the diagram and in the tooltip of an element.

## Choices made in writing this

1. **Counted from the project, not by the page.** Counting what the page shows would number the notes of folded elements as though they were not there, and the text view does not show everything the document holds; the numbers of figures are already counted so, and a note now has the number it is printed with.
2. **What a note says is drawn as the text draws it**, its citations by their labels, its formulas as mathematics, its words that point as what they point to, by a view of the note's text that is only read, inside the note.
3. **A search marks the whole note** in which something was found, as it did; the words found within it are marked when the note is opened.

## As built, 2026-11-10

- `editor/notes.ts` numbers the notes of a text by where they stand in it, after those before the element; `figures/numbering.svelte.ts` gives each element of a document the notes before it; `project/model/text.ts` keeps of each element how many of its notes have a place of their own. The editor numbers its notes through a plugin (`noteNumbers`), the text drawn without an editor in `figures/hydrate.svelte.ts`. The CSS counters are gone.
- The view inside a note asks its host editor for what the editor was given (`hooksOf` in `editor/ui.svelte.ts`), since it is made while the host is.
- **Choices made in building.** A line may break before a note (a `wbr` at its beginning): in a narrow column of a table the words before it and its first word were one run that made the table wider than its place, by 11 px in the tables script; breaking within the words of a note instead was tried and split them mid-word. Found citations in what a note says are marked there, as in the text, and pressing them opens the note, in which they are gone through. The scripts that counted the citations and found citations of a text, or read a paragraph's words, now leave out what its notes say, which they meant, and read a note's words from it rather than from its tooltip.
- **Counts.** A new test of the notes' numbers and their HTML, and one of the notes counted through a document; every test of the interface passes. `maps` passes its 78 checks (the check of the CSS counters is now one of the numbers 1 and 2 in two elements, each with its words), `tables` 87, `found` 92, `found-window` 52, `passing` 19, `search` 55, `documents` 62 and `org` 21; `preview` 47 of 48, the one that fails (a page drawn again when the text on it changes) failing the same way without this change.
