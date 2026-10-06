# Timelines: when elements are, and a map seen along an axis of time.

timeline-title = Vremenska crta
timeline-view = Vremenska crta
timeline-settings = Vremenska crta
timeline-axis = Os
timeline-axis-dates = Datumi
timeline-axis-units = Vlastite jedinice
timeline-dates-hint = Godine, s BC gdje treba: 431 BC, c. 480 BCE, 1453-05, 1453-05-29, 5th century BC.
timeline-unit = Kako se jedinica zove
timeline-unit-placeholder = godina, dan, ciklus…
timeline-units-hint = Vremena su brojevi jedinice: Godina 12, Dan 3, ili samo 12. Smiju biti negativni.
timeline-lanes = Pruge
timeline-lanes-given = Svako dijete središta jedna je pruga, dok ne odaberete drukčije. Pruga sadrži ono što je smješteno u njezinoj grani; njezin vlastiti smještaj, ako ga ima, raspon je pruge.
timeline-lanes-chosen = Pruge koje ste odabrali, redom kao u tekstu.
timeline-lanes-reset = Opet svako dijete središta
timeline-one-lane = Jedna pruga
timeline-each-child = { $count ->
    [1] Njegovo dijete kao pruga
    [one] Svako od { $count } djeteta kao pruga
    [few] Svako od { $count } djeteta kao pruga
   *[other] Svako od { $count } djece kao pruga
}
timeline-no-branches = Mapa još nema ništa ispod svojega središta.
timeline-lanes-by-kind = Pruge po vrsti
timeline-lanes-by-kind-hint = Svaki element neke vrste zasebna pruga: svaki lik, svako mjesto.
timeline-each-of-kind = Svaki kao pruga
timeline-chronology = Dodaj kronologiju mapi
timeline-chronology-hint = Element s tablicom svega smještenoga, vremenskim redom, za pisanje i tiskanje
timeline-chronology-title = Kronologija
timeline-chronology-when = Kada
timeline-chronology-what = Što
timeline-chronology-made = Mapi je dodana kronologija
timeline-elsewhere = Drugdje u mapi
timeline-elsewhere-chosen = Pruge su odabrane: što nije ni u jednoj od njih stoji ovdje. Pritisnite da ponovno odaberete pruge.
timeline-ordered = Redom, bez datuma
timeline-empty = Još ništa ne kaže kada jest. Odaberite „Reci kada je…” u izborniku elementa.
timeline-unplaced = { $count ->
    [1] Jedan element nije bilo moguće smjestiti:
    [one] { $count } element nije bilo moguće smjestiti:
    [few] { $count } elementa nije bilo moguće smjestiti:
   *[other] { $count } elemenata nije bilo moguće smjestiti:
}
timeline-contradiction = ne može biti ondje gdje kaže da jest
# Dragging what is placed, and placing what is not.
timeline-moving = Premještanje povlačenjem
timeline-moving-hint = Povucite element duž osi, ili rub raspona, da promijenite njegovo vrijeme; isključeno, da se ništa ne pomakne slučajno
timeline-without = Elementi bez vremena
timeline-without-hint = Povucite jedan na vremensku crtu, ili ga pritisnite da kažete kada je:
timeline-waiting-hint = Još ništa ne kaže o svojem vremenu: pritisnite ga da kažete kada je, ili ga povucite duž pruge da ga smjestite
timeline-unknown = upućuje na ono što nije smješteno, ili na vrijeme koje se ne može pročitati

## Saying when an element is
when-title = Kada je
when-say = Reci kada je…
when-change = Kada je…
when-clear = Više ne reci
when-kind = U trenutku, ili kroz raspon
when-point = U trenutku
when-span = Kroz raspon
when-when = Kada
when-start = Od
when-end = Do
when-at = U neko vrijeme
when-after = Nakon elementa
when-before = Prije elementa
when-between = Između dvaju elemenata
when-during = Tijekom elementa
when-time = Vrijeme
when-time-placeholder = 431 BC, 1453-05, c. 480…
when-unit-placeholder = Godina 12, Dan 3, 12…
when-unread = Ovo se ne može pročitati kao vrijeme.
when-after-what = Nakon
when-before-what = Prije
when-during-what = Tijekom
when-choose = Odaberite element…
when-approx = Približno
# A margin either side of a written time, drawn fading away both ways from it.
when-margin = Plus-minus
when-margin-placeholder = 5 godina, 3 mjeseca, 10 dana…
when-margin-unit-placeholder = 5…
when-margin-unread = Ovo se ne može pročitati kao trajanje.
when-hint-dates = Čitaju se godine, datumi, mjeseci, stoljeća i desetljeća, s BC ili BCE gdje treba. Godina znači cijelu godinu.
when-hint-units = Vremena su brojevi jedinice vremenske crte, postavljene ispod njezinih pruga. „Godina 12” i „12” isto su.
when-bc = pr. Kr.
# $month: 1 to 12; $year: as written.
when-month-of = { $year }, { $month }. mjesec
# How a placement is said beside the element: "after the quarrel, before the embassy".
when-said-after = nakon
when-said-before = prije
when-said-during = tijekom
when-said-to = do
when-said-approx = oko
