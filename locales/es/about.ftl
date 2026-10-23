# The window of an element's document settings (ADR 0038): its template,
# the details that stand on its first page, its parts, its layout and
# reference style, its language, and the checklist.

about-sections = Partes de la ventana

## The parts of the window, as they stand down its left.

about-section-details = Datos
about-section-language = Idioma
about-section-checklist = Lista de comprobación

## The template.

## The details: what stands on the first page, and in the metadata of the files.

about-details-hint = Lo que figura en la primera página, y lo que los archivos llevan como metadatos. Todo lo demás se escribe en el árbol.
about-title = Título
about-title-placeholder = El nombre del elemento
about-title-hint = Si se deja vacío, el título es el nombre del elemento.
about-subtitle = Subtítulo
about-authors = Autores
about-name = Nombre
about-author-name = Nombre del autor { $number }
about-affiliation = Afiliación
about-author-affiliation = Afiliación del autor { $number }
about-email = Correo electrónico
about-author-email = Correo electrónico del autor { $number }
about-orcid = ORCID
about-author-orcid = ORCID del autor { $number }
# Beside a plus, under the authors: adds one.
about-add-author = autor
about-date = Fecha
about-date-placeholder = Tal como se ha de imprimir
about-keywords = Palabras clave
about-keywords-placeholder = Separadas por comas
about-keywords-count = { $count ->
    [one] { $count } palabra clave
    [many] { $count } de palabras clave
   *[other] { $count } palabras clave
}
# The keywords given, and the most the template allows.
about-keywords-of = { $count } de { $limit }
about-identifiers = Identificadores
about-identifier-isbn = ISBN
about-identifier-edition = Edición
about-identifier-publisher = Editorial
about-identifier-place = Lugar
about-identifier-doi = DOI
about-identifier-name = Nombre de otro identificador
about-identifier-name-placeholder = ISSN, LCCN…
# Beside a plus: adds the identifier named.
about-identifier-add = identificador

## The parts: the kinds of elements the template gives the document a place for.

## The look: the layout and the citations, which are chosen and set in the
## panel beside the preview, where the rest of the look is.

## The language.

about-language = Idioma del texto

## The checklist: what the template requires, against what the tree holds.

about-checklist-hint = Lo que exige la plantilla, frente al texto y al árbol. No se corta nada.
about-checklist-clear = No hay nada que señalar.
about-requirement-words = Palabras del texto
about-requirement-anonymous = Para la revisión: los autores se dejan fuera del documento.
