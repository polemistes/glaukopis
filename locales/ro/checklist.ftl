# The checklist of a document (ADR 0038): what the template requires and
# the tree says, as remarks in the window of the document.

checklist-words = { $count ->
    [one] { $count } cuvânt; șablonul permite { $limit }.
    [few] { $count } cuvinte; șablonul permite { $limit }.
   *[other] { $count } de cuvinte; șablonul permite { $limit }.
}
checklist-abstract-words = { $count ->
    [one] Rezumatul are { $count } cuvânt; șablonul permite { $limit }.
    [few] Rezumatul are { $count } cuvinte; șablonul permite { $limit }.
   *[other] Rezumatul are { $count } de cuvinte; șablonul permite { $limit }.
}
checklist-keywords = { $count ->
    [one] { $count } cuvânt-cheie; șablonul permite { $limit }.
    [few] { $count } cuvinte-cheie; șablonul permite { $limit }.
   *[other] { $count } de cuvinte-cheie; șablonul permite { $limit }.
}
checklist-doubled = { $count ->
    [one] Încă un element de tipul „{ $kind }” stă alături de primul; se tipărește numai primul.
    [few] Încă { $count } elemente de tipul „{ $kind }” stau alături de primul; se tipărește numai primul.
   *[other] Încă { $count } de elemente de tipul „{ $kind }” stau alături de primul; se tipărește numai primul.
}
checklist-unplaced = { $count ->
    [one] Șablonul nu face copertă: un element de un tip pentru copertă nu se tipărește.
    [few] Șablonul nu face copertă: { $count } elemente de un tip pentru copertă nu se tipăresc.
   *[other] Șablonul nu face copertă: { $count } de elemente de un tip pentru copertă nu se tipăresc.
}
