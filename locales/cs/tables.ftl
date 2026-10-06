# Tables in the text: making them, their tools, and what can be said of them.
# See locales/README.md.

## A table and its size, as its panel and the reading of a file show them.

tables-table = Tabulka
tables-size = { $rows ->
        [one] { $rows } řádek
        [few] { $rows } řádky
       *[other] { $rows } řádků
    }, { $columns ->
        [one] { $columns } sloupec
        [few] { $columns } sloupce
       *[other] { $columns } sloupců
    }
# The size, where only the first rows of what was read are shown.
tables-size-shown = { tables-size }. Zobrazeno je prvních { $shown }.

## The bar over a table, and the menu on its cells.

tables-row = Řádek
tables-row-hint = Řádek nad nebo pod; odstranit řádek
tables-row-above = Řádek nad
tables-row-below = Řádek pod
tables-row-remove = Odstranit řádek
tables-column = Sloupec
tables-column-hint = Sloupec před nebo za; odstranit sloupec
tables-column-before = Sloupec před
tables-column-after = Sloupec za
tables-column-remove = Odstranit sloupec
tables-join = Sloučit buňky
tables-join-hint = Sloučit vybrané buňky
tables-split = Rozdělit buňku
tables-split-hint = Rozdělit buňku na ty, z nichž byla sloučena
tables-headings = Záhlaví
tables-headings-hint = Zda jsou první řádek a první sloupec záhlavím
tables-first-row-headings = První řádek je záhlaví
tables-first-column-headings = První sloupec je záhlaví
tables-cell-stands = Obsah buňky stojí
tables-left = Vlevo
tables-left-hint = Obsah buňky stojí vlevo
tables-middle = Uprostřed
tables-middle-hint = Obsah buňky stojí uprostřed
tables-right = Vpravo
tables-right-hint = Obsah buňky stojí vpravo
tables-table-hint = Zda je číslovaná, jak je široká; odstranit ji
tables-numbered = Číslovaná
tables-the-table = Tabulka…
tables-the-table-hint = Jak je široká
tables-remove = Odstranit tabulku

## The panel of what can be said of a table as a whole.

tables-width = Šířka
tables-width-needed = Jak potřebuje
tables-width-half = Polovina
tables-width-three-quarters = Tři čtvrtiny
tables-width-whole = Celá
tables-width-of-text = Ze šířky textu v dokumentu.
tables-width-as-needed = Tak široká, jak to vyžaduje její obsah.
tables-numbered-as = Číslovaná, jako „Tabulka 1“

## A table asked for by its size.

tables-ask = Tabulka jaké velikosti
tables-ask-heading = Tabulka
tables-ask-grid = Ukažte na velikost tabulky
tables-ask-by = { $rows } × { $columns }
tables-ask-rows = Řádky
tables-ask-columns = Sloupce
tables-ask-put = Vložit

## A table from a file.

tables-from-file = Tabulka ze souboru
tables-sheet = List
# A sheet of a file that has no name of its own.
tables-sheet-number = List { $number }
tables-first-rows = První řádky, jak budou vypadat
tables-caption = Co se o tabulce říká
tables-caption-placeholder = Její popisek, který lze změnit v textu
tables-header-row = První řádek obsahuje záhlaví
tables-header-column = První sloupec obsahuje záhlaví
tables-numbers-right = Sloupce s čísly se zarovnají vpravo.
tables-put = Vložit do textu
# The title of the window in which a file is chosen among the files of the computer.
tables-choose = Tabulka
# What the files that can be chosen there are called.
tables-files = Tabulky
tables-unreadable = { $file } nelze přečíst jako tabulku
tables-cannot-stand = Tabulka zde stát nemůže
tables-drop-on-text = Přetáhněte tabulku na text, k němuž patří

## Shown by the stylesheet, where the page has no element for the words.

tables-caption-empty = Co se o tabulce říká
