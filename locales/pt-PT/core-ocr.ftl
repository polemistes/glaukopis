# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-no-headings = Não se encontrou nenhum título: as páginas são os elementos.
ocr-kind-picture = Imagem

## When text cannot be read.

ocr-stopped = A leitura foi interrompida.
ocr-no-language = O Tesseract não tem dados para a língua «{ $language }».
ocr-no-languages = O Tesseract não tem dados para língua nenhuma. Importe os de uma em Definições › Programas, ou instale-os com o gestor de pacotes do sistema, como tesseract-data-eng no Arch.
ocr-not-pdf = «{ $file }» não é um PDF.
ocr-no-pages = «{ $file }» não tem páginas.
ocr-locked = «{ $file }» está protegido por palavra-passe, e as suas páginas não podem ser desenhadas.
ocr-unreadable = Não foi possível ler «{ $file }» como PDF. Pode estar danificado.
ocr-page-not-drawn = Não foi possível desenhar a página { $page }.
ocr-picture-unreadable = Não foi possível ler a imagem: { $message }
ocr-not-made = O Tesseract não fez { $path }.
ocr-not-made-said = O Tesseract não fez { $path }. Disse: { $message }
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

## What a reading of a PDF came to (ADR 0044).

ocr-remark-counts = { $read ->
    [0] Nenhuma página lida pelo Tesseract
    [one] Uma página lida pelo Tesseract
    [many] { $read } páginas lidas pelo Tesseract
   *[other] { $read } páginas lidas pelo Tesseract
}, { $taken ->
    [0] nenhuma tirada do texto do próprio PDF
    [one] uma tirada do texto do próprio PDF
    [many] { $taken } tiradas do texto do próprio PDF
   *[other] { $taken } tiradas do texto do próprio PDF
}, { $failed ->
    [0] nenhuma que não se pudesse ler.
    [one] uma que não se pôde ler.
    [many] { $failed } que não se puderam ler.
   *[other] { $failed } que não se puderam ler.
}
# Stands in the element in the place of a page that could not be read.
ocr-page-failed-line = [Não foi possível ler esta página: { $message }]
ocr-why-no-tesseract = O Tesseract, que lê texto em imagens, não está instalado.
