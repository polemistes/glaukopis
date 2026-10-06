# The full history of a project, in English.
# See locales/README.md.

history-title = История
history-between = Между картами и историей
history-settings = Настройки истории
history-failed = Не удалось прочитать историю.
history-reading = Чтение истории…

## When it is not kept

history-off = История этого проекта не ведётся.
history-on-word = Каждое изменение сохраняется
history-off-word = Не ведётся
history-off-about = Пока история ведётся, сохраняется каждое изменение — кто его сделал и когда: проект можно посмотреть таким, каким он был в любой момент, и вернуть. Это занимает место, а в совместном проекте показывает остальным, кто что написал и когда.
history-turn-on = Вести историю

## The moments

# Someone whose name the history does not know.
history-someone = Кто-то
history-began = История начинается
# The time a session began and ended.
history-span = { $from } – { $to }
# Older history that was merged, so that moments within it are gone.
history-merged = сохранено укрупнённо
history-added = { $count ->
    [one] +{ $count } знак
    [few] +{ $count } знака
    [many] +{ $count } знаков
   *[other] +{ $count } знака
}
history-removed = { $count ->
    [one] −{ $count } знак
    [few] −{ $count } знака
    [many] −{ $count } знаков
   *[other] −{ $count } знака
}

## The map as it was

history-back = Назад в настоящее
history-as-it-was = Как было { $when }
history-marked = Изменившееся с предыдущего момента отмечено цветом того, кто это изменил.
history-map-not-there = Этой карты тогда не было.
history-added-by = Добавлено: { $name }
history-removed-by = Удалено: { $name }
history-changed-by = Изменено: { $name }
# A cross-reference to a figure, a table or a part, where it is not known what it said.
history-pointer = перекрёстная ссылка
history-name-moment = Назвать этот момент
history-name-placeholder = Как его назвать
history-named = Момент назван «{ $name }».
history-bring-back-element = Вернуть этот элемент, каким он был
history-bring-back-map = Вернуть карту, какой она была
history-brought-back = Возвращено, как было. Отмена возвращает обратно.
history-bring-back-failed = Вернуть не удалось.
history-open-copy = Открыть как отдельный проект
history-copy-name = { $name }, как было { $day }
history-copy-failed = Не удалось создать проект.

## Archives

history-open-archive = Открыть архив…
history-archive-kind = История Glaukopis
history-archive-unread = Не удалось прочитать архив.
history-archive-of = Архив: { $name }
history-archive-close = Закрыть

## Settings

history-keep = Вести историю
history-room = История занимает { $size }.
history-turn-off-title = Перестать вести историю?
history-turn-off-message = Сохранённое удаляется. Сам проект остаётся как есть.
history-turn-off-shared = Сохранённое удаляется — здесь и на компьютерах тех, кому открыт проект. Сам проект остаётся как есть.
history-turn-off = Удалить историю
history-finely = Старая история
history-finely-about = Старые изменения объединяются, чтобы занимать меньше места и читаться быстрее; моменты внутри них после этого уже не различить. Названные моменты и те, с которыми сравнивают проверки изменений, сохраняются.
history-hourly = Объединять каждый час в один спустя
history-weeks = { $count ->
    [one] неделю
    [few] недели
    [many] недель
   *[other] недели
}
history-daily = Объединять каждый день в один спустя
history-months = { $count ->
    [one] месяц
    [few] месяца
    [many] месяцев
   *[other] месяца
}
history-before = Что было раньше
history-before-choose = Выберите момент в истории, чтобы заархивировать или удалить то, что было до него.
history-before-about = Историю до { $when } можно сохранить в файл-архив, чтобы посмотреть позже, или удалить.
history-archive = В архив…
history-delete = Удалить
history-archive-title = Заархивировать историю до { $when }?
history-delete-title = Удалить историю до { $when }?
history-cut-message = Оставшееся начинается с проекта, каким он был тогда.
history-cut-kept = { $count ->
    [one] До него есть { $count } названный или проверенный момент, и здесь его больше нельзя будет посмотреть.
    [few] До него есть { $count } названных или проверенных момента, и здесь их больше нельзя будет посмотреть.
    [many] До него есть { $count } названных или проверенных моментов, и здесь их больше нельзя будет посмотреть.
   *[other] До него есть { $count } названных или проверенных момента, и здесь их больше нельзя будет посмотреть.
}
history-cut-not-here = Историю нельзя отрезать до этого момента.
history-cut-failed = Не удалось отрезать историю.
history-archive-until = до { $when }
history-archived = История до { $when } заархивирована.
history-deleted = История до { $when } удалена.
