# Tables in the text: making them, their tools, and what can be said of them.
# See locales/README.md.

## A table and its size, as its panel and the reading of a file show them.

tables-table = Tabell
tables-size = { $rows ->
        [one] { $rows } rad
       *[other] { $rows } rader
    }, { $columns ->
        [one] { $columns } kolonne
       *[other] { $columns } kolonnar
    }
# The size, where only the first rows of what was read are shown.
tables-size-shown = { tables-size }. Dei første { $shown } blir viste.

## The bar over a table, and the menu on its cells.

tables-row = Rad
tables-row-hint = Ei rad over eller under; fjern rada
tables-row-above = Ei rad over
tables-row-below = Ei rad under
tables-row-remove = Fjern rada
tables-column = Kolonne
tables-column-hint = Ein kolonne framfor eller etter; fjern kolonnen
tables-column-before = Ein kolonne framfor
tables-column-after = Ein kolonne etter
tables-column-remove = Fjern kolonnen
tables-join = Slå saman cellene
tables-join-hint = Slå saman cellene som er merkte
tables-split = Del cella
tables-split-hint = Del cella i dei den vart slegen saman av
tables-headings = Overskrifter
tables-headings-hint = Om første rad og første kolonne er overskrifter
tables-first-row-headings = Første rad er overskrifter
tables-first-column-headings = Første kolonne er overskrifter
tables-cell-stands = Innhaldet i cella står
tables-left = Til venstre
tables-left-hint = Innhaldet i cella står til venstre
tables-middle = I midten
tables-middle-hint = Innhaldet i cella står i midten
tables-right = Til høgre
tables-right-hint = Innhaldet i cella står til høgre
tables-table-hint = Om den er nummerert, kor brei den er; fjern den
tables-numbered = Nummerert
tables-the-table = Tabellen …
tables-the-table-hint = Kor brei den er
tables-remove = Fjern tabellen

## The panel of what can be said of a table as a whole.

tables-width = Breidd
tables-width-needed = Som den treng
tables-width-half = Halv
tables-width-three-quarters = Tre firedelar
tables-width-whole = Heil
tables-width-of-text = Av tekstbreidda i dokumentet.
tables-width-as-needed = Så brei som innhaldet treng.
tables-numbered-as = Nummerert, som «Tabell 1»

## A table asked for by its size.

tables-ask = Kor stor tabellen skal vere
tables-ask-heading = Ein tabell
tables-ask-grid = Peik på storleiken på tabellen
tables-ask-by = { $rows } gonger { $columns }
tables-ask-rows = Rader
tables-ask-columns = Kolonnar
tables-ask-put = Set inn

## A table from a file.

tables-from-file = Ein tabell frå ei fil
tables-sheet = Ark
# A sheet of a file that has no name of its own.
tables-sheet-number = Ark { $number }
tables-first-rows = Dei første radene, slik dei blir
tables-caption = Tabelltekst
tables-caption-placeholder = Tabellteksten, som kan endrast i teksten
tables-header-row = Første rad inneheld overskriftene
tables-header-column = Første kolonne inneheld overskriftene
tables-numbers-right = Kolonnar med tal blir sette til høgre.
tables-put = Set den inn i teksten
# The title of the window in which a file is chosen among the files of the computer.
tables-choose = Ein tabell
# What the files that can be chosen there are called.
tables-files = Tabellar
tables-unreadable = { $file } kunne ikkje lesast som ein tabell
tables-cannot-stand = Ein tabell kan ikkje stå her
tables-drop-on-text = Slepp tabellen på teksten den høyrer til

## Shown by the stylesheet, where the page has no element for the words.

tables-caption-empty = Tabelltekst
