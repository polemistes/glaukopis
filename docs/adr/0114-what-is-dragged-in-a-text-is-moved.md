# 0114 — What is dragged in a text is moved, and a sheet of rich text by its name

Date: 2026-11-19. Status: built on 2026-11-19; its choices not yet confirmed by the owner. From the owner's words of the same day (the last section of `docs/brief.md`): "It is now impossible to move the rich text box around", and "In both normal and rich text mode, it should be possible to drag selected text around". Builds on 0112 (the box of rich text).

## Context

- **Selected words could not be moved by dragging them.** Tried with a real pointer in the running application: the drag began, and where the words were dropped they stood, and still where they had stood. They were copied.
- **Why.** The editor takes what was dragged away by its selection when the drop comes. The web view of Linux lets the selection go as soon as the drag has begun: it puts the cursor where the button was pressed. So the editor found nothing selected, and took nothing away.
- **A sheet of rich text could not be moved at all** but by cutting what it holds. A figure or a table is dragged by itself; a sheet holds text, and a press in it is for its text.
- **If the sheet were dragged as a figure is**, a press in the room about its paragraphs would drag the whole sheet, and no selection could be begun there.

## Decision

1. **Selected words that are dragged are moved**: where they stood is kept from the beginning of the drag (`editor/dragged.ts`), through whatever is changed in the text meanwhile, by someone else in a shared project too; when they are dropped the selection is put back, and the editor does the rest as it always has. One step of undo takes the move back.
2. **With Ctrl held when they are dropped, a copy is put there**, as the editor has it (Alt on a Mac).
3. **Dropped on themselves, they stay where they are**, and nothing is changed.
4. **In every text that is written in**: the text of an element, a sheet of rich text, a name, a note at the foot, a note of the notebook, the field of the chat.
5. **A sheet of rich text is moved by the name in its head**, which is its grip: a sign of six dots stands before it (Lucide's), and the pointer is a hand over it. It is dragged whole, with all it holds and all that is set by hand in it.
6. **It is put before the block it is dropped on the first half of, and after the one it is dropped on the later half of**, where the line that shows the place stands; never within another sheet, nor in one of two texts side by side. Dropped on itself it stays. With Ctrl held a copy is put there. The cursor is then in the sheet.
7. **A press in the sheet itself drags nothing.** The sheet is not dragged as a figure is (the schema does not say it can be): the head begins the drag, and what is here puts it down.
8. **The sign of the grip is drawn where a text is only shown as well**, so that nothing moves when the text is pressed. It does nothing there until the text is written in.

## Choices made in building this, which the owner has not been asked about

1. **The name is the grip**, with the sign before it, and not the whole head: the tools, the fields and the menu are pressed as before.
2. **No words** on the grip: no tooltip.
3. **Between two editors of the window** (two sides open on two elements) dragged words are copied, as the editor has it, and not moved.
4. **The head is 16 points narrower for its tools**, by the sign; where it is narrow, one group more may be folded into *More tools* (0113).

## Not done

- **Windows.** The window takes files that are dropped on it (`dragDropEnabled` in `tauri.conf.json`), and on Windows the web view then begins no drag of its own. Whether words and sheets are dragged there has not been tried: there is no Windows here. The Mac's web view keeps its selection, and the editor moves the words by itself there.
- **A sheet in a text that is only shown** is not dragged before the text is pressed.

## Checked

- `src/lib/editor/dragged.test.ts`: the words kept and selected again before the drop; found again after the text was changed; kept nowhere when the press was beside the selection; left to the editor when they are copied; the sheet put before and after, beside another sheet and never within it, staying when it is dropped on itself or is all the text holds, put down twice when it is copied, and not dragged in a text that is not written in.
- `e2e/dragging.mjs`, in the running application with a real pointer (xdotool on the display the scripts make for themselves; the drag of the system is not begun by a pointer the driver only tells the page of): words moved in ordinary text and on a sheet, selected where they land; undo in one step; a copy with Ctrl; a press on the sheet moving nothing; the sheet dragged by its grip before a paragraph and after one, with the cursor in it; undo; dropped on itself. Looked at.
