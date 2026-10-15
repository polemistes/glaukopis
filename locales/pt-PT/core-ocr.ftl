# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-kind-picture = Imagem

## When text cannot be read.

ocr-stopped = A leitura foi interrompida.
ocr-no-language = O Tesseract não tem dados para a língua «{ $language }».
ocr-no-languages = O Tesseract não tem dados para língua nenhuma. Instale os dados de uma, como tesseract-data-eng no Arch.
ocr-not-pdf = «{ $file }» não é um PDF.
ocr-no-pages = «{ $file }» não tem páginas.
ocr-locked = «{ $file }» está protegido por palavra-passe, e as suas páginas não podem ser desenhadas.
ocr-unreadable = Não foi possível ler «{ $file }» como PDF. Pode estar danificado.
ocr-page-not-drawn = Não foi possível desenhar a página { $page }.
ocr-picture-unreadable = Não foi possível ler a imagem: { $message }
ocr-drawing = Um desenho (SVG) não tem dentro nenhuma imagem de que se leia texto.

## Making a PDF searchable.

ocr-searchable-locked = O PDF está protegido, e não pode tornar-se pesquisável. O seu texto pode ainda assim ser trazido para um projeto como mapa.
ocr-searchable-unreadable = Não foi possível tornar o PDF pesquisável: { $message }
ocr-not-whole = o que se fez não se leu de volta inteiro, e não foi guardado.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-failed = Não foi possível ler a página { $page }: { $message }
ocr-remark-more-failed = { $count ->
    [one] Não foi possível ler mais uma página.
    [many] Não foi possível ler mais { $count } páginas.
   *[other] Não foi possível ler mais { $count } páginas.
}
ocr-remark-empty = Não se encontrou texto.
