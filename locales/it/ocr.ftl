# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDF e immagini
ocr-no-tesseract = Tesseract, che legge il testo nelle immagini, non è installato o non si trova. Installalo con il gestore dei pacchetti del tuo sistema, con i dati delle lingue che leggi (su Arch: tesseract e tesseract-data-ita, tesseract-data-eng e così via), oppure di' nelle impostazioni dove si trova.
ocr-failed = Il testo non si è potuto leggere.
ocr-looking = Esame di { $file }…
ocr-about-picture = Il testo è letto dall'immagine.
# Where the pages of a PDF are pictures of too few dots to the inch to be read well.
ocr-low-resolution = Le pagine sono immagini a { $dpi } punti per pollice: troppo pochi perché le loro lettere si leggano bene, qualunque cosa si scelga.
ocr-low-resolution-text = Leggerle di nuovo non migliorerà il testo che il PDF contiene.

ocr-trying = Lettura della pagina { $page }…
ocr-tried-nothing = Sulla pagina { $label } non è stato letto testo.
ocr-tried-blocks = { $count ->
    [one] Mostra il blocco di testo
    [many] Mostra i { $count } blocchi di testo
   *[other] Mostra i { $count } blocchi di testo
}
ocr-tried-blocks-hint = I blocchi di testo che Tesseract ha trovato, numerati nell'ordine in cui li legge. Due colonne prese per una, o note prese dentro il testo, si leggono nell'ordine sbagliato: un'altra impaginazione può separarle.

ocr-read = Leggi il testo
ocr-read-pages = { $count ->
    [one] Leggi una pagina
    [many] Leggi { $count } pagine
   *[other] Leggi { $count } pagine
}
ocr-read-text-pages = Prendi le pagine che hanno testo
ocr-take-text = Prendi il testo
ocr-reading = Lettura di { $file }…
ocr-reading-pages = { $done } di { $total } pagine lette
ocr-reading-hint = Una pagina richiede qualche secondo. Annulla ferma la lettura.

## How the text is read: what to try when a reading goes badly

ocr-how-dpi = Risoluzione, in punti per pollice
ocr-how-layout = Impaginazione
ocr-how-layout-auto = Come giudica Tesseract
ocr-how-layout-column = Una colonna
ocr-how-layout-block = Un blocco di testo
ocr-how-layout-sparse = Testo sparso
ocr-how-contrast = Bianco e nero
ocr-how-hint = Che cosa provare quando una lettura va male: una risoluzione più alta per la stampa piccola, una colonna dove le colonne si confondono, un blocco di testo per un solo paragrafo, e bianco e nero per una stampa sbiadita o irregolare.

## The languages of the text

ocr-languages = Lingue del testo
ocr-languages-hint = Prima la più probabile. Ogni lingua in più rende la lettura più lenta, e non sempre migliore.
ocr-language-add = Aggiungi una lingua…
ocr-language-remove = Togli { $language }
# A script rather than a language: "Latin script".
ocr-language-script = scrittura { $script }
ocr-language-fraktur = { $language }, Fraktur
ocr-language-old = { $language }, antico
ocr-language-vertical = { $language }, scritto in verticale

## A PDF of the library made searchable

ocr-searchable-button = Rendi ricercabile…
ocr-searchable-title = Rendi il PDF ricercabile
ocr-searchable-damaged = Il PDF non si è potuto smontare per modificarlo: può essere danneggiato. Il suo testo si può comunque portare in un progetto come mappa.
ocr-searchable-make = Rendi ricercabile
ocr-searchable-done = { $count ->
    [one] Il PDF è ricercabile: è stata letta una pagina
    [many] Il PDF è ricercabile: sono state lette { $count } pagine
   *[other] Il PDF è ricercabile: sono state lette { $count } pagine
}
ocr-searchable-failed = { $count ->
    [one] Una pagina non si è potuta leggere.
    [many] { $count } pagine non si sono potute leggere.
   *[other] { $count } pagine non si sono potute leggere.
}
ocr-searchable-poorly = { $count ->
    [one] Una pagina è stata letta male: { $pages }.
    [many] { $count } pagine sono state lette male: { $pages }.
   *[other] { $count } pagine sono state lette male: { $pages }.
} Prova una pagina con un'altra lingua, o con il modello Fraktur per i caratteri gotici.

## A PDF of the library read into a project, as a tree of elements

ocr-map-button = Importa il suo testo come mappa…
ocr-map-title = Importa il testo come mappa
ocr-map-into = Nel progetto
ocr-map-new-project = Un nuovo progetto, con il suo nome
ocr-map-make = Importa
ocr-map-making = Importazione…
ocr-map-failed = Gli elementi non si sono potuti fare.

## The text of a picture of the store

ocr-picture-read = Leggi il testo che contiene…
ocr-picture-title = Il testo nell'immagine
ocr-picture-empty = Nell'immagine non è stato trovato testo.
ocr-picture-copy = Copia
ocr-picture-copied = Il testo è copiato
ocr-picture-copy-failed = Il testo non si è potuto copiare
ocr-picture-map = Fanne un elemento

## Tesseract in the settings

ocr-settings-looking = Ricerca…
ocr-settings-missing = Non trovato. Serve per leggere il testo da scansioni e immagini. Installa tesseract con il gestore dei pacchetti del tuo sistema, con i dati delle lingue che leggi (su Arch tesseract-data-ita per l'italiano, tesseract-data-eng per l'inglese, tesseract-data-grc per il greco antico, …), oppure di' qui sotto dove si trova.
ocr-settings-by-itself = Trovato da sé
ocr-settings-where = Dove si trova Tesseract
ocr-settings-look-failed = Non si è potuto cercare Tesseract
ocr-settings-title = Riconoscimento ottico dei caratteri (OCR)
ocr-settings-has-none = Non ha i dati di nessuna lingua: importane una qui sotto, o installane una con il gestore dei pacchetti del tuo sistema, come tesseract-data-ita.
ocr-settings-first = Lingue predefinite per l'OCR
ocr-settings-how = Impostazioni predefinite per l'OCR
ocr-settings-languages = Lingue dell'OCR
ocr-settings-languages-hint = Glaukopis usa Tesseract per l'OCR. I file delle lingue che importi qui si useranno al posto di quelli che hai forse installato sul tuo sistema.
ocr-source-system = Sistema
ocr-source-imported = Importato
ocr-settings-not-found = Tesseract non è stato trovato. Di' dove si trova sotto Programmi, qui sotto.

## What becomes of the text a PDF has (the same in every dialog that reads one).

ocr-text-title = Il testo che il PDF contiene

## What is found of the text a PDF has, and what can be done with it (ADR 0044).

ocr-text-scheme-greek-names = Il greco è conservato come nomi dei glifi di { $fonts }, e se ne possono fare lettere greche.
ocr-text-scheme-expert-names = Il maiuscoletto e le cifre minuscole di { $fonts } sono conservati per nome, e se ne possono fare le loro lettere e cifre.
ocr-text-scheme-beta-code = Il greco è scritto in Beta Code, e se ne possono fare lettere greche.
ocr-text-page = Pagina { $label }
ocr-text-page-none = Nessun testo su questa pagina: si legge da un'immagine di essa.
ocr-text-rest-failed = Le pagine dopo queste non si sono potute leggere.
ocr-searchable-make-readable = Rendi leggibile
ocr-searchable-readable-done = { $count ->
    [one] Il testo del PDF ora è leggibile: a un font sono state date le sue lettere
    [many] Il testo del PDF ora è leggibile: a { $count } font sono state date le loro lettere
   *[other] Il testo del PDF ora è leggibile: a { $count } font sono state date le loro lettere
}

## The shape of the pages, and scripts whose letters look alike (ADR 0045).

ocr-shape = Tieni la forma delle pagine
ocr-shape-hint = Titoli, righe tenute come righe, numeri nel margine, e le testatine lasciate fuori. Senza, le pagine diventano semplici paragrafi.
# How a PDF read with its shape kept becomes a map: the document's own tree, or an element for each page.
ocr-structure = Elementi
ocr-structure-headings = Secondo i suoi titoli
ocr-page-marks = Segna dove comincia ogni pagina
ocr-page-marks-hint = Un segno di riferimento con il numero della pagina, dove cominciava.
# What is made of a PDF that was read, asked after the reading: the same reading made anew.
ocr-made-title = Che cosa se ne fa
ocr-made-headings = { $count ->
    [0] Nessun titolo trovato
    [one] Secondo il suo unico titolo
    [many] Secondo i suoi { $count } titoli
   *[other] Secondo i suoi { $count } titoli
}
ocr-made-pages = { $count ->
    [one] Secondo la sua unica pagina
    [many] Secondo le sue { $count } pagine
   *[other] Secondo le sue { $count } pagine
}
ocr-made-failed = Gli elementi non si sono potuti rifare
# The outline shown before a PDF read by its headings is made into a map.
ocr-outline-title = Che cosa si farà
ocr-outline-all = Mostra tutti i { $count }

# The styles of text that recur beside the body, shown after the reading, for the writer to say what each is.
ocr-styles-title = Stili di testo trovati
ocr-styles-about = { $count ->
    [one] Uno stile di testo ricorre accanto al corpo del testo. Di' che cos'è, o lascialo come testo.
    [many] { $count } stili di testo ricorrono accanto al corpo del testo. Di' che cos'è ciascuno, o lasciali come testo.
   *[other] { $count } stili di testo ricorrono accanto al corpo del testo. Di' che cos'è ciascuno, o lasciali come testo.
}
# How often a style found occurs: "12 times on 9 pages".
ocr-styles-often = { $count ->
    [one] Una volta
    [many] { $count } volte
   *[other] { $count } volte
} in { $pages ->
    [one] una pagina
    [many] { $pages } pagine
   *[other] { $pages } pagine
}
ocr-styles-kind = Che cos'è
ocr-styles-own = Un tipo tuo…
ocr-styles-own-name = Nome del tipo
ocr-styles-own-hint = Si crea quando il documento è portato dentro, senza un aspetto suo finché non gliene dai uno.
# The first guess of the name of a kind of your own: the look of the style in words, put together as "{ $look } text", "Smaller italic text", "Indented text", or for lines kept as lines, "{ $look } lines kept", "Lines kept". $kept is yes for lines kept, where a language bends the words of the look by it.
ocr-style-guess = { $kept ->
    [yes] Righe tenute { $look }
   *[other] Testo { $look }
}
ocr-style-indented = { $kept ->
    [yes] rientrate
   *[other] rientrato
}
ocr-style-smaller = { $kept ->
    [yes] più piccole
   *[other] più piccolo
}
ocr-style-larger = { $kept ->
    [yes] più grandi
   *[other] più grande
}
ocr-style-bold = { $kept ->
   *[other] in grassetto
}
ocr-style-italic = { $kept ->
   *[other] in corsivo
}
# A style that differs from the body only by its font.
ocr-style-family = Testo in { $family }
ocr-style-other = Altro testo
# A script among the languages chosen, as it stands in the warning below: "the Greek script is read together with the Latin".
ocr-script = { $script ->
    [Greek] greco
    [Cyrillic] cirillico
   *[Latin] latino
}
# $alike: the letters that look alike, in pairs, the first script's first: "ϲ c, ο o, ν v".
ocr-languages-scripts-alike = L'alfabeto { $a } è letto insieme con quello { $b }: lettere che si somigliano nei due ({ $alike }) sono spesso lette l'una per l'altra, e parole intere vengono fuori sbagliate. Per un alfabeto solo, togli gli altri.


## The strip of the pages of a PDF, drawn small, to choose a page from.

ocr-strip = Le pagine
ocr-strip-page = Pagina { $number }
# A page that could not be drawn, where nothing more is said of why.
ocr-strip-page-failed = Non disegnata
# $from and $to: the first and the last of the pages, counted from one, that were to be drawn together.
ocr-strip-failed = Le pagine { $from }–{ $to } non si sono potute disegnare.

# The panes of the workbench: the picture of the page in view, the text the
# PDF has for it, what Tesseract read of it with the page's trials, and the
# column of the reading settings beside them. The panes' titles and their
# lines on a page without text are ocr-text-page, ocr-text-title and
# ocr-text-page-none above; the blocks drawn on the picture, ocr-tried-blocks.

ocr-settings-heading = Come legge Tesseract
# The button under the reading settings: the page in view is read with them.
ocr-settings-try = Prova la pagina { $page }
# A trial's settings said in a line, where no language was chosen: Tesseract then reads English.
ocr-settings-said-no-language = Inglese, perché nessuna lingua è scelta
# A trial's settings said in a line, where the page was made black and white before it was read.
ocr-settings-said-contrast = B/N
# How large the picture of the page is shown: the whole page in the pane, or its own size, or twice that.
ocr-picture-size = Dimensione dell'immagine
ocr-picture-fit = Adatta
ocr-picture-actual = 100%
ocr-picture-double = 200%
# The alternative text of the picture of the page in view.
ocr-picture-alt = Pagina { $label }
ocr-pane-translated = Tradotto secondo ciò che dicono i font
ocr-pane-sound = Si legge come testo
ocr-pane-poor = Non si legge come testo: lettere di un font che non dice quali sono, o una lettura cattiva
ocr-pane-tesseract = Ciò che ha letto Tesseract
ocr-pane-try-hint = Premi «Prova la pagina { $page }» per leggere questa pagina con le impostazioni qui accanto.
# How sure Tesseract was of a page tried, in one line: "Page 40: Low confidence (73%) · 89 of 251 words unsure". Low is under 80, good up to 89, high from 90.
ocr-tried-page = Pagina { $label }:
ocr-confidence-low = Affidabilità bassa ({ $confidence }%)
ocr-confidence-good = Affidabilità buona ({ $confidence }%)
ocr-confidence-high = Affidabilità alta ({ $confidence }%)
ocr-tried-unsure = { $unsure ->
    [0] nessuna parola incerta
    [one] una parola incerta su { $words }
    [many] { $unsure } parole incerte su { $words }
   *[other] { $unsure } parole incerte su { $words }
}
ocr-tried-low-hint = Sotto l'80%: prova un'altra lingua, il modello Fraktur per i caratteri gotici, o un'altra impaginazione.
# The tooltip of a word Tesseract was unsure of.
ocr-pane-unsure-word = Letta con un'affidabilità del { $confidence }%
# Said after the line over the settings, where the pages selected are read in different ways: a change holds for all of them.
ocr-settings-scope-differ = (lette in modi diversi)
# Over the list of the page's trials, each said by the settings it was read with.
ocr-trials = Provata con
ocr-trial-confidence = { $confidence }%
ocr-trial-nothing = Niente letto
ocr-trial-use = Usa queste impostazioni

# The pages of the workbench

# The line over the strip of pages says what each page gets: the text the PDF has, or what Tesseract reads.
ocr-pages-said-pdf = { $pages ->
    [one] La pagina prende il testo che il PDF contiene.
    [many] Tutte le { $pages } pagine prendono il testo che il PDF contiene.
   *[other] Tutte le { $pages } pagine prendono il testo che il PDF contiene.
}
ocr-pages-said-read = { $pages ->
    [one] La pagina è letta con Tesseract.
    [many] Tutte le { $pages } pagine sono lette con Tesseract.
   *[other] Tutte le { $pages } pagine sono lette con Tesseract.
}
ocr-pages-said-both = { $pdf ->
    [one] Una pagina prende il testo che il PDF contiene;
    [many] { $pdf } pagine prendono il testo che il PDF contiene;
   *[other] { $pdf } pagine prendono il testo che il PDF contiene;
} { $read ->
    [one] una è letta con Tesseract.
    [many] { $read } sono lette con Tesseract.
   *[other] { $read } sono lette con Tesseract.
}
# Where Tesseract is not installed, and pages are to be read.
ocr-pages-said-unreadable = { $pages ->
    [one] La pagina non si può leggere: Tesseract non è installato.
    [many] Nessuna delle { $pages } pagine si può leggere: Tesseract non è installato.
   *[other] Nessuna delle { $pages } pagine si può leggere: Tesseract non è installato.
}
ocr-pages-said-both-unreadable = { $pdf ->
    [one] Una pagina prende il testo che il PDF contiene;
    [many] { $pdf } pagine prendono il testo che il PDF contiene;
   *[other] { $pdf } pagine prendono il testo che il PDF contiene;
} { $read ->
    [one] una non si può leggere senza Tesseract.
    [many] { $read } non si possono leggere senza Tesseract.
   *[other] { $read } non si possono leggere senza Tesseract.
}
ocr-pages-said-picture = Il testo è letto dall'immagine.
ocr-pages-said-picture-unreadable = Il testo dell'immagine non si può leggere senza Tesseract.
# What the actions beside it hold for: every page, or those selected ($pages: "pages 39–120", as ocr-pages-selection says them).
ocr-pages-scope-all = { $pages ->
    [one] Per la pagina
    [many] Per tutte le { $pages } pagine
   *[other] Per tutte le { $pages } pagine
}
ocr-pages-scope = Per { $pages }
# Pages selected, as they stand in a sentence: "page 280", "pages 3–5, 9".
ocr-pages-selection = { $count ->
    [one] la pagina { $pages }
    [many] le pagine { $pages }
   *[other] le pagine { $pages }
}
ocr-pages-all = Tutte le pagine
ocr-pages-pdf = Il testo del PDF
ocr-pages-pdf-hint = Queste pagine prendono il testo che il PDF contiene. Le pagine senza testo si leggono comunque.
ocr-pages-read = Leggi con Tesseract
ocr-pages-read-hint = Queste pagine si leggono di nuovo dalle loro immagini, qualunque testo abbiano.
ocr-pages-decide = Decidi secondo la qualità del testo
ocr-pages-decide-hint = Pagina per pagina: il testo che si legge come testo si prende; quello che non si legge così, e le pagine senza testo, si leggono.

# The mark in the corner of a page in the strip, saying what it gets.
ocr-strip-source-pdf = PDF
ocr-strip-source-read = Letta
ocr-strip-source-pdf-hint = Prende il testo che il PDF contiene.
ocr-strip-source-read-hint = È letta con Tesseract.
ocr-strip-poor = Il testo che ha non si legge come testo.
# The band over a stretch of pages read alike: its languages, the resolution where it is not 300, the layout where it is told, and black and white.
ocr-strip-band-none = Inglese, perché nessuna lingua è scelta
ocr-strip-band-dpi = { $dpi } punti per pollice
# Black and white, in short.
ocr-strip-band-contrast = B/N
ocr-strip-band-hint = { $count ->
    [one] Pagina { $from }: { $said }
    [many] Pagine { $from }–{ $to }: { $said }
   *[other] Pagine { $from }–{ $to }: { $said }
}

# The summary of a reading, as the dialog opens: what the file is, said in parts joined by commas.
ocr-summary-pages = { $pages ->
    [one] Una pagina
    [many] { $pages } pagine
   *[other] { $pages } pagine
}
ocr-summary-scanned = scansione a { $dpi } punti per pollice
ocr-summary-no-text = { $pages ->
    [one] senza testo proprio
    [many] senza testo proprio
   *[other] senza testo proprio
}
ocr-summary-text-all = { $pages ->
    [one] con testo proprio
    [many] tutte con testo proprio
   *[other] tutte con testo proprio
}
ocr-summary-text-some = { $with ->
    [one] una di esse con testo proprio
    [many] { $with } di esse con testo proprio
   *[other] { $with } di esse con testo proprio
}
ocr-summary-poor = { $poor ->
    [one] una delle quali non si legge come testo
    [many] { $poor } delle quali non si leggono come testo
   *[other] { $poor } delle quali non si leggono come testo
}
ocr-summary-poor-all = che non si legge come testo
# Over the choice of what every page takes.
ocr-summary-whole = Che cosa prendono le pagine
ocr-summary-mixed = Scelto pagina per pagina. Una scelta qui vale di nuovo per ogni pagina.
# Under the reading settings, where no page is to be read with Tesseract.
ocr-summary-idle = Valgono per le pagine lette con Tesseract; ora non ce n'è nessuna.
ocr-summary-pages-open = Guarda le pagine e provale…
ocr-summary-picture-open = Provala…
ocr-summary-back = Torna al riepilogo

## The settings in plain words, stage 1: the Fraktur models named by the languages they were trained on.

# Tesseract's Fraktur model, among the languages of the text: named for the type it reads, then for the language it was trained on.
ocr-language-fraktur-german = Fraktur (caratteri gotici), tedesco
# Glaukopis's own Fraktur model: Tesseract's, taught æ, ø and å on Norwegian books; it reads Danish as well.
ocr-language-fraktur-norwegian = Fraktur (caratteri gotici), norvegese e danese
# Under the languages of the text, where a model of Gothic type is installed and neither Norwegian nor Danish is chosen.
ocr-languages-fraktur-hint = I libri in caratteri gotici, come spesso erano quelli norvegesi, danesi, svedesi e tedeschi prima del 1900 circa, si leggono con «Fraktur (caratteri gotici), tedesco», scelto per primo o da solo, qualunque sia la loro lingua. Non conosce æ, ø e å; i libri norvegesi e danesi si leggono con «Fraktur (caratteri gotici), norvegese e danese», che le conosce.
# The same, where Norwegian or Danish is chosen.
ocr-languages-fraktur-hint-dan = I libri norvegesi e danesi in caratteri gotici, come molti erano prima del 1900 circa, si leggono con «Fraktur (caratteri gotici), norvegese e danese», scelto per primo o da solo, quali che siano le lingue accanto: conosce æ, ø e å, che quello tedesco non conosce.
