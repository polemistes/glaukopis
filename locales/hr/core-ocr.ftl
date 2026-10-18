# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-no-headings = Nije pronađen nijedan naslov: elementi su stranice.
ocr-kind-picture = Slika

## When text cannot be read.

ocr-stopped = Čitanje je zaustavljeno.
ocr-no-language = Tesseract nema podataka za jezik „{ $language }”.
ocr-no-languages = Tesseract nema podataka ni za jedan jezik. Uvezite jedan pod Postavke › Programi ili ga instalirajte upraviteljem paketa svojega sustava, npr. tesseract-data-eng na Archu.
ocr-not-pdf = „{ $file }” nije PDF.
ocr-no-pages = „{ $file }” nema stranica.
ocr-locked = „{ $file }” zaključana je lozinkom i njezine se stranice ne mogu iscrtati.
ocr-unreadable = „{ $file }” nije bilo moguće pročitati kao PDF. Možda je oštećena.
ocr-page-not-drawn = Stranicu { $page } nije bilo moguće iscrtati.
ocr-picture-unreadable = Sliku nije bilo moguće pročitati: { $message }
ocr-not-made = Tesseract nije izradio { $path }.
ocr-not-made-said = Tesseract nije izradio { $path }. Rekao je: { $message }
ocr-drawing = Crtež (SVG) nema u sebi slike iz koje bi se čitao tekst.

## Making a PDF searchable.

ocr-searchable-locked = PDF je zaključan i ne može se učiniti pretraživim. Njegov se tekst ipak može učitati u projekt kao mapa.
ocr-searchable-unreadable = PDF nije bilo moguće učiniti pretraživim: { $message }
ocr-not-whole = što je načinjeno nije se dalo pročitati cijelo i nije sačuvano.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-failed = Stranicu { $page } nije bilo moguće pročitati: { $message }
ocr-remark-more-failed = { $count ->
    [1] Još jednu stranicu nije bilo moguće pročitati.
    [one] Još { $count } stranicu nije bilo moguće pročitati.
    [few] Još { $count } stranice nije bilo moguće pročitati.
   *[other] Još { $count } stranica nije bilo moguće pročitati.
}
ocr-remark-empty = Tekst nije pronađen.

## What a reading of a PDF came to (ADR 0044).

ocr-remark-counts = { $read ->
    [0] Tesseract nije pročitao nijednu stranicu
    [1] Tesseract je pročitao jednu stranicu
    [one] Tesseract je pročitao { $read } stranicu
    [few] Tesseract je pročitao { $read } stranice
   *[other] Tesseract je pročitao { $read } stranica
}, { $taken ->
    [0] nijedna nije uzeta iz vlastitog teksta PDF-a
    [1] jedna je uzeta iz vlastitog teksta PDF-a
    [one] { $taken } je uzeta iz vlastitog teksta PDF-a
    [few] { $taken } su uzete iz vlastitog teksta PDF-a
   *[other] { $taken } ih je uzeto iz vlastitog teksta PDF-a
}, { $failed ->
    [0] nijedna nije ostala nepročitana.
    [1] jednu nije bilo moguće pročitati.
    [one] { $failed } nije bilo moguće pročitati.
    [few] { $failed } nije bilo moguće pročitati.
   *[other] { $failed } nije bilo moguće pročitati.
}
# Stands in the element in the place of a page that could not be read.
ocr-page-failed-line = [Ovu stranicu nije bilo moguće pročitati: { $message }]
ocr-why-no-tesseract = Tesseract, koji čita tekst na slikama, nije instaliran.
