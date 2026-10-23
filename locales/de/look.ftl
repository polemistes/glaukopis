## The look of a document, in one place: the panel beside the preview where
## everything is set that decides how the pages look. What is changed there
## is kept as the document's own changes over its layout.

look-title = Aussehen
look-whole = Was das Aussehen bestimmt

# Under the button at the top of Look that names what the document is.
look-what-hint = Was Sie schreiben, bestimmt die Teile, die Seiten und die Zitationen; jedes davon lässt sich unten ändern.
look-scope = Diese Änderungen gelten für
# The whole document, by the name of its element.
look-scope-document = Das ganze Dokument: { $name }
# Only one element under the document, by its name.
look-scope-only = Nur { $name }
look-scope-hint = Änderungen hier gelten für { $name }, wo immer es gedruckt wird. Seiteneinstellungen lassen es auf einer neuen Seite beginnen.
# The line under it, which goes down to the layout at the foot of Look; the count of changes follows it.
look-layout-line = Layout: { $layout }
look-layout-hint = Wie die Seiten aussehen: die Seite, die Schrift, die Abstände, die Überschriften, das Aussehen der Arten
look-citations-hint = Wie Zitationen und das Literaturverzeichnis geschrieben werden

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
look-section-numbers = Nummern
look-section-notes = Anmerkungen und Zitationen
look-section-figures = Abbildungen und Tabellen
look-section-front = Erste Seite
look-section-contents = Was das Dokument enthält
look-section-layout = Das Layout

look-kinds-in-use = In diesem Dokument
look-heading-levels = Ebenen der Überschriften
look-quotations-hint = Zitate, die durch ihre Länge vom Text abgesetzt werden, wo sie nicht selbst als Zitate gekennzeichnet sind. Die Art „Zitat“ wird unten bei den Absatzarten und Arten von Wörtern eingestellt.
# The first rows of Look, which most writers reach for; each is also in its part further down.
look-first-type-size = Schriftgröße
look-first-page-size = Seitengröße
look-first-headings-numbered = Überschriften werden nummeriert
# Headings within the parts of Look.
look-at-quotations = Lange Zitate
look-at-kinds = Absatzarten und Arten von Wörtern
look-at-citations = Zitationen
look-at-bibliography = Literaturverzeichnis
look-layout-changes = Was dieses Dokument ändert

look-keep = Diese Änderungen als eigenes Layout behalten…
look-keep-save = Behalten
# Where the layout is one of the writer's own.
look-put-into = Diese Änderungen in „{ $name }“ übernehmen
look-delete-layout = Dieses eigene Layout löschen…
look-bundled = Die Layouts, die Glaukopis mitbringt, bleiben, wie sie sind. Was Sie hier ändern, wird beim Dokument aufbewahrt oder, wenn Sie es wählen, als eigenes Layout.

## What the document contains, a section of Look: the parts the program
## makes itself, the kinds of elements given a place of their own, and what
## is required. What is changed there is kept as the document's own changes
## over what it is. The name in quotes is what the document is: "Journal
## article", "Novel".

look-contents-parts = Die Teile des Dokuments
look-contents-parts-hint = Wie „{ $template }“ sie vorsieht. Ein Teil, der hier ein- oder ausgeschaltet wird, ist für dieses Dokument und die darunter geändert, und nirgends sonst.
# Under the parts that are always made: when each is printed.
look-contents-part-body = Immer im Dokument
look-contents-part-notes = Wo immer der Text Anmerkungen hat
look-contents-part-bibliography = Wo immer der Text ein Werk zitiert
look-contents-part-keywords = Gedruckt, wo das Dokument Schlüsselwörter hat
look-contents-kinds = Elemente mit eigenem Platz
look-contents-kinds-hint = Die Arten von Elementen, denen „{ $template }“ einen Platz gibt, und die Elemente unter diesem, die jeden füllen. Jedes ist ein Element wie jedes andere: sein Text wird im Baum geschrieben.
look-contents-kinds-none = Keiner Art von Element gibt „{ $template }“ einen eigenen Platz.
look-contents-kinds-missing = Noch keines
look-contents-kinds-make = Eines anlegen
# On the second element of a kind a document has one of.
look-contents-kinds-doubled = Nur das erste wird verwendet
look-contents-requirements = Was verlangt wird
look-contents-requirements-hint = Wie „{ $template }“ es verlangt, sofern es hier nicht geändert wird. Die Checkliste und die Vorschau zählen an diesen Grenzen; gekürzt wird nichts.
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
look-layout = Layout
look-style = Zitierstil
look-style-change = Diesen Zitierstil ändern…

# The switch of the title page, first in the part of the front page.
look-front-title-page = Eine Titelseite
look-front-title-page-hint = Ob das Dokument überhaupt eine hat. Derselbe Schalter steht unter „Was das Dokument enthält“.

# The groups of the fonts to choose from.
look-fonts-document = In diesem Dokument
look-fonts-project = Anderswo in diesem Projekt
look-fonts-all = Alle Schriften
