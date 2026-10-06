# The library: the references, the form they are written in, and what
# brings them in, in English. The fields and types of the form are in
# fields.ftl. See locales/README.md.

## The form of a reference.

library-form-often-used = Champs fréquents
library-form-add-field = Ajouter un champ
library-form-citation-key = Clé de citation
# In the empty field of the citation key: what it is given if nothing is written.
library-form-key-made = faite de l’auteur et de l’année
library-form-date-problem = Écrivez une date comme 1979, 1979-05 ou 1979-05-12 ; une période comme 1979/1985.
library-form-remove-field = Retirer { $field }

## The people of a reference, with the name of their field: “Author: family name”.

library-names-kept-whole = Institution ou autre nom gardé entier
library-names-prefix-suffix = Particule et suffixe
    .hint = « van », « de la » · « Jr. », « III »
library-names-move-up = Monter
library-names-move-down = Descendre
library-names-more = Plus pour ce nom
library-names-name = Nom
library-names-name-of = { $role } : nom
library-names-family = Nom de famille
library-names-family-of = { $role } : nom de famille
library-names-given = Prénoms
library-names-given-of = { $role } : prénoms
library-names-prefix = Particule : van, de la
library-names-prefix-of = { $role } : particule
library-names-suffix = Suffixe : Jr., III
library-names-suffix-of = { $role } : suffixe

## Words for references, wherever they are shown.

library-untitled = Sans titre
library-no-author = Sans auteur
library-no-title = Sans titre
library-in-library = Dans votre bibliothèque

## Why a reference is taken for another: “the same DOI and the same file”.

library-reason-doi = le même DOI
library-reason-isbn = le même ISBN
library-reason-identical = semblables en tout ce qui distingue une œuvre d’une autre
# How far the title, the author and the year agree: the same, like (titles
# that differ in a few letters or a subtitle, an author in common, years a
# year apart), or none (one of them says nothing of it).
library-reason-alike = { $title ->
    [same] { $author ->
        [same] { $year ->
            [same] les mêmes titre, auteur et année
            [like] les mêmes titre et auteur, à un an près
           *[none] les mêmes titre et auteur, l’année sur l’une seulement
        }
        [like] { $year ->
            [same] les mêmes titre et année, et un auteur en commun
            [like] le même titre, un auteur en commun, à un an près
           *[none] le même titre, un auteur en commun, l’année sur l’une seulement
        }
       *[none] { $year ->
            [same] les mêmes titre et année, l’auteur sur l’une seulement
            [like] le même titre, à un an près, l’auteur sur l’une seulement
           *[none] le même titre, l’auteur et l’année sur l’une seulement
        }
    }
   *[like] { $author ->
        [same] { $year ->
            [same] les mêmes auteur et année, et un titre semblable
            [like] le même auteur, un titre semblable, à un an près
           *[none] le même auteur, un titre semblable, l’année sur l’une seulement
        }
        [like] { $year ->
            [same] la même année, un titre semblable, un auteur en commun
            [like] un titre semblable, un auteur en commun, à un an près
           *[none] un titre semblable, un auteur en commun, l’année sur l’une seulement
        }
       *[none] { $year ->
            [same] la même année, un titre semblable, l’auteur sur l’une seulement
            [like] un titre semblable, à un an près, l’auteur sur l’une seulement
           *[none] un titre semblable, l’auteur et l’année sur l’une seulement
        }
    }
}
library-reason-file = le même fichier
# Several reasons: those before the last, set apart by commas, and the last.
library-reasons = { $others } et { $last }

## The size of a file.

library-size-bytes = { $size } o
library-size-kilobytes = { $size } ko
library-size-megabytes = { $size } Mo

## What may be in the library already, while a reference is written.

library-duplicate-certain = Ceci est déjà dans votre bibliothèque.
library-duplicate-probable = Ceci est peut-être déjà dans votre bibliothèque.
library-duplicate-use = Prendre celle-ci

## Duplicates in the library.

library-duplicates-title = Doublons
library-duplicates-count = { $count ->
    [one] { $count } référence semble être plusieurs fois dans la bibliothèque
    [many] { $count } références semblent être plusieurs fois dans la bibliothèque
   *[other] { $count } références semblent être plusieurs fois dans la bibliothèque
}
library-duplicates-none = Pas de doublons
    .text = Aucune référence ne semble être plusieurs fois dans la bibliothèque.
library-duplicates-no-more = Plus de doublons
    .text = Les citations des références fusionnées citent maintenant celles qui ont été gardées.
library-duplicates-how = Quand des références sont fusionnées, celle que vous gardez reçoit des autres ce qui lui manque, et garde ce qu’elle a là où elles diffèrent. Leurs fichiers et leurs collections sont réunis, et ce qui les cite cite celle qui est gardée.
library-duplicates-same = Les mêmes
library-duplicates-probably-same = Probablement les mêmes
library-duplicates-keep-which = Celle à garder
library-duplicates-kept = Gardée
library-duplicates-different = Elles sont différentes
library-duplicates-merge = Les fusionner
library-duplicates-merging = Fusion…
library-duplicates-failed = Les doublons n’ont pas pu être cherchés dans la bibliothèque
library-duplicates-merge-failed = Elles n’ont pas pu être fusionnées

## Importing references: what a file holds, against what the library has.

library-import = Importer
library-import-title = Importer des références
# What is imported, and from where: a file, Zotero.
library-import-subtitle = { $count ->
    [one] { $count } référence : { $source }
    [many] { $count } références : { $source }
   *[other] { $count } références : { $source }
}
library-import-review = { $count ->
    [one] { $count } référence est peut-être déjà dans votre bibliothèque
    [many] { $count } références sont peut-être déjà dans votre bibliothèque
   *[other] { $count } références sont peut-être déjà dans votre bibliothèque
}
library-import-new = { $count ->
    [one] { $count } nouvelle référence
    [many] { $count } nouvelles références
   *[other] { $count } nouvelles références
}
library-import-complete = { $count ->
    [one] { $count } référence déjà dans votre bibliothèque gagne des informations
    [many] { $count } références déjà dans votre bibliothèque gagnent des informations
   *[other] { $count } références déjà dans votre bibliothèque gagnent des informations
}
library-import-known = { $count ->
    [one] { $count } référence déjà dans votre bibliothèque
    [many] { $count } références déjà dans votre bibliothèque
   *[other] { $count } références déjà dans votre bibliothèque
}
library-import-repeated = { $count ->
    [one] { $count } référence répétée dans l’importation
    [many] { $count } références répétées dans l’importation
   *[other] { $count } références répétées dans l’importation
}
# The fields a reference of the library would be given: “Would gain: Publisher, Place”.
library-import-would-gain = Gagnerait : { $fields }
library-import-gains-file = Fichier
library-import-gains-zotero = Sa clé dans Zotero
library-import-what-to-do = Que faire
library-import-merge = Même œuvre : compléter celle que j’ai
library-import-skip = Même œuvre : laisser la mienne telle quelle
library-import-add = Une autre œuvre : l’ajouter
# One answer for every candidate in the same case: “For all 16 that are the same: …”.
library-import-all-certain = Pour les { $count } qui sont les mêmes :
library-import-all-probable = Pour les { $count } qui sont probablement les mêmes :
library-import-all-merge = Compléter celles que j’ai
library-import-all-skip = Laisser les miennes telles quelles
library-import-all-add = Les ajouter quand même
library-import-more = …et { $count } de plus.
library-import-unread = { $count ->
    [one] { $count } partie du fichier n’a pas pu être lue
    [many] { $count } parties du fichier n’ont pas pu être lues
   *[other] { $count } parties du fichier n’ont pas pu être lues
}
library-import-importing = Importation…
# How many are to be added, completed and left out: “3 to add, 1 to complete, 2 left out”.
library-import-counts = { $add } à ajouter{ $merge ->
        [0] {""}
       *[other] , { $merge } à compléter
    }{ $skip ->
        [0] {""}
       *[other] , { $skip } laissées de côté
    }
library-import-failed = L’importation a échoué.

## The library: the list of references, and what can be done with them.

library-references = Références
library-unread = La bibliothèque n’a pas pu être lue
library-all-references = Toutes les références
library-count = { $count ->
    [one] { $count } référence
    [many] { $count } références
   *[other] { $count } références
}
library-selected = { $count ->
    [one] { $count } référence sélectionnée
    [many] { $count } références sélectionnées
   *[other] { $count } références sélectionnées
}
library-selected-of = { $count ->
    [one] { $selected } sur { $count } référence sélectionnée
    [many] { $selected } sur { $count } références sélectionnées
   *[other] { $selected } sur { $count } références sélectionnées
}
library-new-reference = Nouvelle référence
library-search = Rechercher dans la bibliothèque
library-search-in = Rechercher dans { $name }
library-search-clear = Effacer la recherche
library-sort = Trier
library-sort-author = Auteur
library-sort-year = Année
library-sort-title = Titre
library-sort-added = Date d’ajout
library-sort-modified = Date de modification
library-sort-descending = Décroissant

## The filters, beside the search: what kind of publication, who published it, and when.

library-filters = Filtrer
library-filters-on = { $count ->
    [one] Filtre : { $count } actif
    [many] Filtre : { $count } actifs
   *[other] Filtre : { $count } actifs
}
library-filter-kind = Type
library-filter-publisher = Éditeur
library-filter-publisher-hint = Une partie du nom
library-filter-any-publisher = Tout éditeur
library-filter-year = Année
library-filter-from = De
library-filter-to = À
library-filter-clear = Effacer les filtres
library-filter-nothing-here = Rien à filtrer ici.
# When the filters let nothing through.
library-nothing-passes = Aucune référence affichée ne passe les filtres.
library-import-export = Importer et exporter
library-import-file = Importer un fichier…
    .hint = BibLaTeX ou BibTeX
library-paste = Coller des références…
library-add-pdfs = Ajouter des fichiers PDF…
    .hint = Chacun est cherché en ligne, et gardé
library-import-zotero = Importer depuis Zotero…
library-find-duplicates = Trouver les doublons…
library-map-library = Une carte de la bibliothèque…
library-map-collection = Une carte de « { $name } »…
library-export-library = Exporter la bibliothèque…
library-export-collection = Exporter « { $name } »…
library-export-one = Exporter…
library-export-many = { $count ->
    [one] Exporter { $count } référence…
    [many] Exporter { $count } références…
   *[other] Exporter { $count } références…
}
library-export-title = Exporter des références
# What a file of exported references is called, before it is given a name.
library-export-file-references = references
library-export-file-library = bibliotheque
library-exported = { $count ->
    [one] { $count } référence exportée
    [many] { $count } références exportées
   *[other] { $count } références exportées
}
library-export-failed = L’exportation a échoué
library-empty = Votre bibliothèque est vide
    .text = Les références que vous ajoutez ici sont disponibles dans tous vos projets. Commencez par une, ou importez celles que vous avez déjà.
library-collection-empty = Rien dans cette collection pour l’instant
    .text = Glissez ici des références depuis la bibliothèque, ou ajoutez-en une nouvelle.
library-nothing-found = Rien trouvé
    .text = Aucune référence ne contient tous ces mots.
library-open-file = Ouvrir le fichier
library-file-open-failed = Le fichier n’a pas pu être ouvert
library-add-to-collection = Ajouter à une collection
library-remove-from = Retirer de « { $name } »
library-copy-key = Copier la clé de citation
library-copied-key = « { $key } » copié
library-copy-biblatex = Copier en BibLaTeX
library-copied = Copié
library-delete-one-title = Supprimer « { $name } » ?
library-delete-many-title = { $count ->
    [one] Supprimer { $count } référence ?
    [many] Supprimer { $count } références ?
   *[other] Supprimer { $count } références ?
}
# $projects is the number of projects that cite what is deleted, which keep copies of their own.
library-delete-one = Ceci retire la référence de votre bibliothèque et de toutes les collections{ $files ->
        [0] {""}
        [one] , avec { $files } fichier joint
        [many] , avec { $files } fichiers joints
       *[other] , avec { $files } fichiers joints
    }.{ $projects ->
        [0] {""}
        [one] {" "}Elle est citée dans un projet, qui en garde une copie.
        [many] {" "}Elle est citée dans { $projects } projets, qui en gardent une copie.
       *[other] {" "}Elle est citée dans { $projects } projets, qui en gardent une copie.
    }
library-delete-many = Ceci les retire de votre bibliothèque et de toutes les collections{ $files ->
        [0] {""}
        [one] , avec { $files } fichier joint
        [many] , avec { $files } fichiers joints
       *[other] , avec { $files } fichiers joints
    }.{ $projects ->
        [0] {""}
        [one] {" "}Un projet qui en cite certaines en garde une copie.
        [many] {" "}{ $projects } projets qui en citent certaines en gardent une copie.
       *[other] {" "}{ $projects } projets qui en citent certaines en gardent une copie.
    }
library-delete-failed = Les références n’ont pas pu être supprimées
library-not-done = Cela n’a pas pu être fait

## Collections.

library-collections = Collections
# The projects that cite a work, in its pane.
library-cited-in = Citée dans
library-not-cited = Citée dans aucun projet.
library-cited-reading = Lecture des projets…
library-collections-hint = Les collections rassemblent des références pour un sujet ou un travail. Une référence peut être dans autant de collections qu’on veut.
library-collection-new = Nouvelle collection
library-collection-new-inside = Nouvelle collection à l’intérieur
library-collection-new-under = Nouvelle collection dans « { $name } »
library-collection-move-to = Déplacer vers
library-collection-name = Nom de la collection
library-collection-name-failed = La collection n’a pas pu être nommée
library-collection-expand = Déplier
library-collection-collapse = Replier
library-collection-to-top = Déplacer au premier niveau
library-collection-move-failed = La collection n’a pas pu être déplacée
library-collection-added = { $count ->
    [one] { $count } référence ajoutée à « { $name } »
    [many] { $count } références ajoutées à « { $name } »
   *[other] { $count } références ajoutées à « { $name } »
}
library-collection-already = Déjà dans « { $name } »
library-collection-delete = Supprimer la collection
library-collection-delete-title = Supprimer la collection « { $name } » ?
# The number is that of the collections inside the one that is deleted.
library-collection-delete-message = { $inside ->
    [0] Les références restent dans votre bibliothèque.
   *[other] Les collections qu’elle contient sont supprimées aussi. Les références restent dans votre bibliothèque.
}
library-collection-delete-failed = La collection n’a pas pu être supprimée
library-collection-count = { $count ->
    [one] { $count } collection
    [many] { $count } collections
   *[other] { $count } collections
}

## A map of the library, or of a collection: a new project.

library-map-title-library = Une carte de la bibliothèque
library-map-title-collection = Une carte d’une collection
# The name a project made of the whole library is given.
library-map-library-name = La bibliothèque
library-map-name = Nom
library-map-name-hint = Le nom du projet, de sa carte, et de l’élément au centre de la carte.
library-map-what-library = Les collections deviennent des éléments, emboîtées comme elles le sont, et chaque référence un élément sous sa collection, dont le texte est une citation de celle-ci. Les références qui ne sont dans aucune collection se placent au centre.
library-map-what-collection = Les collections qu’elle contient deviennent des éléments, emboîtées comme elles le sont, et chaque référence un élément sous sa collection, dont le texte est une citation de celle-ci.
library-map-nothing = Il n’y a pas de références à mettre sur la carte.
library-map-make = Créer le projet
library-map-making = Création du projet…
library-map-failed = Le projet n’a pas pu être créé.

## Bringing references in, from anywhere in the application.

library-files = { $count ->
    [one] { $count } fichier
    [many] { $count } fichiers
   *[other] { $count } fichiers
}
library-open-failed = La référence n’a pas pu être ouverte
library-known = { $count ->
    [one] Elle est déjà dans votre bibliothèque
    [many] Elles sont déjà dans votre bibliothèque
   *[other] Elles sont déjà dans votre bibliothèque
}
library-nothing-to-import = Rien à importer
library-none-found = Aucune référence n’a été trouvée.
library-import-kinds = Les références sont lues dans les fichiers .bib, et faites à partir de fichiers PDF.
library-filter-bib = BibLaTeX et BibTeX
library-filter-all = Tous les fichiers
library-files-read-failed = { $count ->
    [one] Le fichier n’a pas pu être lu
    [many] Les fichiers n’ont pas pu être lus
   *[other] Les fichiers n’ont pas pu être lus
}
library-text-read-failed = Le texte n’a pas pu être lu
library-add-pdfs-title = Ajouter des fichiers PDF
library-pdfs-working = { $count ->
    [one] Identification du fichier…
    [many] Identification de { $count } fichiers…
   *[other] Identification de { $count } fichiers…
}
# While PDF files are found out about, one after another.
library-pdfs-progress = { $done } sur { $count } : { $name }
library-stop = Arrêter
# What came of an import, as a list: “3 references added, 1 completed, 2 files stored”.
library-imported-added = { $count ->
    [one] { $count } référence ajoutée
    [many] { $count } références ajoutées
   *[other] { $count } références ajoutées
}
library-imported-completed = { $count ->
    [one] { $count } complétée
    [many] { $count } complétées
   *[other] { $count } complétées
}
library-imported-skipped = { $count } déjà dans la bibliothèque
library-imported-files = { $count ->
    [one] { $count } fichier stocké
    [many] { $count } fichiers stockés
   *[other] { $count } fichiers stockés
}
library-imported-nothing = Rien n’a été changé
library-paste-title = Coller des références
library-paste-subtitle = BibLaTeX ou BibTeX, autant d’entrées que vous voulez
library-paste-continue = Continuer
library-source-label = Source BibLaTeX

## Importing from Zotero.

library-zotero-title = Importer depuis Zotero
# The file is the database of Zotero, zotero.sqlite, shown as code.
library-zotero-not-found = Aucun Zotero n’a été trouvé sur cet ordinateur aux endroits où il garde d’ordinaire ses données. S’il les garde ailleurs, montrez où : le dossier qui contient { $file }.
library-zotero-lead = Ce qui est importé est copié dans votre bibliothèque, avec ses fichiers. Zotero est seulement lu, et rien n’y est changé ; il peut tourner pendant ce temps.
library-zotero-choose = Le dossier des données de Zotero
library-zotero-none-there = Il n’y a pas de Zotero là.
library-zotero-unread = Zotero n’a pas pu être lu.
library-zotero-library = Bibliothèque
# A library of Zotero, with the number of its references.
library-zotero-library-option = { $name } ({ $count })
library-zotero-my-library = Ma bibliothèque
library-zotero-what = Quoi importer
library-zotero-everything = Tout
library-zotero-with-files = Avec les fichiers joints
library-zotero-with-notes = Avec les notes, comme annotations
library-zotero-elsewhere = Un autre endroit…
library-zotero-show-where = Montrer où…
library-zotero-reading = Lecture…
library-zotero-read = { $count ->
    [0] Lu
    [one] { $count } référence lue
    [many] { $count } références lues
   *[other] { $count } références lues
}

## Writing a reference.

library-dialog-edit = Modifier la référence
library-dialog-add = Ajouter une référence
library-dialog-back = Retour au formulaire
library-dialog-open-failed = La référence n’a pas pu être ouverte.
library-dialog-save-failed = La référence n’a pas pu être enregistrée.
# The entry as BibLaTeX, as against the form.
library-source = Source
library-source-unread = La source n’a pas pu être lue.

## A reference, beside the list.

library-pane-label = Référence
library-pane-more = Plus
library-pane-saved = Enregistré
library-pane-editing = Modification…
library-pane-not-saved = Non enregistré
library-pane-unread = La référence n’a pas pu être lue.
library-pane-save-failed = Les modifications n’ont pas pu être enregistrées.
library-pane-note-placeholder = Ce que vous en pensez. Pour vous-même : cela ne fait pas partie de ce qui est cité.
library-pane-files = Fichiers
library-pane-attach = Joindre
library-pane-attach-title = Joindre des fichiers
library-pane-attach-failed = Le fichier n’a pas pu être joint
# Of a file that is attached, and not where it should be.
library-pane-missing = manquant
library-pane-reveal = Afficher dans le gestionnaire de fichiers
library-pane-reveal-failed = Le dossier n’a pas pu être ouvert
library-pane-no-files = Pas de fichiers. Joignez un PDF, ou déposez-en un ici.
library-pane-detach = Retirer le fichier
library-pane-detach-title = Retirer « { $name } » ?
library-pane-detach-message = Le fichier est supprimé de la réserve de la bibliothèque, à moins qu’une autre référence ne l’utilise.
library-pane-detach-failed = Le fichier n’a pas pu être retiré
library-pane-leave-collection = Retirer de { $name }
library-pane-duplicate = Dupliquer
    .hint = Une nouvelle référence qui commence avec ces informations
library-pane-edit-source = Modifier la source…
library-pane-source-subtitle = L’entrée en BibLaTeX. La plupart des choses sont plus faciles dans le formulaire.
library-pane-source-failed = La source n’a pas pu être affichée
library-pane-added = Ajoutée le { $date }
library-pane-added-changed = Ajoutée le { $added } · modifiée le { $changed }

## Looking up a reference.

library-lookup-placeholder = Chercher en ligne : un DOI, un ISBN, ou des mots du titre et de l’auteur
library-lookup-label = Chercher une référence en ligne
library-lookup-failed = Rien n’a pu être cherché.
# Where the reference came from: a service such as Crossref.
library-lookup-filled = Rempli d’après { $source }.
library-lookup-others = { $count ->
    [one] { $count } autre notice
    [many] { $count } autres notices
   *[other] { $count } autres notices
}
library-lookup-scope = Quoi chercher
library-lookup-any = N’importe quoi
library-lookup-books = Livres
library-lookup-articles = Articles
library-lookup-none = Rien n’a été trouvé. Moins de mots en trouveraient peut-être plus : le nom de famille de l’auteur et un ou deux mots du titre.
# What was asked for: a DOI, an ISBN, a number of arXiv or of PubMed.
library-lookup-unknown = Rien n’est connu de { $kind ->
        [doi] ce DOI
        [isbn] cet ISBN
        [arxiv] ce numéro arXiv
       *[pmid] ce numéro PubMed
    } là où il a été demandé. La référence peut être saisie à la main ci-dessous.

## What the writer writes about a work.

library-notes = Notes
library-notes-yours = Vos notes
library-notes-on-work = Vos notes sur cette œuvre
library-notes-read = Lire vos notes
library-notes-write = Écrire une note
library-notes-write-on-work = Écrire une note sur cette œuvre
library-notes-not-in-library = Une référence qui n’est pas dans votre bibliothèque
library-notes-this-project = Dans ce projet
library-notes-all-projects = Dans tous les projets
library-notes-project-placeholder = Ce que vous en pensez, pour ce travail
library-notes-all-placeholder = Ce que vous en pensez, où que vous la citiez
library-notes-keep-for-all = Garder pour tous les projets
library-notes-write-for-all = Écrire pour tous les projets
library-notes-carried = La référence est venue avec le projet, et n’est pas dans votre bibliothèque. Ce qui est écrit ici est chez tous ceux qui ont le projet.
library-notes-kept = Gardée avec la référence dans votre bibliothèque. Elle accompagne un projet qui cite l’œuvre.
library-notes-unread = Vos notes n’ont pas pu être lues
library-notes-unsaved = Votre note n’a pas pu être gardée
