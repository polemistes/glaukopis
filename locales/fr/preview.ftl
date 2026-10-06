# The preview, and the making of documents: the panel beside the map, the
# details of a document, and the export.

## The panel beside the map, and what is chosen over it.

preview = Aperçu
# Small, over the choice of the document format.
preview-format = Format
preview-format-label = Format du document
# Small, over the choice of the reference style.
preview-style = Références
preview-style-label = Style de référence
# The last among the reference styles, which opens the search for more.
preview-style-more = Plus de styles…
preview-change = Changer le format ou le style
preview-change-format = Modifier ce format…
preview-change-format-hint = Page, caractères, interligne, titres
preview-change-style = Modifier ce style de référence…
preview-change-style-hint = Selon les vœux d’un éditeur
preview-details = Titre, auteurs, résumé
# Shows in the text the element whose place in the pages is looked at.
preview-go-to-text = Aller à cet endroit du texte
# Moves the pages to where the element the text is at begins.
preview-show-text = Montrer où en est le texte
preview-hide = Cacher l’aperçu
# When a format that goes with a reference style is chosen, the style is taken with it.
preview-style-taken = Le style de référence est maintenant { $style }
preview-style-taken-why = C’est celui qui va avec ce format.
preview-style-keep-other = Garder l’autre
# The name of the program is Pandoc, Typst or LaTeX.
preview-program-missing = { $program } n’est pas installé
preview-programs-needed = L’aperçu et l’exportation se font avec Pandoc et Typst. Installez-les avec le gestionnaire de paquets de votre système, ou indiquez dans les réglages où ils se trouvent.
preview-look-again = Chercher de nouveau
preview-looking-failed = Les programmes n’ont pas pu être cherchés
preview-reading-failed = Les styles et les formats n’ont pas pu être lus
preview-failed = L’aperçu n’a pas pu être produit
preview-failed-message = L’aperçu n’a pas pu être produit.
# A page of the preview, as it is told to those who cannot see it.
preview-page = Page { $number }
# The name of an exported file, where the map has none.
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
# The words of the text, and the most the format allows.
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
# The first name is that of the font the format asks for; this is of the one used in its place.
preview-font-substitute = { $font } la remplace, ici dans l’aperçu et dans un PDF produit. Dans un document exporté pour Word, LibreOffice ou LaTeX, la police est nommée comme le format le demande, et elle y est pour quiconque ouvre le document et l’a.
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

## The details of a document: what stands on its first page.

preview-details-dialog = Le document
preview-details-dialog-subtitle = Ce qui se trouve sur sa première page
preview-details-title = Titre
preview-details-title-placeholder = Le nom du centre de la carte
preview-details-title-hint = Laissé vide, le nom du centre de la carte est le titre.
preview-details-subtitle = Sous-titre
preview-details-authors = Auteurs
preview-details-name = Nom
preview-details-author-name = Nom de l’auteur { $number }
preview-details-affiliation = Affiliation
preview-details-author-affiliation = Affiliation de l’auteur { $number }
preview-details-email = Courriel
preview-details-author-email = Courriel de l’auteur { $number }
# Beside a plus, under the authors: adds one.
preview-details-add-author = auteur
preview-details-abstract = Résumé
preview-details-words = { $count ->
    [one] { $count } mot
    [many] { $count } mots
   *[other] { $count } mots
}
# The words of the abstract, and the most the format allows.
preview-details-words-of = { $count ->
    [one] { $count } mot sur { $limit }
    [many] { $count } mots sur { $limit }
   *[other] { $count } mots sur { $limit }
}
preview-details-keywords = Mots-clés
# The keywords given, and the most the format allows.
preview-details-keywords-of = { $count } sur { $limit }
preview-details-keywords-placeholder = Séparés par des virgules
preview-details-date = Date
preview-details-date-placeholder = Telle qu’elle doit être imprimée
preview-details-language = Langue du texte
# A map that was given no language is printed in English.
preview-details-language-none = Non précisée (anglais)
preview-details-cover = Couverture
preview-details-cover-choose = Choisir une image…
preview-details-cover-other = Une autre…
preview-details-cover-hint = La couverture du livre numérique : une image, gardée dans la réserve d’images. Rien d’autre ne l’utilise.

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
