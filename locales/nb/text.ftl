# Et element som tekst: navnet som tittel, elementene under etter hverandre,
# hvert med overskrift og tekst.

text-title = Tittel
text-name = Navnet på elementet
text-grip = Flytt eller endre dette elementet
text-include = I dokumentet står { $name } her, med alt under seg.
text-include-open = Åpne det
text-drop-under = Under «{ $name }»
text-drop-after = Etter «{ $name }»
text-drop-before = Foran «{ $name }»
text-split = Del her
text-heading-kept = Det som står etter markøren, har noe et navn ikke kan romme, som en kildehenvisning eller en note, og er blitt første avsnitt i det nye elementet
text-join = Slå sammen med elementet over
text-open-as-map = Gå inn

## Å brette sammen det som står under et element, og teksten til elementet

text-open = Brett ut
text-fold = Brett sammen
text-open-shift = Brett ut · med Shift: også alt som er brettet sammen under
text-fold-hint = Brett sammen teksten og det som står under
text-fold-shift = Brett sammen teksten og det som står under · med Shift: brett ut alt som er brettet sammen under
text-open-all = Brett ut alt
text-open-all-under = Brett ut alt som er brettet sammen under
text-fold-all-under = Brett sammen alt under
text-folded = { $text ->
    [yes] { $parts ->
        [0] Teksten er brettet sammen
        [one] Teksten og { $parts } element er brettet sammen
       *[other] Teksten og { $parts } elementer er brettet sammen
    }
   *[no] { $parts ->
        [one] { $parts } element er brettet sammen
       *[other] { $parts } elementer er brettet sammen
    }
}{ $words ->
    [0] {""}
   *[other] , { $words } ord
}

## Assosiasjoner, i margen

text-associations = Assosiasjoner
text-outline = Disposisjon
text-outline-between = Mellom disposisjonen og teksten
text-outline-fold = Fold sammen det som står under
text-outline-open = Åpne det som står under
text-go-to = Gå til «{ $name }»
text-add-label = Legg til en merkelapp …
text-change-label = Endre merkelappen …
text-remove-association = Fjern assosiasjonen
text-hint-linking = Klikk på navnet til elementet du vil knytte til · { $esc } for å avbryte

## Under teksten

text-notes = { $count ->
    [one] { $count } note
   *[other] { $count } noter
}
text-keys = { $alt }+{ $enter } nytt element · { $alt }+{ $shift }+{ $enter } ett under · { $at } kildehenvisning
