# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-kind-picture = Slika

## When text cannot be read.

ocr-stopped = Branje je bilo ustavljeno.
ocr-no-language = Tesseract nima podatkov za jezik »{ $language }«.
ocr-no-languages = Tesseract nima podatkov za noben jezik. Namestite podatke za katerega, na Archu na primer tesseract-data-eng.
ocr-not-pdf = »{ $file }« ni PDF.
ocr-no-pages = »{ $file }« nima strani.
ocr-locked = »{ $file }« je zaklenjen z geslom in njegovih strani ni mogoče izrisati.
ocr-unreadable = »{ $file }« ni bilo mogoče prebrati kot PDF. Morda je poškodovan.
ocr-page-not-drawn = Strani { $page } ni bilo mogoče izrisati.
ocr-picture-unreadable = Slike ni bilo mogoče prebrati: { $message }
ocr-drawing = Risba (SVG) nima slike, iz katere bi se bralo besedilo.

## Making a PDF searchable.

ocr-searchable-locked = PDF je zaklenjen in mu ni mogoče dodati besedila za iskanje. Njegovo besedilo je vseeno mogoče uvoziti v projekt kot miselni vzorec.
ocr-searchable-unreadable = PDF-ju ni bilo mogoče dodati besedila za iskanje: { $message }
ocr-not-whole = kar je bilo narejeno, se ni prebralo nazaj celo in ni shranjeno.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-read = { $count ->
    [one] { $count } stran je bila prebrana iz svoje slike.
    [two] { $count } strani sta bili prebrani iz svojih slik.
    [few] { $count } strani so bile prebrane iz svojih slik.
   *[other] { $count } strani je bilo prebranih iz svojih slik.
}
ocr-remark-text = { $count ->
    [one] { $count } stran je imela besedilo, ki je vzeto, kakršno je v datoteki.
    [two] { $count } strani sta imeli besedilo, ki je vzeto, kakršno je v datoteki.
    [few] { $count } strani so imele besedilo, ki je vzeto, kakršno je v datoteki.
   *[other] { $count } strani je imelo besedilo, ki je vzeto, kakršno je v datoteki.
}
ocr-remark-no-tesseract = { $count ->
    [one] { $count } stran nima besedila in ostane prazna: Tesseract, ki bere besedilo v slikah, ni nameščen.
    [two] { $count } strani nimata besedila in ostaneta prazni: Tesseract, ki bere besedilo v slikah, ni nameščen.
    [few] { $count } strani nimajo besedila in ostanejo prazne: Tesseract, ki bere besedilo v slikah, ni nameščen.
   *[other] { $count } strani nima besedila in ostanejo prazne: Tesseract, ki bere besedilo v slikah, ni nameščen.
}
ocr-remark-not-read = Strani brez besedila ni bilo mogoče prebrati: { $message }
ocr-remark-failed = Strani { $page } ni bilo mogoče prebrati: { $message }
ocr-remark-more-failed = { $count ->
    [one] Še { $count } strani ni bilo mogoče prebrati.
    [two] Še { $count } strani ni bilo mogoče prebrati.
    [few] Še { $count } strani ni bilo mogoče prebrati.
   *[other] Še { $count } strani ni bilo mogoče prebrati.
}
ocr-remark-empty = Besedilo ni bilo najdeno.
