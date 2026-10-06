# The preview, and the making of documents: the panel beside the map, the
# details of a document, and the export.

## The panel beside the map, and what is chosen over it.

preview = Førehandsvising
# Small, over the choice of the document format.
preview-format = Format
preview-format-label = Dokumentformat
# Small, over the choice of the reference style.
preview-style = Referansar
preview-style-label = Referansestil
# The last among the reference styles, which opens the search for more.
preview-style-more = Fleire stilar …
preview-change = Endre formatet eller stilen
preview-change-format = Endre dette formatet …
preview-change-format-hint = Side, skrift, avstand, overskrifter
preview-change-style = Endre denne referansestilen …
preview-change-style-hint = Etter ønska til eit forlag
preview-details = Tittel, forfattarar, samandrag
# Shows in the text the element whose place in the pages is looked at.
preview-go-to-text = Gå til denne staden i teksten
# Moves the pages to where the element the text is at begins.
preview-show-text = Vis kvar teksten er
preview-hide = Gøym førehandsvisinga
# When a format that goes with a reference style is chosen, the style is taken with it.
preview-style-taken = Referansestilen er no { $style }
preview-style-taken-why = Det er den som høyrer til dette formatet.
preview-style-keep-other = Hald på den andre
# The name of the program is Pandoc, Typst or LaTeX.
preview-program-missing = { $program } er ikkje installert
preview-programs-needed = Førehandsvising og eksport blir laga med Pandoc og Typst. Installer dei med pakkehandsamaren på systemet ditt, eller sei i innstillingane kvar dei er.
preview-look-again = Sjå etter igjen
preview-looking-failed = Kunne ikkje sjå etter programma
preview-reading-failed = Stilane og formata kunne ikkje lesast
preview-failed = Førehandsvisinga kunne ikkje lagast
preview-failed-message = Førehandsvisinga kunne ikkje lagast.
# A page of the preview, as it is told to those who cannot see it.
preview-page = Side { $number }
# The name of an exported file, where the map has none.
preview-file-name = dokument

## At the foot of the preview: how long the document is, and what there is to remark.

preview-pages = { $count ->
    [one] { $count } side
   *[other] { $count } sider
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
preview-words-with-notes = { $count } med notar
preview-remarks-count = { $count ->
    [one] { $count } merknad
   *[other] { $count } merknader
}
preview-remarks = Merknader
preview-remarks-font = Skrift
preview-font-missing = { $font } er ikkje installert.
# The first name is that of the font the format asks for; this is of the one used in its place.
preview-font-substitute = { $font } blir brukt i staden, her i førehandsvisinga og i ein PDF som blir laga. I eit dokument som blir eksportert til Word, LibreOffice eller LaTeX, blir skrifta oppgitt slik formatet ber om, og den er der for den som opnar dokumentet og har den.
preview-remarks-references = Referansar
# In bold, and the next follows it in the same sentence.
preview-works-missing = { $count ->
    [one] { $count } verk det blir vist til, vart ikkje funne,
   *[other] { $count } verk det blir vist til, vart ikkje funne,
}
preview-works-missing-where = verken i biblioteket ditt eller i prosjektet. Stadene er merkte i teksten.
# Over what Pandoc and Typst said while they made the document.
preview-remarks-warnings = Meldingar medan dokumentet vart laga

## The details of a document: what stands on its first page.

preview-details-dialog = Dokumentet
preview-details-dialog-subtitle = Det som står på første side
preview-details-title = Tittel
preview-details-title-placeholder = Namnet på midten av kartet
preview-details-title-hint = Står feltet tomt, blir namnet på midten av kartet tittelen.
preview-details-subtitle = Undertittel
preview-details-authors = Forfattarar
preview-details-name = Namn
preview-details-author-name = Namn på forfattar { $number }
preview-details-affiliation = Tilknyting
preview-details-author-affiliation = Tilknytinga til forfattar { $number }
preview-details-email = E-post
preview-details-author-email = E-post til forfattar { $number }
# Beside a plus, under the authors: adds one.
preview-details-add-author = forfattar
preview-details-abstract = Samandrag
preview-details-words = { $count ->
    [one] { $count } ord
   *[other] { $count } ord
}
# The words of the abstract, and the most the format allows.
preview-details-words-of = { $limit ->
    [one] { $count } av { $limit } ord
   *[other] { $count } av { $limit } ord
}
preview-details-keywords = Nøkkelord
# The keywords given, and the most the format allows.
preview-details-keywords-of = { $count } av { $limit }
preview-details-keywords-placeholder = Skilde med komma
preview-details-date = Dato
preview-details-date-placeholder = Slik den skal stå i dokumentet
preview-details-language = Språket i teksten
# A map that was given no language is printed in English.
preview-details-language-none = Ikkje oppgitt (engelsk)
preview-details-cover = Omslag
preview-details-cover-choose = Vel eit bilete …
preview-details-cover-other = Eit anna …
preview-details-cover-hint = Omslaget til e-boka: eit bilete, som ligg i biletlageret. Ingenting anna bruker det.

## The export: the kinds of file a document is made as.

preview-export = Eksporter
preview-export-kind = Filtype
preview-export-pdf-about = Slik førehandsvisinga viser det
preview-export-pdflatex = PDF, sett med LaTeX
preview-export-pdflatex-about = Det same dokumentet, sett med LaTeX. Det tek litt lengre tid.
preview-export-docx-about = Det dei fleste forlag og tidsskrift ber om
preview-export-odt-about = For LibreOffice Writer og andre
preview-export-latex-about = Til å setjast med LuaLaTeX eller XeLaTeX
preview-export-markdown-about = Rein tekst, med kjeldetilvisingane som nøklar
preview-export-html = Nettside
preview-export-html-about = Éi fil, til å lesast i ein nettlesar
preview-export-epub = E-bok
preview-export-epub-about = EPUB, for lesebrett og appane som les dei; lesaren set teksten
preview-export-latex-missing = Dette krev LaTeX, som ikkje vart funne. Det blir installert som TeX Live.
preview-export-biblatex = Hald på kjeldetilvisingane som BibLaTeX-kommandoar
preview-export-biblatex-hint = Referansane blir skrivne til ei .bib-fil ved sida av dokumentet. Referansestilen blir då den i BibLaTeX som ligg nærast den som er vald.
# The title of the window where the file is named; the kind is PDF, Word, and so on.
preview-export-as = Eksporter som { $kind }
preview-export-run = Eksporter …
preview-export-working = Lagar dokumentet …
preview-export-failed = Dokumentet kunne ikkje lagast.
preview-export-stop = Stopp
preview-export-stopped = Laginga vart stoppa. Inga fil vart skriven.
# Under the name of the file that was made: another file made with it.
preview-export-also = med { $file }
preview-export-missing = { $count ->
    [one] Eitt verk det blir vist til, vart ikkje funne, og er merkt i teksten.
   *[other] { $count } verk det blir vist til, vart ikkje funne, og er merkte i teksten.
}
preview-export-show-in-folder = Vis i mappa
preview-export-open-failed = Fila kunne ikkje opnast
preview-export-folder-failed = Mappa kunne ikkje opnast
preview-export-another = Eksporter eit til
