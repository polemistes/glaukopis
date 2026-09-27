# 0003 — A map and a document are one thing in two views

Date: 2026-09-27. Status: accepted.

## Context

The brief asks that writing should feel like making the map of ideas, collecting
references and putting text into the structure, after which the text is
rearranged and solidified. It also observes that researchers make several
overlapping maps, that the best map may be consumed by the manuscript, and that
books have maps for the whole, for chapters and for themes.

## Decision

There is no separate document type. A map has three presentations: Diagram,
Text and Preview. The manuscript is a map that has matured.

To make that workable:

1. An element's name is either printed as a heading or kept as a working label
   only (`heading: true | false`). Heading level follows the number of
   heading-bearing ancestors, not raw depth.
2. An element can be excluded from the document without being deleted.
3. Elements without a parent are loose: visible on the canvas and at the end of
   the Text view, never exported.
4. Elements and whole branches move and copy between maps. A copy records its
   origin.
5. A map can be duplicated, and a branch can become a new map, in one step.
6. An element can include another map. Inclusion is expanded on preview and
   export. Inclusion cycles are refused when made.
7. Title, authors, abstract, style and format belong to the map, and are shown
   only when preview or export is opened.

## Consequences

- Text within one element is edited as ordinary rich text; a selection cannot
  span two elements. Moving between them with the arrow keys is seamless.
- Splitting an element at the cursor and merging it with the previous one are
  needed as commands, since they replace what a heading typed in the middle of
  the text does in a word processor.
