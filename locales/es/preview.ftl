# The preview, and the making of documents: the panel beside the map, the
# details of a document, and the export.

## The panel beside the map, and what is chosen over it.

preview = Vista previa
# Small, over the choice of the document format.
preview-format = Formato
preview-format-label = Formato del documento
# Small, over the choice of the reference style.
preview-style = Referencias
preview-style-label = Estilo de citas
# The last among the reference styles, which opens the search for more.
preview-style-more = Más estilos…
preview-change = Cambiar el formato o el estilo
preview-change-format = Cambiar este formato…
preview-change-format-hint = Página, letra, espaciado, encabezados
preview-change-style = Cambiar este estilo de citas…
preview-change-style-hint = A los deseos de una editorial
preview-details = Título, autores, resumen
# Shows in the text the element whose place in the pages is looked at.
preview-go-to-text = Ir a este lugar del texto
# Moves the pages to where the element the text is at begins.
preview-show-text = Mostrar dónde está el texto
preview-hide = Ocultar la vista previa
# When a format that goes with a reference style is chosen, the style is taken with it.
preview-style-taken = El estilo de citas es ahora { $style }
preview-style-taken-why = Es el que acompaña a este formato.
preview-style-keep-other = Conservar el otro
# The name of the program is Pandoc, Typst or LaTeX.
preview-program-missing = { $program } no está instalado
preview-programs-needed = La vista previa y la exportación se hacen con Pandoc y Typst. Instálelos con el gestor de paquetes de su sistema, o indique en los ajustes dónde están.
preview-look-again = Volver a buscar
preview-looking-failed = No se pudieron buscar los programas
preview-reading-failed = No se pudieron leer los estilos y formatos
preview-failed = No se pudo hacer la vista previa
preview-failed-message = No se pudo hacer la vista previa.
# A page of the preview, as it is told to those who cannot see it.
preview-page = Página { $number }
# The name of an exported file, where the map has none.
preview-file-name = documento

## At the foot of the preview: how long the document is, and what there is to remark.

preview-pages = { $count ->
    [one] { $count } página
    [many] { $count } de páginas
   *[other] { $count } páginas
}
preview-words = { $count ->
    [one] { $count } palabra
    [many] { $count } de palabras
   *[other] { $count } palabras
}
# The words of the text, and the most the format allows.
preview-words-of = { $limit ->
    [one] { $count } de { $limit } palabra
    [many] { $count } de { $limit } de palabras
   *[other] { $count } de { $limit } palabras
}
# The words of the text and of its notes together.
preview-words-with-notes = { $count } con notas
preview-remarks-count = { $count ->
    [one] { $count } observación
    [many] { $count } de observaciones
   *[other] { $count } observaciones
}
preview-remarks = Observaciones
preview-remarks-font = Fuente
preview-font-missing = { $font } no está instalada.
# The first name is that of the font the format asks for; this is of the one used in its place.
preview-font-substitute = En su lugar se usa { $font }, aquí en la vista previa y en un PDF que se haga. En un documento exportado para Word, LibreOffice o LaTeX, la fuente se nombra como pide el formato, y estará para quien abra el documento y la tenga.
preview-remarks-references = Referencias
# In bold, and the next follows it in the same sentence.
preview-works-missing = { $count ->
    [one] { $count } obra citada no se encontró,
    [many] { $count } de obras citadas no se encontraron,
   *[other] { $count } obras citadas no se encontraron,
}
preview-works-missing-where = ni en su biblioteca ni en el proyecto. Están marcadas en el texto.
# Over what Pandoc and Typst said while they made the document.
preview-remarks-warnings = Dicho mientras se hacía el documento

## The details of a document: what stands on its first page.

preview-details-dialog = El documento
preview-details-dialog-subtitle = Lo que va en su primera página
preview-details-title = Título
preview-details-title-placeholder = El nombre del centro del mapa
preview-details-title-hint = Si se deja vacío, el título es el nombre del centro del mapa.
preview-details-subtitle = Subtítulo
preview-details-authors = Autores
preview-details-name = Nombre
preview-details-author-name = Nombre del autor { $number }
preview-details-affiliation = Afiliación
preview-details-author-affiliation = Afiliación del autor { $number }
preview-details-email = Correo electrónico
preview-details-author-email = Correo electrónico del autor { $number }
# Beside a plus, under the authors: adds one.
preview-details-add-author = autor
preview-details-abstract = Resumen
preview-details-words = { $count ->
    [one] { $count } palabra
    [many] { $count } de palabras
   *[other] { $count } palabras
}
# The words of the abstract, and the most the format allows.
preview-details-words-of = { $limit ->
    [one] { $count } de { $limit } palabra
    [many] { $count } de { $limit } de palabras
   *[other] { $count } de { $limit } palabras
}
preview-details-keywords = Palabras clave
# The keywords given, and the most the format allows.
preview-details-keywords-of = { $count } de { $limit }
preview-details-keywords-placeholder = Separadas por comas
preview-details-date = Fecha
preview-details-date-placeholder = Tal como se ha de imprimir
preview-details-language = Idioma del texto
# A map that was given no language is printed in English.
preview-details-language-none = Sin indicar (inglés)
preview-details-cover = Portada
preview-details-cover-choose = Elegir una imagen…
preview-details-cover-other = Otra…
preview-details-cover-hint = La portada del libro electrónico: una imagen, guardada en el almacén de imágenes. Nada más la usa.

## The export: the kinds of file a document is made as.

preview-export = Exportar
preview-export-kind = Tipo de archivo
preview-export-pdf-about = Como lo muestra la vista previa
preview-export-pdflatex = PDF, compuesto por LaTeX
preview-export-pdflatex-about = El mismo documento con la composición de LaTeX. Tarda un poco más.
preview-export-docx-about = Lo que piden la mayoría de las editoriales y revistas
preview-export-odt-about = Para LibreOffice Writer y otros
preview-export-latex-about = Para componerlo con LuaLaTeX o XeLaTeX
preview-export-markdown-about = Texto sin formato, con las citas como claves
preview-export-html = Página web
preview-export-html-about = Un solo archivo, para leerlo en un navegador
preview-export-epub = Libro electrónico
preview-export-epub-about = EPUB, para lectores electrónicos y las aplicaciones que los leen; el lector compone el texto
preview-export-latex-missing = Para esto hace falta LaTeX, y no se encontró. Se instala como TeX Live.
preview-export-biblatex = Conservar las citas como comandos de BibLaTeX
preview-export-biblatex-hint = Las referencias se escriben en un archivo .bib junto al documento. El estilo de citas es entonces el de BibLaTeX más parecido al elegido.
# The title of the window where the file is named; the kind is PDF, Word, and so on.
preview-export-as = Exportar como { $kind }
preview-export-run = Exportar…
preview-export-working = Haciendo el documento…
preview-export-failed = No se pudo hacer el documento.
preview-export-stop = Detener
preview-export-stopped = Se detuvo la creación del documento. No se escribió ningún archivo.
# Under the name of the file that was made: another file made with it.
preview-export-also = con { $file }
preview-export-missing = { $count ->
    [one] Una obra citada no se encontró, y está marcada en el texto.
    [many] { $count } de obras citadas no se encontraron, y están marcadas en el texto.
   *[other] { $count } obras citadas no se encontraron, y están marcadas en el texto.
}
preview-export-show-in-folder = Mostrar en la carpeta
preview-export-open-failed = No se pudo abrir el archivo
preview-export-folder-failed = No se pudo abrir la carpeta
preview-export-another = Exportar otro
