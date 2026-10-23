# An element as text: its name the title, the elements under it one after
# another, each a heading and its text.

text-title = Titel
text-name = Elementets navn
text-not-printed = udskrives ikke
text-grip = Flyt eller ændr dette element
# The element an element stands for, whose name is shown in bold where the variable stands.
text-include = I dokumentet står { $name } her, med alt under det.
text-include-open = Åbn det
# Where elements dragged in the text would go, said by the line drawn there.
text-drop-under = Under »{ $name }«
text-drop-after = Efter »{ $name }«
text-drop-before = Før »{ $name }«
text-split = Del her
text-join = Slå sammen med elementet over
text-open-as-map = Åbn som kort
text-open-as-map-hint = Det vises alene, med det, der er under det

## Folding away what is under an element, and its text

text-open = Fold ud
text-fold = Fold sammen
text-open-shift = Fold ud · med Skift også alt, der er foldet sammen under det
text-fold-hint = Fold dets tekst og det, der er under det, sammen
text-fold-shift = Fold dets tekst og det, der er under det, sammen · med Skift: fold alt ud, der er foldet sammen under det
text-open-all = Fold alt ud
text-open-all-under = Fold alt ud, der er foldet sammen under det
text-fold-all-under = Fold alt under det sammen
text-fold-all-under-hint = Af det, der står lige under det, vises navnene, og intet dybere
# What is folded away, in its place: whether the element's own text is (text is
# "yes" or "no"), how many elements under it, and how many words in all, which
# may be none.
text-folded = { $text ->
    [yes] { $parts ->
        [0] Dets tekst foldet sammen
        [one] Dets tekst og { $parts } element foldet sammen
       *[other] Dets tekst og { $parts } elementer foldet sammen
    }
   *[no] { $parts ->
        [one] { $parts } element foldet sammen
       *[other] { $parts } elementer foldet sammen
    }
}{ $words ->
    [0] {""}
    [one] , { $words } ord
   *[other] , { $words } ord
}

## Associations, in the margin

text-associations = Associationer
text-outline = Disposition
text-outline-between = Mellem dispositionen og teksten
text-outline-fold = Fold det, der er under det, sammen
text-outline-open = Fold det, der er under det, ud
text-go-to = Gå til »{ $name }«
text-add-label = Tilføj en mærkat…
text-change-label = Ændr mærkaten…
text-remove-association = Fjern associationen
text-hint-linking = Klik på navnet på det element, der skal knyttes til · { $esc } for at lade være

## Under the text

text-notes = { $count ->
    [one] { $count } note
   *[other] { $count } noter
}
# The keys are shown as keys, where the variables stand.
