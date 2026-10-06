# A map as text: the elements one after another, each a heading and its text.

text-title = Tytuł
text-name = Nazwa elementu
text-first-section = Pisz tutaj albo naciśnij Ctrl+Enter, by zacząć pierwszą część.
text-not-printed = niedrukowane
text-grip = Przenieś lub zmień ten element
# The map an element stands for, which is shown in bold where the variable stands.
text-include = W dokumencie stoi tu mapa { $map }.
text-include-open = Otwórz ją
text-loose = Luźne elementy
text-loose-hint = Myśli, które nie mają jeszcze miejsca. Nie są częścią dokumentu.
text-split = Podziel tutaj
text-split-hint = To, co za kursorem, staje się nowym elementem
text-join = Połącz z elementem powyżej

## Folding away what is under an element, and its text

text-open = Rozwiń
text-fold = Zwiń
text-open-shift = Rozwiń · z Shiftem także wszystko, co pod nim zwinięte
text-fold-hint = Zwiń jego tekst i to, co pod nim
text-fold-shift = Zwiń jego tekst i to, co pod nim · z Shiftem rozwiń wszystko, co pod nim zwinięte
text-open-all = Rozwiń wszystko
text-open-all-under = Rozwiń wszystko, co pod nim zwinięte
text-fold-all-under = Zwiń wszystko pod nim
text-fold-all-under-hint = Z tego, co bezpośrednio pod nim, pokazane są nazwy, i nic głębiej
# What is folded away, in its place: whether the element's own text is (text is
# "yes" or "no"), how many elements under it, and how many words in all, which
# may be none.
text-folded = { $text ->
    [yes] { $parts ->
        [0] Jego tekst zwinięty
        [one] Jego tekst i { $parts } element zwinięte
        [few] Jego tekst i { $parts } elementy zwinięte
        [many] Jego tekst i { $parts } elementów zwinięte
       *[other] Jego tekst i { $parts } elementów zwinięte
    }
   *[no] { $parts ->
        [one] { $parts } element zwinięty
        [few] { $parts } elementy zwinięte
        [many] { $parts } elementów zwiniętych
       *[other] { $parts } elementów zwiniętych
    }
}{ $words ->
    [0] {""}
    [one] , { $words } słowo
    [few] , { $words } słowa
    [many] , { $words } słów
   *[other] , { $words } słów
}

## Associations, in the margin

text-associations = Powiązania
text-outline = Konspekt
text-outline-between = Między konspektem a tekstem
text-outline-fold = Zwiń to, co pod nim
text-outline-open = Rozwiń to, co pod nim
text-go-to = Przejdź do „{ $name }”
text-add-label = Dodaj etykietę…
text-change-label = Zmień etykietę…
text-remove-association = Usuń powiązanie
text-hint-linking = Kliknij nazwę elementu, z którym chcesz powiązać · { $esc }, by zrezygnować

## Under the text

text-notes = { $count ->
    [one] { $count } przypis
    [few] { $count } przypisy
    [many] { $count } przypisów
   *[other] { $count } przypisów
}
# The keys are shown as keys, where the variables stand.
text-keys = { $alt }+{ $enter } nowy element · { $alt }+{ $shift }+{ $enter } element pod nim · { $at } cytuj
