# 0007 — Where references come from

Date: 2026-09-27. Status: accepted.

## Context

The brief asks for references to be imported from `.bib` files and from
Zotero, for citation data to be fetched from external databases "if they
allow this and are reliable", and for PDFs to be imported. Everything is to
be kept in the application's own store, and duplicates are to be avoided.

Which services allow what, and how good their records are, was looked into
on 2026-09-27: see `docs/research/bibliographic-apis.md`.

## Decision

- **Every source yields candidates, and one pipeline takes them in.** A
  `.bib` file, a lookup, a PDF and Zotero all produce `Candidate`s (a draft,
  files, collections, notes). `import::plan` compares them with the library
  and with one another; the user sees the plan and decides; `import::apply`
  carries it out. There is one place where duplicates are found, and one
  dialog.
- **Lookup** asks doi.org for DOIs (with Crossref asked a second time for
  the book a chapter is in), library catalogues over SRU for ISBNs and for
  books by words (K10plus; the Norwegian academic libraries; the Deutsche
  Nationalbibliothek; the Library of Congress last), Crossref for articles by
  words, arXiv and PubMed by their numbers. Services that need a key, that
  forbid this use, or whose records were found unreliable are not asked.
- **BibTeX as served by the services is not used.** It is where their
  records are worst. Records are read as CSL-JSON and MARC, and mended:
  markup removed, capitals put right, titles and subtitles told apart,
  cataloguers' punctuation removed, names taken apart.
- **What was mended is said.** A hit carries remarks, which the form shows.
- **Lookup is part of the form for a new reference**, not a place of its
  own: it is then wherever references are added.
- **A PDF is read for its DOI, ISBN or arXiv number**, which is looked up.
  Numbers in the list of references of an article are not taken for its own.
  A file that says nothing of what it is is kept under its name.
- **Zotero's database is copied and the copy read**, so that Zotero may be
  running and nothing of it is changed.
- **The address of the user is sent to no service** unless the user has
  entered one in the settings for that purpose.

## Consequences

- Lookups need the network; nothing else does.
- The services ask to be acknowledged. The settings name them, in the words
  they ask for.
- A catalogue record of a book names an edition. For a work with many
  editions the user is shown several records and chooses.
- PDF reading depends on `pdf-extract` and `lopdf`, which panic on some
  damaged files. The panics are caught, which requires `panic = "unwind"` in
  the release profile.
