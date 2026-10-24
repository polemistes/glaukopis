# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDFs und Bilder
ocr-no-tesseract = Tesseract, das Text in Bildern liest, ist nicht installiert oder wurde nicht gefunden. Installieren Sie es mit der Paketverwaltung Ihres Systems, mit den Daten der Sprachen, die Sie lesen (unter Arch: tesseract und tesseract-data-deu, tesseract-data-eng und so weiter), oder geben Sie in den Einstellungen an, wo es ist.
ocr-failed = Der Text konnte nicht gelesen werden.
ocr-looking = { $file } wird angesehen…
ocr-about-picture = Der Text wird aus dem Bild gelesen.
# Where the pages of a PDF are pictures of too few dots to the inch to be read well.
ocr-low-resolution = Die Seiten sind Bilder mit { $dpi } Punkten je Zoll: zu wenige, als dass ihre Buchstaben gut gelesen werden könnten, was auch gewählt wird.
ocr-low-resolution-text = Sie neu zu lesen, macht den Text, den das PDF hat, nicht besser.

ocr-trying = Seite { $page } wird gelesen…
ocr-tried-nothing = Auf Seite { $label } wurde kein Text gelesen.
ocr-tried-blocks = { $count ->
    [one] Den Textblock zeigen
   *[other] Die { $count } Textblöcke zeigen
}
ocr-tried-blocks-hint = Die Textblöcke, die Tesseract gefunden hat, nummeriert in der Folge, in der es sie liest. Zwei Spalten, die als eine genommen werden, oder Anmerkungen, die in den Text geraten, werden in falscher Folge gelesen: ein anderer Aufbau der Seite trennt sie vielleicht.

ocr-read = Text lesen
ocr-read-pages = { $count ->
    [one] Eine Seite lesen
   *[other] { $count } Seiten lesen
}
ocr-read-text-pages = Die Seiten mit Text nehmen
ocr-take-text = Text nehmen
ocr-reading = { $file } wird gelesen…
ocr-reading-pages = { $done } von { $total } Seiten gelesen
ocr-reading-hint = Eine Seite braucht ein paar Sekunden. Abbrechen hält das Lesen an.

## How the text is read: what to try when a reading goes badly

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
ocr-searchable-poorly = { $count ->
    [one] Eine Seite wurde schlecht gelesen: { $pages }.
   *[other] { $count } Seiten wurden schlecht gelesen: { $pages }.
} Probieren Sie eine Seite mit einer anderen Sprache aus oder mit dem Fraktur-Modell für gebrochene Schrift.

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
ocr-picture-copy-failed = Der Text konnte nicht kopiert werden
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

## What is found of the text a PDF has, and what can be done with it (ADR 0044).

ocr-text-scheme-greek-names = Das Griechische ist als Glyphennamen von { $fonts } gespeichert und kann zu griechischen Buchstaben gemacht werden.
ocr-text-scheme-expert-names = Kapitälchen und Mediävalziffern von { $fonts } sind nach Namen gespeichert und können zu ihren Buchstaben und Ziffern gemacht werden.
ocr-text-scheme-beta-code = Griechisch ist in Beta Code geschrieben und kann zu griechischen Buchstaben gemacht werden.
ocr-text-page = Seite { $label }
ocr-text-page-none = Kein Text auf dieser Seite: sie wird aus einem Bild von ihr gelesen.
ocr-text-rest-failed = Die Seiten nach diesen konnten nicht gelesen werden.
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
ocr-page-marks = Kennzeichnen, wo jede Seite beginnt
ocr-page-marks-hint = Eine Stellenmarke mit der Nummer der Seite, wo sie begann.
# What is made of a PDF that was read, asked after the reading: the same reading made anew.
ocr-made-title = Was daraus gemacht wird
ocr-made-headings = { $count ->
    [0] Keine Überschriften gefunden
    [one] Nach seiner einen Überschrift
   *[other] Nach seinen { $count } Überschriften
}
ocr-made-pages = { $count ->
    [one] Nach seiner einen Seite
   *[other] Nach seinen { $count } Seiten
}
ocr-made-failed = Die Elemente konnten nicht neu angelegt werden
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


## The strip of the pages of a PDF, drawn small, to choose a page from.

ocr-strip = Die Seiten
ocr-strip-page = Seite { $number }
# A page that could not be drawn, where nothing more is said of why.
ocr-strip-page-failed = Nicht gezeichnet
# $from and $to: the first and the last of the pages, counted from one, that were to be drawn together.
ocr-strip-failed = Die Seiten { $from }–{ $to } konnten nicht gezeichnet werden.

# The panes of the workbench: the picture of the page in view, the text the
# PDF has for it, what Tesseract read of it with the page's trials, and the
# column of the reading settings beside them. The panes' titles and their
# lines on a page without text are ocr-text-page, ocr-text-title and
# ocr-text-page-none above; the blocks drawn on the picture, ocr-tried-blocks.

ocr-settings-heading = Wie Tesseract liest
# The button under the reading settings: the page in view is read with them.
ocr-settings-try = Seite { $page } ausprobieren
# A trial's settings said in a line, where no language was chosen: Tesseract then reads English.
ocr-settings-said-no-language = Englisch, da keine gewählt ist
# A trial's settings said in a line, where the page was made black and white before it was read.
ocr-settings-said-contrast = S/W
# How large the picture of the page is shown: the whole page in the pane, or its own size, or twice that.
ocr-picture-size = Größe des Bildes
ocr-picture-fit = Einpassen
ocr-picture-actual = 100 %
ocr-picture-double = 200 %
# The alternative text of the picture of the page in view.
ocr-picture-alt = Seite { $label }
ocr-pane-translated = Übertragen nach dem, was die Schriften sagen
ocr-pane-sound = Liest sich als Text
ocr-pane-poor = Liest sich nicht als Text: Buchstaben einer Schrift, die nicht sagt, welche sie sind, oder eine schlechte Lesung
ocr-pane-tesseract = Was Tesseract gelesen hat
ocr-pane-try-hint = Klicken Sie auf „Seite { $page } ausprobieren“, um diese Seite mit den Einstellungen daneben zu lesen.
# How sure Tesseract was of a page tried, in one line: "Page 40: Low confidence (73%) · 89 of 251 words unsure". Low is under 80, good up to 89, high from 90.
ocr-tried-page = Seite { $label }:
ocr-confidence-low = Geringe Sicherheit ({ $confidence } %)
ocr-confidence-good = Gute Sicherheit ({ $confidence } %)
ocr-confidence-high = Hohe Sicherheit ({ $confidence } %)
ocr-tried-unsure = { $unsure ->
    [0] kein Wort unsicher
   *[other] { $unsure } von { $words } Wörtern unsicher
}
ocr-tried-low-hint = Unter 80 %: probieren Sie eine andere Sprache aus, das Fraktur-Modell für gebrochene Schrift oder einen anderen Aufbau der Seite.
# The tooltip of a word Tesseract was unsure of.
ocr-pane-unsure-word = Gelesen mit einer Sicherheit von { $confidence } %
# Said after the line over the settings, where the pages selected are read in different ways: a change holds for all of them.
ocr-settings-scope-differ = (unterschiedlich gelesen)
# Over the list of the page's trials, each said by the settings it was read with.
ocr-trials = Versucht mit
ocr-trial-confidence = { $confidence } %
ocr-trial-nothing = Nichts gelesen
ocr-trial-use = Diese Einstellungen verwenden

# The pages of the workbench

# The line over the strip of pages says what each page gets: the text the PDF has, or what Tesseract reads.
ocr-pages-said-pdf = { $pages ->
    [one] Die Seite übernimmt den Text, den das PDF hat.
   *[other] Alle { $pages } Seiten übernehmen den Text, den das PDF hat.
}
ocr-pages-said-read = { $pages ->
    [one] Die Seite wird mit Tesseract gelesen.
   *[other] Alle { $pages } Seiten werden mit Tesseract gelesen.
}
ocr-pages-said-both = { $pdf ->
    [one] Eine Seite übernimmt den Text, den das PDF hat;
   *[other] { $pdf } Seiten übernehmen den Text, den das PDF hat;
} { $read ->
    [one] eine wird mit Tesseract gelesen.
   *[other] { $read } werden mit Tesseract gelesen.
}
# Where Tesseract is not installed, and pages are to be read.
ocr-pages-said-unreadable = { $pages ->
    [one] Die Seite kann nicht gelesen werden: Tesseract ist nicht installiert.
   *[other] Keine der { $pages } Seiten kann gelesen werden: Tesseract ist nicht installiert.
}
ocr-pages-said-both-unreadable = { $pdf ->
    [one] Eine Seite übernimmt den Text, den das PDF hat;
   *[other] { $pdf } Seiten übernehmen den Text, den das PDF hat;
} { $read ->
    [one] eine kann ohne Tesseract nicht gelesen werden.
   *[other] { $read } können ohne Tesseract nicht gelesen werden.
}
ocr-pages-said-picture = Der Text wird aus dem Bild gelesen.
ocr-pages-said-picture-unreadable = Der Text des Bildes kann ohne Tesseract nicht gelesen werden.
# What the actions beside it hold for: every page, or those selected ($pages: "pages 39–120", as ocr-pages-selection says them).
ocr-pages-scope-all = { $pages ->
    [one] Für die Seite
   *[other] Für alle { $pages } Seiten
}
ocr-pages-scope = Für { $pages }
# Pages selected, as they stand in a sentence: "page 280", "pages 3–5, 9".
ocr-pages-selection = { $count ->
    [one] Seite { $pages }
   *[other] Seiten { $pages }
}
ocr-pages-all = Alle Seiten
ocr-pages-pdf = Der Text des PDF
ocr-pages-pdf-hint = Diese Seiten übernehmen den Text, den das PDF hat. Seiten ohne Text werden trotzdem gelesen.
ocr-pages-read = Mit Tesseract lesen
ocr-pages-read-hint = Diese Seiten werden neu aus Bildern von ihnen gelesen, welchen Text sie auch haben.
ocr-pages-decide = Nach der Qualität des Textes entscheiden
ocr-pages-decide-hint = Seite für Seite: Text, der sich als Text liest, wird übernommen; Text, der es nicht tut, und Seiten ohne Text werden gelesen.

# The mark in the corner of a page in the strip, saying what it gets.
ocr-strip-source-pdf = PDF
ocr-strip-source-read = Lesen
ocr-strip-source-pdf-hint = Übernimmt den Text, den das PDF hat.
ocr-strip-source-read-hint = Wird mit Tesseract gelesen.
ocr-strip-poor = Der Text, den sie hat, liest sich nicht als Text.
# The band over a stretch of pages read alike: its languages, the resolution where it is not 300, the layout where it is told, and black and white.
ocr-strip-band-none = Englisch, wo keine gewählt ist
ocr-strip-band-dpi = { $dpi } Punkte je Zoll
# Black and white, in short.
ocr-strip-band-contrast = S/W
ocr-strip-band-hint = { $count ->
    [one] Seite { $from }: { $said }
   *[other] Seiten { $from }–{ $to }: { $said }
}

# The summary of a reading, as the dialog opens: what the file is, said in parts joined by commas.
ocr-summary-pages = { $pages ->
    [one] Eine Seite
   *[other] { $pages } Seiten
}
ocr-summary-scanned = gescannt mit { $dpi } Punkten je Zoll
ocr-summary-no-text = { $pages ->
    [one] ohne eigenen Text
   *[other] ohne eigenen Text
}
ocr-summary-text-all = { $pages ->
    [one] mit eigenem Text
   *[other] alle mit eigenem Text
}
ocr-summary-text-some = { $with ->
    [one] eine davon mit eigenem Text
   *[other] { $with } davon mit eigenem Text
}
ocr-summary-poor = { $poor ->
    [one] von denen eine sich nicht als Text liest
   *[other] von denen { $poor } sich nicht als Text lesen
}
ocr-summary-poor-all = der sich nicht als Text liest
# Over the choice of what every page takes.
ocr-summary-whole = Woher der Text der Seiten kommt
ocr-summary-mixed = Seite für Seite gewählt. Eine Wahl hier gilt wieder für jede Seite.
# Under the reading settings, where no page is to be read with Tesseract.
ocr-summary-idle = Sie gelten für die Seiten, die mit Tesseract gelesen werden; jetzt sind es keine.
ocr-summary-pages-open = Die Seiten ansehen und ausprobieren…
ocr-summary-picture-open = Ausprobieren…
ocr-summary-back = Zurück zur Übersicht
