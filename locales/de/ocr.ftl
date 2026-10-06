# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDFs und Bilder
ocr-no-tesseract = Tesseract, das Text in Bildern liest, ist nicht installiert oder wurde nicht gefunden. Installieren Sie es mit der Paketverwaltung Ihres Systems, mit den Daten der Sprachen, die Sie lesen (unter Arch: tesseract und tesseract-data-deu, tesseract-data-eng und so weiter), oder geben Sie in den Einstellungen an, wo es ist.
ocr-failed = Der Text konnte nicht gelesen werden.
ocr-looking = { $file } wird angesehen…
ocr-about-picture = Der Text wird aus dem Bild gelesen.
ocr-about-scan = { $pages ->
    [one] Das PDF hat keinen Text: er wird aus einem Bild seiner Seite gelesen.
   *[other] Keine der { $pages } Seiten hat Text: sie werden aus Bildern von ihnen gelesen.
}
ocr-about-some = { $without ->
    [one] Eine der { $pages } Seiten hat keinen Text und wird aus einem Bild von ihr gelesen; die anderen werden genommen, wie sie sind.
   *[other] { $without } der { $pages } Seiten haben keinen Text und werden aus Bildern von ihnen gelesen; die anderen werden genommen, wie sie sind.
}
ocr-about-text = { $pages ->
    [one] Die Seite hat Text, der genommen wird, wie er ist.
   *[other] Jede Seite hat Text, der genommen wird, wie er ist.
}
ocr-read-all = Auch die Seiten lesen, die Text haben
ocr-read-all-hint = Ihr Text bleibt, und das Gelesene wird darübergelegt.
ocr-read-all-map-hint = Das Gelesene tritt an die Stelle ihres Textes: wenn er schlecht ist oder nicht gelesen werden kann.
ocr-read = Text lesen
ocr-read-text-pages = Die Seiten mit Text nehmen
ocr-take-text = Text nehmen
ocr-reading = { $file } wird gelesen…
ocr-reading-pages = { $done } von { $total } Seiten gelesen
ocr-reading-hint = Eine Seite braucht ein paar Sekunden. Abbrechen hält das Lesen an.

## How the text is read: what to try when a reading goes badly

ocr-how = Wie gelesen wird
ocr-how-dpi = Auflösung, in Punkten je Zoll
ocr-how-layout = Aufbau der Seite
ocr-how-layout-auto = Wie Tesseract es beurteilt
ocr-how-layout-column = Eine Spalte
ocr-how-layout-block = Ein Textblock
ocr-how-layout-sparse = Verstreuter Text
ocr-how-contrast = Schwarz-Weiß
ocr-how-hint = Was zu versuchen ist, wenn eine Lesung schlecht ausfällt: eine höhere Auflösung für kleine Schrift, eine Spalte, wo Spalten durcheinandergeraten, ein Textblock für einen einzelnen Absatz, und Schwarz-Weiß für blassen oder ungleichmäßigen Druck.

## The languages of the text

ocr-languages = Sprachen des Textes
ocr-languages-hint = Die wahrscheinlichste zuerst. Jede weitere macht das Lesen langsamer, und nicht immer besser.
ocr-language-add = Sprache hinzufügen…
ocr-language-remove = { $language } wegnehmen
# A script rather than a language: "Latin script".
ocr-language-script = Schrift: { $script }
ocr-language-fraktur = { $language }, Fraktur
ocr-language-old = { $language }, älter
ocr-language-vertical = { $language }, von oben nach unten geschrieben

## A PDF of the library made searchable

ocr-searchable-button = Durchsuchbar machen…
ocr-searchable-title = Das PDF durchsuchbar machen
ocr-searchable-about = { $without ->
    [one] Eine der { $pages } Seiten hat keinen Text. Sie wird gelesen, und ihr Text wird unsichtbar unter das Gezeigte gelegt, damit er gesucht und kopiert werden kann. Das PDF sieht aus wie zuvor.
   *[other] { $without } der { $pages } Seiten haben keinen Text. Sie werden gelesen, und ihr Text wird unsichtbar unter das Gezeigte gelegt, damit er gesucht und kopiert werden kann. Das PDF sieht aus wie zuvor.
}
ocr-searchable-has-text = { $pages ->
    [one] Die Seite hat Text: das PDF kann schon durchsucht werden.
   *[other] Jede Seite hat Text: das PDF kann schon durchsucht werden.
}
ocr-searchable-damaged = Das PDF ließ sich nicht zum Ändern auseinandernehmen: es ist vielleicht beschädigt. Sein Text kann dennoch als Karte in ein Projekt eingelesen werden.
ocr-searchable-make = Durchsuchbar machen
ocr-strip = Den unsichtbaren Text, den sie haben, wegnehmen und nur das Gelesene behalten
ocr-strip-hint = Für eine schlechte Textebene, wie ein Scanner sie unter die Seite legt. Sichtbare Buchstaben bleiben, und die Seite sieht aus wie zuvor.
ocr-searchable-done = { $count ->
    [one] Das PDF ist durchsuchbar: eine Seite wurde gelesen
   *[other] Das PDF ist durchsuchbar: { $count } Seiten wurden gelesen
}
ocr-searchable-failed = { $count ->
    [one] Eine Seite konnte nicht gelesen werden.
   *[other] { $count } Seiten konnten nicht gelesen werden.
}

## A map from a PDF of the library

ocr-map-button = Eine Karte seines Textes…
ocr-map-title = Eine Karte des Textes
ocr-map-into = In das Projekt
ocr-map-new-project = Ein neues Projekt, nach ihm benannt
ocr-map-making = Die Karte wird angelegt…
ocr-map-failed = Die Karte konnte nicht angelegt werden.

## The text of a picture of the store

ocr-picture-read = Den Text darin lesen…
ocr-picture-title = Der Text im Bild
ocr-picture-empty = Im Bild wurde kein Text gefunden.
ocr-picture-copy = Kopieren
ocr-picture-copied = Der Text ist kopiert
ocr-picture-map = Eine Karte daraus machen

## Tesseract in the settings

ocr-settings-looking = Wird gesucht…
ocr-settings-missing = Nicht gefunden. Nötig, um Text aus Scans und Bildern zu lesen. Installieren Sie tesseract mit der Paketverwaltung Ihres Systems, mit den Daten der Sprachen, die Sie lesen (unter Arch tesseract-data-deu für Deutsch, tesseract-data-eng für Englisch, tesseract-data-grc für Altgriechisch, …), oder geben Sie unten an, wo es ist.
ocr-settings-by-itself = Von selbst gefunden
ocr-settings-where = Wo Tesseract ist
ocr-settings-look-failed = Nach Tesseract konnte nicht gesucht werden
ocr-settings-has = Es liest { $languages }.
ocr-settings-has-none = Es hat die Daten keiner Sprache: installieren Sie die einer Sprache, etwa tesseract-data-deu.
ocr-settings-first = Zuerst lesen in
ocr-settings-first-hint = Wenn keine gewählt sind, die Sprache des Textes und die der Oberfläche.
ocr-settings-how = Wie Text zuerst gelesen wird
