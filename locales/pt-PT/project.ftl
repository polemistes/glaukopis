# A project: its view, the tabs of its maps, what is done to elements, and
# the panels at the side with the references and the pictures.

project-list-unreadable = Não foi possível ler os projetos

## The view of a project

project-open-failed = Não foi possível abrir o projeto
# Shown under the words above when nothing more is known of why.
project-open-failed-detail = Não foi possível abrir o projeto.
project-back = Voltar aos projetos
project-fetching = A obter o projeto
project-fetching-offline = Não é possível chegar ao servidor. O projeto é obtido quando for possível.
project-fetching-on-the-way = Vem a caminho, do servidor.
project-all-projects = Todos os projetos
project-name = Nome do projeto
project-rename = Mudar o nome do projeto
project-not-saved = Não guardado
project-redo = Refazer
project-view = Vista do mapa
project-view-this = Vista deste mapa
project-diagram = Diagrama
project-text = Texto
project-one-at-a-time = Um de cada vez
project-side-by-side = Dois lado a lado
project-close-side = Fechar este lado
project-references = Referências
project-pictures = Imagens
project-side = Referências, imagens, histórico e alterações
project-side-tabs = O que o painel lateral mostra
project-side-map = Mapa
project-preview = Pré-visualização e exportação
project-share = Partilhar
project-shared = Partilhado
project-shared-offline = Partilhado · não é possível chegar ao servidor
project-shared-too-large = Partilhado · o servidor não aceita as últimas alterações
project-between-maps = Entre os dois mapas
project-between-preview = Entre o mapa e a pré-visualização
project-between-pictures = Entre o mapa e as imagens
project-between-references = Entre o mapa e as referências

## When the sharing ends from the other side

project-unshared = O projeto já não está partilhado
project-unshared-this = Este projeto já não está partilhado
project-left-out = Já não está entre os colaboradores
project-unshared-unfetched = Ainda não tinha sido obtido, por isso nada dele está neste computador.
project-unshared-kept = Quem o partilhava tirou-o do servidor. Fica com o projeto como está agora, e pode continuar a trabalhar nele por sua conta.
project-left-out-kept = Fica com o projeto como está agora, e pode continuar a trabalhar nele por sua conta. O que os outros escreverem depois disto não lhe chega.
project-understood = Entendido

## Files dropped on the project

project-drop-picture = Largue uma imagem sobre o elemento a que pertence
project-cited-in = { $count ->
    [one] A referência é citada em «{ $name }»
    [many] { $count } referências são citadas em «{ $name }»
   *[other] { $count } referências são citadas em «{ $name }»
}
# As above, where the element has no name.
project-cited-in-element = { $count ->
    [one] A referência é citada no elemento
    [many] { $count } referências são citadas no elemento
   *[other] { $count } referências são citadas no elemento
}

## The tabs of the maps

# The name of a map, or of an element, that has none.
project-untitled = Sem título
# The name of a copy of a map.
project-map-copy = { $name }, cópia
project-maps = Mapas
project-map-name = Nome do mapa
project-new-map = Novo mapa
project-map-from-document = Um mapa a partir de um documento…
project-drop-on-map = Largue sobre um mapa para mover para lá · com Ctrl premido, copia
project-duplicate = Duplicar
project-duplicate-hint = Uma cópia para trabalhar; este fica como está
project-open-beside = Abrir ao lado
project-open-beside-hint = Dois mapas lado a lado, para mover elementos entre eles
project-this-map-actions = Este mapa, e os mapas
project-maps-hint = Os mapas do projeto: escolha um para o abrir
project-map-beside = ao lado deste
project-side-by-side-short = Lado a lado
project-preview-short = Pré-visualizar
project-found = Citações encontradas…
# The count is of those found in the map.
project-found-hint = { $count } por percorrer, e tornar citações
project-found-none = E texto que parece citações
project-delete-map = Eliminar o mapa
project-delete-map-title = Eliminar o mapa «{ $name }»?
project-delete-map-message = { $count ->
    [one] { $count } elemento e o texto que tem desaparecerão. Pode anular-se enquanto o projeto estiver aberto.
    [many] { $count } elementos e o texto que têm desaparecerão. Pode anular-se enquanto o projeto estiver aberto.
   *[other] { $count } elementos e o texto que têm desaparecerão. Pode anular-se enquanto o projeto estiver aberto.
}
project-copied-to = Copiado para «{ $name }»
project-moved-to = Movido para «{ $name }»

## What is done to elements, in the diagram and in the text

project-add-under = Acrescentar um elemento sob ele
project-add = Acrescentar um elemento
project-add-after = Acrescentar um elemento depois dele
project-write-text = Escrever o seu texto
project-double-click = Duplo clique
project-associate = Associar a…
project-associate-hint = Depois clique no outro elemento
project-heading = Imprimir o nome como título
project-heading-hint = Desligado: o nome é um rótulo para si; só o texto se imprime
project-leave-out = Deixar fora do documento
project-leave-out-hint = Com tudo o que está sob ele
# An element that stands for another map: in the document, that map is in its place.
project-stands-for = Representa «{ $name }»
project-stand-for = Representar outro mapa
project-stand-for-heading = No documento, este mapa toma o seu lugar
project-stand-for-none = Nenhum
project-copy-to-map = Copiar para o mapa
project-copy = Copiar
# Pasting what was copied under the element the menu is of.
project-paste-under = Colar sob ele
project-move-to-map = Mover para o mapa
project-map-from-branch = Novo mapa a partir deste ramo
project-map-from-branch-hint = Uma cópia para trabalhar; este fica
project-detach = Soltar do elemento acima
project-detach-hint = Um elemento solto, para colocar mais tarde
project-tidy-branch = Arrumar este ramo
project-place-automatically = Colocar automaticamente
project-delete-keeping = Eliminar, guardando o que está sob ele
project-centre-stays = O centro de um mapa fica
project-centre-stays-detail = Elimine o próprio mapa a partir do seu separador.
# One element was deleted, with the elements that were under it.
project-deleted = { $under ->
    [0] «{ $name }» foi eliminado
    [one] «{ $name }» foi eliminado, com { $under } elemento sob ele
    [many] «{ $name }» foi eliminado, com { $under } elementos sob ele
   *[other] «{ $name }» foi eliminado, com { $under } elementos sob ele
}
project-deleted-many = { $count ->
    [one] { $count } elemento eliminado
    [many] { $count } elementos eliminados
   *[other] { $count } elementos eliminados
}

project-delete-busy-title = Alguém está a escrever aqui
# $names: those who are at what would be deleted, as a list.
project-delete-busy-message = { $names } { $count ->
    [one] está
    [many] estão
   *[other] estão
} a trabalhar no que seria eliminado. O que aí se escreve agora perder-se-ia com ele, e não poderia ser trazido de volta.
project-delete-busy-confirm = Eliminar mesmo assim

## An element, open for writing, and as it is shown when the pointer rests on it

project-element = Elemento
project-name-placeholder = Nome
project-write-here = Escreva aqui. Escreva @ para citar.
project-words = { $count ->
    [one] { $count } palavra
    [many] { $count } palavras
   *[other] { $count } palavras
}
project-read-on = Duplo clique para continuar a ler
project-stands-for-map = Representa o mapa «{ $name }»
project-name-not-printed = O nome não se imprime
project-left-out-of-document = Fora do documento

## The panels at the side: the references and the pictures

project-this-map = Este mapa
project-project = Projeto
project-library = Biblioteca
project-nothing-found = Nada encontrado
project-edit-reference = Alterar a referência…
project-new-reference = Nova referência
project-import-file = Importar um ficheiro
project-which-references = Que referências
project-search-references = Procurar referências
project-library-empty = A biblioteca está vazia
project-library-empty-hint = Acrescente uma referência, ou importe as que tem.
project-no-references = Ainda não há referências
project-no-references-hint = O que citar enquanto escreve fica listado aqui. Para citar, escolha Citar sobre o texto, ou escreva @.
project-cited-in-heading = Citada em
project-not-cited = Não é citada neste projeto.
project-references-drag = Arraste uma referência para dentro de um texto para a citar aí, ou para cima de um elemento para a citar no fim do seu texto.
# The count is of the references the project cites that the library lacks.
project-references-foreign = { $count ->
    [one] { $count } neste projeto não está na biblioteca.
    [many] { $count } neste projeto não estão na biblioteca.
   *[other] { $count } neste projeto não estão na biblioteca.
}
# The store of pictures.
project-store = Acervo
project-open-picture = Abrir…
project-put-into-text = Pôr no texto
project-add-pictures = Acrescentar imagens de ficheiros
project-which-pictures = Que imagens
project-search-pictures = Procurar imagens
project-a-picture = Uma imagem
project-with-notes = Com notas
project-not-on-computer = Não está neste computador
project-nothing-said = Ainda nada se diz dela
project-store-empty = O acervo está vazio
project-store-empty-hint = Acrescente imagens de ficheiros, ou largue-as sobre um texto.
project-no-pictures = Ainda não há imagens
project-no-pictures-map = As imagens das figuras deste mapa ficam listadas aqui. As do acervo estão em Acervo.
project-no-pictures-project = As imagens das figuras do projeto ficam listadas aqui. As do acervo estão em Acervo.
project-pictures-drag = Arraste uma imagem para dentro de um texto para aí fazer dela uma figura, ou para cima de um elemento para a pôr no fim do seu texto.
# The count is of the pictures that are used and are not in the store of this computer.
project-pictures-absent-map = { $count ->
    [one] { $count } neste mapa não está neste computador.
    [many] { $count } neste mapa não estão neste computador.
   *[other] { $count } neste mapa não estão neste computador.
}
project-pictures-absent-project = { $count ->
    [one] { $count } neste projeto não está neste computador.
    [many] { $count } neste projeto não estão neste computador.
   *[other] { $count } neste projeto não estão neste computador.
}

## Shared by the diagram and the text

# A count of elements that stands alone, as a label of what is dragged.
project-elements = { $count ->
    [one] { $count } elemento
    [many] { $count } elementos
   *[other] { $count } elementos
}
# One of the others who work on a shared project is at an element.
project-other-here = { $name } está aqui
project-link-placeholder = Como se relacionam
project-link-label = Rótulo da associação

## A copy and its original, in another map.
copy-title = A cópia e o seu original
copy-from = Copiado de «{ $name }» no mapa «{ $map }»
copy-original-changed = O original mudou desde que foi copiado, ou desde que isso se viu pela última vez.
copy-original-same = O original está como estava quando foi copiado.
copy-original-unknown = Não se sabe se o original mudou desde que foi copiado: a cópia foi feita antes de isso se guardar.
copy-original-gone = O original já lá não está.
copy-how-shown = Abaixo, rasurado, está o que só o original tem, e marcado, o que só esta cópia tem.
copy-alike = Os nomes e os textos são iguais. Podem diferir no que não são palavras: citações, imagens, marcas.
copy-only-original = Só no original
copy-only-copy = Só nesta cópia
copy-go = Ir ao original
copy-seen = Manter esta cópia como está
copy-take = Tomar o nome e o texto do original
copy-changed-mark = O original mudou desde que isto foi copiado
copy-compare = Comparar com o original…
copy-copied-from = Copiado de «{ $name }» em «{ $map }»
copy-copied-from-changed = Copiado de «{ $name }» em «{ $map }», que mudou desde então

## How far the writing of an element has come, as its writer says.
status = Estado
status-idea = Ideia
status-draft = Rascunho
status-done = Concluído
status-none = Sem estado
# Of an element, where its status is shown: "Draft · 340 words".
status-of = { $status } · { $count ->
    [one] { $count } palavra
    [many] { $count } palavras
   *[other] { $count } palavras
}
status-count-idea = { $count ->
    [one] { $count } ideia
    [many] { $count } ideias
   *[other] { $count } ideias
}
status-count-draft = { $count ->
    [one] { $count } rascunho
    [many] { $count } rascunhos
   *[other] { $count } rascunhos
}
status-count-done = { $count } concluídos
# The words of the drafts and of what is done, in a map.
status-words-written = { $count ->
    [one] { $count } palavra escrita
    [many] { $count } palavras escritas
   *[other] { $count } palavras escritas
}
status-progress = Até onde o mapa chegou
