# The checklist of a document (ADR 0038): what the template requires and
# the tree says, as remarks in the window of the document.

checklist-words = { $count ->
    [one] { $count } palabra; la plantilla admite { $limit }.
    [many] { $count } de palabras; la plantilla admite { $limit }.
   *[other] { $count } palabras; la plantilla admite { $limit }.
}
checklist-abstract-words = { $count ->
    [one] El resumen tiene { $count } palabra; la plantilla admite { $limit }.
    [many] El resumen tiene { $count } de palabras; la plantilla admite { $limit }.
   *[other] El resumen tiene { $count } palabras; la plantilla admite { $limit }.
}
checklist-keywords = { $count ->
    [one] { $count } palabra clave; la plantilla admite { $limit }.
    [many] { $count } de palabras clave; la plantilla admite { $limit }.
   *[other] { $count } palabras clave; la plantilla admite { $limit }.
}
checklist-doubled = { $count ->
    [one] Junto al primero hay otro elemento del tipo «{ $kind }»; solo se imprime el primero.
    [many] Junto al primero hay { $count } de elementos más del tipo «{ $kind }»; solo se imprime el primero.
   *[other] Junto al primero hay { $count } elementos más del tipo «{ $kind }»; solo se imprime el primero.
}
checklist-unplaced = { $count ->
    [one] La plantilla no hace cubierta: no se imprime un elemento de un tipo de cubierta.
    [many] La plantilla no hace cubierta: no se imprimen { $count } de elementos de tipos de cubierta.
   *[other] La plantilla no hace cubierta: no se imprimen { $count } elementos de tipos de cubierta.
}
