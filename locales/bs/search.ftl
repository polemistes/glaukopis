# Searching: in the text of a map, in the edit box of an element, and
# through everything. See locales/README.md and docs/adr/0017.

## The bar over a text

search-find = Pronađi
search-replace-with = Zamijeni sa
search-replace = Zamijeni
search-replace-all = Zamijeni sve
search-previous = Prethodno
search-next = Sljedeće
search-close = Zatvori pretragu
search-show-replace = I zamijeni
search-hide-replace = Samo pronađi
# Which of those found is shown: "3 of 17".
search-count = { $current } od { $count }
search-found = { $count ->
    [one] Jedno pronađeno
    [few] { $count } pronađena
   *[other] { $count } pronađeno
}
search-nothing = Ništa nije pronađeno
search-invalid = Nije regularni izraz
search-replaced = { $count ->
    [0] Ništa nije zamijenjeno
    [one] Jedno zamijenjeno
    [few] { $count } zamijenjena
   *[other] { $count } zamijenjeno
}

## The options

search-case = Velika slova kako su napisana
search-whole-words = Samo cijele riječi
search-accents = Slova s dijakritikama i bez njih jednako
search-accents-sign = é=e
search-regex = Regularni izraz
search-selection = Samo u odabranom tekstu
search-selection-none = Prvo odaberite tekst, da se pretražuje samo u njemu
search-labels = I citati, formule i uputnice
search-labels-outside = I ono što stoji izvan tekstova

## The search through everything

search-everything = Pretraži
search-everything-title = Pretraži sve
search-everything-field = Pretraži projekte
search-last-project = Posljednji projekat
search-all-projects = Svi projekti
search-reading = Čitanje { $name }…
search-no-projects = Nema projekata za pretragu.
search-more = { $count ->
    [one] i još jedno
    [few] i još { $count }
   *[other] i još { $count }
}
search-in-project = { $count ->
    [one] Jedno u ovom projektu
    [few] { $count } u ovom projektu
   *[other] { $count } u ovom projektu
}
search-everything-found = { $count ->
    [one] Jedno pronađeno
    [few] { $count } pronađena
   *[other] { $count } pronađeno
} { $projects ->
    [one] u jednom projektu
    [few] u { $projects } projekta
   *[other] u { $projects } projekata
}
search-where-details = Podaci dokumenta
# An association that has a name, with the elements at its ends: "Part 1 ↔ Part 2".
search-where-association = Veza { $ends }
search-where-note = Šta mislite o { $work }
# Said before what was found in a note.
search-in-note = bilješka
search-untitled = Bez naslova
search-could-not-read = { $name } nije bilo moguće pročitati.
