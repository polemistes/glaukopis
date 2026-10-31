# A file of the library shown in a side of the window: its pages, its bar, and what can go wrong.

viewer-file = Datei
# The page in view, of how many: "Page 3 of 271".
viewer-page-of = Seite { $page } von { $count }
# The number the page has in print, where it differs from its count: shown after the count, small.
viewer-printed = ({ $label })
viewer-go-to-page = Zu Seite gehen
viewer-zoom = Zoom
viewer-fit-width = So breit wie die Ansicht
viewer-zoom-percent = { $percent } %
viewer-not-drawn = Diese Seite konnte nicht gezeichnet werden: { $why }
viewer-not-found = Die Datei ist nicht mehr in der Bibliothek.
viewer-locked = Die Datei verlangt ein Passwort und kann nicht gezeigt werden.
viewer-not-shown = Diese Art von Datei kann hier nicht gezeigt werden: öffnen Sie sie in einem anderen Programm.
viewer-loading = Die Datei wird geöffnet…
# The zoom of an image, fitted: all of it seen, however small that makes it.
viewer-fit-image = Das ganze Bild in der Ansicht
# The field in which a zoom is written, in percent.
viewer-zoom-field = Zoom, in Prozent
viewer-zoom-choose = Einen Zoom wählen
viewer-files-menu = Dateien der Bibliothek
viewer-files-search = Eine Datei finden
viewer-tree-empty = Noch nichts hier

# A simple image editor (docs/plans/a-simple-image-editor.md): the button in the bar, the row under it, and what it says.
viewer-edit = Bearbeiten
viewer-edit-turn-left = Nach links drehen
viewer-edit-turn-right = Nach rechts drehen
viewer-edit-flip-sideways = Seitlich spiegeln
viewer-edit-flip-over = Kopfüber spiegeln
viewer-edit-crop = Zuschneiden
viewer-edit-brightness = Helligkeit
viewer-edit-contrast = Kontrast
viewer-edit-saturation = Sättigung
# How much of a colour the image has, 100 being as it is.
viewer-edit-percent = { $percent } %
# Puts one slider back at 100 %.
viewer-edit-as-it-was = Wie es war
viewer-edit-start-again = Von vorn beginnen
viewer-edit-keep = Als neue Datei behalten
# The size the crop cuts to, of the size of the whole: "Cut to 800 × 600 of 1600 × 1200".
viewer-edit-cut-to = Zugeschnitten auf { $width } × { $height } von { $fullWidth } × { $fullHeight }
viewer-edit-leave-title = Verlassen, ohne zu behalten?
viewer-edit-leave-message = Was geändert wurde, geht verloren.
viewer-edit-leave = Verlassen
viewer-edit-kept = Behalten als { $name }
viewer-edit-not-kept = Das bearbeitete Bild konnte nicht behalten werden
viewer-edit-not-opened = Das Bild konnte nicht zum Bearbeiten geöffnet werden
viewer-edit-too-large-title = Zu groß zum Bearbeiten
viewer-edit-too-large-message = Das Bild ist größer als { $most } MB, mehr darf ein Bild nicht haben. Stattdessen kann eine verkleinerte Kopie angelegt und bearbeitet werden.
viewer-edit-make-smaller = Eine verkleinerte Kopie anlegen

# Sources in tabs, bookmarks in a file (docs/plans/sources-in-tabs-bookmarks-and-the-scrolling-of-pages.md).
viewer-tabs = Tabs
viewer-tab-add = Eine Datei hinzufügen…
viewer-tab-add-title = Dateien zu den Tabs hinzufügen
viewer-tab-menu = Das Menü des Tabs
viewer-tab-close = Tab schließen
viewer-tab-close-others = Die anderen Tabs schließen
viewer-tab-again = Noch einmal in einem neuen Tab öffnen
viewer-tab-in-library = In der Bibliothek zeigen
viewer-tab-gone = Nicht mehr in der Bibliothek
viewer-tabs-none = Noch keine Dateien hier
# The tooltip of the project's name in the cell of a file side.
viewer-sources-of = Die Tabs von { $name }
viewer-places = Lesezeichen und Inhaltsverzeichnis
viewer-bookmark-here = Hier ein Lesezeichen setzen
viewer-bookmarks = Lesezeichen
viewer-bookmarks-none = Noch keine Lesezeichen
# The default name of a bookmark, and the small page said beside one.
viewer-bookmark-page = Seite { $label }
viewer-bookmark-name = Der Name des Lesezeichens
viewer-bookmark-rename = Umbenennen
viewer-bookmark-remove = Entfernen
viewer-bookmark-not-kept = Die Lesezeichen konnten nicht aufbewahrt werden
viewer-contents = Inhaltsverzeichnis
viewer-contents-none = Die Datei hat kein eigenes Inhaltsverzeichnis

# The tabs opened, files by their references, a file read in the library (docs/plans/the-tabs-opened-files-by-their-references-and-a-file-read-in-the-library.md).
viewer-back-to-files = Zurück zu den Dateien

# Printing (docs/plans/printing.md, record 0075).
# The button in the bar of a file, and in the dialog of its pages, that prints.
viewer-print = Drucken…
# The dialog that asks which pages of a PDF to print, before they are drawn.
viewer-print-pages = Zu druckende Seiten
viewer-print-all = { $count ->
    [one] Die eine Seite
   *[other] Alle { $count } Seiten
}
# "From [3] to [10]": the words around two fields of page numbers.
viewer-print-from = Von
viewer-print-to = bis
# Told while the pages are drawn for printing, before the system's dialog opens.
viewer-print-drawing = { $count ->
    [one] Eine Seite wird für den Druck gezeichnet…
   *[other] { $count } Seiten werden für den Druck gezeichnet…
}
viewer-print-stop = Anhalten
viewer-print-failed = Die Seiten konnten nicht für den Druck gezeichnet werden
