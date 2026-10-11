# The preview, and the making of documents: the panel beside the map, the
# details of a document, and the export.

## The panel beside the map, and what is chosen over it.

preview = Voorbeeld
# The last among the reference styles, which opens the search for more.
preview-style-more = Meer stijlen…
# Shows in the text the element whose place in the pages is looked at.
preview-go-to-text = Naar deze plaats in de tekst gaan
# Moves the pages to where the element the text is at begins.
preview-show-text = Tonen waar de tekst is
preview-hide = Het voorbeeld verbergen
# The name of the program is Pandoc, Typst or LaTeX.
preview-program-missing = { $program } is niet geïnstalleerd
preview-programs-needed = Voorbeeld en export worden gemaakt met Pandoc en Typst. Installeer ze met de pakketbeheerder van je systeem, of zeg in de instellingen waar ze staan.
preview-look-again = Opnieuw zoeken
preview-looking-failed = Er kon niet naar de programma's worden gezocht
preview-reading-failed = De stijlen en formaten konden niet worden gelezen
preview-failed = Het voorbeeld kon niet worden gemaakt
preview-failed-message = Het voorbeeld kon niet worden gemaakt.
# A page of the preview, as it is told to those who cannot see it.
preview-page = Pagina { $number }
# The name of an exported file, where the map has none.
preview-file-name = document

## At the foot of the preview: how long the document is, and what there is to remark.

preview-pages = { $count ->
    [one] { $count } pagina
   *[other] { $count } pagina's
}
preview-words = { $count ->
    [one] { $count } woord
   *[other] { $count } woorden
}
# The words of the text, and the most the format allows.
preview-words-of = { $limit ->
    [one] { $count } van { $limit } woord
   *[other] { $count } van { $limit } woorden
}
# The words of the text and of its notes together.
preview-words-with-notes = { $count } met noten
preview-remarks-count = { $count ->
    [one] { $count } kanttekening
   *[other] { $count } kanttekeningen
}
preview-remarks = Kanttekeningen
preview-remarks-font = Lettertype
preview-font-missing = { $font } is niet geïnstalleerd.
# The first name is that of the font the format asks for; this is of the one used in its place.
preview-font-substitute = In plaats daarvan wordt { $font } gebruikt, hier in het voorbeeld en in een PDF die wordt gemaakt. In een document dat voor Word, LibreOffice of LaTeX wordt geëxporteerd, wordt het lettertype genoemd zoals het formaat vraagt, en is het er voor wie het document opent en het heeft.
preview-remarks-references = Referenties
# In bold, and the next follows it in the same sentence.
preview-works-missing = { $count ->
    [one] { $count } geciteerd werk is niet gevonden,
   *[other] { $count } geciteerde werken zijn niet gevonden,
}
preview-works-missing-where = noch in je bibliotheek, noch in het project. Ze zijn in de tekst gemarkeerd.
# Over what Pandoc and Typst said while they made the document.
preview-remarks-warnings = Gezegd terwijl het document werd gemaakt

## The export: the kinds of file a document is made as.

preview-export = Exporteren
preview-export-kind = Soort bestand
preview-export-pdf-about = Zoals het voorbeeld het toont
preview-export-pdflatex = PDF, gezet door LaTeX
preview-export-pdflatex-about = Hetzelfde document in de zetwijze van LaTeX. Het duurt iets langer.
preview-export-docx-about = Wat de meeste uitgevers en tijdschriften vragen
preview-export-odt-about = Voor LibreOffice Writer en andere
preview-export-latex-about = Om te zetten met LuaLaTeX of XeLaTeX
preview-export-markdown-about = Platte tekst, met de verwijzingen als sleutels
preview-export-html = Webpagina
preview-export-html-about = Eén bestand, te lezen in een browser
preview-export-epub = E-boek
preview-export-epub-about = EPUB, voor e-readers en de apps die ze lezen; de lezer zet de tekst
preview-export-latex-missing = Hiervoor is LaTeX nodig, en dat is niet gevonden. Het wordt geïnstalleerd als TeX Live.
preview-export-biblatex = De verwijzingen als opdrachten van BibLaTeX houden
preview-export-biblatex-hint = De referenties worden naar een .bib-bestand naast het document geschreven. De citeerstijl is dan die van BibLaTeX die het dichtst bij de gekozen stijl ligt.
# The title of the window where the file is named; the kind is PDF, Word, and so on.
preview-export-as = Exporteren als { $kind }
preview-export-run = Exporteren…
preview-export-working = Het document wordt gemaakt…
preview-export-failed = Het document kon niet worden gemaakt.
preview-export-stop = Stoppen
preview-export-stopped = Het maken is gestopt. Er is geen bestand geschreven.
# Under the name of the file that was made: another file made with it.
preview-export-also = met { $file }
preview-export-missing = { $count ->
    [one] Eén geciteerd werk is niet gevonden, en is in de tekst gemarkeerd.
   *[other] { $count } geciteerde werken zijn niet gevonden, en zijn in de tekst gemarkeerd.
}
preview-export-show-in-folder = In de map tonen
preview-export-open-failed = Het bestand kon niet worden geopend
preview-export-folder-failed = De map kon niet worden geopend
preview-export-another = Nog een exporteren
