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

format-name = Nombre del formato
# The name a format of one's own is first given, made from that of the format it is made from.
format-name-changed = { $name }, modificado
format-saved = «{ $name }» se ha guardado entre sus formatos propios
format-save-failed = No se pudo guardar el formato.
format-delete-failed = No se pudo eliminar el formato.
format-delete-title = ¿Eliminar el formato «{ $name }»?
format-delete-message = Los mapas que lo usan pasarán a usar el formato general de manuscrito.
format-delete-confirm = Eliminar el formato

## The parts of a format, as they are chosen at the left.

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
# Beside a number of 0, in the place of its unit.
format-not-said = no se dice
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

## Type and spacing, and paragraphs.

format-typeface = Fuente
format-hyphenate = Dividir las palabras al final de las líneas
format-paragraphs = Los párrafos se distinguen por
format-paragraphs-indent = Una primera línea sangrada
format-paragraphs-spaced = Espacio entre ellos
format-indent = Sangría
format-indent-first = También después de un encabezado
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
format-level-new-page-said = en página nueva
format-space-before = Espacio antes
format-space-after = Espacio después
format-level-add = Un nivel más
format-level-remove = Quitar el más profundo

## The title and the abstract.

format-title-placement = El título va
format-title-top = Arriba en la primera página
format-title-own-page = En una página propia
format-title-authors = Autores
format-title-affiliations = Sus afiliaciones
format-title-date = Fecha
format-title-abstract = Resumen y palabras clave
format-title-abstract-label = Encabezado del resumen
format-title-keywords-label = Palabra antes de las palabras clave

## Quotations, notes and the bibliography.

format-quote-indent-left = Sangría a la izquierda
format-quote-indent-right = Sangría a la derecha
format-quote-when = Cuándo se separa una cita
format-quote-from-words = A partir de tantas palabras
format-quote-from-lines = O de tantas líneas
format-notes-kind = Las notas van
format-notes-footnotes = A pie de página
format-notes-endnotes = Al final del texto
format-notes-title = Encabezado de las notas
format-bibliography-title = Encabezado
format-bibliography-new-page = Empieza en página nueva
format-bibliography-hanging-indent = Sangría francesa
format-bibliography-entry-spacing = Espacio entre entradas

## The kinds of paragraph and of words: how each differs from the kind it
## is based on. The rows are those of the dialog for a kind of one's own
## too; what is not said is as the base has it.

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
format-captioned-reference = Donde el texto remite a ella
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
format-captioned-end-title = { $kind ->
    [figure] Encabezado sobre las figuras
   *[table] Encabezado sobre las tablas
}
# What is left in the text where a figure or table gathered at the end belongs.
format-captioned-placeholder = Línea que queda en el texto
format-captioned-placeholder-missing = Debe contener {"{}"}, donde van la palabra y el número
format-table-rules = Líneas
format-table-rules-horizontal = Arriba, abajo y bajo los encabezados
format-table-rules-grid = Alrededor de cada celda
format-table-rules-none = Ninguna
format-table-header-bold = Encabezados en negrita
format-equations = Ecuaciones
format-equations-stand = Las ecuaciones van
format-equations-before = Antes del número
format-equations-after = Después del número

## Page numbers and the running head.

format-page-numbers = Números de página
format-page-numbers-show = Las páginas se numeran

## About the format: where its requirements are from.

format-description = Descripción
format-source = De dónde vienen los requisitos
# The date the source was read on.
format-source-read = Leído el { $date }.
format-source-high = Los valores son los de la fuente.
format-source-medium = La fuente solo pudo leerse en parte o en un estado anterior: compruebe lo que le importe.
format-source-low = Poco pudo verificarse: tome los valores como un punto de partida.
