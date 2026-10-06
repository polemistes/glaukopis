# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-kind-picture = Bild

## When text cannot be read.

ocr-stopped = Läsningen avbröts.
ocr-no-language = Tesseract har inga data för språket ”{ $language }”.
ocr-no-languages = Tesseract har inga data för något språk. Installera data för ett, som tesseract-data-eng på Arch.
ocr-not-pdf = ”{ $file }” är inte en PDF.
ocr-no-pages = ”{ $file }” har inga sidor.
ocr-locked = ”{ $file }” är låst med ett lösenord, och dess sidor kan inte ritas upp.
ocr-unreadable = ”{ $file }” kunde inte läsas som PDF. Den kan vara skadad.
ocr-page-not-drawn = Sidan { $page } kunde inte ritas upp.
ocr-picture-unreadable = Bilden kunde inte läsas: { $message }
ocr-drawing = En ritning (SVG) har ingen bild i sig att läsa text ur.

## Making a PDF searchable.

ocr-searchable-locked = PDF:en är låst och kan inte göras sökbar. Dess text kan ändå hämtas in i ett projekt som en karta.
ocr-searchable-unreadable = PDF:en kunde inte göras sökbar: { $message }
ocr-not-whole = det som gjordes gick inte att läsa tillbaka helt, och sparades inte.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-read = { $count ->
    [one] En sida lästes från en bild av den.
   *[other] { $count } sidor lästes från bilder av dem.
}
ocr-remark-text = { $count ->
    [one] En sida hade text, som tas så som filen har den.
   *[other] { $count } sidor hade text, som tas så som filen har den.
}
ocr-remark-no-tesseract = { $count ->
    [one] En sida har ingen text och lämnas tom: Tesseract, som läser text i bilder, är inte installerat.
   *[other] { $count } sidor har ingen text och lämnas tomma: Tesseract, som läser text i bilder, är inte installerat.
}
ocr-remark-not-read = Sidorna utan text kunde inte läsas: { $message }
ocr-remark-failed = Sidan { $page } kunde inte läsas: { $message }
ocr-remark-more-failed = { $count ->
    [one] Ytterligare en sida kunde inte läsas.
   *[other] Ytterligare { $count } sidor kunde inte läsas.
}
ocr-remark-empty = Ingen text hittades.
