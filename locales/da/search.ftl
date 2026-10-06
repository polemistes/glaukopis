# Searching: in the text of a map, in the edit box of an element, and
# through everything. See locales/README.md and docs/adr/0017.

## The bar over a text

search-find = Find
search-replace-with = Erstat med
search-replace = Erstat
search-replace-all = Erstat alle
search-previous = Den forrige
search-next = Den næste
search-close = Luk søgningen
search-show-replace = Erstat også
search-hide-replace = Kun find
# Which of those found is shown: "3 of 17".
search-count = { $current } af { $count }
search-found = { $count ->
    [one] Ét fundet
   *[other] { $count } fundet
}
search-nothing = Intet fundet
search-invalid = Ikke et regulært udtryk
search-replaced = { $count ->
    [0] Intet erstattet
    [one] Ét erstattet
   *[other] { $count } erstattet
}

## The options

search-case = Store og små bogstaver, som de er skrevet
search-whole-words = Kun hele ord
search-accents = Bogstaver med og uden accenter regnes ens
search-accents-sign = é=e
search-regex = Et regulært udtryk
search-selection = Kun i den markerede tekst
search-selection-none = Markér først tekst for kun at søge i den
search-labels = Også kildehenvisninger, formler og krydshenvisninger
search-labels-outside = Også det, der står uden for teksterne

## The search through everything

search-everything = Søg
search-everything-title = Søg gennem alt
search-everything-field = Søg i projekterne
search-last-project = Det seneste projekt
search-all-projects = Alle projekter
search-reading = Læser { $name }…
search-no-projects = Der er ingen projekter at søge i.
search-more = { $count ->
    [one] og ét til
   *[other] og { $count } til
}
search-in-project = { $count ->
    [one] Ét i dette projekt
   *[other] { $count } i dette projekt
}
search-everything-found = { $count ->
    [one] Ét fundet
   *[other] { $count } fundet
} { $projects ->
    [one] i ét projekt
   *[other] i { $projects } projekter
}
search-where-details = Dokumentets oplysninger
# An association that has a name, with the elements at its ends: "Part 1 ↔ Part 2".
search-where-association = Associationen { $ends }
search-where-note = Hvad du mener om { $work }
# Said before what was found in a note.
search-in-note = notat
search-untitled = Uden titel
search-could-not-read = { $name } kunne ikke læses.
