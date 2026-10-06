# The full history of a project, in English.
# See locales/README.md.

history-title = Historial
history-between = Entre los mapas y el historial
history-settings = Ajustes del historial
history-failed = No se pudo leer el historial.
history-reading = Leyendo el historial…

## When it is not kept

history-off = El historial de este proyecto no se guarda.
history-on-word = Se guarda cada cambio
history-off-word = No se guarda
history-off-about = Mientras se guarda, se guarda cada cambio, con quién lo hizo y cuándo: el proyecto se puede ver como estaba en cualquier momento, y recuperarlo. Ocupa espacio, y en un proyecto compartido muestra a los demás qué escribió cada uno, y cuándo.
history-turn-on = Guardar el historial

## The moments

# Someone whose name the history does not know.
history-someone = Alguien
history-began = Empieza el historial
# The time a session began and ended.
history-span = { $from } – { $to }
# Older history that was merged, so that moments within it are gone.
history-merged = guardado con menos detalle
history-added = { $count ->
    [one] +1 carácter
    [many] +{ $count } de caracteres
   *[other] +{ $count } caracteres
}
history-removed = { $count ->
    [one] −1 carácter
    [many] −{ $count } de caracteres
   *[other] −{ $count } caracteres
}

## The map as it was

history-back = Volver al presente
history-as-it-was = Como estaba { $when }
history-marked = Lo que cambió desde el momento anterior se marca con el color de quien lo cambió.
history-map-not-there = Este mapa no existía entonces.
history-added-by = Añadido por { $name }
history-removed-by = Quitado por { $name }
history-changed-by = Cambiado por { $name }
# A cross-reference to a figure, a table or a part, where it is not known what it said.
history-pointer = remisión
history-name-moment = Dar nombre a este momento
history-name-placeholder = Cómo llamarlo
history-named = El momento se llama «{ $name }».
history-bring-back-element = Recuperar este elemento como estaba
history-bring-back-map = Recuperar el mapa como estaba
history-brought-back = Recuperado como estaba. Deshacer lo revierte.
history-bring-back-failed = No se pudo recuperar.
history-open-copy = Abrir como proyecto propio
history-copy-name = { $name }, como estaba el { $day }
history-copy-failed = No se pudo hacer el proyecto.

## Archives

history-open-archive = Abrir un archivo de historial…
history-archive-kind = Historial de Glaukopis
history-archive-unread = No se pudo leer el archivo.
history-archive-of = Archivo: { $name }
history-archive-close = Cerrar

## Settings

history-keep = Guardar el historial
history-room = El historial ocupa { $size }.
history-turn-off-title = ¿Dejar de guardar el historial?
history-turn-off-message = Lo guardado se elimina. El proyecto en sí se queda como está.
history-turn-off-shared = Lo guardado se elimina, aquí y en los equipos de aquellos con quienes se comparte el proyecto. El proyecto en sí se queda como está.
history-turn-off = Eliminar el historial
history-finely = Historial antiguo
history-finely-about = Los cambios antiguos se funden, para que ocupen menos y se lean antes; los momentos dentro de ellos ya no pueden distinguirse. Los momentos con nombre, y aquellos con los que comparan las revisiones, se conservan.
history-hourly = Fundir cada hora en una después de
history-weeks = { $count ->
    [one] semana
    [many] de semanas
   *[other] semanas
}
history-daily = Fundir cada día en uno después de
history-months = { $count ->
    [one] mes
    [many] de meses
   *[other] meses
}
history-before = Lo anterior
history-before-choose = Elija un momento del historial para archivar o eliminar lo anterior a él.
history-before-about = El historial anterior a { $when } se puede archivar en un archivo, para verlo más tarde, o eliminar.
history-archive = Archivar…
history-delete = Eliminar
history-archive-title = ¿Archivar el historial anterior a { $when }?
history-delete-title = ¿Eliminar el historial anterior a { $when }?
history-cut-message = Lo que queda empieza con el proyecto como estaba entonces.
history-cut-kept = { $count ->
    [one] Hay antes un momento con nombre o revisado, que ya no podrá verse aquí.
    [many] Hay antes { $count } de momentos con nombre o revisados, que ya no podrán verse aquí.
   *[other] Hay antes { $count } momentos con nombre o revisados, que ya no podrán verse aquí.
}
history-cut-not-here = El historial no se puede cortar antes de este momento.
history-cut-failed = No se pudo cortar el historial.
history-archive-until = hasta { $when }
history-archived = El historial anterior a { $when } está archivado.
history-deleted = El historial anterior a { $when } se ha eliminado.
