# 0089 — Elements dragged in the outline, and a finer wheel in the diagram

Date: 2026-11-12. Status: built on 2026-11-12, its choices not yet confirmed by the owner; from the owner's words of the same day ("It would be great if it were possible to move elements around in the outline pane. Also, in diagram view, the mouse zoom should be more fine grained.").

## Context

- **The outline moved an element one place at a time.** Alt with the arrows moved the element that had the focus up, down, deeper or less deep, as in the text and the diagram; nothing could be taken with the pointer. The text moves an element by the grip beside its heading, with a line that shows the place and the pointer's distance to the right saying how deep; the diagram by a drop between two elements (0083). Both drag the same thing, the `elements` of `ui/drag`, and take it from each other.
- **The wheel with Ctrl changed the scale of the map by 0.22 percent for each pixel it turned.** A notch of a mouse was taken as forty pixels by the record of the file view (0069), and is sixty where the system counts a notch as one and a half, as GTK is believed to under Wayland: a step of nine to fourteen percent, and a quarter where a notch is told as a hundred pixels. What a notch is on the owner's machine was not measured.

## Decision

1. **A name in the outline is dragged** to another place among the names, and its element goes there with all that is under it. A line shows where it would stand, set in as deep as it would stand; the element it would stand under is ringed; the element dragged is faint where it still stands, and its name is beside the pointer. The element in view stays where it is.
2. **The pointer's height says between which two names; how far it has gone sideways says how deep**, among the depths that place allows, which are the text's (`dropChoices`): under the name above, after it, or after one over it, as far out as beside the name below. Straight up or down the element stays as deep as it stood; each sixteen pixels to the right is a level deeper, to the left a level less deep.
3. **What is dragged is what the text and the diagram drag.** A name dragged from the outline is dropped in the text or on the diagram as an element dragged there is, and the outline takes an element dragged from either, and from the project of the other side, which is carried across as it is to the text (0053). With Ctrl held a copy is put there.
4. **The wheel with Ctrl zooms the map by a thousandth for each pixel it turns**, and one turn counts for sixty pixels at most: a notch is four percent where it is told as forty pixels and six where it is told as sixty or more, on any system. The small turns of a touchpad are as small as they are. The buttons and the keys step as they did, by a quarter and by a fifth.

## Choices made in writing this

1. **The whole row is the handle.** A row of the outline is a name and little else, and a grip for each would crowd a narrow pane. A press is still a press: the drag begins once the pointer has moved six pixels, as every drag of the application does. A chevron folds, and takes nothing.
2. **How deep is said by how far the pointer has gone, not by where it is.** The text's grip stands at the left of its heading, so that where the pointer is says how deep. A name in the outline is taken anywhere along it, so where the pointer is says nothing; where it has gone since does. An element dragged in from the text or the diagram was not taken here, and is as deep as the names the pointer is over.
3. **No words on the line.** The text's line says *Under*, *After* or *Before* a name. The outline is narrow and its names are cut short; the element the dragged one would stand under is ringed instead, and the line is set in under it.
4. **The rows dragged are no places for themselves.** The place is found among the rows without the element dragged and what is under it. Held over its own row, an element is thus between the name above it and the name below it, and a step to the right puts it under the one above: with its own row counted, the only place there was its own.
5. **One element dropped where it stands is left as it is**, in the text as well, where such a drop took the element's place by hand on the map away and made a step for undo to take back.
6. **The view stays where it is after a drop in the outline.** The outline is where the order is tidied while the text or the map is read beside it. The element dropped has the focus in the outline, and what it went under is opened there if it was folded there.
7. **Near its upper or lower edge the outline scrolls** under what is dragged, for as long as it is held there: a long outline is not all in view.
8. **The step of the wheel is about half of what it was**, and bounded, so that it is the same small step wherever a notch is told larger. A notch that is told as a hundred pixels zooms by six percent, not ten.

## As built, 2026-11-12

- `project/outline.ts` has how far in a row stands (`outlineIndent`), the depth wanted (`depthWanted`) and the place (`outlinePlace`, over the text's `dropChoices` and `nearestChoice`), from plain data and tested; `project/text/Outline.svelte` measures its rows, begins the drag, draws the line and scrolls near its edges. `putDragged` in `project/elements.ts` puts what is dragged at a place, moved, copied or carried across, for the text and the outline both; the text's own lines for it are gone.
- `wheeled` in `project/diagram/camera.ts` has the two numbers by name (`WHEEL`, `NOTCH`), takes lines and pages as pixels, and is tested.
- **A choice made in building.** The drag that began in the outline is known by its being held, not by the object dragged: what is dragged is kept in the state of `ui/drag`, which hands back a proxy of it that is never the object it was given. The outline script found it: the depth followed where the pointer was.
- **The guide** said *scroll to zoom* of the map, which was not so: the wheel moves the map, and zooms it with Ctrl. It says that now.
- **Not measured on the owner's machine**: how many pixels its mouse tells for a notch, and so whether the step is the four percent or the six.
- **Counts.** Eight new tests, of the wheel, of what is dragged put at a place, and of the outline's places; every test of the interface passes, 1431. The new script `outline` passes its 30 checks: the line and the ring at each depth, the drop, undo, an element with what is under it, a drop where it stands, a press, an element from the text, a name folded in the outline, the outline beside the diagram, and a long outline scrolling under what is held near its edge. `maps` passes 81, three of them new, of the wheel: a notch of sixty pixels is 1 to 1.062, a notch of a hundred and twenty no more, and two back the scale it was. `text-structure` passes its 35, the text dropping through `putDragged`.
