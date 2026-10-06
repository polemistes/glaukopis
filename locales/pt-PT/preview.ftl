# The preview, and the making of documents: the panel beside the map, the
# details of a document, and the export.

## The panel beside the map, and what is chosen over it.

preview = Pré-visualização
# Small, over the choice of the document format.
preview-format = Formato
preview-format-label = Formato do documento
# Small, over the choice of the reference style.
preview-style = Referências
preview-style-label = Estilo de citação
# The last among the reference styles, which opens the search for more.
preview-style-more = Mais estilos…
preview-change = Alterar o formato ou o estilo
preview-change-format = Alterar este formato…
preview-change-format-hint = Página, fonte, espaçamento, títulos
preview-change-style = Alterar este estilo de citação…
preview-change-style-hint = Ao gosto de uma editora
preview-details = Título, autores, resumo
# Shows in the text the element whose place in the pages is looked at.
preview-go-to-text = Ir a este lugar no texto
# Moves the pages to where the element the text is at begins.
preview-show-text = Mostrar onde o texto está
preview-hide = Ocultar a pré-visualização
# When a format that goes with a reference style is chosen, the style is taken with it.
preview-style-taken = O estilo de citação é agora { $style }
preview-style-taken-why = É o que acompanha este formato.
preview-style-keep-other = Manter o outro
# The name of the program is Pandoc, Typst or LaTeX.
preview-program-missing = O { $program } não está instalado
preview-programs-needed = A pré-visualização e a exportação fazem-se com o Pandoc e o Typst. Instale-os com o gestor de pacotes do sistema, ou diga nas definições onde estão.
preview-look-again = Procurar de novo
preview-looking-failed = Não foi possível procurar os programas
preview-reading-failed = Não foi possível ler os estilos e os formatos
preview-failed = Não foi possível fazer a pré-visualização
preview-failed-message = Não foi possível fazer a pré-visualização.
# A page of the preview, as it is told to those who cannot see it.
preview-page = Página { $number }
# The name of an exported file, where the map has none.
preview-file-name = documento

## At the foot of the preview: how long the document is, and what there is to remark.

preview-pages = { $count ->
    [one] { $count } página
    [many] { $count } páginas
   *[other] { $count } páginas
}
preview-words = { $count ->
    [one] { $count } palavra
    [many] { $count } palavras
   *[other] { $count } palavras
}
# The words of the text, and the most the format allows.
preview-words-of = { $limit ->
    [one] { $count } de { $limit } palavra
    [many] { $count } de { $limit } palavras
   *[other] { $count } de { $limit } palavras
}
# The words of the text and of its notes together.
preview-words-with-notes = { $count } com as notas
preview-remarks-count = { $count ->
    [one] { $count } observação
    [many] { $count } observações
   *[other] { $count } observações
}
preview-remarks = Observações
preview-remarks-font = Fonte
preview-font-missing = A fonte { $font } não está instalada.
# The first name is that of the font the format asks for; this is of the one used in its place.
preview-font-substitute = Em seu lugar usa-se { $font }, aqui na pré-visualização e num PDF que se faça. Num documento exportado para o Word, o LibreOffice ou o LaTeX, a fonte é nomeada como o formato pede, e lá estará para quem abrir o documento e a tiver.
preview-remarks-references = Referências
# In bold, and the next follows it in the same sentence.
preview-works-missing = { $count ->
    [one] { $count } obra citada não foi encontrada,
    [many] { $count } obras citadas não foram encontradas,
   *[other] { $count } obras citadas não foram encontradas,
}
preview-works-missing-where = nem na biblioteca nem no projeto. Estão marcadas no texto.
# Over what Pandoc and Typst said while they made the document.
preview-remarks-warnings = Dito enquanto o documento se fazia

## The details of a document: what stands on its first page.

preview-details-dialog = O documento
preview-details-dialog-subtitle = O que fica na sua primeira página
preview-details-title = Título
preview-details-title-placeholder = O nome do centro do mapa
preview-details-title-hint = Deixado vazio, o título é o nome do centro do mapa.
preview-details-subtitle = Subtítulo
preview-details-authors = Autores
preview-details-name = Nome
preview-details-author-name = Nome do autor { $number }
preview-details-affiliation = Instituição
preview-details-author-affiliation = Instituição do autor { $number }
preview-details-email = E-mail
preview-details-author-email = E-mail do autor { $number }
# Beside a plus, under the authors: adds one.
preview-details-add-author = autor
preview-details-abstract = Resumo
preview-details-words = { $count ->
    [one] { $count } palavra
    [many] { $count } palavras
   *[other] { $count } palavras
}
# The words of the abstract, and the most the format allows.
preview-details-words-of = { $limit ->
    [one] { $count } de { $limit } palavra
    [many] { $count } de { $limit } palavras
   *[other] { $count } de { $limit } palavras
}
preview-details-keywords = Palavras-chave
# The keywords given, and the most the format allows.
preview-details-keywords-of = { $count } de { $limit }
preview-details-keywords-placeholder = Separadas por vírgulas
preview-details-date = Data
preview-details-date-placeholder = Tal como se há de imprimir
preview-details-language = Língua do texto
# A map that was given no language is printed in English.
preview-details-language-none = Não indicada (inglês)
preview-details-cover = Capa
preview-details-cover-choose = Escolher uma imagem…
preview-details-cover-other = Outra…
preview-details-cover-hint = A capa do livro eletrónico: uma imagem, guardada no acervo de imagens. Nada mais a usa.

## The export: the kinds of file a document is made as.

preview-export = Exportar
preview-export-kind = Tipo de ficheiro
preview-export-pdf-about = Como a pré-visualização o mostra
preview-export-pdflatex = PDF, composto pelo LaTeX
preview-export-pdflatex-about = O mesmo documento na composição do LaTeX. Leva um pouco mais de tempo.
preview-export-docx-about = O que a maioria das editoras e revistas pede
preview-export-odt-about = Para o LibreOffice Writer e outros
preview-export-latex-about = Para compor com LuaLaTeX ou XeLaTeX
preview-export-markdown-about = Texto simples, com as citações como chaves
preview-export-html = Página web
preview-export-html-about = Um só ficheiro, para ler num navegador
preview-export-epub = Livro eletrónico
preview-export-epub-about = EPUB, para leitores de livros eletrónicos e as aplicações que os leem; é o leitor que compõe o texto
preview-export-latex-missing = Para isto é preciso o LaTeX, que não foi encontrado. Instala-se como TeX Live.
preview-export-biblatex = Manter as citações como comandos do BibLaTeX
preview-export-biblatex-hint = As referências escrevem-se num ficheiro .bib ao lado do documento. O estilo de citação é então o do BibLaTeX mais próximo do escolhido.
# The title of the window where the file is named; the kind is PDF, Word, and so on.
preview-export-as = Exportar como { $kind }
preview-export-run = Exportar…
preview-export-working = A fazer o documento…
preview-export-failed = Não foi possível fazer o documento.
preview-export-stop = Parar
preview-export-stopped = A exportação foi interrompida. Nenhum ficheiro foi escrito.
# Under the name of the file that was made: another file made with it.
preview-export-also = com { $file }
preview-export-missing = { $count ->
    [one] Uma obra citada não foi encontrada, e está marcada no texto.
    [many] { $count } obras citadas não foram encontradas, e estão marcadas no texto.
   *[other] { $count } obras citadas não foram encontradas, e estão marcadas no texto.
}
preview-export-show-in-folder = Mostrar na pasta
preview-export-open-failed = Não foi possível abrir o ficheiro
preview-export-folder-failed = Não foi possível abrir a pasta
preview-export-another = Exportar outro
