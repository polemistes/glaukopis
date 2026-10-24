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

## Fewer words, stage 4: what the type and the layout ask of the front page and of quotations.

checklist-anonymous = The document type asks for an anonymous document; the front page names the contributors. Turn on Anonymize the front page under Front page in Look.
# A quotation within a paragraph of text, between quotation marks, as long as the layout sets quotations off from. The lines are estimated from the layout.
checklist-long-quotation = { $by ->
    [lines] “{ $element }” has a quotation of { $words } words in the text, about { $lines ->
        [one] { $lines } line
       *[other] { $lines } lines
    }; the layout sets quotations off from { $limit } lines.
   *[words] “{ $element }” has a quotation of { $words } words in the text, about { $lines ->
        [one] { $lines } line
       *[other] { $lines } lines
    }; the layout sets quotations off from { $limit } words.
}
