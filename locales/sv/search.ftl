# Searching: in the text of a map, in the edit box of an element, and
# through everything. See locales/README.md and docs/adr/0017.

## The bar over a text

search-find = Sök
search-replace-with = Ersätt med
search-replace = Ersätt
search-replace-all = Ersätt alla
search-previous = Den förra
search-next = Nästa
search-close = Stäng sökningen
search-show-replace = Ersätt också
search-hide-replace = Bara sök
# Which of those found is shown: "3 of 17".
search-count = { $current } av { $count }
search-found = { $count ->
    [one] En träff
   *[other] { $count } träffar
}
search-nothing = Inga träffar
search-invalid = Inte ett reguljärt uttryck
search-replaced = { $count ->
    [0] Inget ersatt
    [one] En ersatt
   *[other] { $count } ersatta
}

## The options

search-case = Stora bokstäver som de är skrivna
search-whole-words = Bara hela ord
search-accents = Bokstäver med och utan accent lika
search-accents-sign = é=e
search-regex = Ett reguljärt uttryck
search-selection = Bara i den markerade texten
search-selection-none = Markera text först, för att söka bara i den
search-labels = Källhänvisningar, formler och korshänvisningar också
search-labels-outside = Det som står utanför texterna också

## The search through everything

search-everything = Sök
search-everything-title = Sök genom allt
search-everything-field = Sök i projekten
search-last-project = Det senaste projektet
search-all-projects = Alla projekt
search-reading = Läser { $name }…
search-no-projects = Det finns inga projekt att söka i.
search-more = { $count ->
    [one] och en till
   *[other] och { $count } till
}
search-in-project = { $count ->
    [one] En i det här projektet
   *[other] { $count } i det här projektet
}
search-everything-found = { $count ->
    [one] En träff
   *[other] { $count } träffar
} { $projects ->
    [one] i ett projekt
   *[other] i { $projects } projekt
}
search-where-details = Dokumentets uppgifter
# An association that has a name, with the elements at its ends: "Part 1 ↔ Part 2".
search-where-association = Associationen { $ends }
search-where-note = Vad du tycker om { $work }
# Said before what was found in a note.
search-in-note = not
search-untitled = Utan titel
search-could-not-read = { $name } kunde inte läsas.
