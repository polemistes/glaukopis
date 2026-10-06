# The settings.

settings-title = Ajustes
settings-error-system = No se pudo leer algo de la aplicación
settings-error-read = No se pudieron leer los ajustes
settings-error-save = No se pudieron guardar los ajustes

## Appearance

settings-appearance = Apariencia
settings-theme = Colores
settings-theme-system = Como el sistema
settings-theme-light = Claro
settings-theme-dark = Oscuro
# A theme of pastel colours, warm and soft.
settings-theme-mellow = Suave
settings-theme-own = Propios
settings-own = Sus colores
settings-own-hint = Cuatro colores, de los que salen los demás: el papel, la tinta, el acento que marca lo elegido y lo pulsado, y la segunda voz que marca asociaciones y comentarios. Que el esquema sea claro u oscuro depende del papel.
settings-own-paper = Papel
settings-own-ink = Tinta
settings-own-accent = Acento
settings-own-gold = Segunda voz
settings-own-begin = Empezar desde
# The contrast of the ink and of the accent on the paper, as WCAG counts it; 4.5 and 3 are what reads well.
settings-own-weak = Difícil de leer: la tinta está a { $ink } a 1 sobre el papel y el acento a { $accent } a 1; 4,5 y 3 o más se leen bien.
settings-text-size = Tamaño de su texto
settings-text-size-hint = En los mapas y en la vista de texto. Lo que se exporta sigue el formato del documento.
settings-interface-size = Tamaño de la interfaz
settings-interface-size-hint = Todo lo que hay en la ventana, también la escritura. Solo para su texto, el tamaño de abajo.
# A line of text in the size chosen, which shows the face of the letters; a
# line of Homer's Greek follows it.
settings-sample = Canta, oh diosa, la cólera del Pelida Aquiles

## New documents

settings-new-documents = Documentos nuevos
settings-new-documents-hint = Con qué empieza un mapa. A cada mapa se le puede dar otro, en la vista previa.
settings-reference-style = Estilo de citas
settings-document-format = Formato del documento

## You

settings-you = Usted
settings-name = Nombre
settings-name-hint = Se muestra a aquellos con quienes comparte proyectos. No se usa para nada más.
settings-contact = Dirección para los servicios bibliográficos
settings-contact-hint = Servicios como Crossref responden mejor a quienes dicen cómo localizarlos. Si escribe una dirección, se les envía con cada consulta, y a nadie más. Déjela vacía para no enviar ninguna.
settings-contact-problem = Eso no parece una dirección.

## Programs: Pandoc and Typst

settings-programs = Programas
settings-programs-about = Glaukopis hace los documentos con Pandoc, que se encuentra solo donde se instala del modo habitual. Las páginas de la vista previa y de un PDF las compone Typst, que forma parte de Glaukopis.
settings-pandoc-need = Hace falta para la vista previa y para toda exportación.
settings-looking = Buscando…
# "need" is what the program is needed for: settings-pandoc-need.
settings-program-missing = No se encontró. { $need } Instálelo con el gestor de paquetes de su sistema, o indique abajo dónde está.
settings-program-old = Más antiguo de lo que necesita Glaukopis: { $least } o más reciente.
# The field for the path to a program, and the title of the dialog that chooses it.
settings-program-where = Dónde está { $program }
settings-program-found-by-itself = Encontrado por sí solo
settings-no-latex = No se encontró LaTeX. No hace falta: el código LaTeX se puede exportar sin él, y el PDF se hace con Typst.
settings-look-again = Volver a buscar
settings-error-programs = No se pudieron buscar los programas

## About

settings-about = Acerca de
settings-licence = Software libre bajo la Licencia Pública General de GNU, versión 3 o posterior. Se entrega sin garantía.
settings-owl = La lechuza la dibujó Robert Emil Berge, a partir de una fotografía de un tetradracma ateniense de Classical Numismatic Group, Inc. (http://www.cngcoins.com). El dibujo está bajo la licencia Creative Commons Atribución-CompartirIgual 3.0 Unported.
settings-data = Dónde se guarda todo
# "file" is the name of the file of the library, shown as code.
settings-data-hint = Sus referencias están en { $file }, que cualquier herramienta de BibLaTeX puede leer. Para conservar una copia de su trabajo, copie esta carpeta.
settings-lookup = Dónde se consultan las referencias
settings-lookup-about = Los DOI en doi.org, Crossref y DataCite; los libros en los catálogos K10plus, de las bibliotecas académicas noruegas, de la Deutsche Nationalbibliothek y de la Biblioteca del Congreso de EE. UU.; los preprints en arXiv; la literatura médica en PubMed. Solo se les envía lo que escribe en la consulta.

## Language

settings-language = Idioma
settings-language-interface = La interfaz
settings-language-interface-hint = Las palabras de la aplicación. Sus textos están en el idioma de sus mapas.
settings-language-system = Como el sistema ({ $language })
settings-language-texts = Idioma de los textos nuevos
settings-language-texts-hint = En qué se escribe un mapa nuevo, lo que decide las palabras que imprime su documento y el diccionario con que se comprueba su ortografía. A cada mapa se le puede dar otro en Idiomas… de su menú, y a un proyecto un idioma propio para sus mapas nuevos.
