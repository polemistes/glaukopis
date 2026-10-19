# The preview, and the making of documents: the panel beside the text, and
# the export.

## The panel beside the map, and what is chosen over it.

preview = Preview
# The button over the pages that names what the document is and opens the chooser of what you are writing.
preview-what-title = What you are writing: choose…
preview-what-label = What this document is: { $name }. Choose what you are writing
# The last among the reference styles, which opens the search for more.
preview-style-more = More styles…
# Shows in the text the element whose place in the pages is looked at.
preview-go-to-text = Go to this place in the text
# Moves the pages to where the element the text is at begins.
preview-show-text = Show where the text is
preview-hide = Hide the preview
# The name of the program is Pandoc, Typst or LaTeX.
preview-program-missing = { $program } is not installed
preview-programs-needed = Preview and export are made with Pandoc and Typst. Install them with the package manager of your system, or say in the settings where they are.
preview-look-again = Look again
preview-looking-failed = The programs could not be looked for
preview-reading-failed = The styles, layouts and templates could not be read
preview-failed = The preview could not be made
preview-failed-message = The preview could not be made.
# A page of the preview, as it is told to those who cannot see it.
preview-page = Page { $number }
# The name of an exported file, where the element has no name.
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
# The words of the text, and the most the template allows.
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
# The first name is that of the font the layout asks for; this is of the one used in its place.
preview-font-substitute = { $font } is used in its place, here in the preview and in a PDF that is made. In a document that is exported for Word, LibreOffice or LaTeX, the font is named as the layout asks, and is there for whoever opens the document and has it.
preview-remarks-references = References
# In bold, and the next follows it in the same sentence.
preview-works-missing = { $count ->
    [one] { $count } work cited was not found,
   *[other] { $count } works cited were not found,
}
preview-works-missing-where = neither in your library nor in the project. They are marked in the text.
# Over what Pandoc and Typst said while they made the document.
preview-remarks-warnings = Said while the document was made

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
preview-export-epub = E-book
preview-export-epub-about = EPUB, for e-readers and the apps that read them; the reader sets the text
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

## What a line of a page is: the chip at the edge of the page that names the
## line the pointer rests on and opens Look at it, and its switch at the foot.

# On the chip: what the line is.
preview-what-text = Text
# A heading, by its level: Heading 1, Heading 2.
preview-what-heading = Heading { $level }
preview-what-note = Note
preview-what-bibliography = Bibliography
preview-what-figure = Figure
preview-what-table = Table
preview-what-front = Front page
# What the chip does, as it is told to those who cannot see it; what the line is: Quotation, Heading 1.
preview-what-open = How “{ $what }” looks…
# The switch at the foot of the preview, while the chips are not shown and while they are.
preview-chips = Name the lines of the page
preview-chips-off = Stop naming the lines
