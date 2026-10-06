# Citations that were found in a text written elsewhere, and the panel at
# the side in which they are gone through (ADR 0015), in English. See
# locales/README.md.

## The panel.

found-title = Znalezione cytowania
# On the tab of the panel, beside the other tabs: short.
found-tab = Znalezione
found-between = Między mapą a znalezionymi cytowaniami
found-taken = Co brać za cytowania
found-taken-always = To, co zrobił program, oraz znaczniki
found-taken-years = Nawiasy z rokiem w środku
found-taken-named = Przypisy, które wymieniają dzieło z biblioteki
found-taken-notes = Każdy przypis
found-asking = Pytanie biblioteki…
found-make-certain = { $count ->
    [one] Zrób cytowanie z tego jednego, które jest pewne
    [few] Zrób cytowania z { $count } pewnych
    [many] Zrób cytowania z { $count } pewnych
   *[other] Zrób cytowania z { $count } pewnych
}
found-made = { $count ->
    [one] Zrobiono jedno cytowanie
    [few] Zrobiono { $count } cytowania
    [many] Zrobiono { $count } cytowań
   *[other] Zrobiono { $count } cytowań
}
found-made-undo = Ctrl+Z cofa je, jako jeden krok.
found-library-failed = Nie udało się zapytać biblioteki.
found-nothing = Nie ma czego przeglądać
found-nothing-looked = W tej mapie nie zostało żadne znalezione cytowanie i nic w niej nie wygląda jak cytowanie.
found-nothing-looked-more = W tej mapie nie zostało żadne znalezione cytowanie i nic w niej nie wygląda jak cytowanie. Powyżej można brać za cytowania więcej.
found-nothing-not-looked = W tej mapie nie zostało żadne znalezione cytowanie. Tekstu, który tylko wygląda jak cytowanie, szuka się, gdy powyżej powiesz, co za nie brać: nawiasy z rokiem w środku albo przypisy.
found-list-label = Co jest do przejrzenia
found-untitled = Bez tytułu
found-in-a-note = W przypisie
# The element of the map a citation stands in.
found-in = W „{ $element }”
found-in-note-of = W przypisie do „{ $element }”
# Set small and high after the words a note stands after.
found-note-mark = przypis
found-position = { $index } z { $count }
found-previous = Poprzednie
found-next = Następne
found-list-show = Pokaż listę
found-list-hide = Ukryj listę
found-later = Później
found-leave = Zostaw jako tekst
found-make = Zrób z tego cytowanie

## How sure the library is of what it proposes.

found-sure-certain = Biblioteka ma je na pewno
found-sure-likely = Biblioteka ma to, co prawdopodobnie jest nim
found-sure-possible = Biblioteka ma to, co może być nim
found-sure-none = Któreś z jego dzieł nie ma jeszcze pozycji

## By what a citation was found.

found-by-zotero = Zrobione przez Zotero
found-by-mendeley = Zrobione przez Mendeley lub program, który pisze tak jak ono
found-by-key = Znacznik, który nazywa pozycję
found-by-form = Wzięte za cytowanie po wyglądzie

## The citation that is to be made.

found-the-citation = Cytowanie
found-no-works = Nie wymienia żadnego dzieła. Dodaj jakieś albo zostaw je jako tekst, którym jest.
found-add-work = Dodaj dzieło
found-author-in-text = Autor w tekście: Nagy (1979)
found-pick-work = Cytowane dzieło: autor, tytuł, rok
found-pick-add = Dodaj dzieło do cytowania
found-too-little = Plik mówi o tym dziele za mało, by zrobić z tego pozycję
found-reference-failed = Nie udało się zrobić pozycji

## A citation that stands in a note.

found-in-note = Stoi w przypisie
found-note-becomes = Przypis staje się cytowaniem
# What the note says besides its works, which becomes the words before them, after them, or both.
found-note-around = To, co przypis mówi poza swoimi dziełami, trafia przed nie i po nich{ $has ->
        [before] : „{ $before }” przed
        [after] : „{ $after }” po
       *[both] : „{ $before }” przed, „{ $after }” po
    }. Styl cytowania składa je w wierszu albo w przypisie.
found-note-style = Styl cytowania składa je w wierszu albo w przypisie.
found-citation-in-note = Cytowanie stoi w przypisie
    .hint = Przypis pozostaje przypisem, z tym, co jeszcze mówi.
found-for-all = Tak samo dla wszystkich kolejnych
found-note-not = Nie stoi w przypisie.
# What else the note holds, by the name of what it is in the text.
found-note-holds = Przypis zawiera { $what ->
        [math] wzór
        [crossref] odsyłacz
        [citation] cytowanie
        [hard_break] drugi wiersz
       *[other] coś, co nie jest tekstem
    }, czego słowa przed dziełem i po nim nie mogą pomieścić.
found-note-another = Przypis zawiera inne znalezione cytowanie, które przepadłoby w słowach po tym.

## Why what was asked could not be done.

found-trouble-gone = Nie ma go już w tekście.
found-trouble-changed = Tekst zmienił się tu od chwili, gdy to zaproponowano, i został przejrzany na nowo.
found-trouble-cannot = Nie da się tu zrobić z tego cytowania.

## One work of a citation, as the text says it is.

# Those who made it: “Nagy and Lord”, “Nagy et al.”
found-people-two = { $first } i { $second }
found-people-more = { $first } i in.
found-work-a-work = Dzieło
found-work-looking = { $work }: szukanie w twojej bibliotece…
found-work-no-tag = { $work } to znacznik, którego nie ma żadna pozycja twojej biblioteki.
found-work-not-found = { $work }: nie znaleziono w twojej bibliotece.
found-work-chosen = Wybrane przez ciebie
# The writer chose this reference for another citation of the same work, and this one followed.
found-work-followed = Jak wybrano dla tego samego dzieła
found-work-certain = Pewne
found-work-likely = Prawdopodobne
found-work-possible = Możliwe
# What the text says the work is.
found-work-for = dla „{ $work }”
found-work-others = Inne pozycje, którymi może być
found-work-or = Albo
found-work-may-be = Może to być
found-work-another = Inna…
found-work-find = Znajdź…
found-work-add = Dodaj do biblioteki
