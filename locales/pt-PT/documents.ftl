# Documents that are brought in, each to become a map (ADR 0012), in
# English. See locales/README.md.

documents-choose = Um documento a trazer
documents-filter = Documentos
documents-filter-all = Todos os ficheiros
documents-title-map = Um mapa a partir de um documento
documents-title-project = Um projeto a partir de um documento
documents-reading = A ler { $file }…
documents-reading-hint = Um documento longo leva um momento.
documents-no-pandoc = Os documentos deste tipo são lidos pelo Pandoc, que não está instalado ou não foi encontrado. Onde ele está pode dizer-se nas definições.
documents-unread = Não foi possível ler o ficheiro.
documents-title = Título
documents-title-hint-map = O nome do mapa, e do elemento no seu centro.
documents-title-hint-project = O nome do projeto, do seu mapa, e do elemento no centro do mapa.
# What a project made of a document is called when the document has no title.
documents-untitled = Sem título

## What the document holds, under the number of each.

documents-parts = { $count ->
    [one] Parte
    [many] Partes
   *[other] Partes
}
documents-words = { $count ->
    [one] Palavra
    [many] Palavras
   *[other] Palavras
}
documents-notes = { $count ->
    [one] Nota
    [many] Notas
   *[other] Notas
}
documents-figures = { $count ->
    [one] Figura
    [many] Figuras
   *[other] Figuras
}
documents-tables = { $count ->
    [one] Tabela
    [many] Tabelas
   *[other] Tabelas
}
documents-equations = { $count ->
    [one] Equação
    [many] Equações
   *[other] Equações
}

## How often the document cites works of the library, and works the library does not have.

documents-cited-in-library = Obras da biblioteca são citadas { $cited ->
        [1] uma vez
        [2] duas vezes
       *[other] { $cited } vezes
    }.
documents-cited-not-in-library = Obras que não estão na biblioteca são citadas { $missing ->
        [1] uma vez
        [2] duas vezes
       *[other] { $missing } vezes
    }.
documents-cited-both = Obras da biblioteca são citadas { $cited ->
        [1] uma vez
        [2] duas vezes
       *[other] { $cited } vezes
    }, e obras que não estão nela { $missing ->
        [1] uma vez
        [2] duas vezes
       *[other] { $missing } vezes
    }.

## The citations that were found in it (ADR 0015).

documents-found = { $count ->
    [one] Encontrou-se uma citação.
    [many] Encontraram-se { $count } citações.
   *[other] Encontraram-se { $count } citações.
}
documents-found-made = { $count ->
    [one] Encontrou-se uma citação, feita por um programa que guarda referências.
    [many] Encontraram-se { $count } citações, todas feitas por um programa que guarda referências.
   *[other] Encontraram-se { $count } citações, todas feitas por um programa que guarda referências.
}
documents-found-some-made = Encontraram-se { $count } citações, { $made } delas feitas por um programa que guarda referências.
documents-at-once = Fazer desde já citações das que o Zotero fez de obras que a biblioteca tem
# Under the choice: what becomes of a note that holds one of them.
documents-at-once-notes = Uma nota que não é mais do que uma citação torna-se uma citação na linha, que o estilo de citação põe numa nota ou na linha; uma nota que diz mais guarda a sua citação. O que se escolheu para as notas no painel das citações encontradas, para todas as que se seguem, vale também aqui.
documents-go-through-map = Percorrer as citações quando o mapa se fizer
documents-go-through-project = Percorrer as citações quando o projeto se fizer

## Making the map.

# Over what the one who brings the document in should know of it.
documents-to-know = A saber
documents-making = A fazer o mapa…
documents-make-map = Fazer o mapa
documents-make-project = Fazer o projeto
documents-map-failed = Não foi possível fazer o mapa.
