# The checklist of a document (ADR 0038): what the template requires and
# the tree says, as remarks in the window of the document.

checklist-words = { $count ->
    [one] { $count } ord; malen tillèt { $limit }.
   *[other] { $count } ord; malen tillèt { $limit }.
}
checklist-abstract-words = { $count ->
    [one] Samandraget har { $count } ord; malen tillèt { $limit }.
   *[other] Samandraget har { $count } ord; malen tillèt { $limit }.
}
checklist-keywords = { $count ->
    [one] { $count } nøkkelord; malen tillèt { $limit }.
   *[other] { $count } nøkkelord; malen tillèt { $limit }.
}
checklist-doubled = { $count ->
    [one] Eitt element til av typen «{ $kind }» står ved sida av det første; berre det første blir skrive ut.
   *[other] { $count } element til av typen «{ $kind }» står ved sida av det første; berre det første blir skrive ut.
}
checklist-unplaced = { $count ->
    [one] Malen lagar ikkje noko omslag: eitt element av ein omslagstype blir ikkje skrive ut.
   *[other] Malen lagar ikkje noko omslag: { $count } element av ein omslagstype blir ikkje skrivne ut.
}

## Fewer words, stage 4: what the type and the layout ask of the front page and of quotations.

checklist-anonymous = Dokumenttypen ber om eit anonymt dokument; framsida nemner bidragsytarane. Slå på Anonymiser framsida under Framsida i Utsjånad.
# A quotation within a paragraph of text, between quotation marks, as long as the layout sets quotations off from. The lines are estimated from the layout.
checklist-long-quotation = { $by ->
    [lines] «{ $element }» har eit sitat på { $words } ord i teksten, om lag { $lines ->
        [one] { $lines } linje
       *[other] { $lines } linjer
    }; oppsettet set sitat for seg frå { $limit } linjer.
   *[words] «{ $element }» har eit sitat på { $words } ord i teksten, om lag { $lines ->
        [one] { $lines } linje
       *[other] { $lines } linjer
    }; oppsettet set sitat for seg frå { $limit } ord.
}
