# A project: its view, the tabs of its maps, what is done to elements, and
# the panels at the side with the references and the pictures.

project-list-unreadable = No se pudieron leer los proyectos

## The view of a project

project-open-failed = No se pudo abrir el proyecto
# Shown under the words above when nothing more is known of why.
project-open-failed-detail = No se pudo abrir el proyecto.
project-back = Volver a los proyectos
project-fetching = Obteniendo el proyecto
project-fetching-offline = No se puede conectar con el servidor. El proyecto se obtendrá cuando se pueda.
project-fetching-on-the-way = Viene de camino desde el servidor.
project-all-projects = Todos los proyectos
project-name = Nombre del proyecto
project-rename = Renombrar el proyecto
project-not-saved = Sin guardar
project-redo = Rehacer
project-view = Vista del mapa
project-view-this = Vista de este mapa
project-diagram = Diagrama
project-text = Texto
project-one-at-a-time = Uno a la vez
project-side-by-side = Dos en paralelo
project-close-side = Cerrar este lado
project-references = Referencias
project-pictures = Imágenes
project-side = Referencias, imágenes, historial y cambios
project-side-tabs = Qué muestra el panel lateral
project-side-map = Mapa
project-preview = Vista previa y exportación
project-share = Compartir
project-shared = Compartido
project-shared-offline = Compartido · no se puede conectar con el servidor
project-shared-too-large = Compartido · el servidor no admite los últimos cambios
project-between-maps = Entre los dos mapas
project-between-preview = Entre el mapa y la vista previa
project-between-pictures = Entre el mapa y las imágenes
project-between-references = Entre el mapa y las referencias

## When the sharing ends from the other side

project-unshared = El proyecto ya no está compartido
project-unshared-this = Este proyecto ya no está compartido
project-left-out = Ya no está entre los colaboradores
project-unshared-unfetched = No se había obtenido, así que no hay nada de él en este equipo.
project-unshared-kept = Quien lo compartía lo ha quitado del servidor. Conserva el proyecto como está ahora, y puede seguir trabajando en él por su cuenta.
project-left-out-kept = Conserva el proyecto como está ahora, y puede seguir trabajando en él por su cuenta. Lo que los demás escriban a partir de ahora no le llega.
project-understood = Entendido

## Files dropped on the project

project-drop-picture = Suelte una imagen sobre el elemento al que pertenece
project-cited-in = { $count ->
    [one] La referencia se cita en «{ $name }»
    [many] { $count } de referencias se citan en «{ $name }»
   *[other] { $count } referencias se citan en «{ $name }»
}
# As above, where the element has no name.
project-cited-in-element = { $count ->
    [one] La referencia se cita en «el elemento»
    [many] { $count } de referencias se citan en «el elemento»
   *[other] { $count } referencias se citan en «el elemento»
}

## The tabs of the maps

# The name of a map, or of an element, that has none.
project-untitled = Sin título
# The name of a copy of a map.
project-map-copy = { $name }, copia
project-maps = Mapas
project-map-name = Nombre del mapa
project-new-map = Nuevo mapa
project-map-from-document = Un mapa a partir de un documento…
project-drop-on-map = Suelte sobre un mapa para moverlo allí · mantenga Ctrl para copiar
project-duplicate = Duplicar
project-duplicate-hint = Una copia en la que trabajar; este se queda como está
project-open-beside = Abrir al lado
project-open-beside-hint = Dos mapas en paralelo, para mover elementos entre ellos
project-this-map-actions = Este mapa, y los mapas
project-maps-hint = Los mapas del proyecto: elija uno para abrirlo
project-map-beside = junto a este
project-side-by-side-short = En paralelo
project-preview-short = Vista previa
project-found = Citas encontradas…
# The count is of those found in the map.
project-found-hint = { $count ->
    [one] { $count } por repasar y convertir en cita
    [many] { $count } de citas por repasar y convertir en citas
   *[other] { $count } por repasar y convertir en citas
}
project-found-none = Y texto que parece citas
project-delete-map = Eliminar el mapa
project-delete-map-title = ¿Eliminar el mapa «{ $name }»?
project-delete-map-message = { $count ->
    [one] { $count } elemento y su texto desaparecerán. Se puede deshacer mientras el proyecto esté abierto.
    [many] { $count } de elementos y sus textos desaparecerán. Se puede deshacer mientras el proyecto esté abierto.
   *[other] { $count } elementos y sus textos desaparecerán. Se puede deshacer mientras el proyecto esté abierto.
}
project-copied-to = Copiado a «{ $name }»
project-moved-to = Movido a «{ $name }»

## What is done to elements, in the diagram and in the text

project-add-under = Añadir un elemento debajo
project-add = Añadir un elemento
project-add-after = Añadir un elemento después
project-write-text = Escribir su texto
project-double-click = Doble clic
project-associate = Asociar con…
project-associate-hint = Luego haga clic en el otro elemento
project-heading = Imprimir el nombre como encabezado
project-heading-hint = Desactivado: el nombre es una etiqueta para usted; solo se imprime el texto
project-leave-out = Dejar fuera del documento
project-leave-out-hint = Con todo lo que tiene debajo
# An element that stands for another map: in the document, that map is in its place.
project-stands-for = Representa a «{ $name }»
project-stand-for = Representar a otro mapa
project-stand-for-heading = En el documento, este mapa ocupa su lugar
project-stand-for-none = Ninguno
project-copy-to-map = Copiar a un mapa
project-copy = Copiar
# Pasting what was copied under the element the menu is of.
project-paste-under = Pegar debajo
project-move-to-map = Mover a un mapa
project-map-from-branch = Nuevo mapa de esta rama
project-map-from-branch-hint = Una copia en la que trabajar; esta se queda
project-detach = Soltar de su elemento superior
project-detach-hint = Un elemento suelto, para colocarlo más tarde
project-tidy-branch = Ordenar esta rama
project-place-automatically = Colocar automáticamente
project-delete-keeping = Eliminar, conservando lo que tiene debajo
project-centre-stays = El centro de un mapa se queda
project-centre-stays-detail = Elimine el mapa mismo desde su pestaña.
# One element was deleted, with the elements that were under it.
project-deleted = { $under ->
    [0] Se eliminó «{ $name }»
    [one] Se eliminó «{ $name }», con { $under } elemento debajo
    [many] Se eliminó «{ $name }», con { $under } de elementos debajo
   *[other] Se eliminó «{ $name }», con { $under } elementos debajo
}
project-deleted-many = { $count ->
    [one] { $count } elemento eliminado
    [many] { $count } de elementos eliminados
   *[other] { $count } elementos eliminados
}

project-delete-busy-title = Alguien está escribiendo aquí
# $names: those who are at what would be deleted, as a list.
project-delete-busy-message = { $names } { $count ->
    [one] está
    [many] están
   *[other] están
} trabajando en lo que se eliminaría. Lo que se está escribiendo ahí ahora se perdería con ello, y no se puede recuperar.
project-delete-busy-confirm = Eliminar de todos modos

## An element, open for writing, and as it is shown when the pointer rests on it

project-element = Elemento
project-name-placeholder = Nombre
project-write-here = Escriba aquí. Teclee @ para citar.
project-words = { $count ->
    [one] { $count } palabra
    [many] { $count } de palabras
   *[other] { $count } palabras
}
project-read-on = Doble clic para seguir leyendo
project-stands-for-map = Representa al mapa «{ $name }»
project-name-not-printed = El nombre no se imprime
project-left-out-of-document = Fuera del documento

## The panels at the side: the references and the pictures

project-this-map = Este mapa
project-project = Proyecto
project-library = Biblioteca
project-nothing-found = No se encontró nada
project-edit-reference = Editar la referencia…
project-new-reference = Nueva referencia
project-import-file = Importar un archivo
project-which-references = Qué referencias
project-search-references = Buscar referencias
project-library-empty = Su biblioteca está vacía
project-library-empty-hint = Añada una referencia, o importe las que tiene.
project-no-references = Aún no hay referencias
project-no-references-hint = Lo que cite mientras escribe aparece aquí. Para citar, elija Citar sobre el texto, o teclee @.
project-cited-in-heading = Citada en
project-not-cited = No se cita en este proyecto.
project-references-drag = Arrastre una referencia a un texto para citarla ahí, o sobre un elemento para citarla al final de su texto.
# The count is of the references the project cites that the library lacks.
project-references-foreign = { $count ->
    [one] { $count } de este proyecto no está en su biblioteca.
    [many] { $count } de este proyecto no están en su biblioteca.
   *[other] { $count } de este proyecto no están en su biblioteca.
}
# The store of pictures.
project-store = Almacén
project-open-picture = Abrir…
project-put-into-text = Ponerla en el texto
project-add-pictures = Añadir imágenes de archivos
project-which-pictures = Qué imágenes
project-search-pictures = Buscar imágenes
project-a-picture = Una imagen
project-with-notes = Con notas
project-not-on-computer = No está en este equipo
project-nothing-said = Aún no se dice nada de ella
project-store-empty = El almacén está vacío
project-store-empty-hint = Añada imágenes de archivos, o suéltelas sobre un texto.
project-no-pictures = Aún no hay imágenes
project-no-pictures-map = Las imágenes de las figuras de este mapa aparecen aquí. Las del almacén están en Almacén.
project-no-pictures-project = Las imágenes de las figuras del proyecto aparecen aquí. Las del almacén están en Almacén.
project-pictures-drag = Arrastre una imagen a un texto para hacer una figura ahí, o sobre un elemento para ponerla al final de su texto.
# The count is of the pictures that are used and are not in the store of this computer.
project-pictures-absent-map = { $count ->
    [one] { $count } de este mapa no está en este equipo.
    [many] { $count } de este mapa no están en este equipo.
   *[other] { $count } de este mapa no están en este equipo.
}
project-pictures-absent-project = { $count ->
    [one] { $count } de este proyecto no está en este equipo.
    [many] { $count } de este proyecto no están en este equipo.
   *[other] { $count } de este proyecto no están en este equipo.
}

## Shared by the diagram and the text

# A count of elements that stands alone, as a label of what is dragged.
project-elements = { $count ->
    [one] { $count } elemento
    [many] { $count } de elementos
   *[other] { $count } elementos
}
# One of the others who work on a shared project is at an element.
project-other-here = { $name } está aquí
project-link-placeholder = Cómo se relacionan
project-link-label = Etiqueta de la asociación

## A copy and its original, in another map.
copy-title = La copia y su original
copy-from = Copiado de «{ $name }» en el mapa «{ $map }»
copy-original-changed = El original ha cambiado desde que se copió, o desde la última vez que se vio.
copy-original-same = El original está como cuando se copió.
copy-original-unknown = No se sabe si el original ha cambiado desde que se copió: la copia se hizo antes de que eso se guardara.
copy-original-gone = El original ya no está.
copy-how-shown = Abajo, tachado, lo que solo tiene el original, y marcado, lo que solo tiene esta copia.
copy-alike = Sus nombres y textos son iguales. Pueden diferir en lo que no son palabras: citas, imágenes, marcas.
copy-only-original = Solo en el original
copy-only-copy = Solo en esta copia
copy-go = Ir al original
copy-seen = Conservar esta copia como está
copy-take = Tomar el nombre y el texto del original
copy-changed-mark = El original ha cambiado desde que esto se copió
copy-compare = Comparar con el original…
copy-copied-from = Copiado de «{ $name }» en «{ $map }»
copy-copied-from-changed = Copiado de «{ $name }» en «{ $map }», que ha cambiado desde entonces

## How far the writing of an element has come, as its writer says.
status = Estado
status-idea = Idea
status-draft = Borrador
status-done = Terminado
status-none = Sin estado
# Of an element, where its status is shown: "Draft · 340 words".
status-of = { $status } · { $count ->
    [one] { $count } palabra
    [many] { $count } de palabras
   *[other] { $count } palabras
}
status-count-idea = { $count ->
    [one] { $count } idea
    [many] { $count } de ideas
   *[other] { $count } ideas
}
status-count-draft = { $count ->
    [one] { $count } borrador
    [many] { $count } de borradores
   *[other] { $count } borradores
}
status-count-done = { $count ->
    [one] { $count } terminado
    [many] { $count } de terminados
   *[other] { $count } terminados
}
# The words of the drafts and of what is done, in a map.
status-words-written = { $count ->
    [one] { $count } palabra escrita
    [many] { $count } de palabras escritas
   *[other] { $count } palabras escritas
}
status-progress = Cuánto ha avanzado el mapa
