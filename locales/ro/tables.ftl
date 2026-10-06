# Tables in the text: making them, their tools, and what can be said of them.
# See locales/README.md.

## A table and its size, as its panel and the reading of a file show them.

tables-table = Tabel
tables-size = { $rows ->
        [one] { $rows } rând
        [few] { $rows } rânduri
       *[other] { $rows } de rânduri
    }, { $columns ->
        [one] { $columns } coloană
        [few] { $columns } coloane
       *[other] { $columns } de coloane
    }
# The size, where only the first rows of what was read are shown.
tables-size-shown = { tables-size }. Se arată primele { $shown }.

## The bar over a table, and the menu on its cells.

tables-row = Rând
tables-row-hint = Un rând deasupra sau dedesubt; scoate rândul
tables-row-above = Un rând deasupra
tables-row-below = Un rând dedesubt
tables-row-remove = Scoate rândul
tables-column = Coloană
tables-column-hint = O coloană înainte sau după; scoate coloana
tables-column-before = O coloană înainte
tables-column-after = O coloană după
tables-column-remove = Scoate coloana
tables-join = Unește celulele
tables-join-hint = Unește celulele selectate
tables-split = Desparte celula
tables-split-hint = Desparte celula în cele din care a fost unită
tables-headings = Capete
tables-headings-hint = Dacă primul rând și prima coloană sunt capete
tables-first-row-headings = Primul rând este cap de tabel
tables-first-column-headings = Prima coloană este cap de tabel
tables-cell-stands = Ce cuprinde celula stă
tables-left = La stânga
tables-left-hint = Ce cuprinde celula stă la stânga
tables-middle = La mijloc
tables-middle-hint = Ce cuprinde celula stă la mijloc
tables-right = La dreapta
tables-right-hint = Ce cuprinde celula stă la dreapta
tables-table-hint = Dacă este numerotat, cât de lat este; scoate-l
tables-numbered = Numerotat
tables-the-table = Tabelul…
tables-the-table-hint = Cât de lat este
tables-remove = Scoate tabelul

## The panel of what can be said of a table as a whole.

tables-width = Lățime
tables-width-needed = Cât are nevoie
tables-width-half = Jumătate
tables-width-three-quarters = Trei sferturi
tables-width-whole = Întreagă
tables-width-of-text = Din lățimea textului, în document.
tables-width-as-needed = Atât de lat cât are nevoie ce cuprinde.
tables-numbered-as = Numerotat, ca „Tabelul 1”

## A table asked for by its size.

tables-ask = Un tabel de ce mărime
tables-ask-heading = Un tabel
tables-ask-grid = Arătați mărimea tabelului
tables-ask-by = { $rows } pe { $columns }
tables-ask-rows = Rânduri
tables-ask-columns = Coloane
tables-ask-put = Pune-l

## A table from a file.

tables-from-file = Un tabel dintr-un fișier
tables-sheet = Foaie
# A sheet of a file that has no name of its own.
tables-sheet-number = Foaia { $number }
tables-first-rows = Primele rânduri, așa cum vor fi
tables-caption = Ce se spune despre tabel
tables-caption-placeholder = Legenda lui, care se poate schimba în text
tables-header-row = Primul rând cuprinde capetele
tables-header-column = Prima coloană cuprinde capetele
tables-numbers-right = Coloanele care cuprind numere se așază la dreapta.
tables-put = Pune-l în text
# The title of the window in which a file is chosen among the files of the computer.
tables-choose = Un tabel
# What the files that can be chosen there are called.
tables-files = Tabele
tables-unreadable = { $file } nu s-a putut citi ca tabel
tables-cannot-stand = Un tabel nu poate sta aici
tables-drop-on-text = Trageți un tabel pe textul căruia îi aparține

## Shown by the stylesheet, where the page has no element for the words.

tables-caption-empty = Ce se spune despre tabel
