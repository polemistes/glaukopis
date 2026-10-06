# The projects: the list of them, and what is done with them.

home-title = Projekte
home-join = Einem geteilten Projekt beitreten
home-from-document = Ein Projekt aus einem Dokument…
home-new = Neues Projekt

## The two forms of the page: the last used projects as cards, all of them as a list

home-shown = Was gezeigt wird
home-recent = Zuletzt verwendet
home-all = Alle Projekte
# Under the cards, when there are more projects than they show.
home-show-all = Alle { $count } Projekte zeigen
# The button that opens the menu of the page.
home-page-menu = Mehr
home-search = Projekt finden
home-search-none = Kein Projekt hat diesen Namen.
home-list-none = Es gibt keine Projekte.

## Folders of projects

home-new-folder = Neuer Ordner
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

## A map of the projects

home-map-menu = Eine Karte der Projekte…
home-map-title = Eine Karte der Projekte
home-map-about = Ein neues Projekt mit einer Karte: die Ordner als Elemente, und unter jedem Ordner die Projekte darin.
home-map-name-default = Projekte
home-map-what = Was die Karte enthält
home-map-names = Nur die Namen
home-map-names-hint = Ein Element für jedes Projekt, mit seiner Beschreibung als Text.
home-map-everything = Mit allem, was darin ist
home-map-everything-hint = Unter jedem Projekt seine Karten, und unter jeder Karte alle ihre Elemente, mit Namen und Texten.
home-map-note = Die Zitationen behalten ihre Quellen. Ein Verweis auf eine Abbildung oder einen Teil zeigt im neuen Projekt auf nichts, und Kommentare bleiben zurück.
home-map-reading = „{ $name }“ wird gelesen…
home-map-working = Die Karte wird angelegt…
home-map-make = Karte anlegen
home-map-failed = Die Karte der Projekte konnte nicht angelegt werden

## When there are none yet

home-welcome = Willkommen bei Glaukopis
home-welcome-text = Ein Projekt enthält die Arbeit an einem Buch oder Artikel: die Karten Ihrer Gedanken, die Texte, die Sie hineinschreiben, und die Quellen, auf denen sie ruhen.
home-begin = Ein Projekt beginnen

## A project in the list

# Under the names of the first four maps.
home-more-maps = und { $count } weitere
home-maps = { $count ->
    [one] { $count } Karte
   *[other] { $count } Karten
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
