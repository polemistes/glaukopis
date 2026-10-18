# The checklist of a document (ADR 0038): what the template requires and
# the tree says, as remarks in the window of the document.

checklist-words = { $count ->
    [one] { $count } parola; il modello ne consente { $limit }.
    [many] { $count } parole; il modello ne consente { $limit }.
   *[other] { $count } parole; il modello ne consente { $limit }.
}
checklist-abstract-words = { $count ->
    [one] L'abstract ha { $count } parola; il modello ne consente { $limit }.
    [many] L'abstract ha { $count } parole; il modello ne consente { $limit }.
   *[other] L'abstract ha { $count } parole; il modello ne consente { $limit }.
}
checklist-keywords = { $count ->
    [one] { $count } parola chiave; il modello ne consente { $limit }.
    [many] { $count } parole chiave; il modello ne consente { $limit }.
   *[other] { $count } parole chiave; il modello ne consente { $limit }.
}
checklist-doubled = { $count ->
    [one] Un altro elemento del tipo «{ $kind }» sta accanto al primo; si stampa solo il primo.
    [many] Altri { $count } elementi del tipo «{ $kind }» stanno accanto al primo; si stampa solo il primo.
   *[other] Altri { $count } elementi del tipo «{ $kind }» stanno accanto al primo; si stampa solo il primo.
}
checklist-unplaced = { $count ->
    [one] Il modello non fa copertina: un elemento di un tipo da copertina non è stampato.
    [many] Il modello non fa copertina: { $count } elementi di un tipo da copertina non sono stampati.
   *[other] Il modello non fa copertina: { $count } elementi di un tipo da copertina non sono stampati.
}
