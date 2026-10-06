# Tables in the text: making them, their tools, and what can be said of them.
# See locales/README.md.

## A table and its size, as its panel and the reading of a file show them.

tables-table = Tabel
tables-size = { $rows ->
        [one] { $rows } række
       *[other] { $rows } rækker
    }, { $columns ->
        [one] { $columns } kolonne
       *[other] { $columns } kolonner
    }
# The size, where only the first rows of what was read are shown.
tables-size-shown = { tables-size }. De første { $shown } vises.

## The bar over a table, and the menu on its cells.

tables-row = Række
tables-row-hint = En række over eller under; fjern rækken
tables-row-above = En række over
tables-row-below = En række under
tables-row-remove = Fjern rækken
tables-column = Kolonne
tables-column-hint = En kolonne før eller efter; fjern kolonnen
tables-column-before = En kolonne før
tables-column-after = En kolonne efter
tables-column-remove = Fjern kolonnen
tables-join = Flet cellerne
tables-join-hint = Flet de markerede celler
tables-split = Opdel cellen
tables-split-hint = Opdel cellen i dem, den blev flettet af
tables-headings = Overskrifter
tables-headings-hint = Om første række og første kolonne er overskrifter
tables-first-row-headings = Første række er overskrifter
tables-first-column-headings = Første kolonne er overskrifter
tables-cell-stands = Cellens indhold står
tables-left = Til venstre
tables-left-hint = Cellens indhold står til venstre
tables-middle = I midten
tables-middle-hint = Cellens indhold står i midten
tables-right = Til højre
tables-right-hint = Cellens indhold står til højre
tables-table-hint = Om den er nummereret, hvor bred den er; fjern den
tables-numbered = Nummereret
tables-the-table = Tabellen…
tables-the-table-hint = Hvor bred den er
tables-remove = Fjern tabellen

## The panel of what can be said of a table as a whole.

tables-width = Bredde
tables-width-needed = Som den behøver
tables-width-half = Halv
tables-width-three-quarters = Tre fjerdedele
tables-width-whole = Hel
tables-width-of-text = Af tekstens bredde i dokumentet.
tables-width-as-needed = Så bred, som dens indhold behøver.
tables-numbered-as = Nummereret, som »Tabel 1«

## A table asked for by its size.

tables-ask = En tabel af hvilken størrelse
tables-ask-heading = En tabel
tables-ask-grid = Peg på tabellens størrelse
tables-ask-by = { $rows } gange { $columns }
tables-ask-rows = Rækker
tables-ask-columns = Kolonner
tables-ask-put = Indsæt

## A table from a file.

tables-from-file = En tabel fra en fil
tables-sheet = Ark
# A sheet of a file that has no name of its own.
tables-sheet-number = Ark { $number }
tables-first-rows = De første rækker, som de bliver
tables-caption = Tabeltekst
tables-caption-placeholder = Dens tabeltekst, som kan ændres i teksten
tables-header-row = Første række indeholder overskrifterne
tables-header-column = Første kolonne indeholder overskrifterne
tables-numbers-right = Kolonner med tal sættes til højre.
tables-put = Sæt den ind i teksten
# The title of the window in which a file is chosen among the files of the computer.
tables-choose = En tabel
# What the files that can be chosen there are called.
tables-files = Tabeller
tables-unreadable = { $file } kunne ikke læses som en tabel
tables-cannot-stand = En tabel kan ikke stå her
tables-drop-on-text = Slip en tabel på den tekst, den hører til

## Shown by the stylesheet, where the page has no element for the words.

tables-caption-empty = Tabeltekst
