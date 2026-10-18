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
ocr-searchable-done = { $count ->
    [one] Das PDF ist durchsuchbar: eine Seite wurde gelesen
   *[other] Das PDF ist durchsuchbar: { $count } Seiten wurden gelesen
}
ocr-searchable-failed = { $count ->
    [one] Eine Seite konnte nicht gelesen werden.
   *[other] { $count } Seiten konnten nicht gelesen werden.
}

## A PDF of the library read into a project, as a tree of elements

ocr-map-button = Seinen Text als Karte importieren…
ocr-map-title = Den Text als Karte importieren
ocr-map-into = In das Projekt
ocr-map-new-project = Ein neues Projekt, nach ihm benannt
ocr-map-make = Importieren
ocr-map-making = Wird importiert…
ocr-map-failed = Die Elemente konnten nicht angelegt werden.

## The text of a picture of the store

ocr-picture-read = Den Text darin lesen…
ocr-picture-title = Der Text im Bild
ocr-picture-empty = Im Bild wurde kein Text gefunden.
ocr-picture-copy = Kopieren
ocr-picture-copied = Der Text ist kopiert
ocr-picture-map = Ein Element daraus machen

## Tesseract in the settings

ocr-settings-looking = Wird gesucht…
ocr-settings-missing = Nicht gefunden. Nötig, um Text aus Scans und Bildern zu lesen. Installieren Sie tesseract mit der Paketverwaltung Ihres Systems, mit den Daten der Sprachen, die Sie lesen (unter Arch tesseract-data-deu für Deutsch, tesseract-data-eng für Englisch, tesseract-data-grc für Altgriechisch, …), oder geben Sie unten an, wo es ist.
ocr-settings-by-itself = Von selbst gefunden
ocr-settings-where = Wo Tesseract ist
ocr-settings-look-failed = Nach Tesseract konnte nicht gesucht werden
ocr-settings-title = Texterkennung (OCR)
ocr-settings-has-none = Es hat die Daten keiner Sprache: importieren Sie unten eine, oder installieren Sie eine mit der Paketverwaltung Ihres Systems, etwa tesseract-data-deu.
ocr-settings-first = Standardsprachen der Texterkennung
ocr-settings-how = Standardeinstellungen der Texterkennung
ocr-settings-languages = Sprachen der Texterkennung
ocr-settings-languages-hint = Glaukopis verwendet Tesseract für die Texterkennung. Die Sprachdateien, die Sie hier importieren, werden statt derer verwendet, die Sie vielleicht in Ihrem System installiert haben.
ocr-source-system = System
ocr-source-imported = Importiert
ocr-settings-not-found = Tesseract wurde nicht gefunden. Geben Sie unten unter „Programme“ an, wo es ist.

## What becomes of the text a PDF has (the same in every dialog that reads one).

ocr-text-title = Der Text, den das PDF hat
# Said where some pages have text that does not read as text.
ocr-text-poor = { $poor ->
    [one] Auf einer der { $pages } Seiten mit Text ist er nicht als Text lesbar, etwa weil eine Schrift nicht sagt, welche Buchstaben sie zeigt, oder weil eine Lesung schlecht war.
   *[other] Auf { $poor } der { $pages } Seiten mit Text ist er nicht als Text lesbar, etwa weil eine Schrift nicht sagt, welche Buchstaben sie zeigt, oder weil eine Lesung schlecht war.
}
# Said where every page that has text has text that does not read as text.
ocr-text-poor-all = { $pages ->
    [one] Der Text, den das PDF hat, ist nicht als Text lesbar, etwa weil eine Schrift nicht sagt, welche Buchstaben sie zeigt, oder weil eine Lesung schlecht war.
   *[other] Auf allen { $pages } Seiten mit Text ist er nicht als Text lesbar, etwa weil eine Schrift nicht sagt, welche Buchstaben sie zeigt, oder weil eine Lesung schlecht war.
}
ocr-text-keep = Den Text des PDF behalten
ocr-text-keep-hint = Nur die Seiten ohne Text werden gelesen; die anderen werden genommen, wie sie sind.
ocr-text-keep-searchable-hint = Nur die Seiten ohne Text werden gelesen; die anderen behalten den Text, den sie haben.
ocr-text-anew = Jede Seite neu mit Tesseract lesen
ocr-text-anew-hint = Behalten wird nur, was Tesseract aus Bildern der Seiten liest; der Text des PDF wird von keiner Seite genommen.
ocr-text-anew-searchable-hint = Der unsichtbare Text der Seiten wird entfernt und das Gelesene an seine Stelle gelegt. Die Seiten sehen aus wie zuvor.
ocr-about-anew = { $pages ->
    [one] Die Seite wird neu gelesen, aus einem Bild von ihr.
   *[other] Alle { $pages } Seiten werden neu gelesen, aus Bildern von ihnen.
}
ocr-searchable-anew = { $pages ->
    [one] Die Seite wird neu gelesen, und ihr Text wird unsichtbar unter das Gezeigte gelegt, anstelle dessen, was sie hatte. Das PDF sieht aus wie zuvor.
   *[other] Alle { $pages } Seiten werden neu gelesen, und ihr Text wird unsichtbar unter das Gezeigte gelegt, anstelle dessen, was sie hatten. Das PDF sieht aus wie zuvor.
}

## What is found of the text a PDF has, and what can be done with it (ADR 0044).

ocr-text-found = Text auf { $withText } von { $pages } Seiten, in { $fonts }.
ocr-text-found-no-fonts = Text auf { $withText } von { $pages } Seiten.
# The first fonts, and how many more there are.
ocr-text-fonts-more = { $fonts } und { $count ->
    [one] eine weitere
   *[other] { $count } weitere
}
ocr-text-scheme-greek-names = Das Griechische ist als Glyphennamen von { $fonts } gespeichert und kann zu griechischen Buchstaben gemacht werden.
ocr-text-scheme-expert-names = Kapitälchen und Mediävalziffern von { $fonts } sind nach Namen gespeichert und können zu ihren Buchstaben und Ziffern gemacht werden.
ocr-text-scheme-beta-code = Griechisch ist in Beta Code geschrieben und kann zu griechischen Buchstaben gemacht werden.
ocr-text-translate = In lesbaren Text übersetzen
ocr-text-translate-hint = Der Text wird durch das lesbar gemacht, was die Schriften über ihre Buchstaben sagen; keine Seite wird dafür aus einem Bild gelesen.
ocr-text-translate-searchable-hint = Die eigenen Tabellen des PDF werden berichtigt, so dass jedes Leseprogramm den Text richtig kopiert und durchsucht; nichts Gezeichnetes ändert sich.
ocr-text-anew-no-tesseract = Tesseract, das Text in Bildern liest, ist nicht installiert.
ocr-text-page = Seite { $label }
ocr-text-page-none = Kein Text auf dieser Seite: sie wird aus einem Bild von ihr gelesen.
ocr-about-translate = { $without ->
    [0] Der Text des PDF wird lesbar gemacht; keine Seite wird aus einem Bild gelesen.
    [one] Der Text des PDF wird lesbar gemacht, und die eine Seite ohne Text wird aus einem Bild von ihr gelesen.
   *[other] Der Text des PDF wird lesbar gemacht, und die { $without } Seiten ohne Text werden aus Bildern von ihnen gelesen.
}
ocr-searchable-translate = { $without ->
    [0] Die Schriften des PDF bekommen ihre Buchstaben, so dass sein Text richtig kopiert und durchsucht werden kann. Das PDF sieht aus wie zuvor.
    [one] Die Schriften des PDF bekommen ihre Buchstaben, und die eine Seite ohne Text wird gelesen und bekommt Text. Das PDF sieht aus wie zuvor.
   *[other] Die Schriften des PDF bekommen ihre Buchstaben, und die { $without } Seiten ohne Text werden gelesen und bekommen Text. Das PDF sieht aus wie zuvor.
}
ocr-searchable-make-readable = Lesbar machen
ocr-searchable-readable-done = { $count ->
    [one] Der Text des PDF ist jetzt lesbar: eine Schrift bekam ihre Buchstaben
   *[other] Der Text des PDF ist jetzt lesbar: { $count } Schriften bekamen ihre Buchstaben
}

## The shape of the pages, and scripts whose letters look alike (ADR 0045).

ocr-shape = Die Gestalt der Seiten bewahren
ocr-shape-hint = Überschriften, Zeilen als Zeilen bewahrt, Nummern am Rand, und die Kopfzeilen weggelassen. Ausgeschaltet werden die Seiten zu einfachen Absätzen.
# How a PDF read with its shape kept becomes a map: the document's own tree, or an element for each page.
ocr-structure = Elemente
ocr-structure-headings = Nach seinen Überschriften
ocr-structure-pages = Nach seinen Seiten
ocr-page-marks = Kennzeichnen, wo jede Seite beginnt
ocr-page-marks-hint = Eine Stellenmarke mit der Nummer der Seite, wo sie begann.
# The outline shown before a PDF read by its headings is made into a map.
ocr-outline-title = Was angelegt wird
ocr-outline-all = Alle { $count } zeigen

# The styles of text that recur beside the body, shown after the reading, for the writer to say what each is.
ocr-styles-title = Gefundene Textstile
ocr-styles-about = { $count ->
    [one] Ein Textstil kehrt neben dem Fließtext wieder. Sagen Sie, was er ist, oder lassen Sie ihn als Text.
   *[other] { $count } Textstile kehren neben dem Fließtext wieder. Sagen Sie, was jeder ist, oder lassen Sie sie als Text.
}
# How often a style found occurs: "12 times on 9 pages".
ocr-styles-often = { $count ->
    [one] Einmal
   *[other] { $count }-mal
} auf { $pages ->
    [one] einer Seite
   *[other] { $pages } Seiten
}
ocr-styles-kind = Was es ist
ocr-styles-own = Eine eigene Art…
ocr-styles-own-name = Name der Art
ocr-styles-own-hint = Angelegt, wenn das Dokument eingelesen wird, ohne eigenes Aussehen, bis Sie ihr eines geben.
# The first guess of the name of a kind of your own: the look of the style in words, put together as "{ $look } text", "Smaller italic text", "Indented text", or for lines kept as lines, "{ $look } lines kept", "Lines kept". $kept is yes for lines kept, where a language bends the words of the look by it.
ocr-style-guess = { $kept ->
    [yes] { $look } bewahrte Zeilen
   *[other] { $look } Text
}
ocr-style-indented = { $kept ->
    [yes] eingezogene
   *[other] eingezogener
}
ocr-style-smaller = { $kept ->
    [yes] kleinere
   *[other] kleinerer
}
ocr-style-larger = { $kept ->
    [yes] größere
   *[other] größerer
}
ocr-style-bold = { $kept ->
    [yes] fette
   *[other] fetter
}
ocr-style-italic = { $kept ->
    [yes] kursive
   *[other] kursiver
}
# A style that differs from the body only by its font.
ocr-style-family = Text in { $family }
ocr-style-other = Anderer Text
# A script among the languages chosen, as it stands in the warning below: "the Greek script is read together with the Latin".
ocr-script = { $script ->
    [Greek] griechische
    [Cyrillic] kyrillische
   *[Latin] lateinische
}
# $alike: the letters that look alike, in pairs, the first script's first: "ϲ c, ο o, ν v".
ocr-languages-scripts-alike = Die { $a } und die { $b } Schrift werden zusammen gelesen: Buchstaben, die in beiden gleich aussehen ({ $alike }), werden oft als die der anderen gelesen, und ganze Wörter kommen falsch heraus. Für eine Schrift allein nehmen Sie die anderen weg.
