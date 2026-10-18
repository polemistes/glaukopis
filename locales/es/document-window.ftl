# The window of an element's document settings (ADR 0038): its template,
# the details that stand on its first page, its parts, its layout and
# reference style, its language, and the checklist.

document-window = Ajustes del documento
# In the menu of an element, and the button over the preview.
document-window-menu = Ajustes del documento…
document-window-sections = Partes de la ventana
# A layout, a style or a template that is neither chosen nor inherited: the one from the settings, named.
document-window-usual = Lo habitual ({ $name })
# The first choice of a layout or a style: what the template brings, named.
document-window-as-template = Como lo trae la plantilla ({ $name })
# The first choice where an element over this one has chosen: the element, and what it chose.
document-window-from-with = Como en { $name } ({ $what })

## The parts of the window, as they stand down its left.

document-window-section-template = Plantilla
document-window-section-details = Datos
document-window-section-parts = Partes
document-window-section-look = Aspecto
document-window-section-language = Idioma
document-window-section-checklist = Lista de comprobación

## The template.

document-window-template-hint = De qué consta el documento: sus partes y su orden, los tipos que pone a mano, lo que exige, y el diseño y el estilo de citas que trae.
document-window-template-search = Buscar en las plantillas
document-window-template-search-placeholder = Una clase de texto, una revista, una editorial…
document-window-template-none-found = Ninguna plantilla tiene ese nombre.
# Takes the template of the element over this one again, in place of this element's own.
document-window-template-again = Volver a tomarla de { $name }
document-window-template-usual-again = Volver a lo habitual
document-window-template-layout = Diseño: { $layout }
document-window-template-style = Estilo de citas: { $style }
document-window-template-change = Cambiar esta plantilla…
document-window-template-new = Nueva plantilla…
# A template the project carries a copy of, that is not among the writer's own on this computer.
document-window-template-of-project = Guardada en el proyecto: no está entre sus plantillas propias en este equipo.

## The details: what stands on the first page, and in the metadata of the files.

document-window-details-hint = Lo que figura en la primera página, y lo que los archivos llevan como metadatos. Todo lo demás se escribe en el árbol.
document-window-title = Título
document-window-title-placeholder = El nombre del elemento
document-window-title-hint = Si se deja vacío, el título es el nombre del elemento.
document-window-subtitle = Subtítulo
document-window-authors = Autores
document-window-name = Nombre
document-window-author-name = Nombre del autor { $number }
document-window-affiliation = Afiliación
document-window-author-affiliation = Afiliación del autor { $number }
document-window-email = Correo electrónico
document-window-author-email = Correo electrónico del autor { $number }
document-window-orcid = ORCID
document-window-author-orcid = ORCID del autor { $number }
# Beside a plus, under the authors: adds one.
document-window-add-author = autor
document-window-date = Fecha
document-window-date-placeholder = Tal como se ha de imprimir
document-window-keywords = Palabras clave
document-window-keywords-placeholder = Separadas por comas
document-window-keywords-count = { $count ->
    [one] { $count } palabra clave
    [many] { $count } de palabras clave
   *[other] { $count } palabras clave
}
# The keywords given, and the most the template allows.
document-window-keywords-of = { $count } de { $limit }
document-window-identifiers = Identificadores
document-window-identifier-isbn = ISBN
document-window-identifier-edition = Edición
document-window-identifier-publisher = Editorial
document-window-identifier-place = Lugar
document-window-identifier-doi = DOI
document-window-identifier-name = Nombre de otro identificador
document-window-identifier-name-placeholder = ISSN, LCCN…
# Beside a plus: adds the identifier named.
document-window-identifier-add = identificador

## The parts: the kinds of elements the template gives the document a place for.

document-window-parts-hint = Los tipos de elementos a los que esta plantilla da un lugar, y los elementos bajo este que llenan cada uno. Una parte es un elemento: su texto se escribe en el árbol.
document-window-parts-none = Esta plantilla no tiene más partes que el cuerpo.
document-window-parts-missing = Ninguno todavía
document-window-parts-make = Hacer uno
# On the second element of a kind a document has one of.
document-window-parts-doubled = Solo se usa el primero

## The look: the layout and the citations, which are chosen and set in the
## panel beside the preview, where the rest of the look is.

document-window-look-hint = Cómo se ven las páginas, y cómo cita el documento, se ajusta en Aspecto, el panel junto a la vista previa: el diseño y el estilo de citas, la fuente, la página, el aspecto de los tipos.
document-window-look-now = Diseño: { $layout } · Estilo de citas: { $style }
document-window-look-open = Abrir Aspecto
document-window-layout = Diseño
document-window-style = Estilo de citas
document-window-style-change = Cambiar este estilo de citas…

## The language.

document-window-language = Idioma del texto

## The checklist: what the template requires, against what the tree holds.

document-window-checklist-hint = Lo que exige la plantilla, frente al texto y al árbol. No se corta nada.
document-window-checklist-clear = No hay nada que señalar.
document-window-requirement-words = Palabras del texto
document-window-requirement-anonymous = Para la revisión: los autores se dejan fuera del documento.
