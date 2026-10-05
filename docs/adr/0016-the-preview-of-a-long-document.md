# 0016 — The preview of a long document

Date: 2026-09-28. Status: accepted.

## Context

With a document of more than a hundred thousand words the preview held up
everything else: the window stood still for many seconds when the preview
was opened, writing lagged while it was open, and the lag went on after it
was closed. Measured on a document of 186 000 words, which makes 614 pages:

- Making the pages took about five seconds (Pandoc two, Typst one, the
  rest the readying of the document). That is work beside the window, and
  is not what was felt.
- All 614 pages were then sent to the window as one message of 147
  megabytes, read there, and drawn, all of them: the window stood still for
  eighteen seconds.
- The document was read whole from the project and written whole as JSON,
  twice, a moment after every pause in the writing.
- With every key the words of the whole document were counted anew, from
  the text of every element.
- The pages were made anew while they were still being made, so that during
  steady writing several makings went on at once; and closing the preview
  stopped none of them.
- A key in the text had the whole window laid out and painted anew, the
  preview with its pages among the rest.

## Decision

- **Only the pages that are looked at are made into pictures, sent and
  drawn**: those in view and two before and after. Typst sets the whole
  document, which it must to know where the pages break, and writes the
  pages that are asked for; it says how many there are. Pages that come
  into view are asked for then. Pages out of view have no place in the
  window: empty room stands for them.
- **The text of an element is sent once.** It has a stamp, which changes
  when the text does; the side that makes the pages keeps the texts by
  their stamps, and is sent the stamp alone from then on. After a letter
  was written, the element it was written in is what is sent.
- **The text of an element is read once**, when the element is changed, and
  kept with its record. Documents are made of what was read; the words of
  notes are counted then as well.
- **The pages are never made twice at once.** What changes while they are
  made is seen to when they are there. The preview waits for a pause in the
  writing, and the longer the longer the making takes.
- **Closing the preview stops the making**, by ending Pandoc or Typst where
  they are.
- **The library is held only while what is cited is looked up**, not while
  the pages are made.
- **The text and the pages are regions of their own** (`contain: strict`):
  how large they are does not follow from what is in them, and what changes
  in them is laid out and painted there and nowhere else.
- **What is counted is shown a moment behind the writing.**

## Why not otherwise

- *Pages as pictures of dots rather than SVG*: quicker to paint, but blurred
  when the preview is made wider, and no smaller to make.
- *All pages written to disk, and read by the window as it needs them*: 147
  megabytes written for every letter.
- *The document set in parts, each kept until it changes*: citations,
  notes and numbers run through the whole document, and what a part reads
  depends on the parts before it.

## Consequences

- Of a long document the preview follows a few seconds behind the writing,
  the time Pandoc and Typst take for the whole of it. A page that is moved
  to is drawn after about a second.
- Measured after the change, on the same document: the first pages are
  shown after four and a half seconds, with the window standing still for
  0.16 s at the most; a key with the preview open takes 13 ms, as without
  it (before: 54 ms); closing takes a tenth of a second, and nothing goes
  on after it.
- `e2e/large.mjs` measures this, and fails where writing would be felt to
  lag.

## Note of 2026-10-05

Beside the drawing, a page is given its text: for each run of text that
Typst set, where it begins and the y of its baseline, how far it reaches,
the size of its type and its characters, in points from the top left corner
of the page as the SVG has them (`TextRun`, in `texts` of every `Page`,
whether it came with the preview or was asked for afterwards). So the text
of the pages can be selected and copied as the drawing is read, without
drawing the pages as text, and without the SVG being searched for its
glyphs. The pages given at once are at most `MOST_PAGES`, so the text given
with them is small beside the drawing.

With the preview come the places of the elements as well: for each section
that was made from an element, the page it begins on and the y in points
from the top of that page (`Place`, in `places` of `Preview`), in the order
of the text. These keep the text and the pages side by side. They are found
by a mark Pandoc writes before each such section, after the break of the
page before it where there is one: `#metadata("ID") <gk-el-ID>`, which
Typst sets nothing of, and which the document that was set is asked about
afterwards (`typeset::places`). The mark is written for Typst alone; the
other formats are given nothing of it.
