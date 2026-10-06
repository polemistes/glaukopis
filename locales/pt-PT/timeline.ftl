# Timelines: when elements are, and a map seen along an axis of time.

timeline-title = Linha cronológica
timeline-view = A linha cronológica
timeline-settings = A linha cronológica
timeline-axis = Eixo
timeline-axis-dates = Datas
timeline-axis-units = Unidades próprias
timeline-dates-hint = Anos, com a.C. onde for preciso: 431 a.C., c. 480 a.C., maio de 1453, 1453-05-29, século V a.C.
timeline-unit = Como se chama uma unidade
timeline-unit-placeholder = ano, dia, ciclo…
timeline-units-hint = Os tempos são números da unidade: Ano 12, Dia 3, ou só 12. Podem ser negativos.
timeline-lanes = Faixas
timeline-lanes-given = Cada filho do centro é uma faixa, até que escolha. Uma faixa contém o que está colocado no seu ramo; a sua própria colocação, se a tiver, é o período da faixa.
timeline-lanes-chosen = As faixas que escolheu, pela ordem do texto.
timeline-lanes-reset = De novo cada filho do centro
timeline-one-lane = Uma faixa
timeline-each-child = { $count ->
    [one] O seu filho uma faixa
    [many] Cada um dos { $count } filhos uma faixa
   *[other] Cada um dos { $count } filhos uma faixa
}
timeline-no-branches = O mapa ainda não tem nada sob o centro.
timeline-lanes-by-kind = Faixas por tipo
timeline-lanes-by-kind-hint = Cada elemento de um tipo uma faixa própria: cada personagem, cada lugar.
timeline-each-of-kind = Cada um uma faixa
timeline-chronology = Acrescentar uma cronologia ao mapa
timeline-chronology-hint = Um elemento com uma tabela de tudo o que está colocado, por ordem de tempo, para escrever nele e imprimir
timeline-chronology-title = Cronologia
timeline-chronology-when = Quando
timeline-chronology-what = O quê
timeline-chronology-made = Acrescentou-se uma cronologia ao mapa
timeline-elsewhere = Noutro lado do mapa
timeline-elsewhere-chosen = As faixas estão escolhidas: o que não está em nenhuma delas fica aqui. Clique para escolher as faixas de novo.
timeline-ordered = Por ordem, sem datas
timeline-empty = Ainda nada diz quando é. Escolha «Dizer quando é…» no menu de um elemento.
timeline-unplaced = { $count ->
    [one] Um elemento não pôde ser colocado:
    [many] { $count } elementos não puderam ser colocados:
   *[other] { $count } elementos não puderam ser colocados:
}
timeline-contradiction = não pode estar onde diz que está
# Dragging what is placed, and placing what is not.
timeline-moving = Mover arrastando
timeline-moving-hint = Arraste um elemento ao longo do eixo, ou a ponta de um período, para mudar o seu tempo; desligado, para que nada se mova por engano
timeline-without = Elementos sem tempo
timeline-without-hint = Arraste um para a linha cronológica, ou clique nele para dizer quando é:
timeline-waiting-hint = Ainda nada diz do seu tempo: clique nele para dizer quando é, ou arraste-o ao longo da faixa para o colocar
timeline-unknown = remete para o que não está colocado, ou para um tempo que não se consegue ler

## Saying when an element is
when-title = Quando é
when-say = Dizer quando é…
when-change = Quando é…
when-clear = Deixar de dizer
when-kind = Num ponto, ou ao longo de um período
when-point = Num ponto
when-span = Ao longo de um período
when-when = Quando
when-start = De
when-end = A
when-at = Num tempo
when-after = Depois de um elemento
when-before = Antes de um elemento
when-between = Entre dois elementos
when-during = Durante um elemento
when-time = Tempo
when-time-placeholder = 431 a.C., maio de 1453, c. 480…
when-unit-placeholder = Ano 12, Dia 3, 12…
when-unread = Isto não se consegue ler como um tempo.
when-after-what = Depois de
when-before-what = Antes de
when-during-what = Durante
when-choose = Escolher um elemento…
when-approx = Aproximadamente
# A margin either side of a written time, drawn fading away both ways from it.
when-margin = Mais ou menos
when-margin-placeholder = 5 anos, 3 meses, 10 dias…
when-margin-unit-placeholder = 5…
when-margin-unread = Isto não se consegue ler como uma duração.
when-hint-dates = Leem-se anos, datas, meses, séculos e décadas, com a.C. onde for preciso. Um ano vale pelo ano inteiro.
when-hint-units = Os tempos são números da unidade da linha cronológica, definida sob as suas faixas. «Ano 12» e «12» são o mesmo.
when-bc = a.C.
# $month: 1 to 12; $year: as written.
when-month-of = { $year }, mês { $month }
# How a placement is said beside the element: "after the quarrel, before the embassy".
when-said-after = depois de
when-said-before = antes de
when-said-during = durante
when-said-to = a
when-said-approx = c.
