# Tables in the text: making them, their tools, and what can be said of them.
# See locales/README.md.

## A table and its size, as its panel and the reading of a file show them.

tables-table = Tableau
tables-size = { $rows ->
        [one] { $rows } ligne
        [many] { $rows } lignes
       *[other] { $rows } lignes
    }, { $columns ->
        [one] { $columns } colonne
        [many] { $columns } colonnes
       *[other] { $columns } colonnes
    }
# The size, where only the first rows of what was read are shown.
tables-size-shown = { tables-size }. Les { $shown } premières sont affichées.

## The bar over a table, and the menu on its cells.

tables-row = Ligne
tables-row-hint = Une ligne au-dessus ou au-dessous ; retirer la ligne
tables-row-above = Une ligne au-dessus
tables-row-below = Une ligne au-dessous
tables-row-remove = Retirer la ligne
tables-column = Colonne
tables-column-hint = Une colonne avant ou après ; retirer la colonne
tables-column-before = Une colonne avant
tables-column-after = Une colonne après
tables-column-remove = Retirer la colonne
tables-join = Fusionner les cellules
tables-join-hint = Fusionner les cellules sélectionnées
tables-split = Scinder la cellule
tables-split-hint = Scinder la cellule en celles dont elle a été fusionnée
tables-headings = En-têtes
tables-headings-hint = Si la première ligne et la première colonne sont des en-têtes
tables-first-row-headings = La première ligne est un en-tête
tables-first-column-headings = La première colonne est un en-tête
tables-cell-stands = Le contenu de la cellule se place
tables-left = À gauche
tables-left-hint = Le contenu de la cellule se place à gauche
tables-middle = Au milieu
tables-middle-hint = Le contenu de la cellule se place au milieu
tables-right = À droite
tables-right-hint = Le contenu de la cellule se place à droite
tables-table-hint = S’il est numéroté, sa largeur ; le retirer
tables-numbered = Numéroté
tables-the-table = Le tableau…
tables-the-table-hint = Sa largeur
tables-remove = Retirer le tableau

## The panel of what can be said of a table as a whole.

tables-width = Largeur
tables-width-needed = Selon le besoin
tables-width-half = La moitié
tables-width-three-quarters = Trois quarts
tables-width-whole = Entière
tables-width-of-text = De la largeur du texte, dans le document.
tables-width-as-needed = Aussi large que son contenu le demande.
tables-numbered-as = Numéroté, comme « Tableau 1 »

## A table asked for by its size.

tables-ask = Un tableau de quelle taille
tables-ask-heading = Un tableau
tables-ask-grid = Pointez la taille du tableau
tables-ask-by = { $rows } sur { $columns }
tables-ask-rows = Lignes
tables-ask-columns = Colonnes
tables-ask-put = L’insérer

## A table from a file.

tables-from-file = Un tableau depuis un fichier
tables-sheet = Feuille
# A sheet of a file that has no name of its own.
tables-sheet-number = Feuille { $number }
tables-first-rows = Les premières lignes, telles qu’elles seront
tables-caption = Ce qui est dit du tableau
tables-caption-placeholder = Sa légende, qui peut être changée dans le texte
tables-header-row = La première ligne contient les en-têtes
tables-header-column = La première colonne contient les en-têtes
tables-numbers-right = Les colonnes de nombres sont alignées à droite.
tables-put = L’insérer dans le texte
# The title of the window in which a file is chosen among the files of the computer.
tables-choose = Un tableau
# What the files that can be chosen there are called.
tables-files = Tableaux
tables-unreadable = { $file } n’a pas pu être lu comme tableau
tables-cannot-stand = Un tableau ne peut pas se placer ici
tables-drop-on-text = Déposez un tableau sur le texte auquel il appartient

## Shown by the stylesheet, where the page has no element for the words.

tables-caption-empty = Ce qui est dit du tableau
