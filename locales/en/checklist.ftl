# The checklist of a document (ADR 0038): what the template requires and
# the tree says, as remarks in the window of the document.

checklist-words = { $count ->
    [one] { $count } word; the template allows { $limit }.
   *[other] { $count } words; the template allows { $limit }.
}
checklist-abstract-words = { $count ->
    [one] The abstract has { $count } word; the template allows { $limit }.
   *[other] The abstract has { $count } words; the template allows { $limit }.
}
checklist-keywords = { $count ->
    [one] { $count } keyword; the template allows { $limit }.
   *[other] { $count } keywords; the template allows { $limit }.
}
checklist-doubled = { $count ->
    [one] One more element of the kind “{ $kind }” stands beside the first; only the first is printed.
   *[other] { $count } more elements of the kind “{ $kind }” stand beside the first; only the first is printed.
}
checklist-unplaced = { $count ->
    [one] The template makes no cover: one element of a cover kind is not printed.
   *[other] The template makes no cover: { $count } elements of a cover kind are not printed.
}
