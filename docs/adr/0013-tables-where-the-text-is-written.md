# 0013 — Tables where the text is written, and tables from files

Date: 2026-09-28. Status: accepted.

## Context

Tables were asked for, and that they can be brought in from CSV files, from
OpenDocument spreadsheets and from Excel. How a table is kept and how it is
set in the documents is decided in ADR 0011. This is about how it is
written, and how it is read from a file.

## Decision

- **A table is written in the text, cell by cell**, with
  `prosemirror-tables`, which knows what it is to select cells, to join and
  split them, and to keep a table whole when two write in it at once. A
  cell holds paragraphs, and so citations, notes and formulas. The width of
  a column cannot be dragged: a table is as wide as it needs, or a share of
  the width of the text, and the columns share that as what they hold needs,
  which is what the documents do as well.
- **The tools of a table are a bar over it**, while the cursor is in it,
  and a panel for what is said of the whole table, as a figure has. The same
  is in a menu on the cells.
- **Files are read by the core**, not by a program beside it: CSV and its
  kin by a reader of our own, which tells the separator and the encoding
  from the file; spreadsheets by `calamine` (MIT), which reads ODS, XLSX,
  XLSB and XLS without LibreOffice or Excel being there.
- **What is read is what the cells hold, as text.** A formula comes as what
  it gave, a date in the form of ISO 8601, a number without the form it
  was shown in. A table in a text is something to read, not to calculate
  with.
- **A table that was brought in is a copy.** It does not follow its file.
- **Before the table is put in, it is shown** as it was read, with the
  choice of sheet, of headings, and what is to be said of it.
- **A table has 2000 rows and 100 columns at most**, and a file 64 MB.

## Why not otherwise

- *Reading spreadsheets through Pandoc or LibreOffice*: Pandoc reads none
  of them but CSV, and LibreOffice is large, slow to start, and not always
  there.
- *Tables that follow their file*: the file may not be there on the machine
  of the one the project is shared with, and what the text says would
  change without anyone having written it.
- *Columns whose width is dragged*: widths in points hold for one page
  only, and the documents are made for many.

## Consequences

- How a cell was set to be shown is lost: a share shown as 25 % comes as
  0.25, money as the bare number.
- Empty rows and columns before the first cell that holds something are not
  brought in.
- A table of many rows is slow to write in; the limit is set where it still
  can be.
