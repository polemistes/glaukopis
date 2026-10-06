# Timelines: when elements are, and a map seen along an axis of time.

timeline-title = Frise chronologique
timeline-view = La frise chronologique
timeline-settings = La frise chronologique
timeline-axis = Axe
timeline-axis-dates = Dates
timeline-axis-units = Unités à vous
timeline-dates-hint = Des années, avec BC ou BCE au besoin (la forme « av. J.-C. » n’est pas encore lue) : 431 BC, c. 480 BCE, 1453-05, 1453-05-29, 5th century BC.
timeline-unit = Comment l’unité s’appelle
timeline-unit-placeholder = année, jour, cycle…
timeline-units-hint = Les temps sont des nombres de l’unité : Année 12, Jour 3, ou simplement 12. Ils peuvent être négatifs.
timeline-lanes = Couloirs
timeline-lanes-given = Chaque enfant du centre est un couloir, jusqu’à ce que vous choisissiez. Un couloir contient ce qui est placé dans sa branche ; son propre placement, s’il en a un, est l’étendue du couloir.
timeline-lanes-chosen = Les couloirs que vous avez choisis, dans l’ordre du texte.
timeline-lanes-reset = De nouveau chaque enfant du centre
timeline-one-lane = Un seul couloir
timeline-each-child = { $count ->
    [one] Son enfant, un couloir
    [many] Chacun des { $count } enfants, un couloir
   *[other] Chacun des { $count } enfants, un couloir
}
timeline-no-branches = La carte n’a encore rien sous son centre.
timeline-lanes-by-kind = Couloirs par type
timeline-lanes-by-kind-hint = Chaque élément d’un type a son couloir : chaque personnage, chaque lieu.
timeline-each-of-kind = Chacun un couloir
timeline-chronology = Ajouter une chronologie à la carte
timeline-chronology-hint = Un élément avec un tableau de tout ce qui est placé, dans l’ordre du temps, à annoter et à imprimer
timeline-chronology-title = Chronologie
timeline-chronology-when = Quand
timeline-chronology-what = Quoi
timeline-chronology-made = Une chronologie a été ajoutée à la carte
timeline-elsewhere = Ailleurs dans la carte
timeline-elsewhere-chosen = Les couloirs sont choisis : ce qui n’est dans aucun d’eux se place ici. Appuyez pour choisir les couloirs de nouveau.
timeline-ordered = Dans l’ordre, sans dates
timeline-empty = Rien ne dit encore quand c’est. Choisissez « Dire quand c’est… » dans le menu d’un élément.
timeline-unplaced = { $count ->
    [one] Un élément n’a pas pu être placé :
    [many] { $count } éléments n’ont pas pu être placés :
   *[other] { $count } éléments n’ont pas pu être placés :
}
timeline-contradiction = ne peut pas être là où il dit être
# Dragging what is placed, and placing what is not.
timeline-moving = Déplacer en glissant
timeline-moving-hint = Glissez un élément le long de l’axe, ou le bord d’une étendue, pour changer son temps ; désactivé, rien ne bouge par mégarde
timeline-without = Éléments sans temps
timeline-without-hint = Glissez-en un sur la frise, ou appuyez dessus pour dire quand c’est :
timeline-waiting-hint = Ne dit encore rien de son temps : appuyez dessus pour dire quand c’est, ou glissez-le le long du couloir pour le placer
timeline-unknown = renvoie à ce qui n’est pas placé, ou à un temps qui ne peut pas être lu

## Saying when an element is
when-title = Quand c’est
when-say = Dire quand c’est…
when-change = Quand c’est…
when-clear = Ne plus le dire
when-kind = À un moment, ou sur une période
when-point = À un moment
when-span = Sur une période
when-when = Quand
when-start = De
when-end = À
when-at = À un temps
when-after = Après un élément
when-before = Avant un élément
when-between = Entre deux éléments
when-during = Pendant un élément
when-time = Temps
when-time-placeholder = 431 BC, May 1453, c. 480…
when-unit-placeholder = Année 12, Jour 3, 12…
when-unread = Ceci ne peut pas être lu comme un temps.
when-after-what = Après
when-before-what = Avant
when-during-what = Pendant
when-choose = Choisir un élément…
when-approx = Approximativement
# A margin either side of a written time, drawn fading away both ways from it.
when-margin = À tant près
when-margin-placeholder = 5 years, 3 months, 10 days…
when-margin-unit-placeholder = 5…
when-margin-unread = Ceci ne peut pas être lu comme une durée.
when-hint-dates = Les années, les dates, les mois, les siècles et les décennies sont lus, avec BC ou BCE au besoin, en anglais pour l’instant. Une année vaut pour l’année entière.
when-hint-units = Les temps sont des nombres de l’unité de la frise, réglée sous ses couloirs. « Année 12 » et « 12 » sont la même chose.
when-bc = av. J.-C.
# $month: 1 to 12; $year: as written.
when-month-of = { $year }, mois { $month }
# How a placement is said beside the element: "after the quarrel, before the embassy".
when-said-after = après
when-said-before = avant
when-said-during = pendant
when-said-to = à
when-said-approx = v.
