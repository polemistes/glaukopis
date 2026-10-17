# 0050 — The owl map behaves as a tree: what is done in a project's diagram is done over folders and projects, in the owl map's own look

Date: 2026-10-17. Status: accepted by the owner on 2026-10-17; to be built from `docs/plans/the-owl-map-behaves-as-a-tree.md`. Amends 0031 (folders of projects) and 0037 (the owl map), which hold otherwise.

## Context

The owl map is the map above every project: the owl at the centre, the folders as plain labels that nest, the projects as cards with badges for shared and joined, laid out by the diagram's own layout. It was given a look of its own on purpose, so that the top map is not taken for a project, and on 2026-10-12 it became a place of its own, with the diagram only. Today it pans, zooms, folds a folder, opens a project on a click and shows the menu a project has elsewhere. A folder has no menu on it. Nothing on it can be renamed, made, moved or deleted.

All of that is done in the list and the pane of projects, and every rename and every new name goes through a dialog. No row is reached by the arrow keys. No change of the home can be undone: a move gives a toast without an Undo, a deletion a toast, a renaming nothing.

In a project's diagram a person selects one element or several, goes about with the arrows, makes an element after or under with Enter and Tab or Ctrl+Enter and Ctrl+Shift+Enter, names it in place, renames with F2 or by typing a letter, moves it with Alt and the arrows or by dragging it onto another, enters it with Alt+Shift+Down or a corner and comes back up, folds with Space, deletes with Delete and undoes with Ctrl+Z. The layout, its search for a neighbour, the camera and the drag payloads are generic; every change goes through the project's document, and the owl map draws itself, reusing the layout and the lines only.

On 2026-10-17 the owner asked whether a plan existed to make the top tree work like the trees inside projects. None did. The owner chose: keep the distinct look, bring over the behaviour.

## Decision

### The look stays

The owl mark, the folders as labels without a box, the projects as cards, the badges: as they are. Nothing added looks like an element of a project. What the behaviour needs is drawn in the owl map's own style: a ring in the accent colour around what is selected; the corners that enter and leave, shown on hover as the diagram shows them, on a card and on a label; a field in the label or the card while a name is written; a card or a label not yet made, while its name is written; the folder that would take a drop, marked as the diagram marks a target.

### The behaviour comes over

- **Selection.** A click selects one; Ctrl adds or takes away one; Shift adds. Ctrl+A selects all that is shown; Escape clears. What is selected is what the keys and the menu act on.
- **Going about.** The arrows move the selection to the nearest label or card in that direction, by the same search the diagram uses; with Shift the selection grows. From nothing selected, an arrow selects the owl.
- **Opening and entering.** A double click on a card, its corner, or Alt+Shift+Down with it selected opens the project at its top. The same on a folder enters it: the map shows the folder at the centre, its folders and projects around it, the corner on the centre naming what is above it; Alt+Shift+Up and the corner go up. The route names the folder, so that back and forward and the pane know where one is. From the top of a project, going up comes to the project's folder with the project selected and in view, or to the owl when it is in none.
- **Making, in place.** Enter or Ctrl+Enter makes a new project; Tab or Ctrl+Shift+Enter makes a new folder. Each is made inside the selected folder, beside the selected project in its folder, or at the top when the owl or nothing is selected. It appears at once as a card or a label with its name field open, and is made when the name is given; Escape, or leaving it empty, and it is as if nothing had been pressed. The same two are in the menu of a folder and of the background, *New project here* and *New folder here*.
- **Renaming, in place.** F2 opens the name of the selected folder or project for writing, the whole name selected; a letter typed begins a new name, as in the diagram, and Escape brings the old one back. Enter keeps the new name. A shared project the writer owns is renamed on the server as the dialog does it today; the dialogs stay in the menus for those who want them.
- **Moving.** Alt with the arrow that points outwards on that side of the map puts the selected folders and projects into the nearest folder standing before them among their siblings, and does nothing when there is none; Alt with the arrow that points inwards takes them out, one level up. A card or a label is dragged, singly or with the rest of the selection, onto a folder's label, onto the owl, which is out of all folders, or onto a card, which puts it in that card's folder; the background pans as today. The payloads are those of the list, so that a thing is dragged from the pane onto the map and from the map onto a row of the pane. *Move to folder* and *Out of folders* stand in the menus of the owl map as they stand in the list's.
- **Folding.** Space folds and unfolds the selected folder; a click on a label still does. The folds last for the session, as today.
- **Deleting.** Delete, or the menu, deletes the selected folders, whose folders and projects move up to where they were, or moves the selected projects to the trash, each after the question that is asked today.
- **Undoing.** Every change made on the home, a name, a move, a making, a deletion, is undone from its toast and by Ctrl+Z on the owl map, and done again by Ctrl+Shift+Z or Ctrl+Y, as far back as the session goes. A project deleted comes back from the trash; a folder deleted is made again with its name and its place, and what was in it moves back.
- **Menus.** A folder has a menu: rename, new project here, new folder here, move to folder, out of folders, delete. The background has one: new project here, new folder here, show all. Shift+F10 and the Menu key open the menu of what is selected.
- **The view.** Ctrl+0 shows all of it, Ctrl+= and Ctrl+- bring it closer and farther, as the diagram's keys do.
- **The key sheet** gains a place, *On the map of projects*, with these keys.

### What is not brought, and why

- **An order by hand** (Alt+Up and Alt+Down in the diagram). Folders and projects stand in the order of their names, in the list, in the pane and on the map alike, and a project has no order to keep. An order by hand is a later thing, for all three places at once.
- **Positions, tidying, the rubber band, copying and pasting, associations, comments, the text box.** None has a meaning over folders and projects; *Duplicate* stays in the menu as the copying of a project.
- **The diagram's component itself.** It is bound to the project's document in dozens of places and its look must differ. The owl map keeps its own drawing and uses what is generic: the layout, its neighbour search, the camera, the drag payloads, the toasts with an action, the confirmations.

### Choices made in writing this, which the owner has not been asked about

1. A single click selects; opening is by a double click, the corner, or Alt+Shift+Down. Today a single click opens. This is what makes the map a place to act on and not only to go from; it is a change in the feel of the map.
2. Enter makes a new project, as Enter makes a new element; it no longer opens the project selected.
3. New things go inside the selected folder, beside the selected project, or at the top; Enter makes a project and Tab a folder.
4. Going deeper puts a thing into the nearest folder before it among its siblings, and nothing happens when there is none.
5. The undo is the home's and the session's, a list of changes with their reversals, not the history of a document.

## Later

- The folds of the owl map remembered across sessions, in the arrangement beside the folders.
- An order by hand, in the list, the pane and the map together.
- Renaming in place in the list and the pane, with the same name field.
- The facts of a project shown on hover, as an element's tooltip shows its text.

## Consequences

- A project is made in a folder: `project_create` takes the folder, and the contract changes. The remembered form `map` of the page of projects, which nothing shows any more, goes from the core's list.
- A new route, the owl map at a folder. The pane marks the folder in view, and a folder's row in it gains *Open as map*. Going up from a project's top comes to its folder.
- The guide's section *Many projects* is rewritten: two forms of the page, and the map above every project with what is done on it.
- A script of its own, `e2e/owl.mjs`, drives the map by its keys and its pointer; the scripts that come to the owl map by going up from a project are revisited.
- The words of the other languages lag, as usual.

## Why not otherwise

- *Leave the owl map a picture*: the owner wants one way of working from the owl to a paragraph; a map on which nothing can be done teaches a different way at the top than below.
- *Single click opens, as today*: then nothing can be selected without opening it, and the keys have nothing to act on; a double click to open is what the diagram's text box has.
- *Make the owl map a MapDiagram*: see above.
