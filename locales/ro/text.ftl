# A map as text: the elements one after another, each a heading and its text.

text-title = Titlu
text-name = Numele elementului
text-grip = Mută sau modifică acest element
text-split = Desparte aici
text-join = Unește cu elementul de deasupra

## Folding away what is under an element, and its text

# What is folded away, in its place: whether the element's own text is (text is
# "yes" or "no"), how many elements under it, and how many words in all, which
# may be none.
text-folded = { $text ->
    [yes] { $parts ->
        [0] Textul lui strâns
        [one] Textul lui și { $parts } element strânse
        [few] Textul lui și { $parts } elemente strânse
       *[other] Textul lui și { $parts } de elemente strânse
    }
   *[no] { $parts ->
        [one] { $parts } element strâns
        [few] { $parts } elemente strânse
       *[other] { $parts } de elemente strânse
    }
}{ $words ->
    [0] {""}
    [one] , { $words } cuvânt
    [few] , { $words } cuvinte
   *[other] , { $words } de cuvinte
}

## Associations, in the margin

text-associations = Asocieri
text-outline = Schiță
text-outline-between = Între schiță și text
text-go-to = Mergi la „{ $name }”
text-add-label = Adaugă o etichetă…
text-change-label = Schimbă eticheta…
text-remove-association = Scoate asocierea
text-hint-linking = Faceți clic pe numele elementului cu care să-l asociați · { $esc } ca să renunțați

## Under the text

text-notes = { $count ->
    [one] { $count } notă
    [few] { $count } note
   *[other] { $count } de note
}
# The keys are shown as keys, where the variables stand.
