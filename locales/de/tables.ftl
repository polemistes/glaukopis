# Tables in the text: making them, their tools, and what can be said of them.
# See locales/README.md.

## A table and its size, as its panel and the reading of a file show them.

tables-table = Tabelle
tables-size = { $rows ->
        [one] { $rows } Zeile
       *[other] { $rows } Zeilen
    }, { $columns ->
        [one] { $columns } Spalte
       *[other] { $columns } Spalten
    }
# The size, where only the first rows of what was read are shown.
tables-size-shown = { tables-size }. Die ersten { $shown } werden gezeigt.

## The bar over a table, and the menu on its cells.

tables-row = Zeile
tables-row-hint = Eine Zeile darüber oder darunter; die Zeile entfernen
tables-row-above = Eine Zeile darüber
tables-row-below = Eine Zeile darunter
tables-row-remove = Zeile entfernen
tables-column = Spalte
tables-column-hint = Eine Spalte davor oder danach; die Spalte entfernen
tables-column-before = Eine Spalte davor
tables-column-after = Eine Spalte danach
tables-column-remove = Spalte entfernen
tables-join = Zellen verbinden
tables-join-hint = Die ausgewählten Zellen verbinden
tables-split = Zelle teilen
tables-split-hint = Die Zelle in die teilen, aus denen sie verbunden wurde
tables-headings = Überschriften
tables-headings-hint = Ob die erste Zeile und die erste Spalte Überschriften sind
tables-first-row-headings = Die erste Zeile enthält Überschriften
tables-first-column-headings = Die erste Spalte enthält Überschriften
tables-cell-stands = Der Inhalt der Zelle steht
tables-left = Links
tables-left-hint = Der Inhalt der Zelle steht links
tables-middle = In der Mitte
tables-middle-hint = Der Inhalt der Zelle steht in der Mitte
tables-right = Rechts
tables-right-hint = Der Inhalt der Zelle steht rechts
tables-table-hint = Ob sie nummeriert ist, wie breit sie ist; sie entfernen
tables-numbered = Nummeriert
tables-the-table = Die Tabelle…
tables-the-table-hint = Wie breit sie ist
tables-remove = Tabelle entfernen

## The panel of what can be said of a table as a whole.

tables-width = Breite
tables-width-needed = Wie sie braucht
tables-width-half = Die Hälfte
tables-width-three-quarters = Drei Viertel
tables-width-whole = Ganz
tables-width-of-text = Der Breite des Textes, im Dokument.
tables-width-as-needed = So breit, wie ihr Inhalt es braucht.
tables-numbered-as = Nummeriert, als „Tabelle 1“

## A table asked for by its size.

tables-ask = Eine Tabelle welcher Größe
tables-ask-heading = Eine Tabelle
tables-ask-grid = Zeigen Sie auf die Größe der Tabelle
tables-ask-by = { $rows } mal { $columns }
tables-ask-rows = Zeilen
tables-ask-columns = Spalten
tables-ask-put = Einfügen

## A table from a file.

tables-from-file = Eine Tabelle aus einer Datei
tables-sheet = Blatt
# A sheet of a file that has no name of its own.
tables-sheet-number = Blatt { $number }
tables-first-rows = Die ersten Zeilen, wie sie sein werden
tables-caption = Was zur Tabelle gesagt wird
tables-caption-placeholder = Ihre Beschriftung, die im Text geändert werden kann
tables-header-row = Die erste Zeile enthält die Überschriften
tables-header-column = Die erste Spalte enthält die Überschriften
tables-numbers-right = Spalten mit Zahlen werden rechtsbündig gesetzt.
tables-put = In den Text einfügen
# The title of the window in which a file is chosen among the files of the computer.
tables-choose = Eine Tabelle
# What the files that can be chosen there are called.
tables-files = Tabellen
tables-unreadable = { $file } konnte nicht als Tabelle gelesen werden
tables-cannot-stand = Hier kann keine Tabelle stehen
tables-drop-on-text = Lassen Sie eine Tabelle auf den Text fallen, zu dem sie gehört

## Shown by the stylesheet, where the page has no element for the words.

tables-caption-empty = Was zur Tabelle gesagt wird
