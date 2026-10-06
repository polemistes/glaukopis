# Searching: in the text of a map, in the edit box of an element, and
# through everything. See locales/README.md and docs/adr/0017.

## The bar over a text

search-find = Najít
search-replace-with = Nahradit čím
search-replace = Nahradit
search-replace-all = Nahradit vše
search-previous = Předchozí
search-next = Další
search-close = Zavřít hledání
search-show-replace = I nahradit
search-hide-replace = Jen hledat
# Which of those found is shown: "3 of 17".
search-count = { $current } z { $count }
search-found = { $count ->
    [one] Nalezen jeden
    [few] Nalezeny { $count }
   *[other] Nalezeno { $count }
}
search-nothing = Nic nenalezeno
search-invalid = Není to regulární výraz
search-replaced = { $count ->
    [0] Nic nenahrazeno
    [one] Nahrazen jeden
    [few] Nahrazeny { $count }
   *[other] Nahrazeno { $count }
}

## The options

search-case = Velká písmena, jak jsou psána
search-whole-words = Jen celá slova
search-accents = Písmena s diakritikou i bez ní stejně
search-accents-sign = é=e
search-regex = Regulární výraz
search-selection = Jen ve vybraném textu
search-selection-none = Nejprve vyberte text, chcete-li hledat jen v něm
search-labels = I citace, vzorce a křížové odkazy
search-labels-outside = I to, co stojí mimo texty

## The search through everything

search-everything = Hledat
search-everything-title = Hledat ve všem
search-everything-field = Hledat v projektech
search-last-project = Poslední projekt
search-all-projects = Všechny projekty
search-reading = Čte se { $name }…
search-no-projects = Nejsou žádné projekty, v nichž by se dalo hledat.
search-more = { $count ->
    [one] a jeden další
    [few] a { $count } další
   *[other] a { $count } dalších
}
search-in-project = { $count ->
    [one] Jeden v tomto projektu
    [few] { $count } v tomto projektu
   *[other] { $count } v tomto projektu
}
search-everything-found = { $count ->
    [one] Nalezen jeden
    [few] Nalezeny { $count }
   *[other] Nalezeno { $count }
} { $projects ->
    [one] v jednom projektu
    [few] ve { $projects } projektech
   *[other] v { $projects } projektech
}
search-where-details = Údaje dokumentu
# An association that has a name, with the elements at its ends: "Part 1 ↔ Part 2".
search-where-association = Spojení { $ends }
search-where-note = Co si myslíte o { $work }
# Said before what was found in a note.
search-in-note = poznámka
search-untitled = Bez názvu
search-could-not-read = { $name } nelze přečíst.
