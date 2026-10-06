# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDF e immagini
ocr-no-tesseract = Tesseract, che legge il testo nelle immagini, non è installato o non si trova. Installalo con il gestore dei pacchetti del tuo sistema, con i dati delle lingue che leggi (su Arch: tesseract e tesseract-data-ita, tesseract-data-eng e così via), oppure di' nelle impostazioni dove si trova.
ocr-failed = Il testo non si è potuto leggere.
ocr-looking = Esame di { $file }…
ocr-about-picture = Il testo è letto dall'immagine.
ocr-about-scan = { $pages ->
    [one] Il PDF non ha testo: è letto da un'immagine della sua pagina.
    [many] Nessuna delle { $pages } pagine ha testo: sono lette dalle loro immagini.
   *[other] Nessuna delle { $pages } pagine ha testo: sono lette dalle loro immagini.
}
ocr-about-some = { $without ->
    [one] Una delle { $pages } pagine non ha testo, ed è letta da una sua immagine; le altre sono prese come sono.
    [many] { $without } delle { $pages } pagine non hanno testo, e sono lette dalle loro immagini; le altre sono prese come sono.
   *[other] { $without } delle { $pages } pagine non hanno testo, e sono lette dalle loro immagini; le altre sono prese come sono.
}
ocr-about-text = { $pages ->
    [one] La pagina ha testo, che è preso com'è.
    [many] Ogni pagina ha testo, che è preso com'è.
   *[other] Ogni pagina ha testo, che è preso com'è.
}
ocr-read-all = Leggi anche le pagine che hanno testo
ocr-read-all-hint = Il loro testo resta, e ciò che è letto gli è posato sopra.
ocr-read-all-map-hint = Ciò che è letto prende il posto del loro testo: per quando è scadente, o non si può leggere.
ocr-read = Leggi il testo
ocr-read-text-pages = Prendi le pagine che hanno testo
ocr-take-text = Prendi il testo
ocr-reading = Lettura di { $file }…
ocr-reading-pages = { $done } di { $total } pagine lette
ocr-reading-hint = Una pagina richiede qualche secondo. Annulla ferma la lettura.

## How the text is read: what to try when a reading goes badly

ocr-how = Come è letto
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
ocr-searchable-about = { $without ->
    [one] Una delle { $pages } pagine non ha testo. È letta, e il suo testo è posato invisibile sotto ciò che si vede, così che si possa cercare e copiare. Il PDF ha l'aspetto di prima.
    [many] { $without } delle { $pages } pagine non hanno testo. Sono lette, e il loro testo è posato invisibile sotto ciò che si vede, così che si possa cercare e copiare. Il PDF ha l'aspetto di prima.
   *[other] { $without } delle { $pages } pagine non hanno testo. Sono lette, e il loro testo è posato invisibile sotto ciò che si vede, così che si possa cercare e copiare. Il PDF ha l'aspetto di prima.
}
ocr-searchable-has-text = { $pages ->
    [one] La pagina ha testo: il PDF si può già cercare.
    [many] Ogni pagina ha testo: il PDF si può già cercare.
   *[other] Ogni pagina ha testo: il PDF si può già cercare.
}
ocr-searchable-damaged = Il PDF non si è potuto smontare per modificarlo: può essere danneggiato. Il suo testo si può comunque portare in un progetto come mappa.
ocr-searchable-make = Rendi ricercabile
ocr-strip = Togli il testo invisibile che hanno, e tieni solo ciò che è letto
ocr-strip-hint = Per uno strato di testo scadente, come lo posa sotto la pagina uno scanner. Le lettere che si vedono restano, e la pagina ha l'aspetto di prima.
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

## A map from a PDF of the library

ocr-map-button = Una mappa del suo testo…
ocr-map-title = Una mappa del testo
ocr-map-into = Nel progetto
ocr-map-new-project = Un nuovo progetto, con il suo nome
ocr-map-making = Creazione della mappa…
ocr-map-failed = La mappa non si è potuta fare.

## The text of a picture of the store

ocr-picture-read = Leggi il testo che contiene…
ocr-picture-title = Il testo nell'immagine
ocr-picture-empty = Nell'immagine non è stato trovato testo.
ocr-picture-copy = Copia
ocr-picture-copied = Il testo è copiato
ocr-picture-map = Fanne una mappa

## Tesseract in the settings

ocr-settings-looking = Ricerca…
ocr-settings-missing = Non trovato. Serve per leggere il testo da scansioni e immagini. Installa tesseract con il gestore dei pacchetti del tuo sistema, con i dati delle lingue che leggi (su Arch tesseract-data-ita per l'italiano, tesseract-data-eng per l'inglese, tesseract-data-grc per il greco antico, …), oppure di' qui sotto dove si trova.
ocr-settings-by-itself = Trovato da sé
ocr-settings-where = Dove si trova Tesseract
ocr-settings-look-failed = Non si è potuto cercare Tesseract
ocr-settings-has = Legge { $languages }.
ocr-settings-has-none = Non ha i dati di nessuna lingua: installa quelli di una, come tesseract-data-ita.
ocr-settings-first = Leggi all'inizio in
ocr-settings-first-hint = Quando non ne è scelta nessuna, la lingua del testo e quella dell'interfaccia.
ocr-settings-how = Come il testo è letto all'inizio
