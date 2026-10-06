# Searching: in the text of a map, in the edit box of an element, and
# through everything. See locales/README.md and docs/adr/0017.

## The bar over a text

search-find = Buscar
search-replace-with = Reemplazar por
search-replace = Reemplazar
search-replace-all = Reemplazar todo
search-previous = El anterior
search-next = El siguiente
search-close = Cerrar la búsqueda
search-show-replace = Reemplazar también
search-hide-replace = Solo buscar
# Which of those found is shown: "3 of 17".
search-count = { $current } de { $count }
search-found = { $count ->
    [one] Uno encontrado
    [many] { $count } encontrados
   *[other] { $count } encontrados
}
search-nothing = No se encontró nada
search-invalid = No es una expresión regular
search-replaced = { $count ->
    [0] Nada reemplazado
    [one] Uno reemplazado
    [many] { $count } reemplazados
   *[other] { $count } reemplazados
}

## The options

search-case = Mayúsculas tal como se escriben
search-whole-words = Solo palabras enteras
search-accents = Letras con y sin tilde por igual
search-accents-sign = é=e
search-regex = Una expresión regular
search-selection = Solo en el texto seleccionado
search-selection-none = Seleccione texto primero, para buscar solo en él
search-labels = También citas, fórmulas y remisiones
search-labels-outside = También lo que está fuera de los textos

## The search through everything

search-everything = Buscar
search-everything-title = Buscar en todo
search-everything-field = Buscar en los proyectos
search-last-project = El último proyecto
search-all-projects = Todos los proyectos
search-reading = Leyendo { $name }…
search-no-projects = No hay proyectos en los que buscar.
search-more = { $count ->
    [one] y uno más
    [many] y { $count } más
   *[other] y { $count } más
}
search-in-project = { $count ->
    [one] Uno en este proyecto
    [many] { $count } en este proyecto
   *[other] { $count } en este proyecto
}
search-everything-found = { $count ->
    [one] Uno encontrado
    [many] { $count } encontrados
   *[other] { $count } encontrados
} { $projects ->
    [one] en un proyecto
    [many] en { $projects } de proyectos
   *[other] en { $projects } proyectos
}
search-where-details = Los datos del documento
# An association that has a name, with the elements at its ends: "Part 1 ↔ Part 2".
search-where-association = La asociación { $ends }
search-where-note = Lo que piensa de { $work }
# Said before what was found in a note.
search-in-note = nota
search-untitled = Sin título
search-could-not-read = No se pudo leer { $name }.
