# Document formats: their kinds, and the editor of a format.

## The kinds of document format, as the formats are grouped by them.

format-kind-own = Propios
format-kind-general = Generales
format-kind-style-guide = Manuales de estilo
format-kind-publisher = Editoriales
format-kind-journal = Revistas
format-kind-fiction = Narrativa
format-kind-stage = Teatro y cine
format-kind-poetry = Poesía

## The format editor.

format-editor = Formato del documento
format-name = Nombre del formato
# The name a format of one's own is first given, made from that of the format it is made from.
format-name-changed = { $name }, modificado
format-sections = Partes del formato
format-sample-page = Página de muestra { $number }
format-bundled = Los formatos que vienen con Glaukopis se quedan como están. Sus cambios se guardan como un formato propio.
format-delete = Eliminar este formato
format-save-own = Guardar como propio
format-saved = «{ $name }» se ha guardado entre sus formatos propios
format-read-failed = No se pudo leer el formato.
format-sample-failed = No se pudo hacer la muestra.
format-save-failed = No se pudo guardar el formato.
format-delete-failed = No se pudo eliminar el formato.
format-delete-title = ¿Eliminar el formato «{ $name }»?
format-delete-message = Los mapas que lo usan pasarán a usar el formato general de manuscrito.
format-delete-confirm = Eliminar el formato
format-leave-title = ¿Salir sin guardar?
format-leave-message = Los cambios que ha hecho en el formato se perderán.
format-leave-confirm = Salir
format-leave-cancel = Seguir editando

## The parts of a format, as they are chosen at the left.

format-section-page = Página
format-section-type = Letra y espaciado
format-section-paragraphs = Párrafos
format-section-headings = Encabezados
format-section-title = Título y resumen
format-section-quotations = Citas textuales
format-section-kinds = Tipos de párrafo y de palabras
format-section-notes = Notas
format-section-bibliography = Bibliografía
format-section-figures = Figuras, tablas, ecuaciones
format-section-margins = Números de página y cabecera
format-section-limits = Límites
format-section-about = Sobre este formato

## Words that stand in several parts.

format-size = Tamaño
format-bold = Negrita
format-italic = Cursiva
format-letters = Letras
format-alignment = Alineación
format-line-spacing = Interlineado
format-as-the-text = Como el texto
# Beside a size of 0, in the place of its unit.
format-as-the-text-zero = como el texto
format-size-zero-hint = 0 para el tamaño del texto
# Beside a number of 0, in the place of its unit.
format-not-said = no se dice
format-no-limit = sin límite
format-unless-said = Salvo que se diga otra cosa de alguno
format-as-it-will-stand = Como quedará
format-align-left = Izquierda
format-align-center = Centrado
format-align-right = Derecha
format-align-justified = Justificado
format-align-ragged = Izquierda, sin justificar
format-case-none = Como se escribe
format-case-upper = MAYÚSCULAS
format-case-smallcaps = Versalitas
format-spacing-single = Sencillo
format-spacing-one-and-a-half = Uno y medio
format-spacing-double = Doble
format-stands-left = A la izquierda
format-stands-center = En el centro
format-stands-right = A la derecha

## The page.

format-page-custom = Otro tamaño
format-page-width = Ancho
format-page-height = Alto
format-margins = Márgenes
format-margin-top = Superior
format-margin-bottom = Inferior
format-margin-left = Izquierdo
format-margin-right = Derecho
format-lengths-hint = Las medidas se escriben con su unidad: 2.5cm, 1in, 25mm, 12pt.
format-line-numbers = Numerar las líneas
format-line-numbers-hint = Como piden algunas revistas para la revisión

## Type and spacing, and paragraphs.

format-typeface = Fuente
format-typeface-hint = Donde no está instalada, la vista previa usa la más parecida
format-hyphenate = Dividir las palabras al final de las líneas
format-paragraphs = Los párrafos se distinguen por
format-paragraphs-indent = Una primera línea sangrada
format-paragraphs-spaced = Espacio entre ellos
format-indent = Sangría
format-indent-first = También después de un encabezado
format-indent-first-hint = La costumbre tipográfica deja sin sangrar el primer párrafo; APA y otros lo sangran
format-space-between = Espacio entre párrafos
format-italics = Las cursivas se componen
format-italics-italic = Como cursivas
format-italics-underline = Subrayadas, como en los manuscritos a máquina

## Headings.

format-numbered = Numerados
format-level = Nivel { $number }
# What a level of headings is, in short, beside its number: "14 pt, bold, centred".
format-level-size = { $size } pt
format-level-bold = negrita
format-level-italic = cursiva
format-level-capitals = mayúsculas
format-level-small-caps = versalitas
format-level-centred = centrado
format-level-right = derecha
format-level-run-in = sigue en el texto
format-level-indent = Sangrado como un párrafo
format-level-run-in-label = Sigue en el texto
format-level-run-in-hint = El encabezado empieza el párrafo y termina con punto
format-level-new-page = Empieza página nueva
format-level-new-page-hint = Como los capítulos de un libro
format-level-new-page-said = en página nueva
format-space-before = Espacio antes
format-space-after = Espacio después
format-level-add = Un nivel más
format-level-remove = Quitar el más profundo
format-levels-hint = Los encabezados más profundos que el último nivel descrito se imprimen como ese nivel.

## The title and the abstract.

format-title-placement = El título va
format-title-top = Arriba en la primera página
format-title-own-page = En una página propia
format-title-shown = Qué se muestra
format-title-anonymous = Sin los nombres de los autores
format-title-anonymous-hint = Para la revisión: los autores se omiten en todas partes, también en la cabecera
format-title-authors = Autores
format-title-affiliations = Sus afiliaciones
format-title-date = Fecha
format-title-abstract = Resumen y palabras clave
format-title-abstract-label = Encabezado del resumen
format-title-keywords-label = Palabra antes de las palabras clave

## Quotations, notes and the bibliography.

format-quotations = Citas separadas del texto
format-quote-indent-left = Sangría a la izquierda
format-quote-indent-right = Sangría a la derecha
format-quote-when = Cuándo se separa una cita
format-quote-from-words = A partir de tantas palabras
format-quote-from-words-hint = Un recordatorio: decide quien escribe
format-quote-from-lines = O de tantas líneas
format-notes-kind = Las notas van
format-notes-footnotes = A pie de página
format-notes-endnotes = Al final del texto
format-notes-title = Encabezado de las notas
format-bibliography-title = Encabezado
# Headings a bibliography may have.
format-bibliography-title-hint = Bibliografía, Referencias, Obras citadas
format-bibliography-new-page = Empieza en página nueva
format-bibliography-hanging-indent = Sangría francesa
format-bibliography-entry-spacing = Espacio entre entradas
format-bibliography-style = Estilo de citas
format-bibliography-style-hint = El que acompaña a este formato; se toma al elegir el formato
format-bibliography-style-none = Ninguno en particular

## The kinds of paragraph and of words: how each differs from the kind it
## is based on. The rows are those of the dialog for a kind of one's own
## too; what is not said is as the base has it.

format-kinds-hint = Cada tipo se compone como el tipo en que se basa, con las diferencias que se dan aquí. Lo que no se dice es como lo tiene la base.
format-kind-based-on = basado en { $base }
format-as-the-base = Como la base
# In an empty field for a size, in the place of its number.
format-as-the-base-blank = como la base
format-yes = Sí
format-no = No
format-underline = Subrayado
format-equal-width = Letras de igual anchura
format-equal-width-hint = Como se compone el código
format-indent-left = Sangría a la izquierda
format-indent-right = Sangría a la derecha
format-first-line = Primera línea
format-first-line-hint = Cuánto entra más que el resto
format-keep-with-next = Unido al siguiente
format-keep-with-next-hint = No se deja solo al pie de una página
format-new-page = Empieza página nueva
format-break-text = Lo que va en una separación
format-break-text-hint = * * * si no se dice nada; # para un manuscrito
# What a look says, in short, on the line of its kind: "10 pt, italic, centred".
format-look-not-bold = sin negrita
format-look-not-italic = sin cursiva
format-look-underlined = subrayado
format-look-not-underlined = sin subrayar
format-look-as-written = como se escribe
format-look-left = izquierda
format-look-justified = justificado
format-look-indent-left = { $length } de sangría a la izquierda
format-look-indent-right = { $length } de sangría a la derecha
format-look-first-line = primera línea { $length }
format-look-space-before = { $length } antes
format-look-space-after = { $length } después
format-look-line-spacing = interlineado { $spacing }
format-look-equal-width = letras de igual anchura
format-look-not-equal-width = letras de distinta anchura
format-look-kept = unido al siguiente
format-look-not-kept = no unido al siguiente
format-look-no-new-page = sin página nueva
format-look-text = «{ $text }» en una separación

## Figures and tables, which are told alike. The kind is figure or table: where
## English has the same words for both, another language may not (the caption
## of a figure and of a table can have different names).

format-figures = Figuras
format-tables = Tablas
format-captioned-called = { $kind ->
    [figure] Una figura se llama
   *[table] Una tabla se llama
}
# Words a figure or table may be called by.
format-captioned-called-hint = { $kind ->
    [figure] Figura, Fig., Figure
   *[table] Tabla, Tab., Table
}
format-captioned-reference = Donde el texto remite a ella
format-captioned-reference-hint = { $kind ->
    [figure] fig., figura; vacío para la misma palabra
   *[table] tab., tabla; vacío para la misma palabra
}
format-captioned-label-bold = La palabra y el número en negrita
format-captioned-label-italic = La palabra y el número en cursiva
format-captioned-between = { $kind ->
    [figure] Entre el número y la leyenda
   *[table] Entre el número y la leyenda
}
# What stands between the number and the caption; called is the word and number, "Figure 1".
format-between-stop = { $kind ->
    [figure] Punto ({ $called }. Leyenda)
   *[table] Punto ({ $called }. Leyenda)
}
format-between-colon = { $kind ->
    [figure] Dos puntos ({ $called }: Leyenda)
   *[table] Dos puntos ({ $called }: Leyenda)
}
format-between-line = { $kind ->
    [figure] Leyenda en una línea propia
   *[table] Leyenda en una línea propia
}
format-between-other = Otro…
format-captioned-separator = Lo que va entre ellos
format-captioned-separator-hint = Los espacios cuentan: escríbalos donde los quiera
format-captioned-own-line = { $kind ->
    [figure] Y luego la leyenda en una línea propia
   *[table] Y luego la leyenda en una línea propia
}
format-caption = { $kind ->
    [figure] Leyenda
   *[table] Leyenda
}
format-caption-stands = { $kind ->
    [figure] La leyenda va
   *[table] La leyenda va
}
format-caption-below = { $kind ->
    [figure] Bajo la imagen
   *[table] Bajo la tabla
}
format-caption-above = { $kind ->
    [figure] Sobre la imagen
   *[table] Sobre la tabla
}
format-caption-align-hint = { $kind ->
    [figure] De una figura colocada a un lado, la leyenda va a ese lado
   *[table] De una tabla colocada a un lado, la leyenda va a ese lado
}
# In the example of how the number and the caption will stand.
format-caption-example = { $kind ->
    [figure] Leyenda
   *[table] Leyenda
}
format-captioned-where = { $kind ->
    [figure] Dónde van las figuras
   *[table] Dónde van las tablas
}
format-captioned-stand = { $kind ->
    [figure] Las figuras van
   *[table] Las tablas van
}
format-captioned-wrap = El texto fluye alrededor
format-captioned-placement = En el documento
format-captioned-in-text = En el texto
format-captioned-at-end = Reunidas al final
format-captioned-placement-hint = Muchas revistas las piden al final del manuscrito
format-captioned-end-title = { $kind ->
    [figure] Encabezado sobre las figuras
   *[table] Encabezado sobre las tablas
}
format-captioned-end-title-hint = { $kind ->
    [figure] Figuras, Ilustraciones; vacío para ninguno
   *[table] Tablas; vacío para ninguno
}
# What is left in the text where a figure or table gathered at the end belongs.
format-captioned-placeholder = Línea que queda en el texto
# The braces are written as they are; line is how the line will stand.
format-captioned-placeholder-shown = {"{}"} representa la palabra y el número: { $line }
format-captioned-placeholder-missing = Debe contener {"{}"}, donde van la palabra y el número
format-table-itself = La tabla misma
format-table-rules = Líneas
format-table-rules-horizontal = Arriba, abajo y bajo los encabezados
format-table-rules-grid = Alrededor de cada celda
format-table-rules-none = Ninguna
format-table-rules-hint = Los libros y las revistas usan la primera
format-table-header-bold = Encabezados en negrita
format-equations = Ecuaciones
format-equations-stand = Las ecuaciones van
format-equations-before = Antes del número
format-equations-after = Después del número

## Page numbers and the running head.

format-page-numbers = Números de página
format-page-numbers-show = Las páginas se numeran
format-page-numbers-where = Dónde
format-page-numbers-first = También en la primera página
format-position-top-left = Arriba, izquierda
format-position-top-center = Arriba, centro
format-position-top-right = Arriba, derecha
format-position-bottom-left = Abajo, izquierda
format-position-bottom-center = Abajo, centro
format-position-bottom-right = Abajo, derecha
format-running-head = Cabecera
format-running-head-content = Arriba en cada página
format-running-head-none = Nada
format-running-head-title = El título
format-running-head-author = Los autores
format-running-head-author-title = Autores y título
format-running-head-text = Palabras propias
format-running-head-words = Las palabras

## Limits.

format-limits-hint = La vista previa cuenta las palabras del texto frente a estos límites, y el diálogo de título y resumen frente a los otros. No se recorta nada.
format-limits-words = Palabras del texto
format-limits-abstract-words = Palabras del resumen
format-limits-keywords = Palabras clave
format-limits-note = Qué cuentan los límites
format-limits-note-placeholder = Notas incluidas; bibliografía no

## About the format: where its requirements are from.

format-description = Descripción
format-source = De dónde vienen los requisitos
# The date the source was read on.
format-source-read = Leído el { $date }.
format-source-high = Los valores son los de la fuente.
format-source-medium = La fuente solo pudo leerse en parte o en un estado anterior: compruebe lo que le importe.
format-source-low = Poco pudo verificarse: tome los valores como un punto de partida.
format-source-changed = Ha cambiado este formato; la fuente describe aquello de lo que se hizo.
format-source-none = Este formato no sigue los requisitos de ninguna editorial en particular.
