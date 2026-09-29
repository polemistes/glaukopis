# Tables in the text: making them, their tools, and what can be said of them.
# See locales/README.md.

## A table and its size, as its panel and the reading of a file show them.

tables-table = Table
tables-size = { $rows ->
        [one] { $rows } row
       *[other] { $rows } rows
    }, { $columns ->
        [one] { $columns } column
       *[other] { $columns } columns
    }
# The size, where only the first rows of what was read are shown.
tables-size-shown = { tables-size }. The first { $shown } are shown.

## The bar over a table, and the menu on its cells.

tables-row = Row
tables-row-hint = A row above or below; remove the row
tables-row-above = A row above
tables-row-below = A row below
tables-row-remove = Remove the row
tables-column = Column
tables-column-hint = A column before or after; remove the column
tables-column-before = A column before
tables-column-after = A column after
tables-column-remove = Remove the column
tables-join = Join the cells
tables-join-hint = Join the cells that are selected
tables-split = Split the cell
tables-split-hint = Split the cell into those it was joined of
tables-headings = Headings
tables-headings-hint = Whether the first row and the first column are headings
tables-first-row-headings = The first row is headings
tables-first-column-headings = The first column is headings
tables-cell-stands = What the cell holds stands
tables-left = To the left
tables-left-hint = What the cell holds stands to the left
tables-middle = In the middle
tables-middle-hint = What the cell holds stands in the middle
tables-right = To the right
tables-right-hint = What the cell holds stands to the right
tables-table-hint = Whether it is numbered, how wide it is; remove it
tables-numbered = Numbered
tables-the-table = The table…
tables-the-table-hint = How wide it is
tables-remove = Remove the table

## The panel of what can be said of a table as a whole.

tables-width = Width
tables-width-needed = As it needs
tables-width-half = Half
tables-width-three-quarters = Three quarters
tables-width-whole = Whole
tables-width-of-text = Of the width of the text, in the document.
tables-width-as-needed = As wide as what it holds needs it to be.
tables-numbered-as = Numbered, as “Table 1”

## A table asked for by its size.

tables-ask = A table of what size
tables-ask-heading = A table
tables-ask-grid = Point at the size of the table
tables-ask-by = { $rows } by { $columns }
tables-ask-rows = Rows
tables-ask-columns = Columns
tables-ask-put = Put it in

## A table from a file.

tables-from-file = A table from a file
tables-sheet = Sheet
# A sheet of a file that has no name of its own.
tables-sheet-number = Sheet { $number }
tables-first-rows = The first rows, as they will be
tables-caption = What is said of the table
tables-caption-placeholder = Its caption, which can be changed in the text
tables-header-row = The first row holds the headings
tables-header-column = The first column holds the headings
tables-numbers-right = Columns that hold numbers are set to the right.
tables-put = Put it into the text
# The title of the window in which a file is chosen among the files of the computer.
tables-choose = A table
# What the files that can be chosen there are called.
tables-files = Tables
tables-unreadable = { $file } could not be read as a table
tables-cannot-stand = A table cannot stand here
tables-drop-on-text = Drop a table on the text it belongs to

## Shown by the stylesheet, where the page has no element for the words.

tables-caption-empty = What is said of the table
