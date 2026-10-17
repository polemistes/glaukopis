# 0051 — The map of the projects as one map: whole titles, the maps of projects shown under their cards, things put by hand, elements moved there

Date: 2026-10-17. Status: asked for by the owner on 2026-10-17, and built the same day. Amends 0050, which left positions out.

## Context

With the map of the projects worked as a tree, the owner asked for three things more: the titles of projects shown whole, wrapping; the map of each project opened on the top map, with a way into the project anywhere; and the elements moved about as in the maps of projects. The last was read two ways, and both are done: the folders and projects of the top map are put by hand where they are dropped, and the elements of a project's map, shown on the top map, are moved as that project's own map moves them. The owner said on 2026-10-11 that everything in the application should be seen as one big map, with the owl at the top.

## Decision

- **Whole titles.** A project's name on its card goes on to as many lines as it takes, broken between words.
- **A project's map under its card.** The line under a card's title shows the map of the project under the card, or hides it; Space does the same with the card selected. The map is read from disk as the pane of projects reads a project that is not open, and read again when the project changes. Its elements are drawn as lines of text, not boxes, folded as the project has them, and folded or unfolded on the top map for the session without changing the project. A double click on an element, the corner beside it, or Alt+Shift+Down opens the project with that element in view.
- **Folders and projects put by hand.** One dropped on the ground of the map stays where it was let go, from what holds it, as an element does in a map. The places are kept on this computer, in `projects/folders.json` beside the folders, not in any project. *Place everything by itself*, in the map's menu, lets them be placed by themselves again.
- **Elements moved as in their own map.** An element dragged onto the ground stands where it was let go, its place among those beside it following from where it stands; dragged onto another element of its project it goes under it; dragged onto another project's card or element it is carried there, made there and removed here, as between two panes. Alt and the arrows move it up and down among those beside it, under the one before it, and out of the one it is under. Each move is written into the project, which is opened for it and let go, and is undone from its message and by Ctrl+Z as every change of the home is.
- What is made on the top map with Enter and Tab are still folders and projects: with an element selected, those keys do nothing.

## Not done

Renaming, making and deleting elements on the top map: that is done in the project. A project that is open beside or in a pane is not shown on the top map, which stands where a project's view stands.

## Consequences

- `Arrangement` gains `places`; the commands `owl_places` and `owl_places_set`.
- The reading of a closed project keeps each element's place and fold; it is read again after the top map writes in the project, whatever the time of change, which is kept to the second.
- `e2e/owl.mjs` has a fifth part: whole titles, a map shown, moves by keys and dragging, a card put by hand, carrying to another project, opening at an element.
