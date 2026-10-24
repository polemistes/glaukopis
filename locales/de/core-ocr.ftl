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
ocr-no-such-page = Das PDF hat keine Seite { $page }: es hat { $pages }.
ocr-reading-gone = Die Lesung wird nicht mehr aufbewahrt: lesen Sie die Datei erneut.
ocr-picture-unreadable = Das Bild konnte nicht gelesen werden: { $message }
ocr-not-made = Tesseract hat { $path } nicht erzeugt.
ocr-not-made-said = Tesseract hat { $path } nicht erzeugt. Es sagte: { $message }
ocr-drawing = Eine Zeichnung (SVG) hat kein Bild in sich, aus dem Text gelesen werden könnte.
ocr-child-time = Das Lesen von „{ $file }“ dauerte länger, als es darf, und wurde abgebrochen. Die Datei ist vielleicht beschädigt oder so gemacht, dass sie nicht gelesen werden kann.
ocr-child-memory = Das Lesen von „{ $file }“ brauchte mehr Speicher, als es darf, und wurde abgebrochen. Die Datei ist vielleicht beschädigt oder so gemacht, dass sie nicht gelesen werden kann.
ocr-child-failed = „{ $file }“ konnte nicht gelesen werden: { $message }
ocr-child-not-started = „{ $file }“ konnte nicht gelesen werden, da kein Prozess gestartet werden konnte, der es einliest: { $message }

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
ocr-remark-poorly = { $count ->
    [one] Eine Seite wurde schlecht gelesen: { $pages }. Eine andere Sprache, das Fraktur-Modell für gebrochene Schrift oder ein anderer Aufbau der Seite liest sie vielleicht besser; probieren Sie es aus, bevor Sie sie erneut lesen.
   *[other] { $count } Seiten wurden schlecht gelesen: { $pages }. Eine andere Sprache, das Fraktur-Modell für gebrochene Schrift oder ein anderer Aufbau der Seite liest sie vielleicht besser; probieren Sie eine Seite aus, bevor Sie alle erneut lesen.
}

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

## The settings in plain words, stage 1: the Fraktur models named by the languages they were trained on.

# Under pages read poorly, where the language read was once set in Gothic type, and neither Norwegian nor Danish was read.
ocr-remark-fraktur = Bücher in Fraktur, wie viele norwegische, dänische, schwedische und deutsche vor etwa 1900, werden mit dem Modell „Fraktur (gebrochene Schrift), Deutsch“ gelesen, zuerst oder allein gewählt, welche Sprache sie auch haben. Es kennt kein æ, ø oder å und liest sie als e, o und a.
# The same, where Norwegian or Danish was read: the Fraktur model of Glaukopis's server that knows æ, ø and å.
ocr-remark-fraktur-dan = Norwegische und dänische Bücher in Fraktur, wie viele vor etwa 1900, werden mit dem Modell „Fraktur (gebrochene Schrift), Norwegisch und Dänisch“ gelesen, vom Server von Glaukopis importiert und zuerst oder allein gewählt, welche Sprachen auch daneben stehen: es kennt æ, ø und å, die das deutsche Modell nicht kennt.
