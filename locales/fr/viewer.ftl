# A file of the library shown in a side of the window: its pages, its bar, and what can go wrong.

viewer-file = Fichier
# The page in view, of how many: "Page 3 of 271".
viewer-page-of = Page { $page } sur { $count }
# The number the page has in print, where it differs from its count: shown after the count, small.
viewer-printed = ({ $label })
viewer-go-to-page = Aller à la page
viewer-zoom = Zoom
viewer-fit-width = Ajuster à la largeur
viewer-zoom-percent = { $percent } %
viewer-not-drawn = Cette page n’a pas pu être dessinée : { $why }
viewer-not-found = Le fichier n’est plus dans la bibliothèque.
viewer-locked = Le fichier demande un mot de passe, et ne peut pas être affiché.
viewer-not-shown = Ce type de fichier ne peut pas être affiché ici : ouvrez-le dans un autre logiciel.
viewer-loading = Ouverture du fichier…
# The zoom of an image, fitted: all of it seen, however small that makes it.
viewer-fit-image = L’image entière
# The field in which a zoom is written, in percent.
viewer-zoom-field = Zoom, en pourcentage
viewer-zoom-choose = Choisir un zoom
viewer-files-menu = Fichiers de la bibliothèque
viewer-files-search = Trouver un fichier
viewer-tree-empty = Rien ici pour l’instant

# A simple image editor (docs/plans/a-simple-image-editor.md): the button in the bar, the row under it, and what it says.
viewer-edit = Modifier
viewer-edit-turn-left = Tourner à gauche
viewer-edit-turn-right = Tourner à droite
viewer-edit-flip-sideways = Retourner horizontalement
viewer-edit-flip-over = Retourner verticalement
viewer-edit-crop = Recadrer
viewer-edit-brightness = Luminosité
viewer-edit-contrast = Contraste
viewer-edit-saturation = Saturation
# How much of a colour the image has, 100 being as it is.
viewer-edit-percent = { $percent } %
# Puts one slider back at 100 %.
viewer-edit-as-it-was = Comme à l’origine
viewer-edit-start-again = Recommencer
viewer-edit-keep = Garder comme nouveau fichier
# The size the crop cuts to, of the size of the whole: "Cut to 800 × 600 of 1600 × 1200".
viewer-edit-cut-to = Recadré à { $width } × { $height } sur { $fullWidth } × { $fullHeight }
viewer-edit-leave-title = Quitter sans garder ?
viewer-edit-leave-message = Ce qui a été changé est perdu.
viewer-edit-leave = Quitter
viewer-edit-kept = Gardée sous le nom { $name }
viewer-edit-not-kept = L’image modifiée n’a pas pu être gardée
viewer-edit-not-opened = L’image n’a pas pu être ouverte pour être modifiée
viewer-edit-too-large-title = Trop grande pour être modifiée
viewer-edit-too-large-message = L’image fait plus de { $most } Mo, le plus qu’une image puisse faire. Une copie plus petite peut être faite et modifiée à sa place.
viewer-edit-make-smaller = Faire une copie plus petite

# Sources in tabs, bookmarks in a file (docs/plans/sources-in-tabs-bookmarks-and-the-scrolling-of-pages.md).
viewer-tabs = Onglets
viewer-tab-add = Ajouter un fichier…
viewer-tab-add-title = Ajouter des fichiers aux onglets
viewer-tab-menu = Le menu de l’onglet
viewer-tab-close = Fermer l’onglet
viewer-tab-close-others = Fermer les autres onglets
viewer-tab-again = Rouvrir dans un nouvel onglet
viewer-tab-in-library = Afficher dans la bibliothèque
viewer-tab-gone = N’est plus dans la bibliothèque
viewer-tabs-none = Pas encore de fichiers ici
# The tooltip of the project's name in the cell of a file side.
viewer-sources-of = Les onglets de { $name }
viewer-places = Signets et table des matières
viewer-bookmark-here = Marquer cet endroit
viewer-bookmarks = Signets
viewer-bookmarks-none = Pas encore de signets
# The default name of a bookmark, and the small page said beside one.
viewer-bookmark-page = Page { $label }
viewer-bookmark-name = Le nom du signet
viewer-bookmark-rename = Renommer
viewer-bookmark-remove = Supprimer
viewer-bookmark-not-kept = Les signets n’ont pas pu être gardés
viewer-contents = Table des matières
viewer-contents-none = Le fichier n’a pas de table des matières à lui

# The tabs opened, files by their references, a file read in the library (docs/plans/the-tabs-opened-files-by-their-references-and-a-file-read-in-the-library.md).
viewer-back-to-files = Retour aux fichiers

# Printing (docs/plans/printing.md, record 0075).
# The button in the bar of a file, and in the dialog of its pages, that prints.
viewer-print = Imprimer…
# The dialog that asks which pages of a PDF to print, before they are drawn.
viewer-print-pages = Pages à imprimer
viewer-print-all = { $count ->
    [one] La seule page
    [many] Toutes les { $count } pages
   *[other] Toutes les { $count } pages
}
# "From [3] to [10]": the words around two fields of page numbers.
viewer-print-from = De
viewer-print-to = à
# Told while the pages are drawn for printing, before the system's dialog opens.
viewer-print-drawing = { $count ->
    [one] Dessin d’une page pour l’impression…
    [many] Dessin de { $count } pages pour l’impression…
   *[other] Dessin de { $count } pages pour l’impression…
}
viewer-print-stop = Arrêter
viewer-print-failed = Les pages n’ont pas pu être dessinées pour l’impression
