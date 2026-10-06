# Documents that are brought in, each to become a map (ADR 0012), in
# English. See locales/README.md.

documents-choose = Ein Dokument zum Einlesen
documents-filter = Dokumente
documents-filter-all = Alle Dateien
documents-title-map = Eine Karte aus einem Dokument
documents-title-project = Ein Projekt aus einem Dokument
documents-reading = { $file } wird gelesen…
documents-reading-hint = Ein langes Dokument braucht einen Moment.
documents-no-pandoc = Dokumente dieser Art liest Pandoc, das nicht installiert ist oder nicht gefunden wurde. Wo es ist, kann in den Einstellungen angegeben werden.
documents-unread = Die Datei konnte nicht gelesen werden.
documents-title = Titel
documents-title-hint-map = Der Name der Karte und des Elements in ihrer Mitte.
documents-title-hint-project = Der Name des Projekts, seiner Karte und des Elements in der Mitte der Karte.
# What a project made of a document is called when the document has no title.
documents-untitled = Ohne Titel

## What the document holds, under the number of each.

documents-parts = { $count ->
    [one] Teil
   *[other] Teile
}
documents-words = { $count ->
    [one] Wort
   *[other] Wörter
}
documents-notes = { $count ->
    [one] Anmerkung
   *[other] Anmerkungen
}
documents-figures = { $count ->
    [one] Abbildung
   *[other] Abbildungen
}
documents-tables = { $count ->
    [one] Tabelle
   *[other] Tabellen
}
documents-equations = { $count ->
    [one] Gleichung
   *[other] Gleichungen
}

## How often the document cites works of the library, and works the library does not have.

documents-cited-in-library = Werke Ihrer Bibliothek werden { $cited ->
        [1] einmal
        [2] zweimal
       *[other] { $cited }-mal
    } zitiert.
documents-cited-not-in-library = Werke, die nicht in Ihrer Bibliothek sind, werden { $missing ->
        [1] einmal
        [2] zweimal
       *[other] { $missing }-mal
    } zitiert.
documents-cited-both = Werke Ihrer Bibliothek werden { $cited ->
        [1] einmal
        [2] zweimal
       *[other] { $cited }-mal
    } zitiert, Werke, die nicht darin sind, { $missing ->
        [1] einmal
        [2] zweimal
       *[other] { $missing }-mal
    }.

## The citations that were found in it (ADR 0015).

documents-found = { $count ->
    [one] Eine Zitation wurde gefunden.
   *[other] { $count } Zitationen wurden gefunden.
}
documents-found-made = { $count ->
    [one] Eine Zitation wurde gefunden, erzeugt von einem Literaturverwaltungsprogramm.
   *[other] { $count } Zitationen wurden gefunden, alle erzeugt von einem Literaturverwaltungsprogramm.
}
documents-found-some-made = { $count } Zitationen wurden gefunden, { $made } davon erzeugt von einem Literaturverwaltungsprogramm.
documents-at-once = Aus denen, die Zotero erzeugt hat und deren Werke Ihre Bibliothek hat, sofort Zitationen machen
# Under the choice: what becomes of a note that holds one of them.
documents-at-once-notes = Eine Anmerkung, die nichts als eine Zitation ist, wird zu einer Zitation in der Zeile, die der Zitierstil in eine Anmerkung oder in die Zeile setzt; eine Anmerkung, die mehr sagt, behält ihre Zitation. Was Sie in der Seitenleiste der gefundenen Zitationen für Anmerkungen gewählt haben, für alle folgenden, gilt auch hier.
documents-go-through-map = Die Zitationen durchgehen, sobald die Karte angelegt ist
documents-go-through-project = Die Zitationen durchgehen, sobald das Projekt angelegt ist

## Making the map.

# Over what the one who brings the document in should know of it.
documents-to-know = Zu wissen
documents-making = Die Karte wird angelegt…
documents-make-map = Karte anlegen
documents-make-project = Projekt anlegen
documents-map-failed = Die Karte konnte nicht angelegt werden.
