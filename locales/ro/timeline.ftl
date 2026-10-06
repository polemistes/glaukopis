# Timelines: when elements are, and a map seen along an axis of time.

timeline-title = Cronologie
timeline-view = Cronologia
timeline-settings = Cronologia
timeline-axis = Axă
timeline-axis-dates = Date
timeline-axis-units = Unități proprii
timeline-dates-hint = Ani, cu BC unde este nevoie, scriși așa cum îi citește programul: 431 BC, c. 480 BCE, May 1453, 1453-05-29, 5th century BC.
timeline-unit = Cum se numește o unitate
timeline-unit-placeholder = an, zi, ciclu…
timeline-units-hint = Timpurile sunt numere de unități: Anul 12, Ziua 3, sau doar 12. Pot fi negative.
timeline-lanes = Benzi
timeline-lanes-given = Fiecare copil al centrului este o bandă, până alegeți. O bandă cuprinde ce este așezat în ramura ei; așezarea ei proprie, dacă are una, este întinderea benzii.
timeline-lanes-chosen = Benzile pe care le-ați ales, în ordinea textului.
timeline-lanes-reset = Din nou fiecare copil al centrului
timeline-one-lane = O bandă
timeline-each-child = { $count ->
    [one] Copilul lui o bandă
    [few] Fiecare dintre cei { $count } copii o bandă
   *[other] Fiecare dintre cei { $count } de copii o bandă
}
timeline-no-branches = Harta nu are încă nimic sub centrul ei.
timeline-lanes-by-kind = Benzi după tip
timeline-lanes-by-kind-hint = Fiecare element de un tip o bandă a lui: fiecare personaj, fiecare loc.
timeline-each-of-kind = Fiecare o bandă
timeline-chronology = Adaugă o cronologie la hartă
timeline-chronology-hint = Un element cu un tabel a tot ce este așezat, în ordinea timpului, pe care se poate scrie și care se tipărește
timeline-chronology-title = Cronologie
timeline-chronology-when = Când
timeline-chronology-what = Ce
timeline-chronology-made = S-a adăugat o cronologie la hartă
timeline-elsewhere = Altundeva în hartă
timeline-elsewhere-chosen = Benzile sunt alese: ce nu stă în niciuna dintre ele stă aici. Apăsați ca să alegeți benzile din nou.
timeline-ordered = În ordine, fără date
timeline-empty = Nimic nu spune încă când este. Alegeți „Spune când este…” din meniul unui element.
timeline-unplaced = { $count ->
    [one] Un element nu s-a putut așeza:
    [few] { $count } elemente nu s-au putut așeza:
   *[other] { $count } de elemente nu s-au putut așeza:
}
timeline-contradiction = nu poate fi acolo unde spune că este
# Dragging what is placed, and placing what is not.
timeline-moving = Mută prin tragere
timeline-moving-hint = Trageți un element de-a lungul axei, sau marginea unei întinderi, ca să-i schimbați timpul; oprit, ca să nu se miște nimic din greșeală
timeline-without = Elemente fără timp
timeline-without-hint = Trageți unul pe cronologie, sau apăsați-l ca să spuneți când este:
timeline-waiting-hint = Nu spune încă nimic despre timpul lui: apăsați-l ca să spuneți când este, sau trageți-l de-a lungul benzii ca să-l așezați
timeline-unknown = se referă la ce nu este așezat, sau la un timp care nu se poate citi

## Saying when an element is
when-title = Când este
when-say = Spune când este…
when-change = Când este…
when-clear = Nu mai spune
when-kind = Într-un punct, sau pe o întindere
when-point = Într-un punct
when-span = Pe o întindere
when-when = Când
when-start = De la
when-end = Până la
when-at = La un timp
when-after = După un element
when-before = Înaintea unui element
when-between = Între două elemente
when-during = În timpul unui element
when-time = Timp
when-time-placeholder = 431 BC, May 1453, c. 480…
when-unit-placeholder = Anul 12, Ziua 3, 12…
when-unread = Aceasta nu se poate citi ca timp.
when-after-what = După
when-before-what = Înainte de
when-during-what = În timpul
when-choose = Alege un element…
when-approx = Aproximativ
# A margin either side of a written time, drawn fading away both ways from it.
when-margin = Plus-minus
when-margin-placeholder = 5 years, 3 months, 10 days…
when-margin-unit-placeholder = 5…
when-margin-unread = Aceasta nu se poate citi ca durată.
when-hint-dates = Se citesc ani, date, luni, secole și decenii, scrise ca în engleză, cu BC sau BCE unde este nevoie. Un an înseamnă anul întreg.
when-hint-units = Timpurile sunt numere de unități ale cronologiei, stabilite sub benzile ei. „Anul 12” și „12” sunt același lucru.
when-bc = î.Hr.
# $month: 1 to 12; $year: as written.
when-month-of = { $year }, luna { $month }
# How a placement is said beside the element: "after the quarrel, before the embassy".
when-said-after = după
when-said-before = înainte de
when-said-during = în timpul
when-said-to = până la
when-said-approx = c.
