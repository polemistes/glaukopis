# The checklist of a document (ADR 0038): what the template requires and
# the tree says, as remarks in the window of the document.

checklist-words = { $count ->
    [one] { $count } ord; dokumenttypen tillåter { $limit }.
   *[other] { $count } ord; dokumenttypen tillåter { $limit }.
}
checklist-abstract-words = { $count ->
    [one] Sammanfattningen har { $count } ord; dokumenttypen tillåter { $limit }.
   *[other] Sammanfattningen har { $count } ord; dokumenttypen tillåter { $limit }.
}
checklist-keywords = { $count ->
    [one] { $count } nyckelord; dokumenttypen tillåter { $limit }.
   *[other] { $count } nyckelord; dokumenttypen tillåter { $limit }.
}
checklist-doubled = { $count ->
    [one] Ytterligare ett element av slaget ”{ $kind }” står bredvid det första; bara det första skrivs ut.
   *[other] Ytterligare { $count } element av slaget ”{ $kind }” står bredvid det första; bara det första skrivs ut.
}
checklist-unplaced = { $count ->
    [one] Dokumenttypen gör inget omslag: ett element av ett slag för omslaget skrivs inte ut.
   *[other] Dokumenttypen gör inget omslag: { $count } element av ett slag för omslaget skrivs inte ut.
}

## Fewer words, stage 4: what the type and the layout ask of the front page and of quotations.

checklist-anonymous = Dokumenttypen ber om ett anonymt dokument; framsidan nämner de medverkande. Slå på Anonymisera framsidan under Framsida i Utseende.
# A quotation within a paragraph of text, between quotation marks, as long as the layout sets quotations off from. The lines are estimated from the layout.
checklist-long-quotation = { $by ->
    [lines] ”{ $element }” har ett citat på { $words } ord i texten, ungefär { $lines ->
        [one] { $lines } rad
       *[other] { $lines } rader
    }; Utseende bryter ut citat från { $limit } rader.
   *[words] ”{ $element }” har ett citat på { $words } ord i texten, ungefär { $lines ->
        [one] { $lines } rad
       *[other] { $lines } rader
    }; Utseende bryter ut citat från { $limit } ord.
}

## The order of the tree: what is said of the parts, and never mended.

# Works are cited in the text, and no element of the kind Bibliography stands under the document.
checklist-no-bibliography = Det hänvisas till verk, och dokumentet har ingen litteraturförteckning. Lägg till en under Delar i Utseende.
# The parts the document has, in the order its type has them: "Title page · Abstract · The text · Bibliography".
checklist-order = Dokumenttypen har de här delarna i den här ordningen: { $parts }.
