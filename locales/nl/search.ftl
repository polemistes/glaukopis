# Searching: in the text of a map, in the edit box of an element, and
# through everything. See locales/README.md and docs/adr/0017.

## The bar over a text

search-find = Zoeken
search-replace-with = Vervangen door
search-replace = Vervangen
search-replace-all = Alles vervangen
search-previous = De vorige
search-next = De volgende
search-close = Het zoeken sluiten
search-show-replace = Ook vervangen
search-hide-replace = Alleen zoeken
# Which of those found is shown: "3 of 17".
search-count = { $current } van { $count }
search-found = { $count ->
    [one] Eén gevonden
   *[other] { $count } gevonden
}
search-nothing = Niets gevonden
search-invalid = Geen reguliere expressie
search-replaced = { $count ->
    [0] Niets vervangen
    [one] Eén vervangen
   *[other] { $count } vervangen
}

## The options

search-case = Hoofdletters zoals geschreven
search-whole-words = Alleen hele woorden
search-accents = Letters met en zonder accent gelijk
search-accents-sign = é=e
search-regex = Een reguliere expressie
search-selection = Alleen in de geselecteerde tekst
search-selection-none = Selecteer eerst tekst, om alleen daarin te zoeken
search-labels = Ook verwijzingen, formules en kruisverwijzingen
search-labels-outside = Ook wat buiten de teksten staat

## The search through everything

search-everything = Zoeken
search-everything-title = Overal zoeken
search-everything-field = In de projecten zoeken
search-last-project = Het laatste project
search-all-projects = Alle projecten
search-reading = { $name } wordt gelezen…
search-no-projects = Er zijn geen projecten om in te zoeken.
search-more = { $count ->
    [one] en nog één
   *[other] en nog { $count }
}
search-in-project = { $count ->
    [one] Eén in dit project
   *[other] { $count } in dit project
}
search-everything-found = { $count ->
    [one] Eén gevonden
   *[other] { $count } gevonden
} { $projects ->
    [one] in één project
   *[other] in { $projects } projecten
}
search-where-details = De gegevens van het document
# An association that has a name, with the elements at its ends: "Part 1 ↔ Part 2".
search-where-association = De verbinding { $ends }
search-where-note = Wat je vindt van { $work }
# Said before what was found in a note.
search-in-note = noot
search-untitled = Zonder titel
search-could-not-read = { $name } kon niet worden gelezen.
