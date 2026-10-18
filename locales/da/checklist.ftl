# The checklist of a document (ADR 0038): what the template requires and
# the tree says, as remarks in the window of the document.

checklist-words = { $count ->
    [one] { $count } ord; skabelonen tillader { $limit }.
   *[other] { $count } ord; skabelonen tillader { $limit }.
}
checklist-abstract-words = { $count ->
    [one] Resuméet har { $count } ord; skabelonen tillader { $limit }.
   *[other] Resuméet har { $count } ord; skabelonen tillader { $limit }.
}
checklist-keywords = { $count ->
    [one] { $count } nøgleord; skabelonen tillader { $limit }.
   *[other] { $count } nøgleord; skabelonen tillader { $limit }.
}
checklist-doubled = { $count ->
    [one] Endnu et element af arten »{ $kind }« står ved siden af det første; kun det første udskrives.
   *[other] { $count } elementer mere af arten »{ $kind }« står ved siden af det første; kun det første udskrives.
}
checklist-unplaced = { $count ->
    [one] Skabelonen laver intet omslag: ét element af en art til omslaget udskrives ikke.
   *[other] Skabelonen laver intet omslag: { $count } elementer af en art til omslaget udskrives ikke.
}
