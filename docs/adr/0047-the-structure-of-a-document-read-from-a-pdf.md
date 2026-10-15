# 0047 — The structure of a document read from a PDF: its title, its headings as the tree, its pages as marks

Date: 2026-10-15. Status: accepted by the owner on 2026-10-15; to be built from `docs/plans/the-structure-of-a-document.md`. Amends 0045 (the shape of a page) and 0018 (text read from PDFs).

## Context

With the shape of the pages kept (0045), a PDF read into a project still becomes one element for each page, named by its number, and the headings found become elements under their pages. The pages were kept as elements so that what is quoted can be found on its page. The owner asked whether the document's own structure could be made instead: its title as the title, and its headings, of their several levels, in their places in the tree of the map. The owner also asked that the action be called an import of the text as a map, which is what it is.

A page is a property of the print, not of the text. A map is the structure of a text. What the shape already finds, the headings and their levels over the whole file, is most of what the structure needs; the rest is to carry the text across the pages' edges, to find the title, and to keep where the pages began without making them elements.

## Decision

### The tree is the document's, not the print's

With the shape of the pages kept, the document is imported **by its headings**: a heading of level 1 becomes an element under the document's element, a heading of level 2 an element under the nearest heading of level 1 before it, and so on, three levels; each holds what follows it up to the next heading of its own level or above. What stands before the first heading is the document element's own text. The pages are not elements.

### The title

The first heading of the file whose size is larger than every other heading's, where no other heading has that size, is the document's title: it names the document's element, before the PDF's own description of itself and the name of the file, which serve where no title is found. The writer changes the name in the dialog as now. The lines that follow the title on its page before the first heading, the author, the date, the imprint, stay as the document element's own text: no field is filled from them, since what they say is not known.

### The levels, from the surest source

- Where the PDF carries an outline of its own (the bookmarks a program writes for its headings), the headings in it, matched to the lines of their pages by their words, take their levels from it. A PDF made from a written document mostly has one; a scan never does.
- A heading that begins with a number of the form 1, 1.2 or 1.2.3 has the depth of its number, where two or more headings are numbered so.
- The others take their levels from their sizes over the file, as 0045 gives them.

### The text goes on across the pages

- A paragraph of the body that goes on over a page's end is one paragraph: where the first paragraph of the next page begins with a small letter, or continues a word broken at the edge, or the paragraph before ends without a sentence's end and the next is not set in. The smaller text at the page's foot, a style found that stood between the two halves, goes after the paragraph it was found within.
- Lines kept as lines of one style on both sides of a page's edge are one block.
- A heading at the foot of a page holds what follows on the next.

### The pages as marks

Where each page begins, a reference mark with the page's label as the file prints it (*xiv*, *23*) stands in the text, so that what is quoted can still be found on its page. It is a reference mark as 0039 has them, set raised or in the margin as the format says, and taken away like any mark. **Mark where each page begins** is chosen in the dialog, on at first.

### By its pages, where that is wanted

Beside **by its headings** stands **by its pages**: an element for each page as before, with the headings under them. It is chosen at first where no heading is found in the whole file, and may be chosen for any file: an edition is cited by its pages, and a text with few headings is easier to find one's way in by them.

### The structure is shown before it is made

Where the shape is kept, the dialog shows the outline the import will make, the title and the headings as they will nest, before anything is brought in. The writer sees the structure, and may choose the pages instead or change the title.

### The words

The action is *Import the text as a map…*, in the pane of a file, beside a reference, and as the title of its dialog; its button *Import*.

### What is not done

- No author, date or publisher is read from the title page into the document's fields: they stay as its text, for the writer to make what they are.
- No heading is found by its words (*Chapter 3*, *Part II*): a word belongs to a language and a kind of text; a size, a number and an outline belong to any.
- A table of contents printed in the file is not read for the structure.
- Footnotes are not tied to their marks in the text.

## Later

- A printed table of contents as a source of the structure, where the file has no outline.
- The same outline shown for documents brought in by Pandoc, whose headings are structure already.

## Consequences

- `shape` names the title and reads numbered headings; `layer` reads the file's outline; `shaped` gains the building of the structure across the pages and the page marks; `Asked` gains the way (headings or pages) and the marks.
- `Imported` carries what stands before the first heading at level 0, as documents brought in by Pandoc do already.
- The dialogs show the outline and the two choices; the OCR end-to-end script's checks of the shape change from pages to the structure, and a born-digital fixture with an outline is added.
- The guide's part on text in scans and pictures says how a PDF becomes a map.

## Why not otherwise

- *Pages as elements, with the headings under them (today)*: the map then shows the print's structure, and a chapter that runs over twenty pages is twenty elements with its headings scattered among them.
- *The structure from the outline alone*: scans have none, and many born-digital files have none or a wrong one; the sizes serve all files, the outline the files that have it.
- *Marks of the pages always, without a choice*: a novel's reader wants no page marks in the text, and three hundred marks are not taken away by hand.
- *The structure assigned a meaning*: none is; a heading is a heading by its look, its number, or the file's own outline, never by what it says, as 0045 holds.
