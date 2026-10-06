# Tables in the text: making them, their tools, and what can be said of them.
# See locales/README.md.

## A table and its size, as its panel and the reading of a file show them.

tables-table = Tabela
tables-size = { $rows ->
        [one] { $rows } linha
        [many] { $rows } linhas
       *[other] { $rows } linhas
    }, { $columns ->
        [one] { $columns } coluna
        [many] { $columns } colunas
       *[other] { $columns } colunas
    }
# The size, where only the first rows of what was read are shown.
tables-size-shown = { tables-size }. Mostram-se as primeiras { $shown }.

## The bar over a table, and the menu on its cells.

tables-row = Linha
tables-row-hint = Uma linha acima ou abaixo; remover a linha
tables-row-above = Uma linha acima
tables-row-below = Uma linha abaixo
tables-row-remove = Remover a linha
tables-column = Coluna
tables-column-hint = Uma coluna antes ou depois; remover a coluna
tables-column-before = Uma coluna antes
tables-column-after = Uma coluna depois
tables-column-remove = Remover a coluna
tables-join = Juntar as células
tables-join-hint = Juntar as células selecionadas
tables-split = Dividir a célula
tables-split-hint = Dividir a célula nas de que foi juntada
tables-headings = Cabeçalhos
tables-headings-hint = Se a primeira linha e a primeira coluna são cabeçalhos
tables-first-row-headings = A primeira linha é de cabeçalhos
tables-first-column-headings = A primeira coluna é de cabeçalhos
tables-cell-stands = O que a célula contém fica
tables-left = À esquerda
tables-left-hint = O que a célula contém fica à esquerda
tables-middle = Ao meio
tables-middle-hint = O que a célula contém fica ao meio
tables-right = À direita
tables-right-hint = O que a célula contém fica à direita
tables-table-hint = Se é numerada, que largura tem; removê-la
tables-numbered = Numerada
tables-the-table = A tabela…
tables-the-table-hint = Que largura tem
tables-remove = Remover a tabela

## The panel of what can be said of a table as a whole.

tables-width = Largura
tables-width-needed = A que precisa
tables-width-half = Metade
tables-width-three-quarters = Três quartos
tables-width-whole = Inteira
tables-width-of-text = Da largura do texto, no documento.
tables-width-as-needed = Tão larga quanto o que contém precisar.
tables-numbered-as = Numerada, como «Tabela 1»

## A table asked for by its size.

tables-ask = Uma tabela de que tamanho
tables-ask-heading = Uma tabela
tables-ask-grid = Aponte o tamanho da tabela
tables-ask-by = { $rows } por { $columns }
tables-ask-rows = Linhas
tables-ask-columns = Colunas
tables-ask-put = Inserir

## A table from a file.

tables-from-file = Uma tabela de um ficheiro
tables-sheet = Folha
# A sheet of a file that has no name of its own.
tables-sheet-number = Folha { $number }
tables-first-rows = As primeiras linhas, como vão ficar
tables-caption = O que se diz da tabela
tables-caption-placeholder = A sua legenda, que pode alterar-se no texto
tables-header-row = A primeira linha tem os cabeçalhos
tables-header-column = A primeira coluna tem os cabeçalhos
tables-numbers-right = As colunas com números alinham-se à direita.
tables-put = Pôr no texto
# The title of the window in which a file is chosen among the files of the computer.
tables-choose = Uma tabela
# What the files that can be chosen there are called.
tables-files = Tabelas
tables-unreadable = Não foi possível ler { $file } como tabela
tables-cannot-stand = Uma tabela não pode ficar aqui
tables-drop-on-text = Largue uma tabela sobre o texto a que pertence

## Shown by the stylesheet, where the page has no element for the words.

tables-caption-empty = O que se diz da tabela
