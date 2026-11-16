# 0106 — Help: the guide within the application

Date: 2026-11-16. Status: built on 2026-11-16, from the owner's words of the same day, on finding that the application has no command that opens its guide: "Glaukopis should have a help function, more than the keyboard sheet." The design was the main thread's, built by an agent, and not shown to the owner first.

## Context

- **The guide** (`docs/guide.md`) is installed with the packages and can be read on GitHub, but nothing in the application leads to it. The sheet of keys is the only help in the window.
- **The guide is long** (some 4100 lines, 31 chapters) and written in a small part of Markdown: headings, paragraphs, points, numbered points, tables, bold, italics, code.

## Decision

1. **Help is a window over the view**, as the settings are: **F1** everywhere (also while a text has the cursor), the question mark at the right end of the row at the top, and the palette. F1 again or Escape closes it. One such window at a time: Help, the settings, the sheet of keys and the palette close one another.
2. **The guide, a chapter at a time**: the chapters at the left (the guide's `##` headings), and under the one in view its parts (`###`); the chapter at the right, set as reading text, with the chapter before and after at its foot.
3. **It opens at the part about where the writer is**: the list of projects at *A first project*, a project's diagram at *The diagram*, its text at *The text*, its timeline at *Timelines*, the library, the files, the notebook and a file in a side at theirs. Opened again at the same place, it is where it was left: one reads a step, does it, and reads on. Kept for the run.
4. **Find in the guide**: the parts that hold all the words typed, folded as the library folds them and at the beginnings of words; Enter goes to one with the words marked.
5. **The guide comes with the application** as its text, read when Help is first opened, in English whatever the language of the interface.
6. **A reader of the guide's Markdown of the application's own**, with no new dependency: everything is escaped, and a test reads the whole guide and fails where it holds something the reader does not understand, so that the guide and the reader stay in step.

## Chosen in the building, and not asked

- The window is as large as the settings.
- Opening Help puts the focus in the text, so that the keys that scroll work at once; Ctrl+F goes to the field.
- "The same place" means the same part of the guide: two projects both in the diagram are the same place.
- Going to another place (Ctrl+1 to 4, the search through everything) closes Help, as it closes the settings.
- Arrow keys choose among what was found; Enter or a press shows it. A part found is brought a third of the way down.
- A lone `*` with a space after it is a star, as Markdown has it.
- The guide in the other languages is not translated: Help is in English throughout but for its own few words.

## Left for later

- The guide in other languages.
- Help that opens at a finer part (a pane, a dialog) than the place of the window.

## Checked

`pnpm check`, `pnpm test` (the reader against the whole guide, the chapters and finding, where Help opens, the marks, the window mounted). Against the built application: `e2e/help.mjs`, and `window-row` and `languages`, whose counts of the row at the top have the new button.
