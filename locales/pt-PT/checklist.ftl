# The checklist of a document (ADR 0038): what the template requires and
# the tree says, as remarks in the window of the document.

checklist-words = { $count ->
    [one] { $count } palavra; o modelo permite { $limit }.
    [many] { $count } palavras; o modelo permite { $limit }.
   *[other] { $count } palavras; o modelo permite { $limit }.
}
checklist-abstract-words = { $count ->
    [one] O resumo tem { $count } palavra; o modelo permite { $limit }.
    [many] O resumo tem { $count } palavras; o modelo permite { $limit }.
   *[other] O resumo tem { $count } palavras; o modelo permite { $limit }.
}
checklist-keywords = { $count ->
    [one] { $count } palavra-chave; o modelo permite { $limit }.
    [many] { $count } palavras-chave; o modelo permite { $limit }.
   *[other] { $count } palavras-chave; o modelo permite { $limit }.
}
checklist-doubled = { $count ->
    [one] Há mais um elemento do tipo «{ $kind }» ao lado do primeiro; só o primeiro se imprime.
    [many] Há mais { $count } elementos do tipo «{ $kind }» ao lado do primeiro; só o primeiro se imprime.
   *[other] Há mais { $count } elementos do tipo «{ $kind }» ao lado do primeiro; só o primeiro se imprime.
}
checklist-unplaced = { $count ->
    [one] O modelo não faz capa: um elemento de um tipo de capa não se imprime.
    [many] O modelo não faz capa: { $count } elementos de um tipo de capa não se imprimem.
   *[other] O modelo não faz capa: { $count } elementos de um tipo de capa não se imprimem.
}
