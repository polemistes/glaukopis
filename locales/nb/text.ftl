# Et element som tekst: navnet som tittel, elementene under etter hverandre,
# hvert med overskrift og tekst.

text-title = Tittel
text-name = Navnet på elementet
text-grip = Flytt eller endre dette elementet
text-drop-under = Under «{ $name }»
text-drop-after = Etter «{ $name }»
text-drop-before = Foran «{ $name }»
text-split = Del her
text-heading-kept = Det som står etter markøren, har noe et navn ikke kan romme, som en kildehenvisning eller en note, og er blitt første avsnitt i det nye elementet
text-join = Slå sammen med elementet over
text-open-as-map = Gå inn

## Å brette sammen det som står under et element, og teksten til elementet

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

## Fewer words, stage 2 (agent "chrome")

# A clone in the text: the original's name is shown in bold where the variable stands.
text-clone = Klon av { $name }
text-clone-go = Gå til originalen
text-unfold = Brett ut dette elementet
text-fold-this = Brett sammen dette elementet
text-unfold-all-under = Brett ut alle underelementer
text-fold-all-sub = Brett sammen alle underelementer
text-unfold-all = Brett ut alt
# The tooltips of the mark that folds an element in the text.
text-unfold-shift = Brett ut · med Shift: alle underelementer også
text-fold-this-shift = Brett sammen dette elementet · med Shift: brett ut alle underelementer
# The buttons of the outline.
text-outline-unfold = Brett ut underelementene
text-outline-fold-sub = Brett sammen underelementene
