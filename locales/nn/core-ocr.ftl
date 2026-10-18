# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-no-headings = Inga overskrift vart funnen: sidene er elementa.
ocr-kind-picture = Bilete

## When text cannot be read.

ocr-stopped = Lesinga vart stoppa.
ocr-no-language = Tesseract har ikkje data for språket «{ $language }».
ocr-no-languages = Tesseract har ikkje data for noko språk. Importer eitt under Innstillingar › Program, eller installer eitt med pakkehandsamaren på systemet ditt, til dømes tesseract-data-eng på Arch.
ocr-not-pdf = «{ $file }» er ikkje ein PDF.
ocr-no-pages = «{ $file }» har ingen sider.
ocr-locked = «{ $file }» er låst med passord, og sidene kan ikkje teiknast.
ocr-unreadable = «{ $file }» kunne ikkje lesast som PDF. Fila kan vere skadd.
ocr-page-not-drawn = Side { $page } kunne ikkje teiknast.
ocr-picture-unreadable = Biletet kunne ikkje lesast: { $message }
ocr-not-made = Tesseract laga ikkje { $path }.
ocr-not-made-said = Tesseract laga ikkje { $path }. Det sa: { $message }
ocr-drawing = Ei teikning (SVG) har ikkje noko bilete å lese tekst frå.

## Making a PDF searchable.

ocr-searchable-locked = PDF-en er låst, og kan ikkje gjerast søkbar. Teksten kan likevel hentast inn i eit prosjekt som eit kart.
ocr-searchable-unreadable = PDF-en kunne ikkje gjerast søkbar: { $message }
ocr-not-whole = det som vart laga, kunne ikkje lesast heilt inn att, og vart ikkje teke vare på.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-failed = Side { $page } kunne ikkje lesast: { $message }
ocr-remark-more-failed = { $count ->
    [one] Éi side til kunne ikkje lesast.
   *[other] { $count } sider til kunne ikkje lesast.
}
ocr-remark-empty = Ingen tekst vart funnen.

## What a reading of a PDF came to (ADR 0044).

ocr-remark-counts = { $read ->
    [0] Inga side lesen av Tesseract
    [one] Éi side lesen av Tesseract
   *[other] { $read } sider lesne av Tesseract
}, { $taken ->
    [0] ingen tekne frå teksten PDF-en har sjølv
    [one] éi teken frå teksten PDF-en har sjølv
   *[other] { $taken } tekne frå teksten PDF-en har sjølv
}, { $failed ->
    [0] ingen som ikkje kunne lesast.
    [one] éi som ikkje kunne lesast.
   *[other] { $failed } som ikkje kunne lesast.
}
# Stands in the element in the place of a page that could not be read.
ocr-page-failed-line = [Denne sida kunne ikkje lesast: { $message }]
ocr-why-no-tesseract = Tesseract, som les tekst i bilete, er ikkje installert.
