# What the core says of references brought in from elsewhere, in English.
# See locales/README.md.

## Where the references came from, as the list of them says: "3 references in pasted text".

core-import-pasted = eingefügtem Text
core-import-files = { $count } Dateien

## Files of BibTeX and BibLaTeX.

core-import-file-not-found = Die Datei „{ $name }“ wurde nicht gefunden.
core-import-empty-entry = Zeile { $line }: der Eintrag „{ $key }“ ist leer und wurde weggelassen.
# Where in a file a reference that has no key was found.
core-import-origin-line = Zeile { $line }
core-import-origin-key-line = { $key }, Zeile { $line }

## What went wrong as the references were taken in, each after the reference
## it concerns: Nagy 1979 “The Best of the Achaeans”.

core-import-title = „{ $title }“
core-import-merge-gone = { $reference }: der Eintrag, mit dem zusammengeführt werden sollte, ist nicht mehr da

## PDF files.

core-import-not-a-pdf = { $name } ist kein PDF.
# The service is a name: Crossref, DataCite.
core-import-details-from = Die Angaben stammen von { $service }.
core-import-number-unknown = In der Datei wurde eine Nummer gefunden, aber die Datenbanken wissen nichts von ihr; die Angaben stammen aus der Datei selbst und sollten geprüft werden.
core-import-databases-failed = Die Datenbanken konnten nicht gefragt werden ({ $error }); die Angaben stammen aus der Datei selbst und sollten geprüft werden.

## Zotero.

core-import-zotero-my-library = Meine Bibliothek
core-import-zotero-group = Gruppe { $id }
core-import-zotero-the-library = die Bibliothek { $id } in Zotero
core-import-zotero-own-library = die eigene Bibliothek in Zotero
core-import-zotero-the-collection = die Sammlung { $key } in Zotero
core-import-zotero-unknown-base = Die Datei „{ $name }“ wurde nicht gefunden. Zotero verweist auf sie aus einem Ordner eigener Wahl, der hier nicht bekannt ist.
core-import-zotero-empty-item = Der Eintrag { $key } in Zotero ist leer und wurde weggelassen.
core-import-zotero-alone = { $count ->
    [one] { $count } Datei oder Notiz steht in Zotero unter keiner Quelle und wurde weggelassen.
   *[other] { $count } Dateien und Notizen stehen in Zotero unter keiner Quelle und wurden weggelassen.
}
# The role is Zotero's own name for it: "recipient", "reviewed author".
core-import-zotero-not-a-field = Zotero nennt { $name } als { $role }, wofür BibLaTeX kein Feld hat. Der Name wurde weggelassen.
core-import-zotero-left-out = Zoteros Feld „{ $field }“ hat in BibLaTeX keine Entsprechung und wurde weggelassen: { $value }

## Zotero's database.

core-import-zotero-no-database = eine Zotero-Datenbank ({ $file }) in { $path }
core-import-zotero-copying = Kopieren von { $path } in einen temporären Ordner
core-import-zotero-empty = die Datei ist leer
core-import-zotero-disturbed = Zotero schrieb in seine Datenbank, während sie gelesen wurde. Wenn etwas fehlt, schließen Sie Zotero und importieren Sie noch einmal.
core-import-zotero-backup-read = Zoteros Datenbank konnte nicht gelesen werden ({ $error }). Stattdessen wurde ihre Sicherung gelesen, { $backup }: was in Zotero seit der Sicherung geändert wurde, fehlt.
core-import-zotero-not-a-database = { $path } ist keine Datenbank von Zotero.
core-import-zotero-unreadable = Die Zotero-Datenbank hat eine Form, die hier nicht gelesen werden kann: { $what }. Wenn eine alte Version von Zotero sie geschrieben hat, bringt ein einmaliges Öffnen in einer aktuellen sie auf den neuesten Stand.
core-import-zotero-unreadable-version = Die Zotero-Datenbank hat eine Form, die hier nicht gelesen werden kann (Version { $version } von Zoteros Datenbank): { $what }. Wenn eine alte Version von Zotero sie geschrieben hat, bringt ein einmaliges Öffnen in einer aktuellen sie auf den neuesten Stand.
core-import-zotero-no-table = die Tabelle „{ $table }“ fehlt
core-import-zotero-no-column = die Tabelle „{ $table }“ hat keine Spalte „{ $column }“
# What is lacking where a table is not there: one of the six below.
core-import-zotero-no-optional = Die Zotero-Datenbank hat keine Tabelle „{ $table }“ der hier bekannten Form: { $consequence }.
core-import-zotero-no-bin = Einträge im Papierkorb von Zotero sind von den anderen nicht zu unterscheiden
core-import-zotero-no-collections = Sammlungen wurden nicht gelesen
core-import-zotero-no-attachments = angehängte Dateien wurden nicht gelesen
core-import-zotero-no-notes = Notizen wurden nicht gelesen
core-import-zotero-no-keywords = Schlagwörter wurden nicht gelesen
core-import-zotero-no-group-names = die Namen der Gruppenbibliotheken sind nicht bekannt

## PDF files, as they are read for a reference.

core-import-pdf-empty = Die Datei „{ $name }“ ist leer.
core-import-pdf-not-a-pdf = Die Datei „{ $name }“ ist kein PDF.
core-import-pdf-unreadable = Die Datei konnte nicht gelesen werden: sie ist beschädigt, durch ein Passwort geschützt oder zu groß.
core-import-pdf-scan = Die Datei hat keine Textebene: sie ist ein Scan.
core-import-pdf-from-file = Die Angaben stammen aus der Datei selbst, nicht aus einem Katalog, und sollten geprüft werden.
core-import-pdf-from-metadata = In der Datei wurde weder eine DOI noch eine ISBN gefunden; die Angaben stammen aus den Metadaten der Datei und sollten geprüft werden.
core-import-pdf-unknown = In der Datei wurde weder eine DOI noch eine ISBN gefunden, und ihre Metadaten sagen nicht, was sie ist: die Angaben müssen von Hand eingetragen werden.

## Tables, from files of text and of sheets.

core-import-table-too-large = Die Datei hat { $size } MB. Eine Tabelle wird aus einer Datei von höchstens { $most } MB gelesen.
core-import-table-kinds = Tabellen werden aus CSV und anderem Text gelesen, dessen Werte durch Kommas, Semikolons oder Tabulatoren getrennt sind, und aus den Tabellenblättern von LibreOffice (.ods) und Excel (.xlsx, .xls).
core-import-table-empty = In der Datei ist nichts.
# The rows are a number, or where the counting was given up, the message below.
core-import-table-rows = Die Tabelle hat { $rows } Zeilen. Eine Tabelle im Text kann höchstens { $most } haben: sie ist keine Tabellenkalkulation.
core-import-table-columns = Die Tabelle hat { $columns } Spalten. Eine Tabelle im Text kann höchstens { $most } haben: sie ist keine Tabellenkalkulation.
core-import-table-more-than = mehr als { $count }

## Documents brought in, to become maps.

core-import-document-stopped = Das Einlesen wurde abgebrochen.
core-import-pdfs-stopped = Das Feststellen, was die Dateien sind, wurde abgebrochen. Nichts wurde hinzugefügt.
core-import-document-kind = „{ $file }“ ist von keiner Art, die als Dokument eingelesen werden kann. Eingelesen werden Word (DOCX), OpenDocument (ODT), Markdown, HTML, LaTeX, RTF, EPUB, Org, reStructuredText, Typst und reiner Text.
core-import-document-too-large = „{ $file }“ ist größer als 50 MB; mehr kann nicht als Dokument eingelesen werden.
# The kind is the kind of file: Word (DOCX), plain text.
core-import-document-unreadable = „{ $file }“ konnte nicht als { $kind } gelesen werden. Die Datei ist vielleicht beschädigt oder von anderer Art, als ihr Name sagt. Pandoc, das sie liest, sagte: { $message }
core-import-document-pandoc-unreadable = was Pandoc aus „{ $file }“ gemacht hat, konnte nicht gelesen werden: { $error }
# The title of a map made of a document that has none, nor a name of its file.
core-import-document-untitled = Ohne Titel
core-import-document-plain-text = reiner Text
core-import-document-notebook = Jupyter-Notebook

## What the one who brings a document in should know of it.

core-import-document-found = { $count ->
    [one] { $made ->
        [all] { $count } Zitation wurde gefunden, die noch mit keiner Quelle Ihrer Bibliothek verbunden ist, erzeugt von einem Literaturverwaltungsprogramm. Sie steht im Text so, wie sie geschrieben wurde, und kann durchgegangen werden, sobald die Karte gemacht ist, und auch später.
       *[none] { $count } Zitation wurde gefunden, die noch mit keiner Quelle Ihrer Bibliothek verbunden ist. Sie steht im Text so, wie sie geschrieben wurde, und kann durchgegangen werden, sobald die Karte gemacht ist, und auch später.
    }
   *[other] { $made ->
        [all] { $count } Zitationen wurden gefunden, die noch mit keinen Quellen Ihrer Bibliothek verbunden sind, alle erzeugt von einem Literaturverwaltungsprogramm. Sie stehen im Text so, wie sie geschrieben wurden, und können durchgegangen werden, sobald die Karte gemacht ist, und auch später.
        [some] { $count } Zitationen wurden gefunden, die noch mit keinen Quellen Ihrer Bibliothek verbunden sind, { $some } davon erzeugt von einem Literaturverwaltungsprogramm. Sie stehen im Text so, wie sie geschrieben wurden, und können durchgegangen werden, sobald die Karte gemacht ist, und auch später.
       *[none] { $count } Zitationen wurden gefunden, die noch mit keinen Quellen Ihrer Bibliothek verbunden sind. Sie stehen im Text so, wie sie geschrieben wurden, und können durchgegangen werden, sobald die Karte gemacht ist, und auch später.
    }
}
core-import-document-endnote = { $count ->
    [one] { $count } von EndNote erzeugte Zitation wird als der Text eingelesen, den sie zeigt, und ist nicht unter den gefundenen: was EndNote über die Werke sagt, konnte nicht gelesen werden.
   *[other] { $count } von EndNote erzeugte Zitationen werden als der Text eingelesen, den sie zeigen, und sind nicht unter den gefundenen: was EndNote über die Werke sagt, konnte nicht gelesen werden.
}
core-import-document-bookmarks = { $count ->
    [one] Das Dokument hält { $count } Zitation in einer Textmarke, und was sie zitiert, konnte nicht gelesen werden: sie ist Text, wie sie dasteht. Zotero legt sie so an, wo seine Dokumenteinstellungen es sagen.
   *[other] Das Dokument hält { $count } Zitationen in Textmarken, und was sie zitieren, konnte nicht gelesen werden: sie sind Text, wie sie dastehen. Zotero legt sie so an, wo seine Dokumenteinstellungen es sagen.
}
core-import-document-bibliography = Das Dokument hat eine Liste dessen, was es zitiert, unter „{ $heading }“. Sie wird als Text eingelesen wie alles andere. Die Karte macht aus dem, was in ihr zitiert wird, ein eigenes Literaturverzeichnis.
core-import-document-bibliography-made = Das Dokument hat eine Liste dessen, was es zitiert, erzeugt von seinem Literaturverwaltungsprogramm. Sie wird als Text eingelesen wie alles andere. Die Karte macht aus dem, was in ihr zitiert wird, ein eigenes Literaturverzeichnis.
core-import-document-tracked = Das Dokument hat nachverfolgte Änderungen. Der Text wird so eingelesen, wie er steht, wenn alle angenommen sind.
core-import-document-comments = Das Dokument hat Kommentare am Rand; sie werden weggelassen.
core-import-document-heading-notes = { $count ->
    [one] Eine Anmerkung zu einer Überschrift steht am Anfang des Textes darunter: eine Überschrift kann keine Anmerkung haben.
   *[other] { $count } Anmerkungen zu Überschriften stehen am Anfang des Textes darunter: eine Überschrift kann keine Anmerkung haben.
}
# What a caption began with is shown as the document has it: “Figure 1:”.
core-import-document-labels = { $count ->
    [one] { $count } Beschriftung begann mit einem Wort und einer Zahl, etwa „{ $first }“. Das wird weggelassen: die Karte nummeriert ihre Abbildungen und Tabellen selbst. Wo der Text eine von ihnen mit ihrer Nummer nennt, ist das Text, wie er geschrieben wurde, und folgt nicht den Nummern der Karte.
   *[other] { $count } Beschriftungen begannen mit einem Wort und einer Zahl, etwa „{ $first }“. Das wird weggelassen: die Karte nummeriert ihre Abbildungen und Tabellen selbst. Wo der Text eine von ihnen mit ihrer Nummer nennt, ist das Text, wie er geschrieben wurde, und folgt nicht den Nummern der Karte.
}
core-import-document-label-example = Abbildung 1:
core-import-document-caption-notes = { $count ->
    [one] Eine Anmerkung in dem, was zu einer Abbildung oder Tabelle gesagt wird, steht dort in Klammern.
   *[other] { $count } Anmerkungen in dem, was zu Abbildungen oder Tabellen gesagt wird, stehen dort in Klammern.
}
core-import-document-headings = { $count ->
    [one] { $count } Überschrift in einem Zitat, einer Liste oder einer Tabelle wird als fetter Absatz eingelesen.
   *[other] { $count } Überschriften in einem Zitat, einer Liste oder einer Tabelle werden als fette Absätze eingelesen.
}
core-import-document-code = { $count ->
    [one] { $count } Block Code wird als einfache Absätze eingelesen, eine Zeile je Absatz.
   *[other] { $count } Blöcke Code werden als einfache Absätze eingelesen, eine Zeile je Absatz.
}
core-import-document-definitions = { $count ->
    [one] { $count } Liste von Begriffen mit ihrer Bedeutung wird als Absätze eingelesen, die Begriffe fett.
   *[other] { $count } Listen von Begriffen mit ihrer Bedeutung werden als Absätze eingelesen, die Begriffe fett.
}
core-import-document-rules = { $count ->
    [one] { $count } Linie quer über die Seite wird weggelassen.
   *[other] { $count } Linien quer über die Seite werden weggelassen.
}
core-import-document-raw = { $count ->
    [one] { $count } Stück, das in HTML oder TeX nur für die eine Art von Dokument geschrieben ist, wird weggelassen.
   *[other] { $count } Stücke, die in HTML oder TeX nur für die eine Art von Dokument geschrieben sind, werden weggelassen.
}
core-import-document-pictures-wanting = { $count ->
    [one] { $count } Bild, das die Datei enthält, ist nicht in dem gelesenen Text und wird weggelassen. Es steht vielleicht im Kopf oder Fuß der Seiten oder in einer Zeichnung.
   *[other] { $count } Bilder, die die Datei enthält, sind nicht in dem gelesenen Text und werden weggelassen. Sie stehen vielleicht im Kopf oder Fuß der Seiten oder in einer Zeichnung.
}

## A picture of a document that is left out, and why.

core-import-document-picture-left-out = Das Bild „{ $name }“ wird weggelassen: { $why }.
core-import-document-picture-kind = es ist von einer Art, die nicht gelesen wird ({ $kind })
core-import-document-picture-not-read = es ist kein Bild von einer Art, die gelesen wird
core-import-document-picture-unreadable = es konnte nicht gelesen werden
core-import-document-picture-network = es liegt im Netz, und von dort wird nichts geholt
core-import-document-picture-not-taken-out = es konnte nicht aus der Datei herausgelöst werden
core-import-document-picture-outside = es ist nicht in der Datei, sondern anderswo auf diesem Computer, und wird von dort nicht genommen
core-import-document-picture-not-found = die Datei wurde nicht gefunden, wo das Dokument sie angibt
core-import-document-picture-too-large = es ist größer als 50 MB
core-import-document-picture-file-unreadable = die Datei konnte nicht gelesen werden
