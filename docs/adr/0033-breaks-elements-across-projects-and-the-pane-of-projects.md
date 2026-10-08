# 0033 — Breaks in search, elements across projects, and the pane of projects

Date: 2026-10-08. Status: accepted. Adds to ADR 0017 (search and replace)
and to the copying of elements (ADR 0010's copies, `project/clipboard`).

## Context

The one the application is made for, after using it:

- A text has two breaks, the paragraph (Enter) and the break within a
  paragraph (Shift+Enter, `hard_break`). A regular expression found only
  the second, as `\n`, never a paragraph break, and a replacement could make
  neither. And the break within a paragraph could not be told from the end of
  a paragraph by looking. Asked whether one break would be better, the
  answer was to keep both, but to let search and replace find and make both,
  with a sign of their own, and to show the break within a paragraph.
- Elements could be copied and moved between the maps of one project, not to
  another project.
- The list of projects stood only on the home page, so going from one project
  to another went through it.

## Decision

### Breaks in search and replace

- **Two signs, in regular expressions only.** `\n` is a break within a
  paragraph, as before; `\p` is a paragraph break. Both may stand in what is
  searched for and in what replaces it. (`\p{…}`, the classes of Unicode, keep
  their meaning; a `\p` not followed by `{` is the paragraph.) In plain words
  nothing changes.
- **A search across paragraphs.** Where what is searched for holds `\p`, the
  paragraphs that follow one another in the text of one element are read as
  one passage, joined by a paragraph separator (U+2029) that `\p` stands for;
  otherwise each paragraph is a passage as before, so that nothing found today
  is found otherwise. The name of an element, a note, an equation, the caption
  of a figure or table and a cell of a table are never joined to what is
  around them. What is found may then begin in one paragraph and end in
  another: it is marked, shown and selected across them.
- **A replacement makes breaks.** `\n` in what replaces makes a break within
  the paragraph; `\p` splits the paragraph there, the part after it a new
  paragraph of the same kind. What is found across a paragraph break and
  replaced joins the paragraphs, the first keeping its kind.
- The search through everything finds with `\p` as well, and shows what it
  found with a ¶ where the paragraph broke.

### The break within a paragraph is shown

- On the screen it is drawn with a faint ↵ at the end of its line, in the
  editors, in the text drawn without an editor, and wherever else the text is
  drawn (the history, a review). The sign is the style sheet's, not text: it
  is not copied, searched or printed, and not in the preview or the
  manuscript.

### Elements to another project

- **Copy and Move to a project.** The menu of elements has, under *Copy to*
  and *Move to*, beside the other maps of the project, the other projects,
  each with its maps; an element goes in at the end of the centre of the map
  chosen. A move is a copy there and a removal here, in one step that can be
  undone here.
- **The clipboard reaches across projects.** Elements copied (Ctrl+C in the
  diagram) can be pasted (Ctrl+V) in another project; within the same project
  they are pasted as before, as copies that remember their original.
- **A portable form.** Across projects an element is carried as what it is,
  not as a reference: its name, its text and notes (as the document model,
  `Block`), its kind of element, its colour, its time, whether it is folded,
  and everything under it, with the links between the elements carried. The
  kinds of element, of paragraph and of words that the project made for
  itself and that the elements use go with them, unless the other project has
  a kind of the same id or name, which is then used. References and pictures
  are in the library and the store, which all projects share, and stay as they
  are. What does not cross: comments (they are the conversation of a project),
  that a copy is a copy of an original, and the inclusion of a map. Words that
  point to an element left behind point to nothing, as when it is deleted.
- **Writing into a project that is not open**: it is opened, written and
  saved, in the background, and closed again.

### The pane of projects

- In a project, a pane at the left, beside the rail, holds the list of
  projects as the home page has it: the folders, the projects, the search in
  them. A project is opened from it with one click; the project that is open
  is marked. It is opened and closed by a button in the bar of the map and by
  **Ctrl+Shift+L**; whether it is open is remembered (`projectsPane` in the
  settings), and so is its width.

## Consequences

- A text search with `\p` reads larger passages, which costs little: only the
  text of one element is joined.
- An element copied to another project and changed there does not show as a
  copy of the one it came from.
