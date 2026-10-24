# An element as text: its name the title, the elements under it one after
# another, each a heading and its text.

text-title = Titel
text-name = Elementets navn
text-grip = Flyt eller ændr dette element
# Where elements dragged in the text would go, said by the line drawn there.
text-drop-under = Under »{ $name }«
text-drop-after = Efter »{ $name }«
text-drop-before = Før »{ $name }«
text-split = Del her
text-join = Slå sammen med elementet over
text-open-as-map = Åbn som kort

## Folding away what is under an element, and its text

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
