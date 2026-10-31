# 0078 — A level of heading counted on through the document

Date: 2026-10-31. Status: built on 2026-10-31 from the owner's request of 2026-10-31 ("I am writing a book with three parts, each with three chapters. The chapters should be numbered 1-9. Is this possible now?" — "We need this, so make it"). Amends 0058.

## Context

0058 gave each level of heading a numbering of its own: a style, none, or as the level above. The count itself stayed as word processors and Typst have it: a heading begins the levels under it anew, so the first chapter of every part is chapter 1. Parts at *None* with chapters at *1, 2, 3* gave 1, 2, 3 in every part; parts in roman gave I.1, I.2, II.1. A book whose chapters run 1 to 9 through three parts could be set only by typing the numbers into the titles with the numbering off, where nothing keeps them when chapters move.

## Decision

- **Each level of heading from the second has a count** beside its numbering: *under the level above*, the default, where a heading of the level above begins it anew; or *through the document*, where nothing begins it anew and the level counts on from its first heading to its last. The first level has nothing above it to begin it anew, and offers no choice.
- **A level counted through the document stands by its own number**, without the numbers of the levels above it: chapter 4, not II.4. The levels under it, numbered as the level above or in a style of their own, are numbered under it and begin anew with each of its headings: 4.1, as before. The number of any heading begins at the nearest level, its own or one above it, that is counted through the document.
- **Every document follows.** The core counts so where it writes the numbers into the headings, for Word, Writer, the web page, the e-book and LaTeX, and where it numbers what is pointed to. Typst's heading counter begins every level anew under a heading above it, and a heading reads that counter where it stands, before anything its own show rule could put there, as do its entry in the contents and the references to it. So each level counted through has a counter of its own, stepped at each of its headings, and every heading of a level above puts that count back into the heading counter after itself, so that the next heading of the level, its entry and its references count on. Headings in arabic throughout but counted through are no longer "plain": Pandoc is not asked to number them, and the core writes the numbers.
- **Look**: a row *Count* under *Numbering* in each level from the second, shown where the headings are numbered and the level is; a level counted through says so among its words.

## Why not otherwise

- *A numbering pattern typed by hand*: as 0058 said.
- *Parts as something other than headings*: a part is a heading of the first level, as the tree has it; what differs is only the count of the level under it.
- *The part's number before a chapter counted through (II.4)*: a chapter counted through a book is named by that count alone, as books that count so name it; the part's number before it would say less, not more. Who wants II.4 has the count under the level above and the part in roman, as 0058 gave it.
- *An update of Typst's heading counter at the chapter itself*: tried first; a heading, its entry in the contents and the references to it all read the counter at the heading's own place, before its show rule, so the chapter after a part showed 1 while those after it counted on. An update that reads the counter to set it also settles one heading per pass and does not converge; the update is a function of the counter's value, and reads only the counter of the level, which is only ever stepped.

## Consequences

- `HeadingLevel.counted: Counted { Under, Through }`; `Headings::through`, `counted_through`, `count_heading`; `heading_number` takes the levels counted through; `plain_numbering` is false where any level is.
- `document/pandoc.rs`: both counts through `count_heading`; `Extras.through`. `formats/typst.rs`: the numbering function begins at the nearest level counted through; `through_rules` after the rules of the look.
- The Look pane: the row *Count*; `changes.ts` reads a level written before it as counted under. Translations in the nine complete languages; the guide says what the count does.
- Not done: the numbers in the list, the text view and the map, asked the same day; a record of its own if wanted.
