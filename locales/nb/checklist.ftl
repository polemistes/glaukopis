# Sjekklisten til et dokument (ADR 0038): det malen krever og treet sier,
# som merknader i dokumentvinduet.

checklist-words = { $count ->
    [one] { $count } ord; malen tillater { $limit }.
   *[other] { $count } ord; malen tillater { $limit }.
}
checklist-abstract-words = { $count ->
    [one] Sammendraget har { $count } ord; malen tillater { $limit }.
   *[other] Sammendraget har { $count } ord; malen tillater { $limit }.
}
checklist-keywords = { $count ->
    [one] { $count } nøkkelord; malen tillater { $limit }.
   *[other] { $count } nøkkelord; malen tillater { $limit }.
}
checklist-doubled = { $count ->
    [one] Ett element til av typen «{ $kind }» står ved siden av det første; bare det første skrives ut.
   *[other] { $count } elementer til av typen «{ $kind }» står ved siden av det første; bare det første skrives ut.
}
checklist-unplaced = { $count ->
    [one] Malen lager ikke noe omslag: ett element av en omslagstype skrives ikke ut.
   *[other] Malen lager ikke noe omslag: { $count } elementer av en omslagstype skrives ikke ut.
}

## Fewer words, stage 4: what the type and the layout ask of the front page and of quotations.

checklist-anonymous = Dokumenttypen ber om et anonymt dokument; forsiden nevner bidragsyterne. Slå på Anonymiser forsiden under Forsiden i Utseende.
checklist-long-quotation = { $by ->
    [lines] «{ $element }» har et sitat på { $words } ord i teksten, omtrent { $lines ->
        [one] { $lines } linje
       *[other] { $lines } linjer
    }; oppsettet setter sitater for seg fra { $limit } linjer.
   *[words] «{ $element }» har et sitat på { $words } ord i teksten, omtrent { $lines ->
        [one] { $lines } linje
       *[other] { $lines } linjer
    }; oppsettet setter sitater for seg fra { $limit } ord.
}
