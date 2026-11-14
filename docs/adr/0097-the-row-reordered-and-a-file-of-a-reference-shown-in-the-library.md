# 0097 — The row reordered, and a file of a reference shown in the library

Date: 2026-11-14. Status: built on 2026-11-14 from the owner's words of the same day (the last section of `docs/brief.md`): "The icons on the title bare should be placed like this: Left side: Projects, Library, List of Projects. Right side: Search, Keyboard, Settings. When I press the file name of an added file to a reference on the library page, I get a menu with all the projects. What is that for? I suspect we do not want it. Would it be possible to have a show button for pdfs and images added to references where it is listed in the info view of the reference?" Amends 0096 (the order of the row) and 0074 (a press on a PDF or an image in the pane of a reference added it to the tabs of a project chosen from a menu); the reader of a file is the one of 0073.

## Context

- **The row at the top of the window** (0096) had the list's button and the house at its start, and the library, the search, the keys and the settings at its end.
- **In the pane of a reference on the Library page**, a press on the name of a PDF or an image opened a menu of every project, to add the file to that project's tabs (0074). Nothing else in the pane showed the file in Glaukopis: the file could only be opened in another program. The menu reads as a list of projects for no evident reason, and adding a file to a project's tabs is done better from the project, by the plus of its tabs, or from the files of the library.
- **The files view reads a file in the place of its list** (0073), the pane of the file beside it.

## Decision

1. **The row**: at its start the house of the projects, the library, then the list's button; at its end the search, the keys and the settings. Where the start of the row stands is as 0096 has it: in the list's head while the list is shown, else at the left end of the project's top row or of the row over the view. Where there is no list, its button is still shown, disabled, so that the row is the same everywhere.
2. **A PDF or an image of a reference is shown in the library.** In the pane of a reference on the Library page, each PDF and image has a **Show** button (an eye), and a press on its name does the same: the file is read in the place of the list of references, with the reader of the files view, its pages, zoom and printing, and the reference stays in the pane beside it. **Back to the references**, or Escape, returns to the list, the reference still selected. Another reference or another collection ends the reading. A file of another kind still opens in its own program.
3. **The menu of projects leaves the pane of a reference.** *Add to a project's tabs…* stays where it was in the files of the library, and the tabs of a project are added to from their plus.

## Consequences

- The files of a reference can be read where the reference is, for instance to check a title page against the entry, without leaving the library or opening a project.
- `FileReader` takes the words of its back button from where it stands. `ReferencePane` takes `onshow`.
- The message *library-pane-add-to-tabs* is gone; *library-pane-show* and *library-back-to-references* are new, in English and Bokmål.
- Scripts: `window-row` checks the new order; `files` checks Show, the name, Back and Escape in the pane of a reference.
