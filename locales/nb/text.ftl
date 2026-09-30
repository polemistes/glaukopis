# Et kart som tekst: elementene etter hverandre, hvert med overskrift og tekst.

text-title = Tittel
text-name = Navnet på elementet
text-first-section = Skriv her, eller trykk Ctrl+Enter for å begynne på første del.
text-not-printed = skrives ikke ut
text-grip = Flytt eller endre dette elementet
text-include = I dokumentet står kartet { $map } her.
text-include-open = Åpne det
text-loose = Løse elementer
text-loose-hint = Tanker som ikke har fått en plass ennå. De er ikke en del av dokumentet.
text-split = Del her
text-split-hint = Det som står etter markøren, blir et nytt element
text-join = Slå sammen med elementet over

## Å brette sammen det som står under et element, og teksten til elementet

text-open = Brett ut
text-fold = Brett sammen
text-open-shift = Brett ut · med Shift: også alt som er brettet sammen under
text-fold-hint = Brett sammen teksten og det som står under
text-fold-shift = Brett sammen teksten og det som står under · med Shift: brett ut alt som er brettet sammen under
text-open-all = Brett ut alt
text-open-all-under = Brett ut alt som er brettet sammen under
text-fold-all-under = Brett sammen alt under
text-fold-all-under-hint = Navnene på det som står rett under, vises, og ikke noe dypere
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
text-go-to = Gå til «{ $name }»
text-add-label = Legg til en merkelapp …
text-change-label = Endre merkelappen …
text-remove-association = Fjern assosiasjonen
text-hint-linking = Klikk på navnet til elementet du vil knytte til · { $esc } for å avbryte

## Under teksten

text-cited = { $count ->
    [one] { $count } sitert verk
   *[other] { $count } siterte verk
}
text-notes = { $count ->
    [one] { $count } note
   *[other] { $count } noter
}
text-keys = { $ctrl }+{ $enter } nytt element · { $at } kildehenvisning
