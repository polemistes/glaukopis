# The typesetting pane, and the making of documents: the pages as the
# document is set, with its Look beside them, and the export.

## The head of the typesetting pane.

# The last among the reference styles, which opens the search for more.
preview-style-more = Altri stili…
# Shows in the text the element whose place in the pages is looked at.
preview-go-to-text = Vai a questo punto nel testo
# Moves the pages to where the element the text is at begins.
preview-show-text = Mostra dove sta il testo
preview-hide = Nascondi la composizione
# The name of the program is Pandoc, Typst or LaTeX.
preview-program-missing = { $program } non è installato
preview-programs-needed = Anteprima ed esportazione si fanno con Pandoc e Typst. Installali con il gestore dei pacchetti del tuo sistema, oppure di' nelle impostazioni dove si trovano.
preview-look-again = Cerca di nuovo
preview-looking-failed = Non si sono potuti cercare i programmi
preview-reading-failed = Gli stili, le impaginazioni e i modelli non si sono potuti leggere
preview-failed = L'anteprima non si è potuta fare
preview-failed-message = L'anteprima non si è potuta fare.
# A page of the preview, as it is told to those who cannot see it.
preview-page = Pagina { $number }
# The name of an exported file, where the element has no name.
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
# The words of the text, and the most the template allows.
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
# The first name is that of the font the layout asks for; this is of the one used in its place.
preview-font-substitute = Al suo posto si usa { $font }, qui nell'anteprima e in un PDF che si produce. In un documento esportato per Word, LibreOffice o LaTeX, il font è indicato come chiede l'impaginazione, e c'è per chi apre il documento e ce l'ha.
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

## What a line of a page is: the chip at the edge of the page that names the
## line the pointer rests on and opens Look at it, and its switch at the foot.

# On the chip: what the line is.
preview-what-text = Testo
# A heading, by its level: Heading 1, Heading 2.
preview-what-heading = Titolo { $level }
preview-what-note = Nota
preview-what-bibliography = Bibliografia
preview-what-figure = Figura
preview-what-table = Tabella
preview-what-front = Prima pagina
# What the chip does, as it is told to those who cannot see it; what the line is: Quotation, Heading 1.
preview-what-open = Come appare «{ $what }»…
# The switch at the foot of the preview, while the chips are not shown and while they are.
preview-chips = Dai un nome alle righe della pagina
preview-chips-off = Smetti di dare un nome alle righe

preview-what-page = Pagina
preview-what-header = Intestazione
preview-what-footer = Piè di pagina

## The sides, the panes and the bars, stage 2: the typesetting pane, the document pane, Document properties.

# The pane where the document is set into pages, with its Look beside them.
preview-title = Composizione

## The settings in plain words, stage 2: the zoom of the typesetting pane.

# The button of the zoom and the first choice of its menu: the pages as wide as the pane.
preview-zoom-fit = Adatta alla larghezza
# The button of the zoom and the choices of its menu: the size of the pages against their size on paper.
preview-zoom = { $percent }%
# What the button of the zoom is, as it is told to those who cannot see it.
preview-zoom-label = Zoom
