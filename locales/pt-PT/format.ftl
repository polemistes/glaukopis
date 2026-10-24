# Document formats: their kinds, and the editor of a format.

## The kinds of document format, as the formats are grouped by them.

format-kind-own = Próprios
format-kind-general = Gerais
format-kind-style-guide = Guias de estilo
format-kind-publisher = Editoras
format-kind-journal = Revistas
format-kind-fiction = Ficção
format-kind-stage = Palco e ecrã
format-kind-poetry = Poesia

## The format editor.

format-name = Nome do formato
# The name a format of one's own is first given, made from that of the format it is made from.
format-name-changed = { $name }, alterado
format-saved = «{ $name }» está guardado entre os formatos próprios
format-save-failed = Não foi possível guardar o formato.
format-delete-failed = Não foi possível eliminar o formato.
format-delete-title = Eliminar o formato «{ $name }»?
format-delete-message = Os mapas que o usam passam a usar o formato geral de manuscrito.
format-delete-confirm = Eliminar o formato

## The parts of a format, as they are chosen at the left.

## Words that stand in several parts.

format-size = Tamanho
format-bold = Negrito
format-italic = Itálico
format-letters = Letras
format-alignment = Alinhamento
format-line-spacing = Espaçamento entre linhas
format-as-the-text = Como o texto
# Beside a size of 0, in the place of its unit.
format-as-the-text-zero = como o texto
# Beside a number of 0, in the place of its unit.
format-not-said = não dito
format-align-left = À esquerda
format-align-center = Centrado
format-align-right = À direita
format-align-justified = Justificado
format-align-ragged = À esquerda, irregular à direita
format-case-none = Como se escreve
format-case-upper = MAIÚSCULAS
format-case-smallcaps = Versaletes
format-spacing-single = Simples
format-spacing-one-and-a-half = Um e meio
format-spacing-double = Duplo
format-stands-left = À esquerda
format-stands-center = Ao meio
format-stands-right = À direita

## The page.

format-page-custom = Outro tamanho
format-page-width = Largura
format-page-height = Altura
format-margins = Margens
format-margin-top = Superior
format-margin-bottom = Inferior
format-margin-left = Esquerda
format-margin-right = Direita
format-lengths-hint = As medidas escrevem-se com a unidade: 2.5cm, 1in, 25mm, 12pt.
format-line-numbers = Numerar as linhas

## Type and spacing, and paragraphs.

format-typeface = Fonte
format-hyphenate = Dividir as palavras no fim das linhas
format-paragraphs = Os parágrafos distinguem-se por
format-paragraphs-indent = Primeira linha avançada
format-paragraphs-spaced = Espaço entre eles
format-indent = Avanço
format-indent-first = Também depois de um título
format-space-between = Espaço entre parágrafos
format-italics = O itálico compõe-se
format-italics-italic = Em itálico
format-italics-underline = Sublinhado, como nos manuscritos datilografados

## Headings.

format-numbered = Numerados
format-level = Nível { $number }
# What a level of headings is, in short, beside its number: "14 pt, bold, centred".
format-level-size = { $size } pt
format-level-bold = negrito
format-level-italic = itálico
format-level-capitals = maiúsculas
format-level-small-caps = versaletes
format-level-centred = centrado
format-level-right = à direita
format-level-run-in = corrido com o texto
format-level-indent = Avançado como um parágrafo
format-level-new-page-said = em nova página
format-space-before = Espaço antes
format-space-after = Espaço depois
format-level-add = Um nível mais fundo
format-level-remove = Remover o mais fundo

## The title and the abstract.

format-title-placement = O título fica
format-title-top = No alto da primeira página
format-title-own-page = Numa página própria
format-title-authors = Autores
format-title-affiliations = As suas instituições
format-title-date = Data
format-title-abstract = Resumo e palavras-chave
format-title-abstract-label = Título do resumo
format-title-keywords-label = Palavra antes das palavras-chave

## Quotations, notes and the bibliography.

format-quote-indent-left = Avanço à esquerda
format-quote-indent-right = Avanço à direita
format-quote-when = Quando uma citação se destaca
format-quote-from-words = A partir de tantas palavras
format-quote-from-lines = Ou de tantas linhas
format-notes-kind = As notas ficam
format-notes-footnotes = No rodapé da página
format-notes-endnotes = No fim do texto
format-notes-title = Título das notas
format-bibliography-title = Título
format-bibliography-new-page = Começa em nova página
format-bibliography-hanging-indent = Avanço pendente
format-bibliography-entry-spacing = Espaço entre entradas

## The kinds of paragraph and of words: how each differs from the kind it
## is based on. The rows are those of the dialog for a kind of one's own
## too; what is not said is as the base has it.

format-kind-based-on = baseado em { $base }
format-as-the-base = Como a base
# In an empty field for a size, in the place of its number.
format-as-the-base-blank = como a base
format-yes = Sim
format-no = Não
format-underline = Sublinhado
format-equal-width = Letras de largura igual
format-equal-width-hint = Como se compõe o código
format-indent-left = Avanço à esquerda
format-indent-right = Avanço à direita
format-first-line = Primeira linha
format-first-line-hint = Quanto começa mais dentro do que as restantes
format-keep-with-next = Junto ao seguinte
format-keep-with-next-hint = Não fica sozinho ao fundo de uma página
format-new-page = Começa uma nova página
format-break-text = O que fica numa pausa
format-break-text-hint = * * * onde nada se diz; # para um manuscrito
# What a look says, in short, on the line of its kind: "10 pt, italic, centred".
format-look-not-bold = sem negrito
format-look-not-italic = sem itálico
format-look-underlined = sublinhado
format-look-not-underlined = sem sublinhado
format-look-as-written = como se escreve
format-look-left = à esquerda
format-look-justified = justificado
format-look-indent-left = { $length } de avanço à esquerda
format-look-indent-right = { $length } de avanço à direita
format-look-first-line = primeira linha { $length }
format-look-space-before = { $length } antes
format-look-space-after = { $length } depois
format-look-line-spacing = espaçamento { $spacing }
format-look-equal-width = letras de largura igual
format-look-not-equal-width = letras de largura desigual
format-look-kept = junto ao seguinte
format-look-not-kept = não junto ao seguinte
format-look-no-new-page = sem nova página
format-look-text = «{ $text }» numa pausa

## Figures and tables, which are told alike. The kind is figure or table: where
## English has the same words for both, another language may not (the caption
## of a figure and of a table can have different names).

format-figures = Figuras
format-tables = Tabelas
format-captioned-called = { $kind ->
    [figure] Uma figura chama-se
   *[table] Uma tabela chama-se
}
format-captioned-reference = Onde o texto remete para ela
format-captioned-label-bold = A palavra e o número em negrito
format-captioned-label-italic = A palavra e o número em itálico
format-captioned-between = { $kind ->
    [figure] Entre o número e a legenda
   *[table] Entre o número e a legenda
}
# What stands between the number and the caption; called is the word and number, "Figure 1".
format-between-stop = { $kind ->
    [figure] Ponto final ({ $called }. Legenda)
   *[table] Ponto final ({ $called }. Legenda)
}
format-between-colon = { $kind ->
    [figure] Dois pontos ({ $called }: Legenda)
   *[table] Dois pontos ({ $called }: Legenda)
}
format-between-line = { $kind ->
    [figure] Legenda em linha própria
   *[table] Legenda em linha própria
}
format-between-other = Outro…
format-captioned-separator = O que fica entre eles
format-captioned-own-line = { $kind ->
    [figure] Depois a legenda em linha própria
   *[table] Depois a legenda em linha própria
}
format-caption = { $kind ->
    [figure] Legenda
   *[table] Legenda
}
format-caption-stands = { $kind ->
    [figure] A legenda fica
   *[table] A legenda fica
}
format-caption-below = { $kind ->
    [figure] Sob a imagem
   *[table] Sob a tabela
}
format-caption-above = { $kind ->
    [figure] Sobre a imagem
   *[table] Sobre a tabela
}
format-captioned-where = { $kind ->
    [figure] Onde ficam as figuras
   *[table] Onde ficam as tabelas
}
format-captioned-stand = { $kind ->
    [figure] As figuras ficam
   *[table] As tabelas ficam
}
format-captioned-wrap = O texto corre à volta delas
format-captioned-placement = No documento
format-captioned-in-text = No texto
format-captioned-at-end = Reunidas no fim
format-captioned-end-title = { $kind ->
    [figure] Título sobre as figuras
   *[table] Título sobre as tabelas
}
# What is left in the text where a figure or table gathered at the end belongs.
format-captioned-placeholder = Linha deixada no texto
format-captioned-placeholder-missing = Tem de conter {"{}"}, onde vão a palavra e o número
format-table-rules = Filetes
format-table-rules-horizontal = Em cima, em baixo e sob os cabeçalhos
format-table-rules-grid = À volta de cada célula
format-table-rules-none = Nenhum
format-table-header-bold = Cabeçalhos em negrito
format-equations = Equações
format-equations-stand = As equações ficam
format-equations-before = Antes do número
format-equations-after = Depois do número

## Page numbers and the running head.

format-page-numbers = Números de página
format-page-numbers-show = As páginas são numeradas

## About the format: where its requirements are from.

format-description = Descrição
format-source = De onde vêm as exigências
# The date the source was read on.
format-source-read = Lido em { $date }.
format-source-high = Os valores são os indicados na origem.
format-source-medium = A origem só pôde ler-se em parte, ou num estado anterior: confirme o que lhe importa.
format-source-low = Pouco se pôde verificar: tome os valores como um começo.
