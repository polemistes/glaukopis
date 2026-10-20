# Plan: the workbench on demand, a quieter workbench, and dialogs that move

Asked by the owner on 2026-10-20, after trying the workbench of a reading (the record `docs/adr/0061-the-workbench-of-a-reading.md`, its addendum, and `docs/plans/the-workbench-of-a-reading.md`). To be adjusted by the owner before it is built; an addendum to the record says what was built.

## What the owner asked

1. Trying pages is opened on demand. Most people want the facts about the PDF, the main choice for the whole PDF (the PDF's text, read with Tesseract, decide by quality), and the four reading settings (languages, resolution, layout, black and white).
2. The picture of the page is moved by dragging it, not by scroll bars at its edges.
3. In the pane of what Tesseract read, the text keeps its room however many trials have been made.
4. The verdict is short: *Page 40: Low confidence (73%)*, *Page 40: High confidence (95%)*.
5. The list of trials is sparse: at most two lines a row, no *Not what holds for the page now*, *Use these settings* moved up, *73%* rather than *73 of 100*.
6. The buttons *Use for …* in the two text panes go: they do what the buttons at the top do.
7. The top of the workbench is reorganised to take less height, so that the text panes have more.
8. Every dialog of the program can be moved.

## 1. The dialog of a reading, short at first

The dialog opens at its ordinary width (about 620 pixels), not tall, with:

- **What the file is**, in one or two lines: its pages, whether they are scans and at what resolution, how many have text of their own and whether it reads as text; the scheme found, where one is (*The Greek is stored as the glyph names of PorsonGreekSF*). The warning about scans that are too coarse stays here.
- **What the pages take**, for the whole PDF, as one choice of three: *The PDF's text*, *Read with Tesseract*, *Decide by the text's quality*. It is shown only where the PDF has text; a scan without text says *All 559 pages are read with Tesseract* instead. The first choice is the program's judgment of the whole file, as now. Under the choice, one line says what it comes to: *412 pages take the text the PDF has; 147 are read*.
- **Translated by what the fonts say**, where a scheme applies, ticked at first.
- **How Tesseract reads**: the languages, resolution, layout, and black and white, for all pages. These are shown even where nothing is to be read yet, but greyed, so that they are there when *Read with Tesseract* is chosen.
- **Look at the pages and try them…**, a button. It opens the workbench in the same dialog, which grows wide and tall. **Back to the summary** in the workbench closes it again. Nothing is lost either way: the marks, the stretches and the trials stay while the dialog is open.
- The footer as now: Cancel, and *Read 147 pages*, *Take the text* or *Make searchable*.

Where pages have been marked one by one in the workbench, or read in stretches, the summary says so: *Chosen page by page: 412 take the PDF's text, 147 are read*, and *Read in 3 different ways*. The choice of three then shows none selected, and the settings show those of the first page with *(read in different ways)*. Choosing one of the three, or changing a setting, in the summary applies it to every page again, as *All pages* does in the workbench; the line under it says so before the change.

A picture brought in has no pages to choose among: its summary is the settings and **Try it…**, which opens the workbench as it is now for a picture.

## 2. The workbench, quieter

- **The top in two rows of about 30 pixels, and the strip:** row one holds the sentence on the left and *Back to the summary* on the right. Row two holds *For page 40 · All pages* and the three buttons. The scheme line becomes a small info mark after the sentence, with the text as its tooltip. The title of the dialog and the file's name stand on one line in the workbench. The strip loses its framed box and its empty space: its height follows its thumbnails, and the bands of stretches take room only where there are stretches. Together this saves about 100 pixels of height for the panes.
- **The picture is moved by dragging:** at 100 % and 200 % the cursor is a hand, and dragging moves the page. The scroll bars are hidden. The wheel still scrolls up and down, and Shift with the wheel sideways. At *Fit* there is nothing to move.
- **The verdict of a trial in one line:** *Page 40: Low confidence (73%) · 89 of 251 words unsure*. Low is under 80, which is where a page counts as read poorly; Good is 80 to 89; High is 90 and over. The colour follows the words, gold for low. The longer advice (another language, the Fraktur model, another layout) moves to the tooltip of *Low*.
- **The trials take little room:** each row holds its settings, the confidence (*73%*) and *Use these settings* on its first line, the settings running onto a second line only where they are long. The row of the trial shown is marked; the note that a trial differs from what holds now goes. The list shows at most three rows and scrolls beyond them, so the text always has most of the pane.
- **No *Use for …* buttons in the panes.** The three buttons at the top do it.
- **Percent everywhere a confidence is shown:** the verdict, the trials, and the tooltips in the strip.

## 3. Every dialog moves

The shared dialog already moves by its title bar when asked to, and only one dialog asks. It becomes the default for all of them, about forty-seven, so no dialog needs changing one by one:

- The dialog is dragged by its title bar, outside its buttons. The cursor over the bar says so.
- It cannot be dragged so far that its title bar leaves the window: at least the bar stays in reach.
- A double-click on the title bar puts it back in the middle.
- It opens in the middle each time, as now, and does not remember where it was.
- Menus, tooltips and the docked panels at the side (comments, history, look and the others) are not dialogs and do not move. The small bar that says what the library is doing is not a dialog either.

The end-to-end script of the settings, or a short one of its own, drags a dialog and checks that it moves and comes back on a double-click.

## How it is built

Small enough for the main session alone, in this order, each step committed when its checks pass:

1. **Dialogs move.** The shared dialog's dragging becomes the default; the clamping and the double-click are added; one end-to-end check.
2. **The summary.** A new `ReadSummary.svelte` holds the facts, the choice of three, the translation box, the settings and the button. `Workbench.svelte` gains a state, `summary` or `pages`, and keeps all its state across the two, so that nothing is lost on the way. The reading step and the searchable dialog size the dialog by that state.
3. **The quieter workbench.** The top rows, the strip without its box, the picture moved by dragging, the verdict line, the trials list, and the pane buttons removed.
4. **Words, guide and tests.** The new words go into English and Bokmål, and the words no longer used are removed from every language. The guide's passages on the reading window and on dialogs are changed. The end-to-end script of the reading opens the workbench on demand where it tries pages, and checks the summary's choice for the whole PDF. The run on the owner's two books is repeated, and the screenshots are looked at in light and dark.

## Open for the owner

- Whether *Good* is the right word for 80 to 89, or another word, or no word at all for the middle (only Low and High).
- Whether the summary should show the four settings even where nothing is to be read (greyed, as planned), or hide them until something is.
- Whether a dialog should remember where it was moved to, for the rest of the session, rather than open in the middle each time.
