# 0058 — Headings are numbered level by level

Date: 2026-10-19. Status: accepted by the owner on 2026-10-19; to be built from `docs/plans/the-pages-and-what-holds-where.md`, stage 2. Amends 0028 (formats).

## Context

A layout numbers its headings or not, all of them at once, as 1, 1.1, 1.1.1. Each level of heading has a look of its own, size, weight, letters, whether it begins a page, but not a numbering of its own. A writer who wants chapters numbered and sections not, or chapters in roman and sections in arabic, cannot say so.

## Decision

- **Each level of heading has a numbering**: *as the level above*, which is the default; *none*; or a style of its own, 1, A, a, I or i. The whole layout keeps its switch, *numbered*, which the first level takes as its "above": off, nothing is numbered, as before.
- **A level numbered as the level above is numbered when that level is, in that level's style, under its number**: with the defaults alone, 1, 1.1, 1.1.1, exactly as today. A level set to none is not numbered, and the levels under it that follow it are not either, unless one of them chooses a style of its own, which starts the numbers again from there. The number of a heading is the numbers of the numbered levels above it and its own, with full stops between.
- **Every document follows.** Typst numbers its headings so itself. For LaTeX the counters are set accordingly. For Word, Writer, the web page and the e-book the core writes the numbers into the headings, as it already counts them for cross-references, in place of Pandoc's numbering, which knows one style for all.

## Why not otherwise

- *A numbering pattern typed by hand, as Typst has it*: powerful and unreadable; the few styles cover what style guides ask for, and the rule of following the level above gives the rest.

## Consequences

- `HeadingLevel.numbering`; `Headings::numbered` stays. The look of the levels in Look gets a row *Numbering* first in each level, the switch of all above them.
- `formats/typst.rs` writes a numbering function; `export/latex.rs` the counters; `document/pandoc.rs` the numbers as text where Pandoc wrote them.
