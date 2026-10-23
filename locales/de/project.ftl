# A project: its view, the bar over the map, what is done to elements, and
# the panels at the side with the references and the pictures.

project-list-unreadable = Die Projekte konnten nicht gelesen werden

## The view of a project

project-open-failed = Das Projekt konnte nicht geöffnet werden
# Shown under the words above when nothing more is known of why.
project-open-failed-detail = Das Projekt konnte nicht geöffnet werden.
project-back = Zurück zu den Projekten
project-fetching = Das Projekt wird geholt
project-fetching-offline = Der Server ist nicht zu erreichen. Das Projekt wird geholt, sobald es geht.
project-fetching-on-the-way = Es ist vom Server unterwegs.
project-name = Name des Projekts
project-rename = Projekt umbenennen
project-not-saved = Nicht gespeichert
project-redo = Wiederherstellen
project-view-this = Ansicht dieser Karte
project-diagram = Diagramm
project-text = Text
project-one-at-a-time = Eine auf einmal
project-side-by-side = Zwei nebeneinander
project-close-side = Diese Seite schließen
project-references = Quellen
project-pictures = Bilder
project-side-tabs = Was die Seitenleiste zeigt
project-side-map = Karte
project-between-maps = Zwischen den beiden Karten
project-between-preview = Zwischen der Karte und der Vorschau
project-between-pictures = Zwischen der Karte und den Bildern
project-between-references = Zwischen der Karte und den Quellen

## When the sharing ends from the other side

project-unshared = Das Projekt wird nicht mehr geteilt
project-unshared-this = Dieses Projekt wird nicht mehr geteilt
project-left-out = Sie sind nicht mehr unter den Mitwirkenden
project-unshared-unfetched = Es war noch nicht geholt worden, darum ist nichts davon auf diesem Computer.
project-unshared-not-removed = Das Projekt war noch nicht geholt worden und konnte nicht von der Liste der Projekte genommen werden
project-unshared-kept = Wer es geteilt hat, hat es vom Server genommen. Sie behalten das Projekt, wie es jetzt ist, und können allein daran weiterarbeiten.
project-left-out-kept = Sie behalten das Projekt, wie es jetzt ist, und können allein daran weiterarbeiten. Was die anderen von nun an schreiben, erreicht Sie nicht.
project-understood = Verstanden

## Files dropped on the project

project-drop-picture = Lassen Sie ein Bild auf das Element fallen, zu dem es gehört
project-cited-in = { $count ->
    [one] Die Quelle wird in „{ $name }“ zitiert
   *[other] { $count } Quellen werden in „{ $name }“ zitiert
}
# As above, where the element has no name.
project-cited-in-element = { $count ->
    [one] Die Quelle wird im Element zitiert
   *[other] { $count } Quellen werden im Element zitiert
}

## The bar over the map: where one is, and what is done with the element in view

# The name of an element that has none.
project-untitled = Ohne Titel
project-where = Wo Sie sind
# The tooltip of the crumb of the parent of the element in view, in the path over a side.
project-up-hint = Hinauf zu „{ $name }“ · Alt+Umschalt+↑
# The small round button by the element in view, in the diagram and the text: up to the element over it.
project-leave-map = Hinauf zu „{ $name }“
# The owl before the name of the project itself, in the first pane: up to all the projects.
# The sign of a project, read aloud, where it is shared.
project-badge-shared = { $name }, von Ihnen geteilt
project-badge-joined = { $name }, beigetreten
# Two projects side by side.
project-beside-failed = Das Projekt konnte nicht neben diesem geöffnet werden
project-beside-no-comments = Die Kommentare sind die des Projekts, das Sie geöffnet haben: öffnen Sie das andere für sich, um darin zu kommentieren
# A template of the writer's own was saved anew, and the copy of it the project carries could not be made afresh.
project-template-not-renewed = Die Kopie der Vorlage im Projekt konnte nicht auf den neuen Stand gebracht werden
# Said over the other pane while elements of one project are dragged over it.
project-copy-to-project = Nach „{ $name }“ kopieren
project-move-to-project = Nach „{ $name }“ verschieben
project-document-into = Ein Dokument hinein…
project-drop-on-map = Auf eine Karte fallen lassen, um dorthin zu verschieben · Strg halten, um zu kopieren
project-open-beside = Daneben öffnen
project-open-beside-hint = Zwei Karten nebeneinander, um Elemente zwischen ihnen zu verschieben
project-side-by-side-short = Nebeneinander
# The count is of those found in the element in view, and under it.
project-found-hint = { $count } durchzugehen und zu Zitationen zu machen
project-copied-to = Nach „{ $name }“ kopiert
project-moved-to = Nach „{ $name }“ verschoben
project-other-projects = Andere Projekte
project-send-failed = In „{ $project }“ konnte nicht geschrieben werden. Hier wurde nichts geändert.
project-send-no-element = Das Element ist nicht mehr in diesem Projekt.

## What is done to elements, in the diagram and in the text

project-add-under = Ein Element darunter hinzufügen
project-add = Ein Element hinzufügen
project-add-after = Ein Element danach hinzufügen
project-write-text = Seinen Text schreiben
project-associate = Verbinden mit…
project-associate-hint = Dann das andere Element anklicken
project-heading = Den Namen als Überschrift drucken
project-heading-hint = Aus: der Name ist ein Etikett für Sie; nur der Text wird gedruckt
project-leave-out = Aus dem Dokument weglassen
project-leave-out-hint = Mit allem darunter
# An element that stands for another element: in the document, that element is in its place.
project-stands-for = Steht für „{ $name }“
project-stand-for = Für ein anderes Element stehen
project-stand-for-heading = Im Dokument tritt dieses Element an seine Stelle
project-stand-for-none = Keine
# Copying or moving elements to the project itself, to one of its trees, or to another project.
project-copy-to = Kopieren nach
project-cut = Ausschneiden
project-cut-not-removed = Das Ausgeschnittene wurde eingefügt, konnte aber nicht aus dem Projekt genommen werden, aus dem es kam
project-copy = Kopieren
# Pasting what was copied under the element the menu is of.
project-paste-under = Darunter einfügen
project-move-to = Verschieben nach
# Opening a dialog with the tree of the project, to choose where the elements go: first in Copy to and Move to.
project-choose-where = Ziel wählen…
# Opening the same dialog, to choose the element this one stands for.
project-choose-element = Ein Element wählen…
# The title of the dialog that chooses where elements are copied to: the name of the one copied, or how many.
project-pick-copy-title = { $count ->
    [one] „{ $name }“ kopieren nach
   *[other] { $count } Elemente kopieren nach
}
project-pick-move-title = { $count ->
    [one] „{ $name }“ verschieben nach
   *[other] { $count } Elemente verschieben nach
}
project-pick-stand-title = Wofür „{ $name }“ steht
# The buttons of the dialog, saying what will be done with the element chosen.
project-pick-copy = Hierher kopieren
project-pick-move = Hierher verschieben
project-pick-stand = Für dieses stehen
project-pick-find = Ein Element nach Namen finden
project-pick-none = Kein Element hat diesen Namen
# Why an element cannot be chosen, when it is hovered.
project-pick-itself = Ein Element kann nicht in sich selbst gehen oder in das, was darunter ist
project-pick-self = Ein Element kann nicht für sich selbst stehen
project-pick-loop = Das Dokument würde sich selbst enthalten
project-tidy-branch = Diesen Zweig aufräumen
project-place-automatically = Automatisch platzieren
project-delete-keeping = Löschen, aber behalten, was darunter ist
project-itself-stays = Das Projekt selbst bleibt
project-itself-stays-detail = Löschen Sie das Projekt auf der Startseite.
# One element was deleted, with the elements that were under it.
project-deleted = { $under ->
    [0] „{ $name }“ wurde gelöscht
    [one] „{ $name }“ wurde gelöscht, mit { $under } Element darunter
   *[other] „{ $name }“ wurde gelöscht, mit { $under } Elementen darunter
}
project-deleted-many = { $count ->
    [one] { $count } Element gelöscht
   *[other] { $count } Elemente gelöscht
}

project-delete-busy-title = Hier schreibt jemand
# $names: those who are at what would be deleted, as a list.
project-delete-busy-message = { $names } { $count ->
    [one] arbeitet
   *[other] arbeiten
} in dem, was gelöscht würde. Was dort gerade geschrieben wird, ginge damit verloren und kann nicht zurückgeholt werden.
project-delete-busy-confirm = Trotzdem löschen

## An element, open for writing, and as it is shown when the pointer rests on it

project-element = Element
project-name-placeholder = Name
project-write-here = Schreiben Sie hier. Tippen Sie @, um zu zitieren.
project-words = { $count ->
    [one] { $count } Wort
   *[other] { $count } Wörter
}
project-read-on = Doppelklick zum Weiterlesen
project-stands-for-map = Steht für „{ $name }“
project-name-not-printed = Der Name wird nicht gedruckt
project-left-out-of-document = Aus dem Dokument weggelassen

## The panels at the side: the references and the pictures

project-this-map = Diese Karte
project-project = Projekt
project-library = Bibliothek
project-nothing-found = Nichts gefunden
project-edit-reference = Quelle bearbeiten…
project-new-reference = Neue Quelle
project-import-file = Datei importieren
project-which-references = Welche Quellen
project-search-references = Quellen durchsuchen
project-library-empty = Ihre Bibliothek ist leer
project-library-empty-hint = Fügen Sie eine Quelle hinzu, oder importieren Sie die, die Sie haben.
project-no-references = Noch keine Quellen
project-no-references-hint = Was Sie beim Schreiben zitieren, steht hier. Zum Zitieren wählen Sie Zitieren über dem Text, oder tippen Sie @.
project-cited-in-heading = Zitiert in
project-not-cited = In diesem Projekt nicht zitiert.
project-references-drag = Ziehen Sie eine Quelle in einen Text, um sie dort zu zitieren, oder auf ein Element, um sie am Ende seines Textes zu zitieren.
# The count is of the references the project cites that the library lacks.
project-references-foreign = { $count ->
    [one] { $count } in diesem Projekt ist nicht in Ihrer Bibliothek.
   *[other] { $count } in diesem Projekt sind nicht in Ihrer Bibliothek.
}
# The store of pictures.
project-store = Fundus
project-open-picture = Öffnen…
project-put-into-text = In den Text setzen
project-add-pictures = Bilder aus Dateien hinzufügen
project-which-pictures = Welche Bilder
project-search-pictures = Bilder durchsuchen
project-a-picture = Ein Bild
project-with-notes = Mit Notizen
project-not-on-computer = Nicht auf diesem Computer
project-nothing-said = Noch nichts dazu gesagt
project-store-empty = Der Fundus ist leer
project-store-empty-hint = Fügen Sie Bilder aus Dateien hinzu, oder lassen Sie sie auf einen Text fallen.
project-no-pictures = Noch keine Bilder
project-no-pictures-map = Die Bilder der Abbildungen dieser Karte stehen hier. Die des Fundus stehen unter Fundus.
project-no-pictures-project = Die Bilder der Abbildungen des Projekts stehen hier. Die des Fundus stehen unter Fundus.
project-pictures-drag = Ziehen Sie ein Bild in einen Text, um dort eine Abbildung daraus zu machen, oder auf ein Element, um es ans Ende seines Textes zu setzen.
# The count is of the pictures that are used and are not in the store of this computer.
project-pictures-absent-map = { $count ->
    [one] { $count } in dieser Karte ist nicht auf diesem Computer.
   *[other] { $count } in dieser Karte sind nicht auf diesem Computer.
}
project-pictures-absent-project = { $count ->
    [one] { $count } in diesem Projekt ist nicht auf diesem Computer.
   *[other] { $count } in diesem Projekt sind nicht auf diesem Computer.
}

## Shared by the diagram and the text

# A count of elements that stands alone, as a label of what is dragged.
project-elements = { $count ->
    [one] { $count } Element
   *[other] { $count } Elemente
}
# One of the others who work on a shared project is at an element.
project-other-here = { $name } ist hier
project-link-placeholder = Wie sie zusammenhängen
project-link-label = Beschriftung der Verbindung

## A copy and its original.
copy-title = Die Kopie und ihr Original
copy-from = Kopiert aus „{ $name }“
copy-original-changed = Das Original hat sich geändert, seit es kopiert wurde oder seit das zuletzt angesehen wurde.
copy-original-same = Das Original ist, wie es war, als es kopiert wurde.
copy-original-unknown = Ob sich das Original geändert hat, seit es kopiert wurde, ist nicht bekannt: die Kopie wurde gemacht, bevor das festgehalten wurde.
copy-original-gone = Das Original ist nicht mehr da.
copy-how-shown = Unten steht durchgestrichen, was nur das Original hat, und markiert, was nur diese Kopie hat.
copy-alike = Ihre Namen und Texte sind gleich. Sie können sich in dem unterscheiden, was keine Wörter sind: Zitationen, Bilder, Auszeichnungen.
copy-only-original = Nur im Original
copy-only-copy = Nur in dieser Kopie
copy-go = Zum Original gehen
copy-seen = Diese Kopie lassen, wie sie ist
copy-take = Namen und Text des Originals übernehmen
copy-changed-mark = Das Original hat sich geändert, seit dies kopiert wurde
copy-compare = Mit dem Original vergleichen…
copy-copied-from = Kopiert aus „{ $name }“
copy-copied-from-changed = Kopiert aus „{ $name }“; das Original hat sich seitdem geändert

## How far the writing of an element has come, as its writer says.
status = Stand
status-idea = Idee
status-draft = Entwurf
status-done = Fertig
status-none = Kein Stand
# Of an element, where its status is shown: "Draft · 340 words".
status-of = { $status } · { $count ->
    [one] { $count } Wort
   *[other] { $count } Wörter
}
status-count-idea = { $count ->
    [one] { $count } Idee
   *[other] { $count } Ideen
}
status-count-draft = { $count ->
    [one] { $count } Entwurf
   *[other] { $count } Entwürfe
}
status-count-done = { $count } fertig
# The words of the drafts and of what is done, in a map.
status-words-written = { $count ->
    [one] { $count } Wort geschrieben
   *[other] { $count } Wörter geschrieben
}
status-progress = Wie weit die Karte ist
