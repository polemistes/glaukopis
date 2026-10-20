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
editor-quotation-hint = Worte eines anderen, vom Text abgesetzt
editor-list-hint = Ein Punkt einer Liste; ein Einzug macht eine Liste in der Liste
editor-numbered-list = Nummerierte Liste
editor-numbered-list-hint = Ein Punkt einer nummerierten Liste; ein Einzug macht eine Liste in der Liste
editor-verse = Vers
editor-verse-hint = Eine Zeile aus Dichtung, Drama oder einem Transkript, als Zeile bewahrt
editor-speaker = Sprecher
editor-speaker-hint = Wer spricht: in einer eigenen Zeile oder als Wörter in einer Zeile
editor-direction = Regieanweisung
editor-direction-hint = Was auf der Bühne geschieht: in einer eigenen Zeile oder als Wörter in einer Zeile
editor-line-numbers = Nummern
editor-line-numbers-hint = Diese Zeilen nummerieren: wie sie gezählt werden, ab welcher Nummer, jede wievielte und auf welcher Seite; und angeben, was für die Zeile gilt, in der der Cursor steht. Zeilen, die mit denselben Einstellungen zusammen nummeriert sind, werden durchgezählt, gleich welcher Art sie sind.
editor-line-numbers-from = Nummerieren ab
editor-line-numbers-from-hint = Die erste gezählte Zeile bekommt diese Nummer, und von ihr aus wird weitergezählt.
editor-line-numbers-every = Eine Nummer zeigen alle
editor-line-numbers-number = Eine ganze Zahl ist gefragt.
editor-line-this = Diese Zeile
editor-line-number = Ihre Nummer oder Bezeichnung
editor-line-number-placeholder = Gezählt wie die anderen
editor-line-number-hint = 1234, 567a: immer gezeigt; die Zeilen danach werden von ihr aus weitergezählt.
editor-line-uncounted = Nicht gezählt
editor-line-uncounted-hint = Wie die zweite Hälfte einer Zeile, die sich zwei Sprecher teilen: die Zählung übergeht sie.
editor-line-hidden = Gezählt, die Nummer nicht gezeigt
editor-line-hidden-hint = Die Zählung geht durch sie hindurch wie durch jede Zeile, aber im Dokument steht keine Nummer neben ihr, auch wo eine an der Reihe wäre. Wo Sie schreiben, steht die Nummer in Klammern.
editor-line-number-held = Gezählt und im Dokument nicht gezeigt. Klicken, um ihr eine eigene Nummer zu geben.
editor-line-margin = Wörter am Rand
editor-line-margin-placeholder = Ein Versmaß, die Nummer einer anderen Ausgabe
editor-line-margin-hint = Am Rand neben ihr gezeigt, gegenüber den Nummern; nicht gezählt.
# How the lines of a stretch are numbered: see ADR 0041.
editor-numbering = Nummerierung
editor-numbering-none = Nicht nummeriert
editor-numbering-counted = Ab der ersten angegebenen Nummer gezählt
editor-numbering-given = Nur die angegebenen Nummern
editor-line-numbers-every-layout = Wie im Layout: alle { $every }
editor-line-numbers-side = Seite der Nummern
editor-side-layout = Wie im Layout ({ $side })
editor-side-left = Links
editor-side-right = Rechts
# The first counted line of the stretch is the one the cursor is in: its number is where the count begins.
editor-line-number-first-hint = Hier beginnt die Zählung.
# Over a number in the margin of the text, which opens a field for it when pressed.
editor-line-number-press = Die Nummer dieser Zeile: klicken, um sie zu ändern

## Numbers belong to what they number (ADR 0041): the Numbers menu offers
## the three, each saying what it numbers.
editor-numbers = Nummern
editor-numbers-hint = Die Zeilen nummerieren, die Sie schreiben, eine Stelle in Prosa bezeichnen oder die Zeilen der Seite nummerieren
editor-numbers-lines = Diese Zeilen nummerieren…
editor-numbers-lines-hint = Die Zeilen der Absätze, in denen der Cursor steht, oder der ausgewählten: ab welcher Nummer, jede wievielte, auf welcher Seite
editor-numbers-refmark-hint = Eine Stelle in Prosa, nach Vers, Seite oder Nummer einer Ausgabe: 3:16, 327a
editor-numbers-page = Die Zeilen der Seite nummerieren
editor-numbers-page-hint = Jede Zeile der gedruckten Seite, am Rand nummeriert, in diesem Dokument und denen darunter

## The bracket at the left of paragraphs of one kind standing together (a
## run), named by the kind; its menu says what is said of them.
# After the name of the kind, where the lines of the run are numbered: "Verse · numbered".
editor-bracket-numbered = nummeriert
editor-run-label-hint = { $kind } · klicken für das, was von diesen Absätzen gilt
editor-run-numbers = Nummern…
editor-run-numbers-hint = Wie die Zeilen hier gezählt werden, ab welcher Nummer, jede wievielte und auf welcher Seite
editor-run-select = Diese Absätze auswählen
editor-run-to-text = Zu Text machen
editor-run-to-text-hint = Die Absätze dieser Art werden zu Text; ihre Zeilen und alles andere bleiben, wie sie sind
editor-run-begin = Hier eine neue Folge beginnen
editor-run-begin-hint = Der Absatz, in dem der Cursor steht, beginnt eine eigene Klammer, obwohl der davor von derselben Art ist
editor-run-join = Mit der Folge davor verbinden
editor-run-join-hint = Diese Absätze sind wieder eins mit denen derselben Art davor
editor-kinds-text = Text
editor-kinds-quotation = Zitat
editor-kinds-verse = Vers
editor-kinds-script = Drehbuch
editor-kinds-list = Liste
editor-kinds-more = Mehr
editor-kinds-words = Wörter
editor-attribution = Zuschreibung
editor-attribution-hint = Wessen Worte ein Zitat wiedergibt
editor-epigraph = Motto
editor-epigraph-hint = Ein Zitat am Kopf eines Teils
editor-headword = Stichwort
editor-headword-hint = Das Wort, das ein Glossar erklärt
editor-gloss = Erklärung
editor-gloss-hint = Was das Stichwort bedeutet
editor-code = Code
editor-code-hint = Eine Zeile Code oder von etwas, das Buchstabe für Buchstabe bewahrt wird
editor-break = Zäsur
editor-break-hint = Eine Pause zwischen Teilen, mit dem Zeichen, das das Layout ihr gibt
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
editor-scene-hint = Wo und wann eine Szene spielt: INNEN. HAUS – NACHT
editor-action = Handlung
editor-action-hint = Was man sieht und was geschieht
editor-character = Figur
editor-character-hint = Wer den folgenden Dialog spricht
editor-dialogue = Dialog
editor-dialogue-hint = Was gesagt wird
editor-parenthetical = Sprechanweisung
editor-parenthetical-hint = Wie ein Satz gesprochen wird
editor-transition = Übergang
editor-transition-hint = Wie eine Szene in die nächste übergeht: SCHNITT AUF:
editor-comment = Kommentar
editor-comment-hint = Ein Kommentar zum Ausgewählten
editor-comment-element-hint = Ein Kommentar zu diesem Element; wählen Sie Wörter aus, um sie zu kommentieren
editor-parallel = Zwei Texte nebeneinander
editor-parallel-hint = Ein Original und seine Übersetzung, jedes ein eigener Text
editor-page-break = Seitenumbruch
editor-page-break-hint = Was folgt, beginnt auf einer neuen Seite
editor-column-break = Spaltenumbruch
editor-column-break-hint = Was folgt, beginnt oben in der nächsten Spalte, wo das Layout den Text in Spalten setzt
editor-paragraph-kind = Absatzart
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = Absatzart: { $kind }

## The kind menu: the kinds written with those where the cursor is, the kinds at hand,
## the whole catalogue under "More…", and the layout that sets them at its foot.
## The words menu, with the kinds of words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = Mehr…
editor-kinds-mixed = Gemischt
editor-kinds-own = Eigene
editor-kinds-make = Art anlegen…
editor-kinds-change-own = Eigene Art ändern…
# Over the item that opens the look of the document at the kind the cursor is in.
editor-kinds-set-by = Gesetzt, wie „{ $format }“ es vorgibt
editor-kinds-change-look = Wie „{ $kind }“ aussieht…
editor-kinds-change-look-hint = Ihr Aussehen in diesem Dokument und der Rest der Seite
editor-words = Wörter
editor-words-hint = Unterstreichung, Hochstellung, Code; die Sprache einer Passage, fremdsprachige Wörter, ein Werktitel, ein Begriff, ein Sprecher in einer Zeile
editor-words-make = Art für Wörter anlegen…
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-text = Die Sprache des Textes
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = Gewöhnliche Wörter
# The language of a passage, from a word to many paragraphs: it has no look of its own.
editor-language = Sprache
editor-language-of-text = Die eigene Sprache des Textes
editor-language-other = Andere Sprache…
editor-language-other-title = Die Sprache der Passage
editor-language-tag = Sprachkürzel
editor-language-no-tag = Das ist kein Sprachkürzel: ein Kürzel ist etwa „grc“, „la“ oder „de-CH“.
editor-language-unnamed = Eine Sprache, für die das System keinen Namen hat: das Kürzel wird bewahrt, wie es geschrieben ist.
editor-language-suggested = Oft zitierte Sprachen
editor-language-other-hint = Die Passage wird mit dem Wörterbuch ihrer Sprache geprüft, wo eines importiert ist, und in Ruhe gelassen, wo keines ist; ein erzeugtes Dokument teilt Word, OpenDocument, Typst und LaTeX die Sprache mit.
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
editor-break-signs = Das Zeichen eines Zeilenumbruchs im Absatz
editor-break-signs-on = Ein Zeilenumbruch im Absatz wird mit ↵ gezeigt · klicken, um das Zeichen zu verbergen
editor-break-signs-off = Ein Zeilenumbruch im Absatz wird nicht gezeigt · klicken, um ihn mit ↵ zu zeigen
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
editor-refmark = Stellenmarke…
editor-refmark-hint = Ein Vers, eine Seite oder eine Nummer einer Ausgabe: 3:16, 327a
editor-refmark-title = Stellenmarke
editor-refmark-label = Bezeichnung
editor-refmark-placeholder = 3:16, 327a, 1094a1
editor-refmark-dialog-hint = Die Marke gehört nicht zu den Wörtern: Rechtschreibung, Suche und Wortzählung übergehen sie. Das Layout bestimmt, ob sie in der Zeile hochgestellt oder an den Rand gesetzt wird.
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = Bild

## More.

editor-found = Lose Zitationen…
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
# A reference was dropped where a citation cannot stand, and the cursor is in no such place either.
editor-citation-no-place = Dort kann keine Zitation stehen
# The project keeps a copy of every reference it cites; this one could not be read from the library.
editor-reference-not-kept = Die Quelle konnte nicht beim Projekt aufbewahrt werden
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
editor-note-place-format = Wo das Layout seine Anmerkungen hat
editor-note-place-foot = Am Fuß der Seite
editor-note-place-end = Am Ende des Textes
editor-note-placeholder = Der Text der Anmerkung
