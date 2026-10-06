# Figures, formulas and equations in the text, and the cross-references to
# them. See locales/README.md.

## A figure, and the panel of what can be said of it.

figures-figure = Rycina
figures-width = Szerokość
figures-width-third = Jedna trzecia
figures-width-half = Połowa
figures-width-three-quarters = Trzy czwarte
figures-width-whole = Cała
figures-width-of-row = Miejsca, jakie ma w rzędzie.
figures-width-of-text = Szerokości tekstu w dokumencie.
figures-shows = Przedstawia
figures-shows-placeholder = Słowami, dla tych, którzy nie mogą jej zobaczyć
figures-numbered = Numerowana, jako „Rycina 1”
figures-keep-caption = Zachowaj podpis przy obrazie
figures-keep-caption-hint = Ryciny zrobione z tego obrazu zaczynają się wtedy od tego, co tu napisano
figures-take-caption = Użyj własnego podpisu obrazu
figures-take-caption-hint = To, co zachowano przy obrazie, staje tu w miejsce tego, co jest teraz
figures-another-picture = Inny obraz…
figures-remove = Usuń rycinę
figures-caption-kept = Zachowane przy obrazie
figures-caption-kept-detail = Ryciny z niego zrobione zaczynają się od tych słów.
# The title of the window in which a picture is chosen among the files of the computer.
figures-choose-picture = Obraz
# What the files that can be chosen there are called.
figures-picture-files = Obrazy

## The store of pictures, as the text reads it.

figures-pictures-unread = Nie udało się odczytać obrazów
figures-picture-not-taken = Nie udało się dodać obrazu
figures-picture-not-kept = Nie udało się zachować tego, co powiedziano o obrazie
figures-picture-not-removed = Nie udało się usunąć obrazu

## Where a figure, a table or an equation stands.

figures-stands = Stoi
figures-stands-in-row = obok innych, w rzędzie
figures-stands-alone = Znów osobno
# Said of the choices of where it stands; the kind is figure, table or equation.
figures-stands-where = Gdzie stoi { $kind ->
        [figure] rycina
        [table] tabela
       *[equation] równanie
    }
figures-side-format = Jak format
figures-side-left = Z lewej
figures-side-middle = Pośrodku
figures-side-right = Z prawej
# What the format of the document says of where things of a kind stand. The
# flow is none for equations, and for what stands in the middle.
figures-usual = Format stawia { $kind ->
        [figure] ryciny
        [table] tabele
       *[equation] równania
    } { $side ->
        [left] z lewej
        [right] z prawej
       *[center] pośrodku
    }{ $flow ->
        [around] , a tekst je opływa
        [apart] , osobno od tekstu
       *[none] {""}
    }.
figures-text = Tekst
figures-flows-where = Czy tekst opływa { $kind ->
        [figure] rycinę
        [table] tabelę
       *[equation] równanie
    }
figures-flow-format = Jak format
figures-flow-around = Opływa
figures-flow-apart = Stoi osobno
figures-flow-at-side = Tekst opływa to, co stoi z boku.
figures-beside = Postaw obok poprzedniego

## A formula in the line, and an equation on a line of its own.

figures-formula = Wzór
figures-equation = Równanie
figures-equation-numbered = Numerowane
figures-formula-field = Wzór w zapisie TeX
figures-formula-empty = To, co napiszesz, pokaże się tu tak, jak będzie stało.
figures-formula-hint = Pisany jak w TeX-u. Enter, gdy gotowe; Esc zostawia, jak było.
figures-equation-hint = Pisane jak w TeX-u. Enter, gdy gotowe; Shift+Enter zaczyna nowy wiersz; Esc zostawia, jak było.
figures-formula-unread = Nie udało się odczytać wzoru.
# Shown in the text where a formula has nothing written in it yet.
figures-formula-blank = wzór
figures-equation-blank = Równanie

## What can be put into a formula by pressing.

figures-sign-raised = Indeks górny
figures-sign-lowered = Indeks dolny
figures-sign-fraction = Ułamek
figures-sign-root = Pierwiastek
figures-sign-sum = Suma
figures-sign-integral = Całka
figures-sign-brackets = Nawiasy, które rosną
figures-sign-alpha = alfa
figures-sign-beta = beta
figures-sign-gamma = gamma
figures-sign-lambda = lambda
figures-sign-pi = pi
figures-sign-sigma = sigma
figures-sign-less-or-equal = Mniejsze lub równe
figures-sign-greater-or-equal = Większe lub równe
figures-sign-not-equal = Różne
figures-sign-nearly-equal = W przybliżeniu równe
figures-sign-times = Razy
figures-sign-plus-or-minus = Plus minus
figures-sign-arrow = Strzałka
figures-sign-infinity = Nieskończoność
figures-sign-words = Słowa we wzorze

## Cross-references to a figure, a table, an equation or a part.

figures-points-by = Pokazany jako
figures-form-full = Słowo i numer
figures-form-number = Sam numer
figures-form-equation = Numer, jak stoi przy równaniu
figures-form-its-number = Jego numer
figures-form-its-name = Jego nazwa
figures-go-to = Przejdź do tego, na co wskazuje
figures-pointed-gone = Tego, na co wskazuje, nie ma już w dokumencie
figures-point-elsewhere = Wskaż coś innego…

## Choosing what a cross-reference refers to.

figures-targets = Wybierz, na co wskazać
figures-targets-placeholder = Wskaż rycinę, tabelę, równanie, część
figures-targets-search = Szukaj tego, na co można wskazać
figures-targets-results = Na co można wskazać
figures-targets-figures = Ryciny
figures-targets-tables = Tabele
figures-targets-equations = Równania
figures-targets-parts = Części dokumentu
figures-targets-figure-unsaid = Rycina, o której nic nie powiedziano
figures-targets-table-unsaid = Tabela, o której nic nie powiedziano
figures-targets-no-match = Nic w dokumencie nie odpowiada tym słowom.
figures-targets-none = Nie ma jeszcze na co wskazać: żadnej ryciny, tabeli, numerowanego równania ani części z nazwą.
figures-targets-hint = Odsyłacz podąża za tym, na co wskazuje: za jego numerem i tym, jak nazywa go format.

## Shown by the stylesheet, where the page has no element for the words.

figures-picture-absent = Obrazu nie ma na tym komputerze
figures-caption-placeholder = Co się mówi o obrazie
