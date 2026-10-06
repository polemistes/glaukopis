# The preview, and the making of documents: the panel beside the map, the
# details of a document, and the export.

## The panel beside the map, and what is chosen over it.

preview = Anteprima
# Small, over the choice of the document format.
preview-format = Formato
preview-format-label = Formato del documento
# Small, over the choice of the reference style.
preview-style = Riferimenti
preview-style-label = Stile di citazione
# The last among the reference styles, which opens the search for more.
preview-style-more = Altri stili…
preview-change = Cambia il formato o lo stile
preview-change-format = Modifica questo formato…
preview-change-format-hint = Pagina, carattere, interlinea, titoli
preview-change-style = Modifica questo stile di citazione…
preview-change-style-hint = Secondo i desideri di un editore
preview-details = Titolo, autori, abstract
# Shows in the text the element whose place in the pages is looked at.
preview-go-to-text = Vai a questo punto nel testo
# Moves the pages to where the element the text is at begins.
preview-show-text = Mostra dove sta il testo
preview-hide = Nascondi l'anteprima
# When a format that goes with a reference style is chosen, the style is taken with it.
preview-style-taken = Lo stile di citazione ora è { $style }
preview-style-taken-why = È quello con cui va questo formato.
preview-style-keep-other = Tieni l'altro
# The name of the program is Pandoc, Typst or LaTeX.
preview-program-missing = { $program } non è installato
preview-programs-needed = Anteprima ed esportazione si fanno con Pandoc e Typst. Installali con il gestore dei pacchetti del tuo sistema, oppure di' nelle impostazioni dove si trovano.
preview-look-again = Cerca di nuovo
preview-looking-failed = Non si sono potuti cercare i programmi
preview-reading-failed = Gli stili e i formati non si sono potuti leggere
preview-failed = L'anteprima non si è potuta fare
preview-failed-message = L'anteprima non si è potuta fare.
# A page of the preview, as it is told to those who cannot see it.
preview-page = Pagina { $number }
# The name of an exported file, where the map has none.
preview-file-name = documento

## At the foot of the preview: how long the document is, and what there is to remark.

preview-pages = { $count ->
    [one] { $count } pagina
    [many] { $count } pagine
   *[other] { $count } pagine
}
preview-words = { $count ->
    [one] { $count } parola
    [many] { $count } parole
   *[other] { $count } parole
}
# The words of the text, and the most the format allows.
preview-words-of = { $limit ->
    [one] { $count } di { $limit } parola
    [many] { $count } di { $limit } parole
   *[other] { $count } di { $limit } parole
}
# The words of the text and of its notes together.
preview-words-with-notes = { $count } con le note
preview-remarks-count = { $count ->
    [one] { $count } osservazione
    [many] { $count } osservazioni
   *[other] { $count } osservazioni
}
preview-remarks = Osservazioni
preview-remarks-font = Font
preview-font-missing = { $font } non è installato.
# The first name is that of the font the format asks for; this is of the one used in its place.
preview-font-substitute = Al suo posto si usa { $font }, qui nell'anteprima e in un PDF che si produce. In un documento esportato per Word, LibreOffice o LaTeX, il font è indicato come il formato chiede, e c'è per chi apre il documento e ce l'ha.
preview-remarks-references = Riferimenti
# In bold, and the next follows it in the same sentence.
preview-works-missing = { $count ->
    [one] { $count } opera citata non è stata trovata,
    [many] { $count } opere citate non sono state trovate,
   *[other] { $count } opere citate non sono state trovate,
}
preview-works-missing-where = né nella tua biblioteca né nel progetto. Sono segnate nel testo.
# Over what Pandoc and Typst said while they made the document.
preview-remarks-warnings = Detto mentre il documento veniva fatto

## The details of a document: what stands on its first page.

preview-details-dialog = Il documento
preview-details-dialog-subtitle = Che cosa sta sulla sua prima pagina
preview-details-title = Titolo
preview-details-title-placeholder = Il nome del centro della mappa
preview-details-title-hint = Lasciato vuoto, il titolo è il nome del centro della mappa.
preview-details-subtitle = Sottotitolo
preview-details-authors = Autori
preview-details-name = Nome
preview-details-author-name = Nome dell'autore { $number }
preview-details-affiliation = Affiliazione
preview-details-author-affiliation = Affiliazione dell'autore { $number }
preview-details-email = E-mail
preview-details-author-email = E-mail dell'autore { $number }
# Beside a plus, under the authors: adds one.
preview-details-add-author = autore
preview-details-abstract = Abstract
preview-details-words = { $count ->
    [one] { $count } parola
    [many] { $count } parole
   *[other] { $count } parole
}
# The words of the abstract, and the most the format allows.
preview-details-words-of = { $limit ->
    [one] { $count } di { $limit } parola
    [many] { $count } di { $limit } parole
   *[other] { $count } di { $limit } parole
}
preview-details-keywords = Parole chiave
# The keywords given, and the most the format allows.
preview-details-keywords-of = { $count } di { $limit }
preview-details-keywords-placeholder = Separate da virgole
preview-details-date = Data
preview-details-date-placeholder = Come va stampata
preview-details-language = Lingua del testo
# A map that was given no language is printed in English.
preview-details-language-none = Non indicata (inglese)
preview-details-cover = Copertina
preview-details-cover-choose = Scegli un'immagine…
preview-details-cover-other = Un'altra…
preview-details-cover-hint = La copertina dell'e-book: un'immagine, conservata nel deposito delle immagini. Nient'altro la usa.

## The export: the kinds of file a document is made as.

preview-export = Esporta
preview-export-kind = Tipo di file
preview-export-pdf-about = Come la mostra l'anteprima
preview-export-pdflatex = PDF, composto da LaTeX
preview-export-pdflatex-about = Lo stesso documento nella composizione di LaTeX. Richiede un po' più di tempo.
preview-export-docx-about = Ciò che chiedono quasi tutti gli editori e le riviste
preview-export-odt-about = Per LibreOffice Writer e altri
preview-export-latex-about = Da comporre con LuaLaTeX o XeLaTeX
preview-export-markdown-about = Testo semplice, con le citazioni come chiavi
preview-export-html = Pagina web
preview-export-html-about = Un solo file, da leggere in un browser
preview-export-epub = E-book
preview-export-epub-about = EPUB, per i lettori di e-book e le app che li leggono; il testo lo impagina il lettore
preview-export-latex-missing = Per questo serve LaTeX, che non è stato trovato. Si installa come TeX Live.
preview-export-biblatex = Tieni le citazioni come comandi di BibLaTeX
preview-export-biblatex-hint = I riferimenti sono scritti in un file .bib accanto al documento. Lo stile di citazione è allora quello di BibLaTeX più vicino a quello scelto.
# The title of the window where the file is named; the kind is PDF, Word, and so on.
preview-export-as = Esporta come { $kind }
preview-export-run = Esporta…
preview-export-working = Creazione del documento…
preview-export-failed = Il documento non si è potuto fare.
preview-export-stop = Ferma
preview-export-stopped = La creazione è stata fermata. Nessun file è stato scritto.
# Under the name of the file that was made: another file made with it.
preview-export-also = con { $file }
preview-export-missing = { $count ->
    [one] Un'opera citata non è stata trovata, ed è segnata nel testo.
    [many] { $count } opere citate non sono state trovate, e sono segnate nel testo.
   *[other] { $count } opere citate non sono state trovate, e sono segnate nel testo.
}
preview-export-show-in-folder = Mostra nella cartella
preview-export-open-failed = Il file non si è potuto aprire
preview-export-folder-failed = La cartella non si è potuta aprire
preview-export-another = Esporta un altro
