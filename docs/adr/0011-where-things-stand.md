# 0011 — Where things stand, and tables

Date: 2026-09-28. Status: accepted.

## Context

Figures and equations stood in the middle of the page, and nowhere else. The
one the application is made for asked that where they stand can be chosen,
that the text can flow around a figure, that several can stand beside each
other, and for tables, for which "the same goes"; with the format of the
document saying what holds when nothing is said.

Every kind of document that is made (ADR 0005) has its own means for this,
and some have none: Pandoc sets every table and every equation in the
middle, Typst has nothing that makes text flow around a figure, a table of
LaTeX that may go over several pages cannot stand in anything.

## Decision

- **Of each figure, table and equation it can be said where it stands**, and
  of a figure and a table whether the text flows around it. What is not said
  is as the format says, which has these settings for figures, for tables
  and for equations. Nothing flows around what stands in the middle.
- **Things beside each other are a row**, which holds them: a part of the
  text of its own, and not something said of each. So what stands together
  is one thing to move and to take away, and no two can be half beside each
  other. A row of one is no row.
- **In a row, what is said of the things stands in a line of its own**, over
  them or under them, and the things with their feet on one line: the
  pictures are what the eye sets beside each other, not the boxes they and
  their captions make.
- **A table is put together by the application, as a figure is** (ADR 0009):
  its number, the word before it, what is said of it and where. The rows and
  cells are written by Pandoc, which knows how each kind of document writes
  a table; the lines, the size of the type and where the table stands are
  set as the format says.
- **Each kind of document is given what it needs, by its own means.**
  - *Typst*: blocks with names, which the opening of the document says how
    to set, and two functions there. Text flows by `wrap-it`, a package its
    author has given to the public domain, which comes with the application
    and is written into the opening of a document that needs it: a document
    must be made without the network.
  - *LaTeX*: `wrapfigure`, and `minipage` for rows. A table that stands by
    itself is the `longtable` Pandoc writes; one that stands in something is
    made a `tabular` of by a filter, from what Pandoc writes.
  - *Word and Writer*: tables without lines, and frames, that hold what
    stands together; where the text flows around them, they float. What
    Pandoc cannot be told, where a table or an equation stands and what
    lines a table of Writer has, is set right in the file after Pandoc has
    written it. What is to be set right is marked in the XML by the
    converter.
  - *On a page of the web*: classes, and a few lines of style.
- **What is said of something that stands at a side stands at that side**,
  whatever the format says of captions; within a frame and in a row it is
  set as the format says.
- **Where the text is written, things stand as in the document**: what says
  so is set on each from what is said of it and what the format says.

## Consequences

- How the text breaks around a figure is not the same in every kind of
  document. In Typst the text that flows is the paragraphs that follow the
  figure; a list or a quotation ends the flowing.
- In Typst, text with notes or other things in it that cannot be parted may
  not flow, and stands under the figure then.
- A table with the text flowing around it, or in a row, does not go over
  several pages.
- What is set right after Pandoc depends on what Pandoc writes. The tests
  make the documents and read them, so that a Pandoc that writes otherwise
  is noticed.
- The panel of a figure no longer goes with the picture while the width is
  set: it stands beside the figure where there is room, and stays where it is.

## Alternatives considered

- *Left to each kind of document*: most of them would set everything in the
  middle, and the format could say nothing.
- *"Beside the one before" said of each thing*, without a row: simpler to
  keep, but nothing in the text to take hold of, and a row could be broken
  by a paragraph put between.
- *A package for Typst fetched when needed*: the first document with text
  flowing around a figure would need the network.
- *Floating pictures of Word* in place of floating tables: what is said of
  the picture would not float with it.
