# Figures, formulas and equations in the text, and the cross-references to
# them. See locales/README.md.

## A figure, and the panel of what can be said of it.

figures-figure = Figura
figures-width = Largura
figures-width-third = Um terço
figures-width-half = Metade
figures-width-three-quarters = Três quartos
figures-width-whole = Inteira
figures-width-of-row = Do espaço que tem na fila.
figures-width-of-text = Da largura do texto, no documento.
figures-shows = Mostra
figures-shows-placeholder = Por palavras, para quem não a pode ver
figures-numbered = Numerada, como «Figura 1»
figures-keep-caption = Guardar a legenda com a imagem
figures-keep-caption-hint = As figuras feitas com esta imagem começam então pelo que aqui se diz
figures-take-caption = Usar a da imagem
figures-take-caption-hint = O que está guardado com a imagem diz-se aqui, em vez do que se diz agora
figures-another-picture = Outra imagem…
figures-remove = Remover a figura
figures-caption-kept = Guardada com a imagem
figures-caption-kept-detail = As figuras feitas com ela começam por estas palavras.
# The title of the window in which a picture is chosen among the files of the computer.
figures-choose-picture = Uma imagem
# What the files that can be chosen there are called.
figures-picture-files = Imagens

## The store of pictures, as the text reads it.

figures-pictures-unread = Não foi possível ler as imagens
figures-picture-not-taken = Não foi possível acrescentar a imagem
figures-picture-not-kept = Não foi possível guardar o que se disse da imagem
figures-picture-not-removed = Não foi possível remover a imagem

## Where a figure, a table or an equation stands.

figures-stands = Fica
figures-stands-in-row = ao lado de outras, numa fila
figures-stands-alone = Sozinha de novo
# Said of the choices of where it stands; the kind is figure, table or equation.
figures-stands-where = Onde fica a { $kind ->
        [figure] figura
        [table] tabela
       *[equation] equação
    }
figures-side-format = Como o formato
figures-side-left = À esquerda
figures-side-middle = Ao meio
figures-side-right = À direita
# What the format of the document says of where things of a kind stand. The
# flow is none for equations, and for what stands in the middle.
figures-usual = O formato põe as { $kind ->
        [figure] figuras
        [table] tabelas
       *[equation] equações
    } { $side ->
        [left] à esquerda
        [right] à direita
       *[center] ao meio
    }{ $flow ->
        [around] , com o texto a correr à volta delas
        [apart] , separadas do texto
       *[none] {""}
    }.
figures-text = Texto
figures-flows-where = Se o texto corre à volta da { $kind ->
        [figure] figura
        [table] tabela
       *[equation] equação
    }
figures-flow-format = Como o formato
figures-flow-around = Corre à volta dela
figures-flow-apart = Fica separado
figures-flow-at-side = O texto corre à volta do que fica a um lado.
figures-beside = Pô-la ao lado da anterior

## A formula in the line, and an equation on a line of its own.

figures-formula = Fórmula
figures-equation = Equação
figures-equation-numbered = Numerada
figures-formula-field = A fórmula, na notação do TeX
figures-formula-empty = O que se escreve mostra-se aqui como vai ficar.
figures-formula-hint = Escrita como em TeX. Enter quando estiver pronta, Esc para a deixar como estava.
figures-equation-hint = Escrita como em TeX. Enter quando estiver pronta, Shift+Enter para uma nova linha, Esc para a deixar como estava.
figures-formula-unread = Não foi possível ler a fórmula.
# Shown in the text where a formula has nothing written in it yet.
figures-formula-blank = fórmula
figures-equation-blank = Uma equação

## What can be put into a formula by pressing.

figures-sign-raised = Expoente
figures-sign-lowered = Índice
figures-sign-fraction = Fração
figures-sign-root = Raiz
figures-sign-sum = Somatório
figures-sign-integral = Integral
figures-sign-brackets = Parênteses que crescem
figures-sign-alpha = alfa
figures-sign-beta = beta
figures-sign-gamma = gama
figures-sign-lambda = lambda
figures-sign-pi = pi
figures-sign-sigma = sigma
figures-sign-less-or-equal = Menor ou igual
figures-sign-greater-or-equal = Maior ou igual
figures-sign-not-equal = Diferente
figures-sign-nearly-equal = Aproximadamente igual
figures-sign-times = Vezes
figures-sign-plus-or-minus = Mais ou menos
figures-sign-arrow = Seta
figures-sign-infinity = Infinito
figures-sign-words = Palavras dentro de uma fórmula

## Cross-references to a figure, a table, an equation or a part.

figures-points-by = Mostrada como
figures-form-full = A palavra e o número
figures-form-number = Só o número
figures-form-equation = O número tal como está junto à equação
figures-form-its-number = O seu número
figures-form-its-name = O seu nome
figures-go-to = Ir aonde remete
figures-pointed-gone = Aquilo para que isto remete já não está no documento
figures-point-elsewhere = Remeter para outra coisa…

## Choosing what a cross-reference refers to.

figures-targets = Escolher para que remeter
figures-targets-placeholder = Remeter para uma figura, uma tabela, uma equação, uma parte
figures-targets-search = Procurar aquilo para que se pode remeter
figures-targets-results = Para que se pode remeter
figures-targets-figures = Figuras
figures-targets-tables = Tabelas
figures-targets-equations = Equações
figures-targets-parts = Partes do documento
figures-targets-figure-unsaid = Uma figura de que nada se diz
figures-targets-table-unsaid = Uma tabela de que nada se diz
figures-targets-no-match = Nada no documento responde a estas palavras.
figures-targets-none = Ainda não há para que remeter: nenhuma figura, nenhuma tabela, nenhuma equação numerada, nenhuma parte com nome.
figures-targets-hint = Uma remissão segue aquilo para que remete: o seu número, e o que o formato lhe chama.

## Shown by the stylesheet, where the page has no element for the words.

figures-picture-absent = A imagem não está neste computador
figures-caption-placeholder = O que se diz da imagem
