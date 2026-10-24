# The typesetting pane, and the making of documents: the pages as the
# document is set, with its Look beside them, and the export.

## The head of the typesetting pane.

# The last among the reference styles, which opens the search for more.
preview-style-more = Fler stilar…
# Shows in the text the element whose place in the pages is looked at.
preview-go-to-text = Gå till det här stället i texten
# Moves the pages to where the element the text is at begins.
preview-show-text = Visa var texten är
preview-hide = Dölj ombrytningen
# The name of the program is Pandoc, Typst or LaTeX.
preview-program-missing = { $program } är inte installerat
preview-programs-needed = Förhandsvisning och export görs med Pandoc och Typst. Installera dem med systemets pakethanterare, eller ange i inställningarna var de finns.
preview-look-again = Leta igen
preview-looking-failed = Programmen kunde inte letas upp
preview-reading-failed = Stilarna, layouterna och mallarna kunde inte läsas
preview-failed = Förhandsvisningen kunde inte göras
preview-failed-message = Förhandsvisningen kunde inte göras.
# A page of the preview, as it is told to those who cannot see it.
preview-page = Sida { $number }
# The name of an exported file, where the element has no name.
preview-file-name = dokument

## At the foot of the preview: how long the document is, and what there is to remark.

preview-pages = { $count ->
    [one] { $count } sida
   *[other] { $count } sidor
}
preview-words = { $count ->
    [one] { $count } ord
   *[other] { $count } ord
}
# The words of the text, and the most the template allows.
preview-words-of = { $limit ->
    [one] { $count } av { $limit } ord
   *[other] { $count } av { $limit } ord
}
# The words of the text and of its notes together.
preview-words-with-notes = { $count } med noter
preview-remarks-count = { $count ->
    [one] { $count } anmärkning
   *[other] { $count } anmärkningar
}
preview-remarks = Anmärkningar
preview-remarks-font = Typsnitt
preview-font-missing = { $font } är inte installerat.
# The first name is that of the font the layout asks for; this is of the one used in its place.
preview-font-substitute = { $font } används i dess ställe, här i förhandsvisningen och i en PDF som görs. I ett dokument som exporteras för Word, LibreOffice eller LaTeX anges typsnittet som layouten begär, och finns där för den som öppnar dokumentet och har det.
preview-remarks-references = Referenser
# In bold, and the next follows it in the same sentence.
preview-works-missing = { $count ->
    [one] { $count } verk som hänvisas till hittades inte,
   *[other] { $count } verk som hänvisas till hittades inte,
}
preview-works-missing-where = varken i ditt bibliotek eller i projektet. De är märkta i texten.
# Over what Pandoc and Typst said while they made the document.
preview-remarks-warnings = Sagt medan dokumentet gjordes

## The export: the kinds of file a document is made as.

preview-export = Exportera
preview-export-kind = Slag av fil
preview-export-pdf-about = Som förhandsvisningen visar det
preview-export-pdflatex = PDF, satt av LaTeX
preview-export-pdflatex-about = Samma dokument i LaTeX typsättning. Det tar lite längre tid.
preview-export-docx-about = Vad de flesta förlag och tidskrifter begär
preview-export-odt-about = För LibreOffice Writer och andra
preview-export-latex-about = För att sättas med LuaLaTeX eller XeLaTeX
preview-export-markdown-about = Ren text, med källhänvisningarna som nycklar
preview-export-html = Webbsida
preview-export-html-about = En fil, att läsas i en webbläsare
preview-export-epub = E-bok
preview-export-epub-about = EPUB, för läsplattor och apparna som läser dem; läsaren sätter texten
preview-export-latex-missing = LaTeX behövs för detta, och hittades inte. Det installeras som TeX Live.
preview-export-biblatex = Behåll källhänvisningarna som BibLaTeX-kommandon
preview-export-biblatex-hint = Referenserna skrivs till en .bib-fil bredvid dokumentet. Referensstilen blir då den i BibLaTeX som ligger närmast den valda.
# The title of the window where the file is named; the kind is PDF, Word, and so on.
preview-export-as = Exportera som { $kind }
preview-export-run = Exportera…
preview-export-working = Gör dokumentet…
preview-export-failed = Dokumentet kunde inte göras.
preview-export-stop = Stoppa
preview-export-stopped = Arbetet avbröts. Ingen fil skrevs.
# Under the name of the file that was made: another file made with it.
preview-export-also = med { $file }
preview-export-missing = { $count ->
    [one] Ett verk som hänvisas till hittades inte, och är märkt i texten.
   *[other] { $count } verk som hänvisas till hittades inte, och är märkta i texten.
}
preview-export-show-in-folder = Visa i mappen
preview-export-open-failed = Filen kunde inte öppnas
preview-export-folder-failed = Mappen kunde inte öppnas
preview-export-another = Exportera ett till

## What a line of a page is: the chip at the edge of the page that names the
## line the pointer rests on and opens Look at it, and its switch at the foot.

# On the chip: what the line is.
preview-what-text = Text
# A heading, by its level: Heading 1, Heading 2.
preview-what-heading = Rubrik { $level }
preview-what-note = Not
preview-what-bibliography = Litteraturförteckning
preview-what-figure = Figur
preview-what-table = Tabell
preview-what-front = Framsida
# What the chip does, as it is told to those who cannot see it; what the line is: Quotation, Heading 1.
preview-what-open = Hur ”{ $what }” ser ut…
# The switch at the foot of the preview, while the chips are not shown and while they are.
preview-chips = Visa vad sidans rader är
preview-chips-off = Sluta visa vad raderna är

preview-what-page = Sida
preview-what-header = Sidhuvud
preview-what-footer = Sidfot

## The sides, the panes and the bars, stage 2: the typesetting pane, the document pane, Document properties.

# The pane where the document is set into pages, with its Look beside them.
preview-title = Ombrytning

## The settings in plain words, stage 2: the zoom of the typesetting pane.

# The button of the zoom and the first choice of its menu: the pages as wide as the pane.
preview-zoom-fit = Anpassa till bredden
# The button of the zoom and the choices of its menu: the size of the pages against their size on paper.
preview-zoom = { $percent } %
# What the button of the zoom is, as it is told to those who cannot see it.
preview-zoom-label = Zoom
