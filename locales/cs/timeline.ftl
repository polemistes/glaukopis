# Timelines: when elements are, and a map seen along an axis of time.

timeline-title = Časová osa
timeline-view = Časová osa
timeline-settings = Časová osa
timeline-axis = Osa
timeline-axis-dates = Data
timeline-axis-units = Vlastní jednotky
timeline-dates-hint = Roky, kde je třeba s př. n. l.: 431 př. n. l., asi 480 př. n. l., květen 1453, 1453-05-29, 5. století př. n. l.
timeline-unit = Jak se jednotka jmenuje
timeline-unit-placeholder = rok, den, cyklus…
timeline-units-hint = Časy jsou počty jednotek: Rok 12, Den 3, nebo jen 12. Mohou být záporné.
timeline-lanes = Pruhy
timeline-lanes-given = Každý potomek středu je pruh, dokud nezvolíte jinak. Pruh obsahuje, co je umístěno v jeho větvi; jeho vlastní umístění, má-li nějaké, je rozpětí pruhu.
timeline-lanes-chosen = Pruhy, které jste zvolili, v pořadí textu.
timeline-lanes-reset = Opět každý potomek středu
timeline-one-lane = Jeden pruh
timeline-each-child = { $count ->
    [one] Jeho potomek jako pruh
    [few] Každý z { $count } potomků jako pruh
   *[other] Každý z { $count } potomků jako pruh
}
timeline-no-branches = Mapa pod středem zatím nic nemá.
timeline-lanes-by-kind = Pruhy podle druhu
timeline-lanes-by-kind-hint = Každý prvek určitého druhu jako samostatný pruh: každá postava, každé místo.
timeline-each-of-kind = Každý jako pruh
timeline-chronology = Přidat do mapy chronologii
timeline-chronology-hint = Prvek s tabulkou všeho umístěného, v časovém pořadí, k psaní a tisku
timeline-chronology-title = Chronologie
timeline-chronology-when = Kdy
timeline-chronology-what = Co
timeline-chronology-made = Do mapy byla přidána chronologie
timeline-elsewhere = Jinde v mapě
timeline-elsewhere-chosen = Pruhy jsou zvoleny: co nestojí v žádném z nich, stojí zde. Stisknutím zvolíte pruhy znovu.
timeline-ordered = V pořadí, bez dat
timeline-empty = Zatím nic neříká, kdy je. Zvolte „Určit, kdy je…“ v nabídce prvku.
timeline-unplaced = { $count ->
    [one] Jeden prvek nelze umístit:
    [few] { $count } prvky nelze umístit:
   *[other] { $count } prvků nelze umístit:
}
timeline-contradiction = nemůže být tam, kde říká, že je
# Dragging what is placed, and placing what is not.
timeline-moving = Přesouvat tažením
timeline-moving-hint = Táhněte prvek po ose, nebo okraj rozpětí, a změníte jeho čas; vypnuto, aby se nic nepohnulo omylem
timeline-without = Prvky bez času
timeline-without-hint = Přetáhněte jeden na časovou osu, nebo ho stiskněte a určete, kdy je:
timeline-waiting-hint = Zatím nic neříká o svém čase: stiskněte ho a určete, kdy je, nebo ho táhněte po pruhu a umístěte
timeline-unknown = odkazuje na něco neumístěného, nebo na čas, který nelze přečíst

## Saying when an element is
when-title = Kdy je
when-say = Určit, kdy je…
when-change = Kdy je…
when-clear = Už neurčovat
when-kind = V bodě, nebo v rozpětí
when-point = V bodě
when-span = V rozpětí
when-when = Kdy
when-start = Od
when-end = Do
when-at = V určitém čase
when-after = Po prvku
when-before = Před prvkem
when-between = Mezi dvěma prvky
when-during = Během prvku
when-time = Čas
when-time-placeholder = 431 př. n. l., květen 1453, asi 480…
when-unit-placeholder = Rok 12, Den 3, 12…
when-unread = Toto nelze přečíst jako čas.
when-after-what = Po
when-before-what = Před
when-during-what = Během
when-choose = Vybrat prvek…
when-approx = Přibližně
# A margin either side of a written time, drawn fading away both ways from it.
when-margin = Plus minus
when-margin-placeholder = 5 let, 3 měsíce, 10 dní…
when-margin-unit-placeholder = 5…
when-margin-unread = Toto nelze přečíst jako délku času.
when-hint-dates = Čtou se roky, data, měsíce, století a desetiletí, kde je třeba s př. n. l. Rok zastupuje celý rok.
when-hint-units = Časy jsou počty jednotek časové osy, nastavené u jejích pruhů. „Rok 12“ a „12“ je totéž.
when-bc = př. n. l.
# $month: 1 to 12; $year: as written.
when-month-of = { $year }, měsíc { $month }
# How a placement is said beside the element: "after the quarrel, before the embassy".
when-said-after = po
when-said-before = před
when-said-during = během
when-said-to = až
when-said-approx = asi
