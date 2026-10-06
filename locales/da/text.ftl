# A map as text: the elements one after another, each a heading and its text.

text-title = Titel
text-name = Elementets navn
text-first-section = Skriv her, eller tryk Ctrl+Enter for at begynde den første del.
text-not-printed = udskrives ikke
text-grip = Flyt eller ændr dette element
# The map an element stands for, which is shown in bold where the variable stands.
text-include = I dokumentet står kortet { $map } her.
text-include-open = Åbn det
text-loose = Løse elementer
text-loose-hint = Tanker, der endnu ikke har nogen plads. De er ikke en del af dokumentet.
text-split = Del her
text-split-hint = Det, der følger efter markøren, bliver et nyt element
text-join = Slå sammen med elementet over

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
text-keys = { $alt }+{ $enter } nyt element · { $alt }+{ $shift }+{ $enter } et under det · { $at } henvis
