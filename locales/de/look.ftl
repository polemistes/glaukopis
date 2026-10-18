## The look of a document, in one place: the panel beside the preview where
## everything is set that decides how the pages look. What is changed there
## is kept as the document's own changes over its layout.

look-title = Aussehen
look-open = Das Aussehen dieses Dokuments: Vorlage, Layout und Zitationen
look-between = Zwischen dem Text und dem Aussehen des Dokuments
look-whole = Was das Aussehen bestimmt

look-template = Vorlage
look-template-hint = Woraus das Dokument besteht: seine Teile und was sie verlangen
look-layout-hint = Wie die Seite aussieht: Seite, Schrift, Abstände, Überschriften, das Aussehen der Arten
look-citations-hint = Wie Zitationen und das Literaturverzeichnis geschrieben werden

# After the name of the layout at the top of the panel: "Manuscript · 2 changes".
look-changes = { $count ->
    [one] { $count } Änderung
   *[other] { $count } Änderungen
  }
look-no-changes = keine Änderungen
# Under a setting the document sets otherwise than its layout.
look-changed-here = Hier geändert
# A change made on an element over this one, as a book over its chapters.
look-changed-in = Geändert in „{ $name }“
look-take-again = wieder wie in { $layout }

look-open-preview = Öffnen Sie die Vorschau, um die Änderungen zu sehen, während Sie sie machen.
look-open-preview-button = Vorschau öffnen
look-search = Eine Einstellung finden: Schrift, Ränder, Seitenzahlen…
look-search-nothing = Keine Einstellung hat diese Wörter.
look-sections = Bereiche des Aussehens

look-section-type = Schrift
look-section-page = Seite
look-section-paragraphs = Absätze
look-section-headings = Überschriften
look-section-kinds = Arten
look-section-quotations = Zitate
look-section-numbers = Nummern
look-section-notes = Anmerkungen
look-section-bibliography = Literaturverzeichnis
look-section-figures = Abbildungen und Tabellen
look-section-title = Titel und Zusammenfassung
look-section-about = Über das Layout

look-kinds-in-use = In diesem Dokument
look-heading-levels = Ebenen der Überschriften
look-quotations-hint = Zitate, die durch ihre Länge vom Text abgesetzt werden, wo sie nicht selbst als Zitate gekennzeichnet sind. Die Art „Zitat“ wird im Bereich „Arten“ eingestellt.

look-keep = Diese Änderungen als eigenes Layout behalten…
look-keep-save = Behalten
# Where the layout is one of the writer's own.
look-put-into = Diese Änderungen in „{ $name }“ übernehmen
look-delete-layout = Dieses eigene Layout löschen…
look-bundled = Die Layouts, die Glaukopis mitbringt, bleiben, wie sie sind. Was Sie hier ändern, wird beim Dokument aufbewahrt oder, wenn Sie es wählen, als eigenes Layout.
