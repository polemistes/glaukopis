# 0051 — The map of the projects as one map: whole titles, the maps of projects shown beside their cards, things put by hand

Date: 2026-10-17. Status: asked for by the owner on 2026-10-17, and built the same day. Amends 0050, which left positions out.

## Context

With the map of the projects worked as a tree, the owner asked for three things more: the titles of projects shown whole, wrapping; the map of each project opened on the top map, with a way into the project anywhere; and the elements moved about as in the maps of projects. The folders and projects of the top map are put by hand where they are dropped. The elements of the projects' maps are seen there as in their own maps, but changed only in their projects. The owner said on 2026-10-11 that everything in the application should be seen as one big map, with the owl at the top.

## Decision

- **Whole titles.** A project's name on its card goes on to as many lines as it takes, broken between words.
- **A project's map under its card.** The line under a card's title shows the map of the project beside the card, or hides it; Space does the same with the card selected. The map begins with the project's own element, drawn as the top of a map is drawn and closed, and selected, so that Space opens it; under it the elements stand as the project's own map draws them, boxes, the trees bold, what is deeper lighter, folded as the project has them. Folding and unfolding them here lasts for the session and does not change the project. The map is read from disk as the pane of projects reads a project that is not open, and read again when the project changes. A double click on an element, the corner at its top, or Alt+Shift+Down opens the project with that element in view.
- **Folders and projects put by hand.** One dropped on the ground of the map stays where it was let go, from what holds it, as an element does in a map. The places are kept on this computer, in `projects/folders.json` beside the folders, not in any project. *Place everything by itself*, in the map's menu, lets them be placed by themselves again.
- **Elements are not changed on the top map.** They are seen, gone through, folded and opened; they are moved, renamed, made and deleted in their project, once it is entered. *Amended the same day*: the first build moved them on the top map, by dragging and by Alt and the arrows, written into their projects; the owner asked for them not to be editable before the project or element is entered.
- **All of it can be seen.** *Show all of it* fits the whole map, however far apart what is on it stands: the top map may be shown smaller than a diagram, down to a twenty-fifth. A view that loses its place is fitted anew. The owner had seen a view with one line and nothing else, which *Show all of it* did not mend: where the map was wider than a diagram's smallest scale takes in, the view was centred on the middle of it all, where nothing may stand.
- What is made on the top map with Enter and Tab are still folders and projects: with an element selected, those keys do nothing.

## Not done

A project that is open beside or in a pane is not shown on the top map, which stands where a project's view stands.

## Consequences

- `Arrangement` gains `places`; the commands `owl_places` and `owl_places_set`.
- The reading of a closed project keeps each element's place, fold, heading and whether it is left out.
- `fitting`, `zoomedAt` and `wheeled` of the diagram's camera take a smallest scale.
- `e2e/owl.mjs` has a fifth part: whole titles, a map shown closed and opened, elements left unchanged by keys and pointer, a card put by hand and one far away, opening at an element.
