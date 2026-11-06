# 0086 — Favourite projects

Date: 2026-11-06. Status: proposed on 2026-11-06, from the owner's words of the same day ("We also need a list of favourite projects."), with the plan `docs/plans/the-data-folder-more-than-one-window-favourites-and-the-copied-space.md`; to be built when the owner has read it. Builds on 0063 (the list is the tree) and 0031 (folders, on this computer).

## Context

The list of projects at the left is one tree: folders, and the projects by name in them (0063). The start screen shows the ten projects last opened, newest first. A writer with many projects works in a few of them for weeks; those few are found by their folders, or by typing in the filter, each time. What is wanted is a short list of one's own, over the tree, that does not change by itself as the last opened do.

## Decision

1. **A project is made a favourite** with *Add to favourites* in its menu, in the list and on the start screen, and taken off with *Remove from favourites*. The star of Lucide is the item's icon.
2. **The favourites stand at the top of the list of projects**, under a heading *Favourites*, before the folders and the projects, in the order they were added. The heading folds and unfolds like a folder, for the run. Each row opens the project and has its menu, as a project row does; the tree of an open project stands under its own row in the tree, not here. With a filter typed, the favourites that match are shown with the rest. With no favourites, no heading.
3. **The start screen** shows the favourites first, under their heading, then the projects last opened, a favourite not repeated among them.
4. **Kept on this computer**, beside the folders, in `projects/folders.json`: not in the project, not shared, no place in the Org form. A project deleted leaves the favourites; brought back, it is not a favourite again.

## Choices made in writing this

1. **A group at the top of the list, not a filter or a star on each row**: the owner asked for a list, and a group is what a folder already is.
2. **In the order added**, not by name, and not reordered by dragging: the list is short, and dragging in the list means moving to a folder; reordering can come when the order is missed.
3. **No tree under a favourite's row**: one project, one tree in the list.
4. **The words**: *Favourites* / *Favoritter*; *Add to favourites* / *Legg til i favoritter*; *Remove from favourites* / *Fjern fra favoritter*.

## Consequences

- The core keeps a list of ids in the arrangement, with one command to set it; the list's rows gain a group; the start screen a strip; the guide, *Many projects*, a paragraph; a script covers it.
