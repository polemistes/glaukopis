# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-kind-picture = Immagine

## When text cannot be read.

ocr-stopped = La lettura è stata fermata.
ocr-no-language = Tesseract non ha i dati per la lingua «{ $language }».
ocr-no-languages = Tesseract non ha i dati per nessuna lingua. Installa i dati di una, come tesseract-data-eng su Arch.
ocr-not-pdf = «{ $file }» non è un PDF.
ocr-no-pages = «{ $file }» non ha pagine.
ocr-locked = «{ $file }» è protetto da una password, e le sue pagine non si possono disegnare.
ocr-unreadable = «{ $file }» non si è potuto leggere come PDF. Può essere danneggiato.
ocr-page-not-drawn = La pagina { $page } non si è potuta disegnare.
ocr-picture-unreadable = L'immagine non si è potuta leggere: { $message }
ocr-drawing = Un disegno (SVG) non ha dentro un'immagine da cui leggere testo.

## Making a PDF searchable.

ocr-searchable-locked = Il PDF è protetto, e non si può rendere ricercabile. Il suo testo si può comunque portare in un progetto come mappa.
ocr-searchable-unreadable = Il PDF non si è potuto rendere ricercabile: { $message }
ocr-not-whole = ciò che è stato prodotto non si è riletto intero, e non è stato conservato.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-read = { $count ->
    [one] Una pagina è stata letta da una sua immagine.
    [many] { $count } pagine sono state lette dalle loro immagini.
   *[other] { $count } pagine sono state lette dalle loro immagini.
}
ocr-remark-text = { $count ->
    [one] Una pagina aveva testo, che è preso come sta nel file.
    [many] { $count } pagine avevano testo, che è preso come sta nel file.
   *[other] { $count } pagine avevano testo, che è preso come sta nel file.
}
ocr-remark-no-tesseract = { $count ->
    [one] Una pagina non ha testo, ed è lasciata vuota: Tesseract, che legge il testo nelle immagini, non è installato.
    [many] { $count } pagine non hanno testo, e sono lasciate vuote: Tesseract, che legge il testo nelle immagini, non è installato.
   *[other] { $count } pagine non hanno testo, e sono lasciate vuote: Tesseract, che legge il testo nelle immagini, non è installato.
}
ocr-remark-not-read = Le pagine senza testo non si sono potute leggere: { $message }
ocr-remark-failed = La pagina { $page } non si è potuta leggere: { $message }
ocr-remark-more-failed = { $count ->
    [one] Un'altra pagina non si è potuta leggere.
    [many] Altre { $count } pagine non si sono potute leggere.
   *[other] Altre { $count } pagine non si sono potute leggere.
}
ocr-remark-empty = Non è stato trovato testo.
