# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-kind-picture = Bilete

## When text cannot be read.

ocr-stopped = Lesinga vart stoppa.
ocr-no-language = Tesseract har ikkje data for språket «{ $language }».
ocr-no-languages = Tesseract har ikkje data for noko språk. Installer dataa for eitt, til dømes tesseract-data-eng på Arch.
ocr-not-pdf = «{ $file }» er ikkje ein PDF.
ocr-no-pages = «{ $file }» har ingen sider.
ocr-locked = «{ $file }» er låst med passord, og sidene kan ikkje teiknast.
ocr-unreadable = «{ $file }» kunne ikkje lesast som PDF. Fila kan vere skadd.
ocr-page-not-drawn = Side { $page } kunne ikkje teiknast.
ocr-picture-unreadable = Biletet kunne ikkje lesast: { $message }
ocr-drawing = Ei teikning (SVG) har ikkje noko bilete å lese tekst frå.

## Making a PDF searchable.

ocr-searchable-locked = PDF-en er låst, og kan ikkje gjerast søkbar. Teksten kan likevel hentast inn i eit prosjekt som eit kart.
ocr-searchable-unreadable = PDF-en kunne ikkje gjerast søkbar: { $message }
ocr-not-whole = det som vart laga, kunne ikkje lesast heilt inn att, og vart ikkje teke vare på.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-read = { $count ->
    [one] Éi side vart lesen frå eit bilete av den.
   *[other] { $count } sider vart lesne frå bilete av dei.
}
ocr-remark-text = { $count ->
    [one] Éi side hadde tekst, som blir teken slik fila har den.
   *[other] { $count } sider hadde tekst, som blir teken slik fila har den.
}
ocr-remark-no-tesseract = { $count ->
    [one] Éi side har ingen tekst, og blir ståande tom: Tesseract, som les tekst i bilete, er ikkje installert.
   *[other] { $count } sider har ingen tekst, og blir ståande tomme: Tesseract, som les tekst i bilete, er ikkje installert.
}
ocr-remark-not-read = Sidene utan tekst kunne ikkje lesast: { $message }
ocr-remark-failed = Side { $page } kunne ikkje lesast: { $message }
ocr-remark-more-failed = { $count ->
    [one] Éi side til kunne ikkje lesast.
   *[other] { $count } sider til kunne ikkje lesast.
}
ocr-remark-empty = Ingen tekst vart funnen.
