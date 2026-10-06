# Timelines: when elements are, and a map seen along an axis of time.

timeline-title = Linea del tempo
timeline-view = La linea del tempo
timeline-settings = La linea del tempo
timeline-axis = Asse
timeline-axis-dates = Date
timeline-axis-units = Unità tue
timeline-dates-hint = Anni, con BC dove serve: 431 BC, c. 480 BCE, 1453-05-29; mesi e secoli per ora in inglese: May 1453, 5th century BC.
timeline-unit = Come si chiama un'unità
timeline-unit-placeholder = anno, giorno, ciclo…
timeline-units-hint = I tempi sono numeri dell'unità: Anno 12, Giorno 3, o solo 12. Possono essere negativi.
timeline-lanes = Corsie
timeline-lanes-given = Ogni figlio del centro è una corsia, finché non scegli. Una corsia contiene ciò che è collocato nel suo ramo; la sua collocazione, se ne ha una, è l'estensione della corsia.
timeline-lanes-chosen = Le corsie che hai scelto, nell'ordine del testo.
timeline-lanes-reset = Di nuovo ogni figlio del centro
timeline-one-lane = Una corsia
timeline-each-child = { $count ->
    [one] Il suo figlio una corsia
    [many] Ciascuno dei { $count } figli una corsia
   *[other] Ciascuno dei { $count } figli una corsia
}
timeline-no-branches = La mappa non ha ancora nulla sotto il centro.
timeline-lanes-by-kind = Corsie per tipo
timeline-lanes-by-kind-hint = Ogni elemento di un tipo una corsia a sé: ogni personaggio, ogni luogo.
timeline-each-of-kind = Ciascuno una corsia
timeline-chronology = Aggiungi una tavola cronologica alla mappa
timeline-chronology-hint = Un elemento con una tabella di tutto ciò che è collocato, in ordine di tempo, su cui scrivere e da stampare
timeline-chronology-title = Tavola cronologica
timeline-chronology-when = Quando
timeline-chronology-what = Che cosa
timeline-chronology-made = Una tavola cronologica è stata aggiunta alla mappa
timeline-elsewhere = Altrove nella mappa
timeline-elsewhere-chosen = Le corsie sono scelte: ciò che non sta in nessuna di esse sta qui. Premi per scegliere di nuovo le corsie.
timeline-ordered = In ordine, senza date
timeline-empty = Nulla dice ancora quando è. Scegli «Di' quando è…» nel menu di un elemento.
timeline-unplaced = { $count ->
    [one] Un elemento non si è potuto collocare:
    [many] { $count } elementi non si sono potuti collocare:
   *[other] { $count } elementi non si sono potuti collocare:
}
timeline-contradiction = non può essere dove dice di essere
# Dragging what is placed, and placing what is not.
timeline-moving = Sposta trascinando
timeline-moving-hint = Trascina un elemento lungo l'asse, o il bordo di un periodo, per cambiarne il tempo; spento, perché nulla si sposti per sbaglio
timeline-without = Elementi senza un tempo
timeline-without-hint = Trascinane uno sulla linea del tempo, o premilo per dire quando è:
timeline-waiting-hint = Non dice ancora nulla del suo tempo: premilo per dire quando è, o trascinalo lungo la corsia per collocarlo
timeline-unknown = rimanda a ciò che non è collocato, o a un tempo che non si può leggere

## Saying when an element is
when-title = Quando è
when-say = Di' quando è…
when-change = Quando è…
when-clear = Non dirlo più
when-kind = In un punto, o lungo un periodo
when-point = In un punto
when-span = Lungo un periodo
when-when = Quando
when-start = Da
when-end = A
when-at = A un tempo
when-after = Dopo un elemento
when-before = Prima di un elemento
when-between = Tra due elementi
when-during = Durante un elemento
when-time = Tempo
when-time-placeholder = 431 BC, May 1453, c. 480…
when-unit-placeholder = Anno 12, Giorno 3, 12…
when-unread = Questo non si può leggere come un tempo.
when-after-what = Dopo
when-before-what = Prima di
when-during-what = Durante
when-choose = Scegli un elemento…
when-approx = Circa
# A margin either side of a written time, drawn fading away both ways from it.
when-margin = Più o meno
when-margin-placeholder = 5 years, 3 months, 10 days…
when-margin-unit-placeholder = 5…
when-margin-unread = Questo non si può leggere come una durata.
when-hint-dates = Si leggono anni, date, mesi, secoli e decenni, con BC o BCE dove serve; mesi e secoli per ora in inglese. Un anno sta per l'anno intero.
when-hint-units = I tempi sono numeri dell'unità della linea del tempo, impostata sotto le sue corsie. «Anno 12» e «12» sono la stessa cosa.
when-bc = a.C.
# $month: 1 to 12; $year: as written.
when-month-of = { $year }, mese { $month }
# How a placement is said beside the element: "after the quarrel, before the embassy".
when-said-after = dopo
when-said-before = prima di
when-said-during = durante
when-said-to = a
when-said-approx = c.
