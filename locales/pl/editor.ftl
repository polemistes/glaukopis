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
editor-quotation-hint = Cudze słowa, wyodrębnione z tekstu
editor-list-hint = Punkt listy; wcięcie tworzy listę w liście
editor-numbered-list = Lista numerowana
editor-numbered-list-hint = Numerowany punkt listy; wcięcie tworzy listę w liście
editor-verse = Wiersz
editor-verse-hint = Wers poezji, dramatu lub transkrypcji, zachowany jako osobny wers
editor-speaker = Mówiący
editor-speaker-hint = Kto mówi: w osobnym wersie albo jako słowa w obrębie wersu
editor-direction = Didaskalia
editor-direction-hint = Co dzieje się na scenie: w osobnym wersie albo jako słowa w obrębie wersu
editor-line-numbers = Numery
editor-line-numbers-hint = Numeruj te wiersze: jak są liczone, od jakiego numeru, co ile i po której stronie; i podaj, co dotyczy wiersza, w którym stoi kursor. Wiersze numerowane razem, z tymi samymi ustawieniami, liczy się jako jeden ciąg, bez względu na ich rodzaje.
editor-line-numbers-from = Numeruj od
editor-line-numbers-from-hint = Pierwszy liczony wiersz dostaje ten numer, a liczenie idzie od niego dalej.
editor-line-numbers-every = Pokazuj numer co
editor-line-numbers-number = Potrzebna jest liczba całkowita.
editor-line-this = Ten wiersz
editor-line-number = Jego numer lub etykieta
editor-line-number-placeholder = Liczony jak pozostałe
editor-line-number-hint = 1234, 567a: zawsze pokazywany; następne wiersze liczy się dalej od niego.
editor-line-uncounted = Nieliczony
editor-line-uncounted-hint = Na przykład druga połowa wersu dzielonego między mówiących: liczenie go pomija.
editor-line-hidden = Liczony, bez widocznego numeru
editor-line-hidden-hint = Liczenie przechodzi przez niego jak przez każdy wiersz, ale w dokumencie nie stoi przy nim żaden numer, nawet tam, gdzie by wypadał. Tam, gdzie piszesz, numer stoi w nawiasie.
editor-line-number-held = Liczony, ale niepokazywany w dokumencie. Naciśnij, by nadać mu własny numer.
editor-line-margin = Słowa na marginesie
editor-line-margin-placeholder = Metrum, numer z innego wydania
editor-line-margin-hint = Pokazywane na marginesie obok niego, naprzeciw numerów; nie są liczone.
# How the lines of a stretch are numbered: see ADR 0041.
editor-numbering = Numeracja
editor-numbering-none = Bez numeracji
editor-numbering-counted = Liczona od pierwszego podanego numeru
editor-numbering-given = Tylko podane numery
editor-line-numbers-every-layout = Jak w układzie: co { $every }
editor-line-numbers-side = Strona numerów
editor-side-layout = Jak w układzie ({ $side })
editor-side-left = Lewa
editor-side-right = Prawa
# The first counted line of the stretch is the one the cursor is in: its number is where the count begins.
editor-line-number-first-hint = Tu zaczyna się liczenie.
# Over a number in the margin of the text, which opens a field for it when pressed.
editor-line-number-press = Numer tego wiersza: naciśnij, by go zmienić

## Numbers belong to what they number (ADR 0041): the Numbers menu offers
## the three, each saying what it numbers.
editor-numbers-lines = Numeruj te wiersze…
editor-numbers-lines-hint = Wiersze akapitów, w których jest kursor, albo zaznaczonych: od jakiego numeru, co ile, po której stronie
editor-numbers-page = Numeruj wiersze strony
editor-numbers-page-hint = Każdy wiersz drukowanej strony, numerowany na marginesie, w tym dokumencie i w tych pod nim

## The bracket at the left of paragraphs of one kind standing together (a
## run), named by the kind; its menu says what is said of them.
# After the name of the kind, where the lines of the run are numbered: "Verse · numbered".
editor-bracket-numbered = z numeracją
editor-run-label-hint = { $kind } · naciśnij, by zobaczyć, co dotyczy tych akapitów
editor-run-numbers = Numery…
editor-run-numbers-hint = Jak liczy się tu wiersze, od jakiego numeru, co ile i po której stronie
editor-run-select = Zaznacz te akapity
editor-run-to-text = Zamień w tekst
editor-run-to-text-hint = Akapity tego rodzaju stają się tekstem; ich wiersze i cała reszta zostają, jak są
editor-run-begin = Zacznij tu nowy ciąg
editor-run-begin-hint = Akapit, w którym jest kursor, zaczyna własną klamrę, choć poprzedni jest tego samego rodzaju
editor-run-join = Połącz z poprzednim ciągiem
editor-run-join-hint = Te akapity znów tworzą jedno z poprzedzającymi je akapitami tego samego rodzaju
editor-kinds-text = Tekst
editor-kinds-quotation = Cytat
editor-kinds-verse = Wiersz
editor-kinds-script = Scenariusz
editor-kinds-list = Lista
editor-kinds-more = Więcej
editor-kinds-words = Słowa
editor-attribution = Autor cytatu
editor-attribution-hint = Czyje słowa przytacza cytat
editor-epigraph = Motto
editor-epigraph-hint = Cytat na początku części
editor-headword = Hasło
editor-headword-hint = Słowo, które objaśnia słowniczek
editor-gloss = Objaśnienie
editor-gloss-hint = Co znaczy hasło
editor-code = Kod
editor-code-hint = Wiersz kodu lub czegokolwiek zachowanego litera w literę
editor-break = Przerywnik
editor-break-hint = Pauza między częściami, ze znakiem, jaki daje jej układ
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
editor-scene = Nagłówek sceny
editor-scene-hint = Gdzie i kiedy toczy się scena: WN. DOM – NOC
editor-action = Akcja
editor-action-hint = Co widać i co się dzieje
editor-character = Postać
editor-character-hint = Kto wypowiada dialog, który następuje
editor-dialogue = Dialog
editor-dialogue-hint = Co jest mówione
editor-parenthetical = Uwaga w nawiasie
editor-parenthetical-hint = Jak kwestia jest wypowiadana
editor-transition = Przejście
editor-transition-hint = Jak jedna scena ustępuje następnej: CIĘCIE:
editor-comment = Komentarz
editor-parallel = Dwa teksty obok siebie
editor-page-break = Podział strony
editor-column-break = Podział kolumny
editor-paragraph-kind = Rodzaj akapitu
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = Rodzaj akapitu: { $kind }

## The kind menu: the kinds written with those where the cursor is, the kinds at hand,
## the whole catalogue under "More…", and the layout that sets them at its foot.
## The words menu, with the kinds of words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = Więcej…
editor-kinds-mixed = Różne
editor-kinds-own = Własne
editor-kinds-make = Utwórz rodzaj…
editor-kinds-change-own = Zmień własny rodzaj…
# Over the item that opens the look of the document at the kind the cursor is in.
editor-kinds-set-by = Składane tak, jak ma je „{ $format }”
editor-kinds-change-look = Jak wygląda „{ $kind }”…
editor-kinds-change-look-hint = Jego wygląd w tym dokumencie i reszta strony
editor-words-make = Utwórz rodzaj słów…
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-text = Język tekstu
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = Zwykłe słowa
# The language of a passage, from a word to many paragraphs: it has no look of its own.
editor-language = Język
editor-language-of-text = Własny język tekstu
editor-language-other = Inny język…
editor-language-other-title = Język fragmentu
editor-language-tag = Kod języka
editor-language-no-tag = To nie jest kod języka: kod wygląda jak „grc”, „la” albo „de-CH”.
editor-language-unnamed = Język, dla którego system nie ma nazwy: kod zostaje zachowany tak, jak go zapisano.
editor-language-suggested = Języki często cytowane
editor-language-other-hint = Fragment jest sprawdzany słownikiem swojego języka, jeśli go zaimportowano, a jeśli nie, zostaje bez sprawdzania; tworzony dokument podaje ten język dla Worda, OpenDocument, Typst i LaTeX-a.
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

editor-cite-here = Cytuj dzieło tutaj
editor-note = Przypis
editor-note-selection = Zrób z zaznaczenia przypis
editor-insert = Wstaw
editor-spelling-on = Pisownia jest sprawdzana w trakcie pisania · naciśnij, by przestać
editor-spelling-off = Pisownia nie jest sprawdzana · naciśnij, by ją sprawdzać
editor-equation = Równanie
editor-table = Tabela…
editor-table-file = Tabela z pliku…
editor-formula = Wzór
editor-pointer = Odsyłacz…
editor-refmark-title = Znacznik miejsca
editor-refmark-label = Etykieta
editor-refmark-placeholder = 3:16, 327a, 1094a1
editor-refmark-dialog-hint = Znacznik nie jest częścią słów: sprawdzanie pisowni, wyszukiwanie i liczenie słów go pomijają. Układ decyduje, czy jest podniesiony w wierszu, czy postawiony na marginesie.
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = obraz

## More.

editor-found = Niepowiązane cytowania…
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
editor-note-place-format = Tam, gdzie układ ma przypisy
editor-note-place-foot = U dołu strony
editor-note-place-end = Na końcu tekstu
editor-note-placeholder = Tekst przypisu
