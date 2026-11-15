# 0103 — The surface, boxes, tags, Join and Divide

Date: 2026-11-16. Status: built on 2026-11-15 and 2026-11-16, as stage 2 of `docs/plans/the-notebook.md`, from the owner's words of 2026-11-15 (`docs/brief.md`): "I like the idea of a surface on which to arrange notes and look at them together, and then arrange them into units, or divide them, whatever seems right"; "it should be possible to put notes in different boxes, and to rearrange them. Annotate them and connect them"; "We want tags". It stands on record 0101.

## Context

- **What makes a view pan and zoom was inside the diagram** (`MapDiagram.svelte`, one of the largest files), with the drawing of associations; the plan asked for both to be lifted out along a seam, not copied.
- **Joining two elements of a project loses things**: the element that goes takes its associations and its comments with it. The owner's Join keeps everything.
- **There were no tags anywhere**, and no field that offers what was written before.

## Decision

1. **The lifting, first and alone.** `src/lib/ui/camera.ts` (the geometry, moved), `pan-zoom.svelte.ts` (the live view, the wheel, the dragging of the ground, keeping the middle when the size changes, the camera kept) and `ZoomControls.svelte`; `AssociationCurves.svelte` and `AssociationLabels.svelte` beside the diagram, drawn from two boxes and a record (`associationDrawn`); the menu of an association for whatever holds the links (`LinkHolder`). The diagram uses them, is three hundred lines shorter, and behaves as before: its scripts pass unchanged.
2. **The document gains** boxes (with a first box that is always there, *Unsorted* until it is given a name), where a note lies on the surface of its box and how wide its card is, tags (a set of words on a note), and links between notes (as the associations of a project: words, an arrow, a colour; one for a pair). One history of undo over all of it. What stands beside a note's text is read without reading the text again.
3. **The page** has three parts, as the library has: at the left the boxes and under them the tags; in the middle the notes of what is chosen there, a box as its **surface** or as a **list**; at the right the note. What is in view (the box, the tags, surface or list and the camera of each box, the widths) is kept on this computer.
4. **The surface**: the notes of a box as cards where they were put, on a ground panned and zoomed as the map is. A card shows the note itself, is moved with those selected, and made wider by its right edge. Notes that lie nowhere yet stand at the left edge, **Not yet placed**, newest on top, and are dragged onto the ground; a card dragged back lies nowhere again. A link is drawn from a handle at a card's lower edge to another card.
5. **Boxes** are made, named in place, reordered by dragging and deleted (their notes go to the first box); notes are dragged onto a box or moved from their menu. **Tags** are given in a field under a note's name that offers those there are; in the column each shows how many notes have it, a press shows only its notes, and it is renamed (to one that is there: the two are one, asked first) or removed from all notes.
6. **Join** makes one note of those selected: the first of them, in the order they stand (in the list top first; on a surface as they are read), with the texts of the others after its own, the tags and the links of all, and what became of each. **Divide** cuts a note at the cursor, or lifts out what is selected, into a note of its own in the same box with the same tags, beside the old on the surface. Each is one step of undo.

## Chosen in the building, and not asked

- *All notes* is what a new installation shows, and is a list only; a box comes up as its surface the first time it is shown.
- The boxes and the tags are a column at the left, as the library's collections are, and not tabs.
- The field that finds and the tags chosen hold in the list; on a surface every note of the box is shown.
- A new note made while tags are chosen has those tags.
- Beside a surface a note is opened by two presses or Enter and closed by its ×; the place remembers the note that is open, not the card selected, so that a card only selected does not come back opened.
- The strip of notes not yet placed is as high as what it holds, and stands the whole height while a card is being moved, to be dropped on.
- A note let go from the strip lies with its head under the pointer; files dropped on the ground lie one under the other; nothing snaps.
- A card is between 160 and 720 wide, 280 where it was not made otherwise, and is cut with a fade at about twenty-two lines.
- On a surface the order of reading for Join: cards whose tops are within 40 of the first of a line stand in that line, left to right; lines top to bottom; then the notes not yet placed.
- Join keeps the first note's name, or takes the first name among the others; a link that would join a note to itself, or double another, goes.
- A note divided is as wide as usual, not as the old; where either side would hold nothing, nothing is done.
- Tags are compared as they are written (`Homer` and `homer` are two), at most sixty signs, a leading `#` taken away.
- Keys: Ctrl+J joins, Ctrl+Shift+D divides; on a surface the arrows go to the nearest card, Enter opens, Ctrl+0, Ctrl+= and Ctrl+- as in the diagram.
- A note moved to another box lies nowhere there yet.
- Renaming a tag by Enter takes the key whole, so that the question whether two tags are to be one is not answered by the same press (found by the script).

## Found and left

- In the diagram, a map first shown at no size never has its camera kept: an older fault, kept as it was by the lifting, to be mended apart.

## Checked

`pnpm check`, `pnpm test`. Against the built application: the diagram's scripts over the lifting (`maps`, `associations`, `diagram-picture`, `tree-keys`, `map-icons`, `ordering`, `comments`, `as-left`: 309 checks); `e2e/notebook-boxes.mjs` (56 checks), `e2e/notebook-surface.mjs` (28), and `e2e/notebook.mjs`, `notebook-out.mjs` as before.
