# Templates: what a document of a kind consists of (ADR 0038). Their groups,
# the parts a document is made of, the kinds of file, and the editor of a
# template.

## The groups of templates, as the chooser lists them.

template-group-own = Eigene
template-group-plain = Für den Anfang
template-group-article = Artikel und Aufsätze
template-group-book = Bücher und Abschlussarbeiten
template-group-fiction = Belletristik
template-group-stage = Bühne und Film
template-group-poetry = Lyrik
template-group-other = Andere Textsorten
template-group-journal = Zeitschriften
template-group-publisher = Verlage
template-group-style-guide = Richtlinien

## Where a kind of element stands in the document.

template-part-group-front = Vorspann
template-part-group-back = Nachspann
template-part-group-cover = Umschlag

## The parts of a document the application makes itself.

template-generated-half-title = Schmutztitel
template-generated-title-page = Titelseite
template-generated-keywords = Schlüsselwörter
template-generated-contents = Inhaltsverzeichnis
template-generated-list-of-figures = Abbildungsverzeichnis
template-generated-list-of-tables = Tabellenverzeichnis
template-generated-body = Der Text
template-generated-notes = Anmerkungen
template-generated-bibliography = Literaturverzeichnis

## The kinds of file a template makes.

template-target-pdf = PDF
template-target-pdf-latex = PDF, mit LaTeX gesetzt
template-target-docx = Word
template-target-odt = LibreOffice Writer
template-target-latex = LaTeX
template-target-typst = Typst
template-target-markdown = Markdown
template-target-html = Webseite
template-target-epub = E-Book

## The template editor.

template-editor = Vorlage
template-name = Name der Vorlage
# The name a template of one's own is first given, made from that of the template it is made from.
template-name-changed = { $name }, geändert
# A template of the writer's own made from another, before it is named: by the other's name.
template-name-own = { $name }, eigene
template-sections = Bereiche der Vorlage
template-bundled = Die Vorlagen, die Glaukopis mitbringt, bleiben, wie sie sind. Ihre Änderungen werden als eigene Vorlage gespeichert.
template-delete = Diese Vorlage löschen
template-save-own = Als eigene speichern
template-saved = „{ $name }“ ist unter Ihren eigenen Vorlagen gespeichert
template-read-failed = Die Vorlage konnte nicht gelesen werden.
template-save-failed = Die Vorlage konnte nicht gespeichert werden.
template-delete-failed = Die Vorlage konnte nicht gelöscht werden.
template-keep-failed = Die Vorlage konnte nicht im Projekt aufbewahrt werden. Auf einem anderen Computer und in einer Datei des Projekts hat das Dokument stattdessen die gewohnte Vorlage.
template-delete-title = Die Vorlage „{ $name }“ löschen?
template-delete-message = Elemente, die sie verwenden, verwenden stattdessen die Vorlage, aus der sie gemacht wurde.
template-delete-confirm = Vorlage löschen
template-leave-title = Ohne Speichern verlassen?
template-leave-message = Die Änderungen, die Sie an der Vorlage gemacht haben, gehen verloren.
template-leave-confirm = Verlassen
template-leave-cancel = Weiter bearbeiten

## The parts of the editor, as they are chosen at the left.

template-section-about = Über diese Vorlage
template-section-looks = Layout und Zitierstil
template-section-contents = Inhalt
template-section-kinds = Arten von Elementen
template-section-passage-kinds = Absatzarten und Arten von Wörtern
template-section-requirements = Vorgaben
template-section-outputs = Dateien

## About the template.

template-description = Beschreibung
template-group = Gruppe
template-based-on = Beruht auf
template-based-on-none = Nichts Bestimmtes
template-source-changed = Sie haben diese Vorlage geändert; die Quelle beschreibt, woraus sie gemacht wurde.
template-source-none = Diese Vorlage folgt keinen Vorgaben eines bestimmten Verlags.

## The layout and the reference style it brings.

template-layout = Layout
template-layout-hint = Wie die Seite aussieht, für jedes Dokument dieser Vorlage
template-style = Zitierstil
template-style-hint = Wie Zitationen und das Literaturverzeichnis geschrieben werden; leer gilt der des Layouts
# The layout or style the writer has chosen in the settings.
template-usual = Wie gewohnt, aus den Einstellungen

## The contents: the order of the document.

template-contents-hint = Die Folge des Dokuments: die Teile, die die Anwendung selbst erzeugt, und jedes Element einer Art, in der Folge des Baums. Eine Art, die vor dem Text steht, gehört zum Vorspann, eine danach zum Nachspann.
# An item of the contents that places every element of a kind.
template-contents-kind = Jedes Element der Art „{ $name }“
template-contents-add-part = Ein Teil…
template-contents-add-kind = Eine Art von Element…
template-contents-up = Nach oben
template-contents-down = Nach unten

## The kinds in hand.

template-kinds-hint = Die Arten von Elementen, die die Vorlage zur Hand gibt: sie werden im Menü der Arten angeboten. Die im Inhalt sind zur Hand, ob sie hier gewählt sind oder nicht.
template-kinds-in-contents = Im Inhalt
template-passage-kinds-hint = Die Absatzarten und Arten von Wörtern, die die Vorlage zur Hand gibt: sie werden in den Schreibwerkzeugen zuerst angeboten.

## The requirements.

template-requirements-hint = Was ein Dokument dieser Vorlage erfüllen soll. Die Checkliste und die Vorschau zählen daran; gekürzt wird nichts.
template-requirement-words = Wörter im Text
template-requirement-abstract-words = Wörter der Zusammenfassung
template-requirement-keywords = Schlüsselwörter
template-requirement-note = Was die Grenzen zählen
template-requirement-note-placeholder = Anmerkungen eingeschlossen, Literaturverzeichnis nicht
# Beside a number of 0, in the place of its unit.
template-no-limit = keine Grenze

## The files the template makes.

template-outputs-hint = Die Dateiarten, als die das Dokument beim Export angeboten wird.
template-output-document = Das Dokument
template-output-cover = Der Umschlag
template-output-cover-note = Einen eigenen Umschlag erzeugt eine spätere Version; was die Vorlage darüber sagt, bleibt erhalten, wie es ist.

## The names of the kinds of text that come with Glaukopis, as the chooser of what you are writing
## and the button over the preview give them; journals, publishers and style guides keep their own.

template-called-plain = Einfaches Dokument
template-called-paper = Aufsatz
template-called-article = Zeitschriftenartikel
template-called-report = Bericht
template-called-book = Wissenschaftliches Buch
template-called-thesis = Abschlussarbeit
template-called-novel = Roman
template-called-novel-manuscript = Romanmanuskript
template-called-short-story = Kurzgeschichte
template-called-story-collection = Erzählband
template-called-poems = Gedichte
template-called-play = Theaterstück
template-called-screenplay = Drehbuch
template-called-letter = Brief
template-called-blog-post = Blogbeitrag
template-called-news-article = Zeitungsartikel
