# 0061 — The workbench of a reading: the pages, the two texts, and what each page gets

Date: 2026-10-20. Status: accepted by the owner on 2026-10-20 in outline; to be built from `docs/plans/the-workbench-of-a-reading.md`. Amends 0060 (a reading says how well it went), 0044 (the text a PDF has) and 0047 (the structure of a document read from a PDF).

## Context

The owner tried the trial of pages on books of their own, with the result in view, and found the dialog clumsily put together: messy, unintuitive, unhelpful. Looked at closely on 2026-10-20, with the code and the screenshots of the end-to-end scripts, this is what was wrong:

- **A page could not be tried unless Tesseract was already going to read.** Where every page has text and the text is kept, there was no trial, no strip of pages and no stretches. To find out whether reading anew was worth it, one had to choose to read anew first: the test stood behind the decision it was meant to inform.
- **The two texts never stood side by side.** The text the PDF has and the text Tesseract read were behind a toggle, and not even on the same page: the preview scrolled through every page, the trial showed one.
- **The page was chosen in three places that did not agree.** A number field, the strip, and the preview's own scroll. Choosing a page in the strip also switched, in silence, which stretch the language picker edited, so that the languages changed under one's hands.
- **A trial forgot the one before it.** Whether a setting helped could only be told by remembering the earlier number and text oneself.
- **The order was backwards.** The strip, which is the subject, stood under the Read button as the last thing in the dialog, and on a long book it was cut off by the footer. The shape, the headings and the page marks, which are about what is made from the text, crowded the column above the reading choices.
- **The picture was too small to judge against**, and the numbers of the blocks on it unreadable.
- **The layout held per stretch, the resolution and black and white per file**: a split nobody could guess.

It came of building in stages, each adding a widget to the same column. The owner asked for the text the PDF has beside the text Tesseract reads, page by page; for a way to see whether a change of setting helps or hurts; and for choosing which pages keep the PDF's text and which are read anew.

## Decision

### One workbench, wherever a PDF is read

The dialogs that read a PDF, into elements from a file or from the library, and a PDF of the library made searchable, share one workbench. It is a wide and tall window, not a prompt: as wide and as tall as the window allows, up to a limit. It has four parts, in this order:

- **The pages**, as the strip of small pictures, at the top. It is the way through the file. Each page carries a small mark saying what it gets, the PDF's own text or Tesseract, tinted where the PDF's text does not read as text; where the pages are read with different settings, a band over the pages shows where one stretch ends and the next begins; where the file has an outline, its parts stand as ticks under their pages. Click a page to see it. Shift-click selects a range, Ctrl-click adds or takes away a page, a click on a stretch's band selects its pages, a click on an outline's tick selects the part's pages. The arrow keys move through the pages; with Shift they extend the selection.
- **The page in view, in three panes**: the picture of the page, large enough to judge against, with zoom; the text the PDF has for that page, as it is or as translated; and what Tesseract read of it, with how sure it was. Where the PDF has no text at all, two panes. Each text pane has, in its header, a button that gives that text to the pages selected.
- **The reading settings**, in one column beside the panes, always visible, never behind a disclosure: the languages, the resolution, the layout, black and white, and **Try page *n***, which reads the page in view with them. A line over them says what they hold for: *all 559 pages*, *pages 39–120*, *page 280*.
- **The footer** holds Cancel and the one action: *Read 147 pages*, *Take the text*, or *Make it searchable*, saying what it will do.

The first line of the workbench says what will happen in a sentence: *412 pages take the text the PDF has; 147 are read with Tesseract.* The warning about scans of too few dots to the inch stands with it.

### Each page gets its text from one source

A page takes the text the PDF has, or is read by Tesseract. A page without text is read: it cannot take what is not there. At first every page is marked the same way, by the program's judgment of the whole file as today: read where half or more of the pages' text does not read as text and the resolution allows it; the PDF's text otherwise. Most people want all of one or all of the other, and a patchwork at the start would be a surprise.

Three actions act on the pages selected, or on every page where none is selected:

- **The PDF's text** for these pages. Not offered where none of them has text.
- **Read with Tesseract** for these pages.
- **Decide by the text's quality**: page by page, what the look at the file already judged. Text that reads as text is kept; text that is poor, and no text, is read.

Translation holds for the whole file, not per page: where a scheme applies, the PDF's text is taken as translated unless the switch in the header of its pane is turned off. In a PDF made searchable, that switch is what rewrites the fonts' tables, as before.

### Stretches are made by selecting, not managed

The settings hold for the pages selected, or for all pages. Setting something for a selection is what makes a stretch; the stretches are what falls out of the pages' settings, shown in the strip, never listed as chips, and there is no hidden "current stretch". A stretch carries all four settings: languages, resolution, layout, black and white. The split between the layout per stretch and the rest per file ends.

### Trials are kept, and the trial needs no decision first

A page can be tried whenever Tesseract is installed and the file can be drawn, whatever the pages are marked: the trial is how the marking is decided. A trial reads the page in view with the settings that hold for it. The trials of a page are kept while the dialog is open, at most six, each listed under Tesseract's pane with its settings in words and its confidence; the one shown is marked, one click shows another, and **Use these settings** gives a past trial's settings to the pages selected. That is how one sees whether a change helped or hurt, and goes back to the better one.

In the text Tesseract read, the words it was unsure of, under 70 out of 100, are underlined and counted (*14 of 312 words unsure*), and marked faintly on the picture. Tesseract already says so of every word; it shows where a reading is weak without reading it all. The blocks Tesseract found are still drawn over the picture, and can be hidden.

### What is made of the text is asked after the reading

The shape kept or plain paragraphs, a tree by the headings or by the pages, and the marks where pages begin have nothing to do with how a page is read; they are applied after every page is read, to the lines gathered. They move out of the reading and into the step after it, which already shows the title, the headings found and the styles found. There they are asked with evidence (*a tree by its 12 headings, or by its 559 pages*), and changing one's mind does not cost the reading again: the reading is kept, and the tree is assembled anew on each change. A PDF read into elements is always read with its shape; plain paragraphs is a choice of what is made.

### Pictures

A picture file brought in, one page without text of its own, gets the same workbench without the strip and without the pane of the PDF's text, and can be tried like a page. The text of a picture of the store keeps its small dialog.

## Why not otherwise

- *Chips for the stretches*: a second place that said what the picker held, which is what confused. The strip shows the stretches; the scope line says what the settings hold for.
- *A patchwork of sources at the start, by the program's judgment page by page*: right for the few who optimise, a surprise for the many who want all of one kind. Offered as an action, not done unasked.
- *Languages per text box*: feasible, by cutting each region from the page and reading it with its own languages, but nobody marks the boxes of 559 pages; what would scale is zones that hold for a stretch, a small layout editor. Several languages at once already cover most mixed pages, and the blocks drawn on the tried page show where they fail. Left for a later round, to be designed from what the trials show; the owner chose pages alone for now.
- *A word-by-word diff between two trials*: the unsure words and the kept trials give most of its worth at a fraction of the work.
- *The shape choices in a line beside the Read button*: cheaper, but asked blind, before anything is known about the book's headings.
- *More settings of Tesseract's*: measured in 0060, none helped.

## Consequences

- The look at a file says each page's verdict (none, poor, sound). A reading is asked with the pages Tesseract reads; a stretch carries the resolution and black and white as well; a page made searchable loses its old text only where it is read. A trial returns its words with their confidences and places. A reading into elements is kept under a token, and a command assembles the tree from it with the choices made after it. The contract is regenerated.
- `ReadStep`, `SearchableDialog`, `DocumentDialog` and `PdfMapDialog` are rebuilt around the workbench; `TryPane`, `Stretches`, `HowDisclosure`, `TextPart` and `TextPreview` go.
- The guide's sections on trying a page, stretches and the shape are rewritten; the end-to-end script of the reading is rewritten in its dialog parts.
- The words are written in English and Bokmål; the other languages lag, as usual.

## Addendum of 2026-10-20: as built

Built the same day from the plan, the core, the strip and the panes by three worktree agents at once, the rest in the main session; the end-to-end script of the reading passes 111 checks, and the workbench was tried by hand on two of the owner's books (a novel of 559 pages in Gothic type, and a scan of the Nasjonalbiblioteket of 271 pages with text on most of them). Where it departs from the plan:

- The text Tesseract read of a page tried keeps its lines, as the text the PDF has is shown beside it, so that the two are compared line by line; a word broken at a line's end stays at its end.
- Translation is a box over the pane of the PDF's text, *Translated by what the fonts say*, ticked at first where a scheme applies; the application has no switch.
- A picture brought in is tried at once when the workbench opens, since nothing of it is shown until it is read.
- The workbench stays while the pages are read: a reading stopped or failed comes back to it with its trials and marks, the failure said over it.
- Where a tree by the headings was asked for and none were found, the choice after the reading says *No headings found*, disabled, and shows the tree by its pages.
- In a PDF made searchable, a page read loses whatever unseen text it had, however little, not only text enough to count as text: an old poor reading too short to count is taken away too.
- A trial joins nothing, so it is read without a dictionary.
- The picture of a library file read as text (the dialog of a picture of the library) gets the workbench as well.
