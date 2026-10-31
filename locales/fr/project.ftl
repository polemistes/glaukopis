# A project: its view, the bar over the map, what is done to elements, and
# the panels at the side with the references and the pictures.

project-list-unreadable = Les projets n’ont pas pu être lus

## The view of a project

project-open-failed = Le projet n’a pas pu être ouvert
# Shown under the words above when nothing more is known of why.
project-open-failed-detail = Le projet n’a pas pu être ouvert.
project-back = Retour aux projets
project-fetching = Récupération du projet
project-fetching-offline = Le serveur ne peut pas être joint. Le projet sera récupéré dès que possible.
project-fetching-on-the-way = Il arrive du serveur.
project-name = Nom du projet
project-rename = Renommer le projet
project-not-saved = Non enregistré
project-redo = Rétablir
project-view-this = Vue de cette carte
project-diagram = Diagramme
project-text = Texte
project-one-at-a-time = Une à la fois
project-side-by-side = Vue scindée
# The menu of the Split view button: what the second side shows.
project-beside-this = Cet élément, en diagramme et en texte
project-beside-element = Un autre élément…
project-beside-project = Un autre projet…
project-beside-element-title = À côté : choisir un élément
project-beside-show = Afficher à côté
project-beside-title = À côté : choisir un projet
project-beside-subtitle = Un projet, ou un élément de son arbre, à afficher à côté de celui-ci
project-close-side = Fermer ce côté
project-references = Références
project-pictures = Images
project-side-tabs = Ce que montre le volet du document
project-side-map = Carte
project-between-maps = Entre les deux cartes
project-between-preview = Entre les côtés et la composition
project-between-pictures = Entre les côtés et les images
project-between-references = Entre les côtés et le volet du document

## When the sharing ends from the other side

project-unshared = Le projet n’est plus partagé
project-unshared-this = Ce projet n’est plus partagé
project-left-out = Vous n’êtes plus parmi les collaborateurs
project-unshared-unfetched = Il n’avait pas été récupéré, il n’y en a donc rien sur cet ordinateur.
project-unshared-not-removed = Le projet n’avait pas été récupéré, et n’a pas pu être retiré de la liste des projets
project-unshared-kept = La personne qui le partageait l’a retiré du serveur. Vous gardez le projet tel qu’il est maintenant, et pouvez continuer à y travailler de votre côté.
project-left-out-kept = Vous gardez le projet tel qu’il est maintenant, et pouvez continuer à y travailler de votre côté. Ce que les autres écrivent après cela ne vous parvient pas.
project-understood = Compris

## Files dropped on the project

project-drop-picture = Déposez une image sur l’élément auquel elle appartient
project-cited-in = { $count ->
    [one] La référence est citée dans « { $name } »
    [many] { $count } références sont citées dans « { $name } »
   *[other] { $count } références sont citées dans « { $name } »
}
# As above, where the element has no name.
project-cited-in-element = { $count ->
    [one] La référence est citée dans « l’élément »
    [many] { $count } références sont citées dans « l’élément »
   *[other] { $count } références sont citées dans « l’élément »
}

## The bar over the map: where one is, and what is done with the element in view

# The name of an element that has none.
project-untitled = Sans titre
project-where = Où vous êtes
# The tooltip of the crumb of the parent of the element in view, in the path over a side.
project-up-hint = Remonter à « { $name } » · Alt+Maj+↑
# The small round button by the element in view, in the diagram and the text: up to the element over it.
project-leave-map = Remonter à « { $name } »
# The owl before the name of the project itself, in the first pane: up to all the projects.
# The sign of a project, read aloud, where it is shared.
project-badge-shared = { $name }, partagé par vous
project-badge-joined = { $name }, rejoint
# Two projects side by side.
project-beside-failed = Le projet n’a pas pu être ouvert à côté de celui-ci
project-beside-no-comments = Les commentaires sont ceux du projet que vous avez ouvert : ouvrez l’autre seul pour y commenter
# A template of the writer's own was saved anew, and the copy of it the project carries could not be made afresh.
project-template-not-renewed = La copie du modèle que garde le projet n’a pas pu être mise à jour
# Said over the other pane while elements of one project are dragged over it.
project-copy-to-project = Copier dans « { $name } »
project-move-to-project = Déplacer dans « { $name } »
project-document-into = Importer un document dedans…
project-drop-on-map = Déposez sur une carte pour y déplacer · maintenez Ctrl pour copier
project-open-beside = Ouvrir à côté
project-open-beside-hint = Deux cartes côte à côte, pour déplacer des éléments de l’une à l’autre
project-side-by-side-short = Scinder
# The count is of those found in the element in view, and under it.
project-found-hint = { $count } à passer en revue, pour en faire des citations
project-copied-to = Copié dans « { $name } »
project-moved-to = Déplacé dans « { $name } »
project-other-projects = Autres projets
project-send-failed = Impossible d’écrire dans « { $project } ». Rien n’a été changé ici.
project-send-no-element = L’élément n’est plus dans ce projet-là.

## What is done to elements, in the diagram and in the text

project-write-text = Écrire son texte
project-associate = Associer à…
project-leave-out = Laisser hors du document
# Copying or moving elements to the project itself, to one of its trees, or to another project.
project-copy-to = Copier dans
project-cut = Couper
project-cut-not-removed = Ce qui a été coupé a été collé, mais n’a pas pu être retiré du projet d’où il venait
project-copy = Copier
# Pasting what was copied under the element the menu is of.
project-paste-under = Coller dessous
project-move-to = Déplacer dans
# Opening a dialog with the tree of the project, to choose where the elements go: first in Copy to and Move to.
project-choose-where = Choisir où…
# The title of the dialog that chooses where elements are copied to: the name of the one copied, or how many.
project-pick-copy-title = { $count ->
    [one] Copier « { $name } » dans
    [many] Copier { $count } éléments dans
   *[other] Copier { $count } éléments dans
}
project-pick-move-title = { $count ->
    [one] Déplacer « { $name } » dans
    [many] Déplacer { $count } éléments dans
   *[other] Déplacer { $count } éléments dans
}
# The buttons of the dialog, saying what will be done with the element chosen.
project-pick-copy = Copier ici
project-pick-move = Déplacer ici
project-pick-find = Trouver un élément par son nom
project-pick-none = Aucun élément ne porte ce nom
# Why an element cannot be chosen, when it is hovered.
project-pick-itself = Un élément ne peut pas aller en lui-même, ni dans ce qui est dessous
project-pick-loop = Le document se contiendrait lui-même
project-tidy-branch = Ranger cette branche
project-place-automatically = Placer automatiquement
project-itself-stays = Le projet lui-même reste
project-itself-stays-detail = Supprimez le projet depuis la liste.
# One element was deleted, with the elements that were under it.
project-deleted = { $under ->
    [0] « { $name } » a été supprimé
    [one] « { $name } » a été supprimé, avec { $under } élément dessous
    [many] « { $name } » a été supprimé, avec { $under } éléments dessous
   *[other] « { $name } » a été supprimé, avec { $under } éléments dessous
}
project-deleted-many = { $count ->
    [one] { $count } élément supprimé
    [many] { $count } éléments supprimés
   *[other] { $count } éléments supprimés
}

project-delete-busy-title = Quelqu’un écrit ici
# $names: those who are at what would be deleted, as a list.
project-delete-busy-message = { $names } { $count ->
    [one] est
    [many] sont
   *[other] sont
} en train de travailler dans ce qui serait supprimé. Ce qui s’y écrit en ce moment serait perdu avec, et ne pourrait pas être ramené.
project-delete-busy-confirm = Supprimer quand même

## An element, open for writing, and as it is shown when the pointer rests on it

project-element = Élément
project-name-placeholder = Nom
project-write-here = Écrivez ici. Tapez @ pour citer.
project-words = { $count ->
    [one] { $count } mot
    [many] { $count } mots
   *[other] { $count } mots
}
project-read-on = Double-cliquez pour lire la suite
project-left-out-of-document = Laissé hors du document

## The panels at the side: the references and the pictures

project-this-map = Cette carte
project-project = Projet
project-library = Bibliothèque
project-nothing-found = Rien trouvé
project-edit-reference = Modifier la référence…
project-new-reference = Nouvelle référence
project-import-file = Importer un fichier
project-which-references = Quelles références
project-search-references = Rechercher des références
project-library-empty = Votre bibliothèque est vide
project-library-empty-hint = Ajoutez une référence, ou importez celles que vous avez.
project-no-references = Pas encore de références
project-no-references-hint = Ce que vous citez en écrivant est listé ici. Pour citer, choisissez Citer au-dessus du texte, ou tapez @.
project-cited-in-heading = Citée dans
project-not-cited = Pas citée dans ce projet.
project-references-drag = Glissez une référence dans un texte pour l’y citer, ou sur un élément pour la citer à la fin de son texte.
# The count is of the references the project cites that the library lacks.
project-references-foreign = { $count ->
    [one] { $count } de ce projet n’est pas dans votre bibliothèque.
    [many] { $count } de ce projet ne sont pas dans votre bibliothèque.
   *[other] { $count } de ce projet ne sont pas dans votre bibliothèque.
}
project-open-picture = Ouvrir…
project-put-into-text = La mettre dans le texte
project-add-pictures = Ajouter des images depuis des fichiers
project-which-pictures = Quelles images
project-search-pictures = Rechercher des images
project-a-picture = Une image
project-not-on-computer = Pas sur cet ordinateur
project-nothing-said = Rien n’en est encore dit
project-no-pictures = Pas encore d’images
project-no-pictures-map = Les images des figures de cette carte sont listées ici. Celles de la bibliothèque sont sous Bibliothèque.
project-no-pictures-project = Les images des figures du projet sont listées ici. Celles de la bibliothèque sont sous Bibliothèque.
project-pictures-drag =Glissez une image dans un texte pour en faire une figure à cet endroit, ou sur un élément pour la mettre à la fin de son texte.
# The count is of the pictures that are used and are not in the store of this computer.
project-pictures-absent-map = { $count ->
    [one] { $count } de cette carte n’est pas sur cet ordinateur.
    [many] { $count } de cette carte ne sont pas sur cet ordinateur.
   *[other] { $count } de cette carte ne sont pas sur cet ordinateur.
}
project-pictures-absent-project = { $count ->
    [one] { $count } de ce projet n’est pas sur cet ordinateur.
    [many] { $count } de ce projet ne sont pas sur cet ordinateur.
   *[other] { $count } de ce projet ne sont pas sur cet ordinateur.
}

## Shared by the diagram and the text

# A count of elements that stands alone, as a label of what is dragged.
project-elements = { $count ->
    [one] { $count } élément
    [many] { $count } éléments
   *[other] { $count } éléments
}
# One of the others who work on a shared project is at an element.
project-other-here = { $name } est ici
project-link-placeholder = En quoi ils sont liés
project-link-label = Étiquette de l’association

## A copy and its original.
copy-title = La copie et son original
copy-from = Copié de « { $name } »
copy-original-changed = L’original a changé depuis la copie, ou depuis la dernière fois que cela a été vu.
copy-original-same = L’original est tel qu’il était lors de la copie.
copy-original-unknown = On ne sait pas si l’original a changé depuis la copie : la copie a été faite avant que cela ne soit gardé.
copy-original-gone = L’original n’est plus là.
copy-how-shown = Ci-dessous, barré, ce que seul l’original a, et marqué, ce que seule cette copie a.
copy-alike = Leurs noms et leurs textes sont semblables. Ils peuvent différer par ce qui n’est pas des mots : citations, images, marques.
copy-only-original = Seulement dans l’original
copy-only-copy = Seulement dans cette copie
copy-go = Aller à l’original
copy-seen = Garder cette copie telle quelle
copy-take = Prendre le nom et le texte de l’original
copy-changed-mark = L’original a changé depuis la copie
copy-compare = Comparer avec l’original…
copy-copied-from = Copié de « { $name } »
copy-copied-from-changed = Copié de « { $name } », qui a changé depuis

## How far the writing of an element has come, as its writer says.
status = État
status-idea = Idée
status-draft = Brouillon
status-done = Terminé
status-none = Aucun état
# Of an element, where its status is shown: "Draft · 340 words".
status-of = { $status } · { $count ->
    [one] { $count } mot
    [many] { $count } mots
   *[other] { $count } mots
}
status-count-idea = { $count ->
    [one] { $count } idée
    [many] { $count } idées
   *[other] { $count } idées
}
status-count-draft = { $count ->
    [one] { $count } brouillon
    [many] { $count } brouillons
   *[other] { $count } brouillons
}
status-count-done = { $count ->
    [one] { $count } terminé
    [many] { $count } terminés
   *[other] { $count } terminés
}
# The words of the drafts and of what is done, in a map.
status-words-written = { $count ->
    [one] { $count } mot écrit
    [many] { $count } mots écrits
   *[other] { $count } mots écrits
}
status-progress = Où en est la carte

## The path over each side, and the sides (stage 4 of the list, the path and the window as it was left)
# The chevron at the start of a path, which opens the menu of all projects.
project-all-projects-menu = Tous les projets
# The crumb … in a path too long for its cell, whose menu has the crumbs hidden behind it.
project-path-hidden = Le reste du chemin
project-switch-sides = Intervertir les côtés

## Stage 3 of the sides, the panes and the bars (agent "bars")
project-bar-typesetting = Composition
project-bar-document = Document
project-badge-offline = le serveur ne peut pas être joint
project-badge-refused = le serveur n’accepte pas les dernières modifications

## Fewer words, stage 2 (agent "chrome"): the clone, which has nothing of its own but its name.
project-clone-other = Cloner un autre élément…
# The submenu of a clone, and the mark of a clone in the diagram: the original's name.
project-clone-of = Clone de « { $name } »
project-clone-choose = Choisir un autre élément…
project-clone-go = Aller à l’original
project-clone-none = Ne plus être un clone
# The dialog with the tree of the project, choosing the original of a clone.
project-pick-clone-title = Quel élément cloner dans « { $name } » ?
project-pick-clone = Le cloner
project-pick-clone-self = Un élément ne peut pas être un clone de lui-même
project-add-child = Ajouter un sous-élément
project-add-sibling = Ajouter un élément de même niveau
project-delete-promote = Supprimer et remonter les sous-éléments
project-delete-with = Supprimer avec les sous-éléments

## A file shown in a side of the window (2026-10-26).

project-show-file = Afficher le fichier
# Where a work has several files: one item for each, by its name.
project-show-file-named = Afficher « { $name } »
# Over the document pane while the side that has the focus shows a file: the document is that of the other side.
project-document-of-other = Le document de l’autre côté

# One place for files (ADR 0070): the third choice of the images at the side of a project, all of the library.
project-pictures-library = Bibliothèque
project-library-no-images = La bibliothèque n’a pas d’images
project-library-no-images-hint = Ajoutez des images depuis des fichiers, ou déposez-les sur un texte.

# The tabs opened (docs/plans/the-tabs-opened-files-by-their-references-and-a-file-read-in-the-library.md).
project-beside-tabs = Les onglets du projet
