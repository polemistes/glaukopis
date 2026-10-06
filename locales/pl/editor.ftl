# The editor of texts: the tools for writing, citations and notes.
# See locales/README.md.

## The marks and the kinds of paragraph, in the bar over a selection and in
## the tools over the text.

editor-format = Format
editor-writing = Pisanie
editor-italic = Kursywa
editor-bold = Pogrubienie
editor-small-capitals = Kapitaliki
editor-superscript = Indeks górny
editor-subscript = Indeks dolny
editor-struck = Przekreślenie
editor-quotation = Cytat
editor-block-quotation = Cytat blokowy
editor-list = Lista
editor-text = Tekst
editor-text-hint = Akapit
editor-quotation-hint = Wyodrębniony z tekstu
editor-list-hint = Ze znakiem przed każdym punktem
editor-numbered-list = Lista numerowana
editor-numbered-list-hint = Z numerem przed każdym punktem
editor-verse = Wiersz
editor-verse-hint = Wersy poezji lub dramatu, każdy zachowany jako osobny wers
editor-speaker = Mówiący
editor-speaker-hint = Kto mówi, w osobnym wersie
editor-direction = Didaskalia
editor-direction-hint = Co się dzieje, kursywą
editor-line-numbers = Numery wersów
editor-line-numbers-hint = Numeruj wersy tego wiersza: od którego wersu i co ile
editor-line-numbers-from = Numeruj wersy od
editor-line-numbers-none = Zostaw puste, by nie numerować
editor-line-numbers-every = Pokazuj numer co
editor-line-numbers-number = Potrzebna jest liczba całkowita.
editor-kinds-text = Tekst
editor-kinds-quotation = Cytat
editor-kinds-verse = Wiersz
editor-kinds-script = Scenariusz
editor-kinds-more = Więcej
editor-kinds-words = Słowa
editor-attribution = Autor cytatu
editor-attribution-hint = Czyje to słowa, pod cytatem, z prawej
editor-epigraph = Motto
editor-epigraph-hint = Cytat na początku części
editor-headword = Hasło
editor-headword-hint = Słowo, które objaśnia słowniczek
editor-gloss = Objaśnienie
editor-gloss-hint = Co znaczy hasło
editor-code = Kod
editor-code-hint = Zachowany litera w literę, pismem o stałej szerokości
editor-break = Przerywnik
editor-break-hint = Pauza między częściami, ze znakiem, jaki daje jej format
editor-draft = Notatka robocza
editor-draft-hint = Tylko dla twoich oczu: nie trafia do żadnego dokumentu
editor-foreign = Słowa obcojęzyczne
editor-foreign-hint = Słowa w innym języku, za którym idzie sprawdzanie pisowni
editor-title-of-work = Tytuł dzieła
editor-title-of-work-hint = Tytuł książki, sztuki, obrazu
editor-term = Termin
editor-term-hint = Termin tam, gdzie jest użyty po raz pierwszy
editor-mention = Omawiane słowo
editor-mention-hint = Słowo, o którym mowa jako o słowie, w cudzysłowie
editor-highlight = Zakreślenie
editor-highlight-hint = Dla oka na ekranie: nie trafia do żadnego dokumentu
editor-underline = Podkreślenie
editor-code-words = Kod w wierszu
editor-code-words-hint = Pismo o stałej szerokości, wewnątrz wiersza
editor-scene = Nagłówek sceny
editor-scene-hint = WN. DOM – NOC
editor-action = Akcja
editor-action-hint = Co widać i co się dzieje
editor-character = Postać
editor-character-hint = Kto mówi, nad dialogiem
editor-dialogue = Dialog
editor-dialogue-hint = Co jest mówione
editor-parenthetical = Uwaga w nawiasie
editor-parenthetical-hint = Jak to jest mówione, w nawiasie
editor-transition = Przejście
editor-transition-hint = CIĘCIE:, z prawej
editor-comment = Komentarz
editor-comment-hint = Komentarz do zaznaczenia
editor-comment-element-hint = Komentarz do tego elementu; zaznacz słowa, by skomentować właśnie je
editor-parallel = Dwa teksty obok siebie
editor-parallel-hint = Oryginał i jego przekład, każdy jako osobny tekst
editor-paragraph-kind = Rodzaj akapitu
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = Rodzaj akapitu: { $kind }

## The kind menu: the kinds in hand, the whole catalogue under "More…", and
## the format that sets them at its foot. The words menu, with the kinds of
## words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = Więcej…
editor-kinds-in-hand = Rodzaje pod ręką
editor-kinds-own = Własne
editor-kinds-make = Utwórz rodzaj…
editor-kinds-change-own = Zmień własny rodzaj…
# Over the item that opens the format editor: the format sets how each kind looks.
editor-kinds-set-by = Składane tak, jak ma je „{ $format }”
editor-kinds-change-format = Zmień format…
editor-kinds-change-format-hint = Jak każdy rodzaj jest składany w tym dokumencie
editor-words = Słowa
editor-words-hint = Podkreślenie, indeks górny, kod; słowa obcojęzyczne, tytuł dzieła, termin
editor-words-make = Utwórz rodzaj słów…
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-map = Język mapy
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = Zwykłe słowa
editor-own-kind-new = Własny rodzaj
editor-own-kind-change = Zmień rodzaj
editor-own-kind-name = Nazwa
editor-own-kind-name-placeholder = List, telegram, modlitwa…
editor-own-kind-words-placeholder = Nazwa statku, łacina, słowo kluczowe…
editor-own-kind-name-taken = Jest już rodzaj o tej nazwie.
editor-own-kind-based-on = Na podstawie
editor-own-kind-based-on-hint = Czego nie powiedziano niżej, jest jak w tym rodzaju
editor-own-kind-look = Czym się różni
editor-own-kind-create = Utwórz
editor-own-kind-delete-title = Usunąć rodzaj „{ $name }”?
editor-own-kind-delete-message = { $count ->
    [0] Żaden tekst nie jest tego rodzaju.
    [one] To, co jest tego rodzaju w jednym elemencie, zostaje, jak jest, a w dokumentach jest składane jako tekst.
    [few] To, co jest tego rodzaju w { $count } elementach, zostaje, jak jest, a w dokumentach jest składane jako tekst.
    [many] To, co jest tego rodzaju w { $count } elementach, zostaje, jak jest, a w dokumentach jest składane jako tekst.
   *[other] To, co jest tego rodzaju w { $count } elementach, zostaje, jak jest, a w dokumentach jest składane jako tekst.
}

## Citing, notes, and what is put into the text.

editor-cite = Cytuj
editor-cite-here = Cytuj dzieło tutaj
editor-cite-at-cursor = Cytuj dzieło w miejscu kursora
editor-note = Przypis
editor-note-selection = Zrób z zaznaczenia przypis
editor-note-hint = Przypis, u dołu strony lub na końcu
editor-insert = Wstaw
editor-insert-hint = Obraz, tabelę, matematykę, odsyłacz
editor-new-element = Nowy element
editor-new-element-hint = Nowy element po tym albo pod nim
editor-new-after = Nowy element po tym
editor-new-under = Nowy element pod tym
editor-new-split = Podziel tutaj
editor-new-split-hint = To, co za kursorem, staje się nowym elementem
editor-spelling-on = Pisownia jest sprawdzana w trakcie pisania · naciśnij, by przestać
editor-spelling-off = Pisownia nie jest sprawdzana · naciśnij, by ją sprawdzać
editor-picture-file = Obraz z pliku…
editor-picture-file-hint = Rycina z tym, co się o niej mówi
editor-picture-store = Obraz ze zbioru…
editor-picture-store-hint = Te, które masz, są pokazane z boku
editor-equation = Równanie
editor-equation-hint = Matematyka w osobnym wierszu
editor-table = Tabela…
editor-table-hint = O tylu wierszach i kolumnach
editor-table-file = Tabela z pliku…
editor-table-file-hint = CSV albo arkusz LibreOffice lub Excela
editor-formula = Wzór
editor-formula-hint = Matematyka w wierszu
editor-pointer = Odsyłacz…
editor-pointer-hint = Do ryciny, tabeli, równania lub części: „zob. ryc. 2”
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = obraz

## More.

editor-found = Znalezione cytowania…
editor-found-count = { $count ->
    [one] { $count } do przejrzenia i zrobienia z niego cytowania
    [few] { $count } do przejrzenia i zrobienia z nich cytowań
    [many] { $count } do przejrzenia i zrobienia z nich cytowań
   *[other] { $count } do przejrzenia i zrobienia z nich cytowań
}
editor-found-none = Oraz tekst, który wygląda jak cytowania, w tej mapie

## Choosing a work to cite.

editor-picker = Wybierz pozycję
editor-picker-placeholder = Cytuj: autor, tytuł, rok
editor-picker-search = Szukaj pozycji
editor-picker-results = Pozycje
editor-picker-in-project = W tym projekcie
editor-picker-recent = Ostatnio dodane
editor-picker-empty = Twoja biblioteka jest pusta.
editor-picker-no-match = Nic w twojej bibliotece nie zawiera tych słów.
editor-picker-type = Pisz, by przeszukać bibliotekę.
editor-picker-new = Nowa pozycja…
editor-picker-import = Importuj…

## A citation, and each work in it.

editor-citation = Cytowanie
editor-citation-add = Dodaj dzieło
editor-citation-add-purpose = Dodaj dzieło do cytowania
editor-citation-in-text = Autor w tekście: Nagy (1979)
editor-citation-remove = Usuń cytowanie
editor-citation-split = Oddziel słowa od cytowania
editor-citation-split-hint = Słowa przed i po stają się tekstem wiersza, a każde dzieło osobnym cytowaniem, ze stroną i niczym więcej
editor-citation-not-in-library = Tej pozycji nie ma w twojej bibliotece.
editor-citation-edit-reference = Edytuj pozycję
editor-citation-before = Przed
editor-citation-before-placeholder = zob., por.
editor-citation-after = Po
editor-citation-after-placeholder = i passim
editor-citation-locator-kind = Rodzaj miejsca
editor-citation-suppress-author = Autor jest wymieniony w moim zdaniu: podaj tylko rok
editor-citation-remove-work = Usuń to dzieło
# Stands in the text in place of a citation of a work that is in neither the library nor the project.
editor-citation-missing = [nie znaleziono pozycji]
# Stands in the text in place of a citation of no work.
editor-citation-empty = (cytowanie)

## The kinds of place in a work a citation can point to, as the menu of a
## citation names them.

editor-locator-page = Strona
editor-locator-chapter = Rozdział
editor-locator-section = Podrozdział
editor-locator-paragraph = Akapit
editor-locator-line = Wiersz
editor-locator-verse = Werset
editor-locator-book = Księga
editor-locator-volume = Tom
editor-locator-part = Część
editor-locator-column = Kolumna
editor-locator-folio = Karta
editor-locator-figure = Rycina
editor-locator-note = Przypis
editor-locator-number = Numer
editor-locator-sub-verbo = Sub verbo

## A note, in the panel it is written in.

# The number is that of the note, or a letter for a note that stands in a place of its own.
editor-note-numbered = Przypis { $number }
editor-note-place = Gdzie stoi przypis
editor-note-place-format = Tam, gdzie format ma przypisy
editor-note-place-foot = U dołu strony
editor-note-place-end = Na końcu tekstu
editor-note-placeholder = Tekst przypisu
