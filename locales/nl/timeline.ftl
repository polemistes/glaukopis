# Timelines: when elements are, and a map seen along an axis of time.

timeline-title = Tijdlijn
timeline-view = De tijdlijn
timeline-settings = De tijdlijn
timeline-axis = As
timeline-axis-dates = Datums
timeline-axis-units = Eigen eenheden
timeline-dates-hint = Jaren, met BC waar nodig: 431 BC, c. 480 BCE, May 1453, 1453-05-29, 5th century BC.
timeline-unit = Hoe een eenheid heet
timeline-unit-placeholder = jaar, dag, cyclus…
timeline-units-hint = Tijden zijn aantallen van de eenheid: Jaar 12, Dag 3, of gewoon 12. Ze mogen negatief zijn.
timeline-lanes = Banen
timeline-lanes-given = Elk kind van de kern is een baan, tot je kiest. Een baan bevat wat in haar tak is geplaatst; haar eigen plaatsing, als ze er een heeft, is de spanne van de baan.
timeline-lanes-chosen = De banen die je hebt gekozen, in de volgorde van de tekst.
timeline-lanes-reset = Weer elk kind van de kern
timeline-one-lane = Eén baan
timeline-each-child = { $count ->
    [one] Zijn kind een baan
   *[other] Elk van { $count } kinderen een baan
}
timeline-no-branches = De mindmap heeft nog niets onder haar kern.
timeline-lanes-by-kind = Banen per soort
timeline-lanes-by-kind-hint = Elk element van een soort een eigen baan: elk personage, elke plaats.
timeline-each-of-kind = Elk een baan
timeline-chronology = Een chronologie aan de mindmap toevoegen
timeline-chronology-hint = Een element met een tabel van alles wat is geplaatst, in volgorde van tijd, om op te schrijven en te drukken
timeline-chronology-title = Chronologie
timeline-chronology-when = Wanneer
timeline-chronology-what = Wat
timeline-chronology-made = Er is een chronologie aan de mindmap toegevoegd
timeline-elsewhere = Elders in de mindmap
timeline-elsewhere-chosen = De banen zijn gekozen: wat in geen ervan staat, staat hier. Druk om de banen opnieuw te kiezen.
timeline-ordered = Op volgorde, zonder datums
timeline-empty = Nog niets zegt wanneer het is. Kies ‘Zeggen wanneer het is…’ in het menu van een element.
timeline-unplaced = { $count ->
    [one] Eén element kon niet worden geplaatst:
   *[other] { $count } elementen konden niet worden geplaatst:
}
timeline-contradiction = kan niet zijn waar het zegt dat het is
# Dragging what is placed, and placing what is not.
timeline-moving = Verplaatsen door te slepen
timeline-moving-hint = Sleep een element langs de as, of de rand van een spanne, om zijn tijd te veranderen; uit, zodat niets per ongeluk verschuift
timeline-without = Elementen zonder tijd
timeline-without-hint = Sleep er een op de tijdlijn, of druk erop om te zeggen wanneer het is:
timeline-waiting-hint = Zegt nog niets over zijn tijd: druk erop om te zeggen wanneer het is, of sleep het langs de baan om het te plaatsen
timeline-unknown = verwijst naar wat niet is geplaatst, of naar een tijd die niet kan worden gelezen

## Saying when an element is
when-title = Wanneer het is
when-say = Zeggen wanneer het is…
when-change = Wanneer het is…
when-clear = Niet meer zeggen
when-kind = Op een punt, of over een spanne
when-point = Op een punt
when-span = Over een spanne
when-when = Wanneer
when-start = Van
when-end = Tot
when-at = Op een tijd
when-after = Na een element
when-before = Voor een element
when-between = Tussen twee elementen
when-during = Tijdens een element
when-time = Tijd
when-time-placeholder = 431 BC, May 1453, c. 480…
when-unit-placeholder = Jaar 12, Dag 3, 12…
when-unread = Dit kan niet als tijd worden gelezen.
when-after-what = Na
when-before-what = Voor
when-during-what = Tijdens
when-choose = Kies een element…
when-approx = Ongeveer
# A margin either side of a written time, drawn fading away both ways from it.
when-margin = Plus of min
when-margin-placeholder = 5 years, 3 months, 10 days…
when-margin-unit-placeholder = 5…
when-margin-unread = Dit kan niet als tijdsduur worden gelezen.
when-hint-dates = Jaren, datums, maanden, eeuwen en decennia worden gelezen, met BC of BCE waar nodig. Een jaar staat voor het hele jaar.
when-hint-units = Tijden zijn aantallen van de eenheid van de tijdlijn, ingesteld onder haar banen. ‘Jaar 12’ en ‘12’ zijn hetzelfde.
when-bc = v.Chr.
# $month: 1 to 12; $year: as written.
when-month-of = { $year }, maand { $month }
# How a placement is said beside the element: "after the quarrel, before the embassy".
when-said-after = na
when-said-before = voor
when-said-during = tijdens
when-said-to = tot
when-said-approx = ca.
