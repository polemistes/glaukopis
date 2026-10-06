# Reference styles: their kinds, the search for more, and the style editor,
# with the words it tells the parts of a style by.

## The kinds of reference style, as the styles are grouped by them.

style-kind-note = Notas
style-kind-author-date = Autor e data
style-kind-numeric = Números
style-kind-label = Rótulos
style-kind-author = Autor
style-kind-other = Outros

## The search for reference styles of journals and publishers.

style-browser = Estilos de citação
style-browser-subtitle = Mais de dez mil estilos de revistas e editoras, pelo nome
style-browser-placeholder = O nome de uma revista, de uma editora ou de um estilo
style-browser-search = Procurar estilos
# Beside a style that has been fetched already.
style-browser-here = Aqui
style-browser-fetch = Obter
style-browser-none-found = Nenhum estilo tem estas palavras no nome.
style-browser-about = Os estilos obtêm-se do repositório do projeto Citation Style Language e guardam-se com os seus. Os que tem podem alterar-se ao gosto de uma editora no editor de estilos.
style-browser-import = Importar um ficheiro…
style-browser-import-title = Importar um estilo de citação
style-browser-fetch-failed = Não foi possível obter o estilo.
style-browser-file-unread = Não foi possível ler o ficheiro.

## The style editor.

style-editor = Estilo de citação
style-name = Nome do estilo
# The name a style of one's own is first given, made from that of the style it is made from.
style-name-changed = { $name }, alterado
style-depth = Até onde ir
style-depth-options = Alterações comuns
style-depth-parts = Parte por parte
style-depth-source = Código
style-scope = O que alterar
style-scope-citations = Citações
style-scope-notes = Notas
style-scope-bibliography = Bibliografia
style-bundled = Os estilos que vêm com o Glaukopis ficam como estão. As alterações guardam-se como um estilo próprio.
style-delete = Eliminar este estilo
style-save-own = Guardar como meu
style-saved = «{ $name }» está guardado entre os estilos próprios
style-read-failed = Não foi possível ler o estilo.
style-save-failed = Não foi possível guardar o estilo.
style-delete-failed = Não foi possível eliminar o estilo.
style-delete-title = Eliminar o estilo «{ $name }»?
style-delete-message = Os mapas que o usam passam a usar outro estilo.
style-delete-confirm = Eliminar o estilo
style-leave-title = Sair sem guardar?
style-leave-message = As alterações feitas ao estilo perder-se-ão.
style-leave-confirm = Sair
style-leave-cancel = Continuar a editar

## Common changes: names.

style-names = Nomes
# A sentence with two fields in it, where numbers are written: the least number of
# authors for which "et al." is used, and how many are named before it.
style-et-al = Com { $min } autores ou mais, dar os primeiros { $first } e «et al.»
style-et-al-min = Número de autores a partir do qual se usa et al.
style-et-al-first = Número de autores dados antes de et al.
style-et-al-empty = Deixado vazio, nomeiam-se todos
# As the one before, for a work that has been cited before.
style-et-al-again = Quando citada de novo, com { $min } ou mais dar os primeiros { $first }
style-et-al-again-min = Número de autores a partir do qual se usa et al. nas citações seguintes
style-et-al-again-first = Número de autores dados nas citações seguintes
style-et-al-again-empty = Deixado vazio, como da primeira vez
style-before-last-name = Antes do último nome
# The word the style prints there, in the language of the document.
style-and-word = e
style-and-nothing = Nada
style-as-the-style-has-it = Como o estilo o tem
style-comma-before-last = Uma vírgula antes dele
style-comma-contextual = Com três nomes ou mais: A, B, e C
style-comma-always = Sempre: A, e B
style-comma-never = Nunca: A, B e C
style-comma-after-inverted = Depois de um nome invertido
style-given-names = Nomes próprios
style-given-full = Por extenso: John Miles
style-given-spaced = Iniciais: J. M.
style-given-close = Iniciais, juntas: J.M.
style-given-bare = Iniciais sem pontos: JM
style-given-bare-spaced = Iniciais sem pontos: J M
style-family-first = Apelido primeiro
style-family-first-none = Para ninguém: John Foley
style-family-first-first = Para o primeiro autor: Foley, John, e Robert Fowler
style-family-first-all = Para todos: Foley, John, e Fowler, Robert
style-sort-separator = Entre o apelido e o nome próprio
style-sort-separator-hint = Quando o apelido vem primeiro

## Common changes: the citation, or the note, and the entries of the bibliography.

style-the-citation = A citação
style-the-note = A nota
style-begins-with = Começa por
style-ends-with = Acaba em
style-between-works = Entre obras citadas juntas
style-collapse = Obras de um autor citadas juntas
style-collapse-none = Cada uma por extenso
style-collapse-year = O nome uma vez: Nagy 1979, 1996
style-collapse-year-suffix = E o ano uma vez: Nagy 1979a, b
style-collapse-year-suffix-ranged = Com intervalos: Nagy 1979a–c
style-collapse-citation-number = Números como intervalos: [1–3]
style-disambiguate = Quando duas obras se citariam da mesma maneira
style-disambiguate-year-suffix = Acrescentar uma letra ao ano
style-disambiguate-names = Nomear mais autores
style-disambiguate-given-names = Acrescentar nomes próprios ou iniciais
style-near-note = Uma nota conta como próxima até
style-near-note-hint = Notas; para estilos que abreviam o que foi citado perto
style-entries = As entradas
style-entry-ends-with = Cada uma acaba em
style-author-repeated = Para um autor repetido
style-author-repeated-hint = Em vez do nome, nas entradas depois da primeira
style-hanging-indent = Avanço pendente
style-hanging-indent-hint = O formato do documento decide quanto
style-second-field = Os números ou rótulos ficam
style-second-field-line = Na linha
style-second-field-column = Numa coluna própria
style-second-field-margin = Na margem
style-second-field-hint = Para estilos que numeram as entradas

## Common changes: throughout the style.

style-throughout = Em todo o estilo
style-page-ranges = Intervalos de páginas
style-page-ranges-as-entered = Como escritos
style-page-ranges-expanded = Por extenso: 321–328
style-page-ranges-minimal = O mais curto: 321–8
style-page-ranges-minimal-two = Dois algarismos pelo menos: 321–28
style-page-ranges-chicago = Como o Chicago Manual o tem
style-particles = «van», «de», «von» antes de um apelido
style-particles-never = Ficam com ele, e ordenam-se por v, d
style-particles-sort-only = Ficam com ele, mas não contam para a ordem
style-particles-display-and-sort = Passam para depois do nome próprio: Gogh, Vincent van
style-hyphen = Um hífen entre iniciais
style-hyphen-hint = J.-P. Sartre, não J.P. Sartre
style-locale = As palavras do estilo estão em
style-locale-document = A língua do documento
style-locale-hint = «ed.», «in», «consultado», os meses

## Part by part.

# The scope is citation or bibliography.
style-parts-of = { $scope ->
    [citation] Partes da citação
   *[bibliography] Partes da bibliografia
}
style-parts-none = { $scope ->
    [citation] Este estilo não tem citação.
   *[bibliography] Este estilo não tem bibliografia.
}
style-parts-hint = Escolha uma parte à esquerda para alterar como se imprime: o que fica antes e depois dela, a sua letra, as suas maiúsculas. As partes abrem-se para mostrar de que são feitas.
style-part-unfold = Abrir
style-part-fold = Fechar
style-part-up = Mover para cima
style-part-down = Mover para baixo
style-part-add-after = Acrescentar depois dela
style-part-take-away = Tirar
style-part-add-within = Acrescentar dentro dela
# A part of a macro: a part of the style that is used in several places.
style-part-shared = Isto pertence a «{ $macro }», que se usa em { $count } lugares. Uma alteração aqui vê-se em todos eles.
style-add-words = Palavras minhas
style-add-words-hint = Como «in», «consultado», ou pontuação
# Over the fields of a reference that a part can print.
style-add-from-reference = Da referência
style-part-words = As palavras
style-part-before = Antes dela
style-part-before-hint = Só se imprime quando a própria parte se imprime
style-part-after = Depois dela
style-part-between = Entre as suas partes
style-slant = Inclinação
style-slant-upright = Redondo
style-slant-italic = Itálico
style-weight = Peso
style-weight-regular = Normal
style-weight-bold = Negrito
style-letters = Letras
style-letters-as-written = Como escritas
style-letters-small-caps = Versaletes
style-case = Maiúsculas
style-case-as-entered = Como escritas
style-case-title = Como Um Título Inglês
style-case-sentence = Como uma frase
style-case-capitalize-first = Primeira letra maiúscula
style-case-capitalize-all = Cada Palavra Com Maiúscula
style-case-uppercase = MAIÚSCULAS
style-case-lowercase = minúsculas
style-height = Altura
style-height-baseline = Na linha
style-height-raised = Em expoente
style-height-lowered = Em índice
style-quotes = Entre aspas
style-strip-periods = Sem pontos
style-strip-periods-hint = Para abreviaturas: «ed» em vez de «ed.»
style-text-form = Forma
style-text-form-long = Por extenso
style-text-form-short = Curta, onde a referência a tem
style-term-form = Forma da palavra
style-term-form-long = Por extenso: editor, página
style-term-form-short = Curta: ed., p.
style-term-form-verb = Como verbo: editado por
style-term-form-verb-short = Como verbo, curta: ed. por
style-term-form-symbol = Como sinal: §
style-date-parts = A data dá-se
style-date-parts-year = Só com o ano
style-date-parts-year-month = Com ano e mês
style-date-parts-full = Por extenso

## The source of the style, and the sample it is tried on.

style-source = Código do estilo
style-source-try = Experimentar
style-source-unread = Não foi possível ler o código.
style-sample-unusable = O estilo não pode usar-se como está
style-sample-failed = Não foi possível experimentar o estilo.
style-sample-in-text = No texto
style-sample-in-notes = Nas notas
style-sample-in-bibliography = Na bibliografia
style-sample-cited = Uma obra citada
style-sample-same-page = A mesma, numa página
style-sample-another = Outra, com uma palavra antes
style-sample-first-again = A primeira de novo, num capítulo
style-sample-together = Duas obras juntas
style-sample-in-sentence = Com o autor na frase
style-sample-examples = Mostrado com exemplos: a biblioteca está vazia.
style-sample-library = Mostrado com obras da biblioteca.

## The source of a style, where it cannot be read as one.

style-source-not-xml = O código não é XML bem formado.
style-source-not-style = Isto não é um estilo: não começa por <style>.
style-source-dependent = O estilo não tem <citation>: apenas nomeia outro estilo, e não pode alterar-se.

## The parts of a style, as the style editor tells them in words.

style-part-layout = O todo
style-part-text = Texto
# A part that prints a word of the style's language: the term is its name in CSL.
style-part-term = A palavra para «{ $term }»
# A part that prints words written into the style.
style-part-value = As palavras «{ $value }»
style-part-name = Como se escrevem os nomes
# The name is family or given, as CSL has them.
style-part-name-part = { $name ->
    [family] O apelido
    [given] O nome próprio
   *[other] O nome { $name }
}
style-part-et-al = «et al.»
# The variables are one or more of those below: "the pages".
style-part-label = A palavra antes de { $variables } («p.», «ed.»)
style-part-role = A palavra para o papel («ed.», «trad.»)
style-part-substitute = Quando não há tal nome, em seu lugar
# The name is day, month or year, as CSL has them, or part.
style-part-date-part = { $name ->
    [day] O dia
    [month] O mês
    [year] O ano
   *[other] O { $name }
}
style-part-group = Em conjunto
style-part-choose = Um destes
# The condition is made of those below.
style-part-if = Se { $condition }
style-part-else-if = Senão, se { $condition }
style-part-else = Caso contrário
# A name the style has, of a part of it (a macro) or of a variable it does not know.
style-quoted = «{ $text }»

## Words that join others: "the author, or else the editor", "a book or a chapter".
## The first may be a list of several, joined by commas.

style-or = { $first } ou { $last }
style-and = { $first } e { $last }
style-or-else = { $first }, ou então { $last }

## When a part of a style is printed: "If the work is a book".

style-if-type = a obra é { $types }
style-if-has = tem { $variables }
style-if-lacks = não tem { $variables }
style-if-numeric = { $variables } é um número
style-if-uncertain = { $variables } é incerto
# The places are pages, chapters, verses and the like; see style-locator.
style-if-locator = o lugar citado é { $locators }
style-if-disambiguate = de outro modo se confundiria com outra
style-if-always = sempre
style-if-none-holds = nada disto se verifica: { $conditions }
# A kind of place that a citation points to, as CSL names it: page, chapter, verse,
# sub-verbo, and so on. English leaves the names as they are.
style-locator = { $name }

## When a citation is printed, by where it stands among the others.

style-position-first = é citada pela primeira vez
style-position-subsequent = já foi citada antes
style-position-ibid = é a mesma que a citação anterior
style-position-ibid-with-locator = é a mesma que a citação anterior, noutro lugar
style-position-near-note = foi citada numa nota próxima

## How a part is set: "italic, in quotation marks, before “, ”".

style-form-italic = itálico
style-form-bold = negrito
style-form-small-caps = versaletes
style-form-underlined = sublinhado
style-form-quoted = entre aspas
# How the letters are set, as CSL names it; the words are that name with spaces for its dashes.
style-form-case = { $case ->
    [lowercase] minúsculas
    [uppercase] maiúsculas
    [capitalize-first] primeira letra maiúscula
    [capitalize-all] cada palavra com maiúscula
    [sentence] como uma frase
    [title] como um título inglês
   *[other] { $words }
}
style-form-raised = em expoente
style-form-lowered = em índice
# The part comes after these words.
style-form-after = depois de «{ $text }»
# The part comes before these words.
style-form-before = antes de «{ $text }»
style-form-between = com «{ $text }» entre

## The kinds of work a reference is of, as CSL names them.

style-type-book = um livro
style-type-chapter = um capítulo
style-type-article-journal = um artigo de revista científica
style-type-article-magazine = um artigo de revista
style-type-article-newspaper = um artigo de jornal
style-type-article = um artigo
style-type-thesis = uma tese
style-type-report = um relatório
style-type-webpage = uma página web
style-type-paper-conference = uma comunicação em congresso
style-type-entry-encyclopedia = uma entrada de enciclopédia
style-type-entry-dictionary = uma entrada de dicionário
style-type-entry = uma entrada
style-type-review = uma recensão
style-type-review-book = uma recensão de um livro
style-type-manuscript = um manuscrito
style-type-personal_communication = uma carta ou outra comunicação
style-type-legal_case = uma decisão judicial
style-type-legislation = legislação
style-type-bill = um projeto de lei
style-type-patent = uma patente
style-type-dataset = um conjunto de dados
style-type-software = software
style-type-motion_picture = um filme
style-type-broadcast = uma emissão
style-type-song = uma gravação
style-type-speech = uma conferência
style-type-interview = uma entrevista
style-type-graphic = uma imagem
style-type-map = um mapa
style-type-pamphlet = um folheto
style-type-post-weblog = uma publicação de blogue
style-type-post = uma publicação
style-type-classic = uma obra clássica
style-type-collection = uma coletânea
style-type-document = um documento
style-type-standard = uma norma
style-type-treaty = um tratado
style-type-periodical = um periódico
style-type-musical_score = uma partitura
style-type-figure = uma figura
style-type-event = um evento
style-type-performance = um espetáculo
style-type-regulation = um regulamento
style-type-hearing = uma audição

## What a reference has, as CSL names it: with its article, and without it
## (.bare) as a field of a reference is named.

style-variable-title = o título
    .bare = título
style-variable-title-short = o título abreviado
    .bare = título abreviado
style-variable-container-title = o título da revista ou do livro
    .bare = título da revista ou do livro
style-variable-container-title-short = o título abreviado da revista
    .bare = título abreviado da revista
style-variable-collection-title = a série
    .bare = série
style-variable-collection-number = o número na série
    .bare = número na série
style-variable-original-title = o título original
    .bare = título original
style-variable-reviewed-title = o título da obra recenseada
    .bare = título da obra recenseada
style-variable-author = o autor
    .bare = autor
style-variable-editor = o editor
    .bare = editor
style-variable-translator = o tradutor
    .bare = tradutor
style-variable-container-author = o autor do livro
    .bare = autor do livro
style-variable-collection-editor = o editor da série
    .bare = editor da série
style-variable-editorial-director = o diretor editorial
    .bare = diretor editorial
style-variable-original-author = o autor original
    .bare = autor original
style-variable-reviewed-author = o autor da obra recenseada
    .bare = autor da obra recenseada
style-variable-interviewer = o entrevistador
    .bare = entrevistador
style-variable-recipient = o destinatário
    .bare = destinatário
style-variable-director = o realizador
    .bare = realizador
style-variable-composer = o compositor
    .bare = compositor
style-variable-illustrator = o ilustrador
    .bare = ilustrador
style-variable-issued = a data
    .bare = data
style-variable-accessed = a data de consulta
    .bare = data de consulta
style-variable-original-date = a data original
    .bare = data original
style-variable-event-date = a data do evento
    .bare = data do evento
style-variable-submitted = a data de submissão
    .bare = data de submissão
style-variable-volume = o volume
    .bare = volume
style-variable-number-of-volumes = o número de volumes
    .bare = número de volumes
style-variable-issue = o fascículo
    .bare = fascículo
style-variable-edition = a edição
    .bare = edição
style-variable-page = as páginas
    .bare = páginas
style-variable-page-first = a primeira página
    .bare = primeira página
style-variable-number-of-pages = o número de páginas
    .bare = número de páginas
style-variable-number = o número
    .bare = número
style-variable-chapter = o capítulo
    .bare = capítulo
style-variable-chapter-number = o número do capítulo
    .bare = número do capítulo
style-variable-publisher = a editora
    .bare = editora
style-variable-publisher-place = o lugar de publicação
    .bare = lugar de publicação
style-variable-original-publisher = a editora original
    .bare = editora original
style-variable-original-publisher-place = o lugar de publicação original
    .bare = lugar de publicação original
style-variable-locator = o lugar citado
    .bare = lugar citado
style-variable-citation-number = o número da citação
    .bare = número da citação
style-variable-citation-label = o rótulo da citação
    .bare = rótulo da citação
style-variable-year-suffix = a letra depois do ano
    .bare = letra depois do ano
style-variable-first-reference-note-number = o número da nota onde foi citada pela primeira vez
    .bare = número da nota onde foi citada pela primeira vez
style-variable-DOI = o DOI
    .bare = DOI
style-variable-URL = o endereço
    .bare = endereço
style-variable-ISBN = o ISBN
    .bare = ISBN
style-variable-ISSN = o ISSN
    .bare = ISSN
style-variable-PMID = o PMID
    .bare = PMID
style-variable-genre = o tipo de obra
    .bare = tipo de obra
style-variable-medium = o suporte
    .bare = suporte
style-variable-note = a nota
    .bare = nota
style-variable-annote = a anotação
    .bare = anotação
style-variable-abstract = o resumo
    .bare = resumo
style-variable-archive = o arquivo
    .bare = arquivo
style-variable-archive_location = o lugar no arquivo
    .bare = lugar no arquivo
style-variable-archive-place = o lugar do arquivo
    .bare = lugar do arquivo
style-variable-authority = a autoridade
    .bare = autoridade
style-variable-call-number = a cota
    .bare = cota
style-variable-event = o evento
    .bare = evento
style-variable-event-place = o lugar do evento
    .bare = lugar do evento
style-variable-event-title = o título do evento
    .bare = título do evento
style-variable-section = a secção
    .bare = secção
style-variable-source = a fonte
    .bare = fonte
style-variable-status = o estado de publicação
    .bare = estado de publicação
style-variable-version = a versão
    .bare = versão
style-variable-language = a língua
    .bare = língua
style-variable-dimensions = as dimensões
    .bare = dimensões
style-variable-scale = a escala
    .bare = escala
style-variable-references = as referências
    .bare = referências
style-variable-keyword = as palavras-chave
    .bare = palavras-chave
style-variable-jurisdiction = a jurisdição
    .bare = jurisdição
