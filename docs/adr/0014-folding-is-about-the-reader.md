# 0014 — What is folded away in the text is about the reader

Date: 2026-09-28. Status: accepted.

## Context

In the text of a map, what is under an element can be folded away, and is
to be as it was left when the project is opened again. The diagram already
folds (`collapsed` of an element), and keeps that in the project, where
everyone the project is shared with has it as well.

## Decision

- **What is folded in the text is kept with the view of the project on the
  computer**, where the panes and the places in the diagrams are kept
  (`view` in `project.json`), and not in the project itself.
- **The text and the diagram fold apart.** Folding in one does nothing in
  the other.
- **Each element is folded by itself.** Opening an element shows what is
  directly under it as it was; all that is folded under an element is
  opened by one act of its own.
- **Folding hides, and does nothing else.** The document, its preview and
  the count of its words are of the whole text. What leads to an element
  that is folded away opens what it is under.

## Why not otherwise

- *In the project, as the diagram has it*: one who folds a part away would
  take it from under the hands of another who is writing in it. In the
  diagram an element that is hidden is at worst not seen; in the text it is
  where someone is writing.
- *The same for text and diagram*: they are folded for different ends. The
  diagram is folded to see the shape of the whole, the text to have room
  for the part that is being written, and the one would undo the other.

## Consequences

- What is folded does not follow the project to another computer.
- A copy of a map has nothing folded, since its elements are new ones.
