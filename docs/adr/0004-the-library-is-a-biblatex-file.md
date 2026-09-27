# 0004 — The library is a BibLaTeX file; entries have stable identities

Date: 2026-09-27. Status: accepted.

## Context

The brief asks for references stored in a BibLaTeX file, registered once for all
projects, with collections that link and never copy. Citation keys are edited by
users, and two collaborators may use different keys for the same work or the
same key for different works.

## Decision

- `library/library.bib` is the authoritative store. It is read and written by
  our own parser and writer, which keep every field, including ones we do not
  know, and keep the order of entries. Values are stored as Unicode; braces
  that protect case are kept.
- Each entry carries three fields of our own: `glaukopis-id` (a UUID),
  `glaukopis-added` and `glaukopis-modified`. They are left out when a `.bib`
  file is exported for use elsewhere.
- Projects, collections and citations refer to entries by id. Citation keys are
  for people and for export.
- Attachments are stored by content hash under `library/attachments/` and named
  in the entry's `file` field.
- Writes are atomic (write to a temporary file, flush, rename), and the previous
  version is kept as a backup.
- A project holds a copy of each reference it uses, inside the project
  document, so that a shared project is complete for every collaborator. The
  copy and the library entry are reconciled by id, the most recently modified
  winning.

## Consequences

- The library can be opened by any BibLaTeX tool.
- The whole file is parsed at start and rewritten on change. For libraries of
  tens of thousands of entries this remains well under a second.
