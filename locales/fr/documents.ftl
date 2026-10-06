# Documents that are brought in, each to become a map (ADR 0012), in
# English. See locales/README.md.

documents-choose = Un document à importer
documents-filter = Documents
documents-filter-all = Tous les fichiers
documents-title-map = Une carte à partir d’un document
documents-title-project = Un projet à partir d’un document
documents-reading = Lecture de { $file }…
documents-reading-hint = Un long document prend un moment.
documents-no-pandoc = Les documents de ce type sont lus par Pandoc, qui n’est pas installé ou n’a pas pu être trouvé. Où il se trouve peut être indiqué dans les réglages.
documents-unread = Le fichier n’a pas pu être lu.
documents-title = Titre
documents-title-hint-map = Le nom de la carte, et de l’élément à son centre.
documents-title-hint-project = Le nom du projet, de sa carte, et de l’élément au centre de la carte.
# What a project made of a document is called when the document has no title.
documents-untitled = Sans titre

## What the document holds, under the number of each.

documents-parts = { $count ->
    [one] Partie
    [many] Parties
   *[other] Parties
}
documents-words = { $count ->
    [one] Mot
    [many] Mots
   *[other] Mots
}
documents-notes = { $count ->
    [one] Note
    [many] Notes
   *[other] Notes
}
documents-figures = { $count ->
    [one] Figure
    [many] Figures
   *[other] Figures
}
documents-tables = { $count ->
    [one] Tableau
    [many] Tableaux
   *[other] Tableaux
}
documents-equations = { $count ->
    [one] Équation
    [many] Équations
   *[other] Équations
}

## How often the document cites works of the library, and works the library does not have.

documents-cited-in-library = Les œuvres de votre bibliothèque sont citées { $cited ->
        [1] une fois
        [2] deux fois
       *[other] { $cited } fois
    }.
documents-cited-not-in-library = Les œuvres qui ne sont pas dans votre bibliothèque sont citées { $missing ->
        [1] une fois
        [2] deux fois
       *[other] { $missing } fois
    }.
documents-cited-both = Les œuvres de votre bibliothèque sont citées { $cited ->
        [1] une fois
        [2] deux fois
       *[other] { $cited } fois
    }, celles qui n’y sont pas { $missing ->
        [1] une fois
        [2] deux fois
       *[other] { $missing } fois
    }.

## The citations that were found in it (ADR 0015).

documents-found = { $count ->
    [one] Une citation a été trouvée.
    [many] { $count } citations ont été trouvées.
   *[other] { $count } citations ont été trouvées.
}
documents-found-made = { $count ->
    [one] Une citation a été trouvée, faite par un logiciel de gestion bibliographique.
    [many] { $count } citations ont été trouvées, toutes faites par un logiciel de gestion bibliographique.
   *[other] { $count } citations ont été trouvées, toutes faites par un logiciel de gestion bibliographique.
}
documents-found-some-made = { $count } citations ont été trouvées, dont { $made } faites par un logiciel de gestion bibliographique.
documents-at-once = Faire tout de suite des citations de celles que Zotero a faites d’œuvres que votre bibliothèque a
# Under the choice: what becomes of a note that holds one of them.
documents-at-once-notes = Une note qui n’est qu’une citation devient une citation dans la ligne, que le style de référence met en note ou dans la ligne ; une note qui dit davantage garde sa citation. Ce que vous avez choisi pour les notes dans le volet des citations reconnues, pour toutes celles qui suivent, vaut ici aussi.
documents-go-through-map = Passer les citations en revue quand la carte est faite
documents-go-through-project = Passer les citations en revue quand le projet est fait

## Making the map.

# Over what the one who brings the document in should know of it.
documents-to-know = À savoir
documents-making = Création de la carte…
documents-make-map = Créer la carte
documents-make-project = Créer le projet
documents-map-failed = La carte n’a pas pu être créée.
