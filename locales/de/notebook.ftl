# The notebook: what is collected outside all projects, as notes (record 0101).

## The place in the row, and the page

notebook-title = Notizbuch
notebook-notes = Notizen
notebook-note = Notiz
notebook-search = Notizen durchsuchen
notebook-search-clear = Suche löschen
notebook-new-note = Neue Notiz
notebook-add-files = Dateien hinzufügen…
notebook-add-files-title = Dateien zum Notizbuch hinzufügen
notebook-empty = Das Notizbuch ist leer
    .text = Sammeln Sie hier, was Ihnen begegnet, außerhalb aller Projekte: Wörter, Bilder und Dateien, jedes eine Notiz, die sich merkt, woher sie kam.
notebook-unreadable = Das Notizbuch konnte nicht gelesen werden
notebook-nothing-found = Keine Notizen gefunden
notebook-empty-note = Leere Notiz
notebook-holds-picture = Ein Bild
notebook-holds-file = Eine Datei
notebook-holds-passage = Übernommene Wörter
notebook-resize-list = Breite der Liste der Notizen
notebook-choose = Eine Notiz auswählen, oder eine neue anlegen
notebook-selected = { $count ->
    [one] { $count } Notiz ausgewählt
   *[other] { $count } Notizen ausgewählt
}
notebook-deleted = { $count ->
    [one] Die Notiz wurde gelöscht
   *[other] { $count } Notizen wurden gelöscht
}
notebook-redo = Wiederherstellen
notebook-name = Name
notebook-write = Schreiben Sie, oder fügen Sie ein, was Sie gefunden haben
# What became of a note: "Used in ‹project› · quotation".
notebook-went = Was daraus wurde
notebook-used-in = Verwendet in
notebook-went-text = Text
notebook-went-quotation = Zitat
notebook-went-figure = Bild
notebook-went-reference = Quelle
notebook-went-file = Datei
# How a box is shown: as its surface, or as a list.
notebook-shown-as = Angezeigt als
notebook-surface = Fläche
notebook-list = Liste
notebook-close-note = Die Notiz schließen
notebook-resize-column = Breite der Boxen
notebook-resize-note = Breite der Notiz
notebook-box-empty = Keine Notizen in dieser Box
# What the plugin for Firefox handed over has arrived.
notebook-arrived = Zum Notizbuch hinzugefügt
notebook-arrived-from = Zum Notizbuch hinzugefügt: { $title }
notebook-arrived-many = { $count ->
    [one] Eine Sache zum Notizbuch hinzugefügt
   *[other] { $count } Dinge zum Notizbuch hinzugefügt
}

## A note and its text

# The first box of the notebook, named so in the copy of the notebook written as Org until it is given a name.
notebook-org-first-box = Unsortiert

# A file a note holds, as it stands in the note: opened by two presses.
notebook-file-open-named = { $name } öffnen
notebook-file-not-here = Die Datei ist nicht auf diesem Computer

# Files that could not be taken in as notes, said in one message.
notebook-files-not-taken = Einige Dateien konnten nicht übernommen werden

# Words selected in a file read in Glaukopis, or a part of a page marked, sent to the notebook as a new note.
notebook-from-file-added = Zum Notizbuch hinzugefügt
notebook-from-file-not-added = Es konnte nicht zum Notizbuch hinzugefügt werden

## Sources

notebook-source-none = Keine Herkunft
# Where a photograph was taken, in degrees.
notebook-source-north = { $degrees }° N
notebook-source-south = { $degrees }° S
notebook-source-east = { $degrees }° O
notebook-source-west = { $degrees }° W

notebook-sources = Herkunft
notebook-source = Herkunft
notebook-source-sort = Was es ist
notebook-source-web = Webseite
notebook-source-reference = Quelle
notebook-source-other = Sonstiges
notebook-source-url = Adresse
notebook-source-page-title = Titel
notebook-source-choose-reference = Eine Quelle auswählen…
notebook-source-place = Stelle
notebook-source-words = Woher es stammt
notebook-source-file-name = Name
notebook-source-file-changed = Zuletzt geändert
# Of a photograph: when it was taken, and where.
notebook-source-file-taken = Aufgenommen
notebook-source-file-where = Wo
notebook-source-make-reference = Eine Quelle anlegen
notebook-source-in-library = In der Bibliothek:
notebook-source-passages = Daraus übernommen
notebook-source-changed = Seit der Übernahme geändert. Es lautete:
notebook-source-bring-back = Zurückholen
notebook-source-own-words = Meine eigenen Worte

## Boxes and tags

notebook-all-notes = Alle Notizen
notebook-boxes = Boxen
# The first box, where everything lands, until it is given a name.
notebook-box-unsorted = Unsortiert
notebook-box-new = Neue Box
notebook-box-name = Name der Box
notebook-box-receives = Notizen von außen kommen hierher
notebook-box-delete-title = „{ $name }“ löschen?
notebook-box-delete-message = { $count ->
    [one] Die Notiz darin kommt in „{ $first }“.
   *[other] Die { $count } Notizen darin kommen in „{ $first }“.
}
notebook-move-to = Verschieben nach
notebook-tags = Schlagwörter
notebook-tag-name = Name des Schlagworts
notebook-tag-remove = Von allen Notizen entfernen
notebook-tag-remove-title = „{ $tag }“ von allen Notizen entfernen?
notebook-tag-remove-message = { $count ->
    [one] Eine Notiz hat es.
   *[other] { $count } Notizen haben es.
}
notebook-tag-merge-title = „{ $from }“ in „{ $to }“ umbenennen?
notebook-tag-merge-message = „{ $from }“ und „{ $to }“ werden ein Schlagwort.
notebook-tags-off = Alle zeigen, gleich welche Schlagwörter sie haben
# The field under the name of a note, where a tag is added.
notebook-tag-add = Ein Schlagwort hinzufügen
notebook-tag-take-away = „{ $tag }“ entfernen
notebook-tags-offered = Schlagwörter
notebook-join = Zusammenführen
notebook-joined = { $count } Notizen zusammengeführt
notebook-divide = Aufteilen

## The surface

notebook-surface-of-box = Fläche der Box
notebook-surface-not-placed = Noch nicht platziert
notebook-surface-empty-note = Leere Notiz
notebook-surface-new-note-here = Neue Notiz hier
notebook-surface-show-all = Alles zeigen
notebook-surface-link-handle = Auf eine andere Notiz ziehen, um beide zu verknüpfen

## Finding, and starting texts

# The filters of the list, in a window at a button beside the field that finds.
notebook-filters = Filter
notebook-filters-on = { $count ->
    [one] Filter: { $count } aktiv
   *[other] Filter: { $count } aktiv
}
notebook-filter-holds = Enthält
notebook-filter-picture = Ein Bild
notebook-filter-file = Eine Datei
notebook-filter-passage = Übernommene Wörter
notebook-filter-link = Eine Verknüpfung mit einer anderen Notiz
notebook-filter-collected = Gesammelt
notebook-filter-from = Von
notebook-filter-to = Bis
notebook-filter-came = Herkunft
notebook-filter-web = Eine Webseite
notebook-filter-reference = Eine Quelle
notebook-filter-file-source = Eine Datei
notebook-filter-other = Sonstiges
notebook-filter-no-source = Keine Herkunft
notebook-filter-unseen = Nicht angesehen
notebook-filter-use = Verwendet
notebook-filter-use-all = Alle
notebook-filter-used = In einem Projekt verwendet
notebook-filter-unused = Nicht verwendet
notebook-filter-clear = Filter löschen
notebook-nothing-passes = Keine Notiz in der Ansicht kommt durch die Filter.
# A note taken in that has not been looked at: the dot before its name.
notebook-unseen = Nicht angesehen
# Words read in the images of notes, kept for finding.
notebook-read-text = Den Text lesen
notebook-read-again = Erneut lesen
notebook-text-read = Gelesener Text
notebook-reading = { $count ->
    [one] { $name } wird gelesen…
   *[other] { $name } wird gelesen ({ $done } von { $count })…
}
notebook-reading-stop = Anhalten
notebook-read-done = { $count ->
    [one] Der Text des Bildes wurde gelesen
   *[other] Der Text von { $count } Bildern wurde gelesen
}
notebook-read-failed = Der Text von { $name } konnte nicht gelesen werden
# Starting texts: a new note that begins with lines given.
notebook-new-note-from = Neue Notiz aus einem Starttext
notebook-starts = Starttexte…
notebook-starts-title = Starttexte
notebook-start-new = Neu
notebook-start-unnamed = Ohne Namen
notebook-start-name = Name
notebook-start-lines = Zeilen
notebook-start-kind = Seine Zeilen sind
notebook-start-up = Nach oben
notebook-start-down = Nach unten
notebook-start-none = Noch keine Starttexte.
notebook-start-delete-title = „{ $name }“ löschen?
notebook-start-delete-message = Die Notizen, die damit begonnen wurden, bleiben, wie sie sind.

## Notes from other programs

notebook-import = Notizen importieren…
notebook-import-title = Notizen importieren
notebook-import-folder = Einen Ordner…
notebook-import-file = Eine Datei…
notebook-import-programs = Ein Ordner von Obsidian, Joplin, Notion, Bear, Google Keep oder OneNote, oder mit Markdown und Text; eine Datei von Evernote (.enex) oder OneNote (.one), oder eine Markdown-Datei.
notebook-import-choose-folder = Einen Ordner mit Notizen auswählen
notebook-import-choose-file = Eine Datei mit Notizen auswählen
notebook-import-filter = Notizen
notebook-import-kind = { $kind ->
    [obsidian] Notizen von Obsidian
    [joplin] Notizen von Joplin
    [notion] Notizen von Notion
    [bear] Notizen von Bear
    [evernote] Notizen von Evernote
    [keep] Notizen von Google Keep
    [onenote] Notizen von OneNote
   *[markdown] Markdown- und Textdateien
}
notebook-import-count = { $count ->
    [one] Eine Notiz
   *[other] { $count } Notizen
}
notebook-import-files = { $count ->
    [0] keine Bilder oder Dateien
    [one] ein Bild oder eine Datei
   *[other] { $count } Bilder und Dateien
}
notebook-import-none = Hier wurden keine Notizen gefunden.
notebook-import-to-know = Wissenswert
notebook-import-unread = Das konnte nicht als Notizen gelesen werden.
notebook-import-do = Importieren
notebook-import-reading = Wird gelesen… { $done } von { $count }: { $name }
notebook-import-stop = Anhalten
notebook-import-done = { $count ->
    [one] Eine Notiz in „{ $box }“ importiert
   *[other] { $count } Notizen in „{ $box }“ importiert
}
notebook-import-nothing = Es wurde nichts zum Importieren gefunden
notebook-import-problems = { $count ->
    [one] Eine Sache konnte nicht gelesen werden: { $first }
   *[other] { $count } Dinge konnten nicht gelesen werden: { $first }
}

## The list in the document pane, and what goes into a text

notebook-between = Zwischen den Seiten und den Notizen
notebook-pane-find = Eine Notiz finden
notebook-pane-open = Das Notizbuch öffnen
notebook-pane-unread = Das Notizbuch konnte nicht gelesen werden
notebook-pane-empty = Das Notizbuch ist leer
notebook-pane-nothing-found = Keine Notiz enthält diese Wörter
notebook-pane-drag = Eine Notiz oder einen Teil davon in den Text ziehen.
notebook-pane-show-all = Alles zeigen
notebook-pane-show-less = Weniger zeigen
notebook-pane-used = In diesem Projekt verwendet
notebook-pane-put-into-text = In den Text einfügen
notebook-pane-open-note = Im Notizbuch öffnen
notebook-pane-a-picture = Ein Bild
# A source made a reference of the library, as what was taken from it went into a text.
notebook-pane-reference-made = Zur Bibliothek hinzugefügt: { $title }
notebook-pane-reference-not-made = { $source } konnte nicht zur Bibliothek hinzugefügt werden
notebook-pane-picture-not-moved = { $name } konnte nicht unter die Dateien der Bibliothek gelegt werden
notebook-pane-file-not-into-text = Eine Datei kann nicht in einen Text eingefügt werden
notebook-pane-not-into-text = Die Notiz konnte nicht in den Text eingefügt werden

## The window of a note of its own (record 0109)

notebook-note-window-placeholder = Eine Notiz schreiben
notebook-note-window-send = Ins Notizbuch
notebook-note-window-add-file = Eine Datei hinzufügen…
notebook-note-window-not-sent = Die Notiz konnte nicht ins Notizbuch geschrieben werden
