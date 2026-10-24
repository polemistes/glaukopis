# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-no-headings = Der blev ikke fundet nogen overskrift: siderne er elementerne.
ocr-kind-picture = Billede

## When text cannot be read.

ocr-stopped = Læsningen blev standset.
ocr-no-language = Tesseract har ingen data for sproget »{ $language }«.
ocr-no-languages = Tesseract har ingen data for noget sprog. Importer et under Indstillinger › Programmer, eller installer et med dit systems pakkehåndtering, såsom tesseract-data-eng på Arch.
ocr-not-pdf = »{ $file }« er ikke en PDF.
ocr-no-pages = »{ $file }« har ingen sider.
ocr-locked = »{ $file }« er låst med en adgangskode, og dens sider kan ikke tegnes.
ocr-unreadable = »{ $file }« kunne ikke læses som PDF. Den kan være beskadiget.
ocr-page-not-drawn = Side { $page } kunne ikke tegnes.
ocr-no-such-page = PDF'en har ingen side { $page }: den har { $pages }.
ocr-reading-gone = Læsningen er ikke længere gemt: læs filen igen.
ocr-picture-unreadable = Billedet kunne ikke læses: { $message }
ocr-not-made = Tesseract lavede ikke { $path }.
ocr-not-made-said = Tesseract lavede ikke { $path } og sagde: { $message }
ocr-drawing = En tegning (SVG) har intet billede i sig at læse tekst fra.
ocr-child-time = Læsningen af »{ $file }« tog længere tid, end den må, og blev standset. Filen kan være beskadiget eller lavet på en måde, der ikke kan læses.
ocr-child-memory = Læsningen af »{ $file }« brugte mere hukommelse, end den må, og blev standset. Filen kan være beskadiget eller lavet på en måde, der ikke kan læses.
ocr-child-failed = »{ $file }« kunne ikke læses: { $message }
ocr-child-not-started = »{ $file }« kunne ikke læses, da ingen proces kunne startes til at læse den: { $message }

## Making a PDF searchable.

ocr-searchable-locked = PDF'en er låst og kan ikke gøres søgbar. Dens tekst kan stadig hentes ind i et projekt som et kort.
ocr-searchable-unreadable = PDF'en kunne ikke gøres søgbar: { $message }
ocr-not-whole = det, der blev lavet, kunne ikke læses helt tilbage og blev ikke gemt.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-failed = Side { $page } kunne ikke læses: { $message }
ocr-remark-more-failed = { $count ->
    [one] Én side mere kunne ikke læses.
   *[other] { $count } sider mere kunne ikke læses.
}
ocr-remark-empty = Der blev ikke fundet nogen tekst.
ocr-remark-poorly = { $count ->
    [one] Én side blev læst dårligt: { $pages }. Et andet sprog, frakturmodellen til gotisk skrift eller en anden opsætning af siden kan læse den bedre; prøv den, før du læser den igen.
   *[other] { $count } sider blev læst dårligt: { $pages }. Et andet sprog, frakturmodellen til gotisk skrift eller en anden opsætning af siden kan læse dem bedre; prøv en side, før du læser dem alle igen.
}

## What a reading of a PDF came to (ADR 0044).

ocr-remark-counts = { $read ->
    [0] Ingen side læst af Tesseract
    [one] Én side læst af Tesseract
   *[other] { $read } sider læst af Tesseract
}, { $taken ->
    [0] ingen taget fra PDF'ens egen tekst
    [one] én taget fra PDF'ens egen tekst
   *[other] { $taken } taget fra PDF'ens egen tekst
} og { $failed ->
    [0] ingen, der ikke kunne læses.
    [one] én, der ikke kunne læses.
   *[other] { $failed }, der ikke kunne læses.
}
# Stands in the element in the place of a page that could not be read.
ocr-page-failed-line = [Denne side kunne ikke læses: { $message }]
ocr-why-no-tesseract = Tesseract, som læser tekst i billeder, er ikke installeret.
