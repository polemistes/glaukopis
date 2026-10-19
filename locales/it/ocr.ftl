# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDF e immagini
ocr-no-tesseract = Tesseract, che legge il testo nelle immagini, non è installato o non si trova. Installalo con il gestore dei pacchetti del tuo sistema, con i dati delle lingue che leggi (su Arch: tesseract e tesseract-data-ita, tesseract-data-eng e così via), oppure di' nelle impostazioni dove si trova.
ocr-failed = Il testo non si è potuto leggere.
ocr-looking = Esame di { $file }…
ocr-about-picture = Il testo è letto dall'immagine.
ocr-read = Leggi il testo
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
