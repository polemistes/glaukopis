# 0057 — The header and the footer are places, and anything may stand in them

Date: 2026-10-19. Status: accepted by the owner on 2026-10-19; to be built from `docs/plans/the-pages-and-what-holds-where.md`, stage 1. Amends 0028 (formats) in what a layout says of the margins of the page, and 0056 (the chips).

## Context

A layout said two things of the margins of its pages: *page numbers*, shown or not, at one of six positions, on the first page or not; and a *running head*, the title, the author or words of one's own at the top, aligned left, centre or right. The owner found the two counter-intuitive: the header of a page was set in two places, there was no footer but for the page number, and the running head was a special case where a writer thinks of a header. Word has the plainer idea: a header and a footer, each a place where the page number, the title, the author or anything else may stand, differing on left and right pages where a book wants it.

## Decision

- **A layout has a header and a footer.** Each is shown or not; each has three places, left, centre and right; each place holds a list of items, any number of them, in order. An item is the page number, the title, the author, the heading of the current chapter (the nearest heading of the first level before the page), the date, or words of one's own. Between two items of a place stands the separator of the header or footer, " · " unless changed. The size, the italics and the letters of the header and the footer are set with them; the type is the text's.
- **Different on left and right pages.** Switched on, a header or footer has a second set of three places for left (even) pages. A book puts the page number outside and the author on the left pages, the chapter on the right.
- **The first page, and the pages where something begins**, each have their switch on the header and on the footer: shown there or not. A page where something begins, an *opener*, is any page where a heading of a level set to begin a page begins, or a part that has a page of its own, the title page, a dedication; the core marks those pages as it writes them. A book leaves the running head off its openers, whatever its structure.
- **Where a level of heading begins** is a choice of three, in place of the switch "begins a new page": *in the text*, *on a new page*, *on a right-hand page*. The last puts a blank left page in where one is needed, with nothing in its header or footer, as books have it; the blank page is counted. Each level has the choice, so chapters and sections are each told on their own.
- **The page number has a style**, arabic, roman or letters, in either case, as the page says (`page.numbering`), and may begin counting anew where the element it is set on begins (`page.restart`, stage 3). A page without a page number is still counted: the footer is turned off for the element whose pages they are, and the numbers go on after it.
- **The default is what it was**: nothing in the header, the page number in the centre of the footer, on the first page too, arabic. A writer who never opens the header and the footer sees no change. The layouts that come with the application are written in the new shape; a layout of the writer's own in the old shape is read as before and saved in the new shape when it is next saved. Changes a document made to page numbers and running heads under the old names are passed over, and the log says so: they were few and days old.
- **The chips** on the pages say *Header* and *Footer*, and open Look at them.

## Why not otherwise

- *One item per place*: "Author · Title" on the left is common; a list is the honest shape, and costs one separator.
- *A separate "no running head on chapter openers" for books only*: it is a switch like "on the first page", and belongs with the header and the footer, for every kind of text.
- *An opener as a heading of the first level*: too narrow, since any level may be told to begin a page; what was told to begin a page is what begins one.

## Consequences

- `DocumentFormat.header`, `DocumentFormat.footer` (`Margin`), `Page.numbering`, `Page.restart`; `PageNumbers` and `RunningHead` go, read as old names. `HeadingLevel.begins` in place of `new_page`, read as the old name.
- The preamble of Typst, the reference documents of Word and Writer, and the preamble of LaTeX set the header and the footer from the items; the web page and the e-book have no pages and nothing to set. A right-hand start is a blank page in Typst, a section that begins on an odd page in Word, a command in LaTeX, and a plain new page in Writer, said in the report.
- Look's Page part gets *Header* and *Footer*, each beginning with whether it is shown; the pages' chips say so; the words in English and Bokmål; `scripts/modernise-formats.mjs` writes the layouts that ship in the new shape.
