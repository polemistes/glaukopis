# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-kind-picture = Afbeelding

## When text cannot be read.

ocr-stopped = Het lezen is gestopt.
ocr-no-language = Tesseract heeft geen gegevens voor de taal ‘{ $language }’.
ocr-no-languages = Tesseract heeft voor geen enkele taal gegevens. Installeer de gegevens van een taal, zoals tesseract-data-nld op Arch.
ocr-not-pdf = ‘{ $file }’ is geen PDF.
ocr-no-pages = ‘{ $file }’ heeft geen pagina's.
ocr-locked = ‘{ $file }’ is met een wachtwoord vergrendeld, en zijn pagina's kunnen niet worden getekend.
ocr-unreadable = ‘{ $file }’ kon niet als PDF worden gelezen. Het is misschien beschadigd.
ocr-page-not-drawn = Pagina { $page } kon niet worden getekend.
ocr-picture-unreadable = De afbeelding kon niet worden gelezen: { $message }
ocr-drawing = Een tekening (SVG) heeft geen afbeelding in zich om tekst uit te lezen.

## Making a PDF searchable.

ocr-searchable-locked = De PDF is vergrendeld en kan niet doorzoekbaar worden gemaakt. Zijn tekst kan wel als mindmap in een project worden binnengehaald.
ocr-searchable-unreadable = De PDF kon niet doorzoekbaar worden gemaakt: { $message }
ocr-not-whole = wat is gemaakt, kwam niet heel terug bij het teruglezen, en is niet bewaard.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-failed = Pagina { $page } kon niet worden gelezen: { $message }
ocr-remark-more-failed = { $count ->
    [one] Nog één pagina kon niet worden gelezen.
   *[other] Nog { $count } pagina's konden niet worden gelezen.
}
ocr-remark-empty = Er is geen tekst gevonden.
