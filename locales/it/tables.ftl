# Tables in the text: making them, their tools, and what can be said of them.
# See locales/README.md.

## A table and its size, as its panel and the reading of a file show them.

tables-table = Tabella
tables-size = { $rows ->
        [one] { $rows } riga
        [many] { $rows } righe
       *[other] { $rows } righe
    }, { $columns ->
        [one] { $columns } colonna
        [many] { $columns } colonne
       *[other] { $columns } colonne
    }
# The size, where only the first rows of what was read are shown.
tables-size-shown = { tables-size }. Sono mostrate le prime { $shown }.

## The bar over a table, and the menu on its cells.

tables-row = Riga
tables-row-hint = Una riga sopra o sotto; togli la riga
tables-row-above = Una riga sopra
tables-row-below = Una riga sotto
tables-row-remove = Togli la riga
tables-column = Colonna
tables-column-hint = Una colonna prima o dopo; togli la colonna
tables-column-before = Una colonna prima
tables-column-after = Una colonna dopo
tables-column-remove = Togli la colonna
tables-join = Unisci le celle
tables-join-hint = Unisci le celle selezionate
tables-split = Dividi la cella
tables-split-hint = Dividi la cella in quelle da cui è stata unita
tables-headings = Intestazioni
tables-headings-hint = Se la prima riga e la prima colonna sono intestazioni
tables-first-row-headings = La prima riga è di intestazioni
tables-first-column-headings = La prima colonna è di intestazioni
tables-cell-stands = Il contenuto della cella sta
tables-left = A sinistra
tables-left-hint = Il contenuto della cella sta a sinistra
tables-middle = In mezzo
tables-middle-hint = Il contenuto della cella sta in mezzo
tables-right = A destra
tables-right-hint = Il contenuto della cella sta a destra
tables-table-hint = Se è numerata, quanto è larga; toglila
tables-numbered = Numerata
tables-the-table = La tabella…
tables-the-table-hint = Quanto è larga
tables-remove = Togli la tabella

## The panel of what can be said of a table as a whole.

tables-width = Larghezza
tables-width-needed = Quanto le serve
tables-width-half = Metà
tables-width-three-quarters = Tre quarti
tables-width-whole = Intera
tables-width-of-text = Della larghezza del testo, nel documento.
tables-width-as-needed = Larga quanto serve a ciò che contiene.
tables-numbered-as = Numerata, come «Tabella 1»

## A table asked for by its size.

tables-ask = Una tabella di che dimensione
tables-ask-heading = Una tabella
tables-ask-grid = Indica la dimensione della tabella
tables-ask-by = { $rows } per { $columns }
tables-ask-rows = Righe
tables-ask-columns = Colonne
tables-ask-put = Inseriscila

## A table from a file.

tables-from-file = Una tabella da un file
tables-sheet = Foglio
# A sheet of a file that has no name of its own.
tables-sheet-number = Foglio { $number }
tables-first-rows = Le prime righe, come saranno
tables-caption = Ciò che si dice della tabella
tables-caption-placeholder = La sua didascalia, che si può cambiare nel testo
tables-header-row = La prima riga contiene le intestazioni
tables-header-column = La prima colonna contiene le intestazioni
tables-numbers-right = Le colonne che contengono numeri sono allineate a destra.
tables-put = Mettila nel testo
# The title of the window in which a file is chosen among the files of the computer.
tables-choose = Una tabella
# What the files that can be chosen there are called.
tables-files = Tabelle
tables-unreadable = { $file } non si è potuto leggere come tabella
tables-cannot-stand = Una tabella non può stare qui
tables-drop-on-text = Lascia cadere una tabella sul testo a cui appartiene

## Shown by the stylesheet, where the page has no element for the words.

tables-caption-empty = Ciò che si dice della tabella
