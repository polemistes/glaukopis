# An element as text: its name the title, the elements under it one after
# another, each a heading and its text.

text-title = Titolo
text-name = Nome dell'elemento
text-grip = Sposta o modifica questo elemento
# Where elements dragged in the text would go, said by the line drawn there.
text-drop-under = Sotto «{ $name }»
text-drop-after = Dopo «{ $name }»
text-drop-before = Prima di «{ $name }»
text-split = Dividi qui
text-heading-kept = Ciò che segue il cursore contiene qualcosa che un nome non può tenere, come una citazione o una nota, ed è il primo paragrafo del nuovo elemento
text-join = Unisci all'elemento sopra
text-open-as-map = Entra

## Folding away what is under an element, and its text

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
text-keys = { $alt }+{ $enter } nuovo elemento · { $alt }+{ $shift }+{ $enter } uno sotto · { $at } cita

## Fewer words, stage 2 (agent "chrome")

# A clone in the text: the original's name is shown in bold where the variable stands.
text-clone = Clone di { $name }
text-clone-go = Vai all'originale
text-unfold = Dispiega questo elemento
text-fold-this = Ripiega questo elemento
text-unfold-all-under = Dispiega tutti i sottoelementi
text-fold-all-sub = Ripiega tutti i sottoelementi
text-unfold-all = Dispiega tutto
# The tooltips of the mark that folds an element in the text.
text-unfold-shift = Dispiega · con Maiusc, anche tutti i sottoelementi
text-fold-this-shift = Ripiega questo elemento · con Maiusc, dispiega tutti i sottoelementi
# The buttons of the outline.
text-outline-unfold = Dispiega i sottoelementi
text-outline-fold-sub = Ripiega i sottoelementi
