# 0028 — Formats by kind, and the e-book

Date: 2026-10-01. Status: accepted.

## Context

Glaukopis is for scholarly writing first, and serves every kind of writing
that begins in a map: novels, plays, poems. "Kinds of project", chosen when
a project begins, were considered and refused by the owner: a project is
not of one kind, much writing is hybrid, and nothing is to be withheld.
What tells one kind of text from another is how the document is set.

## Decision

- **The format carries what kind of text it is.** Formats have kinds, and
  the chooser offers them by kind: general, fiction, stage and screen,
  poetry, and the style guides, publishers and journals of academic
  writing. Four formats come with the application for the new kinds: a
  novel as a manuscript for submission (Shunn's format), a novel as a
  printed book, a play script, and a collection of poems. Each says where
  its conventions come from and how sure that is; the play and the poems
  are of low confidence, as no publisher's page is reproduced.
- **A level of heading may begin a new page** (`newPage` on a level), as
  the chapters of a book do: a page break before the heading in every
  kind of document that has pages.
- **An e-book** (EPUB) is among the exports: Pandoc makes it, with a
  stylesheet from the format and each chapter a part of its own; the
  reader sets the text, so the format says little.
- No vocabulary is set by the kind; the interface's words are the same for
  every writer. The paragraph kinds of a script (scene heading, action,
  character, dialogue) are to come; a play is written with its speeches as
  verse, which has speakers and stage directions already.

## Consequences

- A screenplay format waits on the paragraph kinds of scripts.
- The e-book carries pictures and notes as Pandoc writes them; a cover is
  not given yet.
