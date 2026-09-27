# 0008 — What the user writes about a work

Date: 2026-09-28. Status: accepted.

## Context

Besides what is cited of a work there is what the scholar makes of it:
summaries, doubts, where it bears on an argument. The brief asks for such
notes to be read and written wherever a reference is shown, and for two
kinds of them: for all projects, and for one.

## Decision

- **A note for all projects is the field `annotation` of the entry** in
  `library.bib`. It is what BibLaTeX has for the purpose, other tools read
  it, and it is where the notes of a Zotero library arrive when it is
  imported. The form for the bibliographic details does not show the field:
  it has a place of its own.
- **A note for one project is kept in the project**, by the id of the
  reference, as text that is changed where it differs, so that two who write
  in it at once keep what both wrote. It is with everyone the project is
  shared with.
- **There is at most one note of each kind** for a reference. What is
  written in the library is for all projects; what is written in a project
  is for the project, and can be made a note for all projects, which adds it
  to the one that is there.
- **A project carries copies of the references it cites, with their notes.**
  To one who has the project and not the reference, such a note is a note of
  the project: it is shown as one, and what is added to it is kept in the
  project. The note of the one it came from is not changed by that.
- **Notes are plain text.** A line is a paragraph in the file, where an empty
  line sets paragraphs apart; a line break alone would be lost the next time
  the file is read, by this application or another.
- **One panel** shows the notes, opened by one button that goes wherever a
  reference is shown.

## Consequences

- Sharing a project shares what its owner has written about the works it
  cites. This is what was asked for, and is said in the guide.
- A reference style that prints annotations, for an annotated bibliography,
  prints the notes for all projects.
- The fields `annotation` and `abstract` now keep their paragraphs when the
  library is read and written. Before, they were run together.
