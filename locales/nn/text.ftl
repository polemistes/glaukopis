# An element as text: its name the title, the elements under it one after
# another, each a heading and its text.

text-title = Tittel
text-name = Namnet på elementet
text-grip = Flytt eller endre dette elementet
# Where elements dragged in the text would go, said by the line drawn there.
text-drop-under = Under «{ $name }»
text-drop-after = Etter «{ $name }»
text-drop-before = Framfor «{ $name }»
text-split = Del her
text-heading-kept = Det som står etter markøren, har noko eit namn ikkje kan romme, som ei kjeldetilvising eller ein note, og er det første avsnittet i det nye elementet
text-join = Slå saman med elementet over
text-open-as-map = Gå inn

## Folding away what is under an element, and its text

# What is folded away, in its place: whether the element's own text is (text is
# "yes" or "no"), how many elements under it, and how many words in all, which
# may be none.
text-folded = { $text ->
    [yes] { $parts ->
        [0] Teksten er bretta saman
        [one] Teksten og { $parts } element er bretta saman
       *[other] Teksten og { $parts } element er bretta saman
    }
   *[no] { $parts ->
        [one] { $parts } element er bretta saman
       *[other] { $parts } element er bretta saman
    }
}{ $words ->
    [0] {""}
    [one] , { $words } ord
   *[other] , { $words } ord
}

## Associations, in the margin

text-associations = Assosiasjonar
text-outline = Disposisjon
text-outline-between = Mellom disposisjonen og teksten
text-go-to = Gå til «{ $name }»
text-add-label = Legg til ein merkelapp …
text-change-label = Endre merkelappen …
text-remove-association = Fjern assosiasjonen
text-hint-linking = Klikk på namnet til elementet du vil knyte til · { $esc } for å avbryte

## Under the text

text-notes = { $count ->
    [one] { $count } note
   *[other] { $count } notar
}
# The keys are shown as keys, where the variables stand.
text-keys = { $alt }+{ $enter } nytt element · { $alt }+{ $shift }+{ $enter } eitt under det · { $at } vis til

## Fewer words, stage 2 (agent "chrome")

# A clone in the text: the original's name is shown in bold where the variable stands.
text-clone = Klon av { $name }
text-clone-go = Gå til originalen
text-unfold = Brett ut dette elementet
text-fold-this = Brett saman dette elementet
text-unfold-all-under = Brett ut alle underelementa
text-fold-all-sub = Brett saman alle underelementa
text-unfold-all = Brett ut alt
# The tooltips of the mark that folds an element in the text.
text-unfold-shift = Brett ut · med Shift: alle underelementa òg
text-fold-this-shift = Brett saman dette elementet · med Shift: brett ut alle underelementa
# The buttons of the outline.
text-outline-unfold = Brett ut underelementa
text-outline-fold-sub = Brett saman underelementa
