# The checklist of a document (ADR 0038): what the template requires and
# the tree says, as remarks in the window of the document.

checklist-words = { $count ->
    [one] { $count } ord; dokumenttypen tillader { $limit }.
   *[other] { $count } ord; dokumenttypen tillader { $limit }.
}
checklist-abstract-words = { $count ->
    [one] Resuméet har { $count } ord; dokumenttypen tillader { $limit }.
   *[other] Resuméet har { $count } ord; dokumenttypen tillader { $limit }.
}
checklist-keywords = { $count ->
    [one] { $count } nøgleord; dokumenttypen tillader { $limit }.
   *[other] { $count } nøgleord; dokumenttypen tillader { $limit }.
}
checklist-doubled = { $count ->
    [one] Endnu et element af arten »{ $kind }« står ved siden af det første; kun det første udskrives.
   *[other] { $count } elementer mere af arten »{ $kind }« står ved siden af det første; kun det første udskrives.
}
checklist-unplaced = { $count ->
    [one] Dokumenttypen laver intet omslag: ét element af en art til omslaget udskrives ikke.
   *[other] Dokumenttypen laver intet omslag: { $count } elementer af en art til omslaget udskrives ikke.
}

## Fewer words, stage 4: what the type and the layout ask of the front page and of quotations.

checklist-anonymous = Dokumenttypen beder om et anonymt dokument; forsiden nævner bidragyderne. Slå Anonymiser forsiden til under Forside i Udseende.
# A quotation within a paragraph of text, between quotation marks, as long as the layout sets quotations off from. The lines are estimated from the layout.
checklist-long-quotation = { $by ->
    [lines] »{ $element }« har et citat på { $words } ord inde i teksten, omkring { $lines ->
        [one] { $lines } linje
       *[other] { $lines } linjer
    }; i Udseende sættes citater for sig fra { $limit } linjer.
   *[words] »{ $element }« har et citat på { $words } ord inde i teksten, omkring { $lines ->
        [one] { $lines } linje
       *[other] { $lines } linjer
    }; i Udseende sættes citater for sig fra { $limit } ord.
}

## The order of the tree: what is said of the parts, and never mended.

# Works are cited in the text, and no element of the kind Bibliography stands under the document.
checklist-no-bibliography = Der henvises til værker, og dokumentet har ingen litteraturliste. Tilføj en under Dele i Udseende.
# The parts the document has, in the order its type has them: "Title page · Abstract · The text · Bibliography".
checklist-order = Dokumenttypen har disse dele i denne rækkefølge: { $parts }.
