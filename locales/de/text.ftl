# A map as text: the elements one after another, each a heading and its text.

text-title = Titel
text-name = Name des Elements
text-first-section = Schreiben Sie hier, oder drücken Sie Strg+Eingabe, um den ersten Abschnitt zu beginnen.
text-not-printed = nicht gedruckt
text-grip = Dieses Element verschieben oder ändern
# The map an element stands for, which is shown in bold where the variable stands.
text-include = Im Dokument steht hier die Karte { $map }.
text-include-open = Öffnen
text-loose = Lose Elemente
text-loose-hint = Gedanken, die noch keinen Platz haben. Sie sind nicht Teil des Dokuments.
text-split = Hier teilen
text-split-hint = Was auf den Cursor folgt, wird ein neues Element
text-join = Mit dem Element darüber zusammenfügen

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
text-keys = { $alt }+{ $enter } neues Element · { $alt }+{ $shift }+{ $enter } eines darunter · { $at } zitieren
