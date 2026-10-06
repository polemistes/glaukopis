# Timelines: when elements are, and a map seen along an axis of time.

timeline-title = Línea de tiempo
timeline-view = La línea de tiempo
timeline-settings = La línea de tiempo
timeline-axis = Eje
timeline-axis-dates = Fechas
timeline-axis-units = Unidades propias
timeline-dates-hint = Años, con a. C. donde haga falta: 431 a. C., c. 480 a. C., mayo de 1453, 1453-05-29, siglo V a. C.
timeline-unit = Cómo se llama una unidad
timeline-unit-placeholder = año, día, ciclo…
timeline-units-hint = Los tiempos son números de la unidad: Año 12, Día 3, o solo 12. Pueden ser negativos.
timeline-lanes = Carriles
timeline-lanes-given = Cada hijo del centro es un carril, hasta que elija. Un carril contiene lo que está colocado en su rama; su propia colocación, si la tiene, es el intervalo del carril.
timeline-lanes-chosen = Los carriles que eligió, en el orden del texto.
timeline-lanes-reset = Otra vez cada hijo del centro
timeline-one-lane = Un carril
timeline-each-child = { $count ->
    [one] Su hijo un carril
    [many] Cada uno de sus { $count } de hijos un carril
   *[other] Cada uno de sus { $count } hijos un carril
}
timeline-no-branches = El mapa aún no tiene nada bajo su centro.
timeline-lanes-by-kind = Carriles por tipo
timeline-lanes-by-kind-hint = Cada elemento de un tipo en un carril propio: cada personaje, cada lugar.
timeline-each-of-kind = Cada uno un carril
timeline-chronology = Añadir una cronología al mapa
timeline-chronology-hint = Un elemento con una tabla de todo lo colocado, en orden de tiempo, para escribir en él e imprimirlo
timeline-chronology-title = Cronología
timeline-chronology-when = Cuándo
timeline-chronology-what = Qué
timeline-chronology-made = Se añadió una cronología al mapa
timeline-elsewhere = En otra parte del mapa
timeline-elsewhere-chosen = Los carriles están elegidos: lo que no está en ninguno de ellos está aquí. Pulse para elegir los carriles de nuevo.
timeline-ordered = En orden, sin fechas
timeline-empty = Aún nada dice cuándo es. Elija «Decir cuándo es…» en el menú de un elemento.
timeline-unplaced = { $count ->
    [one] Un elemento no se pudo colocar:
    [many] { $count } de elementos no se pudieron colocar:
   *[other] { $count } elementos no se pudieron colocar:
}
timeline-contradiction = no puede estar donde dice que está
# Dragging what is placed, and placing what is not.
timeline-moving = Mover arrastrando
timeline-moving-hint = Arrastre un elemento por el eje, o el borde de un intervalo, para cambiar su tiempo; desactivado, para que nada se mueva por error
timeline-without = Elementos sin tiempo
timeline-without-hint = Arrastre uno a la línea de tiempo, o púlselo para decir cuándo es:
timeline-waiting-hint = Aún no dice nada de su tiempo: púlselo para decir cuándo es, o arrástrelo por el carril para colocarlo
timeline-unknown = remite a algo no colocado, o a un tiempo que no se puede leer

## Saying when an element is
when-title = Cuándo es
when-say = Decir cuándo es…
when-change = Cuándo es…
when-clear = Ya no decirlo
when-kind = En un punto, o durante un intervalo
when-point = En un punto
when-span = Durante un intervalo
when-when = Cuándo
when-start = Desde
when-end = Hasta
when-at = En un momento
when-after = Después de un elemento
when-before = Antes de un elemento
when-between = Entre dos elementos
when-during = Durante un elemento
when-time = Tiempo
when-time-placeholder = 431 a. C., mayo de 1453, c. 480…
when-unit-placeholder = Año 12, Día 3, 12…
when-unread = Esto no se puede leer como un tiempo.
when-after-what = Después de
when-before-what = Antes de
when-during-what = Durante
when-choose = Elegir un elemento…
when-approx = Aproximadamente
# A margin either side of a written time, drawn fading away both ways from it.
when-margin = Más o menos
when-margin-placeholder = 5 años, 3 meses, 10 días…
when-margin-unit-placeholder = 5…
when-margin-unread = Esto no se puede leer como una duración.
when-hint-dates = Se leen años, fechas, meses, siglos y décadas, con a. C. donde haga falta. Un año vale por el año entero.
when-hint-units = Los tiempos son números de la unidad de la línea de tiempo, fijada bajo sus carriles. «Año 12» y «12» son lo mismo.
when-bc = a. C.
# $month: 1 to 12; $year: as written.
when-month-of = { $year }, mes { $month }
# How a placement is said beside the element: "after the quarrel, before the embassy".
when-said-after = después de
when-said-before = antes de
when-said-during = durante
when-said-to = a
when-said-approx = c.
