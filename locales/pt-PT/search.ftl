# Searching: in the text of a map, in the edit box of an element, and
# through everything. See locales/README.md and docs/adr/0017.

## The bar over a text

search-find = Procurar
search-replace-with = Substituir por
search-replace = Substituir
search-replace-all = Substituir tudo
search-previous = O anterior
search-next = O seguinte
search-close = Fechar a procura
search-show-replace = Substituir também
search-hide-replace = Só procurar
# Which of those found is shown: "3 of 17".
search-count = { $current } de { $count }
search-found = { $count ->
    [one] Um encontrado
    [many] { $count } encontrados
   *[other] { $count } encontrados
}
search-nothing = Nada encontrado
search-invalid = Não é uma expressão regular
search-replaced = { $count ->
    [0] Nada substituído
    [one] Um substituído
    [many] { $count } substituídos
   *[other] { $count } substituídos
}

## The options

search-case = Maiúsculas tal como escritas
search-whole-words = Só palavras inteiras
search-accents = Letras com e sem acento por igual
search-accents-sign = é=e
search-regex = Uma expressão regular
search-selection = Só no texto selecionado
search-selection-none = Selecione texto primeiro, para procurar só nele
search-labels = Também nas citações, fórmulas e remissões
search-labels-outside = Também no que está fora dos textos

## The search through everything

search-everything = Procurar
search-everything-title = Procurar em tudo
search-everything-field = Procurar nos projetos
search-last-project = O último projeto
search-all-projects = Todos os projetos
search-reading = A ler { $name }…
search-no-projects = Não há projetos onde procurar.
search-more = { $count ->
    [one] e mais um
    [many] e mais { $count }
   *[other] e mais { $count }
}
search-in-project = { $count ->
    [one] Um neste projeto
    [many] { $count } neste projeto
   *[other] { $count } neste projeto
}
search-everything-found = { $count ->
    [one] Um encontrado
    [many] { $count } encontrados
   *[other] { $count } encontrados
} { $projects ->
    [one] num projeto
    [many] em { $projects } projetos
   *[other] em { $projects } projetos
}
search-where-details = Os dados do documento
# An association that has a name, with the elements at its ends: "Part 1 ↔ Part 2".
search-where-association = A associação { $ends }
search-where-note = O que pensa de { $work }
# Said before what was found in a note.
search-in-note = nota
search-untitled = Sem título
search-could-not-read = Não foi possível ler { $name }.
