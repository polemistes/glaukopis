# Reference styles: their kinds, the search for more, and the style editor,
# with the words it tells the parts of a style by.

## The kinds of reference style, as the styles are grouped by them.

style-kind-note = Notas
style-kind-author-date = Autor y fecha
style-kind-numeric = Números
style-kind-label = Etiquetas
style-kind-author = Autor
style-kind-other = Otros

## The search for reference styles of journals and publishers.

style-browser = Estilos de citas
style-browser-subtitle = Más de diez mil estilos de revistas y editoriales, por nombre
style-browser-placeholder = El nombre de una revista, una editorial o un estilo
style-browser-search = Buscar estilos
# Beside a style that has been fetched already.
style-browser-here = Aquí
style-browser-fetch = Obtener
style-browser-none-found = Ningún estilo tiene estas palabras en su nombre.
style-browser-about = Los estilos se obtienen del repositorio del proyecto Citation Style Language y se guardan con los suyos. Los que tiene se pueden cambiar a los deseos de una editorial en el editor de estilos.
style-browser-import = Importar un archivo…
style-browser-import-title = Importar un estilo de citas
style-browser-fetch-failed = No se pudo obtener el estilo.
style-browser-file-unread = No se pudo leer el archivo.

## The style editor.

style-editor = Estilo de citas
style-name = Nombre del estilo
# The name a style of one's own is first given, made from that of the style it is made from.
style-name-changed = { $name }, modificado
style-depth = Hasta dónde llegar
style-depth-options = Cambios comunes
style-depth-parts = Parte por parte
style-depth-source = Código
style-scope = Qué cambiar
style-scope-citations = Citas
style-scope-notes = Notas
style-scope-bibliography = Bibliografía
style-bundled = Los estilos que vienen con Glaukopis se quedan como están. Sus cambios se guardan como un estilo propio.
style-delete = Eliminar este estilo
style-save-own = Guardar como propio
style-saved = «{ $name }» se ha guardado entre sus estilos propios
style-read-failed = No se pudo leer el estilo.
style-save-failed = No se pudo guardar el estilo.
style-delete-failed = No se pudo eliminar el estilo.
style-delete-title = ¿Eliminar el estilo «{ $name }»?
style-delete-message = Los mapas que lo usan pasarán a usar otro estilo.
style-delete-confirm = Eliminar el estilo
style-leave-title = ¿Salir sin guardar?
style-leave-message = Los cambios que ha hecho en el estilo se perderán.
style-leave-confirm = Salir
style-leave-cancel = Seguir editando

## Common changes: names.

style-names = Nombres
# A sentence with two fields in it, where numbers are written: the least number of
# authors for which "et al." is used, and how many are named before it.
style-et-al = Con { $min } autores o más, dar los { $first } primeros y «et al.»
style-et-al-min = Número de autores a partir del cual se usa et al.
style-et-al-first = Número de autores que se dan antes de et al.
style-et-al-empty = Si se deja vacío, se nombran todos
# As the one before, for a work that has been cited before.
style-et-al-again = Al citarla de nuevo, con { $min } o más dar los { $first } primeros
style-et-al-again-min = Número de autores a partir del cual se usa et al. en las citas posteriores
style-et-al-again-first = Número de autores que se dan en las citas posteriores
style-et-al-again-empty = Si se deja vacío, como la primera vez
style-before-last-name = Antes del último nombre
# The word the style prints there, in the language of the document.
style-and-word = y
style-and-nothing = Nada
style-as-the-style-has-it = Como lo tiene el estilo
style-comma-before-last = Una coma delante
style-comma-contextual = Con tres nombres o más: A, B, y C
style-comma-always = Siempre: A, y B
style-comma-never = Nunca: A, B y C
style-comma-after-inverted = Después de un nombre invertido
style-given-names = Nombres de pila
style-given-full = Completos: John Miles
style-given-spaced = Iniciales: J. M.
style-given-close = Iniciales, juntas: J.M.
style-given-bare = Iniciales sin puntos: JM
style-given-bare-spaced = Iniciales sin puntos: J M
style-family-first = Apellido primero
style-family-first-none = Para nadie: John Foley
style-family-first-first = Para el primer autor: Foley, John, y Robert Fowler
style-family-first-all = Para todos: Foley, John, y Fowler, Robert
style-sort-separator = Entre apellido y nombre de pila
style-sort-separator-hint = Cuando el apellido va primero

## Common changes: the citation, or the note, and the entries of the bibliography.

style-the-citation = La cita
style-the-note = La nota
style-begins-with = Empieza con
style-ends-with = Termina con
style-between-works = Entre obras citadas juntas
style-collapse = Obras de un mismo autor citadas juntas
style-collapse-none = Cada una completa
style-collapse-year = El nombre una vez: Nagy 1979, 1996
style-collapse-year-suffix = Y el año una vez: Nagy 1979a, b
style-collapse-year-suffix-ranged = Con intervalos: Nagy 1979a–c
style-collapse-citation-number = Números como intervalos: [1–3]
style-disambiguate = Cuando dos obras se citarían igual
style-disambiguate-year-suffix = Añadir una letra al año
style-disambiguate-names = Nombrar más autores
style-disambiguate-given-names = Añadir nombres de pila o iniciales
style-near-note = Una nota cuenta como cercana dentro de
style-near-note-hint = Notas; para estilos que abrevian lo citado cerca
style-entries = Las entradas
style-entry-ends-with = Cada una termina con
style-author-repeated = Para un autor repetido
style-author-repeated-hint = En lugar del nombre, en las entradas después de la primera
style-hanging-indent = Sangría francesa
style-hanging-indent-hint = El formato del documento decide cuánta
style-second-field = Los números o etiquetas van
style-second-field-line = En la línea
style-second-field-column = En una columna propia
style-second-field-margin = En el margen
style-second-field-hint = Para estilos que numeran sus entradas

## Common changes: throughout the style.

style-throughout = En todo el estilo
style-page-ranges = Intervalos de páginas
style-page-ranges-as-entered = Como se escriben
style-page-ranges-expanded = Completos: 321–328
style-page-ranges-minimal = Lo más cortos: 321–8
style-page-ranges-minimal-two = Dos dígitos al menos: 321–28
style-page-ranges-chicago = Como lo tiene el Manual de Chicago
style-particles = «van», «de», «von» delante de un apellido
style-particles-never = Se quedan con él, y se ordenan por v, d
style-particles-sort-only = Se quedan con él, pero no se ordena por ellos
style-particles-display-and-sort = Van tras el nombre de pila: Gogh, Vincent van
style-hyphen = Un guion entre iniciales
style-hyphen-hint = J.-P. Sartre, no J.P. Sartre
style-locale = Las palabras del estilo están en
style-locale-document = El idioma del documento
style-locale-hint = «ed.», «en», «consultado», los meses

## Part by part.

# The scope is citation or bibliography.
style-parts-of = { $scope ->
    [citation] Partes de la cita
   *[bibliography] Partes de la bibliografía
}
style-parts-none = { $scope ->
    [citation] Este estilo no tiene cita.
   *[bibliography] Este estilo no tiene bibliografía.
}
style-parts-hint = Elija una parte a la izquierda para cambiar cómo se imprime: lo que va antes y después, su letra, sus mayúsculas. Las partes se abren para mostrar de qué están hechas.
style-part-unfold = Abrir
style-part-fold = Cerrar
style-part-up = Subir
style-part-down = Bajar
style-part-add-after = Añadir después
style-part-take-away = Quitar
style-part-add-within = Añadir dentro
# A part of a macro: a part of the style that is used in several places.
style-part-shared = Esto pertenece a «{ $macro }», que se usa en { $count } lugares. Un cambio aquí se ve en todos ellos.
style-add-words = Palabras propias
style-add-words-hint = Como «en», «consultado», o puntuación
# Over the fields of a reference that a part can print.
style-add-from-reference = De la referencia
style-part-words = Las palabras
style-part-before = Antes
style-part-before-hint = Se imprime solo cuando la parte misma se imprime
style-part-after = Después
style-part-between = Entre sus partes
style-slant = Inclinación
style-slant-upright = Redonda
style-slant-italic = Cursiva
style-weight = Peso
style-weight-regular = Normal
style-weight-bold = Negrita
style-letters = Letras
style-letters-as-written = Como se escriben
style-letters-small-caps = Versalitas
style-case = Mayúsculas
style-case-as-entered = Como se escriben
style-case-title = Al estilo de los títulos ingleses
style-case-sentence = Como una frase
style-case-capitalize-first = Primera letra en mayúscula
style-case-capitalize-all = Cada Palabra En Mayúscula
style-case-uppercase = MAYÚSCULAS
style-case-lowercase = minúsculas
style-height = Altura
style-height-baseline = En la línea
style-height-raised = Elevado
style-height-lowered = Bajado
style-quotes = Entre comillas
style-strip-periods = Sin puntos
style-strip-periods-hint = Para abreviaturas: «ed» por «ed.»
style-text-form = Forma
style-text-form-long = Completa
style-text-form-short = Breve, donde la referencia la tiene
style-term-form = Forma de la palabra
style-term-form-long = Completa: editor, página
style-term-form-short = Breve: ed., p.
style-term-form-verb = Como verbo: editado por
style-term-form-verb-short = Como verbo, breve: ed. por
style-term-form-symbol = Como signo: §
style-date-parts = La fecha se da
style-date-parts-year = Solo como el año
style-date-parts-year-month = Como año y mes
style-date-parts-full = Completa

## The source of the style, and the sample it is tried on.

style-source = Código del estilo
style-source-try = Probarlo
style-source-unread = No se pudo leer el código.
style-sample-unusable = El estilo no se puede usar tal como está
style-sample-failed = No se pudo probar el estilo.
style-sample-in-text = En el texto
style-sample-in-notes = En las notas
style-sample-in-bibliography = En la bibliografía
style-sample-cited = Una obra citada
style-sample-same-page = La misma, en una página
style-sample-another = Otra, con una palabra delante
style-sample-first-again = La primera de nuevo, en un capítulo
style-sample-together = Dos obras juntas
style-sample-in-sentence = Con el autor en la frase
style-sample-examples = Mostrado con ejemplos: su biblioteca está vacía.
style-sample-library = Mostrado con obras de su biblioteca.

## The source of a style, where it cannot be read as one.

style-source-not-xml = El código no es XML bien formado.
style-source-not-style = Esto no es un estilo: no empieza por <style>.
style-source-dependent = El estilo no tiene <citation>: solo nombra a otro estilo, y no se puede cambiar.

## The parts of a style, as the style editor tells them in words.

style-part-layout = El conjunto
style-part-text = Texto
# A part that prints a word of the style's language: the term is its name in CSL.
style-part-term = La palabra para «{ $term }»
# A part that prints words written into the style.
style-part-value = Las palabras «{ $value }»
style-part-name = Cómo se escriben los nombres
# The name is family or given, as CSL has them.
style-part-name-part = { $name ->
    [family] El apellido
    [given] El nombre de pila
   *[other] El nombre { $name }
}
style-part-et-al = «et al.»
# The variables are one or more of those below: "the pages".
style-part-label = La palabra antes de { $variables } («p.», «ed.»)
style-part-role = La palabra para la función («ed.», «trad.»)
style-part-substitute = Cuando no hay tal nombre, en su lugar
# The name is day, month or year, as CSL has them, or part.
style-part-date-part = { $name ->
    [day] El día
    [month] El mes
    [year] El año
   *[other] El { $name }
}
style-part-group = Juntos
style-part-choose = Uno de estos
# The condition is made of those below.
style-part-if = Si { $condition }
style-part-else-if = Si no, si { $condition }
style-part-else = En otro caso
# A name the style has, of a part of it (a macro) or of a variable it does not know.
style-quoted = «{ $text }»

## Words that join others: "the author, or else the editor", "a book or a chapter".
## The first may be a list of several, joined by commas.

style-or = { $first } o { $last }
style-and = { $first } y { $last }
style-or-else = { $first }, o si no { $last }

## When a part of a style is printed: "If the work is a book".

style-if-type = la obra es { $types }
style-if-has = tiene { $variables }
style-if-lacks = no tiene { $variables }
style-if-numeric = { $variables } es un número
style-if-uncertain = { $variables } es incierto
# The places are pages, chapters, verses and the like; see style-locator.
style-if-locator = el lugar citado es { $locators }
style-if-disambiguate = si no, se confundiría con otra
style-if-always = siempre
style-if-none-holds = nada de esto se cumple: { $conditions }
# A kind of place that a citation points to, as CSL names it: page, chapter, verse,
# sub-verbo, and so on. English leaves the names as they are.
style-locator = «{ $name }»

## When a citation is printed, by where it stands among the others.

style-position-first = se cita por primera vez
style-position-subsequent = se ha citado antes
style-position-ibid = es la misma que la cita anterior
style-position-ibid-with-locator = es la misma que la cita anterior, en otro lugar
style-position-near-note = se citó en una nota cercana

## How a part is set: "italic, in quotation marks, before “, ”".

style-form-italic = cursiva
style-form-bold = negrita
style-form-small-caps = versalitas
style-form-underlined = subrayado
style-form-quoted = entre comillas
# How the letters are set, as CSL names it; the words are that name with spaces for its dashes.
style-form-case = { $case ->
    [lowercase] minúsculas
    [uppercase] mayúsculas
    [capitalize-first] primera letra en mayúscula
    [capitalize-all] cada palabra en mayúscula
    [sentence] como una frase
    [title] como un título inglés
   *[other] { $words }
}
style-form-raised = elevado
style-form-lowered = bajado
# The part comes after these words.
style-form-after = tras «{ $text }»
# The part comes before these words.
style-form-before = antes de «{ $text }»
style-form-between = con «{ $text }» en medio

## The kinds of work a reference is of, as CSL names them.

style-type-book = un libro
style-type-chapter = un capítulo
style-type-article-journal = un artículo de revista académica
style-type-article-magazine = un artículo de revista
style-type-article-newspaper = un artículo de periódico
style-type-article = un artículo
style-type-thesis = una tesis
style-type-report = un informe
style-type-webpage = una página web
style-type-paper-conference = una ponencia de congreso
style-type-entry-encyclopedia = una entrada de enciclopedia
style-type-entry-dictionary = una entrada de diccionario
style-type-entry = una entrada
style-type-review = una reseña
style-type-review-book = una reseña de un libro
style-type-manuscript = un manuscrito
style-type-personal_communication = una carta u otra comunicación
style-type-legal_case = una sentencia judicial
style-type-legislation = legislación
style-type-bill = un proyecto de ley
style-type-patent = una patente
style-type-dataset = un conjunto de datos
style-type-software = software
style-type-motion_picture = una película
style-type-broadcast = una emisión
style-type-song = una grabación
style-type-speech = una conferencia
style-type-interview = una entrevista
style-type-graphic = una imagen
style-type-map = un mapa
style-type-pamphlet = un folleto
style-type-post-weblog = una entrada de blog
style-type-post = una publicación
style-type-classic = una obra clásica
style-type-collection = una colección
style-type-document = un documento
style-type-standard = una norma
style-type-treaty = un tratado
style-type-periodical = una publicación periódica
style-type-musical_score = una partitura
style-type-figure = una figura
style-type-event = un acontecimiento
style-type-performance = una representación
style-type-regulation = un reglamento
style-type-hearing = una audiencia

## What a reference has, as CSL names it: with its article, and without it
## (.bare) as a field of a reference is named.

style-variable-title = el título
    .bare = título
style-variable-title-short = el título breve
    .bare = título breve
style-variable-container-title = el título de la revista o del libro
    .bare = título de la revista o del libro
style-variable-container-title-short = el título breve de la revista
    .bare = título breve de la revista
style-variable-collection-title = la serie
    .bare = serie
style-variable-collection-number = el número en la serie
    .bare = número en la serie
style-variable-original-title = el título original
    .bare = título original
style-variable-reviewed-title = el título de la obra reseñada
    .bare = título de la obra reseñada
style-variable-author = el autor
    .bare = autor
style-variable-editor = el editor
    .bare = editor
style-variable-translator = el traductor
    .bare = traductor
style-variable-container-author = el autor del libro
    .bare = autor del libro
style-variable-collection-editor = el editor de la serie
    .bare = editor de la serie
style-variable-editorial-director = el director editorial
    .bare = director editorial
style-variable-original-author = el autor original
    .bare = autor original
style-variable-reviewed-author = el autor de la obra reseñada
    .bare = autor de la obra reseñada
style-variable-interviewer = el entrevistador
    .bare = entrevistador
style-variable-recipient = el destinatario
    .bare = destinatario
style-variable-director = el director
    .bare = director
style-variable-composer = el compositor
    .bare = compositor
style-variable-illustrator = el ilustrador
    .bare = ilustrador
style-variable-issued = la fecha
    .bare = fecha
style-variable-accessed = la fecha de consulta
    .bare = fecha de consulta
style-variable-original-date = la fecha original
    .bare = fecha original
style-variable-event-date = la fecha del acontecimiento
    .bare = fecha del acontecimiento
style-variable-submitted = la fecha de envío
    .bare = fecha de envío
style-variable-volume = el volumen
    .bare = volumen
style-variable-number-of-volumes = el número de volúmenes
    .bare = número de volúmenes
style-variable-issue = el número de la revista
    .bare = número de la revista
style-variable-edition = la edición
    .bare = edición
style-variable-page = las páginas
    .bare = páginas
style-variable-page-first = la primera página
    .bare = primera página
style-variable-number-of-pages = el número de páginas
    .bare = número de páginas
style-variable-number = el número
    .bare = número
style-variable-chapter = el capítulo
    .bare = capítulo
style-variable-chapter-number = el número del capítulo
    .bare = número del capítulo
style-variable-publisher = la editorial
    .bare = editorial
style-variable-publisher-place = el lugar de publicación
    .bare = lugar de publicación
style-variable-original-publisher = la editorial original
    .bare = editorial original
style-variable-original-publisher-place = el lugar de publicación original
    .bare = lugar de publicación original
style-variable-locator = el lugar citado
    .bare = lugar citado
style-variable-citation-number = el número de la cita
    .bare = número de la cita
style-variable-citation-label = la etiqueta de la cita
    .bare = etiqueta de la cita
style-variable-year-suffix = la letra tras el año
    .bare = letra tras el año
style-variable-first-reference-note-number = el número de la nota donde se citó por primera vez
    .bare = número de la nota donde se citó por primera vez
style-variable-DOI = el DOI
    .bare = DOI
style-variable-URL = la dirección
    .bare = dirección
style-variable-ISBN = el ISBN
    .bare = ISBN
style-variable-ISSN = el ISSN
    .bare = ISSN
style-variable-PMID = el PMID
    .bare = PMID
style-variable-genre = el tipo de obra
    .bare = tipo de obra
style-variable-medium = el medio
    .bare = medio
style-variable-note = la nota
    .bare = nota
style-variable-annote = la anotación
    .bare = anotación
style-variable-abstract = el resumen
    .bare = resumen
style-variable-archive = el archivo
    .bare = archivo
style-variable-archive_location = el lugar en el archivo
    .bare = lugar en el archivo
style-variable-archive-place = el lugar del archivo
    .bare = lugar del archivo
style-variable-authority = la autoridad
    .bare = autoridad
style-variable-call-number = la signatura
    .bare = signatura
style-variable-event = el acontecimiento
    .bare = acontecimiento
style-variable-event-place = el lugar del acontecimiento
    .bare = lugar del acontecimiento
style-variable-event-title = el título del acontecimiento
    .bare = título del acontecimiento
style-variable-section = la sección
    .bare = sección
style-variable-source = la fuente
    .bare = fuente
style-variable-status = el estado de publicación
    .bare = estado de publicación
style-variable-version = la versión
    .bare = versión
style-variable-language = el idioma
    .bare = idioma
style-variable-dimensions = las dimensiones
    .bare = dimensiones
style-variable-scale = la escala
    .bare = escala
style-variable-references = las referencias
    .bare = referencias
style-variable-keyword = las palabras clave
    .bare = palabras clave
style-variable-jurisdiction = la jurisdicción
    .bare = jurisdicción
