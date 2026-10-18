# The checklist of a document (ADR 0038): what the template requires and
# the tree says, as remarks in the window of the document.

checklist-words = { $count ->
    [one] { $count } mot ; le modèle en permet { $limit }.
    [many] { $count } mots ; le modèle en permet { $limit }.
   *[other] { $count } mots ; le modèle en permet { $limit }.
}
checklist-abstract-words = { $count ->
    [one] Le résumé compte { $count } mot ; le modèle en permet { $limit }.
    [many] Le résumé compte { $count } mots ; le modèle en permet { $limit }.
   *[other] Le résumé compte { $count } mots ; le modèle en permet { $limit }.
}
checklist-keywords = { $count ->
    [one] { $count } mot-clé ; le modèle en permet { $limit }.
    [many] { $count } mots-clés ; le modèle en permet { $limit }.
   *[other] { $count } mots-clés ; le modèle en permet { $limit }.
}
checklist-doubled = { $count ->
    [one] Un autre élément du type « { $kind } » se trouve à côté du premier ; seul le premier est imprimé.
    [many] { $count } autres éléments du type « { $kind } » se trouvent à côté du premier ; seul le premier est imprimé.
   *[other] { $count } autres éléments du type « { $kind } » se trouvent à côté du premier ; seul le premier est imprimé.
}
checklist-unplaced = { $count ->
    [one] Le modèle ne fait pas de couverture : un élément d’un type de couverture n’est pas imprimé.
    [many] Le modèle ne fait pas de couverture : { $count } éléments d’un type de couverture ne sont pas imprimés.
   *[other] Le modèle ne fait pas de couverture : { $count } éléments d’un type de couverture ne sont pas imprimés.
}
