# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-no-headings = No se encontró ningún encabezado: los elementos son las páginas.
ocr-kind-picture = Imagen

## When text cannot be read.

ocr-stopped = Se detuvo la lectura.
ocr-no-language = Tesseract no tiene datos para el idioma «{ $language }».
ocr-no-languages = Tesseract no tiene datos para ningún idioma. Importe uno en Ajustes › Programas, o instálelo con el gestor de paquetes de su sistema, como tesseract-data-eng en Arch.
ocr-not-pdf = «{ $file }» no es un PDF.
ocr-no-pages = «{ $file }» no tiene páginas.
ocr-locked = «{ $file }» está protegido con contraseña, y sus páginas no se pueden dibujar.
ocr-unreadable = «{ $file }» no se pudo leer como PDF. Puede estar dañado.
ocr-page-not-drawn = No se pudo dibujar la página { $page }.
ocr-picture-unreadable = No se pudo leer la imagen: { $message }
ocr-not-made = Tesseract no hizo { $path }.
ocr-not-made-said = Tesseract no hizo { $path }. Dijo: { $message }
ocr-drawing = Un dibujo (SVG) no tiene dentro ninguna imagen de la que leer texto.

## Making a PDF searchable.

ocr-searchable-locked = El PDF está protegido, y no se puede hacer buscable. Su texto sí se puede traer a un proyecto como mapa.
ocr-searchable-unreadable = El PDF no se pudo hacer buscable: { $message }
ocr-not-whole = lo que se hizo no se volvió a leer entero, y no se conservó.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-failed = No se pudo leer la página { $page }: { $message }
ocr-remark-more-failed = { $count ->
    [one] Otra página más no se pudo leer.
    [many] Otras { $count } de páginas no se pudieron leer.
   *[other] Otras { $count } páginas no se pudieron leer.
}
ocr-remark-empty = No se encontró texto.

## What a reading of a PDF came to (ADR 0044).

ocr-remark-counts = { $read ->
    [0] Ninguna página leída por Tesseract
    [one] Una página leída por Tesseract
    [many] { $read } de páginas leídas por Tesseract
   *[other] { $read } páginas leídas por Tesseract
}, { $taken ->
    [0] ninguna tomada del texto propio del PDF
    [one] una tomada del texto propio del PDF
    [many] { $taken } tomadas del texto propio del PDF
   *[other] { $taken } tomadas del texto propio del PDF
} y { $failed ->
    [0] ninguna que no se pudiera leer.
    [one] una que no se pudo leer.
    [many] { $failed } que no se pudieron leer.
   *[other] { $failed } que no se pudieron leer.
}
# Stands in the element in the place of a page that could not be read.
ocr-page-failed-line = [No se pudo leer esta página: { $message }]
ocr-why-no-tesseract = Tesseract, que lee el texto de las imágenes, no está instalado.
