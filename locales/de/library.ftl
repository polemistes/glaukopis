# The library: the references, the form they are written in, and what
# brings them in, in English. The fields and types of the form are in
# fields.ftl. See locales/README.md.

## The form of a reference.

library-form-often-used = Oft gebraucht
library-form-add-field = Feld hinzufügen
library-form-citation-key = Zitierschlüssel
# In the empty field of the citation key: what it is given if nothing is written.
library-form-key-made = aus Autor und Jahr gebildet
library-form-date-problem = Schreiben Sie ein Datum als 1979, 1979-05 oder 1979-05-12; einen Zeitraum als 1979/1985.
library-form-remove-field = { $field } entfernen

## The people of a reference, with the name of their field: “Author: family name”.

library-names-kept-whole = Institution oder anderer Name, ungeteilt
library-names-prefix-suffix = Namensvorsatz und -zusatz
    .hint = „van“, „de la“ · „Jr.“, „III“
library-names-move-up = Nach oben
library-names-move-down = Nach unten
library-names-more = Mehr zu diesem Namen
library-names-name = Name
library-names-name-of = { $role }: Name
library-names-family = Nachname
library-names-family-of = { $role }: Nachname
library-names-given = Vornamen
library-names-given-of = { $role }: Vornamen
library-names-prefix = Namensvorsatz: van, de la
library-names-prefix-of = { $role }: Namensvorsatz
library-names-suffix = Namenszusatz: Jr., III
library-names-suffix-of = { $role }: Namenszusatz

## Words for references, wherever they are shown.

library-untitled = Ohne Titel
library-no-author = Kein Autor
library-no-title = Kein Titel
library-in-library = In Ihrer Bibliothek

## Why a reference is taken for another: “the same DOI and the same file”.

library-reason-doi = dieselbe DOI
library-reason-isbn = dieselbe ISBN
library-reason-identical = gleich in allem, was ein Werk vom anderen unterscheidet
# How far the title, the author and the year agree: the same, like (titles
# that differ in a few letters or a subtitle, an author in common, years a
# year apart), or none (one of them says nothing of it).
library-reason-alike = { $title ->
    [same] { $author ->
        [same] { $year ->
            [same] derselbe Titel, derselbe Autor und dasselbe Jahr
            [like] derselbe Titel und Autor, ein Jahr auseinander
           *[none] derselbe Titel und Autor, das Jahr nur bei einem
        }
        [like] { $year ->
            [same] derselbe Titel und dasselbe Jahr, ein gemeinsamer Autor
            [like] derselbe Titel, ein gemeinsamer Autor, ein Jahr auseinander
           *[none] derselbe Titel, ein gemeinsamer Autor, das Jahr nur bei einem
        }
       *[none] { $year ->
            [same] derselbe Titel und dasselbe Jahr, der Autor nur bei einem
            [like] derselbe Titel, ein Jahr auseinander, der Autor nur bei einem
           *[none] derselbe Titel, Autor und Jahr nur bei einem
        }
    }
   *[like] { $author ->
        [same] { $year ->
            [same] derselbe Autor und dasselbe Jahr, ein ähnlicher Titel
            [like] derselbe Autor, ein ähnlicher Titel, ein Jahr auseinander
           *[none] derselbe Autor, ein ähnlicher Titel, das Jahr nur bei einem
        }
        [like] { $year ->
            [same] dasselbe Jahr, ein ähnlicher Titel, ein gemeinsamer Autor
            [like] ein ähnlicher Titel, ein gemeinsamer Autor, ein Jahr auseinander
           *[none] ein ähnlicher Titel, ein gemeinsamer Autor, das Jahr nur bei einem
        }
       *[none] { $year ->
            [same] dasselbe Jahr, ein ähnlicher Titel, der Autor nur bei einem
            [like] ein ähnlicher Titel, ein Jahr auseinander, der Autor nur bei einem
           *[none] ein ähnlicher Titel, Autor und Jahr nur bei einem
        }
    }
}
library-reason-file = dieselbe Datei
library-reason-name = ähnlich benannt
library-reason-first-page = die erste Seite stimmt überein
library-reason-folder = in einem ähnlich benannten Ordner
# Several reasons: those before the last, set apart by commas, and the last.
library-reasons = { $others } und { $last }

## The size of a file.

library-size-bytes = { $size } B
library-size-kilobytes = { $size } kB
library-size-megabytes = { $size } MB

## What may be in the library already, while a reference is written.

library-duplicate-certain = Das ist schon in Ihrer Bibliothek.
library-duplicate-probable = Das ist vielleicht schon in Ihrer Bibliothek.
library-duplicate-use = Diese nehmen

## Duplicates in the library.

library-duplicates-title = Dubletten
library-duplicates-count = { $count ->
    [one] { $count } Quelle scheint mehr als einmal in der Bibliothek zu sein
   *[other] { $count } Quellen scheinen mehr als einmal in der Bibliothek zu sein
}
library-duplicates-none = Keine Dubletten
    .text = Keine Quelle scheint mehr als einmal in der Bibliothek zu sein.
library-duplicates-no-more = Keine Dubletten mehr
    .text = Zitationen der zusammengeführten Quellen zitieren jetzt die behaltenen.
library-duplicates-how = Wenn Quellen zu einer gemacht werden, bekommt die, die Sie behalten, von den anderen, was ihr fehlt, und behält ihr Eigenes, wo sie sich unterscheiden. Ihre Dateien und Sammlungen werden zusammengeführt, und was sie zitiert, zitiert die behaltene.
library-duplicates-same = Dieselbe
library-duplicates-probably-same = Wahrscheinlich dieselbe
library-duplicates-keep-which = Die zu behaltende
library-duplicates-kept = Behalten
library-duplicates-different = Sie sind verschieden
library-duplicates-merge = Zu einer machen
library-duplicates-merging = Werden zu einer gemacht…
library-duplicates-failed = Die Bibliothek konnte nicht nach Dubletten durchsucht werden
library-duplicates-merge-failed = Sie konnten nicht zu einer gemacht werden

## Importing references: what a file holds, against what the library has.

library-import = Importieren
library-import-title = Quellen importieren
# What is imported, and from where: a file, Zotero.
library-import-subtitle = { $count ->
    [one] { $count } Quelle aus { $source }
   *[other] { $count } Quellen aus { $source }
}
library-import-review = { $count ->
    [one] { $count } Quelle ist vielleicht schon in Ihrer Bibliothek
   *[other] { $count } Quellen sind vielleicht schon in Ihrer Bibliothek
}
library-import-new = { $count ->
    [one] { $count } neue Quelle
   *[other] { $count } neue Quellen
}
library-import-complete = { $count ->
    [one] { $count } Quelle, die schon in Ihrer Bibliothek ist, gewinnt Angaben hinzu
   *[other] { $count } Quellen, die schon in Ihrer Bibliothek sind, gewinnen Angaben hinzu
}
library-import-known = { $count ->
    [one] { $count } Quelle schon in Ihrer Bibliothek
   *[other] { $count } Quellen schon in Ihrer Bibliothek
}
library-import-repeated = { $count ->
    [one] { $count } Quelle kommt im Import mehrfach vor
   *[other] { $count } Quellen kommen im Import mehrfach vor
}
# The fields a reference of the library would be given: “Would gain: Publisher, Place”.
library-import-would-gain = Käme hinzu: { $fields }
library-import-gains-file = Datei
library-import-gains-zotero = Ihr Schlüssel in Zotero
library-import-what-to-do = Was geschehen soll
library-import-merge = Dasselbe Werk: meine ergänzen
library-import-skip = Dasselbe Werk: meine lassen, wie sie ist
library-import-add = Ein anderes Werk: hinzufügen
# One answer for every candidate in the same case: “For all 16 that are the same: …”.
library-import-all-certain = Für alle { $count }, die dieselben sind:
library-import-all-probable = Für alle { $count }, die wahrscheinlich dieselben sind:
library-import-all-merge = Meine ergänzen
library-import-all-skip = Meine lassen, wie sie sind
library-import-all-add = Trotzdem alle hinzufügen
library-import-more = …und { $count } weitere.
library-import-unread = { $count ->
    [one] { $count } Teil der Datei konnte nicht gelesen werden
   *[other] { $count } Teile der Datei konnten nicht gelesen werden
}
library-import-importing = Wird importiert…
# How many are to be added, completed and left out: “3 to add, 1 to complete, 2 left out”.
library-import-counts = { $add } hinzuzufügen{ $merge ->
        [0] {""}
       *[other] , { $merge } zu ergänzen
    }{ $skip ->
        [0] {""}
       *[other] , { $skip } ausgelassen
    }
library-import-failed = Der Import ist fehlgeschlagen.

## The library: the list of references, and what can be done with them.

library-references = Quellen
library-unread = Die Bibliothek konnte nicht gelesen werden
library-all-references = Alle Quellen
library-count = { $count ->
    [one] { $count } Quelle
   *[other] { $count } Quellen
}
library-selected = { $count ->
    [one] { $count } Quelle ausgewählt
   *[other] { $count } Quellen ausgewählt
}
library-selected-of = { $count ->
    [one] { $selected } von { $count } Quelle ausgewählt
   *[other] { $selected } von { $count } Quellen ausgewählt
}
library-new-reference = Neue Quelle
library-search = Bibliothek durchsuchen
library-search-in = In { $name } suchen
library-search-clear = Suche löschen
library-sort = Sortieren
library-sort-author = Autor
library-sort-year = Jahr
library-sort-title = Titel
library-sort-added = Hinzugefügt am
library-sort-modified = Geändert am
library-sort-descending = Absteigend

## The filters, beside the search: what kind of publication, who published it, and when.

library-filters = Filter
library-filters-on = { $count ->
    [one] Filter: { $count } aktiv
   *[other] Filter: { $count } aktiv
}
library-filter-kind = Art
library-filter-publisher = Verlag
library-filter-publisher-hint = Teil des Namens
library-filter-any-publisher = Jeder Verlag
library-filter-year = Jahr
library-filter-from = Von
library-filter-to = Bis
library-filter-clear = Filter löschen
library-filter-nothing-here = Hier gibt es nichts zu filtern.
# When the filters let nothing through.
library-nothing-passes = Keine Quelle in der Ansicht kommt durch die Filter.
library-import-export = Import und Export
library-import-file = Datei importieren…
    .hint = BibLaTeX oder BibTeX
library-paste = Quellen einfügen…
library-add-pdfs = PDF-Dateien hinzufügen…
    .hint = Jede wird nachgeschlagen und aufbewahrt
library-import-zotero = Aus Zotero importieren…
library-find-duplicates = Dubletten finden…
library-map-library = Eine Karte der Bibliothek…
library-map-collection = Eine Karte von „{ $name }“…
library-export-library = Bibliothek exportieren…
library-export-collection = „{ $name }“ exportieren…
library-export-one = Exportieren…
library-export-many = { $count ->
    [one] { $count } Quelle exportieren…
   *[other] { $count } Quellen exportieren…
}
library-export-title = Quellen exportieren
# What a file of exported references is called, before it is given a name.
library-export-file-references = quellen
library-export-file-library = bibliothek
library-exported = { $count ->
    [one] { $count } Quelle exportiert
   *[other] { $count } Quellen exportiert
}
library-export-failed = Der Export ist fehlgeschlagen
library-empty = Ihre Bibliothek ist leer
    .text = Quellen, die Sie hier hinzufügen, stehen in allen Ihren Projekten bereit. Beginnen Sie mit einer, oder importieren Sie die, die Sie schon haben.
library-collection-empty = Noch nichts in dieser Sammlung
    .text = Ziehen Sie Quellen aus der Bibliothek hierher, oder legen Sie eine neue an.
library-nothing-found = Nichts gefunden
    .text = Keine Quelle enthält alle diese Wörter.
library-open-file = Datei öffnen
library-file-open-failed = Die Datei konnte nicht geöffnet werden
library-add-to-collection = Zu Sammlung hinzufügen
library-remove-from = Aus „{ $name }“ entfernen
library-copy-key = Zitierschlüssel kopieren
library-copied-key = „{ $key }“ kopiert
library-copy-biblatex = Als BibLaTeX kopieren
library-copied = Kopiert
library-delete-one-title = „{ $name }“ löschen?
library-delete-many-title = { $count ->
    [one] { $count } Quelle löschen?
   *[other] { $count } Quellen löschen?
}
# $projects is the number of projects that cite what is deleted, which keep copies of their own.
library-delete-one-message = Das entfernt die Quelle aus Ihrer Bibliothek und aus jeder Sammlung.{ $projects ->
        [0] {""}
        [one] {" "}Sie ist in einem Projekt zitiert, das eine Kopie davon behält.
       *[other] {" "}Sie ist in { $projects } Projekten zitiert, die eine Kopie davon behalten.
    }
library-delete-many-message = Das entfernt sie aus Ihrer Bibliothek und aus jeder Sammlung.{ $projects ->
        [0] {""}
        [one] {" "}Ein Projekt, das einige davon zitiert, behält eine Kopie von diesen.
       *[other] {" "}{ $projects } Projekte, die einige davon zitieren, behalten eine Kopie von diesen.
    }
# Said after the message above, where what is deleted has files.
library-delete-files = { $files ->
        [one] Eine Datei gehört zu dem, was gelöscht wird. Sie bleibt unter den Dateien der Bibliothek, wenn Sie sie nicht auch löschen.
       *[other] { $files } Dateien gehören zu dem, was gelöscht wird. Sie bleiben unter den Dateien der Bibliothek, wenn Sie sie nicht auch löschen.
    } Eine Datei, die eine andere Quelle hat, bleibt in jedem Fall.
library-delete-keep-files = Löschen, die Dateien behalten
library-delete-failed = Die Quellen konnten nicht gelöscht werden
library-not-done = Das konnte nicht getan werden

## Collections.

library-collections = Sammlungen
# The projects that cite a work, in its pane.
library-cited-in = Zitiert in
library-not-cited = In keinem Projekt zitiert.
library-cited-reading = Die Projekte werden gelesen…
library-collections-hint = Sammlungen fassen Quellen zu einem Thema oder einer Arbeit zusammen. Eine Quelle kann in beliebig vielen sein.
library-collection-new = Neue Sammlung
library-collection-new-inside = Neue Sammlung darin
library-collection-new-under = Neue Sammlung in „{ $name }“
library-collection-move-to = Verschieben nach
library-collection-name = Name der Sammlung
library-collection-name-failed = Die Sammlung konnte nicht benannt werden
library-collection-expand = Ausklappen
library-collection-collapse = Einklappen
library-collection-to-top = Auf die oberste Ebene verschieben
library-collection-move-failed = Die Sammlung konnte nicht verschoben werden
library-collection-added = { $count ->
    [one] { $count } Quelle zu „{ $name }“ hinzugefügt
   *[other] { $count } Quellen zu „{ $name }“ hinzugefügt
}
library-collection-already = Schon in „{ $name }“
library-collection-delete = Sammlung löschen
library-collection-delete-title = Die Sammlung „{ $name }“ löschen?
# The number is that of the collections inside the one that is deleted.
library-collection-delete-message = { $inside ->
    [0] Die Quellen bleiben in Ihrer Bibliothek.
   *[other] Die Sammlungen darin werden auch gelöscht. Die Quellen bleiben in Ihrer Bibliothek.
}
library-collection-delete-failed = Die Sammlung konnte nicht gelöscht werden
library-collection-count = { $count ->
    [one] { $count } Sammlung
   *[other] { $count } Sammlungen
}

## A map of the library, or of a collection: a tree of elements at the top of a project, new or chosen.

library-map-title-library = Eine Karte der Bibliothek
library-map-title-collection = Eine Karte einer Sammlung
# The name a project made of the whole library is given.
library-map-library-name = Die Bibliothek
library-map-name = Name
library-map-name-hint = Der Name des obersten Elements der Karte und eines neuen Projekts, das dafür angelegt wird.
library-map-into = In das Projekt
library-map-new-project = Ein neues Projekt, nach ihr benannt
library-map-what-library = Die Sammlungen werden Elemente, verschachtelt, wie sie sind, und jede Quelle ein Element unter ihrer Sammlung, dessen Text eine Zitation von ihr ist. Quellen in keiner Sammlung stehen auf der obersten Ebene.
library-map-what-collection = Die Sammlungen darin werden Elemente, verschachtelt, wie sie sind, und jede Quelle ein Element unter ihrer Sammlung, dessen Text eine Zitation von ihr ist.
library-map-nothing = Es gibt keine Quellen, die auf die Karte könnten.
library-map-make = Karte anlegen
library-map-making = Die Karte wird angelegt…
library-map-failed = Die Karte konnte nicht angelegt werden.

## Bringing references in, from anywhere in the application.

library-files = { $count ->
    [one] { $count } Datei
   *[other] { $count } Dateien
}
library-open-failed = Die Quelle konnte nicht geöffnet werden
library-known = { $count ->
    [one] Sie ist schon in Ihrer Bibliothek
   *[other] Sie sind schon in Ihrer Bibliothek
}
library-nothing-to-import = Nichts zu importieren
library-none-found = Es wurden keine Quellen gefunden.
library-import-kinds = Quellen werden aus .bib-Dateien gelesen und aus PDF-Dateien gemacht.
library-filter-bib = BibLaTeX und BibTeX
library-filter-all = Alle Dateien
library-files-read-failed = { $count ->
    [one] Die Datei konnte nicht gelesen werden
   *[other] Die Dateien konnten nicht gelesen werden
}
library-text-read-failed = Der Text konnte nicht gelesen werden
library-add-pdfs-title = PDF-Dateien hinzufügen
library-pdfs-working = { $count ->
    [one] Es wird festgestellt, was die Datei ist…
   *[other] Es wird festgestellt, was die { $count } Dateien sind…
}
# While PDF files are found out about, one after another.
library-pdfs-progress = { $done } von { $count }: { $name }
library-stop = Anhalten
# What came of an import, as a list: “3 references added, 1 completed, 2 files stored”.
library-imported-added = { $count ->
    [one] { $count } Quelle hinzugefügt
   *[other] { $count } Quellen hinzugefügt
}
library-imported-completed = { $count } ergänzt
library-imported-skipped = { $count } schon in der Bibliothek
library-imported-files = { $count ->
    [one] { $count } Datei abgelegt
   *[other] { $count } Dateien abgelegt
}
library-imported-nothing = Nichts wurde geändert
library-paste-title = Quellen einfügen
library-paste-subtitle = BibLaTeX oder BibTeX, so viele Einträge Sie wollen
library-paste-continue = Weiter
library-source-label = BibLaTeX-Quelltext

## Importing from Zotero.

library-zotero-title = Aus Zotero importieren
# The file is the database of Zotero, zotero.sqlite, shown as code.
library-zotero-not-found = Auf diesem Computer wurde kein Zotero gefunden, dort, wo es seine Daten gewöhnlich hält. Wenn es sie anderswo hält, zeigen Sie, wo: der Ordner, der { $file } enthält.
library-zotero-lead = Was importiert wird, wird mit seinen Dateien in Ihre Bibliothek kopiert. Zotero wird nur gelesen, und nichts darin wird geändert; es darf währenddessen laufen.
library-zotero-choose = Der Datenordner von Zotero
library-zotero-none-there = Dort ist kein Zotero.
library-zotero-unread = Zotero konnte nicht gelesen werden.
library-zotero-library = Bibliothek
# A library of Zotero, with the number of its references.
library-zotero-library-option = { $name } ({ $count })
library-zotero-my-library = Meine Bibliothek
library-zotero-what = Was importiert wird
library-zotero-everything = Alles
library-zotero-with-files = Mit den angehängten Dateien
library-zotero-with-notes = Mit den Notizen, als Annotationen
library-zotero-elsewhere = Ein anderer Ort…
library-zotero-show-where = Zeigen, wo…
library-zotero-reading = Wird gelesen…
library-zotero-read = { $count ->
    [0] Lesen
    [one] { $count } Quelle lesen
   *[other] { $count } Quellen lesen
}

## Writing a reference.

library-dialog-edit = Quelle bearbeiten
library-dialog-add = Quelle hinzufügen
library-dialog-back = Zurück zum Formular
library-dialog-open-failed = Die Quelle konnte nicht geöffnet werden.
library-dialog-save-failed = Die Quelle konnte nicht gespeichert werden.
# The entry as BibLaTeX, as against the form.
library-source = Quelltext
library-source-unread = Der Quelltext konnte nicht gelesen werden.

## A reference, beside the list.

library-pane-label = Quelle
library-pane-more = Mehr
library-pane-saved = Gespeichert
library-pane-editing = Wird bearbeitet…
library-pane-not-saved = Nicht gespeichert
library-pane-unread = Die Quelle konnte nicht gelesen werden.
library-pane-save-failed = Die Änderungen konnten nicht gespeichert werden.
library-pane-note-placeholder = Was Sie davon halten. Für Sie selbst: es ist nicht Teil dessen, was zitiert wird.
library-pane-files = Dateien
library-pane-attach = Anhängen
library-pane-attach-title = Dateien anhängen
library-pane-attach-failed = Die Datei konnte nicht angehängt werden
library-pane-attach-many-title = { $count } Dateien an „{ $title }“ anhängen?
library-pane-attach-many-message = Jede wird eine Datei dieser Quelle. Um viele Dateien jeweils ihrer eigenen Quelle zuzuordnen, gehen Sie sie bei den Dateien der Bibliothek durch.
library-pane-attach-many = { $count } Dateien anhängen
library-pane-add-files = Dateien der Bibliothek hinzufügen…
library-pane-add-files-title = Dateien der Bibliothek zu „{ $title }“ hinzufügen
library-pane-unassign-all = Alle { $count } von dieser Quelle entfernen
library-pane-unassign-all-title = Alle { $count } Dateien von „{ $title }“ entfernen?
library-pane-unassign-all-message = Die Dateien bleiben unter den Dateien der Bibliothek, wo sie gefunden und anderen Quellen zugeordnet werden können. Gelöscht werden sie nur dort.
library-pane-unassign-all-confirm = { $count } Dateien entfernen
# Of a file that is attached, and not where it should be.
library-pane-missing = fehlt
library-pane-reveal = Im Dateimanager zeigen
library-pane-reveal-failed = Der Ordner konnte nicht geöffnet werden
library-pane-no-files = Keine Dateien. Hängen Sie ein PDF an, oder lassen Sie eines hier fallen.
library-pane-detach-failed = Die Datei konnte nicht entfernt werden
library-pane-unassign = Von dieser Quelle entfernen
library-pane-unassign-title = „{ $name }“ von dieser Quelle entfernen?
library-pane-unassign-message = Die Datei bleibt unter den Dateien der Bibliothek, wo sie gefunden und einer anderen Quelle zugeordnet werden kann. Gelöscht wird sie nur dort.
library-pane-leave-collection = Aus { $name } entfernen
library-pane-duplicate = Duplizieren
    .hint = Eine neue Quelle, die mit diesen Angaben beginnt
library-pane-edit-source = Quelltext bearbeiten…
library-pane-source-subtitle = Der Eintrag als BibLaTeX. Das meiste geht im Formular leichter.
library-pane-source-failed = Der Quelltext konnte nicht gezeigt werden
library-pane-added = Hinzugefügt am { $date }
library-pane-added-changed = Hinzugefügt am { $added } · geändert am { $changed }

## Looking up a reference.

library-lookup-placeholder = Nachschlagen: eine DOI, eine ISBN oder Wörter aus Titel und Autor
library-lookup-label = Eine Quelle nachschlagen
library-lookup-failed = Es konnte nichts nachgeschlagen werden.
# Where the reference came from: a service such as Crossref.
library-lookup-filled = Ausgefüllt nach { $source }.
library-lookup-others = { $count ->
    [one] { $count } weiterer Datensatz
   *[other] { $count } weitere Datensätze
}
library-lookup-scope = Wonach gesucht wird
library-lookup-any = Alles
library-lookup-books = Bücher
library-lookup-articles = Artikel
library-lookup-none = Nichts gefunden. Weniger Wörter finden vielleicht mehr: der Nachname des Autors und ein, zwei Wörter des Titels.
# What was asked for: a DOI, an ISBN, a number of arXiv or of PubMed.
library-lookup-unknown = Von dieser { $kind ->
        [doi] DOI
        [isbn] ISBN
        [arxiv] arXiv-Nummer
       *[pmid] PubMed-Nummer
    } ist dort, wo gefragt wurde, nichts bekannt. Die Quelle kann unten von Hand eingetragen werden.

## What the writer writes about a work.

library-notes = Notizen
library-notes-yours = Ihre Notizen
library-notes-on-work = Ihre Notizen zu diesem Werk
library-notes-read = Ihre Notizen lesen
library-notes-write = Eine Notiz schreiben
library-notes-write-on-work = Eine Notiz zu diesem Werk schreiben
library-notes-not-in-library = Eine Quelle, die nicht in Ihrer Bibliothek ist
library-notes-this-project = In diesem Projekt
library-notes-all-projects = In allen Projekten
library-notes-project-placeholder = Was Sie davon halten, für diese Arbeit
library-notes-all-placeholder = Was Sie davon halten, wo immer Sie es zitieren
library-notes-keep-for-all = Für alle Projekte behalten
library-notes-write-for-all = Für alle Projekte schreiben
library-notes-carried = Die Quelle kam mit dem Projekt und ist nicht in Ihrer Bibliothek. Was hier geschrieben wird, ist bei allen, die das Projekt haben.
library-notes-kept = Bei der Quelle in Ihrer Bibliothek aufbewahrt. Es geht mit einem Projekt, das das Werk zitiert.
library-notes-unread = Ihre Notizen konnten nicht gelesen werden
library-notes-unsaved = Ihre Notiz konnte nicht gespeichert werden

## The switch at the head of the library.

library-switch = Quellen oder Dateien
library-switch-references = Quellen
library-switch-files = Dateien

## The columns of the library, which can be dragged wider or narrower.

library-resize-side = Ziehen, um die Sammlungen oder Ordner breiter oder schmaler zu machen
library-resize-detail = Ziehen, um den Bereich rechts breiter oder schmaler zu machen
