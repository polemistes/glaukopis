# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-kind-picture = Slika

## When text cannot be read.

ocr-stopped = Čitanje je zaustavljeno.
ocr-no-language = Tesseract nema podatke za jezik „{ $language }“.
ocr-no-languages = Tesseract nema podatke ni za jedan jezik. Instalirajte podatke za neki, kao tesseract-data-eng na Archu.
ocr-not-pdf = „{ $file }“ nije PDF.
ocr-no-pages = „{ $file }“ nema stranica.
ocr-locked = „{ $file }“ je zaključan lozinkom i njegove se stranice ne mogu iscrtati.
ocr-unreadable = „{ $file }“ nije bilo moguće pročitati kao PDF. Možda je oštećen.
ocr-page-not-drawn = Stranicu { $page } nije bilo moguće iscrtati.
ocr-picture-unreadable = Sliku nije bilo moguće pročitati: { $message }
ocr-drawing = Crtež (SVG) nema u sebi slike iz koje bi se čitao tekst.

## Making a PDF searchable.

ocr-searchable-locked = PDF je zaključan i ne može se učiniti pretraživim. Njegov se tekst ipak može učitati u projekat kao mapa.
ocr-searchable-unreadable = PDF nije bilo moguće učiniti pretraživim: { $message }
ocr-not-whole = napravljeno se nije dalo pročitati u cijelosti i nije sačuvano.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-failed = Stranicu { $page } nije bilo moguće pročitati: { $message }
ocr-remark-more-failed = { $count ->
    [one] Još jednu stranicu nije bilo moguće pročitati.
    [few] Još { $count } stranice nije bilo moguće pročitati.
   *[other] Još { $count } stranica nije bilo moguće pročitati.
}
ocr-remark-empty = Nije pronađen nikakav tekst.
