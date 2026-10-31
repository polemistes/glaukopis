# Layouts, which the files and the code call formats: their kinds, and the rows by which their looks are set in the look of a document.

## The kinds of document layout, as the layouts are grouped by them.

format-kind-own = Eigene
format-kind-general = Allgemein
format-kind-style-guide = Richtlinien
format-kind-publisher = Verlage
format-kind-journal = Zeitschriften
format-kind-fiction = Belletristik
format-kind-stage = Bühne und Film
format-kind-poetry = Lyrik

## Layouts of the writer's own, kept from the changes of a document.

format-name = Name des Layouts
# The name a layout of one's own is first given, made from that of the layout it is made from.
format-name-changed = { $name }, geändert
format-saved = „{ $name }“ ist unter Ihren eigenen Layouts gespeichert
format-save-failed = Das Layout konnte nicht gespeichert werden.
format-delete-failed = Das Layout konnte nicht gelöscht werden.
format-delete-title = Das Layout „{ $name }“ löschen?
format-delete-message = Elemente, die es verwenden, verwenden stattdessen das allgemeine Layout für Manuskripte.
format-delete-confirm = Layout löschen

## Words that stand in several parts.

format-size = Größe
format-bold = Fett
format-italic = Kursiv
format-letters = Buchstaben
format-alignment = Ausrichtung
format-line-spacing = Zeilenabstand
format-as-the-text = Wie der Text
# Beside a size of 0, in the place of its unit.
format-as-the-text-zero = wie der Text
format-align-left = Links
format-align-center = Zentriert
format-align-right = Rechts
format-align-justified = Blocksatz
format-align-ragged = Linksbündig, Flattersatz
format-case-none = Wie geschrieben
format-case-upper = GROSSBUCHSTABEN
format-case-smallcaps = Kapitälchen
format-spacing-single = Einfach
format-spacing-one-and-a-half = Anderthalb
format-spacing-double = Doppelt
format-stands-left = Links
format-stands-center = In der Mitte
format-stands-right = Rechts

## The page.

format-page-custom = Andere Größe
format-page-width = Breite
format-page-height = Höhe
format-margins = Ränder
format-margin-top = Oben
format-margin-bottom = Unten
format-margin-left = Links
format-margin-right = Rechts
format-columns-heading = Spalten
format-columns = Spalten
format-column-gap = Abstand zwischen den Spalten
format-lengths-hint = Längen werden mit ihrer Einheit geschrieben: 2.5cm, 1in, 25mm, 12pt.
## Numbers belong to what they number (ADR 0041): the lines one numbers
## are shown as the layout says where they do not say otherwise; the lines
## of the page are the layout's alone.
format-verse-every = Eine Nummer zeigen alle
format-verse-side = Seite der Nummern
format-side-left = Links
format-side-right = Rechts
format-numbers-page = Die Zeilen der Seite
format-line-numbers = Zeilen nummerieren

## Type and spacing, and paragraphs.

format-typeface = Schriftart
format-hyphenate = Wörter am Zeilenende trennen
format-indent-first = Auch nach einer Überschrift
format-space-between = Abstand zwischen Absätzen
format-italics = Kursives wird gesetzt
format-italics-italic = Kursiv
format-italics-underline = Unterstrichen, wie in Schreibmaschinenmanuskripten
format-refmarks = Stellenmarken werden gesetzt
format-refmarks-raised = Klein und hochgestellt in der Zeile
format-refmarks-margin = Am Rand neben ihrer Zeile

## Headings.

format-numbered = Nummeriert
format-level = Ebene { $number }
# What a level of headings is, in short, beside its number: "14 pt, bold, centred".
format-level-size = { $size } pt
format-level-bold = fett
format-level-italic = kursiv
format-level-capitals = Großbuchstaben
format-level-small-caps = Kapitälchen
format-level-centred = zentriert
format-level-right = rechts
format-level-run-in = läuft in den Text
format-level-indent = Eingezogen wie ein Absatz
format-level-begins-text = Im Text
format-level-begins-page = Auf einer neuen Seite
format-level-begins-right-page = Auf einer rechten Seite
format-level-right-page-said = auf rechter Seite
format-level-numbering = Nummerierung
format-level-numbering-as-above = Wie die Ebene darüber
format-level-numbering-none = Keine
format-level-numbering-arabic = 1, 2, 3
format-level-numbering-alpha = A, B, C
format-level-numbering-alpha-lower = a, b, c
format-level-numbering-roman = I, II, III
format-level-numbering-roman-lower = i, ii, iii
format-level-counted = Zählung
format-level-counted-under = Unter der Ebene darüber
format-level-counted-through = Durch das ganze Dokument
format-level-counted-through-said = durch das ganze Dokument gezählt
# How a level is numbered, said among its look: "numbered I, II, III".
format-level-numbered-as = nummeriert { $style }
format-level-not-numbered = nicht nummeriert
format-level-new-page-said = auf neuer Seite
format-space-before = Abstand davor
format-space-after = Abstand danach
format-level-add = Eine tiefere Ebene
format-level-remove = Die tiefste entfernen

## The title and the abstract.

format-title-placement = Der Titel steht
format-title-top = Oben auf der ersten Seite
format-title-own-page = Auf einer eigenen Seite
format-title-authors = Autoren
format-title-affiliations = Ihre Institutionen
format-title-date = Datum
format-title-abstract = Zusammenfassung und Schlüsselwörter
format-title-abstract-label = Überschrift der Zusammenfassung
format-title-keywords-label = Wort vor den Schlüsselwörtern

## Quotations, notes and the bibliography.

format-quote-from-words = Ab so vielen Wörtern
format-quote-from-lines = Oder so vielen Zeilen
format-notes-kind = Anmerkungen stehen
format-notes-footnotes = Am Fuß der Seite
format-notes-endnotes = Am Ende des Textes
format-notes-title = Überschrift der Anmerkungen
format-bibliography-title = Überschrift
format-bibliography-new-page = Beginnt auf einer neuen Seite
format-bibliography-hanging-indent = Hängender Einzug
format-bibliography-entry-spacing = Abstand zwischen Einträgen

## The kinds of paragraph and of words: how each differs from the kind it
## is based on. The rows are those of the dialog for a kind of one's own
## too; what is not said is as the base has it.

format-kind-based-on = beruht auf { $base }
# Of the kind Text, which the parts for type and paragraphs set.
format-kind-text-note = wie die Schrift und die Absätze des Layouts es vorsehen
# At the right of a kind's line where this layout says nothing of it.
format-kind-as-base = wie die Grundlage
format-kind-resolved = So wird es stehen: { $look }
format-kind-resolved-nothing = So wird es stehen: wie der umgebende Text
format-kind-resolved-failed = Wie es stehen wird, ließ sich nicht ermitteln: { $reason }
format-as-the-base = Wie die Grundlage
# "As the base", with what the base comes to: "As the base (Yes)", "As the base (11 pt)".
format-as-the-base-is = Wie die Grundlage ({ $value })
# In an empty field for a size, in the place of its number.
format-as-the-base-blank = wie die Grundlage
format-yes = Ja
format-no = Nein
format-underline = Unterstrichen
format-equal-width = Buchstaben gleicher Breite
format-equal-width-hint = Wie Code gesetzt wird
format-indent-left = Einzug links
format-indent-right = Einzug rechts
format-first-line = Erste Zeile
format-first-line-hint = Wie weit sie über die übrigen hinaus eingezogen beginnt
format-keep-with-next = Mit dem nächsten zusammengehalten
format-keep-with-next-hint = Nicht allein am Fuß einer Seite gelassen
format-new-page = Beginnt eine neue Seite
format-break-text = Was in einer Zäsur steht
format-break-text-hint = * * *, wo nichts gesagt ist; # für ein Manuskript
# What a look says, in short, on the line of its kind: "10 pt, italic, centred".
format-look-not-bold = nicht fett
format-look-not-italic = nicht kursiv
format-look-underlined = unterstrichen
format-look-not-underlined = nicht unterstrichen
format-look-as-written = wie geschrieben
format-look-left = links
format-look-justified = Blocksatz
format-look-indent-left = { $length } Einzug links
format-look-indent-right = { $length } Einzug rechts
format-look-first-line = erste Zeile { $length }
format-look-space-before = { $length } davor
format-look-space-after = { $length } danach
format-look-line-spacing = Zeilenabstand { $spacing }
format-look-equal-width = Buchstaben gleicher Breite
format-look-not-equal-width = Buchstaben ungleicher Breite
format-look-kept = mit dem nächsten zusammengehalten
format-look-not-kept = nicht mit dem nächsten zusammengehalten
format-look-no-new-page = keine neue Seite
format-look-text = „{ $text }“ in einer Zäsur

## Figures and tables, which are told alike. The kind is figure or table: where
## English has the same words for both, another language may not (the caption
## of a figure and of a table can have different names).

format-figures = Abbildungen
format-tables = Tabellen
format-captioned-called = { $kind ->
    [figure] Eine Abbildung heißt
   *[table] Eine Tabelle heißt
}
format-captioned-reference = Wo der Text auf sie verweist
format-captioned-label-bold = Wort und Nummer fett
format-captioned-label-italic = Wort und Nummer kursiv
format-captioned-between = { $kind ->
    [figure] Zwischen Nummer und Beschriftung
   *[table] Zwischen Nummer und Beschriftung
}
# What stands between the number and the caption; called is the word and number, "Figure 1".
format-between-stop = { $kind ->
    [figure] Punkt ({ $called }. Beschriftung)
   *[table] Punkt ({ $called }. Beschriftung)
}
format-between-colon = { $kind ->
    [figure] Doppelpunkt ({ $called }: Beschriftung)
   *[table] Doppelpunkt ({ $called }: Beschriftung)
}
format-between-line = { $kind ->
    [figure] Beschriftung in einer eigenen Zeile
   *[table] Beschriftung in einer eigenen Zeile
}
format-between-other = Anderes…
format-captioned-separator = Was zwischen ihnen steht
format-captioned-own-line = { $kind ->
    [figure] Dann die Beschriftung in einer eigenen Zeile
   *[table] Dann die Beschriftung in einer eigenen Zeile
}
format-caption = { $kind ->
    [figure] Beschriftung
   *[table] Beschriftung
}
format-caption-stands = { $kind ->
    [figure] Die Beschriftung steht
   *[table] Die Beschriftung steht
}
format-caption-below = { $kind ->
    [figure] Unter dem Bild
   *[table] Unter der Tabelle
}
format-caption-above = { $kind ->
    [figure] Über dem Bild
   *[table] Über der Tabelle
}
format-captioned-where = { $kind ->
    [figure] Wo Abbildungen stehen
   *[table] Wo Tabellen stehen
}
format-captioned-stand = { $kind ->
    [figure] Abbildungen stehen
   *[table] Tabellen stehen
}
format-captioned-wrap = Der Text umfließt sie
format-captioned-placement = Im Dokument
format-captioned-in-text = Im Text
format-captioned-at-end = Am Ende gesammelt
format-captioned-end-title = { $kind ->
    [figure] Überschrift über den Abbildungen
   *[table] Überschrift über den Tabellen
}
# What is left in the text where a figure or table gathered at the end belongs.
format-captioned-placeholder = Zeile, die im Text bleibt
format-captioned-placeholder-missing = Sie muss {"{}"} enthalten, wo Wort und Nummer hinkommen
format-table-rules = Linien
format-table-rules-horizontal = Darüber, darunter und unter den Überschriften
format-table-rules-grid = Um jede Zelle
format-table-rules-none = Keine
format-table-header-bold = Überschriften fett
format-equations = Gleichungen
format-equations-stand = Gleichungen stehen
format-equations-before = Vor der Nummer
format-equations-after = Nach der Nummer

## Page numbers and the running head.

format-page-numbers = Seitenzahlen
format-page-numbers-show = Seiten werden nummeriert
format-page-numbering = Stil der Zahlen
format-number-arabic = 1, 2, 3
format-number-roman = I, II, III
format-number-roman-lower = i, ii, iii
format-number-letters = A, B, C
format-number-letters-lower = a, b, c
format-page-restart = Zählt die Seiten hier von vorn
format-margin-header = Kopfzeile
format-margin-footer = Fußzeile
format-margin-shown = Gezeigt
format-margin-first-page = Auch auf der ersten Seite
format-margin-openers = Auch auf den Seiten, wo ein Kapitel oder ein Teil beginnt
format-margin-alternate = Auf linken und rechten Seiten verschieden
format-margin-right-pages = Auf rechten Seiten
format-margin-left-pages = Auf linken Seiten
format-margin-place-left = Links
format-margin-place-center = Mitte
format-margin-place-right = Rechts
format-margin-add = Hinzufügen…
# Said of an item in a place of the header or the footer.
format-margin-remove = { $item } wegnehmen
format-margin-separator = Zwischen den Angaben
format-margin-text-placeholder = Ihre Worte
format-item-page-number = Seitenzahl
format-item-title = Titel
format-item-author = Autor
format-item-chapter = Kapitel
format-item-date = Datum
format-item-text = Eigene Worte

## About the layout: where its requirements are from.

format-description = Beschreibung
format-source = Woher die Vorgaben stammen
# The date the source was read on.
format-source-read = Gelesen am { $date }.
format-source-high = Die Werte sind die der Quelle.
format-source-medium = Die Quelle konnte nur zum Teil oder in einem früheren Stand gelesen werden: prüfen Sie, was Ihnen wichtig ist.
format-source-low = Wenig konnte überprüft werden: nehmen Sie die Werte als Anfang.

## Fewer words, stage 3: the rows of Look in plain words.

format-level-begins-paragraph = Beginnt den Absatz
format-level-placement = Platzierung
format-title-include = Aufnehmen
format-title-formatting = Gestaltung
format-title-anonymize = Erste Seite anonymisieren
format-table-inside = In der Tabelle

## Fewer words, stage 4: the two lengths of paragraphs, and the warning of long quotations.

format-indent-first-line = Einzug der ersten Zeile
format-quote-warn = Vor langen Zitaten im Text warnen

## The contributors, stage 3: the lines of the editors and the translators on the front page, and their items.

format-title-roles = Herausgeber und Übersetzer
format-item-editor = Herausgeber
format-item-translator = Übersetzer

## The numbering of lines, stage 2: the side of the annotations of lines.
format-verse-annotations = Seite der Randbemerkungen
format-verse-annotations-other = Gegenüber den Nummern

## Where a line begins, stage 4: the step of an indent.
format-indent-step = Einzugsschritt
