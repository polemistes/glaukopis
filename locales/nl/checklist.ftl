# The checklist of a document (ADR 0038): what the template requires and
# the tree says, as remarks in the window of the document.

checklist-words = { $count ->
    [one] { $count } woord; het sjabloon staat er { $limit } toe.
   *[other] { $count } woorden; het sjabloon staat er { $limit } toe.
}
checklist-abstract-words = { $count ->
    [one] De samenvatting heeft { $count } woord; het sjabloon staat er { $limit } toe.
   *[other] De samenvatting heeft { $count } woorden; het sjabloon staat er { $limit } toe.
}
checklist-keywords = { $count ->
    [one] { $count } trefwoord; het sjabloon staat er { $limit } toe.
   *[other] { $count } trefwoorden; het sjabloon staat er { $limit } toe.
}
checklist-doubled = { $count ->
    [one] Nog één element van de soort ‘{ $kind }’ staat naast het eerste; alleen het eerste wordt gedrukt.
   *[other] Nog { $count } elementen van de soort ‘{ $kind }’ staan naast het eerste; alleen het eerste wordt gedrukt.
}
checklist-unplaced = { $count ->
    [one] Het sjabloon maakt geen omslag: één element van een soort voor het omslag wordt niet gedrukt.
   *[other] Het sjabloon maakt geen omslag: { $count } elementen van een soort voor het omslag worden niet gedrukt.
}
