# The projects: the list of them, and what is done with them.

home-title = Projets
home-join = Rejoindre un projet partagé
home-from-document = Un projet à partir d’un document…
home-new = Nouveau projet

## The two forms of the page: the last used projects as cards, all of them as a list

home-shown = Ce qui est affiché
home-recent = Derniers utilisés
home-all = Tous les projets
# Under the cards, when there are more projects than they show.
home-show-all = Afficher les { $count } projets
# The button that opens the menu of the page.
home-page-menu = Plus
home-search = Trouver un projet
home-search-none = Aucun projet ne porte ce nom.
home-list-none = Il n’y a pas de projets.

## Folders of projects

home-new-folder = Nouveau dossier
home-folder-new-inside = Nouveau dossier à l’intérieur…
home-folder-rename-title = Renommer le dossier
home-folder-name-placeholder = Ce que le dossier contient
home-folder-name-missing = Donnez un nom au dossier.
home-folder-projects = { $count ->
    [one] { $count } projet
    [many] { $count } projets
   *[other] { $count } projets
}
home-menu-move = Déplacer dans un dossier
home-menu-out = Hors des dossiers
home-folder-delete-title = Supprimer le dossier « { $name } » ?
home-folder-delete-message = Les dossiers et les projets qu’il contient sont gardés : ils remontent là où était le dossier.
home-folder-delete-confirm = Supprimer le dossier
home-folder-failed = Cela n’a pas pu être fait avec le dossier
home-moved-to = « { $name } » a été déplacé dans { $folder }
home-moved-out = « { $name } » n’est plus dans aucun dossier
home-move-failed = Le projet n’a pas pu être déplacé

## A map of the projects

home-map-menu = Une carte des projets…
home-map-title = Une carte des projets
home-map-about = Un nouveau projet, avec une carte : les dossiers comme éléments, et sous chaque dossier les projets qu’il contient.
home-map-name-default = Projets
home-map-what = Ce que la carte contient
home-map-names = Seulement les noms
home-map-names-hint = Un élément par projet, avec sa description comme texte.
home-map-everything = Avec tout ce qu’ils contiennent
home-map-everything-hint = Sous chaque projet ses cartes, et sous chaque carte tous ses éléments, avec leurs noms et leurs textes.
home-map-note = Les citations gardent leurs références. Un renvoi à une figure ou à une partie ne désigne rien dans le nouveau projet, et les commentaires restent en arrière.
home-map-reading = Lecture de « { $name } »…
home-map-working = Création de la carte…
home-map-make = Créer la carte
home-map-failed = La carte des projets n’a pas pu être créée

## When there are none yet

home-welcome = Bienvenue dans Glaukopis
home-welcome-text = Un projet contient le travail sur un livre ou un article : les cartes de vos idées, les textes que vous y écrivez, et les références sur lesquelles ils reposent.
home-begin = Commencer un projet

## A project in the list

# Under the names of the first four maps.
home-more-maps = et { $count } de plus
home-maps = { $count ->
    [one] { $count } carte
    [many] { $count } cartes
   *[other] { $count } cartes
}
home-elements = { $count ->
    [one] { $count } élément
    [many] { $count } éléments
   *[other] { $count } éléments
}
home-words = { $count ->
    [one] { $count } mot
    [many] { $count } mots
   *[other] { $count } mots
}
home-references = { $count ->
    [one] { $count } référence
    [many] { $count } références
   *[other] { $count } références
}
home-not-begun = Pas commencé
home-shared = Partagé
# "ago" is how long ago it was: "3 hours ago", "yesterday", "12 March".
home-changed = Dernière modification : { $ago }
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
