# A map as text: the elements one after another, each a heading and its text.

text-title = Název
text-name = Název prvku
text-first-section = Pište sem, nebo stiskněte Ctrl+Enter a začněte první oddíl.
text-not-printed = netiskne se
text-grip = Přesunout nebo změnit tento prvek
# The map an element stands for, which is shown in bold where the variable stands.
text-include = V dokumentu zde stojí mapa { $map }.
text-include-open = Otevřít ji
text-loose = Volné prvky
text-loose-hint = Myšlenky, které zatím nemají své místo. Nejsou součástí dokumentu.
text-split = Rozdělit zde
text-split-hint = Co následuje za kurzorem, se stane novým prvkem
text-join = Připojit k prvku nad ním

## Folding away what is under an element, and its text

text-open = Rozbalit
text-fold = Sbalit
text-open-shift = Rozbalit · se Shiftem i vše, co je pod ním sbaleno
text-fold-hint = Sbalit jeho text a co je pod ním
text-fold-shift = Sbalit jeho text a co je pod ním · se Shiftem rozbalit vše, co je pod ním sbaleno
text-open-all = Rozbalit vše
text-open-all-under = Rozbalit vše, co je pod ním sbaleno
text-fold-all-under = Sbalit vše pod ním
text-fold-all-under-hint = Z toho, co je přímo pod ním, se zobrazují názvy, a nic hlubšího
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
text-outline-fold = Sbalit, co je pod ním
text-outline-open = Rozbalit, co je pod ním
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
text-keys = { $alt }+{ $enter } nový prvek · { $alt }+{ $shift }+{ $enter } prvek pod ním · { $at } citovat
