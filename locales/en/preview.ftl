# The preview, and the making of documents: the panel beside the map, the
# details of a document, and the export.

## The panel beside the map, and what is chosen over it.

preview = Preview
# Small, over the choice of the document format.
preview-format = Format
preview-format-label = Document format
# Small, over the choice of the reference style.
preview-style = References
preview-style-label = Reference style
# The last among the reference styles, which opens the search for more.
preview-style-more = More styles…
preview-change = Change the format or the style
preview-change-format = Change this format…
preview-change-format-hint = Page, type, spacing, headings
preview-change-style = Change this reference style…
preview-change-style-hint = To a publisher’s wishes
preview-details = Title, authors, abstract
preview-hide = Hide the preview
# When a format that goes with a reference style is chosen, the style is taken with it.
preview-style-taken = The reference style is now { $style }
preview-style-taken-why = It is the one this format goes with.
preview-style-keep-other = Keep the other
# The name of the program is Pandoc, Typst or LaTeX.
preview-program-missing = { $program } is not installed
preview-programs-needed = Preview and export are made with Pandoc and Typst. Install them with the package manager of your system, or say in the settings where they are.
preview-look-again = Look again
preview-looking-failed = The programs could not be looked for
preview-reading-failed = The styles and formats could not be read
preview-failed = The preview could not be made
preview-failed-message = The preview could not be made.
# A page of the preview, as it is told to those who cannot see it.
preview-page = Page { $number }
# The name of an exported file, where the map has none.
preview-file-name = document

## At the foot of the preview: how long the document is, and what there is to remark.

preview-pages = { $count ->
    [one] { $count } page
   *[other] { $count } pages
}
preview-words = { $count ->
    [one] { $count } word
   *[other] { $count } words
}
# The words of the text, and the most the format allows.
preview-words-of = { $limit ->
    [one] { $count } of { $limit } word
   *[other] { $count } of { $limit } words
}
# The words of the text and of its notes together.
preview-words-with-notes = { $count } with notes
preview-remarks-count = { $count ->
    [one] { $count } remark
   *[other] { $count } remarks
}
preview-remarks = Remarks
preview-remarks-font = Font
preview-font-missing = { $font } is not installed.
# The first name is that of the font the format asks for; this is of the one used in its place.
preview-font-substitute = { $font } is used in its place, here in the preview and in a PDF that is made. In a document that is exported for Word, LibreOffice or LaTeX, the font is named as the format asks, and is there for whoever opens the document and has it.
preview-remarks-references = References
# In bold, and the next follows it in the same sentence.
preview-works-missing = { $count ->
    [one] { $count } work cited was not found,
   *[other] { $count } works cited were not found,
}
preview-works-missing-where = neither in your library nor in the project. They are marked in the text.
# Over what Pandoc and Typst said while they made the document.
preview-remarks-warnings = Said while the document was made

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
preview-export-biblatex = Keep the citations as commands of BibLaTeX
preview-export-biblatex-hint = The references are written to a .bib file beside the document. The reference style is then that of BibLaTeX nearest to the one chosen.
# The title of the window where the file is named; the kind is PDF, Word, and so on.
preview-export-as = Export as { $kind }
preview-export-run = Export…
preview-export-working = Making the document…
preview-export-failed = The document could not be made.
preview-export-stop = Stop
preview-export-stopped = The making was stopped. No file was written.
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
