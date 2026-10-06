# The store of pictures: all the pictures of the application, and one of them.

pictures-title = Bilder
pictures-all = Alle Bilder
pictures-picture = Bild
pictures-search-placeholder = Bilder durchsuchen
pictures-clear-search = Suche löschen
pictures-count = { $count ->
    [one] { $count } Bild
   *[other] { $count } Bilder
}
# How many pictures a search finds, of all there are.
pictures-shown = { $shown } von { $count ->
    [one] { $count } Bild
   *[other] { $count } Bildern
}
pictures-add = Bilder hinzufügen…
pictures-empty = Der Fundus ist leer
pictures-empty-text = Bilder, die Sie hier hinzufügen, können in allen Ihren Projekten verwendet werden, und ein Bild, das in einen Text gesetzt wird, wird hier aufbewahrt. Fügen Sie welche hinzu, oder lassen Sie sie auf dieses Fenster fallen.
pictures-nothing-found = Nichts gefunden
pictures-nothing-found-text = Kein Bild enthält alle diese Wörter.
# What a picture that has no name is called.
pictures-unnamed = Ein Bild
pictures-with-notes = Mit Notizen

## Taking pictures in, and removing them

# The title of the dialog that chooses files, and what it calls the files it offers.
pictures-add-title = Bilder hinzufügen
pictures-files = Bilder
pictures-taken-in = { $count ->
    [one] „{ $name }“ ist im Fundus
   *[other] { $count } Bilder sind im Fundus
}
pictures-remove-title = „{ $name }“ aus dem Fundus entfernen?
pictures-remove-unused = Kein Projekt verwendet das Bild. Was hier zu ihm gesagt ist, und Ihre Notizen dazu, werden mit ihm entfernt.
pictures-remove-used = { $count ->
    [one] { $count } Projekt verwendet das Bild. Seine Abbildungen bleiben ohne das Bild zurück. Was hier zu ihm gesagt ist, und Ihre Notizen dazu, werden mit ihm entfernt.
   *[other] { $count } Projekte verwenden das Bild. Ihre Abbildungen bleiben ohne das Bild zurück. Was hier zu ihm gesagt ist, und Ihre Notizen dazu, werden mit ihm entfernt.
}
pictures-no-backend = Es gibt kein Backend.

## One picture

pictures-name = Name
pictures-name-placeholder = Wie das Bild heißt
pictures-caption = Beschriftung
pictures-caption-placeholder = Was zum Bild gesagt wird
pictures-caption-hint = Abbildungen mit dem Bild beginnen mit diesen Worten. Was zu einer Abbildung gesagt wird, kann dort geändert werden, ohne dies zu ändern.
pictures-italic = Kursiv
pictures-small-caps = Kapitälchen
# What the picture shows, in words, for those who do not see it.
pictures-alt = Zeigt
pictures-alt-placeholder = In Worten, für die, die es nicht sehen können
pictures-absent = Das Bild ist nicht auf diesem Computer. Es wird im Projekt verwendet und gezeigt, sobald es von dem gekommen ist, der es hineingesetzt hat.
pictures-notes = Notizen
pictures-note-project = In diesem Projekt
pictures-note-project-placeholder = Was Sie davon halten, für diese Arbeit
pictures-note-project-hint = Was hier geschrieben wird, ist bei allen, die das Projekt haben.
pictures-note-for-all = Für alle Projekte behalten
pictures-note-write-for-all = Für alle Projekte schreiben
pictures-note-all = In allen Projekten
pictures-note-all-placeholder = Was Sie davon halten, wo immer Sie es verwenden
pictures-note-all-hint = Beim Bild im Fundus aufbewahrt, auf diesem Computer.
pictures-note-placeholder = Was Sie davon halten. Für Sie selbst: es ist Teil keines Dokuments.
pictures-note-label = Ihre Notizen zu diesem Bild
pictures-file = Die Datei
pictures-kind = Art
pictures-kind-svg = SVG, eine Zeichnung
pictures-dimensions-label = Breit und hoch
pictures-dimensions = { $width } × { $height } Punkte
pictures-size = Größe
# When the picture was taken into the store.
pictures-added = Hinzugefügt
pictures-used-in = Verwendet in
pictures-this-project = Dieses Projekt
# A map that has no name.
pictures-untitled = Ohne Titel
pictures-unused = Kein Projekt verwendet das Bild.
pictures-remove = Aus dem Fundus entfernen
