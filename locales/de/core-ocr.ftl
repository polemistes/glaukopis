# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-no-headings = Es wurde keine Überschrift gefunden: die Seiten sind die Elemente.
ocr-kind-picture = Bild

## When text cannot be read.

ocr-stopped = Das Lesen wurde abgebrochen.
ocr-no-language = Tesseract hat keine Daten für die Sprache „{ $language }“.
ocr-no-languages = Tesseract hat für keine Sprache Daten. Importieren Sie eine unter Einstellungen › Programme, oder installieren Sie eine mit der Paketverwaltung Ihres Systems, etwa tesseract-data-deu unter Arch.
ocr-not-pdf = „{ $file }“ ist kein PDF.
ocr-no-pages = „{ $file }“ hat keine Seiten.
ocr-locked = „{ $file }“ ist mit einem Passwort gesperrt, und seine Seiten können nicht gezeichnet werden.
ocr-unreadable = „{ $file }“ konnte nicht als PDF gelesen werden. Es ist vielleicht beschädigt.
ocr-page-not-drawn = Seite { $page } konnte nicht gezeichnet werden.
ocr-picture-unreadable = Das Bild konnte nicht gelesen werden: { $message }
ocr-not-made = Tesseract hat { $path } nicht erzeugt.
ocr-not-made-said = Tesseract hat { $path } nicht erzeugt. Es sagte: { $message }
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

## What a reading of a PDF came to (ADR 0044).

ocr-remark-counts = { $read ->
    [0] Keine Seite von Tesseract gelesen
    [one] Eine Seite von Tesseract gelesen
   *[other] { $read } Seiten von Tesseract gelesen
}, { $taken ->
    [0] keine aus dem eigenen Text des PDF übernommen
    [one] eine aus dem eigenen Text des PDF übernommen
   *[other] { $taken } aus dem eigenen Text des PDF übernommen
}, { $failed ->
    [0] keine, die nicht gelesen werden konnte.
    [one] eine, die nicht gelesen werden konnte.
   *[other] { $failed }, die nicht gelesen werden konnten.
}
# Stands in the element in the place of a page that could not be read.
ocr-page-failed-line = [Diese Seite konnte nicht gelesen werden: { $message }]
ocr-why-no-tesseract = Tesseract, das Text in Bildern liest, ist nicht installiert.
