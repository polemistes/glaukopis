# The files of the library: a store of their own beside the pictures, in
# folders of their own, each file belonging to no reference, to one or to
# several. The view stands in the library's place.

files-title = Fichiers de la bibliothèque
files-all = Tous les fichiers
files-file = Fichier
files-unread = Les fichiers de la bibliothèque n’ont pas pu être lus
files-count = { $count ->
    [one] { $count } fichier
    [many] { $count } fichiers
   *[other] { $count } fichiers
}
files-shown-of = { $shown } sur { $count ->
    [one] { $count } fichier
    [many] { $count } fichiers
   *[other] { $count } fichiers
}
files-selected-of = { $selected ->
    [one] { $selected } sélectionné sur { $count }
    [many] { $selected } sélectionnés sur { $count }
   *[other] { $selected } sélectionnés sur { $count }
}
files-selected = { $count ->
    [one] { $count } fichier sélectionné
    [many] { $count } fichiers sélectionnés
   *[other] { $count } fichiers sélectionnés
}

## The kinds of files.

files-kind = Type
files-kind-pdf = PDF
files-kind-picture = Image
files-kind-document = Document
files-kind-other = Autre fichier

## Taking in.

files-add = Ajouter des fichiers…
files-add-title = Ajouter des fichiers à la bibliothèque
files-add-folder = Ajouter un dossier…
files-add-folder-title = Ajouter un dossier à la bibliothèque
files-more = D’autres façons d’ajouter
files-taking-in = { $count ->
    [one] Ajout d’un fichier…
    [many] Ajout de { $count } fichiers et dossiers…
   *[other] Ajout de { $count } fichiers et dossiers…
}
files-taking-in-progress = Ajout de { $done } sur { $count } : { $name }
files-taken-in = { $count ->
    [one] Un fichier ajouté
    [many] { $count } fichiers ajoutés
   *[other] { $count } fichiers ajoutés
}
files-same = { $count } déjà là
files-folders-made = { $count ->
    [one] un dossier créé
    [many] { $count } dossiers créés
   *[other] { $count } dossiers créés
}
files-problems = { $count ->
    [one] un n’a pas pu être lu
    [many] { $count } n’ont pas pu être lus
   *[other] { $count } n’ont pas pu être lus
}
files-taken-none = Rien n’a été ajouté
files-take-in-failed = Les fichiers n’ont pas pu être ajoutés

## Empty, searched and filtered.

files-empty = Pas encore de fichiers
files-empty-text = Ajoutez des fichiers ou un dossier, ou déposez-les ici. Tout type de fichier est gardé, dans la réserve propre de la bibliothèque, et un dossier garde les dossiers qu’il contient.
files-folder-empty = Rien dans ce dossier
files-folder-empty-text = Déposez des fichiers ici, ou faites-les glisser ici depuis un autre dossier.
files-search = Rechercher dans les fichiers
files-search-in = Rechercher dans { $name }
files-search-clear = Effacer la recherche
files-nothing-found = Rien trouvé
files-nothing-found-text = Aucun fichier n’a ces mots dans son nom, ni dans sa référence.
files-nothing-passes = Aucun fichier ici ne passe les filtres.
files-filters = Filtrer
files-filters-on = { $count ->
    [one] Filtre : { $count } actif
    [many] Filtre : { $count } actifs
   *[other] Filtre : { $count } actifs
}
files-filter-kind = Type
files-filter-all = Tous les types
files-filter-pdf = PDF
files-filter-picture = Images
files-filter-document = Documents
files-filter-other = Autres fichiers
files-filter-unassigned = Sans référence seulement
files-filter-search-all = Rechercher dans tous les dossiers
files-filter-clear = Effacer les filtres
files-sort = Trier
files-sort-name = Par nom
files-sort-reference = Par référence
files-sort-added = Par date d’ajout
files-sort-size = Par taille
files-sort-descending = Décroissant

## The list.

files-no-reference = Sans référence
files-missing = manquant
files-reveal = Afficher dans le gestionnaire de fichiers
files-move = Déplacer…
files-move-to = Déplacer vers
files-move-failed = Le fichier n’a pas pu être déplacé
files-at-top = Tout en haut, dans aucun dossier

## Folders.

files-folders = Dossiers
files-folders-hint = Les dossiers rangent les fichiers : une place pour chaque fichier. Un dossier ajouté garde les dossiers qu’il contient.
files-folder = Dossier
files-folder-new = Nouveau dossier
files-folder-new-in = Nouveau dossier dans { $name }
files-folder-new-inside = Nouveau dossier à l’intérieur
files-folder-name = Nom du dossier
files-folder-name-failed = Le dossier n’a pas pu être nommé
files-folder-move-to = Déplacer vers
files-folder-to-top = Tout en haut
files-folder-move-failed = Le dossier n’a pas pu être déplacé
files-folder-expand = Ouvrir
files-folder-collapse = Fermer
files-folder-delete = Supprimer le dossier
files-folder-delete-title = Supprimer le dossier « { $name } » ?
files-folder-delete-empty = Le dossier est vide.
files-folder-delete-subfolders = { $count ->
    [one] Le dossier contient un sous-dossier. Que doit-il en advenir ?
    [many] Le dossier contient { $count } sous-dossiers. Que doit-il en advenir ?
   *[other] Le dossier contient { $count } sous-dossiers. Que doit-il en advenir ?
}
files-folder-move-up = Remonter d’un niveau
files-folder-delete-all-under = Supprimer tous les dossiers qu’il contient
files-folder-delete-files = { $count ->
    [one] Le dossier contient un fichier. Que doit-il en advenir ?
    [many] Le dossier contient { $count } fichiers. Que doit-il en advenir ?
   *[other] Le dossier contient { $count } fichiers. Que doit-il en advenir ?
}
files-folder-delete-files-under = { $count ->
    [one] Le dossier et les dossiers qu’il contient ont un fichier. Que doit-il en advenir ?
    [many] Le dossier et les dossiers qu’il contient ont { $count } fichiers. Que doit-il en advenir ?
   *[other] Le dossier et les dossiers qu’il contient ont { $count } fichiers. Que doit-il en advenir ?
}
# Said after the question above, where files to be deleted belong to references.
files-folder-delete-files-assigned = { $count ->
    [one] L’un d’eux appartient à une référence, qui le perdrait.
    [many] { $count } d’entre eux appartiennent à des références, qui les perdraient.
   *[other] { $count } d’entre eux appartiennent à des références, qui les perdraient.
}
files-folder-files-to-parent = Placer dans le dossier parent
files-folder-files-delete = Supprimer
files-folder-delete-failed = Le dossier n’a pas pu être supprimé

## The pane of a file.

files-name = Nom
files-references = Références
files-unassigned = Sans référence : le fichier n’appartient à aucune référence.
files-assign = Attribuer à une référence…
files-assign-title = Attribuer « { $name } » à une référence
files-assign-failed = Le fichier n’a pas pu être attribué
files-unassign = Retirer de « { $name } »
files-unassign-failed = Le fichier n’a pas pu être retiré de la référence
files-about = À propos du fichier
files-size = Taille
files-pages = Pages
# $text is one of the three below.
files-pdf-pages = { $count ->
    [one] { $count } page · { $text }
    [many] { $count } pages · { $text }
   *[other] { $count } pages · { $text }
}
files-pdf-has-text = avec texte
files-pdf-no-text = sans texte
# Shown as the pages of a PDF that could not be looked at; the reason is what the reading said.
files-pdf-unread = n’a pas pu être lu : { $reason }
files-pdf-some-text = { $count ->
    [one] une page sans texte
    [many] { $count } pages sans texte
   *[other] { $count } pages sans texte
}
files-added = Ajouté
files-origin = Provenance
files-searchable = Rendre interrogeable…
files-read-into = Importer le texte comme carte…
files-read-text = Lire le texte…
files-bring-in = Importer comme éléments…
files-rename-failed = Le fichier n’a pas pu être renommé

## Removing.

files-remove = Retirer
files-remove-title = Retirer « { $name } » de la bibliothèque ?
files-remove-message = Le fichier est supprimé de la réserve de la bibliothèque.
files-remove-message-assigned = { $count ->
    [one] Le fichier appartient à { $names }, qui le perd. Il est supprimé de la réserve de la bibliothèque.
    [many] Le fichier appartient à { $count } références, { $names }, qui le perdent. Il est supprimé de la réserve de la bibliothèque.
   *[other] Le fichier appartient à { $count } références, { $names }, qui le perdent. Il est supprimé de la réserve de la bibliothèque.
}
files-remove-many-title = Retirer { $count } fichiers de la bibliothèque ?
files-remove-many-message = Les fichiers sont supprimés de la réserve de la bibliothèque.
files-remove-many-assigned = { $count ->
    [one] L’un d’eux appartient à une référence, qui le perd. Ils sont supprimés de la réserve de la bibliothèque.
    [many] { $count } d’entre eux appartiennent à des références, qui les perdent. Ils sont supprimés de la réserve de la bibliothèque.
   *[other] { $count } d’entre eux appartiennent à des références, qui les perdent. Ils sont supprimés de la réserve de la bibliothèque.
}
files-remove-failed = Le fichier n’a pas pu être retiré
# Said in the question where removing the files leaves folders empty; folders empty before are not counted.
files-remove-folders-left = { $count ->
    [one] Un dossier en reste vide.
    [many] { $count } dossiers en restent vides.
   *[other] { $count } dossiers en restent vides.
}
files-remove-with-folders = Retirer, avec les dossiers vides
files-remove-keep-folders = Retirer, garder les dossiers
files-removing = Retrait de { $count } fichiers…
files-removed = { $count ->
    [0] Aucun fichier retiré
    [one] Un fichier retiré
    [many] { $count } fichiers retirés
   *[other] { $count } fichiers retirés
}
files-removed-folders = { $count ->
    [one] un dossier vide avec eux
    [many] { $count } dossiers vides avec eux
   *[other] { $count } dossiers vides avec eux
}
# When references are deleted: their files go too, unless another reference has them.
files-remove-with-files = Supprimer avec les fichiers

## Choosing a reference.

files-choose-reference = Choisir une référence
files-choose-search = Rechercher par auteur, titre ou année
files-choose-references = Références
files-choose-none = Aucune référence n’a ces mots.
files-choose-empty = La bibliothèque n’a pas encore de références.
files-choose-more = … et { $count } de plus : recherchez pour les trouver
files-choose-files = Fichiers de la bibliothèque
files-choose-files-search = Rechercher par nom, ou par l’œuvre à laquelle un fichier appartient
files-choose-files-none = Aucun fichier ne correspond.
files-choose-add = { $count ->
    [0] Ajouter des fichiers
    [one] Ajouter un fichier
    [many] Ajouter { $count } fichiers
   *[other] Ajouter { $count } fichiers
}
files-added-to = { $count ->
    [one] Un fichier ajouté à « { $title } »
    [many] { $count } fichiers ajoutés à « { $title } »
   *[other] { $count } fichiers ajoutés à « { $title } »
}
files-choose-new = Nouvelle référence…
files-choose = Choisir

## Nothing selected.

files-none-selected = Aucun fichier sélectionné
files-none-selected-text = Sélectionnez un fichier pour voir ce qu’on en sait et ce qu’on peut en faire.
# $name is the folder in view, or “All files”.
files-tally = { $name } : { $count ->
    [one] { $count } fichier
    [many] { $count } fichiers
   *[other] { $count } fichiers
}, { $unassigned } sans référence

## The going-through: files given to their references.

files-go-through-head = Passer les fichiers en revue, pour les donner à leurs références…
files-go-through-chosen = { $count ->
    [one] Le passer en revue…
    [many] Passer ces { $count } en revue…
   *[other] Passer ces { $count } en revue…
}
files-go-through-nothing = Tous les fichiers ici appartiennent à une référence
files-folder-go-through = Passer en revue les fichiers sans référence…
# The bar at the head of the files, while files of the folder in view belong to no reference.
files-unassigned-here = { $count ->
    [one] Un fichier ici n’appartient à aucune référence.
    [many] { $count } fichiers ici n’appartiennent à aucune référence.
   *[other] { $count } fichiers ici n’appartiennent à aucune référence.
}
files-unassigned-go = Les passer en revue…
files-unassigned-hide = Cacher
files-going-title = Donner les fichiers à leurs références
files-going-subtitle = { $count ->
    [one] Un fichier
    [many] { $count } fichiers
   *[other] { $count } fichiers
}
files-going-finding = { $count ->
    [one] Recherche de ce qu’est le fichier…
    [many] Recherche de ce que sont les { $count } fichiers…
   *[other] Recherche de ce que sont les { $count } fichiers…
}
files-going-progress = { $done } sur { $count } : { $name }
files-going-finding-hint = Dans chaque fichier sont cherchés un identifiant et un titre, son nom est lu, et sa première page est comparée à la bibliothèque. Ce qui est trouvé est gardé tant que l’application reste ouverte.
files-going-stop = Arrêter
files-going-failed = Ce que sont les fichiers n’a pas pu être découvert
files-going-all-certain = { $count ->
    [one] Celui trouvé avec certitude :
    [many] Les { $count } trouvés avec certitude :
   *[other] Les { $count } trouvés avec certitude :
}
files-going-all-probable = { $count ->
    [one] Celui jugé probable :
    [many] Les { $count } jugés probables :
   *[other] Les { $count } jugés probables :
}
files-going-all-new = { $count ->
    [one] Celui qui est nouveau, venu des services en ligne :
    [many] Les { $count } nouveaux, venus des services en ligne :
   *[other] Les { $count } nouveaux, venus des services en ligne :
}
files-going-all-nothing = { $count ->
    [one] Celui pour lequel rien n’a été trouvé :
    [many] Les { $count } pour lesquels rien n’a été trouvé :
   *[other] Les { $count } pour lesquels rien n’a été trouvé :
}
files-going-this-new = Nouvelle référence
files-going-show-all = Afficher les { $count }
files-going-what = Ce que devient { $name }
files-going-this = Celle-ci
files-going-other = Une autre…
files-going-new = Nouvelle référence…
files-going-later = Plus tard
files-going-certain = certain
files-going-probable = probable
files-going-which = Quelle œuvre
# $origin is where the description comes from: a service, or the file.
files-going-lookup = Une nouvelle référence · d’après { $origin }
files-going-nothing = Rien trouvé
files-going-chosen = Choisie
files-going-made-here = Créée ici
files-going-none = Aucun des fichiers n’a pu être passé en revue.
# The files the going-through did not reach, as when it was stopped: they keep no reference, and the bar offers them again.
files-going-not-reached = { $count ->
    [one] Un fichier n’a pas été examiné. Il reste tel quel, pour une autre fois.
    [many] { $count } fichiers n’ont pas été examinés. Ils restent tels quels, pour une autre fois.
   *[other] { $count } fichiers n’ont pas été examinés. Ils restent tels quels, pour une autre fois.
}
files-going-counts = { $assign } à attribuer, { $later } plus tard
files-going-done = { $count ->
    [0] Rien à donner
    [one] Donner un fichier à sa référence
    [many] Donner { $count } fichiers à leurs références
   *[other] Donner { $count } fichiers à leurs références
}
files-going-applying = Attribution des fichiers à leurs références…
files-going-source = Les fichiers de la bibliothèque
files-going-assigned = { $count ->
    [0] Aucun fichier attribué
    [one] Un fichier attribué
    [many] { $count } fichiers attribués
   *[other] { $count } fichiers attribués
}
files-going-made = { $count ->
    [one] une nouvelle référence
    [many] { $count } nouvelles références
   *[other] { $count } nouvelles références
}
files-going-later-count = { $count ->
    [one] { $count } laissé pour plus tard
    [many] { $count } laissés pour plus tard
   *[other] { $count } laissés pour plus tard
}
files-going-undo = Annuler
files-going-undone = { $count ->
    [0] Aucun fichier repris
    [one] Un fichier repris
    [many] { $count } fichiers repris
   *[other] { $count } fichiers repris
}
files-going-undone-made = { $count ->
    [one] une nouvelle référence retirée
    [many] { $count } nouvelles références retirées
   *[other] { $count } nouvelles références retirées
}
# In the menu of the head of the files, while the last going-through can be undone.
files-undo-last = { $count ->
    [one] Annuler : un fichier donné à sa référence
    [many] Annuler : { $count } fichiers donnés à leurs références
   *[other] Annuler : { $count } fichiers donnés à leurs références
}

## Exporting.

files-export-folder-title = Choisir le dossier où exporter
files-export-title = { $count ->
    [one] Exporter un fichier
    [many] Exporter { $count } fichiers
   *[other] Exporter { $count } fichiers
}
files-export-all-what = Chaque fichier est écrit dans le dossier que vous choisirez ensuite, sous le nom de sa référence, Auteur Année - Titre, ou sous le sien quand il n’en a pas ; les dossiers de la bibliothèque y deviennent des dossiers.
files-export-folder-what = Les fichiers du dossier sont écrits dans celui que vous choisirez ensuite, sous les noms de leurs références, ou sous le leur quand ils n’en ont pas ; les dossiers qu’il contient y deviennent des dossiers.
files-export-files-what = { $count ->
    [one] Le fichier est écrit dans le dossier que vous choisirez ensuite, sous le nom de sa référence, ou sous le sien quand il n’en a pas.
    [many] Les fichiers sont écrits dans le dossier que vous choisirez ensuite, sous les noms de leurs références, ou sous le leur quand ils n’en ont pas.
   *[other] Les fichiers sont écrits dans le dossier que vous choisirez ensuite, sous les noms de leurs références, ou sous le leur quand ils n’en ont pas.
}
files-export-bib = Avec un references.bib
files-export-bib-hint = Les œuvres auxquelles appartiennent les fichiers, chacune nommant ses fichiers là où ils sont écrits, pour que Zotero ou JabRef lise le dossier en entier.
files-export-go = Choisir le dossier…
files-exporting = { $count ->
    [one] Exportation d’un fichier…
    [many] Exportation de { $count } fichiers…
   *[other] Exportation de { $count } fichiers…
}
files-exporting-progress = Exportation de { $done } sur { $count } : { $name }
files-exported = { $count ->
    [0] Aucun fichier exporté
    [one] Un fichier exporté
    [many] { $count } fichiers exportés
   *[other] { $count } fichiers exportés
}
files-exported-folders = { $count ->
    [one] un dossier
    [many] { $count } dossiers
   *[other] { $count } dossiers
}
files-exported-bib = avec un references.bib
files-exported-stopped = arrêté alors qu’il en restait { $count }
files-exported-show = Afficher
files-export-failed = Les fichiers n’ont pas pu être exportés
files-reveal-failed = Le dossier n’a pas pu être affiché
files-export = Exporter…
files-export-chosen = Exporter ces { $count }…
files-export-all = Exporter tous les fichiers…

## A file shown in a side of the window (2026-10-26).

files-show = Ajouter aux onglets d’un projet…
files-open-elsewhere = Ouvrir dans un autre logiciel

# One place for files: images are files of the library (ADR 0070).
files-add-images = Ajouter des images…
# After images were taken in to be figures; $name is the first of them.
files-images-taken-in = { $count ->
    [one] « { $name } » est dans la bibliothèque
    [many] { $count } images sont dans la bibliothèque
   *[other] { $count } images sont dans la bibliothèque
}

# One place for files, the view (ADR 0070).
files-view = Affichage
files-as-list = Liste
files-as-grid = Vignettes
files-size-small = Petites
files-size-medium = Moyennes
files-size-large = Grandes
files-include-subfolders = Inclure les sous-dossiers
files-sort-kind = Par type
# Where a file is used, where it belongs to no reference: as a figure.
files-column-used = Utilisé dans
files-used-figure = Une figure dans { $project }
files-used-figures = Une figure dans { $count } projets
files-used-nowhere = Pas encore utilisé
files-pixels-label = Pixels
files-pixels = { $width } × { $height }
files-alt = Ce qu’il montre, en mots
files-preview-none = Pas d’aperçu pour ce type de fichier
# Before the name of the file a copy was made from, to be a figure, by editing or to be smaller; the name is a link.
files-made-from = Fait à partir de
# Said when a file that is a figure in projects is to be removed.
files-remove-used = { $count ->
    [one] C’est une figure dans un projet, où rien ne s’affichera à sa place.
    [many] C’est une figure dans { $count } projets, où rien ne s’affichera à sa place.
   *[other] C’est une figure dans { $count } projets, où rien ne s’affichera à sa place.
}

# A simple image editor (docs/plans/a-simple-image-editor.md): the copies made from a file, as links.
files-copies = Copies faites à partir de ce fichier

# The tabs opened, files by their references, a file read in the library (docs/plans/the-tabs-opened-files-by-their-references-and-a-file-read-in-the-library.md).
files-read = Lire
files-column-people = Personnes
files-column-year = Année
files-column-title = Titre
files-column-publisher = Éditeur
files-sort-year = Par année
files-sort-title = Par titre
files-sort-publisher = Par éditeur
# The translators after the authors or editors: "Lord; tr. Smith".
files-translated = trad. { $names }

# Files by their references, named on request, and a menu of projects for the tabs.
files-tabs-no-project = Aucun projet où l’ajouter
files-added-to-tabs = Ajouté aux onglets de « { $project } »
files-already-in-tabs = Déjà dans les onglets de « { $project } »
files-show-tabs = Afficher
files-name-by-reference = Nommer d’après la référence
files-name-by-references = Nommer d’après leurs références
files-named = { $count ->
    [one] Un fichier nommé d’après sa référence
    [many] { $count } fichiers nommés d’après leurs références
   *[other] { $count } fichiers nommés d’après leurs références
}
files-named-kept = { $count ->
    [one] Un fichier sans référence a gardé son nom
    [many] { $count } fichiers sans référence ont gardé leur nom
   *[other] { $count } fichiers sans référence ont gardé leur nom
}
files-named-none = Les fichiers portaient déjà le nom de leur référence
