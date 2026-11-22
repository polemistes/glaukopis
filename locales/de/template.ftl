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
template-group-other = Sonstiges
template-group-journal = Zeitschriften
template-group-publisher = Verlage
template-group-style-guide = Richtlinien

## Where a kind of element stands in the document.


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

## The layout and the reference style it brings.

template-layout = Layout
template-style = Zitierstil
# The layout or style the writer has chosen in the settings.
template-usual = Wie gewohnt, aus den Einstellungen

## The contents: the order of the document.

# An item of the contents that places every element of a kind.
template-contents-kind = Jedes Element der Art „{ $name }“
template-contents-add-part = Ein Teil…
template-contents-add-kind = Eine Art von Element…
template-contents-up = Nach oben
template-contents-down = Nach unten

## The kinds in hand.

template-kinds-in-contents = Im Inhalt

## The requirements.

template-requirement-words = Wörter im Text
template-requirement-abstract-words = Wörter der Zusammenfassung
template-requirement-keywords = Schlüsselwörter
template-requirement-note = Was die Grenzen zählen
# Beside a number of 0, in the place of its unit.
template-no-limit = keine Grenze

## The files the template makes.

template-output-document = Das Dokument
template-output-cover = Der Umschlag

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

## Fewer words, stage 3: the requirement of anonymity, in Look and in the editor of a document type.

template-requirement-anonymity = Anonym

## Stage 4 of the settings, the zoom and the keys of the kinds: the kinds Ctrl+Alt and a digit gives.
template-kind-keys = Tasten

template-described-plain = Allgemeiner Text.
