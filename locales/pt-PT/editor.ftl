# The editor of texts: the tools for writing, citations and notes.
# See locales/README.md.

## The marks and the kinds of paragraph, in the bar over a selection and in
## the tools over the text.

editor-format = Formato
editor-writing = Escrita
editor-italic = Itálico
editor-bold = Negrito
editor-small-capitals = Versaletes
editor-superscript = Expoente
editor-subscript = Índice
editor-struck = Rasurado
editor-quotation = Citação
editor-block-quotation = Citação destacada
editor-list = Lista
editor-text = Texto
editor-text-hint = Um parágrafo
editor-quotation-hint = Destacada do texto
editor-list-hint = Com uma marca antes de cada ponto
editor-numbered-list = Lista numerada
editor-numbered-list-hint = Com um número antes de cada ponto
editor-verse = Verso
editor-verse-hint = Linhas de poesia ou de teatro, cada uma guardada como linha
editor-speaker = Quem fala
editor-speaker-hint = O nome de quem fala, numa linha própria
editor-direction = Didascália
editor-direction-hint = O que se faz, em itálico
editor-line-numbers = Números de linha
editor-line-numbers-hint = Numerar as linhas deste verso: a partir de que linha, e de quantas em quantas
editor-line-numbers-from = Numerar as linhas a partir de
editor-line-numbers-none = Deixe vazio para não haver números
editor-line-numbers-every = Mostrar um número a cada
editor-line-numbers-number = Pede-se um número inteiro.
editor-kinds-text = Texto
editor-kinds-quotation = Citação
editor-kinds-verse = Verso
editor-kinds-script = Guião
editor-kinds-more = Mais
editor-kinds-words = Palavras
editor-attribution = Atribuição
editor-attribution-hint = De quem são as palavras, sob uma citação, à direita
editor-epigraph = Epígrafe
editor-epigraph-hint = Uma citação à cabeça de uma parte
editor-headword = Entrada
editor-headword-hint = A palavra que um glossário explica
editor-gloss = Glosa
editor-gloss-hint = O que a entrada significa
editor-code = Código
editor-code-hint = Guardado letra por letra, em letras de largura igual
editor-break = Pausa
editor-break-hint = Uma pausa entre partes, com o sinal que o formato lhe dá
editor-draft = Nota de rascunho
editor-draft-hint = Só para si: não entra em nenhum documento
editor-foreign = Palavras estrangeiras
editor-foreign-hint = Palavras noutra língua, que a ortografia segue
editor-title-of-work = Título de obra
editor-title-of-work-hint = O título de um livro, de uma peça, de um quadro
editor-term = Termo
editor-term-hint = Um termo onde é usado pela primeira vez
editor-mention = Menção
editor-mention-hint = Uma palavra de que se fala como palavra, entre aspas
editor-highlight = Realce
editor-highlight-hint = Para os olhos, no ecrã: não entra em nenhum documento
editor-underline = Sublinhado
editor-code-words = Código na linha
editor-code-words-hint = Letras de largura igual, dentro da linha
editor-scene = Cabeçalho de cena
editor-scene-hint = INT. CASA – NOITE
editor-action = Ação
editor-action-hint = O que se vê e se faz
editor-character = Personagem
editor-character-hint = Quem fala, sobre o diálogo
editor-dialogue = Diálogo
editor-dialogue-hint = O que se diz
editor-parenthetical = Parêntese
editor-parenthetical-hint = Como se diz, entre parênteses
editor-transition = Transição
editor-transition-hint = CORTA PARA:, à direita
editor-comment = Comentário
editor-comment-hint = Um comentário sobre o que está selecionado
editor-comment-element-hint = Um comentário sobre este elemento; selecione palavras para as comentar
editor-parallel = Dois textos lado a lado
editor-parallel-hint = Um original e a sua tradução, cada um texto por si
editor-paragraph-kind = Tipo de parágrafo
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = Tipo de parágrafo: { $kind }

## The kind menu: the kinds in hand, the whole catalogue under "More…", and
## the format that sets them at its foot. The words menu, with the kinds of
## words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = Mais…
editor-kinds-in-hand = Tipos à mão
editor-kinds-own = Próprios
editor-kinds-make = Criar um tipo…
editor-kinds-change-own = Alterar um tipo próprio…
# Over the item that opens the format editor: the format sets how each kind looks.
editor-kinds-set-by = Compostos como «{ $format }» os tem
editor-kinds-change-format = Alterar o formato…
editor-kinds-change-format-hint = Como cada tipo se compõe neste documento
editor-words = Palavras
editor-words-hint = Sublinhado, expoente, código; palavras estrangeiras, título de obra, termo
editor-words-make = Criar um tipo de palavras…
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-map = A língua do mapa
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = Palavras simples
editor-own-kind-new = Um tipo próprio
editor-own-kind-change = Alterar o tipo
editor-own-kind-name = Nome
editor-own-kind-name-placeholder = Carta, telegrama, oração…
editor-own-kind-words-placeholder = Nome de navio, latim, uma palavra-chave…
editor-own-kind-name-taken = Já há um tipo com esse nome.
editor-own-kind-based-on = Baseado em
editor-own-kind-based-on-hint = O que não se diz abaixo é como este tipo o tem
editor-own-kind-look = Em que difere
editor-own-kind-create = Criar
editor-own-kind-delete-title = Eliminar o tipo «{ $name }»?
editor-own-kind-delete-message = { $count ->
    [0] Nenhum texto é dele.
    [one] O que é dele num elemento fica como está, e compõe-se como texto nos documentos.
    [many] O que é dele em { $count } elementos fica como está, e compõe-se como texto nos documentos.
   *[other] O que é dele em { $count } elementos fica como está, e compõe-se como texto nos documentos.
}

## Citing, notes, and what is put into the text.

editor-cite = Citar
editor-cite-here = Citar uma obra aqui
editor-cite-at-cursor = Citar uma obra onde está o cursor
editor-note = Nota
editor-note-selection = Fazer da seleção uma nota
editor-note-hint = Uma nota, no rodapé da página ou no fim
editor-insert = Inserir
editor-insert-hint = Uma imagem, uma tabela, matemática, uma remissão
editor-new-element = Novo elemento
editor-new-element-hint = Um novo elemento depois deste, ou sob ele
editor-new-after = Novo elemento depois deste
editor-new-under = Novo elemento sob este
editor-new-split = Dividir aqui
editor-new-split-hint = O que se segue ao cursor passa a ser um novo elemento
editor-spelling-on = A ortografia é verificada enquanto escreve · clique para parar
editor-spelling-off = A ortografia não é verificada · clique para a verificar
editor-picture-file = Imagem de um ficheiro…
editor-picture-file-hint = Uma figura, com o que dela se diz
editor-picture-store = Imagem do acervo…
editor-picture-store-hint = As que tem mostram-se ao lado
editor-equation = Equação
editor-equation-hint = Matemática numa linha própria
editor-table = Tabela…
editor-table-hint = De tantas linhas e colunas
editor-table-file = Tabela de um ficheiro…
editor-table-file-hint = CSV, ou uma folha do LibreOffice ou do Excel
editor-formula = Fórmula
editor-formula-hint = Matemática na linha
editor-pointer = Remissão…
editor-pointer-hint = Para uma figura, uma tabela, uma equação ou uma parte: «ver figura 2»
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = imagem

## More.

editor-found = Citações encontradas…
editor-found-count = { $count } por percorrer, e tornar citações
editor-found-none = E texto que parece citações, neste mapa

## Choosing a work to cite.

editor-picker = Escolher uma referência
editor-picker-placeholder = Citar: autor, título, ano
editor-picker-search = Procurar referências
editor-picker-results = Referências
editor-picker-in-project = Neste projeto
editor-picker-recent = Acrescentadas há pouco
editor-picker-empty = A biblioteca está vazia.
editor-picker-no-match = Nada na biblioteca tem estas palavras.
editor-picker-type = Escreva para procurar na biblioteca.
editor-picker-new = Nova referência…
editor-picker-import = Importar…

## A citation, and each work in it.

editor-citation = Citação
editor-citation-add = Acrescentar uma obra
editor-citation-add-purpose = Acrescentar uma obra à citação
editor-citation-in-text = Autor no texto: Nagy (1979)
editor-citation-remove = Remover a citação
editor-citation-split = Separar as palavras da citação
editor-citation-split-hint = As palavras antes e depois passam a texto da linha, e cada obra a uma citação própria, com a sua página e nada mais
editor-citation-not-in-library = Esta referência não está na biblioteca.
editor-citation-edit-reference = Alterar a referência
editor-citation-before = Antes
editor-citation-before-placeholder = ver, cf.
editor-citation-after = Depois
editor-citation-after-placeholder = e passim
editor-citation-locator-kind = Tipo de lugar
editor-citation-suppress-author = O autor é nomeado na minha frase: dar só o ano
editor-citation-remove-work = Remover esta obra
# Stands in the text in place of a citation of a work that is in neither the library nor the project.
editor-citation-missing = [referência não encontrada]
# Stands in the text in place of a citation of no work.
editor-citation-empty = (citação)

## The kinds of place in a work a citation can point to, as the menu of a
## citation names them.

editor-locator-page = Página
editor-locator-chapter = Capítulo
editor-locator-section = Secção
editor-locator-paragraph = Parágrafo
editor-locator-line = Linha
editor-locator-verse = Verso
editor-locator-book = Livro
editor-locator-volume = Volume
editor-locator-part = Parte
editor-locator-column = Coluna
editor-locator-folio = Fólio
editor-locator-figure = Figura
editor-locator-note = Nota
editor-locator-number = Número
editor-locator-sub-verbo = Sub verbo

## A note, in the panel it is written in.

# The number is that of the note, or a letter for a note that stands in a place of its own.
editor-note-numbered = Nota { $number }
editor-note-place = Onde a nota fica
editor-note-place-format = Onde o formato tem as suas notas
editor-note-place-foot = No rodapé da página
editor-note-place-end = No fim do texto
editor-note-placeholder = O texto da nota
