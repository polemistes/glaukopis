# A map as text: the elements one after another, each a heading and its text.

text-title = Título
text-name = Nome do elemento
text-first-section = Escreva aqui, ou prima Ctrl+Enter para começar a primeira secção.
text-not-printed = não se imprime
text-grip = Mover ou alterar este elemento
# The map an element stands for, which is shown in bold where the variable stands.
text-include = No documento, o mapa { $map } fica aqui.
text-include-open = Abri-lo
text-loose = Elementos soltos
text-loose-hint = Pensamentos que ainda não têm lugar. Não fazem parte do documento.
text-split = Dividir aqui
text-split-hint = O que se segue ao cursor passa a ser um novo elemento
text-join = Juntar ao elemento acima

## Folding away what is under an element, and its text

text-open = Desdobrar
text-fold = Recolher
text-open-shift = Desdobrar · com Shift, também tudo o que está recolhido sob ele
text-fold-hint = Recolher o seu texto e o que está sob ele
text-fold-shift = Recolher o seu texto e o que está sob ele · com Shift, desdobrar tudo o que está recolhido sob ele
text-open-all = Desdobrar tudo
text-open-all-under = Desdobrar tudo o que está recolhido sob ele
text-fold-all-under = Recolher tudo sob ele
text-fold-all-under-hint = Do que está diretamente sob ele mostram-se os nomes, e nada mais fundo
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
text-outline-fold = Recolher o que está sob ele
text-outline-open = Desdobrar o que está sob ele
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
text-keys = { $alt }+{ $enter } novo elemento · { $alt }+{ $shift }+{ $enter } um sob ele · { $at } citar
