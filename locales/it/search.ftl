# Searching: in the text of a map, in the edit box of an element, and
# through everything. See locales/README.md and docs/adr/0017.

## The bar over a text

search-find = Trova
search-replace-with = Sostituisci con
search-replace = Sostituisci
search-replace-all = Sostituisci tutto
search-previous = Il precedente
search-next = Il successivo
search-close = Chiudi la ricerca
search-show-replace = Anche sostituisci
search-hide-replace = Solo trova
# Which of those found is shown: "3 of 17".
search-count = { $current } di { $count }
search-found = { $count ->
    [one] Uno trovato
    [many] { $count } trovati
   *[other] { $count } trovati
}
search-nothing = Nulla di trovato
search-invalid = Non è un'espressione regolare
search-replaced = { $count ->
    [0] Nulla sostituito
    [one] Uno sostituito
    [many] { $count } sostituiti
   *[other] { $count } sostituiti
}

## The options

search-case = Maiuscole come sono scritte
search-whole-words = Solo parole intere
search-accents = Lettere con e senza accento uguali
search-accents-sign = é=e
search-regex = Un'espressione regolare
search-selection = Solo nel testo selezionato
search-selection-none = Seleziona prima del testo, per cercare solo lì
search-labels = Anche citazioni, formule e rimandi
search-labels-outside = Anche ciò che sta fuori dai testi

## The search through everything

search-everything = Cerca
search-everything-title = Cerca in tutto
search-everything-field = Cerca nei progetti
search-last-project = L'ultimo progetto
search-all-projects = Tutti i progetti
search-reading = Lettura di { $name }…
search-no-projects = Non ci sono progetti in cui cercare.
search-more = { $count ->
    [one] e un altro
    [many] e altri { $count }
   *[other] e altri { $count }
}
search-in-project = { $count ->
    [one] Uno in questo progetto
    [many] { $count } in questo progetto
   *[other] { $count } in questo progetto
}
search-everything-found = { $count ->
    [one] Uno trovato
    [many] { $count } trovati
   *[other] { $count } trovati
} { $projects ->
    [one] in un progetto
    [many] in { $projects } progetti
   *[other] in { $projects } progetti
}
search-where-details = I dati del documento
# An association that has a name, with the elements at its ends: "Part 1 ↔ Part 2".
search-where-association = L'associazione { $ends }
search-where-note = Che cosa pensi di { $work }
# Said before what was found in a note.
search-in-note = nota
search-untitled = Senza titolo
search-could-not-read = { $name } non si è potuto leggere.
