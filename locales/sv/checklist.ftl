# The checklist of a document (ADR 0038): what the template requires and
# the tree says, as remarks in the window of the document.

checklist-words = { $count ->
    [one] { $count } ord; mallen tillåter { $limit }.
   *[other] { $count } ord; mallen tillåter { $limit }.
}
checklist-abstract-words = { $count ->
    [one] Sammanfattningen har { $count } ord; mallen tillåter { $limit }.
   *[other] Sammanfattningen har { $count } ord; mallen tillåter { $limit }.
}
checklist-keywords = { $count ->
    [one] { $count } nyckelord; mallen tillåter { $limit }.
   *[other] { $count } nyckelord; mallen tillåter { $limit }.
}
checklist-doubled = { $count ->
    [one] Ytterligare ett element av slaget ”{ $kind }” står bredvid det första; bara det första skrivs ut.
   *[other] Ytterligare { $count } element av slaget ”{ $kind }” står bredvid det första; bara det första skrivs ut.
}
checklist-unplaced = { $count ->
    [one] Mallen gör inget omslag: ett element av ett slag för omslaget skrivs inte ut.
   *[other] Mallen gör inget omslag: { $count } element av ett slag för omslaget skrivs inte ut.
}
