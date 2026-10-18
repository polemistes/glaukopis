# An element as text: its name the title, the elements under it one after
# another, each a heading and its text.

text-title = Titel
text-name = Elementets namn
text-not-printed = skrivs inte ut
text-grip = Flytta eller ändra det här elementet
# The element an element stands for, whose name is shown in bold where the variable stands.
text-include = I dokumentet står { $name } här, med allt under det.
text-include-open = Öppna det
# Where elements dragged in the text would go, said by the line drawn there.
text-drop-under = Under ”{ $name }”
text-drop-after = Efter ”{ $name }”
text-drop-before = Före ”{ $name }”
text-split = Dela här
text-split-hint = Det som följer efter markören blir ett nytt element
text-join = Foga till elementet ovanför
text-open-as-map = Öppna som karta
text-open-as-map-hint = Det visas ensamt, med det som står under det

## Folding away what is under an element, and its text

text-open = Fäll ut
text-fold = Fäll ihop
text-open-shift = Fäll ut · med Skift, också allt som är ihopfällt under det
text-fold-hint = Fäll ihop dess text och det som står under
text-fold-shift = Fäll ihop dess text och det som står under · med Skift, fäll ut allt som är ihopfällt under det
text-open-all = Fäll ut allt
text-open-all-under = Fäll ut allt som är ihopfällt under det
text-fold-all-under = Fäll ihop allt under det
text-fold-all-under-hint = Av det som står direkt under visas namnen, och inget djupare
# What is folded away, in its place: whether the element's own text is (text is
# "yes" or "no"), how many elements under it, and how many words in all, which
# may be none.
text-folded = { $text ->
    [yes] { $parts ->
        [0] Dess text ihopfälld
        [one] Dess text och { $parts } element ihopfällda
       *[other] Dess text och { $parts } element ihopfällda
    }
   *[no] { $parts ->
        [one] { $parts } element ihopfällt
       *[other] { $parts } element ihopfällda
    }
}{ $words ->
    [0] {""}
    [one] , { $words } ord
   *[other] , { $words } ord
}

## Associations, in the margin

text-associations = Associationer
text-outline = Disposition
text-outline-between = Mellan dispositionen och texten
text-outline-fold = Fäll ihop det som står under
text-outline-open = Fäll ut det som står under
text-go-to = Gå till ”{ $name }”
text-add-label = Lägg till en etikett…
text-change-label = Ändra etiketten…
text-remove-association = Ta bort associationen
text-hint-linking = Klicka på namnet på elementet att associera med · { $esc } för att låta bli

## Under the text

text-notes = { $count ->
    [one] { $count } not
   *[other] { $count } noter
}
# The keys are shown as keys, where the variables stand.
text-keys = { $ctrl }+{ $enter } nytt element · { $ctrl }+{ $shift }+{ $enter } ett under det · { $at } hänvisa
