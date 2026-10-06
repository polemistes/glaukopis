# The preview, and the making of documents: the panel beside the map, the
# details of a document, and the export.

## The panel beside the map, and what is chosen over it.

preview = Förhandsvisning
# Small, over the choice of the document format.
preview-format = Format
preview-format-label = Dokumentformat
# Small, over the choice of the reference style.
preview-style = Referenser
preview-style-label = Referensstil
# The last among the reference styles, which opens the search for more.
preview-style-more = Fler stilar…
preview-change = Ändra formatet eller stilen
preview-change-format = Ändra det här formatet…
preview-change-format-hint = Sida, skrift, avstånd, rubriker
preview-change-style = Ändra den här referensstilen…
preview-change-style-hint = Efter ett förlags önskemål
preview-details = Titel, författare, sammanfattning
# Shows in the text the element whose place in the pages is looked at.
preview-go-to-text = Gå till det här stället i texten
# Moves the pages to where the element the text is at begins.
preview-show-text = Visa var texten är
preview-hide = Dölj förhandsvisningen
# When a format that goes with a reference style is chosen, the style is taken with it.
preview-style-taken = Referensstilen är nu { $style }
preview-style-taken-why = Det är den som hör till det här formatet.
preview-style-keep-other = Behåll den andra
# The name of the program is Pandoc, Typst or LaTeX.
preview-program-missing = { $program } är inte installerat
preview-programs-needed = Förhandsvisning och export görs med Pandoc och Typst. Installera dem med systemets pakethanterare, eller ange i inställningarna var de finns.
preview-look-again = Leta igen
preview-looking-failed = Programmen kunde inte letas upp
preview-reading-failed = Stilarna och formaten kunde inte läsas
preview-failed = Förhandsvisningen kunde inte göras
preview-failed-message = Förhandsvisningen kunde inte göras.
# A page of the preview, as it is told to those who cannot see it.
preview-page = Sida { $number }
# The name of an exported file, where the map has none.
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
# The words of the text, and the most the format allows.
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
# The first name is that of the font the format asks for; this is of the one used in its place.
preview-font-substitute = { $font } används i dess ställe, här i förhandsvisningen och i en PDF som görs. I ett dokument som exporteras för Word, LibreOffice eller LaTeX anges typsnittet som formatet begär, och finns där för den som öppnar dokumentet och har det.
preview-remarks-references = Referenser
# In bold, and the next follows it in the same sentence.
preview-works-missing = { $count ->
    [one] { $count } verk som hänvisas till hittades inte,
   *[other] { $count } verk som hänvisas till hittades inte,
}
preview-works-missing-where = varken i ditt bibliotek eller i projektet. De är märkta i texten.
# Over what Pandoc and Typst said while they made the document.
preview-remarks-warnings = Sagt medan dokumentet gjordes

## The details of a document: what stands on its first page.

preview-details-dialog = Dokumentet
preview-details-dialog-subtitle = Vad som står på dess första sida
preview-details-title = Titel
preview-details-title-placeholder = Namnet på kartans mitt
preview-details-title-hint = Lämnas den tom är namnet på kartans mitt titeln.
preview-details-subtitle = Undertitel
preview-details-authors = Författare
preview-details-name = Namn
preview-details-author-name = Namn på författare { $number }
preview-details-affiliation = Tillhörighet
preview-details-author-affiliation = Tillhörighet för författare { $number }
preview-details-email = E-post
preview-details-author-email = E-post till författare { $number }
# Beside a plus, under the authors: adds one.
preview-details-add-author = författare
preview-details-abstract = Sammanfattning
preview-details-words = { $count ->
    [one] { $count } ord
   *[other] { $count } ord
}
# The words of the abstract, and the most the format allows.
preview-details-words-of = { $limit ->
    [one] { $count } av { $limit } ord
   *[other] { $count } av { $limit } ord
}
preview-details-keywords = Nyckelord
# The keywords given, and the most the format allows.
preview-details-keywords-of = { $count } av { $limit }
preview-details-keywords-placeholder = Åtskilda med kommatecken
preview-details-date = Datum
preview-details-date-placeholder = Som det ska tryckas
preview-details-language = Textens språk
# A map that was given no language is printed in English.
preview-details-language-none = Inte angivet (engelska)
preview-details-cover = Omslag
preview-details-cover-choose = Välj en bild…
preview-details-cover-other = En annan…
preview-details-cover-hint = E-bokens omslag: en bild, sparad i bildförrådet. Inget annat använder den.

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
