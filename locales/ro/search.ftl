# Searching: in the text of a map, in the edit box of an element, and
# through everything. See locales/README.md and docs/adr/0017.

## The bar over a text

search-find = Caută
search-replace-with = Înlocuiește cu
search-replace = Înlocuiește
search-replace-all = Înlocuiește tot
search-previous = Cea dinainte
search-next = Următoarea
search-close = Închide căutarea
search-show-replace = Și înlocuiește
search-hide-replace = Numai caută
# Which of those found is shown: "3 of 17".
search-count = { $current } din { $count }
search-found = { $count ->
    [one] Una găsită
    [few] { $count } găsite
   *[other] { $count } găsite
}
search-nothing = Nu s-a găsit nimic
search-invalid = Nu este o expresie regulată
search-replaced = { $count ->
    [0] Nimic înlocuit
    [one] Una înlocuită
    [few] { $count } înlocuite
   *[other] { $count } înlocuite
}

## The options

search-case = Majusculele așa cum sunt scrise
search-whole-words = Numai cuvinte întregi
search-accents = Literele cu și fără diacritice deopotrivă
search-accents-sign = ș=s
search-regex = O expresie regulată
search-selection = Numai în textul selectat
search-selection-none = Selectați întâi un text, ca să căutați numai în el
search-labels = Și citările, formulele și trimiterile
search-labels-outside = Și ce stă în afara textelor

## The search through everything

search-everything = Caută
search-everything-title = Caută peste tot
search-everything-field = Caută în proiecte
search-last-project = Ultimul proiect
search-all-projects = Toate proiectele
search-reading = Se citește { $name }…
search-no-projects = Nu sunt proiecte în care să se caute.
search-more = { $count ->
    [one] și încă una
    [few] și încă { $count }
   *[other] și încă { $count }
}
search-in-project = { $count ->
    [one] Una în acest proiect
    [few] { $count } în acest proiect
   *[other] { $count } în acest proiect
}
search-everything-found = { $count ->
    [one] Una găsită
    [few] { $count } găsite
   *[other] { $count } găsite
} { $projects ->
    [one] într-un proiect
    [few] în { $projects } proiecte
   *[other] în { $projects } de proiecte
}
search-where-details = Datele documentului
# An association that has a name, with the elements at its ends: "Part 1 ↔ Part 2".
search-where-association = Asocierea { $ends }
search-where-note = Ce credeți despre { $work }
# Said before what was found in a note.
search-in-note = notă
search-untitled = Fără titlu
search-could-not-read = { $name } nu s-a putut citi.
