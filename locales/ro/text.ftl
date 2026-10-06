# A map as text: the elements one after another, each a heading and its text.

text-title = Titlu
text-name = Numele elementului
text-first-section = Scrieți aici, sau apăsați Ctrl+Enter ca să începeți prima secțiune.
text-not-printed = nu se tipărește
text-grip = Mută sau modifică acest element
# The map an element stands for, which is shown in bold where the variable stands.
text-include = În document, aici stă harta { $map }.
text-include-open = Deschide-o
text-loose = Elemente libere
text-loose-hint = Gânduri care nu au încă loc. Nu fac parte din document.
text-split = Desparte aici
text-split-hint = Ce urmează după cursor devine un element nou
text-join = Unește cu elementul de deasupra

## Folding away what is under an element, and its text

text-open = Desfă-l
text-fold = Strânge-l
text-open-shift = Desfă-l · cu Shift, și tot ce este strâns sub el
text-fold-hint = Strânge textul lui și ce este sub el
text-fold-shift = Strânge textul lui și ce este sub el · cu Shift, desfă tot ce este strâns sub el
text-open-all = Desfă tot
text-open-all-under = Desfă tot ce este strâns sub el
text-fold-all-under = Strânge tot ce este sub el
text-fold-all-under-hint = Din ce este direct sub el se arată numele, și nimic mai adânc
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
text-outline-fold = Strânge ce este sub el
text-outline-open = Desfă ce este sub el
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
text-keys = { $alt }+{ $enter } element nou · { $alt }+{ $shift }+{ $enter } unul sub el · { $at } citează
