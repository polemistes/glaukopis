# The projects: the list of them, and what is done with them.

home-title = Proyectos
home-join = Unirse a un proyecto compartido
home-from-document = Un proyecto a partir de un documento…
home-new = Nuevo proyecto

## The two forms of the page: the last used projects as cards, all of them as a list

home-shown = Qué se muestra
home-recent = Usados hace poco
home-all = Todos los proyectos
# Under the cards, when there are more projects than they show.
home-show-all = Mostrar los { $count } proyectos
# The button that opens the menu of the page.
home-page-menu = Más
home-search = Buscar un proyecto
home-search-none = Ningún proyecto se llama así.
home-list-none = No hay proyectos.

## Folders of projects

home-new-folder = Nueva carpeta
home-folder-new-inside = Nueva carpeta dentro…
home-folder-rename-title = Renombrar la carpeta
home-folder-name-placeholder = Lo que contiene la carpeta
home-folder-name-missing = Dé un nombre a la carpeta.
home-folder-projects = { $count ->
    [one] { $count } proyecto
    [many] { $count } de proyectos
   *[other] { $count } proyectos
}
home-menu-move = Mover a una carpeta
home-menu-out = Fuera de las carpetas
home-folder-delete-title = ¿Eliminar la carpeta «{ $name }»?
home-folder-delete-message = Las carpetas y los proyectos que contiene se conservan: suben a donde estaba la carpeta.
home-folder-delete-confirm = Eliminar la carpeta
home-folder-failed = Eso no se pudo hacer con la carpeta
home-moved-to = «{ $name }» se movió a { $folder }
home-moved-out = «{ $name }» ya no está en ninguna carpeta
home-move-failed = No se pudo mover el proyecto

## A map of the projects

home-map-menu = Un mapa de los proyectos…
home-map-title = Un mapa de los proyectos
home-map-about = Un proyecto nuevo, con un mapa: las carpetas como elementos, y bajo cada carpeta los proyectos que contiene.
home-map-name-default = Proyectos
home-map-what = Qué contiene el mapa
home-map-names = Solo los nombres
home-map-names-hint = Un elemento por cada proyecto, con su descripción como texto.
home-map-everything = Con todo lo que contienen
home-map-everything-hint = Bajo cada proyecto sus mapas, y bajo cada mapa todos sus elementos, con sus nombres y textos.
home-map-note = Las citas conservan sus referencias. Una remisión a una figura o a una parte no apunta a nada en el proyecto nuevo, y los comentarios se quedan atrás.
home-map-reading = Leyendo «{ $name }»…
home-map-working = Haciendo el mapa…
home-map-make = Hacer el mapa
home-map-failed = No se pudo hacer el mapa de los proyectos

## When there are none yet

home-welcome = Le damos la bienvenida a Glaukopis
home-welcome-text = Un proyecto reúne el trabajo de un libro o un artículo: los mapas de sus ideas, los textos que escribe en ellos, y las referencias en que se apoyan.
home-begin = Empezar un proyecto

## A project in the list

# Under the names of the first four maps.
home-more-maps = y { $count } más
home-maps = { $count ->
    [one] { $count } mapa
    [many] { $count } de mapas
   *[other] { $count } mapas
}
home-elements = { $count ->
    [one] { $count } elemento
    [many] { $count } de elementos
   *[other] { $count } elementos
}
home-words = { $count ->
    [one] { $count } palabra
    [many] { $count } de palabras
   *[other] { $count } palabras
}
home-references = { $count ->
    [one] { $count } referencia
    [many] { $count } de referencias
   *[other] { $count } referencias
}
home-not-begun = Sin empezar
home-shared = Compartido
# "ago" is how long ago it was: "3 hours ago", "yesterday", "12 March".
home-changed = Cambiado { $ago }
# The button that opens the menu of a project.
home-more-for = Más para { $name }
home-deleted-projects = { $count ->
    [one] { $count } proyecto eliminado
    [many] { $count } de proyectos eliminados
   *[other] { $count } proyectos eliminados
}

## The menu of a project

home-menu-rename = Renombrar…
home-menu-duplicate = Duplicar…
home-menu-history = Versiones anteriores…

## Naming a project

home-rename-title = Renombrar el proyecto
home-duplicate-title = Duplicar el proyecto
home-name = Nombre
home-name-placeholder = El título provisional del libro o el artículo
home-name-missing = Dé un nombre al proyecto.
home-create = Crear
home-duplicate = Duplicar
# The name a copy of a project is given, until it is given another.
home-copy-name = { $name }, copia
home-failed = Eso no funcionó.

## Deleting a project

home-delete-title = ¿Eliminar «{ $name }»?
home-delete-message = El proyecto se mueve a la papelera de Glaukopis, de la que se puede recuperar. Sus referencias no se tocan.
home-delete-owner = El proyecto se mueve a la papelera de Glaukopis, de la que se puede recuperar. Sigue en el servidor y con aquellos con quienes lo comparte; para quitarlo del servidor, ábralo y deje de compartirlo primero.
home-delete-member = El proyecto se mueve a la papelera de Glaukopis, de la que se puede recuperar. Los demás conservan el suyo.
home-delete-confirm = Eliminar el proyecto
home-deleted = «{ $name }» se movió a la papelera
home-delete-failed = No se pudo eliminar el proyecto

## The trash

home-trash-title = Proyectos eliminados
home-trash-none = No hay ninguno.
home-deleted-ago = Eliminado { $ago }
home-restore = Recuperar
home-restored = «{ $name }» vuelve a estar entre los proyectos
home-restore-failed = No se pudo recuperar el proyecto
home-purge = Eliminar definitivamente
home-purge-title = ¿Eliminar «{ $name }» definitivamente?
home-purge-message = Después de esto, lo que contiene el proyecto no se puede recuperar. Sus referencias no se tocan.
home-purge-failed = No se pudo eliminar el proyecto

## Earlier versions of a project

home-history-title = Versiones anteriores
home-history-about = De «{ $name }». Una versión se abre como proyecto propio; este se queda como está.
home-history-none = Aún no se ha guardado ninguna. Se guarda una versión de vez en cuando mientras trabaja: a menudo para lo reciente, más de tarde en tarde para lo antiguo.
home-history-open = Abrir una copia
# The name of the project an earlier version is opened as; "day" is the day it was kept.
home-history-copy-name = { $name }, a { $day }
home-history-unread = No se pudieron leer las versiones anteriores
home-history-open-failed = No se pudo abrir esa versión
