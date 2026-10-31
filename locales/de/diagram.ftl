# A map as a diagram: the elements on a canvas, their branches and associations.

diagram-map = Karte
diagram-idea = Name
diagram-new-here = Neues Element hier
diagram-open-as-map = Hineingehen
diagram-show-all = Die ganze Karte zeigen
diagram-tidy = Die ganze Karte aufräumen
# The keys are shown as keys, where the variables stand.
diagram-hint-empty = { $alt }+{ $enter } fügt ein Element nach dem ausgewählten hinzu · { $alt }+{ $shift }+{ $enter } eines darunter · Doppelklick zum Schreiben
diagram-hint-linking = Klicken Sie das Element an, mit dem verbunden werden soll, oder gehen Sie mit den Pfeilen hin und drücken Sie { $enter } · { $esc } zum Verlassen
diagram-link-handle = Zu einem anderen Element ziehen, um sie zu verbinden

## The view

diagram-view = Ansicht
diagram-zoom-out = Verkleinern
diagram-zoom-in = Vergrößern
diagram-actual-size = Tatsächliche Größe
# How large the map is shown, in hundredths of its size.
diagram-zoom = { $percent } %

## Copying and pasting elements.

diagram-copied = { $count ->
    [one] Ein Element kopiert, mit allem darunter
   *[other] { $count } Elemente kopiert, mit allem darunter
}
diagram-cut = { $count ->
    [one] Ein Element ausgeschnitten: es wird verschoben, wohin Sie es einfügen
   *[other] { $count } Elemente ausgeschnitten: sie werden verschoben, wohin Sie sie einfügen
}
diagram-paste-here = Hier einfügen
diagram-nothing-copied = Noch nichts kopiert
diagram-pasted-elsewhere = Das Kopierte ist aus einem anderen Projekt und kann hier nicht eingefügt werden

## Fewer words, stage 2 (agent "chrome"): the words of the menus.

# The tooltips of the mark that folds an element in the diagram.
diagram-unfold-sub = Unterelemente ausklappen
diagram-fold-sub = Unterelemente einklappen

## The diagram as a picture (2026-10-26).

diagram-save-svg = Das Diagramm als SVG speichern…
diagram-save-image = Das Diagramm als Bild speichern…
diagram-save-svg-title = Das Diagramm als SVG speichern
diagram-save-image-title = Das Diagramm als Bild speichern
diagram-file-svg = SVG
diagram-file-png = PNG-Bild
# $name is the name of the file.
diagram-saved = Das Diagramm wurde als „{ $name }“ gespeichert
diagram-saved-size = Das Diagramm wurde als „{ $name }“ gespeichert, { $width } × { $height } Pixel
diagram-saved-no-fonts = Die Schriften konnten nicht in die Datei aufgenommen werden: wer die Datei öffnet, sieht das Diagramm in den eigenen Schriften.
diagram-save-failed = Das Diagramm konnte nicht gespeichert werden
diagram-too-large-for-image = Die Karte ist zu groß für ein Bild: speichern Sie sie als SVG.
