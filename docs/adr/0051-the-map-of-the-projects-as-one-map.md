# 0051 — The map of the projects as one map: projects as the top elements of their maps, opened as elements are, whole titles, things put by hand

Date: 2026-10-17. Status: asked for by the owner on 2026-10-17, and built the same day. Amends 0050, which left positions out.

## Context

With the map of the projects worked as a tree, the owner asked for three things more: the titles of projects shown whole, wrapping; the map of each project opened on the top map, with a way into the project anywhere; and the elements moved about as in the maps of projects. The folders and projects of the top map are put by hand where they are dropped. The elements of the projects' maps are seen there as in their own maps, but changed only in their projects. The owner said on 2026-10-11 that everything in the application should be seen as one big map, with the owl at the top.

## Decision

- **Whole titles.** A project's name on its card goes on to as many lines as it takes, broken between words.
- **A project is the top element of its map.** It is drawn as a project's own map draws the element in view, and stands for it: no card, and no element of its own under it. Its map is opened as an element's is: the fold button at its side, with the count of what is folded away, or Space with the project selected; folded again the same way. The trees stand right under it as the project's own map draws them, folded as the project has them and placed where the project put them; folding and unfolding them here lasts for the session and does not change the project. The map is read from disk when it is first opened, as the pane of projects reads a project that is not open, and read again when the project changes. A double click on an element, the corner at its top, or Alt+Shift+Down opens the project with that element in view. *Amended the same day, twice*: the first build showed the map under a card; the second put the project's own element under the card, closed; the owner found a project that becomes an element under itself unintuitive, and asked for the project to look like the top element of its map and to open as one. The cards, and the rule of 0037 that the top map's elements must look unlike a project's, are superseded for projects; folders and the owl keep their own look.
- **Folders and projects put by hand.** One dropped on the ground of the map stays where it was let go, from what holds it, as an element does in a map. The places are kept on this computer, in `projects/folders.json` beside the folders, not in any project. *Place everything by itself*, in the map's menu, lets them be placed by themselves again.
- **Elements are not changed on the top map.** They are seen, gone through, folded and opened; they are moved, renamed, made and deleted in their project, once it is entered. *Amended the same day*: the first build moved them on the top map, by dragging and by Alt and the arrows, written into their projects; the owner asked for them not to be editable before the project or element is entered.
- **The view stays put.** What is folded or unfolded is kept where it stood on the screen while what is under it comes and goes, for a moment only, and not while something is dragged: where the pointer holds a thing is read from the view, so a view that followed the folded thing moved what was dragged, which moved the view, without end, until the drawing broke. That was the chaos the owner met after moving a large tree: a view millions of pixels away, lines to things no longer drawn, and *Show all of it* with nothing to show.
- **All of it can be seen.** *Show all of it* fits the whole map, however far apart what is on it stands: the top map may be shown smaller than a diagram, down to a twenty-fifth. A view that loses its place is fitted anew. The owner had seen a view with one line and nothing else, which *Show all of it* did not mend: where the map was wider than a diagram's smallest scale takes in, the view was centred on the middle of it all, where nothing may stand.
- What is made on the top map with Enter and Tab are still folders and projects: with an element selected, those keys do nothing.

## Not done

A project that is open beside or in a pane is not shown on the top map, which stands where a project's view stands.

## Consequences

- `Arrangement` gains `places`; the commands `owl_places` and `owl_places_set`.
- The reading of a closed project keeps each element's place, fold, heading and whether it is left out.
- `fitting`, `zoomedAt` and `wheeled` of the diagram's camera take a smallest scale.
- `e2e/owl.mjs` has a fifth part: whole titles, a map shown closed and opened, elements left unchanged by keys and pointer, a card put by hand and one far away, opening at an element.
