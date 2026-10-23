# An element as text: its name the title, the elements under it one after
# another, each a heading and its text.

text-title = Tittel
text-name = Namnet på elementet
text-not-printed = blir ikkje skrive ut
text-grip = Flytt eller endre dette elementet
# The element an element stands for, whose name is shown in bold where the variable stands.
text-include = I dokumentet står { $name } her, med alt under seg.
text-include-open = Opne det
# Where elements dragged in the text would go, said by the line drawn there.
text-drop-under = Under «{ $name }»
text-drop-after = Etter «{ $name }»
text-drop-before = Framfor «{ $name }»
text-split = Del her
text-join = Slå saman med elementet over
text-open-as-map = Opne som kart
text-open-as-map-hint = Det blir vist åleine, med det som står under

## Folding away what is under an element, and its text

text-open = Brett ut
text-fold = Brett saman
text-open-shift = Brett ut · med Shift: òg alt som er bretta saman under
text-fold-hint = Brett saman teksten og det som står under
text-fold-shift = Brett saman teksten og det som står under · med Shift: brett ut alt som er bretta saman under
text-open-all = Brett ut alt
text-open-all-under = Brett ut alt som er bretta saman under
text-fold-all-under = Brett saman alt under
text-fold-all-under-hint = Namna på det som står rett under, blir viste, og ikkje noko djupare
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
text-outline-fold = Brett saman det som står under
text-outline-open = Brett ut det som står under
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
