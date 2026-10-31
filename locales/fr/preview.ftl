# The typesetting pane, and the making of documents: the pages as the
# document is set, with its Look beside them, and the export.

## The head of the typesetting pane.

# The last among the reference styles, which opens the search for more.
preview-style-more = Plus de styles…
# Shows in the text the element whose place in the pages is looked at.
preview-go-to-text = Aller à cet endroit du texte
# Moves the pages to where the element the text is at begins.
preview-show-text = Montrer où en est le texte
preview-hide = Masquer la composition
# The name of the program is Pandoc, Typst or LaTeX.
preview-program-missing = { $program } n’est pas installé
preview-programs-needed = L’aperçu et l’exportation se font avec Pandoc et Typst. Installez-les avec le gestionnaire de paquets de votre système, ou indiquez dans les réglages où ils se trouvent.
preview-look-again = Chercher de nouveau
preview-looking-failed = Les programmes n’ont pas pu être cherchés
preview-reading-failed = Les styles, les mises en page et les modèles n’ont pas pu être lus
preview-failed = L’aperçu n’a pas pu être produit
preview-failed-message = L’aperçu n’a pas pu être produit.
# A page of the preview, as it is told to those who cannot see it.
preview-page = Page { $number }
# The name of an exported file, where the element has no name.
preview-file-name = document

## At the foot of the preview: how long the document is, and what there is to remark.

preview-pages = { $count ->
    [one] { $count } page
    [many] { $count } pages
   *[other] { $count } pages
}
preview-words = { $count ->
    [one] { $count } mot
    [many] { $count } mots
   *[other] { $count } mots
}
# The words of the text, and the most the template allows.
preview-words-of = { $count ->
    [one] { $count } mot sur { $limit }
    [many] { $count } mots sur { $limit }
   *[other] { $count } mots sur { $limit }
}
# The words of the text and of its notes together.
preview-words-with-notes = { $count } avec les notes
preview-remarks-count = { $count ->
    [one] { $count } remarque
    [many] { $count } remarques
   *[other] { $count } remarques
}
preview-remarks = Remarques
preview-remarks-font = Police
preview-font-missing = { $font } n’est pas installée.
# The first name is that of the font the layout asks for; this is of the one used in its place.
preview-font-substitute = { $font } la remplace, ici dans l’aperçu et dans un PDF produit. Dans un document exporté pour Word, LibreOffice ou LaTeX, la police est nommée comme la mise en page le demande, et elle y est pour quiconque ouvre le document et l’a.
preview-remarks-references = Références
# In bold, and the next follows it in the same sentence.
preview-works-missing = { $count ->
    [one] { $count } œuvre citée n’a pas été trouvée,
    [many] { $count } œuvres citées n’ont pas été trouvées,
   *[other] { $count } œuvres citées n’ont pas été trouvées,
}
preview-works-missing-where = ni dans votre bibliothèque ni dans le projet. Elles sont marquées dans le texte.
# Over what Pandoc and Typst said while they made the document.
preview-remarks-warnings = Dit pendant que le document était produit

## The export: the kinds of file a document is made as.

preview-export = Exporter
preview-export-kind = Type de fichier
preview-export-pdf-about = Tel que l’aperçu le montre
preview-export-pdflatex = PDF, composé par LaTeX
preview-export-pdflatex-about = Le même document dans la composition de LaTeX. Cela prend un peu plus de temps.
preview-export-docx-about = Ce que la plupart des éditeurs et des revues demandent
preview-export-odt-about = Pour LibreOffice Writer et d’autres
preview-export-latex-about = À composer avec LuaLaTeX ou XeLaTeX
preview-export-markdown-about = Texte brut, avec les citations comme clés
preview-export-html = Page web
preview-export-html-about = Un seul fichier, à lire dans un navigateur
preview-export-epub = Livre numérique
preview-export-epub-about = EPUB, pour les liseuses et les applications qui les lisent ; c’est le lecteur qui compose le texte
preview-export-latex-missing = LaTeX est nécessaire pour cela, et n’a pas été trouvé. Il s’installe sous le nom de TeX Live.
preview-export-biblatex = Garder les citations comme commandes BibLaTeX
preview-export-biblatex-hint = Les références sont écrites dans un fichier .bib à côté du document. Le style de référence est alors celui de BibLaTeX le plus proche de celui choisi.
# The title of the window where the file is named; the kind is PDF, Word, and so on.
preview-export-as = Exporter en { $kind }
preview-export-run = Exporter…
preview-export-working = Production du document…
preview-export-failed = Le document n’a pas pu être produit.
preview-export-stop = Arrêter
preview-export-stopped = La production a été arrêtée. Aucun fichier n’a été écrit.
# Under the name of the file that was made: another file made with it.
preview-export-also = avec { $file }
preview-export-missing = { $count ->
    [one] Une œuvre citée n’a pas été trouvée, et est marquée dans le texte.
    [many] { $count } œuvres citées n’ont pas été trouvées, et sont marquées dans le texte.
   *[other] { $count } œuvres citées n’ont pas été trouvées, et sont marquées dans le texte.
}
preview-export-show-in-folder = Afficher dans le dossier
preview-export-open-failed = Le fichier n’a pas pu être ouvert
preview-export-folder-failed = Le dossier n’a pas pu être ouvert
preview-export-another = Exporter un autre

## What a line of a page is: the chip at the edge of the page that names the
## line the pointer rests on and opens Look at it, and its switch at the foot.

# On the chip: what the line is.
preview-what-text = Texte
# A heading, by its level: Heading 1, Heading 2.
preview-what-heading = Titre { $level }
preview-what-note = Note
preview-what-bibliography = Bibliographie
preview-what-figure = Figure
preview-what-table = Tableau
preview-what-front = Première page
# What the chip does, as it is told to those who cannot see it; what the line is: Quotation, Heading 1.
preview-what-open = L’aspect de « { $what } »…
# The switch at the foot of the preview, while the chips are not shown and while they are.
preview-chips = Nommer les lignes de la page
preview-chips-off = Ne plus nommer les lignes

preview-what-page = Page
preview-what-header = En-tête
preview-what-footer = Pied de page

## The sides, the panes and the bars, stage 2: the typesetting pane, the document pane, Document properties.

# The pane where the document is set into pages, with its Look beside them.
preview-title = Composition

## The settings in plain words, stage 2: the zoom of the typesetting pane.

# The button of the zoom and the first choice of its menu: the pages as wide as the pane.
preview-zoom-fit = Ajuster à la largeur
# The button of the zoom and the choices of its menu: the size of the pages against their size on paper.
preview-zoom = { $percent } %
# What the button of the zoom is, as it is told to those who cannot see it.
preview-zoom-label = Zoom

## Printing (docs/plans/printing.md, record 0075).

# The button in the head of the typesetting pane that prints the document through the system's dialog.
preview-print = Imprimer…
# Told while the pages are fetched for printing, before the system's dialog opens.
preview-print-preparing = { $count ->
    [one] Préparation d’une page pour l’impression…
    [many] Préparation de { $count } pages pour l’impression…
   *[other] Préparation de { $count } pages pour l’impression…
}
preview-print-failed = Les pages n’ont pas pu être imprimées
