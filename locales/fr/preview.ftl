# The preview, and the making of documents: the panel beside the text, and
# the export.

## The panel beside the map, and what is chosen over it.

preview = Aperçu
# Small, over the names of the template, the layout and the reference style in use, which open the document settings.
preview-made-by = Modèle, mise en page, références
# The last among the reference styles, which opens the search for more.
preview-style-more = Plus de styles…
# Shows in the text the element whose place in the pages is looked at.
preview-go-to-text = Aller à cet endroit du texte
# Moves the pages to where the element the text is at begins.
preview-show-text = Montrer où en est le texte
preview-hide = Cacher l’aperçu
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
