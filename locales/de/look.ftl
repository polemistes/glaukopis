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
# The line under it, which goes down to the layout at the foot of Look; the count of changes follows it.
look-layout-line = Layout: { $layout }

# After the name of the layout at the top of the panel: "Manuscript · 2 changes".
look-changes = { $count ->
    [one] { $count } Änderung
   *[other] { $count } Änderungen
  }
# Under a setting the document sets otherwise than its layout.
look-changed-here = Hier geändert
# A change made on an element over this one, as a book over its chapters.
look-changed-in = Geändert in „{ $name }“
look-take-again = wieder wie in { $layout }

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

look-keep = Diese Änderungen als eigenes Layout behalten…
look-keep-save = Behalten
# Where the layout is one of the writer's own.
look-put-into = Diese Änderungen in „{ $name }“ übernehmen
look-delete-layout = Dieses eigene Layout löschen…

## The parts of the document type, a section of Look: the parts the program
## makes itself and the kinds of elements given a place of their own, in one
## list in the order they are printed, and what is required. What is changed
## there is kept as the document's own changes over what it is.

look-contents-kinds-missing = Noch keines
look-contents-kinds-make = Eines anlegen
# On the second element of a kind a document has one of.
look-contents-kinds-doubled = Nur das erste wird verwendet
look-contents-limit-words = Wörter des Textes, höchstens
look-contents-limit-abstract-words = Wörter der Zusammenfassung, höchstens
look-contents-limit-keywords = Schlüsselwörter, höchstens
# What the limits count, as what the document is says it.
look-contents-requirements-note = Was die Grenzen zählen: { $note }

# A layout, a style or a template that is neither chosen nor inherited: the one from the settings, named.
look-usual = Wie gewohnt ({ $name })
# The first choice of a layout or a style: what the template brings, named.
look-as-template = Wie die Vorlage es vorsieht ({ $name })
# The first choice where an element over this one has chosen: the element, and what it chose.
look-from-with = Von { $name } ({ $what })
look-style = Zitierstil
look-style-change = Diesen Zitierstil ändern…

# The switch of the title page, first in the part of the front page.
look-front-title-page = Eine Titelseite

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
look-section-type-parts = Teile des Dokumenttyps
look-section-the-layout = Layout
look-choose-layout = Layout wählen
look-layout-modifications = Änderungen am Layout
look-at-quotations-warning = Zitate
look-at-paragraph-kinds = Absatzarten
look-at-words-kinds = Arten der Wörter
look-type-requirements = Vorgaben des Dokumenttyps

## Stage 4 of the settings, the zoom and the keys of the kinds: the key of a kind, Ctrl+Alt and a digit, as the document type gives it.
look-kind-key = Taste
look-kind-key-none = Keine
# A digit another kind has: choosing it here leaves that kind without.
look-kind-key-taken = { $keys }, jetzt { $kind }
