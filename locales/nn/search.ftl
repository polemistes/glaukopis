# Searching: in the text of a map, in the edit box of an element, and
# through everything. See locales/README.md and docs/adr/0017.

## The bar over a text

search-find = Søk
search-replace-with = Byt ut med
search-replace = Byt ut
search-replace-all = Byt ut alle
search-previous = Førre
search-next = Neste
search-close = Lukk søket
search-show-replace = Byt ut òg
search-hide-replace = Berre søk
# Which of those found is shown: "3 of 17".
search-count = { $current } av { $count }
search-found = { $count ->
    [one] Eitt treff
   *[other] { $count } treff
}
search-nothing = Ingen treff
search-invalid = Ikkje eit regulært uttrykk
search-replaced = { $count ->
    [0] Ingenting bytt ut
    [one] Eitt bytt ut
   *[other] { $count } bytte ut
}

## The options

search-case = Store og små bokstavar slik dei er skrivne
search-whole-words = Berre heile ord
search-accents = Bokstavar med og utan aksentar blir rekna like
search-accents-sign = é=e
search-regex = Eit regulært uttrykk
search-selection = Berre i den merkte teksten
search-selection-none = Merk tekst først for å søkje berre i den
search-labels = Òg kjeldetilvisingar, formlar og kryssreferansar
search-labels-outside = Òg det som står utanfor tekstane

## The search through everything

search-everything = Søk
search-everything-title = Søk gjennom alt
search-everything-field = Søk i prosjekta
search-last-project = Det siste prosjektet
search-all-projects = Alle prosjekt
search-reading = Les { $name } …
search-no-projects = Det er ingen prosjekt å søkje i.
search-more = { $count ->
    [one] og eitt til
   *[other] og { $count } til
}
search-in-project = { $count ->
    [one] Eitt i dette prosjektet
   *[other] { $count } i dette prosjektet
}
search-everything-found = { $count ->
    [one] Eitt treff
   *[other] { $count } treff
} { $projects ->
    [one] i eitt prosjekt
   *[other] i { $projects } prosjekt
}
search-where-details = Opplysningane om dokumentet
# An association that has a name, with the elements at its ends: "Part 1 ↔ Part 2".
search-where-association = Assosiasjonen { $ends }
search-where-note = Det du tenkjer om { $work }
# Said before what was found in a note.
search-in-note = note
search-untitled = Utan namn
search-could-not-read = { $name } kunne ikkje lesast.
