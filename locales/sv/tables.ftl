# Tables in the text: making them, their tools, and what can be said of them.
# See locales/README.md.

## A table and its size, as its panel and the reading of a file show them.

tables-table = Tabell
tables-size = { $rows ->
        [one] { $rows } rad
       *[other] { $rows } rader
    }, { $columns ->
        [one] { $columns } kolumn
       *[other] { $columns } kolumner
    }
# The size, where only the first rows of what was read are shown.
tables-size-shown = { tables-size }. De första { $shown } visas.

## The bar over a table, and the menu on its cells.

tables-row = Rad
tables-row-hint = En rad över eller under; ta bort raden
tables-row-above = En rad över
tables-row-below = En rad under
tables-row-remove = Ta bort raden
tables-column = Kolumn
tables-column-hint = En kolumn före eller efter; ta bort kolumnen
tables-column-before = En kolumn före
tables-column-after = En kolumn efter
tables-column-remove = Ta bort kolumnen
tables-join = Slå ihop cellerna
tables-join-hint = Slå ihop de markerade cellerna
tables-split = Dela cellen
tables-split-hint = Dela cellen i dem den slogs ihop av
tables-headings = Rubriker
tables-headings-hint = Om första raden och första kolumnen är rubriker
tables-first-row-headings = Första raden är rubriker
tables-first-column-headings = Första kolumnen är rubriker
tables-cell-stands = Det cellen innehåller står
tables-left = Till vänster
tables-left-hint = Det cellen innehåller står till vänster
tables-middle = I mitten
tables-middle-hint = Det cellen innehåller står i mitten
tables-right = Till höger
tables-right-hint = Det cellen innehåller står till höger
tables-table-hint = Om den är numrerad, hur bred den är; ta bort den
tables-numbered = Numrerad
tables-the-table = Tabellen…
tables-the-table-hint = Hur bred den är
tables-remove = Ta bort tabellen

## The panel of what can be said of a table as a whole.

tables-width = Bredd
tables-width-needed = Som den behöver
tables-width-half = Hälften
tables-width-three-quarters = Tre fjärdedelar
tables-width-whole = Hela
tables-width-of-text = Av textens bredd, i dokumentet.
tables-width-as-needed = Så bred som det den innehåller behöver.
tables-numbered-as = Numrerad, som ”Tabell 1”

## A table asked for by its size.

tables-ask = En tabell av vilken storlek
tables-ask-heading = En tabell
tables-ask-grid = Peka på tabellens storlek
tables-ask-by = { $rows } gånger { $columns }
tables-ask-rows = Rader
tables-ask-columns = Kolumner
tables-ask-put = Sätt in den

## A table from a file.

tables-from-file = En tabell från en fil
tables-sheet = Blad
# A sheet of a file that has no name of its own.
tables-sheet-number = Blad { $number }
tables-first-rows = De första raderna, som de kommer att bli
tables-caption = Vad som sägs om tabellen
tables-caption-placeholder = Dess tabelltext, som kan ändras i texten
tables-header-row = Första raden innehåller rubrikerna
tables-header-column = Första kolumnen innehåller rubrikerna
tables-numbers-right = Kolumner som innehåller tal sätts till höger.
tables-put = Sätt in den i texten
# The title of the window in which a file is chosen among the files of the computer.
tables-choose = En tabell
# What the files that can be chosen there are called.
tables-files = Tabeller
tables-unreadable = { $file } kunde inte läsas som en tabell
tables-cannot-stand = En tabell kan inte stå här
tables-drop-on-text = Släpp en tabell på den text den hör till

## Shown by the stylesheet, where the page has no element for the words.

tables-caption-empty = Vad som sägs om tabellen
