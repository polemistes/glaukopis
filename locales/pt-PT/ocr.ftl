# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDF e imagens
ocr-no-tesseract = O Tesseract, que lê texto em imagens, não está instalado ou não foi encontrado. Instale-o com o gestor de pacotes do sistema, com os dados das línguas que lê (no Arch: tesseract e tesseract-data-por, tesseract-data-eng e assim por diante), ou diga nas definições onde ele está.
ocr-failed = Não foi possível ler o texto.
ocr-looking = A examinar { $file }…
ocr-about-picture = O texto lê-se da imagem.
ocr-about-scan = { $pages ->
    [one] O PDF não tem texto: lê-se de uma imagem da sua página.
    [many] Nenhuma das { $pages } páginas tem texto: leem-se de imagens delas.
   *[other] Nenhuma das { $pages } páginas tem texto: leem-se de imagens delas.
}
ocr-about-some = { $without ->
    [one] Uma das { $pages } páginas não tem texto, e lê-se de uma imagem dela; as outras tomam-se como estão.
    [many] { $without } das { $pages } páginas não têm texto, e leem-se de imagens delas; as outras tomam-se como estão.
   *[other] { $without } das { $pages } páginas não têm texto, e leem-se de imagens delas; as outras tomam-se como estão.
}
ocr-about-text = { $pages ->
    [one] A página tem texto, que se toma como está.
    [many] Todas as páginas têm texto, que se toma como está.
   *[other] Todas as páginas têm texto, que se toma como está.
}
ocr-read-all = Ler também as páginas que têm texto
ocr-read-all-hint = O texto delas fica, e o que se lê sobrepõe-se-lhe.
ocr-read-all-map-hint = O que se lê toma o lugar do texto delas: para quando este é fraco, ou não se consegue ler.
ocr-read = Ler o texto
ocr-read-text-pages = Tomar as páginas que têm texto
ocr-take-text = Tomar o texto
ocr-reading = A ler { $file }…
ocr-reading-pages = { $done } de { $total } páginas lidas
ocr-reading-hint = Uma página leva alguns segundos. Cancelar interrompe a leitura.

## How the text is read: what to try when a reading goes badly

ocr-how = Como se lê
ocr-how-dpi = Resolução, em pontos por polegada
ocr-how-layout = Disposição da página
ocr-how-layout-auto = Como o Tesseract julgar
ocr-how-layout-column = Uma coluna
ocr-how-layout-block = Um bloco de texto
ocr-how-layout-sparse = Texto esparso
ocr-how-contrast = Preto e branco
ocr-how-hint = O que experimentar quando uma leitura corre mal: uma resolução mais alta para letra pequena, uma coluna onde as colunas se confundem, um bloco de texto para um parágrafo único, e preto e branco para impressão ténue ou desigual.

## The languages of the text

ocr-languages = Línguas do texto
ocr-languages-hint = A mais provável primeiro. Cada uma a mais torna a leitura mais lenta, e nem sempre melhor.
ocr-language-add = Acrescentar uma língua…
ocr-language-remove = Tirar { $language }
# A script rather than a language: "Latin script".
ocr-language-script = Escrita { $script }
ocr-language-fraktur = { $language }, Fraktur
ocr-language-old = { $language }, forma antiga
ocr-language-vertical = { $language }, escrito na vertical

## A PDF of the library made searchable

ocr-searchable-button = Tornar pesquisável…
ocr-searchable-title = Tornar o PDF pesquisável
ocr-searchable-about = { $without ->
    [one] Uma das { $pages } páginas não tem texto. É lida, e o seu texto fica invisível sob o que se mostra, para que se possa procurar e copiar. O PDF fica com o aspeto que tinha.
    [many] { $without } das { $pages } páginas não têm texto. São lidas, e o seu texto fica invisível sob o que se mostra, para que se possa procurar e copiar. O PDF fica com o aspeto que tinha.
   *[other] { $without } das { $pages } páginas não têm texto. São lidas, e o seu texto fica invisível sob o que se mostra, para que se possa procurar e copiar. O PDF fica com o aspeto que tinha.
}
ocr-searchable-has-text = { $pages ->
    [one] A página tem texto: o PDF já se pode pesquisar.
    [many] Todas as páginas têm texto: o PDF já se pode pesquisar.
   *[other] Todas as páginas têm texto: o PDF já se pode pesquisar.
}
ocr-searchable-damaged = Não foi possível desmontar o PDF para o alterar: pode estar danificado. O seu texto pode ainda assim ser trazido para um projeto como mapa.
ocr-searchable-make = Tornar pesquisável
ocr-strip = Tirar o texto invisível que têm, e guardar só o que se lê
ocr-strip-hint = Para uma camada de texto fraca, como a que um digitalizador põe sob a página. As letras que se veem ficam, e a página fica com o aspeto que tinha.
ocr-searchable-done = { $count ->
    [one] O PDF está pesquisável: leu-se uma página
    [many] O PDF está pesquisável: leram-se { $count } páginas
   *[other] O PDF está pesquisável: leram-se { $count } páginas
}
ocr-searchable-failed = { $count ->
    [one] Não foi possível ler uma página.
    [many] Não foi possível ler { $count } páginas.
   *[other] Não foi possível ler { $count } páginas.
}

## A map from a PDF of the library

ocr-map-button = Um mapa do seu texto…
ocr-map-title = Um mapa do texto
ocr-map-into = Para o projeto
ocr-map-new-project = Um novo projeto, com o nome dele
ocr-map-making = A fazer o mapa…
ocr-map-failed = Não foi possível fazer o mapa.

## The text of a picture of the store

ocr-picture-read = Ler o texto que tem…
ocr-picture-title = O texto da imagem
ocr-picture-empty = Não se encontrou texto na imagem.
ocr-picture-copy = Copiar
ocr-picture-copied = O texto está copiado
ocr-picture-map = Fazer dele um mapa

## Tesseract in the settings

ocr-settings-looking = A procurar…
ocr-settings-missing = Não encontrado. É preciso para ler texto de digitalizações e imagens. Instale o tesseract com o gestor de pacotes do sistema, com os dados das línguas que lê (no Arch, tesseract-data-por para o português, tesseract-data-eng para o inglês, tesseract-data-grc para o grego antigo, …), ou diga abaixo onde está.
ocr-settings-by-itself = Encontrado por si
ocr-settings-where = Onde está o Tesseract
ocr-settings-look-failed = Não foi possível procurar o Tesseract
ocr-settings-has = Lê { $languages }.
ocr-settings-has-none = Não tem os dados de nenhuma língua: instale os de uma, como tesseract-data-por.
ocr-settings-first = Ler, à partida, em
ocr-settings-first-hint = Quando nenhuma está escolhida, a língua do texto e a da interface.
ocr-settings-how = Como o texto se lê à partida
