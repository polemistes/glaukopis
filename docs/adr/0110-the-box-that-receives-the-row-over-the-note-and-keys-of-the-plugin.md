# 0110 — The box that receives, the row over the note, and keys of the plugin

Date: 2026-11-16. Status: built on 2026-11-16, its choices not yet confirmed by the owner; from the owner's words of the same day ("In the popup window for notes, could you put the toolbar at the top instead of at the bottom? Also, could the plugin for firefox have keyboard shortcuts? Is it possible to set a default box for notes to go into from either of the popups?"). Amends 0109 (where the row of the window of a note stands), 0102 (the plugin has one key) and 0103 (the first box is where everything lands).

## Context

- **The window of a note had its row under the field** (0109, decision 3), as the chat's field has: the buttons of the marks and of the lists, *Add a file…*, and *To the notebook* at the right.
- **The plugin for Firefox had one key**, Alt+Shift+N, which adds what is selected, or the page where nothing is (0102). A part of the page as a picture, and the page while something is selected, were in the menu of the right button only. The plugin has no window of its own: its button acts at once.
- **Everything made outside the notebook's page landed in the first box** (0103): what the inbox holds, from the plugin and from the window of a note, and what is sent from a file read in Glaukopis. The first box had the tray for its mark, the others a box.
- **The window of a note opens nothing of the notebook** (0109, decision 1), and the helper Firefox starts writes into the inbox and reads nothing: neither knows the boxes.

## Decision

1. **The row of the window of a note stands over its field**, with a line under it; what it holds and in what order is as it was, *To the notebook* at its right. What is said where the note could not be sent stays at the foot of the window.
2. **The plugin has three commands**, each a key Firefox lets the writer change (`about:addons`, the gear, *Manage Extension Shortcuts*):
   - what is selected, or the page: **Alt+Shift+N**, as before;
   - a part of the page as a picture: **Alt+Shift+P**, which begins the marking as the menu does;
   - the page whole, though something is selected: no key until it is given one.

   An image has no key: it is the one the pointer is on, which a key does not say. The commands are named in Firefox's list by the words the menu has for them. The plugin is version 1.0.1.
3. **One box of the notebook receives what is made outside its page**: a note written in a window of its own, what the plugin hands over, and what is sent from a file read in Glaukopis. It is the first box until another is made the one: **Notes from outside come here** in the menu of a box, ticked on the box that receives. Chosen on that box, the first receives again; so does it when the box is deleted. A note that arrives in a box other than the first is not yet placed on its surface, as a note moved there is not.
4. **The tray is the mark of the box that receives**, in the column and in *Move to*; every other box has the box, the first too.
5. **It is kept in the notebook's document**, as `receives` on the box, undone and redone with everything else. Where two boxes have it (made so at once in two windows), the first of them in their order receives, and making a box the one takes the mark from the others.

## Choices made in building this, which the owner has not been asked about

1. **One box for all that comes from outside**, not one for the window and one for Firefox, and set in the notebook, not in the window of a note or in the plugin: neither knows the boxes, and a setting in one place is the plain thing. A box chosen in the window of a note itself, for that note, would need the window to be told the boxes (a small file the application keeps beside the inbox); it is not done.
2. **What is sent from a file read in Glaukopis goes there too**, though the owner named the two windows only: it is made outside the notebook's page as they are, and three ways in with two rules would have to be explained.
3. **What is made on the notebook's page is as it was**: a new note, files added or dropped and a paste outside a text lie in the box in view, and in the first box where all notes are in view. Notes of a box deleted go to the first box.
4. **The words** *Notes from outside come here* (*Notater utenfra kommer hit*), and the item in the menu of every box, the first too, so that the tick is always to be seen somewhere.
5. **Alt+Shift+P** for a part of the page (P for picture), and no key for the page whole, which Alt+Shift+N adds where nothing is selected.
6. **What is said where a note could not be sent stays at the foot**, away from the button now: it is a line of the window, as messages are at the foot elsewhere.

## Not done

- No box chosen in the window of a note or in Firefox, and no box for each of them (choice 1).
- **The plugin as changed is not signed**: Mozilla signs each version once, with the owner's keys. Until 1.0.1 is signed and its file is in `packaging/firefox/`, the plugin that is offered is 1.0.0, with its one key.
- Not tried: the keys in Firefox itself (the scripts have no Firefox; the event page is tried with a Firefox made of mocks).

## As built, 2026-11-16

- **The window**: `notebook/window/NoteWindow.svelte` (the row before the field; its tooltips under it).
- **The plugin**: `extension/firefox/manifest.json` (`add-region`, `add-page`, version 1.0.1), `background.js` (`KEYS`: each command by its name); its README and `packaging/firefox/README.md`.
- **The box that receives**: `notebook/model/boxes.ts` (`receivingOf`, `receiveIn`), `notebook/model/notebook.svelte.ts` (`receiving`), `notebook/inbox.ts` and `notebook/from-file.ts` (the note made in it), `notebook/BoxColumn.svelte` (the item of the menu, the tray), `notebook/NotebookView.svelte` (the tray in *Move to*); the word `notebook-box-receives` in English and Bokmål.
- **Tests**: `model/boxes.test.ts`, `inbox.test.ts`, `from-file.test.ts`, `BoxColumn.svelte.test.ts`, `plugin-background.test.ts`. The scripts `e2e/note-window.mjs` (the row over the field), `e2e/notebook-plugin.mjs` (a box made the one that receives, and a selection handed over then lying in it) and `e2e/notebook-boxes.mjs` (the menus of the boxes).
