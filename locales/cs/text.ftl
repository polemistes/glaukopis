# A map as text: the elements one after another, each a heading and its text.

text-title = Název
text-name = Název prvku
text-grip = Přesunout nebo změnit tento prvek
text-split = Rozdělit zde
text-join = Připojit k prvku nad ním

## Folding away what is under an element, and its text

# What is folded away, in its place: whether the element's own text is (text is
# "yes" or "no"), how many elements under it, and how many words in all, which
# may be none.
text-folded = { $text ->
    [yes] { $parts ->
        [0] Jeho text sbalen
        [one] Jeho text a { $parts } prvek sbaleny
        [few] Jeho text a { $parts } prvky sbaleny
       *[other] Jeho text a { $parts } prvků sbaleno
    }
   *[no] { $parts ->
        [one] { $parts } prvek sbalen
        [few] { $parts } prvky sbaleny
       *[other] { $parts } prvků sbaleno
    }
}{ $words ->
    [0] {""}
    [one] , { $words } slovo
    [few] , { $words } slova
   *[other] , { $words } slov
}

## Associations, in the margin

text-associations = Spojení
text-outline = Osnova
text-outline-between = Mezi osnovou a textem
text-go-to = Přejít na „{ $name }“
text-add-label = Přidat popisek…
text-change-label = Změnit popisek…
text-remove-association = Odstranit spojení
text-hint-linking = Klepněte na název prvku, s nímž má být spojen · { $esc } to ukončí

## Under the text

text-notes = { $count ->
    [one] { $count } poznámka
    [few] { $count } poznámky
   *[other] { $count } poznámek
}
# The keys are shown as keys, where the variables stand.
