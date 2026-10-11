# The preview, and the making of documents: the panel beside the map, the
# details of a document, and the export.

## The panel beside the map, and what is chosen over it.

preview = Vorschau
# The last among the reference styles, which opens the search for more.
preview-style-more = Mehr Stile…
# Shows in the text the element whose place in the pages is looked at.
preview-go-to-text = Zu dieser Stelle im Text gehen
# Moves the pages to where the element the text is at begins.
preview-show-text = Zeigen, wo der Text ist
preview-hide = Vorschau verbergen
# The name of the program is Pandoc, Typst or LaTeX.
preview-program-missing = { $program } ist nicht installiert
preview-programs-needed = Vorschau und Export werden mit Pandoc und Typst erzeugt. Installieren Sie sie mit der Paketverwaltung Ihres Systems, oder geben Sie in den Einstellungen an, wo sie sind.
preview-look-again = Noch einmal nachsehen
preview-looking-failed = Nach den Programmen konnte nicht gesucht werden
preview-reading-failed = Die Stile und Formate konnten nicht gelesen werden
preview-failed = Die Vorschau konnte nicht erzeugt werden
preview-failed-message = Die Vorschau konnte nicht erzeugt werden.
# A page of the preview, as it is told to those who cannot see it.
preview-page = Seite { $number }
# The name of an exported file, where the map has none.
preview-file-name = dokument

## At the foot of the preview: how long the document is, and what there is to remark.

preview-pages = { $count ->
    [one] { $count } Seite
   *[other] { $count } Seiten
}
preview-words = { $count ->
    [one] { $count } Wort
   *[other] { $count } Wörter
}
# The words of the text, and the most the format allows.
preview-words-of = { $limit ->
    [one] { $count } von { $limit } Wort
   *[other] { $count } von { $limit } Wörtern
}
# The words of the text and of its notes together.
preview-words-with-notes = { $count } mit Anmerkungen
preview-remarks-count = { $count ->
    [one] { $count } Hinweis
   *[other] { $count } Hinweise
}
preview-remarks = Hinweise
preview-remarks-font = Schrift
preview-font-missing = { $font } ist nicht installiert.
# The first name is that of the font the format asks for; this is of the one used in its place.
preview-font-substitute = An ihrer Stelle wird { $font } verwendet, hier in der Vorschau und in einem erzeugten PDF. In einem Dokument, das für Word, LibreOffice oder LaTeX exportiert wird, ist die Schrift genannt, wie das Format sie verlangt, und ist da für den, der das Dokument öffnet und sie hat.
preview-remarks-references = Quellen
# In bold, and the next follows it in the same sentence.
preview-works-missing = { $count ->
    [one] { $count } zitiertes Werk wurde nicht gefunden,
   *[other] { $count } zitierte Werke wurden nicht gefunden,
}
preview-works-missing-where = weder in Ihrer Bibliothek noch im Projekt. Sie sind im Text markiert.
# Over what Pandoc and Typst said while they made the document.
preview-remarks-warnings = Gesagt, während das Dokument erzeugt wurde

## The export: the kinds of file a document is made as.

preview-export = Exportieren
preview-export-kind = Art der Datei
preview-export-pdf-about = Wie die Vorschau es zeigt
preview-export-pdflatex = PDF, von LaTeX gesetzt
preview-export-pdflatex-about = Dasselbe Dokument im Satz von LaTeX. Es dauert etwas länger.
preview-export-docx-about = Was die meisten Verlage und Zeitschriften verlangen
preview-export-odt-about = Für LibreOffice Writer und andere
preview-export-latex-about = Zum Setzen mit LuaLaTeX oder XeLaTeX
preview-export-markdown-about = Reiner Text, mit den Zitationen als Schlüsseln
preview-export-html = Webseite
preview-export-html-about = Eine Datei, im Browser zu lesen
preview-export-epub = E-Book
preview-export-epub-about = EPUB, für E-Reader und die Apps, die sie lesen; der Reader setzt den Text
preview-export-latex-missing = Dafür wird LaTeX gebraucht, und es wurde nicht gefunden. Es wird als TeX Live installiert.
preview-export-biblatex = Die Zitationen als Befehle von BibLaTeX behalten
preview-export-biblatex-hint = Die Quellen werden in eine .bib-Datei neben dem Dokument geschrieben. Der Zitierstil ist dann der von BibLaTeX, der dem gewählten am nächsten kommt.
# The title of the window where the file is named; the kind is PDF, Word, and so on.
preview-export-as = Als { $kind } exportieren
preview-export-run = Exportieren…
preview-export-working = Das Dokument wird erzeugt…
preview-export-failed = Das Dokument konnte nicht erzeugt werden.
preview-export-stop = Anhalten
preview-export-stopped = Das Erzeugen wurde angehalten. Keine Datei wurde geschrieben.
# Under the name of the file that was made: another file made with it.
preview-export-also = mit { $file }
preview-export-missing = { $count ->
    [one] Ein zitiertes Werk wurde nicht gefunden und ist im Text markiert.
   *[other] { $count } zitierte Werke wurden nicht gefunden und sind im Text markiert.
}
preview-export-show-in-folder = Im Ordner zeigen
preview-export-open-failed = Die Datei konnte nicht geöffnet werden
preview-export-folder-failed = Der Ordner konnte nicht geöffnet werden
preview-export-another = Noch eines exportieren
