# 0056 — Everything the page carries has its chip, and a switch beside its look

Date: 2026-10-19. Status: accepted by the owner on 2026-10-19; to be built from `docs/plans/everything-on-the-page-has-its-chip.md`. Amends 0054 (the chips on the pages, and what the document contains) and 0042 (the parts of Look).

## Context

Since 0054 a chip names each line of the preview where the pointer rests, and opens Look at the look of that line. The owner chose a play, turned the title page off, and then wanted the title the layout prints at the top of every page gone too. The chip on that line said "Text" and opened Look at the type. The running head stands in the margin, and the margins were left unnamed on purpose: a block that runs over a page is bounded by the text area so that it does not swallow the running head, and a line nothing names falls through to "Text". The page number has the same fate. The owner found the title page's switch, but it took time: the chip on the title opens the look of the front page, while the switch that turns the title page off stands in another part of Look, *What the document contains*.

The owner's expectation, which this record takes as the rule: everything the template or the layout puts on a page that is not the text itself has a chip, and the chip leads to one place where the thing is both turned on or off and given its look. The title page did that nearly; the rest should do it fully.

## Decision

- **The margins are named.** The core, which knows the margins and the layout, names what stands above the text area as the running head where the layout shows one at the head, else as the page number, and what stands below it as the page number. Their chips read *Running head* and *Page number* and open Look under *Page*, at the rows of the running head and of the page numbers, where the first row of each turns it off. Lines inside the text area keep their names; a block that runs over a page is still bounded by the text area.
- **Look's rule: first whether, then how.** Each part of Look that sets something the page carries begins with whether it is shown, then how it looks. The running head and the page numbers already do. The front page does so now: its part begins with the switch of the title page, the same switch *What the document contains* has, then what the title page shows (the authors, their affiliations, the date, the abstract, the keywords' label), then how it is set. The chip on the title lands on all of it.
- **A chip for the page itself.** Where the pointer rests on a page but on no line, in a margin or in the room between blocks, a chip reads *Page* and opens Look under *Page*, at its size and margins. This is the one thing on a page that has no line to carry a chip.
- A request to Look can name a heading within a part by its id, so that a chip lands on the rows it means and not only on the part.

## Why not otherwise

- *Name the running head and the page number from what Typst set, by tags*: Typst's header and footer carry no tag the core could read; the margins and the layout say the same thing and are at hand.
- *Leave the switch of the title page where it is and send the chip there*: the writer who presses the title wants to shape it as often as to drop it; one place for both, as the running head has, is the rule.

## Consequences

- `Preview.spots` gains spots of the margins, `running-head` and `page-number`; `typeset::spots` takes what the layout puts at the head and the foot.
- `spots.ts` reads the two and the `page`; the words in English and Bokmål.
- The rows of Look can carry an `at`, drawn as `data-at` on a subheading; the subheadings of the page numbers and the running head have one.
- The switch of a part the core makes is shared by *What the document contains* and the front page (`src/lib/look/composition.svelte.ts`).
- The guide says that a chip names the running head and the page number, and the page itself, and that every part of Look begins with whether and goes on to how.
