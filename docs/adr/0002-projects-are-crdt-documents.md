# 0002 — A project is one CRDT document

Date: 2026-09-27. Status: accepted.

## Context

Projects must be editable by several people at once, must work offline, and
need undo across both the map and the text. Moving an element in a mind map is
the most frequent structural change, and must not lose text typed into it by
someone else at the same moment.

## Decision

Each project is one Yjs document, owned by the interface. The Rust side stores
it (a state file plus a log of changes) without interpreting it.

- Elements live in one flat table keyed by id. Each holds its parent's id and a
  fractional order key. Moving an element changes those two values; its text is
  never copied, so concurrent edits survive a move, even to another map.
- The text and the name of an element are Yjs XML fragments bound to
  ProseMirror editors.
- Associative links are a table of their own.
- If concurrent moves ever produce a cycle, it is broken deterministically when
  the tree is read: the element with the lowest id in the cycle is treated as
  loose.
- One undo manager per project covers structure and text together.
- A readable Markdown copy of every map is written beside the state file on
  save, so that the work never depends on this application to be read.

## Consequences

- Local saving, undo and collaboration are one mechanism.
- The Rust side cannot query project content; export receives the document from
  the interface as plain JSON.
- Deleted content remains in the document's history and makes the state grow.
  Acceptable for text.
