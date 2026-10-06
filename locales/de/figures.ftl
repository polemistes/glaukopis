# Figures, formulas and equations in the text, and the cross-references to
# them. See locales/README.md.

## A figure, and the panel of what can be said of it.

figures-figure = Abbildung
figures-width = Breite
figures-width-third = Ein Drittel
figures-width-half = Die Hälfte
figures-width-three-quarters = Drei Viertel
figures-width-whole = Ganz
figures-width-of-row = Des Platzes, den sie in der Reihe hat.
figures-width-of-text = Der Breite des Textes, im Dokument.
figures-shows = Zeigt
figures-shows-placeholder = In Worten, für die, die es nicht sehen können
figures-numbered = Nummeriert, als „Abbildung 1“
figures-keep-caption = Die Beschriftung beim Bild behalten
figures-keep-caption-hint = Abbildungen mit diesem Bild beginnen dann mit dem, was hier gesagt wird
figures-take-caption = Die eigene des Bildes nehmen
figures-take-caption-hint = Was beim Bild aufbewahrt ist, wird hier gesagt, anstelle dessen, was jetzt gesagt wird
figures-another-picture = Ein anderes Bild…
figures-remove = Abbildung entfernen
figures-caption-kept = Beim Bild aufbewahrt
figures-caption-kept-detail = Abbildungen mit ihm beginnen mit diesen Worten.
# The title of the window in which a picture is chosen among the files of the computer.
figures-choose-picture = Ein Bild
# What the files that can be chosen there are called.
figures-picture-files = Bilder

## The store of pictures, as the text reads it.

figures-pictures-unread = Die Bilder konnten nicht gelesen werden
figures-picture-not-taken = Das Bild konnte nicht hinzugefügt werden
figures-picture-not-kept = Was zum Bild gesagt wurde, konnte nicht gespeichert werden
figures-picture-not-removed = Das Bild konnte nicht entfernt werden

## Where a figure, a table or an equation stands.

figures-stands = Steht
figures-stands-in-row = neben anderen, in einer Reihe
figures-stands-alone = Wieder für sich
# Said of the choices of where it stands; the kind is figure, table or equation.
figures-stands-where = Wo die { $kind ->
        [figure] Abbildung
        [table] Tabelle
       *[equation] Gleichung
    } steht
figures-side-format = Wie das Format
figures-side-left = Links
figures-side-middle = Mitte
figures-side-right = Rechts
# What the format of the document says of where things of a kind stand. The
# flow is none for equations, and for what stands in the middle.
figures-usual = Das Format hat { $kind ->
        [figure] Abbildungen
        [table] Tabellen
       *[equation] Gleichungen
    } { $side ->
        [left] links
        [right] rechts
       *[center] in der Mitte
    }{ $flow ->
        [around] , vom Text umflossen
        [apart] , vom Text abgesetzt
       *[none] {""}
    }.
figures-text = Text
figures-flows-where = Ob der Text die { $kind ->
        [figure] Abbildung
        [table] Tabelle
       *[equation] Gleichung
    } umfließt
figures-flow-format = Wie das Format
figures-flow-around = Umfließt sie
figures-flow-apart = Steht abgesetzt
figures-flow-at-side = Der Text umfließt, was an einer Seite steht.
figures-beside = Neben die vorige stellen

## A formula in the line, and an equation on a line of its own.

figures-formula = Formel
figures-equation = Gleichung
figures-equation-numbered = Nummeriert
figures-formula-field = Die Formel, in der Schreibweise von TeX
figures-formula-empty = Was geschrieben wird, erscheint hier so, wie es stehen wird.
figures-formula-hint = Geschrieben wie in TeX. Eingabe, wenn fertig; Esc lässt es, wie es war.
figures-equation-hint = Geschrieben wie in TeX. Eingabe, wenn fertig; Umschalt+Eingabe für eine neue Zeile; Esc lässt es, wie es war.
figures-formula-unread = Die Formel konnte nicht gelesen werden.
# Shown in the text where a formula has nothing written in it yet.
figures-formula-blank = Formel
figures-equation-blank = Eine Gleichung

## What can be put into a formula by pressing.

figures-sign-raised = Hochgestellt
figures-sign-lowered = Tiefgestellt
figures-sign-fraction = Bruch
figures-sign-root = Wurzel
figures-sign-sum = Summe
figures-sign-integral = Integral
figures-sign-brackets = Mitwachsende Klammern
figures-sign-alpha = Alpha
figures-sign-beta = Beta
figures-sign-gamma = Gamma
figures-sign-lambda = Lambda
figures-sign-pi = Pi
figures-sign-sigma = Sigma
figures-sign-less-or-equal = Kleiner oder gleich
figures-sign-greater-or-equal = Größer oder gleich
figures-sign-not-equal = Ungleich
figures-sign-nearly-equal = Ungefähr gleich
figures-sign-times = Mal
figures-sign-plus-or-minus = Plus oder minus
figures-sign-arrow = Pfeil
figures-sign-infinity = Unendlich
figures-sign-words = Wörter in einer Formel

## Cross-references to a figure, a table, an equation or a part.

figures-points-by = Gezeigt als
figures-form-full = Das Wort und die Nummer
figures-form-number = Die Nummer allein
figures-form-equation = Die Nummer, wie sie bei der Gleichung steht
figures-form-its-number = Seine Nummer
figures-form-its-name = Sein Name
figures-go-to = Zu dem gehen, worauf er verweist
figures-pointed-gone = Worauf dies verweist, ist nicht mehr im Dokument
figures-point-elsewhere = Auf etwas anderes verweisen…

## Choosing what a cross-reference refers to.

figures-targets = Wählen, worauf verwiesen wird
figures-targets-placeholder = Auf eine Abbildung, eine Tabelle, eine Gleichung, einen Teil verweisen
figures-targets-search = Durchsuchen, worauf verwiesen werden kann
figures-targets-results = Worauf verwiesen werden kann
figures-targets-figures = Abbildungen
figures-targets-tables = Tabellen
figures-targets-equations = Gleichungen
figures-targets-parts = Teile des Dokuments
figures-targets-figure-unsaid = Eine Abbildung, zu der nichts gesagt ist
figures-targets-table-unsaid = Eine Tabelle, zu der nichts gesagt ist
figures-targets-no-match = Nichts im Dokument entspricht diesen Wörtern.
figures-targets-none = Es gibt noch nichts, worauf verwiesen werden könnte: keine Abbildung, keine Tabelle, keine nummerierte Gleichung, keinen Teil mit Namen.
figures-targets-hint = Ein Verweis folgt dem, worauf er verweist: seiner Nummer und dem, wie das Format es nennt.

## Shown by the stylesheet, where the page has no element for the words.

figures-picture-absent = Das Bild ist nicht auf diesem Computer
figures-caption-placeholder = Was zum Bild gesagt wird
