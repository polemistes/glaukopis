# The notebook: what is collected outside all projects, as notes (record 0101).

## The place in the row, and the page

notebook-title = Carnet
notebook-notes = Notes
notebook-note = Note
notebook-search = Rechercher dans les notes
notebook-search-clear = Effacer la recherche
notebook-new-note = Nouvelle note
notebook-add-files = Ajouter des fichiers…
notebook-add-files-title = Ajouter des fichiers au carnet
notebook-empty = Le carnet est vide
    .text = Recueillez ici ce qui se présente, en dehors de tous les projets : mots, images et fichiers, chacun une note qui garde d’où elle vient.
notebook-unreadable = Le carnet n’a pas pu être lu
notebook-nothing-found = Aucune note trouvée
notebook-empty-note = Note vide
notebook-holds-picture = Une image
notebook-holds-file = Un fichier
notebook-holds-passage = Des mots recueillis
notebook-resize-list = Largeur de la liste des notes
notebook-choose = Choisissez une note, ou faites-en une nouvelle
notebook-selected = { $count } notes sélectionnées
notebook-deleted = { $count ->
    [one] Note supprimée
    [many] { $count } notes supprimées
   *[other] { $count } notes supprimées
}
notebook-redo = Rétablir
notebook-name = Nom
notebook-write = Écrivez, ou collez ce que vous avez trouvé
# What became of a note: "Used in ‹project› · quotation".
notebook-went = Ce qu’elle est devenue
notebook-used-in = Utilisée dans
notebook-went-text = texte
notebook-went-quotation = citation
notebook-went-figure = image
notebook-went-reference = référence
notebook-went-file = fichier
# How a box is shown: as its surface, or as a list.
notebook-shown-as = Affichage
notebook-surface = Surface
notebook-list = Liste
notebook-close-note = Fermer la note
notebook-resize-column = Largeur des boîtes
notebook-resize-note = Largeur de la note
notebook-box-empty = Aucune note dans cette boîte
# What the plugin for Firefox handed over has arrived.
notebook-arrived = Ajouté au carnet
notebook-arrived-from = Ajouté au carnet : { $title }
notebook-arrived-many = { $count ->
    [one] Une chose ajoutée au carnet
    [many] { $count } choses ajoutées au carnet
   *[other] { $count } choses ajoutées au carnet
}

## A note and its text

# The first box of the notebook, named so in the copy of the notebook written as Org until it is given a name.
notebook-org-first-box = Non classées

# A file a note holds, as it stands in the note: opened by two presses.
notebook-file-open-named = Ouvrir { $name }
notebook-file-not-here = Le fichier n’est pas sur cet ordinateur

# Files that could not be taken in as notes, said in one message.
notebook-files-not-taken = Certains fichiers n’ont pas pu être recueillis

# Words selected in a file read in Glaukopis, or a part of a page marked, sent to the notebook as a new note.
notebook-from-file-added = Ajouté au carnet
notebook-from-file-not-added = N’a pas pu être ajouté au carnet

## Sources

notebook-source-none = Aucune source
# Where a photograph was taken, in degrees.
notebook-source-north = { $degrees }° N
notebook-source-south = { $degrees }° S
notebook-source-east = { $degrees }° E
notebook-source-west = { $degrees }° O

notebook-sources = Sources
notebook-source = Source
notebook-source-sort = Ce que c’est
notebook-source-web = Page web
notebook-source-reference = Référence
notebook-source-other = Autre
notebook-source-url = Adresse
notebook-source-page-title = Titre
notebook-source-choose-reference = Choisir une référence…
notebook-source-place = Lieu
notebook-source-words = D’où cela vient
notebook-source-file-name = Nom
notebook-source-file-changed = Dernière modification
# Of a photograph: when it was taken, and where.
notebook-source-file-taken = Prise
notebook-source-file-where = Où
notebook-source-make-reference = Faire une référence
notebook-source-in-library = Dans la bibliothèque :
notebook-source-passages = Ce qui en a été recueilli
notebook-source-changed = Modifié depuis qu’il a été recueilli. Il disait :
notebook-source-bring-back = Ramener
notebook-source-own-words = Mes propres mots

## Boxes and tags

notebook-all-notes = Toutes les notes
notebook-boxes = Boîtes
# The first box, where everything lands, until it is given a name.
notebook-box-unsorted = Non classées
notebook-box-new = Nouvelle boîte
notebook-box-name = Nom de la boîte
notebook-box-receives = Les notes venues de l’extérieur arrivent ici
notebook-box-delete-title = Supprimer { $name } ?
notebook-box-delete-message = { $count ->
    [one] La note qu’elle contient va dans { $first }.
    [many] Les { $count } notes qu’elle contient vont dans { $first }.
   *[other] Les { $count } notes qu’elle contient vont dans { $first }.
}
notebook-move-to = Déplacer vers
notebook-tags = Étiquettes
notebook-tag-name = Nom de l’étiquette
notebook-tag-remove = Retirer de toutes les notes
notebook-tag-remove-title = Retirer { $tag } de toutes les notes ?
notebook-tag-remove-message = { $count ->
    [one] Une note la porte.
    [many] { $count } notes la portent.
   *[other] { $count } notes la portent.
}
notebook-tag-merge-title = Renommer { $from } en { $to } ?
notebook-tag-merge-message = { $from } et { $to } ne feront plus qu’une étiquette.
notebook-tags-off = Tout afficher, quelles que soient les étiquettes
# The field under the name of a note, where a tag is added.
notebook-tag-add = Ajouter une étiquette
notebook-tag-take-away = Retirer { $tag }
notebook-tags-offered = Étiquettes
notebook-join = Fusionner
notebook-joined = { $count } notes fusionnées
notebook-divide = Diviser

## The surface

notebook-surface-of-box = Surface de la boîte
notebook-surface-not-placed = Pas encore placées
notebook-surface-empty-note = Note vide
notebook-surface-new-note-here = Nouvelle note ici
notebook-surface-show-all = Tout afficher
notebook-surface-link-handle = Faire glisser vers une autre note pour les lier

## Finding, and starting texts

# The filters of the list, in a window at a button beside the field that finds.
notebook-filters = Filtrer
notebook-filters-on = { $count ->
    [one] Filtre : { $count } actif
    [many] Filtre : { $count } actifs
   *[other] Filtre : { $count } actifs
}
notebook-filter-holds = Contient
notebook-filter-picture = Une image
notebook-filter-file = Un fichier
notebook-filter-passage = Des mots recueillis
notebook-filter-link = Un lien vers une autre note
notebook-filter-collected = Recueillie
notebook-filter-from = De
notebook-filter-to = À
notebook-filter-came = Provenance
notebook-filter-web = Une page web
notebook-filter-reference = Une référence
notebook-filter-file-source = Un fichier
notebook-filter-other = Autre
notebook-filter-no-source = Aucune source
notebook-filter-unseen = Non consultée
notebook-filter-use = Utilisation
notebook-filter-use-all = Toutes
notebook-filter-used = Utilisée dans un projet
notebook-filter-unused = Non utilisée
notebook-filter-clear = Effacer les filtres
notebook-nothing-passes = Aucune note de la vue ne passe les filtres.
# A note taken in that has not been looked at: the dot before its name.
notebook-unseen = Non consultée
# Words read in the images of notes, kept for finding.
notebook-read-text = Lire le texte
notebook-read-again = Lire de nouveau
notebook-text-read = Texte lu
notebook-reading = { $count ->
    [one] Lecture de { $name }…
    [many] Lecture de { $name } ({ $done } sur { $count })…
   *[other] Lecture de { $name } ({ $done } sur { $count })…
}
notebook-reading-stop = Arrêter
notebook-read-done = { $count ->
    [one] Le texte de l’image a été lu
    [many] Le texte de { $count } images a été lu
   *[other] Le texte de { $count } images a été lu
}
notebook-read-failed = Le texte de { $name } n’a pas pu être lu
# Starting texts: a new note that begins with lines given.
notebook-new-note-from = Nouvelle note à partir d’un texte de départ
notebook-starts = Textes de départ…
notebook-starts-title = Textes de départ
notebook-start-new = Nouveau
notebook-start-unnamed = Sans nom
notebook-start-name = Nom
notebook-start-lines = Lignes
notebook-start-kind = Ses lignes sont
notebook-start-up = Monter
notebook-start-down = Descendre
notebook-start-none = Pas encore de textes de départ.
notebook-start-delete-title = Supprimer { $name } ?
notebook-start-delete-message = Les notes commencées avec lui restent telles qu’elles sont.

## Notes from other programs

notebook-import = Importer des notes…
notebook-import-title = Importer des notes
notebook-import-folder = Un dossier…
notebook-import-file = Un fichier…
notebook-import-programs = Un dossier d’Obsidian, de Joplin, de Notion, de Bear, de Google Keep ou de OneNote, ou de Markdown et de texte ; un fichier d’Evernote (.enex) ou de OneNote (.one), ou un seul fichier Markdown.
notebook-import-choose-folder = Choisir un dossier de notes
notebook-import-choose-file = Choisir un fichier de notes
notebook-import-filter = Notes
notebook-import-kind = { $kind ->
    [obsidian] Notes d’Obsidian
    [joplin] Notes de Joplin
    [notion] Notes de Notion
    [bear] Notes de Bear
    [evernote] Notes d’Evernote
    [keep] Notes de Google Keep
    [onenote] Notes de OneNote
   *[markdown] Fichiers Markdown et texte
}
notebook-import-count = { $count ->
    [one] Une note
    [many] { $count } notes
   *[other] { $count } notes
}
notebook-import-files = { $count ->
    [0] aucune image ni aucun fichier
    [one] une image ou un fichier
    [many] { $count } images et fichiers
   *[other] { $count } images et fichiers
}
notebook-import-none = Aucune note n’a été trouvée ici.
notebook-import-to-know = À savoir
notebook-import-unread = Cela n’a pas pu être lu comme des notes.
notebook-import-do = Importer
notebook-import-reading = Lecture de { $done } sur { $count } : { $name }
notebook-import-stop = Arrêter
notebook-import-done = { $count ->
    [one] Une note importée dans { $box }
    [many] { $count } notes importées dans { $box }
   *[other] { $count } notes importées dans { $box }
}
notebook-import-nothing = Rien à importer n’a été trouvé
notebook-import-problems = { $count ->
    [one] Une chose n’a pas pu être lue : { $first }
    [many] { $count } choses n’ont pas pu être lues : { $first }
   *[other] { $count } choses n’ont pas pu être lues : { $first }
}

## The list in the document pane, and what goes into a text

notebook-between = Entre les côtés et les notes
notebook-pane-find = Trouver une note
notebook-pane-open = Ouvrir le carnet
notebook-pane-unread = Le carnet n’a pas pu être lu
notebook-pane-empty = Le carnet est vide
notebook-pane-nothing-found = Aucune note ne contient ces mots
notebook-pane-drag = Faites glisser une note, ou une partie de note, dans le texte.
notebook-pane-show-all = Tout afficher
notebook-pane-show-less = Afficher moins
notebook-pane-used = Utilisées dans ce projet
notebook-pane-put-into-text = Mettre dans le texte
notebook-pane-open-note = Ouvrir dans le carnet
notebook-pane-a-picture = Une image
# A source made a reference of the library, as what was taken from it went into a text.
notebook-pane-reference-made = Ajoutée à la bibliothèque : { $title }
notebook-pane-reference-not-made = { $source } n’a pas pu être ajoutée à la bibliothèque
notebook-pane-picture-not-moved = { $name } n’a pas pu être placé parmi les fichiers de la bibliothèque
notebook-pane-file-not-into-text = Un fichier ne se met pas dans un texte
notebook-pane-not-into-text = La note n’a pas pu être mise dans le texte

## The window of a note of its own (record 0109)

notebook-note-window-placeholder = Écrivez une note
notebook-note-window-send = Vers le carnet
notebook-note-window-add-file = Ajouter un fichier…
notebook-note-window-not-sent = La note n’a pas pu être écrite dans le carnet
