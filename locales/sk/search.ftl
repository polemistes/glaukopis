# Searching: in the text of a map, in the edit box of an element, and
# through everything. See locales/README.md and docs/adr/0017.

## The bar over a text

search-find = Hľadať
search-replace-with = Nahradiť čím
search-replace = Nahradiť
search-replace-all = Nahradiť všetko
search-previous = Predchádzajúci
search-next = Ďalší
search-close = Zavrieť hľadanie
search-show-replace = Aj nahradiť
search-hide-replace = Len hľadať
# Which of those found is shown: "3 of 17".
search-count = { $current } z { $count }
search-found = { $count ->
    [one] Nájdený jeden
    [few] Nájdené { $count }
   *[other] Nájdených { $count }
}
search-nothing = Nič sa nenašlo
search-invalid = Nie je to regulárny výraz
search-replaced = { $count ->
    [0] Nič nenahradené
    [one] Nahradený jeden
    [few] Nahradené { $count }
   *[other] Nahradených { $count }
}

## The options

search-case = Veľké písmená, ako sú napísané
search-whole-words = Len celé slová
search-accents = Písmená s diakritikou aj bez nej rovnako
search-accents-sign = é=e
search-regex = Regulárny výraz
search-selection = Len vo vybranom texte
search-selection-none = Najprv vyberte text, ak chcete hľadať len v ňom
search-labels = Aj citácie, vzorce a odkazy
search-labels-outside = Aj to, čo stojí mimo textov

## The search through everything

search-everything = Hľadať
search-everything-title = Hľadať vo všetkom
search-everything-field = Hľadať v projektoch
search-last-project = Posledný projekt
search-all-projects = Všetky projekty
search-reading = Číta sa { $name }…
search-no-projects = Nie sú žiadne projekty, v ktorých by sa dalo hľadať.
search-more = { $count ->
    [one] a ešte jeden
    [few] a ešte { $count }
   *[other] a ešte { $count }
}
search-in-project = { $count ->
    [one] Jeden v tomto projekte
    [few] { $count } v tomto projekte
   *[other] { $count } v tomto projekte
}
search-everything-found = { $count ->
    [one] Nájdený jeden
    [few] Nájdené { $count }
   *[other] Nájdených { $count }
} { $projects ->
    [one] v jednom projekte
    [few] v { $projects } projektoch
   *[other] v { $projects } projektoch
}
search-where-details = Údaje dokumentu
# An association that has a name, with the elements at its ends: "Part 1 ↔ Part 2".
search-where-association = Spojenie { $ends }
search-where-note = Čo si myslíte o { $work }
# Said before what was found in a note.
search-in-note = poznámka
search-untitled = Bez názvu
search-could-not-read = { $name } sa nepodarilo prečítať.
