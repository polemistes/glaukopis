# 0080 — An open project is renamed and deleted from the list

Date: 2026-11-05. Status: built on 2026-11-05 from the owner's question of 2026-11-05 ("Is there a reason why it is impossible to delete an open project?" — "Rename too. The common way to clean up the project tree, is to go through the projects, open them, and delete, move or rename them according to what is seen inside. It is cumbersome that it now is necessary to close the project to do anything with it."). Follows 0053 and 0063.

## Context

The menu of a project in the list (0063) disabled *Rename* and *Delete*, with the hint *It is open now*, for a project shown in a side of the window; the keys F2 and Delete did nothing on its row. Two reasons, neither said in the interface.

- **Deleting** a project moves its folder into the trash folder on disk. A project that is open writes into that folder as the writer works: moved away under it, the copy in the trash would lack the latest changes, the view would go on writing to a path that is gone, and on Windows the move itself fails while files in the folder are open. The undo of *Project made* had done exactly that once (0053), and since then the trash routine of the undo leaves the view for the home first, waits until the project is closed and on disk, and only then moves it; *Delete* in the menu never got the same treatment and simply stayed disabled.
- **Renaming** a project writes the name into `project.json`, which the list shows. But the name of a project is the name of its own element, the top of its one tree (0037); `project.json` holds a copy, written at every save from the document. Renaming the copy while the project was open would be overwritten at the next save. The same held, unnoticed, for a project that was not open: renamed in the list, it opened under its old name, since its element was never renamed, and the next save put the old name back into the list.

The owner goes through the projects to clean the tree up, opening each and deciding on what is seen inside, which is the natural order; having to close a project before anything can be done with it breaks that.

## Decision

- **A project is renamed and deleted from the list whether it is open or not.** *Open* alone stays disabled for a project that is shown, saying *It is open now*, since there is nothing to do. The keys of the list's rows (F2, Delete, a letter beginning a new name, Alt with the arrows among the folders) act on a shown project as on any other.
- **Deleting an open project closes it first.** The trash routine, which the undo already used, now closes every side that shows the project, file sides too, as *Close* in the list does, and the window goes to the start screen on its own when no side is left; it waits until the project is let go and its writing is on disk, then moves it to the trash. Where the window has no sides to close, the view is left for the home as before; where the project is still open after ten seconds, nothing is done and the writer is told it is open now, as a message and not a failure. A project shown beside the one deleted stays open.
- **Renaming writes the name into the project's own element.** The list's copy is written first, so that the list shows the name at once and a name that will not do is refused before anything else is written; then the element is named: in the project open in the view, as one step its own undo takes back, or in the project opened from disk for it and let go when the name is on disk, as elements carried to a project that is not open are written (0033). The views of an open project show the name at once, the path and the window's title among them. This mends the rename of a closed project, which did not hold once it was opened.
- The window tells the shared registry of projects open in the view what closes the sides that show one, so that the home's changes can close a project without knowing the window.

## Why not otherwise

- *Keep the two disabled and say why*: the owner's way of working is to look inside and then decide; the guard made the natural order impossible, and the way to do it safely existed already.
- *Rename `project.json` alone and reconcile at opening*: two names for one thing, and a save that writes back whichever the document has; the element is the name, and the copy follows it.
- *Delete without closing, and let the view find out*: the folder would be moved from under a writer with unsaved changes; 0053 ruled it out.

## Consequences

- `project/elsewhere.ts`: `closesHere`, by which the window gives what closes the sides of a project, and `closeHere`; `ProjectView.svelte` gives `closeAllOf`, which closes every side of a project, and takes it back when it goes.
- `home/changes.ts`: `trash` closes the project's sides where the window has them, else leaves for the home; `deleteThings` goes through `trash` for every project, and says *It is open now* as a message where one could not be closed; `nameProject` writes the list's copy, then names the element through `writeElsewhere`, then tells the server where the writer owns the sharing.
- `home/project-actions.svelte.ts`: *Rename* and *Delete* enabled for a shown project; `ProjectList.svelte`: every project's row is changeable by the keys; `list-keys.ts`: what changeable means.
- Tests of the menu, the trash routine with and without sides, the deletion of an open project, the renaming of an open and of a closed project, and the closer; `e2e/list.mjs` renames an open project and sees the name in the list, the path and the window's title, renames a closed one and sees the name hold when it opens, and deletes the open project, whose side closes before it goes to the trash.
- `docs/guide.md`: the list's menu renames and deletes an open project too.
