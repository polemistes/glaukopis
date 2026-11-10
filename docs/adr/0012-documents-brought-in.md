# 0012 — Documents brought in from files

Date: 2026-09-28. Status: accepted.

## Context

The one the application is made for has texts that were written elsewhere,
and asked that they can be brought in, from OpenDocument, Word, Markdown and
other kinds of file that matter, each as a map of its own.

A map is a document (ADR 0003): a centre, elements under it, and text in
each. A document from a file is headings and text under them. Pandoc, which
the application already uses to write documents (ADR 0005), reads most kinds
of document there are.

## Decision

- **Pandoc reads the file**, and gives the document as JSON in its own
  shapes. The core turns that into the shapes a text has in the application
  (`crates/core/src/import/document.rs`), in sections: what stands before
  the first heading, and every heading with what stands under it. The
  interface makes the map of the sections. Plain text is read without
  Pandoc.
- **The title is the centre, every heading an element under the heading
  above it.** Headings that leap a level are set right under the one above
  (1, 3 becomes 1, 2). A document without a title, with one heading alone at
  the top, has that heading as its title.
- **The map is made in one step**, which can be undone as one, and only
  when the one who brought the document in has seen what was found and said
  so. Nothing is made while the file is read.
- **Where Pandoc reads badly, it is given a copy that it reads well.** What
  stands in frames and text boxes of a Word or OpenDocument file, which is
  where LibreOffice puts a picture with its caption, is lifted out into the
  text in a copy in the work directory, and captions are marked there by
  their style, so that they are known afterwards. Pandoc reads the copy.
- **A caption belongs to what it speaks of**: a paragraph that stands
  directly beside a figure or a table, and is a caption by its style or by
  its shape (a word, a number, a sign, and then words), becomes what is said
  of it, without the word and the number. No list of words is kept: they
  are in every language.
- **The file is not changed, and nothing is fetched.** Files that hold their
  pictures are read with Pandoc kept from everything but the file; files
  that name their pictures have them read from beside the file. A picture
  that is on the network is left out, and that is said.
- **Pictures go into the store of pictures** (ADR 0010) when the file is
  read, and are taken out again if nothing is made of it.
- **Citations by key become citations where the key is in the library.**
  Where it is not, and where a program that keeps references made them,
  they stay the text they were written as, under a mark that says what is
  known of them, to be gone through by the writer (ADR 0015). No reference
  is made from a document without the writer saying so.
- **What has no place in a map is kept as text where it has text**, and
  otherwise left out: code, lists of terms, lines across the page, what is
  written for one kind of document only. What was done is said in words,
  before the map is made.
- **The kind of a file is told from the ending of its name.**

## Why not otherwise

- *A reader of our own for each kind of file*: years of work that Pandoc has
  done, and done better.
- *Making references from the list of works cited*: a list in a document is
  text set by a style, and a reference made from it would be a guess. The
  library has better ways (ADR 0007).
- *Bringing a document into the map that is open*: the brief asks for a map
  of its own, and a map can be copied and moved into another afterwards.

## Consequences

- Without Pandoc, only plain text can be brought in; the application says
  that Pandoc is missing.
- What Pandoc cannot read is lost, where the application does not read it
  itself (the properties of Word and OpenDocument files, frames, captions):
  the mathematics of an OpenDocument file, notes in some Rich Text files.
- The language is not read from Word and OpenDocument files, which hold the
  language of the machine they were written on.
- The shape of a caption can be that of a paragraph that is none, directly
  beside a table or figure without a caption. That is rare, and seen before
  the map is made only in the count of what was found.
- A file over 50 MB is not read.
- Where things stand, and the width of a figure where the file gives none,
  are as the format says (ADR 0011).

## Addendum, 2026-11-10: the paragraphs of a list without a number

The owner brought in an ODT file with a numbered list that had paragraphs of text between its points, and every paragraph came in numbered. A word processor keeps such a paragraph with the point before it: LibreOffice writes it as an entry without a number (`text:list-header`), which Pandoc reads as an item of its own; a point of several paragraphs Pandoc reads as one item, of which the import made every paragraph a point.

- **Before Pandoc reads an ODT**, an entry without a number is moved into the item before it, as a further paragraph of it; one before the first item, a heading of the list, is put before the list (`lifting.rs`).
- **An item's first paragraph is its point**; what more it holds follows the point as text, set in a step further than the point, as the word processor shows it. Where the list has been broken so, the next point of a numbered list is given its number in the mark of its line, as `7. ` typed at the start of a paragraph gives it, so that the count goes on: in the document, which begins a numbered list at the number of its first point, and where the text is shown.
- **A point given its number by hand is shown with it.** The editor counted the points of a run from one whatever the mark said, and the text drawn without an editor showed the browser's numbers of its lists beside the editor's; now the editor counts on from the number given (`editor/given-numbers.ts`), and the drawn text writes each point's number and draws no marks of its own lists, with the gaps between paragraphs the editor has.
- **Not done**: a list that LibreOffice ends and continues after paragraphs that are no part of it (`text:continue-list`) is read by Pandoc as two lists, the second begun at one; Pandoc reads no number given an entry (`text:start-value`) either. That is left until it is met.

Checked: a test of the move, of the items read, of the numbers drawn and of the editor's plugin; `e2e/lists-brought-in.mjs` brings in both shapes and finds the points 1, 2 and 3 with the paragraphs set in between them, in the drawn text, where it is written and in the Typst of the preview.
