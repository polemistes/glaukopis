# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-kind-picture = Imagen

## When text cannot be read.

ocr-stopped = Se detuvo la lectura.
ocr-no-language = Tesseract no tiene datos para el idioma «{ $language }».
ocr-no-languages = Tesseract no tiene datos para ningún idioma. Instale los de alguno, como tesseract-data-eng en Arch.
ocr-not-pdf = «{ $file }» no es un PDF.
ocr-no-pages = «{ $file }» no tiene páginas.
ocr-locked = «{ $file }» está protegido con contraseña, y sus páginas no se pueden dibujar.
ocr-unreadable = «{ $file }» no se pudo leer como PDF. Puede estar dañado.
ocr-page-not-drawn = No se pudo dibujar la página { $page }.
ocr-picture-unreadable = No se pudo leer la imagen: { $message }
ocr-drawing = Un dibujo (SVG) no tiene dentro ninguna imagen de la que leer texto.

## Making a PDF searchable.

ocr-searchable-locked = El PDF está protegido, y no se puede hacer buscable. Su texto sí se puede traer a un proyecto como mapa.
ocr-searchable-unreadable = El PDF no se pudo hacer buscable: { $message }
ocr-not-whole = lo que se hizo no se volvió a leer entero, y no se conservó.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-read = { $count ->
    [one] Una página se leyó de su imagen.
    [many] { $count } de páginas se leyeron de sus imágenes.
   *[other] { $count } páginas se leyeron de sus imágenes.
}
ocr-remark-text = { $count ->
    [one] Una página tenía texto, que se toma tal como está en el archivo.
    [many] { $count } de páginas tenían texto, que se toma tal como está en el archivo.
   *[other] { $count } páginas tenían texto, que se toma tal como está en el archivo.
}
ocr-remark-no-tesseract = { $count ->
    [one] Una página no tiene texto, y se deja vacía: Tesseract, que lee el texto de las imágenes, no está instalado.
    [many] { $count } de páginas no tienen texto, y se dejan vacías: Tesseract, que lee el texto de las imágenes, no está instalado.
   *[other] { $count } páginas no tienen texto, y se dejan vacías: Tesseract, que lee el texto de las imágenes, no está instalado.
}
ocr-remark-not-read = No se pudieron leer las páginas que no tienen texto: { $message }
ocr-remark-failed = No se pudo leer la página { $page }: { $message }
ocr-remark-more-failed = { $count ->
    [one] Otra página más no se pudo leer.
    [many] Otras { $count } de páginas no se pudieron leer.
   *[other] Otras { $count } páginas no se pudieron leer.
}
ocr-remark-empty = No se encontró texto.
