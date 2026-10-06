# The editor of texts: the tools for writing, citations and notes.
# See locales/README.md.

## The marks and the kinds of paragraph, in the bar over a selection and in
## the tools over the text.

editor-format = Formato
editor-writing = Escritura
editor-italic = Cursiva
editor-bold = Negrita
editor-small-capitals = Versalitas
editor-superscript = Superíndice
editor-subscript = Subíndice
editor-struck = Tachado
editor-quotation = Cita textual
editor-block-quotation = Cita en bloque
editor-list = Lista
editor-text = Texto
editor-text-hint = Un párrafo
editor-quotation-hint = Separada del texto
editor-list-hint = Con una marca delante de cada punto
editor-numbered-list = Lista numerada
editor-numbered-list-hint = Con un número delante de cada punto
editor-verse = Verso
editor-verse-hint = Versos de poesía o de teatro, cada uno en su línea
editor-speaker = Hablante
editor-speaker-hint = Quién habla, en una línea propia
editor-direction = Acotación
editor-direction-hint = Lo que se hace, en cursiva
editor-line-numbers = Números de línea
editor-line-numbers-hint = Numerar las líneas de este verso: desde qué línea, y cada cuántas
editor-line-numbers-from = Numerar las líneas desde
editor-line-numbers-none = Dejar vacío para no numerar
editor-line-numbers-every = Mostrar un número cada
editor-line-numbers-number = Hace falta un número entero.
editor-kinds-text = Texto
editor-kinds-quotation = Cita textual
editor-kinds-verse = Verso
editor-kinds-script = Guion
editor-kinds-more = Más
editor-kinds-words = Palabras
editor-attribution = Atribución
editor-attribution-hint = De quién son las palabras, bajo una cita, a la derecha
editor-epigraph = Epígrafe
editor-epigraph-hint = Una cita a la cabeza de una parte
editor-headword = Lema
editor-headword-hint = La palabra que explica un glosario
editor-gloss = Glosa
editor-gloss-hint = Lo que significa el lema
editor-code = Código
editor-code-hint = Conservado letra por letra, en letras de igual anchura
editor-break = Separación
editor-break-hint = Una pausa entre partes, con el signo que le da el formato
editor-draft = Nota de borrador
editor-draft-hint = Solo para sus ojos: no va a ningún documento
editor-foreign = Palabras en otro idioma
editor-foreign-hint = Palabras de otro idioma, en el que se comprueba su ortografía
editor-title-of-work = Título de obra
editor-title-of-work-hint = El título de un libro, una obra de teatro, un cuadro
editor-term = Término
editor-term-hint = Un término donde se usa por primera vez
editor-mention = Mención
editor-mention-hint = Una palabra de la que se habla como palabra, entre comillas
editor-highlight = Resaltado
editor-highlight-hint = Para la vista en pantalla: no va a ningún documento
editor-underline = Subrayado
editor-code-words = Código en la línea
editor-code-words-hint = Letras de igual anchura, dentro de la línea
editor-scene = Encabezado de escena
editor-scene-hint = INT. CASA – NOCHE
editor-action = Acción
editor-action-hint = Lo que se ve y se hace
editor-character = Personaje
editor-character-hint = Quién habla, sobre el diálogo
editor-dialogue = Diálogo
editor-dialogue-hint = Lo que se dice
editor-parenthetical = Paréntesis
editor-parenthetical-hint = Cómo se dice, entre paréntesis
editor-transition = Transición
editor-transition-hint = CORTE A:, a la derecha
editor-comment = Comentario
editor-comment-hint = Un comentario sobre lo seleccionado
editor-comment-element-hint = Un comentario sobre este elemento; seleccione palabras para comentarlas
editor-parallel = Dos textos en paralelo
editor-parallel-hint = Un original y su traducción, cada uno un texto propio
editor-paragraph-kind = Tipo de párrafo
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = Tipo de párrafo: { $kind }

## The kind menu: the kinds in hand, the whole catalogue under "More…", and
## the format that sets them at its foot. The words menu, with the kinds of
## words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = Más…
editor-kinds-in-hand = Tipos a mano
editor-kinds-own = Propios
editor-kinds-make = Crear un tipo…
editor-kinds-change-own = Cambiar un tipo propio…
# Over the item that opens the format editor: the format sets how each kind looks.
editor-kinds-set-by = Compuestos como los tiene «{ $format }»
editor-kinds-change-format = Cambiar el formato…
editor-kinds-change-format-hint = Cómo se compone cada tipo en este documento
editor-words = Palabras
editor-words-hint = Subrayado, superíndice, código; palabras en otro idioma, el título de una obra, un término
editor-words-make = Crear un tipo de palabras…
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-map = El idioma del mapa
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = Palabras corrientes
editor-own-kind-new = Un tipo propio
editor-own-kind-change = Cambiar el tipo
editor-own-kind-name = Nombre
editor-own-kind-name-placeholder = Carta, telegrama, oración…
editor-own-kind-words-placeholder = Nombre de barco, latín, una palabra clave…
editor-own-kind-name-taken = Ya hay un tipo con ese nombre.
editor-own-kind-based-on = Basado en
editor-own-kind-based-on-hint = Lo que no se diga abajo es como lo tiene este tipo
editor-own-kind-look = En qué se diferencia
editor-own-kind-create = Crear
editor-own-kind-delete-title = ¿Eliminar el tipo «{ $name }»?
editor-own-kind-delete-message = { $count ->
    [0] Ningún texto es de este tipo.
    [one] Lo que es de él en un elemento se queda como está, y se compone como texto en los documentos.
    [many] Lo que es de él en { $count } de elementos se queda como está, y se compone como texto en los documentos.
   *[other] Lo que es de él en { $count } elementos se queda como está, y se compone como texto en los documentos.
}

## Citing, notes, and what is put into the text.

editor-cite = Citar
editor-cite-here = Citar una obra aquí
editor-cite-at-cursor = Citar una obra donde está el cursor
editor-note = Nota
editor-note-selection = Convertir la selección en nota
editor-note-hint = Una nota, a pie de página o al final
editor-insert = Insertar
editor-insert-hint = Una imagen, una tabla, matemáticas, una remisión
editor-new-element = Nuevo elemento
editor-new-element-hint = Un elemento nuevo después de este, o debajo
editor-new-after = Nuevo elemento después de este
editor-new-under = Nuevo elemento debajo de este
editor-new-split = Dividir aquí
editor-new-split-hint = Lo que sigue al cursor pasa a ser un elemento nuevo
editor-spelling-on = La ortografía se comprueba mientras escribe · pulse para dejar de comprobarla
editor-spelling-off = La ortografía no se comprueba · pulse para comprobarla
editor-picture-file = Imagen de un archivo…
editor-picture-file-hint = Una figura, con lo que se dice de ella
editor-picture-store = Imagen del almacén…
editor-picture-store-hint = Las que tiene se muestran al lado
editor-equation = Ecuación
editor-equation-hint = Matemáticas en una línea propia
editor-table = Tabla…
editor-table-hint = De tantas filas y columnas
editor-table-file = Tabla de un archivo…
editor-table-file-hint = CSV, o una hoja de LibreOffice o Excel
editor-formula = Fórmula
editor-formula-hint = Matemáticas en la línea
editor-pointer = Remisión…
editor-pointer-hint = A una figura, una tabla, una ecuación o una parte: «véase la figura 2»
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = imagen

## More.

editor-found = Citas encontradas…
editor-found-count = { $count ->
    [one] { $count } por repasar y convertir en cita
    [many] { $count } de citas por repasar y convertir en citas
   *[other] { $count } por repasar y convertir en citas
}
editor-found-none = Y texto que parece citas, en este mapa

## Choosing a work to cite.

editor-picker = Elegir una referencia
editor-picker-placeholder = Citar: autor, título, año
editor-picker-search = Buscar referencias
editor-picker-results = Referencias
editor-picker-in-project = En este proyecto
editor-picker-recent = Añadidas hace poco
editor-picker-empty = Su biblioteca está vacía.
editor-picker-no-match = Nada en su biblioteca contiene estas palabras.
editor-picker-type = Escriba para buscar en su biblioteca.
editor-picker-new = Nueva referencia…
editor-picker-import = Importar…

## A citation, and each work in it.

editor-citation = Cita
editor-citation-add = Añadir una obra
editor-citation-add-purpose = Añadir una obra a la cita
editor-citation-in-text = Autor en el texto: Nagy (1979)
editor-citation-remove = Quitar la cita
editor-citation-split = Separar las palabras de la cita
editor-citation-split-hint = Las palabras de antes y de después pasan a ser texto de la línea, y cada obra una cita propia, con su página y nada más
editor-citation-not-in-library = Esta referencia no está en su biblioteca.
editor-citation-edit-reference = Editar la referencia
editor-citation-before = Antes
editor-citation-before-placeholder = véase, cf.
editor-citation-after = Después
editor-citation-after-placeholder = y passim
editor-citation-locator-kind = Tipo de lugar
editor-citation-suppress-author = El autor se nombra en mi frase: dar solo el año
editor-citation-remove-work = Quitar esta obra
# Stands in the text in place of a citation of a work that is in neither the library nor the project.
editor-citation-missing = [referencia no encontrada]
# Stands in the text in place of a citation of no work.
editor-citation-empty = (cita)

## The kinds of place in a work a citation can point to, as the menu of a
## citation names them.

editor-locator-page = Página
editor-locator-chapter = Capítulo
editor-locator-section = Sección
editor-locator-paragraph = Párrafo
editor-locator-line = Línea
editor-locator-verse = Verso
editor-locator-book = Libro
editor-locator-volume = Volumen
editor-locator-part = Parte
editor-locator-column = Columna
editor-locator-folio = Folio
editor-locator-figure = Figura
editor-locator-note = Nota
editor-locator-number = Número
editor-locator-sub-verbo = Sub voce

## A note, in the panel it is written in.

# The number is that of the note, or a letter for a note that stands in a place of its own.
editor-note-numbered = Nota { $number }
editor-note-place = Dónde va la nota
editor-note-place-format = Donde el formato pone sus notas
editor-note-place-foot = A pie de página
editor-note-place-end = Al final del texto
editor-note-placeholder = El texto de la nota
