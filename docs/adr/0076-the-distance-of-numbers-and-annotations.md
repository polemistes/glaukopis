# 0076 — The distance of the numbers and the annotations from the text

Date: 2026-10-31. Status: accepted by the owner on 2026-10-31 ("Yes, do it.", after "Should not the behaviour in such cases be up to the user as an option, and not something hard coded?"). To be built from `docs/plans/the-distance-of-numbers-and-annotations.md`. Amends 0067 (the annotations on the numbers' side stand outside the numbers: now at a length of the layout, the same on every line) and 0040 (the look of numbered lines in the layout gains two lengths).

## Context

- **How far the numbers and the annotations stand from the text is written into the code, in em.** In Typst (`formats/typst.rs`, the preamble `gk-at` and `gk-beside`), a number at the left stands in a box of 4 em, aligned right, whose edge is 0.6 em before the text's edge; a number at the right begins 0.8 em after the text's edge, in a box as wide as the margin less 1.6 em. In LaTeX (`passages.rs`, `beside`), `\llap{…}\hspace{0.9em}` and `\rlap{\hspace{1em}…}`. An annotation across from the numbers stands at the same distances. On the numbers' side it stands 3 em further out, past a number of five digits. In the text view (`app.css`), the numbers stand 0.4 em before the text at the left and 0.6 em after it at the right, an annotation 1 em after the text at the right or 2.2 em before it at the left, outside the bracket of a run, and on the numbers' side 6 em at the left or 4.6 em at the right. Word, Writer, the web page and the e-book put numbers and annotations at the head or the end of the line, and have no distance.
- **The 3 em is applied line by line in prose and always in verse.** For the lines of a verse, `gk-line` moves every annotation out where the annotations share the numbers' side, whether or not the line shows its number. For a paragraph of text in a numbered stretch, `beside` moves an annotation out only where that line shows a number (`k > 0`), and LaTeX the same (3.9 em against 0.9 em). Down a stretch of prose counted every fifth line, the annotations stand at two distances. This was found when the four failing checks of `e2e/look.mjs` were read: they expected the first line's 1 on the page, which the rule of 0067's addendum of 25 October no longer shows, and in reading them the per-line rule came to light. The owner asked whether such behaviour should not be the user's to choose.
- **What was said of a centimetre** in answering the owner was the verse's indent, which the preamble passes to `gk-at` to find the text's edge again, not the distance of the numbers; the distances are the em above.
- **Lengths of the layout are centimetres in Look** (0065): the indent of a first line, the space between paragraphs, the gap of the columns, each a row with a field and *cm*, kept in the layout as a `Length` and changed for one document in Look as every other value of the layout, with *Changed here* and the way back, and holding per element where the document says (0059).

## Decision

### Two lengths of the layout

- The look of numbered lines in the layout (`verse`) gains **two lengths**: how far the **numbers** stand from the text, and how far the **annotations** stand from the text. Each is measured from the edge of the text block, the edge the paragraphs share whatever their indent, to the near edge of what stands in the margin: a number's right edge at the left of the text, its left edge at the right; an annotation the same.
- **Look**, under *Line numbers*, after *Numbers on the* and *Annotations on the*: **Numbers from the text** and **Annotations from the text**, each a field in centimetres, as the other lengths of Look. A document changes them as it changes any value of its layout.
- **The defaults**, where a layout says nothing, and no layout that ships says anything: the numbers 0.25 cm from the text; the annotations as far as the numbers where they stand across from them, and 1.5 cm where they stand on the numbers' side, outside a column of numbers up to five digits. The field in Look shows the length in force, so that writing another is a change of the document, and *take the layout's again* takes it back. The defaults are those the pages had, to within a millimetre: the numbers move by a few tenths of a millimetre, annotations on the numbers' side by a millimetre.

### A column, on every line

- Both lengths hold on **every line** of a stretch, whether or not the line shows its number, in Typst, in LaTeX and in the text view. The rule that moved an annotation out only past a number that is shown goes, with the 3 em.
- A number at the left keeps its box of 4 em aligned right, so that the length is to the digits' edge whatever their count; an annotation at the right is boxed to what the margin leaves beyond its length, so that long words wrap as they do today; at the left it ends at its length.
- **The text view follows the lengths**, through two variables of its style set from the layout in force, so that what one sees while writing stands where the page puts it. The bracket of a run stands outside the numbers' column, as 0067 has it, and moves with the numbers' length. Where the layout would put an annotation at the left under the bracket, the text view moves it just outside the bracket, since the bracket is the view's and the page has none; everywhere else the view follows the length exactly.
- Word, Writer, the web page and the e-book are unchanged.

### What is not done

- No length per stretch: the numbers' side is the passage's, the distances are the page's, as the annotations' side is (0067).
- No width for the column of the numbers, and no separate length for each side of the page: one length for the numbers, one for the annotations, wherever they stand.
- No change to the layouts that ship: the defaults are the core's, in one place.
- No lengths in Word and Writer, which have no margin to measure.

## Choices made in writing this, which the owner has not been asked about

1. The option is two lengths, not a switch between a column and the jump: nobody wants the jump, and the lengths are what differs between editions.
2. The lengths are measured from the text's edge to the near edge of the number or the annotation, so that a change of the digits' count or of the words' length never moves the near edge.
3. One length for both sides of the page.
4. The annotations' default follows their placement: the numbers' length across from them, 1.5 cm on their side.
5. The defaults are 0.25 cm and 1.5 cm, the nearest round lengths to the em the pages had.
6. The text view keeps its bracket between the text and an annotation at the left, where the length would put the annotation under it.
7. The Look script's four checks are rewritten for the column, with a line that shows its number, as part of this work.

## Why not otherwise

- **Not a switch "outside the numbers / in their column where the line has none"**: the second is the defect, not a choice.
- **Not em**: every length of Look is centimetres since 0065, and the owner asked for centimetres there; a layout is measured, not set relative to its type.
- **Not per stretch**: a stretch says how it is numbered; where the margin's columns stand is the page's, as 0067 decided for the annotations' side.
- **Not written into the shipped layouts**: a default in one place is changed in one place; a layout that says a length says it.
- **Not a width of the numbers' column**: measured to the near edge, the width is nobody's concern.

## Consequences

- `formats/mod.rs`: `Verse` gains `numbers_gap` and `annotations_gap`, optional lengths, with the two defaults in one place; `formats/typst.rs`: `gk-at`, `gk-beside` and `gk-line` take the lengths and lose `out`; `passages.rs`, `beside`: the Typst and LaTeX branches write the lengths; the tests that pin the em change. `api/documents.ts`: the two fields; `LookPanel.svelte`: two length rows under *Line numbers*; words in `format.ftl`, English and Norwegian; `app.css` and the text view's root: the two variables in place of the em. The guide's *Look*, *Line numbers* and *Typesetting* change; `e2e/look.mjs` is rewritten where it checks the annotations, and grows checks of the lengths on the page and in the text view.

## Addendum, 2026-10-31: as built

Built on `main` from 619c5e23 to the commit of this addendum, by one builder: 1e9a4a06 (the core), 8a3ece3d (a fault found on the way, below), cccb9633 (Look, the text view, the scripts), and the guide with this addendum. Nothing is pushed.

**A fault found on the way, mended.** The rewritten Look script found that a stretch numbered through *Line numbering from here* showed no number on the page, at any step, while the text view showed them. The number a count begins from became a setting of the numbering on 25 October, and the editor, the paragraph's type and the core all carry it as `from`; but the reader of the stored text (`paragraphOf` in `project/model/text.ts`) took every setting of a paragraph's numbering except that one, and the writer of stored paragraphs from blocks (`paragraphElement` in `blocks.ts`) left it out. The core's counter begins nowhere without it and shows only numbers given by hand. Both now carry it, with a test that a beginning written and read again is kept, which fails without the mend. This, and not the line numbers' rule alone, is why the four Look checks failed; the record's account of them, a count from 1 every fifth showing 5 first, was true of the step and missed that nothing would have been shown at any step.

What departs from the plan, or was settled in the building:

- **The defaults read at the right as at the left.** At the right the pages had the numbers 0.8 em out and the annotations on the numbers' side 3.8 em; the one length of 0.25 cm and of 1.5 cm moves them in by about a millimetre there.
- **At the right, what is placed is boxed** to the margin less its length and 0.8 em, never narrower than 2 em, numbers and annotations alike (`gk-room` in the preamble), so that long words wrap as before. An annotation set further out than the margin is wide stands at the page's edge and past it, as the length asks.
- **A full stop at the end of an annotation hangs** past the edge of its box, as Typst lets punctuation hang, so that such an annotation stands about 80 % of a full stop nearer the text than its length says. It did so before; it is optical alignment, and is left.
- **The column is checked by hiding a number**, not with a second paragraph: the Muse line's annotation is measured on the page with its number shown, then with *Its number is shown: Never*, and stands where it stood. The core's test of a page checks two lines, one with its number and one without, against each other.
- **The page's lengths are checked in the core too**: a test sets a numbered passage of prose through Typst and reads off the page that the number stands 0.25 cm and the annotation 1.5 cm from the edge of the text, and that the two annotations stand in a column.
- **The defaults live in the core and in `document/line-gaps.ts`**, which Look and the text view read; the text view sets three variables of its style, the numbers' length and the annotations' across from the numbers and on their side, since a stretch may stand on another side than the layout's.
- **The text view keeps an annotation at the left outside the bracket** with a `max()` of the length and the bracket's room: 2.2 em across from the numbers, the numbers' length and 5.6 em on their side, as the em before. Where the length is larger, it holds exactly.
- The sentence of the guide on Word and Writer, where an annotation stands "beside the number, further out", is about the head of a line in Word and has no length; it is left as it was.

Counts: `pnpm check` without errors or warnings; `pnpm test` 1365; `cargo test --workspace` 986, none failing; `cargo clippy --workspace --all-targets` without warnings. The scripts: `look` 78 of 78, `line-numbers` 32 of 32, `verse` 26 of 26, `runs` 26 of 26, `brackets` 11 of 11, `kinds-of-passage` 23 of 23, `preview` 48 of 48, `languages` 17 of 17.
