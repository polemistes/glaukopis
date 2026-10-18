# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-no-headings = Ingen rubrik hittades: sidorna är elementen.
ocr-kind-picture = Bild

## When text cannot be read.

ocr-stopped = Läsningen avbröts.
ocr-no-language = Tesseract har inga data för språket ”{ $language }”.
ocr-no-languages = Tesseract har inga data för något språk. Importera ett under Inställningar › Program, eller installera ett med systemets pakethanterare, som tesseract-data-eng på Arch.
ocr-not-pdf = ”{ $file }” är inte en PDF.
ocr-no-pages = ”{ $file }” har inga sidor.
ocr-locked = ”{ $file }” är låst med ett lösenord, och dess sidor kan inte ritas upp.
ocr-unreadable = ”{ $file }” kunde inte läsas som PDF. Den kan vara skadad.
ocr-page-not-drawn = Sidan { $page } kunde inte ritas upp.
ocr-picture-unreadable = Bilden kunde inte läsas: { $message }
ocr-not-made = Tesseract gjorde inte { $path }.
ocr-not-made-said = Tesseract gjorde inte { $path }. Det sa: { $message }
ocr-drawing = En ritning (SVG) har ingen bild i sig att läsa text ur.

## Making a PDF searchable.

ocr-searchable-locked = PDF:en är låst och kan inte göras sökbar. Dess text kan ändå hämtas in i ett projekt som en karta.
ocr-searchable-unreadable = PDF:en kunde inte göras sökbar: { $message }
ocr-not-whole = det som gjordes gick inte att läsa tillbaka helt, och sparades inte.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-failed = Sidan { $page } kunde inte läsas: { $message }
ocr-remark-more-failed = { $count ->
    [one] Ytterligare en sida kunde inte läsas.
   *[other] Ytterligare { $count } sidor kunde inte läsas.
}
ocr-remark-empty = Ingen text hittades.

## What a reading of a PDF came to (ADR 0044).

ocr-remark-counts = { $read ->
    [0] Ingen sida läst av Tesseract
    [one] En sida läst av Tesseract
   *[other] { $read } sidor lästa av Tesseract
}, { $taken ->
    [0] ingen tagen ur PDF:ens egen text
    [one] en tagen ur PDF:ens egen text
   *[other] { $taken } tagna ur PDF:ens egen text
}, { $failed ->
    [0] ingen som inte kunde läsas.
    [one] en som inte kunde läsas.
   *[other] { $failed } som inte kunde läsas.
}
# Stands in the element in the place of a page that could not be read.
ocr-page-failed-line = [Den här sidan kunde inte läsas: { $message }]
ocr-why-no-tesseract = Tesseract, som läser text i bilder, är inte installerat.
