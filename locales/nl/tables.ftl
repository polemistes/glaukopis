# Tables in the text: making them, their tools, and what can be said of them.
# See locales/README.md.

## A table and its size, as its panel and the reading of a file show them.

tables-table = Tabel
tables-size = { $rows ->
        [one] { $rows } rij
       *[other] { $rows } rijen
    }, { $columns ->
        [one] { $columns } kolom
       *[other] { $columns } kolommen
    }
# The size, where only the first rows of what was read are shown.
tables-size-shown = { tables-size }. De eerste { $shown } worden getoond.

## The bar over a table, and the menu on its cells.

tables-row = Rij
tables-row-hint = Een rij erboven of eronder; de rij verwijderen
tables-row-above = Een rij erboven
tables-row-below = Een rij eronder
tables-row-remove = De rij verwijderen
tables-column = Kolom
tables-column-hint = Een kolom ervoor of erna; de kolom verwijderen
tables-column-before = Een kolom ervoor
tables-column-after = Een kolom erna
tables-column-remove = De kolom verwijderen
tables-join = De cellen samenvoegen
tables-join-hint = De geselecteerde cellen samenvoegen
tables-split = De cel splitsen
tables-split-hint = De cel splitsen in de cellen waaruit ze is samengevoegd
tables-headings = Koppen
tables-headings-hint = Of de eerste rij en de eerste kolom koppen zijn
tables-first-row-headings = De eerste rij bevat koppen
tables-first-column-headings = De eerste kolom bevat koppen
tables-cell-stands = Wat de cel bevat, staat
tables-left = Links
tables-left-hint = Wat de cel bevat, staat links
tables-middle = In het midden
tables-middle-hint = Wat de cel bevat, staat in het midden
tables-right = Rechts
tables-right-hint = Wat de cel bevat, staat rechts
tables-table-hint = Of ze genummerd is, hoe breed ze is; haar verwijderen
tables-numbered = Genummerd
tables-the-table = De tabel…
tables-the-table-hint = Hoe breed ze is
tables-remove = De tabel verwijderen

## The panel of what can be said of a table as a whole.

tables-width = Breedte
tables-width-needed = Zoveel als nodig
tables-width-half = De helft
tables-width-three-quarters = Driekwart
tables-width-whole = Volledig
tables-width-of-text = Van de breedte van de tekst, in het document.
tables-width-as-needed = Zo breed als de inhoud nodig heeft.
tables-numbered-as = Genummerd, als ‘Tabel 1’

## A table asked for by its size.

tables-ask = Een tabel van welke grootte
tables-ask-heading = Een tabel
tables-ask-grid = Wijs de grootte van de tabel aan
tables-ask-by = { $rows } bij { $columns }
tables-ask-rows = Rijen
tables-ask-columns = Kolommen
tables-ask-put = Invoegen

## A table from a file.

tables-from-file = Een tabel uit een bestand
tables-sheet = Werkblad
# A sheet of a file that has no name of its own.
tables-sheet-number = Werkblad { $number }
tables-first-rows = De eerste rijen, zoals ze worden
tables-caption = Wat over de tabel wordt gezegd
tables-caption-placeholder = Het bijschrift, dat in de tekst kan worden gewijzigd
tables-header-row = De eerste rij bevat de koppen
tables-header-column = De eerste kolom bevat de koppen
tables-numbers-right = Kolommen met getallen worden rechts uitgelijnd.
tables-put = In de tekst zetten
# The title of the window in which a file is chosen among the files of the computer.
tables-choose = Een tabel
# What the files that can be chosen there are called.
tables-files = Tabellen
tables-unreadable = { $file } kon niet als tabel worden gelezen
tables-cannot-stand = Hier kan geen tabel staan
tables-drop-on-text = Laat een tabel vallen op de tekst waar ze bij hoort

## Shown by the stylesheet, where the page has no element for the words.

tables-caption-empty = Wat over de tabel wordt gezegd
