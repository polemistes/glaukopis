# Tables in the text: making them, their tools, and what can be said of them.
# See locales/README.md.

## A table and its size, as its panel and the reading of a file show them.

tables-table = Tablica
tables-size = { $rows ->
        [one] { $rows } redak
        [few] { $rows } retka
       *[other] { $rows } redaka
    }, { $columns ->
        [one] { $columns } stupac
        [few] { $columns } stupca
       *[other] { $columns } stupaca
    }
# The size, where only the first rows of what was read are shown.
tables-size-shown = { tables-size }. Prikazano je prvih { $shown }.

## The bar over a table, and the menu on its cells.

tables-row = Redak
tables-row-hint = Redak iznad ili ispod; ukloni redak
tables-row-above = Redak iznad
tables-row-below = Redak ispod
tables-row-remove = Ukloni redak
tables-column = Stupac
tables-column-hint = Stupac ispred ili iza; ukloni stupac
tables-column-before = Stupac ispred
tables-column-after = Stupac iza
tables-column-remove = Ukloni stupac
tables-join = Spoji ćelije
tables-join-hint = Spoji odabrane ćelije
tables-split = Razdvoji ćeliju
tables-split-hint = Razdvoji ćeliju na one od kojih je spojena
tables-headings = Zaglavlja
tables-headings-hint = Jesu li prvi redak i prvi stupac zaglavlja
tables-first-row-headings = Prvi redak su zaglavlja
tables-first-column-headings = Prvi stupac su zaglavlja
tables-cell-stands = Sadržaj ćelije stoji
tables-left = Lijevo
tables-left-hint = Sadržaj ćelije stoji lijevo
tables-middle = U sredini
tables-middle-hint = Sadržaj ćelije stoji u sredini
tables-right = Desno
tables-right-hint = Sadržaj ćelije stoji desno
tables-table-hint = Je li numerirana, koliko je široka; ukloni je
tables-numbered = Numerirana
tables-the-table = Tablica…
tables-the-table-hint = Koliko je široka
tables-remove = Ukloni tablicu

## The panel of what can be said of a table as a whole.

tables-width = Širina
tables-width-needed = Koliko treba
tables-width-half = Polovica
tables-width-three-quarters = Tri četvrtine
tables-width-whole = Cijela
tables-width-of-text = Od širine teksta, u dokumentu.
tables-width-as-needed = Široka koliko njezin sadržaj traži.
tables-numbered-as = Numerirana, kao „Tablica 1”

## A table asked for by its size.

tables-ask = Tablica koje veličine
tables-ask-heading = Tablica
tables-ask-grid = Pokažite veličinu tablice
tables-ask-by = { $rows } × { $columns }
tables-ask-rows = Redci
tables-ask-columns = Stupci
tables-ask-put = Umetni

## A table from a file.

tables-from-file = Tablica iz datoteke
tables-sheet = List
# A sheet of a file that has no name of its own.
tables-sheet-number = List { $number }
tables-first-rows = Prvi redci, kakvi će biti
tables-caption = Što se o tablici kaže
tables-caption-placeholder = Njezin opis, koji se može promijeniti u tekstu
tables-header-row = Prvi redak sadrži zaglavlja
tables-header-column = Prvi stupac sadrži zaglavlja
tables-numbers-right = Stupci s brojevima poravnavaju se desno.
tables-put = Stavi u tekst
# The title of the window in which a file is chosen among the files of the computer.
tables-choose = Tablica
# What the files that can be chosen there are called.
tables-files = Tablice
tables-unreadable = { $file } nije bilo moguće pročitati kao tablicu
tables-cannot-stand = Tablica ovdje ne može stajati
tables-drop-on-text = Ispustite tablicu na tekst kojemu pripada

## Shown by the stylesheet, where the page has no element for the words.

tables-caption-empty = Što se o tablici kaže
