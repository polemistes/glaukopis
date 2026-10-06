# Kinds of elements: what the writer calls them (character, place, source…), each with a colour.

kinds-kind = Tipo
kinds-title = Tipos de elementos
kinds-subtitle = O que os elementos deste projeto podem ser: tantos tipos quantos o trabalho pedir, cada um com a sua cor.
kinds-new = Novo tipo
kinds-new-ellipsis = Novo tipo…
kinds-change = Mudar o tipo
kinds-manage = Tipos deste projeto…
kinds-none-of-them = Nenhum
kinds-none = Ainda não há tipos. Um tipo é um nome e uma cor: personagem, lugar, acontecimento, fonte, argumento, o que o trabalho pedir.
kinds-name = Nome
kinds-name-placeholder = Personagem, lugar, acontecimento…
kinds-name-taken = Já há um tipo com esse nome.
kinds-colour = Cor
kinds-colour-teal = Verde-azulado
kinds-colour-amber = Âmbar
kinds-colour-violet = Violeta
kinds-colour-rose = Rosa
kinds-colour-green = Verde
kinds-colour-blue = Azul
kinds-colour-rust = Ferrugem
kinds-colour-olive = Azeitona
kinds-colour-slate = Ardósia
kinds-colour-plum = Ameixa
kinds-template = Texto para começar
kinds-template-placeholder = Aparência
    Deseja
    Receia
kinds-template-hint = Um elemento sem texto a que se dê este tipo começa com estas linhas, um parágrafo cada.
kinds-begins = Um elemento deste tipo escreve em
kinds-begins-hint = O texto começa neste tipo de parágrafo, onde o elemento ainda não tem nenhum
kinds-create = Criar
kinds-elements = { $count ->
    [one] { $count } elemento
    [many] { $count } elementos
   *[other] { $count } elementos
}
kinds-delete-title = Eliminar o tipo «{ $name }»?
kinds-delete-message = { $count ->
    [0] Nenhum elemento é dele.
    [one] O único elemento que é dele fica sem tipo.
    [many] Os { $count } elementos que são dele ficam sem tipo.
   *[other] Os { $count } elementos que são dele ficam sem tipo.
}
