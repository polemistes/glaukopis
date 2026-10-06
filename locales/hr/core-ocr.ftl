# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-kind-picture = Slika

## When text cannot be read.

ocr-stopped = Čitanje je zaustavljeno.
ocr-no-language = Tesseract nema podataka za jezik „{ $language }”.
ocr-no-languages = Tesseract nema podataka ni za jedan jezik. Instalirajte podatke za neki, npr. tesseract-data-eng na Archu.
ocr-not-pdf = „{ $file }” nije PDF.
ocr-no-pages = „{ $file }” nema stranica.
ocr-locked = „{ $file }” zaključana je lozinkom i njezine se stranice ne mogu iscrtati.
ocr-unreadable = „{ $file }” nije bilo moguće pročitati kao PDF. Možda je oštećena.
ocr-page-not-drawn = Stranicu { $page } nije bilo moguće iscrtati.
ocr-picture-unreadable = Sliku nije bilo moguće pročitati: { $message }
ocr-drawing = Crtež (SVG) nema u sebi slike iz koje bi se čitao tekst.

## Making a PDF searchable.

ocr-searchable-locked = PDF je zaključan i ne može se učiniti pretraživim. Njegov se tekst ipak može učitati u projekt kao mapa.
ocr-searchable-unreadable = PDF nije bilo moguće učiniti pretraživim: { $message }
ocr-not-whole = što je načinjeno nije se dalo pročitati cijelo i nije sačuvano.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-read = { $count ->
    [1] Jedna stranica pročitana je iz svoje slike.
    [one] { $count } stranica pročitana je iz svoje slike.
    [few] { $count } stranice pročitane su iz svojih slika.
   *[other] { $count } stranica pročitano je iz njihovih slika.
}
ocr-remark-text = { $count ->
    [1] Jedna stranica imala je tekst, koji je uzet kakav je u datoteci.
    [one] { $count } stranica imala je tekst, koji je uzet kakav je u datoteci.
    [few] { $count } stranice imale su tekst, koji je uzet kakav je u datoteci.
   *[other] { $count } stranica imalo je tekst, koji je uzet kakav je u datoteci.
}
ocr-remark-no-tesseract = { $count ->
    [1] Jedna stranica nema teksta i ostavljena je prazna: Tesseract, koji čita tekst na slikama, nije instaliran.
    [one] { $count } stranica nema teksta i ostavljena je prazna: Tesseract, koji čita tekst na slikama, nije instaliran.
    [few] { $count } stranice nemaju teksta i ostavljene su prazne: Tesseract, koji čita tekst na slikama, nije instaliran.
   *[other] { $count } stranica nema teksta i ostavljene su prazne: Tesseract, koji čita tekst na slikama, nije instaliran.
}
ocr-remark-not-read = Stranice bez teksta nije bilo moguće pročitati: { $message }
ocr-remark-failed = Stranicu { $page } nije bilo moguće pročitati: { $message }
ocr-remark-more-failed = { $count ->
    [1] Još jednu stranicu nije bilo moguće pročitati.
    [one] Još { $count } stranicu nije bilo moguće pročitati.
    [few] Još { $count } stranice nije bilo moguće pročitati.
   *[other] Još { $count } stranica nije bilo moguće pročitati.
}
ocr-remark-empty = Tekst nije pronađen.
