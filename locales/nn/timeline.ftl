# Timelines: when elements are, and a map seen along an axis of time.

timeline-title = Tidslinje
timeline-view = Tidslinja
timeline-settings = Tidslinja
timeline-axis = Akse
timeline-axis-dates = Datoar
timeline-axis-units = Eigne einingar
timeline-dates-hint = År, med f.Kr. der det trengst: 431 f.Kr., ca. 480 f.Kr., mai 1453, 1453-05-29, 5. hundreåret f.Kr.
timeline-unit = Kva ei eining heiter
timeline-unit-placeholder = år, dag, syklus …
timeline-units-hint = Tider er tal av eininga: År 12, Dag 3, eller berre 12. Dei kan vere negative.
timeline-lanes = Baner
timeline-lanes-given = Kvart barn av midten er ei bane, til du vel. Ei bane rommar det som er plassert i greina; plasseringa til bana sjølv, om den har ei, er spennet til bana.
timeline-lanes-chosen = Banene du valde, i rekkjefølgja til teksten.
timeline-lanes-reset = Kvart barn av midten igjen
timeline-one-lane = Éi bane
timeline-each-child = { $count ->
    [one] Barnet ei bane
   *[other] Kvart av { $count } barn ei bane
}
timeline-no-branches = Kartet har ingenting under midten enno.
timeline-lanes-by-kind = Baner etter type
timeline-lanes-by-kind-hint = Kvart element av ein type ei eiga bane: kvar person, kvar stad.
timeline-each-of-kind = Kvart ei bane
timeline-chronology = Legg ein kronologi til kartet
timeline-chronology-hint = Eit element med ein tabell over alt som er plassert, i tidsrekkjefølgje, til å skrive på og trykkje
timeline-chronology-title = Kronologi
timeline-chronology-when = Når
timeline-chronology-what = Kva
timeline-chronology-made = Ein kronologi vart lagd til kartet
timeline-elsewhere = Elles i kartet
timeline-elsewhere-chosen = Banene er valde: det som ikkje står i nokon av dei, står her. Trykk for å velje banene på nytt.
timeline-ordered = I rekkjefølgje, utan datoar
timeline-empty = Ingenting seier når det er enno. Vel «Sei når det er …» i menyen til eit element.
timeline-unplaced = { $count ->
    [one] Eitt element kunne ikkje plasserast:
   *[other] { $count } element kunne ikkje plasserast:
}
timeline-contradiction = kan ikkje vere der det seier det er
# Dragging what is placed, and placing what is not.
timeline-moving = Flytt ved å dra
timeline-moving-hint = Dra eit element langs aksen, eller kanten av eit spenn, for å endre tida; av, så ingenting blir flytta ved eit uhell
timeline-without = Element utan tid
timeline-without-hint = Dra eitt inn på tidslinja, eller trykk på det for å seie når det er:
timeline-waiting-hint = Seier enno ikkje når det er: trykk på det for å seie når, eller dra det langs bana for å plassere det
timeline-unknown = viser til noko som ikkje er plassert, eller til ei tid som ikkje kan lesast

## Saying when an element is
when-title = Når det er
when-say = Sei når det er …
when-change = Når det er …
when-clear = Sei det ikkje lenger
when-kind = På eit tidspunkt, eller over eit spenn
when-point = På eit tidspunkt
when-span = Over eit spenn
when-when = Når
when-start = Frå
when-end = Til
when-at = På ei tid
when-after = Etter eit element
when-before = Før eit element
when-between = Mellom to element
when-during = Under eit element
when-time = Tid
when-time-placeholder = 431 f.Kr., mai 1453, ca. 480 …
when-unit-placeholder = År 12, Dag 3, 12 …
when-unread = Dette kan ikkje lesast som ei tid.
when-after-what = Etter
when-before-what = Før
when-during-what = Under
when-choose = Vel eit element …
when-approx = Om lag
# A margin either side of a written time, drawn fading away both ways from it.
when-margin = Pluss eller minus
when-margin-placeholder = 5 år, 3 månader, 10 dagar …
when-margin-unit-placeholder = 5 …
when-margin-unread = Dette kan ikkje lesast som ei tidslengd.
when-hint-dates = År, datoar, månader, hundreår og tiår blir lesne, med f.Kr. der det trengst. Eit år står for heile året.
when-hint-units = Tider er tal av eininga til tidslinja, sett under banene. «År 12» og «12» er det same.
when-bc = f.Kr.
# $month: 1 to 12; $year: as written.
when-month-of = { $year }, månad { $month }
# How a placement is said beside the element: "after the quarrel, before the embassy".
when-said-after = etter
when-said-before = før
when-said-during = under
when-said-to = til
when-said-approx = ca.
