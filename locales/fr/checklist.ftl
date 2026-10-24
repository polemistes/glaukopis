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

## Fewer words, stage 4: what the type and the layout ask of the front page and of quotations.

checklist-anonymous = Le type de document demande un document anonyme ; la première page nomme les contributeurs. Activez « Anonymiser la première page » sous « Première page », dans l’Aspect.
# A quotation within a paragraph of text, between quotation marks, as long as the layout sets quotations off from. The lines are estimated from the layout.
checklist-long-quotation = { $by ->
    [lines] « { $element } » contient une citation de { $words } mots dans le texte, d’environ { $lines ->
        [one] { $lines } ligne
        [many] { $lines } lignes
       *[other] { $lines } lignes
    } ; la mise en page met en retrait les citations à partir de { $limit } lignes.
   *[words] « { $element } » contient une citation de { $words } mots dans le texte, d’environ { $lines ->
        [one] { $lines } ligne
        [many] { $lines } lignes
       *[other] { $lines } lignes
    } ; la mise en page met en retrait les citations à partir de { $limit } mots.
}
