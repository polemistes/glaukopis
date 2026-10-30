# 0077 — A closer map: branches packed by their outlines

Date: 2026-10-31. Status: built on 2026-10-31 from the owner's request of 2026-10-31 ("the mindmap tree is displayed with a lot of air between the elements … when there are a lot of sub elements below some elements higher up in the tree, these higher elements are placed very far from each other … more compact, so more of it fits in a screen without zooming too far out, while the structure of the tree is still clear"). Amends 0050 only in that the layout it reuses changes; the behaviour of the diagram is as it was.

## Context

- **How the diagram was laid out.** `diagram/layout.ts` placed each branch in a rectangle as tall as everything under it: the height of an element's block was the sum of its children's blocks, with 16 pixels between, or its own height where that was more; the element stood at the middle of its block, and its siblings' blocks were stacked under it. So two chapters stood apart by half the height of all the leaves of each, whatever stood at the levels between, and a section without subsections stood alone in a void as tall as its neighbours' fans. On a book of 134 elements the whole map fitted the window at 26 %; on loose notes of mixed depth at 26 %; on an element with forty leaves at 36 %.
- **What is drawn.** Boxes of 34 pixels and more, 64 pixels between an element and those under it, straight lines from the edge of an element to the edge of each child, which fan out from one point. The boxes report their own sizes; widths vary with the names, so that the columns of a level are ragged.
- **Two options of the layout**, `keepRoom` and `margin`, served the folders of the owl map (0050, 0051), which is gone since 0063; nothing used them.
- **Other programs.** Freeplane, XMind and MindNode stack branches by their whole height, as this did; the tidy-tree layouts of Reingold and Tilford, and d3's flextree, pack subtrees by their contours, which is what lets a tree with uneven branches come close.

## Decision

### Branches packed by their outlines

- Each branch is laid out on its own, its element at the origin, and carries its **outline**: what lies lowest at each x across it and what lies highest, of its boxes and of the lines from each element to the first and the last of its children, which bound the fan of lines between them (`diagram/contour.ts`).
- Under a parent, the children stand in one column; each is put as close under the one before as the outlines allow, with **10 pixels** between wherever the two come closest, box to box, box to line or line to line. So an element with nothing under it stands close under one with much, and that one's children fan out past it; an element wider than the one before, whose right edge reaches into the fan, goes down by what the lowest line falls over its edge, and no further. Nothing is ever placed across a line, since the lines are in the outline.
- An element stands **midway between its first child and its last**, as before where the children were leaves.
- The element in view divides its children between its two sides as before, by the heights of their branches, and each side is packed the same way.
- What the user put somewhere, and what is held while dragged, is as it was: placed where it was put, its branch laid out from there, its room in the flow kept while it is held.

### Smaller boxes from the second level down

- From the second level under the element in view, the boxes are 28 pixels high instead of 34, with 4 by 10 pixels of padding instead of 6 by 13, and their names in 13.5-point type instead of 14.5, alongside the lighter look they had (no shadow, a fainter border). The element in view and its children are as they were.

### What is not done

- The distance between an element and those under it stays 64 pixels: the fan of lines is drawn over it, and a shorter run makes the lines of a tall fan steeper, so that less could stand beside them.
- No second column of leaves under an element with many, no folding by default, no aligning of a level's boxes in one column by the widest name.
- `keepRoom` and `margin` go.

## Choices made in writing this, which the owner has not been asked about

1. Ten pixels between branches, where there were sixteen; the same ten between a box and a line of another branch.
2. The lines to the first and the last child are in the outline, so that nothing is placed across a line; a wider sibling is pushed down by the line rather than tucked under it.
3. An element stands midway between its first and its last child, not at the middle of the height of its branch.
4. The boxes from the second level down are smaller by the measures above; the first level and the element in view keep their size.
5. The distance between levels is kept at 64 pixels.

## Why not otherwise

- **Not two columns of leaves under one element**: the lines from the element to the second column would cross the first, or the second column would hang from nothing.
- **Not the element at the top of its branch, as an outline**: the height of the map is the same; only where the parent stands changes.
- **Not boxes aligned in columns by the widest name of a level**: one long name would push a whole level out, and nothing would be gained in height.
- **Not a smaller gap between levels**: see above.

## Consequences

- `diagram/contour.ts` with its tests; `diagram/layout.ts` rewritten about it, its tests rewritten with a check that no line passes through a box, on a tree of a few hundred elements of every shape and width; the size of the deeper boxes in `DiagramNode.svelte`; a paragraph in the guide's *The diagram*.

## Addendum, 2026-10-31: as built

Built as decided, in one commit. Measured on the same three trees, drawn from the layout alone with the sizes the boxes have: the book is 41 % lower and fits at 50 % instead of 29 %; the notes 49 % lower, fitting at 42 % instead of 26 %; the element with forty leaves 28 % lower. In the application, with the book opened as a map of Freeplane, the whole of it fits at 42 % where it fitted at 26 %. The width is 2 to 3 % less, from the smaller boxes.

**The sides balance anew.** With the smaller boxes from the second level down, a branch of two leaves is 66 pixels high where it was 78, and the map of `e2e/maps.mjs`, four elements under the project, comes out two to a side where it came out three and one: the element the script associated from by the keys, with *ArrowUp* to the one above it, now stands at the left with nothing above it. The script associates from the first element, which always stands at the right, to the one under it; nothing else in the scripts assumed a side.

Counts: `pnpm check` without errors or warnings; `pnpm test` 1376, none failing; the scripts `maps` 98 of 98, `mindmaps`, `placing`, `keys`, `tree-keys`, `folding`, `map-icons` and `diagram-picture` all passing.
