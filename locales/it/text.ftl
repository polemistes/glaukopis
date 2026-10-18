# An element as text: its name the title, the elements under it one after
# another, each a heading and its text.

text-title = Titolo
text-name = Nome dell'elemento
text-not-printed = non stampato
text-grip = Sposta o modifica questo elemento
# The element an element stands for, whose name is shown in bold where the variable stands.
text-include = Nel documento, qui sta { $name }, con tutto ciò che ha sotto.
text-include-open = Aprilo
# Where elements dragged in the text would go, said by the line drawn there.
text-drop-under = Sotto «{ $name }»
text-drop-after = Dopo «{ $name }»
text-drop-before = Prima di «{ $name }»
text-split = Dividi qui
text-split-hint = Ciò che segue il cursore diventa un nuovo elemento
text-join = Unisci all'elemento sopra
text-open-as-map = Apri come mappa
text-open-as-map-hint = Si mostra da solo, con ciò che ha sotto

## Folding away what is under an element, and its text

text-open = Aprilo
text-fold = Ripiegalo
text-open-shift = Aprilo · con Maiusc, anche tutto ciò che è ripiegato sotto
text-fold-hint = Ripiega il suo testo e ciò che sta sotto
text-fold-shift = Ripiega il suo testo e ciò che sta sotto · con Maiusc, apri tutto ciò che è ripiegato sotto
text-open-all = Apri tutto
text-open-all-under = Apri tutto ciò che è ripiegato sotto
text-fold-all-under = Ripiega tutto ciò che sta sotto
text-fold-all-under-hint = Di ciò che sta direttamente sotto si mostrano i nomi, e nulla di più profondo
# What is folded away, in its place: whether the element's own text is (text is
# "yes" or "no"), how many elements under it, and how many words in all, which
# may be none.
text-folded = { $text ->
    [yes] { $parts ->
        [0] Il suo testo ripiegato
        [one] Il suo testo e { $parts } elemento ripiegati
        [many] Il suo testo e { $parts } elementi ripiegati
       *[other] Il suo testo e { $parts } elementi ripiegati
    }
   *[no] { $parts ->
        [one] { $parts } elemento ripiegato
        [many] { $parts } elementi ripiegati
       *[other] { $parts } elementi ripiegati
    }
}{ $words ->
    [0] {""}
    [one] , { $words } parola
    [many] , { $words } parole
   *[other] , { $words } parole
}

## Associations, in the margin

text-associations = Associazioni
text-outline = Struttura
text-outline-between = Tra la struttura e il testo
text-outline-fold = Ripiega ciò che sta sotto
text-outline-open = Apri ciò che sta sotto
text-go-to = Vai a «{ $name }»
text-add-label = Aggiungi un'etichetta…
text-change-label = Cambia l'etichetta…
text-remove-association = Togli l'associazione
text-hint-linking = Fai clic sul nome dell'elemento da associare · { $esc } per lasciar perdere

## Under the text

text-notes = { $count ->
    [one] { $count } nota
    [many] { $count } note
   *[other] { $count } note
}
# The keys are shown as keys, where the variables stand.
text-keys = { $ctrl }+{ $enter } nuovo elemento · { $ctrl }+{ $shift }+{ $enter } uno sotto · { $at } cita
