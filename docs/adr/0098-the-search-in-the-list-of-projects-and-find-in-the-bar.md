# 0098 — The search in the list of projects, and Find in the bar of a side

Date: 2026-11-14. Status: built on 2026-11-14 from the owner's words of the same day (the last section of `docs/brief.md`): "There does not seem to be a way to reach the search within a project except by ctrl+f. There should an icon for it, I guess in the toolbar. The search for all projects should not be in the title bar. Instead the find a project search field should be reworked so it can do both. Searching for a project is something few people will need, so searching within the projects should be the default. "Close this side" sounds strange when there is only one side. "Close View" is better, I think. We do not need the eye icon in the reference info view for pdfs and images, when it opens by clicking the file name. In the Your Notes, lose the "What you make of it..." help text. It is patronizing." Amends 0017 (the search through everything was a place of its own, searching the project opened last unless all were chosen), 0064 (the bar of a side), 0096 and 0097 (the search in the row at the top; Show beside a file of a reference).

## Context

- **The search over the text** of a side (0017) opened only by Ctrl+F and Ctrl+H; nothing in the window showed that it was there.
- **The search through everything** was a page of its own, reached by the magnifying glass in the row at the top (0096, 0097) or Ctrl+Shift+F. It searched the project opened last unless *All projects* was chosen. Choosing what was found opened the project in the place of the page, so that going on to the next meant going back to the page.
- **The field at the top of the list of projects** found a project by its name, which few need: the list shows every project already, in its folders.
- **The × of a side** was called *Close this side*, which reads oddly when there is only one.
- **Beside a PDF or an image** of a reference on the Library page stood an eye, *Show*, which did what a press on the file's name does (0097).
- **The fields of what one thinks of a work** had the hints *What you make of it…* in them when empty.

## Decision

1. **Find in the bar of a side.** A magnifying glass beside undo and redo in the bar of each side (where Find stands by Undo and Redo in an Edit menu) does what Ctrl+F does: it opens the search over the text, turning a side that shows the diagram to its text. It is lit while the search is open, and a press then closes it. It does not take the focus from the text, so that what is selected there can still be searched alone.
2. **The search through everything is the field of the list of projects.** The page of the search, and its glass in the row at the top, go. The field at the top of the list searches what is written in the projects, all of them unless the menu says otherwise; what it finds stands in the list in the place of the tree, by project, by the tree under the project and by element, with the words around it, and the options of the search over it. Choosing what was found opens the project beside the list, at it, with the search in the bar over the text; the list keeps what was found, the one chosen marked, so that one is gone to after another. **Escape** or the field's **×** clears the field, and the tree is back.
3. **The menu of the field's glass** says what the field does: **All projects** (the first, and what it does when nothing is chosen), **The last project**, or **Find a project**, which finds projects by their names, as the field did before, the tree showing those that have the words in their names. The words stay the same when the choice changes.
4. **Ctrl+Shift+F** shows the list where it was hidden, turns the field to searching what is written, and puts the cursor in it. From the library or its files it goes first to the project shown last, or to the start screen.
5. **The field elsewhere.** The list in the dropdown of the path, and the chooser of a project, keep a field that only finds a project by its name.
6. **Close view.** The × of a side, and the buttons that close a side that could not be opened, are called *Close view*.
7. **No eye beside a file of a reference.** A PDF or an image in the pane of a reference is shown by a press on its name, as 0097 has it; the eye that did the same goes.
8. **No hints in the fields of notes.** The fields of what one thinks of a work, in the pane of a reference and in the notes of a citation, are empty when nothing is written in them.

## Chosen in the building, and not asked

- What is found stands in the list, in the place of the tree, and not in a page beside it, so that the project opens beside what was found.
- *All projects* is what the field searches when nothing is chosen, where the page searched the project opened last: a field over the list of all projects that searched one of them would surprise. *The last project* stays as the second choice.
- The choices stand in a menu of the glass at the left of the field, which few will open; the options of the search (capitals, whole words, accents, regular expressions, what stands outside the texts) stand over what was found, since the field is narrow.
- The glass in the bar of a side stands after undo and redo, and is not disabled beside the diagram.
- An old address of the page of the search, `#/search`, opens the start screen.

## Consequences

- A text already in view takes what is chosen in the list at once: the jump of 0017 is asked for anew each time, and the text takes it where it shows the tree that holds it already, not only when it is made.
- `SearchView.svelte` is gone; `FoundList.svelte` shows what was found in the list, and `ListField.svelte` is the field of the list. The route `search` is gone.
- Messages: *home-search-what* and *home-search-last* are new; *project-close-side* says *Close view* (*Lukk visningen*); *search-everything*, *search-everything-title*, *library-pane-show* and the three hints of the notes are gone, in every language.
- Scripts: `search` checks Find in the bar, the field of the list, its menu, the options and two found in a row in the same text; `window-row` checks five places, *Close view* and Ctrl+Shift+F from the library; `files` checks that a file of a reference has no eye; `languages` looks at the menu and at what is found; `search-large` searches through the field.
