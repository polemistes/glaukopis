# An element as text: its name the title, the elements under it one after
# another, each a heading and its text.

text-title = Titel
text-name = Name des Elements
text-grip = Dieses Element verschieben oder ändern
# Where elements dragged in the text would go, said by the line drawn there.
text-drop-under = Unter „{ $name }“
text-drop-after = Nach „{ $name }“
text-drop-before = Vor „{ $name }“
text-make-paragraph-element = Den Absatz zu einem Element machen
text-make-selection-element = Die Auswahl zu einem Element machen
text-paragraph-holds = Der Absatz enthält { $things } und wurde nicht zu einem Element gemacht
text-selection-holds = Die Auswahl enthält { $things } und wurde nicht zu einem Element gemacht
# What stands in a paragraph or a selection that a name cannot hold, as the two messages above name it.
text-holds-citation = eine Zitation
text-holds-footnote = eine Anmerkung
text-holds-math = eine Formel
text-holds-refmark = eine Nummer in der Zeile
text-holds-crossref = einen Verweis
text-holds-linemark = eine Nummer oder eine Randbemerkung
text-holds-other = etwas, das ein Name nicht aufnehmen kann
text-join = Mit dem Element darüber zusammenfügen
text-open-as-map = Hineingehen

## Associations, in the margin

text-associations = Verbindungen
text-outline = Gliederung
text-outline-between = Zwischen der Gliederung und dem Text
text-go-to = Zu „{ $name }“ gehen
text-add-label = Beschriftung hinzufügen…
text-change-label = Beschriftung ändern…
text-remove-association = Verbindung entfernen
text-hint-linking = Klicken Sie den Namen des Elements an, mit dem verbunden werden soll · { $esc } zum Verlassen

## Under the text

text-notes = { $count ->
    [one] { $count } Anmerkung
   *[other] { $count } Anmerkungen
}
# The keys are shown as keys, where the variables stand.
text-keys = { $alt }+{ $enter } neues Element · { $alt }+{ $shift }+{ $enter } eines darunter · { $at } zitieren

## Fewer words, stage 2 (agent "chrome")

# A clone in the text: the original's name is shown in bold where the variable stands.
text-clone = Klon von { $name }
text-clone-go = Zum Original gehen
text-unfold = Dieses Element ausklappen
text-fold-this = Dieses Element einklappen
text-unfold-all-under = Alle Unterelemente ausklappen
text-fold-all-sub = Alle Unterelemente einklappen
# The tooltips of the mark that folds an element in the text.
text-unfold-shift = Ausklappen · mit Umschalt auch alle Unterelemente
text-fold-this-shift = Dieses Element einklappen · mit Umschalt alle Unterelemente ausklappen
# The buttons of the outline.
text-outline-unfold = Unterelemente ausklappen
text-outline-fold-sub = Unterelemente einklappen
