# 0059 — A document's changes hold for the element they are made on, wherever it is printed

Date: 2026-10-19. Status: accepted by the owner on 2026-10-19; to be built from `docs/plans/the-pages-and-what-holds-where.md`, stage 3. Amends 0042 (the changes of a document) and 0054 (Look and the chips).

## Context

A document's changes to its look are kept on an element and inherited down the tree (0042). But they take effect only when that element is printed as a document of its own: inside the book, the book's look holds on every page. The owner wants more say over where a setting applies: a part set in smaller type, an appendix in landscape, the front matter numbered in roman, a page without a page number that is still counted. All of it with no more to learn for a writer who leaves things as they are.

The unit of this is the element, not the page. A page is where the text happened to break today, and moves as the text is written; an element stays what it is. What is set on a chapter holds for the chapter's pages, however many they come to be. The cases the owner names are elements already: the title page and the parts the core makes, a part, a chapter, an appendix.

## Decision

- **An element's changes hold for its stretch of any document it stands in.** Chapter three set in smaller type is smaller inside the book too; an appendix set in landscape turns its pages; the front matter numbered in roman restarts the count where the body begins. Printed alone, the element is as before. Nothing changes for a writer who makes no change on an element: the document's look holds throughout.
- **Page settings begin a new page.** Where an element changes the page, its size, its margins, its columns, its header or footer, or its numbering, the element begins on a new page, since no program that lays out pages can change them in the middle of one. Look says so under such a row.
- **Setting it needs no new window.** Look's top gains a line, *These changes hold for*, with the whole document and, where the text or a pressed chip is in an element under it, that element; the line is there only where there is such an element. Pressing a chip on a line and choosing the element the line stands in sets the look of that element alone. The chooser of what you are writing and *What the document contains* stay the document's.
- **What each format can follow.** The preview and the PDF follow every change. LaTeX follows the page settings, the type and the paragraphs. Word and Writer follow the page settings, size, margins, orientation, columns, whether the header and the footer are shown, and the numbering's style and restart, through sections; they cannot set one chapter in another type, since their styles are the document's, and Look says so where such a change is made. The web page and the e-book have no pages, and follow nothing of this.

## Why not otherwise

- *Settings tied to pages*: they would come loose as the text grows; a writer would set page seven and find it on page eight.
- *A window for the scope*: Look is already the place of a document's changes and already works per element; a line saying which element is enough.

## Consequences

- The document the core receives gains `looks`: for each element under the one printed that has changes, a layout or line numbers of its own, the layout as that element uses it. The core, at that element's first section, sets the rules of that layout and, where the page differs, a new page; at the end of the element's stretch it sets the enclosing one's again.
- `LookRequest.element`; Look's `current` and the chips' element, from the places of the preview.
- The guide says where changes hold, and what each format follows.
