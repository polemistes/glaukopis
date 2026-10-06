# What the core says of references brought in from elsewhere, in English.
# See locales/README.md.

## Where the references came from, as the list of them says: "3 references in pasted text".

core-import-pasted = texto pegado
core-import-files = { $count ->
    [one] { $count } archivo
    [many] { $count } de archivos
   *[other] { $count } archivos
}

## Files of BibTeX and BibLaTeX.

core-import-file-not-found = No se encontró el archivo «{ $name }».
core-import-empty-entry = Línea { $line }: la entrada «{ $key }» está vacía y se dejó fuera.
# Where in a file a reference that has no key was found.
core-import-origin-line = línea { $line }
core-import-origin-key-line = { $key }, línea { $line }

## What went wrong as the references were taken in, each after the reference
## it concerns: Nagy 1979 “The Best of the Achaeans”.

core-import-title = «{ $title }»
core-import-merge-gone = { $reference }: la entrada con la que fusionar ya no está

## PDF files.

core-import-not-a-pdf = { $name } no es un PDF.
# The service is a name: Crossref, DataCite.
core-import-details-from = Los datos proceden de { $service }.
core-import-number-unknown = Se encontró un número en el archivo, pero las bases de datos no saben nada de él; los datos proceden del propio archivo y conviene comprobarlos.
core-import-databases-failed = No se pudo preguntar a las bases de datos ({ $error }); los datos proceden del propio archivo y conviene comprobarlos.

## Zotero.

core-import-zotero-my-library = Mi biblioteca
core-import-zotero-group = Grupo { $id }
core-import-zotero-the-library = la biblioteca { $id } de Zotero
core-import-zotero-own-library = la biblioteca propia del usuario en Zotero
core-import-zotero-the-collection = la colección { $key } de Zotero
core-import-zotero-unknown-base = No se encontró el archivo «{ $name }». Zotero lo enlaza desde una carpeta que elige él mismo, y que aquí no se conoce.
core-import-zotero-empty-item = El ítem { $key } de Zotero está vacío y se dejó fuera.
core-import-zotero-alone = { $count ->
    [one] { $count } archivo o nota está en Zotero sin ninguna referencia, y se dejó fuera.
    [many] { $count } de archivos y notas están en Zotero sin ninguna referencia, y se dejaron fuera.
   *[other] { $count } archivos y notas están en Zotero sin ninguna referencia, y se dejaron fuera.
}
# The role is Zotero's own name for it: "recipient", "reviewed author".
core-import-zotero-not-a-field = Zotero nombra a { $name } como { $role }, para lo que BibLaTeX no tiene campo. El nombre se dejó fuera.
core-import-zotero-left-out = El campo «{ $field }» de Zotero no tiene equivalente en BibLaTeX y se dejó fuera: { $value }

## Zotero's database.

core-import-zotero-no-database = una base de datos de Zotero ({ $file }) en { $path }
core-import-zotero-copying = al copiar { $path } a una carpeta temporal
core-import-zotero-empty = el archivo está vacío
core-import-zotero-disturbed = Zotero estaba escribiendo en su base de datos mientras se leía. Si falta algo, cierre Zotero e importe de nuevo.
core-import-zotero-backup-read = No se pudo leer la base de datos de Zotero ({ $error }). Se leyó en su lugar su copia de seguridad, { $backup }: falta lo que se cambió en Zotero desde que se hizo la copia.
core-import-zotero-not-a-database = { $path } no es una base de datos de Zotero.
core-import-zotero-unreadable = La base de datos de Zotero tiene una forma que aquí no se puede leer: { $what }. Si la escribió una versión antigua de Zotero, abrirla una vez en una versión actual la pone al día.
core-import-zotero-unreadable-version = La base de datos de Zotero tiene una forma que aquí no se puede leer (versión { $version } de la base de datos de Zotero): { $what }. Si la escribió una versión antigua de Zotero, abrirla una vez en una versión actual la pone al día.
core-import-zotero-no-table = falta la tabla «{ $table }»
core-import-zotero-no-column = la tabla «{ $table }» no tiene la columna «{ $column }»
# What is lacking where a table is not there: one of the six below.
core-import-zotero-no-optional = La base de datos de Zotero no tiene ninguna tabla «{ $table }» de la forma que aquí se conoce: { $consequence }.
core-import-zotero-no-bin = los ítems de la papelera de Zotero no se distinguen de los demás
core-import-zotero-no-collections = no se leyeron las colecciones
core-import-zotero-no-attachments = no se leyeron los archivos adjuntos
core-import-zotero-no-notes = no se leyeron las notas
core-import-zotero-no-keywords = no se leyeron las palabras clave
core-import-zotero-no-group-names = no se conocen los nombres de las bibliotecas de grupo

## PDF files, as they are read for a reference.

core-import-pdf-empty = El archivo «{ $name }» está vacío.
core-import-pdf-not-a-pdf = El archivo «{ $name }» no es un PDF.
core-import-pdf-unreadable = No se pudo leer el archivo: está dañado, protegido con contraseña o es demasiado grande.
core-import-pdf-scan = El archivo no tiene capa de texto: es un documento escaneado.
core-import-pdf-from-file = Los datos proceden del propio archivo, no de un catálogo, y conviene comprobarlos.
core-import-pdf-from-metadata = No se encontró ningún DOI ni ISBN en el archivo; los datos proceden de los metadatos del propio archivo y conviene comprobarlos.
core-import-pdf-unknown = No se encontró ningún DOI ni ISBN en el archivo, y sus metadatos no dicen qué es: hay que completar los datos a mano.

## Tables, from files of text and of sheets.

core-import-table-too-large = El archivo ocupa { $size } MB. Una tabla se lee de un archivo de { $most } MB como máximo.
core-import-table-kinds = Las tablas se leen de CSV y de otros textos con los valores separados por comas, puntos y comas o tabuladores, y de las hojas de cálculo de LibreOffice (.ods) y Excel (.xlsx, .xls).
core-import-table-empty = No hay nada en el archivo.
# The rows are a number, or where the counting was given up, the message below.
core-import-table-rows = La tabla tiene { $rows } filas. Una tabla en un texto puede tener { $most } como máximo: no es una hoja de cálculo.
core-import-table-columns = La tabla tiene { $columns } columnas. Una tabla en un texto puede tener { $most } como máximo: no es una hoja de cálculo.
core-import-table-more-than = más de { $count }

## Documents brought in, to become maps.

core-import-document-stopped = Se detuvo la lectura.
core-import-pdfs-stopped = Se dejó de averiguar qué son los archivos. No se añadió nada.
core-import-document-kind = «{ $file }» no es de un tipo que se pueda traer como documento. Los que se pueden traer son Word (DOCX), OpenDocument (ODT), Markdown, HTML, LaTeX, RTF, EPUB, Org, reStructuredText, Typst y texto sin formato.
core-import-document-too-large = «{ $file }» ocupa más de 50 MB, que es más de lo que se puede traer como documento.
# The kind is the kind of file: Word (DOCX), plain text.
core-import-document-unreadable = «{ $file }» no se pudo leer como { $kind }. Puede estar dañado, o ser de otro tipo del que dice su nombre. Pandoc, que lo lee, dijo: { $message }
core-import-document-pandoc-unreadable = no se pudo leer lo que Pandoc hizo de «{ $file }»: { $error }
# The title of a map made of a document that has none, nor a name of its file.
core-import-document-untitled = Sin título
core-import-document-plain-text = texto sin formato
core-import-document-notebook = cuaderno de Jupyter

## What the one who brings a document in should know of it.

core-import-document-found = { $count ->
    [one] { $made ->
        [all] Se encontró { $count } cita que aún no está vinculada a ninguna referencia de su biblioteca, hecha por un programa que guarda referencias. Queda como el texto con que se escribió, y se puede repasar cuando se haga el mapa, y más tarde.
       *[none] Se encontró { $count } cita que aún no está vinculada a ninguna referencia de su biblioteca. Queda como el texto con que se escribió, y se puede repasar cuando se haga el mapa, y más tarde.
    }
    [many] { $made ->
        [all] Se encontraron { $count } de citas que aún no están vinculadas a referencias de su biblioteca, todas hechas por un programa que guarda referencias. Quedan como el texto con que se escribieron, y se pueden repasar cuando se haga el mapa, y más tarde.
        [some] Se encontraron { $count } de citas que aún no están vinculadas a referencias de su biblioteca, { $some } de ellas hechas por un programa que guarda referencias. Quedan como el texto con que se escribieron, y se pueden repasar cuando se haga el mapa, y más tarde.
       *[none] Se encontraron { $count } de citas que aún no están vinculadas a referencias de su biblioteca. Quedan como el texto con que se escribieron, y se pueden repasar cuando se haga el mapa, y más tarde.
    }
   *[other] { $made ->
        [all] Se encontraron { $count } citas que aún no están vinculadas a referencias de su biblioteca, todas hechas por un programa que guarda referencias. Quedan como el texto con que se escribieron, y se pueden repasar cuando se haga el mapa, y más tarde.
        [some] Se encontraron { $count } citas que aún no están vinculadas a referencias de su biblioteca, { $some } de ellas hechas por un programa que guarda referencias. Quedan como el texto con que se escribieron, y se pueden repasar cuando se haga el mapa, y más tarde.
       *[none] Se encontraron { $count } citas que aún no están vinculadas a referencias de su biblioteca. Quedan como el texto con que se escribieron, y se pueden repasar cuando se haga el mapa, y más tarde.
    }
}
core-import-document-endnote = { $count ->
    [one] { $count } cita hecha por EndNote se trae como el texto que muestra, y no está entre las encontradas: no se pudo leer lo que EndNote dice de las obras.
    [many] { $count } de citas hechas por EndNote se traen como el texto que muestran, y no están entre las encontradas: no se pudo leer lo que EndNote dice de las obras.
   *[other] { $count } citas hechas por EndNote se traen como el texto que muestran, y no están entre las encontradas: no se pudo leer lo que EndNote dice de las obras.
}
core-import-document-bookmarks = { $count ->
    [one] El documento guarda { $count } cita en un marcador, y no se pudo leer lo que cita: es texto tal como está. Zotero las guarda de ese modo cuando así lo dicen las preferencias del documento.
    [many] El documento guarda { $count } de citas en marcadores, y no se pudo leer lo que citan: son texto tal como están. Zotero las guarda de ese modo cuando así lo dicen las preferencias del documento.
   *[other] El documento guarda { $count } citas en marcadores, y no se pudo leer lo que citan: son texto tal como están. Zotero las guarda de ese modo cuando así lo dicen las preferencias del documento.
}
core-import-document-bibliography = El documento tiene una lista de lo que cita, bajo «{ $heading }». Se trae como texto, igual que el resto. El mapa hace su propia bibliografía con lo que se cita en él.
core-import-document-bibliography-made = El documento tiene una lista de lo que cita, hecha por el programa que guarda sus referencias. Se trae como texto, igual que el resto. El mapa hace su propia bibliografía con lo que se cita en él.
core-import-document-tracked = El documento tiene cambios registrados por el control de cambios. El texto se trae tal como queda al aceptarlos todos.
core-import-document-comments = El documento tiene comentarios al margen, que se dejan fuera.
core-import-document-heading-notes = { $count ->
    [one] Una nota de un encabezado queda al principio del texto que hay bajo él: un encabezado no puede tener notas.
    [many] { $count } de notas de encabezados quedan al principio del texto que hay bajo cada uno: un encabezado no puede tener notas.
   *[other] { $count } notas de encabezados quedan al principio del texto que hay bajo cada uno: un encabezado no puede tener notas.
}
# What a caption began with is shown as the document has it: “Figure 1:”.
core-import-document-labels = { $count ->
    [one] { $count } leyenda empezaba con una palabra y un número, como «{ $first }». Se deja fuera: el mapa numera él mismo sus figuras y tablas. Donde el texto nombra una de ellas por su número, eso es texto tal como se escribió, y no sigue la numeración del mapa.
    [many] { $count } de leyendas empezaban con una palabra y un número, como «{ $first }». Se dejan fuera: el mapa numera él mismo sus figuras y tablas. Donde el texto nombra una de ellas por su número, eso es texto tal como se escribió, y no sigue la numeración del mapa.
   *[other] { $count } leyendas empezaban con una palabra y un número, como «{ $first }». Se dejan fuera: el mapa numera él mismo sus figuras y tablas. Donde el texto nombra una de ellas por su número, eso es texto tal como se escribió, y no sigue la numeración del mapa.
}
core-import-document-label-example = Figura 1:
core-import-document-caption-notes = { $count ->
    [one] Una nota en lo que se dice de una figura o una tabla queda ahí entre corchetes.
    [many] { $count } de notas en lo que se dice de figuras o tablas quedan ahí entre corchetes.
   *[other] { $count } notas en lo que se dice de figuras o tablas quedan ahí entre corchetes.
}
core-import-document-headings = { $count ->
    [one] { $count } encabezado dentro de una cita textual, una lista o una tabla se trae como párrafo en negrita.
    [many] { $count } de encabezados dentro de una cita textual, una lista o una tabla se traen como párrafos en negrita.
   *[other] { $count } encabezados dentro de una cita textual, una lista o una tabla se traen como párrafos en negrita.
}
core-import-document-code = { $count ->
    [one] { $count } bloque de código se trae como párrafos corrientes, uno por línea.
    [many] { $count } de bloques de código se traen como párrafos corrientes, uno por línea.
   *[other] { $count } bloques de código se traen como párrafos corrientes, uno por línea.
}
core-import-document-definitions = { $count ->
    [one] { $count } lista de términos con su significado se trae como párrafos, con los términos en negrita.
    [many] { $count } de listas de términos con su significado se traen como párrafos, con los términos en negrita.
   *[other] { $count } listas de términos con su significado se traen como párrafos, con los términos en negrita.
}
core-import-document-rules = { $count ->
    [one] { $count } línea que cruza la página se deja fuera.
    [many] { $count } de líneas que cruzan la página se dejan fuera.
   *[other] { $count } líneas que cruzan la página se dejan fuera.
}
core-import-document-raw = { $count ->
    [one] { $count } fragmento escrito en HTML o TeX solo para un tipo de documento se deja fuera.
    [many] { $count } de fragmentos escritos en HTML o TeX solo para un tipo de documento se dejan fuera.
   *[other] { $count } fragmentos escritos en HTML o TeX solo para un tipo de documento se dejan fuera.
}
core-import-document-pictures-wanting = { $count ->
    [one] { $count } imagen que el archivo contiene no está en el texto que se leyó, y se deja fuera. Puede estar en la cabecera o el pie de las páginas, o en un dibujo.
    [many] { $count } de imágenes que el archivo contiene no están en el texto que se leyó, y se dejan fuera. Pueden estar en la cabecera o el pie de las páginas, o en un dibujo.
   *[other] { $count } imágenes que el archivo contiene no están en el texto que se leyó, y se dejan fuera. Pueden estar en la cabecera o el pie de las páginas, o en un dibujo.
}

## A picture of a document that is left out, and why.

core-import-document-picture-left-out = La imagen «{ $name }» se deja fuera: { $why }.
core-import-document-picture-kind = es de un tipo que no se lee ({ $kind })
core-import-document-picture-not-read = no es una imagen de un tipo que se lea
core-import-document-picture-unreadable = no se pudo leer
core-import-document-picture-network = está en la red, y de ahí no se descarga nada
core-import-document-picture-not-taken-out = no se pudo sacar del archivo
core-import-document-picture-outside = no está en el archivo, sino en otro lugar de este equipo, y de ahí no se toma
core-import-document-picture-not-found = no se encontró el archivo donde el documento dice que está
core-import-document-picture-too-large = ocupa más de 50 MB
core-import-document-picture-file-unreadable = no se pudo leer el archivo
