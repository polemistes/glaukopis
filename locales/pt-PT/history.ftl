# The full history of a project, in English.
# See locales/README.md.

history-title = Histórico
history-between = Entre os mapas e o histórico
history-settings = Definições do histórico
history-failed = Não foi possível ler o histórico.
history-reading = A ler o histórico…

## When it is not kept

history-off = O histórico deste projeto não é guardado.
history-on-word = Todas as alterações se guardam
history-off-word = Não se guarda
history-off-about = Enquanto se guarda, cada alteração fica registada, com quem a fez e quando: o projeto pode ver-se como estava em qualquer momento, e ser trazido de volta. Ocupa espaço, e num projeto partilhado mostra aos outros o que cada um escreveu, e quando.
history-turn-on = Guardar o histórico

## The moments

# Someone whose name the history does not know.
history-someone = Alguém
history-began = O histórico começa
# The time a session began and ended.
history-span = { $from } – { $to }
# Older history that was merged, so that moments within it are gone.
history-merged = guardado menos finamente
history-added = { $count ->
    [one] +1 carácter
    [many] +{ $count } caracteres
   *[other] +{ $count } caracteres
}
history-removed = { $count ->
    [one] −1 carácter
    [many] −{ $count } caracteres
   *[other] −{ $count } caracteres
}

## The map as it was

history-back = Voltar ao presente
history-as-it-was = Como estava { $when }
history-marked = O que mudou desde o momento anterior está marcado na cor de quem o mudou.
history-map-not-there = Este mapa ainda não existia então.
history-added-by = Acrescentado por { $name }
history-removed-by = Removido por { $name }
history-changed-by = Alterado por { $name }
# A cross-reference to a figure, a table or a part, where it is not known what it said.
history-pointer = remissão
history-name-moment = Dar nome a este momento
history-name-placeholder = Como lhe chamar
history-named = O momento chama-se «{ $name }».
history-bring-back-element = Trazer este elemento de volta como estava
history-bring-back-map = Trazer o mapa de volta como estava
history-brought-back = Trazido de volta como estava. Anular volta atrás.
history-bring-back-failed = Não foi possível trazê-lo de volta.
history-open-copy = Abrir como projeto próprio
history-copy-name = { $name }, como estava { $day }
history-copy-failed = Não foi possível fazer o projeto.

## Archives

history-open-archive = Abrir um arquivo…
history-archive-kind = Histórico do Glaukopis
history-archive-unread = Não foi possível ler o arquivo.
history-archive-of = Arquivo: { $name }
history-archive-close = Fechar

## Settings

history-keep = Guardar o histórico
history-room = O histórico ocupa { $size }.
history-turn-off-title = Deixar de guardar o histórico?
history-turn-off-message = O que se guardou é eliminado. O projeto em si fica como está.
history-turn-off-shared = O que se guardou é eliminado, aqui e nos computadores daqueles com quem o projeto é partilhado. O projeto em si fica como está.
history-turn-off = Eliminar o histórico
history-finely = Histórico mais antigo
history-finely-about = As alterações mais antigas fundem-se, para ocuparem menos espaço e se lerem mais depressa; os momentos dentro delas deixam então de se distinguir. Os momentos com nome, e aqueles com que as revisões comparam, guardam-se.
history-hourly = Fundir cada hora numa só ao fim de
history-weeks = { $count ->
    [one] semana
    [many] semanas
   *[other] semanas
}
history-daily = Fundir cada dia num só ao fim de
history-months = { $count ->
    [one] mês
    [many] meses
   *[other] meses
}
history-before = O que veio antes
history-before-choose = Escolha um momento do histórico para arquivar ou eliminar o que veio antes dele.
history-before-about = O histórico anterior a { $when } pode arquivar-se num ficheiro, para se ver mais tarde, ou eliminar-se.
history-archive = Arquivar…
history-delete = Eliminar
history-archive-title = Arquivar o histórico anterior a { $when }?
history-delete-title = Eliminar o histórico anterior a { $when }?
history-cut-message = O que fica começa com o projeto como estava então.
history-cut-kept = { $count ->
    [one] Há antes dele um momento com nome ou revisto, que deixa de poder ver-se aqui.
    [many] Há antes dele { $count } momentos com nome ou revistos, que deixam de poder ver-se aqui.
   *[other] Há antes dele { $count } momentos com nome ou revistos, que deixam de poder ver-se aqui.
}
history-cut-not-here = O histórico não pode cortar-se antes deste momento.
history-cut-failed = Não foi possível cortar o histórico.
history-archive-until = até { $when }
history-archived = O histórico anterior a { $when } está arquivado.
history-deleted = O histórico anterior a { $when } foi eliminado.
