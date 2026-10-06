# Timelines: when elements are, and a map seen along an axis of time.

timeline-title = Tidslinje
timeline-view = Tidslinjen
timeline-settings = Tidslinjen
timeline-axis = Axel
timeline-axis-dates = Datum
timeline-axis-units = Egna enheter
timeline-dates-hint = År, med f.Kr. där det behövs: 431 f.Kr., ca 480 fvt, 29 mars 1453, 1453-05-29, 29.5.1453.
timeline-unit = Vad en enhet kallas
timeline-unit-placeholder = år, dag, cykel…
timeline-units-hint = Tider är antal av enheten: År 12, Dag 3, eller bara 12. De kan vara negativa.
timeline-lanes = Banor
timeline-lanes-given = Varje barn till mitten är en bana, tills du väljer. En bana rymmer det som placeras i dess gren; dess egen placering, om den har någon, är banans spann.
timeline-lanes-chosen = De banor du valde, i textens ordning.
timeline-lanes-reset = Varje barn till mitten igen
timeline-one-lane = En bana
timeline-each-child = { $count ->
    [one] Dess barn en bana
   *[other] Vart och ett av { $count } barn en bana
}
timeline-no-branches = Kartan har inget under sin mitt än.
timeline-lanes-by-kind = Banor efter slag
timeline-lanes-by-kind-hint = Varje element av ett slag en egen bana: varje person, varje plats.
timeline-each-of-kind = Var och en en bana
timeline-chronology = Lägg till en kronologi i kartan
timeline-chronology-hint = Ett element med en tabell över allt som placerats, i tidsordning, att skriva vidare på och skriva ut
timeline-chronology-title = Kronologi
timeline-chronology-when = När
timeline-chronology-what = Vad
timeline-chronology-made = En kronologi lades till i kartan
timeline-elsewhere = Annorstädes i kartan
timeline-elsewhere-chosen = Banorna är valda: det som inte står i någon av dem står här. Tryck för att välja banorna på nytt.
timeline-ordered = I ordning, utan datum
timeline-empty = Inget säger än när det är. Välj ”Ange när det är…” i ett elements meny.
timeline-unplaced = { $count ->
    [one] Ett element kunde inte placeras:
   *[other] { $count } element kunde inte placeras:
}
timeline-contradiction = kan inte vara där det sägs vara
# Dragging what is placed, and placing what is not.
timeline-moving = Flytta genom att dra
timeline-moving-hint = Dra ett element längs axeln, eller kanten av ett spann, för att ändra dess tid; av, så att inget flyttas av misstag
timeline-without = Element utan tid
timeline-without-hint = Dra ett till tidslinjen, eller tryck på det för att ange när det är:
timeline-waiting-hint = Säger inget om sin tid än: tryck på det för att ange när det är, eller dra det längs banan för att placera det
timeline-unknown = hänvisar till något som inte är placerat, eller till en tid som inte kan läsas

## Saying when an element is
when-title = När det är
when-say = Ange när det är…
when-change = När det är…
when-clear = Ange inte längre
when-kind = Vid en punkt, eller över ett spann
when-point = Vid en punkt
when-span = Över ett spann
when-when = När
when-start = Från
when-end = Till
when-at = Vid en tid
when-after = Efter ett element
when-before = Före ett element
when-between = Mellan två element
when-during = Under ett element
when-time = Tid
when-time-placeholder = 431 f.Kr., mars 1453, ca 480…
when-unit-placeholder = År 12, Dag 3, 12…
when-unread = Det här kan inte läsas som en tid.
when-after-what = Efter
when-before-what = Före
when-during-what = Under
when-choose = Välj ett element…
when-approx = Ungefär
# A margin either side of a written time, drawn fading away both ways from it.
when-margin = Plus minus
when-margin-placeholder = 5 år, 3 månader, 10 dagar…
when-margin-unit-placeholder = 5…
when-margin-unread = Det här kan inte läsas som en tidslängd.
when-hint-dates = År, datum och månader läses, med f.Kr. eller fvt där det behövs; århundraden som ”5th century” och årtionden som ”1920s”. Ett år står för hela året.
when-hint-units = Tider är antal av tidslinjens enhet, som anges under dess banor. ”År 12” och ”12” är detsamma.
when-bc = f.Kr.
# $month: 1 to 12; $year: as written.
when-month-of = { $year }, månad { $month }
# How a placement is said beside the element: "after the quarrel, before the embassy".
when-said-after = efter
when-said-before = före
when-said-during = under
when-said-to = till
when-said-approx = ca
