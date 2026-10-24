# A map as text: the elements one after another, each a heading and its text.

text-title = Título
text-name = Nome do elemento
text-grip = Mover ou alterar este elemento
text-split = Dividir aqui
text-join = Juntar ao elemento acima

## Folding away what is under an element, and its text

# What is folded away, in its place: whether the element's own text is (text is
# "yes" or "no"), how many elements under it, and how many words in all, which
# may be none.
text-folded = { $text ->
    [yes] { $parts ->
        [0] O seu texto recolhido
        [one] O seu texto e { $parts } elemento recolhidos
        [many] O seu texto e { $parts } elementos recolhidos
       *[other] O seu texto e { $parts } elementos recolhidos
    }
   *[no] { $parts ->
        [one] { $parts } elemento recolhido
        [many] { $parts } elementos recolhidos
       *[other] { $parts } elementos recolhidos
    }
}{ $words ->
    [0] {""}
    [one] , { $words } palavra
    [many] , { $words } palavras
   *[other] , { $words } palavras
}

## Associations, in the margin

text-associations = Associações
text-outline = Esquema
text-outline-between = Entre o esquema e o texto
text-go-to = Ir a «{ $name }»
text-add-label = Acrescentar um rótulo…
text-change-label = Alterar o rótulo…
text-remove-association = Remover a associação
text-hint-linking = Clique no nome do elemento a associar · { $esc } para desistir

## Under the text

text-notes = { $count ->
    [one] { $count } nota
    [many] { $count } notas
   *[other] { $count } notas
}
# The keys are shown as keys, where the variables stand.
