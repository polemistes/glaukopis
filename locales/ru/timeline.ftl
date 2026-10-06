# Timelines: when elements are, and a map seen along an axis of time.

timeline-title = Шкала времени
timeline-view = Шкала времени
timeline-settings = Шкала времени
timeline-axis = Ось
timeline-axis-dates = Даты
timeline-axis-units = Свои единицы
timeline-dates-hint = Годы, где нужно — с «до н. э.»: 431 до н. э., ок. 480 до н. э., май 1453, 1453-05-29, V век до н. э.
timeline-unit = Как называется единица
timeline-unit-placeholder = год, день, цикл…
timeline-units-hint = Времена — числа единиц: Год 12, День 3 или просто 12. Они могут быть отрицательными.
timeline-lanes = Дорожки
timeline-lanes-given = Каждый потомок центра — дорожка, пока вы не выберете иначе. Дорожка держит то, что размещено в её ветви; её собственное время, если оно есть, — протяжённость дорожки.
timeline-lanes-chosen = Выбранные вами дорожки, в порядке текста.
timeline-lanes-reset = Снова каждый потомок центра
timeline-one-lane = Одна дорожка
timeline-each-child = { $count ->
    [one] { $count } потомок — дорожка
    [few] Каждый из { $count } потомков — дорожка
    [many] Каждый из { $count } потомков — дорожка
   *[other] Каждый из { $count } потомков — дорожка
}
timeline-no-branches = Под центром карты пока ничего нет.
timeline-lanes-by-kind = Дорожки по виду
timeline-lanes-by-kind-hint = Каждый элемент вида — своя дорожка: каждый персонаж, каждое место.
timeline-each-of-kind = Каждый — дорожка
timeline-chronology = Добавить в карту хронологию
timeline-chronology-hint = Элемент с таблицей всего размещённого, в порядке времени, чтобы писать в нём и печатать
timeline-chronology-title = Хронология
timeline-chronology-when = Когда
timeline-chronology-what = Что
timeline-chronology-made = Хронология добавлена в карту
timeline-elsewhere = В других местах карты
timeline-elsewhere-chosen = Дорожки выбраны: то, что не стоит ни в одной из них, стоит здесь. Нажмите, чтобы выбрать дорожки заново.
timeline-ordered = По порядку, без дат
timeline-empty = Пока ничто не говорит, когда оно. Выберите «Указать, когда…» в меню элемента.
timeline-unplaced = { $count ->
    [one] { $count } элемент не удалось разместить:
    [few] { $count } элемента не удалось разместить:
    [many] { $count } элементов не удалось разместить:
   *[other] { $count } элемента не удалось разместить:
}
timeline-contradiction = не может быть там, где сказано
# Dragging what is placed, and placing what is not.
timeline-moving = Перемещать перетаскиванием
timeline-moving-hint = Перетащите элемент вдоль оси или край отрезка, чтобы изменить его время; выключено — чтобы ничего не сдвинулось по ошибке
timeline-without = Элементы без времени
timeline-without-hint = Перетащите один на шкалу или нажмите его, чтобы указать, когда он:
timeline-waiting-hint = О его времени пока ничего не сказано: нажмите, чтобы указать, когда он, или перетащите вдоль дорожки, чтобы разместить
timeline-unknown = отсылает к неразмещённому или ко времени, которое нельзя прочитать

## Saying when an element is
when-title = Когда это
when-say = Указать, когда…
when-change = Когда это…
when-clear = Больше не указывать
when-kind = В точке или на отрезке
when-point = В точке
when-span = На отрезке
when-when = Когда
when-start = С
when-end = По
when-at = В определённое время
when-after = После элемента
when-before = До элемента
when-between = Между двумя элементами
when-during = Во время элемента
when-time = Время
when-time-placeholder = 431 до н. э., май 1453, ок. 480…
when-unit-placeholder = Год 12, День 3, 12…
when-unread = Это нельзя прочитать как время.
when-after-what = После
when-before-what = До
when-during-what = Во время
when-choose = Выбрать элемент…
when-approx = Приблизительно
# A margin either side of a written time, drawn fading away both ways from it.
when-margin = Плюс-минус
when-margin-placeholder = 5 лет, 3 месяца, 10 дней…
when-margin-unit-placeholder = 5…
when-margin-unread = Это нельзя прочитать как промежуток времени.
when-hint-dates = Читаются годы, даты, месяцы, века и десятилетия, где нужно — с «до н. э.». Год означает весь год.
when-hint-units = Времена — числа единиц шкалы, заданных под её дорожками. «Год 12» и «12» — одно и то же.
when-bc = до н. э.
# $month: 1 to 12; $year: as written.
when-month-of = { $year }, месяц { $month }
# How a placement is said beside the element: "after the quarrel, before the embassy".
when-said-after = после
when-said-before = до
when-said-during = во время
when-said-to = по
when-said-approx = ок.
