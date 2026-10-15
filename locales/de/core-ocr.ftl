# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-kind-picture = Bild

## When text cannot be read.

ocr-stopped = Das Lesen wurde abgebrochen.
ocr-no-language = Tesseract hat keine Daten für die Sprache „{ $language }“.
ocr-no-languages = Tesseract hat für keine Sprache Daten. Installieren Sie die Daten einer Sprache, etwa tesseract-data-deu unter Arch.
ocr-not-pdf = „{ $file }“ ist kein PDF.
ocr-no-pages = „{ $file }“ hat keine Seiten.
ocr-locked = „{ $file }“ ist mit einem Passwort gesperrt, und seine Seiten können nicht gezeichnet werden.
ocr-unreadable = „{ $file }“ konnte nicht als PDF gelesen werden. Es ist vielleicht beschädigt.
ocr-page-not-drawn = Seite { $page } konnte nicht gezeichnet werden.
ocr-picture-unreadable = Das Bild konnte nicht gelesen werden: { $message }
ocr-drawing = Eine Zeichnung (SVG) hat kein Bild in sich, aus dem Text gelesen werden könnte.

## Making a PDF searchable.

ocr-searchable-locked = Das PDF ist gesperrt und kann nicht durchsuchbar gemacht werden. Sein Text kann dennoch als Karte in ein Projekt eingelesen werden.
ocr-searchable-unreadable = Das PDF konnte nicht durchsuchbar gemacht werden: { $message }
ocr-not-whole = was erzeugt wurde, ließ sich nicht vollständig zurücklesen und wurde nicht behalten.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-failed = Seite { $page } konnte nicht gelesen werden: { $message }
ocr-remark-more-failed = { $count ->
    [one] Eine weitere Seite konnte nicht gelesen werden.
   *[other] { $count } weitere Seiten konnten nicht gelesen werden.
}
ocr-remark-empty = Es wurde kein Text gefunden.
