# The editor of texts: the tools for writing, citations and notes.
# See locales/README.md.

## The marks and the kinds of paragraph, in the bar over a selection and in
## the tools over the text.

editor-format = Format
editor-writing = Schreiben
editor-italic = Kursiv
editor-bold = Fett
editor-small-capitals = Kapitälchen
editor-superscript = Hochgestellt
editor-subscript = Tiefgestellt
editor-struck = Durchgestrichen
editor-quotation = Zitat
editor-block-quotation = Blockzitat
editor-list = Liste
editor-text = Text
editor-text-hint = Ein Absatz
editor-quotation-hint = Vom Text abgesetzt
editor-list-hint = Mit einem Zeichen vor jedem Punkt
editor-numbered-list = Nummerierte Liste
editor-numbered-list-hint = Mit einer Zahl vor jedem Punkt
editor-verse = Vers
editor-verse-hint = Zeilen von Dichtung oder Drama, jede als Zeile bewahrt
editor-speaker = Sprecher
editor-speaker-hint = Wer spricht, in einer eigenen Zeile
editor-direction = Regieanweisung
editor-direction-hint = Was geschieht, kursiv
editor-line-numbers = Zeilennummern
editor-line-numbers-hint = Die Zeilen dieses Verses nummerieren: ab welcher Zeile, und jede wievielte
editor-line-numbers-from = Zeilen nummerieren ab
editor-line-numbers-none = Leer lassen für keine Nummern
editor-line-numbers-every = Eine Nummer zeigen alle
editor-line-numbers-number = Eine ganze Zahl ist gefragt.
editor-kinds-text = Text
editor-kinds-quotation = Zitat
editor-kinds-verse = Vers
editor-kinds-script = Drehbuch
editor-kinds-more = Mehr
editor-kinds-words = Wörter
editor-attribution = Zuschreibung
editor-attribution-hint = Wessen Worte es sind, unter einem Zitat, rechts
editor-epigraph = Motto
editor-epigraph-hint = Ein Zitat am Kopf eines Teils
editor-headword = Stichwort
editor-headword-hint = Das Wort, das ein Glossar erklärt
editor-gloss = Erklärung
editor-gloss-hint = Was das Stichwort bedeutet
editor-code = Code
editor-code-hint = Buchstabe für Buchstabe bewahrt, in Buchstaben gleicher Breite
editor-break = Zäsur
editor-break-hint = Eine Pause zwischen Teilen, mit dem Zeichen, das das Format ihr gibt
editor-draft = Arbeitsnotiz
editor-draft-hint = Nur für Ihre Augen: sie kommt in kein Dokument
editor-foreign = Fremdsprachig
editor-foreign-hint = Wörter in einer anderen Sprache, nach der sich die Rechtschreibung richtet
editor-title-of-work = Werktitel
editor-title-of-work-hint = Der Titel eines Buches, eines Stücks, eines Gemäldes
editor-term = Begriff
editor-term-hint = Ein Begriff, wo er zuerst gebraucht wird
editor-mention = Erwähnung
editor-mention-hint = Ein Wort, von dem als Wort die Rede ist, in Anführungszeichen
editor-highlight = Markierung
editor-highlight-hint = Für das Auge am Bildschirm: sie kommt in kein Dokument
editor-underline = Unterstrichen
editor-code-words = Code in der Zeile
editor-code-words-hint = Buchstaben gleicher Breite, innerhalb der Zeile
editor-scene = Szenenüberschrift
editor-scene-hint = INNEN. HAUS – NACHT
editor-action = Handlung
editor-action-hint = Was man sieht und was geschieht
editor-character = Figur
editor-character-hint = Wer spricht, über dem Dialog
editor-dialogue = Dialog
editor-dialogue-hint = Was gesagt wird
editor-parenthetical = Sprechanweisung
editor-parenthetical-hint = Wie es gesagt wird, in Klammern
editor-transition = Übergang
editor-transition-hint = SCHNITT AUF:, rechts
editor-comment = Kommentar
editor-comment-hint = Ein Kommentar zum Ausgewählten
editor-comment-element-hint = Ein Kommentar zu diesem Element; wählen Sie Wörter aus, um sie zu kommentieren
editor-parallel = Zwei Texte nebeneinander
editor-parallel-hint = Ein Original und seine Übersetzung, jedes ein eigener Text
editor-paragraph-kind = Absatzart
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = Absatzart: { $kind }

## The kind menu: the kinds in hand, the whole catalogue under "More…", and
## the format that sets them at its foot. The words menu, with the kinds of
## words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = Mehr…
editor-kinds-in-hand = Arten zur Hand
editor-kinds-own = Eigene
editor-kinds-make = Art anlegen…
editor-kinds-change-own = Eigene Art ändern…
# Over the item that opens the format editor: the format sets how each kind looks.
editor-kinds-set-by = Gesetzt, wie „{ $format }“ es vorgibt
editor-kinds-change-format = Format ändern…
editor-kinds-change-format-hint = Wie jede Art in diesem Dokument gesetzt wird
editor-words = Wörter
editor-words-hint = Unterstreichung, Hochstellung, Code; fremdsprachige Wörter, Werktitel, Begriffe
editor-words-make = Art für Wörter anlegen…
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-map = Die Sprache der Karte
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = Gewöhnliche Wörter
editor-own-kind-new = Eine eigene Art
editor-own-kind-change = Art ändern
editor-own-kind-name = Name
editor-own-kind-name-placeholder = Brief, Telegramm, Gebet…
editor-own-kind-words-placeholder = Schiffsname, Latein, ein Schlüsselwort…
editor-own-kind-name-taken = Eine Art dieses Namens gibt es schon.
editor-own-kind-based-on = Beruht auf
editor-own-kind-based-on-hint = Was unten nicht gesagt ist, ist wie bei dieser Art
editor-own-kind-look = Worin sie sich unterscheidet
editor-own-kind-create = Anlegen
editor-own-kind-delete-title = Die Art „{ $name }“ löschen?
editor-own-kind-delete-message = { $count ->
    [0] Kein Text ist von ihr.
    [one] Was in einem Element von ihr ist, bleibt, wie es ist, und wird in Dokumenten als Text gesetzt.
   *[other] Was in { $count } Elementen von ihr ist, bleibt, wie es ist, und wird in Dokumenten als Text gesetzt.
}

## Citing, notes, and what is put into the text.

editor-cite = Zitieren
editor-cite-here = Hier ein Werk zitieren
editor-cite-at-cursor = Ein Werk zitieren, wo der Cursor steht
editor-note = Anmerkung
editor-note-selection = Die Auswahl zur Anmerkung machen
editor-note-hint = Eine Anmerkung, am Fuß der Seite oder am Ende
editor-insert = Einfügen
editor-insert-hint = Ein Bild, eine Tabelle, Mathematik, ein Verweis
editor-new-element = Neues Element
editor-new-element-hint = Ein neues Element nach diesem oder darunter
editor-new-after = Neues Element nach diesem
editor-new-under = Neues Element unter diesem
editor-new-split = Hier teilen
editor-new-split-hint = Was auf den Cursor folgt, wird ein neues Element
editor-spelling-on = Die Rechtschreibung wird beim Schreiben geprüft · klicken, um damit aufzuhören
editor-spelling-off = Die Rechtschreibung wird nicht geprüft · klicken, um sie zu prüfen
editor-picture-file = Bild aus einer Datei…
editor-picture-file-hint = Eine Abbildung, mit dem, was zu ihr gesagt wird
editor-picture-store = Bild aus dem Fundus…
editor-picture-store-hint = Die, die Sie haben, werden an der Seite gezeigt
editor-equation = Gleichung
editor-equation-hint = Mathematik in einer eigenen Zeile
editor-table = Tabelle…
editor-table-hint = Mit so vielen Zeilen und Spalten
editor-table-file = Tabelle aus einer Datei…
editor-table-file-hint = CSV oder ein Tabellenblatt von LibreOffice oder Excel
editor-formula = Formel
editor-formula-hint = Mathematik in der Zeile
editor-pointer = Verweis…
editor-pointer-hint = Auf eine Abbildung, eine Tabelle, eine Gleichung oder einen Teil: „siehe Abbildung 2“
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = Bild

## More.

editor-found = Gefundene Zitationen…
editor-found-count = { $count } durchzugehen und zu Zitationen zu machen
editor-found-none = Und Text, der wie Zitationen aussieht, in dieser Karte

## Choosing a work to cite.

editor-picker = Quelle wählen
editor-picker-placeholder = Zitieren: Autor, Titel, Jahr
editor-picker-search = Quellen durchsuchen
editor-picker-results = Quellen
editor-picker-in-project = In diesem Projekt
editor-picker-recent = Zuletzt hinzugefügt
editor-picker-empty = Ihre Bibliothek ist leer.
editor-picker-no-match = Nichts in Ihrer Bibliothek enthält diese Wörter.
editor-picker-type = Tippen Sie, um Ihre Bibliothek zu durchsuchen.
editor-picker-new = Neue Quelle…
editor-picker-import = Importieren…

## A citation, and each work in it.

editor-citation = Zitation
editor-citation-add = Werk hinzufügen
editor-citation-add-purpose = Der Zitation ein Werk hinzufügen
editor-citation-in-text = Autor im Text: Nagy (1979)
editor-citation-remove = Zitation entfernen
editor-citation-split = Die Wörter von der Zitation trennen
editor-citation-split-hint = Die Wörter davor und danach werden Text der Zeile, und jedes Werk eine eigene Zitation, mit seiner Seite und sonst nichts
editor-citation-not-in-library = Diese Quelle ist nicht in Ihrer Bibliothek.
editor-citation-edit-reference = Quelle bearbeiten
editor-citation-before = Davor
editor-citation-before-placeholder = siehe, vgl.
editor-citation-after = Danach
editor-citation-after-placeholder = und passim
editor-citation-locator-kind = Art der Stelle
editor-citation-suppress-author = Der Autor steht in meinem Satz: nur das Jahr angeben
editor-citation-remove-work = Dieses Werk entfernen
# Stands in the text in place of a citation of a work that is in neither the library nor the project.
editor-citation-missing = [Quelle nicht gefunden]
# Stands in the text in place of a citation of no work.
editor-citation-empty = (Zitation)

## The kinds of place in a work a citation can point to, as the menu of a
## citation names them.

editor-locator-page = Seite
editor-locator-chapter = Kapitel
editor-locator-section = Abschnitt
editor-locator-paragraph = Absatz
editor-locator-line = Zeile
editor-locator-verse = Vers
editor-locator-book = Buch
editor-locator-volume = Band
editor-locator-part = Teil
editor-locator-column = Spalte
editor-locator-folio = Folio
editor-locator-figure = Abbildung
editor-locator-note = Anmerkung
editor-locator-number = Nummer
editor-locator-sub-verbo = Sub verbo

## A note, in the panel it is written in.

# The number is that of the note, or a letter for a note that stands in a place of its own.
editor-note-numbered = Anmerkung { $number }
editor-note-place = Wo die Anmerkung steht
editor-note-place-format = Wo das Format seine Anmerkungen hat
editor-note-place-foot = Am Fuß der Seite
editor-note-place-end = Am Ende des Textes
editor-note-placeholder = Der Text der Anmerkung
