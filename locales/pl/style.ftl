# Reference styles: their kinds, the search for more, and the style editor,
# with the words it tells the parts of a style by.

## The kinds of reference style, as the styles are grouped by them.

style-kind-note = Przypisy
style-kind-author-date = Autor i rok
style-kind-numeric = Numery
style-kind-label = Etykiety
style-kind-author = Autor
style-kind-other = Inne

## The search for reference styles of journals and publishers.

style-browser = Style cytowania
style-browser-subtitle = Ponad dziesięć tysięcy stylów czasopism i wydawców, po nazwie
style-browser-placeholder = Nazwa czasopisma, wydawcy lub stylu
style-browser-search = Szukaj stylów
# Beside a style that has been fetched already.
style-browser-here = Jest
style-browser-fetch = Pobierz
style-browser-none-found = Żaden styl nie ma tych słów w nazwie.
style-browser-about = Style są pobierane z repozytorium projektu Citation Style Language i przechowywane razem z twoimi własnymi. Te, które masz, można dostosować do życzeń wydawcy w edytorze stylów.
style-browser-import = Importuj plik…
style-browser-import-title = Importuj styl cytowania
style-browser-fetch-failed = Nie udało się pobrać stylu.
style-browser-file-unread = Nie udało się odczytać pliku.

## The style editor.

style-editor = Styl cytowania
style-name = Nazwa stylu
# The name a style of one's own is first given, made from that of the style it is made from.
style-name-changed = { $name }, zmieniony
style-depth = Jak głęboko sięgać
style-depth-options = Częste zmiany
style-depth-parts = Część po części
style-depth-source = Źródło
style-scope = Co zmieniać
style-scope-citations = Cytowania
style-scope-notes = Przypisy
style-scope-bibliography = Bibliografia
style-bundled = Style dołączone do Glaukopis pozostają, jak są. Twoje zmiany są zapisywane jako własny styl.
style-delete = Usuń ten styl
style-save-own = Zapisz jako własny
style-saved = „{ $name }” zapisano wśród twoich własnych stylów
style-read-failed = Nie udało się odczytać stylu.
style-save-failed = Nie udało się zapisać stylu.
style-delete-failed = Nie udało się usunąć stylu.
style-delete-title = Usunąć styl „{ $name }”?
style-delete-message = Mapy, które go używają, będą zamiast niego używać innego stylu.
style-delete-confirm = Usuń styl
style-leave-title = Wyjść bez zapisywania?
style-leave-message = Zmiany wprowadzone w stylu przepadną.
style-leave-confirm = Wyjdź
style-leave-cancel = Edytuj dalej

## Common changes: names.

style-names = Nazwiska
# A sentence with two fields in it, where numbers are written: the least number of
# authors for which "et al." is used, and how many are named before it.
style-et-al = Przy { $min } autorach lub więcej podaj pierwszych { $first } i „et al.”
style-et-al-min = Liczba autorów, od której używa się et al.
style-et-al-first = Liczba autorów podawanych przed et al.
style-et-al-empty = Zostawione puste: wymieniani są wszyscy
# As the one before, for a work that has been cited before.
style-et-al-again = Przy kolejnym cytowaniu, przy { $min } lub więcej podaj pierwszych { $first }
style-et-al-again-min = Liczba autorów, od której używa się et al. w kolejnych cytowaniach
style-et-al-again-first = Liczba autorów podawanych w kolejnych cytowaniach
style-et-al-again-empty = Zostawione puste: jak za pierwszym razem
style-before-last-name = Przed ostatnim nazwiskiem
# The word the style prints there, in the language of the document.
style-and-word = i
style-and-nothing = Nic
style-as-the-style-has-it = Jak ma styl
style-comma-before-last = Przecinek przed nim
style-comma-contextual = Przy trzech nazwiskach lub więcej: A, B, i C
style-comma-always = Zawsze: A, i B
style-comma-never = Nigdy: A, B i C
style-comma-after-inverted = Po nazwisku w szyku odwróconym
style-given-names = Imiona
style-given-full = W pełni: John Miles
style-given-spaced = Inicjały: J. M.
style-given-close = Inicjały, razem: J.M.
style-given-bare = Inicjały bez kropek: JM
style-given-bare-spaced = Inicjały bez kropek: J M
style-family-first = Nazwisko na początku
style-family-first-none = U nikogo: John Foley
style-family-first-first = U pierwszego autora: Foley, John, and Robert Fowler
style-family-first-all = U wszystkich: Foley, John, and Fowler, Robert
style-sort-separator = Między nazwiskiem a imieniem
style-sort-separator-hint = Gdy nazwisko stoi na początku

## Common changes: the citation, or the note, and the entries of the bibliography.

style-the-citation = Cytowanie
style-the-note = Przypis
style-begins-with = Zaczyna się od
style-ends-with = Kończy się na
style-between-works = Między dziełami cytowanymi razem
style-collapse = Dzieła jednego autora cytowane razem
style-collapse-none = Każde w pełni
style-collapse-year = Nazwisko raz: Nagy 1979, 1996
style-collapse-year-suffix = I rok raz: Nagy 1979a, b
style-collapse-year-suffix-ranged = Z zakresami: Nagy 1979a–c
style-collapse-citation-number = Numery jako zakresy: [1–3]
style-disambiguate = Gdy dwa dzieła byłyby cytowane tak samo
style-disambiguate-year-suffix = Dodaj literę do roku
style-disambiguate-names = Wymień więcej autorów
style-disambiguate-given-names = Dodaj imiona lub inicjały
style-near-note = Przypis liczy się jako bliski w obrębie
style-near-note-hint = Przypisów; dla stylów, które skracają to, co cytowano niedaleko
style-entries = Pozycje
style-entry-ends-with = Każda kończy się na
style-author-repeated = Dla powtórzonego autora
style-author-repeated-hint = W miejsce nazwiska, w pozycjach po pierwszej
style-hanging-indent = Wysunięcie
style-hanging-indent-hint = Jak głębokie, decyduje format dokumentu
style-second-field = Numery lub etykiety stoją
style-second-field-line = W wierszu
style-second-field-column = W osobnej kolumnie
style-second-field-margin = Na marginesie
style-second-field-hint = Dla stylów, które numerują pozycje

## Common changes: throughout the style.

style-throughout = W całym stylu
style-page-ranges = Zakresy stron
style-page-ranges-as-entered = Jak wpisano
style-page-ranges-expanded = W pełni: 321–328
style-page-ranges-minimal = Najkrócej: 321–8
style-page-ranges-minimal-two = Co najmniej dwie cyfry: 321–28
style-page-ranges-chicago = Jak w Chicago Manual
style-particles = „van”, „de”, „von” przed nazwiskiem
style-particles-never = Zostają przy nim i sortują się pod v, d
style-particles-sort-only = Zostają przy nim, ale nie sortuje się po nich
style-particles-display-and-sort = Idą po imieniu: Gogh, Vincent van
style-hyphen = Łącznik między inicjałami
style-hyphen-hint = J.-P. Sartre, nie J.P. Sartre
style-locale = Słowa stylu są w języku
style-locale-document = Dokumentu
style-locale-hint = „red.”, „w”, „dostęp”, miesiące

## Part by part.

# The scope is citation or bibliography.
style-parts-of = { $scope ->
    [citation] Części cytowania
   *[bibliography] Części bibliografii
}
style-parts-none = { $scope ->
    [citation] Ten styl nie ma cytowania.
   *[bibliography] Ten styl nie ma bibliografii.
}
style-parts-hint = Wybierz część po lewej, by zmienić, jak jest drukowana: co stoi przed nią i po niej, jej krój, jej wielkie litery. Części otwiera się, by zobaczyć, z czego się składają.
style-part-unfold = Otwórz
style-part-fold = Zamknij
style-part-up = Przesuń w górę
style-part-down = Przesuń w dół
style-part-add-after = Dodaj po niej
style-part-take-away = Usuń
style-part-add-within = Dodaj w jej obrębie
# A part of a macro: a part of the style that is used in several places.
style-part-shared = { $count ->
    [one] To należy do „{ $macro }”, używanego w { $count } miejscu. Zmiana tutaj pokaże się tam.
    [few] To należy do „{ $macro }”, używanego w { $count } miejscach. Zmiana tutaj pokaże się we wszystkich.
    [many] To należy do „{ $macro }”, używanego w { $count } miejscach. Zmiana tutaj pokaże się we wszystkich.
   *[other] To należy do „{ $macro }”, używanego w { $count } miejscach. Zmiana tutaj pokaże się we wszystkich.
}
style-add-words = Własne słowa
style-add-words-hint = Takie jak „w”, „dostęp” albo interpunkcja
# Over the fields of a reference that a part can print.
style-add-from-reference = Z pozycji
style-part-words = Słowa
style-part-before = Przed nią
style-part-before-hint = Drukowane tylko wtedy, gdy sama część jest drukowana
style-part-after = Po niej
style-part-between = Między jej częściami
style-slant = Pochylenie
style-slant-upright = Proste
style-slant-italic = Kursywa
style-weight = Grubość
style-weight-regular = Zwykła
style-weight-bold = Pogrubiona
style-letters = Litery
style-letters-as-written = Jak napisano
style-letters-small-caps = Kapitaliki
style-case = Wielkie litery
style-case-as-entered = Jak wpisano
style-case-title = Każde Ważne Słowo Wielką Literą
style-case-sentence = Jak w zdaniu
style-case-capitalize-first = Pierwsza litera wielka
style-case-capitalize-all = Każde Słowo Wielką Literą
style-case-uppercase = WERSALIKI
style-case-lowercase = małe litery
style-height = Wysokość
style-height-baseline = W wierszu
style-height-raised = Indeks górny
style-height-lowered = Indeks dolny
style-quotes = W cudzysłowie
style-strip-periods = Bez kropek
style-strip-periods-hint = Dla skrótów: „red” zamiast „red.”
style-text-form = Postać
style-text-form-long = W pełni
style-text-form-short = Krótka, gdy pozycja ją ma
style-term-form = Postać słowa
style-term-form-long = W pełni: redaktor, strona
style-term-form-short = Krótka: red., s.
style-term-form-verb = Jako czasownik: pod redakcją
style-term-form-verb-short = Jako czasownik, krótko: red.
style-term-form-symbol = Jako znak: §
style-date-parts = Data podawana jest
style-date-parts-year = Tylko jako rok
style-date-parts-year-month = Jako rok i miesiąc
style-date-parts-full = W pełni

## The source of the style, and the sample it is tried on.

style-source = Źródło stylu
style-source-try = Wypróbuj
style-source-unread = Nie udało się odczytać źródła.
style-sample-unusable = Stylu nie da się użyć w tej postaci
style-sample-failed = Nie udało się wypróbować stylu.
style-sample-in-text = W tekście
style-sample-in-notes = W przypisach
style-sample-in-bibliography = W bibliografii
style-sample-cited = Cytowane dzieło
style-sample-same-page = To samo, ze stroną
style-sample-another = Inne, ze słowem przed nim
style-sample-first-again = Pierwsze znowu, z rozdziałem
style-sample-together = Dwa dzieła razem
style-sample-in-sentence = Z autorem w zdaniu
style-sample-examples = Pokazane na przykładach: twoja biblioteka jest pusta.
style-sample-library = Pokazane na dziełach z twojej biblioteki.

## The source of a style, where it cannot be read as one.

style-source-not-xml = Źródło nie jest poprawnie zbudowanym XML.
style-source-not-style = To nie jest styl: nie zaczyna się od <style>.
style-source-dependent = Styl nie ma <citation>: tylko wskazuje inny styl i nie da się go zmieniać.

## The parts of a style, as the style editor tells them in words.

style-part-layout = Całość
style-part-text = Tekst
# A part that prints a word of the style's language: the term is its name in CSL.
style-part-term = Słowo na „{ $term }”
# A part that prints words written into the style.
style-part-value = Słowa „{ $value }”
style-part-name = Jak pisane są nazwiska
# The name is family or given, as CSL has them.
style-part-name-part = { $name ->
    [family] Nazwisko
    [given] Imię
   *[other] Część nazwiska { $name }
}
style-part-et-al = „et al.”
# The variables are one or more of those below: "the pages".
style-part-label = Słowo przy: { $variables } („s.”, „red.”)
style-part-role = Słowo na rolę („red.”, „tłum.”)
style-part-substitute = Gdy nie ma takiego nazwiska, w jego miejsce
# The name is day, month or year, as CSL has them, or part.
style-part-date-part = { $name ->
    [day] Dzień
    [month] Miesiąc
    [year] Rok
   *[other] Część daty { $name }
}
style-part-group = Razem
style-part-choose = Jedno z tych
# The condition is made of those below.
style-part-if = Jeśli { $condition }
style-part-else-if = Albo, jeśli { $condition }
style-part-else = W przeciwnym razie
# A name the style has, of a part of it (a macro) or of a variable it does not know.
style-quoted = „{ $text }”

## Words that join others: "the author, or else the editor", "a book or a chapter".
## The first may be a list of several, joined by commas.

style-or = { $first } lub { $last }
style-and = { $first } i { $last }
style-or-else = { $first }, a w braku tego { $last }

## When a part of a style is printed: "If the work is a book".

style-if-type = dzieło to { $types }
style-if-has = ma: { $variables }
style-if-lacks = nie ma: { $variables }
style-if-numeric = { $variables } jest liczbą
style-if-uncertain = { $variables } jest niepewne
# The places are pages, chapters, verses and the like; see style-locator.
style-if-locator = cytowane miejsce to { $locators }
style-if-disambiguate = inaczej pomylono by je z innym
style-if-always = zawsze
style-if-none-holds = nic z tego nie zachodzi: { $conditions }
# A kind of place that a citation points to, as CSL names it: page, chapter, verse,
# sub-verbo, and so on. English leaves the names as they are.
style-locator = { $name }

## When a citation is printed, by where it stands among the others.

style-position-first = jest cytowane po raz pierwszy
style-position-subsequent = było już cytowane
style-position-ibid = jest tym samym, co cytowanie przed nim
style-position-ibid-with-locator = jest tym samym, co cytowanie przed nim, w innym miejscu
style-position-near-note = było cytowane w przypisie niedaleko

## How a part is set: "italic, in quotation marks, before “, ”".

style-form-italic = kursywą
style-form-bold = pogrubione
style-form-small-caps = kapitalikami
style-form-underlined = podkreślone
style-form-quoted = w cudzysłowie
# How the letters are set, as CSL names it; the words are that name with spaces for its dashes.
style-form-case = { $case ->
    [lowercase] małymi literami
    [uppercase] wielkimi literami
    [capitalize-first] pierwsza litera wielka
    [capitalize-all] każde słowo wielką literą
    [sentence] jak w zdaniu
    [title] jak w tytule
   *[other] { $words }
}
style-form-raised = w indeksie górnym
style-form-lowered = w indeksie dolnym
# The part comes after these words.
style-form-after = po „{ $text }”
# The part comes before these words.
style-form-before = przed „{ $text }”
style-form-between = z „{ $text }” pomiędzy

## The kinds of work a reference is of, as CSL names them.

style-type-book = książka
style-type-chapter = rozdział
style-type-article-journal = artykuł w czasopiśmie naukowym
style-type-article-magazine = artykuł w magazynie
style-type-article-newspaper = artykuł w gazecie
style-type-article = artykuł
style-type-thesis = rozprawa
style-type-report = raport
style-type-webpage = strona internetowa
style-type-paper-conference = referat konferencyjny
style-type-entry-encyclopedia = hasło w encyklopedii
style-type-entry-dictionary = hasło w słowniku
style-type-entry = hasło
style-type-review = recenzja
style-type-review-book = recenzja książki
style-type-manuscript = rękopis
style-type-personal_communication = list lub inna korespondencja
style-type-legal_case = orzeczenie sądu
style-type-legislation = akt prawny
style-type-bill = projekt ustawy
style-type-patent = patent
style-type-dataset = zbiór danych
style-type-software = oprogramowanie
style-type-motion_picture = film
style-type-broadcast = audycja
style-type-song = nagranie
style-type-speech = wykład
style-type-interview = wywiad
style-type-graphic = ilustracja
style-type-map = mapa
style-type-pamphlet = broszura
style-type-post-weblog = wpis na blogu
style-type-post = wpis
style-type-classic = dzieło klasyczne
style-type-collection = zbiór
style-type-document = dokument
style-type-standard = norma
style-type-treaty = traktat
style-type-periodical = czasopismo
style-type-musical_score = partytura
style-type-figure = rycina
style-type-event = wydarzenie
style-type-performance = przedstawienie
style-type-regulation = rozporządzenie
style-type-hearing = przesłuchanie

## What a reference has, as CSL names it: with its article, and without it
## (.bare) as a field of a reference is named.

style-variable-title = tytuł
    .bare = tytuł
style-variable-title-short = tytuł skrócony
    .bare = tytuł skrócony
style-variable-container-title = tytuł czasopisma lub książki
    .bare = tytuł czasopisma lub książki
style-variable-container-title-short = skrócony tytuł czasopisma
    .bare = skrócony tytuł czasopisma
style-variable-collection-title = seria
    .bare = seria
style-variable-collection-number = numer w serii
    .bare = numer w serii
style-variable-original-title = tytuł oryginału
    .bare = tytuł oryginału
style-variable-reviewed-title = tytuł recenzowanego dzieła
    .bare = tytuł recenzowanego dzieła
style-variable-author = autor
    .bare = autor
style-variable-editor = redaktor
    .bare = redaktor
style-variable-translator = tłumacz
    .bare = tłumacz
style-variable-container-author = autor książki
    .bare = autor książki
style-variable-collection-editor = redaktor serii
    .bare = redaktor serii
style-variable-editorial-director = redaktor naczelny
    .bare = redaktor naczelny
style-variable-original-author = autor oryginału
    .bare = autor oryginału
style-variable-reviewed-author = autor recenzowanego dzieła
    .bare = autor recenzowanego dzieła
style-variable-interviewer = osoba przeprowadzająca wywiad
    .bare = osoba przeprowadzająca wywiad
style-variable-recipient = adresat
    .bare = adresat
style-variable-director = reżyser
    .bare = reżyser
style-variable-composer = kompozytor
    .bare = kompozytor
style-variable-illustrator = ilustrator
    .bare = ilustrator
style-variable-issued = data
    .bare = data
style-variable-accessed = data dostępu
    .bare = data dostępu
style-variable-original-date = data oryginału
    .bare = data oryginału
style-variable-event-date = data wydarzenia
    .bare = data wydarzenia
style-variable-submitted = data złożenia
    .bare = data złożenia
style-variable-volume = tom
    .bare = tom
style-variable-number-of-volumes = liczba tomów
    .bare = liczba tomów
style-variable-issue = zeszyt
    .bare = zeszyt
style-variable-edition = wydanie
    .bare = wydanie
style-variable-page = strony
    .bare = strony
style-variable-page-first = pierwsza strona
    .bare = pierwsza strona
style-variable-number-of-pages = liczba stron
    .bare = liczba stron
style-variable-number = numer
    .bare = numer
style-variable-chapter = rozdział
    .bare = rozdział
style-variable-chapter-number = numer rozdziału
    .bare = numer rozdziału
style-variable-publisher = wydawca
    .bare = wydawca
style-variable-publisher-place = miejsce wydania
    .bare = miejsce wydania
style-variable-original-publisher = pierwotny wydawca
    .bare = pierwotny wydawca
style-variable-original-publisher-place = pierwotne miejsce wydania
    .bare = pierwotne miejsce wydania
style-variable-locator = cytowane miejsce
    .bare = cytowane miejsce
style-variable-citation-number = numer cytowania
    .bare = numer cytowania
style-variable-citation-label = etykieta cytowania
    .bare = etykieta cytowania
style-variable-year-suffix = litera po roku
    .bare = litera po roku
style-variable-first-reference-note-number = numer przypisu, w którym cytowano po raz pierwszy
    .bare = numer przypisu, w którym cytowano po raz pierwszy
style-variable-DOI = DOI
    .bare = DOI
style-variable-URL = adres
    .bare = adres
style-variable-ISBN = ISBN
    .bare = ISBN
style-variable-ISSN = ISSN
    .bare = ISSN
style-variable-PMID = PMID
    .bare = PMID
style-variable-genre = rodzaj dzieła
    .bare = rodzaj dzieła
style-variable-medium = nośnik
    .bare = nośnik
style-variable-note = uwaga
    .bare = uwaga
style-variable-annote = adnotacja
    .bare = adnotacja
style-variable-abstract = streszczenie
    .bare = streszczenie
style-variable-archive = archiwum
    .bare = archiwum
style-variable-archive_location = miejsce w archiwum
    .bare = miejsce w archiwum
style-variable-archive-place = miejsce archiwum
    .bare = miejsce archiwum
style-variable-authority = instytucja wydająca
    .bare = instytucja wydająca
style-variable-call-number = sygnatura
    .bare = sygnatura
style-variable-event = wydarzenie
    .bare = wydarzenie
style-variable-event-place = miejsce wydarzenia
    .bare = miejsce wydarzenia
style-variable-event-title = tytuł wydarzenia
    .bare = tytuł wydarzenia
style-variable-section = podrozdział
    .bare = podrozdział
style-variable-source = źródło
    .bare = źródło
style-variable-status = stan publikacji
    .bare = stan publikacji
style-variable-version = wersja
    .bare = wersja
style-variable-language = język
    .bare = język
style-variable-dimensions = wymiary
    .bare = wymiary
style-variable-scale = skala
    .bare = skala
style-variable-references = odwołania
    .bare = odwołania
style-variable-keyword = słowa kluczowe
    .bare = słowa kluczowe
style-variable-jurisdiction = jurysdykcja
    .bare = jurysdykcja
