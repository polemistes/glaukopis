# A map as text: the elements one after another, each a heading and its text.

text-title = Naslov
text-name = Naziv elementa
text-first-section = Pišite ovdje, ili pritisnite Ctrl+Enter da započnete prvi odjeljak.
text-not-printed = ne tiska se
text-grip = Premjesti ili izmijeni ovaj element
# The map an element stands for, which is shown in bold where the variable stands.
text-include = U dokumentu ovdje stoji mapa { $map }.
text-include-open = Otvori je
text-loose = Slobodni elementi
text-loose-hint = Misli koje još nemaju svoje mjesto. Nisu dio dokumenta.
text-split = Razdvoji ovdje
text-split-hint = Što slijedi iza pokazivača postaje novi element
text-join = Spoji s elementom iznad

## Folding away what is under an element, and its text

text-open = Rasklopi
text-fold = Sklopi
text-open-shift = Rasklopi · sa Shiftom i sve što je sklopljeno ispod njega
text-fold-hint = Sklopi njegov tekst i ono što je ispod njega
text-fold-shift = Sklopi njegov tekst i ono što je ispod njega · sa Shiftom rasklopi sve što je sklopljeno ispod njega
text-open-all = Rasklopi sve
text-open-all-under = Rasklopi sve što je sklopljeno ispod njega
text-fold-all-under = Sklopi sve ispod njega
text-fold-all-under-hint = Od onoga što je neposredno ispod njega prikazuju se nazivi, a ništa dublje
# What is folded away, in its place: whether the element's own text is (text is
# "yes" or "no"), how many elements under it, and how many words in all, which
# may be none.
text-folded = { $text ->
    [yes] { $parts ->
        [0] Njegov tekst sklopljen
        [one] Njegov tekst i { $parts } element sklopljeni
        [few] Njegov tekst i { $parts } elementa sklopljeni
       *[other] Njegov tekst i { $parts } elemenata sklopljeni
    }
   *[no] { $parts ->
        [one] { $parts } element sklopljen
        [few] { $parts } elementa sklopljena
       *[other] { $parts } elemenata sklopljeno
    }
}{ $words ->
    [0] {""}
    [one] , { $words } riječ
    [few] , { $words } riječi
   *[other] , { $words } riječi
}

## Associations, in the margin

text-associations = Veze
text-outline = Struktura
text-outline-between = Između strukture i teksta
text-outline-fold = Sklopi što je ispod njega
text-outline-open = Rasklopi što je ispod njega
text-go-to = Idi na „{ $name }”
text-add-label = Dodaj oznaku…
text-change-label = Izmijeni oznaku…
text-remove-association = Ukloni vezu
text-hint-linking = Kliknite naziv elementa s kojim ga želite povezati · { $esc } za odustajanje

## Under the text

text-notes = { $count ->
    [one] { $count } bilješka
    [few] { $count } bilješke
   *[other] { $count } bilježaka
}
# The keys are shown as keys, where the variables stand.
text-keys = { $alt }+{ $enter } novi element · { $alt }+{ $shift }+{ $enter } jedan ispod njega · { $at } citiraj
