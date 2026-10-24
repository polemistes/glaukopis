# A map as text: the elements one after another, each a heading and its text.

text-title = Titel
text-name = Naam van het element
text-grip = Dit element verplaatsen of wijzigen
text-split = Hier splitsen
text-join = Aan het element erboven vastmaken

## Folding away what is under an element, and its text

# What is folded away, in its place: whether the element's own text is (text is
# "yes" or "no"), how many elements under it, and how many words in all, which
# may be none.
text-folded = { $text ->
    [yes] { $parts ->
        [0] De tekst ingevouwen
        [one] De tekst en { $parts } element ingevouwen
       *[other] De tekst en { $parts } elementen ingevouwen
    }
   *[no] { $parts ->
        [one] { $parts } element ingevouwen
       *[other] { $parts } elementen ingevouwen
    }
}{ $words ->
    [0] {""}
    [one] , { $words } woord
   *[other] , { $words } woorden
}

## Associations, in the margin

text-associations = Verbindingen
text-outline = Overzicht
text-outline-between = Tussen het overzicht en de tekst
text-go-to = Naar ‘{ $name }’ gaan
text-add-label = Een label toevoegen…
text-change-label = Het label wijzigen…
text-remove-association = De verbinding verwijderen
text-hint-linking = Klik op de naam van het element om mee te verbinden · { $esc } om het te laten

## Under the text

text-notes = { $count ->
    [one] { $count } noot
   *[other] { $count } noten
}
# The keys are shown as keys, where the variables stand.
