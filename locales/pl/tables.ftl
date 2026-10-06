# Tables in the text: making them, their tools, and what can be said of them.
# See locales/README.md.

## A table and its size, as its panel and the reading of a file show them.

tables-table = Tabela
tables-size = { $rows ->
        [one] { $rows } wiersz
        [few] { $rows } wiersze
        [many] { $rows } wierszy
       *[other] { $rows } wierszy
    }, { $columns ->
        [one] { $columns } kolumna
        [few] { $columns } kolumny
        [many] { $columns } kolumn
       *[other] { $columns } kolumn
    }
# The size, where only the first rows of what was read are shown.
tables-size-shown = { tables-size }. Pokazane są pierwsze { $shown }.

## The bar over a table, and the menu on its cells.

tables-row = Wiersz
tables-row-hint = Wiersz nad lub pod; usuń wiersz
tables-row-above = Wiersz nad
tables-row-below = Wiersz pod
tables-row-remove = Usuń wiersz
tables-column = Kolumna
tables-column-hint = Kolumna przed lub po; usuń kolumnę
tables-column-before = Kolumna przed
tables-column-after = Kolumna po
tables-column-remove = Usuń kolumnę
tables-join = Scal komórki
tables-join-hint = Scal zaznaczone komórki
tables-split = Podziel komórkę
tables-split-hint = Podziel komórkę na te, z których ją scalono
tables-headings = Nagłówki
tables-headings-hint = Czy pierwszy wiersz i pierwsza kolumna są nagłówkami
tables-first-row-headings = Pierwszy wiersz to nagłówki
tables-first-column-headings = Pierwsza kolumna to nagłówki
tables-cell-stands = Zawartość komórki stoi
tables-left = Z lewej
tables-left-hint = Zawartość komórki stoi z lewej
tables-middle = Pośrodku
tables-middle-hint = Zawartość komórki stoi pośrodku
tables-right = Z prawej
tables-right-hint = Zawartość komórki stoi z prawej
tables-table-hint = Czy jest numerowana, jak szeroka; usuń ją
tables-numbered = Numerowana
tables-the-table = Tabela…
tables-the-table-hint = Jak jest szeroka
tables-remove = Usuń tabelę

## The panel of what can be said of a table as a whole.

tables-width = Szerokość
tables-width-needed = Ile potrzebuje
tables-width-half = Połowa
tables-width-three-quarters = Trzy czwarte
tables-width-whole = Cała
tables-width-of-text = Szerokości tekstu w dokumencie.
tables-width-as-needed = Tak szeroka, jak potrzebuje jej zawartość.
tables-numbered-as = Numerowana, jako „Tabela 1”

## A table asked for by its size.

tables-ask = Tabela jakiej wielkości
tables-ask-heading = Tabela
tables-ask-grid = Wskaż wielkość tabeli
tables-ask-by = { $rows } na { $columns }
tables-ask-rows = Wiersze
tables-ask-columns = Kolumny
tables-ask-put = Wstaw

## A table from a file.

tables-from-file = Tabela z pliku
tables-sheet = Arkusz
# A sheet of a file that has no name of its own.
tables-sheet-number = Arkusz { $number }
tables-first-rows = Pierwsze wiersze, jak będą
tables-caption = Co się mówi o tabeli
tables-caption-placeholder = Jej podpis, który można zmienić w tekście
tables-header-row = Pierwszy wiersz zawiera nagłówki
tables-header-column = Pierwsza kolumna zawiera nagłówki
tables-numbers-right = Kolumny z liczbami są wyrównane do prawej.
tables-put = Wstaw do tekstu
# The title of the window in which a file is chosen among the files of the computer.
tables-choose = Tabela
# What the files that can be chosen there are called.
tables-files = Tabele
tables-unreadable = Nie udało się odczytać { $file } jako tabeli
tables-cannot-stand = Tabela nie może tu stać
tables-drop-on-text = Upuść tabelę na tekst, do którego należy

## Shown by the stylesheet, where the page has no element for the words.

tables-caption-empty = Co się mówi o tabeli
