# Citations that were found in a text written elsewhere, and the panel at
# the side in which they are gone through (ADR 0015), in English. See
# locales/README.md.

## The panel.

found-title = Citações encontradas
# On the tab of the panel, beside the other tabs: short.
found-tab = Encontradas
found-between = Entre o mapa e as citações encontradas
found-taken = O que se toma por citação
found-taken-always = O que um programa fez, e etiquetas
found-taken-years = Parênteses com um ano dentro
found-taken-named = Notas que nomeiam uma obra da biblioteca
found-taken-notes = Todas as notas
found-asking = A consultar a biblioteca…
found-make-certain = { $count ->
    [one] Fazer uma citação da que é certa
    [many] Fazer citações das { $count } que são certas
   *[other] Fazer citações das { $count } que são certas
}
found-made = { $count ->
    [one] Fez-se uma citação
    [many] Fizeram-se { $count } citações
   *[other] Fizeram-se { $count } citações
}
found-made-undo = Ctrl+Z anula-as, de uma só vez.
found-library-failed = Não foi possível consultar a biblioteca.
found-nothing = Nada por percorrer
found-nothing-looked = Não resta neste mapa nenhuma citação encontrada, e nada nele se parece com uma.
found-nothing-looked-more = Não resta neste mapa nenhuma citação encontrada, e nada nele se parece com uma. Pode tomar-se mais por citação, acima.
found-nothing-not-looked = Não resta neste mapa nenhuma citação encontrada. O texto que apenas se parece com uma citação procura-se quando se diz, acima, o que se toma por citação: parênteses com um ano dentro, ou notas.
found-list-label = O que há por percorrer
found-untitled = Sem título
found-in-a-note = Numa nota
# The element of the map a citation stands in.
found-in = Em «{ $element }»
found-in-note-of = Numa nota de «{ $element }»
# Set small and high after the words a note stands after.
found-note-mark = nota
found-position = { $index } de { $count }
found-previous = A anterior
found-next = A seguinte
found-list-show = Mostrar a lista
found-list-hide = Ocultar a lista
found-later = Mais tarde
found-leave = Deixar como texto
found-make = Fazer dela uma citação

## How sure the library is of what it proposes.

found-sure-certain = A biblioteca tem-na de certeza
found-sure-likely = A biblioteca tem o que provavelmente é
found-sure-possible = A biblioteca tem o que pode ser
found-sure-none = Uma obra dela ainda não tem referência

## By what a citation was found.

found-by-zotero = Feita pelo Zotero
found-by-mendeley = Feita pelo Mendeley, ou por um programa que escreve como ele
found-by-key = Uma etiqueta que nomeia uma referência
found-by-form = Tomada por citação pela forma que tem

## The citation that is to be made.

found-the-citation = A citação
found-no-works = Não nomeia nenhuma obra. Acrescente uma, ou deixe-a como o texto que é.
found-add-work = Acrescentar uma obra
found-author-in-text = Autor no texto: Nagy (1979)
found-pick-work = A obra citada: autor, título, ano
found-pick-add = Acrescentar uma obra à citação
found-too-little = O ficheiro diz demasiado pouco desta obra para dela se fazer uma referência
found-reference-failed = Não foi possível fazer a referência

## A citation that stands in a note.

found-in-note = Está numa nota
found-note-becomes = A nota torna-se uma citação
# What the note says besides its works, which becomes the words before them, after them, or both.
found-note-around = O mais que a nota diz vai antes e depois das suas obras{ $has ->
        [before] : «{ $before }» antes
        [after] : «{ $after }» depois
       *[both] : «{ $before }» antes, «{ $after }» depois
    }. O estilo das referências põe-na na linha ou numa nota.
found-note-style = O estilo das referências põe-na na linha ou numa nota.
found-citation-in-note = A citação fica na nota
    .hint = A nota continua a ser nota, com o mais que diz.
found-for-all = Assim para todas as que se seguem
found-note-not = Não está numa nota.
# What else the note holds, by the name of what it is in the text.
found-note-holds = A nota contém { $what ->
        [math] uma fórmula
        [crossref] uma remissão
        [citation] uma citação
        [hard_break] uma segunda linha
       *[other] algo que não é texto
    }, que as palavras antes e depois de uma obra não podem conter.
found-note-another = A nota contém outra citação encontrada, que se perderia nas palavras depois desta.

## Why what was asked could not be done.

found-trouble-gone = Já não está no texto.
found-trouble-changed = O texto mudou aqui desde que foi proposta, e foi visto de novo.
found-trouble-cannot = Não se pode fazer dela uma citação aqui.

## One work of a citation, as the text says it is.

# Those who made it: “Nagy and Lord”, “Nagy et al.”
found-people-two = { $first } e { $second }
found-people-more = { $first } et al.
found-work-a-work = Uma obra
found-work-looking = Procura-se { $work } na biblioteca…
found-work-no-tag = { $work } é uma etiqueta que nenhuma referência da biblioteca tem.
found-work-not-found = { $work } não foi encontrada na biblioteca.
found-work-chosen = Escolhida por si
# The writer chose this reference for another citation of the same work, and this one followed.
found-work-followed = Como se escolheu para a mesma obra
found-work-certain = Certa
found-work-likely = Provável
found-work-possible = Possível
# What the text says the work is.
found-work-for = para «{ $work }»
found-work-others = Outras referências que pode ser
found-work-or = Ou
found-work-may-be = Pode ser
found-work-another = Outra…
found-work-find = Procurá-la…
found-work-add = Acrescentá-la à biblioteca
