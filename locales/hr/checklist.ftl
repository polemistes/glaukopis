# The checklist of a document (ADR 0038): what the template requires and
# the tree says, as remarks in the window of the document.

checklist-words = { $count ->
    [one] { $count } riječ; predložak dopušta { $limit }.
    [few] { $count } riječi; predložak dopušta { $limit }.
   *[other] { $count } riječi; predložak dopušta { $limit }.
}
checklist-abstract-words = { $count ->
    [one] Sažetak ima { $count } riječ; predložak dopušta { $limit }.
    [few] Sažetak ima { $count } riječi; predložak dopušta { $limit }.
   *[other] Sažetak ima { $count } riječi; predložak dopušta { $limit }.
}
checklist-keywords = { $count ->
    [one] { $count } ključna riječ; predložak dopušta { $limit }.
    [few] { $count } ključne riječi; predložak dopušta { $limit }.
   *[other] { $count } ključnih riječi; predložak dopušta { $limit }.
}
checklist-doubled = { $count ->
    [1] Uz prvi stoji još jedan element vrste „{ $kind }”; tiska se samo prvi.
    [one] Uz prvi stoji još { $count } element vrste „{ $kind }”; tiska se samo prvi.
    [few] Uz prvi stoje još { $count } elementa vrste „{ $kind }”; tiska se samo prvi.
   *[other] Uz prvi stoji još { $count } elemenata vrste „{ $kind }”; tiska se samo prvi.
}
checklist-unplaced = { $count ->
    [1] Predložak ne izrađuje korice, pa se jedan element vrste za korice ne tiska.
    [one] Predložak ne izrađuje korice, pa se { $count } element vrste za korice ne tiska.
    [few] Predložak ne izrađuje korice, pa se { $count } elementa vrste za korice ne tiskaju.
   *[other] Predložak ne izrađuje korice, pa se { $count } elemenata vrste za korice ne tiska.
}
