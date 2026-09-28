# 0015 — Citations that are found in a text written elsewhere

Date: 2026-09-28. Status: accepted.

## Context

A text that is brought in (ADR 0012) has its citations as they were made
where it was written. The one the application is made for asked that they
can be made citations of the application: found, proposed with references
of the library, and gone through one after the other in a window that may
open when a text is brought in, and can be opened for any map.

There are three kinds, of falling certainty:

1. **Made by a program that keeps references.** Zotero and Mendeley write
   into the Word or OpenDocument file what is cited: the works with all
   that is known of them, the page, the words before and after.
2. **Tags** in files of text, which name a reference: `[@nagy1979, 73]`,
   `\cite[73]{nagy1979}`, `[cite:@nagy1979]`.
3. **Words and nothing else**: "(Nagy 1979, 73)", or a note that reads "See
   Nagy, *Best of the Achaeans*, 73; but cf. Lord, *Singer of Tales*, 12,
   who argues otherwise."

How citations are written follows the style. Styles of author and year
have them short, in parentheses in the line. Styles of notes have them in
notes, often within prose, which in a citation of several works is what is
said before and after each of them.

## Decision

- **What was found stands in the text as the text it was, with a mark on
  it** (`found`), which holds what is known of it: by what it was found,
  the works with what the file says of them, pages, words before and
  after. It is shown with a line of dots under it. In the documents that
  are made it is the text it is.
- **The mark is kept in the project**, with the text. So the citations can
  be gone through at any time, in any order, a few today and the rest
  later, and by anyone the project is shared with; and nothing is lost if
  the window is closed.
- **Text that only looks like a citation has no mark.** It is looked for
  when the window is open, if the writer has said that it is to be:
  parentheses with a year in them, and notes. It gets a mark only when the
  writer has said that it is to be left as text, so that it is not
  proposed again.
- **A reference is looked for in the library in the order of what is most
  certain**: the key of the item in Zotero, which an entry that came from
  Zotero keeps; the tag; the DOI or ISBN; and then what tells works apart,
  as when duplicates are looked for (author, year, title). Only what is
  certain is ever made a citation without asking.
- **What Zotero cites and the library has from Zotero can be made
  citations at once**, if the writer has said so. Everything else is
  proposed and waits for the writer.
- **A work that the library does not have, and the file tells of, can be
  added to the library from what the file says of it**, since a file
  written with Zotero holds all that Zotero knew of the work.
- **The window shows one citation at a time**, in the sentence it stands
  in, with what is proposed for it: for each work the reference, the page,
  the words before and after. The writer accepts it, changes it, by the
  same means as when citing, or leaves the text as it is.
- **Of text, the parts are proposed**: a citation in words is parted at
  its semicolons into works; in each, the words that name the work, the
  page after it, and what is left before and after, which becomes the
  words before and after the work in the citation. The writer sees the
  parts, and changes them where they were parted wrongly.
- **Of a citation in a note the writer chooses** whether the note becomes
  a citation, which the style of the references then sets in the line or
  in a note, or the citation stands within the note, which stays a note.
  The first is right for a note that is a citation and nothing else, the
  second for a note that says something and cites on the way.

## Why not otherwise

- *Made citations at once, all that can be*: what is not certain would be
  wrong in places no one looks at again. A citation that is wrong is worse
  than a text that is not yet a citation.
- *A list kept beside the text, not marks in it*: the text is changed
  while the list waits, by the writer and by others; what is marked goes
  with the text wherever it goes.
- *Marks on all that looks like a citation*: they would have to be made
  when the text is brought in, by rules that the writer may not want, and
  would be in the text of everyone.
- *References made from words*: a reference made from "Nagy 1979" is a
  guess. The writer finds the work, as when citing.

## Consequences

- What is said before and after a work in a citation is words without
  marks: what stood in italics in a note stands upright in the citation
  that is made of it.
- A citation that is made takes the place of its text. What it then reads
  is what the style of the references makes of it, which is seldom what
  the text read.
- Entries that came from Zotero before this keep no key of their item.
  They are found by what tells works apart, and bringing the library in
  from Zotero again gives them their keys.
- Mendeley, and other programs that write as it does, give no key that
  the library knows, and are found by what they say of the work.
