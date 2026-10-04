# 0030 — Where a citation stands beside punctuation

Date: 2026-10-05. Status: accepted.

## Context

A style of notes sets a citation as a footnote, whose mark stands after the
full stop: *said.¹*. A style of author and year sets it in the line, before
the full stop: *said (Nagy 1979, 73).* A text written for the one has every
citation on the wrong side of its punctuation for the other, and the one
the application is made for found that changing the style meant going
through the text and moving them by hand.

## Decision

- **Where a citation stands beside punctuation is the style's to say**, as
  the look of a kind is the format's (ADR 0029). The writer writes the
  citation where it belongs in the sentence, either way. As the document is
  set, for the preview and for every export, each citation that touches
  punctuation is moved to where the style has it
  (`crates/core/src/document/beside.rs`): a style of notes (class `note` in
  CSL) after the stops and the closing quotation marks, with no blank
  before the mark; every other style before the stops, after a closing
  quotation mark, with one blank before it.
- **What counts** is sentence punctuation, `. , ; : ! ?`, and what closes a
  quotation, with nothing but blanks between it and the citation. A closing
  bracket is never passed: a citation written within brackets stays within
  them. A citation with words on both sides stands where it is; one whose
  author is named in the sentence is part of the sentence and is left alone;
  within a note, a citation is set in the line of the note, whatever the
  style. The writer's own notes stand where they were written.
- **The text in the editor stays as written.** The preview shows the result.
- Where the citations are kept as they are for another program to set
  (LaTeX with BibLaTeX, Markdown), nothing is moved: BibLaTeX moves them
  itself, by its own rules.

## Why not otherwise

- *Pandoc's citeproc alone*: its `notes-after-punctuation` moves a mark
  after the punctuation for a style of notes, but moves nothing back for a
  style in the line, and the pages of the preview are set by Typst's own
  engine, which moves nothing.
- *A setting on each citation*: it would have to be changed with the style,
  which is what was to be avoided.

## Consequences

- Numeric styles with superscript numbers have house rules either way, which
  CSL does not state; they are treated as styles in the line, as Pandoc
  treats them.
- A place where the writer wants the citation left where it is, against the
  rule, is not provided for until it is wanted.
