# Reviewing changes afterwards (ADR 0022): the panel of changes beside the
# text, in English. See locales/README.md.

review-title = Изменения
# The button over the text that opens the panel.
review-open = Проверить изменения
review-since-last = С вашей последней проверки
review-since-beginning = С начала истории
review-since-session = С тех пор, как { $who } начал(а), { $when }
review-since-named = С «{ $name }»
# When the moment compared with was, under what it is.
review-since-when = С { $when }
review-choose-since = Проверить с другого момента
review-own = И ваши собственные изменения
review-unit = Проверять по
review-by-sentence = Предложениям
review-by-paragraph = Абзацам
review-left = { $count ->
    [one] Осталось { $count } изменение
    [few] Осталось { $count } изменения
    [many] Осталось { $count } изменений
   *[other] Осталось { $count } изменения
}
review-position = { $index } из { $count }
review-working = Вычисление изменений…
review-failed = Не удалось вычислить изменения.
review-nothing = Проверять больше нечего
review-nothing-text = Все изменения, которые остальные внесли с тех пор, приняты.
review-list = Изменения этой карты

## What a change is.

review-kind-changed = Изменено
review-kind-added = Новый текст
review-kind-removed = Удалённый текст
review-kind-moved = Перемещено
review-kind-object = { $what ->
    [figure] Рисунок
    [table] Таблица
    [equation] Уравнение
    [citation] Ссылка
    [math] Формула
    [footnote] Сноска
    [crossref] Перекрёстная ссылка
   *[other] Что-то, что не является текстом
}
review-kind-put-in = { $what }: вставлено
review-kind-taken-out = { $what }: убрано
review-kind-altered = { $what }: изменено
review-element-added = Элемент добавлен
review-element-removed = Элемент удалён
review-element-moved = Элемент перемещён
review-element-heading = Печатается как заголовок
review-element-no-heading = Больше не печатается как заголовок
review-element-excluded = Не включён в документ
review-element-included = Возвращён в документ
review-element-other = Элемент изменён
# Where a change is: the name of the element.
review-in = В «{ $element }»
review-moved-from = Из «{ $element }»
review-untitled = Без названия
review-gone-element = Элемент, которого больше нет
review-was = Как было
review-is = Как стало
review-nothing-there = Ничего
review-someone = Кто-то
review-now-under = Теперь под «{ $element }»
review-was-under = Было под «{ $element }»

## What is done with a change.

review-accept = Принять
review-reject = Отклонить
review-later = Позже
review-previous = Предыдущее
review-reject-cannot = Удалённое из карты или убранный рисунок возвращаются из истории.
review-versions = Его история
review-versions-count = { $count ->
    [one] { $count } версия
    [few] { $count } версии
    [many] { $count } версий
   *[other] { $count } версии
}
review-versions-reading = Чтение его истории…
review-versions-none = Между двумя концами ничего не происходило.
review-version-by = { $who }, { $when }
review-accept-up-to = Принять до этого места
review-use-version = Взять эту версию

## Without the history.

review-no-history = История этого проекта не ведётся
review-no-history-text = Изменения проверяются по истории проекта, которая говорит, кто что изменил и когда. Она ведётся с того момента, как её включили.
review-turn-on = Вести историю
review-turn-on-elsewhere = Это включается вместе с историей проекта.
