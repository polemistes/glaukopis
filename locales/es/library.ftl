# The library: the references, the form they are written in, and what
# brings them in, in English. The fields and types of the form are in
# fields.ftl. See locales/README.md.

## The form of a reference.

library-form-often-used = De uso frecuente
library-form-add-field = Añadir campo
library-form-citation-key = Clave de cita
# In the empty field of the citation key: what it is given if nothing is written.
library-form-key-made = se hace de autor y año
library-form-date-problem = Escriba la fecha como 1979, 1979-05 o 1979-05-12; un intervalo como 1979/1985.
library-form-remove-field = Quitar { $field }

## The people of a reference, with the name of their field: “Author: family name”.

library-names-kept-whole = Institución u otro nombre que se conserva entero
library-names-prefix-suffix = Partícula y sufijo
    .hint = «van», «de la» · «Jr.», «III»
library-names-move-up = Subir
library-names-move-down = Bajar
library-names-more = Más para este nombre
library-names-name = Nombre
library-names-name-of = { $role }: nombre
library-names-family = Apellidos
library-names-family-of = { $role }: apellidos
library-names-given = Nombre de pila
library-names-given-of = { $role }: nombre de pila
library-names-prefix = Partícula: van, de la
library-names-prefix-of = { $role }: partícula
library-names-suffix = Sufijo: Jr., III
library-names-suffix-of = { $role }: sufijo

## Words for references, wherever they are shown.

library-untitled = Sin título
library-no-author = Sin autor
library-no-title = Sin título
library-in-library = En su biblioteca

## Why a reference is taken for another: “the same DOI and the same file”.

library-reason-doi = el mismo DOI
library-reason-isbn = el mismo ISBN
library-reason-identical = igual en todo lo que distingue una obra de otra
# How far the title, the author and the year agree: the same, like (titles
# that differ in a few letters or a subtitle, an author in common, years a
# year apart), or none (one of them says nothing of it).
library-reason-alike = { $title ->
    [same] { $author ->
        [same] { $year ->
            [same] el mismo título, autor y año
            [like] el mismo título y autor, con un año de diferencia
           *[none] el mismo título y autor, el año solo en una de las dos
        }
        [like] { $year ->
            [same] el mismo título y año, y un autor en común
            [like] el mismo título, un autor en común, un año de diferencia
           *[none] el mismo título, un autor en común, el año solo en una de las dos
        }
       *[none] { $year ->
            [same] el mismo título y año, el autor solo en una de las dos
            [like] el mismo título, un año de diferencia, el autor solo en una de las dos
           *[none] el mismo título, el autor y el año solo en una de las dos
        }
    }
   *[like] { $author ->
        [same] { $year ->
            [same] el mismo autor y año, y un título parecido
            [like] el mismo autor, un título parecido, un año de diferencia
           *[none] el mismo autor, un título parecido, el año solo en una de las dos
        }
        [like] { $year ->
            [same] el mismo año, un título parecido, un autor en común
            [like] un título parecido, un autor en común, un año de diferencia
           *[none] un título parecido, un autor en común, el año solo en una de las dos
        }
       *[none] { $year ->
            [same] el mismo año, un título parecido, el autor solo en una de las dos
            [like] un título parecido, un año de diferencia, el autor solo en una de las dos
           *[none] un título parecido, el autor y el año solo en una de las dos
        }
    }
}
library-reason-file = el mismo archivo
# Several reasons: those before the last, set apart by commas, and the last.
library-reasons = { $others } y { $last }

## The size of a file.

library-size-bytes = { $size } B
library-size-kilobytes = { $size } kB
library-size-megabytes = { $size } MB

## What may be in the library already, while a reference is written.

library-duplicate-certain = Esto ya está en su biblioteca.
library-duplicate-probable = Puede que esto ya esté en su biblioteca.
library-duplicate-use = Usar esta

## Duplicates in the library.

library-duplicates-title = Duplicados
library-duplicates-count = { $count ->
    [one] { $count } referencia parece estar en la biblioteca más de una vez
    [many] { $count } de referencias parecen estar en la biblioteca más de una vez
   *[other] { $count } referencias parecen estar en la biblioteca más de una vez
}
library-duplicates-none = Sin duplicados
    .text = Ninguna referencia parece estar en la biblioteca más de una vez.
library-duplicates-no-more = No hay más duplicados
    .text = Las citas de las referencias que se fusionaron citan ahora las que se conservaron.
library-duplicates-how = Cuando varias referencias se hacen una, la que conserva recibe de las otras lo que le falta, y conserva lo suyo donde difieren. Sus archivos y colecciones se juntan, y lo que las cita pasa a citar la conservada.
library-duplicates-same = Iguales
library-duplicates-probably-same = Probablemente iguales
library-duplicates-keep-which = La que conservar
library-duplicates-kept = Conservada
library-duplicates-different = Son distintas
library-duplicates-merge = Hacerlas una
library-duplicates-merging = Haciéndolas una…
library-duplicates-failed = No se pudieron buscar duplicados en la biblioteca
library-duplicates-merge-failed = No se pudieron hacer una

## Importing references: what a file holds, against what the library has.

library-import = Importar
library-import-title = Importar referencias
# What is imported, and from where: a file, Zotero.
library-import-subtitle = { $count ->
    [one] { $count } referencia en { $source }
    [many] { $count } de referencias en { $source }
   *[other] { $count } referencias en { $source }
}
library-import-review = { $count ->
    [one] { $count } referencia puede estar ya en su biblioteca
    [many] { $count } de referencias pueden estar ya en su biblioteca
   *[other] { $count } referencias pueden estar ya en su biblioteca
}
library-import-new = { $count ->
    [one] { $count } referencia nueva
    [many] { $count } de referencias nuevas
   *[other] { $count } referencias nuevas
}
library-import-complete = { $count ->
    [one] { $count } referencia que ya está en su biblioteca gana datos
    [many] { $count } de referencias que ya están en su biblioteca ganan datos
   *[other] { $count } referencias que ya están en su biblioteca ganan datos
}
library-import-known = { $count ->
    [one] { $count } referencia ya está en su biblioteca
    [many] { $count } de referencias ya están en su biblioteca
   *[other] { $count } referencias ya están en su biblioteca
}
library-import-repeated = { $count ->
    [one] { $count } referencia repetida dentro de la importación
    [many] { $count } de referencias repetidas dentro de la importación
   *[other] { $count } referencias repetidas dentro de la importación
}
# The fields a reference of the library would be given: “Would gain: Publisher, Place”.
library-import-would-gain = Ganaría: { $fields }
library-import-gains-file = Archivo
library-import-gains-zotero = Su clave en Zotero
library-import-what-to-do = Qué hacer
library-import-merge = La misma obra: completar la que tengo
library-import-skip = La misma obra: dejar la mía como está
library-import-add = Otra obra: añadirla
# One answer for every candidate in the same case: “For all 16 that are the same: …”.
library-import-all-certain = Para las { $count } que son la misma:
library-import-all-probable = Para las { $count } que probablemente son la misma:
library-import-all-merge = Completar las que tengo
library-import-all-skip = Dejar las mías como están
library-import-all-add = Añadirlas de todos modos
library-import-more = …y { $count } más.
library-import-unread = { $count ->
    [one] { $count } parte del archivo no se pudo leer
    [many] { $count } de partes del archivo no se pudieron leer
   *[other] { $count } partes del archivo no se pudieron leer
}
library-import-importing = Importando…
# How many are to be added, completed and left out: “3 to add, 1 to complete, 2 left out”.
library-import-counts = { $add } por añadir{ $merge ->
        [0] {""}
       *[other] , { $merge } por completar
    }{ $skip ->
        [0] {""}
       *[other] , { $skip } fuera
    }
library-import-failed = La importación falló.

## The library: the list of references, and what can be done with them.

library-references = Referencias
library-unread = No se pudo leer la biblioteca
library-all-references = Todas las referencias
library-count = { $count ->
    [one] { $count } referencia
    [many] { $count } de referencias
   *[other] { $count } referencias
}
library-selected = { $count ->
    [one] { $count } referencia seleccionada
    [many] { $count } de referencias seleccionadas
   *[other] { $count } referencias seleccionadas
}
library-selected-of = { $count ->
    [one] { $selected } de { $count } referencia seleccionada
    [many] { $selected } de { $count } de referencias seleccionadas
   *[other] { $selected } de { $count } referencias seleccionadas
}
library-new-reference = Nueva referencia
library-search = Buscar en la biblioteca
library-search-in = Buscar en { $name }
library-search-clear = Borrar la búsqueda
library-sort = Ordenar
library-sort-author = Autor
library-sort-year = Año
library-sort-title = Título
library-sort-added = Fecha de adición
library-sort-modified = Fecha de cambio
library-sort-descending = Descendente

## The filters, beside the search: what kind of publication, who published it, and when.

library-filters = Filtrar
library-filters-on = { $count ->
    [one] Filtro: { $count } activo
    [many] Filtro: { $count } activos
   *[other] Filtro: { $count } activos
}
library-filter-kind = Tipo
library-filter-publisher = Editorial
library-filter-publisher-hint = Parte del nombre
library-filter-any-publisher = Cualquier editorial
library-filter-year = Año
library-filter-from = Desde
library-filter-to = Hasta
library-filter-clear = Quitar los filtros
library-filter-nothing-here = Nada que filtrar aquí.
# When the filters let nothing through.
library-nothing-passes = Ninguna referencia a la vista pasa los filtros.
library-import-export = Importar y exportar
library-import-file = Importar un archivo…
    .hint = BibLaTeX o BibTeX
library-paste = Pegar referencias…
library-add-pdfs = Añadir archivos PDF…
    .hint = Cada uno se consulta, y se guarda
library-import-zotero = Importar de Zotero…
library-find-duplicates = Buscar duplicados…
library-map-library = Un mapa de la biblioteca…
library-map-collection = Un mapa de «{ $name }»…
library-export-library = Exportar la biblioteca…
library-export-collection = Exportar «{ $name }»…
library-export-one = Exportar…
library-export-many = { $count ->
    [one] Exportar { $count } referencia…
    [many] Exportar { $count } de referencias…
   *[other] Exportar { $count } referencias…
}
library-export-title = Exportar referencias
# What a file of exported references is called, before it is given a name.
library-export-file-references = referencias
library-export-file-library = biblioteca
library-exported = { $count ->
    [one] { $count } referencia exportada
    [many] { $count } de referencias exportadas
   *[other] { $count } referencias exportadas
}
library-export-failed = La exportación falló
library-empty = Su biblioteca está vacía
    .text = Las referencias que añada aquí están disponibles en todos sus proyectos. Empiece con una, o traiga las que ya tiene.
library-collection-empty = Aún no hay nada en esta colección
    .text = Arrastre referencias aquí desde la biblioteca, o añada una nueva.
library-nothing-found = No se encontró nada
    .text = Ninguna referencia contiene todas estas palabras.
library-open-file = Abrir el archivo
library-file-open-failed = No se pudo abrir el archivo
library-add-to-collection = Añadir a una colección
library-remove-from = Quitar de «{ $name }»
library-copy-key = Copiar la clave de cita
library-copied-key = Copiado «{ $key }»
library-copy-biblatex = Copiar como BibLaTeX
library-copied = Copiado
library-delete-one-title = ¿Eliminar «{ $name }»?
library-delete-many-title = { $count ->
    [one] ¿Eliminar { $count } referencia?
    [many] ¿Eliminar { $count } de referencias?
   *[other] ¿Eliminar { $count } referencias?
}
# $projects is the number of projects that cite what is deleted, which keep copies of their own.
library-delete-one = Esto quita la referencia de su biblioteca y de todas las colecciones{ $files ->
        [0] {""}
        [one] , junto con { $files } archivo adjunto
        [many] , junto con { $files } de archivos adjuntos
       *[other] , junto con { $files } archivos adjuntos
    }.{ $projects ->
        [0] {""}
        [one] {" "}Se cita en un proyecto, que conserva una copia de ella.
        [many] {" "}Se cita en { $projects } de proyectos, que conservan una copia de ella.
       *[other] {" "}Se cita en { $projects } proyectos, que conservan una copia de ella.
    }
library-delete-many = Esto las quita de su biblioteca y de todas las colecciones{ $files ->
        [0] {""}
        [one] , junto con { $files } archivo adjunto
        [many] , junto con { $files } de archivos adjuntos
       *[other] , junto con { $files } archivos adjuntos
    }.{ $projects ->
        [0] {""}
        [one] {" "}Un proyecto que cita algunas de ellas conserva una copia de esas.
        [many] {" "}{ $projects } de proyectos que citan algunas de ellas conservan una copia de esas.
       *[other] {" "}{ $projects } proyectos que citan algunas de ellas conservan una copia de esas.
    }
library-delete-failed = No se pudieron eliminar las referencias
library-not-done = Eso no se pudo hacer

## Collections.

library-collections = Colecciones
# The projects that cite a work, in its pane.
library-cited-in = Citada en
library-not-cited = No se cita en ningún proyecto.
library-cited-reading = Leyendo los proyectos…
library-collections-hint = Las colecciones reúnen referencias para un tema o un trabajo. Una referencia puede estar en cuantas se quiera.
library-collection-new = Nueva colección
library-collection-new-inside = Nueva colección dentro
library-collection-new-under = Nueva colección en «{ $name }»
library-collection-move-to = Mover a
library-collection-name = Nombre de la colección
library-collection-name-failed = No se pudo dar nombre a la colección
library-collection-expand = Desplegar
library-collection-collapse = Plegar
library-collection-to-top = Mover al nivel superior
library-collection-move-failed = No se pudo mover la colección
library-collection-added = { $count ->
    [one] { $count } referencia añadida a «{ $name }»
    [many] { $count } de referencias añadidas a «{ $name }»
   *[other] { $count } referencias añadidas a «{ $name }»
}
library-collection-already = Ya está en «{ $name }»
library-collection-delete = Eliminar la colección
library-collection-delete-title = ¿Eliminar la colección «{ $name }»?
# The number is that of the collections inside the one that is deleted.
library-collection-delete-message = { $inside ->
    [0] Las referencias se quedan en su biblioteca.
   *[other] Las colecciones que contiene se eliminan también. Las referencias se quedan en su biblioteca.
}
library-collection-delete-failed = No se pudo eliminar la colección
library-collection-count = { $count ->
    [one] { $count } colección
    [many] { $count } de colecciones
   *[other] { $count } colecciones
}

## A map of the library, or of a collection: a new project.

library-map-title-library = Un mapa de la biblioteca
library-map-title-collection = Un mapa de una colección
# The name a project made of the whole library is given.
library-map-library-name = La biblioteca
library-map-name = Nombre
library-map-name-hint = El nombre del proyecto, de su mapa, y del elemento del centro del mapa.
library-map-what-library = Las colecciones se vuelven elementos, anidados como están, y cada referencia un elemento bajo su colección, cuyo texto es una cita de ella. Las referencias que no están en ninguna colección van en el centro.
library-map-what-collection = Las colecciones que contiene se vuelven elementos, anidados como están, y cada referencia un elemento bajo su colección, cuyo texto es una cita de ella.
library-map-nothing = No hay referencias que poner en el mapa.
library-map-make = Hacer el proyecto
library-map-making = Haciendo el proyecto…
library-map-failed = No se pudo hacer el proyecto.

## Bringing references in, from anywhere in the application.

library-files = { $count ->
    [one] { $count } archivo
    [many] { $count } de archivos
   *[other] { $count } archivos
}
library-open-failed = No se pudo abrir la referencia
library-known = { $count ->
    [one] Ya está en su biblioteca
    [many] Ya están en su biblioteca
   *[other] Ya están en su biblioteca
}
library-nothing-to-import = Nada que importar
library-none-found = No se encontraron referencias.
library-import-kinds = Las referencias se leen de archivos .bib, y se hacen de archivos PDF.
library-filter-bib = BibLaTeX y BibTeX
library-filter-all = Todos los archivos
library-files-read-failed = { $count ->
    [one] No se pudo leer el archivo
    [many] No se pudieron leer los archivos
   *[other] No se pudieron leer los archivos
}
library-text-read-failed = No se pudo leer el texto
library-add-pdfs-title = Añadir archivos PDF
library-pdfs-working = { $count ->
    [one] Averiguando qué es el archivo…
    [many] Averiguando qué son { $count } de archivos…
   *[other] Averiguando qué son { $count } archivos…
}
# While PDF files are found out about, one after another.
library-pdfs-progress = { $done } de { $count }: { $name }
library-stop = Detener
# What came of an import, as a list: “3 references added, 1 completed, 2 files stored”.
library-imported-added = { $count ->
    [one] { $count } referencia añadida
    [many] { $count } de referencias añadidas
   *[other] { $count } referencias añadidas
}
library-imported-completed = { $count ->
    [one] { $count } completada
    [many] { $count } de completadas
   *[other] { $count } completadas
}
library-imported-skipped = { $count } ya en la biblioteca
library-imported-files = { $count ->
    [one] { $count } archivo guardado
    [many] { $count } de archivos guardados
   *[other] { $count } archivos guardados
}
library-imported-nothing = No se cambió nada
library-paste-title = Pegar referencias
library-paste-subtitle = BibLaTeX o BibTeX, tantas entradas como quiera
library-paste-continue = Continuar
library-source-label = Código BibLaTeX

## Importing from Zotero.

library-zotero-title = Importar de Zotero
# The file is the database of Zotero, zotero.sqlite, shown as code.
library-zotero-not-found = No se encontró Zotero en este equipo, en los lugares donde suele guardar sus datos. Si los guarda en otro sitio, indique dónde: la carpeta que contiene { $file }.
library-zotero-lead = Lo que se importa se copia en su biblioteca, con sus archivos. Zotero solo se lee, y nada de él se cambia; puede estar abierto mientras tanto.
library-zotero-choose = La carpeta de datos de Zotero
library-zotero-none-there = Ahí no hay ningún Zotero.
library-zotero-unread = No se pudo leer Zotero.
library-zotero-library = Biblioteca
# A library of Zotero, with the number of its references.
library-zotero-library-option = { $name } ({ $count })
library-zotero-my-library = Mi biblioteca
library-zotero-what = Qué importar
library-zotero-everything = Todo
library-zotero-with-files = Con los archivos adjuntos
library-zotero-with-notes = Con las notas, como anotaciones
library-zotero-elsewhere = Otro lugar…
library-zotero-show-where = Indicar dónde…
library-zotero-reading = Leyendo…
library-zotero-read = { $count ->
    [0] Leer
    [one] Leer { $count } referencia
    [many] Leer { $count } de referencias
   *[other] Leer { $count } referencias
}

## Writing a reference.

library-dialog-edit = Editar la referencia
library-dialog-add = Añadir una referencia
library-dialog-back = Volver al formulario
library-dialog-open-failed = No se pudo abrir la referencia.
library-dialog-save-failed = No se pudo guardar la referencia.
# The entry as BibLaTeX, as against the form.
library-source = Código
library-source-unread = No se pudo leer el código.

## A reference, beside the list.

library-pane-label = Referencia
library-pane-more = Más
library-pane-saved = Guardado
library-pane-editing = Editando…
library-pane-not-saved = Sin guardar
library-pane-unread = No se pudo leer la referencia.
library-pane-save-failed = No se pudieron guardar los cambios.
library-pane-note-placeholder = Lo que le parece. Para usted: no forma parte de lo que se cita.
library-pane-files = Archivos
library-pane-attach = Adjuntar
library-pane-attach-title = Adjuntar archivos
library-pane-attach-failed = No se pudo adjuntar el archivo
# Of a file that is attached, and not where it should be.
library-pane-missing = falta
library-pane-reveal = Mostrar en el gestor de archivos
library-pane-reveal-failed = No se pudo abrir la carpeta
library-pane-no-files = No hay archivos. Adjunte un PDF, o suelte uno aquí.
library-pane-detach = Quitar el archivo
library-pane-detach-title = ¿Quitar «{ $name }»?
library-pane-detach-message = El archivo se elimina del almacén de la biblioteca, salvo que otra referencia lo use.
library-pane-detach-failed = No se pudo quitar el archivo
library-pane-leave-collection = Quitar de { $name }
library-pane-duplicate = Duplicar
    .hint = Una referencia nueva que empieza con estos datos
library-pane-edit-source = Editar el código…
library-pane-source-subtitle = La entrada como BibLaTeX. Casi todo es más fácil en el formulario.
library-pane-source-failed = No se pudo mostrar el código
library-pane-added = Añadida el { $date }
library-pane-added-changed = Añadida el { $added } · cambiada el { $changed }

## Looking up a reference.

library-lookup-placeholder = Consúltela: un DOI, un ISBN, o palabras del título y del autor
library-lookup-label = Consultar una referencia
library-lookup-failed = No se pudo consultar nada.
# Where the reference came from: a service such as Crossref.
library-lookup-filled = Completada con datos de { $source }.
library-lookup-others = { $count ->
    [one] { $count } registro más
    [many] { $count } de registros más
   *[other] { $count } registros más
}
library-lookup-scope = Qué buscar
library-lookup-any = Cualquier cosa
library-lookup-books = Libros
library-lookup-articles = Artículos
library-lookup-none = No se encontró nada. Con menos palabras puede encontrarse más: el apellido del autor y una o dos palabras del título.
# What was asked for: a DOI, an ISBN, a number of arXiv or of PubMed.
library-lookup-unknown = No se sabe nada de este { $kind ->
        [doi] DOI
        [isbn] ISBN
        [arxiv] número de arXiv
       *[pmid] número de PubMed
    } donde se preguntó. La referencia se puede escribir a mano abajo.

## What the writer writes about a work.

library-notes = Notas
library-notes-yours = Sus notas
library-notes-on-work = Sus notas sobre esta obra
library-notes-read = Leer sus notas
library-notes-write = Escribir una nota
library-notes-write-on-work = Escribir una nota sobre esta obra
library-notes-not-in-library = Una referencia que no está en su biblioteca
library-notes-this-project = En este proyecto
library-notes-all-projects = En todos los proyectos
library-notes-project-placeholder = Lo que le parece, para esta obra
library-notes-all-placeholder = Lo que le parece, dondequiera que la cite
library-notes-keep-for-all = Guardarla para todos los proyectos
library-notes-write-for-all = Escribir para todos los proyectos
library-notes-carried = La referencia vino con el proyecto, y no está en su biblioteca. Lo que se escribe aquí lo tienen todos los que tienen el proyecto.
library-notes-kept = Se guarda con la referencia en su biblioteca. Acompaña a un proyecto que cite la obra.
library-notes-unread = No se pudieron leer sus notas
library-notes-unsaved = No se pudo guardar su nota
