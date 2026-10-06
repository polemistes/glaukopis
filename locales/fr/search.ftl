# Searching: in the text of a map, in the edit box of an element, and
# through everything. See locales/README.md and docs/adr/0017.

## The bar over a text

search-find = Rechercher
search-replace-with = Remplacer par
search-replace = Remplacer
search-replace-all = Tout remplacer
search-previous = Le précédent
search-next = Le suivant
search-close = Fermer la recherche
search-show-replace = Remplacer aussi
search-hide-replace = Rechercher seulement
# Which of those found is shown: "3 of 17".
search-count = { $current } sur { $count }
search-found = { $count ->
    [one] { $count } trouvé
    [many] { $count } trouvés
   *[other] { $count } trouvés
}
search-nothing = Rien trouvé
search-invalid = Pas une expression régulière
search-replaced = { $count ->
    [0] Rien remplacé
    [one] Un remplacé
    [many] { $count } remplacés
   *[other] { $count } remplacés
}

## The options

search-case = Majuscules telles qu’écrites
search-whole-words = Mots entiers seulement
search-accents = Lettres avec et sans accents confondues
search-accents-sign = é=e
search-regex = Une expression régulière
search-selection = Seulement dans le texte sélectionné
search-selection-none = Sélectionnez d’abord du texte, pour ne chercher que là
search-labels = Citations, formules et renvois aussi
search-labels-outside = Ce qui se trouve hors des textes aussi

## The search through everything

search-everything = Rechercher
search-everything-title = Rechercher dans tout
search-everything-field = Rechercher dans les projets
search-last-project = Le dernier projet
search-all-projects = Tous les projets
search-reading = Lecture de { $name }…
search-no-projects = Il n’y a pas de projets où chercher.
search-more = { $count ->
    [one] et un de plus
    [many] et { $count } de plus
   *[other] et { $count } de plus
}
search-in-project = { $count ->
    [one] Un dans ce projet
    [many] { $count } dans ce projet
   *[other] { $count } dans ce projet
}
search-everything-found = { $count ->
    [one] Un trouvé
    [many] { $count } trouvés
   *[other] { $count } trouvés
} { $projects ->
    [one] dans un projet
    [many] dans { $projects } projets
   *[other] dans { $projects } projets
}
search-where-details = Les détails du document
# An association that has a name, with the elements at its ends: "Part 1 ↔ Part 2".
search-where-association = L’association { $ends }
search-where-note = Ce que vous pensez de { $work }
# Said before what was found in a note.
search-in-note = note
search-untitled = Sans titre
search-could-not-read = { $name } n’a pas pu être lu.
