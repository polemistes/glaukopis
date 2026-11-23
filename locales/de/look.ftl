## The look of a document, in one place: the column of the typesetting pane where
## everything is set that decides how the pages look. What is changed there
## is kept as the document's own changes over its layout.

look-title = Aussehen
look-between = Zwischen den Seiten und dem Aussehen des Dokuments
look-whole = Was das Aussehen bestimmt

look-scope = Diese Änderungen gelten für
# The whole document, by the name of its element.
look-scope-document = Das ganze Dokument: { $name }
# Only one element under the document, by its name.
look-scope-only = Nur { $name }

# Under a setting the document sets otherwise than its type.
look-changed-here = In diesem Dokument geändert
# A change made on an element over this one, as a book over its chapters.
look-changed-in = Geändert in „{ $name }“
# Takes a change away.
look-reset = Zurücksetzen

look-search = Eine Einstellung finden: Schrift, Ränder, Seitenzahlen…
look-search-nothing = Keine Einstellung hat diese Wörter.
look-sections = Bereiche des Aussehens

look-section-page = Seite
look-section-type = Schrift
look-section-paragraphs = Absätze
look-section-headings = Überschriften
look-section-notes = Anmerkungen und Zitationen
look-section-figures = Abbildungen und Tabellen
look-section-front = Erste Seite

look-kinds-in-use = In diesem Dokument
look-heading-levels = Ebenen der Überschriften
# The first rows of Look, which most writers reach for; each is also in its part further down.
look-first-type-size = Schriftgröße
look-first-page-size = Seitengröße
look-first-headings-numbered = Überschriften werden nummeriert
look-at-citations = Zitationen
look-at-bibliography = Literaturverzeichnis


## The parts of the document type, a section of Look: the parts the program
## makes itself and the kinds of elements given a place of their own, in one
## list in the order they are printed, and what is required. What is changed
## there is kept as the document's own changes over what it is.

look-parts-add = Hinzufügen
# Under the parts the type suggests: a menu of the other kinds there are.
look-parts-another = Anderer Teil…
# Beside a part, while a document type of the writer's own is edited: takes it out of the parts the type suggests.
look-parts-take-out = Aus „{ $name }“ herausnehmen
# On the second element of a kind a document has one of.
look-contents-kinds-doubled = Nur das erste wird verwendet
look-contents-limit-words = Wörter des Textes, höchstens
look-contents-limit-abstract-words = Wörter der Zusammenfassung, höchstens
look-contents-limit-keywords = Schlüsselwörter, höchstens
# What the limits count, as what the document is says it.
look-contents-requirements-note = Was die Grenzen zählen: { $note }

# The look or the reference style a document has where its type brings none: the one from the settings, by its name.
look-your-default = { $name }, Ihr Standard
# The first choice of a look or a reference style: what the document type brings, by its name, and the type by its name.
look-from-type = { $name }, aus { $type }
# The first choice where an element over this one has chosen: what it chose, and the element.
look-from-with = { $what }, aus { $name }
look-style = Zitierstil
look-style-change = Diesen Zitierstil ändern…


# The groups of the fonts to choose from.
look-fonts-document = In diesem Dokument
look-fonts-project = Anderswo in diesem Projekt
look-fonts-all = Alle Schriften

## The sides, the panes and the bars, stage 2: the typesetting pane, the document pane, Document properties.

# Opens Document properties at what the document is.
look-document-type = Dokumenttyp…
look-hide = Aussehen ausblenden

## Fewer words, stage 3: the parts and the headings of Look in plain words.

look-section-line-numbers = Zeilennummern
look-section-type-parts = Teile
look-at-quotations-warning = Zitate
look-at-paragraph-kinds = Absatzarten
look-at-words-kinds = Arten der Wörter
look-type-requirements = Vorgaben des Dokumenttyps

## Stage 4 of the settings, the zoom and the keys of the kinds: the key of a kind, Ctrl+Alt and a digit, as the document type gives it.
look-kind-key = Taste
look-kind-key-none = Keine
# A digit another kind has: choosing it here leaves that kind without.
look-kind-key-taken = { $keys }, jetzt { $kind }

## One form (the plan of 2026-11-22, stage 2): the top of Look says what the
## document sets otherwise than its type, and the last part is the document type.

# How many changes the document has over its type, at the top of Look.
look-changes-here = { $count ->
    [one] { $count } Änderung in diesem Dokument
   *[other] { $count } Änderungen in diesem Dokument
  }
# Puts what the document sets otherwise into its type, a type of the writer's own, by its name.
look-save-to = In „{ $name }“ speichern
# Makes a document type of the writer's own of the type in use and what the document sets otherwise.
look-save-as = Als Dokumenttyp speichern…
look-save = Speichern
look-type-name = Name des Dokumenttyps
# While a type of the writer's own is edited in Look: every change goes into it.
look-editing = Bearbeitung des Dokumenttyps „{ $name }“
look-done = Fertig
look-section-document-type = Dokumenttyp
# Where the look of the document is taken from: the type, the writer's default, or another document type's look.
look-taken-from = Aussehen übernommen von
# Over the list of what the document sets otherwise than its type.
look-changed-list = In diesem Dokument geändert

# What a document type of the writer's own is beside its look and its parts, under Document type in Look.
look-type-field-name = Name
look-type-description = Beschreibung
look-type-passage-kinds = Absatzarten und Arten der Wörter, die zuerst angeboten werden
look-type-exported-as = Exportiert als
look-type-delete = Diesen Dokumenttyp löschen…
