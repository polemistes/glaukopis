# 0025 — Kinds of elements

Date: 2026-10-01. Status: accepted.

## Context

A map of a book about Athens has elements that are cities, persons, events,
sources; a novel's map has characters, places, scenes. The diagram showed
them all alike, and nothing could be said of what an element *is*. Sets of
kinds given by the application were considered and refused: a scholar's
kinds and a novelist's differ, and most work is between the two.

## Decision

A project has its own **kinds**, made by its writer: each a name, a colour
from a palette of ten, and perhaps a text that an element of the kind
begins with. They are kept in the document (`kinds`), so that a shared
project shares them. An element has at most one kind (`kind` on the
element).

- No kinds are given. When a kind is named, the names used in the writer's
  other projects are offered, with the colours they had, so that "character"
  is spelled alike across projects without anything being imposed.
- The colour is shown at the element's left edge in the diagram, as a dot in
  the outline, as a label over the name in the text, and in the element's
  tooltip. The document gets nothing of it.
- Deleting a kind leaves its elements of no kind; giving an element without
  text a kind with a template fills the text with the template's lines.

## Consequences

- Timelines (to come) can make a lane of every element of a kind, and
  colour their lanes by it.
- The palette is fixed and named, so that colours are told apart in the
  light and the dark alike and the document stays small.
