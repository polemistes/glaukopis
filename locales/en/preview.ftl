# The preview, and the making of documents: the panel beside the map, the
# details of a document, and the export.

## The details of a document: what stands on its first page.

preview-details-dialog = The document
preview-details-dialog-subtitle = What stands on its first page
preview-details-title = Title
preview-details-title-placeholder = The name of the centre of the map
preview-details-title-hint = Left empty, the name of the centre of the map is the title.
preview-details-subtitle = Subtitle
preview-details-authors = Authors
preview-details-name = Name
preview-details-author-name = Name of author { $number }
preview-details-affiliation = Affiliation
preview-details-author-affiliation = Affiliation of author { $number }
preview-details-email = E-mail
preview-details-author-email = E-mail of author { $number }
# Beside a plus, under the authors: adds one.
preview-details-add-author = author
preview-details-abstract = Abstract
preview-details-words = { $count ->
    [one] { $count } word
   *[other] { $count } words
}
# The words of the abstract, and the most the format allows.
preview-details-words-of = { $limit ->
    [one] { $count } of { $limit } word
   *[other] { $count } of { $limit } words
}
preview-details-keywords = Keywords
# The keywords given, and the most the format allows.
preview-details-keywords-of = { $count } of { $limit }
preview-details-keywords-placeholder = Separated by commas
preview-details-date = Date
preview-details-date-placeholder = As it is to be printed
preview-details-language = Language of the text
# A map that was given no language is printed in English.
preview-details-language-none = Not stated (English)

## The export: the kinds of file a document is made as.

preview-export = Export
preview-export-kind = Kind of file
preview-export-pdf-about = As the preview shows it
preview-export-pdflatex = PDF, set by LaTeX
preview-export-pdflatex-about = The same document in the typesetting of LaTeX. It takes a little longer.
preview-export-docx-about = What most publishers and journals ask for
preview-export-odt-about = For LibreOffice Writer and others
preview-export-latex-about = To be set with LuaLaTeX or XeLaTeX
preview-export-markdown-about = Plain text, with the citations as keys
preview-export-html = Web page
preview-export-html-about = One file, to be read in a browser
preview-export-latex-missing = LaTeX is needed for this, and was not found. It is installed as TeX Live.
preview-export-typst-missing = Typst is needed for this, and was not found
preview-export-biblatex = Keep the citations as commands of BibLaTeX
preview-export-biblatex-hint = The references are written to a .bib file beside the document. The reference style is then that of BibLaTeX nearest to the one chosen.
# The title of the window where the file is named; the kind is PDF, Word, and so on.
preview-export-as = Export as { $kind }
preview-export-run = Export…
preview-export-working = Making the document…
preview-export-failed = The document could not be made.
# Under the name of the file that was made: another file made with it.
preview-export-also = with { $file }
preview-export-missing = { $count ->
    [one] One work cited was not found, and is marked in the text.
   *[other] { $count } works cited were not found, and are marked in the text.
}
preview-export-show-in-folder = Show in folder
preview-export-open-failed = The file could not be opened
preview-export-folder-failed = The folder could not be opened
preview-export-another = Export another
