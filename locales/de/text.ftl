# An element as text: its name the title, the elements under it one after
# another, each a heading and its text.

text-title = Titel
text-name = Name des Elements
text-not-printed = nicht gedruckt
text-grip = Dieses Element verschieben oder ändern
# The element an element stands for, whose name is shown in bold where the variable stands.
text-include = Im Dokument steht hier { $name }, mit allem darunter.
text-include-open = Öffnen
# Where elements dragged in the text would go, said by the line drawn there.
text-drop-under = Unter „{ $name }“
text-drop-after = Nach „{ $name }“
text-drop-before = Vor „{ $name }“
text-split = Hier teilen
text-join = Mit dem Element darüber zusammenfügen
text-open-as-map = Als Karte öffnen
text-open-as-map-hint = Es wird allein gezeigt, mit dem, was darunter ist

## Folding away what is under an element, and its text

text-open = Ausklappen
text-fold = Einklappen
text-open-shift = Ausklappen · mit Umschalt auch alles, was darunter eingeklappt ist
text-fold-hint = Seinen Text und was darunter ist einklappen
text-fold-shift = Seinen Text und was darunter ist einklappen · mit Umschalt alles ausklappen, was darunter eingeklappt ist
text-open-all = Alles ausklappen
text-open-all-under = Alles ausklappen, was darunter eingeklappt ist
text-fold-all-under = Alles darunter einklappen
text-fold-all-under-hint = Von dem, was direkt darunter ist, werden die Namen gezeigt, und nichts Tieferes
# What is folded away, in its place: whether the element's own text is (text is
# "yes" or "no"), how many elements under it, and how many words in all, which
# may be none.
text-folded = { $text ->
    [yes] { $parts ->
        [0] Sein Text eingeklappt
        [one] Sein Text und { $parts } Element eingeklappt
       *[other] Sein Text und { $parts } Elemente eingeklappt
    }
   *[no] { $parts ->
        [one] { $parts } Element eingeklappt
       *[other] { $parts } Elemente eingeklappt
    }
}{ $words ->
    [0] {""}
    [one] , { $words } Wort
   *[other] , { $words } Wörter
}

## Associations, in the margin

text-associations = Verbindungen
text-outline = Gliederung
text-outline-between = Zwischen der Gliederung und dem Text
text-outline-fold = Einklappen, was darunter ist
text-outline-open = Ausklappen, was darunter ist
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
