# Documents that are brought in, each to become a map (ADR 0012), in
# English. See locales/README.md.

documents-choose = Un documento que traer
documents-filter = Documentos
documents-filter-all = Todos los archivos
documents-title-map = Un mapa a partir de un documento
documents-title-project = Un proyecto a partir de un documento
documents-reading = Leyendo { $file }…
documents-reading-hint = Un documento largo lleva un momento.
documents-no-pandoc = Los documentos de este tipo los lee Pandoc, que no está instalado o no se encontró. En los ajustes se puede indicar dónde está.
documents-unread = No se pudo leer el archivo.
documents-title = Título
documents-title-hint-map = El nombre del mapa, y del elemento de su centro.
documents-title-hint-project = El nombre del proyecto, de su mapa, y del elemento del centro del mapa.
# What a project made of a document is called when the document has no title.
documents-untitled = Sin título

## What the document holds, under the number of each.

documents-parts = { $count ->
    [one] Parte
    [many] Partes
   *[other] Partes
}
documents-words = { $count ->
    [one] Palabra
    [many] Palabras
   *[other] Palabras
}
documents-notes = { $count ->
    [one] Nota
    [many] Notas
   *[other] Notas
}
documents-figures = { $count ->
    [one] Figura
    [many] Figuras
   *[other] Figuras
}
documents-tables = { $count ->
    [one] Tabla
    [many] Tablas
   *[other] Tablas
}
documents-equations = { $count ->
    [one] Ecuación
    [many] Ecuaciones
   *[other] Ecuaciones
}

## How often the document cites works of the library, and works the library does not have.

documents-cited-in-library = Las obras de su biblioteca se citan { $cited ->
        [1] una vez
        [2] dos veces
       *[other] { $cited } veces
    }.
documents-cited-not-in-library = Las obras que no están en su biblioteca se citan { $missing ->
        [1] una vez
        [2] dos veces
       *[other] { $missing } veces
    }.
documents-cited-both = Las obras de su biblioteca se citan { $cited ->
        [1] una vez
        [2] dos veces
       *[other] { $cited } veces
    }, y las que no están en ella { $missing ->
        [1] una vez
        [2] dos veces
       *[other] { $missing } veces
    }.

## The citations that were found in it (ADR 0015).

documents-found = { $count ->
    [one] Se encontró una cita.
    [many] Se encontraron { $count } de citas.
   *[other] Se encontraron { $count } citas.
}
documents-found-made = { $count ->
    [one] Se encontró una cita, hecha por un programa que guarda referencias.
    [many] Se encontraron { $count } de citas, todas hechas por un programa que guarda referencias.
   *[other] Se encontraron { $count } citas, todas hechas por un programa que guarda referencias.
}
documents-found-some-made = { $count ->
    [one] Se encontró { $count } cita, { $made } de ellas hecha por un programa que guarda referencias.
    [many] Se encontraron { $count } de citas, { $made } de ellas hechas por un programa que guarda referencias.
   *[other] Se encontraron { $count } citas, { $made } de ellas hechas por un programa que guarda referencias.
}
documents-at-once = Convertir de inmediato en citas las hechas por Zotero de obras que están en su biblioteca
# Under the choice: what becomes of a note that holds one of them.
documents-at-once-notes = Una nota que no es más que una cita se convierte en una cita en la línea, que el estilo de citas pone en una nota o en la línea; una nota que dice algo más conserva su cita. Lo que haya elegido para las notas en el panel de citas encontradas, para todas las que sigan, vale también aquí.
documents-go-through-map = Repasar las citas cuando se haga el mapa
documents-go-through-project = Repasar las citas cuando se haga el proyecto

## Making the map.

# Over what the one who brings the document in should know of it.
documents-to-know = Conviene saber
documents-making = Haciendo el mapa…
documents-make-map = Hacer el mapa
documents-make-project = Hacer el proyecto
documents-map-failed = No se pudo hacer el mapa.
