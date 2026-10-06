# Searching: in the text of a map, in the edit box of an element, and
# through everything. See locales/README.md and docs/adr/0017.

## The bar over a text

search-find = Suchen
search-replace-with = Ersetzen durch
search-replace = Ersetzen
search-replace-all = Alle ersetzen
search-previous = Der vorige
search-next = Der nächste
search-close = Suche schließen
search-show-replace = Auch ersetzen
search-hide-replace = Nur suchen
# Which of those found is shown: "3 of 17".
search-count = { $current } von { $count }
search-found = { $count ->
    [one] Ein Treffer
   *[other] { $count } Treffer
}
search-nothing = Nichts gefunden
search-invalid = Kein regulärer Ausdruck
search-replaced = { $count ->
    [0] Nichts ersetzt
    [one] Eines ersetzt
   *[other] { $count } ersetzt
}

## The options

search-case = Groß- und Kleinschreibung beachten
search-whole-words = Nur ganze Wörter
search-accents = Buchstaben mit und ohne Akzent gleich
search-accents-sign = é=e
search-regex = Ein regulärer Ausdruck
search-selection = Nur im ausgewählten Text
search-selection-none = Wählen Sie zuerst Text aus, um nur darin zu suchen
search-labels = Auch Zitationen, Formeln und Verweise
search-labels-outside = Auch, was außerhalb der Texte steht

## The search through everything

search-everything = Suchen
search-everything-title = Alles durchsuchen
search-everything-field = Die Projekte durchsuchen
search-last-project = Das letzte Projekt
search-all-projects = Alle Projekte
search-reading = { $name } wird gelesen…
search-no-projects = Es gibt keine Projekte zu durchsuchen.
search-more = { $count ->
    [one] und ein weiterer
   *[other] und { $count } weitere
}
search-in-project = { $count ->
    [one] Einer in diesem Projekt
   *[other] { $count } in diesem Projekt
}
search-everything-found = { $count ->
    [one] Ein Treffer
   *[other] { $count } Treffer
} { $projects ->
    [one] in einem Projekt
   *[other] in { $projects } Projekten
}
search-where-details = Die Angaben des Dokuments
# An association that has a name, with the elements at its ends: "Part 1 ↔ Part 2".
search-where-association = Die Verbindung { $ends }
search-where-note = Was Sie von { $work } halten
# Said before what was found in a note.
search-in-note = Anmerkung
search-untitled = Ohne Titel
search-could-not-read = { $name } konnte nicht gelesen werden.
