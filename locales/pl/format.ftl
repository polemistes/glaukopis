# Document formats: their kinds, and the editor of a format.

## The kinds of document format, as the formats are grouped by them.

format-kind-own = Własne
format-kind-general = Ogólne
format-kind-style-guide = Przewodniki stylu
format-kind-publisher = Wydawcy
format-kind-journal = Czasopisma
format-kind-fiction = Proza
format-kind-stage = Scena i ekran
format-kind-poetry = Poezja

## The format editor.

format-name = Nazwa formatu
# The name a format of one's own is first given, made from that of the format it is made from.
format-name-changed = { $name }, zmieniony
format-saved = „{ $name }” zapisano wśród twoich własnych formatów
format-save-failed = Nie udało się zapisać formatu.
format-delete-failed = Nie udało się usunąć formatu.
format-delete-title = Usunąć format „{ $name }”?
format-delete-message = Mapy, które go używają, będą zamiast niego używać ogólnego formatu maszynopisu.
format-delete-confirm = Usuń format

## The parts of a format, as they are chosen at the left.

## Words that stand in several parts.

format-size = Rozmiar
format-bold = Pogrubienie
format-italic = Kursywa
format-letters = Litery
format-alignment = Wyrównanie
format-line-spacing = Interlinia
format-as-the-text = Jak tekst
# Beside a size of 0, in the place of its unit.
format-as-the-text-zero = jak tekst
# Beside a number of 0, in the place of its unit.
format-not-said = nie podano
format-align-left = Do lewej
format-align-center = Wyśrodkowane
format-align-right = Do prawej
format-align-justified = Wyjustowane
format-align-ragged = Do lewej, z prawej nierówno
format-case-none = Jak napisano
format-case-upper = WERSALIKI
format-case-smallcaps = Kapitaliki
format-spacing-single = Pojedyncza
format-spacing-one-and-a-half = Półtorej
format-spacing-double = Podwójna
format-stands-left = Z lewej
format-stands-center = Pośrodku
format-stands-right = Z prawej

## The page.

format-page-custom = Inny rozmiar
format-page-width = Szerokość
format-page-height = Wysokość
format-margins = Marginesy
format-margin-top = Górny
format-margin-bottom = Dolny
format-margin-left = Lewy
format-margin-right = Prawy
format-lengths-hint = Długości pisze się z jednostką: 2.5cm, 1in, 25mm, 12pt.
format-line-numbers = Numeruj wiersze

## Type and spacing, and paragraphs.

format-typeface = Krój pisma
format-hyphenate = Dziel wyrazy na końcach wierszy
format-paragraphs = Akapity odróżnia
format-paragraphs-indent = Wcięcie pierwszego wiersza
format-paragraphs-spaced = Odstęp między nimi
format-indent = Wcięcie
format-indent-first = Także po nagłówku
format-space-between = Odstęp między akapitami
format-italics = Kursywa jest składana
format-italics-italic = Jako kursywa
format-italics-underline = Jako podkreślenie, jak w maszynopisach z maszyny do pisania

## Headings.

format-numbered = Numerowane
format-level = Poziom { $number }
# What a level of headings is, in short, beside its number: "14 pt, bold, centred".
format-level-size = { $size } pt
format-level-bold = pogrubiony
format-level-italic = kursywą
format-level-capitals = wersalikami
format-level-small-caps = kapitalikami
format-level-centred = wyśrodkowany
format-level-right = do prawej
format-level-run-in = wpuszczony w tekst
format-level-indent = Wcięty jak akapit
format-level-new-page-said = na nowej stronie
format-space-before = Odstęp przed
format-space-after = Odstęp po
format-level-add = Głębszy poziom
format-level-remove = Usuń najgłębszy

## The title and the abstract.

format-title-placement = Tytuł stoi
format-title-top = U góry pierwszej strony
format-title-own-page = Na osobnej stronie
format-title-authors = Autorzy
format-title-affiliations = Ich afiliacje
format-title-date = Data
format-title-abstract = Streszczenie i słowa kluczowe
format-title-abstract-label = Nagłówek streszczenia
format-title-keywords-label = Słowo przed słowami kluczowymi

## Quotations, notes and the bibliography.

format-quote-indent-left = Wcięcie z lewej
format-quote-indent-right = Wcięcie z prawej
format-quote-when = Kiedy cytat jest wyodrębniany
format-quote-from-words = Od tylu słów
format-quote-from-lines = Albo od tylu wierszy
format-notes-kind = Przypisy stoją
format-notes-footnotes = U dołu strony
format-notes-endnotes = Na końcu tekstu
format-notes-title = Nagłówek przypisów
format-bibliography-title = Nagłówek
format-bibliography-new-page = Zaczyna się na nowej stronie
format-bibliography-hanging-indent = Wysunięcie
format-bibliography-entry-spacing = Odstęp między pozycjami

## The kinds of paragraph and of words: how each differs from the kind it
## is based on. The rows are those of the dialog for a kind of one's own
## too; what is not said is as the base has it.

format-kind-based-on = na podstawie { $base }
format-as-the-base = Jak podstawa
# In an empty field for a size, in the place of its number.
format-as-the-base-blank = jak podstawa
format-yes = Tak
format-no = Nie
format-underline = Podkreślenie
format-equal-width = Litery o stałej szerokości
format-equal-width-hint = Jak składa się kod
format-indent-left = Wcięcie z lewej
format-indent-right = Wcięcie z prawej
format-first-line = Pierwszy wiersz
format-first-line-hint = O ile zaczyna się głębiej niż reszta
format-keep-with-next = Trzymany z następnym
format-keep-with-next-hint = Nie zostaje sam u dołu strony
format-new-page = Zaczyna nową stronę
format-break-text = Co stoi w przerywniku
format-break-text-hint = * * * gdzie nic nie podano; # dla maszynopisu
# What a look says, in short, on the line of its kind: "10 pt, italic, centred".
format-look-not-bold = bez pogrubienia
format-look-not-italic = bez kursywy
format-look-underlined = podkreślony
format-look-not-underlined = bez podkreślenia
format-look-as-written = jak napisano
format-look-left = do lewej
format-look-justified = wyjustowany
format-look-indent-left = { $length } wcięcia z lewej
format-look-indent-right = { $length } wcięcia z prawej
format-look-first-line = pierwszy wiersz { $length }
format-look-space-before = { $length } przed
format-look-space-after = { $length } po
format-look-line-spacing = interlinia { $spacing }
format-look-equal-width = litery o stałej szerokości
format-look-not-equal-width = litery o zmiennej szerokości
format-look-kept = trzymany z następnym
format-look-not-kept = nietrzymany z następnym
format-look-no-new-page = bez nowej strony
format-look-text = „{ $text }” w przerywniku

## Figures and tables, which are told alike. The kind is figure or table: where
## English has the same words for both, another language may not (the caption
## of a figure and of a table can have different names).

format-figures = Ryciny
format-tables = Tabele
format-captioned-called = { $kind ->
    [figure] Rycina nazywa się
   *[table] Tabela nazywa się
}
format-captioned-reference = Gdzie tekst na nią wskazuje
format-captioned-label-bold = Słowo i numer pogrubione
format-captioned-label-italic = Słowo i numer kursywą
format-captioned-between = { $kind ->
    [figure] Między numerem a podpisem
   *[table] Między numerem a podpisem
}
# What stands between the number and the caption; called is the word and number, "Figure 1".
format-between-stop = { $kind ->
    [figure] Kropka ({ $called }. Podpis)
   *[table] Kropka ({ $called }. Podpis)
}
format-between-colon = { $kind ->
    [figure] Dwukropek ({ $called }: Podpis)
   *[table] Dwukropek ({ $called }: Podpis)
}
format-between-line = { $kind ->
    [figure] Podpis w osobnym wierszu
   *[table] Podpis w osobnym wierszu
}
format-between-other = Inne…
format-captioned-separator = Co stoi między nimi
format-captioned-own-line = { $kind ->
    [figure] Potem podpis w osobnym wierszu
   *[table] Potem podpis w osobnym wierszu
}
format-caption = { $kind ->
    [figure] Podpis
   *[table] Podpis
}
format-caption-stands = { $kind ->
    [figure] Podpis stoi
   *[table] Podpis stoi
}
format-caption-below = { $kind ->
    [figure] Pod obrazem
   *[table] Pod tabelą
}
format-caption-above = { $kind ->
    [figure] Nad obrazem
   *[table] Nad tabelą
}
format-captioned-where = { $kind ->
    [figure] Gdzie stoją ryciny
   *[table] Gdzie stoją tabele
}
format-captioned-stand = { $kind ->
    [figure] Ryciny stoją
   *[table] Tabele stoją
}
format-captioned-wrap = Tekst je opływa
format-captioned-placement = W dokumencie
format-captioned-in-text = W tekście
format-captioned-at-end = Zebrane na końcu
format-captioned-end-title = { $kind ->
    [figure] Nagłówek nad rycinami
   *[table] Nagłówek nad tabelami
}
# What is left in the text where a figure or table gathered at the end belongs.
format-captioned-placeholder = Wiersz zostawiony w tekście
format-captioned-placeholder-missing = Musi zawierać {"{}"}, gdzie wchodzą słowo i numer
format-table-rules = Linie
format-table-rules-horizontal = Nad, pod i pod nagłówkami
format-table-rules-grid = Wokół każdej komórki
format-table-rules-none = Żadne
format-table-header-bold = Nagłówki pogrubione
format-equations = Równania
format-equations-stand = Równania stoją
format-equations-before = Przed numerem
format-equations-after = Po numerze

## Page numbers and the running head.

format-page-numbers = Numery stron
format-page-numbers-show = Strony są numerowane

## About the format: where its requirements are from.

format-description = Opis
format-source = Skąd pochodzą wymagania
# The date the source was read on.
format-source-read = Odczytano { $date }.
format-source-high = Wartości są te ze źródła.
format-source-medium = Źródło dało się odczytać tylko częściowo albo we wcześniejszym stanie: sprawdź, co jest dla ciebie ważne.
format-source-low = Niewiele dało się zweryfikować: traktuj wartości jako punkt wyjścia.
