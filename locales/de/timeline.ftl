# Timelines: when elements are, and a map seen along an axis of time.

timeline-title = Zeitleiste
timeline-view = Die Zeitleiste
timeline-settings = Die Zeitleiste
timeline-axis = Achse
timeline-axis-dates = Daten
timeline-axis-units = Eigene Einheiten
timeline-dates-hint = Jahre, mit BC oder BCE, wo nötig: 431 BC, ca. 480 BC, 1453-05, 1453-05-29, 5th century BC. Deutsche Monats- und Jahrhundertnamen werden noch nicht gelesen.
timeline-unit = Wie eine Einheit heißt
timeline-unit-placeholder = Jahr, Tag, Zyklus…
timeline-units-hint = Zeiten sind Zahlen der Einheit: Jahr 12, Tag 3 oder einfach 12. Sie können negativ sein.
timeline-lanes = Bahnen
timeline-lanes-given = Jedes Kind der Mitte ist eine Bahn, bis Sie wählen. Eine Bahn enthält, was in ihrem Zweig platziert ist; ihre eigene Platzierung, wenn sie eine hat, ist die Spanne der Bahn.
timeline-lanes-chosen = Die Bahnen, die Sie gewählt haben, in der Reihenfolge des Textes.
timeline-lanes-reset = Wieder jedes Kind der Mitte
timeline-one-lane = Eine Bahn
timeline-each-child = { $count ->
    [one] Sein Kind eine Bahn
   *[other] Jedes der { $count } Kinder eine Bahn
}
timeline-no-branches = Die Karte hat noch nichts unter ihrer Mitte.
timeline-lanes-by-kind = Bahnen nach Art
timeline-lanes-by-kind-hint = Jedes Element einer Art eine eigene Bahn: jede Figur, jeder Ort.
timeline-each-of-kind = Jedes eine Bahn
timeline-chronology = Eine Chronologie zur Karte hinzufügen
timeline-chronology-hint = Ein Element mit einer Tabelle von allem Platzierten, in der Reihenfolge der Zeit, zum Beschreiben und Drucken
timeline-chronology-title = Chronologie
timeline-chronology-when = Wann
timeline-chronology-what = Was
timeline-chronology-made = Eine Chronologie wurde zur Karte hinzugefügt
timeline-elsewhere = Anderswo in der Karte
timeline-elsewhere-chosen = Die Bahnen sind gewählt: was in keiner von ihnen steht, steht hier. Klicken, um die Bahnen neu zu wählen.
timeline-ordered = Der Reihe nach, ohne Daten
timeline-empty = Noch nichts sagt, wann es ist. Wählen Sie „Sagen, wann es ist…“ im Menü eines Elements.
timeline-unplaced = { $count ->
    [one] Ein Element konnte nicht platziert werden:
   *[other] { $count } Elemente konnten nicht platziert werden:
}
timeline-contradiction = kann nicht sein, wo es sein soll
# Dragging what is placed, and placing what is not.
timeline-moving = Durch Ziehen verschieben
timeline-moving-hint = Ziehen Sie ein Element entlang der Achse, oder den Rand einer Spanne, um seine Zeit zu ändern; aus, damit nichts aus Versehen verrutscht
timeline-without = Elemente ohne Zeit
timeline-without-hint = Ziehen Sie eines auf die Zeitleiste, oder klicken Sie es an, um zu sagen, wann es ist:
timeline-waiting-hint = Sagt noch nichts über seine Zeit: anklicken, um zu sagen, wann es ist, oder entlang der Bahn ziehen, um es zu platzieren
timeline-unknown = verweist auf etwas, das nicht platziert ist, oder auf eine Zeit, die nicht gelesen werden kann

## Saying when an element is
when-title = Wann es ist
when-say = Sagen, wann es ist…
when-change = Wann es ist…
when-clear = Nicht mehr sagen
when-kind = Zu einem Zeitpunkt oder über eine Spanne
when-point = Zu einem Zeitpunkt
when-span = Über eine Spanne
when-when = Wann
when-start = Von
when-end = Bis
when-at = Zu einer Zeit
when-after = Nach einem Element
when-before = Vor einem Element
when-between = Zwischen zwei Elementen
when-during = Während eines Elements
when-time = Zeit
when-time-placeholder = 431 BC, 1453-05, ca. 480…
when-unit-placeholder = Jahr 12, Tag 3, 12…
when-unread = Das kann nicht als Zeit gelesen werden.
when-after-what = Nach
when-before-what = Vor
when-during-what = Während
when-choose = Element wählen…
when-approx = Ungefähr
# A margin either side of a written time, drawn fading away both ways from it.
when-margin = Plus/minus
when-margin-placeholder = 5 years, 3 months, 10 days…
when-margin-unit-placeholder = 5…
when-margin-unread = Das kann nicht als Zeitspanne gelesen werden.
when-hint-dates = Jahre, Daten, Monate, Jahrhunderte und Jahrzehnte werden gelesen, mit BC oder BCE, wo nötig, in englischer Schreibung (May 1453, 5th century BC); ca. für ungefähr. Ein Jahr steht für das ganze Jahr.
when-hint-units = Zeiten sind Zahlen der Einheit der Zeitleiste, unter ihren Bahnen festgelegt. „Jahr 12“ und „12“ sind dasselbe.
when-bc = v. Chr.
# $month: 1 to 12; $year: as written.
when-month-of = { $year }, Monat { $month }
# How a placement is said beside the element: "after the quarrel, before the embassy".
when-said-after = nach
when-said-before = vor
when-said-during = während
when-said-to = bis
when-said-approx = ca.
