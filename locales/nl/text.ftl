# A map as text: the elements one after another, each a heading and its text.

text-title = Titel
text-name = Naam van het element
text-first-section = Schrijf hier, of druk op Ctrl+Enter om het eerste deel te beginnen.
text-not-printed = niet gedrukt
text-grip = Dit element verplaatsen of wijzigen
# The map an element stands for, which is shown in bold where the variable stands.
text-include = In het document staat hier de mindmap { $map }.
text-include-open = Openen
text-loose = Losse elementen
text-loose-hint = Gedachten die nog geen plaats hebben. Ze horen niet bij het document.
text-split = Hier splitsen
text-split-hint = Wat na de cursor komt, wordt een nieuw element
text-join = Aan het element erboven vastmaken

## Folding away what is under an element, and its text

text-open = Openen
text-fold = Invouwen
text-open-shift = Openen · met Shift ook alles wat eronder is ingevouwen
text-fold-hint = De tekst en wat eronder staat invouwen
text-fold-shift = De tekst en wat eronder staat invouwen · met Shift alles openen wat eronder is ingevouwen
text-open-all = Alles openen
text-open-all-under = Alles openen wat eronder is ingevouwen
text-fold-all-under = Alles eronder invouwen
text-fold-all-under-hint = Van wat er direct onder staat, worden de namen getoond, en niets diepers
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
text-outline-fold = Invouwen wat eronder staat
text-outline-open = Openen wat eronder staat
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
text-keys = { $alt }+{ $enter } nieuw element · { $alt }+{ $shift }+{ $enter } een eronder · { $at } citeren
