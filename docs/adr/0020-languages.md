# 0020 — The languages of the interface and of the texts

Date: 2026-09-28. Status: accepted.

## Context

The one the application is made for asked for the interface and the
documents to have languages: that of the system where the application has
it, English where it does not, and changeable; for now English and
Norwegian Bokmål.

A map has had a language since documents were first made of maps: it is
given to Pandoc and Typst, which choose by it the words they print
("Figure", "Contents") and the reference style's words ("and", "p.").
Some words are the application's own: the heading of the notes, of the
abstract, of the keywords, of the bibliography, which the formats have in
English.

## Decision

- **The words of the interface are kept in Fluent**, the format of
  Mozilla's localisation: a file for each part of the application and
  language, in `locales/<language>/`. English is the source; a translation
  that lacks a message shows the English one. Fluent says plurals and
  other turns of language in the translation, not in the code, and can be
  worked on by translators with tools of their own.
- **The core has its words there as well** (`locales/<language>/core.ftl`),
  read by the Rust implementation of Fluent, in the language the interface
  has.
- **The language of the system** is what the system says (`LANG` and its
  like), or `GLAUKOPIS_LANGUAGE` where it is set. Norwegian without more
  (`no`) is Bokmål; Nynorsk, which the interface does not have, is shown in
  Bokmål, as Norwegians read both; any other language that the interface
  does not have is shown in English.
- **The interface has a language in the settings**: that of the system, or
  one chosen. It changes at once.
- **A new map is given the language of new texts**, which is that of the
  system, where there are words for documents in it, or one chosen in the
  settings; and is written into the map, so that the map is the same for
  everyone it is shared with. Maps that had no language keep English.
- **The words a document prints are in the language of the document**, not
  of the interface. The words of the formats ("Notes", "Abstract",
  "Keywords", "Bibliography", "Figure" and their like) are given in the
  language of the document where the format has them as they are in
  English (`locales/<language>/document.ftl`); a format that has words of
  its own keeps them.
- **Dates and numbers** are written in the way of the language of the
  interface.

## Why not otherwise

- *Messages in TypeScript*: checked by the compiler, but a translator must
  work in code, and the core would need another way for its own messages.
- *The language of the interface for new texts*: a writer may well work in
  an English interface and write in Norwegian, or the other way round.
- *A map without a language taking that of the computer it is opened on*:
  the same project would make different documents for different writers.

## Consequences

- The tests of the running application set `GLAUKOPIS_LANGUAGE=en`, as their
  words are English; one script tries the Norwegian.
- Every word shown is looked up by a name. A test checks that each name used
  in the code is in English and in Norwegian, with the same variables.

## Addendum of 2026-10-04: the language of a project's new maps

A map's language could be changed only with the details of its document,
over the preview, which few found; and a project written in another
language than the writer usually writes in had every new map given the
wrong one, to be changed by hand.

- **A project may have a language for its new maps**, kept in the shared
  `meta` map of the document as `language`, so that every copy of the
  project makes its new maps alike. A new map is given, in this order: the
  project's language, where one is chosen; else the settings' language of new
  texts, as before. A map made from a document keeps the language the
  document says, before either.
- **A dialog, *Languages…*, in the menu of a map** has the language of this
  map and the language of new maps in the project, each with a line on what
  follows from it: the words a document prints, the dictionary of spelling,
  the quotation marks of a mention. The details of the document keep the
  map's language as well.
- **Foreign words are checked in their own language**, as the guide had
  promised: a kind of words with a language has its words judged by that
  language's dictionary where there is one, and left alone where there is
  none, in the editors and in the text drawn without one.
