# Timelines: when elements are, and a map seen along an axis of time.

timeline-title = Tidslinje
timeline-view = Tidslinjen
timeline-settings = Tidslinjen
timeline-axis = Akse
timeline-axis-dates = Datoer
timeline-axis-units = Egne enheder
timeline-dates-hint = År, med f.Kr. hvor det behøves: 431 f.Kr., ca. 480 f.Kr., juni 1453, 1453-05-29.
timeline-unit = Hvad en enhed hedder
timeline-unit-placeholder = år, dag, cyklus…
timeline-units-hint = Tider er tal af enheden: År 12, Dag 3 eller bare 12. De kan være negative.
timeline-lanes = Baner
timeline-lanes-given = Hvert barn af midten er en bane, indtil du vælger. En bane rummer det, der er placeret i dens gren; dens egen placering, hvis den har en, er banens tidsrum.
timeline-lanes-chosen = De baner, du valgte, i tekstens rækkefølge.
timeline-lanes-reset = Hvert barn af midten igen
timeline-one-lane = Én bane
timeline-each-child = { $count ->
    [one] Dets barn en bane
   *[other] Hvert af { $count } børn en bane
}
timeline-no-branches = Kortet har endnu intet under sin midte.
timeline-lanes-by-kind = Baner efter art
timeline-lanes-by-kind-hint = Hvert element af en art en bane for sig: hver person, hvert sted.
timeline-each-of-kind = Hver en bane
timeline-chronology = Føj en kronologi til kortet
timeline-chronology-hint = Et element med en tabel over alt, der er placeret, i tidsfølge, til at skrive videre på og udskrive
timeline-chronology-title = Kronologi
timeline-chronology-when = Hvornår
timeline-chronology-what = Hvad
timeline-chronology-made = En kronologi blev føjet til kortet
timeline-elsewhere = Andetsteds i kortet
timeline-elsewhere-chosen = Banerne er valgt: det, der ikke står i nogen af dem, står her. Tryk for at vælge banerne på ny.
timeline-ordered = I rækkefølge, uden datoer
timeline-empty = Intet siger endnu, hvornår det er. Vælg »Sig, hvornår det er…« i et elements menu.
timeline-unplaced = { $count ->
    [one] Ét element kunne ikke placeres:
   *[other] { $count } elementer kunne ikke placeres:
}
timeline-contradiction = kan ikke være, hvor det siger, det er
# Dragging what is placed, and placing what is not.
timeline-moving = Flyt ved at trække
timeline-moving-hint = Træk et element langs aksen, eller kanten af et tidsrum, for at ændre dets tid; fra, så intet flyttes ved et uheld
timeline-without = Elementer uden tid
timeline-without-hint = Træk et ind på tidslinjen, eller tryk på det for at sige, hvornår det er:
timeline-waiting-hint = Siger endnu intet om sin tid: tryk på det for at sige, hvornår det er, eller træk det langs banen for at placere det
timeline-unknown = henviser til noget, der ikke er placeret, eller til en tid, der ikke kan læses

## Saying when an element is
when-title = Hvornår det er
when-say = Sig, hvornår det er…
when-change = Hvornår det er…
when-clear = Sig det ikke længere
when-kind = På et tidspunkt eller over et tidsrum
when-point = På et tidspunkt
when-span = Over et tidsrum
when-when = Hvornår
when-start = Fra
when-end = Til
when-at = På en tid
when-after = Efter et element
when-before = Før et element
when-between = Mellem to elementer
when-during = Under et element
when-time = Tid
when-time-placeholder = 431 f.Kr., juni 1453, ca. 480…
when-unit-placeholder = År 12, Dag 3, 12…
when-unread = Dette kan ikke læses som en tid.
when-after-what = Efter
when-before-what = Før
when-during-what = Under
when-choose = Vælg et element…
when-approx = Omtrent
# A margin either side of a written time, drawn fading away both ways from it.
when-margin = Plus/minus
when-margin-placeholder = 5 år, 3 måneder…
when-margin-unit-placeholder = 5…
when-margin-unread = Dette kan ikke læses som en tidslængde.
when-hint-dates = År, datoer, måneder, århundreder og årtier læses, med f.Kr. hvor det behøves. Et år står for hele året.
when-hint-units = Tider er tal af tidslinjens enhed, angivet under dens baner. »År 12« og »12« er det samme.
when-bc = f.Kr.
# $month: 1 to 12; $year: as written.
when-month-of = { $year }, måned { $month }
# How a placement is said beside the element: "after the quarrel, before the embassy".
when-said-after = efter
when-said-before = før
when-said-during = under
when-said-to = til
when-said-approx = ca.
