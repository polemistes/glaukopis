# Tabeller i teksten: å lage dem, verktøyene deres og det som kan sies om dem.
# Se locales/README.md.

## En tabell og størrelsen, slik panelet og lesingen av en fil viser dem.

tables-table = Tabell
tables-size = { $rows ->
        [one] { $rows } rad
       *[other] { $rows } rader
    }, { $columns ->
        [one] { $columns } kolonne
       *[other] { $columns } kolonner
    }
# Størrelsen, der bare de første radene av det som ble lest, vises.
tables-size-shown = { tables-size }. De første { $shown } vises.

## Linjen over en tabell, og menyen på cellene.

tables-row = Rad
tables-row-hint = En rad over eller under; fjern raden
tables-row-above = En rad over
tables-row-below = En rad under
tables-row-remove = Fjern raden
tables-column = Kolonne
tables-column-hint = En kolonne foran eller etter; fjern kolonnen
tables-column-before = En kolonne foran
tables-column-after = En kolonne etter
tables-column-remove = Fjern kolonnen
tables-join = Slå sammen cellene
tables-join-hint = Slå sammen cellene som er merket
tables-split = Del cellen
tables-split-hint = Del cellen i dem den ble slått sammen av
tables-headings = Overskrifter
tables-headings-hint = Om første rad og første kolonne er overskrifter
tables-first-row-headings = Første rad er overskrifter
tables-first-column-headings = Første kolonne er overskrifter
tables-cell-stands = Innholdet i cellen står
tables-left = Til venstre
tables-left-hint = Innholdet i cellen står til venstre
tables-middle = I midten
tables-middle-hint = Innholdet i cellen står i midten
tables-right = Til høyre
tables-right-hint = Innholdet i cellen står til høyre
tables-table-hint = Om den er nummerert, hvor bred den er; fjern den
tables-numbered = Nummerert
tables-the-table = Tabellen …
tables-the-table-hint = Hvor bred den er
tables-remove = Fjern tabellen

## Panelet med det som kan sies om en tabell som helhet.

tables-width = Bredde
tables-width-needed = Som den trenger
tables-width-half = Halv
tables-width-three-quarters = Tre firedeler
tables-width-whole = Hel
tables-width-of-text = Av tekstbredden i dokumentet.
tables-width-as-needed = Så bred som innholdet trenger.
tables-numbered-as = Nummerert, som «Tabell 1»

## En tabell bedt om etter størrelse.

tables-ask = Hvor stor tabellen skal være
tables-ask-heading = En tabell
tables-ask-grid = Pek på størrelsen på tabellen
tables-ask-by = { $rows } ganger { $columns }
tables-ask-rows = Rader
tables-ask-columns = Kolonner
tables-ask-put = Sett inn

## En tabell fra en fil.

tables-from-file = En tabell fra en fil
tables-sheet = Ark
# Et ark i en fil som ikke har eget navn.
tables-sheet-number = Ark { $number }
tables-first-rows = De første radene, slik de blir
tables-caption = Tabelltekst
tables-caption-placeholder = Tabellteksten, som kan endres i teksten
tables-header-row = Første rad inneholder overskriftene
tables-header-column = Første kolonne inneholder overskriftene
tables-numbers-right = Kolonner med tall settes til høyre.
tables-put = Sett den inn i teksten
# Tittelen på vinduet der en fil velges blant filene på datamaskinen.
tables-choose = En tabell
# Hva filene som kan velges der, kalles.
tables-files = Tabeller
tables-unreadable = { $file } kunne ikke leses som en tabell
tables-cannot-stand = En tabell kan ikke stå her
tables-drop-on-text = Slipp tabellen på teksten den hører til

## Vist av stilarket, der siden ikke har noe element for ordene.

tables-caption-empty = Tabelltekst
