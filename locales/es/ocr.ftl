# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDF e imágenes
ocr-no-tesseract = Tesseract, que lee el texto de las imágenes, no está instalado o no se encontró. Instálelo con el gestor de paquetes de su sistema, con los datos de los idiomas que lee (en Arch: tesseract y tesseract-data-eng, tesseract-data-spa, etc.), o indique en los ajustes dónde está.
ocr-failed = No se pudo leer el texto.
ocr-looking = Examinando { $file }…
ocr-about-picture = El texto se lee de la imagen.
ocr-about-scan = { $pages ->
    [one] El PDF no tiene texto: se lee de una imagen de su página.
    [many] Ninguna de las { $pages } de páginas tiene texto: se leen de imágenes de ellas.
   *[other] Ninguna de las { $pages } páginas tiene texto: se leen de imágenes de ellas.
}
ocr-about-some = { $without ->
    [one] Una de las { $pages } páginas no tiene texto, y se lee de una imagen de ella; las demás se toman como están.
    [many] { $without } de las { $pages } páginas no tienen texto, y se leen de imágenes de ellas; las demás se toman como están.
   *[other] { $without } de las { $pages } páginas no tienen texto, y se leen de imágenes de ellas; las demás se toman como están.
}
ocr-about-text = { $pages ->
    [one] La página tiene texto, que se toma como está.
    [many] Todas las páginas tienen texto, que se toma como está.
   *[other] Todas las páginas tienen texto, que se toma como está.
}
ocr-read-all = Leer también las páginas que tienen texto
ocr-read-all-hint = Su texto se queda, y lo que se lee se pone encima.
ocr-read-all-map-hint = Lo que se lee ocupa el lugar de su texto: para cuando es malo, o no se puede leer.
ocr-read = Leer el texto
ocr-read-text-pages = Tomar las páginas que tienen texto
ocr-take-text = Tomar el texto
ocr-reading = Leyendo { $file }…
ocr-reading-pages = { $done } de { $total } páginas leídas
ocr-reading-hint = Una página lleva unos segundos. Cancelar detiene la lectura.

## How the text is read: what to try when a reading goes badly

ocr-how = Cómo se lee
ocr-how-dpi = Resolución, en puntos por pulgada
ocr-how-layout = Disposición de la página
ocr-how-layout-auto = Como juzgue Tesseract
ocr-how-layout-column = Una columna
ocr-how-layout-block = Un bloque de texto
ocr-how-layout-sparse = Texto disperso
ocr-how-contrast = Blanco y negro
ocr-how-hint = Qué probar cuando una lectura sale mal: más resolución para letra pequeña, una columna donde las columnas se mezclan, un bloque de texto para un solo párrafo, y blanco y negro para una impresión tenue o desigual.

## The languages of the text

ocr-languages = Idiomas del texto
ocr-languages-hint = El más probable primero. Cada uno más hace la lectura más lenta, y no siempre mejor.
ocr-language-add = Añadir un idioma…
ocr-language-remove = Quitar { $language }
# A script rather than a language: "Latin script".
ocr-language-script = Escritura { $script }
ocr-language-fraktur = { $language }, fraktur
ocr-language-old = { $language }, antiguo
ocr-language-vertical = { $language }, escrito en vertical

## A PDF of the library made searchable

ocr-searchable-button = Hacer buscable…
ocr-searchable-title = Hacer buscable el PDF
ocr-searchable-about = { $without ->
    [one] Una de las { $pages } páginas no tiene texto. Se lee, y su texto se pone oculto bajo lo que se muestra, para que se pueda buscar y copiar. El PDF se ve como antes.
    [many] { $without } de las { $pages } páginas no tienen texto. Se leen, y su texto se pone oculto bajo lo que se muestra, para que se pueda buscar y copiar. El PDF se ve como antes.
   *[other] { $without } de las { $pages } páginas no tienen texto. Se leen, y su texto se pone oculto bajo lo que se muestra, para que se pueda buscar y copiar. El PDF se ve como antes.
}
ocr-searchable-has-text = { $pages ->
    [one] La página tiene texto: ya se puede buscar en el PDF.
    [many] Todas las páginas tienen texto: ya se puede buscar en el PDF.
   *[other] Todas las páginas tienen texto: ya se puede buscar en el PDF.
}
ocr-searchable-damaged = El PDF no se pudo desmontar para cambiarlo: puede estar dañado. Su texto sí se puede traer a un proyecto como mapa.
ocr-searchable-make = Hacer buscable
ocr-strip = Quitar el texto oculto que tienen, y conservar solo lo que se lee
ocr-strip-hint = Para una capa de texto mala, como la que un escáner pone bajo la página. Las letras que se ven se quedan, y la página se ve como antes.
ocr-searchable-done = { $count ->
    [one] El PDF es buscable: se leyó una página
    [many] El PDF es buscable: se leyeron { $count } de páginas
   *[other] El PDF es buscable: se leyeron { $count } páginas
}
ocr-searchable-failed = { $count ->
    [one] Una página no se pudo leer.
    [many] { $count } de páginas no se pudieron leer.
   *[other] { $count } páginas no se pudieron leer.
}

## A map from a PDF of the library

ocr-map-button = Un mapa de su texto…
ocr-map-title = Un mapa del texto
ocr-map-into = En el proyecto
ocr-map-new-project = Un proyecto nuevo, con su nombre
ocr-map-making = Haciendo el mapa…
ocr-map-failed = No se pudo hacer el mapa.

## The text of a picture of the store

ocr-picture-read = Leer el texto que contiene…
ocr-picture-title = El texto de la imagen
ocr-picture-empty = No se encontró texto en la imagen.
ocr-picture-copy = Copiar
ocr-picture-copied = El texto está copiado
ocr-picture-map = Hacer un mapa con él

## Tesseract in the settings

ocr-settings-looking = Buscando…
ocr-settings-missing = No se encontró. Hace falta para leer el texto de escaneos e imágenes. Instale tesseract con el gestor de paquetes de su sistema, con los datos de los idiomas que lee (en Arch, tesseract-data-eng para el inglés, tesseract-data-spa para el español, tesseract-data-grc para el griego antiguo, …), o indique abajo dónde está.
ocr-settings-by-itself = Encontrado por sí solo
ocr-settings-where = Dónde está Tesseract
ocr-settings-look-failed = No se pudo buscar Tesseract
ocr-settings-has = Lee { $languages }.
ocr-settings-has-none = No tiene los datos de ningún idioma: instale los de alguno, como tesseract-data-eng.
ocr-settings-first = Leer al principio en
ocr-settings-first-hint = Si no se elige ninguno, el idioma del texto y el de la interfaz.
ocr-settings-how = Cómo se lee el texto al principio
