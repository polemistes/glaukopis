# Searching: in the text of a map, in the edit box of an element, and
# through everything. See locales/README.md and docs/adr/0017.

## The bar over a text

search-find = Znajdź
search-replace-with = Zamień na
search-replace = Zamień
search-replace-all = Zamień wszystko
search-previous = Poprzednie
search-next = Następne
search-close = Zamknij wyszukiwanie
search-show-replace = Także zamień
search-hide-replace = Tylko znajdź
# Which of those found is shown: "3 of 17".
search-count = { $current } z { $count }
search-found = { $count ->
    [one] Znaleziono jedno
    [few] Znaleziono { $count }
    [many] Znaleziono { $count }
   *[other] Znaleziono { $count }
}
search-nothing = Nic nie znaleziono
search-invalid = To nie jest wyrażenie regularne
search-replaced = { $count ->
    [0] Nic nie zamieniono
    [one] Zamieniono jedno
    [few] Zamieniono { $count }
    [many] Zamieniono { $count }
   *[other] Zamieniono { $count }
}

## The options

search-case = Wielkie litery tak, jak napisano
search-whole-words = Tylko całe słowa
search-accents = Litery ze znakami diakrytycznymi i bez nich jednakowo
search-accents-sign = ą=a
search-regex = Wyrażenie regularne
search-selection = Tylko w zaznaczonym tekście
search-selection-none = Najpierw zaznacz tekst, by szukać tylko w nim
search-labels = Także cytowania, wzory i odsyłacze
search-labels-outside = Także to, co stoi poza tekstami

## The search through everything

search-everything = Szukaj
search-everything-title = Szukaj we wszystkim
search-everything-field = Szukaj w projektach
search-last-project = Ostatni projekt
search-all-projects = Wszystkie projekty
search-reading = Czytanie { $name }…
search-no-projects = Nie ma projektów, w których można by szukać.
search-more = { $count ->
    [one] i jeszcze jedno
    [few] i jeszcze { $count }
    [many] i jeszcze { $count }
   *[other] i jeszcze { $count }
}
search-in-project = { $count ->
    [one] Jedno w tym projekcie
    [few] { $count } w tym projekcie
    [many] { $count } w tym projekcie
   *[other] { $count } w tym projekcie
}
search-everything-found = { $count ->
    [one] Znaleziono jedno
    [few] Znaleziono { $count }
    [many] Znaleziono { $count }
   *[other] Znaleziono { $count }
} { $projects ->
    [one] w jednym projekcie
    [few] w { $projects } projektach
    [many] w { $projects } projektach
   *[other] w { $projects } projektach
}
search-where-details = Dane dokumentu
# An association that has a name, with the elements at its ends: "Part 1 ↔ Part 2".
search-where-association = Powiązanie { $ends }
search-where-note = Twoje notatki o { $work }
# Said before what was found in a note.
search-in-note = przypis
search-untitled = Bez tytułu
search-could-not-read = Nie udało się odczytać { $name }.
