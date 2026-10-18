# The projects: the list of them, and what is done with them.

home-title = Projekte
home-join = Einem geteilten Projekt beitreten
home-from-document = Ein Projekt aus einem Dokument…
home-new = Neues Projekt

## The three forms of the page: the last used projects as cards, all of them as a list, all of them as a map around the owl

home-shown = Was gezeigt wird
home-recent = Zuletzt verwendet
home-all = Alle Projekte
home-owl = Karte
# Under the cards, when there are more projects than they show.
home-show-all = Alle { $count } Projekte zeigen
# The button that opens the menu of the page.
home-page-menu = Mehr
home-search = Projekt finden
home-search-none = Kein Projekt hat diesen Namen.
home-list-none = Es gibt keine Projekte.

## Folders of projects

home-new-folder = Neuer Ordner
home-folder-new-project = Neues Projekt darin…
home-folder-new-inside = Neuer Ordner darin…
home-folder-rename-title = Ordner umbenennen
home-folder-name-placeholder = Was der Ordner enthält
home-folder-name-missing = Geben Sie dem Ordner einen Namen.
home-folder-projects = { $count ->
    [one] { $count } Projekt
   *[other] { $count } Projekte
}
home-menu-move = In Ordner verschieben
home-menu-out = Aus den Ordnern heraus
home-folder-delete-title = Den Ordner „{ $name }“ löschen?
home-folder-delete-message = Die Ordner und Projekte darin bleiben erhalten: sie rücken dorthin auf, wo der Ordner war.
home-folder-delete-confirm = Ordner löschen
home-folder-failed = Das ging mit dem Ordner nicht
home-moved-to = „{ $name }“ wurde nach { $folder } verschoben
home-moved-out = „{ $name }“ ist jetzt in keinem Ordner
home-move-failed = Das Projekt konnte nicht verschoben werden

## The pane of projects, at the left of a project

home-pane = Die Liste der Projekte
home-pane-toggle = Die Liste der Projekte
home-pane-close = Die Liste der Projekte schließen
home-pane-between = Zwischen der Liste der Projekte und dem Projekt
# On the chevron before an element of the open project, in the pane: what is under it is shown, or hidden.
home-tree-unfold = Zeigen, was darunter ist
home-tree-fold = Verbergen, was darunter ist
# Why the project that is open cannot be renamed or deleted from its menu.
home-open-now = Es ist gerade geöffnet
# On the menu of a project, or of an element of one, in the pane: shows it in a second pane, beside the project that is open.
home-open-beside = Daneben öffnen
# Under a project that is not open, in the pane, when what it holds could not be read.
home-tree-unreadable = Es konnte nicht gelesen werden
# Under a project that is not open, in the pane, when it holds no elements yet.
home-tree-empty = Noch nichts darin

## The owl map: the projects drawn around the owl, the folders as plain labels

# The button that shows all of the map at once.
home-owl-fit = Alles zeigen
# On a folder of the map: its projects are hidden, or shown.
home-owl-fold = Die Projekte darin verbergen
home-owl-unfold = Die Projekte darin zeigen
# The map itself, as a list read aloud.
home-owl-label = Die Karte der Projekte
# The corner of a card that opens the project, and of a folder that shows it at the centre of the map.
home-owl-open = Das Projekt öffnen
home-owl-enter = Den Ordner als Karte öffnen
# The corner of the folder at the centre: up to what holds it.
home-owl-leave = Hinauf zu „{ $name }“
# The menus of the map and of a folder on it: a new one made here, its name written in place.
home-owl-new-project = Neues Projekt hier
home-owl-new-folder = Neuer Ordner hier
# What a new folder or project is called until its name is written.
home-owl-name = Name
# Beside the pointer, while several folders and projects are dragged.
home-owl-dragged = { $count ->
    [one] { $count } Eintrag
   *[other] { $count } Einträge
}
# On a card: the map of the project, shown under it on the map of the projects, or hidden.
home-owl-map-show = Seine Karte hier zeigen
home-owl-map-hide = Seine Karte verbergen
home-owl-map-reading = Seine Karte wird gelesen…
# On an element of a project's map: the project opened there.
home-owl-jump = Das Projekt hier öffnen
home-owl-fold-element = Verbergen, was darunter ist
home-owl-unfold-element = Zeigen, was darunter ist
# The menu of the map: what was put by hand is placed by itself again.
home-owl-tidy = Alles von selbst anordnen
home-owl-tidied = Alles auf der Karte ist wieder von selbst angeordnet
# What a change of the map says, with a way back.
home-owl-placed = „{ $name }“ wurde dorthin gesetzt
home-owl-placed-many = { $count ->
    [one] { $count } Eintrag wurde dorthin gesetzt
   *[other] { $count } Einträge wurden dorthin gesetzt
}
home-owl-elements-moved = { $count ->
    [one] Ein Element von „{ $project }“ wurde verschoben
   *[other] { $count } Elemente von „{ $project }“ wurden verschoben
}
home-owl-elements-carried = { $count ->
    [one] Ein Element wurde nach „{ $to }“ verschoben
   *[other] { $count } Elemente wurden nach „{ $to }“ verschoben
}
# The bar over the map, at a folder: what holds it.
home-owl-in = In „{ $name }“

## A map of the projects

home-map-menu = Eine Karte der Projekte…
home-map-title = Eine Karte der Projekte
home-map-about = Ein neues Projekt: die Ordner als Elemente, und unter jedem Ordner die Projekte darin.
home-map-name-default = Projekte
home-map-what = Was die Karte enthält
home-map-names = Nur die Namen
home-map-names-hint = Ein Element für jedes Projekt, mit seiner Beschreibung als Text.
home-map-everything = Mit allem, was darin ist
home-map-everything-hint = Unter jedem Projekt alle seine Elemente, mit ihren Namen und Texten.
home-map-note = Die Zitationen behalten ihre Quellen. Ein Verweis auf eine Abbildung oder einen Teil zeigt im neuen Projekt auf nichts, und Kommentare bleiben zurück.
home-map-reading = „{ $name }“ wird gelesen…
home-map-working = Die Karte wird angelegt…
home-map-make = Karte anlegen
home-map-failed = Die Karte der Projekte konnte nicht angelegt werden

## When there are none yet

home-welcome = Willkommen bei Glaukopis
home-welcome-text = Ein Projekt enthält die Arbeit an einem Buch oder Artikel: die Karte Ihrer Gedanken, die Texte, die Sie hineinschreiben, und die Quellen, auf denen sie ruhen.
home-begin = Ein Projekt beginnen

## A project in the list

# Under the names of the first four maps.
home-more-maps = und { $count } weitere
home-maps = { $count ->
    [one] { $count } Baum
   *[other] { $count } Bäume
}
home-elements = { $count ->
    [one] { $count } Element
   *[other] { $count } Elemente
}
home-words = { $count ->
    [one] { $count } Wort
   *[other] { $count } Wörter
}
home-references = { $count ->
    [one] { $count } Quelle
   *[other] { $count } Quellen
}
home-not-begun = Nicht begonnen
home-shared = Geteilt
# "ago" is how long ago it was: "3 hours ago", "yesterday", "12 March".
home-changed = Geändert { $ago }
# The button that opens the menu of a project.
home-more-for = Mehr zu { $name }
home-deleted-projects = { $count ->
    [one] { $count } gelöschtes Projekt
   *[other] { $count } gelöschte Projekte
}

## The menu of a project

home-menu-rename = Umbenennen…
home-menu-duplicate = Duplizieren…
home-menu-history = Frühere Fassungen…
home-menu-save-file = Als Datei speichern…
home-menu-save-org = Als Org speichern…

## Naming a project

home-rename-title = Projekt umbenennen
home-duplicate-title = Projekt duplizieren
home-name = Name
home-name-placeholder = Der Arbeitstitel des Buches oder Artikels
home-name-missing = Geben Sie dem Projekt einen Namen.
home-create = Anlegen
home-duplicate = Duplizieren
# The name a copy of a project is given, until it is given another.
home-copy-name = { $name }, Kopie
home-failed = Das hat nicht geklappt.

## Deleting a project

home-delete-title = „{ $name }“ löschen?
home-delete-message = Das Projekt wird in den Papierkorb von Glaukopis verschoben, aus dem es zurückgeholt werden kann. Ihre Quellen werden nicht angerührt.
home-delete-owner = Das Projekt wird in den Papierkorb von Glaukopis verschoben, aus dem es zurückgeholt werden kann. Es bleibt auf dem Server und bei denen, mit denen Sie es teilen; um es vom Server zu nehmen, öffnen Sie es und beenden Sie zuerst das Teilen.
home-delete-member = Das Projekt wird in den Papierkorb von Glaukopis verschoben, aus dem es zurückgeholt werden kann. Die anderen behalten ihres.
home-delete-confirm = Projekt löschen
home-deleted = „{ $name }“ wurde in den Papierkorb verschoben
home-delete-failed = Das Projekt konnte nicht gelöscht werden

## The trash

home-trash-title = Gelöschte Projekte
home-trash-none = Es gibt keine.
home-deleted-ago = Gelöscht { $ago }
home-restore = Zurückholen
home-restored = „{ $name }“ ist wieder unter den Projekten
home-restore-failed = Das Projekt konnte nicht zurückgeholt werden
home-purge = Endgültig entfernen
home-purge-title = „{ $name }“ endgültig entfernen?
home-purge-message = Was das Projekt enthält, kann danach nicht mehr zurückgeholt werden. Ihre Quellen werden nicht angerührt.
home-purge-failed = Das Projekt konnte nicht entfernt werden

## Earlier versions of a project

home-history-title = Frühere Fassungen
home-history-about = Von „{ $name }“. Eine Fassung wird als eigenes Projekt geöffnet; dieses bleibt, wie es ist.
home-history-none = Noch keine aufbewahrt. Eine Fassung wird hin und wieder aufbewahrt, während Sie arbeiten: dicht für das Jüngste, spärlicher für das Alte.
home-history-open = Kopie öffnen
# The name of the project an earlier version is opened as; "day" is the day it was kept.
home-history-copy-name = { $name }, Stand { $day }
home-history-unread = Die früheren Fassungen konnten nicht gelesen werden
home-history-open-failed = Diese Fassung konnte nicht geöffnet werden

## A project as one file

home-file-open = Projektdatei öffnen…
home-file-open-title = Projektdatei öffnen
# The kind of file, in the dialog that asks for one.
home-file-filter = Glaukopis-Projekt
home-file-save-title = Das Projekt als Datei speichern
home-file-saved = „{ $name }“ wurde als Datei gespeichert
home-file-save-failed = Das Projekt konnte nicht als Datei gespeichert werden
home-file-open-failed = Die Projektdatei konnte nicht geöffnet werden
home-file-opened = „{ $name }“ wurde aus der Datei angelegt
home-file-opened-added = „{ $name }“ wurde aus der Datei angelegt. { $count ->
    [one] Ein Werk wurde
   *[other] { $count } Werke wurden
} Ihrer Bibliothek hinzugefügt.
home-file-problems = { $count ->
    [one] Ein Werk konnte nicht in Ihre Bibliothek übernommen werden. Es wird zitiert, wie es in der Datei war.
   *[other] { $count } Werke konnten nicht in Ihre Bibliothek übernommen werden. Sie werden zitiert, wie sie in der Datei waren.
}
# The dialog that asks what is to be done with the works a project file cites.
home-file-references-title = Die Werke, die das Projekt zitiert
home-file-references-about = Bevor „{ $name }“ angelegt wird: diese Werke sind in Ihrer Bibliothek, aber nicht so, wie sie in der Datei sind.
home-file-in-file = In der Datei
home-file-same-id = In Ihrer Bibliothek als derselbe Eintrag, anders geschrieben
home-file-merged = In Ihrer Bibliothek, mit diesem Eintrag zusammengeführt
home-file-what-to-do = Was damit geschehen soll
home-file-keep-library = Den Eintrag Ihrer Bibliothek behalten
home-file-take-file = Den Eintrag der Datei in Ihre Bibliothek übernehmen
home-file-keep-both = Beide behalten
home-file-cite-library = Den Eintrag Ihrer Bibliothek zitieren
home-file-add-another = Den Eintrag der Datei als weiteres Werk hinzufügen
home-file-same = { $count ->
    [one] Ein Werk ist in Ihrer Bibliothek so, wie es in der Datei ist.
   *[other] { $count } Werke sind in Ihrer Bibliothek so, wie sie in der Datei sind.
}
home-file-added = { $count ->
    [one] Ein Werk ist nicht in Ihrer Bibliothek und wird ihr hinzugefügt.
   *[other] { $count } Werke sind nicht in Ihrer Bibliothek und werden ihr hinzugefügt.
}
home-file-make = Projekt anlegen

## A project as Org: its readable copy in a folder, and a new project made of an Org file

home-org-open = Org-Datei öffnen…
home-org-open-title = Org-Datei öffnen
# The kind of file, in the dialog that asks for one.
home-org-filter = Org-Datei
home-org-open-failed = Die Org-Datei konnte nicht geöffnet werden
home-org-save-title = Den Ordner wählen, in dem das Projekt als Org gespeichert wird
home-org-saved = „{ $name }“ wurde als Org gespeichert
home-org-save-failed = Das Projekt konnte nicht als Org gespeichert werden

## Changes of the home undone and done again
home-redo = Wiederherstellen
# What was undone, as the message of the change said it.
home-undone = Rückgängig gemacht: { $what }
home-undo-failed = Das konnte nicht rückgängig gemacht werden

## What a change of the home says, with a way back
home-renamed = „{ $old }“ heißt jetzt „{ $name }“
home-project-made = „{ $name }“ wurde angelegt
home-folder-made = Der Ordner „{ $name }“ wurde angelegt
home-moved-many-to = { $count ->
    [one] { $count } Eintrag wurde nach { $folder } verschoben
   *[other] { $count } Einträge wurden nach { $folder } verschoben
}
home-moved-many-out = { $count ->
    [one] { $count } Eintrag ist jetzt in keinem Ordner
   *[other] { $count } Einträge sind jetzt in keinem Ordner
}
home-folder-deleted = Der Ordner „{ $name }“ wurde gelöscht; was darin war, ist aufgerückt
home-deleted-many = { $count ->
    [one] { $count } Eintrag wurde gelöscht
   *[other] { $count } Einträge wurden gelöscht
}
home-not-in-trash = Das Projekt ist nicht mehr im Papierkorb.
home-folders-delete-title = { $count ->
    [one] { $count } Ordner löschen?
   *[other] { $count } Ordner löschen?
}
home-folders-delete-message = Die Ordner und Projekte darin bleiben erhalten: sie rücken dorthin auf, wo die Ordner waren.
home-folders-delete-confirm = Ordner löschen
home-delete-many-title = { $count ->
    [one] { $count } Projekt löschen?
   *[other] { $count } Projekte löschen?
}
home-delete-many-message = Die Projekte werden in den Papierkorb von Glaukopis verschoben, aus dem sie zurückgeholt werden können. Ihre Quellen werden nicht angerührt.
home-delete-many-shared = Die Projekte werden in den Papierkorb von Glaukopis verschoben, aus dem sie zurückgeholt werden können. Die geteilten bleiben auf dem Server und bei den anderen.
home-delete-many-confirm = Projekte löschen
