# 0024 — Comments

Date: 2026-10-01. Status: accepted.

## Context

A writer talks to themselves in the margin, and those who write together
talk to one another about the text: a doubt, a question, a word on a passage.
Nothing in the project held that: a note is part of the document, an
association is part of the map, and the notes on references are about the
works. What was wanted is a note that is never part of the text, that says
who wrote it and when, that others may answer but not change, and that is
seen both in the text and in the diagram.

## Decision

A comment is a **thread** on an element: the first note, and the answers
under it, each with its author and when it was written. A thread may be on
a **passage** of the element's text as well. Threads are kept in the
project document, in the map `comments` (`changing/comments.ts`), so that
they are shared, saved and kept in the history like everything else, with
no machinery of their own.

- **The passage is held by two relative positions** of Yjs, taken through
  y-prosemirror, not by a mark in the text. A mark would be part of the
  document, would go into every export unless taken out, and would be a
  change in the eyes of the history. The positions follow the words through
  everyone's edits; the editor draws decorations over them
  (`comments/marks.ts`). Where the words are deleted, the thread stays on
  the element, with the words it was on quoted from when it was made.
- **A note is its author's.** Only its author changes or deletes it; anyone
  answers, and anyone settles a thread or opens it again. The interface
  sees to this, as it sees to every other rule of a shared project.
- **Comments are outside undo.** Ctrl+Z while writing must not take a
  comment away; a note that is deleted is put back from the message that
  tells of it.
- **In the text:** the passage is tinted, and a mark in the right margin
  (the left is the associations') counts the open threads on the element.
  **In the diagram:** the element carries the same mark; a switch among the
  controls shows every open thread as a card beside its element, on a
  dashed line, which can be dragged and never joins the tree. **In the
  panel at the side:** a tab with the threads of the map in the order of
  the text, open, settled or all.
- Comments go into no document. Comments on an element go with it when it
  is deleted, and threads whose element is known to be gone are swept away
  when the project is read, as lost elements are.

## Consequences

- A thread is one more thing a project carries; the document grows by the
  notes written, which is small beside the text.
- Later, as an option: comments into DOCX as Word comments, which Pandoc
  can write, for those who review outside Glaukopis; and comments found by
  the search through everything, under what stands outside the texts.
