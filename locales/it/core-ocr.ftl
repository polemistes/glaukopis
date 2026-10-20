# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-no-headings = Non è stato trovato nessun titolo: le pagine sono gli elementi.
ocr-kind-picture = Immagine

## When text cannot be read.

ocr-stopped = La lettura è stata fermata.
ocr-no-language = Tesseract non ha i dati per la lingua «{ $language }».
ocr-no-languages = Tesseract non ha i dati di nessuna lingua. Importane una in Impostazioni › Programmi, o installala con il gestore dei pacchetti del tuo sistema, come tesseract-data-eng su Arch.
ocr-not-pdf = «{ $file }» non è un PDF.
ocr-no-pages = «{ $file }» non ha pagine.
ocr-locked = «{ $file }» è protetto da una password, e le sue pagine non si possono disegnare.
ocr-unreadable = «{ $file }» non si è potuto leggere come PDF. Può essere danneggiato.
ocr-page-not-drawn = La pagina { $page } non si è potuta disegnare.
ocr-no-such-page = Il PDF non ha una pagina { $page }: ne ha { $pages }.
ocr-reading-gone = La lettura non è più tenuta: leggi di nuovo il file.
ocr-picture-unreadable = L'immagine non si è potuta leggere: { $message }
ocr-not-made = Tesseract non ha prodotto { $path }.
ocr-not-made-said = Tesseract non ha prodotto { $path }. Ha detto: { $message }
ocr-drawing = Un disegno (SVG) non ha dentro un'immagine da cui leggere testo.
ocr-child-time = La lettura di «{ $file }» è durata più di quanto possa, ed è stata fermata. Il file può essere danneggiato, o fatto in un modo che non si può leggere.
ocr-child-memory = La lettura di «{ $file }» ha preso più memoria di quanta possa, ed è stata fermata. Il file può essere danneggiato, o fatto in un modo che non si può leggere.
ocr-child-failed = «{ $file }» non si è potuto leggere: { $message }
ocr-child-not-started = «{ $file }» non si è potuto leggere, perché non si è potuto avviare un processo che lo leggesse: { $message }

## Making a PDF searchable.

ocr-searchable-locked = Il PDF è protetto, e non si può rendere ricercabile. Il suo testo si può comunque portare in un progetto come mappa.
ocr-searchable-unreadable = Il PDF non si è potuto rendere ricercabile: { $message }
ocr-not-whole = ciò che è stato prodotto non si è riletto intero, e non è stato conservato.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-failed = La pagina { $page } non si è potuta leggere: { $message }
ocr-remark-more-failed = { $count ->
    [one] Un'altra pagina non si è potuta leggere.
    [many] Altre { $count } pagine non si sono potute leggere.
   *[other] Altre { $count } pagine non si sono potute leggere.
}
ocr-remark-empty = Non è stato trovato testo.
ocr-remark-poorly = { $count ->
    [one] Una pagina è stata letta male: { $pages }. Un'altra lingua, il modello Fraktur per i caratteri gotici, o un'altra impaginazione possono leggerla meglio; provala prima di leggerla di nuovo.
    [many] { $count } pagine sono state lette male: { $pages }. Un'altra lingua, il modello Fraktur per i caratteri gotici, o un'altra impaginazione possono leggerle meglio; prova una pagina prima di leggerle di nuovo tutte.
   *[other] { $count } pagine sono state lette male: { $pages }. Un'altra lingua, il modello Fraktur per i caratteri gotici, o un'altra impaginazione possono leggerle meglio; prova una pagina prima di leggerle di nuovo tutte.
}
ocr-remark-fraktur = I libri in caratteri gotici, come erano molti libri norvegesi, danesi, svedesi e tedeschi prima del 1900 circa, si leggono con il modello Fraktur, scelto per primo o da solo, qualunque sia la loro lingua. Non conosce æ, ø e å, e le legge come e, o e a.
# The same, where Norwegian or Danish was read: the Fraktur model of Glaukopis's server that knows æ, ø and å.
ocr-remark-fraktur-dan = I libri norvegesi e danesi in caratteri gotici, come erano molti prima del 1900 circa, si leggono con Fraktur, danese e norvegese, importato dal server di Glaukopis e scelto per primo o da solo, qualunque siano le lingue accanto: conosce æ, ø e å, che il modello Fraktur fatto per il tedesco non conosce.

## What a reading of a PDF came to (ADR 0044).

ocr-remark-counts = { $read ->
    [0] Nessuna pagina letta da Tesseract
    [one] Una pagina letta da Tesseract
    [many] { $read } pagine lette da Tesseract
   *[other] { $read } pagine lette da Tesseract
}, { $taken ->
    [0] nessuna presa dal testo che il PDF ha di suo
    [one] una presa dal testo che il PDF ha di suo
    [many] { $taken } prese dal testo che il PDF ha di suo
   *[other] { $taken } prese dal testo che il PDF ha di suo
}, { $failed ->
    [0] nessuna che non si sia potuta leggere.
    [one] una che non si è potuta leggere.
    [many] { $failed } che non si sono potute leggere.
   *[other] { $failed } che non si sono potute leggere.
}
# Stands in the element in the place of a page that could not be read.
ocr-page-failed-line = [Questa pagina non si è potuta leggere: { $message }]
ocr-why-no-tesseract = Tesseract, che legge il testo nelle immagini, non è installato.
