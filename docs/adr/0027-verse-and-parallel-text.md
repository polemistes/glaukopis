# 0027 — Verse, and texts side by side

Date: 2026-10-01. Status: accepted.

## Context

Those who write about drama and poetry quote it, and a quotation of verse
is lines: kept as lines, numbered as the edition numbers them, with the
speaker's name and the stage directions set apart. A text about a Greek
play often gives the Greek beside a translation. Neither could be written:
lines ran together into paragraphs, and nothing stood beside anything.

## Decision

- **Verse** is a block of lines (`verse` holding `verse_line`s in the
  editor; `Block::Verse` in the document). A line is a line, a speaker or
  a stage direction, and may be indented. The block may number its lines
  from a given line, every so many; speakers and directions are not
  counted. The paragraphs selected are made a verse from the kind-of-
  paragraph menu, and a verse is made paragraphs again the same way.
- **Texts side by side** is a block of two sides (`parallel`), each a text
  of its own, holding paragraphs or verse.
- In the editor the numbers are decorations in the margin, computed from
  the lines (`editor/verse.ts`), never part of the text. In Typst the
  lines are blocks the opening of the document sets (`gk-verse`, `gk-line`,
  `gk-parallel` in `formats/typst.rs`), with the numbers placed in the
  margin by a counter. In LaTeX each line is a paragraph of its own, the
  number hanging in the margin. For Word and Writer a verse is Pandoc's
  line block, which keeps lines, with speakers in small capitals and
  directions in italics and the number at the head of its line, small, in
  a character style of its own. Texts side by side are a grid in Typst,
  two minipages in LaTeX and a two-column table in Word and Writer.
- Plain-text readings of a text (search, counting, comparing) take the
  lines one under the other.

## Consequences

- The format could also say how verse is set (indentation, size), as it
  says of quotations.
- Pasting paragraphs into a verse makes them paragraphs after it, not
  lines; a paste that makes lines is a small later piece.
