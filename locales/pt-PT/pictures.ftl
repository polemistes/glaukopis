# The store of pictures: all the pictures of the application, and one of them.

pictures-title = Imagens
pictures-all = Todas as imagens
pictures-picture = Imagem
pictures-search-placeholder = Procurar nas imagens
pictures-clear-search = Limpar a procura
pictures-count = { $count ->
    [one] { $count } imagem
    [many] { $count } imagens
   *[other] { $count } imagens
}
# How many pictures a search finds, of all there are.
pictures-shown = { $shown } de { $count ->
    [one] { $count } imagem
    [many] { $count } imagens
   *[other] { $count } imagens
}
pictures-add = Acrescentar imagens…
pictures-empty = O acervo está vazio
pictures-empty-text = As imagens que aqui se acrescentam podem usar-se em todos os projetos, e uma imagem posta num texto fica guardada aqui. Acrescente algumas, ou largue-as nesta janela.
pictures-nothing-found = Nada encontrado
pictures-nothing-found-text = Nenhuma imagem contém todas estas palavras.
# What a picture that has no name is called.
pictures-unnamed = Uma imagem
pictures-with-notes = Com notas

## Taking pictures in, and removing them

# The title of the dialog that chooses files, and what it calls the files it offers.
pictures-add-title = Acrescentar imagens
pictures-files = Imagens
pictures-taken-in = { $count ->
    [one] «{ $name }» está no acervo
    [many] { $count } imagens estão no acervo
   *[other] { $count } imagens estão no acervo
}
pictures-remove-title = Remover «{ $name }» do acervo?
pictures-remove-unused = Nenhum projeto usa a imagem. O que dela aqui se diz, e as notas sobre ela, são removidos com ela.
pictures-remove-used = { $count ->
    [one] { $count } projeto usa a imagem. As suas figuras ficarão sem a imagem. O que dela aqui se diz, e as notas sobre ela, são removidos com ela.
    [many] { $count } projetos usam a imagem. As suas figuras ficarão sem a imagem. O que dela aqui se diz, e as notas sobre ela, são removidos com ela.
   *[other] { $count } projetos usam a imagem. As suas figuras ficarão sem a imagem. O que dela aqui se diz, e as notas sobre ela, são removidos com ela.
}
pictures-no-backend = Não há núcleo da aplicação.

## One picture

pictures-name = Nome
pictures-name-placeholder = Como a imagem se chama
pictures-caption = Legenda
pictures-caption-placeholder = O que se diz da imagem
pictures-caption-hint = As figuras feitas com a imagem começam por estas palavras. O que se diz de uma figura pode alterar-se lá sem alterar isto.
pictures-italic = Itálico
pictures-small-caps = Versaletes
# What the picture shows, in words, for those who do not see it.
pictures-alt = Mostra
pictures-alt-placeholder = Por palavras, para quem não a pode ver
pictures-absent = A imagem não está neste computador. É usada no projeto, e mostra-se quando tiver chegado de quem a pôs lá.
pictures-notes = Notas
pictures-note-project = Neste projeto
pictures-note-project-placeholder = O que pensa dela, para este trabalho
pictures-note-project-hint = O que aqui se escreve fica com todos os que têm o projeto.
pictures-note-for-all = Guardar para todos os projetos
pictures-note-write-for-all = Escrever para todos os projetos
pictures-note-all = Em todos os projetos
pictures-note-all-placeholder = O que pensa dela, onde quer que a use
pictures-note-all-hint = Guardada com a imagem no acervo, neste computador.
pictures-note-placeholder = O que pensa dela. Para si: não faz parte de nenhum documento.
pictures-note-label = As suas notas sobre esta imagem
pictures-file = O ficheiro
pictures-kind = Tipo
pictures-kind-svg = SVG, um desenho
pictures-dimensions-label = Largura e altura
pictures-dimensions = { $width } × { $height } pontos
pictures-size = Tamanho
# When the picture was taken into the store.
pictures-added = Acrescentada
pictures-used-in = Usada em
pictures-this-project = Este projeto
# A map that has no name.
pictures-untitled = Sem título
pictures-unused = Nenhum projeto usa a imagem.
pictures-remove = Remover do acervo
