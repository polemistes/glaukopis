# The projects: the list of them, and what is done with them.

home-title = Projets
home-join = Rejoindre un projet partagé
home-from-document = Un projet à partir d’un document…
home-new = Nouveau projet

## The three forms of the page: the last used projects as cards, all of them as a list, all of them as a map around the owl

# Under the cards, when there are more projects than they show.
# The button that opens the menu of the page.
home-page-menu = Plus
home-search = Trouver un projet
home-search-none = Aucun projet ne porte ce nom.
home-list-none = Il n’y a pas de projets.

## Folders of projects

home-new-folder = Nouveau dossier
home-folder-rename-title = Renommer le dossier
home-folder-name-placeholder = Ce que le dossier contient
home-folder-name-missing = Donnez un nom au dossier.
home-menu-move = Déplacer dans un dossier
home-menu-out = Hors des dossiers
home-folder-delete-title = Supprimer le dossier « { $name } » ?
home-folder-delete-message = Les dossiers et les projets qu’il contient sont gardés : ils remontent là où était le dossier.
home-folder-delete-confirm = Supprimer le dossier
home-folder-failed = Cela n’a pas pu être fait avec le dossier
home-moved-to = « { $name } » a été déplacé dans { $folder }
home-moved-out = « { $name } » n’est plus dans aucun dossier
home-move-failed = Le projet n’a pas pu être déplacé

## The pane of projects, at the left of a project

home-pane = La liste des projets
home-pane-toggle = La liste des projets
home-pane-close = Fermer la liste des projets
home-pane-between = Entre la liste des projets et le projet
# On the chevron before an element of the open project, in the pane: what is under it is shown, or hidden.
# Why the project that is open cannot be renamed or deleted from its menu.
home-open-now = Il est ouvert en ce moment
# On the menu of a project, or of an element of one, in the pane: shows it in a second pane, beside the project that is open.
# Under a project that is not open, in the pane, when what it holds could not be read.
home-tree-unreadable = Il n’a pas pu être lu
# Under a project that is not open, in the pane, when it holds no elements yet.
home-tree-empty = Rien dedans pour l’instant

## The owl map: the projects drawn around the owl, the folders as plain labels

# The button that shows all of the map at once.
# On a folder of the map: its projects are hidden, or shown.
# The map itself, as a list read aloud.
# The corner of a card that opens the project, and of a folder that shows it at the centre of the map.
# The corner of the folder at the centre: up to what holds it.
# The menus of the map and of a folder on it: a new one made here, its name written in place.
home-owl-new-project = Nouveau projet ici
home-owl-new-folder = Nouveau dossier ici
# The bar over the map, at a folder: what holds it.

## A map of the projects

home-map-menu = Une carte des projets…
home-map-title = Une carte des projets
home-map-about = Un nouveau projet : les dossiers comme éléments, et sous chaque dossier les projets qu’il contient.
home-map-name-default = Projets
home-map-what = Ce que la carte contient
home-map-names = Seulement les noms
home-map-names-hint = Un élément par projet, avec sa description comme texte.
home-map-everything = Avec tout ce qu’ils contiennent
home-map-everything-hint = Sous chaque projet tous ses éléments, avec leurs noms et leurs textes.
home-map-note = Les citations gardent leurs références. Un renvoi à une figure ou à une partie ne désigne rien dans le nouveau projet, et les commentaires restent en arrière.
home-map-reading = Lecture de « { $name } »…
home-map-working = Création de la carte…
home-map-make = Créer la carte
home-map-failed = La carte des projets n’a pas pu être créée

## When there are none yet

home-welcome = Bienvenue dans Glaukopis
home-welcome-text = Un logiciel d’écriture centré sur les idées
home-begin = Commencer un projet

## A project in the list

# "ago" is how long ago it was: "3 hours ago", "yesterday", "12 March".
# The button that opens the menu of a project.
home-more-for = Plus pour { $name }
home-deleted-projects = { $count ->
    [one] { $count } projet supprimé
    [many] { $count } projets supprimés
   *[other] { $count } projets supprimés
}

## The menu of a project

home-menu-rename = Renommer…
home-menu-duplicate = Dupliquer…
home-menu-history = Versions antérieures…
home-menu-save-file = Enregistrer comme fichier…
home-menu-save-org = Enregistrer en Org…

## Naming a project

home-rename-title = Renommer le projet
home-duplicate-title = Dupliquer le projet
home-name = Nom
home-name-placeholder = Le titre de travail du livre ou de l’article
home-name-missing = Donnez un nom au projet.
home-create = Créer
home-duplicate = Dupliquer
# The name a copy of a project is given, until it is given another.
home-copy-name = { $name }, copie
home-failed = Cela n’a pas marché.

## Deleting a project

home-delete-title = Supprimer « { $name } » ?
home-delete-message = Le projet est mis à la corbeille de Glaukopis, d’où il peut être ramené. Vos références ne sont pas touchées.
home-delete-owner = Le projet est mis à la corbeille de Glaukopis, d’où il peut être ramené. Il reste sur le serveur et chez ceux avec qui vous le partagez ; pour le retirer du serveur, ouvrez-le et cessez d’abord de le partager.
home-delete-member = Le projet est mis à la corbeille de Glaukopis, d’où il peut être ramené. Les autres gardent le leur.
home-delete-confirm = Supprimer le projet
home-deleted = « { $name } » a été mis à la corbeille
home-delete-failed = Le projet n’a pas pu être supprimé

## The trash

home-trash-title = Projets supprimés
home-trash-none = Il n’y en a aucun.
home-deleted-ago = Suppression : { $ago }
home-restore = Ramener
home-restored = « { $name } » est de retour parmi les projets
home-restore-failed = Le projet n’a pas pu être ramené
home-purge = Supprimer définitivement
home-purge-title = Supprimer « { $name } » définitivement ?
home-purge-message = Ce que le projet contient ne pourra plus être ramené après cela. Vos références ne sont pas touchées.
home-purge-failed = Le projet n’a pas pu être supprimé

## Earlier versions of a project

home-history-title = Versions antérieures
home-history-about = De « { $name } ». Une version s’ouvre comme un projet à part ; celui-ci reste tel quel.
home-history-none = Aucune n’a encore été gardée. Une version est gardée de temps en temps pendant que vous travaillez : souvent pour le récent, plus rarement pour l’ancien.
home-history-open = Ouvrir une copie
# The name of the project an earlier version is opened as; "day" is the day it was kept.
home-history-copy-name = { $name }, au { $day }
home-history-unread = Les versions antérieures n’ont pas pu être lues
home-history-open-failed = Cette version n’a pas pu être ouverte

## A project as one file

home-file-open = Ouvrir un fichier de projet…
home-file-open-title = Ouvrir un fichier de projet
# The kind of file, in the dialog that asks for one.
home-file-filter = Projet Glaukopis
home-file-save-title = Enregistrer le projet comme fichier
home-file-saved = « { $name } » a été enregistré comme fichier
home-file-save-failed = Le projet n’a pas pu être enregistré comme fichier
home-file-open-failed = Le fichier de projet n’a pas pu être ouvert
home-file-opened = « { $name } » a été fait à partir du fichier
home-file-opened-added = « { $name } » a été fait à partir du fichier. { $count ->
    [one] Une œuvre a été ajoutée
    [many] { $count } œuvres ont été ajoutées
   *[other] { $count } œuvres ont été ajoutées
} à votre bibliothèque.
home-file-problems = { $count ->
    [one] Une œuvre n’a pas pu être importée dans votre bibliothèque. Elle est citée telle qu’elle était dans le fichier.
    [many] { $count } œuvres n’ont pas pu être importées dans votre bibliothèque. Elles sont citées telles qu’elles étaient dans le fichier.
   *[other] { $count } œuvres n’ont pas pu être importées dans votre bibliothèque. Elles sont citées telles qu’elles étaient dans le fichier.
}
# The dialog that asks what is to be done with the works a project file cites.
home-file-references-title = Les œuvres que le projet cite
home-file-references-about = Avant que « { $name } » soit fait : ces œuvres sont dans votre bibliothèque, mais pas telles qu’elles sont dans le fichier.
home-file-in-file = Dans le fichier
home-file-same-id = Dans votre bibliothèque sous la même référence, écrite autrement
home-file-merged = Dans votre bibliothèque, fusionnée dans celle-ci
home-file-what-to-do = Ce qu’il faut en faire
home-file-keep-library = Garder celle de votre bibliothèque
home-file-take-file = Prendre celle du fichier dans votre bibliothèque
home-file-keep-both = Garder les deux
home-file-cite-library = Citer celle de votre bibliothèque
home-file-add-another = Ajouter celle du fichier comme une autre œuvre
home-file-same = { $count ->
    [one] Une œuvre est dans votre bibliothèque telle qu’elle est dans le fichier.
    [many] { $count } œuvres sont dans votre bibliothèque telles qu’elles sont dans le fichier.
   *[other] { $count } œuvres sont dans votre bibliothèque telles qu’elles sont dans le fichier.
}
home-file-added = { $count ->
    [one] Une œuvre n’est pas dans votre bibliothèque, et y est ajoutée.
    [many] { $count } œuvres ne sont pas dans votre bibliothèque, et y sont ajoutées.
   *[other] { $count } œuvres ne sont pas dans votre bibliothèque, et y sont ajoutées.
}
home-file-make = Créer le projet

## A project as Org: its readable copy in a folder, and a new project made of an Org file

home-org-open = Ouvrir un fichier Org…
home-org-open-title = Ouvrir un fichier Org
# The kind of file, in the dialog that asks for one.
home-org-filter = Fichier Org
home-org-open-failed = Le fichier Org n’a pas pu être ouvert
home-org-save-title = Choisir le dossier où enregistrer le projet en Org
home-org-saved = « { $name } » a été enregistré en Org
home-org-save-failed = Le projet n’a pas pu être enregistré en Org

## Changes of the home undone and done again
home-redo = Rétablir
# What was undone, as the message of the change said it.
home-undone = Annulé : { $what }
home-undo-failed = Cela n’a pas pu être annulé

## What a change of the home says, with a way back
home-renamed = « { $old } » s’appelle maintenant « { $name } »
home-project-made = « { $name } » a été créé
home-folder-made = Le dossier « { $name } » a été créé
home-moved-many-to = { $count ->
    [one] { $count } dossier ou projet a été déplacé dans { $folder }
    [many] { $count } dossiers ou projets ont été déplacés dans { $folder }
   *[other] { $count } dossiers ou projets ont été déplacés dans { $folder }
}
home-moved-many-out = { $count ->
    [one] { $count } dossier ou projet n’est plus dans aucun dossier
    [many] { $count } dossiers ou projets ne sont plus dans aucun dossier
   *[other] { $count } dossiers ou projets ne sont plus dans aucun dossier
}
home-folder-deleted = Le dossier « { $name } » a été supprimé ; ce qu’il contenait est remonté
home-deleted-many = { $count ->
    [one] { $count } dossier ou projet a été supprimé
    [many] { $count } dossiers ou projets ont été supprimés
   *[other] { $count } dossiers ou projets ont été supprimés
}
home-not-in-trash = Le projet n’est plus dans la corbeille.
home-folders-delete-title = { $count ->
    [one] Supprimer { $count } dossier ?
    [many] Supprimer { $count } dossiers ?
   *[other] Supprimer { $count } dossiers ?
}
home-folders-delete-message = Les dossiers et les projets qu’ils contiennent sont gardés : ils remontent là où étaient les dossiers.
home-folders-delete-confirm = Supprimer les dossiers
home-delete-many-title = { $count ->
    [one] Supprimer { $count } projet ?
    [many] Supprimer { $count } projets ?
   *[other] Supprimer { $count } projets ?
}
home-delete-many-message = Les projets sont mis à la corbeille de Glaukopis, d’où ils peuvent être ramenés. Vos références ne sont pas touchées.
home-delete-many-shared = Les projets sont mis à la corbeille de Glaukopis, d’où ils peuvent être ramenés. Ceux que vous partagez restent sur le serveur et chez les autres.
home-delete-many-confirm = Supprimer les projets
