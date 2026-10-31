# 0079 — The numbers of headings in the text view, the map and the outline

Date: 2026-10-31. Status: built on 2026-10-31 from the owner's question of 2026-10-31 ("I am also wondering if it is possible to see this numbering in the outline views, the headings in the text view and inside the bubbles of the diagram view?" — "how can I see the numbering in the headings in the text view and the diagram view?"). Follows 0058 and 0078.

## Context

The numbers of headings are decided by the look of the document (0058, 0078) and printed by the typesetting pane and every export. On the screen nothing showed them: the text view's gutter has a number by depth alone, counting every element, named or not, which the writer can turn off; the map's boxes and the outline have the name alone. The front end already had what is needed: the look of the document of any element (0042, `formatForCached`), the walk of a document with the core's rules of level (`walkDocument`), and a count of the headings for the words that point to them (`figures/numbering.svelte.ts`), in arabic only, which disagreed with the printed document as soon as a level had a style of its own, and which read the layout without the document's own changes.

## Decision

- **The number a heading will print stands before its name** in the text view, in the box of the map and in the row of the outline, in a quieter colour, as soon as the look numbers the headings; nothing is shown while it does not. The element in view is the document, as it is for the typesetting pane: the numbers are those of its document, counted from it.
- **One rule, the core's.** `figures/headingNumbers.ts` is the core's `resolved_numbering`, `count_heading` and `heading_number` in TypeScript: the styles of the levels, none, as the level above, a level counted on through the document, and the numbers in arabic, roman and letters. The count of the headings for the words that point (`count`) numbers by it, so the words that point, "see section IV.2", now say what the document prints; and it reads the look of the document with its changes laid over the layout, as the typesetting pane does, where it read the layout alone.
- **Nothing else changes.** The gutter's number by depth stays as the writer has set it; it says where an element stands in the tree, named or not, which the printed number does not. What is left out of the document, what has no name and the element in view carry no number, as they print none. The number in the map's box goes into the SVG and PNG pictures of the map, as the text of the caption does.
- **The number is not part of the name**: it is a mark beside it, not written, not selected, not searched; the name stays what the writer typed.

## Why not otherwise

- *The printed number in the gutter, in place of the number by depth*: the two say different things, and the gutter's is a setting the writer has; a chapter counted through would show 4 in the heading and 2.1 in the gutter, which is right, each being what it says it is.
- *Counting in each view*: three counts would drift; the one count serves the words that point as well, which were wrong before.
- *The number inside the editable name*: it would be typed over, copied and searched; the typesetting writes it, the writer does not.

## Consequences

- `src/lib/figures/headingNumbers.ts` with tests; `numbering.svelte.ts`: `Counting` with the styles and the levels counted through, `count` by the rule, `formatOf` through `formatForCached`.
- `TextSection.svelte`: the name wrapped with its number before it, the number in the size of its level; `MapText.svelte`, `MapDiagram.svelte`, `DiagramNode.svelte`, `Outline.svelte`: the number from `numbering.of(project, at)`.
- `e2e/numbers.mjs`: two parts of two chapters, numbered, in roman, counted through, in the map, the text view and the outline.
- Unchanged, noted: the sections of a front or back part are counted with the body's levels on the screen, as `count` had it before; the exports number them otherwise. A record of its own if it matters.
