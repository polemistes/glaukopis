# The checklist of a document (ADR 0038): what the template requires and
# the tree says, as remarks in the window of the document.

checklist-words = { $count ->
    [one] { $count } słowo; szablon dopuszcza { $limit }.
    [few] { $count } słowa; szablon dopuszcza { $limit }.
    [many] { $count } słów; szablon dopuszcza { $limit }.
   *[other] { $count } słów; szablon dopuszcza { $limit }.
}
checklist-abstract-words = { $count ->
    [one] Streszczenie ma { $count } słowo; szablon dopuszcza { $limit }.
    [few] Streszczenie ma { $count } słowa; szablon dopuszcza { $limit }.
    [many] Streszczenie ma { $count } słów; szablon dopuszcza { $limit }.
   *[other] Streszczenie ma { $count } słów; szablon dopuszcza { $limit }.
}
checklist-keywords = { $count ->
    [one] { $count } słowo kluczowe; szablon dopuszcza { $limit }.
    [few] { $count } słowa kluczowe; szablon dopuszcza { $limit }.
    [many] { $count } słów kluczowych; szablon dopuszcza { $limit }.
   *[other] { $count } słów kluczowych; szablon dopuszcza { $limit }.
}
checklist-doubled = { $count ->
    [one] Obok pierwszego stoi jeszcze jeden element rodzaju „{ $kind }”; drukowany jest tylko pierwszy.
    [few] Obok pierwszego stoją jeszcze { $count } elementy rodzaju „{ $kind }”; drukowany jest tylko pierwszy.
    [many] Obok pierwszego stoi jeszcze { $count } elementów rodzaju „{ $kind }”; drukowany jest tylko pierwszy.
   *[other] Obok pierwszego stoi jeszcze { $count } elementów rodzaju „{ $kind }”; drukowany jest tylko pierwszy.
}
checklist-unplaced = { $count ->
    [one] Szablon nie przewiduje okładki: jeden element rodzaju należącego do okładki nie trafia do druku.
    [few] Szablon nie przewiduje okładki: { $count } elementy rodzajów należących do okładki nie trafiają do druku.
    [many] Szablon nie przewiduje okładki: { $count } elementów rodzajów należących do okładki nie trafia do druku.
   *[other] Szablon nie przewiduje okładki: { $count } elementów rodzajów należących do okładki nie trafia do druku.
}
