# Reviewing changes afterwards (ADR 0022): the panel of changes beside the
# text, in English. See locales/README.md.

review-title = Cambios
# The button over the text that opens the panel.
review-open = Revisar los cambios
review-since-last = Desde su última revisión
review-since-beginning = Desde que empezó el historial
review-since-session = Desde que empezó { $who }, { $when }
review-since-named = Desde «{ $name }»
# When the moment compared with was, under what it is.
review-since-when = Desde { $when }
review-choose-since = Revisar desde otro momento
review-own = También sus propios cambios
review-unit = Revisar por
review-by-sentence = Frase
review-by-paragraph = Párrafo
review-left = { $count ->
    [one] Queda un cambio
    [many] Quedan { $count } de cambios
   *[other] Quedan { $count } cambios
}
review-position = { $index } de { $count }
review-working = Calculando los cambios…
review-failed = No se pudieron calcular los cambios.
review-nothing = No queda nada que revisar
review-nothing-text = Se ha aceptado todo lo que los demás han cambiado desde entonces.
review-list = Los cambios de este mapa

## What a change is.

review-kind-changed = Cambiado
review-kind-added = Texto nuevo
review-kind-removed = Texto eliminado
review-kind-moved = Movido
review-kind-object = { $what ->
    [figure] Figura
    [table] Tabla
    [equation] Ecuación
    [citation] Cita
    [math] Fórmula
    [footnote] Nota
    [crossref] Remisión
   *[other] Algo que no es texto
}
review-kind-put-in = Insertado: { $what }
review-kind-taken-out = Quitado: { $what }
review-kind-altered = Cambiado: { $what }
review-element-added = Elemento añadido
review-element-removed = Elemento eliminado
review-element-moved = Elemento movido
review-element-heading = Impreso como encabezado
review-element-no-heading = Ya no se imprime como encabezado
review-element-excluded = Dejado fuera del documento
review-element-included = Devuelto al documento
review-element-other = Elemento cambiado
# Where a change is: the name of the element.
review-in = En «{ $element }»
review-moved-from = De «{ $element }»
review-untitled = Sin título
review-gone-element = Un elemento que ya no está
review-was = Como estaba
review-is = Como está
review-nothing-there = Nada
review-someone = Alguien
review-now-under = Ahora bajo «{ $element }»
review-was-under = Estaba bajo «{ $element }»

## What is done with a change.

review-accept = Aceptar
review-reject = Rechazar
review-later = Más tarde
review-previous = El anterior
review-reject-cannot = Lo que se eliminó del mapa, o una figura que se quitó, se recupera del historial.
review-versions = Su historial
review-versions-count = { $count ->
    [one] Una versión
    [many] { $count } de versiones
   *[other] { $count } versiones
}
review-versions-reading = Leyendo su historial…
review-versions-none = No pasó nada entre los dos extremos.
review-version-by = { $who }, { $when }
review-accept-up-to = Aceptar hasta aquí
review-use-version = Usar esta versión

## Without the history.

review-no-history = El historial de este proyecto no se guarda
review-no-history-text = Los cambios se revisan a partir del historial del proyecto, que dice quién cambió qué, y cuándo. Se guarda desde el momento en que se activa.
review-turn-on = Guardar el historial
review-turn-on-elsewhere = Se activa con el historial del proyecto.
