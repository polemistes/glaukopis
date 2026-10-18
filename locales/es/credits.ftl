# The credits of Glaukopis: what it is built on and comes with, with their
# licences, in the window that a button in the About section of the
# settings opens. The names of the projects and their licences are not
# translated: they are in src/lib/settings/credits.ts.

credits-button = Créditos y licencias…
credits-title = Créditos y licencias
credits-own-licence = Glaukopis es software libre bajo la Licencia Pública General de GNU, versión 3 o posterior (GPL-3.0-or-later). Está hecho con el trabajo de los proyectos de abajo, bajo las licencias que estos dan.
# Before the authors of a project, where its licence asks for them to be named.
credits-by = De { $who }
# What a name stands for, when it is a link: "Opens { $url }".
credits-open = Abre { $url }

## The groups

credits-group-built-on = En qué se basa
credits-group-copied = Código incorporado
credits-group-fonts = Fuentes
credits-group-data = Estilos, diccionarios y otros datos
credits-group-programs = Programas con los que trabaja, donde están instalados
credits-group-icons = Iconos
credits-group-owl = La lechuza
credits-group-lookup = Dónde se consultan las referencias
credits-lookup-about = Los DOI en doi.org, Crossref y DataCite; los libros en los catálogos K10plus, de las bibliotecas académicas noruegas, de la Deutsche Nationalbibliothek y de la Library of Congress; los preprints en arXiv; la literatura médica en PubMed. Solo se les envía lo que escriba en la consulta.

## What each is to Glaukopis

credits-what-tauri = El armazón de la aplicación: su ventana, y el camino entre la interfaz y el resto.
credits-what-tauri-plugins = Las ventanas para elegir archivos y carpetas, y la apertura de archivos y direcciones en otros programas.
credits-what-webkitgtk = El motor web en el que se muestra la interfaz, en Linux. Forma parte del sistema, no de Glaukopis.
credits-what-gtk = Lo que ocurre con la ventana y con la página en Linux, para el registro.
credits-what-svelte = La interfaz está escrita con él.
credits-what-prosemirror = El editor de textos.
credits-what-yjs = Guarda los proyectos, de modo que los cambios se puedan deshacer y compartir con otros a medida que se hacen.
credits-what-y-prosemirror = Une el editor de textos con lo que guarda un proyecto.
credits-what-y-protocols = El camino por el que los cambios de un proyecto compartido van al servidor y vuelven de él.
credits-what-lib0 = Pequeñas herramientas con las que está hecho Yjs, y con las que la interfaz escribe lo que envía al servidor.
credits-what-yrs = Guarda los proyectos compartidos en el servidor que viene con Glaukopis.
credits-what-fractional-indexing = Mantiene el orden de los elementos y de los tipos cuando varias personas los mueven a la vez.
credits-what-fluent-js = Las palabras de la interfaz, en todos los idiomas.
credits-what-fluent-rs = Las palabras del núcleo, en todos los idiomas, y la comprobación de las que se cambien.
credits-what-pluralrules = Qué forma de una palabra va con un número, en cada idioma.
credits-what-unic-langid = Lee los nombres de los idiomas.
credits-what-sys-locale = Averigua el idioma del sistema.
credits-what-typst = Compone las páginas de la vista previa y hace los archivos PDF.
credits-what-comemo = Recuerda lo que Typst ya ha calculado, para que las páginas se vuelvan a componer deprisa.
credits-what-hayro = Dibuja las páginas de los archivos PDF, para leer su texto y para mostrarlas.
credits-what-lopdf = Lee y escribe archivos PDF, para el texto que tiene un PDF y para el texto que se pone sobre un escaneo.
credits-what-pdf-text-part = Lee las fuentes y los mapas de caracteres de los archivos PDF, para el código de pdf-extract incorporado a Glaukopis.
credits-what-image = Lee y escribe imágenes.
credits-what-rusqlite = Lee la base de datos de Zotero, para importar sus referencias.
credits-what-sqlite = La base de datos en la que Zotero guarda sus referencias, leída a través de rusqlite. Compilada dentro en Windows y macOS; en Linux, la del sistema.
credits-what-roxmltree = Lee XML: estilos de citas, documentos de Word y lo que envían los catálogos.
credits-what-zip = Lee y escribe archivos de Word y OpenDocument, proyectos como archivos y paquetes de idioma.
credits-what-calamine = Lee hojas de cálculo, para las tablas que se traen.
credits-what-encoding-rs = Lee texto en las codificaciones de los archivos más antiguos.
credits-what-spellbook = Comprueba la ortografía, con diccionarios de Hunspell.
credits-what-icu = Sabe qué es cada carácter, para encontrar las palabras.
credits-what-unicode-normalization = Lleva las letras con signos a una sola forma, para que se puedan encontrar y comparar.
credits-what-strsim = Cuánto se parecen dos nombres o títulos, para encontrar duplicados.
credits-what-ureq = Habla con los servicios en los que se consultan las referencias, y con el servidor de paquetes de idioma.
credits-what-sha2 = Distingue los archivos por lo que contienen.
credits-what-base64 = Lleva imágenes y archivos como texto.
credits-what-serde = Lee y escribe los datos de Glaukopis como JSON.
credits-what-uuid = Da a todo lo que se guarda un nombre propio.
credits-what-time = Fechas y horas.
credits-what-tempfile = Escribe archivos de forma segura, por medio de un archivo junto a ellos.
credits-what-tracing = El registro de lo que hace la aplicación.
credits-what-thiserror = Los errores del servidor que viene con Glaukopis.
credits-what-tokio = Hace funcionar el servidor que viene con Glaukopis, para compartir proyectos.
credits-what-axum = Responde a quienes se conectan al servidor que viene con Glaukopis.
credits-what-futures = Trabaja con lo que el servidor recibe y envía, a medida que llega.
credits-what-clap = Lee las opciones con que se inicia el servidor que viene con Glaukopis.
credits-what-getrandom = Hace los tokens y los códigos de invitación del servidor que viene con Glaukopis.
credits-what-pdf-extract = Lee el texto de los archivos PDF. Incorporado a Glaukopis como pdf-text, y cambiado para que dé los nombres de los glifos.
credits-what-wrap-it = Deja que el texto fluya alrededor de lo que tiene al lado, en las páginas que compone Typst. Viene con Glaukopis, acortado.
credits-what-literata = La fuente de los textos en la interfaz.
credits-what-inter = La fuente de la interfaz.
credits-what-stix = La fuente de las matemáticas en la interfaz.
credits-what-typst-font = Una fuente que trae Typst, para las páginas de los documentos. En los instaladores para Windows y macOS; en Linux, la del sistema.
credits-what-foxit = Las fuentes que hacen las veces de las catorce fuentes estándar de PDF, cuando se dibujan archivos PDF y cuando se componen imágenes en PDF.
credits-what-csl-styles = Los estilos de citas que vienen con Glaukopis, y los que se obtienen del repositorio.
credits-what-csl-locales = Las palabras de las citas en cada idioma: «página», «capítulo» y similares.
credits-what-ordboka = Las palabras de los diccionarios de noruego bokmål y nynorsk, que vienen con Glaukopis.
credits-what-ordbank = Las flexiones de las palabras de los diccionarios de noruego.
credits-what-spell-norwegian = Las reglas de los diccionarios de noruego.
credits-what-spelling-en-us = El diccionario de inglés estadounidense, del servidor de paquetes de idioma.
credits-what-spelling-en-gb = El diccionario de inglés británico, del servidor de paquetes de idioma.
credits-what-spelling-sv = El diccionario de sueco, del servidor de paquetes de idioma.
credits-what-spelling-da = El diccionario de danés, del servidor de paquetes de idioma.
credits-what-spelling-de = El diccionario de alemán, del servidor de paquetes de idioma.
credits-what-spelling-fr = El diccionario de francés, del servidor de paquetes de idioma.
credits-what-spelling-it = El diccionario de italiano, del servidor de paquetes de idioma.
credits-what-tessdata = Los datos con los que Tesseract lee cada idioma, del servidor de paquetes de idioma.
credits-what-pandoc = Trae documentos de Word y de otros formatos, y hace documentos en Word, OpenDocument, LaTeX, HTML y EPUB.
credits-what-tesseract = Lee el texto de escaneos e imágenes.
credits-what-poppler = Dibuja las páginas de los archivos PDF que no se pueden dibujar de otro modo, para leer su texto.
credits-what-latex = Hace archivos PDF del LaTeX en que se hace un documento, con LuaLaTeX, XeLaTeX o pdfLaTeX.
credits-what-lucide = Los iconos de la interfaz.
credits-what-feather = Algunos iconos de Lucide están dibujados a partir de los de Feather.
credits-name-owl = La lechuza de Glaukopis
credits-what-owl = La marca y el icono de Glaukopis: la lechuza de Atenea, dibujada por Robert Emil Berge a partir de una fotografía de un tetradracma ateniense. Quien use el dibujo ha de nombrarlo a él como quien lo dibujó, y a Classical Numismatic Group, Inc. (http://www.cngcoins.com) como fuente de la imagen en que se basa.
credits-what-owl-photo = La fotografía a partir de la cual está dibujada la lechuza: un tetradracma ateniense de 454–404 a. C., de Classical Numismatic Group, Inc. (http://www.cngcoins.com).
