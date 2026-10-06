# Reviewing changes afterwards (ADR 0022): the panel of changes beside the
# text, in English. See locales/README.md.

review-title = Alterações
# The button over the text that opens the panel.
review-open = Rever as alterações
review-since-last = Desde a última revisão
review-since-beginning = Desde o início do histórico
review-since-session = Desde que { $who } começou, { $when }
review-since-named = Desde «{ $name }»
# When the moment compared with was, under what it is.
review-since-when = A partir de { $when }
review-choose-since = Rever a partir de outro momento
review-own = As suas alterações também
review-unit = Rever por
review-by-sentence = Frase
review-by-paragraph = Parágrafo
review-left = { $count ->
    [one] Falta uma alteração
    [many] Faltam { $count } alterações
   *[other] Faltam { $count } alterações
}
review-position = { $index } de { $count }
review-working = A apurar as alterações…
review-failed = Não foi possível apurar as alterações.
review-nothing = Nada por rever
review-nothing-text = Todas as alterações que os outros fizeram desde então foram aceites.
review-list = As alterações deste mapa

## What a change is.

review-kind-changed = Alterado
review-kind-added = Texto novo
review-kind-removed = Texto eliminado
review-kind-moved = Movido
review-kind-object = { $what ->
    [figure] Figura
    [table] Tabela
    [equation] Equação
    [citation] Citação
    [math] Fórmula
    [footnote] Nota
    [crossref] Remissão
   *[other] Uma coisa que não é texto
}
review-kind-put-in = { $what } inserida
review-kind-taken-out = { $what } retirada
review-kind-altered = { $what } alterada
review-element-added = Elemento acrescentado
review-element-removed = Elemento eliminado
review-element-moved = Elemento movido
review-element-heading = Impresso como título
review-element-no-heading = Já não impresso como título
review-element-excluded = Deixado fora do documento
review-element-included = Posto de novo no documento
review-element-other = Elemento alterado
# Where a change is: the name of the element.
review-in = Em «{ $element }»
review-moved-from = De «{ $element }»
review-untitled = Sem título
review-gone-element = Um elemento que já lá não está
review-was = Como estava
review-is = Como está
review-nothing-there = Nada
review-someone = Alguém
review-now-under = Agora sob «{ $element }»
review-was-under = Estava sob «{ $element }»

## What is done with a change.

review-accept = Aceitar
review-reject = Rejeitar
review-later = Mais tarde
review-previous = A anterior
review-reject-cannot = O que se eliminou do mapa, ou uma figura retirada, traz-se de volta do histórico.
review-versions = O seu histórico
review-versions-count = { $count ->
    [one] Uma versão
    [many] { $count } versões
   *[other] { $count } versões
}
review-versions-reading = A ler o seu histórico…
review-versions-none = Nada aconteceu entre as duas pontas.
review-version-by = { $who }, { $when }
review-accept-up-to = Aceitar até aqui
review-use-version = Usar esta versão

## Without the history.

review-no-history = O histórico deste projeto não é guardado
review-no-history-text = As alterações reveem-se a partir do histórico do projeto, que diz quem alterou o quê, e quando. Guarda-se a partir do momento em que se liga.
review-turn-on = Guardar o histórico
review-turn-on-elsewhere = Liga-se com o histórico do projeto.
