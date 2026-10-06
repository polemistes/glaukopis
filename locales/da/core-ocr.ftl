# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-kind-picture = Billede

## When text cannot be read.

ocr-stopped = Læsningen blev standset.
ocr-no-language = Tesseract har ingen data for sproget »{ $language }«.
ocr-no-languages = Tesseract har ingen data for noget sprog. Installer dataene for et, såsom tesseract-data-eng på Arch.
ocr-not-pdf = »{ $file }« er ikke en PDF.
ocr-no-pages = »{ $file }« har ingen sider.
ocr-locked = »{ $file }« er låst med en adgangskode, og dens sider kan ikke tegnes.
ocr-unreadable = »{ $file }« kunne ikke læses som PDF. Den kan være beskadiget.
ocr-page-not-drawn = Side { $page } kunne ikke tegnes.
ocr-picture-unreadable = Billedet kunne ikke læses: { $message }
ocr-drawing = En tegning (SVG) har intet billede i sig at læse tekst fra.

## Making a PDF searchable.

ocr-searchable-locked = PDF'en er låst og kan ikke gøres søgbar. Dens tekst kan stadig hentes ind i et projekt som et kort.
ocr-searchable-unreadable = PDF'en kunne ikke gøres søgbar: { $message }
ocr-not-whole = det, der blev lavet, kunne ikke læses helt tilbage og blev ikke gemt.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-read = { $count ->
    [one] Én side blev læst fra et billede af den.
   *[other] { $count } sider blev læst fra billeder af dem.
}
ocr-remark-text = { $count ->
    [one] Én side havde tekst, som tages, som filen har den.
   *[other] { $count } sider havde tekst, som tages, som filen har den.
}
ocr-remark-no-tesseract = { $count ->
    [one] Én side har ingen tekst og står tom: Tesseract, som læser tekst i billeder, er ikke installeret.
   *[other] { $count } sider har ingen tekst og står tomme: Tesseract, som læser tekst i billeder, er ikke installeret.
}
ocr-remark-not-read = De sider, der ingen tekst har, kunne ikke læses: { $message }
ocr-remark-failed = Side { $page } kunne ikke læses: { $message }
ocr-remark-more-failed = { $count ->
    [one] Én side mere kunne ikke læses.
   *[other] { $count } sider mere kunne ikke læses.
}
ocr-remark-empty = Der blev ikke fundet nogen tekst.
