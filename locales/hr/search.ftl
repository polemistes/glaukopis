# Searching: in the text of a map, in the edit box of an element, and
# through everything. See locales/README.md and docs/adr/0017.

## The bar over a text

search-find = Traži
search-replace-with = Zamijeni s
search-replace = Zamijeni
search-replace-all = Zamijeni sve
search-previous = Prethodno
search-next = Sljedeće
search-close = Zatvori pretragu
search-show-replace = I zamijeni
search-hide-replace = Samo traži
# Which of those found is shown: "3 of 17".
search-count = { $current } od { $count }
search-found = { $count ->
    [1] Jedan pogodak
    [one] { $count } pogodak
    [few] { $count } pogotka
   *[other] { $count } pogodaka
}
search-nothing = Ništa nije pronađeno
search-invalid = Nije regularni izraz
search-replaced = { $count ->
    [0] Ništa nije zamijenjeno
    [1] Jedno zamijenjeno
    [one] { $count } zamijenjeno
    [few] { $count } zamijenjena
   *[other] { $count } zamijenjeno
}

## The options

search-case = Velika i mala slova kako su napisana
search-whole-words = Samo cijele riječi
search-accents = Slova s naglaskom i bez njega jednako
search-accents-sign = é=e
search-regex = Regularni izraz
search-selection = Samo u odabranom tekstu
search-selection-none = Najprije odaberite tekst, da se traži samo u njemu
search-labels = I citati, formule i uputnice
search-labels-outside = I ono što stoji izvan tekstova

## The search through everything

search-everything = Traži
search-everything-title = Pretraži sve
search-everything-field = Pretraži projekte
search-last-project = Zadnji projekt
search-all-projects = Svi projekti
search-reading = Čitanje { $name }…
search-no-projects = Nema projekata za pretraživanje.
search-more = { $count ->
    [1] i još jedan
    [one] i još { $count }
    [few] i još { $count }
   *[other] i još { $count }
}
search-in-project = { $count ->
    [1] Jedan u ovom projektu
    [one] { $count } u ovom projektu
    [few] { $count } u ovom projektu
   *[other] { $count } u ovom projektu
}
search-everything-found = { $count ->
    [1] Jedan pogodak
    [one] { $count } pogodak
    [few] { $count } pogotka
   *[other] { $count } pogodaka
} { $projects ->
    [1] u jednom projektu
    [one] u { $projects } projektu
    [few] u { $projects } projekta
   *[other] u { $projects } projekata
}
search-where-details = Podaci o dokumentu
# An association that has a name, with the elements at its ends: "Part 1 ↔ Part 2".
search-where-association = Veza { $ends }
search-where-note = Što mislite o { $work }
# Said before what was found in a note.
search-in-note = bilješka
search-untitled = Bez naslova
search-could-not-read = { $name } nije bilo moguće pročitati.
