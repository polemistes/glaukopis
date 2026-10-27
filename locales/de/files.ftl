# The files of the library: a store of their own beside the pictures, in
# folders of their own, each file belonging to no reference, to one or to
# several. The view stands in the library's place.

files-title = Dateien der Bibliothek
files-all = Alle Dateien
files-file = Datei
files-unread = Die Dateien der Bibliothek konnten nicht gelesen werden
files-count = { $count ->
    [one] { $count } Datei
   *[other] { $count } Dateien
}
files-shown-of = { $shown } von { $count ->
    [one] { $count } Datei
   *[other] { $count } Dateien
}
files-selected-of = { $selected } von { $count } ausgewählt
files-selected = { $count ->
    [one] { $count } Datei ausgewählt
   *[other] { $count } Dateien ausgewählt
}

## The kinds of files.

files-kind = Art
files-kind-pdf = PDF
files-kind-picture = Bild
files-kind-document = Dokument
files-kind-other = Andere Datei

## Taking in.

files-add = Dateien hinzufügen…
files-add-title = Dateien zur Bibliothek hinzufügen
files-add-folder = Ordner hinzufügen…
files-add-folder-title = Einen Ordner zur Bibliothek hinzufügen
files-more = Weitere Wege zum Hinzufügen
files-taking-in = { $count ->
    [one] Eine Datei wird aufgenommen…
   *[other] { $count } Dateien und Ordner werden aufgenommen…
}
files-taking-in-progress = Wird aufgenommen ({ $done } von { $count }): { $name }
files-taken-in = { $count ->
    [one] Eine Datei aufgenommen
   *[other] { $count } Dateien aufgenommen
}
files-same = { $count } schon vorhanden
files-folders-made = { $count ->
    [one] ein Ordner angelegt
   *[other] { $count } Ordner angelegt
}
files-problems = { $count ->
    [one] eine konnte nicht gelesen werden
   *[other] { $count } konnten nicht gelesen werden
}
files-taken-none = Nichts wurde aufgenommen
files-take-in-failed = Die Dateien konnten nicht aufgenommen werden

## Empty, searched and filtered.

files-empty = Noch keine Dateien
files-empty-text = Fügen Sie Dateien oder einen Ordner hinzu, oder lassen Sie sie hier fallen. Jede Art von Datei wird aufbewahrt, im eigenen Speicher der Bibliothek, und ein Ordner behält die Ordner darin.
files-folder-empty = Nichts in diesem Ordner
files-folder-empty-text = Lassen Sie Dateien hier fallen, oder ziehen Sie sie aus einem anderen Ordner hierher.
files-search = Dateien durchsuchen
files-search-in = In { $name } suchen
files-search-clear = Suche löschen
files-nothing-found = Nichts gefunden
files-nothing-found-text = Keine Datei hat diese Wörter in ihrem Namen oder in ihrer Quelle.
files-nothing-passes = Keine Datei hier kommt durch die Filter.
files-filters = Filter
files-filters-on = { $count ->
    [one] Filter: einer aktiv
   *[other] Filter: { $count } aktiv
}
files-filter-kind = Art
files-filter-all = Alle Arten
files-filter-pdf = PDFs
files-filter-picture = Bilder
files-filter-document = Dokumente
files-filter-other = Andere Dateien
files-filter-unassigned = Nur ohne Quelle
files-filter-search-all = In allen Ordnern suchen
files-filter-clear = Filter zurücksetzen
files-sort = Sortieren
files-sort-name = Nach Name
files-sort-reference = Nach Quelle
files-sort-added = Nach Hinzufügedatum
files-sort-size = Nach Größe
files-sort-descending = Absteigend

## The list.

files-no-reference = Keine Quelle
files-missing = fehlt
files-reveal = Im Dateimanager zeigen
files-move = Verschieben…
files-move-to = Verschieben nach
files-move-failed = Die Datei konnte nicht verschoben werden
files-at-top = Oberste Ebene, in keinem Ordner

## Folders.

files-folders = Ordner
files-folders-hint = Ordner halten die Dateien in Ordnung: ein Platz für jede Datei. Ein hinzugefügter Ordner behält die Ordner darin.
files-folder = Ordner
files-folder-new = Neuer Ordner
files-folder-new-in = Neuer Ordner in { $name }
files-folder-new-inside = Neuer Ordner darin
files-folder-name = Name des Ordners
files-folder-name-failed = Der Ordner konnte nicht benannt werden
files-folder-move-to = Verschieben nach
files-folder-to-top = Auf die oberste Ebene
files-folder-move-failed = Der Ordner konnte nicht verschoben werden
files-folder-expand = Öffnen
files-folder-collapse = Schließen
files-folder-delete = Ordner löschen
files-folder-delete-title = Den Ordner „{ $name }“ löschen?
files-folder-delete-empty = Der Ordner ist leer.
files-folder-delete-subfolders = { $count ->
    [one] Der Ordner enthält einen Unterordner. Was soll mit ihm geschehen?
   *[other] Der Ordner enthält { $count } Unterordner. Was soll mit ihnen geschehen?
}
files-folder-move-up = Eine Ebene nach oben verschieben
files-folder-delete-all-under = Alle Ordner darunter löschen
files-folder-delete-files = { $count ->
    [one] Der Ordner enthält eine Datei. Was soll mit ihr geschehen?
   *[other] Der Ordner enthält { $count } Dateien. Was soll mit ihnen geschehen?
}
files-folder-delete-files-under = { $count ->
    [one] Der Ordner und die Ordner darunter enthalten eine Datei. Was soll mit ihr geschehen?
   *[other] Der Ordner und die Ordner darunter enthalten { $count } Dateien. Was soll mit ihnen geschehen?
}
# Said after the question above, where files to be deleted belong to references.
files-folder-delete-files-assigned = { $count ->
    [one] Eine davon gehört zu einer Quelle, die sie verlieren würde.
   *[other] { $count } davon gehören zu Quellen, die sie verlieren würden.
}
files-folder-files-to-parent = In den übergeordneten Ordner legen
files-folder-files-delete = Löschen
files-folder-delete-failed = Der Ordner konnte nicht gelöscht werden

## The pane of a file.

files-name = Name
files-references = Quellen
files-unassigned = Nicht zugeordnet: die Datei gehört zu keiner Quelle.
files-assign = Einer Quelle zuordnen…
files-assign-title = „{ $name }“ einer Quelle zuordnen
files-assign-failed = Die Datei konnte nicht zugeordnet werden
files-unassign = Von „{ $name }“ lösen
files-unassign-failed = Die Datei konnte nicht von der Quelle gelöst werden
files-about = Über die Datei
files-size = Größe
files-pages = Seiten
# $text is one of the three below.
files-pdf-pages = { $count ->
    [one] { $count } Seite · { $text }
   *[other] { $count } Seiten · { $text }
}
files-pdf-has-text = hat Text
files-pdf-no-text = kein Text
# Shown as the pages of a PDF that could not be looked at; the reason is what the reading said.
files-pdf-unread = konnte nicht gelesen werden: { $reason }
files-pdf-some-text = { $count ->
    [one] eine Seite ohne Text
   *[other] { $count } Seiten ohne Text
}
files-added = Hinzugefügt
files-origin = Herkunft
files-searchable = Durchsuchbar machen…
files-read-into = Den Text als Karte importieren…
files-read-text = Den Text lesen…
files-bring-in = Als Elemente einlesen…
files-rename-failed = Die Datei konnte nicht umbenannt werden

## Removing.

files-remove = Entfernen
files-remove-title = „{ $name }“ aus der Bibliothek entfernen?
files-remove-message = Die Datei wird aus dem Speicher der Bibliothek gelöscht.
files-remove-message-assigned = { $count ->
    [one] Die Datei gehört zu { $names }; die Quelle verliert sie. Sie wird aus dem Speicher der Bibliothek gelöscht.
   *[other] Die Datei gehört zu { $count } Quellen, { $names }, die sie verlieren. Sie wird aus dem Speicher der Bibliothek gelöscht.
}
files-remove-many-title = { $count } Dateien aus der Bibliothek entfernen?
files-remove-many-message = Die Dateien werden aus dem Speicher der Bibliothek gelöscht.
files-remove-many-assigned = { $count ->
    [one] Eine davon gehört zu einer Quelle, die sie verliert. Sie werden aus dem Speicher der Bibliothek gelöscht.
   *[other] { $count } davon gehören zu Quellen, die sie verlieren. Sie werden aus dem Speicher der Bibliothek gelöscht.
}
files-remove-failed = Die Datei konnte nicht entfernt werden
# Said in the question where removing the files leaves folders empty; folders empty before are not counted.
files-remove-folders-left = { $count ->
    [one] Ein Ordner bleibt dadurch leer.
   *[other] { $count } Ordner bleiben dadurch leer.
}
files-remove-with-folders = Entfernen, mit den leeren Ordnern
files-remove-keep-folders = Entfernen, die Ordner behalten
files-removing = { $count } Dateien werden entfernt…
files-removed = { $count ->
    [0] Keine Datei entfernt
    [one] Eine Datei entfernt
   *[other] { $count } Dateien entfernt
}
files-removed-folders = { $count ->
    [one] mit ihnen ein leerer Ordner
   *[other] mit ihnen { $count } leere Ordner
}
# When references are deleted: their files go too, unless another reference has them.
files-remove-with-files = Mit den Dateien löschen

## Choosing a reference.

files-choose-reference = Quelle wählen
files-choose-search = Nach Autor, Titel oder Jahr suchen
files-choose-references = Quellen
files-choose-none = Keine Quelle hat diese Wörter.
files-choose-empty = Die Bibliothek hat noch keine Quellen.
files-choose-more = … und { $count } weitere: suchen Sie, um sie zu finden
files-choose-files = Dateien der Bibliothek
files-choose-files-search = Nach Name suchen oder nach dem Werk, zu dem eine Datei gehört
files-choose-files-none = Keine Datei passt dazu.
files-choose-add = { $count ->
    [0] Dateien hinzufügen
    [one] Eine Datei hinzufügen
   *[other] { $count } Dateien hinzufügen
}
files-added-to = { $count ->
    [one] Eine Datei zu „{ $title }“ hinzugefügt
   *[other] { $count } Dateien zu „{ $title }“ hinzugefügt
}
files-choose-new = Neue Quelle…
files-choose = Auswählen

## Nothing selected.

files-none-selected = Keine Datei ausgewählt
files-none-selected-text = Wählen Sie eine Datei aus, um zu sehen, was über sie bekannt ist und was sich mit ihr tun lässt.
# $name is the folder in view, or “All files”.
files-tally = { $name }: { $count ->
    [one] eine Datei
   *[other] { $count } Dateien
}, { $unassigned } ohne Quelle

## The going-through: files given to their references.

files-go-through-head = Die Dateien durchgehen, um sie ihren Quellen zuzuordnen…
files-go-through-chosen = { $count ->
    [one] Sie durchgehen…
   *[other] Diese { $count } durchgehen…
}
files-go-through-nothing = Jede Datei hier gehört zu einer Quelle
files-folder-go-through = Die Dateien ohne Quelle durchgehen…
# The bar at the head of the files, while files of the folder in view belong to no reference.
files-unassigned-here = { $count ->
    [one] Eine Datei hier gehört zu keiner Quelle.
   *[other] { $count } Dateien hier gehören zu keiner Quelle.
}
files-unassigned-go = Sie durchgehen…
files-unassigned-hide = Ausblenden
files-going-title = Die Dateien ihren Quellen zuordnen
files-going-subtitle = { $count ->
    [one] Eine Datei
   *[other] { $count } Dateien
}
files-going-finding = { $count ->
    [one] Es wird festgestellt, was die Datei ist…
   *[other] Es wird festgestellt, was die { $count } Dateien sind…
}
files-going-progress = { $done } von { $count }: { $name }
files-going-finding-hint = Jede Datei wird nach einer Kennung und einem Titel durchgesehen, ihr Name wird gelesen und ihre erste Seite mit der Bibliothek verglichen. Was festgestellt wird, bleibt erhalten, solange die Anwendung offen ist.
files-going-stop = Anhalten
files-going-failed = Was die Dateien sind, konnte nicht festgestellt werden
files-going-all-certain = { $count ->
    [one] Die eine sicher gefundene:
   *[other] Alle { $count } sicher gefundenen:
}
files-going-all-probable = { $count ->
    [one] Die eine wahrscheinlich gefundene:
   *[other] Alle { $count } wahrscheinlich gefundenen:
}
files-going-all-new = { $count ->
    [one] Die eine neue, aus den Diensten:
   *[other] Alle { $count } neuen, aus den Diensten:
}
files-going-all-nothing = { $count ->
    [one] Die eine, zu der nichts gefunden wurde:
   *[other] Die { $count }, zu denen nichts gefunden wurde:
}
files-going-this-new = Neue Quelle
files-going-show-all = Alle { $count } zeigen
files-going-what = Was aus { $name } wird
files-going-this = Diese
files-going-other = Eine andere…
files-going-new = Neue Quelle…
files-going-later = Später
files-going-certain = sicher
files-going-probable = wahrscheinlich
files-going-which = Welches Werk
# $origin is where the description comes from: a service, or the file.
files-going-lookup = Eine neue Quelle · nach { $origin }
files-going-nothing = Nichts gefunden
files-going-chosen = Gewählt
files-going-made-here = Hier angelegt
files-going-none = Keine der Dateien konnte durchgegangen werden.
# The files the going-through did not reach, as when it was stopped: they keep no reference, and the bar offers them again.
files-going-not-reached = { $count ->
    [one] Eine Datei wurde nicht angesehen. Sie bleibt, wie sie ist, für ein andermal.
   *[other] { $count } Dateien wurden nicht angesehen. Sie bleiben, wie sie sind, für ein andermal.
}
files-going-counts = { $assign } zuzuordnen, { $later } für später
files-going-done = { $count ->
    [0] Nichts zuzuordnen
    [one] Eine Datei ihrer Quelle zuordnen
   *[other] { $count } Dateien ihren Quellen zuordnen
}
files-going-applying = Die Dateien werden ihren Quellen zugeordnet…
files-going-source = Die Dateien der Bibliothek
files-going-assigned = { $count ->
    [0] Keine Datei zugeordnet
    [one] Eine Datei zugeordnet
   *[other] { $count } Dateien zugeordnet
}
files-going-made = { $count ->
    [one] eine neue Quelle
   *[other] { $count } neue Quellen
}
files-going-later-count = { $count } für später aufgehoben
files-going-undo = Rückgängig
files-going-undone = { $count ->
    [0] Keine Datei zurückgenommen
    [one] Eine Datei zurückgenommen
   *[other] { $count } Dateien zurückgenommen
}
files-going-undone-made = { $count ->
    [one] eine neue Quelle entfernt
   *[other] { $count } neue Quellen entfernt
}
# In the menu of the head of the files, while the last going-through can be undone.
files-undo-last = { $count ->
    [one] Rückgängig: eine Datei ihrer Quelle zugeordnet
   *[other] Rückgängig: { $count } Dateien ihren Quellen zugeordnet
}

## Exporting.

files-export-folder-title = Den Ordner wählen, in den exportiert wird
files-export-title = { $count ->
    [one] Eine Datei exportieren
   *[other] { $count } Dateien exportieren
}
files-export-all-what = Jede Datei wird in den Ordner geschrieben, den Sie als Nächstes wählen, unter dem Namen ihrer Quelle, Autor Jahr - Titel, oder unter ihrem eigenen, wo sie keine hat; die Ordner der Bibliothek werden darin zu Ordnern.
files-export-folder-what = Die Dateien des Ordners werden in den geschrieben, den Sie als Nächstes wählen, unter den Namen ihrer Quellen oder unter ihren eigenen, wo sie keine haben; die Ordner darunter werden darin zu Ordnern.
files-export-files-what = { $count ->
    [one] Die Datei wird in den Ordner geschrieben, den Sie als Nächstes wählen, unter dem Namen ihrer Quelle oder unter ihrem eigenen, wo sie keine hat.
   *[other] Die Dateien werden in den Ordner geschrieben, den Sie als Nächstes wählen, unter den Namen ihrer Quellen oder unter ihren eigenen, wo sie keine haben.
}
files-export-bib = Mit einer references.bib
files-export-bib-hint = Die Werke, zu denen die Dateien gehören, jedes mit dem Ort seiner Dateien, so dass Zotero oder JabRef den Ordner vollständig liest.
files-export-go = Den Ordner wählen…
files-exporting = { $count ->
    [one] Eine Datei wird exportiert…
   *[other] { $count } Dateien werden exportiert…
}
files-exporting-progress = Wird exportiert ({ $done } von { $count }): { $name }
files-exported = { $count ->
    [0] Keine Datei exportiert
    [one] Eine Datei exportiert
   *[other] { $count } Dateien exportiert
}
files-exported-folders = { $count ->
    [one] ein Ordner
   *[other] { $count } Ordner
}
files-exported-bib = mit einer references.bib
files-exported-stopped = angehalten, { $count } übrig
files-exported-show = Zeigen
files-export-failed = Die Dateien konnten nicht exportiert werden
files-reveal-failed = Der Ordner konnte nicht gezeigt werden
files-export = Exportieren…
files-export-chosen = Diese { $count } exportieren…
files-export-all = Alle Dateien exportieren…
